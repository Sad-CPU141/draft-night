/* ============================================================
   SKIP RULES — limits on dodging items (Step 15)

   WHAT A "SKIP" IS IN DRAFT NIGHT
   Every item that comes up is handed to one manager in turn (rotating round the
   table; in Nomination mode it's the team that nominated it). That manager is
   "on the clock" for the item. If the item ends with NO bids, it counts as their
   skip. If anyone else buys it, nobody uses a skip. Automatic system skips (an item
   nobody could legally buy) never count, and an item is only handed to a manager who
   could legally take it (slot free, enough money for the minimum bid).

   FORCED PICKS NEVER BYPASS THE AUCTION
   When the manager on the clock can't skip, they're "on the hook": they can't tap
   I'm out on that item, anyone can still outbid them as normal, and if NOBODY bids
   they take it at the minimum bid. This is announced before bidding starts, so the
   price is never a surprise. Nothing is forced on a manager who can't legally take
   the item (full team, no slot, can't afford it, frozen by a card).

   PRECEDENCE (first rule that applies wins)
   1. Endgame Anti-Dodging, once only the last N items remain.
   2. No More Dodging: out of skips = must take your next item, for the rest of the draft.
   3. Skip Debt: out of skips = you may keep skipping, but every extra skip is a debt
      point and a manager in debt must take their next item(s) until it's repaid.
   4. "When a manager runs out of skips" (must take / final chance / escalating / none).

   Everything lives in the shared game state (d.sk), so refreshing, reconnecting or
   switching phones restores nothing. Online, only the host's copy of the game changes it.
   ============================================================ */
const SKIP_DEFAULTS = {
  on: true, max: 3, runOut: 'must', nmd: false, warn: true,
  endgame: { on: true, at: 3, allow: 0, style: 'must' },
  style: 'next', pref: 'rating', pickSecs: 20,
  debt: { on: false, clear: 'each' },
};
const SKIP_MAXES = [0, 1, 2, 3, 5, 10, -1]; // -1 = unlimited
// Drafts saved before Step 15 have no skip rules: they keep playing exactly as before.
function skipCfg(src) {
  const r = src && src.rules ? src.rules : src;
  const s = r && r.skip;
  if (!s) return { ...SKIP_DEFAULTS, on: false, endgame: { ...SKIP_DEFAULTS.endgame, on: false }, debt: { ...SKIP_DEFAULTS.debt } };
  return { ...SKIP_DEFAULTS, ...s, endgame: { ...SKIP_DEFAULTS.endgame, ...(s.endgame || {}) }, debt: { ...SKIP_DEFAULTS.debt, ...(s.debt || {}) } };
}
const skipRulesOn = (d) => { const c = skipCfg(d); return c.on || c.endgame.on; };
const emptySk = () => ({ used: {}, extra: {}, owe: {}, debt: {}, debtProg: {}, taken: {}, endUsed: {}, turn: 0, cur: null, offer: null, log: [] });
const skOf = (d) => ({ ...emptySk(), ...(d.sk || {}) });
const cloneSk = (d) => JSON.parse(JSON.stringify(skOf(d)));
const maxSkipsOf = (c) => (!c.on ? Infinity : c.max < 0 ? Infinity : c.max);

// Could this manager legally end up with this item at the minimum bid?
function eligibleFor(d, m, id) {
  const it = d.items[id];
  return !!(m && it && !isFull(m) && assignSlot(m, it, d.rules.slots) >= 0 && maxBid(m, d.rules) >= d.rules.minBid);
}
const endgameNow = (d) => { const c = skipCfg(d); return c.endgame.on && d.queue.length > 0 && d.queue.length <= c.endgame.at; };
// Progressive Pressure: the warning period before the endgame lock.
const endgameSoon = (d) => { const c = skipCfg(d); return c.endgame.on && c.endgame.style === 'pressure' && d.queue.length > c.endgame.at && d.queue.length <= c.endgame.at + 3; };

// May this manager skip their next item, and what would it cost? { ok, forced, cost, why, left }
function skipVerdict(d, mid) {
  const c = skipCfg(d); const s = skOf(d);
  if (!c.on && !c.endgame.on) return { ok: true, cost: null, left: Infinity };
  const left = Math.max(0, maxSkipsOf(c) - (s.used[mid] || 0));
  const end = endgameNow(d);
  if (end && (s.endUsed[mid] || 0) >= c.endgame.allow) return { ok: false, forced: true, why: 'endgame', left };
  if (!c.on) return { ok: true, cost: end ? 'end' : null, left };
  if (left > 0) return { ok: true, cost: 'normal', left, end };
  if (c.nmd) return { ok: false, forced: true, why: 'nmd', left };
  if (c.debt.on) return (s.debt[mid] || 0) > 0 ? { ok: false, forced: true, why: 'debt', left } : { ok: true, cost: 'debt', left, end };
  if (c.runOut === 'final') return (s.extra[mid] || 0) < 1 ? { ok: true, cost: 'final', left, end } : { ok: false, forced: true, why: 'out', left };
  if (c.runOut === 'escalate') {
    if ((s.owe[mid] || 0) > 0) return { ok: false, forced: true, why: 'escalate', left };
    return (s.extra[mid] || 0) < 2 ? { ok: true, cost: 'escalate', left, end } : { ok: false, forced: true, why: 'out', left };
  }
  if (c.runOut === 'none') return { ok: false, forced: false, why: 'none', left };
  return { ok: false, forced: true, why: 'out', left };
}

