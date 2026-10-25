/* ============================================================
   GRAND PRIX screen (rules in 29-f1.js). A top-down track map with
   every car moving at its simulated pace, a live timing tower, the
   start lights, pit stops, safety car, rain and the chequered flag.
   Each car's position comes straight from its recorded lap times,
   so overtakes on screen are the real ones from the simulation.
   ============================================================ */
const TYRE_COL = { S: '#e2463b', M: '#f2c14e', H: '#f4f1ea', I: '#3fbf5f' };
const TRACK_CACHE = {};
function trackGeo(id) {
  const cache = TRACK_CACHE;
  {
    if (cache[id]) return cache[id];
    const t = F1_TRACKS.find((x) => x.id === id) || F1_TRACKS[0];
    const P = t.pts.map(([x, y]) => ({ x, y })); const n = P.length; const pts = [];
    // Closed Catmull-Rom spline through the corner points.
    for (let i = 0; i < n; i++) {
      const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      for (let k = 0; k < 24; k++) {
        const u = k / 24, u2 = u * u, u3 = u2 * u;
        const f = (a, b, c, d2) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d2) * u2 + (-a + 3 * b - 3 * c + d2) * u3);
        pts.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
      }
    }
    const len = [0];
    for (let i = 1; i <= pts.length; i++) { const a = pts[i - 1], b = pts[i % pts.length]; len.push(len[i - 1] + Math.hypot(b.x - a.x, b.y - a.y)); }
    const total = len[len.length - 1];
    const d = 'M' + pts.map((p) => p.x.toFixed(2) + ' ' + p.y.toFixed(2)).join(' L') + ' Z';
    const at = (frac) => {
      const f = ((frac % 1) + 1) % 1; const target = f * total;
      let lo = 0, hi = len.length - 1;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (len[mid] <= target) lo = mid; else hi = mid; }
      const a = pts[lo % pts.length], b = pts[hi % pts.length]; const seg = len[hi] - len[lo] || 1; const u = (target - len[lo]) / seg;
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, ang: Math.atan2(b.y - a.y, b.x - a.x) };
    };
    return (cache[id] = { t, d, at, total });
  }
}

function gpScript(match) {
  const beats = []; let t = 0;
  const add = (b) => { b.t0 = t; t += b.dur; beats.push(b); return b; };
  add({ type: 'lights', dur: 4.6 });
  const hlLap = new Set(match.events.filter((e) => e.hl).map((e) => e.lap));
  for (let L = 1; L <= match.laps; L++) add({ type: 'lap', lap: L, dur: L === 1 ? 4 : L === match.laps ? 3.6 : hlLap.has(L) ? 3 : 1.9 });
  add({ type: 'flag', dur: 3.4 });
  return { beats, total: t };
}
// Race time at a moment of the animation: the first car to finish each lap sets the pace.
function gpRaceTime(match, beat, u) {
  if (beat.type === 'lights') return 0;
  const lead = (L) => Math.min(...match.cum.map((c) => (c[L] != null ? c[L] : Infinity)));
  if (beat.type === 'flag') return lead(match.laps) + 2 + u * 3;
  const a = beat.lap === 1 ? 0 : lead(beat.lap - 1), b = lead(beat.lap);
  return a + (b - a) * Math.min(1, u / beat.dur);
}
// How far round (in laps) each car is at race time T.
function gpDist(cum, T) {
  if (T <= cum[0]) return -(cum[0] - T) / 90 - 0.004;
  for (let j = 0; j < cum.length - 1; j++) if (T < cum[j + 1]) return j + (T - cum[j]) / (cum[j + 1] - cum[j]);
  return cum.length - 1;
}
const gpTimeAt = (cum, x) => { const j = Math.max(0, Math.min(cum.length - 2, Math.floor(x))); return cum[j] + (x - j) * (cum[j + 1] - cum[j]); };
const tyreAt = (stints, lap) => { let c = stints[0] ? stints[0][1] : 'M'; stints.forEach(([L, k]) => { if (L < lap) c = k; }); return c; };
function gpBanner(e, cars) {
  const s = (i) => f1Short(cars[i].name);
  if (e.kind === 'pass') return e.pos === 1 ? 'NEW LEADER! ' + s(e.car) : 'OVERTAKE! ' + s(e.car) + ' P' + e.pos;
  if (e.kind === 'pit') return 'PIT STOP · ' + s(e.car) + ' ' + e.stop.toFixed(1) + 's';
  if (e.kind === 'crash') return 'CRASH! ' + s(e.car) + ' OUT';
  if (e.kind === 'contact') return 'CONTACT!';
  if (e.kind === 'spin') return 'SPIN! ' + s(e.car);
  if (e.kind === 'dnf') return 'ENGINE FAILURE';
  if (e.kind === 'sc') return 'SAFETY CAR';
  if (e.kind === 'scend') return 'GREEN FLAG!';
  if (e.kind === 'rain') return 'RAIN!';
  if (e.kind === 'start') return 'LIGHTS OUT!';
  if (e.kind === 'flag') return 'CHEQUERED FLAG';
  return null;
}

