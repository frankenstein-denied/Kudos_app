'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { createCommunity, subscribeCommunities, type Community } from '@/lib/firestore'

export default function CommunitiesPage() {
  const { user, profile } = useAuth()
  const [communities, setCommunities] = useState<Community[]>([])
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    return subscribeCommunities(user.uid, setCommunities)
  }, [user])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !name.trim()) return
    setSaving(true)
    try {
      await createCommunity(user.uid, name, description)
      setName('')
      setDescription('')
      setCreating(false)
    } finally {
      setSaving(false)
    }
  }

  return <div className="mx-auto max-w-3xl">
    <div className="mb-8 flex items-end justify-between">
      <div><p className="mb-2 text-sm font-medium text-blue-600">Group up</p><h1 className="text-3xl font-bold tracking-tight">Communities</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Group chats for your circle — anyone in can add or remove others.</p></div>
      <button onClick={() => setCreating(v => !v)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"><Plus className="size-4" /> New</button>
    </div>

    {creating && <form onSubmit={create} className="mb-6 flex flex-col gap-3 rounded-2xl border border-blue-100 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 p-5">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Community name" required maxLength={60} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm" />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this community about?" maxLength={200} className="min-h-16 resize-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm outline-none" />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setCreating(false)} className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold">Cancel</button>
        <button disabled={saving || !name.trim()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Creating…' : 'Create'}</button>
      </div>
    </form>}

    {communities.length === 0
      ? <p className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-400 dark:text-slate-500">You're not in any communities yet — create one to get started.</p>
      : <div className="grid gap-3 sm:grid-cols-2">
        {communities.map(c => <Link key={c.id} href={`/communities/${c.id}`} className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-200 dark:hover:border-blue-700">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"><Users className="size-5" /></span>
          <div className="min-w-0">
            <p className="font-semibold">{c.name}</p>
            {c.description && <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">{c.description}</p>}
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{c.memberIds.length} member{c.memberIds.length === 1 ? '' : 's'}</p>
          </div>
        </Link>)}
      </div>}
  </div>
}
