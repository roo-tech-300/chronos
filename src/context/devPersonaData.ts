export type PersonaRole = 'admin' | 'hod' | 'staff'

export interface DepartmentScope {
  id: string
  name: string
  code: string
  lead: string
  subDepartments: string[]
}

export interface StaffPersona {
  name: string
  role: string
  subDepartment: string
  initials: string
  clockInTime: string
}

export interface DevPersonaContextType {
  role: PersonaRole
  setRole: (role: PersonaRole) => void
  toggleRole: () => void
  currentDepartment: DepartmentScope
  currentStaff: StaffPersona
}

export const HOD_DEPARTMENT: DepartmentScope = {
  id: 'dept-eng-deeptech',
  name: 'Deep Tech & AI Labs',
  code: 'DTECH-01',
  lead: 'Dr. Robert Chen',
  subDepartments: ['Autonomous Systems', 'Neural Hardware', 'Edge Compute'],
}

// Regular staff member (not heading a department). Matches the assignee
// used across the departmental task mock data so their "My Day" view is
// populated with realistic, already-existing task records.
export const STAFF_PERSON: StaffPersona = {
  name: 'Marcus Vance',
  role: 'Senior Hardware Tech',
  subDepartment: 'Neural Hardware',
  initials: 'MV',
  clockInTime: '08:12 AM',
}
