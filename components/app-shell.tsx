'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Home, Sparkles, MessageCircle, Users, Hash, User, Settings, Menu, X, Moon, Sun, Bell } from 'lucide-react'
import { cn, initialsFrom } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/use-theme'
import { getLastSeen } from '@/lib/unread'
import { MENTION_PATTERN } from '@/lib/mentions'
import type { User as FirebaseUser } from 'firebase/auth'
import {
  REACTION_EMOJIS,
  REPLY_MAX_LENGTH,
  createStory,
  getFriends,
  markNotificationRead,
  reactToStory,
  replyToStory,
  searchUsersByPrefix,
  sortFriendsFirst,
  subscribeConversations,
  subscribeIncomingRequests,
  subscribeNotifications,
  subscribeStories,
  subscribeStoryReplies,
  type AppNotification,
  type Conversation,
  type FriendRequest,
  type Story,
  type StoryReply,
  type UserProfile,
} from '@/lib/firestore'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Stories', href: '/stories', icon: Sparkles },
  { label: 'Chats', href: '/chats', icon: MessageCircle },
  { label: 'Communities', href: '/communities', icon: Hash },
  { label: 'Friends', href: '/friends', icon: Users },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-xs font-bold text-blue-700 dark:text-blue-300', className)}>{initials}</div>
}

