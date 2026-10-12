/* ============================================================
   FUN BATTLE screens (rules in 29-battles.js). Duels are shown one
   at a time: both picks face off, then the winner lights up.
   ============================================================ */

function BattleFighter({ d, e, team, won, lost, bar, barName, hurt }) {
  if (!e) return <div className="fighter empty" style={mStyle(team)}><span className="f-art">—</span><b className="f-n">Nobody</b><span className="f-t">{team.name}</span></div>;
  const item = d.items[e.itemId] || { name: e.name, emoji: e.emoji };
  return (
    <div className={'fighter' + (won ? ' won' : '') + (lost ? ' lost' : '') + (hurt ? ' ' + hurt : '')} style={mStyle(team)}>
      <span className="f-art"><ItemArt item={item} topic={d.topic} size={72} /></span>
      <b className="f-n">{e.name}</b>
      <span className="f-t">{team.emoji} {team.name} · ${e.price}</span>
      {bar != null && <span className="f-bar" role="meter" aria-label={barName} aria-valuenow={bar} aria-valuemin={0} aria-valuemax={100}><i style={{ width: bar + '%' }} className={bar <= 25 ? 'low' : ''} /><small>{barName} {bar}</small></span>}
    </div>
  );
}

function BattleView({ d, A, B, match, speed, onDone, label }) {
  const kind = BATTLE_KINDS[match.kind] || BATTLE_KINDS.fight;
  const instant = speed === 'instant';
  const N = match.duels.length;
  const [shown, setShown] = useState(instant ? N : 0);
  const [step, setStep] = useState(0); // 0 = face off, 1..H = moves, H+1 = result
  const fast = speed === 'fast';
  const done = shown >= N;
  const fired = useRef(false);
  const feedRef = useRef(null);
  const cur = done ? null : match.duels[shown];
  const H = cur ? (cur.hits || []).length : 0;
  const hit = !!cur && step > H;
  useEffect(() => {
    if (done) { if (!fired.current) { fired.current = true; if (!instant) audio.play('whistle'); onDone && onDone(); } return undefined; }
    if (step <= H) {
      const t = setTimeout(() => { const nx = step + 1; setStep(nx); if (nx > H) audio.play(cur.upset ? 'cheer' : 'gavel'); else audio.play('bid'); }, ms(step === 0 ? (fast ? 450 : 900) : (fast ? 550 : 1100)));
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setShown(shown + 1); setStep(0); }, ms((fast ? 800 : 1700) + (cur.upset ? 700 : 0)));
    return () => clearTimeout(t);
  }, [shown, step, done]);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [shown]);
  const score = hit ? cur.score : shown ? match.duels[shown - 1].score : [0, 0];
  const bars = cur && cur.a && cur.b ? battleBars(kind, cur.hits || [], Math.min(step, H)) : [null, null];
  const lastMove = cur && step >= 1 && step <= H ? cur.hits[step - 1] : null;
  const hurtSide = lastMove && kind.bar !== 'meter' ? 1 - lastMove.by : null;
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
      {!done && <div className="sb-progress"><i style={{ width: ((shown + (H ? Math.min(step, H + 1) / (H + 1) : hit ? 1 : 0.5)) / N) * 100 + '%' }} /></div>}
      {cur && (
        <div className={'duel' + (anim ? ' anim' : '') + (hit ? ' hit w' + cur.w : '')} key={shown}>
          <p className="eyebrow" style={{ textAlign: 'center' }}>{roundLabel(cur, shown)}</p>
          <div className="duel-row">
            <BattleFighter d={d} e={cur.a} team={A} won={hit && cur.w === 0} lost={hit && cur.w === 1} bar={bars[0]} barName={kind.barName} hurt={anim && hurtSide === 0 ? 'hurt' + (step % 2) : ''} />
            <span className={'clash' + (lastMove && anim ? ' hitting' : '')} aria-hidden="true" key={'c' + step}>{kind.emoji}</span>
            <BattleFighter d={d} e={cur.b} team={B} won={hit && cur.w === 1} lost={hit && cur.w === 0} bar={bars[1]} barName={kind.barName} hurt={anim && hurtSide === 1 ? 'hurt' + (step % 2) : ''} />
          </div>
          <p className={'duel-line' + (cur.upset && hit ? ' upset' : '') + (lastMove ? ' move t' + lastMove.by : '')} aria-live="polite">{hit ? cur.line : lastMove ? lastMove.line : 'Face off…'}</p>
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
      {!done && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShown(N); setStep(0); }}>Skip to the end</button>}
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
