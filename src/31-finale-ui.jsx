/* ============================================================
   PICKING THE WINNER — screens. The rules live in 29-finale.js;
   these components only show state and call those functions.
   ============================================================ */

const EST_LABEL = 'Estimated by Draft Night · not official EA Sports FC / FIFA numbers';
const ATTR_NAMES = { PAC: 'Pace', SHO: 'Shooting', PAS: 'Passing', DRI: 'Dribbling', DEF: 'Defending', PHY: 'Physical' };
// The app's Motion setting wins; "Match my device" follows the phone's reduce-motion setting.
const reducedMotion = () => { const m = document.documentElement.getAttribute('data-motion'); if (m === 'reduce') return true; if (m === 'full') return false; return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); };

// Full player card: the Now or Prime number, role and six attributes.
function RatingCard({ item, topic }) {
  const r = playerRating(item); const era = eraWord(topic);
  return (
    <div className="ratingcard">
      <div className="rc-top">
        <span className="rc-ovr num"><small className="rc-era">{era}</small>{r.ovr}</span>
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
      <p className="hint" style={{ margin: 0 }}>{(era === 'Now' ? 'Now: how good they are today. ' : 'Prime: how good they were at their peak. ') + (r.estimated ? EST_LABEL + '. Worked out from the card’s position and accolades; the same player always gets the same numbers.' : 'Number set by the topic (manual override). Attributes are estimated from it.')}</p>
    </div>
  );
}
// Small chip on the auction card ("Prime 91"); tap for the full card.
function RatingChip({ item, topic }) {
  const [open, setOpen] = useState(false);
  if (!numbersShown()) return null;
  const r = playerRating(item); const era = eraWord(topic);
  return (
    <>
      <button type="button" className="ratingchip" onClick={() => setOpen(true)} aria-label={era + ' ' + r.ovr + (r.estimated ? ', estimated' : '') + '. Show details'}>
        {era} <b className="num">{r.ovr}</b>{r.estimated ? ' est.' : ''}
      </button>
      {open && ReactDOM.createPortal(<Sheet center onClose={() => setOpen(false)}><RatingCard item={item} topic={topic} /><button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button></Sheet>, document.body)}
    </>
  );
}

// Team strength (from the players' Now or Prime numbers) with the full working shown.
function TeamRatingPanel({ d, m }) {
  if (!isFootball(d.topic) || !numbersShown()) return null;
  const tr = teamRating(d, m);
  const players = [...tr.players].sort((a, b) => b.r.ovr - a.r.ovr);
  const weights = players.map((_, i) => Math.pow(0.92, i));
  return (
    <details className="teamrating">
      <summary>
        <span className="tr-num num">{tr.rating}</span>
        <span className="tr-lbl">Team strength · {eraWord(d.topic)}{tr.provisional ? ' · provisional' : ''}</span>
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
        <p className="hint" style={{ margin: 0 }}>Each player’s {eraWord(d.topic)} number is a Draft Night estimate, not an official one.</p>
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
  if (match.v === 'gp') return <GPSummary d={d} A={A} B={B} match={match} />;
  if (match.v === 'card') return <FightSummary d={d} A={A} B={B} match={match} />;
  if (match.v === 'hoops') return <HoopsSummary d={d} A={A} B={B} match={match} era={eraWord(d.topic)} />;
  if (match.v === 'show') return <ShowSummary d={d} A={A} B={B} match={match} />;
  if (match.v === 'mission') return <MissionSummary d={d} A={A} B={B} match={match} />;
  if (match.v === 'survival') return <SurvivalSummary d={d} A={A} B={B} match={match} />;
  if (match.v === 'arena') return <ArenaSummary d={d} A={A} B={B} match={match} />;
  if (match.v === 'battle') return <BattleSummary d={d} A={A} B={B} match={match} />;
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
      {!match.forfeit && <MatchReport d={d} A={A} B={B} match={match} />}
      {incomplete.map((t) => <p key={t.id} className="hint" style={{ margin: 0 }}>ℹ️ {t.name}’s squad is incomplete, so empty slots count as weak players (simplified simulation).</p>)}
      <p className="hint" style={{ margin: 0 }}>{match.puppy ? 'A Puppy Bowl from the drafted animals’ estimated Fluffy, Tiny, Funny and Charm stats — the cute moments come from those stats too. Just for fun.' : 'A game simulation from the drafted squads and their estimated ' + eraWord(d.topic) + ' numbers. It doesn’t predict real results.'}</p>
    </div>
  );
}

