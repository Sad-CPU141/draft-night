/* ============================================================
   SUPERPOWER MISSIONS screen (rules in 29-missions.js).
   Mission by mission, stage by stage: who each team sent, and
   whether it worked.
   ============================================================ */
function MissionCell({ d, team, r, show }) {
  const item = r && r.itemId ? d.items[r.itemId] : null;
  return (
    <div className={'mcell' + (show ? (r.ok ? ' ok' : ' bad') : '')} style={mStyle(team)}>
      {item ? <ItemArt item={item} topic={d.topic} size={40} radius={10} /> : <span className="camp-none">🙅</span>}
      <div className="grow" style={{ minWidth: 0 }}>
        <b className="mc-p">{r ? r.power || 'Nobody' : ''}</b>
        <p className="small camp-text">{show ? (r.ok ? '✅ ' : '❌ ') + r.text : '…'}</p>
      </div>
    </div>
  );
}
function MissionView({ d, A, B, match, speed, onDone, label }) {
  const instant = speed === 'instant';
  const M = match.missions;
  const [mi, setMi] = useState(instant ? M.length : 0);
  const [st, setSt] = useState(0); // 0 intro, 1..3 stages shown, 4 result
  const fast = speed === 'fast';
  const done = mi >= M.length;
  const fired = useRef(false);
  const feedRef = useRef(null);
  useEffect(() => {
    if (done) { if (!fired.current) { fired.current = true; if (!instant) audio.play('whistle'); onDone && onDone(); } return undefined; }
    const m = M[mi]; const n = m.stages.length;
    const t = setTimeout(() => {
      if (st <= n) { const nx = st + 1; setSt(nx); if (nx <= n) { const s = m.stages[nx - 1]; audio.play(s.res.some((x) => x.chaos) ? 'big' : 'bid'); } else audio.play(m.close ? 'cheer' : 'gavel'); }
      else { setMi(mi + 1); setSt(0); }
    }, ms(st === 0 ? (fast ? 800 : 1600) : st <= n ? (fast ? 1000 : 2100) : (fast ? 1100 : 2200)));
    return () => clearTimeout(t);
  }, [mi, st, done]);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [mi]);
  const m = done ? null : M[mi];
  const n = m ? m.stages.length : 0;
  const score = m && st > n ? m.score : mi ? M[mi - 1].score : [0, 0];
  const anim = !reducedMotion();
  return (
    <div className="matchview missionview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid">
          <span className="sb-score num" aria-live="polite">{(done ? match.score : score)[0]}–{(done ? match.score : score)[1]}</span>
          <span className="sb-clock num">{done ? 'Missions won' : 'Mission ' + (mi + 1) + ' of ' + M.length}</span>
        </div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      {m && (
        <div className={'msscene' + (match.silly ? ' silly' : '') + (anim ? ' anim' : '')} key={mi}>
          <span className="sv-emoji" aria-hidden="true">{m.emoji}</span>
          <p className="eyebrow sv-when">{match.silly ? '🤡 Everyday mission ' : '🚨 Mission '}{mi + 1}</p>
          <h3 className="sv-title">{m.title}</h3>
          <p className="small sv-need">{m.stages.map((s) => MISSION_STATS[s.stat].emoji + ' ' + MISSION_STATS[s.stat].name).join(' → ')}</p>
        </div>
      )}
      {m && m.stages.slice(0, Math.min(st, n)).map((s, k) => (
        <div key={k} className="mstage">
          <p className="mstage-h small"><b>{k + 1}. {s.step}</b> <span className="muted">· {MISSION_STATS[s.stat].emoji} {MISSION_STATS[s.stat].name}</span></p>
          <div className="camps"><MissionCell d={d} team={A} r={s.res[0]} show /><MissionCell d={d} team={B} r={s.res[1]} show /></div>
        </div>
      ))}
      {m && st > n && <p className="duel-line">{(m.w === 0 ? A : B).name} win the mission{m.close ? ' — by a whisker!' : '!'} ({m.passed[m.w]} of {n} stages vs {m.passed[1 - m.w]})</p>}
      {mi > 0 && <div className="mfeed" ref={feedRef}>
        {M.slice(0, mi).map((x, k) => <p key={k} className="mev"><span className="mm num">M{k + 1}</span><span>{x.emoji} <b>{x.title}</b> → {(x.w === 0 ? A : B).name} ({x.passed[0]}–{x.passed[1]} stages)</span></p>)}
      </div>}
      {!done && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setMi(M.length); setSt(0); }}>Skip to the end</button>}
      {done && <MissionSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}
function MissionSummary({ d, A, B, match }) {
  const W = match.winner === 0 ? A : B;
  const mvp = (s) => { const c = {}; match.missions.forEach((m) => m.stages.forEach((x) => { const r = x.res[s]; if (r.ok && r.power) c[r.power] = (c[r.power] || 0) + 1; })); const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return top ? top[0] + ' (' + top[1] + ' stages)' : 'nobody'; };
  return (
    <div className="board msummary">
      <h3>{match.silly ? '🤡' : '💥'} Mission summary</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {match.score[0]}–{match.score[1]} {B.name}</b> on missions</p>
      {match.missions.map((m, k) => <p key={k} className="small" style={{ margin: 0 }}>{m.emoji} {m.title}: <b>{(m.w === 0 ? A : B).name}</b> ({m.passed[0]}–{m.passed[1]})</p>)}
      <p className="small" style={{ margin: 0 }}>⭐ MVP power: {A.name} — {mvp(0)} · {B.name} — {mvp(1)}</p>
      <p className="small" style={{ margin: 0 }}>🏅 {W.name} win</p>
      <p className="hint" style={{ margin: 0 }}>Each stage tests one stat (Draft Night’s estimates) plus luck{match.silly ? ', and the Chaos stat can flip a result' : ''}. Just for fun.</p>
    </div>
  );
}
