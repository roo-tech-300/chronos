import { HARDWARE_CONFIG, getResolvedBridgeUrls } from '../config/hardware'
import type { ScannerHardwareStatus, BiometricCapturePayload, NodeBridgeMatch } from '../types/terminal'

export interface RawScannerStatusResponse {
  connected?: boolean
  isConnected?: boolean
  deviceModel?: string
  model?: string
  serialNumber?: string
  driverVersion?: string
  error?: string
}

export interface NodeBridgeIdentifyResponse {
  success: boolean
  matched?: boolean
  match?: NodeBridgeMatch
  message?: string
  error?: string
  template?: string
  score?: number
}

class FutronicBridgeService {
  private activeWs: WebSocket | null = null
  private eventListeners: Set<(payload: BiometricCapturePayload) => void> = new Set()
  private statusListeners: Set<(status: ScannerHardwareStatus) => void> = new Set()
  private isListeningToWs = false

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
        return { data: null, error: `Node bridge HTTP ${res.status}`, ok: false }
      }

      const json = await res.json()
      return { data: json as T, error: null, ok: true }
    } catch (err: unknown) {
      clearTimeout(timer)
      const msg = err instanceof Error ? err.message : 'Node bridge unreachable'
      return { data: null, error: msg, ok: false }
    }
  }

  async checkBridgeHealth(): Promise<{ isOnline: boolean; appName?: string; error?: string }> {
    const res = await this.requestWithTimeout<{ ok?: boolean; app?: string }>(HARDWARE_CONFIG.healthPath)
    if (!res.ok || !res.data) {
      return {
        isOnline: false,
        error: res.error || 'Cannot connect to Futronic Node Bridge on 127.0.0.1:8080',
      }
    }

    return {
      isOnline: true,
      appName: res.data.app || 'Futronic Fingerprint Scanner Bridge',
    }
  }

  async getScannerStatus(): Promise<ScannerHardwareStatus> {
    const res = await this.requestWithTimeout<{
      connected?: boolean
      model?: string
      status?: string
      message?: string
    }>(HARDWARE_CONFIG.statusPath)

    if (res.ok && res.data) {
      const isConnected = Boolean(res.data.connected)
      return {
        isConnected,
        deviceModel: res.data.model || 'Futronic FS80H USB Scanner',
        driverVersion: 'v4.2.0',
        serialNumber: isConnected ? 'Device Ready' : 'Disconnected',
        error: isConnected ? undefined : res.data.message || 'No scanner detected by Node Bridge',
      }
    }

    return {
      isConnected: false,
      deviceModel: 'Futronic FS80H (Bridge Offline)',
      error: res.error || 'Node bridge service offline',
    }
  }

  /**
   * Triggers 1:N Identification via Node Bridge (/api/scanner/identify or /api/scanner/capture).
   * Relies 100% on Node Bridge's identification result.
   */
  async triggerCapture(options?: { id?: string; angle?: string }): Promise<{
    success: boolean
    matched?: boolean
    match?: NodeBridgeMatch
    error?: string
    payload?: BiometricCapturePayload
  }> {
    if (options?.id && options?.angle) {
      // Enrollment capture
      const res = await this.requestWithTimeout<{ success: boolean; template?: string; message?: string }>(
        '/api/scanner/enroll',
        {
          method: 'POST',
          body: JSON.stringify({ id: options.id, angle: options.angle }),
        }
      )

      if (!res.ok || !res.data || !res.data.success || !res.data.template) {
        return {
          success: false,
          error: res.data?.message || res.error || 'Enrollment capture failed on Node Bridge.',
        }
      }

      const payload: BiometricCapturePayload = {
        templateHash: res.data.template.slice(0, 64),
        qualityScore: 95,
        scannerModel: 'Futronic FS80H',
        capturedAt: new Date().toISOString(),
      }
      return { success: true, payload }
    }

    // 1:N Identification Request to Node Bridge
    const res = await this.requestWithTimeout<NodeBridgeIdentifyResponse>(
      '/api/scanner/identify',
      {
        method: 'POST',
      }
    )

    if (!res.ok || !res.data) {
      return {
        success: false,
        error: res.error || 'Failed to communicate with Node Bridge on port 8080.',
      }
    }

    // Node bridge explicitly says no match or error
    if (!res.data.success || res.data.matched === false) {
      return {
        success: false,
        matched: false,
        error: res.data.message || res.data.error || 'No matching user found on Node Bridge.',
      }
    }

    // Node bridge says matched user found
    if (res.data.match) {
      const matchObj: NodeBridgeMatch = {
        id: res.data.match.id || res.data.match.studentId || res.data.match.memberId || '',
        name: res.data.match.name,
        department: res.data.match.department,
        role: res.data.match.role,
        confidence: res.data.match.confidence || res.data.score || 98,
      }

      const payload: BiometricCapturePayload = {
        matched: true,
        match: matchObj,
        qualityScore: matchObj.confidence,
        scannerModel: 'Futronic FS80H',
        capturedAt: new Date().toISOString(),
      }

      this.notifyEventListeners(payload)
      return {
        success: true,
        matched: true,
        match: matchObj,
        payload,
      }
    }

    return {
      success: false,
      matched: false,
      error: 'Node bridge returned an empty match.',
    }
  }

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

          // 1. Direct identify/scan match event from Node Bridge
          if (parsed.event === 'identify_result' || parsed.event === 'scan_completed' || parsed.matched !== undefined) {
            const isMatch = Boolean(parsed.matched && (parsed.match || parsed.user))
            const rawMatch = parsed.match || parsed.user

            const match: NodeBridgeMatch | undefined = isMatch && rawMatch ? {
              id: rawMatch.id || rawMatch.memberId || rawMatch.studentId,
              name: rawMatch.name || rawMatch.fullName,
              department: rawMatch.department || rawMatch.dept,
              role: rawMatch.role,
              confidence: rawMatch.confidence || rawMatch.score || parsed.score || 98,
            } : undefined

            const payload: BiometricCapturePayload = {
              event: parsed.event,
              matched: isMatch,
              match,
              status: parsed.status,
              error: parsed.error || parsed.message,
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
          // Ignore invalid JSON from websocket
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
