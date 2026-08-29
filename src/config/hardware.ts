/**
 * Hardware Node Bridge Configuration
 * Manages endpoints, ports, protocols, and timeout policies for local Futronic FS80H scanner bridge.
 */

export interface HardwareBridgeConfig {
  /** Base URL for the local Node bridge server */
  baseUrl: string
  /** WebSocket URL for continuous stream of biometric scan events */
  wsUrl: string
  /** Port number where the local Node bridge process listens */
  port: number
  /** Health check endpoint path */
  healthPath: string
  /** Manual capture trigger endpoint path */
  capturePath: string
  /** Scanner status query endpoint path */
  statusPath: string
  /** Milliseconds before a network handshake is considered timed out */
  timeoutMs: number
  /** Polling interval (in ms) when WebSocket is unavailable */
  pollIntervalMs: number
  /** Automatic reset delay (in ms) after a scan result is rendered */
  autoResetDelayMs: number
}

const BRIDGE_PORT = 8080
const BRIDGE_HOST = '127.0.0.1'

export const HARDWARE_CONFIG: HardwareBridgeConfig = {
  baseUrl: `http://${BRIDGE_HOST}:${BRIDGE_PORT}`,
  wsUrl: `ws://${BRIDGE_HOST}:${BRIDGE_PORT}/events`,
  port: BRIDGE_PORT,
  healthPath: '/api/scanner/health',
  capturePath: '/api/scanner/capture',
  statusPath: '/api/scanner/status',
  timeoutMs: 3500,
  pollIntervalMs: 1500,
  autoResetDelayMs: 3000,
}

const STORAGE_OVERRIDE_KEY = 'chronos_hardware_bridge_port'

export function getHardwareBridgePort(): number {
  try {
    const saved = localStorage.getItem(STORAGE_OVERRIDE_KEY)
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed) && parsed > 0 && parsed < 65536) return parsed
    }
  } catch {
    // Ignore storage read errors
  }
  return HARDWARE_CONFIG.port
}

export function setHardwareBridgePort(port: number): void {
  try {
    localStorage.setItem(STORAGE_OVERRIDE_KEY, port.toString())
  } catch {
    // Ignore storage write errors
  }
}

export function getResolvedBridgeUrls(): { httpUrl: string; wsUrl: string } {
  const port = getHardwareBridgePort()
  return {
    httpUrl: `http://${BRIDGE_HOST}:${port}`,
    wsUrl: `ws://${BRIDGE_HOST}:${port}/events`,
  }
}
