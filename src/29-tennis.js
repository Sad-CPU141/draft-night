/* ============================================================
   TENNIS — a team tie for Tennis Players (like the United Cup).
   · Slot against slot: men's singles ×2 and women's singles ×2.
     Level at 2–2, a mixed doubles decider: each team's priciest man
     and priciest woman.
   · Every match is best of three sets, played point by point with
     real scoring: deuce, advantage, breaks, 7-point tiebreaks at 6–6
     and a 10-point tiebreak in the deciding set.
   · Each point: aces, double faults and service winners from the
     serve against the return; otherwise a rally, ended by a winner
     (forehand, backhand, volley, smash, passing shot, lob, drop shot),
     a forced error or an unforced error. Big points (break, set and
     match points) lean on nerve. Grass helps big servers, clay helps
     the grinders, hard is in between; specialists get a lift on their
     surface.
   · Player numbers are Draft Night estimates (Prime), never official.
   ============================================================ */
const TEN_ATTRS = ['SRV', 'RET', 'GRD', 'MOV', 'NET', 'MEN'];
const TEN_ATTR_NAMES = { SRV: 'Serve', RET: 'Return', GRD: 'Groundstrokes', MOV: 'Movement', NET: 'Net play', MEN: 'Nerve' };
const TEN_PROFILE_SRC = `
Novak Djokovic|98|RET+6 MOV+5 MEN+6
Rafael Nadal|97|MOV+6 MEN+5 GRD+4 clay
Roger Federer|97|SRV+3 NET+5 grass
Carlos Alcaraz|95|MOV+5 NET+3
Jannik Sinner|95|GRD+5 RET+3
Andy Murray|91|RET+6 MOV+5 SRV-3
Pete Sampras|95|SRV+8 NET+6 RET-3 grass
Andre Agassi|93|RET+8 GRD+4 SRV-4
Daniil Medvedev|90|MOV+5 RET+4 NET-5
Alexander Zverev|89|SRV+5
Taylor Fritz|86|SRV+6 MOV-3
Félix Auger-Aliassime|84|SRV+4
Stan Wawrinka|89|GRD+6
Nick Kyrgios|85|SRV+9 MEN-6
Ben Shelton|84|SRV+10 RET-5
Boris Becker|92|SRV+7 NET+5 grass
Stefan Edberg|91|NET+8 grass
John McEnroe|93|NET+8 grass
Björn Borg|95|MOV+5 MEN+5 clay
Jimmy Connors|92|RET+6 MEN+4
Ivan Lendl|93|GRD+6
Lleyton Hewitt|88|MOV+6 RET+4 SRV-4
Andy Roddick|87|SRV+10 RET-5
Marat Safin|88|GRD+4 MEN-4
Juan Martín del Potro|88|GRD+6 MOV-3
Dominic Thiem|88|GRD+4 clay
Stefanos Tsitsipas|87|clay
Casper Ruud|86|clay
Holger Rune|84|
Grigor Dimitrov|85|
Rod Laver|96|
Gustavo Kuerten|89|clay
Marin Čilić|85|SRV+5
Jack Draper|84|
Denis Shapovalov|82|
Milos Raonic|84|SRV+10 MOV-5
Frances Tiafoe|83|
Tommy Paul|83|
Lorenzo Musetti|84|clay
João Fonseca|82|
Serena Williams|98|SRV+8 GRD+5 MEN+5
Venus Williams|92|SRV+5 grass
Steffi Graf|97|GRD+5 MOV+5
Iga Świątek|94|RET+5 clay
Aryna Sabalenka|93|SRV+6 GRD+6 MOV-2
Coco Gauff|90|MOV+6 SRV-2
Maria Sharapova|90|GRD+5 MEN+4 MOV-4
Naomi Osaka|89|SRV+6
Bianca Andreescu|84|
Leylah Fernandez|82|
Martina Navratilova|96|NET+9 SRV+4 grass
Elena Rybakina|90|SRV+9 grass
Ons Jabeur|86|NET+4
Emma Raducanu|82|
Madison Keys|86|SRV+5
Chris Evert|95|MEN+6 NET-4 GRD+4 clay
Billie Jean King|93|NET+7
Monica Seles|94|GRD+6 RET+4
Martina Hingis|91|MEN+3 SRV-4
Justine Henin|92|GRD+5 clay
Kim Clijsters|90|MOV+5
Lindsay Davenport|89|GRD+4 MOV-4
Caroline Wozniacki|87|MOV+6 GRD-3
Simona Halep|88|MOV+5 clay
Petra Kvitová|88|SRV+3 grass
Victoria Azarenka|88|RET+4
Angelique Kerber|88|MOV+5
Ashleigh Barty|91|NET+5 grass
Jessica Pegula|85|
Jasmine Paolini|85|clay
Mirra Andreeva|85|
Zheng Qinwen|85|SRV+4
Li Na|87|
Garbiñe Muguruza|87|
Amélie Mauresmo|87|NET+4
Barbora Krejčíková|86|
Elina Svitolina|86|MOV+4
Markéta Vondroušová|84|`;
const TEN_PROFILE = {};
TEN_PROFILE_SRC.trim().split('\n').forEach((line) => {
  const [name, ovr, tw] = line.split('|'); const tweak = {}; let surf = null;
  (tw || '').split(' ').filter(Boolean).forEach((t) => { const m = t.match(/^([A-Z]+)([+-]\d+)$/); if (m) tweak[m[1]] = +m[2]; else if (t === 'clay' || t === 'grass') surf = t; });
  TEN_PROFILE[name.toLowerCase()] = { ovr: +ovr, tweak, surf };
});
const TEN_SURFACES = {
  grass: { name: 'Grass', event: 'on the lawns', serve: 0.035, ace: 0.03, rally: 0.8, court: '#5aa646', court2: '#4e9a3c', out: '#3f7f31' },
  hard: { name: 'Hard court', event: 'on the hard courts', serve: 0, ace: 0, rally: 1, court: '#3d6be2', court2: '#3560cf', out: '#2f8a5a' },
  clay: { name: 'Clay', event: 'on the red clay', serve: -0.03, ace: -0.02, rally: 1.35, court: '#d0773f', court2: '#c56c35', out: '#b86230' },
};
const tenWomen = (item, slot) => /WOMEN|WOMAN|LADIES|WTA/.test(norm((item && item.pos) || slot));
function tenRating(item) {
  const prof = TEN_PROFILE[String(item.name || '').toLowerCase()];
  const fixed = validRating(item.rating);
  const ovr = fixed ? clamp(Math.round(+item.rating), 1, 99) : prof ? prof.ovr : clamp(Math.round(74 + itemFame(item) * 22 + (unit('teo', item.name) - 0.5) * 6), 65, 95);
  const tw = prof ? prof.tweak : {};
  const attrs = {};
  TEN_ATTRS.forEach((a) => { attrs[a] = clamp(Math.round(ovr + (tw[a] || 0) + (unit('tea', item.name, a) - 0.5) * 6), 40, 99); });
  return { ovr, attrs, surf: prof ? prof.surf : null, estimated: !fixed };
}
// Point endings. Index is stored with each point.
const TEN_HOW = ['ace', 'df', 'svw', 'fh', 'bh', 'volley', 'smash', 'pass', 'lob', 'drop', 'forced', 'ue'];
const TEN_HOW_WORD = { ace: 'Ace', df: 'Double fault', svw: 'Service winner', fh: 'Forehand winner', bh: 'Backhand winner', volley: 'Volley winner', smash: 'Smash', pass: 'Passing shot', lob: 'Lob winner', drop: 'Drop shot winner', forced: 'Forced error', ue: 'Unforced error' };
// The scoreboard. Same rules for the simulation and the replay on screen.
function tennisScorer(cfg) {
  const S = { sets: [], games: [0, 0], pts: [0, 0], tb: false, setsWon: [0, 0], server: cfg.firstServer || 0, tbStart: 0, done: false, winner: null, bestOf: cfg.bestOf || 3 };
  const need = Math.ceil(S.bestOf / 2);
  const finalSet = () => S.setsWon[0] === need - 1 && S.setsWon[1] === need - 1;
  const tbTarget = () => (finalSet() ? 10 : 7);
  // Who's one point away from what (before the point is played).
  S.flags = () => {
    const f = { bp: false, sp: null, mp: null, tb: S.tb };
    const wouldWinGame = (w) => (S.tb ? S.pts[w] + 1 >= tbTarget() && S.pts[w] + 1 - S.pts[1 - w] >= 2 : S.pts[w] >= 3 && S.pts[w] - S.pts[1 - w] >= 1);
    [0, 1].forEach((w) => {
      if (!wouldWinGame(w)) return;
      if (!S.tb && w !== S.server) f.bp = true;
      const g = [...S.games]; g[w]++;
      const wonSet = S.tb || (g[w] >= 6 && g[w] - g[1 - w] >= 2);
      if (wonSet) { if (S.setsWon[w] + 1 >= need) f.mp = w; else f.sp = w; }
    });
    return f;
  };
  S.point = (w) => {
    if (S.done) return;
    S.pts[w]++;
    if (S.tb) {
      if (S.pts[w] >= tbTarget() && S.pts[w] - S.pts[1 - w] >= 2) { S.games[w]++; const tbPts = [...S.pts]; endSet(w, tbPts); S.server = 1 - S.tbStart; return; }
      const n = S.pts[0] + S.pts[1]; if (n % 2 === 1) S.server = 1 - S.server;
      return;
    }
    if (S.pts[w] >= 4 && S.pts[w] - S.pts[1 - w] >= 2) {
      S.games[w]++; S.pts = [0, 0]; S.server = 1 - S.server;
      if (S.games[w] >= 6 && S.games[w] - S.games[1 - w] >= 2) endSet(w, null);
      else if (S.games[0] === 6 && S.games[1] === 6) { S.tb = true; S.tbStart = S.server; }
    }
  };
  function endSet(w, tbPts) {
    S.sets.push({ g: [...S.games], tb: tbPts });
    S.setsWon[w]++; S.games = [0, 0]; S.pts = [0, 0]; S.tb = false;
    if (S.setsWon[w] >= need) { S.done = true; S.winner = w; }
  }
  S.label = () => {
    if (S.tb) return S.pts[0] + '–' + S.pts[1];
    const P = ['0', '15', '30', '40'];
    const [a, b] = S.pts;
    if (a >= 3 && b >= 3) return a === b ? 'Deuce' : (a > b ? 'Ad ' : 'Ad ') + (a > b ? 'A' : 'B');
    return P[Math.min(3, a)] + '–' + P[Math.min(3, b)];
  };
  return S;
}

