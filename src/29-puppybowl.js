/* ============================================================
   PUPPY BOWL — the match for cute topics (Cutest Animals, Pets,
   Dog Breeds, Cat Breeds). It runs on the football engine: same
   pitch, clock, goals and commentary. What's different:
   · Squads come from the cute stats (Draft Night estimates):
     Fluffy → defending & goalkeeping (hard to get past),
     Tiny → pace & dribbling (slips through legs),
     Funny → shooting chaos, Charm → passing & crowd energy.
     The fluffiest animal goes in goal, the best shooter up front.
   · Cute moments, rolled from those stats BEFORE the match, change
     each team's expected goals, then are pinned to the moment they
     caused (a goal, a chance, a conceded goal). They can help or
     hurt: a butterfly can cost a team its best chance.
   ============================================================ */
// Items without their own emoji get one from their name (or the topic: dogs 🐶, cats 🐱).
const CUTE_EMOJI = [['polar bear', '🐻‍❄️'], ['red panda', '🦊'], ['panda', '🐼'], ['fox', '🦊'], ['koala', '🐨'], ['sloth', '🦥'], ['otter', '🦦'], ['seal', '🦭'], ['sea lion', '🦭'], ['penguin', '🐧'], ['puffin', '🐧'], ['owl', '🦉'],
  ['bunny', '🐰'], ['rabbit', '🐰'], ['hamster', '🐹'], ['guinea pig', '🐹'], ['chinchilla', '🐭'], ['mouse', '🐭'], ['dormouse', '🐭'], ['jerboa', '🐭'], ['pika', '🐭'], ['hedgehog', '🦔'], ['chipmunk', '🐿️'], ['marmot', '🐿️'], ['squirrel', '🐿️'],
  ['lion', '🦁'], ['tiger', '🐯'], ['leopard', '🐆'], ['cat', '🐱'], ['kitten', '🐱'], ['puppy', '🐶'], ['dog', '🐶'], ['corgi', '🐶'], ['pug', '🐶'], ['samoyed', '🐶'], ['pomeranian', '🐶'], ['shiba', '🐶'], ['bulldog', '🐶'],
  ['elephant', '🐘'], ['hippo', '🦛'], ['giraffe', '🦒'], ['goat', '🐐'], ['lamb', '🐑'], ['alpaca', '🦙'], ['piglet', '🐷'], ['pig', '🐷'], ['calf', '🐮'], ['foal', '🐴'], ['pony', '🐴'], ['horse', '🐴'], ['fawn', '🦌'],
  ['duck', '🐥'], ['chick', '🐥'], ['tit', '🐦'], ['parrot', '🦜'], ['budgie', '🦜'], ['cockatiel', '🦜'], ['canary', '🐤'], ['octopus', '🐙'], ['beluga', '🐳'], ['whale', '🐳'], ['axolotl', '🦎'], ['gecko', '🦎'], ['dragon', '🦎'],
  ['capybara', '🦫'], ['meerkat', '🦦'], ['ermine', '🦦'], ['ferret', '🦦'], ['marmoset', '🐒'], ['loris', '🐒'], ['sugar glider', '🐿️'], ['wombat', '🐨'], ['turtle', '🐢'], ['snake', '🐍'], ['fish', '🐟'], ['koi', '🐟'], ['betta', '🐟'], ['crab', '🦀'], ['tarantula', '🕷️'], ['rat', '🐀'], ['gerbil', '🐭'], ['chicken', '🐔'], ['bear', '🐻']];
