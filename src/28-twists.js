/* ============================================================
   TWISTS: chaos cards, mystery items, rarity, teams, nomination, trades.
   Pure functions on the draft object. The UI and bots only call these, so
   humans and bots play by exactly the same rules.

   THE RULES (one clear outcome for everything)
   - Teams: in team mode each team is one bidder with one shared budget and
     roster. Cards, items and money belong to the team. Every player votes.
   - Chaos cards are dealt to each team at the start (N each, from the enabled
     types). A card is spent the moment it is played, even if it gets vetoed.
     · Steal  — before the first bid on an item: take one item from a rival
                team; pay them what they paid + the bid increment (min bid at
                least). You need an open slot for it and the money.
     · Swap   — before the first bid: swap one of your items for one of a
                rival's. Both must fit the other team's roster.
     · Freeze — before the first bid: one rival team can't bid on this item.
                One freeze per item.
     · Double — your bid counts double: bid $X, it counts as $2X, you pay $X
                if you win. Must beat the current bid. Returned if undone.
     · Veto   — only as a response: blocks a Steal, Swap or Freeze aimed at
                your team. A veto can't be vetoed.
   - Mystery: about 1 in N items (default 8) is auctioned face down. Mystery
     items go into any open slot, so being able to bid reveals nothing. The
     item, its photo and rarity are shown only once it is sold or picked.
   - Rarity: Common / Rare / Legendary, assigned once when the draft starts.
     Looks only; it does not change prices.
   - Nomination: teams take turns choosing the next item from what's left.
   - Trades: after the draft, a timed window. A trade is exactly one item for
     one item, plus optional money one way. The proposer offers, the other
     team must accept; it is re-checked and applied all at once. When the
     timer ends, anything not accepted expires.
   ============================================================ */

const TWIST_DEFAULTS = {
  chaos: { on: true, count: 2, steal: true, veto: true, double: true, swap: true, freeze: true },
  mystery: { on: true, every: 8 },
  rarity: { on: true, rare: 25, legendary: 5 },
  trades: { on: true, minutes: 3, money: true },
};
const CARD_INFO = {
  steal: { name: 'Steal', emoji: '🦹', text: 'Before the first bid: take one item from a rival team. You pay them what they paid + ' },
  swap: { name: 'Swap', emoji: '🔄', text: 'Before the first bid: swap one of your items for one of a rival’s. Both must fit.' },
  freeze: { name: 'Freeze', emoji: '🧊', text: 'Before the first bid: one rival team can’t bid on this item.' },
  double: { name: 'Double Bid', emoji: '✖️2', text: 'Your bid counts double. Bid $X, it counts as $2X, and you pay $X if you win.' },
  veto: { name: 'Veto', emoji: '🛑', text: 'Response only: blocks a Steal, Swap or Freeze aimed at your team.' },
};
const CARD_TYPES = ['steal', 'swap', 'freeze', 'double', 'veto'];
const ruleOn = (d, k) => !!(d && d.rules && d.rules[k] && d.rules[k].on);
const twistRules = (r) => ({ chaos: { ...TWIST_DEFAULTS.chaos, ...((r && r.chaos) || {}) }, mystery: { ...TWIST_DEFAULTS.mystery, ...((r && r.mystery) || {}) }, rarity: { ...TWIST_DEFAULTS.rarity, ...((r && r.rarity) || {}) }, trades: { ...TWIST_DEFAULTS.trades, ...((r && r.trades) || {}) } });

