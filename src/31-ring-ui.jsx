/* ============================================================
   FIGHT NIGHT screen (rules in 29-combat.js). A side-on view of the
   ring (boxing) or the cage (UFC) with two fighters drawn as simple
   figures that throw jabs, hooks, uppercuts, body shots and kicks,
   get rocked, go down, beat the count, shoot for takedowns, grapple
   on the mat and tap. A referee counts and waves fights off.
   Each round shows its biggest moments; everything else rolls into
   the end-of-round summary, so what you see always matches the
   recorded result. Nothing here is a health bar.
   ============================================================ */
const RING_FLOOR = 44;
const lerpN = (a, b, u) => a + (b - a) * Math.max(0, Math.min(1, u));
const easeF = (u) => { const v = Math.max(0, Math.min(1, u)); return v * v * (3 - 2 * v); };
const EX_DUR = { land: 2.3, counter: 2.6, rock: 3, kd: 4.6, ko: 5, tko: 3.8, td: 2.8, tdstuff: 2.2, gnp: 2.8, subatt: 3.2, sub: 4.2, sweep: 2.2, standup: 1.8, rtd: 3, doc: 3 };
const exKind = (e) => (e.kind === 'land' && e.counter ? 'counter' : e.kind);

function fightScript(match) {
  const beats = []; let t = 0;
  const add = (b) => { b.t0 = t; t += b.dur; beats.push(b); return b; };
  add({ type: 'intro', dur: 2.6, bi: 0 });
  match.bouts.forEach((b, bi) => {
    add({ type: 'walk', dur: 2.8, bi });
    if (b.method === 'WO') { add({ type: 'result', dur: 2.4, bi }); return; }
    b.rounds.forEach((rd) => {
      const r = rd.r;
      const seen = {};
      // One of each grappling moment a round is plenty (the finish always stays).
      let hl = b.events.filter((e) => e.r === r && e.hl && e.kind !== 'bell' && e.kind !== 'rtd' && e.kind !== 'doc').filter((e) => { if (e.big || (e.kind !== 'subatt' && e.kind !== 'gnp' && e.kind !== 'sweep')) return true; if (seen[e.kind]) return false; seen[e.kind] = 1; return true; });
      // Keep at most three moments a round (the stoppage and knockdowns always stay).
      const cap = b.disc === 'box' ? 3 : 4;
      if (hl.length > cap) { const must = hl.filter((e) => e.big); const rest = hl.filter((e) => !e.big).sort((x, y) => (y.v || 0) - (x.v || 0)).slice(0, Math.max(0, cap - must.length)); hl = hl.filter((e) => must.includes(e) || rest.includes(e)); }
      add({ type: 'rstart', dur: 1.3, bi, r });
      hl.forEach((e) => add({ type: 'ex', dur: EX_DUR[exKind(e)] || 2.4, bi, r, e }));
      const bell = b.events.find((e) => e.r === r && e.kind === 'bell');
      if (bell) add({ type: 'rend', dur: 2, bi, r, e: bell });
      const late = b.events.find((e) => e.r === r && (e.kind === 'rtd' || e.kind === 'doc'));
      if (late) add({ type: 'ex', dur: EX_DUR[late.kind], bi, r, e: late });
    });
    add({ type: 'result', dur: 3.4, bi });
  });
  add({ type: 'final', dur: 2.8, bi: match.bouts.length - 1 });
  return { beats, total: t };
}

