/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  type PersonaRole,
  type DevPersonaContextType,
  HOD_DEPARTMENT,
  STAFF_PERSON,
} from './devPersonaData'

export type { PersonaRole, DevPersonaContextType, DepartmentScope } from './devPersonaData'
export { HOD_DEPARTMENT, STAFF_PERSON } from './devPersonaData'

const DevPersonaContext = createContext<DevPersonaContextType | undefined>(undefined)

// Order matters: toggling cycles Admin -> HOD -> Staff -> Admin.
const personaCycle: PersonaRole[] = ['admin', 'hod', 'staff']

export function DevPersonaProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<PersonaRole>('admin')

  function toggleRole() {
    setRole((prev) => personaCycle[(personaCycle.indexOf(prev) + 1) % personaCycle.length])
  }

  return (
    <DevPersonaContext.Provider
      value={{
        role,
        setRole,
        toggleRole,
        currentDepartment: HOD_DEPARTMENT,
        currentStaff: STAFF_PERSON,
      }}
    >
      {children}
    </DevPersonaContext.Provider>
  )
}

export function useDevPersona() {
  const context = useContext(DevPersonaContext)
  if (!context) {
    throw new Error('useDevPersona must be used within a DevPersonaProvider')
  }
  return context
}