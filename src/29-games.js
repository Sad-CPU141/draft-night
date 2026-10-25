/* ============================================================
   THE DRAFT NIGHT GAMES — the multi-event meet for Olympic Athletes
   (like the old TV show "Superstars": champions from every sport
   take on each other's events).
   · All ten athletes (five a team) compete in five events: the 100m,
     the 50m freestyle swim, the 1500m, the long jump (three jumps,
     best counts, fouls happen) and an obstacle course (walls, hurdles,
     a rope climb; falls cost time). Sprinters win sprints, swimmers
     swim, distance runners run away with the 1500m, gymnasts fly round
     the obstacles — but everyone has to do everything.
   · Every event: points for places (12, 10, 8, 7, 6, 5, 4, 3, 2, 1)
     and medals for the top three. Most points wins; level goes to a
     4×100m relay.
   · Athlete abilities (speed, endurance, swimming, jumping, agility,
     strength) are Draft Night estimates from each athlete's sport and
     achievements, never official. Times and distances are simulated.
   ============================================================ */
const GAMES_ATTRS = ['SPD', 'END', 'SWM', 'JMP', 'AGI', 'STR'];
const GAMES_ATTR_NAMES = { SPD: 'Speed', END: 'Endurance', SWM: 'Swimming', JMP: 'Jumping', AGI: 'Agility', STR: 'Strength' };
// Sport shapes: how good each kind of athlete is at each ability (before their own level).
const GAMES_SPORTS = [
  [/sprint|100m|200m|400m|double-double|Bolt|Griffith|Fraser|Lyles|Rudolph|Freeman|Felix|Thompson-Herah|Michael Johnson|Owens/i, 'Sprinter', { SPD: 99, END: 62, SWM: 40, JMP: 84, AGI: 74, STR: 72 }],
  [/hurdle/i, 'Hurdler', { SPD: 93, END: 70, SWM: 40, JMP: 86, AGI: 82, STR: 70 }],
  [/long jump|triple jump|Beamon/i, 'Jumper', { SPD: 92, END: 58, SWM: 40, JMP: 99, AGI: 80, STR: 72 }],
  [/pole vault/i, 'Pole vaulter', { SPD: 88, END: 58, SWM: 40, JMP: 96, AGI: 88, STR: 76 }],
  [/heptathlon|decathlon/i, 'Multi-eventer', { SPD: 88, END: 76, SWM: 50, JMP: 90, AGI: 84, STR: 80 }],
  [/swim|freestyle|breaststroke|Phelps|Ledecky|Spitz|Thorpe|Marchand|Dressel|Lochte|Peaty|Titmus|McIntosh|Fraser/i, 'Swimmer', { SPD: 66, END: 88, SWM: 99, JMP: 64, AGI: 70, STR: 76 }],
  [/marathon|distance|10,000|5000|1500|middle distance|Nurmi|Zátopek|Coe|Ingebrigtsen|Kipyegon|Hassan|Farah|Bekele|Gebrselassie|El Guerrouj|Holmes/i, 'Distance runner', { SPD: 74, END: 99, SWM: 42, JMP: 60, AGI: 70, STR: 55 }],
  [/diving/i, 'Diver', { SPD: 62, END: 64, SWM: 82, JMP: 80, AGI: 96, STR: 70 }],
  [/gymnast|perfect 10|Latynina|Uchimura|Korbut|Retton|Scherbo/i, 'Gymnast', { SPD: 72, END: 66, SWM: 45, JMP: 88, AGI: 99, STR: 80 }],
  [/cycling|Hoy|Kenny|Wiggins/i, 'Cyclist', { SPD: 70, END: 94, SWM: 45, JMP: 68, AGI: 62, STR: 86 }],
  [/rowing|canoe|Redgrave|Pinsent|Fischer/i, 'Rower', { SPD: 62, END: 94, SWM: 60, JMP: 60, AGI: 58, STR: 97 }],
  [/judo|wrestling|boxing|Riner|Yoshida|Adams/i, 'Fighter', { SPD: 70, END: 84, SWM: 45, JMP: 68, AGI: 82, STR: 95 }],
  [/javelin/i, 'Thrower', { SPD: 80, END: 62, SWM: 42, JMP: 78, AGI: 72, STR: 94 }],
  [/ski|snowboard|biathlon|White|Vonn|Shiffrin|Kim|Bjørgen|Dæhlie|Bjørndalen/i, 'Winter athlete', { SPD: 70, END: 88, SWM: 42, JMP: 76, AGI: 88, STR: 80 }],
  [/skating|short track|Heiden|Ohno|Hanyu|Yuna|Witt/i, 'Skater', { SPD: 72, END: 84, SWM: 42, JMP: 82, AGI: 92, STR: 72 }],
  [/sailing|Ainslie/i, 'Sailor', { SPD: 60, END: 82, SWM: 72, JMP: 58, AGI: 72, STR: 82 }],
];
const GAMES_PROFILE = { 'usain bolt': 99, 'michael phelps': 99, 'simone biles': 99, 'carl lewis': 97, 'jesse owens': 96, 'nadia comăneci': 95, 'katie ledecky': 97, 'eliud kipchoge': 97, 'mo farah': 93, 'allyson felix': 94, 'florence griffith joyner': 96, 'armand duplantis': 97, 'sydney mclaughlin-levrone': 96, 'faith kipyegon': 96, 'shelly-ann fraser-pryce': 95, 'paavo nurmi': 95, 'mark spitz': 96, 'ian thorpe': 95, 'léon marchand': 95, 'caeleb dressel': 94, 'jessica ennis-hill': 93, 'chris hoy': 93, 'kelly holmes': 91, 'noah lyles': 94, 'sifan hassan': 95, 'rebeca andrade': 93, 'shaun white': 93, 'marit bjørgen': 95, 'steve redgrave': 95, 'greg louganis': 95, 'daley thompson': 94 };
function gamesRating(item) {
  const n = String(item.name || ''); const txt = (item.desc || '') + ' ' + n;
  const sp = GAMES_SPORTS.find(([re]) => re.test(txt)) || [null, 'All-rounder', { SPD: 80, END: 80, SWM: 60, JMP: 78, AGI: 80, STR: 80 }];
  const fixed = validRating(item.rating);
  const ovr = fixed ? clamp(Math.round(+item.rating), 1, 99) : GAMES_PROFILE[n.toLowerCase()] || clamp(Math.round(82 + itemFame(item) * 14 + (unit('gmo', n) - 0.5) * 6), 78, 96);
  const attrs = {};
  GAMES_ATTRS.forEach((a) => { attrs[a] = clamp(Math.round(sp[2][a] * (0.82 + ovr / 550) + (unit('gma', n, a) - 0.5) * 6), 30, 99); });
  return { ovr, attrs, sport: sp[1], estimated: !fixed };
}
const GAMES_PTS = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
const GAMES_EVENTS = [
  { id: '100m', name: '100m sprint', kind: 'race', unit: 's', dist: 100 },
  { id: 'swim', name: '50m freestyle', kind: 'swim', unit: 's', dist: 50 },
  { id: '1500m', name: '1500m', kind: 'race', unit: 'time', dist: 1500 },
  { id: 'lj', name: 'Long jump', kind: 'jump', unit: 'm' },
  { id: 'obst', name: 'Obstacle course', kind: 'obstacle', unit: 's' },
];
const gamesTime = (s, unitK) => (unitK === 'time' || s >= 60 ? Math.floor(s / 60) + ':' + (s % 60).toFixed(2).padStart(5, '0') : s.toFixed(2));

