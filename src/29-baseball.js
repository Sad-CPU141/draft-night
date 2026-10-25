/* ============================================================
   BASEBALL — the game for MLB Players and MLB Legends.
   Built like the other sports engines: estimate the players →
   simulate the whole game pitch by pitch → keep a timeline → animate.
   · Each team's drafted hitters bat at the top of the order; the rest
     of the nine are average hitters. The best drafted pitcher starts
     and goes until tired; other drafted pitchers come out of the
     bullpen (the best one closes); otherwise an average bullpen.
     Two-way players can do both.
   · Every pitch: ball, called or swinging strike, foul, hit by pitch,
     or in play — groundouts, flyouts, line drives, pop-ups, double
     plays, sac flies, errors, singles, doubles, triples and home
     runs. Counts, walks and strikeouts; runners advance by speed;
     fast runners steal. Pitchers tire with their pitch count. Nine
     innings, then extra innings with a runner on second; walk-offs.
   · Player numbers are Draft Night estimates (Now for MLB Players,
     Prime for MLB Legends), never official ratings.
   ============================================================ */
const MLB_PITCHERS = /Fried|Webb|Chris Sale|Crochet|Cease|Snell|Framber|Hunter Greene|Strider|Burnes|Logan Gilbert|Clase|Hader|Edwin Díaz|Sasaki|Cristopher Sánchez|Senga|Nolan Ryan|Koufax|Randy Johnson|Pedro Martínez|Rivera|Maddux|Cy Young|Walter Johnson|Seaver|Bob Gibson|Spahn|Mathewson|Satchel Paige|Fergie Jenkins|Halladay|Glavine|Smoltz|Eckersley|Hoffman|Steve Carlton|Bob Feller|Marichal|Yamamoto|Skenes|Skubal|Gerrit Cole|Wheeler|deGrom/;
const MLB_RELIEVERS = /Rivera|Hoffman|Eckersley|Clase|Hader|Edwin Díaz/;
const MLB_POWER = /Ruth|Aaron|Mays|Mantle|Gehrig|Bonds|Judge|Ohtani|Schwarber|Alonso|Stanton|McGwire|Sosa|Ortiz|Pujols|Thome|Killebrew|McCovey|Griffey|Harper|Trout|Yordan|Raleigh|Guerrero|Frank Thomas|Rooker|Olson|Schmidt|Reggie|Stargell|Cabrera|Banks|Manny|Rodriguez|Piazza|Bagwell/;
const MLB_CONTACT = /Gwynn|Ichiro|Ty Cobb|Ted Williams|Boggs|Carew|Musial|Freeman|Arraez|Altuve|DiMaggio|Jeter|Hornsby|Wagner|Molitor|Puckett|Brett|Edgar|Soto|Betts|Clemente|Jackie Robinson|Ramírez/;
const MLB_SPEED = /Rickey|Henderson|Ichiro|Acuña|Witt|De La Cruz|Carroll|Turner|Chisholm|Brock|Jackie Robinson|Mays|Cobb|Tatís|Abrams|Chourio|Ozzie|Raines/;
const MLB_PROFILE_SRC = `
Shohei Ohtani|98
Aaron Judge|96
Mookie Betts|92
Juan Soto|94
Mike Trout|93
Bobby Witt Jr.|93
Paul Skenes|94
Tarik Skubal|95
Gerrit Cole|91
Jacob deGrom|93
Yoshinobu Yamamoto|91
Babe Ruth|99
Hank Aaron|97
Willie Mays|98
Mickey Mantle|96
Lou Gehrig|97
Ted Williams|98
Barry Bonds|98
Ty Cobb|96
Nolan Ryan|95
Sandy Koufax|97
Randy Johnson|97
Pedro Martínez|98
Mariano Rivera|97
Greg Maddux|96
Walter Johnson|97
Cy Young|94`;
const MLB_PROFILE = {};
MLB_PROFILE_SRC.trim().split('\n').forEach((line) => { const [name, ovr] = line.split('|'); MLB_PROFILE[name.toLowerCase()] = { ovr: +ovr }; });
const MLB_ATTRS = { H: ['CON', 'POW', 'EYE', 'SPD'], P: ['STU', 'CTL', 'STA'] };
const MLB_ATTR_NAMES = { CON: 'Contact', POW: 'Power', EYE: 'Plate discipline', SPD: 'Speed', STU: 'Stuff', CTL: 'Control', STA: 'Stamina' };
function mlbRating(item) {
  const n = String(item.name || ''); const prof = MLB_PROFILE[n.toLowerCase()];
  const fixed = validRating(item.rating);
  const ovr = fixed ? clamp(Math.round(+item.rating), 1, 99) : prof ? prof.ovr : clamp(Math.round(76 + itemFame(item) * 18 + (unit('mlbo', n) - 0.5) * 6), 68, 95);
  const pitcher = MLB_PITCHERS.test(n) || /pitcher/i.test(item.desc || '');
  const two = /Ohtani/.test(n) || /pitcher and hitter/i.test(item.desc || '');
  const j = (k) => (unit('mlba', n, k) - 0.5) * 6;
  const hit = { CON: ovr + (MLB_CONTACT.test(n) ? 6 : MLB_POWER.test(n) ? -3 : 0) + j(1), POW: ovr + (MLB_POWER.test(n) ? 7 : MLB_CONTACT.test(n) ? -6 : 0) + j(2), EYE: ovr + j(3), SPD: ovr - 6 + (MLB_SPEED.test(n) ? 14 : 0) + j(4) };
  const pit = { STU: ovr + j(5), CTL: ovr + (/Maddux|Halladay|Glavine|Mathewson|Rivera/.test(n) ? 6 : /Ryan|Feller|Randy/.test(n) ? -4 : 0) + j(6), STA: (MLB_RELIEVERS.test(n) ? 45 : ovr) + j(7) };
  const attrs = {};
  if (!pitcher || two) Object.entries(hit).forEach(([k, v]) => { attrs[k] = clamp(Math.round(v), 35, 99); });
  if (pitcher || two) Object.entries(pit).forEach(([k, v]) => { attrs[k] = clamp(Math.round(v), 30, 99); });
  if (pitcher && !two) Object.assign(attrs, { CON: 35, POW: 30, EYE: 35, SPD: 45 });
  return { ovr, attrs, pitcher, two, reliever: MLB_RELIEVERS.test(n), estimated: !fixed };
}
const mlbEraOf = (topic) => eraOf(topic);
const MLB_AVG = 80;
const mlbAvgHitter = (k) => ({ name: 'Lineup hitter ' + k, itemId: null, attrs: { CON: MLB_AVG, POW: MLB_AVG - 2, EYE: MLB_AVG, SPD: MLB_AVG - 4 }, avg: true });
const mlbAvgPitcher = (k) => ({ name: k, itemId: null, attrs: { STU: MLB_AVG, CTL: MLB_AVG, STA: k === 'Starter' ? 80 : 45 }, avg: true });
function mlbTeam(d, m) {
  const ps = m.team.map((x) => { const it = x && d.items[x.itemId]; return it ? { name: it.name, itemId: it.id, price: x.price || 0, ...mlbRating(it) } : null; }).filter(Boolean);
  const hitters = ps.filter((p) => !p.pitcher || p.two).sort((a, b) => (b.attrs.CON + b.attrs.POW + b.attrs.EYE) - (a.attrs.CON + a.attrs.POW + a.attrs.EYE));
  // Batting order: best contact/speed leads off, best power bats third/fourth.
  const order = [];
  const pool = hitters.slice();
  const take = (score) => { if (!pool.length) return null; pool.sort((a, b) => score(b) - score(a)); return pool.shift(); };
  const slots = [take((p) => p.attrs.EYE + p.attrs.SPD + p.attrs.CON), take((p) => p.attrs.CON + p.attrs.EYE), take((p) => p.attrs.POW + p.attrs.CON), take((p) => p.attrs.POW * 2), take((p) => p.attrs.POW + p.attrs.CON)];
  let k = 1;
  for (let i = 0; i < 9; i++) order.push(i < 5 && slots[i] ? slots[i] : pool.shift() || mlbAvgHitter(k++));
  const pitchers = ps.filter((p) => p.pitcher || p.two);
  const starters = pitchers.filter((p) => !p.reliever).sort((a, b) => b.attrs.STU + b.attrs.CTL - a.attrs.STU - a.attrs.CTL);
  const pens = pitchers.filter((p) => !starters.includes(p) || starters.indexOf(p) > 0).sort((a, b) => (b.reliever - a.reliever) || b.attrs.STU - a.attrs.STU);
  const starter = starters[0] || mlbAvgPitcher('Starter');
  const closer = pens[0] || null; const middle = pens.slice(1);
  return { order, starter, closer, middle, players: ps };
}
const MLB_HIT_LINES = {
  hr: ['{b} crushes it — GONE! Home run!', '{b} launches one deep… it’s OUTTA HERE!', 'See ya! {b} goes yard!'],
  '3b': ['{b} rips it into the gap — he’s going for three… TRIPLE!', '{b} legs out a triple!'],
  '2b': ['{b} lines a double down the line!', '{b} doubles into the gap!'],
  '1b': ['{b} singles through the infield.', '{b} bloops one in for a hit.', '{b} lines a single to center.'],
  k: ['{p} strikes out {b}!', 'Strike three! {p} gets {b}.', '{b} goes down swinging.'],
  bb: ['{b} draws a walk.', 'Ball four to {b}.'],
};
const mlbLine = (rng, k, v) => { const ls = MLB_HIT_LINES[k]; return ls[Math.floor(rng() * ls.length)].replace('{b}', v.b || '').replace('{p}', v.p || ''); };

