/* ============================================================
   PICKING THE WINNER: ratings, match simulator, brackets.
   Plain functions; the screens only display what these return.

   RATINGS — football topics only (topics using the Pitch layout).
   These are ESTIMATED GAME RATINGS made by Draft Night from what's on the
   card (accolades, position) plus a fixed per-player offset. They are not
   official EA Sports FC / FIFA ratings. The same player always gets the
   same numbers. A topic can override any player's overall rating.

   TEAM RATING (1–99) — not a sum, so bigger squads don't win by default:
   · Base: average of player overalls weighted 1, 0.92, 0.85… (best first),
     so one superstar helps but can't carry a weak team alone.
   · Coverage: −4 with no goalkeeper, −2 for each missing DEF/MID/FWD line.
   · Depth: empty slots count as a 40-rated player.
   · Chemistry: +1 if every line is covered, +1 if at least two players share
     a club or country (max +2).
   · Provisional when the squad isn't full or has no goalkeeper.

   MATCHES — a seeded simulation, so a finished match never changes when you
   look at it again. Expected goals come from attack (shooting, passing,
   dribbling) against defence (defending, physical, goalkeeper). Upsets
   happen. Knockout games go to extra time, then penalties.
   ============================================================ */

const isFootball = (topic) => !!topic && topic.layout === 'pitch';
const ATTRS = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
const ROLE_SHAPE = {
  GK: { PAC: 0.55, SHO: 0.25, PAS: 0.65, DRI: 0.45, DEF: 1.02, PHY: 0.88 },
  DEF: { PAC: 0.82, SHO: 0.52, PAS: 0.76, DRI: 0.72, DEF: 1.02, PHY: 0.97 },
  MID: { PAC: 0.86, SHO: 0.84, PAS: 1.02, DRI: 0.97, DEF: 0.72, PHY: 0.82 },
  FWD: { PAC: 0.97, SHO: 1.03, PAS: 0.82, DRI: 0.98, DEF: 0.42, PHY: 0.82 },
};
const roleOf = (item, slot) => ROW_OF[norm(item && item.pos)] || ROW_OF[norm(slot)] || 'MID';

// "Now" (as they play today) or "Prime" (at their peak) — every player number says which.
function eraOf(topic) {
  if (topic && (topic.era === 'now' || topic.era === 'prime')) return topic.era;
  return topic && /\b(current|now|today|this season|20[2-3]\d)\b/i.test(topic.name || '') ? 'now' : 'prime';
}
const eraWord = (topic) => (eraOf(topic) === 'now' ? 'Now' : 'Prime');
// Display setting (Settings → Display): hide the numbers without changing how matches play.
const numbersShown = () => typeof document === 'undefined' || document.documentElement.getAttribute('data-numbers') !== 'off';
const validRating = (v) => v != null && v !== '' && !isNaN(+v) && +v >= 1 && +v <= 99;
function playerRating(item) {
  const fixed = validRating(item.rating);
  const ovr = fixed ? clamp(Math.round(+item.rating), 1, 99) : clamp(Math.round(68 + itemFame(item) * 27 + (unit('ovr', item.name) - 0.5) * 6), 55, 97);
  const shape = ROLE_SHAPE[roleOf(item)];
  const attrs = {};
  ATTRS.forEach((a) => { attrs[a] = clamp(Math.round(ovr * shape[a] + (unit('attr', item.name, a) - 0.5) * 10), 20, 99); });
  return { ovr, attrs, role: roleOf(item), estimated: !fixed };
}

function teamRating(d, m) {
  const slots = d.rules.slots;
  const players = m.team.map((t, i) => (t ? { item: d.items[t.itemId], slot: slots[i], r: playerRating(d.items[t.itemId]) } : null)).filter(Boolean);
  const ovrs = [...players.map((p) => p.r.ovr), ...slots.slice(players.length).map(() => 40)].sort((a, b) => b - a);
  let wsum = 0, vsum = 0; ovrs.forEach((o, i) => { const w = Math.pow(0.92, i); wsum += w; vsum += w * o; });
  const base = ovrs.length ? vsum / wsum : 40;
  const lines = new Set(players.map((p) => roleOf(p.item, p.slot)));
  const reasons = [];
  let coverage = 0;
  if (!lines.has('GK')) { coverage -= 4; reasons.push('No goalkeeper (−4)'); }
  ['DEF', 'MID', 'FWD'].forEach((l) => { if (!lines.has(l)) { coverage -= 2; reasons.push('No ' + l + ' (−2)'); } });
  let chem = 0;
  if (['GK', 'DEF', 'MID', 'FWD'].every((l) => lines.has(l))) { chem += 1; reasons.push('Every line covered (+1)'); }
  const ties = {}; players.forEach((p) => { const k = KIT_RX.filter(([, rx]) => rx.test((p.item.desc || '') + ' ' + p.item.name)).map(([k2]) => k2)[0]; if (k) ties[k] = (ties[k] || 0) + 1; });
  const link = Object.entries(ties).find(([, n]) => n >= 2);
  if (link) { chem += 1; reasons.push('Shared club/country: ' + link[0].replace(/\b\w/g, (c) => c.toUpperCase()) + ' (+1)'); }
  const provisional = players.length < slots.length || !lines.has('GK');
  if (players.length < slots.length) reasons.push((slots.length - players.length) + ' empty slot' + (slots.length - players.length === 1 ? '' : 's') + ' count as 40-rated');
  return { rating: clamp(Math.round(base + coverage + chem), 1, 99), base: Math.round(base * 10) / 10, coverage, chem, provisional, reasons, players };
}

