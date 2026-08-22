/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  type PersonaRole,
  type DevPersonaContextType,
  HOD_DEPARTMENT,
} from './devPersonaData'

export type { PersonaRole, DevPersonaContextType, DepartmentScope } from './devPersonaData'
export { HOD_DEPARTMENT } from './devPersonaData'

const DevPersonaContext = createContext<DevPersonaContextType | undefined>(undefined)

export function DevPersonaProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<PersonaRole>('admin')

  function toggleRole() {
    setRole((prev) => (prev === 'admin' ? 'hod' : 'admin'))
  }

  return (
    <DevPersonaContext.Provider
      value={{
        role,
        setRole,
        toggleRole,
        currentDepartment: HOD_DEPARTMENT,
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
