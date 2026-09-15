'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Avatar } from '@/components/app-shell'
import { useAuth } from '@/lib/auth-context'
import {
  acceptFriendRequest,
  declineFriendRequest,
  findUserByIdOrUsername,
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
const GENERIC_ERROR = 'Something went wrong. Please try again.'

export default function FriendsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState('Friends')
  const [friends, setFriends] = useState<UserProfile[]>([])
  const [incoming, setIncoming] = useState<FriendRequest[]>([])
  const [sent, setSent] = useState<FriendRequest[]>([])
  const [suggestions, setSuggestions] = useState<UserProfile[]>([])
  const [messaging, setMessaging] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)

  const [pending, setPending] = useState<Set<string>>(new Set())
  const [actionError, setActionError] = useState<Record<string, string>>({})

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null)
  const [searchError, setSearchError] = useState('')

  function withPending(id: string, fn: () => Promise<unknown>) {
    return async () => {
      setPending(p => new Set(p).add(id))
      setActionError(e => { const { [id]: _drop, ...rest } = e; return rest })
      try {
        await fn()
      } catch {
        setActionError(e => ({ ...e, [id]: GENERIC_ERROR }))
      } finally {
        setPending(p => { const next = new Set(p); next.delete(id); return next })
      }
    }
  }

  async function message(otherUid: string) {
    if (!user) return
    setMessaging(otherUid)
    setMessageError(null)
    try {
      const convId = await getOrCreateConversation(user.uid, otherUid)
      router.push(`/chats/${convId}`)
    } catch {
      setMessageError(otherUid)
      setMessaging(null)
    }
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

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setSearchError('')
    setSearchResult(null)
    const result = await findUserByIdOrUsername(query)
    setSearching(false)
    if (!result) {
      setSearchError('No one found with that ID or username.')
      return
    }
    setSearchResult(result)
  }

  function relationshipAction(person: UserProfile) {
    if (!user) return null
    if (person.uid === user.uid) return <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">That&apos;s you</span>
    if (friends.some(f => f.uid === person.uid)) return <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Already friends</span>
    if (sent.some(r => r.toUid === person.uid)) return <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Request sent</span>
    const incomingReq = incoming.find(r => r.fromUid === person.uid)
    if (incomingReq) return <button onClick={withPending(incomingReq.id, () => acceptFriendRequest(incomingReq.id, incomingReq.fromUid, incomingReq.toUid))} disabled={pending.has(incomingReq.id)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending.has(incomingReq.id) ? 'Accepting…' : 'Accept request'}</button>
    return <button onClick={withPending(person.uid, () => sendFriendRequest(user.uid, person.uid))} disabled={pending.has(person.uid)} className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50">{pending.has(person.uid) ? 'Sending…' : 'Add friend'}</button>
  }

  return <div>
    <div className="mb-8"><p className="mb-2 text-sm font-medium text-blue-600">Your circle</p><h1 className="text-3xl font-bold tracking-tight">Friends</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Find your people and keep in touch.</p></div>

    <form onSubmit={search} className="mb-6 flex max-w-xl gap-2">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by unique ID or @username" className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm" />
      <button disabled={searching || !query.trim()} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Search className="size-4" />{searching ? 'Searching…' : 'Search'}</button>
    </form>
    {searchError && <p className="mb-6 max-w-xl text-sm text-red-600 dark:text-red-400">{searchError}</p>}
    {searchResult && <div className="mb-6 max-w-xl rounded-2xl border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/40 p-4">
      <div className="flex items-center gap-3">
        <Avatar initials={initialsFrom(searchResult.name)} />
        <div className="min-w-0 flex-1"><p className="font-semibold">{searchResult.name}</p><p className="text-xs text-slate-400 dark:text-slate-500">@{searchResult.username}</p></div>
        {relationshipAction(searchResult)}
      </div>
      {actionError[searchResult.uid] && <p className="mt-2 text-right text-xs text-red-600 dark:text-red-400">{actionError[searchResult.uid]}</p>}
    </div>}

    <div className="mb-5 flex gap-2 overflow-x-auto">
      {tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700'}`}>{t}{t === 'Requests' && incoming.length > 0 && <span className="ml-2 rounded-full bg-blue-100 dark:bg-blue-900 px-1.5 text-xs text-blue-700 dark:text-blue-300">{incoming.length}</span>}</button>)}
    </div>

    {tab === 'Friends' && <PeopleGrid empty="No friends yet." people={friends.map(f => ({
      uid: f.uid,
      name: f.name,
      error: messaging === null && messageError === f.uid ? 'Could not open chat. Try again.' : undefined,
      action: <button onClick={() => message(f.uid)} disabled={messaging === f.uid} className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50">{messaging === f.uid ? 'Opening…' : 'Message'}</button>,
    }))} />}

    {tab === 'Requests' && <PeopleGrid empty="No pending requests." people={incoming.map(r => ({
      uid: r.id,
      name: r.profile?.name || 'Unknown',
      error: actionError[r.id],
      action: <div className="flex gap-2">
        <button onClick={withPending(r.id, () => acceptFriendRequest(r.id, r.fromUid, r.toUid))} disabled={pending.has(r.id)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending.has(r.id) ? '…' : 'Accept'}</button>
        <button onClick={withPending(r.id, () => declineFriendRequest(r.id))} disabled={pending.has(r.id)} className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50">{pending.has(r.id) ? '…' : 'Decline'}</button>
      </div>,
    }))} />}

    {tab === 'Sent' && <PeopleGrid empty="No pending sent requests." people={sent.map(r => ({
      uid: r.id,
      name: r.profile?.name || 'Unknown',
      error: actionError[r.id],
      action: <button onClick={withPending(r.id, () => declineFriendRequest(r.id))} disabled={pending.has(r.id)} className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50">{pending.has(r.id) ? '…' : 'Cancel'}</button>,
    }))} />}

    {tab === 'Suggestions' && <PeopleGrid empty="No suggestions right now." people={suggestions.map(p => ({
      uid: p.uid,
      name: p.name,
      error: actionError[p.uid],
      action: <button onClick={withPending(p.uid, () => user ? sendFriendRequest(user.uid, p.uid) : Promise.resolve())} disabled={pending.has(p.uid)} className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50">{pending.has(p.uid) ? 'Sending…' : 'Add friend'}</button>,
    }))} />}
  </div>
}

function PeopleGrid({ people, empty }: { people: { uid: string; name: string; action: React.ReactNode; error?: string }[]; empty: string }) {
  if (people.length === 0) return <p className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-400 dark:text-slate-500">{empty}</p>
  return <div className="grid gap-3 sm:grid-cols-2">
    {people.map(p => <div key={p.uid} className="flex flex-col gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center gap-3">
        <Avatar initials={initialsFrom(p.name)} />
        <div className="min-w-0 flex-1"><p className="font-semibold">{p.name}</p></div>
        {p.action}
      </div>
      {p.error && <p className="text-xs text-red-600 dark:text-red-400">{p.error}</p>}
    </div>)}
  </div>
}
