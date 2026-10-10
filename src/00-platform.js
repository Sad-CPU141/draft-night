const { useState, useEffect, useRef, useMemo } = React;

/* ============================================================
   STORAGE
   Everything lives in an in-memory copy that the UI reads synchronously.
   Writes go to IndexedDB (big quota, holds photos), falling back to
   localStorage, then to memory only. The game never waits on storage.
   ============================================================ */
const K = { topics: 'dn_topics_v1', current: 'dn_current_v1', past: 'dn_past_v1', managers: 'dn_managers_v1', seen: 'dn_starters_seen_v1', settings: 'dn_settings_v1' };
const STORE_KEYS = Object.values(K);

const store = (() => {
  const mem = {};
  let backend = 'memory';
  let db = null;
  let onError = null;
  const pending = new Map();
  let timer = null;

  const lsGet = (k) => { try { const v = localStorage.getItem(k); return v == null ? undefined : JSON.parse(v); } catch (e) { return undefined; } };
  function openIDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
      let req;
      try { req = indexedDB.open('draft-night', 1); } catch (e) { return reject(e); }
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('kv')) req.result.createObjectStore('kv'); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('IndexedDB blocked'));
      setTimeout(() => reject(new Error('IndexedDB timed out')), 5000);
    });
  }
  const idbReq = (mode, fn) => new Promise((resolve, reject) => {
    const tx = db.transaction('kv', mode); const st = tx.objectStore('kv'); const r = fn(st);
    tx.oncomplete = () => resolve(r && r.result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('aborted'));
  });
  // Keys and values are read in ONE transaction so another tab (e.g. a TV window) saving
  // at the same moment can't shift them out of step.
  function idbAll() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readonly'); const st = tx.objectStore('kv');
      const kr = st.getAllKeys(); const vr = st.getAll();
      tx.oncomplete = () => { const out = {}; (kr.result || []).forEach((k, i) => { out[k] = vr.result[i]; }); resolve(out); };
      tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('aborted'));
    });
  }
  function report(err) {
    const quota = err && (err.name === 'QuotaExceededError' || /quota/i.test(String(err.message || err)));
    if (onError) onError(quota
      ? 'Storage is full, so recent changes may not be saved. Remove some uploaded photos or old drafts, and export a backup.'
      : "This device isn't saving right now. The game keeps working, but export a backup before closing the page.");
  }
  async function flush() {
    timer = null;
    const batch = [...pending.entries()]; pending.clear();
    if (!batch.length || backend === 'memory') return;
    try {
      if (backend === 'indexeddb') {
        await idbReq('readwrite', (st) => { batch.forEach(([k, v]) => (v === undefined ? st.delete(k) : st.put(v, k))); return null; });
      } else {
        batch.forEach(([k, v]) => (v === undefined ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v))));
      }
    } catch (e) { report(e); }
  }
  const schedule = () => { if (!timer) timer = setTimeout(flush, 120); };

  return {
    async init() {
      try {
        db = await openIDB();
        Object.assign(mem, await idbAll());
        backend = 'indexeddb';
        if (!STORE_KEYS.some((k) => mem[k] !== undefined)) {
          STORE_KEYS.forEach((k) => { const v = lsGet(k); if (v !== undefined) { mem[k] = v; pending.set(k, v); } });
          await flush();
        }
      } catch (e) {
        db = null;
        try {
          localStorage.setItem('dn__probe', '1'); localStorage.removeItem('dn__probe');
          STORE_KEYS.forEach((k) => { const v = lsGet(k); if (v !== undefined) mem[k] = v; });
          backend = 'localStorage';
        } catch (e2) { backend = 'memory'; }
      }
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
      window.addEventListener('pagehide', () => flush());
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
    },
    get(k, fallback) { const v = mem[k]; return v === undefined || v === null ? fallback : v; },
    set(k, v) { mem[k] = v; pending.set(k, v); schedule(); return true; },
    del(k) { delete mem[k]; pending.set(k, undefined); schedule(); return true; },
    flush,
    get backend() { return backend; },
    set onError(fn) { onError = fn; },
  };
})();

/* ============================================================
   WIKIPEDIA PHOTOS
   Looks up an article's lead image (free-licensed only) in batches of 50,
   caches results, and never blocks the game. Misses fall back to art.
   ============================================================ */
