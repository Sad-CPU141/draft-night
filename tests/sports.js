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
  // Grand Prix (F1 Drivers).
  {
    const S = DN.sports; const t = T('t-f1'); const d = dOf(t);
    const pickT = (id, names) => ({ id, name: id, team: names.map((n) => ({ itemId: t.items.find((i) => i.name === n).id, price: 4 })) });
    const fast = pickT('A', ['Max Verstappen', 'Lewis Hamilton', 'Ayrton Senna']);
    const slow = pickT('B', ['Lance Stroll', 'Franco Colapinto', 'Damon Hill']);
    const g = S.simulateGrandPrix(d, fast, slow, 'r1');
    ok(F.battleKind(t).name === 'Grand Prix' && g.v === 'gp' && JSON.stringify(g) === JSON.stringify(S.simulateGrandPrix(d, fast, slow, 'r1')) && g.score[0] !== g.score[1] && g.cars.length === 20, 'F1 Drivers race a full 20-car Grand Prix that always has a winner and replays exactly (' + g.score.join('–') + ' points)');
    const pts = g.result.reduce((n, r) => n + r.pts, 0); const teamPts = [0, 1].map((k) => g.result.filter((r) => g.cars[r.car].team === k).reduce((n, r) => n + r.pts, 0));
    ok((pts === 101 || pts === 102) && teamPts[0] === g.score[0] && teamPts[1] === g.score[1] && g.result.filter((r) => r.pos != null).every((r, k) => r.pos === k + 1), 'points go 25-18-15-12-10-8-6-4-2-1 plus the fastest lap, and the team scores add up');
    const mid = pickT('C', ['Lando Norris', 'Charles Leclerc', 'Michael Schumacher']);
    let wins = 0, kinds = new Set(), rain = 0, sc = 0, stops = 0, n = 200, ordered = true;
    for (let k = 0; k < n; k++) {
      const m = S.simulateGrandPrix({ ...d, seed: 'gp' + k }, fast, mid, 'k'); if (m.winner === 0) wins++; if (m.rain) rain++; if (m.sc) sc++;
      m.events.forEach((e) => kinds.add(e.kind)); stops += m.pits.reduce((a, p) => a + p.length, 0) / m.cars.length;
      const fin = m.result.filter((r) => r.pos != null); for (let j = 1; j < fin.length; j++) if (fin[j].time < fin[j - 1].time) ordered = false;
      m.cum.forEach((c) => { for (let j = 1; j < c.length; j++) if (!(c[j] > c[j - 1])) ordered = false; });
    }
    ok(wins > 110 && wins < 195, 'faster drivers usually win, but not always (' + Math.round(wins / 2) + '% against a close line-up)');
    ok(['pass', 'pit', 'crash', 'sc', 'scend', 'rain', 'spin', 'start', 'flag', 'fastest'].every((x) => kinds.has(x)) && rain > 20 && sc > 30 && stops / n > 0.9 && stops / n < 2.5, 'races have overtakes, pit stops (about ' + (stops / n).toFixed(1) + ' a car), rain, crashes and safety cars');
    ok(ordered, 'the finishing order matches the recorded race times, lap by lap');
    const monaco = [], monza = []; for (let k = 0; k < 120; k++) { const m = S.simulateGrandPrix({ ...d, seed: 'tr' + k }, fast, slow, 'k'); const p = m.events.filter((e) => e.kind === 'pass').length; if (m.track === 'monaco') monaco.push(p); if (m.track === 'monza') monza.push(p); }
    const avg = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
    ok(monaco.length && monza.length && avg(monaco) < avg(monza) * 0.6, 'overtaking is much harder at Monaco than Monza (' + avg(monaco).toFixed(0) + ' vs ' + avg(monza).toFixed(0) + ' passes)');
    const leg = t.items.find((i) => i.name === 'Ayrton Senna'), cur = t.items.find((i) => i.name === 'Lando Norris');
    ok(S.f1Rating(leg).attrs.WET > S.f1Rating(cur).attrs.WET && S.f1EraOf(leg, t) === 'prime' && S.f1EraOf(cur, t) === 'now', 'drivers get estimated numbers: legends at their Prime, current drivers Now (Senna is stronger in the wet)');
    // Every car's position on the map is a real number at every moment.
    const sc2 = S.gpScript(g); let posOK = true; sc2.beats.forEach((b) => { for (let u = 0; u < b.dur; u += 0.5) { const T2 = S.gpRaceTime(g, b, u); g.cum.forEach((c) => { const x = S.gpDist(c, T2); const p = S.trackGeo(g.track).at(x); if (!isFinite(p.x) || !isFinite(p.y)) posOK = false; }); } });
    ok(posOK, 'every car has a place on the track map at every moment of the race');
    const fill = (topic, n2, seed) => { const ms = [...Array(n2)].map((_, i) => ({ id: 'm' + i, name: ['Lions', 'Sharks', 'Owls'][i], color: DN.COLORS[i], emoji: 'x', human: true })); let dd = DN.createDraft(topic, ms, { ...DN.DEFAULT_RULES, slots: topic.slots, finale: { mode: 'sim', speed: 'normal' } }, { seed }); let gg = 0, rr = 0; while (!DN.isDraftOver(dd) && gg++ < 800) { if (dd.phase === 'auction') { const m = dd.managers.find((x, k) => (k + rr++) % 2 === 0 && DN.canBid(dd, x, DN.nextAmount(dd))) || dd.managers.find((x) => DN.canBid(dd, x, DN.nextAmount(dd))); dd = m ? DN.sell(DN.placeBid(dd, m.id, DN.nextAmount(dd))) : DN.skipItem(dd); } else if (dd.phase === 'freepick') { const cp = DN.currentPicker(dd); dd = DN.freePick(dd, dd.leftover.find((x) => DN.canTake(dd, cp.m, x))); } else break; } return dd; };
    const raw = { ...fill(t, 3, 'gpui'), mode: 'local', createdAt: Date.now(), history: [] };
    const X = await boot({ idb: false, speed: 0.05, storage: { dn_current_v1: JSON.stringify(raw) } });
    await click(X.w, btn(X.d, 'Resume draft')); await click(X.w, btn(X.d, 'Start the finale')); await click(X.w, btn(X.d, 'Lights out')); await sleep(500);
    const live = !!X.d.querySelector('.tracksvg') && X.d.querySelectorAll('.gprow').length === 20 && /LAP|FORMATION/.test(X.d.querySelector('.sb-clock').textContent);
    await click(X.w, btn(X.d, 'Skip to result')); await sleep(150);
    ok(live && /Race result/.test(X.d.body.textContent) && /Driver of the Day/.test(X.d.body.textContent) && /Podium/.test(X.d.body.textContent), 'the track map shows all 20 cars with a timing tower and ends with the race result and report');
    X.w.close();
  }
  // Tennis tie.
  {
    const S = DN.sports; const t = T('t-ten'); const d = dOf(t);
    const pickT = (id, names) => ({ id, name: id, team: names.map((n) => ({ itemId: t.items.find((i) => i.name === n).id, price: 4 })) });
    const big = pickT('A', ['Novak Djokovic', 'Carlos Alcaraz', 'Serena Williams', 'Iga Świątek']);
    const close = pickT('B', ['Roger Federer', 'Jannik Sinner', 'Steffi Graf', 'Aryna Sabalenka']);
    const g = S.simulateTennisTie(d, big, close, 'm1');
    ok(F.battleKind(t).name === 'Tennis tie' && g.v === 'tennis' && JSON.stringify(g) === JSON.stringify(S.simulateTennisTie(d, big, close, 'm1')) && g.score[0] !== g.score[1] && g.matches.length >= 4, 'Tennis Players play a team tie that always has a winner and replays exactly (' + g.score.join('–') + ')');
    ok(g.matches[0].label === 'Men’s singles' && g.matches[2].label === 'Women’s singles' && !g.matches[2].a.concat(g.matches[2].b).some((p) => !p.women), 'men play men and women play women');
    // Scoring rules, checked by replaying every point of many matches.
    let legal = true, tbs = 0, deciders = 0, three = 0, n = 0, kinds = new Set(), wins = 0, longest = 0;
    const validSet = (s2, final) => { const [a, b] = s2; const hi = Math.max(a, b), lo = Math.min(a, b); if (s2.length === 4) { const [x, y] = [s2[2], s2[3]]; const tgt = 7; return hi === 7 && lo === 6 && Math.max(x, y) >= tgt && Math.abs(x - y) >= 2 && (Math.max(x, y) === tgt || Math.abs(x - y) === 2); } return (hi === 6 && lo <= 4) || (hi === 7 && lo === 5); };
    for (let k = 0; k < 120; k++) {
      const tie = S.simulateTennisTie({ ...d, seed: 'tn' + k }, big, close, 'k'); if (tie.winner === 0) wins++; if (tie.how === 'doubles') deciders++;
      tie.matches.forEach((m) => {
        n++; if (m.sets.length === 3) three++;
        const won = [0, 1].map((sd) => m.sets.filter((s2) => s2[sd] > s2[1 - sd]).length);
        if (Math.max(...won) !== 2 || won[m.winner] !== 2) legal = false;
        m.sets.forEach((s2, si) => { if (s2.length === 4) tbs++; if (si < 2 && !validSet(s2)) legal = false; if (si === 2 && s2.length === 4 && !(Math.max(s2[2], s2[3]) >= 10)) legal = false; });
        const rp = S.tennisReplay(m); const last = rp[rp.length - 1]; if (!last.after.done || JSON.stringify(last.after.sets) !== JSON.stringify(m.sets.map((s2) => [s2[0], s2[1]]))) legal = false;
        rp.forEach((p) => { kinds.add(p.how); longest = Math.max(longest, p.shots); });
      });
    }
    ok(legal, 'every match follows real scoring: sets to six (by two), 7-point tiebreaks at 6–6, a 10-point tiebreak in the deciding set, best of three');
    ok(tbs > 10 && three / n > 0.25 && deciders > 10, 'close matches go to tiebreaks and third sets, and level ties go to the mixed doubles decider (' + deciders + ' of 120)');
    ok(['ace', 'df', 'svw', 'fh', 'bh', 'volley', 'smash', 'pass', 'lob', 'drop', 'forced', 'ue'].every((x) => kinds.has(x)) && longest >= 15, 'points end in aces, double faults, winners of every kind and errors, with rallies up to ' + longest + ' shots');
    const weak = pickT('C', ['Frances Tiafoe', 'Tommy Paul', 'Emma Raducanu', 'Leylah Fernandez']);
    let ww = 0; for (let k = 0; k < 60; k++) if (S.simulateTennisTie({ ...d, seed: 'w' + k }, big, weak, 'k').winner === 0) ww++;
    ok(ww > 50 && wins > 30 && wins < 90, 'stronger players usually win (' + Math.round(ww / 60 * 100) + '% against a weaker team), close ties are close (' + Math.round(wins / 1.2) + '%)');
    const clayTie = (() => { for (let k = 0; k < 40; k++) { const x = S.simulateTennisTie({ ...d, seed: 'c' + k }, big, close, 'k'); if (x.surface === 'clay') return x; } return null; })();
    const grassTie = (() => { for (let k = 0; k < 40; k++) { const x = S.simulateTennisTie({ ...d, seed: 'c' + k }, big, close, 'k'); if (x.surface === 'grass') return x; } return null; })();
    ok(clayTie && grassTie && S.tenRating(t.items.find((i) => i.name === 'Rafael Nadal')).surf === 'clay', 'ties are played on grass, clay or hard courts, with clay and grass specialists');
    // Every highlight point animates without errors.
    let framesOK = true; g.matches.forEach((m) => { const sc = S.tennisScript(g); sc.beats.filter((b) => b.type === 'pt').slice(0, 40).forEach((b) => { for (let u = 0; u < b.dur; u += 0.2) { const f = S.tennisFrame(b, u, g.matches[b.mi]); if (!f.P || (f.ball && (!isFinite(f.ball.x) || !isFinite(f.ball.y)))) framesOK = false; } }); });
    ok(framesOK, 'every shown point animates without errors');
    const fill = (topic, n2, seed) => { const ms = [...Array(n2)].map((_, i) => ({ id: 'm' + i, name: ['Lions', 'Sharks', 'Owls'][i], color: DN.COLORS[i], emoji: 'x', human: true })); let dd = DN.createDraft(topic, ms, { ...DN.DEFAULT_RULES, slots: topic.slots, finale: { mode: 'sim', speed: 'normal' } }, { seed }); let gg = 0, rr = 0; while (!DN.isDraftOver(dd) && gg++ < 800) { if (dd.phase === 'auction') { const m = dd.managers.find((x, k) => (k + rr++) % 2 === 0 && DN.canBid(dd, x, DN.nextAmount(dd))) || dd.managers.find((x) => DN.canBid(dd, x, DN.nextAmount(dd))); dd = m ? DN.sell(DN.placeBid(dd, m.id, DN.nextAmount(dd))) : DN.skipItem(dd); } else if (dd.phase === 'freepick') { const cp = DN.currentPicker(dd); dd = DN.freePick(dd, dd.leftover.find((x) => DN.canTake(dd, cp.m, x))); } else break; } return dd; };
    const raw = { ...fill(t, 3, 'tnui'), mode: 'local', createdAt: Date.now(), history: [] };
    const X = await boot({ idb: false, speed: 0.05, storage: { dn_current_v1: JSON.stringify(raw) } });
    await click(X.w, btn(X.d, 'Resume draft')); await click(X.w, btn(X.d, 'Start the finale')); await click(X.w, btn(X.d, 'First serve')); await sleep(500);
    const live = !!X.d.querySelector('.tennissvg') && !!X.d.querySelector('.tboard');
    await click(X.w, btn(X.d, 'Next match')); await sleep(150);
    await click(X.w, btn(X.d, 'Skip to result')); await sleep(150);
    ok(live && /Tie result/.test(X.d.body.textContent) && /Break points/.test(X.d.body.textContent) && X.d.querySelectorAll('.fc-row').length >= 4, 'the court shows a tennis scoreboard and ends with every match result and the tie report');
    X.w.close();
  }
  // NFL game.
  {
    const S = DN.sports; const t = T('t-nfl'); const d = dOf(t);
    const pickT = (id, names) => ({ id, name: id, team: names.map((n) => ({ itemId: t.items.find((i) => i.name === n).id, price: 4 })) });
    const stars = pickT('A', ['Patrick Mahomes', 'Saquon Barkley', 'Justin Jefferson', "Ja'Marr Chase", 'Travis Kelce', 'Aaron Donald']);
    const avg1 = pickT('B', ['Jordan Love', 'James Cook', 'Drake London', 'Tee Higgins', 'David Njoku', 'Roquan Smith']);
    const avg2 = pickT('C', ['Baker Mayfield', 'Kyren Williams', 'Terry McLaurin', 'DeVonta Smith', 'Jake Ferguson', 'Kyle Hamilton']);
    const g = S.simulateNFL(d, stars, avg1, 'n1');
    ok(F.battleKind(t).name === 'NFL game' && g.v === 'nfl' && JSON.stringify(g) === JSON.stringify(S.simulateNFL(d, stars, avg1, 'n1')) && g.score[0] !== g.score[1], 'NFL Stars play a full game that always has a winner and replays exactly (' + g.score.join('–') + ')');
    ok(g.quarters.reduce((n, q) => n + q[0], 0) === g.score[0] && g.quarters.reduce((n, q) => n + q[1], 0) === g.score[1] && g.quarters.length >= 4, 'the quarter-by-quarter scores add up to the final');
    let pts = 0, n = 120, kinds = new Set(), ot = 0, wins = 0, td = 0, legal = true;
    for (let k = 0; k < n; k++) {
      const m = S.simulateNFL({ ...d, seed: 'nf' + k }, avg1, avg2, 'k'); pts += m.score[0] + m.score[1]; if (m.ot) ot++;
      m.plays.forEach((p) => { kinds.add(p.type); if (p.td) td++; if (p.down && (p.down < 1 || p.down > 4 || p.on < 0 || p.on > 100)) legal = false; });
      [0, 1].forEach((s2) => { if (m.score[s2] === 1) legal = false; });
    }
    for (let k = 0; k < 80; k++) if (S.simulateNFL({ ...d, seed: 'nw' + k }, stars, avg1, 'k').winner === 0) wins++;
    ok(pts / n / 2 > 15 && pts / n / 2 < 32, 'average teams score like the NFL (' + (pts / n / 2).toFixed(1) + ' points a team)');
    ok(['run', 'pass', 'inc', 'sack', 'int', 'fum', 'fg', 'punt', 'scramble'].every((x) => kinds.has(x)) && td / n > 3, 'games have runs, completions, incompletions, sacks, interceptions, fumbles, field goals, punts and scrambles');
    ok(legal, 'downs stay 1st to 4th, the ball stays on the field, and scores are real football scores');
    ok(wins > 55 && wins < 80, 'the stronger team usually wins, but not always (' + Math.round(wins / 0.8) + '%)');
    const r = S.nflRating(t.items.find((i) => i.name === 'Sauce Gardner'), 'DEF'); const r2 = S.nflRating(t.items.find((i) => i.name === 'Myles Garrett'), 'DEF');
    ok(r.role === 'CB' && r2.role === 'DL' && S.nflEraOf(t.items.find((i) => i.name === 'Jerry Rice'), t) === 'prime' && S.nflEraOf(t.items.find((i) => i.name === 'Puka Nacua'), t) === 'now', 'defensive stars play their real job (corner, pass rusher), legends show Prime and current players Now');
    let framesOK = true; S.nflScript(g).beats.filter((b) => b.type === 'play').forEach((b) => { const L2 = g.lineups; const keyOf = (s2, name) => { const x = L2[s2].find((y) => y.name === name); return x ? x.k : null; }; const bb = { ...b, p: { ...b.p, tgtKey: keyOf(b.p.poss, b.p.tgt) || 'wr1' } }; for (let u = 0; u < b.dur; u += 0.3) { const f = S.nflFrame(bb, u); if (!f || !isFinite(f.ball.x) || !isFinite(f.off.qb.x)) framesOK = false; } });
    ok(framesOK, 'every highlight play animates without errors');
    const fill = (topic, n2, seed) => { const ms = [...Array(n2)].map((_, i) => ({ id: 'm' + i, name: ['Lions', 'Sharks', 'Owls'][i], color: DN.COLORS[i], emoji: 'x', human: true })); let dd = DN.createDraft(topic, ms, { ...DN.DEFAULT_RULES, slots: topic.slots, finale: { mode: 'sim', speed: 'normal' } }, { seed }); let gg = 0, rr = 0; while (!DN.isDraftOver(dd) && gg++ < 800) { if (dd.phase === 'auction') { const m = dd.managers.find((x, k) => (k + rr++) % 2 === 0 && DN.canBid(dd, x, DN.nextAmount(dd))) || dd.managers.find((x) => DN.canBid(dd, x, DN.nextAmount(dd))); dd = m ? DN.sell(DN.placeBid(dd, m.id, DN.nextAmount(dd))) : DN.skipItem(dd); } else if (dd.phase === 'freepick') { const cp = DN.currentPicker(dd); dd = DN.freePick(dd, dd.leftover.find((x) => DN.canTake(dd, cp.m, x))); } else break; } return dd; };
    const raw = { ...fill(t, 3, 'nflui'), mode: 'local', createdAt: Date.now(), history: [] };
    const X = await boot({ idb: false, speed: 0.05, storage: { dn_current_v1: JSON.stringify(raw) } });
    await click(X.w, btn(X.d, 'Resume draft')); await click(X.w, btn(X.d, 'Start the finale')); await click(X.w, btn(X.d, 'Kick off')); await sleep(500);
    const live = !!X.d.querySelector('.gridsvg');
    await click(X.w, btn(X.d, 'Skip to result')); await sleep(150);
    ok(live && /Box score/.test(X.d.body.textContent) && /MVP/.test(X.d.body.textContent) && !!X.d.querySelector('.qtable'), 'the field plays the game and ends with a box score, quarter scores and an MVP');
    X.w.close();
  }
  // Hockey game.
  {
    const S = DN.sports; const t = T('t-nhl'); const d = dOf(t);
    const pickT = (id, names) => ({ id, name: id, team: names.map((n) => ({ itemId: t.items.find((i) => i.name === n).id, price: 4 })) });
    const stars = pickT('A', ['Connor Hellebuyck', 'Cale Makar', 'Quinn Hughes', 'Connor McDavid', 'Nathan MacKinnon', 'Auston Matthews']);
    const close = pickT('B', ['Igor Shesterkin', 'Adam Fox', 'Victor Hedman', 'Leon Draisaitl', 'Nikita Kucherov', 'David Pastrňák']);
    const weak = pickT('C', ['Stuart Skinner', 'Darnell Nurse', 'Jared Spurgeon', 'Brad Marchand', 'William Nylander', 'Macklin Celebrini']);
    const g = S.simulateHockey(d, stars, close, 'h1');
    ok(F.battleKind(t).name === 'Hockey game' && g.v === 'nhl' && JSON.stringify(g) === JSON.stringify(S.simulateHockey(d, stars, close, 'h1')) && g.score[0] !== g.score[1], 'NHL Players play a full hockey game that always has a winner and replays exactly (' + g.score.join('–') + ')');
    let goals = 0, sog = 0, n = 150, kinds = new Set(), ot = 0, so = 0, add = true, wins = 0;
    for (let k = 0; k < n; k++) {
      const m = S.simulateHockey({ ...d, seed: 'hk' + k }, stars, close, 'k'); goals += m.score[0] + m.score[1] - (m.so ? 1 : 0); sog += m.shots[0] + m.shots[1]; if (m.ot) ot++; if (m.so) so++;
      m.plays.forEach((e) => kinds.add(e.kind + (e.type ? ':' + e.type : '')));
      const per = [0, 1].map((s2) => m.periods.reduce((x, p) => x + p[s2], 0) + (m.so && m.so.winner === s2 ? 1 : 0)); if (per[0] !== m.score[0] || per[1] !== m.score[1]) add = false;
      const boxG = [0, 1].map((s2) => Object.values(m.box[s2]).reduce((x, b) => x + b.g, 0)); if (boxG[0] > m.score[0] || boxG[1] > m.score[1]) add = false;
    }
    for (let k = 0; k < 80; k++) if (S.simulateHockey({ ...d, seed: 'hw' + k }, stars, weak, 'k').winner === 0) wins++;
    ok(goals / n > 4 && goals / n < 8 && sog / n > 45 && sog / n < 75, 'scores and shots look like the NHL (' + (goals / n).toFixed(1) + ' goals and ' + Math.round(sog / n) + ' shots a game)');
    ok(['goal:wrist', 'goal:onetimer', 'goal:rebound', 'save:breakaway', 'block', 'miss', 'post', 'hit', 'pen'].every((x) => kinds.has(x)) && ot > 5 && so > 0, 'games have every kind of goal and save, blocks, posts, hits, power plays, overtime and shootouts');
    ok(add, 'the period scores and the box score add up to the final');
    ok(wins > 50 && wins < 78, 'the stronger team usually wins, but not always (' + Math.round(wins / 0.8) + '%)');
    let framesOK = true; S.rinkScript(g).beats.filter((b) => b.type === 'ev').forEach((b) => { for (let u = 0; u < b.dur; u += 0.3) { const f = S.rinkFrame(b, u, g.lineups); if (!f || !isFinite(f.puck.x) || !isFinite(f.puck.y)) framesOK = false; } });
    ok(framesOK, 'every highlight animates without errors');
    const fill = (topic, n2, seed) => { const ms = [...Array(n2)].map((_, i) => ({ id: 'm' + i, name: ['Lions', 'Sharks', 'Owls'][i], color: DN.COLORS[i], emoji: 'x', human: true })); let dd = DN.createDraft(topic, ms, { ...DN.DEFAULT_RULES, slots: topic.slots, finale: { mode: 'sim', speed: 'normal' } }, { seed }); let gg = 0, rr = 0; while (!DN.isDraftOver(dd) && gg++ < 800) { if (dd.phase === 'auction') { const m = dd.managers.find((x, k) => (k + rr++) % 2 === 0 && DN.canBid(dd, x, DN.nextAmount(dd))) || dd.managers.find((x) => DN.canBid(dd, x, DN.nextAmount(dd))); dd = m ? DN.sell(DN.placeBid(dd, m.id, DN.nextAmount(dd))) : DN.skipItem(dd); } else if (dd.phase === 'freepick') { const cp = DN.currentPicker(dd); dd = DN.freePick(dd, dd.leftover.find((x) => DN.canTake(dd, cp.m, x))); } else break; } return dd; };
    const raw = { ...fill(t, 3, 'nhlui'), mode: 'local', createdAt: Date.now(), history: [] };
    const X = await boot({ idb: false, speed: 0.05, storage: { dn_current_v1: JSON.stringify(raw) } });
    await click(X.w, btn(X.d, 'Resume draft')); await click(X.w, btn(X.d, 'Start the finale')); await click(X.w, btn(X.d, 'Puck drop')); await sleep(500);
    const live = !!X.d.querySelector('.rinksvg');
    await click(X.w, btn(X.d, 'Skip to result')); await sleep(150);
    ok(live && /Game summary/.test(X.d.body.textContent) && /Three stars/.test(X.d.body.textContent), 'the rink plays the game and ends with period scores and the three stars');
    X.w.close();
  }
  // Cricket T20.
  {
    const S = DN.sports; const t = T('t-crk'); const d = dOf(t);
    const pickT = (id, names) => ({ id, name: id, team: names.map((n) => ({ itemId: t.items.find((i) => i.name === n).id, price: 4 })) });
    const stars = pickT('A', ['Virat Kohli', 'Sachin Tendulkar', 'AB de Villiers', 'Jasprit Bumrah', 'Shane Warne', 'Ben Stokes']);
    const close = pickT('B', ['Brian Lara', 'Ricky Ponting', 'Adam Gilchrist', 'Glenn McGrath', 'Muttiah Muralitharan', 'Jacques Kallis']);
    const weak = pickT('C', ['Devon Conway', 'Saud Shakeel', 'Tom Latham', 'Naseem Shah', 'Arshdeep Singh', 'Sam Curran']);
    const g = S.simulateCricket(d, stars, close, 'c1');
    ok(F.battleKind(t).name === 'T20 match' && g.v === 'cricket' && JSON.stringify(g) === JSON.stringify(S.simulateCricket(d, stars, close, 'c1')) && g.winner != null, 'Cricket Players play a T20 match that always has a result and replays exactly (' + g.innings.map((x) => x.runs + '/' + x.wk).join(' v ') + ')');
    let runs = 0, wk = 0, six = 0, n = 150, legal = true, kinds = new Set(), sos = 0, wins = 0, drops = 0, miles = 0;
    for (let k = 0; k < n; k++) {
      const m = S.simulateCricket({ ...d, seed: 'ck' + k }, stars, close, 'k'); if (m.superOvers.length) sos++;
      m.innings.forEach((inn, ii) => {
        runs += inn.runs; wk += inn.wk;
        const sum = inn.balls.reduce((x, b) => x + b.r, 0); if (sum !== inn.runs || inn.legal > 120 || inn.wk > 10) legal = false;
        const bowlBalls = {}; inn.balls.forEach((b) => { if (b.x !== 1 && b.x !== 2) bowlBalls[b.bowl] = (bowlBalls[b.bowl] || 0) + 1; if (b.w) kinds.add(b.how); if (b.drop != null) drops++; if (b.mile) miles++; if ((b.x === 2 ? b.r - 1 : b.r) === 6 && b.x !== 1) six++; });
        if (Object.values(bowlBalls).some((v) => v > 24)) legal = false;
        if (ii === 1 && inn.runs > m.innings[0].runs + 6) legal = false;
        const batSum = inn.bs.reduce((x, b) => x + b.r, 0); if (batSum + inn.extras !== inn.runs) legal = false;
      });
      if (!m.superOvers.length && ((m.innings[1].runs > m.innings[0].runs) !== (m.winner === m.innings[1].team))) legal = false;
    }
    for (let k = 0; k < 80; k++) if (S.simulateCricket({ ...d, seed: 'cw' + k }, stars, weak, 'k').winner === 0) wins++;
    ok(runs / n / 2 > 140 && runs / n / 2 < 195 && wk / n / 2 > 4.5 && wk / n / 2 < 8.5 && six / n / 2 > 4, 'scores look like T20 cricket (' + Math.round(runs / n / 2) + '/' + (wk / n / 2).toFixed(1) + ' an innings, ' + (six / n / 2).toFixed(1) + ' sixes)');
    ok(legal, 'the rules hold: 20 overs, 10 wickets, at most 4 overs a bowler, the chase stops when the target is passed, and the scorecard adds up');
    ok(['bowled', 'lbw', 'caught', 'caught behind', 'stumped', 'run out'].every((x) => kinds.has(x)) && drops > 20 && miles > 50, 'wickets fall every way (bowled, LBW, caught, caught behind, stumped, run out), catches get dropped, and batters reach fifties and hundreds');
    ok(wins > 55 && wins < 79, 'the stronger team usually wins, but not always (' + Math.round(wins / 0.8) + '%)');
    let tie = null; for (let k = 0; k < 600 && !tie; k++) { const m = S.simulateCricket({ ...d, seed: 'ct' + k }, stars, close, 'k'); if (m.superOvers.length) tie = m; }
    ok(tie && tie.innings[0].runs === tie.innings[1].runs && tie.superOvers.every((x) => x.legal <= 6 && x.wk <= 2), 'a tie goes to a Super Over (six balls, two wickets)');
    let framesOK = true; S.cricketScript(g).beats.filter((b) => b.type === 'ball').forEach((b) => { for (let u = 0; u < b.dur; u += 0.25) { const f = S.cricketFrame(b, u, g.xi[1 - b.inn.team]); if (!f || (f.ball && (!isFinite(f.ball.x) || !isFinite(f.ball.y)))) framesOK = false; } });
    ok(framesOK, 'every highlight ball animates without errors');
    const fill = (topic, n2, seed) => { const ms = [...Array(n2)].map((_, i) => ({ id: 'm' + i, name: ['Lions', 'Sharks', 'Owls'][i], color: DN.COLORS[i], emoji: 'x', human: true })); let dd = DN.createDraft(topic, ms, { ...DN.DEFAULT_RULES, slots: topic.slots, finale: { mode: 'sim', speed: 'normal' } }, { seed }); let gg = 0, rr = 0; while (!DN.isDraftOver(dd) && gg++ < 800) { if (dd.phase === 'auction') { const m = dd.managers.find((x, k) => (k + rr++) % 2 === 0 && DN.canBid(dd, x, DN.nextAmount(dd))) || dd.managers.find((x) => DN.canBid(dd, x, DN.nextAmount(dd))); dd = m ? DN.sell(DN.placeBid(dd, m.id, DN.nextAmount(dd))) : DN.skipItem(dd); } else if (dd.phase === 'freepick') { const cp = DN.currentPicker(dd); dd = DN.freePick(dd, dd.leftover.find((x) => DN.canTake(dd, cp.m, x))); } else break; } return dd; };
    const raw = { ...fill(t, 3, 'crkui'), mode: 'local', createdAt: Date.now(), history: [] };
    const X = await boot({ idb: false, speed: 0.05, storage: { dn_current_v1: JSON.stringify(raw) } });
    await click(X.w, btn(X.d, 'Resume draft')); await click(X.w, btn(X.d, 'Start the finale')); await click(X.w, btn(X.d, 'Toss the coin')); await sleep(500);
    const live = !!X.d.querySelector('.cricketsvg');
    await click(X.w, btn(X.d, 'Next innings')); await sleep(150);
    await click(X.w, btn(X.d, 'Skip to result')); await sleep(150);
    ok(live && /Scorecard/.test(X.d.body.textContent) && /Player of the Match/.test(X.d.body.textContent), 'the ground plays the match and ends with a scorecard and Player of the Match');
    X.w.close();
  }
  // Baseball.
  {
    const S = DN.sports; const t = T('t-mlb'); const tl = T('t-mlbl'); const d = dOf(t);
    const pickT = (id, names) => ({ id, name: id, team: names.map((n) => ({ itemId: t.items.find((i) => i.name === n).id, price: 4 })) });
    const stars = pickT('A', ['Shohei Ohtani', 'Aaron Judge', 'Juan Soto', 'Tarik Skubal', 'Emmanuel Clase']);
    const mid = pickT('B', ['Ozzie Albies', 'Matt Olson', 'Austin Riley', 'Logan Webb', 'Josh Hader']);
    const g = S.simulateBaseball(d, stars, mid, 'b1');
    ok(F.battleKind(t).name === 'Baseball game' && F.battleKind(tl).name === 'Baseball game' && g.v === 'mlb' && JSON.stringify(g) === JSON.stringify(S.simulateBaseball(d, stars, mid, 'b1')) && g.score[0] !== g.score[1], 'MLB Players and MLB Legends play a baseball game that always has a winner and replays exactly (' + g.score.join('–') + ')');
    let runs = 0, hits = 0, hr = 0, k = 0, n = 150, legal = true, kinds = new Set(), extra = 0, wo = 0, wins = 0;
    for (let q = 0; q < n; q++) {
      const m = S.simulateBaseball({ ...d, seed: 'bb' + q }, mid, mid, 'k'); runs += m.score[0] + m.score[1]; hits += m.hits[0] + m.hits[1]; if (m.innings > 9) extra++; if (m.walkoff) wo++;
      m.plays.forEach((e) => { kinds.add(e.kind); if (e.kind === 'hr') hr++; if (e.kind === 'k') k++; if (e.outs != null && (e.outs < 0 || e.outs > 3)) legal = false; if (e.pitches && (e.pitches.split('').filter((c) => c === 'B').length > 4)) legal = false; });
      const ls = [0, 1].map((s2) => m.line[s2].reduce((x, v) => x + (v === 'X' ? 0 : +v), 0)); if (ls[0] !== m.score[0] || ls[1] !== m.score[1]) legal = false;
      if (m.line[0].length < 9) legal = false;
    }
    for (let q = 0; q < 80; q++) if (S.simulateBaseball({ ...d, seed: 'bw' + q }, stars, mid, 'k').winner === 0) wins++;
    ok(runs / n / 2 > 2.8 && runs / n / 2 < 6 && hits / n / 2 > 6 && hits / n / 2 < 10.5 && k / n / 2 > 6 && hr / n / 2 > 0.6, 'games look like MLB (' + (runs / n / 2).toFixed(1) + ' runs, ' + (hits / n / 2).toFixed(1) + ' hits, ' + (k / n / 2).toFixed(1) + ' strikeouts and ' + (hr / n / 2).toFixed(1) + ' home runs a team)');
    ok(['k', 'bb', 'hbp', '1b', '2b', '3b', 'hr', 'out', 'dp', 'err', 'sb', 'pchange'].every((x) => kinds.has(x)) && extra > 3 && wo > 3, 'games have strikeouts, walks, every kind of hit, double plays, errors, steals, pitching changes, extra innings and walk-offs');
    ok(legal, 'the rules hold: three outs an inning, four balls a walk, at least nine innings, and the line score adds up');
    ok(wins > 45 && wins < 76, 'the stronger team usually wins, but baseball is baseball (' + Math.round(wins / 0.8) + '%)');
    const oh = S.mlbRating(t.items.find((i) => i.name === 'Shohei Ohtani')); const mr = S.mlbRating(tl.items.find((i) => i.name === 'Mariano Rivera'));
    ok(oh.two && oh.attrs.POW && oh.attrs.STU && mr.pitcher && mr.reliever && F.eraWord(t) === 'Now' && F.eraWord(tl) === 'Prime', 'Ohtani hits and pitches, Rivera closes, MLB Players show Now and Legends show Prime');
    let framesOK = true; S.mlbScript(g).beats.filter((b) => b.type === 'pa').forEach((b) => { for (let u = 0; u < b.dur; u += 0.25) { const f = S.mlbFrame(b, u); if (!f || (f.ball && (!isFinite(f.ball.x) || !isFinite(f.ball.y)))) framesOK = false; } });
    ok(framesOK, 'every highlight at-bat animates without errors');
    const fill = (topic, n2, seed) => { const ms = [...Array(n2)].map((_, i) => ({ id: 'm' + i, name: ['Lions', 'Sharks', 'Owls'][i], color: DN.COLORS[i], emoji: 'x', human: true })); let dd = DN.createDraft(topic, ms, { ...DN.DEFAULT_RULES, slots: topic.slots, finale: { mode: 'sim', speed: 'normal' } }, { seed }); let gg = 0, rr = 0; while (!DN.isDraftOver(dd) && gg++ < 800) { if (dd.phase === 'auction') { const m = dd.managers.find((x, kk) => (kk + rr++) % 2 === 0 && DN.canBid(dd, x, DN.nextAmount(dd))) || dd.managers.find((x) => DN.canBid(dd, x, DN.nextAmount(dd))); dd = m ? DN.sell(DN.placeBid(dd, m.id, DN.nextAmount(dd))) : DN.skipItem(dd); } else if (dd.phase === 'freepick') { const cp = DN.currentPicker(dd); dd = DN.freePick(dd, dd.leftover.find((x) => DN.canTake(dd, cp.m, x))); } else break; } return dd; };
    const raw = { ...fill(tl, 3, 'mlbui'), mode: 'local', createdAt: Date.now(), history: [] };
    const X = await boot({ idb: false, speed: 0.05, storage: { dn_current_v1: JSON.stringify(raw) } });
    await click(X.w, btn(X.d, 'Resume draft')); await click(X.w, btn(X.d, 'Start the finale')); await click(X.w, btn(X.d, 'Play ball')); await sleep(500);
    const live = !!X.d.querySelector('.diamondsvg');
    await click(X.w, btn(X.d, 'Skip to result')); await sleep(150);
    ok(live && /Line score/.test(X.d.body.textContent) && /Player of the game/.test(X.d.body.textContent), 'the diamond plays the game and ends with a line score and the player of the game');
    X.w.close();
  }
  // Golf cup.
  {
    const S = DN.sports; const t = T('t-golf'); const d = dOf(t);
    const pickT = (id, names) => ({ id, name: id, team: names.map((n) => ({ itemId: t.items.find((i) => i.name === n).id, price: 4 })) });
    const stars = pickT('A', ['Tiger Woods', 'Jack Nicklaus', 'Rory McIlroy', 'Scottie Scheffler']);
    const close = pickT('B', ['Ben Hogan', 'Seve Ballesteros', 'Phil Mickelson', 'Annika Sörenstam']);
    const g = S.simulateGolf(d, stars, close, 'g1');
    ok(F.battleKind(t).name === 'Golf cup' && g.v === 'golf' && JSON.stringify(g) === JSON.stringify(S.simulateGolf(d, stars, close, 'g1')) && g.score[0] !== g.score[1] && g.matches.length >= 6, 'Golfers play a Ryder Cup-style match (2 fourballs, 4 singles) that always has a winner and replays exactly (' + g.score.join('–') + ')');
    // Round scoring for one player, and match-play rules.
    const tiger = { name: 'Tiger Woods', ...S.golfRating(t.items.find((i) => i.name === 'Tiger Woods')) };
    let tot = 0, rng0 = 1; const rng = () => { rng0 = (rng0 * 16807) % 2147483647; return rng0 / 2147483647; };
    for (let k = 0; k < 100; k++) S.GOLF_COURSE.forEach((h, i) => { tot += S.golfHole(rng, tiger, h, { wind: 1, pressure: false, key: 'r' + k + i }).strokes; });
    ok(tot / 100 > 66 && tot / 100 < 73, 'a great player shoots like a tour pro (' + (tot / 100).toFixed(1) + ' on a par-72 course)');
    let legal = true, kinds = new Set(), po = 0, halves = 0;
    for (let k = 0; k < 120; k++) {
      const m = S.simulateGolf({ ...d, seed: 'gf' + k }, stars, close, 'k'); if (m.how === 'playoff') po++;
      m.matches.forEach((mm) => {
        if (mm.result.w == null) halves++;
        let up = 0; mm.holes.forEach((h, i) => { const b = h.best.map((x) => x.strokes); const w = b[0] < b[1] ? 0 : b[1] < b[0] ? 1 : null; if (w !== h.w) legal = false; up += w === 0 ? 1 : w === 1 ? -1 : 0; if (up !== h.up) legal = false; if (mm.format !== 'playoff' && i < mm.holes.length - 1 && Math.abs(up) > 18 - (i + 1)) legal = false; h.notes.forEach((x) => x && kinds.add(x)); });
        if (mm.format !== 'playoff' && mm.holes.length < 18 && Math.abs(up) <= 18 - mm.holes.length) legal = false;
      });
      if (Math.abs(m.score[0] + m.score[1] - (m.how === 'playoff' ? 7 : 6)) > 0.01) legal = false;
    }
    ok(legal, 'match play rules hold: lower score wins the hole, matches end when the lead is bigger than the holes left, six points in all');
    ok(['ace', 'chipin', 'eagle', 'bomb', 'water', '3putt'].every((x) => kinds.has(x)) && po > 3 && halves > 10, 'rounds have holes-in-one, chip-ins, eagles, long putts, water and three-putts; matches get halved; level cups go to a playoff');
    let framesOK = true; S.golfScript(g).beats.filter((b) => b.type === 'hole').forEach((b) => { for (let u = 0; u < b.dur; u += 0.25) { const f = S.golfFrame(b, u); f.balls.forEach((x) => { if (x && (!isFinite(x.x) || !isFinite(x.y))) framesOK = false; }); } });
    ok(framesOK, 'every shown hole animates without errors');
    const fill = (topic, n2, seed) => { const ms = [...Array(n2)].map((_, i) => ({ id: 'm' + i, name: ['Lions', 'Sharks', 'Owls'][i], color: DN.COLORS[i], emoji: 'x', human: true })); let dd = DN.createDraft(topic, ms, { ...DN.DEFAULT_RULES, slots: topic.slots, finale: { mode: 'sim', speed: 'normal' } }, { seed }); let gg = 0, rr = 0; while (!DN.isDraftOver(dd) && gg++ < 800) { if (dd.phase === 'auction') { const m = dd.managers.find((x, kk) => (kk + rr++) % 2 === 0 && DN.canBid(dd, x, DN.nextAmount(dd))) || dd.managers.find((x) => DN.canBid(dd, x, DN.nextAmount(dd))); dd = m ? DN.sell(DN.placeBid(dd, m.id, DN.nextAmount(dd))) : DN.skipItem(dd); } else if (dd.phase === 'freepick') { const cp = DN.currentPicker(dd); dd = DN.freePick(dd, dd.leftover.find((x) => DN.canTake(dd, cp.m, x))); } else break; } return dd; };
    const raw = { ...fill(t, 3, 'golfui'), mode: 'local', createdAt: Date.now(), history: [] };
    const X = await boot({ idb: false, speed: 0.05, storage: { dn_current_v1: JSON.stringify(raw) } });
    await click(X.w, btn(X.d, 'Resume draft')); await click(X.w, btn(X.d, 'Start the finale')); await click(X.w, btn(X.d, 'First tee')); await sleep(500);
    const live = !!X.d.querySelector('.golfsvg');
    await click(X.w, btn(X.d, 'Next match')); await sleep(150);
    await click(X.w, btn(X.d, 'Skip to result')); await sleep(150);
    ok(live && /The cup/.test(X.d.body.textContent) && /Star of the day/.test(X.d.body.textContent), 'the course plays the cup and ends with every match result and a cup report');
    X.w.close();
  }
  // Rugby.
  {
    const S = DN.sports; const t = T('t-rugby'); const d = dOf(t);
    const pickT = (id, names) => ({ id, name: id, team: names.map((n) => ({ itemId: t.items.find((i) => i.name === n).id, price: 4 })) });
    const stars = pickT('A', ['Jonah Lomu', 'Richie McCaw', 'Dan Carter', 'Antoine Dupont', 'Martin Johnson']);
    const close = pickT('B', ["Brian O'Driscoll", 'Jonny Wilkinson', 'Siya Kolisi', 'Gareth Edwards', 'Bryan Habana']);
    const g = S.simulateRugby(d, stars, close, 'r1');
    ok(F.battleKind(t).name === 'Rugby match' && g.v === 'rugby' && JSON.stringify(g) === JSON.stringify(S.simulateRugby(d, stars, close, 'r1')) && g.score[0] !== g.score[1], 'Rugby Players play an 80-minute match that always has a winner and replays exactly (' + g.score.join('–') + ')');
    const posOK = t.items.every((i) => S.rugbyRating(i).pos) && S.rugbyRating(t.items.find((i) => i.name === 'Dan Carter')).pos === 'Fly-half' && S.rugbyRating(t.items.find((i) => i.name === 'Jonah Lomu')).pos === 'Wing' && g.xv[0].length === 15;
    ok(posOK, 'every player has a real position (Carter at fly-half, Lomu on the wing) in a 15-man side');
    let pts = 0, tries = 0, n = 150, kinds = new Set(), legal = true, et = 0;
    for (let k = 0; k < n; k++) {
      const m = S.simulateRugby({ ...d, seed: 'rg' + k }, stars, close, 'k'); pts += m.score[0] + m.score[1]; if (m.golden) et++;
      m.plays.forEach((e) => { kinds.add(e.kind + (e.how ? ':' + e.how : '')); if (e.kind === 'try') tries++; });
      // Every point is accounted for: tries 5, conversions 2, penalties and drop goals 3.
      const calc = [0, 1].map((s2) => m.plays.filter((e) => e.s === s2).reduce((x, e) => x + (e.kind === 'try' ? 5 + (e.conv ? 2 : 0) : (e.kind === 'pen' || e.kind === 'drop') && e.good ? 3 : e.kind === 'kcwin' ? 1 : 0), 0));
      if (calc[0] !== m.score[0] || calc[1] !== m.score[1]) legal = false;
    }
    ok(pts / n / 2 > 15 && pts / n / 2 < 42 && tries / n / 2 > 1.5, 'scores look like rugby (' + (pts / n / 2).toFixed(0) + ' points and ' + (tries / n / 2).toFixed(1) + ' tries a team)');
    ok(['try:break', 'try:maul', 'try:close', 'pen', 'turnover', 'scrum', 'card', 'break', 'kick', 'lineout'].every((x) => kinds.has(x)), 'matches have tries from breaks, mauls and pick-and-go, penalties, turnovers, scrums, yellow cards and territory kicks');
    ok(legal, 'every point adds up: 5 for a try, 2 for a conversion, 3 for a penalty or drop goal');
    let framesOK = true; S.rugbyScript(g).beats.filter((b) => b.type === 'ev').forEach((b) => { for (let u = 0; u < b.dur; u += 0.3) { const f = S.rugbyFrame(b, u, g.xv); if (!f || (f.ball && (!isFinite(f.ball.x) || !isFinite(f.ball.y)))) framesOK = false; } });
    ok(framesOK, 'every highlight animates without errors');
    const fill = (topic, n2, seed) => { const ms = [...Array(n2)].map((_, i) => ({ id: 'm' + i, name: ['Lions', 'Sharks', 'Owls'][i], color: DN.COLORS[i], emoji: 'x', human: true })); let dd = DN.createDraft(topic, ms, { ...DN.DEFAULT_RULES, slots: topic.slots, finale: { mode: 'sim', speed: 'normal' } }, { seed }); let gg = 0, rr = 0; while (!DN.isDraftOver(dd) && gg++ < 800) { if (dd.phase === 'auction') { const m = dd.managers.find((x, kk) => (kk + rr++) % 2 === 0 && DN.canBid(dd, x, DN.nextAmount(dd))) || dd.managers.find((x) => DN.canBid(dd, x, DN.nextAmount(dd))); dd = m ? DN.sell(DN.placeBid(dd, m.id, DN.nextAmount(dd))) : DN.skipItem(dd); } else if (dd.phase === 'freepick') { const cp = DN.currentPicker(dd); dd = DN.freePick(dd, dd.leftover.find((x) => DN.canTake(dd, cp.m, x))); } else break; } return dd; };
    const raw = { ...fill(t, 3, 'rugui'), mode: 'local', createdAt: Date.now(), history: [] };
    const X = await boot({ idb: false, speed: 0.05, storage: { dn_current_v1: JSON.stringify(raw) } });
    await click(X.w, btn(X.d, 'Resume draft')); await click(X.w, btn(X.d, 'Start the finale')); await click(X.w, btn(X.d, 'Kick-off')); await sleep(500);
    const live = !!X.d.querySelector('.rugbysvg');
    await click(X.w, btn(X.d, 'Skip to result')); await sleep(150);
    ok(live && /Match summary/.test(X.d.body.textContent) && /Player of the Match/.test(X.d.body.textContent), 'the pitch plays the match and ends with the try scorers and Player of the Match');
    X.w.close();
  }
  P.w.close();
};
