// Engine checks for Step 6: brackets (2–16 teams), all winner modes, simulator fairness.
module.exports = function finaleChecks(DN) {
  const F = DN.finale, T = DN.twists;
  const out = {};
  const positions = ['GK', 'DEF', 'DEF', 'MID', 'MID', 'FWD'];
  const makeTopic = (n) => ({ id: 'syn', name: 'Synthetic', emoji: 'x', layout: 'pitch', art: 'kit', slots: ['GK', 'DEF', 'MID', 'FWD', 'FLEX'],
    items: Array.from({ length: n * 6 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, pos: positions[i % 6], desc: i % 7 === 0 ? 'Spain · 3× champion' : i % 5 === 0 ? 'Ballon d\'Or' : 'Club ' + (i % 9) })) });
  const fullDraft = (n, seed, opts) => {
    const topic = makeTopic(n);
    const managers = Array.from({ length: n }, (_, i) => ({ id: 'm' + i, name: 'Team ' + i, color: '#f00', emoji: 'x' }));
    let d = DN.createDraft(topic, managers, { ...DN.DEFAULT_RULES, slots: topic.slots, budget: 30, order: 'saved' }, { seed });
    let k = 0;
    while (d.phase === 'auction' && k < 5000) { const m = d.managers[k++ % n]; const nd = DN.placeBid(d, m.id, 1); d = nd !== d ? DN.sell(nd) : DN.skipItem(d); }
    while (d.phase === 'freepick') { const cp = DN.currentPicker(d); d = DN.freePick(d, d.leftover.find((x) => DN.canTake(d, cp.m, x))); }
    if (opts && opts.emptyTeam) d = { ...d, managers: d.managers.map((m, i) => (i === 0 ? { ...m, team: m.team.map(() => null) } : m)) };
    return d;
  };
  // Brackets for every size: one champion, every real team appears once, byes go to top seeds.
  out.sizes = [2, 3, 4, 5, 8, 16].map((n) => {
    const d = fullDraft(n, 'b' + n);
    let b = F.buildBracket(d);
    const firstTeams = b.rounds[0].flatMap((m) => [m.a, m.b]).filter(Boolean);
    let guard = 0, matches = 0;
    for (const mode of ['bracket']) {
      while (!b.champion && guard++ < 100) {
        const nx = F.nextMatchup(b); if (!nx) break;
        const m = nx.m; const votes = {};
        F.matchVoters(d, m).forEach((p) => { const v = [m.a, m.b].find((id) => F.canVoteFor(p, id) && (p.teamId === m.a ? id === m.b : true)); if (v) votes[p.id] = v; });
        const res = F.decideMatchup(d, { ...m, votes }, mode, {});
        b.rounds[nx.r][nx.i] = { ...m, votes, winner: res.winner, why: res.why }; b = F.advanceBracket(b); matches++;
      }
    }
    return { n, rounds: b.rounds.length, uniqueTeams: new Set(firstTeams).size === n, champion: !!b.champion, matches, byes: b.rounds[0].filter((m) => m.why === 'Bye').length };
  });
  // Sim + combined on 4 and 5 teams, plus a team with no players.
  out.modes = ['sim', 'combined'].map((mode) => [4, 5].map((n) => {
    const d = fullDraft(n, 'mode' + mode + n, { emptyTeam: n === 5 });
    let b = F.buildBracket(d); let guard = 0, bad = 0;
    while (!b.champion && guard++ < 50) {
      const nx = F.nextMatchup(b); if (!nx) break;
      const A = T.teamOf ? null : null; void A;
      const ta = d.managers.find((x) => x.id === nx.m.a), tb = d.managers.find((x) => x.id === nx.m.b);
      const match = F.simulateMatch(d, ta, tb, nx.m.id, true);
      if (match.winner == null) bad++;
      const roster = [ta, tb].map((t) => new Set(t.team.filter(Boolean).map((x) => d.items[x.itemId].name)));
      match.events.filter((e) => e.type === 'goal').forEach((e) => { if (!roster[e.team].has(e.player) || (e.assist && !roster[e.team].has(e.assist))) bad++; });
      const again = F.simulateMatch(d, ta, tb, nx.m.id, true);
      if (JSON.stringify(again) !== JSON.stringify(match)) bad++;
      const res = F.decideMatchup(d, { ...nx.m, match, votes: {} }, mode, { weight: 60 });
      b.rounds[nx.r][nx.i] = { ...nx.m, match, winner: res.winner, why: res.why }; b = F.advanceBracket(b);
    }
    return { mode, n, champion: !!b.champion, bad, emptyTeamSeeded: n === 5 ? !b.rounds[0].some((m) => m.a === 'm0' || m.b === 'm0') : true };
  }));
  // Fairness: a clearly stronger team wins most, but not all, of 400 matches.
  const d = fullDraft(2, 'fair');
  const strong = { ...d.managers[0], team: d.managers[0].team.map((t) => t) };
  const items = { ...d.items };
  strong.team.forEach((t) => { if (t) items[t.itemId] = { ...items[t.itemId], rating: 92 }; });
  d.managers[1].team.forEach((t) => { if (t) items[t.itemId] = { ...items[t.itemId], rating: 72 }; });
  const dd = { ...d, items };
  let wins = 0, upsets = 0, goals = 0;
  for (let i = 0; i < 400; i++) { const m = F.simulateMatch({ ...dd, seed: 'f' + i }, dd.managers[0], dd.managers[1], 'x', true); if (m.winner === 0) wins++; else upsets++; goals += m.score[0] + m.score[1]; }
  out.fair = { wins, upsets, avgGoals: goals / 400 };
  // Ratings: deterministic, 1–99, overrides respected, team rating on 1–99 and provisional when incomplete.
  const it = d.items[Object.keys(d.items)[0]];
  out.ratings = { same: JSON.stringify(F.playerRating(it)) === JSON.stringify(F.playerRating(it)), override: F.playerRating({ ...it, rating: 77 }).ovr === 77 && !F.playerRating({ ...it, rating: 77 }).estimated,
    teamRange: dd.managers.every((m) => { const r = F.teamRating(dd, m).rating; return r >= 1 && r <= 99; }),
    provisional: F.teamRating(dd, { ...dd.managers[0], team: dd.managers[0].team.map((t, i) => (i < 2 ? t : null)) }).provisional };
  out.fullDraft = fullDraft;
  return out;
};
