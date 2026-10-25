/* ============================================================
   FIGHT NIGHT — the simulation for Boxing & UFC Fighters.
   Built like the football and basketball engines: estimate the
   fighters → simulate every bout exchange by exchange → keep a
   timeline → animate the big moments.
   · The card is slot against slot: Boxing v Boxing, UFC v UFC. The
     last bout is the main event. Most bouts won takes the card; level
     goes to a super fight between each team's priciest fighter.
   · Fighter numbers (Power, Speed, Technique, Defence, Chin, Cardio,
     Wrestling, Submissions) are Draft Night estimates from style and
     achievements, never official ratings. Dream fights ignore weight
     classes: it's pound-for-pound.
   · Boxing: 12 three-minute rounds. Jabs, power shots, body shots,
     combinations and counters; fighters get hurt, knocked down,
     beat the count (or don't), get stopped by the referee, the
     doctor or their own corner. Otherwise three judges score every
     round 10–9 (10–8 with knockdowns) and give a decision.
   · UFC: five-minute rounds (3, or 5 in the main event). Punches,
     leg, body and head kicks, knees, spinning attacks, takedowns,
     ground and pound, submissions (chokes, armbars…), sweeps and
     scrambles. Judges score striking, damage, takedowns and control.
   · Nothing is shown as a health bar: damage, tiredness and "hurt"
     stay inside the simulation and show up as what happens.
   ============================================================ */
