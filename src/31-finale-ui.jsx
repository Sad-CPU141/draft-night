/* ============================================================
   PICKING THE WINNER — screens. The rules live in 29-finale.js;
   these components only show state and call those functions.
   ============================================================ */

const EST_LABEL = 'Estimated game rating · not an official EA Sports FC / FIFA rating';
const ATTR_NAMES = { PAC: 'Pace', SHO: 'Shooting', PAS: 'Passing', DRI: 'Dribbling', DEF: 'Defending', PHY: 'Physical' };
const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

// Full rating card for one player: overall, role and six attributes.
function RatingCard({ item }) {
  const r = playerRating(item);
  return (
    <div className="ratingcard">
      <div className="rc-top">
        <span className="rc-ovr num">{r.ovr}</span>
        <span className="rc-role">{r.role}</span>
        <span className="rc-name">{item.name}</span>
      </div>
      <div className="rc-attrs">
        {ATTRS.map((a) => (
          <div key={a} className="rc-attr">
            <span className="k" title={ATTR_NAMES[a]}>{a}</span>
            <span className="bar"><i style={{ width: r.attrs[a] + '%' }} /></span>
            <span className="v num">{r.attrs[a]}</span>
          </div>
        ))}
      </div>
      <p className="hint" style={{ margin: 0 }}>{r.estimated ? EST_LABEL + '. Worked out from the card’s position and accolades; the same player always gets the same numbers.' : 'Overall set by the topic (manual override). Attributes are estimated from it.'}</p>
    </div>
  );
}
// Small chip on the auction card; tap for the full rating card.
function RatingChip({ item }) {
  const [open, setOpen] = useState(false);
  const r = playerRating(item);
  return (
    <>
      <button type="button" className="ratingchip" onClick={() => setOpen(true)} aria-label={'Rating ' + r.ovr + (r.estimated ? ', estimated' : '') + '. Show details'}>
        <b className="num">{r.ovr}</b>{r.estimated ? ' est.' : ''}
      </button>
      {open && <Sheet center onClose={() => setOpen(false)}><RatingCard item={item} /><button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button></Sheet>}
    </>
  );
}

// Team rating with the full working shown.
function TeamRatingPanel({ d, m }) {
  if (!isFootball(d.topic)) return null;
  const tr = teamRating(d, m);
  const players = [...tr.players].sort((a, b) => b.r.ovr - a.r.ovr);
  const weights = players.map((_, i) => Math.pow(0.92, i));
  return (
    <details className="teamrating">
      <summary>
        <span className="tr-num num">{tr.rating}</span>
        <span className="tr-lbl">Team rating{tr.provisional ? ' · provisional' : ''}</span>
        <span className="tr-more">How? ▾</span>
      </summary>
      <div className="tr-body">
        <p className="small" style={{ margin: 0 }}>Weighted average of the squad, best player first (each next player counts a little less, so one superstar can’t carry a team alone):</p>
        {players.map((p, i) => {
          const flex = !ROW_OF[norm(p.slot)];
          return <div key={p.item.id || p.item.name} className="tr-row"><span className="k">{p.slot}{flex ? ' (flex)' : ''}</span><span className="n">{p.item.name}</span><span className="v num">{p.r.ovr}</span><span className="w num">×{weights[i].toFixed(2)}</span></div>;
        })}
        <p className="small" style={{ margin: 0 }}>Squad average <b className="num">{tr.base}</b>{tr.coverage ? <> · coverage <b className="num">{tr.coverage}</b></> : null}{tr.chem ? <> · chemistry <b className="num">+{tr.chem}</b></> : null} = <b className="num">{tr.rating}</b></p>
        {tr.reasons.map((x) => <p key={x} className="hint" style={{ margin: 0 }}>• {x}</p>)}
        {tr.provisional && <p className="hint" style={{ margin: 0 }}>Provisional: {tr.players.length < d.rules.slots.length ? 'the squad isn’t full' : 'there’s no goalkeeper'}, so matches use a simplified line-up.</p>}
        <p className="hint" style={{ margin: 0 }}>Player ratings are estimated game ratings, not official ones.</p>
      </div>
    </details>
  );
}

