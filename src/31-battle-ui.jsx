/* ============================================================
   FUN BATTLE screens (rules in 29-battles.js). Duels are shown one
   at a time: both picks face off, then the winner lights up.
   ============================================================ */

function BattleFighter({ d, e, team, won, lost }) {
  if (!e) return <div className="fighter empty" style={mStyle(team)}><span className="f-art">—</span><b className="f-n">Nobody</b><span className="f-t">{team.name}</span></div>;
  const item = d.items[e.itemId] || { name: e.name, emoji: e.emoji };
  return (
    <div className={'fighter' + (won ? ' won' : '') + (lost ? ' lost' : '')} style={mStyle(team)}>
      <span className="f-art"><ItemArt item={item} topic={d.topic} size={72} /></span>
      <b className="f-n">{e.name}</b>
      <span className="f-t">{team.emoji} {team.name} · ${e.price}</span>
    </div>
  );
}

function BattleView({ d, A, B, match, speed, onDone, label }) {
  const kind = BATTLE_KINDS[match.kind] || BATTLE_KINDS.fight;
  const instant = speed === 'instant';
  const N = match.duels.length;
  const [shown, setShown] = useState(instant ? N : 0);
  const [hit, setHit] = useState(false);
  const step = speed === 'fast' ? 1300 : 2800;
  const done = shown >= N;
  const fired = useRef(false);
  const feedRef = useRef(null);
  useEffect(() => {
    if (done) { if (!fired.current) { fired.current = true; if (!instant) audio.play('whistle'); onDone && onDone(); } return undefined; }
    const du = match.duels[shown];
    if (!hit) { const t = setTimeout(() => { setHit(true); audio.play(du.upset ? 'cheer' : 'gavel'); }, ms(step * 0.5)); return () => clearTimeout(t); }
    const t = setTimeout(() => { setShown(shown + 1); setHit(false); }, ms(step * 0.5 + (du.upset ? 700 : 0)));
    return () => clearTimeout(t);
  }, [shown, hit, done]);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [shown]);
  const cur = done ? null : match.duels[shown];
  const score = cur && hit ? cur.score : shown ? match.duels[shown - 1].score : [0, 0];
  const anim = !reducedMotion();
  const roundLabel = (du, k) => (du.slot === 'Sudden death' ? '⚡ Sudden death' : kind.round + ' ' + (k + 1) + ' · ' + du.slot);
  return (
    <div className="matchview battleview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid">
          <span className="sb-score num" aria-live="polite">{score[0]}–{score[1]}</span>
          <span className="sb-clock num">{done ? 'Final' + (match.sudden ? ' · sudden death' : '') : kind.round + ' ' + (shown + 1) + ' of ' + N}</span>
        </div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      {!done && <div className="sb-progress"><i style={{ width: ((shown + (hit ? 1 : 0.5)) / N) * 100 + '%' }} /></div>}
      {cur && (
        <div className={'duel' + (anim ? ' anim' : '') + (hit ? ' hit w' + cur.w : '')} key={shown}>
          <p className="eyebrow" style={{ textAlign: 'center' }}>{roundLabel(cur, shown)}</p>
          <div className="duel-row">
            <BattleFighter d={d} e={cur.a} team={A} won={hit && cur.w === 0} lost={hit && cur.w === 1} />
            <span className="clash" aria-hidden="true">{kind.emoji}</span>
            <BattleFighter d={d} e={cur.b} team={B} won={hit && cur.w === 1} lost={hit && cur.w === 0} />
          </div>
          <p className={'duel-line' + (cur.upset && hit ? ' upset' : '')} aria-live="polite">{hit ? cur.line : 'Face off…'}</p>
        </div>
      )}
      {shown > 0 && <div className="mfeed" ref={feedRef} aria-live="polite">
        {match.duels.slice(0, shown).map((du, k) => (
          <p key={k} className={'mev ' + (du.upset ? 'goal' : 'chance') + ' t' + du.w}>
            <span className="mm num">{du.slot === 'Sudden death' ? '⚡' : 'R' + (k + 1)}</span>
            <span>{du.upset ? '😱 ' : ''}{du.line}<small> · {(du.w === 0 ? A : B).name}</small></span>
          </p>
        ))}
      </div>}
      {!done && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShown(N); setHit(false); }}>Skip to the end</button>}
      {done && <BattleSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}

function BattleSummary({ d, A, B, match }) {
  const kind = BATTLE_KINDS[match.kind] || BATTLE_KINDS.fight;
  const W = match.winner === 0 ? A : B;
  const upsets = match.duels.filter((x) => x.upset).length;
  return (
    <div className="board msummary">
      <h3>{kind.emoji} {kind.name} summary</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {match.score[0]}–{match.score[1]} {B.name}</b>{match.sudden ? ' · decided in sudden death' : ''}</p>
      {match.duels.map((du, k) => (
        <p key={k} className="small" style={{ margin: 0 }}>{du.slot === 'Sudden death' ? '⚡' : kind.round + ' ' + (k + 1)}: {du.a ? du.a.name : 'nobody'} v {du.b ? du.b.name : 'nobody'} → <b>{(du.w === 0 ? du.a : du.b).name}</b>{du.upset ? ' (upset!)' : ''}</p>
      ))}
      <p className="small" style={{ margin: 0 }}>🏅 {W.name} win{upsets ? ' · ' + upsets + ' upset' + (upsets === 1 ? '' : 's') : ''}</p>
      <p className="hint" style={{ margin: 0 }}>Just for fun: the pick the room paid more for has the edge in each duel (never more than 78%), and luck does the rest. It’s not a real prediction.</p>
    </div>
  );
}
