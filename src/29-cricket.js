/* ============================================================
   CRICKET — a T20 match for Cricket Players.
   Built like the other sports engines: estimate the players →
   simulate the whole match ball by ball → keep a timeline → animate.
   · Each XI is the six drafted players plus five average squad
     players (the same for both teams). Batting order: the two
     batters open, the keeper bats four, the all-rounder five; the
     bowlers bat at the bottom. 20 overs, at most four per bowler:
     quicks open and close, spinners bowl the middle overs.
   · Every ball: dots, singles, twos, threes, fours, sixes, wides and
     no-balls (with free hits), and wickets — bowled, LBW, caught,
     caught behind, stumped, run out — plus dropped catches. The
     batter's quality and power against the bowler's, the phase
     (powerplay, middle overs, death overs), how set the batter is
     and the chase rate all change the odds. A tie goes to a Super
     Over (and another if needed).
   · Player numbers are Draft Night estimates (Prime), never official.
   ============================================================ */
const CRK_SPIN = /Warne|Muralitharan|Rashid Khan|Kumble|Harbhajan|Kuldeep|Chahal|Lyon|Zampa|Saqlain|Varun|Shakib|Jadeja|Axar|Santner|Shadab|Hasaranga|Maxwell|Ashwin|Narine/;
const CRK_POWER = /Gayle|Russell|Pollard|Maxwell|Shahid Afridi|Sehwag|Travis Head|Buttler|Klaasen|Pooran|Salt|Suryakumar|de Villiers|McCullum|Rohit|Pant|Stokes|Hardik|Gilchrist|Hayden|Warner|Jaiswal|Brook|Stoinis|Viv Richards|Dhoni|Fakhar|Hayden|Pietersen|Marsh|Green/;
const CRK_ANCHOR = /Dravid|Root|Williamson|Steve Smith|Cook|Gavaskar|Chanderpaul|Babar|Amla|Younis|Labuschagne|Latham|Conway|Saud|Kallis|Bradman|Miandad|Sangakkara|Jayawardene/;
const CRK_PROFILE_SRC = `
Virat Kohli|96|
Rohit Sharma|92|
Babar Azam|90|
Joe Root|91|
Steve Smith|92|
Kane Williamson|91|
Sachin Tendulkar|98|
Brian Lara|97|
Shubman Gill|88|
Travis Head|89|
MS Dhoni|93|
Rishabh Pant|88|
Jos Buttler|91|
Quinton de Kock|88|
Adam Gilchrist|94|
Mohammad Rizwan|87|
Jasprit Bumrah|97|
Shaheen Afridi|90|
Pat Cummins|93|
Mitchell Starc|91|
James Anderson|94|
Rashid Khan|93|
Shane Warne|97|
Muttiah Muralitharan|97|
Wasim Akram|96|
Kagiso Rabada|91|
Ben Stokes|92|
Shakib Al Hasan|90|
Hardik Pandya|88|
Jacques Kallis|96|
Ravindra Jadeja|91|
Glenn Maxwell|89|
Ricky Ponting|95|
Rahul Dravid|93|
Viv Richards|97|
Don Bradman|99|
AB de Villiers|96|
Kumar Sangakkara|94|
Glenn McGrath|96|
Dale Steyn|95|
Curtly Ambrose|94|
Malcolm Marshall|95|
Lasith Malinga|92|
Garfield Sobers|98|
Imran Khan|94|
Kapil Dev|92|
Ian Botham|92|
Richard Hadlee|94|
Chris Gayle|92|
Andre Russell|89|
Suryakumar Yadav|89|
Anil Kumble|93|`;
const CRK_PROFILE = {};
CRK_PROFILE_SRC.trim().split('\n').forEach((line) => { const [name, ovr] = line.split('|'); CRK_PROFILE[name.toLowerCase()] = { ovr: +ovr }; });
const crkRole = (item, slot) => { const p = norm((item && item.pos) || slot || ''); return ['BAT', 'BOWL', 'WK', 'AR'].includes(p) ? p : 'AR'; };
function crkRating(item, slot) {
  const prof = CRK_PROFILE[String(item.name || '').toLowerCase()];
  const fixed = validRating(item.rating);
  const ovr = fixed ? clamp(Math.round(+item.rating), 1, 99) : prof ? prof.ovr : clamp(Math.round(74 + itemFame(item) * 20 + (unit('crko', item.name) - 0.5) * 6), 66, 94);
  const role = crkRole(item, slot); const n = String(item.name || '');
  const j = (k) => (unit('crka', n, k) - 0.5) * 6;
  const bat = Math.round(role === 'BAT' ? ovr + j(1) : role === 'WK' ? ovr - 2 + j(1) : role === 'AR' ? ovr - 5 + j(1) : 42 + j(1) * 2);
  const bowl = Math.round(role === 'BOWL' ? ovr + j(2) : role === 'AR' ? ovr - 5 + j(2) : 30 + j(2));
  const pwr = Math.round(clamp(bat + (CRK_POWER.test(n) ? 8 : CRK_ANCHOR.test(n) ? -6 : 0) + j(3), 30, 99));
  return { ovr, role, bat: clamp(bat, 25, 99), bowl: clamp(bowl, 20, 99), pwr, type: CRK_SPIN.test(n) ? 'spin' : 'pace', keep: role === 'WK' ? ovr : 50, estimated: !fixed };
}
const CRK_SQUAD = 78; // the five squad players in each XI
const crkOvers = (b) => Math.floor(b / 6) + (b % 6 ? '.' + (b % 6) : '');
const CRK_WK = ['bowled', 'lbw', 'caught', 'caught behind', 'stumped', 'run out'];

