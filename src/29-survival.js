/* ============================================================
   SURVIVAL SHOWDOWN — the simulation for survival-kit topics
   (Zombie Apocalypse Kit, Desert Island Items).
   · Both teams face the SAME run of days and nights (fair test).
   · Each event needs certain kinds of kit (tags from 24-stats.js:
     defence, tools, food, water, medical, shelter, light & fire,
     signal & map, travel, morale). The team's best matching item
     is named in the story; its usefulness sets the odds.
   · Food and water run down every day; a team with nothing to eat
     or drink gets weaker. Fail too much and the team doesn't make
     it. A good signal can get a team rescued early.
   · Most days survived wins (up to 10). Level → whoever is in
     better shape; still level → one last night decides.
   ============================================================ */

const SURVIVAL_EVENTS = {
  zomb: [
    { id: 'horde', emoji: '🧟', title: 'A horde hits the gate', need: 'WL', hurt: 26, night: true, win: '{i} holds the line. Not one gets in!', lose: 'Nothing to fight with — they barely escape out the back.' },
    { id: 'shop', emoji: '🛒', title: 'Supply run to the supermarket', need: 'TW', hurt: 14, gain: 'food', win: '{i} gets them in and out with bags of food.', lose: 'Too slow — they run home empty-handed.' },
    { id: 'bite', emoji: '🩸', title: 'Someone gets scratched', need: 'M', hurt: 24, win: '{i} patches it up fast. Close one.', lose: 'No medical kit. It’s getting worse…' },
    { id: 'cold', emoji: '🥶', title: 'Freezing night', need: 'SL', hurt: 16, night: true, win: '{i} keeps everyone warm.', lose: 'Nobody sleeps. Everyone’s shivering.' },
    { id: 'lock', emoji: '🚪', title: 'A locked pharmacy', need: 'U', hurt: 8, gain: 'med', win: '{i} gets the door open — medicine!', lose: 'They can’t get in. Walk away.' },
    { id: 'radio', emoji: '📻', title: 'A faint radio signal', need: 'N', rescue: true, win: '{i} picks it up — there’s a safe zone!', lose: 'Just static. No way to answer.' },
    { id: 'dark', emoji: '🌑', title: 'Power cut in the hideout', need: 'L', hurt: 14, night: true, win: '{i} lights the way.', lose: 'Pitch black. Every noise is terrifying.' },
    { id: 'bridge', emoji: '🌉', title: 'The bridge is blocked', need: 'TU', hurt: 12, win: '{i} gets them across.', lose: 'They lose a day going the long way round.' },
    { id: 'mood', emoji: '😩', title: 'Everyone’s losing hope', need: 'O', hurt: 12, win: '{i} lifts everyone’s spirits.', lose: 'Arguments break out. Morale is low.' },
    { id: 'rain', emoji: '⛈️', title: 'Storm floods the street', need: 'S', hurt: 12, win: '{i} keeps them dry.', lose: 'Soaked through. Supplies ruined.' },
    { id: 'thirst', emoji: '💧', title: 'The taps run dry', need: 'H', hurt: 22, win: '{i} keeps them going.', lose: 'No clean water. This is bad.' },
    { id: 'heli', emoji: '🚁', title: 'A helicopter flies over', need: 'NL', rescue: true, win: '{i} gets its attention — it circles back!', lose: 'It doesn’t see them. Gone.' },
  ],
  island: [
    { id: 'storm', emoji: '⛈️', title: 'A tropical storm', need: 'S', hurt: 22, night: true, win: '{i} keeps them sheltered.', lose: 'The storm rips everything apart.' },
    { id: 'fish', emoji: '🐟', title: 'Time to find food', need: 'F', hurt: 16, gain: 'food', win: '{i} — dinner sorted!', lose: 'Nothing to eat today.' },
    { id: 'dry', emoji: '☀️', title: 'No rain for days', need: 'H', hurt: 24, win: '{i} keeps them drinking.', lose: 'Thirst is setting in.' },
    { id: 'cut', emoji: '🩸', title: 'A nasty cut on the reef', need: 'M', hurt: 20, win: '{i} stops it getting infected.', lose: 'It’s swelling up…' },
    { id: 'sun', emoji: '🥵', title: 'Scorching sun', need: 'SM', hurt: 14, win: '{i} saves them from burning.', lose: 'Sunburn everywhere. Ouch.' },
    { id: 'ship', emoji: '🚢', title: 'A ship on the horizon!', need: 'N', rescue: true, win: '{i} — they’ve been spotted!', lose: 'No way to signal. It sails away.' },
    { id: 'fire', emoji: '🔥', title: 'The fire goes out', need: 'L', hurt: 14, night: true, win: '{i} gets it going again.', lose: 'Cold, dark and raw food tonight.' },
    { id: 'raft', emoji: '🛶', title: 'Explore the next island', need: 'TU', hurt: 8, gain: 'food', win: '{i} gets them there — fresh fruit!', lose: 'They can’t make the crossing.' },
    { id: 'bored', emoji: '😩', title: 'Day 5 of nothing', need: 'O', hurt: 12, win: '{i} keeps everyone sane.', lose: 'Talking to coconuts now.' },
    { id: 'crab', emoji: '🦀', title: 'Coconut crabs raid the camp', need: 'W', hurt: 12, night: true, win: '{i} chases them off.', lose: 'They take half the food.' },
    { id: 'mozzie', emoji: '🦟', title: 'Mosquito swarm', need: 'MS', hurt: 12, night: true, win: '{i} — no bites tonight.', lose: 'Bitten all night long.' },
    { id: 'plane', emoji: '✈️', title: 'A plane flies over', need: 'NL', rescue: true, win: '{i} — the plane dips its wings!', lose: 'Too far away to notice them.' },
  ],
};
const SURVIVAL_DAYS = 10;
const survivalSet = (topic) => (topic && (topic.id === 't-island' || /island/i.test(topic.name || '')) ? 'island' : 'zomb');

