/* ============================================================
   AMERICAN FOOTBALL screen (rules in 29-nfl.js). A top-down field
   with all 22 players, the line of scrimmage and first-down line.
   Big plays are animated: the snap, drop-back, routes, the throw,
   the catch and run, handoffs and breakaway runs, sacks, picks,
   field goals and punts. Other plays roll by as drives, so the
   scoreboard always matches the recorded game.
   ============================================================ */
const GF = { w: 120, h: 53.3 };
const gx = (poss, on) => (poss === 0 ? 10 + on : 110 - on);
const lerpG = (a, b, u) => ({ x: a.x + (b.x - a.x) * Math.max(0, Math.min(1, u)), y: a.y + (b.y - a.y) * Math.max(0, Math.min(1, u)) });
const PLAY_DUR = { pass: 4.4, inc: 3.6, int: 4.6, run: 3.8, scramble: 3.8, sack: 3.4, fum: 3.8, fg: 3.6, punt: 3.2, duel: 3, ot: 2.4 };
function nflScript(match) {
  const beats = []; let t = 0;
  const add = (b) => { b.t0 = t; t += b.dur; beats.push(b); return b; };
  add({ type: 'intro', dur: 2.6 });
  let roll = [];
  const flush = () => { if (!roll.length) return; add({ type: 'drive', dur: Math.min(2.6, 0.7 + roll.length * 0.16), plays: roll }); roll = []; };
  match.plays.forEach((p) => {
    if (p.type === 'qend' || p.type === 'half') { flush(); add({ type: 'break', dur: 2.2, p }); return; }
    if (p.type === 'kick') return;
    if (p.hl) { flush(); add({ type: 'play', dur: (PLAY_DUR[p.type] || 3.6) + (p.td ? 1.6 : 0), p }); }
    else roll.push(p);
  });
  flush();
  add({ type: 'final', dur: 2.8 });
  return { beats, total: t };
}
const playEnd = (p) => (p.type === 'int' || p.type === 'punt' || p.type === 'fg' ? p.on : Math.max(0, Math.min(100, p.on + (p.yds || 0))));
// The 22 players at time u of one play.
function nflFrame(beat, u) {
  const p = beat.p; const o = p.poss; const dir = o === 0 ? 1 : -1;
  const L = gx(o, p.on); const mid = GF.h / 2;
  const at = (dx, y) => ({ x: L + dir * dx, y });
  const off = { qb: at(-5, mid), rb: at(-7.5, mid + 2), wr1: at(-1, 6), wr2: at(-1, GF.h - 6), te: at(-1, mid + 8), ol: [-4, -2, 0, 2, 4].map((k) => at(-1, mid + k)) };
  const def = { dl: [-3, -1, 1, 3].map((k) => at(1, mid + k)), lb: [-6, 0, 6].map((k) => at(5, mid + k)), cb: [at(7, 7), at(7, GF.h - 7)], s: [at(13, mid - 9), at(13, mid + 9)] };
  const out = { off, def, ball: { ...at(0, mid), h: 0 }, banner: null, carrier: null, flash: null };
  const snap = 0.6;
  if (u < snap) { out.ball = { ...at(0, mid), h: 0 }; return out; }
  const k = (a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));
  const endX = gx(o, playEnd(p));
  // Defenders flow toward the ball.
  const chase = (target, s0) => { const kk = easeC(k(s0, s0 + 1.6)) * 0.75; ['dl', 'lb', 'cb', 's'].forEach((g) => { def[g] = def[g].map((d2, i) => lerpG(d2, { x: target.x + (i - 1) * 1.4 * -dir, y: target.y + (i - 1.5) * 2.2 }, kk)); }); };
  if (p.type === 'fg' || p.type === 'duel') {
    const hold = at(-7, mid); off.qb = hold;
    const posts = { x: o === 0 ? 120 : 0, y: mid };
    const kk = k(1.0, 2.4);
    out.ball = kk <= 0 ? { ...hold, h: 0 } : { ...lerpG(hold, { x: posts.x, y: p.good === false ? mid + (unit('fgw', p.i) < 0.5 ? -5 : 5) : mid }, kk), h: Math.sin(kk * Math.PI) * 9 + kk * 3 };
    if (u > 2.4) out.banner = p.type === 'duel' ? 'IT’S GOOD!' : p.good ? 'GOOD!' : 'NO GOOD!';
    return out;
  }
  if (p.type === 'punt') {
    const punter = at(-14, mid); off.qb = punter;
    const kk = k(1.0, 2.6); const land = { x: L + dir * Math.min(p.yds || 40, 60), y: mid + 6 };
    out.ball = kk <= 0 ? { ...lerpG(at(0, mid), punter, k(snap, 1.0)), h: 0.5 } : { ...lerpG(punter, land, kk), h: Math.sin(kk * Math.PI) * 12 };
    chase(land, 1.2);
    return out;
  }
  if (p.type === 'run' || (p.type === 'fum' && p.run)) {
    const hand = 0.95;
    const rb0 = off.rb; const hole = at(0.5, mid + (unit('hole', p.i) - 0.5) * 6);
    const end = { x: endX, y: hole.y + (unit('cut', p.i) - 0.5) * 16 };
    if (u < hand) { out.ball = lerpG(at(0, mid), off.qb, k(snap, hand)); }
    else {
      const kk = k(hand, beat.dur - 0.9);
      off.rb = kk < 0.25 ? lerpG(rb0, hole, kk / 0.25) : lerpG(hole, end, easeC((kk - 0.25) / 0.75));
      out.ball = { ...off.rb, h: 0.6 }; out.carrier = 'rb';
    }
    off.ol = off.ol.map((x) => lerpG(x, at(1.5, x.y), k(snap, 1.2)));
    chase(off.rb, 0.8);
    if (u > beat.dur - 0.9) { out.banner = p.td ? 'TOUCHDOWN!' : p.type === 'fum' ? 'FUMBLE!' : (p.yds || 0) >= 18 ? 'BREAKAWAY!' : (p.yds || 0) <= 0 ? 'STUFFED!' : null; if (p.type === 'fum') out.flash = off.rb; }
    return out;
  }
  // Passing plays: drop back.
  off.qb = lerpG(at(-5, mid), at(-8, mid), k(snap, 1.3));
  out.ball = k(snap, 0.75) < 1 ? lerpG(at(0, mid), off.qb, k(snap, 0.75)) : { ...off.qb, h: 1 };
  off.ol = off.ol.map((x) => lerpG(x, at(-3, x.y), k(snap, 1.2)));
  if (p.type === 'sack' || p.type === 'fum') {
    const rush = def.dl[1];
    def.dl[1] = lerpG(rush, off.qb, easeC(k(0.8, 1.7)));
    if (u > 1.7) { out.banner = p.type === 'fum' ? 'STRIP SACK!' : 'SACK!'; out.flash = off.qb; out.qbDown = true; }
    return out;
  }
  if (p.type === 'scramble') {
    const end = { x: endX, y: mid + (unit('scr', p.i) - 0.5) * 20 };
    if (u > 1.5) { off.qb = lerpG(off.qb, end, easeC(k(1.5, beat.dur - 0.9))); out.ball = { ...off.qb, h: 1 }; out.carrier = 'qb'; }
    chase(off.qb, 1.5);
    if (u > beat.dur - 0.9) out.banner = p.td ? 'TOUCHDOWN!' : 'SCRAMBLE!';
    return out;
  }
  // Routes: the target runs to the catch point; everyone else runs something.
  const tk = p.tgtKey || 'wr1';
  const catchPt = { x: L + dir * Math.max(1, p.air || 6), y: tk === 'wr1' ? 10 : tk === 'wr2' ? GF.h - 10 : tk === 'te' ? mid + 6 : mid - 4 };
  const routeK = easeC(k(snap, 2.1));
  ['wr1', 'wr2', 'te', 'rb'].forEach((key) => { const start = off[key]; const tgt = key === tk ? catchPt : { x: L + dir * (6 + unit('rt', p.i, key) * 14), y: start.y + (unit('rty', p.i, key) - 0.5) * 12 }; off[key] = lerpG(start, tgt, routeK); });
  def.cb = def.cb.map((c, i) => lerpG(c, i === 0 ? off.wr1 : off.wr2, routeK * 0.9));
  def.s = def.s.map((c) => lerpG(c, catchPt, routeK * 0.55));
  const throwAt = 1.45, catchAt = 2.15;
  if (u >= throwAt) {
    const kk = k(throwAt, catchAt);
    if (kk < 1) out.ball = { ...lerpG(off.qb, catchPt, kk), h: Math.sin(kk * Math.PI) * (p.dz === 'deep' ? 7 : 3.5) + 1 };
    else if (p.type === 'inc') { out.ball = { x: catchPt.x + dir * 2, y: catchPt.y + 1, h: 0 }; out.banner = 'INCOMPLETE'; }
    else if (p.type === 'int') {
      const picker = def.s[0]; const back = { x: endX, y: catchPt.y + 6 };
      def.s[0] = lerpG(catchPt, back, easeC(k(catchAt, beat.dur - 0.8))); out.ball = { ...def.s[0], h: 0.6 }; out.carrier = 'pick';
      out.banner = 'INTERCEPTED!'; if (picker) out.flash = null;
    } else {
      const end = { x: endX, y: catchPt.y + (unit('yac', p.i) - 0.5) * 10 };
      off[tk] = lerpG(catchPt, end, easeC(k(catchAt, beat.dur - (p.td ? 1.6 : 0.8)))); out.ball = { ...off[tk], h: 0.6 }; out.carrier = tk;
      chase(off[tk], catchAt - 0.3);
      if (u > catchAt + 0.1) out.banner = p.td && u > beat.dur - 1.7 ? 'TOUCHDOWN!' : (p.yds || 0) >= 20 && u < catchAt + 0.9 ? 'BIG PLAY!' : null;
    }
  }
  return out;
}

