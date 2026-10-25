// Sports simulations beyond the three pitch topics.
module.exports = async function sportsTests({ ok, boot, btn, click, sleep }) {
  console.log('Sports simulations');
  const P = await boot({ idb: false });
  const { DN } = P; const F = DN.finale;
  const ts = DN.starterTopics(); const T = (id) => ts.find((t) => t.id === id);
  const team = (t, id, off) => ({ id, name: id, team: t.slots.map((_, k) => ({ itemId: t.items[off + k].id, price: 2 })) });
  const dOf = (t) => ({ seed: 's', topic: t, items: Object.fromEntries(t.items.map((i) => [i.id, i])), rules: { slots: t.slots } });
  // Football topics with Pick slots play the real match, with positions.
  for (const id of ['t-ucl', 't-wonder', 't-wfoot']) {
    const t = T(id); const d = dOf(t);
    const sq = F.squad(d, team(t, 'A', 0));
    const roles = new Set(t.items.map((i) => DN.sports.roleOf(i, 'Pick 1')));
    const m = F.simulateMatch(d, team(t, 'A', 0), team(t, 'B', 7), 'k', true);
    ok(F.isFootball(t) && roles.has('FWD') && roles.has('MID') && roles.has('DEF') && sq.length === t.slots.length && m.v === 2 && m.winner !== null, t.name + ': plays the football match with real positions (' + m.score.join('–') + ')');
  }
  ok(F.eraWord(T('t-wonder')) === 'Now' && F.eraWord(T('t-ucl')) === 'Prime', 'Wonderkids show Now numbers; Champions League Legends show Prime');
  ok(!/himself|herself/.test(JSON.stringify(F.simulateMatch(dOf(T('t-wfoot')), team(T('t-wfoot'), 'A', 0), team(T('t-wfoot'), 'B', 5), 'w', true).events)), 'match commentary has no he/she wording (works for the women’s topic)');
  // Basketball.
  {
    const S = DN.sports; const t = T('t-nba'); const d = dOf(t);
    const pickT = (id, names) => ({ id, name: id, team: names.map((n) => ({ itemId: t.items.find((i) => i.name === n).id, price: 4 })) });
    const stars = pickT('A', ['Stephen Curry', 'Shai Gilgeous-Alexander', 'LeBron James', 'Giannis Antetokounmpo', 'Nikola Jokić']);
    const mid = pickT('B', ['Coby White', 'Immanuel Quickley', 'Franz Wagner', 'Lauri Markkanen', 'Domantas Sabonis']);
    const g = S.simulateBasketball(d, stars, mid, 'g1');
    ok(g.v === 'hoops' && JSON.stringify(g) === JSON.stringify(S.simulateBasketball(d, stars, mid, 'g1')) && g.score[0] !== g.score[1], 'NBA topics play a basketball game that always has a winner and replays exactly (' + g.score.join('–') + ')');
    const boxPts = [0, 1].map((s2) => Object.values(g.box[s2]).reduce((n, b) => n + b.pts, 0));
    ok(boxPts[0] === g.score[0] && boxPts[1] === g.score[1] && g.quarters.reduce((n, q) => n + q[0], 0) === g.score[0], 'the box score and the quarter-by-quarter scores add up to the final score');
    let wins = 0, tot = 0, ot = 0, hl = 0, kinds = new Set();
    for (let k = 0; k < 200; k++) { const m = S.simulateBasketball(d, stars, mid, 'b' + k); if (m.winner === 0) wins++; tot += m.score[0] + m.score[1]; if (m.ot) ot++; hl += m.plays.filter((p) => p.hl).length; m.plays.forEach((p) => kinds.add(p.kind + ':' + (p.type || ''))); }
    ok(tot / 200 > 170 && tot / 200 < 260, 'scores look like basketball (' + Math.round(tot / 400) + ' points a team on average)');
    ok(wins > 150 && wins < 200, 'a stronger line-up usually wins, but not always (' + Math.round(wins / 2) + '%)');
    ok(['make:three', 'make:dunk', 'block:layup', 'steal:', 'ft:layup', 'miss:three'].every((k) => kinds.has(k)) && hl / 200 > 18 && hl / 200 < 45, 'games have threes, dunks, blocks, steals, free throws and misses, with about ' + Math.round(hl / 200) + ' animated highlights each');
    let anyOT = false; for (let k = 0; k < 400 && !anyOT; k++) { const m = S.simulateBasketball(d, stars, pickT('C', ['Luka Dončić', 'Anthony Edwards', 'Kevin Durant', 'Jayson Tatum', 'Victor Wembanyama']), 'o' + k); if (m.ot) anyOT = m.quarters.length >= 5 && m.score[0] !== m.score[1]; }
    ok(anyOT, 'tied games go to overtime and still end with a winner');
    ok(S.hoopsRating(t.items.find((i) => i.name === 'Nikola Jokić')).role === 'C' && F.eraWord(t) === 'Now' && F.eraWord(T('t-nbal')) === 'Prime', 'players get positions from the topic (G/F/C) and Now/Prime numbers');
    // Screen.
    const fill = (topic, n, seed) => { const ms = [...Array(n)].map((_, i) => ({ id: 'm' + i, name: ['Lions', 'Sharks', 'Owls'][i], color: DN.COLORS[i], emoji: 'x', human: true })); let dd = DN.createDraft(topic, ms, { ...DN.DEFAULT_RULES, slots: topic.slots, finale: { mode: 'sim', speed: 'normal' } }, { seed }); let gg = 0, r = 0; while (!DN.isDraftOver(dd) && gg++ < 800) { if (dd.phase === 'auction') { const m = dd.managers.find((x, k) => (k + r++) % 2 === 0 && DN.canBid(dd, x, DN.nextAmount(dd))) || dd.managers.find((x) => DN.canBid(dd, x, DN.nextAmount(dd))); dd = m ? DN.sell(DN.placeBid(dd, m.id, DN.nextAmount(dd))) : DN.skipItem(dd); } else if (dd.phase === 'freepick') { const cp = DN.currentPicker(dd); dd = DN.freePick(dd, dd.leftover.find((x) => DN.canTake(dd, cp.m, x))); } else break; } return dd; };
    const raw = { ...fill(t, 3, 'bbui'), mode: 'local', createdAt: Date.now(), history: [] };
    const X = await boot({ idb: false, speed: 0.05, storage: { dn_current_v1: JSON.stringify(raw) } });
    await click(X.w, btn(X.d, 'Resume draft')); await click(X.w, btn(X.d, 'Start the finale')); await click(X.w, btn(X.d, 'Tip off')); await sleep(300);
    const live = !!X.d.querySelector('.courtsvg') && /Q1|Q2/.test(X.d.querySelector('.sb-clock').textContent);
    await click(X.w, btn(X.d, 'Skip to result')); await sleep(150);
    ok(live && /Box score/.test(X.d.body.textContent) && /MVP/.test(X.d.body.textContent) && !!X.d.querySelector('.qtable'), 'the court plays with a game clock and ends with a box score, quarter scores and an MVP');
    X.w.close();
  }
  // Fight night (Boxing & UFC).
  {
    const S = DN.sports; const t = T('t-fight'); const d = dOf(t);
    const pickT = (id, names) => ({ id, name: id, team: names.map((n) => ({ itemId: t.items.find((i) => i.name === n).id, price: 4 })) });
    const stars = pickT('A', ['Muhammad Ali', 'Floyd Mayweather', 'Jon Jones', 'Khabib Nurmagomedov']);
    const mid = pickT('B', ['Amir Khan', 'Prince Naseem Hamed', "Sean O'Malley", 'Ronda Rousey']);
    const g = S.simulateFightCard(d, stars, mid, 'f1');
    ok(F.battleKind(t).name === 'Fight night' && g.v === 'card' && JSON.stringify(g) === JSON.stringify(S.simulateFightCard(d, stars, mid, 'f1')) && g.score[0] !== g.score[1], 'Boxing & UFC plays a fight card that always has a winner and replays exactly (' + g.score.join('–') + ')');
    ok(g.bouts[0].disc === 'box' && g.bouts[0].R === 12 && g.bouts[2].disc === 'mma' && g.bouts[2].R === 3 && g.bouts[3].R === 5 && g.bouts[3].main, 'boxing bouts are 12 rounds, UFC bouts 3 rounds and the main event 5');
    const methods = {}; let finishes = 0, n = 0, favWins = 0, kinds = new Set(), cardWins = 0, supers = 0, hl = 0, judgedOK = true;
    const fav = (a, b) => S.fightRating(t.items.find((i) => i.name === a)).ovr > S.fightRating(t.items.find((i) => i.name === b)).ovr;
    for (let k = 0; k < 150; k++) {
      const m = S.simulateFightCard(d, stars, mid, 'c' + k); if (m.winner === 0) cardWins++; if (m.how === 'super') supers++;
      m.bouts.forEach((b) => {
        n++; methods[b.method] = (methods[b.method] || 0) + 1; if (b.method !== 'DEC' && b.method !== 'DRAW') finishes++;
        if (b.winner != null && fav(b.a.name, b.b.name) === (b.winner === 0)) favWins++;
        b.events.forEach((e) => { kinds.add(e.kind); if (e.hl) hl++; });
        if (b.method === 'DEC' && !b.sudden) { const c = b.cards; const v = c.filter((x) => (x[0] > x[1]) === (b.winner === 0) && x[0] !== x[1]).length; if (v < 2 || c.some((x) => x[0] + x[1] < b.R * 18)) judgedOK = false; }
        if (b.method !== 'DEC' && b.method !== 'DRAW' && b.method !== 'WO' && b.endRound > b.R) judgedOK = false;
      });
    }
    ok(['KO', 'TKO', 'SUB', 'DEC'].every((x) => methods[x]) && finishes / n > 0.25 && finishes / n < 0.75, 'bouts end by KO, TKO, submission or decision (' + Math.round(finishes / n * 100) + '% stoppages)');
    ok(['kd', 'rock', 'td', 'tdstuff', 'gnp', 'subatt', 'bell'].every((x) => kinds.has(x)) && hl / n > 3, 'fights have knockdowns, hurt fighters, takedowns, stuffed shots, ground and pound and submission attempts (' + Math.round(hl / n) + ' big moments a bout)');
    ok(judgedOK, 'decisions come from three judges’ round-by-round 10-point cards and agree with the winner');
    ok(favWins / n > 0.55 && favWins / n < 0.95 && cardWins > 100, 'the better fighter usually wins, but not always (' + Math.round(favWins / n * 100) + '% of bouts)');
    let level = null; for (let k = 0; k < 300 && !level; k++) { const m = S.simulateFightCard(d, stars, pickT('C', ['Sugar Ray Robinson', 'Mike Tyson', 'Georges St-Pierre', 'Islam Makhachev']), 's' + k); if (m.how === 'super') level = m; }
    ok(level && level.bouts.length === 5 && level.bouts[4].superFight && level.bouts[4].winner != null, 'a level card goes to a super fight that always has a winner');
    const r = S.fightRating(t.items.find((i) => i.name === 'Khabib Nurmagomedov')); const r2 = S.fightRating(t.items.find((i) => i.name === 'Floyd Mayweather'));
    ok(r.disc === 'mma' && r.attrs.WRS > r.attrs.TEC && r2.disc === 'box' && r2.attrs.DEF > r2.attrs.POW && F.eraWord(t) === 'Prime', 'fighters get estimated styles: wrestlers wrestle, defensive boxers defend');
    // Screen.
    const fill = (topic, n, seed) => { const ms = [...Array(n)].map((_, i) => ({ id: 'm' + i, name: ['Lions', 'Sharks', 'Owls'][i], color: DN.COLORS[i], emoji: 'x', human: true })); let dd = DN.createDraft(topic, ms, { ...DN.DEFAULT_RULES, slots: topic.slots, finale: { mode: 'sim', speed: 'normal' } }, { seed }); let gg = 0, rr = 0; while (!DN.isDraftOver(dd) && gg++ < 800) { if (dd.phase === 'auction') { const m = dd.managers.find((x, k) => (k + rr++) % 2 === 0 && DN.canBid(dd, x, DN.nextAmount(dd))) || dd.managers.find((x) => DN.canBid(dd, x, DN.nextAmount(dd))); dd = m ? DN.sell(DN.placeBid(dd, m.id, DN.nextAmount(dd))) : DN.skipItem(dd); } else if (dd.phase === 'freepick') { const cp = DN.currentPicker(dd); dd = DN.freePick(dd, dd.leftover.find((x) => DN.canTake(dd, cp.m, x))); } else break; } return dd; };
    const raw = { ...fill(t, 3, 'fnui'), mode: 'local', createdAt: Date.now(), history: [] };
    const X = await boot({ idb: false, speed: 0.05, storage: { dn_current_v1: JSON.stringify(raw) } });
    await click(X.w, btn(X.d, 'Resume draft')); await click(X.w, btn(X.d, 'Start the finale')); await click(X.w, btn(X.d, 'Ring the bell')); await sleep(400);
    const live = !!X.d.querySelector('.ringsvg') && /FIGHT NIGHT|BOUT|R\d/.test(X.d.querySelector('.sb-clock').textContent);
    await click(X.w, btn(X.d, 'Next bout')); await sleep(200);
    const moved = /BOUT 2|R\d|MAIN/.test(X.d.querySelector('.sb-clock').textContent) || /Bout|B1|B2/.test(X.d.querySelector('.mfeed').textContent);
    await click(X.w, btn(X.d, 'Skip to result')); await sleep(150);
    ok(live && moved && /Fight card/.test(X.d.body.textContent) && /Fight report/.test(X.d.body.textContent) && X.d.querySelectorAll('.fc-row').length >= 4, 'the ring plays bout by bout and ends with the fight card results and a fight report');
    // Draw every kind of moment once, so no frame crashes.
    const all = []; for (let k = 0; k < 40; k++) S.simulateFightCard(d, stars, mid, 'v' + k).bouts.forEach((b) => b.events.forEach((e) => { if (!all.some((x) => x.kind === e.kind && x.type === e.type)) all.push(e); }));
    let framesOK = true; all.forEach((e) => { for (let u2 = 0; u2 < 5; u2 += 0.25) { const f = S.fightFrame({ type: 'ex', e, dur: 5, r: 1, bi: 0 }, u2); if (!f || !isFinite(f.x[0]) || !isFinite(f.x[1])) framesOK = false; } });
    ok(framesOK && all.length > 15, 'every kind of fight moment (' + all.length + ') animates without errors');
    X.w.close();
  }
  P.w.close();
};