// One match. sides: [[players], [players]] (one each, or two for doubles).
function tennisMatch(rng, sides, cfg) {
  const surf = TEN_SURFACES[cfg.surface];
  const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += rng(); return (u - 2) / 0.58; };
  const eff = sides.map((ps) => {
    const avg = {}; TEN_ATTRS.forEach((a) => { avg[a] = ps.reduce((n, p) => n + p.attrs[a] + (p.surf === cfg.surface ? 3 : p.surf ? -1 : 0), 0) / ps.length; });
    if (ps.length > 1) avg.NET += 4; // doubles is played at the net
    return avg;
  });
  const form = sides.map(() => gauss() * 0.018);
  const base = cfg.doubles ? 0.65 : cfg.women ? 0.565 : 0.64;
  const first = rng() < 0.5 ? 0 : 1;
  const S = tennisScorer({ bestOf: 3, firstServer: first });
  const pts = []; const stats = [0, 1].map(() => ({ aces: 0, dfs: 0, winners: 0, ue: 0, bp: 0, bpWon: 0, pts: 0, longest: 0 }));
  let guard = 0; let lastBreak = null;
  while (!S.done && guard++ < 600) {
    const s = S.server, r = 1 - s; const A = eff[s], R = eff[r];
    const f = S.flags();
    const big = f.bp || f.sp != null || f.mp != null;
    let p = base + surf.serve + (A.SRV - R.RET) / 210 + (A.GRD - R.GRD) / 480 + (A.MOV - R.MOV) / 700 + form[s] - form[r];
    if (big) p += (A.MEN - R.MEN) / 260;
    if (lastBreak === r) p -= 0.02; // just broken: the other player has the momentum
    p = clamp(p, 0.33, 0.9);
    const ace = clamp((0.045 + (A.SRV - 82) / 190 + surf.ace - (R.RET - 82) / 420) * (cfg.women ? 0.65 : 1) * (cfg.doubles ? 0.7 : 1), 0.008, 0.24);
    const df = clamp(0.032 - (A.SRV - 82) / 700 - (A.MEN - 82) / 900 + (f.bp ? 0.012 : 0), 0.008, 0.08);
    const x = rng(); let w, how, shots, by;
    if (x < ace) { w = s; how = 'ace'; shots = 1; by = s; }
    else if (x < ace + df) { w = r; how = 'df'; shots = 0; by = s; }
    else {
      const pr = clamp((p - ace) / (1 - ace - df), 0.2, 0.92);
      w = rng() < pr ? s : r;
      if (w === s && rng() < 0.16 + (A.SRV - 82) / 300) { how = 'svw'; shots = 1; by = s; }
      else {
        shots = 2 + Math.floor(-Math.log(1 - rng() * 0.999) * 3.4 * surf.rally * (cfg.doubles ? 0.6 : 1) * (1 + (A.MOV + R.MOV - 170) / 200));
        shots = Math.min(40, shots);
        const W = eff[w], L = eff[1 - w];
        const net = clamp((W.NET - 75) / 120 + (cfg.doubles ? 0.25 : 0), 0.02, 0.6);
        const opts = [
          ['fh', 3 + (W.GRD - 80) / 8], ['bh', 2 + (W.GRD - 80) / 12], ['volley', net * 8], ['smash', net * 2.5], ['pass', (L.NET > 85 ? 1.5 : 0.5)], ['lob', 0.5], ['drop', 0.4 + (W.NET > 88 ? 0.6 : 0)],
          ['forced', 4 + (W.GRD - L.MOV) / 15], ['ue', 4 + shots * 0.25 + (82 - L.MEN) / 10 + (big ? 1 : 0)],
        ].filter((o) => o[1] > 0);
        how = weighted(rng, opts, (o) => o[1])[0];
        by = how === 'ue' || how === 'forced' ? 1 - w : w;
      }
    }
    const st = stats[w]; st.pts++;
    if (how === 'ace') stats[s].aces++;
    if (how === 'df') stats[s].dfs++;
    if (['fh', 'bh', 'volley', 'smash', 'pass', 'lob', 'drop', 'ace', 'svw'].includes(how)) stats[w].winners++;
    if (how === 'ue' || how === 'df') stats[by].ue++;
    if (f.bp) { stats[r].bp++; if (w === r) stats[r].bpWon++; }
    stats[0].longest = Math.max(stats[0].longest, shots); stats[1].longest = stats[0].longest;
    pts.push(w | (TEN_HOW.indexOf(how) << 1) | (Math.min(63, shots) << 5));
    const g0 = S.games[0] + S.games[1], n0 = S.sets.length, wasServer = S.server, wasTb = S.tb;
    S.point(w);
    if (S.games[0] + S.games[1] !== g0 || S.sets.length !== n0) lastBreak = !wasTb && w !== wasServer ? w : null;
  }
  return { first, pts, sets: S.sets, winner: S.winner, stats };
}
// Replays the stored points through the scoreboard (for the screen and the report).
function tennisReplay(m) {
  const S = tennisScorer({ bestOf: 3, firstServer: m.serve });
  const out = [];
  m.pts.forEach((code, i) => {
    const w = code & 1, how = TEN_HOW[(code >> 1) & 15], shots = code >> 5;
    const before = { sets: S.sets.map((x) => x.g), games: [...S.games], pts: [...S.pts], tb: S.tb, server: S.server, label: S.label(), flags: S.flags(), setNo: S.sets.length + 1 };
    S.point(w);
    const after = { sets: S.sets.map((x) => x.g), games: [...S.games], pts: [...S.pts], tb: S.tb, server: S.server, setsWon: [...S.setsWon], done: S.done };
    const gameOver = after.games[0] + after.games[1] !== before.games[0] + before.games[1] || after.sets.length !== before.sets.length;
    const brk = gameOver && !before.tb && w !== before.server;
    out.push({ i, w, how, shots, before, after, gameOver, brk, setOver: after.sets.length !== before.sets.length });
  });
  return out;
}