/* ---------- teams & players ---------- */
const teamOf = (d, id) => d.managers.find((m) => m.id === id);
// Everyone who votes: each player in team mode, each manager otherwise.
function participants(d) {
  if (!d.teamMode) return d.managers.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, color: m.color, teamId: m.id, bot: m.bot, human: m.human }));
  return d.managers.flatMap((t) => (t.members || []).map((p) => ({ ...p, color: t.color, teamId: t.id, teamName: t.name })));
}
const isBotTeam = (t) => !!(t && t.members && t.members.length && t.members.every((p) => p.bot));
// The "deciders" for bot play: individual bots, or every bot on an all-bot team acting for that team.
function botActors(d) {
  const out = [];
  d.managers.forEach((m) => {
    if (m.members) { if (isBotTeam(m)) m.members.forEach((p) => out.push({ ...m, name: p.name, bot: p.bot, speaker: p.id })); }
    else if (m.bot) out.push({ ...m, speaker: m.id });
  });
  return out;
}
// Bot teammates on a human's team advise instead of spending the team's money.
function botAdvisers(d) {
  const out = [];
  d.managers.forEach((m) => { if (m.members && !isBotTeam(m)) m.members.filter((p) => p.bot).forEach((p) => out.push({ ...m, name: p.name, bot: p.bot, speaker: p.id })); });
  return out;
}

/* ---------- mystery & rarity ---------- */
const isHidden = (d, id) => !!(d.items[id] && d.items[id].mystery && !(d.revealed || []).includes(id));
// What everyone (including bots) is allowed to see about an item.
function visibleItem(d, id) {
  const it = d.items[id];
  if (!it) return null;
  if (!isHidden(d, id)) return it;
  return { id, name: 'Mystery item', pos: '', desc: 'Face down until it’s sold', emoji: '❓', mystery: true, hidden: true };
}
const rarityOf = (d, id) => (isHidden(d, id) ? null : (d.rarity && d.rarity[id]) || null);
function assignRarity(ids, rules, seed) {
  const r = rules.rarity; if (!r || !r.on) return {};
  const leg = clamp(+r.legendary || 0, 0, 100), rare = clamp(+r.rare || 0, 0, 100 - leg);
  const out = {};
  ids.forEach((id) => { const u = unit('rarity', seed, id) * 100; out[id] = u < leg ? 'legendary' : u < leg + rare ? 'rare' : 'common'; });
  return out;
}
function pickMystery(ids, rules, seed) {
  const m = rules.mystery; if (!m || !m.on) return [];
  const every = Math.max(2, Math.round(+m.every || 8));
  const count = Math.floor(ids.length / every);
  return [...ids].sort((a, b) => unit('mys', seed, a) - unit('mys', seed, b)).slice(0, count);
}

/* ---------- chaos cards ---------- */
function dealCards(teamIds, rules, seed) {
  const c = rules.chaos; if (!c || !c.on) return {};
  const types = CARD_TYPES.filter((t) => c[t]);
  if (!types.length) return {};
  const n = clamp(Math.round(+c.count || 0), 0, 5);
  const out = {};
  teamIds.forEach((id) => {
    const rng = seeded('deal', seed, id);
    const pool = []; while (pool.length < n) { const r = [...types]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } pool.push(...r); }
    out[id] = pool.slice(0, n);
  });
  return out;
}
const hasCard = (d, teamId, card) => !!(d.cards && d.cards[teamId] && d.cards[teamId].includes(card));
const cardWindow = (d) => d.phase === 'auction' && !d.bid && !d.pending && !!currentItem(d);
const stealPrice = (d, t) => Math.max(d.rules.minBid, (t.price || 0) + d.rules.inc);
const frozenNow = (d, teamId) => !!(d.frozen && d.frozen[teamId] === d.reveal);
function removeCard(cards, teamId, card) { const a = [...(cards[teamId] || [])]; const i = a.indexOf(card); if (i >= 0) a.splice(i, 1); return { ...cards, [teamId]: a }; }
function slotOfItem(m, itemId) { return m.team.findIndex((t) => t && t.itemId === itemId); }