function survivalKit(d, team, topic) {
  return team.team.filter(Boolean).map((x) => d.items[x.itemId]).filter(Boolean).map((item) => { const s = itemStats(topic, item) || { vals: [5], tags: 'O' }; return { name: item.name, itemId: item.id, use: s.vals[0], tags: s.tags || '' }; });
}
// Best item in the kit for an event's needs (first tag counts most).
function bestFor(kit, need, used) {
  let best = null, bs = 0;
  kit.forEach((k) => {
    const hit = need.split('').reduce((n, t, i) => n + (k.tags.includes(t) ? (i === 0 ? 1 : 0.7) : 0), 0);
    if (!hit) return;
    const sc = k.use * hit - (used[k.name] || 0) * 1.2; // the same item wears out a bit
    if (sc > bs) { bs = sc; best = k; }
  });
  return best;
}

function simulateSurvival(d, A, B, key) {
  const rng = seeded(d.seed, 'survive', key);
  const set = survivalSet(d.topic); const pool = SURVIVAL_EVENTS[set];
  const kits = [A, B].map((t) => survivalKit(d, t, d.topic));
  const tagSum = (kit, t) => kit.filter((k) => k.tags.includes(t)).reduce((n, k) => n + k.use, 0);
  const st = kits.map((kit) => ({ cond: 100, food: 1 + Math.min(6, Math.round(tagSum(kit, 'F') / 4)), water: 1 + Math.min(6, Math.round(tagSum(kit, 'H') / 4)), signals: 0, out: 0, rescued: 0, used: {} }));
  // The same days for both teams.
  const days = [];
  const order = pool.slice().sort(() => rng() - 0.5);
  for (let i = 0; i < SURVIVAL_DAYS; i++) days.push(order[i % order.length]);
  const log = [];
  for (let day = 1; day <= SURVIVAL_DAYS; day++) {
    const evd = days[day - 1];
    const res = [0, 1].map((s) => {
      const T = st[s];
      if (T.out || T.rescued) return null;
      const notes = [];
      // Daily needs: food and water run down.
      if (T.food > 0) T.food--; else { T.cond -= 5; notes.push('hungry'); }
      if (T.water > 0) T.water--; else { T.cond -= 7; notes.push('thirsty'); }
      const item = bestFor(kits[s], evd.need, T.used);
      const chance = item ? clamp(0.28 + item.use * 0.075 - (T.used[item.name] || 0) * 0.06, 0.15, 0.95) : 0.1;
      const ok = rng() < chance;
      if (item) T.used[item.name] = (T.used[item.name] || 0) + 1;
      let text = ok ? (item ? evd.win.replace('{i}', item.name) : 'Nothing in the kit for this, but they get lucky and pull through.') : evd.lose;
      if (ok && evd.gain === 'food') T.food += 2;
      if (ok && evd.gain === 'med') T.cond = Math.min(100, T.cond + 12);
      if (!ok && evd.hurt) T.cond -= Math.round(evd.hurt * (0.6 + rng() * 0.4));
      if (evd.rescue && ok) { T.signals++; if (T.signals >= 2 || (day >= 6 && rng() < 0.35)) { T.rescued = day; text += ' 🎉 RESCUED!'; } else text += ' They’ve been seen — help might come.'; }
      if (T.cond <= 0 && !T.rescued) { T.out = day; text += ' 💀 They don’t make it.'; }
      return { ok, item: item ? item.name : null, itemId: item ? item.itemId : null, text, notes, cond: Math.max(0, T.cond), food: T.food, water: T.water, out: !!T.out, rescued: !!T.rescued };
    });
    log.push({ day, ev: { id: evd.id, emoji: evd.emoji, title: evd.title, night: !!evd.night, need: evd.need }, res });
    if (st.every((T) => T.out || T.rescued)) break;
  }
  const daysOf = (T) => (T.rescued ? SURVIVAL_DAYS : T.out ? T.out - 1 : SURVIVAL_DAYS);
  const score = st.map(daysOf);
  let winner, how;
  if (score[0] !== score[1]) { winner = score[0] > score[1] ? 0 : 1; how = 'days'; }
  else if (!!st[0].rescued !== !!st[1].rescued) { winner = st[0].rescued ? 0 : 1; how = 'rescue'; }
  else if (st[0].rescued && st[1].rescued && st[0].rescued !== st[1].rescued) { winner = st[0].rescued < st[1].rescued ? 0 : 1; how = 'rescue'; }
  else if (Math.abs(st[0].cond - st[1].cond) >= 1) { winner = st[0].cond > st[1].cond ? 0 : 1; how = 'shape'; }
  else { winner = rng() < 0.5 ? 0 : 1; how = 'lastnight'; }
  return { v: 'survival', kind: 'survival', set, log, score, winner, how, final: st.map((T) => ({ cond: Math.max(0, T.cond), rescued: T.rescued, out: T.out })), sudden: how === 'lastnight', et: false, pens: null, events: [] };
}
const moodOf = (c) => (c >= 75 ? '😀' : c >= 50 ? '😐' : c >= 25 ? '😟' : c > 0 ? '🤕' : '💀');
