/**
 * Futronic Node Bridge Client Service
 * Interacts with the local Node.js bridge service running on the terminal station machine (default: http://127.0.0.1:8080).
 * Handles health polling, device status checks, biometric capture triggers, and WebSocket subscriptions.
 */

import { HARDWARE_CONFIG, getResolvedBridgeUrls } from '../config/hardware'
import type { ScannerHardwareStatus, BiometricCapturePayload } from '../types/terminal'

export interface BridgeHealthResponse {
  status: 'ok' | 'degraded' | 'error'
  bridgeVersion?: string
  serviceName?: string
  uptimeSeconds?: number
}

export interface RawScannerStatusResponse {
  connected?: boolean
  isConnected?: boolean
  deviceModel?: string
  model?: string
  serialNumber?: string
  driverVersion?: string
  error?: string
}

export interface RawCaptureResponse {
  success: boolean
  templateHash?: string
  hash?: string
  qualityScore?: number
  score?: number
  scannerModel?: string
  capturedAt?: string
  error?: string
}

class FutronicBridgeService {
  private activeWs: WebSocket | null = null
  private eventListeners: Set<(payload: BiometricCapturePayload) => void> = new Set()
  private statusListeners: Set<(status: ScannerHardwareStatus) => void> = new Set()
  private isListeningToWs = false

  /**
   * Helper to perform timeout-safe HTTP requests to the local Node bridge
   */
  private async requestWithTimeout<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null; ok: boolean }> {
    const { httpUrl } = getResolvedBridgeUrls()
    const url = `${httpUrl}${endpoint}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), HARDWARE_CONFIG.timeoutMs)

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      })
      clearTimeout(timer)

      if (!res.ok) {
        return { data: null, error: `Bridge returned status HTTP ${res.status}`, ok: false }
      }

      const json = await res.json()
      return { data: json as T, error: null, ok: true }
    } catch (err: unknown) {
      clearTimeout(timer)
      const msg = err instanceof Error ? err.message : 'Bridge unreachable'
      return { data: null, error: msg, ok: false }
    }
  }

  /**
   * Checks if the Node Bridge process is running and answering health checks
   */
  async checkBridgeHealth(): Promise<{ isOnline: boolean; version?: string; error?: string }> {
    const res = await this.requestWithTimeout<BridgeHealthResponse>(HARDWARE_CONFIG.healthPath)
    if (!res.ok || !res.data) {
      return {
        isOnline: false,
        error: res.error || 'Cannot connect to local Futronic Node Bridge service on 127.0.0.1',
      }
    }

    return {
      isOnline: true,
      version: res.data.bridgeVersion || 'v1.0.0',
    }
  }

  /**
   * Queries the Node Bridge for Futronic FS80H USB scanner state
   */
  async getScannerStatus(): Promise<ScannerHardwareStatus> {
    const res = await this.requestWithTimeout<RawScannerStatusResponse>(HARDWARE_CONFIG.statusPath)
    if (!res.ok || !res.data) {
      return {
        isConnected: false,
        deviceModel: 'Futronic FS80H (Offline)',
        error: res.error || 'Node bridge service offline',
      }
    }

    const data = res.data
    const isConnected = data.connected ?? data.isConnected ?? false

    return {
      isConnected,
      deviceModel: data.deviceModel || data.model || 'Futronic FS80H USB Scanner',
      serialNumber: data.serialNumber,
      driverVersion: data.driverVersion,
      error: isConnected ? undefined : data.error || 'Scanner disconnected or driver uninitialized',
    }
  }

  /**
   * Triggers a synchronous biometric capture on the local scanner
   */
  async triggerCapture(): Promise<{ success: boolean; payload?: BiometricCapturePayload; error?: string }> {
    const res = await this.requestWithTimeout<RawCaptureResponse>(HARDWARE_CONFIG.capturePath, {
      method: 'POST',
    })

    if (!res.ok || !res.data || !res.data.success) {
      return {
        success: false,
        error: res.data?.error || res.error || 'Failed to capture fingerprint from optical sensor',
      }
    }

    const data = res.data
    const templateHash = data.templateHash || data.hash || ''

    if (!templateHash) {
      return {
        success: false,
        error: 'Node bridge returned empty biometric signature',
      }
    }

    const payload: BiometricCapturePayload = {
      templateHash,
      qualityScore: data.qualityScore || data.score || 95,
      scannerModel: data.scannerModel || 'Futronic FS80H',
      capturedAt: data.capturedAt || new Date().toISOString(),
    }

    this.notifyEventListeners(payload)
    return { success: true, payload }
  }

  /**
   * Subscribes to live WebSocket event stream from Node bridge
   */
  connectWebSocket(): void {
    if (this.isListeningToWs && this.activeWs && this.activeWs.readyState === WebSocket.OPEN) {
      return
    }

    const { wsUrl } = getResolvedBridgeUrls()
    try {
      const ws = new WebSocket(wsUrl)
      this.activeWs = ws
      this.isListeningToWs = true

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)
          if (parsed.event === 'finger_placed' || parsed.event === 'scan_completed' || parsed.templateHash) {
            const payload: BiometricCapturePayload = {
              templateHash: parsed.templateHash || parsed.hash,
              qualityScore: parsed.qualityScore || parsed.score || 90,
              scannerModel: parsed.scannerModel || 'Futronic FS80H',
              capturedAt: parsed.capturedAt || new Date().toISOString(),
            }
            this.notifyEventListeners(payload)
          } else if (parsed.event === 'device_status') {
            const status: ScannerHardwareStatus = {
              isConnected: parsed.isConnected ?? true,
              deviceModel: parsed.deviceModel || 'Futronic FS80H',
              serialNumber: parsed.serialNumber,
              driverVersion: parsed.driverVersion,
            }
            this.notifyStatusListeners(status)
          }
        } catch {
          // Ignore unparseable WebSocket messages
        }
      }

      ws.onclose = () => {
        this.isListeningToWs = false
        this.activeWs = null
      }

      ws.onerror = () => {
        this.isListeningToWs = false
        this.activeWs?.close()
      }
    } catch {
      this.isListeningToWs = false
    }
  }

  disconnectWebSocket(): void {
    if (this.activeWs) {
      this.activeWs.close()
      this.activeWs = null
    }
    this.isListeningToWs = false
  }

  onScanEvent(cb: (payload: BiometricCapturePayload) => void): () => void {
    this.eventListeners.add(cb)
    return () => this.eventListeners.delete(cb)
  }

  onStatusEvent(cb: (status: ScannerHardwareStatus) => void): () => void {
    this.statusListeners.add(cb)
    return () => this.statusListeners.delete(cb)
  }

  private notifyEventListeners(payload: BiometricCapturePayload) {
    this.eventListeners.forEach((listener) => {
      try {
        listener(payload)
      } catch (err) {
        console.error('[FutronicBridge] Listener error:', err)
      }
    })
  }

  private notifyStatusListeners(status: ScannerHardwareStatus) {
    this.statusListeners.forEach((listener) => {
      try {
        listener(status)
      } catch (err) {
        console.error('[FutronicBridge] Status listener error:', err)
      }
    })
  }
}

export const futronicBridge = new FutronicBridgeService()
