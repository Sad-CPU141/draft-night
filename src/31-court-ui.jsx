/* ============================================================
   BASKETBALL screen (rules in 29-basketball.js). A top-down court
   with all ten players. Highlight possessions are animated: the ball
   is brought up, passed around, shot in an arc at the rim (drives,
   dunks, threes, post-ups), blocked, stolen or rebounded. Between
   highlights the score and game clock roll quickly ("runs"), so what
   you see always lands on the recorded final score.
   ============================================================ */
const COURT = { w: 94, h: 50 };
const RIM = [{ x: 5.25, y: 25 }, { x: 88.75, y: 25 }];
// Offence spots attacking the right-hand basket. Guards up top, forwards on the wings, centre on the block.
const HOOP_SPOTS = { G: [{ x: 63, y: 25 }, { x: 71, y: 8 }, { x: 71, y: 42 }], F: [{ x: 72, y: 41 }, { x: 85, y: 45 }, { x: 72, y: 9 }], C: [{ x: 83, y: 18 }, { x: 83, y: 32 }] };
const SHOT_SPOT = { three: (side) => (side > 0.5 ? { x: 88, y: 3.5 } : side > 0.2 ? { x: 66.5, y: 25 } : { x: 70, y: 10 }), mid: () => ({ x: 76, y: 31 }), layup: () => ({ x: 86, y: 27 }), dunk: () => ({ x: 87.5, y: 25 }), post: () => ({ x: 84, y: 21 }) };
const lerpC = (a, b, u) => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
const easeC = (u) => { const v = Math.max(0, Math.min(1, u)); return v * v * (3 - 2 * v); };
function hoopLineup(lineup) {
  const used = { G: 0, F: 0, C: 0 };
  return lineup.map((p) => { const list = HOOP_SPOTS[p.role] || HOOP_SPOTS.F; const s = list[used[p.role]++ % list.length]; return { ...p, spot: s }; });
}
// Team 0 attacks the right basket, team 1 the left (mirrored).
const flipX = (team, p) => (team === 0 ? p : { x: COURT.w - p.x, y: p.y });

