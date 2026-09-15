const CACHE_NAME = 'kudos-v2'
const PRECACHE_URLS = ['/', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {}),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

// Network-first for everything same-origin: always try to get the freshest
// copy, only falling back to cache when the network is unavailable. This
// app changes frequently during active development — a cache-first static
// asset strategy previously caused updated images to appear "stuck" on an
// old cached copy indefinitely, even after new deploys. Cache is now purely
// an offline fallback, never a source of staleness.
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Never intercept cross-origin requests — Firebase Auth/Firestore/Storage
  // all run on their own origins and must hit the network directly.
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        return res
      })
      .catch(() => caches.match(request).then((cached) => cached || (request.mode === 'navigate' ? caches.match('/') : undefined))),
  )
})
