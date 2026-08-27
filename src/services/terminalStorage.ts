import type { TerminalDevice } from '../types/terminal'

const STORAGE_KEY_TERMINALS = 'chronos_terminals_registry'

export function getStoredTerminals(): TerminalDevice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TERMINALS)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TerminalDevice[]
    return Array.isArray(parsed) ? parsed.filter((t) => !t.id.startsWith('term-00')) : []
  } catch {
    return []
  }
}

export function saveStoredTerminals(terminals: TerminalDevice[]): void {
  try {
    const clean = terminals.filter((t) => !t.id.startsWith('term-00'))
    localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(clean))
  } catch (e) {
    console.error('[TerminalStorage] Failed to save terminals to storage', e)
  }
}
