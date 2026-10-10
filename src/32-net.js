/* ============================================================
   ONLINE ROOMS (Firebase Realtime Database, free Spark plan).

   How it works — the host's phone is the referee:
   · The host runs the game with exactly the same engine as Local/Solo
     (bots, clock, cards, trades, votes, finale), then publishes the draft.
   · Other phones never change the game directly. They send small "actions"
     (bid $5 for my team, vote for X…). The host checks each one belongs to
     that phone's own team/player, applies it with the normal engine
     function, and publishes the result. Two bids at once? First one wins.
   · The draft is stored one top-level key per JSON string, and only keys
     that changed are re-sent, so a bid costs a few hundred bytes.
   · Presence: each phone marks itself online; Firebase clears it if the
     connection drops. A player gone for 60s gets a bot covering their seat
     until they're back. If the host goes, the next player takes over and
     carries on from the published state.
   ============================================================ */

const FB_CONFIG = {
  apiKey: 'AIzaSyCjw0jMkbljpMKol013HCe_l_h8nzNLtCY',
  authDomain: 'draft-night-125a6.firebaseapp.com',
  databaseURL: 'https://draft-night-125a6-default-rtdb.firebaseio.com',
  projectId: 'draft-night-125a6',
  storageBucket: 'draft-night-125a6.firebasestorage.app',
  messagingSenderId: '483436244846',
  appId: '1:483436244846:web:ef3f78656ffa791ed79b7f',
};
const FB_VER = '10.14.1';
const ROOM_ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ONLINE = { maxTeams: 8, maxTeamSize: 4, maxPeople: 16, coverAfter: 60000, hostGrace: 8000, clocks: [6, 10, 15, 20], clock: 10 };
const LAST_ROOM = 'dn_last_room';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script'); s.src = src; s.async = true;
    s.onload = resolve; s.onerror = () => reject(new Error('load ' + src));
    document.head.appendChild(s);
  });
}
let fbReady = null;
// Firebase is only downloaded when someone goes online, so offline play stays light.
function loadFirebase() {
  if (window.__DN_FAKE_FB) return Promise.resolve(window.__DN_FAKE_FB);
  if (fbReady) return fbReady;
  fbReady = ['app', 'auth', 'database'].reduce((p, n) => p.then(() => (window.firebase && n === 'app' ? null : loadScript('vendor/firebase-' + n + '-compat.js?v=' + FB_VER))), Promise.resolve())
    .then(() => { const fb = window.firebase; if (!fb.apps.length) fb.initializeApp(FB_CONFIG); return fb; });
  fbReady.catch(() => { fbReady = null; });
  return fbReady;
}
// Anonymous sign-in: no account, but the phone keeps the same id, which is how rejoining works.
function signIn(fb) {
  const a = fb.auth();
  return new Promise((resolve, reject) => {
    const off = a.onAuthStateChanged((u) => {
      off();
      if (u) resolve(u.uid);
      else a.signInAnonymously().then((c) => resolve(c.user.uid), reject);
    }, reject);
  });
}
const roomCode = () => Array.from({ length: 5 }, () => ROOM_ALPHA[Math.floor(Math.random() * ROOM_ALPHA.length)]).join('');
const cleanCode = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
const netError = (e) => {
  const m = String((e && (e.code || e.message)) || e || '');
  if (/permission|PERMISSION_DENIED/i.test(m)) return 'The online server refused that. If you just set up Firebase, check the security rules were published.';
  if (/operation-not-allowed|admin-restricted/i.test(m)) return 'Anonymous sign-in isn’t switched on in Firebase (Authentication → Sign-in method → Anonymous).';
  if (/unauthorized-domain/i.test(m)) return 'This website isn’t on Firebase’s authorised domains list (Authentication → Settings).';
  if (/network|offline|load /i.test(m)) return 'Couldn’t reach the online server. Check your internet connection and try again.';
  return 'Something went wrong going online (' + m.slice(0, 80) + ').';
};
function saveLastRoom(v) { try { if (v) localStorage.setItem(LAST_ROOM, JSON.stringify(v)); else localStorage.removeItem(LAST_ROOM); } catch (e) {} }
function lastRoom() { try { const v = JSON.parse(localStorage.getItem(LAST_ROOM) || 'null'); return v && Date.now() - v.at < 12 * 3600e3 ? v : null; } catch (e) { return null; } }