// Where the fighters are and what they're doing at time u into one beat.
function neutralPose() { return { lean: 6, crouch: 0.2 }; }
function fightFrame(beat, u) {
  const P = [neutralPose(), neutralPose()];
  const X = [38, 62];
  const out = { x: X, pose: P, ref: { x: 88, count: null, wave: false, between: false }, banner: null, impact: null, ground: null };
  const sway = (k) => Math.sin(u * 5 + k * 2.1) * 1.2;
  if (beat.type === 'intro' || beat.type === 'final' || beat.type === 'walk') { X[0] = 18; X[1] = 82; return out; }
  if (beat.type === 'rstart') { const k = easeF(u / beat.dur); X[0] = lerpN(18, 38, k); X[1] = lerpN(82, 62, k); out.ref.x = lerpN(50, 88, k); out.banner = 'ROUND ' + beat.r; return out; }
  if (beat.type === 'rend') { const k = easeF(u / 0.9); X[0] = lerpN(40, 16, k); X[1] = lerpN(60, 84, k); out.ref.x = lerpN(88, 50, k); return out; }
  if (beat.type === 'result') { X[0] = 40; X[1] = 60; out.ref.x = 50; return out; }
  const e = beat.e; const s = e.s == null ? 0 : e.s; const o = 1 - s; const dir = s === 0 ? 1 : -1;
  const kind = exKind(e);
  X[0] = 38 + sway(0); X[1] = 62 + sway(1);
  // Ground work: the fighter on the bottom lies down, the other kneels on top.
  if (e.kind === 'gnp' || e.kind === 'subatt' || e.kind === 'sub' || e.kind === 'sweep' || e.kind === 'standup') {
    let top = e.pos ? e.pos.top : s; if (e.kind === 'sweep' || e.kind === 'standup') top = o;
    let bot = 1 - top; const bx = top === 0 ? 58 : 42; // bottom fighter's feet
    const lieDir = bot === 0 ? 1 : -1;
    const kneelX = bx - lieDir * 9;
    X[bot] = bx; X[top] = kneelX;
    P[bot] = { lie: 1, lean: 0 }; P[top] = { kneel: 1, lean: 34 };
    if (e.kind === 'gnp') { P[top].gnp = Math.abs(Math.sin(u * 9)); if (Math.sin(u * 9) > 0.9) out.impact = { x: bx - lieDir * 18, y: RING_FLOOR - 2 }; out.banner = u > 0.6 ? (e.kind === 'gnp' && /stop/i.test(e.text) ? 'STOPPED!' : 'GROUND & POUND') : null; if (/referee/i.test(e.text) && u > beat.dur - 1.4) { out.ref.x = (X[0] + X[1]) / 2; out.ref.between = true; out.banner = 'STOPPED!'; } }
    else if (e.kind === 'subatt' || e.kind === 'sub') {
      P[top].lean = 60; P[top].squeeze = 0.5 + 0.5 * Math.sin(u * 3);
      const nm = String(e.sub || '').toUpperCase();
      out.banner = u < 1.4 ? nm + '!' : e.kind === 'sub' ? (u < beat.dur - 1.2 ? 'TAP! TAP!' : 'SUBMISSION!') : 'ESCAPES!';
      if (e.kind === 'sub' && u > 1.4) { P[bot].tap = Math.abs(Math.sin(u * 14)); out.ref.x = (X[0] + X[1]) / 2 + 4; if (u > beat.dur - 1.2) out.ref.between = true; }
      if (e.kind === 'subatt' && u > 1.6) { P[top].squeeze = 0; P[bot].lean = 0; }
    } else if (e.kind === 'sweep') {
      const k = easeF((u - 0.4) / 1.0);
      if (k > 0.5) { const nb = 1 - bot; P[nb] = { lie: 1 }; P[bot] = { kneel: 1, lean: 34 }; X[nb] = bx; X[bot] = kneelX; bot = nb; }
      out.banner = k > 0.4 ? 'SWEEP!' : null;
    } else if (e.kind === 'standup') {
      const k = easeF(u / 1.2);
      P[bot] = { lie: 1 - k, lean: 0, crouch: 0.4 * (1 - k) }; P[top] = { kneel: k < 0.6 ? 1 : 0, lean: lerpN(34, 6, k) };
      X[bot] = lerpN(bx, bot === 0 ? 38 : 62, k); X[top] = lerpN(kneelX, top === 0 ? 38 : 62, k);
    }
    return out;
  }
  if (kind === 'rtd' || kind === 'doc') { X[0] = 16; X[1] = 84; P[o] = { lean: -2, crouch: 0.5 }; out.banner = kind === 'rtd' ? 'TOWEL IN!' : 'DOCTOR STOPS IT'; if (u > 1.2) P[s].raise = 1; return out; }
  // Standing exchanges.
  const A = 0.7; // approach ends
  const close = easeF(u / A);
  X[s] = lerpN(X[s], X[o] - dir * 12.5, close);
  P[s] = { lean: 10, crouch: 0.25 + Math.abs(Math.sin(u * 7)) * 0.08 };
  P[o] = { lean: 4, crouch: 0.2 };
  const hitAt = (k) => { out.impact = { x: X[o] - dir * 0.5, y: RING_FLOOR - 21.5 + (e.type === 'body' || e.type === 'bodykick' ? 7 : e.type === 'legkick' ? 16 : 0), k }; };
  if (kind === 'td' || kind === 'tdstuff') {
    const k = easeF((u - 0.5) / 0.8);
    P[s] = { lean: lerpN(10, 55, k), crouch: lerpN(0.25, 1, k) };
    X[s] = lerpN(X[s], X[o] - dir * 6, k);
    if (kind === 'td') {
      const f = easeF((u - 1.1) / 0.7);
      if (u > 1.1) { P[o] = { fall: f, lean: -10 }; X[o] = X[o] + dir * f * 3; }
      if (u > 1.8) { P[o] = { lie: 1 }; P[s] = { kneel: 1, lean: 34 }; X[s] = X[o] - dir * 9; }
      out.banner = u > 1.1 ? 'TAKEDOWN!' : null;
    } else { if (u > 1.0) { P[o] = { lean: 50, crouch: 0.9 }; out.banner = 'STUFFED!'; } if (u > 1.6) { const b2 = easeF((u - 1.6) / 0.5); P[s] = { lean: lerpN(55, 10, b2), crouch: 0.4 }; X[s] = lerpN(X[o] - dir * 6, X[o] - dir * 13, b2); } }
    return out;
  }
  // Counter: the other fighter throws first and misses.
  let strikeStart = 0.7;
  if (kind === 'counter') {
    const miss = (u - 0.6) / 0.45;
    if (miss > 0 && miss < 1) { P[o] = { lean: 16, rear: Math.sin(miss * Math.PI), punch: 'cross' }; P[s] = { lean: -14, crouch: 0.55 }; }
    strikeStart = 1.05;
  }
  const kick = e.type === 'legkick' ? 'leg' : e.type === 'bodykick' ? 'body' : e.type === 'headkick' || (e.type === 'spin' && /kick/i.test(e.text)) ? 'head' : null;
  const sk = (u - strikeStart) / (e.type === 'combo' ? 0.9 : 0.42);
  if (sk > 0 && sk < 1) {
    if (kick) P[s] = { lean: -12, kick, kickExt: Math.sin(sk * Math.PI) };
    else if (e.type === 'combo') { const n = Math.max(3, e.n || 3); const ph = sk * n; const i = Math.floor(ph); const v = Math.sin((ph - i) * Math.PI); const arm = i % 2 === 0 ? 'lead' : 'rear'; P[s] = { lean: 14, crouch: 0.3, [arm]: v, punch: i % 3 === 2 ? (arm === 'lead' ? 'hook' : 'upper') : arm === 'lead' ? 'jab' : 'cross' }; if (v > 0.85) hitAt(sk); P[o] = { lean: -4, cover: 1 }; }
    else { const pt = e.type === 'jab' ? 'jab' : e.type === 'body' ? 'body' : e.type === 'knee' ? 'knee' : e.type === 'spin' ? 'hook' : /hook/i.test(e.text) ? 'hook' : /uppercut/i.test(e.text) ? 'upper' : 'cross'; const arm = pt === 'jab' || pt === 'hook' ? 'lead' : 'rear'; P[s] = { lean: pt === 'body' ? 24 : 16, crouch: pt === 'body' ? 0.55 : 0.3, [arm]: Math.sin(sk * Math.PI), punch: pt, knee: pt === 'knee' ? Math.sin(sk * Math.PI) : 0 }; }
    if (!kick && e.type !== 'combo' && sk > 0.45 && sk < 0.75) hitAt(sk);
    if (kick && sk > 0.45 && sk < 0.75) hitAt(sk);
  }
  const after = u - (strikeStart + (e.type === 'combo' ? 0.9 : 0.42) * 0.55); // seconds since impact
  if (after > 0) {
    const snap = Math.max(0, 1 - after / 0.5);
    P[o] = { ...P[o], lean: -18 * snap + 2 };
    if (after < 0.45) out.flash = true;
    const backK = easeF((after - 0.6) / 0.6);
    if (kind === 'land' || kind === 'counter') { X[s] = lerpN(X[s], s === 0 ? 38 : 62, backK); }
    if (kind === 'rock') { P[o] = { lean: Math.sin(after * 6) * 14, crouch: 0.45 + Math.sin(after * 4) * 0.15, wobble: Math.sin(after * 9) }; X[o] += Math.sin(after * 3) * 1.5; out.banner = after > 0.3 ? 'HURT!' : null; }
    if (kind === 'kd' || kind === 'ko') {
      const fall = easeF(after / 0.55);
      const cnt = e.count || 0;
      const countStart = 1.0, step = (beat.dur - countStart - (e.up ? 1.0 : 0.9)) / Math.max(1, cnt);
      const c = Math.floor((after - countStart) / step) + 1;
      const counting = after > countStart && c <= cnt;
      const rising = e.up && after > countStart + cnt * step;
      P[o] = { fall: rising ? 1 - easeF((after - countStart - cnt * step) / 0.6) : fall, lean: -8 };
      X[s] = lerpN(X[s], s === 0 ? 30 : 70, easeF((after - 0.4) / 0.6)); P[s] = { lean: 4, crouch: 0.1 };
      if (e.pos === null && e.up && /jumps on top/.test(e.text)) { /* MMA knockdown survived: they end up on the mat */ }
      if (counting || rising || (!e.up && after > countStart)) out.ref = { x: X[o] - dir * 4, count: counting ? Math.min(c, cnt) : !e.up ? 10 : null, wave: !e.up && c > cnt, between: false };
      out.banner = after < 0.3 ? null : !e.up && (c > cnt || !cnt) ? 'KNOCKOUT!' : rising ? 'BACK UP!' : kind === 'kd' ? 'DOWN!' : 'DOWN!';
      if (!e.up && after > countStart + cnt * step) P[s] = { raise: 1 };
      if (/jumps on top/.test(e.text) && after > 1.2) { P[o] = { lie: 1 }; P[s] = { kneel: 1, lean: 34 }; X[s] = X[o] - dir * 9; out.ref.count = null; out.banner = 'SURVIVES!'; }
    }
    if (kind === 'tko') { P[o] = { lean: -6, crouch: 0.6, cover: 1, wobble: Math.sin(after * 9) }; if (after > 0.6) { out.ref = { x: (X[0] + X[1]) / 2, count: null, between: true }; out.banner = 'STOPPED!'; } if (after > 1.4) P[s] = { raise: 1 }; if (/Third knockdown/.test(e.text)) P[o] = { fall: easeF(after / 0.5) }; }
  }
  return out;
}

