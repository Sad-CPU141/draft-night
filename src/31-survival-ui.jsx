/* ============================================================
   SURVIVAL SHOWDOWN screen (rules in 29-survival.js). Day by
   day: the event, then how each camp handles it with its kit.
   ============================================================ */
const NEED_LABEL = (need) => need.split('').map((t) => (SURVIVAL_TAGS[t] ? SURVIVAL_TAGS[t][1] + ' ' + SURVIVAL_TAGS[t][0] : '')).filter(Boolean).join(' · ');
function SurvivalCamp({ d, team, res, prev, show, set }) {
  const now = show && res ? res : prev;
  const food = now ? now.food : null, water = now ? now.water : null;
  const gone = prev && (prev.out || prev.rescued);
  const item = res && res.itemId ? d.items[res.itemId] : null;
  return (
    <div className={'camp' + (show && res ? (res.ok ? ' ok' : ' bad') : '') + (gone ? ' gone' : '')} style={mStyle(team)}>
      <div className="camp-head"><Badge m={team} size={30} /><b className="grow">{team.name}</b><span className="camp-mood" aria-label="How they’re doing">{gone ? (prev.rescued ? '🚁' : '💀') : moodOf(now ? now.cond : 100)}</span></div>
      <div className="camp-sup small">{food != null && <span>🍲 {food}d</span>}{water != null && <span>💧 {water}d</span>}</div>
      {gone ? <p className="small camp-text">{prev.rescued ? 'Rescued — safe and sound!' : 'Out of the game.'}</p>
        : show && res ? (
          <div className="camp-out">
            {item ? <ItemArt item={item} topic={d.topic} size={44} radius={10} /> : <span className="camp-none">{set === 'island' ? '🏝️' : '🧟'}</span>}
            <p className="small camp-text"><b>{res.ok ? '✅ ' : '❌ '}</b>{res.text}{res.notes.length ? <small className="muted"> · {res.notes.join(', ')}</small> : null}</p>
          </div>
        ) : <p className="small muted camp-text">…</p>}
    </div>
  );
}
function SurvivalView({ d, A, B, match, speed, onDone, label }) {
  const instant = speed === 'instant';
  const L = match.log;
  const [i, setI] = useState(instant ? L.length : 0);
  const [step, setStep] = useState(0); // 0 event, 1 team A, 2 team B
  const fast = speed === 'fast';
  const done = i >= L.length;
  const fired = useRef(false);
  const feedRef = useRef(null);
  useEffect(() => {
    if (done) { if (!fired.current) { fired.current = true; if (!instant) audio.play('whistle'); onDone && onDone(); } return undefined; }
    const day = L[i];
    const t = setTimeout(() => {
      if (step < 2) { const nx = step + 1; setStep(nx); const r = day.res[nx - 1]; if (r) audio.play(r.rescued ? 'fanfare' : r.out ? 'buzzer' : r.ok ? 'bid' : 'card'); }
      else { setI(i + 1); setStep(0); }
    }, ms(step === 0 ? (fast ? 700 : 1500) : step === 1 ? (fast ? 700 : 1500) : (fast ? 1000 : 2000)));
    return () => clearTimeout(t);
  }, [i, step, done]);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [i]);
  const day = done ? null : L[i];
  const prevRes = (s) => { for (let k = (done ? L.length : i) - 1; k >= 0; k--) if (L[k].res[s]) return L[k].res[s]; return null; };
  const shownScore = done ? match.score : [0, 1].map((s) => { const p = prevRes(s); return p && p.out ? Math.max(0, L.findIndex((x) => x.res[s] === p)) : (p && p.rescued ? SURVIVAL_DAYS : i); });
  const anim = !reducedMotion();
  return (
    <div className="matchview survivalview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid">
          <span className="sb-score num" aria-live="polite">{shownScore[0]}–{shownScore[1]}</span>
          <span className="sb-clock num">{done ? 'Days survived' : 'Day ' + day.day + ' of ' + SURVIVAL_DAYS}</span>
        </div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      {day && (
        <div className={'svscene ' + (day.ev.night ? 'night' : 'day') + ' ' + match.set + (anim ? ' anim' : '')} key={i}>
          <span className="sv-emoji" aria-hidden="true">{day.ev.emoji}</span>
          <p className="eyebrow sv-when">{day.ev.night ? '🌙 Night ' : '☀️ Day '}{day.day}</p>
          <h3 className="sv-title">{day.ev.title}</h3>
          <p className="small sv-need">Needs: {NEED_LABEL(day.ev.need)}</p>
        </div>
      )}
      {day && <div className="camps">
        <SurvivalCamp d={d} team={A} res={day.res[0]} prev={prevRes(0)} show={step >= 1} set={match.set} />
        <SurvivalCamp d={d} team={B} res={day.res[1]} prev={prevRes(1)} show={step >= 2} set={match.set} />
      </div>}
      {i > 0 && <div className="mfeed" ref={feedRef}>
        {L.slice(0, i).map((x) => (
          <p key={x.day} className="mev"><span className="mm num">D{x.day}</span><span>{x.ev.emoji} <b>{x.ev.title}.</b> {x.res.map((r, s) => (r ? (s === 0 ? A : B).name + (r.ok ? ' ✅' : ' ❌') + (r.item ? ' (' + r.item + ')' : '') + (r.rescued ? ' 🚁' : r.out ? ' 💀' : '') : null)).filter(Boolean).join(' · ')}</span></p>
        ))}
      </div>}
      {!done && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setI(L.length); setStep(0); }}>Skip to the end</button>}
      {done && <SurvivalSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}
function SurvivalSummary({ d, A, B, match }) {
  const W = match.winner === 0 ? A : B;
  const line = (t, s) => { const f = match.final[s]; return t.name + ': ' + (f.rescued ? 'rescued on day ' + f.rescued : f.out ? 'lasted ' + match.score[s] + ' day' + (match.score[s] === 1 ? '' : 's') : 'survived all ' + SURVIVAL_DAYS + ' days') + ' ' + moodOf(f.rescued ? 100 : f.cond); };
  const mvp = (s) => { const c = {}; match.log.forEach((x) => { const r = x.res[s]; if (r && r.ok && r.item) c[r.item] = (c[r.item] || 0) + 1; }); const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return top ? top[0] + ' (' + top[1] + '×)' : 'nothing'; };
  return (
    <div className="board msummary">
      <h3>{match.set === 'island' ? '🏝️' : '🧟'} Survival summary</h3>
      <p className="small" style={{ margin: 0 }}>{line(A, 0)}</p>
      <p className="small" style={{ margin: 0 }}>{line(B, 1)}</p>
      <p className="small" style={{ margin: 0 }}>⭐ Most useful: {A.name} — {mvp(0)} · {B.name} — {mvp(1)}</p>
      <p className="small" style={{ margin: 0 }}>🏅 {W.name} win{match.how === 'rescue' ? ' (got rescued first)' : match.how === 'shape' ? ' (same number of days, but in better shape)' : match.how === 'lastnight' ? ' (dead level, so one last night decided it)' : ''}</p>
      <p className="hint" style={{ margin: 0 }}>Both teams face the same days. Each event needs certain kit; the best matching item’s usefulness (a Draft Night estimate) sets the odds. Just for fun.</p>
    </div>
  );
}