// The manager on the clock for the item on the block (or null).
function presenter(d) {
  const s = d.sk;
  if (!s || !s.cur || s.cur.reveal !== d.reveal || d.phase !== 'auction') return null;
  const m = d.managers.find((x) => x.id === s.cur.mid);
  return m ? { m, forced: !!s.cur.forced, why: s.cur.why, chosen: !!s.cur.chosen } : null;
}
const forcedPresenter = (d) => { const p = presenter(d); return p && p.forced ? p.m : null; };
// Can the forced manager still take this item right now? (Freeze cards and budgets can change.)
function forcedTakeOk(d, m) { const id = d.queue[0]; return !!(id && eligibleFor(d, m, id) && !frozenNow(d, m.id)); }

const pickRand = (d, salt, arr) => { if (!arr.length) return null; const r = seeded(d.seed || d.id, 'skip', salt, d.reveal); return arr[Math.floor(r() * arr.length) % arr.length]; };

// Called (on a mutable copy) when a new item reaches the block. Hands it to the next
// eligible manager, decides whether they're on the hook, and applies the forced-pick style.
function assignPresenter(n, nominatorId) {
  if (!skipRulesOn(n) || n.phase !== 'auction' || !n.queue.length) { if (n.sk) n.sk = { ...n.sk, cur: null }; return n; }
  const s = cloneSk(n); const N = n.managers.length; const id = n.queue[0];
  let start = nominatorId ? Math.max(0, n.managers.findIndex((m) => m.id === nominatorId)) : (s.turn || 0) % N;
  let mid = null;
  if (nominatorId) { const nm = n.managers[start]; if (eligibleFor(n, nm, id)) mid = nm.id; }
  else for (let k = 0; k < N; k++) { const m = n.managers[(start + k) % N]; if (eligibleFor(n, m, id)) { mid = m.id; s.turn = (start + k + 1) % N; break; } }
  n.sk = s;
  if (!mid) { s.cur = null; return n; }
  const v = skipVerdict(n, mid);
  s.cur = { reveal: n.reveal, mid, forced: !!v.forced, why: v.why || null };
  const c = skipCfg(n);
  if (!v.forced || nominatorId || n.rules.order === 'nominate' || c.style === 'next') return n;
  // Forced pick style: choose which eligible item they're on the hook for.
  const m = n.managers.find((x) => x.id === mid);
  const cands = n.queue.filter((x) => eligibleFor(n, m, x));
  if (!cands.length) return n;
  let pick = null;
  if (c.style === 'choose3') {
    const pool = [...cands]; const ids = [];
    while (ids.length < 3 && pool.length) { const x = pickRand(n, 'c3:' + ids.length, pool); ids.push(x); pool.splice(pool.indexOf(x), 1); }
    n.phase = 'forcepick'; s.offer = { mid, ids, reveal: n.reveal, why: v.why || null };
    return n;
  }
  if (c.style === 'auctioneer' && c.pref === 'rating' && isFootball(n.topic)) {
    const visible = cands.filter((x) => !n.items[x].mystery);
    const pool = visible.length ? visible : cands;
    pick = pool.slice().sort((a, b) => playerRating(n.items[b]).ovr - playerRating(n.items[a]).ovr || (a < b ? -1 : 1))[0];
  } else pick = pickRand(n, 'rand', cands);
  if (pick && pick !== n.queue[0]) n.queue = [pick, ...n.queue.filter((x) => x !== pick)];
  return n;
}
// Choose From 3: the manager on the hook picks one of the offered items.
function chooseForced(d, itemId) {
  const o = d.sk && d.sk.offer;
  if (d.phase !== 'forcepick' || !o || !o.ids.includes(itemId) || !d.queue.includes(itemId)) return d;
  const m = d.managers.find((x) => x.id === o.mid);
  if (!eligibleFor(d, m, itemId)) return d;
  const s = cloneSk(d); s.offer = null;
  const n = { ...d, queue: [itemId, ...d.queue.filter((x) => x !== itemId)], phase: 'auction', reveal: d.reveal + 1, bid: null, bids: [], sk: s };
  s.cur = { reveal: n.reveal, mid: o.mid, forced: true, why: o.why, chosen: true };
  return n;
}
// Countdown ran out (or the player is away): take one of the offered items.
function autoChooseForced(d) {
  const o = d.sk && d.sk.offer; if (d.phase !== 'forcepick' || !o) return d;
  const m = d.managers.find((x) => x.id === o.mid);
  const ok = o.ids.filter((x) => eligibleFor(d, m, x));
  return ok.length ? chooseForced(d, pickRand(d, 'auto', ok)) : { ...d, phase: 'auction', sk: { ...cloneSk(d), offer: null, cur: null } };
}

