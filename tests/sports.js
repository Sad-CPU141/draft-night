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
  P.w.close();
};
