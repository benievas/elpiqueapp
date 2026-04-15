import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextType = {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('getSession error:', error.message)
          // Limpiar storage si hay error de sesión inicial (refresh token inválido, etc.)
          if (typeof window !== 'undefined') {
            try {
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('supabase.auth.')) {
                  localStorage.removeItem(key)
                }
              })
            } catch (e) {
              console.warn('Could not clear localStorage:', e)
            }
          }
          if (mounted) {
            setSession(null)
            setUser(null)
          }
          return
        }
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // Limpiar storage si hay error de sesión inicial
        if (typeof window !== 'undefined') {
          try {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('supabase.auth.')) {
                localStorage.removeItem(key)
              }
            })
          } catch (e) {}
        }
        if (mounted) {
          setSession(null)
          setUser(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((event as any) === 'TOKEN_REFRESH_FAILED') {
        console.warn('Token refresh failed - signing out')
        // Clear storage on refresh failure
        if (typeof window !== 'undefined') {
          try {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('supabase.auth.')) {
                localStorage.removeItem(key)
              }
            })
          } catch (e) {}
        }
        supabase.auth.signOut().catch(() => {})
        if (mounted) {
          setSession(null)
          setUser(null)
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setSession(null)
          setUser(null)
        }
      } else {
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
        }
      }
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)