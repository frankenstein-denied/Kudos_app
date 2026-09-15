const CACHE_NAME = 'kudos-v3'
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

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Never intercept cross-origin requests — Firebase Auth/Firestore/Storage
  // all run on their own origins and must hit the network directly.
  if (url.origin !== self.location.origin) return

  // Never intercept full-page navigations. Google's OAuth redirect flow
  // sends the browser back here as a normal top-level navigation, and a
  // service worker sitting in front of that request is a real, documented
  // way to interfere with the auth SDK completing sign-in on that reload —
  // matching reports of sign-in getting stuck specifically in contexts
  // where this service worker is active (regular browser tab, installed
  // app) but not where it isn't (an embedded in-app browser). This app
  // needs live Firebase connectivity regardless, so there's little value
  // in caching navigations offline — not worth that risk.
  if (request.mode === 'navigate') return

  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        return res
      })
      .catch(() => caches.match(request)),
  )
})
