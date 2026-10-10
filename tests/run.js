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

async function boot({ idb = true, fetchImpl, storage } = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '').replace(/<link[^>]*>/g, ''), {
    url: 'https://sad-cpu141.github.io/draft-night/', runScripts: 'outside-only', pretendToBeVisual: true,
  });
  const w = dom.window;
  w.__DN_TEST__ = true;
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
    ok(!!btn(d, 'New draft'), 'home screen renders');
    ok(DN.store.backend === 'indexeddb', 'storage uses IndexedDB');
    await click(w, btn(d, 'New draft'));
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