const NOTIFICATION_ICON = '/icon-192.png'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { user, profile } = useAuth()
  const { theme, toggle } = useTheme()
  const [notifOpen, setNotifOpen] = useState(false)
  const [incoming, setIncoming] = useState<FriendRequest[]>([])
  const [latestStory, setLatestStory] = useState<Story | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const seenNotifIds = useRef<Set<string> | null>(null)
  const name = profile?.name || 'You'
  const username = profile?.username ? `@${profile.username}` : ''
  const initials = initialsFrom(name)

  useEffect(() => {
    if (!user) return
    const unsubs = [
      subscribeIncomingRequests(user.uid, setIncoming),
      subscribeStories(stories => setLatestStory(stories[0] ?? null)),
      subscribeConversations(user.uid, setConversations),
      subscribeNotifications(user.uid, setNotifications),
    ]
    return () => unsubs.forEach(u => u())
  }, [user])

  // Fire an actual OS/browser notification for anything new and unread —
  // "new" meaning not present the previous time this ran, so it only fires
  // once per notification and never replays the whole backlog on mount.
  useEffect(() => {
    const isFirstRun = seenNotifIds.current === null
    const prevIds = seenNotifIds.current ?? new Set<string>()
    seenNotifIds.current = new Set(notifications.map(n => n.id))
    if (isFirstRun) return
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    if (document.visibilityState === 'visible') return
    for (const n of notifications) {
      if (n.read || prevIds.has(n.id)) continue
      const title = n.type === 'message' ? `${n.actorName} sent you a message`
        : n.type === 'mention' ? `${n.actorName} mentioned you`
        : `${n.actorName} replied to your story`
      try {
        const notif = new Notification(title, { body: n.text, icon: NOTIFICATION_ICON, tag: n.id })
        notif.onclick = () => { window.focus(); router.push(n.link) }
      } catch {}
    }
  }, [notifications, router])

  async function openNotification(n: AppNotification) {
    setNotifOpen(false)
    if (!n.read) await markNotificationRead(n.id)
    router.push(n.link)
  }

  const unreadNotifCount = notifications.filter(n => !n.read).length

  const badges = {
    '/stories': Boolean(latestStory?.createdAt && latestStory.createdAt.toMillis() > getLastSeen('stories')),
    '/chats': conversations.some(c => c.lastMessageSenderId && c.lastMessageSenderId !== user?.uid && (c.updatedAt?.toMillis() ?? 0) > getLastSeen(`chats:${c.id}`)),
    '/friends': incoming.length > 0,
  } as Record<string, boolean>

  return <div className="min-h-screen bg-[#f7faff] dark:bg-slate-950 text-slate-900 dark:text-slate-50">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-6 lg:flex">
      <Link href="/dashboard" className="mb-10 flex items-center px-2"><Image src="/icon-192.png" alt="Kudos" width={88} height={88} className="size-[88px]" /></Link>
      <Nav pathname={pathname} onNavigate={close} badges={badges} />
      <Link href="/profile" className="mt-auto flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5"><Avatar initials={initials} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{name}</p><p className="text-xs text-slate-400 dark:text-slate-500">{username}</p></div></Link>
    </aside>
    {open && <button aria-label="Close navigation" onClick={close} className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" />}
    <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-white dark:bg-slate-900 px-5 py-6 shadow-xl transition-transform lg:hidden', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="mb-8 flex items-center justify-between"><Link href="/dashboard" onClick={close}><Image src="/icon-192.png" alt="Kudos" width={88} height={88} className="size-[88px]" /></Link><button aria-label="Close menu" onClick={close} className="rounded-lg p-2 text-slate-400 dark:text-slate-500"><X className="size-5" /></button></div><Nav pathname={pathname} onNavigate={close} badges={badges} />
    </aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-5 backdrop-blur md:px-8"><button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden"><Menu className="size-5" /></button><div className="hidden text-sm font-medium text-slate-500 dark:text-slate-400 lg:block">Make space for good things.</div><div className="ml-auto flex items-center gap-2">
      <div className="relative">
        <button aria-label="Notifications" onClick={() => setNotifOpen(o => !o)} className="relative rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"><Bell className="size-5" />{(incoming.length > 0 || unreadNotifCount > 0) && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-blue-600" />}</button>
        {notifOpen && <div className="absolute right-0 top-full z-30 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-lg">
          {incoming.length === 0 && notifications.length === 0
            ? <p className="px-1 py-4 text-center text-sm text-slate-400 dark:text-slate-500">You&apos;re all caught up.</p>
            : <div className="flex flex-col gap-1">
              {incoming.map(r => <Link key={`fr-${r.id}`} href="/friends" onClick={() => setNotifOpen(false)} className="rounded-xl px-2 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><strong>{r.profile?.name || 'Someone'}</strong> sent you a friend request</Link>)}
              {notifications.map(n => <button key={n.id} onClick={() => openNotification(n)} className={cn('flex flex-col items-start gap-0.5 rounded-xl px-2 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800', !n.read && 'bg-blue-50/60 dark:bg-blue-950/30')}>
                <span>
                  <strong>{n.actorName}</strong>{' '}
                  {n.type === 'message' ? 'sent you a message' : n.type === 'mention' ? 'mentioned you' : 'replied to your story'}
                </span>
                {n.text && <span className="truncate text-xs text-slate-400 dark:text-slate-500">{n.text}</span>}
              </button>)}
            </div>}
        </div>}
      </div>
      <button aria-label="Toggle dark mode" onClick={toggle} className="rounded-lg p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">{theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>
      <Link href="/profile"><Avatar initials={initials} className="size-8" /></Link>
    </div></header><main className="mx-auto max-w-6xl px-5 py-8 pb-24 md:px-8">{children}</main></div>
  </div>
}

function Nav({ pathname, onNavigate, badges }: { pathname: string; onNavigate: () => void; badges: Record<string, boolean> }) {
  return <nav className="flex flex-col gap-1">{nav.map(({ label, href, icon: Icon }) => { const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href)); return <Link key={href} href={href} onClick={onNavigate} className={cn('flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition', active ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100')}><span className="relative"><Icon className="size-[18px]" />{badges[href] && <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />}</span>{label}</Link> })}</nav>
}

export const categories = ['All', 'Rant', 'Achievement', 'Appreciation', 'Celebration', 'Sad', 'Funny', 'Thought', 'Gratitude', 'Goal', 'Random']

function detectMentionTrigger(text: string, cursor: number): { start: number; query: string } | null {
  const uptoCursor = text.slice(0, cursor)
  const match = /(?:^|\s)@([a-z0-9_]{0,20})$/i.exec(uptoCursor)
  if (!match) return null
  const start = match[0].charAt(0) === '@' ? match.index : match.index + 1
  return { start, query: match[1] }
}

function useMentionAutocomplete(user: FirebaseUser | null) {
  const friendsCache = useRef<UserProfile[] | null>(null)
  const [trigger, setTrigger] = useState<{ start: number; query: string } | null>(null)
  const [suggestions, setSuggestions] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)

  function onCursorMove(text: string, cursor: number) {
    setTrigger(detectMentionTrigger(text, cursor))
  }

  useEffect(() => {
    if (!trigger || !user) {
      setSuggestions([])
      return
    }
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      if (!friendsCache.current) friendsCache.current = await getFriends(user.uid)
      if (cancelled) return
      const friendList = friendsCache.current
      const results = trigger.query ? await searchUsersByPrefix(trigger.query, user.uid, 8) : friendList.slice(0, 8)
      if (!cancelled) {
        setSuggestions(sortFriendsFirst(results, new Set(friendList.map((f) => f.uid))))
        setLoading(false)
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [trigger, user])

  return { trigger, suggestions, loading, onCursorMove, close: () => setTrigger(null) }
}

function MentionDropdown({ suggestions, loading, onSelect }: { suggestions: UserProfile[]; loading: boolean; onSelect: (u: UserProfile) => void }) {
  if (!loading && suggestions.length === 0) return null
  return <div className="absolute z-20 mt-1 max-h-48 w-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg">
    {loading && suggestions.length === 0 && <p className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500">Searching…</p>}
    {suggestions.map((u) => (
      <button key={u.uid} type="button" onMouseDown={(e) => { e.preventDefault(); onSelect(u) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
        <Avatar initials={initialsFrom(u.name)} className="size-6 text-[10px]" />
        <span className="min-w-0 flex-1 truncate text-sm">{u.name} <span className="text-xs text-slate-400 dark:text-slate-500">@{u.username}</span></span>
      </button>
    ))}
  </div>
}

export function StoryCard({ story, archived = false }: { story: Story; archived?: boolean }) {
  const { user, profile } = useAuth()
  const [reacted, setReacted] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState<StoryReply[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const time = story.createdAt ? timeAgo(story.createdAt.toMillis()) : 'just now'
  const replyInputRef = useRef<HTMLInputElement>(null)
  const replyMention = useMentionAutocomplete(user)

  async function react(i: number) {
    if (reacted || archived) return
    setReacted(true)
    await reactToStory(story.id, i)
  }

  useEffect(() => {
    if (!showReplies) return
    return subscribeStoryReplies(story.id, setReplies)
  }, [showReplies, story.id])

  async function sendReply() {
    if (!replyText.trim() || !user) return
    setSending(true)
    try {
      await replyToStory(story.id, story.authorId, user, profile?.name || 'You', replyText)
      setReplyText('')
    } finally {
      setSending(false)
    }
  }

  function handleReplyChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.slice(0, REPLY_MAX_LENGTH)
    setReplyText(value)
    replyMention.onCursorMove(value, e.target.selectionStart ?? value.length)
  }

  function selectReplyMention(u: UserProfile) {
    if (!replyMention.trigger) return
    const { start } = replyMention.trigger
    const cursor = replyInputRef.current?.selectionStart ?? replyText.length
    const inserted = `@${u.username} `
    const next = (replyText.slice(0, start) + inserted + replyText.slice(cursor)).slice(0, REPLY_MAX_LENGTH)
    setReplyText(next)
    replyMention.close()
    requestAnimationFrame(() => {
      const pos = start + inserted.length
      replyInputRef.current?.focus()
      replyInputRef.current?.setSelectionRange(pos, pos)
    })
  }

  return <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
    <div className="flex items-start gap-3"><Link href={`/profile/${story.authorId}`} className="shrink-0"><Avatar initials={story.initials} /></Link><div className="min-w-0"><Link href={`/profile/${story.authorId}`} className="text-sm font-semibold hover:underline">{story.authorName}</Link><p className="text-xs text-slate-400 dark:text-slate-500">{time}</p></div><span className="ml-auto rounded-full bg-blue-50 dark:bg-blue-950 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">{story.emoji} {story.category}</span></div>
    <p className="mt-5 text-[15px] leading-7 text-slate-700 dark:text-slate-200">{renderWithMentions(story.text)}</p>
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">{REACTION_EMOJIS.map((emoji, i) => <button key={emoji} disabled={archived || reacted} onClick={() => react(i)} className={cn('rounded-lg bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 disabled:cursor-default disabled:opacity-80', reacted && 'opacity-80')}>{emoji} {story.reactions[i]}</button>)}</div>
    <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
      <button onClick={() => setShowReplies(v => !v)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600">
        <MessageCircle className="size-3.5" /> {story.repliesCount > 0 ? `${story.repliesCount} ${story.repliesCount === 1 ? 'reply' : 'replies'}` : 'Reply'}
      </button>
      {showReplies && <div className="mt-3 flex flex-col gap-2">
        {replies.map(r => <div key={r.id} className="flex items-start gap-2">
          <Avatar initials={r.initials} className="size-7 text-[10px]" />
          <div className="min-w-0 flex-1 rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2"><p className="text-xs font-semibold">{r.authorName}</p><p className="text-sm text-slate-700 dark:text-slate-200">{renderWithMentions(r.text)}</p></div>
        </div>)}
        <div className="relative flex items-center gap-2">
          <input
            ref={replyInputRef}
            value={replyText}
            onChange={handleReplyChange}
            onKeyUp={e => replyMention.onCursorMove(replyText, e.currentTarget.selectionStart ?? replyText.length)}
            onClick={e => replyMention.onCursorMove(replyText, e.currentTarget.selectionStart ?? replyText.length)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (replyMention.trigger && replyMention.suggestions.length > 0) {
                  e.preventDefault()
                  selectReplyMention(replyMention.suggestions[0])
                } else {
                  sendReply()
                }
              }
              if (e.key === 'Escape') replyMention.close()
            }}
            placeholder="Write a reply… (@ to mention)"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
          <button onClick={sendReply} disabled={!replyText.trim() || sending} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{sending ? '…' : 'Send'}</button>
          {replyMention.trigger && <MentionDropdown suggestions={replyMention.suggestions} loading={replyMention.loading} onSelect={selectReplyMention} />}
        </div>
        <p className="text-right text-[11px] text-slate-400 dark:text-slate-500">{replyText.length}/{REPLY_MAX_LENGTH}</p>
      </div>}
    </div>
  </article>
}

export function StoryList({ stories, archived = false }: { stories: Story[]; archived?: boolean }) {
  if (stories.length === 0) return null
  return <div className="flex flex-col gap-4">
    {stories.map(story => <StoryCard key={story.id} story={story} archived={archived} />)}
  </div>
}

export function CategoryFilter({ selected, onSelect }: { selected: string; onSelect: (category: string) => void }) { return <div className="flex gap-2 overflow-x-auto pb-1">{categories.map(category => <button key={category} onClick={() => onSelect(category)} className={cn('shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition', selected === category ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-blue-200 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-300')}>{category}</button>)}</div> }

export function StoryComposer({ onClose }: { onClose?: () => void }) {
  const { user, profile } = useAuth()
  const [text, setText] = useState('')
  const [category, setCategory] = useState('Achievement')
  const [posting, setPosting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mention = useMentionAutocomplete(user)

  async function post() {
    if (!text.trim() || !user) return
    setPosting(true)
    try {
      await createStory(user, profile?.name || 'You', category, text.trim())
      setText('')
      onClose?.()
    } finally {
      setPosting(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value.slice(0, 500)
    setText(value)
    mention.onCursorMove(value, e.target.selectionStart ?? value.length)
  }

  function selectMention(u: UserProfile) {
    if (!mention.trigger) return
    const { start } = mention.trigger
    const cursor = textareaRef.current?.selectionStart ?? text.length
    const inserted = `@${u.username} `
    const next = (text.slice(0, start) + inserted + text.slice(cursor)).slice(0, 500)
    setText(next)
    mention.close()
    requestAnimationFrame(() => {
      const pos = start + inserted.length
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(pos, pos)
    })
  }

  return <div className="rounded-2xl border border-blue-100 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 p-5">
    <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Write a story</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">A small update for your circle, disappearing after 24 hours.</p></div>{onClose && <button onClick={onClose} className="text-sm font-medium text-slate-500 dark:text-slate-400">Cancel</button>}</div>
    <select value={category} onChange={e => setCategory(e.target.value)} className="mb-3 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm">{categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select>
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyUp={e => mention.onCursorMove(text, e.currentTarget.selectionStart ?? text.length)}
        onClick={e => mention.onCursorMove(text, e.currentTarget.selectionStart ?? text.length)}
        onKeyDown={e => {
          if (e.key === 'Enter' && mention.trigger && mention.suggestions.length > 0) {
            e.preventDefault()
            selectMention(mention.suggestions[0])
          }
          if (e.key === 'Escape') mention.close()
        }}
        placeholder="What happened? Use @ to mention someone."
        className="min-h-28 w-full resize-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900"
      />
      {mention.trigger && <MentionDropdown suggestions={mention.suggestions} loading={mention.loading} onSelect={selectMention} />}
    </div>
    <div className="mt-2 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500"><span>Keep it kind and real. Use @username to mention someone.</span><span>{text.length}/500</span></div>
    <button onClick={post} disabled={!text.trim() || posting} className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{posting ? 'Posting…' : 'Post Story'}</button>
  </div>
}

function renderWithMentions(text: string): React.ReactNode {
  const re = new RegExp(MENTION_PATTERN)
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = re.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    const handle = match[1]
    parts.push(<Link key={key++} href={`/u/${handle.toLowerCase()}`} className="font-semibold text-blue-600 hover:underline">@{handle}</Link>)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

function timeAgo(ms: number) {
  const diff = Date.now() - ms
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
