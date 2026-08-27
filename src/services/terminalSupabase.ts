import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import type { TerminalDevice, TerminalMode, TerminalStatus } from '../types/terminal'

export interface KioskRow {
  id: string
  workspace_id?: string
  name: string
  location?: string
  mode?: string
  status?: string
  device_token?: string
  hardware_id?: string
  last_ip_address?: string
  last_heartbeat_at?: string
  paired_at?: string
  pairing_code?: string
  pairing_expires_at?: string
  department_name?: string
  created_at?: string
}

export function mapRowToTerminal(row: KioskRow): TerminalDevice {
  return {
    id: row.id,
    workspaceId: row.workspace_id || 'default',
    name: row.name,
    location: row.location || 'Main Building',
    departmentName: row.department_name,
    mode: (row.mode as TerminalMode) || 'entry',
    status: (row.status as TerminalStatus) || 'unpaired',
    deviceToken: row.device_token,
    hardwareId: row.hardware_id,
    lastIpAddress: row.last_ip_address,
    lastHeartbeatAt: row.last_heartbeat_at,
    pairedAt: row.paired_at,
    pairingCode: row.pairing_code,
    pairingExpiresAt: row.pairing_expires_at,
    createdAt: row.created_at || new Date().toISOString(),
  }
}

/**
 * Resolves a workspace identifier (UUID or slug) into a valid Postgres UUID
 */
async function resolveWorkspaceUuid(identifier?: string): Promise<string | null> {
  if (!identifier) return null
  if (isUuid(identifier)) return identifier

  try {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', identifier)
      .maybeSingle()
    return data?.id || null
  } catch {
    return null
  }
}

