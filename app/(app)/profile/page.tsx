'use client'
import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Avatar, StoryCard } from '@/components/app-shell'
import { useAuth } from '@/lib/auth-context'
import { checkUsernameAvailable, subscribeUserStories, updateUserProfile, updateUsername, type Story } from '@/lib/firestore'
import { cn, initialsFrom } from '@/lib/utils'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [stories, setStories] = useState<Story[]>([])
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [copied, setCopied] = useState(false)

  async function copyId() {
    if (!user) return
    try {
      await navigator.clipboard.writeText(user.uid)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  useEffect(() => {
    if (!user) return
    return subscribeUserStories(user.uid, setStories)
  }, [user])

  function startEdit() {
    setName(profile?.name || '')
    setBio(profile?.bio || '')
    setUsername(profile?.username || '')
    setUsernameStatus('idle')
    setSaveError('')
    setEditing(true)
  }

  // Debounced availability check as the user types a new handle.
  useEffect(() => {
    if (!editing || !user || !profile) return
    const normalized = username.trim().toLowerCase().replace(/^@/, '')
    if (!normalized || normalized === profile.username) {
      setUsernameStatus('idle')
      return
    }
    if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
      setUsernameStatus('invalid')
      return
    }
    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      const result = await checkUsernameAvailable(normalized, user.uid)
      setUsernameStatus(result.available ? 'available' : (result.reason ?? 'taken'))
    }, 400)
    return () => clearTimeout(timer)
  }, [username, editing, user, profile])

  async function save() {
    if (!user || !profile) return
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') return
    setSaving(true)
    setSaveError('')
    try {
      const normalized = username.trim().toLowerCase().replace(/^@/, '')
      if (normalized && normalized !== profile.username) {
        const result = await updateUsername(user.uid, normalized, profile.username)
        if (!result.available) {
          setUsernameStatus(result.reason ?? 'taken')
          setSaveError(result.reason === 'invalid' ? "That handle isn't valid." : 'That handle was just taken — try another.')
          return
        }
      }
      await updateUserProfile(user.uid, { name: name.trim(), bio: bio.trim() })
      await refreshProfile()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return null

  return <div className="mx-auto max-w-3xl">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <Avatar initials={initialsFrom(profile.name)} className="mx-auto size-20 text-lg" />
      {editing ? (
        <div className="mx-auto mt-4 flex max-w-sm flex-col gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm" />
          <div>
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5">
              <span className="text-sm text-slate-400">@</span>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" className="w-full text-sm outline-none" />
            </div>
            {usernameStatus !== 'idle' && <p className={cn('mt-1 text-left text-xs', usernameStatus === 'available' && 'text-emerald-600', (usernameStatus === 'taken' || usernameStatus === 'invalid') && 'text-red-600', usernameStatus === 'checking' && 'text-slate-400')}>
              {usernameStatus === 'checking' && 'Checking availability…'}
              {usernameStatus === 'available' && 'Available'}
              {usernameStatus === 'taken' && 'Already taken'}
              {usernameStatus === 'invalid' && '3–20 characters: letters, numbers, underscore'}
            </p>}
          </div>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" className="min-h-20 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm" />
          <div className="flex justify-center gap-2">
            <button onClick={save} disabled={saving || usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking'} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => setEditing(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Cancel</button>
          </div>
          {saveError && <p className="text-xs text-red-600">{saveError}</p>}
        </div>
      ) : (
        <>
          <h1 className="mt-4 text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm text-slate-500">@{profile.username}</p>
          {profile.bio && <p className="mx-auto mt-4 max-w-sm text-sm text-slate-600">{profile.bio}</p>}
          <div className="mt-5 flex justify-center gap-6 text-sm"><span><strong>{profile.friendsCount}</strong> Friends</span><span><strong>{profile.storiesCount}</strong> Stories</span></div>
          <div className="mx-auto mt-5 flex max-w-xs items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-2">
            <span className="min-w-0 flex-1 truncate text-left text-xs text-slate-500">{user?.uid}</span>
            <button onClick={copyId} aria-label="Copy your unique ID" className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              {copied ? <><Check className="size-3.5 text-emerald-500" /> Copied</> : <><Copy className="size-3.5" /> Copy ID</>}
            </button>
          </div>
          <button onClick={startEdit} className="mt-5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Edit profile</button>
        </>
      )}
    </section>
    <div className="mt-8">
      <h2 className="mb-4 font-semibold">Your stories</h2>
      <div className="flex flex-col gap-4">
        {stories.length === 0 && <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">You haven&apos;t shared a story yet.</p>}
        {stories.map(s => <StoryCard key={s.id} story={s} archived />)}
      </div>
    </div>
  </div>
}
