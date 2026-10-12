/* ============================================================
   SUPERPOWER MISSIONS — the simulation for power topics.
   · Both teams take on the same 5 missions (picked at random).
   · Each mission has 3 stages, each testing one stat:
     Attack, Defence, Movement, Utility or Brains.
   · For each stage a team sends its best power for that stat
     (a power can only do one stage per mission).
   · Clear more stages than the other team → win the mission.
     Same stages → whoever cleared them more convincingly.
   · Worst Superpowers: silly everyday missions, and the Chaos stat
     can make a useless power work by accident (or backfire).
   ============================================================ */
const MISSION_STATS = { A: { k: 0, name: 'Attack', emoji: '👊' }, D: { k: 1, name: 'Defence', emoji: '🛡️' }, M: { k: 2, name: 'Movement', emoji: '💨' }, U: { k: 3, name: 'Utility', emoji: '🧰' }, B: { k: 4, name: 'Brains', emoji: '🧠' }, C: { k: 5, name: 'Chaos', emoji: '🎲' } };
const HERO_MISSIONS = [
  { emoji: '🏦', title: 'Bank robbery in progress', stages: ['M', 'A', 'B'], steps: ['Get there before they escape', 'Stop the robbers', 'Find where they hid the money'] },
  { emoji: '🔥', title: 'Skyscraper on fire', stages: ['M', 'D', 'U'], steps: ['Reach the top floor', 'Shield people from the flames', 'Put the fire out'] },
  { emoji: '🦹', title: 'Supervillain attacks the city', stages: ['A', 'D', 'B'], steps: ['Fight the villain', 'Protect the crowd', 'Outsmart the evil plan'] },
  { emoji: '🌋', title: 'Volcano erupts near a town', stages: ['U', 'D', 'M'], steps: ['Stop the lava flow', 'Protect the houses', 'Get everyone out'] },
  { emoji: '💻', title: 'Hackers steal the city’s power grid', stages: ['B', 'U', 'M'], steps: ['Trace the hackers', 'Get the lights back on', 'Catch them before they flee'] },
  { emoji: '🚆', title: 'Runaway train', stages: ['M', 'A', 'U'], steps: ['Catch up with the train', 'Stop it by force', 'Fix the brakes'] },
  { emoji: '🛸', title: 'Alien invasion', stages: ['A', 'B', 'D'], steps: ['Fight off the first wave', 'Find the mothership’s weak spot', 'Protect the city'] },
  { emoji: '🌊', title: 'Tsunami heading for the coast', stages: ['D', 'M', 'U'], steps: ['Hold back the wave', 'Evacuate the beach', 'Rebuild the sea wall'] },
  { emoji: '🏫', title: 'Hostages at the stadium', stages: ['B', 'M', 'D'], steps: ['Work out where they are', 'Get in unseen', 'Shield the hostages'] },
];
const SILLY_MISSIONS = [
  { emoji: '🍕', title: 'Get the last slice of pizza', stages: ['M', 'C', 'U'], steps: ['Beat everyone to the kitchen', 'Distract your cousin', 'Grab it without dropping it'] },
  { emoji: '📺', title: 'Find the TV remote', stages: ['B', 'U', 'C'], steps: ['Think where you last had it', 'Search the sofa', 'Hope for a miracle'] },
  { emoji: '🚌', title: 'Catch the bus', stages: ['M', 'C', 'B'], steps: ['Run for it', 'Get the driver to wait', 'Find your bus pass'] },
  { emoji: '🎤', title: 'Win the school talent show', stages: ['C', 'U', 'A'], steps: ['Wow the crowd', 'Pull off the big trick', 'Finish strong'] },
  { emoji: '🍽️', title: 'Survive a family dinner', stages: ['D', 'B', 'C'], steps: ['Dodge awkward questions', 'Change the subject', 'Escape before dessert'] },
  { emoji: '🐈', title: 'Get the cat down from a tree', stages: ['M', 'U', 'C'], steps: ['Climb up', 'Convince the cat', 'Get down in one piece'] },
  { emoji: '📚', title: 'Pass the surprise exam', stages: ['B', 'C', 'U'], steps: ['Remember anything at all', 'Guess well', 'Finish before the bell'] },
  { emoji: '🛒', title: 'Do the weekly shop in 10 minutes', stages: ['M', 'B', 'C'], steps: ['Sprint the aisles', 'Remember the list', 'Survive the self-checkout'] },
];
const STAGE_LINES = {
  M: ['{p} gets there in seconds.', '{p} is too slow.'],
  A: ['{p} takes them down!', '{p} can’t stop them.'],
  D: ['{p} keeps everyone safe.', '{p} can’t protect everyone.'],
  U: ['{p} has exactly the right trick.', '{p} isn’t much use here.'],
  B: ['{p} figures it out.', '{p} misses the clue.'],
  C: ['{p}… somehow works?!', '{p} makes it worse.'],
};
const SILLY_WIN = ['{p}… somehow works?!', 'Against all odds, {p} does the job.', '{p} is useless, but it still counts!'];
const SILLY_LOSE = ['{p} does absolutely nothing.', '{p} makes everything worse.', 'Everyone stares at {p}. Awkward.'];

