'use client'

const PREFIX = 'kudos-seen:'

export function getLastSeen(key: string): number {
  try {
    return Number(localStorage.getItem(PREFIX + key)) || 0
  } catch {
    return 0
  }
}

export function markSeen(key: string, at: number = Date.now()) {
  try {
    localStorage.setItem(PREFIX + key, String(at))
  } catch {}
}
