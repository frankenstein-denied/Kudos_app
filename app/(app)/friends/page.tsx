'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/app-shell'
import { useAuth } from '@/lib/auth-context'
import {
  acceptFriendRequest,
  declineFriendRequest,
  getOrCreateConversation,
  sendFriendRequest,
  subscribeFriends,
  subscribeIncomingRequests,
  subscribeSentRequests,
  suggestFriends,
  type FriendRequest,
  type UserProfile,
} from '@/lib/firestore'
import { initialsFrom } from '@/lib/utils'

const tabs = ['Friends', 'Requests', 'Sent', 'Suggestions']

export default function FriendsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState('Friends')
  const [friends, setFriends] = useState<UserProfile[]>([])
  const [incoming, setIncoming] = useState<FriendRequest[]>([])
  const [sent, setSent] = useState<FriendRequest[]>([])
  const [suggestions, setSuggestions] = useState<UserProfile[]>([])
  const [messaging, setMessaging] = useState<string | null>(null)

  async function message(otherUid: string) {
    if (!user) return
    setMessaging(otherUid)
    const convId = await getOrCreateConversation(user.uid, otherUid)
    router.push(`/chats/${convId}`)
  }

  useEffect(() => {
    if (!user) return
    const unsubs = [
      subscribeFriends(user.uid, setFriends),
      subscribeIncomingRequests(user.uid, setIncoming),
      subscribeSentRequests(user.uid, setSent),
    ]
    return () => unsubs.forEach(u => u())
  }, [user])

  useEffect(() => {
    if (!user || tab !== 'Suggestions') return
    const exclude = new Set([user.uid, ...friends.map(f => f.uid), ...sent.map(r => r.toUid)])
    suggestFriends(user.uid, exclude).then(setSuggestions)
  }, [user, tab, friends, sent])

  return <div>
    <div className="mb-8"><p className="mb-2 text-sm font-medium text-blue-600">Your circle</p><h1 className="text-3xl font-bold tracking-tight">Friends</h1><p className="mt-2 text-sm text-slate-500">Find your people and keep in touch.</p></div>
    <div className="mb-5 flex gap-2 overflow-x-auto">
      {tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>{t}{t === 'Requests' && incoming.length > 0 && <span className="ml-2 rounded-full bg-blue-100 px-1.5 text-xs text-blue-700">{incoming.length}</span>}</button>)}
    </div>

    {tab === 'Friends' && <PeopleGrid empty="No friends yet." people={friends.map(f => ({
      uid: f.uid,
      name: f.name,
      action: <button onClick={() => message(f.uid)} disabled={messaging === f.uid} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50">{messaging === f.uid ? 'Opening…' : 'Message'}</button>,
    }))} />}

    {tab === 'Requests' && <PeopleGrid empty="No pending requests." people={incoming.map(r => ({
      uid: r.id,
      name: r.profile?.name || 'Unknown',
      action: <div className="flex gap-2">
        <button onClick={() => acceptFriendRequest(r.id, r.fromUid, r.toUid)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Accept</button>
        <button onClick={() => declineFriendRequest(r.id)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">Decline</button>
      </div>,
    }))} />}

    {tab === 'Sent' && <PeopleGrid empty="No pending sent requests." people={sent.map(r => ({
      uid: r.id,
      name: r.profile?.name || 'Unknown',
      action: <button onClick={() => declineFriendRequest(r.id)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">Cancel</button>,
    }))} />}

    {tab === 'Suggestions' && <PeopleGrid empty="No suggestions right now." people={suggestions.map(p => ({
      uid: p.uid,
      name: p.name,
      action: <button onClick={() => user && sendFriendRequest(user.uid, p.uid)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Add friend</button>,
    }))} />}
  </div>
}

function PeopleGrid({ people, empty }: { people: { uid: string; name: string; action: React.ReactNode }[]; empty: string }) {
  if (people.length === 0) return <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">{empty}</p>
  return <div className="grid gap-3 sm:grid-cols-2">
    {people.map(p => <div key={p.uid} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <Avatar initials={initialsFrom(p.name)} />
      <div className="min-w-0 flex-1"><p className="font-semibold">{p.name}</p></div>
      {p.action}
    </div>)}
  </div>
}
