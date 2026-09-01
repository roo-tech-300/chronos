/**
 * UUID validation helpers (AGENTS.md Rule #5 - strict typing, no placeholders).
 */

/**
 * The all-zero UUID is the schema-wide "no workspace" sentinel. It is
 * syntactically valid, so callers must treat it as absent, never as a real id.
 */
export const NIL_UUID = '00000000-0000-0000-0000-000000000000'

/**
 * Validates if a given string is a valid standard RFC4122 UUID
 */
export function isUuid(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim()) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim())
  )
}

/**
 * Returns true only for a real, non-sentinel workspace UUID. The nil UUID
 * (00000000-...) passes isUuid but always means "no workspace selected".
 */
export function isRealWorkspaceUuid(val?: string | null): val is string {
  const clean = (val ?? '').trim().toLowerCase()
  return clean !== NIL_UUID && isUuid(clean)
}
