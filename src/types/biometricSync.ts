export interface SyncProgressCallback {
  (message: string, current: number, total: number): void
}

export interface LocalBridgeTemplates {
  online: boolean
  files: string[]
  memberIds: string[]
  dataDir?: string
  fileHashes?: Record<string, string>
  error?: string
}

export interface CloudTemplateSummaryItem {
  id: string
  memberId: string
  storagePath: string
  templateHash: string
  targetFilename: string
  createdAt?: string
}

export interface CloudTemplatesSummary {
  workspaceId: string
  totalCount: number
  latestCreatedAt: string | null
  templates: CloudTemplateSummaryItem[]
}

export interface BiometricDifferential {
  inSync: boolean
  diffCount: number
  cloudTotal: number
  localTotal: number
  missingTemplates: CloudTemplateSummaryItem[]
  extraLocalFiles: string[]
}

export interface BiometricSyncResult {
  success: boolean
  totalCloudTemplates: number
  alreadySyncedCount: number
  newlySyncedCount: number
  failedCount: number
  purgedLocalCount?: number
  dataDir?: string
  message: string
  error?: string
}
