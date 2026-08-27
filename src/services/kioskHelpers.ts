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
export async function resolveWorkspaceUuid(identifier?: string): Promise<string | null> {
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
