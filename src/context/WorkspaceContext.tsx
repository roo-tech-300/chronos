import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import type { Workspace } from '../types/workspaces'
import { getWorkspaceById, getWorkspaceStats, type WorkspaceDashboardStats } from '../services/workspaces'
import { WorkspaceContext } from './useWorkspace'

const STORAGE_KEY = 'chronos_active_workspace_id'

const DEFAULT_STATS: WorkspaceDashboardStats = {
  totalStaff: 0,
  onlineDevices: 0,
  todayScans: null,
  occupancyRate: 65,
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { workspaceId: routeWsId } = useParams<{ workspaceId?: string }>()
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [stats, setStats] = useState<WorkspaceDashboardStats>(DEFAULT_STATS)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const activeId = routeWsId || localStorage.getItem(STORAGE_KEY) || undefined

  const loadWorkspaceData = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const [wsResult, statsResult] = await Promise.all([
        getWorkspaceById(id),
        getWorkspaceStats(id),
      ])

      if (wsResult.error || !wsResult.data) {
        setError(wsResult.error?.message || 'Workspace not found')
      } else {
        setCurrentWorkspace(wsResult.data)
        localStorage.setItem(STORAGE_KEY, wsResult.data.id)
      }

      setStats(statsResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    async function initialize() {
      if (activeId) {
        setIsLoading(true)
        setError(null)
        try {
          const [wsResult, statsResult] = await Promise.all([
            getWorkspaceById(activeId),
            getWorkspaceStats(activeId),
          ])

          if (isCancelled) return

          if (wsResult.error || !wsResult.data) {
            setError(wsResult.error?.message || 'Workspace not found')
          } else {
            setCurrentWorkspace(wsResult.data)
            localStorage.setItem(STORAGE_KEY, wsResult.data.id)
          }
          setStats(statsResult)
        } catch (err) {
          if (!isCancelled) {
            setError(err instanceof Error ? err.message : 'Failed to load workspace data')
          }
        } finally {
          if (!isCancelled) {
            setIsLoading(false)
          }
        }
      } else {
        setIsLoading(false)
      }
    }

    initialize()

    return () => {
      isCancelled = true
    }
  }, [activeId])

  const selectWorkspace = useCallback((workspaceOrId: Workspace | string) => {
    if (typeof workspaceOrId === 'string') {
      localStorage.setItem(STORAGE_KEY, workspaceOrId)
      loadWorkspaceData(workspaceOrId)
    } else {
      setCurrentWorkspace(workspaceOrId)
      localStorage.setItem(STORAGE_KEY, workspaceOrId.id)
      loadWorkspaceData(workspaceOrId.id)
    }
  }, [loadWorkspaceData])

  const currentWsId = currentWorkspace?.id

  const refetchStats = useCallback(async () => {
    if (!currentWsId) return
    const statsResult = await getWorkspaceStats(currentWsId)
    setStats(statsResult)
  }, [currentWsId])

  const accentColor = currentWorkspace?.accentColor || '#7c007e'

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        stats,
        isLoading,
        error,
        accentColor,
        selectWorkspace,
        refetchStats,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
