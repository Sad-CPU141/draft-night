// Step 15: skip limits, forced picks and anti-dodging (engine + screens).
module.exports = async function skipTests({ ok, boot, btn, click, sleep }) {
  console.log('Skip rules (engine)');
  const P = await boot({ idb: false });
  const DN = P.DN; const S = DN.skips; const A = DN.auction;
  const mkTopic = (n, slots, pos) => ({ id: 'tt', name: 'T', emoji: 'x', layout: 'list', art: 'emoji', slots: slots || ['A', 'B', 'C'], items: Array.from({ length: n }, (_, i) => ({ id: 'i' + i, name: 'Item ' + i, pos: pos ? pos(i) : '', desc: '' })) });
  const two = [{ id: 'a', name: 'Ann', color: '#f00', emoji: 'a' }, { id: 'b', name: 'Ben', color: '#0f0', emoji: 'b' }];
  const rules = (skip, extra) => ({ ...DN.DEFAULT_RULES, slots: ['A', 'B', 'C'], order: 'saved', ...(extra || {}), skip: { ...JSON.parse(JSON.stringify(S.SKIP_DEFAULTS)), ...(skip || {}) } });
  const draft = (skip, extra, topic, ms) => { const t = topic || mkTopic(12); return DN.createDraft(t, ms || two, { ...rules(skip, extra), slots: t.slots }, { seed: 'sk' }); };
  const pres = (d) => S.presenter(d);

  // Defaults for new drafts.
  const def = S.SKIP_DEFAULTS;
  ok(def.on && def.max === 3 && def.runOut === 'must' && def.endgame.on && def.endgame.at === 3 && def.endgame.allow === 0 && def.style === 'next' && !def.debt.on && DN.DEFAULT_RULES.skip.on, 'defaults: limits ON (3), must take next, endgame ON (last 3, 0 skips), style Next item, Skip Debt OFF');

  // 1–2. Skip up to the limit, then no way round it.
  let d = draft({ endgame: { on: false } });
  const seen = [];
  for (let k = 0; k < 6; k++) { seen.push(pres(d).m.id + (pres(d).forced ? '!' : '')); d = DN.skipItem(d); }
  ok(seen.join(' ') === 'a b a b a b' && d.sk.used.a === 3 && d.sk.used.b === 3, '1. each item is handed out in turn; each unbid item uses that manager’s skip, up to 3 each (' + seen.join(' ') + ')');
  ok(pres(d).forced && pres(d).m.id === 'a', '2. with no skips left, the next item handed to Ann is a forced pick');
  ok(!!A.withdrawProblem(d, 'a') && /out of skips/.test(A.withdrawProblem(d, 'a')) && DN.auction.withdraw(d, 'a') === d, '    Ann can’t dodge it with “I’m out” (the state doesn’t change, and she’s told why)');
  ok(!A.withdrawProblem(d, 'b'), '    Ben (not on the clock) can still drop out');
  const before = JSON.stringify(d.sk.used);
  const itemId = d.queue[0];
  let d2 = DN.skipItem(d);
  const got = d2.managers.find((m) => m.id === 'a').team.find((t) => t && t.itemId === itemId);
  ok(got && got.forced && got.price === d.rules.minBid && d2.managers[0].budget === d.managers[0].budget - d.rules.minBid && JSON.stringify(d2.sk.used) === before, '    if nobody bids, Ann takes it at the minimum bid ($' + d.rules.minBid + '); no extra skip is recorded');
  // 14. Forced picks never bypass the auction.
  let d3 = DN.placeBid(d, 'b', 4); d3 = DN.sell(d3);
  ok(d3.managers.find((m) => m.id === 'b').team.some((t) => t && t.itemId === itemId && t.price === 4 && !t.forced) && d3.managers[0].budget === d.managers[0].budget, '14. someone can still outbid the forced manager: Ben buys it for $4 and Ann pays nothing');
  let d4 = DN.placeBid(d, 'a', 3); d4 = DN.sell(d4);
  ok(d4.managers[0].team.some((t) => t && t.itemId === itemId && t.price === 3), '    the forced manager can bid normally too (pays only what they bid)');
  ok(/Ann is out of skips: if nobody bids, Ann takes it for \$1/.test(S.presenterLine(d).text), '    the forced price is announced on screen before bidding');
  ok(A.auctionEnd(DN.auction.withdraw(d, 'b')) === 'skip', '    if everyone else drops out, the item ends straight away and goes to Ann');
  // Undo brings the skip back (local host undo).
  const u = DN.undo(DN.skipItem(draft({ endgame: { on: false } })));
  ok(!(u.sk.used.a) && pres(u) && pres(u).m.id === 'a', '    undo of a skip gives the skip back and the same manager stays on the clock');

  // 4. State survives a reload / reconnect (it's in the saved game, not on the device).
  const json = JSON.parse(JSON.stringify(d));
  ok(json.sk.used.a === 3 && S.presenter(json).forced, '4. skip counts and the forced pick are part of the saved game state (a reload restores exactly the same)');

  // 6. Endgame activates at the right number of remaining items.
  let e = draft({ on: false, endgame: { on: true, at: 3, allow: 0, style: 'must' } }, null, mkTopic(8));
  const eg = [];
  while (e.phase === 'auction') { eg.push(e.queue.length + (pres(e).forced ? 'F' : '')); e = DN.skipItem(e); }
  ok(eg.slice(0, 5).every((x) => !/F/.test(x)) && eg.filter((x) => /F/.test(x)).map((x) => parseInt(x, 10)).every((n) => n <= 3) && eg.some((x) => x === '3F'), '6. endgame (last 3, 0 skips): picks become forced exactly when 3 items remain (' + eg.join(' ') + ')');
  let e2 = draft({ on: false, endgame: { on: true, at: 3, allow: 1, style: 'pressure' } }, null, mkTopic(8));
  ok(!S.endgameSoon(e2) && (() => { while (e2.queue.length > 6) e2 = DN.skipItem(e2); return S.endgameSoon(e2); })(), '    Progressive Pressure warns before the endgame starts');
  while (e2.queue.length > 3) e2 = DN.skipItem(e2);
  const p1 = pres(e2); e2 = DN.skipItem(e2); const p2 = pres(e2);
  ok(!p1.forced && p2 && (p2.m.id !== p1.m.id ? !p2.forced : p2.forced), '    with 1 endgame skip each, the first endgame skip is allowed');

  // 10. Turning the rules off restores the old behaviour.
  let off = draft({ on: false, endgame: { on: false } });
  for (let k = 0; k < 12 && off.phase === 'auction'; k++) off = DN.skipItem(off);
  ok(!pres(draft({ on: false, endgame: { on: false } })) && off.managers.every((m) => m.team.every((t) => !t || !t.forced)) && off.phase === 'freepick', '10. rules off: nobody is on the clock, nothing is forced, unbid items become free picks as before');
  const old = { ...draft(), sk: undefined, rules: { ...draft().rules } }; delete old.rules.skip;
  ok(!S.skipRulesOn(old) && !A.withdrawProblem({ ...old, sk: null }, 'a'), '    drafts saved before this update (no skip rules) play exactly as before');

  // Run-out options.
  const outRun = (skip) => { let x = draft({ max: 1, endgame: { on: false }, ...skip }, null, mkTopic(14)); const log = []; let guard = 0; while (x.phase === 'auction' && guard++ < 200) { const p = pres(x); log.push(p ? p.m.id + (p.forced ? '!' : '') : '-'); x = DN.skipItem(x); } return { log: log.join(' '), x }; };
  const fin = outRun({ runOut: 'final' });
  ok(fin.log.startsWith('a b a b a!'), 'Final chance: one extra skip after running out, then forced (' + fin.log + ')');
  const esc = outRun({ runOut: 'escalate' });
  ok(esc.log.startsWith('a b a b a! b! a b a! b!'), 'Escalating: extra skip, forced, last extra skip, then forced for good (' + esc.log + ')');
  const none = outRun({ runOut: 'none' });
  ok(!/!/.test(none.log) && none.x.managers.every((m) => m.team.every((t) => !t || !t.forced)), 'No forced picks: nothing is forced (' + none.log + ')');
  ok(none.x.phase !== 'auction', '    …and items still run out (each goes to the back once, then becomes a free pick): no endless loop');
  const nmd = outRun({ nmd: true, runOut: 'none', debt: { on: true, clear: 'each' } });
  ok(nmd.log.startsWith('a b a! b! a! b!'), 'No More Dodging overrides the other settings: out of skips = must take every item (' + nmd.log + ')');
  const debt = outRun({ debt: { on: true, clear: 'each' } });
  ok(debt.log.startsWith('a b a b a! b! a b a! b!'), 'Skip Debt: extra skip = 1 debt, forced pick repays it, then skipping is allowed again (' + debt.log + ')');
  const debtEnd = outRun({ debt: { on: true, clear: 'end' } });
  ok(debtEnd.log.startsWith('a b a b a! b! a! b!'), '    Skip Debt “never repaid”: once in debt, every item is forced (' + debtEnd.log + ')');
  ok(debt.x.managers.every((m) => m.budget >= 0) && JSON.stringify(debt.x.managers.map((m) => m.budget)) === JSON.stringify(debt.x.managers.map((m) => d.rules.budget - m.team.filter(Boolean).reduce((s2, t) => s2 + t.price, 0))), '    debt never changes anyone’s money (budgets = start − what they paid)');

  // 3. Forced picks are always eligible; position-limited teams.
  const posTopic = mkTopic(16, ['GK', 'FWD'], (i) => (i % 4 === 0 ? 'GK' : 'FWD'));
  let pd = draft({ max: 0, endgame: { on: false } }, null, posTopic);
  let illegal = 0;
  while (pd.phase === 'auction') {
    const p = pres(pd); const id = pd.queue[0];
    if (p && p.forced) { const m = p.m; if (!S.eligibleFor(pd, m, id)) illegal++; }
    pd = DN.skipItem(pd);
  }
  ok(illegal === 0 && pd.managers.every((m) => m.team.every((t, k) => !t || !pd.items[t.itemId].pos || pd.items[t.itemId].pos === pd.rules.slots[k])), '3. with 0 skips (every pick forced) and position slots, every forced item fits a free slot of the right position');

  // Forced pick styles.
  const fp = draft({ max: 0, style: 'choose3', endgame: { on: false } }, null, mkTopic(12));
  ok(fp.phase === 'forcepick' && fp.sk.offer.ids.length === 3 && fp.sk.offer.ids.every((id) => S.eligibleFor(fp, fp.managers.find((m) => m.id === fp.sk.offer.mid), id)), 'Choose from 3: the forced manager is offered 3 items they can take');
  const who = (teams) => ({ teams: new Set(teams), parts: new Set() });
  const pickId = fp.sk.offer.ids[1];
  ok(A.runAction(fp, 'forcePick', [pickId], who(['b'])) === fp, '    another player can’t choose for them (online check)');
  const chosen = A.runAction(fp, 'forcePick', [pickId], who([fp.sk.offer.mid]));
  ok(chosen.phase === 'auction' && chosen.queue[0] === pickId && pres(chosen).forced && pres(chosen).m.id === fp.sk.offer.mid, '    their choice goes up for auction, with them on the hook');
  ok(A.runAction(chosen, 'forcePick', [fp.sk.offer.ids[0]], who([fp.sk.offer.mid])) === chosen, '8. a second (late or duplicate) choice is ignored');
  const auto = S.autoChooseForced(fp);
  ok(auto.phase === 'auction' && fp.sk.offer.ids.includes(auto.queue[0]), '    when the clock runs out, one of the 3 shown is picked automatically');
  const few = draft({ max: 0, style: 'choose3', endgame: { on: false } }, null, mkTopic(2));
  ok(few.phase === 'forcepick' && few.sk.offer.ids.length === 2, '    fewer than 3 left: all eligible items are shown');
  const foot = DN.starterTopics().find((t) => t.id === 't-goat');
  const fd = DN.createDraft(foot, two, { ...rules({ max: 0, style: 'auctioneer', pref: 'rating', endgame: { on: false } }), slots: foot.slots, order: 'random' }, { seed: 'au' });
  const best = Math.max(...fd.queue.filter((id) => S.eligibleFor(fd, fd.managers.find((m) => m.id === pres(fd).m.id), id)).map((id) => DN.finale.playerRating(fd.items[id]).ovr));
  ok(DN.finale.playerRating(fd.items[fd.queue[0]]).ovr === best, 'Auctioneer’s choice on a football topic: the highest (estimated) rated item they can take');
  const nf = draft({ max: 0, style: 'random', endgame: { on: false } }, { order: 'random' });
  ok(pres(nf).forced && S.eligibleFor(nf, pres(nf).m, nf.queue[0]), 'Random eligible pick: a random item they can take');

  // Nomination: the nominator is on the clock.
  let nd = draft({ max: 1, endgame: { on: false } }, { order: 'nominate' }, posTopic);
  ok(nd.phase === 'nominate', 'Nomination mode starts with a nomination');
  nd = DN.twists.nominate(nd, nd.queue[2]);
  ok(pres(nd).m.id === 'a' && !pres(nd).forced, '    the nominator is on the clock for what they nominated');
  nd = DN.skipItem(nd); nd = DN.twists.nominate(nd, nd.queue[0]); nd = DN.skipItem(nd);
  ok(nd.sk.used.a === 1 && nd.sk.used.b === 1 && nd.phase === 'nominate', '    an unbid nomination uses the nominator’s skip');
  const fillGK = { ...nd, managers: nd.managers.map((m) => (m.id === 'a' ? { ...m, team: [{ itemId: 'zz', price: 1 }, null] } : m)) };
  const pool = DN.twists.nominationPool(fillGK);
  ok(pool.length && pool.every((id) => fillGK.items[id].pos === 'FWD'), '    out of skips, Ann (GK slot full) is only offered items she can take');
  ok(DN.twists.nominate(fillGK, fillGK.queue.find((id) => fillGK.items[id].pos === 'GK')) === fillGK, '    nominating something she couldn’t take is refused');

  // Teams share one pool.
  const tm = [{ id: 't1', name: 'Reds', color: '#f00', emoji: 'r', members: [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }] }, { id: 't2', name: 'Blues', color: '#00f', emoji: 'b', members: [{ id: 'p3', name: 'P3' }] }];
  let td = draft({ max: 1, endgame: { on: false } }, null, null, tm);
  td = DN.skipItem(DN.skipItem(td));
  ok(td.sk.used.t1 === 1 && td.sk.used.t2 === 1 && pres(td).forced, '7. team games: each team has one shared pool of skips');

  // 5. Bots obey the limits (engine-level, all-bot draft).
  const bots = DN.bots.makeBots(4, 'medium', 'sk', []);
  let bad = 0, forcedBots = 0, finished = 0, saves = 0;
  for (let r = 0; r < 25; r++) {
    const t = DN.starterTopics()[r % 20];
    let bd = DN.createDraft(t, bots, { ...rules({ max: r % 3 }), slots: t.slots, order: 'random' }, { mode: 'solo', seed: 'bots' + r });
    let steps = 0;
    while (bd.phase === 'auction' && steps++ < 4000) {
      const p = pres(bd);
      if (p && p.forced && DN.auction.botPassers(bd).includes(p.m.id)) bad++;
      const plan = DN.bots.nextBotAction(bd) || S.botSkipSave(bd);
      if (plan && !bd.bid && S.botSkipSave(bd) && plan.amount === bd.rules.minBid && plan === S.botSkipSave(bd)) saves++;
      if (plan) { const nx = DN.placeBid(bd, plan.botId, plan.amount); if (nx !== bd) { bd = nx; continue; } }
      if (bd.bid) bd = DN.sell(bd); else bd = DN.skipItem(bd);
      if (bd.phase === 'forcepick') bd = S.chooseForced(bd, S.botForcedChoice(bd));
    }
    while (bd.phase === 'freepick') { const cp = DN.currentPicker(bd); bd = DN.freePick(bd, DN.bots.botFreePickChoice(bd, cp.m)); }
    if (bd.phase === 'done' || bd.phase === 'trade') finished++;
    const max = r % 3;
    if (Object.values(bd.sk.used).some((n) => n > max)) bad++;
    forcedBots += bd.managers.reduce((s2, m) => s2 + m.team.filter((x) => x && x.forced).length, 0);
  }
  ok(bad === 0 && finished === 25, '5. 25 all-bot drafts: bots never use more skips than allowed, never try to drop out of a forced item, and every draft finishes (' + forcedBots + ' forced picks taken by bots)');

  // 9 + 13. Fuzz: random rule combinations never loop, never force an illegal item, never go below $0.
  const R = (arr, k) => arr[k % arr.length];
  let stuck = 0, neg = 0, dupes = 0, wrongPrice = 0, combos = 0;
  for (let r = 0; r < 300; r++) {
    const t = DN.starterTopics()[(r * 7) % 60];
    const ms = Array.from({ length: 2 + (r % 6) }, (_, i) => ({ id: 'm' + i, name: 'M' + i, color: DN.COLORS[i], emoji: 'x' }));
    const sk = { on: r % 5 !== 0, max: R([0, 1, 2, 3, 5, 10, -1], r), runOut: R(['must', 'final', 'escalate', 'none'], r >> 1), nmd: r % 7 === 0, debt: { on: r % 4 === 0, clear: R(['each', 'two', 'end'], r >> 2) }, endgame: { on: r % 3 !== 0, at: R([5, 3, 2], r), allow: R([0, 1, 2], r >> 3), style: R(['must', 'pressure'], r) }, style: R(['next', 'choose3', 'auctioneer', 'random'], r >> 1), pref: R(['rating', 'random'], r) };
    let x = DN.createDraft(t, ms, { ...rules(sk), slots: t.slots, order: R(['random', 'saved', 'nominate'], r), noBids: r % 2 ? 'back' : 'skip', mustFill: r % 3 !== 1 }, { seed: 'fz' + r });
    combos++;
    let steps = 0;
    while (x.phase !== 'done' && x.phase !== 'trade' && steps++ < 5000) {
      if (x.phase === 'nominate') { const pl = DN.twists.nominationPool(x); x = pl.length ? DN.twists.nominate(x, pl[Math.floor(Math.random() * pl.length)]) : DN.skipItem(x); continue; }
      if (x.phase === 'forcepick') { x = Math.random() < 0.5 ? S.autoChooseForced(x) : S.chooseForced(x, x.sk.offer.ids[0]); continue; }
      if (x.phase === 'auction') {
        if (Math.random() < 0.06 && x.history.length) { x = DN.undo(x); continue; }
        const k = Math.random() < 0.55 ? 0 : 1 + Math.floor(Math.random() * 3);
        for (let j = 0; j < k; j++) { const m = x.managers[Math.floor(Math.random() * x.managers.length)]; x = DN.placeBid(x, m.id, DN.nextAmount(x)); }
        x = x.bid ? DN.sell(x) : DN.skipItem(x);
      } else if (x.phase === 'freepick') { const cp = DN.currentPicker(x); x = DN.freePick(x, x.leftover.find((id) => DN.canTake(x, cp.m, id))); }
      if (x.managers.some((m) => m.budget < 0)) neg++;
    }
    if (x.phase !== 'done' && x.phase !== 'trade') stuck++;
    const placed = x.managers.flatMap((m) => m.team.filter(Boolean).map((y) => y.itemId));
    if (new Set(placed).size !== placed.length) dupes++;
    x.managers.forEach((m) => m.team.forEach((y) => { if (y && y.forced && y.price !== x.rules.minBid) wrongPrice++; }));
  }
  ok(stuck === 0, '9 + 13. ' + combos + ' random drafts with random skip-rule combinations (debt, endgame, all styles, nomination, back-of-queue, undo) all finish: no endless loops or softlocks');
  ok(neg === 0 && dupes === 0 && wrongPrice === 0, '    nobody goes below $0, no item is placed twice, every forced pick costs exactly the minimum bid');

  // Online action checks (8: the host's copy validates everything).
  let od = draft({ max: 0, endgame: { on: false } });
  const forcedId = pres(od).m.id;
  ok(A.runAction(od, 'withdraw', [forcedId], who([forcedId])) === od, '8. online: a forced player’s “I’m out” is refused by the host');
  const raced = [A.runAction(od, 'bid', ['b', 1], who(['b']))].map((x) => A.runAction(x, 'bid', ['a', 1], who(['a'])))[0];
  ok(raced.bid.leaderId === 'b' && raced.bid.amount === 1, '    two bids at the same price arrive together: only the first counts (no way round the rule)');
  P.w.close();

  console.log('Skip rules (screens)');
  // 11. Settings before a draft affect the next draft; the Skip rules tab.
  const U = await boot({ idb: false });
  await click(U.w, btn(U.d, 'Local'));
  await click(U.w, btn(U.d, 'Next: pick a topic'));
  await click(U.w, [...U.d.querySelectorAll('.folder')].find((b) => /Food/.test(b.textContent)));
  await click(U.w, [...U.d.querySelectorAll('.tcard')][0]);
  await click(U.w, [...U.d.querySelectorAll('.ttab')].find((b) => /Skip rules/.test(b.textContent)));
  const tabText = U.d.body.textContent;
  ok(/How skips work/.test(tabText) && /Skip limits/.test(tabText) && /Endgame Anti-Dodging/.test(tabText) && /Forced pick style/.test(tabText) && /Skip Debt/.test(tabText) && /No More Dodging/.test(tabText) && /Which rule wins/.test(tabText) && !!btn(U.d, 'Reset Skip Rules to defaults'), 'Rules → Skip rules tab has limits, No More Dodging, run-out options, endgame, style, Skip Debt, precedence and a reset button');
  const seg = (label, txt) => [...U.d.querySelectorAll('.seg[aria-label="' + label + '"] button')].find((b) => b.textContent === txt);
  await click(U.w, seg('Skips per manager', '1'));
  await click(U.w, [...U.d.querySelectorAll('.ttab')].find((b) => /Review/.test(b.textContent)));
  ok(/Skip limit: 1 per manager · then must take the next item/.test(U.d.body.textContent) && /Endgame Anti-Dodging: last 3 items/.test(U.d.body.textContent), 'the Review tab lists the skip rules in play');
  await click(U.w, btn(U.d, 'Start the draft'));
  await sleep(100);
  ok(/Skips 1\/1/.test(U.d.body.textContent) && /if nobody bids, it uses one of their skips/.test(U.d.body.textContent), '11. the setting carries into the new draft: cards show “Skips 1/1” and who is on the clock');
  const nMgr = U.DN.store.get('dn_current_v1').managers.length;
  for (let k = 0; k < nMgr; k++) { await click(U.w, btn(U.d, 'No bids')); await sleep(1900); }
  const flashSeen = { v: /NO MORE DODGING!/.test(U.d.body.textContent) }; const mo = new U.w.MutationObserver(() => { if (/NO MORE DODGING!/.test(U.d.body.textContent)) flashSeen.v = true; }); mo.observe(U.d.body, { subtree: true, childList: true, characterData: true });
  await sleep(50);
  ok(/NO SKIPS LEFT|FORCED PICK/.test(U.d.body.textContent) || flashSeen.v, 'after each of the ' + nMgr + ' managers lets one item go, they’re all out (FORCED PICK on their cards)');
  await sleep(2400); mo.disconnect();
  ok(flashSeen.v, 'a “NO MORE DODGING!” announcement appears when the forced pick starts');
  ok(/is out of skips: if nobody bids/.test(U.d.body.textContent) && !!btn(U.d, 'No bids →'), 'the forced pick is shown on screen and the auctioneer’s button says who gets it');
  ok(U.d.querySelectorAll('.outbtn').length === nMgr - 1, 'the manager on the hook has no ✋ (I’m out) button; the others still do');
  const cur = U.DN.store.get('dn_current_v1');
  const hooked = U.DN.skips.presenter(cur).m;
  await click(U.w, btn(U.d, 'No bids →'));
  await sleep(300);
  ok(/YOU HAVE TO PICK!/.test(U.d.body.textContent) || U.DN.store.get('dn_current_v1').managers.find((m) => m.id === hooked.id).team.some((t) => t && t.forced), 'tapping it gives the item to that manager for $1 with a “YOU HAVE TO PICK!” announcement');
  await sleep(2000);
  // 4. Reload: the counts come back from the saved game.
  const saved = JSON.stringify(U.DN.store.get('dn_current_v1'));
  U.w.close();
  const R2 = await boot({ idb: false, storage: { dn_current_v1: saved } });
  await click(R2.w, btn(R2.d, 'Resume draft'));
  await sleep(200);
  ok(JSON.stringify(R2.DN.store.get('dn_current_v1').sk.used) === JSON.stringify(JSON.parse(saved).sk.used) && /FORCED PICK|NO SKIPS LEFT/.test(R2.d.body.textContent), '4. after a refresh the skip counts and forced status are exactly the same');
  R2.w.close();

  // Choose From 3 screen.
  const c3 = DN.createDraft(mkTopic(12), two, { ...rules({ max: 0, style: 'choose3', pickSecs: 15, endgame: { on: false } }), slots: ['A', 'B', 'C'] }, { seed: 'c3' });
  const C = await boot({ idb: false, storage: { dn_current_v1: JSON.stringify(c3) } });
  await click(C.w, btn(C.d, 'Resume draft'));
  await sleep(100);
  const opts = C.d.querySelectorAll('.pickgrid .pickbtn');
  ok(/No more dodging/.test(C.d.body.textContent) && opts.length === 3, 'Choose from 3 screen shows the forced manager and 3 items');
  await click(C.w, opts[2]);
  await sleep(100);
  ok(C.DN.store.get('dn_current_v1').phase === 'auction' && C.DN.store.get('dn_current_v1').queue[0] === c3.sk.offer.ids[2] && /is out of skips/.test(C.d.body.textContent), 'choosing one sends it to auction with them on the hook');
  C.w.close();
};