function hoopsScript(match) {
  const beats = []; let t = 0;
  const add = (b) => { b.t0 = t; t += b.dur; beats.push(b); return b; };
  add({ type: 'tip', dur: 2.2, score: [0, 0], clock: 720, q: 0 });
  let run = []; let lastScore = [0, 0]; let lastQ = 0;
  const flush = () => {
    if (!run.length) return;
    const s0 = lastScore, s1 = run[run.length - 1].score;
    const d = [s1[0] - s0[0], s1[1] - s0[1]];
    add({ type: 'run', dur: Math.min(3, 1.1 + run.length * 0.14), from: s0, to: s1, run: d, q: run[0].q, c0: run[0].clock, c1: run[run.length - 1].clock, team: d[0] >= d[1] ? 0 : 1 });
    lastScore = s1; run = [];
  };
  match.plays.forEach((p) => {
    if (p.q !== lastQ) { flush(); add({ type: 'qend', dur: 2.4, q: lastQ, score: lastScore }); lastQ = p.q; }
    if (!p.hl) { run.push(p); return; }
    flush();
    const passes = p.a ? 2 : 1;
    const tail = p.kind === 'ft' ? 2.4 : p.kind === 'tov' || p.kind === 'steal' ? 1.8 : 2.2;
    add({ type: 'play', p, dur: 1.1 + passes * 0.62 + 1.0 + tail, passes, from: lastScore, q: p.q, clock: p.clock });
    lastScore = p.score;
  });
  flush();
  add({ type: 'final', dur: 2.6, q: lastQ, score: match.score });
  return { beats, total: t };
}
// Everyone's position (court feet) at time u into one beat.
function hoopsFrame(beat, L, u) {
  const homeOf = (team) => L[team].map((pl) => flipX(team, pl.spot));
  const neutral = () => [0, 1].map((team) => L[team].map((pl, i) => ({ x: COURT.w / 2 + (team === 0 ? -6 : 6) - (i - 2) * 1.5 * (team === 0 ? 1 : -1), y: 8 + i * 8.5 })));
  if (beat.type !== 'play') {
    const pos = beat.type === 'run' ? [0, 1].map((team) => homeOf(team === beat.team ? team : team).map((p, i) => lerpC(p, { x: COURT.w / 2, y: p.y }, 0.35 + 0.1 * Math.sin(u * 2 + i)))) : neutral();
    return { pos, ball: beat.type === 'tip' ? { x: COURT.w / 2, y: 25, h: Math.sin(Math.min(1, u / 1.2) * Math.PI) * 7 } : { x: COURT.w / 2, y: 25, h: 0 }, holder: null };
  }
  const p = beat.p; const O = p.team, D = 1 - O;
  const idx = (team, name) => Math.max(0, L[team].findIndex((x) => x.name === name));
  const off = homeOf(O); const def = off.map((x) => lerpC(x, flipX(O, RIM[1]), 0.28));
  const rim = flipX(O, RIM[1]);
  const si = idx(O, p.p); const pi = p.a ? idx(O, p.a) : (si + 1) % L[O].length;
  const shotAt = flipX(O, (SHOT_SPOT[p.type] || SHOT_SPOT.mid)(unit('spot', p.i)));
  const handler = p.kind === 'steal' || p.kind === 'tov' ? si : pi;
  const T1 = 1.1, TP = 0.62 * beat.passes, T2 = T1 + TP, T3 = T2 + 1.0;
  const pos = [off.map((x) => ({ ...x })), def.map((x) => ({ ...x }))];
  // The defence is the other team's players, matched to the offence spots.
  const offT = O, defT = D;
  const posT = [[], []]; posT[offT] = pos[0]; posT[defT] = L[defT].map((_, i) => ({ ...(def[i] || def[0]) }));
  let ball; let holder = null; let banner = null; let jump = null;
  // 1) bring it up the floor
  if (u < T1) {
    const start = flipX(O, { x: 50, y: 25 });
    const k = easeC(u / T1);
    posT[offT] = off.map((x, i) => lerpC({ x: flipX(O, { x: 47, y: 0 }).x, y: x.y }, x, k));
    posT[offT][handler] = lerpC(start, off[handler], k);
    ball = { ...posT[offT][handler], h: 1.5 + Math.abs(Math.sin(u * 14)) * 1.2 }; holder = { team: offT, i: handler };
    posT[defT] = posT[defT].map((x) => lerpC({ x: flipX(O, { x: 60, y: 0 }).x, y: x.y }, x, k));
  } else if (u < T2) {
    // 2) the pass to the shooter (or the pass that gets stolen)
    const k = easeC((u - T1) / TP);
    if (p.kind === 'steal') {
      const st = idx(defT, p.b); const mid = lerpC(off[si], off[(si + 1) % off.length], 0.5);
      posT[defT][st] = lerpC(posT[defT][st], mid, k);
      ball = { ...lerpC(off[si], mid, k), h: 2 }; if (k > 0.85) banner = 'STEAL!';
    } else {
      ball = { ...lerpC(off[pi], off[si], k), h: 2 + Math.sin(k * Math.PI) * 2 };
      if (k > 0.95) holder = { team: offT, i: si };
    }
  } else if (u < T3) {
    // 3) the move and the shot
    const k = (u - T2) / 1.0;
    if (p.kind === 'steal') {
      const st = idx(defT, p.b); const away = flipX(D, { x: 84, y: 25 });
      const from = lerpC(off[si], off[(si + 1) % off.length], 0.5);
      posT[defT][st] = lerpC(from, away, easeC(k)); ball = { ...posT[defT][st], h: 1.5 + Math.abs(Math.sin(u * 16)) }; holder = { team: defT, i: st }; banner = 'STEAL!';
      posT[offT] = posT[offT].map((x) => lerpC(x, { x: COURT.w / 2, y: x.y }, easeC(k) * 0.6));
    } else if (p.kind === 'tov') {
      ball = { ...lerpC(off[si], { x: off[si].x, y: off[si].y < 25 ? -3 : 53 }, easeC(k)), h: 1 }; banner = 'TURNOVER';
    } else {
      const moveK = easeC(Math.min(1, k / 0.45));
      posT[offT][si] = lerpC(off[si], shotAt, moveK);
      const di = Math.min(posT[defT].length - 1, si);
      posT[defT][di] = lerpC(posT[defT][di], lerpC(shotAt, rim, 0.25), moveK);
      if (p.kind === 'block') { const bi = idx(defT, p.b); posT[defT][bi] = lerpC(posT[defT][bi], lerpC(shotAt, rim, 0.18), easeC(k / 0.6)); }
      const flight = Math.max(0, (k - 0.45) / 0.55);
      if (flight <= 0) { ball = { ...posT[offT][si], h: 1.5 }; holder = { team: offT, i: si }; }
      else if (p.kind === 'block') { const bp = lerpC(shotAt, rim, 0.18); ball = { ...lerpC(shotAt, bp, easeC(flight * 1.6)), h: 4 + flight * 3 }; if (flight > 0.6) { banner = 'BLOCKED!'; ball = { ...lerpC(bp, { x: bp.x + (O === 0 ? -14 : 14), y: bp.y + 10 }, easeC((flight - 0.6) / 0.4)), h: 3 }; } jump = { team: defT, i: idx(defT, p.b) }; }
      else if (p.type === 'dunk') { ball = { ...lerpC(posT[offT][si], rim, easeC(flight)), h: 6 + flight * 3 }; jump = { team: offT, i: si }; }
      else ball = { ...lerpC(shotAt, rim, flight), h: 2 + Math.sin(flight * Math.PI) * (p.type === 'three' ? 11 : 8) + flight * 2 };
    }
  } else {
    // 4) the result
    const k = (u - T3) / Math.max(0.1, beat.dur - T3);
    posT[offT][si] = p.kind === 'steal' || p.kind === 'tov' ? off[si] : shotAt;
    if (p.kind === 'make') { ball = { ...rim, h: Math.max(0, 3 - k * 6) }; banner = p.buzzer ? 'BUZZER BEATER!' : p.andOne ? 'AND ONE!' : p.type === 'three' ? 'THREE!' : p.type === 'dunk' ? 'SLAM DUNK!' : 'BUCKET!'; if (p.type === 'dunk' && k < 0.3) jump = { team: offT, i: si }; }
    else if (p.kind === 'miss') { const ri = Math.max(0, L[defT].findIndex((x) => x.name === p.r)); const rr = lerpC(rim, flipX(O, { x: 80, y: 30 }), 0.6); posT[defT][ri] = lerpC(posT[defT][ri], rr, easeC(k * 2)); ball = { ...lerpC(rim, rr, easeC(k * 2)), h: 4 * (1 - easeC(k * 2)) + 1 }; banner = k < 0.5 ? 'NO GOOD' : 'REBOUND'; }
    else if (p.kind === 'block') { const bi = idx(defT, p.b); const bp = lerpC(shotAt, rim, 0.18); posT[defT][bi] = bp; ball = { x: bp.x + (O === 0 ? -14 : 14), y: bp.y + 10, h: 1 }; banner = 'BLOCKED!'; }
    else if (p.kind === 'steal') { const st = idx(defT, p.b); const away = flipX(D, { x: 84, y: 25 }); posT[defT][st] = away; ball = { ...away, h: 1.5 }; banner = 'STEAL!'; }
    else if (p.kind === 'tov') { ball = { x: off[si].x, y: off[si].y < 25 ? -2 : 52, h: 0 }; banner = 'TURNOVER'; }
    else if (p.kind === 'ft') { const line = flipX(O, { x: 75, y: 25 }); posT[offT][si] = line; const shotK = (k * 2) % 1; ball = { ...lerpC(line, rim, shotK), h: 2 + Math.sin(shotK * Math.PI) * 6 }; banner = 'FREE THROWS ' + p.n + '/' + p.of; }
  }
  return { pos: posT, ball: ball || { x: 47, y: 25, h: 0 }, holder, banner, jump };
}

