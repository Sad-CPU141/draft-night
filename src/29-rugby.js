/* ============================================================
   RUGBY UNION — the match for Rugby Players.
   Built like the other sports engines: estimate the players →
   simulate the whole match phase by phase → keep a timeline → animate.
   · Each XV is the five drafted players (in their real positions)
     plus ten average players. 80 minutes of possessions: carries
     over the gain line, line breaks, offloads, big tackles, jackal
     turnovers, knock-ons and scrums, penalties (kicks at goal, or to
     the corner for a lineout and driving maul), territory kicks, drop
     goals, yellow cards (ten minutes in the bin), tries and
     conversions. Level after 80: golden-point extra time, then a
     kicking competition.
   · Player numbers are Draft Night estimates (Prime), never official.
   ============================================================ */
const RUGBY_POS_SRC = `
Prop|Tadhg Furlong,Ellis Genge,Jason Leonard
Hooker|Sean Fitzpatrick,John Smit,Malcolm Marx
Lock|Martin Johnson,Eben Etzebeth,Maro Itoje,Alun Wyn Jones,Brodie Retallick,Sam Whitelock,Victor Matfield,Paul O'Connell,John Eales,Colin Meads
Back row|Richie McCaw,Siya Kolisi,David Pocock,Sergio Parisse,Ardie Savea,Pieter-Steph du Toit,Michael Hooper,Kieran Read,Zinzan Brooke,Schalk Burger,Duane Vermeulen,Caelan Doris,Sam Warburton,Lawrence Dallaglio,Thierry Dusautoir,Grégory Alldritt
Scrum-half|Gareth Edwards,Antoine Dupont,George Gregan,Faf de Klerk,Aaron Smith,Will Genia,Agustín Pichot
Fly-half|Waisale Serevi,Dan Carter,Jonny Wilkinson,Johnny Sexton,Beauden Barrett,Owen Farrell,Handré Pollard,Finn Russell,Ronan O'Gara,Marcus Smith,Michael Lynagh,Romain Ntamack
Centre|Jean de Villiers,Ma'a Nonu,Brian O'Driscoll,Sonny Bill Williams,Damian de Allende,Bundee Aki,Jamie Roberts,Will Carling,Matt Giteau,Semi Radradra
Wing|Jonah Lomu,Shane Williams,Cheslin Kolbe,Bryan Habana,Jason Robinson,Julian Savea,Will Jordan,Kurt-Lee Arendse,James Lowe,George North,Damian Penaud,Louis Bielle-Biarrey,David Campese
Fullback|Jordie Barrett,Christian Cullen,Leigh Halfpenny,Stuart Hogg,Gavin Hastings,Serge Blanco,Thomas Ramos`;
const RUGBY_POS = {};
RUGBY_POS_SRC.trim().split('\n').forEach((line) => { const [pos, names] = line.split('|'); names.split(',').forEach((n) => { RUGBY_POS[n.trim().toLowerCase()] = pos; }); });
const RUGBY_FWD = ['Prop', 'Hooker', 'Lock', 'Back row'];
const RUGBY_ATTRS = ['PAC', 'PWR', 'HND', 'DEF', 'KCK', 'BRK', 'SET'];
const RUGBY_ATTR_NAMES = { PAC: 'Pace', PWR: 'Power', HND: 'Handling', DEF: 'Tackling', KCK: 'Kicking', BRK: 'Breakdown', SET: 'Set piece' };
const RUGBY_SHAPE = {
  Prop: { PAC: -14, PWR: 6, HND: -8, DEF: 2, KCK: -30, BRK: 0, SET: 8 }, Hooker: { PAC: -10, PWR: 4, HND: -4, DEF: 2, KCK: -30, BRK: 2, SET: 8 },
  Lock: { PAC: -10, PWR: 5, HND: -5, DEF: 3, KCK: -30, BRK: 0, SET: 8 }, 'Back row': { PAC: -4, PWR: 4, HND: 0, DEF: 5, KCK: -28, BRK: 7, SET: 2 },
  'Scrum-half': { PAC: 2, PWR: -8, HND: 6, DEF: -2, KCK: -2, BRK: 0, SET: -10 }, 'Fly-half': { PAC: -2, PWR: -8, HND: 4, DEF: -4, KCK: 8, BRK: -6, SET: -12 },
  Centre: { PAC: 2, PWR: 2, HND: 2, DEF: 4, KCK: -14, BRK: 0, SET: -12 }, Wing: { PAC: 8, PWR: -2, HND: 0, DEF: -4, KCK: -18, BRK: -8, SET: -14 }, Fullback: { PAC: 4, PWR: -4, HND: 2, DEF: 0, KCK: 2, BRK: -6, SET: -14 },
};
const RUGBY_PROFILE = { 'jonah lomu': [97, { PAC: 6, PWR: 10 }], 'richie mccaw': [98, { BRK: 6 }], 'dan carter': [98, { KCK: 6 }], 'jonny wilkinson': [95, { KCK: 8, DEF: 6 }], "brian o'driscoll": [96, {}], 'antoine dupont': [98, { PAC: 4 }], 'siya kolisi': [92, {}], 'johnny sexton': [94, {}], 'martin johnson': [94, {}], 'gareth edwards': [96, {}], 'shane williams': [92, { PAC: 6 }], 'beauden barrett': [93, { PAC: 6 }], 'cheslin kolbe': [93, { PAC: 6 }], 'eben etzebeth': [93, {}], 'maro itoje': [93, {}], 'alun wyn jones': [92, {}], 'bryan habana': [93, { PAC: 8 }], 'david pocock': [93, { BRK: 8 }], 'george gregan': [91, {}], 'sergio parisse': [93, {}], 'owen farrell': [90, { KCK: 4 }], 'ardie savea': [94, {}], 'handré pollard': [90, { KCK: 6 }], 'pieter-steph du toit': [93, {}], 'finn russell': [90, { HND: 6 }], 'faf de klerk': [89, {}], 'michael hooper': [91, {}], 'jason robinson': [92, { PAC: 6 }] };
function rugbyRating(item) {
  const n = String(item.name || ''); const pos = RUGBY_POS[n.toLowerCase()] || (/scrum/i.test(item.desc || '') ? 'Scrum-half' : 'Centre');
  const fixed = validRating(item.rating); const prof = RUGBY_PROFILE[n.toLowerCase()];
  const ovr = fixed ? clamp(Math.round(+item.rating), 1, 99) : prof ? prof[0] : clamp(Math.round(78 + itemFame(item) * 16 + (unit('rugo', n) - 0.5) * 6), 72, 94);
  const tw = prof ? prof[1] : {}; const attrs = {};
  RUGBY_ATTRS.forEach((a) => { attrs[a] = clamp(Math.round(ovr + RUGBY_SHAPE[pos][a] + (tw[a] || 0) + (unit('ruga', n, a) - 0.5) * 6), 30, 99); });
  return { ovr, attrs, pos, fwd: RUGBY_FWD.includes(pos), estimated: !fixed };
}
const RUGBY_AVG = 80;
function rugbyXV(d, m) {
  const ps = m.team.map((x) => { const it = x && d.items[x.itemId]; return it ? { name: it.name, itemId: it.id, price: x.price || 0, ...rugbyRating(it) } : null; }).filter(Boolean);
  const avg = (pos) => { const attrs = {}; RUGBY_ATTRS.forEach((a) => { attrs[a] = clamp(RUGBY_AVG + RUGBY_SHAPE[pos][a], 30, 99); }); return { name: pos, itemId: null, ovr: RUGBY_AVG, attrs, pos, fwd: RUGBY_FWD.includes(pos), avg: true }; };
  const want = ['Prop', 'Hooker', 'Prop', 'Lock', 'Lock', 'Back row', 'Back row', 'Back row', 'Scrum-half', 'Fly-half', 'Wing', 'Centre', 'Centre', 'Wing', 'Fullback'];
  const xv = want.map((pos) => { const i = ps.findIndex((p) => p.pos === pos); return i >= 0 ? ps.splice(i, 1)[0] : null; });
  // Drafted players with no free shirt in their position take the nearest one.
  ps.forEach((p) => { const i = xv.findIndex((x, k) => !x && (RUGBY_FWD.includes(want[k]) === p.fwd)); const j = i >= 0 ? i : xv.findIndex((x) => !x); if (j >= 0) xv[j] = p; });
  return xv.map((p, k) => p || avg(want[k]));
}
const RUGBY_LINES = {
  try: ['{p} dives over in the corner — TRY!', '{p} crashes over from close range — TRY!', '{p} scores under the posts!', '{p} finishes it off — TRY!'],
  break: ['{p} breaks the line!', 'What a step from {p}!', '{p} is through the gap!'],
  turnover: ['{b} wins the turnover at the breakdown!', 'Jackal! {b} steals it!', '{b} rips the ball free!'],
  tackle: ['Huge hit from {b} on {p}!', '{b} drives {p} back in the tackle!'],
};
const rugbyLine = (rng, k, v) => { const ls = RUGBY_LINES[k]; return ls[Math.floor(rng() * ls.length)].replace('{p}', v.p || '').replace('{b}', v.b || ''); };

