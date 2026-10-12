/* ============================================================
   ANIMAL ARENA screen (rules in 29-arena.js). An animated arena:
   both animals enter, then every move plays out — charges,
   dodges, ambushes, knockouts — with commentary. No health bars.
   ============================================================ */
const ARENA_POP = { hit: 'HIT!', crit: 'HUGE HIT!', ambush: 'AMBUSH!', venom: 'VENOM!', dodge: 'DODGE!', block: 'BLOCKED', tired: 'TIRED…', retreat: 'RETREAT!', ko: 'K.O.!', decision: 'JUDGES', turf: '?!' };
const BASE = [{ x: 24, y: 52 }, { x: 76, y: 52 }];
// Where both animals are for one moment of the fight.
function arenaPose(ev, endW) {
  const p = [{ ...BASE[0], cls: '' }, { ...BASE[1], cls: '' }];
  if (!ev) return p;
  const i = ev.by, j = 1 - i, dir = i === 0 ? 1 : -1;
  if (['hit', 'crit', 'ambush', 'venom'].includes(ev.type)) { p[i] = { x: 50 - dir * 6, y: 52, cls: 'lunge' }; p[j] = { x: 50 + dir * (ev.big ? 22 : 15), y: 52 + (ev.big ? 6 : 0), cls: 'struck' }; }
  else if (ev.type === 'dodge') { const att = j, ad = att === 0 ? 1 : -1; p[att] = { x: 50 + ad * 4, y: 52, cls: 'lunge' }; p[i] = { x: BASE[i].x, y: 22, cls: 'jump' }; }
  else if (ev.type === 'block') { const att = j, ad = att === 0 ? 1 : -1; p[att] = { x: 50 - ad * 13, y: 52, cls: 'lunge' }; p[i] = { x: 50 + ad * 13, y: 52, cls: 'brace' }; }
  else if (ev.type === 'tired') p[i] = { ...BASE[i], y: 60, cls: 'tired' };
  else if (ev.type === 'turf') p[i] = { ...BASE[i], cls: 'wobble' };
  else if (ev.type === 'retreat') { p[i] = { x: i === 0 ? -14 : 114, y: 52, cls: 'flee' }; p[j] = { x: 50, y: 52, cls: 'win' }; }
  else if (ev.type === 'ko') { p[j] = { x: BASE[j].x, y: 62, cls: 'down' }; p[i] = { x: 50, y: 45, cls: 'win' }; }
  else if (ev.type === 'decision') { p[i] = { x: 50 - (i === 0 ? 10 : -10), y: 46, cls: 'win' }; }
  return p;
}
function ArenaToken({ d, f, team, pose, anim }) {
  if (!f) return null;
  const item = d.items[f.itemId] || { name: f.name, emoji: f.emoji };
  return (
    <div className={'atoken ' + (pose.cls || '') + (anim ? ' anim' : '')} style={{ ...mStyle(team), left: pose.x + '%', top: pose.y + '%' }}>
      <span className="at-art"><ItemArt item={item} topic={d.topic} size={64} round /></span>
      <span className="at-n">{f.name}</span>
    </div>
  );
}

