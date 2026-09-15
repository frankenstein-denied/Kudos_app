'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return // avoid caching dev's hot-reloaded assets
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return null
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setInstalled(true)
      setPromptEvent(null)
    }
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true)
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return <p className="text-sm text-emerald-600 dark:text-emerald-400">Kudos is installed on this device.</p>
  if (!promptEvent) return <p className="text-sm text-slate-400 dark:text-slate-500">Your browser doesn&apos;t offer an install prompt right now — some browsers only show it after you&apos;ve visited a few times.</p>

  async function install() {
    if (!promptEvent) return
    await promptEvent.prompt()
    await promptEvent.userChoice
    setPromptEvent(null)
  }

  return <button onClick={install} className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
    <Download className="size-4" /> Install app
  </button>
}
