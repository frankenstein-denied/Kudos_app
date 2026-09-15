'use client'

import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth'
import { auth } from '@/lib/firebase'

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/**
 * Returns true if sign-in completed in place (caller should navigate now),
 * or false if the browser navigated away (redirect flow — completion is
 * handled by getRedirectResult in lib/auth-context.tsx once it returns).
 *
 * Two different failure modes drive this split:
 * - In a regular mobile browser tab, signInWithPopup can silently fall back
 *   to a redirect anyway, and that fallback's sessionStorage handshake is
 *   what breaks in storage-partitioned browsers ("missing initial state").
 *   A direct signInWithRedirect avoids that extra layer.
 * - In an *installed* PWA (standalone display mode), the opposite problem
 *   hits: signInWithRedirect navigates the app's own window away, and the
 *   return trip from Google can land in a separate, non-standalone browser
 *   context instead of back in the installed app's window — so the sign-in
 *   never completes there. signInWithPopup avoids this because it never
 *   navigates the main window away in the first place.
 */
export async function signInWithGoogle(): Promise<boolean> {
  const provider = new GoogleAuthProvider()
  if (isStandalone()) {
    await signInWithPopup(auth, provider)
    return true
  }
  await signInWithRedirect(auth, provider)
  return false
}
