// Step 2: hand-made stats for every item in the simulation topics.
module.exports = async function simStatsTests({ ok, boot, btn, click, sleep }) {
  console.log('Simulation stats');
  const P = await boot({ idb: false });
  const { DN } = P; const S = DN.simStats; const F = DN.finale;
  const ts = DN.starterTopics().filter((t) => F.hasBattle(t) && F.battleKind(t).name !== 'Basketball game' && F.battleKind(t).name !== 'Fight night' && F.battleKind(t).name !== 'Grand Prix' && F.battleKind(t).name !== 'Tennis tie' && F.battleKind(t).name !== 'NFL game' && F.battleKind(t).name !== 'Hockey game' && F.battleKind(t).name !== 'T20 match' && F.battleKind(t).name !== 'Baseball game' && F.battleKind(t).name !== 'Golf cup' && F.battleKind(t).name !== 'Rugby match');
  const missing = []; let n = 0;
  ts.forEach((t) => t.items.forEach((i) => { n++; const s = S.itemStats(t, i); if (!s || !s.listed) missing.push(t.id + ': ' + i.name); }));
  ok(!missing.length, 'every item in the ' + ts.length + ' simulation topics has hand-made stats (' + n + ' items)' + (missing.length ? ' — missing: ' + missing.slice(0, 8).join(', ') : ''));
  const T = (id) => ts.find((t) => t.id === id); const it = (id, name) => T(id).items.find((x) => x.name === name);
  const lion = S.itemStats(T('t-ani'), it('t-ani', 'Lion')), mosq = S.itemStats(T('t-ani'), it('t-ani', 'Mosquito'));
  ok(S.statTotal(lion) > S.statTotal(mosq) + 15 && lion.hab === 'L' && S.itemStats(T('t-ani'), it('t-ani', 'Great White Shark')).hab === 'W', 'stats make sense: a lion beats a mosquito on paper; sharks live in water');
  const kit = S.itemStats(T('t-zomb'), it('t-zomb', 'First Aid Kit'));
  ok(kit.kind === 'survival' && kit.tags.includes('M') && kit.vals[0] >= 8, 'survival items have usefulness and what they cover (first aid kit → medical)');
  ok(S.itemStats(T('t-worstpowers'), T('t-worstpowers').items[0]).vals.length === 6 && S.itemStats(T('t-cute'), it('t-cute', 'Red Panda')).keys[0] === 'Fluffy', 'powers have Attack…Brains (+ Chaos for the worst ones); cute topics have Fluffy, Tiny, Funny, Charm');
  const mine = S.itemStats(T('t-ani'), { name: 'My Robot Dog', pos: 'Land' });
  ok(mine && !mine.listed && mine.vals.every((v) => v >= 4 && v <= 7) && mine.hab === 'L', 'an item of your own gets a fair middle estimate, labelled as such');
  ok(!S.itemStats(DN.starterTopics().find((t) => t.id === 't-redflags'), { name: 'x' }), 'topics without a simulation have no stats');
  P.w.close();
};
