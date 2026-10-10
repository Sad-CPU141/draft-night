// A small in-memory stand-in for the Firebase compat API (app/auth/database), shared by
// several simulated phones. It mimics what Draft Night relies on: async event delivery,
// value/child_added listeners, update/set/remove/push/transaction, onDisconnect,
// .info/connected, server timestamps, offline write queues, and the key security rules
// from database.rules.json (actions must carry your own uid; only the host writes state/live/lobby).
const clone = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
const split = (p) => String(p || '').split('/').filter(Boolean);

function createServer({ latency = 2 } = {}) {
  const server = { data: {}, clients: new Set(), pushSeq: 0, rejected: [] };
  const getAt = (parts) => { let n = server.data; for (const k of parts) { if (n == null || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : n; };
  const prune = (o) => { if (o && typeof o === 'object') { Object.keys(o).forEach((k) => { o[k] = prune(o[k]); if (o[k] === null || o[k] === undefined) delete o[k]; }); return Object.keys(o).length ? o : null; } return o; };
  const resolveTs = (v) => { if (v && typeof v === 'object') { if (v['.sv'] === 'timestamp') return Date.now(); const o = Array.isArray(v) ? [] : {}; Object.keys(v).forEach((k) => { o[k] = resolveTs(v[k]); }); return o; } return v; };
  const setAt = (parts, v) => {
    v = prune(resolveTs(clone(v)));
    if (!parts.length) { server.data = v || {}; return; }
    let n = server.data;
    for (let i = 0; i < parts.length - 1; i++) { if (!n[parts[i]] || typeof n[parts[i]] !== 'object') n[parts[i]] = {}; n = n[parts[i]]; }
    if (v === null) delete n[parts[parts.length - 1]]; else n[parts[parts.length - 1]] = v;
    server.data = prune(server.data) || {};
  };
  // Simplified security rules (mirrors database.rules.json).
  const allowed = (uid, parts, v) => {
    if (!uid) return false;
    if (parts[0] !== 'rooms' || parts.length < 3) return false;
    const room = getAt(parts.slice(0, 2)) || {};
    const host = room.meta && room.meta.host;
    const member = !!(room.players && room.players[uid]);
    const section = parts[2];
    if (section === 'meta') return !room.meta || host === uid || member;
    if (section === 'players') return parts[3] === uid || host === uid;
    if (section === 'presence') return parts[3] === uid;
    if (['state', 'live', 'lobby', 'hist'].includes(section)) return host === uid;
    if (section === 'actions') { if (parts.length === 4) { const exists = !!(room.actions && room.actions[parts[3]]); return (!exists && v && v.by === uid) || host === uid; } return host === uid; }
    return false;
  };
  const notify = () => { server.clients.forEach((c) => c.deliver()); };
  server.apply = (client, parts, v, kind) => {
    if (!allowed(client.uid, parts, v)) { server.rejected.push({ uid: client.uid, path: parts.join('/'), kind }); return false; }
    setAt(parts, v); notify(); return true;
  };
  server.getAt = getAt;
  server.client = (opts) => makeClient(server, opts || {});
  server.disconnect = (uid) => server.clients.forEach((c) => { if (c.uid === uid) c.goOffline(); });
  server.reconnect = (uid) => server.clients.forEach((c) => { if (c.uid === uid) c.goOnline(); });
  server.latency = latency;
  return server;
}

function makeClient(server, { uid }) {
  const c = { uid: null, presetUid: uid, online: true, listeners: [], queue: [], onDisc: [], authUser: null, dead: false };
  server.clients.add(c);
  const later = (f) => setTimeout(f, server.latency);
  const snap = (parts, val) => ({ key: parts.length ? parts[parts.length - 1] : null, val: () => clone(val), exists: () => val !== null && val !== undefined });
  c.deliver = () => {
    if (!c.online || c.dead) return;
    c.listeners.forEach((l) => {
      if (l.path === '.info/connected') return;
      const v = server.getAt(l.parts);
      if (l.ev === 'value') { const s = JSON.stringify(v); if (s !== l.last) { l.last = s; later(() => { if (c.online && !c.dead && c.listeners.includes(l)) l.cb(snap(l.parts, clone(v))); }); } }
      else if (l.ev === 'child_added') { const keys = v && typeof v === 'object' ? Object.keys(v) : []; keys.forEach((k) => { if (!l.seen.has(k)) { l.seen.add(k); const cv = clone(v[k]); later(() => { if (c.online && !c.dead && c.listeners.includes(l)) l.cb(snap([...l.parts, k], cv)); }); } }); }
    });
  };
  const write = (parts, v, kind) => new Promise((resolve, reject) => {
    const run = () => { const ok = server.apply(c, parts, v, kind); if (ok) resolve(); else reject(Object.assign(new Error('PERMISSION_DENIED'), { code: 'PERMISSION_DENIED' })); };
    if (c.online) later(run); else c.queue.push(run);
  });
  c.goOffline = () => {
    if (!c.online) return;
    c.online = false;
    const ops = c.onDisc; c.onDisc = [];
    ops.forEach((f) => f());
    c.listeners.filter((l) => l.path === '.info/connected').forEach((l) => later(() => l.cb(snap(['connected'], false))));
  };
  c.goOnline = () => {
    if (c.online) return;
    c.online = true;
    c.listeners.forEach((l) => { l.last = undefined; });
    const q = c.queue; c.queue = []; q.forEach((f) => later(f));
    c.listeners.filter((l) => l.path === '.info/connected').forEach((l) => later(() => l.cb(snap(['connected'], true))));
    c.deliver();
  };
  c.close = () => { c.goOffline(); c.dead = true; server.clients.delete(c); };
  const ref = (path) => {
    const parts = split(path);
    const r = {
      key: parts[parts.length - 1] || null,
      child: (p) => ref(parts.concat(split(p)).join('/')),
      set: (v) => write(parts, v, 'set'),
      remove: () => write(parts, null, 'remove'),
      update: (obj) => new Promise((resolve, reject) => {
        const run = () => {
          const ok = Object.keys(obj).every((k) => server.apply(c, parts.concat(split(k)), obj[k], 'update'));
          if (ok) resolve(); else reject(Object.assign(new Error('PERMISSION_DENIED'), { code: 'PERMISSION_DENIED' }));
        };
        if (c.online) later(run); else c.queue.push(run);
      }),
      push: (v) => { const k = 'k' + String(Date.now()).padStart(15, '0') + String(server.pushSeq++).padStart(6, '0'); const p = write(parts.concat(k), v, 'push'); const child = ref(parts.concat(k).join('/')); child.then = (a, b) => p.then(a, b); child.catch = (b) => p.catch(b); return child; },
      once: () => new Promise((resolve, reject) => { const run = () => resolve(snap(parts, clone(server.getAt(parts)))); if (c.online) later(run); else reject(new Error('offline')); }),
      on: (ev, cb) => {
        const l = { path, parts, ev, cb, seen: new Set(), last: undefined };
        c.listeners.push(l);
        if (path === '.info/connected') { later(() => cb(snap(['connected'], c.online))); return cb; }
        c.deliver();
        return cb;
      },
      off: (ev, cb) => { c.listeners = c.listeners.filter((l) => !(l.path === path && l.ev === ev && l.cb === cb)); },
      transaction: (fn) => new Promise((resolve, reject) => {
        const run = () => { const cur = clone(server.getAt(parts)); const next = fn(cur); if (next === undefined) { resolve({ committed: false, snapshot: snap(parts, cur) }); return; } const ok = server.apply(c, parts, next, 'transaction'); if (ok) resolve({ committed: true, snapshot: snap(parts, next) }); else reject(new Error('PERMISSION_DENIED')); };
        if (c.online) later(run); else reject(new Error('offline'));
      }),
      onDisconnect: () => ({
        remove: () => { c.onDisc.push(() => server.apply(c, parts, null, 'onDisconnect')); return Promise.resolve(); },
        set: (v) => { c.onDisc.push(() => server.apply(c, parts, v, 'onDisconnect')); return Promise.resolve(); },
      }),
    };
    return r;
  };
  const database = () => ({ ref });
  database.ServerValue = { TIMESTAMP: { '.sv': 'timestamp' } };
  const auth = () => ({
    get currentUser() { return c.authUser; },
    onAuthStateChanged: (cb) => { later(() => cb(c.authUser)); return () => {}; },
    signInAnonymously: () => new Promise((resolve) => later(() => { c.uid = c.presetUid || 'u' + Math.random().toString(36).slice(2, 10); c.authUser = { uid: c.uid }; resolve({ user: c.authUser }); })),
  });
  if (uid && c.presetUid && c.presetSignedIn) c.authUser = { uid };
  return { apps: [{}], initializeApp: () => {}, auth, database, _client: c };
}

module.exports = { createServer };
