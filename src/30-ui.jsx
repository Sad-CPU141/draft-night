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
  // Mystery items fit any open slot (best fit first), so being able to bid gives nothing away.
  if (item.mystery) {
    const p = norm(item.pos);
    const exact = p ? slots.findIndex((s, k) => norm(s) === p && !m.team[k]) : -1;
    if (exact >= 0) return exact;
    const flex = slots.findIndex((s, k) => isFlex(s) && !m.team[k]);
    return flex >= 0 ? flex : m.team.findIndex((x) => !x);
  }
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

/* ---------- dropping out of an item ("I'm out") ----------
   Withdrawals are part of the game state, keyed to the item on the block (d.reveal),
   so they reset by themselves when the next item comes up. A withdrawn team can't bid
   on this item again by any route; a bid it already made still stands.
   ENDING RULE: an item ends early when nobody except the current leader can still bid
   (it sells to the leader at their bid), or when nobody at all can bid and there's no
   bid (it goes unsold). Otherwise the clock / auctioneer decides as before. */
const outIds = (d) => (d.out && d.out.reveal === d.reveal ? d.out.ids : []);
const isOut = (d, id) => outIds(d).includes(id);
const hasBidOnItem = (d, id) => !!((d.bid && d.bid.leaderId === id) || (d.bids || []).some((b) => b && b.leaderId === id));
const mustBidOn = (d) => !!(d.rules && d.rules.mustBid);
// "Require every manager to bid": a team that can still afford a bid and hasn't bid on this item owes one.
function owesBid(d, m) { return mustBidOn(d) && !hasBidOnItem(d, m.id) && canBid(d, m, nextAmount(d)); }
const owing = (d) => (d.phase === 'auction' && !d.pending ? d.managers.filter((m) => owesBid(d, m)) : []);
function withdrawProblem(d, id) {
  const m = d.managers.find((x) => x.id === id);
  if (!m || d.phase !== 'auction' || !currentItem(d)) return 'There’s no item up right now.';
  if (isOut(d, id)) return 'Already out on this item.';
  if (owesBid(d, m)) return 'Require every manager to bid is on: bid at least once on this item before dropping out.';
  return null;
}
function withdraw(d, id) { return withdrawProblem(d, id) ? d : { ...d, out: { reveal: d.reveal, ids: [...outIds(d), id] } }; }
// 'sell' | 'skip' | null — whether the item should end right now.
function auctionEnd(d) {
  if (d.phase !== 'auction' || d.pending || !currentItem(d)) return null;
  if (d.bid) return d.managers.some((m) => m.id !== d.bid.leaderId && canBid(d, m, nextAmount(d))) ? null : 'sell';
  return d.managers.some((m) => canBid(d, m, d.rules.minBid)) ? null : 'skip';
}

// Can this manager bid `amount` on the current item?
function canBid(d, m, amount) {
  const item = currentItem(d);
  if (!item || isFull(m) || d.pending || d.phase !== 'auction' || frozenNow(d, m.id) || isOut(d, m.id)) return false;
  if (assignSlot(m, item, d.rules.slots) < 0) return false;
  return amount >= d.rules.minBid && amount <= maxBid(m, d.rules);
}
// Why a manager can't bid (for the button label).
function bidBlocker(d, m) {
  const item = currentItem(d);
  if (isOut(d, m.id)) return 'Out ✋';
  if (isFull(m)) return 'Team full';
  if (frozenNow(d, m.id)) return 'Frozen 🧊';
  if (item && assignSlot(m, item, d.rules.slots) < 0) return 'No ' + (item.pos || 'open') + ' slot';
  if (maxBid(m, d.rules) < d.rules.minBid) return 'Out of money';
  if (maxBid(m, d.rules) < nextAmount(d)) return 'Max ' + money(maxBid(m, d.rules));
  return null;
}
const canTake = (d, m, id) => !isFull(m) && assignSlot(m, d.items[id], d.rules.slots) >= 0;

// Everything an undo has to put back.
const SNAP_KEYS = ['managers', 'queue', 'leftover', 'passed', 'processed', 'fp', 'phase', 'autoSkipped', 'cards', 'frozen', 'revealed', 'cardLog', 'nom', 'nominated', 'pending', 'trade'];
function snap(d) { const o = {}; SNAP_KEYS.forEach((k) => { if (d[k] !== undefined) o[k] = d[k]; }); return JSON.stringify(o); }
function withHistory(d, label) {
  return { ...d, ...JSON.parse(snap(d)), history: [...d.history, { s: snap(d), label }].slice(-80) };
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
  if (n.queue.length) {
    // Nomination: wait for the next team to choose, unless the front item was just nominated.
    if (n.rules.order === 'nominate' && n.nominated !== n.queue[0]) { n.phase = 'nominate'; n.nominated = null; }
    else n.phase = 'auction';
  }
  else if (isDraftOver(n)) finishDraft(n);
  else { if (n.phase !== 'freepick') n.fp = { round: 0, pos: 0 }; n.phase = 'freepick'; }
  n.reveal = (n.reveal || 0) + 1;
  return n;
}

// The draft is over: open the trade window if it's on, otherwise go to voting.
function finishDraft(n) {
  if (ruleOn(n, 'trades') && !(n.trade && n.trade.done)) openTrades(n);
  else n.phase = 'done';
  return n;
}

// extra: { mode: 'solo', solo: { level, talk, clock } } for solo games; local games omit it.
// Managers with `members` make a team game: each team bids as one, with one budget.
function createDraft(topic, managers, rules, extra) {
  const seed = (extra && extra.seed) || uid();
  const ids = topic.items.map((it) => it.id);
  const mystery = new Set(pickMystery(ids, rules, seed));
  const items = {}; topic.items.forEach((it) => { items[it.id] = mystery.has(it.id) ? { ...it, mystery: true } : { ...it }; });
  const d = {
    id: uid(), createdAt: Date.now(),
    topic: { id: topic.id, name: topic.name, emoji: topic.emoji, layout: topic.layout, art: artOf(topic), kitShape: topic.kitShape || '', kitLabel: topic.kitLabel || '', photos: !!topic.photos },
    rules: { ...rules },
    managers: managers.map((m) => ({ id: m.id, name: m.name.trim(), color: m.color, emoji: m.emoji, budget: rules.budget, team: rules.slots.map(() => null), ...(m.bot ? { bot: { ...m.bot } } : {}), ...(m.human ? { human: true } : {}), ...(m.uid ? { uid: m.uid } : {}), ...(m.members ? { members: m.members.map((p) => ({ ...p })) } : {}) })),
    teamMode: managers.some((m) => m.members),
    items, queue: rules.order === 'random' ? shuffle(ids) : ids, leftover: [], passed: [], processed: 0,
    cards: dealCards(managers.map((m) => m.id), rules, seed), frozen: {}, revealed: [], cardLog: [], pending: null,
    rarity: assignRarity(ids, rules, seed), nom: { idx: 0 }, nominated: null, trade: null,
    bid: null, bids: [], history: [], phase: 'auction', fp: { round: 0, pos: 0 }, reveal: 0,
    votes: {}, votesRevealed: false,
    mode: 'local',
    ...(extra || {}), seed,
  };
  return advance(d);
}

// Tapping the current leader again raises their own bid (+increment).
// opts.double: play a Double Bid card — `amount` is what you pay, it counts as twice that.
function placeBid(d, managerId, amount, opts) {
  const m = d.managers.find((x) => x.id === managerId);
  if (isOut(d, managerId)) return d; // dropped out of this item: no more bids, by any route
  if (opts && opts.double) {
    if (doubleProblem(d, managerId, amount)) return d;
    return { ...d, cards: removeCard(d.cards, managerId, 'double'), bids: [...d.bids, d.bid], bid: { amount: amount * 2, pay: amount, leaderId: managerId, double: true } };
  }
  if (!m || !canBid(d, m, amount)) return d;
  if (d.bid && amount <= d.bid.amount) return d;
  return { ...d, bids: [...d.bids, d.bid], bid: { amount, pay: amount, leaderId: managerId } };
}
function undoBid(d) {
  if (!d.bid) return d;
  const bids = [...d.bids]; const prev = bids.pop();
  const cards = d.bid.double ? { ...d.cards, [d.bid.leaderId]: [...(d.cards[d.bid.leaderId] || []), 'double'] } : d.cards;
  return { ...d, bids, bid: prev || null, cards };
}
function sell(d) {
  const id = d.queue[0]; const b = d.bid;
  if (!id || !b) return d;
  const n = withHistory(d, 'Undo sale');
  const m = n.managers.find((x) => x.id === b.leaderId);
  const slot = assignSlot(m, n.items[id], n.rules.slots);
  const price = b.pay != null ? b.pay : b.amount;
  if (slot < 0 || price > m.budget) return d;
  m.team[slot] = { itemId: id, price, ...(b.double ? { doubled: true } : {}) };
  m.budget -= price;
  if (n.items[id].mystery) n.revealed = [...(n.revealed || []), id];
  n.queue = n.queue.slice(1); n.processed++; n.nominated = null;
  return advance(n);
}
function skipItem(d) {
  const id = d.queue[0]; if (!id) return d;
  const n = withHistory(d, 'Undo skip');
  n.queue = n.queue.slice(1); n.nominated = null;
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
  if (n.items[itemId].mystery) n.revealed = [...(n.revealed || []), itemId];
  n.leftover = n.leftover.filter((x) => x !== itemId);
  n.fp = { round: cp.round, pos: cp.pos + 1 };
  if (isDraftOver(n)) finishDraft(n);
  n.reveal++;
  return n;
}
// Full undo of the last sale / skip / free pick: refunds money and returns the item.
function undo(d) {
  if (d.bid) return undoBid(d);
  if (!d.history.length) return d;
  const h = d.history[d.history.length - 1];
  const s = JSON.parse(h.s);
  return { ...d, ...s, history: d.history.slice(0, -1), bid: null, bids: [], reveal: (d.reveal || 0) + 1, votes: {}, votesRevealed: false, finale: null };
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
  if (d.finale && d.finale.champion) {
    const counts = {}; d.managers.forEach((m) => { counts[m.id] = 0; });
    Object.values(d.votes || {}).forEach((t) => { if (counts[t] !== undefined) counts[t]++; });
    return { counts, winners: d.managers.filter((m) => m.id === d.finale.champion) };
  }
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
// Master mute, shown on every game screen. Uses the shared audio settings.
const AudioCtx = React.createContext({ cfg: AUDIO_DEFAULTS, set: () => {} });
function MuteButton() {
  const { cfg, set } = React.useContext(AudioCtx);
  return <button className={'iconbtn mute' + (cfg.muted ? ' on' : '')} onClick={() => set({ ...cfg, muted: !cfg.muted })} aria-pressed={cfg.muted} aria-label={cfg.muted ? 'Unmute sound' : 'Mute all sound'}>{cfg.muted ? '🔇' : '🔊'}</button>;
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
            {it ? <span className="n">{it.name}{(() => { const r = rarityOf(d, t.itemId); return r && r !== 'common' ? <span className={'rmark ' + r}>{r === 'legendary' ? '★' : '◆'}</span> : null; })()}{t.free && <span className="muted small"> · free</span>}{t.stolen && <span className="muted small"> · stolen</span>}{t.traded && <span className="muted small"> · traded</span>}</span> : <span className="n empty">Empty</span>}
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
        <details className="card"><summary className="label">📜 Rules in play</summary><RulesSummary rules={d.rules} opts={{ teams: !!d.teamMode, clock: d.mode === 'online' ? (d.online || {}).clock : d.mode === 'solo' ? (d.solo || {}).clock : 0 }} /><p className="hint" style={{ margin: 0 }}>Rules are locked once a draft starts.</p></details>
        {d.managers.map((m) => (
          <div className="tteam" key={m.id} style={mStyle(m)}>
            <div className="row" style={{ marginBottom: 4 }}>
              <h3 className="grow">{m.emoji} {m.name}{m.members ? <span className="small muted" style={{ display: 'block', fontFamily: 'var(--body)', fontWeight: 600 }}>{m.members.map((p) => p.name).join(' · ')}</span> : null}{d.cards && (d.cards[m.id] || []).length ? <span className="small muted" style={{ display: 'block', fontFamily: 'var(--body)', fontWeight: 600 }}>🃏 {d.cards[m.id].map((c) => CARD_INFO[c].name).join(', ')}</span> : null}</h3>
              <span className="num" style={{ fontFamily: 'var(--display)', fontSize: 22, color: 'var(--gold)' }}>{money(m.budget)} left</span>
            </div>
            <TeamList d={d} m={m} />
            <TeamRatingPanel d={d} m={m} />
          </div>
        ))}
      </div>
    </Sheet>
  );
}

/* ============================================================
   HOME
   ============================================================ */
function Home({ draft, past, onNew, onSolo, onOnline, onResume, onTopics, onPast, onAbandon, onSettings, onPlayers, showInstall, onDismissInstall }) {
  const [ask, setAsk] = useState(null);
  const status = draft && (draft.phase === 'auction' ? 'Item ' + (draft.processed + 1) + ' of ' + (draft.processed + draft.queue.length) : draft.phase === 'nominate' ? 'Nominating' : draft.phase === 'trade' ? 'Trade window' : draft.phase === 'freepick' ? 'Free picks' : 'Results & voting');
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
          <div className="row"><span style={{ fontSize: 30 }}>{draft.topic.emoji}</span><div className="grow"><h3>{draft.topic.name}</h3><span className="small muted">{draft.mode === 'solo' ? 'Solo · ' + (BOT_LEVELS[(draft.solo || {}).level] || BOT_LEVELS.medium).label + ' · ' : ''}{status}</span></div></div>
          <div className="chips">{draft.managers.map((m) => <MChip key={m.id} m={m} />)}</div>
          <button className="btn btn-gold" onClick={onResume}>Resume draft</button>
          <button className="btn btn-sm btn-ghost" style={{ alignSelf: 'center', border: 0, color: 'var(--muted)' }} onClick={() => setAsk('abandon')}>Abandon this draft</button>
        </div>
      )}
      <div className="modes" role="group" aria-label="Game mode">
        <button className="mode solo" onClick={() => (draft ? setAsk('solo') : onSolo())}>
          <span className="mi">🤖</span><span className="mt">Solo</span><span className="ms">You vs bots</span>
        </button>
        <button className="mode local" onClick={() => (draft ? setAsk('new') : onNew())}>
          <span className="mi">📱</span><span className="mt">Local</span><span className="ms">Pass the phone</span>
        </button>
        <button className="mode online" onClick={onOnline}>
          <span className="mi">🌐</span><span className="mt">Online</span><span className="ms">Own phones · TV</span>
        </button>
      </div>
      <div className="menu">
        <button className="btn" onClick={onTopics}>Topics</button>
        <button className="btn" onClick={onPast}>Past drafts{past.length ? ' (' + past.length + ')' : ''}</button>
        <button className="btn" onClick={onPlayers}>Players &amp; stats</button>
        <button className="btn btn-ghost" onClick={onSettings}>Rules &amp; settings</button>
      </div>
      {showInstall && (
        <div className="card row installcard">
          <span style={{ fontSize: 28 }}>📲</span>
          <div className="grow"><b>Put Draft Night on your home screen</b><span className="small muted" style={{ display: 'block' }}>Opens full screen, like an app.</span></div>
          <button className="btn btn-sm" onClick={onSettings}>How</button>
          <button className="mini" aria-label="Hide" onClick={onDismissInstall}>✕</button>
        </div>
      )}
      {(ask === 'new' || ask === 'solo') && <Confirm title="Start over?" body="A new draft replaces the one in progress. Finished drafts stay in Past Drafts." yes="New draft" danger onYes={ask === 'solo' ? onSolo : onNew} onClose={() => setAsk(null)} />}
      {ask === 'abandon' && <Confirm title="Abandon draft?" body="The draft in progress will be deleted." yes="Abandon" danger onYes={onAbandon} onClose={() => setAsk(null)} />}
    </div>
  );
}

/* ============================================================
   TOPICS
   ============================================================ */
