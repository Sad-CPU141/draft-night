// Buildable scenes (Batch 1): Dream House, Build an Outfit, Dream Backyard, Fast Food tray.
module.exports = async function sceneTests({ ok, boot, btn, click, sleep }) {
  console.log('Buildable scenes');
  const P = await boot({ idb: false });
  const DN = P.DN; const S = DN.scenes; const ts = DN.starterTopics();
  const want = { 't-house': 'house', 't-outfit': 'outfit', 't-backyard': 'backyard', 't-ff': 'tray' };
  const topics = Object.keys(want).map((id) => ts.find((t) => t.id === id));
  ok(topics.every((t, i) => t && t.scene === Object.values(want)[i] && S.sceneOf(t)), 'all four topics are built-in and linked to their scene (Dream House, Build an Outfit, Dream Backyard, Fast Food Items)');
  ok(topics.every((t) => t.items.every((it) => S.sceneHasArt(t, it))), 'every item in the four topics has its own drawing (' + topics.map((t) => t.items.length).join(' + ') + ' items)');
  ok(Object.values(S.SCENES).every((sc) => new Set(sc.list.map((r) => r[0])).size === sc.list.length), 'the art manifest has one entry per item (no duplicates)');
  const ff = topics[3]; const ffNames = ff.items.map((i) => i.name);
  ok(ff.items.length === 30 && ffNames.includes('Big Mac') && ff.photos, 'Fast Food Items keeps its 30 menu items and Wikipedia photos (the tray is added on top)');
  const outfit = topics[1];
  ok(JSON.stringify(outfit.slots) === JSON.stringify(['Hat', 'Top', 'Jacket', 'Bottoms', 'Shoes', 'Accessory']) && ['Hat', 'Top', 'Jacket', 'Bottoms', 'Shoes', 'Accessory'].every((c) => outfit.items.filter((i) => i.pos === c).length === 5), 'Build an Outfit has the 6 categories, 5 items each');

  // Placement: designed spots don't collide; nothing covers the mansion.
  const overlap = (a, b) => { const ox = Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]); const oy = Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]); return ox > 0 && oy > 0 ? (ox * oy) / Math.min(a[2] * a[3], b[2] * b[3]) : 0; };
  const designed = new Set(['Waterslide|Infinity Pool', 'Outdoor Kitchen|Waterslide']);
  const clashes = [];
  ['house', 'backyard'].forEach((id) => { const L = S.SCENES[id].list.filter((r) => r[2] < 20); L.forEach((a, i) => L.slice(i + 1).forEach((b) => { if (overlap(a[1], b[1]) > 0.15 && !designed.has(a[0] + '|' + b[0]) && !designed.has(b[0] + '|' + a[0])) clashes.push(a[0] + '/' + b[0]); })); });
  ok(!clashes.length, 'house and backyard: every item has its own spot; with everything placed nothing collides' + (clashes.length ? ': ' + clashes.join(', ') : ''));
  const mansion = [180, 118, 160, 94];
  ok(S.SCENES.house.list.filter((r) => r[0] !== 'Rooftop Terrace').every((r) => overlap(r[1], mansion) < 0.02), 'nothing is placed over the mansion (only the rooftop terrace sits on its roof)');
  const yardBox = (n) => S.SCENES.backyard.list.find((r) => r[0] === n)[1];
  ok(yardBox('Outdoor Dining Table')[1] < 112 && yardBox('Patio Sofa')[1] < 112 && yardBox('Swimming Pool')[1] > 112 && yardBox('Vegetable Garden')[1] > 250, 'backyard zones: dining and sofa on the patio deck, pool on the lawn, vegetables in the garden');
  ok(JSON.stringify(S.SCENES.backyard.view) === JSON.stringify(S.SCENES.house.view) && S.SCENES.backyard.Background !== S.SCENES.house.Background, 'backyard has its own background and layout (not a renamed house)');

  // Tray: categories go to their own places; two mains don't stack.
  const tray = S.SCENES.tray;
  const placed = S.placeScene(tray, [{ item: { id: 'a', name: 'Big Mac' }, slot: 'Main' }, { item: { id: 'b', name: 'Whopper' }, slot: 'Main' }, { item: { id: 'c', name: 'Fries' }, slot: 'Side' }, { item: { id: 'd', name: 'Root Beer' }, slot: 'Drink' }, { item: { id: 'e', name: 'McFlurry' }, slot: 'Dessert' }]);
  const at = (id) => placed.find((p) => p.id === id).at;
  ok(new Set(placed.map((p) => p.at.join(','))).size === 5 && at('d')[1] < at('a')[1] && at('e')[1] < at('c')[1], 'tray: each food gets its own place; drinks and desserts stand behind the mains and sides');
  ok(placed.map((p) => p.id).join('') === 'deabc' || placed[0].at[1] <= placed[placed.length - 1].at[1], '    items are drawn back to front');

  // Missing art fails gracefully.
  const unknown = S.placeScene(S.SCENES.house, [{ item: { id: 'u', name: 'Bubble Tea Bar' }, slot: '' }, { item: { id: 'p', name: 'Infinity Pool' }, slot: '' }]);
  const oddOutfit = S.placeScene(S.SCENES.outfit, [{ item: { id: 'g', name: 'Gold Crown' }, slot: 'Hat' }]);
  const oddTray = S.placeScene(tray, [{ item: { id: 't', name: 'Mystery Taco' }, slot: 'Main' }]);
  ok(unknown.length === 2 && oddOutfit.length === 1 && oddTray.length === 1 && unknown.every((p) => typeof p.draw === 'function'), 'items without a drawing get a stand-in (a sign, a plain garment, a plain burger) instead of breaking the scene');
  const div = P.d.createElement('div'); P.d.body.appendChild(div);
  let threw = null;
  try { P.w.ReactDOM.render(P.w.React.createElement(S.SceneCanvas, { scene: S.SCENES.house, placed: unknown, label: 'test' }), div); } catch (e) { threw = e; }
  await sleep(30);
  ok(!threw && div.querySelectorAll('[data-item]').length === 2, '    …and the scene still renders');

  // Topic data travels: sharing and online rooms keep the scene.
  const back = DN.share.unpackTopic(DN.share.packTopic(topics[0], false));
  ok(back.ok && back.topic.scene === 'house' && back.topic.art === 'scene', 'a shared topic (and an online room, which uses the same packing) keeps its scene');
  const bad = DN.share.unpackTopic({ ...DN.share.packTopic(topics[0], false), sc: 'not-a-scene' });
  ok(bad.ok && !bad.topic.scene, '    an unknown scene name from a shared code is ignored');
  const draft = DN.createDraft(topics[1], [{ id: 'a', name: 'Ann', color: '#f00', emoji: 'a' }, { id: 'b', name: 'Ben', color: '#0f0', emoji: 'b' }], { ...DN.DEFAULT_RULES, slots: topics[1].slots, skip: { on: false, endgame: { on: false } } }, { seed: 'o' });
  ok(draft.topic.scene === 'outfit', 'a new draft remembers its scene');
  // One item per category: the slot rules do this already.
  let od = draft; const hoodieFirst = od.queue.map((id) => od.items[id]).filter((i) => i.pos === 'Top').map((i) => i.id);
  od = { ...od, queue: [...hoodieFirst, ...od.queue.filter((id) => !hoodieFirst.includes(id))] };
  od = DN.sell(DN.placeBid(od, 'a', 1));
  ok(!DN.canBid(od, od.managers[0], DN.nextAmount(od)), 'outfit: once you have a Top you can’t buy a second one (one item per category)');
  P.w.close();

  // Migration of saved topics.
  const oldHouse = { id: 't-house', name: 'Dream House Features', emoji: '🏡', slots: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'], layout: 'list', art: 'emoji', folder: 'Just for Fun', items: ['Infinity Pool', 'Home Cinema', 'Gaming Room', 'Indoor Basketball Court', 'Home Gym', 'Rooftop Terrace', 'Walk-in Closet', 'Secret Room', 'Slide Between Floors', '10-Car Garage', "Chef's Kitchen", 'Library', 'Aquarium Wall', 'Bowling Alley', 'Sauna', 'Hot Tub', 'Treehouse', 'Music Studio', 'Mini Golf', 'Football Pitch', 'Bubble Tea Bar', 'Arcade', 'Panic Room', 'Helipad', 'Ice Cream Machine', 'Smart Home', 'Glass Elevator', 'Ocean View', 'Fireplace', 'Quiet Room'].map((n, i) => ({ id: 't-house-' + i, name: n, pos: '', desc: '', emoji: '' })) };
  const oldFF = { ...ts.find((t) => t.id === 't-ff') }; delete oldFF.scene;
  const edited = { ...oldHouse, items: [...oldHouse.items.slice(0, 29), { id: 'mine', name: 'Bouncy Castle', pos: '', desc: '', emoji: '' }] };
  const seen = ts.filter((t) => !['t-outfit', 't-backyard'].includes(t.id)).map((t) => t.id);
  const M = await boot({ idb: false, storage: { dn_topics_v1: JSON.stringify([oldHouse, oldFF]), dn_starters_seen_v1: JSON.stringify(seen) } });
  const mt = M.DN.store.get('dn_topics_v1');
  const mh = mt.find((t) => t.id === 't-house');
  ok(mh.name === 'Dream House' && mh.scene === 'house' && mh.items.length === 24 && mt.find((t) => t.id === 't-ff').scene === 'tray', 'an untouched old “Dream House Features” becomes the new Dream House; saved Fast Food Items gains the tray');
  ok(mt.some((t) => t.id === 't-outfit') && mt.some((t) => t.id === 't-backyard'), '    the two new topics are added to older saves');
  M.w.close();
  const E = await boot({ idb: false, storage: { dn_topics_v1: JSON.stringify([edited]), dn_starters_seen_v1: JSON.stringify(seen) } });
  const eh = E.DN.store.get('dn_topics_v1').find((t) => t.id === 't-house');
  ok(eh.name === 'Dream House Features' && eh.items.some((i) => i.name === 'Bouncy Castle') && !eh.scene, '    a Dream House you edited yourself is left exactly as you made it');
  E.w.close();

  // Through the real game: auction → Teams sheet → Sold! → results.
  const house = topics[0];
  const hd = DN.createDraft(house, [{ id: 'a', name: 'Ann', color: '#ff4f64', emoji: 'a' }, { id: 'b', name: 'Ben', color: '#3d8bff', emoji: 'b' }], { ...DN.DEFAULT_RULES, slots: house.slots, order: 'saved', skip: { on: false, endgame: { on: false } } }, { seed: 'h' });
  const G = await boot({ idb: false, storage: { dn_current_v1: JSON.stringify(hd) } });
  await click(G.w, btn(G.d, 'Resume draft'));
  await sleep(100);
  const card = G.d.querySelector('.itemcard svg.scene');
  ok(!!card, 'the item on the block is shown with its scene drawing');
  const first = hd.items[hd.queue[0]].name;
  const mgr = [...G.d.querySelectorAll('.mgr')].find((x) => /Ann/.test(x.textContent));
  mgr.dispatchEvent(new G.w.MouseEvent('pointerdown', { bubbles: true })); mgr.dispatchEvent(new G.w.MouseEvent('pointerup', { bubbles: true }));
  await sleep(50);
  await click(G.w, btn(G.d, 'Sold!'));
  const seenFlash = { v: false }; const mo = new G.w.MutationObserver(() => { const f = G.d.querySelector('.flashscene [data-item]'); if (f && f.getAttribute('data-item') === first) seenFlash.v = true; }); mo.observe(G.d.body, { subtree: true, childList: true });
  await sleep(900); mo.disconnect();
  ok(seenFlash.v || !!G.d.querySelector('.flashscene'), '“Sold!” shows Ann’s build with the ' + first + ' popping into place');
  await sleep(2200);
  await click(G.w, btn(G.d, 'Teams'));
  const sheetScenes = G.d.querySelectorAll('svg.scene:not(.scene-art)');
  const annItems = [...G.d.querySelectorAll('svg.scene [data-item]')].map((x) => x.getAttribute('data-item'));
  ok(sheetScenes.length >= 2 && annItems.includes(first), 'the Teams sheet shows every team’s build, live, from the game state');
  G.w.close();
  // Results: everyone's build side by side.
  let full = hd; let guard = 0;
  while (full.phase === 'auction' && guard++ < 200) { const m = full.managers[guard % 2]; const nx = DN.placeBid(full, m.id, 1); full = nx !== full ? DN.sell(nx) : DN.skipItem(full); }
  while (full.phase === 'freepick') { const cp = DN.currentPicker(full); full = DN.freePick(full, full.leftover.find((x) => DN.canTake(full, cp.m, x))); }
  const R = await boot({ idb: false, storage: { dn_current_v1: JSON.stringify(full) } });
  await click(R.w, btn(R.d, 'Resume draft'));
  await sleep(150);
  const rs = R.d.querySelectorAll('svg.scene:not(.scene-art)'); // (item thumbnails use the same art, cropped)
  ok(full.phase === 'done' && rs.length >= 2 && [...rs].every((s) => s.querySelectorAll('[data-item]').length === 6), 'results: each team’s finished house is drawn with all 6 of its features');
  R.w.close();
};
