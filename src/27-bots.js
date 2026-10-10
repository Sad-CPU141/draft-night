/* ============================================================
   SOLO BOTS — pure decision logic, no UI, no timers.
   Bots only see what a human at the table could see: the current item,
   the bid, every team's budget and roster, and what's left in the topic.
   Every decision is seeded, so the same game state gives the same choice.
   ============================================================ */

const BOT_TYPES = {
  spender: { label: 'Big Spender', short: 'Spender', color: '#ff8a3a', emojis: ['💸', '🤑', '💰', '🎩', '💎', '🛥️'],
    names: ['Sir Overpays-a-Lot', 'Baron Von Big Bucks', 'Lady Splash-the-Cash', 'The Human Wallet', 'King Cha-Ching', 'Count Overbid', 'Duke of Debt'] },
  bargain: { label: 'Bargain Hunter', short: 'Bargains', color: '#2fd17c', emojis: ['🧾', '🏷️', '🪙', '🛒', '🦝', '🧮'],
    names: ['The Discount Goblin', 'Coupon Carl', 'Clearance Rack Rita', 'Penny Pincher Pete', 'Two-for-One Tony', 'Aunty Haggles', 'Buy-One-Get-None'] },
  needs: { label: 'Position Strategist', short: 'Strategist', color: '#3d8bff', emojis: ['📋', '🧠', '📐', '🗂️', '🎯', '🧩'],
    names: ['Captain Empty Slot', 'The Spreadsheet', 'Professor Positions', 'Coach Clipboard', 'Formation Freddie', 'Gap Filler Greg', 'Doctor Depth Chart'] },
  chaos: { label: 'Chaos', short: 'Chaos', color: '#ff5cbc', emojis: ['🌀', '🃏', '🎲', '🤪', '🦄', '🎪'],
    names: ['Lord Chaos', 'Random Randy', 'The Wildcard', 'Agent of Mayhem', 'Captain Coin Flip', 'Mystery Max', 'Unpredictable Ursula'] },
};
const BOT_TYPE_ORDER = ['spender', 'bargain', 'needs', 'chaos'];

// How smart each level plays. Hard is never given extra money or hidden information.
const BOT_LEVELS = {
  easy:   { label: 'Easy',   noise: 0.38, miss: 0.2,  reserve: 0.15, scarcity: 0.1, rivals: false, waste: 0.22, freeNoise: 0.6 },
  medium: { label: 'Medium', noise: 0.18, miss: 0.06, reserve: 0.6,  scarcity: 0.45, rivals: true, waste: 0.06, freeNoise: 0.2 },
  hard:   { label: 'Hard',   noise: 0.06, miss: 0,    reserve: 1,    scarcity: 0.8,  rivals: true, waste: 0,    freeNoise: 0 },
};

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const seeded = (...parts) => mulberry32(hashStr(parts.join('|')));
const unit = (...parts) => (hashStr(parts.join('|')) % 10000) / 10000;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isBot = (m) => !!(m && m.bot);
const botLevel = (m) => BOT_LEVELS[(m.bot && m.bot.level) || 'medium'] || BOT_LEVELS.medium;

/* ---------- making a table of bots ---------- */
function makeBots(count, level, seed, avoidColors) {
  const rng = seeded('bots', seed);
  const order = [];
  while (order.length < count) {
    const round = [...BOT_TYPE_ORDER];
    for (let i = round.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [round[i], round[j]] = [round[j], round[i]]; }
    order.push(...round);
  }
  const usedNames = new Set(); const usedColors = new Set(avoidColors || []);
  return order.slice(0, count).map((type, i) => {
    const T = BOT_TYPES[type];
    const names = T.names.filter((n) => !usedNames.has(n));
    const name = names[Math.floor(rng() * names.length)] || T.names[0] + ' ' + (i + 1);
    usedNames.add(name);
    const color = [T.color, ...COLORS].find((c) => !usedColors.has(c)) || COLORS[i % COLORS.length];
    usedColors.add(color);
    return { id: 'bot-' + i + '-' + hashStr(seed + name).toString(36).slice(0, 4), name, color, emoji: T.emojis[Math.floor(rng() * T.emojis.length)], bot: { type, level } };
  });
}

