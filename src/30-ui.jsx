/* ============================================================
   ITEM PICTURES — generated kits and emoji tiles (uploaded photos win)
   ============================================================ */
const KITS = {
  'brazil': ['#FFDC02', '#1B7A3E'], 'italy': ['#1F4FA8', '#ffffff'], 'belgium': ['#E30613', '#FFD200'], 'france': ['#1E2A5E', '#ffffff'],
  'argentina': ['#75AADB', '#ffffff'], 'netherlands': ['#F36C21', '#1d1d1d'], 'portugal': ['#B5121B', '#2BB673'], 'morocco': ['#C1272D', '#2BB673'],
  'england': ['#ffffff', '#1D2A5B'], 'croatia': ['#E4002B', '#ffffff'], 'germany': ['#ffffff', '#111111'], 'spain': ['#C60B1E', '#FFC400'],
  'uruguay': ['#5CBFEB', '#111111'], 'norway': ['#BA0C2F', '#ffffff'], 'egypt': ['#C8102E', '#ffffff'], 'serbia': ['#C6363C', '#ffffff'],
  'slovenia': ['#ffffff', '#2A57A6'], 'canada': ['#D80621', '#ffffff'], 'greece': ['#0D5EAF', '#ffffff'], 'cameroon': ['#007A5E', '#FCD116'],
  'lithuania': ['#FDB913', '#006A44'], 'usa': ['#0A3161', '#ffffff'], 'russia': ['#D52B1E', '#ffffff'], 'finland': ['#ffffff', '#002F6C'],
  'sweden': ['#FECC00', '#006AA7'], 'switzerland': ['#D52B1E', '#ffffff'], 'czechia': ['#11457E', '#ffffff'], 'poland': ['#ffffff', '#DC143C'],
  'soviet union': ['#CC0000', '#FFD700'], 'nigeria': ['#008751', '#ffffff'], 'china': ['#DE2910', '#FFDE00'], 'dr congo': ['#007FFF', '#F7D618'],
  'dominican rep.': ['#002D62', '#CE1126'], 'india': ['#1C4E9D', '#FF9933'], 'pakistan': ['#01411C', '#ffffff'], 'australia': ['#FFCD00', '#00843D'],
  'new zealand': ['#111111', '#ffffff'], 'south africa': ['#007A4D', '#FFB612'], 'sri lanka': ['#0A2A6E', '#FFBE29'], 'bangladesh': ['#006A4E', '#F42A41'],
  'afghanistan': ['#0066B3', '#ffffff'], 'west indies': ['#7B0041', '#FFC72C'], 'scotland': ['#0065BF', '#ffffff'], 'turkey': ['#E30A17', '#ffffff'], 'saudi arabia': ['#006C35', '#ffffff'],
  'man utd': ['#DA291C', '#ffffff'], 'man city': ['#6CABDD', '#1C2C5B'], 'chelsea': ['#034694', '#ffffff'], 'arsenal': ['#EF0107', '#ffffff'],
  'liverpool': ['#C8102E', '#F6EB61'], 'newcastle': ['#241F20', '#ffffff'], 'spurs': ['#ffffff', '#132257'], 'tottenham': ['#ffffff', '#132257'],
  'aston villa': ['#670E36', '#95BFE5'], 'real madrid': ['#ffffff', '#C9A227'], 'barcelona': ['#A50044', '#EDBB00'], 'atlético madrid': ['#CB3524', '#ffffff'],
  'sevilla': ['#ffffff', '#D4021D'], 'real sociedad': ['#0067B1', '#ffffff'], 'inter': ['#0068A8', '#111111'], 'inter miami': ['#F7B5CD', '#231F20'],
  'ac milan': ['#FB090B', '#111111'], 'juventus': ['#111111', '#ffffff'], 'napoli': ['#12A0D7', '#ffffff'], 'roma': ['#8E1F2F', '#F0BC42'],
  'bayern munich': ['#DC052D', '#ffffff'], 'dortmund': ['#FDE100', '#111111'], 'bayer leverkusen': ['#E32221', '#111111'], 'rb leipzig': ['#ffffff', '#DD0741'],
  'psg': ['#004170', '#DA291C'], 'ajax': ['#ffffff', '#D2122E'], 'benfica': ['#E83030', '#ffffff'], 'porto': ['#00428C', '#ffffff'],
  'celtic': ['#018749', '#ffffff'], 'al nassr': ['#FFE100', '#1F3F99'], 'galatasaray': ['#A90432', '#FDB912'], 'boca juniors': ['#103F79', '#F3B229'],
};
const KIT_RX = Object.keys(KITS).map((k) => [k, new RegExp('(^|[^\\p{L}])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[^\\p{L}])', 'iu')]);
const FALLBACK_KITS = [['#3d8bff', '#ffffff'], ['#ff4f64', '#ffffff'], ['#2fd17c', '#0f2a1b'], ['#a46bff', '#ffffff'], ['#ff8a3a', '#1a1300'], ['#22cfd6', '#082a2c'], ['#ffc83d', '#2a1d00'], ['#1d1d1d', '#ffc83d'], ['#ffffff', '#c8102e'], ['#0b3d2e', '#f5d76e']];
const TILE_BG = [['#ff8a5c', '#b8325e'], ['#5ec8ff', '#3b46c9'], ['#7ee08a', '#1f7a6a'], ['#ffd66b', '#e0701f'], ['#c79bff', '#5a32b8'], ['#ff7eb6', '#9c2f8f'], ['#6ff0e0', '#1c6fa8'], ['#ffb36b', '#a6402a']];
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function kitColors(item) {
  if (item.kit && item.kit.length === 2) return item.kit;
  const hay = item.name + ' · ' + (item.desc || '');
  let best = null;
  KIT_RX.forEach(([k, rx]) => { const m = hay.match(rx); if (m) { const idx = m.index + m[1].length; if (!best || idx < best.idx || (idx === best.idx && k.length > best.k.length)) best = { k, idx }; } });
  return best ? KITS[best.k] : FALLBACK_KITS[hashStr(item.name) % FALLBACK_KITS.length];
}
const NUMS = { GK: [1, 1, 13], DEF: [2, 3, 4, 5, 6, 15], MID: [6, 8, 10, 14, 16, 17], FWD: [7, 9, 10, 11, 19, 20], G: [1, 30, 31, 35] };
function kitNumber(item) {
  const h = hashStr(item.name); const set = NUMS[norm(item.pos)];
  return set ? set[h % set.length] : (h % 98) + 1;
}
function lum(hex) { const h = hex.replace('#', ''); const v = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }
// What kind of picture a topic uses. Older saved topics without the field get a sensible default.
const artOf = (topic) => (topic && topic.art) || (topic && topic.layout === 'pitch' ? 'kit' : 'emoji');

