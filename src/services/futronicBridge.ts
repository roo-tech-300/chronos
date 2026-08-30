import { HARDWARE_CONFIG, getHardwareBridgePort } from '../config/hardware'
import type { ScannerHardwareStatus, BiometricCapturePayload, NodeBridgeMatch } from '../types/terminal'

export interface BridgeHealthResponse {
  isOnline: boolean
  appName?: string
  dataDir?: string
  minutDir?: string
  port?: number
  error?: string
}

class FutronicBridgeService {
  private scanListeners: ((payload: BiometricCapturePayload) => void)[] = []
  private statusListeners: ((status: ScannerHardwareStatus) => void)[] = []
  private eventSource: EventSource | null = null
  private pollIntervalId: ReturnType<typeof setInterval> | null = null
  private lastProcessedTimestamp: number = Date.now() - 3000
  private isListening = false

  private async requestWithTimeout<T>(
    path: string,
    options: RequestInit = {},
    timeoutMs: number = HARDWARE_CONFIG.timeoutMs
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    const port = getHardwareBridgePort()
    const portsToTry = [port, 8080, 8081, 8082, 8083, 8084, 8085]
    const uniquePorts = [...new Set(portsToTry)]

    for (const p of uniquePorts) {
      const url = `http://127.0.0.1:${p}${path.startsWith('/') ? path : `/${path}`}`
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)

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
          const errText = await res.text().catch(() => '')
          return { ok: false, status: res.status, error: errText || `HTTP ${res.status}` }
        }