const FIGHT_ATTRS = ['POW', 'SPD', 'TEC', 'DEF', 'CHN', 'CRD', 'WRS', 'SUB'];
const FIGHT_ATTR_NAMES = { POW: 'Power', SPD: 'Speed', TEC: 'Technique', DEF: 'Defence', CHN: 'Chin', CRD: 'Cardio', WRS: 'Wrestling', SUB: 'Submissions' };
// Style shapes (added to the overall number). agg = how much they press forward; td = how often they shoot for takedowns.
const FIGHT_STYLES = {
  puncher: { word: 'Knockout puncher', agg: 1.15, td: 0.03, POW: 7, SPD: -2, TEC: -4, DEF: -6, CHN: 0, CRD: -4, WRS: -12, SUB: -14 },
  boxer: { word: 'Slick boxer', agg: 0.9, td: 0.03, POW: -4, SPD: 3, TEC: 6, DEF: 4, CHN: 0, CRD: 2, WRS: -10, SUB: -12 },
  defence: { word: 'Defensive genius', agg: 0.75, td: 0.03, POW: -8, SPD: 2, TEC: 6, DEF: 9, CHN: 0, CRD: 2, WRS: -10, SUB: -12 },
  pressure: { word: 'Pressure fighter', agg: 1.3, td: 0.05, POW: 1, SPD: -1, TEC: -2, DEF: -5, CHN: 4, CRD: 6, WRS: -6, SUB: -12 },
  counter: { word: 'Counter-puncher', agg: 0.85, td: 0.03, POW: 2, SPD: 0, TEC: 5, DEF: 5, CHN: 0, CRD: -1, WRS: -10, SUB: -12 },
  wrestler: { word: 'Wrestler', agg: 1.1, td: 0.3, POW: -3, SPD: -3, TEC: -6, DEF: -3, CHN: 1, CRD: 6, WRS: 9, SUB: 1 },
  grappler: { word: 'Submission artist', agg: 1.0, td: 0.24, POW: -5, SPD: -2, TEC: -5, DEF: -3, CHN: 0, CRD: 2, WRS: 3, SUB: 9 },
  striker: { word: 'Striker', agg: 1.0, td: 0.04, POW: 2, SPD: 2, TEC: 5, DEF: 2, CHN: 0, CRD: 0, WRS: -12, SUB: -12 },
  allround: { word: 'All-rounder', agg: 1.05, td: 0.14, POW: 0, SPD: 0, TEC: 0, DEF: 0, CHN: 0, CRD: 1, WRS: -1, SUB: -2 },
  brawler: { word: 'Brawler', agg: 1.35, td: 0.04, POW: 5, SPD: -1, TEC: -5, DEF: -9, CHN: 5, CRD: 0, WRS: -12, SUB: -15 },
};
// name | prime number (estimate) | style | tweaks
const FIGHT_PROFILE_SRC = `
Muhammad Ali|97|boxer|SPD+6 CHN+7 CRD+4
Mike Tyson|94|puncher|SPD+5 DEF+6 CRD-2
Floyd Mayweather|96|defence|DEF+5 POW-2
Manny Pacquiao|94|pressure|SPD+7 POW+2
Canelo Álvarez|92|counter|CHN+5
Tyson Fury|92|boxer|CHN+6 POW+2
Anthony Joshua|88|puncher|TEC+3 CHN-4
Oleksandr Usyk|94|boxer|CRD+3
Naoya Inoue|94|puncher|TEC+6 SPD+3
Terence Crawford|94|counter|TEC+2
Sugar Ray Leonard|95|boxer|SPD+4 POW+3
Lennox Lewis|93|boxer|POW+8 CHN-2
Prince Naseem Hamed|89|puncher|SPD+4 DEF-2
Gervonta Davis|89|counter|POW+6
Amir Khan|84|boxer|SPD+8 CHN-14
Joe Frazier|92|pressure|POW+5
George Foreman|92|puncher|POW+5 CHN+5
Sugar Ray Robinson|98|boxer|POW+6
Marvin Hagler|93|pressure|CHN+4
Thomas Hearns|91|puncher|TEC+4 CHN-6
Roberto Durán|93|pressure|TEC+5
Julio César Chávez|92|pressure|CHN+3
Oscar De La Hoya|90|boxer|POW+2
Evander Holyfield|92|pressure|TEC+3 CHN+2
Bernard Hopkins|92|defence|CRD+4
Wladimir Klitschko|91|boxer|POW+8 CHN-8
Vitali Klitschko|91|puncher|CHN+8 TEC+2
Deontay Wilder|87|puncher|POW+12 TEC-6
Joe Calzaghe|91|pressure|SPD+4 POW-4
Gennady Golovkin|92|pressure|POW+6 CHN+5
Vasiliy Lomachenko|92|boxer|TEC+3 SPD+2
Dmitry Bivol|90|boxer|DEF+2
Artur Beterbiev|91|puncher|POW+3 CHN+4
Shakur Stevenson|89|defence|TEC+2
Katie Taylor|89|pressure|SPD+3
Claressa Shields|90|boxer|POW+2
Khabib Nurmagomedov|96|wrestler|WRS+5 CRD+3
Conor McGregor|89|striker|POW+8 CRD-8
Jon Jones|97|allround|TEC+4 WRS+3
Georges St-Pierre|96|wrestler|TEC+5 SPD+2
Anderson Silva|95|striker|TEC+3 SPD+3 SUB+6
Islam Makhachev|95|grappler|WRS+4
Israel Adesanya|92|striker|DEF+3
Alex Pereira|91|striker|POW+10
Francis Ngannou|91|puncher|POW+12
Khamzat Chimaev|90|wrestler|POW+5
Ilia Topuria|93|striker|POW+6 SUB+14
Daniel Cormier|93|wrestler|POW+3
Ronda Rousey|87|grappler|SUB+6 DEF-6
Amanda Nunes|94|striker|POW+4 WRS+10 SUB+10
Valentina Shevchenko|93|allround|TEC+4
Chuck Liddell|87|puncher|WRS+16
Randy Couture|87|wrestler|CHN+2
Matt Hughes|88|wrestler|POW+2
B.J. Penn|89|grappler|TEC+6
Cain Velasquez|92|wrestler|CRD+6 POW+3
Stipe Miocic|91|allround|POW+3
Max Holloway|92|striker|CRD+8 CHN+6 POW-4
Alexander Volkanovski|94|allround|CRD+3
Dustin Poirier|90|striker|CHN+3 SUB+10
Justin Gaethje|88|brawler|WRS+12
Charles Oliveira|91|grappler|SUB+4 TEC+4
Kamaru Usman|92|wrestler|POW+3
Leon Edwards|89|striker|WRS+8
José Aldo|92|striker|WRS+10
Dominick Cruz|89|allround|SPD+6 DEF+5
Henry Cejudo|89|wrestler|SPD+3
Demetrious Johnson|95|allround|SPD+6 CRD+4
Merab Dvalishvili|91|wrestler|CRD+8 POW-4
Sean O'Malley|87|striker|SPD+4
Tom Aspinall|90|allround|SPD+6
Dricus du Plessis|89|brawler|WRS+12 CRD+4
Zhang Weili|91|striker|WRS+8`;
const FIGHT_PROFILE = {};
FIGHT_PROFILE_SRC.trim().split('\n').forEach((line) => {
  const [name, ovr, style, tw] = line.split('|');
  const tweak = {};
  (tw || '').split(' ').filter(Boolean).forEach((t) => { const m = t.match(/^([A-Z]+)([+-]\d+)$/); if (m) tweak[m[1]] = +m[2]; });
  FIGHT_PROFILE[name.toLowerCase()] = { ovr: +ovr, style, tweak };
});
// Boxing or MMA, from the slot (or the fighter's own discipline for flexible slots).
const fightDisc = (s) => (/UFC|MMA|CAGE|OCTAGON/.test(norm(s)) ? 'mma' : /BOX/.test(norm(s)) ? 'box' : null);
function fightRating(item, slot) {
  const prof = FIGHT_PROFILE[String(item.name || '').toLowerCase()];
  const disc = fightDisc(item.pos) || fightDisc(slot) || 'box';
  const d = (item.desc || '') + ' ' + item.name;
  const fixed = validRating(item.rating);
  const style = prof ? prof.style : /knock|power|bomb|hands of stone|puncher/i.test(d) ? 'puncher' : /wrestl/i.test(d) ? 'wrestler' : /jiu|bjj|submission|judo/i.test(d) ? 'grappler' : disc === 'mma' ? 'allround' : 'boxer';
  const ovr = fixed ? clamp(Math.round(+item.rating), 1, 99) : prof ? prof.ovr : clamp(Math.round(72 + itemFame(item) * 22 + (unit('fovr', item.name) - 0.5) * 6), 60, 95);
  const S = FIGHT_STYLES[style]; const tw = prof ? prof.tweak : {};
  const attrs = {};
  FIGHT_ATTRS.forEach((a) => {
    if (disc === 'box' && (a === 'WRS' || a === 'SUB')) { attrs[a] = clamp(Math.round(30 + unit('fgr', item.name, a) * 18), 20, 60); return; }
    attrs[a] = clamp(Math.round(ovr + S[a] + (tw[a] || 0) + (unit('fattr', item.name, a) - 0.5) * 6), 25, 99);
  });
  return { ovr, attrs, style, styleWord: S.word, disc, estimated: !fixed };
}
function fightSquad(d, m) {
  return m.team.map((t, i) => {
    if (!t || !d.items[t.itemId]) return null;
    const item = d.items[t.itemId];
    return { name: item.name, itemId: item.id, price: t.price || 0, slot: d.rules.slots[i], k: i, ...fightRating(item, d.rules.slots[i]) };
  });
}

