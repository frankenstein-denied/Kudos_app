'use client'
import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowLeft, Send, Smile } from 'lucide-react'
import { Avatar } from '@/components/app-shell'
import { useAuth } from '@/lib/auth-context'
import { getUserProfile, sendMessage, subscribeMessages, type Message, type UserProfile } from '@/lib/firestore'
import { cn, initialsFrom } from '@/lib/utils'

const QUICK_EMOJIS = ['😊', '😂', '❤️', '🎉', '🔥', '👏', '🙏', '😢', '👍', '🤔']

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params)
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [other, setOther] = useState<UserProfile | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)
  const [atBottom, setAtBottom] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const otherUid = conversationId.split('_').find(id => id !== user?.uid)
    if (otherUid) getUserProfile(otherUid).then(setOther)
  }, [conversationId, user])

  useEffect(() => subscribeMessages(conversationId, setMessages), [conversationId])

  function scrollToBottom(behavior: ScrollBehavior) {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior })
  }

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    setAtBottom(nearBottom)
    if (nearBottom) setUnreadCount(0)
  }

  useEffect(() => {
    const prevCount = prevCountRef.current
    const added = messages.length - prevCount
    prevCountRef.current = messages.length
    if (added <= 0) return
    const isOwnMessage = messages[messages.length - 1]?.senderId === user?.uid
    if (atBottom || isOwnMessage) {
      scrollToBottom(prevCount === 0 ? 'auto' : 'smooth')
      setUnreadCount(0)
    } else {
      setUnreadCount(c => c + added)
    }
  }, [messages, atBottom, user])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !user) return
    const value = text.trim()
    setText('')
    await sendMessage(conversationId, user.uid, value)
  }

  return <div className="mx-auto max-w-3xl">
    <Link href="/chats" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"><ArrowLeft className="size-4" /> All conversations</Link>
    <div className="flex h-[calc(100vh-11rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-slate-100 p-4"><Avatar initials={initialsFrom(other?.name || '?')} /><div><p className="text-sm font-semibold">{other?.name || 'Loading…'}</p></div></header>
      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} onScroll={handleScroll} className="flex h-full flex-col gap-3 overflow-y-auto p-5">
          {messages.map(message => <div key={message.id} className={cn(message.senderId === user?.uid ? 'self-end rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm text-white' : 'max-w-[80%] self-start rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-700')}>{message.text}</div>)}
        </div>
        {!atBottom && unreadCount > 0 && <button onClick={() => { scrollToBottom('smooth'); setUnreadCount(0) }} className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          <ArrowDown className="size-3.5" /> {unreadCount} new message{unreadCount > 1 ? 's' : ''}
        </button>}
      </div>
      <p className="px-5 pb-2 text-center text-xs text-slate-400">Messages disappear after 24 hours</p>
      <form onSubmit={submit} className="relative flex items-center gap-2 border-t border-slate-100 p-3">
        {showEmoji && <div className="absolute bottom-full left-3 mb-2 flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          {QUICK_EMOJIS.map(emoji => <button key={emoji} type="button" onClick={() => { setText(t => t + emoji); setShowEmoji(false) }} className="rounded-lg p-1.5 text-lg hover:bg-slate-50">{emoji}</button>)}
        </div>}
        <button type="button" aria-label="Open emoji picker" onClick={() => setShowEmoji(v => !v)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><Smile className="size-5" /></button>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." className="min-w-0 flex-1 rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
        <button aria-label="Send message" className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Send className="size-4" /></button>
      </form>
    </div>
  </div>
}