// What happens when the item on the block ends with no bids.
// { kind: 'forced' | 'charge' | 'bounce' | 'plain', m, cost, left }
function unsoldOutcome(d) {
  const p = presenter(d);
  if (!p) return { kind: 'plain' };
  if (p.forced) return forcedTakeOk(d, p.m) ? { kind: 'forced', m: p.m } : { kind: 'plain' };
  const v = skipVerdict(d, p.m.id);
  if (v.ok) return { kind: v.cost ? 'charge' : 'plain', m: p.m, cost: v.cost, end: !!v.end };
  if (v.why === 'none') return { kind: 'bounce', m: p.m };
  return forcedTakeOk(d, p.m) ? { kind: 'forced', m: p.m } : { kind: 'plain' };
}
// Record a used skip (mutates n.sk). Returns how many normal skips are left.
function chargeSkip(n, mid, cost, end) {
  const s = cloneSk(n);
  if (cost === 'normal') s.used[mid] = (s.used[mid] || 0) + 1;
  if (cost === 'final' || cost === 'escalate') s.extra[mid] = (s.extra[mid] || 0) + 1;
  if (cost === 'escalate') s.owe[mid] = 1; // must take your next item before the second extra skip
  if (cost === 'debt') s.debt[mid] = (s.debt[mid] || 0) + 1;
  if (end || cost === 'end') s.endUsed[mid] = (s.endUsed[mid] || 0) + 1;
  s.log = [...(s.log || []), { t: 'skip', mid, cost, item: n.queue[0] }].slice(-60);
  n.sk = s;
  return Math.max(0, maxSkipsOf(skipCfg(n)) - (s.used[mid] || 0));
}
// A forced pick was taken: it repays escalation and (if recovery is on) skip debt.
function repayForced(n, mid, itemId) {
  const s = cloneSk(n); const c = skipCfg(n);
  s.taken[mid] = (s.taken[mid] || 0) + 1;
  if ((s.owe[mid] || 0) > 0) s.owe[mid] = 0;
  if ((s.debt[mid] || 0) > 0) {
    if (c.debt.clear === 'each') s.debt[mid] -= 1;
    else if (c.debt.clear === 'two') { s.debtProg[mid] = (s.debtProg[mid] || 0) + 1; if (s.debtProg[mid] >= 2) { s.debt[mid] -= 1; s.debtProg[mid] = 0; } }
  }
  s.log = [...(s.log || []), { t: 'forced', mid, item: itemId }].slice(-60);
  n.sk = s;
}