/* ---------- ownership: which teams and players a phone controls ---------- */
function ownerInfo(d, uid) {
  const teams = new Set(), parts = new Set();
  if (!d || !uid) return { teams, parts };
  d.managers.forEach((m) => {
    if (m.members) m.members.forEach((p) => { if (p.uid === uid) { teams.add(m.id); parts.add(p.id); } });
    else if (m.uid === uid) { teams.add(m.id); parts.add(m.id); }
  });
  return { teams, parts };
}
// Every human seat in the game: { uid, teamId, partId, name }.
function humanSeats(d) {
  const out = [];
  d.managers.forEach((m) => {
    if (m.members) m.members.forEach((p) => { if (p.uid) out.push({ uid: p.uid, teamId: m.id, partId: p.id, name: p.name, covered: !!p.cover }); });
    else if (m.uid) out.push({ uid: m.uid, teamId: m.id, partId: m.id, name: m.name, covered: !!m.cover });
  });
  return out;
}
const COVER_BOT = { type: 'needs', level: 'medium' };
// A bot keeps an away player's seat warm. Flagged so it hands back the moment they return.
function setCover(d, uid, on) {
  let changed = false;
  const fix = (x) => {
    if (x.uid !== uid || !!x.cover === on) return x;
    changed = true;
    if (on) return { ...x, bot: { ...COVER_BOT }, cover: true };
    const { bot, cover, ...rest } = x; return rest;
  };
  const managers = d.managers.map((m) => (m.members ? { ...m, members: m.members.map(fix) } : fix(m)));
  return changed ? { ...d, managers } : d;
}
// A player on a new phone (or after clearing their browser) takes back an away seat.
function claimSeat(d, oldUid, newUid) {
  const fix = (x) => (x.uid === oldUid ? (() => { const { bot, cover, ...rest } = x; return x.cover ? { ...rest, uid: newUid } : { ...x, uid: newUid }; })() : x);
  return { ...d, managers: d.managers.map((m) => (m.members ? { ...m, members: m.members.map(fix) } : fix(m))) };
}

/* ---------- group vote (one per player, never for your own team) ---------- */
function castVote(d, pid, target) {
  if (d.votesRevealed || hasVoted(d, pid)) return d;
  const p = participants(d).find((x) => x.id === pid); if (!p) return d;
  const choices = voteChoices(d, p.teamId).map((m) => m.id);
  if (target == null ? choices.length : !choices.includes(target)) return d;
  return { ...d, votes: { ...(d.votes || {}), [pid]: target == null ? null : target } };
}
// Bots (and covered seats) vote at the reveal, never for their own team.
function fillBotVotes(d) {
  const votes = { ...(d.votes || {}) };
  participants(d).filter((p) => p.bot && !Object.prototype.hasOwnProperty.call(votes, p.id)).forEach((p) => {
    votes[p.id] = botVote(d, { ...teamOf(d, p.teamId), name: p.name, bot: p.bot, speaker: p.id, teamId: p.teamId });
  });
  return { ...d, votes };
}

/* ---------- player actions: the only ways a phone can change the game ----------
   who = { teams, parts } for an online phone, or null locally (anyone can do anything). */