// Picture priority: uploaded photo → image link → Wikipedia photo → jersey/emoji.
// Any source that fails to load drops to the next one.
function imageSources(item, topic, wikiUrl) {
  const out = [];
  if (item.photo) out.push({ src: item.photo, kind: 'upload' });
  if (item.imageData) out.push({ src: item.imageData, kind: 'link' });
  else if (item.imageUrl) out.push({ src: item.imageUrl, kind: 'link', noCors: true });
  if (wikiUrl) out.push({ src: wikiUrl, kind: 'wiki' });
  return out;
}
function ItemArt({ item, topic, size = 44, round = false, radius }) {
  const title = wikiTitleFor(item, topic);
  const wikiUrl = useWikiImage(item.photo || item.imageData || item.imageUrl ? null : title);
  const sources = imageSources(item, topic, wikiUrl);
  const key = sources.map((s) => s.src.slice(0, 60)).join('|');
  const [failed, setFailed] = useState(0);
  useEffect(() => { setFailed(0); }, [key]);
  const r = round ? '50%' : (radius != null ? radius : Math.round(size * 0.22)) + 'px';
  const box = { width: size, height: size, borderRadius: r, flex: 'none', overflow: 'hidden', display: 'block' };
  const pick = sources[failed];
  if (pick) {
    return <img src={pick.src} alt="" crossOrigin={pick.noCors || pick.kind !== 'wiki' ? undefined : 'anonymous'} referrerPolicy="no-referrer" loading="lazy" decoding="async"
      onError={() => setFailed((f) => f + 1)} style={{ ...box, objectFit: 'cover', objectPosition: '50% 18%', background: '#120f27' }} />;
  }
  return <ArtFallback item={item} topic={topic} size={size} box={box} />;
}
function ArtFallback({ item, topic, size, box }) {
  if (artOf(topic) === 'kit') {
    const [c1, c2] = kitColors(item);
    const ink = Math.abs(lum(c1) - lum(c2)) < 0.3 ? onColor(c1) : c2;
    const label = topic && topic.kitLabel === 'initials' ? initials(item.name) : String(kitNumber(item));
    const tank = topic && topic.kitShape === 'tank';
    const gid = 'g' + hashStr(item.id || item.name);
    return (
      <svg viewBox="0 0 100 100" style={box} aria-hidden="true">
        <defs><radialGradient id={gid} cx="50%" cy="30%" r="80%"><stop offset="0%" stopColor={c1} stopOpacity=".55" /><stop offset="100%" stopColor="#120f27" stopOpacity="1" /></radialGradient></defs>
        <rect width="100" height="100" fill={'url(#' + gid + ')'} />
        {tank
          ? <path d="M35 12 L44 12 Q50 23 56 12 L65 12 Q65 27 73 33 L73 92 L27 92 L27 33 Q35 27 35 12 Z" fill={c1} stroke="rgba(0,0,0,.35)" strokeWidth="1.5" />
          : <path d="M32 16 L42 11 Q50 20 58 11 L68 16 L89 31 L80 47 L71 41 L71 92 L29 92 L29 41 L20 47 L11 31 Z" fill={c1} stroke="rgba(0,0,0,.35)" strokeWidth="1.5" />}
        {tank
          ? <path d="M44 12 Q50 23 56 12" fill="none" stroke={c2} strokeWidth="3.5" />
          : <><path d="M42 11 Q50 20 58 11" fill="none" stroke={c2} strokeWidth="3.5" /><path d="M20 47 L11 31 M80 47 L89 31" stroke={c2} strokeWidth="4" /></>}
        <text x="50" y={label.length > 2 ? 72 : 76} textAnchor="middle" fill={ink} fontFamily="Anton, Impact, 'Arial Narrow', sans-serif" fontSize={label.length > 2 ? 22 : 34}>{label}</text>
      </svg>
    );
  }
  const [a, b] = TILE_BG[hashStr(item.name) % TILE_BG.length];
  return (
    <span aria-hidden="true" style={{ ...box, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 30% 25%, ' + a + ', ' + b + ')', fontSize: Math.round(size * 0.56), lineHeight: 1 }}>
      {item.emoji || (topic && topic.emoji) || '🎲'}
    </span>
  );
}

/* ============================================================
   AUCTION RULES — plain functions, no UI
   ============================================================ */
const emptyCount = (m) => m.team.filter((x) => !x).length;
const isFull = (m) => emptyCount(m) === 0;
const spent = (d, m) => d.rules.budget - m.budget;

// Which slot index this item would go into for this manager (-1 = can't take it).
function assignSlot(m, item, slots) {
  const pos = norm(item.pos);
  const posInTemplate = pos && slots.some((s) => norm(s) === pos);
  if (posInTemplate) {
    const i = slots.findIndex((s, k) => norm(s) === pos && !m.team[k]);
    if (i >= 0) return i;
    return slots.findIndex((s, k) => isFlex(s) && !m.team[k]);
  }
  // Item has no position, or a position this template doesn't use: any open slot.
  return m.team.findIndex((x) => !x);
}

// Highest legal bid. With "must fill", keep min bid for every other empty slot.
function maxBid(m, rules) {
  const e = emptyCount(m);
  if (e === 0) return 0;
  const cap = rules.mustFill ? m.budget - rules.minBid * (e - 1) : m.budget;
  return Math.max(0, cap);
}
const currentItem = (d) => (d.queue.length ? d.items[d.queue[0]] : null);
const nextAmount = (d) => (d.bid ? d.bid.amount + d.rules.inc : d.rules.minBid);

// Can this manager bid `amount` on the current item?
function canBid(d, m, amount) {
  const item = currentItem(d);
  if (!item || isFull(m)) return false;
  if (assignSlot(m, item, d.rules.slots) < 0) return false;
  return amount >= d.rules.minBid && amount <= maxBid(m, d.rules);
}
// Why a manager can't bid (for the button label).
function bidBlocker(d, m) {
  const item = currentItem(d);
  if (isFull(m)) return 'Team full';
  if (item && assignSlot(m, item, d.rules.slots) < 0) return 'No ' + (item.pos || 'open') + ' slot';
  if (maxBid(m, d.rules) < d.rules.minBid) return 'Out of money';
  if (maxBid(m, d.rules) < nextAmount(d)) return 'Max ' + money(maxBid(m, d.rules));
  return null;
}
const canTake = (d, m, id) => !isFull(m) && assignSlot(m, d.items[id], d.rules.slots) >= 0;

function snap(d) {
  return JSON.stringify({ managers: d.managers, queue: d.queue, leftover: d.leftover, passed: d.passed, processed: d.processed, fp: d.fp, phase: d.phase, autoSkipped: d.autoSkipped || 0 });
}
function withHistory(d, label) {
  return { ...d,
    managers: d.managers.map((m) => ({ ...m, team: [...m.team] })),
    queue: [...d.queue], leftover: [...d.leftover], passed: [...d.passed], fp: { ...d.fp },
    history: [...d.history, { s: snap(d), label }].slice(-80) };
}

// Snake-order free pick: whose turn is it?
function currentPicker(d) {
  let { round, pos } = d.fp;
  for (let tries = 0; tries < 3; tries++) {
    const order = round % 2 === 0 ? d.managers : [...d.managers].reverse();
    for (let i = pos; i < order.length; i++) {
      const m = order[i];
      if (d.leftover.some((id) => canTake(d, m, id))) return { m, round, pos: i };
    }
    round++; pos = 0;
  }
  return null;
}

function isDraftOver(d) {
  if (d.managers.every(isFull)) return true;
  if (d.queue.length > 0) return false;
  return !currentPicker(d);
}

// Move to the next playable state. Items nobody can buy go to the leftover pile.
function advance(n) {
  n.bid = null; n.bids = [];
  while (n.queue.length) {
    const id = n.queue[0];
    const someoneCan = n.managers.some((m) => !isFull(m) && assignSlot(m, n.items[id], n.rules.slots) >= 0 && maxBid(m, n.rules) >= n.rules.minBid);
    if (someoneCan) break;
    n.queue = n.queue.slice(1); n.leftover = [...n.leftover, id]; n.processed++; n.autoSkipped = (n.autoSkipped || 0) + 1;
  }
  if (n.queue.length) n.phase = 'auction';
  else if (isDraftOver(n)) n.phase = 'done';
  else { if (n.phase !== 'freepick') n.fp = { round: 0, pos: 0 }; n.phase = 'freepick'; }
  n.reveal = (n.reveal || 0) + 1;
  return n;
}

function createDraft(topic, managers, rules) {
  const items = {}; topic.items.forEach((it) => { items[it.id] = { ...it }; });
  const ids = topic.items.map((it) => it.id);
  const d = {
    id: uid(), createdAt: Date.now(),
    topic: { id: topic.id, name: topic.name, emoji: topic.emoji, layout: topic.layout, art: artOf(topic), kitShape: topic.kitShape || '', kitLabel: topic.kitLabel || '', photos: !!topic.photos },
    rules: { ...rules },
    managers: managers.map((m) => ({ id: m.id, name: m.name.trim(), color: m.color, emoji: m.emoji, budget: rules.budget, team: rules.slots.map(() => null) })),
    items, queue: rules.order === 'random' ? shuffle(ids) : ids, leftover: [], passed: [], processed: 0,
    bid: null, bids: [], history: [], phase: 'auction', fp: { round: 0, pos: 0 }, reveal: 0,
    votes: {}, votesRevealed: false,
  };
  return advance(d);
}

// Tapping the current leader again raises their own bid (+increment).
function placeBid(d, managerId, amount) {
  const m = d.managers.find((x) => x.id === managerId);
  if (!m || !canBid(d, m, amount)) return d;
  if (d.bid && amount <= d.bid.amount) return d;
  return { ...d, bids: [...d.bids, d.bid], bid: { amount, leaderId: managerId } };
}
function undoBid(d) {
  if (!d.bid) return d;
  const bids = [...d.bids]; const prev = bids.pop();
  return { ...d, bids, bid: prev || null };
}
function sell(d) {
  const id = d.queue[0]; const b = d.bid;
  if (!id || !b) return d;
  const n = withHistory(d, 'Undo sale');
  const m = n.managers.find((x) => x.id === b.leaderId);
  const slot = assignSlot(m, n.items[id], n.rules.slots);
  if (slot < 0) return d;
  m.team[slot] = { itemId: id, price: b.amount };
  m.budget -= b.amount;
  n.queue = n.queue.slice(1); n.processed++;
  return advance(n);
}
function skipItem(d) {
  const id = d.queue[0]; if (!id) return d;
  const n = withHistory(d, 'Undo skip');
  n.queue = n.queue.slice(1);
  if (n.rules.noBids === 'back' && !n.passed.includes(id)) { n.queue.push(id); n.passed.push(id); }
  else { n.leftover.push(id); n.processed++; }
  return advance(n);
}
function freePick(d, itemId) {
  const cp = currentPicker(d); if (!cp) return d;
  const n = withHistory(d, 'Undo pick');
  const m = n.managers.find((x) => x.id === cp.m.id);
  const slot = assignSlot(m, n.items[itemId], n.rules.slots);
  if (slot < 0) return d;
  m.team[slot] = { itemId, price: 0, free: true };
  n.leftover = n.leftover.filter((x) => x !== itemId);
  n.fp = { round: cp.round, pos: cp.pos + 1 };
  if (isDraftOver(n)) n.phase = 'done';
  n.reveal++;
  return n;
}
// Full undo of the last sale / skip / free pick: refunds money and returns the item.
function undo(d) {
  if (d.bid) return undoBid(d);
  if (!d.history.length) return d;
  const h = d.history[d.history.length - 1];
  const s = JSON.parse(h.s);
  return { ...d, ...s, history: d.history.slice(0, -1), bid: null, bids: [], reveal: (d.reveal || 0) + 1, votes: {}, votesRevealed: false };
}
const undoLabel = (d) => (d.bid ? 'Undo bid' : d.history.length ? d.history[d.history.length - 1].label : 'Undo');

/* ---------- results stats ---------- */
function draftStats(d) {
  const buys = [];
  d.managers.forEach((m) => m.team.forEach((t, i) => { if (t) buys.push({ m, item: d.items[t.itemId], price: t.price, free: !!t.free, slot: d.rules.slots[i] }); }));
  const paid = buys.filter((b) => !b.free);
  const out = {};
  if (paid.length) {
    out.expensive = paid.reduce((a, b) => (b.price > a.price ? b : a));
    if (paid.length >= 2) {
      const groups = {};
      paid.forEach((b) => { const k = norm(b.item.pos || b.slot); (groups[k] = groups[k] || []).push(b.price); });
      const avg = (k) => groups[k].reduce((a, b) => a + b, 0) / groups[k].length;
      let best = null;
      paid.forEach((b) => {
        const k = norm(b.item.pos || b.slot); const gap = groups[k].length > 1 ? b.price - avg(k) : b.price - (paid.reduce((a, x) => a + x.price, 0) / paid.length);
        if (!best || gap < best.gap || (gap === best.gap && b.price < best.price)) best = { ...b, gap };
      });
      out.bargain = best;
    }
  }
  const spends = d.managers.map((m) => ({ m, s: spent(d, m) }));
  out.spender = spends.reduce((a, b) => (b.s > a.s ? b : a));
  out.cheapest = spends.reduce((a, b) => (b.s < a.s ? b : a));
  return out;
}
// All-time wins across finished drafts, matched by manager name. Ties give each winner a win.
function winsBoard(drafts) {
  const rows = {};
  drafts.forEach((d) => {
    const { winners } = tally(d);
    const winIds = d.votesRevealed ? winners.map((w) => w.id) : [];
    d.managers.forEach((m) => {
      const k = m.name.trim().toLowerCase(); if (!k) return;
      const r = rows[k] || (rows[k] = { name: m.name.trim(), emoji: m.emoji, color: m.color, wins: 0, played: 0, at: 0 });
      r.played++;
      if (winIds.includes(m.id)) r.wins++;
      if ((d.createdAt || 0) >= r.at) { r.at = d.createdAt || 0; r.emoji = m.emoji; r.color = m.color; r.name = m.name.trim(); }
    });
  });
  return Object.values(rows).sort((a, b) => b.wins - a.wins || a.played - b.played || a.name.localeCompare(b.name));
}
function Leaderboard({ rows, highlight = [] }) {
  if (!rows.length) return null;
  const top = Math.max(1, ...rows.map((r) => r.wins));
  return (
    <div className="board">
      <h3>🏆 All-time wins</h3>
      {rows.map((r, i) => (
        <div key={r.name} className={'brow' + (highlight.includes(r.name.toLowerCase()) ? ' hl' : '')} style={mStyle(r)}>
          <span className="rk num">{(() => { const rank = rows.findIndex((x) => x.wins === r.wins) + 1; return rank === 1 && r.wins > 0 ? '👑' : rank; })()}</span>
          <span className="bn">{r.emoji} {r.name}</span>
          <span className="bb"><i style={{ width: (r.wins / top) * 100 + '%' }} /></span>
          <span className="bw num">{r.wins}<small> / {r.played}</small></span>
        </div>
      ))}
      <p className="hint">Wins / drafts played. Counted by name, so keep names the same each time.</p>
    </div>
  );
}

function tally(d) {
  const counts = {}; d.managers.forEach((m) => { counts[m.id] = 0; });
  Object.values(d.votes || {}).forEach((t) => { if (counts[t] !== undefined) counts[t]++; });
  const top = Math.max(0, ...Object.values(counts));
  return { counts, winners: top > 0 ? d.managers.filter((m) => counts[m.id] === top) : [] };
}

/* ============================================================
   SHARED UI
   ============================================================ */
function Sheet({ onClose, children, center }) {
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className={'backdrop' + (center ? ' center' : '')} onClick={onClose}>
      <div className={center ? 'modal' : 'sheet'} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {!center && <div className="grab" />}
        {children}
      </div>
    </div>
  );
}
function Confirm({ title, body, yes = 'Confirm', danger, onYes, onClose }) {
  return (
    <Sheet center onClose={onClose}>
      <h2 className="display" style={{ fontSize: 30 }}>{title}</h2>
      {body && <p className="muted" style={{ margin: 0 }}>{body}</p>}
      <div className="row">
        <button className="btn btn-ghost grow" onClick={onClose}>Cancel</button>
        <button className={'btn grow ' + (danger ? 'btn-danger solid' : 'btn-gold')} onClick={() => { onYes(); onClose(); }}>{yes}</button>
      </div>
    </Sheet>
  );
}
function TopBar({ onBack, title, right, backLabel = '←' }) {
  return (
    <div className="topbar">
      {onBack ? <button className="iconbtn" onClick={onBack} aria-label="Back">{backLabel}</button> : <span style={{ width: 46 }} />}
      <div className="title">{title}</div>
      {right || <span style={{ width: 46 }} />}
    </div>
  );
}
function Seg({ value, options, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, l]) => <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  );
}
function Toggle({ on, onChange, title, sub }) {
  return (
    <button type="button" className="toggle" aria-pressed={on} onClick={() => onChange(!on)}>
      <span className="grow"><b style={{ display: 'block', fontSize: 17 }}>{title}</b>{sub && <span className="small muted">{sub}</span>}</span>
      <span className="sw" />
    </button>
  );
}
function Stepper({ id, value, onChange, min = 0, max = 999, prefix = '' }) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => { setTxt(String(value)); }, [value]);
  const clamp = (v) => Math.max(min, Math.min(max, v));
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(clamp(value - 1))} aria-label="Decrease">−</button>
      <input id={id} className="input grow" inputMode="numeric" value={prefix + txt}
        onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ''); setTxt(raw); if (raw !== '') onChange(clamp(parseInt(raw, 10))); }}
        onBlur={() => setTxt(String(value))} />
      <button type="button" onClick={() => onChange(clamp(value + 1))} aria-label="Increase">+</button>
    </div>
  );
}
function Thumb({ item, topic, size = 44 }) {
  return <ItemArt item={item} topic={topic} size={size} radius={10} />;
}
function MChip({ m }) { return <span className="mchip" style={mStyle(m)}><b>{m.emoji}</b>{m.name}</span>; }

