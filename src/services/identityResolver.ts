// Identity resolution entry points shared by the kiosk scan pipeline, dashboards
// and profile pages. Fast path = single RPC round-trip; slow path = legacy chain.
// Both paths enforce workspace membership and never fabricate a name from an id.
import { resolveIdentityViaKioskRpc } from './kioskIdentityRpc'
import { resolveStaffByLegacyChain } from './staffIdentityChain'
import type { ResolvedStaffIdentity } from '../types/identity'

export {
  resolveCurrentAuthIdentity,
  fetchUserIdentity,
  fetchMemberProfilesMap,
  formatRole,
  formatNameFromEmail,
} from './authIdentity'
export type { ResolvedStaffIdentity } from '../types/identity'

/**
 * Resolves a scanned member identifier into a human display identity.
 *
 * 1. `resolve_kiosk_identity` RPC: workspace_members -> auth.users display name
 *    (migration 20260831, one network round-trip, works for session-less kiosks).
 * 2. Legacy fallback chain: workspace_members -> profiles/users -> dev roster.
 * 3. A verified member whose name cannot be resolved is shown neutrally - the raw
 *    member id is NEVER used as a display name.
 */
export async function resolveStaffByMemberId(
  rawMemberId: string,
  expectedWorkspaceId?: string
): Promise<ResolvedStaffIdentity | null> {
  const memberId = (rawMemberId || '').trim()
  if (!memberId) return null

  const viaRpc = await resolveIdentityViaKioskRpc(memberId, expectedWorkspaceId)

  // Authoritative RPC results: a workspace-enforcement verdict or a resolved name.
  if (viaRpc && (!viaRpc.isMemberOfWorkspace || viaRpc.name)) return viaRpc

  // Legacy chain enriches the result (or covers when the migration is pending).
  const viaChain = await resolveStaffByLegacyChain(memberId, expectedWorkspaceId)

  if (viaChain) {
    const rpcVerified = viaRpc && viaRpc.isMemberOfWorkspace ? viaRpc : null
    if (rpcVerified && !viaChain.isMemberOfWorkspace) {
      // RPC verified membership but the chain could not see it (RLS/anon session).
      return {
        ...viaChain,
        found: true,
        isMemberOfWorkspace: true,
        memberId: rpcVerified.memberId,
        userId: rpcVerified.userId ?? viaChain.userId,
        workspaceId: rpcVerified.workspaceId ?? viaChain.workspaceId,
        name: viaChain.name.trim() || 'Verified Staff Member',
      }
    }
    return { ...viaChain, name: viaChain.name.trim() || 'Verified Staff Member' }
  }

  if (viaRpc) return { ...viaRpc, name: viaRpc.name.trim() || 'Verified Staff Member' }
  return null
}