/* ---------- voting on one matchup ---------- */
function MatchVote({ d, r, i, onChange, onCount, nv, act }) {
  const m = getMatchup(d, r, i);
  const A = teamOf(d, m.a), B = teamOf(d, m.b);
  const online = !!(nv && nv.online);
  const solo = d.mode === 'solo' || online; // one phone per player: you vote for yourself only
  const voters = matchVoters(d, m);
  const humans = voters.filter((p) => !p.bot);
  const mine = online ? humans.filter((p) => nv.controlsPart(p.id)) : humans;
  const firstOpen = mine.find((p) => !hasMatchVote(m, p.id));
  const [voter, setVoter] = useState(solo && firstOpen ? firstOpen.id : null);
  const [choice, setChoice] = useState(null);
  const [locked, setLocked] = useState(false);
  const nVoted = voters.filter((p) => hasMatchVote(m, p.id)).length;
  const allIn = votingDone(d, m);
  const neutral = voters.every((p) => p.teamId !== m.a && p.teamId !== m.b);
  if (locked) return (
    <div className="card stack-sm" style={{ textAlign: 'center' }}>
      <h2 className="display" style={{ fontSize: 34 }}>Vote locked 🔒</h2>
      {online ? <p className="muted" style={{ margin: 0 }}>Waiting for everyone else to vote…</p> : solo ? <p className="muted" style={{ margin: 0 }}>🤖 The bots have voted too.</p> : <p className="muted" style={{ margin: 0 }}>Pass the phone to the next voter.</p>}
      {online ? <button className="btn" onClick={() => { setLocked(false); setVoter(null); setChoice(null); }}>OK</button>
        : <button className="btn btn-gold" onClick={() => { setLocked(false); setVoter(null); setChoice(null); if (solo) onCount(); }}>{solo ? 'Count the votes' : 'Next voter'}</button>}
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
              <span>{t.emoji} {t.name}{own ? ' · your team' : ''}{isFootball(d.topic) && numbersShown() ? <small> · {eraWord(d.topic)} strength {teamRating(d, t).rating}</small> : null}</span>
              <span className="teamtxt">{t.team.filter(Boolean).map((x) => d.items[x.itemId].name).join(', ')}</span>
            </button>
          );
        })}
        <div className="row">
          {!solo && <button type="button" className="btn btn-ghost grow" onClick={() => { setVoter(null); setChoice(null); }}>Back</button>}
          <button type="button" className="btn btn-gold grow" disabled={!choice} onClick={() => { buzz(30); if (online) act('matchVote', r, i, voter, choice); else onChange(castMatchVote(d, r, i, voter, choice)); setLocked(true); }}>{choice ? 'Lock in ' + teamOf(d, choice).name : 'Pick a team'}</button>
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
      {online && !mine.length && humans.length > 0 && <p className="hint">You’re not voting on this one (it’s your team, or you’re watching).</p>}
      {humans.length > 0 && <div className="votegrid">
        {humans.map((p) => { const done = hasMatchVote(m, p.id); return (
          <button key={p.id} className="votebtn" style={mStyle(p)} disabled={done || (online && !nv.controlsPart(p.id))} onClick={() => setVoter(p.id)}>
            <span style={{ fontSize: 24 }}>{done ? '✅' : p.emoji}</span>{p.name}{p.teamName ? <small>{p.teamName}</small> : null}
          </button>
        ); })}
      </div>}
      {(!nv || nv.isHost) ? <button className="btn btn-gold" disabled={!allIn && !nVoted} onClick={onCount}>{allIn ? 'Count the votes' : 'Count now (' + nVoted + '/' + voters.length + ')'}</button>
        : <p className="hint" style={{ textAlign: 'center' }}>The host counts the votes{allIn ? ' — everyone’s in.' : '.'}</p>}
    </div>
  );
}

