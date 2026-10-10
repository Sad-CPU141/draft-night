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
  // v2 engine: fairness by swapping sides with identical teams, calibration, and the animation agreeing with the result.
  {
    const dd2 = fullDraft(2, 'v2');
    const N = 1500; let firstWins = 0, secondWins = 0, draws = 0, goalsT = 0, big = 0;
    for (let i = 0; i < N; i++) {
      const m1 = F.simulateMatch({ ...dd2, seed: 'sym' + i }, dd2.managers[0], dd2.managers[1], 'x', false);
      const m2 = F.simulateMatch({ ...dd2, seed: 'sym' + i }, dd2.managers[1], dd2.managers[0], 'x', false);
      // team managers[0] wins as "first listed" in m1 and as "second listed" in m2
      if (m1.score[0] > m1.score[1]) firstWins++; if (m2.score[1] > m2.score[0]) secondWins++;
      if (m1.score[0] === m1.score[1]) draws++;
      goalsT += m1.score[0] + m1.score[1]; if (m1.score[0] + m1.score[1] >= 8) big++;
    }
    out.symmetry = { firstWins: firstWins / N, secondWins: secondWins / N, draws: draws / N, avgGoals: goalsT / N, eightPlus: big / N };
    let bad = 0, checked = 0, frames = 0, badFrames = 0, chainOk = true;
    for (let i = 0; i < 120; i++) {
      const dd3 = fullDraft(i % 3 === 0 ? 3 : 2, 'anim' + i);
      const A = dd3.managers[0], B = dd3.managers[1];
      const m = F.simulateMatch(dd3, A, B, 'k' + i, i % 2 === 0);
      if (m.forfeit) continue;
      checked++;
      const script = F.matchScript(m);
      const shown = F.revealedEvents(script, script.total).map((k) => m.events[k]);
      const g = [0, 1].map((t) => shown.filter((e) => e.type === 'goal' && e.team === t).length);
      if (g[0] !== m.score[0] || g[1] !== m.score[1]) bad++;
      // The score shown never goes down and only changes on goals.
      let prev = [0, 0];
      for (let t = 0; t <= script.total; t += script.total / 60) {
        const sh = F.revealedEvents(script, t).map((k) => m.events[k]).filter((e) => e.type === 'goal');
        const sc = [sh.filter((e) => e.team === 0).length, sh.filter((e) => e.team === 1).length];
        if (sc[0] < prev[0] || sc[1] < prev[1]) bad++;
        prev = sc;
        const L = [F.lineupOf(dd3, A), F.lineupOf(dd3, B)];
        const fr = F.matchFrame(script, L, t); frames++;
        if (!isFinite(fr.ball.x) || !isFinite(fr.ball.y) || fr.pos.some((team) => team.some((p) => !p || !isFinite(p.x) || !isFinite(p.y)))) badFrames++;
      }
      const roster = [A, B].map((t) => new Set(t.team.filter(Boolean).map((x) => dd3.items[x.itemId].name)));
      m.seqs.forEach((q) => { if (!q.chain.every((n) => roster[q.team].has(n))) chainOk = false; if (q.kind === 'goal' && q.chain[q.chain.length - 1] !== q.shooter) chainOk = false; });
      const again = F.simulateMatch(dd3, A, B, 'k' + i, i % 2 === 0);
      if (JSON.stringify(again) !== JSON.stringify(m)) bad++;
    }
    out.animation = { checked, bad, frames, badFrames, chainOk };
    // Home advantage is optional and small.
    const dd4 = fullDraft(2, 'home'); let h0 = 0, h1 = 0;
    for (let i = 0; i < 1500; i++) { const a = F.simulateMatch({ ...dd4, seed: 'h' + i }, dd4.managers[0], dd4.managers[1], 'x', false); const b = F.simulateMatch({ ...dd4, seed: 'h' + i }, dd4.managers[0], dd4.managers[1], 'x', false, { home: 1 }); if (a.score[1] > a.score[0]) h0++; if (b.score[1] > b.score[0]) h1++; }
    out.home = { without: h0 / 1500, withHome: h1 / 1500 };
  }
  out.fullDraft = fullDraft;
  return out;
};
