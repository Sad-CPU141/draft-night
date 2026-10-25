/* ============================================================
   ROYAL RUMBLE — the event for WWE Superstars.
   · 20 entrants: both teams' drafted superstars plus undrafted ones
     from the topic, entering one at a time (a new entrant every
     minute or so, in a random order). Eliminations only happen over
     the top rope, to the floor.
   · Every few seconds: strikes, signature moves and finishers (their
     real ones), team-mates double-teaming, elimination attempts —
     some succeed, some are saved at the last second by hanging on to
     the ropes — and the odd betrayal. Power, agility, technique,
     stamina, the crowd and time spent in the ring all matter.
   · Rumble points: 10 for the winner, then 7, 5, 4, 3, 2, 1 for the
     next places, plus 1 for every elimination. The team with more
     points wins the matchup (level: the team whose superstar lasted
     longest). Undrafted entrants score for nobody.
   · It's sports entertainment and so is this: superstar numbers are
     Draft Night estimates (Prime), never official.
   ============================================================ */
const RUMBLE_FINISHERS = {
  'the rock': 'Rock Bottom', 'john cena': 'Attitude Adjustment', 'stone cold steve austin': 'Stone Cold Stunner', 'the undertaker': 'Tombstone Piledriver', 'hulk hogan': 'Leg Drop', 'randy orton': 'RKO', 'triple h': 'Pedigree', 'shawn michaels': 'Sweet Chin Music', 'roman reigns': 'Spear', 'rey mysterio': '619', 'brock lesnar': 'F-5', 'cm punk': 'GTS', 'cody rhodes': 'Cross Rhodes', 'seth rollins': 'Stomp', 'becky lynch': 'Manhandle Slam', 'charlotte flair': 'Figure-Eight', 'rhea ripley': 'Riptide', 'bianca belair': 'KOD', 'ric flair': 'Figure-Four Leglock', 'randy savage': 'Flying Elbow Drop', 'bret hart': 'Sharpshooter', 'edge': 'Spear', 'kane': 'Chokeslam', 'batista': 'Batista Bomb', 'kurt angle': 'Angle Slam', 'eddie guerrero': 'Frog Splash', 'gunther': 'Powerbomb', 'kofi kingston': 'Trouble in Paradise', 'trish stratus': 'Chick Kick', 'drew mcintyre': 'Claymore',
  'mick foley': 'Mandible Claw', 'chris jericho': 'Codebreaker', 'jeff hardy': 'Swanton Bomb', 'matt hardy': 'Twist of Fate', 'big show': 'Chokeslam', 'mark henry': 'World’s Strongest Slam', 'booker t': 'Scissors Kick', 'goldberg': 'Jackhammer', 'sting': 'Scorpion Death Drop', 'jake roberts': 'DDT', 'ultimate warrior': 'Gorilla Press Splash', 'dusty rhodes': 'Bionic Elbow', 'roddy piper': 'Sleeper Hold', 'razor ramon': 'Razor’s Edge', 'kevin nash': 'Jackknife Powerbomb', 'the miz': 'Skull-Crushing Finale', 'dolph ziggler': 'Zig Zag', 'aj styles': 'Phenomenal Forearm', 'sami zayn': 'Helluva Kick', 'kevin owens': 'Stunner', 'bray wyatt': 'Sister Abigail', 'jey uso': 'Uso Splash', 'jimmy uso': 'Uso Splash', 'solo sikoa': 'Samoan Spike', 'la knight': 'BFT', 'damian priest': 'South of Heaven', 'bobby lashley': 'Spear', 'braun strowman': 'Running Powerslam', 'finn bálor': 'Coup de Grâce', 'bayley': 'Rose Plant', 'asuka': 'Asuka Lock', 'liv morgan': 'Oblivion', 'iyo sky': 'Over the Moonsault', 'tiffany stratton': 'Prettiest Moonsault Ever', 'lita': 'Moonsault', 'bron breakker': 'Spear', 'dominik mysterio': 'Frog Splash', 'big e': 'Big Ending',
};
const RUMBLE_POWER = /Lesnar|Hogan|André|Big Show|Mark Henry|Strowman|Batista|Goldberg|Kane|Undertaker|Lashley|Breakker|Warrior|Reigns|Belair|Ripley|Sikoa|Nash|Chyna|Gunther|Big E|McIntyre|Rock|Cena/;
const RUMBLE_FLYER = /Mysterio|Jeff Hardy|Kofi|Guerrero|Iyo|Lita|Tiffany|Liv Morgan|Shawn|Rollins|AJ Styles|Bálor|Savage|Ziggler|Trish|Edge/;
const RUMBLE_TECH = /Bret|Angle|Gunther|Shawn|Triple H|Ric Flair|Punk|Jericho|Becky|Charlotte|Asuka|Bayley|Sami|Owens|Cody/;
const RUMBLE_PROFILE = { 'the rock': 97, 'stone cold steve austin': 97, 'john cena': 96, 'the undertaker': 96, 'hulk hogan': 94, 'shawn michaels': 96, 'triple h': 94, 'randy orton': 93, 'roman reigns': 94, 'brock lesnar': 95, 'cm punk': 92, 'cody rhodes': 92, 'seth rollins': 91, 'rey mysterio': 91, 'becky lynch': 91, 'charlotte flair': 91, 'rhea ripley': 90, 'bianca belair': 89, 'ric flair': 94, 'randy savage': 93, 'andré the giant': 93, 'bret hart': 94, 'edge': 92, 'kane': 90, 'batista': 90, 'kurt angle': 93, 'eddie guerrero': 92, 'gunther': 91, 'kofi kingston': 87, 'trish stratus': 89, 'drew mcintyre': 90, 'logan paul': 85 };
const RUMBLE_ATTRS = ['STR', 'AGI', 'TEC', 'STA', 'CHA'];
const RUMBLE_ATTR_NAMES = { STR: 'Power', AGI: 'Agility', TEC: 'Technique', STA: 'Stamina', CHA: 'Crowd' };
function rumbleRating(item) {
  const n = String(item.name || ''); const fixed = validRating(item.rating);
  const prof = RUMBLE_PROFILE[n.toLowerCase()];
  const ovr = fixed ? clamp(Math.round(+item.rating), 1, 99) : prof || clamp(Math.round(78 + itemFame(item) * 16 + (unit('wwo', n) - 0.5) * 6), 72, 93);
  const j = (k) => (unit('wwa', n, k) - 0.5) * 6;
  const pw = RUMBLE_POWER.test(n), fl = RUMBLE_FLYER.test(n), te = RUMBLE_TECH.test(n);
  const attrs = { STR: ovr + (pw ? 7 : fl ? -8 : 0) + j(1), AGI: ovr + (fl ? 8 : pw ? -7 : 0) + j(2), TEC: ovr + (te ? 7 : pw ? -3 : 0) + j(3), STA: ovr + j(4), CHA: ovr + (/Rock|Austin|Cena|Hogan|Savage|Flair|Piper|Dusty|Cody|Punk|Knight|Miz|Jericho|Becky/.test(n) ? 6 : 0) + j(5) };
  Object.keys(attrs).forEach((k) => { attrs[k] = clamp(Math.round(attrs[k]), 40, 99); });
  return { ovr, attrs, style: pw ? 'Powerhouse' : fl ? 'High-flyer' : te ? 'Technician' : 'Brawler', finisher: RUMBLE_FINISHERS[n.toLowerCase()] || null, estimated: !fixed };
}
const RUMBLE_PTS = [10, 7, 5, 4, 3, 2, 1];
const RUMBLE_MOVES = { Powerhouse: ['a huge clothesline', 'a spinebuster', 'a gorilla press', 'a belly-to-belly suplex'], 'High-flyer': ['a springboard dropkick', 'a hurricanrana', 'a crossbody', 'a superkick'], Technician: ['a German suplex', 'a crossface', 'a backbreaker', 'a neckbreaker'], Brawler: ['a flurry of punches', 'a DDT', 'a running knee', 'a spear'] };

