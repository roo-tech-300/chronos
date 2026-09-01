/**
 * Pure biometric-template helpers for the enrollment pipeline.
 * No I/O and no Supabase access - trivially testable and reusable (AGENTS.md Rule #1).
 */

/** A capture below this many valid minutiae lines cannot score a reliable bozorth3 match. */
export const MIN_MINUTIAE_LINES = 10

/**
 * Computes the real SHA-256 hex digest of the exact template text that is
 * uploaded. Replaces the legacy zero-padded 32-bit string hash so every
 * `template_hash` value is verifiable against the stored object bytes.
 * WebCrypto is available in the Tauri WebView2 and plain browser secure contexts.
 */
export async function computeTemplateSha256(templateText: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('SHA-256 unavailable: enrollment requires a secure context (Tauri WebView2 or HTTPS).')
  }
  const bytes = new TextEncoder().encode(templateText)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Counts valid NIST XYT minutiae lines: 3-4 whitespace-separated integers
 * (X Y Theta [Quality]) per line. Comment lines starting with '#' are ignored.
 */
export function countMinutiaeLines(templateText: string): number {
  if (!templateText) return 0
  return templateText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      if (line.startsWith('#')) return false
      const tokens = line.split(/\s+/).filter(Boolean)
      return (tokens.length === 3 || tokens.length === 4) && tokens.every((token) => /^-?\d+$/.test(token))
    }).length
}

/**
 * A template is enrollable only when it carries enough minutiae for bozorth3 to
 * score a match. This blocks truncated or empty captures (e.g. 64-byte garbage
 * files) from ever reaching Supabase Storage or the biometric_templates table.
 */
export function isValidMinutiaeTemplate(templateText: string): boolean {
  return countMinutiaeLines(templateText) >= MIN_MINUTIAE_LINES
}
