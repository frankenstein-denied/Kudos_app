'use client'
import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Send, UserMinus, Users } from 'lucide-react'
import { Avatar } from '@/components/app-shell'
import { useAuth } from '@/lib/auth-context'
import {
  addCommunityMember,
  getFriends,
  getUserProfile,
  removeCommunityMember,
  searchUsersByPrefix,
  sendCommunityMessage,
  sortFriendsFirst,
  subscribeCommunity,
  subscribeCommunityMessages,
  type Community,
  type CommunityMessage,
  type UserProfile,
} from '@/lib/firestore'
import { cn, initialsFrom } from '@/lib/utils'

export default function CommunityPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = use(params)
  const { user, profile } = useAuth()
  const [community, setCommunity] = useState<Community | null>(null)
  const [members, setMembers] = useState<UserProfile[]>([])
  const [messages, setMessages] = useState<CommunityMessage[]>([])
  const [text, setText] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<UserProfile[]>([])
  const [adding, setAdding] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const friendsCache = useRef<UserProfile[] | null>(null)

  useEffect(() => subscribeCommunity(communityId, setCommunity), [communityId])
  useEffect(() => subscribeCommunityMessages(communityId, setMessages), [communityId])

  useEffect(() => {
    if (!community) return
    Promise.all(community.memberIds.map((uid) => getUserProfile(uid))).then((list) =>
      setMembers(list.filter((p): p is UserProfile => Boolean(p))),
    )
  }, [community])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight })
  }, [messages])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !user) return
    const value = text.trim()
    setText('')
    await sendCommunityMessage(communityId, user.uid, profile?.name || 'You', value)
  }

useEffect(() => {
    if (!query.trim() || !user) {
      setResults([])
      setSearching(false)
      return
    }
    let cancelled = false
    setSearching(true)
    const timer = setTimeout(async () => {
      if (!friendsCache.current) friendsCache.current = await getFriends(user.uid)
      const matches = await searchUsersByPrefix(query, user.uid, 8)
      if (cancelled) return
      setResults(sortFriendsFirst(matches, new Set(friendsCache.current.map(f => f.uid))))
      setSearching(false)
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query, user])

  async function addMember(uid: string) {
    setAdding(uid)
    try {
      await addCommunityMember(communityId, uid)
    } finally {
      setAdding(null)
    }
  }

  async function kickMember(uid: string) {
    await removeCommunityMember(communityId, uid)
  }

  if (!community) return <p className="text-center text-sm text-slate-400 dark:text-slate-500">Loading…</p>

  const isMember = Boolean(user && community.memberIds.includes(user.uid))

  return <div className="mx-auto max-w-3xl">
    <Link href="/communities" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600"><ArrowLeft className="size-4" /> All communities</Link>

    {!isMember ? (
      <p className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-400 dark:text-slate-500">You're not a member of this community.</p>
    ) : <>
      <div className="flex h-[calc(100vh-11rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <header className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"><Users className="size-5" /></span>
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{community.name}</p><p className="text-xs text-slate-400 dark:text-slate-500">{members.length} member{members.length === 1 ? '' : 's'}</p></div>
          <button onClick={() => setShowMembers(v => !v)} className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">{showMembers ? 'Hide members' : 'Members'}</button>
        </header>

        {showMembers && <div className="border-b border-slate-100 dark:border-slate-800 p-4">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Type a name or @username to add someone…" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 py-2 pl-8 pr-3 text-sm" />
          </div>
          {query.trim() && <div className="mb-3 flex flex-col gap-1">
            {searching && results.length === 0 && <p className="px-1 py-2 text-xs text-slate-400 dark:text-slate-500">Searching…</p>}
            {!searching && results.length === 0 && <p className="px-1 py-2 text-xs text-slate-400 dark:text-slate-500">No one found.</p>}
            {results.map(r => <div key={r.uid} className="flex items-center gap-2 rounded-xl border border-slate-100 dark:border-slate-800 p-2">
              <Avatar initials={initialsFrom(r.name)} className="size-8" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{r.name}</p><p className="text-xs text-slate-400 dark:text-slate-500">@{r.username}</p></div>
              {community.memberIds.includes(r.uid)
                ? <span className="text-xs text-slate-400 dark:text-slate-500">Already in</span>
                : <button onClick={() => addMember(r.uid)} disabled={adding === r.uid} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{adding === r.uid ? 'Adding…' : 'Add'}</button>}
            </div>)}
          </div>}
          <div className="flex flex-col gap-2">
            {members.map(m => <div key={m.uid} className="flex items-center gap-2">
              <Avatar initials={initialsFrom(m.name)} className="size-8" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{m.name}</p>{m.uid === community.ownerId && <p className="text-[11px] text-blue-600">Creator</p>}</div>
              {members.length > 1 && <button onClick={() => kickMember(m.uid)} aria-label={`Remove ${m.name}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"><UserMinus className="size-4" /></button>}
            </div>)}
          </div>
        </div>}

        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
          {messages.length === 0 && <p className="text-center text-sm text-slate-400 dark:text-slate-500">No messages yet — say hello!</p>}
          {messages.map(m => <div key={m.id} className={cn('flex flex-col', m.senderId === user?.uid ? 'items-end' : 'items-start')}>
            {m.senderId !== user?.uid && <p className="mb-0.5 px-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">{m.senderName}</p>}
            <div className={cn(m.senderId === user?.uid ? 'rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm text-white' : 'max-w-[80%] rounded-2xl rounded-bl-md bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-200')}>{m.text}</div>
          </div>)}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 p-3">
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Message the group..." className="min-w-0 flex-1 rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900" />
          <button aria-label="Send message" className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Send className="size-4" /></button>
        </form>
      </div>
    </>}
  </div>
}
