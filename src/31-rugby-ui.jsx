/* ============================================================
   RUGBY screen (rules in 29-rugby.js). A top-down pitch with both
   XVs: forwards around the ball, backs fanned out in their line.
   Big moments are played out — line breaks and runs to the line,
   tries and conversions, penalty kicks at goal, drop goals, mauls,
   scrums, turnovers, big hits and yellow cards. Everything else
   rolls by, so the scoreboard always matches the recorded match.
   ============================================================ */
const RP = { w: 120, h: 70 };
const rx = (s, x) => (s === 0 ? 10 + x : 110 - x); // possessor's metres → screen x
const RUGBY_DUR = { try: 5, pen: 3.6, drop: 3.4, break: 3.2, turnover: 2.6, tackle: 2.4, card: 2.6, scrum: 2.8, et: 2.4, kickcomp: 2.6, kcwin: 2.6 };
function rugbyScript(match) {
  const beats = []; let t = 0;
  const add = (b) => { b.t0 = t; t += b.dur; beats.push(b); return b; };
  add({ type: 'intro', dur: 2.4 });
  let roll = [];
  const flush = () => { if (!roll.length) return; add({ type: 'roll', dur: Math.min(2.4, 0.5 + roll.length * 0.1), evs: roll }); roll = []; };
  match.plays.forEach((e) => {
    if (e.kind === 'ht') { flush(); add({ type: 'ht', dur: 2.4, e }); return; }
    if (e.hl) { flush(); add({ type: 'ev', dur: RUGBY_DUR[e.kind] || 2.6, e }); } else roll.push(e);
  });
  flush(); add({ type: 'final', dur: 2.8 });
  return { beats, total: t };
}
function rugbyFrame(beat, u, xv) {
  const out = { P: [[], []], ball: null, banner: null, flash: null, card: null };
  const e = beat.e || null; const s = e && e.s != null ? e.s : 0; const o = 1 - s;
  const ballX = e ? rx(s, Math.max(0, Math.min(100, e.from != null ? e.from : e.x || 50))) : 60;
  const dir = s === 0 ? 1 : -1;
  // Formation: forwards near the ball, backs in a diagonal line behind.
  const form = (side, bx, att) => xv[side].map((p, i) => {
    const d2 = side === s ? -dir : dir;
    if (p.fwd) return { x: bx + d2 * (1 + (i % 3) * 1.2) * (att ? 1 : 0.6), y: RP.h / 2 + ((i % 8) - 3.5) * 2.2 };
    const bi = i - 8; const off = [0, 1, -1, 2, -2, 3, -3][bi] || 0; return { x: bx + d2 * (4 + Math.abs(off) * 2.6), y: RP.h / 2 + off * 9 };
  });
  out.P[s] = form(s, ballX, true); out.P[o] = form(o, ballX + dir * 1.5, false);
  out.ball = { x: ballX, y: RP.h / 2, h: 0 };
  if (beat.type !== 'ev') return out;
  const k = (a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));
  const idx = (side, name) => xv[side].findIndex((p) => p.name === name);
  if (e.kind === 'try' || e.kind === 'break') {
    const ci = Math.max(0, idx(s, e.kind === 'try' && e.breaker ? e.breaker : e.p));
    const fi = Math.max(0, idx(s, e.p));
    const endX = e.kind === 'try' ? rx(s, 103) : rx(s, Math.min(98, (e.from || 50) + 35));
    const laneY = e.how === 'maul' || e.how === 'close' ? RP.h / 2 : 10 + unit('lane', e.i) * 50;
    const runK = easeC(k(0.4, e.kind === 'try' ? 2.8 : 2.4));
    const start = out.P[s][ci];
    if (e.how === 'maul' || e.how === 'close') {
      out.P[s] = out.P[s].map((p, i) => (xv[s][i].fwd ? { x: p.x + dir * runK * 6, y: RP.h / 2 + ((i % 8) - 3.5) * 1.4 } : p));
      out.P[o] = out.P[o].map((p, i) => (xv[o][i].fwd ? { x: p.x + dir * runK * 5, y: RP.h / 2 + ((i % 8) - 3.5) * 1.4 } : p));
      out.ball = { x: rx(s, Math.min(101, (e.x || 95) + runK * 8)), y: RP.h / 2, h: 0 };
    } else {
      const runner = { x: start.x + (endX - start.x) * runK, y: start.y + (laneY - start.y) * runK };
      out.P[s][ci] = runner;
      if (fi !== ci && runK > 0.75) out.P[s][fi] = { x: runner.x - dir * 2, y: runner.y + 3 };
      out.P[o] = out.P[o].map((p, i) => ({ x: p.x + (runner.x - p.x) * runK * 0.55, y: p.y + (runner.y - p.y) * runK * 0.5 }));
      out.ball = { ...(fi !== ci && runK > 0.85 ? out.P[s][fi] : runner), h: 0 };
    }
    if (e.kind === 'try') {
      if (u > 2.8 && u < 3.6) out.banner = 'TRY!';
      if (u >= 3.6) { const post = { x: s === 0 ? 110 : 10, y: RP.h / 2 }; const kick = { x: rx(s, 78), y: 18 + unit('conv', e.i) * 34 }; const kk = k(3.7, 4.5); out.ball = kk <= 0 ? { ...kick, h: 0 } : { x: kick.x + (post.x - kick.x) * kk, y: kick.y + (post.y + (e.conv ? 0 : 6) - kick.y) * kk, h: Math.sin(kk * Math.PI) * 9 + kk * 2 }; if (u > 4.5) out.banner = e.conv ? 'CONVERTED!' : 'MISSED'; }
    } else if (u > 1.2) out.banner = 'LINE BREAK!';
    return out;
  }
  if (e.kind === 'pen' || e.kind === 'drop' || e.kind === 'kickcomp') {
    const post = { x: s === 0 ? 110 : 10, y: RP.h / 2 };
    const spot = e.kind === 'kickcomp' ? { x: rx(s, 78), y: 20 + unit('kc', e.i) * 30 } : { x: rx(s, Math.min(95, e.x || 70)), y: 16 + unit('pk', e.i) * 38 };
    const kk = k(1.0, 2.2);
    out.ball = kk <= 0 ? { ...spot, h: 0 } : { x: spot.x + (post.x - spot.x) * kk, y: spot.y + (post.y + (e.good ? 0 : (unit('w', e.i) < 0.5 ? -7 : 7)) - spot.y) * kk, h: Math.sin(kk * Math.PI) * 10 + kk * 3 };
    if (e.kind === 'pen') { out.P[s] = out.P[s].map((p) => ({ x: p.x - dir * 8, y: p.y })); }
    if (u > 2.2) out.banner = e.kind === 'drop' ? (e.good ? 'DROP GOAL!' : 'WIDE!') : e.good ? 'OVER!' : 'WIDE!';
    return out;
  }
  if (e.kind === 'turnover') { if (u > 0.8) { out.banner = 'TURNOVER!'; const ji = idx(s, e.b); if (ji >= 0) out.flash = out.P[s][ji]; } return out; }
  if (e.kind === 'tackle') { const ti = idx(s, e.b); const ci = idx(o, e.p); if (ti >= 0 && ci >= 0) { out.P[s][ti] = { x: out.P[o][ci].x - dir * 0.6 * k(0.3, 0.9), y: out.P[o][ci].y }; out.flash = out.P[o][ci]; } if (u > 0.9) out.banner = 'BIG HIT!'; return out; }
  if (e.kind === 'card') { out.card = k(0.2, 0.6); if (u > 0.5) out.banner = 'YELLOW CARD'; const ci = idx(s, e.p); if (ci >= 0) out.flash = out.P[s][ci]; return out; }
  if (e.kind === 'scrum') { [0, 1].forEach((side) => { out.P[side] = out.P[side].map((p, i) => (xv[side][i].fwd ? { x: ballX + (side === s ? -1 : 1) * dir * (1 + Math.floor(i / 3)), y: RP.h / 2 + ((i % 3) - 1) * 1.2 } : p)); }); if (u > 1.2 && e.pen != null) out.banner = 'SCRUM PENALTY!'; return out; }
  if (e.kind === 'et') out.banner = 'GOLDEN POINT';
  if (e.kind === 'kcwin') out.banner = 'KICKING COMPETITION WON';
  return out;
}