function crkXI(d, m, side) {
  const got = m.team.map((x, k) => { const it = x && d.items[x.itemId]; return it ? { name: it.name, itemId: it.id, price: x.price || 0, ...crkRating(it, d.rules.slots[k]) } : null; }).filter(Boolean);
  const take = (role) => { const i = got.findIndex((p) => p.role === role); return i >= 0 ? got.splice(i, 1)[0] : null; };
  const sq = (n, kind) => ({ name: 'Squad ' + kind + ' ' + n, itemId: null, price: 0, ovr: CRK_SQUAD, role: kind === 'bowler' ? 'BOWL' : 'BAT', bat: kind === 'bowler' ? 48 : CRK_SQUAD, bowl: kind === 'bowler' ? CRK_SQUAD : 35, pwr: kind === 'bowler' ? 45 : CRK_SQUAD, type: n % 2 ? 'spin' : 'pace', keep: 50, squad: true });
  const bat1 = take('BAT') || sq(1, 'batter'), bat2 = take('BAT') || sq(2, 'batter'), wk = take('WK') || { ...sq(3, 'batter'), role: 'WK', keep: 75, name: 'Squad keeper' }, ar = take('AR') || { ...sq(4, 'batter'), role: 'AR', bowl: 72, name: 'Squad all-rounder' };
  const bw1 = take('BOWL') || sq(5, 'bowler'), bw2 = take('BOWL') || sq(6, 'bowler');
  // Anyone left over (custom topics) bats in the middle.
  const extra = got.splice(0);
  const order = [bat1, bat2, sq(1, 'batter'), wk, ar, ...extra, sq(2, 'batter'), { ...sq(3, 'batter'), name: 'Squad all-rounder', bowl: 74, role: 'AR' }, bw1, bw2, sq(4, 'bowler'), sq(5, 'bowler')].slice(0, 11);
  while (order.length < 11) order.push(sq(order.length, 'bowler'));
  return order;
}
// Who bowls each of the 20 overs (max 4 each, never two in a row).
function crkPlan(xi) {
  const bowlers = xi.map((p, i) => ({ i, p })).filter((x) => x.p.bowl >= 60).sort((a, b) => b.p.bowl - a.p.bowl).slice(0, 6);
  while (bowlers.length < 5) bowlers.push({ i: xi.length - 1 - bowlers.length, p: xi[xi.length - 1 - bowlers.length] });
  const left = Object.fromEntries(bowlers.map((b) => [b.i, 4]));
  const plan = []; let last = -1;
  for (let o = 0; o < 20; o++) {
    const phase = o < 6 ? 'pp' : o < 15 ? 'mid' : 'death';
    const need = 20 - o;
    const opts = bowlers.filter((b) => left[b.i] > 0 && b.i !== last);
    const score = (b) => b.p.bowl + (phase === 'mid' ? (b.p.type === 'spin' ? 8 : 0) : (b.p.type === 'pace' ? 6 : -4)) + left[b.i] * (need <= 8 ? 6 : 1);
    const pick = opts.sort((a, b) => score(b) - score(a))[0] || bowlers.find((b) => left[b.i] > 0) || bowlers[0];
    plan.push(pick.i); left[pick.i]--; last = pick.i;
  }
  return plan;
}