/* ---------- match simulator ---------- */
const COMMENT = {
  goal: ['GOAL! {p} finds the net!', 'What a finish from {p}!', '{p} buries it!', 'It’s in! {p} with the goal!', '{p} scores — the crowd erupts!'],
  assist: [' Lovely ball from {a}.', ' {a} with the assist.', ' Set up beautifully by {a}.'],
  yellow: ['Yellow card for {p}.', '{p} goes into the book.'],
  red: ['RED CARD! {p} is sent off!'],
  chance: ['{p} goes close!', 'Big chance for {p}… just wide!', 'Great save to deny {p}!'],
  kickoff: ['And we’re under way!'],
  half: ['Half-time.'],
  full: ['Full-time!'],
  et: ['We’re going to extra time!'],
  pens: ['It’s going to penalties!'],
};
const pickLine = (rng, k, vars) => { const ls = COMMENT[k]; return ls[Math.floor(rng() * ls.length)].replace(/\{(\w)\}/g, (_, v) => (vars && vars[v]) || ''); };
function squad(d, m) {
  const rows = m.team.map((t, i) => (t ? { name: d.items[t.itemId].name, role: roleOf(d.items[t.itemId], d.rules.slots[i]), r: playerRating(d.items[t.itemId]) } : null)).filter(Boolean);
  return rows;
}
function strength(sq) {
  if (!sq.length) return { att: 1, def: 1 };
  const avg = (rows, fn) => (rows.length ? rows.reduce((a, x) => a + fn(x), 0) / rows.length : 40);
  const out = sq.filter((p) => p.role !== 'GK');
  const att = avg(out, (p) => (p.r.attrs.SHO * 1.1 + p.r.attrs.DRI + p.r.attrs.PAS * 0.8 + p.r.attrs.PAC * 0.6) / 3.5);
  const gk = sq.find((p) => p.role === 'GK');
  const def = avg(sq.filter((p) => p.role !== 'FWD'), (p) => (p.r.attrs.DEF * 1.1 + p.r.attrs.PHY * 0.7) / 1.8) * 0.75 + (gk ? gk.r.attrs.DEF : 45) * 0.25;
  return { att, def };
}
const weighted = (rng, rows, w) => { const tot = rows.reduce((a, x) => a + w(x), 0); let u = rng() * tot; for (const x of rows) { u -= w(x); if (u <= 0) return x; } return rows[rows.length - 1]; };
/* ---------- match engine v2: strength → expected goals → score → timeline ----------
   1. Strength (averages, never sums, so bigger squads don't win by default):
      attack from forwards/midfielders' shooting, dribbling and pace; midfield from passing,
      dribbling and physical; defence from defenders' defending; the keeper's rating. Empty
      slots weaken a team a little.
   2. Expected goals: 1.3 × (attack ÷ opponent defence)^1.7 × (midfield ratio)^0.5 × keeper
      factor, clamped to 0.2–3.6. Optional home advantage: +0.15 to the home side.
   3. The score is drawn from a Poisson distribution with those means (seeded), so the
      stronger side usually wins but draws and upsets happen.
   4. A timeline is built around that fixed score: every goal gets a minute, a scorer and a
      passing move; chances that are saved, missed or blocked and moves broken up by tackles
      fill the rest. The animation only plays this timeline, so the shown score always ends
      on the recorded result. */
