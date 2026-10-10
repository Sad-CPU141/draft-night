// Simulates full drafts with every twist on (no UI) and checks the rules can't be broken.
// Exposed for tests/run.js; also runnable alone: node tests/twists-sim.js
module.exports = function twistSims(DN, runs) {
  const B = DN.bots, T = DN.twists;
  const ts = DN.starterTopics();
  const out = { runs: 0, done: 0, neg: 0, dupOwn: 0, illegalPlay: 0, cards: {}, vetoed: 0, mysteryLeak: 0, nominations: 0, badNominations: 0, trades: { accepted: 0, rejected: 0 }, frozenBids: 0, teamGames: 0 };
  for (let r = 0; r < runs; r++) {
    const topic = ts[r % ts.length];
    const team = r % 3 === 0;
    const rules = { ...DN.DEFAULT_RULES, slots: topic.slots, ...T.twistRules({}), order: r % 2 ? 'nominate' : 'random' };
    let managers;
    if (team) {
      const bots = B.makeBots(6, ['easy', 'medium', 'hard'][r % 3], 'tm' + r, []);
      managers = [0, 1, 2].map((i) => ({ id: 'team' + i, name: 'Team ' + i, color: DN.COLORS[i], emoji: 'x', members: bots.slice(i * 2, i * 2 + 2).map((b) => ({ id: b.id, name: b.name, emoji: b.emoji, bot: b.bot })) }));
      out.teamGames++;
    } else managers = B.makeBots(4, ['easy', 'medium', 'hard'][r % 3], 'ind' + r, []);
    let d = DN.createDraft(topic, managers, rules, { mode: 'solo', solo: { level: 'medium' }, seed: 'tw' + r });
    let steps = 0;
    while (!['done'].includes(d.phase) && steps++ < 8000) {
      if (d.pending) { const victim = d.managers.find((m) => m.id === d.pending.target); const v = B.botVeto(d, victim, d.pending); if (v) out.vetoed++; d = T.answerCard(d, v); continue; }
      if (d.phase === 'nominate') {
        const cur = T.currentNominator(d); const actor = T.botActors(d).find((a) => a.id === cur.m.id);
        const pick = B.botNominate(d, actor);
        if (!T.nominationPool(d).includes(pick)) out.badNominations++;
        const nd = T.nominate(d, pick); out.nominations++;
        if (nd === d) { out.badNominations++; break; }
        // can't nominate the same thing twice
        if (T.nominate(nd, pick) !== nd) out.badNominations++;
        d = nd; continue;
      }
      if (d.phase === 'auction') {
        // mystery must stay hidden from bots' view
        const id = d.queue[0];
        if (d.items[id].mystery && T.visibleItem(d, id).name === d.items[id].name) out.mysteryLeak++;
        if (!d.bid) {
          const play = T.botActors(d).map((a) => B.botCardPlay(d, a)).filter(Boolean)[0];
          if (play) { const nd = T.playCard(d, play.botId, play.card, play.params); if (nd === d) { out.illegalPlay++; (out.why = out.why || []).push('card ' + play.card + ': ' + T.cardProblem(d, play.botId, play.card, play.params)); } else { out.cards[play.card] = (out.cards[play.card] || 0) + 1; d = nd; continue; } }
        }
        const plan = B.nextBotAction(d);
        if (plan) {
          const actor = d.managers.find((m) => m.id === plan.botId);
          if (T.frozenNow(d, actor.id)) out.frozenBids++;
          const nd = DN.placeBid(d, plan.botId, plan.amount, plan.double ? { double: true } : undefined);
          if (nd === d) { out.illegalPlay++; (out.why = out.why || []).push('bid ' + JSON.stringify(plan) + ' next ' + DN.nextAmount(d) + ' problem ' + (plan.double ? T.doubleProblem(d, plan.botId, plan.amount) : 'canBid=' + DN.canBid(d, actor, plan.amount)) + ' leader ' + (d.bid && d.bid.leaderId)); d = d.bid ? DN.sell(d) : DN.skipItem(d); } else { if (plan.double) out.cards.double = (out.cards.double || 0) + 1; d = nd; }
          continue;
        }
        d = d.bid ? DN.sell(d) : DN.skipItem(d); continue;
      }
      if (d.phase === 'freepick') { const cp = DN.currentPicker(d); const actor = T.botActors(d).find((a) => a.id === cp.m.id); d = DN.freePick(d, B.botFreePickChoice(d, actor)); continue; }
      if (d.phase === 'trade') {
        const now = Date.now();
        T.botActors(d).forEach((a) => {
          const offer = B.botTradeOffer(d, a); if (!offer) return;
          const nd = T.proposeTrade(d, offer, now); if (nd === d) return; d = nd;
          const p = d.trade.proposals[d.trade.proposals.length - 1];
          const target = T.botActors(d).find((x) => x.id === p.to);
          const ans = B.botTradeDecision(d, target, p);
          if (ans.accept) { d = T.acceptTrade(d, p.id, now); out.trades.accepted++; } else { d = T.rejectTrade(d, p.id); out.trades.rejected++; }
        });
        d = T.closeTrades(d); continue;
      }
    }
    out.runs++; if (d.phase === 'done') out.done++;
    if (d.managers.some((m) => m.budget < 0)) out.neg++;
    const owned = d.managers.flatMap((m) => m.team.filter(Boolean).map((t) => t.itemId));
    if (new Set(owned).size !== owned.length) out.dupOwn++;
    // every revealed id is owned; nothing owned is still hidden
    if (owned.some((id) => T.isHidden(d, id))) out.mysteryLeak++;
  }
  return out;
};
if (require.main === module) {
  const fs = require('fs'); const path = require('path'); const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://x.test/', runScripts: 'outside-only' }); const w = dom.window;
  w.__DN_TEST__ = true; w.fetch = async () => { throw new Error('offline'); }; w.matchMedia = () => ({ matches: false }); w.scrollTo = () => {};
  for (const f of ['vendor/react.production.min.js', 'vendor/react-dom.production.min.js', 'app.js']) w.eval(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
  setTimeout(() => { console.log(JSON.stringify(module.exports(w.__DN, +(process.argv[2] || 120)), null, 1)); process.exit(0); }, 100);
}
