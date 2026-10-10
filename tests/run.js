// Draft Night tests: game rules (200 random drafts), data checks, and a full
// click-through of the app in a simulated browser (jsdom) with Wikipedia mocked.
// Run: npm test   (after npm install)
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
let failures = 0;
const ok = (cond, msg) => { if (cond) console.log('  ✓ ' + msg); else { failures++; console.log('  ✗ ' + msg); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function boot({ idb = true, fetchImpl, storage, speed } = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '').replace(/<link[^>]*>/g, ''), {
    url: 'https://sad-cpu141.github.io/draft-night/', runScripts: 'outside-only', pretendToBeVisual: true,
  });
  const w = dom.window;
  w.__DN_TEST__ = true;
  w.addEventListener('error', (e) => console.log('    PAGE ERROR:', e.error && (e.error.stack || e.error.message)));
  const origErr = w.console.error; w.console.error = (...a) => { console.log('    CONSOLE.ERROR:', String(a[0]).slice(0, 600)); };
  if (speed) w.__DN_TEST_SPEED = speed;
  w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  w.scrollTo = () => {};
  w.navigator.vibrate = () => true;
  w.URL.createObjectURL = () => 'blob:test'; w.URL.revokeObjectURL = () => {};
  w.HTMLCanvasElement.prototype.getContext = () => null;
  w.requestAnimationFrame = (f) => setTimeout(() => f(Date.now()), 16); w.cancelAnimationFrame = clearTimeout;
  if (idb) { const fake = require('fake-indexeddb'); w.indexedDB = fake.indexedDB; w.IDBKeyRange = fake.IDBKeyRange; }
  if (storage) Object.entries(storage).forEach(([k, v]) => w.localStorage.setItem(k, v));
  w.fetch = fetchImpl || (async () => { throw new Error('offline'); });
  for (const f of ['vendor/react.production.min.js', 'vendor/react-dom.production.min.js', 'app.js']) w.eval(fs.readFileSync(path.join(root, f), 'utf8'));
  await sleep(150);
  return { dom, w, d: w.document, DN: w.__DN };
}
const $ = (d, sel) => d.querySelector(sel);
const btn = (d, text) => [...d.querySelectorAll('button,[role=button]')].find((b) => b.textContent.replace(/\s+/g, ' ').trim().toLowerCase().includes(text.toLowerCase()));
async function click(w, el) { if (!el) throw new Error('missing element'); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); await sleep(30); }
async function tap(w, el) { el.dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true })); el.dispatchEvent(new w.MouseEvent('pointerup', { bubbles: true })); await sleep(30); }

