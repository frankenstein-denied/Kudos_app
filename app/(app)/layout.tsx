'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/lib/auth-context'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading, redirectError } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f7faff] dark:bg-slate-950 text-sm text-slate-500 dark:text-slate-400">
        <div className="size-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-slate-700" />
        Loading…
      </div>
    )
  }

  return <>
    {redirectError && <div className="bg-red-50 px-4 py-2 text-center text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{redirectError}</div>}
    <AppShell>{children}</AppShell>
  </>
}
