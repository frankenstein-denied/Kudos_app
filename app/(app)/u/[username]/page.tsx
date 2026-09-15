'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { resolveUsernameToUid } from '@/lib/firestore'

export default function UsernameResolverPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const router = useRouter()
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    resolveUsernameToUid(username).then((uid) => {
      if (uid) router.replace(`/profile/${uid}`)
      else setNotFound(true)
    })
  }, [username, router])

  if (notFound) return <p className="text-center text-sm text-slate-400 dark:text-slate-500">No one found with that username.</p>
  return <p className="text-center text-sm text-slate-400 dark:text-slate-500">Loading…</p>
}
