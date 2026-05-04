"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "../_lib/supabase/client"
import { useRouter } from "next/navigation"
import { ReactNode } from "react"

type AuthContext = {
  user: any | null
  profile: any | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContext>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const authUser = session?.user ?? null
      setUser(authUser)

      if (authUser) {
        try {
          const res = await fetch(`/api/auth/profile?id=${authUser.id}`)
          const data = await res.json()
          setProfile(data)
        } catch (e) {
          console.error("Erro ao carregar perfil do banco:", e)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null
      setUser(authUser)

      if (authUser) {
        try {
          const res = await fetch(`/api/auth/profile?id=${authUser.id}`)
          const data = await res.json()
          setProfile(data)
        } catch (e) {
          console.error("Erro ao carregar perfil do banco:", e)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export default AuthProvider
