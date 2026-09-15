'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { CategoryFilter, StoryCard, StoryComposer, Avatar } from '@/components/app-shell'
import { useAuth } from '@/lib/auth-context'
import { subscribeStories, type Story } from '@/lib/firestore'
import { initialsFrom } from '@/lib/utils'

export default function DashboardPage() {
  const { profile } = useAuth()
  const [category, setCategory] = useState('All')
  const [composing, setComposing] = useState(false)
  const [stories, setStories] = useState<Story[]>([])

  useEffect(() => subscribeStories(setStories), [])

  const filtered = category === 'All' ? stories : stories.filter(s => s.category === category)
  const firstName = profile?.name?.split(' ')[0] || 'there'

  return <div className="mx-auto max-w-3xl">
    <div className="mb-8">
      <p className="mb-2 text-sm font-medium text-blue-600">Your circle</p>
      <h1 className="text-3xl font-bold tracking-tight">Good to see you, {firstName}</h1>
      <p className="mt-2 text-sm text-slate-500">What is happening in your circle?</p>
    </div>
    {composing ? <div className="mb-6"><StoryComposer onClose={() => setComposing(false)} /></div> : <button onClick={() => setComposing(true)} className="mb-7 flex w-full items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-left hover:border-blue-200"><Avatar initials={initialsFrom(profile?.name || 'You')} /><span className="flex-1 text-sm text-slate-500">What&apos;s on your mind?</span><span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white"><Plus className="size-5" /></span></button>}
    <div className="mb-5 flex items-center justify-between">
      <div><h2 className="font-semibold">Stories from your circle</h2><p className="mt-1 text-xs text-slate-400">Text updates that disappear after 24 hours.</p></div>
      <Link href="/stories" className="text-sm font-semibold text-blue-600">View all</Link>
    </div>
    <CategoryFilter selected={category} onSelect={setCategory} />
    <div className="mt-4 flex flex-col gap-4">
      {filtered.length === 0 && <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">No stories yet — be the first to share something.</p>}
      {filtered.map(story => <StoryCard key={story.id} story={story} />)}
    </div>
  </div>
}
