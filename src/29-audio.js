/* ============================================================
   AUDIO: auctioneer voice, sound effects and background music.
   Everything here is presentation only. The game never waits for audio,
   and any audio error is swallowed so play continues.
   - Voice: the browser's built-in speech (Web Speech API). No network.
   - Sound effects + music: generated live with Web Audio, so every sound is
     original (no third-party recordings, nothing to license or download).
   ============================================================ */
const AUDIO_DEFAULTS = { muted: false, voice: true, voiceName: '', rate: 1.15, voiceVol: 1, sfx: true, sfxVol: 0.7, music: false, musicVol: 0.35, bigSale: 40 };

const audio = (() => {
  let cfg = { ...AUDIO_DEFAULTS };
  let ctx = null, master = null, sfxBus = null, musicBus = null;
  let musicTimer = null, musicStep = 0;
  const said = new Set();           // event keys already announced (no duplicate SOLDs)
  let speakingPrio = 0;
  const lastPlayed = {};

  const hasSpeech = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  function ensureCtx() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain(); master.connect(ctx.destination);
        sfxBus = ctx.createGain(); sfxBus.connect(master);
        musicBus = ctx.createGain(); musicBus.connect(master);
        applyGains();
      }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    } catch (e) { return null; }
  }
  function applyGains() {
    if (!ctx) return;
    const t = ctx.currentTime;
    try {
      master.gain.setTargetAtTime(cfg.muted ? 0 : 1, t, 0.02);
      sfxBus.gain.setTargetAtTime(cfg.sfx ? cfg.sfxVol : 0, t, 0.02);
      musicBus.gain.setTargetAtTime(cfg.music ? cfg.musicVol * 0.5 : 0, t, 0.3);
    } catch (e) {}
  }
  // Browsers only allow sound after the player touches the page.
  if (typeof window !== 'undefined') {
    const unlock = () => { if (cfg.muted) return; ensureCtx(); if (cfg.music) startMusic(); };
    ['pointerdown', 'keydown', 'touchend'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
  }

  /* ---------- synthesized sound effects ---------- */
  function noiseBuffer(sec) {
    const b = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * sec)), ctx.sampleRate);
    const ch = b.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    return b;
  }
  function tone(type, f0, f1, start, dur, vol, dest) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, start); if (f1) o.frequency.exponentialRampToValueAtTime(f1, start + dur);
    g.gain.setValueAtTime(0.0001, start); g.gain.exponentialRampToValueAtTime(vol, start + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(dest || sfxBus); o.start(start); o.stop(start + dur + 0.05);
  }
  function noise(start, dur, vol, filterType, freq, dest) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuffer(dur);
    const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, start); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxBus); s.start(start); s.stop(start + dur + 0.05);
  }
  const SFX = {
    bid: (t) => tone('sine', 880, 1320, t, 0.09, 0.18),
    gavel: (t) => { noise(t, 0.08, 0.9, 'lowpass', 1800); tone('triangle', 160, 70, t, 0.25, 0.7); noise(t + 0.18, 0.06, 0.5, 'lowpass', 1500); tone('triangle', 150, 70, t + 0.18, 0.2, 0.45); },
    cheer: (t) => { noise(t, 1.6, 0.35, 'bandpass', 1400); noise(t + 0.1, 1.4, 0.25, 'bandpass', 2600); [523, 659, 784].forEach((f, i) => tone('triangle', f, 0, t + i * 0.09, 0.35, 0.12)); },
    buzzer: (t) => { tone('sawtooth', 140, 120, t, 0.45, 0.25); tone('square', 147, 125, t, 0.45, 0.12); },
    drumroll: (t) => { for (let i = 0; i < 22; i++) noise(t + i * 0.045, 0.05, 0.25 + i * 0.012, 'bandpass', 900); noise(t + 22 * 0.045, 0.35, 0.8, 'lowpass', 400); tone('sine', 90, 50, t + 22 * 0.045, 0.4, 0.6); },
    card: (t) => [1047, 1319, 1568, 2093].forEach((f, i) => tone('sine', f, 0, t + i * 0.06, 0.18, 0.12)),
    trade: (t) => { tone('triangle', 660, 0, t, 0.2, 0.2); tone('triangle', 990, 0, t + 0.14, 0.3, 0.2); },
    fanfare: (t) => [392, 523, 659, 784, 1047].forEach((f, i) => tone('square', f, 0, t + i * 0.12, i === 4 ? 0.6 : 0.16, 0.08)),
    whistle: (t) => { tone('sine', 2100, 2300, t, 0.25, 0.18); tone('sine', 2100, 2300, t + 0.32, 0.5, 0.18); },
    big: (t) => { SFX.gavel(t); [392, 494, 587, 784].forEach((f, i) => tone('sawtooth', f, 0, t + 0.3 + i * 0.07, 0.5, 0.06)); },
  };
  function play(name) {
    if (cfg.muted || !cfg.sfx || !SFX[name]) return;
    const now = Date.now();
    if (now - (lastPlayed[name] || 0) < 120) return; // no machine-gun repeats
    lastPlayed[name] = now;
    try { const c = ensureCtx(); if (!c) return; SFX[name](c.currentTime + 0.01); } catch (e) {}
  }

  /* ---------- original background loop (generated) ---------- */
  const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function scheduleBar() {
    if (!ctx) return;
    const t = ctx.currentTime + 0.05; const beat = 0.5;
    const ch = CHORDS[musicStep % CHORDS.length];
    ch.forEach((n) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = midi(n); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.3); g.gain.linearRampToValueAtTime(0.0001, t + beat * 4); o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + beat * 4 + 0.05); });
    for (let i = 0; i < 4; i++) { tone('sine', midi(ch[0] - 12), 0, t + i * beat, beat * 0.9, 0.12, musicBus); noise(t + i * beat + beat / 2, 0.05, 0.05, 'highpass', 6000, musicBus); }
    musicStep++;
  }
  function startMusic() {
    if (musicTimer || cfg.muted || !cfg.music) return;
    const c = ensureCtx(); if (!c) return;
    scheduleBar(); musicTimer = setInterval(() => { try { scheduleBar(); } catch (e) {} }, 2000);
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }
  function duck(on) { if (!ctx || !cfg.music) return; try { musicBus.gain.setTargetAtTime(cfg.muted ? 0 : (on ? cfg.musicVol * 0.15 : cfg.musicVol * 0.5), ctx.currentTime, 0.15); } catch (e) {} }

  /* ---------- auctioneer voice ---------- */
  function pickVoice() {
    try {
      const vs = window.speechSynthesis.getVoices() || [];
      if (cfg.voiceName) { const v = vs.find((x) => x.name === cfg.voiceName); if (v) return v; }
      const en = vs.filter((v) => /^en/i.test(v.lang));
      return en.find((v) => /natural|neural|premium|enhanced/i.test(v.name)) || en.find((v) => /google|samantha|daniel|alex|aria|guy/i.test(v.name)) || en[0] || vs[0] || null;
    } catch (e) { return null; }
  }
  // priority: 3 = SOLD / winner / legendary (cuts in), 2 = countdown, 1 = colour commentary (skipped if busy)
  let quiet = false;
  function say(text, priority, key) {
    if (quiet || cfg.muted || !cfg.voice || !hasSpeech() || !text) return false;
    if (key) { if (said.has(key)) return false; said.add(key); if (said.size > 400) said.clear(); }
    try {
      const synth = window.speechSynthesis;
      const busy = synth.speaking || synth.pending;
      if (busy && priority <= speakingPrio && priority < 2) return false;
      if (busy && priority >= speakingPrio) synth.cancel();
      const u = new window.SpeechSynthesisUtterance(text);
      const v = pickVoice(); if (v) u.voice = v;
      u.rate = cfg.rate; u.pitch = 1.08; u.volume = cfg.voiceVol;
      speakingPrio = priority;
      u.onend = u.onerror = () => { speakingPrio = 0; duck(false); };
      duck(true);
      synth.speak(u);
      return true;
    } catch (e) { return false; }
  }
  return {
    get cfg() { return cfg; },
    set(next) {
      cfg = { ...AUDIO_DEFAULTS, ...next };
      applyGains();
      if (cfg.muted) { try { if (hasSpeech()) window.speechSynthesis.cancel(); } catch (e) {} stopMusic(); }
      else if (cfg.music) { if (ctx) startMusic(); } else stopMusic();
    },
    play, say, hasSpeech,
    // Online: players' phones stay quiet so the room doesn't hear ten auctioneers at once.
    setQuiet(v) { quiet = !!v; }, get quiet() { return quiet; },
    voices() { try { return hasSpeech() ? window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)) : []; } catch (e) { return []; } },
    test() { ensureCtx(); play('gavel'); say('SOLD to the highest bidder! What a night!', 3); },
    resetSaid() { said.clear(); },
  };
})();