function simulateTennisTie(d, A, B, key) {
  const rng = seeded(d.seed, 'tennis', key, A.id, B.id);
  const surface = ['grass', 'hard', 'clay'][Math.floor(rng() * 3)];
  const slots = d.rules.slots;
  const row = (m, k) => { const x = m.team[k]; const it = x && d.items[x.itemId]; return it ? { name: it.name, itemId: it.id, price: x.price || 0, women: tenWomen(it, slots[k]), ...tenRating(it) } : null; };
  const sq = [A, B].map((m) => slots.map((_, k) => row(m, k)));
  const matches = []; const score = [0, 0];
  const play = (pa, pb, label, extra) => {
    const women = pa.every((p) => p.women) && pb.every((p) => p.women);
    const doubles = pa.length > 1;
    const m = tennisMatch(rng, [pa, pb], { surface, women, doubles });
    const res = { label, doubles, women, a: pa.map(tenView), b: pb.map(tenView), pts: m.pts, sets: m.sets.map((x) => (x.tb ? [x.g[0], x.g[1], x.tb[0], x.tb[1]] : x.g)), winner: m.winner, stats: m.stats, serve: m.first, ...(extra || {}) };
    return res;
  };
  const tenView = (p) => ({ name: p.name, itemId: p.itemId, price: p.price, ovr: p.ovr, women: p.women });
  slots.forEach((slot, k) => {
    const a = sq[0][k], b = sq[1][k];
    if (!a && !b) return;
    const label = (a || b).women ? 'Women’s singles' : 'Men’s singles';
    if (!a || !b) { const w = a ? 0 : 1; score[w]++; matches.push({ label, walkover: true, a: a ? [tenView(a)] : [], b: b ? [tenView(b)] : [], winner: w, pts: [], sets: [], score: [...score] }); return; }
    const m = play([a], [b], label); score[m.winner]++; m.score = [...score]; matches.push(m);
  });
  let how = 'matches';
  if (score[0] === score[1]) {
    // Mixed doubles decider: each team's priciest man and woman.
    const pickBest = (s, women) => sq[s].filter((p) => p && p.women === women).sort((x, y) => y.price - x.price || y.ovr - x.ovr)[0] || null;
    const pair = (s) => { const m2 = pickBest(s, false), w2 = pickBest(s, true); const ps = [m2, w2].filter(Boolean); return ps.length ? ps : sq[s].filter(Boolean).slice(0, 2); };
    const pa = pair(0), pb = pair(1);
    if (pa.length && pb.length) {
      const both = (ps) => (ps.length === 1 ? [ps[0], ps[0]] : ps);
      const m = play(both(pa), both(pb), 'Mixed doubles decider', { decider: true });
      score[m.winner]++; m.score = [...score]; matches.push(m); how = 'doubles';
    } else { const w = pa.length ? 0 : 1; score[w]++; how = 'walkover'; }
  }
  const winner = score[0] > score[1] ? 0 : 1;
  return { v: 'tennis', kind: 'tennis', surface, matches, score, winner, how, sudden: how === 'doubles', et: false, pens: null, events: [] };
}
