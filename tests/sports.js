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
  P.w.close();
};
