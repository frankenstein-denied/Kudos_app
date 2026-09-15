'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getRedirectResult, onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { ensureUserProfile, getUserProfile, type UserProfile } from '@/lib/firestore'

type AuthContextValue = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  redirectError: string | null
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  redirectError: null,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirectError, setRedirectError] = useState<string | null>(null)

  async function loadProfile(u: User) {
    await ensureUserProfile(u)
    setProfile(await getUserProfile(u.uid))
  }

  useEffect(() => {
    // Google sign-in uses signInWithRedirect (see auth pages) — this
    // consumes the result of that round trip once the browser comes back,
    // and surfaces an error if the redirect itself failed (e.g. storage
    // partitioned in-app browsers) instead of failing silently.
    //
    // getRedirectResult() legitimately resolves to null (not a rejection)
    // whenever there was no pending redirect — which is the case on nearly
    // every page load, for nearly every user. Only show a banner for error
    // codes that actually mean "a redirect sign-in was attempted and
    // failed"; anything else gets logged, not shown, so a misconfiguration
    // here can't alarm every visitor on every page again (as
    // auth/argument-error from a missing popupRedirectResolver did).
    const REDIRECT_FAILURE_CODES = new Set([
      'auth/missing-or-invalid-nonce',
      'auth/network-request-failed',
      'auth/timeout',
      'auth/web-storage-unsupported',
      'auth/account-exists-with-different-credential',
      'auth/credential-already-in-use',
    ])
    getRedirectResult(auth).catch((err) => {
      const code = err?.code as string | undefined
      if (!code || !REDIRECT_FAILURE_CODES.has(code)) {
        console.error('getRedirectResult failed (not shown to user):', err)
        return
      }
      setRedirectError(code === 'auth/missing-or-invalid-nonce'
        ? "Sign-in didn't complete — this browser may be blocking the storage Google sign-in needs. Try opening this link directly in Chrome instead of an in-app browser."
        : 'Could not complete Google sign-in. Please try again.')
    })

    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          await loadProfile(u)
        } catch {
          // A transient Firestore/network failure here (common right after
          // a mobile redirect round-trip) must not leave `loading` stuck
          // true forever — that reads as a permanently blank page.
          setRedirectError('Could not load your profile. Check your connection and reload.')
        }
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
        redirectError,
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
