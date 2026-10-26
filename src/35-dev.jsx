/* ============================================================
   HIDDEN DEVELOPER MENU
   · How to open it: tap the "$20 AUCTION" tag on the home screen
     7 times quickly, or press and hold the Draft Night logo for
     3 seconds. Then enter the password.
   · The password only keeps players out of the menu. This is a static
     website, so anyone who reads the code could get past it — never
     put anything secret behind it.
   · Tools: a simulation lab (watch any sport's simulation straight
     away with random or star teams, no auction), "skip the auction"
     for a draft in progress, an animation/timer speed dial, a
     look at what's saved on this device, and changing the password.
   ============================================================ */
const DEV_KEYS = { pw: 'dn_dev_pw', on: 'dn_dev_on', speed: 'dn_dev_speed' };
const DEV_DEFAULT_HASH = 1272730669; // hash of the default password
const devHash = (s) => hashStr('dn-dev|' + String(s || ''));
const devGet = (k, store2) => { try { return (store2 || localStorage).getItem(k); } catch (e) { return null; } };
const devSet = (k, v, store2) => { try { if (v == null) (store2 || localStorage).removeItem(k); else (store2 || localStorage).setItem(k, v); } catch (e) {} };
const devCheck = (pw) => devHash(pw) === (+devGet(DEV_KEYS.pw) || DEV_DEFAULT_HASH);
const devUnlocked = () => devGet(DEV_KEYS.on, typeof sessionStorage !== 'undefined' ? sessionStorage : null) === '1';
// Animation and timer speed (1 = normal). Applied on load too.
function setDevSpeed(x) { const v = clamp(+x || 1, 0.25, 16); GAME_SPEED = 1 / v; devSet(DEV_KEYS.speed, v === 1 ? null : String(v)); return v; }
const devSpeed = () => Math.round((1 / GAME_SPEED) * 100) / 100;
if (typeof window !== 'undefined' && !window.__DN_TEST_SPEED) { const s0 = +devGet(DEV_KEYS.speed); if (s0 && s0 !== 1) GAME_SPEED = 1 / clamp(s0, 0.25, 16); }

// Secret gestures: n quick taps, or a long press.
function useSecretTaps(n, onOpen) {
  const hits = useRef([]);
  return () => { const now = Date.now(); hits.current = hits.current.filter((x) => now - x < 2500).concat(now); if (hits.current.length >= n) { hits.current = []; onOpen(); } };
}
function useLongPress(ms2, onOpen) {
  const timer = useRef(null);
  const start = () => { clearTimeout(timer.current); timer.current = setTimeout(onOpen, ms2); };
  const stop = () => clearTimeout(timer.current);
  useEffect(() => stop, []);
  return { onPointerDown: start, onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop, onContextMenu: (e) => e.preventDefault() };
}
function DevPassword({ onClose, onOk }) {
  const [pw, setPw] = useState(''); const [bad, setBad] = useState(false);
  const submit = (e) => { e.preventDefault(); if (devCheck(pw)) { devSet(DEV_KEYS.on, '1', sessionStorage); onOk(); } else { setBad(true); setPw(''); } };
  return (
    <Sheet center onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <h2 className="display" style={{ fontSize: 28 }}>🔒 Developer</h2>
        <input className="input" type="password" autoFocus autoComplete="off" aria-label="Password" placeholder="Password" value={pw} onChange={(e) => { setPw(e.target.value); setBad(false); }} />
        {bad && <p className="small" style={{ color: '#ff6b6b', margin: 0 }}>Wrong password.</p>}
        <button className="btn btn-gold" type="submit">Unlock</button>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
      </form>
    </Sheet>
  );
}

