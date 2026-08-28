/**
 * Static organisational directory backing the departmental Tasks review UI.
 * Mirrors the assignees referenced in tasks-mock.ts so every seeded task
 * resolves to a real person record (these roles take display precedence).
 */
export interface StaffDirectoryEntry {
  /** Full display name. Doubles as the unique key across task records. */
  name: string
  /** Primary role title shown under the person's name. */
  role: string
  /** Sub-unit this person belongs to. */
  subDepartment: string
  /** True when this person heads their sub-department. */
  isLead?: boolean
  /** Which sub-department this lead oversees (leads only). */
  leadsSubDepartment?: string
}

export const STAFF_DIRECTORY: StaffDirectoryEntry[] = [
  {
    name: 'Sarah Jenkins',
    role: 'HOD Autonomous Systems & Operations',
    subDepartment: 'Autonomous Systems',
    isLead: true,
    leadsSubDepartment: 'Autonomous Systems',
  },
  {
    name: 'Elena Rostova',
    role: 'Lead Infrastructure & Edge Architect',
    subDepartment: 'Edge Compute',
    isLead: true,
    leadsSubDepartment: 'Edge Compute',
  },
  {
    name: 'Marcus Vance',
    role: 'Senior Hardware Tech',
    subDepartment: 'Neural Hardware',
  },
  {
    name: 'Devon Miles',
    role: 'Security Systems Analyst',
    subDepartment: 'Autonomous Systems',
  },
]