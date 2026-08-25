import type { User, Session } from '@supabase/supabase-js'
import type { PersonaRole } from './devPersonaData'

export interface AuthProfile {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  role: PersonaRole
  department?: string
  subDepartment?: string
  organization?: string
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: AuthProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: Error | null }>
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: PersonaRole,
    organization?: string
  ) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}
