/* ============================================================
   ONLINE: home, lobby, the game on each phone, and TV mode.
   The rules and room plumbing live in 32-net.js.
   ============================================================ */

const TEAM_EMOJI = ['🔴', '🔵', '🟢', '🟣'];
const defaultProfile = () => ({ name: '', emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)], color: COLORS[Math.floor(Math.random() * COLORS.length)] });

function OnlineHome({ profile, setProfile, last, initialCode, onCreate, onJoin, onTv, onRejoin, onBack }) {
  const [code, setCode] = useState(cleanCode(initialCode || ''));
  const name = (profile.name || '').trim();
  return (
    <div className="app">
      <TopBar onBack={onBack} title="Online" />
      <h2 className="display">Play on your own phones</h2>
      {initialCode && cleanCode(initialCode).length === 5 && (
        <div className="card stack-sm joincard">
          <b>📷 Joining room {cleanCode(initialCode)}</b>
          <p className="small muted" style={{ margin: 0 }}>{name ? 'Ready when you are.' : 'Type your name below, then tap Join.'}</p>
          <button className="btn btn-gold" disabled={!name} onClick={() => onJoin(cleanCode(initialCode))}>Join room {cleanCode(initialCode)}</button>
        </div>
      )}
      {typeof navigator !== 'undefined' && navigator.onLine === false && <p className="warn">This device is offline. Online rooms need an internet connection; Solo and Local work offline.</p>}
      <p className="muted" style={{ margin: 0 }}>The host makes a room, friends join with the code, and everyone bids from their own phone. A laptop or TV can show the big screen.</p>
      {last && (
        <div className="card row">
          <span style={{ fontSize: 26 }}>🔁</span>
          <div className="grow"><b>Rejoin room {last.code}</b><span className="small muted" style={{ display: 'block' }}>Pick up where you left off.</span></div>
          <button className="btn btn-sm btn-gold" onClick={() => onRejoin(last)}>Rejoin</button>
        </div>
      )}
      <div className="card stack">
        <span className="label">You</span>
        <div className="row" style={{ gap: 10 }}>
          <button className="emo" aria-label="Change emoji" onClick={() => setProfile({ ...profile, emoji: EMOJIS[(EMOJIS.indexOf(profile.emoji) + 1) % EMOJIS.length] })}>{profile.emoji}</button>
          <input id="on-name" className="input grow" maxLength={16} value={profile.name} placeholder="Your name" onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
        </div>
        <div className="chips" role="group" aria-label="Your colour">{COLORS.slice(0, 8).map((c) => <button key={c} className={'swatch' + (profile.color === c ? ' on' : '')} style={{ background: c }} aria-label={'Colour ' + c} onClick={() => setProfile({ ...profile, color: c })} />)}</div>
        <p className="hint" style={{ margin: 0 }}>Use the same name each time so your wins add up in Players &amp; stats.</p>
      </div>
      <button className="btn btn-gold" disabled={!name} onClick={onCreate}>Create a room</button>
      <div className="card stack">
        <label className="label" htmlFor="on-code">Join with a code</label>
        <div className="row">
          <input id="on-code" className="input grow codeinput" value={code} maxLength={5} autoCapitalize="characters" autoCorrect="off" spellCheck="false" placeholder="ABCDE" onChange={(e) => setCode(cleanCode(e.target.value))} />
          <button className="btn btn-sm btn-gold" disabled={code.length !== 5 || !name} onClick={() => onJoin(code)}>Join</button>
        </div>
        <button className="btn btn-ghost btn-sm" disabled={code.length !== 5} onClick={() => onTv(code)}>📺 Use this screen as the TV</button>
        {!name && <p className="hint" style={{ margin: 0 }}>Type your name first.</p>}
      </div>
      <p className="hint">Anyone with the room code can join, so only share it with your group.</p>
    </div>
  );
}