function missionPowers(d, team, topic) {
  return team.team.filter(Boolean).map((x) => d.items[x.itemId]).filter(Boolean).map((item) => { const s = itemStats(topic, item); return { name: item.name, itemId: item.id, v: s ? s.vals : [5, 5, 5, 5, 5, 5] }; });
}
function simulateMissions(d, A, B, key) {
  const rng = seeded(d.seed, 'missions', key);
  const silly = battleKindId(d.topic) === 'weird';
  const pool = (silly ? SILLY_MISSIONS : HERO_MISSIONS).slice().sort(() => rng() - 0.5).slice(0, 5);
  const teams = [A, B].map((t) => missionPowers(d, t, d.topic));
  const missions = []; const score = [0, 0];
  pool.forEach((m) => {
    const used = [new Set(), new Set()]; const passed = [0, 0]; const margin = [0, 0];
    const stages = m.stages.map((stat, si) => {
      const k = MISSION_STATS[stat].k;
      const res = [0, 1].map((s) => {
        const ps = teams[s].filter((p) => !used[s].has(p.name));
        const p = (ps.length ? ps : teams[s]).slice().sort((x, y) => (y.v[k] || 0) - (x.v[k] || 0))[0];
        if (!p) return { ok: false, power: null, text: 'Nobody to send.' };
        used[s].add(p.name);
        const val = p.v[k] || 1;
        const diff = silly ? 3.5 + rng() * 3 : 4.5 + rng() * 4;
        let roll = val + (rng() - 0.5) * 7.5; let ok = roll >= diff; let chaos = false;
        if (silly && rng() < (p.v[5] || 1) * 0.05) { ok = !ok; chaos = true; }
        if (ok) { passed[s]++; margin[s] += roll - diff; }
        const tpl = silly ? (ok ? pickOf(rng, SILLY_WIN) : pickOf(rng, SILLY_LOSE)) : STAGE_LINES[stat][ok ? 0 : 1];
        return { ok, power: p.name, itemId: p.itemId, chaos, text: (chaos ? '🎲 CHAOS! ' : '') + tpl.replace('{p}', p.name) };
      });
      return { stat, step: m.steps[si], res };
    });
    const w = passed[0] !== passed[1] ? (passed[0] > passed[1] ? 0 : 1) : margin[0] !== margin[1] ? (margin[0] > margin[1] ? 0 : 1) : (rng() < 0.5 ? 0 : 1);
    score[w]++;
    missions.push({ emoji: m.emoji, title: m.title, stages, passed, w, score: [...score], close: passed[0] === passed[1] });
  });
  return { v: 'mission', kind: silly ? 'weird' : 'powers', silly, missions, score, winner: score[0] > score[1] ? 0 : 1, sudden: false, et: false, pens: null, events: [] };
}