function TopicsList({ topics, onBack, onOpen, onCreate, onDuplicate, onDelete, folder, setFolder, onImport, prefs, setPrefs }) {
  const [del, setDel] = useState(null);
  const [q, setQ] = useState('');
  return (
    <div className="app">
      <TopBar onBack={folder && !q ? () => setFolder(null) : onBack} title={'Topics (' + topics.length + ')'} />
      <div className="row">
        <button className="btn btn-gold grow" onClick={() => onCreate(folder)}>+ New topic{folder ? ' in ' + folder : ''}</button>
        <button className="btn grow" style={{ width: 'auto' }} onClick={onImport}>Import</button>
      </div>
      <TopicSearch q={q} setQ={setQ} />
      <FolderBrowser topics={topics} q={q} folder={folder} setFolder={setFolder} prefs={prefs} setPrefs={setPrefs} renderTopic={(t) => (
        <div key={t.id} className="card stack-sm" style={{ padding: 12 }}>
          <button className="tcard" style={{ border: 0, padding: 0, background: 'none' }} onClick={() => onOpen(t.id)}>
            <span className="em">{t.emoji || '🎲'}</span>
            <span className="meta"><span className="name">{t.name}{!isBuiltIn(t) && <span className="yours">Yours</span>}</span><span className="sub">{t.items.length} items · {t.slots.join(', ')}</span></span>
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
      {isFootball(topic) && (
        <div className="field">
          <label htmlFor="it-rating">Rating override (1–99)</label>
          <input id="it-rating" className="input" type="number" inputMode="numeric" min={1} max={99} value={f.rating == null ? '' : f.rating} placeholder={'Estimated: ' + playerRating({ ...f, rating: null }).ovr} onChange={(e) => { const v = e.target.value; setF((x) => { const n = { ...x }; if (v === '') delete n.rating; else n.rating = clamp(Math.round(+v) || 1, 1, 99); return n; }); }} />
          <p className="hint">Leave empty to use Draft Night’s estimated game rating. This isn’t an official EA Sports FC rating either way.</p>
        </div>
      )}
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
  const [sharing, setSharing] = useState(false);
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
      <TopBar onBack={onBack} title="Edit topic" right={<button className="pillbtn" onClick={() => setSharing(true)}>Share</button>} />
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
      <div className="row"><button className="btn grow" onClick={onDuplicate}>Duplicate topic</button><button className="btn btn-danger grow" onClick={() => setDel(true)}>Delete topic</button></div>
      {sharing && <ShareTopicSheet topic={topic} onClose={() => setSharing(false)} />}
      {editing && <ItemEditor item={editing} slots={topic.slots} topic={topic}onSave={(it) => { const { isNew, ...rest } = it; saveItem(rest); }} onDelete={editing.isNew ? null : () => set({ items: topic.items.filter((x) => x.id !== editing.id) })} onClose={() => setEditing(null)} />}
      {del && <Confirm title="Delete topic?" body="This can't be undone." yes="Delete" danger onYes={onDelete} onClose={() => setDel(false)} />}
    </div>
  );
}

/* ============================================================
   SETUP: managers → topic → rules
   ============================================================ */
/* ============================================================
   SOLO SETUP
   ============================================================ */
const DEFAULT_SOLO = { name: 'You', bots: 3, level: 'medium', talk: true, clock: 8, topicId: 't-pl', seed: 'start', teams: { on: false, count: 2, size: 2, name: 'Team You' } };
const DEFAULT_TEAMS = { on: false, count: 2, size: 2, teams: [] };
// Solo team game: your team = you + bot advisers; every other team is all bots.
function soloTeams(cfg) {
  const T = { ...DEFAULT_SOLO.teams, ...(cfg.teams || {}) };
  const total = T.count * T.size - 1;
  const bots = makeBots(total, cfg.level, cfg.seed, [COLORS[1]]);
  const rng = seeded('teamnames', cfg.seed);
  const names = shuffle(TEAM_NAMES.map((n) => [n, rng()]).sort((a, b) => a[1] - b[1]).map((x) => x[0]));
  const teams = [];
  const toMember = (b) => ({ id: b.id, name: b.name, emoji: b.emoji, bot: b.bot });
  teams.push({ id: 'team-you', name: (T.name || 'Team You').trim() || 'Team You', color: COLORS[1], emoji: '😎', human: true, members: [{ id: 'you', name: cfg.name.trim() || 'You', emoji: '😎', human: true }, ...bots.slice(0, T.size - 1).map(toMember)] });
  for (let i = 1; i < T.count; i++) {
    const ms = bots.slice(T.size - 1 + (i - 1) * T.size, T.size - 1 + i * T.size);
    teams.push({ id: 'team-' + i + '-' + ms[0].id, name: names[i % names.length], color: ms[0].color, emoji: ms[0].emoji, members: ms.map(toMember) });
  }
  return teams;
}
function SoloSetup({ cfg, setCfg, topic, rules, onBack, onPickTopic, onRules, onStart }) {
  const T = { ...DEFAULT_SOLO.teams, ...(cfg.teams || {}) };
  const setT = (p) => setCfg({ ...cfg, teams: { ...T, ...p } });
  const bots = makeBots(cfg.bots, cfg.level, cfg.seed, [COLORS[1]]);
  const teams = T.on ? soloTeams(cfg) : null;
  const valid = topic && topic.items.length && topic.slots.length && cfg.name.trim();
  const level = BOT_LEVELS[cfg.level];
  return (
    <div className="app">
      <TopBar onBack={onBack} title="Solo · vs bots" />
      <div><h2 className="display">You vs the bots</h2><p className="hint">Bots bid on their own. Each item sells when its clock runs out.</p></div>
      <div className="card stack">
        <div className="field"><label htmlFor="solo-name">Your name</label><input id="solo-name" className="input" maxLength={16} value={cfg.name} onChange={(e) => setCfg({ ...cfg, name: e.target.value })} placeholder="You" /></div>
        <div className="field"><span className="label">Play style</span><Seg label="Play style" value={T.on ? 'teams' : 'solo'} options={[['solo', 'Every bot for itself'], ['teams', 'Teams']]} onChange={(v) => setT({ on: v === 'teams' })} /></div>
        {T.on ? (
          <>
            <div className="row">
              <div className="field grow"><label htmlFor="solo-tcount">Teams</label><Stepper id="solo-tcount" value={T.count} min={2} max={4} onChange={(v) => setT({ count: v })} /></div>
              <div className="field grow"><label htmlFor="solo-tsize">Players each</label><Stepper id="solo-tsize" value={T.size} min={1} max={4} onChange={(v) => setT({ size: v })} /></div>
            </div>
            <div className="field"><label htmlFor="solo-tname">Your team name</label><input id="solo-tname" className="input" maxLength={20} value={T.name} onChange={(e) => setT({ name: e.target.value })} /></div>
            <p className="hint">{T.count === 2 ? T.size + 'v' + T.size : T.count + ' teams of ' + T.size}. Bots on your team advise you; you make the bids. Other teams are all bots and bid together.</p>
          </>
        ) : <div className="field"><label htmlFor="solo-bots">Bots</label><Stepper id="solo-bots" value={cfg.bots} min={1} max={7} onChange={(v) => setCfg({ ...cfg, bots: v })} /></div>}
        <div className="field"><span className="label">Difficulty</span><Seg label="Difficulty" value={cfg.level} options={[['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']]} onChange={(v) => setCfg({ ...cfg, level: v })} />
          <p className="hint">{cfg.level === 'easy' ? 'Bots make mistakes, waste money and miss bargains.' : cfg.level === 'medium' ? 'Bots play sensibly and avoid most silly bidding wars.' : 'Bots budget carefully, read the table and plan for the endgame. No cheating.'}</p></div>
        <div className="field"><span className="label">Bid clock</span><Seg label="Bid clock" value={cfg.clock} options={[[6, '6s'], [8, '8s'], [12, '12s']]} onChange={(v) => setCfg({ ...cfg, clock: v })} /></div>
        <Toggle on={cfg.talk} onChange={(v) => setCfg({ ...cfg, talk: v })} title="Trash talk" sub="Bots react to bids, wins and losses with short speech bubbles." />
      </div>
      <div className="card stack">
        <div className="row"><h3 className="grow">The table</h3><button className="btn btn-sm" onClick={() => setCfg({ ...cfg, seed: uid() })}>Shuffle bots</button></div>
        {teams ? (
          <div className="stack-sm">
            {teams.map((t) => (
              <div key={t.id} className="teamprev" style={mStyle(t)}>
                <b>{t.emoji} {t.name}</b>
                <span className="small">{t.members.map((p) => p.name + (p.bot ? ' (' + BOT_TYPES[p.bot.type].short + ')' : '')).join(' · ')}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="stack-sm">
            {bots.map((b) => (
              <div key={b.id} className="botrow" style={mStyle(b)}>
                <span className="be">{b.emoji}</span>
                <span className="grow" style={{ minWidth: 0 }}><b>{b.name}</b><span className="small muted" style={{ display: 'block' }}>{BOT_TYPES[b.bot.type].label}</span></span>
                <span className="lvl">{level.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card stack">
        <button className="tcard" style={{ border: 0, padding: 0, background: 'none' }} onClick={onPickTopic}>
          <span className="em">{topic ? topic.emoji : '🎲'}</span>
          <span className="meta"><span className="name">{topic ? topic.name : 'Pick a topic'}</span><span className="sub">{topic ? topic.items.length + ' items · ' + rules.slots.join(', ') : 'Tap to choose'}</span></span>
          <span className="muted" style={{ fontSize: 15, fontWeight: 700 }}>Change</span>
        </button>
        <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onRules} disabled={!topic}>House rules: {money(rules.budget)} budget · min {money(rules.minBid)}</button>
      </div>
      <p className="hint" style={{ textAlign: 'center' }}>{T.on ? (T.count === 2 ? T.size + 'v' + T.size : T.count + ' teams of ' + T.size) : cfg.bots + ' ' + (cfg.bots === 1 ? 'bot' : 'bots')} · {level.label} · {cfg.clock}s clock · trash talk {cfg.talk ? 'on' : 'off'}</p>
      <button className="btn btn-gold" disabled={!valid} onClick={() => onStart(teams || bots)}>Start solo draft</button>
    </div>
  );
}

const TEAM_NAMES = ['The Overpayers', 'Budget Bandits', 'Chaos FC', 'Spreadsheet United', 'Bargain Bin Rovers', 'Team Mayhem', 'Deadline Dealers', 'The Free Agents'];
// Build/resize local teams: `count` teams of `size` players, keeping names already typed.
function shapeTeams(teams, count, size) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = teams[i] || { id: uid(), name: 'Team ' + (i + 1), color: COLORS[i % COLORS.length], emoji: EMOJIS[i % EMOJIS.length], members: [] };
    const members = [];
    for (let j = 0; j < size; j++) members.push((t.members || [])[j] || { id: uid(), name: '' });
    out.push({ ...t, members });
  }
  return out;
}
function TeamsEditor({ cfg, setCfg }) {
  const teams = shapeTeams(cfg.teams || [], cfg.count, cfg.size);
  const setTeams = (ts) => setCfg({ ...cfg, teams: ts });
  const upd = (i, patch) => setTeams(teams.map((t, k) => (k === i ? { ...t, ...patch } : t)));
  const updMember = (i, j, name) => upd(i, { members: teams[i].members.map((p, k) => (k === j ? { ...p, name } : p)) });
  const autoAssign = () => {
    const names = shuffle(teams.flatMap((t) => t.members.map((p) => p.name.trim())).filter(Boolean));
    let k = 0;
    setTeams(teams.map((t) => ({ ...t, members: t.members.map((p) => ({ ...p, name: names[k++] || '' })) })));
  };
  return (
    <div className="stack">
      <div className="card stack">
        <div className="row">
          <div className="field grow"><label htmlFor="tm-count">Teams</label><Stepper id="tm-count" value={cfg.count} min={2} max={4} onChange={(v) => setCfg({ ...cfg, count: v, teams: shapeTeams(teams, v, cfg.size) })} /></div>
          <div className="field grow"><label htmlFor="tm-size">Players each</label><Stepper id="tm-size" value={cfg.size} min={1} max={4} onChange={(v) => setCfg({ ...cfg, size: v, teams: shapeTeams(teams, cfg.count, v) })} /></div>
        </div>
        <p className="hint">{cfg.count === 2 ? cfg.size + 'v' + cfg.size : cfg.count + ' teams of ' + cfg.size} · each team shares one budget, one roster and its Chaos Cards. Everyone votes, but never for their own team.</p>
        <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={autoAssign}>Shuffle players into teams</button>
      </div>
      {teams.map((t, i) => (
        <div key={t.id} className="teamedit" style={mStyle(t)}>
          <div className="row">
            <button className="emo" onClick={() => upd(i, { emoji: EMOJIS[(EMOJIS.indexOf(t.emoji) + 1) % EMOJIS.length] })} aria-label="Change team emoji">{t.emoji}</button>
            <button className="swatch" onClick={() => upd(i, { color: COLORS[(COLORS.indexOf(t.color) + 1) % COLORS.length] })} aria-label="Change team colour" />
            <input id={'tm-name-' + t.id} className="input grow" value={t.name} maxLength={20} placeholder={'Team ' + (i + 1)} onChange={(e) => upd(i, { name: e.target.value })} />
          </div>
          <div className="stack-sm" style={{ marginTop: 8 }}>
            {t.members.map((p, j) => <input key={p.id} id={'tm-p-' + p.id} className="input" value={p.name} maxLength={16} placeholder={'Player ' + (j + 1)} onChange={(e) => updMember(i, j, e.target.value)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
// Local team config → draft managers (one per team, players inside).
const localTeamsToManagers = (cfg) => shapeTeams(cfg.teams || [], cfg.count, cfg.size).map((t) => ({ id: t.id, name: t.name.trim(), color: t.color, emoji: t.emoji, members: t.members.map((p) => ({ id: p.id, name: p.name.trim(), emoji: '🙂' })) }));
const teamsValid = (cfg) => { const ts = shapeTeams(cfg.teams || [], cfg.count, cfg.size); return ts.every((t) => t.name.trim() && t.members.every((p) => p.name.trim())); };

function SetupManagers({ managers, setManagers, onBack, onNext, teamCfg, setTeamCfg }) {
  if (teamCfg && teamCfg.on) return (
    <div className="app">
      <TopBar onBack={onBack} title="1 · Teams" />
      <div><h2 className="display">Who's bidding?</h2></div>
      <Seg label="Play style" value="teams" options={[['solo', 'Individual'], ['teams', 'Teams']]} onChange={(v) => setTeamCfg({ ...teamCfg, on: v === 'teams' })} />
      <TeamsEditor cfg={teamCfg} setCfg={setTeamCfg} />
      {!teamsValid(teamCfg) && <p className="hint">Every team and player needs a name.</p>}
      <button className="btn btn-gold" disabled={!teamsValid(teamCfg)} onClick={onNext}>Next: pick a topic</button>
    </div>
  );
  return <SetupManagersSolo managers={managers} setManagers={setManagers} onBack={onBack} onNext={onNext} teamCfg={teamCfg} setTeamCfg={setTeamCfg} />;
}
function SetupManagersSolo({ managers, setManagers, onBack, onNext, teamCfg, setTeamCfg }) {
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
      {setTeamCfg && <Seg label="Play style" value="solo" options={[['solo', 'Individual'], ['teams', 'Teams']]} onChange={(v) => setTeamCfg({ ...(teamCfg || DEFAULT_TEAMS), on: v === 'teams' })} />}
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

// Star (favourite) and pin, personal to this device. Pinning lifts a topic to the top of its own folder.
function TopicMarks({ t, prefs, setPrefs }) {
  if (!setPrefs) return null;
  const fav = (prefs.fav || []).includes(t.id), pin = (prefs.pin || []).includes(t.id);
  return (
    <div className="tmarks">
      <button type="button" className={'tmark' + (fav ? ' on' : '')} aria-pressed={fav} aria-label={(fav ? 'Remove ' : 'Add ') + t.name + (fav ? ' from' : ' to') + ' favourites'} title={fav ? 'Favourite (tap to remove)' : 'Favourite: keep it in your Favourites tab'} onClick={() => setPrefs({ ...prefs, fav: toggleIn(prefs.fav, t.id) })}>{fav ? '★' : '☆'}</button>
      <button type="button" className={'tmark' + (pin ? ' on' : '')} aria-pressed={pin} aria-label={(pin ? 'Unpin ' : 'Pin ') + t.name + (pin ? '' : ' to the top of ' + folderOf(t))} title={pin ? 'Pinned to the top of ' + folderOf(t) + ' (tap to unpin)' : 'Pin to the top of ' + folderOf(t)} onClick={() => setPrefs({ ...prefs, pin: toggleIn(prefs.pin, t.id) })}>📌</button>
    </div>
  );
}
const TOPIC_VIEWS = [['folders', 'Folders'], ['popular', 'Popular'], ['favs', 'Favourites']];
// Folders · Popular · Favourites, plus search. Pins and stars come from this device's settings.
function FolderBrowser({ topics, q, folder, setFolder, renderTopic, prefs: prefsIn, setPrefs, view: viewIn, setView: setViewIn, onRandom }) {
  const [viewLocal, setViewLocal] = useState('folders');
  const view = viewIn || viewLocal; const setView = setViewIn || setViewLocal;
  const prefs = prefsIn || { fav: [], pin: [] };
  const pinned = new Set(prefs.pin || []);
  const row = (t, extra) => (
    <div key={t.id} className={'trow2' + (pinned.has(t.id) ? ' pinned' : '')}>
      <div className="grow" style={{ minWidth: 0 }}>{renderTopic(t)}{extra}</div>
      <TopicMarks t={t} prefs={prefs} setPrefs={setPrefs} />
    </div>
  );
  const tabs = (
    <div className="tabs" role="tablist" aria-label="Browse topics">
      {TOPIC_VIEWS.map(([k, label]) => <button key={k} role="tab" aria-selected={view === k} className={'ttab' + (view === k ? ' on' : '')} onClick={() => { setView(k); setFolder(null); }}>{label}{k === 'favs' && (prefs.fav || []).length ? <span className="tabcount">{topics.filter((t) => (prefs.fav || []).includes(t.id)).length}</span> : null}</button>)}
      {onRandom && <button className="ttab" onClick={onRandom} aria-label="Pick a random topic">🎲 Random</button>}
    </div>
  );
  if (q.trim()) {
    const r = topics.filter((t) => matchTopic(t, q)).sort(byPopularity);
    return <div className="stack-sm">{r.map((t) => row(t, <span className="tfolder small muted">{folderEmoji(folderOf(t))} {folderOf(t)}</span>))}{!r.length && <p className="muted">No topics match “{q.trim()}”.</p>}</div>;
  }
  if (view === 'popular') {
    const ranked = topics.filter((t) => popScore(t) != null).sort(byPopularity);
    const yours = topics.filter((t) => popScore(t) == null).sort(byPopularity);
    return (
      <div className="stack-sm">
        {tabs}
        <p className="hint" style={{ margin: 0 }}>Our ranking of the built-in topics, from most to least crowd-pleasing. It’s fixed: picking, starring or pinning never changes it.</p>
        {ranked.map((t, i) => row(t, <span className="tfolder small muted">#{i + 1} · {folderEmoji(folderOf(t))} {folderOf(t)}</span>))}
        {yours.length > 0 && <><h3 style={{ marginTop: 8 }}>Your topics</h3>{yours.map((t) => row(t, <span className="tfolder small muted">{folderEmoji(folderOf(t))} {folderOf(t)}</span>))}</>}
      </div>
    );
  }
  if (view === 'favs') {
    const r = favouritesOrder(topics, prefs);
    return (
      <div className="stack-sm">
        {tabs}
        {r.length ? r.map((t) => row(t, <span className="tfolder small muted">{pinned.has(t.id) ? '📌 ' : ''}{folderEmoji(folderOf(t))} {folderOf(t)}</span>))
          : <p className="muted">No favourites yet — tap ☆ on any topic to keep it here.</p>}
        <p className="hint" style={{ margin: 0 }}>☆ Favourite keeps a topic in this tab. 📌 Pin moves it to the top of its own folder. They’re separate, saved on this device, and never shared with an online room.</p>
      </div>
    );
  }
  const names = folderList(topics);
  if (folder && names.includes(folder)) {
    const r = folderOrder(topics.filter((t) => folderOf(t) === folder), prefs);
    return (
      <div className="stack-sm">
        <div className="row">
          <button className="iconbtn" onClick={() => setFolder(null)} aria-label="All folders">←</button>
          <h3 className="grow" style={{ fontSize: 24 }}>{folderEmoji(folder)} {folder}</h3>
          <span className="small muted">{r.length} topic{r.length === 1 ? '' : 's'}</span>
        </div>
        {r.map((t) => row(t))}
      </div>
    );
  }
  return (
    <div className="stack-sm">
      {tabs}
      <div className="foldergrid">
        {names.map((f) => {
          const ts = folderOrder(topics.filter((t) => folderOf(t) === f), prefs);
          return (
            <button key={f} className="folder" onClick={() => setFolder(f)}>
              <span className="tab" />
              <span className="fe">{folderEmoji(f)}</span>
              <span className="fn">{f}</span>
              <span className="fc">{ts.length} topic{ts.length === 1 ? '' : 's'}{f === 'My Topics' ? ' · yours' : ''}</span>
              <span className="fm">{ts.slice(0, 5).map((t) => t.emoji).join(' ')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SetupTopic({ topics, onBack, onPick, onTopics, folder, setFolder, prefs, setPrefs }) {
  const [q, setQ] = useState('');
  const [view, setView] = useState('folders');
  // 🎲 Random: any playable topic from what you're looking at (a folder, Popular or Favourites).
  const random = () => {
    const playable = (t) => t.items.length && t.slots.length;
    const p = prefs || { fav: [] };
    const pool = (view === 'favs' ? topics.filter((t) => (p.fav || []).includes(t.id)) : folder ? topics.filter((t) => folderOf(t) === folder) : topics).filter(playable);
    if (pool.length) onPick(pool[Math.floor(Math.random() * pool.length)].id);
  };
  return (
    <div className="app">
      <TopBar onBack={folder && !q ? () => setFolder(null) : onBack} title="2 · Topic" />
      <h2 className="display">What are we drafting?</h2>
      <TopicSearch q={q} setQ={setQ} />
      <FolderBrowser topics={topics} q={q} folder={folder} setFolder={setFolder} prefs={prefs} setPrefs={setPrefs} view={view} setView={setView} onRandom={random} renderTopic={(t) => (
        <button key={t.id} className="tcard" onClick={() => onPick(t.id)} disabled={!t.items.length || !t.slots.length} style={{ opacity: t.items.length ? 1 : 0.4 }}>
          <span className="em">{t.emoji || '🎲'}</span>
          <span className="meta"><span className="name">{t.name}{!isBuiltIn(t) && <span className="yours">Yours</span>}</span><span className="sub">{t.items.length} items · {t.slots.length} slots</span></span>
          <span className="muted" style={{ fontSize: 22 }}>›</span>
        </button>
      )} />
      {folder && !q && <button className="btn" onClick={random}>🎲 Random topic from {folder}</button>}
      <button className="btn btn-ghost" onClick={onTopics}>Manage topics</button>
    </div>
  );
}

// Collapsible rules section with a master switch in its header.
function RuleSection({ id, title, emoji, on, onToggle, summary, children, open: startOpen }) {
  const [open, setOpen] = useState(!!startOpen);
  return (
    <section className={'rsec' + (on === false ? ' off' : '')}>
      <div className="rhead2">
        <button type="button" className="rtitle" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
          <span className="re">{emoji}</span><span className="grow" style={{ minWidth: 0 }}><b>{title}</b><span className="small muted" style={{ display: 'block' }}>{summary}</span></span><span className="chev">{open ? '▾' : '▸'}</span>
        </button>
        {onToggle && <button type="button" className="mini-sw" role="switch" aria-checked={!!on} aria-label={title + (on ? ' on' : ' off')} onClick={() => onToggle(!on)}><span /></button>}
      </div>
      {open && <div id={id} className="rbody stack">{children}</div>}
    </section>
  );
}
function PctField({ id, label, value, onChange, max }) {
  return <div className="field grow"><label htmlFor={id}>{label}</label><Stepper id={id} value={value} min={0} max={max} onChange={onChange} /></div>;
}

// Plain-language list of the rules in play. Used on the Review tab, in online lobbies and during a game.
function rulesLines(rules, opts) {
  const tw = twistRules(rules); const fin = { ...FINALE_DEFAULTS, ...(rules.finale || {}) };
  const per = opts && opts.teams ? 'team' : 'manager';
  const L = [];
  L.push(['💵', money(rules.budget) + ' budget per ' + per + ' · ' + (rules.slots || []).length + ' slots' + (rules.slots && rules.slots.length ? ' (' + rules.slots.join(', ') + ')' : '')]);
  L.push(['🔨', 'Bids start at ' + money(rules.minBid) + ', go up by ' + money(rules.inc) + (opts && opts.clock ? ' · ' + opts.clock + 's bid clock' : rules.timer ? ' · ' + rules.timer + 's bid timer' : ' · auctioneer taps Sold')]);
  L.push(['✋', rules.mustBid ? 'Require every manager to bid: ON — everyone must bid once on each item before dropping out' : 'Anyone can drop out of an item without bidding']);
  L.push(['🧭', rules.order === 'nominate' ? 'Nomination: teams take turns picking what goes up' : rules.order === 'saved' ? 'Items come up in topic order' : 'Items come up in random order']);
  L.push(['↩️', rules.noBids === 'back' ? 'Unbid items go to the back of the queue' : 'Unbid items are skipped (leftovers become free picks)']);
  if (rules.mustFill) L.push(['🧮', 'You must keep enough money to fill your team']);
  L.push(['🃏', tw.chaos.on ? 'Chaos Cards: ' + tw.chaos.count + ' per ' + per + ' — ' + CARD_TYPES.filter((c) => tw.chaos[c]).map((c) => CARD_INFO[c].name).join(', ') : 'Chaos Cards: off']);
  L.push(['❓', tw.mystery.on ? 'Mystery items: 1 in ' + tw.mystery.every : 'Mystery items: off']);
  L.push(['✨', tw.rarity.on ? 'Rarity: ' + (100 - tw.rarity.rare - tw.rarity.legendary) + '% common · ' + tw.rarity.rare + '% rare · ' + tw.rarity.legendary + '% legendary' : 'Rarity: off']);
  L.push(['🤝', tw.trades.on ? 'Trade window: ' + tw.trades.minutes + ' min' + (tw.trades.money ? ', money allowed' : '') : 'Trade window: off']);
  L.push(['🏆', 'Winner: ' + { vote: 'group vote', bracket: 'head-to-head vote bracket' + (fin.tiebreak === 'revote' ? ' (ties: vote again once)' : ' (ties: higher-rated team)'), sim: 'match simulator knockout', combined: 'combined finale ' + fin.weight + '% match / ' + (100 - fin.weight) + '% votes' }[fin.mode] + (fin.home && (fin.mode === 'sim' || fin.mode === 'combined') ? ' · home advantage for the higher seed' : '')]);
  return L;
}
function RulesSummary({ rules, opts }) {
  return <ul className="rulelist">{rulesLines(rules, opts).map(([e, t]) => <li key={t}><span aria-hidden="true">{e}</span> {t}</li>)}</ul>;
}

const RULE_TABS = [['general', 'General'], ['auction', 'Auction & bidding'], ['chaos', 'Chaos & surprises'], ['teams', 'Teams & trading'], ['winner', 'Winner'], ['review', 'Review']];
function SetupRules({ topic, managers, rules, setRules, onBack, onStart, startLabel = 'Start the draft', title = '3 · Rules', teamSummary, onEditTeams, onReset, defaultsMode, clockNote }) {
  const [slotTxt, setSlotTxt] = useState(rules.slots.join(', '));
  const [askReset, setAskReset] = useState(false);
  const [tab, setTab] = useState('general');
  const slots = parseSlots(slotTxt);
  const tw = twistRules(rules);
  const set = (p) => setRules({ ...rules, ...p });
  const setTw = (k, p) => setRules({ ...rules, [k]: { ...tw[k], ...p } });
  const needed = rules.minBid * Math.max(1, slots.length);
  const problems = [];
  if (!defaultsMode && !slots.length) problems.push('Add at least one slot.');
  if (!defaultsMode && rules.budget < needed) problems.push('A budget of ' + money(rules.budget) + " can't fill " + slots.length + ' slots at ' + money(rules.minBid) + ' each. Raise it to at least ' + money(needed) + '.');
  if (tw.chaos.on && !CARD_TYPES.some((c) => tw.chaos[c])) problems.push('Chaos Cards are on but every card type is switched off. Turn one on, or switch Chaos Cards off.');
  if (tw.rarity.on && tw.rarity.rare + tw.rarity.legendary > 100) problems.push('Rare + Legendary can’t be more than 100%.');
  if (!defaultsMode && topic.items.length < slots.length * managers.length) problems.push('Heads up: ' + topic.items.length + ' items for ' + slots.length * managers.length + ' slots. Some teams will finish short.');
  if (!defaultsMode && tw.mystery.on && topic.items.length < tw.mystery.every) problems.push('Heads up: this topic has fewer than ' + tw.mystery.every + ' items, so there won’t be any mystery items.');
  const blocking = problems.filter((p) => !p.startsWith('Heads up'));
  const posMissing = defaultsMode ? [] : [...new Set(topic.items.map((i) => i.pos).filter((p) => p && !slots.some((s) => norm(s) === norm(p))))];
  const common = 100 - tw.rarity.rare - tw.rarity.legendary;
  const mysteryCount = tw.mystery.on && !defaultsMode ? Math.floor(topic.items.length / Math.max(2, tw.mystery.every)) : 0;
  const teams = !!(teamSummary && teamSummary.teams);
  const fin = { ...FINALE_DEFAULTS, ...(rules.finale || {}) };
  const setF = (p) => set({ finale: { ...fin, ...p } });
  const foot = defaultsMode || isFootball(topic);
  const onCount = { chaos: [tw.chaos.on, tw.mystery.on, tw.rarity.on].filter(Boolean).length, teams: [tw.trades.on].filter(Boolean).length };
  return (
    <div className="app">
      <TopBar onBack={onBack} title={title} />
      <div><p className="eyebrow">{defaultsMode ? 'Your defaults for new games' : topic.emoji + ' ' + topic.name}</p><h2 className="display">House rules</h2><p className="hint">{defaultsMode ? 'New games start with these. You can still change them when setting up a game.' : 'Changes apply to this new draft. A game in progress keeps its rules.'} Optional extras are off until you switch them on.</p></div>
      <div className="tabs" role="tablist" aria-label="Rule sections">
        {RULE_TABS.map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} className={'ttab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{label}{onCount[k] ? <span className="tabcount">{onCount[k]} on</span> : null}</button>)}
      </div>

      {tab === 'general' && <div className="stack" role="tabpanel">
        <div className="field"><label htmlFor="r-budget">Starting budget{teams ? ' (per team)' : ''}</label><Stepper id="r-budget" prefix="$" value={rules.budget} min={1} max={999} onChange={(v) => set({ budget: v })} /><p className="hint">What each {teams ? 'team' : 'manager'} has to spend on the whole draft.</p></div>
        {!defaultsMode && <div className="field">
          <label htmlFor="r-slots">Slots per team ({slots.length})</label>
          <input id="r-slots" className="input" value={slotTxt} onChange={(e) => { setSlotTxt(e.target.value); const p = parseSlots(e.target.value); if (p.length) set({ slots: p }); }} />
          <p className="hint">How many items each team ends up with. FLEX takes anything.</p>
          {posMissing.length > 0 && <p className="hint">No slot for {posMissing.join(', ')}. Those items can go in any open slot.</p>}
        </div>}
        <div className="field"><span className="label">Item order</span><Seg label="Draft order" value={rules.order} options={[['random', 'Random'], ['nominate', 'Nomination'], ['saved', 'Topic order']]} onChange={(v) => set({ order: v })} />
          <p className="hint">{rules.order === 'nominate' ? 'Teams take turns choosing which item goes up next.' : rules.order === 'saved' ? 'Items come up in the order saved in the topic.' : 'Items come up in a random order.'}</p></div>
        <Toggle on={rules.mustFill} onChange={(v) => set({ mustFill: v })} title="Must be able to fill your team" sub={'Your highest bid always leaves ' + money(rules.minBid) + ' for each other empty slot.'} />
      </div>}

      {tab === 'auction' && <div className="stack" role="tabpanel">
        <div className="field"><label htmlFor="r-min">Minimum bid</label><Stepper id="r-min" prefix="$" value={rules.minBid} min={1} max={99} onChange={(v) => set({ minBid: v })} /><p className="hint">The opening price for every item.</p></div>
        <div className="field"><label htmlFor="r-inc">Bid increment</label><Stepper id="r-inc" prefix="$" value={rules.inc} min={1} max={99} onChange={(v) => set({ inc: v })} /><p className="hint">How much each tap raises the price.</p></div>
        <div className="field"><span className="label">Bid timer (Local games)</span><Seg label="Bid timer" value={rules.timer} options={[[0, 'Off'], [10, '10s'], [15, '15s'], [30, '30s']]} onChange={(v) => set({ timer: v })} />
          <p className="hint">{rules.timer > 0 ? 'Restarts on every bid. When it runs out the item sells to the leader.' : 'Off: the auctioneer taps Sold.'} {clockNote || 'Solo and Online games always use a bid clock (set on their own setup screens).'}</p></div>
        <Toggle on={!!rules.mustBid} onChange={(v) => set({ mustBid: v })} title="Require every manager to bid" sub="Everyone who can afford it must bid at least once on each item before they can tap “I’m out”. The item can’t close until they have. Managers who can’t afford the next bid, or have no slot for it, are excused." />
        <div className="field"><span className="label">Items nobody bids on</span><Seg label="No bids" value={rules.noBids} options={[['skip', 'Skip them'], ['back', 'Back of queue']]} onChange={(v) => set({ noBids: v })} /></div>
        <div className="card stack-sm" style={{ background: 'var(--stage)' }}>
          <b className="small">How “I’m out” works</b>
          <p className="hint" style={{ margin: 0 }}>Tapping “I’m out” drops you out of the current item only: you can’t bid on it again, and you’re back in for the next item. A bid you already made still stands. As soon as nobody but the leader can still bid, the item sells straight away; if nobody can bid at all, it goes unsold. Bots drop out when the price passes what they’ll pay.</p>
        </div>
      </div>}

      {tab === 'chaos' && <div className="stack" role="tabpanel">
        <p className="hint">Optional twists. All off unless you switch them on.</p>
        <RuleSection id="rs-chaos" emoji="🃏" title="Chaos Cards" on={tw.chaos.on} onToggle={(v) => setTw('chaos', { on: v })} summary={tw.chaos.on ? tw.chaos.count + ' per ' + (teams ? 'team' : 'manager') + ' · ' + CARD_TYPES.filter((c) => tw.chaos[c]).map((c) => CARD_INFO[c].name).join(', ') : 'Off'}>
          <div className="field"><label htmlFor="r-cards">Cards per {teams ? 'team' : 'manager'}</label><Stepper id="r-cards" value={tw.chaos.count} min={1} max={5} onChange={(v) => setTw('chaos', { count: v })} />
            {teams ? <p className="hint">In team games, cards belong to the team, not each player.</p> : null}</div>
          {CARD_TYPES.map((c) => <Toggle key={c} on={tw.chaos[c]} onChange={(v) => setTw('chaos', { [c]: v })} title={CARD_INFO[c].emoji + ' ' + CARD_INFO[c].name} sub={CARD_INFO[c].text + (c === 'steal' ? money(rules.inc) + '.' : '')} />)}
        </RuleSection>
        <RuleSection id="rs-mys" emoji="❓" title="Mystery items" on={tw.mystery.on} onToggle={(v) => setTw('mystery', { on: v })} summary={tw.mystery.on ? '1 in ' + tw.mystery.every + (defaultsMode ? '' : ' · ' + mysteryCount + ' in this topic') : 'Off'}>
          <div className="field"><span className="label">How often</span><Seg label="Mystery frequency" value={tw.mystery.every} options={[[5, '1 in 5'], [8, '1 in 8'], [12, '1 in 12']]} onChange={(v) => setTw('mystery', { every: v })} /></div>
          <p className="hint">Mystery items are auctioned face down and fit any open slot. You find out what you bought after it sells.</p>
        </RuleSection>
        <RuleSection id="rs-rar" emoji="✨" title="Rarity" on={tw.rarity.on} onToggle={(v) => setTw('rarity', { on: v })} summary={tw.rarity.on ? common + '% Common · ' + tw.rarity.rare + '% Rare · ' + tw.rarity.legendary + '% Legendary' : 'Off'}>
          <div className="row"><PctField id="r-rare" label="Rare %" value={tw.rarity.rare} max={100 - tw.rarity.legendary} onChange={(v) => setTw('rarity', { rare: v })} /><PctField id="r-leg" label="Legendary %" value={tw.rarity.legendary} max={100 - tw.rarity.rare} onChange={(v) => setTw('rarity', { legendary: v })} /></div>
          <p className="hint">Some items are marked Rare or Legendary, with a special reveal and an award for collecting them. Common is the rest ({common}%). It doesn’t change prices.</p>
        </RuleSection>
      </div>}

      {tab === 'teams' && <div className="stack" role="tabpanel">
        {teamSummary && <div className="card stack-sm"><b>👥 {teamSummary.text}</b><p className="hint" style={{ margin: 0 }}>{teamSummary.detail} Teams share one budget and bid as one.</p>
          {onEditTeams && <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onEditTeams}>Edit players &amp; teams</button>}</div>}
        <RuleSection id="rs-trade" emoji="🤝" title="Trade window after the draft" on={tw.trades.on} onToggle={(v) => setTw('trades', { on: v })} summary={tw.trades.on ? tw.trades.minutes + ' min' + (tw.trades.money ? ' · money allowed' : '') : 'Off'}>
          <div className="field"><span className="label">Trade window</span><Seg label="Trade window length" value={tw.trades.minutes} options={[[1, '1 min'], [3, '3 min'], [5, '5 min'], [10, '10 min']]} onChange={(v) => setTw('trades', { minutes: v })} /></div>
          <Toggle on={tw.trades.money} onChange={(v) => setTw('trades', { money: v })} title="Money in trades" sub="A team can add cash to sweeten a 1-for-1 trade." />
          <p className="hint">1-for-1 swaps. Both teams must accept, and both items must fit the new team.</p>
        </RuleSection>
        <p className="hint">Nomination (teams taking turns to choose the next item) is under General → Item order.</p>
      </div>}

      {tab === 'winner' && <div className="stack" role="tabpanel">
        <div className="field"><span className="label">How the champion is chosen</span>
          <Seg label="Winner selection" value={fin.mode} options={[['vote', 'Vote'], ['bracket', 'Bracket'], ['sim', 'Matches'], ['combined', 'Combined']]} onChange={(v) => setF({ mode: v })} />
          <p className="hint">{fin.mode === 'vote' ? 'Everyone votes once for the best team (the classic way).' : fin.mode === 'bracket' ? 'Teams meet 1v1 in a knockout bracket. Players not in the matchup vote; you never vote for your own team.' : fin.mode === 'sim' ? 'Every bracket matchup is an animated football match. Win to go through.' : 'Each matchup has an animated match and a vote, combined into one score.'}</p>
          {!foot && (fin.mode === 'sim' || fin.mode === 'combined') && <p className="warn">Matches only work for the football topics (Premier League Legends, Current Footballers, Football GOATs). For this topic the bracket uses votes instead.</p>}
        </div>
        {fin.mode === 'combined' && <div className="field"><span className="label">Weighting</span><Seg label="Weighting" value={fin.weight} options={[[50, '50/50'], [60, '60/40'], [70, '70/30']]} onChange={(v) => setF({ weight: v })} /><p className="hint">Match performance / votes. Goals become a 0–100% share so a 6–5 thriller doesn’t swamp the votes.</p></div>}
        {(fin.mode === 'bracket' || fin.mode === 'combined') && <div className="field"><span className="label">If a vote is tied</span><Seg label="Tiebreaker" value={fin.tiebreak} options={[['rating', 'Higher-rated team'], ['revote', 'Vote again once']]} onChange={(v) => setF({ tiebreak: v })} />{fin.mode === 'combined' && <p className="hint">In Combined, a dead-level total is settled by the match (extra time or penalties).</p>}</div>}
        {(fin.mode === 'sim' || fin.mode === 'combined') && <>
          <div className="field"><span className="label">Match speed</span><Seg label="Match speed" value={fin.speed} options={[['instant', 'Instant'], ['fast', 'Fast'], ['normal', 'Normal']]} onChange={(v) => setF({ speed: v })} /><p className="hint">How fast matches start playing. Everyone can still pause, change speed or skip while watching.</p></div>
          <Toggle on={fin.commentary} onChange={(v) => setF({ commentary: v })} title="Match commentary" sub="Show the running commentary feed (goals and cards always show)." />
          <Toggle on={!!fin.home} onChange={(v) => setF({ home: v })} title="Home advantage" sub="The higher seed plays at home: a small boost to its expected goals (+0.15). Off by default." />
          <p className="hint">Knockout matches that end level go to extra time, then penalties. Player ratings are estimated game ratings, not official EA Sports FC ratings.</p>
        </>}
      </div>}

      {tab === 'review' && <div className="stack" role="tabpanel">
        <p className="hint">Everything that will be in play{defaultsMode ? ' for new games' : ''}:</p>
        <RulesSummary rules={{ ...rules, slots: defaultsMode ? [] : slots }} opts={{ teams }} />
      </div>}

      {problems.map((p) => <p key={p} className={p.startsWith('Heads up') ? 'hint' : 'warn'}>{p}</p>)}
      <div className="row">{tab !== 'review' && <button className="btn grow" onClick={() => setTab('review')}>Review rules</button>}<button className="btn btn-gold grow" disabled={blocking.length > 0} onClick={() => onStart({ ...rules, slots: defaultsMode ? rules.slots : slots })}>{startLabel}</button></div>
      {onReset && <button className="btn btn-ghost" onClick={() => setAskReset(true)}>Reset rules to defaults</button>}
      {askReset && <Confirm title="Reset rules?" body="Budget and bidding go back to the standard rules, and every optional twist is switched off." yes="Reset" onYes={() => { onReset(); if (!defaultsMode) setSlotTxt(topic.slots.join(', ')); }} onClose={() => setAskReset(false)} />}
    </div>
  );
}

/* ============================================================
   AUCTION
   ============================================================ */
function ManagerButton({ d, m, onBid, onCustom, onOut, disabledAll, readOnly, bubble, thinking }) {
  const amt = nextAmount(d);
  const isLead = d.bid && d.bid.leaderId === m.id;
  const blocker = bidBlocker(d, m);
  const enabled = !readOnly && !disabledAll && !blocker && canBid(d, m, amt);
  const customOk = !readOnly && !disabledAll && canBid(d, m, d.bid ? d.bid.amount + 1 : d.rules.minBid);
  const t = useRef(null); const fired = useRef(true);
  const down = () => { if (!customOk) return; fired.current = false; t.current = setTimeout(() => { fired.current = true; buzz(25); onCustom(); }, 550); };
  const up = () => { clearTimeout(t.current); if (!fired.current && enabled) onBid(amt); fired.current = true; };
  const cancel = () => { clearTimeout(t.current); fired.current = true; };
  const filled = d.rules.slots.length - emptyCount(m);
  const botInfo = isBot(m) ? BOT_TYPES[m.bot.type] : null;
  const status = isLead ? <span className="badge">★ Leading{enabled ? ' · tap +' + money(d.rules.inc) : ''}</span>
    : thinking ? <span className="badge think">Thinking…</span>
    : readOnly ? (blocker || (m.cover ? '📡 Away · bot covering' : botInfo ? botInfo.short : (m.uid || m.members) && d.mode === 'online' ? '📱 On their phone' : 'Watching'))
    : (blocker || 'Tap: ' + money(amt));
  const dim = readOnly ? !!blocker && !isLead : (!isLead && !enabled && !customOk);
  const handlers = readOnly ? {} : { onPointerDown: down, onPointerUp: up, onPointerLeave: cancel, onPointerCancel: cancel,
    onKeyDown: (e) => { if ((e.key === 'Enter' || e.key === ' ') && enabled) { e.preventDefault(); onBid(amt); } } };
  return (
    <div role={readOnly ? 'group' : 'button'} tabIndex={enabled ? 0 : -1} aria-disabled={readOnly ? undefined : !enabled} aria-label={readOnly ? m.name + (botInfo ? ', ' + botInfo.label : '') : undefined}
      className={'mgr' + (isLead ? ' isLead' : '') + (dim ? ' off' : '') + (thinking ? ' thinking' : '') + (m.human ? ' you' : '')}
      style={mStyle(m)} onContextMenu={(e) => e.preventDefault()} {...handlers}>
      {bubble && <span className="bubble" key={bubble.id} role="status">{bubble.text}</span>}
      <span className="who">{m.emoji} {m.name}</span>
      {m.members && <span className="mem">{m.members.map((p) => p.name).join(' · ')}</span>}
      <span className="money num">{money(m.budget)}{d.cards && d.cards[m.id] && d.cards[m.id].length ? <span className="cardchip" title="Chaos Cards left">🃏{d.cards[m.id].length}</span> : null}</span>
      <span className="st">{status} · {filled}/{d.rules.slots.length}</span>
      {onOut && <button className="edit outbtn" aria-label={m.name + ' is out on this item'} title="Out on this item" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onOut(); }}>✋</button>}
      {customOk && <button className="edit" aria-label={'Custom bid for ' + m.name} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onCustom(); }}>✎</button>}
    </div>
  );
}

// Speech bubbles for bots: only on real events, rate-limited, never the same line twice in a row.
function useBotTalk(d) {
  const [bubbles, setBubbles] = useState({});
  const last = useRef(0); const per = useRef({}); const timers = useRef([]);
  const enabled = (d.mode === 'solo' || d.mode === 'online') && !(d.solo && d.solo.talk === false);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // who: a bot manager id, or a bot "actor" ({ id: team id, name, bot, speaker }) from a bot team.
  const say = (who, event, extra, force) => {
    if (!enabled) return;
    const bot = typeof who === 'object' ? who : (d.managers.find((m) => m.id === who) || botActors(d).find((a) => a.speaker === who));
    if (!bot || !isBot(bot)) return;
    const botId = bot.id;
    const now = Date.now();
    if (!force && (now - last.current < ms(3000) || now - (per.current[botId] || 0) < ms(7000))) return;
    if (!force && Math.random() > (TALK_CHANCE[event] != null ? TALK_CHANCE[event] : 0.3)) return;
    const line = botLine({ ...bot, id: bot.speaker || bot.id }, event, extra);
    if (!line) return;
    const text = d.teamMode ? bot.name + ': ' + line : line;
    last.current = now; per.current[botId] = now;
    const id = now + '-' + Math.random();
    setBubbles((b) => ({ ...b, [botId]: { text, id } }));
    timers.current.push(setTimeout(() => setBubbles((b) => { if (!b[botId] || b[botId].id !== id) return b; const n = { ...b }; delete n[botId]; return n; }), Math.max(ms(2800), 300)));
  };
  const later = (delay, fn) => { timers.current.push(setTimeout(fn, delay)); };
  return { bubbles, say, later };
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

function RarityTag({ r }) { return r && r !== 'common' ? <span className={'rtag ' + r}>{r === 'legendary' ? '★ Legendary' : '◆ Rare'}</span> : null; }
function ItemCard({ item: real, d }) {
  const item = visibleItem(d, real.id);
  const rar = rarityOf(d, real.id);
  if (item.hidden) return (
    <div className="flip">
      <div className="flip-inner">
        <div className="face itemcard mysterycard">
          <div className="ph mys" aria-hidden="true">?</div>
          <div className="info">
            <span><span className="pos">MYSTERY</span></span>
            <div className="nm">Mystery item</div>
            <div className="ds">Face down. You find out what it is after it sells.</div>
            <div className="fits">Fits any open slot</div>
          </div>
        </div>
        <div className="face back"><span>?</span></div>
      </div>
    </div>
  );
  const pos = norm(item.pos);
  const inTemplate = pos && d.rules.slots.some((s) => norm(s) === pos);
  const hasFlex = d.rules.slots.some(isFlex);
  return (
    <div className={'flip' + (rar ? ' r-' + rar : '')}>
      <div className="flip-inner">
        <div className={'face itemcard' + (rar ? ' r-' + rar : '')}>
          <div className="ph"><ItemArt item={item} topic={d.topic} size={104} radius={16} /></div>
          <div className="info">
            <span className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{item.pos && <span className="pos">{item.pos}</span>}<RarityTag r={rar} />{isFootball(d.topic) && <RatingChip item={item} />}</span>
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

/* ---------- Chaos Cards: play sheet and Veto prompt ---------- */
function CardSheet({ d, by: fixedBy, onPlay, onDouble, onClose }) {
  const [by, setBy] = useState(fixedBy || null);
  const [card, setCard] = useState(null);
  const [target, setTarget] = useState(null);
  const [mine, setMine] = useState(null);
  const [item, setItem] = useState(null);
  const minPay = Math.max(d.rules.minBid, Math.ceil(nextAmount(d) / 2));
  const [pay, setPay] = useState(minPay);
  const team = by && teamOf(d, by);
  const rivals = d.managers.filter((m) => m.id !== by);
  const reset = () => { setCard(null); setTarget(null); setMine(null); setItem(null); };
  const itemsOf = (m) => m.team.filter(Boolean);
  const title = (t) => <h2 className="display" style={{ fontSize: 30 }}>{t}</h2>;
  if (!by) return (
    <Sheet center onClose={onClose}>
      {title('Who’s playing a card?')}
      <div className="stack-sm">
        {d.managers.map((m) => (
          <button key={m.id} className="votebtn" style={{ ...mStyle(m), flexDirection: 'row', justifyContent: 'space-between' }} disabled={!(d.cards[m.id] || []).length} onClick={() => setBy(m.id)}>
            <span>{m.emoji} {m.name}</span><span>🃏 {(d.cards[m.id] || []).length}</span>
          </button>
        ))}
      </div>
      <button className="btn btn-ghost" onClick={onClose}>Close</button>
    </Sheet>
  );
  const params = { target, item, mine };
  const problem = card === 'double' ? doubleProblem(d, by, pay) : card ? cardProblem(d, by, card, params) : null;
  const ready = card && !problem && (card === 'double' || card === 'freeze' ? (card === 'double' || target) : card === 'steal' ? target && item : target && item && mine);
  let summary = '';
  if (card === 'double') summary = 'Bid ' + money(pay) + '. It counts as ' + money(pay * 2) + '. You pay ' + money(pay) + ' if you win.';
  if (card === 'freeze' && target) summary = teamOf(d, target).name + ' can’t bid on this item.';
  if (card === 'steal' && item) { const owner = teamOf(d, target); const t = owner.team.find((x) => x && x.itemId === item); summary = 'Take ' + d.items[item].name + ' from ' + owner.name + '. You pay them ' + money(stealPrice(d, t)) + '.'; }
  if (card === 'swap' && item && mine) summary = 'Give ' + d.items[mine].name + ', get ' + d.items[item].name + ' from ' + teamOf(d, target).name + '.';
  return (
    <Sheet center onClose={onClose}>
      <p className="eyebrow">{team.emoji} {team.name} · Chaos Cards</p>
      {!card ? (
        <>
          {title('Play a card')}
          {!cardWindow(d) && <p className="hint">Steal, Swap and Freeze can only be played before the first bid on an item.</p>}
          <div className="stack-sm">
            {(d.cards[by] || []).map((c, i) => {
              const info = CARD_INFO[c];
              const why = c === 'veto' ? 'Kept for defence. It’s used when someone targets you.' : c === 'double' ? doubleProblem(d, by, Math.max(minPay, d.rules.minBid)) : (!cardWindow(d) ? 'Only before the first bid.' : null);
              return (
                <button key={c + i} className="cardbtn" disabled={c === 'veto' || (c !== 'double' && !cardWindow(d))} onClick={() => { setCard(c); setPay(minPay); }}>
                  <span className="ce">{info.emoji}</span>
                  <span className="grow" style={{ minWidth: 0 }}><b>{info.name}</b><span className="small" style={{ display: 'block', opacity: 0.85 }}>{info.text}{c === 'steal' ? money(d.rules.inc) + '.' : ''}</span>{why && <span className="small muted" style={{ display: 'block' }}>{why}</span>}</span>
                </button>
              );
            })}
            {!(d.cards[by] || []).length && <p className="hint">No cards left.</p>}
          </div>
          <button className="btn btn-ghost" onClick={fixedBy ? onClose : () => setBy(null)}>{fixedBy ? 'Close' : 'Back'}</button>
        </>
      ) : (
        <>
          {title(CARD_INFO[card].emoji + ' ' + CARD_INFO[card].name)}
          {card === 'double' && (
            <div className="field"><label htmlFor="dbl-pay">You pay</label><Stepper id="dbl-pay" prefix="$" value={pay} min={minPay} max={Math.max(minPay, maxBid(team, d.rules))} onChange={setPay} /></div>
          )}
          {(card === 'freeze' || card === 'steal' || card === 'swap') && (
            <div className="field"><span className="label">Rival team</span>
              <div className="chips">{rivals.map((m) => <button key={m.id} className={'pickchip' + (target === m.id ? ' on' : '')} style={mStyle(m)} onClick={() => { setTarget(m.id); setItem(null); }}>{m.emoji} {m.name}</button>)}</div>
            </div>
          )}
          {card === 'swap' && (
            <div className="field"><span className="label">Your item to give</span>
              <div className="stack-sm">{itemsOf(team).map((t) => <button key={t.itemId} className={'pickbtn' + (mine === t.itemId ? ' on' : '')} onClick={() => setMine(t.itemId)}><Thumb item={d.items[t.itemId]} topic={d.topic} /><span className="grow">{d.items[t.itemId].name}</span></button>)}
                {!itemsOf(team).length && <p className="hint">You don’t own anything yet.</p>}</div>
            </div>
          )}
          {(card === 'steal' || card === 'swap') && target && (
            <div className="field"><span className="label">{card === 'steal' ? 'Item to steal' : 'Item to get'}</span>
              <div className="stack-sm">{itemsOf(teamOf(d, target)).map((t) => (
                <button key={t.itemId} className={'pickbtn' + (item === t.itemId ? ' on' : '')} onClick={() => setItem(t.itemId)}>
                  <Thumb item={d.items[t.itemId]} topic={d.topic} /><span className="grow">{d.items[t.itemId].name}</span>{card === 'steal' && <span className="num" style={{ fontFamily: 'var(--display)', color: 'var(--gold)' }}>{money(stealPrice(d, t))}</span>}
                </button>
              ))}{!itemsOf(teamOf(d, target)).length && <p className="hint">They don’t own anything yet.</p>}</div>
            </div>
          )}
          {summary && <p className="summary">{summary}</p>}
          {problem && (card === 'double' || target) && <p className="warn">{problem}</p>}
          <div className="row pin">
            <button className="btn btn-ghost grow" onClick={reset}>Back</button>
            <button className="btn btn-gold grow" disabled={!ready} onClick={() => { if (card === 'double') onDouble(by, pay); else onPlay(by, card, params); onClose(); }}>Play {CARD_INFO[card].name}</button>
          </div>
        </>
      )}
    </Sheet>
  );
}
function cardPlayText(d, play) {
  const by = teamOf(d, play.by), them = teamOf(d, play.target);
  if (play.card === 'freeze') return by.name + ' wants to FREEZE ' + them.name + ' for this item.';
  if (play.card === 'steal') { const t = them.team.find((x) => x && x.itemId === play.item); return by.name + ' wants to STEAL ' + d.items[play.item].name + ' from ' + them.name + (t ? ' for ' + money(stealPrice(d, t)) : '') + '.'; }
  if (play.card === 'swap') return by.name + ' wants to SWAP ' + d.items[play.mine].name + ' for ' + them.name + '’s ' + d.items[play.item].name + '.';
  return '';
}
function VetoSheet({ d, onAnswer }) {
  const play = d.pending; const them = teamOf(d, play.target);
  return (
    <Sheet center onClose={() => {}}>
      <p className="eyebrow">🛑 Veto?</p>
      <h2 className="display" style={{ fontSize: 30, color: them.color }}>{them.emoji} {them.name}</h2>
      <p className="summary">{cardPlayText(d, play)}</p>
      <p className="hint">You have a Veto card. Use it to block this? {d.mode === 'local' ? 'Pass the phone to ' + them.name + '.' : ''}</p>
      <div className="row pin">
        <button className="btn grow" onClick={() => onAnswer(false)}>Let it happen</button>
        <button className="btn btn-gold grow" onClick={() => onAnswer(true)}>Use Veto</button>
      </div>
    </Sheet>
  );
}

const bidKeyOf = (d) => d.reveal + ':' + (d.bid ? d.bid.amount + d.bid.leaderId : 'none');

function Auction({ d, setDraft, goHome, flashing, onFlash }) {
  const item = currentItem(d);
  const solo = d.mode === 'solo';
  const net = useNet(); const nv = netView(d, net); const online = nv.online; const auto = solo || online;
  const act = useAct(d, setDraft);
  const [pausedLocal, setPaused] = useState(false);
  const [gavelLocal, setGavel] = useState(false);
  const [custom, setCustom] = useState(null);
  const [teams, setTeams] = useState(false);
  const [thinkingLocal, setThinking] = useState(null);
  // Online, the host's phone runs the clock; everyone else shows what it publishes.
  const paused = nv.isHost ? pausedLocal : !!nv.live.paused;
  const gavel = nv.isHost ? gavelLocal : !!nv.live.gavel;
  const thinking = nv.isHost ? thinkingLocal : nv.live.thinking || null;
  const [cardsOpen, setCardsOpen] = useState(false);
  const cardTried = useRef(new Set()); // each bot considers a card at most once per item
  const hold = paused || !!d.pending;   // a card waiting for a Veto answer pauses the item
  const busy = useRef(false);
  // Solo games always run a closing clock so items sell on their own.
  const timer = solo ? ((d.solo && d.solo.clock) || 8) : online ? ((d.online && d.online.clock) || ONLINE.clock) : (d.rules.timer || 0);
  const [leftLocal, setLeft] = useState(timer);
  const bidKey = bidKeyOf(d);
  const left = nv.isHost ? leftLocal : (nv.live.key === bidKey && typeof nv.live.left === 'number' ? nv.live.left : timer);
  const talk = useBotTalk(d);
  const bubbles = nv.isHost ? talk.bubbles : (nv.live.bubbles || {});
  useEffect(() => {
    if (nv.isHost && net && net.publishLive) net.publishLive({ left: leftLocal, key: bidKey, paused: pausedLocal, gavel: gavelLocal, thinking: thinkingLocal, bubbles: talk.bubbles });
  }, [online, nv.isHost, leftLocal, bidKey, pausedLocal, gavelLocal, thinkingLocal, talk.bubbles]);
  // Refs let delayed bot actions check the *current* game before acting.
  const live = useRef({}); live.current = { d, paused: hold, flashing, gavel, left };
  useEffect(() => { setLeft(timer); }, [bidKey, timer]);

  const leader = d.bid && d.managers.find((m) => m.id === d.bid.leaderId);
  const total = d.processed + d.queue.length;
  const you = solo ? d.managers.find((m) => m.human) : online ? d.managers.find((m) => nv.controls(m.id)) : null;

  function sold() {
    if (!d.bid || busy.current || flashing) return;
    busy.current = true;
    const price = d.bid.amount; const winnerId = d.bid.leaderId;
    const bidders = [...new Set(d.bids.filter(Boolean).map((b) => b.leaderId))].filter((id) => id !== winnerId);
    const real = d.items[d.queue[0]];
    const info = { kind: 'sold', name: leader.name, emoji: leader.emoji, color: leader.color, price, item: real.name, mystery: !!real.mystery, rarity: (d.rarity || {})[real.id] || null, doubled: !!d.bid.double };
    buzz([40, 30, 160]); setGavel(true); setThinking(null);
    const big = price >= d.rules.budget * ((audio.cfg.bigSale || 40) / 100);
    info.big = big;
    audio.play(big ? 'big' : 'gavel');
    let line = callLine('sold', { who: leader.name, amt: money(price) });
    if (big) line += ' ' + callLine('big');
    if (real.mystery) { audio.play('drumroll'); line += ' ' + callLine('mysteryReveal', { item: real.name }); }
    if (info.rarity === 'legendary') { line += ' ' + callLine('legendary'); setTimeout(() => audio.play('cheer'), 900); }
    else if (info.rarity === 'rare') line += ' ' + callLine('rare');
    else if (big) setTimeout(() => audio.play('cheer'), 500);
    audio.say(line, 3, d.id + ':sold:' + d.reveal);
    setTimeout(() => {
      setGavel(false); onFlash(info); setDraft((p) => sell(p)); busy.current = false;
      if (nv.runsBots) talk.later(ms(1900), () => {
        const fair = d.rules.budget / d.rules.slots.length;
        if (isBot(leader)) talk.say(winnerId, price <= d.rules.minBid + d.rules.inc && itemFame(item) > 0.45 ? 'steal' : 'win');
        else if (price >= fair * 1.4) { const b = d.managers.find((m) => isBot(m)); if (b) talk.say(b.id, 'rival'); }
        const loser = bidders.map((id) => d.managers.find((m) => m.id === id)).find(isBot);
        if (loser) talk.later(ms(900), () => talk.say(loser.id, 'lose'));
      });
    }, ms(520));
  }
  function skip() {
    if (busy.current || flashing) return;
    const back = d.rules.noBids === 'back' && !d.passed.includes(d.queue[0]);
    setThinking(null);
    audio.say(callLine('noBids'), 1, d.id + ':skip:' + d.reveal);
    onFlash({ kind: 'skip', item: visibleItem(d, item.id).name, back });
    setDraft((p) => skipItem(p));
  }

  // Closing clock: a steady ticker that restarts on every bid, so a bid landing on the
  // same instant as a tick can never stall it.
  useEffect(() => {
    if (!nv.isHost || !timer || hold || flashing || gavel) return undefined;
    const t = setInterval(() => setLeft((l) => (l > 0 ? l - 1 : 0)), ms(1000));
    return () => clearInterval(t);
  }, [bidKey, hold, flashing, gavel, timer, nv.isHost]);
  const owe = owing(d);
  useEffect(() => {
    if (!nv.isHost || !timer || hold || flashing || gavel || left > 0 || owe.length) return;
    if (d.bid) sold(); else if (auto) skip();
  }, [left, hold, flashing, gavel, timer, nv.isHost, owe.length]);
  // End the item early when nobody else can bid (see auctionEnd for the rule).
  const endNow = auctionEnd(d);
  useEffect(() => {
    if (!nv.isHost || hold || flashing || gavel || !endNow) return undefined;
    const t = setTimeout(() => { const cur = live.current; if (cur.paused || cur.flashing || cur.gavel || busy.current || auctionEnd(cur.d) !== endNow) return; if (endNow === 'sell') sold(); else skip(); }, ms(600));
    return () => clearTimeout(t);
  }, [endNow, bidKey, hold, flashing, gavel, nv.isHost]);

  // Solo: one bot at a time considers the current price, then bids after a short, human-ish delay.
  const cardKey = bidKey + ':' + JSON.stringify(d.cards || {}) + ':' + ((d.cardLog || []).length) + ':' + outIds(d).length;
  useEffect(() => {
    if (!nv.runsBots || hold || flashing || gavel || busy.current || d.phase !== 'auction') { setThinking(null); return undefined; }
    // Before the first bid, a bot may play a card (once per item); otherwise the quickest bidder acts.
    let cardPlan = null;
    if (cardWindow(d)) {
      for (const a of botActors(d)) {
        const k = d.reveal + ':' + a.speaker;
        if (cardTried.current.has(k)) continue;
        cardTried.current.add(k);
        const c = botCardPlay(d, a);
        if (c) { cardPlan = c; break; }
      }
    }
    const plan = cardPlan || nextBotAction(d) || botForcedBid(d);
    // Bots that pass at this price drop out, so the item can end as soon as nobody else wants it.
    const passers = cardPlan ? [] : botPassers(d);
    const tOut = passers.length ? setTimeout(() => {
      const cur = live.current;
      if (cur.paused || cur.flashing || cur.gavel || busy.current) return;
      setDraft((p) => { const still = new Set(botPassers(p)); return passers.filter((id) => still.has(id)).reduce((n, id) => withdraw(n, id), p); });
    }, ms(plan ? 450 : 700)) : null;
    if (!plan) { setThinking(null); return () => clearTimeout(tOut); }
    setThinking(plan.botId);
    const t = setTimeout(() => {
      const cur = live.current;
      if (cur.paused || cur.flashing || cur.gavel || busy.current || (cur.left <= 0 && !owing(cur.d).length) || cur.d.phase !== 'auction') return;
      setThinking(null);
      const speaker = botActors(d).find((a) => a.speaker === plan.speaker) || plan.botId;
      if (plan.card) {
        setDraft((p) => (p.reveal === d.reveal && !p.bid ? playCard(p, plan.botId, plan.card, plan.params) : p));
        talk.say(speaker, 'card', null, true);
        return;
      }
      setDraft((p) => (bidKeyOf(p) === bidKey && p.phase === 'auction' ? placeBid(p, plan.botId, plan.amount, plan.double ? { double: true } : undefined) : p));
      talk.say(speaker, plan.event);
    }, ms(plan.delay));
    return () => { clearTimeout(t); clearTimeout(tOut); };
  }, [cardKey, hold, flashing, gavel, nv.runsBots]);

  // A card aimed at a bot team that holds a Veto: the bot answers on its own.
  useEffect(() => {
    if (!d.pending) return undefined;
    const victim = teamOf(d, d.pending.target);
    const botVictim = nv.runsBots && victim && (isBot(victim) || isBotTeam(victim));
    if (!botVictim) return undefined;
    const id = d.pending.id;
    const t = setTimeout(() => setDraft((p) => (p.pending && p.pending.id === id ? answerCard(p, botVeto(p, teamOf(p, p.pending.target), p.pending)) : p)), ms(1200));
    return () => clearTimeout(t);
  }, [d.pending && d.pending.id, nv.runsBots]);

  // Announce card results.
  const logLen = (d.cardLog || []).length;
  const seenLog = useRef(logLen);
  useEffect(() => {
    if (logLen > seenLog.current) {
      const e = d.cardLog[logLen - 1];
      audio.play(e.result === 'done' ? 'card' : 'buzzer');
      audio.say(e.result === 'vetoed' ? callLine('vetoed') : e.result === 'done' ? callLine('card', { who: teamOf(d, e.by).name, card: CARD_INFO[e.card].name }) : '', 2, d.id + ':card:' + e.id);
      onFlash({ kind: 'card', card: e.card, result: e.result, text: e.detail, by: teamOf(d, e.by) });
    }
    seenLog.current = logLen;
  }, [logLen]);

  // Bots on your team give advice when a new item comes up.
  useEffect(() => {
    if (!nv.runsBots || flashing || d.bid || !item) return;
    const advisers = botAdvisers(d); if (!advisers.length) return;
    const a = advisers[d.reveal % advisers.length];
    const vis = visibleItem(d, item.id);
    if (assignSlot(a, vis, d.rules.slots) < 0) return;
    const { limit } = botLimit(d, a, vis, seeded(d.seed, 'adv', d.reveal));
    if (limit >= d.rules.minBid) talk.say(a, 'advise', { slot: money(limit) }); else talk.say(a, 'pass');
  }, [d.reveal, flashing]);

  // Auctioneer: new item, bids, bidding wars and the going-once countdown (it only follows the real state).
  useEffect(() => {
    if (flashing || !item || d.bid) return;
    const vis = visibleItem(d, item.id); const r = rarityOf(d, item.id);
    const line = vis.hidden ? callLine('mystery') : r === 'legendary' ? callLine('legendaryUp') + ' ' + callLine('next', { item: vis.name }) : callLine('next', { item: vis.name });
    if (r === 'legendary') audio.play('drumroll');
    audio.say(line, 1, d.id + ':next:' + d.reveal);
  }, [d.reveal, flashing]);
  const lastCall = useRef(0);
  useEffect(() => {
    if (!d.bid) return;
    audio.play('bid');
    const who = (leader && leader.name) || '';
    const amt = money(d.bid.amount);
    const leads = new Set(d.bids.filter(Boolean).map((b) => b.leaderId).concat(d.bid.leaderId)).size;
    if (d.bids.filter(Boolean).length === 0) { audio.say(callLine('open', { who, amt }), 1); lastCall.current = Date.now(); return; }
    if (d.bids.filter(Boolean).length >= 4 && leads >= 2 && audio.say(callLine('war'), 1, d.id + ':war:' + d.reveal)) { lastCall.current = Date.now(); return; }
    if (Date.now() - lastCall.current > 2200) { audio.say(callLine('raise', { who, amt }), 1); lastCall.current = Date.now(); }
  }, [bidKey]);
  useEffect(() => {
    if (!timer || !d.bid || hold || flashing || gavel) return;
    if (left === 2) audio.say(callLine('once'), 2, d.id + ':once:' + bidKey);
    if (left === 1) audio.say(callLine('twice'), 2, d.id + ':twice:' + bidKey);
  }, [left]);

  // Solo: a little pre-game talk, and the strategist grumbles about items it can't use.
  useEffect(() => {
    if (!nv.runsBots || flashing) return;
    if (d.processed === 0 && !d.bid) { const b = d.managers.filter(isBot); if (b.length) talk.say(b[Math.floor(Math.random() * b.length)].id, 'start', null, true); return; }
    const planner = d.managers.find((m) => isBot(m) && m.bot.type === 'needs' && !isFull(m) && item && assignSlot(m, item, d.rules.slots) < 0);
    if (planner) { const k = planner.team.findIndex((x) => !x); talk.say(planner.id, 'need', { slot: d.rules.slots[k] }); }
  }, [d.reveal, flashing]);

  if (!item) return null;
  const lc = leader ? leader.color : null;
  const showCard = !flashing;
  const thinker = thinking && d.managers.find((m) => m.id === thinking);
  const frozenTeam = d.managers.find((m) => frozenNow(d, m.id));
  const youAmt = you ? nextAmount(d) : 0;
  const youCan = you && !paused && !flashing && !gavel && canBid(d, you, youAmt);
  const youOutWhy = !you ? 'No team' : withdrawProblem(d, you.id);
  const outNames = outIds(d).map((id) => (teamOf(d, id) || {}).name).filter(Boolean);
  const going = timer > 0 && d.bid && left <= 2 && left > 0 ? (left === 2 ? 'Going once…' : 'Going twice…') : null;
  const ordered = auto ? [...d.managers].sort((a, b) => (nv.controls(b.id) ? 1 : 0) - (nv.controls(a.id) ? 1 : 0)) : d.managers;
  const vetoHere = d.pending && nv.controls(d.pending.target) && !(nv.runsBots && (isBot(teamOf(d, d.pending.target)) || isBotTeam(teamOf(d, d.pending.target)))) && !(solo && (isBot(teamOf(d, d.pending.target)) || isBotTeam(teamOf(d, d.pending.target))));
  return (
    <div className={'app auction' + (auto ? ' solo' : '')}>
      <div className="topbar">
        <button className="iconbtn" onClick={goHome} aria-label="Home">⌂</button>
        <div className="title num">Item {d.processed + 1} of {total}</div>
        <MuteButton />
        {ruleOn(d, 'chaos') && (!online || you) && <button className="pillbtn" onClick={() => setCardsOpen(true)} aria-label="Chaos Cards">🃏</button>}
        <button className="pillbtn" onClick={() => setTeams(true)}>Teams</button>
        {nv.isHost && !nv.tv && <button className="iconbtn" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Resume' : 'Pause'}>{paused ? '▶' : 'Ⅱ'}</button>}
      </div>
      <div className="progress"><div className="bar"><i style={{ width: (d.processed / Math.max(1, total)) * 100 + '%' }} /></div><span className="small muted num">{d.queue.length - 1} left</span></div>

      <div className="paused stack">
        {showCard ? <ItemCard key={d.reveal} item={item} d={d} /> : <div style={{ minHeight: 156 }} />}
        <div className={'bidbox' + (leader ? ' lead' : '')} style={lc ? { '--lc': lc } : null}>
          {timer > 0 && <span className={'timernum num' + (left <= 3 ? ' hot' : '')}>{Math.max(0, left)}</span>}
          <div key={bidKey} className={'amount num' + (leader ? ' pop' : '')}>{money(d.bid ? d.bid.amount : d.rules.minBid)}</div>
          <div className="leader" style={{ color: lc || 'var(--muted)' }}>{leader ? leader.emoji + ' ' + leader.name + ' leads' : timer > 0 && left <= 0 ? "Time's up · no bids" : auto ? 'Opening bid · bid or wait' : 'Opening bid · tap a manager'}</div>
          <div className="going" aria-live="polite">{d.pending ? '🛑 Waiting for a Veto answer…' : owe.length && timer > 0 && left <= 0 ? '⏳ Waiting for ' + owe.map((m) => m.name).join(', ') + ' to bid' : going || (thinker ? '💭 ' + thinker.name + ' is thinking…' : you && isOut(d, you.id) ? '✋ You’re out on this item' : frozenTeam ? '🧊 ' + frozenTeam.name + ' is frozen for this item' : outNames.length ? '✋ Out: ' + outNames.join(', ') : ' ')}</div>
          {timer > 0 && <span className="timer" style={{ width: (Math.max(0, left) / timer) * 100 + '%' }} />}
        </div>
        {paused && (
          <div className="pausecover">
            <div className="stack" style={{ alignItems: 'center' }}>
              <h2 className="display" style={{ fontSize: 56, color: 'var(--gold)' }}>Paused</h2>
              {nv.isHost ? <button className="btn btn-gold" style={{ width: 200 }} onClick={() => setPaused(false)}>Resume</button> : <p className="muted" style={{ margin: 0 }}>The host paused the game.</p>}
            </div>
          </div>
        )}
      </div>

      <div className="mgr-grid">
        {ordered.map((m) => (
          <ManagerButton key={m.id} d={d} m={m} disabledAll={hold || flashing || gavel} readOnly={(auto || nv.tv) && !nv.controls(m.id)}
            bubble={bubbles[m.id]} thinking={thinking === m.id}
            onBid={(amt) => { buzz(12); act('bid', m.id, amt); }}
            onOut={!auto && !nv.tv && !hold && !flashing && !gavel && !withdrawProblem(d, m.id) && !isOut(d, m.id) ? () => { buzz(12); act('withdraw', m.id); } : null}
            onCustom={() => setCustom(m.id)} />
        ))}
      </div>
      <p className="hint" style={{ textAlign: 'center' }}>{nv.tv ? (online ? 'Bid from your phones · it sells when the clock runs out' : timer ? 'Live auction · it sells when the clock runs out' : 'Live auction') : online && !you ? 'You’re watching this game.' : auto ? 'Tap Bid to raise +' + money(d.rules.inc) + ' · ✎ on your card for a custom bid · it sells when the clock runs out' : 'Tap to bid +' + money(d.rules.inc) + ' · hold or ✎ for a custom bid'}</p>

      {auto ? (you ? (
        <div className="actions duo">
          <button className="btn" disabled={hold || flashing || gavel || !!youOutWhy} title={youOutWhy || ''} onClick={() => { buzz(12); act('withdraw', you.id); }}>{you && isOut(d, you.id) ? 'You’re out' : 'I’m out'}</button>
          <button className="btn btn-gold sold" disabled={!youCan} onClick={() => { buzz(12); act('bid', you.id, youAmt); }}>
            {you && isOut(d, you.id) ? 'Out ✋' : you && isFull(you) ? 'Team full' : you && !canBid(d, you, youAmt) ? 'Can’t bid' : (d.bid && d.bid.leaderId === you.id ? 'Raise to ' : 'Bid ') + money(youAmt)}
          </button>
          {you && owesBid(d, you) && !hold && <p className="hint duo-note">Require every manager to bid is on: bid once before you can drop out.</p>}
          {you && isOut(d, you.id) && <p className="hint duo-note">You can’t bid again on this item{d.bid && d.bid.leaderId === you.id ? ', but your bid still stands' : ''}. You’re back in on the next one.</p>}
        </div>
      ) : null) : (
        <div className="actions">
          <button className="btn" onClick={() => setDraft((p) => undo(p))} disabled={hold || flashing || (!d.bid && !d.history.length)}>{undoLabel(d)}</button>
          <button className="btn" onClick={skip} disabled={hold || flashing || !!d.bid || owe.length > 0}>No bids</button>
          <button className="btn btn-gold sold" onClick={sold} disabled={hold || flashing || !d.bid || owe.length > 0}>Sold!</button>
        </div>
      )}
      {gavel && <div className="gavel" aria-hidden="true">🔨</div>}
      {custom && <CustomBid d={d} m={d.managers.find((x) => x.id === custom)} onSet={(n) => { buzz(12); act('bid', custom, n); }} onClose={() => setCustom(null)} />}
      {teams && <TeamsSheet d={d} onClose={() => setTeams(false)} />}
      {cardsOpen && <CardSheet d={d} by={auto && you ? you.id : null} onClose={() => setCardsOpen(false)}
        onPlay={(by, card, params) => act('card', by, card, params)}
        onDouble={(by, pay) => { buzz(20); act('bid', by, pay, true); }} />}
      {vetoHere && <VetoSheet d={d} onAnswer={(v) => act('veto', v, d.pending.id)} />}
    </div>
  );
}

/* ============================================================
   NOMINATION
   ============================================================ */
function Nominate({ d, setDraft, goHome }) {
  const [q, setQ] = useState('');
  const [pick, setPick] = useState(null);
  const [teams, setTeams] = useState(false);
  const [paused, setPaused] = useState(false);
  const cur = currentNominator(d);
  const solo = d.mode === 'solo';
  const nv = netView(d, useNet()); const act = useAct(d, setDraft);
  const isBotTurn = !!(cur && (solo || nv.online) && (isBot(cur.m) || isBotTeam(cur.m)));
  const botTurn = isBotTurn && nv.runsBots;
  const canPick = !!cur && !isBotTurn && nv.controls(cur.m.id);
  const talk = useBotTalk(d);
  const live = useRef({}); live.current = { d, paused };
  useEffect(() => {
    if (!botTurn || paused) return undefined;
    const actor = botActors(d).find((a) => a.id === cur.m.id);
    const id = actor && botNominate(d, actor);
    if (!id) return undefined;
    const reveal = d.reveal;
    const t = setTimeout(() => { if (live.current.paused || live.current.d.reveal !== reveal) return; setDraft((p) => (p.reveal === reveal ? nominate(p, id) : p)); talk.say(actor, 'nominate'); }, ms(1300));
    return () => clearTimeout(t);
  }, [d.reveal, botTurn, paused]);
  if (!cur) return null;
  const pool = nominationPool(d).map((id) => visibleItem(d, id));
  const shown = pool.filter((it) => !q.trim() || (it.name + ' ' + (it.pos || '') + ' ' + (it.desc || '')).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="app">
      <div className="topbar">
        <button className="iconbtn" onClick={goHome} aria-label="Home">⌂</button>
        <MuteButton />
        <div className="title">Nomination · {d.processed + 1} of {d.processed + d.queue.length}</div>
        <button className="pillbtn" onClick={() => setTeams(true)}>Teams</button>
        {(solo || (nv.online && nv.isHost)) && <button className="iconbtn" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Resume' : 'Pause'}>{paused ? '▶' : 'Ⅱ'}</button>}
      </div>
      <div className="picker" style={mStyle(cur.m)}>
        <p className="eyebrow">Nominating</p>
        <h2 className="display" style={{ fontSize: 40 }}>{cur.m.emoji} {cur.m.name}</h2>
        <p className="small" style={{ margin: 0 }}>{isBotTurn ? (paused ? 'Paused' : '💭 Choosing what goes up next…') : canPick ? 'Pick the next item to auction.' : 'Waiting for ' + cur.m.name + ' to pick…'}</p>
      </div>
      {Object.entries(talk.bubbles).map(([id, bb]) => <p key={bb.id} className="bubble inline">{bb.text}</p>)}
      {canPick && <TopicSearch q={q} setQ={setQ} />}
      <div className="pickgrid">
        {shown.map((it) => { const r = rarityOf(d, it.id); return (
          <button key={it.id} className="pickbtn" disabled={!canPick} onClick={() => setPick(it.id)}>
            {it.hidden ? <span className="thumb" style={{ background: '#2c2659', color: '#c9a6ff', fontSize: 24 }}>?</span> : <Thumb item={it} topic={d.topic} />}
            <span className="grow" style={{ minWidth: 0 }}><b style={{ display: 'block' }}>{it.name} {it.pos && <span className="pos">{it.pos}</span>} <RarityTag r={r} /></b><span className="small muted">{it.desc}</span></span>
          </button>
        ); })}
        {!shown.length && <p className="muted">Nothing matches “{q}”.</p>}
      </div>
      {pick && (
        <Confirm title="Nominate this?" body={visibleItem(d, pick).name + ' goes up for auction next.'} yes="Nominate"
          onYes={() => act('nominate', pick)} onClose={() => setPick(null)} />
      )}
      {teams && <TeamsSheet d={d} onClose={() => setTeams(false)} />}
    </div>
  );
}

/* ============================================================
   TRADE WINDOW
   ============================================================ */
function tradeText(d, t) {
  const A = teamOf(d, t.from), B = teamOf(d, t.to);
  const m = t.money && t.money.amount ? ' + ' + money(t.money.amount) + ' from ' + teamOf(d, t.money.payer).name : '';
  return A.name + ' gives ' + d.items[t.give].name + ' ↔ ' + B.name + ' gives ' + d.items[t.get].name + m;
}
function TradeWindow({ d, setDraft, goHome }) {
  const solo = d.mode === 'solo';
  const nv = netView(d, useNet()); const act = useAct(d, setDraft); const online = nv.online;
  const you = solo ? d.managers.find((m) => m.human) : online ? d.managers.find((m) => nv.controls(m.id)) : null;
  const [now, setNow] = useState(Date.now());
  const [from, setFrom] = useState(you ? you.id : null);
  const [to, setTo] = useState(null);
  const [give, setGive] = useState(null);
  const [get, setGet] = useState(null);
  const [payer, setPayer] = useState(null);
  const [amount, setAmount] = useState(0);
  const [handoff, setHandoff] = useState(null); // local: confirm the receiving team has the phone
  const [msg, setMsg] = useState('');
  const left = Math.max(0, d.trade.endsAt - now);
  const nOffers = d.trade.proposals.length, nDone = d.trade.proposals.filter((x) => x.status === 'accepted').length;
  useEffect(() => { if (nOffers) { audio.play('bid'); audio.say(callLine('tradeOffer'), 1, d.id + ':offer:' + nOffers); } }, [nOffers]);
  useEffect(() => { if (nDone) { audio.play('trade'); audio.say(callLine('tradeDone'), 2, d.id + ':deal:' + nDone); } }, [nDone]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms(1000)); return () => clearInterval(t); }, []);
  useEffect(() => { if (left <= 0 && nv.isHost) setDraft((p) => closeTrades(p)); }, [left <= 0, nv.isHost]);
  // Solo: bot teams make at most one offer each when the window opens…
  const offered = useRef(false);
  useEffect(() => {
    if (!nv.runsBots || offered.current) return undefined;
    offered.current = true;
    const timers = botActors(d).filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i).map((a, i) => setTimeout(() => setDraft((p) => {
      if (p.phase !== 'trade') return p;
      const actor = botActors(p).find((x) => x.speaker === a.speaker); const offer = actor && botTradeOffer(p, actor);
      return offer ? proposeTrade(p, offer) : p;
    }), ms(2500 + i * 2200)));
    return () => timers.forEach(clearTimeout);
  }, []);
  // …and answer offers made to them after a short think.
  const pendingForBots = d.trade.proposals.filter((t) => t.status === 'pending' && nv.runsBots && (isBot(teamOf(d, t.to)) || isBotTeam(teamOf(d, t.to)))).map((t) => t.id).join(',');
  useEffect(() => {
    if (!pendingForBots) return undefined;
    const ids = pendingForBots.split(',');
    const t = setTimeout(() => setDraft((p) => {
      let n = p;
      ids.forEach((id) => {
        const tr = n.trade.proposals.find((x) => x.id === id); if (!tr || tr.status !== 'pending') return;
        const actor = botActors(n).find((a) => a.id === tr.to); if (!actor) return;
        const ans = botTradeDecision(n, actor, tr);
        n = ans.accept ? acceptTrade(n, id) : setTradeStatus(rejectTrade(n, id), id, 'rejected', ans.reason);
        if (ans.accept) n = setTradeStatus(n, id, n.trade.proposals.find((x) => x.id === id).status, ans.reason);
      });
      return n;
    }), ms(1600));
    return () => clearTimeout(t);
  }, [pendingForBots]);

  const A = from && teamOf(d, from), B = to && teamOf(d, to);
  const draftTrade = { from, to, give, get, money: d.rules.trades.money && amount > 0 && payer ? { payer, amount } : null };
  const problem = from && to && give && get ? tradeProblem(d, draftTrade, now) : null;
  const propose = () => { if (problem || proposeTrade(d, draftTrade, now) === d) { setMsg(problem || 'That trade can’t be offered.'); return; } act('propose', draftTrade); setGive(null); setGet(null); setAmount(0); setMsg('Offer sent to ' + B.name + '.'); };
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
  const list = [...d.trade.proposals].reverse();
  const canAnswer = (t) => t.status === 'pending' && (online ? nv.controls(t.to) : (!solo || (you && t.to === you.id)));
  const canCancel = (t) => t.status === 'pending' && (online ? nv.controls(t.from) : (!solo || (you && t.from === you.id)));
  return (
    <div className="app">
      <div className="topbar">
        <button className="iconbtn" onClick={goHome} aria-label="Home">⌂</button>
        <MuteButton />
        <div className="title">Trade window</div>
        <span className={'tclock num' + (left < 30000 ? ' hot' : '')} aria-live="polite">{mm}:{String(ss).padStart(2, '0')}</span>
      </div>
      <p className="hint" style={{ textAlign: 'center' }}>1-for-1 trades{d.rules.trades.money ? ', plus optional money' : ''}. The other team must accept. Anything not accepted when the clock hits 0:00 expires.</p>
      {(!online || you) && <div className="card stack">
        <h3>Offer a trade</h3>
        {!solo && !online && <div className="field"><span className="label">Your team</span><div className="chips">{d.managers.map((m) => <button key={m.id} className={'pickchip' + (from === m.id ? ' on' : '')} style={mStyle(m)} onClick={() => { setFrom(m.id); setGive(null); if (to === m.id) setTo(null); }}>{m.emoji} {m.name}</button>)}</div></div>}
        {A && <div className="field"><span className="label">Trade with</span><div className="chips">{d.managers.filter((m) => m.id !== from).map((m) => <button key={m.id} className={'pickchip' + (to === m.id ? ' on' : '')} style={mStyle(m)} onClick={() => { setTo(m.id); setGet(null); }}>{m.emoji} {m.name}</button>)}</div></div>}
        {A && B && (
          <div className="tradecols">
            <div className="field"><span className="label">You give</span><div className="stack-sm">{A.team.filter(Boolean).map((t) => <button key={t.itemId} className={'pickbtn small' + (give === t.itemId ? ' on' : '')} onClick={() => setGive(t.itemId)}><Thumb item={d.items[t.itemId]} topic={d.topic} size={34} /><span className="grow">{d.items[t.itemId].name}</span></button>)}</div></div>
            <div className="field"><span className="label">You get</span><div className="stack-sm">{B.team.filter(Boolean).map((t) => <button key={t.itemId} className={'pickbtn small' + (get === t.itemId ? ' on' : '')} onClick={() => setGet(t.itemId)}><Thumb item={d.items[t.itemId]} topic={d.topic} size={34} /><span className="grow">{d.items[t.itemId].name}</span></button>)}</div></div>
          </div>
        )}
        {A && B && d.rules.trades.money && (
          <div className="field"><span className="label">Add money (optional)</span>
            <Seg label="Who pays" value={payer || 'none'} options={[['none', 'No money'], [A.id, A.name + ' pays'], [B.id, B.name + ' pays']]} onChange={(v) => { setPayer(v === 'none' ? null : v); if (v === 'none') setAmount(0); else setAmount(Math.min(Math.max(1, amount), teamOf(d, v).budget)); }} />
            {payer && <Stepper id="trade-money" prefix="$" value={amount} min={1} max={Math.max(1, teamOf(d, payer).budget)} onChange={setAmount} />}
          </div>
        )}
        {give && get && <p className="summary">{tradeText(d, { ...draftTrade, money: draftTrade.money })}</p>}
        {problem && <p className="warn">{problem}</p>}
        {msg && <p className="hint" style={{ color: 'var(--ok)' }}>{msg}</p>}
        <button className="btn btn-gold" disabled={!(give && get) || !!problem} onClick={propose}>Offer trade</button>
      </div>}
      <div className="stack-sm">
        <h3>Offers</h3>
        {!list.length && <p className="hint">No offers yet.</p>}
        {list.map((t) => (
          <div key={t.id} className={'trow ' + t.status}>
            <span className="tstat">{{ pending: '⏳ Waiting', accepted: '✅ Done', rejected: '❌ Rejected', cancelled: '↩️ Cancelled', expired: '⌛ Expired', invalid: '⚠️ No longer valid' }[t.status]}</span>
            <span className="small">{tradeText(d, t)}</span>
            {t.note && <span className="small muted">“{t.note}”</span>}
            {(canAnswer(t) || canCancel(t)) && (
              <div className="row">
                {canAnswer(t) && <button className="btn btn-sm btn-gold grow" onClick={() => (solo || online ? act('accept', t.id) : setHandoff(t.id))}>Accept</button>}
                {canAnswer(t) && <button className="btn btn-sm grow" onClick={() => act('reject', t.id)}>Reject</button>}
                {canCancel(t) && <button className="btn btn-sm btn-ghost grow" onClick={() => act('cancel', t.id)}>Cancel offer</button>}
              </div>
            )}
          </div>
        ))}
      </div>
      <details className="card"><summary className="label">Rosters</summary><div className="stack" style={{ marginTop: 10 }}>{d.managers.map((m) => <div key={m.id} className="tteam" style={mStyle(m)}><h3>{m.emoji} {m.name} · {money(m.budget)}</h3><TeamList d={d} m={m} /></div>)}</div></details>
      {nv.isHost ? <button className="btn" onClick={() => setDraft((p) => closeTrades(p))}>Finish trading · go to voting</button> : <p className="hint" style={{ textAlign: 'center' }}>The host can end trading early.</p>}
      {handoff && (() => { const t = d.trade.proposals.find((x) => x.id === handoff); if (!t) return null; const R = teamOf(d, t.to); return (
        <Sheet center onClose={() => setHandoff(null)}>
          <p className="eyebrow">Pass the phone to</p>
          <h2 className="display" style={{ fontSize: 34, color: R.color }}>{R.emoji} {R.name}</h2>
          <p className="summary">{tradeText(d, t)}</p>
          <div className="row pin">
            <button className="btn grow" onClick={() => { act('reject', t.id); setHandoff(null); }}>Reject</button>
            <button className="btn btn-gold grow" onClick={() => { act('accept', t.id); setHandoff(null); }}>Accept trade</button>
          </div>
        </Sheet>
      ); })()}
    </div>
  );
}

/* ============================================================
   FREE PICKS (snake order)
   ============================================================ */
function FreePick({ d, setDraft, goHome, flashing, onFlash }) {
  const [teams, setTeams] = useState(false);
  const [paused, setPaused] = useState(false);
  const talk = useBotTalk(d);
  const cp = currentPicker(d);
  const m = cp && cp.m;
  const nv = netView(d, useNet()); const act = useAct(d, setDraft);
  const isBotTurn = !!(m && (d.mode === 'solo' || nv.online) && (isBot(m) || isBotTeam(m)));
  const botTurn = isBotTurn && nv.runsBots;
  const canPick = !!m && !isBotTurn && nv.controls(m.id);
  const live = useRef({}); live.current = { d, flashing, paused };
  const pick = (id) => {
    if (flashing || !m) return;
    if (nv.online && !nv.isHost) { act('freePick', id); return; }
    onFlash({ kind: 'free', name: m.name, emoji: m.emoji, color: m.color, item: d.items[id].name });
    setDraft((p) => freePick(p, id));
  };
  // Solo: bots take their free pick after a short pause.
  const turnKey = d.reveal + ':' + (m ? m.id : '');
  useEffect(() => {
    if (!botTurn || flashing || paused) return undefined;
    const choice = botFreePickChoice(d, isBot(m) ? m : (botActors(d).find((a) => a.id === m.id) || m));
    if (!choice) return undefined;
    const t = setTimeout(() => {
      const cur = live.current;
      if (cur.flashing || cur.paused || (cur.d.reveal + ':' + ((currentPicker(cur.d) || {}).m || {}).id) !== turnKey) return;
      pick(choice);
      talk.later(ms(1900), () => talk.say(m.id, 'free'));
    }, ms(1100));
    return () => clearTimeout(t);
  }, [turnKey, flashing, paused, botTurn]);
  if (!cp) return null;
  const avail = d.leftover.filter((id) => canTake(d, m, id));
  return (
    <div className="app">
      <div className="topbar">
        <button className="iconbtn" onClick={goHome} aria-label="Home">⌂</button>
        <MuteButton />
        <div className="title">Free picks · round {cp.round + 1}</div>
        <button className="pillbtn" onClick={() => setTeams(true)}>Teams</button>
        {(d.mode === 'solo' || (nv.online && nv.isHost)) && <button className="iconbtn" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Resume' : 'Pause'}>{paused ? '▶' : 'Ⅱ'}</button>}
      </div>
      <p className="hint" style={{ textAlign: 'center' }}>The auction is over and some teams still have empty slots. Leftovers are free, picked in snake order.</p>
      <div className="picker" style={mStyle(m)}>
        <p className="eyebrow">On the clock</p>
        <h2 className="display" style={{ fontSize: 48 }}>{m.emoji} {m.name}</h2>
        <p className="small" style={{ margin: 0 }}>{emptyCount(m)} empty slot{emptyCount(m) === 1 ? '' : 's'} · {money(m.budget)} left</p>
        {isBotTurn && <p className="going" style={{ margin: '6px 0 0' }}>{paused ? 'Paused' : '💭 Picking…'}</p>}
        {!isBotTurn && !canPick && <p className="going" style={{ margin: '6px 0 0' }}>Waiting for {m.name} to pick…</p>}
      </div>
      {Object.entries(talk.bubbles).map(([id, bb]) => { const who = d.managers.find((x) => x.id === id); return who ? <p key={bb.id} className="bubble inline" style={mStyle(who)}><b>{who.emoji} {who.name}:</b> {bb.text}</p> : null; })}
      <div className="pickgrid">
        {avail.map((id) => { const it = d.items[id]; return (
          <button key={id} className="pickbtn" onClick={() => pick(id)} disabled={flashing || !canPick}>
            <Thumb item={it} topic={d.topic} />
            <span className="grow" style={{ minWidth: 0 }}><b style={{ display: 'block' }}>{it.name} {it.pos && <span className="pos">{it.pos}</span>}</b><span className="small muted">{it.desc}</span></span>
            <span style={{ fontFamily: 'var(--display)', color: 'var(--ok)', fontSize: 18 }}>FREE</span>
          </button>
        ); })}
      </div>
      {d.mode === 'local' && <button className="btn" onClick={() => setDraft((p) => undo(p))} disabled={!d.history.length || flashing}>{undoLabel(d)}</button>}
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
        <span className="nm">{m.name}{m.members ? <small className="memline">{m.members.map((p) => p.name).join(' · ')}</small> : null}</span>
        <span className="mo">spent<b className="num">{money(spent(d, m))}</b></span>
        <span className="mo">left<b className="num">{money(m.budget)}</b></span>
      </div>
      <div className="tb">{d.topic.layout === 'pitch' ? <Pitch d={d} m={m} /> : <TeamList d={d} m={m} />}<TeamRatingPanel d={d} m={m} /></div>
    </div>
  );
}

function Confetti({ colors }) {
  const ref = useRef(null);
  useEffect(() => {
    if (reducedMotion()) return undefined;
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

const hasVoted = (d, id) => Object.prototype.hasOwnProperty.call(d.votes || {}, id);

// Secret vote. Local: pass the phone, everyone votes. Solo: you vote, then the bots vote.
function Voting({ d, onVote, onReveal, onClose, onSoloVote, nv, act }) {
  const online = !!(nv && nv.online);
  const solo = d.mode === 'solo' || online;
  const people = participants(d);
  const you = online ? people.find((p) => nv.controlsPart(p.id) && !hasVoted(d, p.id)) : solo ? people.find((p) => p.human) : null;
  const [voter, setVoter] = useState(solo && you ? you.id : null);
  const [choice, setChoice] = useState(null);
  const [locked, setLocked] = useState(false);
  const voted = Object.keys(d.votes || {}).length;
  if (locked) return (
    <Sheet center onClose={() => {}}>
      <h2 className="display" style={{ fontSize: 40, textAlign: 'center' }}>Vote locked 🔒</h2>
      {online ? <>
          <p className="muted" style={{ textAlign: 'center', margin: 0 }}>Waiting for everyone else. The host reveals the winner.</p>
          <button className="btn" onClick={onClose}>OK</button>
        </> : solo ? <p className="muted" style={{ textAlign: 'center', margin: 0 }}>🤖 The bots are voting…</p>
        : <>
          <p className="muted" style={{ textAlign: 'center', margin: 0 }}>Pass the phone to the next manager.</p>
          <button className="btn btn-gold" onClick={() => { setLocked(false); setVoter(null); setChoice(null); }}>Next voter</button>
        </>}
    </Sheet>
  );
  if (voter) {
    const v = people.find((p) => p.id === voter);
    const choices = voteChoices(d, v.teamId);
    const submit = (target) => {
      buzz(30);
      if (online) { act('vote', voter, target); setLocked(true); } else if (solo) { setLocked(true); onSoloVote(target); } else { onVote(voter, target); setLocked(true); }
    };
    return (
      <Sheet center onClose={() => { if (solo) onClose(); else { setVoter(null); setChoice(null); } }}>
        <p className="eyebrow">Secret vote</p>
        <h2 className="display" style={{ fontSize: 32, color: v.color }}>{v.emoji} {v.name}, pick the best team</h2>
        {v.teamName && <p className="eyebrow" style={{ color: v.color }}>Playing for {v.teamName}</p>}
        {choices.length ? <p className="hint">You can't vote for your own team.</p> : <p className="hint">There's no other team with players to vote for, so you can skip your vote.</p>}
        <div className="stack-sm">
          {choices.map((m) => (
            <button key={m.id} className="votebtn" style={{ ...mStyle(m), alignItems: 'stretch', textAlign: 'left' }} aria-pressed={choice === m.id} onClick={() => setChoice(m.id)}>
              <span>{m.emoji} {m.name}{isBot(m) ? <small style={{ fontFamily: 'var(--body)', fontWeight: 600, opacity: 0.8 }}> · {BOT_TYPES[m.bot.type].label}</small> : null}</span>
              <span className="teamtxt">{m.team.filter(Boolean).map((t) => d.items[t.itemId].name).join(', ')}</span>
            </button>
          ))}
        </div>
        <div className="row pin">
          <button type="button" className="btn btn-ghost grow" onClick={() => { if (solo) onClose(); else { setVoter(null); setChoice(null); } }}>Back</button>
          {choices.length
            ? <button type="button" className="btn btn-gold grow" disabled={!choice} onClick={() => { if (choice) submit(choice); }}>{choice ? 'Lock in ' + d.managers.find((m) => m.id === choice).name : 'Pick a team'}</button>
            : <button type="button" className="btn btn-gold grow" onClick={() => submit(null)}>Skip my vote</button>}
        </div>
      </Sheet>
    );
  }
  return (
    <Sheet center onClose={onClose}>
      <p className="eyebrow">Secret vote · {voted} of {people.length} in</p>
      <h2 className="display" style={{ fontSize: 34 }}>Pass the phone around</h2>
      <p className="hint">Each manager taps their own name, then votes in private. Votes stay hidden until the reveal.</p>
      <div className="votegrid">
        {people.map((m) => { const done = hasVoted(d, m.id); return (
          <button key={m.id} className="votebtn" style={mStyle(m)} disabled={done} onClick={() => setVoter(m.id)}>
            <span style={{ fontSize: 24 }}>{done ? '✅' : m.emoji}</span>{m.name}{m.teamName ? <small style={{ fontFamily: 'var(--body)', fontWeight: 600, opacity: 0.8 }}>{m.teamName}</small> : null}
          </button>
        ); })}
      </div>
      <div className="row pin">
        <button type="button" className="btn btn-ghost" style={{ width: 'auto' }} onClick={onClose}>Close</button>
        <button type="button" className="btn btn-gold grow" disabled={!voted} onClick={onReveal}>{voted === people.length ? 'Reveal winner' : 'Reveal (' + voted + '/' + people.length + ')'}</button>
      </div>
    </Sheet>
  );
}

// Purpose-built picture layouts for the group chat (rendered off-screen, then captured).
function ExportCard({ d, kind, showShame }) {
  const { counts, winners } = tally(d);
  const ranked = [...d.managers].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
  const head = <div className="exhead"><span className="tag"><i />$20 AUCTION</span><b>DRAFT NIGHT</b><span>{d.topic.emoji} {d.topic.name} · {new Date(d.createdAt).toLocaleDateString()}</span></div>;
  if (kind === 'winner') {
    const w = winners[0];
    return (
      <>
        {head}
        <div className="exwin" style={mStyle(w)}>
          <span className="exlabel">{winners.length > 1 ? 'JOINT CHAMPIONS' : 'CHAMPION'}</span>
          <span className="exname">{winners.map((x) => x.emoji + ' ' + x.name).join(' & ')}</span>
          {w.members && <span className="exmem">{w.members.map((p) => p.name).join(' · ')}</span>}
          <span className="exvotes">{d.finale && d.finale.champion ? (needsMatch(d.finale.mode) ? 'Won the knockout' : 'Won the bracket') + (isFootball(d.topic) ? ' · rating ' + teamRating(d, w).rating : '') : counts[w.id] + ' vote' + (counts[w.id] === 1 ? '' : 's')} · {money(d.rules.budget - w.budget)} spent · {money(w.budget)} left</span>
        </div>
        <div className="exroster">
          {d.rules.slots.map((sl, i) => { const t = w.team[i]; const it = t && d.items[t.itemId]; const r = t && rarityOf(d, t.itemId); return (
            <div key={i} className="exrow">
              <span className="exslot">{sl}</span>
              {it ? <ItemArt item={it} topic={d.topic} size={40} radius={8} /> : <span style={{ width: 40 }} />}
              <span className="exitem">{it ? it.name : 'Empty'}{r && r !== 'common' ? <span className={'rmark ' + r}> {r === 'legendary' ? '★' : '◆'}</span> : null}</span>
              <span className="exprice">{t ? (t.free ? 'FREE' : money(t.price)) : ''}</span>
            </div>
          ); })}
        </div>
      </>
    );
  }
  const awards = computeAwards(d); const shame = showShame ? computeShame(d) : [];
  if (d.finale && d.finale.champion) return (
    <>
      {head}
      <div className="board">
        <h3>🏆 Final standings</h3>
        {finaleStandings(d).map((s, i) => <div key={s.team.id} className="brow" style={mStyle(s.team)}><span className="rk num">{i + 1}</span><span className="bn">{s.team.emoji} {s.team.name}</span><span className="bw" style={{ fontSize: 15 }}>{s.label}{isFootball(d.topic) ? ' · ' + teamRating(d, s.team).rating : ''}</span></div>)}
      </div>
      {awards.length > 0 && <div className="board"><h3>🎖️ Awards</h3>{awards.map((a, i) => <p key={a.id + i} className="award"><b>{a.emoji} {a.title}: {a.team}</b><br /><span className="small">{a.why}</span></p>)}</div>}
      {shame.length > 0 && <div className="board"><h3>🙈 Hall of Shame</h3>{shame.map((a) => <p key={a.id} className="award"><b>{a.emoji} {a.title}: {a.team}</b><br /><span className="small">{a.item} for {money(a.price)}. {a.why}</span></p>)}</div>}
      <p className="exportfoot">DRAFT NIGHT · {(location.host + location.pathname).replace(/\/(index\.html)?$/, '')}</p>
    </>
  );
  return (
    <>
      {head}
      <div className="board">
        <h3>{d.votesRevealed ? '🗳️ Final standings' : '💰 Teams'}</h3>
        {ranked.map((m, i) => <div key={m.id} className="brow" style={mStyle(m)}><span className="rk num">{d.votesRevealed ? i + 1 : ''}</span><span className="bn">{m.emoji} {m.name}</span><span className="bw num" style={{ fontSize: 18 }}>{d.votesRevealed ? (counts[m.id] || 0) + ' votes' : money(d.rules.budget - m.budget)}</span></div>)}
      </div>
      {awards.length > 0 && <div className="board"><h3>🎖️ Awards</h3>{awards.map((a, i) => <p key={a.id + i} className="award"><b>{a.emoji} {a.title}: {a.team}</b><br /><span className="small">{a.why}</span></p>)}</div>}
      {shame.length > 0 && <div className="board"><h3>🙈 Hall of Shame</h3>{shame.map((a) => <p key={a.id} className="award"><b>{a.emoji} {a.title}: {a.team}</b><br /><span className="small">{a.item} for {money(a.price)}. {a.why}</span></p>)}</div>}
      <p className="exportfoot">DRAFT NIGHT · {(location.host + location.pathname).replace(/\/(index\.html)?$/, '')}</p>
    </>
  );
}

function Results({ d, past, onChange, onBack, onUndo, onFinish, onPlayAgain, live, showShame }) {
  const ref = useRef(null);
  const nv = netView(d, useNet()); const act = useAct(d, onChange); const online = nv.online;
  const [finClosed, setFinClosed] = useState(false);
  const [voting, setVoting] = useState(false);
  const [img, setImg] = useState(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [imgErr, setImgErr] = useState('');
  const [party, setParty] = useState(0);
  const [showFinale, setShowFinale] = useState(false);
  const [friendly, setFriendly] = useState(false);
  const [viewMatch, setViewMatch] = useState(null);
  const fmode = d.finale ? d.finale.mode : finaleMode(d);
  const isFin = fmode !== 'vote';
  const finDone = !!(d.finale && d.finale.champion);
  const stats = useMemo(() => draftStats(d), [d]);
  const { counts, winners } = tally(d);
  const revealed = d.votesRevealed && winners.length > 0;
  const noVotes = d.votesRevealed && !winners.length;
  const solo = d.mode === 'solo';
  const people = participants(d); const humansP = people.filter((p) => !p.bot);
  const humanVotes = humansP.filter((p) => hasVoted(d, p.id)).length;
  const myOpenVote = online && !d.votesRevealed ? people.find((p) => nv.controlsPart(p.id) && !hasVoted(d, p.id)) : null;
  const hostReveal = () => { onChange({ ...fillBotVotes(d), votesRevealed: true }); doReveal(); };
  const doReveal = () => {
    setVoting(false); audio.play('drumroll');
    setTimeout(() => { setParty((x) => x + 1); buzz([60, 40, 60, 40, 200]); audio.play('fanfare'); setTimeout(() => audio.play('cheer'), 400); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 1100);
  };
  const finStage = d.finale ? (d.finale.ui || {}).stage || 'overview' : null;
  const finaleOpen = !!d.finale && (online ? finStage !== 'done' && !finClosed : showFinale);
  // Other phones get the confetti and fanfare when the host reveals the winner.
  const revealKey = d.finale ? finStage === 'done' : revealed;
  const seenReveal = useRef(revealKey);
  useEffect(() => { if (revealKey && !seenReveal.current && !nv.isHost) doReveal(); seenReveal.current = revealKey; }, [revealKey]);
  useEffect(() => { setFinClosed(false); }, [finStage]);
  useEffect(() => {
    if (!revealed || finaleOpen) return;
    if (finDone) { audio.say(callLine('champion', { who: winners[0].name }), 3, d.id + ':champion'); return; }
    audio.say(winners.length > 1 ? callLine('tie', { who: winners.map((w) => w.name).join(' and ') }) : callLine('winner', { who: winners[0].name }), 3, d.id + ':winner:' + Object.keys(d.votes || {}).length);
  }, [revealed, finaleOpen]);
  const openFinale = () => { if (!d.finale) onChange(startFinale(d)); setShowFinale(true); setFinClosed(false); };
  // Solo: your vote, then every bot votes for the team it rates highest (never its own), all revealed together.
  const soloVote = (target) => {
    setTimeout(() => {
      const votes = { ...(d.votes || {}) };
      const people = participants(d);
      const you = people.find((p) => p.human);
      if (you && !hasVoted(d, you.id)) votes[you.id] = target;
      // Each bot player votes for the team it rates highest, never its own team.
      people.filter((p) => p.bot).forEach((p) => {
        if (Object.prototype.hasOwnProperty.call(votes, p.id)) return;
        votes[p.id] = botVote(d, { ...teamOf(d, p.teamId), name: p.name, bot: p.bot, speaker: p.id, teamId: p.teamId });
      });
      onChange({ ...d, votes, votesRevealed: true });
      doReveal();
    }, ms(1400));
  };
  const winIds = revealed ? winners.map((w) => w.id) : [];
  const ordered = revealed ? [...d.managers].sort((a, b) => counts[b.id] - counts[a.id]) : d.managers;
  const stageRef = useRef(null);
  const [exportKind, setExportKind] = useState(null); // 'winner' | 'awards' while rendering off-screen
  const [pickFormat, setPickFormat] = useState(false);
  // Wait until every picture in the node has loaded (or failed and fallen back) before capturing.
  const imagesReady = async (node) => {
    const imgs = [...node.querySelectorAll('img')];
    await Promise.all(imgs.map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.addEventListener('load', r, { once: true }); im.addEventListener('error', r, { once: true }); setTimeout(r, 6000); }))));
  };
  const makeImage = async (kind) => {
    setPickFormat(false);
    if (kind === 'full') return exportImg(ref.current, 'results');
    setExportKind(kind);
  };
  useEffect(() => {
    if (!exportKind || !stageRef.current) return;
    const node = stageRef.current;
    (async () => { await imagesReady(node); await exportImg(node, exportKind); setExportKind(null); })();
  }, [exportKind]);
  const exportImg = async (node, kind) => {
    setImgBusy(true); setImgErr('');
    try {
      if (!window.html2canvas) throw new Error('missing');
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
      await imagesReady(node);
      const canvas = await window.html2canvas(node, { backgroundColor: '#0f0c21', scale: Math.min(3, Math.max(2, window.devicePixelRatio || 2)), useCORS: true, allowTaint: false, logging: false, imageTimeout: 8000 });
      const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('empty'))), 'image/png'));
      const slug = (d.topic.name || 'draft').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
      setImg({ url: URL.createObjectURL(blob), blob, name: 'draft-night-' + slug + '-' + (kind || 'results') + '-' + todayStamp() + '.png' });
    } catch (e) { setImgErr("The image couldn't be made. Try again, and if it keeps failing, take a screenshot instead."); }
    setImgBusy(false);
  };
  const closeImg = () => { if (img) URL.revokeObjectURL(img.url); setImg(null); setImgNote(''); };
  const [imgNote, setImgNote] = useState('');
  const doShare = async () => { const r = await shareFile(img.blob, img.name, 'Draft Night results'); if (r === 'unsupported') setImgNote("Sharing isn't available here. Use Download, or press and hold the picture."); };
  const doDownload = () => { downloadBlob(img.blob, img.name); setImgNote(isIOS() ? 'On iPhone, check the Downloads folder in the Files app. To put it in Photos, press and hold the picture instead.' : 'Saved to your downloads.'); };
  return (
    <div className="app">
      <TopBar onBack={onBack} backLabel="⌂" title="Results" right={live && onUndo && d.history.length && !d.votesRevealed && !d.finale ? <button className="pillbtn" onClick={onUndo}>Undo</button> : <MuteButton />} />
      <div ref={ref} className="resultwrap">
        <div className="rhead">
          <p className="eyebrow">{d.topic.emoji} {d.topic.name} · {new Date(d.createdAt).toLocaleDateString()}</p>
          <h2 className="display" style={{ fontSize: 46 }}>{finDone ? 'Champions!' : revealed ? 'We have a winner' : 'Final teams'}</h2>
        </div>
        {finDone && <FinaleResults d={d} onOpen={setViewMatch} />}
        {noVotes && <div className="card"><b>No votes were cast</b><p className="hint" style={{ margin: '4px 0 0' }}>Nobody had a team they could vote for, so there's no winner this time.</p></div>}
        {revealed && !finDone && (
          <div className="winner">
            <p className="eyebrow" style={{ color: 'var(--gold-ink)' }}>Best team · {counts[winners[0].id]} vote{counts[winners[0].id] === 1 ? '' : 's'}</p>
            <div className="display">{winners.map((w) => w.emoji + ' ' + w.name).join(' & ')}</div>
            {winners.length > 1 && <p className="small" style={{ margin: 0, fontWeight: 700 }}>It's a tie!</p>}
            {solo && winners.some((w) => w.human) && <p className="small" style={{ margin: '4px 0 0', fontWeight: 700 }}>You beat the bots!</p>}
          </div>
        )}
        {ordered.map((m) => <TeamCard key={m.id} d={d} m={m} win={winIds.includes(m.id)} />)}
        <div className="stat-grid">
          <div className="stat"><span className="k">Most expensive</span>{stats.expensive ? <><span className="v num">{money(stats.expensive.price)}</span><span className="d">{stats.expensive.item.name} · {stats.expensive.m.name}</span></> : <span className="d muted">No sales</span>}</div>
          <div className="stat"><span className="k">Biggest bargain</span>{stats.bargain ? <><span className="v num">{money(stats.bargain.price)}</span><span className="d">{stats.bargain.item.name} · {stats.bargain.m.name}</span></> : <span className="d muted">Not enough sales</span>}</div>
          <div className="stat"><span className="k">Biggest spender</span><span className="v num">{money(stats.spender.s)}</span><span className="d">{stats.spender.m.emoji} {stats.spender.m.name}</span></div>
          <div className="stat"><span className="k">Cheapest team</span><span className="v num">{money(stats.cheapest.s)}</span><span className="d">{stats.cheapest.m.emoji} {stats.cheapest.m.name}</span></div>
        </div>
        {d.votesRevealed && !noVotes && !finDone && (
          <div className="board">
            <h3>🗳️ Vote tally{solo ? ' · final standings' : ''}</h3>
            {ordered.map((m) => (
              <div key={m.id} className={'brow' + (winIds.includes(m.id) ? ' hl' : '')} style={mStyle(m)}>
                <span className="bn">{m.emoji} {m.name}</span>
                <span className="bb"><i style={{ width: (counts[m.id] / Math.max(1, counts[ordered[0].id])) * 100 + '%' }} /></span>
                <span className="bw num">{counts[m.id]}</span>
              </div>
            ))}
          </div>
        )}
        {d.votesRevealed && !noVotes && !finDone && (
          <p className="hint" style={{ textAlign: 'center' }}>{participants(d).map((m) => { const t = d.votes && d.votes[m.id]; const to = t && d.managers.find((x) => x.id === t); return m.name + ' → ' + (to ? to.name : 'no vote'); }).join(' · ')}</p>
        )}
        <AwardsBoard d={d} showShame={showShame !== false} />
        {revealed && <Leaderboard rows={winsBoard([...(past || []).filter((p) => p.id !== d.id), d])} highlight={winners.map((w) => w.name.trim().toLowerCase())} />}
        {d.trade && d.trade.proposals.some((t) => t.status === 'accepted') && (
          <div className="board"><h3>🤝 Trades</h3>{d.trade.proposals.filter((t) => t.status === 'accepted').map((t) => <p key={t.id} className="small" style={{ margin: 0 }}>{tradeText(d, t)}</p>)}</div>
        )}
        {(d.cardLog || []).length > 0 && (
          <div className="board"><h3>🃏 Chaos Cards</h3>{d.cardLog.map((e) => <p key={e.id} className="small" style={{ margin: 0 }}>{CARD_INFO[e.card].emoji} {e.result === 'vetoed' ? teamOf(d, e.by).name + '’s ' + CARD_INFO[e.card].name + ' was vetoed' : e.result === 'fizzled' ? teamOf(d, e.by).name + '’s ' + CARD_INFO[e.card].name + ' fizzled' : e.detail}</p>)}</div>
        )}
        <p className="exportfoot">DRAFT NIGHT · {(location.host + location.pathname).replace(/\/(index\.html)?$/, '')}</p>
      </div>

      <div className="stack resactions">
        {!online && !d.votesRevealed && !isFin && <button className="btn btn-gold" onClick={() => setVoting(true)}>{solo ? 'Vote for the best team' : Object.keys(d.votes || {}).length ? 'Continue the vote' : 'Start the secret vote'}</button>}
        {online && !d.votesRevealed && !isFin && <>
          {myOpenVote ? <button className="btn btn-gold" onClick={() => setVoting(true)}>Vote for the best team</button> : <p className="hint" style={{ textAlign: 'center', margin: 0 }}>{nv.tv ? 'Vote on your phones.' : 'Your vote is in.'} {humanVotes} of {humansP.length} players have voted.</p>}
          {nv.isHost && <button className={'btn' + (myOpenVote ? '' : ' btn-gold')} disabled={!humanVotes} onClick={hostReveal}>{humanVotes === humansP.length ? 'Reveal the winner' : 'Reveal now (' + humanVotes + '/' + humansP.length + ')'}</button>}
        </>}
        {!d.votesRevealed && isFin && (!online || nv.isHost) && <button className="btn btn-gold" onClick={openFinale}>{d.finale ? '🏆 Continue the finale' : '🏆 Start the finale'}</button>}
        {!d.votesRevealed && isFin && online && !nv.isHost && (d.finale ? <button className="btn btn-gold" onClick={() => setFinClosed(false)}>🏆 Watch the finale</button> : <p className="hint" style={{ textAlign: 'center', margin: 0 }}>Waiting for the host to start the finale.</p>)}
        {!d.votesRevealed && isFin && !d.finale && <p className="hint" style={{ textAlign: 'center', margin: 0 }}>{{ bracket: 'Head-to-head bracket: teams meet 1v1 and the players not involved vote.', sim: 'Match simulator: every matchup is a simulated football match.', combined: 'Combined finale: each matchup is a match plus a vote (' + finCfg(d).weight + '/' + (100 - finCfg(d).weight) + ').' }[fmode]}{(d.rules.finale && d.rules.finale.mode !== fmode) ? ' (Matches need a football topic, so this topic uses the vote bracket.)' : ''}</p>}
        {isFootball(d.topic) && <button className="btn" onClick={() => setFriendly(true)}>⚽ Friendly match{finDone ? ' / rematch' : ''}</button>}
        {live && onPlayAgain && d.votesRevealed && <button className="btn btn-gold" onClick={onPlayAgain}>Play again</button>}
        <button className="btn" onClick={() => setPickFormat(true)} disabled={imgBusy}>{imgBusy ? 'Making image…' : 'Save as image'}</button>
        {imgErr && <p className="warn">{imgErr}</p>}
        {d.votesRevealed && !d.finale && !online && <button className="btn btn-ghost" onClick={() => onChange({ ...d, votes: {}, votesRevealed: false })}>Redo the vote</button>}
        {live && onPlayAgain && !d.votesRevealed && !online && <button className="btn btn-ghost" onClick={onPlayAgain}>Play again</button>}
        {live && <button className="btn btn-ghost" onClick={onFinish}>{online ? 'Leave the room' : 'Finish · back to home'}</button>}
        <p className="hint" style={{ textAlign: 'center' }}>{online ? (d.votesRevealed ? 'Saved in Past Drafts on this phone.' : 'It’s saved on every phone once the winner is revealed.') : live ? 'This draft is saved in Past Drafts.' : 'Saved in Past Drafts.'}</p>
      </div>

      {voting && <Voting d={d} onSoloVote={soloVote} nv={nv} act={act}
        onVote={(v, t) => { if (!hasVoted(d, v)) onChange({ ...d, votes: { ...(d.votes || {}), [v]: t } }); }}
        onReveal={() => { onChange({ ...d, votesRevealed: true }); doReveal(); }}
        onClose={() => setVoting(false)} />}
      {finaleOpen && <Finale d={d} onChange={onChange} onClose={() => { setShowFinale(false); setFinClosed(true); }} onChampion={() => { onChange({ ...d, finale: { ...d.finale, ui: { ...(d.finale.ui || {}), stage: 'done' } } }); setShowFinale(false); doReveal(); }} />}
      {friendly && <FriendlySheet d={d} onClose={() => setFriendly(false)} />}
      {viewMatch && d.finale && <MatchupSheet d={d} at={viewMatch} onClose={() => setViewMatch(null)} />}
      {party > 0 && revealed && <Confetti key={party} colors={[...winners.map((w) => w.color), '#ffc83d', '#ffffff']} />}
      {pickFormat && (
        <Sheet center onClose={() => setPickFormat(false)}>
          <h2 className="display" style={{ fontSize: 30 }}>Which picture?</h2>
          <button className="btn btn-gold" onClick={() => makeImage('winner')} disabled={!revealed}>🏆 Winner card</button>
          {!revealed && <p className="hint">{isFin ? 'Finish the finale first to make a winner card.' : 'Reveal the vote first to make a winner card.'}</p>}
          <button className="btn" onClick={() => makeImage('full')}>📋 Full results</button>
          <button className="btn" onClick={() => makeImage('awards')}>🎖️ Awards & standings</button>
          <button className="btn btn-ghost" onClick={() => setPickFormat(false)}>Cancel</button>
        </Sheet>
      )}
      {exportKind && <div className="exportstage" aria-hidden="true"><div ref={stageRef} className="excard"><ExportCard d={d} kind={exportKind} showShame={showShame !== false} /></div></div>}
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
                <span className="sub">{new Date(p.createdAt).toLocaleDateString()} · {p.mode === 'solo' ? 'Solo (' + (BOT_LEVELS[(p.solo || {}).level] || BOT_LEVELS.medium).label + ') · ' : ''}{p.managers.map((m) => m.name).join(', ')}</span>
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
  useEffect(() => { const t = setTimeout(onDone, ms(f.kind === 'skip' ? 1100 : f.mystery || f.rarity === 'legendary' ? 2600 : 1800)); return () => clearTimeout(t); }, [f]);
  return (
    <div className="flash" onClick={onDone} style={{ '--fc': f.color || 'var(--muted)' }}>
      {f.kind === 'sold' && <div className={'inner' + (f.rarity === 'legendary' ? ' legendary' : '') + (f.big ? ' bigsale' : '')}>
        <div className="big" style={{ color: 'var(--gold)' }}>SOLD!</div>
        <div className="to" style={{ color: f.color }}>to {f.emoji} {f.name}</div>
        <div className="price num">{money(f.price)}{f.doubled ? <small className="dbl"> (Double Bid)</small> : null}</div>
        {f.mystery && <div className="it" style={{ color: '#c9a6ff', fontWeight: 800 }}>❓ The mystery item was…</div>}
        <div className="it">{f.item} {f.rarity && f.rarity !== 'common' ? <RarityTag r={f.rarity} /> : null}</div>
      </div>}
      {f.kind === 'card' && <div className="inner">
        <div className="big" style={{ fontSize: 64, color: f.result === 'done' ? 'var(--gold)' : 'var(--danger)' }}>{CARD_INFO[f.card].emoji} {f.result === 'vetoed' ? 'Vetoed!' : f.result === 'fizzled' ? 'Fizzled' : CARD_INFO[f.card].name + '!'}</div>
        {f.by && <div className="to" style={{ color: f.by.color }}>{f.by.emoji} {f.by.name}</div>}
        <div className="it">{f.text}</div>
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
const DEFAULT_RULES = { budget: 20, minBid: 1, inc: 1, order: 'random', timer: 0, mustFill: true, noBids: 'skip', mustBid: false };
// What new players get: the classic rules plus every twist at its default.
const RULE_DEFAULTS = () => ({ ...DEFAULT_RULES, ...JSON.parse(JSON.stringify(TWIST_DEFAULTS)), finale: { ...FINALE_DEFAULTS } });
const defaultManagers = () => ['Ash', 'Bilal', 'Cam', 'Dev'].map((name, i) => ({ id: uid(), name, color: COLORS[i], emoji: EMOJIS[i] }));
const stripDraft = (d) => ({ ...d, history: [] });

// Adds new starter topics to an existing install (without bringing back ones the user deleted)
// and gives older saved starter items their picture data.
// Before v3 the twists were on by default, so saved house rules carried them switched on
// without anyone choosing that. Once, switch those off; anything set after this sticks.
function migrateSettings(st) {
  const x = { ...(st || {}) };
  if ((x.rulesV || 0) < 3) {
    if (x.rulePrefs) { const p = { ...x.rulePrefs }; ['chaos', 'mystery', 'rarity', 'trades'].forEach((k) => { if (p[k]) p[k] = { ...p[k], on: false }; }); x.rulePrefs = p; }
    x.rulesV = 3;
  }
  return x;
}
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
   TOPIC SHARING UI
   ============================================================ */
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    try { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e2) { return false; }
  }
}
function ShareTopicSheet({ topic, onClose }) {
  const [withPhotos, setWithPhotos] = useState(false);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const hasPhotos = topic.items.some((i) => i.photo);
  useEffect(() => { let live = true; encodeTopic(topic, withPhotos).then((c) => { if (live) setCode(c); }); return () => { live = false; }; }, [topic, withPhotos]);
  const link = code ? shareLink(code) : '';
  const tooLong = link.length > MAX_LINK;
  const fp = topicCode(topic);
  const copy = async (text, what) => setNote((await copyText(text)) ? what + ' copied.' : 'Couldn’t copy automatically. Press and hold the text to copy it.');
  const file = () => { downloadBlob(topicFile(topic), (topic.name || 'topic').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '.dntopic.json'); setNote(isIOS() ? 'Saved to Files → Downloads. Send that file to your friend.' : 'Topic file saved.'); };
  const share = async () => { try { if (navigator.share) { await navigator.share({ title: topic.name + ' · Draft Night', text: 'Import my Draft Night topic “' + topic.name + '”', url: link }); return; } } catch (e) { if (e && e.name === 'AbortError') return; } copy(link, 'Link'); };
  return (
    <Sheet center onClose={onClose}>
      <p className="eyebrow">Share topic</p>
      <h2 className="display" style={{ fontSize: 30 }}>{topic.emoji} {topic.name}</h2>
      <div className="row"><span className="fpcode num">{fp}</span><span className="hint grow">Fingerprint: your friend sees the same code after importing, so you know it arrived intact.</span></div>
      {hasPhotos && <Toggle on={withPhotos} onChange={setWithPhotos} title="Include uploaded photos" sub="Makes the link much longer. The topic file always includes them." />}
      {!code ? <p className="hint">Preparing…</p> : <>
        <div className="row">
          <button className="btn btn-gold grow" onClick={share} disabled={tooLong}>Share link</button>
          <button className="btn grow" onClick={() => copy(link, 'Link')} disabled={tooLong}>Copy link</button>
        </div>
        <button className="btn" onClick={() => copy(code, 'Share code')}>Copy share code ({Math.round(code.length / 100) / 10}k characters)</button>
        <button className="btn" onClick={file}>Download topic file</button>
        {tooLong ? <p className="warn">This topic is too big for a link ({Math.round(link.length / 1000)}k characters). Send the topic file or the share code instead.</p>
          : <p className="hint">The link holds the whole topic, so it works without any account or server. Image links and Wikipedia settings come along; uploaded photos only if you include them.</p>}
      </>}
      {note && <p className="hint" style={{ color: 'var(--ok)' }}>{note}</p>}
      <button className="btn btn-ghost" onClick={onClose}>Done</button>
    </Sheet>
  );
}
function ImportTopicSheet({ topics, initial, onImport, onClose }) {
  const [text, setText] = useState(initial || '');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const check = async (t) => { setBusy(true); setRes(await decodeShared(t)); setBusy(false); };
  useEffect(() => { if (initial) check(initial); }, []);
  const fromFile = async (e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; if (f.size > 20 * 1024 * 1024) { setRes({ ok: false, error: 'That file is too big to be a topic.' }); return; } const t = await f.text(); setText(''); check(t); };
  const dup = res && res.ok && topics.find((t) => topicCode(t) === topicCode(res.topic));
  const sameName = res && res.ok && !dup && topics.find((t) => t.name.trim().toLowerCase() === res.topic.name.trim().toLowerCase());
  return (
    <Sheet center onClose={onClose}>
      <p className="eyebrow">Import a topic</p>
      <h2 className="display" style={{ fontSize: 30 }}>Add a friend’s topic</h2>
      {!res || !res.ok ? <>
        <div className="field"><label htmlFor="import-text">Paste a share link or share code</label>
          <textarea id="import-text" className="input" style={{ minHeight: 90 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="https://…#topic=DN1.…" /></div>
        <div className="row">
          <button className="btn btn-gold grow" disabled={!text.trim() || busy} onClick={() => check(text)}>{busy ? 'Checking…' : 'Check'}</button>
          <button className="btn grow" onClick={() => fileRef.current && fileRef.current.click()}>Open topic file</button>
        </div>
        <input ref={fileRef} id="import-file" type="file" accept="application/json,.json" hidden onChange={fromFile} />
        {res && !res.ok && <p className="warn">{res.error}</p>}
      </> : <>
        <div className="card stack-sm" style={{ background: 'var(--stage)' }}>
          <b style={{ fontFamily: 'var(--cond)', fontSize: 20 }}>{res.topic.emoji} {res.topic.name}</b>
          <span className="small muted">{res.topic.items.length} items · slots {res.topic.slots.join(', ')} · {res.topic.folder}</span>
          <span className="small">{res.topic.items.slice(0, 6).map((i) => i.name).join(', ')}{res.topic.items.length > 6 ? '…' : ''}</span>
          <span className="fpcode num" style={{ alignSelf: 'flex-start' }}>{topicCode(res.topic)}</span>
        </div>
        {dup && <p className="warn">You already have this exact topic (“{dup.name}”). Adding it again makes a second copy.</p>}
        {sameName && <p className="hint">You have a different topic with the same name. This one is added alongside it; nothing is overwritten.</p>}
        <div className="row pin">
          <button className="btn btn-ghost grow" onClick={() => setRes(null)}>Back</button>
          <button className="btn btn-gold grow" onClick={() => { onImport(dup ? { ...res.topic, name: res.topic.name + ' (copy)' } : res.topic); onClose(); }}>{dup ? 'Add a copy' : 'Add topic'}</button>
        </div>
      </>}
    </Sheet>
  );
}

/* ============================================================
   PLAYERS, STATS & HALL OF SHAME
   ============================================================ */
const pct = (x) => Math.round(x * 100) + '%';
function ProfilesScreen({ past, settings, setSettings, onBack, onOpen, onShame }) {
  const rows = careerStats(past, settings);
  const [ask, setAsk] = useState(false);
  return (
    <div className="app">
      <TopBar onBack={onBack} title="Players & stats" />
      <p className="hint">Built from finished drafts on this device (after the vote is revealed). Bots aren’t included. Stats don’t sync between phones; use a backup to move them.</p>
      {!rows.length && <div className="card"><p className="muted" style={{ margin: 0 }}>Finish a draft and reveal the vote, and everyone who played gets a profile here.</p></div>}
      <div className="stack-sm">
        {rows.map((r, i) => (
          <button key={r.key} className="tcard" onClick={() => onOpen(r.key)}>
            <span className="em">{r.emoji}</span>
            <span className="meta"><span className="name">{i === 0 && r.wins ? '👑 ' : ''}{r.name}</span><span className="sub">{r.wins} win{r.wins === 1 ? '' : 's'} · {r.games} game{r.games === 1 ? '' : 's'} · {pct(r.winRate)} · {money(Math.round(r.spent))} spent</span></span>
            <span className="muted" style={{ fontSize: 22 }}>›</span>
          </button>
        ))}
      </div>
      {settings.showShame !== false && <button className="btn" onClick={onShame}>🙈 Hall of Shame</button>}
      <Toggle on={settings.showShame !== false} onChange={(v) => setSettings((x) => ({ ...x, showShame: v }))} title="Show the Hall of Shame" sub="Funny awards for the worst buys. Turn off if your group prefers not to see it." />
      {rows.length > 0 && <button className="btn btn-danger" onClick={() => setAsk(true)}>Reset stats</button>}
      {ask && <Confirm title="Reset all stats?" body="Profiles, wins and awards start from zero. Your Past Drafts stay saved and aren’t deleted." yes="Reset stats" danger onYes={() => setSettings((x) => ({ ...x, statsResetAt: Date.now() }))} onClose={() => setAsk(false)} />}
    </div>
  );
}
function ProfileView({ past, settings, setSettings, pkey, onBack }) {
  const r = careerStats(past, settings).find((x) => x.key === pkey);
  const [name, setName] = useState(r ? r.name : '');
  const [emoji, setEmoji] = useState(r ? r.emoji : '🙂');
  if (!r) return <div className="app"><TopBar onBack={onBack} title="Player" /><p className="muted">That player has no finished games.</p></div>;
  const save = (n, e) => setSettings((x) => ({ ...x, profiles: { ...(x.profiles || {}), [pkey]: { name: n.trim() || r.name, emoji: e || '🙂' } } }));
  const Stat = ({ k, v, d: sub }) => <div className="stat"><span className="k">{k}</span><span className="v num">{v}</span>{sub && <span className="d">{sub}</span>}</div>;
  return (
    <div className="app">
      <TopBar onBack={onBack} title="Player" />
      <div className="card row" style={{ gap: 10 }}>
        <button className="emo" onClick={() => { const e = EMOJIS[(EMOJIS.indexOf(emoji) + 1) % EMOJIS.length]; setEmoji(e); save(name, e); }} aria-label="Change avatar">{emoji}</button>
        <input id="profile-name" className="input grow" maxLength={16} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => save(name, emoji)} />
      </div>
      <p className="hint">Changing the display name only changes how it’s shown. Games are matched by the name typed when playing.</p>
      <div className="stat-grid">
        <Stat k="Wins" v={r.wins} d={pct(r.winRate) + ' win rate'} />
        <Stat k="Games" v={r.games} d={r.teamGames ? r.teamGames + ' in teams' : 'all individual'} />
        <Stat k="Team wins" v={r.teamWins} />
        <Stat k="Money spent" v={money(Math.round(r.spent))} d={r.teamGames ? 'team spending split evenly' : null} />
        <Stat k="Legendaries" v={r.legendary} />
        <Stat k="Trades done" v={r.trades} d={r.topCard ? 'Favourite card: ' + CARD_INFO[r.topCard].name : null} />
        {r.titles > 0 && <Stat k="Finale titles" v={r.titles} d="brackets & knockouts won" />}
        {r.matches > 0 && <Stat k="Match record" v={r.matchWins + '–' + (r.matches - r.matchWins)} d={r.goals + ' goal' + (r.goals === 1 ? '' : 's') + ' scored'} />}
        {r.topRating && <Stat k="Best team rating" v={r.topRating.rating} d={r.topRating.team + ' · ' + r.topRating.topic} />}
      </div>
      <div className="board">
        <h3>❤️ Favourite picks</h3>
        {r.favourites.length ? r.favourites.map(([n, c]) => <p key={n} className="small" style={{ margin: 0 }}>{n} · drafted {c} times</p>) : <p className="hint" style={{ margin: 0 }}>Draft the same item twice and it shows up here.</p>}
      </div>
      <div className="board">
        <h3>🏷️ Best bargain · 💸 Biggest overpay</h3>
        {r.bargain ? <p className="small" style={{ margin: 0 }}>Bargain: {r.bargain.name} for {money(r.bargain.price)} (usually {money(Math.round(r.bargain.avg))}) · {r.bargain.topic}</p> : <p className="hint" style={{ margin: 0 }}>No bargain on record yet.</p>}
        {r.overpay ? <p className="small" style={{ margin: 0 }}>Overpay: {r.overpay.name} for {money(r.overpay.price)} (usually {money(Math.round(r.overpay.avg))}) · {r.overpay.topic}</p> : <p className="hint" style={{ margin: 0 }}>No overpay on record yet.</p>}
        <p className="hint" style={{ margin: 0 }}>How it’s worked out: each price is compared with the average that same item sold for across your saved drafts. Items need at least 2 sales to compare, so nothing is guessed.</p>
      </div>
      {r.best && <div className="board"><h3>🏆 Best win</h3><p className="small" style={{ margin: 0 }}>{r.best.team} · {r.best.topic} · {r.best.votes == null ? r.best.how : r.best.votes + ' vote' + (r.best.votes === 1 ? '' : 's') + ' (' + pct(r.best.share) + ')'} · {new Date(r.best.date).toLocaleDateString()}</p></div>}
      <div className="board"><h3>🎖️ Awards</h3>{Object.keys(r.awards).length ? Object.entries(r.awards).sort((a, b) => b[1] - a[1]).map(([t, n]) => <p key={t} className="small" style={{ margin: 0 }}>{t} × {n}</p>) : <p className="hint" style={{ margin: 0 }}>No awards yet.</p>}</div>
    </div>
  );
}
function ShameScreen({ past, settings, onBack }) {
  const rows = hallOfShame(past, settings);
  return (
    <div className="app">
      <TopBar onBack={onBack} title="Hall of Shame" />
      <p className="hint">All in good fun. Each entry says exactly why it’s here, using that draft’s own prices.</p>
      {!rows.length && <div className="card"><p className="muted" style={{ margin: 0 }}>Nobody has embarrassed themselves yet. Give it time.</p></div>}
      <div className="stack-sm">
        {rows.map((x, i) => (
          <div key={x.draftId + x.id + i} className="shame">
            <span className="se">{x.emoji}</span>
            <span className="grow" style={{ minWidth: 0 }}><b>{x.title}: {x.item} · {money(x.price)}</b><span className="small" style={{ display: 'block' }}>{x.team} · {x.topic} · {new Date(x.date).toLocaleDateString()}</span><span className="small muted" style={{ display: 'block' }}>{x.why}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
function AwardsBoard({ d, showShame }) {
  const awards = computeAwards(d); const shame = showShame ? computeShame(d) : [];
  if (!awards.length && !shame.length) return null;
  return (
    <>
      {awards.length > 0 && <div className="board"><h3>🎖️ Awards</h3>{awards.map((a, i) => <p key={a.id + i} className="award"><b>{a.emoji} {a.title}: {a.team}</b><span className="small muted"> — {a.why}</span></p>)}</div>}
      {shame.length > 0 && <div className="board"><h3>🙈 Hall of Shame</h3>{shame.map((a) => <p key={a.id} className="award"><b>{a.emoji} {a.title}: {a.team}</b><span className="small muted"> — {a.item} for {money(a.price)}. {a.why}</span></p>)}</div>}
    </>
  );
}

/* ============================================================
   SOUND & VOICE SETTINGS
   ============================================================ */
function AudioSettings() {
  const { cfg, set } = React.useContext(AudioCtx);
  const [voices, setVoices] = useState(() => audio.voices());
  useEffect(() => {
    if (!audio.hasSpeech()) return undefined;
    const upd = () => setVoices(audio.voices());
    try { window.speechSynthesis.addEventListener('voiceschanged', upd); } catch (e) {}
    const t = setTimeout(upd, 600);
    return () => { clearTimeout(t); try { window.speechSynthesis.removeEventListener('voiceschanged', upd); } catch (e) {} };
  }, []);
  const up = (p) => set({ ...cfg, ...p });
  const Range = ({ id, label, value, onChange }) => (
    <div className="field"><label htmlFor={id}>{label} · {Math.round(value * 100)}%</label>
      <input id={id} type="range" min="0" max="1" step="0.05" value={value} onChange={(e) => onChange(parseFloat(e.target.value))} /></div>
  );
  return (
    <section className="card stack">
      <h3>🔊 Sound &amp; voice</h3>
      <Toggle on={cfg.muted} onChange={(v) => up({ muted: v })} title="Mute everything" sub="Silences the auctioneer, sound effects and music right away. Also on the 🔊 button during games." />
      <Toggle on={cfg.voice} onChange={(v) => up({ voice: v })} title="Auctioneer voice" sub={audio.hasSpeech() ? 'Calls out items, bids, “going once…” and SOLD.' : 'This browser can’t speak, so the auctioneer stays silent. Everything else still works.'} />
      {cfg.voice && audio.hasSpeech() && <>
        <div className="field"><span className="label">Voice speed</span><Seg label="Voice speed" value={cfg.rate} options={[[0.95, 'Slow'], [1.15, 'Normal'], [1.35, 'Fast'], [1.55, 'Hype']]} onChange={(v) => up({ rate: v })} /></div>
        {voices.length > 0 && <div className="field"><label htmlFor="voice-pick">Voice</label>
          <select id="voice-pick" className="input" value={cfg.voiceName} onChange={(e) => up({ voiceName: e.target.value })}>
            <option value="">Best available</option>
            {voices.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
          </select></div>}
        {Range({ id: 'voice-vol', label: 'Voice volume', value: cfg.voiceVol, onChange: (v) => up({ voiceVol: v }) })}
      </>}
      <Toggle on={cfg.sfx} onChange={(v) => up({ sfx: v })} title="Sound effects" sub="Gavel, crowd cheers, buzzer, drumroll and small blips." />
      {cfg.sfx && Range({ id: 'sfx-vol', label: 'Effects volume', value: cfg.sfxVol, onChange: (v) => up({ sfxVol: v }) })}
      <Toggle on={cfg.music} onChange={(v) => up({ music: v })} title="Background music" sub="An original looping game-show track, played quietly under everything." />
      {cfg.music && Range({ id: 'music-vol', label: 'Music volume', value: cfg.musicVol, onChange: (v) => up({ musicVol: v }) })}
      <div className="field"><span className="label">Big-money sale</span><Seg label="Big sale threshold" value={cfg.bigSale} options={[[30, '30%'], [40, '40%'], [50, '50%']]} onChange={(v) => up({ bigSale: v })} />
        <p className="hint">A sale for at least this share of the starting budget gets the extra-dramatic SOLD.</p></div>
      <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} disabled={cfg.muted} onClick={() => audio.test()}>Test sound</button>
    </section>
  );
}

/* ============================================================
   BACKUP & APP SETTINGS
   ============================================================ */
const fmtBytes = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
const SETTINGS_TABS = [['rules', 'House rules'], ['sound', 'Sound'], ['display', 'Display & access'], ['online', 'Online'], ['app', 'App & backup']];
function SettingsScreen({ onBack, state, onRestore, settings, setSettings, rulePrefs, saveRulePrefs }) {
  const [tab, setTab] = useState('rules');
  const [editRules, setEditRules] = useState(null);
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
  if (editRules) return <SetupRules defaultsMode topic={{ name: '', emoji: '', items: [], slots: [] }} managers={[]} rules={editRules} setRules={setEditRules} title="Default house rules" startLabel="Save as my defaults"
    onBack={() => setEditRules(null)} onStart={(r) => { saveRulePrefs(r); setEditRules(null); }} onReset={() => setEditRules({ ...RULE_DEFAULTS(), slots: [] })} />;
  const prefs = { ...rulePrefs(), slots: [] };
  const setS = (p) => setSettings((x) => ({ ...x, ...p }));
  const motion = settings.motion || 'system';
  const prof = settings.online || {};
  return (
    <div className="app">
      <TopBar onBack={onBack} title="Rules & settings" />
      <div className="tabs" role="tablist" aria-label="Settings sections">
        {SETTINGS_TABS.map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} className={'ttab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{label}</button>)}
      </div>

      {tab === 'rules' && <section className="card stack" role="tabpanel">
        <h3>📜 Default house rules</h3>
        <p className="hint" style={{ margin: 0 }}>New Local, Solo and Online games start with these. Slots come from each topic. Optional twists stay off unless you switch them on.</p>
        <RulesSummary rules={prefs} />
        <button className="btn btn-gold" onClick={() => setEditRules(prefs)}>Edit default rules</button>
        <button className="btn btn-ghost" onClick={() => saveRulePrefs({ ...RULE_DEFAULTS(), slots: [] })}>Reset to standard rules</button>
      </section>}

      {tab === 'sound' && <div role="tabpanel"><AudioSettings /></div>}

      {tab === 'display' && <section className="card stack" role="tabpanel">
        <h3>🎞️ Motion</h3>
        <Seg label="Motion" value={motion} options={[['system', 'Match my device'], ['reduce', 'Reduce motion'], ['full', 'Full animation']]} onChange={(v) => setS({ motion: v })} />
        <p className="hint" style={{ margin: 0 }}>Reduce motion turns off confetti, card flips and pop-ups, and football matches move step by step instead of sliding.</p>
        <h3>📺 TV display</h3>
        <Seg label="TV text size" value={settings.tvZoom || 1} options={[[1, 'Normal'], [1.25, 'Large'], [1.5, 'Extra large']]} onChange={(v) => setS({ tvZoom: v })} />
        <p className="hint" style={{ margin: 0 }}>How big everything looks when this device shows the TV view.</p>
      </section>}

      {tab === 'online' && <section className="card stack" role="tabpanel">
        <h3>🌐 Online</h3>
        <p className="hint" style={{ margin: 0 }}>Your online name: <b>{prof.emoji} {prof.name || 'not set yet'}</b> (change it on the Online screen).</p>
        <Toggle on={!!prof.voice} onChange={(v) => setS({ online: { ...prof, voice: v } })} title="Auctioneer voice on my phone" sub="Off by default when you’re a player, so the room doesn’t hear the auctioneer from every phone. The host and the TV always have it." />
        <p className="hint" style={{ margin: 0 }}>Room rules (seats, bots, bid clock, reconnection) are set by the host in the room’s lobby. Your favourites and settings stay on this device.</p>
      </section>}

      {tab === 'app' && <>
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
      </>}

      {confirm && <Confirm title={confirm === 'replace' ? 'Replace everything?' : 'Add the backup?'}
        body={confirm === 'replace' ? 'Your current topics, drafts and history on this device will be overwritten by the backup. Export a backup first if you might want them back.' : 'Topics and past drafts from the backup that you don’t already have will be added. Nothing of yours is deleted.'}
        yes={confirm === 'replace' ? 'Replace' : 'Add'} danger={confirm === 'replace'} onYes={() => doRestore(confirm)} onClose={() => setConfirm(null)} />}
    </div>
  );
}

function App() {
  const [topics, setTopics] = useState(() => migrateTopics(store.get(K.topics, null)));
  const [draft, setDraft] = useState(() => { const c = store.get(K.current, null); return c && c.topic && Array.isArray(c.managers) ? c : null; });
  const [past, setPast] = useState(() => store.get(K.past, []));
  const [screen, setScreen] = useState({ name: 'home' });
  const [managers, setManagers] = useState(() => store.get(K.managers, null) || defaultManagers());
  const [topicId, setTopicId] = useState(null);
  const [rules, setRules] = useState({ ...DEFAULT_RULES, slots: [] });
  const [flash, setFlashRaw] = useState(null);
  const [toast, setToast] = useState(null);
  // TV mode for local games: this window can show the TV view, or feed a TV window in this browser.
  const tvTab = useMemo(() => { const m = (location.hash || '').match(/^#tv=([A-Za-z0-9]+)/); return m ? m[1] : null; }, []);
  const [localTv, setLocalTv] = useState(false);
  const chan = useMemo(() => (!tvTab && canChannel() ? new BroadcastChannel(LOCAL_TV) : null), []);
  const liveRef = useRef({}); const draftRef = useRef(null);
  const [tvWindows, setTvWindows] = useState(0);
  const setFlash = (info) => { setFlashRaw(info); if (info && chan) chan.postMessage({ type: 'flash', info }); };
  const [folder, setFolder] = useState(null);
  const [importing, setImporting] = useState(null); // null, '' (blank) or a shared code from a link
  // Opening a share link (#topic=…) shows the import preview; a room link (#room=…) opens Online with the code.
  useEffect(() => {
    const m = (location.hash || '').match(/^#topic=(.+)$/);
    if (m) { setImporting(decodeURIComponent(m[1])); try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
    const tv = (location.hash || '').match(/^#tv=([A-Za-z0-9]+)/);
    if (tv) { if (tv[1] === 'local') setScreen({ name: 'tv-local' }); else setScreen({ name: 'online', start: { kind: 'tv', code: cleanCode(tv[1]) }, k: 'tv' }); }
    const r = (location.hash || '').match(/^#room=([A-Za-z0-9]+)/);
    if (r) { setScreen({ name: 'online-home', code: cleanCode(r[1]) }); try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
  }, []);
  const [settings, setSettings] = useState(() => migrateSettings(store.get(K.settings, {})));
  const audioCfg = { ...AUDIO_DEFAULTS, ...(settings.audio || {}) };
  const setAudioCfg = (c) => setSettings((x) => ({ ...x, audio: c }));
  useEffect(() => { audio.set(audioCfg); }, [JSON.stringify(audioCfg)]);
  useEffect(() => { document.documentElement.setAttribute('data-motion', settings.motion || 'system'); document.documentElement.style.setProperty('--tvzoom', String(settings.tvZoom || 1)); }, [settings.motion, settings.tvZoom]);
  const soloCfg = { ...DEFAULT_SOLO, ...(settings.solo || {}) };
  const setSoloCfg = (c) => setSettings((x) => ({ ...x, solo: c }));
  const [soloRules, setSoloRules] = useState(null); // { topicId, rules }
  const warned = useRef(false);
  const app = usePwa();
  useEffect(() => { store.onError = (msg) => { if (!warned.current) { warned.current = true; setToast(msg); } }; }, []);
  // A TV window only displays: it never saves, so it can't overwrite the game it's showing.
  const persist = (k, v) => { if (tvTab) return; if (v === null || v === undefined) store.del(k); else store.set(k, v); };
  useEffect(() => { draftRef.current = draft; if (chan && draft) chan.postMessage({ type: 'draft', draft: stripDraft(draft) }); }, [draft]);
  useEffect(() => {
    if (!chan) return undefined;
    chan.onmessage = (e) => { const m = e.data || {}; if (m.type === 'hello') { setTvWindows((n) => n + 1); if (draftRef.current) chan.postMessage({ type: 'draft', draft: stripDraft(draftRef.current) }); chan.postMessage({ type: 'live', live: liveRef.current }); } else if (m.type === 'bye') setTvWindows((n) => Math.max(0, n - 1)); };
    return () => { chan.onmessage = null; };
  }, []);
  // With a TV window open, the TV is the auctioneer, so this window stays quiet.
  useEffect(() => { if (!tvTab) audio.setQuiet(tvWindows > 0); }, [tvWindows]);
  const localNet = { local: true, role: 'host', display: localTv ? 'tv' : 'controls', live: {}, publishLive: (o) => { liveRef.current = { ...liveRef.current, ...o }; if (chan) chan.postMessage({ type: 'live', live: liveRef.current }); } };
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

  const soloTopic = () => topics.find((t) => t.id === soloCfg.topicId && t.items.length) || topics.find((t) => t.items.length && t.slots.length) || null;
  // Saved house rules (everything except slots, which come from the topic). New drafts start from these.
  const rulePrefs = () => { const p = { ...RULE_DEFAULTS(), ...(settings.rulePrefs || {}) }; delete p.slots; return { ...p, ...twistRules(p) }; };
  const saveRulePrefs = (r) => { const { slots, ...rest } = r; setSettings((x) => ({ ...x, rulePrefs: rest })); };
  const soloRulesFor = (t) => (soloRules && t && soloRules.topicId === t.id ? soloRules.rules : { ...rulePrefs(), slots: t ? [...t.slots] : [] });
  const teamCfg = { ...DEFAULT_TEAMS, ...(settings.localTeams || {}) };
  const setTeamCfg = (c) => setSettings((x) => ({ ...x, localTeams: c }));
  const localPlayers = () => (teamCfg.on ? localTeamsToManagers(teamCfg) : managers);
  const soloT = { ...DEFAULT_SOLO.teams, ...(soloCfg.teams || {}) };
  const teamSummaryLocal = teamCfg.on ? { teams: true, text: (teamCfg.count === 2 ? teamCfg.size + 'v' + teamCfg.size : teamCfg.count + ' teams of ' + teamCfg.size), detail: localTeamsToManagers(teamCfg).map((t) => t.name + ': ' + t.members.map((p) => p.name).join(', ')).join(' · ') }
    : { teams: false, text: 'Individual · ' + managers.length + ' managers', detail: 'Everyone plays for themselves. Switch to Teams on the players screen.' };
  const teamSummarySolo = soloT.on ? { teams: true, text: (soloT.count === 2 ? soloT.size + 'v' + soloT.size : soloT.count + ' teams of ' + soloT.size), detail: 'Bots on your team advise you; other teams are all bots.' }
    : { teams: false, text: 'Every bot for itself · ' + soloCfg.bots + ' bots', detail: 'Switch to Teams on the solo setup screen.' };
  // Same topic, same managers (or bots), same rules — fresh draft.
  const playAgain = () => {
    if (!draft) return;
    const t = topics.find((x) => x.id === draft.topic.id && x.items.length);
    if (!t) { setDraft(null); go(draft.mode === 'solo' ? 'solo-setup' : 'setup-topic'); return; }
    const extra = draft.mode === 'solo' ? { mode: 'solo', solo: { ...draft.solo } } : undefined;
    setDraft(createDraft(t, draft.managers, { ...draft.rules }, extra));
    go('draft');
  };

  const topicPrefs = prefsOf(settings);
  const setTopicPrefs = (p) => setSettings((x) => ({ ...x, topicPrefs: { fav: p.fav || [], pin: p.pin || [] } }));
  const profile = { ...defaultProfile(), ...(settings.online || {}) };
  const setProfile = (p) => setSettings((x) => ({ ...x, online: p }));
  // Every phone files a finished online game in its own Past Drafts.
  const fileOnline = (d) => setPast((p) => { const s = stripDraft(d); const i = p.findIndex((x) => x.id === d.id); if (i >= 0) { const a = [...p]; a[i] = s; return a; } return [s, ...p]; });

  let view;
  switch (screen.name) {
    case 'online-home':
      view = <OnlineHome profile={profile} setProfile={setProfile} last={lastRoom()} initialCode={screen.code} onBack={() => go('home')}
        onCreate={() => { setProfile({ ...profile, name: profile.name.trim() }); go('online', { start: { kind: 'create' }, k: uid() }); }}
        onJoin={(code) => { setProfile({ ...profile, name: profile.name.trim() }); go('online', { start: { kind: 'join', code }, k: uid() }); }}
        onTv={(code) => go('online', { start: { kind: 'tv', code }, k: uid() })}
        onRejoin={(l) => go('online', { start: { kind: l.kind === 'tv' ? 'tv' : 'join', code: l.code }, k: uid() })} />;
      break;
    case 'online':
      view = <OnlineScreen key={screen.k} setSettings={setSettings} start={screen.start} onRetry={() => go('online', { start: screen.start, k: uid() })} profile={profile} topics={topics} rulePrefs={rulePrefs} past={past} settings={settings} onFinished={fileOnline} onExit={() => go('online-home')} />;
      break;
    case 'topics':
      view = <TopicsList topics={topics} folder={folder} setFolder={setFolder} prefs={topicPrefs} setPrefs={setTopicPrefs} onImport={() => setImporting('')} onBack={() => go(screen.from || 'home')} onOpen={(id) => go('topic', { id, from: screen.from })}
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
      view = <SetupManagers managers={managers} setManagers={setManagers} teamCfg={teamCfg} setTeamCfg={setTeamCfg} onBack={() => go('home')} onNext={() => go('setup-topic')} />;
      break;
    case 'solo-setup': {
      const st = soloTopic();
      view = <SoloSetup cfg={soloCfg} setCfg={setSoloCfg} topic={st} rules={soloRulesFor(st)} onBack={() => go('home')}
        onPickTopic={() => go('setup-topic', { from: 'solo' })} onRules={() => go('setup-rules', { from: 'solo' })}
        onStart={(players) => {
          const human = { id: 'you', name: soloCfg.name.trim() || 'You', color: COLORS[1], emoji: '😎', human: true };
          const list = players.length && players[0].members ? players : [human, ...players];
          setDraft(createDraft(st, list, soloRulesFor(st), { mode: 'solo', solo: { level: soloCfg.level, talk: soloCfg.talk, clock: soloCfg.clock } }));
          go('draft');
        }} />;
      break;
    }
    case 'setup-topic':
      if (screen.from === 'solo') {
        view = <SetupTopic topics={topics} folder={folder} setFolder={setFolder} prefs={topicPrefs} setPrefs={setTopicPrefs} onBack={() => go('solo-setup')} onTopics={() => go('topics', { from: 'solo-setup' })}
          onPick={(id) => { setSoloCfg({ ...soloCfg, topicId: id }); go('solo-setup'); }} />;
        break;
      }
      view = <SetupTopic topics={topics} folder={folder} setFolder={setFolder} prefs={topicPrefs} setPrefs={setTopicPrefs} onBack={() => go('setup-managers')} onTopics={() => go('topics', { from: 'setup-topic' })}
        onPick={(id) => { const t = topics.find((x) => x.id === id); setTopicId(id); setRules({ ...rulePrefs(), slots: [...t.slots] }); go('setup-rules'); }} />;
      break;
    case 'setup-rules': {
      if (screen.from === 'solo') {
        const st = soloTopic();
        const fake = Array.from({ length: soloT.on ? soloT.count : soloCfg.bots + 1 }, (_, i) => ({ id: 'x' + i }));
        view = st ? <SetupRules topic={st} managers={fake} rules={soloRulesFor(st)} setRules={(r) => setSoloRules({ topicId: st.id, rules: r })} onBack={() => go('solo-setup')}
          teamSummary={teamSummarySolo} onEditTeams={() => go('solo-setup')} onReset={() => setSoloRules({ topicId: st.id, rules: { ...RULE_DEFAULTS(), slots: [...st.slots] } })}
          title="Solo · Rules" startLabel="Save rules" onStart={(r) => { setSoloRules({ topicId: st.id, rules: r }); saveRulePrefs(r); go('solo-setup'); }} /> : null;
        break;
      }
      const t = topics.find((x) => x.id === topicId);
      view = t ? <SetupRules topic={t} managers={localPlayers()} rules={rules} setRules={setRules} onBack={() => go('setup-topic')}
        teamSummary={teamSummaryLocal} onEditTeams={() => go('setup-managers')} onReset={() => setRules({ ...RULE_DEFAULTS(), slots: [...t.slots] })}
        onStart={(r) => { saveRulePrefs(r); setDraft(createDraft(t, localPlayers(), r)); go('draft'); }} /> : null;
      break;
    }
    case 'tv-local':
      view = <LocalTv past={past} settings={settings} />;
      break;
    case 'draft':
      if (!draft) { view = null; setTimeout(() => go('home'), 0); break; }
      if (draft.phase === 'auction') view = <Auction d={draft} setDraft={setDraft} goHome={() => go('home')} flashing={!!flash} onFlash={setFlash} />;
      else if (draft.phase === 'freepick') view = <FreePick d={draft} setDraft={setDraft} goHome={() => go('home')} flashing={!!flash} onFlash={setFlash} />;
      else if (draft.phase === 'nominate') view = <Nominate d={draft} setDraft={setDraft} goHome={() => go('home')} />;
      else if (draft.phase === 'trade') view = <TradeWindow d={draft} setDraft={setDraft} goHome={() => go('home')} />;
      else view = <Results d={draft} past={past} showShame={settings.showShame} live onChange={setDraft} onBack={() => go('home')} onUndo={draft.mode === 'solo' ? null : () => setDraft((p) => undo(p))} onFinish={() => { setDraft(null); go('home'); }} onPlayAgain={playAgain} />;
      view = <NetCtx.Provider value={localNet}><div className={localTv ? 'tvmode' : ''}>{view}{localTv ? <TvExit onExit={() => setLocalTv(false)} /> : <TvSwitch onThisScreen={() => setLocalTv(true)} />}</div></NetCtx.Provider>;
      break;
    case 'past':
      view = <PastList past={past} onBack={() => go('home')} onOpen={(id) => go('past-view', { id })} onDelete={(id) => setPast((p) => p.filter((x) => x.id !== id))} />;
      break;
    case 'past-view': {
      const p = past.find((x) => x.id === screen.id);
      view = p ? <Results d={p} past={past} showShame={settings.showShame} onChange={(nd) => { setPast((ps) => ps.map((x) => (x.id === nd.id ? nd : x))); if (draft && draft.id === nd.id) setDraft({ ...draft, votes: nd.votes, votesRevealed: nd.votesRevealed, finale: nd.finale }); }} onBack={() => go('past')} /> : null;
      break;
    }
    case 'players':
      view = <ProfilesScreen past={past} settings={settings} setSettings={setSettings} onBack={() => go('home')} onOpen={(key) => go('player', { id: key })} onShame={() => go('shame')} />;
      break;
    case 'player':
      view = <ProfileView key={screen.id} past={past} settings={settings} setSettings={setSettings} pkey={screen.id} onBack={() => go('players')} />;
      break;
    case 'shame':
      view = <ShameScreen past={past} settings={settings} onBack={() => go('players')} />;
      break;
    case 'settings':
      view = <SettingsScreen onBack={() => go('home')} state={{ topics, past, draft, managers, settings }} settings={settings} setSettings={setSettings} rulePrefs={rulePrefs} saveRulePrefs={saveRulePrefs}
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
        onNew={() => { setDraft(null); setRules({ ...rulePrefs(), slots: [] }); go('setup-managers'); }}
        onSolo={() => { setDraft(null); go('solo-setup'); }}
        onOnline={() => go('online-home')}
        onPlayers={() => go('players')}
        onResume={() => go('draft')} onTopics={() => go('topics')} onPast={() => go('past')} onAbandon={() => setDraft(null)} />;
  }

  return (
    <AudioCtx.Provider value={{ cfg: audioCfg, set: setAudioCfg }}>
      {view}
      {flash && <Flash f={flash} onDone={() => setFlash(null)} />}
      {importing !== null && <ImportTopicSheet topics={topics} initial={importing} onClose={() => setImporting(null)} onImport={(t) => { setTopics((ts) => [...ts, t]); setToast('Added “' + t.name + '” to ' + t.folder + '.'); }} />}
      {app.updateReady && !toast && <div className="toast ok" role="status"><span className="grow">A new version of Draft Night is ready.</span><button onClick={() => app.applyUpdate()}>Reload</button></div>}
      {toast && <div className="toast" role="status"><span className="grow">{toast}</span><button onClick={() => setToast(null)}>OK</button></div>}
    </AudioCtx.Provider>
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

if (window.__DN_TEST__) window.__DN = { finale: { buildBracket, advanceBracket, nextMatchup, matchVoters, canVoteFor, decideMatchup, simulateMatch, playerRating, teamRating, matchupVoteBot, finaleMode, isFootball, startFinale, castMatchVote, botMatchVotes, playMatchup, resolveMatchup, getMatchup, needsVote, needsMatch, votingDone, finaleStandings, finaleRecord, championStory, goldenBoot, matchVoteProblem, roundName, FINALE_DEFAULTS, validRating, matchScript, revealedEvents, matchFrame, lineupOf, expectedGoals, strength2, squad }, audio, AUDIO_DEFAULTS, share: { encodeTopic, decodeShared, packTopic, unpackTopic, topicCode, shareLink, MAX_LINK }, stats: { careerStats, computeAwards, computeShame, hallOfShame, humanPlayers }, bots: { makeBots, nextBotAction, botDecision, botFreePickChoice, botVote, teamScore, voteChoices, itemFame, seeded, BOT_LEVELS, BOT_TYPES, botCardPlay, botVeto, botNominate, botTradeDecision, botTradeOffer }, twists: { twistRules, TWIST_DEFAULTS, playCard, answerCard, cardProblem, doubleProblem, nominate, currentNominator, nominationPool, botActors, botAdvisers, participants, visibleItem, isHidden, rarityOf, frozenNow, proposeTrade, acceptTrade, rejectTrade, cancelTrade, closeTrades, tradeProblem, openTrades, hasCard }, auction: { withdraw, isOut, auctionEnd, owesBid, withdrawProblem, outIds, owing, botPassers, botForcedBid, runAction, ownerInfo, migrateSettings, rulesLines }, topicsLib: { POPULARITY, popScore, byPopularity, folderOrder, favouritesOrder, prefsOf, isBuiltIn, folderOf, folderList, matchTopic, toggleIn }, DEFAULT_SOLO, isFlex, canBid, createDraft, placeBid, sell, skipItem, undo, freePick, currentPicker, canTake, nextAmount, isDraftOver, draftStats, winsBoard, tally, starterTopics, migrateTopics, validateBackup, makeBackup, wikiTitleFor, PHOTO_TOPICS, store, wiki, DEFAULT_RULES, COLORS, emptyCount, assignSlot, maxBid };
store.init().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(<Boundary><App /></Boundary>);
});

