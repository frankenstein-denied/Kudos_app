'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteUser, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { useTheme, type ThemeSetting } from '@/lib/use-theme'
import { deleteUserAccountData, updateUserProfile } from '@/lib/firestore'
import { cn } from '@/lib/utils'

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm">
    <span>{label}</span>
    <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-blue-600' : 'bg-slate-200')}>
      <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', checked ? 'left-5' : 'left-0.5')} />
    </span>
  </button>
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [error, setError] = useState('')
  const router = useRouter()
  const { user, profile, refreshProfile } = useAuth()

  const [notifyMessages, setNotifyMessages] = useState(true)
  const [notifyFriendRequests, setNotifyFriendRequests] = useState(true)
  const [notifyReactions, setNotifyReactions] = useState(true)
  const [visibility, setVisibility] = useState<'everyone' | 'friends'>('everyone')

  useEffect(() => {
    if (!profile) return
    setNotifyMessages(profile.notifyMessages)
    setNotifyFriendRequests(profile.notifyFriendRequests)
    setNotifyReactions(profile.notifyReactions)
    setVisibility(profile.profileVisibility)
  }, [profile])

  async function saveNotify(field: 'notifyMessages' | 'notifyFriendRequests' | 'notifyReactions', value: boolean, setLocal: (v: boolean) => void) {
    setLocal(value)
    if (!user) return
    await updateUserProfile(user.uid, { [field]: value })
    await refreshProfile()
  }

  async function saveVisibility(next: 'everyone' | 'friends') {
    setVisibility(next)
    if (!user) return
    await updateUserProfile(user.uid, { profileVisibility: next })
    await refreshProfile()
  }

  async function handleSignOut() {
    await signOut(auth)
    router.push('/')
  }

  async function handleDeleteAccount() {
    if (!user) return
    if (!confirm('Delete your account? This cannot be undone.')) return
    try {
      // Clean up Firestore data first, while the session is still valid —
      // deleteUser() below ends the session immediately on success.
      await deleteUserAccountData(user.uid)
      await deleteUser(user)
      router.push('/')
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      setError(code === 'auth/requires-recent-login'
        ? 'For security, please sign out and back in, then try deleting your account again.'
        : 'Something went wrong deleting your account. Please try again.')
    }
  }

  return <div className="mx-auto max-w-2xl">
    <div className="mb-8"><p className="mb-2 text-sm font-medium text-blue-600">Your preferences</p><h1 className="text-3xl font-bold tracking-tight">Settings</h1><p className="mt-2 text-sm text-slate-500">Make Kudos feel like yours.</p></div>
    <div className="flex flex-col gap-5">

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Appearance</h2>
        <p className="mt-1 text-sm text-slate-500">Choose how the app looks.</p>
        <div className="mt-4 flex gap-2">
          {(['light', 'dark', 'system'] as ThemeSetting[]).map(t => <button key={t} onClick={() => setTheme(t)} className={cn('rounded-lg px-4 py-2 text-sm font-medium capitalize', theme === t ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600')}>{t}</button>)}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Account</h2>
        <p className="mt-1 text-sm text-slate-500">Name, username, email, and password.</p>
        <Link href="/profile" className="mt-4 inline-block rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">Manage account</Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Notifications</h2>
        <p className="mt-1 text-sm text-slate-500">Messages, friend requests, and story reactions.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Toggle checked={notifyMessages} onChange={v => saveNotify('notifyMessages', v, setNotifyMessages)} label="New messages" />
          <Toggle checked={notifyFriendRequests} onChange={v => saveNotify('notifyFriendRequests', v, setNotifyFriendRequests)} label="Friend requests" />
          <Toggle checked={notifyReactions} onChange={v => saveNotify('notifyReactions', v, setNotifyReactions)} label="Story reactions" />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Privacy</h2>
        <p className="mt-1 text-sm text-slate-500">Who can see your profile and stories.</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => saveVisibility('everyone')} className={cn('rounded-lg px-4 py-2 text-sm font-medium', visibility === 'everyone' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600')}>Everyone</button>
          <button onClick={() => saveVisibility('friends')} className={cn('rounded-lg px-4 py-2 text-sm font-medium', visibility === 'friends' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600')}>Friends only</button>
        </div>
      </section>

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