function simulateGames(d, A, B, key) {
  const rng = seeded(d.seed, 'games', key, A.id, B.id);
  const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += rng(); return (u - 2) / 0.58; };
  const ath = [];
  [A, B].forEach((m, team) => m.team.forEach((x) => { const it = x && d.items[x.itemId]; if (it) ath.push({ name: it.name, itemId: it.id, team, price: x.price || 0, ...gamesRating(it) }); }));
  if (!ath.some((a) => a.team === 0) || !ath.some((a) => a.team === 1)) { const w = ath.some((a) => a.team === 0) ? 0 : 1; return { v: 'games', kind: 'oly', forfeit: true, athletes: [], events: [], score: w === 0 ? [1, 0] : [0, 1], winner: w, medals: [[0, 0, 0], [0, 0, 0]], et: false, pens: null, sudden: false }; }
  // Good days and bad days.
  const form = ath.map(() => gauss());
  const events = []; const score = [0, 0]; const medals = [[0, 0, 0], [0, 0, 0]];
  const rank = (rows, lowerBetter) => rows.slice().sort((a, b) => (lowerBetter ? a.perf - b.perf : b.perf - a.perf));
  GAMES_EVENTS.forEach((E) => {
    let rows;
    if (E.id === '100m') rows = ath.map((a, i) => { const react = 0.13 + rng() * 0.08; const t2 = 9.66 + (99 - a.attrs.SPD) * 0.055 + (99 - a.attrs.JMP) * 0.006 + Math.abs(gauss()) * 0.08 + form[i] * 0.15 + react - 0.15; return { i, perf: Math.round(t2 * 100) / 100, react: Math.round(react * 1000) / 1000 }; });
    else if (E.id === 'swim') rows = ath.map((a, i) => { const t2 = 21.0 + (99 - a.attrs.SWM) * 0.17 + (99 - a.attrs.STR) * 0.015 + gauss() * 0.35 + form[i] * 0.6; return { i, perf: Math.round(t2 * 100) / 100 }; });
    else if (E.id === '1500m') rows = ath.map((a, i) => { const t2 = 207 + (99 - a.attrs.END) * 1.6 + (99 - a.attrs.SPD) * 0.25 + gauss() * 4 + form[i] * 4; const kick = clamp((a.attrs.SPD - 70) / 30, 0, 1); return { i, perf: Math.round(t2 * 100) / 100, kick: Math.round(kick * 100) / 100 }; });
    else if (E.id === 'lj') rows = ath.map((a, i) => { const jumps = [0, 1, 2].map(() => { if (rng() < 0.15 + (90 - a.attrs.AGI) / 400) return null; return Math.round((8.45 - (99 - a.attrs.JMP) * 0.045 - (99 - a.attrs.SPD) * 0.012 + gauss() * 0.2 - form[i] * 0.15) * 100) / 100; }); const best = Math.max(0, ...jumps.filter((x) => x != null)); return { i, perf: best || 0, jumps }; });
    else rows = ath.map((a, i) => { const falls = rng() < clamp(0.18 - (a.attrs.AGI - 80) / 150, 0.02, 0.3) ? 1 : 0; const t2 = 38 - (a.attrs.AGI - 80) * 0.18 - (a.attrs.SPD - 80) * 0.06 - (a.attrs.STR - 80) * 0.06 + falls * 3.2 + gauss() * 1.0 + form[i] * 1.2; return { i, perf: Math.round(t2 * 100) / 100, falls }; });
    const lower = E.kind !== 'jump';
    const order = rank(rows, lower);
    order.forEach((r, k) => { r.place = k + 1; r.pts = GAMES_PTS[k] || 0; const tm = ath[r.i].team; score[tm] += r.pts; if (k < 3) medals[tm][k]++; });
    const margin = Math.abs(order[0].perf - order[1].perf);
    const tm0 = ath[order[0].i].team;
    events.push({ id: E.id, name: E.name, kind: E.kind, unit: E.unit, dist: E.dist, rows: order, winner: order[0].i, photo: lower && margin < (E.id === '1500m' ? 0.15 : 0.03), score: [...score], text: ath[order[0].i].name + ' wins the ' + E.name + ' (' + (E.kind === 'jump' ? order[0].perf.toFixed(2) + ' m' : gamesTime(order[0].perf, E.unit)) + ')' + (lower && margin < 0.03 ? ' in a photo finish!' : '!') + ' ' + ath[order[1].i].name + ' second, ' + ath[order[2].i].name + ' third.', team: tm0 });
  });
  let how = 'points';
  if (score[0] === score[1]) {
    // 4×100m relay: each team's four fastest.
    const legs = [0, 1].map((tm) => ath.map((a, i) => ({ a, i })).filter((x) => x.a.team === tm).sort((x, y) => y.a.attrs.SPD - x.a.attrs.SPD).slice(0, 4));
    const rows = legs.map((L, tm) => { let tot = 0; const splits = L.map((x) => { const s2 = 9.0 + (99 - x.a.attrs.SPD) * 0.05 + gauss() * 0.08 + (rng() < 0.04 ? 0.6 : 0); tot += s2; return Math.round(s2 * 100) / 100; }); return { tm, legs: L.map((x) => x.i), splits, perf: Math.round(tot * 100) / 100 }; });
    const w = rows[0].perf <= rows[1].perf ? 0 : 1; score[w] += 1;
    events.push({ id: 'relay', name: '4×100m relay decider', kind: 'relay', unit: 's', dist: 400, relay: rows, winner: w, score: [...score], text: (w === 0 ? A : B).name + ' win the relay decider in ' + rows[w].perf.toFixed(2) + '!', team: w });
    how = 'relay';
  }
  const winner = score[0] > score[1] ? 0 : 1;
  return { v: 'games', kind: 'oly', athletes: ath.map((a) => ({ name: a.name, itemId: a.itemId, team: a.team, price: a.price, sport: a.sport, ovr: a.ovr })), events, score, medals, winner, how, et: false, pens: null, sudden: how === 'relay' };
}
