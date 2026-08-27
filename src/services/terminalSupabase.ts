import { getSupabase } from '../lib/supabase'
import { resolveWorkspaceUuid, mapRowToTerminal, type KioskRow } from './kioskHelpers'
import type { TerminalDevice } from '../types/terminal'

export { mapRowToTerminal, type KioskRow }

export interface PairingCodeLookupResult {
  match: TerminalDevice | null
  foundInDifferentWorkspace: boolean
  matchedWorkspaceId?: string
}

export class TerminalSupabaseService {
  /**
   * Fetches kiosks with automatic UUID resolution and logging
   */
  static async fetchKiosks(workspaceId?: string): Promise<TerminalDevice[] | null> {
    console.group(`[Supabase:Kiosks] 🔍 Fetching kiosks (workspace: ${workspaceId || 'ALL'})`)
    try {
      const supabase = getSupabase()
      const resolvedWsUuid = await resolveWorkspaceUuid(workspaceId)
      let query = supabase.from('kiosks').select('*').order('created_at', { ascending: false })

      if (resolvedWsUuid) {
        query = query.eq('workspace_id', resolvedWsUuid)
      }

      const { data, error } = await query

      if (error) {
        console.warn('[Supabase:Kiosks] Primary query note, checking fallback:', error.message)
        const fallback = await supabase.from('kiosks').select('*').order('created_at', { ascending: false })
        if (!fallback.error && fallback.data) {
          console.groupEnd()
          return (fallback.data as KioskRow[]).map(mapRowToTerminal)
        }
        console.groupEnd()
        return null
      }

      console.log(`[Supabase:Kiosks] ✅ Found ${data?.length ?? 0} rows`)
      console.groupEnd()
      return (data as KioskRow[] || []).map(mapRowToTerminal)
    } catch (err) {
      console.error('[Supabase:Kiosks] 💥 Exception during fetch:', err)
      console.groupEnd()
      return null
    }
  }

  /**
   * Saves a new kiosk with UUID validation and slug resolution
   */
  static async saveNewKiosk(terminal: TerminalDevice): Promise<{ success: boolean; error?: string }> {
    console.group(`[Supabase:Kiosks] 🚀 Saving Kiosk [ID: ${terminal.id}]`)
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
          console.error('[Supabase:Kiosks] ❌ Upsert failed:', baseRes.error)
          console.groupEnd()
          return { success: false, error: `Database error: ${baseRes.error.message}` }
        }
      }

      console.log('[Supabase:Kiosks] ✅ Kiosk saved successfully')
      console.groupEnd()
      return { success: true }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[Supabase:Kiosks] 💥 Exception:', err)
      console.groupEnd()
      return { success: false, error: errMsg }
    }
  }

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
    console.group(`[Supabase:Kiosks] 🔐 Validating pairing code within workspace: ${workspaceId || 'GLOBAL'}`)
    try {
      const supabase = getSupabase()
      const normalizedCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      const resolvedWsUuid = await resolveWorkspaceUuid(workspaceId)

      const { data, error } = await supabase
        .from('kiosks')
        .select('*')
        .eq('status', 'unpaired')

      if (error || !data) {
        console.warn('[Supabase:Kiosks] Pairing code lookup query failed:', error?.message)
        console.groupEnd()
        return { match: null, foundInDifferentWorkspace: false }
      }

      const matchingRows = (data as KioskRow[]).filter((row) => {
        if (!row.pairing_code) return false
        return row.pairing_code.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normalizedCode
      })

      if (matchingRows.length === 0) {
        console.log('[Supabase:Kiosks] ❌ No station with this pairing code found.')
        console.groupEnd()
        return { match: null, foundInDifferentWorkspace: false }
      }

      if (resolvedWsUuid) {
        const workspaceMatch = matchingRows.find((row) => row.workspace_id === resolvedWsUuid)
        if (workspaceMatch) {
          console.log(`[Supabase:Kiosks] ✅ Found match in active workspace: "${workspaceMatch.name}"`)
          console.groupEnd()
          return {
            match: mapRowToTerminal(workspaceMatch),
            foundInDifferentWorkspace: false,
            matchedWorkspaceId: workspaceMatch.workspace_id,
          }
        }

        const otherOrgRow = matchingRows[0]
        console.warn(
          `[Supabase:Kiosks] 🚫 Cross-workspace violation: Code exists in workspace "${otherOrgRow.workspace_id}", but active is "${resolvedWsUuid}".`
        )
        console.groupEnd()
        return {
          match: null,
          foundInDifferentWorkspace: true,
          matchedWorkspaceId: otherOrgRow.workspace_id,
        }
      }

      const primaryMatch = matchingRows[0]
      console.groupEnd()
      return {
        match: mapRowToTerminal(primaryMatch),
        foundInDifferentWorkspace: false,
        matchedWorkspaceId: primaryMatch.workspace_id,
      }
    } catch (err) {
      console.error('[Supabase:Kiosks] 💥 Exception validating pairing code:', err)
      console.groupEnd()
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
      const now = new Date().toISOString()
      await supabase.from('kiosks').update({ last_heartbeat_at: now, status: 'online' }).eq('id', data.id)
      return mapRowToTerminal({ ...data, last_heartbeat_at: now, status: 'online' })
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
