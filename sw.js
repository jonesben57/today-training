/* =============================================================================
   Today — service worker: works with no signal and keeps itself up to date.

   • First visit: saves every app file and the two fonts on the phone.
   • Every launch: the page comes straight from the saved copy (instant, works
     offline). Then the saved files are compared with the ones on the server; if
     anything changed (say you edited the plan and pushed it), the new files are
     saved and the open page reloads once. No version numbers to bump.
   • Only caches named "today-…" are ever touched, so other sites on the same
     github.io address are left alone.
   ============================================================================= */

const APP_CACHE = "today-app-v1";
const FONT_CACHE = "today-fonts-v1";

// Must match the font stylesheet address in index.html exactly.
const FONT_CSS = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Inter:wght@400;500;600&display=swap";

// Everything the app needs offline. Add new files here.
const APP_FILES = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "manifest.json",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

// The app's folder. Every page address inside it gets the one page.
const SCOPE = new URL("./", self.location).href;
const MIN_GAP_BETWEEN_CHECKS_MS = 10 * 1000;
let lastCheck = 0;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await cache.addAll(APP_FILES.map((file) => new Request(file, { cache: "reload" })));
    await saveFonts().catch(() => {}); // nice to have; never blocks installing
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith("today-") && name !== APP_CACHE && name !== FONT_CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const host = new URL(request.url).hostname;

  if (request.mode === "navigate" && request.url.startsWith(SCOPE)) {
    event.respondWith(page());
    event.waitUntil(checkForUpdate());
  } else if (request.url.startsWith(SCOPE)) {
    event.respondWith(fromCache(request));
  } else if (host === "fonts.googleapis.com" || host === "fonts.gstatic.com") {
    event.respondWith(font(request));
  }
});

// The page asks for a check whenever it comes back on screen.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "check") event.waitUntil(checkForUpdate());
});

// The one page. Its links to app.js and styles.css get a fingerprint of their contents
// ("app.js?v=3k9x1a"), so after an update the browser can't reuse an old copy it still
// holds in memory: new contents, new address. The saved-file lookup ignores the "?v=".
async function page() {
  const cache = await caches.open(APP_CACHE);
  const saved = await cache.match(SCOPE);
  if (!saved) return fromCache(SCOPE);
  let html = await saved.text();
  for (const file of ["app.js", "styles.css"]) {
    const copy = await cache.match(new URL(file, SCOPE).href);
    if (!copy) continue;
    const tag = fingerprint(new Uint8Array(await copy.arrayBuffer()));
    html = html.replace(new RegExp(`(src|href)="${file.replace(".", "\\.")}"`), `$1="${file}?v=${tag}"`);
  }
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// A short fingerprint of a file's bytes (32-bit FNV-1a).
function fingerprint(bytes) {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) h = Math.imul(h ^ bytes[i], 0x01000193);
  return (h >>> 0).toString(36);
}

// Saved copy if there is one; otherwise the network (saved for next time).
async function fromCache(request) {
  const cache = await caches.open(APP_CACHE);
  const saved = await cache.match(request, { ignoreSearch: true });
  if (saved) return saved;
  const response = await fetch(request);
  const key = new URL(typeof request === "string" ? request : request.url);
  key.search = ""; // one saved copy per file, never one per "?v="
  if (response.ok && response.type === "basic") await cache.put(key.href, response.clone()).catch(() => {});
  return response;
}

// Compare each saved app file with the server's copy and save any that changed.
// If something changed, tell the open pages so they reload once with the new version.
// Files are downloaded in full ("no-store") and compared byte for byte, so a server that
// wrongly answers "not modified" can't hide a change. They're small: ~30 KB in total.
async function checkForUpdate() {
  if (Date.now() - lastCheck < MIN_GAP_BETWEEN_CHECKS_MS) return;
  lastCheck = Date.now();
  const cache = await caches.open(APP_CACHE);

  const results = await Promise.allSettled(APP_FILES.map(async (file) => {
    const url = new URL(file, SCOPE).href;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok || response.type !== "basic") return false;
    const saved = await cache.match(url);
    if (saved && sameBytes(await saved.arrayBuffer(), await response.clone().arrayBuffer())) return false;
    await cache.put(url, response);
    return Boolean(saved);
  }));

  if (results.some((result) => result.status === "fulfilled" && result.value)) {
    for (const page of await self.clients.matchAll({ type: "window" })) page.postMessage({ type: "updated" });
  }
}

// Fonts: saved copy if there is one; otherwise fetch it, save it and use it.
async function font(request) {
  const cache = await caches.open(FONT_CACHE);
  const saved = await cache.match(request.url, { ignoreVary: true });
  if (saved) return saved;
  const response = await fetch(request.url, { mode: "cors", credentials: "omit" });
  if (response.ok) await cache.put(request.url, response.clone()).catch(() => {});
  return response;
}

// Save the font stylesheet plus the Latin font files it points to.
async function saveFonts() {
  const cache = await caches.open(FONT_CACHE);
  if (await cache.match(FONT_CSS, { ignoreVary: true })) return;
  const response = await fetch(FONT_CSS, { mode: "cors", credentials: "omit", cache: "reload" });
  if (!response.ok) return;
  const css = await response.clone().text();
  // Google labels each @font-face block with its character set, e.g. /* latin */.
  const latin = [...css.matchAll(/\/\*\s*latin(?:-ext)?\s*\*\/\s*@font-face\s*\{[^}]*?url\(\s*['"]?([^'")\s]+)/g)]
    .map((match) => match[1]);
  const files = latin.length ? latin : css.match(/https:\/\/fonts\.gstatic\.com\/[^'")\s]+/g) || [];
  await Promise.all([...new Set(files)].map(async (file) => {
    const fontFile = await fetch(file, { mode: "cors", credentials: "omit" });
    if (fontFile.ok) await cache.put(file, fontFile);
  }));
  await cache.put(FONT_CSS, response); // saved last, so an interrupted download is retried next time
}

function sameBytes(a, b) {
  if (a.byteLength !== b.byteLength) return false;
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
  return true;
}
