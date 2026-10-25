/* ============================================================
   THE DRAFT NIGHT GAMES screen (rules in 29-games.js). Ten lanes:
   the 100m with reaction times, the swim, a 1500m where the pack
   holds together until the last lap kick, the obstacle course (with
   falls), the long jump (worst to best, for the drama) and, if
   needed, the relay. A results board after each event with medals
   and points, so the score always matches the recorded meet.
   ============================================================ */
const GAMES_DUR = { race: 5, swim: 5, obstacle: 5.5, jump: 7, relay: 6.5 };
function gamesScript(match) {
  const beats = []; let t = 0;
  const add = (b) => { b.t0 = t; t += b.dur; beats.push(b); return b; };
  add({ type: 'intro', dur: 2.8 });
  match.events.forEach((e, ei) => {
    add({ type: 'call', dur: 1.8, ei });
    add({ type: 'ev', dur: (GAMES_DUR[e.kind] || 5) + (e.id === '1500m' ? 1.5 : 0), ei });
    add({ type: 'res', dur: 2.8, ei });
  });
  add({ type: 'final', dur: 3 });
  return { beats, total: t };
}
// How far along each athlete is (0…1) at a moment of a race.
function gamesProgress(e, row, s, med) {
  const T = row.perf;
  if (e.id === '100m') { const r = row.react || 0.15; if (s <= r) return 0; return Math.min(1, Math.pow((s - r) / (T - r), 1.08)); }
  if (e.id === '1500m') { const a = s / med, b = s / T; const k = Math.max(0, Math.min(1, (a - 0.72) / 0.28)); return Math.min(1, a + (b - a) * k * k * (3 - 2 * k)); }
  if (e.id === 'obst' && row.falls) { const fallAt = T * 0.5 - 1.6; if (s < fallAt) return Math.min(1, (s / (T - 3.2))); if (s < fallAt + 3.2) return Math.min(1, fallAt / (T - 3.2)); return Math.min(1, (s - 3.2) / (T - 3.2)); }
  return Math.min(1, s / T);
}
function GamesView({ d, A, B, match, speed, onDone, label }) {
  const script = useMemo(() => gamesScript(match), [match]);
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
  const at = match.athletes; const colors = [A.color, B.color];
  const ev = beat.ei != null ? match.events[beat.ei] : null;
  const decided = (k) => k < (beat.ei != null ? beat.ei : 99) || (beat.ei === k && beat.type === 'res' && u > 0.5) || beat.type === 'final' || done;
  const score = done || beat.type === 'final' ? match.score : (() => { let last = null; match.events.forEach((e, k) => { if (decided(k)) last = e.score; }); return last || [0, 0]; })();
  const short = (n) => { const w = String(n || '').split(' '); return w[w.length - 1].slice(0, 11); };
  const lastBeat = useRef(-1);
  useEffect(() => { if (!playing || done || bi === lastBeat.current) return; lastBeat.current = bi; if (beat.type === 'ev') audio.play(ev && ev.kind === 'jump' ? 'bid' : 'buzzer'); if (beat.type === 'res') { audio.play('cheer'); const w = at[ev.winner] || null; if (w && ev.kind !== 'relay') audio.say(w.name + ' wins the ' + ev.name + '!', 2, d.id + ':' + label + ':g' + beat.ei); } }, [bi]);
  // What to draw.
  let lanes = null, jumps = null, relay = null, banner = null;
  if (beat.type === 'ev' && ev) {
    const animT = beat.dur - 0.8; const k = Math.max(0, Math.min(1, (u - 0.4) / animT));
    if (ev.kind === 'race' || ev.kind === 'swim' || ev.kind === 'obstacle') {
      const Tmax = Math.max(...ev.rows.map((r) => r.perf)) * 1.01; const med = ev.rows.map((r) => r.perf).sort((a, b) => a - b)[Math.floor(ev.rows.length / 2)];
      const s = k * Tmax;
      lanes = ev.rows.slice().sort((a, b) => a.i - b.i).map((r, lane) => ({ r, lane, p: gamesProgress(ev, r, s, med), fell: ev.id === 'obst' && r.falls && s > r.perf * 0.5 - 1.6 && s < r.perf * 0.5 + 1.6 }));
      const leader = lanes.slice().sort((a, b) => b.p - a.p)[0];
      banner = u < 0.5 ? (ev.kind === 'swim' ? 'TAKE YOUR MARKS…' : 'SET…') : k < 0.08 ? 'GO!' : leader.p >= 1 ? (ev.photo && k < 0.98 ? 'PHOTO FINISH!' : short(at[ev.rows[0].i].name).toUpperCase() + ' WINS!') : ev.id === '1500m' && leader.p > 0.72 && leader.p < 0.8 ? 'THE BELL! LAST LAP' : null;
    } else if (ev.kind === 'jump') {
      const order = ev.rows.slice().reverse(); const per = animT / order.length; const j = Math.min(order.length - 1, Math.floor((u - 0.4) / per)); const kk = ((u - 0.4) / per) - j;
      jumps = { order, j: Math.max(0, j), kk: Math.max(0, Math.min(1, kk)) };
      const cur = order[jumps.j]; banner = cur && jumps.kk > 0.75 ? (cur.perf ? cur.perf.toFixed(2) + ' m' : 'NO MARK') : null;
      if (jumps.j === order.length - 1 && jumps.kk > 0.8) banner = short(at[ev.rows[0].i].name).toUpperCase() + ' WINS!';
    } else if (ev.kind === 'relay') {
      const Tmax = Math.max(...ev.relay.map((r) => r.perf)) * 1.01; const s = k * Tmax;
      relay = ev.relay.map((r) => { let acc = 0, leg = 0; for (; leg < 4; leg++) { if (s < acc + r.splits[leg]) break; acc += r.splits[leg]; } const p = leg >= 4 ? 1 : (leg + (s - acc) / r.splits[leg]) / 4; return { r, p: Math.min(1, p), leg: Math.min(3, leg) }; });
      banner = relay.some((x) => x.p >= 1) ? (ev.winner === 0 ? A : B).name.toUpperCase() + ' WIN!' : null;
    }
  }
  const resultsFor = (e) => (e.kind === 'relay' ? e.relay.slice().sort((a, b) => a.perf - b.perf).map((r, k) => ({ name: (r.tm === 0 ? A : B).name, team: r.tm, mark: r.perf.toFixed(2) + 's', k })) : e.rows.slice(0, 3).map((r, k) => ({ name: at[r.i].name, team: at[r.i].team, mark: e.kind === 'jump' ? r.perf.toFixed(2) + ' m' : gamesTime(r.perf, e.unit), k })));
  const feed = [];
  script.beats.forEach((b, k2) => { if (b.type !== 'res' || (!done && b.t0 + 0.6 > t)) return; const e = match.events[b.ei]; feed.push({ k: k2, tag: '🏅', team: e.team, big: true, text: e.text + ' Score ' + e.score[0] + '–' + e.score[1] + '.' }); });
  const feedRef = useRef(null);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [feed.length]);
  const pool = ev && ev.kind === 'swim';
  return (
    <div className="matchview gamesview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid"><span className="sb-score num" aria-live="polite">{score[0]}–{score[1]}</span><span className="sb-clock num">{done || beat.type === 'final' ? 'FINAL' : ev ? 'EVENT ' + (beat.ei + 1) + '/' + match.events.length : 'OPENING'}</span></div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      <div className="boutbar small">{ev ? <b>{ev.name}</b> : <span className="muted">The Draft Night Games · everyone does every event</span>}<span className="muted"> · 🥇 golds so far {[0, 1].map((s2) => match.events.filter((e, k) => decided(k) && (e.kind === 'relay' ? false : at[e.rows[0].i].team === s2)).length).join('–')}</span></div>
      <div className="pitchwrap">
        <svg className="pitchsvg gamessvg" viewBox="0 0 100 60" role="img" aria-label={(ev ? ev.name : 'Games') + ': ' + A.name + ' ' + score[0] + ', ' + B.name + ' ' + score[1]}>
          <rect x="0" y="0" width="100" height="60" fill={pool ? '#1c6fb0' : ev && ev.kind === 'obstacle' ? '#3f7d3a' : '#b4553a'} />
          {(lanes || relay) && Array.from({ length: relay ? 2 : 10 }, (_, i) => { const h = relay ? 20 : 5; const y = (relay ? 12 : 6) + i * h; return <g key={i}><rect x="0" y={y} width="100" height={h} fill={i % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'} /><line x1="0" y1={y} x2="100" y2={y} stroke={pool ? '#e2463b' : 'rgba(255,255,255,.7)'} strokeWidth="0.25" strokeDasharray={pool ? '1 1' : ''} /></g>; })}
          {(lanes || relay) && <g><line x1="8" y1="5" x2="8" y2="56" stroke="#fff" strokeWidth="0.5" /><line x1="92" y1="5" x2="92" y2="56" stroke="#fff" strokeWidth="0.9" strokeDasharray="0.8 0.8" /></g>}
          {lanes && ev.kind === 'obstacle' && [25, 42, 58, 75].map((x) => <g key={x}>{Array.from({ length: 10 }, (_, i) => <rect key={i} x={x} y={6.6 + i * 5} width="1.4" height="3.8" fill={x === 58 ? '#c08a55' : '#e2463b'} opacity=".85" />)}</g>)}
          {lanes && lanes.map(({ r, lane, p, fell }) => { const a = at[r.i]; const x = 8 + p * 84; const y = 8.5 + lane * 5; return <g key={r.i} transform={'translate(' + x.toFixed(2) + ' ' + y + ')'}><circle r="1.6" fill={colors[a.team]} stroke={p >= 1 && r.place <= 3 ? '#ffd23d' : '#0f0c21'} strokeWidth={p >= 1 && r.place <= 3 ? 0.6 : 0.3} opacity={fell ? 0.5 : 1} /><text x={x > 70 ? -2.4 : 2.4} y="0.9" textAnchor={x > 70 ? 'end' : 'start'} fontSize="2.3" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{short(a.name)}{p >= 1 ? ' ' + (ev.kind === 'race' && ev.id === '1500m' ? gamesTime(r.perf, 'time') : r.perf.toFixed(2)) : fell ? ' 💥' : ''}</text></g>; })}
          {relay && relay.map(({ r, p, leg }, k2) => { const y = 22 + k2 * 20; const x = 8 + p * 84; const runner = at[r.legs[leg]]; return <g key={k2} transform={'translate(' + x.toFixed(2) + ' ' + y + ')'}><circle r="2.2" fill={colors[r.tm]} stroke="#0f0c21" strokeWidth="0.35" /><text x={x > 70 ? -3 : 3} y="1" textAnchor={x > 70 ? 'end' : 'start'} fontSize="2.8" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">Leg {leg + 1}: {short(runner && runner.name)}</text></g>; })}
          {jumps && (() => { const cur = jumps.order[jumps.j]; const a = at[cur.i]; const kk = jumps.kk; const board = 40; const land = board + (cur.perf || 7) * 4.6; const x = kk < 0.45 ? 6 + (board - 6) * (kk / 0.45) : board + (land - board) * Math.min(1, (kk - 0.45) / 0.35); const h = kk < 0.45 ? 0 : Math.sin(Math.min(1, (kk - 0.45) / 0.35) * Math.PI) * 9; return (
            <g>
              <rect x="0" y="30" width="100" height="8" fill="#b4553a" /><rect x={board} y="30" width="1" height="8" fill="#fff" /><rect x="70" y="28" width="30" height="12" fill="#e8d6a0" />
              {[7, 8].map((m) => <g key={m}><line x1={board + m * 4.6} y1="27" x2={board + m * 4.6} y2="41" stroke="#fff" strokeWidth="0.25" /><text x={board + m * 4.6} y="44" textAnchor="middle" fontSize="2.2" fill="#fff">{m}m</text></g>)}
              {jumps.order.slice(0, jumps.j).map((r, k3) => <text key={r.i} x="3" y={47 + (k3 % 4) * 3.2} fontSize="2.1" fill="#fff" opacity=".8">{short(at[r.i].name)} {r.perf ? r.perf.toFixed(2) : 'X'}</text>)}
              <g transform={'translate(' + x.toFixed(2) + ' ' + (34 - h).toFixed(2) + ')'}><circle r="1.8" fill={colors[a.team]} stroke="#0f0c21" strokeWidth="0.35" /><text y="-2.6" textAnchor="middle" fontSize="2.6" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{short(a.name)}</text></g>
              <text x="50" y="22" textAnchor="middle" fontSize="2.6" fill="#fff">{cur.jumps ? 'Jumps: ' + cur.jumps.map((j2) => (j2 == null ? 'X' : j2.toFixed(2))).join(' · ') : ''}</text>
            </g>
          ); })()}
          {(beat.type === 'res' || beat.type === 'call') && ev && <g><rect x="0" y="0" width="100" height="60" fill="rgba(15,12,33,.65)" /><text x="50" y="14" textAnchor="middle" fontSize="4.6" fontWeight="900" fill="#fff">{ev.name.toUpperCase()}</text>
            {beat.type === 'call' && <text x="50" y="24" textAnchor="middle" fontSize="2.8" fill="#fff">{ev.kind === 'relay' ? 'Level on points — the relay decides it!' : 'All ten athletes. Points for every place.'}</text>}
            {beat.type === 'res' && resultsFor(ev).map((x) => <g key={x.k} transform={'translate(50 ' + (24 + x.k * 8) + ')'}><text textAnchor="middle" fontSize="3.6" fontWeight="900" fill={colors[x.team]} stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{['🥇', '🥈', '🥉'][x.k]} {x.name.slice(0, 22)} · {x.mark}</text></g>)}
          </g>}
          {beat.type === 'intro' && <g><rect x="0" y="0" width="100" height="60" fill="rgba(15,12,33,.65)" /><text x="50" y="18" textAnchor="middle" fontSize="5" fontWeight="900" fill="#ffc83d">THE DRAFT NIGHT GAMES</text>{match.athletes.map((a2, k3) => <text key={k3} x={a2.team === 0 ? 27 : 73} y={26 + Math.floor(k3 % 5) * 5} textAnchor="middle" fontSize="2.6" fontWeight="700" fill={colors[a2.team]}>{a2.name} · {a2.sport}</text>)}</g>}
          {(done || beat.type === 'final') && <g><rect x="0" y="0" width="100" height="60" fill="rgba(15,12,33,.65)" /><text x="50" y="24" textAnchor="middle" fontSize="7" fontWeight="900" fill={colors[match.winner]} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke">{(match.winner === 0 ? A : B).name.toUpperCase().slice(0, 16)} WIN</text><text x="50" y="33" textAnchor="middle" fontSize="4.6" fontWeight="900" fill="#ffc83d">{match.score[0]}–{match.score[1]} points</text><text x="50" y="40" textAnchor="middle" fontSize="3" fill="#fff">Medals 🥇🥈🥉 {match.medals[0].join('-')} v {match.medals[1].join('-')}</text></g>}
          {banner && <text x="50" y="4.6" textAnchor="middle" fontSize="4.2" fontWeight="900" fill="#ffc83d" stroke="#0f0c21" strokeWidth="0.5" paintOrder="stroke" className="pbanner">{banner}</text>}
        </svg>
      </div>
      <div className="mctrl" role="group" aria-label="Games controls">
        {!done && <button className="btn btn-sm" onClick={() => setPlaying((x) => !x)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸ Pause' : '▶ Play'}</button>}
        {!done && [1, 2, 4].map((x) => <button key={x} className={'btn btn-sm' + (mult === x ? ' btn-gold' : '')} aria-pressed={mult === x} onClick={() => setMult(x)}>{x}×</button>)}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => { const nb = script.beats.find((b) => b.type === 'call' && b.t0 > t + 0.01); setT(nb ? nb.t0 : script.total); }}>Next event</button>}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => setT(script.total)}>Skip to result</button>}
        {done && <button className="btn btn-sm" onClick={() => { fired.current = true; setT(0); setPlaying(true); }}>↺ Watch again</button>}
      </div>
      <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map((e) => <p key={e.k} className={'mev goal t' + e.team}><span className="mm num">{e.tag}</span><span>{e.text}</span></p>)}
      </div>
      {done && <GamesSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}
function gamesReport(d, A, B, match) {
  const at = match.athletes;
  const pts = at.map((a, i) => ({ ...a, i, pts: match.events.reduce((n, e) => n + (e.rows ? (e.rows.find((r) => r.i === i) || {}).pts || 0 : 0), 0), golds: match.events.filter((e) => e.rows && e.rows[0].i === i).length }));
  const star = pts.slice().sort((a, b) => b.pts - a.pts)[0];
  const best = pts.filter((a) => a.price > 0).sort((a, b) => b.pts / b.price - a.pts / a.price)[0] || null;
  const flop = pts.filter((a) => a.price >= 3).sort((a, b) => a.pts / a.price - b.pts / b.price)[0] || null;
  const surprise = match.events.filter((e) => e.rows).map((e) => ({ e, a: at[e.rows[0].i] })).find((x) => !new RegExp({ '100m': 'Sprinter|Hurdler|Jumper', swim: 'Swimmer|Diver', '1500m': 'Distance', lj: 'Jumper|Sprinter|Multi', obst: 'Gymnast|Skater|Winter|Diver' }[x.e.id] || '.').test(x.a.sport)) || null;
  return { pts, star, best, flop, surprise };
}
function GamesSummary({ d, A, B, match }) {
  const R = gamesReport(d, A, B, match); const T = (i) => (i === 0 ? A : B);
  return (
    <div className="board msummary">
      <h3>🏅 Medal table</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {match.score[0]}–{match.score[1]} {B.name}</b> on points{match.how === 'relay' ? ' · decided by the relay' : ''}</p>
      <table className="qtable small"><thead><tr><th>Event</th><th>🥇</th><th>Mark</th></tr></thead><tbody>{match.events.map((e) => <tr key={e.id}><td>{e.name}</td><td>{e.kind === 'relay' ? T(e.winner).name : match.athletes[e.rows[0].i].name}</td><td className="num">{e.kind === 'relay' ? e.relay[e.winner].perf.toFixed(2) + 's' : e.kind === 'jump' ? e.rows[0].perf.toFixed(2) + ' m' : gamesTime(e.rows[0].perf, e.unit)}</td></tr>)}</tbody></table>
      <p className="small" style={{ margin: 0 }}>Medals (gold-silver-bronze): {A.name} {match.medals[0].join('-')} · {B.name} {match.medals[1].join('-')}</p>
      <div className="mreport">
        <h4>📋 Games report</h4>
        {R.star && <p className="small"><b>⭐ Athlete of the Games:</b> {R.star.name} ({T(R.star.team).name}, {R.star.sport.toLowerCase()}) — {R.star.pts} points{R.star.golds ? ', ' + R.star.golds + ' gold' + (R.star.golds > 1 ? 's' : '') : ''}.</p>}
        {R.surprise && <p className="small"><b>😮 Out of their comfort zone:</b> {R.surprise.a.name} ({R.surprise.a.sport.toLowerCase()}) won the {R.surprise.e.name}!</p>}
        {R.best && <p className="small"><b>💰 Best buy:</b> {R.best.name} — ${R.best.price} for {R.best.pts} points.</p>}
        {R.flop && <p className="small"><b>📉 Tough day:</b> {R.flop.name} cost ${R.flop.price} and scored {R.flop.pts}.</p>}
      </div>
      <p className="hint" style={{ margin: 0 }}>Times and distances are simulated from Draft Night’s estimated abilities for each athlete’s sport (not official ratings, and not their real personal bests).</p>
    </div>
  );
}
function GamesChip({ item, topic }) {
  const [open, setOpen] = useState(false);
  if (!numbersShown()) return null;
  const r = gamesRating(item);
  return (
    <>
      <button type="button" className="ratingchip" onClick={() => setOpen(true)} aria-label={'Prime ' + r.ovr + ', estimated. Show details'}>Prime <b className="num">{r.ovr}</b> est.</button>
      {open && ReactDOM.createPortal(
        <Sheet center onClose={() => setOpen(false)}>
          <div className="ratingcard">
            <div className="rc-top"><span className="rc-ovr num"><small className="rc-era">Prime</small>{r.ovr}</span><span className="rc-role">OLY</span><span className="rc-name">{item.name}<br /><small>{r.sport}</small></span></div>
            <div className="rc-attrs">{GAMES_ATTRS.map((a) => <div key={a} className="rc-attr"><span className="k" title={GAMES_ATTR_NAMES[a]}>{a}</span><span className="bar"><i style={{ width: r.attrs[a] + '%' }} /></span><span className="v num">{r.attrs[a]}</span></div>)}</div>
            <p className="hint" style={{ margin: 0 }}>Prime: at their peak. SPD speed · END endurance · SWM swimming · JMP jumping · AGI agility · STR strength. Draft Night estimate from their sport, not an official rating.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
        </Sheet>, document.body)}
    </>
  );
}
