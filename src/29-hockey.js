/* ============================================================
   ICE HOCKEY — the game for NHL Players.
   Built like the other sports engines: estimate the players →
   simulate the whole game shift by shift → keep a timeline → animate.
   · Each team's drafted goalie, two defenders and three forwards are
     the first unit (on the ice in the animation). They play their
     real share of the game; the depth lines (an average supporting
     cast, the same for both teams) play the rest.
   · Three 20-minute periods. Every shift: the puck carrier attacks or
     it's lost in the neutral zone; shots (wrist, snap, slap, one-timer,
     deflection, breakaway, rebounds) can be blocked, miss the net, hit
     the post or be saved by the goalie (glove, pad, blocker); bad
     rebounds give second chances. Hits and minor penalties (2-minute
     power plays). The team behind pulls the goalie late; empty-net
     goals happen. Level after 60 minutes: 5 minutes of 3-on-3 sudden
     death, then a shootout.
   · Player numbers are Draft Night estimates (Now), never official.
   ============================================================ */
const NHL_ATTRS = { S: ['SHT', 'PAS', 'SKT', 'DEF', 'PHY'], G: ['REF', 'POS', 'REB', 'GLV'] };
const NHL_ATTR_NAMES = { SHT: 'Shooting', PAS: 'Playmaking', SKT: 'Skating', DEF: 'Defence', PHY: 'Physical', REF: 'Reflexes', POS: 'Positioning', REB: 'Rebound control', GLV: 'Glove hand' };
const NHL_PROFILE_SRC = `
Connor Hellebuyck|93|
Igor Shesterkin|92|REF+3
Andrei Vasilevskiy|91|GLV+3
Juuse Saros|88|
Jake Oettinger|87|
Sergei Bobrovsky|87|
Ilya Sorokin|89|
Jeremy Swayman|86|
Thatcher Demko|86|
Linus Ullmark|86|
Cale Makar|94|SKT+5 PAS+3
Quinn Hughes|92|PAS+5 SKT+3 PHY-6
Adam Fox|90|PAS+4
Victor Hedman|90|DEF+3 PHY+3
Roman Josi|89|SHT+2
Miro Heiskanen|89|SKT+3 DEF+3
Rasmus Dahlin|89|PHY+3
Zach Werenski|89|SHT+3
Evan Bouchard|87|SHT+5 DEF-4
Erik Karlsson|89|PAS+5 DEF-4
Lane Hutson|86|PAS+4 PHY-8
Moritz Seider|87|DEF+4 PHY+5
Charlie McAvoy|88|PHY+4
Connor McDavid|98|SKT+6 PAS+4
Nathan MacKinnon|96|SKT+4 SHT+2
Auston Matthews|95|SHT+6
Leon Draisaitl|95|SHT+3 PAS+3
Nikita Kucherov|95|PAS+6
David Pastrňák|93|SHT+6
Sidney Crosby|93|PAS+3 DEF+3
Alex Ovechkin|91|SHT+8 SKT-4 PHY+4
Mitch Marner|90|PAS+6 PHY-5
William Nylander|89|SHT+3 SKT+3
Matthew Tkachuk|90|PHY+7
Jack Hughes|90|SKT+5
Kirill Kaprizov|92|SHT+3
Macklin Celebrini|86|
Connor Bedard|86|SHT+3
Jack Eichel|90|
Brad Marchand|87|PHY+4
Steven Stamkos|88|SHT+5
Brayden Point|89|
Aleksander Barkov|91|DEF+6`;
const NHL_PROFILE = {};
NHL_PROFILE_SRC.trim().split('\n').forEach((line) => { const [name, ovr, tw] = line.split('|'); const tweak = {}; (tw || '').split(' ').filter(Boolean).forEach((t) => { const m = t.match(/^([A-Z]+)([+-]\d+)$/); if (m) tweak[m[1]] = +m[2]; }); NHL_PROFILE[name.toLowerCase()] = { ovr: +ovr, tweak }; });
const nhlRole = (item, slot) => { const p = norm((item && item.pos) || slot || ''); return p === 'G' ? 'G' : p === 'D' ? 'D' : 'F'; };
const NHL_SHAPE = { F: { SHT: 2, PAS: 1, SKT: 1, DEF: -6, PHY: -2 }, D: { SHT: -6, PAS: 0, SKT: -1, DEF: 5, PHY: 2 } };
function nhlRating(item, slot) {
  const prof = NHL_PROFILE[String(item.name || '').toLowerCase()];
  const fixed = validRating(item.rating);
  const ovr = fixed ? clamp(Math.round(+item.rating), 1, 99) : prof ? prof.ovr : clamp(Math.round(74 + itemFame(item) * 20 + (unit('nhlo', item.name) - 0.5) * 6), 66, 93);
  const role = nhlRole(item, slot); const tw = prof ? prof.tweak : {};
  const attrs = {};
  const keys = role === 'G' ? NHL_ATTRS.G : NHL_ATTRS.S;
  const d = (item.desc || '') + ' ';
  const tilt = { SHT: /sniper|goals/i.test(d) ? 5 : 0, PAS: /playmaker/i.test(d) ? 5 : 0 };
  keys.forEach((a) => { attrs[a] = clamp(Math.round(ovr + (role === 'G' ? 0 : NHL_SHAPE[role][a]) + (tw[a] || 0) + (tilt[a] || 0) + (unit('nhla', item.name, a) - 0.5) * 6), 40, 99); });
  return { ovr, attrs, role, estimated: !fixed };
}
const NHL_DEPTH = 80; // supporting cast
const NHL_LINES = {
  goal: { wrist: ['{p} snaps a wrist shot past {g}!', '{p} picks the corner — GOAL!'], snap: ['{p} with a quick snapshot — it’s in!'], slap: ['{p} winds up and BLASTS it in from the point!'], onetimer: ['{a} feeds {p} for the one-timer — SCORES!', 'One-timer from {p}! What a pass from {a}!'], deflect: ['{p} tips it in front of the net!', 'Deflection by {p} — GOAL!'], rebound: ['{p} buries the rebound!', '{p} pounces on the loose puck — GOAL!'], breakaway: ['{p} is in alone… dekes… SCORES!', 'Breakaway! {p} beats {g} five-hole!'], empty: ['{p} hits the empty net!'] },
  save: { glove: ['Glove save by {g}!', '{g} snags it with the glove!'], pad: ['Pad save from {g}!', '{g} kicks it out with the pad.'], blocker: ['Blocker save by {g}.', '{g} turns it aside with the blocker.'], big: ['WHAT A SAVE by {g}!', '{g} robs {p}!', 'Highway robbery — {g} says no to {p}!'] },
  block: ['{b} blocks the shot.', 'Big block from {b}!'],
  miss: ['{p} fires wide.', '{p} misses the net.'],
  post: ['{p} rings it off the post!', 'Off the crossbar from {p}!'],
  hit: ['{b} lays a big hit on {p}!', 'BOOM! {b} flattens {p} along the boards!'],
  pen: ['{p} goes to the box for {r}. Power play!'],
};
const nhlLine = (rng, ls, v) => ls[Math.floor(rng() * ls.length)].replace('{p}', v.p || '').replace('{g}', v.g || '').replace('{a}', v.a || '').replace('{b}', v.b || '').replace('{r}', v.r || '');
const NHL_PENS = ['tripping', 'hooking', 'slashing', 'high-sticking', 'interference', 'holding', 'roughing'];