function CourtView({ d, A, B, match, speed, commentary, onDone, label }) {
  const L = useMemo(() => match.lineups.map(hoopLineup), [match]);
  const script = useMemo(() => hoopsScript(match), [match]);
  const base = speed === 'fast' ? 2 : 1.2;
  const [t, setT] = useState(speed === 'instant' ? script.total : 0);
  const [playing, setPlaying] = useState(speed !== 'instant');
  const [mult, setMult] = useState(1);
  const done = t >= script.total;
  const fired = useRef(false);
  const reduced = reducedMotion();
  useEffect(() => {
    if (!playing || done) return undefined;
    let raf; let last = performance.now();
    const tick = (now) => { const dt = Math.min(0.1, (now - last) / 1000); last = now; setT((x) => Math.min(script.total, x + dt * base * mult / Math.max(0.001, GAME_SPEED))); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, done, mult, base]);
  useEffect(() => { if (done && !fired.current) { fired.current = true; audio.play('whistle'); onDone && onDone(); } }, [done]);
  const bi = Math.max(0, script.beats.findIndex((b) => t < b.t0 + b.dur)); const beat = done ? script.beats[script.beats.length - 1] : script.beats[bi];
  const u = done ? beat.dur : t - beat.t0;
  const tq = reduced && !done ? Math.floor(u / 0.6) * 0.6 : u;
  const fr = hoopsFrame(beat, L, tq);
  // Score and clock shown at this moment.
  const resultAt = (b) => b.type === 'play' ? b.dur - (b.p.kind === 'ft' ? 2.4 : b.p.kind === 'tov' || b.p.kind === 'steal' ? 1.8 : 2.2) : 0;
  let score = beat.type === 'run' ? [0, 1].map((k) => Math.round(beat.from[k] + (beat.to[k] - beat.from[k]) * easeC(u / beat.dur))) : beat.type === 'play' ? (u >= resultAt(beat) ? beat.p.score : beat.from) : beat.score || [0, 0];
  if (done) score = match.score;
  const clock = beat.type === 'run' ? Math.round(beat.c0 + (beat.c1 - beat.c0) * easeC(u / beat.dur)) : beat.type === 'play' ? beat.clock : beat.type === 'tip' ? 720 : 0;
  const period = done ? (match.ot ? 'FINAL/OT' : 'FINAL') : beat.type === 'qend' ? 'END ' + hoopsPeriodName(beat.q) : hoopsPeriodName(beat.q) + ' ' + hoopsClock(clock);
  const runBanner = beat.type === 'run' && Math.abs(beat.run[0] - beat.run[1]) >= 6 && u > 0.4 ? (beat.team === 0 ? A : B).name.toUpperCase().slice(0, 12) + ' ' + Math.max(...beat.run) + '–' + Math.min(...beat.run) + ' RUN' : null;
  const bannerNow = done ? null : beat.type === 'tip' ? (u > 1.2 ? 'TIP-OFF!' : null) : beat.type === 'qend' ? 'END OF ' + hoopsPeriodName(beat.q) : beat.type === 'final' ? 'FINAL' : runBanner || fr.banner;
  // Sounds in step with what's on screen.
  const lastBeat = useRef(-1);
  useEffect(() => {
    if (!playing || done || bi === lastBeat.current) return;
    lastBeat.current = bi;
    if (beat.type === 'qend' || beat.type === 'tip') audio.play('whistle');
  }, [bi]);
  const said = useRef({});
  useEffect(() => {
    if (!playing || done || beat.type !== 'play' || u < resultAt(beat) || said.current[bi]) return;
    said.current[bi] = true;
    const p = beat.p;
    if (p.kind === 'make') { audio.play(p.type === 'three' || p.type === 'dunk' || p.buzzer ? 'cheer' : 'bid'); if (p.buzzer || p.type === 'dunk') audio.say((p.buzzer ? 'At the buzzer! ' : '') + p.p + '!', 2, d.id + ':' + label + ':h' + bi); }
    else if (p.kind === 'block' || p.kind === 'steal') audio.play('card');
  }, [t]);
  const feed = [];
  script.beats.forEach((b, k) => {
    if (b.t0 + (b.type === 'play' ? resultAt(b) : b.dur * 0.6) > t && !done) return;
    if (b.type === 'play') feed.push({ k, q: b.q, clock: b.clock, team: b.p.team, text: b.p.text, big: b.p.buzzer || b.p.type === 'three' || b.p.type === 'dunk' });
    else if (b.type === 'run' && (commentary || Math.abs(b.run[0] - b.run[1]) >= 6)) feed.push({ k, q: b.q, clock: b.c1, text: (b.run[0] !== b.run[1] ? (b.team === 0 ? A : B).name + ' go on a ' + Math.max(...b.run) + '–' + Math.min(...b.run) + ' run.' : 'Back and forth: ' + b.run[0] + '–' + b.run[1] + '.') + ' ' + b.to[0] + '–' + b.to[1], run: true });
    else if (b.type === 'qend') feed.push({ k, q: b.q, clock: 0, text: 'End of ' + hoopsPeriodName(b.q) + ': ' + b.score[0] + '–' + b.score[1], half: true });
  });
  const feedRef = useRef(null);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [feed.length]);
  const colors = [A, B].map((m) => ({ fill: m.color, text: onColor(m.color) }));
  const short = (n) => { const w = n.split(' '); const s2 = w[w.length - 1]; return s2.length > 10 ? s2.slice(0, 9) + '.' : s2; };
  const numOf = (name) => { const it = Object.values(d.items).find((x) => x.name === name); return it ? kitNumber(it) : ''; };
  const era = eraWord(d.topic);
  return (
    <div className="matchview courtview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid">
          <span className="sb-score num" aria-live="polite">{score[0]}–{score[1]}</span>
          <span className="sb-clock num">{period}</span>
        </div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      <div className="pitchwrap">
        <svg className="pitchsvg courtsvg" viewBox={'-2 -2 ' + (COURT.w + 4) + ' ' + (COURT.h + 4)} role="img" aria-label={'Basketball court: ' + A.name + ' ' + score[0] + ', ' + B.name + ' ' + score[1] + ', ' + period}>
          <rect x="-2" y="-2" width={COURT.w + 4} height={COURT.h + 4} fill="#2a1f14" />
          <rect x="0" y="0" width={COURT.w} height={COURT.h} fill="#d9a066" />
          {Array.from({ length: 12 }, (_, i) => <rect key={i} x="0" y={i * 4.2} width={COURT.w} height="2.1" fill="rgba(255,255,255,.05)" />)}
          <g fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="0.3">
            <rect x="0" y="0" width={COURT.w} height={COURT.h} />
            <line x1={COURT.w / 2} y1="0" x2={COURT.w / 2} y2={COURT.h} /><circle cx={COURT.w / 2} cy="25" r="6" />
            {[0, 1].map((s) => { const X = (x) => (s === 0 ? x : COURT.w - x); return (
              <g key={s}>
                <rect x={s === 0 ? 0 : COURT.w - 19} y="17" width="19" height="16" fill={s === 0 ? 'rgba(61,139,255,.25)' : 'rgba(226,70,59,.25)'} />
                <circle cx={X(19)} cy="25" r="6" />
                <path d={'M' + X(0) + ' 3 H' + X(14) + ' A23.75 23.75 0 0 ' + (s === 0 ? 1 : 0) + ' ' + X(14) + ' 47 H' + X(0)} />
                <line x1={X(4)} y1="22" x2={X(4)} y2="28" stroke="#fff" strokeWidth="0.5" />
                <circle cx={X(5.25)} cy="25" r="0.9" stroke="#ff6a00" strokeWidth="0.35" />
              </g>
            ); })}
          </g>
          {[0, 1].map((team) => L[team].map((pl, i) => {
            const p = fr.pos[team][i]; if (!p) return null;
            const has = fr.holder && fr.holder.team === team && fr.holder.i === i;
            const up = fr.jump && fr.jump.team === team && fr.jump.i === i;
            return (
              <g key={team + '-' + i} transform={'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ')' + (up ? ' scale(1.3)' : '')}>
                <ellipse cx="0.3" cy="0.6" rx="1.9" ry="1.2" fill="rgba(0,0,0,.25)" />
                <circle r="1.9" fill={colors[team].fill} stroke={has ? '#fff' : 'rgba(0,0,0,.55)'} strokeWidth={has ? 0.5 : 0.3} />
                <text y="0.75" textAnchor="middle" fontSize="2" fontWeight="800" fill={colors[team].text}>{numOf(pl.name)}</text>
                <text className={'plabel' + (has ? ' on' : '')} y="-2.6" textAnchor="middle" fontSize="2.1" fontWeight="700" fill="#fff">{short(pl.name)}</text>
              </g>
            );
          }))}
          <ellipse cx={fr.ball.x} cy={fr.ball.y + 0.4} rx="0.8" ry="0.45" fill="rgba(0,0,0,.3)" />
          <circle cx={fr.ball.x} cy={fr.ball.y - (fr.ball.h || 0) * 0.35} r={0.85 + (fr.ball.h || 0) * 0.04} fill="#f07a1f" stroke="#3a1a08" strokeWidth="0.22" />
          {bannerNow && <text x={COURT.w / 2} y={COURT.h / 2 + 3} textAnchor="middle" fontSize={bannerNow.length > 12 ? 5.5 : 8} fontWeight="900" fill={/THREE|DUNK|BUZZER|AND ONE/.test(bannerNow) ? '#ffc83d' : '#fff'} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke" className="pbanner">{bannerNow}</text>}
        </svg>
      </div>
      <div className="mctrl" role="group" aria-label="Game controls">
        {!done && <button className="btn btn-sm" onClick={() => setPlaying((x) => !x)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸ Pause' : '▶ Play'}</button>}
        {!done && [1, 2, 4].map((x) => <button key={x} className={'btn btn-sm' + (mult === x ? ' btn-gold' : '')} aria-pressed={mult === x} onClick={() => setMult(x)}>{x}×</button>)}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => setT(script.total)}>Skip to result</button>}
        {done && <button className="btn btn-sm" onClick={() => { fired.current = true; said.current = {}; setT(0); setPlaying(true); }}>↺ Watch again</button>}
      </div>
      <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map((e) => (
          <p key={e.k} className={'mev ' + (e.big ? 'goal' : e.half ? 'half' : '') + (e.team != null ? ' t' + e.team : '')}>
            <span className="mm num">{hoopsPeriodName(e.q)}</span>
            <span>{e.big ? '🏀 ' : e.run ? '📈 ' : ''}{e.text}{e.team != null ? <small> · {(e.team === 0 ? A : B).name}</small> : null}</span>
          </p>
        ))}
      </div>
      {done && <HoopsSummary d={d} A={A} B={B} match={match} era={era} />}
    </div>
  );
}

