'use client'

import { useCallback, useEffect, useState } from 'react'

export type ThemeSetting = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'kudos-theme'

function applyTheme(setting: ThemeSetting) {
  const isDark = setting === 'dark' || (setting === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeSetting>('system')

  useEffect(() => {
    let stored: ThemeSetting = 'system'
    try {
      stored = (localStorage.getItem(STORAGE_KEY) as ThemeSetting | null) ?? 'system'
    } catch {}
    setThemeState(stored)
    applyTheme(stored)
  }, [])

  const setTheme = useCallback((next: ThemeSetting) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {}
    applyTheme(next)
  }, [])

  const toggle = useCallback(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')
  }, [setTheme])

  return { theme, setTheme, toggle }
}
