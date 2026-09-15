'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, StoryCard } from '@/components/app-shell'
import { useAuth } from '@/lib/auth-context'
import { getOrCreateConversation, getUserProfile, isFriendWith, sendFriendRequest, subscribeUserStories, type Story, type UserProfile } from '@/lib/firestore'
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
  const [requesting, setRequesting] = useState(false)

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

  if (!profile) return <p className="text-center text-sm text-slate-400">Loading profile…</p>

  return <div className="mx-auto max-w-3xl">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <Avatar initials={initialsFrom(profile.name)} className="mx-auto size-20 text-lg" />
      <h1 className="mt-4 text-2xl font-bold">{profile.name}</h1>
      <p className="text-sm text-slate-500">@{profile.username}</p>
      {canView && profile.bio && <p className="mx-auto mt-4 max-w-sm text-sm text-slate-600">{profile.bio}</p>}
      {canView && <div className="mt-5 flex justify-center gap-6 text-sm"><span><strong>{profile.friendsCount}</strong> Friends</span><span><strong>{profile.storiesCount}</strong> Stories</span></div>}
      {user?.uid !== userId && <div className="mt-5 flex flex-col items-center gap-2">
        <div className="flex justify-center gap-2">
          <button onClick={message} disabled={messaging} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{messaging ? 'Opening…' : 'Message'}</button>
          {!canView && <button onClick={async () => { setRequesting(true); if (user) await sendFriendRequest(user.uid, userId); setRequesting(false) }} disabled={requesting} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-50">{requesting ? 'Sending…' : 'Add friend'}</button>}
        </div>
        {messageError && <p className="text-xs text-red-600">{messageError}</p>}
      </div>}
    </section>
    {canView ? (
      <div className="mt-8">
        <h2 className="mb-4 font-semibold">Stories</h2>
        <div className="flex flex-col gap-4">
          {stories.length === 0 && <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">No stories yet.</p>}
          {stories.map(s => <StoryCard key={s.id} story={s} archived />)}
        </div>
      </div>
    ) : (
      <p className="mt-8 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">This profile is only visible to friends.</p>
    )}
  </div>
}