const FIGHT_LINES = {
  jab: ['{a} snaps out the jab.', '{a} pops the jab — {b}’s head goes back.', 'Double jab from {a}.'],
  power: ['{a} lands a big right hand!', 'Huge left hook from {a}!', '{a} digs an uppercut through the guard!', '{a} cracks {b} with an overhand right!'],
  body: ['{a} rips a hook to the body.', '{a} goes downstairs — that one hurt.', 'Body shot from {a}, {b} winces.'],
  combo: ['{a} unloads a {n}-punch combination!', 'Flurry from {a}: {n} punches, most of them land!', '{a} puts it together — {n} shots in a row!'],
  counter: ['{b} misses and {a} makes them pay with a counter!', 'Beautiful counter from {a}!', '{a} slips and fires back — perfect timing!'],
  legkick: ['{a} chops the lead leg.', 'Thudding leg kick from {a}.', '{a} kicks the calf — {b} limps.'],
  bodykick: ['{a} whips a kick to the body!', 'Big body kick from {a}!'],
  headkick: ['HEAD KICK from {a}!', '{a} throws the head kick — it lands flush!'],
  knee: ['{a} drives a knee up the middle!', 'Knee in the clinch from {a}!'],
  spin: ['Spinning back fist from {a}!', '{a} with a spinning wheel kick!', 'Spinning elbow from {a}!'],
  rock: ['{b} is HURT! Legs gone!', '{b} is wobbling!', '{b} is in big trouble!'],
  kd: ['{b} goes DOWN!', 'DOWN GOES {B}!', '{b} hits the canvas!'],
  up: ['{b} beats the count at {n}.', '{b} is up at {n} — can they survive?', 'Up at {n}! {b} says they’re fine.'],
  ko: ['{b} can’t beat the count. KNOCKOUT!', 'It’s all over! {a} knocks out {b}!', 'Lights out. {a} wins by knockout!'],
  tko: ['The referee jumps in — it’s stopped!', 'The referee has seen enough. {a} wins!', '{b} is defenceless — the referee waves it off!'],
  td: ['{a} shoots — TAKEDOWN!', '{a} changes levels and slams {b} to the mat!', 'Double-leg from {a}, {b} goes down!'],
  tdstuff: ['{a} shoots, {b} sprawls and stuffs it.', '{b} defends the takedown beautifully.'],
  gnp: ['{a} rains down ground and pound!', 'Elbows from the top — {a} is all over {b}!', '{a} postures up and drops heavy shots!'],
  subatt: ['{a} locks in a {s}… {b} escapes!', '{a} goes for the {s} — so close!', 'Tight {s} from {a}, but {b} survives!'],
  sub: ['{a} locks in the {s}… {b} TAPS!', 'TAP! TAP! {a} wins by {s}!', 'The {s} is deep — {b} has to tap!'],
  sweep: ['{a} sweeps and ends up on top!', 'Great scramble from {a}!'],
  standup: ['{a} gets back to the feet.', '{a} works back up to standing.'],
  cut: ['{b} is cut over the eye.', 'Blood! {b} is cut.'],
};
const fightLine = (rng, k, v) => { const ls = FIGHT_LINES[k]; return ls[Math.floor(rng() * ls.length)].replace('{a}', v.a || '').replace('{b}', v.b || '').replace('{B}', String(v.b || '').toUpperCase()).replace('{n}', v.n != null ? v.n : '').replace('{s}', v.s || ''); };
const SUB_NAMES = { top: ['arm-triangle choke', 'kimura', 'americana', 'armbar'], back: ['rear-naked choke', 'rear-naked choke', 'body-triangle choke'], bottom: ['triangle choke', 'armbar', 'guillotine choke'], front: ['guillotine choke', "d'arce choke"] };
const fightClock = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const METHOD_WORD = { KO: 'KO', TKO: 'TKO', SUB: 'Submission', DEC: 'Decision', RTD: 'TKO (corner stoppage)', DOC: 'TKO (doctor stoppage)', DRAW: 'Draw', WO: 'Walkover' };

