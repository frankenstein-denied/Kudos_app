'use client'
import { useEffect, useState } from 'react'
import { Avatar, StoryCard } from '@/components/app-shell'
import { useAuth } from '@/lib/auth-context'
import { subscribeUserStories, updateUserProfile, type Story } from '@/lib/firestore'
import { initialsFrom } from '@/lib/utils'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [stories, setStories] = useState<Story[]>([])
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    return subscribeUserStories(user.uid, setStories)
  }, [user])

  function startEdit() {
    setName(profile?.name || '')
    setBio(profile?.bio || '')
    setEditing(true)
  }

  async function save() {
    if (!user) return
    setSaving(true)
    try {
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
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" className="min-h-20 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm" />
          <div className="flex justify-center gap-2">
            <button onClick={save} disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => setEditing(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="mt-4 text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm text-slate-500">@{profile.username}</p>
          {profile.bio && <p className="mx-auto mt-4 max-w-sm text-sm text-slate-600">{profile.bio}</p>}
          <div className="mt-5 flex justify-center gap-6 text-sm"><span><strong>{profile.friendsCount}</strong> Friends</span><span><strong>{profile.storiesCount}</strong> Stories</span></div>
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
