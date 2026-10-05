// Service worker: lets the installed app start offline.
// Code (html/js/css) is network-first so updates arrive as soon as you are online;
// images and audio are cache-first and get cached the first time the game uses them.
const VERSION = 'tt-v6';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'css/v2.css',
  'js/util.js', 'js/data.js', 'js/realms.js', 'js/lore.js', 'js/lore_bond.js', 'js/assets.js', 'js/world.js', 'js/data2.js',
  'js/fx.js', 'js/loot.js', 'js/entities.js', 'js/game.js', 'js/story.js', 'js/ui.js', 'js/play.js', 'js/touch.js', 'js/v3.js', 'js/v4.js', 'js/coop.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon-32.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'tt-fonts').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const isCode = url => /\.(html|js|css|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req, { cache: 'no-cache' }); // revalidate, never trust a stale HTTP cache for code
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(req, { ignoreSearch: true })) || Response.error();
  }
}
async function cacheFirst(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && res.status === 200) cache.put(req, res.clone());
  return res;
}
// <audio> asks for byte ranges; answer them from the full cached file so music works offline
async function ranged(req) {
  const cache = await caches.open(VERSION);
  const url = req.url;
  let full = await cache.match(url, { ignoreSearch: true });
  if (!full) {
    try { const res = await fetch(url); if (res.ok && res.status === 200) { await cache.put(url, res.clone()); full = res; } } catch (e) {}
    if (!full) return fetch(req);
  }
  const buf = await full.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  const size = buf.byteLength;
  const start = m && m[1] ? +m[1] : 0, end = m && m[2] ? Math.min(+m[2], size - 1) : size - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206, statusText: 'Partial Content',
    headers: { 'Content-Type': full.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' },
  });
}
async function fonts(req) {
  const cache = await caches.open('tt-fonts');
  const hit = await cache.match(req);
  const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit || Response.error());
  return hit || net;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') { e.respondWith(fonts(req)); return; }
  if (url.origin !== location.origin) return;
  if (req.headers.has('range')) { e.respondWith(ranged(req)); return; }
  e.respondWith(isCode(url) ? networkFirst(req) : cacheFirst(req));
});