// One fighter. Local coordinates face right with the feet at (0,0).
function FighterFig({ x, face, p, color, mma, name, isRef }) {
  const pz = p || {};
  const kneel = pz.kneel; const c = pz.crouch || 0;
  const hipY = kneel ? -6.2 : -11 + c * 2.4;
  const ln = ((pz.lean || 0) * Math.PI) / 180;
  const H = { x: 0, y: hipY };
  const S = { x: H.x + Math.sin(ln) * 8.2, y: H.y - Math.cos(ln) * 8.2 };
  const Hd = { x: S.x + Math.sin(ln) * 3.1 + 0.4, y: S.y - Math.cos(ln) * 3.1 };
  const legs = [];
  if (kneel) { legs.push([H, { x: 2.8, y: -0.8 }, { x: -1.2, y: -0.4 }]); legs.push([H, { x: -1.6, y: -0.8 }, { x: -5, y: -0.3 }]); }
  else if (pz.kick) {
    const tgt = pz.kick === 'leg' ? { x: 8.5, y: -4 } : pz.kick === 'body' ? { x: 9.5, y: -12 } : { x: 8.5, y: -20 };
    const ft = { x: lerpN(3.6, tgt.x, pz.kickExt || 0), y: lerpN(0, tgt.y, pz.kickExt || 0) };
    legs.push([H, { x: -1, y: hipY / 2 }, { x: -2.4, y: 0 }]);
    legs.push([H, { x: (H.x + ft.x) / 2 + 0.5, y: (H.y + ft.y) / 2 - 1 }, ft]);
  } else {
    const kn = pz.knee || 0;
    legs.push([H, { x: -1.4, y: hipY / 2 }, { x: -3.4, y: 0 }]);
    legs.push([H, { x: 2.2 + c + kn * 3, y: hipY / 2 - kn * 4 }, { x: 3.6 + kn * 1, y: -kn * 5 }]);
  }
  const guardL = pz.cover ? { x: S.x + 2.6, y: S.y - 2.6 } : { x: S.x + 3.3, y: S.y - 0.6 };
  const guardR = pz.cover ? { x: S.x + 2.1, y: S.y - 1.6 } : { x: S.x + 2.2, y: S.y + 0.4 };
  const T = { jab: { x: S.x + 9.5, y: S.y - 0.6 }, cross: { x: S.x + 9.8, y: S.y - 0.4 }, hook: { x: S.x + 6.8, y: S.y - 1.6 }, upper: { x: S.x + 6.2, y: S.y - 3.8 }, body: { x: S.x + 7.6, y: S.y + 4.4 }, knee: { x: S.x + 4, y: S.y + 2 } };
  let hL = guardL, hR = guardR;
  if (pz.raise) { hL = { x: S.x + 1.5, y: S.y - 7.5 }; hR = { x: S.x - 1.5, y: S.y - 7.5 }; }
  else if (pz.gnp != null && kneel) { hR = { x: lerpN(S.x + 2, S.x + 5, pz.gnp), y: lerpN(S.y - 2, S.y + 7, pz.gnp) }; hL = { x: S.x + 4, y: S.y + 4 }; }
  else if (pz.squeeze != null && kneel) { hL = { x: S.x + 4 + pz.squeeze, y: S.y + 3 }; hR = { x: S.x + 3, y: S.y + 3.5 }; }
  else {
    if (pz.lead) hL = { x: lerpN(guardL.x, (T[pz.punch] || T.jab).x, pz.lead), y: lerpN(guardL.y, (T[pz.punch] || T.jab).y, pz.lead) };
    if (pz.rear) hR = { x: lerpN(guardR.x, (T[pz.punch] || T.cross).x, pz.rear), y: lerpN(guardR.y, (T[pz.punch] || T.cross).y, pz.rear) };
  }
  if (pz.tap) hL = { x: S.x + 3, y: S.y + 1 + pz.tap * 2 };
  const elbow = (h, up) => ({ x: (S.x + h.x) / 2 - 0.3, y: (S.y + h.y) / 2 + (up ? -1.4 : 1.5) });
  const rot = pz.lie ? -90 * pz.lie : pz.fall ? -88 * pz.fall : 0;
  const lift = pz.lie || pz.fall ? -1.4 * (pz.lie || pz.fall) : 0;
  const line = (pts) => 'M' + pts.map((q) => q.x.toFixed(2) + ' ' + q.y.toFixed(2)).join(' L');
  const dark = 'rgba(15,12,33,.85)';
  const glove = isRef ? null : mma ? 1.05 : 1.6;
  const wob = pz.wobble ? ' rotate(' + (pz.wobble * 3).toFixed(1) + ')' : '';
  return (
    <g transform={'translate(' + x.toFixed(2) + ' ' + RING_FLOOR + ') scale(' + face + ' 1)'}>
      <ellipse cx="0" cy="0.4" rx={pz.lie ? 12 : 5.5} ry="0.9" fill="rgba(0,0,0,.28)" />
      <g transform={'translate(0 ' + lift.toFixed(2) + ') rotate(' + rot.toFixed(1) + ')' + wob}>
        <path d={line(legs[0])} stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".78" />
        <path d={line([S, elbow(hR, pz.punch === 'upper'), hR])} stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".78" />
        {glove && <circle cx={hR.x} cy={hR.y} r={glove} fill={mma ? '#1d1d24' : '#f4f1ea'} stroke={dark} strokeWidth=".35" />}
        <path d={line([H, S])} stroke={color} strokeWidth="4.4" strokeLinecap="round" fill="none" />
        <path d={line([H, S])} stroke="rgba(255,255,255,.18)" strokeWidth="1.2" strokeLinecap="round" fill="none" transform="translate(-0.9 0)" />
        {!isRef && <rect x={H.x - 2.4} y={H.y - 1.2} width="4.8" height="3.4" rx="1" fill="#1d1d24" transform={'rotate(' + (-(pz.lean || 0) * 0.3).toFixed(1) + ' ' + H.x + ' ' + H.y + ')'} />}
        {!isRef && <rect x={H.x - 2.4} y={H.y - 1.4} width="4.8" height="0.8" fill={color} />}
        {isRef && <rect x={H.x - 2.3} y={H.y - 1} width="4.6" height="2.6" rx="0.8" fill="#1d1d24" />}
        <circle cx={Hd.x} cy={Hd.y} r="2.6" fill={color} stroke={dark} strokeWidth=".4" />
        <path d={line(legs[1])} stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d={line([S, elbow(hL, pz.punch === 'hook'), hL])} stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {glove && <circle cx={hL.x} cy={hL.y} r={glove} fill={mma ? '#1d1d24' : '#f4f1ea'} stroke={dark} strokeWidth=".35" />}
      </g>
      {name && !pz.lie && <text transform={'scale(' + face + ' 1)'} x="0" y={(pz.fall ? -6 : hipY - 17)} textAnchor="middle" fontSize="2.6" fontWeight="800" fill="#fff" stroke="#0f0c21" strokeWidth="0.5" paintOrder="stroke">{name}</text>}
    </g>
  );
}

