/* ============================================================
   FUN BATTLES — the "Matches" finale for non-football topics.
   Two teams face off slot by slot (Land v Land, Power 1 v Power 1…).
   There's no real data on who'd win, so each duel is a weighted coin
   flip: the item the room paid more for has the edge (at most 78%),
   and luck does the rest. Ties go to a sudden-death duel between each
   team's most expensive pick. Results are recorded once and replay
   exactly; screens say plainly that it's just for fun.
   ============================================================ */

const BATTLE_KINDS = {
  fight: {
    name: 'Battle', start: 'Start the battle', emoji: '⚔️', round: 'Round',
    win: ['{w} overpowers {l}!', '{w} pins {l} down!', '{l} never saw {w} coming.', '{w} outlasts {l} in a long scrap.', '{w} sends {l} running!', 'A brutal clash — {w} comes out on top.'],
    upset: ['UPSET! {w} somehow beats {l}!', 'Nobody expected that: {w} takes down {l}!'],
    noshow: ['{w} wins by walkover — nobody turned up to face it.'],
  },
  powers: {
    name: 'Power Clash', start: 'Start the clash', emoji: '💥', round: 'Clash',
    win: ['{w} cancels out {l}!', '{w} is just too much for {l}.', '{l} fizzles out against {w}.', '{w} lands the knockout blow!', 'Sparks fly — {w} wins the clash.'],
    upset: ['WHAT?! {w} beats {l}!', 'Plot twist: {w} outsmarts {l}!'],
    noshow: ['{w} wins unopposed.'],
  },
  weird: {
    name: 'Useless Power Showdown', start: 'Start the showdown', emoji: '🤡', round: 'Showdown',
    win: ['{w} is slightly less useless than {l}.', '{l} trips over itself; {w} wins by default-ish.', 'The crowd groans… {w} edges it.', '{w} somehow helps. {l} does not.'],
    upset: ['Against all logic, {w} wins!', 'Chaos! {w} beats {l}!'],
    noshow: ['{w} wins because nobody else showed up.'],
  },
  survival: {
    name: 'Survival Showdown', start: 'Start the showdown', emoji: '🧟', round: 'Night',
    win: ['{w} keeps the team alive. {l} doesn’t help.', '{w} saves the night; {l} gets left behind.', 'When it mattered, {w} beat {l}.', '{w} gets them through. {l} breaks.'],
    upset: ['Who knew? {w} beats {l} when it counts!', 'Surprise hero: {w}!'],
    noshow: ['{w} wins the night — the other team had nothing.'],
  },
  cute: {
    name: 'Cuteness Contest', start: 'Start the contest', emoji: '🥰', round: 'Round',
    win: ['The crowd melts for {w}!', '{w} wins the aww-off against {l}.', '{l} is adorable, but {w} is MORE adorable.', 'Tiny paws, big win: {w}!'],
    upset: ['Underdog cuteness! {w} steals it from {l}!', 'Nobody saw that coming: {w} wins the crowd!'],
    noshow: ['{w} wins with no competition.'],
  },
};
const battleKindId = (topic) => { if (!topic || topic.layout === 'pitch') return null; const k = topic.battle || STARTER_BATTLE[topic.id]; return BATTLE_KINDS[k] ? k : null; };
const battleKind = (topic) => { const k = battleKindId(topic); return k ? BATTLE_KINDS[k] : null; };
const hasBattle = (topic) => !!battleKindId(topic);
// The full simulation for a topic's style (step by step these replace the simple duel).
function simulateFor(d, A, B, key) {
  const k = battleKindId(d.topic);
  if (k === 'fight') return simulateArena(d, A, B, key);
  if (k === 'survival') return simulateSurvival(d, A, B, key);
  return simulateBattle(d, A, B, key);
}
// One line for the result screen.
function simWhy(w, mt) {
  if (mt.v === 'survival') { const ws = mt.score[mt.winner], ls = mt.score[1 - mt.winner]; const f = mt.final[mt.winner]; return w.name + (f.rescued ? ' got rescued' : ' survived ' + ws + ' day' + (ws === 1 ? '' : 's')) + (ws !== ls ? ' (the others lasted ' + ls + ')' : mt.how === 'rescue' ? ', and got rescued first' : mt.how === 'shape' ? ', level on days but in better shape' : ' and won the last night') + '.'; }
  return w.name + ' won the ' + ((BATTLE_KINDS[mt.kind] || BATTLE_KINDS.fight).name).toLowerCase() + ' ' + mt.score[mt.winner] + '–' + mt.score[1 - mt.winner] + (mt.sudden ? ' in sudden death' : '') + '.';
}
const isSimResult = (mt) => !!mt && (mt.v === 'battle' || mt.v === 'arena' || mt.v === 'survival' || mt.v === 'mission' || mt.v === 'show');

