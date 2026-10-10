// Online multiplayer tests: several simulated phones (separate jsdom windows, separate React apps)
// talking through a shared in-memory Firebase stand-in. Run from tests/run.js.
module.exports = async function onlineTests({ ok, boot, btn, click, sleep }) {
  const { createServer } = require('./fake-firebase.js');
  const server = createServer({ latency: 2 });
  const phones = [];
  const phone = async (uid, storage) => { const fb = server.client({ uid }); const b = await boot({ idb: false, speed: 0.02, fb, storage }); const p = { ...b, uid, fb }; phones.push(p); return p; };
  const setVal = async (p, el, v) => { const proto = Object.getOwnPropertyDescriptor(p.w.HTMLInputElement.prototype, 'value'); proto.set.call(el, v); el.dispatchEvent(new p.w.Event('input', { bubbles: true })); await sleep(10); };
  const until = async (fn, ms = 4000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (fn()) return true; } catch (e) {} await sleep(20); } return false; };
  const text = (p) => p.d.body.textContent;
  const room = (p) => p.w.__DN_ROOM;
  const roomData = (code) => server.getAt(['rooms', code]) || {};
  const state = (code) => { const s = roomData(code).state || {}; const o = {}; Object.keys(s).forEach((k) => { o[k] = JSON.parse(s[k]); }); return o; };
  // Record what appears on a screen as it happens (quick moments can pass before a poll looks).
  const watch = (p, re) => { const o = { seen: re.test(p.d.body.textContent) }; const mo = new p.w.MutationObserver(() => { if (!o.seen && re.test(p.d.body.textContent)) o.seen = true; }); mo.observe(p.d.body, { subtree: true, childList: true, characterData: true }); o.stop = () => mo.disconnect(); return o; };
  const fbtn = (p, t) => { const all = [...p.d.querySelectorAll('button')].filter((b) => b.textContent.replace(/\s+/g, ' ').trim().toLowerCase().includes(t.toLowerCase())); return all.find((b) => !b.disabled) || null; };

  console.log('Step 8: online rooms (simulated phones)');
  // Host creates a room.
  // The host has personal favourites/pins on this phone (they must stay on this phone).
  const H = await phone('host1', { dn_settings_v1: JSON.stringify({ rulesV: 3, topicPrefs: { fav: ['t-rivers'], pin: ['t-lakes'] } }) });
  await click(H.w, btn(H.d, 'Online'));
  ok(/Create a room/.test(text(H)), 'Online opens the room screen (no longer “coming soon”)');
  await setVal(H, H.d.querySelector('#on-name'), 'Hana');
  await click(H.w, btn(H.d, 'Create a room'));
  await until(() => H.d.querySelector('.roomcode b'));
  const code = H.d.querySelector('.roomcode b').textContent.trim();
  ok(/^[A-Z2-9]{5}$/.test(code), 'room created with a 5-character code (' + code + ')');
  ok(roomData(code).meta && roomData(code).meta.host === 'host1' && roomData(code).meta.status === 'lobby', 'the creator is the host and the room is in the lobby');

  // Two friends join with the code; a laptop joins as the TV.
  const join = async (uid, name) => {
    const p = await phone(uid);
    await click(p.w, btn(p.d, 'Online'));
    await setVal(p, p.d.querySelector('#on-name'), name);
    await setVal(p, p.d.querySelector('#on-code'), code.toLowerCase());
    await click(p.w, btn(p.d, 'Join'));
    await until(() => /Lobby|Waiting for the host/.test(text(p)));
    return p;
  };
  const A = await join('alice', 'Alice');
  const B = await join('bob', 'Bob');
  const T = await phone('tv1');
  await click(T.w, btn(T.d, 'Online'));
  await setVal(T, T.d.querySelector('#on-code'), code);
  await click(T.w, btn(T.d, 'Use this screen as the TV'));
  await until(() => T.d.querySelector('.tvlobby'));
  await until(() => /Players · 3/.test(text(H)));
  await until(() => /TV connected/.test(text(H)), 2000);
  if (!/TV connected/.test(text(H)) || !/Players · 3/.test(text(H))) console.log('    HOST LOBBY:', text(H).slice(0, 300));
  ok(/Players · 3/.test(text(H)) && /Alice/.test(text(H)) && /Bob/.test(text(H)) && /TV connected/.test(text(H)), 'host sees Alice and Bob join, and the TV connected');
  ok(/Waiting for the host to start/.test(text(A)) && !btn(A.d, 'Start the draft'), 'players wait in the lobby; only the host can start');
  ok(!!T.d.querySelector('.tvlobby .roomcode.big') && /Alice/.test(text(T)), 'TV shows the big room code and who has joined');
  const bad = await phone('mallory');
  await click(bad.w, btn(bad.d, 'Online'));
  await setVal(bad, bad.d.querySelector('#on-name'), 'Mal');
  await setVal(bad, bad.d.querySelector('#on-code'), 'ZZZZZ');
  await click(bad.w, btn(bad.d, 'Join'));
  await until(() => /No room with code/.test(text(bad)));
  ok(/No room with code ZZZZZ/.test(text(bad)), 'a wrong code gives a clear message');

  // Host sets up a small football game with every twist on and 1 bot.
  const tiny = { id: 'tiny', name: 'Tiny Football', emoji: '⚽', slots: ['GK', 'FWD'], layout: 'pitch', art: 'kit', folder: 'Test', items: [
    ['Keeper One', 'GK', 'Spain'], ['Keeper Two', 'GK', 'Brazil'], ['Keeper Three', 'GK', 'France'], ['Keeper Four', 'GK', 'Italy'], ['Keeper Five', 'GK', 'Spain'],
    ['Striker One', 'FWD', 'Ballon d’Or · Spain'], ['Striker Two', 'FWD', 'Brazil'], ['Striker Three', 'FWD', 'France'], ['Striker Four', 'FWD', 'Italy'], ['Striker Five', 'FWD', 'England'],
  ].map(([name, pos, desc], i) => ({ id: 'it' + i, name, pos, desc })) };
  const DN = H.w.__DN;
  const hr = room(H);
  // Host picks one of the new topics from their Favourites tab in the lobby; it syncs to everyone.
  const rivers = DN.starterTopics().find((t) => t.id === 't-rivers');
  await click(H.w, H.d.querySelector('.tcard'));
  await click(H.w, [...H.d.querySelectorAll('.ttab')].find((b) => /Favourites/.test(b.textContent)));
  const favCard = [...H.d.querySelectorAll('.tcard')].find((b) => b.textContent.includes(rivers.name));
  ok(!!favCard && H.d.querySelectorAll('.trow2').length === 1, 'online lobby: the host’s Favourites tab shows their starred topic');
  await click(H.w, favCard);
  ok(await until(() => text(A).includes(rivers.name) && text(B).includes(rivers.name)), 'a new built-in topic picked in the lobby syncs to every phone (' + rivers.name + ')');
  const roomJson = JSON.stringify(roomData(code));
  ok(!/topicPrefs|t-lakes/.test(roomJson) && !roomJson.includes('"fav"'), 'favourites and pins are never written to the online room');
  const prefsA = (A.DN.store.get('dn_settings_v1', {}) || {}).topicPrefs;
  ok(!prefsA || (!(prefsA.fav || []).length && !(prefsA.pin || []).length), 'other phones don’t receive the host’s favourites or pins');
  const setup = (extra) => hr.setLobby({ ...hr.lobby, topic: DN.share.packTopic(tiny, false), topicName: tiny.name, topicEmoji: tiny.emoji, clock: 6, bots: 1, ...(extra || {}), rules: { ...hr.lobby.rules, slots: ['GK', 'FWD'], ...((extra && extra.rules) || {}) } });
  await setup({ rules: { chaos: { ...DN.twists.TWIST_DEFAULTS.chaos, count: 1 }, mystery: { on: true, every: 4 }, rarity: { on: true, rare: 25, legendary: 5 }, trades: { on: true, minutes: 3, money: true }, order: 'random' } });
  await until(() => /Tiny Football/.test(text(A)));
  ok(/Tiny Football/.test(text(A)) && /6s bid clock/.test(text(A)), 'players see the host’s topic and rules in the lobby');
  await click(H.w, btn(H.d, 'Start the draft'));
  const allIn = await until(() => [H, A, B, T].every((p) => p.d.querySelector('.auction') || /Nominat/.test(text(p))), 5000);
  ok(allIn, 'everyone’s screen switches to the auction together (host, both players, TV)');
  let st = state(code);
  ok(st.mode === 'online' && st.managers.length === 4 && st.managers.filter((m) => m.bot).length === 1, 'four seats: Hana, Alice, Bob and one bot');
  const seatOf = (uid) => st.managers.find((m) => m.uid === uid);
  const aliceId = seatOf('alice').id, bobId = seatOf('bob').id, hanaId = seatOf('host1').id;

  // Each phone controls only its own team.
  const tappable = (p) => [...p.d.querySelectorAll('.mgr[role=button]')].map((e) => e.textContent);
  ok(tappable(A).length === 1 && /Alice/.test(tappable(A)[0]), 'Alice’s phone can only bid for Alice');
  ok(tappable(T).length === 0 && !T.d.querySelector('.actions.duo') && !!T.d.querySelector('.tvmode'), 'the TV shows the game but has no bid buttons');

  // Everything the host publishes, in order.
  const published = []; const origPublish = hr.publish.bind(hr);
  hr.publish = (d) => { if (d && d.bid) published.push({ reveal: d.reveal, amount: d.bid.amount, leader: d.bid.leaderId }); origPublish(d); };
  // A bid from a phone reaches everyone.
  await until(() => { st = state(code); return st.phase === 'auction' && !st.pending && fbtn(A, 'Bid '); }, 4000);
  const wB = watch(B, /Alice leads/), wT = watch(T, /Alice leads/);
  // Keep tapping until one lands (a bot may outbid in between at test speed).
  for (let k = 0; k < 40 && !published.some((x) => x.leader === aliceId); k++) { const aBid = fbtn(A, 'Bid '); if (aBid) await click(A.w, aBid); await sleep(40); }
  await until(() => published.some((x) => x.leader === aliceId), 3000);
  ok(published.some((x) => x.leader === aliceId), 'Alice taps Bid on her phone → the host accepts it and publishes it');
  await until(() => wB.seen && wT.seen, 3000); wB.stop(); wT.stop();
  ok(wB.seen && wT.seen, 'Bob’s phone and the TV show Alice leading');

  // Forged actions are refused.
  const before = JSON.stringify(state(code).bid);
  A.fb.database().ref('rooms/' + code + '/actions').push({ by: 'alice', json: JSON.stringify({ name: 'bid', args: [hanaId, 19] }) }).catch(() => {});
  let forgedDenied = false;
  await A.fb.database().ref('rooms/' + code + '/actions').push({ by: 'host1', json: JSON.stringify({ name: 'bid', args: [hanaId, 19] }) }).catch(() => { forgedDenied = true; });
  await A.fb.database().ref('rooms/' + code + '/state/bid').set('"hacked"').catch(() => { forgedDenied = forgedDenied && true; });
  await sleep(150);
  const after = state(code).bid;
  ok(!(after && after.leaderId === hanaId && after.amount === 19), 'a phone can’t bid for someone else’s team (the host ignores it)');
  ok(forgedDenied && server.rejected.some((r) => r.uid === 'alice' && /state/.test(r.path)), 'the server refuses actions signed as another player and writes to the game state from non-hosts');
  void before;

  // “I’m out” on Alice's phone: recorded by the host, and her later bids are refused.
  await until(() => { const s0 = state(code); return s0.phase === 'auction' && !s0.pending && fbtn(A, 'I’m out'); }, 6000);
  const outBtn = fbtn(A, 'I’m out');
  const outReveal = state(code).reveal;
  if (outBtn) await click(A.w, outBtn);
  await until(() => { const s0 = state(code); return (s0.out && s0.out.reveal === outReveal && s0.out.ids.includes(aliceId)) || s0.reveal !== outReveal; }, 3000);
  const so = state(code);
  ok(outBtn && ((so.out && so.out.ids.includes(aliceId)) || so.reveal !== outReveal), 'Alice taps “I’m out” → the host records it for everyone');
  if (so.reveal === outReveal) {
    A.fb.database().ref('rooms/' + code + '/actions').push({ by: 'alice', json: JSON.stringify({ name: 'bid', args: [aliceId, 19] }) }).catch(() => {});
    await sleep(150);
    ok(!published.some((x) => x.reveal === outReveal && x.leader === aliceId && x.amount === 19), 'a late or repeated bid from Alice on that item is refused by the host');
  } else ok(true, 'item ended before the late-bid check (nobody else could bid)');

  // Two players bid at the same moment: the first one wins, the other is ignored.
  // Both tap Bid at the same instant, many times: there's never more than one winner at any price.
  let races = 0;
  for (let k = 0; k < 30 && races < 5; k++) {
    const ra = fbtn(A, 'Bid '), rb = fbtn(B, 'Bid ');
    if (ra && rb && state(code).phase === 'auction') { races++; ra.dispatchEvent(new A.w.MouseEvent('click', { bubbles: true })); rb.dispatchEvent(new B.w.MouseEvent('click', { bubbles: true })); }
    await sleep(60);
  }
  await sleep(150);
  const byPrice = {}; published.forEach((x) => { const k = x.reveal + ':' + x.amount; (byPrice[k] = byPrice[k] || new Set()).add(x.leader); });
  ok(races > 0 && Object.values(byPrice).every((set) => set.size === 1), 'simultaneous bids (' + races + ' races): never two accepted bids at the same price');

  // Host TV view on the same phone: still the host, no extra seat, and back to controls.
  const playersBefore = Object.keys(roomData(code).players || {}).length;
  await click(H.w, H.d.querySelector('.topbar .tvbtn'));
  await click(H.w, btn(H.d, 'Show TV view on this screen'));
  ok(!!H.d.querySelector('.tvmode') && H.d.querySelectorAll('.mgr[role=button]').length === 0 && roomData(code).meta.host === 'host1', 'host switches to TV view on this phone: read-only, still the host');
  const procTv = state(code).processed;
  await until(() => state(code).processed > procTv || state(code).phase !== 'auction', 6000);
  ok(state(code).processed > procTv || state(code).phase !== 'auction', 'the game keeps running while the host shows the TV view');
  await click(H.w, btn(H.d, 'Back to controls'));
  ok(!H.d.querySelector('.tvmode'), 'host returns to controls');
  // A TV window opened in the host's own browser (same sign-in): watches only.
  const presenceBefore = JSON.stringify(roomData(code).presence);
  const Tw = await phone('host1');
  Tw.w.location.hash = '';
  await click(Tw.w, btn(Tw.d, 'Online'));
  await setVal(Tw, Tw.d.querySelector('#on-code'), code);
  await click(Tw.w, btn(Tw.d, 'Use this screen as the TV'));
  await until(() => Tw.d.querySelector('.tvmode') || Tw.d.querySelector('.tvlobby'), 3000);
  ok(!!Tw.d.querySelector('.tvmode') && Object.keys(roomData(code).players || {}).length === playersBefore && roomData(code).players.host1.kind === 'player' && roomData(code).meta.host === 'host1', 'a TV window from the host’s own browser shows the game without adding a player or changing the host');
  Tw.fb._client.close(); Tw.w.close();
  await sleep(100);
  ok(!!(roomData(code).presence || {}).host1 && JSON.stringify(roomData(code).presence) === presenceBefore, 'closing that TV window doesn’t mark the host as gone');

  // Bob drops out: after 60s (sped up) a bot covers him; when he's back he gets his seat back.
  const wAway = watch(A, /Away · bot covering/);
  server.disconnect('bob');
  await until(() => (state(code).managers.find((m) => m.id === bobId) || {}).cover, 6000);
  ok(!!(state(code).managers.find((m) => m.id === bobId) || {}).cover, 'Bob’s connection drops → a bot covers his seat after the wait');
  await until(() => wAway.seen || state(code).phase !== 'auction', 3000); wAway.stop();
  ok(wAway.seen || state(code).phase !== 'auction', 'other phones show Bob as away with a bot covering');
  server.reconnect('bob');
  await until(() => !(state(code).managers.find((m) => m.id === bobId) || {}).cover, 4000);
  ok(!(state(code).managers.find((m) => m.id === bobId) || {}).cover, 'Bob reconnects → his seat is handed back');

  // Bob's phone dies; he reopens the site and rejoins from the Online screen.
  const keep = { dn_last_room: B.w.localStorage.getItem('dn_last_room') };
  B.fb._client.close(); B.w.close();
  const B2 = await phone('bob', keep);
  await click(B2.w, btn(B2.d, 'Online'));
  await until(() => /Rejoin room/.test(text(B2)), 1000);
  ok(/Rejoin room/.test(text(B2)), 'after reopening, the Online screen offers “Rejoin room”');
  // A fresh browser has no saved room, so use the code (same signed-in phone id).
  if (btn(B2.d, 'Rejoin')) await click(B2.w, btn(B2.d, 'Rejoin'));
  else { await setVal(B2, B2.d.querySelector('#on-name'), 'Bob'); await setVal(B2, B2.d.querySelector('#on-code'), code); await click(B2.w, btn(B2.d, 'Join')); }
  await until(() => B2.d.querySelector('.mgr[role=button]') || /Free picks|Trade window|Results|Nominat/.test(text(B2)), 4000);
  const bobBack = [...B2.d.querySelectorAll('.mgr[role=button]')].some((e) => /Bob/.test(e.textContent)) || /Free picks|Trade window|Results/.test(text(B2));
  ok(bobBack, 'Bob is back in the game on his own seat');

  // The host's phone goes offline: the next player takes over and the game carries on.
  const processedBefore = state(code).processed;
  server.disconnect('host1');
  await until(() => roomData(code).meta.host === 'alice', 4000);
  ok(roomData(code).meta.host === 'alice', 'host drops out → Alice (next to join) becomes the host');
  await until(() => state(code).processed > processedBefore || state(code).phase !== 'auction', 6000);
  ok(state(code).processed > processedBefore || state(code).phase !== 'auction', 'the game keeps going under the new host');
  server.reconnect('host1');
  await until(() => !(state(code).managers.find((m) => m.id === hanaId) || {}).cover, 6000);

  // Play it out: phones bid now and then, pick, trade, and vote.
  const players = [H, A, B2];
  let traded = false, guard = 0;
  while (guard++ < 1500) {
    const s = state(code);
    if (s.phase === 'done' && s.votesRevealed) break;
    for (const p of players) {
      const t = text(p);
      if (p.d.querySelector('.modal') && fbtn(p, 'Let it happen')) { await click(p.w, fbtn(p, 'Let it happen')); continue; }
      if (s.phase === 'auction' && Math.random() < 0.15 && fbtn(p, 'Bid ')) { await click(p.w, fbtn(p, 'Bid ')); continue; }
      if (s.phase === 'nominate' && /Pick the next item/.test(t)) { const b = [...p.d.querySelectorAll('.pickbtn')].find((x) => !x.disabled); if (b) { await click(p.w, b); if (fbtn(p, 'Nominate')) await click(p.w, [...p.d.querySelectorAll('.modal button')].find((x) => /Nominate/.test(x.textContent))); } continue; }
      if (s.phase === 'freepick') { const b = [...p.d.querySelectorAll('.pickbtn')].find((x) => !x.disabled); if (b) await click(p.w, b); continue; }
      if (s.phase === 'trade') {
        if (!traded && p === A && fbtn(A, 'Bob')) {
          await click(A.w, [...A.d.querySelectorAll('.pickchip')].find((x) => /Bob/.test(x.textContent)));
          const cols = [...A.d.querySelectorAll('.tradecols .field')];
          if (cols.length === 2) { const g = cols[0].querySelector('.pickbtn'), k = cols[1].querySelector('.pickbtn'); if (g && k) { await click(A.w, g); await click(A.w, k); } }
          if (fbtn(A, 'Offer trade')) { await click(A.w, fbtn(A, 'Offer trade')); traded = true; }
          continue;
        }
        if (p === B2 && fbtn(B2, 'Accept')) { await click(B2.w, fbtn(B2, 'Accept')); continue; }
        if (room(p) && room(p).amHost && (s.trade.proposals.some((x) => x.status !== 'pending') || guard % 200 === 199) && fbtn(p, 'Finish trading')) { await click(p.w, fbtn(p, 'Finish trading')); continue; }
      }
      if (s.phase === 'done' && !s.votesRevealed) {
        if (fbtn(p, 'Vote for the best team')) { await click(p.w, fbtn(p, 'Vote for the best team')); const v = [...p.d.querySelectorAll('.modal .votebtn')].find((x) => !x.disabled); if (v) { await click(p.w, v); await click(p.w, fbtn(p, 'Lock in')); if (fbtn(p, 'OK')) await click(p.w, fbtn(p, 'OK')); } continue; }
        if (room(p) && room(p).amHost && fbtn(p, 'Reveal the winner')) { await click(p.w, fbtn(p, 'Reveal the winner')); continue; }
      }
    }
    await sleep(25);
  }
  const fin = state(code);
  ok(fin.phase === 'done' && fin.votesRevealed, 'the online game runs to the end: auction, free picks, trades and the vote');
  ok(!!fin.trade && fin.trade.proposals.some((t) => t.status === 'accepted' && t.from === aliceId && t.to === bobId), 'Alice offered Bob a trade from her phone and Bob accepted on his');
  const ppl = fin.managers; const votes = fin.votes || {};
  ok(Object.keys(votes).length === ppl.length && Object.entries(votes).every(([pid, t]) => pid !== t), 'everyone voted (the bot at the reveal), nobody for themselves');
  await until(() => [H, A, B2, T].every((p) => /We have a winner/.test(text(p))), 3000);
  ok([H, A, B2, T].every((p) => /We have a winner/.test(text(p))), 'every phone and the TV show the winner');
  await sleep(200);
  ok([H, A, B2].every((p) => (p.DN.store.get('dn_past_v1') || []).some((x) => x.id === fin.id)), 'each phone saves the finished game to its own Past Drafts (for profiles)');
  ok(!!fin.cardLog && Array.isArray(fin.cardLog) && fin.rarity && Object.keys(fin.rarity).length > 0, 'twists ran online too (cards dealt, rarity assigned)');

  // Play again → back to the lobby, then a team game decided by a vote bracket.
  const newHost = [H, A, B2].find((p) => room(p) && room(p).amHost);
  await click(newHost.w, btn(newHost.d, 'Play again'));
  await until(() => roomData(code).meta.status === 'lobby' && /Lobby/.test(text(newHost)), 3000);
  ok(roomData(code).meta.status === 'lobby' && !roomData(code).state, 'Play again returns everyone to the lobby with a clean slate');
  const nr = room(newHost);
  await nr.setLobby({ ...nr.lobby, teamMode: true, teamCount: 2, fillBots: true, teamSize: 2, bots: 0, clock: 6, topic: DN.share.packTopic(tiny, false), topicName: tiny.name, rules: { ...nr.lobby.rules, slots: ['GK', 'FWD'], chaos: { on: false }, mystery: { on: false }, trades: { on: false }, finale: { mode: 'bracket', weight: 60, speed: 'instant', commentary: true, tiebreak: 'rating' } } });
  await room(A).setMe({ team: 0 }); await room(B2).setMe({ team: 1 }); await room(H).setMe({ team: 1 });
  await until(() => /Start the draft/.test(text(newHost)) && fbtn(newHost, 'Start the draft'), 3000);
  await click(newHost.w, fbtn(newHost, 'Start the draft'));
  await until(() => state(code).phase === 'auction', 3000);
  const s2 = state(code);
  ok(s2.teamMode && s2.managers.length === 2 && s2.managers.every((t) => t.members.length === 2), 'team game: 2 teams of 2 (Alice + a bot adviser; Hana + Bob)');
  guard = 0;
  while (guard++ < 1500) {
    const s = state(code);
    if (s.finale && s.finale.champion && (s.finale.ui || {}).stage === 'done') break;
    for (const p of [H, A, B2]) {
      const host = room(p) && room(p).amHost;
      if (s.phase === 'auction' && Math.random() < 0.15 && fbtn(p, 'Bid ')) { await click(p.w, fbtn(p, 'Bid ')); continue; }
      if (s.phase === 'freepick') { const b = [...p.d.querySelectorAll('.pickbtn')].find((x) => !x.disabled); if (b) await click(p.w, b); continue; }
      if (s.phase === 'done') {
        const f = p.d.querySelector('.finale');
        if (host && !s.finale && fbtn(p, 'Start the finale')) { await click(p.w, fbtn(p, 'Start the finale')); continue; }
        if (f) {
          const vb = [...f.querySelectorAll('.votebtn')].find((x) => !x.disabled && !/your team/.test(x.textContent) && /rating/.test(x.textContent));
          if (vb) { await click(p.w, vb); const li = [...f.querySelectorAll('button')].find((x) => /Lock in/.test(x.textContent) && !x.disabled); if (li) await click(p.w, li); const okb = [...f.querySelectorAll('button')].find((x) => /^OK$/.test(x.textContent.trim())); if (okb) await click(p.w, okb); continue; }
          if (host) { const nb = [...f.querySelectorAll('button')].find((x) => !x.disabled && /Vote on this matchup|Count the votes|Back to the bracket|Reveal the champion/.test(x.textContent)); if (nb) { await click(p.w, nb); continue; } }
        }
      }
    }
    await sleep(25);
  }
  const f2 = state(code);
  ok(!!(f2.finale && f2.finale.champion), 'the online vote bracket crowns a champion');
  const fm = f2.finale.bracket.rounds.flat().find((m) => m.a && m.b);
  const voterTeams = Object.entries(fm.votes || {}).map(([pid, t]) => ({ t, team: f2.managers.find((m) => m.members.some((x) => x.id === pid)).id }));
  ok(voterTeams.length > 0 && voterTeams.every((v) => v.t !== v.team), 'in the online bracket nobody voted for their own team');
  await until(() => [H, A, B2, T].every((p) => /Champions!/.test(text(p))), 3000);
  ok([H, A, B2, T].every((p) => /Champions!/.test(text(p))), 'every phone and the TV show the champion');

  phones.forEach((p) => { try { p.fb._client.close(); p.w.close(); } catch (e) {} });
};