const avgOf = (rows, fn, fallback) => (rows.length ? rows.reduce((a, x) => a + fn(x), 0) / rows.length : fallback);
function strength2(sq, emptySlots) {
  const by = (r) => sq.filter((p) => p.role === r);
  const fwd = by('FWD'), mid = by('MID'), def = by('DEF'), gk = by('GK')[0];
  const outfield = sq.filter((p) => p.role !== 'GK');
  const attackers = fwd.length ? [...fwd, ...mid] : mid.length ? mid : outfield;
  const att = avgOf(attackers, (p) => p.r.attrs.SHO * 0.45 + p.r.attrs.DRI * 0.25 + p.r.attrs.PAC * 0.2 + p.r.attrs.PAS * 0.1, 40);
  const md = avgOf(mid.length ? mid : outfield, (p) => p.r.attrs.PAS * 0.5 + p.r.attrs.DRI * 0.3 + p.r.attrs.PHY * 0.2, 40);
  const df = avgOf(def.length ? def : outfield, (p) => p.r.attrs.DEF * 0.6 + p.r.attrs.PHY * 0.25 + p.r.attrs.PAC * 0.15, 40) * (def.length ? 1 : 0.85);
  const keeper = gk ? gk.r.attrs.DEF : 42;
  const depth = Math.max(0.7, 1 - 0.05 * (emptySlots || 0));
  return { att: att * depth, mid: md * depth, def: df * depth, gk: keeper };
}
function poisson(rng, lambda) { const L = Math.exp(-lambda); let k = 0, p = 1; do { k++; p *= rng(); } while (p > L && k < 20); return k - 1; }
function expectedGoals(st, home) {
  return [0, 1].map((i) => {
    const o = st[1 - i];
    let x = 1.3 * Math.pow(st[i].att / o.def, 1.7) * Math.pow(st[i].mid / o.mid, 0.5) * Math.pow(68 / Math.max(30, o.gk), 0.6);
    if (home === i) x += 0.15;
    return clamp(x, 0.2, 3.2);
  });
}
// Simulate a match between managers A and B. knockout: must produce a winner. opts.home: 0 or 1.
function simulateMatch(d, A, B, key, knockout, opts) {
  const rng = seeded(d.seed, 'match', key, A.id, B.id);
  const sq = [squad(d, A), squad(d, B)];
  const empty = [A, B].map((m) => d.rules.slots.length - m.team.filter(Boolean).length);
  const notes = [];
  if (!sq[0].length || !sq[1].length) {
    const w = sq[0].length ? 0 : 1;
    return { v: 2, score: [w === 0 ? 3 : 0, w === 1 ? 3 : 0], pens: null, et: false, winner: w, events: [{ min: 0, type: 'note', text: (w === 0 ? B : A).name + ' has no players, so the match is awarded 3–0.' }], seqs: [], stats: { shots: [0, 0], possession: [50, 50] }, notes: ['Walkover: a team had no players.'], forfeit: true, xg: [0, 0] };
  }
  sq.forEach((s, i) => { if (!s.some((p) => p.role === 'GK')) notes.push((i ? B : A).name + ' has no goalkeeper, so an outfield player goes in goal.'); });
  const st = sq.map((s, i) => strength2(s, empty[i]));
  const home = opts && (opts.home === 0 || opts.home === 1) ? opts.home : null;
  const xg = expectedGoals(st, home);
  const goals = xg.map((x) => poisson(rng, x));
  const stoppage = 1 + Math.floor(rng() * 5);
  const seqs = [];
  const pick = (rows, w) => weighted(rng, rows, w);
  const shooterW = (p) => (p.role === 'FWD' ? 3 : p.role === 'MID' ? 1.5 : p.role === 'DEF' ? 0.4 : 0.02) * p.r.attrs.SHO;
  const outfield = (i) => sq[i].filter((p) => p.role !== 'GK').length ? sq[i].filter((p) => p.role !== 'GK') : sq[i];
  const keeperOf = (i) => (sq[i].find((p) => p.role === 'GK') || [...sq[i]].sort((a, b2) => b2.r.attrs.DEF - a.r.attrs.DEF)[0]).name;
  // A passing move for team i ending with `last` on the ball.
  const chainTo = (i, last) => {
    const pool = outfield(i).filter((p) => p.name !== last.name);
    const n = Math.min(pool.length, 1 + Math.floor(rng() * 3));
    const used = new Set([last.name]); const chain = [];
    for (let k = 0; k < n; k++) {
      const cand = pool.filter((p) => !used.has(p.name)); if (!cand.length) break;
      const w = (p) => (k === 0 ? (p.role === 'DEF' ? 2 : p.role === 'MID' ? 2.5 : 0.6) : (p.role === 'MID' ? 2.5 : p.role === 'FWD' ? 1.8 : 0.5)) * p.r.attrs.PAS;
      const p = pick(cand, w); used.add(p.name); chain.push(p.name);
    }
    chain.push(last.name);
    return chain;
  };
  const minutesUsed = new Set();
  const minuteIn = (lo, hi) => { for (let t = 0; t < 40; t++) { const m = lo + Math.floor(rng() * (hi - lo + 1)); if (!minutesUsed.has(m)) { minutesUsed.add(m); return m; } } return lo + Math.floor(rng() * (hi - lo + 1)); };
  const addMoves = (lo, hi, gl, scaleChances, inET) => {
    const start = seqs.length;
    [0, 1].forEach((i) => {
      for (let g = 0; g < gl[i]; g++) {
        const scorer = pick(outfield(i), shooterW);
        const chain = chainTo(i, scorer);
        const assist = chain.length > 1 && rng() < 0.8 ? chain[chain.length - 2] : null;
        seqs.push({ min: minuteIn(lo, hi), team: i, kind: 'goal', chain, shooter: scorer.name, assist, keeper: keeperOf(1 - i), side: rng() < 0.5 ? -1 : 1 });
      }
      const chances = Math.round((1 + poisson(rng, xg[i] * 2.1)) * scaleChances);
      for (let c = 0; c < chances; c++) {
        const shooter = pick(outfield(i), shooterW);
        const u = rng(); const kind = u < 0.45 ? 'save' : u < 0.8 ? 'miss' : 'block';
        const blocker = kind === 'block' ? pick(outfield(1 - i), (p) => p.r.attrs.DEF + (p.role === 'DEF' ? 30 : 0)).name : null;
        seqs.push({ min: minuteIn(lo, hi), team: i, kind, chain: chainTo(i, shooter), shooter: shooter.name, keeper: keeperOf(1 - i), blocker, side: rng() < 0.5 ? -1 : 1 });
      }
    });
    // Moves broken up in midfield: more of them for the side that wins the midfield battle.
    const breaks = Math.round((4 + Math.floor(rng() * 4)) * scaleChances);
    for (let k = 0; k < breaks; k++) {
      const i = rng() < st[0].mid / (st[0].mid + st[1].mid) ? 1 : 0; // team i loses the ball
      const carrier = pick(outfield(i), (p) => (p.role === 'MID' ? 2 : 1) * p.r.attrs.DRI);
      const tackler = pick(outfield(1 - i), (p) => (p.role === 'DEF' ? 2 : p.role === 'MID' ? 1.5 : 0.6) * p.r.attrs.DEF);
      seqs.push({ min: minuteIn(lo, hi), team: i, kind: rng() < 0.5 ? 'tackle' : 'intercept', chain: chainTo(i, carrier), tackler: tackler.name, side: rng() < 0.5 ? -1 : 1 });
    }
    if (inET) for (let k = start; k < seqs.length; k++) seqs[k].et = true;
  };
  addMoves(1, 90 + stoppage, goals, 1);
  let et = false, pens = null; const etGoals = [0, 0];
  if (knockout && goals[0] === goals[1]) {
    et = true;
    const extra = xg.map((x) => poisson(rng, x * 0.3));
    etGoals[0] = extra[0]; etGoals[1] = extra[1];
    minutesUsed.clear();
    addMoves(91, 120, extra, 0.35, true);
  }
  seqs.sort((a, b2) => (a.et ? 1 : 0) - (b2.et ? 1 : 0) || a.min - b2.min);
  const score = [goals[0] + etGoals[0], goals[1] + etGoals[1]];
  // Commentary events, in order, with the running score on goals.
  const events = [{ min: 0, type: 'kickoff', text: pickLine(rng, 'kickoff') }];
  const run = [0, 0]; const cards = [{}, {}];
  const shots = [0, 0];
  let halfDone = false, fullDone = false, etDone = false;
  seqs.forEach((q, idx) => {
    if (!halfDone && q.min > 45) { halfDone = true; events.push({ min: 45, type: 'half', score: [...run], text: pickLine(rng, 'half') }); }
    if (q.et && !fullDone) { fullDone = true; if (!halfDone) { halfDone = true; events.push({ min: 45, type: 'half', score: [...run], text: pickLine(rng, 'half') }); } events.push({ min: 90 + stoppage, type: 'full', score: [...run], text: pickLine(rng, 'full') }); }
    if (q.et && !etDone) { etDone = true; events.push({ min: 91, type: 'et', text: pickLine(rng, 'et') }); }
    q.i = idx;
    if (q.kind === 'goal') {
      run[q.team]++; shots[q.team]++;
      events.push({ min: q.min, type: 'goal', team: q.team, player: q.shooter, assist: q.assist, score: [...run], seq: idx, text: pickLine(rng, 'goal', { p: q.shooter }) + (q.assist ? pickLine(rng, 'assist', { a: q.assist }) : '') });
    } else if (q.kind === 'save' || q.kind === 'miss' || q.kind === 'block') {
      shots[q.team]++;
      const text = q.kind === 'save' ? 'Great save by ' + q.keeper + ' to deny ' + q.shooter + '!' : q.kind === 'miss' ? q.shooter + ' shoots… just wide!' : q.blocker + ' throws himself in front of ' + q.shooter + '’s shot!';
      events.push({ min: q.min, type: 'chance', team: q.team, player: q.shooter, seq: idx, text });
    } else {
      const text = q.kind === 'tackle' ? 'Strong tackle from ' + q.tackler + ' to win it back.' : q.tackler + ' reads the pass and intercepts.';
      events.push({ min: q.min, type: 'tackle', team: 1 - q.team, player: q.tackler, seq: idx, text });
      if (rng() < 0.12) { const t = 1 - q.team; const p = q.tackler; if (cards[t][p] || rng() < 0.05) { events.push({ min: q.min, type: 'red', team: t, player: p, text: pickLine(rng, 'red', { p }) }); } else { cards[t][p] = 1; events.push({ min: q.min, type: 'yellow', team: t, player: p, text: pickLine(rng, 'yellow', { p }) }); } }
    }
  });
  if (!halfDone) events.push({ min: 45, type: 'half', score: [0, 1].map((t) => seqs.filter((q) => q.kind === 'goal' && q.team === t && !q.et && q.min <= 45).length), text: pickLine(rng, 'half') });
  if (!fullDone) events.push({ min: 90 + stoppage, type: 'full', score: [goals[0], goals[1]], text: pickLine(rng, 'full') });
  if (et && !etDone) events.push({ min: 91, type: 'et', text: pickLine(rng, 'et') });
  if (et && score[0] === score[1]) {
    events.push({ min: 120, type: 'pens', text: pickLine(rng, 'pens') });
    pens = [0, 0];
    const gkr = sq.map((s) => (s.find((p) => p.role === 'GK') || { r: { attrs: { DEF: 50 } } }).r.attrs.DEF);
    const takers = sq.map((s) => [...s].sort((a, b2) => b2.r.attrs.SHO - a.r.attrs.SHO));
    for (let k = 0; k < 30; k++) {
      for (let i = 0; i < 2; i++) {
        const p = takers[i][k % takers[i].length];
        const scored = rng() < clamp(0.62 + (p.r.attrs.SHO - gkr[1 - i]) / 220, 0.45, 0.9);
        if (scored) pens[i]++;
        events.push({ min: 120, type: 'pen', team: i, player: p.name, scored, pens: [...pens], keeper: keeperOf(1 - i), side: rng() < 0.5 ? -1 : 1, text: p.name + (scored ? ' scores!' : ' misses!') });
      }
      if (k >= 4 && pens[0] !== pens[1]) break;
      if (k < 4) { const left = 4 - k; if (pens[0] > pens[1] + left || pens[1] > pens[0] + left) break; }
    }
  }
  const winner = score[0] !== score[1] ? (score[0] > score[1] ? 0 : 1) : pens ? (pens[0] > pens[1] ? 0 : 1) : null;
  const poss0 = clamp(Math.round(50 + (st[0].mid - st[1].mid) * 0.8 + (rng() - 0.5) * 6), 30, 70);
  return { v: 2, score, et, pens, winner, events, seqs, stats: { shots, possession: [poss0, 100 - poss0] }, notes, xg: xg.map((x) => Math.round(x * 100) / 100), stoppage, home };
}