function TeamList({ d, m }) {
  return (
    <div>
      {d.rules.slots.map((s, i) => {
        const t = m.team[i]; const it = t && d.items[t.itemId];
        return (
          <div className="slotline" key={i}>
            <span className="s">{s}</span>
            {it && <ItemArt item={it} topic={d.topic} size={30} radius={7} />}
            {it ? <span className="n">{it.name}{t.free && <span className="muted small"> · free</span>}</span> : <span className="n empty">Empty</span>}
            {t && <span className="p num">{money(t.price)}</span>}
          </div>
        );
      })}
    </div>
  );
}
function TeamsSheet({ d, onClose }) {
  return (
    <Sheet onClose={onClose}>
      <div className="stack">
        <div className="row"><h2 className="display grow" style={{ fontSize: 30 }}>Teams so far</h2><button className="iconbtn" onClick={onClose} aria-label="Close">✕</button></div>
        {d.managers.map((m) => (
          <div className="tteam" key={m.id} style={mStyle(m)}>
            <div className="row" style={{ marginBottom: 4 }}>
              <h3 className="grow">{m.emoji} {m.name}</h3>
              <span className="num" style={{ fontFamily: 'var(--display)', fontSize: 22, color: 'var(--gold)' }}>{money(m.budget)} left</span>
            </div>
            <TeamList d={d} m={m} />
          </div>
        ))}
      </div>
    </Sheet>
  );
}

/* ============================================================
   HOME
   ============================================================ */
function Home({ draft, past, onNew, onResume, onTopics, onPast, onAbandon, onSettings, showInstall, onDismissInstall }) {
  const [ask, setAsk] = useState(null);
  const status = draft && (draft.phase === 'auction' ? 'Item ' + (draft.processed + 1) + ' of ' + (draft.processed + draft.queue.length) : draft.phase === 'freepick' ? 'Free picks' : 'Results & voting');
  return (
    <div className="app">
      <div className="hero">
        <span className="tag"><i />$20 AUCTION</span>
        <h1 className="display logo">Draft<span>Night</span></h1>
        <p className="muted" style={{ margin: 0, maxWidth: 300 }}>One phone, one auctioneer, everyone shouting bids. Build the best team for the money.</p>
      </div>
      {draft && (
        <div className="card resume stack">
          <p className="eyebrow" style={{ color: 'var(--gold)' }}>Draft in progress</p>
          <div className="row"><span style={{ fontSize: 30 }}>{draft.topic.emoji}</span><div className="grow"><h3>{draft.topic.name}</h3><span className="small muted">{status}</span></div></div>
          <div className="chips">{draft.managers.map((m) => <MChip key={m.id} m={m} />)}</div>
          <button className="btn btn-gold" onClick={onResume}>Resume draft</button>
          <button className="btn btn-sm btn-ghost" style={{ alignSelf: 'center', border: 0, color: 'var(--muted)' }} onClick={() => setAsk('abandon')}>Abandon this draft</button>
        </div>
      )}
      <div className="menu">
        <button className={'btn ' + (draft ? '' : 'btn-gold')} onClick={() => (draft ? setAsk('new') : onNew())}>New draft</button>
        <button className="btn" onClick={onTopics}>Topics</button>
        <button className="btn" onClick={onPast}>Past drafts{past.length ? ' (' + past.length + ')' : ''}</button>
        <button className="btn btn-ghost" onClick={onSettings}>Backup &amp; app settings</button>
      </div>
      {showInstall && (
        <div className="card row installcard">
          <span style={{ fontSize: 28 }}>📲</span>
          <div className="grow"><b>Put Draft Night on your home screen</b><span className="small muted" style={{ display: 'block' }}>Opens full screen, like an app.</span></div>
          <button className="btn btn-sm" onClick={onSettings}>How</button>
          <button className="mini" aria-label="Hide" onClick={onDismissInstall}>✕</button>
        </div>
      )}
      {ask === 'new' && <Confirm title="Start over?" body="A new draft replaces the one in progress. Finished drafts stay in Past Drafts." yes="New draft" danger onYes={onNew} onClose={() => setAsk(null)} />}
      {ask === 'abandon' && <Confirm title="Abandon draft?" body="The draft in progress will be deleted." yes="Abandon" danger onYes={onAbandon} onClose={() => setAsk(null)} />}
    </div>
  );
}

/* ============================================================
   TOPICS
   ============================================================ */
function TopicsList({ topics, onBack, onOpen, onCreate, onDuplicate, onDelete, folder, setFolder }) {
  const [del, setDel] = useState(null);
  const [q, setQ] = useState('');
  return (
    <div className="app">
      <TopBar onBack={folder && !q ? () => setFolder(null) : onBack} title={'Topics (' + topics.length + ')'} />
      <button className="btn btn-gold" onClick={() => onCreate(folder)}>+ New topic{folder ? ' in ' + folder : ''}</button>
      <TopicSearch q={q} setQ={setQ} />
      <FolderBrowser topics={topics} q={q} folder={folder} setFolder={setFolder} renderTopic={(t) => (
        <div key={t.id} className="card stack-sm" style={{ padding: 12 }}>
          <button className="tcard" style={{ border: 0, padding: 0, background: 'none' }} onClick={() => onOpen(t.id)}>
            <span className="em">{t.emoji || '🎲'}</span>
            <span className="meta"><span className="name">{t.name}</span><span className="sub">{t.items.length} items · {t.slots.join(', ')}</span></span>
            <span className="muted" style={{ fontSize: 22 }}>›</span>
          </button>
          <div className="row">
            <button className="btn btn-sm grow" onClick={() => onOpen(t.id)}>Edit</button>
            <button className="btn btn-sm grow" onClick={() => onDuplicate(t.id)}>Duplicate</button>
            <button className="btn btn-sm btn-danger grow" onClick={() => setDel(t)}>Delete</button>
          </div>
        </div>
      )} />
      {!topics.length && <p className="muted">No topics yet. Create one to start a draft.</p>}
      {del && <Confirm title="Delete topic?" body={'“' + del.name + '” and its ' + del.items.length + ' items will be removed.'} yes="Delete" danger onYes={() => onDelete(del.id)} onClose={() => setDel(null)} />}
    </div>
  );
}