function Badge({ m, size = 44 }) {
  return <span className="badge" style={{ ...mStyle(m), width: size, height: size, fontSize: size * 0.5 }} aria-hidden="true">{m.emoji}</span>;
}

/* ---------- bracket ---------- */
function BracketView({ d, onOpen, current }) {
  const b = d.finale.bracket; const R = b.rounds.length;
  const name = (id) => { const t = id && teamOf(d, id); return t ? t : null; };
  return (
    <div className="bracket" role="list" aria-label="Tournament bracket">
      {b.rounds.map((row, r) => (
        <div key={r} className="bcol" role="listitem">
          <p className="eyebrow">{roundName(R, r)}</p>
          {row.map((m, i) => {
            const A = name(m.a), B = name(m.b);
            const bye = m.why === 'Bye';
            const isCur = current && current.r === r && current.i === i;
            const played = m.winner && m.winner !== 'none' && !bye;
            const sc = m.match ? m.match.score : null;
            const line = (T, k) => (
              <div className={'bteam' + (m.winner && T && m.winner === T.id ? ' won' : m.winner && T ? ' lost' : '')} style={T ? mStyle(T) : null}>
                <span className="bt-n">{T ? T.emoji + ' ' + T.name : bye ? 'Bye' : '—'}</span>
                {sc && <span className="bt-s num">{sc[k]}{m.match.pens ? <small>({m.match.pens[k]})</small> : null}</span>}
              </div>
            );
            if (m.winner === 'none') return <div key={m.id} className="bmatch empty"><span className="hint">—</span></div>;
            return (
              <button key={m.id} type="button" className={'bmatch' + (isCur ? ' cur' : '') + (played ? ' done' : '')} disabled={!played || !onOpen} onClick={() => onOpen && onOpen({ r, i })} aria-label={(A ? A.name : 'TBD') + ' versus ' + (B ? B.name : bye ? 'bye' : 'TBD') + (played ? ', decided' : isCur ? ', up next' : '')}>
                {line(A, 0)}{line(B, 1)}
                {isCur && <span className="bm-tag">Up next</span>}
                {played && <span className="bm-tag ok">Decided ✓</span>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ---------- match animation ---------- */
const clockText = (min, et, stop) => (et ? min + '′ ET' : min > 90 ? '90+' + (min - 90) + '′' : min > 45 && !stop ? min + '′' : min + '′');
function MatchPlayer({ d, A, B, match, speed, commentary, onDone, label }) {
  const instant = speed === 'instant';
  const perMin = speed === 'fast' ? 190 : 430; // ~20s or ~45s for 90 minutes plus pauses
  const ev = match.events;
  const [pos, setPos] = useState(instant ? ev.length : 0);
  const [clock, setClock] = useState(instant ? (ev[ev.length - 1] || { min: 90 }).min : 0);
  const [et, setEt] = useState(instant ? !!match.et : false);
  const [wait, setWait] = useState(0);
  const [pause, setPause] = useState(null); // 'half' | 'goal' banner
  const done = pos >= ev.length;
  const feedRef = useRef(null);
  const fired = useRef(false);
  useEffect(() => {
    if (done) { if (!fired.current) { fired.current = true; if (!instant) audio.play('whistle'); onDone && onDone(); } return undefined; }
    const t = setTimeout(() => {
      setPause(null);
      const next = ev[pos];
      if (next.type === 'pen' || next.type === 'note' || next.min <= clock) {
        setPos(pos + 1);
        let w = 260;
        if (next.type === 'goal') { w = 1500; setPause('goal'); audio.play('cheer'); audio.say(callLine('goal', { who: next.player }), 2, d.id + ':' + label + ':g' + pos); }
        else if (next.type === 'half') { w = 1800; setPause('half'); audio.play('whistle'); }
        else if (next.type === 'kickoff') { audio.play('whistle'); w = 500; }
        else if (next.type === 'red') { audio.play('buzzer'); w = 900; }
        else if (next.type === 'et') { setEt(true); setClock(90); w = 1200; }
        else if (next.type === 'pens') w = 1200;
        else if (next.type === 'pen') { audio.play(next.scored ? 'bid' : 'buzzer'); w = 800; }
        setWait(ms(w));
      } else { setClock(clock + 1); setWait(ms(perMin)); }
    }, wait);
    return () => clearTimeout(t);
  }, [pos, clock, done]);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [pos]);
  const shown = ev.slice(0, pos);
  const lastScore = [...shown].reverse().find((e) => e.score);
  const score = done ? match.score : lastScore ? lastScore.score : [0, 0];
  const lastPen = [...shown].reverse().find((e) => e.pens);
  const pens = done ? match.pens : lastPen ? lastPen.pens : null;
  const keyTypes = ['goal', 'red', 'yellow', 'half', 'full', 'et', 'pens', 'pen', 'note', 'kickoff'];
  const feed = shown.filter((e) => commentary || keyTypes.includes(e.type));
  const trA = isFootball(d.topic) ? teamRating(d, A).rating : null, trB = isFootball(d.topic) ? teamRating(d, B).rating : null;
  return (
    <div className="matchview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span>{trA != null && <span className="sb-r num">{trA}</span>}</div>
        <div className="sb-mid">
          <span className="sb-score num" aria-live="polite">{score[0]}–{score[1]}</span>
          {pens && <span className="sb-pens num">pens {pens[0]}–{pens[1]}</span>}
          <span className="sb-clock num">{done ? (match.pens ? 'FT · pens' : match.et ? 'AET' : 'FT') : clockText(clock, et)}</span>
        </div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span>{trB != null && <span className="sb-r num">{trB}</span>}</div>
      </div>
      {!done && <div className="sb-progress"><i style={{ width: Math.min(100, (clock / (et ? 120 : 95)) * 100) + '%' }} /></div>}
      {pause === 'half' && !done && <div className="mbanner">HALF-TIME · {score[0]}–{score[1]}</div>}
      {pause === 'goal' && !done && <div className={'mbanner goal' + (reducedMotion() ? '' : ' pop')}>GOAL!</div>}
      <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map((e, k) => (
          <p key={k} className={'mev ' + e.type + (e.team != null ? ' t' + e.team : '')}>
            <span className="mm num">{e.type === 'pen' || e.type === 'pens' ? 'PEN' : e.type === 'note' ? 'i' : e.min + '′'}</span>
            <span>{e.type === 'goal' ? '⚽ ' : e.type === 'yellow' ? '🟨 ' : e.type === 'red' ? '🟥 ' : e.type === 'pen' ? (e.scored ? '✅ ' : '❌ ') : ''}{e.text}{e.team != null && e.type !== 'pen' ? <small> · {(e.team === 0 ? A : B).name}</small> : null}</span>
          </p>
        ))}
      </div>
      {!done && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPos(ev.length); setClock(ev[ev.length - 1].min); }}>Skip to full-time</button>}
      {done && <MatchSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}

function MatchSummary({ d, A, B, match }) {
  const goals = [0, 1].map((k) => match.events.filter((e) => e.type === 'goal' && e.team === k));
  const cards = match.events.filter((e) => e.type === 'yellow' || e.type === 'red');
  const incomplete = [A, B].filter((t) => isFootball(d.topic) && teamRating(d, t).provisional);
  return (
    <div className="board msummary">
      <h3>📋 Match summary</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {match.score[0]}–{match.score[1]} {B.name}</b>{match.et ? ' · after extra time' : ''}{match.pens ? ' · ' + (match.pens[0] > match.pens[1] ? A.name : B.name) + ' win ' + Math.max(...match.pens) + '–' + Math.min(...match.pens) + ' on penalties' : ''}</p>
      {[A, B].map((t, k) => <p key={t.id} className="small" style={{ margin: 0 }}>⚽ {t.name}: {goals[k].length ? goals[k].map((g) => g.player + ' ' + g.min + '′' + (g.assist ? ' (assist ' + g.assist + ')' : '')).join(', ') : 'no goals'}</p>)}
      {cards.length > 0 && <p className="small" style={{ margin: 0 }}>{cards.map((c) => (c.type === 'red' ? '🟥 ' : '🟨 ') + c.player + ' ' + c.min + '′').join(' · ')}</p>}
      {!match.forfeit && <div className="mstats">
        <span>Shots</span><b className="num">{match.stats.shots[0]}</b><b className="num">{match.stats.shots[1]}</b>
        <span>Possession</span><b className="num">{match.stats.possession[0]}%</b><b className="num">{match.stats.possession[1]}%</b>
      </div>}
      {match.notes.map((n) => <p key={n} className="hint" style={{ margin: 0 }}>ℹ️ {n}</p>)}
      {incomplete.map((t) => <p key={t.id} className="hint" style={{ margin: 0 }}>ℹ️ {t.name}’s squad is incomplete, so empty slots count as weak players (simplified simulation).</p>)}
      <p className="hint" style={{ margin: 0 }}>A game simulation from the drafted squads and estimated ratings. It doesn’t predict real results.</p>
    </div>
  );
}

/* ---------- voting on one matchup ---------- */
function MatchVote({ d, r, i, onChange, onCount }) {
  const m = getMatchup(d, r, i);
  const A = teamOf(d, m.a), B = teamOf(d, m.b);
  const solo = d.mode === 'solo';
  const voters = matchVoters(d, m);
  const humans = voters.filter((p) => !p.bot);
  const [voter, setVoter] = useState(solo && humans[0] && !hasMatchVote(m, humans[0].id) ? humans[0].id : null);
  const [choice, setChoice] = useState(null);
  const [locked, setLocked] = useState(false);
  const nVoted = voters.filter((p) => hasMatchVote(m, p.id)).length;
  const allIn = votingDone(d, m);
  const neutral = voters.every((p) => p.teamId !== m.a && p.teamId !== m.b);
  if (locked) return (
    <div className="card stack-sm" style={{ textAlign: 'center' }}>
      <h2 className="display" style={{ fontSize: 34 }}>Vote locked 🔒</h2>
      {solo ? <p className="muted" style={{ margin: 0 }}>🤖 The bots have voted too.</p> : <p className="muted" style={{ margin: 0 }}>Pass the phone to the next voter.</p>}
      <button className="btn btn-gold" onClick={() => { setLocked(false); setVoter(null); setChoice(null); if (solo) onCount(); }}>{solo ? 'Count the votes' : 'Next voter'}</button>
    </div>
  );
  if (voter) {
    const v = voters.find((p) => p.id === voter);
    return (
      <div className="stack-sm">
        <p className="eyebrow">Secret vote · {A.name} v {B.name}</p>
        <h2 className="display" style={{ fontSize: 30, color: v.color }}>{v.emoji} {v.name}, who’s stronger?</h2>
        <p className="hint">You can’t vote for your own team.</p>
        {[A, B].map((t) => {
          const own = !canVoteFor(v, t.id);
          return (
            <button key={t.id} className="votebtn" style={{ ...mStyle(t), alignItems: 'stretch', textAlign: 'left' }} disabled={own} aria-pressed={choice === t.id} onClick={() => setChoice(t.id)}>
              <span>{t.emoji} {t.name}{own ? ' · your team' : ''}{isFootball(d.topic) ? <small> · rating {teamRating(d, t).rating}</small> : null}</span>
              <span className="teamtxt">{t.team.filter(Boolean).map((x) => d.items[x.itemId].name).join(', ')}</span>
            </button>
          );
        })}
        <div className="row">
          {!solo && <button type="button" className="btn btn-ghost grow" onClick={() => { setVoter(null); setChoice(null); }}>Back</button>}
          <button type="button" className="btn btn-gold grow" disabled={!choice} onClick={() => { buzz(30); onChange(castMatchVote(d, r, i, voter, choice)); setLocked(true); }}>{choice ? 'Lock in ' + teamOf(d, choice).name : 'Pick a team'}</button>
        </div>
      </div>
    );
  }
  return (
    <div className="stack-sm">
      <p className="eyebrow">Matchup vote · {nVoted} of {voters.length} in</p>
      <h2 className="display" style={{ fontSize: 30 }}>{A.emoji} {A.name} v {B.emoji} {B.name}</h2>
      <p className="hint">{neutral ? 'Players who aren’t in this matchup vote. ' : 'Everyone is on one of these teams, so everyone votes — never for their own team. '}{m.revoted ? 'This is the revote after a tie.' : 'Votes stay secret until they’re counted.'}</p>
      {m.note && <p className="warn">{m.note}</p>}
      {!humans.length && <p className="hint">Only bots vote on this one. They’ve voted.</p>}
      {humans.length > 0 && <div className="votegrid">
        {humans.map((p) => { const done = hasMatchVote(m, p.id); return (
          <button key={p.id} className="votebtn" style={mStyle(p)} disabled={done} onClick={() => setVoter(p.id)}>
            <span style={{ fontSize: 24 }}>{done ? '✅' : p.emoji}</span>{p.name}{p.teamName ? <small>{p.teamName}</small> : null}
          </button>
        ); })}
      </div>}
      <button className="btn btn-gold" disabled={!allIn && !nVoted} onClick={onCount}>{allIn ? 'Count the votes' : 'Count now (' + nVoted + '/' + voters.length + ')'}</button>
    </div>
  );
}

/* ---------- the finale, matchup by matchup ---------- */
function Finale({ d, onChange, onClose, onChampion }) {
  const fin = d.finale; const cfg = finCfg(d); const mode = fin.mode;
  const nx = nextMatchup(fin.bracket);
  const [stage, setStage] = useState('overview');
  const [cur, setCur] = useState(null); // { r, i } of the matchup being played
  const [matchOver, setMatchOver] = useState(false);
  const [view, setView] = useState(null); // decided matchup to look at
  const R = fin.bracket.rounds.length;
  const modeName = { bracket: 'Head-to-head bracket', sim: 'Match simulator', combined: 'Combined finale' }[mode];
  const begin = () => {
    const at = { r: nx.r, i: nx.i }; setCur(at); setMatchOver(false);
    if (needsVote(mode)) { onChange(botMatchVotes(d, at.r, at.i)); setStage('vote'); }
    else { onChange(playMatchup(d, at.r, at.i)); setStage('match'); }
  };
  const finish = () => {
    let n = resolveMatchup(d, cur.r, cur.i);
    const m = getMatchup(n, cur.r, cur.i);
    if (!m.winner && m.revoted) { n = botMatchVotes(n, cur.r, cur.i); onChange(n); setStage('vote'); return; }
    onChange(n); setStage('result');
    if (m.winner) audio.play(n.finale.champion ? 'fanfare' : 'gavel');
  };
  const counted = () => { if (needsMatch(mode)) { setMatchOver(false); onChange(playMatchup(d, cur.r, cur.i)); setStage('match'); } else finish(); };
  const cm = cur && getMatchup(d, cur.r, cur.i);
  const A = cm && cm.a && teamOf(d, cm.a), B = cm && cm.b && teamOf(d, cm.b);
  let body;
  if (stage === 'vote' && cm && !cm.winner) body = <MatchVote key={cm.id + (cm.revoted ? 'r' : '')} d={d} r={cur.r} i={cur.i} onChange={onChange} onCount={counted} />;
  else if (stage === 'match' && cm && cm.match) body = (
    <>
      <p className="eyebrow" style={{ textAlign: 'center' }}>{roundName(R, cur.r)}{cur.r === R - 1 ? ' · the big one' : ''}</p>
      <MatchPlayer key={cm.id} d={d} A={A} B={B} match={cm.match} speed={cfg.speed} commentary={cfg.commentary} label={cm.id} onDone={() => setMatchOver(true)} />
      {matchOver && <button className="btn btn-gold" onClick={finish}>{mode === 'combined' ? 'Combine with the votes' : 'Continue'}</button>}
    </>
  );
  else if (stage === 'result' && cm && cm.winner) body = <MatchupResult d={d} m={cm} r={cur.r} final={cur.r === R - 1} onNext={() => { if (d.finale.champion) onChampion(); else { setStage('overview'); setCur(null); } }} />;
  else body = (
    <>
      <div className="card stack-sm">
        <p className="eyebrow">{modeName}</p>
        {nx ? <>
          <h2 className="display" style={{ fontSize: 30 }}>{roundName(R, nx.r)}{nx.r === R - 1 ? ' 🏆' : ''}</h2>
          <div className="vsrow">
            {[nx.m.a, nx.m.b].map((id, k) => { const t = teamOf(d, id); return <React.Fragment key={id}>{k === 1 && <span className="vs">VS</span>}<div className="vsteam"><Badge m={t} size={52} /><b>{t.name}</b>{isFootball(d.topic) && <span className="small num">Rating {teamRating(d, t).rating}{teamRating(d, t).provisional ? ' (prov.)' : ''}</span>}</div></React.Fragment>; })}
          </div>
          <button className="btn btn-gold" onClick={begin}>{needsVote(mode) ? (mode === 'combined' ? 'Vote, then kick off' : 'Vote on this matchup') : 'Kick off'}</button>
        </> : fin.champion ? <>
          <h2 className="display" style={{ fontSize: 30 }}>We have a champion</h2>
          <button className="btn btn-gold" onClick={onChampion}>🏆 Reveal the champion</button>
        </> : <>
          <h2 className="display" style={{ fontSize: 28 }}>No matchups to play</h2>
          <p className="hint" style={{ margin: 0 }}>No team has any players, so there’s nobody to crown.</p>
        </>}
      </div>
      <BracketView d={d} current={nx} onOpen={setView} />
      {mode === 'combined' && <p className="hint">Combined score: {cfg.weight}% match performance + {100 - cfg.weight}% votes. If it’s dead level, the match result (extra time or penalties) decides.</p>}
    </>
  );
  return (
    <div className="finale" role="dialog" aria-modal="true" aria-label="Finale">
      <div className="app">
        <TopBar onBack={onClose} backLabel="✕" title="Finale" right={<MuteButton />} />
        {body}
      </div>
      {view && <MatchupSheet d={d} at={view} onClose={() => setView(null)} />}
    </div>
  );
}

function MatchupResult({ d, m, r, final, onNext }) {
  const W = teamOf(d, m.winner); const L = teamOf(d, m.winner === m.a ? m.b : m.a);
  const A = teamOf(d, m.a), B = teamOf(d, m.b);
  const va = Object.values(m.votes || {}).filter((v) => v === m.a).length, vb = Object.values(m.votes || {}).filter((v) => v === m.b).length;
  const mode = d.finale.mode; const cfg = finCfg(d);
  const perfA = m.match ? (m.match.score[0] + 0.5) / (m.match.score[0] + m.match.score[1] + 1) : null;
  const voteA = va + vb ? va / (va + vb) : 0.5;
  return (
    <div className="stack">
      <div className="winner">
        <p className="eyebrow" style={{ color: 'var(--gold-ink)' }}>{final ? 'Winner of the final' : 'Through to the next round'}</p>
        <div className="display">{W.emoji} {W.name}</div>
        <p className="small" style={{ margin: '4px 0 0', fontWeight: 700 }}>{m.why}</p>
      </div>
      {needsVote(mode) && <div className="board"><h3>🗳️ Votes</h3>
        <div className="brow" style={mStyle(A)}><span className="bn">{A.emoji} {A.name}</span><span className="bw num">{va}</span></div>
        <div className="brow" style={mStyle(B)}><span className="bn">{B.emoji} {B.name}</span><span className="bw num">{vb}</span></div>
        <p className="hint" style={{ margin: 0 }}>{Object.entries(m.votes || {}).map(([pid, t]) => { const p = participants(d).find((x) => x.id === pid); return (p ? p.name : '?') + ' → ' + teamOf(d, t).name; }).join(' · ') || 'No votes were cast.'}</p>
      </div>}
      {mode === 'combined' && m.match && (
        <div className="board"><h3>🧮 How it was decided</h3>
          {[[A, perfA, voteA], [B, 1 - perfA, 1 - voteA]].map(([t, p, v]) => (
            <div key={t.id} className="combo">
              <span className="bn">{t.emoji} {t.name}</span>
              <span className="cbar"><i className="m" style={{ width: p * cfg.weight + '%' }} /><i className="v" style={{ width: v * (100 - cfg.weight) + '%' }} /></span>
              <b className="num">{Math.round((p * cfg.weight + v * (100 - cfg.weight)))}%</b>
            </div>
          ))}
          <p className="hint" style={{ margin: 0 }}><span className="key m" /> match {cfg.weight}% · <span className="key v" /> votes {100 - cfg.weight}%. {m.detail}. Match share = (goals + ½) ÷ (total goals + 1), so a 6–5 isn’t worth more than a 2–1 swing.</p>
        </div>
      )}
      {m.match && <MatchSummary d={d} A={A} B={B} match={m.match} />}
      <p className="hint">{L.name} {final ? 'finish as runners-up.' : 'are knocked out.'}</p>
      <button className="btn btn-gold" onClick={onNext}>{d.finale.champion ? '🏆 Reveal the champion' : 'Back to the bracket'}</button>
    </div>
  );
}

// Look at a decided matchup; matches can be watched again from the record (nothing changes).
function MatchupSheet({ d, at, onClose }) {
  const m = getMatchup(d, at.r, at.i);
  const [replay, setReplay] = useState(false);
  if (!m || !m.a || !m.b) return null;
  const A = teamOf(d, m.a), B = teamOf(d, m.b);
  const cfg = finCfg(d);
  return (
    <Sheet center onClose={onClose}>
      <p className="eyebrow">{roundName(d.finale.bracket.rounds.length, at.r)}</p>
      <h2 className="display" style={{ fontSize: 28 }}>{A.name} v {B.name}</h2>
      {m.why && <p className="small" style={{ margin: 0, fontWeight: 700 }}>{m.why}</p>}
      {m.detail && <p className="hint" style={{ margin: 0 }}>{m.detail}</p>}
      {replay && m.match ? <MatchPlayer d={d} A={A} B={B} match={m.match} speed={cfg.speed === 'instant' ? 'fast' : cfg.speed} commentary={cfg.commentary} label={m.id + ':replay'} />
        : m.match ? <MatchSummary d={d} A={A} B={B} match={m.match} /> : null}
      {m.match && !replay && <button className="btn" onClick={() => setReplay(true)}>▶ Watch again (recorded, same result)</button>}
      <button className="btn btn-ghost" onClick={onClose}>Close</button>
    </Sheet>
  );
}

// Friendly / rematch: any two teams, simulated fresh each time, never saved.
function FriendlySheet({ d, onClose }) {
  const teams = d.managers.filter((m) => m.team.some(Boolean));
  const [a, setA] = useState(teams[0] ? teams[0].id : null);
  const [b, setB] = useState(teams[1] ? teams[1].id : null);
  const [game, setGame] = useState(null);
  const [n, setN] = useState(0);
  const cfg = finCfg(d);
  if (teams.length < 2) return <Sheet center onClose={onClose}><h2 className="display" style={{ fontSize: 28 }}>Friendly match</h2><p className="hint">You need two teams with players.</p><button className="btn btn-ghost" onClick={onClose}>Close</button></Sheet>;
  const play = () => { const k = n + 1; setN(k); setGame({ A: teamOf(d, a), B: teamOf(d, b), match: simulateMatch(d, teamOf(d, a), teamOf(d, b), 'friendly:' + Date.now() + ':' + k, false), k }); };
  return (
    <Sheet center onClose={onClose}>
      <p className="eyebrow">Exhibition · doesn’t change any result</p>
      <h2 className="display" style={{ fontSize: 28 }}>Friendly match</h2>
      {game ? <>
        <MatchPlayer key={game.k} d={d} A={game.A} B={game.B} match={game.match} speed={cfg.speed} commentary={cfg.commentary} label={'friendly' + game.k} />
        <div className="row"><button className="btn grow" onClick={play}>Rematch</button><button className="btn btn-ghost grow" onClick={() => setGame(null)}>Pick teams</button></div>
      </> : <>
        <div className="field"><label htmlFor="fr-a">Home</label><select id="fr-a" className="input" value={a} onChange={(e) => setA(e.target.value)}>{teams.map((t) => <option key={t.id} value={t.id} disabled={t.id === b}>{t.emoji} {t.name} · {teamRating(d, t).rating}</option>)}</select></div>
        <div className="field"><label htmlFor="fr-b">Away</label><select id="fr-b" className="input" value={b} onChange={(e) => setB(e.target.value)}>{teams.map((t) => <option key={t.id} value={t.id} disabled={t.id === a}>{t.emoji} {t.name} · {teamRating(d, t).rating}</option>)}</select></div>
        <button className="btn btn-gold" disabled={!a || !b || a === b} onClick={play}>Kick off</button>
        <p className="hint">Friendlies can end in a draw. Each kick-off is a new random game.</p>
      </>}
      <button className="btn btn-ghost" onClick={onClose}>Close</button>
    </Sheet>
  );
}

// Champion banner and bracket for the Results screen.
function FinaleResults({ d, onOpen }) {
  const f = d.finale; const champ = teamOf(d, f.champion);
  const games = playedMatchups(f.bracket);
  const last = games[games.length - 1];
  const final = last && last.m.winner === champ.id ? last.m : null;
  const ru = final ? teamOf(d, final.a === champ.id ? final.b : final.a) : null;
  const tr = isFootball(d.topic) ? teamRating(d, champ) : null;
  const sc = final && final.match ? (final.a === champ.id ? final.match.score : [...final.match.score].reverse()) : null;
  return (
    <>
      <div className="winner">
        <p className="eyebrow" style={{ color: 'var(--gold-ink)' }}>Champion · {needsMatch(f.mode) ? 'won the knockout' : 'won the bracket'}</p>
        <div className="display">{champ.emoji} {champ.name}</div>
        {champ.members && <p className="small" style={{ margin: 0, fontWeight: 700 }}>{champ.members.map((p) => p.name).join(' · ')}</p>}
        <p className="small" style={{ margin: '6px 0 0', fontWeight: 700 }}>
          {ru ? 'Beat ' + ru.name + ' in the final' + (sc ? ' ' + sc[0] + '–' + sc[1] + (final.match.pens ? ' (pens)' : final.match.et ? ' (AET)' : '') : '') : 'Walked through'}{tr ? ' · team rating ' + tr.rating : ''}
        </p>
        {d.mode === 'solo' && champ.human && <p className="small" style={{ margin: '4px 0 0', fontWeight: 700 }}>You beat the bots!</p>}
      </div>
      <div className="board"><h3>🧠 Why they won</h3><p className="small" style={{ margin: 0 }}>{championStory(d)}</p></div>
      <div className="board"><h3>🗂️ Bracket</h3><BracketView d={d} onOpen={onOpen} /><p className="hint" style={{ margin: 0 }}>Tap a decided matchup to see how it went.</p></div>
      <div className="board"><h3>📊 Final standings</h3>
        {finaleStandings(d).map((s) => <div key={s.team.id} className={'brow' + (s.label === 'Champion' ? ' hl' : '')} style={mStyle(s.team)}><span className="bn">{s.team.emoji} {s.team.name}</span><span className="small" style={{ fontWeight: 700 }}>{s.label}</span>{isFootball(d.topic) && <span className="bw num" style={{ fontSize: 18 }}>{teamRating(d, s.team).rating}</span>}</div>)}
      </div>
    </>
  );
}
