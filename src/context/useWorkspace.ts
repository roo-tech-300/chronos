import { createContext, useContext } from 'react'
import type { Workspace } from '../types/workspaces'
import type { WorkspaceDashboardStats } from '../services/workspaces'

export interface WorkspaceContextValue {
  currentWorkspace: Workspace | null
  stats: WorkspaceDashboardStats
  isLoading: boolean
  error: string | null
  accentColor: string
  selectWorkspace: (workspaceOrId: Workspace | string) => void
  refetchStats: () => Promise<void>
}

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined)

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
