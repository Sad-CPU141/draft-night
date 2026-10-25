/* ============================================================
   ROYAL RUMBLE screen (rules in 29-rumble.js). The ring side-on,
   with everyone currently in it: entrants run down to the ring,
   finishers land, superstars hang on to the ropes, and eliminated
   ones fly over the top rope to the floor. Undrafted superstars are
   grey. Quieter spells roll by, so the ring always matches the
   recorded Rumble.
   ============================================================ */
const RUMBLE_DUR = { enter: 2.4, elim: 3.2, save: 2.6, finisher: 2.8, double: 2.4, win: 3.4, move: 2 };
function rumbleScript(match) {
  const beats = []; let t = 0;
  const add = (b) => { b.t0 = t; t += b.dur; beats.push(b); return b; };
  add({ type: 'intro', dur: 2.8 });
  let roll = [];
  const flush = () => { if (!roll.length) return; add({ type: 'roll', dur: Math.min(2, 0.4 + roll.length * 0.06), evs: roll }); roll = []; };
  match.plays.forEach((e) => { if (e.hl) { flush(); add({ type: 'ev', dur: RUMBLE_DUR[e.kind] || 2.4, e }); } else roll.push(e); });
  flush(); add({ type: 'final', dur: 3 });
  return { beats, total: t };
}
const rumbleRing = (match, t, incl) => match.entrants.map((w, i) => ({ ...w, i })).filter((w) => w.inAt <= t && (w.outAt == null || w.outAt > t || (incl != null && w.i === incl))).sort((a, b) => a.inAt - b.inAt);
function rumbleFrame(beat, u, match) {
  const e = beat.e;
  const t = e ? e.t : 0;
  const ring = rumbleRing(match, t, e && e.kind === 'elim' ? e.v : null);
  const shown = ring.length > 8 ? ring.filter((w) => w.team != null || (e && (w.i === e.w || w.i === e.v || w.i === e.mate))).concat(ring.filter((w) => w.team == null && !(e && (w.i === e.w || w.i === e.v || w.i === e.mate)))).slice(0, 8) : ring;
  const n = shown.length;
  const figs = shown.map((w, k) => ({ i: w.i, x: 16 + (n > 1 ? (k / (n - 1)) * 68 : 34), face: k < n / 2 ? 1 : -1, p: { lean: 6, crouch: 0.2 } }));
  const out = { figs, banner: null, extra: ring.length - shown.length };
  if (!e || beat.type !== 'ev') return out;
  const k = (a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));
  const F = (i) => figs.find((f) => f.i === i);
  const a = F(e.w), v = F(e.v);
  if (a && v && e.kind !== 'enter' && e.kind !== 'win') { const mid = (a.x + v.x) / 2; const dirn = v.x > a.x ? 1 : -1; a.x = a.x + (mid - 5 * dirn - a.x) * easeF(k(0, 0.7)); v.x = v.x + (mid + 5 * dirn - v.x) * easeF(k(0, 0.7)); a.face = dirn; v.face = -dirn; }
  if (e.kind === 'enter') { const f = F(e.w); if (f) { const home = f.x; f.x = 108 + (home - 108) * easeF(k(0.2, 1.6)); f.face = -1; f.p = { lean: 12, crouch: 0.3 }; } out.banner = '#' + e.n + ' ' + (match.entrants[e.w].name || '').toUpperCase().slice(0, 16); }
  else if (e.kind === 'elim' && a && v) {
    const kk = k(0.9, 2.3); const side = v.x >= 50 ? 1 : -1;
    a.p = { lean: 14, rear: Math.sin(k(0.7, 1.1) * Math.PI), punch: 'upper' };
    if (kk > 0) { v.x = v.x + (side * 56 + 50 - v.x) * kk * 0.55; v.y = -Math.sin(kk * Math.PI) * 14 + kk * kk * 12; v.p = { fall: Math.min(1, kk * 1.4), lean: -20 }; }
    if (u > 2.3) { out.banner = e.betray ? 'BETRAYAL!' : e.counter ? 'REVERSAL!' : 'ELIMINATED!'; a.p = { raise: 1 }; }
    if (e.mate != null) { const m2 = F(e.mate); if (m2) { m2.x = a.x - 4 * (v.x > a.x ? 1 : -1); m2.p = { lean: 14, lead: Math.sin(k(0.7, 1.1) * Math.PI), punch: 'jab' }; } }
  } else if (e.kind === 'save' && v) { const side = v.x >= 50 ? 1 : -1; v.x = side > 0 ? 88 : 12; v.y = -4 + Math.sin(u * 6) * 1.5; v.p = { lean: -35, crouch: 0.4, wobble: Math.sin(u * 9) }; if (a) a.p = { lean: 16, lead: 1, rear: 1, punch: 'jab' }; if (u > 1) out.banner = 'HANGS ON!'; }
  else if (e.kind === 'finisher' && a && v) { const kk = k(0.8, 1.4); a.p = { lean: 18, crouch: 0.4, rear: Math.sin(kk * Math.PI), punch: 'upper' }; if (kk > 0.5) v.p = { fall: easeF(k(1.1, 1.6)) }; if (u > 1.2) out.banner = String(e.move || '').toUpperCase() + '!'; }
  else if (e.kind === 'double' && a && v) { const m2 = F(e.mate); if (m2) { m2.x = v.x + (v.x > a.x ? 5 : -5); m2.face = v.x > a.x ? -1 : 1; m2.p = { lean: 14, lead: Math.sin(k(0.6, 1) * Math.PI), punch: 'jab' }; } a.p = { lean: 14, rear: Math.sin(k(0.7, 1.1) * Math.PI), punch: 'cross' }; if (u > 1.1) out.banner = 'DOUBLE TEAM!'; }
  else if (e.kind === 'win') { const f = F(e.w); if (f) { f.x = 50; f.p = { raise: 1 }; } out.banner = 'WINNER!'; }
  return out;
}