// Can `by` play `card` with these params right now? Returns an error message or null.
function cardProblem(d, by, card, p) {
  p = p || {};
  if (!ruleOn(d, 'chaos') || !d.rules.chaos[card]) return 'That card isn’t in this game.';
  if (!hasCard(d, by, card)) return 'You don’t have that card.';
  const me = teamOf(d, by);
  if (card === 'veto') return 'Veto can only be used when someone targets your team.';
  if (card === 'double') return null; // validated as a bid
  if (!cardWindow(d)) return 'Play this before the first bid on an item.';
  const them = teamOf(d, p.target);
  if (!them || them.id === by) return 'Pick a rival team.';
  if (card === 'freeze') {
    if (d.frozen && Object.values(d.frozen).includes(d.reveal)) return 'Someone is already frozen for this item.';
    if (isFull(them)) return 'That team is full already.';
    return null;
  }
  if (card === 'steal') {
    const k = slotOfItem(them, p.item); if (k < 0) return 'That team doesn’t own that item.';
    if (assignSlot(me, d.items[p.item], d.rules.slots) < 0) return 'You have no open slot for that item.';
    const price = stealPrice(d, them.team[k]);
    if (price > maxBid(me, d.rules)) return 'You need ' + money(price) + ' and can’t afford it.';
    return null;
  }
  if (card === 'swap') {
    const a = slotOfItem(me, p.mine), b = slotOfItem(them, p.item);
    if (a < 0 || b < 0) return 'Pick one of your items and one of theirs.';
    if (!swapFits(d, me, them, p.mine, p.item)) return 'Those two items don’t fit each other’s rosters.';
    return null;
  }
  return 'Unknown card.';
}
function swapFits(d, A, B, itemA, itemB) {
  const a = { ...A, team: A.team.map((t) => (t && t.itemId === itemA ? null : t)) };
  const b = { ...B, team: B.team.map((t) => (t && t.itemId === itemB ? null : t)) };
  return assignSlot(a, d.items[itemB], d.rules.slots) >= 0 && assignSlot(b, d.items[itemA], d.rules.slots) >= 0;
}
// Play a card. If the target holds a Veto, the play waits for their answer (d.pending).
function playCard(d, by, card, p) {
  if (cardProblem(d, by, card, p)) return d;
  const n = withHistory(d, 'Undo card');
  n.cards = removeCard(n.cards, by, card);
  const play = { id: uid(), by, card, target: p.target, item: p.item || null, mine: p.mine || null, reveal: d.reveal };
  if (hasCard(n, p.target, 'veto')) { n.pending = play; return n; }
  return applyCard(n, play);
}
function applyCard(n, play) {
  const me = n.managers.find((m) => m.id === play.by), them = n.managers.find((m) => m.id === play.target);
  let ok = !!(me && them), detail = '';
  if (ok && play.card === 'freeze') { n.frozen = { ...(n.frozen || {}), [them.id]: play.reveal }; detail = them.name + ' can’t bid on this item'; }
  if (ok && play.card === 'steal') {
    const k = slotOfItem(them, play.item); const slot = k >= 0 ? assignSlot(me, n.items[play.item], n.rules.slots) : -1;
    const price = k >= 0 ? stealPrice(n, them.team[k]) : 0;
    ok = k >= 0 && slot >= 0 && price <= maxBid(me, n.rules);
    if (ok) {
      them.team = them.team.map((t, i) => (i === k ? null : t)); them.budget += price;
      me.team = me.team.map((t, i) => (i === slot ? { itemId: play.item, price, stolen: true } : t)); me.budget -= price;
      detail = me.name + ' stole ' + n.items[play.item].name + ' for ' + money(price);
    }
  }
  if (ok && play.card === 'swap') {
    ok = slotOfItem(me, play.mine) >= 0 && slotOfItem(them, play.item) >= 0 && swapFits(n, me, them, play.mine, play.item);
    if (ok) {
      const ta = me.team[slotOfItem(me, play.mine)], tb = them.team[slotOfItem(them, play.item)];
      me.team = me.team.map((t) => (t && t.itemId === play.mine ? null : t)); them.team = them.team.map((t) => (t && t.itemId === play.item ? null : t));
      const sMe = assignSlot(me, n.items[play.item], n.rules.slots), sThem = assignSlot(them, n.items[play.mine], n.rules.slots);
      me.team = me.team.map((t, i) => (i === sMe ? { ...tb } : t));
      them.team = them.team.map((t, i) => (i === sThem ? { ...ta } : t));
      detail = me.name + ' swapped ' + n.items[play.mine].name + ' for ' + n.items[play.item].name;
    }
  }
  n.pending = null;
  n.cardLog = [...(n.cardLog || []), { ...play, result: ok ? 'done' : 'fizzled', detail: ok ? detail : 'It no longer worked, so nothing happened.' }];
  // A steal or swap can leave the current item unbuyable for everyone; re-check.
  return ok && play.card !== 'freeze' ? recheckCurrent(n) : n;
}
// Target's answer to a pending card.
function answerCard(d, useVeto) {
  if (!d.pending) return d;
  const play = d.pending;
  if (useVeto && hasCard(d, play.target, 'veto')) {
    const n = { ...d, cards: removeCard(d.cards, play.target, 'veto'), pending: null };
    n.cardLog = [...(n.cardLog || []), { ...play, result: 'vetoed', detail: teamOf(d, play.target).name + ' vetoed it' }];
    return n;
  }
  return applyCard({ ...d, managers: d.managers.map((m) => ({ ...m, team: [...m.team] })) }, play);
}
function recheckCurrent(n) {
  const id = n.queue[0];
  if (!id) return n;
  const someoneCan = n.managers.some((m) => !isFull(m) && assignSlot(m, n.items[id], n.rules.slots) >= 0 && maxBid(m, n.rules) >= n.rules.minBid);
  return someoneCan ? n : advance(n);
}
// Double Bid: pay $X, counts as $2X.
function doubleProblem(d, by, pay) {
  if (!ruleOn(d, 'chaos') || !d.rules.chaos.double) return 'Double Bid isn’t in this game.';
  if (!hasCard(d, by, 'double')) return 'You don’t have a Double Bid card.';
  const m = teamOf(d, by);
  if (!m || d.phase !== 'auction' || d.pending) return 'You can’t bid right now.';
  if (d.bid && d.bid.leaderId === by) return 'You’re already leading.';
  if (!canBid(d, m, pay)) return 'You can’t pay ' + money(pay) + '.';
  if (pay * 2 < nextAmount(d)) return 'Bid at least ' + money(Math.ceil(nextAmount(d) / 2)) + ' so it counts as ' + money(nextAmount(d)) + '.';
  return null;
}