const owns = (who, teamId) => !who || who.teams.has(teamId);
const ownsPart = (who, pid) => !who || who.parts.has(pid);
const findTrade = (d, id) => (d.trade ? d.trade.proposals.find((t) => t.id === id) : null);
const NET_ACTIONS = {
  bid: (d, [mid, amt, dbl], who) => (d.phase === 'auction' && owns(who, mid) && typeof amt === 'number' ? placeBid(d, mid, amt, dbl ? { double: true } : undefined) : d),
  card: (d, [by, card, params], who) => (d.phase === 'auction' && owns(who, by) && CARD_INFO[card] ? playCard(d, by, card, params || {}) : d),
  veto: (d, [yes, pid], who) => (d.pending && d.pending.id === pid && owns(who, d.pending.target) ? answerCard(d, !!yes) : d),
  nominate: (d, [id], who) => { const c = d.phase === 'nominate' && currentNominator(d); return c && owns(who, c.m.id) ? nominate(d, id) : d; },
  freePick: (d, [id], who) => { const c = d.phase === 'freepick' && currentPicker(d); return c && owns(who, c.m.id) && d.leftover.includes(id) && canTake(d, c.m, id) ? freePick(d, id) : d; },
  propose: (d, [t], who) => (d.phase === 'trade' && t && owns(who, t.from) ? proposeTrade(d, t, Date.now()) : d),
  accept: (d, [id], who) => { const t = findTrade(d, id); return t && t.status === 'pending' && owns(who, t.to) ? acceptTrade(d, id) : d; },
  reject: (d, [id], who) => { const t = findTrade(d, id); return t && t.status === 'pending' && owns(who, t.to) ? rejectTrade(d, id) : d; },
  cancel: (d, [id], who) => { const t = findTrade(d, id); return t && t.status === 'pending' && owns(who, t.from) ? cancelTrade(d, id) : d; },
  vote: (d, [pid, target], who) => (d.phase === 'done' && ownsPart(who, pid) ? castVote(d, pid, target) : d),
  matchVote: (d, [r, i, pid, team], who) => (d.finale && d.finale.bracket && ownsPart(who, pid) && d.finale.bracket.rounds[r] && d.finale.bracket.rounds[r][i] ? castMatchVote(d, r, i, pid, team) : d),
};
function runAction(d, name, args, who) {
  const fn = NET_ACTIONS[name];
  if (!fn || !d || !Array.isArray(args)) return d;
  try { return fn(d, args, who) || d; } catch (e) { return d; }
}

/* ---------- the room connection ---------- */
// Strip what doesn't belong online: big uploaded photos and the host's undo history.
function onlineTopic(t) { return { ...t, items: t.items.map((it) => { const { photo, imageData, ...rest } = it; return rest; }) }; }
const NO_SYNC = new Set(['history']);

class Room {
  constructor(fb, uid, code) {
    this.fb = fb; this.db = fb.database(); this.uid = uid; this.code = code;
    this.base = 'rooms/' + code + '/';
    this.meta = null; this.players = {}; this.presence = {}; this.lobby = null; this.live = {}; this.state = null;
    this.connected = true; this.kind = 'player';
    this.subs = new Set(); this.offs = []; this.sent = {}; this.liveSent = {}; this.stateCache = {}; this.liveCache = {};
    this.awaySince = {}; this.closed = false; this.onAction = null; this.seen = new Set();
  }
  ref(p) { return this.db.ref(this.base + (p || '')); }
  get amHost() { return !!(this.meta && this.meta.host === this.uid); }
  emit() { this.subs.forEach((f) => { try { f(this); } catch (e) {} }); }
  subscribe(f) { this.subs.add(f); return () => this.subs.delete(f); }
  listen(path, ev, fn) { const r = typeof path === 'string' ? this.ref(path) : path; r.on(ev, fn); this.offs.push(() => r.off(ev, fn)); }