function GridironView({ d, A, B, match, speed, onDone, label }) {
  const script = useMemo(() => nflScript(match), [match]);
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
  useEffect(() => { if (done && !fired.current) { fired.current = true; audio.play('whistle'); onDone && onDone(); } }, [done]);
  const bi = Math.max(0, script.beats.findIndex((b) => t < b.t0 + b.dur));
  const beat = done ? script.beats[script.beats.length - 1] : script.beats[bi];
  const u = done ? beat.dur : t - beat.t0;
  const L = match.lineups;
  const keyOf = (s, name) => { const x = L[s].find((r) => r.name === name); return x ? x.k : null; };
  const pBeat = beat.type === 'play' ? { ...beat, p: { ...beat.p, tgtKey: keyOf(beat.p.poss, beat.p.tgt) || 'wr1' } } : null;
  const fr = pBeat ? nflFrame(pBeat, u) : null;
  // Score / clock / down at this moment.
  let shown = null;
  if (beat.type === 'play') shown = u > beat.dur - (beat.p.td ? 1.7 : 0.9) ? { ...beat.p, after: true } : { ...beat.p, score: script.beats[bi - 1] && script.beats[bi - 1].type === 'drive' ? script.beats[bi - 1].plays[script.beats[bi - 1].plays.length - 1].score : prevScore(match, beat.p) };
  else if (beat.type === 'drive') { const n = beat.plays.length; const j = Math.min(n - 1, Math.floor((u / beat.dur) * n)); shown = beat.plays[j]; }
  else if (beat.type === 'break') shown = beat.p;
  const score = done || beat.type === 'final' ? match.score : shown ? shown.score : [0, 0];
  const qNow = shown ? shown.q : beat.type === 'final' || done ? (match.ot ? 4 + match.ot : 4) : 1;
  const status = done || beat.type === 'final' ? (match.ot ? 'FINAL/OT' : 'FINAL') : beat.type === 'intro' ? 'KICKOFF' : beat.type === 'break' ? (beat.p.type === 'half' ? 'HALFTIME' : 'END ' + nflQName(beat.p.q - 1)) : nflQName(qNow) + ' ' + nflClock(shown ? shown.clk : 900);
  const downTxt = shown && shown.down && beat.type !== 'break' ? NFL_ORD[shown.down] + ' & ' + (shown.togo >= 100 - shown.on ? 'Goal' : shown.togo) + ' · ' + nflYard(shown.on) : '';
  const possName = shown && shown.poss != null ? (shown.poss === 0 ? A : B).name : '';
  const colors = [A.color, B.color];
  // Drive beats: the ball marker travels down the field.
  let driveBall = null;
  if (beat.type === 'drive') { const n = beat.plays.length; const f = (u / beat.dur) * n; const j = Math.min(n - 1, Math.floor(f)); const pl = beat.plays[j]; const x0 = gx(pl.poss, pl.on), x1 = gx(pl.poss, playEnd(pl)); driveBall = { x: x0 + (x1 - x0) * Math.min(1, f - j), y: GF.h / 2 }; }
  const banner = done ? null : beat.type === 'intro' ? 'KICKOFF' : beat.type === 'final' ? 'FINAL' : beat.type === 'break' ? (beat.p.type === 'half' ? 'HALFTIME' : 'END OF ' + nflQName(beat.p.q - 1)) : beat.type === 'drive' && u > beat.dur * 0.5 ? (() => { const last = beat.plays[beat.plays.length - 1]; return last.type === 'fg' ? (last.good ? 'FIELD GOAL' : 'MISSED FG') : last.type === 'punt' ? 'PUNT' : null; })() : fr ? fr.banner : null;
  const lastBeat = useRef(-1);
  useEffect(() => { if (!playing || done || bi === lastBeat.current) return; lastBeat.current = bi; if (beat.type === 'break' || beat.type === 'intro') audio.play('whistle'); }, [bi]);
  const said = useRef({});
  useEffect(() => { if (!playing || done || beat.type !== 'play' || said.current[bi] || u < beat.dur - (beat.p.td ? 1.6 : 0.8)) return; said.current[bi] = true; const p = beat.p; if (p.td) { audio.play('cheer'); audio.say('Touchdown, ' + (p.poss === 0 ? A : B).name + '!', 2, d.id + ':' + label + ':td' + bi); } else if (p.type === 'int' || p.type === 'fum') audio.play('buzzer'); else if (p.type === 'sack') audio.play('card'); else if (p.type === 'fg' && p.good) audio.play('bid'); }, [t]);
  const feed = [];
  script.beats.forEach((b, k) => {
    if (!done && b.t0 + b.dur * 0.75 > t) return;
    if (b.type === 'play') feed.push({ k, q: b.p.q, clk: b.p.clk, team: b.p.poss, big: b.p.td || b.p.big, text: b.p.text + (b.p.after ? ' ' + b.p.after : '') });
    else if (b.type === 'drive') { const last = b.plays[b.plays.length - 1]; const first = b.plays[0]; const yd = b.plays.reduce((n, x) => n + (x.type === 'punt' || x.type === 'fg' ? 0 : x.yds || 0), 0); if (last.type === 'fg' || last.type === 'punt' || b.plays.length >= 3) feed.push({ k, q: last.q, clk: last.clk, team: first.poss, text: (first.poss === 0 ? A : B).name + ': ' + b.plays.length + ' play' + (b.plays.length === 1 ? '' : 's') + ', ' + yd + ' yards — ' + last.text, run: true, big: last.type === 'fg' && last.good }); }
    else if (b.type === 'break') feed.push({ k, q: b.p.q, clk: 0, text: b.p.text, half: true });
  });
  const feedRef = useRef(null);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [feed.length]);
  const short = (n) => { const w = String(n || '').split(' '); return w[w.length - 1].slice(0, 10); };
  const losX = shown && shown.on != null && beat.type !== 'break' ? gx(shown.poss, shown.on) : null;
  const fdX = shown && shown.on != null && shown.togo && beat.type !== 'break' ? gx(shown.poss, Math.min(100, shown.on + shown.togo)) : null;
  const Dot = ({ p, c, lab, ring, small }) => (p ? <g transform={'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ')'}><circle r={small ? 1.15 : 1.45} fill={c} stroke={ring ? '#fff' : 'rgba(0,0,0,.5)'} strokeWidth={ring ? 0.45 : 0.25} />{lab && <text y="-2" textAnchor="middle" fontSize="2" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.4" paintOrder="stroke">{lab}</text>}</g> : null);
  return (
    <div className="matchview gridview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid"><span className="sb-score num" aria-live="polite">{score[0]}–{score[1]}</span><span className="sb-clock num">{status}</span></div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      <div className="boutbar small">{possName ? <><b>🏈 {possName}</b> <span className="muted">· {downTxt}</span></> : <span className="muted">Draft Night Bowl</span>}</div>
      <div className="pitchwrap">
        <svg className="pitchsvg gridsvg" viewBox={'-2 -2 ' + (GF.w + 4) + ' ' + (GF.h + 4)} role="img" aria-label={'Football field: ' + A.name + ' ' + score[0] + ', ' + B.name + ' ' + score[1] + ', ' + status}>
          <rect x="-2" y="-2" width={GF.w + 4} height={GF.h + 4} fill="#2f6b2a" />
          {Array.from({ length: 10 }, (_, i) => <rect key={i} x={10 + i * 10} y="0" width="10" height={GF.h} fill={i % 2 ? '#3f8a37' : '#47963e'} />)}
          <rect x="0" y="0" width="10" height={GF.h} fill={A.color} opacity=".55" /><rect x="110" y="0" width="10" height={GF.h} fill={B.color} opacity=".55" />
          <text x="5" y={GF.h / 2} textAnchor="middle" fontSize="3.2" fontWeight="900" fill="#fff" opacity=".85" transform={'rotate(-90 5 ' + GF.h / 2 + ')'}>{A.name.toUpperCase().slice(0, 14)}</text>
          <text x="115" y={GF.h / 2} textAnchor="middle" fontSize="3.2" fontWeight="900" fill="#fff" opacity=".85" transform={'rotate(90 115 ' + GF.h / 2 + ')'}>{B.name.toUpperCase().slice(0, 14)}</text>
          <g stroke="rgba(255,255,255,.75)" strokeWidth="0.3">{Array.from({ length: 11 }, (_, i) => <line key={i} x1={10 + i * 10} y1="0" x2={10 + i * 10} y2={GF.h} />)}<rect x="0" y="0" width={GF.w} height={GF.h} fill="none" /></g>
          {Array.from({ length: 9 }, (_, i) => <text key={i} x={20 + i * 10} y="6" textAnchor="middle" fontSize="2.6" fontWeight="800" fill="rgba(255,255,255,.7)">{(i < 4 ? (i + 1) * 10 : i === 4 ? 50 : (9 - i) * 10)}</text>)}
          {[0, 120].map((x) => <g key={x}><line x1={x} y1={GF.h / 2 - 3} x2={x} y2={GF.h / 2 + 3} stroke="#ffd23d" strokeWidth="0.7" /></g>)}
          {losX != null && <line x1={losX} y1="0" x2={losX} y2={GF.h} stroke="#3d9bff" strokeWidth="0.45" />}
          {fdX != null && fdX !== losX && <line x1={fdX} y1="0" x2={fdX} y2={GF.h} stroke="#ffd23d" strokeWidth="0.45" />}
          {fr && (() => { const o = beat.p.poss; const oc = colors[o], dc = colors[1 - o]; const lin = (key) => L[o].find((r) => r.k === key); const dstar = L[1 - o].find((r) => r.k === 'def'); const role = dstar && dstar.role; const starAt = role === 'DL' ? fr.def.dl[1] : role === 'CB' ? fr.def.cb[0] : role === 'S' ? fr.def.s[0] : fr.def.lb[1]; return (
            <g>
              {['dl', 'lb', 'cb', 's'].flatMap((g) => fr.def[g].map((pp, i) => <Dot key={g + i} p={pp} c={dc} small />))}
              {dstar && !dstar.backup && <Dot p={starAt} c={dc} lab={short(dstar.name)} ring />}
              {fr.off.ol.map((pp, i) => <Dot key={'ol' + i} p={pp} c={oc} small />)}
              {['wr1', 'wr2', 'te', 'rb'].map((key) => <Dot key={key} p={fr.off[key]} c={oc} lab={fr.carrier === key || beat.p.tgtKey === key ? short(lin(key) && lin(key).name) : null} ring={fr.carrier === key} />)}
              {!fr.qbDown && <Dot p={fr.off.qb} c={oc} lab={beat.p.type === 'fg' || beat.p.type === 'punt' ? null : short(lin('qb') && lin('qb').name)} ring={fr.carrier === 'qb'} />}
              {fr.qbDown && <g transform={'translate(' + fr.off.qb.x.toFixed(2) + ' ' + fr.off.qb.y.toFixed(2) + ')'}><ellipse rx="2.2" ry="1" fill={oc} stroke="rgba(0,0,0,.5)" strokeWidth=".25" /></g>}
              {fr.flash && <circle cx={fr.flash.x} cy={fr.flash.y} r="3.2" fill="none" stroke="#ffd23d" strokeWidth="0.5" />}
            </g>
          ); })()}
          {(() => { const b = fr ? fr.ball : driveBall; if (!b) return null; return <g><ellipse cx={b.x} cy={b.y + 0.3} rx="0.8" ry="0.4" fill="rgba(0,0,0,.3)" /><ellipse cx={b.x} cy={b.y - (b.h || 0) * 0.45} rx={0.95 + (b.h || 0) * 0.03} ry="0.6" fill="#8a4a1f" stroke="#fff" strokeWidth="0.15" /></g>; })()}
          {(done || beat.type === 'final') && <g><rect x="-2" y="-2" width={GF.w + 4} height={GF.h + 4} fill="rgba(15,12,33,.55)" /><text x="60" y="24" textAnchor="middle" fontSize="4" fontWeight="800" fill="#fff">FINAL{match.ot ? ' / OT' : ''}</text><text x="60" y="34" textAnchor="middle" fontSize="8" fontWeight="900" fill={colors[match.winner]} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke">{(match.winner === 0 ? A : B).name.toUpperCase().slice(0, 16)} WIN</text><text x="60" y="43" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#ffc83d">{match.score[0]}–{match.score[1]}</text></g>}
          {banner && <text x="60" y="17" textAnchor="middle" fontSize={banner.length > 12 ? 6.5 : 8.5} fontWeight="900" fill={/TOUCHDOWN|INTERCEPT|SACK|FUMBLE|GOOD|BIG|BREAK/.test(banner) ? '#ffc83d' : '#fff'} stroke="#0f0c21" strokeWidth="0.7" paintOrder="stroke" className="pbanner">{banner}</text>}
        </svg>
      </div>
      <div className="mctrl" role="group" aria-label="Game controls">
        {!done && <button className="btn btn-sm" onClick={() => setPlaying((x) => !x)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸ Pause' : '▶ Play'}</button>}
        {!done && [1, 2, 4].map((x) => <button key={x} className={'btn btn-sm' + (mult === x ? ' btn-gold' : '')} aria-pressed={mult === x} onClick={() => setMult(x)}>{x}×</button>)}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => setT(script.total)}>Skip to result</button>}
        {done && <button className="btn btn-sm" onClick={() => { fired.current = true; said.current = {}; setT(0); setPlaying(true); }}>↺ Watch again</button>}
      </div>
      <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map((e) => <p key={e.k} className={'mev ' + (e.big ? 'goal' : e.half ? 'half' : '') + (e.team != null ? ' t' + e.team : '')}><span className="mm num">{nflQName(e.q)}</span><span>{e.big ? '🏈 ' : e.run ? '➡️ ' : ''}{e.text}{e.team != null ? <small> · {(e.team === 0 ? A : B).name}</small> : null}</span></p>)}
      </div>
      {done && <NFLSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}
function prevScore(match, p) { const prev = match.plays[p.i - 1]; return prev ? prev.score : [0, 0]; }
function nflReport(d, A, B, match) {
  const T = [A, B];
  const rows = [0, 1].flatMap((s) => Object.entries(match.box[s]).map(([name, b]) => ({ team: s, name, ...b, gs: b.pass / 25 + b.ptd * 4 - b.int * 3 + b.rush / 10 + b.rtd * 6 + b.recY / 10 + b.rectd * 6 + b.sack * 3 + b.ints * 5 + b.ff * 3 + b.tkl * 0.5 })));
  const mvp = rows.filter((r) => r.team === match.winner).sort((x, y) => y.gs - x.gs)[0] || null;
  let lead = 0, turning = null;
  match.plays.forEach((p) => { const l = Math.sign(p.score[0] - p.score[1]); if (l && l !== lead) { if ((l > 0 ? 0 : 1) === match.winner) turning = p; lead = l; } });
  const price = (s, name) => { const e = T[s].team.find((x) => x && d.items[x.itemId] && d.items[x.itemId].name === name); return e ? e.price || 0 : 0; };
  const withPrice = rows.map((r) => ({ ...r, price: price(r.team, r.name) })).filter((r) => r.price > 0 || !/^Backup/.test(r.name));
  const best = withPrice.filter((r) => r.gs > 2 && r.price > 0).sort((x, y) => y.gs / y.price - x.gs / x.price)[0] || null;
  const flop = withPrice.filter((r) => r.price >= 3).sort((x, y) => x.gs / x.price - y.gs / y.price)[0] || null;
  return { rows, mvp, turning, best, flop };
}
const nflLine = (r) => [r.att ? r.comp + '/' + r.att + ', ' + r.pass + ' yds' + (r.ptd ? ', ' + r.ptd + ' TD' : '') + (r.int ? ', ' + r.int + ' INT' : '') : '', r.car ? r.car + ' car, ' + r.rush + ' yds' + (r.rtd ? ', ' + r.rtd + ' TD' : '') : '', r.rec ? r.rec + ' rec, ' + r.recY + ' yds' + (r.rectd ? ', ' + r.rectd + ' TD' : '') : '', r.sack ? r.sack + ' sack' + (r.sack > 1 ? 's' : '') : '', r.ints ? r.ints + ' INT' : '', r.ff ? r.ff + ' forced fumble' : '', r.tkl ? r.tkl + ' tackles' : ''].filter(Boolean).join(' · ');
function NFLSummary({ d, A, B, match }) {
  const R = nflReport(d, A, B, match); const T = (i) => (i === 0 ? A : B);
  return (
    <div className="board msummary">
      <h3>🏈 Box score</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {match.score[0]}–{match.score[1]} {B.name}</b>{match.ot ? ' · after overtime' : ''}</p>
      <table className="qtable small"><thead><tr><th></th>{match.quarters.map((_, q) => <th key={q}>{nflQName(q + 1)}</th>)}<th>T</th></tr></thead><tbody>{[0, 1].map((s) => <tr key={s}><td>{T(s).name}</td>{match.quarters.map((qq, q) => <td key={q} className="num">{qq[s]}</td>)}<td className="num"><b>{match.score[s]}</b></td></tr>)}</tbody></table>
      {[0, 1].map((s) => <div key={s} className="small" style={{ margin: 0 }}><b>{T(s).emoji} {T(s).name}</b>{match.lineups[s].filter((x) => !x.backup).map((x) => { const r = R.rows.find((y) => y.team === s && y.name === x.name); const ln = r ? nflLine(r) : ''; return <div key={x.k} className="muted">{x.pos === 'DEF' ? 'DEF' : x.pos} {x.name}{ln ? ': ' + ln : ': quiet day'}</div>; })}</div>)}
      <div className="mreport">
        <h4>📋 Game report</h4>
        {R.mvp && <p className="small"><b>⭐ MVP:</b> {R.mvp.name} ({T(R.mvp.team).name}) — {nflLine(R.mvp)}.</p>}
        {R.turning && <p className="small"><b>🔄 Turning point:</b> {nflQName(R.turning.q)} {nflClock(R.turning.clk)}: {R.turning.text}</p>}
        {R.best && <p className="small"><b>💰 Best buy:</b> {R.best.name} — ${R.best.price}: {nflLine(R.best)}.</p>}
        {R.flop && R.flop !== R.mvp && <p className="small"><b>📉 Quiet day:</b> {R.flop.name} cost ${R.flop.price}{nflLine(R.flop) ? ': ' + nflLine(R.flop) : ' and barely touched the ball'}.</p>}
      </div>
      <p className="hint" style={{ margin: 0 }}>Every play simulated from Draft Night’s estimated numbers (Now for current players, Prime for legends — not official ratings). The rest of each team is an average supporting cast; empty positions are filled by backups.</p>
    </div>
  );
}
function NFLChip({ item, topic }) {
  const [open, setOpen] = useState(false);
  if (!numbersShown()) return null;
  const r = nflRating(item, item.pos); const era = nflEraOf(item, topic) === 'now' ? 'Now' : 'Prime';
  return (
    <>
      <button type="button" className="ratingchip" onClick={() => setOpen(true)} aria-label={era + ' ' + r.ovr + ', estimated. Show details'}>{era} <b className="num">{r.ovr}</b> est.</button>
      {open && ReactDOM.createPortal(
        <Sheet center onClose={() => setOpen(false)}>
          <div className="ratingcard">
            <div className="rc-top"><span className="rc-ovr num"><small className="rc-era">{era}</small>{r.ovr}</span><span className="rc-role">{r.pos === 'DEF' ? r.role : r.pos}</span><span className="rc-name">{item.name}</span></div>
            <div className="rc-attrs">{NFL_ATTRS[r.pos].map((a) => <div key={a} className="rc-attr"><span className="k" title={NFL_ATTR_NAMES[a]}>{a}</span><span className="bar"><i style={{ width: r.attrs[a] + '%' }} /></span><span className="v num">{r.attrs[a]}</span></div>)}</div>
            <p className="hint" style={{ margin: 0 }}>{era === 'Now' ? 'Now: how good they are today. ' : 'Prime: how good they were at their peak. '}{NFL_ATTRS[r.pos].map((a) => a + ' ' + NFL_ATTR_NAMES[a].toLowerCase()).join(' · ')}. Draft Night estimate, not an official rating.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
        </Sheet>, document.body)}
    </>
  );
}