function crkInnings(rng, bat, bowlXI, target, ctx) {
  const balls = []; const hl = [];
  const maxBalls = ctx.superOver ? 6 : 120, maxWk = ctx.superOver ? 2 : 10;
  const plan = ctx.superOver ? [ctx.soBowler] : crkPlan(bowlXI);
  const bs = bat.map(() => ({ r: 0, b: 0, f: 0, s: 0, out: null }));
  const bw = bowlXI.map(() => ({ o: 0, r: 0, w: 0, dots: 0, balls: 0 }));
  const order = ctx.superOver ? ctx.soOrder : bat.map((_, i) => i);
  let next = 2; let striker = order[0], non = order[1];
  let runs = 0, wk = 0, legal = 0, freeHit = false, extras = 0;
  const form = bat.map(() => (rng() - 0.5) * 6);
  while (legal < maxBalls && wk < maxWk && !(target != null && runs >= target)) {
    const over = Math.floor(legal / 6); const bi = plan[Math.min(plan.length - 1, over)]; const B = bowlXI[bi]; const S = bat[striker];
    const phase = ctx.superOver ? 'death' : over < 6 ? 'pp' : over < 15 ? 'mid' : 'death';
    const set = Math.min(1, bs[striker].b / 15);
    const left = maxBalls - legal; const need = target != null ? target - runs : null;
    let agg = phase === 'pp' ? 0.45 : phase === 'mid' ? 0.35 : 0.85;
    if (need != null) agg += clamp((need / Math.max(1, left) * 6 - 8.5) / 8, -0.3, 0.8);
    agg += (10 - wk - 6) * 0.03; agg = clamp(agg, 0.05, 1.4);
    const q = (S.bat + form[striker] + set * 6 - B.bowl) / 100;
    const wides = rng();
    const code = { r: 0, x: 0, w: 0, bat: striker, bowl: bi, how: null, f: null, fh: freeHit };
    if (wides < 0.034) { code.x = 1; code.r = 1; runs += 1; extras++; bw[bi].r++; code.tot = runs; code.wk = wk; code.lb = legal; balls.push(code); continue; }
    const pen = wides < 0.042 ? 1 : 0; if (pen) code.x = 2;
    // Wicket? (not off a no-ball or a free hit)
    const pW = clamp(0.047 - q * 0.11 + agg * 0.025 + (bs[striker].b < 4 ? 0.012 : 0) + (B.type === 'spin' && phase === 'mid' ? 0.004 : 0), 0.012, 0.13);
    let out = false; let batRuns = 0;
    if (!freeHit && !pen && rng() < pW) {
      const how = B.type === 'spin' ? weighted(rng, [['bowled', 2], ['lbw', 2], ['caught', 4.5], ['stumped', bowlXI.some((p) => p.role === 'WK') ? 1.2 : 0.3], ['run out', 0.4]], (x) => x[1])[0] : weighted(rng, [['bowled', 2.2], ['lbw', 1.6], ['caught', 4], ['caught behind', 1.4], ['run out', 0.5]], (x) => x[1])[0];
      const keeper = bowlXI.findIndex((p) => p.role === 'WK');
      const fielder = how === 'caught behind' || how === 'stumped' ? Math.max(0, keeper) : how === 'caught' || how === 'run out' ? Math.floor(rng() * 11) : null;
      if ((how === 'caught' || how === 'caught behind') && rng() < 0.085) { code.drop = fielder; batRuns = rng() < 0.5 ? 1 : 0; }
      else { out = true; code.w = 1; code.how = how; code.f = fielder; }
    }
    if (!out && code.drop == null) {
      const p6 = clamp(0.042 + (S.pwr + form[striker] - B.bowl) / 650 + agg * 0.055 + (freeHit ? 0.12 : 0), 0.004, 0.3);
      const p4 = clamp(0.105 + q * 0.18 + agg * 0.04 + (phase === 'pp' ? 0.025 : 0), 0.03, 0.3);
      const y = rng();
      if (y < p6) batRuns = 6; else if (y < p6 + p4) batRuns = 4;
      else { const z = rng(); batRuns = z < clamp(0.4 - agg * 0.12 - q * 0.2, 0.18, 0.55) ? 0 : z < 0.86 ? 1 : z < 0.985 ? 2 : 3; }
    }
    freeHit = !!pen;
    code.r = pen + batRuns; runs += code.r; extras += pen; bw[bi].r += code.r;
    bs[striker].r += batRuns; if (batRuns === 4) bs[striker].f++; if (batRuns === 6) bs[striker].s++;
    if (!pen) { legal++; bs[striker].b++; bw[bi].balls++; if (code.r === 0) bw[bi].dots++; }
    if (out) { wk++; bs[striker].out = { how: code.how, by: bi, f: code.f }; if (code.how !== 'run out') bw[bi].w++; code.out = striker; striker = next < order.length ? order[next++] : -1; if (striker < 0) { balls.push(code); break; } }
    else if (batRuns % 2 === 1) { const t2 = striker; striker = non; non = t2; }
    if (!pen && legal % 6 === 0) { const t2 = striker; striker = non; non = t2; bw[bi].o++; }
    code.tot = runs; code.wk = wk; code.lb = legal;
    balls.push(code);
  }
  bw.forEach((b) => { b.o = Math.floor(b.balls / 6) + (b.balls % 6) / 10; });
  return { balls, runs, wk, legal, bs, bw, extras };
}

