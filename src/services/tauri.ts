/**
 * Tauri Native Boundaries & Environment Safeguards (Rule #7)
 * Isolates desktop-bundled operations and gracefully falls back in web environments.
 */

export interface AppEnvironment {
  isTauri: boolean
  isWindowsApp: boolean
  isWebBrowser: boolean
  platform: 'windows' | 'macos' | 'linux' | 'web'
  appVersion: string
  canBecomeTerminal: boolean
}

const DEV_OVERRIDE_KEY = 'chronos_dev_tauri_override'

/**
 * Detects if the current runtime is inside the Tauri native shell.
 */
export function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  const win = window as unknown as { __TAURI__?: unknown; __TAURI_INTERNALS__?: unknown }
  return Boolean(win.__TAURI__ || win.__TAURI_INTERNALS__)
}

/**
 * Checks if the developer simulation override is active in browser mode.
 */
export function isDevTauriOverrideActive(): boolean {
  try {
    return localStorage.getItem(DEV_OVERRIDE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setDevTauriOverride(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(DEV_OVERRIDE_KEY, 'true')
    } else {
      localStorage.removeItem(DEV_OVERRIDE_KEY)
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Resolves current application runtime environment metadata.
 */
export function getAppEnvironment(): AppEnvironment {
  const isTauri = isTauriEnvironment()
  const devOverride = !isTauri && isDevTauriOverrideActive()
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isWindows = /Windows|Win32|Win64/i.test(userAgent)

  let platform: AppEnvironment['platform'] = 'web'
  if (isTauri) {
    if (isWindows) platform = 'windows'
    else if (/Macintosh|Mac OS/i.test(userAgent)) platform = 'macos'
    else if (/Linux/i.test(userAgent)) platform = 'linux'
  }

  const isWindowsApp = (isTauri && platform === 'windows') || devOverride
  const canBecomeTerminal = isTauri || devOverride

  return {
    isTauri,
    isWindowsApp,
    isWebBrowser: !isTauri,
    platform,
    appVersion: '2.4.0-desktop',
    canBecomeTerminal,
  }
}

/**
 * Safe invocation of Tauri native commands with resilient web fallback (Rule #7).
 */
export async function invokeTauriCommand<T>(
  command: string,
  args?: Record<string, unknown>,
  fallback?: T
): Promise<T> {
  const env = getAppEnvironment()

  if (!env.isTauri) {
    console.info(
      `[TauriService] 🌐 Web environment detected. Skipping native command "${command}". Serving fallback handle.`
    )
    if (fallback !== undefined) return fallback
    throw new Error(
      `Native command "${command}" requires the Chronos Windows Desktop App (Tauri). Running in web browser.`
    )
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke<T>(command, args)
  } catch (err) {
    console.error(`[TauriService] 💥 Native command "${command}" failed:`, err)
    if (fallback !== undefined) return fallback
    throw err
  }
}

/**
 * Native hardware biometric scanner status query
 */
export async function getNativeScannerStatus() {
  return invokeTauriCommand<{
    is_connected: boolean
    device_name: string
    serial_number: string
    driver_version: string
  }>('check_scanner_status', undefined, {
    is_connected: true,
    device_name: 'Futronic FS80H (Simulated)',
    serial_number: 'FS80H-SIM-WEB',
    driver_version: 'v4.2.0-web',
  })
}

/**
 * Native hardware UUID identifier for terminal pairing
 */
export async function getNativeHardwareUUID(): Promise<string> {
  return invokeTauriCommand<string>(
    'read_hardware_uuid',
    undefined,
    'HW-WEB-SIMULATED-UUID'
  )
}