function hoopsReport(d, A, B, match) {
  const T = [A, B];
  const rows = [0, 1].flatMap((s) => Object.entries(match.box[s]).map(([name, b]) => ({ team: s, name, ...b, gs: b.pts + b.reb * 0.7 + b.ast * 0.8 + b.blk * 1.2 + b.stl * 1.2 })));
  const mvp = rows.filter((r) => r.team === match.winner).sort((x, y) => y.gs - x.gs)[0] || null;
  let turning = null;
  const lc = match.plays.filter((p) => p.leadChange && p.team === match.winner);
  if (lc.length) turning = lc[lc.length - 1];
  const price = (s, name) => { const e = T[s].team.find((x) => x && d.items[x.itemId] && d.items[x.itemId].name === name); return e ? e.price || 0 : 0; };
  const withPrice = rows.map((r) => ({ ...r, price: price(r.team, r.name) }));
  const best = withPrice.filter((r) => r.gs > 0).sort((x, y) => y.gs / Math.max(1, y.price) - x.gs / Math.max(1, x.price))[0] || null;
  const flop = withPrice.filter((r) => r.price >= 3).sort((x, y) => x.gs / x.price - y.gs / y.price)[0] || null;
  return { rows, mvp, turning, best, flop };
}
function HoopsSummary({ d, A, B, match, era }) {
  const R = hoopsReport(d, A, B, match);
  const T = (i) => (i === 0 ? A : B);
  const top = (s) => R.rows.filter((r) => r.team === s).sort((x, y) => y.pts - x.pts);
  const line = (r) => r.name + ' ' + r.pts + ' pts' + (r.reb >= 5 ? ', ' + r.reb + ' reb' : '') + (r.ast >= 4 ? ', ' + r.ast + ' ast' : '') + (r.blk >= 2 ? ', ' + r.blk + ' blk' : '') + (r.stl >= 2 ? ', ' + r.stl + ' stl' : '');
  return (
    <div className="board msummary">
      <h3>🏀 Box score</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {match.score[0]}–{match.score[1]} {B.name}</b>{match.ot ? ' · after ' + (match.ot > 1 ? match.ot + ' overtimes' : 'overtime') : ''}</p>
      {!match.forfeit && <table className="qtable small"><thead><tr><th></th>{match.quarters.map((_, q) => <th key={q}>{hoopsPeriodName(q)}</th>)}<th>T</th></tr></thead><tbody>{[0, 1].map((s) => <tr key={s}><td>{T(s).name}</td>{match.quarters.map((qq, q) => <td key={q} className="num">{qq[s]}</td>)}<td className="num"><b>{match.score[s]}</b></td></tr>)}</tbody></table>}
      {!match.forfeit && [0, 1].map((s) => <p key={s} className="small" style={{ margin: 0 }}>{T(s).emoji} {T(s).name}: {top(s).slice(0, 3).map(line).join(' · ')}</p>)}
      {!match.forfeit && <div className="mreport">
        <h4>📋 Game report</h4>
        {R.mvp && <p className="small"><b>⭐ MVP:</b> {line(R.mvp)} ({T(R.mvp.team).name}).</p>}
        {R.turning && <p className="small"><b>🔄 Turning point:</b> {R.turning.p} in {hoopsPeriodName(R.turning.q)} ({hoopsClock(R.turning.clock)}) put {T(R.turning.team).name} ahead for good, {R.turning.score[0]}–{R.turning.score[1]}.</p>}
        {R.best && <p className="small"><b>💰 Best buy:</b> {R.best.name} — ${R.best.price} for {R.best.pts} points.</p>}
        {R.flop && <p className="small"><b>📉 Quiet night:</b> {R.flop.name} cost ${R.flop.price} and scored {R.flop.pts}.</p>}
      </div>}
      <p className="hint" style={{ margin: 0 }}>A simulated game from Draft Night’s estimated {era} numbers (not official ratings). Players have hot and cold nights, so upsets happen.</p>
    </div>
  );
}

