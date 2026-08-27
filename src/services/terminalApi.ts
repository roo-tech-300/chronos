import { TerminalVaultService } from './terminalVault'
import { TerminalSupabaseService } from './terminalSupabase'
import { TerminalHardwareService } from './terminalHardware'
import { getStoredTerminals, saveStoredTerminals } from './terminalStorage'
import { generateChronosPairingCode } from '../utils/pairingCode'
import type { TerminalDevice, PairingResult } from '../types/terminal'

export class TerminalApiService {
  static async fetchTerminals(workspaceId?: string): Promise<TerminalDevice[]> {
    console.log('[TerminalApiService] 🔍 fetchTerminals initiated for workspace:', workspaceId)
    const supabaseData = await TerminalSupabaseService.fetchKiosks(workspaceId)
    if (supabaseData !== null) {
      saveStoredTerminals(supabaseData)
      return supabaseData
    }
    return getStoredTerminals()
  }

  static async validateDeviceToken(token: string): Promise<TerminalDevice | null> {
    const fromSupabase = await TerminalSupabaseService.findByDeviceToken(token)
    if (fromSupabase) return fromSupabase
    const list = getStoredTerminals()
    return list.find((t) => t.deviceToken === token) || null
  }

  /**
   * Verifies pairing code, strictly enforces organization tenant boundaries,
   * checks hardware uniqueness, and generates the persistent terminal session.
   */
  static async pairDeviceWithCode(
    code: string,
    workspaceId?: string,
    workspaceName?: string
  ): Promise<PairingResult> {
    console.group(`[TerminalApiService] 🔗 Pairing Attempt (Code: "${code}", Org: "${workspaceName || workspaceId || 'Global'}")`)
    const normalizedInput = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase()

    const lookup = await TerminalSupabaseService.findByPairingCode(normalizedInput, workspaceId)

    // 🔒 Strict Multi-Tenant Isolation Check:
    // If the PIN belongs to another organization entirely, reject it explicitly!
    if (lookup.foundInDifferentWorkspace) {
      console.warn('[TerminalApiService] 🚫 Cross-workspace pairing rejected!')
      console.groupEnd()
      const orgLabel = workspaceName ? `"${workspaceName}"` : 'your current workspace'
      return {
        success: false,
        error: `This pairing code belongs to a different organization. It is not valid for ${orgLabel}. Please check your active workspace or request a code from your administrator.`,
      }
    }

    let target: TerminalDevice | null = lookup.match
    if (!target) {
      const list = getStoredTerminals()
      target = list.find((t) => {
        if (!t.pairingCode || t.status !== 'unpaired') return false
        if (workspaceId && t.workspaceId && t.workspaceId !== workspaceId) return false
        return t.pairingCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normalizedInput
      }) || null
    }

    if (!target) {
      console.warn('[TerminalApiService] ❌ Pairing code not found in current workspace')
      console.groupEnd()
      const orgSuffix = workspaceName ? ` in ${workspaceName}` : ''
      return {
        success: false,
        error: `Invalid or unrecognized pairing code${orgSuffix}. Check the administrative devices tab.`,
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

    const hardwareId = TerminalVaultService.getOrGenerateHardwareId()
    const targetWorkspaceId = target.workspaceId || workspaceId

    // 🛡️ Enforce Single Active Terminal per Machine in the SAME Organization
    const conflictingStation = await TerminalHardwareService.findActiveKioskByHardware(
      hardwareId,
      targetWorkspaceId,
      target.id
    )

    if (conflictingStation) {
      console.warn(`[TerminalApiService] 🚫 Machine collision in org: Already active as "${conflictingStation.name}"`)
      console.groupEnd()
      return {
        success: false,
        error: `This physical machine is already active as "${conflictingStation.name}" in this organization. A device cannot be assigned to multiple stations in the same workspace. Please revoke the existing station first.`,
      }
    }

    const deviceToken = `dt_${target.id}_${Math.random().toString(36).substring(2, 12)}`
    console.log('[TerminalApiService] Generated credentials:', { deviceToken, hardwareId })

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
    saveStoredTerminals(list.map((t) => (t.id === target.id ? updatedTerminal : t)))

    console.log('[TerminalApiService] ✅ Pairing completed successfully for station:', updatedTerminal.name)
    console.groupEnd()
    return {
      success: true,
      deviceToken,
      terminal: updatedTerminal,
    }
  }

  static async sendHeartbeat(token: string): Promise<boolean> {
    const list = getStoredTerminals()
    const target = list.find((t) => t.deviceToken === token)
    if (!target) return false

    const now = new Date().toISOString()
    saveStoredTerminals(
      list.map((t) =>
        t.deviceToken === token ? { ...t, lastHeartbeatAt: now, status: 'online' as const } : t
      )
    )
    return true
  }

  static async revokeTerminal(terminalId: string): Promise<void> {
    await TerminalSupabaseService.revokeKiosk(terminalId)
    const list = getStoredTerminals()
    saveStoredTerminals(
      list.map((t) =>
        t.id === terminalId
          ? { ...t, status: 'unpaired' as const, deviceToken: undefined, hardwareId: undefined, pairedAt: undefined, lastHeartbeatAt: undefined }
          : t
      )
    )
  }

  static async revokeTerminalDevice(terminalId: string): Promise<void> {
    return this.revokeTerminal(terminalId)
  }

  static async generatePairingCode(terminalId: string, orgName?: string): Promise<string> {
    const randomCode = generateChronosPairingCode(orgName)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15).toISOString()

    await TerminalSupabaseService.updatePairingCode(terminalId, randomCode, expiresAt)
    const list = getStoredTerminals()
    saveStoredTerminals(
      list.map((t) => (t.id === terminalId ? { ...t, pairingCode: randomCode, pairingExpiresAt: expiresAt } : t))
    )
    return randomCode
  }

  static async createTerminal(
    data: Omit<TerminalDevice, 'id' | 'status' | 'createdAt'>,
    orgName?: string
  ): Promise<TerminalDevice> {
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

    const saveRes = await TerminalSupabaseService.saveNewKiosk(newTerminal)
    if (!saveRes.success) {
      throw new Error(saveRes.error || 'Failed to save kiosk station to Supabase database.')
    }

    saveStoredTerminals([newTerminal, ...list])
    return newTerminal
  }
}
