/* ============================================================
   GOLF screen (rules in 29-golf.js). A hole seen from above: tee,
   fairway, rough, bunkers, water and the green. On the big holes both
   balls are played shot by shot — drives finding the fairway (or the
   water), approaches, chips, bunker shots and putts — and the match
   board shows who's up. Other holes roll by on the board, so the
   score always matches the recorded matches.
   ============================================================ */
const GH = { teeY: 57, greenY: 9, cx: 50 };
function golfScript(match) {
  const beats = []; let t = 0;
  const add = (b) => { b.t0 = t; t += b.dur; beats.push(b); return b; };
  add({ type: 'intro', dur: 2.6 });
  match.matches.forEach((m, mi) => {
    add({ type: 'first', dur: 2.4, mi });
    let roll = [];
    const flush = () => { if (!roll.length) return; add({ type: 'roll', dur: Math.min(2.6, 0.4 + roll.length * 0.22), mi, holes: roll }); roll = []; };
    m.holes.forEach((h) => {
      if (!h.hl) { roll.push(h); return; }
      flush();
      const n = Math.max(...h.best.map((b) => (b.shots || []).length));
      add({ type: 'hole', dur: 1.4 + n * 2 * 0.62 + 1.8, mi, h, n });
    });
    flush();
    add({ type: 'result', dur: 2.8, mi });
  });
  add({ type: 'final', dur: 2.8 });
  return { beats, total: t };
}
// Where a ball is after a shot (yards from the hole, or feet once on the green).
const golfSpot = (shot, side, len) => {
  if (!shot) return { x: GH.cx + (side ? 1.5 : -1.5), y: GH.teeY };
  if (shot.lie === 'hole' || shot.made) return { x: GH.cx, y: GH.greenY };
  if (shot.k === 'putt') { const ft = shot.left != null ? shot.left : 0; return { x: GH.cx + (side ? 1 : -1) * Math.min(5, ft / 6), y: GH.greenY + Math.min(4, ft / 8) }; }
  if (shot.lie === 'green') { const ft = shot.ft != null ? shot.ft : 10; return { x: GH.cx + (side ? 1 : -1) * Math.min(6, ft / 5), y: GH.greenY + Math.min(5, ft / 7) }; }
  const f = Math.max(0, Math.min(1, shot.to / len));
  const bend = Math.sin(f * Math.PI) * 9;
  return { x: GH.cx + bend + (shot.x || 0) * 14 + (shot.lie === 'water' ? 16 : 0), y: GH.greenY + f * (GH.teeY - GH.greenY) };
};
function golfFrame(beat, u) {
  const out = { balls: [null, null], banner: null, active: null };
  if (beat.type !== 'hole') return out;
  const h = beat.h; const per = 0.62; const t0 = 1.0;
  const step = Math.floor((u - t0) / per); const kk = ((u - t0) / per) % 1;
  [0, 1].forEach((side) => {
    const shots = h.best[side].shots || [];
    // Side's shot i is played at step 2*i + side.
    let spot = golfSpot(null, side, h.len); let h2 = 0; let doneN = 0;
    for (let i = 0; i < shots.length; i++) {
      const at = 2 * i + side;
      if (step > at) { spot = golfSpot(shots[i], side, h.len); doneN = i + 1; }
      else if (step === at) {
        const from = i ? golfSpot(shots[i - 1], side, h.len) : spot; const to = golfSpot(shots[i], side, h.len);
        const putt = shots[i].k === 'putt';
        spot = { x: from.x + (to.x - from.x) * easeC(kk), y: from.y + (to.y - from.y) * easeC(kk) };
        h2 = putt ? 0 : Math.sin(kk * Math.PI) * (shots[i].k === 'drive' ? 8 : 5);
        out.active = side;
        if (kk > 0.75) {
          const s = shots[i];
          out.banner = s.k === 'ace' ? 'HOLE-IN-ONE!!' : s.k === 'chipin' ? 'CHIP-IN!' : s.k === 'holeout' ? 'HOLED IT!' : s.lie === 'water' ? 'IN THE WATER!' : s.lie === 'bunker' ? 'BUNKER' : s.k === 'putt' && s.made ? (s.ft >= 25 ? 'FROM ' + s.ft + ' FEET!' : h.best[side].strokes < h.par ? (h.par - h.best[side].strokes >= 2 ? 'EAGLE!' : 'BIRDIE!') : 'IN!') : s.k === 'putt' ? 'JUST MISSES' : null;
        }
        doneN = i;
        break;
      }
    }
    const holed = doneN >= shots.length && shots.length > 0;
    out.balls[side] = { ...spot, h: h2, holed };
  });
  const lastStep = Math.max(h.best[0].shots ? h.best[0].shots.length * 2 - 2 : 0, h.best[1].shots ? h.best[1].shots.length * 2 - 1 : 0);
  if (step > lastStep) out.banner = h.w == null ? 'HALVED' : h.best[h.w].p.split(' ').slice(-1)[0].toUpperCase() + ' WINS THE HOLE';
  return out;
}