// Build the game's teams from who is in the lobby (people who are online right now) plus bots.
function seatsFromLobby(room, cfg) {
  const people = room.people().filter((p) => p.kind !== 'tv' && p.online);
  const seatId = (uid) => 'p-' + uid.slice(0, 12);
  if (!cfg.teamMode) {
    const used = new Set();
    const humans = people.map((p) => {
      let color = p.color; if (used.has(color)) color = COLORS.find((c) => !used.has(c)) || color; used.add(color);
      return { id: seatId(p.uid), uid: p.uid, name: (p.name || 'Player').trim(), emoji: p.emoji, color };
    });
    const bots = makeBots(cfg.bots, cfg.level, cfg.botSeed, [...used]);
    return [...humans, ...bots];
  }
  const teams = [];
  const fill = makeBots(cfg.teamCount * ONLINE.maxTeamSize, cfg.level, cfg.botSeed, []);
  let b = 0;
  for (let t = 0; t < cfg.teamCount; t++) {
    const members = people.filter((p) => (p.team || 0) % cfg.teamCount === t).slice(0, ONLINE.maxTeamSize).map((p) => ({ id: seatId(p.uid), uid: p.uid, name: (p.name || 'Player').trim(), emoji: p.emoji }));
    if (cfg.fillBots) while (members.length < cfg.teamSize) { const x = fill[b++]; members.push({ id: x.id, name: x.name, emoji: x.emoji, bot: x.bot }); }
    if (members.length) teams.push({ id: 'team-' + t, name: (cfg.teamNames && cfg.teamNames[t]) || TEAM_NAMES[t], color: COLORS[t], emoji: TEAM_EMOJI[t], members });
  }
  return teams;
}
function lobbyProblems(room, cfg) {
  const seats = seatsFromLobby(room, cfg);
  const out = [];
  if (!cfg.topic) out.push('Pick a topic.');
  if (seats.length < 2) out.push(cfg.teamMode ? 'You need at least two teams with someone in them.' : 'You need at least two players (add a bot to play against).');
  if (!cfg.teamMode && seats.length > ONLINE.maxTeams) out.push('Too many players: the most is ' + ONLINE.maxTeams + ' (people + bots). Remove some bots or switch to teams.');
  if (cfg.teamMode) cfg.teamCount && Array.from({ length: cfg.teamCount }, (_, t) => t).forEach((t) => { const n = room.people().filter((p) => p.kind !== 'tv' && p.online && (p.team || 0) % cfg.teamCount === t).length; if (n > ONLINE.maxTeamSize) out.push((cfg.teamNames[t] || 'A team') + ' has more than ' + ONLINE.maxTeamSize + ' people.'); });
  return out;
}
function initialLobby(topic, rules) {
  return { teamMode: false, teamCount: 2, teamSize: 2, fillBots: true, teamNames: TEAM_NAMES.slice(0, 4), bots: 0, level: 'medium', botSeed: uid(), talk: true, clock: ONLINE.clock, coverAfter: 60,
    topic: topic ? packTopic(onlineTopic(topic), false) : null, topicName: topic ? topic.name : '', topicEmoji: topic ? topic.emoji : '', rules: topic ? { ...rules, slots: [...topic.slots] } : rules };
}