function simulateBaseball(d, A, B, key) {
  const rng = seeded(d.seed, 'mlb', key, A.id, B.id);
  const T = [mlbTeam(d, A), mlbTeam(d, B)];
  const score = [0, 0]; const ev = []; const line = [[], []];
  const box = [0, 1].map(() => ({}));
  const st = (s, name) => (box[s][name] = box[s][name] || { ab: 0, h: 0, hr: 0, rbi: 0, r: 0, bb: 0, k: 0, sb: 0, ip: 0, pk: 0, pbb: 0, pr: 0, ph: 0, pc: 0 });
  const pitching = [{ p: T[0].starter, pc: 0, used: [] }, { p: T[1].starter, pc: 0, used: [] }];
  const batIdx = [0, 0];
  let inning = 1, half = 0; let done = false; let walkoff = false;
  const push = (e) => { e.inn = inning; e.half = half; e.score = [...score]; e.i = ev.length; ev.push(e); return e; };
  const play = () => {
    const bat = half; const fld = 1 - half; const P = pitching[fld];
    let outs = 0; let bases = [null, null, null]; let runs = 0;
    if (inning >= 10) { const prev = T[bat].order[(batIdx[bat] + 8) % 9]; bases[1] = prev.name; push({ kind: 'ghost', s: bat, text: 'Extra innings: ' + prev.name + ' starts on second base.', hl: false }); }
    const scoreRuns = (names, batter, how) => { names.forEach((n) => { if (!n) return; runs++; score[bat]++; st(bat, n).r++; if (batter) st(bat, batter).rbi++; }); };
    while (outs < 3) {
      // Bullpen: tired starter, or the closer for a late lead.
      const lead = score[fld] - score[bat];
      const tired = P.pc > 70 + (P.p.attrs.STA - 70) * 1.2;
      const wantCloser = inning >= 9 && lead > 0 && lead <= 3 && T[fld].closer && P.p !== T[fld].closer && !P.used.includes(T[fld].closer.name);
      if (tired || wantCloser) {
        const next = wantCloser ? T[fld].closer : T[fld].middle.find((x) => !P.used.includes(x.name) && x !== P.p) || (P.p.avg && P.p.name === 'Bullpen' ? null : mlbAvgPitcher('Bullpen'));
        if (next && next !== P.p) { P.used.push(P.p.name); push({ kind: 'pchange', s: fld, p: next.name, out: P.p.name, text: 'Pitching change: ' + (next.avg ? 'the bullpen' : next.name) + ' comes in' + (P.p.avg ? '' : ' for ' + P.p.name + ' (' + P.pc + ' pitches)') + '.', hl: !next.avg && wantCloser }); P.p = next; P.pc = 0; }
      }
      const pit = P.p; const B2 = T[bat].order[batIdx[bat] % 9]; batIdx[bat]++;
      const H = B2.attrs; const Pa = pit.attrs;
      const fat = Math.max(0, P.pc - (60 + (Pa.STA - 70))) / 120;
      const edge = (H.CON - Pa.STU) / 100 - fat * 0.6;
      // Steal attempt before the pitch?
      if (bases[0] && !bases[1] && outs < 2) { const run = T[bat].order.find((x) => x.name === bases[0]); if (run && run.attrs.SPD > 88 && rng() < (run.attrs.SPD - 85) / 40) { const safe = rng() < 0.62 + (run.attrs.SPD - 88) / 60; if (safe) { st(bat, run.name).sb++; bases[1] = bases[0]; bases[0] = null; push({ kind: 'sb', s: bat, b: run.name, text: run.name + ' steals second!', hl: !run.avg, outs, bases: [...bases] }); } else { bases[0] = null; outs++; push({ kind: 'cs', s: bat, b: run.name, text: run.name + ' is caught stealing!', hl: !run.avg, outs, bases: [...bases] }); if (outs >= 3) break; } } }
      // Pitch by pitch.
      let balls = 0, strikes = 0, res = null; const pitches = [];
      while (!res) {
        P.pc++;
        const zone = clamp(0.485 + (Pa.CTL - 80) / 220 - fat * 0.25, 0.32, 0.68);
        const inZone = rng() < zone;
        const swingP = inZone ? clamp(0.67 + (strikes === 2 ? 0.12 : 0) - (H.EYE - 80) / 500, 0.45, 0.88) : clamp(0.29 - (H.EYE - 80) / 220 + (strikes === 2 ? 0.1 : 0), 0.1, 0.45);
        if (!inZone && rng() < 0.006) { res = 'hbp'; pitches.push('H'); break; }
        if (rng() >= swingP) { if (inZone) { strikes++; pitches.push('C'); } else { balls++; pitches.push('B'); } }
        else {
          const contact = clamp((inZone ? 0.82 : 0.58) + edge * 0.35, 0.45, 0.95);
          if (rng() >= contact) { strikes++; pitches.push('S'); }
          else if (rng() < 0.42) { if (strikes < 2) strikes++; pitches.push('F'); }
          else { res = 'inplay'; pitches.push('X'); }
        }
        if (balls >= 4) res = 'bb';
        else if (strikes >= 3) res = 'k';
      }
      const pcName = pit.name; st(fld, pcName).pc = (st(fld, pcName).pc || 0) + pitches.length;
      const base = { s: bat, b: B2.name, p: pcName, pitches: pitches.join(''), outsBefore: outs, basesBefore: [...bases] };
      if (res === 'k') { outs++; st(bat, B2.name).ab++; st(bat, B2.name).k++; st(fld, pcName).pk++; push({ ...base, kind: 'k', swing: pitches[pitches.length - 1] === 'S', text: mlbLine(rng, 'k', { p: pit.avg ? 'The pitcher' : pcName, b: B2.name }), outs, bases: [...bases], hl: !pit.avg && (bases[1] || bases[2]) != null && rng() < 0.6 }); continue; }
      if (res === 'bb' || res === 'hbp') {
        st(bat, B2.name).bb++; st(fld, pcName).pbb++;
        const forced = [];
        if (bases[0]) { if (bases[1]) { if (bases[2]) forced.push(bases[2]); bases[2] = bases[1]; } bases[1] = bases[0]; }
        bases[0] = B2.name; scoreRuns(forced, B2.name);
        push({ ...base, kind: res, text: res === 'hbp' ? B2.name + ' is hit by the pitch.' : mlbLine(rng, 'bb', { b: B2.name }) + (forced.length ? ' A run walks in!' : ''), outs, bases: [...bases], hl: forced.length > 0 });
        continue;
      }
      // Ball in play.
      st(bat, B2.name).ab++;
      const pHit = clamp(0.318 + edge * 0.28 - fat * -0.12, 0.2, 0.42);
      const power = (H.POW - Pa.STU * 0.6 - 30) / 100;
      const x = rng();
      if (x < pHit) {
        const hrShare = clamp(0.135 + power * 0.42 + fat * 0.08, 0.02, 0.38);
        const y = rng();
        const kind = y < hrShare ? 'hr' : y < hrShare + 0.03 + (H.SPD - 80) / 600 ? '3b' : y < hrShare + 0.24 + power * 0.12 ? '2b' : '1b';
        st(bat, B2.name).h++; st(fld, pcName).ph++;
        const run = (n) => T[bat].order.find((p) => p.name === n);
        const fast = (n) => { const r = run(n); return r ? r.attrs.SPD : 76; };
        let scored = [];
        if (kind === 'hr') { scored = [bases[2], bases[1], bases[0], B2.name].filter(Boolean); bases = [null, null, null]; st(bat, B2.name).hr++; }
        else if (kind === '3b') { scored = bases.filter(Boolean); bases = [null, null, B2.name]; }
        else if (kind === '2b') { scored = [bases[2], bases[1]].filter(Boolean); const r1 = bases[0]; bases = [null, B2.name, null]; if (r1) { if (rng() < 0.35 + (fast(r1) - 80) / 60) scored.push(r1); else bases[2] = r1; } }
        else { if (bases[2]) scored.push(bases[2]); const r2 = bases[1], r1 = bases[0]; bases = [B2.name, null, null]; if (r2) { if (rng() < 0.55 + (fast(r2) - 80) / 60) scored.push(r2); else bases[2] = r2; } if (r1) { if (!bases[2] && rng() < 0.28 + (fast(r1) - 80) / 80) bases[2] = r1; else bases[1] = r1; } }
        scoreRuns(scored, B2.name);
        const grand = kind === 'hr' && scored.length === 4;
        const e = push({ ...base, kind, runs: scored.length, text: (grand ? 'GRAND SLAM! ' : '') + mlbLine(rng, kind, { b: B2.name }) + (scored.length && kind !== 'hr' ? ' ' + scored.length + ' run' + (scored.length > 1 ? 's' : '') + ' score' + (scored.length > 1 ? '' : 's') + '!' : kind === 'hr' && scored.length > 1 ? ' ' + scored.length + '-run homer!' : ''), outs, bases: [...bases], hl: kind === 'hr' || scored.length > 0 || kind === '3b', big: kind === 'hr' });
        if (half === 1 && inning >= 9 && score[1] > score[0]) { e.walkoff = true; e.text = 'WALK-OFF! ' + e.text; e.hl = true; e.big = true; walkoff = true; return runs; }
        continue;
      }
      // Outs: grounders, flies, liners, pop-ups; errors; double plays; sac flies.
      if (rng() < 0.014) { const r3 = bases[2]; bases = [B2.name, bases[0], bases[1]]; if (r3) scoreRuns([r3], null); push({ ...base, kind: 'err', text: 'Error! ' + B2.name + ' reaches on a fumbled grounder' + (r3 ? ' and a run scores.' : '.'), outs, bases: [...bases], hl: !!r3 }); if (half === 1 && inning >= 9 && score[1] > score[0]) { walkoff = true; return runs; } continue; }
      const type = weighted(rng, [['gb', 0.44 - power * 0.2], ['fb', 0.3 + power * 0.2], ['ld', 0.12], ['pu', 0.1]], (z) => Math.max(0.02, z[1]))[0];
      let text, kind = 'out', dp = false, sac = false; const scored = [];
      if (type === 'gb' && bases[0] && outs < 2 && rng() < 0.42 - (H.SPD - 80) / 200) { outs += 2; dp = true; bases[0] = null; if (bases[2] && outs < 3) { scored.push(bases[2]); bases[2] = null; } if (bases[1] && outs < 3) { bases[2] = bases[1]; bases[1] = null; } text = B2.name + ' grounds into a DOUBLE PLAY!'; kind = 'dp'; }
      else {
        outs++;
        if (type === 'fb' && bases[2] && outs < 3 && rng() < 0.6) { scored.push(bases[2]); bases[2] = null; sac = true; }
        if (type === 'gb' && outs < 3) { if (bases[2] && !bases[1] && rng() < 0.4) { scored.push(bases[2]); bases[2] = null; } if (bases[1] && !bases[2]) { bases[2] = bases[1]; bases[1] = null; } if (bases[0] && !bases[1]) { bases[1] = bases[0]; bases[0] = null; } }
        text = B2.name + ({ gb: ' grounds out', fb: sac ? ' hits a sacrifice fly — a run scores' : ' flies out', ld: ' lines out', pu: ' pops up' })[type] + '.';
        if (type === 'ld' && rng() < 0.3) text = 'Diving catch! ' + B2.name + ' is robbed on a line drive.';
      }
      if (scored.length) scoreRuns(scored, dp ? null : B2.name);
      if (sac) st(bat, B2.name).ab--;
      const e = push({ ...base, kind, type, dp, sac, runs: scored.length, text, outs: Math.min(3, outs), bases: [...bases], hl: dp || /Diving/.test(text) || scored.length > 0 });
      if (half === 1 && inning >= 9 && score[1] > score[0]) { e.walkoff = true; e.text = 'WALK-OFF! ' + e.text; e.hl = true; walkoff = true; return runs; }
    }
    return runs;
  };
  while (!done) {
    for (half = 0; half < 2; half++) {
      if (half === 1 && inning >= 9 && score[1] > score[0]) { line[1].push('X'); break; }
      const r = play(); line[half].push(r);
      if (walkoff) break;
      push({ kind: 'side', s: half, text: (half === 0 ? 'Top' : 'Bottom') + ' of the ' + inning + ordinalSuffix(inning) + ': ' + r + ' run' + (r === 1 ? '' : 's') + '. ' + score[0] + '–' + score[1] + '.', hl: false });
    }
    if (inning >= 9 && score[0] !== score[1]) done = true;
    if (inning >= 15 && score[0] === score[1]) { const w = rng() < 0.5 ? 0 : 1; score[w]++; line[w][line[w].length - 1] = (+line[w][line[w].length - 1] || 0) + 1; push({ kind: 'end', s: w, text: 'A wild pitch brings home the winning run in the 15th!', hl: true }); done = true; }
    if (!done) inning++;
  }
  // Late innings of a close game are always worth watching.
  ev.forEach((e) => { if (e.inn >= 9 && Math.abs(e.score[0] - e.score[1]) <= 2 && ['k', 'out', '1b', '2b', '3b', 'hr', 'dp', 'bb'].includes(e.kind)) e.hl = true; });
  const winner = score[0] > score[1] ? 0 : 1;
  const hits = [0, 1].map((s) => ev.filter((e) => e.s === s && ['1b', '2b', '3b', 'hr'].includes(e.kind)).length);
  const lineups = T.map((t) => ({ order: t.order.map((p) => ({ name: p.name, itemId: p.itemId, avg: !!p.avg })), starter: t.starter.name, pitchers: [t.starter, t.closer, ...t.middle].filter(Boolean).map((p) => p.name) }));
  return { v: 'mlb', kind: 'mlb', score: [...score], winner, innings: inning, line, hits, plays: ev, box, lineups, walkoff, et: inning > 9, pens: null, sudden: false, events: [] };
}
const ordinalSuffix = (n) => (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
