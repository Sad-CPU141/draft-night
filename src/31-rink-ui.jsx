/* ============================================================
   ICE HOCKEY screen (rules in 29-hockey.js). A top-down rink with
   both first units (goalie, two defenders, three forwards). Big
   moments are animated: the rush up the ice, passes, one-timers,
   slap shots, deflections, breakaways, saves, rebounds, posts, big
   hits, penalties and the shootout. Everything else rolls by as
   shifts, so the scoreboard always matches the recorded game.
   ============================================================ */
const RK = { w: 100, h: 42.5, net: [{ x: 5.5, y: 21.25 }, { x: 94.5, y: 21.25 }] };
const lerpR = (a, b, u) => ({ x: a.x + (b.x - a.x) * Math.max(0, Math.min(1, u)), y: a.y + (b.y - a.y) * Math.max(0, Math.min(1, u)) });
const RINK_DUR = { goal: 4.2, save: 3.6, post: 3.2, hit: 2.4, pen: 2.4, pull: 2.2, soshot: 3, sowin: 2.6, ot: 2.2, so: 2.2 };
function rinkScript(match) {
  const beats = []; let t = 0;
  const add = (b) => { b.t0 = t; t += b.dur; beats.push(b); return b; };
  add({ type: 'intro', dur: 2.4 });
  let roll = [];
  const flush = () => { if (!roll.length) return; add({ type: 'shift', dur: Math.min(2.2, 0.5 + roll.length * 0.1), evs: roll }); roll = []; };
  match.plays.forEach((e) => {
    if (e.kind === 'pend') { flush(); add({ type: 'pend', dur: 2.2, e }); return; }
    if (e.hl) { flush(); add({ type: 'ev', dur: RINK_DUR[e.kind] || 2.6, e }); } else roll.push(e);
  });
  flush();
  add({ type: 'final', dur: 2.8 });
  return { beats, total: t };
}
// Team 0 attacks the right net, team 1 the left.
const rflip = (s, p) => (s === 0 ? p : { x: RK.w - p.x, y: p.y });
function rinkFrame(beat, u, L) {
  const homes = (s, mode) => {
    const at = (x, y) => rflip(s, { x, y });
    const att = mode === 'att'; const def2 = mode === 'def';
    return L[s].map((p) => {
      const i = L[s].filter((q) => q.role === p.role).indexOf(p);
      if (p.role === 'G') return at(6.5, 21.25);
      if (p.role === 'D') return att ? at(64, i === 0 ? 12 : 30) : def2 ? at(20, i === 0 ? 15 : 28) : at(34, i === 0 ? 13 : 30);
      return att ? at([80, 76, 84][i % 3], [10, 21, 32][i % 3]) : def2 ? at([28, 18, 26][i % 3], [10, 21, 32][i % 3]) : at(i % 3 === 1 ? 48.5 : 44, [8, 21.25, 34.5][i % 3]);
    });
  };
  const P = [homes(0, 'neutral'), homes(1, 'neutral')];
  const out = { P, puck: { x: 50, y: 21.25 }, banner: null, flash: null, lit: null };
  if (beat.type !== 'ev') return out;
  const e = beat.e; const s = e.s == null ? 0 : e.s; const o = 1 - s;
  const k = (a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));
  const idx = (side, name) => L[side].findIndex((p) => p.name === name);
  if (e.kind === 'ot' || e.kind === 'so') { out.banner = e.kind === 'ot' ? 'OVERTIME' : 'SHOOTOUT'; return out; }
  if (e.kind === 'pen') { out.banner = 'PENALTY'; out.flash = P[o][Math.max(0, idx(o, e.p))]; return out; }
  if (e.kind === 'pull') { const gi = L[s].findIndex((p) => p.role === 'G'); if (gi >= 0) P[s][gi] = lerpR(rflip(s, { x: 6.5, y: 21.25 }), rflip(s, { x: 2, y: 41 }), k(0.2, 1.4)); out.banner = 'EMPTY NET'; return out; }
  if (e.kind === 'sowin') { out.banner = 'SHOOTOUT WIN!'; return out; }
  if (e.kind === 'hit') {
    const hi = Math.max(0, idx(s, e.b)), vi = Math.max(0, idx(o, e.p));
    const wall = rflip(s, { x: 60, y: 1.5 });
    P[o][vi] = lerpR(P[o][vi], wall, k(0, 1.0)); P[s][hi] = lerpR(P[s][hi], { x: wall.x - (s === 0 ? 2 : -2), y: 3.5 }, k(0.2, 1.1));
    out.puck = { ...P[o][vi] }; if (u > 1.1) { out.banner = 'BIG HIT!'; out.flash = wall; }
    return out;
  }
  const net = s === 0 ? RK.net[1] : RK.net[0];
  const att = homes(s, 'att'), dfn = homes(o, 'def');
  if (e.kind === 'soshot') {
    // One shooter, one goalie.
    const si = Math.max(0, idx(s, e.p));
    P[s] = P[s].map((p, i) => (i === si ? lerpR(rflip(s, { x: 50, y: 21.25 }), rflip(s, { x: 86, y: 19 }), k(0.2, 1.9)) : rflip(s, { x: 42 - i, y: 39 })));
    P[o] = P[o].map((p, i) => (L[o][i].role === 'G' ? rflip(s, { x: 93.5 - k(0.8, 1.7) * 2, y: 21.25 + Math.sin(u * 4) * 1.5 }) : rflip(s, { x: 58 + i, y: 3 })));
    out.puck = u < 1.9 ? { ...P[s][si], x: P[s][si].x + (s === 0 ? 1 : -1) } : lerpR(P[s][si], e.scored ? net : { x: net.x - (s === 0 ? 3 : -3), y: net.y + 4 }, k(1.9, 2.3));
    if (u > 2.3) { out.banner = e.scored ? 'SCORES!' : 'SAVED!'; if (e.scored) out.lit = net; }
    return out;
  }
  // A rush: everyone moves into the attacking zone.
  const rushK = easeC(k(0, 1.2));
  P[s] = P[s].map((p, i) => lerpR(p, att[i], rushK)); P[o] = P[o].map((p, i) => lerpR(p, dfn[i], rushK));
  const si = Math.max(0, idx(s, e.p)); const ai = e.a ? idx(s, e.a) : -1;
  const shooter = P[s][si] || P[s][1];
  const passer = ai >= 0 ? P[s][ai] : P[s][(si + 1) % P[s].length];
  if (e.type === 'breakaway') { P[s][si] = lerpR(rflip(s, { x: 45, y: 21 }), rflip(s, { x: 82, y: 19 }), easeC(k(0, 1.8))); }
  const shotT = e.type === 'breakaway' ? 1.8 : 1.7;
  if (u < 1.2) out.puck = { x: passer.x + (s === 0 ? 1 : -1), y: passer.y };
  else if (u < shotT) out.puck = e.type === 'breakaway' ? { x: P[s][si].x + (s === 0 ? 1 : -1), y: P[s][si].y } : lerpR(passer, shooter, k(1.2, shotT));
  else {
    const kk = k(shotT, shotT + 0.32);
    const goal = e.kind === 'goal';
    const target = goal ? { x: net.x + (s === 0 ? 1.2 : -1.2), y: net.y + (unit('pk', e.i) - 0.5) * 2.2 } : e.kind === 'post' ? { x: net.x - (s === 0 ? 0.3 : -0.3), y: net.y + 1.8 } : { x: net.x - (s === 0 ? 1.6 : -1.6), y: net.y + (unit('sv', e.i) - 0.5) * 2 };
    out.puck = lerpR(P[s][si] || shooter, target, kk);
    const gi = L[o].findIndex((p) => p.role === 'G');
    if (gi >= 0 && e.type !== 'empty') P[o][gi] = lerpR(rflip(s, { x: 93.5, y: 21.25 }), { x: target.x - (s === 0 ? 1.4 : -1.4), y: target.y }, k(shotT - 0.1, shotT + 0.3));
    if (gi >= 0 && e.type === 'empty') P[o][gi] = rflip(s, { x: 2, y: 41 });
    if (kk >= 1) {
      if (goal) { out.banner = e.type === 'empty' ? 'EMPTY NET!' : 'GOAL!'; out.lit = net; P[s][si] = lerpR(P[s][si], rflip(s, { x: 70, y: 8 }), k(shotT + 0.6, shotT + 1.6)); }
      else if (e.kind === 'post') { out.banner = 'OFF THE POST!'; out.puck = lerpR(target, { x: target.x - (s === 0 ? 6 : -6), y: target.y + 6 }, k(shotT + 0.32, shotT + 0.9)); }
      else { out.banner = e.big ? 'WHAT A SAVE!' : 'SAVE!'; out.puck = e.how === 'glove' ? { ...P[o][gi] } : lerpR(target, { x: target.x - (s === 0 ? 4 : -4), y: target.y + 3 }, k(shotT + 0.32, shotT + 0.8)); }
    }
  }
  if (u < 1.6 && e.type === 'onetimer') out.banner = null;
  return out;
}

