'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { GoogleIcon } from '@/components/google-icon'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() })
      router.push('/dashboard')
    } catch {
      setError('Could not create your account. Try a different email or a stronger password.')
      setLoading(false)
    }
  }

  async function google() {
    setError('')
    setLoading(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      router.push('/dashboard')
    } catch {
      setError('Could not sign up with Google.')
      setLoading(false)
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#f7faff] p-5">
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-8 text-center"><h1 className="text-2xl font-bold">Join Kudos</h1><p className="mt-2 text-sm text-slate-500">Make space for good things.</p></div>
      <button onClick={google} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-60">
        <GoogleIcon className="size-5" /> Continue with Google
      </button>
      <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" /></div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
        <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-semibold text-blue-600">Log in</Link></p>
    </div>
  </main>
}
