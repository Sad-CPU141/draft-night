/* Draft Night 01db533eb2 — built from src/ by build.js. Edit src/, not this file. */
"use strict";
(function(){
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useEffect,
  useRef,
  useMemo
} = React;
const K = {
  topics: 'dn_topics_v1',
  current: 'dn_current_v1',
  past: 'dn_past_v1',
  managers: 'dn_managers_v1',
  seen: 'dn_starters_seen_v1',
  settings: 'dn_settings_v1'
};
const STORE_KEYS = Object.values(K);
const store = (() => {
  const mem = {};
  let backend = 'memory';
  let db = null;
  let onError = null;
  const pending = new Map();
  let timer = null;
  const lsGet = k => {
    try {
      const v = localStorage.getItem(k);
      return v == null ? undefined : JSON.parse(v);
    } catch (e) {
      return undefined;
    }
  };
  function openIDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
      let req;
      try {
        req = indexedDB.open('draft-night', 1);
      } catch (e) {
        return reject(e);
      }
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains('kv')) req.result.createObjectStore('kv');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('IndexedDB blocked'));
      setTimeout(() => reject(new Error('IndexedDB timed out')), 5000);
    });
  }
  const idbReq = (mode, fn) => new Promise((resolve, reject) => {
    const tx = db.transaction('kv', mode);
    const st = tx.objectStore('kv');
    const r = fn(st);
    tx.oncomplete = () => resolve(r && r.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('aborted'));
  });
  async function idbAll() {
    const keys = await idbReq('readonly', st => st.getAllKeys());
    const vals = await idbReq('readonly', st => st.getAll());
    const out = {};
    (keys || []).forEach((k, i) => {
      out[k] = vals[i];
    });
    return out;
  }
  function report(err) {
    const quota = err && (err.name === 'QuotaExceededError' || /quota/i.test(String(err.message || err)));
    if (onError) onError(quota ? 'Storage is full, so recent changes may not be saved. Remove some uploaded photos or old drafts, and export a backup.' : "This device isn't saving right now. The game keeps working, but export a backup before closing the page.");
  }
  async function flush() {
    timer = null;
    const batch = [...pending.entries()];
    pending.clear();
    if (!batch.length || backend === 'memory') return;
    try {
      if (backend === 'indexeddb') {
        await idbReq('readwrite', st => {
          batch.forEach(([k, v]) => v === undefined ? st.delete(k) : st.put(v, k));
          return null;
        });
      } else {
        batch.forEach(([k, v]) => v === undefined ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)));
      }
    } catch (e) {
      report(e);
    }
  }
  const schedule = () => {
    if (!timer) timer = setTimeout(flush, 120);
  };
  return {
    async init() {
      try {
        db = await openIDB();
        Object.assign(mem, await idbAll());
        backend = 'indexeddb';
        if (!STORE_KEYS.some(k => mem[k] !== undefined)) {
          STORE_KEYS.forEach(k => {
            const v = lsGet(k);
            if (v !== undefined) {
              mem[k] = v;
              pending.set(k, v);
            }
          });
          await flush();
        }
      } catch (e) {
        db = null;
        try {
          localStorage.setItem('dn__probe', '1');
          localStorage.removeItem('dn__probe');
          STORE_KEYS.forEach(k => {
            const v = lsGet(k);
            if (v !== undefined) mem[k] = v;
          });
          backend = 'localStorage';
        } catch (e2) {
          backend = 'memory';
        }
      }
      try {
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
      } catch (e) {}
      window.addEventListener('pagehide', () => flush());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flush();
      });
    },
    get(k, fallback) {
      const v = mem[k];
      return v === undefined || v === null ? fallback : v;
    },
    set(k, v) {
      mem[k] = v;
      pending.set(k, v);
      schedule();
      return true;
    },
    del(k) {
      delete mem[k];
      pending.set(k, undefined);
      schedule();
      return true;
    },
    flush,
    get backend() {
      return backend;
    },
    set onError(fn) {
      onError = fn;
    }
  };
})();
const wiki = (() => {
  const CACHE_KEY = 'dn_wiki_cache_v1';
  const FOUND_TTL = 30 * 864e5,
    MISS_TTL = 3 * 864e5,
    ERROR_TTL = 10 * 60e3;
  let cache = {};
  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {};
  } catch (e) {
    cache = {};
  }
  const listeners = new Map();
  const queue = new Set();
  let timer = null;
  let saveTimer = null;
  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch (e) {}
    }, 400);
  };
  const fresh = e => e && Date.now() - e.t < (e.u ? FOUND_TTL : e.err ? ERROR_TTL : MISS_TTL);
  const emit = title => {
    const ls = listeners.get(title);
    if (ls) ls.forEach(fn => fn());
  };
  async function fetchBatch(titles) {
    const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&redirects=1' + '&prop=pageimages%7Cpageprops&ppprop=disambiguation&piprop=thumbnail&pithumbsize=480&titles=' + titles.map(encodeURIComponent).join('%7C');
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const q = data.query || {};
    const hop = {};
    [...(q.normalized || []), ...(q.redirects || [])].forEach(m => {
      hop[m.from] = m.to;
    });
    const pages = {};
    (q.pages || []).forEach(p => {
      pages[p.title] = p;
    });
    titles.forEach(t => {
      let cur = t;
      for (let i = 0; i < 4 && hop[cur]; i++) cur = hop[cur];
      const p = pages[cur];
      const ok = p && !p.missing && !(p.pageprops && 'disambiguation' in p.pageprops) && p.thumbnail && p.thumbnail.source;
      cache[t] = {
        u: ok ? p.thumbnail.source : null,
        page: p && !p.missing ? p.title : null,
        t: Date.now()
      };
    });
  }
  async function run() {
    timer = null;
    const titles = [...queue];
    queue.clear();
    for (let i = 0; i < titles.length; i += 50) {
      const chunk = titles.slice(i, i + 50);
      try {
        await fetchBatch(chunk);
      } catch (e) {
        chunk.forEach(t => {
          cache[t] = {
            u: null,
            err: true,
            t: Date.now()
          };
        });
      }
      chunk.forEach(emit);
    }
    save();
  }
  function request(title) {
    if (!title || fresh(cache[title]) || queue.has(title)) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    queue.add(title);
    if (!timer) timer = setTimeout(run, 40);
  }
  return {
    peek(title) {
      const e = cache[title];
      return e ? e.u : undefined;
    },
    page(title) {
      const e = cache[title];
      return e && e.page;
    },
    request,
    prefetch(titles) {
      titles.forEach(request);
    },
    subscribe(title, fn) {
      if (!listeners.has(title)) listeners.set(title, new Set());
      listeners.get(title).add(fn);
      return () => listeners.get(title).delete(fn);
    },
    clear() {
      cache = {};
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch (e) {}
    },
    get size() {
      return Object.keys(cache).length;
    }
  };
})();
function useWikiImage(title) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!title) return undefined;
    const off = wiki.subscribe(title, () => force(x => x + 1));
    wiki.request(title);
    return off;
  }, [title]);
  return title ? wiki.peek(title) : null;
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
async function shareFile(blob, filename, title) {
  try {
    const file = new File([blob], filename, {
      type: blob.type
    });
    if (navigator.canShare && navigator.canShare({
      files: [file]
    })) {
      await navigator.share({
        files: [file],
        title
      });
      return 'shared';
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled';
  }
  return 'unsupported';
}
const canShareFiles = () => {
  try {
    return !!(navigator.canShare && navigator.canShare({
      files: [new File(['x'], 'x.png', {
        type: 'image/png'
      })]
    }));
  } catch (e) {
    return false;
  }
};
const todayStamp = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const BACKUP_FORMAT = 1;
function makeBackup(state) {
  return {
    app: 'draft-night',
    format: BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    data: {
      topics: state.topics,
      past: state.past,
      current: state.draft || null,
      managers: state.managers,
      seen: store.get(K.seen, null),
      settings: state.settings || {}
    }
  };
}
function validateBackup(obj) {
  if (!obj || typeof obj !== 'object') return {
    ok: false,
    error: "That file isn't a Draft Night backup."
  };
  if (obj.app !== 'draft-night') return {
    ok: false,
    error: "That file isn't a Draft Night backup."
  };
  if (typeof obj.format !== 'number' || obj.format > BACKUP_FORMAT) return {
    ok: false,
    error: 'This backup was made by a newer version of Draft Night. Reload the site to update, then try again.'
  };
  const d = obj.data || {};
  if (!Array.isArray(d.topics) || !Array.isArray(d.past)) return {
    ok: false,
    error: 'This backup is missing its topics or drafts, so it can’t be restored.'
  };
  const badTopic = d.topics.find(t => !t || typeof t.id !== 'string' || typeof t.name !== 'string' || !Array.isArray(t.items) || !Array.isArray(t.slots));
  if (badTopic) return {
    ok: false,
    error: 'One of the topics in this backup is damaged, so it can’t be restored.'
  };
  const badDraft = [...d.past, ...(d.current ? [d.current] : [])].find(x => !x || !Array.isArray(x.managers) || !x.items || !x.rules);
  if (badDraft) return {
    ok: false,
    error: 'One of the drafts in this backup is damaged, so it can’t be restored.'
  };
  const photos = d.topics.reduce((n, t) => n + t.items.filter(i => i && i.photo).length, 0);
  return {
    ok: true,
    data: d,
    summary: {
      topics: d.topics.length,
      items: d.topics.reduce((n, t) => n + t.items.length, 0),
      photos,
      past: d.past.length,
      current: !!d.current,
      exportedAt: obj.exportedAt
    }
  };
}
const pwa = (() => {
  let deferred = null;
  let waiting = null;
  const subs = new Set();
  const emit = () => subs.forEach(fn => fn());
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        const watch = w => {
          if (!w) return;
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              waiting = w;
              emit();
            }
          });
        };
        if (reg.waiting && navigator.serviceWorker.controller) {
          waiting = reg.waiting;
          emit();
        }
        reg.addEventListener('updatefound', () => watch(reg.installing));
        setInterval(() => reg.update().catch(() => {}), 30 * 60e3);
      }).catch(() => {});
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloaded) {
          reloaded = true;
          location.reload();
        }
      });
    });
  }
  return {
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    get canPrompt() {
      return !!deferred;
    },
    async prompt() {
      if (!deferred) return;
      deferred.prompt();
      try {
        await deferred.userChoice;
      } catch (e) {}
      deferred = null;
      emit();
    },
    get updateReady() {
      return !!waiting;
    },
    applyUpdate() {
      store.flush();
      if (waiting) waiting.postMessage('skipWaiting');else location.reload();
    },
    get standalone() {
      try {
        return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
      } catch (e) {
        return false;
      }
    }
  };
})();
function usePwa() {
  const [, f] = useState(0);
  useEffect(() => pwa.subscribe(() => f(x => x + 1)), []);
  return pwa;
}
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
const GAME_SPEED = typeof window !== 'undefined' && window.__DN_TEST_SPEED || 1;
const ms = n => Math.max(1, Math.round(n * GAME_SPEED));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const norm = s => (s || '').trim().toUpperCase();
const isFlex = s => norm(s) === 'FLEX';
const parseSlots = str => (str || '').split(',').map(s => s.trim()).filter(Boolean);
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const initials = name => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const lastName = name => {
  const p = (name || '').split(/\s+/);
  return p.length > 1 ? p.slice(1).join(' ') : name;
};
const buzz = p => {
  try {
    if (navigator.vibrate) navigator.vibrate(p);
  } catch (e) {}
};
const money = n => '$' + n;
function onColor(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255,
    g = parseInt(h.slice(2, 4), 16) / 255,
    b = parseInt(h.slice(4, 6), 16) / 255;
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.55 ? '#1a1300' : '#ffffff';
}
const mStyle = m => ({
  '--c': m.color,
  '--on': onColor(m.color)
});
const COLORS = ['#ff4f64', '#3d8bff', '#ffc83d', '#2fd17c', '#a46bff', '#ff8a3a', '#ff5cbc', '#22cfd6'];
const EMOJIS = ['😎', '🦁', '🐺', '🔥', '👑', '🦅', '🐐', '⚡', '🎯', '🧠', '🦈', '🐉', '🍀', '🚀', '💎', '🤠'];
function resizeImage(file, size = 240) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2,
          sy = (img.height - side) / 2;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(c.toDataURL('image/jpeg', 0.72));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
