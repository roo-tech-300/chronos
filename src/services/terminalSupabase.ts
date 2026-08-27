import { getSupabase } from '../lib/supabase'
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
    workspaceId: row.workspace_id || 'fut-minna-main',
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

export class TerminalSupabaseService {
  static async fetchKiosks(workspaceId?: string): Promise<TerminalDevice[] | null> {
    try {
      const supabase = getSupabase()
      let query = supabase.from('kiosks').select('*').order('created_at', { ascending: false })
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId)
      }
      const { data, error } = await query
      if (error) {
        if (workspaceId) {
          const fallback = await supabase
            .from('kiosks')
            .select('*')
            .order('created_at', { ascending: false })
          if (!fallback.error && fallback.data) {
            return (fallback.data as KioskRow[]).map(mapRowToTerminal)
          }
        }
        return null
      }
      if (!data) return []
      return (data as KioskRow[]).map(mapRowToTerminal)
    } catch {
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

      // Update heartbeat
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

      if (error || !data) return null
      return mapRowToTerminal(data as KioskRow)
    } catch {
      return null
    }
  }

  static async saveNewKiosk(
    terminal: TerminalDevice
  ): Promise<boolean> {
    try {
      const supabase = getSupabase()
      const row: KioskRow = {
        id: terminal.id,
        workspace_id: terminal.workspaceId,
        name: terminal.name,
        location: terminal.location,
        mode: terminal.mode,
        status: terminal.status,
        department_name: terminal.departmentName,
        pairing_code: terminal.pairingCode,
        pairing_expires_at: terminal.pairingExpiresAt,
        created_at: terminal.createdAt,
      }
      const { error } = await supabase.from('kiosks').upsert(row)
      return !error
    } catch {
      return false
    }
  }

  static async revokeKiosk(terminalId: string): Promise<boolean> {
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
      return !error
    } catch {
      return false
    }
  }

  static async updatePairingCode(
    terminalId: string,
    code: string,
    expiresAt: string
  ): Promise<boolean> {
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('kiosks')
        .update({
          pairing_code: code,
          pairing_expires_at: expiresAt,
        })
        .eq('id', terminalId)
      return !error
    } catch {
      return false
    }
  }
}
