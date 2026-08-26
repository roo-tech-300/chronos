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

  async function resolveProfile(u: User): Promise<AuthProfile> {
    const meta = (u.user_metadata || {}) as Record<string, string | undefined>
    const role: PersonaRole = (meta.role as PersonaRole) || 'staff'
    let fullName = meta.full_name || meta.name || meta.user_name || ''
    let avatarUrl = meta.avatar_url || meta.picture
    const email = u.email || ''

    // Attempt to query Supabase profiles table for any updated user display details
    try {
      const supabase = getSupabase()
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', u.id)
        .single()

      if (dbProfile) {
        if (dbProfile.full_name) fullName = dbProfile.full_name
        if (dbProfile.avatar_url) avatarUrl = dbProfile.avatar_url
      }
    } catch {
      // Graceful fallback to user metadata
    }

    if (!fullName) {
      fullName = email ? email.split('@')[0] : 'User'
    }

    return {
      id: u.id,
      email,
      fullName,
      avatarUrl,
      role,
      department: meta.department || 'Deep Tech & AI Labs',
      subDepartment: meta.sub_department || 'Neural Hardware',
      organization: meta.organization || 'Natale Identity Labs',
    }
  }

  useEffect(() => {
    const supabase = getSupabase()

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        const p = await resolveProfile(currentSession.user)
        setProfile(p)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        const p = await resolveProfile(newSession.user)
        setProfile(p)
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
