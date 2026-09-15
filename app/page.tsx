'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth'
import { Heart, Sparkles, MessageCircle, Users, Gift, Star } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { GoogleIcon } from '@/components/google-icon'

const features = [
  { icon: Sparkles, title: '24-hour Stories', desc: 'Share the small wins and honest moments — they fade after a day, so nothing has to be perfect.' },
  { icon: Heart, title: 'Send Kudos', desc: 'A tap of appreciation goes further than you think. Celebrate the people who show up for you.' },
  { icon: MessageCircle, title: 'Real Conversations', desc: 'Chat one-on-one without the noise of a feed chasing your attention.' },
  { icon: Users, title: 'Your Circle', desc: 'Built for close friends, not follower counts. Quality over reach, always.' },
]

export default function LandingPage() {
  const router = useRouter()
  const { user, loading: authLoading, redirectError } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard')
  }, [authLoading, user, router])

  async function handleGoogleSignIn() {
    setError('')
    setLoading(true)
    try {
      // signInWithRedirect, not signInWithPopup: on mobile browsers popup
      // silently falls back to a redirect anyway, and that fallback's
      // sessionStorage handshake is what breaks in storage-partitioned
      // environments ("missing initial state"). A direct redirect avoids
      // that extra layer. Completion is handled in AuthProvider via
      // getRedirectResult once the browser returns here.
      await signInWithRedirect(auth, new GoogleAuthProvider())
    } catch (err) {
      setError('Could not sign in with Google. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7faff] dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 md:px-8">
        <Link href="/">
          <Image src="/icon-192.png" alt="Kudos" width={88} height={88} className="size-[88px]" priority />
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium">
          <Link href="/login" className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100">Log in</Link>
          <Link href="/register" className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 dark:hover:bg-blue-500">
            Sign up
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center px-5 pb-16 pt-10 text-center md:pb-24 md:pt-16">
        <Image src="/landing.png" alt="Kudos — Celebrate. Share. Inspire." width={1024} height={559} priority className="mb-6 h-auto w-full max-w-sm md:max-w-md" />
        <span className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
          <Star className="size-3.5 fill-current" /> A little kindness goes a long way
        </span>
        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Make space for <span className="text-blue-600">good things.</span>
        </h1>
        <p className="mt-6 max-w-xl text-balance text-base leading-7 text-slate-500 dark:text-slate-400 md:text-lg">
          Kudos is where you show up as you are — share a story, celebrate a friend, send a little
          appreciation. No likes to chase, no feed to perform for. Just people, being kind.
        </p>

        <div className="mt-10 w-full max-w-sm">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon className="size-5" />
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>
          {(error || redirectError) && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error || redirectError}</p>}
          <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
            or <Link href="/register" className="font-semibold text-blue-600">create an account</Link> with email
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8 md:pb-28">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600">
                <Icon className="size-5" />
              </span>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-24 text-center md:px-8">
        <div className="rounded-3xl border border-blue-100 dark:border-blue-900 bg-gradient-to-br from-blue-50 dark:from-blue-950 to-white p-10 shadow-sm md:p-14">
          <Gift className="mx-auto size-8 text-blue-600" />
          <p className="mt-5 text-balance text-xl font-semibold leading-9 text-slate-800 dark:text-slate-100 md:text-2xl">
            "You don't need a big moment to make someone's day. Kudos is built on the small ones."
          </p>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-60"
          >
            <GoogleIcon className="size-4" />
            Get started with Google
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} Kudos. Share a little kindness.
      </footer>
    </main>
  )
}
