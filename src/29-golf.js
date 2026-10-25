/* ============================================================
   GOLF — a Ryder Cup-style match for Golfers.
   Built like the other sports engines: estimate the players →
   simulate every hole shot by shot → keep a timeline → animate.
   · Two fourball matches (picks 1+2 against 1+2, 3+4 against 3+4:
     best ball of the pair counts), then four singles. A hole is won
     by the lower score; level holes are halved. Matches end when one
     side is more holes up than there are holes left ("3&2"); level
     after 18 is a half point. Six points in all; 3–3 goes to a
     sudden-death playoff between each team's priciest player.
   · Every shot: drives (distance and accuracy — fairway, rough,
     bunker, water), approaches (how close, from what lie), chips and
     bunker shots (chip-ins happen), and putts that get harder with
     distance. Birdies, eagles, the odd hole-in-one, three-putts.
     Nerve matters on the closing holes. Everyone plays the same tees.
   · Player numbers are Draft Night estimates (Prime), never official.
   ============================================================ */
const GOLF_ATTRS = ['DRV', 'ACC', 'IRN', 'SHT', 'PUT', 'MEN'];
const GOLF_ATTR_NAMES = { DRV: 'Driving distance', ACC: 'Accuracy', IRN: 'Iron play', SHT: 'Short game', PUT: 'Putting', MEN: 'Nerve' };
const GOLF_PROFILE_SRC = `
Tiger Woods|99|MEN+6 IRN+3
Jack Nicklaus|98|MEN+5
Arnold Palmer|93|
Rory McIlroy|95|DRV+7 PUT-3
Scottie Scheffler|96|IRN+5 PUT-2
Phil Mickelson|93|SHT+7 ACC-4
Gary Player|94|SHT+3
Seve Ballesteros|95|SHT+8 ACC-6
Jon Rahm|94|
Brooks Koepka|93|MEN+4 DRV+3
Dustin Johnson|91|DRV+7
Jordan Spieth|91|PUT+6 SHT+4 DRV-4
Bryson DeChambeau|92|DRV+10 ACC-4
Xander Schauffele|92|
Justin Rose|89|
Ben Hogan|97|ACC+6 IRN+5
Sam Snead|95|
Bobby Jones|95|
Nick Faldo|93|ACC+4 MEN+3
Ernie Els|92|
Vijay Singh|91|
Annika Sörenstam|95|ACC+5
Nelly Korda|90|
Lydia Ko|90|PUT+3
Collin Morikawa|91|IRN+6 PUT-3
Tommy Fleetwood|89|
Ludvig Åberg|89|
Hideki Matsuyama|90|IRN+4
Shane Lowry|88|SHT+3
Tom Watson|94|
Lee Trevino|93|ACC+4
Greg Norman|92|DRV+4
Fred Couples|89|
Payne Stewart|90|
Walter Hagen|93|
Byron Nelson|95|
Gene Sarazen|92|
Colin Montgomerie|89|ACC+4
Sergio García|89|IRN+4 PUT-4
Pádraig Harrington|89|
Adam Scott|89|
Jason Day|89|
Justin Thomas|90|
Patrick Cantlay|89|PUT+3
Viktor Hovland|88|
Cameron Smith|89|PUT+5
Luke Donald|88|SHT+4
Lorena Ochoa|92|
Inbee Park|92|PUT+6
Karrie Webb|92|
Se Ri Pak|90|
Babe Didrikson Zaharias|92|`;
const GOLF_PROFILE = {};
GOLF_PROFILE_SRC.trim().split('\n').forEach((line) => { const [name, ovr, tw] = line.split('|'); const tweak = {}; (tw || '').split(' ').filter(Boolean).forEach((t) => { const m = t.match(/^([A-Z]+)([+-]\d+)$/); if (m) tweak[m[1]] = +m[2]; }); GOLF_PROFILE[name.toLowerCase()] = { ovr: +ovr, tweak }; });
function golfRating(item) {
  const prof = GOLF_PROFILE[String(item.name || '').toLowerCase()];
  const fixed = validRating(item.rating);
  const ovr = fixed ? clamp(Math.round(+item.rating), 1, 99) : prof ? prof.ovr : clamp(Math.round(76 + itemFame(item) * 18 + (unit('golfo', item.name) - 0.5) * 6), 70, 94);
  const tw = prof ? prof.tweak : {}; const attrs = {};
  GOLF_ATTRS.forEach((a) => { attrs[a] = clamp(Math.round(ovr + (tw[a] || 0) + (unit('golfa', item.name, a) - 0.5) * 6), 50, 99); });
  return { ovr, attrs, estimated: !fixed };
}
const GOLF_COURSE = [[4, 420], [4, 445], [3, 185], [5, 560], [4, 400], [4, 470], [3, 210], [4, 430], [5, 590], [4, 410], [4, 455], [3, 160], [5, 545], [4, 440], [4, 480], [3, 200], [4, 425], [5, 575]];
// One player's hole, shot by shot. Returns strokes and the shots (for the animation and highlights).
function golfHole(rng, P, hole, ctx) {
  const A = P.attrs; const [par, len] = hole;
  const press = ctx.pressure ? (A.MEN - 85) / 400 : 0;
  const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += rng(); return (u - 2) / 0.58; };
  const shots = []; let strokes = 0; let left = len; let lie = 'tee'; let onGreen = false; let feet = 0; let holed = false;
  const wind = ctx.wind;
  while (!holed && strokes < 10) {
    if (!onGreen) {
      strokes++;
      const from = left; const fromLie = lie;
      if (left > 240 && lie !== 'bunker') {
        // Driver (or a long fairway wood on a par 5).
        const dist = Math.min(left - 20, 285 + (A.DRV - 85) * 2.4 + gauss() * 14 - wind * 8 - (lie === 'rough' ? 25 : 0));
        const fw = clamp(0.64 + (A.ACC - 85) / 150 - wind * 0.06 + press, 0.3, 0.88);
        const r = rng();
        left = Math.max(5, left - dist);
        lie = r < fw ? 'fairway' : r < fw + (1 - fw) * 0.72 ? 'rough' : r < fw + (1 - fw) * 0.92 ? 'bunker' : 'water';
        shots.push({ k: 'drive', from, to: left, lie, x: (unit('gx', ctx.key, strokes) - 0.5) * (lie === 'fairway' ? 0.4 : 1.2) });
        if (lie === 'water') { strokes++; lie = 'rough'; shots.push({ k: 'penalty', from: left, to: left, lie }); }
        continue;
      }
      // Approach / chip / bunker shot to the green.
      const lieF = { tee: 1, fairway: 1, rough: 1.55, bunker: 1.9, water: 1.6 }[lie];
      const near = left < 40;
      const skill = near ? A.SHT : A.IRN;
      const base = near ? 0.1 * left + 2 : left * 0.085 + 6;
      const prox = Math.max(0.5, base * lieF * (1.12 - (skill - 80) / 160) * Math.exp(gauss() * 0.45) * (1 + wind * 0.08) - press * 30);
      const miss = !near && prox > 38 && rng() < 0.75;
      // Holed from off the green? (chip-in, hole-out, or an ace)
      const inP = near ? clamp(0.035 + (A.SHT - 85) / 500, 0.01, 0.08) * (lie === 'bunker' ? 0.6 : 1) : par === 3 && fromLie === 'tee' ? 1 / 380 * (1 + (A.IRN - 85) / 40) : clamp(0.006 + (A.IRN - 85) / 4000, 0.002, 0.012);
      if (rng() < inP) { holed = true; shots.push({ k: par === 3 && fromLie === 'tee' ? 'ace' : near ? 'chipin' : 'holeout', from, to: 0, lie: 'hole' }); break; }
      if (miss) { left = 8 + rng() * 25; lie = rng() < 0.3 ? 'bunker' : 'rough'; shots.push({ k: 'approach', from, to: left, lie, missed: true, x: (rng() - 0.5) * 0.8 }); continue; }
      onGreen = true; feet = prox; lie = 'green';
      shots.push({ k: near ? (fromLie === 'bunker' ? 'bunker' : 'chip') : 'approach', from, to: Math.round(feet), lie: 'green', ft: Math.round(feet), x: (rng() - 0.5) * 0.3 });
      continue;
    }
    // Putting.
    strokes++;
    const d = feet;
    const make = clamp(d <= 1.5 ? 0.995 : 1 / (1 + Math.pow(d / 7.5, 1.9)), 0.02, 0.995);
    const p = clamp(make * (1 + (A.PUT - 85) / 140) + press * 0.6, 0.01, 0.995);
    if (rng() < p) { holed = true; shots.push({ k: 'putt', ft: Math.round(d), made: true }); break; }
    const next = Math.max(0.8, d * (0.08 + rng() * 0.14) + (d > 30 ? 2 : 0));
    shots.push({ k: 'putt', ft: Math.round(d), made: false, left: Math.round(next * 10) / 10 });
    feet = next;
  }
  return { strokes, shots };
}
const golfScoreName = (strokes, par) => { const d = strokes - par; return strokes === 1 ? 'Hole-in-one' : d <= -3 ? 'Albatross' : d === -2 ? 'Eagle' : d === -1 ? 'Birdie' : d === 0 ? 'Par' : d === 1 ? 'Bogey' : d === 2 ? 'Double bogey' : '+' + d; };
function golfMatch(rng, sides, cfg) {
  const holes = []; let up = 0; // positive: side 0 up
  const wind = cfg.wind;
  let n = 0; let result = null;
  const course = cfg.playoff ? GOLF_COURSE.slice(15).concat(GOLF_COURSE) : GOLF_COURSE;
  for (let h = 0; h < course.length; h++) {
    const hole = course[h]; n++;
    const left = 18 - h; const pressure = cfg.playoff || h >= 15 || Math.abs(up) >= left - 1;
    const res = sides.map((ps, s) => ps.map((p, j) => ({ p: p.name, ...golfHole(rng, p, hole, { wind, pressure, key: cfg.key + ':' + h + ':' + s + ':' + j }) })));
    const best = res.map((r) => r.reduce((b, x) => (x.strokes < b.strokes ? x : b), r[0]));
    const w = best[0].strokes < best[1].strokes ? 0 : best[1].strokes < best[0].strokes ? 1 : null;
    if (w === 0) up++; else if (w === 1) up--;
    const flag = (x) => (x.shots.some((s) => s.k === 'ace') ? 'ace' : x.shots.some((s) => s.k === 'chipin' || s.k === 'holeout') ? 'chipin' : x.strokes <= hole[0] - 2 ? 'eagle' : x.shots.some((s) => s.k === 'putt' && s.made && s.ft >= 25) ? 'bomb' : x.shots.filter((s) => s.k === 'putt').length >= 3 ? '3putt' : x.shots.some((s) => s.k === 'penalty') ? 'water' : null);
    const notes = best.map(flag);
    const left2 = 18 - (h + 1);
    holes.push({ n: h + 1, par: hole[0], len: hole[1], sc: res.map((r) => r.map((x) => x.strokes)), best: best.map((b) => ({ p: b.p, strokes: b.strokes, shots: b.shots })), w, up, notes });
    if (cfg.playoff) { if (w != null) { result = { w, how: 'playoff', hole: h + 1 }; break; } if (h >= 8) { result = { w: rng() < 0.5 ? 0 : 1, how: 'playoff', hole: h + 1 }; break; } continue; }
    if (Math.abs(up) > left2) { result = { w: up > 0 ? 0 : 1, how: Math.abs(up) + (left2 ? '&' + left2 : ' up'), hole: h + 1 }; break; }
  }
  if (!result) result = up === 0 ? { w: null, how: 'halved', hole: 18 } : { w: up > 0 ? 0 : 1, how: Math.abs(up) + ' up', hole: 18 };
  // Highlights: the closing hole, holes won with something special, and the last three holes of tight matches.
  holes.forEach((hl, i) => { hl.hl = cfg.playoff || i === holes.length - 1 || hl.notes.some((x) => x === 'ace' || x === 'chipin' || x === 'eagle' || x === 'bomb') || (hl.w != null && hl.n >= 14 && Math.abs(hl.up) <= 2) || (hl.notes.some((x) => x === 'water') && hl.w != null); });
  // Only the shown holes keep their shots (keeps the saved match small).
  holes.forEach((hl) => { if (!hl.hl) hl.best = hl.best.map((b) => ({ p: b.p, strokes: b.strokes })); });
  return { holes, result };
}
function simulateGolf(d, A, B, key) {
  const rng = seeded(d.seed, 'golf', key, A.id, B.id);
  const sq = [A, B].map((m) => m.team.map((x) => { const it = x && d.items[x.itemId]; return it ? { name: it.name, itemId: it.id, price: x.price || 0, ...golfRating(it) } : null; }));
  const wind = Math.round(rng() * 3 * 10) / 10; // 0 calm … 3 a proper links gale
  const matches = []; const pts = [0, 0];
  const add = (m) => { if (m.result.w == null) { pts[0] += 0.5; pts[1] += 0.5; } else pts[m.result.w] += 1; m.pts = [...pts]; matches.push(m); };
  // Fourballs.
  [[0, 1], [2, 3]].forEach((pair, k) => {
    const pa = pair.map((i) => sq[0][i]).filter(Boolean), pb = pair.map((i) => sq[1][i]).filter(Boolean);
    if (!pa.length && !pb.length) return;
    if (!pa.length || !pb.length) { add({ label: 'Fourball ' + (k + 1), format: 'fourball', a: pa.map(golfView), b: pb.map(golfView), holes: [], result: { w: pa.length ? 0 : 1, how: 'walkover', hole: 0 } }); return; }
    const m = golfMatch(rng, [pa, pb], { wind, key: key + 'fb' + k });
    add({ label: 'Fourball ' + (k + 1), format: 'fourball', a: pa.map(golfView), b: pb.map(golfView), ...m });
  });
  // Singles.
  for (let i = 0; i < 4; i++) {
    const a = sq[0][i], b = sq[1][i];
    if (!a && !b) continue;
    if (!a || !b) { add({ label: 'Singles ' + (i + 1), format: 'singles', a: a ? [golfView(a)] : [], b: b ? [golfView(b)] : [], holes: [], result: { w: a ? 0 : 1, how: 'walkover', hole: 0 } }); continue; }
    const m = golfMatch(rng, [[a], [b]], { wind, key: key + 's' + i });
    add({ label: 'Singles ' + (i + 1), format: 'singles', a: [golfView(a)], b: [golfView(b)], ...m });
  }
  let how = 'points';
  if (pts[0] === pts[1]) {
    const best = (s) => sq[s].filter(Boolean).sort((x, y) => y.price - x.price || y.ovr - x.ovr)[0];
    const a = best(0), b = best(1);
    if (a && b) { const m = golfMatch(rng, [[a], [b]], { wind, key: key + 'po', playoff: true }); m.holes.forEach((h) => { h.hl = true; }); const res = { label: 'Sudden-death playoff', format: 'playoff', a: [golfView(a)], b: [golfView(b)], ...m }; pts[m.result.w] += 1; res.pts = [...pts]; matches.push(res); how = 'playoff'; }
    else { pts[a ? 0 : 1] += 1; }
  }
  const winner = pts[0] > pts[1] ? 0 : 1;
  return { v: 'golf', kind: 'golf', wind, matches, score: pts, winner, how, sudden: how === 'playoff', et: false, pens: null, events: [] };
}
function golfView(p) { return { name: p.name, itemId: p.itemId, price: p.price, ovr: p.ovr }; }
const golfPts = (x) => (x % 1 ? (Math.floor(x) ? Math.floor(x) : '') + '½' : String(x));
const golfStatus = (up, names) => (up === 0 ? 'All square' : (up > 0 ? names[0] : names[1]) + ' ' + Math.abs(up) + ' UP');
function golfLine(m) {
  const nm = (side) => (side === 0 ? m.a : m.b).map((p) => p.name).join(' & ');
  const verb = (side, one, many) => ((side === 0 ? m.a : m.b).length > 1 ? many : one);
  if (m.result.how === 'walkover') return nm(m.result.w) + ' ' + verb(m.result.w, 'wins', 'win') + ' by walkover.';
  if (m.result.w == null) return nm(0) + ' and ' + nm(1) + ' halve the match.';
  if (m.result.how === 'playoff') return nm(m.result.w) + ' ' + verb(m.result.w, 'wins', 'win') + ' the playoff on the ' + m.result.hole + ordinalSuffix(m.result.hole) + ' extra hole.';
  return nm(m.result.w) + ' beat ' + nm(1 - m.result.w) + ' ' + m.result.how + '.';
}
