'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/app-shell'
import { useAuth } from '@/lib/auth-context'
import { subscribeConversations, type Conversation } from '@/lib/firestore'
import { initialsFrom } from '@/lib/utils'

export default function ChatsPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    if (!user) return
    return subscribeConversations(user.uid, setConversations)
  }, [user])

  return <div>
    <div className="mb-8"><p className="mb-2 text-sm font-medium text-blue-600">Stay connected</p><h1 className="text-3xl font-bold tracking-tight">Chats</h1><p className="mt-2 text-sm text-slate-500">Messages disappear after 24 hours.</p></div>
    <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {conversations.length === 0 && <p className="p-6 text-center text-sm text-slate-400">No conversations yet — message a friend from their profile.</p>}
      {conversations.map(chat => <Link href={`/chats/${chat.id}`} key={chat.id} className="flex items-center gap-3 rounded-xl p-4 hover:bg-slate-50">
        <Avatar initials={initialsFrom(chat.otherProfile?.name || '?')} />
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{chat.otherProfile?.name || 'Unknown'}</p><p className="truncate text-sm text-slate-500">{chat.lastMessage || 'Say hello 👋'}</p></div>
      </Link>)}
    </div>
  </div>
}
