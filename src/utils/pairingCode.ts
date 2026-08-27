/**
 * Generates an OTP pairing code in the format:
 * CH-{first letter}{last letter}-{4 random alphanumeric characters}
 * e.g., for "FUT Minna": "CH-FA-7X9K"
 * e.g., for "Chronos HQ": "CH-CQ-4N8B"
 */
export function generateChronosPairingCode(orgOrWorkspaceName?: string): string {
  const name = (orgOrWorkspaceName || 'Chronos').trim().replace(/[^a-zA-Z0-9]/g, '')
  
  let prefixLetters = 'OS'
  if (name.length >= 2) {
    const first = name.charAt(0).toUpperCase()
    const last = name.charAt(name.length - 1).toUpperCase()
    prefixLetters = `${first}${last}`
  } else if (name.length === 1) {
    prefixLetters = `${name.toUpperCase()}X`
  }

  // 4 random alphanumeric characters (A-Z, 0-9 avoiding ambiguous characters like 0/O, 1/I if desired, standard alphanumeric)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let randomSuffix = ''
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    randomSuffix += chars.charAt(randomIndex)
  }

  return `CH-${prefixLetters}-${randomSuffix}`
}

/**
 * Normalizes input strings entered by the user on the pair screen.
 * Handles formats like:
 * - "CH-FA-7X9K"
 * - "CHFA7X9K"
 * - "FA7X9K"
 * - "CHR-4921" (legacy fallback)
 */
export function normalizePairingCode(input: string): string {
  const clean = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  
  // If user entered 6 characters e.g. "FA7X9K", wrap into CH-FA-7X9K
  if (clean.length === 6 && !clean.startsWith('CH')) {
    return `CH-${clean.slice(0, 2)}-${clean.slice(2)}`
  }

  // If user entered 8 characters starting with CH e.g. "CHFA7X9K"
  if (clean.length === 8 && clean.startsWith('CH')) {
    return `CH-${clean.slice(2, 4)}-${clean.slice(4)}`
  }

  // Legacy CHR-4921 fallback
  if (clean.startsWith('CHR') && clean.length === 7) {
    return `CHR-${clean.slice(3)}`
  }

  return input.trim().toUpperCase()
}
