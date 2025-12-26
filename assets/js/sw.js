const CACHE_NAME = 'carvao-delivery-v1';
const OFFLINE_URL = 'loading.html';
const urlsToCache = [
  '/',
  '/loading.html',
  '/index.html',
  '/assets/css/style.css',
  '/assets/css/loading.css',
  '/assets/js/app.js',
  '/assets/js/loading.js',
  '/assets/js/map.js',
  '/manifest.json',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png',
  '/assets/images/loading-logo.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch with network-first for API, cache-first for assets
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // API requests - network first
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
  // Other requests - cache first
  else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request)
            .then(response => {
              // Don't cache if not a success response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone the response
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // If offline and trying to navigate to a page
              if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
              }
              
              return null;
            });
        })
    );
  }
});

// Background sync for orders
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
  
  if (event.tag === 'sync-location') {
    event.waitUntil(syncLocation());
  }
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Nova entrega disponível!',
    icon: '/assets/images/icon-192.png',
    badge: '/assets/images/icon-192.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'Visualizar'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Carvão Express', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/index.html')
    );
  }
});

// Periodic sync (every hour)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-data') {
    event.waitUntil(updateAppData());
  }
});

// Helper functions
async function syncOrders() {
  const pendingOrders = await getPendingOrders();
  
  for (const order of pendingOrders) {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });
      
      if (response.ok) {
        await removePendingOrder(order.id);
        
        // Show notification
        self.registration.showNotification('Pedido sincronizado!', {
          body: `Pedido ${order.id} enviado com sucesso.`,
          icon: '/assets/images/icon-192.png',
        });
      }
    } catch (error) {
      console.error('Erro ao sincronizar pedido:', error);
    }
  }
}

async function syncLocation() {
  const pendingLocations = await getPendingLocations();
  
  for (const location of pendingLocations) {
    try {
      await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(location),
      });
      
      await removePendingLocation(location.id);
    } catch (error) {
      console.error('Erro ao sincronizar localização:', error);
    }
  }
}

async function updateAppData() {
  // Update suppliers data
  try {
    const response = await fetch('/api/suppliers/update');
    const data = await response.json();
    
    // Store in cache
    const cache = await caches.open(CACHE_NAME);
    const suppliersUrl = new Request('/api/suppliers');
    
    cache.put(suppliersUrl, new Response(JSON.stringify(data)));
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
  }
}

// IndexedDB helpers
async function getPendingOrders() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CarvaoDeliveryDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('orders')) {
        const store = db.createObjectStore('orders', { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      const pendingRequest = store.index('status').getAll('pending');
      
      pendingRequest.onsuccess = () => resolve(pendingRequest.result);
      pendingRequest.onerror = () => reject(pendingRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function removePendingOrder(orderId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CarvaoDeliveryDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      const deleteRequest = store.delete(orderId);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}