import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '../lib/supabase'

export function useRealtimeAttendance(workspaceId?: string) {
  const queryClient = useQueryClient()
  const [channelStatus, setChannelStatus] = useState<string>('connecting')

  useEffect(() => {
    if (!workspaceId) return

    let channel: ReturnType<ReturnType<typeof getSupabase>['channel']> | null = null

    try {
      const supabase = getSupabase()
      channel = supabase
        .channel(`ws_telemetry_${workspaceId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'attendance_logs',
            filter: `workspace_id=eq.${workspaceId}`,
          },
          (payload) => {
            console.log('[Realtime] New attendance log detected:', payload.new?.id)
            queryClient.invalidateQueries({ queryKey: ['attendance-logs'] })
            queryClient.invalidateQueries({ queryKey: ['live-headcount'] })
            queryClient.invalidateQueries({ queryKey: ['live-activity-stream'] })
            queryClient.invalidateQueries({ queryKey: ['today-summary'] })
            queryClient.invalidateQueries({ queryKey: ['recent-live-scans'] })
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kiosks',
            filter: `workspace_id=eq.${workspaceId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] })
            queryClient.invalidateQueries({ queryKey: ['kiosks'] })
          }
        )
        .subscribe((status) => {
          setChannelStatus(status)
        })
    } catch (err) {
      console.warn('[Realtime] Subscription initialization warning:', err)
      setTimeout(() => {
        setChannelStatus('fallback_polling')
      }, 0)
    }

    return () => {
      if (channel) {
        try {
          const supabase = getSupabase()
          supabase.removeChannel(channel)
        } catch {
          // Cleanup error ignored
        }
      }
    }
  }, [workspaceId, queryClient])

  return { channelStatus }
}
