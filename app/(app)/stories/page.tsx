'use client'
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { CategoryFilter, StoryRow, StoryComposer } from '@/components/app-shell'
import { subscribeStories, type Story } from '@/lib/firestore'

export default function StoriesPage() {
  const [category, setCategory] = useState('All')
  const [compose, setCompose] = useState(false)
  const [stories, setStories] = useState<Story[]>([])

  useEffect(() => subscribeStories(setStories), [])

  const filtered = category === 'All' ? stories : stories.filter(s => s.category === category)

  return <div className="mx-auto max-w-3xl">
    <div className="mb-8 flex items-end justify-between">
      <div><p className="mb-2 text-sm font-medium text-blue-600">The story board</p><h1 className="text-3xl font-bold tracking-tight">Stories</h1><p className="mt-2 text-sm text-slate-500">See what your people are sharing today.</p></div>
      <button onClick={() => setCompose(!compose)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"><Plus className="size-4" /> Create story</button>
    </div>
    {compose && <div className="mb-6"><StoryComposer onClose={() => setCompose(false)} /></div>}
    <CategoryFilter selected={category} onSelect={setCategory} />
    <div className="mt-5">
      {filtered.length === 0
        ? <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">Nothing here yet.</p>
        : <StoryRow key={category} stories={filtered} />}
    </div>
  </div>
}
