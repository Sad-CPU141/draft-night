/* ============================================================
   BASKETBALL — the game for NBA Players and NBA Legends.
   Built like the football engine: estimate players → simulate the
   whole game possession by possession → keep a timeline → animate.
   · Player numbers (Now for current players, Prime for legends) are
     Draft Night estimates from position and achievements, never
     official ratings. Attributes come from the role: guards shoot
     and pass, forwards do a bit of everything, centres rebound,
     block and finish inside.
   · Four 12-minute quarters, about 95 possessions each. Every
     possession: maybe a turnover or steal, else a shot (three,
     mid-range, drive, dunk/post) by a player picked by usage; the
     defender matched to him changes the odds; blocks, offensive
     rebounds, fouls, free throws and and-ones all happen. A tie
     after 48 minutes goes to 5-minute overtimes.
   · The animation shows the highlights (threes, dunks, blocks,
     steals, and every possession in the last two minutes of a close
     game); everything else rolls in as quick "runs" so the shown
     score always matches the recorded one.
   ============================================================ */
const HOOPS_SHAPE = {
  G: { SHO: 0.98, TPT: 1.02, PAS: 1.0, REB: 0.66, DEF: 0.86, ATH: 0.95, INS: 0.8 },
  F: { SHO: 0.96, TPT: 0.9, PAS: 0.86, REB: 0.88, DEF: 0.94, ATH: 0.98, INS: 0.92 },
  C: { SHO: 0.82, TPT: 0.62, PAS: 0.78, REB: 1.04, DEF: 1.0, ATH: 0.92, INS: 1.04 },
};
const HOOPS_ATTRS = ['SHO', 'TPT', 'PAS', 'REB', 'DEF', 'ATH', 'INS'];
const HOOPS_ATTR_NAMES = { SHO: 'Shooting', TPT: '3-point', PAS: 'Passing', REB: 'Rebounding', DEF: 'Defence', ATH: 'Athleticism', INS: 'Inside' };
const hoopsRole = (item, slot) => { const p = norm((item && item.pos) || slot || ''); return p === 'C' ? 'C' : p === 'F' ? 'F' : p === 'G' ? 'G' : 'F'; };
function hoopsRating(item, slot) {
  const fixed = validRating(item.rating);
  const ovr = fixed ? clamp(Math.round(+item.rating), 1, 99) : clamp(Math.round(66 + itemFame(item) * 28 + (unit('hovr', item.name) - 0.5) * 6), 55, 97);
  const role = hoopsRole(item, slot); const shape = HOOPS_SHAPE[role];
  const d = (item.desc || '') + ' ' + item.name;
  const tilt = { TPT: /shoot|three|splash|Dame|Curry|Ray Allen|Reggie|sharpshoot|stretch/i.test(d) ? 8 : 0, REB: /rebound|Rodman/i.test(d) ? 8 : 0, DEF: /Defensive|defen|block|Mutombo|Gobert/i.test(d) ? 8 : 0, PAS: /assist|Point God|triple|Magic|Stockton|Nash|Kidd/i.test(d) ? 8 : 0, ATH: /dunk|flyer|speed|Vinsanity|Human Highlight|Glide|Zion|Ja Morant/i.test(d) ? 8 : 0 };
  const attrs = {};
  HOOPS_ATTRS.forEach((a) => { attrs[a] = clamp(Math.round(ovr * shape[a] + (tilt[a] || 0) + (unit('hattr', item.name, a) - 0.5) * 10), 20, 99); });
  return { ovr, attrs, role, estimated: !fixed };
}
function hoopsSquad(d, m) {
  return m.team.map((t, i) => {
    if (!t || !d.items[t.itemId]) return null;
    const item = d.items[t.itemId];
    return { name: item.name, itemId: item.id, price: t.price || 0, slot: d.rules.slots[i], ...hoopsRating(item, d.rules.slots[i]) };
  }).filter(Boolean);
}
const HOOPS_LINES = {
  three: ['{p} from downtown… BANG!', '{p} pulls up from deep — it’s good!', 'Splash! {p} hits the three!'],
  dunk: ['{p} throws it DOWN!', 'What a slam from {p}!', '{p} rises up — POSTER!'],
  layup: ['{p} drives and finishes at the rim.', '{p} with the smooth lay-in.', '{p} spins and scores.'],
  mid: ['{p} with the pull-up jumper.', '{p} fades away… good!', '{p} hits from mid-range.'],
  post: ['{p} backs down and scores in the post.', '{p} with the hook shot.'],
  miss3: ['{p} fires from three… off the rim.', '{p} misses from deep.'],
  missIn: ['{p} can’t get it to drop.', '{p} misses at the rim.'],
  block: ['REJECTED! {b} swats {p}!', '{b} with the huge block on {p}!', 'Get that outta here! {b} blocks {p}!'],
  steal: ['{b} picks {p}’s pocket!', 'Stolen! {b} jumps the passing lane!', '{b} rips it from {p}!'],
  tov: ['{p} throws it away.', 'Travel on {p}.', '{p} steps out of bounds.'],
  oreb: ['{p} crashes the glass for the offensive rebound!'],
  andone: [' And one!', ' Plus the foul!'],
  ft: ['{p} at the line: {n} of 2.'],
};
const hoopsLine = (rng, k, v) => { const ls = HOOPS_LINES[k]; return ls[Math.floor(rng() * ls.length)].replace('{p}', v.p || '').replace('{b}', v.b || '').replace('{n}', v.n != null ? v.n : ''); };