function RingStage({ mma, t, children }) {
  const crowd = useMemo(() => Array.from({ length: 70 }, (_, i) => ({ x: unit('cx', i) * 100, y: 3 + unit('cy', i) * 13, r: 0.7 + unit('cr', i) * 0.6, c: ['#3a335c', '#4a3f6b', '#2d2849', '#56497a'][i % 4] })), []);
  return (
    <>
      <defs>
        <radialGradient id="ringspot" cx="50%" cy="40%" r="60%"><stop offset="0" stopColor="rgba(255,244,214,.35)" /><stop offset="1" stopColor="rgba(255,244,214,0)" /></radialGradient>
        <pattern id="cagelink" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.4" height="2.4" fill="none" stroke="rgba(200,205,215,.35)" strokeWidth="0.25" /></pattern>
      </defs>
      <rect x="0" y="0" width="100" height="56" fill="#141026" />
      {crowd.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.c} opacity={0.6 + 0.4 * Math.sin(t * 2 + i)} />)}
      {crowd.slice(0, 6).map((p, i) => (Math.sin(t * 3.3 + i * 7) > 0.97 ? <circle key={'f' + i} cx={p.x} cy={p.y} r="0.9" fill="#fff" /> : null))}
      <rect x="0" y="0" width="100" height="56" fill="url(#ringspot)" />
      {mma ? (
        <g>
          <rect x="3" y="14" width="94" height={RING_FLOOR - 14} fill="url(#cagelink)" />
          {[3, 26, 50, 74, 97].map((x) => <rect key={x} x={x - 0.6} y="13" width="1.2" height={RING_FLOOR - 13} fill="#22232b" />)}
          <rect x="3" y="13" width="94" height="1.2" fill="#22232b" />
          <path d={'M4 ' + RING_FLOOR + ' L96 ' + RING_FLOOR + ' L100 52 L0 52 Z'} fill="#e4e2dc" />
          <ellipse cx="50" cy="48" rx="13" ry="2.6" fill="none" stroke="rgba(226,70,59,.55)" strokeWidth="0.5" />
          <text x="50" y="49" textAnchor="middle" fontSize="2.4" fontWeight="900" fill="rgba(226,70,59,.55)" letterSpacing=".3">DRAFT NIGHT</text>
          <rect x="0" y="52" width="100" height="4" fill="#22232b" />
        </g>
      ) : (
        <g>
          <path d={'M6 ' + RING_FLOOR + ' L94 ' + RING_FLOOR + ' L100 52 L0 52 Z'} fill="#e9e4d8" />
          <path d={'M6 ' + RING_FLOOR + ' L94 ' + RING_FLOOR} stroke="rgba(0,0,0,.12)" strokeWidth="0.4" />
          <text x="50" y="49.4" textAnchor="middle" fontSize="2.6" fontWeight="900" fill="rgba(31,59,143,.35)" letterSpacing=".4">DRAFT NIGHT</text>
          <rect x="0" y="52" width="100" height="4" fill="#1f3b8f" />
          {[6, 94].map((x) => <rect key={x} x={x - 0.8} y="20" width="1.6" height={RING_FLOOR - 20} fill="#c9c2b2" stroke="rgba(0,0,0,.3)" strokeWidth=".2" />)}
          {[23, 29, 35].map((y, i) => <line key={y} x1="6" y1={y} x2="94" y2={y} stroke={['#e2463b', '#f4f1ea', '#3d6be2'][i]} strokeWidth="0.55" opacity=".9" />)}
        </g>
      )}
      {children}
      {!mma && <g opacity=".85">{[31, 38].map((y, i) => <line key={y} x1="0" y1={y + 6} x2="100" y2={y + 6} stroke={['#e2463b', '#3d6be2'][i]} strokeWidth="0.6" opacity=".55" />)}<rect x="-0.4" y="26" width="1.8" height="26" fill="#c9c2b2" /><rect x="98.6" y="26" width="1.8" height="26" fill="#c9c2b2" /></g>}
    </>
  );
}