function ItemEditor({ item, slots, topic, onSave, onDelete, onClose }) {
  const [f, setF] = useState({ ...item });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  const positions = [...new Set(slots.filter((s) => !isFlex(s)))];
  const hasCustom = f.pos && !positions.some((p) => norm(p) === norm(f.pos));
  const [link, setLink] = useState(item.imageUrl || '');
  const [linkMsg, setLinkMsg] = useState(null); // {kind:'ok'|'warn'|'err', text}
  const [linkBusy, setLinkBusy] = useState(false);
  const pick = async (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    e.target.value = '';
    setErr('');
    if (file.type && !/^image\//.test(file.type)) { setErr("That file isn't a photo. Choose a JPG, PNG, WebP or HEIC image."); return; }
    if (file.size > 25 * 1024 * 1024) { setErr('That photo is over 25 MB. Choose a smaller one.'); return; }
    setBusy(true);
    try { const url = await resizeImage(file); setF((x) => ({ ...x, photo: url })); }
    catch (er) { setErr("This browser couldn't open that photo. Try a JPG or PNG, or take a screenshot of it and upload that."); }
    setBusy(false);
  };
  const useLink = async () => {
    const raw = link.trim();
    setLinkMsg(null);
    let u;
    try { u = new URL(raw); } catch (e) { setLinkMsg({ kind: 'err', text: 'That isn’t a web link. It should start with https://' }); return; }
    if (u.protocol !== 'https:') { setLinkMsg({ kind: 'err', text: 'Use a link that starts with https:// so it loads on every phone.' }); return; }
    setLinkBusy(true);
    const loads = await new Promise((resolve) => {
      const img = new Image(); const t = setTimeout(() => resolve(false), 10000);
      img.referrerPolicy = 'no-referrer';
      img.onload = () => { clearTimeout(t); resolve(img.naturalWidth > 0); }; img.onerror = () => { clearTimeout(t); resolve(false); };
      img.src = u.href;
    });
    if (!loads) { setLinkBusy(false); setLinkMsg({ kind: 'err', text: "No image loaded from that link. Copy the image's own address (long-press the picture → Copy Image Address), not the page link." }); return; }
    let data = '';
    try {
      const res = await fetch(u.href, { mode: 'cors', referrerPolicy: 'no-referrer' });
      if (res.ok) { const blob = await res.blob(); if (/^image\//.test(blob.type)) data = await resizeImage(blob); }
    } catch (e) { data = ''; }
    setF((x) => ({ ...x, imageUrl: u.href, imageData: data }));
    setLinkBusy(false);
    setLinkMsg(data ? { kind: 'ok', text: 'Image saved. It also works offline and goes into backups.' }
      : { kind: 'warn', text: 'Image linked. That site doesn’t allow copying, so it needs internet and may be missing from saved images.' });
  };
  const clearLink = () => { setLink(''); setLinkMsg(null); setF((x) => { const { imageUrl, imageData, ...rest } = x; return rest; }); };
  const wikiDefault = topic.photos ? wikiTitleFor({ ...f, wiki: '' }, topic) : null;
  const shownWiki = useWikiImage(!f.photo && !f.imageData && !f.imageUrl ? wikiTitleFor(f, topic) : null);
  const source = f.photo ? 'Your uploaded photo' : (f.imageData || f.imageUrl) ? 'Image link' : shownWiki ? 'Wikipedia photo' : (wikiTitleFor(f, topic) && shownWiki === undefined) ? 'Looking for a Wikipedia photo…' : artOf(topic) === 'kit' ? 'Jersey' : 'Emoji';
  return (
    <Sheet center onClose={onClose}>
      <h2 className="display" style={{ fontSize: 30 }}>{item.name ? 'Edit item' : 'New item'}</h2>
      <div className="field"><label htmlFor="it-name">Name</label><input id="it-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Thierry Henry" /></div>
      <div className="field">
        <label htmlFor="it-pos">Position</label>
        <select id="it-pos" className="input" value={hasCustom ? '__custom' : f.pos} onChange={(e) => setF({ ...f, pos: e.target.value === '__custom' ? (f.pos || ' ') : e.target.value })}>
          <option value="">None (fits any slot)</option>
          {positions.map((p) => <option key={p} value={p}>{p}</option>)}
          <option value="__custom">Other…</option>
        </select>
        {hasCustom && <input id="it-pos-custom" className="input" value={f.pos.trim()} onChange={(e) => setF({ ...f, pos: e.target.value })} placeholder="Position name" />}
      </div>
      <div className="field"><label htmlFor="it-desc">Short description</label><input id="it-desc" className="input" value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="Club, era, stat…" /></div>
      {artOf(topic) === 'emoji' ? (
        <div className="field"><label htmlFor="it-emoji">Picture emoji</label><input id="it-emoji" className="input" style={{ fontSize: 26 }} value={f.emoji || ''} onChange={(e) => setF({ ...f, emoji: [...e.target.value].slice(-2).join('') })} placeholder={topic.emoji} /></div>
      ) : (
        <div className="field">
          <span className="label">Kit colours</span>
          <div className="row">
            <input id="it-kit1" type="color" aria-label="Shirt colour" value={(f.kit || kitColors(f))[0]} onChange={(e) => setF({ ...f, kit: [e.target.value, (f.kit || kitColors(f))[1]] })} style={{ width: 56, height: 46, border: 0, background: 'none' }} />
            <input id="it-kit2" type="color" aria-label="Number colour" value={(f.kit || kitColors(f))[1]} onChange={(e) => setF({ ...f, kit: [(f.kit || kitColors(f))[0], e.target.value] })} style={{ width: 56, height: 46, border: 0, background: 'none' }} />
            {f.kit ? <button type="button" className="btn btn-sm btn-ghost" onClick={() => { const { kit, ...rest } = f; setF(rest); }}>Auto</button> : <span className="hint">Auto from the country or club in the description</span>}
          </div>
        </div>
      )}
      <div className="field picbox">
        <span className="label">Picture</span>
        <div className="row">
          <ItemArt item={f} topic={topic} size={76} />
          <div className="grow stack-sm">
            <span className="small" style={{ fontWeight: 700 }}>Showing: {source}</span>
            <div className="row">
              <button type="button" className="btn btn-sm grow" onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}>{busy ? 'Resizing…' : f.photo ? 'Change photo' : 'Upload photo'}</button>
              {f.photo && <button type="button" className="btn btn-sm btn-danger" onClick={() => setF({ ...f, photo: '' })}>Remove</button>}
            </div>
          </div>
        </div>
        <input ref={fileRef} id="it-photo" type="file" accept="image/*" hidden onChange={pick} />
        {err && <p className="warn">{err}</p>}
        <label htmlFor="it-link" className="label" style={{ marginTop: 6 }}>Image link</label>
        <div className="row">
          <input id="it-link" className="input grow" type="url" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck="false" value={link} onChange={(e) => { setLink(e.target.value); setLinkMsg(null); }} placeholder="https://…/photo.jpg" />
          {(f.imageUrl || f.imageData) && link.trim() === (f.imageUrl || '') ? <button type="button" className="btn btn-sm btn-danger" onClick={clearLink}>Remove</button>
            : <button type="button" className="btn btn-sm" disabled={!link.trim() || linkBusy} onClick={useLink}>{linkBusy ? 'Checking…' : 'Use'}</button>}
        </div>
        {linkMsg && <p className={linkMsg.kind === 'err' ? 'warn' : 'hint'} style={linkMsg.kind === 'ok' ? { color: 'var(--ok)' } : null}>{linkMsg.text}</p>}
        {f.photo && (f.imageUrl || f.imageData) && <p className="hint">Your uploaded photo is used first. Remove it to show the link instead.</p>}
        {topic.photos && (
          <>
            <label htmlFor="it-wiki" className="label" style={{ marginTop: 6 }}>Wikipedia page</label>
            <input id="it-wiki" className="input" value={f.wiki || ''} autoCapitalize="off" onChange={(e) => setF({ ...f, wiki: e.target.value })} placeholder={wikiDefault || 'No photo for this item'} />
            <p className="hint">Wrong photo? Type the exact article name, e.g. “Dave (rapper)”.</p>
            <label className="row small" style={{ gap: 8 }}><input id="it-nophoto" type="checkbox" checked={!!f.photosOff} onChange={(e) => setF({ ...f, photosOff: e.target.checked })} style={{ width: 22, height: 22 }} /> No Wikipedia photo for this item</label>
          </>
        )}
      </div>
      <div className="row">
        {onDelete && <button className="btn btn-danger btn-sm" onClick={() => { onDelete(); onClose(); }}>Delete</button>}
        <button className="btn btn-ghost grow" onClick={onClose}>Cancel</button>
        <button className="btn btn-gold grow" disabled={!f.name.trim()} onClick={() => { onSave({ ...f, name: f.name.trim(), pos: (f.pos || '').trim(), desc: (f.desc || '').trim(), wiki: (f.wiki || '').trim() }); onClose(); }}>Save</button>
      </div>
    </Sheet>
  );
}

function TopicEditor({ topic, folders, onChange, onBack, onDuplicate, onDelete }) {
  const [newFolder, setNewFolder] = useState(false);
  const [editing, setEditing] = useState(null);
  const [bulk, setBulk] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [slotTxt, setSlotTxt] = useState(topic.slots.join(', '));
  const [del, setDel] = useState(false);
  useEffect(() => { setSlotTxt(topic.slots.join(', ')); }, [topic.id]);
  const set = (patch) => onChange({ ...topic, ...patch });
  const move = (i, dir) => { const a = [...topic.items]; const j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set({ items: a }); };
  const saveItem = (it) => { const exists = topic.items.some((x) => x.id === it.id); set({ items: exists ? topic.items.map((x) => (x.id === it.id ? it : x)) : [...topic.items, it] }); };
  const doBulk = () => {
    const add = bulk.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const parts = l.split(/\s+[-–—]\s+/);
      return { id: uid(), name: parts[0].trim(), pos: (parts[1] || '').trim(), desc: parts.slice(2).join(' - ').trim(), photo: '' };
    }).filter((x) => x.name);
    if (add.length) set({ items: [...topic.items, ...add] });
    setBulk(''); setBulkOpen(false);
  };
  const slotsParsed = parseSlots(slotTxt);
  const counts = {};
  topic.items.forEach((it) => { const k = it.pos || '—'; counts[k] = (counts[k] || 0) + 1; });
  return (
    <div className="app">
      <TopBar onBack={onBack} title="Edit topic" right={<button className="pillbtn" onClick={onDuplicate}>Copy</button>} />
      <div className="card stack">
        <div className="row">
          <div className="field" style={{ width: 76, flex: 'none' }}><label htmlFor="tp-emoji">Emoji</label><input id="tp-emoji" className="input" style={{ textAlign: 'center', fontSize: 26, padding: 6 }} value={topic.emoji} onChange={(e) => set({ emoji: [...e.target.value].slice(-2).join('') })} /></div>
          <div className="field grow"><label htmlFor="tp-name">Name</label><input id="tp-name" className="input" value={topic.name} onChange={(e) => set({ name: e.target.value })} placeholder="Topic name" /></div>
        </div>
        <div className="field">
          <label htmlFor="tp-folder">Folder</label>
          <select id="tp-folder" className="input" value={newFolder ? '__new' : folderOf(topic)} onChange={(e) => { if (e.target.value === '__new') setNewFolder(true); else { setNewFolder(false); set({ folder: e.target.value }); } }}>
            {[...new Set([...folders, folderOf(topic)])].map((f) => <option key={f} value={f}>{folderEmoji(f)} {f}</option>)}
            <option value="__new">+ New folder…</option>
          </select>
          {newFolder && <input id="tp-folder-new" className="input" autoFocus maxLength={24} placeholder="Folder name, e.g. Uni Friends" onChange={(e) => set({ folder: e.target.value.trim() || 'My Topics' })} />}
        </div>
        <div className="field">
          <label htmlFor="tp-slots">Slot template</label>
          <input id="tp-slots" className="input" value={slotTxt} onChange={(e) => { setSlotTxt(e.target.value); const p = parseSlots(e.target.value); if (p.length) set({ slots: p }); }} placeholder="GK, DEF, DEF, MID, MID, FWD" />
          <p className="hint">Comma-separated. Add a FLEX slot to take any position. Generic works too: Pick 1, Pick 2, Pick 3.</p>
          {!slotsParsed.length && <p className="warn">Add at least one slot.</p>}
        </div>
        <div className="field"><span className="label">Results layout</span><Seg label="Layout" value={topic.layout || 'list'} options={[['pitch', 'Pitch'], ['list', 'List']]} onChange={(v) => set({ layout: v })} /></div>
        <div className="field"><span className="label">Item pictures</span><Seg label="Item pictures" value={artOf(topic)} options={[['kit', 'Jerseys'], ['emoji', 'Emoji tiles']]} onChange={(v) => set({ art: v })} />
          <p className="hint">{artOf(topic) === 'kit' ? 'Jersey colours come from the country or club in each description.' : 'Each item shows its own emoji, or the topic emoji.'} Uploaded photos and image links always come first.</p></div>
        <Toggle on={!!topic.photos} onChange={(v) => { set({ photos: v }); if (v) wiki.prefetch(topic.items.map((i) => wikiTitleFor(i, { ...topic, photos: true })).filter(Boolean)); }}
          title="Real photos from Wikipedia" sub={topic.photos ? 'Items without a photo of their own use their Wikipedia picture when one exists.' : 'Off: items show the jersey or emoji unless you add a photo.'} />
      </div>

      <div className="row"><h3 className="grow">Items ({topic.items.length})</h3>
        <button className="btn btn-sm" onClick={() => setBulkOpen((v) => !v)}>Bulk add</button>
        <button className="btn btn-sm btn-gold" style={{ boxShadow: 'none' }} onClick={() => setEditing({ id: uid(), name: '', pos: '', desc: '', photo: '', isNew: true })}>+ Item</button>
      </div>
      {Object.keys(counts).length > 0 && <p className="hint">{Object.entries(counts).map(([k, v]) => k + ' ' + v).join(' · ')}</p>}
      {bulkOpen && (
        <div className="card stack">
          <div className="field">
            <label htmlFor="tp-bulk">Paste one item per line</label>
            <textarea id="tp-bulk" className="input" value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={'Thierry Henry - FWD\nRoy Keane - MID\nPeter Schmeichel - GK'} />
            <p className="hint">Format: Name - Position. Add a third part for a description: Name - Position - Club.</p>
          </div>
          <button className="btn btn-gold" disabled={!bulk.trim()} onClick={doBulk}>Add {bulk.split('\n').filter((l) => l.trim()).length || ''} items</button>
        </div>
      )}
      <div className="stack-sm">
        {topic.items.map((it, i) => (
          <div className="irow" key={it.id}>
            <Thumb item={it} topic={topic} />
            <button className="t" style={{ border: 0, background: 'none', textAlign: 'left', padding: 0 }} onClick={() => setEditing(it)}>
              <b>{it.name} {it.pos && <span className="pos">{it.pos}</span>}</b>
              <span>{it.desc || 'Tap to edit'}</span>
            </button>
            <button className="mini" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
            <button className="mini" onClick={() => move(i, 1)} disabled={i === topic.items.length - 1} aria-label="Move down">↓</button>
          </div>
        ))}
        {!topic.items.length && <p className="muted">No items yet. Add them one by one or paste a list with Bulk add.</p>}
      </div>
      <button className="btn btn-danger" onClick={() => setDel(true)}>Delete topic</button>
      {editing && <ItemEditor item={editing} slots={topic.slots} topic={topic}onSave={(it) => { const { isNew, ...rest } = it; saveItem(rest); }} onDelete={editing.isNew ? null : () => set({ items: topic.items.filter((x) => x.id !== editing.id) })} onClose={() => setEditing(null)} />}
      {del && <Confirm title="Delete topic?" body="This can't be undone." yes="Delete" danger onYes={onDelete} onClose={() => setDel(false)} />}
    </div>
  );
}

/* ============================================================
   SETUP: managers → topic → rules
   ============================================================ */
function SetupManagers({ managers, setManagers, onBack, onNext }) {
  const upd = (i, patch) => setManagers(managers.map((m, k) => (k === i ? { ...m, ...patch } : m)));
  const move = (i, dir) => { const a = [...managers]; const j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setManagers(a); };
  const nextColor = (cur) => { const used = managers.map((m) => m.color); const start = COLORS.indexOf(cur); for (let k = 1; k <= COLORS.length; k++) { const c = COLORS[(start + k) % COLORS.length]; if (!used.includes(c) || c === cur) return c; } return cur; };
  const add = () => {
    const used = managers.map((m) => m.color); const color = COLORS.find((c) => !used.includes(c)) || COLORS[managers.length % COLORS.length];
    const usedE = managers.map((m) => m.emoji); const emoji = EMOJIS.find((e) => !usedE.includes(e)) || '🙂';
    setManagers([...managers, { id: uid(), name: '', color, emoji }]);
  };
  const valid = managers.length >= 2 && managers.every((m) => m.name.trim());
  return (
    <div className="app">
      <TopBar onBack={onBack} title="1 · Managers" />
      <div><h2 className="display">Who's bidding?</h2><p className="hint">2 to 8 managers. Tap the colour or emoji to change it.</p></div>
      <div className="stack-sm">
        {managers.map((m, i) => (
          <div className="mrow" key={m.id} style={mStyle(m)}>
            <button className="emo" onClick={() => upd(i, { emoji: EMOJIS[(EMOJIS.indexOf(m.emoji) + 1) % EMOJIS.length] })} aria-label="Change emoji">{m.emoji}</button>
            <button className="swatch" onClick={() => upd(i, { color: nextColor(m.color) })} aria-label="Change colour" />
            <input id={'mgr-' + m.id} className="input grow" value={m.name} maxLength={16} placeholder={'Manager ' + (i + 1)} onChange={(e) => upd(i, { name: e.target.value })} />
            <button className="mini" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
            <button className="mini" onClick={() => move(i, 1)} disabled={i === managers.length - 1} aria-label="Move down">↓</button>
            <button className="mini" onClick={() => setManagers(managers.filter((_, k) => k !== i))} disabled={managers.length <= 2} aria-label="Remove">✕</button>
          </div>
        ))}
      </div>
      <button className="btn" onClick={add} disabled={managers.length >= 8}>+ Add manager {managers.length >= 8 ? '(max 8)' : ''}</button>
      {!valid && <p className="hint">Every manager needs a name.</p>}
      <button className="btn btn-gold" disabled={!valid} onClick={onNext}>Next: pick a topic</button>
    </div>
  );
}

function TopicSearch({ q, setQ }) {
  return <input id="topic-search" className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search topics" />;
}
const matchTopic = (t, q) => { const s = q.trim().toLowerCase(); return !s || t.name.toLowerCase().includes(s) || folderOf(t).toLowerCase().includes(s); };

// Folder grid → topics inside one folder. A search shows matching topics from every folder.
function FolderBrowser({ topics, q, folder, setFolder, renderTopic }) {
  if (q.trim()) {
    const r = topics.filter((t) => matchTopic(t, q));
    return <div className="stack-sm">{r.map(renderTopic)}{!r.length && <p className="muted">No topics match “{q.trim()}”.</p>}</div>;
  }
  const names = folderList(topics);
  if (folder && names.includes(folder)) {
    const r = topics.filter((t) => folderOf(t) === folder);
    return (
      <div className="stack-sm">
        <div className="row">
          <button className="iconbtn" onClick={() => setFolder(null)} aria-label="All folders">←</button>
          <h3 className="grow" style={{ fontSize: 24 }}>{folderEmoji(folder)} {folder}</h3>
          <span className="small muted">{r.length} topic{r.length === 1 ? '' : 's'}</span>
        </div>
        {r.map(renderTopic)}
      </div>
    );
  }
  return (
    <div className="foldergrid">
      {names.map((f) => {
        const ts = topics.filter((t) => folderOf(t) === f);
        return (
          <button key={f} className="folder" onClick={() => setFolder(f)}>
            <span className="tab" />
            <span className="fe">{folderEmoji(f)}</span>
            <span className="fn">{f}</span>
            <span className="fc">{ts.length} topic{ts.length === 1 ? '' : 's'}</span>
            <span className="fm">{ts.slice(0, 5).map((t) => t.emoji).join(' ')}</span>
          </button>
        );
      })}
    </div>
  );
}

