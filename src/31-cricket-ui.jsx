/* ============================================================
   CRICKET screen (rules in 29-cricket.js). A top-down ground with the
   pitch, both batters, the bowler and a full field. Big balls are
   played out: the run-up, the delivery, sixes sailing over the rope,
   fours racing away, stumps flying, catches (and drops), stumpings
   and run outs. Every other over rolls by ball by ball on the ticker,
   so the scoreboard always matches the recorded match.
   ============================================================ */
const CG = { cx: 50, cy: 30, rx: 46, ry: 27 };
const FIELD_POS = [
  { x: 50, y: 22.5 }, // keeper (behind the striker, who faces "down")
  { x: 54, y: 20 }, { x: 64, y: 26 }, { x: 69, y: 34 }, { x: 60, y: 46 }, { x: 40, y: 46 },
  { x: 31, y: 35 }, { x: 33, y: 24 }, { x: 42, y: 12 }, { x: 60, y: 10 }, { x: 50, y: 52 },
];
const CRK_BALL_DUR = 3.4;
function cricketScript(match) {
  const beats = []; let t = 0;
  const add = (b) => { b.t0 = t; t += b.dur; beats.push(b); return b; };
  add({ type: 'toss', dur: 2.8 });
  const all = [...match.innings.map((x, ii) => ({ ...x, ii })), ...match.superOvers.map((x, k) => ({ ...x, ii: 2 + k }))];
  all.forEach((inn) => {
    add({ type: 'innstart', dur: 2.2, inn });
    let over = -1; let buf = [];
    const flush = () => { if (!buf.length) return; add({ type: 'over', dur: Math.min(2.2, 0.6 + buf.length * 0.12), inn, balls: buf, over }); buf = []; };
    inn.balls.forEach((b, k) => {
      if (b.over !== over) { flush(); over = b.over; }
      if (b.hl) { flush(); add({ type: 'ball', dur: CRK_BALL_DUR + (b.w || b.mile ? 0.8 : 0), inn, b, k }); } else buf.push({ b, k });
    });
    flush();
    add({ type: 'innend', dur: 2.4, inn });
  });
  add({ type: 'final', dur: 3 });
  return { beats, total: t };
}
// Where the shot goes for one ball (deterministic from the ball itself).
function shotDir(b, k) { const a = unit('crkdir', k, b.bat, b.bowl, b.tot) * Math.PI * 2; return { x: Math.cos(a), y: Math.sin(a) * 0.85 + 0.15 }; }
// Field position of each XI member: the keeper stands up, everyone else spreads round the field.
const crkPosOf = (xi) => { const wk = Math.max(0, xi.findIndex((p) => p.role === 'WK')); const order = [wk, ...xi.map((_, i) => i).filter((i) => i !== wk)]; const m = {}; order.forEach((xiI, posI) => { m[xiI] = posI; }); return (i) => (m[i] != null ? m[i] : 1); };
function cricketFrame(beat, u, xiBowl) {
  const F = FIELD_POS.map((p) => ({ ...p }));
  const pos = crkPosOf(xiBowl || []);
  const striker = { x: 50, y: 24.5 }, non = { x: 50.8, y: 36.5 }, bowler = { x: 49, y: 37 };
  const out = { F, striker: { ...striker }, non: { ...non }, bowler: { ...bowler }, ball: null, banner: null, stumps: null, flash: null };
  if (beat.type !== 'ball') return out;
  const b = beat.b; const k = (a, z) => Math.max(0, Math.min(1, (u - a) / (z - a)));
  // Run-up and delivery.
  out.bowler = { x: 49 + (1 - k(0, 0.9)) * 0, y: 44 - k(0, 0.9) * 7 };
  const rel = 0.9, pitchAt = 1.15, arrive = 1.32;
  if (u < rel) out.ball = { x: out.bowler.x, y: out.bowler.y, h: 1 };
  else if (u < pitchAt) out.ball = { ...lerpR({ x: 49.5, y: 37 }, { x: 50, y: 28 }, k(rel, pitchAt)), h: 1.2 * (1 - k(rel, pitchAt)) };
  else if (u < arrive) out.ball = { ...lerpR({ x: 50, y: 28 }, { x: 50, y: 24.8 }, k(pitchAt, arrive)), h: 0.6 * Math.sin(k(pitchAt, arrive) * Math.PI) };
  else {
    const d = shotDir(b, beat.k);
    const kk = k(arrive, arrive + 1.1);
    const runs = b.x === 2 ? b.r - 1 : b.r;
    if (b.w && (b.how === 'bowled' || b.how === 'lbw')) {
      out.ball = { x: 50, y: 23.4, h: 0 }; out.stumps = b.how === 'bowled' ? { x: 50, y: 23.2, k: k(arrive, arrive + 0.4) } : null;
      out.banner = b.how === 'bowled' ? 'BOWLED!' : u > arrive + 0.5 ? 'LBW!' : 'HOWZAT?';
    } else if (b.w && (b.how === 'caught behind' || b.how === 'stumped')) {
      out.ball = { ...lerpR({ x: 50, y: 24.8 }, F[0], k(arrive, arrive + 0.25)), h: 0.8 };
      if (b.how === 'stumped') { out.striker = lerpR(striker, { x: 50, y: 27 }, k(arrive - 0.2, arrive + 0.2)); out.stumps = { x: 50, y: 23.2, k: k(arrive + 0.4, arrive + 0.7) }; }
      out.banner = u > arrive + 0.5 ? (b.how === 'stumped' ? 'STUMPED!' : 'CAUGHT BEHIND!') : null; out.flash = F[0];
    } else if ((b.w && b.how === 'caught') || b.drop != null) {
      const fi = pos(b.w ? b.f : b.drop); const fp = F[fi];
      out.ball = { ...lerpR({ x: 50, y: 24.8 }, fp, kk), h: Math.sin(kk * Math.PI) * 7 };
      F[fi] = lerpR(fp, { x: fp.x + (unit('cd', beat.k) - 0.5) * 3, y: fp.y }, kk);
      if (kk >= 1) { if (b.drop != null) { out.ball = { x: fp.x + 1.6, y: fp.y + 1.4, h: 0 }; out.banner = 'DROPPED!'; } else { out.ball = { ...F[fi], h: 0 }; out.banner = 'CAUGHT!'; } out.flash = F[fi]; }
    } else if (b.w && b.how === 'run out') {
      out.striker = lerpR(striker, { x: 50.4, y: 33 }, k(arrive, arrive + 1.1)); out.non = lerpR(non, { x: 50.2, y: 28 }, k(arrive, arrive + 1.1));
      const fp = F[pos(b.f != null ? b.f : 3)];
      out.ball = k(arrive, arrive + 0.5) < 1 ? { ...lerpR({ x: 50, y: 24.8 }, fp, k(arrive, arrive + 0.5)), h: 0 } : { ...lerpR(fp, { x: 50.8, y: 36.5 }, k(arrive + 0.5, arrive + 1.0)), h: 1 };
      if (u > arrive + 1.0) { out.stumps = { x: 50.8, y: 36.8, k: k(arrive + 1.0, arrive + 1.3) }; out.banner = 'RUN OUT!'; }
    } else if (runs === 6) {
      const land = { x: CG.cx + d.x * (CG.rx + 4), y: CG.cy + d.y * (CG.ry + 3) };
      out.ball = { ...lerpR({ x: 50, y: 24.8 }, land, kk), h: Math.sin(kk * Math.PI) * 14 };
      if (kk > 0.6) out.banner = 'SIX!';
    } else if (runs === 4) {
      const land = { x: CG.cx + d.x * CG.rx * 0.98, y: CG.cy + d.y * CG.ry * 0.98 };
      out.ball = { ...lerpR({ x: 50, y: 24.8 }, land, easeC(kk)), h: 0 };
      const near = F.reduce((bi2, p, i) => (i && Math.hypot(p.x - land.x, p.y - land.y) < Math.hypot(F[bi2].x - land.x, F[bi2].y - land.y) ? i : bi2), 1);
      F[near] = lerpR(F[near], land, kk * 0.75);
      if (kk > 0.7) out.banner = 'FOUR!';
    } else {
      const land = { x: 50 + d.x * 14, y: 30 + d.y * 10 };
      out.ball = { ...lerpR({ x: 50, y: 24.8 }, land, kk), h: 0 };
      if (runs > 0) { out.striker = lerpR(striker, non, Math.min(1, kk * runs)); out.non = lerpR(non, striker, Math.min(1, kk * runs)); }
    }
    if (b.mile && u > beat.dur - 1.1) out.banner = b.mile === 100 ? 'HUNDRED!' : 'FIFTY!';
    if (b.x === 2 && u < arrive + 0.6) out.banner = 'NO BALL — FREE HIT';
  }
  return out;
}