function cuteEmoji(item, topic) {
  if (item.emoji) return item.emoji;
  const n = String(item.name || '').toLowerCase();
  const hit = CUTE_EMOJI.find(([k]) => n.includes(k));
  if (hit) return hit[1];
  return topic && topic.id === 't-dogbreeds' ? '🐶' : topic && topic.id === 't-catbreeds' ? '🐱' : '🐾';
}
const isPuppyBowl = (topic) => !!topic && topic.layout !== 'pitch' && battleKindId(topic) === 'cute';
function puppyRow(d, t, slot) {
  const item = d.items[t.itemId];
  const s = itemStats(d.topic, item) || { vals: [5, 5, 5, 5] };
  const [F, T, U, C] = s.vals;
  const a = (v) => clamp(Math.round(v), 20, 99);
  const attrs = { PAC: a(38 + T * 4.2 + U * 1.6), SHO: a(36 + U * 3.6 + C * 1.8 + T), PAS: a(38 + C * 3.6 + F * 1.2), DRI: a(36 + T * 3.8 + C * 1.6), DEF: a(32 + F * 4.6 + C), PHY: a(40 + F * 3.4 - T * 1.2) };
  const ovr = a((attrs.PAC + attrs.SHO + attrs.PAS + attrs.DRI + attrs.DEF + attrs.PHY) / 6);
  return { name: item.name, itemId: item.id, emoji: cuteEmoji(item, d.topic), price: t.price || 0, cute: { F, T, U, C }, r: { ovr, attrs, estimated: true }, role: 'MID' };
}
function puppySquad(d, m) {
  const rows = m.team.map((t, i) => (t && d.items[t.itemId] ? puppyRow(d, t, d.rules.slots[i]) : null)).filter(Boolean);
  if (!rows.length) return rows;
  const by = (k) => rows.slice().sort((x, y) => y.r.attrs[k] - x.r.attrs[k] || (x.name < y.name ? -1 : 1));
  const gk = by('DEF')[0]; gk.role = 'GK';
  const fwd = by('SHO').find((p) => p !== gk); if (fwd) fwd.role = 'FWD';
  const def = by('DEF').find((p) => p.role === 'MID'); if (def && rows.length >= 4) def.role = 'DEF';
  return rows;
}
// The cute moments. Each has a cause (a stat), an effect on expected goals, and a moment it's pinned to.
const PUPPY_MOMENTS = {
  zoomies: { emoji: '💨', banner: 'ZOOMIES!', stat: 'T', good: true, xg: 0.35, line: '{p} gets the zoomies and tears down the wing!' },
  steal: { emoji: '🐾', banner: 'SNEAKY!', stat: 'T', good: true, xg: 0.2, line: 'Tiny {p} slips between legs and steals the ball!' },
  bounce: { emoji: '🎾', banner: 'LUCKY BOUNCE!', stat: 'U', good: true, xg: 0.25, line: 'It bounces off {p}’s bottom… towards goal!' },
  crowd: { emoji: '🥰', banner: 'AWWW!', stat: 'C', good: true, xg: 0.15, line: 'The crowd melts for {p} — the team is buzzing!' },
  butterfly: { emoji: '🦋', banner: 'BUTTERFLY!', stat: 'U', good: false, xg: -0.3, line: '{p} spots a butterfly and forgets about the ball…' },
  nap: { emoji: '💤', banner: 'NAP TIME!', stat: 'F', good: false, xg: 0, oppXg: 0.4, line: 'Keeper {p} curls up for a nap…' },
};
function rollPuppyMoments(rng, sq) {
  const out = [];
  [0, 1].forEach((i) => {
    const team = sq[i]; if (!team.length) return;
    const best = (k) => team.slice().sort((x, y) => y.cute[k] - x.cute[k])[0];
    const avg = (k) => team.reduce((n, p) => n + p.cute[k], 0) / team.length;
    const gk = team.find((p) => p.role === 'GK');
    const tries = [
      ['zoomies', best('T'), 0.12 + avg('T') * 0.035],
      ['steal', best('T'), 0.05 + avg('T') * 0.025],
      ['bounce', best('U'), 0.06 + avg('U') * 0.03],
      ['crowd', best('C'), 0.05 + avg('C') * 0.03],
      ['butterfly', best('U'), 0.06 + avg('U') * 0.035],
      ['nap', gk || team[0], 0.04 + ((gk || team[0]).cute.F + (10 - (gk || team[0]).cute.T)) * 0.012],
    ];
    let n = 0;
    tries.sort(() => rng() - 0.5).forEach(([k, p, prob]) => { if (n < 2 && rng() < prob) { out.push({ kind: k, team: i, player: p.name }); n++; } });
  });
  return out;
}
function simulatePuppyBowl(d, A, B, key, knockout) {
  const rng = seeded(d.seed, 'puppy', key, A.id, B.id);
  const sq = [puppySquad(d, A), puppySquad(d, B)];
  const moments = rollPuppyMoments(rng, sq);
  const delta = [0, 0];
  moments.forEach((m) => { const M = PUPPY_MOMENTS[m.kind]; delta[m.team] += M.xg; if (M.oppXg) delta[1 - m.team] += M.oppXg; });
  const match = simulateMatch(d, A, B, key, knockout !== false, { xgDelta: delta });
  if (match.forfeit) return { ...match, puppy: true, moments: [] };
  // Pin each moment to what it caused, and put it in the commentary right after.
  const used = new Set();
  const evs = match.events.slice();
  const pinned = [];
  moments.forEach((m) => {
    const M = PUPPY_MOMENTS[m.kind];
    const want = m.kind === 'nap' ? (e) => e.type === 'goal' && e.team === 1 - m.team
      : M.good ? (e) => e.type === 'goal' && e.team === m.team : (e) => e.type === 'chance' && e.team === m.team;
    const fallback = m.kind === 'nap' ? (e) => e.type === 'chance' && e.team === 1 - m.team : M.good ? (e) => e.type === 'chance' && e.team === m.team : (e) => e.type === 'tackle' && e.team === 1 - m.team;
    // Prefer the moment this animal was actually part of (in the passing move, or the shooter).
    const involves = (e) => e.player === m.player || (e.seq != null && match.seqs[e.seq] && match.seqs[e.seq].chain.includes(m.player));
    let k = evs.findIndex((e, j) => !used.has(j) && want(e) && (m.kind === 'nap' || involves(e)));
    if (k < 0) k = evs.findIndex((e, j) => !used.has(j) && want(e));
    let outcome = M.good ? 'goal' : m.kind === 'nap' ? 'conceded' : 'chance lost';
    if (k < 0) { k = evs.findIndex((e, j) => !used.has(j) && fallback(e)); outcome = M.good ? 'chance' : m.kind === 'nap' ? 'close call' : 'lost the ball'; }
    if (k < 0) return;
    used.add(k);
    const target = evs[k];
    pinned.push({ at: k, ev: { min: target.min, type: 'cute', kind: m.kind, team: m.team, player: m.player, outcome, emoji: M.emoji, banner: M.banner, good: M.good, text: M.emoji + ' ' + M.line.replace('{p}', m.player) } });
  });
  // Each moment goes just BEFORE what it caused. Insert from the back so earlier indexes stay valid.
  pinned.sort((a, b) => b.at - a.at).forEach((p) => evs.splice(p.at, 0, p.ev));
  return { ...match, events: evs, puppy: true, moments: pinned.map((p) => p.ev).reverse(), xgDelta: delta };
}