function simulateRumble(d, A, B, key) {
  const rng = seeded(d.seed, 'rumble', key, A.id, B.id);
  const drafted = new Set(); (d.managers || []).forEach((m) => m.team.forEach((x) => { if (x) drafted.add(x.itemId); }));
  [A, B].forEach((m) => m.team.forEach((x) => { if (x) drafted.add(x.itemId); }));
  const ents = [];
  [A, B].forEach((m, team) => m.team.forEach((x) => { const it = x && d.items[x.itemId]; if (it) ents.push({ name: it.name, itemId: it.id, team, price: x.price || 0, desc: it.desc || '', ...rumbleRating(it) }); }));
  if (!ents.some((e) => e.team === 0) || !ents.some((e) => e.team === 1)) { const w = ents.some((e) => e.team === 0) ? 0 : 1; return { v: 'rumble', kind: 'wwe', forfeit: true, entrants: [], plays: [], score: w === 0 ? [1, 0] : [0, 1], winner: w, places: [], et: false, pens: null, sudden: false, events: [] }; }
  const pool = Object.values(d.items).filter((it) => !drafted.has(it.id)).sort((x, y) => unit('rf', d.seed, key, x.name) - unit('rf', d.seed, key, y.name)).slice(0, Math.max(0, 20 - ents.length));
  pool.forEach((it) => ents.push({ name: it.name, itemId: it.id, team: null, price: 0, desc: it.desc || '', ...rumbleRating(it) }));
  // Entry order: shuffled, but drafted superstars are spread through the field.
  const order = ents.map((e, i) => ({ i, k: unit('ro', d.seed, key, e.name) + (e.team != null ? 0 : 0) })).sort((x, y) => x.k - y.k).map((x) => x.i);
  const W = ents.map((e, i) => ({ ...e, i, n: order.indexOf(i) + 1, dmg: 0, sta: 100, mom: 0, inAt: null, outAt: null, elims: 0, by: null }));
  const ev = []; let t = 0; const ring = []; let nextIn = 0; const out = [];
  const push = (e) => { e.t = Math.round(t); e.i2 = ev.length; ev.push(e); return e; };
  const enter = () => { const w = W[order[nextIn++]]; w.inAt = t; ring.push(w); push({ kind: 'enter', w: w.i, n: w.n, text: '#' + w.n + ': ' + w.name + (w.desc ? ' — ' + w.desc : '') + '!', hl: w.team != null || nextIn <= 2 || /Rock|Austin|Undertaker|Cena|Hogan/.test(w.name) }); };
  enter(); enter();
  let guard = 0;
  while ((ring.length > 1 || nextIn < W.length) && guard++ < 2000) {
    t += 8 + rng() * 14;
    if (nextIn < W.length && t >= nextIn * 62 - 62) { enter(); continue; }
    if (ring.length < 2) { if (nextIn < W.length) { t = Math.max(t, nextIn * 62 - 62); enter(); } continue; }
    ring.forEach((w) => { w.sta = Math.max(20, w.sta - 0.9 * (1.4 - w.attrs.STA / 100)); w.mom *= 0.92; });
    // Who's doing what?
    const atk = weighted(rng, ring, (w) => (w.attrs.STR * 0.4 + w.attrs.AGI * 0.3 + w.attrs.TEC * 0.3) * (0.5 + w.sta / 200) * (1 + w.mom) * (w.team != null ? 1.15 : 1));
    // Team-mates mostly leave each other alone.
    const foes = ring.filter((w) => w !== atk && (atk.team == null || w.team !== atk.team));
    const betray = foes.length === 0 || (atk.team != null && rng() < 0.03);
    const targets = betray ? ring.filter((w) => w !== atk) : foes;
    if (!targets.length) continue;
    const tgt = weighted(rng, targets, (w) => 1 + w.dmg / 40 + (w.team != null ? 0.4 : 0));
    const mate = atk.team != null ? ring.find((w) => w !== atk && w.team === atk.team && w !== tgt) : null;
    const r = rng();
    if (r < 0.24 + (ring.length <= 3 ? 0.1 : 0)) {
      // Elimination attempt.
      const p = clamp(0.3 + (atk.attrs.STR - tgt.attrs.STR) / 160 + tgt.dmg / 140 - (tgt.attrs.AGI - 80) / 260 + atk.mom * 0.2 + (mate && rng() < 0.4 ? 0.15 : 0) - (ring.length <= 2 ? 0.08 : 0), 0.08, 0.82);
      if (rng() < p) {
        tgt.outAt = t; tgt.by = atk.i; atk.elims++; ring.splice(ring.indexOf(tgt), 1); out.push(tgt);
        const dbl = mate && rng() < 0.3;
        push({ kind: 'elim', w: atk.i, v: tgt.i, mate: dbl ? mate.i : null, betray: betray && atk.team != null && atk.team === tgt.team, text: (betray && atk.team != null && atk.team === tgt.team ? 'BETRAYAL! ' : '') + (dbl ? atk.name + ' and ' + mate.name + ' team up to throw ' + tgt.name + ' out!' : atk.name + ' eliminates ' + tgt.name + '!') + ' (' + ring.length + ' left in the ring' + (nextIn < W.length ? ', ' + (W.length - nextIn) + ' still to come' : '') + ')', hl: atk.team != null || tgt.team != null || ring.length <= 4 });
      } else {
        push({ kind: 'save', w: atk.i, v: tgt.i, text: tgt.name + ' hangs on to the ropes! ' + (rng() < 0.5 ? 'Feet almost touched the floor!' : 'Somehow still in it!'), hl: (tgt.team != null && rng() < 0.4) || ring.length <= 3 });
        if (rng() < 0.12 + (tgt.attrs.AGI - 85) / 200) { atk.outAt = t; atk.by = tgt.i; tgt.elims++; ring.splice(ring.indexOf(atk), 1); out.push(atk); push({ kind: 'elim', w: tgt.i, v: atk.i, counter: true, text: 'REVERSAL! ' + tgt.name + ' skins the cat and dumps ' + atk.name + ' out!', hl: true }); }
      }
      continue;
    }
    if (r < 0.34 && atk.finisher) { tgt.dmg += 22; atk.mom += 0.5; push({ kind: 'finisher', w: atk.i, v: tgt.i, move: atk.finisher, text: atk.name + ' hits the ' + atk.finisher + ' on ' + tgt.name + '!', hl: atk.team != null && rng() < 0.55 }); continue; }
    if (r < 0.4 && mate) { tgt.dmg += 12; push({ kind: 'double', w: atk.i, v: tgt.i, mate: mate.i, text: atk.name + ' and ' + mate.name + ' double-team ' + tgt.name + '.', hl: false }); continue; }
    tgt.dmg += 5 + rng() * 6; atk.mom += 0.15;
    push({ kind: 'move', w: atk.i, v: tgt.i, text: atk.name + ' hits ' + pickOf(rng, RUMBLE_MOVES[atk.style]) + ' on ' + tgt.name + '.', hl: false });
  }
  const winnerW = ring[0] || W[order[order.length - 1]];
  winnerW.outAt = null;
  const places = [winnerW, ...out.slice().reverse()];
  push({ kind: 'win', w: winnerW.i, text: winnerW.name + ' WINS THE ROYAL RUMBLE!', hl: true, big: true });
  const score = [0, 0];
  places.forEach((w, k) => { if (w.team != null) score[w.team] += RUMBLE_PTS[k] || 0; });
  W.forEach((w) => { if (w.team != null) score[w.team] += w.elims; });
  let winner;
  if (score[0] !== score[1]) winner = score[0] > score[1] ? 0 : 1;
  else winner = (places.find((w) => w.team != null) || {}).team || 0;
  const iron = W.slice().sort((x, y) => ((y.outAt == null ? t : y.outAt) - y.inAt) - ((x.outAt == null ? t : x.outAt) - x.inAt))[0];
  return { v: 'rumble', kind: 'wwe', entrants: W.map((w) => ({ name: w.name, itemId: w.itemId, team: w.team, n: w.n, finisher: w.finisher, style: w.style, ovr: w.ovr, price: w.price, inAt: Math.round(w.inAt), outAt: w.outAt == null ? null : Math.round(w.outAt), elims: w.elims, by: w.by })), places: places.map((w) => w.i), plays: ev, score, winner, winnerName: winnerW.name, iron: iron.i, end: Math.round(t), et: false, pens: null, sudden: false, events: [] };
}
const rumbleClock = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