function TrackView({ d, A, B, match, speed, onDone, label }) {
  const geo = trackGeo(match.track);
  const script = useMemo(() => gpScript(match), [match]);
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
  const T = done ? Infinity : gpRaceTime(match, beat, u);
  const lap = beat.type === 'lights' ? 0 : beat.type === 'flag' || done ? match.laps : beat.lap;
  const scLaps = useMemo(() => { const s2 = new Set(); let on = null; match.events.forEach((e) => { if (e.kind === 'sc') on = e.lap + 1; if (e.kind === 'scend' && on != null) { for (let L = on; L <= e.lap; L++) s2.add(L); on = null; } }); return s2; }, [match]);
  const cars = match.cars;
  const dist = cars.map((c, i) => { if (done) return match.laps + (match.dnf[i] != null ? -99 : 0); const x = gpDist(match.cum[i], T); return match.dnf[i] != null && x >= match.cum[i].length - 1 ? match.cum[i].length - 1 + 0.45 : x; });
  const out = cars.map((c, i) => match.dnf[i] != null && (done || lap >= match.dnf[i] && dist[i] >= match.cum[i].length - 1.001));
  const ordered = cars.map((c, i) => i).sort((x, y) => (out[x] - out[y]) || (done ? (match.result.findIndex((r) => r.car === x) - match.result.findIndex((r) => r.car === y)) : dist[y] - dist[x]));
  const leader = ordered[0];
  const colors = (i) => (cars[i].team === 0 ? A.color : cars[i].team === 1 ? B.color : '#8a8fa3');
  const wet = !!match.weather[Math.max(1, Math.min(match.laps, lap))] && beat.type !== 'lights';
  // Banner: the big moments of this lap, one after another.
  const lapEv = match.events.filter((e) => e.hl && e.lap === lap && beat.type === 'lap');
  const banner = done ? null : beat.type === 'lights' ? null : beat.type === 'flag' ? 'CHEQUERED FLAG' : lapEv.length ? gpBanner(lapEv[Math.min(lapEv.length - 1, Math.floor((u / beat.dur) * lapEv.length))], cars) : null;
  const sc = scLaps.has(lap) && beat.type === 'lap';
  // Sounds.
  const lastBeat = useRef(-1);
  useEffect(() => {
    if (!playing || done || bi === lastBeat.current) return;
    lastBeat.current = bi;
    if (beat.type === 'lap' && beat.lap === 1) audio.play('buzzer');
    if (beat.type === 'flag') { audio.play('cheer'); const w = cars[match.result[0].car]; audio.say(w.name + ' wins the ' + geo.t.name + '!', 2, d.id + ':' + label + ':gp'); }
    if (beat.type === 'lap' && lapEv.some((e) => e.kind === 'pass' && cars[e.car].team != null)) audio.play('bid');
    if (beat.type === 'lap' && lapEv.some((e) => e.kind === 'crash' || e.kind === 'sc')) audio.play('card');
  }, [bi]);
  const feed = [];
  match.events.forEach((e, k) => { if (!e.hl && e.kind !== 'fastest') return; if (!done && (e.lap > lap || (e.lap === lap && beat.type === 'lap' && u < beat.dur * 0.4))) return; feed.push({ k, e }); });
  const feedRef = useRef(null);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [feed.length]);
  const lightsOn = beat.type === 'lights' ? Math.min(5, Math.floor(u / 0.7)) : 0;
  const gap = (i) => { if (i === leader) return 'Leader'; if (out[i]) return 'OUT'; if (done) { const r = match.result.find((x) => x.car === i); return r && r.gap != null ? '+' + r.gap.toFixed(1) : 'OUT'; } const g = T - gpTimeAt(match.cum[leader], Math.max(0, dist[i])); return dist[i] < 0 ? 'Grid' : '+' + Math.max(0, g).toFixed(1); };
  const pitNow = (i) => !done && match.pits[i].includes(lap) && beat.type === 'lap';
  const status = done ? 'FINAL' : beat.type === 'lights' ? 'FORMATION' : beat.type === 'flag' ? 'FLAG' : 'LAP ' + lap + '/' + match.laps;
  return (
    <div className="matchview trackview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid">
          <span className="sb-score num" aria-live="polite">{done || beat.type === 'flag' ? match.score[0] + '–' + match.score[1] : 'P' + (ordered.findIndex((i) => cars[i].team === 0) + 1) + ' · P' + (ordered.findIndex((i) => cars[i].team === 1) + 1)}</span>
          <span className="sb-clock num">{status}</span>
        </div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      <div className="boutbar small"><b>{geo.t.name}</b> <span className="muted">· {match.laps} laps{wet ? ' · 🌧️ wet' : ''}{sc ? ' · 🟨 safety car' : ''}</span></div>
      <div className="pitchwrap">
        <svg className="pitchsvg tracksvg" viewBox="0 0 100 60" role="img" aria-label={geo.t.name + ', ' + status + ', leader ' + cars[leader].name}>
          <rect x="0" y="0" width="100" height="60" fill={wet ? '#3b5a3a' : '#4f8a3c'} />
          {Array.from({ length: 8 }, (_, i) => <rect key={i} x="0" y={i * 7.5} width="100" height="3.75" fill="rgba(255,255,255,.035)" />)}
          <path d={geo.d} fill="none" stroke="#e9e4d8" strokeWidth="6.4" strokeLinejoin="round" />
          <path d={geo.d} fill="none" stroke={wet ? '#3c4048' : '#4a4d55'} strokeWidth="5" strokeLinejoin="round" />
          <path d={geo.d} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="0.25" strokeDasharray="1.5 2" />
          {(() => { const p = geo.at(0); const nx = -Math.sin(p.ang), ny = Math.cos(p.ang); return <g><line x1={p.x - nx * 2.6} y1={p.y - ny * 2.6} x2={p.x + nx * 2.6} y2={p.y + ny * 2.6} stroke="#fff" strokeWidth="0.9" strokeDasharray="0.45 0.45" /><line x1={p.x - nx * 2.6} y1={p.y - ny * 2.6} x2={p.x + nx * 2.6} y2={p.y + ny * 2.6} stroke="#111" strokeWidth="0.9" strokeDasharray="0.45 0.45" strokeDashoffset="0.45" opacity=".9" /></g>; })()}
          {sc && (() => { const p = geo.at(dist[leader] + 0.012); return <g transform={'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ')'}><circle r="1.6" fill="#ffd23d" stroke="#0f0c21" strokeWidth=".35" /><text y="0.6" textAnchor="middle" fontSize="1.6" fontWeight="900" fill="#0f0c21">SC</text></g>; })()}
          {ordered.slice().reverse().map((i) => {
            if (out[i] && done) return null;
            const p = geo.at(dist[i]); const team = cars[i].team != null;
            return (
              <g key={i} transform={'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ')'} opacity={out[i] ? 0.35 : 1}>
                <circle r={team ? 1.55 : 1.15} fill={colors(i)} stroke={i === leader ? '#ffd23d' : '#0f0c21'} strokeWidth={i === leader ? 0.5 : 0.3} />
                {team && <text y="-2.1" textAnchor="middle" fontSize="1.9" fontWeight="900" fill="#fff" stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{f1Short(cars[i].name)}</text>}
              </g>
            );
          })}
          {wet && Array.from({ length: 40 }, (_, i) => { const x = (unit('rx', i) * 110 + t * 9) % 105 - 3, y = (unit('ry', i) * 64 + t * 30 + i) % 64 - 2; return <line key={i} x1={x} y1={y} x2={x - 0.6} y2={y + 2} stroke="rgba(200,220,255,.5)" strokeWidth="0.25" />; })}
          {beat.type === 'lights' && <g><rect x="31" y="6" width="38" height="9" rx="2" fill="#141026" stroke="#000" strokeWidth=".4" />{[0, 1, 2, 3, 4].map((k) => <circle key={k} cx={36 + k * 7} cy="10.5" r="2.4" fill={k < lightsOn && u < 4.0 ? '#ff2a2a' : '#3a2f3f'} />)}</g>}
          {beat.type === 'flag' && <g transform="translate(50 14)">{Array.from({ length: 24 }, (_, k) => <rect key={k} x={-12 + (k % 6) * 4} y={-6 + Math.floor(k / 6) * 3} width="4" height="3" fill={(k + Math.floor(k / 6)) % 2 ? '#fff' : '#111'} transform={'translate(0 ' + (Math.sin(u * 6 + k * 0.5) * 0.6).toFixed(2) + ')'} />)}</g>}
          {banner && <text x="50" y={beat.type === 'flag' ? 32 : 31} textAnchor="middle" fontSize={banner.length > 15 ? 5 : 6.5} fontWeight="900" fill={/CRASH|SAFETY|RAIN|ENGINE|OVERTAKE/.test(banner) ? '#ffc83d' : '#fff'} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke" className="pbanner">{banner}</text>}
          {done && <g><rect x="0" y="0" width="100" height="60" fill="rgba(15,12,33,.55)" /><text x="50" y="24" textAnchor="middle" fontSize="3.4" fontWeight="800" fill="#fff">{geo.t.name.toUpperCase()}</text><text x="50" y="34" textAnchor="middle" fontSize="6.5" fontWeight="900" fill={match.winner === 0 ? A.color : B.color} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke">{(match.winner === 0 ? A : B).name.toUpperCase().slice(0, 16)} WIN</text><text x="50" y="42" textAnchor="middle" fontSize="4.4" fontWeight="900" fill="#ffc83d">{match.score[0]}–{match.score[1]} points</text></g>}
        </svg>
      </div>
      <div className="tower" role="list" aria-label="Timing tower">
        {ordered.map((i, k) => (
          <div key={i} role="listitem" className={'gprow' + (cars[i].team != null ? ' team' : '') + (out[i] ? ' out' : '')}>
            <span className="tp num">{out[i] ? '–' : k + 1}</span>
            <span className="tc" style={{ background: colors(i) }} />
            <span className="tn">{f1Short(cars[i].name)}</span>
            <span className="tt" style={{ color: TYRE_COL[tyreAt(match.stints[i], Math.max(1, lap))] }}>{pitNow(i) ? 'PIT' : tyreAt(match.stints[i], Math.max(1, lap))}</span>
            <span className="tg num">{gap(i)}</span>
          </div>
        ))}
      </div>
      <div className="mctrl" role="group" aria-label="Race controls">
        {!done && <button className="btn btn-sm" onClick={() => setPlaying((x) => !x)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸ Pause' : '▶ Play'}</button>}
        {!done && [1, 2, 4].map((x) => <button key={x} className={'btn btn-sm' + (mult === x ? ' btn-gold' : '')} aria-pressed={mult === x} onClick={() => setMult(x)}>{x}×</button>)}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => setT(script.total)}>Skip to result</button>}
        {done && <button className="btn btn-sm" onClick={() => { fired.current = true; setT(0); setPlaying(true); }}>↺ Watch again</button>}
      </div>
      <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map(({ k, e }) => (
          <p key={k} className={'mev ' + (e.kind === 'flag' || e.kind === 'crash' || e.kind === 'sc' ? 'goal' : e.kind === 'start' || e.kind === 'rain' ? 'half' : '') + (e.car != null && cars[e.car].team != null ? ' t' + cars[e.car].team : '')}>
            <span className="mm num">{e.lap ? 'L' + e.lap : '—'}</span>
            <span>{e.kind === 'pass' ? '🏎️ ' : e.kind === 'pit' ? '🔧 ' : e.kind === 'crash' ? '💥 ' : e.kind === 'sc' ? '🟨 ' : e.kind === 'rain' ? '🌧️ ' : e.kind === 'flag' ? '🏁 ' : e.kind === 'fastest' ? '⏱️ ' : ''}{e.text}{e.car != null && cars[e.car].team != null ? <small> · {(cars[e.car].team === 0 ? A : B).name}</small> : null}</span>
          </p>
        ))}
      </div>
      {done && <GPSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}

function gpReport(d, A, B, match) {
  const rows = match.result.map((r) => ({ ...r, ...match.cars[r.car], gained: r.pos != null ? r.grid - r.pos : null }));
  const team = rows.filter((r) => r.team != null);
  const dotd = team.filter((r) => r.pos != null).sort((x, y) => (y.gained * 2 + y.pts / 5) - (x.gained * 2 + x.pts / 5))[0] || null;
  const best = team.filter((r) => r.pts > 0).sort((x, y) => y.pts / Math.max(1, y.price) - x.pts / Math.max(1, x.price))[0] || null;
  const flop = team.filter((r) => r.price >= 3 && r.pts === 0).sort((x, y) => y.price - x.price)[0] || null;
  return { rows, team, dotd, best, flop };
}
function GPSummary({ d, A, B, match }) {
  if (match.forfeit) return <div className="board msummary"><h3>🏁 Race</h3><p className="small">{(match.winner === 0 ? A : B).name} wins — the other team had no drivers.</p></div>;
  const R = gpReport(d, A, B, match); const geo = trackGeo(match.track);
  const T = (i) => (i === 0 ? A : B);
  const pos = (r) => (r.pos != null ? 'P' + r.pos : 'DNF');
  const era = (r) => { const it = d.items[r.itemId]; return it ? (f1EraOf(it, d.topic) === 'now' ? 'Now' : 'Prime') : ''; };
  return (
    <div className="board msummary">
      <h3>🏁 Race result</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {match.score[0]}–{match.score[1]} {B.name}</b> on points · {geo.t.name}{match.how === 'best' ? ' · level on points, decided by the best finish' : ''}</p>
      <p className="small" style={{ margin: 0 }}>🏆 Podium: {R.rows.slice(0, 3).map((r) => r.name + (r.team != null ? ' (' + T(r.team).name + ')' : '')).join(' · ')}</p>
      <table className="qtable small"><thead><tr><th>Driver</th><th>Grid</th><th>Finish</th><th>Pts</th></tr></thead><tbody>{R.team.map((r) => <tr key={r.car}><td><span className="tc" style={{ background: T(r.team).color }} /> {r.name}</td><td className="num">{r.grid}</td><td className="num">{pos(r)}</td><td className="num"><b>{r.pts}</b></td></tr>)}</tbody></table>
      <div className="mreport">
        <h4>📋 Race report</h4>
        {R.dotd && <p className="small"><b>⭐ Driver of the Day:</b> {R.dotd.name} — from P{R.dotd.grid} to {pos(R.dotd)}{R.dotd.passes ? ', ' + R.dotd.passes + ' overtake' + (R.dotd.passes === 1 ? '' : 's') : ''} ({era(R.dotd)} {R.dotd.ovr} est.).</p>}
        {match.fastest != null && <p className="small"><b>⏱️ Fastest lap:</b> {match.cars[match.fastest].name}.</p>}
        {R.best && <p className="small"><b>💰 Best buy:</b> {R.best.name} — ${R.best.price} for {R.best.pts} points.</p>}
        {R.flop && <p className="small"><b>📉 Tough day:</b> {R.flop.name} cost ${R.flop.price} and scored nothing{R.flop.dnf ? ' (out on lap ' + R.flop.dnf + ')' : ''}.</p>}
        <p className="small"><b>🔎 The race:</b> {match.rain ? 'Rain from lap ' + match.rain[0] + ' to ' + match.rain[1] + '. ' : 'Dry all race. '}{match.sc ? match.sc + ' safety car' + (match.sc === 1 ? '' : 's') + '. ' : ''}{match.events.filter((e) => e.kind === 'pass').length} overtakes, {match.dnf.filter((x) => x != null).length} retirements.</p>
      </div>
      <p className="hint" style={{ margin: 0 }}>Everyone drives the same car. Grey cars are undrafted drivers filling the grid (the weakest ones left; they score for nobody). Driver numbers are Draft Night estimates — Now for current drivers, Prime for legends — not official ratings. Races are shortened.</p>
    </div>
  );
}

function F1Chip({ item, topic }) {
  const [open, setOpen] = useState(false);
  if (!numbersShown()) return null;
  const r = f1Rating(item); const era = f1EraOf(item, topic) === 'now' ? 'Now' : 'Prime';
  return (
    <>
      <button type="button" className="ratingchip" onClick={() => setOpen(true)} aria-label={era + ' ' + r.ovr + ', estimated. Show details'}>{era} <b className="num">{r.ovr}</b> est.</button>
      {open && ReactDOM.createPortal(
        <Sheet center onClose={() => setOpen(false)}>
          <div className="ratingcard">
            <div className="rc-top"><span className="rc-ovr num"><small className="rc-era">{era}</small>{r.ovr}</span><span className="rc-role">F1</span><span className="rc-name">{item.name}</span></div>
            <div className="rc-attrs">{F1_ATTRS.map((a) => <div key={a} className="rc-attr"><span className="k" title={F1_ATTR_NAMES[a]}>{a}</span><span className="bar"><i style={{ width: r.attrs[a] + '%' }} /></span><span className="v num">{r.attrs[a]}</span></div>)}</div>
            <p className="hint" style={{ margin: 0 }}>{era === 'Now' ? 'Now: how good they are today. ' : 'Prime: how good they were at their peak. '}PAC qualifying pace · RAC race pace · OVT overtaking · DEF defending · TYR tyre care · WET wet weather · CON consistency. Draft Night estimate from titles and reputation, not an official rating.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
        </Sheet>, document.body)}
    </>
  );
}