// One bout. a, b are fighters (from fightSquad); rules = { disc, rounds }.
function fightBout(rng, a, b, rules) {
  const disc = rules.disc; const R = rules.rounds; const len = disc === 'mma' ? 300 : 180;
  const F = [a, b].map((x) => ({ ...x, dmg: 0, body: 0, legs: 0, sta: 100, rocked: 0, kds: 0, cut: 0, form: (rng() - 0.5) * 0.08, A: x.attrs }));
  // A fighter fighting outside their sport is a fish out of water.
  F.forEach((f) => { if (f.disc !== disc) f.offSport = true; });
  const st = (f, k) => { let v = f.A[k]; if (f.offSport && disc === 'box' && k !== 'CHN' && k !== 'CRD') v -= 7; if (f.offSport && disc === 'mma' && (k === 'DEF')) v -= 6; if (k === 'SPD') v -= f.legs * 0.25; return v; };
  const rounds = []; const events = [];
  let end = null; let pos = { g: null }; // g: null standing, else { top, kind: 'top'|'back' }
  const tot = [0, 1].map(() => ({ thrown: 0, landed: 0, power: 0, kd: 0, td: 0, tda: 0, ctrl: 0, subs: 0 }));
  for (let r = 1; r <= R && !end; r++) {
    const rs = [0, 1].map(() => ({ thrown: 0, landed: 0, power: 0, kd: 0, td: 0, tda: 0, ctrl: 0, subs: 0, rocked: 0, dmgDealt: 0 }));
    const rev = []; let t = 0; pos = { g: null };
    const push = (e) => { e.r = r; e.t = Math.min(len - 1, Math.round(t)); e.pos = e.pos || null; rev.push(e); events.push(e); return e; };
    const fatigue = (f) => (100 - f.sta) / 100;
    const hurt = (D, amount, head) => {
      const chin = 1.65 - st(D, 'CHN') / 100;
      const v = amount * (head ? chin : 0.7);
      if (head) D.dmg += v; else { D.body += v; D.sta -= v * 1.4; }
      return v;
    };
    // A landed big shot: maybe a knockdown, maybe hurt, maybe a finish.
    const bigShot = (s, v, kind, ev) => {
      const A = F[s], D = F[1 - s];
      const pKD = clamp(0.004 + v * 0.012 + D.dmg / 1300 + (D.rocked ? 0.12 : 0) - (st(D, 'CHN') - 82) / 900 + (kind === 'headkick' || kind === 'spin' ? 0.07 : 0) + Math.max(0, st(A, 'POW') - 88) / 250, 0, 0.6);
      const x = rng();
      if (x < pKD) {
        // Down!
        D.kds++; rs[s].kd++; tot[s].kd++; D.rocked = 2;
        ev.kind = 'kd'; ev.text += ' ' + fightLine(rng, 'kd', { b: D.name });
        if (disc === 'box') {
          const thisRound = rs[s].kd;
          const pUp = clamp(0.93 - D.dmg / 260 - (D.kds - 1) * 0.1 - (thisRound - 1) * 0.15 + (st(D, 'CHN') - 82) / 180 - (kind === 'power' && v > 5 ? 0.12 : 0), 0.12, 0.97);
          if (thisRound >= 3) { end = { w: s, method: 'TKO', r, t }; ev.kind = 'tko'; ev.up = false; ev.text += ' Third knockdown of the round — it’s over!'; return; }
          if (rng() < pUp) { const n = 3 + Math.floor(rng() * 6); ev.count = n; ev.up = true; ev.text += ' ' + fightLine(rng, 'up', { b: D.name, n }); }
          else { ev.kind = 'ko'; ev.count = 10; ev.up = false; end = { w: s, method: 'KO', r, t }; ev.text += ' ' + fightLine(rng, 'ko', { a: A.name, b: D.name }); }
        } else {
          // MMA: no count — the fighter on top pounces.
          const pFin = clamp(0.32 + D.dmg / 280 + (A.attrs.POW - 85) / 100 - (st(D, 'CHN') - 85) / 120, 0.15, 0.85);
          if (rng() < pFin) { ev.kind = 'ko'; ev.up = false; end = { w: s, method: rng() < 0.45 ? 'KO' : 'TKO', r, t }; ev.text += ' ' + (end.method === 'KO' ? 'Out cold! ' + A.name + ' wins by knockout!' : A.name + ' follows up and the referee stops it!'); }
          else { ev.up = true; pos = { g: { top: s, kind: 'top' } }; ev.text += ' ' + A.name + ' jumps on top, but ' + D.name + ' survives.'; }
        }
        return;
      }
      if (x < pKD * 3.2 || v > 6.5) {
        D.rocked = 2; rs[s].rocked++;
        ev.kind = 'rock'; ev.text += ' ' + fightLine(rng, 'rock', { b: D.name });
      }
      // Referee stoppage: a hurt fighter taking more shots with nothing coming back.
      if (D.rocked && D.dmg > 34 + (st(D, 'CHN') - 80) * 0.8 && rng() < 0.3) { ev.kind = 'tko'; end = { w: s, method: 'TKO', r, t }; ev.text += ' ' + fightLine(rng, 'tko', { a: A.name, b: D.name }); }
    };
    // One striking exchange started by side s.
    const strike = (s, counterOf) => {
      const A = F[s], D = F[1 - s]; const sty = FIGHT_STYLES[A.style];
      const w = disc === 'box'
        ? { jab: 38 + (A.style === 'boxer' || A.style === 'defence' ? 14 : 0), power: 26 + (A.style === 'puncher' ? 12 : 0) + (D.rocked ? 25 : 0), body: 12 + (A.style === 'pressure' ? 8 : 0), combo: 14 + (A.style === 'pressure' || A.style === 'brawler' ? 10 : 0) + (D.rocked ? 22 : 0) }
        : { jab: 22, power: 22 + (D.rocked ? 25 : 0), body: 6, combo: 12 + (D.rocked ? 20 : 0), legkick: 14 + (A.style === 'striker' ? 6 : 0), bodykick: 7, headkick: 2.5 + (A.style === 'striker' ? 2.5 : 0), knee: 3, spin: A.style === 'striker' ? 1.6 : 0.5 };
      if (counterOf) { w.jab = 0; w.combo = 0; w.body = 0; w.legkick = 0; w.bodykick = 0; w.knee = 0; w.spin = 0; w.headkick = disc === 'mma' ? 2 : 0; }
      const keys = Object.keys(w).filter((k) => w[k] > 0);
      const type = weighted(rng, keys, (k) => w[k]);
      const n = type === 'jab' ? 1 + Math.floor(rng() * 3) : type === 'combo' ? 3 + Math.floor(rng() * 4) : type === 'power' || type === 'body' ? 1 + (rng() < 0.4 ? 1 : 0) : 1;
      const base = { jab: 0.3, power: 0.32, body: 0.4, combo: 0.3, legkick: 0.62, bodykick: 0.5, headkick: 0.2, knee: 0.42, spin: 0.2 }[type];
      const acc = clamp(base + (st(A, 'TEC') - st(D, 'DEF')) / 220 + (st(A, 'SPD') - st(D, 'SPD')) / 420 - fatigue(A) * 0.12 + fatigue(D) * 0.08 + (D.rocked ? 0.16 : 0) + A.form + (counterOf ? 0.12 : 0), 0.06, 0.8);
      let landed = 0; for (let i = 0; i < n; i++) if (rng() < acc) landed++;
      rs[s].thrown += n; rs[s].landed += landed; tot[s].thrown += n; tot[s].landed += landed;
      const cost = { jab: 0.35, power: 0.9, body: 0.9, combo: 1.6, legkick: 1.0, bodykick: 1.3, headkick: 1.6, knee: 1.2, spin: 2 }[type];
      A.sta -= cost * (1.35 - st(A, 'CRD') / 100) * 1.3;
      const mult = { jab: 0.3, power: 1.55, body: 1.0, combo: 0.55, legkick: 0.45, bodykick: 1.0, headkick: 2.7, knee: 1.25, spin: 2.2 }[type];
      const powF = Math.pow(st(A, 'POW') / 82, 3) * (0.72 + A.sta / 360);
      let v = 0; let biggest = 0;
      for (let i = 0; i < landed; i++) { const one = mult * powF * (0.45 + rng() * 0.8); biggest = Math.max(biggest, one); v += hurt(D, one, type !== 'body' && type !== 'legkick' && type !== 'bodykick'); }
      if (type === 'legkick') D.legs += landed * 1.2 * powF;
      const isPower = type !== 'jab' && type !== 'legkick';
      if (isPower) { rs[s].power += landed; tot[s].power += landed; }
      rs[s].dmgDealt += v;
      if (!landed) {
        // A clean miss can get countered by a sharp defender.
        if (!counterOf && rng() < clamp((st(D, 'DEF') + st(D, 'TEC') - 160) / 160 + (D.style === 'counter' || D.style === 'defence' ? 0.12 : 0), 0, 0.3)) return strike(1 - s, { by: A.name, type });
        return null;
      }
      const head = type !== 'body' && type !== 'legkick' && type !== 'bodykick';
      const ev = { kind: 'land', s, type, n, landed, v: Math.round(v * 10) / 10, counter: !!counterOf, a: A.name, b: D.name, text: counterOf ? fightLine(rng, 'counter', { a: A.name, b: D.name }) : fightLine(rng, type, { a: A.name, b: D.name, n: landed }) };
      if (head && (isPower || type === 'headkick') && biggest > 1.1) bigShot(s, biggest * (type === 'combo' ? 1.2 : 1), type, ev);
      else if (type === 'body' && v > 3.2 && rng() < 0.12) { // body-shot knockdown
        D.kds++; rs[s].kd++; tot[s].kd++;
        ev.kind = 'kd'; ev.text += ' ' + D.name + ' takes a knee from the body shot!';
        if (disc === 'box' && rng() < clamp(0.25 + D.body / 120 - st(D, 'CRD') / 300, 0.05, 0.6)) { ev.kind = 'ko'; ev.count = 10; ev.up = false; end = { w: s, method: 'KO', r, t }; ev.text += ' Counted out!'; }
        else { ev.up = true; ev.count = 6 + Math.floor(rng() * 3); }
      }
      if (head && isPower && landed && !D.cut && rng() < 0.004) { D.cut = 1; push({ kind: 'cut', s, a: A.name, b: D.name, text: fightLine(rng, 'cut', { b: D.name }) }); }
      const big = ev.kind !== 'land' || ev.counter || biggest > 3.1 || (type === 'combo' && landed >= 4) || type === 'headkick' || type === 'spin';
      ev.hl = big; ev.big = ev.kind === 'ko' || ev.kind === 'tko' || ev.kind === 'kd';
      return push(ev);
    };
    // MMA on the ground.
    const ground = () => {
      const s = pos.g.top; const T = F[s], Bt = F[1 - s];
      rs[s].ctrl += 12; tot[s].ctrl += 12;
      const x = rng();
      // Bottom fighter: get up, sweep, or attack a submission from the guard.
      const escape = clamp(0.16 + (st(Bt, 'WRS') - st(T, 'WRS')) / 140 + (Bt.sta - T.sta) / 600, 0.05, 0.45);
      if (x < escape) {
        if (rng() < 0.3 && st(Bt, 'WRS') + st(Bt, 'SUB') > st(T, 'WRS') + st(T, 'SUB')) { pos = { g: { top: 1 - s, kind: 'top' } }; return push({ kind: 'sweep', s: 1 - s, a: Bt.name, b: T.name, text: fightLine(rng, 'sweep', { a: Bt.name }), hl: rng() < 0.5 }); }
        pos = { g: null }; return push({ kind: 'standup', s: 1 - s, a: Bt.name, b: T.name, text: fightLine(rng, 'standup', { a: Bt.name }), hl: false });
      }
      if (x < escape + 0.08 * (st(Bt, 'SUB') / 85) && st(Bt, 'SUB') > 70) return subTry(1 - s, 'bottom');
      // Top fighter: submission hunt or ground and pound.
      const subW = (st(T, 'SUB') - 65) / 320 + (T.style === 'grappler' ? 0.07 : 0) + (Bt.rocked ? 0.05 : 0);
      if (rng() < clamp(subW, 0.04, 0.4)) return subTry(s, rng() < 0.4 ? 'back' : 'top');
      // Ground and pound.
      const n = 2 + Math.floor(rng() * 5);
      const acc = clamp(0.5 + (st(T, 'WRS') - st(Bt, 'WRS')) / 200 + (Bt.rocked ? 0.15 : 0), 0.25, 0.85);
      let landed = 0; for (let i = 0; i < n; i++) if (rng() < acc) landed++;
      rs[s].thrown += n; rs[s].landed += landed; rs[s].power += landed; tot[s].thrown += n; tot[s].landed += landed; tot[s].power += landed;
      let v = 0; for (let i = 0; i < landed; i++) v += hurt(Bt, 0.6 * Math.pow(st(T, 'POW') / 80, 2) * (0.5 + rng()), true);
      rs[s].dmgDealt += v; T.sta -= 1.2 * (1.35 - st(T, 'CRD') / 100);
      const ev = { kind: 'gnp', s, n, landed, a: T.name, b: Bt.name, text: fightLine(rng, 'gnp', { a: T.name, b: Bt.name }), pos: { top: s, kind: pos.g.kind } };
      if ((Bt.rocked || Bt.dmg > 45) && landed >= 3 && rng() < clamp(0.1 + Bt.dmg / 260, 0.1, 0.55)) { ev.kind = 'tko'; end = { w: s, method: 'TKO', r, t }; ev.text += ' ' + fightLine(rng, 'tko', { a: T.name, b: Bt.name }); }
      ev.hl = ev.kind === 'tko' || landed >= 5; ev.big = ev.kind === 'tko';
      return push(ev);
    };
    const subTry = (s, from) => {
      const A = F[s], D = F[1 - s];
      const sname = pickOf(rng, SUB_NAMES[from]);
      rs[s].subs++; tot[s].subs++;
      const pTap = clamp(0.03 + (st(A, 'SUB') - st(D, 'SUB') * 0.55 - st(D, 'WRS') * 0.45) / 170 + fatigue(D) * 0.2 + D.dmg / 500 + (from === 'back' ? 0.06 : 0), 0.02, 0.45);
      const ev = { kind: 'subatt', s, sub: sname, from, a: A.name, b: D.name, pos: { top: from === 'bottom' ? 1 - s : s, kind: from === 'back' ? 'back' : 'top' } };
      A.sta -= 2.5 * (1.35 - st(A, 'CRD') / 100); D.sta -= 2;
      if (rng() < pTap) { ev.kind = 'sub'; end = { w: s, method: 'SUB', r, t, sub: sname }; ev.text = fightLine(rng, 'sub', { a: A.name, b: D.name, s: sname }); }
      else { ev.text = fightLine(rng, 'subatt', { a: A.name, b: D.name, s: sname }); if (from === 'bottom' && rng() < 0.5) pos = { g: null }; }
      ev.hl = true; ev.big = ev.kind === 'sub';
      return push(ev);
    };
    const takedown = (s) => {
      const A = F[s], D = F[1 - s];
      rs[s].tda++; tot[s].tda++;
      const p = clamp(0.36 + (st(A, 'WRS') - st(D, 'WRS')) / 95 + (D.rocked ? 0.2 : 0) - fatigue(A) * 0.2 + fatigue(D) * 0.15, 0.05, 0.88);
      A.sta -= 3 * (1.35 - st(A, 'CRD') / 100); D.sta -= 1.2;
      if (rng() < p) {
        rs[s].td++; tot[s].td++; pos = { g: { top: s, kind: rng() < 0.15 + (st(A, 'WRS') - st(D, 'WRS')) / 200 ? 'back' : 'top' } };
        return push({ kind: 'td', s, a: A.name, b: D.name, text: fightLine(rng, 'td', { a: A.name, b: D.name }), hl: rng() < 0.55 });
      }
      // A stuffed shot can leave the neck exposed.
      if (st(D, 'SUB') > 82 && rng() < 0.12) return subTry(1 - s, 'front');
      return push({ kind: 'tdstuff', s, a: A.name, b: D.name, text: fightLine(rng, 'tdstuff', { a: A.name, b: D.name }), hl: false });
    };
    while (!end) {
      const gap = pos.g ? 11 + rng() * 9 : (disc === 'box' ? 5 : 6) + rng() * 9;
      if (t + gap >= len) break;
      t += gap;
      F.forEach((f) => { if (f.rocked > 0) f.rocked -= 0.5; f.sta = Math.min(100, f.sta + 0.25); });
      if (pos.g) { ground(); continue; }
      const init = (f, o) => (st(f, 'SPD') * 0.45 + st(f, 'TEC') * 0.2 + 35 * FIGHT_STYLES[f.style].agg) * (0.55 + f.sta / 220) * (o.rocked ? 1.6 : 1) * (f.rocked ? 0.55 : 1);
      const ia = init(F[0], F[1]), ib = init(F[1], F[0]);
      const s = rng() < ia / (ia + ib) ? 0 : 1;
      if (disc === 'mma') {
        const tdW = FIGHT_STYLES[F[s].style].td * (st(F[s], 'WRS') / 85) * (F[1 - s].rocked ? 1.8 : 1) * (st(F[s], 'WRS') > st(F[1 - s], 'WRS') ? 1.3 : 0.7);
        if (rng() < tdW) { takedown(s); continue; }
      }
      strike(s);
    }
    // Round over (or the fight is). Judges score finished rounds.
    const roundPts = (k) => { const x = rs[k]; return x.landed * 0.5 + x.power * 0.7 + x.kd * 7 + x.rocked * 2.5 + x.dmgDealt * 0.35 + x.td * 2.2 + x.ctrl / 30 + x.subs * 1.5; };
    let judge = null;
    if (!end) {
      const P = [roundPts(0), roundPts(1)];
      judge = [0, 1, 2].map((j) => {
        const taste = 1 + (unit('judge', j, r, a.name, b.name) - 0.5) * 0.25;
        const pa = P[0] * (j === 1 ? taste : 1) + (rng() - 0.5) * 2.4, pb = P[1] * (j === 2 ? taste : 1) + (rng() - 0.5) * 2.4;
        if (Math.abs(pa - pb) < 0.25) return [10, 10];
        const wn = pa > pb ? 0 : 1; const sc = [0, 0]; sc[wn] = 10;
        const kdDiff = rs[wn].kd - rs[1 - wn].kd;
        sc[1 - wn] = kdDiff >= 2 ? 8 : kdDiff === 1 || Math.abs(pa - pb) > 22 ? 8 : 9;
        if (rs[1 - wn].kd > rs[wn].kd) sc[1 - wn] = 9;
        return sc;
      });
      push({ kind: 'bell', s: null, text: 'End of round ' + r + '.', judge, rs: rs.map((x) => ({ landed: x.landed, thrown: x.thrown, kd: x.kd, td: x.td })) });
    }
    rounds.push({ r, rs, judge, end: end ? { ...end, t: Math.round(end.t) } : null });
    if (end) break;
    // Between rounds: recover a little; the doctor and the corner have a look.
    F.forEach((f, k) => {
      f.sta = Math.min(100, f.sta + 16 * (st(f, 'CRD') / 90)); f.dmg *= 0.9; f.rocked = 0;
      if (f.cut) { f.cut++; f.dmg += 1.5; }
    });
    for (let k = 0; k < 2 && !end; k++) {
      const f = F[k];
      if (f.cut >= 5 && rng() < 0.04) end = { w: 1 - k, method: 'DOC', r, t: len };
      else if (f.dmg > 68 && disc === 'box' && rng() < 0.3) end = { w: 1 - k, method: 'RTD', r, t: len };
      if (end) { const ev = { kind: end.method === 'DOC' ? 'doc' : 'rtd', s: 1 - k, a: F[1 - k].name, b: f.name, text: end.method === 'DOC' ? 'The doctor stops it — ' + f.name + '’s cut is too bad to carry on.' : f.name + '’s corner throws in the towel!', hl: true, big: true }; ev.r = r; ev.t = len; events.push(ev); rev.push(ev); rounds[rounds.length - 1].end = { ...end }; }
    }
  }
  // Decision.
  let winner, method, cards = null, decision = null;
  if (end) { winner = end.w; method = end.method; }
  else {
    cards = [0, 1, 2].map((j) => [0, 1].map((k) => rounds.reduce((n, rd) => n + rd.judge[j][k], 0)));
    const votes = cards.map((c) => (c[0] > c[1] ? 0 : c[1] > c[0] ? 1 : null));
    const v0 = votes.filter((x) => x === 0).length, v1 = votes.filter((x) => x === 1).length;
    if (v0 >= 2 || v1 >= 2) { winner = v0 >= 2 ? 0 : 1; method = 'DEC'; const loserVotes = winner === 0 ? v1 : v0; decision = loserVotes === 1 ? 'SD' : (v0 + v1 === 3 ? 'UD' : 'MD'); }
    else { winner = null; method = 'DRAW'; decision = v0 === 1 && v1 === 1 ? 'SDRAW' : v0 + v1 === 1 ? 'MDRAW' : 'DRAW'; }
  }
  const last = rounds[rounds.length - 1];
  return {
    disc, R, len, winner, method, decision, cards, sub: end && end.sub, endRound: last.r, endTime: end ? Math.round(end.t) : len,
    rounds: rounds.map((rd) => ({ r: rd.r, judge: rd.judge, rs: rd.rs.map((x) => ({ landed: x.landed, thrown: x.thrown, power: x.power, kd: x.kd, td: x.td, tda: x.tda, ctrl: x.ctrl, subs: x.subs })) })),
    events, tot,
  };
}
const fighterView = (f) => (f ? { name: f.name, itemId: f.itemId, price: f.price, ovr: f.ovr, style: f.style, styleWord: f.styleWord, disc: f.disc } : null);
function boutLine(b) {
  if (!b.a || !b.b) return (b.a || b.b).name + ' wins by walkover.';
  if (b.winner == null) return b.a.name + ' and ' + b.b.name + ' fight to a ' + (b.decision === 'SDRAW' ? 'split draw' : b.decision === 'MDRAW' ? 'majority draw' : 'draw') + ' (' + b.cards.map((c) => c[0] + '–' + c[1]).join(', ') + ').';
  const W = b.winner === 0 ? b.a : b.b, L = b.winner === 0 ? b.b : b.a;
  if (b.method === 'DEC' && b.decision === 'SV') return W.name + ' beats ' + L.name + ' in a sudden-victory round after a drawn fight.';
  if (b.method === 'DEC') return W.name + ' beats ' + L.name + ' by ' + ({ UD: 'unanimous', SD: 'split', MD: 'majority' })[b.decision] + ' decision (' + b.cards.map((c) => Math.max(c[0], c[1]) + '–' + Math.min(c[0], c[1])).join(', ') + ').';
  return W.name + ' beats ' + L.name + ' by ' + (b.method === 'SUB' ? (b.sub || 'submission') : METHOD_WORD[b.method]) + ' in round ' + b.endRound + (b.method === 'RTD' || b.method === 'DOC' ? '' : ' (' + fightClock(b.endTime) + ')') + '.';
}
const boutShort = (b) => (b.winner == null ? (b.a && b.b ? 'Draw' : 'Walkover') : b.method === 'DEC' ? (b.decision === 'SV' ? 'Sudden victory' : b.decision + ' decision') : b.method === 'SUB' ? 'Sub (' + (b.sub || '') + ') R' + b.endRound : (b.method === 'RTD' || b.method === 'DOC' ? 'TKO' : b.method) + ' R' + b.endRound + (b.method === 'RTD' || b.method === 'DOC' ? '' : ' ' + fightClock(b.endTime)));