function ArenaView({ d, A, B, match, speed, commentary, onDone, label }) {
  const instant = speed === 'instant';
  const R = match.rounds;
  const [r, setR] = useState(instant ? R.length : 0);
  const [e, setE] = useState(-1); // -1 = entrance; events…; events.length = result
  const fast = speed === 'fast';
  const done = r >= R.length;
  const fired = useRef(false);
  const feedRef = useRef(null);
  const cur = done ? null : R[r];
  const n = cur ? cur.events.length : 0;
  useEffect(() => {
    if (done) { if (!fired.current) { fired.current = true; if (!instant) audio.play('whistle'); onDone && onDone(); } return undefined; }
    let wait;
    if (e < 0) wait = fast ? 800 : 1700;
    else if (e < n) { const t = cur.events[e].type; wait = (fast ? 700 : 1400) + (t === 'ko' || t === 'retreat' ? (fast ? 300 : 700) : 0); }
    else wait = fast ? 1100 : 2200;
    const t = setTimeout(() => {
      if (e < n) {
        const nx = e + 1; setE(nx);
        if (nx < n) { const ty = cur.events[nx].type; audio.play(ty === 'crit' || ty === 'ambush' ? 'big' : ty === 'dodge' || ty === 'block' ? 'card' : ty === 'ko' ? 'cheer' : 'bid'); }
        else audio.play(cur.upset ? 'cheer' : 'gavel');
      } else { setR(r + 1); setE(-1); }
    }, ms(wait));
    return () => clearTimeout(t);
  }, [r, e, done]);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [r, e]);
  const ev = cur && e >= 0 && e < n ? cur.events[e] : null;
  const result = cur && e >= n;
  const pose = cur ? (result ? arenaPose(cur.events[n - 1]) : arenaPose(ev)) : arenaPose(null);
  const score = cur ? (result ? cur.score : r ? R[r - 1].score : [0, 0]) : match.score;
  const anim = !reducedMotion();
  const feed = [];
  R.slice(0, r + (cur ? 1 : 0)).forEach((rd, k) => {
    const upto = k < r ? rd.events.length : Math.max(0, Math.min(e + 1, rd.events.length));
    if (k < r || e >= 0) feed.push({ head: true, k, rd });
    rd.events.slice(0, upto).forEach((x, q) => { if (commentary !== false || ['ko', 'retreat', 'decision', 'ambush'].includes(x.type)) feed.push({ k, x, q }); });
  });
  return (
    <div className="matchview arenaview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid">
          <span className="sb-score num" aria-live="polite">{score[0]}–{score[1]}</span>
          <span className="sb-clock num">{done ? 'Final' + (match.sudden ? ' · sudden death' : '') : (cur.sudden ? '⚡ Sudden death' : 'Round ' + (r + 1) + ' of ' + R.length)}</span>
        </div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      {cur && (
        <div className={'arena arena-' + cur.arena + (anim ? '' : ' still')}>
          <div className="arena-bg" aria-hidden="true">{cur.arena === 'W' ? <><i className="wave w1" /><i className="wave w2" /><i className="wave w3" /></> : cur.arena === 'A' ? <><i className="cloud c1" /><i className="cloud c2" /><i className="cloud c3" /></> : <><i className="tuft t1" /><i className="tuft t2" /><i className="tuft t3" /><i className="tuft t4" /></>}</div>
          <p className="arena-title">{ARENAS[cur.arena].emoji} {cur.sudden ? 'Sudden death · ' : ''}{cur.place}</p>
          <ArenaToken d={d} f={cur.a} team={A} pose={e < 0 ? { x: anim ? 8 : 24, y: 52, cls: 'enter' } : pose[0]} anim={anim} />
          <ArenaToken d={d} f={cur.b} team={B} pose={e < 0 ? { x: anim ? 92 : 76, y: 52, cls: 'enter' } : pose[1]} anim={anim} />
          {ev && ARENA_POP[ev.type] && <span key={r + ':' + e} className={'apop ' + ev.type + (anim ? ' pop' : '')} style={{ left: (ev.type === 'dodge' || ev.type === 'block' ? (pose[ev.by].x) : ev.type === 'turf' || ev.type === 'tired' ? pose[ev.by].x : 50) + '%' }}>{ARENA_POP[ev.type]}</span>}
          {result && <span className={'apop result' + (anim ? ' pop' : '')} style={{ left: '50%' }}>{(cur.w === 0 ? A : B).emoji} {(cur.w === 0 ? cur.a : cur.b).name} wins{cur.how === 'walkover' ? '' : ' · ' + cur.how}</span>}
        </div>
      )}
      {cur && <p className={'duel-line' + (result && cur.upset ? ' upset' : '')} aria-live="polite">{e < 0 ? (cur.a && cur.b ? cur.a.name + ' vs ' + cur.b.name : 'Walkover') : ev ? ev.text : (cur.upset ? '😱 UPSET! ' : '') + (cur.w === 0 ? cur.a : cur.b).name + ' takes the round for ' + (cur.w === 0 ? A : B).name + '.'}</p>}
      {feed.length > 0 && <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map((x, k) => x.head
          ? <p key={k} className="mev half"><span className="mm num">{x.rd.sudden ? '⚡' : 'R' + (x.k + 1)}</span><span><b>{ARENAS[x.rd.arena].emoji} {x.rd.a ? x.rd.a.name : 'nobody'} v {x.rd.b ? x.rd.b.name : 'nobody'}</b></span></p>
          : <p key={k} className={'mev ' + (x.x.type === 'ko' || x.x.type === 'retreat' || x.x.type === 'decision' ? 'goal' : x.x.big ? 'chance' : '') + ' t' + x.x.by}><span className="mm num">{ARENA_POP[x.x.type] ? '•' : ''}</span><span>{x.x.text}</span></p>)}
      </div>}
      {!done && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setR(R.length); setE(-1); }}>Skip to the end</button>}
      {done && <ArenaSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}

function ArenaSummary({ d, A, B, match }) {
  const W = match.winner === 0 ? A : B;
  const kos = match.rounds.filter((x) => x.how === 'knockout').length;
  return (
    <div className="board msummary">
      <h3>⚔️ Battle summary</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {match.score[0]}–{match.score[1]} {B.name}</b>{match.sudden ? ' · decided in sudden death' : ''}</p>
      {match.rounds.map((rd, k) => (
        <p key={k} className="small" style={{ margin: 0 }}>{rd.sudden ? '⚡' : 'R' + (k + 1)} {ARENAS[rd.arena].emoji} {rd.a ? rd.a.name : 'nobody'} v {rd.b ? rd.b.name : 'nobody'} → <b>{(rd.w === 0 ? rd.a : rd.b).name}</b> ({rd.how}){rd.upset ? ' 😱 upset' : ''}</p>
      ))}
      <p className="small" style={{ margin: 0 }}>🏅 {W.name} win{kos ? ' · ' + kos + ' knockout' + (kos === 1 ? '' : 's') : ''}</p>
      <p className="hint" style={{ margin: 0 }}>Fights are worked out from Draft Night’s estimated stats (power, speed, defence, weapons, stamina, smarts and home turf) plus luck. Just for fun — not real science.</p>
    </div>
  );
}