function simulateBasketball(d, A, B, key) {
  const rng = seeded(d.seed, 'hoops', key, A.id, B.id);
  const sq = [hoopsSquad(d, A), hoopsSquad(d, B)];
  if (!sq[0].length || !sq[1].length) {
    const w = sq[0].length ? 0 : 1;
    return { v: 'hoops', kind: 'basketball', score: w === 0 ? [20, 0] : [0, 20], winner: w, forfeit: true, quarters: [], plays: [], beats: [], box: [{}, {}], ot: 0, et: false, pens: null, events: [] };
  }
  const avg = (s, a) => s.reduce((n, p) => n + p.attrs[a], 0) / s.length;
  const team = sq.map((s) => ({ off: avg(s, 'SHO') * 0.5 + avg(s, 'PAS') * 0.25 + avg(s, 'ATH') * 0.25, def: avg(s, 'DEF') * 0.7 + avg(s, 'ATH') * 0.3, reb: avg(s, 'REB'), size: 5 - s.length }));
  // Nights vary: each player has a hot or cold night, and each team runs hot or cold by quarter.
  const form = sq.map((s) => Object.fromEntries(s.map((p) => [p.name, (rng() - 0.5) * 0.12])));
  const heat = Array.from({ length: 10 }, () => [(rng() - 0.5) * 0.07, (rng() - 0.5) * 0.07]);
  const box = sq.map((s) => Object.fromEntries(s.map((p) => [p.name, { pts: 0, reb: 0, ast: 0, blk: 0, stl: 0, fgm: 0, fga: 0, tpm: 0 }])));
  const score = [0, 0]; const plays = [];
  const pick = (rows, w) => weighted(rng, rows, w);
  // Who guards whom: same role first, otherwise the closest.
  const matchup = (D, shooter) => sq[D].find((p) => p.role === shooter.role) || sq[D][0];
  const usage = (p) => (p.attrs.SHO * 0.6 + p.ovr * 0.4) * (p.role === 'C' ? 0.85 : 1);
  const periodLen = (q) => (q < 4 ? 720 : 300);
  let q = 0; let lead = 0;
  const playPeriod = (qi) => {
    const len = periodLen(qi);
    const poss = Math.round((qi < 4 ? 24 : 10) + (rng() - 0.5) * 3); // per team
    let o = qi % 2; // alternate who starts each period
    for (let k = 0; k < poss * 2; k++) {
      const clock = Math.max(0, Math.round(len * (1 - (k + 1) / (poss * 2)) + (rng() - 0.5) * 8));
      const O = o, D = 1 - o; o = D;
      const P = { q: qi, clock, team: O, pts: 0 };
      const offAdv = (team[O].off - team[D].def) / 100;
      // Turnover / steal.
      const tovP = clamp(0.12 - offAdv * 0.15 + team[O].size * 0.02, 0.06, 0.2);
      if (rng() < tovP) {
        const loser = pick(sq[O], (p) => usage(p) * (p.role === 'G' ? 1.4 : 1));
        if (rng() < 0.55) { const stealer = pick(sq[D], (p) => p.attrs.DEF * (p.role === 'G' ? 1.5 : 1) + p.attrs.ATH * 0.3); box[D][stealer.name].stl++; P.kind = 'steal'; P.p = loser.name; P.b = stealer.name; P.text = hoopsLine(rng, 'steal', { p: loser.name, b: stealer.name }); }
        else { P.kind = 'tov'; P.p = loser.name; P.text = hoopsLine(rng, 'tov', { p: loser.name }); }
        P.score = [...score]; plays.push(P); continue;
      }
      let shots = 0;
      while (shots < 3) {
        shots++;
        const shooter = pick(sq[O], usage);
        const def = matchup(D, shooter);
        const r = rng();
        const tptW = shooter.attrs.TPT / 100 * (shooter.role === 'C' ? 0.35 : 1);
        const insW = shooter.attrs.INS / 100 * (shooter.role === 'C' ? 1.5 : 0.9);
        const type = r < 0.36 * tptW / 0.85 ? 'three' : r < 0.36 * tptW / 0.85 + 0.22 ? 'mid' : rng() < (shooter.attrs.ATH - 62) / 80 + (shooter.role === 'C' ? 0.18 : 0) ? 'dunk' : shooter.role === 'C' && rng() < 0.4 ? 'post' : 'layup';
        const skill = type === 'three' ? shooter.attrs.TPT : type === 'mid' ? shooter.attrs.SHO : (shooter.attrs.INS + shooter.attrs.ATH) / 2;
        const base = { three: 0.355, mid: 0.43, layup: 0.56, dunk: 0.72, post: 0.5 }[type];
        const pMake = clamp(base + (skill - def.attrs.DEF) / 260 + offAdv * 0.08 + form[O][shooter.name] + heat[Math.min(9, P.q)][O], 0.18, 0.86);
        // Blocks happen at the rim, mostly from big men.
        const rim = type === 'layup' || type === 'dunk' || type === 'post';
        const blocker = rim ? pick(sq[D], (p) => (p.role === 'C' ? 3 : p.role === 'F' ? 1.4 : 0.5) * p.attrs.DEF) : null;
        if (rim && rng() < clamp(0.05 + (blocker.attrs.DEF - shooter.attrs.ATH) / 400 + (blocker.role === 'C' ? 0.03 : 0), 0.02, 0.14)) {
          box[D][blocker.name].blk++; box[O][shooter.name].fga++;
          Object.assign(P, { kind: 'block', p: shooter.name, b: blocker.name, type, text: hoopsLine(rng, 'block', { p: shooter.name, b: blocker.name }) });
          break;
        }
        const made = rng() < pMake;
        box[O][shooter.name].fga++;
        const passer = rng() < 0.62 ? pick(sq[O].filter((p) => p !== shooter), (p) => p.attrs.PAS * (p.role === 'G' ? 1.5 : 1)) : null;
        if (made) {
          const pts = type === 'three' ? 3 : 2;
          const andOne = rim && rng() < 0.08;
          const ft = andOne ? (rng() < 0.75 ? 1 : 0) : 0;
          score[O] += pts + ft; P.pts = pts + ft;
          box[O][shooter.name].pts += pts + ft; box[O][shooter.name].fgm++; if (type === 'three') box[O][shooter.name].tpm++;
          if (passer) box[O][passer.name].ast++;
          Object.assign(P, { kind: 'make', type, p: shooter.name, a: passer ? passer.name : null, text: hoopsLine(rng, type, { p: shooter.name }) + (passer && rng() < 0.6 ? ' Assist ' + passer.name + '.' : '') + (andOne ? hoopsLine(rng, 'andone', {}) + (ft ? '' : ' (misses the free throw)') : ''), andOne });
          break;
        }
        // Missed: shooting foul? (free throws) else rebound battle.
        if (rng() < (rim ? 0.16 : 0.05)) {
          const fts = type === 'three' ? 3 : 2; let m2 = 0; for (let f = 0; f < fts; f++) if (rng() < clamp(0.6 + (shooter.attrs.SHO - 60) / 120, 0.45, 0.92)) m2++;
          score[O] += m2; P.pts = m2; box[O][shooter.name].pts += m2;
          Object.assign(P, { kind: 'ft', type, p: shooter.name, n: m2, of: fts, text: shooter.name + ' is fouled — ' + m2 + ' of ' + fts + ' at the line.' });
          break;
        }
        const orebP = clamp(0.24 + (team[O].reb - team[D].reb) / 200, 0.12, 0.38);
        if (rng() < orebP && shots < 3) {
          const grab = pick(sq[O], (p) => p.attrs.REB * (p.role === 'C' ? 2 : p.role === 'F' ? 1.3 : 0.6)); box[O][grab.name].reb++;
          P.second = (P.second || []).concat([{ p: shooter.name, type, rebound: grab.name }]);
          continue;
        }
        const grab = pick(sq[D], (p) => p.attrs.REB * (p.role === 'C' ? 2 : p.role === 'F' ? 1.3 : 0.6)); box[D][grab.name].reb++;
        Object.assign(P, { kind: 'miss', type, p: shooter.name, r: grab.name, text: hoopsLine(rng, type === 'three' ? 'miss3' : 'missIn', { p: shooter.name }) + ' ' + grab.name + ' rebounds.' });
        break;
      }
      if (!P.kind) Object.assign(P, { kind: 'miss', type: 'mid', p: sq[O][0].name, r: sq[D][0].name, text: 'The shot clock runs down… no good.' });
      P.score = [...score];
      const newLead = Math.sign(score[0] - score[1]);
      if (newLead && newLead !== lead && lead !== 0) P.leadChange = true;
      if (newLead) lead = newLead;
      plays.push(P);
    }
  };
  for (q = 0; q < 4; q++) playPeriod(q);
  let ot = 0;
  while (score[0] === score[1] && ot < 4) { playPeriod(4 + ot); ot++; }
  if (score[0] === score[1]) { const w = rng() < 0.5 ? 0 : 1; score[w] += 2; plays.push({ q: 3 + ot, clock: 0, team: w, kind: 'make', type: 'mid', p: sq[w][0].name, pts: 2, text: sq[w][0].name + ' hits the winner at the buzzer!', score: [...score], buzzer: true }); }
  const winner = score[0] > score[1] ? 0 : 1;
  // Buzzer-beater: the winning team's last made basket in the final seconds of a close game.
  const lastP = plays[plays.length - 1];
  for (let k = plays.length - 1; k >= 0; k--) { const p = plays[k]; if (p.kind === 'make' && p.team === winner) { if (p.clock <= 4 && Math.abs(score[0] - score[1]) <= 3 && p.q === lastP.q) p.buzzer = true; break; } }
  // Which plays get animated: the highlights, plus the closing stretch of a tight game.
  const close = (p) => Math.abs(p.score[0] - p.score[1]) <= 6;
  const finalQ = 3 + ot;
  plays.forEach((p, k) => {
    p.i = k;
    const late = p.q === finalQ && p.clock <= 120 && close(p);
    p.hl = p.buzzer || late || (p.kind === 'make' && (p.type === 'dunk' || p.type === 'three')) || p.kind === 'block' || p.kind === 'steal' || p.andOne || p.leadChange;
  });
  // Thin the highlights so each period shows about 7–9 of them (late-game ones are always kept).
  for (let qi = 0; qi <= finalQ; qi++) {
    const hl = plays.filter((p) => p.q === qi && p.hl);
    const keepAll = hl.filter((p) => p.buzzer || (p.q === finalQ && p.clock <= 120 && close(p)));
    const rest = hl.filter((p) => !keepAll.includes(p));
    const want = Math.max(0, (qi < 4 ? 8 : 5) - keepAll.length);
    rest.forEach((p, j) => { if (j % Math.max(1, Math.ceil(rest.length / Math.max(1, want))) !== 0) p.hl = false; });
  }
  const quarters = Array.from({ length: 4 + ot }, (_, qi) => { const last = [...plays].reverse().find((p) => p.q === qi); const prev = [...plays].reverse().find((p) => p.q === qi - 1); return last ? [last.score[0] - (prev ? prev.score[0] : 0), last.score[1] - (prev ? prev.score[1] : 0)] : [0, 0]; });
  return { v: 'hoops', kind: 'basketball', score: [...score], winner, ot, quarters, plays, box, lineups: sq.map((s) => s.map((p) => ({ name: p.name, itemId: p.itemId, role: p.role, ovr: p.ovr }))), et: ot > 0, pens: null, events: [] };
}
const hoopsPeriodName = (q) => (q < 4 ? 'Q' + (q + 1) : q === 4 ? 'OT' : 'OT' + (q - 3));
const hoopsClock = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