// What the auctioneer says. Several lines per moment so it doesn't repeat itself.
const CALLS = {
  next: ['Coming up next: {item}!', 'Next on the block: {item}!', 'Who wants {item}?', 'Here comes {item}! Who’s ready to fight for this one?'],
  mystery: ['A mystery item! Who’s brave enough?', 'Face down and up for grabs! Mystery time!'],
  legendaryUp: ['Oh my, a LEGENDARY on the block!', 'Legendary alert! This one’s special!'],
  open: ['{who} opens at {amt}!', 'We start at {amt} from {who}!'],
  raise: ['{amt}! Anybody going higher?', 'We’ve got {amt}!', '{who} says {amt}!', '{amt} from {who}! Do I hear more?'],
  war: ['We’ve got a bidding war!', 'Nobody’s backing down!', 'That bid just changed everything!'],
  once: ['Going once…'],
  twice: ['Going twice…'],
  sold: ['SOLD to {who} for {amt}!', 'SOLD! {who} takes it for {amt}!'],
  big: ['Someone’s spending big tonight!', 'Huge money! The crowd goes wild!'],
  mysteryReveal: ['It’s time to reveal the mystery pick… it’s {item}!'],
  legendary: ['LEGENDARY! What a pull!'],
  rare: ['We’ve got a RARE card!'],
  noBids: ['No takers! Moving on.'],
  card: ['{who} plays {card}!'],
  vetoed: ['VETOED! Denied!'],
  tradeOffer: ['We’ve got a trade on the table!'],
  tradeDone: ['Deal done! That could be a game-changer!'],
  winner: ['And the winner is… {who}!'],
  goal: ['GOAL! {who}!', 'It’s in! {who} scores!'],
  champion: ['And your champions are… {who}!'],
  tie: ['It’s a tie! {who}!'],
};
const callLine = (k, vars) => { const ls = CALLS[k]; const l = ls[Math.floor(Math.random() * ls.length)]; return l.replace(/\{(\w+)\}/g, (_, v) => (vars && vars[v] != null ? vars[v] : '')); };
