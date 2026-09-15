'use client'
import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Smile } from 'lucide-react'
import { Avatar } from '@/components/app-shell'
import { useAuth } from '@/lib/auth-context'
import { getUserProfile, sendMessage, subscribeMessages, type Message, type UserProfile } from '@/lib/firestore'
import { cn, initialsFrom } from '@/lib/utils'

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params)
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [other, setOther] = useState<UserProfile | null>(null)

  useEffect(() => {
    const otherUid = conversationId.split('_').find(id => id !== user?.uid)
    if (otherUid) getUserProfile(otherUid).then(setOther)
  }, [conversationId, user])

  useEffect(() => subscribeMessages(conversationId, setMessages), [conversationId])

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
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
        {messages.map(message => <div key={message.id} className={cn(message.senderId === user?.uid ? 'self-end rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm text-white' : 'max-w-[80%] self-start rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-700')}>{message.text}</div>)}
      </div>
      <p className="px-5 pb-2 text-center text-xs text-slate-400">Messages disappear after 24 hours</p>
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <button type="button" aria-label="Open emoji picker" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><Smile className="size-5" /></button>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." className="min-w-0 flex-1 rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
        <button aria-label="Send message" className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Send className="size-4" /></button>
      </form>
    </div>
  </div>
}