export class TerminalSupabaseService {
  /**
   * Fetches kiosks with automatic UUID resolution and step-by-step console logging
   */
  static async fetchKiosks(workspaceId?: string): Promise<TerminalDevice[] | null> {
    console.group(`[Supabase:Kiosks] 🔍 Fetching kiosks (workspace: ${workspaceId || 'ALL'})`)
    try {
      const supabase = getSupabase()
      console.log('[Supabase:Kiosks] Step 1: Initialized Supabase client')

      const resolvedWsUuid = await resolveWorkspaceUuid(workspaceId)
      let query = supabase.from('kiosks').select('*').order('created_at', { ascending: false })

      if (resolvedWsUuid) {
        console.log(`[Supabase:Kiosks] Filtering by resolved workspace UUID: ${resolvedWsUuid}`)
        query = query.eq('workspace_id', resolvedWsUuid)
      } else if (workspaceId && !isUuid(workspaceId)) {
        console.log(`[Supabase:Kiosks] Input "${workspaceId}" is a non-UUID slug with no DB match; fetching all active kiosks`)
      }

      console.log('[Supabase:Kiosks] Step 2: Executing SELECT query on table "kiosks"...')
      const { data, error, status, statusText } = await query

      if (error) {
        console.error('[Supabase:Kiosks] ❌ SELECT query failed:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          httpStatus: status,
          statusText,
        })

        console.warn('[Supabase:Kiosks] Attempting fallback fetch without workspace filter...')
        const fallback = await supabase.from('kiosks').select('*').order('created_at', { ascending: false })
        if (!fallback.error && fallback.data) {
          console.log(`[Supabase:Kiosks] ✅ Fallback fetch succeeded (${fallback.data.length} rows)`)
          console.groupEnd()
          return (fallback.data as KioskRow[]).map(mapRowToTerminal)
        }
        console.groupEnd()
        return null
      }

      console.log(`[Supabase:Kiosks] ✅ Fetch succeeded: found ${data?.length ?? 0} rows`, data)
      console.groupEnd()
      return (data as KioskRow[] || []).map(mapRowToTerminal)
    } catch (err: unknown) {
      console.error('[Supabase:Kiosks] 💥 Unexpected exception during fetch:', err)
      console.groupEnd()
      return null
    }
  }

  /**
   * Saves a new kiosk with UUID validation, slug resolution, and full error reporting
   */
  static async saveNewKiosk(terminal: TerminalDevice): Promise<{ success: boolean; error?: string }> {
    console.group(`[Supabase:Kiosks] 🚀 Creating/Saving Kiosk Device [ID: ${terminal.id}]`)
    try {
      const supabase = getSupabase()
      const resolvedWsUuid = await resolveWorkspaceUuid(terminal.workspaceId)

      console.log('[Supabase:Kiosks] Step 1: Validated client and prepared payload', {
        terminalId: terminal.id,
        name: terminal.name,
        workspaceId: terminal.workspaceId,
        resolvedWsUuid,
        code: terminal.pairingCode,
      })

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

      console.log('[Supabase:Kiosks] Step 2: Sending INSERT/UPSERT to Supabase "kiosks" table...', fullRow)
      const res = await supabase.from('kiosks').upsert(fullRow).select()

      if (res.error) {
        console.warn('[Supabase:Kiosks] ⚠️ Primary upsert notice:', res.error.message)

        console.log('[Supabase:Kiosks] Step 3: Retrying with standard baseline columns...')
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
          const errMsg = `Database error (${baseRes.error.code}): ${baseRes.error.message}`
          console.error('[Supabase:Kiosks] ❌ Baseline upsert failed:', baseRes.error)
          console.groupEnd()
          return { success: false, error: errMsg }
        }

        console.log('[Supabase:Kiosks] ✅ Baseline upsert succeeded!', baseRes.data)
        console.groupEnd()
        return { success: true }
      }

      console.log('[Supabase:Kiosks] ✅ Full upsert successfully persisted to Supabase!', res.data)
      console.groupEnd()
      return { success: true }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[Supabase:Kiosks] 💥 Exception during saveNewKiosk:', err)
      console.groupEnd()
      return { success: false, error: errMsg }
    }
  }

  /**
   * Updates pairing code with step logging
   */
  static async updatePairingCode(
    terminalId: string,
    code: string,
    expiresAt: string
  ): Promise<{ success: boolean; error?: string }> {
    console.group(`[Supabase:Kiosks] 🔄 Updating Pairing Code for Terminal [ID: ${terminalId}]`)
    try {
      const supabase = getSupabase()
      console.log(`[Supabase:Kiosks] New Code: ${code} (expires: ${expiresAt})`)

      const { data, error } = await supabase
        .from('kiosks')
        .update({
          pairing_code: code,
          pairing_expires_at: expiresAt,
        })
        .eq('id', terminalId)
        .select()

      if (error) {
        console.error('[Supabase:Kiosks] ❌ Failed to update pairing code:', error.message)
        console.groupEnd()
        return { success: false, error: error.message }
      }

      console.log('[Supabase:Kiosks] ✅ Pairing code updated in database successfully:', data)
      console.groupEnd()
      return { success: true }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[Supabase:Kiosks] 💥 Exception updating pairing code:', err)
      console.groupEnd()
      return { success: false, error: errMsg }
    }
  }

  static async revokeKiosk(terminalId: string): Promise<boolean> {
    console.group(`[Supabase:Kiosks] 🛑 Revoking Terminal [ID: ${terminalId}]`)
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('kiosks')
        .update({
          device_token: null,
          status: 'unpaired',
          paired_at: null,
          last_heartbeat_at: null,
        })
        .eq('id', terminalId)

      if (error) {
        console.error('[Supabase:Kiosks] ❌ Revoke failed:', error.message)
        console.groupEnd()
        return false
      }
      console.log('[Supabase:Kiosks] ✅ Terminal revoked successfully')
      console.groupEnd()
      return true
    } catch (err) {
      console.error('[Supabase:Kiosks] 💥 Exception revoking terminal:', err)
      console.groupEnd()
      return false
    }
  }

  static async findByPairingCode(code: string, workspaceId?: string): Promise<TerminalDevice | null> {
    console.group(`[Supabase:Kiosks] 🔐 Securely validating pairing code`)
    try {
      const supabase = getSupabase()
      const normalizedCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      const resolvedWsUuid = await resolveWorkspaceUuid(workspaceId)
      
      let query = supabase
        .from('kiosks')
        .select('*')
        .eq('status', 'unpaired')

      if (resolvedWsUuid) {
        query = query.eq('workspace_id', resolvedWsUuid)
      }

      const { data, error } = await query
      if (error || !data) {
        console.warn('[Supabase:Kiosks] Pairing code lookup query failed:', error?.message)
        console.groupEnd()
        return null
      }

      const match = (data as KioskRow[]).find((row) => {
        if (!row.pairing_code) return false
        const normalizedDbCode = row.pairing_code.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
        return normalizedDbCode === normalizedCode
      })

      if (!match) {
        console.warn('[Supabase:Kiosks] ❌ No matching unpaired station found for code')
        console.groupEnd()
        return null
      }

      console.log(`[Supabase:Kiosks] ✅ Match found for station: "${match.name}" (ID: ${match.id})`)
      console.groupEnd()
      return mapRowToTerminal(match)
    } catch (err) {
      console.error('[Supabase:Kiosks] 💥 Exception validating pairing code:', err)
      console.groupEnd()
      return null
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
      await supabase
        .from('kiosks')
        .update({ last_heartbeat_at: now, status: 'online' })
        .eq('id', data.id)

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

      if (error || !data) {
        console.warn('[Supabase:Kiosks] Pair session update notice:', error?.message)
        return null
      }
      return mapRowToTerminal(data as KioskRow)
    } catch (err) {
      console.warn('[Supabase:Kiosks] Error updating pair session:', err)
      return null
    }
  }
}