// One duel: the pricier pick has the edge, capped so luck always matters.
function battleDuel(rng, kind, a, b, maxP) {
  const fill = (lines, w, l) => lines[Math.floor(rng() * lines.length)].replace('{w}', w).replace('{l}', l);
  if (!a || !b) { const w = a ? 0 : 1; const x = a || b; return { w, edge: null, upset: false, line: fill(kind.noshow, x.item.name, '') }; }
  const edge = clamp(0.5 + (0.35 * (a.price - b.price)) / Math.max(1, maxP), 0.22, 0.78);
  const w = rng() < edge ? 0 : 1;
  const upset = (w === 0 && edge < 0.45) || (w === 1 && edge > 0.55);
  const W = w === 0 ? a : b, L = w === 0 ? b : a;
  return { w, edge, upset, line: fill(upset ? kind.upset : kind.win, W.item.name, L.item.name) };
}
function simulateBattle(d, A, B, key) {
  const kindId = battleKindId(d.topic) || 'fight'; const kind = BATTLE_KINDS[kindId];
  const rng = seeded(d.seed, 'battle', key);
  const slots = d.rules.slots;
  const entry = (t, k) => { const x = t.team[k]; const item = x && d.items[x.itemId]; return item ? { item, price: x.price || 0 } : null; };
  const maxP = Math.max(1, ...[A, B].flatMap((t) => t.team.filter(Boolean).map((x) => x.price || 0)));
  const duels = []; const score = [0, 0];
  const view = (e) => (e ? { name: e.item.name, emoji: e.item.emoji || '', price: e.price, itemId: e.item.id } : null);
  slots.forEach((slot, k) => {
    const a = entry(A, k), b = entry(B, k);
    if (!a && !b) return;
    const r = battleDuel(rng, kind, a, b, maxP);
    score[r.w]++;
    duels.push({ slot, a: view(a), b: view(b), w: r.w, edge: r.edge, upset: r.upset, line: r.line, score: [...score] });
  });
  let sudden = null;
  if (score[0] === score[1]) {
    const best = (t) => t.team.map((_, k) => entry(t, k)).filter(Boolean).sort((x, y) => y.price - x.price || (x.item.name < y.item.name ? -1 : 1))[0] || null;
    const a = best(A), b = best(B);
    const r = battleDuel(rng, kind, a, b, maxP);
    score[r.w]++;
    sudden = { slot: 'Sudden death', a: view(a), b: view(b), w: r.w, edge: r.edge, upset: r.upset, line: r.line, score: [...score] };
    duels.push(sudden);
  }
  return { v: 'battle', kind: kindId, duels, score, winner: score[0] > score[1] ? 0 : 1, sudden: !!sudden, et: false, pens: null, events: [] };
}
const battleRulesLine = (topic) => { const k = battleKind(topic); return k ? k.emoji + ' ' + k.name + 's: teams face off slot by slot. The pick the room paid more for has the edge (never more than 78%), and luck does the rest. Just for fun — not a real prediction.' : ''; };
