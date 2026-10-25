/* ============================================================
   BASEBALL screen (rules in 29-baseball.js). A top-down diamond with
   the defence, the batter and the runners. Big at-bats are played
   out pitch by pitch (balls, strikes, fouls), then the ball off the
   bat — home runs over the fence, gappers, grounders into double
   plays, sac flies — with runners circling the bases. Other at-bats
   roll by, so the line score always matches the recorded game.
   ============================================================ */
const DM = { home: { x: 50, y: 62 }, b1: { x: 65, y: 47 }, b2: { x: 50, y: 32 }, b3: { x: 35, y: 47 }, mound: { x: 50, y: 48.5 } };
const DM_BASES = [DM.home, DM.b1, DM.b2, DM.b3, DM.home];
const DM_FIELD = [{ x: 50, y: 48.5 }, { x: 50, y: 66 }, { x: 66, y: 43 }, { x: 58, y: 35 }, { x: 42, y: 35 }, { x: 34, y: 43 }, { x: 27, y: 22 }, { x: 50, y: 14 }, { x: 73, y: 22 }];
const lerpD = (a, b, u) => ({ x: a.x + (b.x - a.x) * Math.max(0, Math.min(1, u)), y: a.y + (b.y - a.y) * Math.max(0, Math.min(1, u)) });
// A point along the base paths: 0 = home, 1 = first, … 4 = home again.
const basePath = (f) => { const i = Math.max(0, Math.min(3, Math.floor(f))); return lerpD(DM_BASES[i], DM_BASES[i + 1], f - i); };
const PA_KINDS = ['k', 'bb', 'hbp', '1b', '2b', '3b', 'hr', 'out', 'dp', 'err'];
function mlbScript(match) {
  const beats = []; let t = 0;
  const add = (b) => { b.t0 = t; t += b.dur; beats.push(b); return b; };
  add({ type: 'intro', dur: 2.4 });
  let roll = []; let lastHalf = null;
  const flush = () => { if (!roll.length) return; add({ type: 'roll', dur: Math.min(2.2, 0.5 + roll.length * 0.14), evs: roll }); roll = []; };
  match.plays.forEach((e) => {
    const hk = e.inn + ':' + e.half;
    if (hk !== lastHalf && e.kind !== 'side') { flush(); add({ type: 'half', dur: 1.6, e }); lastHalf = hk; }
    if (e.kind === 'side') { flush(); add({ type: 'side', dur: 1.4, e }); return; }
    if (e.hl && PA_KINDS.includes(e.kind)) { flush(); const n = Math.min(6, (e.pitches || 'X').length); add({ type: 'pa', dur: 0.6 + n * 0.5 + (['k', 'bb', 'hbp'].includes(e.kind) ? 1.2 : 2.6), e }); }
    else if (e.hl) { flush(); add({ type: 'note', dur: 2, e }); }
    else roll.push(e);
  });
  flush();
  add({ type: 'final', dur: 2.8 });
  return { beats, total: t };
}
// The pitch sequence actually shown (long at-bats keep their last six pitches).
const shownPitches = (e) => { const p = e.pitches || 'X'; return p.length > 6 ? p.slice(-6) : p; };
function countAt(e, n) { let b = 0, s = 0; const all = e.pitches || ''; const skip = all.length - shownPitches(e).length; for (let i = 0; i < skip + n && i < all.length; i++) { const c = all[i]; if (c === 'B') b++; else if (c === 'C' || c === 'S') s++; else if (c === 'F' && s < 2) s++; } return [Math.min(3, b), Math.min(2, s)]; }
function mlbFrame(beat, u) {
  const out = { F: DM_FIELD.map((p) => ({ ...p })), ball: null, banner: null, runners: [], batter: null, count: null };
  if (beat.type !== 'pa') return out;
  const e = beat.e; const ps = shownPitches(e); const n = ps.length;
  const k = (a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));
  const t0 = 0.6, per = 0.5; const pi = Math.min(n - 1, Math.floor((u - t0) / per));
  out.count = countAt(e, Math.max(0, Math.min(n, Math.floor((u - t0) / per))));
  // Runners on base before the play.
  const before = e.basesBefore || [null, null, null];
  const after = e.bases || [null, null, null];
  const endBase = (name) => { const i = after.indexOf(name); return i >= 0 ? i + 1 : 4; };
  const playT = t0 + n * per; const runK = easeC(k(playT + 0.3, playT + 1.9));
  before.forEach((name, i) => { if (!name) return; const tgt = e.kind === 'k' || (e.kind === 'out' && !e.sac && !e.runs && after.includes(name) && after.indexOf(name) === i) ? i + 1 : (e.kind === 'dp' && i === 0 && !after.includes(name) ? 1.6 : endBase(name)); out.runners.push({ name, p: basePath(i + 1 + (tgt - (i + 1)) * runK), out: e.kind === 'dp' && i === 0 && runK > 0.6 }); });
  if (u < playT) {
    const f = (u - t0) / per; const kk = f - Math.floor(f);
    if (u > t0 && kk < 0.7) out.ball = { ...lerpD(DM.mound, DM.home, kk / 0.7), h: 0.6 };
    out.batter = { name: e.b, p: { x: 47.5, y: 62 }, swing: ps[pi] === 'S' || ps[pi] === 'F' || ps[pi] === 'X' ? kk > 0.6 : false };
    if (ps[pi] === 'F' && kk > 0.7) out.ball = { ...lerpD(DM.home, { x: 30 + unit('foul', e.i, pi) * 40, y: 72 }, (kk - 0.7) / 0.3), h: 2 };
    return out;
  }
  const last = ps[n - 1];
  if (e.kind === 'k') { out.banner = last === 'S' ? 'STRIKE THREE!' : 'STRUCK OUT LOOKING'; out.batter = { name: e.b, p: { x: 47.5, y: 62 } }; out.count = [countAt(e, n)[0], 3]; return out; }
  if (e.kind === 'bb' || e.kind === 'hbp') { out.banner = e.kind === 'bb' ? 'WALK' : 'HIT BY PITCH'; out.batter = { name: e.b, p: lerpD(DM.home, DM.b1, k(playT, playT + 1)) }; out.count = [4, countAt(e, n)[1]]; return out; }
  // Ball in play: where does it go?
  const ang = (unit('spray', e.i) - 0.5) * 1.5; // radians left/right of straight away
  const dist = e.kind === 'hr' ? 62 : e.kind === '3b' ? 46 : e.kind === '2b' ? 42 : e.kind === '1b' ? 26 + unit('d1', e.i) * 8 : e.type === 'gb' || e.kind === 'dp' || e.kind === 'err' ? 20 : e.type === 'pu' ? 14 : e.type === 'ld' ? 30 : 40;
  const land = { x: DM.home.x + Math.sin(ang) * dist, y: DM.home.y - Math.cos(ang) * dist };
  const fk = k(playT, playT + (e.kind === 'hr' ? 1.5 : 1.0));
  const high = e.kind === 'hr' ? 16 : e.type === 'fb' || e.type === 'pu' ? 10 : e.type === 'ld' || e.kind === '2b' || e.kind === '3b' ? 3 : 0.5;
  out.ball = { ...lerpD(DM.home, land, fk), h: Math.sin(fk * Math.PI) * high };
  // The nearest fielder chases it.
  const fi = out.F.reduce((b, p, i) => (i > 1 && Math.hypot(p.x - land.x, p.y - land.y) < Math.hypot(out.F[b].x - land.x, out.F[b].y - land.y) ? i : b), 2);
  if (e.kind !== 'hr') out.F[fi] = lerpD(out.F[fi], land, fk * (['1b', '2b', '3b'].includes(e.kind) ? 0.8 : 1));
  if (fk >= 1 && e.kind !== 'hr' && !['1b', '2b', '3b'].includes(e.kind)) out.ball = { ...out.F[fi], h: 0.5 };
  const bb2 = e.kind === 'hr' ? 4 : e.kind === '3b' ? 3 : e.kind === '2b' ? 2 : e.kind === '1b' || e.kind === 'err' ? 1 : 0.45;
  out.batter = { name: e.b, p: basePath(bb2 * runK), out: bb2 < 1 && runK > 0.8 };
  if (fk > 0.5) out.banner = e.walkoff && u > playT + 1.3 ? 'WALK-OFF!' : e.kind === 'hr' ? (e.runs === 4 ? 'GRAND SLAM!' : 'HOME RUN!') : e.kind === '3b' ? 'TRIPLE!' : e.kind === '2b' ? 'DOUBLE!' : e.kind === '1b' ? 'BASE HIT' : e.kind === 'dp' ? 'DOUBLE PLAY!' : e.kind === 'err' ? 'ERROR!' : e.sac ? 'SAC FLY' : /Diving/.test(e.text || '') ? 'DIVING CATCH!' : 'OUT';
  return out;
}