/* ---------- how good an item looks ---------- */
// "Fame" uses only what's on the card: accolades in the description plus a fixed per-item
// recognisability, so every player (and bot) sees the same baseline.
function itemFame(item) {
  const s = (item.desc || '') + ' ';
  let f = 0.32 + unit('fame', item.name) * 0.22;
  const n = s.match(/(\d+)\s*[×x]\s/);
  if (n) f += Math.min(0.32, 0.06 * parseInt(n[1], 10));
  if (/MVP|Ballon d'Or|World Cup|champion|Golden|legend|record|GOAT|Hall of Fame|all-time|greatest|King|icon|the original/i.test(s)) f += 0.18;
  if (/No\. 1 pick|Rookie|All-Star|Norris|Vezina|Hart|Defensive POY|Finals MVP|Grand Slam|Wimbledon|Olympic/i.test(s)) f += 0.1;
  return clamp(f, 0.15, 1);
}
// Each bot's own taste, fixed per item. Chaos has wilder opinions.
function botTaste(bot, item) {
  const spread = bot.bot.type === 'chaos' ? 0.5 : 0.16;
  return 1 + (unit('taste', bot.name, item.name) - 0.5) * 2 * spread;
}
const slotKey = (d, item) => { const p = norm(item.pos); return p && d.rules.slots.some((s) => norm(s) === p) ? p : '*'; };
// Open demand vs remaining supply for this item's position (public information).
function scarcityOf(d, item) {
  const key = slotKey(d, item);
  const pool = [...d.queue, ...d.leftover].map((id) => visibleItem(d, id));
  const supply = pool.filter((it) => slotKey(d, it) === key || key === '*').length;
  const demand = d.managers.reduce((n, m) => n + d.rules.slots.filter((s, k) => !m.team[k] && (key === '*' || norm(s) === key || isFlex(s))).length, 0);
  return clamp(demand / Math.max(1, supply), 0.5, 2);
}
// What this bot thinks the item is worth to it right now, in dollars.
function botValue(d, bot, item, rng) {
  const slots = d.rules.slots;
  const idx = assignSlot(bot, item, slots);
  if (idx < 0) return 0;
  const L = botLevel(bot); const type = bot.bot.type;
  const fair = d.rules.budget / slots.length;
  const fame = itemFame(item);
  let v = fair * (0.5 + 1.15 * fame) * botTaste(bot, item);
  const exact = !isFlex(slots[idx]);
  const sc = scarcityOf(d, item);
  if (type === 'spender') { v *= fame > 0.6 ? 1.75 : 0.95; if (bot.budget >= d.rules.budget * 0.6) v *= 1.15; }
  if (type === 'bargain') v *= 0.72;
  if (type === 'needs') { v *= exact ? 1.3 : fame > 0.7 ? 0.7 : 0.3; v *= Math.pow(sc, 0.5 + L.scarcity); }
  else v *= Math.pow(sc, L.scarcity * 0.5);
  if (type === 'chaos' && unit('crush', bot.name, item.name) < 0.12) v *= 1.9; // a random favourite
  // Endgame: few options left for its empty slots → worth more.
  if (L.scarcity > 0.3) {
    const options = d.queue.slice(1).filter((id) => assignSlot(bot, visibleItem(d, id), slots) >= 0).length;
    if (options < emptyCount(bot) * 1.5) v *= 1 + 0.25 * L.scarcity;
  }
  return v * (1 + (rng() - 0.5) * 2 * L.noise);
}
// The most a bot will pay, after keeping money back for the rest of its team.
function botLimit(d, bot, item, rng) {
  const L = botLevel(bot); const type = bot.bot.type;
  const others = emptyCount(bot) - 1;
  const fair = d.rules.budget / d.rules.slots.length;
  const legal = maxBid(bot, d.rules);
  const keepMin = d.rules.mustFill || L.reserve >= 0.5 ? d.rules.minBid * others : 0;
  const extraShare = type === 'spender' ? 0.08 : type === 'chaos' ? 0.12 * rng() : 0.22;
  const keepExtra = L.reserve * others * Math.max(0, fair * extraShare);
  const value = botValue(d, bot, item, rng);
  let limit = Math.floor(Math.min(legal, bot.budget - keepMin - keepExtra, value));
  // A $1 bargain on a slot it needs is hard to resist — except for the strategist, who saves
  // FLEX for the right player unless the draft is nearly over.
  const idx = assignSlot(bot, item, d.rules.slots);
  const flexOnly = idx >= 0 && isFlex(d.rules.slots[idx]);
  const endgame = d.queue.length - 1 < emptyCount(bot) * 2;
  const holdFlex = type === 'needs' && flexOnly && !endgame;
  if (!holdFlex && value >= fair * 0.45 && limit < d.rules.minBid + d.rules.inc && legal >= d.rules.minBid) limit = Math.min(legal, d.rules.minBid + (type === 'bargain' ? d.rules.inc : 0));
  return { limit: Math.max(0, limit), value };
}

/* ---------- auction decisions ---------- */
// Returns { botId, amount, delay, event } for one bot, or null to stay quiet.
// opts.noMiss: ignore the "not paying attention" roll (used to decide whether a bot drops out).
function botDecision(d, bot, opts) {
  const item = d.queue.length ? visibleItem(d, d.queue[0]) : null; // bots never see a hidden mystery item
  if (!item || !isBot(bot) || isFull(bot) || d.phase !== 'auction' || d.pending) return null;
  if (d.bid && d.bid.leaderId === bot.id) return null;
  const price = nextAmount(d);
  if (!canBid(d, bot, price)) return null;
  const rng = seeded(d.seed || d.id, d.reveal, price, bot.id);
  const L = botLevel(bot); const type = bot.bot.type;
  if (rng() < L.miss && !(opts && opts.noMiss)) return null; // not paying attention
  const { limit, value } = botLimit(d, bot, item, rng);
  if (price > limit) {
    // Out of normal range: a Double Bid (pay half, counts double) can still win it.
    const pay = Math.ceil(price / 2);
    const keen = type === 'spender' ? itemFame(item) > 0.55 : type === 'needs' ? scarcityOf(d, item) > 1.2 : type === 'chaos' ? rng() < 0.3 : value > price * 0.75;
    if (keen && pay <= limit && !doubleProblem(d, bot.id, pay)) return { botId: bot.id, speaker: bot.speaker || bot.id, amount: pay, double: true, delay: clamp(Math.round(900 + rng() * 900), 650, 2300), event: 'jump' };
    return null;
  }
  const rivals = d.managers.filter((m) => m.id !== bot.id && !isFull(m) && assignSlot(m, item, d.rules.slots) >= 0);
  const rivalMax = rivals.reduce((mx, m) => Math.max(mx, maxBid(m, d.rules)), 0);
  if (type === 'bargain') {
    if (price > value * 0.85) return null;
    const bigRival = d.bid && d.managers.find((m) => m.id === d.bid.leaderId && m.budget >= bot.budget * 1.8);
    if (bigRival && price > d.rules.minBid + 2 * d.rules.inc) return null; // not starting a war with a rich team
  }
  // Smart bots don't chase what a rival can easily outbid them on.
  if (L.rivals && rivalMax > limit && price > value * 0.9 && type !== 'spender') return null;
  let amount = price;
  const fame = itemFame(item);
  if (type === 'spender' && fame > 0.55 && rng() < 0.35) amount += d.rules.inc * (1 + Math.floor(rng() * 3));
  if (type === 'chaos' && rng() < 0.16) amount += d.rules.inc * (1 + Math.floor(rng() * 4));
  if (rng() < L.waste) amount += d.rules.inc; // easy bots sometimes bid more than they need to
  if (L.rivals && rivalMax < amount && type !== 'chaos') amount = Math.max(price, Math.min(amount, rivalMax + d.rules.inc)); // no point jumping past what anyone can pay
  amount = Math.min(amount, limit);
  if (!canBid(d, bot, amount)) amount = price;
  let delay = 700 + rng() * 900;
  if (price > limit * 0.8) delay += 350;   // a tougher call takes longer
  if (type === 'bargain') delay += 300;
  if (type === 'chaos') delay -= rng() * 250;
  delay = clamp(delay, 650, 2300);
  return { botId: bot.id, speaker: bot.speaker || bot.id, amount, delay: Math.round(delay), event: amount > price ? 'jump' : 'bid' };
}
// Which bot (if any) acts next: the quickest one that wants in. On an all-bot team every
// member weighs in for the team; they share the team's money, so they never bid each other up.
// Bot teams that don't want the item at the current price drop out ("I'm out"). Prices only
// go up, so a bot that passes now would pass later too. A team of bots drops out only when
// every bot on it passes; nobody drops out while they still owe a bid under "Require every
// manager to bid".
function botPassers(d) {
  if (d.phase !== 'auction' || d.pending || !d.queue.length) return [];
  const byTeam = {};
  botActors(d).forEach((a) => { (byTeam[a.id] = byTeam[a.id] || []).push(a); });
  return Object.keys(byTeam).filter((id) => {
    const m = d.managers.find((x) => x.id === id);
    if (!m || isOut(d, id) || (d.bid && d.bid.leaderId === id) || !canBid(d, m, nextAmount(d)) || owesBid(d, m) || skipWithdrawProblem(d, id)) return false;
    return byTeam[id].every((a) => !botDecision(d, a, { noMiss: true }));
  });
}
// A bot that owes a bid places one at the asking price.
function botForcedBid(d) {
  if (!mustBidOn(d)) return null;
  const a = botActors(d).find((x) => owesBid(d, d.managers.find((m) => m.id === x.id)));
  return a ? { botId: a.id, speaker: a.speaker || a.id, amount: nextAmount(d), delay: 900, event: 'bid' } : null;
}
function nextBotAction(d) {
  return botActors(d).map((b) => botDecision(d, b)).filter(Boolean).sort((a, b) => a.delay - b.delay || (a.botId < b.botId ? -1 : 1))[0] || null;
}
// Free picks: take the best leftover for this team.
function botFreePickChoice(d, bot) {
  const L = botLevel(bot);
  const opts = d.leftover.filter((id) => canTake(d, bot, id));
  if (!opts.length) return null;
  const rng = seeded(d.seed || d.id, 'free', d.fp.round, d.fp.pos, bot.id);
  return opts.map((id) => ({ id, s: botValue(d, bot, visibleItem(d, id), () => 0.5) * (1 + (rng() - 0.5) * 2 * L.freeNoise) })).sort((a, b) => b.s - a.s)[0].id;
}

/* ---------- judging teams ---------- */
// How strong a team looks to `judge`: item quality, balance, completeness and value for money.
function teamScore(d, m, judge) {
  const slots = d.rules.slots; const fair = d.rules.budget / slots.length;
  let quality = 0, vfm = 0, exact = 0, filled = 0;
  m.team.forEach((t, i) => {
    if (!t) return;
    const it = d.items[t.itemId]; filled++;
    const q = fair * (0.5 + 1.15 * itemFame(it)) * (judge && judge.bot ? botTaste(judge, it) : 1);
    quality += q; vfm += q - t.price;
    if (!isFlex(slots[i]) && (!it.pos || norm(it.pos) === norm(slots[i]))) exact++;
  });
  const completeness = filled / slots.length;
  return quality * (0.55 + 0.45 * completeness) + 0.15 * Math.max(0, vfm) + exact * fair * 0.1;
}
// Teams a voter may vote for: not their own, and the team must have at least one item.
// voterTeamId is the voter's own team (in individual games that's the manager itself).
function voteChoices(d, voterTeamId) { return d.managers.filter((m) => m.id !== voterTeamId && m.team.some(Boolean)); }
function botVote(d, bot) {
  const choices = voteChoices(d, bot.teamId || bot.id);
  if (!choices.length) return null;
  const L = botLevel(bot);
  const rng = seeded(d.seed || d.id, 'vote', bot.speaker || bot.id);
  return choices.map((m) => ({ id: m.id, s: teamScore(d, m, bot) * (1 + (rng() - 0.5) * 2 * L.noise * 0.6) }))
    .sort((a, b) => b.s - a.s || (a.id < b.id ? -1 : 1))[0].id;
}

/* ---------- trash talk ---------- */
const TALK = {
  spender: {
    start: ['Money is temporary. Greatness is forever.', 'I brought the whole piggy bank.', 'Price tags are just suggestions.'],
    bid: ['Is that all? Cute.', 'Put it on my tab.', 'I want it. I have money. Simple.', 'Bidding is my cardio.'],
    jump: ['Let me just end this.', 'Big money, big moves.', 'Make it rain!', 'Nobody touch my future star.'],
    win: ['Worth every cent. Probably.', 'Another trophy for the cabinet.', 'Expensive taste, I know.'],
    steal: ['Even I can’t believe how cheap that was.', 'I paid less than I wanted to. Weird feeling.'],
    lose: ['Fine, keep it. I’m saving for something shinier.', 'That was a terrible financial decision. Respect.', 'I let you have that one.'],
    free: ['Free? I’d have paid double.', 'My wallet is resting.'],
    rival: ['Big spender in the building, I see.', 'Ooh, someone opened their wallet.'],
  },
  bargain: {
    start: ['I’m not cheap. I’m financially intelligent.', 'Wake me up when something’s on sale.', 'I can smell a discount.'],
    bid: ['A modest offer.', 'Not a cent more than it’s worth.', 'Let’s keep this reasonable.', 'Opening at clearance prices.'],
    jump: ['Okay, okay, a little more.', 'Fine. Small splurge.'],
    win: ['A steal! Probably. Don’t check the numbers.', 'Bought low. Will brag high.', 'Cha-ching… for ME.'],
    steal: ['Robbery. Absolute robbery.', 'I’d like to thank the other bidders for not bidding.'],
    lose: ['Overpay all you like. I’ll wait.', 'Enjoy paying full price.', 'Too rich for my blood.'],
    free: ['Free is my favourite price.', 'Zero dollars. Perfection.'],
    rival: ['You paid HOW much?', 'My calculator just fainted.', 'That was a choice.'],
  },
  needs: {
    start: ['I have a plan and a clipboard.', 'Every slot has a purpose.', 'Balance wins drafts.'],
    bid: ['This fills a gap.', 'Exactly what the formation needs.', 'Checks out on the spreadsheet.'],
    jump: ['I need this one. Seriously.', 'This is the missing piece.'],
    win: ['Slot filled. Next.', 'The plan is coming together.', 'Depth chart looking healthy.'],
    steal: ['Need filled and on budget. Chef’s kiss.'],
    lose: ['Fine, I’ll adjust the formation.', 'Back to the drawing board.', 'Plan B it is.'],
    free: ['Hole plugged. Thank you.', 'Free and useful. My favourite.'],
    rival: ['Do you even need that position?', 'Interesting team building strategy.'],
    need: ['I need a {slot}, not another anything else!', 'Somebody sell me a {slot}.'],
  },
  chaos: {
    start: ['I have absolutely no plan.', 'Let’s make this weird.', 'I flipped a coin to decide my strategy. It landed on its side.'],
    bid: ['Why not?', 'My horoscope said bid.', 'Vibes say yes.', 'I don’t even know what this is.'],
    jump: ['SURPRISE!', 'Chaos tax: applied.', 'Big number because I said so.'],
    win: ['I meant to do that.', 'No idea why I wanted this. Love it.', 'Chaos reigns!'],
    steal: ['Got it cheap. Accidentally.'],
    lose: ['I wasn’t even trying. Mostly.', 'Plot twist incoming.', 'You win this round, sensible person.'],
    free: ['Random pick, random glory.', 'Eeny, meeny, mine.'],
    rival: ['Bold. I like bold.', 'Respect the madness.'],
  },
};
const talkMemory = new Map(); // bot id → recently used lines
function botLine(bot, event, extra) {
  const lines = (TALK[bot.bot.type] || {})[event];
  if (!lines || !lines.length) return null;
  const recent = talkMemory.get(bot.id) || [];
  const fresh = lines.filter((l) => !recent.includes(l));
  const pool = fresh.length ? fresh : lines;
  const line = pool[Math.floor(Math.random() * pool.length)];
  talkMemory.set(bot.id, [...recent, line].slice(-6));
  return line.replace('{slot}', (extra && extra.slot) || 'player');
}
// How often each event gets a speech bubble (so they don't talk constantly).
TALK.spender.card = ['Rules are for people with less money.', 'Activating my secret weapon.'];
TALK.bargain.card = ['A little trick I picked up at a yard sale.', 'Free value? Don’t mind if I do.'];
TALK.needs.card = ['Exactly as planned.', 'This card fills a hole.'];
TALK.chaos.card = ['Let’s spice things up!', 'I pressed a button. Something happened.'];
['spender', 'bargain', 'needs', 'chaos'].forEach((k) => {
  TALK[k].advise = ['I’d go up to {slot} for this one.', 'Worth {slot}, tops.', 'Let’s grab this. Max {slot}.'];
  TALK[k].pass = ['Let this one go.', 'Not for us. Save the money.'];
  TALK[k].nominate = ['Let’s see who wants this one.', 'Up next: my pick.'];
});
const TALK_CHANCE = { card: 0.9, advise: 0.6, pass: 0.4, nominate: 0.4, start: 1, bid: 0.22, jump: 0.75, win: 0.6, steal: 0.85, lose: 0.45, free: 0.5, rival: 0.45, need: 0.35 };


/* ---------- chaos cards ---------- */
// Bots consider a card once per item, before the first bid, and play it only if it helps.
function botCardPlay(d, bot) {
  if (!cardWindow(d) || !d.cards || !(d.cards[bot.id] || []).length) return null;
  const L = botLevel(bot); const type = bot.bot.type;
  const rng = seeded(d.seed, d.reveal, 'card', bot.speaker || bot.id);
  if (rng() < (type === 'chaos' ? 0.45 : 0.72)) return null; // most items, no card
  const item = visibleItem(d, d.queue[0]);
  const fair = d.rules.budget / d.rules.slots.length;
  const rivals = d.managers.filter((m) => m.id !== bot.id);
  const opts = [];
  if (hasCard(d, bot.id, 'freeze') && assignSlot(bot, item, d.rules.slots) >= 0) {
    const v = botValue(d, bot, item, rng);
    const threat = rivals.filter((m) => !isFull(m) && assignSlot(m, item, d.rules.slots) >= 0).sort((a, b) => maxBid(b, d.rules) - maxBid(a, d.rules))[0];
    const want = type === 'spender' ? itemFame(item) > 0.6 : type === 'needs' ? scarcityOf(d, item) > 1.1 : type === 'bargain' ? v > fair * 0.9 : rng() < 0.5;
    if (threat && want && v > fair * (type === 'chaos' ? 0.5 : 0.9) && !cardProblem(d, bot.id, 'freeze', { target: threat.id })) opts.push({ card: 'freeze', params: { target: threat.id }, gain: v * 0.6 });
  }
  if (hasCard(d, bot.id, 'steal')) {
    rivals.forEach((m) => m.team.forEach((t) => {
      if (!t) return;
      const it = d.items[t.itemId];
      if (cardProblem(d, bot.id, 'steal', { target: m.id, item: t.itemId })) return;
      const v = botValue(d, bot, it, rng); const cost = stealPrice(d, t);
      const edge = type === 'bargain' ? 0.65 : type === 'spender' ? 1.1 : 0.85;
      if (v - cost * edge > fair * 0.3) opts.push({ card: 'steal', params: { target: m.id, item: t.itemId }, gain: v - cost });
    }));
  }
  if (hasCard(d, bot.id, 'swap')) {
    bot.team.forEach((mine) => { if (!mine) return; rivals.forEach((m) => m.team.forEach((t) => {
      if (!t || cardProblem(d, bot.id, 'swap', { target: m.id, item: t.itemId, mine: mine.itemId })) return;
      const gain = botValue(d, bot, d.items[t.itemId], () => 0.5) - botValue(d, bot, d.items[mine.itemId], () => 0.5);
      if (gain > fair * 0.35) opts.push({ card: 'swap', params: { target: m.id, item: t.itemId, mine: mine.itemId }, gain });
    })); });
  }
  if (!opts.length) return null;
  // Easy bots grab any option; hard bots take the best one.
  const pick = L.noise > 0.3 ? opts[Math.floor(rng() * opts.length)] : opts.sort((a, b) => b.gain - a.gain)[0];
  return { ...pick, botId: bot.id, speaker: bot.speaker || bot.id, delay: clamp(Math.round(800 + rng() * 900), 650, 2200) };
}
// A bot targeted by a card decides whether to spend its Veto.
function botVeto(d, team, play) {
  if (!hasCard(d, team.id, 'veto')) return false;
  const actor = isBotTeam(team) ? { ...team, name: team.members[0].name, bot: team.members[0].bot, speaker: team.members[0].id } : team;
  if (!actor.bot) return false;
  const rng = seeded(d.seed, 'veto', play.id);
  const fair = d.rules.budget / d.rules.slots.length;
  if (actor.bot.type === 'chaos') return rng() < 0.6;
  if (play.card === 'freeze') { const item = visibleItem(d, d.queue[0]); return !!item && botValue(d, actor, item, rng) > fair * 0.9; }
  const lost = play.card === 'steal' ? d.items[play.item] : d.items[play.item];
  const loss = botValue(d, actor, lost, () => 0.5) - (play.card === 'swap' ? botValue(d, actor, d.items[play.mine], () => 0.5) : 0);
  return loss > fair * (botLevel(actor).noise > 0.3 ? 0.2 : 0.45);
}

/* ---------- nomination ---------- */
// Bots nominate something that suits them: gaps for strategists, stars for spenders,
// things a rich rival will overpay for (or cheap gems) for bargain hunters, anything for chaos.
function botNominate(d, bot) {
  const pool = nominationPool(d);
  if (!pool.length) return null;
  const L = botLevel(bot); const type = bot.bot.type;
  const rng = seeded(d.seed, 'nom', d.reveal, bot.speaker || bot.id);
  const score = (id) => {
    const it = visibleItem(d, id); const fame = itemFame(it);
    const mine = assignSlot(bot, it, d.rules.slots) >= 0 ? botValue(d, bot, it, () => 0.5) : 0;
    let s;
    if (type === 'needs') s = mine * (assignSlot(bot, it, d.rules.slots) >= 0 && !isFlex(d.rules.slots[assignSlot(bot, it, d.rules.slots)]) ? 1.5 : 0.4);
    else if (type === 'spender') s = mine + fame * 8;
    else if (type === 'bargain') s = mine > 0 ? mine * (1.4 - fame) : fame * 3; // cheap gems, or drain rivals with a star
    else s = rng() * 10 + mine * 0.3;
    return s * (1 + (rng() - 0.5) * 2 * L.noise);
  };
  return pool.map((id) => ({ id, s: score(id) })).sort((a, b) => b.s - a.s)[0].id;
}

/* ---------- trades ---------- */
// How much a team (seen by this bot) gains from a trade, in dollars.
function tradeGain(d, bot, t) {
  const me = bot.id; const fair = d.rules.budget / d.rules.slots.length;
  const giveId = t.from === me ? t.give : t.get; const getId = t.from === me ? t.get : t.give;
  const val = (id) => { const r = rarityOf(d, id); return botValue(d, { ...bot, team: bot.team.map((x) => (x && x.itemId === giveId ? null : x)) }, d.items[id], () => 0.5) * (r === 'legendary' ? 1.12 : r === 'rare' ? 1.04 : 1); };
  let gain = val(getId) - val(giveId);
  if (t.money && t.money.amount) gain += (t.money.payer === me ? -1 : 1) * t.money.amount * 0.9;
  return { gain, fair };
}
// A bot's answer to a trade offered to its team, with a short reason.
function botTradeDecision(d, bot, t) {
  if (tradeProblem(d, t)) return { accept: false, reason: 'That trade doesn’t work any more.' };
  const L = botLevel(bot); const type = bot.bot.type;
  const rng = seeded(d.seed, 'trade', t.id, bot.speaker || bot.id);
  const { gain, fair } = tradeGain(d, bot, t);
  const noisy = gain + (rng() - 0.5) * 2 * L.noise * fair;
  const need = type === 'bargain' ? fair * 0.3 : type === 'spender' ? -fair * 0.1 : type === 'needs' ? fair * 0.1 : -fair * 0.25;
  const accept = type === 'chaos' ? noisy > need && rng() < 0.75 : noisy > need;
  const reason = accept ? (gain > fair * 0.4 ? 'Deal! I like this a lot.' : 'Fair enough, deal.') : gain < -fair * 0.4 ? 'No chance. That’s a downgrade for us.' : 'Not quite worth it for us.';
  return { accept, reason };
}
// A bot team's best trade idea, offered to a rival team (one offer per window).
function botTradeOffer(d, bot) {
  const fair = d.rules.budget / d.rules.slots.length;
  const rng = seeded(d.seed, 'offer', bot.speaker || bot.id);
  if (rng() < (botLevel(bot).rivals ? 0.25 : 0.5)) return null;
  let best = null;
  bot.team.forEach((mine) => { if (!mine) return; d.managers.forEach((m) => { if (m.id === bot.id) return; m.team.forEach((t) => {
    if (!t) return;
    const offer = { from: bot.id, to: m.id, give: mine.itemId, get: t.itemId, money: null };
    if (tradeProblem(d, offer)) return;
    const { gain } = tradeGain(d, bot, offer);
    // Only suggest trades that look fair to the other side too (judged on public info).
    const theirSide = (itemFame(d.items[mine.itemId]) - itemFame(d.items[t.itemId])) * fair;
    if (gain > fair * 0.25 && theirSide > -fair * 0.35 && (!best || gain > best.gain)) best = { ...offer, gain };
  }); }); });
  if (!best) return null;
  const { gain, ...offer } = best;
  // Sweeten a lopsided offer with a little money when allowed.
  if (d.rules.trades.money && gain > fair * 0.8 && bot.budget >= 1) offer.money = { payer: bot.id, amount: Math.min(bot.budget, Math.max(1, Math.round(gain * 0.25))) };
  return offer;
}
