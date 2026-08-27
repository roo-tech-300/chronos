import { getSupabase } from '../lib/supabase'
import { resolveWorkspaceUuid, mapRowToTerminal, type KioskRow } from './kioskHelpers'
import type { TerminalDevice } from '../types/terminal'

export class TerminalHardwareService {
  /**
   * Checks whether this physical machine is ALREADY registered as an active online terminal
   * in the specified organization/workspace.
   *
   * A single device CAN be registered in separate organizations,
   * but CANNOT be registered to more than one active station within the SAME organization.
   */
  static async findActiveKioskByHardware(
    hardwareId: string,
    workspaceId?: string,
    excludeTerminalId?: string
  ): Promise<TerminalDevice | null> {
    console.group(`[HardwarePolicy] 🛡️ Checking hardware collision for machine: ${hardwareId}`)
    try {
      const supabase = getSupabase()
      const resolvedWsUuid = await resolveWorkspaceUuid(workspaceId)

      let query = supabase
        .from('kiosks')
        .select('*')
        .eq('hardware_id', hardwareId)
        .eq('status', 'online')

      if (resolvedWsUuid) {
        query = query.eq('workspace_id', resolvedWsUuid)
      }

      if (excludeTerminalId) {
        query = query.neq('id', excludeTerminalId)
      }

      const { data, error } = await query

      if (error || !data || data.length === 0) {
        console.log('[HardwarePolicy] ✅ No conflicting station found in this workspace. Device is clear to pair.')
        console.groupEnd()
        return null
      }

      const conflictingRow = data[0] as KioskRow
      console.warn(
        `[HardwarePolicy] 🚫 Hardware collision detected! Machine is already active as "${conflictingRow.name}" (ID: ${conflictingRow.id}) in workspace: ${conflictingRow.workspace_id}`
      )
      console.groupEnd()
      return mapRowToTerminal(conflictingRow)
    } catch (err) {
      console.error('[HardwarePolicy] 💥 Exception checking hardware conflict:', err)
      console.groupEnd()
      return null
    }
  }
}