function GolfView({ d, A, B, match, speed, onDone, label }) {
  const script = useMemo(() => golfScript(match), [match]);
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
  useEffect(() => { if (done && !fired.current) { fired.current = true; audio.play('fanfare'); onDone && onDone(); } }, [done]);
  const bi = Math.max(0, script.beats.findIndex((b) => t < b.t0 + b.dur));
  const beat = done ? script.beats[script.beats.length - 1] : script.beats[bi];
  const u = done ? beat.dur : t - beat.t0;
  const T = (i) => (i === 0 ? A : B);
  const mi = beat.mi != null ? beat.mi : match.matches.length - 1;
  const m = match.matches[Math.max(0, mi)];
  const fr = golfFrame(beat, u);
  // Match status at this moment.
  let holeNow = null;
  if (beat.type === 'hole') holeNow = u > beat.dur - 1.6 ? beat.h : m.holes[beat.h.n - 2] || null;
  else if (beat.type === 'roll') holeNow = beat.holes[Math.min(beat.holes.length - 1, Math.floor((u / beat.dur) * beat.holes.length))];
  else if (beat.type === 'result' || beat.type === 'final' || done) holeNow = m.holes[m.holes.length - 1] || null;
  const up = holeNow ? holeNow.up : 0; const thru = holeNow ? holeNow.n : 0;
  const nm = (side) => (side === 0 ? m.a : m.b).map((p) => p.name.split(' ').slice(-1)[0]).join(' & ');
  const statusTxt = m.result.how === 'walkover' ? 'Walkover' : (up === 0 ? 'All square' : nm(up > 0 ? 0 : 1) + ' ' + Math.abs(up) + ' UP') + (thru ? ' thru ' + thru : '');
  const decided = (k) => k < mi || (k === mi && beat.type === 'result' && u > 0.6) || beat.type === 'final' || done;
  const pts = [0, 1].map((s) => match.matches.reduce((n, x, k) => n + (decided(k) ? (x.result.w == null ? 0.5 : x.result.w === s ? 1 : 0) : 0), 0));
  const colors = [A.color, B.color];
  const hole = beat.type === 'hole' ? beat.h : null;
  const banner = done ? null : beat.type === 'intro' ? 'DRAFT NIGHT CUP' : beat.type === 'first' ? m.label.toUpperCase() : beat.type === 'result' ? (m.result.w == null ? 'MATCH HALVED' : nm(m.result.w).toUpperCase().slice(0, 18) + ' WIN' + ((m.result.w === 0 ? m.a : m.b).length > 1 ? '' : 'S')) : beat.type === 'final' ? 'FINAL' : fr.banner;
  const lastBeat = useRef(-1);
  useEffect(() => { if (!playing || done || bi === lastBeat.current) return; lastBeat.current = bi; if (beat.type === 'result') audio.play('cheer'); }, [bi]);
  const said = useRef({});
  useEffect(() => { if (!playing || done || !fr.banner || said.current[bi + fr.banner]) return; said.current[bi + fr.banner] = true; if (/HOLE-IN-ONE|CHIP-IN|EAGLE|FEET|HOLED/.test(fr.banner)) { audio.play('cheer'); } else if (/BIRDIE|IN!/.test(fr.banner)) audio.play('bid'); else if (/WATER/.test(fr.banner)) audio.play('buzzer'); }, [t]);
  const feed = [];
  script.beats.forEach((b, k2) => {
    if (!done && b.t0 + b.dur * 0.8 > t) return;
    const mm = match.matches[b.mi];
    const who = (side) => (side === 0 ? mm.a : mm.b).map((p) => p.name).join(' & ');
    if (b.type === 'first') feed.push({ k: k2, tag: mm.format === 'fourball' ? 'FB' : mm.format === 'playoff' ? 'PO' : 'S', text: mm.label + ': ' + who(0) + ' vs ' + who(1), half: true });
    else if (b.type === 'hole') { const h = b.h; const sh = h.best.map((x) => x.p + ' ' + golfScoreName(x.strokes, h.par).toLowerCase()); const note = h.notes.map((x, s) => (x === 'ace' ? h.best[s].p + ' makes a HOLE-IN-ONE! ' : x === 'chipin' ? h.best[s].p + ' holes out from off the green! ' : x === 'eagle' ? h.best[s].p + ' eagles! ' : x === 'bomb' ? h.best[s].p + ' drains a long putt! ' : x === 'water' ? h.best[s].p + ' finds the water. ' : '')).join(''); feed.push({ k: k2, tag: 'H' + h.n, team: h.w, big: h.notes.some((x) => x === 'ace' || x === 'chipin' || x === 'eagle'), text: note + (h.w == null ? 'Halved (' + sh.join(', ') + ').' : who(h.w) + ' win the hole (' + sh.join(' v ') + '). ' + golfStatus(h.up, [who(0), who(1)]) + '.') }); }
    else if (b.type === 'result') feed.push({ k: k2, tag: '⛳', team: mm.result.w, big: true, text: golfLine(mm) + ' Cup: ' + golfPts(mm.pts[0]) + '–' + golfPts(mm.pts[1]) + '.' });
  });
  const feedRef = useRef(null);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [feed.length]);
  const showMatchBoard = beat.type !== 'intro' && beat.type !== 'final' && !done;
  return (
    <div className="matchview golfview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid"><span className="sb-score num" aria-live="polite">{golfPts(pts[0])}–{golfPts(pts[1])}</span><span className="sb-clock num">{done || beat.type === 'final' ? 'FINAL' : beat.type === 'intro' ? 'FIRST TEE' : m.label.toUpperCase()}</span></div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      <div className="boutbar small">{showMatchBoard ? <><b>{nm(0)}</b> <span className="muted">vs</span> <b>{nm(1)}</b> <span className="muted">· {statusTxt}</span></> : <span className="muted">Match play · wind {match.wind < 1 ? 'calm' : match.wind < 2 ? 'breezy' : 'strong'}</span>}{hole && <span className="boutstats">Hole {hole.n} · par {hole.par} · {hole.len} yards</span>}</div>
      <div className="pitchwrap">
        <svg className="pitchsvg golfsvg" viewBox="0 0 100 64" role="img" aria-label={'Golf: ' + m.label + ', ' + statusTxt}>
          <rect x="0" y="0" width="100" height="64" fill="#2f7a31" />
          {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={unit('tree', i) < 0.5 ? 4 + unit('tx', i) * 14 : 82 + unit('tx', i) * 14} cy={4 + unit('ty', i) * 56} r={2.4 + unit('tr', i) * 1.6} fill="#1f5a23" />)}
          <path d={'M' + (GH.cx - 6) + ' ' + GH.teeY + ' C ' + (GH.cx + 4) + ' 44, ' + (GH.cx + 16) + ' 30, ' + (GH.cx + 2) + ' ' + (GH.greenY + 6) + ' L ' + (GH.cx + 12) + ' ' + (GH.greenY + 8) + ' C ' + (GH.cx + 26) + ' 30, ' + (GH.cx + 16) + ' 44, ' + (GH.cx + 6) + ' ' + GH.teeY + ' Z'} fill="#5fb44c" />
          {Array.from({ length: 7 }, (_, i) => <rect key={i} x="30" y={14 + i * 6} width="40" height="3" fill="rgba(255,255,255,.04)" />)}
          {(!hole || hole.par !== 3) && <ellipse cx={GH.cx + 26} cy="32" rx="6" ry="4" fill="#3d8fd1" stroke="#2a6fa8" strokeWidth="0.4" />}
          <ellipse cx={GH.cx - 7} cy={GH.greenY + 5} rx="3.6" ry="2.2" fill="#e8d6a0" /><ellipse cx={GH.cx + 16} cy="38" rx="3" ry="1.8" fill="#e8d6a0" />
          <ellipse cx={GH.cx} cy={GH.greenY} rx="9" ry="5.5" fill="#7fd06a" stroke="#4e9a3c" strokeWidth="0.4" />
          <circle cx={GH.cx} cy={GH.greenY} r="0.55" fill="#111" />
          <line x1={GH.cx} y1={GH.greenY} x2={GH.cx} y2={GH.greenY - 5} stroke="#fff" strokeWidth="0.25" /><path d={'M' + GH.cx + ' ' + (GH.greenY - 5) + ' L' + (GH.cx + 3) + ' ' + (GH.greenY - 4.2) + ' L' + GH.cx + ' ' + (GH.greenY - 3.4) + ' Z'} fill="#e2463b" />
          <rect x={GH.cx - 4} y={GH.teeY - 1} width="8" height="3" rx="0.8" fill="#7fd06a" />
          {hole && fr.balls.map((b, s) => b && !b.holed ? <g key={s}><ellipse cx={b.x} cy={b.y + 0.3} rx="0.6" ry="0.3" fill="rgba(0,0,0,.3)" /><circle cx={b.x} cy={b.y - (b.h || 0) * 0.45} r={0.75 + (b.h || 0) * 0.04} fill="#fff" stroke={colors[s]} strokeWidth="0.45" /></g> : null)}
          {hole && [0, 1].map((s) => <text key={s} x={s === 0 ? 4 : 96} y="60" textAnchor={s === 0 ? 'start' : 'end'} fontSize="2.6" fontWeight="800" fill={colors[s]} stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{hole.best[s].p.split(' ').slice(-1)[0]}{fr.balls[s] && fr.balls[s].holed ? ' · ' + hole.best[s].strokes : ''}</text>)}
          {(beat.type === 'intro' || beat.type === 'first') && <g><rect x="0" y="0" width="100" height="64" fill="rgba(15,12,33,.55)" />{beat.type === 'intro' && match.matches.map((mm, k2) => <text key={k2} x="50" y={24 + k2 * 4.6} textAnchor="middle" fontSize="2.8" fontWeight="700" fill="#fff">{mm.label}: {mm.a.map((p) => p.name.split(' ').slice(-1)[0]).join('/') || '—'} v {mm.b.map((p) => p.name.split(' ').slice(-1)[0]).join('/') || '—'}</text>)}{beat.type === 'first' && [0, 1].map((s) => <g key={s} transform={'translate(' + (s === 0 ? 25 : 75) + ' 30)'}>{(s === 0 ? m.a : m.b).map((p, k3) => <text key={k3} y={k3 * 5} textAnchor="middle" fontSize="3.6" fontWeight="900" fill={colors[s]} stroke="#0f0c21" strokeWidth="0.5" paintOrder="stroke">{p.name.toUpperCase().slice(0, 18)}</text>)}</g>)}{beat.type === 'first' && <text x="50" y="31" textAnchor="middle" fontSize="5" fontWeight="900" fill="#ffc83d">VS</text>}</g>}
          {(done || beat.type === 'final') && <g><rect x="0" y="0" width="100" height="64" fill="rgba(15,12,33,.6)" /><text x="50" y="26" textAnchor="middle" fontSize="7" fontWeight="900" fill={colors[match.winner]} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke">{T(match.winner).name.toUpperCase().slice(0, 16)} WIN</text><text x="50" y="35" textAnchor="middle" fontSize="5" fontWeight="900" fill="#ffc83d">{golfPts(match.score[0])}–{golfPts(match.score[1])}</text></g>}
          {banner && <text x="50" y={beat.type === 'first' ? 16 : 32} textAnchor="middle" fontSize={banner.length > 18 ? 4.2 : banner.length > 14 ? 5 : 6.5} fontWeight="900" fill={/HOLE-IN|CHIP|EAGLE|BIRDIE|FEET|HOLED|WIN/.test(banner) ? '#ffc83d' : '#fff'} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke" className="pbanner">{banner}</text>}
        </svg>
      </div>
      <div className="mctrl" role="group" aria-label="Match controls">
        {!done && <button className="btn btn-sm" onClick={() => setPlaying((x) => !x)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸ Pause' : '▶ Play'}</button>}
        {!done && [1, 2, 4].map((x) => <button key={x} className={'btn btn-sm' + (mult === x ? ' btn-gold' : '')} aria-pressed={mult === x} onClick={() => setMult(x)}>{x}×</button>)}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => { const nb = script.beats.find((b) => b.type === 'first' && b.t0 > t + 0.01); setT(nb ? nb.t0 : script.total); }}>Next match</button>}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => setT(script.total)}>Skip to result</button>}
        {done && <button className="btn btn-sm" onClick={() => { fired.current = true; said.current = {}; setT(0); setPlaying(true); }}>↺ Watch again</button>}
      </div>
      <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map((e) => <p key={e.k} className={'mev ' + (e.big ? 'goal' : e.half ? 'half' : '') + (e.team != null ? ' t' + e.team : '')}><span className="mm num">{e.tag}</span><span>{e.big ? '⛳ ' : ''}{e.text}</span></p>)}
      </div>
      {done && <GolfSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}
