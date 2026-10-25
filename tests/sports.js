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
  P.w.close();
};
