/* ============================================================
   TOPIC SHARING, PLAYER STATS, AWARDS, HALL OF SHAME
   Plain functions over saved drafts and topics.

   SHARING (honest version for a static website)
   GitHub Pages can't store anything, so a share link carries the whole
   topic inside it (compressed, after the # so it never reaches a server).
   The "DN-XXXXXX" code is a fingerprint of the topic's contents: it lets
   you check two copies match and spot duplicates, but it can't be typed in
   on its own to download a topic — that would need a server. The full
   share code (the long text) or a .json topic file always works.

   STATS
   Built from finished drafts saved in Past Drafts (votes revealed), so a
   game is counted once, only when its result is final. Players are matched
   by name, like the leaderboard. Bots are left out.
   In team games each player gets the team's result, and an equal share of
   the money the team spent.
   ============================================================ */

/* ---------- topic sharing ---------- */
const SHARE_PREFIX = 'DN1.';   // compressed
const SHARE_PREFIX_RAW = 'DN0.'; // not compressed (older browsers)
const MAX_LINK = 7000;          // longer links break in some chat apps
const clip = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
const b64url = (bytes) => { let s = ''; bytes.forEach((b) => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64url = (str) => { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; };
async function pipeBytes(bytes, stream) { const s = new Blob([bytes]).stream().pipeThrough(stream); return new Uint8Array(await new Response(s).arrayBuffer()); }
const canCompress = () => typeof window !== 'undefined' && typeof window.CompressionStream === 'function' && typeof window.DecompressionStream === 'function';

// Only what a topic needs: no profiles, drafts or other private data.
function packTopic(t, withPhotos) {
  return { v: 1, n: t.name, e: t.emoji, s: t.slots, l: t.layout || 'list', a: t.art || 'emoji', ks: t.kitShape || '', kl: t.kitLabel || '', ph: !!t.photos, f: t.folder || '', sc: t.scene || '', ...(t.era ? { er: t.era } : {}),
    i: t.items.map((it) => { const r = [it.name, it.pos || '', it.desc || '', it.emoji || '', it.imageUrl || '', it.wiki || '', it.kit || null, it.photosOff ? 1 : 0]; if (withPhotos && it.photo) r.push(it.photo); if (validRating(it.rating)) { while (r.length < 9) r.push(''); r[9] = Math.round(+it.rating); } return r; }) };
}
// Rebuild a safe topic from shared data. Returns { ok, topic, error }.
function unpackTopic(o) {
  if (!o || o.v !== 1 || typeof o.n !== 'string' || !Array.isArray(o.s) || !Array.isArray(o.i)) return { ok: false, error: 'That isn’t a Draft Night topic.' };
  if (o.i.length > 600) return { ok: false, error: 'That topic has too many items (600 max).' };
  const slots = o.s.map((x) => clip(String(x), 20)).filter(Boolean).slice(0, 16);
  if (!slots.length) return { ok: false, error: 'That topic has no slots.' };
  const goodUrl = (u) => (typeof u === 'string' && /^https:\/\//.test(u) ? u.slice(0, 2000) : '');
  const goodPhoto = (p) => (typeof p === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,/.test(p) && p.length < 400000 ? p : '');
  const goodColor = (c) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : null);
  const items = o.i.filter((r) => Array.isArray(r) && typeof r[0] === 'string' && r[0].trim()).map((r) => {
    const it = { id: uid(), name: clip(r[0], 80).trim(), pos: clip(r[1], 20), desc: clip(r[2], 120), emoji: clip(r[3], 12), photo: goodPhoto(r[8]) };
    if (goodUrl(r[4])) it.imageUrl = goodUrl(r[4]);
    if (r[5]) it.wiki = clip(r[5], 120);
    if (Array.isArray(r[6]) && goodColor(r[6][0]) && goodColor(r[6][1])) it.kit = [goodColor(r[6][0]), goodColor(r[6][1])];
    if (r[7]) it.photosOff = true;
    if (validRating(r[9])) it.rating = Math.round(+r[9]);
    return it;
  });
  if (!items.length) return { ok: false, error: 'That topic has no items.' };
  return { ok: true, topic: { id: uid(), name: clip(o.n, 60).trim() || 'Shared topic', emoji: clip(o.e, 12) || '🎲', slots, layout: o.l === 'pitch' ? 'pitch' : 'list', art: o.a === 'kit' ? 'kit' : o.a === 'scene' && SCENES[o.sc] ? 'scene' : 'emoji', ...(typeof o.sc === 'string' && SCENES[o.sc] ? { scene: o.sc } : {}), ...(o.er === 'now' || o.er === 'prime' ? { era: o.er } : {}), kitShape: o.ks === 'tank' ? 'tank' : '', kitLabel: o.kl === 'initials' ? 'initials' : '', photos: !!o.ph, folder: clip(o.f, 24) || 'My Topics', items } };
}
// Fingerprint of a topic's contents, shown as DN-XXXXXX.
function topicCode(t) {
  const sig = JSON.stringify([t.name, t.slots, t.items.map((i) => [i.name, i.pos || '', i.desc || ''])]);
  const A = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let h = hashStr(sig), h2 = hashStr(sig + '#'), out = '';
  for (let i = 0; i < 6; i++) { const n = i < 3 ? h : h2; out += A[(n >>> (i % 3) * 7) % A.length]; }
  return 'DN-' + out;
}
async function encodeTopic(t, withPhotos) {
  const bytes = new TextEncoder().encode(JSON.stringify(packTopic(t, withPhotos)));
  if (canCompress()) { try { return SHARE_PREFIX + b64url(await pipeBytes(bytes, new window.CompressionStream('deflate-raw'))); } catch (e) {} }
  return SHARE_PREFIX_RAW + b64url(bytes);
}
// Accepts a full share code, a share link, or a topic file's text.
async function decodeShared(text) {
  const raw = (text || '').trim();
  if (!raw) return { ok: false, error: 'Paste a share link or code first.' };
  if (raw.startsWith('{')) {
    try { const f = JSON.parse(raw); return f && f.app === 'draft-night-topic' ? unpackTopic(f.topic) : { ok: false, error: 'That file isn’t a Draft Night topic.' }; } catch (e) { return { ok: false, error: 'That file isn’t a Draft Night topic.' }; }
  }
  if (/^DN-[0-9A-Z]{6}$/i.test(raw)) return { ok: false, error: 'That’s a topic fingerprint, not the topic itself. Ask your friend for the share link, the long share code, or the topic file.' };
  const m = raw.match(/(DN[01]\.[A-Za-z0-9_-]+)/);
  if (!m) return { ok: false, error: 'That doesn’t look like a Draft Night share link or code.' };
  try {
    const code = m[1]; const body = unb64url(code.slice(4));
    const bytes = code.startsWith(SHARE_PREFIX) ? (canCompress() ? await pipeBytes(body, new window.DecompressionStream('deflate-raw')) : null) : body;
    if (!bytes) return { ok: false, error: 'This browser can’t open compressed share codes. Ask for the topic file instead.' };
    return unpackTopic(JSON.parse(new TextDecoder().decode(bytes)));
  } catch (e) { return { ok: false, error: 'That share code is damaged or incomplete. Copy the whole link again.' }; }
}
const shareLink = (code) => location.origin + location.pathname + '#topic=' + code;
const topicFile = (t) => new Blob([JSON.stringify({ app: 'draft-night-topic', format: 1, topic: packTopic(t, true) })], { type: 'application/json' });

/* ---------- who played ---------- */
const nameKey = (n) => (n || '').trim().toLowerCase();
// Human players in a draft, each with the team they played for.
function humanPlayers(d) {
  if (d.teamMode) return d.managers.flatMap((t) => (t.members || []).filter((p) => !p.bot).map((p) => ({ key: nameKey(p.name), name: p.name, emoji: p.emoji, teamId: t.id, teamName: t.name, share: 1 / Math.max(1, (t.members || []).filter((x) => !x.bot).length) })));
  return d.managers.filter((m) => !m.bot).map((m) => ({ key: nameKey(m.name), name: m.name, emoji: m.emoji, teamId: m.id, teamName: m.name, share: 1 }));
}
const finished = (d) => d && d.votesRevealed && d.phase === 'done';

/* ---------- per-game awards ---------- */
// Price gap against the average price paid for the same position in that draft.
// Only positions with at least 2 paid buys count — otherwise there's nothing to compare with.
function priceGaps(d) {
  const buys = [];
  d.managers.forEach((m) => m.team.forEach((t, i) => { if (t && !t.free && !t.stolen) buys.push({ team: m, item: d.items[t.itemId], price: t.price, key: norm(d.items[t.itemId].pos || d.rules.slots[i]) }); }));
  const groups = {}; buys.forEach((b) => { (groups[b.key] = groups[b.key] || []).push(b.price); });
  return buys.filter((b) => groups[b.key].length >= 2).map((b) => {
    const others = groups[b.key].length - 1; const avg = (groups[b.key].reduce((a, x) => a + x, 0) - b.price) / others;
    return { ...b, avg, gap: b.price - avg };
  });
}
function computeAwards(d) {
  const out = [];
  const add = (id, emoji, title, team, why) => out.push({ id, emoji, title, teamId: team.id, team: team.name, why });
  const fair = d.rules.budget / d.rules.slots.length;
  const gaps = priceGaps(d);
  if (gaps.length) {
    const b = gaps.reduce((a, x) => (x.gap < a.gap ? x : a));
    if (b.gap <= -1) add('bargain', '🏷️', 'Best Bargain', b.team, b.item.name + ' for ' + money(b.price) + ', ' + money(Math.round(-b.gap)) + ' under the average paid for other ' + (b.item.pos || 'items') + ' this draft (' + money(Math.round(b.avg)) + ').');
    const o = gaps.reduce((a, x) => (x.gap > a.gap ? x : a));
    if (o.gap >= 2) add('overpay', '💸', 'Biggest Overpay', o.team, o.item.name + ' for ' + money(o.price) + ', ' + money(Math.round(o.gap)) + ' over the average paid for other ' + (o.item.pos || 'items') + ' this draft (' + money(Math.round(o.avg)) + ').');
  }
  const spends = d.managers.map((m) => ({ m, s: d.rules.budget - m.budget }));
  const top = spends.reduce((a, x) => (x.s > a.s ? x : a));
  if (top.s > 0) add('spender', '🤑', 'Big Spender', top.m, 'Spent ' + money(top.s) + ', the most of anyone.');
  if (d.finale && d.finale.champion) {
    const champ = teamOf(d, d.finale.champion);
    if (champ.budget > 0) add('pincher', '🪙', 'Penny Pincher', champ, 'Won the title and still kept ' + money(champ.budget) + '.');
    const games = playedMatchups(d.finale.bracket);
    const last = games[games.length - 1];
    if (last && last.m.winner === champ.id) {
      const lm = last.m; const loser = teamOf(d, lm.winner === lm.a ? lm.b : lm.a);
      const va = Object.values(lm.votes || {}).filter((v) => v === lm.winner).length, vb = Object.values(lm.votes || {}).length - va;
      if (lm.match && lm.match.pens) add('robbed', '😤', 'Most Robbed', loser, 'Lost the final on penalties.');
      else if (lm.match && Math.abs(lm.match.score[0] - lm.match.score[1]) === 1 && d.finale.mode === 'sim') add('robbed', '😤', 'Most Robbed', loser, 'Lost the final by a single goal.');
      else if (d.finale.mode === 'bracket' && va - vb === 1) add('robbed', '😤', 'Most Robbed', loser, 'Lost the final by a single vote.');
    }
    if (isFootball(d.topic)) {
      const giant = games.map(({ m }) => { const w = teamOf(d, m.winner), l = teamOf(d, m.winner === m.a ? m.b : m.a); return { w, l, gap: teamRating(d, l).rating - teamRating(d, w).rating }; }).filter((x) => x.gap >= 3).sort((a, b) => b.gap - a.gap)[0];
      if (giant) add('giant', '🪓', 'Giant Killer', giant.w, 'Knocked out ' + giant.l.name + ', rated ' + giant.gap + ' higher.');
    }
    const boot = goldenBoot(d);
    if (boot) add('boot', '👟', 'Golden Boot', teamOf(d, boot.teamId), boot.player + ' scored ' + boot.goals + ' goal' + (boot.goals === 1 ? '' : 's') + ' in the finale.');
  } else if (d.votesRevealed) {
    const { counts, winners } = tally(d);
    const sorted = Object.values(counts).sort((a, b) => b - a); const median = sorted[Math.floor(sorted.length / 2)] || 0;
    const strong = d.managers.filter((m) => counts[m.id] >= Math.max(1, median));
    if (strong.length) { const p = strong.reduce((a, m) => (m.budget > a.budget ? m : a)); if (p.budget > 0) add('pincher', '🪙', 'Penny Pincher', p, 'Kept ' + money(p.budget) + ' and still got ' + counts[p.id] + ' vote' + (counts[p.id] === 1 ? '' : 's') + '.'); }
    if (winners.length === 1) {
      const best = counts[winners[0].id];
      d.managers.filter((m) => counts[m.id] === best - 1 && best - 1 > 0).forEach((m) => add('robbed', '😤', 'Most Robbed', m, 'Lost the vote by a single vote (' + counts[m.id] + ' to ' + best + ').'));
    }
  }
  const countBy = (fn) => d.managers.map((m) => ({ m, n: fn(m) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const log = d.cardLog || [];
  const chaos = countBy((m) => log.filter((e) => e.by === m.id && e.result === 'done').length);
  if (chaos.length) add('chaos', '🃏', 'Chaos Agent', chaos[0].m, chaos[0].n + ' Chaos Card' + (chaos[0].n === 1 ? '' : 's') + ' played successfully.');
  const trades = d.trade ? d.trade.proposals.filter((t) => t.status === 'accepted') : [];
  const tm = countBy((m) => trades.filter((t) => t.from === m.id || t.to === m.id).length);
  if (tm.length) add('trade', '🤝', 'Trade Master', tm[0].m, tm[0].n + ' trade' + (tm[0].n === 1 ? '' : 's') + ' completed.');
  const mys = countBy((m) => m.team.filter((t) => t && d.items[t.itemId].mystery).length);
  if (mys.length) add('mystery', '❓', 'Mystery Master', mys[0].m, 'Won ' + mys[0].n + ' mystery item' + (mys[0].n === 1 ? '' : 's') + '.');
  const leg = countBy((m) => m.team.filter((t) => t && (d.rarity || {})[t.itemId] === 'legendary').length);
  if (leg.length) add('legend', '★', 'Legend Hunter', leg[0].m, 'Owns ' + leg[0].n + ' Legendary item' + (leg[0].n === 1 ? '' : 's') + '.');
  const unl = countBy((m) => log.filter((e) => e.target === m.id && e.result === 'done').length);
  if (unl.length) add('unlucky', '🌧️', 'Unluckiest Manager', unl[0].m, 'Hit by ' + unl[0].n + ' rival Chaos Card' + (unl[0].n === 1 ? '' : 's') + '.');
  void fair;
  return out;
}
// Funny (not mean) entries for the worst buys of a draft, each with its reason.
function computeShame(d) {
  const out = [];
  const gaps = priceGaps(d).filter((g) => g.gap >= 2).sort((a, b) => b.gap - a.gap);
  if (gaps[0]) out.push({ id: 'overpay', emoji: '💸', title: 'Biggest Overpay', team: gaps[0].team.name, item: gaps[0].item.name, price: gaps[0].price, why: 'Paid ' + money(Math.round(gaps[0].gap)) + ' more than the average for the same position this draft. Bold.' });
  const buys = []; d.managers.forEach((m) => m.team.forEach((t) => { if (t && !t.free) buys.push({ m, item: d.items[t.itemId], price: t.price }); }));
  const disaster = buys.filter((b) => b.price >= d.rules.budget * 0.5).sort((a, b) => b.price - a.price)[0];
  if (disaster) out.push({ id: 'budget', emoji: '🔥', title: 'Budget Disaster', team: disaster.m.name, item: disaster.item.name, price: disaster.price, why: 'Spent ' + Math.round((disaster.price / d.rules.budget) * 100) + '% of the whole budget on one item.' });
  if (d.finale && d.finale.champion) {
    const regret = buys.filter((b) => finaleRecord(d, b.m.id).won === 0 && b.price >= d.rules.budget / d.rules.slots.length).sort((a, b) => b.price - a.price)[0];
    if (regret) out.push({ id: 'regret', emoji: '🙈', title: 'Most Regrettable Buy', team: regret.m.name, item: regret.item.name, price: regret.price, why: 'The priciest item on a team that didn’t win a single matchup.' });
  } else if (d.votesRevealed) {
    const { counts } = tally(d);
    const regret = buys.filter((b) => counts[b.m.id] === 0 && b.price >= d.rules.budget / d.rules.slots.length).sort((a, b) => b.price - a.price)[0];
    if (regret) out.push({ id: 'regret', emoji: '🙈', title: 'Most Regrettable Buy', team: regret.m.name, item: regret.item.name, price: regret.price, why: 'The priciest item on a team that got zero votes.' });
  }
  return out.map((x) => ({ ...x, draftId: d.id, date: d.createdAt, topic: d.topic.name }));
}

/* ---------- career profiles ---------- */
function careerStats(past, settings) {
  const since = (settings && settings.statsResetAt) || 0;
  const games = past.filter((d) => finished(d) && (d.createdAt || 0) >= since).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  // Reference prices: the average price each item sold for across all these drafts.
  const sales = {};
  games.forEach((d) => d.managers.forEach((m) => m.team.forEach((t) => { if (t && !t.free && !t.stolen) (sales[nameKey(d.items[t.itemId].name)] = sales[nameKey(d.items[t.itemId].name)] || []).push(t.price); })));
  const ref = (name) => { const s = sales[nameKey(name)]; return s && s.length >= 2 ? s.reduce((a, b) => a + b, 0) / s.length : null; };
  const P = {};
  games.forEach((d) => {
    const { counts, winners } = tally(d);
    const winIds = winners.map((w) => w.id);
    const awards = computeAwards(d);
    humanPlayers(d).forEach((p) => {
      const r = P[p.key] || (P[p.key] = { key: p.key, name: p.name, emoji: p.emoji, games: 0, wins: 0, teamGames: 0, teamWins: 0, spent: 0, picks: {}, buys: [], awards: {}, best: null, chaos: {}, legendary: 0, trades: 0, cardsUsed: 0, lastAt: 0, titles: 0, matches: 0, matchWins: 0, goals: 0, topRating: null });
      const team = d.managers.find((m) => m.id === p.teamId); if (!team) return;
      r.games++; if (d.teamMode) r.teamGames++;
      const won = winIds.includes(team.id);
      if (won) { r.wins++; if (d.teamMode) r.teamWins++; }
      r.spent += (d.rules.budget - team.budget) * p.share;
      team.team.forEach((t) => {
        if (!t) return; const it = d.items[t.itemId];
        r.picks[it.name] = (r.picks[it.name] || 0) + 1;
        if ((d.rarity || {})[t.itemId] === 'legendary') r.legendary++;
        if (!t.free && !t.stolen) r.buys.push({ name: it.name, price: t.price, date: d.createdAt, topic: d.topic.name });
      });
      (d.cardLog || []).filter((e) => e.by === team.id).forEach((e) => { r.chaos[e.card] = (r.chaos[e.card] || 0) + 1; r.cardsUsed++; });
      r.trades += d.trade ? d.trade.proposals.filter((t) => t.status === 'accepted' && (t.from === team.id || t.to === team.id)).length : 0;
      awards.filter((a) => a.teamId === team.id).forEach((a) => { r.awards[a.title] = (r.awards[a.title] || 0) + 1; });
      if (d.finale && d.finale.champion) {
        const rec = finaleRecord(d, team.id);
        if (won) r.titles++;
        if (needsMatch(d.finale.mode)) { r.matches += rec.played; r.matchWins += rec.won; r.goals += rec.gf; }
        if (won && (!r.best || r.best.votes != null)) r.best = { share: 1, votes: null, how: 'Won the ' + (needsMatch(d.finale.mode) ? 'knockout' : 'bracket') + ' (' + rec.won + ' win' + (rec.won === 1 ? '' : 's') + ')', topic: d.topic.name, date: d.createdAt, team: team.name };
      } else {
        const share = (counts[team.id] || 0) / Math.max(1, Object.keys(d.votes || {}).length);
        if (won && (!r.best || (r.best.votes != null && share > r.best.share))) r.best = { share, votes: counts[team.id], topic: d.topic.name, date: d.createdAt, team: team.name };
      }
      if (isFootball(d.topic)) { const tr = teamRating(d, team).rating; if (r.topRating == null || tr > r.topRating.rating) r.topRating = { rating: tr, team: team.name, topic: d.topic.name }; }
      if ((d.createdAt || 0) >= r.lastAt) { r.lastAt = d.createdAt || 0; r.name = p.name; r.emoji = p.emoji || r.emoji; }
    });
  });
  return Object.values(P).map((r) => {
    const valued = r.buys.map((b) => { const avg = ref(b.name); return avg == null ? null : { ...b, avg, gap: b.price - avg }; }).filter(Boolean);
    const bargain = valued.length ? valued.reduce((a, x) => (x.gap < a.gap ? x : a)) : null;
    const overpay = valued.length ? valued.reduce((a, x) => (x.gap > a.gap ? x : a)) : null;
    const fav = Object.entries(r.picks).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topCard = Object.entries(r.chaos).sort((a, b) => b[1] - a[1])[0];
    const custom = (settings && settings.profiles && settings.profiles[r.key]) || {};
    return { ...r, name: custom.name || r.name, emoji: custom.emoji || r.emoji || '🙂', winRate: r.games ? r.wins / r.games : 0, spent: Math.round(r.spent * 10) / 10,
      bargain: bargain && bargain.gap < 0 ? bargain : null, overpay: overpay && overpay.gap > 0 ? overpay : null, favourites: fav, topCard: topCard ? topCard[0] : null };
  }).sort((a, b) => b.wins - a.wins || b.games - a.games || a.name.localeCompare(b.name));
}
// All-time Hall of Shame: the worst moments across saved drafts.
function hallOfShame(past, settings) {
  const since = (settings && settings.statsResetAt) || 0;
  return past.filter((d) => finished(d) && (d.createdAt || 0) >= since).flatMap(computeShame).sort((a, b) => b.price - a.price).slice(0, 12);
}
