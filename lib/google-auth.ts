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
 * Popup is the default everywhere, including regular (non-PWA) browser
 * tabs: signInWithRedirect depends on Firebase's pending-auth-event state
 * surviving a full top-level navigation out to accounts.google.com and back
 * through the cross-origin *.firebaseapp.com authDomain. That round trip
 * silently loses its state in a growing set of real conditions (browser
 * storage partitioning, a tab opened fresh via a shared link) — when it
 * does, getRedirectResult() resolves to null with no error at all, so the
 * user just lands back on the login page looking like nothing happened.
 * Popup avoids this because it never navigates the top-level tab away.
 *
 * We only fall back to redirect when popup itself can't open/complete
 * (blocked, or genuinely unsupported in this browser) — and never for an
 * installed PWA (standalone display mode), where a redirect's return trip
 * can land outside the app's own window instead of back inside it, so the
 * sign-in never completes there (see git history on this file). In that
 * case we let the popup error surface instead of risking a stuck sign-in.
 */
export async function signInWithGoogle(): Promise<boolean> {
  const provider = new GoogleAuthProvider()
  try {
    await signInWithPopup(auth, provider)
    return true
  } catch (err) {
    const code = (err as { code?: string } | null)?.code
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw err // user closed it themselves — don't silently redirect instead
    }
    if (isStandalone()) throw err
    await signInWithRedirect(auth, provider)
    return false
  }
}
