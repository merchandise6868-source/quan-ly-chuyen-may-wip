const CACHE_NAME = 'wip-flow-cache-v10';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-32x32.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js'
];

// Install: Cache core static assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Cache addAll partial warning:', err);
      });
    })
  );
});

// Activate: Clean up older caches immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy:
// 1. API calls (/api/*, Firebase, Google APIs) -> Network Only (Always fresh)
// 2. HTML navigation & App .css/.js -> Network-First (lấy mạng trước, lỗi mạng mới dùng cache)
// 3. Icons, images & CDN libraries -> Cache-First
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // If API request or Firebase auth, bypass cache completely
  if (url.pathname.startsWith('/api/') || url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ success: false, error: "Bạn đang ngoại tuyến (Offline)" }), {
          headers: { "Content-Type": "application/json" }
        });
      })
    );
    return;
  }

  const isNavigation = event.request.mode === 'navigate';
  const isAppScriptOrStyle = url.origin === self.location.origin && (
    url.pathname.endsWith('.css') || 
    url.pathname.endsWith('.js') || 
    url.pathname === '/' || 
    url.pathname.endsWith('.html')
  );

  // Network-First for HTML navigation and app CSS/JS (tránh kẹt cache trên điện thoại)
  if (isNavigation || isAppScriptOrStyle) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            if (isNavigation) return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Cache-First for icons, images, manifest, and CDN libraries
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
