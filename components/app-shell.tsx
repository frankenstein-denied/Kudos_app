'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Heart, Home, Sparkles, MessageCircle, Users, User, Settings, Menu, X, Moon, Sun, Bell } from 'lucide-react'
import { cn, initialsFrom } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/use-theme'
import { REACTION_EMOJIS, createStory, reactToStory, subscribeIncomingRequests, type FriendRequest, type Story } from '@/lib/firestore'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Stories', href: '/stories', icon: Sparkles },
  { label: 'Chats', href: '/chats', icon: MessageCircle },
  { label: 'Friends', href: '/friends', icon: Users },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700', className)}>{initials}</div>
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { user, profile } = useAuth()
  const { theme, toggle } = useTheme()
  const [notifOpen, setNotifOpen] = useState(false)
  const [incoming, setIncoming] = useState<FriendRequest[]>([])
  const name = profile?.name || 'You'
  const username = profile?.username ? `@${profile.username}` : ''
  const initials = initialsFrom(name)

  useEffect(() => {
    if (!user) return
    return subscribeIncomingRequests(user.uid, setIncoming)
  }, [user])

  return <div className="min-h-screen bg-[#f7faff] text-slate-900">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
      <Link href="/dashboard" className="mb-10 flex items-center gap-2.5 px-2"><span className="flex size-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200"><Heart className="size-5 fill-current" /></span><span className="text-xl font-bold tracking-tight">kudos</span></Link>
      <Nav pathname={pathname} onNavigate={close} />
      <Link href="/profile" className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-5"><Avatar initials={initials} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{name}</p><p className="text-xs text-slate-400">{username}</p></div></Link>
    </aside>
    {open && <button aria-label="Close navigation" onClick={close} className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" />}
    <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-white px-5 py-6 shadow-xl transition-transform lg:hidden', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="mb-8 flex items-center justify-between"><Link href="/dashboard" onClick={close} className="flex items-center gap-2.5"><span className="flex size-10 items-center justify-center rounded-2xl bg-blue-600 text-white"><Heart className="size-5 fill-current" /></span><span className="text-xl font-bold">kudos</span></Link><button aria-label="Close menu" onClick={close} className="rounded-lg p-2 text-slate-400"><X className="size-5" /></button></div><Nav pathname={pathname} onNavigate={close} />
    </aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur md:px-8"><button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 lg:hidden"><Menu className="size-5" /></button><div className="hidden text-sm font-medium text-slate-500 lg:block">Make space for good things.</div><div className="ml-auto flex items-center gap-2">
      <div className="relative">
        <button aria-label="Notifications" onClick={() => setNotifOpen(o => !o)} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-50"><Bell className="size-5" />{incoming.length > 0 && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-blue-600" />}</button>
        {notifOpen && <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 px-1 text-xs font-semibold text-slate-400">Friend requests</p>
          {incoming.length === 0
            ? <p className="px-1 py-4 text-center text-sm text-slate-400">You&apos;re all caught up.</p>
            : <div className="flex flex-col gap-1">{incoming.map(r => <Link key={r.id} href="/friends" onClick={() => setNotifOpen(false)} className="rounded-xl px-2 py-2 text-sm hover:bg-slate-50"><strong>{r.profile?.name || 'Someone'}</strong> sent you a friend request</Link>)}</div>}
        </div>}
      </div>
      <button aria-label="Toggle dark mode" onClick={toggle} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50">{theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>
      <Link href="/profile"><Avatar initials={initials} className="size-8" /></Link>
    </div></header><main className="mx-auto max-w-6xl px-5 py-8 pb-24 md:px-8">{children}</main></div>
  </div>
}

function Nav({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return <nav className="flex flex-col gap-1">{nav.map(({ label, href, icon: Icon }) => { const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href)); return <Link key={href} href={href} onClick={onNavigate} className={cn('flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition', active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800')}><Icon className="size-[18px]" />{label}</Link> })}</nav>
}

export const categories = ['All', 'Rant', 'Achievement', 'Appreciation', 'Celebration', 'Sad', 'Funny', 'Thought', 'Gratitude', 'Goal', 'Random']

export function StoryCard({ story, archived = false }: { story: Story; archived?: boolean }) {
  const [reacted, setReacted] = useState(false)
  const time = story.createdAt ? timeAgo(story.createdAt.toMillis()) : 'just now'
  async function react(i: number) {
    if (reacted || archived) return
    setReacted(true)
    await reactToStory(story.id, i)
  }
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><Avatar initials={story.initials} /><div className="min-w-0"><p className="text-sm font-semibold">{story.authorName}</p><p className="text-xs text-slate-400">{time}</p></div><span className="ml-auto rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{story.emoji} {story.category}</span></div><p className="mt-5 text-[15px] leading-7 text-slate-700">{story.text}</p><div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">{REACTION_EMOJIS.map((emoji, i) => <button key={emoji} disabled={archived || reacted} onClick={() => react(i)} className={cn('rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-blue-50 disabled:cursor-default disabled:opacity-80', reacted && 'opacity-80')}>{emoji} {story.reactions[i]}</button>)}</div></article>
}

export function CategoryFilter({ selected, onSelect }: { selected: string; onSelect: (category: string) => void }) { return <div className="flex gap-2 overflow-x-auto pb-1">{categories.map(category => <button key={category} onClick={() => onSelect(category)} className={cn('shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition', selected === category ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-700')}>{category}</button>)}</div> }

export function StoryComposer({ onClose }: { onClose?: () => void }) {
  const { user, profile } = useAuth()
  const [text, setText] = useState('')
  const [category, setCategory] = useState('Achievement')
  const [posting, setPosting] = useState(false)
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
  return <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Write a story</h2><p className="mt-1 text-xs text-slate-500">A small update for your circle, disappearing after 24 hours.</p></div>{onClose && <button onClick={onClose} className="text-sm font-medium text-slate-500">Cancel</button>}</div><select value={category} onChange={e => setCategory(e.target.value)} className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">{categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select><textarea value={text} onChange={e => setText(e.target.value.slice(0, 500))} placeholder="What happened?" className="min-h-28 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /><div className="mt-2 flex items-center justify-between text-xs text-slate-400"><span>Keep it kind and real.</span><span>{text.length}/500</span></div><button onClick={post} disabled={!text.trim() || posting} className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{posting ? 'Posting…' : 'Post Story'}</button></div>
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