function simulateFightCard(d, A, B, key) {
  const rng = seeded(d.seed, 'fight', key, A.id, B.id);
  const sq = [fightSquad(d, A), fightSquad(d, B)];
  const slots = d.rules.slots;
  const bouts = []; const score = [0, 0]; const finishes = [0, 0];
  const n = slots.length;
  for (let k = 0; k < n; k++) {
    const a = sq[0][k], b = sq[1][k];
    if (!a && !b) continue;
    const disc = fightDisc(slots[k]) || (a || b).disc;
    const main = k === n - 1;
    const rules = { disc, rounds: disc === 'box' ? 12 : main ? 5 : 3 };
    let bout;
    if (!a || !b) bout = { disc, R: rules.rounds, winner: a ? 0 : 1, method: 'WO', rounds: [], events: [], tot: null, endRound: 0, endTime: 0 };
    else bout = fightBout(rng, a, b, rules);
    bout.k = k; bout.slot = slots[k]; bout.main = main; bout.a = fighterView(a); bout.b = fighterView(b);
    if (bout.winner != null) { score[bout.winner]++; if (bout.method !== 'DEC' && bout.method !== 'WO') finishes[bout.winner]++; }
    bout.score = [...score];
    bouts.push(bout);
  }
  let superFight = null; let how = 'bouts';
  if (score[0] === score[1]) {
    // Level card: a super fight between each team's most expensive fighter decides it.
    // Same sport on both sides: the discipline where the two teams spent the most on their top fighter.
    const best = (s, disc) => sq[s].filter((f) => f && (!disc || f.disc === disc)).sort((x, y) => y.price - x.price || y.ovr - x.ovr || (x.name < y.name ? -1 : 1))[0] || null;
    const pair = (disc) => { const x = best(0, disc), y = best(1, disc); return x && y ? { a: x, b: y, disc, cost: x.price + y.price } : null; };
    const opts = [pair('box'), pair('mma')].filter(Boolean).sort((x, y) => y.cost - x.cost || (x.disc === 'mma' ? -1 : 1));
    const pick = opts[0] || (best(0) && best(1) ? { a: best(0), b: best(1), disc: best(0).disc === 'mma' || best(1).disc === 'mma' ? 'mma' : 'box' } : null);
    const a = pick ? pick.a : best(0), b = pick ? pick.b : best(1);
    if (a && b) {
      const disc = pick.disc;
      let bout = fightBout(rng, a, b, { disc, rounds: 5 });
      if (bout.winner == null) {
        // Still level: one sudden-victory round scored on punches landed.
        const L = bout.tot.map((x) => x.landed + x.kd * 10 + x.td * 3);
        bout.winner = L[0] !== L[1] ? (L[0] > L[1] ? 0 : 1) : rng() < 0.5 ? 0 : 1;
        bout.method = 'DEC'; bout.decision = 'SV'; bout.sudden = true;
      }
      bout.k = n; bout.slot = 'Super fight'; bout.main = true; bout.superFight = true; bout.a = fighterView(a); bout.b = fighterView(b);
      score[bout.winner]++; bout.score = [...score];
      superFight = bout; bouts.push(bout); how = 'super';
    } else { const w = a ? 0 : 1; score[w]++; how = 'walkover'; }
  }
  const winner = score[0] > score[1] ? 0 : 1;
  return { v: 'card', kind: 'combat', bouts, score, finishes, winner, how, sudden: !!superFight, et: false, pens: null, events: [] };
}
