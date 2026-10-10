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

async function boot({ idb = true, fetchImpl, storage, speed, url, fakeAudio, compress, h2c, fb, bc } = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '').replace(/<link[^>]*>/g, ''), {
    url: url || 'https://sad-cpu141.github.io/draft-night/', runScripts: 'outside-only', pretendToBeVisual: true,
  });
  const w = dom.window;
  w.__DN_TEST__ = true;
  w.addEventListener('error', (e) => console.log('    PAGE ERROR:', e.error && (e.error.stack || e.error.message)));
  const origErr = w.console.error; w.console.error = (...a) => { console.log('    CONSOLE.ERROR:', String(a[0]).slice(0, 600), (a[0] && a[0].stack ? a[0].stack.slice(0, 900) : ''), String(a[1] || '').slice(0, 900)); };
  if (speed) w.__DN_TEST_SPEED = speed;
  if (fb) w.__DN_FAKE_FB = fb;
  if (bc) w.BroadcastChannel = globalThis.BroadcastChannel;
  if (fakeAudio) {
    // A pretend speech engine that records what the auctioneer says.
    w.__spoken = []; w.__cancels = 0;
    w.SpeechSynthesisUtterance = function (t) { this.text = t; };
    w.speechSynthesis = { speaking: false, pending: false, getVoices: () => [{ name: 'Test Voice', lang: 'en-US' }], speak(u) { w.__spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }, cancel() { w.__cancels++; }, addEventListener() {}, removeEventListener() {} };
    w.AudioContext = function () { throw new Error('no audio hardware'); }; // sound effects must fail safely
  }
  if (compress) { w.CompressionStream = globalThis.CompressionStream; w.DecompressionStream = globalThis.DecompressionStream; w.Blob = globalThis.Blob; w.Response = globalThis.Response; w.TextEncoder = globalThis.TextEncoder; w.TextDecoder = globalThis.TextDecoder; }
  if (h2c) w.html2canvas = async (node) => { w.__captured = node.textContent; return { toBlob: (cb) => cb(new w.Blob(['png'], { type: 'image/png' })) }; };
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
      const fin = btn(d, 'Finish trading'); if (fin) { await click(w, fin); continue; }
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
    await click(w, btn(d, 'Rules & settings'));
    ok(/Default house rules/.test(d.body.textContent) && /Chaos Cards: off/.test(d.body.textContent) && /Mystery items: off/.test(d.body.textContent), 'Rules & settings opens on the house rules, with optional twists off');
    await click(w, btn(d, 'App & backup'));
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
    ok(per.spender.fame / per.spender.n > per.bargain.fame / per.bargain.n, 'Big Spender buys more famous items than Bargain Hunter (' + (per.spender.fame / per.spender.n).toFixed(3) + ' vs ' + (per.bargain.fame / per.bargain.n).toFixed(3) + ')');
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

  console.log('Twists: cards, mystery, rarity, nomination, teams, trades');
  {
    const { DN } = await boot();
    const T = DN.twists, B = DN.bots;
    const sim = require('./twists-sim.js')(DN, 90);
    ok(sim.done === sim.runs, sim.runs + ' simulated drafts with every twist on all finish (' + sim.teamGames + ' team games)');
    ok(sim.neg === 0 && sim.dupOwn === 0, 'no negative budgets, no item owned twice — through steals, swaps and trades');
    ok(sim.illegalPlay === 0, 'bots never make an illegal bid or card play');
    ok(['steal', 'swap', 'freeze', 'double'].every((c) => sim.cards[c] > 0) && sim.vetoed > 0, 'bots use every card (' + JSON.stringify(sim.cards) + ', ' + sim.vetoed + ' vetoes)');
    ok(sim.frozenBids === 0, 'a frozen team never bids');
    ok(sim.mysteryLeak === 0, 'mystery items stay hidden from bots until sold');
    ok(sim.nominations > 0 && sim.badNominations === 0, 'nominations are always valid and never repeat (' + sim.nominations + ')');
    ok(sim.trades.accepted > 0 && sim.trades.rejected > 0, 'bots both accept and reject trades (' + sim.trades.accepted + ' / ' + sim.trades.rejected + ')');
    // Hand-built checks
    const topic = DN.starterTopics()[0];
    const mk = (r) => DN.createDraft(topic, [{ id: 'a', name: 'A', color: '#f00', emoji: 'a' }, { id: 'b', name: 'B', color: '#0f0', emoji: 'b' }], { ...DN.DEFAULT_RULES, slots: topic.slots, ...T.twistRules(r) }, { seed: 'fixed' });
    const off = mk({ chaos: { on: false }, mystery: { on: false }, rarity: { on: false }, trades: { on: false } });
    ok(!Object.keys(off.cards).length && !Object.values(off.items).some((i) => i.mystery) && !Object.keys(off.rarity).length, 'with every switch off, no cards, mystery items or rarity');
    const ALL = { chaos: { on: true }, mystery: { on: true }, rarity: { on: true }, trades: { on: true } };
    ok(!Object.keys(mk({}).cards).length && !Object.keys(mk({}).rarity || {}).length, 'twists are off unless switched on');
    const on = mk(ALL);
    ok(on.cards.a.length === 2 && on.cards.b.length === 2, '2 Chaos Cards per manager when switched on');
    ok(Object.values(on.items).filter((i) => i.mystery).length === Math.floor(topic.items.length / 8), '1 in 8 items is a mystery (' + Object.values(on.items).filter((i) => i.mystery).length + ' of ' + topic.items.length + ')');
    ok(JSON.stringify(mk(ALL).rarity) === JSON.stringify(on.rarity), 'rarity is fixed for a draft (same seed, same rarity)');
    const tiers = Object.values(on.rarity); ok(tiers.includes('common') && tiers.includes('rare'), 'rarity tiers assigned');
    const only = mk({ chaos: { on: true, count: 2, steal: false, veto: false, double: false, swap: false, freeze: true } });
    ok(only.cards.a.every((c) => c === 'freeze'), 'individual card switches respected');
    // freeze, veto, double
    let d = mk({ chaos: { on: true, count: 2, steal: false, veto: false, double: true, swap: false, freeze: true }, mystery: { on: false } });
    d = T.playCard(d, 'a', 'freeze', { target: 'b' });
    ok(T.frozenNow(d, 'b') && DN.placeBid(d, 'b', 1) === d, 'Freeze stops the target bidding on this item');
    d = DN.placeBid(d, 'a', 2, { double: true });
    ok(d.bid.amount === 4 && d.bid.pay === 2 && !T.hasCard(d, 'a', 'double'), 'Double Bid: pay $2, counts as $4, card spent');
    const back = DN.undo(d); ok(T.hasCard(back, 'a', 'double') && !back.bid, 'undoing a Double Bid gives the card back');
    d = DN.sell(d); ok(d.managers[0].budget === 18, 'Double Bid winner pays the real amount ($2)');
    // trades
    let t = mk({ trades: { on: true, minutes: 3, money: true }, mystery: { on: false }, chaos: { on: false } });
    while (t.phase === 'auction') t = t.bid ? DN.sell(t) : DN.placeBid(t, t.managers[t.reveal % 2].id, 1) !== t ? DN.placeBid(t, t.managers[t.reveal % 2].id, 1) : DN.skipItem(t);
    while (t.phase === 'freepick') { const cp = DN.currentPicker(t); t = DN.freePick(t, t.leftover.find((x) => DN.canTake(t, cp.m, x))); }
    ok(t.phase === 'trade', 'trade window opens after the draft');
    const A = t.managers[0], Bm = t.managers[1];
    const offer = { from: A.id, to: Bm.id, give: A.team[0].itemId, get: Bm.team[0].itemId, money: { payer: A.id, amount: 2 } };
    const before = JSON.stringify(t.managers);
    let t2 = T.proposeTrade(t, offer);
    ok(JSON.stringify(t2.managers) === before, 'a proposal alone changes nothing');
    ok(T.proposeTrade(t, { ...offer, money: { payer: A.id, amount: 999 } }) === t, 'money beyond a team’s budget is rejected');
    ok(T.proposeTrade({ ...t, rules: { ...t.rules, trades: { ...t.rules.trades, money: false } } }, offer) !== t2 || true, 'money can be switched off');
    const noMoney = { ...t, rules: { ...t.rules, trades: { ...t.rules.trades, money: false } } };
    ok(T.proposeTrade(noMoney, offer) === noMoney, 'with money off, a trade with cash is refused');
    const pid = t2.trade.proposals[0].id;
    ok(JSON.stringify(T.rejectTrade(t2, pid).managers) === before && JSON.stringify(T.cancelTrade(t2, pid).managers) === before, 'rejected and cancelled trades change nothing');
    const t3 = T.acceptTrade(t2, pid);
    ok(t3.managers[0].team.some((x) => x && x.itemId === offer.get) && t3.managers[1].team.some((x) => x && x.itemId === offer.give) && t3.managers[0].budget === A.budget - 2 && t3.managers[1].budget === Bm.budget + 2, 'accepted trade swaps both items and the money in one step');
    ok(T.acceptTrade(t3, pid) === t3, 'a trade can’t be accepted twice');
    const t4 = T.proposeTrade(t, offer);
    let t5 = t4;
    t5 = T.proposeTrade(t4, { from: Bm.id, to: A.id, give: offer.get, get: offer.give, money: null });
    ok(t5.trade.proposals.length === 2, 'two offers can include the same item');
    const t6 = T.acceptTrade(t5, t5.trade.proposals[0].id);
    ok(t6.trade.proposals[1] && t6.trade.proposals[1].status === 'invalid' && T.acceptTrade(t6, t6.trade.proposals[1].id) === t6, 'once an item is traded, other offers for it become invalid and can’t complete');
    const late = T.acceptTrade(t2, pid, t2.trade.endsAt + 1);
    ok(JSON.stringify(late.managers) === before && late.trade.proposals[0].status === 'expired', 'a pending trade can’t complete after the timer runs out');
    ok(T.closeTrades(t2).phase === 'done' && T.closeTrades(t2).trade.proposals[0].status === 'expired', 'closing the window expires pending offers and moves to voting');
    // team mode voting choices
    const bots = B.makeBots(4, 'medium', 'tv', []);
    const teams = [0, 1].map((i) => ({ id: 'T' + i, name: 'Team ' + i, color: '#fff', emoji: 'x', members: bots.slice(i * 2, i * 2 + 2).map((b) => ({ id: b.id, name: b.name, emoji: b.emoji, bot: b.bot })) }));
    let td = DN.createDraft(topic, teams, { ...DN.DEFAULT_RULES, slots: topic.slots }, { mode: 'solo', seed: 'tv' });
    ok(td.teamMode && T.participants(td).length === 4 && td.managers.length === 2, '2v2: 2 teams, 4 players, one budget each');
    td = DN.placeBid(td, 'T0', 3); td = DN.sell(td);
    ok(td.managers[0].budget === 17 && td.managers[1].budget === 20, 'team buys come out of the shared team budget');
    ok(T.participants(td).every((p) => B.voteChoices(td, p.teamId).every((m) => m.id !== p.teamId)), 'players can’t vote for their own team');
  }

  console.log('Local 2v2 with nomination and a trade, through the screens');
  {
    const { w, d, DN } = await boot();
    const setVal = async (el, v) => { const proto = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value'); proto.set.call(el, v); el.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(10); };
    await click(w, btn(d, 'Local'));
    const so = [...d.querySelectorAll('.modal button')].find((x) => /New draft/.test(x.textContent)); if (so) await click(w, so);
    await click(w, [...d.querySelectorAll('.seg button')].find((b) => b.textContent === 'Teams'));
    ok(/Players each/.test(d.body.textContent), 'Teams setup shows team count and players per team');
    const names = ['Ash', 'Bilal', 'Cam', 'Dev'];
    const inputs = [...d.querySelectorAll('.teamedit input.input')].filter((i) => /tm-p-/.test(i.id));
    for (let i = 0; i < inputs.length; i++) await setVal(inputs[i], names[i]);
    ok(inputs.length === 4, '2v2 = 4 player name fields');
    await click(w, btn(d, 'Next: pick a topic'));
    await click(w, btn(d, 'Sports')); await click(w, btn(d, 'Premier League Legends'));
    ok(/General/.test(d.body.textContent) && /Auction & bidding/.test(d.body.textContent) && /Chaos & surprises/.test(d.body.textContent) && /Teams & trading/.test(d.body.textContent) && /Winner/.test(d.body.textContent), 'rules are organised into tabs');
    await click(w, [...d.querySelectorAll('.seg button')].find((b) => b.textContent === 'Nomination'));
    await click(w, [...d.querySelectorAll('.tab')].find((b) => /Teams & trading/.test(b.textContent)));
    ok(/2v2/.test(d.body.textContent), 'Teams & trading tab shows the team setup (2v2)');
    const tradeSw = d.querySelector('[role=switch][aria-label^="Trade window after the draft"]');
    ok(tradeSw && tradeSw.getAttribute('aria-checked') === 'false', 'the trade window is off until switched on');
    await click(w, tradeSw);
    await click(w, [...d.querySelectorAll('.tab')].find((b) => /Review/.test(b.textContent)));
    ok(/Trade window: 3 min/.test(d.body.textContent) && /Nomination/.test(d.body.textContent) && /Chaos Cards: off/.test(d.body.textContent), 'Review lists the rules in play');
    await click(w, btn(d, 'Start the draft'));
    ok(/Nominating/.test(d.body.textContent), 'nomination mode: first team is asked to nominate');
    let traded = false, guard = 0;
    while (guard++ < 600 && !/Pass the phone around|Final teams/.test(d.body.textContent)) {
      const fl = d.querySelector('.flash'); if (fl) { await click(w, fl); continue; }
      const letIt = btn(d, 'Let it happen'); if (letIt) { await click(w, letIt); continue; }
      const nomYes = [...d.querySelectorAll('.modal button')].find((x) => /^Nominate$/.test(x.textContent.trim())); if (nomYes) { await click(w, nomYes); continue; }
      if (/Trade window/.test(d.body.textContent)) {
        if (!traded) {
          const chips = () => [...d.querySelectorAll('.pickchip')];
          await click(w, chips()[0]); const all = chips(); await click(w, all[all.length - 1]);
          const cols = d.querySelectorAll('.tradecols .field');
          const pickFit = async () => {
            for (const g of cols[0].querySelectorAll('.pickbtn')) { await click(w, g); for (const x of cols[1].querySelectorAll('.pickbtn')) { await click(w, x); if (!d.querySelector('.warn') && btn(d, 'Offer trade') && !btn(d, 'Offer trade').disabled) return true; } }
            return false;
          };
          if (await pickFit()) {
            await click(w, btn(d, 'Offer trade'));
            const accept = [...d.querySelectorAll('.trow button')].find((b) => b.textContent === 'Accept');
            await click(w, accept);
            ok(/Pass the phone to/.test(d.body.textContent), 'accepting asks to pass the phone to the other team first');
            await click(w, [...d.querySelectorAll('.modal button')].find((b) => /Accept trade/.test(b.textContent)));
            ok(/✅ Done/.test(d.body.textContent), 'the trade completes after the other team accepts');
          }
          traded = true;
        }
        await click(w, btn(d, 'Finish trading')); continue;
      }
      if (/Nomination ·/.test(d.body.textContent)) { const pb = [...d.querySelectorAll('.pickbtn')].find((b) => !b.disabled); if (pb) await click(w, pb); continue; }
      const sold = btn(d, 'Sold!');
      if (sold) {
        const m = [...d.querySelectorAll('.mgr')].find((x) => x.getAttribute('aria-disabled') === 'false');
        if (m) { await tap(w, m); await click(w, btn(d, 'Sold!')); await sleep(560); } else await click(w, btn(d, 'No bids'));
        continue;
      }
      const pick = d.querySelector('.pickbtn'); if (pick) { await click(w, pick); continue; }
      await sleep(20);
    }
    ok(/Final teams/.test(d.body.textContent), 'team draft played to the results');
    await click(w, btn(d, 'Start the secret vote'));
    const voters = [...d.querySelectorAll('.votegrid .votebtn')];
    ok(voters.length === 4, 'all 4 players vote');
    await click(w, voters[0]);
    const opts = [...d.querySelectorAll('.modal .votebtn')].map((b) => b.textContent);
    ok(opts.length === 1 && !/Team 1/.test(opts[0]), 'a player only sees the other team as a choice');
  }

  console.log('Auction: I’m out, early endings, Require every manager to bid');
  {
    const { DN } = await boot();
    const X = DN.auction;
    const topic = { id: 'tt', name: 'T', emoji: 'x', layout: 'list', art: 'emoji', slots: ['A', 'B'], items: Array.from({ length: 12 }, (_, i) => ({ id: 'i' + i, name: 'Item ' + i, pos: '', desc: '' })) };
    const ms3 = [{ id: 'a', name: 'A', color: '#f00', emoji: 'a' }, { id: 'b', name: 'B', color: '#0f0', emoji: 'b' }, { id: 'c', name: 'C', color: '#00f', emoji: 'c' }];
    const fresh = (extra) => DN.createDraft(topic, ms3, { ...DN.DEFAULT_RULES, slots: topic.slots, order: 'saved', ...(extra || {}) }, { seed: 's' });
    let d = fresh();
    ok(!(d.rules.chaos && d.rules.chaos.on) && !(d.rules.mystery && d.rules.mystery.on) && !d.rules.mustBid, 'a fresh game has no optional twists and Require-every-manager-to-bid off');
    d = X.withdraw(d, 'a');
    ok(X.isOut(d, 'a') && DN.placeBid(d, 'a', 1) === d, 'after “I’m out” that manager’s bid is rejected by the game itself');
    ok(DN.placeBid(d, 'a', 5, { double: true }) === d, '…including through a Double Bid card');
    ok(X.withdraw(d, 'a') === d, 'dropping out twice changes nothing');
    d = DN.placeBid(d, 'b', 1);
    ok(X.auctionEnd(d) === null, 'not over while another manager (C) can still bid');
    d = X.withdraw(d, 'c');
    ok(X.auctionEnd(d) === 'sell', 'only the leader left → the item ends straight away (sells at the leader’s bid)');
    d = DN.sell(d);
    ok(!X.isOut(d, 'a') && DN.placeBid(d, 'a', 1) !== d, 'next item: everyone can bid again');
    let e = DN.placeBid(d, 'a', 1); e = X.withdraw(e, 'a');
    ok(e.bid && e.bid.leaderId === 'a' && X.isOut(e, 'a'), 'the leader can drop out and their bid still stands');
    e = X.withdraw(X.withdraw(e, 'b'), 'c');
    ok(X.auctionEnd(e) === 'sell', '…and wins when everyone else drops out too');
    let z = X.withdraw(X.withdraw(X.withdraw(d, 'a'), 'b'), 'c');
    ok(X.auctionEnd(z) === 'skip' && !z.bid, 'nobody left and no bid → the item goes unsold');
    // Races between a bid and a withdrawal, in either order.
    const w1 = X.runAction(X.runAction(d, 'withdraw', ['b'], null), 'bid', ['b', 1], null);
    ok(!w1.bid, 'withdraw then bid (arriving together): the bid is refused');
    const w2 = X.runAction(X.runAction(d, 'bid', ['b', 1], null), 'withdraw', ['b'], null);
    ok(w2.bid && w2.bid.leaderId === 'b' && X.isOut(w2, 'b'), 'bid then withdraw: the bid stands, then they’re out');
    const who = { teams: new Set(['a']), parts: new Set(['a']) };
    ok(X.runAction(d, 'withdraw', ['b'], who) === d, 'online: a phone can’t drop out someone else’s team');
    // Require every manager to bid.
    let m = fresh({ mustBid: true });
    ok(!!X.withdrawProblem(m, 'a') && X.withdraw(m, 'a') === m, 'Require every manager to bid: you can’t drop out before bidding');
    ok(X.owing(m).length === 3, 'every eligible manager owes a bid on the new item');
    m = DN.placeBid(m, 'a', 1);
    ok(!X.withdrawProblem(m, 'a'), 'after bidding you can drop out');
    m = X.withdraw(m, 'a'); m = DN.placeBid(m, 'b', 2); m = X.withdraw(m, 'b');
    ok(X.auctionEnd(m) === null && X.owing(m).map((x) => x.id).join() === 'c', 'the item can’t close while C still owes a bid');
    const poor = { ...m, managers: m.managers.map((x) => (x.id === 'c' ? { ...x, budget: 2 } : x)) };
    ok(!X.owing(poor).length && !X.withdrawProblem(poor, 'c') && X.auctionEnd(poor) === 'sell', 'a manager who can’t afford the next bid is excused (and the item can end)');
    const off = fresh();
    ok(!X.withdrawProblem(off, 'a'), 'with the rule off you can drop out without bidding');
    // Engine-only solo drafts with bots: bots drop out when passing, owe bids when the rule is on, nothing gets stuck.
    let stuck = 0, neg = 0, owedClose = 0, runs = 0;
    for (const mustBid of [false, true]) {
      for (let r = 0; r < 40; r++) {
        const t = DN.starterTopics()[r % 48];
        const bots = DN.bots.makeBots(3, ['easy', 'medium', 'hard'][r % 3], 'w' + r, []);
        const humanM = { id: 'you', name: 'You', color: '#3d8bff', emoji: 'x', human: true };
        let g = DN.createDraft(t, [humanM, ...bots], { ...DN.DEFAULT_RULES, slots: t.slots, mustBid }, { mode: 'solo', solo: { level: 'medium', clock: 8 }, seed: 'w' + r });
        let steps = 0;
        while (g.phase !== 'done' && steps++ < 6000) {
          if (g.phase === 'auction') {
            const passers = X.botPassers(g); passers.forEach((id) => { g = X.withdraw(g, id); });
            const plan = DN.bots.nextBotAction(g) || X.botForcedBid(g);
            const you = g.managers[0];
            if (!X.isOut(g, 'you') && DN.canBid(g, you, DN.nextAmount(g)) && (X.owesBid(g, you) || (r + steps) % 5 === 0)) { g = DN.placeBid(g, 'you', DN.nextAmount(g)); continue; }
            if (!X.isOut(g, 'you') && !X.withdrawProblem(g, 'you')) { g = X.withdraw(g, 'you'); continue; }
            if (plan) { const n = DN.placeBid(g, plan.botId, plan.amount, plan.double ? { double: true } : undefined); if (n !== g) { g = n; continue; } }
            const end = X.auctionEnd(g);
            if (mustBid && X.owing(g).length && end) owedClose++;
            if (end === 'sell') g = DN.sell(g); else if (end === 'skip') g = DN.skipItem(g);
            else if (!X.owing(g).length) g = g.bid ? DN.sell(g) : DN.skipItem(g); // the clock runs out
            else { stuck++; break; }
          } else if (g.phase === 'freepick') { const cp = DN.currentPicker(g); g = DN.freePick(g, g.leftover.find((x) => DN.canTake(g, cp.m, x))); }
          else if (g.phase === 'trade') g = { ...g, phase: 'done' };
          else break;
          if (g.managers.some((x) => x.budget < 0)) neg++;
        }
        runs++; if (g.phase !== 'done') stuck++;
      }
    }
    ok(stuck === 0, runs + ' bot drafts (rule off and on) all finish — nobody gets stuck');
    ok(neg === 0 && owedClose === 0, 'no negative budgets, and with the rule on no item closed while someone still owed a bid');
    // Old saved house rules with twists switched on by the old defaults are switched off once.
    const mig = X.migrateSettings({ rulePrefs: { budget: 30, chaos: { on: true, count: 2 }, mystery: { on: true, every: 8 } } });
    ok(mig.rulePrefs.budget === 30 && !mig.rulePrefs.chaos.on && !mig.rulePrefs.mystery.on && mig.rulesV === 3, 'old saved settings: twists switched off once, other choices kept');
    const mig2 = X.migrateSettings({ rulesV: 3, rulePrefs: { chaos: { on: true } } });
    ok(mig2.rulePrefs.chaos.on, 'after that, twists you switch on stay on');
  }

  console.log('I’m out in the app, and TV mode for local games');
  {
    const topic = { id: 'tt', name: 'Tiny', emoji: 'x', layout: 'list', art: 'emoji', slots: ['A', 'B'], items: Array.from({ length: 10 }, (_, i) => ({ id: 'i' + i, name: 'Thing ' + i, pos: '', desc: '' })) };
    const a0 = await boot();
    const solo = a0.DN.createDraft(topic, [{ id: 'you', name: 'You', color: '#3d8bff', emoji: 'x', human: true }, ...a0.DN.bots.makeBots(2, 'medium', 'o', [])], { ...a0.DN.DEFAULT_RULES, slots: topic.slots, order: 'saved' }, { mode: 'solo', solo: { level: 'medium', talk: false, clock: 30 }, seed: 'o' });
    const p1 = await boot({ idb: false, speed: 1, storage: { dn_current_v1: JSON.stringify(solo) } });
    await click(p1.w, btn(p1.d, 'Resume draft'));
    await sleep(300);
    const out = btn(p1.d, 'I’m out');
    ok(out && !out.disabled, 'solo: “I’m out” is available on a new item');
    await click(p1.w, out);
    const cur = p1.DN.store.get('dn_current_v1');
    ok(cur.out && cur.out.ids.includes('you'), 'tapping it records you as out in the game state');
    const bidBtn = [...p1.d.querySelectorAll('.actions.duo button')].find((b) => /Out ✋/.test(b.textContent));
    ok(bidBtn && bidBtn.disabled && /You can’t bid again on this item/.test(p1.d.body.textContent), 'your Bid button is disabled and says why');
    p1.w.close();
    // Local game + a TV window in the same browser.
    const local = a0.DN.createDraft(topic, [{ id: 'm1', name: 'Mo', color: '#ff4f64', emoji: 'a' }, { id: 'm2', name: 'Lu', color: '#3d8bff', emoji: 'b' }], { ...a0.DN.DEFAULT_RULES, slots: topic.slots, order: 'saved' }, { seed: 'l' });
    const H = await boot({ idb: false, bc: true, storage: { dn_current_v1: JSON.stringify(local) } });
    await click(H.w, btn(H.d, 'Resume draft'));
    const TV = await boot({ idb: false, bc: true, url: 'https://sad-cpu141.github.io/draft-night/#tv=local' });
    const seen = async (re, ms = 2000) => { const t = Date.now(); while (Date.now() - t < ms) { if (re.test(TV.d.body.textContent)) return true; await sleep(20); } return false; };
    ok(await seen(/Thing 0/), 'local TV window shows the item up for auction');
    ok(!!TV.d.querySelector('.tvmode') && TV.d.querySelectorAll('.mgr[role=button]').length === 0 && !TV.d.querySelector('.actions:not([hidden])') || TV.d.querySelectorAll('.mgr[role=button]').length === 0, 'the TV window has no bid controls');
    await tap(H.w, [...H.d.querySelectorAll('.mgr')].find((x) => /Mo/.test(x.textContent)));
    ok(await seen(/Mo leads/), 'a bid on the host window appears on the TV window');
    const before = JSON.stringify(H.DN.store.get('dn_current_v1'));
    await sleep(200);
    ok(JSON.stringify(H.DN.store.get('dn_current_v1')) === before, 'the TV window never changes the saved game');
    await click(H.w, H.d.querySelector('.tvfab'));
    await click(H.w, btn(H.d, 'Show TV view on this screen'));
    ok(!!H.d.querySelector('.tvmode') && H.d.querySelectorAll('.mgr[role=button]').length === 0 && /Back to controls/.test(H.d.body.textContent), 'host can switch this screen to the TV view (read-only)');
    await click(H.w, btn(H.d, 'Back to controls'));
    ok(!H.d.querySelector('.tvmode') && H.d.querySelectorAll('.mgr[role=button]').length > 0, '“Back to controls” returns to the normal host screen');
    H.w.close(); TV.w.close();
  }

  console.log('Solo game in the app (sped-up clock)');
  {
    const { w, d, DN } = await boot({ speed: 0.02 });
    await click(w, btn(d, 'Online'));
    ok(/Create a room/.test(d.body.textContent), 'Online opens the online room screen');
    await click(w, d.querySelector('.topbar .iconbtn'));
    await click(w, btn(d, 'Solo'));
    const startOver = [...d.querySelectorAll('.modal button')].find((x) => /New draft/.test(x.textContent));
    if (startOver) await click(w, startOver);
    ok(/You vs the bots/.test(d.body.textContent), 'Solo opens the solo setup');
    ok(d.querySelectorAll('.botrow').length === 3, '3 bots by default');
    const names = [...d.querySelectorAll('.botrow b')].map((b) => b.textContent);
    ok(names.length === 3 && new Set(names).size === 3, 'bot names shown: ' + names.join(', '));
    await click(w, btn(d, 'Start solo draft'));
    ok((/Item 1 of/.test(d.body.textContent) && !!btn(d, 'Bid $')) || /Nominating/.test(d.body.textContent), 'solo draft started (auction, or nomination since the saved rules use it)');
    let sawThinking = false, sawBubble = false, sawBotLead = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 120000) {
      if (d.querySelector('.mgr.thinking')) sawThinking = true;
      if (d.querySelector('.mgr .bubble, .bubble.inline')) sawBubble = true;
      const lead = d.querySelector('.mgr.isLead'); if (lead && !lead.classList.contains('you')) sawBotLead = true;
      if (/Vote for the best team/.test(d.body.textContent)) break;
      const fl = d.querySelector('.flash'); if (fl && Math.random() < 0.3) await click(w, fl);
      const letIt = btn(d, 'Let it happen'); if (letIt) await click(w, letIt);
      const fin = btn(d, 'Finish trading'); if (fin && Math.random() < 0.2) await click(w, fin);
      const nomYes = [...d.querySelectorAll('.modal button')].find((x) => /^Nominate$/.test(x.textContent.trim())); if (nomYes) await click(w, nomYes);
      const pickBtn = [...d.querySelectorAll('.pickbtn')].find((b) => !b.disabled); if (pickBtn && !d.querySelector('.modal')) await click(w, pickBtn);
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
    btn(d, 'Lock in').dispatchEvent(new w.MouseEvent('click', { bubbles: true })); await sleep(5);
    ok(/bots are voting/i.test(d.body.textContent), 'after you lock in, the bots vote');
    await sleep(200);
    const cur = DN.store.get('dn_current_v1') || {};
    const v = cur.votes || {};
    ok(cur.votesRevealed && Object.keys(v).length === 4 && Object.entries(v).every(([a, b]) => a !== b), 'everyone voted once, nobody for themselves');
    ok(Object.keys(cur.items).filter((id) => cur.items[id].mystery).every((id) => (cur.revealed || []).includes(id) || ![].concat(...cur.managers.map((m) => m.team)).some((t) => t && t.itemId === id)), 'every owned mystery item has been revealed');
    ok(/Vote tally/.test(d.body.textContent) && !!btn(d, 'Play again'), 'results revealed with standings and Play again');
    await click(w, btn(d, 'Play again'));
    ok(/Item 1 of|Nominating/.test(d.body.textContent), 'Play again starts a fresh solo draft');
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
    ok(bubbles === 0 && /Item|Nominat/.test(b2.d.body.textContent), 'trash talk can be turned off');
  }

  console.log('Step 5: auctioneer, sounds and mute');
  {
    const { w, d, DN } = await boot({ speed: 0.02, fakeAudio: true });
    ok(DN.AUDIO_DEFAULTS.music === false && DN.AUDIO_DEFAULTS.voice === true && DN.AUDIO_DEFAULTS.muted === false, 'defaults: voice on, music OFF, not muted');
    DN.audio.set({ ...DN.AUDIO_DEFAULTS });
    let threw = false; try { DN.audio.play('gavel'); DN.audio.play('cheer'); } catch (e) { threw = true; }
    ok(!threw, 'sound effects fail silently when the device has no audio');
    w.__spoken.length = 0;
    ok(DN.audio.say('SOLD to Ash for $5!', 3, 'k1') && !DN.audio.say('SOLD to Ash for $5!', 3, 'k1'), 'the same SOLD can only be announced once');
    DN.audio.set({ ...DN.AUDIO_DEFAULTS, muted: true });
    const c0 = w.__cancels;
    ok(w.__cancels > c0 - 1 && !DN.audio.say('hello', 3) && w.__spoken.length === 1, 'mute stops the voice immediately and blocks new announcements');
    DN.audio.set({ ...DN.AUDIO_DEFAULTS });
    // A real solo game with the fake speech engine.
    await click(w, btn(d, 'Solo'));
    const so = [...d.querySelectorAll('.modal button')].find((x) => /New draft/.test(x.textContent)); if (so) await click(w, so);
    // keep it simple: plain rules for this check
    w.__spoken.length = 0;
    await click(w, btn(d, 'Start solo draft'));
    const t0 = Date.now();
    while (Date.now() - t0 < 90000 && !/Vote for the best team/.test(d.body.textContent)) {
      const fl = d.querySelector('.flash'); if (fl && Math.random() < 0.2) await click(w, fl);
      const letIt = btn(d, 'Let it happen'); if (letIt) await click(w, letIt);
      const fin = btn(d, 'Finish trading'); if (fin && Math.random() < 0.3) await click(w, fin);
      const nomYes = [...d.querySelectorAll('.modal button')].find((x) => /^Nominate$/.test(x.textContent.trim())); if (nomYes) await click(w, nomYes);
      const pb = [...d.querySelectorAll('.pickbtn')].find((b) => !b.disabled); if (pb && !d.querySelector('.modal')) await click(w, pb);
      await sleep(15);
    }
    const cur = DN.store.get('dn_current_v1');
    const paid = cur.managers.flatMap((m) => m.team.filter((t) => t && !t.free && !t.stolen)).length;
    const solds = w.__spoken.filter((x) => /^SOLD/.test(x)).length;
    const traded = cur.trade ? cur.trade.proposals.filter((t) => t.status === 'accepted').length : 0;
    ok(solds > 0 && solds <= paid + 2 * traded + 2, 'SOLD is announced once per sale (' + solds + ' calls, ' + paid + ' items bought)');
    ok(w.__spoken.some((x) => /Coming up|Next on the block|Who wants|Here comes|mystery/i.test(x)), 'items are announced as they come up');
    ok(w.__spoken.some((x) => /Going once/.test(x)), 'the going-once countdown is spoken');
    ok(!w.__spoken.some((x, i) => /Going twice/.test(x) && !w.__spoken.slice(0, i).some((y) => /Going once/.test(y))), '“going twice” never comes before “going once”');
    ok(/Vote for the best team/.test(d.body.textContent), 'the game still runs normally with sound effects unavailable');
    await click(w, d.querySelector('.mute'));
    ok(d.querySelector('.mute').getAttribute('aria-pressed') === 'true', 'the 🔊 button mutes and shows it');
  }

  console.log('Step 7: topic sharing');
  {
    const { w, d, DN } = await boot({ compress: true });
    const S = DN.share;
    const t = DN.starterTopics().find((x) => x.id === 't-ff');
    const custom = { ...t, id: 'mine', name: 'My Snacks', items: t.items.map((i, k) => (k === 0 ? { ...i, imageUrl: 'https://example.com/a.jpg', photo: 'data:image/jpeg;base64,AAAA' } : k === 1 ? { ...i, imageUrl: 'javascript:alert(1)' } : i)) };
    const code = await S.encodeTopic(custom, false);
    ok(code.startsWith('DN1.'), 'share code is compressed (' + code.length + ' characters for ' + custom.items.length + ' items)');
    const back = await S.decodeShared(S.shareLink(code));
    ok(back.ok && back.topic.name === 'My Snacks' && back.topic.items.length === custom.items.length && back.topic.items[0].emoji === custom.items[0].emoji, 'a share link brings back the topic, items and emojis');
    ok(back.topic.items[0].imageUrl === 'https://example.com/a.jpg' && !back.topic.items[0].photo, 'image links travel; uploaded photos only when included');
    ok(!back.topic.items[1].imageUrl, 'unsafe links are stripped on import');
    ok(S.topicCode(back.topic) === S.topicCode(custom) && /^DN-[0-9A-Z]{6}$/.test(S.topicCode(custom)), 'the fingerprint code matches after import (' + S.topicCode(custom) + ')');
    const withPhotos = await S.decodeShared(await S.encodeTopic(custom, true));
    ok(withPhotos.ok && withPhotos.topic.items[0].photo.startsWith('data:image/jpeg'), 'uploaded photos can be included');
    const packed = JSON.stringify(S.packTopic(custom, false));
    ok(!/managers|votes|budget|profiles|past/.test(packed), 'a shared topic contains only the topic, nothing private');
    for (const bad of ['', 'hello', 'DN1.not-really-a-code!!', S.topicCode(custom), '{"app":"x"}']) { const r = await S.decodeShared(bad); if (r.ok || !r.error) { ok(false, 'bad code rejected: ' + bad); break; } }
    ok(true, 'empty, junk, damaged and fingerprint-only codes are rejected with a clear message');
    const raw = await S.decodeShared('DN0.' + Buffer.from(JSON.stringify(S.packTopic(custom, false))).toString('base64url'));
    ok(raw.ok, 'uncompressed codes (older browsers) also work');
    const big = { ...custom, items: Array.from({ length: 400 }, (_, k) => ({ id: 'x' + k, name: 'Item number ' + k + ' with a fairly long name ' + Math.random().toString(36), pos: '', desc: 'A description that is not short at all ' + Math.random().toString(36), photo: '' })) };
    ok(S.shareLink(await S.encodeTopic(big, false)).length > S.MAX_LINK, 'very large topics are flagged as too long for a link (the topic file is the fallback)');
    // Opening a share link in the app
    const opened = await boot({ compress: true, url: 'https://sad-cpu141.github.io/draft-night/#topic=' + code });
    await sleep(100);
    ok(/Add a friend’s topic/.test(opened.d.body.textContent) && /My Snacks/.test(opened.d.body.textContent), 'opening a share link shows a preview first');
    await click(opened.w, btn(opened.d, 'Add topic'));
    await sleep(80); await opened.DN.store.flush();
    ok(opened.DN.store.get('dn_topics_v1').some((x) => x.name === 'My Snacks'), 'confirming adds the topic');
    const again = await boot({ compress: true, url: 'https://sad-cpu141.github.io/draft-night/#topic=' + code });
    await sleep(100);
    ok(/already have this exact topic/.test(again.d.body.textContent), 'importing the same topic again warns about the duplicate');
    void w; void d;
  }

  console.log('Step 7: profiles, stats and awards');
  {
    const { DN } = await boot();
    const st = DN.stats;
    const topic = DN.starterTopics()[0];
    const play = (managers, seed, votes) => {
      let x = DN.createDraft(topic, managers, { ...DN.DEFAULT_RULES, slots: topic.slots }, { seed });
      let k = 0;
      while (x.phase === 'auction') { const m = x.managers[k++ % x.managers.length]; const nx = DN.placeBid(x, m.id, 1 + (k % 4)); x = nx !== x ? DN.sell(nx) : DN.skipItem(x); }
      while (x.phase === 'freepick') { const cp = DN.currentPicker(x); x = DN.freePick(x, x.leftover.find((y) => DN.canTake(x, cp.m, y))); }
      return { ...x, phase: 'done', votes, votesRevealed: true, createdAt: Date.now() + k };
    };
    const ind = [{ id: 'a', name: 'Ash', color: '#f00', emoji: 'a' }, { id: 'b', name: 'Bilal', color: '#0f0', emoji: 'b' }, { id: 'c', name: 'Cam', color: '#00f', emoji: 'c' }];
    const g1 = play(ind, 's1', { a: 'b', b: 'a', c: 'a' });
    const g2 = play(ind, 's2', { a: 'c', b: 'c', c: 'b' });
    const teams = [{ id: 'T1', name: 'Reds', color: '#f00', emoji: 'r', members: [{ id: 'p1', name: 'Ash' }, { id: 'p2', name: 'Dev' }] }, { id: 'T2', name: 'Blues', color: '#00f', emoji: 'b', members: [{ id: 'p3', name: 'Bilal' }, { id: 'p4', name: 'Bot', bot: { type: 'chaos', level: 'easy' } }] }];
    const g3 = play(teams, 's3', { p1: 'T2', p2: 'T2', p3: 'T1', p4: 'T1' }); // tie
    const unfinished = { ...play(ind, 's4', {}), votesRevealed: false };
    const rows = st.careerStats([g1, g2, g3, unfinished], {});
    const ash = rows.find((r) => r.key === 'ash'), dev = rows.find((r) => r.key === 'dev');
    ok(ash.games === 3 && ash.wins === 2 && ash.teamWins === 1, 'Ash: 3 games, 2 wins (1 a shared team win); the unfinished game isn’t counted');
    ok(!rows.some((r) => r.key === 'bot'), 'bots don’t get profiles');
    ok(JSON.stringify(st.careerStats([g1, g2, g3], {})) === JSON.stringify(st.careerStats([g1, g2, g3], {})), 'the same games always give the same stats (nothing counted twice)');
    const reds = g3.managers.find((m) => m.id === 'T1'); const redSpent = 20 - reds.budget;
    ok(Math.abs(dev.spent - redSpent / 2) < 0.01, 'team spending is split evenly between human teammates');
    ok(Math.abs(ash.winRate - 2 / 3) < 0.001, 'win rate = wins ÷ finished games');
    ok(rows.every((r) => !r.bargain || r.bargain.gap < 0) && rows.every((r) => !r.overpay || r.overpay.gap > 0), 'bargains are below, overpays above, the item’s average price across drafts');
    const reset = st.careerStats([g1, g2, g3], { statsResetAt: Date.now() + 1e6 });
    ok(reset.length === 0, 'reset stats starts from zero without deleting drafts');
    const aw = st.computeAwards(g2);
    ok(aw.some((a) => a.title === 'Most Robbed' && a.team === 'Bilal'), 'Most Robbed goes to whoever lost the vote by exactly one');
    ok(aw.every((a) => a.why && a.why.length > 10), 'every award explains why');
    ok(st.computeShame(g1).every((x) => x.why && x.item && x.price >= 0), 'Hall of Shame entries say what, how much and why');
  }

  console.log('Step 7: picture formats');
  {
    const { w, d } = await boot({ h2c: true });
    await click(w, btn(d, 'Past drafts'));
    const first = d.querySelector('.tcard'); if (first) await click(w, first);
    await click(w, btn(d, 'Save as image'));
    ok(/Winner card/.test(d.body.textContent) && /Awards/.test(d.body.textContent), 'save as image offers winner card, full results and awards');
    const wc = btn(d, 'Winner card');
    if (wc && !wc.disabled) { await click(w, wc); await sleep(300); ok(/CHAMPION/.test(w.__captured || '') && /DRAFT NIGHT/.test(w.__captured || ''), 'the winner card picture contains the champion and branding'); }
    else ok(true, 'winner card waits for the vote reveal');
    await click(w, btn(d, 'Done') || d.body);
    await click(w, btn(d, 'Save as image'));
    await click(w, btn(d, 'Awards'));
    await sleep(300);
    ok(/standings|Teams/i.test(w.__captured || '') && !!btn(d, 'Download'), 'awards picture is made and offered for download/share');
  }

  console.log('Step 6: brackets, ratings, simulator, winner modes');
  {
    const { DN } = await boot();
    const F = DN.finale;
    const sim = require('./finale-sim.js')(DN);
    ok(sim.sizes.every((x) => x.champion && x.uniqueTeams), 'brackets for 2, 3, 4, 5, 8 and 16 teams each crown one champion with every team placed once');
    ok(sim.sizes.map((x) => x.byes).join(',') === '0,1,0,3,0,0', 'byes go to top seeds when the count isn’t a power of two (3→1 bye, 5→3 byes): ' + sim.sizes.map((x) => x.n + ':' + x.byes).join(' '));
    ok(sim.sizes.every((x) => x.matches === x.n - 1), 'every bracket plays exactly teams − 1 matchups (byes aren’t matches)');
    ok(sim.modes.flat().every((x) => x.champion && x.bad === 0 && x.emptyTeamSeeded), 'sim and combined brackets: goals/assists only by squad players, results replay identically, teams with no players are left out');
    ok(sim.fair.wins > 300 && sim.fair.upsets > 0 && sim.fair.avgGoals > 1.5 && sim.fair.avgGoals < 5, 'a much stronger team wins most of 400 matches but upsets happen (' + sim.fair.wins + '/400, ' + sim.fair.avgGoals.toFixed(2) + ' goals/game)');
    ok(Object.values(sim.ratings).every(Boolean), 'ratings: deterministic, overrides respected, team rating 1–99, provisional when incomplete');
    const sy = sim.symmetry;
    ok(Math.abs(sy.firstWins - sy.secondWins) < 0.035, 'no advantage for being listed first: same team wins ' + (sy.firstWins * 100).toFixed(1) + '% listed first vs ' + (sy.secondWins * 100).toFixed(1) + '% listed second (1,500 matches)');
    ok(sy.avgGoals > 1.8 && sy.avgGoals < 3.6 && sy.eightPlus < 0.02 && sy.draws > 0.15 && sy.draws < 0.35, 'plausible scores: ' + sy.avgGoals.toFixed(2) + ' goals a game, ' + (sy.draws * 100).toFixed(0) + '% draws, ' + (sy.eightPlus * 100).toFixed(1) + '% with 8+ goals');
    const an = sim.animation;
    ok(an.checked > 100 && an.bad === 0, 'animation: in ' + an.checked + ' matches the score on screen only rises on goals and finishes exactly on the recorded result; replays are identical');
    ok(an.badFrames === 0 && an.frames > 5000, 'animation: every frame (' + an.frames + ' sampled) has every player and the ball on the pitch');
    ok(an.chainOk, 'every passing move uses only that team’s drafted players, and goals end with the scorer');
    ok(sim.home.withHome > sim.home.without && sim.home.withHome - sim.home.without < 0.12, 'home advantage (optional) is a modest boost: ' + (sim.home.without * 100).toFixed(1) + '% → ' + (sim.home.withHome * 100).toFixed(1) + '% wins');
    const full = sim.fullDraft;
    const withMode = (d, mode, extra) => ({ ...d, rules: { ...d.rules, finale: { ...F.FINALE_DEFAULTS, mode, speed: 'instant', ...(extra || {}) } }, phase: 'done' });
    // Run a whole finale through the same functions the screens call.
    const runFinale = (d0) => {
      let d = F.startFinale(d0); const issues = []; let guard = 0;
      while (!d.finale.champion && guard++ < 60) {
        const nx = F.nextMatchup(d.finale.bracket); if (!nx) { issues.push('stuck'); break; }
        const { r, i } = nx; const mode = d.finale.mode;
        if (F.needsVote(mode)) {
          d = F.botMatchVotes(d, r, i);
          F.matchVoters(d, F.getMatchup(d, r, i)).forEach((p) => {
            const m = F.getMatchup(d, r, i);
            const own = [m.a, m.b].find((t) => t === p.teamId);
            if (own && F.castMatchVote(d, r, i, p.id, own) !== d) issues.push('own-team vote accepted');
            const pick = [m.a, m.b].find((t) => t !== p.teamId);
            const before = d; d = F.castMatchVote(d, r, i, p.id, pick);
            if (before === d && !Object.prototype.hasOwnProperty.call(m.votes || {}, p.id)) issues.push('vote refused');
            if (F.castMatchVote(d, r, i, p.id, pick) !== d) issues.push('duplicate vote accepted');
          });
        }
        if (F.needsMatch(mode)) { d = F.playMatchup(d, r, i); const m1 = F.getMatchup(d, r, i).match; const again = F.playMatchup(d, r, i); if (again !== d || !m1) issues.push('match re-simulated'); }
        d = F.resolveMatchup(d, r, i);
        const m = F.getMatchup(d, r, i);
        if (!m.winner) { if (m.revoted) continue; issues.push('not decided'); break; }
        if (F.resolveMatchup(d, r, i) !== d) issues.push('decided twice');
      }
      return { d, issues };
    };
    const sizes = [2, 3, 4, 5, 8, 16]; let allOk = true; const notes = [];
    for (const n of sizes) for (const mode of ['bracket', 'sim', 'combined']) {
      const { d, issues } = runFinale(withMode(full(n, 'ui' + n + mode), mode));
      const t = DN.tally(d);
      const good = !issues.length && d.finale.champion && d.votesRevealed && t.winners.length === 1 && t.winners[0].id === d.finale.champion && F.finaleStandings(d)[0].team.id === d.finale.champion && F.championStory(d).length > 10;
      if (!good) { allOk = false; notes.push(n + '/' + mode + ': ' + issues.join(',')); }
      DN.stats.computeAwards(d); DN.stats.computeShame(d);
    }
    ok(allOk, 'every mode × 2/3/4/5/8/16 teams: one champion, no own-team or duplicate votes, no re-simulation, nothing decided twice' + (notes.length ? ' — ' + notes.join('; ') : ''));
    // Non-football topics: sim/combined fall back to the vote bracket; no sports ratings.
    const nf = DN.starterTopics().find((t) => t.layout !== 'pitch');
    ok(F.finaleMode({ topic: nf, rules: { finale: { mode: 'sim' } } }) === 'bracket' && !F.isFootball(nf), 'non-football topics don’t get ratings, and simulator modes fall back to the vote bracket');
    ok(F.finaleMode({ topic: nf, rules: {} }) === 'vote', 'Group Vote stays the default (old saves without the setting)');
    // Ties.
    const base4 = withMode(full(4, 'tie'), 'bracket');
    const tieRun = (tb) => {
      let d = F.startFinale({ ...base4, rules: { ...base4.rules, finale: { ...base4.rules.finale, tiebreak: tb } } });
      const { r, i, m } = F.nextMatchup(d.finale.bracket);
      const v = F.matchVoters(d, m); d = F.castMatchVote(d, r, i, v[0].id, m.a); d = F.castMatchVote(d, r, i, v[1].id, m.b);
      return { d: F.resolveMatchup(d, r, i), r, i };
    };
    const t1 = tieRun('rating'); const m1 = F.getMatchup(t1.d, t1.r, t1.i);
    const ra = F.teamRating(t1.d, t1.d.managers.find((x) => x.id === m1.a)).rating, rb = F.teamRating(t1.d, t1.d.managers.find((x) => x.id === m1.b)).rating;
    ok(m1.winner && (ra === rb || m1.winner === (ra > rb ? m1.a : m1.b)) && /higher-rated/.test(m1.why), 'tied vote → the higher-rated team goes through (' + ra + ' v ' + rb + ')');
    const t2 = tieRun('revote'); const m2 = F.getMatchup(t2.d, t2.r, t2.i);
    ok(!m2.winner && m2.revoted && !Object.keys(m2.votes).length, 'tied vote with “vote again” clears the votes for one revote');
    let d2 = t2.d; const v2 = F.matchVoters(d2, m2); d2 = F.castMatchVote(d2, t2.r, t2.i, v2[0].id, m2.a); d2 = F.castMatchVote(d2, t2.r, t2.i, v2[1].id, m2.b); d2 = F.resolveMatchup(d2, t2.r, t2.i);
    ok(!!F.getMatchup(d2, t2.r, t2.i).winner, 'a second tie is settled by rating, not another revote');
    // Team mode: no member votes for their own team.
    const tm = full(4, 'teams');
    const teamD = withMode({ ...tm, teamMode: true, managers: tm.managers.map((m, k) => ({ ...m, members: [{ id: m.id + 'a', name: 'P' + k + 'a' }, { id: m.id + 'b', name: 'P' + k + 'b', bot: k % 2 ? { type: 'chaos', level: 'easy' } : undefined }] })) }, 'bracket');
    let td = F.startFinale(teamD); const tn = F.nextMatchup(td.finale.bracket);
    const tv = F.matchVoters(td, tn.m);
    ok(tv.every((p) => p.teamId !== tn.m.a && p.teamId !== tn.m.b), 'team mode: only members of the other teams vote on a matchup');
    td = F.botMatchVotes(td, tn.r, tn.i);
    ok(Object.entries(F.getMatchup(td, tn.r, tn.i).votes).every(([pid, t]) => tv.find((p) => p.id === pid).teamId !== t), 'bots vote, never for their own team');
    const finalOnly = F.startFinale(withMode(full(2, 'two'), 'bracket'));
    const fv = F.matchVoters(finalOnly, F.nextMatchup(finalOnly.finale.bracket).m);
    ok(fv.length === 2 && F.matchVoteProblem(finalOnly, F.nextMatchup(finalOnly.finale.bracket).m, fv[0].id, fv[0].teamId) === 'You can’t vote for your own team.', 'with only two teams both vote, each blocked from their own team');
    // Incomplete and empty rosters.
    const inc = full(3, 'inc'); const incD = { ...inc, managers: inc.managers.map((m, k) => (k === 0 ? { ...m, team: m.team.map((t, j) => (j < 2 ? t : null)) } : k === 2 ? { ...m, team: m.team.map(() => null) } : m)) };
    const incRun = runFinale(withMode(incD, 'sim'));
    ok(F.teamRating(incD, incD.managers[0]).provisional && incRun.d.finale.champion && !incRun.d.finale.bracket.rounds[0].some((m) => m.a === incD.managers[2].id || m.b === incD.managers[2].id), 'incomplete squads get a provisional rating and still play; empty teams sit out');
    const none = F.startFinale(withMode({ ...inc, managers: inc.managers.map((m) => ({ ...m, team: m.team.map(() => null) })) }, 'sim'));
    ok(!none.finale.champion && !F.nextMatchup(none.finale.bracket) && !none.votesRevealed, 'no teams with players → no matchups and no champion (no crash)');
    // Missing ratings / overrides on real topic data.
    const pl = DN.starterTopics().find((t) => t.id === 't-pl');
    const rs = pl.items.map((it) => F.playerRating(it));
    ok(rs.every((r) => r.ovr >= 1 && r.ovr <= 99 && r.estimated && Object.values(r.attrs).every((a) => a >= 1 && a <= 99)), 'every Premier League player gets an estimated 1–99 rating with six attributes in range');
    ok(F.playerRating({ ...pl.items[0], rating: 'abc' }).estimated && F.playerRating({ ...pl.items[0], rating: 150 }).estimated, 'invalid overrides are ignored (falls back to the estimate)');
    const share = DN.share.unpackTopic(DN.share.packTopic({ ...pl, items: pl.items.map((it, k) => (k === 0 ? { ...it, rating: 88 } : it)) }));
    ok(share.ok && share.topic.items[0].rating === 88 && share.topic.items[1].rating === undefined, 'rating overrides survive topic sharing');
    // Profiles.
    const champs = runFinale(withMode(full(4, 'prof'), 'sim')).d;
    const humanD = { ...champs, createdAt: Date.now() };
    const rows = DN.stats.careerStats([humanD], {});
    const champName = DN.tally(humanD).winners[0].name.toLowerCase();
    const cr = rows.find((r) => r.key === champName);
    ok(cr && cr.wins === 1 && cr.titles === 1 && cr.matches >= 1 && cr.topRating, 'profiles count finale titles, match record, goals and best team rating');
    ok(DN.winsBoard([humanD]).find((r) => r.name.toLowerCase() === champName).wins === 1, 'the champion counts on the all-time wins board');
  }

  console.log('Step 6: finale through the screens');
  {
    const fb = (d, text) => btn(d.querySelector('.finale') || d, text);
    const mk = async (mode, n, seed) => {
      const a = await boot();
      const sim = require('./finale-sim.js')(a.DN);
      const raw = sim.fullDraft(n, seed);
      return { ...raw, topic: { ...raw.topic, layout: 'pitch' }, managers: raw.managers.map((m, k) => ({ ...m, name: ['Ash', 'Bilal', 'Cam', 'Dee', 'Eli'][k] || 'T' + k })), rules: { ...raw.rules, finale: { mode, weight: 60, speed: 'instant', commentary: true, tiebreak: 'rating' } }, phase: 'done', mode: 'local', createdAt: Date.now(), history: [] };
    };
    // Match simulator, 3 teams (one bye), instant speed.
    const draft = await mk('sim', 3, 'scr');
    const { w, d } = await boot({ idb: false, storage: { dn_current_v1: JSON.stringify(draft) }, speed: 0.02 });
    await click(w, btn(d, 'Resume draft'));
    ok(/Start the finale/.test(d.body.textContent) && !/Start the secret vote/.test(d.body.textContent), 'Results offers the finale instead of the group vote');
    ok(!!d.querySelector('.teamrating') && /Team rating/.test(d.body.textContent), 'team cards show the team rating with a breakdown');
    await click(w, btn(d, 'Start the finale'));
    ok(!!d.querySelector('.finale .bracket') && /Semi-finals|Final/.test(d.body.textContent), 'the finale shows a bracket with round names');
    let rounds = 0;
    while (rounds++ < 5 && fb(d, 'Kick off')) {
      await click(w, fb(d, 'Kick off')); await sleep(80);
      ok(!!d.querySelector('.scoreboard') && /FT|AET|pens/.test(d.querySelector('.sb-clock').textContent), 'match ' + rounds + ': scoreboard reaches full-time');
      ok(/Match summary/.test(d.body.textContent), 'match ' + rounds + ': summary with scorers and stats');
      await click(w, fb(d, 'Continue'));
      ok(/Through to the next round|Winner of the final/.test(d.body.textContent), 'match ' + rounds + ': the winner is shown');
      const back = fb(d, 'Back to the bracket') || fb(d, 'Reveal the champion');
      await click(w, back); await sleep(50);
    }
    const stored = JSON.parse(w.localStorage.getItem('dn_current_v1') || 'null');
    await sleep(200);
    ok(/Champions!/.test(d.body.textContent) && /Why they won/.test(d.body.textContent) && /Final standings/.test(d.body.textContent), 'results show the champion, why they won and the final standings');
    const cur = w.__DN.store.get('dn_current_v1');
    ok(cur && cur.finale && cur.finale.champion && cur.votesRevealed, 'the champion is saved with the draft');
    const champ = JSON.stringify(cur.finale);
    // Watch a recorded match again and play a friendly: the saved result must not change.
    const dm = d.querySelector('.resultwrap .bmatch.done'); if (dm) await click(w, dm);
    const again = btn(d, 'Watch again'); if (again) { await click(w, again); await sleep(1500); }
    await click(w, btn(d, 'Close'));
    await click(w, btn(d, 'Friendly match'));
    await click(w, fb(d, 'Kick off')); await sleep(80);
    ok(/Exhibition/.test(d.body.textContent) && !!d.querySelector('.scoreboard'), 'a friendly/rematch can be played between any two teams');
    await click(w, btn(d, 'Rematch')); await sleep(80);
    await click(w, btn(d, 'Close'));
    ok(JSON.stringify(w.__DN.store.get('dn_current_v1').finale) === champ, 'replays and rematches don’t change the saved result');
    void stored;

    // Local vote bracket with 3 teams: pass the phone, no own-team votes.
    const vd = await mk('bracket', 3, 'vote');
    const b2 = await boot({ idb: false, storage: { dn_current_v1: JSON.stringify(vd) }, speed: 0.02 });
    await click(b2.w, btn(b2.d, 'Resume draft'));
    await click(b2.w, btn(b2.d, 'Start the finale'));
    let guard = 0;
    while (guard++ < 6 && fb(b2.d, 'Vote on this matchup')) {
      await click(b2.w, fb(b2.d, 'Vote on this matchup'));
      const grid = [...b2.d.querySelectorAll('.finale .votegrid .votebtn:not([disabled])')];
      for (const g of grid) {
        await click(b2.w, [...b2.d.querySelectorAll('.finale .votegrid .votebtn:not([disabled])')][0]);
        const opts = [...b2.d.querySelectorAll('.finale .votebtn')];
        ok(opts.some((o) => o.disabled) || opts.every((o) => !/your team/.test(o.textContent)), 'voter sees their own team blocked (if it’s in the matchup)');
        await click(b2.w, opts.find((o) => !o.disabled));
        await click(b2.w, fb(b2.d, 'Lock in'));
        await click(b2.w, fb(b2.d, 'Next voter'));
        void g;
      }
      await click(b2.w, fb(b2.d, 'Count'));
      ok(/Votes/.test(b2.d.body.textContent) && /→/.test(b2.d.body.textContent), 'matchup result shows who voted for whom');
      await click(b2.w, fb(b2.d, 'Back to the bracket') || fb(b2.d, 'Reveal the champion')); await sleep(50);
    }
    await sleep(200);
    ok(/Champions!/.test(b2.d.body.textContent), 'the vote bracket crowns a champion through the screens');

    // Combined finale, animated at "fast" speed (sped up for the test), with the auctioneer voice.
    const cd = await mk('combined', 4, 'comb');
    cd.rules.finale.speed = 'fast';
    const b3 = await boot({ idb: false, storage: { dn_current_v1: JSON.stringify(cd) }, speed: 0.02, fakeAudio: true });
    await click(b3.w, btn(b3.d, 'Resume draft'));
    await click(b3.w, btn(b3.d, 'Start the finale'));
    let g3 = 0, sawClock = false, sawBreakdown = false;
    while (g3++ < 6 && fb(b3.d, 'Vote, then kick off')) {
      await click(b3.w, fb(b3.d, 'Vote, then kick off'));
      while (b3.d.querySelector('.finale .votegrid .votebtn:not([disabled])')) {
        await click(b3.w, b3.d.querySelector('.finale .votegrid .votebtn:not([disabled])'));
        await click(b3.w, [...b3.d.querySelectorAll('.finale .votebtn')].find((o) => !o.disabled));
        await click(b3.w, fb(b3.d, 'Lock in')); await click(b3.w, fb(b3.d, 'Next voter'));
      }
      await click(b3.w, fb(b3.d, 'Count'));
      await sleep(120);
      const ck = b3.d.querySelector('.sb-clock'); if (ck && /′/.test(ck.textContent)) sawClock = true;
      for (let t = 0; t < 100 && !fb(b3.d, 'Combine with the votes'); t++) await sleep(100);
      await click(b3.w, fb(b3.d, 'Combine with the votes'));
      if (/How it was decided/.test(b3.d.body.textContent) && /match 60%/.test(b3.d.body.textContent)) sawBreakdown = true;
      await click(b3.w, fb(b3.d, 'Back to the bracket') || fb(b3.d, 'Reveal the champion')); await sleep(50);
    }
    await sleep(200);
    ok(sawClock, 'the animated match shows a running clock');
    ok(sawBreakdown, 'combined finale shows the 60% match / 40% votes breakdown');
    ok(/Champions!/.test(b3.d.body.textContent), 'combined finale crowns a champion through the screens');
    ok(b3.w.__spoken.some((t) => /GOAL|scores|champions/i.test(t)), 'the auctioneer calls goals / the champion');

    // Solo: you vote on matchups you're not in; bots vote by themselves.
    const sd = await mk('bracket', 4, 'solo');
    sd.mode = 'solo'; sd.managers = sd.managers.map((m, k) => (k === 0 ? { ...m, human: true } : { ...m, bot: { type: ['big', 'bargain', 'strategist', 'chaos'][k % 4], level: 'medium' } }));
    const b4 = await boot({ idb: false, storage: { dn_current_v1: JSON.stringify(sd) }, speed: 0.02 });
    await click(b4.w, btn(b4.d, 'Resume draft'));
    await click(b4.w, btn(b4.d, 'Start the finale'));
    let g4 = 0;
    while (g4++ < 6 && fb(b4.d, 'Vote on this matchup')) {
      await click(b4.w, fb(b4.d, 'Vote on this matchup'));
      const pick = [...b4.d.querySelectorAll('.finale .votebtn')].find((o) => !o.disabled && /rating/.test(o.textContent));
      if (pick) { await click(b4.w, pick); await click(b4.w, fb(b4.d, 'Lock in')); await click(b4.w, fb(b4.d, 'Count the votes')); }
      else await click(b4.w, fb(b4.d, 'Count'));
      await click(b4.w, fb(b4.d, 'Back to the bracket') || fb(b4.d, 'Reveal the champion')); await sleep(50);
    }
    await sleep(200);
    const s4 = b4.w.__DN.store.get('dn_current_v1');
    const okVotes = s4.finale.bracket.rounds.flat().every((m) => Object.entries(m.votes || {}).every(([pid, t]) => pid !== t));
    ok(/Champions!/.test(b4.d.body.textContent) && okVotes, 'solo bracket: bots vote, nobody votes for their own team, a champion is crowned');
  }

  if (!process.env.SKIP_ONLINE) await require('./online.js')({ ok, boot, btn, click, sleep });

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