function SetupTopic({ topics, onBack, onPick, onTopics, folder, setFolder }) {
  const [q, setQ] = useState('');
  return (
    <div className="app">
      <TopBar onBack={folder && !q ? () => setFolder(null) : onBack} title="2 · Topic" />
      <h2 className="display">What are we drafting?</h2>
      <TopicSearch q={q} setQ={setQ} />
      <FolderBrowser topics={topics} q={q} folder={folder} setFolder={setFolder} renderTopic={(t) => (
        <button key={t.id} className="tcard" onClick={() => onPick(t.id)} disabled={!t.items.length || !t.slots.length} style={{ opacity: t.items.length ? 1 : 0.4 }}>
          <span className="em">{t.emoji || '🎲'}</span>
          <span className="meta"><span className="name">{t.name}</span><span className="sub">{t.items.length} items · {t.slots.length} slots{q ? ' · ' + folderOf(t) : ''}</span></span>
          <span className="muted" style={{ fontSize: 22 }}>›</span>
        </button>
      )} />
      <button className="btn btn-ghost" onClick={onTopics}>Manage topics</button>
    </div>
  );
}

function SetupRules({ topic, managers, rules, setRules, onBack, onStart }) {
  const [slotTxt, setSlotTxt] = useState(rules.slots.join(', '));
  const slots = parseSlots(slotTxt);
  const set = (p) => setRules({ ...rules, ...p });
  const needed = rules.minBid * slots.length;
  const problems = [];
  if (!slots.length) problems.push('Add at least one slot.');
  if (rules.budget < needed) problems.push('A budget of ' + money(rules.budget) + " can't fill " + slots.length + ' slots at ' + money(rules.minBid) + ' each. Raise it to at least ' + money(needed) + '.');
  if (topic.items.length < slots.length * managers.length) problems.push('Heads up: ' + topic.items.length + ' items for ' + slots.length * managers.length + ' slots. Some teams will finish short.');
  const blocking = problems.filter((p) => !p.startsWith('Heads up'));
  const posMissing = [...new Set(topic.items.map((i) => i.pos).filter((p) => p && !slots.some((s) => norm(s) === norm(p))))];
  return (
    <div className="app">
      <TopBar onBack={onBack} title="3 · Rules" />
      <div><p className="eyebrow">{topic.emoji} {topic.name}</p><h2 className="display">House rules</h2></div>
      <div className="card stack">
        <div className="field"><label htmlFor="r-budget">Starting budget</label><Stepper id="r-budget" prefix="$" value={rules.budget} min={1} max={999} onChange={(v) => set({ budget: v })} /></div>
        <div className="row">
          <div className="field grow"><label htmlFor="r-min">Minimum bid</label><Stepper id="r-min" prefix="$" value={rules.minBid} min={1} max={99} onChange={(v) => set({ minBid: v })} /></div>
        </div>
        <div className="field"><label htmlFor="r-inc">Bid increment</label><Stepper id="r-inc" prefix="$" value={rules.inc} min={1} max={99} onChange={(v) => set({ inc: v })} /></div>
      </div>
      <div className="card stack">
        <div className="field">
          <label htmlFor="r-slots">Slots per team ({slots.length})</label>
          <input id="r-slots" className="input" value={slotTxt} onChange={(e) => { setSlotTxt(e.target.value); const p = parseSlots(e.target.value); if (p.length) set({ slots: p }); }} />
          {posMissing.length > 0 && <p className="hint">No slot for {posMissing.join(', ')}. Those items can go in any open slot.</p>}
        </div>
        <div className="field"><span className="label">Item order</span><Seg label="Item order" value={rules.order} options={[['random', 'Shuffle'], ['saved', 'Saved order']]} onChange={(v) => set({ order: v })} /></div>
        <div className="field"><span className="label">Bid timer</span><Seg label="Bid timer" value={rules.timer} options={[[0, 'Off'], [10, '10s'], [15, '15s'], [30, '30s']]} onChange={(v) => set({ timer: v })} />
          {rules.timer > 0 && <p className="hint">Resets on every bid. When it runs out with a leader, the item sells automatically.</p>}</div>
        <Toggle on={rules.mustFill} onChange={(v) => set({ mustFill: v })} title="Must be able to fill your team" sub={'Max bid keeps ' + money(rules.minBid) + ' for every other empty slot.'} />
        <div className="field"><span className="label">Items with no bids</span><Seg label="No bids" value={rules.noBids} options={[['skip', 'Skip them'], ['back', 'Back of queue']]} onChange={(v) => set({ noBids: v })} />
          <p className="hint">{rules.noBids === 'back' ? 'An unsold item comes round once more, then goes to the leftovers.' : 'Unsold items go to the leftovers for free picks at the end.'}</p></div>
      </div>
      {problems.map((p) => <p key={p} className={p.startsWith('Heads up') ? 'hint' : 'warn'}>{p}</p>)}
      <button className="btn btn-gold" disabled={blocking.length > 0} onClick={() => onStart({ ...rules, slots })}>Start the draft</button>
    </div>
  );
}

/* ============================================================
   AUCTION
   ============================================================ */
function ManagerButton({ d, m, onBid, onCustom, disabledAll }) {
  const amt = nextAmount(d);
  const isLead = d.bid && d.bid.leaderId === m.id;
  const blocker = bidBlocker(d, m);
  const enabled = !disabledAll && !blocker && canBid(d, m, amt);
  const customOk = !disabledAll && canBid(d, m, d.bid ? d.bid.amount + 1 : d.rules.minBid);
  const t = useRef(null); const fired = useRef(true);
  const down = () => { if (!customOk) return; fired.current = false; t.current = setTimeout(() => { fired.current = true; buzz(25); onCustom(); }, 550); };
  const up = () => { clearTimeout(t.current); if (!fired.current && enabled) onBid(amt); fired.current = true; };
  const cancel = () => { clearTimeout(t.current); fired.current = true; };
  const filled = d.rules.slots.length - emptyCount(m);
  return (
    <div role="button" tabIndex={enabled ? 0 : -1} aria-disabled={!enabled}
      className={'mgr' + (isLead ? ' isLead' : '') + (!isLead && !enabled && !customOk ? ' off' : '')}
      style={mStyle(m)}
      onPointerDown={down} onPointerUp={up} onPointerLeave={cancel} onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && enabled) { e.preventDefault(); onBid(amt); } }}>
      <span className="who">{m.emoji} {m.name}</span>
      <span className="money num">{money(m.budget)}</span>
      <span className="st">{isLead ? <span className="badge">★ Leading{enabled ? ' · tap +' + money(d.rules.inc) : ''}</span> : (blocker || 'Tap: ' + money(amt))} · {filled}/{d.rules.slots.length}</span>
      {customOk && <button className="edit" aria-label={'Custom bid for ' + m.name} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onCustom(); }}>✎</button>}
    </div>
  );
}

function CustomBid({ d, m, onSet, onClose }) {
  const lo = d.bid ? d.bid.amount + 1 : d.rules.minBid;
  const hi = maxBid(m, d.rules);
  const [v, setV] = useState(String(Math.min(hi, nextAmount(d))));
  const n = parseInt(v, 10);
  const ok = !isNaN(n) && n >= lo && n <= hi;
  return (
    <Sheet center onClose={onClose}>
      <p className="eyebrow">Custom bid</p>
      <h2 className="display" style={{ fontSize: 32, color: m.color }}>{m.emoji} {m.name}</h2>
      <input id="custom-bid" className="input" autoFocus inputMode="numeric" style={{ fontFamily: 'var(--display)', fontSize: 48, textAlign: 'center', minHeight: 80 }} value={'$' + v} onChange={(e) => setV(e.target.value.replace(/[^0-9]/g, ''))}
        onKeyDown={(e) => { if (e.key === 'Enter' && ok) { onSet(n); onClose(); } }} />
      <p className="hint" style={{ textAlign: 'center' }}>Allowed: {money(lo)} to {money(hi)}</p>
      <div className="row"><button className="btn btn-ghost grow" onClick={onClose}>Cancel</button><button className="btn btn-gold grow" disabled={!ok} onClick={() => { onSet(n); onClose(); }}>Bid {ok ? money(n) : ''}</button></div>
    </Sheet>
  );
}

// Small credit link shown when the picture on screen came from Wikipedia.
function WikiCredit({ item, topic }) {
  const title = item.photo || item.imageData || item.imageUrl ? null : wikiTitleFor(item, topic);
  const url = useWikiImage(title);
  if (!title || !url) return null;
  const page = wiki.page(title) || title;
  return <a className="credit" href={'https://en.wikipedia.org/wiki/' + encodeURIComponent(page.replace(/ /g, '_'))} target="_blank" rel="noopener noreferrer">Photo: Wikipedia ↗</a>;
}

function ItemCard({ item, d }) {
  const pos = norm(item.pos);
  const inTemplate = pos && d.rules.slots.some((s) => norm(s) === pos);
  const hasFlex = d.rules.slots.some(isFlex);
  return (
    <div className="flip">
      <div className="flip-inner">
        <div className="face itemcard">
          <div className="ph"><ItemArt item={item} topic={d.topic} size={104} radius={16} /></div>
          <div className="info">
            {item.pos && <span><span className="pos">{item.pos}</span></span>}
            <div className="nm">{item.name}</div>
            {item.desc && <div className="ds">{item.desc}</div>}
            <div className="fits">{inTemplate ? 'Fills a ' + item.pos + ' slot' + (hasFlex ? ' or FLEX' : '') : 'Fills any open slot'}</div>
            <WikiCredit item={item} topic={d.topic} />
          </div>
        </div>
        <div className="face back"><span>?</span></div>
      </div>
    </div>
  );
}

