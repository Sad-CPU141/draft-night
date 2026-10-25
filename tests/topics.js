// Topic library + curated popularity, favourites and pins.
module.exports = async function topicTests({ ok, boot, btn, click, sleep }) {
  const setVal = async (p, el, v) => { const proto = Object.getOwnPropertyDescriptor(p.w.HTMLInputElement.prototype, 'value'); proto.set.call(el, v); el.dispatchEvent(new p.w.Event('input', { bubbles: true })); await sleep(20); };
  const names = (p) => [...p.d.querySelectorAll('.trow2 .tcard .name')].map((n) => n.firstChild.textContent);
  const rowOf = (p, name) => [...p.d.querySelectorAll('.trow2')].find((r) => r.querySelector('.tcard .name').firstChild.textContent === name);
  const tab = (p, label) => [...p.d.querySelectorAll('.ttab')].find((b) => b.textContent.includes(label));
  const star = (p, name) => rowOf(p, name).querySelectorAll('.tmark')[0];
  const pin = (p, name) => rowOf(p, name).querySelectorAll('.tmark')[1];
  const openFolder = async (p, f) => click(p.w, [...p.d.querySelectorAll('.folder')].find((b) => b.querySelector('.fn').textContent === f));
  const back = async (p) => click(p.w, p.d.querySelector('.iconbtn[aria-label="All folders"]'));

  console.log('Topic library');
  const P = await boot({ idb: false });
  const { DN } = P; const L = DN.topicsLib;
  const ts = DN.starterTopics();
  const by = {}; ts.forEach((t) => { (by[L.folderOf(t)] = by[L.folderOf(t)] || []).push(t); });
  const OLD = 48;
  ok(ts.length >= 153, 'at least 153 built-in topics (' + ts.length + ')');
  ok(ts.length - OLD >= 105, 'at least 105 new topics (' + (ts.length - OLD) + ')');
  const v3 = ts.filter((t) => t.v3);
  const perV3 = {}; v3.forEach((t) => { perV3[L.folderOf(t)] = (perV3[L.folderOf(t)] || 0) + 1; });
  ok(Object.keys(by).length === 7 && Object.values(perV3).length === 7 && Object.values(perV3).every((n) => n >= 15), 'every one of the 7 folders gained 15+ topics (' + Object.entries(perV3).map(([f, n]) => f + ' +' + n + '=' + by[f].length).join(', ') + ')');
  ok(ts.every((t) => t.items.length >= 20), 'every topic has 20+ items (smallest ' + Math.min(...ts.map((t) => t.items.length)) + ')');
  const tn = ts.map((t) => t.name.toLowerCase());
  ok(new Set(tn).size === tn.length, 'no two topics share a name');
  const dupItems = ts.filter((t) => new Set(t.items.map((i) => i.name.toLowerCase())).size !== t.items.length).map((t) => t.name);
  ok(!dupItems.length, 'no duplicate items inside a topic' + (dupItems.length ? ': ' + dupItems.join(', ') : ''));
  ok(ts.every((t) => t.slots.length && t.items.every((i) => i.name && i.id)), 'every topic has slots and named items');
  {
    const K = (id) => L.artKind(ts.find((t) => t.id === id));
    const kinds = {}; ts.forEach((t) => { const k = L.artKind(t); kinds[k] = (kinds[k] || 0) + 1; });
    ok(K('t-house') === 'drawn' && K('t-goat') === 'photo' && K('t-cf') === 'photo' && K('t-capitals') === 'photo' && K('t-redflags') === 'emoji', 'pictures are classified correctly behind the badges: photo topics are never called drawn (' + Object.entries(kinds).map(([k, n]) => k + ' ' + n).join(', ') + ')');
    const mixed = { ...ts.find((t) => t.id === 't-house') }; mixed.items = [...mixed.items, { id: 'x1', name: 'Moon Base', emoji: '🌕' }];
    const illus = ts.filter((t) => ['drawn', 'mixed', 'kit'].includes(L.artKind(t))).map((t) => t.id).sort();
    const sims = ts.filter((t) => L.simKind(t)).map((t) => t.id);
    ok(JSON.stringify(illus) === JSON.stringify(['t-backyard', 't-club', 't-ff', 't-house', 't-outfit']) && ['t-cf', 't-goat', 't-pl', 't-ani', 't-pow'].every((id) => sims.includes(id)), '🎨 Illustrated badge on the 5 drawn topics (4 picture-builders + club kits); Simulation badge on ' + sims.length + ' topics (3 football + fun battles)');
    ok(L.artKind(mixed) === 'mixed', 'a drawn topic with an extra item of your own keeps its Illustrated badge');
  }
  // Big groups: every topic fills 16 players unless reality caps it (or it waits on scene art).
  const CAPPED = ['t-f1', 't-plclubs', 't-wonder', 't-nbateams', 't-saudi', 't-states', 't-canada', 't-ff', 't-house', 't-backyard', 't-outfit'];
  const small = ts.filter((t) => L.maxPlayersFor(t) < 16 && !CAPPED.includes(t.id)).map((t) => t.id + ' ' + L.maxPlayersFor(t));
  ok(!small.length, 'every other topic has enough items for 16 players' + (small.length ? ': ' + small.join(', ') : ' (' + (ts.length - CAPPED.length) + ' topics)'));
  const badPos = ts.filter((t) => t.items.some((i) => i.pos) && t.items.some((i) => /-e\d+$/.test(i.id) && !t.slots.some((sl) => sl.toLowerCase() === (i.pos || '').toLowerCase()) && !/flex/i.test(i.pos || ''))).map((t) => t.id);
  ok(!badPos.length, 'extra items in position topics all use a real position' + (badPos.length ? ': ' + badPos.join(', ') : ''));
  ok(L.maxPlayersFor({ slots: ['A', 'A', 'B'], items: [...Array(10)].map((_, i) => ({ pos: 'A' })).concat([{ pos: 'B' }, { pos: 'B' }, { pos: 'B' }]) }) === 3 && L.maxPlayersFor({ slots: ['Pick 1', 'Pick 2'], items: [...Array(9)].map(() => ({})) }) === 4, 'player capacity counts each position separately');
  {
    const ani = ts.find((t) => t.id === 't-cats');
    const old = { ...ani, extrasV: 1, items: ani.items.filter((i) => !/-e\d+$/.test(i.id)).concat([{ id: 'mine-1', name: 'My Own Cat', pos: '', photo: '' }]) };
    const m = DN.migrateTopics([old]).find((t) => t.id === 't-cats');
    ok(m.items.length === ani.items.length + 1 && m.items.some((i) => i.name === 'My Own Cat') && m.extrasV === ani.extrasV, 'saved copies gain the new extras once and keep their own items (' + old.items.length + ' -> ' + m.items.length + ')');
    ok(DN.migrateTopics([m]).find((t) => t.id === 't-cats').items.length === m.items.length, 'running the upgrade again adds nothing twice');
  }
  const pitch = ts.filter((t) => t.layout === 'pitch').map((t) => t.id).sort();
  ok(JSON.stringify(pitch) === JSON.stringify(['t-cf', 't-goat', 't-pl']), 'only the 3 football topics use the pitch, ratings and simulator (' + pitch.join(', ') + ')');
  const footy = ts.filter((t) => t.layout !== 'pitch' && DN.finale.isFootball(t)).map((t) => t.id).sort();
  ok(JSON.stringify(footy) === JSON.stringify(['t-ucl', 't-wfoot', 't-wonder']), 'only Champions League Legends, Wonderkids and Women’s Football Stars also play the football match (' + footy.join(', ') + ')');
  ok(ts.every((t) => L.isBuiltIn(t)), 'every starter is marked built-in');

  console.log('Curated popularity');
  const ids = new Set(ts.map((t) => t.id));
  ok(ts.every((t) => typeof L.popScore(t) === 'number'), 'every built-in topic has a curated score');
  ok(Object.keys(L.POPULARITY).every((id) => ids.has(id)), 'no score points at a topic that doesn’t exist');
  ok(Object.values(L.POPULARITY).every((n) => Number.isInteger(n) && n >= 0 && n <= 99), 'scores are whole numbers from 0–99');
  const order1 = [...ts].sort(L.byPopularity).map((t) => t.id);
  const order2 = [...ts].reverse().sort(L.byPopularity).map((t) => t.id);
  ok(JSON.stringify(order1) === JSON.stringify(order2), 'Popular order is stable whatever order topics are stored in');

  // Topics screen (Manage topics) in the app.
  await click(P.w, btn(P.d, 'Topics'));
  ok(/Topics \(\d+\)/.test(P.d.body.textContent) && P.d.querySelectorAll('.folder').length === 7, 'Topics screen shows the count and 7 folders');
  const folderCounts = [...P.d.querySelectorAll('.folder')].map((f) => f.querySelector('.fn').textContent + ':' + parseInt(f.querySelector('.fc').textContent, 10));
  ok(folderCounts.every((x) => { const [f, n] = x.split(':'); return by[f] && by[f].length === +n; }), 'each folder card shows its topic count (' + folderCounts.join(', ') + ')');
  await click(P.w, tab(P, 'Popular'));
  const pop1 = names(P);
  ok(pop1.length === ts.length && pop1[0] === ts.find((t) => t.id === order1[0]).name && /#1 ·/.test(P.d.body.textContent), '1. Popular shows every built-in topic in the curated order, ranked #1… (' + pop1.slice(0, 3).join(', ') + '…)');

  console.log('Favourites and pins');
  await click(P.w, tab(P, 'Favourites'));
  ok(/No favourites yet — tap ☆ on any topic/.test(P.d.body.textContent) && !P.d.querySelector('.trow2'), '2. Favourites starts with a friendly empty state');
  await click(P.w, tab(P, 'Folders'));
  await openFolder(P, 'Travel & Places');
  const travel = names(P);
  const travelCurated = L.folderOrder(by['Travel & Places'], { fav: [], pin: [] }).map((t) => t.name);
  ok(JSON.stringify(travel) === JSON.stringify(travelCurated), '3. a folder lists its topics in curated order');
  const low = travel[travel.length - 1], low2 = travel[travel.length - 2];
  await click(P.w, star(P, low));
  ok(star(P, low).getAttribute('aria-pressed') === 'true' && star(P, low).textContent === '★', '4. tapping ☆ marks a topic as a favourite');
  ok(JSON.stringify(names(P)) === JSON.stringify(travel), '5. favouriting doesn’t move the topic inside its folder');
  await back(P); await click(P.w, tab(P, 'Favourites'));
  ok(JSON.stringify(names(P)) === JSON.stringify([low]), '6. the favourite appears in the Favourites tab');
  await click(P.w, tab(P, 'Popular'));
  ok(JSON.stringify(names(P)) === JSON.stringify(pop1), '7. Popular order doesn’t change after favouriting (not based on usage)');
  await click(P.w, tab(P, 'Folders'));
  await openFolder(P, 'Travel & Places');
  await click(P.w, pin(P, low2));
  ok(names(P)[0] === low2 && JSON.stringify(names(P).slice(1)) === JSON.stringify(travel.filter((n) => n !== low2)), '8. pinning moves the topic to the top of its folder; the rest keep their order');
  await click(P.w, pin(P, low));
  const twoPins = names(P).slice(0, 2);
  ok(JSON.stringify(twoPins) === JSON.stringify(travel.filter((n) => n === low || n === low2)), '9. several pins sit at the top in curated order (' + twoPins.join(', ') + ')');
  const otherBefore = L.folderOrder(by['Food & Drink'], { fav: [], pin: [] }).map((t) => t.name);
  await back(P); await openFolder(P, 'Food & Drink');
  ok(JSON.stringify(names(P)) === JSON.stringify(otherBefore), '10. a pin only affects its own folder');
  await back(P); await click(P.w, tab(P, 'Popular'));
  ok(JSON.stringify(names(P)) === JSON.stringify(pop1), '    …and never changes the Popular ranking');
  await click(P.w, tab(P, 'Folders')); await openFolder(P, 'Travel & Places');
  ok(star(P, low2).getAttribute('aria-pressed') === 'false', '11. pinning doesn’t favourite');
  await click(P.w, star(P, low));
  ok(pin(P, low).getAttribute('aria-pressed') === 'true' && names(P).slice(0, 2).includes(low), '    un-favouriting doesn’t unpin');
  await click(P.w, pin(P, low)); await click(P.w, pin(P, low2));
  ok(JSON.stringify(names(P)) === JSON.stringify(travel), '12. unpinning puts topics back in their curated place');
  // Keep one favourite + one pin for the reload test.
  await click(P.w, star(P, travel[0])); await click(P.w, pin(P, low));
  // Wait for the settings save (it's debounced, so it can lag under load).
  for (let t = 0; t < 100; t++) { const v = P.w.localStorage.getItem('dn_settings_v1') || ''; if (v.includes('"' + ts.find((x) => x.name === low).id + '"')) break; await sleep(30); }
  const saved = P.w.localStorage.getItem('dn_settings_v1');
  P.w.close();
  const R = await boot({ idb: false, compress: true, storage: { dn_settings_v1: saved, dn_topics_v1: JSON.stringify(ts), dn_starters_seen_v1: JSON.stringify(ts.map((t) => t.id)) } });
  await click(R.w, btn(R.d, 'Topics'));
  await openFolder(R, 'Travel & Places');
  ok(names(R)[0] === low && star(R, travel[0]).getAttribute('aria-pressed') === 'true', '13. favourites and pins are still there after a reload (saved on this device)');
  await back(R);

  console.log('Search, folders, random, your own topics');
  await setVal(R, R.d.querySelector('#topic-search'), 'pizza');
  const hits = names(R);
  ok(hits.length >= 1 && hits.every((n) => /pizza/i.test(n)) && R.d.querySelector('.tfolder'), '14. search finds topics by name and shows their folder (' + hits.join(', ') + ')');
  await setVal(R, R.d.querySelector('#topic-search'), 'animals');
  ok(names(R).length === by.Animals.length, '    searching a folder name lists that folder’s topics');
  await setVal(R, R.d.querySelector('#topic-search'), 'zzzzqq');
  ok(/No topics match/.test(R.d.body.textContent), '    no matches shows a message');
  await setVal(R, R.d.querySelector('#topic-search'), '');
  await openFolder(R, 'Animals');
  ok(names(R).length === by.Animals.length && names(R).every((n) => by.Animals.some((t) => t.name === n)), '    opening a folder filters to that folder only');
  await back(R);

  // Your own topic: created and imported topics sit with the built-ins without replacing any.
  await click(R.w, btn(R.d, '+ New topic'));
  await sleep(50);
  const topicsNow = R.DN.store.get('dn_topics_v1');
  const mine = topicsNow.find((t) => !L.isBuiltIn(t));
  ok(mine && topicsNow.length === ts.length + 1, 'creating a topic adds it without touching the built-ins');
  const custom = { ...mine, name: 'Our Snacks', items: Array.from({ length: 5 }, (_, i) => ({ id: 'cs' + i, name: 'Snack ' + i, pos: '', desc: '' })) };
  const shared = await R.DN.share.decodeShared(await R.DN.share.encodeTopic(DN.starterTopics().find((t) => t.id === 't-pizza') || ts[5], false));
  ok(shared.ok && shared.topic.id !== 't-pizza' && !L.isBuiltIn(shared.topic), 'an imported copy of a built-in gets its own id (never overwrites the original)');
  R.w.close();
  const C = await boot({ idb: false, storage: { dn_settings_v1: saved, dn_topics_v1: JSON.stringify([...ts, custom, { ...shared.topic, folder: 'My Topics' }]), dn_starters_seen_v1: JSON.stringify(ts.map((t) => t.id)) } });
  await click(C.w, btn(C.d, 'Topics'));
  ok(/Topics \(\d+\)/.test(C.d.body.textContent) && C.d.body.textContent.includes('Topics (' + (ts.length + 2) + ')'), 'the count includes your topics');
  await click(C.w, tab(C, 'Popular'));
  const popC = names(C);
  ok(JSON.stringify(popC.slice(0, ts.length)) === JSON.stringify(pop1) && /Your topics/.test(C.d.body.textContent) && popC.slice(ts.length).includes('Our Snacks'), 'your topics come after the ranked built-ins in Popular, labelled “Your topics”');
  ok(!!rowOf(C, 'Our Snacks').querySelector('.yours') && !rowOf(C, pop1[0]).querySelector('.yours'), 'your topics carry a “Yours” tag; built-ins don’t');
  await click(C.w, star(C, 'Our Snacks'));
  await click(C.w, tab(C, 'Favourites'));
  ok(names(C).includes('Our Snacks'), 'your own topics can be favourited too');
  C.w.close();

  // Random pick + migration from an old 48-topic save.
  const old = ts.filter((t) => !t.v3).slice(0, 48);
  const M = await boot({ idb: false, storage: { dn_topics_v1: JSON.stringify([...old, custom]), dn_starters_seen_v1: JSON.stringify(old.map((t) => t.id)) } });
  const after = M.DN.store.get('dn_topics_v1');
  ok(after.length === ts.length + 1 && after.some((t) => t.name === 'Our Snacks'), 'an old save gains every new topic once and keeps its own topic (' + after.length + ')');
  const M2 = await boot({ idb: false, storage: { dn_topics_v1: JSON.stringify(after.filter((t) => t.id !== 't-rivers')), dn_starters_seen_v1: JSON.stringify(ts.map((t) => t.id)) } });
  ok(M2.DN.store.get('dn_topics_v1').length === after.length - 1, 'a built-in you deleted doesn’t come back');
  const ids2 = M.DN.store.get('dn_topics_v1').map((t) => t.id);
  ok(new Set(ids2).size === ids2.length, 'no duplicate topics after migration');
  M2.w.close();
  M.w.close();
  {
    // Random: SetupTopic 🎲 picks a playable topic from the current folder.
    const X = await boot({ idb: false, storage: { dn_managers_v1: JSON.stringify([{ id: 'a', name: 'Ann', color: '#ff0000', emoji: 'a' }, { id: 'b', name: 'Ben', color: '#00ff00', emoji: 'b' }]) } });
    let reached = false;
    await click(X.w, btn(X.d, 'Local'));
    const next = btn(X.d, 'Next: pick a topic'); if (next) { await click(X.w, next); reached = !!X.d.querySelector('#topic-search'); }
    if (reached) {
      await openFolder(X, 'Animals');
      await click(X.w, btn(X.d, 'Random topic from Animals'));
      const txt = X.d.body.textContent;
      ok(by.Animals.some((t) => txt.includes(t.name)) && !X.d.querySelector('#topic-search'), '🎲 Random picks a topic from the open folder and moves on');
    } else ok(false, 'reached the topic picker for the random test');
    X.w.close();
  }
};