function RugbyView({ d, A, B, match, speed, onDone, label }) {
  const script = useMemo(() => rugbyScript(match), [match]);
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
  useEffect(() => { if (done && !fired.current) { fired.current = true; audio.play('whistle'); onDone && onDone(); } }, [done]);
  const bi = Math.max(0, script.beats.findIndex((b) => t < b.t0 + b.dur));
  const beat = done ? script.beats[script.beats.length - 1] : script.beats[bi];
  const u = done ? beat.dur : t - beat.t0;
  const xv = match.xv;
  const evNow = beat.type === 'ev' || beat.type === 'ht' ? beat.e : beat.type === 'roll' ? beat.evs[Math.min(beat.evs.length - 1, Math.floor((u / beat.dur) * beat.evs.length))] : null;
  const fr = rugbyFrame(beat.type === 'roll' ? { type: 'roll', e: evNow } : beat, u, xv);
  const prevScore = (e) => { const p = match.plays[e.i - 1]; return p ? p.score : [0, 0]; };
  const scoredAt = (e) => (e.kind === 'try' ? 2.8 : e.kind === 'pen' || e.kind === 'drop' ? 2.2 : 0);
  const score = done || beat.type === 'final' ? match.score : evNow ? (beat.type === 'ev' && u < scoredAt(evNow) ? prevScore(evNow) : evNow.score) : [0, 0];
  const status = done || beat.type === 'final' ? (match.golden ? 'FINAL/ET' : 'FULL-TIME') : beat.type === 'intro' ? 'KICK-OFF' : beat.type === 'ht' ? 'HALF-TIME' : evNow ? rugbyMin(evNow.t) : '';
  const colors = [A.color, B.color];
  const short = (n) => { const w = String(n || '').split(' '); return w[w.length - 1].slice(0, 10); };
  const banner = done ? null : beat.type === 'intro' ? 'KICK-OFF' : beat.type === 'ht' ? 'HALF-TIME' : beat.type === 'final' ? 'FULL-TIME' : fr.banner;
  const lastBeat = useRef(-1);
  useEffect(() => { if (!playing || done || bi === lastBeat.current) return; lastBeat.current = bi; if (beat.type === 'ht' || beat.type === 'intro') audio.play('whistle'); }, [bi]);
  const said = useRef({});
  useEffect(() => { if (!playing || done || beat.type !== 'ev' || said.current[bi] || u < scoredAt(beat.e) || !scoredAt(beat.e)) return; said.current[bi] = true; const e = beat.e; if (e.kind === 'try') { audio.play('cheer'); audio.say('Try, ' + e.p + '!', 2, d.id + ':' + label + ':t' + bi); } else if (e.good) audio.play('bid'); }, [t]);
  const feed = [];
  script.beats.forEach((b, k2) => {
    if (!done && b.t0 + b.dur * 0.75 > t) return;
    if (b.type === 'ev') feed.push({ k: k2, tag: rugbyMin(b.e.t), team: b.e.s, big: b.e.big, text: b.e.text });
    else if (b.type === 'ht') feed.push({ k: k2, tag: 'HT', text: b.e.text, half: true });
  });
  const feedRef = useRef(null);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [feed.length]);
  const binned = evNow ? [0, 1].map((s2) => match.plays.filter((e) => e.kind === 'card' && e.s === s2 && e.t <= evNow.t && evNow.t < e.t + 600).length) : [0, 0];
  return (
    <div className="matchview rugbyview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid"><span className="sb-score num" aria-live="polite">{score[0]}–{score[1]}</span><span className="sb-clock num">{status}</span></div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      <div className="boutbar small"><span className="muted">Rugby union · 15 a side</span>{binned[0] || binned[1] ? <span className="muted"> · 🟨 {binned[0] ? A.name + ' down to ' + (15 - binned[0]) : ''}{binned[0] && binned[1] ? ', ' : ''}{binned[1] ? B.name + ' down to ' + (15 - binned[1]) : ''}</span> : null}</div>
      <div className="pitchwrap">
        <svg className="pitchsvg rugbysvg" viewBox={'-2 -2 ' + (RP.w + 4) + ' ' + (RP.h + 4)} role="img" aria-label={'Rugby: ' + A.name + ' ' + score[0] + ', ' + B.name + ' ' + score[1] + ', ' + status}>
          <rect x="-2" y="-2" width={RP.w + 4} height={RP.h + 4} fill="#2f6b2a" />
          {Array.from({ length: 10 }, (_, i) => <rect key={i} x={10 + i * 10} y="0" width="10" height={RP.h} fill={i % 2 ? '#3f8a37' : '#47963e'} />)}
          <rect x="0" y="0" width="10" height={RP.h} fill={A.color} opacity=".4" /><rect x="110" y="0" width="10" height={RP.h} fill={B.color} opacity=".4" />
          <g stroke="rgba(255,255,255,.85)" strokeWidth="0.35" fill="none"><rect x="0" y="0" width={RP.w} height={RP.h} />{[10, 32, 60, 88, 110].map((x2) => <line key={x2} x1={x2} y1="0" x2={x2} y2={RP.h} strokeDasharray={x2 === 60 || x2 === 10 || x2 === 110 ? '' : ''} />)}{[20, 50, 70, 100].map((x2) => <line key={'d' + x2} x1={x2} y1="0" x2={x2} y2={RP.h} strokeDasharray="1.5 1.5" opacity=".6" />)}</g>
          {[10, 110].map((x2) => <g key={'p' + x2} stroke="#fff" strokeWidth="0.6"><line x1={x2} y1={RP.h / 2 - 3} x2={x2} y2={RP.h / 2 + 3} /><circle cx={x2} cy={RP.h / 2 - 3} r="0.6" fill="#fff" /><circle cx={x2} cy={RP.h / 2 + 3} r="0.6" fill="#fff" /></g>)}
          {beat.type !== 'intro' && [0, 1].map((side) => xv[side].map((pl, i) => { const p = fr.P[side][i]; if (!p) return null; const named = !pl.avg; return <g key={side + '-' + i} transform={'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ')'}><circle r={named ? 1.45 : 1.15} fill={colors[side]} stroke={named ? '#fff' : 'rgba(0,0,0,.45)'} strokeWidth={named ? 0.4 : 0.25} />{named && <text y="-2" textAnchor="middle" fontSize="2" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{short(pl.name)}</text>}</g>; }))}
          {fr.ball && <g><ellipse cx={fr.ball.x} cy={fr.ball.y + 0.3} rx="0.8" ry="0.4" fill="rgba(0,0,0,.3)" /><ellipse cx={fr.ball.x} cy={fr.ball.y - (fr.ball.h || 0) * 0.45} rx="1" ry="0.65" fill="#f4f1ea" stroke="#8a4a1f" strokeWidth="0.2" /></g>}
          {fr.flash && <circle cx={fr.flash.x} cy={fr.flash.y} r="3" fill="none" stroke="#ffd23d" strokeWidth="0.5" />}
          {fr.card != null && <rect x={60 - 3} y={18 - 4 * fr.card} width="6" height="8" rx="0.8" fill="#ffd23d" stroke="#0f0c21" strokeWidth="0.3" />}
          {(done || beat.type === 'final') && <g><rect x="-2" y="-2" width={RP.w + 4} height={RP.h + 4} fill="rgba(15,12,33,.55)" /><text x="60" y="30" textAnchor="middle" fontSize="8" fontWeight="900" fill={colors[match.winner]} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke">{(match.winner === 0 ? A : B).name.toUpperCase().slice(0, 16)} WIN</text><text x="60" y="40" textAnchor="middle" fontSize="6" fontWeight="900" fill="#ffc83d">{match.score[0]}–{match.score[1]}</text></g>}
          {banner && <text x="60" y="12" textAnchor="middle" fontSize={banner.length > 14 ? 6 : 8} fontWeight="900" fill={/TRY|CONVERTED|OVER|DROP|BREAK|TURNOVER|YELLOW|HIT|PENALTY|WON/.test(banner) ? '#ffc83d' : '#fff'} stroke="#0f0c21" strokeWidth="0.7" paintOrder="stroke" className="pbanner">{banner}</text>}
        </svg>
      </div>
      <div className="mctrl" role="group" aria-label="Match controls">
        {!done && <button className="btn btn-sm" onClick={() => setPlaying((x) => !x)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸ Pause' : '▶ Play'}</button>}
        {!done && [1, 2, 4].map((x) => <button key={x} className={'btn btn-sm' + (mult === x ? ' btn-gold' : '')} aria-pressed={mult === x} onClick={() => setMult(x)}>{x}×</button>)}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => setT(script.total)}>Skip to result</button>}
        {done && <button className="btn btn-sm" onClick={() => { fired.current = true; said.current = {}; setT(0); setPlaying(true); }}>↺ Watch again</button>}
      </div>
      <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map((e) => <p key={e.k} className={'mev ' + (e.big ? 'goal' : e.half ? 'half' : '') + (e.team != null ? ' t' + e.team : '')}><span className="mm num">{e.tag}</span><span>{e.big ? '🏉 ' : ''}{e.text}{e.team != null ? <small> · {(e.team === 0 ? A : B).name}</small> : null}</span></p>)}
      </div>
      {done && <RugbySummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}
function rugbyReport(d, A, B, match) {
  const T = [A, B];
  const rows = [0, 1].flatMap((s) => Object.entries(match.box[s]).map(([name, b]) => ({ team: s, name, ...b, avg: !!(match.xv[s].find((p) => p.name === name) || {}).avg, gs: b.pts * 1.2 + b.tries * 4 + b.breaks * 2 + b.metres / 15 + b.turnovers * 3 + b.tackles * 0.3 })));
  const real = rows.filter((r) => !r.avg);
  const potm = real.filter((r) => r.team === match.winner).sort((x, y) => y.gs - x.gs)[0] || null;
  const price = (s, name) => { const e = T[s].team.find((x) => x && d.items[x.itemId] && d.items[x.itemId].name === name); return e ? e.price || 0 : 0; };
  const wp = real.map((r) => ({ ...r, price: price(r.team, r.name) }));
  const best = wp.filter((r) => r.gs > 4 && r.price > 0).sort((x, y) => y.gs / y.price - x.gs / x.price)[0] || null;
  const flop = wp.filter((r) => r.price >= 3).sort((x, y) => x.gs / x.price - y.gs / y.price)[0] || null;
  const tries = [0, 1].map((s) => match.plays.filter((e) => e.kind === 'try' && e.s === s));
  return { rows: real, potm, best, flop, tries };
}
const rugbyStat = (r) => [r.tries ? r.tries + ' tr' + (r.tries > 1 ? 'ies' : 'y') : '', r.pts && r.pts !== r.tries * 5 ? r.pts + ' pts' : '', r.carries ? r.carries + ' carries, ' + r.metres + ' m' : '', r.breaks ? r.breaks + ' line break' + (r.breaks > 1 ? 's' : '') : '', r.tackles ? r.tackles + ' tackles' : '', r.turnovers ? r.turnovers + ' turnover' + (r.turnovers > 1 ? 's' : '') : ''].filter(Boolean).join(', ');
function RugbySummary({ d, A, B, match }) {
  const R = rugbyReport(d, A, B, match); const T = (i) => (i === 0 ? A : B);
  return (
    <div className="board msummary">
      <h3>🏉 Match summary</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {match.score[0]}–{match.score[1]} {B.name}</b> · half-time {match.halves[0][0]}–{match.halves[0][1]}{match.golden ? ' · decided in extra time' : ''}</p>
      {[0, 1].map((s) => <p key={s} className="small" style={{ margin: 0 }}><b>{T(s).name}:</b> {R.tries[s].length ? 'tries ' + R.tries[s].map((e) => e.p + ' ' + rugbyMin(e.t)).join(', ') : 'no tries'}</p>)}
      <div className="mreport">
        <h4>📋 Match report</h4>
        {R.potm && <p className="small"><b>⭐ Player of the Match:</b> {R.potm.name} ({T(R.potm.team).name}) — {rugbyStat(R.potm)}.</p>}
        {R.best && R.best !== R.potm && <p className="small"><b>💰 Best buy:</b> {R.best.name} — ${R.best.price}: {rugbyStat(R.best)}.</p>}
        {R.flop && <p className="small"><b>📉 Quiet day:</b> {R.flop.name} cost ${R.flop.price}{rugbyStat(R.flop) ? ': ' + rugbyStat(R.flop) : ''}.</p>}
      </div>
      <p className="hint" style={{ margin: 0 }}>Simulated phase by phase from Draft Night’s estimated Prime numbers (not official ratings). Your five play their real positions; the other ten are average players.</p>
    </div>
  );
}
function RugbyChip({ item, topic }) {
  const [open, setOpen] = useState(false);
  if (!numbersShown()) return null;
  const r = rugbyRating(item);
  return (
    <>
      <button type="button" className="ratingchip" onClick={() => setOpen(true)} aria-label={'Prime ' + r.ovr + ', estimated. Show details'}>Prime <b className="num">{r.ovr}</b> est.</button>
      {open && ReactDOM.createPortal(
        <Sheet center onClose={() => setOpen(false)}>
          <div className="ratingcard">
            <div className="rc-top"><span className="rc-ovr num"><small className="rc-era">Prime</small>{r.ovr}</span><span className="rc-role">{r.fwd ? 'FWD' : 'BACK'}</span><span className="rc-name">{item.name}<br /><small>{r.pos}</small></span></div>
            <div className="rc-attrs">{RUGBY_ATTRS.map((a) => <div key={a} className="rc-attr"><span className="k" title={RUGBY_ATTR_NAMES[a]}>{a}</span><span className="bar"><i style={{ width: r.attrs[a] + '%' }} /></span><span className="v num">{r.attrs[a]}</span></div>)}</div>
            <p className="hint" style={{ margin: 0 }}>Prime: how good they were at their peak (for current players, their best so far). {RUGBY_ATTRS.map((a) => a + ' ' + RUGBY_ATTR_NAMES[a].toLowerCase()).join(' · ')}. Draft Night estimate, not an official rating.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
        </Sheet>, document.body)}
    </>
  );
}