// "Now 88" / "Prime 94" chip on basketball auction cards; tap for the full card.
function HoopsChip({ item, topic }) {
  const [open, setOpen] = useState(false);
  if (!numbersShown()) return null;
  const r = hoopsRating(item, item.pos); const era = eraWord(topic);
  return (
    <>
      <button type="button" className="ratingchip" onClick={() => setOpen(true)} aria-label={era + ' ' + r.ovr + ', estimated. Show details'}>{era} <b className="num">{r.ovr}</b> est.</button>
      {open && ReactDOM.createPortal(
        <Sheet center onClose={() => setOpen(false)}>
          <div className="ratingcard">
            <div className="rc-top"><span className="rc-ovr num"><small className="rc-era">{era}</small>{r.ovr}</span><span className="rc-role">{r.role}</span><span className="rc-name">{item.name}</span></div>
            <div className="rc-attrs">{HOOPS_ATTRS.map((a) => <div key={a} className="rc-attr"><span className="k" title={HOOPS_ATTR_NAMES[a]}>{a === 'TPT' ? '3PT' : a}</span><span className="bar"><i style={{ width: r.attrs[a] + '%' }} /></span><span className="v num">{r.attrs[a]}</span></div>)}</div>
            <p className="hint" style={{ margin: 0 }}>{era === 'Now' ? 'Now: how good they are today. ' : 'Prime: how good they were at their peak. '}Draft Night estimate from position and achievements, not an official rating.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
        </Sheet>, document.body)}
    </>
  );
}
