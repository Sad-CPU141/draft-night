/* ============================================================
   GRAND PRIX — the race for F1 Drivers.
   Built like the other sports engines: estimate the drivers →
   simulate the whole race lap by lap → keep a timeline → animate.
   · Both teams' drivers race on a full grid: the rest of the field is
     filled with the topic's undrafted drivers (they score nothing for
     anyone). Everyone drives the same car, so it's all driver.
   · Qualifying sets the grid. Every lap each car's lap time comes from
     race pace, tyres (soft/medium/hard wear out, then pit stops), fuel,
     traffic, rain (intermediates) and small mistakes. Cars that catch
     the one ahead try to overtake: racecraft against defending, and
     some tracks are much harder to pass on. Fights can end in contact,
     punctures, crashes and safety cars; engines sometimes fail.
   · Points 25-18-15-12-10-8-6-4-2-1 (+1 for the fastest lap in the
     top ten). The team with more points wins the race.
   · Driver numbers are Draft Night estimates (Now for current drivers,
     Prime for legends), never official ratings.
   ============================================================ */
const F1_ATTRS = ['PAC', 'RAC', 'OVT', 'DEF', 'TYR', 'WET', 'CON'];
const F1_ATTR_NAMES = { PAC: 'Qualifying pace', RAC: 'Race pace', OVT: 'Overtaking', DEF: 'Defending', TYR: 'Tyre care', WET: 'Wet weather', CON: 'Consistency' };
const F1_PROFILE_SRC = `
Max Verstappen|96|WET+5 OVT+3 DEF+3
Lewis Hamilton|94|WET+3 TYR+3
Charles Leclerc|91|PAC+4 TYR-3
Lando Norris|91|PAC+2
Oscar Piastri|90|CON+3
George Russell|89|PAC+3
Fernando Alonso|91|OVT+4 DEF+5 TYR+3
Carlos Sainz|87|CON+2
Lance Stroll|79|WET+4
Pierre Gasly|84|
Esteban Ocon|83|DEF+3
Kimi Antonelli|85|PAC+2 CON-4
Oliver Bearman|82|
Alex Albon|85|DEF+2
Yuki Tsunoda|83|PAC+2 CON-2
Nico Hülkenberg|84|PAC+2
Liam Lawson|81|OVT+2
Isack Hadjar|82|
Gabriel Bortoleto|81|
Franco Colapinto|79|CON-4
Sergio Pérez|85|TYR+4 PAC-3
Valtteri Bottas|85|PAC+3 OVT-4
Michael Schumacher|97|WET+4 CON+3
Ayrton Senna|98|PAC+5 WET+6
Alain Prost|95|TYR+6 CON+5 PAC-2
Niki Lauda|93|CON+4
Sebastian Vettel|93|PAC+2
Kimi Räikkönen|91|PAC+1
Jenson Button|89|WET+6 TYR+4
Nigel Mansell|91|OVT+5
Mika Häkkinen|93|PAC+3
Juan Manuel Fangio|97|CON+3
Jackie Stewart|94|WET+5
Nico Rosberg|89|PAC+3
Jacques Villeneuve|87|
Gilles Villeneuve|90|OVT+6 CON-8
Jim Clark|97|PAC+4
Graham Hill|89|CON+2
Damon Hill|87|
Emerson Fittipaldi|90|
Nelson Piquet|91|
Jochen Rindt|91|PAC+2
James Hunt|89|OVT+3 CON-4
Jack Brabham|91|TYR+2
Alberto Ascari|93|
Stirling Moss|94|OVT+2
Mario Andretti|89|
Keke Rosberg|87|PAC+2
Rubens Barrichello|86|WET+2
Mark Webber|86|
David Coulthard|86|
Felipe Massa|86|
Gerhard Berger|87|
Jody Scheckter|88|`;
const F1_PROFILE = {};
F1_PROFILE_SRC.trim().split('\n').forEach((line) => {
  const [name, ovr, tw] = line.split('|'); const tweak = {};
  (tw || '').split(' ').filter(Boolean).forEach((t) => { const m = t.match(/^([A-Z]+)([+-]\d+)$/); if (m) tweak[m[1]] = +m[2]; });
  F1_PROFILE[name.toLowerCase()] = { ovr: +ovr, tweak };
});
const f1EraOf = (item, topic) => (/LEGEND/.test(norm(item && item.pos)) ? 'prime' : /CURRENT|NOW/.test(norm(item && item.pos)) ? 'now' : eraOf(topic));
function f1Rating(item) {
  const prof = F1_PROFILE[String(item.name || '').toLowerCase()];
  const fixed = validRating(item.rating);
  const ovr = fixed ? clamp(Math.round(+item.rating), 1, 99) : prof ? prof.ovr : clamp(Math.round(74 + itemFame(item) * 22 + (unit('f1o', item.name) - 0.5) * 6), 65, 95);
  const tw = prof ? prof.tweak : {};
  const attrs = {};
  F1_ATTRS.forEach((a) => { attrs[a] = clamp(Math.round(ovr + (tw[a] || 0) + (unit('f1a', item.name, a) - 0.5) * 7), 40, 99); });
  return { ovr, attrs, estimated: !fixed };
}
// Simplified track outlines (not to scale) with how hard each is to pass on and how often it rains.
const F1_TRACKS = [
  { id: 'monaco', name: 'Monaco Grand Prix', laps: 26, hard: 0.8, rain: 0.14, pts: [[10, 40], [30, 46], [52, 48], [70, 44], [84, 36], [90, 26], [82, 18], [70, 22], [62, 14], [50, 10], [40, 18], [30, 16], [20, 22], [12, 30]] },
  { id: 'silverstone', name: 'British Grand Prix', laps: 28, hard: 0.35, rain: 0.32, pts: [[15, 40], [30, 50], [50, 52], [66, 46], [80, 50], [92, 40], [86, 28], [72, 24], [62, 12], [44, 10], [34, 20], [22, 18], [10, 26]] },
  { id: 'monza', name: 'Italian Grand Prix', laps: 30, hard: 0.2, rain: 0.1, pts: [[10, 42], [50, 46], [85, 44], [92, 36], [88, 22], [70, 12], [40, 10], [22, 14], [14, 22], [20, 30], [12, 34]] },
  { id: 'spa', name: 'Belgian Grand Prix', laps: 24, hard: 0.3, rain: 0.42, pts: [[10, 30], [18, 44], [34, 50], [50, 44], [62, 50], [80, 48], [92, 36], [84, 24], [66, 18], [50, 8], [34, 12], [22, 20]] },
  { id: 'suzuka', name: 'Japanese Grand Prix', laps: 26, hard: 0.5, rain: 0.26, pts: [[12, 44], [30, 50], [46, 40], [56, 24], [70, 14], [86, 16], [90, 28], [78, 40], [60, 44], [44, 26], [32, 14], [18, 18], [10, 30]] },
  { id: 'interlagos', name: 'São Paulo Grand Prix', laps: 30, hard: 0.3, rain: 0.36, pts: [[20, 12], [50, 8], [80, 14], [90, 28], [78, 36], [60, 30], [48, 40], [62, 50], [40, 52], [22, 44], [12, 30]] },
];
const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const TYRES = { S: { name: 'soft', off: -0.6, deg: 0.11, life: 9 }, M: { name: 'medium', off: 0, deg: 0.06, life: 15 }, H: { name: 'hard', off: 0.4, deg: 0.035, life: 22 }, I: { name: 'intermediate', off: 0, deg: 0.05, life: 30 } };
const f1Short = (n) => { const w = String(n || '').split(' '); return w[w.length - 1].slice(0, 3).toUpperCase(); };