function RumbleView({ d, A, B, match, speed, onDone, label }) {
  const script = useMemo(() => rumbleScript(match), [match]);
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
  useEffect(() => { if (done && !fired.current) { fired.current = true; audio.play('bell'); onDone && onDone(); } }, [done]);
  const bi = Math.max(0, script.beats.findIndex((b) => t < b.t0 + b.dur));
  const beat = done ? script.beats[script.beats.length - 1] : script.beats[bi];
  const u = done ? beat.dur : t - beat.t0;
  const evNow = beat.type === 'ev' ? beat.e : beat.type === 'roll' ? beat.evs[Math.min(beat.evs.length - 1, Math.floor((u / beat.dur) * beat.evs.length))] : null;
  const fr = rumbleFrame(beat.type === 'roll' ? { type: 'roll', e: evNow } : beat, u, match);
  const tNow = evNow ? evNow.t : beat.type === 'final' || done ? match.end : 0;
  const inRing = rumbleRing(match, tNow).length; const toCome = match.entrants.filter((w) => w.inAt > tNow).length;
  const pts = [0, 1].map((s) => match.entrants.reduce((n, w) => n + (w.team === s ? match.plays.filter((e) => e.kind === 'elim' && e.w === match.entrants.indexOf(w) && e.t <= tNow).length : 0), 0));
  const colors = [A.color, B.color];
  const colorOf = (w) => (w.team === 0 ? A.color : w.team === 1 ? B.color : '#8a8fa3');
  const short = (n) => { const w = String(n || '').split(' '); return (w[0] === 'The' ? w[1] : w[w.length - 1]).slice(0, 10); };
  const banner = done ? null : beat.type === 'intro' ? 'ROYAL RUMBLE' : beat.type === 'final' ? 'FINAL' : fr.banner;
  const lastBeat = useRef(-1);
  useEffect(() => { if (!playing || done || bi === lastBeat.current) return; lastBeat.current = bi; if (beat.type === 'ev') { const e = beat.e; if (e.kind === 'enter') audio.play('buzzer'); if (e.kind === 'win') { audio.play('fanfare'); audio.say(match.winnerName + ' wins the Royal Rumble!', 2, d.id + ':' + label + ':w'); } } }, [bi]);
  const said = useRef({});
  useEffect(() => { if (!playing || done || beat.type !== 'ev' || said.current[bi]) return; const e = beat.e; if ((e.kind === 'elim' && u > 2.3) || (e.kind === 'finisher' && u > 1.2)) { said.current[bi] = true; audio.play(e.kind === 'elim' ? 'cheer' : 'punch'); } }, [t]);
  const feed = [];
  script.beats.forEach((b, k2) => { if (!done && b.t0 + b.dur * 0.8 > t) return; if (b.type === 'ev') { const w = match.entrants[b.e.w]; feed.push({ k: k2, tag: rumbleClock(b.e.t), team: w ? w.team : null, big: b.e.kind === 'elim' || b.e.kind === 'win', text: b.e.text }); } });
  const feedRef = useRef(null);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [feed.length]);
  const final = done || beat.type === 'final';
  return (
    <div className="matchview rumbleview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid"><span className="sb-score num" aria-live="polite">{final ? match.score[0] + '–' + match.score[1] : pts[0] + '–' + pts[1]}</span><span className="sb-clock num">{final ? 'RUMBLE POINTS' : 'ELIMINATIONS'}</span></div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      <div className="boutbar small"><span className="muted">⏱ {rumbleClock(tNow)} · in the ring <b className="num">{inRing}</b> · still to come <b className="num">{toCome}</b></span></div>
      <div className="pitchwrap">
        <svg className="pitchsvg ringsvg" viewBox="0 0 100 56" role="img" aria-label={'Royal Rumble: ' + inRing + ' in the ring'}>
          <RingStage mma={false} t={t}>
            {beat.type !== 'intro' && fr.figs.map((f) => { const w = match.entrants[f.i]; return <g key={f.i} transform={'translate(0 ' + (f.y || 0).toFixed(2) + ')'}><FighterFig x={f.x} face={f.face} p={f.p} color={colorOf(w)} name={short(w.name)} /></g>; })}
            {fr.extra > 0 && <text x="94" y="17" textAnchor="end" fontSize="2.6" fontWeight="800" fill="#fff">+{fr.extra} more</text>}
          </RingStage>
          {beat.type === 'intro' && <g><rect x="0" y="0" width="100" height="56" fill="rgba(15,12,33,.55)" /><text x="50" y="26" textAnchor="middle" fontSize="3.2" fontWeight="800" fill="#fff">{match.entrants.length} superstars · over the top rope</text><text x="50" y="32" textAnchor="middle" fontSize="2.6" fill="#fff">{A.name} vs {B.name} · grey = undrafted</text></g>}
          {final && <g><rect x="0" y="0" width="100" height="56" fill="rgba(15,12,33,.6)" /><text x="50" y="20" textAnchor="middle" fontSize="3.4" fontWeight="800" fill="#fff">RUMBLE WINNER: {match.winnerName.toUpperCase().slice(0, 22)}</text><text x="50" y="30" textAnchor="middle" fontSize="7" fontWeight="900" fill={colors[match.winner]} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke">{(match.winner === 0 ? A : B).name.toUpperCase().slice(0, 16)} WIN</text><text x="50" y="38" textAnchor="middle" fontSize="4.4" fontWeight="900" fill="#ffc83d">{match.score[0]}–{match.score[1]} Rumble points</text></g>}
          {banner && !final && <text x="50" y="12" textAnchor="middle" fontSize={banner.length > 16 ? 4.6 : 6.5} fontWeight="900" fill={/ELIMINATED|BETRAYAL|REVERSAL|WINNER|!/.test(banner) ? '#ffc83d' : '#fff'} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke" className="pbanner">{banner}</text>}
        </svg>
      </div>
      <div className="mctrl" role="group" aria-label="Rumble controls">
        {!done && <button className="btn btn-sm" onClick={() => setPlaying((x) => !x)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸ Pause' : '▶ Play'}</button>}
        {!done && [1, 2, 4].map((x) => <button key={x} className={'btn btn-sm' + (mult === x ? ' btn-gold' : '')} aria-pressed={mult === x} onClick={() => setMult(x)}>{x}×</button>)}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => setT(script.total)}>Skip to result</button>}
        {done && <button className="btn btn-sm" onClick={() => { fired.current = true; said.current = {}; setT(0); setPlaying(true); }}>↺ Watch again</button>}
      </div>
      <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map((e) => <p key={e.k} className={'mev ' + (e.big ? 'goal' : '') + (e.team != null ? ' t' + e.team : '')}><span className="mm num">{e.tag}</span><span>{e.text}</span></p>)}
      </div>
      {done && <RumbleSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}
function rumbleReport(d, A, B, match) {
  const E = match.entrants;
  const most = E.slice().sort((a, b) => b.elims - a.elims)[0];
  const iron = E[match.iron];
  const team = E.filter((w) => w.team != null).map((w) => ({ ...w, place: match.places.indexOf(E.indexOf(w)) + 1 }));
  const best = team.filter((w) => w.place <= 4 || w.elims >= 2).sort((a, b) => a.price - b.price)[0] || null;
  const flop = team.filter((w) => w.place > 10 && w.elims === 0).sort((a, b) => b.price - a.price)[0] || null;
  return { most, iron, team, best, flop };
}
function RumbleSummary({ d, A, B, match }) {
  const R = rumbleReport(d, A, B, match); const T = (i) => (i === 0 ? A : B); const E = match.entrants;
  const ord = (n) => n + ordinalSuffix(n);
  return (
    <div className="board msummary">
      <h3>🤼 Royal Rumble results</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {match.score[0]}–{match.score[1]} {B.name}</b> on Rumble points · winner: {match.winnerName}</p>
      <p className="small" style={{ margin: 0 }}>🏆 Final four: {match.places.slice(0, 4).map((i, k) => (k + 1) + '. ' + E[i].name + (E[i].team != null ? ' (' + T(E[i].team).name + ')' : '')).join(' · ')}</p>
      <table className="qtable small"><thead><tr><th>Superstar</th><th>#</th><th>Place</th><th>Elims</th></tr></thead><tbody>{R.team.sort((a, b) => a.place - b.place).map((w) => <tr key={w.name}><td><span className="tc" style={{ background: T(w.team).color }} /> {w.name}</td><td className="num">{w.n}</td><td className="num">{ord(w.place)}</td><td className="num">{w.elims}</td></tr>)}</tbody></table>
      <div className="mreport">
        <h4>📋 Rumble report</h4>
        {R.most && <p className="small"><b>💪 Most eliminations:</b> {R.most.name} — {R.most.elims}.</p>}
        {R.iron && <p className="small"><b>⏱ Iron man:</b> {R.iron.name} lasted {rumbleClock(((R.iron.outAt == null ? match.end : R.iron.outAt) - R.iron.inAt))} after entering at #{R.iron.n}.</p>}
        {R.best && <p className="small"><b>💰 Best buy:</b> {R.best.name} cost ${R.best.price}: {ord(R.best.place)} place, {R.best.elims} elimination{R.best.elims === 1 ? '' : 's'}.</p>}
        {R.flop && <p className="small"><b>📉 Early exit:</b> {R.flop.name} cost ${R.flop.price} and went out in {ord(R.flop.place)} place.</p>}
      </div>
      <p className="hint" style={{ margin: 0 }}>Rumble points: 10 for the winner, then 7, 5, 4, 3, 2, 1, plus 1 per elimination. Grey superstars are undrafted and score for nobody. Simulated from Draft Night’s estimated Prime numbers — not official, and very much sports entertainment.</p>
    </div>
  );
}
function RumbleChip({ item, topic }) {
  const [open, setOpen] = useState(false);
  if (!numbersShown()) return null;
  const r = rumbleRating(item);
  return (
    <>
      <button type="button" className="ratingchip" onClick={() => setOpen(true)} aria-label={'Prime ' + r.ovr + ', estimated. Show details'}>Prime <b className="num">{r.ovr}</b> est.</button>
      {open && ReactDOM.createPortal(
        <Sheet center onClose={() => setOpen(false)}>
          <div className="ratingcard">
            <div className="rc-top"><span className="rc-ovr num"><small className="rc-era">Prime</small>{r.ovr}</span><span className="rc-role">WWE</span><span className="rc-name">{item.name}<br /><small>{r.style}{r.finisher ? ' · finisher: ' + r.finisher : ''}</small></span></div>
            <div className="rc-attrs">{RUMBLE_ATTRS.map((a) => <div key={a} className="rc-attr"><span className="k" title={RUMBLE_ATTR_NAMES[a]}>{a}</span><span className="bar"><i style={{ width: r.attrs[a] + '%' }} /></span><span className="v num">{r.attrs[a]}</span></div>)}</div>
            <p className="hint" style={{ margin: 0 }}>Prime: at their peak. STR power · AGI agility · TEC technique · STA stamina · CHA crowd. Draft Night estimate, not an official rating.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
        </Sheet>, document.body)}
    </>
  );
}
