/* ============================================================
   CUTENESS SHOW screen (rules in 29-show.js). A stage, two
   contestants, and three judges holding up scorecards.
   ============================================================ */
function ShowAct({ d, team, a, marks, won }) {
  if (!a) return <div className="sact empty" style={mStyle(team)}><b>{team.name}</b><p className="small muted">Nobody left to send.</p></div>;
  const item = d.items[a.itemId] || { name: a.name };
  return (
    <div className={'sact' + (won ? ' won' : '')} style={mStyle(team)}>
      <ItemArt item={item} topic={d.topic} size={64} round />
      <b className="sa-n">{a.name}</b>
      <span className="small muted">{team.name}</span>
      <div className="scards">
        {SHOW_JUDGES.map((J, k) => <span key={k} className={'scard' + (k < marks ? ' up' : '')} title={J.name}>{k < marks ? a.marks[k].m : J.emoji}</span>)}
      </div>
      {marks >= 3 && <b className="sa-total num">{a.total}</b>}
    </div>
  );
}
function ShowView({ d, A, B, match, speed, onDone, label }) {
  const instant = speed === 'instant';
  const R = match.rounds;
  const [ri, setRi] = useState(instant ? R.length : 0);
  const [st, setSt] = useState(0); // 0 acts, 1-3 A's cards, 4-6 B's cards, 7 result
  const fast = speed === 'fast';
  const done = ri >= R.length;
  const fired = useRef(false);
  const feedRef = useRef(null);
  useEffect(() => {
    if (done) { if (!fired.current) { fired.current = true; if (!instant) audio.play('fanfare'); onDone && onDone(); } return undefined; }
    const rd = R[ri];
    const t = setTimeout(() => {
      if (st < 7) { const nx = st + 1; setSt(nx); if (nx === 7) audio.play('cheer'); else { const side = nx <= 3 ? 0 : 1; const a = rd.acts[side]; const m = a && a.marks[(nx - 1) % 3]; if (m) audio.play(m.m >= 8 ? 'big' : 'bid'); } }
      else { setRi(ri + 1); setSt(0); }
    }, ms(st === 0 ? (fast ? 1000 : 2000) : st < 7 ? (fast ? 450 : 900) : (fast ? 1100 : 2200)));
    return () => clearTimeout(t);
  }, [ri, st, done]);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [ri]);
  const rd = done ? null : R[ri];
  const score = rd && st >= 7 ? rd.score : ri ? R[ri - 1].score : [0, 0];
  const lastSay = rd && st >= 1 && st <= 6 ? (() => { const side = st <= 3 ? 0 : 1; const a = rd.acts[side]; const k = (st - 1) % 3; return a && a.marks[k].say ? SHOW_JUDGES[k].emoji + ' ' + SHOW_JUDGES[k].name + ': “' + a.marks[k].say + '”' : null; })() : null;
  const anim = !reducedMotion();
  return (
    <div className="matchview showview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid">
          <span className="sb-score num" aria-live="polite">{(done ? match.score : score)[0]}–{(done ? match.score : score)[1]}</span>
          <span className="sb-clock num">{done ? 'Rounds won' : 'Round ' + (ri + 1) + ' of ' + R.length}</span>
        </div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      {rd && (
        <div className={'stage' + (anim ? ' anim' : '')} key={ri}>
          <p className="stage-title">{rd.emoji} {rd.title}</p>
          <div className="stage-row">
            <ShowAct d={d} team={A} a={rd.acts[0]} marks={Math.max(0, Math.min(3, st))} won={st >= 7 && rd.w === 0} />
            <ShowAct d={d} team={B} a={rd.acts[1]} marks={Math.max(0, Math.min(3, st - 3))} won={st >= 7 && rd.w === 1} />
          </div>
          <div className="judges">{SHOW_JUDGES.map((J) => <span key={J.name} className="judge" title={J.name}>{J.emoji}<small>{J.name}</small></span>)}</div>
        </div>
      )}
      {rd && <p className="duel-line" aria-live="polite">{st === 0 ? rd.acts.filter(Boolean).map((a) => a.act).join(' ') : st >= 7 ? (rd.w === 0 ? A : B).name + ' take the round' + (rd.tie ? ' on the crowd’s cheer!' : '!') : lastSay || 'The judges are thinking…'}</p>}
      {ri > 0 && <div className="mfeed" ref={feedRef}>
        {R.slice(0, ri).map((x, k) => <p key={k} className="mev"><span className="mm num">R{k + 1}</span><span>{x.emoji} <b>{x.title}:</b> {x.acts.map((a, s) => (a ? a.name + ' ' + a.total : null)).filter(Boolean).join(' v ')} → {(x.w === 0 ? A : B).name}</span></p>)}
      </div>}
      {!done && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setRi(R.length); setSt(0); }}>Skip to the end</button>}
      {done && <ShowSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}
function ShowSummary({ d, A, B, match }) {
  const W = match.winner === 0 ? A : B;
  const star = match.rounds.flatMap((r) => r.acts.map((a, s) => (a ? { a, s } : null))).filter(Boolean).sort((x, y) => y.a.total - x.a.total)[0];
  return (
    <div className="board msummary">
      <h3>🥰 Show summary</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {match.score[0]}–{match.score[1]} {B.name}</b> on rounds · points {match.pts[0]}–{match.pts[1]}</p>
      {match.rounds.map((r, k) => <p key={k} className="small" style={{ margin: 0 }}>{r.emoji} {r.title}: {r.acts.map((a) => (a ? a.name + ' (' + a.total + ')' : 'nobody')).join(' v ')} → <b>{(r.w === 0 ? A : B).name}</b></p>)}
      {star && <p className="small" style={{ margin: 0 }}>⭐ Star of the show: {star.a.name} ({(star.s === 0 ? A : B).name}) with {star.a.total}/30</p>}
      <p className="small" style={{ margin: 0 }}>🏅 {W.name} win{match.how === 'points' ? ' on total points' : match.how === 'crowd' ? ' — the crowd decided!' : ''}</p>
      <p className="hint" style={{ margin: 0 }}>Each judge has their own taste (fluff, tiny & funny, charm), scoring Draft Night’s estimated stats plus how they do on the night. Just for fun.</p>
    </div>
  );
}