// Two teams for a topic: random, or the most famous players.
function devTeams(topic, mode, seed) {
  const rng = seeded('devteams', seed);
  const slots = topic.slots; const items = topic.items.slice();
  const score = (it) => (mode === 'stars' ? itemFame(it) * 10 + rng() : rng());
  const used = new Set();
  const make = (k, name, color, emoji, pickMode) => {
    const m = { id: 'dev' + k, name, color, emoji, team: slots.map(() => null), budget: 20 };
    const pool = items.filter((it) => !used.has(it.id)).sort((a, b) => (pickMode === 'stars' ? score(b) - score(a) : unit('dv', seed, k, a.id) - unit('dv', seed, k, b.id)));
    pool.forEach((it) => { const s = assignSlot(m, it, slots); if (s >= 0 && !m.team[s]) { m.team[s] = { itemId: it.id, price: 1 + Math.floor(rng() * 6) }; used.add(it.id); } });
    return m;
  };
  const A = make(0, mode === 'stars' || mode === 'starsrand' ? 'Stars' : 'Lions', COLORS[0], '⭐', mode === 'stars' || mode === 'starsrand' ? 'stars' : 'random');
  const B = make(1, mode === 'stars' ? 'All-Stars' : mode === 'starsrand' ? 'Randoms' : 'Sharks', COLORS[1], '🦈', mode === 'stars' ? 'stars' : 'random');
  return [A, B];
}
function devMatch(topic, mode, seed) {
  const [A, B] = devTeams(topic, mode, seed);
  const items = Object.fromEntries(topic.items.map((it) => [it.id, it]));
  const d = { id: 'dev', seed, topic, items, rules: { ...DEFAULT_RULES, slots: topic.slots, finale: { ...FINALE_DEFAULTS, mode: 'sim', speed: 'normal' } }, managers: [A, B], mode: 'local', createdAt: Date.now() };
  const t0 = performance.now();
  const match = isFootball(topic) ? simulateMatch(d, A, B, 'dev:' + seed, true) : simulateFor(d, A, B, 'dev:' + seed);
  return { d, A, B, match, ms: Math.round(performance.now() - t0), bytes: JSON.stringify(match).length };
}
// Skip the auction: every open slot gets a fitting player at a random price the team can afford.
function devAutoFill(d) {
  const n = JSON.parse(JSON.stringify(d));
  const rng = seeded('devfill', n.id, Date.now());
  const pool = [...n.queue, ...n.leftover].sort(() => rng() - 0.5);
  let changed = true;
  while (changed) {
    changed = false;
    for (const m of n.managers) {
      if (m.team.every(Boolean)) continue;
      const i = pool.findIndex((id) => assignSlot(m, n.items[id], n.rules.slots) >= 0);
      if (i < 0) continue;
      const id = pool.splice(i, 1)[0]; const s = assignSlot(m, n.items[id], n.rules.slots);
      const left = m.team.filter((x) => !x).length - 1;
      const price = clamp(1 + Math.floor(rng() * 5), n.rules.minBid || 1, Math.max(0, m.budget - left * (n.rules.minBid || 1)));
      const pay = Math.max(0, Math.min(m.budget, price));
      m.team[s] = { itemId: id, price: pay }; m.budget -= pay; changed = true;
      if (n.items[id].mystery) n.revealed = [...(n.revealed || []), id];
    }
  }
  n.queue = []; n.leftover = pool; n.processed = Object.keys(n.items).length; n.bid = null; n.bids = []; n.pending = null; n.trade = n.trade ? { ...n.trade, done: true } : n.trade;
  n.phase = 'done'; n.history = []; n.reveal = (n.reveal || 0) + 1;
  return n;
}