function RinkView({ d, A, B, match, speed, onDone, label }) {
  const script = useMemo(() => rinkScript(match), [match]);
  const base = speed === 'fast' ? 2 : 1;
  const [t, setT] = useState(speed === 'instant' ? script.total : 0);
  const [playing, setPlaying] = useState(speed !== 'instant');
  const [mult, setMult] = useState(1);
  const done = t >= script.total;
  const fired = useRef(false);
  useEffect(() => {
    if (!playing || done) return undefined;
    let raf; let last = performance.now();
    const tick = (now) => { const dt = Math.min(0.1, (now - last) / 1000); last = now; setT((x) => Math.min(script.total, x + dt * base * mult / Math.max(0.001, GAME_SPEED))); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, done, mult, base]);
  useEffect(() => { if (done && !fired.current) { fired.current = true; audio.play('buzzer'); onDone && onDone(); } }, [done]);
  const bi = Math.max(0, script.beats.findIndex((b) => t < b.t0 + b.dur));
  const beat = done ? script.beats[script.beats.length - 1] : script.beats[bi];
  const u = done ? beat.dur : t - beat.t0;
  const L = match.lineups;
  const fr = rinkFrame(beat, u, L);
  const evNow = beat.type === 'ev' ? beat.e : beat.type === 'shift' ? beat.evs[Math.min(beat.evs.length - 1, Math.floor((u / beat.dur) * beat.evs.length))] : beat.type === 'pend' ? beat.e : null;
  const prevScore = (e) => { const p = match.plays[e.i - 1]; return p ? p.score : [0, 0]; };
  const score = done || beat.type === 'final' ? match.score : evNow ? (beat.type === 'ev' && evNow.kind === 'goal' && u < 2.1 ? prevScore(evNow) : evNow.score) : [0, 0];
  const per = evNow ? evNow.per : 1;
  const status = done || beat.type === 'final' ? (match.so ? 'FINAL/SO' : match.ot ? 'FINAL/OT' : 'FINAL') : beat.type === 'intro' ? 'PUCK DROP' : beat.type === 'pend' ? 'END ' + nhlPerName(evNow.per) : per >= 5 ? 'SHOOTOUT' : nhlPerName(per) + ' ' + nhlClock(evNow ? evNow.clk : 1200);
  const shotsNow = [0, 1].map((s) => match.plays.filter((e) => e.i <= (evNow ? evNow.i : -1) && e.s === s && (e.kind === 'goal' || e.kind === 'save') && e.per <= 4).length);
  const colors = [A.color, B.color];
  const short = (n) => { const w = String(n || '').split(' '); return w[w.length - 1].slice(0, 10); };
  const banner = done ? null : beat.type === 'intro' ? 'PUCK DROP' : beat.type === 'pend' ? 'END OF ' + nhlPerName(beat.e.per) : beat.type === 'final' ? 'FINAL' : fr.banner;
  const lastBeat = useRef(-1);
  useEffect(() => { if (!playing || done || bi === lastBeat.current) return; lastBeat.current = bi; if (beat.type === 'pend' || beat.type === 'intro') audio.play('buzzer'); }, [bi]);
  const said = useRef({});
  useEffect(() => { if (!playing || done || beat.type !== 'ev' || said.current[bi] || u < 2.1) return; said.current[bi] = true; const e = beat.e; if (e.kind === 'goal' || (e.kind === 'soshot' && e.scored)) { audio.play('cheer'); if (e.p) audio.say('Goal, ' + e.p + '!', 2, d.id + ':' + label + ':g' + bi); } else if (e.kind === 'save' || e.kind === 'post' || e.kind === 'hit') audio.play('card'); }, [t]);
  const feed = [];
  script.beats.forEach((b, k2) => {
    if (!done && b.t0 + b.dur * 0.7 > t) return;
    if (b.type === 'ev') feed.push({ k: k2, per: b.e.per, clk: b.e.clk, team: b.e.s, big: b.e.big || b.e.kind === 'goal', text: b.e.text });
    else if (b.type === 'pend') feed.push({ k: k2, per: b.e.per, text: b.e.text, half: true });
  });
  const feedRef = useRef(null);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [feed.length]);
  const ppNow = (() => { if (!evNow) return null; let on = null; for (const e of match.plays) { if (e.i > evNow.i) break; if (e.kind === 'pen') on = e.s; if (e.kind === 'ppend' || (e.kind === 'goal' && e.pp) || e.kind === 'pend') on = null; } return on; })();
  return (
    <div className="matchview rinkview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid"><span className="sb-score num" aria-live="polite">{score[0]}–{score[1]}</span><span className="sb-clock num">{status}</span></div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      <div className="boutbar small"><span className="muted">Shots on goal</span> <b className="num">{shotsNow[0]}–{shotsNow[1]}</b>{ppNow != null ? <span className="muted"> · ⚡ {(ppNow === 0 ? A : B).name} power play</span> : null}</div>
      <div className="pitchwrap">
        <svg className="pitchsvg rinksvg" viewBox={'-1 -1 ' + (RK.w + 2) + ' ' + (RK.h + 2)} role="img" aria-label={'Hockey rink: ' + A.name + ' ' + score[0] + ', ' + B.name + ' ' + score[1] + ', ' + status}>
          <rect x="-1" y="-1" width={RK.w + 2} height={RK.h + 2} fill="#1d2b44" />
          <rect x="0" y="0" width={RK.w} height={RK.h} rx="12" fill="#eef4fa" stroke="#9fb0c4" strokeWidth="0.5" />
          <line x1="50" y1="0" x2="50" y2={RK.h} stroke="#e2463b" strokeWidth="0.6" />
          {[35, 65].map((x) => <line key={x} x1={x} y1="0" x2={x} y2={RK.h} stroke="#3d6be2" strokeWidth="0.6" />)}
          {[5.5, 94.5].map((x) => <line key={x} x1={x} y1="1.5" x2={x} y2={RK.h - 1.5} stroke="#e2463b" strokeWidth="0.25" />)}
          <circle cx="50" cy={RK.h / 2} r="7.5" fill="none" stroke="#3d6be2" strokeWidth="0.25" /><circle cx="50" cy={RK.h / 2} r="0.5" fill="#3d6be2" />
          {[[16, 11], [16, 31.5], [84, 11], [84, 31.5]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="7.5" fill="none" stroke="#e2463b" strokeWidth="0.25" /><circle cx={x} cy={y} r="0.6" fill="#e2463b" /></g>)}
          {[0, 1].map((k) => { const n = RK.net[k]; const lit = fr.lit && Math.abs(fr.lit.x - n.x) < 1; return <g key={k}><path d={'M' + n.x + ' ' + (n.y - 3) + ' A3 3 0 0 ' + (k === 0 ? 1 : 0) + ' ' + n.x + ' ' + (n.y + 3)} fill="rgba(110,170,255,.35)" stroke="#e2463b" strokeWidth="0.25" /><rect x={k === 0 ? n.x - 1.8 : n.x} y={n.y - 1.5} width="1.8" height="3" fill={lit ? '#ff3b3b' : '#fff'} stroke="#e2463b" strokeWidth="0.3" />{lit && <circle cx={k === 0 ? n.x - 3 : n.x + 3} cy={n.y - 3.5} r="1" fill="#ff3b3b" />}</g>; })}
          {beat.type !== 'intro' && [0, 1].map((side) => L[side].map((pl, i) => { const p = fr.P[side][i]; if (!p) return null; const g = pl.role === 'G'; return (
            <g key={side + '-' + i} transform={'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ')'}>
              <circle r={g ? 1.8 : 1.5} fill={colors[side]} stroke={g ? '#0f0c21' : 'rgba(0,0,0,.5)'} strokeWidth={g ? 0.5 : 0.25} />
              {g && <rect x="-0.9" y="-0.9" width="1.8" height="1.8" fill="none" stroke="#fff" strokeWidth="0.25" />}
              <text y="-2.2" textAnchor="middle" fontSize="1.9" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.45" paintOrder="stroke">{short(pl.name)}</text>
            </g>
          ); }))}
          <circle cx={fr.puck.x} cy={fr.puck.y} r="0.6" fill="#0f0c21" />
          {fr.flash && <circle cx={fr.flash.x} cy={fr.flash.y} r="3" fill="none" stroke="#ffd23d" strokeWidth="0.5" />}
          {(done || beat.type === 'final') && <g><rect x="-1" y="-1" width={RK.w + 2} height={RK.h + 2} fill="rgba(15,12,33,.55)" /><text x="50" y="16" textAnchor="middle" fontSize="3.4" fontWeight="800" fill="#fff">{status}</text><text x="50" y="25" textAnchor="middle" fontSize="6.5" fontWeight="900" fill={colors[match.winner]} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke">{(match.winner === 0 ? A : B).name.toUpperCase().slice(0, 16)} WIN</text><text x="50" y="33" textAnchor="middle" fontSize="5" fontWeight="900" fill="#ffc83d">{match.score[0]}–{match.score[1]}</text></g>}
          {banner && <text x="50" y="12" textAnchor="middle" fontSize={banner.length > 12 ? 5 : 6.5} fontWeight="900" fill={/GOAL|SAVE|SCORES|HIT|POST|NET|WIN/.test(banner) ? '#ffc83d' : '#fff'} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke" className="pbanner">{banner}</text>}
        </svg>
      </div>
      <div className="mctrl" role="group" aria-label="Game controls">
        {!done && <button className="btn btn-sm" onClick={() => setPlaying((x) => !x)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸ Pause' : '▶ Play'}</button>}
        {!done && [1, 2, 4].map((x) => <button key={x} className={'btn btn-sm' + (mult === x ? ' btn-gold' : '')} aria-pressed={mult === x} onClick={() => setMult(x)}>{x}×</button>)}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => setT(script.total)}>Skip to result</button>}
        {done && <button className="btn btn-sm" onClick={() => { fired.current = true; said.current = {}; setT(0); setPlaying(true); }}>↺ Watch again</button>}
      </div>
      <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map((e) => <p key={e.k} className={'mev ' + (e.big ? 'goal' : e.half ? 'half' : '') + (e.team != null ? ' t' + e.team : '')}><span className="mm num">{nhlPerName(e.per)}</span><span>{e.big ? '🚨 ' : ''}{e.text}{e.team != null ? <small> · {(e.team === 0 ? A : B).name}</small> : null}</span></p>)}
      </div>
      {done && <NHLSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}
function nhlReport(d, A, B, match) {
  const T = [A, B];
  const rows = [0, 1].flatMap((s) => Object.entries(match.box[s]).map(([name, b]) => ({ team: s, name, ...b, role: (match.lineups[s].find((x) => x.name === name) || {}).role, gs: b.g * 3 + b.a * 2 + b.sog * 0.2 + b.hits * 0.2 + b.blk * 0.3 + b.sv * 0.12 - b.ga * 0.6 })));
  const stars = rows.slice().sort((x, y) => y.gs - x.gs || (y.team === match.winner) - (x.team === match.winner)).slice(0, 3);
  const price = (s, name) => { const e = T[s].team.find((x) => x && d.items[x.itemId] && d.items[x.itemId].name === name); return e ? e.price || 0 : 0; };
  const wp = rows.map((r) => ({ ...r, price: price(r.team, r.name) }));
  const best = wp.filter((r) => r.gs > 1 && r.price > 0).sort((x, y) => y.gs / y.price - x.gs / x.price)[0] || null;
  const flop = wp.filter((r) => r.price >= 3 && r.role !== 'G' && r.g + r.a === 0).sort((x, y) => y.price - x.price)[0] || null;
  let lead = 0, gwg = null; match.plays.forEach((e) => { if (e.kind !== 'goal') return; const l = Math.sign(e.score[0] - e.score[1]); if (l !== lead) { if (l === (match.winner === 0 ? 1 : -1)) gwg = e; lead = l; } });
  return { rows, stars, best, flop, gwg };
}
const nhlStat = (r) => (r.role === 'G' ? r.sv + ' saves' + (r.ga ? ', ' + r.ga + ' against' : ', shutout') : r.g + 'G ' + r.a + 'A' + (r.sog ? ', ' + r.sog + ' shots' : '') + (r.hits >= 2 ? ', ' + r.hits + ' hits' : ''));
function NHLSummary({ d, A, B, match }) {
  const R = nhlReport(d, A, B, match); const T = (i) => (i === 0 ? A : B);
  return (
    <div className="board msummary">
      <h3>🏒 Game summary</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {match.score[0]}–{match.score[1]} {B.name}</b>{match.so ? ' · shootout (' + match.so.made[0] + '–' + match.so.made[1] + ')' : match.ot ? ' · overtime' : ''} · shots {match.shots[0]}–{match.shots[1]}</p>
      <table className="qtable small"><thead><tr><th></th>{match.periods.map((_, p) => <th key={p}>{nhlPerName(p + 1)}</th>)}{match.so && <th>SO</th>}<th>T</th></tr></thead><tbody>{[0, 1].map((s) => <tr key={s}><td>{T(s).name}</td>{match.periods.map((pp, p) => <td key={p} className="num">{pp[s]}</td>)}{match.so && <td className="num">{match.so.winner === s ? 1 : 0}</td>}<td className="num"><b>{match.score[s]}</b></td></tr>)}</tbody></table>
      <div className="mreport">
        <h4>⭐⭐⭐ Three stars</h4>
        {R.stars.map((r, k) => <p key={r.name} className="small">{['⭐', '⭐⭐', '⭐⭐⭐'][k]} {r.name} ({T(r.team).name}) — {nhlStat(r)}</p>)}
        {R.gwg && <p className="small"><b>🚨 Winning goal:</b> {R.gwg.p || 'the depth line'}, {nhlPerName(R.gwg.per)} {nhlClock(R.gwg.clk)}{R.gwg.pp ? ' (power play)' : ''}.</p>}
        {R.best && <p className="small"><b>💰 Best buy:</b> {R.best.name} — ${R.best.price}: {nhlStat(R.best)}.</p>}
        {R.flop && <p className="small"><b>📉 Quiet night:</b> {R.flop.name} cost ${R.flop.price} and didn’t get a point.</p>}
      </div>
      <p className="hint" style={{ margin: 0 }}>Simulated shift by shift from Draft Night’s estimated Now numbers (not official ratings). Your six are the first unit; average depth lines play the rest of the game.</p>
    </div>
  );
}
function NHLChip({ item, topic }) {
  const [open, setOpen] = useState(false);
  if (!numbersShown()) return null;
  const r = nhlRating(item, item.pos); const keys = r.role === 'G' ? NHL_ATTRS.G : NHL_ATTRS.S;
  return (
    <>
      <button type="button" className="ratingchip" onClick={() => setOpen(true)} aria-label={'Now ' + r.ovr + ', estimated. Show details'}>Now <b className="num">{r.ovr}</b> est.</button>
      {open && ReactDOM.createPortal(
        <Sheet center onClose={() => setOpen(false)}>
          <div className="ratingcard">
            <div className="rc-top"><span className="rc-ovr num"><small className="rc-era">Now</small>{r.ovr}</span><span className="rc-role">{r.role}</span><span className="rc-name">{item.name}</span></div>
            <div className="rc-attrs">{keys.map((a) => <div key={a} className="rc-attr"><span className="k" title={NHL_ATTR_NAMES[a]}>{a}</span><span className="bar"><i style={{ width: r.attrs[a] + '%' }} /></span><span className="v num">{r.attrs[a]}</span></div>)}</div>
            <p className="hint" style={{ margin: 0 }}>Now: how good they are today. {keys.map((a) => a + ' ' + NHL_ATTR_NAMES[a].toLowerCase()).join(' · ')}. Draft Night estimate, not an official rating.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
        </Sheet>, document.body)}
    </>
  );
}
