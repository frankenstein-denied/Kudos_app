'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { ensureUserProfile, getUserProfile, type UserProfile } from '@/lib/firestore'

type AuthContextValue = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(u: User) {
    await ensureUserProfile(u)
    setProfile(await getUserProfile(u.uid))
  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        await loadProfile(u)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        refreshProfile: async () => {
          if (user) setProfile(await getUserProfile(user.uid))
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