function simulateRugby(d, A, B, key) {
  const rng = seeded(d.seed, 'rugby', key, A.id, B.id);
  const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += rng(); return (u - 2) / 0.58; };
  const XV = [rugbyXV(d, A), rugbyXV(d, B)];
  const avgOf = (s, k, f) => { const ps = XV[s].filter(f || (() => true)); return ps.reduce((n, p) => n + p.attrs[k], 0) / ps.length; };
  const team = [0, 1].map((s) => ({ atk: avgOf(s, 'PAC') * 0.35 + avgOf(s, 'PWR') * 0.3 + avgOf(s, 'HND') * 0.35, def: avgOf(s, 'DEF'), brk: avgOf(s, 'BRK', (p) => p.fwd), set: avgOf(s, 'SET', (p) => p.fwd), kicker: XV[s].slice().sort((a, b) => b.attrs.KCK - a.attrs.KCK)[0] }));
  const form = [gauss() * 0.02, gauss() * 0.02];
  const score = [0, 0]; const ev = [];
  const box = [0, 1].map(() => ({}));
  const bx = (s, n) => (box[s][n] = box[s][n] || { tries: 0, pts: 0, carries: 0, metres: 0, breaks: 0, tackles: 0, turnovers: 0, kicks: 0 });
  let t = 0, poss = rng() < 0.5 ? 0 : 1, x = 50; let half = 1; let bin = [[], []]; let golden = false; let over = false;
  const push = (e) => { e.t = Math.round(t); e.score = [...score]; e.x = Math.round(x); e.i = ev.length; ev.push(e); return e; };
  const min = () => Math.floor(t / 60) + 1;
  const men = (s) => 15 - bin[s].filter((b) => b > t).length;
  const pickCarrier = (s, wide) => weighted(rng, XV[s], (p) => (wide ? (p.fwd ? 0.3 : 1.5) * p.attrs.PAC : (p.fwd ? 1.4 : 0.6) * p.attrs.PWR) * (p.avg ? 1 : 1.6));
  const pickJackal = (s) => weighted(rng, XV[s].filter((p) => p.fwd), (p) => Math.pow(p.attrs.BRK / 80, 4) * (p.avg ? 1 : 1.8));
  const pickTackler = (s) => weighted(rng, XV[s], (p) => p.attrs.DEF * (p.fwd ? 1.2 : 0.9) * (p.avg ? 1 : 1.6));
  const goalKick = (s, dist, angle, kind) => {
    const k = team[s].kicker;
    const p = clamp(0.98 - Math.max(0, dist - 22) / 55 - angle * 0.22 + (k.attrs.KCK - 85) / 120, 0.15, 0.98);
    const good = rng() < p; bx(s, k.name).kicks += good ? 1 : 0;
    return { good, kicker: k.name };
  };
  const tryScored = (s, p, how) => {
    score[s] += 5; bx(s, p.name).tries++; bx(s, p.name).pts += 5;
    const angle = rng(); const conv = goalKick(s, 22 + angle * 18, angle, 'conv');
    if (conv.good) { score[s] += 2; bx(s, conv.kicker).pts += 2; }
    const e = push({ kind: 'try', s, p: p.name, how, conv: conv.good, kicker: conv.kicker, text: rugbyLine(rng, 'try', { p: p.name }) + ' ' + (conv.good ? conv.kicker + ' converts.' : conv.kicker + ' misses the conversion.'), hl: true, big: true });
    x = 50; poss = 1 - s; t += 60;
    return e;
  };
  const endT = () => (golden ? 5400 : half === 1 ? 2400 : 4800);
  while (!over) {
    if (t >= endT()) {
      if (golden) break;
      if (half === 1) { half = 2; t = 2400; poss = 1 - poss; x = 50; push({ kind: 'ht', s: null, text: 'Half-time: ' + score[0] + '–' + score[1] + '.', hl: false }); continue; }
      if (score[0] !== score[1]) break;
      golden = true; t = 4800; x = 50; push({ kind: 'et', s: null, text: 'Level at full-time — golden-point extra time! Next score wins.', hl: true }); continue;
    }
    const s = poss, o = 1 - s;
    // One possession: phase after phase until something happens.
    let phases = 0; let ended = false;
    while (!ended && t < endT()) {
      phases++; t += 11 + rng() * 14;
      const wide = rng() < 0.45;
      const C = pickCarrier(s, wide); const short = men(o) < 15 ? 0.03 * (15 - men(o)) : 0;
      const edge = (team[s].atk - team[o].def) / 100 + form[s] - form[o] + short - (men(s) < 15 ? 0.03 : 0);
      bx(s, C.name).carries++;
      const r = rng();
      // Line break.
      const pBreak = clamp(0.036 + (C.attrs.PAC - team[o].def) / 340 + edge * 0.2 + (wide ? 0.01 : 0), 0.01, 0.15);
      if (r < pBreak) {
        const gain = 15 + Math.floor(rng() * 45) + (C.attrs.PAC - 85) / 2;
        bx(s, C.name).breaks++; bx(s, C.name).metres += Math.round(gain);
        const before = x; x = Math.min(100, x + gain);
        const reachP = clamp(0.35 + (C.attrs.PAC - team[o].def) / 120 + (x - 70) / 60, 0.1, 0.85);
        if (x >= 100 || (x > 80 && rng() < reachP)) {
          const finisher = rng() < 0.6 ? C : pickCarrier(s, true);
          const e = tryScored(s, finisher, 'break'); e.from = Math.round(before); e.breaker = C.name; e.text = (finisher !== C ? rugbyLine(rng, 'break', { p: C.name }) + ' ' : '') + e.text; ended = true;
          if (golden) { over = true; } break;
        }
        push({ kind: 'break', s, p: C.name, from: Math.round(before), text: rugbyLine(rng, 'break', { p: C.name }) + ' ' + Math.round(gain) + ' metres!', hl: !C.avg, big: false });
        continue;
      }
      // Turnover at the breakdown.
      const J = pickJackal(o);
      const pTurn = clamp(0.055 + (J.attrs.BRK - avgOf(s, 'BRK', (p) => p.fwd)) / 300 - edge * 0.1 + phases * 0.003, 0.02, 0.14);
      if (r < pBreak + pTurn) { bx(o, J.name).turnovers++; push({ kind: 'turnover', s: o, b: J.name, text: rugbyLine(rng, 'turnover', { b: J.name }), hl: !J.avg && rng() < 0.6 }); poss = o; x = 100 - x; ended = true; break; }
      // Knock-on → scrum.
      if (r < pBreak + pTurn + 0.028) {
        const pen = rng() < clamp(0.22 + Math.abs(team[s].set - team[o].set) / 60, 0.1, 0.5) ? (team[o].set >= team[s].set ? o : s) : null;
        push({ kind: 'scrum', s: o, p: C.name, pen, text: C.name + ' knocks on. Scrum' + (pen != null ? ' — ' + (pen === 0 ? A : B).name + ' win a scrum penalty!' : '.'), hl: pen != null && rng() < 0.4 });
        poss = o; x = 100 - x;
        if (pen === s) { poss = s; x = 100 - x; }
        ended = true; break;
      }
      // Penalties.
      const pPen = 0.06;
      if (r < pBreak + pTurn + 0.028 + pPen) {
        const toAtk = rng() < 0.58 + edge * 0.5;
        const ws = toAtk ? s : o; const ls = 1 - ws;
        let xx = toAtk ? x : 100 - x;
        const yellow = rng() < 0.07 + (ws === s && x > 85 ? 0.12 : 0);
        if (yellow) { const culprit = pickTackler(ls); bin[ls].push(t + 600); push({ kind: 'card', s: ls, p: culprit.name, text: 'YELLOW CARD! ' + culprit.name + ' is sent to the bin for ten minutes.', hl: true }); }
        const late = t > 4200 || golden; const diff = score[ws] - score[ls];
        const dist = 100 - xx + 5; const angle = rng() * 0.8;
        const goForPosts = xx >= 55 && (xx < 88 || late || rng() < 0.55) && !(late && diff < -3 && xx > 80);
        if (goForPosts) {
          const k = goalKick(ws, dist, angle, 'pen');
          if (k.good) { score[ws] += 3; bx(ws, k.kicker).pts += 3; }
          x = xx; poss = ws;
          push({ kind: 'pen', s: ws, p: k.kicker, good: k.good, dist: Math.round(dist), text: k.kicker + ' kicks at goal from ' + Math.round(dist) + ' metres… ' + (k.good ? 'over!' : 'wide!'), hl: k.good ? (late || dist > 40 || golden) : true, big: k.good && (late || golden) });
          if (k.good && golden) { over = true; ended = true; break; }
          poss = k.good ? ls : ls; x = k.good ? 50 : 22; ended = true; break;
        }
        // To the corner: lineout and maul.
        x = Math.min(95, xx + 25); poss = ws;
        const set = team[ws].set - team[ls].set;
        const pMaul = clamp(0.22 + set / 60 + (x - 85) / 40, 0.08, 0.5);
        if (x >= 88 && rng() < pMaul) {
          const hook = XV[ws].find((p) => p.pos === 'Hooker') || XV[ws][1];
          const e = tryScored(ws, hook, 'maul'); e.text = 'Lineout, driving maul… ' + e.text;
          if (golden) over = true; ended = true; break;
        }
        push({ kind: 'lineout', s: ws, text: (ws === 0 ? A : B).name + ' kick to the corner for a lineout.', hl: false });
        ended = true; break;
      }
      // Drop goal late in a tight game.
      const fh = XV[s].find((p) => p.pos === 'Fly-half');
      if (fh && x > 62 && (t > 4500 || golden) && Math.abs(score[s] - score[o]) <= 2 && rng() < 0.08) {
        const good = rng() < clamp(0.55 + (fh.attrs.KCK - 85) / 80 - (100 - x - 22) / 60, 0.15, 0.8);
        if (good) { score[s] += 3; bx(s, fh.name).pts += 3; }
        push({ kind: 'drop', s, p: fh.name, good, text: fh.name + ' goes for the drop goal… ' + (good ? 'IT’S OVER!' : 'wide!'), hl: true, big: good });
        if (good && golden) { over = true; }
        poss = o; x = good ? 50 : 22; ended = true; break;
      }
      // Normal carry.
      const gain = Math.max(-2, Math.round(2.5 + gauss() * 3 + edge * 8 + (C.attrs.PWR - 85) / 15));
      bx(s, C.name).metres += gain; x = Math.min(99, Math.max(1, x + gain));
      const T2 = pickTackler(o); bx(o, T2.name).tackles++;
      if (!T2.avg && rng() < 0.04) push({ kind: 'tackle', s: o, b: T2.name, p: C.name, text: rugbyLine(rng, 'tackle', { b: T2.name, p: C.name }), hl: true });
      // Close to the line: forwards pick and go.
      if (x >= 96 && rng() < 0.35 + edge) { const e = tryScored(s, pickCarrier(s, false), 'close'); if (golden) over = true; ended = true; break; }
      // Kick for territory after a few phases deep in your own half.
      if (x < 40 && phases >= 3 && rng() < 0.4) { const kk = team[s].kicker; const len = 25 + Math.floor(rng() * 25) + (kk.attrs.KCK - 85) / 2; x = Math.min(95, x + len); poss = o; x = 100 - x; push({ kind: 'kick', s, p: kk.name, text: kk.name + ' kicks for territory (' + Math.round(len) + ' m).', hl: false }); ended = true; break; }
      if (phases > 14) { poss = o; x = 100 - x; push({ kind: 'held', s: o, text: 'Held up — turnover.', hl: false }); ended = true; break; }
    }
    if (over) break;
  }
  if (score[0] === score[1]) {
    // Kicking competition.
    const order = (s) => XV[s].slice().sort((a, b) => b.attrs.KCK - a.attrs.KCK).slice(0, 5);
    const made = [0, 0]; const kicks = [];
    for (let r = 0; r < 10; r++) {
      [0, 1].forEach((s) => { const k = order(s)[r % 5]; const g = rng() < clamp(0.72 + (k.attrs.KCK - 85) / 80, 0.2, 0.93); if (g) made[s]++; kicks.push({ s, p: k.name, g }); push({ kind: 'kickcomp', s, p: k.name, good: g, text: k.name + (g ? ' slots it.' : ' misses!'), hl: true }); });
      if (r >= 4 && made[0] !== made[1]) break;
    }
    if (made[0] === made[1]) made[rng() < 0.5 ? 0 : 1]++;
    const w = made[0] > made[1] ? 0 : 1; score[w] += 1;
    push({ kind: 'kcwin', s: w, text: (w === 0 ? A : B).name + ' win the kicking competition ' + made[w] + '–' + made[1 - w] + '!', hl: true, big: true });
  }
  // The last five minutes of a one-score game are always worth watching.
  ev.forEach((e) => { if (e.t > 4500 && Math.abs(e.score[0] - e.score[1]) <= 7 && ['try', 'pen', 'drop', 'turnover', 'break', 'card'].includes(e.kind)) e.hl = true; });
  const winner = score[0] > score[1] ? 0 : 1;
  const ht = ev.find((e) => e.kind === 'ht'); const halves = [ht ? ht.score : score, score];
  return { v: 'rugby', kind: 'rugby', score: [...score], winner, golden, halves, plays: ev, box, xv: XV.map((x2) => x2.map((p) => ({ name: p.name, itemId: p.itemId, pos: p.pos, fwd: p.fwd, avg: !!p.avg, ovr: p.ovr }))), et: golden, pens: null, sudden: golden, events: [] };
}
const rugbyMin = (t) => Math.min(80, Math.floor(t / 60) + 1) + (t >= 4800 ? '+' : '') + '′';
