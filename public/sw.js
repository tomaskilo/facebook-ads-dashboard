const CACHE_NAME = 'toka-analysis-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/_next/static/css/',
  '/_next/static/js/',
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache opened')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.log('Service Worker: Cache failed', error)
      })
  )
})

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) return

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url)
          return response
        }

        // Clone the request because it can only be consumed once
        const fetchRequest = event.request.clone()

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone the response because it can only be consumed once
          const responseToCache = response.clone()

          // Cache static assets only
          if (
            event.request.url.includes('/_next/static/') ||
            event.request.url.includes('.css') ||
            event.request.url.includes('.js') ||
            event.request.url.includes('.png') ||
            event.request.url.includes('.jpg') ||
            event.request.url.includes('.svg')
          ) {
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })
          }

          return response
        })
      })
      .catch(() => {
        // Fallback for navigation requests when offline
        if (event.request.mode === 'navigate') {
          return caches.match('/')
        }
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
}) 