/* ---------- bracket ---------- */
// Seeds: football by team rating, otherwise by the bots' neutral team score. Top seeds get byes.
function seedTeams(d) {
  const score = (m) => (isFootball(d.topic) ? teamRating(d, m).rating : teamScore(d, m, null));
  return [...d.managers].filter((m) => m.team.some(Boolean)).sort((a, b) => score(b) - score(a) || (a.id < b.id ? -1 : 1));
}
function buildBracket(d) {
  const seeds = seedTeams(d);
  let size = 1; while (size < seeds.length) size *= 2;
  // Standard seeding order (1 v N, 2 v N-1 …) so byes go to the top seeds.
  let order = [1];
  while (order.length < size) order = order.flatMap((s) => [s, order.length * 2 + 1 - s]);
  const slot = (n) => (n <= seeds.length ? seeds[n - 1].id : null);
  const first = [];
  for (let i = 0; i < size; i += 2) first.push({ id: 'r0m' + i / 2, a: slot(order[i]), b: slot(order[i + 1]) });
  const rounds = [first];
  while (rounds[rounds.length - 1].length > 1) { const prev = rounds[rounds.length - 1]; const next = []; for (let i = 0; i < prev.length; i += 2) next.push({ id: 'r' + rounds.length + 'm' + i / 2, a: null, b: null }); rounds.push(next); }
  return advanceBracket({ rounds: rounds.map((r) => r.map((m) => ({ ...m, winner: null, votes: {}, match: null, why: '' }))) });
}
// Fill each round from the one before. A match with only one team is a bye;
// a match is only resolved once both of its feeder matches are decided.
function advanceBracket(b) {
  const rounds = b.rounds.map((r) => r.map((m) => ({ ...m })));
  for (let r = 0; r < rounds.length; r++) {
    rounds[r].forEach((m, i) => {
      let ready = true;
      if (r > 0) {
        const f1 = rounds[r - 1][i * 2], f2 = rounds[r - 1][i * 2 + 1];
        ready = !!(f1.winner && f2.winner);
        m.a = f1.winner && f1.winner !== 'none' ? f1.winner : null;
        m.b = f2.winner && f2.winner !== 'none' ? f2.winner : null;
      }
      if (m.winner || !ready) return;
      if (m.a && !m.b) { m.winner = m.a; m.why = 'Bye'; }
      else if (m.b && !m.a) { m.winner = m.b; m.why = 'Bye'; }
      else if (!m.a && !m.b) m.winner = 'none';
    });
  }
  const final = rounds[rounds.length - 1][0];
  return { ...b, rounds, champion: final.winner && final.winner !== 'none' ? final.winner : null };
}
// The next matchup still to be played (earliest round first), or null when finished.
function nextMatchup(b) {
  for (let r = 0; r < b.rounds.length; r++) for (let i = 0; i < b.rounds[r].length; i++) { const m = b.rounds[r][i]; if (!m.winner && m.a && m.b) return { r, i, m }; }
  return null;
}
// Who may vote on A vs B: players on neither team. If that's nobody, every player votes,
// still never for their own team.
function matchVoters(d, m) {
  const ppl = participants(d);
  const neutral = ppl.filter((p) => p.teamId !== m.a && p.teamId !== m.b);
  return neutral.length ? neutral : ppl;
}
const canVoteFor = (p, teamId) => p.teamId !== teamId;
function matchupVoteBot(d, p, m) {
  const choices = [m.a, m.b].filter((id) => canVoteFor(p, id)).map((id) => teamOf(d, id));
  if (choices.length < 2) return choices[0] ? choices[0].id : null;
  const judge = { ...teamOf(d, p.teamId), name: p.name, bot: p.bot, speaker: p.id };
  const rng = seeded(d.seed, 'mvote', m.id, p.id, m.revoted ? 'again' : '');
  const sc = (t) => (isFootball(d.topic) ? teamRating(d, t).rating * 3 : 0) + teamScore(d, t, judge) * (1 + (rng() - 0.5) * 0.25);
  return sc(choices[0]) >= sc(choices[1]) ? choices[0].id : choices[1].id;
}
// Decide a matchup from what happened. Returns { winner, why, detail }.
function decideMatchup(d, m, mode, fin) {
  const va = Object.values(m.votes || {}).filter((v) => v === m.a).length, vb = Object.values(m.votes || {}).filter((v) => v === m.b).length;
  const A = teamOf(d, m.a), B = teamOf(d, m.b);
  const rating = (t) => (isFootball(d.topic) ? teamRating(d, t).rating : Math.round(teamScore(d, t, null)));
  const tieBreak = () => { const ra = rating(A), rb = rating(B); if (ra !== rb) return ra > rb ? A : B; return unit('coin', d.seed, m.id) < 0.5 ? A : B; };
  if (mode === 'bracket') {
    if (va === vb && fin && fin.tiebreak === 'revote' && !m.revoted) return { revote: true, why: 'Tied ' + va + '–' + vb + '. Vote again!' };
    if (va !== vb) { const w = va > vb ? A : B; return { winner: w.id, why: w.name + ' won the vote ' + Math.max(va, vb) + '–' + Math.min(va, vb) + '.' }; }
    const w = tieBreak(); return { winner: w.id, why: 'Tied ' + va + '–' + vb + ' on votes; ' + w.name + ' goes through as the stronger team.' };
  }
  const mt = m.match;
  if (mode === 'sim') {
    const w = mt.winner === 0 ? A : B;
    if (isSimResult(mt)) return { winner: w.id, why: w.name + ' won the ' + ((BATTLE_KINDS[mt.kind] || BATTLE_KINDS.fight).name).toLowerCase() + ' ' + mt.score[mt.winner] + '–' + mt.score[1 - mt.winner] + (mt.sudden ? ' in sudden death' : '') + '.' };
    if (mt.pens) return { winner: w.id, why: 'It finished ' + mt.score[0] + '–' + mt.score[1] + ' after extra time; ' + w.name + ' won ' + Math.max(...mt.pens) + '–' + Math.min(...mt.pens) + ' on penalties.' };
    return { winner: w.id, why: w.name + ' won ' + mt.score[mt.winner] + '–' + mt.score[1 - mt.winner] + (mt.et ? ' after extra time' : '') + '.' };
  }
  // Combined: match performance share (goals, smoothed) and vote share, weighted.
  const wMatch = clamp((fin.weight != null ? fin.weight : 60) / 100, 0, 1);
  const perfA = (mt.score[0] + 0.5) / (mt.score[0] + mt.score[1] + 1);
  const voteA = va + vb ? va / (va + vb) : 0.5;
  const total = wMatch * perfA + (1 - wMatch) * voteA;
  const detail = 'Match ' + Math.round(perfA * 100) + '% × ' + Math.round(wMatch * 100) + '% + votes ' + Math.round(voteA * 100) + '% × ' + Math.round((1 - wMatch) * 100) + '% = ' + Math.round(total * 100) + '% for ' + A.name;
  if (Math.abs(total - 0.5) < 1e-9) { const w = mt.winner === 0 ? A : B; return { winner: w.id, why: 'Dead level on the combined score, so the ' + (isSimResult(mt) ? 'battle' : 'match') + ' result decides: ' + w.name + (isSimResult(mt) ? (mt.sudden ? ' won in sudden death.' : ' won the battle.') : mt.pens ? ' on penalties.' : mt.et ? ' after extra time.' : ' won the match.'), detail }; }
  const w = total > 0.5 ? A : B;
  return { winner: w.id, why: w.name + ' wins on the combined score (' + Math.round((w === A ? total : 1 - total) * 100) + '%).', detail };
}
const finaleMode = (d) => { const f = (d.rules && d.rules.finale) || {}; const m = f.mode || 'vote'; return !isFootball(d.topic) && !hasBattle(d.topic) && (m === 'sim' || m === 'combined') ? 'bracket' : m; };
const FINALE_DEFAULTS = { mode: 'vote', weight: 60, speed: 'normal', commentary: true, tiebreak: 'rating', home: false };

