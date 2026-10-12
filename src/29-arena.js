/* ============================================================
   ANIMAL ARENA — the simulation for creature topics (fight style).
   Built on the hand-made stats in 24-stats.js:
   · Each round is fought in an arena (🌍 land, 🌊 water, ☁️ sky).
     Topics with Land/Sea/Air slots use those; otherwise the arena
     follows where the drafted animals live.
   · Each team sends its best remaining animal for that arena.
   · The fight runs move by move: speed + smarts decide who acts,
     power + weapons decide how hard it lands, defence absorbs,
     stamina drains, and fighting away from home turf hurts a lot.
     Fights end in a knockout, a retreat, exhaustion, or the
     judges' decision. Hidden health is never shown on screen.
   · More rounds won takes the matchup; ties go to sudden death.
   The same key always replays the same fight.
   ============================================================ */

const ARENAS = {
  L: { name: 'Land', emoji: '🌍', place: ['the savanna', 'the rocky canyon', 'the forest clearing', 'the dusty plain'] },
  W: { name: 'Water', emoji: '🌊', place: ['the open ocean', 'the river delta', 'the coral reef', 'the deep lagoon'] },
  A: { name: 'Sky', emoji: '☁️', place: ['the cliff tops', 'the stormy sky', 'the mountain peaks', 'the canopy'] },
};
const ARENA_OF_SLOT = { land: 'L', sea: 'W', water: 'W', air: 'A', sky: 'A' };
// How well an animal fights in an arena (1 = at home).
function turfFit(hab, arena) {
  const h = hab || 'L';
  if (h.includes(arena)) return 1;
  if (arena === 'L') return h.includes('A') ? 0.75 : 0.35; // birds can land; fish flop
  if (arena === 'W') return h.includes('A') ? 0.6 : 0.55; // divers vs. swimmers-by-force
  return 0.3; // sky: if you can't fly, you wait on the cliff edge
}
const fitWord = (f) => (f >= 1 ? 'at home' : f >= 0.7 ? 'a little out of place' : f >= 0.5 ? 'out of its element' : 'totally lost here');

const ARENA_MOVES = {
  L: ['charges at', 'lunges at', 'slams into', 'swipes at', 'pounces on', 'tackles'],
  W: ['rams', 'bites at', 'lashes out at', 'drags', 'circles and strikes', 'crashes into'],
  A: ['dives at', 'swoops on', 'rakes', 'strikes from above at', 'cuts across', 'buffets'],
};
const pickOf = (rng, a) => a[Math.floor(rng() * a.length)];

function arenaFighter(d, team, k, topic) {
  const x = team.team[k]; const item = x && d.items[x.itemId];
  if (!item) return null;
  const s = itemStats(topic, item) || { vals: [5, 5, 5, 5, 5, 5], hab: 'L' };
  const [P, S, D, W, T, M] = s.vals;
  return { slot: k, name: item.name, itemId: item.id, emoji: item.emoji || '', P, S, D, W, T, M, hab: s.hab || 'L', total: P + S + D + W + T + M };
}
// How good a fighter is in an arena (used to choose who to send).
const arenaScore = (f, arena) => (f.P * 1.3 + f.S + f.D + f.W * 1.2 + f.T * 0.7 + f.M * 0.6) * turfFit(f.hab, arena);