function DiamondView({ d, A, B, match, speed, onDone, label }) {
  const script = useMemo(() => mlbScript(match), [match]);
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
  useEffect(() => { if (done && !fired.current) { fired.current = true; audio.play('cheer'); onDone && onDone(); } }, [done]);
  const bi = Math.max(0, script.beats.findIndex((b) => t < b.t0 + b.dur));
  const beat = done ? script.beats[script.beats.length - 1] : script.beats[bi];
  const u = done ? beat.dur : t - beat.t0;
  const fr = mlbFrame(beat, u);
  const evNow = beat.type === 'pa' || beat.type === 'note' || beat.type === 'half' || beat.type === 'side' ? beat.e : beat.type === 'roll' ? beat.evs[Math.min(beat.evs.length - 1, Math.floor((u / beat.dur) * beat.evs.length))] : null;
  const prev = (e) => { const p = match.plays[e.i - 1]; return p ? p.score : [0, 0]; };
  const resolved = beat.type !== 'pa' || u > beat.dur - 1.4;
  const score = done || beat.type === 'final' ? match.score : evNow ? (resolved ? evNow.score : prev(evNow)) : [0, 0];
  const outs = evNow ? (beat.type === 'half' ? 0 : resolved ? evNow.outs || 0 : evNow.outsBefore || 0) : 0;
  const bases = evNow ? (beat.type === 'half' ? [null, null, null] : resolved ? evNow.bases || [null, null, null] : evNow.basesBefore || [null, null, null]) : [null, null, null];
  const status = done || beat.type === 'final' ? 'FINAL' + (match.innings > 9 ? '/' + match.innings : '') : beat.type === 'intro' ? 'PLAY BALL' : evNow ? (evNow.half === 0 ? '▲' : '▼') + ' ' + evNow.inn + ordinalSuffix(evNow.inn) : '';
  const batting = evNow ? evNow.half : 0;
  const colors = [A.color, B.color];
  const short = (n) => { if (/^Lineup hitter|^Bullpen|^Starter/.test(String(n || ''))) return ''; const w = String(n || '').split(' '); return w[w.length - 1].slice(0, 10); };
  const banner = done ? null : beat.type === 'intro' ? 'PLAY BALL!' : beat.type === 'half' ? (beat.e.half === 0 ? 'TOP ' : 'BOTTOM ') + beat.e.inn + ordinalSuffix(beat.e.inn).toUpperCase() : beat.type === 'final' ? 'FINAL' : beat.type === 'note' ? (beat.e.kind === 'sb' ? 'STOLEN BASE!' : beat.e.kind === 'cs' ? 'CAUGHT STEALING' : beat.e.kind === 'pchange' ? 'PITCHING CHANGE' : null) : fr.banner;
  const lastBeat = useRef(-1);
  useEffect(() => { if (!playing || done || bi === lastBeat.current) return; lastBeat.current = bi; if (beat.type === 'half') audio.play('whistle'); }, [bi]);
  const said = useRef({});
  useEffect(() => { if (!playing || done || beat.type !== 'pa' || said.current[bi] || u < beat.dur - 1.6) return; said.current[bi] = true; const e = beat.e; if (e.kind === 'hr') { audio.play('cheer'); audio.say((e.walkoff ? 'Walk-off! ' : '') + e.b + ', home run!', 2, d.id + ':' + label + ':hr' + bi); } else if (e.kind === 'k') audio.play('card'); else if (['1b', '2b', '3b'].includes(e.kind)) audio.play('bid'); else if (e.kind === 'dp') audio.play('buzzer'); }, [t]);
  const feed = [];
  script.beats.forEach((b, k2) => {
    if (!done && b.t0 + b.dur * 0.8 > t) return;
    if (b.type === 'pa' || b.type === 'note') feed.push({ k: k2, tag: (b.e.half === 0 ? '▲' : '▼') + b.e.inn, team: b.e.s, big: b.e.kind === 'hr' || b.e.walkoff, text: b.e.text });
    else if (b.type === 'side' && b.e.text) feed.push({ k: k2, tag: (b.e.half === 0 ? '▲' : '▼') + b.e.inn, text: b.e.text, half: true });
  });
  const feedRef = useRef(null);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [feed.length]);
  const L = match.lineups;
  return (
    <div className="matchview diamondview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid"><span className="sb-score num" aria-live="polite">{score[0]}–{score[1]}</span><span className="sb-clock num">{status}</span></div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      <div className="boutbar small">
        <span className="muted">Outs</span> <b className="outs">{[0, 1, 2].map((i) => <i key={i} className={i < outs ? 'on' : ''} />)}</b>
        {fr.count && <span className="muted"> · Count <b className="num">{fr.count[0]}–{fr.count[1]}</b></span>}
        {beat.type === 'pa' && <span className="boutstats">🧢 {beat.e.b} vs ⚾ {beat.e.p}</span>}
      </div>
      <div className="pitchwrap">
        <svg className="pitchsvg diamondsvg" viewBox="0 0 100 72" role="img" aria-label={'Baseball: ' + A.name + ' ' + score[0] + ', ' + B.name + ' ' + score[1] + ', ' + status + ', ' + outs + ' out'}>
          <rect x="0" y="0" width="100" height="72" fill="#1f5a26" />
          <path d={'M50 62 L' + (50 - 52 * Math.sin(0.79)) + ' ' + (62 - 52 * Math.cos(0.79)) + ' A52 52 0 0 1 ' + (50 + 52 * Math.sin(0.79)) + ' ' + (62 - 52 * Math.cos(0.79)) + ' Z'} fill="#3f8d38" />
          <path d={'M' + (50 - 52 * Math.sin(0.79)) + ' ' + (62 - 52 * Math.cos(0.79)) + ' A52 52 0 0 1 ' + (50 + 52 * Math.sin(0.79)) + ' ' + (62 - 52 * Math.cos(0.79))} fill="none" stroke="#f2c14e" strokeWidth="0.8" />
          <path d="M50 66 L68 47 L50 28.5 L32 47 Z" fill="#c9905a" />
          <path d="M50 62 L62.5 49.5 L50 37 L37.5 49.5 Z" fill="#3f8d38" />
          <circle cx={DM.mound.x} cy={DM.mound.y} r="2" fill="#c9905a" />
          <line x1="50" y1="62" x2="10" y2="22" stroke="#fff" strokeWidth="0.3" /><line x1="50" y1="62" x2="90" y2="22" stroke="#fff" strokeWidth="0.3" />
          {[DM.b1, DM.b2, DM.b3].map((p, i) => <rect key={i} x={p.x - 1} y={p.y - 1} width="2" height="2" fill={bases[i] ? '#ffd23d' : '#fff'} transform={'rotate(45 ' + p.x + ' ' + p.y + ')'} />)}
          <path d="M48.8 61.6 L51.2 61.6 L51.2 62.6 L50 63.6 L48.8 62.6 Z" fill="#fff" />
          {beat.type !== 'intro' && fr.F.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.25" fill={colors[1 - batting]} stroke="rgba(0,0,0,.5)" strokeWidth="0.25" />)}
          {beat.type === 'pa' && <text x={DM.mound.x} y={DM.mound.y - 2} textAnchor="middle" fontSize="1.9" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{short(beat.e.p)}</text>}
          {beat.type !== 'pa' && bases.map((n, i) => (n ? <g key={'b' + i}><circle cx={DM_BASES[i + 1].x} cy={DM_BASES[i + 1].y - 1.6} r="1.2" fill={colors[batting]} stroke="#fff" strokeWidth="0.3" />{short(n) && <text x={DM_BASES[i + 1].x} y={DM_BASES[i + 1].y - 3.4} textAnchor="middle" fontSize="1.8" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{short(n)}</text>}</g> : null))}
          {fr.runners.map((r) => <g key={r.name} transform={'translate(' + r.p.x.toFixed(2) + ' ' + (r.p.y - 1.6).toFixed(2) + ')'} opacity={r.out ? 0.4 : 1}><circle r="1.2" fill={colors[batting]} stroke="#fff" strokeWidth="0.3" />{short(r.name) && <text y="-1.8" textAnchor="middle" fontSize="1.8" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{short(r.name)}</text>}</g>)}
          {fr.batter && <g transform={'translate(' + fr.batter.p.x.toFixed(2) + ' ' + fr.batter.p.y.toFixed(2) + ')'} opacity={fr.batter.out ? 0.45 : 1}><circle r="1.35" fill={colors[batting]} stroke="#fff" strokeWidth="0.4" /><line x1="0.6" y1="-0.4" x2={fr.batter.swing ? 3.4 : 1.2} y2={fr.batter.swing ? -0.6 : -3} stroke="#d9b98a" strokeWidth="0.55" strokeLinecap="round" /><text y="3.4" textAnchor="middle" fontSize="1.9" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{short(fr.batter.name)}</text></g>}
          {fr.ball && <g><ellipse cx={fr.ball.x} cy={fr.ball.y + 0.3} rx="0.5" ry="0.28" fill="rgba(0,0,0,.3)" /><circle cx={fr.ball.x} cy={fr.ball.y - (fr.ball.h || 0) * 0.45} r={0.5 + (fr.ball.h || 0) * 0.035} fill="#fff" stroke="#c0272d" strokeWidth="0.12" /></g>}
          {(done || beat.type === 'final') && <g><rect x="0" y="0" width="100" height="72" fill="rgba(15,12,33,.6)" /><text x="50" y="28" textAnchor="middle" fontSize="7" fontWeight="900" fill={colors[match.winner]} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke">{(match.winner === 0 ? A : B).name.toUpperCase().slice(0, 16)} WIN</text><text x="50" y="37" textAnchor="middle" fontSize="5" fontWeight="900" fill="#ffc83d">{match.score[0]}–{match.score[1]}{match.walkoff ? ' · walk-off' : ''}</text></g>}
          {banner && <text x="50" y="9" textAnchor="middle" fontSize={banner.length > 14 ? 5 : 6.5} fontWeight="900" fill={/HOME RUN|SLAM|WALK-OFF|TRIPLE|DOUBLE|STRIKE|DIVING|STOLEN/.test(banner) ? '#ffc83d' : '#fff'} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke" className="pbanner">{banner}</text>}
        </svg>
      </div>
      <div className="mctrl" role="group" aria-label="Game controls">
        {!done && <button className="btn btn-sm" onClick={() => setPlaying((x) => !x)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸ Pause' : '▶ Play'}</button>}
        {!done && [1, 2, 4].map((x) => <button key={x} className={'btn btn-sm' + (mult === x ? ' btn-gold' : '')} aria-pressed={mult === x} onClick={() => setMult(x)}>{x}×</button>)}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => setT(script.total)}>Skip to result</button>}
        {done && <button className="btn btn-sm" onClick={() => { fired.current = true; said.current = {}; setT(0); setPlaying(true); }}>↺ Watch again</button>}
      </div>
      <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map((e) => <p key={e.k} className={'mev ' + (e.big ? 'goal' : e.half ? 'half' : '') + (e.team != null ? ' t' + e.team : '')}><span className="mm num">{e.tag}</span><span>{e.big ? '⚾ ' : ''}{e.text}</span></p>)}
      </div>
      {done && <MLBSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}
function mlbReport(d, A, B, match) {
  const T = [A, B];
  const rows = [0, 1].flatMap((s) => Object.entries(match.box[s]).map(([name, b]) => ({ team: s, name, ...b, gs: b.h * 2 + b.hr * 4 + b.rbi * 2 + b.r + b.bb + b.sb * 1.5 + b.pk * 1.2 - b.ph * 0.8 - b.pbb * 0.6 + (b.pc ? b.pc / 15 : 0) })));
  const real = rows.filter((r) => !/^Lineup hitter|^Bullpen|^Starter/.test(r.name));
  const mvp = real.filter((r) => r.team === match.winner).sort((x, y) => y.gs - x.gs)[0] || null;
  const price = (s, name) => { const e = T[s].team.find((x) => x && d.items[x.itemId] && d.items[x.itemId].name === name); return e ? e.price || 0 : 0; };
  const wp = real.map((r) => ({ ...r, price: price(r.team, r.name) }));
  const best = wp.filter((r) => r.gs > 3 && r.price > 0).sort((x, y) => y.gs / y.price - x.gs / x.price)[0] || null;
  const flop = wp.filter((r) => r.price >= 3).sort((x, y) => x.gs / x.price - y.gs / y.price)[0] || null;
  let lead = 0, gw = null; match.plays.forEach((e) => { const l = Math.sign(e.score[0] - e.score[1]); if (l !== lead) { if (l === (match.winner === 0 ? 1 : -1)) gw = e; lead = l; } });
  return { rows: real, mvp, best, flop, gw };
}
const mlbStat = (r) => [r.ab || r.h ? r.h + '-for-' + r.ab : '', r.hr ? r.hr + ' HR' : '', r.rbi ? r.rbi + ' RBI' : '', r.bb ? r.bb + ' BB' : '', r.sb ? r.sb + ' SB' : '', r.pc ? r.pk + ' K, ' + r.ph + ' H, ' + r.pbb + ' BB, ' + r.pc + ' pitches' : ''].filter(Boolean).join(', ');
function MLBSummary({ d, A, B, match }) {
  const R = mlbReport(d, A, B, match); const T = (i) => (i === 0 ? A : B);
  const n = Math.max(match.line[0].length, match.line[1].length);
  return (
    <div className="board msummary">
      <h3>⚾ Line score</h3>
      <table className="qtable small"><thead><tr><th></th>{Array.from({ length: n }, (_, i) => <th key={i}>{i + 1}</th>)}<th>R</th><th>H</th></tr></thead><tbody>{[0, 1].map((s) => <tr key={s}><td>{T(s).name}</td>{Array.from({ length: n }, (_, i) => <td key={i} className="num">{match.line[s][i] != null ? match.line[s][i] : ''}</td>)}<td className="num"><b>{match.score[s]}</b></td><td className="num">{match.hits[s]}</td></tr>)}</tbody></table>
      {[0, 1].map((s) => <p key={s} className="small" style={{ margin: 0 }}><b>{T(s).name}:</b> {R.rows.filter((r) => r.team === s).map((r) => r.name + ' ' + mlbStat(r)).join(' · ')}</p>)}
      <div className="mreport">
        <h4>📋 Game report</h4>
        {R.mvp && <p className="small"><b>⭐ Player of the game:</b> {R.mvp.name} ({T(R.mvp.team).name}) — {mlbStat(R.mvp)}.</p>}
        {R.gw && <p className="small"><b>🔄 Go-ahead moment:</b> {R.gw.half === 0 ? 'top' : 'bottom'} of the {R.gw.inn}{ordinalSuffix(R.gw.inn)}: {R.gw.text}</p>}
        {R.best && R.best !== R.mvp && <p className="small"><b>💰 Best buy:</b> {R.best.name} — ${R.best.price}: {mlbStat(R.best)}.</p>}
        {R.flop && <p className="small"><b>📉 Quiet day:</b> {R.flop.name} cost ${R.flop.price}: {mlbStat(R.flop) || 'barely got involved'}.</p>}
      </div>
      <p className="hint" style={{ margin: 0 }}>Every pitch simulated from Draft Night’s estimated {eraWord(d.topic)} numbers (not official ratings). Your hitters bat at the top of the order; the rest of the lineup and bullpen are average players.</p>
    </div>
  );
}
function MLBChip({ item, topic }) {
  const [open, setOpen] = useState(false);
  if (!numbersShown()) return null;
  const r = mlbRating(item); const era = eraWord(topic);
  const keys = (r.pitcher && !r.two ? MLB_ATTRS.P : r.two ? [...MLB_ATTRS.H, ...MLB_ATTRS.P] : MLB_ATTRS.H);
  return (
    <>
      <button type="button" className="ratingchip" onClick={() => setOpen(true)} aria-label={era + ' ' + r.ovr + ', estimated. Show details'}>{era} <b className="num">{r.ovr}</b> est.</button>
      {open && ReactDOM.createPortal(
        <Sheet center onClose={() => setOpen(false)}>
          <div className="ratingcard">
            <div className="rc-top"><span className="rc-ovr num"><small className="rc-era">{era}</small>{r.ovr}</span><span className="rc-role">{r.two ? 'TWO-WAY' : r.pitcher ? (r.reliever ? 'RP' : 'SP') : 'BAT'}</span><span className="rc-name">{item.name}</span></div>
            <div className="rc-attrs">{keys.map((a) => <div key={a} className="rc-attr"><span className="k" title={MLB_ATTR_NAMES[a]}>{a}</span><span className="bar"><i style={{ width: r.attrs[a] + '%' }} /></span><span className="v num">{r.attrs[a]}</span></div>)}</div>
            <p className="hint" style={{ margin: 0 }}>{era === 'Now' ? 'Now: how good they are today. ' : 'Prime: how good they were at their peak. '}{keys.map((a) => a + ' ' + MLB_ATTR_NAMES[a].toLowerCase()).join(' · ')}. Draft Night estimate, not an official rating.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
        </Sheet>, document.body)}
    </>
  );
}
