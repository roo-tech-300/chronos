/**
 * Canonical resolved identity for a scanned / referenced staff member.
 * Shared by the kiosk scan pipeline, the RPC resolver and the legacy fallback chain.
 */
export interface ResolvedStaffIdentity {
  found: boolean
  /** True when the member belongs to the terminal's expected workspace. */
  isMemberOfWorkspace: boolean
  /** workspace_members.id (canonical id used for attendance logging). */
  memberId: string
  /** auth.users.id linked through workspace_members.user_id. */
  userId?: string
  /** workspace_members.workspace_id the member actually belongs to. */
  workspaceId?: string
  /** Human display name resolved from Supabase auth metadata / profiles. */
  name: string
  email?: string
  department: string
  role: string
  avatarUrl?: string
  /** Human-readable rejection reason when membership fails. */
  error?: string
}