function simulateGrandPrix(d, A, B, key) {
  const rng = seeded(d.seed, 'gp', key, A.id, B.id);
  const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += rng(); return (u - 2) / 0.58; };
  const track = F1_TRACKS[Math.floor(rng() * F1_TRACKS.length)];
  const laps = track.laps;
  // The grid: both teams' drivers plus undrafted drivers from the topic (up to 20 cars).
  const drafted = new Set();
  (d.managers || []).forEach((m) => m.team.forEach((x) => { if (x) drafted.add(x.itemId); }));
  [A, B].forEach((m) => m.team.forEach((x) => { if (x) drafted.add(x.itemId); }));
  const cars = [];
  [A, B].forEach((m, team) => m.team.forEach((x, k) => { const it = x && d.items[x.itemId]; if (it) cars.push({ name: it.name, itemId: it.id, team, price: x.price || 0, slot: d.rules.slots[k], ...f1Rating(it) }); }));
  if (!cars.some((c) => c.team === 0) || !cars.some((c) => c.team === 1)) {
    const w = cars.some((c) => c.team === 0) ? 0 : 1;
    return { v: 'gp', kind: 'f1', forfeit: true, track: track.id, laps: 0, cars: [], events: [], result: [], score: w === 0 ? [1, 0] : [0, 1], winner: w, weather: [], et: false, pens: null, sudden: false };
  }
  // The field is the undrafted drivers, weakest first, so the drafted drivers are the ones fighting for points.
  const field = Object.values(d.items).filter((it) => !drafted.has(it.id)).sort((x, y) => f1Rating(x).ovr - f1Rating(y).ovr || unit('field', d.seed, key, x.name) - unit('field', d.seed, key, y.name)).slice(0, Math.max(0, 20 - cars.length));
  field.forEach((it) => cars.push({ name: it.name, itemId: it.id, team: null, price: 0, ...f1Rating(it) }));
  cars.forEach((c, i) => { c.i = i; c.form = gauss() * 0.12; });
  // Weather: maybe a shower during the race.
  const weather = Array(laps + 1).fill(0);
  let rainFrom = null, rainTo = null;
  if (rng() < track.rain) { rainFrom = 3 + Math.floor(rng() * (laps - 8)); rainTo = Math.min(laps, rainFrom + 4 + Math.floor(rng() * 10)); for (let L = rainFrom; L <= rainTo; L++) weather[L] = 1; }
  // Qualifying.
  const q = cars.map((c) => ({ c, t: 80 - (c.attrs.PAC - 80) * 0.05 + gauss() * 0.12 * (1.4 - c.attrs.CON / 100) + c.form * 0.5 }));
  q.sort((x, y) => x.t - y.t);
  const grid = q.map((x) => x.c.i);
  const pole = q[0];
  const st = cars.map((c) => ({ stints: [], cum: [0], tyre: null, age: 0, stops: 0, dnf: null, damage: 0, best: Infinity, bestLap: 0, passes: 0, pits: [], lapT: [] }));
  grid.forEach((ci, gi) => { st[ci].cum[0] = gi * 0.25; st[ci].tyre = gi < 10 ? (rng() < 0.6 ? 'S' : 'M') : rng() < 0.5 ? 'M' : 'H'; st[ci].stints.push([0, st[ci].tyre]); });
  const events = [];
  const push = (e) => { events.push(e); return e; };
  const nm = (i) => cars[i].name;
  const isTeam = (i) => cars[i].team != null;
  let order = [...grid];
  let sc = 0; let restart = false; let scCount = 0;
  const posOf = (i) => order.indexOf(i) + 1;
  push({ lap: 0, kind: 'grid', car: grid[0], text: nm(grid[0]) + ' takes pole position for the ' + track.name + '.', hl: false });
  for (let L = 1; L <= laps; L++) {
    const wet = weather[L];
    const lapsLeft = laps - L;
    const running = order.filter((i) => st[i].dnf == null);
    const lt = {}; const pitting = {};
    running.forEach((i) => {
      const c = cars[i], s = st[i], A2 = c.attrs;
      // Pit stops: worn tyres, or the weather changed.
      let pit = null;
      const wrongTyres = (wet && s.tyre !== 'I') || (!wet && s.tyre === 'I' && L > (rainTo || 0) + 1);
      if (wrongTyres && rng() < (wet ? 0.55 + (A2.WET - 80) / 100 : 0.6)) pit = wet ? 'I' : lapsLeft > 12 ? 'M' : 'S';
      else if (!wet && s.tyre !== 'I' && lapsLeft > 2 && s.age >= TYRES[s.tyre].life * (1.4 - A2.TYR / 100 * 0.5) - rng() * 2) pit = lapsLeft > TYRES.H.life * 0.8 ? 'H' : lapsLeft > TYRES.M.life * 0.7 ? 'M' : 'S';
      else if (sc && !wet && s.age > 5 && lapsLeft > 6 && rng() < 0.55) pit = lapsLeft > 14 ? 'H' : 'M';
      if (s.damage > 0.5 && !pit) pit = s.tyre === 'I' ? 'I' : 'M';
      const T = TYRES[s.tyre];
      let t = 90 + T.off + T.deg * s.age * (1.4 - A2.TYR / 100) + Math.max(0, s.age - T.life) * 0.35 - L * 0.04 - (A2.RAC - 80) * 0.05 + c.form + gauss() * 0.22 * (1.35 - A2.CON / 100);
      if (wet) t += (s.tyre === 'I' ? 3.5 : 8.5) - (A2.WET - 80) * 0.07;
      else if (s.tyre === 'I') t += 2.5 + s.age * 0.1;
      if (L === 1) t += 2 + gauss() * 0.7 * (1.3 - A2.CON / 100);
      t += s.damage;
      if (pit) {
        const stop = rng() < 0.06 ? 5 + rng() * 6 : 2.1 + rng() * 1.2;
        t += (sc ? 11 : 20) + stop; pitting[i] = { to: pit, stop: Math.round(stop * 10) / 10, from: s.tyre };
      }
      lt[i] = t;
    });
    // Mistakes and failures.
    running.forEach((i) => {
      const c = cars[i], s = st[i];
      if (st[i].dnf != null) return;
      const spinP = 0.0035 * (1.7 - c.attrs.CON / 100) * (wet && s.tyre !== 'I' ? 6 : wet ? 2.2 : 1) * (L === 1 ? 3 : 1);
      if (rng() < spinP) {
        if (rng() < 0.22) { s.dnf = L; push({ lap: L, kind: 'crash', car: i, text: nm(i) + ' crashes out' + (wet ? ' in the rain' : '') + '!', hl: true }); if (!sc) { sc = 2 + Math.floor(rng() * 2); scCount++; push({ lap: L, kind: 'sc', text: 'Safety car! The field bunches up.', hl: true }); } }
        else { lt[i] += 6 + rng() * 6; push({ lap: L, kind: 'spin', car: i, text: nm(i) + ' spins' + (wet ? ' on the wet track' : '') + ' but keeps going.', hl: isTeam(i) }); }
      } else if (rng() < 0.0016) { s.dnf = L; push({ lap: L, kind: 'dnf', car: i, text: 'Smoke! ' + nm(i) + '’s engine has gone — out of the race.', hl: isTeam(i) }); }
    });
    // Provisional crossing times, then fights for position, front to back.
    const runners = order.filter((i) => st[i].dnf == null);
    const nc = {}; runners.forEach((i) => { nc[i] = st[i].cum[L - 1] + lt[i]; });
    if (sc) {
      // Behind the safety car: no overtaking, gaps close up.
      const lead = runners[0]; const base = st[lead].cum[L - 1] + 118;
      runners.forEach((i, k) => { nc[i] = Math.max(base + k * 0.8, pitting[i] ? st[i].cum[L - 1] + 118 + 11 : 0); });
    } else {
      for (let k = 1; k < runners.length; k++) {
        const b = runners[k], f = runners[k - 1];
        if (pitting[b] || pitting[f]) continue;
        const g0 = st[b].cum[L - 1] - st[f].cum[L - 1];
        if (nc[b] >= nc[f] + 0.25 || g0 > 2.2) { if (nc[b] < nc[f] + 0.25) nc[b] = nc[f] + 0.25 + rng() * 0.3; continue; }
        const B2 = cars[b].attrs, F2 = cars[f].attrs;
        const p = clamp(0.3 + (B2.OVT - F2.DEF) / 110 + (nc[f] - nc[b]) * 0.2 - track.hard * 0.62 + (g0 < 1 ? 0.12 : 0) + (restart ? 0.12 : 0) + (wet ? 0.08 : 0) + (L === 1 ? 0.1 : 0), 0.03, 0.85);
        if (rng() < p) {
          nc[b] = Math.min(nc[b], nc[f] - 0.15 - rng() * 0.3);
          [runners[k - 1], runners[k]] = [runners[k], runners[k - 1]];
          st[b].passes++;
          const pos = k;
          push({ lap: L, kind: 'pass', car: b, other: f, pos, text: nm(b) + ' passes ' + nm(f) + ' for P' + pos + (wet ? ' in the rain!' : track.hard > 0.6 ? ' — on this track!' : '!'), hl: isTeam(b) || isTeam(f) ? true : pos <= 3 });
        } else {
          nc[b] = nc[f] + 0.3 + rng() * 0.4;
          const touch = 0.012 * (2.1 - (B2.CON + F2.CON) / 100) * (1 + track.hard) * (L === 1 ? 2.5 : 1);
          if (rng() < touch) {
            const out = rng() < 0.55 ? b : f; const other = out === b ? f : b;
            if (rng() < 0.45) { st[out].dnf = L; push({ lap: L, kind: 'crash', car: out, other, text: nm(b) + ' and ' + nm(f) + ' touch! ' + nm(out) + ' is out!', hl: true }); if (!sc) { sc = 2 + Math.floor(rng() * 2); scCount++; push({ lap: L, kind: 'sc', text: 'Safety car!', hl: true }); } }
            else { st[out].damage = 1.4; push({ lap: L, kind: 'contact', car: out, other, text: nm(b) + ' and ' + nm(f) + ' make contact — ' + nm(out) + ' has a damaged wing.', hl: isTeam(out) || isTeam(other) }); }
          }
        }
      }
    }
    // Write the lap.
    runners.forEach((i) => {
      const s = st[i];
      if (s.dnf != null) return;
      s.cum[L] = Math.round(nc[i] * 100) / 100;
      const lapTime = s.cum[L] - s.cum[L - 1];
      if (!pitting[i] && !sc && L > 1 && lapTime < s.best) { s.best = lapTime; s.bestLap = L; }
      if (pitting[i]) {
        const p = pitting[i]; s.stops++; s.pits.push(L); s.stints.push([L, p.to]); s.tyre = p.to; s.age = 0; s.damage = 0;
        push({ lap: L, kind: 'pit', car: i, stop: p.stop, to: p.to, text: nm(i) + ' pits for ' + TYRES[p.to].name + 's (' + p.stop.toFixed(1) + 's stop' + (p.stop > 4.5 ? ' — slow one!' : '') + ').', hl: isTeam(i) && (p.stop > 4.5 || rng() < 0.5) });
      } else s.age++;
    });
    if (rainFrom === L) push({ lap: L, kind: 'rain', text: 'Rain is falling! Who gambles on intermediates?', hl: true });
    if (rainTo === L && L < laps) push({ lap: L, kind: 'dry', text: 'The rain stops and a dry line appears.', hl: false });
    if (sc) { sc--; if (!sc) { restart = true; push({ lap: L, kind: 'scend', text: 'Safety car in this lap — restart!', hl: true }); } else restart = false; } else restart = false;
    // Order for the next lap: by time over the line (retired cars drop out).
    order = order.filter((i) => st[i].dnf == null).sort((x, y) => st[x].cum[L] - st[y].cum[L]).concat(order.filter((i) => st[i].dnf != null));
    if (L === 1) {
      const moves = cars.map((c, i) => ({ i, d: grid.indexOf(i) + 1 - posOf(i) })).filter((m) => isTeam(m.i) && st[m.i].dnf == null && Math.abs(m.d) >= 2).sort((x, y) => y.d - x.d);
      push({ lap: 1, kind: 'start', text: 'Lights out and away we go! ' + nm(order[0]) + ' leads after lap 1' + (moves.length ? '. ' + moves.slice(0, 2).map((m) => nm(m.i) + (m.d > 0 ? ' gains ' + m.d : ' loses ' + -m.d)).join(', ') + ' places' : '') + '.', hl: true });
    }
  }
  // Results.
  const finished = order.filter((i) => st[i].dnf == null);
  const out = order.filter((i) => st[i].dnf != null).sort((x, y) => st[y].dnf - st[x].dnf);
  const fl = finished.reduce((b, i) => (st[i].best < (b == null ? Infinity : st[b].best) ? i : b), null);
  const result = [...finished, ...out].map((i, k) => {
    const pts = st[i].dnf == null && k < 10 ? F1_POINTS[k] + (i === fl ? 1 : 0) : 0;
    return { car: i, pos: st[i].dnf == null ? k + 1 : null, pts, grid: grid.indexOf(i) + 1, dnf: st[i].dnf, stops: st[i].stops, passes: st[i].passes, time: st[i].dnf == null ? st[i].cum[laps] : null };
  });
  const winT = st[finished[0]].cum[laps];
  result.forEach((r) => { if (r.time != null) r.gap = Math.round((r.time - winT) * 10) / 10; });
  if (fl != null) push({ lap: st[fl].bestLap, kind: 'fastest', car: fl, text: nm(fl) + ' sets the fastest lap: ' + f1LapTime(st[fl].best) + (result.find((r) => r.car === fl).pos <= 10 ? ' (+1 point)' : '') + '.', hl: false });
  push({ lap: laps, kind: 'flag', car: finished[0], text: 'Chequered flag! ' + nm(finished[0]) + ' wins the ' + track.name + '!', hl: true });
  const ko = (e) => (e.kind === 'start' ? -1 : e.kind === 'flag' ? 2 : e.kind === 'fastest' ? 1 : 0);
  events.sort((x, y) => x.lap - y.lap || ko(x) - ko(y));
  const score = [0, 0];
  result.forEach((r) => { const t = cars[r.car].team; if (t != null) score[t] += r.pts; });
  let winner, how = 'points';
  if (score[0] !== score[1]) winner = score[0] > score[1] ? 0 : 1;
  else { const best = result.find((r) => cars[r.car].team != null && r.pos != null); winner = best ? cars[best.car].team : rng() < 0.5 ? 0 : 1; how = 'best'; }
  // Close battles near the end make the last laps worth slowing down for.
  return {
    v: 'gp', kind: 'f1', track: track.id, laps, weather, rain: rainFrom != null ? [rainFrom, rainTo] : null, sc: scCount,
    cars: cars.map((c) => ({ name: c.name, itemId: c.itemId, team: c.team, ovr: c.ovr, price: c.price })),
    grid, cum: st.map((s) => s.cum), pits: st.map((s) => s.pits), stints: st.map((s) => s.stints), dnf: st.map((s) => s.dnf),
    events, result, fastest: fl, pole: grid[0], score, winner, how, et: false, pens: null, sudden: false,
  };
}
const f1LapTime = (s) => Math.floor(s / 60) + ':' + (s % 60).toFixed(3).padStart(6, '0');
