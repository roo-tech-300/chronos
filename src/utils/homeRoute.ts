import type { PersonaRole } from '../context/devPersonaData'

// Single source of truth for the role-aware default landing page:
// - Staff (not in charge of a department) land straight on their Daily Workspace.
// - HODs and Admins keep the Dashboard as their primary page and may navigate
//   to the departmental Tasks review on their own.
export function homePathForRole(role: PersonaRole): string {
  return role === 'staff' ? '/tasks/my-tasks' : '/dashboard'
}