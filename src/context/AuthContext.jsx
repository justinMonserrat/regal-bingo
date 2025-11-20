import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { persistCachedUser, readCachedUser } from './authCache'

const AuthContext = createContext({
  user: null,
  isManager: false,
  loading: true,
  managerResolved: !isSupabaseConfigured,
  supabaseReady: isSupabaseConfigured,
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (isSupabaseConfigured ? readCachedUser() : null))
  const [isManager, setIsManager] = useState(false)
  const [managerResolved, setManagerResolved] = useState(!isSupabaseConfigured)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const finishLoading = () => {
      if (active) setLoading(false)
    }

    const loadManagerFlag = async (userId) => {
      if (!isSupabaseConfigured || !userId) {
        if (active) {
          setIsManager(false)
          setManagerResolved(true)
        }
        return
      }

      if (active) setManagerResolved(false)

      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_manager')
          .eq('id', userId)
          .maybeSingle()

        if (!active) return
        if (error) {
          console.warn('Error checking manager status', error)
          setIsManager(false)
        } else {
          setIsManager(Boolean(data?.is_manager))
        }
      } catch (err) {
        if (!active) return
        console.warn('Unexpected manager lookup error', err)
        setIsManager(false)
      } finally {
        if (active) setManagerResolved(true)
      }
    }

    const applySession = (session) => {
      if (!active) return
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      persistCachedUser(sessionUser)
      if (sessionUser) {
        void loadManagerFlag(sessionUser.id)
      } else {
        setIsManager(false)
        setManagerResolved(true)
      }
    }

    if (!isSupabaseConfigured) {
      setUser(null)
      setIsManager(false)
      persistCachedUser(null)
      setManagerResolved(true)
      finishLoading()
      return undefined
    }

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error fetching session', error)
        }
        applySession(data?.session ?? null)
      } catch (err) {
        console.error('Unexpected session error', err)
        if (active) {
          setUser(null)
          setIsManager(false)
          setManagerResolved(true)
        }
        persistCachedUser(null)
      } finally {
        finishLoading()
      }
    }

    bootstrap()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        applySession(session)
        finishLoading()
      },
    )

    return () => {
      active = false
      subscription?.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isManager,
        loading,
        managerResolved,
        supabaseReady: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}