const wiki = (() => {
  const CACHE_KEY = 'dn_wiki_cache_v1';
  const FOUND_TTL = 30 * 864e5, MISS_TTL = 3 * 864e5, ERROR_TTL = 10 * 60e3;
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch (e) { cache = {}; }
  const listeners = new Map();
  const queue = new Set();
  let timer = null;
  let saveTimer = null;
  const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) {} }, 400); };
  const fresh = (e) => e && Date.now() - e.t < (e.u ? FOUND_TTL : e.err ? ERROR_TTL : MISS_TTL);
  const emit = (title) => { const ls = listeners.get(title); if (ls) ls.forEach((fn) => fn()); };

  async function fetchBatch(titles) {
    const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&redirects=1'
      + '&prop=pageimages%7Cpageprops&ppprop=disambiguation&piprop=thumbnail&pithumbsize=480&titles=' + titles.map(encodeURIComponent).join('%7C');
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const q = data.query || {};
    const hop = {}; [...(q.normalized || []), ...(q.redirects || [])].forEach((m) => { hop[m.from] = m.to; });
    const pages = {}; (q.pages || []).forEach((p) => { pages[p.title] = p; });
    titles.forEach((t) => {
      let cur = t; for (let i = 0; i < 4 && hop[cur]; i++) cur = hop[cur];
      const p = pages[cur];
      const ok = p && !p.missing && !(p.pageprops && 'disambiguation' in p.pageprops) && p.thumbnail && p.thumbnail.source;
      cache[t] = { u: ok ? p.thumbnail.source : null, page: p && !p.missing ? p.title : null, t: Date.now() };
    });
  }
  async function run() {
    timer = null;
    const titles = [...queue]; queue.clear();
    for (let i = 0; i < titles.length; i += 50) {
      const chunk = titles.slice(i, i + 50);
      try { await fetchBatch(chunk); }
      catch (e) { chunk.forEach((t) => { cache[t] = { u: null, err: true, t: Date.now() }; }); }
      chunk.forEach(emit);
    }
    save();
  }
  function request(title) {
    if (!title || fresh(cache[title]) || queue.has(title)) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    queue.add(title);
    if (!timer) timer = setTimeout(run, 40);
  }
  return {
    // undefined = still looking, null = no photo, string = image URL
    peek(title) { const e = cache[title]; return e ? e.u : undefined; },
    page(title) { const e = cache[title]; return e && e.page; },
    request,
    prefetch(titles) { titles.forEach(request); },
    subscribe(title, fn) { if (!listeners.has(title)) listeners.set(title, new Set()); listeners.get(title).add(fn); return () => listeners.get(title).delete(fn); },
    clear() { cache = {}; try { localStorage.removeItem(CACHE_KEY); } catch (e) {} },
    get size() { return Object.keys(cache).length; },
  };
})();

function useWikiImage(title) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!title) return undefined;
    const off = wiki.subscribe(title, () => force((x) => x + 1));
    wiki.request(title);
    return off;
  }, [title]);
  return title ? wiki.peek(title) : null;
}

/* ============================================================
   FILES: download, share, read
   ============================================================ */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
async function shareFile(blob, filename, title) {
  try {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title }); return 'shared'; }
  } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  return 'unsupported';
}
const canShareFiles = () => { try { return !!(navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.png', { type: 'image/png' })] })); } catch (e) { return false; } };
const todayStamp = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

/* ============================================================
   BACKUP FORMAT (versioned)
   ============================================================ */
const BACKUP_FORMAT = 1;
function makeBackup(state) {
  return { app: 'draft-night', format: BACKUP_FORMAT, exportedAt: new Date().toISOString(),
    data: { topics: state.topics, past: state.past, current: state.draft || null, managers: state.managers, seen: store.get(K.seen, null), settings: state.settings || {} } };
}
// Returns { ok, error, data, summary }
function validateBackup(obj) {
  if (!obj || typeof obj !== 'object') return { ok: false, error: "That file isn't a Draft Night backup." };
  if (obj.app !== 'draft-night') return { ok: false, error: "That file isn't a Draft Night backup." };
  if (typeof obj.format !== 'number' || obj.format > BACKUP_FORMAT) return { ok: false, error: 'This backup was made by a newer version of Draft Night. Reload the site to update, then try again.' };
  const d = obj.data || {};
  if (!Array.isArray(d.topics) || !Array.isArray(d.past)) return { ok: false, error: 'This backup is missing its topics or drafts, so it can’t be restored.' };
  const badTopic = d.topics.find((t) => !t || typeof t.id !== 'string' || typeof t.name !== 'string' || !Array.isArray(t.items) || !Array.isArray(t.slots));
  if (badTopic) return { ok: false, error: 'One of the topics in this backup is damaged, so it can’t be restored.' };
  const badDraft = [...d.past, ...(d.current ? [d.current] : [])].find((x) => !x || !Array.isArray(x.managers) || !x.items || !x.rules);
  if (badDraft) return { ok: false, error: 'One of the drafts in this backup is damaged, so it can’t be restored.' };
  const photos = d.topics.reduce((n, t) => n + t.items.filter((i) => i && i.photo).length, 0);
  return { ok: true, data: d, summary: { topics: d.topics.length, items: d.topics.reduce((n, t) => n + t.items.length, 0), photos, past: d.past.length, current: !!d.current, exportedAt: obj.exportedAt } };
}

/* ============================================================
   APP INSTALL + UPDATES (service worker)
   ============================================================ */
const pwa = (() => {
  let deferred = null; let waiting = null; const subs = new Set();
  const emit = () => subs.forEach((fn) => fn());
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; emit(); });
  window.addEventListener('appinstalled', () => { deferred = null; emit(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        const watch = (w) => { if (!w) return; w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) { waiting = w; emit(); } }); };
        if (reg.waiting && navigator.serviceWorker.controller) { waiting = reg.waiting; emit(); }
        reg.addEventListener('updatefound', () => watch(reg.installing));
        setInterval(() => reg.update().catch(() => {}), 30 * 60e3);
      }).catch(() => {});
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
    });
  }
  return {
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    get canPrompt() { return !!deferred; },
    async prompt() { if (!deferred) return; deferred.prompt(); try { await deferred.userChoice; } catch (e) {} deferred = null; emit(); },
    get updateReady() { return !!waiting; },
    applyUpdate() { store.flush(); if (waiting) waiting.postMessage('skipWaiting'); else location.reload(); },
    get standalone() { try { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) { return false; } },
  };
})();
function usePwa() { const [, f] = useState(0); useEffect(() => pwa.subscribe(() => f((x) => x + 1)), []); return pwa; }
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Game pacing. Tests set window.__DN_TEST_SPEED to run timers faster; players always get 1.
const GAME_SPEED = (typeof window !== 'undefined' && window.__DN_TEST_SPEED) || 1;
const ms = (n) => Math.max(1, Math.round(n * GAME_SPEED));
