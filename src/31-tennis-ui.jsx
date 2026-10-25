/* ============================================================
   TENNIS screen (rules in 29-tennis.js). A top-down court with the
   players, a real tennis scoreboard (sets, games, points, who's
   serving) and the big points played out shot by shot: serves, aces,
   rallies, volleys, smashes, lobs, drop shots, errors into the net.
   Points that aren't shown roll through quickly, so the scoreboard
   always matches the recorded match.
   ============================================================ */
const TC = { x0: 11, x1: 89, y0: 10, y1: 46, net: 50, sy0: 14.5, sy1: 41.5 };
const tenPos = (side, x, y) => ({ x: side === 0 ? x : 100 - x, y });
function tennisHighlights(rp) {
  const score = (p) => {
    const f = p.before.flags;
    if (f.mp != null) return 10; if (f.sp != null) return 8; if (f.bp) return 6;
    if (p.before.tb && Math.min(p.before.pts[0], p.before.pts[1]) >= 4) return 5;
    if (p.shots >= 12) return 4;
    if (p.i === 0) return 3;
    if (p.how === 'ace' && p.before.pts[0] + p.before.pts[1] >= 4) return 2;
    if (p.how === 'drop' || p.how === 'lob' || p.how === 'smash' || p.how === 'pass') return 2;
    return 0;
  };
  const cand = rp.map((p) => ({ p, s: score(p) })).filter((x) => x.s > 0);
  cand.sort((a, b) => b.s - a.s || a.p.i - b.p.i);
  const keep = new Set(cand.slice(0, 16).map((x) => x.p.i));
  keep.add(rp.length - 1);
  return keep;
}
function tennisScript(match) {
  const beats = []; let t = 0;
  const add = (b) => { b.t0 = t; t += b.dur; beats.push(b); return b; };
  add({ type: 'intro', dur: 2.6, mi: 0 });
  match.matches.forEach((m, mi) => {
    add({ type: 'walk', dur: 2.6, mi });
    if (m.walkover) { add({ type: 'result', dur: 2.2, mi }); return; }
    const rp = tennisReplay(m); const hl = tennisHighlights(rp);
    let roll = [];
    const flush = () => { if (!roll.length) return; add({ type: 'roll', dur: Math.min(2.4, 0.5 + roll.length * 0.12), mi, from: roll[0], to: roll[roll.length - 1], rp }); roll = []; };
    rp.forEach((p) => {
      if (hl.has(p.i)) { flush(); const n = Math.min(p.shots, 7); add({ type: 'pt', dur: (p.before.flags.bp || p.before.flags.sp != null || p.before.flags.mp != null ? 1.0 : 0.4) + 1.1 + Math.max(1, n) * 0.55 + 1.3, mi, p, rp }); }
      else roll.push(p.i);
      if (p.gameOver) { flush(); if (p.setOver) add({ type: 'set', dur: 2, mi, p, rp }); }
    });
    flush();
    add({ type: 'result', dur: 3.2, mi });
  });
  add({ type: 'final', dur: 2.8, mi: match.matches.length - 1 });
  return { beats, total: t };
}
// Positions for one point at time u.
function tennisFrame(beat, u, m) {
  const doubles = m.doubles;
  const home = (side, k) => tenPos(side, doubles ? (k === 0 ? 7 : 38) : 7, doubles ? (k === 0 ? 34 : 22) : 28);
  const P = [[home(0, 0), home(0, 1)], [home(1, 0), home(1, 1)]];
  const out = { P, ball: null, banner: null, hitter: null };
  if (beat.type !== 'pt') return out;
  const p = beat.p; const srv = p.before.server; const rcv = 1 - srv;
  const flags = p.before.flags;
  const pre = flags.bp || flags.sp != null || flags.mp != null ? 1.0 : 0.4;
  if (u < pre) { out.banner = flags.mp != null ? 'MATCH POINT' : flags.sp != null ? 'SET POINT' : flags.bp ? 'BREAK POINT' : null; }
  const ptsPlayed = p.before.pts[0] + p.before.pts[1];
  const deuce = ptsPlayed % 2 === 0; // deuce court first
  const sY = deuce ? 33 : 23; // server stands this side of the centre mark (for side 0)
  const srvAt = tenPos(srv, 10, srv === 0 ? sY : 56 - sY);
  const rcvAt = tenPos(rcv, 9, srv === 0 ? 56 - sY - 1 : sY + 1);
  P[srv][0] = srvAt; P[rcv][0] = rcvAt;
  if (doubles) { P[srv][1] = tenPos(srv, 41, 56 - srvAt.y); P[rcv][1] = tenPos(rcv, 38, srvAt.y); }
  const box = tenPos(rcv, 38, srv === 0 ? 56 - sY - 2 : sY + 2); // where the serve lands
  const n = p.how === 'ace' || p.how === 'svw' ? 1 : p.how === 'df' ? 0 : Math.max(2, Math.min(7, p.shots));
  const T0 = pre; const TS = 0.75; const TR = 0.55;
  const k0 = u - T0;
  // Hitting sequence: serve, then alternate. Shot i is hit by side (srv if i even).
  const spot = (i, side) => tenPos(side, 14 + unit('tsx', p.i, i) * 22, 13 + unit('tsy', p.i, i) * 30);
  const arcBall = (a, b, k, h) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, h: Math.sin(Math.min(1, k / 0.72) * Math.PI) * h * (k < 0.72 ? 1 : 0.3) + (k >= 0.72 ? Math.sin(((k - 0.72) / 0.28) * Math.PI) * 1.2 : 0) });
  if (k0 < 0) { out.ball = { ...srvAt, h: 1 }; return out; }
  if (p.how === 'df') {
    const tries = Math.floor(k0 / TS); const k = (k0 % TS) / TS;
    if (tries < 2) { const tgt = tries === 0 ? { x: 50, y: box.y } : { x: box.x + (srv === 0 ? 6 : -6), y: box.y }; out.ball = tries === 0 ? { ...arcBall(srvAt, tgt, Math.min(1, k * 1.2), 3), h: Math.max(0, 3 * (1 - k)) } : arcBall(srvAt, tgt, k, 3); out.banner = tries === 0 ? 'FAULT' : null; }
    else { out.ball = { x: box.x, y: box.y, h: 0 }; out.banner = 'DOUBLE FAULT'; }
    return out;
  }
  // Which shot are we on?
  const tAfterServe = k0 - TS;
  if (tAfterServe < 0) {
    const k = k0 / TS; out.ball = arcBall(srvAt, box, k, 3.5); out.hitter = srv;
    if (n === 1 && k > 0.6) out.banner = p.how === 'ace' ? 'ACE!' : null;
    return out;
  }
  if (n === 1) {
    const k = Math.min(1, tAfterServe / 0.6);
    out.ball = { x: box.x + (box.x - srvAt.x) * 0.25 * k, y: box.y + (box.y - srvAt.y) * 0.25 * k, h: 1.5 * (1 - k) };
    P[rcv][0] = { x: rcvAt.x + (box.x - rcvAt.x) * 0.3 * easeC(k), y: rcvAt.y + (box.y - rcvAt.y) * 0.3 * easeC(k) };
    out.banner = p.how === 'ace' ? 'ACE!' : 'SERVICE WINNER';
    return out;
  }
  // Rally shots after the serve: shot j = 1..n-1 (j odd: receiver hits).
  const j = Math.min(n - 1, 1 + Math.floor(tAfterServe / TR));
  const k = Math.min(1, (tAfterServe - (j - 1) * TR) / TR);
  const hitterSide = j % 2 === 1 ? rcv : srv;
  const toSide = 1 - hitterSide;
  const last = j === n - 1;
  const from = j === 1 ? box : spot(j - 1, hitterSide);
  let to = spot(j, toSide);
  const winSide = p.w; const finisher = p.how === 'ue' || p.how === 'forced' ? 1 - winSide : winSide;
  const netShot = p.how === 'volley' || p.how === 'smash';
  if (last) {
    if (p.how === 'ue' || p.how === 'forced') to = rng01(p.i) < 0.5 ? { x: 50, y: from.y + (to.y - from.y) * 0.5 } : tenPos(toSide, 5, to.y);
    else if (p.how === 'drop') to = tenPos(toSide, 44, to.y);
    else if (p.how === 'lob') to = tenPos(toSide, 13, to.y);
    else to = tenPos(toSide, 13 + unit('tw', p.i) * 4, unit('tw2', p.i) < 0.5 ? 12 : 44);
  }
  // Players chase the ball; the hitter of a volley/smash comes in to the net.
  const chase = (side, target, kk) => { const i0 = 0; P[side][i0] = { x: P[side][i0].x + (target.x - P[side][i0].x) * easeC(kk), y: P[side][i0].y + (target.y - P[side][i0].y) * easeC(kk) }; };
  chase(hitterSide, from, 1);
  if (last && netShot) P[hitterSide][0] = tenPos(hitterSide, 41, from.y);
  if (!last) chase(toSide, to, k);
  else if (p.how === 'ue' || p.how === 'forced') chase(toSide, spot(j, toSide), 0.4);
  else chase(toSide, { x: (P[toSide][0].x + to.x) / 2, y: (P[toSide][0].y + to.y) / 2 }, k * 0.8);
  const h = last && p.how === 'lob' ? 9 : last && p.how === 'smash' ? 2 : last && p.how === 'drop' ? 2.2 : 3.2;
  out.ball = last && to.x === 50 ? { x: from.x + (50 - from.x) * k, y: from.y + (to.y - from.y) * k, h: Math.max(0, 2.6 * (1 - k)) } : arcBall(from, to, k, h);
  out.hitter = hitterSide;
  if (last && k > 0.55) out.banner = p.how === 'ue' ? (to.x === 50 ? 'INTO THE NET' : 'LONG!') : p.how === 'forced' ? 'ERROR!' : p.how === 'smash' ? 'SMASH!' : p.how === 'drop' ? 'DROP SHOT!' : p.how === 'lob' ? 'LOB!' : p.how === 'volley' ? 'VOLLEY WINNER' : p.how === 'pass' ? 'PASSING SHOT!' : 'WINNER!';
  if (last && tAfterServe > j * TR + 0.3) {
    if (flags.mp === p.w) out.banner = 'GAME, SET & MATCH';
    else if (flags.sp === p.w) out.banner = 'SET!';
    else if (flags.bp && p.w !== srv) out.banner = 'BREAK!';
    else if (flags.bp) out.banner = 'SAVED!';
  }
  out.rallyN = p.shots;
  return out;
}
const rng01 = (i) => unit('tr', i);

