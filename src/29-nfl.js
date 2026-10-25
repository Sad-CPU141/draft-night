/* ============================================================
   AMERICAN FOOTBALL — the game for NFL Stars.
   Built like the other sports engines: estimate the players →
   simulate the whole game play by play → keep a timeline → animate.
   · Each team's drafted QB, RB, two WRs, TE and defensive star are
     the stars; the rest of the 11 on each side are an average
     supporting cast (same for both teams).
   · Four 15-minute quarters with a real game clock. Every play: run
     or pass (by down, distance, score and time left), sacks, scrambles,
     completions (short, medium, deep), yards after the catch, big
     breakaway runs, interceptions, fumbles, field goals, punts,
     fourth-down gambles, the two-minute drill, extra points and
     two-point tries. Level after 60 minutes: overtime until somebody
     scores (and a kicking duel if it's still level).
   · Player numbers are Draft Night estimates (Now for current players,
     Prime for legends), never official ratings.
   ============================================================ */
const NFL_ATTRS = { QB: ['ACC', 'ARM', 'DEC', 'MOB'], RB: ['SPD', 'POW', 'VIS', 'HND'], WR: ['RTE', 'HND', 'SPD', 'YAC'], TE: ['RTE', 'HND', 'BLK', 'YAC'], DEF: ['RSH', 'COV', 'TKL', 'SPD'] };
const NFL_ATTR_NAMES = { ACC: 'Accuracy', ARM: 'Arm strength', DEC: 'Decisions', MOB: 'Mobility', SPD: 'Speed', POW: 'Power', VIS: 'Vision', HND: 'Hands', RTE: 'Route running', YAC: 'After the catch', BLK: 'Blocking', RSH: 'Pass rush', COV: 'Coverage', TKL: 'Tackling' };
const NFL_PROFILE_SRC = `
Patrick Mahomes|96|ARM+4 MOB+3 DEC+3
Josh Allen|94|ARM+6 MOB+5 DEC-3
Lamar Jackson|94|MOB+10 ACC-3
Joe Burrow|92|ACC+5
Jalen Hurts|89|MOB+6 ACC-3
Tom Brady|97|DEC+7 ACC+3 MOB-10
Peyton Manning|96|DEC+7 ACC+3 MOB-10
Saquon Barkley|93|SPD+4
Derrick Henry|91|POW+8 HND-8
Christian McCaffrey|93|HND+6 VIS+3
Bijan Robinson|91|VIS+3
Jahmyr Gibbs|90|SPD+7
Justin Jefferson|95|RTE+4
Ja'Marr Chase|95|YAC+4
CeeDee Lamb|92|
Tyreek Hill|91|SPD+8
Jerry Rice|98|RTE+5 HND+3
Randy Moss|96|SPD+5
Puka Nacua|89|HND+4
Amon-Ra St. Brown|91|HND+5 RTE+3
Travis Kelce|93|RTE+5
George Kittle|91|BLK+6 YAC+4
Rob Gronkowski|94|BLK+6
Brock Bowers|89|YAC+3
Aaron Donald|96|RSH+5
T.J. Watt|94|RSH+5
Myles Garrett|95|RSH+6
Micah Parsons|93|RSH+4 SPD+3
Lawrence Taylor|97|RSH+5
Ray Lewis|95|TKL+6 COV+2 RSH-8
C.J. Stroud|88|ACC+3
Justin Herbert|88|ARM+6
Jayden Daniels|88|MOB+7
Dak Prescott|87|
Jared Goff|87|ACC+3 MOB-6
Brock Purdy|86|DEC+3
Baker Mayfield|85|
Kyler Murray|85|MOB+8
Matthew Stafford|87|ARM+4
Aaron Rodgers|95|ACC+4 DEC+4
Jordan Love|85|
Trevor Lawrence|84|
Caleb Williams|82|
Joe Montana|97|DEC+7 ACC+4
Dan Marino|95|ARM+5
John Elway|94|ARM+5 MOB+3
Brett Favre|93|ARM+6 DEC-4
Drew Brees|95|ACC+7
Josh Jacobs|87|
Jonathan Taylor|88|SPD+3
Kyren Williams|85|
De'Von Achane|86|SPD+9
James Cook|85|
Alvin Kamara|87|HND+6
Breece Hall|86|
Ashton Jeanty|84|
Emmitt Smith|94|VIS+5
Barry Sanders|98|SPD+5 VIS+6
Walter Payton|97|POW+3
LaDainian Tomlinson|96|
Adrian Peterson|95|POW+5
Marshall Faulk|95|HND+6
Jim Brown|97|POW+6
Davante Adams|90|RTE+5
A.J. Brown|90|YAC+3
Stefon Diggs|87|
Mike Evans|89|HND+2
DK Metcalf|86|SPD+3
Garrett Wilson|86|
Nico Collins|86|
Drake London|85|
Malik Nabers|86|
Brian Thomas Jr.|86|SPD+3
Terry McLaurin|86|
DeVonta Smith|85|
Tee Higgins|85|
Jaxon Smith-Njigba|88|
Ladd McConkey|85|RTE+3
Marvin Harrison Jr.|84|
Cooper Kupp|90|RTE+4
Deebo Samuel|86|YAC+6
Jaylen Waddle|86|SPD+6
Calvin Johnson|97|HND+3
Larry Fitzgerald|95|HND+6
Terrell Owens|95|YAC+4
Julio Jones|94|
Odell Beckham Jr.|89|HND+4
Rashee Rice|84|
George Pickens|85|HND+3
Zay Flowers|84|SPD+3
Mark Andrews|87|
Sam LaPorta|86|
Trey McBride|88|
T.J. Hockenson|85|
Dallas Goedert|84|
Kyle Pitts|82|
Evan Engram|82|
David Njoku|82|
Jake Ferguson|82|
Dalton Kincaid|81|
Tucker Kraft|82|
Tony Gonzalez|95|HND+4
Shannon Sharpe|92|
Antonio Gates|92|
Jason Witten|90|BLK+3
Nick Bosa|92|RSH+4
Maxx Crosby|91|RSH+3
Fred Warner|91|TKL+4 COV+3 RSH-10
Sauce Gardner|89|COV+8 RSH-20
Patrick Surtain II|91|COV+8 RSH-20
Chris Jones|91|RSH+3
Roquan Smith|89|TKL+4 RSH-10
Derwin James|88|COV+3 RSH-12
Kyle Hamilton|89|COV+4 RSH-14
Aidan Hutchinson|90|RSH+3
Reggie White|97|RSH+5`;
const NFL_PROFILE = {};
NFL_PROFILE_SRC.trim().split('\n').forEach((line) => {
  const [name, ovr, tw] = line.split('|'); const tweak = {};
  (tw || '').split(' ').filter(Boolean).forEach((t) => { const m = t.match(/^([A-Z]+)([+-]\d+)$/); if (m) tweak[m[1]] = +m[2]; });
  NFL_PROFILE[name.toLowerCase()] = { ovr: +ovr, tweak };
});
const nflPos = (item, slot) => { const p = norm((item && item.pos) || slot || ''); return NFL_ATTRS[p] ? p : NFL_ATTRS[norm(slot)] ? norm(slot) : 'WR'; };
// Defensive stars play one of three jobs.
const nflDefRole = (item, r) => (r.attrs.COV >= r.attrs.RSH + 8 ? (/safety/i.test((item && item.desc) || '') ? 'S' : 'CB') : r.attrs.TKL >= r.attrs.RSH + 4 ? 'LB' : 'DL');
function nflRating(item, slot) {
  const prof = NFL_PROFILE[String(item.name || '').toLowerCase()];
  const fixed = validRating(item.rating);
  const ovr = fixed ? clamp(Math.round(+item.rating), 1, 99) : prof ? prof.ovr : clamp(Math.round(72 + itemFame(item) * 22 + (unit('nflo', item.name) - 0.5) * 6), 65, 95);
  const pos = nflPos(item, slot); const tw = prof ? prof.tweak : {};
  const attrs = {};
  NFL_ATTRS[pos].forEach((a) => { attrs[a] = clamp(Math.round(ovr + (tw[a] || 0) + (unit('nfla', item.name, a) - 0.5) * 6), 35, 99); });
  const r = { ovr, attrs, pos, estimated: !fixed };
  if (pos === 'DEF') r.role = nflDefRole(item, r);
  return r;
}
const nflEraOf = (item, topic) => (/legend|Hall of Fame|all-time|greatest|19[5-9]\d|200\d|Megatron|Sweetness|Minister/i.test((item && item.desc) || '') || /Brady|Manning|Montana|Marino|Elway|Favre|Brees|Rice|Moss|Gronkowski|Donald|Lawrence Taylor|Ray Lewis|Emmitt|Sanders|Payton|Tomlinson|Peterson|Faulk|Jim Brown|Calvin|Fitzgerald|Owens|Julio|Gonzalez|Sharpe|Gates|Witten|Reggie/.test((item && item.name) || '') ? 'prime' : 'now');
const NFL_REPLACEMENT = 72;
function nflTeam(d, m) {
  const by = { QB: [], RB: [], WR: [], TE: [], DEF: [] };
  m.team.forEach((x, k) => { const it = x && d.items[x.itemId]; if (!it) return; const r = nflRating(it, d.rules.slots[k]); by[r.pos].push({ name: it.name, itemId: it.id, price: x.price || 0, ...r }); });
  const fill = (pos, i, label) => by[pos][i] || { name: label, itemId: null, price: 0, ovr: NFL_REPLACEMENT, pos, attrs: Object.fromEntries(NFL_ATTRS[pos].map((a) => [a, NFL_REPLACEMENT])), backup: true, role: pos === 'DEF' ? 'LB' : undefined };
  const qb = fill('QB', 0, 'Backup QB'), rb = fill('RB', 0, 'Backup RB'), wr1 = fill('WR', 0, 'Backup WR'), wr2 = fill('WR', 1, 'Backup WR 2'), te = fill('TE', 0, 'Backup TE'), def = fill('DEF', 0, 'Backup LB');
  // The star's effect on the whole defence.
  const rush = 80 + (def.role === 'DL' ? (def.attrs.RSH - 80) * 0.55 : (def.attrs.RSH - 80) * 0.2);
  const cover = 80 + (def.role === 'CB' || def.role === 'S' ? (def.attrs.COV - 80) * 0.5 : (def.attrs.COV - 80) * 0.2);
  const runD = 80 + (def.role === 'LB' || def.role === 'DL' ? (def.attrs.TKL - 80) * 0.4 : (def.attrs.TKL - 80) * 0.2);
  return { qb, rb, wr1, wr2, te, def, rush, cover, runD, ol: 80 };
}
const nflYard = (on) => (on === 50 ? '50' : on < 50 ? 'own ' + on : 'opp ' + (100 - on));
const NFL_ORD = ['', '1st', '2nd', '3rd', '4th'];

