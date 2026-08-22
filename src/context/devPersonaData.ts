export type PersonaRole = 'admin' | 'hod'

export interface DepartmentScope {
  id: string
  name: string
  code: string
  lead: string
  subDepartments: string[]
}

export interface DevPersonaContextType {
  role: PersonaRole
  setRole: (role: PersonaRole) => void
  toggleRole: () => void
  currentDepartment: DepartmentScope
}

export const HOD_DEPARTMENT: DepartmentScope = {
  id: 'dept-eng-deeptech',
  name: 'Deep Tech & AI Labs',
  code: 'DTECH-01',
  lead: 'Dr. Robert Chen',
  subDepartments: ['Autonomous Systems', 'Neural Hardware', 'Edge Compute'],
}
