/* ============================================================
   TV MODE for the host: show the big-screen view on this device
   (and come back to controls), or open it in another window.
   · Online: the TV window reads the room like any viewer. It doesn't
     take a seat or change the host.
   · Local games: the TV window is linked to this browser
     (BroadcastChannel), so no internet or Firebase is needed. It only
     displays the game; this window keeps running it.
   ============================================================ */
const LOCAL_TV = 'dn-local-tv';
const tvUrl = (code) => location.origin + location.pathname + '#tv=' + (code || 'local');
const canChannel = () => typeof window !== 'undefined' && 'BroadcastChannel' in window;
function goFullscreen() { try { const el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {}); } catch (e) {} }

// Floating 📺 button + choices.
function TvSwitch({ code, onThisScreen }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const newWindow = () => {
    if (!code && !canChannel()) { setMsg('This browser can’t link a second window. Use “On this screen” instead.'); return; }
    const w = window.open(tvUrl(code), '_blank');
    if (!w) setMsg('The browser blocked the new window. Allow pop-ups for this site, or use “On this screen”.'); else setOpen(false);
  };
  return (
    <>
      <button className="tvfab" onClick={() => setOpen(true)} aria-label="TV mode" title="TV mode">📺</button>
      {open && (
        <Sheet center onClose={() => setOpen(false)}>
          <h2 className="display" style={{ fontSize: 30 }}>TV mode</h2>
          <p className="hint">A big-screen view of the auction, bids, clock, teams and matches. It never bids, votes or spends.</p>
          <button className="btn btn-gold" onClick={() => { setOpen(false); onThisScreen(); }}>Show TV view on this screen</button>
          <p className="hint" style={{ margin: 0 }}>You stay the host. Tap “Back to controls” (or press Esc) to return.</p>
          <button className="btn" onClick={newWindow}>Open TV in a new window</button>
          <p className="hint" style={{ margin: 0 }}>Drag that window onto the TV (or cast it) and keep controlling the game here.{code ? '' : ' Works in this browser on this computer.'}</p>
          {code && <p className="hint" style={{ margin: 0 }}>Another device: open Draft Night → Online → enter <b>{code}</b> → “Use this screen as the TV”. It doesn’t take a seat.</p>}
          {msg && <p className="warn">{msg}</p>}
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
        </Sheet>
      )}
    </>
  );
}
function TvExit({ onExit }) {
  useEffect(() => {
    if (!onExit) return undefined;
    const k = (e) => { if (e.key === 'Escape' && !document.fullscreenElement) onExit(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onExit]);
  return (
    <div className="tvbar">
      <button className="pillbtn" onClick={goFullscreen}>⛶ Full screen</button>
      {onExit && <button className="pillbtn" onClick={onExit}>← Back to controls</button>}
    </div>
  );
}

// The phase screen for a draft, shown read-only.
function TvGame({ d, net, flash, setFlash, past, settings }) {
  const noop = () => {};
  let view;
  if (d.phase === 'auction') view = <Auction d={d} setDraft={noop} goHome={noop} flashing={!!flash} onFlash={noop} />;
  else if (d.phase === 'freepick') view = <FreePick d={d} setDraft={noop} goHome={noop} flashing={!!flash} onFlash={noop} />;
  else if (d.phase === 'nominate') view = <Nominate d={d} setDraft={noop} goHome={noop} />;
  else if (d.phase === 'trade') view = <TradeWindow d={d} setDraft={noop} goHome={noop} />;
  else view = <Results d={d} past={past} showShame={settings.showShame} onChange={noop} onBack={noop} />;
  return <NetCtx.Provider value={net}><div className="tvmode">{view}{flash && <Flash f={flash} onDone={() => setFlash(null)} />}</div></NetCtx.Provider>;
}

// A second window showing a local game from this browser.
function LocalTv({ past, settings }) {
  const [d, setD] = useState(null); const [live, setLive] = useState({}); const [flash, setFlash] = useState(null);
  useEffect(() => {
    if (!canChannel()) return undefined;
    const ch = new BroadcastChannel(LOCAL_TV);
    ch.onmessage = (e) => {
      const m = e.data || {};
      if (m.type === 'draft') setD(m.draft);
      else if (m.type === 'live') setLive(m.live || {});
      else if (m.type === 'flash' && m.info && m.info.kind !== 'card') { setFlash(m.info); if (m.info.kind === 'sold') audio.play(m.info.big ? 'big' : 'gavel'); }
    };
    ch.postMessage({ type: 'hello' });
    const bye = () => { try { ch.postMessage({ type: 'bye' }); } catch (e) {} };
    window.addEventListener('beforeunload', bye);
    return () => { bye(); window.removeEventListener('beforeunload', bye); ch.close(); };
  }, []);
  if (!canChannel()) return <div className="app"><div className="card stack"><b>TV window not supported here</b><p className="hint" style={{ margin: 0 }}>This browser can’t link windows. Use “Show TV view on this screen” in the game instead.</p></div></div>;
  if (!d) return <div className="app tvlobby"><div className="card stack" style={{ textAlign: 'center' }}><h2 className="display">📺 Draft Night TV</h2><p className="muted" style={{ margin: 0 }}>Waiting for a game… Start or resume a Local or Solo game in the other Draft Night window on this computer.</p></div><TvExit /></div>;
  return <><TvGame d={d} net={{ passive: true, local: true, display: 'tv', role: 'tv', live }} flash={flash} setFlash={setFlash} past={past} settings={settings} /><TvExit /></>;
}