/* ---------- finale state, stored on the draft as d.finale ----------
   { mode, bracket: { rounds, champion }, champion, startedAt }
   Every change goes through these functions, which refuse duplicate votes,
   votes for your own team, re-simulating a played match, or deciding a
   matchup twice. */
const needsVote = (mode) => mode === 'bracket' || mode === 'combined';
const needsMatch = (mode) => mode === 'sim' || mode === 'combined';
const finCfg = (d) => ({ ...FINALE_DEFAULTS, ...((d.rules && d.rules.finale) || {}) });
const getMatchup = (d, r, i) => d.finale.bracket.rounds[r][i];
function withMatchup(d, r, i, patch) {
  const rounds = d.finale.bracket.rounds.map((row, ri) => (ri === r ? row.map((m, mi) => (mi === i ? { ...m, ...patch } : m)) : row));
  const bracket = advanceBracket({ ...d.finale.bracket, rounds });
  const champion = bracket.champion || null;
  return { ...d, finale: { ...d.finale, bracket, champion }, votesRevealed: champion ? true : !!d.votesRevealed };
}
function startFinale(d) {
  if (d.finale && d.finale.bracket) return d;
  const bracket = buildBracket(d);
  const champion = bracket.champion || null;
  return { ...d, votes: {}, finale: { mode: finaleMode(d), bracket, champion, startedAt: Date.now() }, votesRevealed: !!champion };
}
const hasMatchVote = (m, id) => Object.prototype.hasOwnProperty.call(m.votes || {}, id);
function matchVoteProblem(d, m, voterId, teamId) {
  if (!m || m.winner) return 'This matchup is already decided.';
  if (!m.a || !m.b) return 'This matchup isn’t ready yet.';
  const v = matchVoters(d, m).find((p) => p.id === voterId);
  if (!v) return 'That player doesn’t vote on this matchup.';
  if (hasMatchVote(m, voterId)) return 'Already voted.';
  if (teamId !== m.a && teamId !== m.b) return 'That team isn’t in this matchup.';
  if (!canVoteFor(v, teamId)) return 'You can’t vote for your own team.';
  return null;
}
function castMatchVote(d, r, i, voterId, teamId) {
  const m = getMatchup(d, r, i);
  if (matchVoteProblem(d, m, voterId, teamId)) return d;
  return withMatchup(d, r, i, { votes: { ...(m.votes || {}), [voterId]: teamId } });
}
function botMatchVotes(d, r, i) {
  let n = d;
  matchVoters(d, getMatchup(d, r, i)).filter((p) => p.bot).forEach((p) => { const m = getMatchup(n, r, i); if (!hasMatchVote(m, p.id)) n = castMatchVote(n, r, i, p.id, matchupVoteBot(n, p, m)); });
  return n;
}
const votingDone = (d, m) => matchVoters(d, m).every((p) => hasMatchVote(m, p.id));
// Simulate the matchup's match once. A played match is kept as recorded.
function playMatchup(d, r, i) {
  const m = getMatchup(d, r, i);
  if (!m.a || !m.b || m.match || m.winner) return d;
  const A = teamOf(d, m.a), B = teamOf(d, m.b);
  if (!isFootball(d.topic)) return withMatchup(d, r, i, { match: simulateFor(d, A, B, m.id) });
  let home = null;
  if (finCfg(d).home) { const ra = teamRating(d, A).rating, rb = teamRating(d, B).rating; home = ra >= rb ? 0 : 1; }
  return withMatchup(d, r, i, { match: simulateMatch(d, A, B, m.id, true, { home }) });
}
function resolveMatchup(d, r, i) {
  const m = getMatchup(d, r, i);
  const mode = d.finale.mode;
  if (m.winner || !m.a || !m.b) return d;
  if (needsMatch(mode) && !m.match) return d;
  const res = decideMatchup(d, m, mode, finCfg(d));
  if (res.revote) return withMatchup(d, r, i, { votes: {}, revoted: true, note: res.why });
  return withMatchup(d, r, i, { winner: res.winner, why: res.why, detail: res.detail || '' });
}
function roundName(total, r) { const left = total - r; return left === 1 ? 'Final' : left === 2 ? 'Semi-finals' : left === 3 ? 'Quarter-finals' : 'Round of ' + Math.pow(2, left); }
// Played (non-bye) matchups, in order.
const playedMatchups = (b) => b.rounds.flatMap((row, r) => row.map((m, i) => ({ m, r, i }))).filter((x) => x.m.a && x.m.b && x.m.winner && x.m.winner !== 'none');
// Where each team finished: champion, runner-up, or the round they went out in.
function finaleStandings(d) {
  const b = d.finale.bracket; const R = b.rounds.length;
  const out = {};
  d.managers.forEach((t) => { out[t.id] = { team: t, label: t.team.some(Boolean) ? 'Still in' : 'No players', rank: t.team.some(Boolean) ? R : -1 }; });
  b.rounds.forEach((row, r) => row.forEach((m) => {
    if (!m.winner || m.winner === 'none' || !m.a || !m.b) return;
    const loser = m.winner === m.a ? m.b : m.a;
    out[loser] = { ...out[loser], label: r === R - 1 ? 'Runner-up' : 'Out in the ' + roundName(R, r), rank: r };
  }));
  if (d.finale.champion && out[d.finale.champion]) out[d.finale.champion] = { ...out[d.finale.champion], label: 'Champion', rank: R + 1 };
  return Object.values(out).sort((a, b2) => b2.rank - a.rank);
}
// Goals, wins and matches for one team across the finale.
function finaleRecord(d, teamId) {
  const rec = { played: 0, won: 0, gf: 0, ga: 0 };
  if (!d.finale || !d.finale.bracket) return rec;
  playedMatchups(d.finale.bracket).forEach(({ m }) => {
    if (m.a !== teamId && m.b !== teamId) return;
    rec.played++; if (m.winner === teamId) rec.won++;
    if (m.match) { const k = m.a === teamId ? 0 : 1; rec.gf += m.match.score[k]; rec.ga += m.match.score[1 - k]; }
  });
  return rec;
}
// A short, factual explanation of how the champion won.
function championStory(d) {
  const f = d.finale; if (!f || !f.champion) return '';
  const champ = teamOf(d, f.champion);
  const games = playedMatchups(f.bracket).filter(({ m }) => m.a === champ.id || m.b === champ.id);
  if (!games.length) return champ.name + ' was the only team with players, so they win by default.';
  const bits = [];
  const rec = finaleRecord(d, champ.id);
  if (needsMatch(f.mode) && !isFootball(d.topic)) bits.push('Won ' + rec.won + ' of ' + rec.played + ' battle' + (rec.played === 1 ? '' : 's') + ', winning ' + rec.gf + ' rounds and losing ' + rec.ga + '.');
  else if (needsMatch(f.mode)) bits.push('Won ' + rec.won + ' of ' + rec.played + ' match' + (rec.played === 1 ? '' : 'es') + ', scoring ' + rec.gf + ' and conceding ' + rec.ga + '.');
  else bits.push('Won ' + rec.won + ' head-to-head vote' + (rec.won === 1 ? '' : 's') + '.');
  if (isFootball(d.topic)) {
    const tr = teamRating(d, champ);
    const all = d.managers.filter((m) => m.team.some(Boolean)).map((m) => teamRating(d, m).rating).sort((a, b) => b - a);
    const pos = all.indexOf(tr.rating) + 1;
    if (numbersShown()) bits.push('Team strength (' + eraWord(d.topic) + ') ' + tr.rating + (pos === 1 ? ', the strongest in the draft.' : ', ranked ' + pos + ' of ' + all.length + (pos > 1 ? ' — an upset run.' : '.')));
  }
  const fin = games[games.length - 1].m; if (fin.why) bits.push('Final: ' + fin.why);
  return bits.join(' ');
}
// Top scorer across the finale's matches.
function goldenBoot(d) {
  if (!d.finale || !d.finale.bracket) return null;
  const g = {};
  playedMatchups(d.finale.bracket).forEach(({ m }) => (m.match ? m.match.events : []).forEach((e) => { if (e.type === 'goal') { const team = e.team === 0 ? m.a : m.b; const k = team + '|' + e.player; g[k] = (g[k] || 0) + 1; } }));
  const top = Object.entries(g).sort((a, b) => b[1] - a[1])[0];
  return top ? { teamId: top[0].split('|')[0], player: top[0].slice(top[0].indexOf('|') + 1), goals: top[1] } : null;
}