function Auction({ d, setDraft, goHome, flashing, onFlash }) {
  const item = currentItem(d);
  const [paused, setPaused] = useState(false);
  const [gavel, setGavel] = useState(false);
  const [custom, setCustom] = useState(null);
  const [teams, setTeams] = useState(false);
  const busy = useRef(false);
  const timer = d.rules.timer || 0;
  const [left, setLeft] = useState(timer);
  const bidKey = d.reveal + ':' + (d.bid ? d.bid.amount + d.bid.leaderId : 'none');
  useEffect(() => { setLeft(timer); }, [bidKey, timer]);

  const leader = d.bid && d.managers.find((m) => m.id === d.bid.leaderId);
  const total = d.processed + d.queue.length;

  function sold() {
    if (!d.bid || busy.current || flashing) return;
    busy.current = true;
    const info = { kind: 'sold', name: leader.name, emoji: leader.emoji, color: leader.color, price: d.bid.amount, item: item.name };
    buzz([40, 30, 160]); setGavel(true);
    setTimeout(() => { setGavel(false); onFlash(info); setDraft((p) => sell(p)); busy.current = false; }, 520);
  }
  function skip() {
    if (busy.current || flashing) return;
    const back = d.rules.noBids === 'back' && !d.passed.includes(d.queue[0]);
    onFlash({ kind: 'skip', item: item.name, back });
    setDraft((p) => skipItem(p));
  }

  useEffect(() => {
    if (!timer || paused || flashing || gavel) return;
    if (left <= 0) { if (d.bid) sold(); return; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, paused, flashing, gavel, timer]);

  if (!item) return null;
  const lc = leader ? leader.color : null;
  const showCard = !flashing;
  return (
    <div className="app auction">
      <div className="topbar">
        <button className="iconbtn" onClick={goHome} aria-label="Home">⌂</button>
        <div className="title num">Item {d.processed + 1} of {total}</div>
        <button className="pillbtn" onClick={() => setTeams(true)}>Teams</button>
        <button className="iconbtn" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Resume' : 'Pause'}>{paused ? '▶' : 'Ⅱ'}</button>
      </div>
      <div className="progress"><div className="bar"><i style={{ width: (d.processed / Math.max(1, total)) * 100 + '%' }} /></div><span className="small muted num">{d.queue.length - 1} left</span></div>

      <div className="paused stack">
        {showCard ? <ItemCard key={d.reveal} item={item} d={d} /> : <div style={{ minHeight: 156 }} />}
        <div className={'bidbox' + (leader ? ' lead' : '')} style={lc ? { '--lc': lc } : null}>
          {timer > 0 && <span className={'timernum num' + (left <= 3 ? ' hot' : '')}>{Math.max(0, left)}</span>}
          <div key={bidKey} className={'amount num' + (leader ? ' pop' : '')}>{money(d.bid ? d.bid.amount : d.rules.minBid)}</div>
          <div className="leader" style={{ color: lc || 'var(--muted)' }}>{leader ? leader.emoji + ' ' + leader.name + ' leads' : timer > 0 && left <= 0 ? "Time's up · no bids" : 'Opening bid · tap a manager'}</div>
          {timer > 0 && <span className="timer" style={{ width: (Math.max(0, left) / timer) * 100 + '%' }} />}
        </div>
        {paused && (
          <div className="pausecover">
            <div className="stack" style={{ alignItems: 'center' }}>
              <h2 className="display" style={{ fontSize: 56, color: 'var(--gold)' }}>Paused</h2>
              <button className="btn btn-gold" style={{ width: 200 }} onClick={() => setPaused(false)}>Resume</button>
            </div>
          </div>
        )}
      </div>

      <div className="mgr-grid">
        {d.managers.map((m) => (
          <ManagerButton key={m.id} d={d} m={m} disabledAll={paused || flashing || gavel}
            onBid={(amt) => { buzz(12); setDraft((p) => placeBid(p, m.id, amt)); }}
            onCustom={() => setCustom(m.id)} />
        ))}
      </div>
      <p className="hint" style={{ textAlign: 'center' }}>Tap to bid +{money(d.rules.inc)} · hold or ✎ for a custom bid</p>

      <div className="actions">
        <button className="btn" onClick={() => setDraft((p) => undo(p))} disabled={paused || flashing || (!d.bid && !d.history.length)}>{undoLabel(d)}</button>
        <button className="btn" onClick={skip} disabled={paused || flashing || !!d.bid}>No bids</button>
        <button className="btn btn-gold sold" onClick={sold} disabled={paused || flashing || !d.bid}>Sold!</button>
      </div>
      {gavel && <div className="gavel" aria-hidden="true">🔨</div>}
      {custom && <CustomBid d={d} m={d.managers.find((x) => x.id === custom)} onSet={(n) => { buzz(12); setDraft((p) => placeBid(p, custom, n)); }} onClose={() => setCustom(null)} />}
      {teams && <TeamsSheet d={d} onClose={() => setTeams(false)} />}
    </div>
  );
}

/* ============================================================
   FREE PICKS (snake order)
   ============================================================ */
function FreePick({ d, setDraft, goHome, flashing, onFlash }) {
  const [teams, setTeams] = useState(false);
  const cp = currentPicker(d);
  if (!cp) return null;
  const m = cp.m;
  const avail = d.leftover.filter((id) => canTake(d, m, id));
  const pick = (id) => {
    if (flashing) return;
    onFlash({ kind: 'free', name: m.name, emoji: m.emoji, color: m.color, item: d.items[id].name });
    setDraft((p) => freePick(p, id));
  };
  return (
    <div className="app">
      <div className="topbar">
        <button className="iconbtn" onClick={goHome} aria-label="Home">⌂</button>
        <div className="title">Free picks · round {cp.round + 1}</div>
        <button className="pillbtn" onClick={() => setTeams(true)}>Teams</button>
      </div>
      <p className="hint" style={{ textAlign: 'center' }}>The auction is over and some teams still have empty slots. Leftovers are free, picked in snake order.</p>
      <div className="picker" style={mStyle(m)}>
        <p className="eyebrow">On the clock</p>
        <h2 className="display" style={{ fontSize: 48 }}>{m.emoji} {m.name}</h2>
        <p className="small" style={{ margin: 0 }}>{emptyCount(m)} empty slot{emptyCount(m) === 1 ? '' : 's'} · {money(m.budget)} left</p>
      </div>
      <div className="pickgrid">
        {avail.map((id) => { const it = d.items[id]; return (
          <button key={id} className="pickbtn" onClick={() => pick(id)} disabled={flashing}>
            <Thumb item={it} topic={d.topic} />
            <span className="grow" style={{ minWidth: 0 }}><b style={{ display: 'block' }}>{it.name} {it.pos && <span className="pos">{it.pos}</span>}</b><span className="small muted">{it.desc}</span></span>
            <span style={{ fontFamily: 'var(--display)', color: 'var(--ok)', fontSize: 18 }}>FREE</span>
          </button>
        ); })}
      </div>
      <button className="btn" onClick={() => setDraft((p) => undo(p))} disabled={!d.history.length || flashing}>{undoLabel(d)}</button>
      {teams && <TeamsSheet d={d} onClose={() => setTeams(false)} />}
    </div>
  );
}

/* ============================================================
   RESULTS
   ============================================================ */
const ROW_OF = { GK: 'GK', GOALKEEPER: 'GK', DEF: 'DEF', CB: 'DEF', LB: 'DEF', RB: 'DEF', FB: 'DEF', DEFENDER: 'DEF', MID: 'MID', CM: 'MID', CDM: 'MID', CAM: 'MID', LM: 'MID', RM: 'MID', MIDFIELDER: 'MID', FWD: 'FWD', ST: 'FWD', CF: 'FWD', LW: 'FWD', RW: 'FWD', FW: 'FWD', ATT: 'FWD', FORWARD: 'FWD' };
function Pitch({ d, m }) {
  const rows = { FWD: [], MID: [], DEF: [], GK: [] }; const bench = [];
  d.rules.slots.forEach((s, i) => {
    const t = m.team[i]; const it = t && d.items[t.itemId];
    let r = ROW_OF[norm(s)];
    if (!r && it) r = ROW_OF[norm(it.pos)];
    const entry = { s, t, it, i };
    if (r) rows[r].push(entry); else bench.push(entry);
  });
  return (
    <div>
      <div className="pitch">
        {['FWD', 'MID', 'DEF', 'GK'].filter((r) => rows[r].length).map((r) => (
          <div className="prow" key={r}>
            {rows[r].map(({ s, t, it, i }) => (
              <div className="pl" key={i}>
                <div className={'dot' + (it ? '' : ' none')}>{it ? <ItemArt item={it} topic={d.topic} size={40} round /> : s}</div>
                <span className="lb">{it ? lastName(it.name) : 'Empty'}</span>
                {t && <span className="pr num">{t.free ? 'FREE' : money(t.price)}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      {bench.length > 0 && <div className="bench">{bench.map(({ s, t, it, i }) => (
        <div className="slotline" key={i}><span className="s">{s}</span>{it ? <span className="n">{it.name}</span> : <span className="n empty">Empty</span>}{t && <span className="p num">{t.free ? 'FREE' : money(t.price)}</span>}</div>
      ))}</div>}
    </div>
  );
}
function TeamCard({ d, m, win }) {
  return (
    <div className={'team' + (win ? ' win' : '')} style={mStyle(m)}>
      <div className="th">
        <span style={{ fontSize: 26 }}>{win ? '👑' : m.emoji}</span>
        <span className="nm">{m.name}</span>
        <span className="mo">spent<b className="num">{money(spent(d, m))}</b></span>
        <span className="mo">left<b className="num">{money(m.budget)}</b></span>
      </div>
      <div className="tb">{d.topic.layout === 'pitch' ? <Pitch d={d} m={m} /> : <TeamList d={d} m={m} />}</div>
    </div>
  );
}

function Confetti({ colors }) {
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = ref.current; const ctx = c && c.getContext ? c.getContext('2d') : null; if (!ctx) return undefined; let raf; const W = (c.width = innerWidth), H = (c.height = innerHeight);
    const ps = Array.from({ length: 160 }, () => ({ x: Math.random() * W, y: -20 - Math.random() * H * 0.6, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, w: 6 + Math.random() * 8, h: 4 + Math.random() * 6, c: colors[Math.floor(Math.random() * colors.length)] }));
    const start = performance.now();
    const tick = (t) => {
      ctx.clearRect(0, 0, W, H);
      ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); });
      if (t - start < 4500) raf = requestAnimationFrame(tick); else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}

function Voting({ d, onVote, onReveal, onClose }) {
  const [voter, setVoter] = useState(null);
  const [choice, setChoice] = useState(null);
  const [locked, setLocked] = useState(false);
  const voted = Object.keys(d.votes || {}).length;
  if (locked) return (
    <Sheet center onClose={() => {}}>
      <h2 className="display" style={{ fontSize: 40, textAlign: 'center' }}>Vote locked 🔒</h2>
      <p className="muted" style={{ textAlign: 'center', margin: 0 }}>Pass the phone to the next manager.</p>
      <button className="btn btn-gold" onClick={() => { setLocked(false); setVoter(null); setChoice(null); }}>Next voter</button>
    </Sheet>
  );
  if (voter) {
    const v = d.managers.find((m) => m.id === voter);
    return (
      <Sheet center onClose={() => { setVoter(null); setChoice(null); }}>
        <p className="eyebrow">Secret vote</p>
        <h2 className="display" style={{ fontSize: 32, color: v.color }}>{v.emoji} {v.name}, pick the best team</h2>
        <p className="hint">You can't vote for your own.</p>
        <div className="stack-sm">
          {d.managers.filter((m) => m.id !== voter).map((m) => (
            <button key={m.id} className="votebtn" style={{ ...mStyle(m), alignItems: 'stretch', textAlign: 'left' }} aria-pressed={choice === m.id} onClick={() => setChoice(m.id)}>
              <span>{m.emoji} {m.name}</span>
              <span className="teamtxt">{m.team.filter(Boolean).map((t) => d.items[t.itemId].name).join(', ') || 'No items'}</span>
            </button>
          ))}
        </div>
        <div className="row pin">
          <button type="button" className="btn btn-ghost grow" onClick={() => { setVoter(null); setChoice(null); }}>Back</button>
          <button type="button" className="btn btn-gold grow" disabled={!choice} onClick={() => { if (!choice) return; buzz(30); onVote(voter, choice); setLocked(true); }}>
            {choice ? 'Lock in ' + d.managers.find((m) => m.id === choice).name : 'Pick a team'}
          </button>
        </div>
      </Sheet>
    );
  }
  return (
    <Sheet center onClose={onClose}>
      <p className="eyebrow">Secret vote · {voted} of {d.managers.length} in</p>
      <h2 className="display" style={{ fontSize: 34 }}>Pass the phone around</h2>
      <p className="hint">Each manager taps their own name, then votes in private.</p>
      <div className="votegrid">
        {d.managers.map((m) => { const done = d.votes && d.votes[m.id]; return (
          <button key={m.id} className="votebtn" style={mStyle(m)} disabled={!!done} onClick={() => setVoter(m.id)}>
            <span style={{ fontSize: 24 }}>{done ? '✅' : m.emoji}</span>{m.name}
          </button>
        ); })}
      </div>
      <div className="row pin">
        <button type="button" className="btn btn-ghost" style={{ width: 'auto' }} onClick={onClose}>Close</button>
        <button type="button" className="btn btn-gold grow" disabled={!voted} onClick={onReveal}>{voted === d.managers.length ? 'Reveal winner' : 'Reveal (' + voted + '/' + d.managers.length + ')'}</button>
      </div>
    </Sheet>
  );
}

function Results({ d, past, onChange, onBack, onUndo, onFinish, live }) {
  const ref = useRef(null);
  const [voting, setVoting] = useState(false);
  const [img, setImg] = useState(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [imgErr, setImgErr] = useState('');
  const [party, setParty] = useState(0);
  const stats = useMemo(() => draftStats(d), [d]);
  const { counts, winners } = tally(d);
  const revealed = d.votesRevealed && winners.length > 0;
  const winIds = revealed ? winners.map((w) => w.id) : [];
  const ordered = revealed ? [...d.managers].sort((a, b) => counts[b.id] - counts[a.id]) : d.managers;
  const exportImg = async () => {
    setImgBusy(true); setImgErr('');
    try {
      if (!window.html2canvas) throw new Error('missing');
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
      const canvas = await window.html2canvas(ref.current, { backgroundColor: '#0f0c21', scale: Math.min(3, Math.max(2, window.devicePixelRatio || 2)), useCORS: true, allowTaint: false, logging: false, imageTimeout: 8000 });
      const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('empty'))), 'image/png'));
      const slug = (d.topic.name || 'draft').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
      setImg({ url: URL.createObjectURL(blob), blob, name: 'draft-night-' + slug + '-' + todayStamp() + '.png' });
    } catch (e) { setImgErr("The image couldn't be made. Try again, and if it keeps failing, take a screenshot instead."); }
    setImgBusy(false);
  };
  const closeImg = () => { if (img) URL.revokeObjectURL(img.url); setImg(null); setImgNote(''); };
  const [imgNote, setImgNote] = useState('');
  const doShare = async () => { const r = await shareFile(img.blob, img.name, 'Draft Night results'); if (r === 'unsupported') setImgNote("Sharing isn't available here. Use Download, or press and hold the picture."); };
  const doDownload = () => { downloadBlob(img.blob, img.name); setImgNote(isIOS() ? 'On iPhone, check the Downloads folder in the Files app. To put it in Photos, press and hold the picture instead.' : 'Saved to your downloads.'); };
  return (
    <div className="app">
      <TopBar onBack={onBack} backLabel="⌂" title="Results" right={live && onUndo && d.history.length && !d.votesRevealed ? <button className="pillbtn" onClick={onUndo}>Undo</button> : null} />
      <div ref={ref} className="resultwrap">
        <div className="rhead">
          <p className="eyebrow">{d.topic.emoji} {d.topic.name} · {new Date(d.createdAt).toLocaleDateString()}</p>
          <h2 className="display" style={{ fontSize: 46 }}>{revealed ? 'We have a winner' : 'Final teams'}</h2>
        </div>
        {revealed && (
          <div className="winner">
            <p className="eyebrow" style={{ color: 'var(--gold-ink)' }}>Best team · {counts[winners[0].id]} vote{counts[winners[0].id] === 1 ? '' : 's'}</p>
            <div className="display">{winners.map((w) => w.emoji + ' ' + w.name).join(' & ')}</div>
            {winners.length > 1 && <p className="small" style={{ margin: 0, fontWeight: 700 }}>It's a tie!</p>}
          </div>
        )}
        {ordered.map((m) => <TeamCard key={m.id} d={d} m={m} win={winIds.includes(m.id)} />)}
        <div className="stat-grid">
          <div className="stat"><span className="k">Most expensive</span>{stats.expensive ? <><span className="v num">{money(stats.expensive.price)}</span><span className="d">{stats.expensive.item.name} · {stats.expensive.m.name}</span></> : <span className="d muted">No sales</span>}</div>
          <div className="stat"><span className="k">Biggest bargain</span>{stats.bargain ? <><span className="v num">{money(stats.bargain.price)}</span><span className="d">{stats.bargain.item.name} · {stats.bargain.m.name}</span></> : <span className="d muted">Not enough sales</span>}</div>
          <div className="stat"><span className="k">Biggest spender</span><span className="v num">{money(stats.spender.s)}</span><span className="d">{stats.spender.m.emoji} {stats.spender.m.name}</span></div>
          <div className="stat"><span className="k">Cheapest team</span><span className="v num">{money(stats.cheapest.s)}</span><span className="d">{stats.cheapest.m.emoji} {stats.cheapest.m.name}</span></div>
        </div>
        {revealed && (
          <div className="board">
            <h3>🗳️ Vote tally</h3>
            {ordered.map((m) => (
              <div key={m.id} className={'brow' + (winIds.includes(m.id) ? ' hl' : '')} style={mStyle(m)}>
                <span className="bn">{m.emoji} {m.name}</span>
                <span className="bb"><i style={{ width: (counts[m.id] / Math.max(1, counts[ordered[0].id])) * 100 + '%' }} /></span>
                <span className="bw num">{counts[m.id]}</span>
              </div>
            ))}
          </div>
        )}
        {revealed && <Leaderboard rows={winsBoard([...(past || []).filter((p) => p.id !== d.id), d])} highlight={winners.map((w) => w.name.trim().toLowerCase())} />}
        <p className="exportfoot">DRAFT NIGHT · {(location.host + location.pathname).replace(/\/(index\.html)?$/, '')}</p>
      </div>

      <div className="stack">
        {!revealed && <button className="btn btn-gold" onClick={() => setVoting(true)}>{Object.keys(d.votes || {}).length ? 'Continue the vote' : 'Start the secret vote'}</button>}
        <button className="btn" onClick={exportImg} disabled={imgBusy}>{imgBusy ? 'Making image…' : 'Save as image'}</button>
        {imgErr && <p className="warn">{imgErr}</p>}
        {revealed && <button className="btn btn-ghost" onClick={() => onChange({ ...d, votes: {}, votesRevealed: false })}>Redo the vote</button>}
        {live && <button className="btn btn-ghost" onClick={onFinish}>Finish · back to home</button>}
        <p className="hint" style={{ textAlign: 'center' }}>{live ? 'This draft is saved in Past Drafts.' : 'Saved in Past Drafts.'}</p>
      </div>

      {voting && <Voting d={d} onVote={(v, t) => onChange({ ...d, votes: { ...(d.votes || {}), [v]: t } })}
        onReveal={() => { onChange({ ...d, votesRevealed: true }); setVoting(false); setParty((x) => x + 1); buzz([60, 40, 60, 40, 200]); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onClose={() => setVoting(false)} />}
      {party > 0 && revealed && <Confetti key={party} colors={[...winners.map((w) => w.color), '#ffc83d', '#ffffff']} />}
      {img && (
        <Sheet center onClose={closeImg}>
          <h2 className="display" style={{ fontSize: 30 }}>Ready for the group chat</h2>
          <img className="imgout" src={img.url} alt="Draft results" />
          <div className="row">
            {canShareFiles() && <button className="btn btn-gold grow" onClick={doShare}>Share</button>}
            <button className={'btn grow' + (canShareFiles() ? '' : ' btn-gold')} onClick={doDownload}>Download</button>
          </div>
          <p className="hint">{imgNote || 'You can also press and hold the picture to save it to Photos.'}</p>
          <button className="btn btn-ghost" onClick={closeImg}>Done</button>
        </Sheet>
      )}
    </div>
  );
}

function PastList({ past, onBack, onOpen, onDelete }) {
  const [del, setDel] = useState(null);
  return (
    <div className="app">
      <TopBar onBack={onBack} title="Past drafts" />
      {!past.length && <div className="card"><p className="muted" style={{ margin: 0 }}>Finished drafts land here automatically, with their teams and votes.</p></div>}
      {past.some((p) => p.votesRevealed) && <Leaderboard rows={winsBoard(past)} />}
      <div className="stack-sm">
        {past.map((p) => { const { winners } = tally(p); return (
          <div key={p.id} className="irow" style={{ padding: 10 }}>
            <button className="tcard" style={{ border: 0, padding: 0, background: 'none' }} onClick={() => onOpen(p.id)}>
              <span className="em">{p.topic.emoji}</span>
              <span className="meta"><span className="name">{p.topic.name}</span>
                <span className="sub">{new Date(p.createdAt).toLocaleDateString()} · {p.managers.map((m) => m.name).join(', ')}</span>
                {p.votesRevealed && winners.length > 0 && <span className="sub" style={{ color: 'var(--gold)' }}>👑 {winners.map((w) => w.name).join(' & ')}</span>}
              </span>
            </button>
            <button className="mini" onClick={() => setDel(p)} aria-label="Delete">✕</button>
          </div>
        ); })}
      </div>
      {del && <Confirm title="Delete this draft?" body={del.topic.name + ' · ' + new Date(del.createdAt).toLocaleDateString()} yes="Delete" danger onYes={() => onDelete(del.id)} onClose={() => setDel(null)} />}
    </div>
  );
}

/* ============================================================
   FLASH (sold / skipped / free pick banner)
   ============================================================ */
function Flash({ f, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, f.kind === 'skip' ? 1100 : 1800); return () => clearTimeout(t); }, [f]);
  return (
    <div className="flash" onClick={onDone} style={{ '--fc': f.color || 'var(--muted)' }}>
      {f.kind === 'sold' && <div className="inner">
        <div className="big" style={{ color: 'var(--gold)' }}>SOLD!</div>
        <div className="to" style={{ color: f.color }}>to {f.emoji} {f.name}</div>
        <div className="price num">{money(f.price)}</div>
        <div className="it">{f.item}</div>
      </div>}
      {f.kind === 'skip' && <div className="inner">
        <div className="big" style={{ color: 'var(--muted)', fontSize: 72 }}>No bids</div>
        <div className="it">{f.item} {f.back ? 'goes to the back of the queue' : 'is skipped'}</div>
      </div>}
      {f.kind === 'free' && <div className="inner">
        <div className="big" style={{ color: 'var(--ok)', fontSize: 80 }}>Free pick</div>
        <div className="to" style={{ color: f.color }}>{f.emoji} {f.name}</div>
        <div className="it">takes {f.item}</div>
      </div>}
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */
const DEFAULT_RULES = { budget: 20, minBid: 1, inc: 1, order: 'random', timer: 0, mustFill: true, noBids: 'skip' };
const defaultManagers = () => ['Ash', 'Bilal', 'Cam', 'Dev'].map((name, i) => ({ id: uid(), name, color: COLORS[i], emoji: EMOJIS[i] }));
const stripDraft = (d) => ({ ...d, history: [] });

// Adds new starter topics to an existing install (without bringing back ones the user deleted)
// and gives older saved starter items their picture data.
function migrateTopics(stored) {
  const starters = starterTopics();
  const allIds = starters.map((s) => s.id);
  if (!Array.isArray(stored) || !stored.length) { store.set(K.seen, allIds); return starters; }
  const seen = store.get(K.seen, null) || ['t-pl', 't-cf', 't-nba', 't-ff'];
  const out = stored.map((t) => {
    const s = starters.find((x) => x.id === t.id);
    if (!s) return { ...t, art: artOf(t), folder: folderOf(t) };
    const byId = {}; s.items.forEach((i) => { byId[i.id] = i; });
    return { ...t, art: t.art || s.art, folder: t.folder || s.folder, kitShape: t.kitShape || s.kitShape, kitLabel: t.kitLabel || s.kitLabel, photos: t.photos === undefined ? s.photos : t.photos,
      items: t.items.map((i) => (byId[i.id] && !i.emoji && byId[i.id].emoji ? { ...i, emoji: byId[i.id].emoji } : i)) };
  });
  starters.forEach((s) => { if (!seen.includes(s.id) && !out.some((t) => t.id === s.id)) out.push(s); });
  store.set(K.seen, allIds);
  return out;
}

/* ============================================================
   BACKUP & APP SETTINGS
   ============================================================ */
const fmtBytes = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
function SettingsScreen({ onBack, state, onRestore }) {
  const app = usePwa();
  const fileRef = useRef(null);
  const [usage, setUsage] = useState(null);
  const [msg, setMsg] = useState(null);           // {kind, text}
  const [pending, setPending] = useState(null);   // validated backup waiting for confirm
  const [confirm, setConfirm] = useState(null);   // 'replace' | 'merge'
  const [busy, setBusy] = useState(false);
  useEffect(() => { try { navigator.storage && navigator.storage.estimate && navigator.storage.estimate().then(setUsage).catch(() => {}); } catch (e) {} }, []);
  const photoCount = state.topics.reduce((n, t) => n + t.items.filter((i) => i.photo || i.imageData).length, 0);

  const backupBlob = () => new Blob([JSON.stringify(makeBackup(state))], { type: 'application/json' });
  const exportBackup = async (viaShare) => {
    setMsg(null);
    try {
      await store.flush();
      const blob = backupBlob(); const name = 'draft-night-backup-' + todayStamp() + '.json';
      if (viaShare) { const r = await shareFile(blob, name, 'Draft Night backup'); if (r === 'shared') { setMsg({ kind: 'ok', text: 'Backup shared (' + fmtBytes(blob.size) + ').' }); return; } if (r === 'cancelled') return; }
      downloadBlob(blob, name);
      setMsg({ kind: 'ok', text: 'Backup saved as ' + name + ' (' + fmtBytes(blob.size) + ').' + (isIOS() ? ' Find it in the Files app → Downloads.' : '') });
    } catch (e) { setMsg({ kind: 'err', text: 'The backup could not be created. Try again.' }); }
  };
  const readFile = async (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = '';
    if (!file) return;
    setMsg(null); setPending(null);
    if (file.size > 200 * 1024 * 1024) { setMsg({ kind: 'err', text: 'That file is over 200 MB, which is too big to be a Draft Night backup.' }); return; }
    setBusy(true);
    try {
      const text = await file.text();
      let obj; try { obj = JSON.parse(text); } catch (er) { setMsg({ kind: 'err', text: "That file isn't a Draft Night backup (it isn't valid JSON)." }); setBusy(false); return; }
      const v = validateBackup(obj);
      if (!v.ok) setMsg({ kind: 'err', text: v.error }); else setPending(v);
    } catch (er) { setMsg({ kind: 'err', text: 'That file could not be read.' }); }
    setBusy(false);
  };
  const doRestore = (mode) => {
    onRestore(pending.data, mode);
    setMsg({ kind: 'ok', text: mode === 'replace' ? 'Backup restored. Everything on this device now matches the backup.' : 'Backup added. New topics and drafts were added to yours.' });
    setPending(null);
  };
  const ios = isIOS();
  return (
    <div className="app">
      <TopBar onBack={onBack} title="Backup & app" />

      <section className="card stack">
        <h3>📲 Install on your phone</h3>
        {app.standalone ? <p className="hint" style={{ color: 'var(--ok)' }}>Draft Night is installed and running as an app.</p> : (
          <>
            {app.canPrompt && <button className="btn btn-gold" onClick={() => app.prompt()}>Install Draft Night</button>}
            <div className="steps">
              <p><b>iPhone (Safari):</b> tap the Share button <span aria-hidden="true">⬆️</span>, scroll down, tap <b>Add to Home Screen</b>, then <b>Add</b>.</p>
              <p><b>Android (Chrome):</b> tap the ⋮ menu, then <b>Install app</b> or <b>Add to Home screen</b>.</p>
              {ios && <p className="hint">On iPhone this only works in Safari, not inside other apps' browsers.</p>}
            </div>
          </>
        )}
        <p className="hint">Updates arrive automatically. When a new version is ready you'll see a Reload button.</p>
      </section>

      <section className="card stack">
        <h3>💾 Backup &amp; restore</h3>
        <p className="hint">Everything is saved on this device only. A backup file copies your topics, uploaded photos ({photoCount}), drafts and win history so you can move them to another phone or browser. It does not sync automatically.</p>
        <div className="row">
          <button className="btn btn-gold grow" onClick={() => exportBackup(false)}>Export backup</button>
          {canShareFiles() && <button className="btn grow" onClick={() => exportBackup(true)}>Share backup</button>}
        </div>
        <button className="btn" disabled={busy} onClick={() => fileRef.current && fileRef.current.click()}>{busy ? 'Reading…' : 'Import backup'}</button>
        <input ref={fileRef} id="backup-file" type="file" accept="application/json,.json" hidden onChange={readFile} />
        {msg && <p className={msg.kind === 'err' ? 'warn' : 'hint'} style={msg.kind === 'ok' ? { color: 'var(--ok)' } : null}>{msg.text}</p>}
        {pending && (
          <div className="card stack" style={{ background: 'var(--stage)' }}>
            <b>Backup found{pending.summary.exportedAt ? ' from ' + new Date(pending.summary.exportedAt).toLocaleString() : ''}</b>
            <span className="small muted">{pending.summary.topics} topics · {pending.summary.items} items · {pending.summary.photos} photos · {pending.summary.past} past drafts{pending.summary.current ? ' · 1 draft in progress' : ''}</span>
            <button className="btn btn-danger solid" onClick={() => setConfirm('replace')}>Replace everything on this device</button>
            <button className="btn" onClick={() => setConfirm('merge')}>Add to what's here</button>
            <button className="btn btn-ghost" onClick={() => setPending(null)}>Cancel</button>
          </div>
        )}
      </section>

      <section className="card stack">
        <h3>🗄️ Storage</h3>
        <p className="hint">Saving to: {store.backend === 'indexeddb' ? 'this device (IndexedDB)' : store.backend === 'localStorage' ? 'this device (basic storage — photos may fill it quickly)' : 'nowhere — this browser blocks storage, so export a backup before closing'}{usage && usage.usage ? ' · using ' + fmtBytes(usage.usage) : ''}</p>
        <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { wiki.clear(); setMsg({ kind: 'ok', text: 'Photo lookups cleared. Wikipedia photos will be fetched again.' }); }}>Refresh Wikipedia photos</button>
      </section>

      <p className="hint" style={{ textAlign: 'center' }}>Real photos come from Wikipedia and Wikimedia Commons. Tap “Photo: Wikipedia” on a card to see who took it and its licence.</p>

      {confirm && <Confirm title={confirm === 'replace' ? 'Replace everything?' : 'Add the backup?'}
        body={confirm === 'replace' ? 'Your current topics, drafts and history on this device will be overwritten by the backup. Export a backup first if you might want them back.' : 'Topics and past drafts from the backup that you don’t already have will be added. Nothing of yours is deleted.'}
        yes={confirm === 'replace' ? 'Replace' : 'Add'} danger={confirm === 'replace'} onYes={() => doRestore(confirm)} onClose={() => setConfirm(null)} />}
    </div>
  );
}

function App() {
  const [topics, setTopics] = useState(() => migrateTopics(store.get(K.topics, null)));
  const [draft, setDraft] = useState(() => store.get(K.current, null));
  const [past, setPast] = useState(() => store.get(K.past, []));
  const [screen, setScreen] = useState({ name: 'home' });
  const [managers, setManagers] = useState(() => store.get(K.managers, null) || defaultManagers());
  const [topicId, setTopicId] = useState(null);
  const [rules, setRules] = useState({ ...DEFAULT_RULES, slots: [] });
  const [flash, setFlash] = useState(null);
  const [toast, setToast] = useState(null);
  const [folder, setFolder] = useState(null);
  const [settings, setSettings] = useState(() => store.get(K.settings, {}));
  const warned = useRef(false);
  const app = usePwa();
  useEffect(() => { store.onError = (msg) => { if (!warned.current) { warned.current = true; setToast(msg); } }; }, []);
  const persist = (k, v) => { if (v === null || v === undefined) store.del(k); else store.set(k, v); };
  useEffect(() => { persist(K.settings, settings); }, [settings]);
  // Start fetching photos for a draft's items so reveals are instant.
  useEffect(() => { if (draft && draft.topic && draft.topic.photos) wiki.prefetch([...draft.queue, ...draft.leftover].map((id) => wikiTitleFor(draft.items[id], draft.topic)).filter(Boolean)); }, [draft && draft.id]);
  useEffect(() => { persist(K.topics, topics); }, [topics]);
  useEffect(() => { persist(K.current, draft); }, [draft]);
  useEffect(() => { persist(K.past, past); }, [past]);
  useEffect(() => { persist(K.managers, managers); }, [managers]);
  // A finished draft is filed in Past Drafts (and kept in sync as votes come in).
  useEffect(() => {
    if (draft && draft.phase === 'done') setPast((p) => { const s = stripDraft(draft); const i = p.findIndex((x) => x.id === draft.id); if (i >= 0) { const a = [...p]; a[i] = s; return a; } return [s, ...p]; });
  }, [draft]);
  useEffect(() => { window.scrollTo(0, 0); }, [screen.name, screen.id]);

  const go = (name, extra) => setScreen({ name, ...(extra || {}) });
  const topic = topics.find((t) => t.id === (screen.id || topicId));
  const updTopic = (t) => setTopics((ts) => ts.map((x) => (x.id === t.id ? t : x)));
  const dupTopic = (id) => { const t = topics.find((x) => x.id === id); if (!t) return null; const copy = { ...t, id: uid(), name: t.name + ' (copy)', items: t.items.map((it) => ({ ...it, id: uid() })) }; setTopics((ts) => [...ts, copy]); return copy.id; };

  let view;
  switch (screen.name) {
    case 'topics':
      view = <TopicsList topics={topics} folder={folder} setFolder={setFolder} onBack={() => go(screen.from || 'home')} onOpen={(id) => go('topic', { id, from: screen.from })}
        onCreate={(f) => { const t = { id: uid(), name: 'New topic', emoji: '🎲', slots: ['Pick 1', 'Pick 2', 'Pick 3'], layout: 'list', art: 'emoji', folder: f || 'My Topics', items: [] }; setTopics((ts) => [...ts, t]); go('topic', { id: t.id, from: screen.from }); }}
        onDuplicate={dupTopic} onDelete={(id) => setTopics((ts) => ts.filter((x) => x.id !== id))} />;
      break;
    case 'topic':
      view = topic ? <TopicEditor topic={topic} folders={folderList(topics, true)} onChange={updTopic} onBack={() => go('topics', { from: screen.from })}
        onDuplicate={() => { const id = dupTopic(topic.id); if (id) go('topic', { id, from: screen.from }); }}
        onDelete={() => { setTopics((ts) => ts.filter((x) => x.id !== topic.id)); go('topics', { from: screen.from }); }} /> : null;
      if (!topic) setTimeout(() => go('topics'), 0);
      break;
    case 'setup-managers':
      view = <SetupManagers managers={managers} setManagers={setManagers} onBack={() => go('home')} onNext={() => go('setup-topic')} />;
      break;
    case 'setup-topic':
      view = <SetupTopic topics={topics} folder={folder} setFolder={setFolder} onBack={() => go('setup-managers')} onTopics={() => go('topics', { from: 'setup-topic' })}
        onPick={(id) => { const t = topics.find((x) => x.id === id); setTopicId(id); setRules((r) => ({ ...r, slots: [...t.slots] })); go('setup-rules'); }} />;
      break;
    case 'setup-rules': {
      const t = topics.find((x) => x.id === topicId);
      view = t ? <SetupRules topic={t} managers={managers} rules={rules} setRules={setRules} onBack={() => go('setup-topic')}
        onStart={(r) => { setDraft(createDraft(t, managers, r)); go('draft'); }} /> : null;
      break;
    }
    case 'draft':
      if (!draft) { view = null; setTimeout(() => go('home'), 0); break; }
      if (draft.phase === 'auction') view = <Auction d={draft} setDraft={setDraft} goHome={() => go('home')} flashing={!!flash} onFlash={setFlash} />;
      else if (draft.phase === 'freepick') view = <FreePick d={draft} setDraft={setDraft} goHome={() => go('home')} flashing={!!flash} onFlash={setFlash} />;
      else view = <Results d={draft} past={past} live onChange={setDraft} onBack={() => go('home')} onUndo={() => setDraft((p) => undo(p))} onFinish={() => { setDraft(null); go('home'); }} />;
      break;
    case 'past':
      view = <PastList past={past} onBack={() => go('home')} onOpen={(id) => go('past-view', { id })} onDelete={(id) => setPast((p) => p.filter((x) => x.id !== id))} />;
      break;
    case 'past-view': {
      const p = past.find((x) => x.id === screen.id);
      view = p ? <Results d={p} past={past} onChange={(nd) => { setPast((ps) => ps.map((x) => (x.id === nd.id ? nd : x))); if (draft && draft.id === nd.id) setDraft({ ...draft, votes: nd.votes, votesRevealed: nd.votesRevealed }); }} onBack={() => go('past')} /> : null;
      break;
    }
    case 'settings':
      view = <SettingsScreen onBack={() => go('home')} state={{ topics, past, draft, managers, settings }}
        onRestore={(data, mode) => {
          if (mode === 'replace') {
            setTopics(migrateTopics(data.topics)); setPast(data.past); setDraft(data.current || null);
            if (Array.isArray(data.managers) && data.managers.length) setManagers(data.managers);
            if (data.settings) setSettings(data.settings);
          } else {
            setTopics((ts) => [...ts, ...data.topics.filter((t) => !ts.some((x) => x.id === t.id))]);
            setPast((ps) => [...ps, ...data.past.filter((d) => !ps.some((x) => x.id === d.id))].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
            if (data.current) setDraft((cur) => cur || data.current);
          }
        }} />;
      break;
    default:
      view = <Home draft={draft} past={past} onSettings={() => go('settings')}
        showInstall={!app.standalone && !settings.installDismissed && (app.canPrompt || isIOS())} onDismissInstall={() => setSettings((x) => ({ ...x, installDismissed: true }))}
        onNew={() => { setDraft(null); setRules({ ...DEFAULT_RULES, slots: [] }); go('setup-managers'); }}
        onResume={() => go('draft')} onTopics={() => go('topics')} onPast={() => go('past')} onAbandon={() => setDraft(null)} />;
  }

  return (
    <>
      {view}
      {flash && <Flash f={flash} onDone={() => setFlash(null)} />}
      {app.updateReady && !toast && <div className="toast ok" role="status"><span className="grow">A new version of Draft Night is ready.</span><button onClick={() => app.applyUpdate()}>Reload</button></div>}
      {toast && <div className="toast" role="status"><span className="grow">{toast}</span><button onClick={() => setToast(null)}>OK</button></div>}
    </>
  );
}

class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) return (
      <div className="app"><div className="card stack">
        <h2 className="display">Something broke</h2>
        <p className="muted" style={{ margin: 0 }}>Your topics are safe. If a saved draft caused this, clear it and carry on.</p>
        <button className="btn btn-gold" onClick={() => { store.del(K.current); store.flush().finally(() => location.reload()); }}>Clear the current draft and reload</button>
        <pre className="small muted" style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.err && this.state.err.message)}</pre>
      </div></div>
    );
    return this.props.children;
  }
}

if (window.__DN_TEST__) window.__DN = { createDraft, placeBid, sell, skipItem, undo, freePick, currentPicker, canTake, nextAmount, isDraftOver, draftStats, winsBoard, tally, starterTopics, migrateTopics, validateBackup, makeBackup, wikiTitleFor, PHOTO_TOPICS, store, wiki, DEFAULT_RULES, COLORS, emptyCount, assignSlot, maxBid };
store.init().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(<Boundary><App /></Boundary>);
});