// One fight. Returns { w, how, events, dealt }.
function arenaFight(rng, a, b, arena) {
  const F = [a, b].map((f) => {
    const fit = turfFit(f.hab, arena);
    return { f, fit, form: 0.82 + rng() * 0.36, hp: 55 + f.D * 6 + f.P * 4 + f.T * 2, sta: 40 + f.T * 6, dealt: 0 }; // form: a good or bad day
  });
  const ev = [];
  const say = (type, by, text, extra) => ev.push({ type, by, text, ...(extra || {}) });
  [0, 1].forEach((i) => { if (F[i].fit < 0.7) say('turf', i, F[i].f.name + ' is ' + fitWord(F[i].fit) + ' in ' + ARENAS[arena].name.toLowerCase() + '.'); });
  const fat = (x) => 0.55 + 0.45 * Math.max(0, x.sta) / (40 + x.f.T * 6);
  let first = true;
  for (let tick = 0; tick < 16; tick++) {
    const init = F.map((x) => (x.f.S * x.fit + x.f.M * 0.5) * fat(x) * x.form + rng() * 7);
    const i = init[0] >= init[1] ? 0 : 1; const A = F[i], B = F[1 - i];
    // Ambush: a smart, quick animal can strike first before the other is ready.
    const ambush = first && A.f.M >= 6 && A.f.S * A.fit >= B.f.S * B.fit && rng() < 0.45;
    first = false;
    const hitP = clamp(0.56 + 0.045 * ((A.f.S * A.fit + A.f.M * 0.6) - (B.f.S * B.fit + B.f.D * 0.35)) + (ambush ? 0.25 : 0), 0.12, 0.93);
    A.sta -= 9 - A.f.T * 0.5; B.sta -= 2;
    if (rng() > hitP) {
      if (B.f.S * B.fit >= B.f.D) say('dodge', 1 - i, B.f.name + ' dodges ' + A.f.name + '!');
      else say('block', 1 - i, B.f.name + ' shrugs it off. ' + A.f.name + ' can’t get through.');
      continue;
    }
    const venom = A.f.W >= 8 && A.f.P <= 5;
    let dmg = (6 + A.f.P * 2.3 + A.f.W * 1.9) * A.fit * A.form * fat(A) * (0.6 + rng() * 0.8) - B.f.D * 1.3 * Math.min(1, B.fit + 0.3);
    dmg = Math.max(3, dmg);
    const crit = rng() < 0.1 + A.f.M * 0.008;
    if (crit) dmg *= 1.6; if (venom) dmg *= 1.25; if (ambush) dmg *= 1.3;
    B.hp -= dmg; A.dealt += dmg;
    const verb = venom ? 'lands a venomous strike on' : pickOf(rng, ARENA_MOVES[arena]);
    say(ambush ? 'ambush' : crit ? 'crit' : venom ? 'venom' : 'hit', i, (ambush ? 'AMBUSH! ' : '') + A.f.name + ' ' + verb + ' ' + B.f.name + (crit ? ' — huge hit!' : dmg > 30 ? ' — that hurt!' : '.'), { big: crit || dmg > 30 });
    if (B.hp <= 0) { say('ko', i, B.f.name + ' is down! ' + A.f.name + ' wins by knockout!'); return { w: i, how: 'knockout', events: ev, dealt: F.map((x) => Math.round(x.dealt)) }; }
    // A clever animal that's badly hurt gets out of there.
    const maxHp = 55 + B.f.D * 6 + B.f.P * 4 + B.f.T * 2;
    if (B.hp < maxHp * 0.3 && B.f.M >= 6 && rng() < 0.35) { say('retreat', 1 - i, B.f.name + ' has had enough and retreats. ' + A.f.name + ' takes the round!'); return { w: i, how: 'retreat', events: ev, dealt: F.map((x) => Math.round(x.dealt)) }; }
    if (F.every((x) => x.sta <= 0)) break;
    if (A.sta < 12 && rng() < 0.4) say('tired', i, A.f.name + ' is tiring…');
  }
  const w = F[0].dealt === F[1].dealt ? (rng() < 0.5 ? 0 : 1) : F[0].dealt > F[1].dealt ? 0 : 1;
  const tired = F.every((x) => x.sta <= 0);
  say('decision', w, (tired ? 'Both are exhausted. ' : 'Time! ') + 'The judges give it to ' + F[w].f.name + '.');
  return { w, how: tired ? 'exhaustion' : 'decision', events: ev, dealt: F.map((x) => Math.round(x.dealt)) };
}

