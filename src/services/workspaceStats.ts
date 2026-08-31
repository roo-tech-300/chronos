import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'

export interface WorkspaceDashboardStats {
  totalStaff: number
  onlineDevices: number
  todayScans: string | null // null indicates not in database yet (renders as '—')
  occupancyRate: number
}

/**
 * High-performance SQL count aggregator for dashboard metrics.
 * Uses exact head counting on indexed workspace_id keys instead of fetching full row datasets.
 */
export async function getWorkspaceStats(workspaceId: string): Promise<WorkspaceDashboardStats> {
  const supabase = getSupabase()

  try {
    let resolvedId = workspaceId
    if (!isUuid(workspaceId)) {
      const { data } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', workspaceId)
        .maybeSingle()
      if (data?.id) {
        resolvedId = data.id
      } else {
        return {
          totalStaff: 0,
          onlineDevices: 0,
          todayScans: null,
          occupancyRate: 0,
        }
      }
    }

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const [staffCountRes, kioskCountRes, scansCountRes] = await Promise.all([
      // Fast COUNT(*) via Supabase exact head query
      supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', resolvedId),
      // Fast COUNT(*) for kiosks / online devices
      supabase
        .from('kiosks')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', resolvedId),
      // Fast COUNT(*) for today's scans in this workspace
      supabase
        .from('attendance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', resolvedId)
        .gte('scan_timestamp', startOfDay.toISOString()),
    ])

    const totalStaff = staffCountRes.count ?? 0
    const onlineDevices = kioskCountRes.count ?? 0
    const todayScans = (scansCountRes.count ?? 0).toLocaleString()

    return {
      totalStaff,
      onlineDevices,
      todayScans,
      occupancyRate: totalStaff > 0 ? Math.min(100, Math.round(((scansCountRes.count ?? 0) / totalStaff) * 100)) : 0,
    }
  } catch {
    return {
      totalStaff: 0,
      onlineDevices: 0,
      todayScans: null,
      occupancyRate: 0,
    }
  }
}
