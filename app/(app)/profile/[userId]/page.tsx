'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, StoryCard } from '@/components/app-shell'
import { useAuth } from '@/lib/auth-context'
import {
  acceptFriendRequest,
  getOrCreateConversation,
  getRelationship,
  getUserProfile,
  isFriendWith,
  sendFriendRequest,
  subscribeUserStories,
  type Relationship,
  type Story,
  type UserProfile,
} from '@/lib/firestore'
import { initialsFrom } from '@/lib/utils'

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [messaging, setMessaging] = useState(false)
  const [messageError, setMessageError] = useState('')
  const [canView, setCanView] = useState(true)
  const [relationship, setRelationship] = useState<Relationship>({ kind: 'none' })
  const [actionPending, setActionPending] = useState(false)

  useEffect(() => {
    getUserProfile(userId).then(setProfile)
  }, [userId])

  useEffect(() => {
    if (!profile || !user) return
    if (profile.profileVisibility !== 'friends' || user.uid === userId) {
      setCanView(true)
      return
    }
    isFriendWith(user.uid, userId).then(setCanView)
  }, [profile, user, userId])

  useEffect(() => {
    if (!user) return
    getRelationship(user.uid, userId).then(setRelationship)
  }, [user, userId])

  useEffect(() => {
    if (!canView) return
    return subscribeUserStories(userId, setStories)
  }, [userId, canView])

  async function message() {
    if (!user) return
    setMessaging(true)
    setMessageError('')
    try {
      const convId = await getOrCreateConversation(user.uid, userId)
      router.push(`/chats/${convId}`)
    } catch {
      setMessageError('Could not open that conversation. Please try again.')
      setMessaging(false)
    }
  }

  async function addFriend() {
    if (!user) return
    setActionPending(true)
    try {
      await sendFriendRequest(user.uid, userId)
      setRelationship({ kind: 'sent' })
    } finally {
      setActionPending(false)
    }
  }

  async function acceptRequest() {
    if (!user || relationship.kind !== 'received') return
    setActionPending(true)
    try {
      await acceptFriendRequest(relationship.requestId, userId, user.uid)
      setRelationship({ kind: 'friends' })
    } finally {
      setActionPending(false)
    }
  }

  if (!profile) return <p className="text-center text-sm text-slate-400 dark:text-slate-500">Loading profile…</p>

  return <div className="mx-auto max-w-3xl">
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-sm">
      <Avatar initials={initialsFrom(profile.name)} className="mx-auto size-20 text-lg" />
      <h1 className="mt-4 text-2xl font-bold">{profile.name}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">@{profile.username}</p>
      {canView && profile.bio && <p className="mx-auto mt-4 max-w-sm text-sm text-slate-600 dark:text-slate-300">{profile.bio}</p>}
      {canView && <div className="mt-5 flex justify-center gap-6 text-sm"><span><strong>{profile.friendsCount}</strong> Friends</span><span><strong>{profile.storiesCount}</strong> Stories</span></div>}
      {relationship.kind !== 'self' && <div className="mt-5 flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={message} disabled={messaging} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{messaging ? 'Opening…' : 'Message'}</button>
          {relationship.kind === 'none' && <button onClick={addFriend} disabled={actionPending} className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold disabled:opacity-50">{actionPending ? 'Sending…' : 'Add friend'}</button>}
          {relationship.kind === 'sent' && <span className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-400 dark:text-slate-500">Request sent</span>}
          {relationship.kind === 'received' && <button onClick={acceptRequest} disabled={actionPending} className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold disabled:opacity-50">{actionPending ? 'Accepting…' : 'Accept request'}</button>}
          {relationship.kind === 'friends' && <span className="rounded-xl border border-emerald-200 dark:border-emerald-900 px-4 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Friends</span>}
        </div>
        {messageError && <p className="text-xs text-red-600 dark:text-red-400">{messageError}</p>}
      </div>}
    </section>
    {canView ? (
      <div className="mt-8">
        <h2 className="mb-4 font-semibold">Stories</h2>
        <div className="flex flex-col gap-4">
          {stories.length === 0 && <p className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-400 dark:text-slate-500">No stories yet.</p>}
          {stories.map(s => <StoryCard key={s.id} story={s} archived />)}
        </div>
      </div>
    ) : (
      <p className="mt-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-400 dark:text-slate-500">This profile is only visible to friends.</p>
    )}
  </div>
}