function TennisBoard({ m, st, A, B }) {
  const names = (side) => (side === 0 ? m.a : m.b).map((p) => p.name.split(' ').slice(-1)[0]).join(' / ');
  const P = ['0', '15', '30', '40'];
  const ptLabel = (side) => { if (!st || st.done) return ''; if (st.tb) return st.pts[side]; const a = st.pts[side], b = st.pts[1 - side]; if (a >= 3 && b >= 3) return a > b ? 'AD' : a === b ? '40' : ''; return P[Math.min(3, a)]; };
  const sets = st ? st.sets : [];
  return (
    <table className="tboard small num">
      <tbody>
        {[0, 1].map((side) => (
          <tr key={side}>
            <td className="tb-n"><span className="tc" style={{ background: side === 0 ? A.color : B.color }} /> {names(side)} {st && !st.done && st.server === side ? <span className="tb-srv" aria-label="serving">●</span> : null}</td>
            {sets.map((g, k) => <td key={k} className={g[side] > g[1 - side] ? 'won' : ''}>{g[side]}</td>)}
            {st && !st.done && <td className="cur">{st.games[side]}</td>}
            {st && !st.done && <td className="pt">{ptLabel(side)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TennisView({ d, A, B, match, speed, onDone, label }) {
  const script = useMemo(() => tennisScript(match), [match]);
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
  const m = match.matches[Math.min(match.matches.length - 1, beat.mi)];
  const surf = TEN_SURFACES[match.surface];
  const fr = tennisFrame(beat, u, m);
  // Scoreboard state for this moment.
  const rpOf = useMemo(() => match.matches.map((mm) => (mm.walkover ? [] : tennisReplay(mm))), [match]);
  const rp = rpOf[Math.min(match.matches.length - 1, beat.mi)];
  let st = null;
  if (rp.length) {
    if (beat.type === 'walk' || beat.type === 'intro') st = { ...rp[0].before, done: false };
    else if (beat.type === 'pt') st = u > beat.dur - 1.0 ? { ...beat.p.after } : { ...beat.p.before, done: false };
    else if (beat.type === 'roll') { const k = Math.min(beat.to, beat.from + Math.floor((u / beat.dur) * (beat.to - beat.from + 1))); st = { ...rp[k].after }; }
    else if (beat.type === 'set') st = { ...beat.p.after };
    else st = { ...rp[rp.length - 1].after };
  }
  const decided = (k) => k < beat.mi || (k === beat.mi && beat.type === 'result' && u > 0.6) || beat.type === 'final' || done;
  const tie = [0, 1].map((s) => match.matches.filter((x, k) => decided(k) && x.winner === s).length);
  const status = done || beat.type === 'final' ? 'FINAL' : beat.type === 'intro' ? 'ORDER OF PLAY' : m.decider ? 'DECIDER' : 'MATCH ' + (beat.mi + 1);
  const colors = [A.color, B.color];
  const short = (n) => n.split(' ').slice(-1)[0].slice(0, 11);
  const sides = [m.a, m.b];
  const rollBanner = beat.type === 'roll' && u > beat.dur * 0.55 ? (() => { const p = beat.rp[beat.to]; return p.gameOver ? (p.brk ? 'BREAK — ' + short(sides[p.w][0].name).toUpperCase() : 'HOLD') : null; })() : null;
  const banner = done ? null : beat.type === 'intro' ? 'DRAFT CUP' : beat.type === 'walk' ? (m.decider ? 'MIXED DOUBLES DECIDER' : m.label.toUpperCase()) : beat.type === 'set' ? 'SET ' + short(sides[beat.p.w][0].name).toUpperCase() : beat.type === 'result' ? (m.winner != null ? short(sides[m.winner][0].name).toUpperCase() + (m.doubles ? ' & ' + short(sides[m.winner][1].name).toUpperCase() : '') + ' WIN' : null) : beat.type === 'final' ? 'FINAL' : fr.banner || rollBanner;
  // Sounds.
  const lastBeat = useRef(-1);
  useEffect(() => { if (!playing || done || bi === lastBeat.current) return; lastBeat.current = bi; if (beat.type === 'set' || beat.type === 'result') audio.play('cheer'); if (beat.type === 'walk') audio.play('whistle'); }, [bi]);
  const hitRef = useRef(null);
  useEffect(() => { if (!playing || done || beat.type !== 'pt' || !fr.ball) return; const key = bi + ':' + Math.floor((u - 0.4) / 0.55); if (hitRef.current === key) return; hitRef.current = key; audio.play('bid'); }, [t]);
  // Feed.
  const feed = [];
  script.beats.forEach((b, k) => {
    if (!done && b.t0 + Math.min(b.dur * 0.7, 2) > t) return;
    const mm = match.matches[b.mi];
    const nm = (side) => (side === 0 ? mm.a : mm.b).map((p) => p.name).join(' & ');
    if (b.type === 'walk') feed.push({ k, tag: mm.decider ? 'DEC' : 'M' + (b.mi + 1), text: mm.label + ': ' + nm(0) + ' vs ' + nm(1), half: true });
    else if (b.type === 'pt') { const p = b.p; const f = p.before.flags; const who = (side) => (side === 0 ? mm.a : mm.b)[0].name; feed.push({ k, tag: 'S' + p.before.setNo, team: p.w, big: f.mp != null || f.sp != null, text: (f.mp != null ? 'Match point. ' : f.sp != null ? 'Set point. ' : f.bp ? 'Break point. ' : '') + (p.how === 'ace' ? who(p.before.server) + ' fires an ace.' : p.how === 'df' ? who(p.before.server) + ' double faults.' : (p.shots >= 10 ? p.shots + '-shot rally — ' : '') + TEN_HOW_WORD[p.how] + (p.how === 'ue' || p.how === 'forced' ? ' from ' + who(1 - p.w) : ' from ' + who(p.w)) + '.') + (f.bp && p.w !== p.before.server ? ' BREAK!' : f.bp ? ' Saved.' : '') }); }
    else if (b.type === 'set') feed.push({ k, tag: 'SET', text: 'Set to ' + nm(b.p.w) + ': ' + b.p.after.sets.map((g) => g[0] + '–' + g[1]).join(', '), team: b.p.w, big: true });
    else if (b.type === 'result') feed.push({ k, tag: '🏆', text: tenLine(mm), team: mm.winner, big: true });
  });
  const feedRef = useRef(null);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [feed.length]);
  const nextMatch = () => { const nb = script.beats.find((b) => b.type === 'walk' && b.t0 > t + 0.01); setT(nb ? nb.t0 : script.total); };
  return (
    <div className="matchview tennisview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid"><span className="sb-score num" aria-live="polite">{tie[0]}–{tie[1]}</span><span className="sb-clock num">{status}</span></div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      <div className="boutbar small"><b>{m.label}</b> <span className="muted">· {surf.name} · best of 3 sets</span></div>
      {!m.walkover && <TennisBoard m={m} st={st} A={A} B={B} />}
      <div className="pitchwrap">
        <svg className="pitchsvg tennissvg" viewBox="0 0 100 56" role="img" aria-label={'Tennis: ' + m.label + ', ' + status}>
          <rect x="0" y="0" width="100" height="56" fill={surf.out} />
          <rect x={TC.x0} y={TC.y0} width={TC.x1 - TC.x0} height={TC.y1 - TC.y0} fill={surf.court} />
          {match.surface === 'grass' && Array.from({ length: 12 }, (_, i) => <rect key={i} x={TC.x0 + i * 6.5} y={TC.y0} width="3.25" height={TC.y1 - TC.y0} fill="rgba(255,255,255,.05)" />)}
          <g fill="none" stroke="#fff" strokeWidth="0.35">
            <rect x={TC.x0} y={TC.y0} width={TC.x1 - TC.x0} height={TC.y1 - TC.y0} />
            <line x1={TC.x0} y1={TC.sy0} x2={TC.x1} y2={TC.sy0} /><line x1={TC.x0} y1={TC.sy1} x2={TC.x1} y2={TC.sy1} />
            <line x1="29" y1={TC.sy0} x2="29" y2={TC.sy1} /><line x1="71" y1={TC.sy0} x2="71" y2={TC.sy1} />
            <line x1="29" y1="28" x2="71" y2="28" />
            <line x1={TC.x0} y1="28" x2={TC.x0 + 1} y2="28" /><line x1={TC.x1 - 1} y1="28" x2={TC.x1} y2="28" />
          </g>
          <line x1="50" y1={TC.y0 - 2} x2="50" y2={TC.y1 + 2} stroke="#f4f1ea" strokeWidth="0.8" />
          <line x1="50" y1={TC.y0 - 2} x2="50" y2={TC.y1 + 2} stroke="rgba(0,0,0,.35)" strokeWidth="0.25" strokeDasharray="0.5 0.5" />
          {beat.type !== 'intro' && beat.type !== 'final' && [0, 1].map((side) => sides[side].map((pl, k) => { const p = fr.P[side][k]; if (!p || (!m.doubles && k > 0)) return null; return (
            <g key={side + '-' + k} transform={'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ')'}>
              <ellipse cx="0.3" cy="0.6" rx="1.9" ry="1.1" fill="rgba(0,0,0,.25)" />
              <circle r="1.8" fill={colors[side]} stroke={fr.hitter === side ? '#fff' : 'rgba(0,0,0,.5)'} strokeWidth={fr.hitter === side ? 0.5 : 0.3} />
              <text y="-2.5" textAnchor="middle" fontSize="2.1" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{short(pl.name)}</text>
            </g>
          ); }))}
          {fr.ball && <g><ellipse cx={fr.ball.x} cy={fr.ball.y + 0.3} rx="0.6" ry="0.35" fill="rgba(0,0,0,.3)" /><circle cx={fr.ball.x} cy={fr.ball.y - (fr.ball.h || 0) * 0.5} r={0.65 + (fr.ball.h || 0) * 0.03} fill="#e6f54a" stroke="#6b7a12" strokeWidth="0.15" /></g>}
          {beat.type === 'pt' && fr.rallyN >= 8 && <text x="50" y="53.5" textAnchor="middle" fontSize="2.6" fontWeight="800" fill="#fff">{fr.rallyN}-shot rally</text>}
          {(beat.type === 'intro' || beat.type === 'walk') && <g><rect x="0" y="0" width="100" height="56" fill="rgba(15,12,33,.55)" />
            {beat.type === 'intro' && match.matches.map((mm, k) => <text key={k} x="50" y={22 + k * 5} textAnchor="middle" fontSize="2.8" fontWeight="700" fill="#fff">{mm.label}: {mm.a.map((p) => short(p.name)).join('/') || '—'} v {mm.b.map((p) => short(p.name)).join('/') || '—'}</text>)}
            {beat.type === 'walk' && [0, 1].map((side) => <g key={side} transform={'translate(' + (side === 0 ? 25 : 75) + ' 30)'}>{sides[side].map((p, k) => <text key={k} y={k * 5} textAnchor="middle" fontSize="3.6" fontWeight="900" fill={colors[side]} stroke="#0f0c21" strokeWidth="0.5" paintOrder="stroke">{p.name.toUpperCase().slice(0, 18)}</text>)}<text y={sides[side].length * 5} textAnchor="middle" fontSize="2.4" fill="#fff">{numbersShown() ? sides[side].map((p) => 'Prime ' + p.ovr + ' est.').join(' · ') : ''}</text></g>)}
            {beat.type === 'walk' && <text x="50" y="31" textAnchor="middle" fontSize="5" fontWeight="900" fill="#ffc83d">VS</text>}
          </g>}
          {(done || beat.type === 'final') && <g><rect x="0" y="0" width="100" height="56" fill="rgba(15,12,33,.6)" /><text x="50" y="22" textAnchor="middle" fontSize="3.4" fontWeight="800" fill="#fff">DRAFT CUP · {surf.name.toUpperCase()}</text><text x="50" y="32" textAnchor="middle" fontSize="7" fontWeight="900" fill={colors[match.winner]} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke">{(match.winner === 0 ? A : B).name.toUpperCase().slice(0, 16)} WIN</text><text x="50" y="40" textAnchor="middle" fontSize="5" fontWeight="900" fill="#ffc83d">{match.score[0]}–{match.score[1]}</text></g>}
          {banner && <text x="50" y={beat.type === 'walk' ? 15 : 7.5} textAnchor="middle" fontSize={banner.length > 15 ? 4.6 : 6} fontWeight="900" fill={/ACE|BREAK|SET|MATCH|WINNER|SMASH|DROP|LOB|PASSING|WIN/.test(banner) ? '#ffc83d' : '#fff'} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke" className="pbanner">{banner}</text>}
        </svg>
      </div>
      <div className="mctrl" role="group" aria-label="Match controls">
        {!done && <button className="btn btn-sm" onClick={() => setPlaying((x) => !x)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸ Pause' : '▶ Play'}</button>}
        {!done && [1, 2, 4].map((x) => <button key={x} className={'btn btn-sm' + (mult === x ? ' btn-gold' : '')} aria-pressed={mult === x} onClick={() => setMult(x)}>{x}×</button>)}
        {!done && <button className="btn btn-sm btn-ghost" onClick={nextMatch}>Next match</button>}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => setT(script.total)}>Skip to result</button>}
        {done && <button className="btn btn-sm" onClick={() => { fired.current = true; setT(0); setPlaying(true); }}>↺ Watch again</button>}
      </div>
      <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map((e) => <p key={e.k} className={'mev ' + (e.big ? 'goal' : e.half ? 'half' : '') + (e.team != null ? ' t' + e.team : '')}><span className="mm num">{e.tag}</span><span>{e.big ? '🎾 ' : ''}{e.text}</span></p>)}
      </div>
      {done && <TennisSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}
function tenLine(m) {
  const nm = (side) => (side === 0 ? m.a : m.b).map((p) => p.name).join(' & ');
  if (m.walkover) return nm(m.winner) + ' wins by walkover.';
  const sc = m.sets.map((s) => { const w = m.winner; const a = s[w], b = s[1 - w]; return a + '–' + b + (s.length === 4 ? '(' + Math.min(s[2], s[3]) + ')' : ''); }).join(', ');
  return nm(m.winner) + ' beat ' + nm(1 - m.winner) + ' ' + sc + '.';
}
function tennisReport(d, A, B, match) {
  const played = match.matches.filter((m) => !m.walkover);
  const dom = (m) => { const g = [0, 1].map((s) => m.sets.reduce((n, x) => n + x[s], 0)); return g[m.winner] / Math.max(1, g[0] + g[1]); };
  const star = played.slice().sort((x, y) => dom(y) - dom(x))[0] || null;
  const epic = played.slice().sort((x, y) => y.pts.length - x.pts.length)[0] || null;
  const ppl = match.matches.flatMap((m) => [0, 1].map((s) => ({ s, m, ps: s === 0 ? m.a : m.b }))).filter((x) => !x.m.doubles && x.ps.length);
  const best = ppl.filter((x) => x.m.winner === x.s).sort((x, y) => x.ps[0].price - y.ps[0].price)[0] || null;
  const flop = ppl.filter((x) => x.m.winner !== x.s).sort((x, y) => y.ps[0].price - x.ps[0].price)[0] || null;
  return { star, epic, best, flop };
}
function TennisSummary({ d, A, B, match }) {
  const R = tennisReport(d, A, B, match); const T = (i) => (i === 0 ? A : B);
  const nm = (m, side) => (side === 0 ? m.a : m.b).map((p) => p.name).join(' & ');
  return (
    <div className="board msummary">
      <h3>🎾 Tie result</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {match.score[0]}–{match.score[1]} {B.name}</b> · {TEN_SURFACES[match.surface].name}{match.how === 'doubles' ? ' · decided by the mixed doubles' : ''}</p>
      <div className="fightcard">
        {match.matches.map((m, k) => (
          <div key={k} className={'fc-row' + (m.decider ? ' main' : '')}>
            <span className="fc-tag">{m.label}</span>
            <span className="fc-line small">{tenLine(m)}</span>
            {!m.walkover && <span className="fc-stats small muted num">Aces {m.stats[0].aces}–{m.stats[1].aces} · Winners {m.stats[0].winners}–{m.stats[1].winners} · Unforced errors {m.stats[0].ue}–{m.stats[1].ue} · Break points {m.stats[0].bpWon}/{m.stats[0].bp} – {m.stats[1].bpWon}/{m.stats[1].bp}</span>}
          </div>
        ))}
      </div>
      <div className="mreport">
        <h4>📋 Tie report</h4>
        {R.star && <p className="small"><b>⭐ Player of the tie:</b> {nm(R.star, R.star.winner)} ({T(R.star.winner).name}): {tenLine(R.star)}</p>}
        {R.epic && R.epic !== R.star && <p className="small"><b>🔥 Match of the day:</b> {nm(R.epic, 0)} vs {nm(R.epic, 1)}, {R.epic.pts.length} points.</p>}
        {R.best && <p className="small"><b>💰 Best buy:</b> {R.best.ps[0].name} cost ${R.best.ps[0].price} and won.</p>}
        {R.flop && <p className="small"><b>📉 Tough day:</b> {R.flop.ps[0].name} cost ${R.flop.ps[0].price} and lost.</p>}
      </div>
      <p className="hint" style={{ margin: 0 }}>Every point simulated from Draft Night’s estimated Prime numbers (not official ratings). Surface matters: grass helps big servers, clay helps grinders.</p>
    </div>
  );
}
function TenChip({ item, topic }) {
  const [open, setOpen] = useState(false);
  if (!numbersShown()) return null;
  const r = tenRating(item);
  return (
    <>
      <button type="button" className="ratingchip" onClick={() => setOpen(true)} aria-label={'Prime ' + r.ovr + ', estimated. Show details'}>Prime <b className="num">{r.ovr}</b> est.</button>
      {open && ReactDOM.createPortal(
        <Sheet center onClose={() => setOpen(false)}>
          <div className="ratingcard">
            <div className="rc-top"><span className="rc-ovr num"><small className="rc-era">Prime</small>{r.ovr}</span><span className="rc-role">{tenWomen(item) ? 'WTA' : 'ATP'}</span><span className="rc-name">{item.name}{r.surf ? <><br /><small>{r.surf === 'clay' ? 'Clay-court specialist' : 'Grass-court specialist'}</small></> : null}</span></div>
            <div className="rc-attrs">{TEN_ATTRS.map((a) => <div key={a} className="rc-attr"><span className="k" title={TEN_ATTR_NAMES[a]}>{a}</span><span className="bar"><i style={{ width: r.attrs[a] + '%' }} /></span><span className="v num">{r.attrs[a]}</span></div>)}</div>
            <p className="hint" style={{ margin: 0 }}>Prime: how good they were at their peak (for current players, their best so far). SRV serve · RET return · GRD groundstrokes · MOV movement · NET net play · MEN nerve. Draft Night estimate, not an official rating.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
        </Sheet>, document.body)}
    </>
  );
}