  static async connect() { const fb = await loadFirebase(); const uid = await signIn(fb); return { fb, uid }; }
  static async create(profile) {
    const { fb, uid } = await Room.connect();
    const db = fb.database();
    let code = null;
    for (let i = 0; i < 6 && !code; i++) { const c = roomCode(); const snap = await db.ref('rooms/' + c + '/meta').once('value'); if (!snap.exists()) code = c; }
    if (!code) throw new Error('Couldn’t find a free room code. Try again.');
    const room = new Room(fb, uid, code);
    await room.ref('meta').set({ host: uid, createdAt: fb.database.ServerValue.TIMESTAMP, status: 'lobby', v: 1 });
    await room.ref('players/' + uid).set({ name: profile.name, emoji: profile.emoji, color: profile.color, kind: 'player', team: 0, joinedAt: fb.database.ServerValue.TIMESTAMP });
    await room.start();
    return room;
  }
  static async join(code, profile, kind) {
    const { fb, uid } = await Room.connect();
    const room = new Room(fb, uid, code);
    const meta = (await room.ref('meta').once('value')).val();
    if (!meta) throw new Error('No room with code ' + code + '. Check the code with the host.');
    if (meta.status === 'closed') throw new Error('That room has ended.');
    const players = (await room.ref('players').once('value')).val() || {};
    const me = players[uid];
    room.kind = kind === 'tv' ? 'tv' : 'player';
    if (!me && room.kind === 'player') {
      const people = Object.values(players).filter((p) => p.kind !== 'tv').length;
      if (people >= ONLINE.maxPeople) throw new Error('That room is full (' + ONLINE.maxPeople + ' players).');
    }
    if (!me || me.kind !== room.kind || (profile && (me.name !== profile.name || me.emoji !== profile.emoji))) {
      await room.ref('players/' + uid).update({ ...(me ? {} : { joinedAt: fb.database.ServerValue.TIMESTAMP, team: 0 }), kind: room.kind, ...(room.kind === 'tv' ? { name: 'TV', emoji: '📺', color: '#ffffff' } : { name: profile.name, emoji: profile.emoji, color: profile.color }) });
    }
    await room.start();
    return room;
  }
  async start() {
    saveLastRoom({ code: this.code, at: Date.now(), kind: this.kind });
    const me = this.ref('presence/' + this.uid);
    this.listen(this.db.ref('.info/connected'), 'value', (s) => {
      this.connected = s.val() !== false;
      if (s.val() === true) { me.onDisconnect().remove(); me.set(true); }
      this.emit();
    });
    const json = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };
    this.listen('meta', 'value', (s) => { this.meta = s.val(); if (!this.meta && !this.closed) { this.meta = { status: 'closed' }; } this.emit(); this.checkHost(); });
    this.listen('players', 'value', (s) => { this.players = s.val() || {}; this.emit(); this.checkHost(); });
    this.listen('presence', 'value', (s) => { this.presence = s.val() || {}; this.emit(); this.checkHost(); });
    this.listen('lobby', 'value', (s) => { this.lobby = s.val() ? json(s.val()) : null; this.emit(); });
    this.listen('state', 'value', (s) => {
      const v = s.val();
      if (!v) { this.state = null; this.stateCache = {}; this.emit(); return; }
      const d = {}; const cache = {};
      Object.keys(v).forEach((k) => { cache[k] = { raw: v[k], val: this.stateCache[k] && this.stateCache[k].raw === v[k] ? this.stateCache[k].val : json(v[k]) }; d[k] = cache[k].val; });
      this.stateCache = cache; this.state = d; this.emit();
    });
    this.listen('live', 'value', (s) => {
      const v = s.val() || {}; const o = {};
      Object.keys(v).forEach((k) => { o[k] = this.liveCache[k] && this.liveCache[k].raw === v[k] ? this.liveCache[k].val : json(v[k]); this.liveCache[k] = { raw: v[k], val: o[k] }; });
      this.live = o; this.emit();
    });
    this.listen('actions', 'child_added', (s) => this.handleAction(s.key, s.val()));
  }
  handleAction(key, a) {
    if (!this.amHost || !this.onAction || this.seen.has(key)) return;
    this.seen.add(key);
    let body = null; try { body = JSON.parse((a || {}).json); } catch (e) {}
    const done = () => this.ref('actions/' + key).remove().catch(() => {});
    if (!body || typeof body.name !== 'string' || !a.by) { done(); return; }
    this.onAction({ id: key, by: a.by, name: body.name, args: Array.isArray(body.args) ? body.args : [] }, done);
  }
  // A new host picks up any actions that arrived while the old host was gone.
  async drainActions() { const v = (await this.ref('actions').once('value')).val() || {}; Object.keys(v).forEach((k) => this.handleAction(k, v[k])); }
  online(uid) { return !!this.presence[uid]; }
  people() { return Object.entries(this.players).map(([uid, p]) => ({ uid, ...p, online: this.online(uid) })).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0)); }
  // Host gone for a few seconds? The earliest-joined player who's online takes over (one winner, via a transaction).
  checkHost() {
    if (!this.meta || this.meta.status === 'closed' || this.kind === 'tv' || !this.players[this.uid]) return;
    const host = this.meta.host;
    if (host === this.uid || this.online(host)) { clearTimeout(this.hostTimer); this.hostTimer = null; return; }
    if (this.hostTimer) return;
    this.hostTimer = setTimeout(() => {
      this.hostTimer = null;
      const cur = this.meta && this.meta.host;
      if (!cur || cur === this.uid || this.online(cur)) return;
      const next = this.people().find((p) => p.online && p.kind !== 'tv');
      if (!next || next.uid !== this.uid) return;
      this.ref('meta/host').transaction((h) => (h === cur ? this.uid : h)).then(() => this.emit()).catch(() => {});
    }, ms(ONLINE.hostGrace));
  }
  send(name, args) {
    if (this.amHost && this.onAction) { this.onAction({ id: 'local', by: this.uid, name, args }, () => {}); return; }
    this.ref('actions').push({ by: this.uid, json: JSON.stringify({ name, args }), at: this.fb.database.ServerValue.TIMESTAMP }).catch(() => {});
  }
  // Publish only the top-level keys that changed.
  publish(d) {
    if (!this.amHost) return;
    const out = {}; let n = 0;
    const keys = new Set([...Object.keys(d || {}), ...Object.keys(this.sent)]);
    keys.forEach((k) => {
      if (NO_SYNC.has(k)) return;
      const v = d && d[k] !== undefined ? JSON.stringify(d[k]) : null;
      if (this.sent[k] === v || (v === null && this.sent[k] === undefined)) return;
      out[k] = v; n++;
      if (v === null) delete this.sent[k]; else this.sent[k] = v;
    });
    if (n) this.ref('state').update(out).catch(() => {});
  }
  // A new host already has the published state: mark it as sent so only changes go out.
  adoptState() { this.sent = {}; Object.keys(this.stateCache).forEach((k) => { this.sent[k] = this.stateCache[k].raw; }); }
  publishLive(o) {
    if (!this.amHost) return;
    const out = {}; let n = 0;
    Object.keys(o).forEach((k) => { const v = o[k] === undefined ? null : JSON.stringify(o[k]); if (this.liveSent[k] !== v) { out[k] = v; this.liveSent[k] = v; n++; } });
    if (n) this.ref('live').update(out).catch(() => {});
  }
  setLobby(l) { if (this.amHost) return this.ref('lobby').set(JSON.stringify(l)).catch(() => {}); return null; }
  setMe(patch) { return this.ref('players/' + this.uid).update(patch).catch(() => {}); }
  setPlayer(uid, patch) { if (this.amHost) return (patch ? this.ref('players/' + uid).update(patch) : this.ref('players/' + uid).remove()).catch(() => {}); return null; }
  setStatus(status) { if (this.amHost) return this.ref('meta/status').set(status).catch(() => {}); return null; }
  async resetGame() { if (!this.amHost) return; this.sent = {}; this.liveSent = {}; await this.ref('state').remove().catch(() => {}); await this.ref('live').remove().catch(() => {}); await this.ref('actions').remove().catch(() => {}); }
  leave(forget) {
    if (this.closed) return;
    this.closed = true; clearTimeout(this.hostTimer);
    this.offs.forEach((f) => { try { f(); } catch (e) {} }); this.offs = [];
    this.ref('presence/' + this.uid).remove().catch(() => {});
    if (forget) { saveLastRoom(null); if (!this.state) this.ref('players/' + this.uid).remove().catch(() => {}); }
  }
  async close() { if (!this.amHost) return; await this.ref('meta/status').set('closed').catch(() => {}); this.leave(true); setTimeout(() => this.db.ref('rooms/' + this.code).remove().catch(() => {}), 1500); }
}

/* ---------- what each screen needs to know about this phone ---------- */
const NetCtx = React.createContext(null);
const useNet = () => React.useContext(NetCtx);
// online: an online room; isHost: this phone runs the game (always true offline);
// controls(teamId): may this phone act for that team; runsBots: bots/clock run here.
function netView(d, net) {
  const online = !!(d && d.mode === 'online' && net);
  const isHost = !online || net.role === 'host';
  const who = online ? net.who : null;
  return {
    online, isHost, who, tv: online && net.role === 'tv', live: online ? (net.live || {}) : {},
    runsBots: !!d && (d.mode === 'solo' || online) && isHost,
    controls: (teamId) => (!online ? (d.mode === 'solo' ? !!(teamOf(d, teamId) || {}).human : true) : !!who && who.teams.has(teamId)),
    controlsPart: (pid) => (!online ? true : !!who && who.parts.has(pid)),
  };
}
// Player actions: offline they apply straight away; online they go to the host.
function useAct(d, setDraft) {
  const net = useNet();
  return (name, ...args) => {
    if (d && d.mode === 'online' && net) { net.send(name, args); return; }
    setDraft((p) => runAction(p, name, args, null));
  };
}