function CricketView({ d, A, B, match, speed, onDone, label }) {
  const script = useMemo(() => cricketScript(match), [match]);
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
  const T = (i) => (i === 0 ? A : B);
  const inn = beat.inn || (match.superOvers.length ? match.superOvers[match.superOvers.length - 1] : match.innings[1]);
  const batT = inn.team, bowlT = 1 - inn.team;
  const xiBat = match.xi[batT], xiBowl = match.xi[bowlT];
  const fr = cricketFrame(beat, u, xiBowl); const posOfX = crkPosOf(xiBowl);
  // Score at this moment of the innings.
  let cur = null;
  if (beat.type === 'ball') cur = u > 2.2 ? beat.b : beat.k ? inn.balls[beat.k - 1] : null;
  else if (beat.type === 'over') cur = beat.balls[Math.min(beat.balls.length - 1, Math.floor((u / beat.dur) * beat.balls.length))].b;
  else if (beat.type === 'innend' || beat.type === 'final' || done) cur = inn.balls[inn.balls.length - 1];
  const runs = cur ? cur.tot : 0, wk = cur ? cur.wk : 0, lb = cur ? cur.lb : 0;
  const isSO = beat.inn && beat.inn.ii >= 2; const isChase = beat.inn && (beat.inn.ii === 1 || beat.inn.ii % 2 === 1);
  const target = isChase ? (beat.inn.ii === 1 ? match.innings[0].runs + 1 : match.superOvers[beat.inn.ii - 3].runs + 1) : null;
  const ballsMax = isSO ? 6 : 120;
  const chaseTxt = target != null && cur && runs < target ? 'need ' + (target - runs) + ' off ' + (ballsMax - lb) : target != null && runs >= target ? 'target reached' : '';
  const status = done || beat.type === 'final' ? 'RESULT' : beat.type === 'toss' ? 'TOSS' : (isSO ? 'SUPER OVER' : beat.inn.ii === 0 ? '1ST INNINGS' : '2ND INNINGS');
  const striker = cur && beat.type === 'ball' ? xiBat[beat.b.bat] : null;
  const bowler = beat.type === 'ball' ? xiBowl[beat.b.bowl] : beat.type === 'over' ? xiBowl[beat.balls[0].b.bowl] : null;
  const colors = [A.color, B.color];
  const short = (n) => { if (/^Squad /.test(String(n || ''))) return ''; const w = String(n || '').split(' '); return w[w.length - 1].slice(0, 10); };
  const ballLabel = (b) => (b.x === 1 ? 'wd' : b.w ? 'W' : b.x === 2 ? 'nb' + (b.r - 1 || '') : String(b.r === 0 ? '•' : b.r));
  const banner = done ? null : beat.type === 'toss' ? T(match.toss).name.toUpperCase().slice(0, 12) + ' WIN THE TOSS' : beat.type === 'innstart' ? (beat.inn.ii >= 2 ? 'SUPER OVER!' : T(batT).name.toUpperCase().slice(0, 12) + ' BAT') : beat.type === 'innend' ? T(batT).name.toUpperCase().slice(0, 10) + ' ' + inn.runs + '/' + inn.wk : beat.type === 'final' ? 'RESULT' : fr.banner;
  const lastBeat = useRef(-1);
  useEffect(() => { if (!playing || done || bi === lastBeat.current) return; lastBeat.current = bi; if (beat.type === 'innstart' || beat.type === 'innend') audio.play('whistle'); }, [bi]);
  const said = useRef({});
  useEffect(() => { if (!playing || done || beat.type !== 'ball' || said.current[bi] || u < 1.9) return; said.current[bi] = true; const b = beat.b; const r = b.x === 2 ? b.r - 1 : b.r; if (b.w) { audio.play('buzzer'); audio.say('Out! ' + xiBat[b.bat].name.split(' ').slice(-1)[0] + ' has to go.', 2, d.id + ':' + label + ':w' + bi); } else if (r === 6) { audio.play('cheer'); } else if (r === 4) audio.play('bid'); else if (b.drop != null) audio.play('card'); }, [t]);
  const feed = [];
  script.beats.forEach((b, k2) => {
    if (!done && b.t0 + b.dur * 0.75 > t) return;
    const xb = match.xi[b.inn ? b.inn.team : 0], xw = match.xi[b.inn ? 1 - b.inn.team : 1];
    if (b.type === 'ball') { const x = b.b; const r = x.x === 2 ? x.r - 1 : x.r; const bat = xb[x.bat].name, bw = xw[x.bowl].name; const txt = x.w ? bat + (x.how === 'caught' ? ' caught by ' + (xw[x.f] ? xw[x.f].name : 'a fielder') : x.how === 'caught behind' ? ' caught behind' : x.how === 'stumped' ? ' stumped' : x.how === 'run out' ? ' run out' : ' ' + x.how) + (x.how !== 'run out' ? ', bowled ' + bw : '') + '! ' + x.tot + '/' + x.wk : x.drop != null ? 'DROPPED! ' + (xw[x.drop] ? xw[x.drop].name : 'A fielder') + ' puts down ' + bat + '.' : r === 6 ? bat + ' hits ' + bw + ' for SIX!' : r === 4 ? bat + ' drives ' + bw + ' for four.' : bat + ' takes ' + r + '.'; feed.push({ k: k2, tag: crkOvers(x.lb), team: x.w ? 1 - b.inn.team : b.inn.team, big: x.w || r === 6, text: txt + (x.mile ? ' ' + (x.mile === 100 ? 'HUNDRED' : 'FIFTY') + ' for ' + bat + '!' : '') }); }
    else if (b.type === 'innend') feed.push({ k: k2, tag: '🏏', text: T(b.inn.team).name + ' ' + (b.inn.ii >= 2 ? '(Super Over) ' : '') + b.inn.runs + '/' + b.inn.wk + ' (' + crkOvers(b.inn.legal) + ' ov)', half: true });
  });
  const feedRef = useRef(null);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [feed.length]);
  const overBalls = beat.type === 'over' ? beat.balls.slice(0, Math.floor((u / beat.dur) * beat.balls.length) + 1).map((x) => x.b) : beat.type === 'ball' ? inn.balls.filter((x, k3) => x.over === beat.b.over && k3 <= beat.k && (k3 < beat.k || u > 2)) : [];
  return (
    <div className="matchview cricketview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid"><span className="sb-score num" aria-live="polite">{done || beat.type === 'final' ? match.innings.map((x) => x.runs + '/' + x.wk).join(' · ') : runs + '/' + wk}</span><span className="sb-clock num">{status}</span></div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      <div className="boutbar small">{beat.inn ? <><b>{T(batT).name}</b> <span className="muted">· {runs}/{wk} ({crkOvers(lb)} ov){chaseTxt ? ' · ' + chaseTxt : ''}</span></> : <span className="muted">T20 · 20 overs a side</span>}
        {(striker || bowler) && <span className="boutstats">{striker ? '🏏 ' + striker.name : ''}{bowler ? (striker ? ' · ' : '') + '⚾ ' + bowler.name + (bowler.type === 'spin' ? ' (spin)' : ' (pace)') : ''}</span>}
        {overBalls.length > 0 && <span className="boutstats overticker">{overBalls.map((x, i) => <i key={i} className={'ob' + (x.w ? ' w' : (x.x === 2 ? x.r - 1 : x.r) >= 4 ? ' b' : '')}>{ballLabel(x)}</i>)}</span>}
      </div>
      <div className="pitchwrap">
        <svg className="pitchsvg cricketsvg" viewBox="0 0 100 60" role="img" aria-label={'Cricket: ' + status + ', ' + runs + ' for ' + wk}>
          <rect x="0" y="0" width="100" height="60" fill="#2c6b2f" />
          <ellipse cx={CG.cx} cy={CG.cy} rx={CG.rx} ry={CG.ry} fill="#4f9a3f" stroke="#fff" strokeWidth="0.5" strokeDasharray="1 0.6" />
          {Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx={CG.cx} cy={CG.cy} rx={CG.rx - i * 5.5} ry={CG.ry - i * 3.2} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="2.4" />)}
          <ellipse cx={CG.cx} cy={CG.cy} rx="17" ry="11" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="0.25" strokeDasharray="0.8 0.8" />
          <rect x="48.6" y="22" width="2.8" height="16" fill="#d9c79a" />
          {[[50, 23.2], [50.8, 36.8]].map(([x, y], i) => { const st = fr.stumps && Math.abs(fr.stumps.y - y) < 1 ? fr.stumps.k : 0; return <g key={i}>{[-0.35, 0, 0.35].map((dx, j) => <rect key={j} x={x + dx - 0.08 + st * dx * 3} y={y - 0.6 - st * (j - 1) * 0.8} width="0.16" height="1.2" fill="#f4f1ea" transform={st ? 'rotate(' + (st * (j - 1) * 40) + ' ' + (x + dx) + ' ' + y + ')' : ''} />)}</g>; })}
          {beat.type !== 'toss' && xiBowl.map((pl, xiI) => { const i = posOfX(xiI); const p = fr.F[i]; const named = !pl.squad && (i === 0 || (fr.flash && Math.abs(fr.flash.x - p.x) < 0.1 && Math.abs(fr.flash.y - p.y) < 0.1)); return <g key={'f' + i} transform={'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ')'}><circle r="1.15" fill={colors[bowlT]} stroke="rgba(0,0,0,.5)" strokeWidth="0.25" />{named && <text y="-1.7" textAnchor="middle" fontSize="1.8" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{short(pl.name)}</text>}</g>; })}
          {beat.inn && [['striker', striker], ['non', null]].map(([k3, pl]) => { const p = fr[k3]; return <g key={k3} transform={'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ')'}><circle r="1.25" fill={colors[batT]} stroke="#fff" strokeWidth="0.35" />{pl && <text y="-1.8" textAnchor="middle" fontSize="1.9" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{short(pl.name)}</text>}</g>; })}
          {beat.type === 'ball' && <g transform={'translate(' + fr.bowler.x.toFixed(2) + ' ' + fr.bowler.y.toFixed(2) + ')'}><circle r="1.2" fill={colors[bowlT]} stroke="#fff" strokeWidth="0.35" />{bowler && <text y="2.9" textAnchor="middle" fontSize="1.8" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{short(bowler.name)}</text>}</g>}
          {fr.ball && <g><ellipse cx={fr.ball.x} cy={fr.ball.y + 0.2} rx="0.45" ry="0.25" fill="rgba(0,0,0,.3)" /><circle cx={fr.ball.x} cy={fr.ball.y - (fr.ball.h || 0) * 0.4} r={0.45 + (fr.ball.h || 0) * 0.025} fill="#c0272d" stroke="#fff" strokeWidth="0.1" /></g>}
          {fr.flash && <circle cx={fr.flash.x} cy={fr.flash.y} r="2.6" fill="none" stroke="#ffd23d" strokeWidth="0.45" />}
          {(done || beat.type === 'final') && <g><rect x="0" y="0" width="100" height="60" fill="rgba(15,12,33,.6)" /><text x="50" y="25" textAnchor="middle" fontSize="6.5" fontWeight="900" fill={colors[match.winner]} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke">{T(match.winner).name.toUpperCase().slice(0, 16)} WIN</text><text x="50" y="34" textAnchor="middle" fontSize="3.2" fontWeight="800" fill="#ffc83d">{crkResultLine(match, A, B).replace(/^.*? won /, 'Won ')}</text></g>}
          {banner && <text x="50" y="9" textAnchor="middle" fontSize={banner.length > 14 ? 4.6 : 6.5} fontWeight="900" fill={/SIX|FOUR|BOWLED|CAUGHT|LBW|STUMPED|RUN OUT|HUNDRED|FIFTY|DROPPED|SUPER/.test(banner) ? '#ffc83d' : '#fff'} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke" className="pbanner">{banner}</text>}
        </svg>
      </div>
      <div className="mctrl" role="group" aria-label="Match controls">
        {!done && <button className="btn btn-sm" onClick={() => setPlaying((x) => !x)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸ Pause' : '▶ Play'}</button>}
        {!done && [1, 2, 4].map((x) => <button key={x} className={'btn btn-sm' + (mult === x ? ' btn-gold' : '')} aria-pressed={mult === x} onClick={() => setMult(x)}>{x}×</button>)}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => { const nb = script.beats.find((b) => b.type === 'innstart' && b.t0 > t + 0.01); setT(nb ? nb.t0 : script.total); }}>Next innings</button>}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => setT(script.total)}>Skip to result</button>}
        {done && <button className="btn btn-sm" onClick={() => { fired.current = true; said.current = {}; setT(0); setPlaying(true); }}>↺ Watch again</button>}
      </div>
      <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map((e) => <p key={e.k} className={'mev ' + (e.big ? 'goal' : e.half ? 'half' : '') + (e.team != null ? ' t' + e.team : '')}><span className="mm num">{e.tag}</span><span>{e.text}</span></p>)}
      </div>
      {done && <CricketSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}
function cricketReport(d, A, B, match) {
  const rows = [];
  match.innings.forEach((inn) => {
    inn.bs.forEach((b, i) => { if (b.b || b.out) rows.push({ team: inn.team, i, kind: 'bat', name: match.xi[inn.team][i].name, squad: match.xi[inn.team][i].squad, ...b }); });
    inn.bw.forEach((b, i) => { if (b.balls) rows.push({ team: 1 - inn.team, i, kind: 'bowl', name: match.xi[1 - inn.team][i].name, squad: match.xi[1 - inn.team][i].squad, ...b }); });
  });
  const impact = {};
  rows.forEach((r) => { const k = r.team + '|' + r.name; impact[k] = impact[k] || { team: r.team, name: r.name, squad: r.squad, v: 0, bat: null, bowl: null }; if (r.kind === 'bat') { impact[k].v += r.r + (r.r >= 50 ? 15 : 0) + (r.r - r.b * 1.3) * 0.3; impact[k].bat = r; } else { impact[k].v += r.w * 22 + (r.balls * 1.35 - r.r) * 0.6; impact[k].bowl = r; } });
  const list = Object.values(impact);
  const potm = list.filter((x) => x.team === match.winner).sort((a, b) => b.v - a.v)[0] || null;
  const price = (s, name) => { const T = s === 0 ? A : B; const e = T.team.find((x) => x && d.items[x.itemId] && d.items[x.itemId].name === name); return e ? e.price || 0 : 0; };
  const wp = list.filter((x) => !x.squad).map((x) => ({ ...x, price: price(x.team, x.name) }));
  const best = wp.filter((x) => x.v > 20 && x.price > 0).sort((a, b) => b.v / b.price - a.v / a.price)[0] || null;
  const flop = wp.filter((x) => x.price >= 3).sort((a, b) => a.v / a.price - b.v / b.price)[0] || null;
  return { rows, potm, best, flop };
}
const crkBatLine = (r) => r.r + (r.out ? '' : '*') + ' (' + r.b + ')' + (r.f || r.s ? ' · ' + (r.f ? r.f + '×4' : '') + (r.f && r.s ? ' ' : '') + (r.s ? r.s + '×6' : '') : '');
const crkBowlLine = (r) => r.w + '/' + r.r + ' (' + crkOvers(r.balls) + ')';
const crkImpact = (x) => [x.bat ? crkBatLine(x.bat) : '', x.bowl ? crkBowlLine(x.bowl) : ''].filter(Boolean).join(' and ');
function CricketSummary({ d, A, B, match }) {
  const R = cricketReport(d, A, B, match); const T = (i) => (i === 0 ? A : B);
  return (
    <div className="board msummary">
      <h3>🏏 Scorecard</h3>
      <p className="small" style={{ margin: 0 }}><b>{crkResultLine(match, A, B)}</b></p>
      {match.innings.map((inn, ii) => {
        const bats = R.rows.filter((r) => r.kind === 'bat' && r.team === inn.team).sort((a, b) => b.r - a.r).slice(0, 4);
        const bowls = R.rows.filter((r) => r.kind === 'bowl' && r.team === 1 - inn.team).sort((a, b) => b.w - a.w || a.r - b.r).slice(0, 3);
        return (
          <div key={ii} className="fc-row">
            <span className="fc-tag">{T(inn.team).name} {inn.runs}/{inn.wk} ({crkOvers(inn.legal)} ov)</span>
            <span className="small">🏏 {bats.map((r) => r.name + ' ' + crkBatLine(r)).join(' · ')}</span>
            <span className="small muted">⚾ {bowls.map((r) => r.name + ' ' + crkBowlLine(r)).join(' · ')}</span>
          </div>
        );
      })}
      {match.superOvers.length > 0 && <p className="small" style={{ margin: 0 }}>Super Over: {match.superOvers.map((s2) => T(s2.team).name + ' ' + s2.runs + '/' + s2.wk).join(' · ')}</p>}
      <div className="mreport">
        <h4>📋 Match report</h4>
        {R.potm && <p className="small"><b>⭐ Player of the Match:</b> {R.potm.name} ({T(R.potm.team).name}) — {crkImpact(R.potm)}.</p>}
        {R.best && R.best !== R.potm && <p className="small"><b>💰 Best buy:</b> {R.best.name} — ${R.best.price}: {crkImpact(R.best)}.</p>}
        {R.flop && <p className="small"><b>📉 Quiet day:</b> {R.flop.name} cost ${R.flop.price}{crkImpact(R.flop) ? ': ' + crkImpact(R.flop) : ' and barely got involved'}.</p>}
      </div>
      <p className="hint" style={{ margin: 0 }}>Every ball simulated from Draft Night’s estimated Prime numbers (not official ratings). Each XI is your six plus five average squad players.</p>
    </div>
  );
}
function CrkChip({ item, topic }) {
  const [open, setOpen] = useState(false);
  if (!numbersShown()) return null;
  const r = crkRating(item, item.pos);
  const rows = [['BAT', r.bat, 'Batting'], ['PWR', r.pwr, 'Power hitting'], ['BWL', r.bowl, 'Bowling']].concat(r.role === 'WK' ? [['KEEP', r.keep, 'Wicketkeeping']] : []);
  return (
    <>
      <button type="button" className="ratingchip" onClick={() => setOpen(true)} aria-label={'Prime ' + r.ovr + ', estimated. Show details'}>Prime <b className="num">{r.ovr}</b> est.</button>
      {open && ReactDOM.createPortal(
        <Sheet center onClose={() => setOpen(false)}>
          <div className="ratingcard">
            <div className="rc-top"><span className="rc-ovr num"><small className="rc-era">Prime</small>{r.ovr}</span><span className="rc-role">{r.role}</span><span className="rc-name">{item.name}{r.role === 'BOWL' || r.role === 'AR' ? <><br /><small>{r.type === 'spin' ? 'Spin bowler' : 'Pace bowler'}</small></> : null}</span></div>
            <div className="rc-attrs">{rows.map(([k3, v, nm]) => <div key={k3} className="rc-attr"><span className="k" title={nm}>{k3}</span><span className="bar"><i style={{ width: v + '%' }} /></span><span className="v num">{v}</span></div>)}</div>
            <p className="hint" style={{ margin: 0 }}>Prime: how good they were at their peak (for current players, their best so far). Draft Night estimate, not an official rating.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
        </Sheet>, document.body)}
    </>
  );
}
