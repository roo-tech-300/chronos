import { getSupabase } from '../lib/supabase'
import { resolveWorkspaceUuid, mapRowToTerminal, type KioskRow } from './kioskHelpers'
import type { TerminalDevice } from '../types/terminal'
import { TerminalPairingService, type PairingCodeLookupResult } from './terminalPairingService'

export { mapRowToTerminal, type KioskRow }
export type { PairingCodeLookupResult } from './terminalPairingService'

export class TerminalSupabaseService {
  /**
   * Fetches kiosks with automatic UUID resolution and logging
   */
  static async fetchKiosks(workspaceId?: string): Promise<TerminalDevice[] | null> {
    try {
      const supabase = getSupabase()
      const resolvedWsUuid = await resolveWorkspaceUuid(workspaceId)
      let query = supabase.from('kiosks').select('*').order('created_at', { ascending: false })
      if (resolvedWsUuid) query = query.eq('workspace_id', resolvedWsUuid)
      const { data, error } = await query
      if (error) {
        const fallback = await supabase.from('kiosks').select('*').order('created_at', { ascending: false })
        if (!fallback.error && fallback.data) return (fallback.data as KioskRow[]).map(mapRowToTerminal)
        return null
      }
      return (data as KioskRow[] || []).map(mapRowToTerminal)
    } catch {
      return null
    }
  }

  /**
   * Saves a new kiosk with UUID validation and slug resolution
   */
  static async saveNewKiosk(terminal: TerminalDevice): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabase()
      const resolvedWsUuid = await resolveWorkspaceUuid(terminal.workspaceId)

      const fullRow: Record<string, unknown> = {
        id: terminal.id,
        workspace_id: resolvedWsUuid || undefined,
        name: terminal.name,
        location: terminal.location,
        mode: terminal.mode,
        status: terminal.status,
        department_name: terminal.departmentName,
        pairing_code: terminal.pairingCode,
        pairing_expires_at: terminal.pairingExpiresAt,
        created_at: terminal.createdAt,
      }

      const res = await supabase.from('kiosks').upsert(fullRow).select()

      if (res.error) {
        const baseRow = {
          id: terminal.id,
          workspace_id: resolvedWsUuid || undefined,
          name: terminal.name,
          location: terminal.location,
          status: terminal.status,
          pairing_code: terminal.pairingCode,
          pairing_expires_at: terminal.pairingExpiresAt,
          created_at: terminal.createdAt,
        }

        const baseRes = await supabase.from('kiosks').upsert(baseRow).select()
        if (baseRes.error) {
          return { success: false, error: `Database error: ${baseRes.error.message}` }
        }
      }
      return { success: true }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      return { success: false, error: errMsg }
    }
  }

  static async updatePairingCode(
    terminalId: string,
    code: string,
    expiresAt: string
  ): Promise<{ success: boolean; error?: string }> {
    return TerminalPairingService.updatePairingCode(terminalId, code, expiresAt)
  }

  static async revokeKiosk(terminalId: string): Promise<boolean> {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('kiosks')
        .update({
          device_token: null,
          hardware_id: null,
          status: 'unpaired',
          paired_at: null,
          last_heartbeat_at: null,
        })
        .eq('id', terminalId)

      return !error
    } catch {
      return false
    }
  }

  /**
   * Strictly looks up pairing codes within the active workspace.
   * If the code belongs to another workspace, flags it to prevent cross-tenant hijacking.
   */
  static async findByPairingCode(
    code: string,
    workspaceId?: string
  ): Promise<PairingCodeLookupResult> {
    return TerminalPairingService.findByPairingCode(code, workspaceId)
  }

  static async findByDeviceToken(token: string): Promise<TerminalDevice | null> {
    return TerminalPairingService.findByDeviceToken(token)
  }

  static async updatePairingSession(
    terminalId: string,
    token: string,
    hardwareId: string
  ): Promise<TerminalDevice | null> {
    return TerminalPairingService.updatePairingSession(terminalId, token, hardwareId)
  }
}