// Short status for a manager's card: { text, tone } or null.
function skipChip(d, m) {
  const c = skipCfg(d); if (!skipRulesOn(d)) return null;
  const s = skOf(d); const p = presenter(d);
  if (p && p.m.id === m.id && p.forced) return { text: 'FORCED PICK', tone: 'hot' };
  if (isFull(m)) return null;
  const v = skipVerdict(d, m.id);
  if ((s.debt[m.id] || 0) > 0) return { text: 'Skip debt ' + s.debt[m.id], tone: 'hot' };
  if (!v.ok && v.forced) return { text: v.why === 'endgame' ? 'NO SKIPS (endgame)' : 'FORCED PICK NEXT', tone: 'hot' };
  if (!v.ok) return { text: 'NO SKIPS LEFT', tone: 'warn' };
  if (!c.on) return endgameNow(d) ? { text: 'Endgame skips ' + Math.max(0, c.endgame.allow - (s.endUsed[m.id] || 0)), tone: 'warn' } : null;
  if (c.max < 0) return null;
  if (v.cost === 'final') return { text: 'Final chance', tone: 'warn' };
  if (v.cost === 'escalate') return { text: 'Last-ditch skip', tone: 'warn' };
  if (v.cost === 'debt') return { text: 'Next skip = debt', tone: 'warn' };
  return { text: 'Skips ' + v.left + '/' + c.max, tone: v.left <= 1 ? 'warn' : '' };
}
// One line about the item on the block, for the auction screen.
function presenterLine(d) {
  const p = presenter(d); if (!p) return null;
  const who = p.m.name;
  if (p.forced) return { forced: true, text: '🔒 ' + who + ' is out of skips' + (p.why === 'endgame' ? ' (endgame)' : '') + ': if nobody bids, ' + who + ' takes it for ' + money(d.rules.minBid) + '.' };
  const v = skipVerdict(d, p.m.id); const c = skipCfg(d);
  if (!v.ok && v.why === 'none') return { text: '🎯 ' + who + '’s item · no skips left: if nobody bids it goes to the back' };
  if (!v.cost) return { text: '🎯 ' + who + '’s item' };
  const tail = v.cost === 'normal' ? (c.max < 0 ? '' : ' (' + v.left + ' left)') : v.cost === 'debt' ? ' · it adds 1 skip debt' : v.cost === 'final' ? ' · their final chance' : v.cost === 'escalate' ? ' · a last-ditch skip' : '';
  return { text: '🎯 ' + who + '’s item · if nobody bids, it uses one of their skips' + tail };
}
// Why this manager can't drop out (I'm out) of the item, or null.
function skipWithdrawProblem(d, id) {
  const f = forcedPresenter(d);
  return f && f.id === id && forcedTakeOk(d, f) ? 'No more dodging: you’re out of skips, so you can’t drop out of this item. If nobody bids, you take it for ' + money(d.rules.minBid) + '.' : null;
}
// Nomination: a nominator who's out of skips may only nominate items they could take.
function nominationAllowed(d, mid, id) {
  if (!skipRulesOn(d)) return true;
  const v = skipVerdict(d, mid);
  return !v.forced || eligibleFor(d, d.managers.find((m) => m.id === mid), id);
}
// Bots: the manager on the clock may open at the minimum bid to save a precious skip.
function botSkipSave(d) {
  const p = presenter(d);
  if (!p || p.forced || d.bid || !skipRulesOn(d)) return null;
  const a = botActors(d).find((x) => x.id === p.m.id);
  if (!a || !canBid(d, p.m, d.rules.minBid)) return null;
  const v = skipVerdict(d, p.m.id);
  const precious = v.cost && (v.cost !== 'normal' || v.left <= 1) || endgameNow(d);
  if (!precious) return null;
  const type = a.bot.type;
  if (type === 'chaos' && seeded(d.seed || d.id, 'save', d.reveal)() < 0.5) return null;
  return { botId: a.id, speaker: a.speaker || a.id, amount: d.rules.minBid, delay: 1600, event: 'bid' };
}
// Choose From 3 for a bot: the offered item it values most.
function botForcedChoice(d) {
  const o = d.sk && d.sk.offer; if (!o) return null;
  const a = botActors(d).find((x) => x.id === o.mid) || d.managers.find((m) => m.id === o.mid);
  if (!a) return null;
  const m = d.managers.find((x) => x.id === o.mid);
  const ok = o.ids.filter((x) => eligibleFor(d, m, x));
  const best = ok.map((id) => ({ id, s: botValue(d, a, visibleItem(d, id), () => 0.5) })).sort((x, y) => y.s - x.s)[0];
  return best ? best.id : null;
}
// Plain-language summary for the Review tab and lobbies.
function skipRulesLines(rules) {
  const c = skipCfg(rules); const L = [];
  if (!c.on && !c.endgame.on) return [['🔁', 'Skip limits: off (anyone can let items go unsold)']];
  if (c.on) {
    L.push(['🔁', 'Skip limit: ' + (c.max < 0 ? 'unlimited' : c.max) + ' per manager' + (c.nmd ? ' · No More Dodging: then you must take your next item' : c.debt.on ? ' · then Skip Debt (' + { each: 'each forced pick repays 1', two: 'every 2 forced picks repay 1', end: 'never repaid' }[c.debt.clear] + ')' : ' · then ' + { must: 'must take the next item', final: 'one final chance, then must take', escalate: 'escalating: 2 last-ditch skips with a forced pick between', none: 'no forced picks (unbid items go to the back)' }[c.runOut])]);
    if (rules.order !== 'nominate') L.push(['🎯', 'Forced pick style: ' + { next: 'the next item', choose3: 'choose from 3 (' + c.pickSecs + 's)', auctioneer: 'auctioneer’s choice (' + (c.pref === 'rating' ? 'highest rated on football topics, random otherwise' : 'random') + ')', random: 'random eligible item' }[c.style]]);
  } else L.push(['🔁', 'Skip limit: off']);
  if (c.endgame.on) L.push(['⏳', 'Endgame Anti-Dodging: last ' + c.endgame.at + ' items · ' + c.endgame.allow + ' skip' + (c.endgame.allow === 1 ? '' : 's') + ' allowed' + (c.endgame.style === 'pressure' ? ' · warnings 3 items before' : '')]);
  return L;
}