function RingView({ d, A, B, match, speed, commentary, onDone, label }) {
  const script = useMemo(() => fightScript(match), [match]);
  const base = speed === 'fast' ? 2 : 1;
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
  useEffect(() => { if (done && !fired.current) { fired.current = true; audio.play('bell'); onDone && onDone(); } }, [done]);
  const bi = Math.max(0, script.beats.findIndex((b) => t < b.t0 + b.dur));
  const beat = done ? script.beats[script.beats.length - 1] : script.beats[bi];
  const u = done ? beat.dur : t - beat.t0;
  const uq = reduced && !done ? Math.floor(u / 0.5) * 0.5 : u;
  const bout = match.bouts[Math.min(match.bouts.length - 1, beat.bi)];
  const mma = bout.disc === 'mma';
  const fr = fightFrame(beat, uq);
  // Card score: bouts already decided.
  const decided = (k) => (k < beat.bi || (k === beat.bi && (beat.type === 'result' && u > 0.8))) || beat.type === 'final' || done;
  const cardScore = [0, 1].map((s) => match.bouts.filter((b, k) => decided(k) && b.winner === s).length);
  // Fight stats so far (completed rounds of this bout).
  const roundsDone = bout.rounds.filter((rd) => rd.r < (beat.r || 0) || (rd.r === beat.r && (beat.type === 'rend' && u > 0.6)) || beat.type === 'result' || (beat.type === 'final' || done));
  const sumOf = (k, s) => roundsDone.reduce((n, rd) => n + rd.rs[s][k], 0);
  const clock = beat.type === 'ex' ? fightClock(beat.e.t) : beat.type === 'rend' ? fightClock(bout.len || 180) : '0:00';
  const status = done || beat.type === 'final' ? 'FINAL' : beat.type === 'intro' ? 'FIGHT NIGHT' : beat.type === 'walk' ? (bout.superFight ? 'SUPER FIGHT' : bout.main ? 'MAIN EVENT' : 'BOUT ' + (beat.bi + 1)) : beat.type === 'result' ? 'RESULT' : 'R' + beat.r + ' ' + clock;
  const sides = [bout.a, bout.b];
  const colors = [A.color, B.color];
  const short = (n) => { if (!n) return ''; const w = n.split(' '); const s2 = w[w.length - 1]; return s2.length > 11 ? s2.slice(0, 10) + '.' : s2; };
  // Sounds in step.
  const lastBeat = useRef(-1);
  useEffect(() => {
    if (!playing || done || bi === lastBeat.current) return;
    lastBeat.current = bi;
    if (beat.type === 'rstart' || beat.type === 'rend') audio.play('bell');
    if (beat.type === 'walk') audio.play('drumroll');
    if (beat.type === 'result') audio.play('cheer');
  }, [bi]);
  const hitRef = useRef(null);
  const said = useRef({});
  useEffect(() => {
    if (!playing || done || !fr.impact) return;
    const key = bi + ':' + Math.round(u * 4);
    if (hitRef.current === key) return; hitRef.current = key;
    audio.play('punch');
    if (beat.type === 'ex' && (beat.e.kind === 'ko' || beat.e.kind === 'kd') && !said.current[bi]) { said.current[bi] = true; audio.say((beat.e.kind === 'ko' ? 'Down goes ' : 'Down goes ') + beat.e.b + '!', 2, d.id + ':' + label + ':f' + bi); }
  }, [t]);
  // Commentary feed.
  const feed = [];
  script.beats.forEach((b, k) => {
    if (!done && b.t0 + Math.min(b.dur * 0.55, 1.4) > t) return;
    const bo = match.bouts[b.bi];
    if (b.type === 'walk') feed.push({ k, tag: bo.superFight ? 'SUPER' : bo.main ? 'MAIN' : 'B' + (b.bi + 1), text: (bo.superFight ? 'Super fight: ' : (bo.disc === 'mma' ? '🥋 ' : '🥊 ') + (bo.disc === 'mma' ? 'UFC' : 'Boxing') + ', ' + bo.R + ' rounds: ') + (bo.a ? bo.a.name : '—') + ' vs ' + (bo.b ? bo.b.name : '—'), half: true });
    else if (b.type === 'ex') feed.push({ k, tag: 'R' + b.r, text: b.e.text, team: b.e.s, big: b.e.big });
    else if (b.type === 'rend' && b.e.judge) {
      const rs = b.e.rs; const j = b.e.judge; const w0 = j.filter((x) => x[0] > x[1]).length, w1 = j.filter((x) => x[1] > x[0]).length;
      const who = w0 > w1 ? bo.a.name : w1 > w0 ? bo.b.name : null;
      feed.push({ k, tag: 'R' + b.r, text: 'End of round ' + b.r + ': ' + short(bo.a.name) + ' landed ' + rs[0].landed + ', ' + short(bo.b.name) + ' ' + rs[1].landed + (rs[0].td + rs[1].td ? ' · takedowns ' + rs[0].td + '–' + rs[1].td : '') + '. Judges: ' + j.map((x) => x[0] + '–' + x[1]).join(', ') + (who ? ' (' + who + ')' : ''), run: true });
    } else if (b.type === 'result') feed.push({ k, tag: '🏆', text: boutLine(bo), team: bo.winner, big: true });
  });
  const feedRef = useRef(null);
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; }, [feed.length]);
  const nextBout = () => { const nb = script.beats.find((b) => b.type === 'walk' && b.t0 > t + 0.01); setT(nb ? nb.t0 : script.total); };
  // Result screen inside the ring.
  const resultText = beat.type === 'result' ? (bout.winner == null ? 'DRAW' : (bout.winner === 0 ? bout.a : bout.b).name.toUpperCase()) : null;
  if (beat.type === 'result' && bout.winner != null) { fr.pose[bout.winner] = { raise: 1 }; fr.ref = { x: 50, count: null, raiseFor: bout.winner }; }
  const bannerNow = done ? null : beat.type === 'intro' ? 'FIGHT NIGHT' : beat.type === 'walk' ? (bout.superFight ? 'SUPER FIGHT' : bout.main ? 'MAIN EVENT' : 'BOUT ' + (beat.bi + 1)) : beat.type === 'rend' && u > 0.5 ? 'END OF ROUND ' + beat.r : beat.type === 'final' ? 'FINAL' : fr.banner;
  const refPose = fr.ref.raiseFor != null ? { raise: 0 } : fr.ref.wave ? { lead: Math.abs(Math.sin(u * 8)), punch: 'hook', lean: 0 } : fr.ref.between ? { lead: 1, rear: 1, punch: 'jab', lean: 4 } : { lean: 0 };
  return (
    <div className="matchview ringview">
      <div className="scoreboard">
        <div className="sb-team"><Badge m={A} /><span className="sb-n">{A.name}</span></div>
        <div className="sb-mid">
          <span className="sb-score num" aria-live="polite">{cardScore[0]}–{cardScore[1]}</span>
          <span className="sb-clock num">{status}</span>
        </div>
        <div className="sb-team"><Badge m={B} /><span className="sb-n">{B.name}</span></div>
      </div>
      <div className="boutbar small"><b>{bout.a ? bout.a.name : '—'}</b> <span className="muted">vs</span> <b>{bout.b ? bout.b.name : '—'}</b> <span className="muted">· {mma ? 'UFC' : 'Boxing'} · {bout.R} rounds{bout.main && !bout.superFight ? ' · main event' : ''}</span>
        {bout.method !== 'WO' && <span className="num boutstats"> Landed {sumOf('landed', 0)}–{sumOf('landed', 1)} · Knockdowns {sumOf('kd', 0)}–{sumOf('kd', 1)}{mma ? ' · Takedowns ' + sumOf('td', 0) + '–' + sumOf('td', 1) : ''}</span>}
      </div>
      <div className="pitchwrap">
        <svg className="pitchsvg ringsvg" viewBox="0 0 100 56" role="img" aria-label={'Fight: ' + (bout.a ? bout.a.name : '') + ' versus ' + (bout.b ? bout.b.name : '') + ', ' + status}>
          <RingStage mma={mma} t={t}>
            {beat.type !== 'intro' && beat.type !== 'final' && (() => { const rp = refPose; return <g opacity=".95"><FighterFig x={fr.ref.x} face={fr.ref.x > 50 ? -1 : 1} p={rp} color="#cfd6e4" isRef name={null} mma /></g>; })()}
            {[0, 1].map((s) => sides[s] && beat.type !== 'intro' && beat.type !== 'final' ? <FighterFig key={s} x={fr.x[s]} face={s === 0 ? 1 : -1} p={fr.pose[s]} color={colors[s]} mma={mma} name={short(sides[s].name)} /> : null)}
            {fr.impact && <g transform={'translate(' + fr.impact.x.toFixed(2) + ' ' + fr.impact.y.toFixed(2) + ')'}><path d="M0 -3.2 L0.9 -0.9 L3.2 0 L0.9 0.9 L0 3.2 L-0.9 0.9 L-3.2 0 L-0.9 -0.9 Z" fill="#ffd23d" stroke="#fff" strokeWidth=".3" /></g>}
            {fr.ref.count != null && <text x={fr.ref.x + (fr.ref.x > 50 ? 6 : -6)} y="27" textAnchor="middle" fontSize="7" fontWeight="900" fill="#fff" stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke" className="pbanner">{fr.ref.count}</text>}
          </RingStage>
          {(beat.type === 'intro' || beat.type === 'walk') && (
            <g>
              <rect x="0" y="0" width="100" height="56" fill="rgba(15,12,33,.55)" />
              {beat.type === 'walk' && bout.a && bout.b && [0, 1].map((s) => { const f = sides[s]; const k = easeF(u / 0.8); return (
                <g key={s} transform={'translate(' + (s === 0 ? lerpN(-30, 22, k) : lerpN(130, 78, k)) + ' 30)'}>
                  <text textAnchor="middle" fontSize="4.2" fontWeight="900" fill={colors[s]} stroke="#0f0c21" strokeWidth="0.5" paintOrder="stroke">{f.name.toUpperCase().slice(0, 18)}</text>
                  <text y="5" textAnchor="middle" fontSize="2.6" fontWeight="700" fill="#fff">{f.styleWord}{numbersShown() ? ' · ' + eraWord(d.topic) + ' ' + f.ovr + ' est.' : ''}</text>
                </g>
              ); })}
              {beat.type === 'walk' && <text x="50" y="31" textAnchor="middle" fontSize="5" fontWeight="900" fill="#ffc83d">VS</text>}
              {beat.type === 'intro' && match.bouts.map((b, k) => <text key={k} x="50" y={26 + k * 4.4} textAnchor="middle" fontSize="2.8" fontWeight="700" fill="#fff">{(b.superFight ? '' : (b.disc === 'mma' ? 'UFC' : 'BOXING') + ' · ')}{b.a ? short(b.a.name) : '—'} vs {b.b ? short(b.b.name) : '—'}</text>).filter((_, k) => !match.bouts[k].superFight)}
            </g>
          )}
          {beat.type === 'result' && <g><rect x="0" y="0" width="100" height="14" fill="rgba(15,12,33,.7)" /><text x="50" y="7" textAnchor="middle" fontSize="4.6" fontWeight="900" fill="#ffc83d" stroke="#0f0c21" strokeWidth="0.5" paintOrder="stroke">{resultText}</text><text x="50" y="11.6" textAnchor="middle" fontSize="2.8" fontWeight="700" fill="#fff">{boutShort(bout)}</text></g>}
          {(done || beat.type === 'final') && <g><rect x="0" y="0" width="100" height="56" fill="rgba(15,12,33,.6)" /><text x="50" y="22" textAnchor="middle" fontSize="3.4" fontWeight="800" fill="#fff">FIGHT CARD</text><text x="50" y="32" textAnchor="middle" fontSize="7" fontWeight="900" fill={match.winner === 0 ? A.color : B.color} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke">{(match.winner === 0 ? A : B).name.toUpperCase().slice(0, 16)} WIN</text><text x="50" y="40" textAnchor="middle" fontSize="5" fontWeight="900" fill="#ffc83d" className="num">{match.score[0]}–{match.score[1]}</text></g>}
          {bannerNow && beat.type !== 'result' && <text x="50" y={beat.type === 'walk' ? 15 : 12} textAnchor="middle" fontSize={bannerNow.length > 13 ? 5.2 : 7} fontWeight="900" fill={/KNOCK|DOWN|STOPPED|TAP|SUBMISSION|HURT|TOWEL|DOCTOR/.test(bannerNow) ? '#ffc83d' : '#fff'} stroke="#0f0c21" strokeWidth="0.6" paintOrder="stroke" className="pbanner">{bannerNow}</text>}
        </svg>
      </div>
      <div className="mctrl" role="group" aria-label="Fight controls">
        {!done && <button className="btn btn-sm" onClick={() => setPlaying((x) => !x)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸ Pause' : '▶ Play'}</button>}
        {!done && [1, 2, 4].map((x) => <button key={x} className={'btn btn-sm' + (mult === x ? ' btn-gold' : '')} aria-pressed={mult === x} onClick={() => setMult(x)}>{x}×</button>)}
        {!done && <button className="btn btn-sm btn-ghost" onClick={nextBout}>Next bout</button>}
        {!done && <button className="btn btn-sm btn-ghost" onClick={() => setT(script.total)}>Skip to result</button>}
        {done && <button className="btn btn-sm" onClick={() => { fired.current = true; said.current = {}; setT(0); setPlaying(true); }}>↺ Watch again</button>}
      </div>
      <div className="mfeed" ref={feedRef} aria-live="polite">
        {feed.map((e) => (
          <p key={e.k} className={'mev ' + (e.big ? 'goal' : e.half ? 'half' : '') + (e.team != null ? ' t' + e.team : '')}>
            <span className="mm num">{e.tag}</span>
            <span>{e.big ? '💥 ' : e.run ? '🔔 ' : ''}{e.text}</span>
          </p>
        ))}
      </div>
      {done && <FightSummary d={d} A={A} B={B} match={match} />}
    </div>
  );
}

function fightReport(d, A, B, match) {
  const T = [A, B];
  const real = match.bouts.filter((b) => b.method !== 'WO');
  const action = (b) => b.events.filter((e) => e.kind === 'kd' || e.kind === 'rock' || e.kind === 'subatt').length * 2 + b.events.filter((e) => e.counter).length + (b.method === 'DEC' && b.cards ? 3 - Math.min(3, Math.abs(b.cards[0][0] - b.cards[0][1])) : 0) + (b.endRound >= 3 && b.method !== 'DEC' ? 2 : 0);
  const fotn = real.slice().sort((x, y) => action(y) - action(x))[0] || null;
  const fin = real.filter((b) => b.winner != null && b.method !== 'DEC');
  const potn = fin.slice().sort((x, y) => ((x.endRound - 1) * x.len + x.endTime) - ((y.endRound - 1) * y.len + y.endTime))[0] || null;
  const fighters = match.bouts.flatMap((b) => [0, 1].map((s) => ({ s, f: s === 0 ? b.a : b.b, won: b.winner === s, b }))).filter((x) => x.f);
  const best = fighters.filter((x) => x.won).sort((x, y) => x.f.price - y.f.price)[0] || null;
  const flop = fighters.filter((x) => !x.won && x.b.winner != null).sort((x, y) => y.f.price - x.f.price)[0] || null;
  return { fotn, potn, best, flop, T };
}
function FightSummary({ d, A, B, match }) {
  const R = fightReport(d, A, B, match);
  const T = (i) => (i === 0 ? A : B);
  return (
    <div className="board msummary">
      <h3>🥊 Fight card</h3>
      <p className="small" style={{ margin: 0 }}><b>{A.name} {match.score[0]}–{match.score[1]} {B.name}</b>{match.how === 'super' ? ' · decided by the super fight' : ''}</p>
      <div className="fightcard">
        {match.bouts.map((b, k) => (
          <div key={k} className={'fc-row' + (b.main ? ' main' : '')}>
            <span className="fc-tag">{b.superFight ? '⭐ Super fight' : (b.main ? 'Main event · ' : '') + (b.disc === 'mma' ? 'UFC' : 'Boxing')}</span>
            <span className="fc-line small">{boutLine(b)}</span>
            {b.tot && <span className="fc-stats small muted num">Landed {b.tot[0].landed}–{b.tot[1].landed} · KD {b.tot[0].kd}–{b.tot[1].kd}{b.disc === 'mma' ? ' · TD ' + b.tot[0].td + '–' + b.tot[1].td : ''}</span>}
          </div>
        ))}
      </div>
      <div className="mreport">
        <h4>📋 Fight report</h4>
        {R.fotn && <p className="small"><b>🔥 Fight of the Night:</b> {R.fotn.a.name} vs {R.fotn.b.name} ({boutShort(R.fotn)}).</p>}
        {R.potn && <p className="small"><b>⚡ Performance of the Night:</b> {(R.potn.winner === 0 ? R.potn.a : R.potn.b).name} — {R.potn.method === 'SUB' ? R.potn.sub : METHOD_WORD[R.potn.method]} in round {R.potn.endRound}{R.potn.method === 'RTD' || R.potn.method === 'DOC' ? '' : ' (' + fightClock(R.potn.endTime) + ')'}.</p>}
        {R.best && <p className="small"><b>💰 Best buy:</b> {R.best.f.name} cost ${R.best.f.price} and won for {T(R.best.s).name}.</p>}
        {R.flop && <p className="small"><b>📉 Rough night:</b> {R.flop.f.name} cost ${R.flop.f.price} and lost.</p>}
      </div>
      <p className="hint" style={{ margin: 0 }}>Dream fights, pound-for-pound (no weight classes), simulated from Draft Night’s estimated {eraWord(d.topic)} numbers — not official ratings. Anyone can get caught, so upsets happen.</p>
    </div>
  );
}

// "Prime 94" chip on fighter cards; tap for the full card.
function FightChip({ item, topic }) {
  const [open, setOpen] = useState(false);
  if (!numbersShown()) return null;
  const r = fightRating(item, item.pos); const era = eraWord(topic);
  const keys = r.disc === 'box' ? FIGHT_ATTRS.filter((a) => a !== 'WRS' && a !== 'SUB') : FIGHT_ATTRS;
  return (
    <>
      <button type="button" className="ratingchip" onClick={() => setOpen(true)} aria-label={era + ' ' + r.ovr + ', estimated. Show details'}>{era} <b className="num">{r.ovr}</b> est.</button>
      {open && ReactDOM.createPortal(
        <Sheet center onClose={() => setOpen(false)}>
          <div className="ratingcard">
            <div className="rc-top"><span className="rc-ovr num"><small className="rc-era">{era}</small>{r.ovr}</span><span className="rc-role">{r.disc === 'mma' ? 'UFC' : 'BOX'}</span><span className="rc-name">{item.name}<br /><small>{r.styleWord}</small></span></div>
            <div className="rc-attrs">{keys.map((a) => <div key={a} className="rc-attr"><span className="k" title={FIGHT_ATTR_NAMES[a]}>{a}</span><span className="bar"><i style={{ width: r.attrs[a] + '%' }} /></span><span className="v num">{r.attrs[a]}</span></div>)}</div>
            <p className="hint" style={{ margin: 0 }}>{era === 'Now' ? 'Now: how good they are today. ' : 'Prime: how good they were at their peak. '}Draft Night estimate from fighting style and achievements, not an official rating.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
        </Sheet>, document.body)}
    </>
  );
}
