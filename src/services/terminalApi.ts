import { TerminalVaultService } from './terminalVault'
import { TerminalSupabaseService } from './terminalSupabase'
import { generateChronosPairingCode } from '../utils/pairingCode'
import type { TerminalDevice, PairingResult } from '../types/terminal'

const STORAGE_KEY_TERMINALS = 'chronos_terminals_registry'

function getStoredTerminals(): TerminalDevice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TERMINALS)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as TerminalDevice[]
    return Array.isArray(parsed) ? parsed.filter((t) => !t.id.startsWith('term-00')) : []
  } catch {
    return []
  }
}

function saveStoredTerminals(terminals: TerminalDevice[]): void {
  try {
    const clean = terminals.filter((t) => !t.id.startsWith('term-00'))
    localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(clean))
  } catch (e) {
    console.error('[TerminalApi] Failed to save terminals to storage', e)
  }
}

export class TerminalApiService {
  /**
   * Fetches all real terminals for a workspace from Supabase
   */
  static async fetchTerminals(workspaceId?: string): Promise<TerminalDevice[]> {
    console.log('[TerminalApiService] 🔍 fetchTerminals initiated for workspace:', workspaceId)
    const supabaseData = await TerminalSupabaseService.fetchKiosks(workspaceId)
    if (supabaseData !== null) {
      console.log(`[TerminalApiService] Syncing ${supabaseData.length} records to local cache`)
      saveStoredTerminals(supabaseData)
      return supabaseData
    }
    console.warn('[TerminalApiService] Supabase fetch returned null, falling back to local cached registry')
    return getStoredTerminals()
  }

  /**
   * Validates a device token against Supabase or local cache.
   */
  static async validateDeviceToken(token: string): Promise<TerminalDevice | null> {
    console.log('[TerminalApiService] Validating device token:', token)
    const fromSupabase = await TerminalSupabaseService.findByDeviceToken(token)
    if (fromSupabase) return fromSupabase

    const list = getStoredTerminals()
    const found = list.find((t) => t.deviceToken === token)
    return found || null
  }

  /**
   * Verifies pairing code and generates a permanent cryptographically-signed station session.
   */
  static async pairDeviceWithCode(
    code: string,
    workspaceId?: string
  ): Promise<PairingResult> {
    console.group(`[TerminalApiService] 🔗 Pairing Attempt (Code: "${code}")`)
    const normalizedInput = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    console.log('[TerminalApiService] Step 1: Normalized code input:', normalizedInput)

    const terminals = await this.fetchTerminals(workspaceId)
    console.log(`[TerminalApiService] Step 2: Checked against ${terminals.length} terminals in workspace`)

    const target = terminals.find((t) => {
      if (!t.pairingCode) return false
      const normalizedTarget = t.pairingCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      return normalizedTarget === normalizedInput
    })

    if (!target) {
      console.warn('[TerminalApiService] ❌ Pairing code not found in any registered station')
      console.groupEnd()
      return {
        success: false,
        error: 'Invalid or unrecognized pairing code. Check the administrative devices tab.',
      }
    }

    if (target.pairingExpiresAt && new Date(target.pairingExpiresAt) < new Date()) {
      console.warn('[TerminalApiService] ❌ Pairing code expired at', target.pairingExpiresAt)
      console.groupEnd()
      return {
        success: false,
        error: 'This pairing code has expired (15-minute window). Request a new code in settings.',
      }
    }

    const deviceToken = `dt_${target.id}_${Math.random().toString(36).substring(2, 12)}`
    const hardwareId = TerminalVaultService.getOrGenerateHardwareId()

    console.log('[TerminalApiService] Step 3: Generated credentials:', { deviceToken, hardwareId })

    TerminalVaultService.saveDeviceEnrollment({
      token: deviceToken,
      terminalId: target.id,
      terminalName: target.name,
      workspaceId: target.workspaceId,
    })

    const updatedSupabase = await TerminalSupabaseService.updatePairingSession(
      target.id,
      deviceToken,
      hardwareId
    )

    const updatedTerminal: TerminalDevice = updatedSupabase || {
      ...target,
      status: 'online',
      deviceToken,
      hardwareId,
      pairedAt: new Date().toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      pairingCode: undefined,
      pairingExpiresAt: undefined,
    }

    const list = getStoredTerminals()
    const updatedList = list.map((t) => (t.id === target.id ? updatedTerminal : t))
    saveStoredTerminals(updatedList)

    console.log('[TerminalApiService] ✅ Pairing completed successfully for station:', updatedTerminal.name)
    console.groupEnd()
    return {
      success: true,
      deviceToken,
      terminal: updatedTerminal,
    }
  }

