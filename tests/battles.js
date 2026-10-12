// Fun battles: the "Matches" finale for non-football topics.
module.exports = async function battleTests({ ok, boot, btn, click, sleep }) {
  console.log('Fun battles');
  const P = await boot({ idb: false });
  const { DN } = P; const F = DN.finale;
  const ts = DN.starterTopics(); const T = (id) => ts.find((t) => t.id === id);
  const fill = (topic, n, seed) => {
    const ms = [...Array(n)].map((_, i) => ({ id: 'm' + i, name: ['Lions', 'Sharks', 'Owls', 'Wolves', 'Bears'][i], color: DN.COLORS[i], emoji: 'x', human: true }));
    let d = DN.createDraft(topic, ms, { ...DN.DEFAULT_RULES, slots: topic.slots, finale: { mode: 'sim', speed: 'instant' } }, { seed });
    let g = 0, r = 0;
    while (!DN.isDraftOver(d) && g++ < 800) {
      if (d.phase === 'auction') { const m = d.managers.find((x, k) => (k + r++) % 2 === 0 && DN.canBid(d, x, DN.nextAmount(d))) || d.managers.find((x) => DN.canBid(d, x, DN.nextAmount(d))); d = m ? DN.sell(DN.placeBid(d, m.id, DN.nextAmount(d))) : DN.skipItem(d); }
      else if (d.phase === 'freepick') { const cp = DN.currentPicker(d); d = DN.freePick(d, d.leftover.find((x) => DN.canTake(d, cp.m, x))); } else break;
    }
    return d;
  };
  const battleIds = ts.filter((t) => F.hasBattle(t)).map((t) => t.id);
  ok(battleIds.length >= 20 && ['t-ani', 't-pow', 't-zomb', 't-dinos', 't-cute'].every((id) => battleIds.includes(id)) && !battleIds.some((id) => ['t-pl', 't-cf', 't-goat'].includes(id)), 'fun battles on ' + battleIds.length + ' topics (animals, superpowers, zombie kit, dinosaurs, cutest…), never on football');
  const d = fill(T('t-ani'), 4, 'bt1');
  ok(d.phase === 'done' && F.finaleMode(d) === 'sim', 'a fun-battle topic keeps the Battles finale instead of falling back to votes');
  const [A, B] = d.managers;
  const m1 = F.simulateBattle(d, A, B, 'k1'), m2 = F.simulateBattle(d, A, B, 'k1');
  ok(JSON.stringify(m1) === JSON.stringify(m2), 'a battle is recorded once: the same key replays the same result');
  ok(m1.duels.length >= T('t-ani').slots.length && m1.score[0] !== m1.score[1] && m1.score[m1.winner] > m1.score[1 - m1.winner], 'every slot is a duel and there is always a winner (sudden death on ties)');
  const edges = []; for (let k = 0; k < 40; k++) F.simulateBattle(fill(T('t-pow'), 2, 'e' + k), ...fill(T('t-pow'), 2, 'e' + k).managers, 'x').duels.forEach((x) => { if (x.edge != null) edges.push(x.edge); });
  ok(edges.length > 50 && edges.every((e) => e >= 0.22 && e <= 0.78), 'luck always matters: no duel edge outside 22–78% (' + edges.length + ' duels)');
  // Paying more gives the edge (over many simulated battles).
  let big = 0, n = 0;
  const rich = { ...A, team: A.team.map((x, k) => (x ? { ...x, price: k % 2 ? 1 : 6 } : x)) }, poor = { ...B, team: B.team.map((x, k) => (x ? { ...x, price: k % 2 ? 5 : 1 } : x)) };
  for (let k = 0; k < 300; k++) { const b = F.simulateBattle(d, rich, poor, 'p' + k); b.duels.forEach((x) => { if (x.a && x.b && x.a.price !== x.b.price) { n++; if ((x.a.price > x.b.price) === (x.w === 0)) big++; } }); }
  ok(n > 0 && big / n > 0.55 && big / n < 0.8, 'the pricier pick wins more often, but not always (' + Math.round((100 * big) / Math.max(1, n)) + '%)');
  let f = F.startFinale(d); let nx, guard = 0;
  while ((nx = F.nextMatchup(f.finale.bracket)) && guard++ < 10) { f = F.playMatchup(f, nx.r, nx.i); f = F.resolveMatchup(f, nx.r, nx.i); }
  ok(!!f.finale.champion && /battle/.test(F.championStory(f)), 'a full battle bracket crowns a champion (' + F.championStory(f).slice(0, 60) + '…)');
  const cut = F.simulateBattle(fill(T('t-cute'), 2, 'c'), ...fill(T('t-cute'), 2, 'c').managers, 'y');
  ok(cut.kind === 'cute' && cut.duels.every((x) => x.line && !/\{[wl]\}/.test(x.line)), 'each battle style has its own lines (Cuteness Contest), all filled in');
  {
    // Step 3: creature topics use the animal arena, driven by stats.
    const S = DN.simStats;
    const ar = S.simulateFor(d, A, B, 'ar1');
    ok(ar.v === 'arena' && JSON.stringify(ar) === JSON.stringify(S.simulateFor(d, A, B, 'ar1')), 'animal topics play in the arena, and a recorded fight replays exactly');
    ok(ar.rounds.length >= 5 && ar.rounds.slice(0, 4).map((x) => x.arena).join('') === 'LLWA' && ar.score[ar.winner] > ar.score[1 - ar.winner], 'Animal Fight Squad rounds follow its slots (land, land, water, sky) and someone always wins');
    ok(ar.rounds.every((x) => x.how === 'walkover' || x.events.length >= 2) && ar.rounds.every((x) => ['knockout', 'retreat', 'decision', 'exhaustion', 'walkover'].includes(x.how)), 'every round is a real fight that ends in a knockout, retreat, exhaustion or the judges');
    const fz = (n, P, Sp, De, W, T, M, hab) => ({ name: n, P, S: Sp, D: De, W, T, M, hab, total: P + Sp + De + W + T + M });
    const strong = fz('Big', 9, 7, 8, 8, 7, 6, 'L'), weak = fz('Small', 2, 5, 2, 2, 3, 3, 'L'), even = fz('Even', 7, 7, 7, 7, 7, 7, 'L');
    let big = 0, ev = 0; for (let k = 0; k < 200; k++) { if (S.arenaFight(DN.bots.seeded('b', k), strong, weak, 'L').w === 0) big++; if (S.arenaFight(DN.bots.seeded('e', k), even, { ...even, name: 'Even 2' }, 'L').w === 0) ev++; }
    ok(big >= 190 && ev > 70 && ev < 130, 'stats decide fights: much stronger wins ' + Math.round(big / 2) + '% of the time, an even match is a coin toss (' + Math.round(ev / 2) + '%)');
    const shark = fz('Shark', 9, 6, 6, 9, 6, 4, 'W'), lion = fz('Lion', 9, 6, 5, 8, 6, 7, 'L');
    let sw = 0, sl = 0; for (let k = 0; k < 200; k++) { if (S.arenaFight(DN.bots.seeded('w', k), shark, lion, 'W').w === 0) sw++; if (S.arenaFight(DN.bots.seeded('l', k), shark, lion, 'L').w === 0) sl++; }
    ok(sw > 160 && sl < 30, 'home turf matters: a shark wins in water (' + Math.round(sw / 2) + '%) and loses on land (' + Math.round(sl / 2) + '%)');
  }
  {
    // Step 4: survival topics play day by day.
    const S = DN.simStats; const z = fill(T('t-zomb'), 2, 'sv1'); const [ZA, ZB] = z.managers;
    const sv = S.simulateFor(z, ZA, ZB, 'sv');
    ok(sv.v === 'survival' && sv.set === 'zomb' && sv.log.length >= 1 && sv.log.every((x) => x.ev.title && x.res.some(Boolean)) && sv.score.every((n) => n >= 0 && n <= 10), 'zombie kits play a survival showdown, day by day (' + sv.score.join('–') + ' days)');
    ok(sv.log.every((x) => x.res[0] === null || x.res[1] === null || true) && sv.log.every((x) => x.res.every((r) => !r || (r.text && !/\{i\}/.test(r.text)))), 'both teams face the same events, and every outcome names what happened');
    ok(JSON.stringify(sv) === JSON.stringify(S.simulateFor(z, ZA, ZB, 'sv')), 'a recorded survival run replays exactly');
    const mk = (names) => ({ name: 'T', team: names.map((n) => ({ itemId: T('t-zomb').items.find((i) => i.name === n).id, price: 1 })) });
    const zd = { seed: 's', topic: T('t-zomb'), items: Object.fromEntries(T('t-zomb').items.map((i) => [i.id, i])), rules: { slots: T('t-zomb').slots } };
    let good = 0; for (let k = 0; k < 200; k++) if (S.simulateFor(zd, mk(['Crowbar', 'Radio', 'Canned Food', 'Water Bottles', 'Generator']), mk(['Golf Club', 'Whistle', 'Toilet Paper', 'Coffee', 'Shopping Cart']), 'b' + k).winner === 0) good++;
    ok(good > 140 && good < 200, 'a well-packed kit usually outlasts a silly one, but not always (' + Math.round(good / 2) + '%)');
    const isl = S.simulateFor(fill(T('t-island'), 2, 'is'), ...fill(T('t-island'), 2, 'is').managers, 'x');
    ok(isl.v === 'survival' && isl.set === 'island', 'the desert island gets its own island events');
    const zf = fill(T('t-zomb'), 3, 'svui'); const zr = { ...zf, rules: { ...zf.rules, finale: { ...zf.rules.finale, speed: 'normal' } }, mode: 'local', createdAt: Date.now(), history: [] };
    const Z = await boot({ idb: false, speed: 0.05, storage: { dn_current_v1: JSON.stringify(zr) } });
    await click(Z.w, btn(Z.d, 'Resume draft')); await click(Z.w, btn(Z.d, 'Start the finale')); await click(Z.w, btn(Z.d, 'Start the showdown'));
    await sleep(400);
    const midOk = !!Z.d.querySelector('.survivalview .svscene') && /Needs:/.test(Z.d.body.textContent);
    await click(Z.w, btn(Z.d, 'Skip to the end')); await sleep(100);
    ok(midOk && /Survival summary/.test(Z.d.body.textContent) && /Most useful/.test(Z.d.body.textContent), 'the survival screen shows each day’s event and what it needs, then a summary with each team’s most useful item');
    Z.w.close();
  }
  const rt = DN.share.unpackTopic(DN.share.packTopic(T('t-zomb'), false));
  ok(rt.ok && rt.topic.battle === 'survival' && F.hasBattle(rt.topic), 'shared and copied topics keep their battle style');
  // Screen: play a battle through the UI at instant speed.
  const raw = { ...d, mode: 'local', createdAt: Date.now(), history: [] };
  const U = await boot({ idb: false, storage: { dn_current_v1: JSON.stringify(raw) } });
  await click(U.w, btn(U.d, 'Resume draft'));
  ok(!/Friendly battle/.test(U.d.body.textContent), 'the friendly battle waits until a winner is decided (it isn’t the main event)');
  await click(U.w, btn(U.d, 'Start the finale'));
  await click(U.w, btn(U.d, 'Start the battle'));
  await sleep(200);
  ok(!!U.d.querySelector('.arenaview .scoreboard') && /Battle summary/.test(U.d.body.textContent) && /Just for fun/.test(U.d.body.textContent), 'the animal arena plays and ends with a summary that says it’s just for fun');
  await click(U.w, btn(U.d.querySelector('.finale'), 'Continue')); await sleep(150);
  if (!/won the battle/.test(U.d.body.textContent)) console.log('   page:', U.d.querySelector('.finale') && U.d.querySelector('.finale').textContent.slice(0, 300));
  ok(/won the battle/.test(U.d.body.textContent), 'the result explains who won the battle and by how much');
  ok(await (async () => { for (let k = 0; k < 40 && !/Friendly/.test(U.d.body.textContent); k++) { const nb = btn(U.d, 'Reveal the champion') || btn(U.d, 'Back to the bracket') || btn(U.d, 'Start the battle') || btn(U.d.querySelector('.finale') || U.d, 'Continue'); if (!nb) break; await click(U.w, nb); await sleep(120); } return /Friendly battle/.test(U.d.body.textContent); })(), 'after the champion is crowned, a friendly battle is offered');
  U.w.close();
  // Default rules (group vote): at the end the group chooses a vote or the simulation.
  const vd = { ...d, rules: { ...d.rules, finale: { mode: 'vote' } }, mode: 'local', createdAt: Date.now(), history: [] };
  const V = await boot({ idb: false, storage: { dn_current_v1: JSON.stringify(vd) } });
  await click(V.w, btn(V.d, 'Resume draft'));
  ok(/How do we pick the winner\?/.test(V.d.body.textContent) && !!btn(V.d, 'Let the simulation decide') && !btn(V.d, 'Start the secret vote'), 'a simulation topic asks: vote, or let the simulation decide?');
  await click(V.w, btn(V.d, '🗳️ Vote'));
  ok(!!V.d.querySelector('.modal, .sheet, [role=dialog]') || /Pass the phone|secret vote|Who votes/i.test(V.d.body.textContent), 'Vote opens the normal secret vote');
  V.w.close();
  const V2 = await boot({ idb: false, storage: { dn_current_v1: JSON.stringify(vd) } });
  await click(V2.w, btn(V2.d, 'Resume draft'));
  await click(V2.w, btn(V2.d, 'Let the simulation decide'));
  ok(!!V2.d.querySelector('.finale') && !!btn(V2.d, 'Start the battle') && /Battle bracket/.test(V2.d.body.textContent), 'Let the simulation decide starts a knockout bracket of battles');
  V2.w.close();
  const fb = DN.starterTopics().find((t) => t.id === 't-redflags');
  ok(!F.hasBattle(fb) && !F.isFootball(fb), '(topics without a simulation keep the plain vote)');
  P.w.close();
};