/* ---------- the finale, matchup by matchup ---------- */
function Finale({ d, onChange, onClose, onChampion }) {
  const fin = d.finale; const cfg = finCfg(d); const mode = fin.mode;
  const nv = netView(d, useNet()); const act = useAct(d, onChange);
  const host = nv.isHost && !nv.tv; // the host's TV view shows the finale without the buttons
  const nx = nextMatchup(fin.bracket);
  // Which moment we're at is part of the saved game, so online every phone (and the TV) follows the host.
  const ui = fin.ui || { stage: 'overview', cur: null };
  const stage = ui.stage === 'done' ? 'overview' : ui.stage; const cur = ui.cur;
  const withUi = (n, patch) => ({ ...n, finale: { ...n.finale, ui: { ...ui, ...patch } } });
  const [matchOver, setMatchOver] = useState(false);
  const [view, setView] = useState(null); // decided matchup to look at
  const R = fin.bracket.rounds.length;
  const bk = battleKind(d.topic);
  const modeName = { bracket: 'Head-to-head bracket', sim: bk ? bk.name + ' bracket' : 'Match simulator', combined: 'Combined finale' }[mode];
  const begin = () => {
    const at = { r: nx.r, i: nx.i }; setMatchOver(false);
    if (needsVote(mode)) onChange(withUi(botMatchVotes(d, at.r, at.i), { stage: 'vote', cur: at }));
    else onChange(withUi(playMatchup(d, at.r, at.i), { stage: 'match', cur: at }));
  };
  const finish = () => {
    let n = resolveMatchup(d, cur.r, cur.i);
    const m = getMatchup(n, cur.r, cur.i);
    if (!m.winner && m.revoted) { n = botMatchVotes(n, cur.r, cur.i); onChange(withUi(n, { stage: 'vote' })); return; }
    onChange(withUi(n, { stage: 'result' }));
  };
  const counted = () => { if (needsMatch(mode)) { setMatchOver(false); onChange(withUi(playMatchup(d, cur.r, cur.i), { stage: 'match' })); } else finish(); };
  // Result sounds on every phone when a matchup is decided.
  const decided = cur && stage === 'result' ? cur.r + ':' + cur.i : '';
  useEffect(() => { if (decided) audio.play(d.finale.champion ? 'fanfare' : 'gavel'); }, [decided]);
  const waiting = <p className="hint" style={{ textAlign: 'center' }}>Waiting for the host…</p>;
  const cm = cur && getMatchup(d, cur.r, cur.i);
  const A = cm && cm.a && teamOf(d, cm.a), B = cm && cm.b && teamOf(d, cm.b);
  let body;
  if (stage === 'vote' && cm && !cm.winner) body = <MatchVote key={cm.id + (cm.revoted ? 'r' : '')} d={d} r={cur.r} i={cur.i} onChange={onChange} onCount={counted} nv={nv} act={act} />;
  else if (stage === 'match' && cm && cm.match) body = (
    <>
      <p className="eyebrow" style={{ textAlign: 'center' }}>{roundName(R, cur.r)}{cur.r === R - 1 ? ' · the big one' : ''}</p>
      <MatchView key={cm.id} d={d} A={A} B={B} match={cm.match} speed={cfg.speed} commentary={cfg.commentary} label={cm.id} onDone={() => setMatchOver(true)} />
      {matchOver && (host ? <button className="btn btn-gold" onClick={finish}>{mode === 'combined' ? 'Combine with the votes' : 'Continue'}</button> : waiting)}
    </>
  );
  else if (stage === 'result' && cm && cm.winner) body = <MatchupResult d={d} m={cm} r={cur.r} final={cur.r === R - 1} host={host} onNext={() => { if (d.finale.champion) onChampion(); else onChange(withUi(d, { stage: 'overview', cur: null })); }} />;
  else body = (
    <>
      <div className="card stack-sm">
        <p className="eyebrow">{modeName}</p>
        {nx ? <>
          <h2 className="display" style={{ fontSize: 30 }}>{roundName(R, nx.r)}{nx.r === R - 1 ? ' 🏆' : ''}</h2>
          <div className="vsrow">
            {[nx.m.a, nx.m.b].map((id, k) => { const t = teamOf(d, id); return <React.Fragment key={id}>{k === 1 && <span className="vs">VS</span>}<div className="vsteam"><Badge m={t} size={52} /><b>{t.name}</b>{isFootball(d.topic) && numbersShown() && <span className="small num">{eraWord(d.topic)} strength {teamRating(d, t).rating}{teamRating(d, t).provisional ? ' (prov.)' : ''}</span>}</div></React.Fragment>; })}
          </div>
          {host ? <button className="btn btn-gold" onClick={begin}>{needsVote(mode) ? (mode === 'combined' ? (bk ? 'Vote, then ' + bk.start.toLowerCase() : 'Vote, then kick off') : 'Vote on this matchup') : bk ? bk.start : 'Kick off'}</button> : waiting}
        </> : fin.champion ? <>
          <h2 className="display" style={{ fontSize: 30 }}>We have a champion</h2>
          {host ? <button className="btn btn-gold" onClick={onChampion}>🏆 Reveal the champion</button> : waiting}
        </> : <>
          <h2 className="display" style={{ fontSize: 28 }}>No matchups to play</h2>
          <p className="hint" style={{ margin: 0 }}>No team has any players, so there’s nobody to crown.</p>
        </>}
      </div>
      <BracketView d={d} current={nx} onOpen={setView} />
      {mode === 'combined' && <p className="hint">Combined score: {cfg.weight}% {bk ? 'battle' : 'match'} performance + {100 - cfg.weight}% votes. If it’s dead level, the {bk ? 'battle result' : 'match result (extra time or penalties)'} decides.</p>}
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

function MatchupResult({ d, m, r, final, onNext, host = true }) {
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
          <p className="hint" style={{ margin: 0 }}><span className="key m" /> match {cfg.weight}% · <span className="key v" /> votes {100 - cfg.weight}%. {m.detail}. {isSimResult(m.match) ? 'Battle share = (rounds won + ½) ÷ (rounds + 1).' : 'Match share = (goals + ½) ÷ (total goals + 1), so a 6–5 isn’t worth more than a 2–1 swing.'}</p>
        </div>
      )}
      {m.match && <MatchSummary d={d} A={A} B={B} match={m.match} />}
      <p className="hint">{L.name} {final ? 'finish as runners-up.' : 'are knocked out.'}</p>
      {host ? <button className="btn btn-gold" onClick={onNext}>{d.finale.champion ? '🏆 Reveal the champion' : 'Back to the bracket'}</button> : <p className="hint" style={{ textAlign: 'center' }}>Waiting for the host…</p>}
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
      {replay && m.match ? <MatchView d={d} A={A} B={B} match={m.match} speed={cfg.speed === 'instant' ? 'fast' : cfg.speed} commentary={cfg.commentary} label={m.id + ':replay'} />
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
  if (teams.length < 2) return <Sheet center onClose={onClose}><h2 className="display" style={{ fontSize: 28 }}>Friendly {battleKind(d.topic) ? 'battle' : 'match'}</h2><p className="hint">You need two teams with players.</p><button className="btn btn-ghost" onClick={onClose}>Close</button></Sheet>;
  const bk = battleKind(d.topic);
  const play = () => { const k = n + 1; setN(k); const key = 'friendly:' + Date.now() + ':' + k; setGame({ A: teamOf(d, a), B: teamOf(d, b), match: bk ? simulateFor(d, teamOf(d, a), teamOf(d, b), key, { knockout: false }) : simulateMatch(d, teamOf(d, a), teamOf(d, b), key, false), k }); };
  return (
    <Sheet center onClose={onClose}>
      <p className="eyebrow">Exhibition · doesn’t change any result</p>
      <h2 className="display" style={{ fontSize: 28 }}>Friendly {bk ? bk.name.toLowerCase() : 'match'}</h2>
      {game ? <>
        <MatchView key={game.k} d={d} A={game.A} B={game.B} match={game.match} speed={cfg.speed} commentary={cfg.commentary} label={'friendly' + game.k} />
        <div className="row"><button className="btn grow" onClick={play}>Rematch</button><button className="btn btn-ghost grow" onClick={() => setGame(null)}>Pick teams</button></div>
      </> : <>
        <div className="field"><label htmlFor="fr-a">{bk ? 'Team 1' : 'Home'}</label><select id="fr-a" className="input" value={a} onChange={(e) => setA(e.target.value)}>{teams.map((t) => <option key={t.id} value={t.id} disabled={t.id === b}>{t.emoji} {t.name}{!bk && numbersShown() ? ' · ' + teamRating(d, t).rating : ''}</option>)}</select></div>
        <div className="field"><label htmlFor="fr-b">{bk ? 'Team 2' : 'Away'}</label><select id="fr-b" className="input" value={b} onChange={(e) => setB(e.target.value)}>{teams.map((t) => <option key={t.id} value={t.id} disabled={t.id === a}>{t.emoji} {t.name}{!bk && numbersShown() ? ' · ' + teamRating(d, t).rating : ''}</option>)}</select></div>
        <button className="btn btn-gold" disabled={!a || !b || a === b} onClick={play}>{bk ? bk.start : 'Kick off'}</button>
        <p className="hint">{bk ? 'Each one is a new random battle. Just for fun — the result doesn’t count.' : 'Friendlies can end in a draw. Each kick-off is a new random game.'}</p>
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
          {ru ? 'Beat ' + ru.name + ' in the final' + (sc ? ' ' + sc[0] + '–' + sc[1] + (final.match.pens ? ' (pens)' : final.match.et ? ' (AET)' : '') : '') : 'Walked through'}{tr && numbersShown() ? ' · ' + eraWord(d.topic) + ' strength ' + tr.rating : ''}
        </p>
        {d.mode === 'solo' && champ.human && <p className="small" style={{ margin: '4px 0 0', fontWeight: 700 }}>You beat the bots!</p>}
      </div>
      <div className="board"><h3>🧠 Why they won</h3><p className="small" style={{ margin: 0 }}>{championStory(d)}</p></div>
      <div className="board"><h3>🗂️ Bracket</h3><BracketView d={d} onOpen={onOpen} /><p className="hint" style={{ margin: 0 }}>Tap a decided matchup to see how it went.</p></div>
      <div className="board"><h3>📊 Final standings</h3>
        {finaleStandings(d).map((s) => <div key={s.team.id} className={'brow' + (s.label === 'Champion' ? ' hl' : '')} style={mStyle(s.team)}><span className="bn">{s.team.emoji} {s.team.name}</span><span className="small" style={{ fontWeight: 700 }}>{s.label}</span>{isFootball(d.topic) && numbersShown() && <span className="bw num" style={{ fontSize: 18 }}>{teamRating(d, s.team).rating}</span>}</div>)}
      </div>
    </>
  );
}

/* ============================================================
   ANIMATED MATCH (v2 matches): a 2D pitch that plays the recorded timeline.
   Everything on screen is worked out from (match record, time) — nothing random
   happens while watching — so pausing, skipping, replaying or watching on another
   phone always shows the same moves and ends on the recorded score.
   ============================================================ */
const PITCH = { w: 105, h: 68 };
const hashU = (...parts) => (hashStr(parts.join('|')) % 10000) / 10000;
const lerp = (a, b, u) => a + (b - a) * u;
const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const lerpP = (p, q, u) => ({ x: lerp(p.x, q.x, u), y: lerp(p.y, q.y, u) });
const LINE_X = { GK: 0.04, DEF: 0.2, MID: 0.38, FWD: 0.54 };
// Pacing (seconds of match-viewer time at 1×). Slow enough to follow every pass.
const SEG = 1.25; // per touch in a passing move
const IN = 1.6; // lead-in: players glide from where the last moment ended
const TS = 1.5; // stretch for shots, saves, tackles and celebrations
const PIN = 1.8; // lead-in before each penalty
const GLIDE = { half: 2.2, full: 1.8, et: 1.8, pens: 1.8, restart: 2, kickoff: 1.2 };

// Formation spots from the drafted squad (in "attack" coordinates: 0 = own goal, 1 = opponent's goal).
function lineupOf(d, m) {
  const sq = squad(d, m);
  const hasGK = sq.some((p) => p.role === 'GK');
  const rows = sq.map((p, i) => ({ ...p, role: !hasGK && i === sq.reduce((bi, q, k) => (q.r.attrs.DEF > sq[bi].r.attrs.DEF ? k : bi), 0) ? 'GK' : p.role }));
  const out = [];
  ['GK', 'DEF', 'MID', 'FWD'].forEach((role) => {
    const line = rows.filter((p) => p.role === role);
    line.forEach((p, k) => out.push({ name: p.name, em: p.emoji || null, role, ovr: p.r.ovr, pac: p.r.attrs.PAC, num: (() => { const it = Object.values(d.items).find((x) => x.name === p.name); return it ? kitNumber(it) : k + 1; })(), base: { x: LINE_X[role], y: line.length === 1 ? 0.5 : 0.18 + (0.64 * k) / (line.length - 1) } }));
  });
  return out;
}
function matchScript(match) {
  const beats = []; let t = 0; let pendingCute = null;
  const add = (b) => { b.t0 = t; t += b.dur; beats.push(b); return b; };
  add({ type: 'kickoff', dur: 2, min: 0, show: [0], reveal: 0.1 });
  match.events.forEach((e, k) => {
    if (e.type === 'kickoff') return;
    if (e.type === 'half' || e.type === 'full' || e.type === 'et' || e.type === 'pens') { add({ type: e.type, dur: e.type === 'half' ? 3.6 : 3, min: e.min, show: [k], reveal: 0.1 }); return; }
    if (e.type === 'pen') { add({ type: 'pen', dur: PIN + 1.9 * TS, min: 120, show: [k], reveal: PIN + 0.75 * TS, pen: e }); return; }
    if (e.type === 'yellow' || e.type === 'red' || e.type === 'note') { const last = beats[beats.length - 1]; last.show.push(k); return; }
    if (e.type === 'cute') { pendingCute = k; return; }
    if (e.seq == null) return;
    const q = match.seqs[e.seq]; const n = q.chain.length;
    const tail = (q.kind === 'goal' ? 3.6 : q.kind === 'tackle' || q.kind === 'intercept' ? 1.2 : 1.8) * TS;
    const sb = add({ type: 'seq', dur: IN + n * SEG + tail, min: q.min, et: !!q.et, q, show: [k], reveal: IN + n * SEG + (q.kind === 'goal' ? 0.7 : q.kind === 'tackle' || q.kind === 'intercept' ? 0.5 : 0.6) * TS });
    if (pendingCute != null) { sb.cuteK = pendingCute; sb.cute = match.events[pendingCute]; pendingCute = null; }
    // After a goal everyone walks back for the kick-off instead of jumping into place.
    if (q.kind === 'goal') add({ type: 'restart', dur: 2.4, min: q.min, et: !!q.et, show: [], reveal: 0.1 });
  });
  return { beats, total: t };
}
// Where everyone is at time u (seconds) into one beat. Every beat glides in from where
// the previous one ended (prevEnd), so nobody ever jumps across the pitch.
function beatFrame(beat, L, prevEnd) {
  const toPitch = (team, p) => ({ x: (team === 0 ? p.x : 1 - p.x) * PITCH.w, y: p.y * PITCH.h });
  const base = (team) => L[team].map((pl) => toPitch(team, pl.base));
  const idx = (team, name) => L[team].findIndex((p) => p.name === name);
  const raw = (u) => {
    if (beat.type !== 'seq' && beat.type !== 'pen') return { pos: [base(0), base(1)], ball: { x: PITCH.w / 2, y: PITCH.h / 2 }, holder: null };
    if (beat.type === 'pen') {
      const e = beat.pen; const T = e.team; const D = 1 - T;
      const pu = Math.max(0, u - PIN) / TS;
      // Every kick is taken at the same (right-hand) goal; the rest wait in the centre circle.
      const toPitch = (_team, p) => ({ x: p.x * PITCH.w, y: p.y * PITCH.h });
      const pos = [0, 1].map((team) => L[team].map((pl, i) => toPitch(T, { x: team === D && pl.role === 'GK' ? 0.985 : 0.5, y: 0.3 + (0.4 * (i + team * L[0].length)) / Math.max(1, L[0].length + L[1].length - 1) })));
      const si = Math.max(0, idx(T, e.player)); const ki = L[D].findIndex((p) => p.role === 'GK');
      const spot = { x: 0.89, y: 0.5 };
      pos[T][si] = toPitch(T, { x: lerp(0.84, 0.88, ease((pu - 0.3) / 0.2)), y: 0.5 });
      const shotU = ease((pu - 0.5) / 0.35);
      const target = e.scored ? { x: 1.01, y: 0.5 + e.side * 0.05 } : { x: 0.985, y: 0.5 + e.side * 0.04 };
      const keeperY = e.scored ? 0.5 - e.side * 0.06 : 0.5 + e.side * 0.04;
      if (ki >= 0) pos[D][ki] = toPitch(T, { x: 0.985, y: lerp(0.5, keeperY, ease((pu - 0.5) / 0.3)) });
      const ball = toPitch(T, lerpP(spot, target, shotU));
      return { pos, ball, holder: { team: T, i: si }, banner: pu > 0.9 ? (e.scored ? 'SCORED!' : 'SAVED!') : null };
    }
    const q = beat.q; const T = q.team; const D = 1 - T; const n = q.chain.length;
    const shot = q.kind === 'goal' || q.kind === 'save' || q.kind === 'miss' || q.kind === 'block';
    const gkAt = q.chain.map((nm) => { const j = idx(T, nm); return j >= 0 && L[T][j].role === 'GK'; });
    // A keeper in the move plays it out from the edge of their box rather than sprinting upfield.
    const key = (k) => ({ x: gkAt[k] ? 0.13 : shot ? lerp(0.34, 0.8, n > 1 ? k / (n - 1) : 1) : lerp(0.28, 0.52, n > 1 ? k / (n - 1) : 1), y: gkAt[k] ? 0.5 : Math.min(0.88, Math.max(0.12, 0.5 + (hashU(q.min, q.i, k) - 0.5) * 0.62)) });
    const carried = (k) => ({ x: key(k).x + 0.03, y: key(k).y });
    const uu = u - IN; // lead-in: hold the opening shape while everyone glides in
    const PASS = 0.4; // last 60% of each touch is the pass to the next player
    const ballAt = (v) => {
      if (v < 0) return { b: key(0), h: 0 };
      if (v >= n * SEG) return { b: carried(n - 1), h: n - 1 };
      const k = Math.min(n - 1, Math.floor(v / SEG)); const r = (v - k * SEG) / SEG;
      if (k < n - 1 && r > PASS) return { b: lerpP(carried(k), key(k + 1), ease((r - PASS) / (1 - PASS))), h: -1 };
      return { b: { x: key(k).x + 0.03 * ease(Math.min(1, r / PASS)), y: key(k).y }, h: k };
    };
    const now = ballAt(uu); let ballA = now.b; const holderK = now.h;
    // The team shape follows where the ball has been over the last second, so whole lines
    // shift smoothly instead of lurching with every long pass.
    const shapeBall = [0, 0.2, 0.4, 0.6, 0.8, 1].map((lag) => ballAt(uu - lag).b).reduce((acc, p, _i, arr) => ({ x: acc.x + p.x / arr.length, y: acc.y + p.y / arr.length }), { x: 0, y: 0 });
    const tail = uu - n * SEG; const tl = tail / TS;
    // Formation shift: attackers push up with the ball, defenders drop and squeeze towards it.
    const push = (shapeBall.x - 0.45) * 0.55;
    const pos = [[], []];
    L[T].forEach((pl, i) => {
      let p = { x: pl.base.x + (pl.role === 'GK' ? 0 : push), y: lerp(pl.base.y, shapeBall.y, pl.role === 'GK' ? 0 : 0.18) };
      const ci = q.chain.indexOf(pl.name);
      if (ci >= 0) { const until = ci * SEG; const pre = ease(1 - Math.max(0, until - Math.max(0, uu)) / (SEG * 1.6)); p = lerpP(p, key(ci), pre); if (ci < n - 1 && uu > (ci + 1) * SEG) p = lerpP(key(ci), { x: key(ci).x + 0.08, y: key(ci).y }, ease((uu - (ci + 1) * SEG) / SEG)); }
      pos[T][i] = p;
    });
    const dA = { x: 1 - shapeBall.x, y: shapeBall.y }; // (recent) ball in the defenders' attack coordinates
    const drop = (dA.x - 0.45) * 0.5;
    // Defenders near the ball close it down; the pull fades smoothly with distance (no sudden switches).
    L[D].forEach((pl, i) => {
      let p = pl.role === 'GK' ? { x: 0.035, y: lerp(0.5, dA.y, 0.3) } : { x: pl.base.x + drop, y: lerp(pl.base.y, dA.y, 0.3) };
      if (pl.role !== 'GK') { const dist = Math.hypot(p.x - dA.x, p.y - dA.y); const w = 0.65 * Math.min(1, Math.max(0, (0.3 - dist) / 0.18)); p = lerpP(p, { x: dA.x - 0.05, y: dA.y + 0.03 }, w); }
      pos[D][i] = p;
    });
    let holder = holderK >= 0 ? { team: T, i: idx(T, q.chain[holderK]) } : null; let banner = null; let celebrate = null;
    const toD = (p) => ({ x: 1 - p.x, y: p.y }); // attack → defending side's coordinates
    const shooterA = carried(n - 1);
    // The tackler or blocker starts closing in during the last touch, so they arrive at a run, not a jump.
    const closer = q.kind === 'tackle' || q.kind === 'intercept' ? idx(D, q.tackler) : q.kind === 'block' ? idx(D, q.blocker) : -1;
    const meetA = q.kind === 'block' ? lerpP(shooterA, { x: 1, y: 0.5 }, 0.35) : { x: shooterA.x + 0.02, y: shooterA.y };
    if (closer >= 0) { const s0 = Math.max(-IN * 0.5, (n - 1) * SEG - 0.4), s1 = n * SEG + (q.kind === 'block' ? 0.4 : 0.45) * TS; pos[D][closer] = lerpP(pos[D][closer], toD(meetA), ease((uu - s0) / (s1 - s0))); }
    if (tail >= 0) {
      const ki = L[D].findIndex((p) => p.role === 'GK');
      if (q.kind === 'goal') {
        const goalPt = { x: 1.015, y: 0.5 + q.side * 0.055 };
        ballA = lerpP(shooterA, goalPt, ease(tl / 0.7));
        if (ki >= 0) pos[D][ki] = lerpP(pos[D][ki], { x: 0.035, y: 0.5 + q.side * 0.12 }, ease(tl / 0.6)); // dives, too late
        holder = tl < 0.05 ? holder : null;
        if (tl > 0.7) { banner = 'GOAL!'; const si = idx(T, q.shooter); celebrate = { team: T, i: si }; const corner = { x: 0.9, y: 0.5 + q.side * 0.4 }; pos[T][si] = lerpP(pos[T][si], corner, ease((tl - 0.7) / 1.4)); L[T].forEach((pl, i) => { if (i !== si && pl.role !== 'GK') pos[T][i] = lerpP(pos[T][i], { x: corner.x - 0.06 - 0.02 * i, y: corner.y - q.side * 0.05 * (i % 3) }, ease((tl - 1.1) / 1.6)); }); }
      } else if (q.kind === 'save') {
        const kp = { x: 0.965, y: 0.5 + q.side * 0.07 };
        if (ki >= 0) pos[D][ki] = lerpP(pos[D][ki], toD(kp), ease(tl / 0.45));
        ballA = lerpP(shooterA, kp, ease(tl / 0.6)); holder = tl > 0.6 && ki >= 0 ? { team: D, i: ki } : null;
        if (tl > 0.6) banner = 'SAVE!';
      } else if (q.kind === 'miss') {
        ballA = lerpP(shooterA, { x: 1.03, y: 0.5 + q.side * 0.2 }, ease(tl / 0.8)); holder = null;
        if (tl > 0.8) banner = 'WIDE!';
      } else if (q.kind === 'block') {
        const bp = meetA;
        ballA = lerpP(shooterA, bp, ease(tl / 0.5)); holder = null;
        if (tl > 0.5) banner = 'BLOCKED!';
      } else {
        const ti = closer; const meet = meetA;
        ballA = tl < 0.5 ? lerpP(shooterA, meet, ease(tl / 0.5)) : lerpP(meet, { x: meet.x - 0.06, y: meet.y }, ease((tl - 0.5) / 0.5));
        holder = tl > 0.45 && ti >= 0 ? { team: D, i: ti } : holder;
        if (tl > 0.45) banner = q.kind === 'tackle' ? 'TACKLE!' : 'INTERCEPTED!';
      }
    }
    const out = { pos: [], ball: toPitch(T, ballA), holder, banner, celebrate };
    // Each team's spots are in its own attack coordinates.
    out.pos[T] = pos[T].map((p) => toPitch(T, p)); out.pos[D] = pos[D].map((p) => toPitch(D, p));
    return out;
  };
  const glide = beat.type === 'seq' ? IN : beat.type === 'pen' ? PIN * 0.9 : Math.min(beat.dur * 0.8, GLIDE[beat.type] || 1.5);
  return (u) => {
    const out = raw(u);
    if (!prevEnd || u >= glide) return out;
    const k = ease(u / glide);
    return { ...out, pos: out.pos.map((team, ti) => team.map((p, i) => (prevEnd.pos[ti] && prevEnd.pos[ti][i] ? lerpP(prevEnd.pos[ti][i], p, k) : p))), ball: lerpP(prevEnd.ball, out.ball, k) };
  };
}
function matchFrame(script, L, t) {
  const { beats } = script;
  let bi = beats.findIndex((b) => t < b.t0 + b.dur); if (bi < 0) bi = beats.length - 1;
  const b = beats[bi];
  const prev = bi > 0 ? beatFrame(beats[bi - 1], L, null)(beats[bi - 1].dur) : null;
  const f = beatFrame(b, L, prev)(Math.min(b.dur, Math.max(0, t - b.t0)));
  const prevMin = bi > 0 ? beats[bi - 1].min : 0;
  const min = b.type === 'seq' ? Math.round(lerp(b.et ? Math.max(91, prevMin) : Math.min(prevMin, b.min), b.min, Math.min(1, (t - b.t0) / b.dur))) : b.min;
  return { ...f, beat: b, bi, min };
}
function revealedEvents(script, t) {
  const out = [];
  script.beats.forEach((b) => { if (b.cuteK != null && t >= b.t0 + 0.3) out.push(b.cuteK); });
  script.beats.forEach((b) => b.show.forEach((k, j) => { if (t >= b.t0 + (j === 0 ? b.reveal * (b.type === 'seq' || b.type === 'pen' ? 1 : b.dur) : b.reveal)) out.push(k); }));
  return out.sort((a, b2) => a - b2);
}

function PitchMatch({ d, A, B, match, speed, commentary, onDone, label }) {
  const L = useMemo(() => [lineupOf(d, A), lineupOf(d, B)], [d.id, A.id, B.id]);
  const script = useMemo(() => matchScript(match), [match]);
  const base = speed === 'fast' ? 1.8 : 1; // 1× is real viewing pace; 2×/4× and Skip are there for long brackets
  const [t, setT] = useState(speed === 'instant' ? script.total : 0);
  const [playing, setPlaying] = useState(speed !== 'instant');
  const [mult, setMult] = useState(1);
  const done = t >= script.total;
  const fired = useRef(false);
  const reduced = reducedMotion();
  useEffect(() => {
    if (!playing || done) return undefined;
    let raf; let last = performance.now();
    const tick = (now) => { const dt = Math.min(0.1, (now - last) / 1000); last = now; setT((x) => Math.min(script.total, x + dt * base * mult / Math.max(0.001, GAME_SPEED))); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, done, mult, base]);
  useEffect(() => { if (done && !fired.current) { fired.current = true; onDone && onDone(); } }, [done]);
  // Sounds and the auctioneer, in step with what's on screen.
  const shown = revealedEvents(script, t);
  const lastShown = useRef(shown.length);
  useEffect(() => {
    if (shown.length > lastShown.current && playing) {
      shown.slice(lastShown.current).forEach((k) => {
        const e = match.events[k];
        if (e.type === 'goal') { audio.play('cheer'); audio.say(callLine('goal', { who: e.player }), 2, d.id + ':' + label + ':g' + k); }
        else if (e.type === 'half' || e.type === 'full') audio.play('whistle');
        else if (e.type === 'red') audio.play('buzzer');
        else if (e.type === 'pen') audio.play(e.scored ? 'bid' : 'buzzer');
        else if (e.type === 'cute') audio.play(e.good ? 'card' : 'buzzer');
      });
    }
    lastShown.current = shown.length;
  }, [shown.length]);
  const tq = reduced && !done ? Math.floor(t / 0.7) * 0.7 : t;
  const fr = matchFrame(script, L, tq);
  const goalsShown = shown.map((k) => match.events[k]).filter((e) => e.type === 'goal');
  const score = done ? match.score : [goalsShown.filter((e) => e.team === 0).length, goalsShown.filter((e) => e.team === 1).length];
  const penEv = shown.map((k) => match.events[k]).filter((e) => e.type === 'pen');
  const pens = done ? match.pens : penEv.length ? penEv[penEv.length - 1].pens : null;
  const keyTypes = ['goal', 'red', 'yellow', 'half', 'full', 'et', 'pens', 'pen', 'note', 'kickoff', 'cute'];
  const feed = shown.map((k) => match.events[k]).filter((e) => commentary || keyTypes.includes(e.type));
  const feedRef = useRef(null);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [feed.length]);
  const colors = [A, B].map((m) => ({ fill: m.color, text: onColor(m.color) }));
  const stop = match.stoppage || 0;
  const clock = done ? (match.pens ? 'FT · pens' : match.et ? 'AET' : 'FT') : fr.beat.type === 'half' ? 'HT' : fr.min > 90 && !fr.beat.et && fr.beat.type !== 'et' && fr.beat.type !== 'pens' && fr.beat.type !== 'pen' ? '90+' + Math.min(stop, fr.min - 90) + '′' : fr.beat.type === 'pen' || fr.beat.type === 'pens' ? 'PENS' : fr.min + '′' + (fr.beat.et ? ' ET' : '');
  const trA = isFootball(d.topic) ? teamRating(d, A).rating : null, trB = isFootball(d.topic) ? teamRating(d, B).rating : null;
  const cuteNow = fr.beat.cute && t - fr.beat.t0 < IN + 1.4 && !done ? fr.beat.cute : null;
  const bannerNow = (cuteNow && cuteNow.banner) || fr.banner || (fr.beat.type === 'half' ? 'HALF-TIME' : fr.beat.type === 'et' ? 'EXTRA TIME' : fr.beat.type === 'pens' ? 'PENALTIES' : fr.beat.type === 'full' && !done ? 'FULL-TIME' : null);
  const short = (n) => { const w = n.split(' '); const s2 = w[w.length - 1]; return s2.length > 10 ? s2.slice(0, 9) + '.' : s2; };
  return (
    <div className="matchview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span>{trA != null && <span className="sb-r num">{trA}</span>}</div>
        <div className="sb-mid">
          <span className="sb-score num" aria-live="polite">{score[0]}–{score[1]}</span>
          {pens && <span className="sb-pens num">pens {pens[0]}–{pens[1]}</span>}
          <span className="sb-clock num">{clock}</span>
        </div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span>{trB != null && <span className="sb-r num">{trB}</span>}</div>
      </div>
      <div className="pitchwrap">
        <svg className="pitchsvg" viewBox={'-3 -3 ' + (PITCH.w + 6) + ' ' + (PITCH.h + 6)} role="img" aria-label={'Football pitch: ' + A.name + ' ' + score[0] + ', ' + B.name + ' ' + score[1] + ', ' + clock}>
          <rect x="-3" y="-3" width={PITCH.w + 6} height={PITCH.h + 6} fill="#1f7a3a" />
          {Array.from({ length: 7 }, (_, i) => <rect key={i} x={i * 15} y="0" width="7.5" height={PITCH.h} fill="#23843f" />)}
          <g fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="0.35">
            <rect x="0" y="0" width={PITCH.w} height={PITCH.h} />
            <line x1={PITCH.w / 2} y1="0" x2={PITCH.w / 2} y2={PITCH.h} />
            <circle cx={PITCH.w / 2} cy={PITCH.h / 2} r="9.15" />
            <rect x="0" y={PITCH.h / 2 - 20.16} width="16.5" height="40.32" /><rect x={PITCH.w - 16.5} y={PITCH.h / 2 - 20.16} width="16.5" height="40.32" />
            <rect x="0" y={PITCH.h / 2 - 9.16} width="5.5" height="18.32" /><rect x={PITCH.w - 5.5} y={PITCH.h / 2 - 9.16} width="5.5" height="18.32" />
          </g>
          <rect x="-2.2" y={PITCH.h / 2 - 3.66} width="2.2" height="7.32" fill="rgba(255,255,255,.85)" /><rect x={PITCH.w} y={PITCH.h / 2 - 3.66} width="2.2" height="7.32" fill="rgba(255,255,255,.85)" />
          {[0, 1].map((team) => L[team].map((pl, i) => {
            const p = fr.pos[team][i]; if (!p) return null;
            const isHolder = fr.holder && fr.holder.team === team && fr.holder.i === i;
            const cel = fr.celebrate && fr.celebrate.team === team && fr.celebrate.i === i;
            return (
              <g key={team + '-' + i} transform={'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ')'}>
                <circle r={cel ? 2.6 : pl.em ? 2.4 : 2.1} fill={pl.role === 'GK' ? '#ffd23f' : colors[team].fill} stroke={isHolder || cel ? '#fff' : 'rgba(0,0,0,.55)'} strokeWidth={isHolder || cel ? 0.6 : 0.35} />
                {pl.em ? <text y="1.1" textAnchor="middle" fontSize="3">{pl.em}</text> : <text y="0.9" textAnchor="middle" fontSize="2.3" fontWeight="800" fill={pl.role === 'GK' ? '#1b1530' : colors[team].text}>{pl.num}</text>}
                <text className={'plabel' + (isHolder || cel ? ' on' : '')} y="-2.8" textAnchor="middle" fontSize="2.4" fontWeight="700" fill="#fff">{short(pl.name)}</text>
              </g>
            );
          }))}
          <circle cx={fr.ball.x} cy={fr.ball.y} r="1" fill="#fff" stroke="#111" strokeWidth="0.25" />
          {bannerNow && !done && <text x={PITCH.w / 2} y={PITCH.h / 2 + 3} textAnchor="middle" fontSize={bannerNow === 'GOAL!' ? 11 : cuteNow && bannerNow === cuteNow.banner ? 6.5 : 7} fontWeight="900" fill={bannerNow === 'GOAL!' ? '#ffc83d' : cuteNow && bannerNow === cuteNow.banner ? (cuteNow.good ? '#7cf2b0' : '#ff9ab0') : '#fff'} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke" className="pbanner">{bannerNow}</text>}
        </svg>
      </div>
      <div className="mctrl" role="group" aria-label="Match controls">
        {!done && <button className="btn btn-sm" onClick={() => setPlaying((x) => !x)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸ Pause' : '▶ Play'}</button>}
        {!done && [1, 2, 4].map((x) => <button key={x} className={'btn btn-sm' + (mult === x ? ' btn-gold' : '')} aria-pressed={mult === x} onClick={() => setMult(x)}>{x}×</button>)}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => setT(script.total)}>Skip to result</button>}
        {done && <button className="btn btn-sm" onClick={() => { fired.current = true; lastShown.current = 0; setT(0); setPlaying(true); }}>↺ Watch again</button>}
      </div>
      <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map((e, k) => (
          <p key={k} className={'mev ' + e.type + (e.team != null ? ' t' + e.team : '')}>
            <span className="mm num">{e.type === 'pen' || e.type === 'pens' ? 'PEN' : e.type === 'note' ? 'i' : e.min + '′'}</span>
            <span>{e.type === 'goal' ? '⚽ ' : e.type === 'yellow' ? '🟨 ' : e.type === 'red' ? '🟥 ' : e.type === 'pen' ? (e.scored ? '✅ ' : '❌ ') : e.type === 'tackle' ? '🛡️ ' : e.type === 'chance' ? '🧤 ' : ''}{e.text}{e.team != null && e.type !== 'pen' ? <small> · {(e.team === 0 ? A : B).name}</small> : null}</span>
          </p>
        ))}
      </div>
      {done && <MatchSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}
// Old saved matches (before the pitch) keep their text-only replay.
function MatchView(props) { return props.match && props.match.v === 'gp' ? <TrackView {...props} /> : props.match && props.match.v === 'card' ? <RingView {...props} /> : props.match && props.match.v === 'hoops' ? <CourtView {...props} /> : props.match && props.match.v === 'show' ? <ShowView {...props} /> : props.match && props.match.v === 'mission' ? <MissionView {...props} /> : props.match && props.match.v === 'survival' ? <SurvivalView {...props} /> : props.match && props.match.v === 'arena' ? <ArenaView {...props} /> : props.match && props.match.v === 'battle' ? <BattleView {...props} /> : props.match && props.match.v === 2 ? <PitchMatch {...props} /> : <MatchPlayer {...props} />; }

/* ---------- match report (football and Puppy Bowl), built only from the recorded events ---------- */
function matchReport(d, A, B, match) {
  const teams = [A, B];
  const price = (t, name) => { const x = t.team.find((e) => e && d.items[e.itemId] && d.items[e.itemId].name === name); return x ? x.price || 0 : 0; };
  const pts = {}; const add = (team, name, n, why) => { if (!name) return; const k = team + '|' + name; pts[k] = pts[k] || { team, name, n: 0, why: [] }; pts[k].n += n; if (why) pts[k].why.push(why); };
  match.events.forEach((e) => {
    if (e.type === 'goal') { add(e.team, e.player, 3, 'goal'); if (e.assist) add(e.team, e.assist, 2, 'assist'); }
    else if (e.type === 'chance' && /save/i.test(e.text) && match.seqs[e.seq]) add(1 - e.team, match.seqs[e.seq].keeper, 1, 'save');
    else if (e.type === 'tackle') add(e.team, e.player, 0.5, 'tackle');
    else if (e.type === 'cute' && e.good) add(e.team, e.player, 1, 'cute');
  });
  const all = Object.values(pts).sort((x, y) => y.n - x.n);
  const W = match.winner;
  const mvp = all.find((p) => W == null || p.team === W) || all[0] || null;
  // Turning point: the goal after which the eventual winner was never behind or level again.
  let turning = null;
  if (W != null) {
    const goals = match.events.filter((e) => e.type === 'goal');
    for (let k = goals.length - 1; k >= 0; k--) { const g = goals[k]; if (g.team !== W) break; const before = k ? goals[k - 1].score : [0, 0]; if (before[W] <= before[1 - W]) { turning = g; break; } }
    if (!turning && match.pens) turning = { pens: true };
  }
  // Best buy and biggest flop, by contribution for the money (only drafted, paid picks).
  const rows = [0, 1].flatMap((i) => teams[i].team.filter(Boolean).map((e) => { const it = d.items[e.itemId]; if (!it) return null; const p = pts[i + '|' + it.name]; return { team: i, name: it.name, price: e.price || 0, n: p ? p.n : 0 }; }).filter(Boolean));
  const best = rows.filter((r) => r.n > 0).sort((x, y) => y.n / Math.max(1, y.price) - x.n / Math.max(1, x.price))[0] || null;
  const flop = rows.filter((r) => r.price >= 2 && r.n === 0).sort((x, y) => y.price - x.price)[0] || null;
  return { mvp, turning, best, flop, priceOf: price };
}
function MatchReport({ d, A, B, match }) {
  const R = matchReport(d, A, B, match);
  const T = (i) => (i === 0 ? A : B);
  const why = (p) => { const c = (k) => p.why.filter((x) => x === k).length; const bits = [['goal', 'goal'], ['assist', 'assist'], ['save', 'save'], ['cute', 'cute moment']].map(([k, w]) => (c(k) ? c(k) + ' ' + w + (c(k) > 1 ? 's' : '') : null)).filter(Boolean); return bits.join(', ') || 'kept things ticking'; };
  return (
    <div className="mreport">
      <h4>📋 Match report</h4>
      {R.mvp && <p className="small"><b>⭐ MVP:</b> {R.mvp.name} ({T(R.mvp.team).name}) — {why(R.mvp)}.</p>}
      {R.turning && <p className="small"><b>🔄 Turning point:</b> {R.turning.pens ? 'the penalty shoot-out.' : R.turning.player + '’s goal at ' + R.turning.min + '′ put ' + T(R.turning.team).name + ' ahead for good.'}</p>}
      {R.best && <p className="small"><b>💰 Best buy:</b> {R.best.name} — ${R.best.price} for {T(R.best.team).name}.</p>}
      {R.flop && <p className="small"><b>📉 Quiet day:</b> {R.flop.name} cost ${R.flop.price} and didn’t get on the scoresheet.</p>}
      {match.puppy && match.moments && match.moments.length > 0 && <p className="small"><b>🐾 Cute moments:</b> {match.moments.map((m) => m.emoji + ' ' + m.player + ' (' + T(m.team).name + ') → ' + m.outcome).join(' · ')}</p>}
    </div>
  );
}