function simulateHockey(d, A, B, key) {
  const rng = seeded(d.seed, 'nhl', key, A.id, B.id);
  const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += rng(); return (u - 2) / 0.58; };
  const sq = [A, B].map((m) => m.team.map((x, k) => { const it = x && d.items[x.itemId]; return it ? { name: it.name, itemId: it.id, price: x.price || 0, ...nhlRating(it, d.rules.slots[k]) } : null; }).filter(Boolean));
  const team = sq.map((s, i) => {
    const G = s.find((p) => p.role === 'G') || { name: 'Backup goalie', itemId: null, ovr: 78, role: 'G', attrs: { REF: 78, POS: 78, REB: 78, GLV: 78 }, backup: true };
    const skaters = s.filter((p) => p.role !== 'G');
    const avg = (k) => (skaters.length ? (skaters.reduce((n, p) => n + p.attrs[k], 0) + NHL_DEPTH * (5 - Math.min(5, skaters.length)) * 0) / skaters.length : NHL_DEPTH);
    // Team strength blends the first unit (~40% of the game) with the depth lines.
    const blend = (k) => avg(k) * 0.4 + NHL_DEPTH * 0.6;
    return { G, skaters, off: blend('SHT') * 0.5 + blend('PAS') * 0.3 + blend('SKT') * 0.2, def: blend('DEF') * 0.6 + blend('SKT') * 0.2 + blend('PHY') * 0.2, gk: (G.attrs.REF + G.attrs.POS + G.attrs.GLV) / 3 };
  });
  const form = [gauss() * 0.016, gauss() * 0.016];
  const gForm = [gauss() * 0.02, gauss() * 0.02];
  const score = [0, 0]; const ev = []; const shots = [0, 0];
  const box = sq.map((s) => Object.fromEntries(s.map((p) => [p.name, { g: 0, a: 0, sog: 0, hits: 0, blk: 0, pim: 0, sv: 0, ga: 0 }])));
  const bx = (s, n) => box[s][n] || null;
  let period = 1, clock = 1200, pp = null; let ot = false, so = null; let pulled = [false, false];
  const push = (e) => { e.per = period; e.clk = Math.max(0, Math.round(clock)); e.score = [...score]; e.i = ev.length; ev.push(e); return e; };
  // Who's on the ice for one attack: a star (by ice time) or the depth.
  const onIce = (s, role, w) => { const pool = team[s].skaters.filter((p) => !role || p.role === role); const toi = (p) => (p.role === 'D' ? 0.44 : 0.38); const pick = pool.filter((p) => rng() < toi(p)); return pick.length ? weighted(rng, pick, w) : null; };
  const shooterW = (p) => p.attrs.SHT * (p.role === 'F' ? 1.6 : 0.6);
  const attack = (s, sit) => {
    const o = 1 - s; const G = team[o].G;
    const isPP = pp && pp.team === s; const isSH = pp && pp.team === o;
    const emptyNet = pulled[o];
    // Shot type and shooter.
    const shooter = onIce(s, null, shooterW);
    const passer = rng() < 0.7 ? onIce(s, null, (p) => p.attrs.PAS) : null;
    const pn = shooter ? shooter.name : null; const an = passer && passer !== shooter ? passer.name : null;
    const sht = shooter ? shooter.attrs.SHT : NHL_DEPTH - 2;
    const rush = sit === 'ot' ? 0.25 : 0.1;
    const type = emptyNet ? 'empty' : weighted(rng, [['wrist', 4], ['snap', 2.2], ['slap', shooter && shooter.role === 'D' ? 2.5 : 0.8], ['onetimer', an ? 1.6 + (isPP ? 1.5 : 0) : 0.2], ['deflect', 1], ['breakaway', (shooter ? (shooter.attrs.SKT - 80) / 15 : 0) + rush * 8]], (x) => Math.max(0.05, x[1]))[0];
    // Blocked / missed / on target.
    const blocker = rng() < 0.45 ? onIce(o, 'D', (p) => p.attrs.DEF) : null;
    const x = rng();
    if (!emptyNet && type !== 'breakaway' && x < 0.22) { if (blocker) bx(o, blocker.name).blk++; return push({ kind: 'block', s, p: pn, b: blocker ? blocker.name : null, text: blocker ? nhlLine(rng, NHL_LINES.block, { b: blocker.name }) : 'Shot blocked.', hl: false }); }
    if (x < (emptyNet ? 0.3 : 0.45)) {
      if (rng() < 0.08) return push({ kind: 'post', s, p: pn, text: nhlLine(rng, NHL_LINES.post, { p: pn || 'A depth player' }), hl: !!pn });
      return push({ kind: 'miss', s, p: pn, text: nhlLine(rng, NHL_LINES.miss, { p: pn || (s === 0 ? A : B).name }), hl: false });
    }
    shots[s]++; if (pn) bx(s, pn).sog++;
    const typeB = { wrist: 0, snap: 0.01, slap: -0.015, onetimer: 0.045, deflect: 0.04, rebound: 0.1, breakaway: 0.14, empty: 0.6 }[type];
    const pGoal = clamp(0.066 + (sht - team[o].gk) / 340 + typeB + (isPP ? 0.035 : 0) - (isSH ? 0.03 : 0) + form[s] - gForm[o] + (sit === 'ot' ? 0.03 : 0), 0.02, emptyNet ? 0.85 : 0.5);
    if (rng() < pGoal) {
      score[s]++; if (pn) bx(s, pn).g++; if (an) bx(s, an).a++; if (!G.backup && !emptyNet && bx(o, G.name)) bx(o, G.name).ga++;
      const e = push({ kind: 'goal', s, p: pn, a: an, g: G.name, type, pp: isPP, sh: isSH, text: (pn ? nhlLine(rng, NHL_LINES.goal[type], { p: pn, g: G.name, a: an || 'a teammate' }) : (s === 0 ? A : B).name + '’s depth line scores!') + (isPP ? ' Power-play goal!' : isSH ? ' Shorthanded!' : ''), hl: true, big: true });
      if (isPP) pp = null;
      return e;
    }
    if (!G.backup && bx(o, G.name)) bx(o, G.name).sv++;
    const big = type === 'breakaway' || type === 'onetimer' || (pGoal > 0.17 && rng() < 0.5);
    const how = weighted(rng, [['glove', G.attrs.GLV / 30], ['pad', 2.6], ['blocker', 1.6]], (z) => z[1])[0];
    const e = push({ kind: 'save', s, p: pn, g: G.name, type, how, big, text: (pn ? (big ? nhlLine(rng, NHL_LINES.save.big, { g: G.name, p: pn }) : nhlLine(rng, NHL_LINES.save[how], { g: G.name })) : nhlLine(rng, NHL_LINES.save[how], { g: G.name })) + (type === 'breakaway' && pn ? ' ' + pn + ' was in alone!' : ''), hl: big && !!pn });
    // Rebound?
    if (rng() < clamp(0.2 - (G.attrs.REB - 85) / 150, 0.06, 0.32)) { clock -= 3; return attackRebound(s); }
    return e;
  };
  const attackRebound = (s) => {
    const o = 1 - s; const G = team[o].G;
    const shooter = onIce(s, 'F', shooterW); const pn = shooter ? shooter.name : null;
    shots[s]++; if (pn) bx(s, pn).sog++;
    const p = clamp(0.2 + ((shooter ? shooter.attrs.SHT : 78) - team[o].gk) / 250 - (G.attrs.REF - 85) / 300, 0.08, 0.4);
    if (rng() < p) { score[s]++; if (pn) bx(s, pn).g++; if (!G.backup && bx(o, G.name)) bx(o, G.name).ga++; return push({ kind: 'goal', s, p: pn, g: G.name, type: 'rebound', text: pn ? nhlLine(rng, NHL_LINES.goal.rebound, { p: pn }) : 'The rebound is knocked in!', hl: true, big: true }); }
    if (!G.backup && bx(o, G.name)) bx(o, G.name).sv++;
    return push({ kind: 'save', s, p: pn, g: G.name, type: 'rebound', how: 'pad', big: true, text: G.name + ' scrambles across to stop the rebound' + (pn ? ' from ' + pn : '') + '!', hl: !!pn });
  };
  const playPeriod = (len, sit) => {
    clock = len;
    while (clock > 0) {
      clock -= 14 + rng() * 22;
      if (clock <= 0) break;
      if (pp) { pp.left -= 40; if (pp.left <= 0) { push({ kind: 'ppend', s: pp.team, text: 'The penalty is killed.', hl: false }); pp = null; } }
      // Pull the goalie: last 2:30, down by one or two.
      if (period === 3 && sit !== 'ot') { [0, 1].forEach((s) => { const behind = score[1 - s] - score[s]; const want = clock < 150 && behind >= 1 && behind <= 2; if (want && !pulled[s]) { pulled[s] = true; push({ kind: 'pull', s, text: (s === 0 ? A : B).name + ' pull their goalie for an extra attacker!', hl: true }); } if (!want) pulled[s] = false; }); }
      // Who has the puck?
      const w = (s) => team[s].off + (pp && pp.team === s ? 9 : pp ? -9 : 0) + (pulled[s] ? 6 : 0) - team[1 - s].def * 0.3;
      const s = rng() < w(0) / (w(0) + w(1)) ? 0 : 1; const o = 1 - s;
      const r = rng();
      if (r < 0.022 && !pp) {
        const culprit = onIce(o, null, (p) => p.attrs.PHY) || null;
        const reason = pickOf(rng, NHL_PENS);
        if (culprit) bx(o, culprit.name).pim += 2;
        pp = { team: s, left: 120 };
        push({ kind: 'pen', s, p: culprit ? culprit.name : null, text: culprit ? nhlLine(rng, NHL_LINES.pen, { p: culprit.name, r: reason }) : (o === 0 ? A : B).name + ' take a penalty for ' + reason + '. Power play!', hl: !!culprit });
        continue;
      }
      if (r < 0.09) {
        const hitter = onIce(o, null, (p) => p.attrs.PHY); const victim = onIce(s, null, () => 1);
        if (hitter && victim) { bx(o, hitter.name).hits++; push({ kind: 'hit', s: o, b: hitter.name, p: victim.name, text: nhlLine(rng, NHL_LINES.hit, { b: hitter.name, p: victim.name }), hl: rng() < 0.25 }); }
        continue;
      }
      if (r < 0.4 + (sit === 'ot' ? -0.2 : 0)) continue; // lost in the neutral zone
      attack(s, sit);
      if (sit === 'ot' && score[0] !== score[1]) return;
      // Empty net goal against the team that pulled.
      if (period === 3 && pulled[s] && rng() < 0.12) { const e = attack(o, 'en'); if (e) e.hl = true; }
    }
  };
  for (period = 1; period <= 3; period++) { playPeriod(1200, 'reg'); pp = null; pulled = [false, false]; if (period < 3) push({ kind: 'pend', s: null, text: 'End of period ' + period + ': ' + score[0] + '–' + score[1] + '.', hl: false }); }
  period = 3;
  if (score[0] === score[1]) {
    period = 4; ot = true; push({ kind: 'ot', s: null, text: 'Overtime! Five minutes of 3-on-3, next goal wins.', hl: true });
    playPeriod(300, 'ot');
    if (score[0] === score[1]) {
      // Shootout.
      period = 5; clock = 0; push({ kind: 'so', s: null, text: 'Shootout!', hl: true });
      const order = (s) => { const fs = team[s].skaters.slice().sort((x, y) => (y.role === 'F') - (x.role === 'F') || y.attrs.SHT - x.attrs.SHT); return fs.length ? fs : [{ name: 'Depth shooter', attrs: { SHT: 78, SKT: 78 } }]; };
      const O = [order(0), order(1)]; const made = [0, 0]; const rounds = [];
      for (let r = 0; r < 20; r++) {
        const res = [0, 1].map((s) => { const sh = O[s][r % O[s].length]; const G = team[1 - s].G; const p = clamp(0.33 + (sh.attrs.SHT + (sh.attrs.SKT || 80) * 0.5 - G.attrs.REF * 1.5) / 220, 0.15, 0.6); const g = rng() < p; if (g) made[s]++; return { p: sh.name, g, goalie: G.name }; });
        rounds.push(res);
        res.forEach((x, s) => push({ kind: 'soshot', s, p: x.p, g: x.goalie, scored: x.g, round: r + 1, text: x.p + (x.g ? ' SCORES in the shootout!' : ' is stopped by ' + x.goalie + '.'), hl: true, big: x.g }));
        if (r >= 2 && made[0] !== made[1]) break;
        if (r < 2) { const left = 2 - r; if (made[0] > made[1] + left || made[1] > made[0] + left) break; }
      }
      if (made[0] === made[1]) made[rng() < 0.5 ? 0 : 1]++;
      const w = made[0] > made[1] ? 0 : 1; score[w]++; so = { made, rounds: rounds.length, winner: w };
      push({ kind: 'sowin', s: w, text: (w === 0 ? A : B).name + ' win the shootout ' + made[w] + '–' + made[1 - w] + '!', hl: true, big: true });
    }
  }
  const winner = score[0] > score[1] ? 0 : 1;
  // The last two minutes of a one-goal game are always worth watching.
  ev.forEach((e) => { if (e.per === 3 && e.clk <= 120 && Math.abs(e.score[0] - e.score[1]) <= 1 && (e.kind === 'save' || e.kind === 'goal' || e.kind === 'post')) e.hl = true; });
  const periods = [1, 2, 3, 4].map((p) => { const last = ev.filter((e) => e.per <= p && e.kind !== 'sowin').pop(); return last ? last.score : [0, 0]; });
  const per = periods.map((x, k) => [x[0] - (k ? periods[k - 1][0] : 0), x[1] - (k ? periods[k - 1][1] : 0)]).slice(0, ot ? 4 : 3);
  return { v: 'nhl', kind: 'nhl', score: [...score], winner, ot, so, shots, periods: per, plays: ev, events: [], box, lineups: sq.map((s) => s.map((p) => ({ name: p.name, itemId: p.itemId, role: p.role, ovr: p.ovr }))), et: ot, pens: null, sudden: !!so };
}
const nhlPerName = (p) => (p <= 3 ? 'P' + p : p === 4 ? 'OT' : 'SO');
const nhlClock = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
