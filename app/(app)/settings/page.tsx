'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteUser, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'

const sections: [string, string][] = [
  ['Appearance', 'Choose how the app looks.'],
  ['Account', 'Name, username, email, and password.'],
  ['Notifications', 'Messages, friend requests, and story reactions.'],
  ['Privacy', 'Friend request, messaging, and profile visibility.'],
]

export default function SettingsPage() {
  const [theme, setTheme] = useState('Light')
  const [error, setError] = useState('')
  const router = useRouter()
  const { user } = useAuth()

  async function handleSignOut() {
    await signOut(auth)
    router.push('/')
  }

  async function handleDeleteAccount() {
    if (!user) return
    if (!confirm('Delete your account? This cannot be undone.')) return
    try {
      await deleteUser(user)
      router.push('/')
    } catch {
      setError('Please sign out and back in recently, then try deleting your account again.')
    }
  }

  return <div className="mx-auto max-w-2xl">
    <div className="mb-8"><p className="mb-2 text-sm font-medium text-blue-600">Your preferences</p><h1 className="text-3xl font-bold tracking-tight">Settings</h1><p className="mt-2 text-sm text-slate-500">Make Kudos feel like yours.</p></div>
    <div className="flex flex-col gap-5">
      {sections.map(([title, description], i) => <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
        {i === 0
          ? <div className="mt-4 flex gap-2">{['Light', 'Dark', 'System'].map(t => <button key={t} onClick={() => setTheme(t)} className={`rounded-lg px-4 py-2 text-sm font-medium ${theme === t ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600'}`}>{t}</button>)}</div>
          : <button className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">Manage {title.toLowerCase()}</button>}
      </section>)}
      <section className="rounded-2xl border border-red-100 bg-white p-5">
        <h2 className="font-semibold text-red-600">Account actions</h2>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex gap-3">
          <button onClick={handleSignOut} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold">Sign out</button>
          <button onClick={handleDeleteAccount} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600">Delete account</button>
        </div>
      </section>
    </div>
  </div>
}
