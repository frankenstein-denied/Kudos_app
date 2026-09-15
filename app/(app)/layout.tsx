'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/lib/auth-context'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7faff] text-sm text-slate-400">
        Loading…
      </div>
    )
  }

  return <AppShell>{children}</AppShell>
}