        const data = (await res.json()) as T
        return { ok: true, status: res.status, data }
      } catch (err: unknown) {
        clearTimeout(timer)
        if (err instanceof Error && err.name === 'AbortError') {
          return { ok: false, status: 0, error: 'Hardware capture request timed out.' }
        }
      }
    }

    return {
      ok: false,
      status: 0,
      error: `Cannot reach Node Bridge on 127.0.0.1:${port}. Make sure node-bridge/server.js is running.`,
    }
  }

  async checkBridgeHealth(): Promise<BridgeHealthResponse> {
    const res = await this.requestWithTimeout<{ status?: string; app?: string; dataDir?: string; minutDir?: string }>(
      '/api/health',
      {},
      1500
    )
    if (res.ok && res.data) {
      return {
        isOnline: true,
        appName: res.data.app || 'Chronos Node Bridge',
        dataDir: res.data.dataDir,
        minutDir: res.data.minutDir,
        port: getHardwareBridgePort(),
      }
    }
    return {
      isOnline: false,
      error: res.error || 'Bridge is offline',
    }
  }

  async getScannerStatus(): Promise<ScannerHardwareStatus> {
    const res = await this.requestWithTimeout<{
      connected?: boolean
      model?: string
      status?: string
      message?: string
    }>(HARDWARE_CONFIG.statusPath, {}, 2000)

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
   * Triggers single-angle enrollment capture or 1:N Identification
   */
  async triggerCapture(options?: { id?: string; angle?: string }): Promise<{
    success: boolean
    matched?: boolean
    match?: NodeBridgeMatch
    error?: string
    payload?: BiometricCapturePayload
  }> {
    if (options?.id && options?.angle) {
      const res = await this.requestWithTimeout<{ success: boolean; template?: string; message?: string }>(
        '/api/scanner/enroll',
        {
          method: 'POST',
          body: JSON.stringify({ id: options.id, angle: options.angle }),
        },
        12000
      )

      if (!res.ok || !res.data || !res.data.success || !res.data.template) {
        return {
          success: false,
          error: res.data?.message || res.error || 'Enrollment capture failed on Node Bridge.',
        }
      }

      const payload: BiometricCapturePayload = {
        templateHash: res.data.template.slice(0, 64),
        rawTemplate: res.data.template,
        qualityScore: 95,
        scannerModel: 'Futronic FS80H',
        capturedAt: new Date().toISOString(),
      }
      return { success: true, payload }
    }

    // 1:N Identification
    const res = await this.requestWithTimeout<{
      success: boolean
      matched?: boolean
      match?: NodeBridgeMatch
      score?: number
      message?: string
      error?: string
    }>('/api/scanner/identify', { method: 'POST' }, 12000)

    if (!res.ok || !res.data) {
      return {
        success: false,
        error: res.error || 'Failed to communicate with Node Bridge on port 8080.',
      }
    }

    if (!res.data.success || res.data.matched === false) {
      return {
        success: false,
        matched: false,
        error: res.data.message || res.data.error || 'No matching fingerprint found.',
      }
    }

    if (res.data.match) {
      const matchObj: NodeBridgeMatch = {
        id: res.data.match.id || res.data.match.studentId || res.data.match.memberId || '',
        name: res.data.match.name,
        department: res.data.match.department,
        role: res.data.match.role,
        confidence: res.data.match.confidence || res.data.match.score || res.data.score || 98,
      }

      const payload: BiometricCapturePayload = {
        matched: true,
        match: matchObj,
        qualityScore: matchObj.confidence,
        scannerModel: 'Futronic FS80H',
        capturedAt: new Date().toISOString(),
      }

      // Also trigger local event broadcast
      this.dispatchScan(payload)

      return {
        success: true,
        matched: true,
        match: matchObj,
        payload,
      }
    }

    return {
      success: false,
      error: 'Unrecognized response format from Node Bridge.',
    }
  }

  private dispatchScan(payload: BiometricCapturePayload) {
    this.scanListeners.forEach((l) => {
      try {
        l(payload)
      } catch (err) {
        console.error('[FutronicBridge] Listener error:', err)
      }
    })
  }

  /**
   * Starts listening to live scans via Server-Sent Events (SSE) and fast fallback polling
   */
  connectWebSocket() {
    if (this.isListening) return
    this.isListening = true

    const port = getHardwareBridgePort()
    const sseUrl = `http://127.0.0.1:${port}/api/events`

    try {
      if (typeof EventSource !== 'undefined') {
        this.eventSource = new EventSource(sseUrl)
        this.eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data)
            if (parsed.event === 'SCAN' && parsed.payload) {
              this.dispatchScan(parsed.payload)
            }
          } catch {
            // Ignore non-json sse
          }
        }
        this.eventSource.onerror = () => {
          // SSE reconnects automatically or fallback polling catches scans
        }
      }
    } catch {
      // Non-fatal
    }

    // High-frequency polling on /api/scanner/latest-scan for 100% reliable scan delivery
    this.pollIntervalId = setInterval(async () => {
      try {
        const res = await this.requestWithTimeout<{
          success: boolean
          timestamp?: number
          latestScan?: {
            timestamp: number
            matched: boolean
            match?: NodeBridgeMatch
            error?: string
          }
        }>('/api/scanner/latest-scan', {}, 1000)

        if (res.ok && res.data?.latestScan) {
          const scan = res.data.latestScan
          if (scan.timestamp && scan.timestamp > this.lastProcessedTimestamp) {
            this.lastProcessedTimestamp = scan.timestamp
            const matchObj = scan.match
              ? {
                  id: scan.match.id || scan.match.studentId || scan.match.memberId || '',
                  name: scan.match.name,
                  department: scan.match.department,
                  role: scan.match.role,
                  confidence: scan.match.confidence || scan.match.score || 98,
                }
              : undefined

            const payload: BiometricCapturePayload = {
              matched: scan.matched,
              match: matchObj,
              qualityScore: matchObj?.confidence || 95,
              scannerModel: 'Futronic FS80H',
              capturedAt: new Date(scan.timestamp).toISOString(),
              error: scan.error,
            }
            this.dispatchScan(payload)
          }
        }
      } catch {
        // Suppress poll errors
      }
    }, 1200)
  }

  disconnectWebSocket() {
    if (this.eventSource) {
      try {
        this.eventSource.close()
      } catch {
        console.debug('[FutronicBridge] EventSource close handled')
      }
      this.eventSource = null
    }
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId)
      this.pollIntervalId = null
    }
    this.isListening = false
  }

  onScanEvent(listener: (payload: BiometricCapturePayload) => void): () => void {
    this.scanListeners.push(listener)
    return () => {
      this.scanListeners = this.scanListeners.filter((l) => l !== listener)
    }
  }

  onStatusEvent(listener: (status: ScannerHardwareStatus) => void): () => void {
    this.statusListeners.push(listener)
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener)
    }
  }
}

export const futronicBridge = new FutronicBridgeService()
