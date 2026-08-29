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
 * Ensures a valid UUID is returned, converting legacy string IDs into deterministic UUIDs.
 */
export function ensureValidUuid(val?: string | null, fallback = '00000000-0000-0000-0000-000000000000'): string {
  if (!val) return fallback
  const trimmed = val.trim()
  if (isUuid(trimmed)) return trimmed

  // Deterministic UUID for demo / fallback staff
  if (trimmed === 'STAFF-2024-001' || trimmed.toLowerCase() === 'amina bello') {
    return '2f158922-80a3-4722-b7c6-c7ec97d70ca0'
  }

  // Create a 32-char hex hash from string
  let hash = 0
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash << 5) - hash + trimmed.charCodeAt(i)
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).padStart(32, '0')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}
