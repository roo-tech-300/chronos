import { useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabase } from '../lib/supabase'
import type { PersonaRole } from './devPersonaData'
import type { AuthProfile } from './authTypes'
import { AuthContext } from './authContextDef'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [loading, setLoading] = useState(true)

  function mapUserToProfile(u: User): AuthProfile {
    const meta = (u.user_metadata || {}) as Record<string, string | undefined>
    const role: PersonaRole = (meta.role as PersonaRole) || 'staff'
    return {
      id: u.id,
      email: u.email || '',
      fullName: meta.full_name || meta.name || u.email?.split('@')[0] || 'User',
      avatarUrl: meta.avatar_url || meta.picture,
      role,
      department: meta.department || 'Deep Tech & AI Labs',
      subDepartment: meta.sub_department || 'Neural Hardware',
      organization: meta.organization || 'Natale Identity Labs',
    }
  }

  useEffect(() => {
    const supabase = getSupabase()

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        setProfile(mapUserToProfile(currentSession.user))
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        setProfile(mapUserToProfile(newSession.user))
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string): Promise<{ error: Error | null }> {
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  }

  async function signInWithGoogle(redirectTo?: string): Promise<{ error: Error | null }> {
    const supabase = getSupabase()
    const targetUrl = redirectTo || `${window.location.origin}/workspaces`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: targetUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    return { error: error ? new Error(error.message) : null }
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    role: PersonaRole = 'staff',
    organization?: string
  ): Promise<{ error: Error | null }> {
    const supabase = getSupabase()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          organization: organization || 'Natale Identity Labs',
        },
      },
    })
    return { error: error ? new Error(error.message) : null }
  }

  async function signOut(): Promise<void> {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