function DevScreen({ onBack, topics, draft, setDraft, goDraft, settings, setSettings }) {
  const simTopics = useMemo(() => topics.filter((t) => t.items.length && t.slots.length && (isFootball(t) || hasBattle(t))).sort((a, b) => a.name.localeCompare(b.name)), [topics]);
  const [tid, setTid] = useState(() => devGet('dn_dev_topic') || (simTopics[0] && simTopics[0].id));
  const [mode, setMode] = useState('random');
  const [seed, setSeed] = useState(() => 'dev' + Math.floor(Math.random() * 1e6));
  const [run, setRun] = useState(null);
  const [speed, setSpeedS] = useState(devSpeed());
  const [msg, setMsg] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [pw1, setPw1] = useState('');
  const topic = simTopics.find((t) => t.id === tid) || simTopics[0];
  const kindName = topic ? (isFootball(topic) ? (isPuppyBowl(topic) ? 'Puppy Bowl' : 'Football match') : battleKind(topic).name) : '';
  const start = (newSeed) => { if (!topic) return; const s = newSeed ? 'dev' + Math.floor(Math.random() * 1e6) : seed; if (newSeed) setSeed(s); devSet('dn_dev_topic', topic.id); try { setRun({ ...devMatch(topic, mode, s), k: Date.now() }); setMsg(null); } catch (e) { setRun(null); setMsg('Simulation crashed: ' + (e && e.message)); } };
  const lsRows = (() => { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); out.push([k, (localStorage.getItem(k) || '').length]); } } catch (e) {} return out.sort((a, b) => b[1] - a[1]); })();
  const copy = async (text, what) => { try { await navigator.clipboard.writeText(text); setMsg(what + ' copied.'); } catch (e) { setMsg('Copy failed — your browser blocked the clipboard.'); } };
  return (
    <div className="app devscreen">
      <div className="topbar"><button className="btn btn-sm btn-ghost" onClick={onBack} aria-label="Back">←</button><span className="title">🛠 Developer</span><button className="btn btn-sm btn-ghost" onClick={() => { devSet(DEV_KEYS.on, null, sessionStorage); onBack(); }}>Lock</button></div>
      <p className="hint" style={{ margin: 0 }}>Only you can see this. Changes here affect this device only. Version {(() => { try { const sEl = document.querySelector('script[src*="app.js"]'); const mm = sEl && sEl.src.match(/v=([\w]+)/); return mm ? mm[1] : '—'; } catch (e) { return '—'; } })()}.</p>
      {msg && <p className="small" style={{ margin: 0, color: 'var(--gold)' }}>{msg}</p>}

      <div className="card stack">
        <h3 style={{ margin: 0 }}>🎬 Simulation lab</h3>
        <p className="small muted" style={{ margin: 0 }}>Watch any simulation straight away — no auction.</p>
        <div className="field"><label htmlFor="dev-topic">Topic</label><select id="dev-topic" className="input" value={topic ? topic.id : ''} onChange={(e) => { setTid(e.target.value); setRun(null); }}>{simTopics.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.name} — {isFootball(t) ? 'football' : battleKind(t).name}</option>)}</select></div>
        <Seg label="Teams" value={mode} options={[['random', '🎲 Random v random'], ['starsrand', '⭐ Stars v random'], ['stars', '⭐ Stars v stars']]} onChange={(v) => { setMode(v); setRun(null); }} />
        <div className="row" style={{ gap: 8 }}><input className="input grow" aria-label="Seed" value={seed} onChange={(e) => setSeed(e.target.value)} /><button className="btn btn-sm" onClick={() => setSeed('dev' + Math.floor(Math.random() * 1e6))} aria-label="New seed">🎲</button></div>
        <div className="row" style={{ gap: 8 }}><button className="btn btn-gold grow" onClick={() => start(false)}>▶ Watch {kindName}</button><button className="btn grow" onClick={() => start(true)}>New random game</button></div>
        {run && <>
          <p className="small muted" style={{ margin: 0 }}>{run.A.name}: {run.A.team.filter(Boolean).map((x) => run.d.items[x.itemId].name).join(', ')}<br />{run.B.name}: {run.B.team.filter(Boolean).map((x) => run.d.items[x.itemId].name).join(', ')}<br />Simulated in {run.ms} ms · {fmtBytes(run.bytes)} saved per match · seed “{seed}” (same seed = same game)</p>
          <MatchView key={run.k} d={run.d} A={run.A} B={run.B} match={run.match} speed="normal" commentary label={'dev' + run.k} onDone={() => {}} />
          <button className="btn btn-sm btn-ghost" onClick={() => copy(JSON.stringify(run.match, null, 1), 'Raw result')}>Copy raw result (JSON)</button>
        </>}
      </div>

      <div className="card stack">
        <h3 style={{ margin: 0 }}>⏩ Skip the auction</h3>
        {draft && draft.phase !== 'done' ? <>
          <p className="small muted" style={{ margin: 0 }}>{draft.topic.emoji} {draft.topic.name} is in progress. Fill every team’s empty slots with random players at random prices and jump to the results (then start the finale).</p>
          <button className="btn btn-gold" onClick={() => setConfirm('fill')}>Auto-fill teams and finish the draft</button>
        </> : draft ? <><p className="small muted" style={{ margin: 0 }}>The current draft is already finished.</p><button className="btn" onClick={goDraft}>Open it</button></> : <p className="small muted" style={{ margin: 0 }}>No draft in progress. Start one (even with all bots in Solo), come back here and skip straight to the end.</p>}
      </div>

      <div className="card stack">
        <h3 style={{ margin: 0 }}>⏱ Animation & timer speed</h3>
        <p className="small muted" style={{ margin: 0 }}>Speeds up (or slows down) every animation, sound cue and auction timer on this device. Now: <b>{speed}×</b>{speed !== 1 ? ' (stays on after reloading)' : ''}.</p>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{[0.25, 0.5, 1, 2, 4, 8, 16].map((x) => <button key={x} className={'btn btn-sm' + (speed === x ? ' btn-gold' : '')} aria-pressed={speed === x} onClick={() => setSpeedS(setDevSpeed(x))}>{x}×</button>)}</div>
      </div>

      <div className="card stack">
        <h3 style={{ margin: 0 }}>💾 Saved on this device</h3>
        <table className="qtable small"><tbody>{lsRows.map(([k, n]) => <tr key={k}><td>{k}</td><td className="num">{fmtBytes(n)}</td></tr>)}</tbody></table>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {draft && <button className="btn btn-sm" onClick={() => copy(JSON.stringify(draft), 'Current draft')}>Copy current draft</button>}
          {draft && <button className="btn btn-sm btn-ghost" onClick={() => setConfirm('clear')}>Delete current draft</button>}
          <button className="btn btn-sm btn-ghost" onClick={() => { setSettings((s) => { const x = { ...s }; delete x.installDismissed; return x; }); setMsg('Install prompt will show again.'); }}>Show install prompt again</button>
        </div>
      </div>

      <div className="card stack">
        <h3 style={{ margin: 0 }}>🔑 Password</h3>
        <p className="small muted" style={{ margin: 0 }}>Saved on this device only. It keeps players out of this menu — it isn’t real security.</p>
        <div className="row" style={{ gap: 8 }}><input className="input grow" type="password" autoComplete="new-password" aria-label="New password" placeholder="New password" value={pw1} onChange={(e) => setPw1(e.target.value)} /><button className="btn btn-sm" disabled={pw1.length < 4} onClick={() => { devSet(DEV_KEYS.pw, String(devHash(pw1))); setPw1(''); setMsg('Password changed on this device.'); }}>Save</button></div>
        <button className="btn btn-sm btn-ghost" onClick={() => { devSet(DEV_KEYS.pw, null); setMsg('Password reset to the default.'); }}>Reset to default</button>
      </div>

      {confirm === 'fill' && <Confirm title="Skip the auction?" body="Every empty slot gets a random fitting player. This can’t be undone." yes="Fill and finish" onClose={() => setConfirm(null)} onYes={() => { setConfirm(null); setDraft(devAutoFill(draft)); goDraft(); }} />}
      {confirm === 'clear' && <Confirm danger title="Delete the current draft?" body="It won’t be saved to Past Drafts." yes="Delete" onClose={() => setConfirm(null)} onYes={() => { setConfirm(null); setDraft(null); setMsg('Draft deleted.'); }} />}
    </div>
  );
}