function simulateNFL(d, A, B, key) {
  const rng = seeded(d.seed, 'nfl', key, A.id, B.id);
  const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += rng(); return (u - 2) / 0.58; };
  const T = [nflTeam(d, A), nflTeam(d, B)];
  const form = [gauss() * 0.025, gauss() * 0.025];
  const score = [0, 0]; const plays = [];
  const box = [0, 1].map(() => ({}));
  const st = (s, name) => (box[s][name] = box[s][name] || { pass: 0, comp: 0, att: 0, ptd: 0, int: 0, rush: 0, car: 0, rtd: 0, rec: 0, recY: 0, rectd: 0, sack: 0, ints: 0, ff: 0, tkl: 0 });
  let q = 1, clock = 900, poss = rng() < 0.5 ? 0 : 1; const firstPoss = poss;
  let on = 30, down = 1, togo = 10; let ot = 0; let done = false; let otFirst = null;
  const push = (p) => { p.q = q; p.clk = Math.max(0, Math.round(clock)); p.score = [...score]; p.i = plays.length; plays.push(p); return p; };
  const turnover = (newOn) => { poss = 1 - poss; on = clamp(newOn, 1, 99); down = 1; togo = Math.min(10, 100 - on); };
  const kickoff = () => { on = 30; down = 1; togo = 10; };
  const secs = (x) => { clock -= x; };
  // Tackled in your own end zone: two points the other way, and they get the ball.
  const safety = (s, p) => { score[1 - s] += 2; p.text += ' SAFETY!'; p.safety = true; p.hl = true; p.big = true; p.score = [...score]; poss = 1 - s; kickoff(); };
  const lateHalf = () => (q === 2 || q === 4) && clock <= 120;
  const scoreTD = (s, p) => {
    score[s] += 6; p.td = true;
    // Extra point or two.
    const diff = score[s] - score[1 - s];
    const goTwo = q === 4 && clock < 600 && [-2, 1, -5, 5, -10].includes(diff);
    if (goTwo) { const ok2 = rng() < 0.48; if (ok2) score[s] += 2; p.after = ok2 ? 'Two-point try is GOOD!' : 'Two-point try fails.'; p.two = ok2; }
    else { const ok1 = rng() < 0.945; if (ok1) score[s] += 1; p.after = ok1 ? 'Extra point good.' : 'Extra point MISSED!'; }
    p.score = [...score];
  };
  const endPeriod = () => {
    if (q === 2) { q = 3; clock = 900; poss = 1 - firstPoss; kickoff(); push({ type: 'half', poss, text: 'Halftime: ' + score[0] + '–' + score[1] + '.' }); return; }
    if (q === 4 || q >= 5) {
      if (score[0] !== score[1]) { done = true; return; }
      if (ot >= 2) {
        // Still level: a kicking duel from 40 yards, moving back 5 each round.
        let dist = 40; let w = null;
        for (let k = 0; k < 12 && w == null; k++, dist += 5) { const p = (x) => clamp(1.12 - x / 95, 0.2, 0.98); const a = rng() < p(dist), b = rng() < p(dist); if (a !== b) w = a ? 0 : 1; }
        if (w == null) w = rng() < 0.5 ? 0 : 1;
        score[w] += 3; push({ type: 'duel', poss: w, text: 'Kicking duel! ' + (w === 0 ? A : B).name + ' win it.', hl: true, big: true }); done = true; return;
      }
      ot++; q = 4 + ot; clock = 600; poss = rng() < 0.5 ? 0 : 1; kickoff(); otFirst = poss;
      push({ type: 'ot', poss, text: 'Overtime! First score wins.', hl: true }); return;
    }
    q++; clock = 900;
    push({ type: 'qend', poss, text: 'End of quarter ' + (q - 1) + ': ' + score[0] + '–' + score[1] + '.' });
  };
  let guard = 0;
  push({ type: 'kick', poss, text: (poss === 0 ? A : B).name + ' receive the opening kickoff.' });
  kickoff();
  while (!done && guard++ < 400) {
    if (clock <= 0) { endPeriod(); continue; }
    const O = T[poss], D = T[1 - poss]; const s = poss;
    const diff = score[s] - score[1 - s];
    const late = q >= 4 && clock < 300;
    const hurry = lateHalf() || (late && diff < 0);
    const base = { poss: s, on, down, togo };
    const fgDist = 100 - on + 17;
    // Fourth down: kick, punt or go for it.
    if (down === 4) {
      const needTD = late && diff < -3 && diff >= -8;
      const goFor = (togo <= 1 && on > 40 && rng() < 0.55) || (late && diff < 0 && (fgDist > 56 || needTD || clock < 120 && diff < -3)) || (togo <= 3 && on >= 55 && on <= 65 && rng() < 0.4) || q >= 5 && fgDist > 55;
      if (!goFor && fgDist <= 57) {
        const pk = clamp(1.12 - fgDist / 95 + (fgDist < 33 ? 0.05 : 0), 0.3, 0.99);
        const good = rng() < pk;
        secs(5);
        const p = push({ ...base, type: 'fg', dist: fgDist, good, text: fgDist + '-yard field goal… ' + (good ? 'GOOD!' : (rng() < 0.5 ? 'wide right. No good!' : 'off the upright! No good!')), hl: fgDist >= 48 || late || q >= 5 || !good, big: good && (late || q >= 5) });
        if (good) { score[s] += 3; p.score = [...score]; if (q >= 5 && (otFirst !== s || score[s] > score[1 - s])) { done = true; break; } poss = 1 - s; kickoff(); }
        else turnover(100 - Math.max(on, 20));
        continue;
      }
      if (!goFor) {
        const net = clamp(Math.round(42 + gauss() * 6), 25, 60);
        let land = on + net; let tb = false; if (land >= 100) { land = 80; tb = true; }
        secs(8);
        push({ ...base, type: 'punt', yds: net, text: 'Punt, ' + net + ' yards' + (tb ? ' — touchback.' : '.'), hl: false });
        turnover(100 - land); continue;
      }
    }
    // Run or pass?
    let passP = 0.57 + (togo >= 7 ? 0.17 : togo <= 2 ? -0.22 : 0) + (down === 3 ? 0.1 : 0) + (hurry ? 0.25 : 0) + (late && diff > 0 ? -0.3 : 0) + (O.qb.attrs.ACC - O.rb.ovr) / 200;
    const isPass = rng() < clamp(passP, 0.15, 0.95);
    let p;
    if (isPass) {
      const sackP = clamp(0.064 + (D.rush - O.ol) / 260 - (O.qb.attrs.MOB - 80) / 650, 0.025, 0.16);
      const x = rng();
      if (x < sackP) {
        const yds = -(4 + Math.floor(rng() * 6));
        const byStar = D.def.role === 'DL' || D.def.role === 'LB' ? rng() < 0.32 + (D.def.attrs.RSH - 80) / 100 : rng() < 0.1;
        const by = byStar ? D.def.name : 'the defence';
        if (byStar) st(1 - s, D.def.name).sack++;
        const strip = rng() < 0.11; const lost = strip && rng() < 0.55;
        p = push({ ...base, type: lost ? 'fum' : 'sack', yds, who: O.qb.name, by, star: byStar, text: (byStar ? D.def.name + ' sacks ' : O.qb.name + ' is sacked by ') + (byStar ? O.qb.name : by) + '!' + (strip ? (lost ? ' Strip-sack — FUMBLE recovered by the defence!' : ' Fumble — the offence falls on it.') : ' Loss of ' + -yds + '.'), hl: byStar || lost || late, big: lost });
        secs(hurry ? 22 : 36);
        if (lost) { if (byStar) st(1 - s, D.def.name).ff++; turnover(100 - Math.max(1, on + yds)); continue; }
        if (on + yds <= 0) { safety(s, p); continue; }
        on += yds;
        down++; togo -= yds; if (down > 4) { turnover(100 - on); }
        continue;
      }
      // Scramble.
      if (rng() < 0.022 + Math.max(0, O.qb.attrs.MOB - 85) / 260) {
        const yds = Math.max(-1, Math.round(4 + gauss() * 3.5 + (O.qb.attrs.MOB - 85) / 5 + (rng() < 0.06 ? 12 + rng() * 22 : 0)));
        const gain = Math.min(yds, 100 - on);
        st(s, O.qb.name).rush += gain; st(s, O.qb.name).car++;
        p = push({ ...base, type: 'scramble', yds: gain, who: O.qb.name, text: O.qb.name + ' scrambles for ' + gain + '!', hl: gain >= 15 });
        secs(hurry ? 20 : 34);
        if (on + gain <= 0) { safety(s, p); continue; }
        on += gain; if (on >= 100) { st(s, O.qb.name).rtd++; p.text = O.qb.name + ' scrambles ' + gain + ' yards for the TOUCHDOWN!'; p.hl = true; p.big = true; scoreTD(s, p); if (q >= 5) { done = true; break; } poss = 1 - s; kickoff(); continue; }
        if (gain >= togo) { down = 1; togo = Math.min(10, 100 - on); } else { down++; togo -= gain; if (down > 4) turnover(100 - on); }
        continue;
      }
      const tgts = [['wr1', 1.0], ['wr2', 0.85], ['te', 0.7], ['rb', 0.4]];
      const [tk] = weighted(rng, tgts, (t2) => t2[1] * (O[t2[0]].ovr / 85) * (O[t2[0]].backup ? 0.6 : 1));
      const R = O[tk];
      const deepP = 0.16 + ((R.attrs.SPD || 80) - 85) / 120 + (hurry && diff < 0 ? 0.08 : 0) + (tk === 'rb' ? -0.15 : 0);
      const dz = rng() < clamp(deepP, 0.02, 0.35) ? 'deep' : rng() < 0.45 ? 'medium' : 'short';
      const air = dz === 'deep' ? 20 + Math.floor(rng() * 22) : dz === 'medium' ? 9 + Math.floor(rng() * 8) : Math.floor(rng() * 7) - (tk === 'rb' ? 3 : 0);
      const starCov = D.def.role === 'CB' || D.def.role === 'S';
      const cov = D.cover + (starCov && tk.startsWith('wr') && rng() < 0.5 ? (D.def.attrs.COV - D.cover) * 0.5 : 0);
      const compP = clamp({ short: 0.71, medium: 0.56, deep: 0.35 }[dz] + (O.qb.attrs.ACC - cov) / 220 + ((R.attrs.RTE || 80) - cov) / 380 + ((R.attrs.HND || 80) - 85) / 400 + form[s] + (dz === 'deep' ? (O.qb.attrs.ARM - 85) / 250 : 0), 0.2, 0.9);
      const intP = clamp(0.026 + (cov - O.qb.attrs.DEC) / 260 + (dz === 'deep' ? 0.02 : 0) + (hurry && diff < 0 ? 0.012 : 0), 0.004, 0.07);
      st(s, O.qb.name).att++;
      const y = rng();
      if (y < intP) {
        const byStar = starCov ? rng() < 0.45 : rng() < 0.06;
        const by = byStar ? D.def.name : 'the defence';
        if (byStar) st(1 - s, D.def.name).ints++;
        st(s, O.qb.name).int++;
        const spot = Math.min(99, on + air); let ret = Math.max(0, Math.round(8 + gauss() * 8 + (rng() < 0.06 ? 60 : 0)));
        const newOn = 100 - spot + ret;
        p = push({ ...base, type: 'int', yds: air, who: O.qb.name, tgt: R.name, by, star: byStar, text: 'INTERCEPTED! ' + (byStar ? D.def.name : 'The defence') + ' picks off ' + O.qb.name + (newOn >= 100 ? ' and takes it all the way — PICK SIX!' : ', returned ' + ret + ' yards.'), hl: true, big: true, dz });
        secs(hurry ? 10 : 20);
        if (newOn >= 100) { poss = 1 - s; scoreTD(1 - s, p); if (q >= 5) { done = true; break; } poss = s; kickoff(); continue; }
        turnover(Math.min(99, newOn)); continue;
      }
      if (y < intP + compP) {
        let yac = Math.max(0, Math.round(2.5 + gauss() * 2.5 + ((R.attrs.YAC || R.attrs.SPD || 80) - 85) / 7));
        if (rng() < 0.03 + ((R.attrs.SPD || 80) - 85) / 300) yac += 10 + Math.floor(rng() * 40);
        const gain = Math.min(air + yac, 100 - on);
        st(s, O.qb.name).comp++; st(s, O.qb.name).pass += gain; st(s, R.name).rec++; st(s, R.name).recY += gain;
        p = push({ ...base, type: 'pass', yds: gain, who: O.qb.name, tgt: R.name, dz, air, text: O.qb.name + ' finds ' + R.name + (dz === 'deep' ? ' deep' : '') + ' for ' + gain + '.', hl: gain >= 20 || (late && Math.abs(diff) <= 8 && rng() < 0.35), dzn: dz });
        secs(hurry ? 16 : 33);
        if (on + gain <= 0) { safety(s, p); continue; }
        on += gain;
        if (on >= 100) { st(s, O.qb.name).ptd++; st(s, R.name).rectd++; p.text = O.qb.name + ' to ' + R.name + ', ' + gain + ' yards — TOUCHDOWN!'; p.hl = true; p.big = true; scoreTD(s, p); if (q >= 5) { done = true; break; } poss = 1 - s; kickoff(); continue; }
        if (gain >= togo) { down = 1; togo = Math.min(10, 100 - on); } else { down++; togo -= gain; if (down > 4) turnover(100 - on); }
        continue;
      }
      p = push({ ...base, type: 'inc', yds: 0, who: O.qb.name, tgt: R.name, dz, air, text: 'Incomplete, ' + (rng() < 0.5 ? 'intended for ' + R.name : 'broken up') + '.', hl: false });
      secs(8);
      down++; if (down > 4) turnover(100 - on);
      continue;
    }
    // Run.
    const carrier = O.rb;
    let yds = Math.round(3.4 + gauss() * 3.4 + (carrier.ovr - D.runD) / 18 + ((carrier.attrs.POW || 80) - 85) / 20 + form[s] * 20);
    if (rng() < 0.022 + ((carrier.attrs.SPD || 80) - 85) / 300 + ((carrier.attrs.VIS || 80) - 85) / 500) yds += 10 + Math.floor(rng() * 45);
    yds = Math.max(-4, yds);
    const gain = Math.min(yds, 100 - on);
    const fum = rng() < 0.012 - ((carrier.attrs.HND || 80) - 85) / 4000;
    st(s, carrier.name).rush += gain; st(s, carrier.name).car++;
    if (fum) {
      const byStar = rng() < 0.3; if (byStar) st(1 - s, D.def.name).ff++;
      p = push({ ...base, type: 'fum', yds: gain, who: carrier.name, by: byStar ? D.def.name : 'the defence', star: byStar, run: true, text: carrier.name + ' runs for ' + gain + ' and FUMBLES! ' + (byStar ? D.def.name + ' forces it out — turnover!' : 'The defence recovers!'), hl: true, big: true });
      secs(30); turnover(100 - Math.min(99, on + gain)); continue;
    }
    const tackler = rng() < (D.def.role === 'LB' ? 0.3 : 0.14) ? D.def.name : null;
    if (tackler) st(1 - s, tackler).tkl++;
    p = push({ ...base, type: 'run', yds: gain, who: carrier.name, by: tackler, text: carrier.name + (gain >= 20 ? ' BREAKS FREE for ' + gain + '!' : gain <= 0 ? ' is stopped' + (tackler ? ' by ' + tackler : '') + ' for ' + (gain < 0 ? 'a loss of ' + -gain : 'no gain') + '.' : ' runs for ' + gain + '.'), hl: gain >= 18 || (down === 4) || (gain <= 0 && down >= 3 && !!tackler) });
    secs(hurry ? 25 : 38);
    if (on + gain <= 0) { safety(s, p); continue; }
    on += gain;
    if (on >= 100) { st(s, carrier.name).rtd++; p.text = carrier.name + ' runs it in from ' + gain + ' — TOUCHDOWN!'; p.hl = true; p.big = true; scoreTD(s, p); if (q >= 5) { done = true; break; } poss = 1 - s; kickoff(); continue; }
    if (gain >= togo) { down = 1; togo = Math.min(10, 100 - on); } else { down++; togo -= gain; if (down > 4) { p.text += ' Turnover on downs!'; p.hl = true; turnover(100 - on); } }
  }
  if (score[0] === score[1]) { const w = rng() < 0.5 ? 0 : 1; score[w] += 3; push({ type: 'duel', poss: w, text: 'A late field goal settles it.', hl: true }); }
  const winner = score[0] > score[1] ? 0 : 1;
  // Late drama: every play in the last two minutes of a one-score game is worth watching.
  plays.forEach((p) => { if (p.q >= 4 && p.clk <= 120 && Math.abs(p.score[0] - p.score[1]) <= 8 && p.type !== 'qend' && p.type !== 'half') p.hl = true; });
  // Points scored in each quarter (overtime periods added on the end).
  const maxQ = plays.reduce((m, p) => Math.max(m, p.q), 4);
  const quarters = []; let prev = [0, 0];
  for (let qi = 1; qi <= maxQ; qi++) { const last = plays.filter((p) => p.q === qi).pop(); const now = last ? last.score : prev; quarters.push([now[0] - prev[0], now[1] - prev[1]]); prev = now; }
  const lastScore = plays[plays.length - 1].score; if (lastScore[0] !== score[0] || lastScore[1] !== score[1]) { const L = quarters[quarters.length - 1]; L[0] += score[0] - lastScore[0]; L[1] += score[1] - lastScore[1]; }
  const lineups = T.map((t) => ['qb', 'rb', 'wr1', 'wr2', 'te', 'def'].map((k) => ({ k, name: t[k].name, itemId: t[k].itemId, pos: t[k].pos, role: t[k].role, ovr: t[k].ovr, backup: !!t[k].backup })));
  return { v: 'nfl', kind: 'nfl', plays, score: [...score], winner, ot, box, lineups, quarters, et: ot > 0, pens: null, sudden: false, events: [] };
}
const nflClock = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
const nflQName = (q) => (q <= 4 ? 'Q' + q : q === 5 ? 'OT' : 'OT' + (q - 4));
