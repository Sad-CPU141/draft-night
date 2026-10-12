/* ============================================================
   CUTENESS SHOW — the simulation for cute topics (Cutest
   Animals, Pets, Dog Breeds, Cat Breeds).
   · Rounds: Entrance, Party Trick, Close-up, Costume, Grand Finale
     (as many as the topic has slots).
   · Each round, each team sends its best contestant for that round
     (Fluffy / Tiny / Funny / Charm stats, Draft Night estimates).
   · Three judges, each with their own taste, hold up a score 1–10.
   · Higher total wins the round; more rounds wins the show
     (level → total points; still level → the crowd decides).
   ============================================================ */
const SHOW_JUDGES = [
  { name: 'Nana Fluff', emoji: '👵', w: [2, 0.5, 0.5, 1], love: ['Look at that FLOOF!', 'I want to knit it a jumper.', 'So soft I could cry.'], meh: ['Needs more fluff, dear.', 'Not cuddly enough for me.'] },
  { name: 'Little Tim', emoji: '🧒', w: [0.5, 1.5, 1.5, 0.5], love: ['IT’S SO TINY!', 'Hahaha, again! Again!', 'Can I keep it?!'], meh: ['It’s too big.', 'Boring. Where’s the trick?'] },
  { name: 'Captain Charm', emoji: '🎩', w: [0.5, 0.5, 1, 2], love: ['Pure star quality.', 'Those eyes! Magnificent.', 'A natural on stage.'], meh: ['Lacks presence.', 'I’ve seen more charm in a spoon.'] },
];
const SHOW_ROUNDS = [
  { title: 'The Entrance', emoji: '🚪', w: [1, 0.5, 0.5, 1.5], act: ['{c} struts onto the stage.', '{c} peeks out from behind the curtain.', '{c} waddles in to huge applause.'] },
  { title: 'Party Trick', emoji: '🎪', w: [0.3, 0.8, 1.8, 1], act: ['{c} does a spin!', '{c} rolls over on command.', '{c} tries a trick… and falls over adorably.'] },
  { title: 'The Close-up', emoji: '🔍', w: [1.5, 1.2, 0.3, 1], act: ['The camera zooms in on {c}’s little face.', '{c} blinks slowly at the judges.', '{c} does the head tilt.'] },
  { title: 'Costume Round', emoji: '🎀', w: [1, 1, 1, 1], act: ['{c} in a tiny hat!', '{c} dressed as a pumpkin.', '{c} wearing sunglasses. Iconic.'] },
  { title: 'Grand Finale', emoji: '🌟', w: [1, 1, 1, 1.4], act: ['{c} takes a bow.', '{c} falls asleep on stage. The crowd melts.', '{c} sneezes. The internet will never recover.'] },
];
function simulateShow(d, A, B, key) {
  const rng = seeded(d.seed, 'show', key);
  const teams = [A, B].map((t) => t.team.filter(Boolean).map((x) => d.items[x.itemId]).filter(Boolean).map((item) => { const s = itemStats(d.topic, item); return { name: item.name, itemId: item.id, v: s ? s.vals : [5, 5, 5, 5] }; }));
  const n = Math.min(SHOW_ROUNDS.length, Math.max(teams[0].length, teams[1].length));
  const used = [new Set(), new Set()];
  const rounds = []; const score = [0, 0]; const pts = [0, 0];
  for (let r = 0; r < n; r++) {
    const R = SHOW_ROUNDS[r];
    const fit = (c) => c.v.reduce((s, v, i) => s + v * R.w[i], 0);
    const acts = [0, 1].map((s) => {
      const c = teams[s].filter((x) => !used[s].has(x.name)).sort((x, y) => fit(y) - fit(x))[0];
      if (!c) return null;
      used[s].add(c.name);
      const form = 0.85 + rng() * 0.3; // on the night
      const marks = SHOW_JUDGES.map((J) => {
        const taste = c.v.reduce((s, v, i) => s + v * J.w[i] * R.w[i], 0) / J.w.reduce((s, w, i) => s + w * R.w[i], 0);
        const m = clamp(Math.round(taste * form + (rng() - 0.5) * 4), 1, 10);
        return { m, say: m >= 8 ? pickOf(rng, J.love) : m <= 4 ? pickOf(rng, J.meh) : '' };
      });
      const total = marks.reduce((s, x) => s + x.m, 0);
      return { name: c.name, itemId: c.itemId, act: pickOf(rng, R.act).replace('{c}', c.name), marks, total };
    });
    let w;
    if (!acts[0] || !acts[1]) w = acts[0] ? 0 : 1;
    else w = acts[0].total !== acts[1].total ? (acts[0].total > acts[1].total ? 0 : 1) : (rng() < 0.5 ? 0 : 1);
    score[w]++; acts.forEach((a, s) => { if (a) pts[s] += a.total; });
    rounds.push({ title: R.title, emoji: R.emoji, acts, w, score: [...score], tie: acts[0] && acts[1] && acts[0].total === acts[1].total });
  }
  let winner, how = 'rounds';
  if (score[0] !== score[1]) winner = score[0] > score[1] ? 0 : 1;
  else if (pts[0] !== pts[1]) { winner = pts[0] > pts[1] ? 0 : 1; how = 'points'; }
  else { winner = rng() < 0.5 ? 0 : 1; how = 'crowd'; }
  return { v: 'show', kind: 'cute', rounds, score, pts, winner, how, sudden: false, et: false, pens: null, events: [] };
}