// A QR code drawn as SVG (vendor/qrcode.js, MIT). Scanning it opens the link on the phone.
function QrCode({ text, size = 180, label }) {
  const path = useMemo(() => {
    if (typeof qrcode === 'undefined' || !text) return null;
    try {
      const q = qrcode(0, 'M'); q.addData(text); q.make();
      const n = q.getModuleCount(); let p = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) p += 'M' + (c + 4) + ' ' + (r + 4) + 'h1v1h-1z';
      return { p, n: n + 8 };
    } catch (e) { return null; }
  }, [text]);
  if (!path) return null;
  return (
    <svg className="qr" width={size} height={size} viewBox={'0 0 ' + path.n + ' ' + path.n} role="img" aria-label={label || 'QR code'} shapeRendering="crispEdges">
      <rect width={path.n} height={path.n} fill="#fff" rx="2" /><path d={path.p} fill="#000" />
    </svg>
  );
}
const roomLink = (code) => location.origin + location.pathname + '#room=' + code;
function RoomCode({ code, big }) {
  const link = roomLink(code);
  const [msg, setMsg] = useState('');
  const [qr, setQr] = useState(false);
  const share = async () => {
    try { if (navigator.share) { await navigator.share({ title: 'Draft Night', text: 'Join my Draft Night room: ' + code, url: link }); return; } } catch (e) { return; }
    try { await navigator.clipboard.writeText(link); setMsg('Link copied.'); } catch (e) { setMsg(link); }
  };
  return (
    <div className={'roomcode' + (big ? ' big' : '')}>
      <span className="eyebrow">Room code</span>
      <b className="num" aria-label={'Room code ' + code.split('').join(' ')}>{code}</b>
      {big ? <>
        <QrCode text={link} size={240} label={'QR code to join room ' + code} />
        <span className="small">📷 Scan with your phone camera to join — or open {location.host}{location.pathname.replace(/index\.html$/, '')} → Online → enter the code</span>
      </> : <>
        <div className="row" style={{ justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={() => setQr(!qr)} aria-expanded={qr}>{qr ? 'Hide QR code' : '📷 Show QR code'}</button>
          <button className="btn btn-sm" onClick={share}>Share invite link</button>
        </div>
        {qr && <><QrCode text={link} size={220} label={'QR code to join room ' + code} /><span className="small">Friends scan this with their phone camera to join this room.</span></>}
      </>}
      {msg && <span className="small muted" style={{ overflowWrap: 'anywhere' }}>{msg}</span>}
    </div>
  );
}

function PlayerRow({ p, me, host, isHost, teamMode, cfg, room }) {
  return (
    <div className={'prow-on' + (p.online ? '' : ' away')} style={mStyle({ color: p.color || '#888' })}>
      <span className="dot" aria-label={p.online ? 'online' : 'away'} />
      <span className="grow"><b>{p.emoji} {p.name}</b>{p.uid === host ? <small> · host</small> : null}{p.uid === me ? <small> · you</small> : null}{!p.online ? <small> · away</small> : null}</span>
      {teamMode && (isHost || p.uid === me) && p.kind !== 'tv' && (
        <select aria-label={'Team for ' + p.name} className="input mini-select" value={(p.team || 0) % cfg.teamCount} onChange={(e) => (p.uid === me ? room.setMe({ team: +e.target.value }) : room.setPlayer(p.uid, { team: +e.target.value }))}>
          {Array.from({ length: cfg.teamCount }, (_, t) => <option key={t} value={t}>{TEAM_EMOJI[t]} {cfg.teamNames[t]}</option>)}
        </select>
      )}
      {teamMode && !(isHost || p.uid === me) && <span className="small">{TEAM_EMOJI[(p.team || 0) % cfg.teamCount]}</span>}
      {isHost && p.uid !== me && <button className="mini" aria-label={'Remove ' + p.name} onClick={() => room.setPlayer(p.uid, null)}>✕</button>}
    </div>
  );
}

function Lobby({ room, topics, rulePrefs, onLeave: leaveNow, onStart, tv: tvProp, topicPrefs, setTopicPrefs }) {
  const isHost = room.amHost;
  const [tvView, setTvView] = useState(false);
  const tv = tvProp || tvView;
  const [askLeave, setAskLeave] = useState(false);
  const onLeave = () => (isHost ? setAskLeave(true) : leaveNow());
  const leaveSheet = askLeave && <Confirm title="Close the room?" body="Everyone in the lobby is sent back. You can make a new room any time." yes="Close room" danger onYes={leaveNow} onClose={() => setAskLeave(false)} />;
  const cfg = room.lobby;
  const [view, setView] = useState('lobby');
  const [folder, setFolder] = useState(null);
  const set = (patch) => room.setLobby({ ...cfg, ...patch });
  const people = room.people();
  const players = people.filter((p) => p.kind !== 'tv');
  const tvs = people.filter((p) => p.kind === 'tv' && p.online);
  if (!cfg) return <div className="app"><TopBar onBack={onLeave} title="Lobby" /><p className="muted">Setting up the room…</p></div>;
  const topicObj = cfg.topic ? unpackTopic(cfg.topic).topic : null;
  const stopBrowse = () => { set({ browse: null }); setView('lobby'); };
  if (isHost && view === 'topic') return <SetupTopic topics={topics} folder={folder} setFolder={setFolder} prefs={topicPrefs} setPrefs={setTopicPrefs} onBack={stopBrowse} onTopics={stopBrowse}
    onBrowse={(b) => { const cur = cfg.browse || {}; if (cur.view !== b.view || cur.folder !== b.folder || cur.q !== b.q) set({ browse: b }); }}
    onPick={(id) => { const t = topics.find((x) => x.id === id); set({ topic: packTopic(onlineTopic(t), false), topicName: t.name, topicEmoji: t.emoji, browse: null, rules: { ...cfg.rules, ...twistRules(cfg.rules), slots: [...t.slots] } }); setView('lobby'); }} />;
  if (isHost && view === 'rules' && topicObj) {
    const seats = seatsFromLobby(room, cfg);
    return <SetupRules topic={topicObj} managers={seats.length ? seats : [{ id: 'a' }, { id: 'b' }]} rules={cfg.rules} setRules={(r) => set({ rules: r })} onBack={() => setView('lobby')} title="Online · Rules" startLabel="Save rules"
      teamSummary={{ teams: cfg.teamMode, text: cfg.teamMode ? cfg.teamCount + ' teams' : 'Individual', detail: 'Change teams and bots in the lobby.' }} onStart={(r) => { set({ rules: r }); setView('lobby'); }}
      onReset={() => set({ rules: { ...RULE_DEFAULTS(), slots: [...topicObj.slots] } })} />;
  }
  const problems = isHost ? lobbyProblems(room, cfg) : [];
  const humansOnline = players.filter((p) => p.online).length;
  const r = cfg.rules || {};
  const twistsOn = ['chaos', 'mystery', 'rarity', 'trades'].filter((k) => r[k] && r[k].on).map((k) => ({ chaos: 'Chaos Cards', mystery: 'Mystery items', rarity: 'Rarity', trades: 'Trades' }[k]));
  const fin = (r.finale && r.finale.mode) || 'vote';
  if (tv && cfg.browse) return <TvTopics topics={topics} browse={cfg.browse} onExit={tvView ? () => setTvView(false) : null} code={room.code} players={players} />;
  if (tv) return (
    <div className="app tvlobby">
      <TvExit onExit={tvView ? () => setTvView(false) : null} />
      <RoomCode code={room.code} big />
      <div className="card stack-sm"><h3>{cfg.topicEmoji} {cfg.topicName || 'Topic not picked yet'}</h3><p className="small muted" style={{ margin: 0 }}>{humansOnline} player{humansOnline === 1 ? '' : 's'} in · waiting for the host to start</p></div>
      <div className="tvplayers">{players.map((p) => <span key={p.uid} className={'tvp' + (p.online ? '' : ' away')} style={mStyle({ color: p.color || '#888' })}>{p.emoji} {p.name}</span>)}</div>
    </div>
  );
  return (
    <div className="app">
      <TopBar onBack={onLeave} backLabel="✕" title="Lobby" right={<MuteButton />} />
      <RoomCode code={room.code} />
      <div className="card stack-sm">
        <div className="row"><h3 className="grow">Players · {humansOnline}</h3>{tvs.length > 0 && <span className="small muted">📺 TV connected</span>}</div>
        {players.map((p) => <PlayerRow key={p.uid} p={p} me={room.uid} host={room.meta.host} isHost={isHost} teamMode={cfg.teamMode} cfg={cfg} room={room} />)}
        {players.some((p) => !p.online) && <p className="hint" style={{ margin: 0 }}>Away players aren’t given a seat when the game starts.</p>}
      </div>
      {isHost ? (
        <>
          <div className="card stack">
            <h3>Teams &amp; bots</h3>
            <Seg label="Play as" value={cfg.teamMode ? 'teams' : 'solo'} options={[['solo', 'Everyone for themselves'], ['teams', 'Teams']]} onChange={(v) => set({ teamMode: v === 'teams' })} />
            {!cfg.teamMode ? (
              <div className="field"><span className="label">Bots filling empty seats</span>
                <Stepper id="on-bots" value={cfg.bots} min={0} max={Math.max(0, ONLINE.maxTeams - humansOnline)} onChange={(v) => set({ bots: v })} />
                <p className="hint">Up to {ONLINE.maxTeams} seats in total ({humansOnline} people + {cfg.bots} bot{cfg.bots === 1 ? '' : 's'}).</p>
              </div>
            ) : (
              <>
                <div className="field"><span className="label">Number of teams</span><Seg label="Number of teams" value={cfg.teamCount} options={[[2, '2'], [3, '3'], [4, '4']]} onChange={(v) => set({ teamCount: v })} /></div>
                <Toggle on={cfg.fillBots} onChange={(v) => set({ fillBots: v })} title="Bots fill empty team spots" sub={'Each team is topped up to ' + cfg.teamSize + ' with bots. Bots on a team with people give advice; all-bot teams play for themselves.'} />
                {cfg.fillBots && <div className="field"><span className="label">Team size</span><Seg label="Team size" value={cfg.teamSize} options={[[1, '1'], [2, '2'], [3, '3'], [4, '4']]} onChange={(v) => set({ teamSize: v })} /></div>}
                <p className="hint">Everyone picks their team in the list above. Teams of up to {ONLINE.maxTeamSize}.</p>
              </>
            )}
            {(cfg.teamMode ? cfg.fillBots : cfg.bots > 0) && <div className="field"><span className="label">Bot difficulty</span><Seg label="Bot difficulty" value={cfg.level} options={Object.keys(BOT_LEVELS).map((k) => [k, BOT_LEVELS[k].label])} onChange={(v) => set({ level: v })} /></div>}
            <Toggle on={cfg.talk} onChange={(v) => set({ talk: v })} title="Bot trash talk" sub="Speech bubbles from the bots." />
          </div>
          <div className="card stack">
            <h3>Game</h3>
            <button className="tcard" onClick={() => setView('topic')}><span className="em">{cfg.topicEmoji || '🎲'}</span><span className="meta"><span className="name">{cfg.topicName || 'Pick a topic'}</span><span className="sub">{topicObj ? topicObj.items.length + ' items · ' + topicObj.slots.length + ' slots' : 'Tap to choose'}</span></span><span className="muted" style={{ fontSize: 22 }}>›</span></button>
            <div className="field"><span className="label">Bid clock</span><Seg label="Bid clock" value={cfg.clock} options={ONLINE.clocks.map((c) => [c, c + 's'])} onChange={(v) => set({ clock: v })} /><p className="hint">Restarts on every bid. When it runs out, the item sells (or is skipped if nobody bid).</p></div>
            <button className="btn" disabled={!topicObj} onClick={() => setView('rules')}>Edit rules: {money(r.budget || 20)} budget{twistsOn.length ? ' · ' + twistsOn.join(', ') : ' · no twists'} · winner by {fin === 'vote' ? 'vote' : fin}</button>
          </div>
          <div className="card stack">
            <h3>Room</h3>
            <div className="field"><span className="label">If someone’s connection drops</span><Seg label="Bot covers after" value={cfg.coverAfter || 60} options={[[30, 'Bot after 30s'], [60, '60s'], [120, '2 min']]} onChange={(v) => set({ coverAfter: v })} />
              <p className="hint">A bot plays their seat until they’re back, then hands it straight back. They can rejoin from Online on the same phone, or take their seat back from another phone.</p></div>
            <p className="hint" style={{ margin: 0 }}>Up to {ONLINE.maxTeams} teams ({ONLINE.maxPeople} people in team mode). Only the host can change rules, start, pause and end trading; everyone else controls just their own team. If the host leaves, the next player to join takes over.</p>
          </div>
          {problems.map((p) => <p key={p} className="warn">{p}</p>)}
          <button className="btn btn-gold" disabled={problems.length > 0} onClick={onStart}>Start the draft</button>
          <p className="hint" style={{ textAlign: 'center' }}>A bot covers anyone who drops out for {cfg.coverAfter || 60}s, and hands their seat back when they return.</p>
          {leaveSheet}
          <TvSwitch code={room.code} onThisScreen={() => setTvView(true)} />
        </>
      ) : (
        <>
          <div className="card stack-sm">
            <h3>{cfg.topicEmoji} {cfg.topicName || 'The host is picking a topic'}</h3>
            {cfg.browse && <p className="small" style={{ margin: 0 }}>👀 The host is looking at {cfg.browse.q ? 'topics matching “' + cfg.browse.q + '”' : cfg.browse.folder ? folderEmoji(cfg.browse.folder) + ' ' + cfg.browse.folder : cfg.browse.view === 'popular' ? 'the most popular topics' : 'the topic folders'}{tvs.length ? ' — it’s on the TV' : ''}.</p>}
            <p className="small muted" style={{ margin: 0 }}>{money(r.budget || 20)} budget · {(r.slots || []).length} slots · {cfg.clock}s bid clock{twistsOn.length ? ' · ' + twistsOn.join(', ') : ''} · winner by {fin === 'vote' ? 'vote' : fin}</p>
            <details><summary className="label">All rules for this room</summary><RulesSummary rules={{ ...RULE_DEFAULTS(), ...r }} opts={{ teams: cfg.teamMode, clock: cfg.clock }} /><p className="hint" style={{ margin: 0 }}>A bot covers a dropped player after {cfg.coverAfter || 60}s. Only the host can change these.</p></details>
            <p className="small muted" style={{ margin: 0 }}>{cfg.teamMode ? cfg.teamCount + ' teams' + (cfg.fillBots ? ', bots fill empty spots' : '') : 'Everyone for themselves' + (cfg.bots ? ' + ' + cfg.bots + ' bot' + (cfg.bots === 1 ? '' : 's') : '')}</p>
          </div>
          <p className="muted" style={{ textAlign: 'center' }}>Waiting for the host to start…</p>
        </>
      )}
    </div>
  );
}

// TV: while the host chooses, the big screen shows the same folder / search, so the room can shout out picks.
function TvTopics({ topics, browse, onExit, code, players }) {
  const noop = () => {};
  const built = topics.filter(isBuiltIn);
  const what = browse.q ? 'Searching “' + browse.q + '”' : browse.folder ? folderEmoji(browse.folder) + ' ' + browse.folder : browse.view === 'popular' ? '🔥 Most popular' : browse.view === 'favs' ? '⭐ Host’s favourites' : '📁 All folders';
  return (
    <div className="app tvlobby tvtopics">
      <TvExit onExit={onExit} />
      <div className="row tvtopics-head">
        <div className="grow"><p className="eyebrow">Room {code} · {players.filter((p) => p.online).length} in</p><h2 className="display" style={{ margin: 0 }}>🎲 Pick a topic</h2><p className="small muted" style={{ margin: 0 }}>The host is choosing on their phone · {what}. Shout out what you want!</p></div>
      </div>
      <ArtLegend />
      <FolderBrowser topics={built} q={browse.q || ''} folder={browse.folder || null} setFolder={noop} view={browse.view === 'favs' ? 'popular' : browse.view || 'folders'} setView={noop} prefs={{ fav: [], pin: [] }} renderTopic={(t) => (
        <div className="tcard">
          <span className="em">{t.emoji || '🎲'}</span>
          <span className="meta"><span className="name">{t.name}<ArtTag t={t} /></span><span className="sub">{t.items.length} items · {t.slots.length} slots{maxPlayersFor(t) < MAX_MANAGERS ? ' · 👥 up to ' + Math.max(2, maxPlayersFor(t)) + ' players' : ''}{hasBattle(t) ? ' · ' + battleKind(t).emoji + ' battles' : isFootball(t) ? ' · ⚽ matches' : ''}</span></span>
        </div>
      )} />
      <p className="hint">The host’s own topics only show on their phone.</p>
    </div>
  );
}

// The game on one phone. The host's phone holds the real draft and publishes it.
function RoomGame({ room, d, setHd, onLeave, onPlayAgain, onFinished, past, settings }) {
  const isHost = room.amHost; const tv = room.kind === 'tv';
  const [flash, setFlash] = useState(null);
  const [askLeave, setAskLeave] = useState(false);
  const [tvView, setTvView] = useState(false); // the host showing the TV view on this screen
  const who = useMemo(() => ownerInfo(d, room.uid), [d && d.managers, room.uid]);
  const net = { role: isHost ? 'host' : tv ? 'tv' : 'player', display: tv || tvView ? 'tv' : 'controls', who, live: room.live, send: (n, a) => room.send(n, a), publishLive: (o) => room.publishLive(o) };
  // Host: show a flash here and on every other screen.
  const onFlash = (info) => { setFlash(info); if (isHost) room.publishLive({ flash: { id: uid(), info } }); };
  const lastFlash = useRef(room.live && room.live.flash ? room.live.flash.id : null);
  const fl = room.live && room.live.flash;
  useEffect(() => {
    if (isHost || !fl || fl.id === lastFlash.current) return;
    lastFlash.current = fl.id;
    if (fl.info.kind === 'card') return; // card flashes come from the game state on every phone
    setFlash(fl.info);
    if (fl.info.kind === 'sold') { audio.play(fl.info.big ? 'big' : 'gavel'); if (fl.info.rarity === 'legendary' || fl.info.big) setTimeout(() => audio.play('cheer'), 600); }
  }, [fl && fl.id, isHost]);
  // Save the finished game to this phone's Past Drafts (for profiles and stats).
  useEffect(() => { if (d && d.phase === 'done' && d.votesRevealed && (!d.finale || (d.finale.ui || {}).stage === 'done' || !d.finale.champion)) onFinished(d); }, [d && d.votesRevealed, d && d.finale && (d.finale.ui || {}).stage]);
  if (!d) return <div className="app"><p className="muted">Loading the game…</p></div>;
  const setDraft = isHost ? setHd : () => {};
  const goHome = () => setAskLeave(true);
  let view;
  if (d.phase === 'auction') view = <Auction d={d} setDraft={setDraft} goHome={goHome} flashing={!!flash} onFlash={onFlash} />;
  else if (d.phase === 'freepick') view = <FreePick d={d} setDraft={setDraft} goHome={goHome} flashing={!!flash} onFlash={onFlash} />;
  else if (d.phase === 'nominate') view = <Nominate d={d} setDraft={setDraft} goHome={goHome} />;
  else if (d.phase === 'forcepick') view = <ForcedPick d={d} setDraft={setDraft} goHome={goHome} />;
  else if (d.phase === 'trade') view = <TradeWindow d={d} setDraft={setDraft} goHome={goHome} />;
  else view = <Results d={d} past={past} showShame={settings.showShame} live onChange={setDraft} onBack={goHome} onUndo={null} onFinish={goHome} onPlayAgain={isHost ? onPlayAgain : null} />;
  const seated = who.teams.size > 0;
  const awaySeats = !seated && !tv ? humanSeats(d).filter((s) => !room.online(s.uid)) : [];
  return (
    <NetCtx.Provider value={net}>
      <div className={tv || tvView ? 'tvmode' : ''}>
        {!room.connected && <div className="netbar" role="status">Reconnecting… your seat is kept.</div>}
        {!seated && !tv && awaySeats.length > 0 && (
          <div className="netbar seat" role="region" aria-label="Take a seat">
            <span>You’re watching. Take back a seat:</span>
            {awaySeats.map((s) => <button key={s.uid} className="btn btn-sm" onClick={() => room.send('claimSeat', [s.uid])}>{s.name}</button>)}
          </div>
        )}
        <TvSwitch on={!tv && isHost && !tvView} code={room.code} onThisScreen={() => setTvView(true)}>{view}</TvSwitch>
        {flash && <Flash f={flash} d={d} onDone={() => setFlash(null)} />}
        {tv && <TvExit />}
        {!tv && isHost && tvView && <TvExit onExit={() => setTvView(false)} />}
        {askLeave && <Confirm title="Leave the room?" body={isHost ? 'Another player takes over as host and the game carries on. You can rejoin from Online.' : 'The game carries on. A bot covers your seat after a minute; you can rejoin from Online.'} yes="Leave" onYes={onLeave} onClose={() => setAskLeave(false)} />}
      </div>
    </NetCtx.Provider>
  );
}

// Connects, then shows the lobby or the game. Holds the host's copy of the draft.
function OnlineScreen({ start, profile, topics, rulePrefs, past, settings, setSettings, onExit, onFinished, onRetry }) {
  const [room, setRoom] = useState(null);
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 12000); return () => clearTimeout(t); }, []);
  const [err, setErr] = useState('');
  const [, tick] = useState(0);
  const [hd, setHd] = useState(null);
  const hdRef = useRef(null); hdRef.current = hd;
  const joined = useRef(false);
  useEffect(() => {
    let alive = true; let r = null;
    const p = start.kind === 'create' ? Room.create(profile) : Room.join(start.code, profile, start.kind === 'tv' ? 'tv' : 'player');
    p.then((x) => { if (!alive) { x.leave(false); return; } r = x; if (window.__DN_TEST__) window.__DN_ROOM = x; x.subscribe(() => tick((n) => n + 1)); setRoom(x); }).catch((e) => { if (alive) setErr(e && e.message && !/^[a-z/-]+$/.test(e.message) && !/firebase|network|permission/i.test(e.message) ? e.message : netError(e)); });
    return () => { alive = false; if (r) r.leave(false); };
  }, []);
  const amHost = !!(room && room.amHost);
  const status = room && room.meta ? room.meta.status : null;
  // Players' phones stay quiet; the host and the TV play the auctioneer.
  useEffect(() => { audio.setQuiet(!!room && !amHost && room.kind !== 'tv' && !profile.voice); return () => audio.setQuiet(false); }, [room, amHost, profile.voice]);
  // Host: create the lobby once; take over the published game if we became host mid-game.
  useEffect(() => {
    if (!room || !amHost) return;
    if (!room.lobby && status === 'lobby') { const t = topics.find((x) => x.items.length && x.slots.length); room.setLobby(initialLobby(t, { ...rulePrefs(), slots: t ? [...t.slots] : [] })); }
    if (status === 'game' && !hdRef.current && room.state) { room.adoptState(); setHd({ ...room.state, history: [] }); }
    room.drainActions().catch(() => {});
  }, [room, amHost, status, !!(room && room.state)]);
  // Host: publish every change.
  useEffect(() => { if (room && amHost && hd) room.publish(hd); }, [hd, amHost]);
  // Host: apply players' actions with the normal game rules, checking each belongs to that phone.
  useEffect(() => {
    if (!room) return undefined;
    room.onAction = ({ by, name, args }, done) => {
      done();
      if (!room.amHost) return;
      setHd((p) => {
        if (!p) return p;
        if (name === 'claimSeat') { const [old] = args; return typeof old === 'string' && !room.online(old) && ownerInfo(p, by).teams.size === 0 && humanSeats(p).some((s) => s.uid === old) ? claimSeat(p, old, by) : p; }
        // No bids or cards while the host has the game paused.
        if ((name === 'bid' || name === 'card') && room.liveSent.paused === 'true') return p;
        const n = runAction(p, name, args, ownerInfo(p, by));
        if (name === 'freePick' && n !== p) { const cp = currentPicker(p); const it = p.items[args[0]]; setTimeout(() => { const info = { kind: 'free', name: cp.m.name, emoji: cp.m.emoji, color: cp.m.color, item: it.name }; room.publishLive({ flash: { id: uid(), info } }); }, 0); }
        return n;
      });
    };
    return () => { room.onAction = null; };
  }, [room]);
  // Host: a bot covers anyone away for 60s; they get their seat back when they return.
  useEffect(() => {
    if (!room || !amHost || !hd) return undefined;
    const t = setInterval(() => {
      const now = Date.now();
      setHd((p) => {
        if (!p) return p;
        let n = p;
        humanSeats(p).forEach((s) => {
          if (room.online(s.uid)) { delete room.awaySince[s.uid]; if (s.covered) n = setCover(n, s.uid, false); }
          else { room.awaySince[s.uid] = room.awaySince[s.uid] || now; if (!s.covered && now - room.awaySince[s.uid] >= ms(((p.online && p.online.coverAfter) || 60) * 1000)) n = setCover(n, s.uid, true); }
        });
        return n;
      });
    }, ms(2000));
    return () => clearInterval(t);
  }, [room, amHost, !!hd]);
  useEffect(() => { if (room && room.players[room.uid]) joined.current = true; });

  const leave = (forget) => { if (room) room.leave(forget); onExit(); };
  if (err) return <div className="app"><TopBar onBack={onExit} title="Online" /><div className="card stack"><b>Couldn’t open the room</b><p className="small" style={{ margin: 0 }}>{err}</p><p className="hint" style={{ margin: 0 }}>Solo and Local games still work without internet.</p><button className="btn btn-gold" onClick={onRetry}>Try again</button><button className="btn" onClick={onExit}>Back</button></div></div>;
  if (!room || !room.meta) return <div className="app"><TopBar onBack={onExit} title="Online" /><p className="muted" style={{ textAlign: 'center' }}>Connecting…</p>{slow && <p className="hint" style={{ textAlign: 'center' }}>This is taking a while. Check your internet connection{typeof navigator !== 'undefined' && navigator.onLine === false ? ' — this device looks offline' : ''}.</p>}</div>;
  if (status === 'closed') return <div className="app"><TopBar onBack={() => leave(true)} title="Online" /><div className="card stack"><b>This room has ended</b><button className="btn" onClick={() => leave(true)}>Back</button></div></div>;
  if (joined.current && !room.players[room.uid]) return <div className="app"><TopBar onBack={() => leave(true)} title="Online" /><div className="card stack"><b>You were removed from the room</b><button className="btn" onClick={() => leave(true)}>Back</button></div></div>;
  if (status === 'lobby') return <Lobby room={room} topics={topics} rulePrefs={rulePrefs} topicPrefs={prefsOf(settings)} setTopicPrefs={setSettings ? (p) => setSettings((x) => ({ ...x, topicPrefs: { fav: p.fav || [], pin: p.pin || [] } })) : null} tv={room.kind === 'tv'} onLeave={() => (amHost ? room.close().then(onExit) : leave(true))}
    onStart={() => {
      const cfg = room.lobby; const t = unpackTopic(cfg.topic).topic;
      const managers = seatsFromLobby(room, cfg);
      const rules = { ...RULE_DEFAULTS(), ...cfg.rules, slots: [...t.slots] };
      const d = createDraft(t, managers, rules, { mode: 'online', online: { clock: cfg.clock, code: room.code, coverAfter: cfg.coverAfter || 60 }, solo: { talk: cfg.talk, level: cfg.level } });
      room.sent = {}; setHd(d); room.publish(d); room.setStatus('game');
    }} />;
  const d = amHost ? hd : room.state;
  return <RoomGame room={room} d={d} setHd={setHd} past={past} settings={settings} onFinished={onFinished}
    onLeave={() => leave(false)} onPlayAgain={async () => { await room.resetGame(); setHd(null); room.setStatus('lobby'); room.setLobby({ ...room.lobby, botSeed: uid() }); }} />;
}
