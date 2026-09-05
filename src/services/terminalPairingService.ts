import { getSupabase } from '../lib/supabase'
import { resolveWorkspaceUuid, mapRowToTerminal, type KioskRow } from './kioskHelpers'
import type { TerminalDevice } from '../types/terminal'

export interface PairingCodeLookupResult {
  match: TerminalDevice | null
  foundInDifferentWorkspace: boolean
  matchedWorkspaceId?: string
}

/**
 * Pairing + device-session lifecycle for kiosk hardware terminals:
 * pairing-code issuance/lookup, device-token auth and session updates.
 */
export class TerminalPairingService {
  static async updatePairingCode(
    terminalId: string,
    code: string,
    expiresAt: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('kiosks')
        .update({ pairing_code: code, pairing_expires_at: expiresAt })
        .eq('id', terminalId)

      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
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
    try {
      const supabase = getSupabase()
      const normalizedCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      const resolvedWsUuid = await resolveWorkspaceUuid(workspaceId)

      const { data, error } = await supabase
        .from('kiosks')
        .select('*')
        .eq('status', 'unpaired')

      if (error || !data) {
        return { match: null, foundInDifferentWorkspace: false }
      }

      const matchingRows = (data as KioskRow[]).filter((row) => {
        if (!row.pairing_code) return false
        return row.pairing_code.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normalizedCode
      })

      if (matchingRows.length === 0) {
        return { match: null, foundInDifferentWorkspace: false }
      }

      if (resolvedWsUuid) {
        const workspaceMatch = matchingRows.find((row) => row.workspace_id === resolvedWsUuid)
        if (workspaceMatch) {
          return {
            match: mapRowToTerminal(workspaceMatch),
            foundInDifferentWorkspace: false,
            matchedWorkspaceId: workspaceMatch.workspace_id,
          }
        }

        const otherOrgRow = matchingRows[0]
        return {
          match: null,
          foundInDifferentWorkspace: true,
          matchedWorkspaceId: otherOrgRow.workspace_id,
        }
      }

      const primaryMatch = matchingRows[0]
      return {
        match: mapRowToTerminal(primaryMatch),
        foundInDifferentWorkspace: false,
        matchedWorkspaceId: primaryMatch.workspace_id,
      }
    } catch {
      return { match: null, foundInDifferentWorkspace: false }
    }
  }

  static async findByDeviceToken(token: string): Promise<TerminalDevice | null> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('kiosks')
        .select('*')
        .eq('device_token', token)
        .maybeSingle()

      if (error || !data) return null

      const now = new Date()
      const lastBeat = data.last_heartbeat_at ? new Date(data.last_heartbeat_at) : null
      const HEARTBEAT_INTERVAL_MS = 25_000

      if (!lastBeat || now.getTime() - lastBeat.getTime() > HEARTBEAT_INTERVAL_MS) {
        const nowIso = now.toISOString()
        await supabase
          .from('kiosks')
          .update({ last_heartbeat_at: nowIso, status: 'online' })
          .eq('id', data.id)
        return mapRowToTerminal({ ...data, last_heartbeat_at: nowIso, status: 'online' })
      }

      return mapRowToTerminal(data)
    } catch {
      return null
    }
  }

  static async updatePairingSession(
    terminalId: string,
    token: string,
    hardwareId: string
  ): Promise<TerminalDevice | null> {
    try {
      const supabase = getSupabase()
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('kiosks')
        .update({
          device_token: token,
          hardware_id: hardwareId,
          status: 'online',
          paired_at: now,
          last_heartbeat_at: now,
          pairing_code: null,
          pairing_expires_at: null,
        })
        .eq('id', terminalId)
        .select()
        .single()

      return (!error && data) ? mapRowToTerminal(data as KioskRow) : null
    } catch {
      return null
    }
  }
}