function simulateArena(d, A, B, key) {
  const rng = seeded(d.seed, 'arena', key);
  const topic = d.topic; const slots = d.rules.slots;
  const pool = [A, B].map((t) => slots.map((_, k) => arenaFighter(d, t, k, topic)).filter(Boolean));
  const used = [new Set(), new Set()];
  // Arena for each round: slot names (Land/Sea/Air) when the topic has them, else where the animals live.
  const habCount = { L: 0, W: 0, A: 0 }; pool.flat().forEach((f) => f.hab.split('').forEach((h) => { habCount[h] = (habCount[h] || 0) + 1; }));
  const homeArena = Object.keys(habCount).sort((x, y) => habCount[y] - habCount[x])[0] || 'L';
  const rounds = []; const score = [0, 0];
  const view = (f) => (f ? { name: f.name, itemId: f.itemId, emoji: f.emoji, hab: f.hab } : null);
  const nRounds = Math.max(pool[0].length, pool[1].length);
  for (let r = 0; r < nRounds; r++) {
    const slotName = (slots[r] || '').trim().toLowerCase();
    let arena = ARENA_OF_SLOT[slotName];
    if (!arena) {
      // FLEX / Pick slots: mostly the topic's home arena, sometimes wherever the remaining animals suit best.
      const left = pool.flatMap((p, s) => p.filter((f) => !used[s].has(f.slot)));
      const c = { L: 0, W: 0, A: 0 }; left.forEach((f) => f.hab.split('').forEach((h) => { c[h]++; }));
      arena = rng() < 0.7 ? homeArena : Object.keys(c).sort((x, y) => c[y] - c[x])[0] || homeArena;
    }
    const pick = (s) => pool[s].filter((f) => !used[s].has(f.slot)).sort((x, y) => arenaScore(y, arena) - arenaScore(x, arena) || x.slot - y.slot)[0] || null;
    const fa = pick(0), fb = pick(1);
    if (!fa && !fb) break;
    const place = pickOf(rng, ARENAS[arena].place);
    if (!fa || !fb) {
      const w = fa ? 0 : 1; const f = fa || fb; used[w].add(f.slot); score[w]++;
      rounds.push({ arena, place, a: view(fa), b: view(fb), w, how: 'walkover', events: [{ type: 'ko', by: w, text: 'Nobody steps up to face ' + f.name + '. Walkover!' }], score: [...score] });
      continue;
    }
    used[0].add(fa.slot); used[1].add(fb.slot);
    const res = arenaFight(rng, fa, fb, arena);
    score[res.w]++;
    rounds.push({ arena, place, a: view(fa), b: view(fb), w: res.w, how: res.how, events: res.events, dealt: res.dealt, score: [...score], upset: (res.w === 0 ? arenaScore(fa, arena) < arenaScore(fb, arena) * 0.8 : arenaScore(fb, arena) < arenaScore(fa, arena) * 0.8) });
  }
  let sudden = false;
  if (score[0] === score[1]) {
    sudden = true;
    const best = (s) => pool[s].slice().sort((x, y) => y.total - x.total)[0];
    const fa = best(0), fb = best(1);
    if (!fa || !fb) return { v: 'arena', kind: 'fight', rounds, score, winner: fa ? 0 : 1, sudden: false, et: false, pens: null, events: [] };
    const arena = homeArena; const res = arenaFight(rng, fa, fb, arena);
    score[res.w]++;
    rounds.push({ arena, place: pickOf(rng, ARENAS[arena].place), sudden: true, a: view(fa), b: view(fb), w: res.w, how: res.how, events: res.events, dealt: res.dealt, score: [...score] });
  }
  return { v: 'arena', kind: 'fight', rounds, score, winner: score[0] > score[1] ? 0 : 1, sudden, et: false, pens: null, events: [] };
}