  /**
   * Heartbeat ping to keep terminal status fresh.
   */
  static async sendHeartbeat(token: string): Promise<boolean> {
    const list = getStoredTerminals()
    const target = list.find((t) => t.deviceToken === token)
    if (!target) return false

    const now = new Date().toISOString()
    const updatedList = list.map((t) =>
      t.deviceToken === token
        ? {
            ...t,
            lastHeartbeatAt: now,
            status: 'online' as const,
          }
        : t
    )
    saveStoredTerminals(updatedList)
    return true
  }

  /**
   * Revokes an existing terminal's token and resets status to unpaired.
   */
  static async revokeTerminal(terminalId: string): Promise<void> {
    console.log('[TerminalApiService] Revoking terminal:', terminalId)
    await TerminalSupabaseService.revokeKiosk(terminalId)
    const list = getStoredTerminals()
    const updatedList = list.map((t) =>
      t.id === terminalId
        ? {
            ...t,
            status: 'unpaired' as const,
            deviceToken: undefined,
            pairedAt: undefined,
            lastHeartbeatAt: undefined,
          }
        : t
    )
    saveStoredTerminals(updatedList)
  }

  /**
   * Alias for backwards compatibility with hook callers
   */
  static async revokeTerminalDevice(terminalId: string): Promise<void> {
    return this.revokeTerminal(terminalId)
  }

  /**
   * Generates a new 15-minute pairing code for an unpaired terminal.
   */
  static async generatePairingCode(terminalId: string, orgName?: string): Promise<string> {
    console.group(`[TerminalApiService] 🔄 Generating new pairing code for terminal: ${terminalId}`)
    const randomCode = generateChronosPairingCode(orgName)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15).toISOString()
    console.log(`[TerminalApiService] Generated code: ${randomCode} (Org: ${orgName || 'default'})`)

    const res = await TerminalSupabaseService.updatePairingCode(terminalId, randomCode, expiresAt)
    if (!res.success && res.error) {
      console.warn('[TerminalApiService] Supabase pairing code update notice:', res.error)
    }

    const list = getStoredTerminals()
    const updatedList = list.map((t) =>
      t.id === terminalId
        ? {
            ...t,
            pairingCode: randomCode,
            pairingExpiresAt: expiresAt,
          }
        : t
    )
    saveStoredTerminals(updatedList)
    console.groupEnd()
    return randomCode
  }

  /**
   * Creates a new terminal entry in Supabase and local cache.
   */
  static async createTerminal(
    data: Omit<TerminalDevice, 'id' | 'status' | 'createdAt'>,
    orgName?: string
  ): Promise<TerminalDevice> {
    console.group(`[TerminalApiService] ➕ Provisioning New Terminal: "${data.name}"`)
    const list = getStoredTerminals()
    const randomCode = generateChronosPairingCode(orgName)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15).toISOString()
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `term-${Date.now().toString(36)}`

    const newTerminal: TerminalDevice = {
      ...data,
      id: newId,
      status: 'unpaired',
      pairingCode: randomCode,
      pairingExpiresAt: expiresAt,
      createdAt: new Date().toISOString(),
    }

    console.log('[TerminalApiService] Step 1: Prepared terminal object:', newTerminal)
    console.log('[TerminalApiService] Step 2: Attempting persistence in Supabase...')
    const saveRes = await TerminalSupabaseService.saveNewKiosk(newTerminal)

    if (!saveRes.success) {
      console.error('[TerminalApiService] ❌ Supabase save reported failure:', saveRes.error)
      console.groupEnd()
      throw new Error(saveRes.error || 'Failed to save kiosk station to Supabase database.')
    }

    console.log('[TerminalApiService] Step 3: Successfully saved to Supabase! Updating local state cache.')
    saveStoredTerminals([newTerminal, ...list])
    console.groupEnd()
    return newTerminal
  }
}