(async () => {
  console.log('Game rules');
  {
    const { DN } = await boot();
    const ts = DN.starterTopics();
    ok(ts.length === 48, '48 starter topics (' + ts.length + ')');
    const ids = new Set(); let dup = false; ts.forEach((t) => { if (ids.has(t.id)) dup = true; ids.add(t.id); t.items.forEach((i) => { if (ids.has(i.id)) dup = true; ids.add(i.id); }); });
    ok(!dup, 'all topic and item ids unique');
    ok(ts.every((t) => t.items.every((i) => !i.pos || t.slots.some((s) => s.toUpperCase() === i.pos.toUpperCase()))), 'every item position matches a slot');
    ok(Object.keys(DN.PHOTO_TOPICS).every((id) => ts.some((t) => t.id === id)), 'photo settings only reference real topics');
    const mapped = Object.entries(DN.PHOTO_TOPICS).flatMap(([id, m]) => Object.keys(m).filter((n) => !ts.find((t) => t.id === id).items.some((i) => i.name === n)).map((n) => id + ':' + n));
    ok(!mapped.length, 'every Wikipedia page mapping matches a real item' + (mapped.length ? ' — unmatched: ' + mapped.join(', ') : ''));
    let stuck = 0, neg = 0, dupPlaced = 0;
    for (let run = 0; run < 200; run++) {
      const t = ts[run % ts.length];
      const ms = Array.from({ length: 2 + (run % 7) }, (_, i) => ({ id: 'm' + i, name: 'M' + i, color: DN.COLORS[i], emoji: 'x' }));
      let d = DN.createDraft(t, ms, { ...DN.DEFAULT_RULES, slots: t.slots, noBids: run % 2 ? 'back' : 'skip', mustFill: run % 3 !== 0, timer: 0 });
      let steps = 0;
      while (d.phase !== 'done' && steps++ < 3000) {
        if (d.phase === 'auction') {
          const r = Math.random();
          if (r < 0.1) { d = DN.skipItem(d); continue; }
          if (r < 0.13 && d.history.length) { d = DN.undo(d); continue; }
          const k = Math.floor(Math.random() * 6);
          for (let j = 0; j < k; j++) { const m = d.managers[Math.floor(Math.random() * d.managers.length)]; d = DN.placeBid(d, m.id, DN.nextAmount(d) + (Math.random() < 0.2 ? 3 : 0)); }
          d = d.bid ? DN.sell(d) : DN.skipItem(d);
        } else { const cp = DN.currentPicker(d); d = DN.freePick(d, d.leftover.find((x) => DN.canTake(d, cp.m, x))); }
        if (d.managers.some((m) => m.budget < 0)) neg++;
      }
      if (d.phase !== 'done') stuck++;
      const placed = d.managers.flatMap((m) => m.team.filter(Boolean).map((x) => x.itemId));
      if (new Set(placed).size !== placed.length) dupPlaced++;
      DN.draftStats(d);
    }
    ok(stuck === 0, '200 random drafts all finish');
    ok(neg === 0, 'no manager ever goes below $0');
    ok(dupPlaced === 0, 'no item is ever placed twice');
    const t = ts[0]; const ms = [{ id: 'a', name: 'A', color: '#ff0000', emoji: 'x' }, { id: 'b', name: 'B', color: '#00ff00', emoji: 'y' }];
    let d = DN.createDraft(t, ms, { ...DN.DEFAULT_RULES, slots: t.slots });
    d = DN.placeBid(d, 'a', 1); d = DN.placeBid(d, 'a', 2); d = DN.placeBid(d, 'a', 3);
    ok(d.bid.amount === 3, 'tapping the leader again raises their own bid');
    const before = d.managers[0].budget; d = DN.sell(d); d = DN.undo(d);
    ok(d.managers[0].budget === before, 'undo of a sale refunds the money');
  }

  console.log('Wikipedia photos');
  {
    let calls = 0; const asked = [];
    const fetchImpl = async (url) => {
      calls++;
      const titles = decodeURIComponent(new URL(url).searchParams.get('titles')).split('|'); asked.push(...titles);
      return { ok: true, json: async () => ({ query: {
        normalized: [], redirects: titles.includes('Alisson Becker') ? [{ from: 'Alisson Becker', to: 'Alisson (footballer)' }] : [],
        pages: titles.map((t) => (t === 'Alisson Becker' ? { title: 'Alisson (footballer)', thumbnail: { source: 'https://upload.wikimedia.org/alisson.jpg' } }
          : t === 'Dave (rapper)' ? { title: t, pageprops: { disambiguation: '' } }
          : t === 'Nobody Here' ? { title: t, missing: true }
          : { title: t, thumbnail: { source: 'https://upload.wikimedia.org/' + encodeURIComponent(t) + '.jpg' } })),
      } }) };
    };
    const { w, DN } = await boot({ fetchImpl });
    const ts = DN.starterTopics();
    const cf = ts.find((t) => t.id === 't-cf'); const rap = ts.find((t) => t.id === 't-rap'); const pow = ts.find((t) => t.id === 't-pow');
    ok(DN.wikiTitleFor(cf.items.find((i) => i.name === 'Alisson'), cf) === 'Alisson Becker', 'mapped page name used (Alisson → Alisson Becker)');
    ok(DN.wikiTitleFor(cf.items.find((i) => i.name === 'Kylian Mbappé'), cf) === 'Kylian Mbappé', 'default page name is the item name');
    ok(DN.wikiTitleFor(pow.items[0], pow) === null, 'abstract topics (Superpowers) never look up photos');
    ok(DN.wikiTitleFor({ ...cf.items[0], photosOff: true }, cf) === null, 'per-item “no photo” switch respected');
    DN.wiki.prefetch(cf.items.map((i) => DN.wikiTitleFor(i, cf)).concat(['Dave (rapper)', 'Nobody Here']));
    await sleep(120);
    ok(calls === 1, 'a whole topic is fetched in one batched request (' + calls + ')');
    ok(DN.wiki.peek('Alisson Becker') === 'https://upload.wikimedia.org/alisson.jpg', 'redirects followed to the right photo');
    ok(DN.wiki.peek('Dave (rapper)') === null, 'disambiguation pages give no photo (falls back)');
    ok(DN.wiki.peek('Nobody Here') === null, 'missing pages give no photo (falls back)');
    DN.wiki.prefetch(['Alisson Becker']); await sleep(500);
    ok(calls === 1, 'cached lookups are not fetched again');
    ok(!!w.localStorage.getItem('dn_wiki_cache_v1'), 'lookup cache saved for next visit');
  }

  console.log('Full app click-through');
  {
    const fetchImpl = async (url) => ({ ok: true, json: async () => {
      const titles = decodeURIComponent(new URL(url).searchParams.get('titles')).split('|');
      return { query: { pages: titles.map((t) => ({ title: t, thumbnail: { source: 'https://upload.wikimedia.org/' + encodeURIComponent(t) + '.jpg' } })) } };
    } });
    const { w, d, DN } = await boot({ fetchImpl });
    ok(!!btn(d, 'Solo') && !!btn(d, 'Local') && !!btn(d, 'Online'), 'home screen shows Solo, Local and Online');
    ok(DN.store.backend === 'indexeddb', 'storage uses IndexedDB');
    await click(w, btn(d, 'Local'));
    await click(w, btn(d, 'Next: pick a topic'));
    await click(w, btn(d, 'Sports'));
    await click(w, btn(d, 'Current Footballers'));
    ok(!!btn(d, 'Start the draft'), 'rules screen reached');
    await click(w, btn(d, 'Start the draft'));
    ok(/Item 1 of/.test(d.body.textContent), 'auction started');
    await sleep(150);
    const img = d.querySelector('.itemcard .ph img');
    ok(img && /upload\.wikimedia\.org/.test(img.src), 'auction card shows the Wikipedia photo');
    ok(!!d.querySelector('.itemcard .credit'), 'photo credit link shown');
    img.dispatchEvent(new w.Event('error')); await sleep(30);
    ok(!d.querySelector('.itemcard .ph img') && d.querySelector('.itemcard .ph svg'), 'broken photo falls back to the jersey');
    // play the whole draft by tapping managers and SOLD
    for (let i = 0; i < 400 && !/Final teams|We have a winner/.test(d.body.textContent); i++) {
      const sold = btn(d, 'Sold!');
      if (sold) {
        const m = [...d.querySelectorAll('.mgr')].find((x) => x.getAttribute('aria-disabled') === 'false');
        if (m) { await tap(w, m); await click(w, btn(d, 'Sold!')); await sleep(560); }
        else await click(w, btn(d, 'No bids'));
        const fl = d.querySelector('.flash'); if (fl) await click(w, fl);
      } else {
        const pick = d.querySelector('.pickbtn'); if (pick) { await click(w, pick); const fl = d.querySelector('.flash'); if (fl) await click(w, fl); } else break;
      }
    }
    ok(/Final teams/.test(d.body.textContent), 'draft played to the results screen by tapping');
    await click(w, btn(d, 'Start the secret vote'));
    const names = [...d.querySelectorAll('.votegrid .votebtn')];
    ok(names.length === 4, 'vote screen lists all 4 managers');
    for (let i = 0; i < 4; i++) {
      await click(w, [...d.querySelectorAll('.votegrid .votebtn')].find((b) => !b.disabled));
      await click(w, d.querySelectorAll('.modal .votebtn')[0]);
      const lock = btn(d, 'Lock in');
      ok(lock && !lock.disabled, 'Lock in button enabled after picking (voter ' + (i + 1) + ')');
      await click(w, lock);
      ok(/Vote locked/.test(d.body.textContent), 'Lock in records the vote (voter ' + (i + 1) + ')');
      await click(w, btn(d, 'Next voter'));
    }
    await click(w, btn(d, 'Reveal winner'));
    ok(/We have a winner/.test(d.body.textContent), 'winner revealed');
    ok(/All-time wins/.test(d.body.textContent) && /Vote tally/.test(d.body.textContent), 'vote tally and all-time leaderboard shown');
    await sleep(300); await DN.store.flush();
    // backup round trip
    const state = { topics: DN.store.get('dn_topics_v1'), past: DN.store.get('dn_past_v1'), draft: DN.store.get('dn_current_v1'), managers: DN.store.get('dn_managers_v1') };
    ok(state.past && state.past.length === 1, 'finished draft saved to Past Drafts');
    state.topics[0].items[0].photo = 'data:image/jpeg;base64,AAAA';
    const backup = JSON.parse(JSON.stringify(DN.makeBackup(state)));
    const v = DN.validateBackup(backup);
    ok(v.ok && v.summary.photos === 1 && v.summary.past === 1, 'backup validates and keeps uploaded photos');
    ok(!DN.validateBackup({ app: 'other' }).ok, 'non-backup files rejected');
    ok(!DN.validateBackup({ app: 'draft-night', format: 99, data: {} }).ok, 'backups from newer versions rejected with a message');
    ok(!DN.validateBackup({ app: 'draft-night', format: 1, data: { topics: [{ id: 1 }], past: [] } }).ok, 'damaged backups rejected');
    // settings screen renders
    await click(w, btn(d, 'Finish'));
    await click(w, btn(d, 'Backup & app settings'));
    ok(/Export backup/.test(d.body.textContent) && /Import backup/.test(d.body.textContent), 'backup screen shows export and import');
    ok(/Add to Home Screen/.test(d.body.textContent), 'install instructions shown');
  }

  console.log('Bots: setup and rules');
  {
    const { DN } = await boot();
    const B = DN.bots;
    for (let n = 1; n <= 7; n++) {
      const bs = B.makeBots(n, 'medium', 'seed' + n, ['#3d8bff']);
      const names = new Set(bs.map((b) => b.name));
      const firstTypes = new Set(bs.slice(0, 4).map((b) => b.bot.type));
      if (bs.length !== n || names.size !== n || firstTypes.size !== Math.min(4, n) || bs.some((b) => b.color === '#3d8bff')) { ok(false, n + ' bots: unique names, all 4 personalities before repeats'); break; }
      if (n === 7) ok(true, '1–7 bots get unique funny names and all 4 personalities before any repeat');
    }
    ok(DN.DEFAULT_SOLO.bots === 3 && DN.DEFAULT_SOLO.talk === true, 'defaults: 3 bots, trash talk on');
    const ts = DN.starterTopics();
    // Simulated solo drafts with no UI: bots decide, a simple "human" sometimes bids.
    const sim = (topic, bots, humanBids, seed) => {
      const human = { id: 'you', name: 'You', color: '#3d8bff', emoji: 'x', human: true };
      let d = DN.createDraft(topic, [human, ...bots], { ...DN.DEFAULT_RULES, slots: topic.slots }, { mode: 'solo', solo: { level: 'medium', talk: true, clock: 8 }, seed });
      let steps = 0, illegal = 0, bids = 0, jumps = 0;
      const flexBids = sim.flexBids || (sim.flexBids = {});
      const rnd = DN.bots.seeded('h', seed);
      while (d.phase !== 'done' && steps++ < 6000) {
        if (d.phase === 'auction') {
          const plan = B.nextBotAction(d);
          if (plan) {
            const bm = d.managers.find((m) => m.id === plan.botId); const slot = DN.assignSlot(bm, d.items[d.queue[0]], d.rules.slots);
            const T = bm.bot.type; flexBids[T] = flexBids[T] || { flex: 0, all: 0 }; if (d.rules.slots.some(DN.isFlex)) { flexBids[T].all++; const gaps = d.rules.slots.some((sl, k) => !bm.team[k] && !DN.isFlex(sl)); if (DN.isFlex(d.rules.slots[slot]) && gaps) flexBids[T].flex++; }
            const nd = DN.placeBid(d, plan.botId, plan.amount); if (nd === d) { illegal++; d = d.bid ? DN.sell(d) : DN.skipItem(d); } else { bids++; if (plan.event === 'jump') jumps++; d = nd; } continue; }
          const you = d.managers[0];
          if (humanBids && rnd() < 0.35 && DN.canBid(d, you, DN.nextAmount(d))) { d = DN.placeBid(d, 'you', DN.nextAmount(d)); continue; }
          d = d.bid ? DN.sell(d) : DN.skipItem(d);
        } else {
          const cp = DN.currentPicker(d);
          const pick = cp.m.bot ? B.botFreePickChoice(d, cp.m) : d.leftover.find((x) => DN.canTake(d, cp.m, x));
          d = DN.freePick(d, pick);
        }
      }
      return { d, done: d.phase === 'done', illegal, bids, jumps, neg: d.managers.some((m) => m.budget < 0) };
    };
    let allDone = true, illegal = 0, neg = false;
    const per = { spender: { paid: 0, n: 0, fame: 0, jumps: 0 }, bargain: { paid: 0, n: 0, fame: 0 }, needs: { exact: 0, n: 0 }, chaos: { exact: 0, n: 0 } };
    let jumpsBy = { spender: 0, bargain: 0, needs: 0, chaos: 0 };
    for (let r = 0; r < 160; r++) {
      const topic = ts[r % ts.length];
      const bots = B.makeBots(4, 'medium', 'p' + r, ['#3d8bff']);
      const res = sim(topic, bots, r % 2 === 0, 'run' + r);
      if (!res.done) allDone = false; illegal += res.illegal; if (res.neg) neg = true;
      res.d.managers.filter((m) => m.bot).forEach((m) => {
        const T = m.bot.type;
        m.team.forEach((t, i) => {
          if (!t || t.free) return;
          if (per[T].paid !== undefined) { per[T].paid += t.price; per[T].n++; per[T].fame += B.itemFame(res.d.items[t.itemId]); }
        });
        if (T === 'needs' || T === 'chaos') m.team.forEach((t, i) => { if (!t) return; per[T].n++; const it = res.d.items[t.itemId]; if (!DN.isFlex(res.d.rules.slots[i])) per[T].exact++; });
      });
    }
    ok(allDone, '160 simulated solo drafts (4 bots + you) all finish');
    ok(illegal === 0, 'bots never make an illegal bid (' + illegal + ')');
    ok(!neg, 'no bot or player ever goes below $0');
    const avg = (o) => o.paid / Math.max(1, o.n);
    ok(avg(per.spender) > avg(per.bargain) * 1.3, 'Big Spender pays more per item than Bargain Hunter ($' + avg(per.spender).toFixed(2) + ' vs $' + avg(per.bargain).toFixed(2) + ')');
    ok(per.spender.fame / per.spender.n > per.bargain.fame / per.bargain.n, 'Big Spender buys more famous items than Bargain Hunter');
    const fb = sim.flexBids; const rate = (t) => fb[t].flex / Math.max(1, fb[t].all);
    ok(rate('needs') < rate('chaos') * 0.6 && rate('needs') < rate('spender') * 0.6, 'Position Strategist rarely bids on filled positions while it still has gaps ('  + Math.round(100 * rate('needs')) + '% vs Chaos ' + Math.round(100 * rate('chaos')) + '%, Spender ' + Math.round(100 * rate('spender')) + '%)');
    // Difficulty: hard and easy bots of the same personality at the same table.
    let hardScore = 0, easyScore = 0, hardSpentWell = 0, easySpentWell = 0;
    for (let r = 0; r < 120; r++) {
      const topic = ts[r % ts.length];
      const hard = B.makeBots(4, 'hard', 'd' + r, ['#3d8bff']);
      const easy = B.makeBots(4, 'easy', 'd' + r, ['#3d8bff']).map((b, i) => ({ ...b, id: 'easy-' + i, name: b.name + ' Jr.', bot: { type: hard[i].bot.type, level: 'easy' } }));
      const res = sim(topic, [...hard, ...easy], false, 'diff' + r);
      res.d.managers.forEach((m) => {
        if (!m.bot) return;
        const sc = B.teamScore(res.d, m, null);
        if (m.bot.level === 'hard') hardScore += sc; else easyScore += sc;
      });
    }
    ok(hardScore > easyScore * 1.05, 'Hard bots build stronger teams than Easy bots at the same table (' + Math.round(hardScore) + ' vs ' + Math.round(easyScore) + ')');
    const L = DN.bots.BOT_LEVELS;
    ok(L.easy.noise > L.medium.noise && L.medium.noise > L.hard.noise && L.easy.miss > L.hard.miss, 'difficulty changes judgement noise and attention, not money');
    // Determinism
    const t0 = ts[0]; const bs = B.makeBots(3, 'medium', 'det', []);
    const d0 = DN.createDraft(t0, [{ id: 'you', name: 'You', color: '#3d8bff', emoji: 'x', human: true }, ...bs], { ...DN.DEFAULT_RULES, slots: t0.slots }, { mode: 'solo', solo: {}, seed: 'fixed' });
    ok(JSON.stringify(B.nextBotAction(d0)) === JSON.stringify(B.nextBotAction(d0)), 'bot decisions are reproducible for the same game state');
    // Voting
    const res = sim(ts[1], B.makeBots(3, 'hard', 'v', []), true, 'vote');
    const votes = res.d.managers.filter((m) => m.bot).map((m) => [m.id, B.botVote(res.d, m)]);
    ok(votes.every(([a, b]) => b && a !== b), 'bots never vote for their own team');
    const two = sim(ts[2], B.makeBots(1, 'medium', 'two', []), true, 'two').d;
    const bv = B.botVote(two, two.managers[1]);
    two.votes = { you: two.managers[1].id, [two.managers[1].id]: bv }; two.votesRevealed = true;
    ok(bv === 'you' && DN.tally(two).winners.length === 2, '1 bot vs you: each votes for the other, shown as a tie');
    const empty = { ...two, managers: two.managers.map((m, i) => (i === 1 ? { ...m, team: m.team.map(() => null) } : m)) };
    ok(B.voteChoices(empty, 'you').length === 0 && B.botVote(empty, empty.managers[1]) === 'you', 'teams with no items can’t receive votes; nobody is left stuck');
  }

  console.log('Solo game in the app (sped-up clock)');
  {
    const { w, d, DN } = await boot({ speed: 0.02 });
    await click(w, btn(d, 'Online'));
    ok(/coming in a later update/i.test(d.body.textContent) && !!btn(d, 'Solo'), 'Online shows Coming Soon and stays on the home screen');
    await click(w, btn(d, 'Solo'));
    const startOver = [...d.querySelectorAll('.modal button')].find((x) => /New draft/.test(x.textContent));
    if (startOver) await click(w, startOver);
    ok(/You vs the bots/.test(d.body.textContent), 'Solo opens the solo setup');
    ok(d.querySelectorAll('.botrow').length === 3, '3 bots by default');
    const names = [...d.querySelectorAll('.botrow b')].map((b) => b.textContent);
    ok(names.length === 3 && new Set(names).size === 3, 'bot names shown: ' + names.join(', '));
    await click(w, btn(d, 'Start solo draft'));
    ok(/Item 1 of/.test(d.body.textContent) && !!btn(d, 'Bid $'), 'solo auction started with a Bid button');
    let sawThinking = false, sawBubble = false, sawBotLead = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 120000) {
      if (d.querySelector('.mgr.thinking')) sawThinking = true;
      if (d.querySelector('.mgr .bubble, .bubble.inline')) sawBubble = true;
      const lead = d.querySelector('.mgr.isLead'); if (lead && !lead.classList.contains('you')) sawBotLead = true;
      if (/Vote for the best team/.test(d.body.textContent)) break;
      const fl = d.querySelector('.flash'); if (fl && Math.random() < 0.3) await click(w, fl);
      const pickBtn = [...d.querySelectorAll('.pickbtn')].find((b) => !b.disabled); if (pickBtn) await click(w, pickBtn);
      // You bid now and then.
      const bid = btn(d, 'Bid $'); if (bid && !bid.disabled && Math.random() < 0.04) await click(w, bid);
      await sleep(20);
    }
    if (!/Vote for the best team/.test(d.body.textContent)) { const c = DN.store.get('dn_current_v1') || {}; console.log('    STALL:', c.phase, 'processed', c.processed, 'queue', (c.queue || []).length, 'bid', JSON.stringify(c.bid), '| screen:', d.body.textContent.slice(0, 300)); }
    ok(/Vote for the best team/.test(d.body.textContent), 'solo draft runs to the results on its own');
    ok(sawThinking, 'bots show when they are thinking');
    ok(sawBotLead, 'bots place bids');
    ok(sawBubble, 'trash-talk bubbles appear');
    await sleep(150);
    const before = JSON.stringify(DN.store.get('dn_current_v1'));
    await sleep(600);
    const after = JSON.stringify(DN.store.get('dn_current_v1'));
    if (after !== before) { const A = JSON.parse(before), B2 = JSON.parse(after); console.log('    changed keys:', Object.keys(B2).filter((k) => JSON.stringify(A[k]) !== JSON.stringify(B2[k])).join(', '), A.phase, B2.phase); }
    ok(after === before, 'bots stop acting once the draft is over');
    await click(w, btn(d, 'Vote for the best team'));
    const choices = [...d.querySelectorAll('.modal .votebtn')];
    ok(choices.length >= 1 && !choices.some((c) => /You\b/.test(c.textContent.split('·')[0])), 'you can’t vote for your own team');
    await click(w, choices[0]);
    await click(w, btn(d, 'Lock in'));
    ok(/bots are voting/i.test(d.body.textContent), 'after you lock in, the bots vote');
    await sleep(200);
    const cur = DN.store.get('dn_current_v1') || {};
    const v = cur.votes || {};
    ok(cur.votesRevealed && Object.keys(v).length === 4 && Object.entries(v).every(([a, b]) => a !== b), 'everyone voted once, nobody for themselves');
    ok(/Vote tally/.test(d.body.textContent) && !!btn(d, 'Play again'), 'results revealed with standings and Play again');
    await click(w, btn(d, 'Play again'));
    ok(/Item 1 of/.test(d.body.textContent), 'Play again starts a fresh solo draft');
    await click(w, d.querySelector('[aria-label="Home"]'));
    ok(/Draft in progress/.test(d.body.textContent) && /Solo · Medium/.test(d.body.textContent), 'leaving mid-draft keeps it resumable');
    // Trash talk off
    const b2 = await boot({ speed: 0.02 });
    await click(b2.w, btn(b2.d, 'Solo'));
    const so2 = [...b2.d.querySelectorAll('.modal button')].find((x) => /New draft/.test(x.textContent));
    if (so2) await click(b2.w, so2);
    await click(b2.w, b2.d.querySelector('.toggle'));
    await click(b2.w, btn(b2.d, 'Start solo draft'));
    let bubbles = 0; const t1 = Date.now();
    while (Date.now() - t1 < 4000) { if (b2.d.querySelector('.bubble')) bubbles++; await sleep(20); }
    ok(bubbles === 0 && /Item/.test(b2.d.body.textContent), 'trash talk can be turned off');
  }

  console.log('Persistence after refresh');
  {
    const fake = require('fake-indexeddb');
    const a = await boot();
    a.DN.store.set('dn_managers_v1', [{ id: 'z', name: 'Zed', color: '#ff0000', emoji: 'x' }]);
    await a.DN.store.flush();
    const b = await boot();
    ok(JSON.stringify(b.DN.store.get('dn_managers_v1')).includes('Zed'), 'data survives a reload (IndexedDB)');
    const c = await boot({ idb: false, storage: { dn_managers_v1: JSON.stringify([{ id: 'q', name: 'Old', color: '#00ff00', emoji: 'y' }]) } });
    ok(c.DN.store.backend === 'localStorage' && c.DN.store.get('dn_managers_v1')[0].name === 'Old', 'falls back to localStorage when IndexedDB is unavailable');
    void fake;
  }

  console.log(failures ? '\n' + failures + ' FAILED' : '\nAll tests passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