function golfReport(d, A, B, match) {
  const tally = {};
  match.matches.forEach((m) => m.holes.forEach((h) => h.best.forEach((b, s) => { const k = s + '|' + b.p; tally[k] = tally[k] || { team: s, name: b.p, bird: 0, eag: 0, won: 0, special: [] }; const dd = b.strokes - h.par; if (dd === -1) tally[k].bird++; if (dd <= -2) tally[k].eag++; if (h.w === s) tally[k].won++; if (h.notes[s] === 'ace') tally[k].special.push('a hole-in-one on the ' + h.n + ordinalSuffix(h.n)); if (h.notes[s] === 'chipin') tally[k].special.push('a chip-in on the ' + h.n + ordinalSuffix(h.n)); })));
  const list = Object.values(tally).map((x) => ({ ...x, v: x.bird * 2 + x.eag * 5 + x.won * 1.5 + x.special.length * 4 }));
  const star = list.filter((x) => x.team === match.winner).sort((a, b) => b.v - a.v)[0] || null;
  const ppl = match.matches.filter((m) => m.format === 'singles').flatMap((m) => [0, 1].map((s) => ({ s, m, p: (s === 0 ? m.a : m.b)[0] }))).filter((x) => x.p);
  const best = ppl.filter((x) => x.m.result.w === x.s).sort((a, b) => a.p.price - b.p.price)[0] || null;
  const flop = ppl.filter((x) => x.m.result.w === 1 - x.s).sort((a, b) => b.p.price - a.p.price)[0] || null;
  const specials = list.flatMap((x) => x.special.map((s) => x.name + ': ' + s));
  return { star, best, flop, specials };
}
function GolfSummary({ d, A, B, match }) {
  const R = golfReport(d, A, B, match); const T = (i) => (i === 0 ? A : B);
  return (
    <div className="board msummary">
      <h3>⛳ The cup</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {golfPts(match.score[0])}–{golfPts(match.score[1])} {B.name}</b>{match.how === 'playoff' ? ' · decided in a sudden-death playoff' : ''}</p>
      <div className="fightcard">{match.matches.map((m, k) => <div key={k} className={'fc-row' + (m.format === 'playoff' ? ' main' : '')}><span className="fc-tag">{m.label}</span><span className="fc-line small">{golfLine(m)}</span></div>)}</div>
      <div className="mreport">
        <h4>📋 Cup report</h4>
        {R.star && <p className="small"><b>⭐ Star of the day:</b> {R.star.name} ({T(R.star.team).name}) — {R.star.bird} birdie{R.star.bird === 1 ? '' : 's'}{R.star.eag ? ', ' + R.star.eag + ' eagle' + (R.star.eag === 1 ? '' : 's') : ''}, {R.star.won} hole{R.star.won === 1 ? '' : 's'} won.</p>}
        {R.specials.length > 0 && <p className="small"><b>✨ Shots of the day:</b> {R.specials.join(' · ')}.</p>}
        {R.best && <p className="small"><b>💰 Best buy:</b> {R.best.p.name} cost ${R.best.p.price} and won their singles.</p>}
        {R.flop && <p className="small"><b>📉 Tough day:</b> {R.flop.p.name} cost ${R.flop.p.price} and lost their singles.</p>}
      </div>
      <p className="hint" style={{ margin: 0 }}>Every shot simulated from Draft Night’s estimated Prime numbers (not official ratings). Pound-for-pound: everyone plays the same tees.</p>
    </div>
  );
}
function GolfChip({ item, topic }) {
  const [open, setOpen] = useState(false);
  if (!numbersShown()) return null;
  const r = golfRating(item);
  return (
    <>
      <button type="button" className="ratingchip" onClick={() => setOpen(true)} aria-label={'Prime ' + r.ovr + ', estimated. Show details'}>Prime <b className="num">{r.ovr}</b> est.</button>
      {open && ReactDOM.createPortal(
        <Sheet center onClose={() => setOpen(false)}>
          <div className="ratingcard">
            <div className="rc-top"><span className="rc-ovr num"><small className="rc-era">Prime</small>{r.ovr}</span><span className="rc-role">GOLF</span><span className="rc-name">{item.name}</span></div>
            <div className="rc-attrs">{GOLF_ATTRS.map((a) => <div key={a} className="rc-attr"><span className="k" title={GOLF_ATTR_NAMES[a]}>{a}</span><span className="bar"><i style={{ width: r.attrs[a] + '%' }} /></span><span className="v num">{r.attrs[a]}</span></div>)}</div>
            <p className="hint" style={{ margin: 0 }}>Prime: how good they were at their peak (for current players, their best so far). {GOLF_ATTRS.map((a) => a + ' ' + GOLF_ATTR_NAMES[a].toLowerCase()).join(' · ')}. Draft Night estimate, not an official rating.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
        </Sheet>, document.body)}
    </>
  );
}