function simulateCricket(d, A, B, key) {
  const rng = seeded(d.seed, 'cricket', key, A.id, B.id);
  const XI = [crkXI(d, A, 0), crkXI(d, B, 1)];
  const tossW = rng() < 0.5 ? 0 : 1; const batFirst = rng() < 0.55 ? 1 - tossW : tossW; // most captains chase
  const first = batFirst, second = 1 - batFirst;
  const inn1 = crkInnings(rng, XI[first], XI[second], null, {});
  const inn2 = crkInnings(rng, XI[second], XI[first], inn1.runs + 1, {});
  const innings = [{ team: first, ...inn1 }, { team: second, ...inn2 }];
  let winner, margin, superOvers = [];
  if (inn2.runs > inn1.runs) { winner = second; margin = { wickets: 10 - inn2.wk, balls: 120 - inn2.legal }; }
  else if (inn1.runs > inn2.runs) { winner = first; margin = { runs: inn1.runs - inn2.runs }; }
  else {
    // Super Over: best three batters, best bowler.
    for (let k = 0; k < 4 && winner == null; k++) {
      const pickBat = (xi) => xi.map((p, i) => ({ i, v: p.pwr + p.bat })).sort((a, b) => b.v - a.v).slice(0, 3).map((x) => x.i);
      const pickBowl = (xi) => xi.map((p, i) => ({ i, v: p.bowl })).sort((a, b) => b.v - a.v)[0].i;
      const soA = crkInnings(rng, XI[second], XI[first], null, { superOver: true, soOrder: pickBat(XI[second]), soBowler: pickBowl(XI[first]) });
      const soB = crkInnings(rng, XI[first], XI[second], soA.runs + 1, { superOver: true, soOrder: pickBat(XI[first]), soBowler: pickBowl(XI[second]) });
      superOvers.push({ team: second, ...soA }, { team: first, ...soB });
      if (soB.runs > soA.runs) winner = first; else if (soA.runs > soB.runs) winner = second;
    }
    if (winner == null) { const fours = (inn) => inn.balls.filter((b) => b.r === 4 || b.r === 6).length; winner = fours(inn1) >= fours(inn2) ? first : second; }
    margin = { superOver: true };
  }
  // Highlights: wickets, sixes, milestones, late fours in a close chase, dropped catches.
  const tag = (inn, ii) => {
    const bsRun = inn.balls.map(() => 0); const cum = {};
    inn.balls.forEach((b, k) => {
      const over = Math.floor((b.lb - (b.x === 1 || b.x === 2 ? 0 : 1)) / 6);
      cum[b.bat] = (cum[b.bat] || 0) + (b.x === 2 ? b.r - 1 : b.x === 1 ? 0 : b.r);
      const prev = cum[b.bat] - (b.x === 2 ? b.r - 1 : b.x === 1 ? 0 : b.r);
      const mile = [50, 100].find((m2) => prev < m2 && cum[b.bat] >= m2);
      if (mile) b.mile = mile;
      const close = ii === 1 && inn.balls.length - k < 18 && Math.abs((inn1.runs + 1) - b.tot) <= 24;
      b.hl = !!(b.w || b.r === 6 || b.drop || mile || (b.r === 4 && (close || over >= 18 || unit('crk4', key, ii, k) < 0.22)) || (ii >= 2));
      b.over = over;
    });
  };
  innings.forEach((inn, ii) => tag(inn, ii)); superOvers.forEach((inn) => tag(inn, 2));
  // Keep the stored match small: drop empty fields from every ball.
  [...innings, ...superOvers].forEach((inn) => inn.balls.forEach((b) => { Object.keys(b).forEach((k) => { if (b[k] === null || b[k] === false || (b[k] === 0 && !['r', 'tot', 'wk', 'lb', 'bat', 'bowl', 'drop', 'f', 'out'].includes(k))) delete b[k]; }); }));
  const view = XI.map((xi) => xi.map((p) => ({ name: p.name, itemId: p.itemId, role: p.role, type: p.type, squad: !!p.squad, ovr: p.ovr, price: p.price })));
  const score = [0, 0]; score[first] = inn1.runs; score[second] = inn2.runs;
  return { v: 'cricket', kind: 'cricket', toss: tossW, batFirst: first, innings, superOvers, winner, margin, xi: view, score, et: false, pens: null, sudden: superOvers.length > 0, events: [] };
}
function crkResultLine(m, A, B) {
  const T = (i) => (i === 0 ? A : B); const w = T(m.winner);
  if (m.margin.superOver) return w.name + ' won the Super Over!';
  if (m.margin.runs != null) return w.name + ' won by ' + m.margin.runs + ' run' + (m.margin.runs === 1 ? '' : 's') + '.';
  return w.name + ' won by ' + m.margin.wickets + ' wicket' + (m.margin.wickets === 1 ? '' : 's') + (m.margin.balls ? ' with ' + m.margin.balls + ' ball' + (m.margin.balls === 1 ? '' : 's') + ' to spare' : ' off the last ball') + '.';
}
