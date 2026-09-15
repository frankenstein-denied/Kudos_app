'use client'

import { useEffect, useState } from 'react'
import { Copy, TriangleAlert } from 'lucide-react'
import { isInAppBrowser } from '@/lib/in-app-browser'

export function InAppBrowserBanner() {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setShow(isInAppBrowser())
  }, [])

  if (!show) return null

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
    <p className="flex items-center gap-2 font-semibold"><TriangleAlert className="size-4 shrink-0" /> Google sign-in won&apos;t work here</p>
    <p>You&apos;re viewing this inside an app&apos;s built-in browser, which Google blocks for sign-in. Open this page in Chrome (or your default browser) to continue — tap the menu (⋮ or ⋯) and choose &quot;Open in browser&quot;.</p>
    <button onClick={copyLink} className="mt-1 flex w-fit items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-900 dark:text-amber-200">
      <Copy className="size-3.5" /> {copied ? 'Link copied' : 'Copy this link'}
    </button>
  </div>
}