/* ---------- nomination ---------- */
// Whose turn to nominate: teams take turns in setup order, skipping full teams.
function currentNominator(d) {
  const n = d.managers.length; const start = (d.nom && d.nom.idx) || 0;
  for (let k = 0; k < n; k++) { const m = d.managers[(start + k) % n]; if (!isFull(m)) return { m, idx: (start + k) % n }; }
  return null;
}
// Items that can be nominated: still in the pool and buyable by someone.
const nominationPool = (d) => d.queue.filter((id) => d.managers.some((m) => !isFull(m) && assignSlot(m, d.items[id], d.rules.slots) >= 0));
function nominate(d, itemId) {
  if (d.phase !== 'nominate') return d;
  const cur = currentNominator(d);
  if (!cur || !d.queue.includes(itemId)) return d;
  return { ...d, queue: [itemId, ...d.queue.filter((x) => x !== itemId)], nominated: itemId, nom: { idx: (cur.idx + 1) % d.managers.length, by: cur.m.id }, phase: 'auction', reveal: d.reveal + 1 };
}

/* ---------- trades ---------- */
function openTrades(n, now) {
  n.phase = 'trade';
  n.trade = { endsAt: (now || Date.now()) + Math.max(0.5, +n.rules.trades.minutes || 3) * 60000, proposals: [], done: false };
  return n;
}
const tradeOpen = (d, now) => d.phase === 'trade' && d.trade && (now || Date.now()) < d.trade.endsAt;
// Returns an error message, or null when the trade is valid right now.
function tradeProblem(d, t, now) {
  if (!tradeOpen(d, now)) return 'The trade window is closed.';
  const A = teamOf(d, t.from), B = teamOf(d, t.to);
  if (!A || !B || A.id === B.id) return 'Pick another team to trade with.';
  if (slotOfItem(A, t.give) < 0) return A.name + ' no longer owns ' + (d.items[t.give] || {}).name + '.';
  if (slotOfItem(B, t.get) < 0) return B.name + ' no longer owns ' + (d.items[t.get] || {}).name + '.';
  if (!swapFits(d, A, B, t.give, t.get)) return 'Those items don’t fit each other’s rosters.';
  const m = t.money;
  if (m && m.amount) {
    if (!d.rules.trades.money) return 'Money isn’t allowed in trades this game.';
    if (!(m.amount > 0) || Math.round(m.amount) !== m.amount) return 'Money must be a whole dollar amount.';
    const payer = teamOf(d, m.payer);
    if (!payer || (payer.id !== A.id && payer.id !== B.id)) return 'Only one of the two teams can pay.';
    if (payer.budget < m.amount) return payer.name + ' only has ' + money(payer.budget) + '.';
  }
  return null;
}
function proposeTrade(d, t, now) {
  const p = { id: uid(), from: t.from, to: t.to, give: t.give, get: t.get, money: t.money && t.money.amount ? { payer: t.money.payer, amount: t.money.amount } : null, status: 'pending', at: now || Date.now() };
  if (tradeProblem(d, p, now)) return d;
  if (d.trade.proposals.some((x) => x.status === 'pending' && x.from === p.from && x.to === p.to && x.give === p.give && x.get === p.get)) return d;
  return { ...d, trade: { ...d.trade, proposals: [...d.trade.proposals, p] } };
}
const setTradeStatus = (d, id, status, note) => ({ ...d, trade: { ...d.trade, proposals: d.trade.proposals.map((x) => (x.id === id ? { ...x, status, note: note || x.note } : x)) } });
// The receiving team accepts: re-check, then swap items and money in one step.
function acceptTrade(d, id, now) {
  const t = d.trade && d.trade.proposals.find((x) => x.id === id);
  if (!t || t.status !== 'pending') return d;
  const problem = tradeProblem(d, t, now);
  if (problem) return setTradeStatus(d, id, tradeOpen(d, now) ? 'invalid' : 'expired', problem);
  const n = { ...d, managers: d.managers.map((m) => ({ ...m, team: [...m.team] })) };
  const A = teamOf(n, t.from), B = teamOf(n, t.to);
  const ta = A.team[slotOfItem(A, t.give)], tb = B.team[slotOfItem(B, t.get)];
  A.team = A.team.map((x) => (x && x.itemId === t.give ? null : x)); B.team = B.team.map((x) => (x && x.itemId === t.get ? null : x));
  const sa = assignSlot(A, n.items[t.get], n.rules.slots); A.team = A.team.map((x, i) => (i === sa ? { ...tb, traded: true } : x));
  const sb = assignSlot(B, n.items[t.give], n.rules.slots); B.team = B.team.map((x, i) => (i === sb ? { ...ta, traded: true } : x));
  if (t.money && t.money.amount) { const payer = t.money.payer === A.id ? A : B; const payee = payer === A ? B : A; payer.budget -= t.money.amount; payee.budget += t.money.amount; }
  // Any other pending trade that involved these items is no longer valid.
  n.trade = { ...n.trade, proposals: n.trade.proposals.map((x) => (x.id === id ? { ...x, status: 'accepted' }
    : x.status === 'pending' && [x.give, x.get].some((it) => it === t.give || it === t.get) ? { ...x, status: 'invalid', note: 'One of these items was traded away.' } : x)) };
  return n;
}
const rejectTrade = (d, id) => { const t = d.trade && d.trade.proposals.find((x) => x.id === id); return t && t.status === 'pending' ? setTradeStatus(d, id, 'rejected') : d; };
const cancelTrade = (d, id) => { const t = d.trade && d.trade.proposals.find((x) => x.id === id); return t && t.status === 'pending' ? setTradeStatus(d, id, 'cancelled') : d; };
// Close the window: anything not accepted expires, then on to voting.
function closeTrades(d) {
  if (d.phase !== 'trade') return d;
  return { ...d, phase: 'done', trade: { ...d.trade, done: true, proposals: d.trade.proposals.map((x) => (x.status === 'pending' ? { ...x, status: 'expired' } : x)) } };
}