function mkTopic(id, name, emoji, slots, layout, art, text, extra) {
  return {
    id,
    name,
    emoji,
    slots: parseSlots(slots),
    layout,
    art,
    ...(extra || {}),
    items: text.trim().split('\n').map((line, i) => {
      const [n, p, d, e] = line.split('|');
      return {
        id: id + '-' + i,
        name: n.trim(),
        pos: (p || '').trim(),
        desc: (d || '').trim(),
        emoji: (e || '').trim(),
        photo: ''
      };
    })
  };
}
const FOLDERS = [['Sports', '⚽'], ['Food & Drink', '🍔'], ['Entertainment', '🎬'], ['Travel & Places', '✈️'], ['Animals', '🐾'], ['Style & Rides', '👟'], ['Just for Fun', '🎲'], ['My Topics', '📁']];
const STARTER_FOLDER = {
  't-pl': 'Sports',
  't-cf': 'Sports',
  't-nba': 'Sports',
  't-goat': 'Sports',
  't-nbal': 'Sports',
  't-nhl': 'Sports',
  't-nfl': 'Sports',
  't-club': 'Sports',
  't-ten': 'Sports',
  't-f1': 'Sports',
  't-fight': 'Sports',
  't-crk': 'Sports',
  't-ff': 'Food & Drink',
  't-snk': 'Food & Drink',
  't-dish': 'Food & Drink',
  't-drink': 'Food & Drink',
  't-fruit': 'Food & Drink',
  't-bfast': 'Food & Drink',
  't-dess': 'Food & Drink',
  't-pizza': 'Food & Drink',
  't-rap': 'Entertainment',
  't-game': 'Entertainment',
  't-toon': 'Entertainment',
  't-anim': 'Entertainment',
  't-app': 'Entertainment',
  't-trav': 'Travel & Places',
  't-ctry': 'Travel & Places',
  't-ani': 'Animals',
  't-pet': 'Animals',
  't-car': 'Style & Rides',
  't-shoe': 'Style & Rides',
  't-pow': 'Just for Fun',
  't-myth': 'Just for Fun',
  't-job': 'Just for Fun',
  't-zomb': 'Just for Fun',
  't-island': 'Just for Fun',
  't-house': 'Just for Fun',
  't-inv': 'Just for Fun',
  't-board': 'Just for Fun',
  't-toys': 'Just for Fun',
  't-emoji': 'Just for Fun',
  't-hobby': 'Just for Fun',
  't-road': 'Just for Fun',
  't-smell': 'Just for Fun',
  't-holi': 'Just for Fun',
  't-gadget': 'Just for Fun',
  't-wknd': 'Just for Fun',
  't-school': 'Just for Fun'
};
const folderOf = t => t && t.folder || 'My Topics';
const folderEmoji = f => (FOLDERS.find(x => x[0] === f) || [0, '📁'])[1];
function folderList(topics, includeDefaults) {
  const names = new Set(topics.map(folderOf));
  if (includeDefaults) FOLDERS.forEach(f => names.add(f[0]));
  const order = FOLDERS.map(f => f[0]);
  return [...names].sort((a, b) => {
    const ia = order.indexOf(a),
      ib = order.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
}
function starterTopics() {
  return [...baseTopics(), ...evenMoreTopics(), ...funTopics()].map(t => ({
    ...t,
    folder: STARTER_FOLDER[t.id] || 'My Topics',
    photos: Object.prototype.hasOwnProperty.call(PHOTO_TOPICS, t.id)
  }));
}
function funTopics() {
  return [mkTopic('t-island', 'Desert Island Items', '🏝️', 'Item 1, Item 2, Item 3', 'list', 'emoji', `
Knife||Cut anything|🔪
Lighter||Instant fire|🔥
Fishing Rod||Dinner sorted|🎣
Tent||Shelter|⛺
Water Filter||Drink anything|💧
Solar Charger||Power forever|🔋
Satellite Phone||Call for rescue|📡
Hammock||Island vibes|🌴
Machete||Clear the jungle|🗡️
Rope||Build a raft|🪢
Sunscreen||No burns|🧴
Sun Hat||Shade|👒
Football||Stay sane|⚽
Guitar||Campfire songs|🎸
Box of Books||Something to read|📚
Sack of Rice||Food for months|🍚
Coffee||Morning fuel|☕
Snorkel Set||Explore the reef|🤿
Kayak||Explore the coast|🛶
Speaker||Music|🔊
Hot Sauce||Flavour|🌶️
Pillow||Sleep well|🛌
First Aid Kit||Patch up|🩹
Your Best Friend||Company|🧑‍🤝‍🧑
Your Pet||Loyal companion|🐕
Flare Gun||Signal a ship|🎆
Inflatable Boat||Escape plan|🚤
Mosquito Net||No bites|🦟
Endless Snacks||Never hungry|🍫
Mirror||Signal and selfies|🪞`), mkTopic('t-house', 'Dream House Features', '🏡', 'Feature 1, Feature 2, Feature 3, Feature 4', 'list', 'emoji', `
Infinity Pool||Overlooking the sea|🏊
Home Cinema||Recliners included|🎬
Gaming Room||Every console|🎮
Indoor Basketball Court||Full size|🏀
Home Gym||No membership|🏋️
Rooftop Terrace||City views|🌇
Walk-in Closet||Sneaker wall|👔
Secret Room||Behind a bookshelf|🚪
Slide Between Floors||Faster than stairs|🛝
10-Car Garage||Room for the collection|🚗
Chef's Kitchen||Restaurant level|🧑‍🍳
Library||Floor-to-ceiling|📚
Aquarium Wall||Sharks in the living room|🐠
Bowling Alley||Two lanes|🎳
Sauna||Relax|🧖
Hot Tub||Under the stars|🛁
Treehouse||For grown-ups|🌳
Music Studio||Soundproof|🎙️
Mini Golf||Backyard course|⛳
Football Pitch||Five-a-side|⚽
Bubble Tea Bar||Unlimited|🧋
Arcade||Retro machines|🕹️
Panic Room||Just in case|🔒
Helipad||Skip traffic|🚁
Ice Cream Machine||Soft serve on tap|🍦
Smart Home||Voice controls everything|🤖
Glass Elevator||Fancy|🛗
Ocean View||Every window|🌊
Fireplace||Cozy winters|🔥
Quiet Room||Peace and calm|🧘`), mkTopic('t-inv', 'Greatest Inventions', '💡', 'Invention 1, Invention 2, Invention 3, Invention 4', 'list', 'emoji', `
The Internet||Connects everyone|🌐
Smartphone||Everything in your pocket|📱
Electricity||Powers the world|⚡
The Wheel||Where it started|🛞
Airplane||Fly anywhere|✈️
Car||Go anywhere|🚗
Light Bulb||Night becomes day|💡
Printing Press||Books for everyone|📰
Vaccines||Saved millions|💉
Antibiotics||Cure infections|💊
Refrigerator||Food stays fresh|🧊
Air Conditioning||Survive summer|❄️
Television||Entertainment|📺
Computer||Changed everything|💻
Telephone||Talk across the world|☎️
Camera||Capture moments|📷
GPS||Never get lost|🛰️
Flushing Toilet||Underrated hero|🚽
Glasses||See clearly|👓
Clock||Know the time|🕰️
Microwave||Food in 2 minutes|♨️
Washing Machine||No more hand washing|🧺
Bicycle||Pedal power|🚲
Video Games||Endless fun|🎮
Wi-Fi||Internet without wires|📶
Headphones||Music anywhere|🎧
Zipper||Clothes revolution|🤐
Sliced Bread||The best thing since|🍞
Paper||Write it down|📄
Compass||Find your way|🧭`), mkTopic('t-board', 'Board & Card Games', '🎲', 'Game 1, Game 2, Game 3, Game 4', 'list', 'emoji', `
Monopoly||Friendship ender|🎩
Uno||Draw four|🃏
Chess||Strategy|♟️
Scrabble||Word nerds|🔤
Jenga||Don't knock it over|🧱
Connect 4||Four in a row|🔴
Clue||Whodunnit|🔍
Catan||Wood for sheep|🐑
Risk||World domination|🗺️
Battleship||You sank my battleship|🚢
Snakes & Ladders||Pure luck|🐍
Ludo||Family classic|🎲
Carrom||Flick the striker|🎯
Dominoes||Match the ends|⚫
Checkers||King me|🔵
Twister||Left hand red|🌀
Pictionary||Draw it|✏️
Guess Who?||Does your person wear glasses?|🧑
Operation||Steady hands|🩺
Sorry!||Not really sorry|😬
Exploding Kittens||Don't draw the bomb|💣
Codenames||One-word clues|🕵️
Werewolf||Who's lying?|🐺
Taboo||Can't say those words|🤫
Trivial Pursuit||Know-it-all|🧠
Poker Night||Bluffing (for snacks)|♠️
Go Fish||Got any sevens?|🐟
Spoons||Grab one fast|🥄
Scattergories||Categories|📝
Backgammon||Ancient classic|🎰`), mkTopic('t-toys', 'Childhood Toys', '🧸', 'Toy 1, Toy 2, Toy 3, Toy 4', 'list', 'emoji', `
LEGO||Step on one|🧱
Beyblades||Let it rip|🌀
Pokémon Cards||Gotta catch 'em all|⚡
Nerf Blasters||Foam wars|🎯
Hot Wheels||Tiny cars|🏎️
Tamagotchi||Keep it alive|🥚
Game Boy||Handheld classic|🎮
Yo-Yo||Walk the dog|🪀
Rubik's Cube||Never solved it|🟥
Slinky||Walks down stairs|🌈
Bakugan||Pop open|🔮
Furby||Creepy at night|🦉
Play-Doh||Smells iconic|🎨
Etch A Sketch||Shake to erase|✏️
Tech Deck||Finger skateboard|🛹
Kinder Surprise||Toy inside|🍫
Bubble Wand||Bubbles|🫧
Water Gun||Summer wars|💦
Scooter||Ankle destroyer|🛴
Rollerblades||Roll out|🛼
RC Car||Remote control|🚙
Silly Bandz||Wrist full|🔵
Fidget Spinner||2017 craze|💫
Nintendo DS||Two screens|🕹️
Teddy Bear||Best friend|🧸
Kite||Windy days|🪁
Marbles||Classic|⚪
Action Figures||Epic battles|🦸
Trampoline||Backyard flips|🤸
Squishmallow||Soft|🫶`), mkTopic('t-emoji', 'Emojis', '😂', 'Emoji 1, Emoji 2, Emoji 3, Emoji 4, Emoji 5', 'list', 'emoji', `
Crying Laughing||Classic laugh|😂
Skull||Dead from laughing|💀
Fire||That's hot|🔥
Red Heart||Love|❤️
Thumbs Up||Sounds good|👍
Eyes||Watching this|👀
Goat||Greatest of all time|🐐
Sobbing||Overwhelmed|😭
Clown||You played yourself|🤡
Hundred||Keep it 100|💯
Praying Hands||Please / thank you|🙏
Smirk||Up to something|😏
Sunglasses||Too cool|😎
Thinking||Hmm|🤔
Eye Roll||Sure, buddy|🙄
Salute||Respect|🫡
Melting||So embarrassed|🫠
Nerd||Um, actually|🤓
Moai||Stone face|🗿
Cap||That's a lie|🧢
Rocket||To the moon|🚀
Sparkles||Fancy|✨
Hand Over Mouth||Oops|🤭
Upside-Down||Sarcasm|🙃
Mind Blown||No way|🤯
Party Face||Celebrate|🥳
Pleading||Puppy eyes|🥺
Shrug||Who knows|🤷
Facepalm||Why|🤦
Ghost||Ghosted|👻`), mkTopic('t-hobby', 'Hobbies', '🎨', 'Hobby 1, Hobby 2, Hobby 3', 'list', 'emoji', `
Gaming||Controller in hand|🎮
Football||Sunday league|⚽
Basketball||Pickup games|🏀
Gym||Gains|🏋️
Cooking||Chef mode|🍳
Photography||Capture it|📸
Drawing||Sketchbook|✏️
Reading||Bookworm|📚
Fishing||Patience|🎣
Hiking||Trails|🥾
Coding||Build apps|💻
Guitar||Strum|🎸
Chess||Checkmate|♟️
Swimming||Laps|🏊
Cycling||Long rides|🚴
Skateboarding||Kickflips|🛹
Gardening||Green thumb|🌱
Baking||Fresh out the oven|🧁
Video Editing||Content creator|🎬
Sneaker Collecting||Cop or drop|👟
Camping||Under the stars|⛺
Running||Marathon goals|🏃
Boxing||Jab, cross|🥊
Martial Arts||Black belt|🥋
Calligraphy||Beautiful writing|🖋️
Knitting||Cozy crafts|🧶
Rock Climbing||Reach the top|🧗
LEGO Building||Master builder|🧱
Car Detailing||Shiny|🚗
Learning Languages||Polyglot|🗣️`), mkTopic('t-road', 'Road Trip Essentials', '🚗', 'Item 1, Item 2, Item 3, Item 4', 'list', 'emoji', `
Aux Cord||Whoever has it runs the trip|🎵
Phone Charger||Never die|🔌
Gas Station Snacks||The real reason we stop|🍫
Tim Hortons Run||Double-double for the road|☕
Road Trip Playlist||Bangers only|🎶
Sunglasses||Sun in your eyes|🕶️
Neck Pillow||Nap time|😴
Cooler of Drinks||Ice cold|🧊
Chips||Crunch|🥔
Gummies||Sugar rush|🍬
Beef Jerky||Protein|🥩
Google Maps||Don't get lost|🗺️
Spare Tire||Just in case|🛞
Blanket||Back seat naps|🧣
Car Games||I spy|🎲
Podcast||Long stretches|🎙️
Roof Box||More luggage|🧳
Polaroid Camera||Memories|📸
Bluetooth Speaker||Rest stop vibes|🔊
Power Bank||Backup battery|🔋
Wet Wipes||Sticky hands|🧻
Sunflower Seeds||Spit the shells|🌻
Water Bottles||Stay hydrated|💧
Hand Sanitizer||Gas station bathrooms|🧴
Gum||Fresh breath|🫧
Fruit||Healthy-ish|🍎
Sandwiches||Packed lunch|🥪
Hoodie||AC wars|🧥
Emergency Kit||Safety first|🩹
Dashcam||Evidence|📹`), mkTopic('t-smell', 'Best Smells', '👃', 'Smell 1, Smell 2, Smell 3', 'list', 'emoji', `
Fresh Bread||Straight from the oven|🍞
Rain||After a storm|🌧️
Fresh Laundry||Clean clothes|🧺
Coffee||Morning brew|☕
New Car||Showroom fresh|🚗
Cut Grass||Summer|🌱
Popcorn||Movie theatre|🍿
Bakery||Pastries|🥐
Oud||Rich and woody|🪵
Vanilla||Sweet|🍦
Campfire||Smoky|🔥
Ocean Breeze||Salty air|🌊
Pine Trees||Forest|🌲
Lavender||Calm|💜
Cookies Baking||Warm and sweet|🍪
BBQ||Grill going|🍖
New Book||Fresh pages|📖
Cinnamon||Spiced|🥧
Oranges||Citrus peel|🍊
Roses||Floral|🌹
Chocolate||Rich|🍫
Baby Powder||Soft|👶
Mint||Fresh|🌿
Coconut||Beach|🥥
Gasoline||Controversial|⛽
Play-Doh||Childhood|🎨
Bakhoor||Incense|💨
Fresh Paint||New room|🖌️
Garlic Frying||Dinner's coming|🧄
New Sneakers||Opening the box|👟`), mkTopic('t-holi', 'Holidays & Celebrations', '🎉', 'Day 1, Day 2, Day 3, Day 4', 'list', 'emoji', `
Eid al-Fitr||End of Ramadan|🌙
Eid al-Adha||Festival of sacrifice|🐑
Ramadan Nights||Iftar with family|🏮
Christmas||December 25|🎄
New Year's Eve||Countdown|🎆
Halloween||Costumes and candy|🎃
Thanksgiving||Turkey dinner|🦃
Canada Day||July 1|🇨🇦
Diwali||Festival of lights|🪔
Lunar New Year||Red envelopes|🧧
Your Birthday||Your day|🎂
Valentine's Day||Love|💘
Easter||Chocolate eggs|🐣
Summer Break||Freedom|☀️
Last Day of School||Free at last|🎒
Family Day||Ontario long weekend|👨‍👩‍👧
Victoria Day||Fireworks|🎇
Boxing Day||Sales|🛍️
Black Friday||Deals|🏷️
Super Bowl Sunday||Game and wings|🏈
World Cup Final||Once every four years|⚽
Graduation||Cap and gown|🎓
Wedding Season||Dancing|💍
Snow Day||No school|❄️
Payday||Money in|💸
Hanukkah||Festival of lights|🕎
Nowruz||Persian New Year|🌸
Holi||Festival of colours|🌈
Mother's Day||Treat mom|💐
Long Weekend||Three days off|🏖️`), mkTopic('t-gadget', 'Tech Gadgets', '📱', 'Gadget 1, Gadget 2, Gadget 3, Gadget 4', 'list', 'emoji', `
iPhone||Smartphone|📱
AirPods||Wireless earbuds|🎧
PlayStation 5||Console|🎮
Nintendo Switch||Handheld console|🕹️
Xbox||Console|🟩
MacBook||Laptop|💻
Gaming PC||RGB everything|🖥️
iPad||Tablet|🖊️
Apple Watch||Smartwatch|⌚
Drone||Aerial shots|🚁
GoPro||Action camera|📹
VR Headset||Virtual reality|🥽
Smart TV||Big screen|📺
Kindle||E-reader|📖
Bluetooth Speaker||Portable music|🔊
Noise-Cancelling Headphones||Silence|🎶
Mechanical Keyboard||Clicky|⌨️
Gaming Mouse||Precision|🖱️
Ring Light||Content setup|💡
Electric Scooter||Commute|🛴
Robot Vacuum||Cleans for you|🤖
Instant Camera||Print photos|📸
Smart Glasses||Camera in your frames|🕶️
Power Bank||Backup battery|🔋
Air Fryer||Crispy everything|🍟
Hair Dryer||Fancy airflow|💨
Steam Deck||PC games anywhere|👾
3D Printer||Print anything|🧊
E-Bike||Pedal assist|🚲
Mini Projector||Movie anywhere|📽️`), mkTopic('t-wknd', 'Weekend Plans', '🗓️', 'Plan 1, Plan 2, Plan 3', 'list', 'emoji', `
Sleep In||No alarm|😴
Brunch||Late breakfast|🥞
Movie Night||Popcorn ready|🍿
Mall Trip||Shopping|🛍️
Gym Session||Leg day|🏋️
Pickup Basketball||Run it back|🏀
Football with the Boys||Five-a-side|⚽
All-Night Gaming||One more game|🎮
Road Trip||Hit the highway|🚗
Beach Day||Sun and sand|🏖️
Bowling||Strikes|🎳
Go-Karting||Racing|🏎️
Escape Room||Beat the clock|🔐
Arcade||Tokens|🕹️
Trampoline Park||Flips|🤸
Hiking||Trails|🥾
Bonfire||S'mores|🔥
BBQ||Backyard grill|🍖
Family Dinner||Everyone together|🍽️
Ice Skating||Outdoor rink|⛸️
Skiing||Hit the slopes|⛷️
Concert||Live music|🎤
Theme Park||Roller coasters|🎢
Museum||Culture|🏛️
Late-Night Food Run||2 a.m. shawarma|🌯
Board Game Night||Competitive|🎲
Paintball||Splat|🎯
Volunteering||Give back|🤝
Picnic||Park day|🧺
Laser Tag||Glow in the dark|🔦`), mkTopic('t-school', 'School Subjects', '🎒', 'Class 1, Class 2, Class 3, Class 4', 'list', 'emoji', `
Math||Numbers|➗
English||Essays|📖
Science||Experiments|🔬
Physics||Forces|⚛️
Chemistry||Explosions (hopefully)|🧪
Biology||Life|🧬
History||The past|🏛️
Geography||Maps|🌍
Gym||Dodgeball|⚽
Art||Create|🎨
Music||Recorder era|🎵
Computer Science||Code|💻
French||Bonjour|🥖
Business||Money moves|💼
Economics||Supply and demand|📊
Accounting||Debits and credits|🧾
Psychology||The mind|🧠
Drama||Act it out|🎭
Law||Rules|⚖️
Philosophy||Big questions|🤔
Statistics||Probability|📈
Marketing||Sell it|📣
Lunch||Best period|🥪
Recess||Freedom|🛝
Spare Period||Nap time|😴
Field Trip||Bus ride|🚌
Shop Class||Build stuff|🔨
Health||Nutrition|🍎
Media Studies||Analyze ads|📺
Astronomy||Stars|🔭`)];
}
function evenMoreTopics() {
  return [mkTopic('t-ten', 'Tennis Players', '🎾', 'Men, Men, Women, Women', 'list', 'emoji', `
Novak Djokovic|Men|24 Grand Slams|🇷🇸
Rafael Nadal|Men|14× French Open|🇪🇸
Roger Federer|Men|20 Grand Slams|🇨🇭
Carlos Alcaraz|Men|Spain|🇪🇸
Jannik Sinner|Men|Italy|🇮🇹
Andy Murray|Men|2× Wimbledon|🇬🇧
Pete Sampras|Men|7× Wimbledon|🇺🇸
Andre Agassi|Men|Career Grand Slam|🇺🇸
Daniil Medvedev|Men|2021 US Open|🇷🇺
Alexander Zverev|Men|Olympic gold|🇩🇪
Taylor Fritz|Men|USA|🇺🇸
Félix Auger-Aliassime|Men|Canada|🇨🇦
Stan Wawrinka|Men|3 Grand Slams|🇨🇭
Nick Kyrgios|Men|Showman|🇦🇺
Ben Shelton|Men|Big serve|🇺🇸
Serena Williams|Women|23 Grand Slams|🇺🇸
Venus Williams|Women|5× Wimbledon|🇺🇸
Steffi Graf|Women|1988 Golden Slam|🇩🇪
Iga Świątek|Women|Poland|🇵🇱
Aryna Sabalenka|Women|Power hitter|🇧🇾
Coco Gauff|Women|2023 US Open|🇺🇸
Maria Sharapova|Women|5 Grand Slams|🇷🇺
Naomi Osaka|Women|4 Grand Slams|🇯🇵
Bianca Andreescu|Women|2019 US Open|🇨🇦
Leylah Fernandez|Women|Canada|🇨🇦
Martina Navratilova|Women|9× Wimbledon|🇺🇸
Elena Rybakina|Women|2022 Wimbledon|🇰🇿
Ons Jabeur|Women|Tunisia|🇹🇳
Emma Raducanu|Women|2021 US Open|🇬🇧
Madison Keys|Women|2025 Australian Open|🇺🇸`), mkTopic('t-f1', 'F1 Drivers', '🏁', 'Current, Current, Legend', 'list', 'emoji', `
Max Verstappen|Current|Netherlands|🇳🇱
Lewis Hamilton|Current|7× world champion|🇬🇧
Charles Leclerc|Current|Monaco|🇲🇨
Lando Norris|Current|Britain|🇬🇧
Oscar Piastri|Current|Australia|🇦🇺
George Russell|Current|Britain|🇬🇧
Fernando Alonso|Current|2× world champion|🇪🇸
Carlos Sainz|Current|Spain|🇪🇸
Lance Stroll|Current|Canada|🇨🇦
Pierre Gasly|Current|France|🇫🇷
Esteban Ocon|Current|France|🇫🇷
Kimi Antonelli|Current|Italy|🇮🇹
Oliver Bearman|Current|Britain|🇬🇧
Alex Albon|Current|Thailand|🇹🇭
Yuki Tsunoda|Current|Japan|🇯🇵
Nico Hülkenberg|Current|Germany|🇩🇪
Michael Schumacher|Legend|7× world champion|🇩🇪
Ayrton Senna|Legend|3× world champion|🇧🇷
Alain Prost|Legend|4× world champion|🇫🇷
Niki Lauda|Legend|3× world champion|🇦🇹
Sebastian Vettel|Legend|4× world champion|🇩🇪
Kimi Räikkönen|Legend|2007 world champion|🇫🇮
Jenson Button|Legend|2009 world champion|🇬🇧
Nigel Mansell|Legend|1992 world champion|🇬🇧
Mika Häkkinen|Legend|2× world champion|🇫🇮
Juan Manuel Fangio|Legend|5× world champion|🇦🇷
Jackie Stewart|Legend|3× world champion|🇬🇧
Nico Rosberg|Legend|2016 world champion|🇩🇪
Jacques Villeneuve|Legend|1997 world champion|🇨🇦
Gilles Villeneuve|Legend|Ferrari legend|🇨🇦`), mkTopic('t-fight', 'Boxing & UFC Fighters', '🥊', 'Boxing, Boxing, UFC, UFC', 'list', 'emoji', `
Muhammad Ali|Boxing|The Greatest|🇺🇸
Mike Tyson|Boxing|Iron Mike|🇺🇸
Floyd Mayweather|Boxing|50-0|🇺🇸
Manny Pacquiao|Boxing|8-division champion|🇵🇭
Canelo Álvarez|Boxing|Mexico|🇲🇽
Tyson Fury|Boxing|The Gypsy King|🇬🇧
Anthony Joshua|Boxing|2× heavyweight champ|🇬🇧
Oleksandr Usyk|Boxing|Undisputed|🇺🇦
Naoya Inoue|Boxing|The Monster|🇯🇵
Terence Crawford|Boxing|Undisputed|🇺🇸
Sugar Ray Leonard|Boxing|Legend|🇺🇸
Lennox Lewis|Boxing|Heavyweight king|🇬🇧
Prince Naseem Hamed|Boxing|The Prince|🇬🇧
Gervonta Davis|Boxing|Tank|🇺🇸
Amir Khan|Boxing|Olympic silver|🇬🇧
Khabib Nurmagomedov|UFC|29-0|🇷🇺
Conor McGregor|UFC|The Notorious|🇮🇪
Jon Jones|UFC|Bones|🇺🇸
Georges St-Pierre|UFC|GSP · Canada|🇨🇦
Anderson Silva|UFC|The Spider|🇧🇷
Islam Makhachev|UFC|Lightweight king|🇷🇺
Israel Adesanya|UFC|The Last Stylebender|🇳🇬
Alex Pereira|UFC|Poatan|🇧🇷
Francis Ngannou|UFC|The Predator|🇨🇲
Khamzat Chimaev|UFC|Borz|🇦🇪
Ilia Topuria|UFC|El Matador|🇪🇸
Daniel Cormier|UFC|DC|🇺🇸
Ronda Rousey|UFC|Rowdy|🇺🇸
Amanda Nunes|UFC|The Lioness|🇧🇷
Valentina Shevchenko|UFC|Bullet|🇰🇬`), mkTopic('t-crk', 'Cricket Players', '🏏', 'BAT, BAT, WK, BOWL, BOWL, AR', 'list', 'kit', `
Virat Kohli|BAT|India · King Kohli
Rohit Sharma|BAT|India · Hitman
Babar Azam|BAT|Pakistan
Joe Root|BAT|England
Steve Smith|BAT|Australia
Kane Williamson|BAT|New Zealand
Sachin Tendulkar|BAT|India · Master Blaster
Brian Lara|BAT|West Indies · 400*
Shubman Gill|BAT|India
Travis Head|BAT|Australia
MS Dhoni|WK|India · Captain Cool
Rishabh Pant|WK|India
Jos Buttler|WK|England
Quinton de Kock|WK|South Africa
Adam Gilchrist|WK|Australia
Mohammad Rizwan|WK|Pakistan
Jasprit Bumrah|BOWL|India
Shaheen Afridi|BOWL|Pakistan
Pat Cummins|BOWL|Australia
Mitchell Starc|BOWL|Australia
James Anderson|BOWL|England · 700 Test wickets
Rashid Khan|BOWL|Afghanistan
Shane Warne|BOWL|Australia · spin king
Muttiah Muralitharan|BOWL|Sri Lanka · 800 Test wickets
Wasim Akram|BOWL|Pakistan · Sultan of Swing
Kagiso Rabada|BOWL|South Africa
Ben Stokes|AR|England
Shakib Al Hasan|AR|Bangladesh
Hardik Pandya|AR|India
Jacques Kallis|AR|South Africa
Ravindra Jadeja|AR|India
Glenn Maxwell|AR|Australia · Big Show`), mkTopic('t-fruit', 'Fruits', '🍓', 'Fruit 1, Fruit 2, Fruit 3, Fruit 4', 'list', 'emoji', `
Mango||King of fruits|🥭
Strawberry||Summer classic|🍓
Watermelon||Hydration|🍉
Pineapple||Tropical|🍍
Banana||Potassium|🍌
Apple||Red and crunchy|🍎
Green Apple||Sour crunch|🍏
Grapes||Bite-size|🍇
Orange||Vitamin C|🍊
Kiwi||Fuzzy outside|🥝
Peach||Juicy|🍑
Cherry||Pit included|🍒
Blueberry||Superfood|🫐
Coconut||Tropical|🥥
Lemon||Sour|🍋
Pear||Underrated|🍐
Avocado||Technically a fruit|🥑
Melon||Honeydew|🍈
Tomato||Technically a fruit|🍅
Pomegranate||Ruby seeds|❤️
Dragon Fruit||Pink and spotty|🐉
Lychee||Sweet and floral|🤍
Papaya||Tropical|🧡
Guava||Tropical|💚
Fig||Sweet|💜
Dates||Iftar essential|🌴
Passion Fruit||Tangy|💛
Raspberry||Tart|🩷
Blackberry||Dark berry|🖤
Plum||Juicy|🟣`), mkTopic('t-bfast', 'Breakfast', '🥞', 'Plate 1, Plate 2, Plate 3', 'list', 'emoji', `
Pancakes||Maple syrup|🥞
Waffles||Crispy squares|🧇
French Toast||Cinnamon|🍞
Eggs Benedict||Hollandaise|🍳
Full English||Fry-up|🍳
Bagel & Cream Cheese||Classic|🥯
Croissant||Buttery|🥐
Cereal||Milk first or cereal first|🥣
Oatmeal||Healthy start|🥣
Avocado Toast||Brunch|🥑
Breakfast Burrito||Wrapped up|🌯
Shakshuka||Eggs in tomato sauce|🍳
Halwa Puri||Weekend special|🫓
Paratha & Chai||Desi classic|🫓
Ful Medames||Fava beans|🫘
Manakish||Za'atar flatbread|🫓
Hash Browns||Crispy potato|🥔
Chicken & Waffles||Sweet and savoury|🍗
Smoothie Bowl||Fruit and granola|🫐
Yogurt Parfait||Layers|🍨
Beef Sausages||Sizzling|🌭
Egg McMuffin||Drive-thru|🍔
Breakfast Sandwich||On the go|🥪
Crêpes||Nutella|🥞
Nasi Lemak||Malaysia|🍚
Congee||Rice porridge|🍚
Masala Dosa||South India|🫓
Chilaquiles||Mexico|🌮
Granola||Crunchy|🥣
Fruit Salad||Fresh|🍉`), mkTopic('t-dess', 'Desserts', '🍰', 'Dessert 1, Dessert 2, Dessert 3, Dessert 4', 'list', 'emoji', `
Cheesecake||New York style|🍰
Brownie||Fudgy|🍫
Chocolate Chip Cookie||Warm|🍪
Ice Cream Sundae||Whipped cream|🍨
Gelato||Italian|🍦
Donut||Glazed|🍩
Cupcake||Frosting|🧁
Apple Pie||With ice cream|🥧
Cinnamon Roll||Gooey|🌀
Macarons||French|🌸
Churros||Dip in chocolate|🥖
Tres Leches||Three milks|🍰
Kunafa||Cheese and syrup|🧀
Baklava||Pistachio|🍯
Gulab Jamun||Syrupy|🍡
Rasmalai||Creamy|🥛
Mochi||Chewy|🍡
Nutella Crêpe||Folded|🥞
Banana Split||Three scoops|🍌
Lava Cake||Molten centre|🌋
Red Velvet Cake||Cream cheese frosting|🎂
Pavlova||Meringue|☁️
Key Lime Pie||Tangy|🥧
Funnel Cake||Fair food|🎡
Milkshake||Thick|🥤
Bubble Waffle||Hong Kong street food|🧇
Sticky Toffee Pudding||British classic|🍮
Butter Tart||Canadian classic|🥧
Nanaimo Bar||Canadian classic|🍫
Crème Caramel||Wobbly|🍮`), mkTopic('t-pizza', 'Pizza Toppings', '🍕', 'Topping 1, Topping 2, Topping 3', 'list', 'emoji', `
Pepperoni||The classic|🍕
Mushrooms||Earthy|🍄
Onions||Sweet when baked|🧅
Green Peppers||Crunchy|🫑
Black Olives||Salty|🫒
Pineapple||Controversial|🍍
Extra Cheese||Always|🧀
Jalapeños||Spicy|🌶️
Spinach||Green|🥬
Tomatoes||Fresh|🍅
Chicken||Grilled|🍗
Ground Beef||Hearty|🥩
Beef Sausage||Italian style|🌭
Garlic||Roasted|🧄
Basil||Fresh leaves|🌿
Corn||Sweet|🌽
Anchovies||Love or hate|🐟
Turkey Bacon||Crispy|🥓
Feta||Greek style|🧀
Hot Honey||Sweet heat|🍯
BBQ Sauce||Smoky|🥫
Ranch Drizzle||Creamy|🥛
Banana Peppers||Tangy|🌶️
Sun-Dried Tomatoes||Intense|🍅
Artichokes||Fancy|🌱
Shrimp||Seafood|🍤
Red Onions||Sharp|🧅
Paneer||Tikka style|🧀
Donair Meat||East Coast style|🥙
Butter Chicken||Fusion|🍛`), mkTopic('t-anim', 'Animated Movies', '🍿', 'Movie 1, Movie 2, Movie 3, Movie 4', 'list', 'emoji', `
Toy Story||1995|🤠
Shrek||2001|🧅
Finding Nemo||2003|🐠
The Lion King||1994|🦁
Up||2009|🎈
Frozen||2013|❄️
Into the Spider-Verse||2018|🕷️
Coco||2017|🎸
Inside Out||2015|😄
Ratatouille||2007|🐀
WALL-E||2008|🤖
Monsters, Inc.||2001|👁️
The Incredibles||2004|🦸
Kung Fu Panda||2008|🐼
Despicable Me||2010|🍌
How to Train Your Dragon||2010|🐉
Moana||2016|🌊
Zootopia||2016|🦊
Cars||2006|🏎️
Spirited Away||2001|🏮
Your Name||2016|☄️
Aladdin||1992|🧞
Madagascar||2005|🦓
Ice Age||2002|🦣
Megamind||2010|🧠
The Lego Movie||2014|🧱
Encanto||2021|🦋
Puss in Boots: The Last Wish||2022|🐱
Big Hero 6||2014|🩹
Tangled||2010|💇`), mkTopic('t-ctry', 'Countries', '🌍', 'Europe, Asia, Africa, Americas, FLEX', 'list', 'emoji', `
Italy|Europe|Capital: Rome|🇮🇹
Spain|Europe|Capital: Madrid|🇪🇸
France|Europe|Capital: Paris|🇫🇷
United Kingdom|Europe|Capital: London|🇬🇧
Germany|Europe|Capital: Berlin|🇩🇪
Turkey|Europe|Capital: Ankara|🇹🇷
Portugal|Europe|Capital: Lisbon|🇵🇹
Greece|Europe|Capital: Athens|🇬🇷
Netherlands|Europe|Capital: Amsterdam|🇳🇱
Switzerland|Europe|Capital: Bern|🇨🇭
Japan|Asia|Capital: Tokyo|🇯🇵
South Korea|Asia|Capital: Seoul|🇰🇷
Saudi Arabia|Asia|Capital: Riyadh|🇸🇦
UAE|Asia|Capital: Abu Dhabi|🇦🇪
Pakistan|Asia|Capital: Islamabad|🇵🇰
India|Asia|Capital: New Delhi|🇮🇳
Indonesia|Asia|Capital: Jakarta|🇮🇩
Malaysia|Asia|Capital: Kuala Lumpur|🇲🇾
Thailand|Asia|Capital: Bangkok|🇹🇭
China|Asia|Capital: Beijing|🇨🇳
Morocco|Africa|Capital: Rabat|🇲🇦
Egypt|Africa|Capital: Cairo|🇪🇬
Nigeria|Africa|Capital: Abuja|🇳🇬
South Africa|Africa|Capital: Pretoria|🇿🇦
Kenya|Africa|Capital: Nairobi|🇰🇪
Ghana|Africa|Capital: Accra|🇬🇭
Canada|Americas|Capital: Ottawa|🇨🇦
USA|Americas|Capital: Washington, D.C.|🇺🇸
Mexico|Americas|Capital: Mexico City|🇲🇽
Brazil|Americas|Capital: Brasília|🇧🇷
Argentina|Americas|Capital: Buenos Aires|🇦🇷
Jamaica|Americas|Capital: Kingston|🇯🇲`), mkTopic('t-pet', 'Pets', '🐶', 'Dog, Cat, Other, FLEX', 'list', 'emoji', `
Golden Retriever|Dog|Best friend|🐕
German Shepherd|Dog|Loyal guard|🐕‍🦺
Husky|Dog|Dramatic|🐺
French Bulldog|Dog|Snorts a lot|🐶
Pomeranian|Dog|Tiny fluffball|🐶
Persian Cat|Cat|Fluffy royalty|🐈
Siamese Cat|Cat|Chatty|🐈
Maine Coon|Cat|Giant cat|🐈
Sphynx Cat|Cat|No fur|🐱
Ragdoll Cat|Cat|Goes floppy|🐈
Rabbit|Other|Hops|🐇
Hamster|Other|Wheel runner|🐹
Guinea Pig|Other|Squeaks|🐹
Parrot|Other|Talks back|🦜
Budgie|Other|Small and chirpy|🐦
Goldfish|Other|Low maintenance|🐠
Turtle|Other|Lives forever|🐢
Bearded Dragon|Other|Chill lizard|🦎
Snake|Other|Not for everyone|🐍
Ferret|Other|Chaos noodle|🦦
Hedgehog|Other|Spiky|🦔
Horse|Other|Needs a field|🐎
Mini Pig|Other|Smart|🐖
Goat|Other|Eats everything|🐐
Chicken|Other|Free eggs|🐔
Duck|Other|Quack|🦆
Axolotl|Other|Smiling salamander|🩷
Tarantula|Other|Eight legs|🕷️
Chinchilla|Other|Softest fur|🐭
Capybara|Other|Friends with everyone|🦫`), mkTopic('t-job', 'Dream Jobs', '💼', 'Job 1, Job 2, Job 3', 'list', 'emoji', `
Astronaut||Space|🚀
Pro Footballer||Sport|⚽
Doctor||Medicine|🩺
Pilot||Travel|✈️
Software Engineer||Tech|💻
YouTuber||Content|📹
Chef||Food|🧑‍🍳
Firefighter||Hero|🚒
Lawyer||Law|⚖️
Architect||Design|📐
Game Developer||Tech|🎮
Actor||Film|🎬
Musician||Music|🎸
Marine Biologist||Science|🐠
Detective||Mystery|🕵️
Teacher||Education|🍎
Entrepreneur||Business|💼
Photographer||Art|📸
Vet||Animals|🐾
Fashion Designer||Style|👗
F1 Engineer||Motorsport|🏎️
Archaeologist||History|🏺
Stock Trader||Finance|📈
Scientist||Research|🔬
Dentist||Medicine|🦷
Real Estate Agent||Property|🏠
Travel Blogger||Travel|🧳
Sports Commentator||Media|🎙️
Spy||Top secret|🕶️
Zookeeper||Animals|🦒`), mkTopic('t-zomb', 'Zombie Apocalypse Kit', '🧟', 'Weapon, Tool, Supply, Supply, FLEX', 'list', 'emoji', `
Baseball Bat|Weapon|Classic|⚾
Crowbar|Weapon|Opens doors too|🪛
Katana|Weapon|Sharp|⚔️
Frying Pan|Weapon|Cook and fight|🍳
Bow & Arrow|Weapon|Silent|🏹
Chainsaw|Weapon|Loud|🪚
Hockey Stick|Weapon|Canadian option|🏒
Pickaxe|Weapon|Heavy|⛏️
Flashlight|Tool|See in the dark|🔦
Rope|Tool|Climb and tie|🪢
Map|Tool|Know where to go|🗺️
Compass|Tool|Find north|🧭
Radio|Tool|Find survivors|📻
Lighter|Tool|Make fire|🔥
Toolbox|Tool|Fix anything|🧰
Binoculars|Tool|Spot them first|🔭
Pocket Knife|Tool|Multi-tool|🔪
Canned Food|Supply|Lasts years|🥫
Water Bottles|Supply|Stay alive|💧
First Aid Kit|Supply|Patch up|🩹
Batteries|Supply|Power|🔋
Energy Bars|Supply|Quick food|🍫
Sleeping Bag|Supply|Rest|🛌
Duct Tape|Supply|Fixes everything|🩶
Dog|FLEX|Loyal lookout|🐕
Bicycle|FLEX|Silent travel|🚲
Motorbike|FLEX|Fast escape|🏍️
Shopping Cart|FLEX|Carry loot|🛒
Walkie-Talkies|FLEX|Stay in touch|📡
Night-Vision Goggles|FLEX|See everything|🥽`)];
}
function baseTopics() {
  return [mkTopic('t-pl', 'Premier League Legends (5-a-side)', '🏆', 'GK, DEF, MID, FWD, FLEX', 'pitch', 'kit', `
Peter Schmeichel|GK|Man Utd · 1991–99
Petr Čech|GK|Chelsea · 2004–15
Edwin van der Sar|GK|Man Utd · 2005–11
David Seaman|GK|Arsenal · 1990–2003
Shay Given|GK|Newcastle · 1997–2009
John Terry|DEF|Chelsea · 1998–2017
Rio Ferdinand|DEF|Man Utd · 2002–14
Nemanja Vidić|DEF|Man Utd · 2006–14
Vincent Kompany|DEF|Man City · 2008–19
Tony Adams|DEF|Arsenal captain
Ashley Cole|DEF|Arsenal & Chelsea
Sol Campbell|DEF|Spurs & Arsenal
Jamie Carragher|DEF|Liverpool one-club man
Steven Gerrard|MID|Liverpool · 1998–2015
Frank Lampard|MID|Chelsea · 2001–14
Paul Scholes|MID|Man Utd · 1993–2013
Patrick Vieira|MID|Arsenal · 1996–2005
Roy Keane|MID|Man Utd · 1993–2005
Cesc Fàbregas|MID|Arsenal & Chelsea
David Beckham|MID|Man Utd · 1992–2003
Ryan Giggs|MID|Man Utd · 13 league titles
Yaya Touré|MID|Man City · 2010–18
David Silva|MID|Man City · 2010–20
Thierry Henry|FWD|Arsenal · 4× Golden Boot
Alan Shearer|FWD|Newcastle · record 260 PL goals
Wayne Rooney|FWD|Man Utd · 2004–17
Didier Drogba|FWD|Chelsea · 2004–12
Cristiano Ronaldo|FWD|Man Utd · 2003–09
Sergio Agüero|FWD|Man City · 2011–21
Dennis Bergkamp|FWD|Arsenal · 1995–2006
Eric Cantona|FWD|Man Utd · 1992–97`), mkTopic('t-cf', 'Current Footballers', '⚽', 'GK, DEF, DEF, MID, MID, FWD', 'pitch', 'kit', `
Alisson|GK|Brazil
Gianluigi Donnarumma|GK|Italy
Thibaut Courtois|GK|Belgium
Mike Maignan|GK|France
Emiliano Martínez|GK|Argentina
Virgil van Dijk|DEF|Netherlands
William Saliba|DEF|France
Rúben Dias|DEF|Portugal
Achraf Hakimi|DEF|Morocco
Trent Alexander-Arnold|DEF|England
Alessandro Bastoni|DEF|Italy
Joško Gvardiol|DEF|Croatia
Antonio Rüdiger|DEF|Germany
Jude Bellingham|MID|England
Rodri|MID|Spain · 2024 Ballon d'Or
Pedri|MID|Spain
Declan Rice|MID|England
Federico Valverde|MID|Uruguay
Florian Wirtz|MID|Germany
Jamal Musiala|MID|Germany
Bruno Fernandes|MID|Portugal
Vitinha|MID|Portugal
Kylian Mbappé|FWD|France
Erling Haaland|FWD|Norway
Mohamed Salah|FWD|Egypt
Vinícius Júnior|FWD|Brazil
Lamine Yamal|FWD|Spain
Harry Kane|FWD|England
Bukayo Saka|FWD|England
Ousmane Dembélé|FWD|France · 2025 Ballon d'Or`), mkTopic('t-nba', 'NBA Players', '🏀', 'G, G, F, F, C', 'list', 'kit', `
Stephen Curry|G|USA · 2× MVP
Luka Dončić|G|Slovenia · 2024 scoring champ
Shai Gilgeous-Alexander|G|Canada · 2025 MVP
Jalen Brunson|G|USA · All-Star guard
Anthony Edwards|G|USA · All-Star guard
Tyrese Haliburton|G|USA · All-Star guard
Ja Morant|G|USA · 2022 Most Improved
Damian Lillard|G|USA · Dame Time
Kyrie Irving|G|USA · 2016 champion
Donovan Mitchell|G|USA · All-Star guard
Devin Booker|G|USA · 70-point game
LeBron James|F|USA · 4× champion
Kevin Durant|F|USA · 2× Finals MVP
Giannis Antetokounmpo|F|Greece · 2× MVP
Jayson Tatum|F|USA · 2024 champion
Kawhi Leonard|F|USA · 2× Finals MVP
Jimmy Butler|F|USA · Playoff Jimmy
Paolo Banchero|F|USA · 2023 Rookie of the Year
Zion Williamson|F|USA · 2019 No. 1 pick
Jaylen Brown|F|USA · 2024 Finals MVP
Paul George|F|USA · All-NBA wing
Nikola Jokić|C|Serbia · 3× MVP
Joel Embiid|C|Cameroon · 2023 MVP
Victor Wembanyama|C|France · 2024 Rookie of the Year
Anthony Davis|C|USA · 2020 champion
Bam Adebayo|C|USA · Olympic gold
Domantas Sabonis|C|Lithuania · rebounding machine
Karl-Anthony Towns|C|Dominican Rep. · stretch big
Chet Holmgren|C|USA · 2025 champion
Rudy Gobert|C|France · 4× Defensive POY`, {
    kitShape: 'tank'
  }), mkTopic('t-ff', 'Fast Food Items', '🍔', 'Main, Main, Side, Drink, Dessert', 'list', 'emoji', `
Big Mac|Main|McDonald's|🍔
Whopper|Main|Burger King|🍔
Baconator|Main|Wendy's|🥓
Crunchwrap Supreme|Main|Taco Bell|🌯
Chicken Sandwich|Main|Popeyes|🍗
Chick-fil-A Sandwich|Main|Chick-fil-A|🐔
Double-Double|Main|In-N-Out|🍔
Teen Burger|Main|A&W|🍔
Burrito Bowl|Main|Chipotle|🥗
Zinger|Main|KFC|🌶️
Italian B.M.T.|Main|Subway|🥖
Fries|Side|McDonald's|🍟
Poutine|Side|New York Fries|🧀
Onion Rings|Side|Burger King|🧅
Chicken McNuggets|Side|McDonald's|🍗
Cajun Fries|Side|Popeyes|🌶️
Waffle Fries|Side|Chick-fil-A|🧇
Hash Brown|Side|McDonald's|🥔
Nacho Fries|Side|Taco Bell|🧀
Iced Capp|Drink|Tim Hortons|🧋
Root Beer|Drink|A&W|🥤
Baja Blast|Drink|Taco Bell|🫧
Double-Double Coffee|Drink|Tim Hortons|☕
Frosted Lemonade|Drink|Chick-fil-A|🍋
McFlurry|Dessert|McDonald's|🍦
Frosty|Dessert|Wendy's|🍨
Timbits|Dessert|Tim Hortons|🍩
Blizzard|Dessert|Dairy Queen|🍦
Baked Apple Pie|Dessert|McDonald's|🥧
Cinnabon Delights|Dessert|Taco Bell|🥐`), ...moreTopics()];
}
function moreTopics() {
  return [mkTopic('t-goat', 'Football GOATs', '🐐', 'GK, DEF, DEF, MID, MID, FWD', 'pitch', 'kit', `
Lev Yashin|GK|Soviet Union · 1963 Ballon d'Or
Gianluigi Buffon|GK|Italy · 2006 World Cup
Manuel Neuer|GK|Germany · 2014 World Cup
Iker Casillas|GK|Spain · 2010 World Cup
Oliver Kahn|GK|Germany · 2002 Golden Ball
Paolo Maldini|DEF|Italy · 5× European champion
Franz Beckenbauer|DEF|Germany · Der Kaiser
Sergio Ramos|DEF|Spain · 4× Champions League
Cafu|DEF|Brazil · 2× World Cup
Roberto Carlos|DEF|Brazil · that free kick
Fabio Cannavaro|DEF|Italy · 2006 Ballon d'Or
Carles Puyol|DEF|Spain · 2010 World Cup
Philipp Lahm|DEF|Germany · 2014 World Cup captain
Zinedine Zidane|MID|France · 1998 World Cup
Johan Cruyff|MID|Netherlands · 3× Ballon d'Or
Andrés Iniesta|MID|Spain · 2010 World Cup winner
Xavi|MID|Spain · tiki-taka
Luka Modrić|MID|Croatia · 2018 Ballon d'Or
Andrea Pirlo|MID|Italy · the Architect
Kaká|MID|Brazil · 2007 Ballon d'Or
Ronaldinho|MID|Brazil · 2005 Ballon d'Or
Diego Maradona|MID|Argentina · 1986 World Cup
Lothar Matthäus|MID|Germany · 1990 World Cup
Lionel Messi|FWD|Argentina · 8× Ballon d'Or
Cristiano Ronaldo|FWD|Portugal · 5× Ballon d'Or
Pelé|FWD|Brazil · 3× World Cup
Ronaldo Nazário|FWD|Brazil · R9
Zlatan Ibrahimović|FWD|Sweden · 500+ goals
Robert Lewandowski|FWD|Poland · goal machine
Marco van Basten|FWD|Netherlands · 3× Ballon d'Or
Karim Benzema|FWD|France · 2022 Ballon d'Or`), mkTopic('t-nbal', 'NBA Legends', '🏅', 'G, G, F, F, C', 'list', 'kit', `
Michael Jordan|G|USA · 6× champion
Kobe Bryant|G|USA · 5× champion
Magic Johnson|G|USA · 5× champion
Allen Iverson|G|USA · 2001 MVP
Dwyane Wade|G|USA · 3× champion
Steve Nash|G|Canada · 2× MVP
Jerry West|G|USA · the Logo
Isiah Thomas|G|USA · 2× champion
Jason Kidd|G|USA · triple-double king
Gary Payton|G|USA · 1996 Defensive POY
Vince Carter|G|USA · Vinsanity
Larry Bird|F|USA · 3× MVP
Tim Duncan|F|US Virgin Islands · 5× champion
Kevin Garnett|F|USA · 2004 MVP
Dirk Nowitzki|F|Germany · 2011 Finals MVP
Charles Barkley|F|USA · 1993 MVP
Scottie Pippen|F|USA · 6× champion
Julius Erving|F|USA · Dr. J
Karl Malone|F|USA · 2× MVP
Dennis Rodman|F|USA · rebounding king
Shaquille O'Neal|C|USA · 4× champion
Kareem Abdul-Jabbar|C|USA · 6× MVP
Hakeem Olajuwon|C|Nigeria · 2× Finals MVP
Wilt Chamberlain|C|USA · 100-point game
Bill Russell|C|USA · 11× champion
Patrick Ewing|C|USA · Hall of Famer
David Robinson|C|USA · 1995 MVP
Moses Malone|C|USA · 3× MVP
Dikembe Mutombo|C|DR Congo · 4× Defensive POY
Yao Ming|C|China · Hall of Famer`, {
    kitShape: 'tank'
  }), mkTopic('t-nhl', 'NHL Players', '🏒', 'G, D, D, F, F, F', 'list', 'kit', `
Connor Hellebuyck|G|USA · 2025 Hart Trophy
Igor Shesterkin|G|Russia · Vezina winner
Andrei Vasilevskiy|G|Russia · 2× Stanley Cup
Juuse Saros|G|Finland
Jake Oettinger|G|USA
Cale Makar|D|Canada · Norris winner
Quinn Hughes|D|USA · Norris winner
Adam Fox|D|USA · Norris winner
Victor Hedman|D|Sweden · 2× Stanley Cup
Roman Josi|D|Switzerland · Norris winner
Miro Heiskanen|D|Finland
Rasmus Dahlin|D|Sweden · 2018 No. 1 pick
Zach Werenski|D|USA
Evan Bouchard|D|Canada
Connor McDavid|F|Canada · Hart Trophy winner
Nathan MacKinnon|F|Canada · 2024 Hart Trophy
Auston Matthews|F|USA · 2022 Hart Trophy
Leon Draisaitl|F|Germany · 2020 Hart Trophy
Nikita Kucherov|F|Russia · 2× Stanley Cup
David Pastrňák|F|Czechia · sniper
Sidney Crosby|F|Canada · 3× Stanley Cup
Alex Ovechkin|F|Russia · all-time goals leader
Mitch Marner|F|Canada · playmaker
William Nylander|F|Sweden
Matthew Tkachuk|F|USA · 2× Stanley Cup
Jack Hughes|F|USA · 2019 No. 1 pick
Kirill Kaprizov|F|Russia
Macklin Celebrini|F|Canada · 2024 No. 1 pick
Connor Bedard|F|Canada · 2024 Calder Trophy
Jack Eichel|F|USA · 2023 Stanley Cup`), mkTopic('t-nfl', 'NFL Stars', '🏈', 'QB, RB, WR, WR, TE, DEF', 'list', 'kit', `
Patrick Mahomes|QB|3× Super Bowl champ
Josh Allen|QB|2024 MVP
Lamar Jackson|QB|2× MVP
Joe Burrow|QB|Franchise QB
Jalen Hurts|QB|Super Bowl LIX MVP
Tom Brady|QB|7× Super Bowl champ
Peyton Manning|QB|5× MVP
Saquon Barkley|RB|2,000-yard season
Derrick Henry|RB|King Henry
Christian McCaffrey|RB|2023 Offensive POY
Bijan Robinson|RB|Dual threat
Jahmyr Gibbs|RB|Home-run speed
Justin Jefferson|WR|Route-running wizard
Ja'Marr Chase|WR|Triple crown receiver
CeeDee Lamb|WR|Star receiver
Tyreek Hill|WR|The Cheetah
Jerry Rice|WR|All-time receiving leader
Randy Moss|WR|Deep-ball legend
Puka Nacua|WR|Rookie record breaker
Amon-Ra St. Brown|WR|Catch machine
Travis Kelce|TE|3× Super Bowl champ
George Kittle|TE|All-Pro tight end
Rob Gronkowski|TE|4× Super Bowl champ
Brock Bowers|TE|Rookie record holder
Aaron Donald|DEF|3× Defensive POY
T.J. Watt|DEF|2021 Defensive POY
Myles Garrett|DEF|2023 Defensive POY
Micah Parsons|DEF|Pass rusher
Lawrence Taylor|DEF|1986 MVP
Ray Lewis|DEF|2× Super Bowl champ`), mkTopic('t-club', 'Football Clubs', '🏟️', 'ENG, ESP, ITA, GER, FLEX', 'list', 'kit', `
Man City|ENG|England
Arsenal|ENG|England
Liverpool|ENG|England
Man Utd|ENG|England
Chelsea|ENG|England
Tottenham|ENG|England
Newcastle|ENG|England
Aston Villa|ENG|England
Real Madrid|ESP|Spain
Barcelona|ESP|Spain
Atlético Madrid|ESP|Spain
Sevilla|ESP|Spain
Real Sociedad|ESP|Spain
Inter|ITA|Italy
AC Milan|ITA|Italy
Juventus|ITA|Italy
Napoli|ITA|Italy
Roma|ITA|Italy
Bayern Munich|GER|Germany
Dortmund|GER|Germany
Bayer Leverkusen|GER|Germany
RB Leipzig|GER|Germany
PSG|FLEX|France
Ajax|FLEX|Netherlands
Benfica|FLEX|Portugal
Porto|FLEX|Portugal
Celtic|FLEX|Scotland
Al Nassr|FLEX|Saudi Arabia
Inter Miami|FLEX|USA
Galatasaray|FLEX|Turkey
Boca Juniors|FLEX|Argentina`, {
    kitLabel: 'initials'
  }), mkTopic('t-rap', 'Rappers', '🎤', 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'list', 'emoji', `
Drake||Toronto|🦉
Kendrick Lamar||Compton|👑
J. Cole||Fayetteville|🌳
Travis Scott||Houston|🌵
Eminem||Detroit|🎤
Kanye West||Chicago|🐻
Jay-Z||Brooklyn|💎
Lil Wayne||New Orleans|🎺
Nicki Minaj||Queens|💖
Tupac||West Coast legend|🌹
The Notorious B.I.G.||Brooklyn legend|👑
Nas||Queensbridge|📜
Snoop Dogg||Long Beach|🐶
50 Cent||Queens|💵
Future||Atlanta|🚀
Lil Baby||Atlanta|👶
21 Savage||Atlanta|🔪
Tyler, the Creator||Los Angeles|🌸
A$AP Rocky||Harlem|🕶️
Cardi B||The Bronx|💅
Megan Thee Stallion||Houston|🐎
Post Malone||Dallas|🎸
Juice WRLD||Chicago|🌍
Pop Smoke||Brooklyn|💨
Central Cee||London|🇬🇧
Stormzy||London|⚡
Dave||London|🎹
Playboi Carti||Atlanta|🧛
Dr. Dre||Compton|🎧
Metro Boomin||Producer|🎛️`), mkTopic('t-ani', 'Animal Fight Squad', '🦁', 'Land, Land, Sea, Air, FLEX', 'list', 'emoji', `
Lion|Land|King of the jungle|🦁
Tiger|Land|Biggest cat alive|🐅
Grizzly Bear|Land|Half a tonne of muscle|🐻
Gorilla|Land|Silverback strength|🦍
Elephant|Land|Biggest land animal|🐘
Rhino|Land|Armoured tank|🦏
Hippo|Land|Scarier than it looks|🦛
Wolf|Land|Hunts in packs|🐺
Honey Badger|Land|Fears nothing|🦡
Komodo Dragon|Land|Venomous bite|🦎
Crocodile|Land|Death roll|🐊
Kangaroo|Land|Kickboxer|🦘
Bull|Land|Pure charge|🐂
Cheetah|Land|Fastest on land|🐆
Great White Shark|Sea|Apex predator|🦈
Orca|Sea|Hunts sharks|🐋
Giant Squid|Sea|Deep-sea monster|🦑
Octopus|Sea|Eight arms, big brain|🐙
Blue Whale|Sea|Largest animal ever|🐳
Swordfish|Sea|Built-in blade|🐟
Pufferfish|Sea|Poisonous|🐡
Dolphin|Sea|Smartest in the sea|🐬
Bald Eagle|Air|Talons of steel|🦅
Owl|Air|Silent hunter|🦉
Bat|Air|Echolocation|🦇
Swan|Air|Surprisingly violent|🦢
Parrot|Air|Trash talker|🦜
Flamingo|Air|Stands on one leg|🦩
Mosquito|Air|Deadliest animal|🦟
Hornet|Air|Painful sting|🐝`), mkTopic('t-pow', 'Superpowers', '⚡', 'Power 1, Power 2, Power 3', 'list', 'emoji', `
Flight||Go anywhere by air|🕊️
Invisibility||Nobody sees you|👻
Teleportation||Instant travel|🌀
Time Travel||Past and future|⏳
Super Strength||Lift a bus|💪
Mind Reading||Hear every thought|🧠
Super Speed||Faster than sound|⚡
Healing||Fix any wound|💚
Immortality||Live forever|♾️
Shapeshifting||Become anyone|🦎
Telekinesis||Move things with your mind|🪄
Freeze Time||Pause the world|⏸️
X-Ray Vision||See through walls|👁️
Control Weather||Storms on demand|⛈️
Fire Powers||Throw fireballs|🔥
Ice Powers||Freeze anything|❄️
Talk to Animals||Every species|🐾
Speak Every Language||Fluent in all of them|🗣️
Super Intelligence||Smartest person alive|🤓
Mind Control||Bend anyone's will|🎭
Clone Yourself||Be in two places|👯
Elasticity||Stretch like rubber|🤸
Breathe Underwater||Live in the ocean|🫧
Night Vision||See in the dark|🌙
Super Luck||Always win|🍀
Force Field||Nothing can hurt you|🛡️
Laser Eyes||Pew pew|🔴
Infinite Money||Never broke again|💸
Never Need Sleep||24 hours a day|😴
Photographic Memory||Remember everything|📸`), mkTopic('t-trav', 'Travel Destinations', '✈️', 'City, City, Beach, Nature, FLEX', 'list', 'emoji', `
Tokyo|City|Japan|🇯🇵
Paris|City|France|🇫🇷
New York|City|USA|🇺🇸
Dubai|City|UAE|🇦🇪
London|City|UK|🇬🇧
Istanbul|City|Turkey|🇹🇷
Rome|City|Italy|🇮🇹
Barcelona|City|Spain|🇪🇸
Seoul|City|South Korea|🇰🇷
Bangkok|City|Thailand|🇹🇭
Marrakech|City|Morocco|🇲🇦
Cairo|City|Egypt|🇪🇬
Amsterdam|City|Netherlands|🇳🇱
Lisbon|City|Portugal|🇵🇹
Kyoto|City|Japan|⛩️
Singapore|City|Singapore|🇸🇬
Sydney|City|Australia|🇦🇺
Bali|Beach|Indonesia|🇮🇩
Maldives|Beach|Maldives|🇲🇻
Santorini|Beach|Greece|🇬🇷
Rio de Janeiro|Beach|Brazil|🇧🇷
Cancún|Beach|Mexico|🇲🇽
Bora Bora|Beach|French Polynesia|🏝️
Zanzibar|Beach|Tanzania|🇹🇿
Hawaii|Beach|USA|🌺
Banff|Nature|Canada|🇨🇦
Iceland|Nature|Northern lights|🇮🇸
Cape Town|Nature|South Africa|🇿🇦
Swiss Alps|Nature|Switzerland|🇨🇭
Machu Picchu|Nature|Peru|🇵🇪
Grand Canyon|Nature|USA|🏜️`), mkTopic('t-snk', 'Snacks & Candy', '🍫', 'Salty, Sweet, Sweet, FLEX', 'list', 'emoji', `
Doritos|Salty|Nacho cheese|🔺
Lay's Classic|Salty|Potato chips|🥔
Pringles|Salty|Once you pop|🥫
Cheetos|Salty|Cheesy|🧀
Hot Cheetos|Salty|Flamin' hot|🔥
Takis|Salty|Rolled and spicy|🌶️
Ruffles|Salty|Ridged chips|🥔
Miss Vickie's|Salty|Kettle cooked|🥔
Pretzels|Salty|Twisted|🥨
Popcorn|Salty|Movie night|🍿
Kit Kat|Sweet|Have a break|🍫
Reese's|Sweet|Peanut butter cups|🥜
Snickers|Sweet|Nougat and caramel|🍫
Kinder Bueno|Sweet|Hazelnut wafer|🍫
Twix|Sweet|Left or right|🍫
Oreos|Sweet|Twist, lick, dunk|🍪
Ferrero Rocher|Sweet|Fancy|🌰
Aero|Sweet|Bubbly chocolate|🫧
Coffee Crisp|Sweet|Canadian classic|☕
Caramilk|Sweet|Caramel secret|🍫
Mars Bar|Sweet|Caramel and nougat|🪐
Smarties|Sweet|Candy-coated|🍬
M&M's|Sweet|Melts in your mouth|🔴
Skittles|Sweet|Taste the rainbow|🌈
Sour Patch Kids|Sweet|Sour then sweet|🍬
Haribo Goldbears|Sweet|Gummy bears|🐻
Swedish Berries|Sweet|Chewy|🍓
Fuzzy Peach|Sweet|Sour sugar coat|🍑
Nerds Gummy Clusters|Sweet|Crunchy and gummy|🍭
Twizzlers|Sweet|Licorice twists|🍒`), mkTopic('t-dish', 'World Dishes', '🍛', 'Main, Main, Side, Dessert', 'list', 'emoji', `
Biryani|Main|South Asia|🍛
Sushi|Main|Japan|🍣
Pizza Margherita|Main|Italy|🍕
Ramen|Main|Japan|🍜
Tacos al Pastor|Main|Mexico|🌮
Butter Chicken|Main|India|🍗
Shawarma|Main|Middle East|🥙
Pad Thai|Main|Thailand|🍤
Pho|Main|Vietnam|🍜
Paella|Main|Spain|🥘
Jollof Rice|Main|West Africa|🍚
Korean BBQ|Main|South Korea|🥩
Kabsa|Main|Saudi Arabia|🍖
Nihari|Main|Pakistan|🍲
Dim Sum|Main|China|🥟
Mac & Cheese|Main|USA|🧀
Falafel|Side|Middle East|🧆
Poutine|Side|Canada|🍟
Samosas|Side|South Asia|🥟
Hummus|Side|Levant|🫓
Garlic Naan|Side|India|🫓
Kimchi|Side|South Korea|🥬
Baklava|Dessert|Turkey|🍯
Kunafa|Dessert|Levant|🧀
Gulab Jamun|Dessert|South Asia|🍡
Tiramisu|Dessert|Italy|🍰
Churros|Dessert|Spain|🥖
Mochi|Dessert|Japan|🍡
Crème Brûlée|Dessert|France|🍮
Pastel de Nata|Dessert|Portugal|🥧`), mkTopic('t-game', 'Video Games', '🎮', 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'list', 'emoji', `
Minecraft||2011 · sandbox|⛏️
GTA V||2013 · open world|🚗
EA Sports FC||Football|⚽
Fortnite||Battle royale|🪂
Call of Duty: Black Ops||Shooter|🎖️
Red Dead Redemption 2||2018 · western|🤠
Zelda: Breath of the Wild||2017 · adventure|🗡️
Mario Kart 8||Racing|🏎️
Elden Ring||2022 · soulslike|🐉
God of War||2018 · action|🪓
The Last of Us||2013 · story|🍄
Rocket League||Car football|🚀
Among Us||Social deduction|👨‍🚀
Pokémon Red & Blue||1996 · classic|🎒
Wii Sports||2006 · party|🎳
Tetris||1984 · puzzle|🧱
Halo 3||2007 · shooter|🪖
Spider-Man (PS4)||2018 · superhero|🕷️
NBA 2K||Basketball|🏀
Clash Royale||Mobile|👑
Overwatch||Hero shooter|🎯
League of Legends||MOBA|🏰
Valorant||Tactical shooter|💥
Apex Legends||Battle royale|🦾
Super Smash Bros. Ultimate||Fighting|🥊
Animal Crossing||Cozy|🍃
Skyrim||2011 · RPG|🛡️
Roblox||Everything|🟥
The Witcher 3||2015 · RPG|🐺
Hollow Knight||2017 · indie|🪲`), mkTopic('t-car', 'Cars', '🏎️', 'Supercar, Daily, SUV, Classic, FLEX', 'list', 'emoji', `
Lamborghini Aventador|Supercar|V12 monster|🏎️
Bugatti Chiron|Supercar|1,500 hp|🏎️
McLaren P1|Supercar|Hybrid hypercar|🏎️
Porsche 911 GT3|Supercar|Track weapon|🏎️
Koenigsegg Jesko|Supercar|Swedish rocket|🚀
Ferrari LaFerrari|Supercar|Prancing horse|🐎
Ford GT|Supercar|Le Mans legend|🏁
Toyota Corolla|Daily|Never breaks|🚗
Honda Civic|Daily|Everyone's first car|🚗
Tesla Model 3|Daily|Electric|🔋
BMW M3|Daily|Sports sedan|🚗
VW Golf GTI|Daily|Hot hatch|🚗
Hyundai Elantra N|Daily|Budget fun|🚗
Range Rover|SUV|Luxury off-roader|🚙
Mercedes G-Wagon|SUV|The box|🚙
Lamborghini Urus|SUV|Super SUV|🚙
Jeep Wrangler|SUV|Doors off|🚙
Tesla Model X|SUV|Falcon doors|🦅
Toyota Land Cruiser|SUV|Goes anywhere|🚙
Rolls-Royce Cullinan|SUV|Pure luxury|👑
Rivian R1T|SUV|Electric truck|🛻
Ferrari F40|Classic|1987 icon|🏎️
Nissan Skyline GT-R R34|Classic|JDM legend|🚘
Mazda RX-7|Classic|Rotary engine|🚘
Toyota AE86|Classic|Drift king|🚘
Ford Mustang '67|Classic|Muscle car|🐎
Chevrolet Camaro '69|Classic|Muscle car|🚘
Mercedes 300SL Gullwing|Classic|1954 beauty|🕊️
Lamborghini Countach|Classic|Poster car|🚘
Toyota Supra Mk4|Classic|2JZ power|🚘`), mkTopic('t-shoe', 'Sneakers', '👟', 'Pick 1, Pick 2, Pick 3, Pick 4', 'list', 'emoji', `
Air Jordan 1||Nike · 1985|👟
Air Force 1||Nike · 1982|👟
Nike Dunk Low||Nike|👟
Adidas Samba||Adidas|👟
New Balance 550||New Balance|👟
Air Max 90||Nike|👟
Air Max 97||Nike · silver bullet|👟
Air Jordan 4||Nike|👟
Air Jordan 11||Nike · patent leather|👟
Air Jordan 5||Nike|👟
Air Jordan 3||Nike|👟
Converse Chuck 70||Converse|👟
Vans Old Skool||Vans|👟
Adidas Superstar||Adidas · shell toe|👟
Adidas Gazelle||Adidas|👟
New Balance 990||New Balance|👟
Asics Gel-Kayano 14||Asics|👟
Nike Blazer||Nike|👟
Salomon XT-6||Salomon|🏔️
Nike Vomero 5||Nike|👟
On Cloud||On|☁️
Puma Suede||Puma|👟
Reebok Club C||Reebok|👟
Nike Cortez||Nike|👟
Crocs||Crocs · love them or hate them|🐊
Timberland 6-Inch Boot||Timberland|🥾
Birkenstock Boston||Birkenstock|🩴
UGG Boots||UGG|🥾
Nike Air Max Plus||Nike · TN|👟
Adidas Ultraboost||Adidas|👟`), mkTopic('t-drink', 'Drinks', '🧋', 'Hot, Cold, Fizzy, FLEX', 'list', 'emoji', `
Double-Double|Hot|Tim Hortons|☕
Chai Latte|Hot|Spiced tea|🍵
Matcha Latte|Hot|Green tea|🍵
Hot Chocolate|Hot|Winter classic|☕
Karak Chai|Hot|Strong and sweet|🫖
Turkish Coffee|Hot|Thick and strong|☕
Spanish Latte|Hot|Condensed milk|☕
Bubble Tea|Cold|Tapioca pearls|🧋
Mango Lassi|Cold|Yogurt and mango|🥭
Strawberry Smoothie|Cold|Blended fruit|🍓
Iced Coffee|Cold|Over ice|🧊
Arizona Iced Tea|Cold|99 cents|🥫
Orange Juice|Cold|Fresh squeezed|🍊
Mint Lemonade|Cold|Lemon and mint|🍋
Chocolate Milk|Cold|After school|🥛
Coconut Water|Cold|Straight from the coconut|🥥
Ice Water|Cold|Simple|💧
Iced Capp|Cold|Tim Hortons|🧋
Coca-Cola|Fizzy|The original|🥤
Pepsi|Fizzy|The rival|🥤
Sprite|Fizzy|Lemon-lime|🍋
Dr Pepper|Fizzy|23 flavours|🥤
Root Beer|Fizzy|A&W|🥤
Canada Dry|Fizzy|Ginger ale|🫚
Fanta Orange|Fizzy|Orange soda|🍊
Mountain Dew|Fizzy|Neon green|💚
Red Bull|Fizzy|Energy drink|🐂
Celsius|Fizzy|Energy drink|⚡
Vimto|Fizzy|Ramadan classic|🍇
Crush Cream Soda|Fizzy|Pink and sweet|🩷`), mkTopic('t-app', 'Phone Apps', '📱', 'App 1, App 2, App 3, App 4, App 5', 'list', 'emoji', `
Instagram||Photos and reels|📸
TikTok||Short videos|🎵
Snapchat||Streaks|👻
YouTube||Videos|▶️
WhatsApp||Group chats|💬
Spotify||Music|🎧
Netflix||Shows and movies|🍿
X||Posts|✖️
Reddit||Forums|👽
Discord||Voice chat|🎮
Google Maps||Directions|🗺️
Uber Eats||Food delivery|🛵
DoorDash||Food delivery|🥡
Amazon||Shopping|📦
Twitch||Live streams|🟣
Pinterest||Ideas|📌
Duolingo||Language streaks|🦉
Shazam||Name that song|🎶
FaceTime||Video calls|📹
Apple Music||Music|🎼
Notes||Everything else|📝
Calculator||Quick maths|🧮
Clash of Clans||Strategy game|⚔️
BeReal||Daily photo|📷
Threads||Posts|🧵
Uber||Rides|🚕
Airbnb||Places to stay|🏠
Wealthsimple||Investing|📈
Tim Hortons||Coffee orders|☕
Google Translate||Any language|🌐`), mkTopic('t-myth', 'Mythical Creatures', '🐉', 'Pick 1, Pick 2, Pick 3, Pick 4', 'list', 'emoji', `
Dragon||Breathes fire|🐉
Phoenix||Rises from ashes|🔥
Unicorn||Magic horn|🦄
Griffin||Lion and eagle|🦅
Kraken||Sea monster|🦑
Vampire||Never dies|🧛
Werewolf||Full moon|🐺
Mermaid||Half fish|🧜
Genie||Three wishes|🧞
Yeti||Himalayan snowman|❄️
Bigfoot||Forest giant|🦶
Loch Ness Monster||Scotland's secret|🦕
Cyclops||One eye|👁️
Minotaur||Bull-headed|🐂
Medusa||Stone gaze|🐍
Centaur||Half horse|🏹
Pegasus||Winged horse|🐎
Hydra||Grows new heads|🐲
Zombie||Undead|🧟
Ghost||Haunts houses|👻
Fairy||Tiny magic|🧚
Troll||Under the bridge|🧌
Basilisk||Deadly stare|🦎
Cerberus||Three-headed dog|🐕
Chupacabra||Goat sucker|🐐
Thunderbird||Storm bringer|⚡
Leviathan||Ocean titan|🐋
Golem||Stone giant|🗿
Sphinx||Riddles|🦁
Elf||Bow and arrow|🧝`), mkTopic('t-toon', 'Childhood Cartoons', '📺', 'Pick 1, Pick 2, Pick 3, Pick 4', 'list', 'emoji', `
SpongeBob SquarePants||Nickelodeon · 1999|🧽
Avatar: The Last Airbender||Nickelodeon · 2005|🌪️
Phineas and Ferb||Disney · 2007|🔺
Ben 10||Cartoon Network · 2005|⌚
Teen Titans||Cartoon Network · 2003|🦸
The Fairly OddParents||Nickelodeon · 2001|🪄
Kim Possible||Disney · 2002|📟
Ed, Edd n Eddy||Cartoon Network · 1999|🍬
Courage the Cowardly Dog||Cartoon Network · 1999|🐕
Dexter's Laboratory||Cartoon Network · 1996|🧪
The Powerpuff Girls||Cartoon Network · 1998|💥
Johnny Bravo||Cartoon Network · 1997|🕶️
Scooby-Doo||Classic|🐶
Tom and Jerry||Classic|🐭
Looney Tunes||Classic|🥕
Pokémon||Anime · 1997|⚡
Dragon Ball Z||Anime · 1989|🐉
Naruto||Anime · 2002|🍥
Yu-Gi-Oh!||Anime · 2000|🃏
The Amazing World of Gumball||Cartoon Network · 2011|🐱
Adventure Time||Cartoon Network · 2010|🗡️
Regular Show||Cartoon Network · 2010|🦝
Codename: Kids Next Door||Cartoon Network · 2002|🌳
Total Drama Island||Teletoon · 2007|🏕️
6teen||Teletoon · 2004|🛍️
Arthur||PBS · 1996|📚
Recess||Disney · 1997|🏫
Hey Arnold!||Nickelodeon · 1996|🏈
Rugrats||Nickelodeon · 1991|🍼
Jimmy Neutron||Nickelodeon · 2002|🧠`)];
}
const PHOTO_TOPICS = {
  't-pl': {
    'Tony Adams': 'Tony Adams (footballer)'
  },
  't-cf': {
    'Alisson': 'Alisson Becker',
    'Rodri': 'Rodri (footballer, born 1996)',
    'Pedri': 'Pedri',
    'Vitinha': 'Vitinha (footballer, born February 2000)',
    'Bruno Fernandes': 'Bruno Fernandes (footballer, born 1994)'
  },
  't-nba': {
    'Anthony Edwards': 'Anthony Edwards (basketball)',
    'Anthony Davis': 'Anthony Davis (basketball)'
  },
  't-goat': {
    'Ronaldo Nazário': 'Ronaldo (Brazilian footballer)',
    'Xavi': 'Xavi',
    'Cafu': 'Cafu'
  },
  't-nbal': {
    'David Robinson': 'David Robinson (basketball)',
    'Isiah Thomas': 'Isiah Thomas',
    'Gary Payton': 'Gary Payton'
  },
  't-nhl': {
    'Jack Hughes': 'Jack Hughes (ice hockey, born 2001)',
    'Adam Fox': 'Adam Fox (ice hockey)',
    'Alex Ovechkin': 'Alexander Ovechkin',
    'Mitch Marner': 'Mitch Marner'
  },
  't-nfl': {
    'Josh Allen': 'Josh Allen (quarterback)',
    'Derrick Henry': 'Derrick Henry (American football)',
    'T.J. Watt': 'T. J. Watt',
    'Lawrence Taylor': 'Lawrence Taylor',
    'Ray Lewis': 'Ray Lewis'
  },
  't-ten': {
    'Andy Murray': 'Andy Murray',
    'Naomi Osaka': 'Naomi Osaka'
  },
  't-f1': {
    'George Russell': 'George Russell (racing driver)',
    'Carlos Sainz': 'Carlos Sainz Jr.',
    'Alex Albon': 'Alexander Albon',
    'Kimi Antonelli': 'Andrea Kimi Antonelli',
    'Michael Schumacher': 'Michael Schumacher'
  },
  't-fight': {
    'Floyd Mayweather': 'Floyd Mayweather Jr.',
    'Prince Naseem Hamed': 'Naseem Hamed',
    'Amir Khan': 'Amir Khan (boxer)',
    'Valentina Shevchenko': 'Valentina Shevchenko (fighter)',
    'Alex Pereira': 'Alex Pereira',
    'Jon Jones': 'Jon Jones'
  },
  't-crk': {
    'Steve Smith': 'Steve Smith (cricketer)',
    'James Anderson': 'James Anderson (cricketer)',
    'Rashid Khan': 'Rashid Khan (cricketer)',
    'Mohammad Rizwan': 'Mohammad Rizwan (cricketer)',
    'Travis Head': 'Travis Head',
    'Joe Root': 'Joe Root'
  },
  't-rap': {
    'Drake': 'Drake (musician)',
    'Tupac': 'Tupac Shakur',
    'Future': 'Future (rapper)',
    'A$AP Rocky': 'ASAP Rocky',
    'Juice WRLD': 'Juice Wrld',
    'Dave': 'Dave (rapper)',
    'Nas': 'Nas',
    'Metro Boomin': 'Metro Boomin'
  },
  't-ani': {
    'Grizzly Bear': 'Grizzly bear',
    'Rhino': 'Rhinoceros',
    'Hippo': 'Hippopotamus',
    'Honey Badger': 'Honey badger',
    'Komodo Dragon': 'Komodo dragon',
    'Great White Shark': 'Great white shark',
    'Giant Squid': 'Giant squid',
    'Blue Whale': 'Blue whale',
    'Pufferfish': 'Tetraodontidae',
    'Bald Eagle': 'Bald eagle',
    'Dolphin': 'Common bottlenose dolphin',
    'Bull': 'Bull',
    'Bat': 'Bat',
    'Swan': 'Mute swan',
    'Hornet': 'Hornet'
  },
  't-pet': {
    'Golden Retriever': 'Golden Retriever',
    'German Shepherd': 'German Shepherd',
    'Husky': 'Siberian Husky',
    'Pomeranian': 'Pomeranian dog',
    'Persian Cat': 'Persian cat',
    'Siamese Cat': 'Siamese cat',
    'Sphynx Cat': 'Sphynx cat',
    'Ragdoll Cat': 'Ragdoll',
    'Budgie': 'Budgerigar',
    'Bearded Dragon': 'Pogona',
    'Mini Pig': 'Miniature pig',
    'Guinea Pig': 'Guinea pig',
    'Parrot': 'Parrot',
    'Turtle': 'Turtle',
    'Snake': 'Snake'
  },
  't-trav': {
    'New York': 'New York City',
    'Marrakech': 'Marrakesh',
    'Sydney': 'Sydney',
    'Banff': 'Banff National Park',
    'Hawaii': 'Hawaii',
    'Swiss Alps': 'Swiss Alps',
    'Bali': 'Bali',
    'Maldives': 'Maldives'
  },
  't-ctry': {
    'UAE': 'United Arab Emirates',
    'USA': 'United States',
    'Turkey': 'Turkey'
  },
  't-fruit': {
    'Green Apple': 'Granny Smith',
    'Grapes': 'Grape',
    'Orange': 'Orange (fruit)',
    'Kiwi': 'Kiwifruit',
    'Cherry': 'Cherry',
    'Melon': 'Honeydew (melon)',
    'Dragon Fruit': 'Pitaya',
    'Fig': 'Common fig',
    'Dates': 'Date palm',
    'Passion Fruit': 'Passiflora edulis',
    'Apple': 'Apple',
    'Plum': 'Plum'
  },
  't-dish': {
    'Pizza Margherita': 'Pizza Margherita',
    'Tacos al Pastor': 'Al pastor',
    'Butter Chicken': 'Butter chicken',
    'Pad Thai': 'Pad thai',
    'Pho': 'Phở',
    'Jollof Rice': 'Jollof rice',
    'Korean BBQ': 'Korean barbecue',
    'Dim Sum': 'Dim sum',
    'Mac & Cheese': 'Macaroni and cheese',
    'Samosas': 'Samosa',
    'Garlic Naan': 'Naan',
    'Kunafa': 'Knafeh',
    'Gulab Jamun': 'Gulab jamun',
    'Churros': 'Churro',
    'Crème Brûlée': 'Crème brûlée',
    'Pastel de Nata': 'Pastel de nata'
  },
  't-bfast': {
    'Pancakes': 'Pancake',
    'Waffles': 'Waffle',
    'French Toast': 'French toast',
    'Full English': 'Full breakfast',
    'Bagel & Cream Cheese': 'Bagel',
    'Cereal': 'Breakfast cereal',
    'Avocado Toast': 'Avocado toast',
    'Breakfast Burrito': 'Breakfast burrito',
    'Shakshuka': 'Shakshouka',
    'Halwa Puri': 'Halwa poori',
    'Paratha & Chai': 'Paratha',
    'Ful Medames': 'Ful medames',
    'Manakish': 'Manakish',
    'Hash Browns': 'Hash browns',
    'Chicken & Waffles': 'Chicken and waffles',
    'Smoothie Bowl': null,
    'Yogurt Parfait': 'Parfait',
    'Beef Sausages': 'Sausage',
    'Breakfast Sandwich': 'Breakfast sandwich',
    'Crêpes': 'Crêpe',
    'Nasi Lemak': 'Nasi lemak',
    'Masala Dosa': 'Masala dosa',
    'Fruit Salad': 'Fruit salad',
    'Eggs Benedict': 'Eggs Benedict'
  },
  't-dess': {
    'Brownie': 'Chocolate brownie',
    'Chocolate Chip Cookie': 'Chocolate chip cookie',
    'Ice Cream Sundae': 'Sundae',
    'Donut': 'Doughnut',
    'Apple Pie': 'Apple pie',
    'Cinnamon Roll': 'Cinnamon roll',
    'Macarons': 'Macaron',
    'Churros': 'Churro',
    'Tres Leches': 'Tres leches cake',
    'Kunafa': 'Knafeh',
    'Gulab Jamun': 'Gulab jamun',
    'Nutella Crêpe': 'Crêpe',
    'Banana Split': 'Banana split',
    'Lava Cake': 'Molten chocolate cake',
    'Red Velvet Cake': 'Red velvet cake',
    'Key Lime Pie': 'Key lime pie',
    'Funnel Cake': 'Funnel cake',
    'Bubble Waffle': 'Egg waffle',
    'Sticky Toffee Pudding': 'Sticky toffee pudding',
    'Butter Tart': 'Butter tart',
    'Nanaimo Bar': 'Nanaimo bar',
    'Crème Caramel': 'Crème caramel'
  },
  't-pizza': {
    'Mushrooms': 'Edible mushroom',
    'Onions': 'Onion',
    'Green Peppers': 'Bell pepper',
    'Black Olives': 'Olive',
    'Extra Cheese': 'Mozzarella',
    'Jalapeños': 'Jalapeño',
    'Tomatoes': 'Tomato',
    'Chicken': 'Chicken as food',
    'Ground Beef': 'Ground beef',
    'Beef Sausage': 'Sausage',
    'Corn': 'Sweet corn',
    'Anchovies': 'Anchovies as food',
    'Turkey Bacon': 'Turkey bacon',
    'Hot Honey': null,
    'BBQ Sauce': 'Barbecue sauce',
    'Ranch Drizzle': 'Ranch dressing',
    'Banana Peppers': 'Banana pepper',
    'Sun-Dried Tomatoes': 'Sun-dried tomato',
    'Artichokes': 'Artichoke',
    'Red Onions': 'Red onion',
    'Donair Meat': 'Donair',
    'Butter Chicken': 'Butter chicken'
  },
  't-ff': {
    'Chicken Sandwich': null,
    'Chick-fil-A Sandwich': null,
    'Crunchwrap Supreme': null,
    'Teen Burger': null,
    'Zinger': null,
    'Burrito Bowl': 'Burrito',
    'Double-Double': 'In-N-Out Burger',
    'Italian B.M.T.': 'Submarine sandwich',
    'Fries': 'French fries',
    'Onion Rings': 'Onion ring',
    'Cajun Fries': null,
    'Waffle Fries': 'Waffle fries',
    'Hash Brown': 'Hash browns',
    'Nacho Fries': null,
    'Iced Capp': 'Iced coffee',
    'Root Beer': 'Root beer',
    'Baja Blast': null,
    'Double-Double Coffee': null,
    'Frosted Lemonade': null,
    'Frosty': null,
    'Blizzard': null,
    'Baked Apple Pie': 'Apple pie',
    'Cinnabon Delights': null
  },
  't-car': {
    'Porsche 911 GT3': 'Porsche 911 GT3',
    'Ferrari LaFerrari': 'LaFerrari',
    'VW Golf GTI': 'Volkswagen Golf GTI',
    'Hyundai Elantra N': 'Hyundai Elantra',
    'Mercedes G-Wagon': 'Mercedes-Benz G-Class',
    'Nissan Skyline GT-R R34': 'Nissan Skyline GT-R',
    "Ford Mustang '67": 'Ford Mustang (first generation)',
    "Chevrolet Camaro '69": 'Chevrolet Camaro (first generation)',
    'Mercedes 300SL Gullwing': 'Mercedes-Benz 300 SL',
    'Toyota Supra Mk4': 'Toyota Supra',
    'Toyota AE86': 'Toyota AE86'
  },
  't-myth': {
    'Phoenix': 'Phoenix (mythology)',
    'Genie': 'Jinn',
    'Cyclops': 'Cyclopes',
    'Hydra': 'Lernaean Hydra',
    'Troll': 'Troll',
    'Thunderbird': 'Thunderbird (mythology)',
    'Sphinx': 'Sphinx',
    'Elf': 'Elf',
    'Golem': 'Golem',
    'Fairy': 'Fairy',
    'Ghost': 'Ghost',
    'Zombie': 'Zombie',
    'Dragon': 'Dragon'
  },
  't-inv': {
    'The Internet': 'Internet',
    'The Wheel': 'Wheel',
    'Light Bulb': 'Incandescent light bulb',
    'Vaccines': 'Vaccine',
    'Antibiotics': 'Antibiotic',
    'GPS': 'Global Positioning System',
    'Flushing Toilet': 'Flush toilet',
    'Microwave': 'Microwave oven',
    'Video Games': 'Video game',
    'Car': 'Car',
    'Wi-Fi': 'Wi-Fi'
  },
  't-board': {
    'Monopoly': 'Monopoly (game)',
    'Uno': 'Uno (card game)',
    'Connect 4': 'Connect Four',
    'Clue': 'Cluedo',
    'Catan': 'Catan',
    'Risk': 'Risk (game)',
    'Battleship': 'Battleship (game)',
    'Snakes & Ladders': 'Snakes and ladders',
    'Checkers': 'Draughts',
    'Twister': 'Twister (game)',
    'Operation': 'Operation (game)',
    'Sorry!': 'Sorry! (game)',
    'Codenames': 'Codenames (board game)',
    'Werewolf': 'Mafia (party game)',
    'Taboo': 'Taboo (game)',
    'Poker Night': 'Poker',
    'Go Fish': 'Go Fish',
    'Spoons': 'Spoons (card game)',
    'Dominoes': 'Dominoes',
    'Carrom': 'Carrom'
  },
  't-toys': {
    'LEGO': 'Lego',
    'Beyblades': 'Beyblade',
    'Pokémon Cards': 'Pokémon Trading Card Game',
    'Nerf Blasters': 'Nerf',
    'Yo-Yo': 'Yo-yo',
    'Bubble Wand': 'Soap bubble',
    'Water Gun': 'Water gun',
    'Scooter': 'Kick scooter',
    'Rollerblades': 'Inline skates',
    'RC Car': 'Radio-controlled car',
    'Fidget Spinner': 'Fidget spinner',
    'Teddy Bear': 'Teddy bear',
    'Marbles': 'Marble (toy)',
    'Action Figures': 'Action figure',
    'Squishmallow': 'Squishmallows'
  },
  't-gadget': {
    'PlayStation 5': 'PlayStation 5',
    'Xbox': 'Xbox Series X and Series S',
    'MacBook': 'MacBook Pro',
    'Gaming PC': 'Gaming computer',
    'Drone': 'Quadcopter',
    'VR Headset': 'Virtual reality headset',
    'Kindle': 'Amazon Kindle',
    'Bluetooth Speaker': 'Wireless speaker',
    'Noise-Cancelling Headphones': 'Headphones',
    'Mechanical Keyboard': 'Keyboard technology',
    'Gaming Mouse': 'Computer mouse',
    'Electric Scooter': 'Electric kick scooter',
    'Robot Vacuum': 'Robotic vacuum cleaner',
    'Smart Glasses': 'Smartglasses',
    'Power Bank': 'Battery charger',
    'Hair Dryer': 'Hair dryer',
    '3D Printer': '3D printing',
    'E-Bike': 'Electric bicycle',
    'Mini Projector': 'Video projector',
    'Air Fryer': 'Air fryer',
    'Instant Camera': 'Instant camera',
    'Ring Light': 'Ring light'
  },
  't-holi': {
    'Ramadan Nights': 'Ramadan',
    'Thanksgiving': 'Thanksgiving (Canada)',
    'Lunar New Year': 'Chinese New Year',
    'Your Birthday': 'Birthday',
    'Summer Break': 'Summer vacation',
    'Last Day of School': null,
    'Family Day': 'Family Day (Canada)',
    'Black Friday': 'Black Friday (shopping)',
    'Super Bowl Sunday': 'Super Bowl',
    'World Cup Final': 'FIFA World Cup',
    'Wedding Season': 'Wedding',
    'Snow Day': 'Snow day',
    'Payday': null,
    'Long Weekend': null,
    'Graduation': 'Graduation'
  },
  't-job': {
    'Pro Footballer': 'Association football',
    'Doctor': 'Physician',
    'Pilot': 'Aircraft pilot',
    'Software Engineer': 'Software engineering',
    'Game Developer': 'Video game developer',
    'Marine Biologist': 'Marine biology',
    'Entrepreneur': 'Entrepreneurship',
    'Vet': 'Veterinarian',
    'Fashion Designer': 'Fashion design',
    'F1 Engineer': null,
    'Archaeologist': 'Archaeology',
    'Stock Trader': 'Stock trader',
    'Real Estate Agent': 'Real estate broker',
    'Travel Blogger': null,
    'Sports Commentator': 'Sports commentator',
    'Spy': 'Espionage',
    'Zookeeper': 'Zookeeper',
    'YouTuber': 'YouTuber'
  },
  't-hobby': {
    'Gaming': 'Video game',
    'Football': 'Association football',
    'Gym': 'Weight training',
    'Coding': 'Computer programming',
    'Sneaker Collecting': null,
    'Video Editing': 'Video editing',
    'LEGO Building': 'Lego',
    'Car Detailing': 'Auto detailing',
    'Learning Languages': 'Language acquisition',
    'Martial Arts': 'Martial arts',
    'Rock Climbing': 'Rock climbing'
  }
};
const SENTENCE_CASE = new Set(['t-inv', 't-hobby', 't-job']);
function wikiTitleFor(item, topic) {
  if (!item || item.photosOff) return null;
  if (item.wiki) return item.wiki;
  if (!topic || !topic.photos) return null;
  const map = PHOTO_TOPICS[topic.id] || {};
  if (Object.prototype.hasOwnProperty.call(map, item.name)) return map[item.name];
  if (SENTENCE_CASE.has(topic.id)) return item.name.charAt(0) + item.name.slice(1).toLowerCase();
  return item.name;
}
const BOT_TYPES = {
  spender: {
    label: 'Big Spender',
    short: 'Spender',
    color: '#ff8a3a',
    emojis: ['💸', '🤑', '💰', '🎩', '💎', '🛥️'],
    names: ['Sir Overpays-a-Lot', 'Baron Von Big Bucks', 'Lady Splash-the-Cash', 'The Human Wallet', 'King Cha-Ching', 'Count Overbid', 'Duke of Debt']
  },
  bargain: {
    label: 'Bargain Hunter',
    short: 'Bargains',
    color: '#2fd17c',
    emojis: ['🧾', '🏷️', '🪙', '🛒', '🦝', '🧮'],
    names: ['The Discount Goblin', 'Coupon Carl', 'Clearance Rack Rita', 'Penny Pincher Pete', 'Two-for-One Tony', 'Aunty Haggles', 'Buy-One-Get-None']
  },
  needs: {
    label: 'Position Strategist',
    short: 'Strategist',
    color: '#3d8bff',
    emojis: ['📋', '🧠', '📐', '🗂️', '🎯', '🧩'],
    names: ['Captain Empty Slot', 'The Spreadsheet', 'Professor Positions', 'Coach Clipboard', 'Formation Freddie', 'Gap Filler Greg', 'Doctor Depth Chart']
  },
  chaos: {
    label: 'Chaos',
    short: 'Chaos',
    color: '#ff5cbc',
    emojis: ['🌀', '🃏', '🎲', '🤪', '🦄', '🎪'],
    names: ['Lord Chaos', 'Random Randy', 'The Wildcard', 'Agent of Mayhem', 'Captain Coin Flip', 'Mystery Max', 'Unpredictable Ursula']
  }
};
const BOT_TYPE_ORDER = ['spender', 'bargain', 'needs', 'chaos'];
const BOT_LEVELS = {
  easy: {
    label: 'Easy',
    noise: 0.38,
    miss: 0.2,
    reserve: 0.15,
    scarcity: 0.1,
    rivals: false,
    waste: 0.22,
    freeNoise: 0.6
  },
  medium: {
    label: 'Medium',
    noise: 0.18,
    miss: 0.06,
    reserve: 0.6,
    scarcity: 0.45,
    rivals: true,
    waste: 0.06,
    freeNoise: 0.2
  },
  hard: {
    label: 'Hard',
    noise: 0.06,
    miss: 0,
    reserve: 1,
    scarcity: 0.8,
    rivals: true,
    waste: 0,
    freeNoise: 0
  }
};
function mulberry32(a) {
  return function () {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const seeded = (...parts) => mulberry32(hashStr(parts.join('|')));
const unit = (...parts) => hashStr(parts.join('|')) % 10000 / 10000;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isBot = m => !!(m && m.bot);
const botLevel = m => BOT_LEVELS[m.bot && m.bot.level || 'medium'] || BOT_LEVELS.medium;
function makeBots(count, level, seed, avoidColors) {
  const rng = seeded('bots', seed);
  const order = [];
  while (order.length < count) {
    const round = [...BOT_TYPE_ORDER];
    for (let i = round.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [round[i], round[j]] = [round[j], round[i]];
    }
    order.push(...round);
  }
  const usedNames = new Set();
  const usedColors = new Set(avoidColors || []);
  return order.slice(0, count).map((type, i) => {
    const T = BOT_TYPES[type];
    const names = T.names.filter(n => !usedNames.has(n));
    const name = names[Math.floor(rng() * names.length)] || T.names[0] + ' ' + (i + 1);
    usedNames.add(name);
    const color = [T.color, ...COLORS].find(c => !usedColors.has(c)) || COLORS[i % COLORS.length];
    usedColors.add(color);
    return {
      id: 'bot-' + i + '-' + hashStr(seed + name).toString(36).slice(0, 4),
      name,
      color,
      emoji: T.emojis[Math.floor(rng() * T.emojis.length)],
      bot: {
        type,
        level
      }
    };
  });
}
function itemFame(item) {
  const s = (item.desc || '') + ' ';
  let f = 0.32 + unit('fame', item.name) * 0.22;
  const n = s.match(/(\d+)\s*[×x]\s/);
  if (n) f += Math.min(0.32, 0.06 * parseInt(n[1], 10));
  if (/MVP|Ballon d'Or|World Cup|champion|Golden|legend|record|GOAT|Hall of Fame|all-time|greatest|King|icon|the original/i.test(s)) f += 0.18;
  if (/No\. 1 pick|Rookie|All-Star|Norris|Vezina|Hart|Defensive POY|Finals MVP|Grand Slam|Wimbledon|Olympic/i.test(s)) f += 0.1;
  return clamp(f, 0.15, 1);
}
function botTaste(bot, item) {
  const spread = bot.bot.type === 'chaos' ? 0.5 : 0.16;
  return 1 + (unit('taste', bot.name, item.name) - 0.5) * 2 * spread;
}
const slotKey = (d, item) => {
  const p = norm(item.pos);
  return p && d.rules.slots.some(s => norm(s) === p) ? p : '*';
};
function scarcityOf(d, item) {
  const key = slotKey(d, item);
  const pool = [...d.queue, ...d.leftover].map(id => d.items[id]);
  const supply = pool.filter(it => slotKey(d, it) === key || key === '*').length;
  const demand = d.managers.reduce((n, m) => n + d.rules.slots.filter((s, k) => !m.team[k] && (key === '*' || norm(s) === key || isFlex(s))).length, 0);
  return clamp(demand / Math.max(1, supply), 0.5, 2);
}
function botValue(d, bot, item, rng) {
  const slots = d.rules.slots;
  const idx = assignSlot(bot, item, slots);
  if (idx < 0) return 0;
  const L = botLevel(bot);
  const type = bot.bot.type;
  const fair = d.rules.budget / slots.length;
  const fame = itemFame(item);
  let v = fair * (0.5 + 1.15 * fame) * botTaste(bot, item);
  const exact = !isFlex(slots[idx]);
  const sc = scarcityOf(d, item);
  if (type === 'spender') {
    v *= fame > 0.6 ? 1.75 : 0.95;
    if (bot.budget >= d.rules.budget * 0.6) v *= 1.15;
  }
  if (type === 'bargain') v *= 0.72;
  if (type === 'needs') {
    v *= exact ? 1.3 : fame > 0.7 ? 0.7 : 0.3;
    v *= Math.pow(sc, 0.5 + L.scarcity);
  } else v *= Math.pow(sc, L.scarcity * 0.5);
  if (type === 'chaos' && unit('crush', bot.name, item.name) < 0.12) v *= 1.9;
  if (L.scarcity > 0.3) {
    const options = d.queue.slice(1).filter(id => assignSlot(bot, d.items[id], slots) >= 0).length;
    if (options < emptyCount(bot) * 1.5) v *= 1 + 0.25 * L.scarcity;
  }
  return v * (1 + (rng() - 0.5) * 2 * L.noise);
}
function botLimit(d, bot, item, rng) {
  const L = botLevel(bot);
  const type = bot.bot.type;
  const others = emptyCount(bot) - 1;
  const fair = d.rules.budget / d.rules.slots.length;
  const legal = maxBid(bot, d.rules);
  const keepMin = d.rules.mustFill || L.reserve >= 0.5 ? d.rules.minBid * others : 0;
  const extraShare = type === 'spender' ? 0.08 : type === 'chaos' ? 0.12 * rng() : 0.22;
  const keepExtra = L.reserve * others * Math.max(0, fair * extraShare);
  const value = botValue(d, bot, item, rng);
  let limit = Math.floor(Math.min(legal, bot.budget - keepMin - keepExtra, value));
  const idx = assignSlot(bot, item, d.rules.slots);
  const flexOnly = idx >= 0 && isFlex(d.rules.slots[idx]);
  const endgame = d.queue.length - 1 < emptyCount(bot) * 2;
  const holdFlex = type === 'needs' && flexOnly && !endgame;
  if (!holdFlex && value >= fair * 0.45 && limit < d.rules.minBid + d.rules.inc && legal >= d.rules.minBid) limit = Math.min(legal, d.rules.minBid + (type === 'bargain' ? d.rules.inc : 0));
  return {
    limit: Math.max(0, limit),
    value
  };
}
function botDecision(d, bot) {
  const item = currentItem(d);
  if (!item || !isBot(bot) || isFull(bot)) return null;
  if (d.bid && d.bid.leaderId === bot.id) return null;
  const price = nextAmount(d);
  if (!canBid(d, bot, price)) return null;
  const rng = seeded(d.seed || d.id, d.reveal, price, bot.id);
  const L = botLevel(bot);
  const type = bot.bot.type;
  if (rng() < L.miss) return null;
  const {
    limit,
    value
  } = botLimit(d, bot, item, rng);
  if (price > limit) return null;
  const rivals = d.managers.filter(m => m.id !== bot.id && !isFull(m) && assignSlot(m, item, d.rules.slots) >= 0);
  const rivalMax = rivals.reduce((mx, m) => Math.max(mx, maxBid(m, d.rules)), 0);
  if (type === 'bargain') {
    if (price > value * 0.85) return null;
    const bigRival = d.bid && d.managers.find(m => m.id === d.bid.leaderId && m.budget >= bot.budget * 1.8);
    if (bigRival && price > d.rules.minBid + 2 * d.rules.inc) return null;
  }
  if (L.rivals && rivalMax > limit && price > value * 0.9 && type !== 'spender') return null;
  let amount = price;
  const fame = itemFame(item);
  if (type === 'spender' && fame > 0.55 && rng() < 0.35) amount += d.rules.inc * (1 + Math.floor(rng() * 3));
  if (type === 'chaos' && rng() < 0.16) amount += d.rules.inc * (1 + Math.floor(rng() * 4));
  if (rng() < L.waste) amount += d.rules.inc;
  if (L.rivals && rivalMax < amount && type !== 'chaos') amount = Math.max(price, Math.min(amount, rivalMax + d.rules.inc));
  amount = Math.min(amount, limit);
  if (!canBid(d, bot, amount)) amount = price;
  let delay = 700 + rng() * 900;
  if (price > limit * 0.8) delay += 350;
  if (type === 'bargain') delay += 300;
  if (type === 'chaos') delay -= rng() * 250;
  delay = clamp(delay, 650, 2300);
  return {
    botId: bot.id,
    amount,
    delay: Math.round(delay),
    event: amount > price ? 'jump' : 'bid'
  };
}
function nextBotAction(d) {
  return d.managers.filter(isBot).map(b => botDecision(d, b)).filter(Boolean).sort((a, b) => a.delay - b.delay || (a.botId < b.botId ? -1 : 1))[0] || null;
}
function botFreePickChoice(d, bot) {
  const L = botLevel(bot);
  const opts = d.leftover.filter(id => canTake(d, bot, id));
  if (!opts.length) return null;
  const rng = seeded(d.seed || d.id, 'free', d.fp.round, d.fp.pos, bot.id);
  return opts.map(id => ({
    id,
    s: botValue(d, bot, d.items[id], () => 0.5) * (1 + (rng() - 0.5) * 2 * L.freeNoise)
  })).sort((a, b) => b.s - a.s)[0].id;
}
function teamScore(d, m, judge) {
  const slots = d.rules.slots;
  const fair = d.rules.budget / slots.length;
  let quality = 0,
    vfm = 0,
    exact = 0,
    filled = 0;
  m.team.forEach((t, i) => {
    if (!t) return;
    const it = d.items[t.itemId];
    filled++;
    const q = fair * (0.5 + 1.15 * itemFame(it)) * (judge && judge.bot ? botTaste(judge, it) : 1);
    quality += q;
    vfm += q - t.price;
    if (!isFlex(slots[i]) && (!it.pos || norm(it.pos) === norm(slots[i]))) exact++;
  });
  const completeness = filled / slots.length;
  return quality * (0.55 + 0.45 * completeness) + 0.15 * Math.max(0, vfm) + exact * fair * 0.1;
}
function voteChoices(d, voterId) {
  return d.managers.filter(m => m.id !== voterId && m.team.some(Boolean));
}
function botVote(d, bot) {
  const choices = voteChoices(d, bot.id);
  if (!choices.length) return null;
  const L = botLevel(bot);
  const rng = seeded(d.seed || d.id, 'vote', bot.id);
  return choices.map(m => ({
    id: m.id,
    s: teamScore(d, m, bot) * (1 + (rng() - 0.5) * 2 * L.noise * 0.6)
  })).sort((a, b) => b.s - a.s || (a.id < b.id ? -1 : 1))[0].id;
}
const TALK = {
  spender: {
    start: ['Money is temporary. Greatness is forever.', 'I brought the whole piggy bank.', 'Price tags are just suggestions.'],
    bid: ['Is that all? Cute.', 'Put it on my tab.', 'I want it. I have money. Simple.', 'Bidding is my cardio.'],
    jump: ['Let me just end this.', 'Big money, big moves.', 'Make it rain!', 'Nobody touch my future star.'],
    win: ['Worth every cent. Probably.', 'Another trophy for the cabinet.', 'Expensive taste, I know.'],
    steal: ['Even I can’t believe how cheap that was.', 'I paid less than I wanted to. Weird feeling.'],
    lose: ['Fine, keep it. I’m saving for something shinier.', 'That was a terrible financial decision. Respect.', 'I let you have that one.'],
    free: ['Free? I’d have paid double.', 'My wallet is resting.'],
    rival: ['Big spender in the building, I see.', 'Ooh, someone opened their wallet.']
  },
  bargain: {
    start: ['I’m not cheap. I’m financially intelligent.', 'Wake me up when something’s on sale.', 'I can smell a discount.'],
    bid: ['A modest offer.', 'Not a cent more than it’s worth.', 'Let’s keep this reasonable.', 'Opening at clearance prices.'],
    jump: ['Okay, okay, a little more.', 'Fine. Small splurge.'],
    win: ['A steal! Probably. Don’t check the numbers.', 'Bought low. Will brag high.', 'Cha-ching… for ME.'],
    steal: ['Robbery. Absolute robbery.', 'I’d like to thank the other bidders for not bidding.'],
    lose: ['Overpay all you like. I’ll wait.', 'Enjoy paying full price.', 'Too rich for my blood.'],
    free: ['Free is my favourite price.', 'Zero dollars. Perfection.'],
    rival: ['You paid HOW much?', 'My calculator just fainted.', 'That was a choice.']
  },
  needs: {
    start: ['I have a plan and a clipboard.', 'Every slot has a purpose.', 'Balance wins drafts.'],
    bid: ['This fills a gap.', 'Exactly what the formation needs.', 'Checks out on the spreadsheet.'],
    jump: ['I need this one. Seriously.', 'This is the missing piece.'],
    win: ['Slot filled. Next.', 'The plan is coming together.', 'Depth chart looking healthy.'],
    steal: ['Need filled and on budget. Chef’s kiss.'],
    lose: ['Fine, I’ll adjust the formation.', 'Back to the drawing board.', 'Plan B it is.'],
    free: ['Hole plugged. Thank you.', 'Free and useful. My favourite.'],
    rival: ['Do you even need that position?', 'Interesting team building strategy.'],
    need: ['I need a {slot}, not another anything else!', 'Somebody sell me a {slot}.']
  },
  chaos: {
    start: ['I have absolutely no plan.', 'Let’s make this weird.', 'I flipped a coin to decide my strategy. It landed on its side.'],
    bid: ['Why not?', 'My horoscope said bid.', 'Vibes say yes.', 'I don’t even know what this is.'],
    jump: ['SURPRISE!', 'Chaos tax: applied.', 'Big number because I said so.'],
    win: ['I meant to do that.', 'No idea why I wanted this. Love it.', 'Chaos reigns!'],
    steal: ['Got it cheap. Accidentally.'],
    lose: ['I wasn’t even trying. Mostly.', 'Plot twist incoming.', 'You win this round, sensible person.'],
    free: ['Random pick, random glory.', 'Eeny, meeny, mine.'],
    rival: ['Bold. I like bold.', 'Respect the madness.']
  }
};
const talkMemory = new Map();
function botLine(bot, event, extra) {
  const lines = (TALK[bot.bot.type] || {})[event];
  if (!lines || !lines.length) return null;
  const recent = talkMemory.get(bot.id) || [];
  const fresh = lines.filter(l => !recent.includes(l));
  const pool = fresh.length ? fresh : lines;
  const line = pool[Math.floor(Math.random() * pool.length)];
  talkMemory.set(bot.id, [...recent, line].slice(-6));
  return line.replace('{slot}', extra && extra.slot || 'player');
}
const TALK_CHANCE = {
  start: 1,
  bid: 0.22,
  jump: 0.75,
  win: 0.6,
  steal: 0.85,
  lose: 0.45,
  free: 0.5,
  rival: 0.45,
  need: 0.35
};
const KITS = {
  'brazil': ['#FFDC02', '#1B7A3E'],
  'italy': ['#1F4FA8', '#ffffff'],
  'belgium': ['#E30613', '#FFD200'],
  'france': ['#1E2A5E', '#ffffff'],
  'argentina': ['#75AADB', '#ffffff'],
  'netherlands': ['#F36C21', '#1d1d1d'],
  'portugal': ['#B5121B', '#2BB673'],
  'morocco': ['#C1272D', '#2BB673'],
  'england': ['#ffffff', '#1D2A5B'],
  'croatia': ['#E4002B', '#ffffff'],
  'germany': ['#ffffff', '#111111'],
  'spain': ['#C60B1E', '#FFC400'],
  'uruguay': ['#5CBFEB', '#111111'],
  'norway': ['#BA0C2F', '#ffffff'],
  'egypt': ['#C8102E', '#ffffff'],
  'serbia': ['#C6363C', '#ffffff'],
  'slovenia': ['#ffffff', '#2A57A6'],
  'canada': ['#D80621', '#ffffff'],
  'greece': ['#0D5EAF', '#ffffff'],
  'cameroon': ['#007A5E', '#FCD116'],
  'lithuania': ['#FDB913', '#006A44'],
  'usa': ['#0A3161', '#ffffff'],
  'russia': ['#D52B1E', '#ffffff'],
  'finland': ['#ffffff', '#002F6C'],
  'sweden': ['#FECC00', '#006AA7'],
  'switzerland': ['#D52B1E', '#ffffff'],
  'czechia': ['#11457E', '#ffffff'],
  'poland': ['#ffffff', '#DC143C'],
  'soviet union': ['#CC0000', '#FFD700'],
  'nigeria': ['#008751', '#ffffff'],
  'china': ['#DE2910', '#FFDE00'],
  'dr congo': ['#007FFF', '#F7D618'],
  'dominican rep.': ['#002D62', '#CE1126'],
  'india': ['#1C4E9D', '#FF9933'],
  'pakistan': ['#01411C', '#ffffff'],
  'australia': ['#FFCD00', '#00843D'],
  'new zealand': ['#111111', '#ffffff'],
  'south africa': ['#007A4D', '#FFB612'],
  'sri lanka': ['#0A2A6E', '#FFBE29'],
  'bangladesh': ['#006A4E', '#F42A41'],
  'afghanistan': ['#0066B3', '#ffffff'],
  'west indies': ['#7B0041', '#FFC72C'],
  'scotland': ['#0065BF', '#ffffff'],
  'turkey': ['#E30A17', '#ffffff'],
  'saudi arabia': ['#006C35', '#ffffff'],
  'man utd': ['#DA291C', '#ffffff'],
  'man city': ['#6CABDD', '#1C2C5B'],
  'chelsea': ['#034694', '#ffffff'],
  'arsenal': ['#EF0107', '#ffffff'],
  'liverpool': ['#C8102E', '#F6EB61'],
  'newcastle': ['#241F20', '#ffffff'],
  'spurs': ['#ffffff', '#132257'],
  'tottenham': ['#ffffff', '#132257'],
  'aston villa': ['#670E36', '#95BFE5'],
  'real madrid': ['#ffffff', '#C9A227'],
  'barcelona': ['#A50044', '#EDBB00'],
  'atlético madrid': ['#CB3524', '#ffffff'],
  'sevilla': ['#ffffff', '#D4021D'],
  'real sociedad': ['#0067B1', '#ffffff'],
  'inter': ['#0068A8', '#111111'],
  'inter miami': ['#F7B5CD', '#231F20'],
  'ac milan': ['#FB090B', '#111111'],
  'juventus': ['#111111', '#ffffff'],
  'napoli': ['#12A0D7', '#ffffff'],
  'roma': ['#8E1F2F', '#F0BC42'],
  'bayern munich': ['#DC052D', '#ffffff'],
  'dortmund': ['#FDE100', '#111111'],
  'bayer leverkusen': ['#E32221', '#111111'],
  'rb leipzig': ['#ffffff', '#DD0741'],
  'psg': ['#004170', '#DA291C'],
  'ajax': ['#ffffff', '#D2122E'],
  'benfica': ['#E83030', '#ffffff'],
  'porto': ['#00428C', '#ffffff'],
  'celtic': ['#018749', '#ffffff'],
  'al nassr': ['#FFE100', '#1F3F99'],
  'galatasaray': ['#A90432', '#FDB912'],
  'boca juniors': ['#103F79', '#F3B229']
};
const KIT_RX = Object.keys(KITS).map(k => [k, new RegExp('(^|[^\\p{L}])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[^\\p{L}])', 'iu')]);
const FALLBACK_KITS = [['#3d8bff', '#ffffff'], ['#ff4f64', '#ffffff'], ['#2fd17c', '#0f2a1b'], ['#a46bff', '#ffffff'], ['#ff8a3a', '#1a1300'], ['#22cfd6', '#082a2c'], ['#ffc83d', '#2a1d00'], ['#1d1d1d', '#ffc83d'], ['#ffffff', '#c8102e'], ['#0b3d2e', '#f5d76e']];
const TILE_BG = [['#ff8a5c', '#b8325e'], ['#5ec8ff', '#3b46c9'], ['#7ee08a', '#1f7a6a'], ['#ffd66b', '#e0701f'], ['#c79bff', '#5a32b8'], ['#ff7eb6', '#9c2f8f'], ['#6ff0e0', '#1c6fa8'], ['#ffb36b', '#a6402a']];
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function kitColors(item) {
  if (item.kit && item.kit.length === 2) return item.kit;
  const hay = item.name + ' · ' + (item.desc || '');
  let best = null;
  KIT_RX.forEach(([k, rx]) => {
    const m = hay.match(rx);
    if (m) {
      const idx = m.index + m[1].length;
      if (!best || idx < best.idx || idx === best.idx && k.length > best.k.length) best = {
        k,
        idx
      };
    }
  });
  return best ? KITS[best.k] : FALLBACK_KITS[hashStr(item.name) % FALLBACK_KITS.length];
}
const NUMS = {
  GK: [1, 1, 13],
  DEF: [2, 3, 4, 5, 6, 15],
  MID: [6, 8, 10, 14, 16, 17],
  FWD: [7, 9, 10, 11, 19, 20],
  G: [1, 30, 31, 35]
};
function kitNumber(item) {
  const h = hashStr(item.name);
  const set = NUMS[norm(item.pos)];
  return set ? set[h % set.length] : h % 98 + 1;
}
function lum(hex) {
  const h = hex.replace('#', '');
  const v = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
const artOf = topic => topic && topic.art || (topic && topic.layout === 'pitch' ? 'kit' : 'emoji');
function imageSources(item, topic, wikiUrl) {
  const out = [];
  if (item.photo) out.push({
    src: item.photo,
    kind: 'upload'
  });
  if (item.imageData) out.push({
    src: item.imageData,
    kind: 'link'
  });else if (item.imageUrl) out.push({
    src: item.imageUrl,
    kind: 'link',
    noCors: true
  });
  if (wikiUrl) out.push({
    src: wikiUrl,
    kind: 'wiki'
  });
  return out;
}
function ItemArt({
  item,
  topic,
  size = 44,
  round = false,
  radius
}) {
  const title = wikiTitleFor(item, topic);
  const wikiUrl = useWikiImage(item.photo || item.imageData || item.imageUrl ? null : title);
  const sources = imageSources(item, topic, wikiUrl);
  const key = sources.map(s => s.src.slice(0, 60)).join('|');
  const [failed, setFailed] = useState(0);
  useEffect(() => {
    setFailed(0);
  }, [key]);
  const r = round ? '50%' : (radius != null ? radius : Math.round(size * 0.22)) + 'px';
  const box = {
    width: size,
    height: size,
    borderRadius: r,
    flex: 'none',
    overflow: 'hidden',
    display: 'block'
  };
  const pick = sources[failed];
  if (pick) {
    return React.createElement("img", {
      src: pick.src,
      alt: "",
      crossOrigin: pick.noCors || pick.kind !== 'wiki' ? undefined : 'anonymous',
      referrerPolicy: "no-referrer",
      loading: "lazy",
      decoding: "async",
      onError: () => setFailed(f => f + 1),
      style: {
        ...box,
        objectFit: 'cover',
        objectPosition: '50% 18%',
        background: '#120f27'
      }
    });
  }
  return React.createElement(ArtFallback, {
    item: item,
    topic: topic,
    size: size,
    box: box
  });
}
function ArtFallback({
  item,
  topic,
  size,
  box
}) {
  if (artOf(topic) === 'kit') {
    const [c1, c2] = kitColors(item);
    const ink = Math.abs(lum(c1) - lum(c2)) < 0.3 ? onColor(c1) : c2;
    const label = topic && topic.kitLabel === 'initials' ? initials(item.name) : String(kitNumber(item));
    const tank = topic && topic.kitShape === 'tank';
    const gid = 'g' + hashStr(item.id || item.name);
    return React.createElement("svg", {
      viewBox: "0 0 100 100",
      style: box,
      "aria-hidden": "true"
    }, React.createElement("defs", null, React.createElement("radialGradient", {
      id: gid,
      cx: "50%",
      cy: "30%",
      r: "80%"
    }, React.createElement("stop", {
      offset: "0%",
      stopColor: c1,
      stopOpacity: ".55"
    }), React.createElement("stop", {
      offset: "100%",
      stopColor: "#120f27",
      stopOpacity: "1"
    }))), React.createElement("rect", {
      width: "100",
      height: "100",
      fill: 'url(#' + gid + ')'
    }), tank ? React.createElement("path", {
      d: "M35 12 L44 12 Q50 23 56 12 L65 12 Q65 27 73 33 L73 92 L27 92 L27 33 Q35 27 35 12 Z",
      fill: c1,
      stroke: "rgba(0,0,0,.35)",
      strokeWidth: "1.5"
    }) : React.createElement("path", {
      d: "M32 16 L42 11 Q50 20 58 11 L68 16 L89 31 L80 47 L71 41 L71 92 L29 92 L29 41 L20 47 L11 31 Z",
      fill: c1,
      stroke: "rgba(0,0,0,.35)",
      strokeWidth: "1.5"
    }), tank ? React.createElement("path", {
      d: "M44 12 Q50 23 56 12",
      fill: "none",
      stroke: c2,
      strokeWidth: "3.5"
    }) : React.createElement(React.Fragment, null, React.createElement("path", {
      d: "M42 11 Q50 20 58 11",
      fill: "none",
      stroke: c2,
      strokeWidth: "3.5"
    }), React.createElement("path", {
      d: "M20 47 L11 31 M80 47 L89 31",
      stroke: c2,
      strokeWidth: "4"
    })), React.createElement("text", {
      x: "50",
      y: label.length > 2 ? 72 : 76,
      textAnchor: "middle",
      fill: ink,
      fontFamily: "Anton, Impact, 'Arial Narrow', sans-serif",
      fontSize: label.length > 2 ? 22 : 34
    }, label));
  }
  const [a, b] = TILE_BG[hashStr(item.name) % TILE_BG.length];
  return React.createElement("span", {
    "aria-hidden": "true",
    style: {
      ...box,
      display: 'grid',
      placeItems: 'center',
      background: 'radial-gradient(circle at 30% 25%, ' + a + ', ' + b + ')',
      fontSize: Math.round(size * 0.56),
      lineHeight: 1
    }
  }, item.emoji || topic && topic.emoji || '🎲');
}
const emptyCount = m => m.team.filter(x => !x).length;
const isFull = m => emptyCount(m) === 0;
const spent = (d, m) => d.rules.budget - m.budget;
function assignSlot(m, item, slots) {
  const pos = norm(item.pos);
  const posInTemplate = pos && slots.some(s => norm(s) === pos);
  if (posInTemplate) {
    const i = slots.findIndex((s, k) => norm(s) === pos && !m.team[k]);
    if (i >= 0) return i;
    return slots.findIndex((s, k) => isFlex(s) && !m.team[k]);
  }
  return m.team.findIndex(x => !x);
}
function maxBid(m, rules) {
  const e = emptyCount(m);
  if (e === 0) return 0;
  const cap = rules.mustFill ? m.budget - rules.minBid * (e - 1) : m.budget;
  return Math.max(0, cap);
}
const currentItem = d => d.queue.length ? d.items[d.queue[0]] : null;
const nextAmount = d => d.bid ? d.bid.amount + d.rules.inc : d.rules.minBid;
function canBid(d, m, amount) {
  const item = currentItem(d);
  if (!item || isFull(m)) return false;
  if (assignSlot(m, item, d.rules.slots) < 0) return false;
  return amount >= d.rules.minBid && amount <= maxBid(m, d.rules);
}
function bidBlocker(d, m) {
  const item = currentItem(d);
  if (isFull(m)) return 'Team full';
  if (item && assignSlot(m, item, d.rules.slots) < 0) return 'No ' + (item.pos || 'open') + ' slot';
  if (maxBid(m, d.rules) < d.rules.minBid) return 'Out of money';
  if (maxBid(m, d.rules) < nextAmount(d)) return 'Max ' + money(maxBid(m, d.rules));
  return null;
}
const canTake = (d, m, id) => !isFull(m) && assignSlot(m, d.items[id], d.rules.slots) >= 0;
function snap(d) {
  return JSON.stringify({
    managers: d.managers,
    queue: d.queue,
    leftover: d.leftover,
    passed: d.passed,
    processed: d.processed,
    fp: d.fp,
    phase: d.phase,
    autoSkipped: d.autoSkipped || 0
  });
}
function withHistory(d, label) {
  return {
    ...d,
    managers: d.managers.map(m => ({
      ...m,
      team: [...m.team]
    })),
    queue: [...d.queue],
    leftover: [...d.leftover],
    passed: [...d.passed],
    fp: {
      ...d.fp
    },
    history: [...d.history, {
      s: snap(d),
      label
    }].slice(-80)
  };
}
function currentPicker(d) {
  let {
    round,
    pos
  } = d.fp;
  for (let tries = 0; tries < 3; tries++) {
    const order = round % 2 === 0 ? d.managers : [...d.managers].reverse();
    for (let i = pos; i < order.length; i++) {
      const m = order[i];
      if (d.leftover.some(id => canTake(d, m, id))) return {
        m,
        round,
        pos: i
      };
    }
    round++;
    pos = 0;
  }
  return null;
}
function isDraftOver(d) {
  if (d.managers.every(isFull)) return true;
  if (d.queue.length > 0) return false;
  return !currentPicker(d);
}
function advance(n) {
  n.bid = null;
  n.bids = [];
  while (n.queue.length) {
    const id = n.queue[0];
    const someoneCan = n.managers.some(m => !isFull(m) && assignSlot(m, n.items[id], n.rules.slots) >= 0 && maxBid(m, n.rules) >= n.rules.minBid);
    if (someoneCan) break;
    n.queue = n.queue.slice(1);
    n.leftover = [...n.leftover, id];
    n.processed++;
    n.autoSkipped = (n.autoSkipped || 0) + 1;
  }
  if (n.queue.length) n.phase = 'auction';else if (isDraftOver(n)) n.phase = 'done';else {
    if (n.phase !== 'freepick') n.fp = {
      round: 0,
      pos: 0
    };
    n.phase = 'freepick';
  }
  n.reveal = (n.reveal || 0) + 1;
  return n;
}
function createDraft(topic, managers, rules, extra) {
  const items = {};
  topic.items.forEach(it => {
    items[it.id] = {
      ...it
    };
  });
  const ids = topic.items.map(it => it.id);
  const d = {
    id: uid(),
    createdAt: Date.now(),
    topic: {
      id: topic.id,
      name: topic.name,
      emoji: topic.emoji,
      layout: topic.layout,
      art: artOf(topic),
      kitShape: topic.kitShape || '',
      kitLabel: topic.kitLabel || '',
      photos: !!topic.photos
    },
    rules: {
      ...rules
    },
    managers: managers.map(m => ({
      id: m.id,
      name: m.name.trim(),
      color: m.color,
      emoji: m.emoji,
      budget: rules.budget,
      team: rules.slots.map(() => null),
      ...(m.bot ? {
        bot: {
          ...m.bot
        }
      } : {}),
      ...(m.human ? {
        human: true
      } : {})
    })),
    items,
    queue: rules.order === 'random' ? shuffle(ids) : ids,
    leftover: [],
    passed: [],
    processed: 0,
    bid: null,
    bids: [],
    history: [],
    phase: 'auction',
    fp: {
      round: 0,
      pos: 0
    },
    reveal: 0,
    votes: {},
    votesRevealed: false,
    mode: 'local',
    seed: uid(),
    ...(extra || {})
  };
  return advance(d);
}
function placeBid(d, managerId, amount) {
  const m = d.managers.find(x => x.id === managerId);
  if (!m || !canBid(d, m, amount)) return d;
  if (d.bid && amount <= d.bid.amount) return d;
  return {
    ...d,
    bids: [...d.bids, d.bid],
    bid: {
      amount,
      leaderId: managerId
    }
  };
}
function undoBid(d) {
  if (!d.bid) return d;
  const bids = [...d.bids];
  const prev = bids.pop();
  return {
    ...d,
    bids,
    bid: prev || null
  };
}
function sell(d) {
  const id = d.queue[0];
  const b = d.bid;
  if (!id || !b) return d;
  const n = withHistory(d, 'Undo sale');
  const m = n.managers.find(x => x.id === b.leaderId);
  const slot = assignSlot(m, n.items[id], n.rules.slots);
  if (slot < 0) return d;
  m.team[slot] = {
    itemId: id,
    price: b.amount
  };
  m.budget -= b.amount;
  n.queue = n.queue.slice(1);
  n.processed++;
  return advance(n);
}
function skipItem(d) {
  const id = d.queue[0];
  if (!id) return d;
  const n = withHistory(d, 'Undo skip');
  n.queue = n.queue.slice(1);
  if (n.rules.noBids === 'back' && !n.passed.includes(id)) {
    n.queue.push(id);
    n.passed.push(id);
  } else {
    n.leftover.push(id);
    n.processed++;
  }
  return advance(n);
}
function freePick(d, itemId) {
  const cp = currentPicker(d);
  if (!cp) return d;
  const n = withHistory(d, 'Undo pick');
  const m = n.managers.find(x => x.id === cp.m.id);
  const slot = assignSlot(m, n.items[itemId], n.rules.slots);
  if (slot < 0) return d;
  m.team[slot] = {
    itemId,
    price: 0,
    free: true
  };
  n.leftover = n.leftover.filter(x => x !== itemId);
  n.fp = {
    round: cp.round,
    pos: cp.pos + 1
  };
  if (isDraftOver(n)) n.phase = 'done';
  n.reveal++;
  return n;
}
function undo(d) {
  if (d.bid) return undoBid(d);
  if (!d.history.length) return d;
  const h = d.history[d.history.length - 1];
  const s = JSON.parse(h.s);
  return {
    ...d,
    ...s,
    history: d.history.slice(0, -1),
    bid: null,
    bids: [],
    reveal: (d.reveal || 0) + 1,
    votes: {},
    votesRevealed: false
  };
}
const undoLabel = d => d.bid ? 'Undo bid' : d.history.length ? d.history[d.history.length - 1].label : 'Undo';
function draftStats(d) {
  const buys = [];
  d.managers.forEach(m => m.team.forEach((t, i) => {
    if (t) buys.push({
      m,
      item: d.items[t.itemId],
      price: t.price,
      free: !!t.free,
      slot: d.rules.slots[i]
    });
  }));
  const paid = buys.filter(b => !b.free);
  const out = {};
  if (paid.length) {
    out.expensive = paid.reduce((a, b) => b.price > a.price ? b : a);
    if (paid.length >= 2) {
      const groups = {};
      paid.forEach(b => {
        const k = norm(b.item.pos || b.slot);
        (groups[k] = groups[k] || []).push(b.price);
      });
      const avg = k => groups[k].reduce((a, b) => a + b, 0) / groups[k].length;
      let best = null;
      paid.forEach(b => {
        const k = norm(b.item.pos || b.slot);
        const gap = groups[k].length > 1 ? b.price - avg(k) : b.price - paid.reduce((a, x) => a + x.price, 0) / paid.length;
        if (!best || gap < best.gap || gap === best.gap && b.price < best.price) best = {
          ...b,
          gap
        };
      });
      out.bargain = best;
    }
  }
  const spends = d.managers.map(m => ({
    m,
    s: spent(d, m)
  }));
  out.spender = spends.reduce((a, b) => b.s > a.s ? b : a);
  out.cheapest = spends.reduce((a, b) => b.s < a.s ? b : a);
  return out;
}
function winsBoard(drafts) {
  const rows = {};
  drafts.forEach(d => {
    const {
      winners
    } = tally(d);
    const winIds = d.votesRevealed ? winners.map(w => w.id) : [];
    d.managers.forEach(m => {
      const k = m.name.trim().toLowerCase();
      if (!k) return;
      const r = rows[k] || (rows[k] = {
        name: m.name.trim(),
        emoji: m.emoji,
        color: m.color,
        wins: 0,
        played: 0,
        at: 0
      });
      r.played++;
      if (winIds.includes(m.id)) r.wins++;
      if ((d.createdAt || 0) >= r.at) {
        r.at = d.createdAt || 0;
        r.emoji = m.emoji;
        r.color = m.color;
        r.name = m.name.trim();
      }
    });
  });
  return Object.values(rows).sort((a, b) => b.wins - a.wins || a.played - b.played || a.name.localeCompare(b.name));
}
function Leaderboard({
  rows,
  highlight = []
}) {
  if (!rows.length) return null;
  const top = Math.max(1, ...rows.map(r => r.wins));
  return React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83C\uDFC6 All-time wins"), rows.map((r, i) => React.createElement("div", {
    key: r.name,
    className: 'brow' + (highlight.includes(r.name.toLowerCase()) ? ' hl' : ''),
    style: mStyle(r)
  }, React.createElement("span", {
    className: "rk num"
  }, (() => {
    const rank = rows.findIndex(x => x.wins === r.wins) + 1;
    return rank === 1 && r.wins > 0 ? '👑' : rank;
  })()), React.createElement("span", {
    className: "bn"
  }, r.emoji, " ", r.name), React.createElement("span", {
    className: "bb"
  }, React.createElement("i", {
    style: {
      width: r.wins / top * 100 + '%'
    }
  })), React.createElement("span", {
    className: "bw num"
  }, r.wins, React.createElement("small", null, " / ", r.played)))), React.createElement("p", {
    className: "hint"
  }, "Wins / drafts played. Counted by name, so keep names the same each time."));
}
function tally(d) {
  const counts = {};
  d.managers.forEach(m => {
    counts[m.id] = 0;
  });
  Object.values(d.votes || {}).forEach(t => {
    if (counts[t] !== undefined) counts[t]++;
  });
  const top = Math.max(0, ...Object.values(counts));
  return {
    counts,
    winners: top > 0 ? d.managers.filter(m => counts[m.id] === top) : []
  };
}
function Sheet({
  onClose,
  children,
  center
}) {
  useEffect(() => {
    const k = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return React.createElement("div", {
    className: 'backdrop' + (center ? ' center' : ''),
    onClick: onClose
  }, React.createElement("div", {
    className: center ? 'modal' : 'sheet',
    onClick: e => e.stopPropagation(),
    role: "dialog",
    "aria-modal": "true"
  }, !center && React.createElement("div", {
    className: "grab"
  }), children));
}
function Confirm({
  title,
  body,
  yes = 'Confirm',
  danger,
  onYes,
  onClose
}) {
  return React.createElement(Sheet, {
    center: true,
    onClose: onClose
  }, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 30
    }
  }, title), body && React.createElement("p", {
    className: "muted",
    style: {
      margin: 0
    }
  }, body), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn btn-ghost grow",
    onClick: onClose
  }, "Cancel"), React.createElement("button", {
    className: 'btn grow ' + (danger ? 'btn-danger solid' : 'btn-gold'),
    onClick: () => {
      onYes();
      onClose();
    }
  }, yes)));
}
function TopBar({
  onBack,
  title,
  right,
  backLabel = '←'
}) {
  return React.createElement("div", {
    className: "topbar"
  }, onBack ? React.createElement("button", {
    className: "iconbtn",
    onClick: onBack,
    "aria-label": "Back"
  }, backLabel) : React.createElement("span", {
    style: {
      width: 46
    }
  }), React.createElement("div", {
    className: "title"
  }, title), right || React.createElement("span", {
    style: {
      width: 46
    }
  }));
}
function Seg({
  value,
  options,
  onChange,
  label
}) {
  return React.createElement("div", {
    className: "seg",
    role: "group",
    "aria-label": label
  }, options.map(([v, l]) => React.createElement("button", {
    key: String(v),
    type: "button",
    "aria-pressed": value === v,
    onClick: () => onChange(v)
  }, l)));
}
function Toggle({
  on,
  onChange,
  title,
  sub
}) {
  return React.createElement("button", {
    type: "button",
    className: "toggle",
    "aria-pressed": on,
    onClick: () => onChange(!on)
  }, React.createElement("span", {
    className: "grow"
  }, React.createElement("b", {
    style: {
      display: 'block',
      fontSize: 17
    }
  }, title), sub && React.createElement("span", {
    className: "small muted"
  }, sub)), React.createElement("span", {
    className: "sw"
  }));
}
function Stepper({
  id,
  value,
  onChange,
  min = 0,
  max = 999,
  prefix = ''
}) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => {
    setTxt(String(value));
  }, [value]);
  const clamp = v => Math.max(min, Math.min(max, v));
  return React.createElement("div", {
    className: "stepper"
  }, React.createElement("button", {
    type: "button",
    onClick: () => onChange(clamp(value - 1)),
    "aria-label": "Decrease"
  }, "\u2212"), React.createElement("input", {
    id: id,
    className: "input grow",
    inputMode: "numeric",
    value: prefix + txt,
    onChange: e => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      setTxt(raw);
      if (raw !== '') onChange(clamp(parseInt(raw, 10)));
    },
    onBlur: () => setTxt(String(value))
  }), React.createElement("button", {
    type: "button",
    onClick: () => onChange(clamp(value + 1)),
    "aria-label": "Increase"
  }, "+"));
}
function Thumb({
  item,
  topic,
  size = 44
}) {
  return React.createElement(ItemArt, {
    item: item,
    topic: topic,
    size: size,
    radius: 10
  });
}
function MChip({
  m
}) {
  return React.createElement("span", {
    className: "mchip",
    style: mStyle(m)
  }, React.createElement("b", null, m.emoji), m.name);
}
function TeamList({
  d,
  m
}) {
  return React.createElement("div", null, d.rules.slots.map((s, i) => {
    const t = m.team[i];
    const it = t && d.items[t.itemId];
    return React.createElement("div", {
      className: "slotline",
      key: i
    }, React.createElement("span", {
      className: "s"
    }, s), it && React.createElement(ItemArt, {
      item: it,
      topic: d.topic,
      size: 30,
      radius: 7
    }), it ? React.createElement("span", {
      className: "n"
    }, it.name, t.free && React.createElement("span", {
      className: "muted small"
    }, " \xB7 free")) : React.createElement("span", {
      className: "n empty"
    }, "Empty"), t && React.createElement("span", {
      className: "p num"
    }, money(t.price)));
  }));
}
function TeamsSheet({
  d,
  onClose
}) {
  return React.createElement(Sheet, {
    onClose: onClose
  }, React.createElement("div", {
    className: "stack"
  }, React.createElement("div", {
    className: "row"
  }, React.createElement("h2", {
    className: "display grow",
    style: {
      fontSize: 30
    }
  }, "Teams so far"), React.createElement("button", {
    className: "iconbtn",
    onClick: onClose,
    "aria-label": "Close"
  }, "\u2715")), d.managers.map(m => React.createElement("div", {
    className: "tteam",
    key: m.id,
    style: mStyle(m)
  }, React.createElement("div", {
    className: "row",
    style: {
      marginBottom: 4
    }
  }, React.createElement("h3", {
    className: "grow"
  }, m.emoji, " ", m.name), React.createElement("span", {
    className: "num",
    style: {
      fontFamily: 'var(--display)',
      fontSize: 22,
      color: 'var(--gold)'
    }
  }, money(m.budget), " left")), React.createElement(TeamList, {
    d: d,
    m: m
  })))));
}
function Home({
  draft,
  past,
  onNew,
  onSolo,
  onResume,
  onTopics,
  onPast,
  onAbandon,
  onSettings,
  showInstall,
  onDismissInstall
}) {
  const [ask, setAsk] = useState(null);
  const [soon, setSoon] = useState(false);
  const status = draft && (draft.phase === 'auction' ? 'Item ' + (draft.processed + 1) + ' of ' + (draft.processed + draft.queue.length) : draft.phase === 'freepick' ? 'Free picks' : 'Results & voting');
  return React.createElement("div", {
    className: "app"
  }, React.createElement("div", {
    className: "hero"
  }, React.createElement("span", {
    className: "tag"
  }, React.createElement("i", null), "$20 AUCTION"), React.createElement("h1", {
    className: "display logo"
  }, "Draft", React.createElement("span", null, "Night")), React.createElement("p", {
    className: "muted",
    style: {
      margin: 0,
      maxWidth: 300
    }
  }, "One phone, one auctioneer, everyone shouting bids. Build the best team for the money.")), draft && React.createElement("div", {
    className: "card resume stack"
  }, React.createElement("p", {
    className: "eyebrow",
    style: {
      color: 'var(--gold)'
    }
  }, "Draft in progress"), React.createElement("div", {
    className: "row"
  }, React.createElement("span", {
    style: {
      fontSize: 30
    }
  }, draft.topic.emoji), React.createElement("div", {
    className: "grow"
  }, React.createElement("h3", null, draft.topic.name), React.createElement("span", {
    className: "small muted"
  }, draft.mode === 'solo' ? 'Solo · ' + (BOT_LEVELS[(draft.solo || {}).level] || BOT_LEVELS.medium).label + ' · ' : '', status))), React.createElement("div", {
    className: "chips"
  }, draft.managers.map(m => React.createElement(MChip, {
    key: m.id,
    m: m
  }))), React.createElement("button", {
    className: "btn btn-gold",
    onClick: onResume
  }, "Resume draft"), React.createElement("button", {
    className: "btn btn-sm btn-ghost",
    style: {
      alignSelf: 'center',
      border: 0,
      color: 'var(--muted)'
    },
    onClick: () => setAsk('abandon')
  }, "Abandon this draft")), React.createElement("div", {
    className: "modes",
    role: "group",
    "aria-label": "Game mode"
  }, React.createElement("button", {
    className: "mode solo",
    onClick: () => draft ? setAsk('solo') : onSolo()
  }, React.createElement("span", {
    className: "mi"
  }, "\uD83E\uDD16"), React.createElement("span", {
    className: "mt"
  }, "Solo"), React.createElement("span", {
    className: "ms"
  }, "You vs bots")), React.createElement("button", {
    className: "mode local",
    onClick: () => draft ? setAsk('new') : onNew()
  }, React.createElement("span", {
    className: "mi"
  }, "\uD83D\uDCF1"), React.createElement("span", {
    className: "mt"
  }, "Local"), React.createElement("span", {
    className: "ms"
  }, "Pass the phone")), React.createElement("button", {
    className: "mode online",
    "aria-disabled": "true",
    onClick: () => setSoon(true)
  }, React.createElement("span", {
    className: "mi"
  }, "\uD83C\uDF10"), React.createElement("span", {
    className: "mt"
  }, "Online"), React.createElement("span", {
    className: "ms"
  }, "Coming soon"))), soon && React.createElement("p", {
    className: "hint soon",
    role: "status"
  }, "Online rooms, where everyone bids from their own phone, are coming in a later update. For now, play Solo or Local."), React.createElement("div", {
    className: "menu"
  }, React.createElement("button", {
    className: "btn",
    onClick: onTopics
  }, "Topics"), React.createElement("button", {
    className: "btn",
    onClick: onPast
  }, "Past drafts", past.length ? ' (' + past.length + ')' : ''), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onSettings
  }, "Backup & app settings")), showInstall && React.createElement("div", {
    className: "card row installcard"
  }, React.createElement("span", {
    style: {
      fontSize: 28
    }
  }, "\uD83D\uDCF2"), React.createElement("div", {
    className: "grow"
  }, React.createElement("b", null, "Put Draft Night on your home screen"), React.createElement("span", {
    className: "small muted",
    style: {
      display: 'block'
    }
  }, "Opens full screen, like an app.")), React.createElement("button", {
    className: "btn btn-sm",
    onClick: onSettings
  }, "How"), React.createElement("button", {
    className: "mini",
    "aria-label": "Hide",
    onClick: onDismissInstall
  }, "\u2715")), (ask === 'new' || ask === 'solo') && React.createElement(Confirm, {
    title: "Start over?",
    body: "A new draft replaces the one in progress. Finished drafts stay in Past Drafts.",
    yes: "New draft",
    danger: true,
    onYes: ask === 'solo' ? onSolo : onNew,
    onClose: () => setAsk(null)
  }), ask === 'abandon' && React.createElement(Confirm, {
    title: "Abandon draft?",
    body: "The draft in progress will be deleted.",
    yes: "Abandon",
    danger: true,
    onYes: onAbandon,
    onClose: () => setAsk(null)
  }));
}
function TopicsList({
  topics,
  onBack,
  onOpen,
  onCreate,
  onDuplicate,
  onDelete,
  folder,
  setFolder
}) {
  const [del, setDel] = useState(null);
  const [q, setQ] = useState('');
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: folder && !q ? () => setFolder(null) : onBack,
    title: 'Topics (' + topics.length + ')'
  }), React.createElement("button", {
    className: "btn btn-gold",
    onClick: () => onCreate(folder)
  }, "+ New topic", folder ? ' in ' + folder : ''), React.createElement(TopicSearch, {
    q: q,
    setQ: setQ
  }), React.createElement(FolderBrowser, {
    topics: topics,
    q: q,
    folder: folder,
    setFolder: setFolder,
    renderTopic: t => React.createElement("div", {
      key: t.id,
      className: "card stack-sm",
      style: {
        padding: 12
      }
    }, React.createElement("button", {
      className: "tcard",
      style: {
        border: 0,
        padding: 0,
        background: 'none'
      },
      onClick: () => onOpen(t.id)
    }, React.createElement("span", {
      className: "em"
    }, t.emoji || '🎲'), React.createElement("span", {
      className: "meta"
    }, React.createElement("span", {
      className: "name"
    }, t.name), React.createElement("span", {
      className: "sub"
    }, t.items.length, " items \xB7 ", t.slots.join(', '))), React.createElement("span", {
      className: "muted",
      style: {
        fontSize: 22
      }
    }, "\u203A")), React.createElement("div", {
      className: "row"
    }, React.createElement("button", {
      className: "btn btn-sm grow",
      onClick: () => onOpen(t.id)
    }, "Edit"), React.createElement("button", {
      className: "btn btn-sm grow",
      onClick: () => onDuplicate(t.id)
    }, "Duplicate"), React.createElement("button", {
      className: "btn btn-sm btn-danger grow",
      onClick: () => setDel(t)
    }, "Delete")))
  }), !topics.length && React.createElement("p", {
    className: "muted"
  }, "No topics yet. Create one to start a draft."), del && React.createElement(Confirm, {
    title: "Delete topic?",
    body: '“' + del.name + '” and its ' + del.items.length + ' items will be removed.',
    yes: "Delete",
    danger: true,
    onYes: () => onDelete(del.id),
    onClose: () => setDel(null)
  }));
}
function ItemEditor({
  item,
  slots,
  topic,
  onSave,
  onDelete,
  onClose
}) {
  const [f, setF] = useState({
    ...item
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  const positions = [...new Set(slots.filter(s => !isFlex(s)))];
  const hasCustom = f.pos && !positions.some(p => norm(p) === norm(f.pos));
  const [link, setLink] = useState(item.imageUrl || '');
  const [linkMsg, setLinkMsg] = useState(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const pick = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setErr('');
    if (file.type && !/^image\//.test(file.type)) {
      setErr("That file isn't a photo. Choose a JPG, PNG, WebP or HEIC image.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErr('That photo is over 25 MB. Choose a smaller one.');
      return;
    }
    setBusy(true);
    try {
      const url = await resizeImage(file);
      setF(x => ({
        ...x,
        photo: url
      }));
    } catch (er) {
      setErr("This browser couldn't open that photo. Try a JPG or PNG, or take a screenshot of it and upload that.");
    }
    setBusy(false);
  };
  const useLink = async () => {
    const raw = link.trim();
    setLinkMsg(null);
    let u;
    try {
      u = new URL(raw);
    } catch (e) {
      setLinkMsg({
        kind: 'err',
        text: 'That isn’t a web link. It should start with https://'
      });
      return;
    }
    if (u.protocol !== 'https:') {
      setLinkMsg({
        kind: 'err',
        text: 'Use a link that starts with https:// so it loads on every phone.'
      });
      return;
    }
    setLinkBusy(true);
    const loads = await new Promise(resolve => {
      const img = new Image();
      const t = setTimeout(() => resolve(false), 10000);
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        clearTimeout(t);
        resolve(img.naturalWidth > 0);
      };
      img.onerror = () => {
        clearTimeout(t);
        resolve(false);
      };
      img.src = u.href;
    });
    if (!loads) {
      setLinkBusy(false);
      setLinkMsg({
        kind: 'err',
        text: "No image loaded from that link. Copy the image's own address (long-press the picture → Copy Image Address), not the page link."
      });
      return;
    }
    let data = '';
    try {
      const res = await fetch(u.href, {
        mode: 'cors',
        referrerPolicy: 'no-referrer'
      });
      if (res.ok) {
        const blob = await res.blob();
        if (/^image\//.test(blob.type)) data = await resizeImage(blob);
      }
    } catch (e) {
      data = '';
    }
    setF(x => ({
      ...x,
      imageUrl: u.href,
      imageData: data
    }));
    setLinkBusy(false);
    setLinkMsg(data ? {
      kind: 'ok',
      text: 'Image saved. It also works offline and goes into backups.'
    } : {
      kind: 'warn',
      text: 'Image linked. That site doesn’t allow copying, so it needs internet and may be missing from saved images.'
    });
  };
  const clearLink = () => {
    setLink('');
    setLinkMsg(null);
    setF(x => {
      const {
        imageUrl,
        imageData,
        ...rest
      } = x;
      return rest;
    });
  };
  const wikiDefault = topic.photos ? wikiTitleFor({
    ...f,
    wiki: ''
  }, topic) : null;
  const shownWiki = useWikiImage(!f.photo && !f.imageData && !f.imageUrl ? wikiTitleFor(f, topic) : null);
  const source = f.photo ? 'Your uploaded photo' : f.imageData || f.imageUrl ? 'Image link' : shownWiki ? 'Wikipedia photo' : wikiTitleFor(f, topic) && shownWiki === undefined ? 'Looking for a Wikipedia photo…' : artOf(topic) === 'kit' ? 'Jersey' : 'Emoji';
  return React.createElement(Sheet, {
    center: true,
    onClose: onClose
  }, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 30
    }
  }, item.name ? 'Edit item' : 'New item'), React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "it-name"
  }, "Name"), React.createElement("input", {
    id: "it-name",
    className: "input",
    value: f.name,
    onChange: e => setF({
      ...f,
      name: e.target.value
    }),
    placeholder: "e.g. Thierry Henry"
  })), React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "it-pos"
  }, "Position"), React.createElement("select", {
    id: "it-pos",
    className: "input",
    value: hasCustom ? '__custom' : f.pos,
    onChange: e => setF({
      ...f,
      pos: e.target.value === '__custom' ? f.pos || ' ' : e.target.value
    })
  }, React.createElement("option", {
    value: ""
  }, "None (fits any slot)"), positions.map(p => React.createElement("option", {
    key: p,
    value: p
  }, p)), React.createElement("option", {
    value: "__custom"
  }, "Other\u2026")), hasCustom && React.createElement("input", {
    id: "it-pos-custom",
    className: "input",
    value: f.pos.trim(),
    onChange: e => setF({
      ...f,
      pos: e.target.value
    }),
    placeholder: "Position name"
  })), React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "it-desc"
  }, "Short description"), React.createElement("input", {
    id: "it-desc",
    className: "input",
    value: f.desc,
    onChange: e => setF({
      ...f,
      desc: e.target.value
    }),
    placeholder: "Club, era, stat\u2026"
  })), artOf(topic) === 'emoji' ? React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "it-emoji"
  }, "Picture emoji"), React.createElement("input", {
    id: "it-emoji",
    className: "input",
    style: {
      fontSize: 26
    },
    value: f.emoji || '',
    onChange: e => setF({
      ...f,
      emoji: [...e.target.value].slice(-2).join('')
    }),
    placeholder: topic.emoji
  })) : React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Kit colours"), React.createElement("div", {
    className: "row"
  }, React.createElement("input", {
    id: "it-kit1",
    type: "color",
    "aria-label": "Shirt colour",
    value: (f.kit || kitColors(f))[0],
    onChange: e => setF({
      ...f,
      kit: [e.target.value, (f.kit || kitColors(f))[1]]
    }),
    style: {
      width: 56,
      height: 46,
      border: 0,
      background: 'none'
    }
  }), React.createElement("input", {
    id: "it-kit2",
    type: "color",
    "aria-label": "Number colour",
    value: (f.kit || kitColors(f))[1],
    onChange: e => setF({
      ...f,
      kit: [(f.kit || kitColors(f))[0], e.target.value]
    }),
    style: {
      width: 56,
      height: 46,
      border: 0,
      background: 'none'
    }
  }), f.kit ? React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-ghost",
    onClick: () => {
      const {
        kit,
        ...rest
      } = f;
      setF(rest);
    }
  }, "Auto") : React.createElement("span", {
    className: "hint"
  }, "Auto from the country or club in the description"))), React.createElement("div", {
    className: "field picbox"
  }, React.createElement("span", {
    className: "label"
  }, "Picture"), React.createElement("div", {
    className: "row"
  }, React.createElement(ItemArt, {
    item: f,
    topic: topic,
    size: 76
  }), React.createElement("div", {
    className: "grow stack-sm"
  }, React.createElement("span", {
    className: "small",
    style: {
      fontWeight: 700
    }
  }, "Showing: ", source), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    type: "button",
    className: "btn btn-sm grow",
    onClick: () => fileRef.current && fileRef.current.click(),
    disabled: busy
  }, busy ? 'Resizing…' : f.photo ? 'Change photo' : 'Upload photo'), f.photo && React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-danger",
    onClick: () => setF({
      ...f,
      photo: ''
    })
  }, "Remove")))), React.createElement("input", {
    ref: fileRef,
    id: "it-photo",
    type: "file",
    accept: "image/*",
    hidden: true,
    onChange: pick
  }), err && React.createElement("p", {
    className: "warn"
  }, err), React.createElement("label", {
    htmlFor: "it-link",
    className: "label",
    style: {
      marginTop: 6
    }
  }, "Image link"), React.createElement("div", {
    className: "row"
  }, React.createElement("input", {
    id: "it-link",
    className: "input grow",
    type: "url",
    inputMode: "url",
    autoCapitalize: "off",
    autoCorrect: "off",
    spellCheck: "false",
    value: link,
    onChange: e => {
      setLink(e.target.value);
      setLinkMsg(null);
    },
    placeholder: "https://\u2026/photo.jpg"
  }), (f.imageUrl || f.imageData) && link.trim() === (f.imageUrl || '') ? React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-danger",
    onClick: clearLink
  }, "Remove") : React.createElement("button", {
    type: "button",
    className: "btn btn-sm",
    disabled: !link.trim() || linkBusy,
    onClick: useLink
  }, linkBusy ? 'Checking…' : 'Use')), linkMsg && React.createElement("p", {
    className: linkMsg.kind === 'err' ? 'warn' : 'hint',
    style: linkMsg.kind === 'ok' ? {
      color: 'var(--ok)'
    } : null
  }, linkMsg.text), f.photo && (f.imageUrl || f.imageData) && React.createElement("p", {
    className: "hint"
  }, "Your uploaded photo is used first. Remove it to show the link instead."), topic.photos && React.createElement(React.Fragment, null, React.createElement("label", {
    htmlFor: "it-wiki",
    className: "label",
    style: {
      marginTop: 6
    }
  }, "Wikipedia page"), React.createElement("input", {
    id: "it-wiki",
    className: "input",
    value: f.wiki || '',
    autoCapitalize: "off",
    onChange: e => setF({
      ...f,
      wiki: e.target.value
    }),
    placeholder: wikiDefault || 'No photo for this item'
  }), React.createElement("p", {
    className: "hint"
  }, "Wrong photo? Type the exact article name, e.g. \u201CDave (rapper)\u201D."), React.createElement("label", {
    className: "row small",
    style: {
      gap: 8
    }
  }, React.createElement("input", {
    id: "it-nophoto",
    type: "checkbox",
    checked: !!f.photosOff,
    onChange: e => setF({
      ...f,
      photosOff: e.target.checked
    }),
    style: {
      width: 22,
      height: 22
    }
  }), " No Wikipedia photo for this item"))), React.createElement("div", {
    className: "row"
  }, onDelete && React.createElement("button", {
    className: "btn btn-danger btn-sm",
    onClick: () => {
      onDelete();
      onClose();
    }
  }, "Delete"), React.createElement("button", {
    className: "btn btn-ghost grow",
    onClick: onClose
  }, "Cancel"), React.createElement("button", {
    className: "btn btn-gold grow",
    disabled: !f.name.trim(),
    onClick: () => {
      onSave({
        ...f,
        name: f.name.trim(),
        pos: (f.pos || '').trim(),
        desc: (f.desc || '').trim(),
        wiki: (f.wiki || '').trim()
      });
      onClose();
    }
  }, "Save")));
}
function TopicEditor({
  topic,
  folders,
  onChange,
  onBack,
  onDuplicate,
  onDelete
}) {
  const [newFolder, setNewFolder] = useState(false);
  const [editing, setEditing] = useState(null);
  const [bulk, setBulk] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [slotTxt, setSlotTxt] = useState(topic.slots.join(', '));
  const [del, setDel] = useState(false);
  useEffect(() => {
    setSlotTxt(topic.slots.join(', '));
  }, [topic.id]);
  const set = patch => onChange({
    ...topic,
    ...patch
  });
  const move = (i, dir) => {
    const a = [...topic.items];
    const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    set({
      items: a
    });
  };
  const saveItem = it => {
    const exists = topic.items.some(x => x.id === it.id);
    set({
      items: exists ? topic.items.map(x => x.id === it.id ? it : x) : [...topic.items, it]
    });
  };
  const doBulk = () => {
    const add = bulk.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const parts = l.split(/\s+[-–—]\s+/);
      return {
        id: uid(),
        name: parts[0].trim(),
        pos: (parts[1] || '').trim(),
        desc: parts.slice(2).join(' - ').trim(),
        photo: ''
      };
    }).filter(x => x.name);
    if (add.length) set({
      items: [...topic.items, ...add]
    });
    setBulk('');
    setBulkOpen(false);
  };
  const slotsParsed = parseSlots(slotTxt);
  const counts = {};
  topic.items.forEach(it => {
    const k = it.pos || '—';
    counts[k] = (counts[k] || 0) + 1;
  });
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: "Edit topic",
    right: React.createElement("button", {
      className: "pillbtn",
      onClick: onDuplicate
    }, "Copy")
  }), React.createElement("div", {
    className: "card stack"
  }, React.createElement("div", {
    className: "row"
  }, React.createElement("div", {
    className: "field",
    style: {
      width: 76,
      flex: 'none'
    }
  }, React.createElement("label", {
    htmlFor: "tp-emoji"
  }, "Emoji"), React.createElement("input", {
    id: "tp-emoji",
    className: "input",
    style: {
      textAlign: 'center',
      fontSize: 26,
      padding: 6
    },
    value: topic.emoji,
    onChange: e => set({
      emoji: [...e.target.value].slice(-2).join('')
    })
  })), React.createElement("div", {
    className: "field grow"
  }, React.createElement("label", {
    htmlFor: "tp-name"
  }, "Name"), React.createElement("input", {
    id: "tp-name",
    className: "input",
    value: topic.name,
    onChange: e => set({
      name: e.target.value
    }),
    placeholder: "Topic name"
  }))), React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "tp-folder"
  }, "Folder"), React.createElement("select", {
    id: "tp-folder",
    className: "input",
    value: newFolder ? '__new' : folderOf(topic),
    onChange: e => {
      if (e.target.value === '__new') setNewFolder(true);else {
        setNewFolder(false);
        set({
          folder: e.target.value
        });
      }
    }
  }, [...new Set([...folders, folderOf(topic)])].map(f => React.createElement("option", {
    key: f,
    value: f
  }, folderEmoji(f), " ", f)), React.createElement("option", {
    value: "__new"
  }, "+ New folder\u2026")), newFolder && React.createElement("input", {
    id: "tp-folder-new",
    className: "input",
    autoFocus: true,
    maxLength: 24,
    placeholder: "Folder name, e.g. Uni Friends",
    onChange: e => set({
      folder: e.target.value.trim() || 'My Topics'
    })
  })), React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "tp-slots"
  }, "Slot template"), React.createElement("input", {
    id: "tp-slots",
    className: "input",
    value: slotTxt,
    onChange: e => {
      setSlotTxt(e.target.value);
      const p = parseSlots(e.target.value);
      if (p.length) set({
        slots: p
      });
    },
    placeholder: "GK, DEF, DEF, MID, MID, FWD"
  }), React.createElement("p", {
    className: "hint"
  }, "Comma-separated. Add a FLEX slot to take any position. Generic works too: Pick 1, Pick 2, Pick 3."), !slotsParsed.length && React.createElement("p", {
    className: "warn"
  }, "Add at least one slot.")), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Results layout"), React.createElement(Seg, {
    label: "Layout",
    value: topic.layout || 'list',
    options: [['pitch', 'Pitch'], ['list', 'List']],
    onChange: v => set({
      layout: v
    })
  })), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Item pictures"), React.createElement(Seg, {
    label: "Item pictures",
    value: artOf(topic),
    options: [['kit', 'Jerseys'], ['emoji', 'Emoji tiles']],
    onChange: v => set({
      art: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, artOf(topic) === 'kit' ? 'Jersey colours come from the country or club in each description.' : 'Each item shows its own emoji, or the topic emoji.', " Uploaded photos and image links always come first.")), React.createElement(Toggle, {
    on: !!topic.photos,
    onChange: v => {
      set({
        photos: v
      });
      if (v) wiki.prefetch(topic.items.map(i => wikiTitleFor(i, {
        ...topic,
        photos: true
      })).filter(Boolean));
    },
    title: "Real photos from Wikipedia",
    sub: topic.photos ? 'Items without a photo of their own use their Wikipedia picture when one exists.' : 'Off: items show the jersey or emoji unless you add a photo.'
  })), React.createElement("div", {
    className: "row"
  }, React.createElement("h3", {
    className: "grow"
  }, "Items (", topic.items.length, ")"), React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setBulkOpen(v => !v)
  }, "Bulk add"), React.createElement("button", {
    className: "btn btn-sm btn-gold",
    style: {
      boxShadow: 'none'
    },
    onClick: () => setEditing({
      id: uid(),
      name: '',
      pos: '',
      desc: '',
      photo: '',
      isNew: true
    })
  }, "+ Item")), Object.keys(counts).length > 0 && React.createElement("p", {
    className: "hint"
  }, Object.entries(counts).map(([k, v]) => k + ' ' + v).join(' · ')), bulkOpen && React.createElement("div", {
    className: "card stack"
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "tp-bulk"
  }, "Paste one item per line"), React.createElement("textarea", {
    id: "tp-bulk",
    className: "input",
    value: bulk,
    onChange: e => setBulk(e.target.value),
    placeholder: 'Thierry Henry - FWD\nRoy Keane - MID\nPeter Schmeichel - GK'
  }), React.createElement("p", {
    className: "hint"
  }, "Format: Name - Position. Add a third part for a description: Name - Position - Club.")), React.createElement("button", {
    className: "btn btn-gold",
    disabled: !bulk.trim(),
    onClick: doBulk
  }, "Add ", bulk.split('\n').filter(l => l.trim()).length || '', " items")), React.createElement("div", {
    className: "stack-sm"
  }, topic.items.map((it, i) => React.createElement("div", {
    className: "irow",
    key: it.id
  }, React.createElement(Thumb, {
    item: it,
    topic: topic
  }), React.createElement("button", {
    className: "t",
    style: {
      border: 0,
      background: 'none',
      textAlign: 'left',
      padding: 0
    },
    onClick: () => setEditing(it)
  }, React.createElement("b", null, it.name, " ", it.pos && React.createElement("span", {
    className: "pos"
  }, it.pos)), React.createElement("span", null, it.desc || 'Tap to edit')), React.createElement("button", {
    className: "mini",
    onClick: () => move(i, -1),
    disabled: i === 0,
    "aria-label": "Move up"
  }, "\u2191"), React.createElement("button", {
    className: "mini",
    onClick: () => move(i, 1),
    disabled: i === topic.items.length - 1,
    "aria-label": "Move down"
  }, "\u2193"))), !topic.items.length && React.createElement("p", {
    className: "muted"
  }, "No items yet. Add them one by one or paste a list with Bulk add.")), React.createElement("button", {
    className: "btn btn-danger",
    onClick: () => setDel(true)
  }, "Delete topic"), editing && React.createElement(ItemEditor, {
    item: editing,
    slots: topic.slots,
    topic: topic,
    onSave: it => {
      const {
        isNew,
        ...rest
      } = it;
      saveItem(rest);
    },
    onDelete: editing.isNew ? null : () => set({
      items: topic.items.filter(x => x.id !== editing.id)
    }),
    onClose: () => setEditing(null)
  }), del && React.createElement(Confirm, {
    title: "Delete topic?",
    body: "This can't be undone.",
    yes: "Delete",
    danger: true,
    onYes: onDelete,
    onClose: () => setDel(false)
  }));
}
const DEFAULT_SOLO = {
  name: 'You',
  bots: 3,
  level: 'medium',
  talk: true,
  clock: 8,
  topicId: 't-pl',
  seed: 'start'
};
function SoloSetup({
  cfg,
  setCfg,
  topic,
  rules,
  onBack,
  onPickTopic,
  onRules,
  onStart
}) {
  const bots = makeBots(cfg.bots, cfg.level, cfg.seed, [COLORS[1]]);
  const valid = topic && topic.items.length && topic.slots.length && cfg.name.trim();
  const level = BOT_LEVELS[cfg.level];
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: "Solo \xB7 vs bots"
  }), React.createElement("div", null, React.createElement("h2", {
    className: "display"
  }, "You vs the bots"), React.createElement("p", {
    className: "hint"
  }, "Bots bid on their own. Each item sells when its clock runs out.")), React.createElement("div", {
    className: "card stack"
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "solo-name"
  }, "Your name"), React.createElement("input", {
    id: "solo-name",
    className: "input",
    maxLength: 16,
    value: cfg.name,
    onChange: e => setCfg({
      ...cfg,
      name: e.target.value
    }),
    placeholder: "You"
  })), React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "solo-bots"
  }, "Bots"), React.createElement(Stepper, {
    id: "solo-bots",
    value: cfg.bots,
    min: 1,
    max: 7,
    onChange: v => setCfg({
      ...cfg,
      bots: v
    })
  })), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Difficulty"), React.createElement(Seg, {
    label: "Difficulty",
    value: cfg.level,
    options: [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']],
    onChange: v => setCfg({
      ...cfg,
      level: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, cfg.level === 'easy' ? 'Bots make mistakes, waste money and miss bargains.' : cfg.level === 'medium' ? 'Bots play sensibly and avoid most silly bidding wars.' : 'Bots budget carefully, read the table and plan for the endgame. No cheating.')), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Bid clock"), React.createElement(Seg, {
    label: "Bid clock",
    value: cfg.clock,
    options: [[6, '6s'], [8, '8s'], [12, '12s']],
    onChange: v => setCfg({
      ...cfg,
      clock: v
    })
  })), React.createElement(Toggle, {
    on: cfg.talk,
    onChange: v => setCfg({
      ...cfg,
      talk: v
    }),
    title: "Trash talk",
    sub: "Bots react to bids, wins and losses with short speech bubbles."
  })), React.createElement("div", {
    className: "card stack"
  }, React.createElement("div", {
    className: "row"
  }, React.createElement("h3", {
    className: "grow"
  }, "The table"), React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setCfg({
      ...cfg,
      seed: uid()
    })
  }, "Shuffle bots")), React.createElement("div", {
    className: "stack-sm"
  }, bots.map(b => React.createElement("div", {
    key: b.id,
    className: "botrow",
    style: mStyle(b)
  }, React.createElement("span", {
    className: "be"
  }, b.emoji), React.createElement("span", {
    className: "grow",
    style: {
      minWidth: 0
    }
  }, React.createElement("b", null, b.name), React.createElement("span", {
    className: "small muted",
    style: {
      display: 'block'
    }
  }, BOT_TYPES[b.bot.type].label)), React.createElement("span", {
    className: "lvl"
  }, level.label))))), React.createElement("div", {
    className: "card stack"
  }, React.createElement("button", {
    className: "tcard",
    style: {
      border: 0,
      padding: 0,
      background: 'none'
    },
    onClick: onPickTopic
  }, React.createElement("span", {
    className: "em"
  }, topic ? topic.emoji : '🎲'), React.createElement("span", {
    className: "meta"
  }, React.createElement("span", {
    className: "name"
  }, topic ? topic.name : 'Pick a topic'), React.createElement("span", {
    className: "sub"
  }, topic ? topic.items.length + ' items · ' + rules.slots.join(', ') : 'Tap to choose')), React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 15,
      fontWeight: 700
    }
  }, "Change")), React.createElement("button", {
    className: "btn btn-sm",
    style: {
      alignSelf: 'flex-start'
    },
    onClick: onRules,
    disabled: !topic
  }, "House rules: ", money(rules.budget), " budget \xB7 min ", money(rules.minBid))), React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, cfg.bots, " ", cfg.bots === 1 ? 'bot' : 'bots', " \xB7 ", level.label, " \xB7 ", cfg.clock, "s clock \xB7 trash talk ", cfg.talk ? 'on' : 'off'), React.createElement("button", {
    className: "btn btn-gold",
    disabled: !valid,
    onClick: () => onStart(bots)
  }, "Start solo draft"));
}
function SetupManagers({
  managers,
  setManagers,
  onBack,
  onNext
}) {
  const upd = (i, patch) => setManagers(managers.map((m, k) => k === i ? {
    ...m,
    ...patch
  } : m));
  const move = (i, dir) => {
    const a = [...managers];
    const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    setManagers(a);
  };
  const nextColor = cur => {
    const used = managers.map(m => m.color);
    const start = COLORS.indexOf(cur);
    for (let k = 1; k <= COLORS.length; k++) {
      const c = COLORS[(start + k) % COLORS.length];
      if (!used.includes(c) || c === cur) return c;
    }
    return cur;
  };
  const add = () => {
    const used = managers.map(m => m.color);
    const color = COLORS.find(c => !used.includes(c)) || COLORS[managers.length % COLORS.length];
    const usedE = managers.map(m => m.emoji);
    const emoji = EMOJIS.find(e => !usedE.includes(e)) || '🙂';
    setManagers([...managers, {
      id: uid(),
      name: '',
      color,
      emoji
    }]);
  };
  const valid = managers.length >= 2 && managers.every(m => m.name.trim());
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: "1 \xB7 Managers"
  }), React.createElement("div", null, React.createElement("h2", {
    className: "display"
  }, "Who's bidding?"), React.createElement("p", {
    className: "hint"
  }, "2 to 8 managers. Tap the colour or emoji to change it.")), React.createElement("div", {
    className: "stack-sm"
  }, managers.map((m, i) => React.createElement("div", {
    className: "mrow",
    key: m.id,
    style: mStyle(m)
  }, React.createElement("button", {
    className: "emo",
    onClick: () => upd(i, {
      emoji: EMOJIS[(EMOJIS.indexOf(m.emoji) + 1) % EMOJIS.length]
    }),
    "aria-label": "Change emoji"
  }, m.emoji), React.createElement("button", {
    className: "swatch",
    onClick: () => upd(i, {
      color: nextColor(m.color)
    }),
    "aria-label": "Change colour"
  }), React.createElement("input", {
    id: 'mgr-' + m.id,
    className: "input grow",
    value: m.name,
    maxLength: 16,
    placeholder: 'Manager ' + (i + 1),
    onChange: e => upd(i, {
      name: e.target.value
    })
  }), React.createElement("button", {
    className: "mini",
    onClick: () => move(i, -1),
    disabled: i === 0,
    "aria-label": "Move up"
  }, "\u2191"), React.createElement("button", {
    className: "mini",
    onClick: () => move(i, 1),
    disabled: i === managers.length - 1,
    "aria-label": "Move down"
  }, "\u2193"), React.createElement("button", {
    className: "mini",
    onClick: () => setManagers(managers.filter((_, k) => k !== i)),
    disabled: managers.length <= 2,
    "aria-label": "Remove"
  }, "\u2715")))), React.createElement("button", {
    className: "btn",
    onClick: add,
    disabled: managers.length >= 8
  }, "+ Add manager ", managers.length >= 8 ? '(max 8)' : ''), !valid && React.createElement("p", {
    className: "hint"
  }, "Every manager needs a name."), React.createElement("button", {
    className: "btn btn-gold",
    disabled: !valid,
    onClick: onNext
  }, "Next: pick a topic"));
}
function TopicSearch({
  q,
  setQ
}) {
  return React.createElement("input", {
    id: "topic-search",
    className: "input",
    type: "search",
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Search topics"
  });
}
const matchTopic = (t, q) => {
  const s = q.trim().toLowerCase();
  return !s || t.name.toLowerCase().includes(s) || folderOf(t).toLowerCase().includes(s);
};
function FolderBrowser({
  topics,
  q,
  folder,
  setFolder,
  renderTopic
}) {
  if (q.trim()) {
    const r = topics.filter(t => matchTopic(t, q));
    return React.createElement("div", {
      className: "stack-sm"
    }, r.map(renderTopic), !r.length && React.createElement("p", {
      className: "muted"
    }, "No topics match \u201C", q.trim(), "\u201D."));
  }
  const names = folderList(topics);
  if (folder && names.includes(folder)) {
    const r = topics.filter(t => folderOf(t) === folder);
    return React.createElement("div", {
      className: "stack-sm"
    }, React.createElement("div", {
      className: "row"
    }, React.createElement("button", {
      className: "iconbtn",
      onClick: () => setFolder(null),
      "aria-label": "All folders"
    }, "\u2190"), React.createElement("h3", {
      className: "grow",
      style: {
        fontSize: 24
      }
    }, folderEmoji(folder), " ", folder), React.createElement("span", {
      className: "small muted"
    }, r.length, " topic", r.length === 1 ? '' : 's')), r.map(renderTopic));
  }
  return React.createElement("div", {
    className: "foldergrid"
  }, names.map(f => {
    const ts = topics.filter(t => folderOf(t) === f);
    return React.createElement("button", {
      key: f,
      className: "folder",
      onClick: () => setFolder(f)
    }, React.createElement("span", {
      className: "tab"
    }), React.createElement("span", {
      className: "fe"
    }, folderEmoji(f)), React.createElement("span", {
      className: "fn"
    }, f), React.createElement("span", {
      className: "fc"
    }, ts.length, " topic", ts.length === 1 ? '' : 's'), React.createElement("span", {
      className: "fm"
    }, ts.slice(0, 5).map(t => t.emoji).join(' ')));
  }));
}
function SetupTopic({
  topics,
  onBack,
  onPick,
  onTopics,
  folder,
  setFolder
}) {
  const [q, setQ] = useState('');
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: folder && !q ? () => setFolder(null) : onBack,
    title: "2 \xB7 Topic"
  }), React.createElement("h2", {
    className: "display"
  }, "What are we drafting?"), React.createElement(TopicSearch, {
    q: q,
    setQ: setQ
  }), React.createElement(FolderBrowser, {
    topics: topics,
    q: q,
    folder: folder,
    setFolder: setFolder,
    renderTopic: t => React.createElement("button", {
      key: t.id,
      className: "tcard",
      onClick: () => onPick(t.id),
      disabled: !t.items.length || !t.slots.length,
      style: {
        opacity: t.items.length ? 1 : 0.4
      }
    }, React.createElement("span", {
      className: "em"
    }, t.emoji || '🎲'), React.createElement("span", {
      className: "meta"
    }, React.createElement("span", {
      className: "name"
    }, t.name), React.createElement("span", {
      className: "sub"
    }, t.items.length, " items \xB7 ", t.slots.length, " slots", q ? ' · ' + folderOf(t) : '')), React.createElement("span", {
      className: "muted",
      style: {
        fontSize: 22
      }
    }, "\u203A"))
  }), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onTopics
  }, "Manage topics"));
}
function SetupRules({
  topic,
  managers,
  rules,
  setRules,
  onBack,
  onStart,
  startLabel = 'Start the draft',
  title = '3 · Rules'
}) {
  const [slotTxt, setSlotTxt] = useState(rules.slots.join(', '));
  const slots = parseSlots(slotTxt);
  const set = p => setRules({
    ...rules,
    ...p
  });
  const needed = rules.minBid * slots.length;
  const problems = [];
  if (!slots.length) problems.push('Add at least one slot.');
  if (rules.budget < needed) problems.push('A budget of ' + money(rules.budget) + " can't fill " + slots.length + ' slots at ' + money(rules.minBid) + ' each. Raise it to at least ' + money(needed) + '.');
  if (topic.items.length < slots.length * managers.length) problems.push('Heads up: ' + topic.items.length + ' items for ' + slots.length * managers.length + ' slots. Some teams will finish short.');
  const blocking = problems.filter(p => !p.startsWith('Heads up'));
  const posMissing = [...new Set(topic.items.map(i => i.pos).filter(p => p && !slots.some(s => norm(s) === norm(p))))];
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: title
  }), React.createElement("div", null, React.createElement("p", {
    className: "eyebrow"
  }, topic.emoji, " ", topic.name), React.createElement("h2", {
    className: "display"
  }, "House rules")), React.createElement("div", {
    className: "card stack"
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "r-budget"
  }, "Starting budget"), React.createElement(Stepper, {
    id: "r-budget",
    prefix: "$",
    value: rules.budget,
    min: 1,
    max: 999,
    onChange: v => set({
      budget: v
    })
  })), React.createElement("div", {
    className: "row"
  }, React.createElement("div", {
    className: "field grow"
  }, React.createElement("label", {
    htmlFor: "r-min"
  }, "Minimum bid"), React.createElement(Stepper, {
    id: "r-min",
    prefix: "$",
    value: rules.minBid,
    min: 1,
    max: 99,
    onChange: v => set({
      minBid: v
    })
  }))), React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "r-inc"
  }, "Bid increment"), React.createElement(Stepper, {
    id: "r-inc",
    prefix: "$",
    value: rules.inc,
    min: 1,
    max: 99,
    onChange: v => set({
      inc: v
    })
  }))), React.createElement("div", {
    className: "card stack"
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "r-slots"
  }, "Slots per team (", slots.length, ")"), React.createElement("input", {
    id: "r-slots",
    className: "input",
    value: slotTxt,
    onChange: e => {
      setSlotTxt(e.target.value);
      const p = parseSlots(e.target.value);
      if (p.length) set({
        slots: p
      });
    }
  }), posMissing.length > 0 && React.createElement("p", {
    className: "hint"
  }, "No slot for ", posMissing.join(', '), ". Those items can go in any open slot.")), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Item order"), React.createElement(Seg, {
    label: "Item order",
    value: rules.order,
    options: [['random', 'Shuffle'], ['saved', 'Saved order']],
    onChange: v => set({
      order: v
    })
  })), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Bid timer"), React.createElement(Seg, {
    label: "Bid timer",
    value: rules.timer,
    options: [[0, 'Off'], [10, '10s'], [15, '15s'], [30, '30s']],
    onChange: v => set({
      timer: v
    })
  }), rules.timer > 0 && React.createElement("p", {
    className: "hint"
  }, "Resets on every bid. When it runs out with a leader, the item sells automatically.")), React.createElement(Toggle, {
    on: rules.mustFill,
    onChange: v => set({
      mustFill: v
    }),
    title: "Must be able to fill your team",
    sub: 'Max bid keeps ' + money(rules.minBid) + ' for every other empty slot.'
  }), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Items with no bids"), React.createElement(Seg, {
    label: "No bids",
    value: rules.noBids,
    options: [['skip', 'Skip them'], ['back', 'Back of queue']],
    onChange: v => set({
      noBids: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, rules.noBids === 'back' ? 'An unsold item comes round once more, then goes to the leftovers.' : 'Unsold items go to the leftovers for free picks at the end.'))), problems.map(p => React.createElement("p", {
    key: p,
    className: p.startsWith('Heads up') ? 'hint' : 'warn'
  }, p)), React.createElement("button", {
    className: "btn btn-gold",
    disabled: blocking.length > 0,
    onClick: () => onStart({
      ...rules,
      slots
    })
  }, startLabel));
}
function ManagerButton({
  d,
  m,
  onBid,
  onCustom,
  disabledAll,
  readOnly,
  bubble,
  thinking
}) {
  const amt = nextAmount(d);
  const isLead = d.bid && d.bid.leaderId === m.id;
  const blocker = bidBlocker(d, m);
  const enabled = !readOnly && !disabledAll && !blocker && canBid(d, m, amt);
  const customOk = !readOnly && !disabledAll && canBid(d, m, d.bid ? d.bid.amount + 1 : d.rules.minBid);
  const t = useRef(null);
  const fired = useRef(true);
  const down = () => {
    if (!customOk) return;
    fired.current = false;
    t.current = setTimeout(() => {
      fired.current = true;
      buzz(25);
      onCustom();
    }, 550);
  };
  const up = () => {
    clearTimeout(t.current);
    if (!fired.current && enabled) onBid(amt);
    fired.current = true;
  };
  const cancel = () => {
    clearTimeout(t.current);
    fired.current = true;
  };
  const filled = d.rules.slots.length - emptyCount(m);
  const botInfo = isBot(m) ? BOT_TYPES[m.bot.type] : null;
  const status = isLead ? React.createElement("span", {
    className: "badge"
  }, "\u2605 Leading", enabled ? ' · tap +' + money(d.rules.inc) : '') : thinking ? React.createElement("span", {
    className: "badge think"
  }, "Thinking\u2026") : readOnly ? blocker || (botInfo ? botInfo.short : 'Watching') : blocker || 'Tap: ' + money(amt);
  const dim = readOnly ? !!blocker && !isLead : !isLead && !enabled && !customOk;
  const handlers = readOnly ? {} : {
    onPointerDown: down,
    onPointerUp: up,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onKeyDown: e => {
      if ((e.key === 'Enter' || e.key === ' ') && enabled) {
        e.preventDefault();
        onBid(amt);
      }
    }
  };
  return React.createElement("div", _extends({
    role: readOnly ? 'group' : 'button',
    tabIndex: enabled ? 0 : -1,
    "aria-disabled": readOnly ? undefined : !enabled,
    "aria-label": readOnly ? m.name + (botInfo ? ', ' + botInfo.label : '') : undefined,
    className: 'mgr' + (isLead ? ' isLead' : '') + (dim ? ' off' : '') + (thinking ? ' thinking' : '') + (m.human ? ' you' : ''),
    style: mStyle(m),
    onContextMenu: e => e.preventDefault()
  }, handlers), bubble && React.createElement("span", {
    className: "bubble",
    key: bubble.id,
    role: "status"
  }, bubble.text), React.createElement("span", {
    className: "who"
  }, m.emoji, " ", m.name), React.createElement("span", {
    className: "money num"
  }, money(m.budget)), React.createElement("span", {
    className: "st"
  }, status, " \xB7 ", filled, "/", d.rules.slots.length), customOk && React.createElement("button", {
    className: "edit",
    "aria-label": 'Custom bid for ' + m.name,
    onPointerDown: e => e.stopPropagation(),
    onPointerUp: e => e.stopPropagation(),
    onClick: e => {
      e.stopPropagation();
      onCustom();
    }
  }, "\u270E"));
}
function useBotTalk(d) {
  const [bubbles, setBubbles] = useState({});
  const last = useRef(0);
  const per = useRef({});
  const timers = useRef([]);
  const enabled = d.mode === 'solo' && !(d.solo && d.solo.talk === false);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const say = (botId, event, extra, force) => {
    if (!enabled) return;
    const bot = d.managers.find(m => m.id === botId);
    if (!isBot(bot)) return;
    const now = Date.now();
    if (!force && (now - last.current < ms(3000) || now - (per.current[botId] || 0) < ms(7000))) return;
    if (!force && Math.random() > (TALK_CHANCE[event] != null ? TALK_CHANCE[event] : 0.3)) return;
    const text = botLine(bot, event, extra);
    if (!text) return;
    last.current = now;
    per.current[botId] = now;
    const id = now + '-' + Math.random();
    setBubbles(b => ({
      ...b,
      [botId]: {
        text,
        id
      }
    }));
    timers.current.push(setTimeout(() => setBubbles(b => {
      if (!b[botId] || b[botId].id !== id) return b;
      const n = {
        ...b
      };
      delete n[botId];
      return n;
    }), Math.max(ms(2800), 300)));
  };
  const later = (delay, fn) => {
    timers.current.push(setTimeout(fn, delay));
  };
  return {
    bubbles,
    say,
    later
  };
}
function CustomBid({
  d,
  m,
  onSet,
  onClose
}) {
  const lo = d.bid ? d.bid.amount + 1 : d.rules.minBid;
  const hi = maxBid(m, d.rules);
  const [v, setV] = useState(String(Math.min(hi, nextAmount(d))));
  const n = parseInt(v, 10);
  const ok = !isNaN(n) && n >= lo && n <= hi;
  return React.createElement(Sheet, {
    center: true,
    onClose: onClose
  }, React.createElement("p", {
    className: "eyebrow"
  }, "Custom bid"), React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 32,
      color: m.color
    }
  }, m.emoji, " ", m.name), React.createElement("input", {
    id: "custom-bid",
    className: "input",
    autoFocus: true,
    inputMode: "numeric",
    style: {
      fontFamily: 'var(--display)',
      fontSize: 48,
      textAlign: 'center',
      minHeight: 80
    },
    value: '$' + v,
    onChange: e => setV(e.target.value.replace(/[^0-9]/g, '')),
    onKeyDown: e => {
      if (e.key === 'Enter' && ok) {
        onSet(n);
        onClose();
      }
    }
  }), React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, "Allowed: ", money(lo), " to ", money(hi)), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn btn-ghost grow",
    onClick: onClose
  }, "Cancel"), React.createElement("button", {
    className: "btn btn-gold grow",
    disabled: !ok,
    onClick: () => {
      onSet(n);
      onClose();
    }
  }, "Bid ", ok ? money(n) : '')));
}
function WikiCredit({
  item,
  topic
}) {
  const title = item.photo || item.imageData || item.imageUrl ? null : wikiTitleFor(item, topic);
  const url = useWikiImage(title);
  if (!title || !url) return null;
  const page = wiki.page(title) || title;
  return React.createElement("a", {
    className: "credit",
    href: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(page.replace(/ /g, '_')),
    target: "_blank",
    rel: "noopener noreferrer"
  }, "Photo: Wikipedia \u2197");
}
function ItemCard({
  item,
  d
}) {
  const pos = norm(item.pos);
  const inTemplate = pos && d.rules.slots.some(s => norm(s) === pos);
  const hasFlex = d.rules.slots.some(isFlex);
  return React.createElement("div", {
    className: "flip"
  }, React.createElement("div", {
    className: "flip-inner"
  }, React.createElement("div", {
    className: "face itemcard"
  }, React.createElement("div", {
    className: "ph"
  }, React.createElement(ItemArt, {
    item: item,
    topic: d.topic,
    size: 104,
    radius: 16
  })), React.createElement("div", {
    className: "info"
  }, item.pos && React.createElement("span", null, React.createElement("span", {
    className: "pos"
  }, item.pos)), React.createElement("div", {
    className: "nm"
  }, item.name), item.desc && React.createElement("div", {
    className: "ds"
  }, item.desc), React.createElement("div", {
    className: "fits"
  }, inTemplate ? 'Fills a ' + item.pos + ' slot' + (hasFlex ? ' or FLEX' : '') : 'Fills any open slot'), React.createElement(WikiCredit, {
    item: item,
    topic: d.topic
  }))), React.createElement("div", {
    className: "face back"
  }, React.createElement("span", null, "?"))));
}
const bidKeyOf = d => d.reveal + ':' + (d.bid ? d.bid.amount + d.bid.leaderId : 'none');
function Auction({
  d,
  setDraft,
  goHome,
  flashing,
  onFlash
}) {
  const item = currentItem(d);
  const solo = d.mode === 'solo';
  const [paused, setPaused] = useState(false);
  const [gavel, setGavel] = useState(false);
  const [custom, setCustom] = useState(null);
  const [teams, setTeams] = useState(false);
  const [thinking, setThinking] = useState(null);
  const [out, setOut] = useState(false);
  const busy = useRef(false);
  const timer = solo ? d.solo && d.solo.clock || 8 : d.rules.timer || 0;
  const [left, setLeft] = useState(timer);
  const bidKey = bidKeyOf(d);
  const talk = useBotTalk(d);
  const live = useRef({});
  live.current = {
    d,
    paused,
    flashing,
    gavel,
    left
  };
  useEffect(() => {
    setLeft(timer);
  }, [bidKey, timer]);
  useEffect(() => {
    setOut(false);
  }, [d.reveal]);
  const leader = d.bid && d.managers.find(m => m.id === d.bid.leaderId);
  const total = d.processed + d.queue.length;
  const you = solo ? d.managers.find(m => m.human) : null;
  function sold() {
    if (!d.bid || busy.current || flashing) return;
    busy.current = true;
    const price = d.bid.amount;
    const winnerId = d.bid.leaderId;
    const bidders = [...new Set(d.bids.filter(Boolean).map(b => b.leaderId))].filter(id => id !== winnerId);
    const info = {
      kind: 'sold',
      name: leader.name,
      emoji: leader.emoji,
      color: leader.color,
      price,
      item: item.name
    };
    buzz([40, 30, 160]);
    setGavel(true);
    setThinking(null);
    setTimeout(() => {
      setGavel(false);
      onFlash(info);
      setDraft(p => sell(p));
      busy.current = false;
      if (solo) talk.later(ms(1900), () => {
        const fair = d.rules.budget / d.rules.slots.length;
        if (isBot(leader)) talk.say(winnerId, price <= d.rules.minBid + d.rules.inc && itemFame(item) > 0.45 ? 'steal' : 'win');else if (price >= fair * 1.4) {
          const b = d.managers.find(m => isBot(m));
          if (b) talk.say(b.id, 'rival');
        }
        const loser = bidders.map(id => d.managers.find(m => m.id === id)).find(isBot);
        if (loser) talk.later(ms(900), () => talk.say(loser.id, 'lose'));
      });
    }, ms(520));
  }
  function skip() {
    if (busy.current || flashing) return;
    const back = d.rules.noBids === 'back' && !d.passed.includes(d.queue[0]);
    setThinking(null);
    onFlash({
      kind: 'skip',
      item: item.name,
      back
    });
    setDraft(p => skipItem(p));
  }
  useEffect(() => {
    if (!timer || paused || flashing || gavel) return undefined;
    const t = setInterval(() => setLeft(l => l > 0 ? l - 1 : 0), ms(1000));
    return () => clearInterval(t);
  }, [bidKey, paused, flashing, gavel, timer]);
  useEffect(() => {
    if (!timer || paused || flashing || gavel || left > 0) return;
    if (d.bid) sold();else if (solo) skip();
  }, [left, paused, flashing, gavel, timer]);
  useEffect(() => {
    if (!solo || paused || flashing || gavel || busy.current || d.phase !== 'auction') {
      setThinking(null);
      return undefined;
    }
    const plan = nextBotAction(d);
    if (!plan) {
      setThinking(null);
      return undefined;
    }
    setThinking(plan.botId);
    const key = bidKey;
    const t = setTimeout(() => {
      const cur = live.current;
      if (bidKeyOf(cur.d) !== key || cur.paused || cur.flashing || cur.gavel || busy.current || cur.left <= 0 || cur.d.phase !== 'auction') return;
      setThinking(null);
      setDraft(p => bidKeyOf(p) === key && p.phase === 'auction' ? placeBid(p, plan.botId, plan.amount) : p);
      talk.say(plan.botId, plan.event);
    }, ms(plan.delay));
    return () => clearTimeout(t);
  }, [bidKey, paused, flashing, gavel, solo]);
  useEffect(() => {
    if (!solo || flashing) return;
    if (d.processed === 0 && !d.bid) {
      const b = d.managers.filter(isBot);
      if (b.length) talk.say(b[Math.floor(Math.random() * b.length)].id, 'start', null, true);
      return;
    }
    const planner = d.managers.find(m => isBot(m) && m.bot.type === 'needs' && !isFull(m) && item && assignSlot(m, item, d.rules.slots) < 0);
    if (planner) {
      const k = planner.team.findIndex(x => !x);
      talk.say(planner.id, 'need', {
        slot: d.rules.slots[k]
      });
    }
  }, [d.reveal, flashing]);
  if (!item) return null;
  const lc = leader ? leader.color : null;
  const showCard = !flashing;
  const thinker = thinking && d.managers.find(m => m.id === thinking);
  const youAmt = you ? nextAmount(d) : 0;
  const youCan = you && !paused && !flashing && !gavel && canBid(d, you, youAmt);
  const going = timer > 0 && d.bid && left <= 2 && left > 0 ? left === 2 ? 'Going once…' : 'Going twice…' : null;
  const ordered = solo ? [...d.managers].sort((a, b) => (b.human ? 1 : 0) - (a.human ? 1 : 0)) : d.managers;
  return React.createElement("div", {
    className: 'app auction' + (solo ? ' solo' : '')
  }, React.createElement("div", {
    className: "topbar"
  }, React.createElement("button", {
    className: "iconbtn",
    onClick: goHome,
    "aria-label": "Home"
  }, "\u2302"), React.createElement("div", {
    className: "title num"
  }, "Item ", d.processed + 1, " of ", total), React.createElement("button", {
    className: "pillbtn",
    onClick: () => setTeams(true)
  }, "Teams"), React.createElement("button", {
    className: "iconbtn",
    onClick: () => setPaused(p => !p),
    "aria-label": paused ? 'Resume' : 'Pause'
  }, paused ? '▶' : 'Ⅱ')), React.createElement("div", {
    className: "progress"
  }, React.createElement("div", {
    className: "bar"
  }, React.createElement("i", {
    style: {
      width: d.processed / Math.max(1, total) * 100 + '%'
    }
  })), React.createElement("span", {
    className: "small muted num"
  }, d.queue.length - 1, " left")), React.createElement("div", {
    className: "paused stack"
  }, showCard ? React.createElement(ItemCard, {
    key: d.reveal,
    item: item,
    d: d
  }) : React.createElement("div", {
    style: {
      minHeight: 156
    }
  }), React.createElement("div", {
    className: 'bidbox' + (leader ? ' lead' : ''),
    style: lc ? {
      '--lc': lc
    } : null
  }, timer > 0 && React.createElement("span", {
    className: 'timernum num' + (left <= 3 ? ' hot' : '')
  }, Math.max(0, left)), React.createElement("div", {
    key: bidKey,
    className: 'amount num' + (leader ? ' pop' : '')
  }, money(d.bid ? d.bid.amount : d.rules.minBid)), React.createElement("div", {
    className: "leader",
    style: {
      color: lc || 'var(--muted)'
    }
  }, leader ? leader.emoji + ' ' + leader.name + ' leads' : timer > 0 && left <= 0 ? "Time's up · no bids" : solo ? 'Opening bid · bid or wait' : 'Opening bid · tap a manager'), React.createElement("div", {
    className: "going",
    "aria-live": "polite"
  }, going || (thinker ? '💭 ' + thinker.name + ' is thinking…' : solo && out ? 'You’re out on this one' : ' ')), timer > 0 && React.createElement("span", {
    className: "timer",
    style: {
      width: Math.max(0, left) / timer * 100 + '%'
    }
  })), paused && React.createElement("div", {
    className: "pausecover"
  }, React.createElement("div", {
    className: "stack",
    style: {
      alignItems: 'center'
    }
  }, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 56,
      color: 'var(--gold)'
    }
  }, "Paused"), React.createElement("button", {
    className: "btn btn-gold",
    style: {
      width: 200
    },
    onClick: () => setPaused(false)
  }, "Resume")))), React.createElement("div", {
    className: "mgr-grid"
  }, ordered.map(m => React.createElement(ManagerButton, {
    key: m.id,
    d: d,
    m: m,
    disabledAll: paused || flashing || gavel,
    readOnly: solo && !m.human,
    bubble: talk.bubbles[m.id],
    thinking: thinking === m.id,
    onBid: amt => {
      buzz(12);
      setOut(false);
      setDraft(p => placeBid(p, m.id, amt));
    },
    onCustom: () => setCustom(m.id)
  }))), React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, solo ? 'Tap Bid to raise +' + money(d.rules.inc) + ' · ✎ on your card for a custom bid · it sells when the clock runs out' : 'Tap to bid +' + money(d.rules.inc) + ' · hold or ✎ for a custom bid'), solo ? React.createElement("div", {
    className: "actions duo"
  }, React.createElement("button", {
    className: "btn",
    disabled: paused || flashing || out || !(you && canBid(d, you, youAmt)),
    onClick: () => {
      setOut(true);
      setLeft(l => Math.min(l, 3));
    }
  }, "I\u2019m out"), React.createElement("button", {
    className: "btn btn-gold sold",
    disabled: !youCan,
    onClick: () => {
      buzz(12);
      setOut(false);
      setDraft(p => placeBid(p, you.id, nextAmount(p)));
    }
  }, you && isFull(you) ? 'Team full' : you && !canBid(d, you, youAmt) ? 'Can’t bid' : (d.bid && d.bid.leaderId === you.id ? 'Raise to ' : 'Bid ') + money(youAmt))) : React.createElement("div", {
    className: "actions"
  }, React.createElement("button", {
    className: "btn",
    onClick: () => setDraft(p => undo(p)),
    disabled: paused || flashing || !d.bid && !d.history.length
  }, undoLabel(d)), React.createElement("button", {
    className: "btn",
    onClick: skip,
    disabled: paused || flashing || !!d.bid
  }, "No bids"), React.createElement("button", {
    className: "btn btn-gold sold",
    onClick: sold,
    disabled: paused || flashing || !d.bid
  }, "Sold!")), gavel && React.createElement("div", {
    className: "gavel",
    "aria-hidden": "true"
  }, "\uD83D\uDD28"), custom && React.createElement(CustomBid, {
    d: d,
    m: d.managers.find(x => x.id === custom),
    onSet: n => {
      buzz(12);
      setOut(false);
      setDraft(p => placeBid(p, custom, n));
    },
    onClose: () => setCustom(null)
  }), teams && React.createElement(TeamsSheet, {
    d: d,
    onClose: () => setTeams(false)
  }));
}
function FreePick({
  d,
  setDraft,
  goHome,
  flashing,
  onFlash
}) {
  const [teams, setTeams] = useState(false);
  const [paused, setPaused] = useState(false);
  const talk = useBotTalk(d);
  const cp = currentPicker(d);
  const m = cp && cp.m;
  const botTurn = !!(m && d.mode === 'solo' && isBot(m));
  const live = useRef({});
  live.current = {
    d,
    flashing,
    paused
  };
  const pick = id => {
    if (flashing || !m) return;
    onFlash({
      kind: 'free',
      name: m.name,
      emoji: m.emoji,
      color: m.color,
      item: d.items[id].name
    });
    setDraft(p => freePick(p, id));
  };
  const turnKey = d.reveal + ':' + (m ? m.id : '');
  useEffect(() => {
    if (!botTurn || flashing || paused) return undefined;
    const choice = botFreePickChoice(d, m);
    if (!choice) return undefined;
    const t = setTimeout(() => {
      const cur = live.current;
      if (cur.flashing || cur.paused || cur.d.reveal + ':' + ((currentPicker(cur.d) || {}).m || {}).id !== turnKey) return;
      pick(choice);
      talk.later(ms(1900), () => talk.say(m.id, 'free'));
    }, ms(1100));
    return () => clearTimeout(t);
  }, [turnKey, flashing, paused, botTurn]);
  if (!cp) return null;
  const avail = d.leftover.filter(id => canTake(d, m, id));
  return React.createElement("div", {
    className: "app"
  }, React.createElement("div", {
    className: "topbar"
  }, React.createElement("button", {
    className: "iconbtn",
    onClick: goHome,
    "aria-label": "Home"
  }, "\u2302"), React.createElement("div", {
    className: "title"
  }, "Free picks \xB7 round ", cp.round + 1), React.createElement("button", {
    className: "pillbtn",
    onClick: () => setTeams(true)
  }, "Teams"), d.mode === 'solo' && React.createElement("button", {
    className: "iconbtn",
    onClick: () => setPaused(p => !p),
    "aria-label": paused ? 'Resume' : 'Pause'
  }, paused ? '▶' : 'Ⅱ')), React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, "The auction is over and some teams still have empty slots. Leftovers are free, picked in snake order."), React.createElement("div", {
    className: "picker",
    style: mStyle(m)
  }, React.createElement("p", {
    className: "eyebrow"
  }, "On the clock"), React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 48
    }
  }, m.emoji, " ", m.name), React.createElement("p", {
    className: "small",
    style: {
      margin: 0
    }
  }, emptyCount(m), " empty slot", emptyCount(m) === 1 ? '' : 's', " \xB7 ", money(m.budget), " left"), botTurn && React.createElement("p", {
    className: "going",
    style: {
      margin: '6px 0 0'
    }
  }, paused ? 'Paused' : '💭 Picking…')), Object.entries(talk.bubbles).map(([id, bb]) => {
    const who = d.managers.find(x => x.id === id);
    return who ? React.createElement("p", {
      key: bb.id,
      className: "bubble inline",
      style: mStyle(who)
    }, React.createElement("b", null, who.emoji, " ", who.name, ":"), " ", bb.text) : null;
  }), React.createElement("div", {
    className: "pickgrid"
  }, avail.map(id => {
    const it = d.items[id];
    return React.createElement("button", {
      key: id,
      className: "pickbtn",
      onClick: () => pick(id),
      disabled: flashing || botTurn
    }, React.createElement(Thumb, {
      item: it,
      topic: d.topic
    }), React.createElement("span", {
      className: "grow",
      style: {
        minWidth: 0
      }
    }, React.createElement("b", {
      style: {
        display: 'block'
      }
    }, it.name, " ", it.pos && React.createElement("span", {
      className: "pos"
    }, it.pos)), React.createElement("span", {
      className: "small muted"
    }, it.desc)), React.createElement("span", {
      style: {
        fontFamily: 'var(--display)',
        color: 'var(--ok)',
        fontSize: 18
      }
    }, "FREE"));
  })), d.mode !== 'solo' && React.createElement("button", {
    className: "btn",
    onClick: () => setDraft(p => undo(p)),
    disabled: !d.history.length || flashing
  }, undoLabel(d)), teams && React.createElement(TeamsSheet, {
    d: d,
    onClose: () => setTeams(false)
  }));
}
const ROW_OF = {
  GK: 'GK',
  GOALKEEPER: 'GK',
  DEF: 'DEF',
  CB: 'DEF',
  LB: 'DEF',
  RB: 'DEF',
  FB: 'DEF',
  DEFENDER: 'DEF',
  MID: 'MID',
  CM: 'MID',
  CDM: 'MID',
  CAM: 'MID',
  LM: 'MID',
  RM: 'MID',
  MIDFIELDER: 'MID',
  FWD: 'FWD',
  ST: 'FWD',
  CF: 'FWD',
  LW: 'FWD',
  RW: 'FWD',
  FW: 'FWD',
  ATT: 'FWD',
  FORWARD: 'FWD'
};
function Pitch({
  d,
  m
}) {
  const rows = {
    FWD: [],
    MID: [],
    DEF: [],
    GK: []
  };
  const bench = [];
  d.rules.slots.forEach((s, i) => {
    const t = m.team[i];
    const it = t && d.items[t.itemId];
    let r = ROW_OF[norm(s)];
    if (!r && it) r = ROW_OF[norm(it.pos)];
    const entry = {
      s,
      t,
      it,
      i
    };
    if (r) rows[r].push(entry);else bench.push(entry);
  });
  return React.createElement("div", null, React.createElement("div", {
    className: "pitch"
  }, ['FWD', 'MID', 'DEF', 'GK'].filter(r => rows[r].length).map(r => React.createElement("div", {
    className: "prow",
    key: r
  }, rows[r].map(({
    s,
    t,
    it,
    i
  }) => React.createElement("div", {
    className: "pl",
    key: i
  }, React.createElement("div", {
    className: 'dot' + (it ? '' : ' none')
  }, it ? React.createElement(ItemArt, {
    item: it,
    topic: d.topic,
    size: 40,
    round: true
  }) : s), React.createElement("span", {
    className: "lb"
  }, it ? lastName(it.name) : 'Empty'), t && React.createElement("span", {
    className: "pr num"
  }, t.free ? 'FREE' : money(t.price))))))), bench.length > 0 && React.createElement("div", {
    className: "bench"
  }, bench.map(({
    s,
    t,
    it,
    i
  }) => React.createElement("div", {
    className: "slotline",
    key: i
  }, React.createElement("span", {
    className: "s"
  }, s), it ? React.createElement("span", {
    className: "n"
  }, it.name) : React.createElement("span", {
    className: "n empty"
  }, "Empty"), t && React.createElement("span", {
    className: "p num"
  }, t.free ? 'FREE' : money(t.price))))));
}
function TeamCard({
  d,
  m,
  win
}) {
  return React.createElement("div", {
    className: 'team' + (win ? ' win' : ''),
    style: mStyle(m)
  }, React.createElement("div", {
    className: "th"
  }, React.createElement("span", {
    style: {
      fontSize: 26
    }
  }, win ? '👑' : m.emoji), React.createElement("span", {
    className: "nm"
  }, m.name), React.createElement("span", {
    className: "mo"
  }, "spent", React.createElement("b", {
    className: "num"
  }, money(spent(d, m)))), React.createElement("span", {
    className: "mo"
  }, "left", React.createElement("b", {
    className: "num"
  }, money(m.budget)))), React.createElement("div", {
    className: "tb"
  }, d.topic.layout === 'pitch' ? React.createElement(Pitch, {
    d: d,
    m: m
  }) : React.createElement(TeamList, {
    d: d,
    m: m
  })));
}
function Confetti({
  colors
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = ref.current;
    const ctx = c && c.getContext ? c.getContext('2d') : null;
    if (!ctx) return undefined;
    let raf;
    const W = c.width = innerWidth,
      H = c.height = innerHeight;
    const ps = Array.from({
      length: 160
    }, () => ({
      x: Math.random() * W,
      y: -20 - Math.random() * H * 0.6,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      r: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      c: colors[Math.floor(Math.random() * colors.length)]
    }));
    const start = performance.now();
    const tick = t => {
      ctx.clearRect(0, 0, W, H);
      ps.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (t - start < 4500) raf = requestAnimationFrame(tick);else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return React.createElement("canvas", {
    ref: ref,
    className: "confetti",
    "aria-hidden": "true"
  });
}
const hasVoted = (d, id) => Object.prototype.hasOwnProperty.call(d.votes || {}, id);
function Voting({
  d,
  onVote,
  onReveal,
  onClose,
  onSoloVote
}) {
  const solo = d.mode === 'solo';
  const you = solo ? d.managers.find(m => m.human) : null;
  const [voter, setVoter] = useState(solo && you ? you.id : null);
  const [choice, setChoice] = useState(null);
  const [locked, setLocked] = useState(false);
  const voted = Object.keys(d.votes || {}).length;
  if (locked) return React.createElement(Sheet, {
    center: true,
    onClose: () => {}
  }, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 40,
      textAlign: 'center'
    }
  }, "Vote locked \uD83D\uDD12"), solo ? React.createElement("p", {
    className: "muted",
    style: {
      textAlign: 'center',
      margin: 0
    }
  }, "\uD83E\uDD16 The bots are voting\u2026") : React.createElement(React.Fragment, null, React.createElement("p", {
    className: "muted",
    style: {
      textAlign: 'center',
      margin: 0
    }
  }, "Pass the phone to the next manager."), React.createElement("button", {
    className: "btn btn-gold",
    onClick: () => {
      setLocked(false);
      setVoter(null);
      setChoice(null);
    }
  }, "Next voter")));
  if (voter) {
    const v = d.managers.find(m => m.id === voter);
    const choices = voteChoices(d, voter);
    const submit = target => {
      buzz(30);
      if (solo) {
        setLocked(true);
        onSoloVote(target);
      } else {
        onVote(voter, target);
        setLocked(true);
      }
    };
    return React.createElement(Sheet, {
      center: true,
      onClose: () => {
        if (solo) onClose();else {
          setVoter(null);
          setChoice(null);
        }
      }
    }, React.createElement("p", {
      className: "eyebrow"
    }, "Secret vote"), React.createElement("h2", {
      className: "display",
      style: {
        fontSize: 32,
        color: v.color
      }
    }, v.emoji, " ", v.name, ", pick the best team"), choices.length ? React.createElement("p", {
      className: "hint"
    }, "You can't vote for your own team.") : React.createElement("p", {
      className: "hint"
    }, "There's no other team with players to vote for, so you can skip your vote."), React.createElement("div", {
      className: "stack-sm"
    }, choices.map(m => React.createElement("button", {
      key: m.id,
      className: "votebtn",
      style: {
        ...mStyle(m),
        alignItems: 'stretch',
        textAlign: 'left'
      },
      "aria-pressed": choice === m.id,
      onClick: () => setChoice(m.id)
    }, React.createElement("span", null, m.emoji, " ", m.name, isBot(m) ? React.createElement("small", {
      style: {
        fontFamily: 'var(--body)',
        fontWeight: 600,
        opacity: 0.8
      }
    }, " \xB7 ", BOT_TYPES[m.bot.type].label) : null), React.createElement("span", {
      className: "teamtxt"
    }, m.team.filter(Boolean).map(t => d.items[t.itemId].name).join(', '))))), React.createElement("div", {
      className: "row pin"
    }, React.createElement("button", {
      type: "button",
      className: "btn btn-ghost grow",
      onClick: () => {
        if (solo) onClose();else {
          setVoter(null);
          setChoice(null);
        }
      }
    }, "Back"), choices.length ? React.createElement("button", {
      type: "button",
      className: "btn btn-gold grow",
      disabled: !choice,
      onClick: () => {
        if (choice) submit(choice);
      }
    }, choice ? 'Lock in ' + d.managers.find(m => m.id === choice).name : 'Pick a team') : React.createElement("button", {
      type: "button",
      className: "btn btn-gold grow",
      onClick: () => submit(null)
    }, "Skip my vote")));
  }
  return React.createElement(Sheet, {
    center: true,
    onClose: onClose
  }, React.createElement("p", {
    className: "eyebrow"
  }, "Secret vote \xB7 ", voted, " of ", d.managers.length, " in"), React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 34
    }
  }, "Pass the phone around"), React.createElement("p", {
    className: "hint"
  }, "Each manager taps their own name, then votes in private. Votes stay hidden until the reveal."), React.createElement("div", {
    className: "votegrid"
  }, d.managers.map(m => {
    const done = hasVoted(d, m.id);
    return React.createElement("button", {
      key: m.id,
      className: "votebtn",
      style: mStyle(m),
      disabled: done,
      onClick: () => setVoter(m.id)
    }, React.createElement("span", {
      style: {
        fontSize: 24
      }
    }, done ? '✅' : m.emoji), m.name);
  })), React.createElement("div", {
    className: "row pin"
  }, React.createElement("button", {
    type: "button",
    className: "btn btn-ghost",
    style: {
      width: 'auto'
    },
    onClick: onClose
  }, "Close"), React.createElement("button", {
    type: "button",
    className: "btn btn-gold grow",
    disabled: !voted,
    onClick: onReveal
  }, voted === d.managers.length ? 'Reveal winner' : 'Reveal (' + voted + '/' + d.managers.length + ')')));
}
function Results({
  d,
  past,
  onChange,
  onBack,
  onUndo,
  onFinish,
  onPlayAgain,
  live
}) {
  const ref = useRef(null);
  const [voting, setVoting] = useState(false);
  const [img, setImg] = useState(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [imgErr, setImgErr] = useState('');
  const [party, setParty] = useState(0);
  const stats = useMemo(() => draftStats(d), [d]);
  const {
    counts,
    winners
  } = tally(d);
  const revealed = d.votesRevealed && winners.length > 0;
  const noVotes = d.votesRevealed && !winners.length;
  const solo = d.mode === 'solo';
  const doReveal = () => {
    setVoting(false);
    setParty(x => x + 1);
    buzz([60, 40, 60, 40, 200]);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const soloVote = target => {
    setTimeout(() => {
      const votes = {
        ...(d.votes || {})
      };
      const you = d.managers.find(m => m.human);
      if (you && !hasVoted(d, you.id)) votes[you.id] = target;
      d.managers.filter(isBot).forEach(b => {
        if (!Object.prototype.hasOwnProperty.call(votes, b.id)) votes[b.id] = botVote(d, b);
      });
      onChange({
        ...d,
        votes,
        votesRevealed: true
      });
      doReveal();
    }, ms(1400));
  };
  const winIds = revealed ? winners.map(w => w.id) : [];
  const ordered = revealed ? [...d.managers].sort((a, b) => counts[b.id] - counts[a.id]) : d.managers;
  const exportImg = async () => {
    setImgBusy(true);
    setImgErr('');
    try {
      if (!window.html2canvas) throw new Error('missing');
      try {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
      } catch (e) {}
      const canvas = await window.html2canvas(ref.current, {
        backgroundColor: '#0f0c21',
        scale: Math.min(3, Math.max(2, window.devicePixelRatio || 2)),
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 8000
      });
      const blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('empty')), 'image/png'));
      const slug = (d.topic.name || 'draft').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
      setImg({
        url: URL.createObjectURL(blob),
        blob,
        name: 'draft-night-' + slug + '-' + todayStamp() + '.png'
      });
    } catch (e) {
      setImgErr("The image couldn't be made. Try again, and if it keeps failing, take a screenshot instead.");
    }
    setImgBusy(false);
  };
  const closeImg = () => {
    if (img) URL.revokeObjectURL(img.url);
    setImg(null);
    setImgNote('');
  };
  const [imgNote, setImgNote] = useState('');
  const doShare = async () => {
    const r = await shareFile(img.blob, img.name, 'Draft Night results');
    if (r === 'unsupported') setImgNote("Sharing isn't available here. Use Download, or press and hold the picture.");
  };
  const doDownload = () => {
    downloadBlob(img.blob, img.name);
    setImgNote(isIOS() ? 'On iPhone, check the Downloads folder in the Files app. To put it in Photos, press and hold the picture instead.' : 'Saved to your downloads.');
  };
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    backLabel: "\u2302",
    title: "Results",
    right: live && onUndo && d.history.length && !d.votesRevealed ? React.createElement("button", {
      className: "pillbtn",
      onClick: onUndo
    }, "Undo") : null
  }), React.createElement("div", {
    ref: ref,
    className: "resultwrap"
  }, React.createElement("div", {
    className: "rhead"
  }, React.createElement("p", {
    className: "eyebrow"
  }, d.topic.emoji, " ", d.topic.name, " \xB7 ", new Date(d.createdAt).toLocaleDateString()), React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 46
    }
  }, revealed ? 'We have a winner' : 'Final teams')), noVotes && React.createElement("div", {
    className: "card"
  }, React.createElement("b", null, "No votes were cast"), React.createElement("p", {
    className: "hint",
    style: {
      margin: '4px 0 0'
    }
  }, "Nobody had a team they could vote for, so there's no winner this time.")), revealed && React.createElement("div", {
    className: "winner"
  }, React.createElement("p", {
    className: "eyebrow",
    style: {
      color: 'var(--gold-ink)'
    }
  }, "Best team \xB7 ", counts[winners[0].id], " vote", counts[winners[0].id] === 1 ? '' : 's'), React.createElement("div", {
    className: "display"
  }, winners.map(w => w.emoji + ' ' + w.name).join(' & ')), winners.length > 1 && React.createElement("p", {
    className: "small",
    style: {
      margin: 0,
      fontWeight: 700
    }
  }, "It's a tie!"), solo && winners.some(w => w.human) && React.createElement("p", {
    className: "small",
    style: {
      margin: '4px 0 0',
      fontWeight: 700
    }
  }, "You beat the bots!")), ordered.map(m => React.createElement(TeamCard, {
    key: m.id,
    d: d,
    m: m,
    win: winIds.includes(m.id)
  })), React.createElement("div", {
    className: "stat-grid"
  }, React.createElement("div", {
    className: "stat"
  }, React.createElement("span", {
    className: "k"
  }, "Most expensive"), stats.expensive ? React.createElement(React.Fragment, null, React.createElement("span", {
    className: "v num"
  }, money(stats.expensive.price)), React.createElement("span", {
    className: "d"
  }, stats.expensive.item.name, " \xB7 ", stats.expensive.m.name)) : React.createElement("span", {
    className: "d muted"
  }, "No sales")), React.createElement("div", {
    className: "stat"
  }, React.createElement("span", {
    className: "k"
  }, "Biggest bargain"), stats.bargain ? React.createElement(React.Fragment, null, React.createElement("span", {
    className: "v num"
  }, money(stats.bargain.price)), React.createElement("span", {
    className: "d"
  }, stats.bargain.item.name, " \xB7 ", stats.bargain.m.name)) : React.createElement("span", {
    className: "d muted"
  }, "Not enough sales")), React.createElement("div", {
    className: "stat"
  }, React.createElement("span", {
    className: "k"
  }, "Biggest spender"), React.createElement("span", {
    className: "v num"
  }, money(stats.spender.s)), React.createElement("span", {
    className: "d"
  }, stats.spender.m.emoji, " ", stats.spender.m.name)), React.createElement("div", {
    className: "stat"
  }, React.createElement("span", {
    className: "k"
  }, "Cheapest team"), React.createElement("span", {
    className: "v num"
  }, money(stats.cheapest.s)), React.createElement("span", {
    className: "d"
  }, stats.cheapest.m.emoji, " ", stats.cheapest.m.name))), d.votesRevealed && !noVotes && React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83D\uDDF3\uFE0F Vote tally", solo ? ' · final standings' : ''), ordered.map(m => React.createElement("div", {
    key: m.id,
    className: 'brow' + (winIds.includes(m.id) ? ' hl' : ''),
    style: mStyle(m)
  }, React.createElement("span", {
    className: "bn"
  }, m.emoji, " ", m.name), React.createElement("span", {
    className: "bb"
  }, React.createElement("i", {
    style: {
      width: counts[m.id] / Math.max(1, counts[ordered[0].id]) * 100 + '%'
    }
  })), React.createElement("span", {
    className: "bw num"
  }, counts[m.id])))), d.votesRevealed && !noVotes && React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, d.managers.map(m => {
    const t = d.votes && d.votes[m.id];
    const to = t && d.managers.find(x => x.id === t);
    return m.name + ' → ' + (to ? to.name : 'no vote');
  }).join(' · ')), revealed && React.createElement(Leaderboard, {
    rows: winsBoard([...(past || []).filter(p => p.id !== d.id), d]),
    highlight: winners.map(w => w.name.trim().toLowerCase())
  }), React.createElement("p", {
    className: "exportfoot"
  }, "DRAFT NIGHT \xB7 ", (location.host + location.pathname).replace(/\/(index\.html)?$/, ''))), React.createElement("div", {
    className: "stack"
  }, !d.votesRevealed && React.createElement("button", {
    className: "btn btn-gold",
    onClick: () => setVoting(true)
  }, solo ? 'Vote for the best team' : Object.keys(d.votes || {}).length ? 'Continue the vote' : 'Start the secret vote'), live && onPlayAgain && d.votesRevealed && React.createElement("button", {
    className: "btn btn-gold",
    onClick: onPlayAgain
  }, "Play again"), React.createElement("button", {
    className: "btn",
    onClick: exportImg,
    disabled: imgBusy
  }, imgBusy ? 'Making image…' : 'Save as image'), imgErr && React.createElement("p", {
    className: "warn"
  }, imgErr), d.votesRevealed && React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => onChange({
      ...d,
      votes: {},
      votesRevealed: false
    })
  }, "Redo the vote"), live && onPlayAgain && !d.votesRevealed && React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onPlayAgain
  }, "Play again"), live && React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onFinish
  }, "Finish \xB7 back to home"), React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, live ? 'This draft is saved in Past Drafts.' : 'Saved in Past Drafts.')), voting && React.createElement(Voting, {
    d: d,
    onSoloVote: soloVote,
    onVote: (v, t) => {
      if (!hasVoted(d, v)) onChange({
        ...d,
        votes: {
          ...(d.votes || {}),
          [v]: t
        }
      });
    },
    onReveal: () => {
      onChange({
        ...d,
        votesRevealed: true
      });
      doReveal();
    },
    onClose: () => setVoting(false)
  }), party > 0 && revealed && React.createElement(Confetti, {
    key: party,
    colors: [...winners.map(w => w.color), '#ffc83d', '#ffffff']
  }), img && React.createElement(Sheet, {
    center: true,
    onClose: closeImg
  }, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 30
    }
  }, "Ready for the group chat"), React.createElement("img", {
    className: "imgout",
    src: img.url,
    alt: "Draft results"
  }), React.createElement("div", {
    className: "row"
  }, canShareFiles() && React.createElement("button", {
    className: "btn btn-gold grow",
    onClick: doShare
  }, "Share"), React.createElement("button", {
    className: 'btn grow' + (canShareFiles() ? '' : ' btn-gold'),
    onClick: doDownload
  }, "Download")), React.createElement("p", {
    className: "hint"
  }, imgNote || 'You can also press and hold the picture to save it to Photos.'), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: closeImg
  }, "Done")));
}
function PastList({
  past,
  onBack,
  onOpen,
  onDelete
}) {
  const [del, setDel] = useState(null);
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: "Past drafts"
  }), !past.length && React.createElement("div", {
    className: "card"
  }, React.createElement("p", {
    className: "muted",
    style: {
      margin: 0
    }
  }, "Finished drafts land here automatically, with their teams and votes.")), past.some(p => p.votesRevealed) && React.createElement(Leaderboard, {
    rows: winsBoard(past)
  }), React.createElement("div", {
    className: "stack-sm"
  }, past.map(p => {
    const {
      winners
    } = tally(p);
    return React.createElement("div", {
      key: p.id,
      className: "irow",
      style: {
        padding: 10
      }
    }, React.createElement("button", {
      className: "tcard",
      style: {
        border: 0,
        padding: 0,
        background: 'none'
      },
      onClick: () => onOpen(p.id)
    }, React.createElement("span", {
      className: "em"
    }, p.topic.emoji), React.createElement("span", {
      className: "meta"
    }, React.createElement("span", {
      className: "name"
    }, p.topic.name), React.createElement("span", {
      className: "sub"
    }, new Date(p.createdAt).toLocaleDateString(), " \xB7 ", p.mode === 'solo' ? 'Solo (' + (BOT_LEVELS[(p.solo || {}).level] || BOT_LEVELS.medium).label + ') · ' : '', p.managers.map(m => m.name).join(', ')), p.votesRevealed && winners.length > 0 && React.createElement("span", {
      className: "sub",
      style: {
        color: 'var(--gold)'
      }
    }, "\uD83D\uDC51 ", winners.map(w => w.name).join(' & ')))), React.createElement("button", {
      className: "mini",
      onClick: () => setDel(p),
      "aria-label": "Delete"
    }, "\u2715"));
  })), del && React.createElement(Confirm, {
    title: "Delete this draft?",
    body: del.topic.name + ' · ' + new Date(del.createdAt).toLocaleDateString(),
    yes: "Delete",
    danger: true,
    onYes: () => onDelete(del.id),
    onClose: () => setDel(null)
  }));
}
function Flash({
  f,
  onDone
}) {
  useEffect(() => {
    const t = setTimeout(onDone, ms(f.kind === 'skip' ? 1100 : 1800));
    return () => clearTimeout(t);
  }, [f]);
  return React.createElement("div", {
    className: "flash",
    onClick: onDone,
    style: {
      '--fc': f.color || 'var(--muted)'
    }
  }, f.kind === 'sold' && React.createElement("div", {
    className: "inner"
  }, React.createElement("div", {
    className: "big",
    style: {
      color: 'var(--gold)'
    }
  }, "SOLD!"), React.createElement("div", {
    className: "to",
    style: {
      color: f.color
    }
  }, "to ", f.emoji, " ", f.name), React.createElement("div", {
    className: "price num"
  }, money(f.price)), React.createElement("div", {
    className: "it"
  }, f.item)), f.kind === 'skip' && React.createElement("div", {
    className: "inner"
  }, React.createElement("div", {
    className: "big",
    style: {
      color: 'var(--muted)',
      fontSize: 72
    }
  }, "No bids"), React.createElement("div", {
    className: "it"
  }, f.item, " ", f.back ? 'goes to the back of the queue' : 'is skipped')), f.kind === 'free' && React.createElement("div", {
    className: "inner"
  }, React.createElement("div", {
    className: "big",
    style: {
      color: 'var(--ok)',
      fontSize: 80
    }
  }, "Free pick"), React.createElement("div", {
    className: "to",
    style: {
      color: f.color
    }
  }, f.emoji, " ", f.name), React.createElement("div", {
    className: "it"
  }, "takes ", f.item)));
}
const DEFAULT_RULES = {
  budget: 20,
  minBid: 1,
  inc: 1,
  order: 'random',
  timer: 0,
  mustFill: true,
  noBids: 'skip'
};
const defaultManagers = () => ['Ash', 'Bilal', 'Cam', 'Dev'].map((name, i) => ({
  id: uid(),
  name,
  color: COLORS[i],
  emoji: EMOJIS[i]
}));
const stripDraft = d => ({
  ...d,
  history: []
});
function migrateTopics(stored) {
  const starters = starterTopics();
  const allIds = starters.map(s => s.id);
  if (!Array.isArray(stored) || !stored.length) {
    store.set(K.seen, allIds);
    return starters;
  }
  const seen = store.get(K.seen, null) || ['t-pl', 't-cf', 't-nba', 't-ff'];
  const out = stored.map(t => {
    const s = starters.find(x => x.id === t.id);
    if (!s) return {
      ...t,
      art: artOf(t),
      folder: folderOf(t)
    };
    const byId = {};
    s.items.forEach(i => {
      byId[i.id] = i;
    });
    return {
      ...t,
      art: t.art || s.art,
      folder: t.folder || s.folder,
      kitShape: t.kitShape || s.kitShape,
      kitLabel: t.kitLabel || s.kitLabel,
      photos: t.photos === undefined ? s.photos : t.photos,
      items: t.items.map(i => byId[i.id] && !i.emoji && byId[i.id].emoji ? {
        ...i,
        emoji: byId[i.id].emoji
      } : i)
    };
  });
  starters.forEach(s => {
    if (!seen.includes(s.id) && !out.some(t => t.id === s.id)) out.push(s);
  });
  store.set(K.seen, allIds);
  return out;
}
const fmtBytes = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
function SettingsScreen({
  onBack,
  state,
  onRestore
}) {
  const app = usePwa();
  const fileRef = useRef(null);
  const [usage, setUsage] = useState(null);
  const [msg, setMsg] = useState(null);
  const [pending, setPending] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      navigator.storage && navigator.storage.estimate && navigator.storage.estimate().then(setUsage).catch(() => {});
    } catch (e) {}
  }, []);
  const photoCount = state.topics.reduce((n, t) => n + t.items.filter(i => i.photo || i.imageData).length, 0);
  const backupBlob = () => new Blob([JSON.stringify(makeBackup(state))], {
    type: 'application/json'
  });
  const exportBackup = async viaShare => {
    setMsg(null);
    try {
      await store.flush();
      const blob = backupBlob();
      const name = 'draft-night-backup-' + todayStamp() + '.json';
      if (viaShare) {
        const r = await shareFile(blob, name, 'Draft Night backup');
        if (r === 'shared') {
          setMsg({
            kind: 'ok',
            text: 'Backup shared (' + fmtBytes(blob.size) + ').'
          });
          return;
        }
        if (r === 'cancelled') return;
      }
      downloadBlob(blob, name);
      setMsg({
        kind: 'ok',
        text: 'Backup saved as ' + name + ' (' + fmtBytes(blob.size) + ').' + (isIOS() ? ' Find it in the Files app → Downloads.' : '')
      });
    } catch (e) {
      setMsg({
        kind: 'err',
        text: 'The backup could not be created. Try again.'
      });
    }
  };
  const readFile = async e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setMsg(null);
    setPending(null);
    if (file.size > 200 * 1024 * 1024) {
      setMsg({
        kind: 'err',
        text: 'That file is over 200 MB, which is too big to be a Draft Night backup.'
      });
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      let obj;
      try {
        obj = JSON.parse(text);
      } catch (er) {
        setMsg({
          kind: 'err',
          text: "That file isn't a Draft Night backup (it isn't valid JSON)."
        });
        setBusy(false);
        return;
      }
      const v = validateBackup(obj);
      if (!v.ok) setMsg({
        kind: 'err',
        text: v.error
      });else setPending(v);
    } catch (er) {
      setMsg({
        kind: 'err',
        text: 'That file could not be read.'
      });
    }
    setBusy(false);
  };
  const doRestore = mode => {
    onRestore(pending.data, mode);
    setMsg({
      kind: 'ok',
      text: mode === 'replace' ? 'Backup restored. Everything on this device now matches the backup.' : 'Backup added. New topics and drafts were added to yours.'
    });
    setPending(null);
  };
  const ios = isIOS();
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: "Backup & app"
  }), React.createElement("section", {
    className: "card stack"
  }, React.createElement("h3", null, "\uD83D\uDCF2 Install on your phone"), app.standalone ? React.createElement("p", {
    className: "hint",
    style: {
      color: 'var(--ok)'
    }
  }, "Draft Night is installed and running as an app.") : React.createElement(React.Fragment, null, app.canPrompt && React.createElement("button", {
    className: "btn btn-gold",
    onClick: () => app.prompt()
  }, "Install Draft Night"), React.createElement("div", {
    className: "steps"
  }, React.createElement("p", null, React.createElement("b", null, "iPhone (Safari):"), " tap the Share button ", React.createElement("span", {
    "aria-hidden": "true"
  }, "\u2B06\uFE0F"), ", scroll down, tap ", React.createElement("b", null, "Add to Home Screen"), ", then ", React.createElement("b", null, "Add"), "."), React.createElement("p", null, React.createElement("b", null, "Android (Chrome):"), " tap the \u22EE menu, then ", React.createElement("b", null, "Install app"), " or ", React.createElement("b", null, "Add to Home screen"), "."), ios && React.createElement("p", {
    className: "hint"
  }, "On iPhone this only works in Safari, not inside other apps' browsers."))), React.createElement("p", {
    className: "hint"
  }, "Updates arrive automatically. When a new version is ready you'll see a Reload button.")), React.createElement("section", {
    className: "card stack"
  }, React.createElement("h3", null, "\uD83D\uDCBE Backup & restore"), React.createElement("p", {
    className: "hint"
  }, "Everything is saved on this device only. A backup file copies your topics, uploaded photos (", photoCount, "), drafts and win history so you can move them to another phone or browser. It does not sync automatically."), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn btn-gold grow",
    onClick: () => exportBackup(false)
  }, "Export backup"), canShareFiles() && React.createElement("button", {
    className: "btn grow",
    onClick: () => exportBackup(true)
  }, "Share backup")), React.createElement("button", {
    className: "btn",
    disabled: busy,
    onClick: () => fileRef.current && fileRef.current.click()
  }, busy ? 'Reading…' : 'Import backup'), React.createElement("input", {
    ref: fileRef,
    id: "backup-file",
    type: "file",
    accept: "application/json,.json",
    hidden: true,
    onChange: readFile
  }), msg && React.createElement("p", {
    className: msg.kind === 'err' ? 'warn' : 'hint',
    style: msg.kind === 'ok' ? {
      color: 'var(--ok)'
    } : null
  }, msg.text), pending && React.createElement("div", {
    className: "card stack",
    style: {
      background: 'var(--stage)'
    }
  }, React.createElement("b", null, "Backup found", pending.summary.exportedAt ? ' from ' + new Date(pending.summary.exportedAt).toLocaleString() : ''), React.createElement("span", {
    className: "small muted"
  }, pending.summary.topics, " topics \xB7 ", pending.summary.items, " items \xB7 ", pending.summary.photos, " photos \xB7 ", pending.summary.past, " past drafts", pending.summary.current ? ' · 1 draft in progress' : ''), React.createElement("button", {
    className: "btn btn-danger solid",
    onClick: () => setConfirm('replace')
  }, "Replace everything on this device"), React.createElement("button", {
    className: "btn",
    onClick: () => setConfirm('merge')
  }, "Add to what's here"), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => setPending(null)
  }, "Cancel"))), React.createElement("section", {
    className: "card stack"
  }, React.createElement("h3", null, "\uD83D\uDDC4\uFE0F Storage"), React.createElement("p", {
    className: "hint"
  }, "Saving to: ", store.backend === 'indexeddb' ? 'this device (IndexedDB)' : store.backend === 'localStorage' ? 'this device (basic storage — photos may fill it quickly)' : 'nowhere — this browser blocks storage, so export a backup before closing', usage && usage.usage ? ' · using ' + fmtBytes(usage.usage) : ''), React.createElement("button", {
    className: "btn btn-sm",
    style: {
      alignSelf: 'flex-start'
    },
    onClick: () => {
      wiki.clear();
      setMsg({
        kind: 'ok',
        text: 'Photo lookups cleared. Wikipedia photos will be fetched again.'
      });
    }
  }, "Refresh Wikipedia photos")), React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, "Real photos come from Wikipedia and Wikimedia Commons. Tap \u201CPhoto: Wikipedia\u201D on a card to see who took it and its licence."), confirm && React.createElement(Confirm, {
    title: confirm === 'replace' ? 'Replace everything?' : 'Add the backup?',
    body: confirm === 'replace' ? 'Your current topics, drafts and history on this device will be overwritten by the backup. Export a backup first if you might want them back.' : 'Topics and past drafts from the backup that you don’t already have will be added. Nothing of yours is deleted.',
    yes: confirm === 'replace' ? 'Replace' : 'Add',
    danger: confirm === 'replace',
    onYes: () => doRestore(confirm),
    onClose: () => setConfirm(null)
  }));
}
function App() {
  const [topics, setTopics] = useState(() => migrateTopics(store.get(K.topics, null)));
  const [draft, setDraft] = useState(() => store.get(K.current, null));
  const [past, setPast] = useState(() => store.get(K.past, []));
  const [screen, setScreen] = useState({
    name: 'home'
  });
  const [managers, setManagers] = useState(() => store.get(K.managers, null) || defaultManagers());
  const [topicId, setTopicId] = useState(null);
  const [rules, setRules] = useState({
    ...DEFAULT_RULES,
    slots: []
  });
  const [flash, setFlash] = useState(null);
  const [toast, setToast] = useState(null);
  const [folder, setFolder] = useState(null);
  const [settings, setSettings] = useState(() => store.get(K.settings, {}));
  const soloCfg = {
    ...DEFAULT_SOLO,
    ...(settings.solo || {})
  };
  const setSoloCfg = c => setSettings(x => ({
    ...x,
    solo: c
  }));
  const [soloRules, setSoloRules] = useState(null);
  const warned = useRef(false);
  const app = usePwa();
  useEffect(() => {
    store.onError = msg => {
      if (!warned.current) {
        warned.current = true;
        setToast(msg);
      }
    };
  }, []);
  const persist = (k, v) => {
    if (v === null || v === undefined) store.del(k);else store.set(k, v);
  };
  useEffect(() => {
    persist(K.settings, settings);
  }, [settings]);
  useEffect(() => {
    if (draft && draft.topic && draft.topic.photos) wiki.prefetch([...draft.queue, ...draft.leftover].map(id => wikiTitleFor(draft.items[id], draft.topic)).filter(Boolean));
  }, [draft && draft.id]);
  useEffect(() => {
    persist(K.topics, topics);
  }, [topics]);
  useEffect(() => {
    persist(K.current, draft);
  }, [draft]);
  useEffect(() => {
    persist(K.past, past);
  }, [past]);
  useEffect(() => {
    persist(K.managers, managers);
  }, [managers]);
  useEffect(() => {
    if (draft && draft.phase === 'done') setPast(p => {
      const s = stripDraft(draft);
      const i = p.findIndex(x => x.id === draft.id);
      if (i >= 0) {
        const a = [...p];
        a[i] = s;
        return a;
      }
      return [s, ...p];
    });
  }, [draft]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen.name, screen.id]);
  const go = (name, extra) => setScreen({
    name,
    ...(extra || {})
  });
  const topic = topics.find(t => t.id === (screen.id || topicId));
  const updTopic = t => setTopics(ts => ts.map(x => x.id === t.id ? t : x));
  const dupTopic = id => {
    const t = topics.find(x => x.id === id);
    if (!t) return null;
    const copy = {
      ...t,
      id: uid(),
      name: t.name + ' (copy)',
      items: t.items.map(it => ({
        ...it,
        id: uid()
      }))
    };
    setTopics(ts => [...ts, copy]);
    return copy.id;
  };
  const soloTopic = () => topics.find(t => t.id === soloCfg.topicId && t.items.length) || topics.find(t => t.items.length && t.slots.length) || null;
  const soloRulesFor = t => soloRules && t && soloRules.topicId === t.id ? soloRules.rules : {
    ...DEFAULT_RULES,
    slots: t ? [...t.slots] : []
  };
  const playAgain = () => {
    if (!draft) return;
    const t = topics.find(x => x.id === draft.topic.id && x.items.length);
    if (!t) {
      setDraft(null);
      go(draft.mode === 'solo' ? 'solo-setup' : 'setup-topic');
      return;
    }
    const extra = draft.mode === 'solo' ? {
      mode: 'solo',
      solo: {
        ...draft.solo
      }
    } : undefined;
    setDraft(createDraft(t, draft.managers, {
      ...draft.rules
    }, extra));
    go('draft');
  };
  let view;
  switch (screen.name) {
    case 'topics':
      view = React.createElement(TopicsList, {
        topics: topics,
        folder: folder,
        setFolder: setFolder,
        onBack: () => go(screen.from || 'home'),
        onOpen: id => go('topic', {
          id,
          from: screen.from
        }),
        onCreate: f => {
          const t = {
            id: uid(),
            name: 'New topic',
            emoji: '🎲',
            slots: ['Pick 1', 'Pick 2', 'Pick 3'],
            layout: 'list',
            art: 'emoji',
            folder: f || 'My Topics',
            items: []
          };
          setTopics(ts => [...ts, t]);
          go('topic', {
            id: t.id,
            from: screen.from
          });
        },
        onDuplicate: dupTopic,
        onDelete: id => setTopics(ts => ts.filter(x => x.id !== id))
      });
      break;
    case 'topic':
      view = topic ? React.createElement(TopicEditor, {
        topic: topic,
        folders: folderList(topics, true),
        onChange: updTopic,
        onBack: () => go('topics', {
          from: screen.from
        }),
        onDuplicate: () => {
          const id = dupTopic(topic.id);
          if (id) go('topic', {
            id,
            from: screen.from
          });
        },
        onDelete: () => {
          setTopics(ts => ts.filter(x => x.id !== topic.id));
          go('topics', {
            from: screen.from
          });
        }
      }) : null;
      if (!topic) setTimeout(() => go('topics'), 0);
      break;
    case 'setup-managers':
      view = React.createElement(SetupManagers, {
        managers: managers,
        setManagers: setManagers,
        onBack: () => go('home'),
        onNext: () => go('setup-topic')
      });
      break;
    case 'solo-setup':
      {
        const st = soloTopic();
        view = React.createElement(SoloSetup, {
          cfg: soloCfg,
          setCfg: setSoloCfg,
          topic: st,
          rules: soloRulesFor(st),
          onBack: () => go('home'),
          onPickTopic: () => go('setup-topic', {
            from: 'solo'
          }),
          onRules: () => go('setup-rules', {
            from: 'solo'
          }),
          onStart: bots => {
            const human = {
              id: 'you',
              name: soloCfg.name.trim() || 'You',
              color: COLORS[1],
              emoji: '😎',
              human: true
            };
            setDraft(createDraft(st, [human, ...bots], soloRulesFor(st), {
              mode: 'solo',
              solo: {
                level: soloCfg.level,
                talk: soloCfg.talk,
                clock: soloCfg.clock
              }
            }));
            go('draft');
          }
        });
        break;
      }
    case 'setup-topic':
      if (screen.from === 'solo') {
        view = React.createElement(SetupTopic, {
          topics: topics,
          folder: folder,
          setFolder: setFolder,
          onBack: () => go('solo-setup'),
          onTopics: () => go('topics', {
            from: 'solo-setup'
          }),
          onPick: id => {
            setSoloCfg({
              ...soloCfg,
              topicId: id
            });
            go('solo-setup');
          }
        });
        break;
      }
      view = React.createElement(SetupTopic, {
        topics: topics,
        folder: folder,
        setFolder: setFolder,
        onBack: () => go('setup-managers'),
        onTopics: () => go('topics', {
          from: 'setup-topic'
        }),
        onPick: id => {
          const t = topics.find(x => x.id === id);
          setTopicId(id);
          setRules(r => ({
            ...r,
            slots: [...t.slots]
          }));
          go('setup-rules');
        }
      });
      break;
    case 'setup-rules':
      {
        if (screen.from === 'solo') {
          const st = soloTopic();
          const fake = Array.from({
            length: soloCfg.bots + 1
          }, (_, i) => ({
            id: 'x' + i
          }));
          view = st ? React.createElement(SetupRules, {
            topic: st,
            managers: fake,
            rules: soloRulesFor(st),
            setRules: r => setSoloRules({
              topicId: st.id,
              rules: r
            }),
            onBack: () => go('solo-setup'),
            title: "Solo \xB7 Rules",
            startLabel: "Save rules",
            onStart: r => {
              setSoloRules({
                topicId: st.id,
                rules: r
              });
              go('solo-setup');
            }
          }) : null;
          break;
        }
        const t = topics.find(x => x.id === topicId);
        view = t ? React.createElement(SetupRules, {
          topic: t,
          managers: managers,
          rules: rules,
          setRules: setRules,
          onBack: () => go('setup-topic'),
          onStart: r => {
            setDraft(createDraft(t, managers, r));
            go('draft');
          }
        }) : null;
        break;
      }
    case 'draft':
      if (!draft) {
        view = null;
        setTimeout(() => go('home'), 0);
        break;
      }
      if (draft.phase === 'auction') view = React.createElement(Auction, {
        d: draft,
        setDraft: setDraft,
        goHome: () => go('home'),
        flashing: !!flash,
        onFlash: setFlash
      });else if (draft.phase === 'freepick') view = React.createElement(FreePick, {
        d: draft,
        setDraft: setDraft,
        goHome: () => go('home'),
        flashing: !!flash,
        onFlash: setFlash
      });else view = React.createElement(Results, {
        d: draft,
        past: past,
        live: true,
        onChange: setDraft,
        onBack: () => go('home'),
        onUndo: draft.mode === 'solo' ? null : () => setDraft(p => undo(p)),
        onFinish: () => {
          setDraft(null);
          go('home');
        },
        onPlayAgain: playAgain
      });
      break;
    case 'past':
      view = React.createElement(PastList, {
        past: past,
        onBack: () => go('home'),
        onOpen: id => go('past-view', {
          id
        }),
        onDelete: id => setPast(p => p.filter(x => x.id !== id))
      });
      break;
    case 'past-view':
      {
        const p = past.find(x => x.id === screen.id);
        view = p ? React.createElement(Results, {
          d: p,
          past: past,
          onChange: nd => {
            setPast(ps => ps.map(x => x.id === nd.id ? nd : x));
            if (draft && draft.id === nd.id) setDraft({
              ...draft,
              votes: nd.votes,
              votesRevealed: nd.votesRevealed
            });
          },
          onBack: () => go('past')
        }) : null;
        break;
      }
    case 'settings':
      view = React.createElement(SettingsScreen, {
        onBack: () => go('home'),
        state: {
          topics,
          past,
          draft,
          managers,
          settings
        },
        onRestore: (data, mode) => {
          if (mode === 'replace') {
            setTopics(migrateTopics(data.topics));
            setPast(data.past);
            setDraft(data.current || null);
            if (Array.isArray(data.managers) && data.managers.length) setManagers(data.managers);
            if (data.settings) setSettings(data.settings);
          } else {
            setTopics(ts => [...ts, ...data.topics.filter(t => !ts.some(x => x.id === t.id))]);
            setPast(ps => [...ps, ...data.past.filter(d => !ps.some(x => x.id === d.id))].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
            if (data.current) setDraft(cur => cur || data.current);
          }
        }
      });
      break;
    default:
      view = React.createElement(Home, {
        draft: draft,
        past: past,
        onSettings: () => go('settings'),
        showInstall: !app.standalone && !settings.installDismissed && (app.canPrompt || isIOS()),
        onDismissInstall: () => setSettings(x => ({
          ...x,
          installDismissed: true
        })),
        onNew: () => {
          setDraft(null);
          setRules({
            ...DEFAULT_RULES,
            slots: []
          });
          go('setup-managers');
        },
        onSolo: () => {
          setDraft(null);
          go('solo-setup');
        },
        onResume: () => go('draft'),
        onTopics: () => go('topics'),
        onPast: () => go('past'),
        onAbandon: () => setDraft(null)
      });
  }
  return React.createElement(React.Fragment, null, view, flash && React.createElement(Flash, {
    f: flash,
    onDone: () => setFlash(null)
  }), app.updateReady && !toast && React.createElement("div", {
    className: "toast ok",
    role: "status"
  }, React.createElement("span", {
    className: "grow"
  }, "A new version of Draft Night is ready."), React.createElement("button", {
    onClick: () => app.applyUpdate()
  }, "Reload")), toast && React.createElement("div", {
    className: "toast",
    role: "status"
  }, React.createElement("span", {
    className: "grow"
  }, toast), React.createElement("button", {
    onClick: () => setToast(null)
  }, "OK")));
}
class Boundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = {
      err: null
    };
  }
  static getDerivedStateFromError(err) {
    return {
      err
    };
  }
  render() {
    if (this.state.err) return React.createElement("div", {
      className: "app"
    }, React.createElement("div", {
      className: "card stack"
    }, React.createElement("h2", {
      className: "display"
    }, "Something broke"), React.createElement("p", {
      className: "muted",
      style: {
        margin: 0
      }
    }, "Your topics are safe. If a saved draft caused this, clear it and carry on."), React.createElement("button", {
      className: "btn btn-gold",
      onClick: () => {
        store.del(K.current);
        store.flush().finally(() => location.reload());
      }
    }, "Clear the current draft and reload"), React.createElement("pre", {
      className: "small muted",
      style: {
        whiteSpace: 'pre-wrap'
      }
    }, String(this.state.err && this.state.err.message))));
    return this.props.children;
  }
}
if (window.__DN_TEST__) window.__DN = {
  bots: {
    makeBots,
    nextBotAction,
    botDecision,
    botFreePickChoice,
    botVote,
    teamScore,
    voteChoices,
    itemFame,
    seeded,
    BOT_LEVELS,
    BOT_TYPES
  },
  DEFAULT_SOLO,
  isFlex,
  canBid,
  createDraft,
  placeBid,
  sell,
  skipItem,
  undo,
  freePick,
  currentPicker,
  canTake,
  nextAmount,
  isDraftOver,
  draftStats,
  winsBoard,
  tally,
  starterTopics,
  migrateTopics,
  validateBackup,
  makeBackup,
  wikiTitleFor,
  PHOTO_TOPICS,
  store,
  wiki,
  DEFAULT_RULES,
  COLORS,
  emptyCount,
  assignSlot,
  maxBid
};
store.init().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Boundary, null, React.createElement(App, null)));
});
})();
