/* Draft Night 80ec4c2d3d — built from src/ by build.js. Edit src/, not this file. */
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
  function idbAll() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readonly');
      const st = tx.objectStore('kv');
      const kr = st.getAllKeys();
      const vr = st.getAll();
      tx.oncomplete = () => {
        const out = {};
        (kr.result || []).forEach((k, i) => {
          out[k] = vr.result[i];
        });
        resolve(out);
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('aborted'));
    });
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
  const v3 = [...sportsTopicsV3(), ...foodTopicsV3(), ...entTopicsV3(), ...travelTopicsV3(), ...animalTopicsV3(), ...styleTopicsV3(), ...funTopicsV3()];
  return [...baseTopics(), ...evenMoreTopics(), ...funTopics()].map(t => ({
    ...t,
    folder: STARTER_FOLDER[t.id] || 'My Topics',
    photos: Object.prototype.hasOwnProperty.call(PHOTO_TOPICS, t.id)
  })).concat(v3.map(t => ({
    ...t,
    builtin: true
  })));
}
const isBuiltIn = t => !!t && (Object.prototype.hasOwnProperty.call(STARTER_FOLDER, t.id) || !!t.v3 || !!t.builtin);
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
function animalTopicsV3() {
  const F = 'Animals';
  return [mkT('t-cats', 'Big & Wild Cats', '🐆', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Lion|Africa and India||🦁
Tiger|Asia||🐅
Leopard|Africa and Asia||🐆
Jaguar|The Americas||🐆
Cheetah|Fastest land animal||🐆
Snow Leopard|Central Asia||🐆
Cougar|The Americas||🐈
Clouded Leopard|Southeast Asia||🐆
Eurasian Lynx|Europe and Asia||🐈
Canada Lynx|Canada||🐈
Bobcat|North America||🐈
Caracal|Africa and Middle East||🐈
Serval|Africa||🐈
Ocelot|The Americas||🐈
Sand Cat|Arabian and Saharan deserts||🐈
Fishing Cat|South Asia||🐟
Pallas's Cat|Central Asia|Pallas's cat|🐈
Margay|Central and South America||🐈
Black-footed Cat|Southern Africa|Black-footed cat|🐈
Jaguarundi|The Americas||🐈
Iberian Lynx|Spain and Portugal||🐈
Rusty-spotted Cat|Smallest wild cat|Rusty-spotted cat|🐈
Arabian Leopard|Arabian Peninsula|Arabian leopard|🐆
Siberian Tiger|Russian Far East|Siberian tiger|🐅`), mkT('t-dogbreeds', 'Dog Breeds', '🐕', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Labrador Retriever|Friendly classic|Labrador Retriever|🐕
Golden Retriever|Gentle and loyal|Golden Retriever|🐕
German Shepherd|Smart worker|German Shepherd|🐕‍🦺
French Bulldog|Small and charming|French Bulldog|🐶
Bulldog|Wrinkly|Bulldog|🐶
Poodle|Clever|Poodle|🐩
Beagle|Nose to the ground|Beagle|🐶
Rottweiler|Strong guardian|Rottweiler|🐕
Dachshund|Sausage dog|Dachshund|🌭
Siberian Husky|Sled dog|Siberian Husky|🐺
Pembroke Welsh Corgi|Royal favourite|Pembroke Welsh Corgi|🐶
Shiba Inu|Doge|Shiba Inu|🐕
Pomeranian|Fluffy|Pomeranian dog|🐶
Chihuahua|Tiny|Chihuahua (dog)|🐶
Border Collie|Smartest breed|Border Collie|🐕
Australian Shepherd|Herder|Australian Shepherd|🐕
Dobermann|Sleek guardian|Dobermann|🐕
Great Dane|Gentle giant|Great Dane|🐕
Boxer|Playful|Boxer (dog)|🐶
Pug|Squishy face|Pug|🐶
Shih Tzu|Lap dog|Shih Tzu|🐶
Yorkshire Terrier|Small terrier|Yorkshire Terrier|🐶
Bernese Mountain Dog|Swiss giant|Bernese Mountain Dog|🐕
Samoyed|Smiling fluff|Samoyed dog|☁️
Cavalier King Charles Spaniel|Sweet|Cavalier King Charles Spaniel|🐶
Saluki|Ancient Arabian hound|Saluki|🐕
Akita|Loyal|Akita (dog)|🐕
Dalmatian|Spots|Dalmatian dog|🐕
Bull Terrier|Egg-shaped head|Bull Terrier|🐶
Newfoundland|Water rescuer|Newfoundland dog|🐕
Maltese|White and fluffy|Maltese dog|🐶
Greyhound|Fastest dog|Greyhound|🐕
Belgian Malinois|Working dog|Belgian Shepherd|🐕‍🦺
Cocker Spaniel|Floppy ears|Cocker Spaniel|🐶
Chow Chow|Blue tongue|Chow Chow|🦁`), mkT('t-catbreeds', 'Cat Breeds', '🐈', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Persian|Long-haired and calm|Persian cat|🐈
Maine Coon|Gentle giant||🐈
Siamese|Talkative|Siamese cat|🐈
Ragdoll|Floppy and friendly|Ragdoll|🐈
British Shorthair|Round and plush||🐈
Bengal|Wild-looking|Bengal cat|🐆
Sphynx|Hairless|Sphynx cat|🐈
Scottish Fold|Folded ears||🐈
Russian Blue|Silver-blue||🐈
Abyssinian|Active|Abyssinian cat|🐈
Norwegian Forest Cat|Fluffy Viking cat||🐈
Siberian|Fluffy|Siberian cat|🐈
Birman|Sacred cat of Burma|Birman|🐈
Exotic Shorthair|Short-haired Persian||🐈
Devon Rex|Pixie cat||🐈
Cornish Rex|Curly coat||🐈
Savannah|Part serval|Savannah cat|🐆
Turkish Angora|Elegant||🐈
Turkish Van|Swimming cat||🐈
Egyptian Mau|Spotted||🐈
American Shorthair|Classic tabby||🐈
Burmese|Affectionate|Burmese cat|🐈
Himalayan|Colourpoint Persian|Himalayan cat|🐈
Ragamuffin|Cuddly|Ragamuffin cat|🐈
Munchkin|Short legs|Munchkin cat|🐈
Tonkinese|Playful|Tonkinese cat|🐈
Arabian Mau|Desert street cat|Arabian Mau|🐈`), mkT('t-sharks', 'Sharks', '🦈', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Great White Shark|Apex predator||🦈
Great Hammerhead|Hammer-shaped head||🦈
Tiger Shark|Striped||🦈
Bull Shark|Swims in rivers||🦈
Whale Shark|Largest fish||🐋
Basking Shark|Filter feeder||🦈
Shortfin Mako|Fastest shark||🦈
Blue Shark|Ocean wanderer||🦈
Thresher Shark|Whip-like tail|Thresher shark|🦈
Nurse Shark|Bottom dweller||🦈
Lemon Shark|Yellowish||🍋
Goblin Shark|Deep-sea oddity||👺
Megamouth Shark|Rarely seen||🦈
Greenland Shark|Lives 400 years||🧊
Oceanic Whitetip|Open ocean|Oceanic whitetip shark|🦈
Blacktip Reef Shark|Reef patrol||🦈
Whitetip Reef Shark|Reef resident||🦈
Wobbegong|Carpet shark||🟫
Zebra Shark|Spotted adults||🦓
Leopard Shark|Spotted|Leopard shark|🐆
Sand Tiger Shark|Toothy grin|Sand tiger shark|🦈
Frilled Shark|Living fossil||🦈
Cookiecutter Shark|Takes round bites||🍪
Angel Shark|Flat ambusher||👼
Bonnethead|Small hammerhead||🦈
Megalodon|Extinct giant||🦖`), mkT('t-whales', 'Whales & Dolphins', '🐋', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Blue Whale|Largest animal ever||🐋
Humpback Whale|Singer||🐋
Orca|Killer whale||🐬
Sperm Whale|Deep diver||🐋
Beluga Whale|White whale||🤍
Narwhal|Unicorn of the sea||🦄
Bottlenose Dolphin|Classic dolphin|Common bottlenose dolphin|🐬
Gray Whale|Long migration||🐋
Fin Whale|Second largest||🐋
Minke Whale|Small baleen whale||🐋
Bowhead Whale|Lives 200 years||🐋
North Atlantic Right Whale|Endangered||🐋
Pilot Whale|Social|Pilot whale|🐋
Risso's Dolphin|Scarred grey|Risso's dolphin|🐬
Spinner Dolphin|Acrobat||🐬
Amazon River Dolphin|Pink dolphin||🩷
Hector's Dolphin|New Zealand||🐬
Vaquita|Rarest porpoise||🐬
Pacific White-sided Dolphin|Playful||🐬
Common Dolphin|Hourglass pattern|Common dolphin|🐬
Sei Whale|Fast baleen whale||🐋
Cuvier's Beaked Whale|Record diver|Cuvier's beaked whale|🐋
Irrawaddy Dolphin|Round head||🐬
Commerson's Dolphin|Panda dolphin|Commerson's dolphin|🐼
False Killer Whale|Dark and sleek||🐋`), mkT('t-raptors', 'Birds of Prey', '🦅', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Bald Eagle|North America||🦅
Golden Eagle|Northern hemisphere||🦅
Harpy Eagle|Rainforest giant||🦅
Peregrine Falcon|Fastest animal||🦅
Saker Falcon|Falconry favourite in Arabia||🦅
Gyrfalcon|Arctic falcon||🦅
Osprey|Fish hunter||🐟
Red-tailed Hawk|North America||🦅
Harris's Hawk|Hunts in groups|Harris's hawk|🦅
Snowy Owl|Arctic||🦉
Great Horned Owl|The Americas||🦉
Barn Owl|Heart-shaped face||🦉
Eurasian Eagle-Owl|Huge owl||🦉
Philippine Eagle|Monkey-eating eagle||🦅
Andean Condor|Huge wingspan||🦅
California Condor|Rare vulture||🦅
Secretary Bird|Kicks snakes|Secretarybird|🦅
Common Kestrel|Hovering hunter||🦅
Steller's Sea Eagle|Giant sea eagle|Steller's sea eagle|🦅
Martial Eagle|Africa's largest eagle||🦅
Bearded Vulture|Eats bones||🦴
Red Kite|Forked tail||🦅
Northern Goshawk|Forest hunter||🦅
Crowned Eagle|African forest eagle|Crowned eagle|🦅
Turkey Vulture|Soaring scavenger||🦅
Merlin|Small falcon|Merlin (bird)|🦅`), mkT('t-parrots', 'Parrots & Exotic Birds', '🦜', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Scarlet Macaw|Red, yellow, blue||🦜
Blue-and-yellow Macaw|Bright and loud|Blue-and-yellow macaw|🦜
Hyacinth Macaw|Largest parrot||💙
African Grey Parrot|Talking genius|Grey parrot|🦜
Sulphur-crested Cockatoo|Australian||🦜
Cockatiel|Crested pet||🦜
Budgerigar|Budgie||🦜
Lovebird|Small and social||💕
Kea|Alpine parrot||🦜
Kākāpō|Flightless parrot||🦜
Toco Toucan|Huge orange beak||🐦
Flamingo|Pink and on one leg||🦩
Indian Peafowl|Peacock||🦚
Greater Bird-of-paradise|Courtship dancer|Greater bird-of-paradise|🐦
Resplendent Quetzal|Sacred to the Maya||🐦
Great Hornbill|Casque on its bill||🐦
Lilac-breasted Roller|Rainbow colours||🐦
Golden Pheasant|Fiery colours||🐦
Mandarin Duck|Most colourful duck||🦆
Rainbow Lorikeet|Rainbow parrot||🌈
Eclectus Parrot|Red and green|Eclectus parrot|🦜
Sun Conure|Orange and yellow|Sun parakeet|🦜
Gouldian Finch|Painted finch||🐦
Shoebill|Prehistoric stare||🐦
Atlantic Puffin|Sea parrot||🐧
Common Kingfisher|Flash of blue||🐦`), mkT('t-reptiles', 'Reptiles', '🦎', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Komodo Dragon|Largest lizard||🦎
Saltwater Crocodile|Largest reptile||🐊
Nile Crocodile|Africa||🐊
American Alligator|USA||🐊
Gharial|Thin snout||🐊
Green Sea Turtle|Ocean traveller||🐢
Leatherback Sea Turtle|Largest turtle||🐢
Galápagos Tortoise|Giant tortoise||🐢
Panther Chameleon|Colour changer||🦎
Leopard Gecko|Spotty pet||🦎
Bearded Dragon|Pet favourite|Pogona|🦎
Green Iguana|Tree lizard||🦎
Gila Monster|Venomous lizard||🦎
Frilled Lizard|Neck frill|Frilled-neck lizard|🦎
Thorny Devil|Spiky desert lizard||🦎
Tuatara|Living fossil||🦎
Nile Monitor|Big lizard||🦎
Common Basilisk|Runs on water||🦎
Alligator Snapping Turtle|Lure tongue||🐢
Marine Iguana|Swims in the sea||🦎
Horned Lizard|Squirts blood|Horned lizard|🦎
Blue-tongued Skink|Blue tongue|Blue-tongued skink|🦎
Spectacled Caiman|South America||🐊
Aldabra Giant Tortoise|Seychelles||🐢
Spiny-tailed Lizard|Arabian dhub|Uromastyx|🦎`), mkT('t-snakes', 'Snakes', '🐍', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
King Cobra|Longest venomous snake||🐍
Black Mamba|Fast and deadly||🐍
Green Anaconda|Heaviest snake||🐍
Reticulated Python|Longest snake||🐍
Burmese Python|Huge constrictor||🐍
Inland Taipan|Most venomous||🐍
Eastern Brown Snake|Australia||🐍
Western Diamondback Rattlesnake|Rattle warning||🐍
Boa Constrictor|Classic constrictor||🐍
Gaboon Viper|Longest fangs||🐍
Coral Snake|Red, yellow, black|Coral snake|🐍
Yellow-bellied Sea Snake|Ocean snake||🌊
Corn Snake|Pet favourite||🐍
Ball Python|Curls into a ball||🐍
Milk Snake|Banded|Milk snake|🐍
Garter Snake|Common in Canada|Garter snake|🐍
Green Tree Python|Bright green||🐍
Russell's Viper|South Asia|Russell's viper|🐍
Saw-scaled Viper|Rasping warning|Echis|🐍
Fer-de-lance|Central America|Bothrops asper|🐍
Copperhead|North America|Agkistrodon contortrix|🐍
Cottonmouth|Water moccasin|Agkistrodon piscivorus|🐍
Sidewinder|Sideways desert snake||🐍
Desert Horned Viper|Horns over its eyes|Cerastes cerastes|🐍
Arabian Cobra|Arabian Peninsula|Arabian cobra|🐍
Titanoboa|Extinct giant||🦖`), mkT('t-dinos', 'Dinosaurs & Prehistoric Reptiles', '🦖', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Tyrannosaurus|Tyrant lizard king||🦖
Triceratops|Three horns||🦕
Velociraptor|Small and fast||🦖
Stegosaurus|Back plates||🦕
Brachiosaurus|Long neck||🦕
Spinosaurus|Sail-backed||🦖
Ankylosaurus|Club tail||🦕
Diplodocus|Very long||🦕
Allosaurus|Jurassic predator||🦖
Parasaurolophus|Head crest||🦕
Iguanodon|Thumb spikes||🦕
Pachycephalosaurus|Dome head||🦕
Carnotaurus|Horned predator||🦖
Giganotosaurus|Giant predator||🦖
Argentinosaurus|Among the largest ever||🦕
Therizinosaurus|Giant claws||🦖
Dilophosaurus|Double crest||🦖
Baryonyx|Fish eater||🦖
Utahraptor|Big raptor||🦖
Gallimimus|Ostrich-like||🦖
Deinonychus|Terrible claw||🦖
Archaeopteryx|Feathered link to birds||🪶
Edmontosaurus|Duck-billed||🦕
Apatosaurus|Long-necked giant||🦕
Pteranodon|Flying reptile (pterosaur)||🦅
Quetzalcoatlus|Giant pterosaur||🦅
Mosasaurus|Marine reptile||🌊
Plesiosaurus|Marine reptile||🌊`), mkT('t-prehistmammals', 'Prehistoric Mammals', '🦣', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Woolly Mammoth|Ice age giant|Woolly mammoth|🦣
Smilodon|Sabre-toothed cat||🐅
Woolly Rhinoceros|Ice age rhino|Woolly rhinoceros|🦏
Megatherium|Giant ground sloth||🦥
Glyptodon|Armoured giant||🛡️
Dire Wolf|Ice age wolf|Dire wolf|🐺
Cave Bear|Ice age bear|Cave bear|🐻
Irish Elk|Giant antlers|Irish elk|🦌
Paraceratherium|Giant hornless rhino||🦏
Andrewsarchus|Huge-skulled hunter||🦴
Deinotherium|Downward tusks||🐘
American Mastodon|Cousin of mammoths|American mastodon|🦣
Short-faced Bear|Giant bear|Arctodus|🐻
Macrauchenia|Odd trunk-nosed grazer||🦙
Basilosaurus|Early whale||🐋
Ambulocetus|Walking whale||🐊
Entelodont|Hell pig|Entelodont|🐗
Diprotodon|Giant wombat||🐻
Thylacoleo|Marsupial lion||🦁
Gigantopithecus|Giant ape||🦍
Chalicotherium|Clawed horse relative||🐴
Steller's Sea Cow|Giant sea cow|Steller's sea cow|🐄
Elasmotherium|Giant unicorn rhino||🦄
Hyaenodon|Ancient predator||🐺
Doedicurus|Spiked tail||🛡️`), mkT('t-insects', 'Insects & Bugs', '🐞', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Honey Bee|Makes honey|Western honey bee|🐝
Bumblebee|Fuzzy pollinator||🐝
Monarch Butterfly|Long migration|Monarch butterfly|🦋
Ladybird|Spotted beetle|Coccinellidae|🐞
Dragonfly|Aerial hunter||🪰
Praying Mantis|Ambush predator|Mantis|🦗
Firefly|Glows at night||✨
Bullet Ant|Painful sting|Paraponera clavata|🐜
Leafcutter Ant|Farms fungus|Leafcutter ant|🐜
Atlas Moth|Huge wings|Attacus atlas|🦋
Hercules Beetle|Strongest beetle|Dynastes hercules|🪲
Stag Beetle|Giant jaws|Lucanus cervus|🪲
Dung Beetle|Rolls dung||🪲
Grasshopper|Big jumper||🦗
Cicada|Loud summer song||🦗
Stick Insect|Master of disguise|Phasmatodea|🪵
Orchid Mantis|Looks like a flower|Hymenopus coronatus|🌸
Termite|Mound builder||🐜
Mosquito|Bites||🦟
Asian Giant Hornet|Huge hornet|Asian giant hornet|🐝
Cockroach|Survivor||🪳
Weta|Giant cricket||🦗
Luna Moth|Pale green||🦋
Goliath Beetle|Heaviest insect|Goliathus|🪲
Bombardier Beetle|Chemical spray||🪲
Desert Locust|Swarms|Desert locust|🦗`), mkT('t-farm', 'Farm Animals', '🐄', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Cow|Milk and moo|Cattle|🐄
Pig|Clever and muddy||🐖
Sheep|Wool||🐑
Goat|Climbs everything||🐐
Chicken|Eggs||🐔
Duck|Quack||🦆
Horse|Gallops||🐎
Donkey|Hee-haw||🫏
Llama|Spits||🦙
Alpaca|Fluffy fleece||🦙
Rabbit|Hops||🐇
Turkey|Gobble|Domestic turkey|🦃
Goose|Honks|Domestic goose|🪿
Camel|Ship of the desert|Dromedary|🐪
Water Buffalo|Asia||🐃
Yak|High altitude||🐂
Ox|Strong worker||🐂
Quail|Small bird||🐦
Guinea Fowl|Spotted|Helmeted guineafowl|🐔
Highland Cow|Shaggy Scottish cow|Highland cattle|🐄
Mule|Donkey and horse||🫏
Ostrich|Largest bird||🐦
Honey Bee|Hive|Western honey bee|🐝
Sheepdog|Farm helper|Border Collie|🐕`), mkT('t-safari', 'African Safari Animals', '🦒', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'ps', `
Lion|King of the savanna||🦁
African Elephant|Largest land animal|African bush elephant|🐘
Giraffe|Tallest animal||🦒
Zebra|Stripes|Plains zebra|🦓
White Rhinoceros|Square-lipped|White rhinoceros|🦏
Hippopotamus|River giant||🦛
Leopard|Climbs trees||🐆
Cheetah|Speed||🐆
African Buffalo|One of the Big Five||🐃
Wildebeest|Great migration|Blue wildebeest|🐃
Mountain Gorilla|Rwanda and Uganda||🦍
Chimpanzee|Close relative||🐒
Spotted Hyena|Laughing hunter||🐺
African Wild Dog|Painted wolf||🐕
Meerkat|Sentry duty||🐿️
Warthog|Tusks|Common warthog|🐗
Ostrich|Fastest bird on land|Common ostrich|🐦
Nile Crocodile|River ambusher||🐊
Lesser Flamingo|Pink lakes||🦩
Impala|Leaping antelope||🦌
Greater Kudu|Spiral horns||🦌
Okapi|Forest giraffe||🦓
Aardvark|Ant eater||🐽
Ground Pangolin|Scaly|Ground pangolin|🦔
Secretary Bird|Snake stomper|Secretarybird|🦅
Gemsbok|Long straight horns||🦌`), mkT('t-arctic', 'Arctic Animals', '🐻‍❄️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Polar Bear|Sea ice hunter||🐻‍❄️
Arctic Fox|White winter coat||🦊
Walrus|Tusks||🦭
Narwhal|Spiral tusk||🦄
Beluga Whale|White whale||🤍
Snowy Owl|White owl||🦉
Caribou|Reindeer|Reindeer|🦌
Muskox|Shaggy coat||🐂
Arctic Wolf|White wolf||🐺
Harp Seal|White pups||🦭
Ringed Seal|Lives under ice||🦭
Arctic Hare|White hare||🐇
Lemming|Tiny rodent||🐹
Rock Ptarmigan|Snowy bird||🐦
Bowhead Whale|Breaks ice||🐋
Arctic Tern|Longest migration||🐦
Atlantic Puffin|Colourful beak||🐧
Stoat|Ermine in winter||🐾
Wolverine|Fierce||🐾
Greenland Shark|Slow and ancient||🦈
Snow Goose|Huge flocks||🪿
Orca|Arctic visitor||🐬`), mkT('t-aussie', 'Australian Wildlife', '🦘', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Red Kangaroo|Largest marsupial||🦘
Koala|Eucalyptus eater||🐨
Common Wombat|Cube poo||🐻
Platypus|Duck-billed mammal||🦆
Short-beaked Echidna|Spiny anteater||🦔
Tasmanian Devil|Fierce scavenger||😈
Emu|Big flightless bird||🐦
Laughing Kookaburra|Laughing call||🐦
Dingo|Wild dog||🐕
Quokka|Smiling marsupial||😊
Southern Cassowary|Dangerous bird||🐦
Wallaby|Small kangaroo||🦘
Sugar Glider|Gliding possum||🐿️
Saltwater Crocodile|Huge croc||🐊
Frilled Lizard|Neck frill|Frilled-neck lizard|🦎
Thorny Devil|Spiky lizard||🦎
Bilby|Easter bunny of Australia|Greater bilby|🐰
Numbat|Termite eater||🐾
Superb Lyrebird|Master mimic||🐦
Galah|Pink cockatoo||🦜
Inland Taipan|Most venomous snake||🐍
Sydney Funnel-web Spider|Dangerous spider|Sydney funnel-web spider|🕷️
Box Jellyfish|Deadly sting||🪼
Common Brushtail Possum|Night visitor||🐾
Dugong|Sea cow||🐄`), mkT('t-primates', 'Monkeys & Apes', '🐒', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Gorilla|Largest primate||🦍
Chimpanzee|Tool user||🐒
Bonobo|Peaceful ape||🐒
Orangutan|Red ape||🦧
Gibbon|Swinging acrobat||🐒
Hamadryas Baboon|Arabia and Africa||🐒
Mandrill|Colourful face||🐒
Capuchin Monkey|Clever|Capuchin monkey|🐒
Howler Monkey|Loudest call|Howler monkey|📢
Spider Monkey|Long limbs|Spider monkey|🐒
Squirrel Monkey|Small and quick|Squirrel monkey|🐒
Proboscis Monkey|Big nose||👃
Japanese Macaque|Snow monkey||♨️
Golden Snub-nosed Monkey|China||🐒
Golden Lion Tamarin|Golden mane||🦁
Pygmy Marmoset|Smallest monkey||🐒
Gelada|Bleeding-heart monkey||🐒
Black-and-white Colobus|Long white tail|Mantled guereza|🐒
Vervet Monkey|Africa||🐒
Rhesus Macaque|Asia||🐒
Bald Uakari|Red face||🐒
Philippine Tarsier|Huge eyes||👀
Siamang|Throat pouch||🐒
Ring-tailed Lemur|Madagascar||🦝`), mkT('t-deepsea', 'Deep-Sea Creatures', '🐙', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Anglerfish|Glowing lure||🎣
Giant Squid|Kraken||🦑
Colossal Squid|Heaviest invertebrate||🦑
Vampire Squid|Cloak of webbing||🧛
Gulper Eel|Huge mouth|Pelican eel|🐍
Frilled Shark|Living fossil||🦈
Goblin Shark|Shooting jaws||👺
Blobfish|Saddest fish||😢
Dumbo Octopus|Ear-like fins|Grimpoteuthis|🐙
Giant Isopod|Huge sea bug||🐛
Barreleye|See-through head||👀
Viperfish|Needle teeth||🐟
Fangtooth|Biggest teeth for its size|Anoplogaster|🐟
Hatchetfish|Silver and thin|Marine hatchetfish|🐟
Lanternfish|Glowing dots||💡
Yeti Crab|Hairy claws|Kiwa hirsuta|🦀
Giant Tube Worm|Lives at vents|Riftia|🪱
Sea Pig|Deep-sea cucumber|Scotoplanes|🐷
Coelacanth|Living fossil||🐟
Giant Oarfish|Sea serpent|Giant oarfish|🐉
Japanese Spider Crab|Longest legs||🦀
Chimaera|Ghost shark||👻
Black Swallower|Eats bigger fish||🐟
Siphonophore|Colony creature||🪼`), mkT('t-extinct', 'Extinct Animals', '🦤', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Dodo|Mauritius||🦤
Thylacine|Tasmanian tiger||🐅
Passenger Pigeon|Once in billions||🕊️
Great Auk|Northern penguin-like bird||🐧
Steller's Sea Cow|Giant sea cow|Steller's sea cow|🐄
Quagga|Half-striped zebra||🦓
Moa|Giant flightless bird||🐦
Haast's Eagle|Giant eagle||🦅
Aurochs|Wild ancestor of cattle||🐂
Baiji|Yangtze river dolphin||🐬
Western Black Rhinoceros|Declared extinct 2011|Western black rhinoceros|🦏
Pyrenean Ibex|Spain||🐐
Golden Toad|Costa Rica||🐸
Caribbean Monk Seal|Caribbean||🦭
Javan Tiger|Indonesia||🐅
Elephant Bird|Madagascar giant||🥚
Carolina Parakeet|North America's parrot||🦜
Irish Elk|Giant deer|Irish elk|🦌
Cave Lion|Ice age lion||🦁
Woolly Mammoth|Ice age|Woolly mammoth|🦣
Megalodon|Giant shark||🦈
Labrador Duck|Canada||🦆
Arabian Ostrich|Extinct in the 1940s|Arabian ostrich|🐦
Bramble Cay Melomys|First climate-change extinction|Bramble Cay melomys|🐭`), mkT('t-cute', 'Cutest Animals', '🥰', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'ps', `
Red Panda|Fluffy tree climber||🐼
Quokka|Always smiling||😊
Sea Otter|Holds hands while sleeping||🦦
Fennec Fox|Giant ears||🦊
Hedgehog|Tiny spikes||🦔
Koala|Sleepy||🐨
Giant Panda|Bamboo lover||🐼
Kitten|Tiny cat|Kitten|🐱
Puppy|Tiny dog|Puppy|🐶
Bunny|Fluffy|Rabbit|🐰
Hamster|Cheek pouches|Golden hamster|🐹
Sloth|Slow and smiley||🦥
Penguin Chick|Fluffy|Penguin|🐧
Axolotl|Smiling salamander||🩷
Harp Seal Pup|White fluff|Harp seal|🦭
Pygmy Marmoset|Finger monkey||🐒
Meerkat|On lookout||🐿️
Chinchilla|Softest fur||🐭
Capybara|Chill with everyone||😌
Corgi|Short legs|Pembroke Welsh Corgi|🐶
Duckling|Follows in a line|Duck|🐥
Lamb|Bouncy|Sheep|🐑
Baby Elephant|Floppy trunk|Elephant|🐘
Pygmy Goat|Tiny goat||🐐
Arctic Fox|Snowball||🦊
Shiba Inu|Smiling dog||🐕`)];
}
function entTopicsV3() {
  const F = 'Entertainment';
  return [mkT('t-singers', 'Singers', '🎤', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Michael Jackson|King of Pop
Whitney Houston|The Voice
Beyoncé|Queen Bey
Adele|British soul
Taylor Swift|Pop and country
Rihanna|Barbados superstar
Ariana Grande|Pop and R&B
Bruno Mars|Pop and funk
The Weeknd|Toronto's R&B star
Ed Sheeran|Singer-songwriter
Justin Bieber|Stratford, Ontario
Billie Eilish|Alt-pop
Freddie Mercury|Queen frontman
Elvis Presley|The King
Frank Sinatra|Ol' Blue Eyes
Mariah Carey|Five-octave range
Celine Dion|Quebec's icon
Lady Gaga|Pop and jazz
Harry Styles|Ex-One Direction
Dua Lipa|Dance-pop
SZA|R&B
Olivia Rodrigo|Pop-rock
Sabrina Carpenter|Pop
Shakira|Colombian star
Bad Bunny|Puerto Rican star
Stevie Wonder|Soul legend
Prince|Purple Rain|Prince (musician)
Aretha Franklin|Queen of Soul
Amy Winehouse|Back to Black
Alicia Keys|R&B and piano
Usher|R&B|Usher (musician)
Shawn Mendes|Pickering, Ontario
Miley Cyrus|Pop
Lana Del Rey|Dream pop
Fairuz|Lebanese legend
Umm Kulthum|Egyptian legend
Amr Diab|Egyptian pop star
Mohammed Abdu|Saudi legend`), mkT('t-bands', 'Bands & Groups', '🎸', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
The Beatles|Liverpool
Queen|We Will Rock You|Queen (band)
The Rolling Stones|Rock legends
Led Zeppelin|Rock
Pink Floyd|Prog rock
Nirvana|Grunge|Nirvana (band)
Coldplay|Stadium pop-rock
Linkin Park|Nu metal
Metallica|Metal
AC/DC|Hard rock
U2|Irish rock
Oasis|Britpop|Oasis (band)
Radiohead|Alternative
Red Hot Chili Peppers|Funk rock
Guns N' Roses|Hard rock
Maroon 5|Pop rock
Imagine Dragons|Pop rock
Arctic Monkeys|Indie rock
Foo Fighters|Rock
Green Day|Punk rock
BTS|K-pop
Blackpink|K-pop
One Direction|Boy band
Backstreet Boys|Boy band
Spice Girls|Girl group
ABBA|Swedish pop
Fleetwood Mac|Rock
The Killers|Mr. Brightside
Daft Punk|French house
Gorillaz|Virtual band
Twenty One Pilots|Alt-pop
Fall Out Boy|Pop punk
Paramore|Pop punk
Bee Gees|Disco
Destiny's Child|R&B group
Fugees|Hip hop
Bon Jovi|Rock`), mkT('t-actors', 'Actors', '🎬', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Leonardo DiCaprio|Titanic, Inception
Denzel Washington|Training Day
Tom Hanks|Forrest Gump
Brad Pitt|Fight Club
Robert Downey Jr.|Iron Man
Will Smith|Bad Boys
Dwayne Johnson|Fast & Furious
Tom Cruise|Mission: Impossible
Morgan Freeman|The Shawshank Redemption
Keanu Reeves|John Wick
Johnny Depp|Pirates of the Caribbean
Samuel L. Jackson|Pulp Fiction
Al Pacino|The Godfather
Robert De Niro|Taxi Driver
Christian Bale|The Dark Knight
Matt Damon|The Bourne Identity
Ryan Reynolds|Deadpool
Ryan Gosling|Drive
Cillian Murphy|Oppenheimer
Timothée Chalamet|Dune
Tom Holland|Spider-Man
Chris Hemsworth|Thor
Chris Evans|Captain America
Jackie Chan|Rush Hour
Hugh Jackman|Wolverine
Idris Elba|Luther
Jason Statham|The Transporter
Vin Diesel|Fast & Furious
Adam Sandler|Happy Gilmore
Jim Carrey|The Mask
Eddie Murphy|Coming to America
Kevin Hart|Jumanji
Michael B. Jordan|Creed
Shah Rukh Khan|Bollywood's King Khan
Pedro Pascal|The Last of Us
Joaquin Phoenix|Joker
Heath Ledger|The Dark Knight
Anthony Hopkins|The Silence of the Lambs`), mkT('t-actresses', 'Actresses', '🎬', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Meryl Streep|The Devil Wears Prada
Margot Robbie|Barbie
Scarlett Johansson|Black Widow
Zendaya|Euphoria, Dune
Jennifer Lawrence|The Hunger Games
Emma Stone|La La Land
Natalie Portman|Black Swan
Angelina Jolie|Maleficent
Julia Roberts|Pretty Woman
Sandra Bullock|Gravity
Viola Davis|Fences
Florence Pugh|Little Women
Anne Hathaway|The Devil Wears Prada
Emma Watson|Harry Potter
Nicole Kidman|Moulin Rouge!
Cate Blanchett|Tár
Charlize Theron|Mad Max: Fury Road
Halle Berry|Monster's Ball
Gal Gadot|Wonder Woman
Zoe Saldaña|Avatar
Sydney Sweeney|Euphoria
Jenna Ortega|Wednesday
Anya Taylor-Joy|The Queen's Gambit
Millie Bobby Brown|Stranger Things
Audrey Hepburn|Breakfast at Tiffany's
Marilyn Monroe|Some Like It Hot
Jennifer Aniston|Friends
Kate Winslet|Titanic
Keira Knightley|Pirates of the Caribbean
Michelle Yeoh|Everything Everywhere All at Once
Lupita Nyong'o|Black Panther
Priyanka Chopra|Bollywood and Hollywood
Deepika Padukone|Bollywood star
Saoirse Ronan|Lady Bird
Emily Blunt|A Quiet Place`), mkT('t-franchise', 'Movie Franchises', '🎞️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Marvel Cinematic Universe|Avengers assemble
Star Wars|A galaxy far, far away
Harry Potter|Wizarding World|Harry Potter (film series)
The Lord of the Rings|Middle-earth|The Lord of the Rings (film series)
Fast & Furious|Family|Fast & Furious
James Bond|007|James Bond in film
Jurassic Park|Dinosaurs|Jurassic Park (franchise)
Mission: Impossible|Tom Cruise stunts|Mission: Impossible (film series)
The Dark Knight Trilogy|Nolan's Batman|The Dark Knight Trilogy
Toy Story|Pixar|Toy Story (franchise)
Shrek|DreamWorks|Shrek (franchise)
Pirates of the Caribbean|Captain Jack Sparrow|Pirates of the Caribbean (film series)
The Hunger Games|Panem|The Hunger Games (film series)
Transformers|Robots in disguise|Transformers (film series)
John Wick|Keanu Reeves|John Wick (franchise)
Indiana Jones|Adventure|Indiana Jones (franchise)
Back to the Future|Time travel|Back to the Future (franchise)
The Matrix|Red pill or blue pill|The Matrix (franchise)
Rocky|Creed too|Rocky (franchise)
Despicable Me|Minions|Despicable Me (franchise)
X-Men|Mutants|X-Men (film series)
Alien|In space no one can hear you scream|Alien (franchise)
Terminator|I'll be back|Terminator (franchise)
The Godfather|Corleone family|The Godfather (film series)
Kung Fu Panda|Po|Kung Fu Panda (franchise)
Ice Age|Scrat|Ice Age (franchise)
Planet of the Apes|Apes rule|Planet of the Apes
The Conjuring Universe|Horror|The Conjuring Universe
Avatar|Pandora|Avatar (franchise)
Dune|Arrakis|Dune (franchise)`), mkT('t-tvshows', 'TV Shows', '📺', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Breaking Bad|Crime drama
Game of Thrones|Fantasy
The Sopranos|Crime drama
Stranger Things|Sci-fi horror
Squid Game|Korean thriller
The Walking Dead|Zombies|The Walking Dead (TV series)
Peaky Blinders|By order of the Peaky Blinders|Peaky Blinders (TV series)
Prison Break|Escape drama
The Boys|Superhero satire|The Boys (TV series)
Succession|Family power struggle|Succession (TV series)
The Last of Us|Post-apocalyptic|The Last of Us (TV series)
House of the Dragon|Targaryens
Money Heist|Spanish heist|Money Heist
Wednesday|Addams Family|Wednesday (TV series)
The Crown|British royals|The Crown (TV series)
Better Call Saul|Saul Goodman
Dexter|Serial killer drama|Dexter (TV series)
Lost|Island mystery|Lost (TV series)
Sherlock|Modern Holmes|Sherlock (TV series)
The Wire|Baltimore
Narcos|Pablo Escobar
Ozark|Money laundering|Ozark (TV series)
Black Mirror|Tech nightmares
The Mandalorian|Star Wars
Severance|Work-life split|Severance (TV series)
The Bear|Chicago kitchen|The Bear (TV series)
Yellowstone|Ranch drama|Yellowstone (American TV series)
Euphoria|Teen drama|Euphoria (American TV series)
Suits|Lawyers|Suits (American TV series)
House|Medical drama|House (TV series)
Arcane|League of Legends|Arcane (TV series)
Shōgun|Feudal Japan|Shōgun (2024 TV series)`), mkT('t-sitcoms', 'Sitcoms', '😂', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Friends|New York friends
The Office|Dunder Mifflin|The Office (American TV series)
Seinfeld|A show about nothing
Brooklyn Nine-Nine|Police comedy
The Big Bang Theory|Science nerds
How I Met Your Mother|Legendary
Parks and Recreation|Pawnee
Modern Family|Three families
Arrested Development|The Bluths
It's Always Sunny in Philadelphia|Paddy's Pub
The Fresh Prince of Bel-Air|Will Smith
Everybody Loves Raymond|Family comedy
Frasier|Radio psychiatrist
Cheers|Boston bar
Two and a Half Men|Malibu
Malcolm in the Middle|Chaotic family
Community|Greendale
Scrubs|Hospital comedy
That '70s Show|Basement hangouts
New Girl|Loft mates
Schitt's Creek|Canadian comedy
Abbott Elementary|School mockumentary
Curb Your Enthusiasm|Larry David
Fawlty Towers|Basil Fawlty
Only Fools and Horses|Del Boy
Mr. Bean|Rowan Atkinson
The Inbetweeners|British teens
Kim's Convenience|Toronto family
Corner Gas|Saskatchewan
Letterkenny|Ontario
Ted Lasso|Football coach
The Simpsons|Springfield
Family Guy|Quahog`), mkT('t-anime', 'Anime Series', '🍥', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', '', `
One Piece|Pirates||🏴‍☠️
Naruto|Ninjas||🍥
Dragon Ball Z|Saiyans||🐉
Attack on Titan|Titans||🧱
Death Note|The notebook||📓
Demon Slayer|Demon hunters||⚔️
Jujutsu Kaisen|Cursed energy||👁️
My Hero Academia|Heroes with quirks||🦸
Hunter × Hunter|Hunters||🎣
Fullmetal Alchemist: Brotherhood|Alchemy||⚗️
Bleach|Soul Reapers||⚔️
One-Punch Man|Saitama||👊
Pokémon|Gotta catch 'em all||⚡
Spy × Family|The Forgers||🕵️
Chainsaw Man|Denji||🪚
Tokyo Ghoul|Ghouls||🎭
Haikyu!!|Volleyball||🏐
Neon Genesis Evangelion|Mechas||🤖
Cowboy Bebop|Space bounty hunters||🚀
Sword Art Online|Virtual reality||🗡️
Mob Psycho 100|Psychic powers||💯
Code Geass|Lelouch||♟️
Steins;Gate|Time travel||⏳
Vinland Saga|Vikings||🛶
Black Clover|Magic||🍀
Blue Lock|Football||⚽
Solo Leveling|Hunters and dungeons||🗝️
Frieren|Elf mage's journey||🧝
JoJo's Bizarre Adventure|Stands||⭐
Sailor Moon|Magical girls||🌙
Yu-Gi-Oh!|Card duels||🃏
Dr. Stone|Science rebuilds the world||🧪`), mkT('t-animechars', 'Anime Characters', '⚡', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', '', `
Goku|Dragon Ball||🐉
Vegeta|Dragon Ball||👑
Naruto Uzumaki|Naruto||🍥
Sasuke Uchiha|Naruto||⚡
Itachi Uchiha|Naruto||🌙
Kakashi Hatake|Naruto||📙
Monkey D. Luffy|One Piece||👒
Roronoa Zoro|One Piece||⚔️
Light Yagami|Death Note||📓
L|Death Note||🍰
Eren Yeager|Attack on Titan||🧱
Levi Ackerman|Attack on Titan||🗡️
Mikasa Ackerman|Attack on Titan||🧣
Satoru Gojo|Jujutsu Kaisen||🕶️
Yuji Itadori|Jujutsu Kaisen||👊
Ryomen Sukuna|Jujutsu Kaisen||👹
Tanjiro Kamado|Demon Slayer||🌊
Nezuko Kamado|Demon Slayer||🎋
Ichigo Kurosaki|Bleach||⚔️
Saitama|One-Punch Man||👊
Edward Elric|Fullmetal Alchemist||⚗️
Gon Freecss|Hunter × Hunter||🎣
Killua Zoldyck|Hunter × Hunter||⚡
Izuku Midoriya|My Hero Academia||💥
All Might|My Hero Academia||💪
Denji|Chainsaw Man||🪚
Spike Spiegel|Cowboy Bebop||🚬
Lelouch Lamperouge|Code Geass||♟️
Anya Forger|Spy × Family||🥜
Sung Jinwoo|Solo Leveling||🗝️
Frieren|Frieren||🧝
Yoichi Isagi|Blue Lock||⚽`), mkT('t-heroes', 'Superheroes', '🦸', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', '', `
Spider-Man|Marvel||🕷️
Batman|DC||🦇
Superman|DC||🦸
Iron Man|Marvel||🤖
Captain America|Marvel||🛡️
Thor|Marvel||🔨
Hulk|Marvel||💚
Black Panther|Marvel||🐆
Wonder Woman|DC||⭐
The Flash|DC||⚡
Wolverine|Marvel||🐺
Deadpool|Marvel||⚔️
Doctor Strange|Marvel||🪄
Black Widow|Marvel||🕸️
Aquaman|DC||🔱
Green Lantern|DC||💚
Captain Marvel|Marvel||✨
Scarlet Witch|Marvel||🔮
Ant-Man|Marvel||🐜
Daredevil|Marvel||😈
Hawkeye|Marvel||🏹
Vision|Marvel||💎
Star-Lord|Marvel||🎧
Groot|Marvel||🌳
Rocket Raccoon|Marvel||🦝
Shazam|DC||⚡
Cyborg|DC||🦾
Storm|Marvel||🌩️
Professor X|Marvel||🧠
Moon Knight|Marvel||🌙
Ms. Marvel|Marvel||💫
Silver Surfer|Marvel||🏄
Invincible|Image Comics||💛
Green Arrow|DC||🏹`), mkT('t-villains', 'Supervillains', '😈', F, 'Pick 1, Pick 2, Pick 3, Pick 4', '', `
The Joker|DC||🃏
Thanos|Marvel||🧤
Lex Luthor|DC||🧑‍💼
Magneto|Marvel||🧲
Loki|Marvel||🐍
Green Goblin|Marvel||🎃
Venom|Marvel||🖤
Doctor Doom|Marvel||🎭
Bane|DC||💪
Ultron|Marvel||🤖
Red Skull|Marvel||💀
Doctor Octopus|Marvel||🐙
Two-Face|DC||🪙
Harley Quinn|DC||🔨
Catwoman|DC||🐈‍⬛
The Penguin|DC||🐧
Scarecrow|DC||🌾
The Riddler|DC||❓
Killmonger|Marvel||🐆
Kang the Conqueror|Marvel||⏳
Galactus|Marvel||🪐
Mysterio|Marvel||🫧
Deathstroke|DC||⚔️
Darkseid|DC||🌑
Brainiac|DC||🧠
Poison Ivy|DC||🌿
Kingpin|Marvel||👔
Homelander|The Boys||🦅
Hela|Marvel||💀
Apocalypse|Marvel||🏺
Mystique|Marvel||💙`), mkT('t-pixar', 'Pixar Characters', '💡', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', '', `
Woody|Toy Story||🤠
Buzz Lightyear|Toy Story||🚀
Jessie|Toy Story||🐄
Rex|Toy Story||🦖
Lightning McQueen|Cars||🏎️
Mater|Cars||🚛
Nemo|Finding Nemo||🐠
Dory|Finding Nemo||🐟
Sulley|Monsters, Inc.||💙
Mike Wazowski|Monsters, Inc.||👁️
Boo|Monsters, Inc.||🚪
Mr. Incredible|The Incredibles||💪
Elastigirl|The Incredibles||🤸
Dash|The Incredibles||⚡
Edna Mode|The Incredibles||🕶️
Frozone|The Incredibles||❄️
WALL-E|WALL-E||🤖
EVE|WALL-E||🛸
Remy|Ratatouille||🐀
Carl Fredricksen|Up||🎈
Russell|Up||🏕️
Dug|Up||🐕
Joy|Inside Out||😄
Sadness|Inside Out||😢
Anger|Inside Out||😡
Anxiety|Inside Out 2||😬
Bing Bong|Inside Out||🐘
Miguel|Coco||🎸
Héctor|Coco||💀
Luca|Luca||🐟
Mei Lee|Turning Red||🐼
Merida|Brave||🏹
Ember|Elemental||🔥`), mkT('t-disney', 'Disney Characters', '🏰', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', '', `
Mickey Mouse|The original||🐭
Minnie Mouse|Classic||🎀
Donald Duck|Classic||🦆
Goofy|Classic||🐶
Simba|The Lion King||🦁
Scar|The Lion King||🦁
Timon|The Lion King||🦦
Pumbaa|The Lion King||🐗
Elsa|Frozen||❄️
Anna|Frozen||🌷
Olaf|Frozen||⛄
Moana|Moana||🌊
Maui|Moana||🪝
Stitch|Lilo & Stitch||👽
Ariel|The Little Mermaid||🧜‍♀️
Ursula|The Little Mermaid||🐙
Belle|Beauty and the Beast||📚
Aladdin|Aladdin||🧞
Genie|Aladdin||🧞
Jasmine|Aladdin||🐯
Jafar|Aladdin||🐍
Mulan|Mulan||⚔️
Rapunzel|Tangled||👱‍♀️
Cinderella|Cinderella||👠
Tiana|The Princess and the Frog||🐸
Hercules|Hercules||💪
Baloo|The Jungle Book||🐻
Maleficent|Sleeping Beauty||🖤
Captain Hook|Peter Pan||🪝
Winnie the Pooh|Hundred Acre Wood||🍯
Mirabel|Encanto||🦋
Judy Hopps|Zootopia||🐰
Nick Wilde|Zootopia||🦊`), mkT('t-streaming', 'Streaming Services', '📡', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Netflix|Series and films
YouTube|Everything
Disney+|Disney, Marvel, Star Wars
Amazon Prime Video|Prime originals
HBO Max|HBO series
Apple TV+|Apple originals
Hulu|US series
Paramount+|Paramount and CBS
Peacock|NBCUniversal|Peacock (streaming service)
Crave|Canadian streaming|Crave (streaming service)
Crunchyroll|Anime
Twitch|Live streams
Kick|Live streams|Kick (service)
Shahid|Arabic series and films|Shahid (streaming service)
Tubi|Free films
DAZN|Sports
ESPN+|Sports
Spotify|Music and podcasts
Apple Music|Music
YouTube Music|Music
Amazon Music|Music
SoundCloud|Music
Tidal|Music|Tidal (service)
Deezer|Music
Anghami|Arabic music
Rakuten Viki|Asian dramas
OSN+|Middle East streaming|OSN+`), mkT('t-youtubers', 'YouTubers', '▶️', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
MrBeast|Challenges and giveaways
KSI|Sidemen
Miniminter|Sidemen|Miniminter
Zerkaa|Sidemen
Behzinga|Sidemen
TBJZL|Sidemen
Vikkstar123|Sidemen
W2S|Sidemen
PewDiePie|Gaming legend
Markiplier|Gaming
Jacksepticeye|Gaming
Dude Perfect|Trick shots
Logan Paul|Vlogs and wrestling
Jake Paul|Vlogs and boxing
Mark Rober|Engineering builds
Marques Brownlee|Tech reviews
Casey Neistat|Vlogs
Lilly Singh|Comedy
Smosh|Comedy
Rhett & Link|Good Mythical Morning|Rhett & Link
Dream|Minecraft|Dream (YouTuber)
Technoblade|Minecraft
Ali-A|Fortnite and Call of Duty
Airrack|Stunts
Danny Duncan|Pranks and vlogs
Emma Chamberlain|Lifestyle
Sam Sulek|Gym vlogs
Ryan Trahan|Challenges`), mkT('t-streamers', 'Internet Streamers', '🎮', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
IShowSpeed|Speed
Kai Cenat|Mafiathons
xQc|Variety streamer
Ninja|Fortnite pioneer|Ninja (gamer)
Pokimane|Variety streamer
Shroud|FPS legend|Shroud (gamer)
TimTheTatman|Variety streamer
Dr Disrespect|Two-time champion|Dr Disrespect
Valkyrae|Variety streamer
Ibai Llanos|Spanish streamer
Sykkuno|Variety streamer
Ludwig|Variety streamer|Ludwig Ahgren
Hasan Piker|Politics and chat
Adin Ross|Variety streamer
Asmongold|MMO streamer
Summit1g|Variety streamer
Tyler1|League of Legends
Duke Dennis|AMP
Jynxzi|Rainbow Six Siege
CaseOh|Variety streamer
Fanum|AMP
Lirik|Variety streamer
Sodapoppin|Variety streamer
Mizkif|Variety streamer
Nickmercs|Call of Duty and Fortnite
TommyInnit|Minecraft`), mkT('t-consoles', 'Video Game Consoles', '🕹️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
PlayStation 5|Sony, 2020
PlayStation 4|Sony, 2013
PlayStation 2|Best-selling console ever
PlayStation|The original, 1994|PlayStation (console)
PlayStation Portable|PSP
Xbox Series X|Microsoft, 2020|Xbox Series X and Series S
Xbox 360|Microsoft, 2005
Xbox One|Microsoft, 2013
Xbox|The original, 2001|Xbox (console)
Nintendo Switch|Hybrid console, 2017
Nintendo Switch 2|Nintendo, 2025
Wii|Motion controls, 2006
Wii U|Nintendo, 2012
Nintendo 64|Nintendo, 1996
GameCube|Nintendo, 2001
Super Nintendo|SNES, 1990|Super Nintendo Entertainment System
NES|Nintendo, 1983|Nintendo Entertainment System
Game Boy|Nintendo handheld, 1989
Game Boy Advance|Nintendo handheld, 2001
Nintendo DS|Dual screens
Nintendo 3DS|3D without glasses
Sega Genesis|Mega Drive
Dreamcast|Sega's last console
Atari 2600|1977
Steam Deck|Valve handheld PC
PlayStation Vita|Sony handheld
Meta Quest 3|VR headset`), mkT('t-gamechars', 'Video Game Characters', '👾', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', '', `
Mario|Super Mario||🍄
Luigi|Super Mario||💚
Princess Peach|Super Mario||👑
Bowser|Super Mario||🐢
Yoshi|Super Mario||🦖
Link|The Legend of Zelda||🗡️
Princess Zelda|The Legend of Zelda||🔺
Pikachu|Pokémon||⚡
Sonic the Hedgehog|Sonic||💨
Master Chief|Halo||🪖
Kratos|God of War||🪓
Lara Croft|Tomb Raider||🏺
Steve|Minecraft||⛏️
Pac-Man|Pac-Man||🟡
Donkey Kong|Donkey Kong||🦍
Kirby|Kirby||🩷
Samus Aran|Metroid||🚀
Cloud Strife|Final Fantasy VII||⚔️
Solid Snake|Metal Gear||📦
Arthur Morgan|Red Dead Redemption 2||🤠
Geralt of Rivia|The Witcher||🐺
Ezio Auditore|Assassin's Creed||🗡️
Nathan Drake|Uncharted||🧗
Joel|The Last of Us||🎸
Ellie|The Last of Us||🎒
Crash Bandicoot|Crash Bandicoot||🦊
Spyro|Spyro||🐉
Mega Man|Mega Man||🤖
Doomguy|Doom||😠
Ryu|Street Fighter||🥋
Scorpion|Mortal Kombat||🦂
CJ|GTA: San Andreas||🚲
Agent 47|Hitman||🎯
Leon S. Kennedy|Resident Evil||🔫
Aloy|Horizon||🏹`), mkT('t-pokemon', 'Pokémon', '⚡', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5, Pick 6', '', `
Pikachu|Electric||⚡
Charizard|Fire/Flying||🔥
Mewtwo|Psychic||🧬
Mew|Psychic||🩷
Bulbasaur|Grass/Poison||🌱
Squirtle|Water||💧
Charmander|Fire||🔥
Gengar|Ghost/Poison||👻
Eevee|Normal||🦊
Snorlax|Normal||😴
Lucario|Fighting/Steel||🥋
Greninja|Water/Dark||🐸
Gyarados|Water/Flying||🐉
Dragonite|Dragon/Flying||🐲
Blastoise|Water||💦
Venusaur|Grass/Poison||🌺
Jigglypuff|Normal/Fairy||🎤
Psyduck|Water||🦆
Rayquaza|Dragon/Flying||🐉
Lugia|Psychic/Flying||🌊
Arceus|Normal||✨
Garchomp|Dragon/Ground||🦈
Umbreon|Dark||🌙
Sylveon|Fairy||🎀
Mimikyu|Ghost/Fairy||👻
Magikarp|Water||🐟
Ditto|Normal||🟣
Meowth|Normal||🐱
Machamp|Fighting||💪
Alakazam|Psychic||🥄
Lapras|Water/Ice||🦕
Tyranitar|Rock/Dark||🦖
Blaziken|Fire/Fighting||🐔
Gardevoir|Psychic/Fairy||💃
Zapdos|Electric/Flying||⚡
Articuno|Ice/Flying||❄️
Moltres|Fire/Flying||🔥`), mkT('t-horror', 'Horror Movies', '👻', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
The Exorcist|1973
Halloween|1978|Halloween (1978 film)
A Nightmare on Elm Street|1984
The Shining|1980|The Shining (film)
Scream|1996|Scream (1996 film)
It|2017|It (2017 film)
Get Out|2017
The Conjuring|2013
Hereditary|2018|Hereditary (film)
Saw|2004|Saw (2004 film)
Psycho|1960|Psycho (1960 film)
The Texas Chain Saw Massacre|1974
Friday the 13th|1980|Friday the 13th (1980 film)
Insidious|2010|Insidious (film)
Paranormal Activity|2007
The Ring|2002|The Ring (2002 film)
Us|2019|Us (2019 film)
A Quiet Place|2018
Sinister|2012|Sinister (film)
The Babadook|2014
Midsommar|2019
Smile|2022|Smile (2022 film)
Five Nights at Freddy's|2023|Five Nights at Freddy's (film)
Annabelle|2014|Annabelle (film)
Child's Play|1988|Child's Play (1988 film)
Jaws|1975
The Blair Witch Project|1999
28 Days Later|2002
Night of the Living Dead|1968
The Thing|1982|The Thing (1982 film)
Talk to Me|2023|Talk to Me (2022 film)
Barbarian|2022|Barbarian (2022 film)
M3GAN|2022
Sinners|2025|Sinners (2025 film)`), mkT('t-scifi', 'Sci-Fi Movies', '🚀', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Interstellar|2014|Interstellar (film)
Inception|2010
The Matrix|1999
Blade Runner|1982
Blade Runner 2049|2017
2001: A Space Odyssey|1968|2001: A Space Odyssey (film)
Star Wars|1977|Star Wars (film)
The Empire Strikes Back|1980
Alien|1979|Alien (film)
Aliens|1986|Aliens (film)
The Terminator|1984
Terminator 2: Judgment Day|1991
Back to the Future|1985
E.T. the Extra-Terrestrial|1982
Jurassic Park|1993|Jurassic Park (film)
Avatar|2009|Avatar (2009 film)
Dune|2021|Dune (2021 film)
Dune: Part Two|2024
Arrival|2016|Arrival (film)
Gravity|2013|Gravity (2013 film)
The Martian|2015|The Martian (film)
District 9|2009
Edge of Tomorrow|2014
Ex Machina|2014|Ex Machina (film)
Minority Report|2002|Minority Report (film)
Independence Day|1996|Independence Day (1996 film)
Men in Black|1997|Men in Black (1997 film)
Close Encounters of the Third Kind|1977
Tenet|2020|Tenet (film)
Everything Everywhere All at Once|2022
Ready Player One|2018|Ready Player One (film)`)];
}
function foodTopicsV3() {
  const F = 'Food & Drink';
  return [mkT('t-ffchains', 'Fast Food Restaurants', '🍟', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
McDonald's|Big Mac and fries
KFC|Original Recipe chicken
Burger King|Whopper
Wendy's|Square patties, Frosty
Taco Bell|Crunchwrap Supreme
Subway|Footlong subs|Subway (restaurant)
Popeyes|Chicken sandwich
Chick-fil-A|Chicken sandwich
Five Guys|Burgers and Cajun fries
In-N-Out Burger|Double-Double
Shake Shack|ShackBurger
Domino's|Pizza delivery|Domino's
Pizza Hut|Stuffed crust
Tim Hortons|Double-double and Timbits
Starbucks|Coffee
Dunkin'|Doughnuts and coffee|Dunkin'
Chipotle|Burrito bowls|Chipotle Mexican Grill
Panda Express|Orange chicken
Jollibee|Chickenjoy
Nando's|Peri-peri chicken
Wingstop|Wings
Raising Cane's|Chicken fingers|Raising Cane's Chicken Fingers
Whataburger|Texas burgers
Arby's|Roast beef
Sonic Drive-In|Drive-in classics
Jack in the Box|Tacos and burgers
Dairy Queen|Blizzards
Krispy Kreme|Original Glazed
Greggs|Sausage rolls
Harvey's|Canadian burgers|Harvey's
Mary Brown's|Canadian fried chicken
A&W|Teen Burger and root beer|A&W (Canada)
Al Baik|Saudi broasted chicken`), mkT('t-icecream', 'Ice Cream Flavours', '🍨', F, 'Scoop 1, Scoop 2, Scoop 3', '', `
Vanilla|The classic||🍦
Chocolate|Rich and creamy||🍫
Strawberry|Fruity pink||🍓
Mint Choc Chip|Mint with chocolate chips||🌿
Cookies and Cream|Cookie chunks||🍪
Cookie Dough|Raw dough bites||🍪
Salted Caramel|Sweet and salty||🧂
Pistachio|Nutty green||🟢
Rocky Road|Marshmallow, nuts, chocolate||🪨
Neapolitan|Three in one||🍨
Butter Pecan|Buttery pecans||🥜
Coffee|Coffee kick||☕
Mango|Tropical||🥭
Coconut|Creamy coconut||🥥
Rum and Raisin|Grown-up classic||🍇
Bubblegum|Bright and sweet||🫧
Cotton Candy|Fairground flavour||🍭
Birthday Cake|Sprinkles||🎂
Black Sesame|Toasty and nutty||⚫
Matcha|Green tea||🍵
Lemon Sorbet|Zesty||🍋
Raspberry Ripple|Vanilla with raspberry swirl||🫐
Moose Tracks|Fudge and peanut butter cups||🦌
Stracciatella|Chocolate flecks||🍨
Dulce de Leche|Caramelised milk||🍮
Hazelnut|Nutty||🌰
Peanut Butter Cup|Peanut butter and chocolate||🥜
Tiger Tail|Orange with liquorice swirl||🐯
Rainbow Sherbet|Three fruit flavours||🌈
Ube|Purple yam||💜`), mkT('t-chocbars', 'Chocolate Bars', '🍫', F, 'Bar 1, Bar 2, Bar 3, Bar 4', 'p', `
KitKat|Have a break|Kit Kat
Snickers|Peanuts and caramel
Twix|Left or right?
Mars|Nougat and caramel|Mars (chocolate bar)
Bounty|Coconut|Bounty (chocolate bar)
Milky Way|Light and fluffy|Milky Way (chocolate bar)
Galaxy|Smooth milk chocolate|Galaxy (chocolate)
Dairy Milk|Cadbury classic
Toblerone|Triangles
Kinder Bueno|Hazelnut wafer
Reese's Peanut Butter Cups|Peanut butter
Hershey's Milk Chocolate|American classic|Hershey bar
Aero|Bubbly|Aero (chocolate)
Coffee Crisp|Canadian favourite
Crunchie|Honeycomb
Wunderbar|Peanut butter and caramel|Wunderbar (chocolate bar)
Caramilk|Caramel inside
Oh Henry!|Peanuts and fudge
Mr. Big|Long Canadian bar|Mr. Big (chocolate bar)
Butterfinger|Crispy peanut butter
Baby Ruth|Peanuts and nougat
3 Musketeers|Whipped nougat|3 Musketeers (chocolate bar)
Milka|Alpine milk chocolate
Lion|Wafer and caramel|Lion (chocolate bar)
Double Decker|Nougat and cereal|Double Decker (chocolate bar)
Picnic|Peanuts, raisins, wafer|Picnic (chocolate bar)
Wispa|Bubbly Cadbury
Twirl|Flaky swirls|Twirl (chocolate bar)
Flake|Crumbly|Flake (chocolate bar)
Toffee Crisp|Toffee and crisp rice
Yorkie|Chunky|Yorkie (chocolate bar)`), mkT('t-crisps', 'Chips & Crisps', '🥔', F, 'Bag 1, Bag 2, Bag 3, Bag 4', 'p', `
Doritos|Nacho Cheese and Cool Ranch
Lay's|Classic potato chips
Pringles|Stackable
Cheetos|Cheesy puffs
Ruffles|Ridged
Takis|Rolled and spicy
Kettle Brand|Thick-cut|Kettle Foods
Walkers|UK crisps
Hula Hoops|Wear them on your fingers
Quavers|Melt-in-the-mouth|Quavers
Monster Munch|Pickled onion|Monster Munch
Wotsits|Cheesy|Wotsits
Frazzles|Bacon flavour
SunChips|Wavy multigrain
Fritos|Corn chips
Funyuns|Onion rings
Tostitos|Tortilla chips
Old Dutch|Canadian chips|Old Dutch Foods
Miss Vickie's|Kettle-cooked
Kurkure|Indian spicy snack
Bugles|Cone-shaped
Popchips|Popped
Smith's|Australian chips|Smith's Snackfood Company
Lay's Ketchup|Canadian favourite flavour|Lay's
Hot Cheetos|Flamin' Hot|Cheetos
Pringles Sour Cream & Onion|Fan favourite flavour|Pringles`), mkT('t-cereal', 'Breakfast Cereals', '🥣', F, 'Bowl 1, Bowl 2, Bowl 3, Bowl 4', 'p', `
Frosted Flakes|They're grrreat
Corn Flakes|The original
Cheerios|Little Os
Honey Nut Cheerios|Buzz the Bee|Cheerios
Lucky Charms|Marshmallows
Froot Loops|Toucan Sam
Cinnamon Toast Crunch|Cinnamon squares
Cocoa Puffs|Chocolatey
Rice Krispies|Snap, crackle, pop
Coco Pops|Chocolate rice
Cap'n Crunch|Crunchy corn squares
Reese's Puffs|Peanut butter and chocolate
Frosted Mini-Wheats|Wheat biscuits
Special K|Light flakes
Weetabix|Wheat biscuits
Shreddies|Wheat squares
Golden Grahams|Honey graham squares
Trix|Silly rabbit
Apple Jacks|Apple cinnamon
Corn Pops|Sweet corn puffs
Raisin Bran|Bran and raisins
Shredded Wheat|Big biscuits
Crunchy Nut|Honey and nuts|Crunchy Nut
Cookie Crisp|Mini cookies
Fruity Pebbles|Flintstones cereal|Pebbles cereal
Count Chocula|Monster cereal
Chex|Rice squares
Kix|Corn puffs`), mkT('t-street', 'Street Food', '🌮', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Tacos al Pastor|Mexico City|Al pastor|🌮
Döner Kebab|Turkey and Germany|Doner kebab|🥙
Shawarma|Middle East||🌯
Falafel|Middle East||🧆
Pad Thai|Thailand||🍜
Bánh Mì|Vietnam||🥖
Takoyaki|Osaka octopus balls||🐙
Churros|Spain and Mexico|Churro|🍩
Hot Dog|New York||🌭
Soft Pretzel|Germany and Philadelphia|Pretzel|🥨
Arepa|Venezuela and Colombia||🫓
Empanada|Latin America||🥟
Samosa|South Asia||🥟
Pani Puri|India|Panipuri|🫧
Bunny Chow|Durban, South Africa||🍞
Jerk Chicken|Jamaica|Jerk (cooking)|🍗
Satay|Southeast Asia||🍢
Elote|Mexican street corn||🌽
Crêpe|Paris||🥞
Currywurst|Berlin||🌭
Poutine|Quebec||🍟
Gua Bao|Taiwan||🥟
Tteokbokki|Korea||🌶️
Pupusa|El Salvador||🫓
Gözleme|Turkey||🫓
Arancini|Sicily||🍙
Fish and Chips|Britain||🐟
Choripán|Argentina||🌭
Corn Dog|USA||🌭
Lángos|Hungary||🍕`), mkT('t-mideast', 'Middle Eastern Food', '🧆', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Hummus|Chickpeas and tahini||🥣
Mansaf|Jordan's national dish||🍚
Kabsa|Spiced rice and meat||🍛
Mandi|Yemeni slow-cooked rice and meat|Mandi (food)|🍗
Maqluba|Upside-down rice||🍲
Fattoush|Bread salad||🥗
Tabbouleh|Parsley salad||🥗
Baba Ghanoush|Smoky aubergine dip||🍆
Kibbeh|Bulgur and meat||🧆
Manakish|Za'atar flatbread|Manakish|🫓
Kunafa|Cheese pastry in syrup|Knafeh|🧀
Baklava|Layers of filo and nuts||🍯
Shakshouka|Eggs in tomato sauce||🍳
Ful Medames|Fava beans|Ful medames|🫘
Koshari|Egypt's rice and lentils|Koshary|🍝
Fatteh|Bread, chickpeas, yogurt||🥣
Musakhan|Palestinian sumac chicken||🍗
Mutabbaq|Stuffed pan bread|Murtabak|🥟
Harees|Wheat and meat porridge||🥣
Luqaimat|Sweet dumplings|Luqaimat|🍯
Molokhia|Jute leaf stew|Mulukhiyah|🥬
Kofta|Spiced meatballs||🍢
Shish Taouk|Chicken skewers|Shish taouk|🍢
Labneh|Strained yogurt|Strained yogurt|🥛
Halloumi|Grilling cheese||🧀
Muhammara|Red pepper dip||🌶️
Umm Ali|Egyptian bread pudding||🍮
Basbousa|Semolina cake||🍰
Ma'amoul|Date-filled cookies|Maamoul|🍪
Dolma|Stuffed vine leaves||🍃`), mkT('t-saudi', 'Saudi Foods', '🇸🇦', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Kabsa|The national dish||🍛
Mandi|Slow-cooked rice and meat|Mandi (food)|🍗
Mathbi|Meat grilled on hot stones||🔥
Madfoon|Meat cooked underground||🍖
Haneeth|Slow-roasted lamb||🍖
Jareesh|Cracked wheat dish||🥣
Saleeg|Creamy rice from Hejaz||🍚
Harees|Wheat and meat porridge||🥣
Margoog|Vegetable and dough stew||🍲
Qursan|Thin bread in stew||🫓
Masoub|Banana and bread dish||🍌
Areeka|Bread with dates and honey||🍯
Mutabbaq|Stuffed pan bread|Murtabak|🥟
Kleija|Qassim date cookies|Kleicha|🍪
Luqaimat|Sweet dumplings|Luqaimat|🍯
Sambusa|Ramadan favourite|Samosa|🥟
Ful|Fava beans for breakfast|Ful medames|🫘
Tamees|Afghan-style bread|Tameez|🫓
Balaleet|Sweet vermicelli and egg||🍝
Dates|Sukkari, Ajwa, Khalas|Date palm|🌴
Saudi Coffee|Gahwa with cardamom|Arabic coffee|☕
Shawarma|Late-night favourite||🌯
Al Baik Broasted Chicken|Jeddah's famous chicken|Al Baik|🍗
Hininy|Dates, bread and ghee||🍯
Fattah|Bread soaked in broth|Fatteh|🥣
Maqshush|Sweet layered bread||🥞`), mkT('t-turkish', 'Turkish Foods', '🇹🇷', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Döner Kebab|Rotating grilled meat|Doner kebab|🥙
İskender Kebap|Döner on bread with butter|İskender kebap|🍖
Adana Kebab|Spicy minced meat|Adana kebabı|🍢
Lahmacun|Thin meat flatbread||🫓
Pide|Turkish boat pizza|Pide|🍕
Börek|Filo pastry||🥐
Simit|Sesame bread ring||🥯
Menemen|Scrambled eggs and tomatoes|Menemen (food)|🍳
Baklava|Pistachio pastry||🍯
Künefe|Hot cheese dessert|Knafeh|🧀
Turkish Delight|Lokum||🍬
Mantı|Tiny dumplings|Manti (food)|🥟
Köfte|Meatballs||🍢
Çiğ Köfte|Spicy bulgur balls||🌶️
Kumpir|Loaded baked potato||🥔
Gözleme|Stuffed flatbread||🫓
Dolma|Stuffed vegetables||🫑
İmam Bayıldı|Stuffed aubergine||🍆
Karnıyarık|Aubergine with mince||🍆
Lentil Soup|Mercimek çorbası|Lentil soup|🥣
Ayran|Yogurt drink||🥛
Turkish Tea|Çay in tulip glasses||🍵
Turkish Coffee|Thick and strong||☕
Kokoreç|Grilled offal||🔥
Midye Dolma|Stuffed mussels||🦪
Sütlaç|Rice pudding|Rice pudding|🍮
Tavuk Göğsü|Chicken pudding||🍮
Çılbır|Poached eggs and yogurt||🍳
Balık Ekmek|Fish sandwich||🐟
Pişmaniye|Cotton candy sweet||🍭`), mkT('t-japanese', 'Japanese Foods', '🍣', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Sushi|Rice and fish||🍣
Ramen|Noodle soup||🍜
Tempura|Battered and fried||🍤
Tonkatsu|Breaded pork cutlet||🍖
Udon|Thick noodles||🍜
Soba|Buckwheat noodles||🍜
Gyoza|Pan-fried dumplings|Jiaozi|🥟
Onigiri|Rice balls||🍙
Okonomiyaki|Savoury pancake||🥞
Takoyaki|Octopus balls||🐙
Yakitori|Grilled skewers||🍢
Karaage|Fried chicken||🍗
Japanese Curry|Thick and mild|Japanese curry|🍛
Miso Soup|Classic side||🥣
Sashimi|Raw fish slices||🐟
Gyudon|Beef rice bowl||🍚
Katsudon|Pork cutlet rice bowl||🍚
Oyakodon|Chicken and egg rice bowl||🍳
Unagi Don|Grilled eel on rice|Unadon|🐍
Shabu-shabu|Hot pot||🍲
Sukiyaki|Sweet hot pot||🍲
Mochi|Rice cake||🍡
Dorayaki|Red bean pancake||🥞
Taiyaki|Fish-shaped cake||🐟
Wagyu|Marbled beef||🥩
Edamame|Soybeans||🫛
Yakisoba|Fried noodles||🍝
Omurice|Omelette rice||🍳
Tamagoyaki|Rolled omelette||🍳
Matcha|Green tea||🍵`), mkT('t-korean', 'Korean Foods', '🇰🇷', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Kimchi|Fermented cabbage||🥬
Bibimbap|Mixed rice bowl||🍚
Bulgogi|Marinated beef||🥩
Korean Fried Chicken|Double-fried and glazed||🍗
Tteokbokki|Spicy rice cakes||🌶️
Japchae|Glass noodles||🍝
Samgyeopsal|Grilled pork belly||🥓
Kimbap|Seaweed rice rolls|Gimbap|🍙
Jjajangmyeon|Black bean noodles||🍜
Kimchi Jjigae|Kimchi stew||🍲
Sundubu-jjigae|Soft tofu stew||🍲
Galbi|Grilled short ribs||🍖
Naengmyeon|Cold noodles||🍜
Hotteok|Sweet pancake||🥞
Bingsu|Shaved ice dessert||🍧
Pajeon|Spring onion pancake||🥞
Dakgalbi|Spicy stir-fried chicken||🍗
Budae-jjigae|Army stew||🍲
Samgyetang|Ginseng chicken soup||🍲
Mandu|Dumplings||🥟
Jjamppong|Spicy seafood noodles||🍜
Bungeoppang|Fish-shaped pastry||🐟
Ramyeon|Instant noodles|Ramyeon|🍜
Seolleongtang|Ox bone soup||🥣
Gyeran-ppang|Egg bread||🥚
Yukgaejang|Spicy beef soup||🍲`), mkT('t-italian', 'Italian Foods', '🇮🇹', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Pizza Margherita|Naples classic||🍕
Spaghetti Carbonara|Egg, cheese, guanciale|Carbonara|🍝
Lasagne||Lasagna|🍝
Risotto|Creamy rice||🍚
Tiramisu|Coffee dessert||☕
Gelato|Italian ice cream||🍨
Cannoli|Sicilian pastry||🥐
Arancini|Fried rice balls||🍙
Bruschetta|Toasted bread||🍅
Cacio e Pepe|Cheese and pepper pasta||🧀
Pesto|Basil sauce from Genoa||🌿
Ossobuco|Braised veal shanks|Ossobuco|🍖
Gnocchi|Potato dumplings||🥔
Ravioli|Stuffed pasta||🥟
Tortellini|Ring-shaped pasta||🥟
Panna Cotta|Set cream||🍮
Focaccia|Olive oil bread||🍞
Prosciutto|Cured ham||🥓
Burrata|Creamy mozzarella||🧀
Parmigiano-Reggiano|The king of cheeses||🧀
Minestrone|Vegetable soup||🥣
Caprese Salad|Tomato and mozzarella||🍅
Saltimbocca|Veal with sage and ham||🍖
Ragù alla Bolognese|Meat sauce|Bolognese sauce|🍝
Polenta|Cornmeal||🌽
Biscotti|Twice-baked biscuits||🍪
Panettone|Christmas bread||🎄
Calzone|Folded pizza||🥟
Amatriciana|Tomato and guanciale pasta|Amatriciana sauce|🍝
Pasta alla Puttanesca|Olives and capers|Puttanesca|🍝`), mkT('t-mexican', 'Mexican Foods', '🇲🇽', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Tacos|Street classic|Taco|🌮
Burrito|Wrapped and stuffed||🌯
Enchiladas|Rolled and sauced|Enchilada|🌯
Quesadilla|Cheesy tortilla||🧀
Tamales|Steamed masa|Tamale|🫔
Pozole|Hominy stew||🍲
Mole Poblano|Chocolate-chilli sauce|Mole poblano|🍫
Chiles en Nogada|Patriotic stuffed peppers||🌶️
Guacamole|Avocado dip||🥑
Elote|Street corn||🌽
Churros|Fried dough||🍩
Nachos|Chips and cheese||🧀
Chilaquiles|Breakfast tortilla chips||🍳
Tostadas|Crunchy flat tortillas|Tostada (tortilla)|🌮
Sopes|Thick masa cakes|Sope|🫓
Gorditas|Stuffed masa pockets|Gordita|🫓
Huevos Rancheros|Ranch-style eggs||🍳
Cochinita Pibil|Yucatán pulled pork||🐖
Birria|Stewed meat for tacos||🌮
Carnitas|Slow-cooked pork||🐖
Barbacoa|Slow-cooked meat||🍖
Tlayuda|Oaxacan pizza||🫓
Pico de Gallo|Fresh salsa||🍅
Flautas|Rolled fried tacos|Taquito|🌮
Tres Leches Cake|Three-milk cake||🍰
Horchata|Rice drink||🥛
Menudo|Tripe soup|Menudo (soup)|🍲
Torta Ahogada|Drowned sandwich||🥖
Conchas|Sweet bread|Concha (bread)|🍞
Aguachile|Spicy shrimp||🦐`), mkT('t-indian', 'Indian Foods', '🇮🇳', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Butter Chicken|Creamy tomato curry||🍛
Biryani|Layered rice||🍚
Chicken Tikka Masala|Spiced tomato curry||🍛
Tandoori Chicken|Clay-oven chicken||🍗
Palak Paneer|Spinach and cheese||🥬
Chana Masala|Chickpea curry||🫘
Dal Makhani|Buttery lentils||🍲
Rogan Josh|Kashmiri lamb curry||🍖
Vindaloo|Hot Goan curry||🌶️
Korma|Mild and creamy||🍛
Samosa|Spiced pastry||🥟
Pani Puri|Crispy water balls|Panipuri|🫧
Dosa|Crispy crepe||🫓
Idli|Steamed rice cakes||⚪
Vada Pav|Mumbai burger||🍔
Pav Bhaji|Spiced veg with bread||🍞
Naan|Leavened flatbread||🫓
Paratha|Layered flatbread||🫓
Chole Bhature|Chickpeas and fried bread||🫓
Gulab Jamun|Syrup-soaked balls||🍯
Jalebi|Spiral sweets||🍥
Rasgulla|Spongy sweets||⚪
Kheer|Rice pudding||🍮
Lassi|Yogurt drink||🥛
Masala Chai|Spiced tea||🍵
Pakora|Fritters||🧅
Aloo Gobi|Potato and cauliflower||🥔
Malai Kofta|Dumplings in gravy||🍛
Rajma|Kidney bean curry|Rajma|🫘
Dhokla|Steamed savoury cake||🟨
Kulfi|Indian ice cream||🍦`), mkT('t-chinese', 'Chinese Foods', '🥡', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Peking Duck|Crispy roast duck||🦆
Kung Pao Chicken|Peanuts and chillies||🌶️
Sweet and Sour Pork|Cantonese classic||🍍
Mapo Tofu|Sichuan tofu||🌶️
Dim Sum|Cantonese small plates||🥟
Xiaolongbao|Soup dumplings||🥟
Har Gow|Shrimp dumplings||🦐
Siu Mai|Pork dumplings|Shumai|🥟
Char Siu|Barbecued pork||🍖
Chow Mein|Stir-fried noodles||🍜
Fried Rice|Wok-fried rice||🍚
Dan Dan Noodles|Sichuan spicy noodles||🍜
Hot Pot|Shared simmering broth||🍲
Wonton Soup|Dumplings in broth|Wonton|🥣
Spring Rolls|Crispy rolls|Spring roll|🌯
Egg Tart|Custard tart||🥧
Hainanese Chicken Rice|Poached chicken and rice||🍗
General Tso's Chicken|Sweet and spicy||🍗
Zongzi|Sticky rice parcels||🍙
Jiaozi|Boiled dumplings||🥟
Baozi|Steamed buns||🥟
Congee|Rice porridge||🥣
Lanzhou Beef Noodles|Hand-pulled noodles|Lanzhou beef noodle soup|🍜
Twice-Cooked Pork|Sichuan pork||🐖
Orange Chicken|American-Chinese favourite||🍊
Scallion Pancake|Flaky flatbread||🥞
Mooncake|Mid-Autumn treat||🥮
Tangyuan|Sweet rice balls||⚪
Beef Chow Fun|Wide rice noodles||🍜
Lo Mein|Soft noodles||🍜`), mkT('t-sauces', 'Sauces & Condiments', '🥫', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Ketchup|Tomato classic||🍅
Mayonnaise|Creamy||🥚
Mustard|Tangy yellow||🌭
Sriracha|Chilli garlic||🌶️
BBQ Sauce|Smoky and sweet|Barbecue sauce|🍖
Ranch|Herby dressing|Ranch dressing|🥗
Hot Sauce|Fiery||🔥
Soy Sauce|Salty umami||🥢
Garlic Sauce|Toum|Toum|🧄
Tahini|Sesame paste||🥜
Pesto|Basil and pine nuts||🌿
Chimichurri|Herb and vinegar||🌿
Salsa|Tomato and chilli|Salsa (sauce)|🍅
Sweet Chilli Sauce|Sticky and sweet|Sweet chili sauce|🌶️
Teriyaki|Sweet soy glaze||🍗
Hoisin|Sweet and savoury|Hoisin sauce|🥢
Worcestershire Sauce|Tangy and dark||🍶
Buffalo Sauce|Wing sauce|Buffalo wing|🍗
Honey Mustard|Sweet and tangy||🍯
Aioli|Garlic mayo||🧄
Tzatziki|Yogurt and cucumber||🥒
Harissa|North African chilli paste||🌶️
Gochujang|Korean chilli paste||🌶️
Peri-Peri|Portuguese-African chilli|Piri piri|🔥
Gravy|Meat sauce||🍲
Tartar Sauce|For fish and chips||🐟
Brown Sauce|HP-style||🟫
Mint Sauce|For lamb||🌿
Chilli Crisp|Crunchy chilli oil|Chili oil|🌶️
Maple Syrup|Canadian gold||🍁`), mkT('t-coffee', 'Coffee Drinks', '☕', F, 'Cup 1, Cup 2, Cup 3, Cup 4', 'ps', `
Espresso|Short and strong||☕
Americano|Espresso and water|Caffè Americano|☕
Latte|Espresso and steamed milk|Caffè latte|🥛
Cappuccino|Foamy||☕
Flat White|Velvety microfoam||☕
Mocha|Coffee and chocolate|Caffè mocha|🍫
Macchiato|Espresso with a dash of foam|Caffè macchiato|☕
Cortado|Equal espresso and milk||☕
Iced Coffee|Chilled||🧊
Cold Brew|Steeped overnight|Cold brew coffee|🧊
Frappuccino|Blended iced coffee||🥤
Affogato|Espresso over ice cream||🍨
Irish Coffee|Coffee, whiskey and cream||☕
Turkish Coffee|Thick and unfiltered||☕
Saudi Coffee|Gahwa with cardamom|Arabic coffee|☕
Vietnamese Iced Coffee|With condensed milk|Vietnamese iced coffee|🧊
Dalgona Coffee|Whipped coffee||☁️
Pumpkin Spice Latte|Autumn favourite||🎃
Caramel Macchiato|Vanilla and caramel|Caffè macchiato|🍮
Iced Capp|Tim Hortons classic|Tim Hortons|🥤
Double-Double|Two cream, two sugar|Tim Hortons|☕
Ristretto|Extra short espresso||☕
Spanish Latte|Sweetened condensed milk|Caffè latte|🥛
Café au Lait|Coffee with hot milk||☕
Nitro Cold Brew|Creamy and fizzy|Nitro cold brew coffee|🧊
Café de Olla|Mexican spiced coffee||☕
Greek Frappé|Foamy iced instant coffee|Frappé coffee|🧊`), mkT('t-boba', 'Bubble Tea Flavours', '🧋', F, 'Cup 1, Cup 2, Cup 3', '', `
Classic Milk Tea|Black tea with milk||🧋
Brown Sugar Boba|Tiger stripes||🐯
Taro|Purple and nutty||💜
Matcha Milk Tea|Green tea||🍵
Thai Tea|Orange and spiced||🧡
Mango|Tropical||🥭
Strawberry|Fruity||🍓
Passion Fruit|Tangy||💛
Honeydew|Melon||🍈
Lychee|Floral fruit||🌸
Jasmine Green Tea|Light and floral||🌼
Oolong Milk Tea|Roasted||🍂
Wintermelon|Caramel-like||🍈
Hokkaido Milk Tea|Creamy caramel||🐄
Okinawa Milk Tea|Brown sugar milk||🟤
Coconut|Creamy||🥥
Peach|Juicy||🍑
Chocolate|Rich||🍫
Coffee Milk Tea|Yuanyang style||☕
Cheese Foam Tea|Salty cream top||🧀
Ube|Purple yam||💜
Peach Oolong|Fruity and roasted||🍑
Grapefruit Green Tea|Zesty||🍊
Rose Milk Tea|Floral||🌹
Almond Milk Tea|Nutty||🌰
Pineapple|Sweet and sharp||🍍`), mkT('t-bakery', 'Bakery Items', '🥐', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Croissant|Buttery and flaky||🥐
Pain au Chocolat|Chocolate croissant||🍫
Bagel|Boiled then baked||🥯
Cinnamon Roll|Sticky swirls|Cinnamon roll|🌀
Doughnut|Glazed or filled||🍩
Muffin|Blueberry or chocolate||🧁
Danish Pastry|Fruit or custard|Danish pastry|🥐
Baguette|French stick||🥖
Sourdough|Tangy loaf|Sourdough|🍞
Brioche|Rich and buttery||🍞
Scone|With jam and cream||🫓
Éclair|Choux with chocolate|Éclair|🍫
Macaron|Colourful almond cookies|Macaron|🌈
Banana Bread|Moist loaf||🍌
Kouign-Amann|Caramelised butter pastry|Kouign-amann|🥐
Pastel de Nata|Portuguese custard tart|Pastel de nata|🥧
Apple Turnover|Fruit pastry|Turnover (food)|🍎
Ensaïmada|Spiral pastry||🌀
Canelé|Caramelised custard cake|Canelé|🟤
Madeleine|Shell-shaped cake|Madeleine (cake)|🐚
Sausage Roll|Savoury classic||🌭
Cornish Pasty|Hand pie||🥟
Bear Claw|Almond pastry|Bear claw (pastry)|🐻
Cruller|Twisted doughnut||🍩
Babka|Chocolate swirl bread||🍫
Challah|Braided bread||🍞
Rugelach|Rolled pastries||🥐
Concha|Mexican sweet bread|Concha (bread)|🐚`), mkT('t-noodles', 'Instant Noodles', '🍜', F, 'Pack 1, Pack 2, Pack 3', 'p', `
Shin Ramyun|Korean spicy|Shin Ramyun
Buldak Ramen|Fire noodles|Buldak-bokkeum-myeon
Indomie Mi Goreng|Indonesian fried noodles|Mi goreng
Maggi 2-Minute Noodles|India and beyond|Maggi
Cup Noodles|Nissin original|Cup Noodles
Top Ramen|Nissin classic|Top Ramen
Maruchan Ramen|College classic|Maruchan
Nissin Chow Mein|Stir-fry style|Nissin Foods
Neoguri|Seafood udon-style|Nongshim
Chapagetti|Black bean noodles|Chapagetti
Jin Ramen|Ottogi classic|Ottogi
Samyang Ramen|The original Korean instant|Samyang Foods
Nongshim Tonkotsu|Pork broth|Nongshim
Mama Noodles|Thai favourite|Mama (instant noodle)
Koka Noodles|Singapore|Koka (noodles)
Nissin Demae Ramen|Hong Kong favourite|Nissin Foods
Paldo Bibimmyeon|Cold sweet-spicy|Paldo (company)
Indomie Soto|Indonesian soup|Indomie
Pot Noodle|UK student staple|Pot Noodle
Mr. Noodles|Canadian staple|Mr. Noodles
Ottogi Jin Jjambbong|Spicy seafood|Ottogi
Sapporo Ichiban|Japanese classic|Sapporo Ichiban
Nongshim Kimchi Ramyun|Kimchi flavour|Nongshim
Wai Wai|Nepalese noodles|Wai Wai (noodles)`), mkT('t-cheese', 'Cheese Types', '🧀', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Cheddar|Sharp and versatile|Cheddar cheese|🧀
Mozzarella|Stretchy pizza cheese||🍕
Brie|Soft French||🧀
Camembert|Soft and earthy||🧀
Parmesan|Hard and nutty|Parmigiano Reggiano|🧀
Gouda|Dutch classic||🧀
Feta|Greek brined||🥗
Halloumi|Grilling cheese||🔥
Roquefort|French blue||🔵
Gorgonzola|Italian blue||🔵
Stilton|English blue|Stilton cheese|🔵
Emmental|Swiss with holes|Emmental cheese|🧀
Gruyère|Alpine and nutty|Gruyère cheese|🧀
Manchego|Spanish sheep's cheese|Manchego|🐑
Ricotta|Soft and fresh||🥄
Mascarpone|Creamy (tiramisu)||🥄
Paneer|Indian fresh cheese||🧀
Burrata|Mozzarella with cream inside||🧀
Provolone|Italian sandwich cheese||🧀
Monterey Jack|Mild American|Monterey Jack|🧀
Havarti|Danish buttery||🧀
Edam|Red-wax Dutch|Edam cheese|🔴
Comté|French Alpine|Comté cheese|🧀
Raclette|Melted and scraped||🧀
Pecorino Romano|Salty sheep's cheese||🐑
Akkawi|Middle Eastern white cheese||🧀
Cream Cheese|Bagel spread||🥯
Cottage Cheese|Curds||🥣
Goat Cheese|Tangy chèvre|Goat cheese|🐐
Cheese Curds|Squeaky (poutine)||🧀`)];
}
function funTopicsV3() {
  const F = 'Just for Fun';
  const list = (id, name, emoji, slots, text) => mkT(id, name, emoji, F, slots, '', text);
  return [list('t-redflags', 'Biggest Red Flags', '🚩', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Rude to waiters|||🚩
Never says sorry|||🙅
Always on their phone|||📱
Only talks about themselves|||🗣️
Lies about small things|||🤥
Ghosts people|||👻
Never pays you back|||💸
Jealous of your friends|||😒
Hates all animals|||🐾
Chews with mouth open|||😬
Spoils films on purpose|||🎬
Always late|||⏰
Reads your messages|||👀
Bad-mouths every ex|||💬
Cheats at board games|||🎲
Never texts back|||📵
Can't take a joke|||😤
Rude to their parents|||👪
Rage-quits every game|||🎮
Talks during films|||🍿
Never tries new food|||🥦
Leaves dishes for days|||🍽️
Takes credit for your work|||🏆
Copies your homework, then gets a better mark|||📝
Says "no offence" before being offensive|||😶`), list('t-greenflags', 'Green Flags', '💚', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Remembers small details|||🧠
Kind to waiters|||🍽️
Good with kids and animals|||🐶
Laughs at your jokes|||😂
Says sorry and means it|||🙏
Keeps promises|||🤝
Texts back|||💬
Makes plans|||📅
Supports your goals|||🚀
Cooks for you|||🍳
Great listener|||👂
Respects boundaries|||🚧
Gets on with your friends|||🧑‍🤝‍🧑
Honest even when it's hard|||💯
Shares food|||🍕
Has their own hobbies|||🎨
Calls their mum|||📞
Always on time|||⏱️
Admits when they're wrong|||🙋
Hypes you up|||📣
Keeps their room clean|||🧹
Good playlist|||🎧
Patient driver|||🚗
Generous with their time|||⌛
Celebrates your wins|||🎉`), list('t-skills', 'Skills Everyone Should Learn', '🧰', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Cooking|||🍳
Swimming|||🏊
First aid and CPR|||⛑️
Driving|||🚗
Budgeting|||💰
Changing a tyre|||🛞
Basic coding|||💻
Public speaking|||🎤
Touch typing|||⌨️
A second language|||🗣️
Negotiating|||🤝
Time management|||⏰
Basic car maintenance|||🔧
Ironing|||👔
Sewing a button|||🪡
Self-defence|||🥋
Reading a map|||🗺️
Writing a CV|||📄
Cleaning properly|||🧽
Saving and investing|||📈
Starting a fire safely|||🔥
Gardening|||🌱
Photography|||📷
Cooking for a group|||🍲
Fixing things yourself|||🔨`), list('t-splurge', 'Things Worth Splurging On', '💳', 'Pick 1, Pick 2, Pick 3, Pick 4', `
A good mattress|||🛏️
Good shoes|||👟
Your phone|||📱
Headphones|||🎧
A winter coat|||🧥
An office chair|||🪑
Travel|||✈️
Concert tickets|||🎫
Gaming setup|||🎮
Dental care|||🦷
Gym membership|||🏋️
Kitchen knives|||🔪
Laptop|||💻
A good haircut|||💈
A watch|||⌚
A reliable car|||🚗
Suitcase|||🧳
Fragrance|||🧴
Coffee machine|||☕
Bedsheets|||🛌
Glasses|||👓
Tyres|||🛞
Experiences with friends|||🧑‍🤝‍🧑
Courses and education|||🎓
Running shoes|||🏃`), list('t-waste', 'Biggest Wastes of Money', '🗑️', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Extended warranties|||📜
Lottery tickets|||🎟️
Unused gym membership|||🏋️
Bottled water at home|||💧
Hotel minibar|||🍫
Airport food|||✈️
Impulse buys|||🛒
Late fees|||⏰
Subscriptions you forgot about|||🔁
Fast-fashion hauls|||👗
NFTs|||🖼️
Loot boxes|||🎁
Fancy gift wrap|||🎀
Cinema snacks|||🍿
Delivery fees|||🛵
New phone every year|||📱
Resale ticket mark-ups|||🎫
Skins you never use|||🎮
Car add-ons nobody needs|||🚗
Designer phone cases|||📱
Bank fees|||🏦
Diet teas and fads|||🍵
Novelty gadgets|||🔌
Paying for apps you never open|||📲`), list('t-partybring', 'Things to Bring to a Party', '🎉', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Speaker|||🔊
Snacks|||🍿
Pizza|||🍕
Drinks|||🥤
Ice|||🧊
Cups|||🥤
Board game|||🎲
Uno cards|||🃏
Phone charger|||🔌
A great playlist|||🎶
Games console|||🎮
Dessert|||🍰
Chips and dip|||🥣
Glow sticks|||✨
Balloons|||🎈
Cake|||🎂
Extra chairs|||🪑
Fairy lights|||💡
Karaoke mic|||🎤
Instant camera|||📸
A football|||⚽
Napkins|||🧻
Your best friend|||🧑‍🤝‍🧑
Good energy|||⚡`), list('t-business', 'Dream Businesses', '🏪', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Coffee shop|||☕
Bakery|||🥐
Gaming café|||🎮
Sneaker store|||👟
Food truck|||🚚
Car dealership|||🚗
Clothing brand|||👕
Restaurant|||🍽️
Gym|||🏋️
Barbershop|||💈
Tech startup|||💻
YouTube channel|||▶️
Bookshop|||📚
Hotel|||🏨
Travel agency|||✈️
Ice cream parlour|||🍦
Car wash|||🧽
Phone repair shop|||📱
Record label|||🎵
Esports team|||🏆
Football club|||⚽
Bubble tea shop|||🧋
Real estate company|||🏠
Mobile app|||📲
Theme park|||🎢
Dessert café|||🍰
Car detailing studio|||✨`), list('t-worldslive', 'Fictional Worlds to Live In', '🌈', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Hogwarts|Harry Potter||🧙
The Shire|The Lord of the Rings||🏡
Wakanda|Black Panther||🐆
Pandora|Avatar||🌿
Narnia|The Chronicles of Narnia||🦁
Naboo|Star Wars||🌌
The Pokémon World|Pokémon||⚡
Hyrule|The Legend of Zelda||🗡️
Mushroom Kingdom|Super Mario||🍄
Bikini Bottom|SpongeBob||🍍
Springfield|The Simpsons||🍩
Asgard|Marvel||⚡
Willy Wonka's Chocolate Factory|Charlie and the Chocolate Factory||🍫
Neverland|Peter Pan||🧚
Arendelle|Frozen||❄️
Animal Crossing Island|Animal Crossing||🏝️
A Minecraft World|Minecraft||⛏️
Zootopia|Zootopia||🦊
Monstropolis|Monsters, Inc.||👁️
The Four Nations|Avatar: The Last Airbender||🌊
Hidden Leaf Village|Naruto||🍥
The Grand Line|One Piece||🏴‍☠️
Pelican Town|Stardew Valley||🌾
Themyscira|Wonder Woman||🏛️
Atlantis|Aquaman||🔱`), list('t-worldsavoid', 'Fictional Worlds to Avoid', '☠️', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Gotham City|Batman||🦇
Panem|The Hunger Games||🏹
The Upside Down|Stranger Things||🙃
Westeros|Game of Thrones||🐉
Mordor|The Lord of the Rings||🌋
Raccoon City|Resident Evil||🧟
Isla Nublar|Jurassic Park||🦖
The Matrix|The Matrix||💊
Silent Hill|Silent Hill||🌫️
Rapture|BioShock||🌊
The Wasteland|Fallout||☢️
Night City|Cyberpunk 2077||🌃
The Purge|The Purge||🔪
The Fury Road|Mad Max||🚗
The Squid Game Island|Squid Game||🦑
The Walking Dead World|The Walking Dead||🧟
Jumanji|Jumanji||🎲
Azkaban|Harry Potter||⛓️
Arrakis|Dune||🏜️
Lordran|Dark Souls||🔥
Los Santos|GTA V||🚓
The Hunger Games Arena|The Hunger Games||🔥
Hellfire Club Hawkins|Stranger Things||🎲`), list('t-annoying', 'Most Annoying Things', '😤', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Slow walkers|||🐢
Loud chewing|||😬
Phone at 1%|||🪫
Stubbing your toe|||🦶
Lag in online games|||📶
Spoilers|||🙉
Buffering|||⏳
Popcorn in your teeth|||🍿
Wet socks|||🧦
Tangled earphones|||🎧
Someone reading your screen|||👀
Autocorrect fails|||🔤
Mosquito at night|||🦟
Reply-all emails|||📧
Pop-up ads|||🪧
Losing the remote|||📺
Unskippable ads|||⏭️
Group chat spam|||💬
Sand in your shoes|||🏖️
Brain freeze|||🧊
Paper cuts|||📄
Forgetting why you walked in|||🚪
Traffic|||🚗
Hold music|||☎️
A song stuck in your head|||🎶`), list('t-satisfying', 'Most Satisfying Things', '😌', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Peeling the film off a new screen|||📱
Popping bubble wrap|||🫧
First sip of cold water|||💧
Perfect parallel park|||🅿️
A clean room|||🧹
Fresh sheets|||🛏️
Ticking off a to-do list|||✅
A fresh haircut|||💈
Pressure washing|||🚿
Kinetic sand|||⏳
The last puzzle piece|||🧩
A perfectly ripe avocado|||🥑
Unboxing new tech|||📦
Game-winning shot|||🏀
Rain on the window|||🌧️
Fresh snow, no footprints|||❄️
Phone at 100%|||🔋
Warm laundry from the dryer|||🧺
Perfect toast|||🍞
Opening a new jar|||🫙
Cleaning the lint filter|||🌀
Mechanical keyboard clicks|||⌨️
Ice cracking in a drink|||🧊
Everything fitting in one trip|||🛍️
A perfect free kick|||⚽`), list('t-dayimprovers', 'Things That Make Your Day', '☀️', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Sunshine|||☀️
Good coffee|||☕
A compliment|||💬
Payday|||💵
Your song on the radio|||📻
Finding money in old jeans|||👖
A nap|||😴
Free food|||🍕
Your team winning|||⚽
A text from a friend|||📱
A dog saying hi|||🐕
No traffic|||🛣️
Shower after the gym|||🚿
Snow day|||❄️
A good laugh|||😂
Finishing early|||🏃
Your order arriving|||📦
Clean sheets|||🛏️
Beating your high score|||🕹️
Hot chocolate|||☕
Long weekend|||📅
A sunset|||🌇
Good hair day|||💇
Getting the last slice|||🍰
A surprise from family|||🎁`), list('t-spend100', 'Best Ways to Spend $100', '💵', 'Pick 1, Pick 2, Pick 3, Pick 4', `
A nice dinner|||🍽️
Concert ticket|||🎫
A new video game|||🎮
Sneakers|||👟
A gift for someone|||🎁
A day trip|||🚗
Go-karting|||🏎️
Escape room|||🔐
Books|||📚
Gym gear|||🏋️
Groceries for two weeks|||🛒
Theme park ticket|||🎢
A class or workshop|||🎓
Save it|||🐷
Donate it|||💝
Haircut and skincare|||💈
Board games|||🎲
A massage|||💆
New clothes|||👕
Plants|||🪴
Kitchen gear|||🍳
Film night with friends|||🍿
Trampoline park|||🤸
Paintball|||🔫
Bowling night|||🎳`), list('t-spend1000', 'Best Ways to Spend $1,000', '💰', 'Pick 1, Pick 2, Pick 3, Pick 4', `
A weekend trip|||✈️
Gaming PC upgrade|||🖥️
A new phone|||📱
A designer piece|||👜
Front-row concert tickets|||🎤
Invest it|||📈
A laptop|||💻
A bike|||🚲
A course or certification|||🎓
A watch|||⌚
New furniture|||🛋️
Family dinner out|||🍽️
Emergency fund|||🛟
A camera|||📷
Festival tickets|||🎪
A road trip|||🚗
Skydiving|||🪂
Start a side business|||💼
Sneaker collection|||👟
A big TV|||📺
Personal trainer|||🏋️
Give to charity|||💝
Driving lessons|||🚙
Hotel staycation|||🏨
Umrah or a family trip|||🕋`), list('t-3am', 'Things to Do at 3 AM', '🌙', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Raid the fridge|||🧀
Gaming|||🎮
Deep conversations|||💭
Stargazing|||✨
YouTube rabbit hole|||▶️
Late-night drive|||🚗
Order fast food|||🍔
Read a book|||📖
Doomscroll|||📱
Start a new series|||📺
Plan your whole life|||🗒️
Clean your room|||🧹
Work out|||💪
Make instant noodles|||🍜
Spam the group chat|||💬
Listen to music|||🎧
Wikipedia deep dive|||🌐
Night prayer|||🤲
Actually sleep|||😴
Write something|||✍️
Draw|||🎨
Make a playlist|||🎶
Bake cookies|||🍪
Rearrange the furniture|||🛋️
Watch the sunrise later|||🌅`), list('t-worstpowers', 'Worst Superpowers', '🙃', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Talk to fish (they're boring)|||🐟
Invisible only when nobody's looking|||🫥
Super speed, but backwards|||⏪
Teleport one metre|||📏
Read pigeons' minds|||🐦
Turn into a chair|||🪑
Super strength in your little toe|||🦶
X-ray vision through socks only|||🧦
Fly 2 cm off the ground|||🪶
Control the weather in one room|||⛅
Predict the past|||🔮
Glow in the dark|||💡
Hair changes colour at random|||🌈
Super hearing you can't switch off|||👂
Shoot spaghetti from your hands|||🍝
Summon one random sock|||🧦
Endless hiccups|||😮
Breathe underwater, in bathtubs only|||🛁
Talk to plants that ignore you|||🌱
Freeze time, but you freeze too|||⏸️
Invisible to cats only|||🐈
Make toast slightly warmer|||🍞
Always know the time (to the second)|||⏱️
Change the TV channel with your mind (only to the news)|||📺`), list('t-powercombos', 'Best Superpower Combos', '💥', 'Combo 1, Combo 2, Combo 3', `
Flight + Super Strength|||🦸
Teleportation + Invisibility|||🫥
Time Travel + Healing|||⏳
Mind Reading + Shapeshifting|||🧠
Super Speed + Intangibility|||⚡
Telekinesis + Flight|||🪄
Immortality + Healing Others|||❤️‍🩹
Weather Control + Flight|||🌩️
Invisibility + Super Hearing|||👂
Elemental Powers + Teleportation|||🔥
Animal Talk + Shapeshifting|||🐺
Duplication + Super Intelligence|||👥
Time Freeze + Super Speed|||⏸️
Laser Eyes + Flight|||👀
Regeneration + Super Strength|||💪
Portals + Mind Control|||🌀
Ice Powers + Water Breathing|||❄️
Telepathy + Teleportation|||📡
Luck Manipulation + Charisma|||🍀
Gravity Control + Flight|||🌍
Technopathy + Invisibility|||💻
Size Changing + Super Strength|||🐜`), list('t-shouldexist', 'Things That Should Exist', '💡', 'Pick 1, Pick 2, Pick 3, Pick 4', `
A phone battery that lasts a week|||🔋
Teleporters|||🌀
Healthy food that tastes like junk food|||🍔
Self-cleaning rooms|||🧹
A pause button for life|||⏸️
A snooze button for Mondays|||⏰
One charger for everything|||🔌
Real hoverboards|||🛹
An umbrella that never flips|||☂️
Lag-free internet everywhere|||📶
Zero-calorie pizza|||🍕
Laundry that folds itself|||👕
Socks that never go missing|||🧦
A button that skips traffic|||🚗
Clothes that never wrinkle|||👔
Instant hair-drying|||💨
A fridge that restocks itself|||🧊
Silent mosquitoes|||🦟
Download skills straight to your brain|||🧠
A remote that can't get lost|||📺
Rain that only falls at night|||🌧️
A save point for real life|||💾
Time-travelling post|||📮
Shoes that never get dirty|||👟`), list('t-collect', 'Things to Collect', '🗃️', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Sneakers|||👟
Pokémon cards|||🃏
Football shirts|||👕
Vinyl records|||💿
Coins|||🪙
Stamps|||📮
Lego sets|||🧱
Funko Pops|||🧸
Watches|||⌚
Comic books|||📚
Retro video games|||🕹️
Action figures|||🦸
Fridge magnets|||🧲
Hot Wheels|||🏎️
Signed memorabilia|||✍️
Plushies|||🧸
Keychains|||🔑
Rocks and crystals|||💎
Film posters|||🎞️
Mugs|||☕
Stickers|||🏷️
Books|||📖
Art prints|||🖼️
Snow globes|||🔮
Trading pins|||📍`), list('t-overrated', 'Most Overrated Things', '🙄', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Brunch|||🥞
$7 coffee|||☕
New Year's Eve|||🎆
Black Friday deals|||🏷️
Influencer restaurants|||📸
Avocado toast|||🥑
Valentine's Day|||💘
Camping|||⛺
Fancy water|||💧
Pumpkin spice everything|||🎃
Queueing for a launch|||🧍
Selfie sticks|||🤳
Ice baths|||🧊
Rooftop bars|||🏙️
Gender reveal parties|||🎈
Giant logos on clothes|||👕
Sleeping 12 hours|||😴
Cruise ship buffets|||🛳️
Super-long films|||🎬
Hype sneakers you never wear|||👟
Airport lounges|||✈️
Smart fridges|||🧊
Escape rooms|||🔐
Cold showers|||🚿`), list('t-underrated', 'Most Underrated Things', '🌟', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Naps|||😴
Libraries|||📚
Public parks|||🌳
Walking|||🚶
Water|||💧
Leftovers|||🍱
Sunrises|||🌅
A really good pen|||🖊️
Board games|||🎲
Slow cookers|||🍲
Thank-you notes|||💌
Long phone calls|||📞
Local restaurants|||🍽️
Frozen grapes|||🍇
Sitting in silence|||🤫
Going to bed early|||🛏️
Rainy days|||🌧️
Grandparents' stories|||👴
Public transit|||🚌
Stretching|||🧘
Tea|||🍵
Fresh bread|||🍞
Old songs|||📻
Clean shoes|||👟
Saying no|||🙅`)];
}
function mkT(id, name, emoji, folder, slots, flags, text) {
  const photos = flags.includes('p'),
    sentence = flags.includes('s');
  const items = text.trim().split('\n').map((line, i) => {
    const [n, d, w, e, p] = line.split('|').map(x => (x || '').trim());
    const it = {
      id: id + '-' + i,
      name: n,
      pos: p || '',
      desc: d || '',
      emoji: e || '',
      photo: ''
    };
    if (w) it.wiki = w;else if (photos && sentence) it.wiki = n.charAt(0) + n.slice(1).toLowerCase();
    return it;
  });
  return {
    id,
    name,
    emoji,
    slots: parseSlots(slots),
    layout: 'list',
    art: 'emoji',
    folder,
    photos,
    items,
    v3: true
  };
}
function sportsTopicsV3() {
  const F = 'Sports';
  return [mkT('t-ucl', 'Champions League Legends', '🏆', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Cristiano Ronaldo|All-time top scorer, 5 wins
Lionel Messi|4 wins with Barcelona
Paolo Maldini|5 European Cups with Milan
Karim Benzema|5 wins with Real Madrid
Luka Modrić|6 wins with Real Madrid|Luka Modrić
Toni Kroos|6 wins (Bayern, Real Madrid)
Clarence Seedorf|Won with 3 different clubs
Alfredo Di Stéfano|5 straight European Cups
Raúl|Real Madrid legend|Raúl (footballer)
Iker Casillas|Real Madrid captain
Xavi|Barcelona midfield maestro|Xavi
Andrés Iniesta|4 wins with Barcelona
Steven Gerrard|Istanbul 2005
Zinedine Zidane|2002 final volley
Ronaldinho|2006 winner with Barcelona
Thierry Henry|2009 winner
Andriy Shevchenko|2003 winner with Milan
Filippo Inzaghi|Two-goal 2007 final
Kaká|2007 Ballon d'Or winner
Robert Lewandowski|Bayern goal machine
Thomas Müller|Bayern stalwart
Sergio Ramos|92:48 in Lisbon
Didier Drogba|2012 final hero
Frank Lampard|Chelsea 2012 winner
Ryan Giggs|Manchester United winger
Gerd Müller|Bayern 1970s
Johan Cruyff|Ajax three-peat
Franz Beckenbauer|Bayern captain
Kylian Mbappé|PSG and Real Madrid star
Mohamed Salah|Liverpool 2019 winner
Gianluigi Buffon|Juventus keeper
Manuel Neuer|Bayern keeper
Marcelo|Real Madrid left back|Marcelo (footballer, born 1988)
Gareth Bale|2018 final overhead kick
Vinícius Júnior|2022 and 2024 winner`), mkT('t-plclubs', 'Premier League Clubs (2025–26)', '🦁', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Arsenal|The Gunners|Arsenal F.C.
Aston Villa|The Villans|Aston Villa F.C.
Bournemouth|The Cherries|AFC Bournemouth
Brentford|The Bees|Brentford F.C.
Brighton & Hove Albion|The Seagulls|Brighton & Hove Albion F.C.
Burnley|The Clarets|Burnley F.C.
Chelsea|The Blues|Chelsea F.C.
Crystal Palace|The Eagles|Crystal Palace F.C.
Everton|The Toffees|Everton F.C.
Fulham|The Cottagers|Fulham F.C.
Leeds United|The Whites|Leeds United F.C.
Liverpool|The Reds|Liverpool F.C.
Manchester City|The Citizens|Manchester City F.C.
Manchester United|The Red Devils|Manchester United F.C.
Newcastle United|The Magpies|Newcastle United F.C.
Nottingham Forest|Two-time European champions|Nottingham Forest F.C.
Sunderland|The Black Cats|Sunderland A.F.C.
Tottenham Hotspur|Spurs|Tottenham Hotspur F.C.
West Ham United|The Hammers|West Ham United F.C.
Wolverhampton Wanderers|Wolves|Wolverhampton Wanderers F.C.`), mkT('t-intl', 'International Football Teams', '🌍', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Brazil|5 World Cups|Brazil national football team|🇧🇷
Argentina|3 World Cups|Argentina national football team|🇦🇷
France|2 World Cups|France national football team|🇫🇷
Germany|4 World Cups|Germany national football team|🇩🇪
Spain|2010 World Cup, 4 Euros|Spain national football team|🇪🇸
Italy|4 World Cups|Italy national football team|🇮🇹
England|1966 World Cup|England national football team|🏴󠁧󠁢󠁥󠁮󠁧󠁿
Portugal|Euro 2016 winners|Portugal national football team|🇵🇹
Netherlands|Total Football|Netherlands national football team|🇳🇱
Uruguay|2 World Cups|Uruguay national football team|🇺🇾
Belgium|Golden generation|Belgium national football team|🇧🇪
Croatia|2018 finalists|Croatia national football team|🇭🇷
Morocco|2022 semi-finalists|Morocco national football team|🇲🇦
Saudi Arabia|Beat Argentina in 2022|Saudi Arabia national football team|🇸🇦
Japan|Samurai Blue|Japan national football team|🇯🇵
South Korea|2002 semi-finalists|South Korea national football team|🇰🇷
USA|2026 co-hosts|United States men's national soccer team|🇺🇸
Mexico|El Tri|Mexico national football team|🇲🇽
Canada|2026 co-hosts|Canada men's national soccer team|🇨🇦
Nigeria|Super Eagles|Nigeria national football team|🇳🇬
Senegal|2022 AFCON winners|Senegal national football team|🇸🇳
Egypt|7 AFCON titles|Egypt national football team|🇪🇬
Colombia|Los Cafeteros|Colombia national football team|🇨🇴
Denmark|Euro 1992 winners|Denmark national football team|🇩🇰
Switzerland|Nati|Switzerland national football team|🇨🇭
Turkey|2002 third place|Turkey national football team|🇹🇷
Ghana|Black Stars|Ghana national football team|🇬🇭
Australia|Socceroos|Australia men's national soccer team|🇦🇺
Cameroon|Indomitable Lions|Cameroon national football team|🇨🇲
Algeria|2019 AFCON winners|Algeria national football team|🇩🇿`), mkT('t-mgr', 'Football Managers', '📋', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Pep Guardiola|Barcelona, Bayern, Man City
Alex Ferguson|26 years at Manchester United
Jürgen Klopp|Dortmund and Liverpool
José Mourinho|Porto, Chelsea, Inter, Real Madrid
Carlo Ancelotti|Record 5 Champions Leagues
Arsène Wenger|Arsenal's Invincibles
Zinedine Zidane|3 straight Champions Leagues
Diego Simeone|Atlético Madrid
Johan Cruyff|Barcelona Dream Team
Mikel Arteta|Arsenal
Luis Enrique|PSG and Barcelona treble winner|Luis Enrique (footballer, born 1970)
Hansi Flick|Bayern sextuple, Barcelona
Xabi Alonso|Unbeaten Leverkusen champions
Antonio Conte|Juventus, Chelsea, Inter, Napoli
Rafael Benítez|Istanbul 2005
Vicente del Bosque|World Cup and Euro with Spain
Didier Deschamps|2018 World Cup with France
Lionel Scaloni|2022 World Cup with Argentina
Marcelo Bielsa|El Loco
Mauricio Pochettino|Tottenham and Chelsea
Thomas Tuchel|Chelsea 2021 Champions League
Unai Emery|Europa League specialist
Ange Postecoglou|Celtic and Tottenham
Brian Clough|Two European Cups with Forest
Bob Paisley|Three European Cups with Liverpool
Arrigo Sacchi|AC Milan revolution
Jupp Heynckes|Bayern 2013 treble
Louis van Gaal|Ajax 1995
Gareth Southgate|Two Euro finals with England
Roberto Mancini|Euro 2020 with Italy`), mkT('t-stadia', 'Football Stadiums', '🏟️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Camp Nou|Barcelona
Santiago Bernabéu|Real Madrid|Santiago Bernabéu Stadium
Old Trafford|Manchester United
Anfield|Liverpool
Wembley|London|Wembley Stadium
Signal Iduna Park|Borussia Dortmund|Westfalenstadion
San Siro|Milan|San Siro
Allianz Arena|Bayern Munich
Maracanã|Rio de Janeiro|Maracanã Stadium
La Bombonera|Boca Juniors
Estadio Azteca|Mexico City
Emirates Stadium|Arsenal
Tottenham Hotspur Stadium|Spurs
Etihad Stadium|Manchester City|City of Manchester Stadium
Stamford Bridge|Chelsea|Stamford Bridge (stadium)
Celtic Park|Celtic
Parc des Princes|Paris Saint-Germain
Stade Vélodrome|Marseille|Stade Vélodrome
Metropolitano|Atlético Madrid|Metropolitano Stadium
Juventus Stadium|Juventus|Juventus Stadium
Johan Cruyff Arena|Ajax
Estádio da Luz|Benfica|Estádio da Luz
King Fahd International Stadium|Riyadh
Lusail Stadium|2022 World Cup final
St James' Park|Newcastle United
Goodison Park|Everton's old home
Rose Bowl|Pasadena
MetLife Stadium|2026 World Cup final
BC Place|Vancouver
Türk Telekom Stadium|Galatasaray|Rams Park`), mkT('t-kits', 'Iconic Football Kits', '👕', F, 'Kit 1, Kit 2, Kit 3, Kit 4', '', `
Brazil 1970 Home|Pelé's yellow||🇧🇷
Netherlands 1988 Home|Orange with the famous pattern||🇳🇱
Nigeria 2018 Home|Green zig-zag sell-out||🇳🇬
Germany 1990 Home|Tricolour stripes||🇩🇪
Argentina 1986 Home|Maradona's World Cup||🇦🇷
France 1998 Home|First World Cup win||🇫🇷
Italy 2006 Home|Azzurri world champions||🇮🇹
England 1996 Home|Euro 96||🏴󠁧󠁢󠁥󠁮󠁧󠁿
Arsenal 2003–04 Home|The Invincibles||🔴
Manchester United 1999 Home|Treble season||🔴
Barcelona 2008–09 Home|Sextuple squad||🔵
Real Madrid 2016–17 Home|Back-to-back champions||⚪
AC Milan 1988–89 Home|Sacchi's Milan||⚫
Liverpool 2005 Home|Istanbul night||🔴
Chelsea 2012 Home|Munich champions||🔵
Juventus 1996 Home|Del Piero era||⚫
Inter 2010 Home|Mourinho's treble||🔵
Mexico 1998 Goalkeeper|Jorge Campos' colours||🧤
Colombia 1990 Home|Valderrama style||🇨🇴
Denmark 1986 Home|Hummel halves||🇩🇰
Japan 1998 Home|Flame sleeves||🇯🇵
Cameroon 2002 Home|Sleeveless shirt||🇨🇲
Croatia 1998 Home|Checkerboard||🇭🇷
Saudi Arabia 1994 Home|First World Cup||🇸🇦
Borussia Dortmund 1997 Home|Champions League winners||🟡
Ajax 1995 Home|Young champions||⚪
Newcastle 1995–96 Home|Black and white stripes||⚫
Parma 1999 Home|Yellow and blue||🟡`), mkT('t-wonder', 'Football Wonderkids', '🌟', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Lamine Yamal|Barcelona, born 2007
Pau Cubarsí|Barcelona defender, born 2007
Gavi|Barcelona midfielder, born 2004|Gavi (footballer)
Désiré Doué|PSG, born 2005
Warren Zaïre-Emery|PSG, born 2006
João Neves|PSG midfielder, born 2004|João Neves (footballer, born 2004)
Endrick|Real Madrid, born 2006|Endrick (footballer)
Arda Güler|Real Madrid, born 2005
Franco Mastantuono|Real Madrid, born 2007
Estêvão|Chelsea, born 2007|Estêvão (footballer, born 2007)
Kobbie Mainoo|Manchester United, born 2005
Alejandro Garnacho|Born 2004
Ethan Nwaneri|Arsenal, born 2007
Myles Lewis-Skelly|Arsenal, born 2006
Archie Gray|Tottenham, born 2006
Lucas Bergvall|Tottenham, born 2006
Rico Lewis|Manchester City, born 2004
Kenan Yıldız|Juventus, born 2005
Nico Paz|Born 2004
Jobe Bellingham|Born 2005
Leny Yoro|Manchester United, born 2005
Jorrel Hato|Born 2006
Mathys Tel|Born 2005
Claudio Echeverri|Born 2006
Adam Wharton|Crystal Palace, born 2004
Ayyoub Bouaddi|Lille, born 2007`), mkT('t-wfoot', 'Women’s Football Stars', '⚽', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Aitana Bonmatí|Spain, Ballon d'Or winner
Alexia Putellas|Spain, Ballon d'Or winner
Sam Kerr|Australia striker
Marta|Brazil legend|Marta (footballer)
Alex Morgan|USA legend
Megan Rapinoe|USA legend
Ada Hegerberg|Norway, first women's Ballon d'Or
Lucy Bronze|England defender
Vivianne Miedema|Netherlands goalscorer
Lauren James|England forward|Lauren James (footballer)
Alessia Russo|England striker
Lauren Hemp|England winger
Chloe Kelly|Euro 2022 winner
Leah Williamson|England captain
Mary Earps|England goalkeeper
Beth Mead|England forward
Trinity Rodman|USA forward
Sophia Smith|USA forward|Sophia Smith (soccer)
Mallory Swanson|USA forward
Caroline Graham Hansen|Norway winger
Wendie Renard|France captain
Kadidiatou Diani|France forward
Salma Paralluelo|Spain forward
Khadija Shaw|Jamaica striker
Christine Sinclair|Canada, all-time top scorer
Pernille Harder|Denmark forward
Ewa Pajor|Poland striker
Linda Caicedo|Colombia forward
Hinata Miyazawa|Japan midfielder
Alexandra Popp|Germany captain`), mkT('t-nbagreat', 'Greatest NBA Teams Ever', '🏀', F, 'Team 1, Team 2, Team 3, Team 4', 'p', `
1995–96 Chicago Bulls|72–10, Jordan & Pippen|1995–96 Chicago Bulls season
2016–17 Golden State Warriors|Durant joins the Splash Brothers|2016–17 Golden State Warriors season
1985–86 Boston Celtics|Bird's best team|1985–86 Boston Celtics season
1986–87 Los Angeles Lakers|Showtime|1986–87 Los Angeles Lakers season
1971–72 Los Angeles Lakers|33-game win streak|1971–72 Los Angeles Lakers season
1966–67 Philadelphia 76ers|Wilt Chamberlain|1966–67 Philadelphia 76ers season
1982–83 Philadelphia 76ers|Fo', Fo', Fo'|1982–83 Philadelphia 76ers season
2000–01 Los Angeles Lakers|Shaq & Kobe, 15–1 playoffs|2000–01 Los Angeles Lakers season
1991–92 Chicago Bulls|67 wins|1991–92 Chicago Bulls season
1996–97 Chicago Bulls|69 wins|1996–97 Chicago Bulls season
2012–13 Miami Heat|27-game streak|2012–13 Miami Heat season
2013–14 San Antonio Spurs|Beautiful game|2013–14 San Antonio Spurs season
2007–08 Boston Celtics|Big Three|2007–08 Boston Celtics season
2015–16 Golden State Warriors|73–9|2015–16 Golden State Warriors season
2015–16 Cleveland Cavaliers|Came back from 3–1|2015–16 Cleveland Cavaliers season
1988–89 Detroit Pistons|Bad Boys|1988–89 Detroit Pistons season
2003–04 Detroit Pistons|Team over stars|2003–04 Detroit Pistons season
1969–70 New York Knicks|Willis Reed game|1969–70 New York Knicks season
1976–77 Portland Trail Blazers|Bill Walton|1976–77 Portland Trail Blazers season
1993–94 Houston Rockets|Hakeem's title|1993–94 Houston Rockets season
2010–11 Dallas Mavericks|Dirk beats the Heat|2010–11 Dallas Mavericks season
2018–19 Toronto Raptors|Kawhi and The Shot|2018–19 Toronto Raptors season
2020–21 Milwaukee Bucks|Giannis's 50 in Game 6|2020–21 Milwaukee Bucks season
2022–23 Denver Nuggets|Jokić's first title|2022–23 Denver Nuggets season
2023–24 Boston Celtics|Banner 18|2023–24 Boston Celtics season
2024–25 Oklahoma City Thunder|SGA's champions|2024–25 Oklahoma City Thunder season
1964–65 Boston Celtics|Bill Russell dynasty|1964–65 Boston Celtics season
2016–17 Cleveland Cavaliers|LeBron and Kyrie|2016–17 Cleveland Cavaliers season`), mkT('t-nbateams', 'NBA Teams', '🏀', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Atlanta Hawks|East
Boston Celtics|East · 18 titles
Brooklyn Nets|East
Charlotte Hornets|East
Chicago Bulls|East · 6 titles
Cleveland Cavaliers|East
Detroit Pistons|East
Indiana Pacers|East
Miami Heat|East
Milwaukee Bucks|East
New York Knicks|East
Orlando Magic|East
Philadelphia 76ers|East
Toronto Raptors|East · 2019 champions
Washington Wizards|East
Dallas Mavericks|West
Denver Nuggets|West
Golden State Warriors|West
Houston Rockets|West
Los Angeles Clippers|West
Los Angeles Lakers|West · 17 titles
Memphis Grizzlies|West
Minnesota Timberwolves|West
New Orleans Pelicans|West
Oklahoma City Thunder|West · 2025 champions
Phoenix Suns|West
Portland Trail Blazers|West
Sacramento Kings|West
San Antonio Spurs|West
Utah Jazz|West`), mkT('t-oly', 'Olympic Athletes', '🥇', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Usain Bolt|Jamaica, sprint
Michael Phelps|USA, swimming · 23 golds
Simone Biles|USA, gymnastics
Carl Lewis|USA, sprint and long jump
Jesse Owens|USA, Berlin 1936
Nadia Comăneci|Romania, first perfect 10
Katie Ledecky|USA, distance swimming
Eliud Kipchoge|Kenya, marathon
Mo Farah|Great Britain, distance running
Allyson Felix|USA, sprint
Florence Griffith Joyner|USA, sprint
Armand Duplantis|Sweden, pole vault
Sydney McLaughlin-Levrone|USA, 400m hurdles
Faith Kipyegon|Kenya, middle distance
Shelly-Ann Fraser-Pryce|Jamaica, sprint
Larisa Latynina|Soviet gymnast
Paavo Nurmi|Finland, distance running
Mark Spitz|USA, swimming
Ian Thorpe|Australia, swimming
Léon Marchand|France, swimming
Caeleb Dressel|USA, swimming
Jessica Ennis-Hill|Great Britain, heptathlon
Chris Hoy|Great Britain, cycling
Kelly Holmes|Great Britain, middle distance
Noah Lyles|USA, sprint
Sifan Hassan|Netherlands, distance running
Rebeca Andrade|Brazil, gymnastics
Shaun White|USA, snowboarding
Marit Bjørgen|Norway, cross-country skiing
Steve Redgrave|Great Britain, rowing
Greg Louganis|USA, diving
Daley Thompson|Great Britain, decathlon`), mkT('t-wwe', 'WWE Superstars', '🤼', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
The Rock|The People's Champ|Dwayne Johnson
John Cena|You can't see me
Stone Cold Steve Austin|Austin 3:16
The Undertaker|The Deadman
Hulk Hogan|Hulkamania
Randy Orton|The Viper
Triple H|The Game
Shawn Michaels|Mr. WrestleMania
Roman Reigns|The Tribal Chief
Rey Mysterio|619
Brock Lesnar|The Beast Incarnate
CM Punk|Best in the World
Cody Rhodes|The American Nightmare
Seth Rollins|The Visionary
Becky Lynch|The Man
Charlotte Flair|The Queen
Rhea Ripley|Mami
Bianca Belair|The EST
Ric Flair|The Nature Boy
Randy Savage|Macho Man
André the Giant|The Eighth Wonder of the World
Bret Hart|The Hitman
Edge|The Rated-R Superstar|Edge (wrestler)
Kane|The Big Red Machine|Kane (wrestler)
Batista|The Animal|Dave Bautista
Kurt Angle|Olympic gold medallist
Eddie Guerrero|Lie, cheat, steal
Gunther|The Ring General|Gunther (wrestler)
Kofi Kingston|New Day
Trish Stratus|Seven-time women's champion
Drew McIntyre|The Scottish Warrior
Logan Paul|The Maverick`), mkT('t-golf', 'Golfers', '⛳', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Tiger Woods|15 majors
Jack Nicklaus|18 majors
Arnold Palmer|The King
Rory McIlroy|Northern Ireland
Scottie Scheffler|USA
Phil Mickelson|Lefty
Gary Player|South Africa
Seve Ballesteros|Spain
Jon Rahm|Spain
Brooks Koepka|USA
Dustin Johnson|USA
Jordan Spieth|USA
Bryson DeChambeau|USA
Xander Schauffele|USA
Justin Rose|England
Ben Hogan|USA
Sam Snead|USA
Bobby Jones|Grand Slam 1930|Bobby Jones (golfer)
Nick Faldo|England
Ernie Els|South Africa
Vijay Singh|Fiji
Annika Sörenstam|Sweden
Nelly Korda|USA
Lydia Ko|New Zealand
Collin Morikawa|USA
Tommy Fleetwood|England
Ludvig Åberg|Sweden
Hideki Matsuyama|Japan
Shane Lowry|Ireland
Tom Watson|USA|Tom Watson (golfer)`), mkT('t-mlb', 'MLB Players', '⚾', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Shohei Ohtani|Pitcher and hitter
Aaron Judge|Outfielder
Mookie Betts|Infielder/outfielder
Juan Soto|Outfielder
Freddie Freeman|First baseman
Bryce Harper|First baseman
Mike Trout|Outfielder
Ronald Acuña Jr.|Outfielder
Vladimir Guerrero Jr.|First baseman
Bobby Witt Jr.|Shortstop
Gunnar Henderson|Shortstop
Corey Seager|Shortstop
Fernando Tatís Jr.|Outfielder
Yoshinobu Yamamoto|Pitcher
Paul Skenes|Pitcher
Tarik Skubal|Pitcher
Gerrit Cole|Pitcher
Zack Wheeler|Pitcher
Jacob deGrom|Pitcher
Julio Rodríguez|Outfielder|Julio Rodríguez (baseball)
Francisco Lindor|Shortstop
José Ramírez|Third baseman|José Ramírez (infielder)
Pete Alonso|First baseman
Cal Raleigh|Catcher
Kyle Schwarber|Designated hitter
Elly De La Cruz|Shortstop
Corbin Carroll|Outfielder
Manny Machado|Third baseman
Rafael Devers|Infielder
Yordan Alvarez|Designated hitter
José Altuve|Second baseman
Adley Rutschman|Catcher`), mkT('t-mlbl', 'MLB Legends', '⚾', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Babe Ruth|The Sultan of Swat
Jackie Robinson|Broke the colour barrier
Hank Aaron|755 home runs
Willie Mays|The Say Hey Kid
Mickey Mantle|Yankees
Lou Gehrig|The Iron Horse
Ted Williams|Last .400 hitter
Joe DiMaggio|56-game hit streak
Ty Cobb|Tigers
Roberto Clemente|Pirates
Derek Jeter|Yankees captain
Ken Griffey Jr.|The Kid
Barry Bonds|762 home runs
Cal Ripken Jr.|2,632 straight games
Nolan Ryan|5,714 strikeouts
Sandy Koufax|Dodgers
Randy Johnson|The Big Unit
Pedro Martínez|Red Sox
Mariano Rivera|Unanimous Hall of Famer
Greg Maddux|Braves
Stan Musial|Cardinals
Rickey Henderson|Stolen base king
Ichiro Suzuki|Mariners
David Ortiz|Big Papi
Albert Pujols|Cardinals
Johnny Bench|Reds catcher
Yogi Berra|Yankees catcher
Tony Gwynn|Mr. Padre
Cy Young|511 wins
Walter Johnson|The Big Train
Honus Wagner|Pirates
Chipper Jones|Braves`), mkT('t-rugby', 'Rugby Players', '🏉', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Jonah Lomu|New Zealand
Richie McCaw|New Zealand
Dan Carter|New Zealand
Jonny Wilkinson|England
Brian O'Driscoll|Ireland
Antoine Dupont|France
Siya Kolisi|South Africa
Johnny Sexton|Ireland
Martin Johnson|England|Martin Johnson (rugby union)
Gareth Edwards|Wales|Gareth Edwards (rugby union)
Shane Williams|Wales
Beauden Barrett|New Zealand
Cheslin Kolbe|South Africa
Eben Etzebeth|South Africa
Maro Itoje|England
Alun Wyn Jones|Wales
Bryan Habana|South Africa
David Pocock|Australia
George Gregan|Australia
Sergio Parisse|Italy
Owen Farrell|England
Ardie Savea|New Zealand
Handré Pollard|South Africa
Pieter-Steph du Toit|South Africa
Finn Russell|Scotland
Faf de Klerk|South Africa
Michael Hooper|Australia
Jason Robinson|England|Jason Robinson (rugby)`), mkT('t-moments', 'Greatest Sports Moments', '🎬', F, 'Pick 1, Pick 2, Pick 3, Pick 4', '', `
Miracle on Ice|USA beat the USSR, 1980||🏒
Hand of God and Goal of the Century|Maradona v England, 1986||⚽
Rumble in the Jungle|Ali beats Foreman, 1974||🥊
Bolt runs 9.58|Berlin, 2009||⚡
Agüero 93:20|Man City win the league, 2012||⚽
Istanbul comeback|Liverpool from 3–0 down, 2005||🏆
Leicester City win the Premier League|5000–1 shot, 2016||🦊
Jordan's Flu Game|1997 Finals||🏀
Comăneci's perfect 10|Montreal, 1976||🤸
Bannister's four-minute mile|Oxford, 1954||🏃
Jesse Owens wins four golds|Berlin, 1936||🥇
Phelps wins eight golds|Beijing, 2008||🏊
Messi lifts the World Cup|Qatar, 2022||🏆
Cavaliers come back from 3–1|2016 Finals||🏀
Red Sox reverse the curse|2004||⚾
The Helmet Catch|Super Bowl XLII, 2008||🏈
Brady's 28–3 comeback|Super Bowl LI, 2017||🏈
Tiger wins the 2019 Masters|Comeback major||⛳
Federer v Nadal at Wimbledon|2008 final||🎾
Man United's injury-time treble|1999 Champions League final||⚽
Barcelona 6–1 PSG|La Remontada, 2017||⚽
Germany 7–1 Brazil|2014 World Cup semi-final||⚽
Kobe scores 81|2006||🏀
Ray Allen's corner three|2013 Finals||🏀
Bob Beamon's long jump|Mexico City, 1968||🦘
Kerri Strug's vault|Atlanta, 1996||🤸
Saudi Arabia beat Argentina|2022 World Cup||⚽
Raptors win the title|2019||🏀
Kawhi's buzzer-beater bounce|2019 playoffs||🏀`), mkT('t-goals', 'Greatest Football Goals', '🥅', F, 'Goal 1, Goal 2, Goal 3, Goal 4', '', `
Maradona v England|1986 World Cup solo run||⚽
Zidane volley|2002 Champions League final||⚽
Van Basten volley|Euro 88 final||⚽
Ibrahimović bicycle kick v England|2012 friendly||⚽
Rooney overhead kick v Man City|2011 derby||⚽
Roberto Carlos free kick v France|1997||⚽
Bergkamp turn v Newcastle|2002||⚽
Messi solo goal v Getafe|2007||⚽
Ronaldo bicycle kick v Juventus|2018||⚽
Bale overhead kick|2018 Champions League final||⚽
Gerrard's FA Cup final equaliser|2006 v West Ham||⚽
Henry volley v Man United|2000||⚽
Papiss Cissé v Chelsea|2012||⚽
Yeboah v Liverpool|1995||⚽
Giggs solo goal v Arsenal|1999 FA Cup semi-final||⚽
James Rodríguez volley v Uruguay|2014 World Cup||⚽
Van Persie header v Spain|2014 World Cup||⚽
Pavard half-volley v Argentina|2018 World Cup||⚽
Bergkamp v Argentina|1998 World Cup||⚽
Al-Owairan solo goal v Belgium|1994 World Cup||⚽
Cambiasso 24-pass goal|2006 World Cup||⚽
Lamela rabona v Arsenal|2021||⚽
Garnacho overhead kick v Everton|2023||⚽
Agüero v QPR|2012 title winner||⚽
Iniesta's World Cup winner|2010 final||⚽
Messi chip v Bayern|2015 semi-final||⚽
Ronaldo free kick v Spain|2018 World Cup||⚽`), mkT('t-rivals', 'Football Rivalries', '⚔️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', '', `
El Clásico|Real Madrid v Barcelona||🇪🇸
North West Derby|Liverpool v Manchester United||🔴
Manchester Derby|City v United||🔵
North London Derby|Arsenal v Tottenham||⚪
Merseyside Derby|Liverpool v Everton||🔵
Old Firm|Celtic v Rangers||🍀
Derby della Madonnina|Inter v AC Milan||⚫
Derby della Capitale|Roma v Lazio||🟡
Derby d'Italia|Inter v Juventus||⚫
Der Klassiker|Bayern v Dortmund||🟡
Revierderby|Dortmund v Schalke||🟡
Le Classique|PSG v Marseille||🔵
Superclásico|Boca Juniors v River Plate||🇦🇷
Intercontinental Derby|Fenerbahçe v Galatasaray||🇹🇷
Madrid Derby|Real v Atlético||⚪
De Klassieker|Ajax v Feyenoord||🇳🇱
Eternal Derby|Red Star v Partizan||🔴
Cairo Derby|Al Ahly v Zamalek||🇪🇬
Riyadh Derby|Al Hilal v Al Nassr||🇸🇦
Tyne–Wear Derby|Newcastle v Sunderland||⚫
Seville Derby|Sevilla v Real Betis||🟢
Lisbon Derby|Benfica v Sporting||🦅
O Clássico|Benfica v Porto||🐉
Argentina v Brazil|South American classic||🌎
England v Germany|Penalties and heartbreak||🏴󠁧󠁢󠁥󠁮󠁧󠁿
Netherlands v Germany|Neighbours at war||🟠
USA v Mexico|Dos a Cero||🌎`)];
}
function styleTopicsV3() {
  const F = 'Style & Rides';
  return [mkT('t-luxcars', 'Luxury Cars', '🚘', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Rolls-Royce Phantom|Ultimate limousine
Rolls-Royce Cullinan|Luxury SUV
Rolls-Royce Ghost|Sleek Rolls
Rolls-Royce Spectre|Electric Rolls
Bentley Continental GT|Grand tourer
Bentley Bentayga|Luxury SUV
Mercedes-Benz S-Class|Flagship saloon
Mercedes-Maybach S-Class|Extra luxury|Mercedes-Maybach
Mercedes-Benz G-Class|The G-Wagon
BMW 7 Series|Flagship saloon
Audi A8|Flagship saloon
Lexus LS|Japanese luxury
Porsche Panamera|Sports saloon
Range Rover|British luxury SUV|Range Rover (L460)
Aston Martin DB12|Grand tourer
Genesis G90|Korean flagship
Cadillac Escalade|Big American SUV
Lincoln Navigator|American luxury SUV
Maserati Quattroporte|Italian saloon
BMW 8 Series|Grand tourer|BMW 8 Series (G15)
Lamborghini Urus|Super SUV
Ferrari Purosangue|Ferrari's four-door
Lucid Air|Electric luxury
Porsche 911|Everyday supercar
Mercedes-AMG GT|Sports car`), mkT('t-supercars', 'Supercars', '🏎️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Ferrari SF90 Stradale|Hybrid Ferrari
Ferrari 296 GTB|V6 hybrid
Ferrari F8 Tributo|Mid-engine V8
Ferrari 812 Superfast|V12
Lamborghini Huracán|V10
Lamborghini Aventador|V12
Lamborghini Revuelto|V12 hybrid
Lamborghini Countach|Wedge icon
McLaren 720S|British supercar
McLaren 750S|Track-ready
McLaren Artura|Hybrid McLaren
Porsche 911 GT3 RS|Track weapon|Porsche 911 GT3
Audi R8|V10
Mercedes-AMG GT Black Series|Track monster|Mercedes-AMG GT
Chevrolet Corvette C8|Mid-engine Vette|Chevrolet Corvette (C8)
Ford GT|Le Mans legend|Ford GT
Nissan GT-R|Godzilla
Acura NSX|Japanese supercar|Honda NSX
Aston Martin Vantage|British sports car|Aston Martin Vantage (2018)
Maserati MC20|Italian supercar
Lexus LFA|V10 masterpiece
Ferrari F40|1987 icon
Ferrari Enzo|Named after the founder|Enzo Ferrari (automobile)
McLaren F1|1990s record breaker
Dodge Viper|American V10`), mkT('t-hypercars', 'Hypercars', '🚀', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Bugatti Chiron|1,500 hp
Bugatti Veyron|First 1,000 hp road car
Bugatti Tourbillon|V16 hybrid
Bugatti Divo|Track-focused Bugatti
Bugatti Bolide|Track-only
Koenigsegg Jesko|Swedish rocket
Koenigsegg Agera RS|Former speed record
Koenigsegg Regera|Direct drive
Pagani Huayra|Italian art
Pagani Zonda|Legendary V12
Pagani Utopia|Manual hypercar
Rimac Nevera|Electric hypercar
McLaren P1|Hybrid holy trinity
McLaren Senna|Track focus
McLaren Speedtail|Three seats
LaFerrari|Hybrid holy trinity
Ferrari F80|Ferrari's newest flagship
Porsche 918 Spyder|Hybrid holy trinity
Aston Martin Valkyrie|F1-inspired
Mercedes-AMG One|F1 engine for the road
Hennessey Venom F5|American speed
SSC Tuatara|Speed record attempt
Lotus Evija|Electric hypercar
Gordon Murray T.50|Fan car|Gordon Murray Automotive T.50
Lamborghini Sián|Hybrid Lamborghini|Lamborghini Sián FKP 37`), mkT('t-jdm', 'JDM Cars', '🇯🇵', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Toyota Supra MK4|A80 legend|Toyota Supra
Nissan Skyline GT-R R34|Godzilla's ancestor|Nissan Skyline GT-R
Nissan GT-R R35|Modern Godzilla|Nissan GT-R
Mazda RX-7 FD|Rotary icon|Mazda RX-7
Honda NSX|Senna-tuned|Honda NSX
Honda Civic Type R|Hot hatch|Honda Civic Type R
Mitsubishi Lancer Evolution|Evo|Mitsubishi Lancer Evolution
Subaru Impreza WRX STI|Rally legend|Subaru Impreza WRX STI
Toyota AE86|Drift hero|Toyota AE86
Nissan Silvia S15|Drift favourite|Nissan Silvia
Honda S2000|9,000 rpm roadster
Mazda MX-5 Miata|Best-selling roadster|Mazda MX-5
Nissan 350Z|Affordable Z
Toyota GR86|Light and fun|Toyota GR86
Lexus LFA|V10 supercar
Toyota Land Cruiser|Unbreakable|Toyota Land Cruiser
Mazda RX-8|Rotary with suicide doors
Toyota Celica GT-Four|Rally homologation|Toyota Celica GT-Four
Mitsubishi 3000GT|Tech-heavy GT
Honda Integra Type R|Front-wheel legend|Honda Integra Type R
Toyota MR2|Mid-engine fun
Nissan 300ZX|Twin turbo Z
Toyota GR Yaris|Rally hatch
Suzuki Jimny|Tiny off-roader
Datsun 240Z|The original Z|Nissan S30`), mkT('t-classics', 'Classic Cars', '🚗', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Ford Mustang (1964)|Pony car|Ford Mustang (first generation)
Chevrolet Corvette Sting Ray (1963)|C2 split window|Chevrolet Corvette (C2)
Volkswagen Beetle|People's car
Mini|Original Mini|Mini
Jaguar E-Type|Most beautiful car
Ferrari 250 GTO|Priceless
Shelby Cobra|AC Cobra|AC Cobra
Aston Martin DB5|James Bond
Chevrolet Camaro (1969)|Muscle car|Chevrolet Camaro (first generation)
Dodge Charger (1969)|Muscle car|Dodge Charger (1968)
Mercedes-Benz 300 SL|Gullwing
Lamborghini Miura|First supercar
DeLorean DMC-12|Back to the Future
Chevrolet Bel Air (1957)|Tailfins|Chevrolet Bel Air
Cadillac Eldorado|American luxury
Ford Model T|Car for everyone
Ford GT40|Le Mans winner
Pontiac GTO|First muscle car
Plymouth Barracuda|Muscle car
Citroën DS|French icon
Fiat 500 (1957)|Little Italian|Fiat 500 (1957)
Land Rover Series|Off-road original|Land Rover Series
Toyota 2000GT|Japan's first supercar
BMW 2002|Sporty saloon|BMW 02 Series
Volkswagen Type 2|The VW bus
Porsche 356|First Porsche`), mkT('t-evs', 'Electric Cars', '⚡', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Tesla Model S|Electric saloon
Tesla Model 3|Best-selling EV
Tesla Model X|Falcon doors
Tesla Model Y|Electric SUV
Tesla Cybertruck|Stainless steel
Rivian R1T|Adventure truck
Rivian R1S|Adventure SUV
Lucid Air|Long range
Porsche Taycan|Electric Porsche
Audi e-tron GT|Electric GT
BMW i4|Electric gran coupé
BMW iX|Electric SUV
Mercedes-Benz EQS|Electric S-Class
Hyundai Ioniq 5|Retro hatch|Hyundai Ioniq 5
Hyundai Ioniq 6|Streamliner|Hyundai Ioniq 6
Kia EV6|Sporty crossover
Kia EV9|Three-row SUV
Ford Mustang Mach-E|Electric Mustang SUV
Ford F-150 Lightning|Electric pickup
Chevrolet Bolt|Affordable EV|Chevrolet Bolt EV
Nissan Leaf|EV pioneer
Polestar 2|Swedish EV
Volkswagen ID.4|Electric SUV
BYD Seal|Chinese saloon
Xiaomi SU7|Phone maker's car
Rimac Nevera|Electric hypercar`), mkT('t-suvs', 'SUVs', '🚙', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Range Rover|British luxury|Range Rover (L460)
Mercedes-Benz G-Class|G-Wagon
Toyota Land Cruiser|Go anywhere
Nissan Patrol|Desert favourite|Nissan Patrol
Lexus LX|Luxury Land Cruiser
Jeep Wrangler|Doors off
Jeep Grand Cherokee|American classic
Toyota RAV4|Best seller
Honda CR-V|Practical
Ford Bronco|Back from the 90s|Ford Bronco (sixth generation)
Ford Explorer|Family SUV
Chevrolet Tahoe|Full size
GMC Yukon|Full size
Cadillac Escalade|Bling
Lamborghini Urus|Super SUV
Porsche Cayenne|Sporty SUV
BMW X5|Luxury SUV
Audi Q7|Three-row luxury
Tesla Model Y|Electric
Toyota 4Runner|Rugged
Kia Telluride|Family favourite
Hyundai Palisade|Family favourite
Rolls-Royce Cullinan|Ultimate luxury
Bentley Bentayga|Luxury
Land Rover Defender|Reborn icon|Land Rover Defender (L663)
Volvo XC90|Safe and stylish`), mkT('t-pickups', 'Pickup Trucks', '🛻', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Ford F-150|Best-selling truck
Ford F-150 Raptor|Desert runner|Ford F-150 Raptor
Ram 1500|Smooth ride
Ram 1500 TRX|Supercharged|Ram 1500 TRX
Chevrolet Silverado|Workhorse
GMC Sierra|Premium truck
Toyota Tacoma|Midsize favourite
Toyota Tundra|Full size
Toyota Hilux|Indestructible
Nissan Frontier|Midsize|Nissan Navara
Ford Ranger|Midsize
Jeep Gladiator|Wrangler truck
Honda Ridgeline|Unibody truck
Tesla Cybertruck|Stainless steel
Rivian R1T|Electric
Ford F-150 Lightning|Electric
Chevrolet Colorado|Midsize
GMC Canyon|Midsize
GMC Hummer EV|Electric supertruck
Ford Maverick|Compact hybrid
Hyundai Santa Cruz|Sport adventure vehicle
Isuzu D-Max|Global workhorse
Mitsubishi Triton|L200|Mitsubishi Triton
Volkswagen Amarok|Midsize
Ford Super Duty|Heavy duty`), mkT('t-motorbikes', 'Motorcycles', '🏍️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Harley-Davidson Fat Boy|American cruiser|Harley-Davidson Softail
Ducati Panigale V4|Italian superbike|Ducati Panigale V4
Yamaha YZF-R1|Superbike
Kawasaki Ninja H2|Supercharged|Kawasaki Ninja H2
Honda CBR1000RR Fireblade|Superbike|Honda CBR1000RR
BMW S1000RR|Superbike|BMW S1000RR
Suzuki Hayabusa|Speed icon
Triumph Bonneville|British classic
Indian Scout|American cruiser|Indian Scout (motorcycle)
Royal Enfield Classic 350|Retro classic|Royal Enfield Classic
Honda Gold Wing|Touring king
KTM 1290 Super Duke R|The Beast|KTM 1290 Super Duke R
Aprilia RSV4|Superbike
MV Agusta F4|Italian beauty
Ducati Monster|Naked bike
Kawasaki Z900|Naked bike
Yamaha MT-09|Naked bike
BMW R 1250 GS|Adventure bike|BMW R1250GS
Harley-Davidson Sportster|Classic|Harley-Davidson Sportster
Vespa|Italian scooter
Honda Africa Twin|Adventure|Honda Africa Twin
Triumph Speed Triple|Naked bike
Ducati Scrambler|Retro|Ducati Scrambler
Honda CB750|First superbike
Suzuki GSX-R1000|Gixxer|Suzuki GSX-R1000`), mkT('t-carbrands', 'Car Brands', '🔰', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Toyota|Japan
Honda|Japan
Ford|USA|Ford Motor Company
Chevrolet|USA
BMW|Germany
Mercedes-Benz|Germany
Audi|Germany
Volkswagen|Germany
Porsche|Germany
Ferrari|Italy
Lamborghini|Italy
McLaren|UK|McLaren Automotive
Bugatti|France
Rolls-Royce|UK|Rolls-Royce Motor Cars
Bentley|UK
Aston Martin|UK
Tesla|USA|Tesla, Inc.
Nissan|Japan
Hyundai|South Korea|Hyundai Motor Company
Kia|South Korea
Lexus|Japan
Jeep|USA
Land Rover|UK
Jaguar|UK|Jaguar Cars
Mazda|Japan
Subaru|Japan
Volvo|Sweden|Volvo Cars
Cadillac|USA
Dodge|USA
Maserati|Italy
Genesis|South Korea|Genesis Motor
BYD|China|BYD Auto
Rivian|USA
Koenigsegg|Sweden`), mkT('t-luxbrands', 'Luxury Fashion Brands', '👜', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Louis Vuitton|Paris
Gucci|Florence
Chanel|Paris
Hermès|Paris
Prada|Milan
Dior|Paris
Balenciaga|Paris
Versace|Milan
Burberry|London
Saint Laurent|Paris|Yves Saint Laurent (brand)
Fendi|Rome
Givenchy|Paris
Valentino|Rome|Valentino (fashion house)
Bottega Veneta|Italy
Dolce & Gabbana|Milan
Celine|Paris|Celine (brand)
Loewe|Madrid
Moncler|Puffer jackets
Tom Ford|American luxury|Tom Ford (brand)
Ralph Lauren|American classic|Ralph Lauren Corporation
Off-White|Virgil Abloh|Off-White (company)
Alexander McQueen|London
Giorgio Armani|Milan|Armani
Miu Miu|Prada's sister brand
Balmain|Paris
Loro Piana|Quiet luxury
Brunello Cucinelli|Cashmere
Coach|New York|Tapestry, Inc.
Michael Kors|New York|Michael Kors (brand)`), mkT('t-streetwear', 'Streetwear Brands', '🧢', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Supreme|New York|Supreme (brand)
Stüssy|California
Palace|London|Palace Skateboards
BAPE|Tokyo|A Bathing Ape
Kith|New York|Kith (brand)
Fear of God|Essentials|Fear of God (brand)
Nike|Just Do It
Jordan Brand|Jumpman|Air Jordan
Adidas|Three stripes
Carhartt WIP|Workwear streetwear|Carhartt
The North Face|Outdoor icon
Stone Island|Compass badge
Corteiz|London|Corteiz
Trapstar|London|Trapstar
Represent|Manchester|Represent (clothing)
Palm Angels|Milan
Rhude|Los Angeles|Rhude
Aimé Leon Dore|New York|Aimé Leon Dore
Chrome Hearts|Silver and crosses
Gallery Dept.|Paint-splattered|Gallery Dept.
Billionaire Boys Club|Pharrell|Billionaire Boys Club (clothing retailer)
Vans|Off the Wall
Champion|Classic sportswear|Champion (sportswear)
New Balance|Dad shoes to grails
Puma|Big cat
Denim Tears|Cotton wreath|Denim Tears
Hellstar|Streetwear|Hellstar`), mkT('t-watches', 'Watch Brands', '⌚', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Rolex|Crown
Patek Philippe|Holy trinity
Audemars Piguet|Royal Oak
Vacheron Constantin|Holy trinity
Omega|Moonwatch|Omega SA
Cartier|Tank and Santos
Richard Mille|Tennis and F1
TAG Heuer|Monaco and Carrera
Breitling|Navitimer
IWC Schaffhausen|Pilot's watches
Jaeger-LeCoultre|Reverso
Hublot|Big Bang
Panerai|Italian divers
Tudor|Rolex's sister|Tudor (watch company)
Longines|Elegance
Seiko|Japan|Seiko
Grand Seiko|Japanese luxury
Casio G-Shock|Indestructible|G-Shock
Citizen|Eco-Drive|Citizen Watch
Tissot|Swiss value
Zenith|El Primero|Zenith (watchmaker)
A. Lange & Söhne|German luxury
Bulgari|Octo|Bulgari
Swatch|Fun Swiss
Apple Watch|Smartwatch
Garmin|Sports watches
Breguet|Since 1775|Breguet (brand)
Chopard|Happy Diamonds
Hamilton|American-Swiss|Hamilton Watch Company`), mkT('t-fragrance', 'Fragrances', '🧴', F, 'Pick 1, Pick 2, Pick 3, Pick 4', '', `
Dior Sauvage|Fresh and spicy||🧴
Bleu de Chanel|Woody and fresh||🧴
Chanel No. 5|Iconic floral||🌸
Creed Aventus|Pineapple and smoke||🍍
Acqua di Giò|Aquatic classic||🌊
YSL Y|Fresh and woody||🧴
Versace Eros|Mint and vanilla||🧴
Paco Rabanne 1 Million|Sweet and spicy||🪙
Tom Ford Oud Wood|Oud and wood||🪵
Tom Ford Tobacco Vanille|Warm and sweet||🍂
Baccarat Rouge 540|Amber and saffron||🧴
Le Labo Santal 33|Sandalwood||🪵
Jean Paul Gaultier Le Male|Sailor bottle||⚓
Dior J'adore|Floral||🌸
Lancôme La Vie Est Belle|Sweet iris||🌸
Carolina Herrera Good Girl|Stiletto bottle||👠
YSL Black Opium|Coffee and vanilla||☕
Armani Code|Warm and elegant||🧴
Valentino Born in Roma|Studded bottle||🧴
Prada Luna Rossa|Fresh and sporty||⛵
Hugo Boss Bottled|Office classic||🧴
Parfums de Marly Layton|Apple and vanilla||🍎
Initio Oud for Greatness|Oud||🪵
Kilian Angels' Share|Cognac and cinnamon||🥃
Xerjoff Naxos|Honey and tobacco||🍯
Lattafa Khamrah|Dates and spice||🌴
Armaf Club de Nuit Intense Man|Smoky citrus||🧴
Rasasi Hawas|Fresh aquatic||🌊
Arabian Oud Kalemat|Amber and oud||🪵
Swiss Arabian Shaghaf Oud|Rose and oud||🌹`), mkT('t-hairstyles', 'Men’s Hairstyles', '💈', F, 'Pick 1, Pick 2, Pick 3, Pick 4', '', `
Buzz Cut|Short all over||💈
Crew Cut|Classic short||💈
Skin Fade|Down to the skin||💈
Taper Fade|Subtle fade||💈
Burst Fade|Around the ear||💈
Undercut|Short sides, long top||💈
Quiff|Volume up front||💈
Pompadour|Swept up and back||💈
Slick Back|Combed back||💈
Side Part|Smart classic||💈
French Crop|Short fringe||💈
Caesar Cut|Short and forward||💈
Textured Fringe|Messy front||💈
Modern Mullet|Business in front||💈
Man Bun|Tied up||💈
Cornrows|Braided close to the head||💈
Box Braids|Square-parted braids||💈
Dreadlocks|Locs||💈
Twists|Two-strand twists||💈
Afro|Natural volume||💈
360 Waves|Brushed waves||🌊
Mohawk|Strip down the middle||💈
Faux Hawk|Subtle mohawk||💈
Curtains|Middle part||💈
Ivy League|Grown-out crew cut||💈
Flow|Long and swept back||💈
Shaved Head|Clean||💈
Edgar Cut|Straight fringe and fade||💈
Line-up|Sharp edges||✂️
Hair Design|Shaved pattern||✂️`), mkT('t-bballshoes', 'Basketball Sneakers', '🏀', F, 'Pair 1, Pair 2, Pair 3, Pair 4', 'p', `
Air Jordan 1|1985 original
Air Jordan 3|Elephant print|Air Jordan III
Air Jordan 4|Classic silhouette|Air Jordan IV
Air Jordan 11|Patent leather|Air Jordan XI
Air Jordan 12|Flu Game|Air Jordan XII
Air Jordan 13|Panther-inspired|Air Jordan XIII
Nike LeBron|LeBron's signature line|Nike LeBron
Nike Kobe 6|Grinch|Nike Kobe
Nike KD|Kevin Durant's line|Nike KD
Nike Air Force 1|Started on the court
Nike Air Foamposite One|Penny's bubble shoe|Nike Air Foamposite
Reebok Question|Allen Iverson|Reebok Question
Reebok Shaq Attaq|Shaq's signature
Adidas Harden|James Harden's line
Adidas D Rose 1|Derrick Rose|Adidas D Rose
Curry Brand|Stephen Curry's line|Under Armour Curry
Nike Kyrie|Kyrie Irving's line
Puma MB.01|LaMelo Ball|Puma MB.01
Converse Chuck Taylor All-Star|The original basketball shoe|Chuck Taylor All-Stars
Nike Air More Uptempo|Big AIR letters
Nike Zoom Freak|Giannis|Nike Zoom Freak
Nike Ja 1|Ja Morant
Anta KT|Klay Thompson|Anta Sports
Adidas AE 1|Anthony Edwards
Nike Sabrina 1|Sabrina Ionescu
Nike Air Penny|Penny Hardaway|Nike Air Penny
Adidas Crazy 8|Kobe's early shoe|Adidas Crazy 8
Nike Book 1|Devin Booker`), mkT('t-bags', 'Designer Bags', '👛', F, 'Pick 1, Pick 2, Pick 3, Pick 4', '', `
Hermès Birkin|The grail||👜
Hermès Kelly|Elegant top handle||👜
Chanel Classic Flap|Quilted icon||👜
Chanel Boy Bag|Edgy Chanel||👜
Louis Vuitton Speedy|Monogram classic||👜
Louis Vuitton Neverfull|Everyday tote||👜
Louis Vuitton Keepall|Weekender||🧳
Dior Saddle Bag|Curved icon||👜
Lady Dior|Cannage stitching||👜
Gucci Jackie|Hobo bag||👜
Gucci Marmont|Double G||👜
Fendi Baguette|Under the arm||🥖
Prada Re-Edition|Nylon mini||👜
Balenciaga City Bag|Motorcycle bag||🏍️
Bottega Veneta Cassette|Woven leather||👜
Celine Triomphe|Triomphe clasp||👜
Loewe Puzzle|Geometric||🧩
YSL Loulou|Quilted shoulder bag||👜
Goyard St. Louis|Chevron tote||👜
Telfar Shopping Bag|Bushwick Birkin||🛍️
Coach Tabby|Coach classic||👜
Jacquemus Le Chiquito|Tiny bag||🤏
Valentino Rockstud|Studded||👜
Givenchy Antigona|Structured||👜
Miu Miu Wander|Matelassé||👜
Prada Galleria|Saffiano leather||👜`), mkT('t-outerwear', 'Jackets & Outerwear', '🧥', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'ps', `
Puffer Jacket|Warm and puffy|Down jacket|🧥
Leather Jacket|Timeless|Leather jacket|🧥
Denim Jacket|Jean jacket|Jean jacket|🧥
Bomber Jacket|Flight style|Flight jacket|🧥
Trench Coat|Rain-ready classic|Trench coat|🧥
Parka|Winter warmth||🧥
Peacoat|Navy wool||🧥
Varsity Jacket|Letterman|Letterman jacket|🧥
Windbreaker|Light shell||🧥
Fleece Jacket|Soft and warm|Polar fleece|🧥
Hoodie|Everyday essential||🧥
Overcoat|Smart and long||🧥
Harrington Jacket|Mod classic||🧥
Shacket|Shirt-jacket|Overshirt|🧥
Gilet|Sleeveless|Waistcoat|🦺
Raincoat|Waterproof||☔
Ski Jacket|Slope-ready|Ski suit|⛷️
Blazer|Smart casual||🧥
Biker Jacket|Asymmetric zip|Leather jacket|🏍️
Field Jacket|M-65|M-1965 field jacket|🧥
Teddy Coat|Fluffy||🧸
Anorak|Pullover shell||🧥
Track Jacket|Sporty|Tracksuit|🧥
Chore Coat|Workwear||🧥
Duffle Coat|Toggles||🧥
Corduroy Jacket|Ribbed||🧥
Quilted Jacket|Diamond quilting||🧥
Canada Goose Parka|Arctic-ready|Canada Goose|🧥`), mkT('t-sunglasses', 'Sunglasses', '🕶️', F, 'Pick 1, Pick 2, Pick 3', '', `
Ray-Ban Wayfarer|Timeless||🕶️
Ray-Ban Aviator|Pilot classic||🕶️
Ray-Ban Clubmaster|Browline||🕶️
Oakley Holbrook|Sporty classic||🕶️
Oakley Frogskins|80s throwback||🕶️
Oakley Radar|Sports wrap||🕶️
Persol 714|Folding icon||🕶️
Tom Ford FT0237|Snowdon style||🕶️
Gentle Monster|Korean fashion frames||🕶️
Cartier Santos|Luxury aviators||🕶️
Prada Linea Rossa|Sporty luxury||🕶️
Gucci GG|Logo frames||🕶️
Celine Triomphe|Thick acetate||🕶️
Dior Blacksuit|Sleek||🕶️
Maui Jim|Polarised||🕶️
Oliver Peoples|Vintage-inspired||🕶️
Warby Parker|Affordable||🕶️
Quay|Festival favourite||🕶️
Costa del Mar|Fishing favourite||🎣
Randolph Engineering|Military aviator||✈️
Moscot Lemtosh|New York classic||🕶️
Jacques Marie Mage|Collector frames||🕶️`)];
}
function travelTopicsV3() {
  const F = 'Travel & Places';
  return [mkT('t-capitals', 'Capital Cities', '🏛️', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
London|United Kingdom
Paris|France
Tokyo|Japan
Washington, D.C.|United States
Ottawa|Canada
Riyadh|Saudi Arabia
Rome|Italy
Madrid|Spain
Berlin|Germany
Beijing|China
Seoul|South Korea
Cairo|Egypt
Abu Dhabi|United Arab Emirates
Doha|Qatar
Amman|Jordan
Ankara|Türkiye
Moscow|Russia
Mexico City|Mexico
Buenos Aires|Argentina
Lisbon|Portugal
Amsterdam|Netherlands
Athens|Greece
Vienna|Austria
Prague|Czech Republic
Stockholm|Sweden
Oslo|Norway
Copenhagen|Denmark
Dublin|Ireland
Bangkok|Thailand
Singapore|Singapore
Kuala Lumpur|Malaysia
New Delhi|India
Islamabad|Pakistan
Nairobi|Kenya
Rabat|Morocco
Canberra|Australia
Wellington|New Zealand
Brasília|Brazil
Lima|Peru
Havana|Cuba`), mkT('t-landmarks', 'Famous Landmarks', '🗽', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Eiffel Tower|Paris
Statue of Liberty|New York
Great Wall of China|China
Taj Mahal|Agra, India
Colosseum|Rome
Pyramids of Giza|Egypt|Giza pyramid complex
Burj Khalifa|Dubai
Machu Picchu|Peru
Christ the Redeemer|Rio de Janeiro|Christ the Redeemer (statue)
Petra|Jordan
Big Ben|London
Sydney Opera House|Sydney
Golden Gate Bridge|San Francisco
Stonehenge|England
Leaning Tower of Pisa|Italy
Sagrada Família|Barcelona
Acropolis of Athens|Greece
Angkor Wat|Cambodia
Mount Rushmore|South Dakota
CN Tower|Toronto
Kaaba|Mecca
Prophet's Mosque|Medina
Hagia Sophia|Istanbul
Chichén Itzá|Mexico
Neuschwanstein Castle|Germany
Tower Bridge|London
Times Square|New York
Empire State Building|New York
Forbidden City|Beijing
Sheikh Zayed Grand Mosque|Abu Dhabi
Alhambra|Granada
Edge of Diriyah|Riyadh|Diriyah
Hegra|AlUla, Saudi Arabia|Hegra (Mada'in Salih)
Mont-Saint-Michel|France
Niagara Falls|Ontario and New York
Brandenburg Gate|Berlin
Moai|Easter Island
Burj Al Arab|Dubai`), mkT('t-wonders', 'Natural Wonders', '🌋', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Grand Canyon|Arizona
Great Barrier Reef|Australia
Victoria Falls|Zambia and Zimbabwe
Mount Everest|Nepal and China
Aurora Borealis|Northern lights|Aurora
Niagara Falls|Canada and USA
Iguazu Falls|Argentina and Brazil
Ha Long Bay|Vietnam
Paricutín|Mexico's young volcano
Harbour of Rio de Janeiro|Brazil|Guanabara Bay
Amazon Rainforest|South America|Amazon rainforest
Sahara Desert|North Africa|Sahara
Uluru|Australia
Matterhorn|Switzerland
Angel Falls|Venezuela
Galápagos Islands|Ecuador
Plitvice Lakes|Croatia|Plitvice Lakes National Park
Pamukkale|Türkiye
Cappadocia|Türkiye
Zhangjiajie|China|Zhangjiajie National Forest Park
Moraine Lake|Banff, Canada
Giant's Causeway|Northern Ireland
Salar de Uyuni|Bolivia
Antelope Canyon|Arizona
Mount Fuji|Japan
Table Mountain|Cape Town
Dead Sea|Jordan and Israel
Edge of the World|Riyadh, Saudi Arabia|Jebel Fihrayn
Bay of Fundy|Canada
Torres del Paine|Chile|Torres del Paine National Park`), mkT('t-islands', 'Islands', '🏝️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Maldives|Indian Ocean
Bali|Indonesia
Santorini|Greece
Mykonos|Greece
Bora Bora|French Polynesia
Hawaii|Big Island|Hawaii (island)
Maui|Hawaii
Iceland|North Atlantic
Sicily|Italy
Sardinia|Italy
Ibiza|Spain
Mallorca|Spain
Tenerife|Canary Islands
Madeira|Portugal
Crete|Greece
Phuket|Thailand
Zanzibar|Tanzania
Mauritius|Indian Ocean
Seychelles|Indian Ocean
Jamaica|Caribbean
Barbados|Caribbean
Bahamas|Caribbean|The Bahamas
Fiji|South Pacific
Sri Lanka|Indian Ocean
Prince Edward Island|Canada
Vancouver Island|Canada
Galápagos Islands|Ecuador
Capri|Italy
Jeju Island|South Korea
Farasan Islands|Red Sea, Saudi Arabia`), mkT('t-beaches', 'Beaches', '🏖️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Bondi Beach|Sydney
Copacabana|Rio de Janeiro|Copacabana, Rio de Janeiro
Whitehaven Beach|Australia
Navagio Beach|Greece|Navagio
Maya Bay|Thailand
Grace Bay|Turks and Caicos
Seven Mile Beach|Grand Cayman|Seven Mile Beach, Cayman Islands
Waikiki|Honolulu
Miami Beach|Florida
Malibu|California|Malibu, California
Santa Monica Beach|California|Santa Monica State Beach
Tulum|Mexico
Cancún|Mexico
Anse Source d'Argent|Seychelles
Pink Sands Beach|Bahamas|Harbour Island, Bahamas
Nusa Dua|Bali
Camps Bay|Cape Town
Praia da Marinha|Portugal
Cala Macarella|Mallorca
Elafonissi|Crete
Reynisfjara|Iceland
Long Beach|Tofino, Canada|Long Beach (Pacific Rim National Park Reserve)
Sauble Beach|Ontario
Jumeirah Beach|Dubai
Al Fanateer Beach|Jubail, Saudi Arabia|Jubail
Durdle Door|England
Matira Beach|Bora Bora
Railay Beach|Thailand|Railay Beach`), mkT('t-themeparks', 'Theme Parks', '🎢', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Magic Kingdom|Walt Disney World
Disneyland|California
Disneyland Paris|France
Tokyo Disneyland|Japan
Universal Studios Hollywood|California
Universal Studios Florida|Orlando
Islands of Adventure|Orlando|Universal Islands of Adventure
Epic Universe|Orlando, 2025|Universal Epic Universe
Universal Studios Japan|Osaka
Europa-Park|Germany
Cedar Point|Ohio
Six Flags Magic Mountain|California
Canada's Wonderland|Vaughan, Ontario
Alton Towers|England
Thorpe Park|England
PortAventura World|Spain
Efteling|Netherlands
Tivoli Gardens|Copenhagen
Ferrari World|Abu Dhabi
Warner Bros. World Abu Dhabi|Abu Dhabi
Lotte World|Seoul
Everland|South Korea
Ocean Park|Hong Kong|Ocean Park Hong Kong
Busch Gardens Tampa Bay|Florida
Dollywood|Tennessee
Phantasialand|Germany
Liseberg|Sweden
Kings Island|Ohio
Gardaland|Italy
Hersheypark|Pennsylvania`), mkT('t-europe', 'European Cities', '🇪🇺', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Paris|France
London|United Kingdom
Rome|Italy
Barcelona|Spain
Madrid|Spain
Amsterdam|Netherlands
Berlin|Germany
Munich|Germany
Vienna|Austria
Prague|Czech Republic
Budapest|Hungary
Lisbon|Portugal
Porto|Portugal
Istanbul|Türkiye
Athens|Greece
Venice|Italy
Florence|Italy
Milan|Italy
Naples|Italy
Edinburgh|Scotland
Dublin|Ireland
Copenhagen|Denmark
Stockholm|Sweden
Oslo|Norway
Reykjavík|Iceland
Zurich|Switzerland
Geneva|Switzerland
Brussels|Belgium
Bruges|Belgium
Seville|Spain
Kraków|Poland
Dubrovnik|Croatia
Monaco|Monaco
Manchester|England
Liverpool|England`), mkT('t-asia', 'Asian Cities', '🏯', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Tokyo|Japan
Kyoto|Japan
Osaka|Japan
Seoul|South Korea
Busan|South Korea
Beijing|China
Shanghai|China
Hong Kong|China
Taipei|Taiwan
Singapore|Singapore
Bangkok|Thailand
Chiang Mai|Thailand
Kuala Lumpur|Malaysia
Hanoi|Vietnam
Ho Chi Minh City|Vietnam
Manila|Philippines
Jakarta|Indonesia
Mumbai|India
New Delhi|India
Jaipur|India
Kathmandu|Nepal
Colombo|Sri Lanka
Lahore|Pakistan
Karachi|Pakistan
Dhaka|Bangladesh
Macau|China
Shenzhen|China
Siem Reap|Cambodia
Almaty|Kazakhstan
Ulaanbaatar|Mongolia`), mkT('t-mecities', 'Middle Eastern Cities', '🕌', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Dubai|UAE
Abu Dhabi|UAE
Sharjah|UAE
Riyadh|Saudi Arabia
Jeddah|Saudi Arabia
Mecca|Saudi Arabia
Medina|Saudi Arabia
Dammam|Saudi Arabia
AlUla|Saudi Arabia
Doha|Qatar
Kuwait City|Kuwait
Manama|Bahrain
Muscat|Oman
Salalah|Oman
Amman|Jordan
Beirut|Lebanon
Damascus|Syria
Aleppo|Syria
Baghdad|Iraq
Erbil|Iraq
Tehran|Iran
Isfahan|Iran
Shiraz|Iran
Istanbul|Türkiye
Ankara|Türkiye
Cairo|Egypt
Alexandria|Egypt
Jerusalem|Holy city
Taif|Saudi Arabia
Abha|Saudi Arabia`), mkT('t-nacities', 'North American Cities', '🌆', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
New York City|New York
Los Angeles|California
Chicago|Illinois
Toronto|Ontario
Vancouver|British Columbia
Montreal|Quebec
Mississauga|Ontario
Miami|Florida
Las Vegas|Nevada
San Francisco|California
Mexico City|Mexico
Houston|Texas
Seattle|Washington
Boston|Massachusetts
Washington, D.C.|USA
Atlanta|Georgia
New Orleans|Louisiana
Nashville|Tennessee
Austin|Texas
Dallas|Texas
Denver|Colorado
Calgary|Alberta
Ottawa|Ontario
Quebec City|Quebec
Philadelphia|Pennsylvania
San Diego|California
Orlando|Florida
Honolulu|Hawaii
Cancún|Mexico
Guadalajara|Mexico
Phoenix|Arizona|Phoenix, Arizona
Edmonton|Alberta
Winnipeg|Manitoba
Halifax|Nova Scotia|Halifax, Nova Scotia`), mkT('t-africa', 'African Destinations', '🌍', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Cape Town|South Africa
Marrakesh|Morocco
Cairo|Egypt
Zanzibar|Tanzania
Serengeti|Tanzania|Serengeti National Park
Victoria Falls|Zambia and Zimbabwe
Kruger National Park|South Africa
Maasai Mara|Kenya
Mount Kilimanjaro|Tanzania
Nairobi|Kenya
Lagos|Nigeria
Accra|Ghana
Dakar|Senegal
Casablanca|Morocco
Fez|Morocco
Chefchaouen|Morocco
Tunis|Tunisia
Seychelles|Indian Ocean
Mauritius|Indian Ocean
Madagascar|Lemurs and baobabs
Okavango Delta|Botswana
Sossusvlei|Namibia
Luxor|Egypt
Sharm El Sheikh|Egypt
Addis Ababa|Ethiopia
Lalibela|Ethiopia
Kigali|Rwanda
Johannesburg|South Africa
Durban|South Africa
Essaouira|Morocco`), mkT('t-states', 'US States', '🇺🇸', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Alabama
Alaska
Arizona
Arkansas
California
Colorado
Connecticut
Delaware
Florida
Georgia||Georgia (U.S. state)
Hawaii
Idaho
Illinois
Indiana
Iowa
Kansas
Kentucky
Louisiana
Maine
Maryland
Massachusetts
Michigan
Minnesota
Mississippi
Missouri
Montana
Nebraska
Nevada
New Hampshire
New Jersey
New Mexico
New York||New York (state)
North Carolina
North Dakota
Ohio
Oklahoma
Oregon
Pennsylvania
Rhode Island
South Carolina
South Dakota
Tennessee
Texas
Utah
Vermont
Virginia
Washington||Washington (state)
West Virginia
Wisconsin
Wyoming`), mkT('t-canada', 'Canada: Provinces & Places', '🍁', F, 'Province, Province, Place, Place, FLEX', 'p', `
Ontario|Province|||Province
Quebec|Province|||Province
British Columbia|Province|||Province
Alberta|Province|||Province
Manitoba|Province|||Province
Saskatchewan|Province|||Province
Nova Scotia|Province|||Province
New Brunswick|Province|||Province
Prince Edward Island|Province|||Province
Newfoundland and Labrador|Province|||Province
Yukon|Territory|||Province
Northwest Territories|Territory|||Province
Nunavut|Territory|||Province
Banff National Park|Alberta|||Place
Lake Louise|Alberta|||Place
Jasper National Park|Alberta|||Place
Niagara Falls|Ontario|||Place
CN Tower|Toronto|||Place
Old Quebec|Quebec City|||Place
Whistler|British Columbia|Whistler, British Columbia||Place
Stanley Park|Vancouver|||Place
Peggy's Cove|Nova Scotia|||Place
Churchill|Polar bear capital, Manitoba|Churchill, Manitoba||Place
Algonquin Park|Ontario|Algonquin Provincial Park||Place
Parliament Hill|Ottawa|||Place
Bay of Fundy|Highest tides|||Place
Tofino|British Columbia|Tofino, British Columbia||Place
Moraine Lake|Alberta|||Place`), mkT('t-saudicities', 'Saudi Cities & Places', '🇸🇦', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Riyadh|The capital
Jeddah|Red Sea gateway
Mecca|Holy city
Medina|Holy city
Dammam|Eastern Province
Khobar|Eastern Province|Khobar
Dhahran|Eastern Province
Taif|City of roses
Abha|Asir mountains
Tabuk|North-west
AlUla|Ancient wonders
Al-Ahsa|World's largest oasis|Al-Ahsa Oasis
Jazan|South-west coast
Najran|South
Ha'il|North|Ha'il
Buraidah|Qassim
Unaizah|Qassim
Yanbu|Red Sea
Al Bahah|Mountains|Al Bahah
Khamis Mushait|Asir
Jubail|Industrial coast
Qatif|Eastern Province
Sakakah|Al Jawf
Diriyah|Birthplace of the first Saudi state
NEOM|Future megaproject
Edge of the World|Near Riyadh|Jebel Fihrayn
Hegra|Nabataean tombs|Hegra (Mada'in Salih)`), mkT('t-airports', 'Airports', '✈️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Dubai International|DXB|Dubai International Airport
Singapore Changi|SIN|Changi Airport
Hamad International|Doha, DOH|Hamad International Airport
Istanbul Airport|IST
London Heathrow|LHR|Heathrow Airport
Hartsfield–Jackson Atlanta|ATL|Hartsfield–Jackson Atlanta International Airport
Los Angeles International|LAX|Los Angeles International Airport
JFK|New York|John F. Kennedy International Airport
Toronto Pearson|Mississauga, YYZ|Toronto Pearson International Airport
Vancouver International|YVR|Vancouver International Airport
Montréal–Trudeau|YUL|Montréal–Trudeau International Airport
Paris Charles de Gaulle|CDG|Charles de Gaulle Airport
Frankfurt Airport|FRA
Amsterdam Schiphol|AMS|Amsterdam Airport Schiphol
Tokyo Haneda|HND|Haneda Airport
Incheon International|Seoul, ICN|Incheon International Airport
Hong Kong International|HKG|Hong Kong International Airport
King Abdulaziz International|Jeddah, JED|King Abdulaziz International Airport
King Khalid International|Riyadh, RUH|King Khalid International Airport
Zayed International|Abu Dhabi, AUH|Zayed International Airport
Sydney Airport|SYD
Madrid–Barajas|MAD|Adolfo Suárez Madrid–Barajas Airport
Munich Airport|MUC
Zurich Airport|ZRH
Chicago O'Hare|ORD|O'Hare International Airport
Denver International|DEN|Denver International Airport
Dallas/Fort Worth|DFW|Dallas Fort Worth International Airport
Beijing Daxing|PKX|Beijing Daxing International Airport
Helsinki Airport|HEL`), mkT('t-mountains', 'Famous Mountains', '🏔️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Mount Everest|Himalayas, 8,849 m
K2|Karakoram
Kangchenjunga|Himalayas
Mont Blanc|Alps
Matterhorn|Alps
Mount Kilimanjaro|Tanzania
Mount Fuji|Japan
Denali|Alaska
Aconcagua|Andes
Mount Elbrus|Caucasus
Table Mountain|Cape Town
Mount Rainier|Washington
Mount Olympus|Greece
Mount Kenya|Kenya
Ben Nevis|Scotland
Mount Sinai|Egypt
Annapurna|Nepal|Annapurna Massif
Eiger|Alps
Mount Vesuvius|Italy
Mount Etna|Sicily
Half Dome|Yosemite
Aoraki / Mount Cook|New Zealand|Aoraki / Mount Cook
Mount Kosciuszko|Australia
Toubkal|Morocco|Jbel Toubkal
Mount Logan|Canada's highest
Mount Robson|Canadian Rockies
Mount St. Helens|Washington
Grand Teton|Wyoming
Jabal Sawda|Saudi Arabia's highest|Jabal Sawda`), mkT('t-deserts', 'Deserts', '🏜️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Sahara|North Africa
Arabian Desert|Arabian Peninsula
Rub' al Khali|The Empty Quarter|Empty Quarter
Gobi Desert|Mongolia and China
Kalahari Desert|Southern Africa
Namib|Namibia
Atacama Desert|Chile
Mojave Desert|USA
Sonoran Desert|USA and Mexico
Great Victoria Desert|Australia
Antarctic Desert|Largest of all|Antarctica
Thar Desert|India and Pakistan
Taklamakan Desert|China
Chihuahuan Desert|USA and Mexico
Great Basin Desert|USA
Syrian Desert|Middle East
Negev|Southern Levant
Wadi Rum|Jordan
Death Valley|California
Patagonian Desert|Argentina
Karakum Desert|Turkmenistan
Kyzylkum Desert|Central Asia
Simpson Desert|Australia
Great Sandy Desert|Australia
Danakil Desert|Ethiopia and Eritrea
An Nafud|Saudi Arabia|Nefud Desert
Dasht-e Kavir|Iran
White Desert|Egypt|White Desert National Park`), mkT('t-natparks', 'National Parks', '🌲', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Yellowstone|USA|Yellowstone National Park
Yosemite|USA|Yosemite National Park
Grand Canyon|USA|Grand Canyon National Park
Banff|Canada|Banff National Park
Jasper|Canada|Jasper National Park
Zion|USA|Zion National Park
Glacier|USA|Glacier National Park (U.S.)
Arches|USA|Arches National Park
Great Smoky Mountains|USA|Great Smoky Mountains National Park
Rocky Mountain|USA|Rocky Mountain National Park
Acadia|USA|Acadia National Park
Everglades|USA|Everglades National Park
Serengeti|Tanzania|Serengeti National Park
Kruger|South Africa|Kruger National Park
Torres del Paine|Chile|Torres del Paine National Park
Plitvice Lakes|Croatia|Plitvice Lakes National Park
Fiordland|New Zealand|Fiordland National Park
Kakadu|Australia|Kakadu National Park
Uluṟu-Kata Tjuṯa|Australia|Uluṟu-Kata Tjuṯa National Park
Galápagos|Ecuador|Galápagos National Park
Lake District|England|Lake District National Park
Eryri (Snowdonia)|Wales|Snowdonia
Sequoia|USA|Sequoia National Park
Joshua Tree|USA|Joshua Tree National Park
Bryce Canyon|USA|Bryce Canyon National Park
Pacific Rim|Canada|Pacific Rim National Park Reserve
Gros Morne|Canada|Gros Morne National Park
Bruce Peninsula|Canada|Bruce Peninsula National Park
Chitwan|Nepal|Chitwan National Park
Komodo|Indonesia|Komodo National Park`), mkT('t-lakes', 'Beautiful Lakes', '🏞️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Lake Louise|Canada|Lake Louise (Alberta)
Moraine Lake|Canada
Peyto Lake|Canada
Lake Como|Italy
Lake Garda|Italy
Lake Bled|Slovenia
Lake Tahoe|USA
Crater Lake|USA
Lake Baikal|Russia
Lake Titicaca|Peru and Bolivia
Lake Victoria|East Africa
Lake Geneva|Switzerland and France
Lake Lucerne|Switzerland
Hallstätter See|Austria
Königssee|Germany
Lake Annecy|France
Lake Superior|Canada and USA
Loch Ness|Scotland
Lake Malawi|Africa
Lake Atitlán|Guatemala
Lake Hillier|Pink lake, Australia
Spotted Lake|British Columbia
Lake Pukaki|New Zealand
Lake Tekapo|New Zealand
Dead Sea|Jordan and Israel
Lake Kawaguchi|Japan|Lake Kawaguchi
Lake Ohrid|North Macedonia and Albania
Lake Powell|USA
Plitvice Lakes|Croatia|Plitvice Lakes National Park
Lake Ontario|Canada and USA`), mkT('t-rivers', 'Famous Rivers', '🌊', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Nile|Africa
Amazon|South America|Amazon River
Yangtze|China
Mississippi|USA|Mississippi River
Thames|London|River Thames
Seine|Paris
Danube|Europe
Rhine|Europe
Ganges|India
Mekong|Southeast Asia
Colorado River|USA
St. Lawrence River|Canada|Saint Lawrence River
Volga|Russia
Tigris|Iraq
Euphrates|Middle East
Jordan River|Middle East
Zambezi|Africa
Congo River|Africa
Niger River|Africa
Yukon River|Canada and Alaska
Hudson River|New York
Rio Grande|USA and Mexico
Yellow River|China
Indus River|Pakistan
Murray River|Australia
Tiber|Rome
River Shannon|Ireland
Fraser River|British Columbia
Missouri River|USA
Douro|Spain and Portugal`), mkT('t-ski', 'Ski Resorts', '⛷️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Whistler Blackcomb|Canada
Zermatt|Switzerland
Chamonix|France
Aspen|Colorado|Aspen, Colorado
Vail|Colorado|Vail Ski Resort
St. Moritz|Switzerland
Courchevel|France
Val d'Isère|France
Verbier|Switzerland
Niseko|Japan
Jackson Hole|Wyoming|Jackson Hole Mountain Resort
Park City|Utah|Park City Mountain Resort
Banff Sunshine|Canada|Sunshine Village
Lake Louise Ski Resort|Canada|Lake Louise Ski Resort
Mont-Tremblant|Quebec|Mont Tremblant Resort
Kitzbühel|Austria
St. Anton am Arlberg|Austria
Cortina d'Ampezzo|Italy
Breckenridge|Colorado|Breckenridge Ski Resort
Big Sky|Montana|Big Sky Resort
Mammoth Mountain|California
Telluride|Colorado|Telluride Ski Resort
Revelstoke|Canada|Revelstoke Mountain Resort
Val Thorens|France
Méribel|France
Lech|Austria|Lech am Arlberg
Hakuba|Japan|Hakuba, Nagano
Gstaad|Switzerland
Ischgl|Austria
Blue Mountain|Ontario|Blue Mountain Resort`)];
}
const POPULARITY = {
  't-cf': 99,
  't-goat': 96,
  't-pl': 92,
  't-nba': 93,
  't-nbal': 88,
  't-ucl': 89,
  't-club': 86,
  't-intl': 85,
  't-wonder': 80,
  't-goals': 82,
  't-moments': 81,
  't-rivals': 78,
  't-mgr': 72,
  't-plclubs': 79,
  't-stadia': 70,
  't-kits': 68,
  't-wfoot': 71,
  't-nbagreat': 74,
  't-nbateams': 73,
  't-f1': 83,
  't-fight': 84,
  't-wwe': 80,
  't-nfl': 77,
  't-nhl': 69,
  't-ten': 72,
  't-oly': 75,
  't-crk': 66,
  't-golf': 60,
  't-mlb': 62,
  't-mlbl': 63,
  't-rugby': 58,
  't-ff': 97,
  't-ffchains': 95,
  't-snk': 92,
  't-dess': 88,
  't-pizza': 90,
  't-chocbars': 89,
  't-crisps': 86,
  't-bfast': 84,
  't-drink': 83,
  't-icecream': 85,
  't-cereal': 82,
  't-street': 81,
  't-dish': 80,
  't-japanese': 78,
  't-italian': 79,
  't-mexican': 77,
  't-korean': 74,
  't-indian': 76,
  't-chinese': 75,
  't-mideast': 73,
  't-saudi': 68,
  't-turkish': 70,
  't-coffee': 74,
  't-boba': 72,
  't-sauces': 76,
  't-bakery': 71,
  't-noodles': 73,
  't-fruit': 69,
  't-cheese': 64,
  't-game': 98,
  't-rap': 94,
  't-heroes': 91,
  't-singers': 90,
  't-anime': 89,
  't-animechars': 87,
  't-franchise': 88,
  't-tvshows': 87,
  't-actors': 86,
  't-youtubers': 85,
  't-toon': 86,
  't-anim': 84,
  't-villains': 83,
  't-gamechars': 85,
  't-pokemon': 84,
  't-sitcoms': 80,
  't-actresses': 79,
  't-disney': 81,
  't-pixar': 80,
  't-streamers': 78,
  't-app': 82,
  't-bands': 77,
  't-consoles': 79,
  't-horror': 74,
  't-scifi': 72,
  't-streaming': 70,
  't-trav': 87,
  't-ctry': 86,
  't-landmarks': 80,
  't-themeparks': 78,
  't-islands': 74,
  't-beaches': 73,
  't-capitals': 72,
  't-europe': 73,
  't-asia': 70,
  't-nacities': 71,
  't-mecities': 69,
  't-wonders': 72,
  't-africa': 64,
  't-states': 66,
  't-canada': 65,
  't-saudicities': 63,
  't-airports': 58,
  't-mountains': 61,
  't-natparks': 62,
  't-ski': 57,
  't-lakes': 56,
  't-deserts': 55,
  't-rivers': 54,
  't-ani': 90,
  't-pet': 84,
  't-dinos': 85,
  't-cute': 82,
  't-cats': 80,
  't-sharks': 79,
  't-dogbreeds': 81,
  't-safari': 76,
  't-catbreeds': 72,
  't-snakes': 70,
  't-deepsea': 71,
  't-raptors': 68,
  't-extinct': 69,
  't-whales': 66,
  't-reptiles': 64,
  't-arctic': 63,
  't-aussie': 65,
  't-primates': 62,
  't-prehistmammals': 64,
  't-parrots': 60,
  't-insects': 58,
  't-farm': 61,
  't-shoe': 94,
  't-car': 91,
  't-supercars': 86,
  't-hypercars': 84,
  't-carbrands': 83,
  't-luxbrands': 82,
  't-jdm': 80,
  't-streetwear': 81,
  't-watches': 76,
  't-luxcars': 78,
  't-bballshoes': 77,
  't-fragrance': 74,
  't-motorbikes': 70,
  't-classics': 71,
  't-evs': 66,
  't-suvs': 67,
  't-pickups': 62,
  't-hairstyles': 69,
  't-bags': 65,
  't-outerwear': 63,
  't-sunglasses': 59,
  't-pow': 96,
  't-zomb': 90,
  't-island': 87,
  't-redflags': 91,
  't-myth': 85,
  't-house': 84,
  't-job': 82,
  't-greenflags': 83,
  't-worstpowers': 86,
  't-powercombos': 85,
  't-worldslive': 84,
  't-worldsavoid': 80,
  't-annoying': 81,
  't-satisfying': 79,
  't-board': 78,
  't-toys': 77,
  't-emoji': 76,
  't-spend1000': 79,
  't-spend100': 77,
  't-3am': 78,
  't-business': 74,
  't-shouldexist': 75,
  't-overrated': 76,
  't-underrated': 72,
  't-inv': 72,
  't-gadget': 73,
  't-dayimprovers': 71,
  't-road': 70,
  't-holi': 69,
  't-skills': 68,
  't-splurge': 67,
  't-waste': 66,
  't-partybring': 65,
  't-wknd': 66,
  't-smell': 64,
  't-collect': 63,
  't-hobby': 62,
  't-school': 60
};
const popScore = t => t && Object.prototype.hasOwnProperty.call(POPULARITY, t.id) ? POPULARITY[t.id] : null;
function byPopularity(a, b) {
  const pa = popScore(a),
    pb = popScore(b);
  if (pa != null && pb != null) return pb - pa || a.name.localeCompare(b.name);
  if (pa != null) return -1;
  if (pb != null) return 1;
  return a.name.localeCompare(b.name);
}
const prefsOf = settings => ({
  fav: [],
  pin: [],
  ...(settings && settings.topicPrefs || {})
});
function folderOrder(topics, prefs) {
  const pin = new Set(prefs.pin || []);
  return [...topics].sort((a, b) => (pin.has(b.id) ? 1 : 0) - (pin.has(a.id) ? 1 : 0) || byPopularity(a, b));
}
function favouritesOrder(topics, prefs) {
  const fav = new Set(prefs.fav || []);
  return folderOrder(topics.filter(t => fav.has(t.id)), prefs);
}
function toggleIn(list, id) {
  const s = new Set(list || []);
  if (s.has(id)) s.delete(id);else s.add(id);
  return [...s];
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
  const pool = [...d.queue, ...d.leftover].map(id => visibleItem(d, id));
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
    const options = d.queue.slice(1).filter(id => assignSlot(bot, visibleItem(d, id), slots) >= 0).length;
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
function botDecision(d, bot, opts) {
  const item = d.queue.length ? visibleItem(d, d.queue[0]) : null;
  if (!item || !isBot(bot) || isFull(bot) || d.phase !== 'auction' || d.pending) return null;
  if (d.bid && d.bid.leaderId === bot.id) return null;
  const price = nextAmount(d);
  if (!canBid(d, bot, price)) return null;
  const rng = seeded(d.seed || d.id, d.reveal, price, bot.id);
  const L = botLevel(bot);
  const type = bot.bot.type;
  if (rng() < L.miss && !(opts && opts.noMiss)) return null;
  const {
    limit,
    value
  } = botLimit(d, bot, item, rng);
  if (price > limit) {
    const pay = Math.ceil(price / 2);
    const keen = type === 'spender' ? itemFame(item) > 0.55 : type === 'needs' ? scarcityOf(d, item) > 1.2 : type === 'chaos' ? rng() < 0.3 : value > price * 0.75;
    if (keen && pay <= limit && !doubleProblem(d, bot.id, pay)) return {
      botId: bot.id,
      speaker: bot.speaker || bot.id,
      amount: pay,
      double: true,
      delay: clamp(Math.round(900 + rng() * 900), 650, 2300),
      event: 'jump'
    };
    return null;
  }
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
    speaker: bot.speaker || bot.id,
    amount,
    delay: Math.round(delay),
    event: amount > price ? 'jump' : 'bid'
  };
}
function botPassers(d) {
  if (d.phase !== 'auction' || d.pending || !d.queue.length) return [];
  const byTeam = {};
  botActors(d).forEach(a => {
    (byTeam[a.id] = byTeam[a.id] || []).push(a);
  });
  return Object.keys(byTeam).filter(id => {
    const m = d.managers.find(x => x.id === id);
    if (!m || isOut(d, id) || d.bid && d.bid.leaderId === id || !canBid(d, m, nextAmount(d)) || owesBid(d, m) || skipWithdrawProblem(d, id)) return false;
    return byTeam[id].every(a => !botDecision(d, a, {
      noMiss: true
    }));
  });
}
function botForcedBid(d) {
  if (!mustBidOn(d)) return null;
  const a = botActors(d).find(x => owesBid(d, d.managers.find(m => m.id === x.id)));
  return a ? {
    botId: a.id,
    speaker: a.speaker || a.id,
    amount: nextAmount(d),
    delay: 900,
    event: 'bid'
  } : null;
}
function nextBotAction(d) {
  return botActors(d).map(b => botDecision(d, b)).filter(Boolean).sort((a, b) => a.delay - b.delay || (a.botId < b.botId ? -1 : 1))[0] || null;
}
function botFreePickChoice(d, bot) {
  const L = botLevel(bot);
  const opts = d.leftover.filter(id => canTake(d, bot, id));
  if (!opts.length) return null;
  const rng = seeded(d.seed || d.id, 'free', d.fp.round, d.fp.pos, bot.id);
  return opts.map(id => ({
    id,
    s: botValue(d, bot, visibleItem(d, id), () => 0.5) * (1 + (rng() - 0.5) * 2 * L.freeNoise)
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
function voteChoices(d, voterTeamId) {
  return d.managers.filter(m => m.id !== voterTeamId && m.team.some(Boolean));
}
function botVote(d, bot) {
  const choices = voteChoices(d, bot.teamId || bot.id);
  if (!choices.length) return null;
  const L = botLevel(bot);
  const rng = seeded(d.seed || d.id, 'vote', bot.speaker || bot.id);
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
TALK.spender.card = ['Rules are for people with less money.', 'Activating my secret weapon.'];
TALK.bargain.card = ['A little trick I picked up at a yard sale.', 'Free value? Don’t mind if I do.'];
TALK.needs.card = ['Exactly as planned.', 'This card fills a hole.'];
TALK.chaos.card = ['Let’s spice things up!', 'I pressed a button. Something happened.'];
['spender', 'bargain', 'needs', 'chaos'].forEach(k => {
  TALK[k].advise = ['I’d go up to {slot} for this one.', 'Worth {slot}, tops.', 'Let’s grab this. Max {slot}.'];
  TALK[k].pass = ['Let this one go.', 'Not for us. Save the money.'];
  TALK[k].nominate = ['Let’s see who wants this one.', 'Up next: my pick.'];
});
const TALK_CHANCE = {
  card: 0.9,
  advise: 0.6,
  pass: 0.4,
  nominate: 0.4,
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
function botCardPlay(d, bot) {
  if (!cardWindow(d) || !d.cards || !(d.cards[bot.id] || []).length) return null;
  const L = botLevel(bot);
  const type = bot.bot.type;
  const rng = seeded(d.seed, d.reveal, 'card', bot.speaker || bot.id);
  if (rng() < (type === 'chaos' ? 0.45 : 0.72)) return null;
  const item = visibleItem(d, d.queue[0]);
  const fair = d.rules.budget / d.rules.slots.length;
  const rivals = d.managers.filter(m => m.id !== bot.id);
  const opts = [];
  if (hasCard(d, bot.id, 'freeze') && assignSlot(bot, item, d.rules.slots) >= 0) {
    const v = botValue(d, bot, item, rng);
    const threat = rivals.filter(m => !isFull(m) && assignSlot(m, item, d.rules.slots) >= 0).sort((a, b) => maxBid(b, d.rules) - maxBid(a, d.rules))[0];
    const want = type === 'spender' ? itemFame(item) > 0.6 : type === 'needs' ? scarcityOf(d, item) > 1.1 : type === 'bargain' ? v > fair * 0.9 : rng() < 0.5;
    if (threat && want && v > fair * (type === 'chaos' ? 0.5 : 0.9) && !cardProblem(d, bot.id, 'freeze', {
      target: threat.id
    })) opts.push({
      card: 'freeze',
      params: {
        target: threat.id
      },
      gain: v * 0.6
    });
  }
  if (hasCard(d, bot.id, 'steal')) {
    rivals.forEach(m => m.team.forEach(t => {
      if (!t) return;
      const it = d.items[t.itemId];
      if (cardProblem(d, bot.id, 'steal', {
        target: m.id,
        item: t.itemId
      })) return;
      const v = botValue(d, bot, it, rng);
      const cost = stealPrice(d, t);
      const edge = type === 'bargain' ? 0.65 : type === 'spender' ? 1.1 : 0.85;
      if (v - cost * edge > fair * 0.3) opts.push({
        card: 'steal',
        params: {
          target: m.id,
          item: t.itemId
        },
        gain: v - cost
      });
    }));
  }
  if (hasCard(d, bot.id, 'swap')) {
    bot.team.forEach(mine => {
      if (!mine) return;
      rivals.forEach(m => m.team.forEach(t => {
        if (!t || cardProblem(d, bot.id, 'swap', {
          target: m.id,
          item: t.itemId,
          mine: mine.itemId
        })) return;
        const gain = botValue(d, bot, d.items[t.itemId], () => 0.5) - botValue(d, bot, d.items[mine.itemId], () => 0.5);
        if (gain > fair * 0.35) opts.push({
          card: 'swap',
          params: {
            target: m.id,
            item: t.itemId,
            mine: mine.itemId
          },
          gain
        });
      }));
    });
  }
  if (!opts.length) return null;
  const pick = L.noise > 0.3 ? opts[Math.floor(rng() * opts.length)] : opts.sort((a, b) => b.gain - a.gain)[0];
  return {
    ...pick,
    botId: bot.id,
    speaker: bot.speaker || bot.id,
    delay: clamp(Math.round(800 + rng() * 900), 650, 2200)
  };
}
function botVeto(d, team, play) {
  if (!hasCard(d, team.id, 'veto')) return false;
  const actor = isBotTeam(team) ? {
    ...team,
    name: team.members[0].name,
    bot: team.members[0].bot,
    speaker: team.members[0].id
  } : team;
  if (!actor.bot) return false;
  const rng = seeded(d.seed, 'veto', play.id);
  const fair = d.rules.budget / d.rules.slots.length;
  if (actor.bot.type === 'chaos') return rng() < 0.6;
  if (play.card === 'freeze') {
    const item = visibleItem(d, d.queue[0]);
    return !!item && botValue(d, actor, item, rng) > fair * 0.9;
  }
  const lost = play.card === 'steal' ? d.items[play.item] : d.items[play.item];
  const loss = botValue(d, actor, lost, () => 0.5) - (play.card === 'swap' ? botValue(d, actor, d.items[play.mine], () => 0.5) : 0);
  return loss > fair * (botLevel(actor).noise > 0.3 ? 0.2 : 0.45);
}
function botNominate(d, bot) {
  const pool = nominationPool(d);
  if (!pool.length) return null;
  const L = botLevel(bot);
  const type = bot.bot.type;
  const rng = seeded(d.seed, 'nom', d.reveal, bot.speaker || bot.id);
  const score = id => {
    const it = visibleItem(d, id);
    const fame = itemFame(it);
    const mine = assignSlot(bot, it, d.rules.slots) >= 0 ? botValue(d, bot, it, () => 0.5) : 0;
    let s;
    if (type === 'needs') s = mine * (assignSlot(bot, it, d.rules.slots) >= 0 && !isFlex(d.rules.slots[assignSlot(bot, it, d.rules.slots)]) ? 1.5 : 0.4);else if (type === 'spender') s = mine + fame * 8;else if (type === 'bargain') s = mine > 0 ? mine * (1.4 - fame) : fame * 3;else s = rng() * 10 + mine * 0.3;
    return s * (1 + (rng() - 0.5) * 2 * L.noise);
  };
  return pool.map(id => ({
    id,
    s: score(id)
  })).sort((a, b) => b.s - a.s)[0].id;
}
function tradeGain(d, bot, t) {
  const me = bot.id;
  const fair = d.rules.budget / d.rules.slots.length;
  const giveId = t.from === me ? t.give : t.get;
  const getId = t.from === me ? t.get : t.give;
  const val = id => {
    const r = rarityOf(d, id);
    return botValue(d, {
      ...bot,
      team: bot.team.map(x => x && x.itemId === giveId ? null : x)
    }, d.items[id], () => 0.5) * (r === 'legendary' ? 1.12 : r === 'rare' ? 1.04 : 1);
  };
  let gain = val(getId) - val(giveId);
  if (t.money && t.money.amount) gain += (t.money.payer === me ? -1 : 1) * t.money.amount * 0.9;
  return {
    gain,
    fair
  };
}
function botTradeDecision(d, bot, t) {
  if (tradeProblem(d, t)) return {
    accept: false,
    reason: 'That trade doesn’t work any more.'
  };
  const L = botLevel(bot);
  const type = bot.bot.type;
  const rng = seeded(d.seed, 'trade', t.id, bot.speaker || bot.id);
  const {
    gain,
    fair
  } = tradeGain(d, bot, t);
  const noisy = gain + (rng() - 0.5) * 2 * L.noise * fair;
  const need = type === 'bargain' ? fair * 0.3 : type === 'spender' ? -fair * 0.1 : type === 'needs' ? fair * 0.1 : -fair * 0.25;
  const accept = type === 'chaos' ? noisy > need && rng() < 0.75 : noisy > need;
  const reason = accept ? gain > fair * 0.4 ? 'Deal! I like this a lot.' : 'Fair enough, deal.' : gain < -fair * 0.4 ? 'No chance. That’s a downgrade for us.' : 'Not quite worth it for us.';
  return {
    accept,
    reason
  };
}
function botTradeOffer(d, bot) {
  const fair = d.rules.budget / d.rules.slots.length;
  const rng = seeded(d.seed, 'offer', bot.speaker || bot.id);
  if (rng() < (botLevel(bot).rivals ? 0.25 : 0.5)) return null;
  let best = null;
  bot.team.forEach(mine => {
    if (!mine) return;
    d.managers.forEach(m => {
      if (m.id === bot.id) return;
      m.team.forEach(t => {
        if (!t) return;
        const offer = {
          from: bot.id,
          to: m.id,
          give: mine.itemId,
          get: t.itemId,
          money: null
        };
        if (tradeProblem(d, offer)) return;
        const {
          gain
        } = tradeGain(d, bot, offer);
        const theirSide = (itemFame(d.items[mine.itemId]) - itemFame(d.items[t.itemId])) * fair;
        if (gain > fair * 0.25 && theirSide > -fair * 0.35 && (!best || gain > best.gain)) best = {
          ...offer,
          gain
        };
      });
    });
  });
  if (!best) return null;
  const {
    gain,
    ...offer
  } = best;
  if (d.rules.trades.money && gain > fair * 0.8 && bot.budget >= 1) offer.money = {
    payer: bot.id,
    amount: Math.min(bot.budget, Math.max(1, Math.round(gain * 0.25)))
  };
  return offer;
}
const SKIP_DEFAULTS = {
  on: true,
  max: 3,
  runOut: 'must',
  nmd: false,
  warn: true,
  endgame: {
    on: true,
    at: 3,
    allow: 0,
    style: 'must'
  },
  style: 'next',
  pref: 'rating',
  pickSecs: 20,
  debt: {
    on: false,
    clear: 'each'
  }
};
const SKIP_MAXES = [0, 1, 2, 3, 5, 10, -1];
function skipCfg(src) {
  const r = src && src.rules ? src.rules : src;
  const s = r && r.skip;
  if (!s) return {
    ...SKIP_DEFAULTS,
    on: false,
    endgame: {
      ...SKIP_DEFAULTS.endgame,
      on: false
    },
    debt: {
      ...SKIP_DEFAULTS.debt
    }
  };
  return {
    ...SKIP_DEFAULTS,
    ...s,
    endgame: {
      ...SKIP_DEFAULTS.endgame,
      ...(s.endgame || {})
    },
    debt: {
      ...SKIP_DEFAULTS.debt,
      ...(s.debt || {})
    }
  };
}
const skipRulesOn = d => {
  const c = skipCfg(d);
  return c.on || c.endgame.on;
};
const emptySk = () => ({
  used: {},
  extra: {},
  owe: {},
  debt: {},
  debtProg: {},
  taken: {},
  endUsed: {},
  turn: 0,
  cur: null,
  offer: null,
  log: []
});
const skOf = d => ({
  ...emptySk(),
  ...(d.sk || {})
});
const cloneSk = d => JSON.parse(JSON.stringify(skOf(d)));
const maxSkipsOf = c => !c.on ? Infinity : c.max < 0 ? Infinity : c.max;
function eligibleFor(d, m, id) {
  const it = d.items[id];
  return !!(m && it && !isFull(m) && assignSlot(m, it, d.rules.slots) >= 0 && maxBid(m, d.rules) >= d.rules.minBid);
}
const endgameNow = d => {
  const c = skipCfg(d);
  return c.endgame.on && d.queue.length > 0 && d.queue.length <= c.endgame.at;
};
const endgameSoon = d => {
  const c = skipCfg(d);
  return c.endgame.on && c.endgame.style === 'pressure' && d.queue.length > c.endgame.at && d.queue.length <= c.endgame.at + 3;
};
function skipVerdict(d, mid) {
  const c = skipCfg(d);
  const s = skOf(d);
  if (!c.on && !c.endgame.on) return {
    ok: true,
    cost: null,
    left: Infinity
  };
  const left = Math.max(0, maxSkipsOf(c) - (s.used[mid] || 0));
  const end = endgameNow(d);
  if (end && (s.endUsed[mid] || 0) >= c.endgame.allow) return {
    ok: false,
    forced: true,
    why: 'endgame',
    left
  };
  if (!c.on) return {
    ok: true,
    cost: end ? 'end' : null,
    left
  };
  if (left > 0) return {
    ok: true,
    cost: 'normal',
    left,
    end
  };
  if (c.nmd) return {
    ok: false,
    forced: true,
    why: 'nmd',
    left
  };
  if (c.debt.on) return (s.debt[mid] || 0) > 0 ? {
    ok: false,
    forced: true,
    why: 'debt',
    left
  } : {
    ok: true,
    cost: 'debt',
    left,
    end
  };
  if (c.runOut === 'final') return (s.extra[mid] || 0) < 1 ? {
    ok: true,
    cost: 'final',
    left,
    end
  } : {
    ok: false,
    forced: true,
    why: 'out',
    left
  };
  if (c.runOut === 'escalate') {
    if ((s.owe[mid] || 0) > 0) return {
      ok: false,
      forced: true,
      why: 'escalate',
      left
    };
    return (s.extra[mid] || 0) < 2 ? {
      ok: true,
      cost: 'escalate',
      left,
      end
    } : {
      ok: false,
      forced: true,
      why: 'out',
      left
    };
  }
  if (c.runOut === 'none') return {
    ok: false,
    forced: false,
    why: 'none',
    left
  };
  return {
    ok: false,
    forced: true,
    why: 'out',
    left
  };
}
function presenter(d) {
  const s = d.sk;
  if (!s || !s.cur || s.cur.reveal !== d.reveal || d.phase !== 'auction') return null;
  const m = d.managers.find(x => x.id === s.cur.mid);
  return m ? {
    m,
    forced: !!s.cur.forced,
    why: s.cur.why,
    chosen: !!s.cur.chosen
  } : null;
}
const forcedPresenter = d => {
  const p = presenter(d);
  return p && p.forced ? p.m : null;
};
function forcedTakeOk(d, m) {
  const id = d.queue[0];
  return !!(id && eligibleFor(d, m, id) && !frozenNow(d, m.id));
}
const pickRand = (d, salt, arr) => {
  if (!arr.length) return null;
  const r = seeded(d.seed || d.id, 'skip', salt, d.reveal);
  return arr[Math.floor(r() * arr.length) % arr.length];
};
function assignPresenter(n, nominatorId) {
  if (!skipRulesOn(n) || n.phase !== 'auction' || !n.queue.length) {
    if (n.sk) n.sk = {
      ...n.sk,
      cur: null
    };
    return n;
  }
  const s = cloneSk(n);
  const N = n.managers.length;
  const id = n.queue[0];
  let start = nominatorId ? Math.max(0, n.managers.findIndex(m => m.id === nominatorId)) : (s.turn || 0) % N;
  let mid = null;
  if (nominatorId) {
    const nm = n.managers[start];
    if (eligibleFor(n, nm, id)) mid = nm.id;
  } else for (let k = 0; k < N; k++) {
    const m = n.managers[(start + k) % N];
    if (eligibleFor(n, m, id)) {
      mid = m.id;
      s.turn = (start + k + 1) % N;
      break;
    }
  }
  n.sk = s;
  if (!mid) {
    s.cur = null;
    return n;
  }
  const v = skipVerdict(n, mid);
  s.cur = {
    reveal: n.reveal,
    mid,
    forced: !!v.forced,
    why: v.why || null
  };
  const c = skipCfg(n);
  if (!v.forced || nominatorId || n.rules.order === 'nominate' || c.style === 'next') return n;
  const m = n.managers.find(x => x.id === mid);
  const cands = n.queue.filter(x => eligibleFor(n, m, x));
  if (!cands.length) return n;
  let pick = null;
  if (c.style === 'choose3') {
    const pool = [...cands];
    const ids = [];
    while (ids.length < 3 && pool.length) {
      const x = pickRand(n, 'c3:' + ids.length, pool);
      ids.push(x);
      pool.splice(pool.indexOf(x), 1);
    }
    n.phase = 'forcepick';
    s.offer = {
      mid,
      ids,
      reveal: n.reveal,
      why: v.why || null
    };
    return n;
  }
  if (c.style === 'auctioneer' && c.pref === 'rating' && isFootball(n.topic)) {
    const visible = cands.filter(x => !n.items[x].mystery);
    const pool = visible.length ? visible : cands;
    pick = pool.slice().sort((a, b) => playerRating(n.items[b]).ovr - playerRating(n.items[a]).ovr || (a < b ? -1 : 1))[0];
  } else pick = pickRand(n, 'rand', cands);
  if (pick && pick !== n.queue[0]) n.queue = [pick, ...n.queue.filter(x => x !== pick)];
  return n;
}
function chooseForced(d, itemId) {
  const o = d.sk && d.sk.offer;
  if (d.phase !== 'forcepick' || !o || !o.ids.includes(itemId) || !d.queue.includes(itemId)) return d;
  const m = d.managers.find(x => x.id === o.mid);
  if (!eligibleFor(d, m, itemId)) return d;
  const s = cloneSk(d);
  s.offer = null;
  const n = {
    ...d,
    queue: [itemId, ...d.queue.filter(x => x !== itemId)],
    phase: 'auction',
    reveal: d.reveal + 1,
    bid: null,
    bids: [],
    sk: s
  };
  s.cur = {
    reveal: n.reveal,
    mid: o.mid,
    forced: true,
    why: o.why,
    chosen: true
  };
  return n;
}
function autoChooseForced(d) {
  const o = d.sk && d.sk.offer;
  if (d.phase !== 'forcepick' || !o) return d;
  const m = d.managers.find(x => x.id === o.mid);
  const ok = o.ids.filter(x => eligibleFor(d, m, x));
  return ok.length ? chooseForced(d, pickRand(d, 'auto', ok)) : {
    ...d,
    phase: 'auction',
    sk: {
      ...cloneSk(d),
      offer: null,
      cur: null
    }
  };
}
function unsoldOutcome(d) {
  const p = presenter(d);
  if (!p) return {
    kind: 'plain'
  };
  if (p.forced) return forcedTakeOk(d, p.m) ? {
    kind: 'forced',
    m: p.m
  } : {
    kind: 'plain'
  };
  const v = skipVerdict(d, p.m.id);
  if (v.ok) return {
    kind: v.cost ? 'charge' : 'plain',
    m: p.m,
    cost: v.cost,
    end: !!v.end
  };
  if (v.why === 'none') return {
    kind: 'bounce',
    m: p.m
  };
  return forcedTakeOk(d, p.m) ? {
    kind: 'forced',
    m: p.m
  } : {
    kind: 'plain'
  };
}
function chargeSkip(n, mid, cost, end) {
  const s = cloneSk(n);
  if (cost === 'normal') s.used[mid] = (s.used[mid] || 0) + 1;
  if (cost === 'final' || cost === 'escalate') s.extra[mid] = (s.extra[mid] || 0) + 1;
  if (cost === 'escalate') s.owe[mid] = 1;
  if (cost === 'debt') s.debt[mid] = (s.debt[mid] || 0) + 1;
  if (end || cost === 'end') s.endUsed[mid] = (s.endUsed[mid] || 0) + 1;
  s.log = [...(s.log || []), {
    t: 'skip',
    mid,
    cost,
    item: n.queue[0]
  }].slice(-60);
  n.sk = s;
  return Math.max(0, maxSkipsOf(skipCfg(n)) - (s.used[mid] || 0));
}
function repayForced(n, mid, itemId) {
  const s = cloneSk(n);
  const c = skipCfg(n);
  s.taken[mid] = (s.taken[mid] || 0) + 1;
  if ((s.owe[mid] || 0) > 0) s.owe[mid] = 0;
  if ((s.debt[mid] || 0) > 0) {
    if (c.debt.clear === 'each') s.debt[mid] -= 1;else if (c.debt.clear === 'two') {
      s.debtProg[mid] = (s.debtProg[mid] || 0) + 1;
      if (s.debtProg[mid] >= 2) {
        s.debt[mid] -= 1;
        s.debtProg[mid] = 0;
      }
    }
  }
  s.log = [...(s.log || []), {
    t: 'forced',
    mid,
    item: itemId
  }].slice(-60);
  n.sk = s;
}
function skipChip(d, m) {
  const c = skipCfg(d);
  if (!skipRulesOn(d)) return null;
  const s = skOf(d);
  const p = presenter(d);
  if (p && p.m.id === m.id && p.forced) return {
    text: 'FORCED PICK',
    tone: 'hot'
  };
  if (isFull(m)) return null;
  const v = skipVerdict(d, m.id);
  if ((s.debt[m.id] || 0) > 0) return {
    text: 'Skip debt ' + s.debt[m.id],
    tone: 'hot'
  };
  if (!v.ok && v.forced) return {
    text: v.why === 'endgame' ? 'NO SKIPS (endgame)' : 'FORCED PICK NEXT',
    tone: 'hot'
  };
  if (!v.ok) return {
    text: 'NO SKIPS LEFT',
    tone: 'warn'
  };
  if (!c.on) return endgameNow(d) ? {
    text: 'Endgame skips ' + Math.max(0, c.endgame.allow - (s.endUsed[m.id] || 0)),
    tone: 'warn'
  } : null;
  if (c.max < 0) return null;
  if (v.cost === 'final') return {
    text: 'Final chance',
    tone: 'warn'
  };
  if (v.cost === 'escalate') return {
    text: 'Last-ditch skip',
    tone: 'warn'
  };
  if (v.cost === 'debt') return {
    text: 'Next skip = debt',
    tone: 'warn'
  };
  return {
    text: 'Skips ' + v.left + '/' + c.max,
    tone: v.left <= 1 ? 'warn' : ''
  };
}
function presenterLine(d) {
  const p = presenter(d);
  if (!p) return null;
  const who = p.m.name;
  if (p.forced) return {
    forced: true,
    text: '🔒 ' + who + ' is out of skips' + (p.why === 'endgame' ? ' (endgame)' : '') + ': if nobody bids, ' + who + ' takes it for ' + money(d.rules.minBid) + '.'
  };
  const v = skipVerdict(d, p.m.id);
  const c = skipCfg(d);
  if (!v.ok && v.why === 'none') return {
    text: '🎯 ' + who + '’s item · no skips left: if nobody bids it goes to the back'
  };
  if (!v.cost) return {
    text: '🎯 ' + who + '’s item'
  };
  const tail = v.cost === 'normal' ? c.max < 0 ? '' : ' (' + v.left + ' left)' : v.cost === 'debt' ? ' · it adds 1 skip debt' : v.cost === 'final' ? ' · their final chance' : v.cost === 'escalate' ? ' · a last-ditch skip' : '';
  return {
    text: '🎯 ' + who + '’s item · if nobody bids, it uses one of their skips' + tail
  };
}
function skipWithdrawProblem(d, id) {
  const f = forcedPresenter(d);
  return f && f.id === id && forcedTakeOk(d, f) ? 'No more dodging: you’re out of skips, so you can’t drop out of this item. If nobody bids, you take it for ' + money(d.rules.minBid) + '.' : null;
}
function nominationAllowed(d, mid, id) {
  if (!skipRulesOn(d)) return true;
  const v = skipVerdict(d, mid);
  return !v.forced || eligibleFor(d, d.managers.find(m => m.id === mid), id);
}
function botSkipSave(d) {
  const p = presenter(d);
  if (!p || p.forced || d.bid || !skipRulesOn(d)) return null;
  const a = botActors(d).find(x => x.id === p.m.id);
  if (!a || !canBid(d, p.m, d.rules.minBid)) return null;
  const v = skipVerdict(d, p.m.id);
  const precious = v.cost && (v.cost !== 'normal' || v.left <= 1) || endgameNow(d);
  if (!precious) return null;
  const type = a.bot.type;
  if (type === 'chaos' && seeded(d.seed || d.id, 'save', d.reveal)() < 0.5) return null;
  return {
    botId: a.id,
    speaker: a.speaker || a.id,
    amount: d.rules.minBid,
    delay: 1600,
    event: 'bid'
  };
}
function botForcedChoice(d) {
  const o = d.sk && d.sk.offer;
  if (!o) return null;
  const a = botActors(d).find(x => x.id === o.mid) || d.managers.find(m => m.id === o.mid);
  if (!a) return null;
  const m = d.managers.find(x => x.id === o.mid);
  const ok = o.ids.filter(x => eligibleFor(d, m, x));
  const best = ok.map(id => ({
    id,
    s: botValue(d, a, visibleItem(d, id), () => 0.5)
  })).sort((x, y) => y.s - x.s)[0];
  return best ? best.id : null;
}
function skipRulesLines(rules) {
  const c = skipCfg(rules);
  const L = [];
  if (!c.on && !c.endgame.on) return [['🔁', 'Skip limits: off (anyone can let items go unsold)']];
  if (c.on) {
    L.push(['🔁', 'Skip limit: ' + (c.max < 0 ? 'unlimited' : c.max) + ' per manager' + (c.nmd ? ' · No More Dodging: then you must take your next item' : c.debt.on ? ' · then Skip Debt (' + {
      each: 'each forced pick repays 1',
      two: 'every 2 forced picks repay 1',
      end: 'never repaid'
    }[c.debt.clear] + ')' : ' · then ' + {
      must: 'must take the next item',
      final: 'one final chance, then must take',
      escalate: 'escalating: 2 last-ditch skips with a forced pick between',
      none: 'no forced picks (unbid items go to the back)'
    }[c.runOut])]);
    if (rules.order !== 'nominate') L.push(['🎯', 'Forced pick style: ' + {
      next: 'the next item',
      choose3: 'choose from 3 (' + c.pickSecs + 's)',
      auctioneer: 'auctioneer’s choice (' + (c.pref === 'rating' ? 'highest rated on football topics, random otherwise' : 'random') + ')',
      random: 'random eligible item'
    }[c.style]]);
  } else L.push(['🔁', 'Skip limit: off']);
  if (c.endgame.on) L.push(['⏳', 'Endgame Anti-Dodging: last ' + c.endgame.at + ' items · ' + c.endgame.allow + ' skip' + (c.endgame.allow === 1 ? '' : 's') + ' allowed' + (c.endgame.style === 'pressure' ? ' · warnings 3 items before' : '')]);
  return L;
}
const TWIST_DEFAULTS = {
  chaos: {
    on: false,
    count: 2,
    steal: true,
    veto: true,
    double: true,
    swap: true,
    freeze: true
  },
  mystery: {
    on: false,
    every: 8
  },
  rarity: {
    on: false,
    rare: 25,
    legendary: 5
  },
  trades: {
    on: false,
    minutes: 3,
    money: true
  }
};
const CARD_INFO = {
  steal: {
    name: 'Steal',
    emoji: '🦹',
    text: 'Before the first bid: take one item from a rival team. You pay them what they paid + '
  },
  swap: {
    name: 'Swap',
    emoji: '🔄',
    text: 'Before the first bid: swap one of your items for one of a rival’s. Both must fit.'
  },
  freeze: {
    name: 'Freeze',
    emoji: '🧊',
    text: 'Before the first bid: one rival team can’t bid on this item.'
  },
  double: {
    name: 'Double Bid',
    emoji: '✖️2',
    text: 'Your bid counts double. Bid $X, it counts as $2X, and you pay $X if you win.'
  },
  veto: {
    name: 'Veto',
    emoji: '🛑',
    text: 'Response only: blocks a Steal, Swap or Freeze aimed at your team.'
  }
};
const CARD_TYPES = ['steal', 'swap', 'freeze', 'double', 'veto'];
const ruleOn = (d, k) => !!(d && d.rules && d.rules[k] && d.rules[k].on);
const twistRules = r => ({
  chaos: {
    ...TWIST_DEFAULTS.chaos,
    ...(r && r.chaos || {})
  },
  mystery: {
    ...TWIST_DEFAULTS.mystery,
    ...(r && r.mystery || {})
  },
  rarity: {
    ...TWIST_DEFAULTS.rarity,
    ...(r && r.rarity || {})
  },
  trades: {
    ...TWIST_DEFAULTS.trades,
    ...(r && r.trades || {})
  }
});
const teamOf = (d, id) => d.managers.find(m => m.id === id);
function participants(d) {
  if (!d.teamMode) return d.managers.map(m => ({
    id: m.id,
    name: m.name,
    emoji: m.emoji,
    color: m.color,
    teamId: m.id,
    bot: m.bot,
    human: m.human
  }));
  return d.managers.flatMap(t => (t.members || []).map(p => ({
    ...p,
    color: t.color,
    teamId: t.id,
    teamName: t.name
  })));
}
const isBotTeam = t => !!(t && t.members && t.members.length && t.members.every(p => p.bot));
function botActors(d) {
  const out = [];
  d.managers.forEach(m => {
    if (m.members) {
      if (isBotTeam(m)) m.members.forEach(p => out.push({
        ...m,
        name: p.name,
        bot: p.bot,
        speaker: p.id
      }));
    } else if (m.bot) out.push({
      ...m,
      speaker: m.id
    });
  });
  return out;
}
function botAdvisers(d) {
  const out = [];
  d.managers.forEach(m => {
    if (m.members && !isBotTeam(m)) m.members.filter(p => p.bot).forEach(p => out.push({
      ...m,
      name: p.name,
      bot: p.bot,
      speaker: p.id
    }));
  });
  return out;
}
const isHidden = (d, id) => !!(d.items[id] && d.items[id].mystery && !(d.revealed || []).includes(id));
function visibleItem(d, id) {
  const it = d.items[id];
  if (!it) return null;
  if (!isHidden(d, id)) return it;
  return {
    id,
    name: 'Mystery item',
    pos: '',
    desc: 'Face down until it’s sold',
    emoji: '❓',
    mystery: true,
    hidden: true
  };
}
const rarityOf = (d, id) => isHidden(d, id) ? null : d.rarity && d.rarity[id] || null;
function assignRarity(ids, rules, seed) {
  const r = rules.rarity;
  if (!r || !r.on) return {};
  const leg = clamp(+r.legendary || 0, 0, 100),
    rare = clamp(+r.rare || 0, 0, 100 - leg);
  const out = {};
  ids.forEach(id => {
    const u = unit('rarity', seed, id) * 100;
    out[id] = u < leg ? 'legendary' : u < leg + rare ? 'rare' : 'common';
  });
  return out;
}
function pickMystery(ids, rules, seed) {
  const m = rules.mystery;
  if (!m || !m.on) return [];
  const every = Math.max(2, Math.round(+m.every || 8));
  const count = Math.floor(ids.length / every);
  return [...ids].sort((a, b) => unit('mys', seed, a) - unit('mys', seed, b)).slice(0, count);
}
function dealCards(teamIds, rules, seed) {
  const c = rules.chaos;
  if (!c || !c.on) return {};
  const types = CARD_TYPES.filter(t => c[t]);
  if (!types.length) return {};
  const n = clamp(Math.round(+c.count || 0), 0, 5);
  const out = {};
  teamIds.forEach(id => {
    const rng = seeded('deal', seed, id);
    const pool = [];
    while (pool.length < n) {
      const r = [...types];
      for (let i = r.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [r[i], r[j]] = [r[j], r[i]];
      }
      pool.push(...r);
    }
    out[id] = pool.slice(0, n);
  });
  return out;
}
const hasCard = (d, teamId, card) => !!(d.cards && d.cards[teamId] && d.cards[teamId].includes(card));
const cardWindow = d => d.phase === 'auction' && !d.bid && !d.pending && !!currentItem(d);
const stealPrice = (d, t) => Math.max(d.rules.minBid, (t.price || 0) + d.rules.inc);
const frozenNow = (d, teamId) => !!(d.frozen && d.frozen[teamId] === d.reveal);
function removeCard(cards, teamId, card) {
  const a = [...(cards[teamId] || [])];
  const i = a.indexOf(card);
  if (i >= 0) a.splice(i, 1);
  return {
    ...cards,
    [teamId]: a
  };
}
function slotOfItem(m, itemId) {
  return m.team.findIndex(t => t && t.itemId === itemId);
}
function cardProblem(d, by, card, p) {
  p = p || {};
  if (!ruleOn(d, 'chaos') || !d.rules.chaos[card]) return 'That card isn’t in this game.';
  if (!hasCard(d, by, card)) return 'You don’t have that card.';
  const me = teamOf(d, by);
  if (card === 'veto') return 'Veto can only be used when someone targets your team.';
  if (card === 'double') return null;
  if (!cardWindow(d)) return 'Play this before the first bid on an item.';
  const them = teamOf(d, p.target);
  if (!them || them.id === by) return 'Pick a rival team.';
  if (card === 'freeze') {
    if (d.frozen && Object.values(d.frozen).includes(d.reveal)) return 'Someone is already frozen for this item.';
    if (isFull(them)) return 'That team is full already.';
    return null;
  }
  if (card === 'steal') {
    const k = slotOfItem(them, p.item);
    if (k < 0) return 'That team doesn’t own that item.';
    if (assignSlot(me, d.items[p.item], d.rules.slots) < 0) return 'You have no open slot for that item.';
    const price = stealPrice(d, them.team[k]);
    if (price > maxBid(me, d.rules)) return 'You need ' + money(price) + ' and can’t afford it.';
    return null;
  }
  if (card === 'swap') {
    const a = slotOfItem(me, p.mine),
      b = slotOfItem(them, p.item);
    if (a < 0 || b < 0) return 'Pick one of your items and one of theirs.';
    if (!swapFits(d, me, them, p.mine, p.item)) return 'Those two items don’t fit each other’s rosters.';
    return null;
  }
  return 'Unknown card.';
}
function swapFits(d, A, B, itemA, itemB) {
  const a = {
    ...A,
    team: A.team.map(t => t && t.itemId === itemA ? null : t)
  };
  const b = {
    ...B,
    team: B.team.map(t => t && t.itemId === itemB ? null : t)
  };
  return assignSlot(a, d.items[itemB], d.rules.slots) >= 0 && assignSlot(b, d.items[itemA], d.rules.slots) >= 0;
}
function playCard(d, by, card, p) {
  if (cardProblem(d, by, card, p)) return d;
  const n = withHistory(d, 'Undo card');
  n.cards = removeCard(n.cards, by, card);
  const play = {
    id: uid(),
    by,
    card,
    target: p.target,
    item: p.item || null,
    mine: p.mine || null,
    reveal: d.reveal
  };
  if (hasCard(n, p.target, 'veto')) {
    n.pending = play;
    return n;
  }
  return applyCard(n, play);
}
function applyCard(n, play) {
  const me = n.managers.find(m => m.id === play.by),
    them = n.managers.find(m => m.id === play.target);
  let ok = !!(me && them),
    detail = '';
  if (ok && play.card === 'freeze') {
    n.frozen = {
      ...(n.frozen || {}),
      [them.id]: play.reveal
    };
    detail = them.name + ' can’t bid on this item';
  }
  if (ok && play.card === 'steal') {
    const k = slotOfItem(them, play.item);
    const slot = k >= 0 ? assignSlot(me, n.items[play.item], n.rules.slots) : -1;
    const price = k >= 0 ? stealPrice(n, them.team[k]) : 0;
    ok = k >= 0 && slot >= 0 && price <= maxBid(me, n.rules);
    if (ok) {
      them.team = them.team.map((t, i) => i === k ? null : t);
      them.budget += price;
      me.team = me.team.map((t, i) => i === slot ? {
        itemId: play.item,
        price,
        stolen: true
      } : t);
      me.budget -= price;
      detail = me.name + ' stole ' + n.items[play.item].name + ' for ' + money(price);
    }
  }
  if (ok && play.card === 'swap') {
    ok = slotOfItem(me, play.mine) >= 0 && slotOfItem(them, play.item) >= 0 && swapFits(n, me, them, play.mine, play.item);
    if (ok) {
      const ta = me.team[slotOfItem(me, play.mine)],
        tb = them.team[slotOfItem(them, play.item)];
      me.team = me.team.map(t => t && t.itemId === play.mine ? null : t);
      them.team = them.team.map(t => t && t.itemId === play.item ? null : t);
      const sMe = assignSlot(me, n.items[play.item], n.rules.slots),
        sThem = assignSlot(them, n.items[play.mine], n.rules.slots);
      me.team = me.team.map((t, i) => i === sMe ? {
        ...tb
      } : t);
      them.team = them.team.map((t, i) => i === sThem ? {
        ...ta
      } : t);
      detail = me.name + ' swapped ' + n.items[play.mine].name + ' for ' + n.items[play.item].name;
    }
  }
  n.pending = null;
  n.cardLog = [...(n.cardLog || []), {
    ...play,
    result: ok ? 'done' : 'fizzled',
    detail: ok ? detail : 'It no longer worked, so nothing happened.'
  }];
  return ok && play.card !== 'freeze' ? recheckCurrent(n) : n;
}
function answerCard(d, useVeto) {
  if (!d.pending) return d;
  const play = d.pending;
  if (useVeto && hasCard(d, play.target, 'veto')) {
    const n = {
      ...d,
      cards: removeCard(d.cards, play.target, 'veto'),
      pending: null
    };
    n.cardLog = [...(n.cardLog || []), {
      ...play,
      result: 'vetoed',
      detail: teamOf(d, play.target).name + ' vetoed it'
    }];
    return n;
  }
  return applyCard({
    ...d,
    managers: d.managers.map(m => ({
      ...m,
      team: [...m.team]
    }))
  }, play);
}
function recheckCurrent(n) {
  const id = n.queue[0];
  if (!id) return n;
  const someoneCan = n.managers.some(m => !isFull(m) && assignSlot(m, n.items[id], n.rules.slots) >= 0 && maxBid(m, n.rules) >= n.rules.minBid);
  return someoneCan ? n : advance(n);
}
function doubleProblem(d, by, pay) {
  if (!ruleOn(d, 'chaos') || !d.rules.chaos.double) return 'Double Bid isn’t in this game.';
  if (!hasCard(d, by, 'double')) return 'You don’t have a Double Bid card.';
  const m = teamOf(d, by);
  if (!m || d.phase !== 'auction' || d.pending) return 'You can’t bid right now.';
  if (d.bid && d.bid.leaderId === by) return 'You’re already leading.';
  if (!canBid(d, m, pay)) return 'You can’t pay ' + money(pay) + '.';
  if (pay * 2 < nextAmount(d)) return 'Bid at least ' + money(Math.ceil(nextAmount(d) / 2)) + ' so it counts as ' + money(nextAmount(d)) + '.';
  return null;
}
function currentNominator(d) {
  const n = d.managers.length;
  const start = d.nom && d.nom.idx || 0;
  for (let k = 0; k < n; k++) {
    const m = d.managers[(start + k) % n];
    if (!isFull(m)) return {
      m,
      idx: (start + k) % n
    };
  }
  return null;
}
const nominationPool = d => {
  const cur = currentNominator(d);
  return d.queue.filter(id => d.managers.some(m => !isFull(m) && assignSlot(m, d.items[id], d.rules.slots) >= 0) && (!cur || nominationAllowed(d, cur.m.id, id)));
};
function nominate(d, itemId) {
  if (d.phase !== 'nominate') return d;
  const cur = currentNominator(d);
  if (!cur || !d.queue.includes(itemId) || !nominationAllowed(d, cur.m.id, itemId)) return d;
  const n = {
    ...d,
    queue: [itemId, ...d.queue.filter(x => x !== itemId)],
    nominated: itemId,
    nom: {
      idx: (cur.idx + 1) % d.managers.length,
      by: cur.m.id
    },
    phase: 'auction',
    reveal: d.reveal + 1,
    bid: null,
    bids: []
  };
  return assignPresenter(n, cur.m.id);
}
function openTrades(n, now) {
  n.phase = 'trade';
  n.trade = {
    endsAt: (now || Date.now()) + Math.max(0.5, +n.rules.trades.minutes || 3) * 60000,
    proposals: [],
    done: false
  };
  return n;
}
const tradeOpen = (d, now) => d.phase === 'trade' && d.trade && (now || Date.now()) < d.trade.endsAt;
function tradeProblem(d, t, now) {
  if (!tradeOpen(d, now)) return 'The trade window is closed.';
  const A = teamOf(d, t.from),
    B = teamOf(d, t.to);
  if (!A || !B || A.id === B.id) return 'Pick another team to trade with.';
  if (slotOfItem(A, t.give) < 0) return A.name + ' no longer owns ' + (d.items[t.give] || {}).name + '.';
  if (slotOfItem(B, t.get) < 0) return B.name + ' no longer owns ' + (d.items[t.get] || {}).name + '.';
  if (!swapFits(d, A, B, t.give, t.get)) return 'Those items don’t fit each other’s rosters.';
  const m = t.money;
  if (m && m.amount) {
    if (!d.rules.trades.money) return 'Money isn’t allowed in trades this game.';
    if (!(m.amount > 0) || Math.round(m.amount) !== m.amount) return 'Money must be a whole dollar amount.';
    const payer = teamOf(d, m.payer);
    if (!payer || payer.id !== A.id && payer.id !== B.id) return 'Only one of the two teams can pay.';
    if (payer.budget < m.amount) return payer.name + ' only has ' + money(payer.budget) + '.';
  }
  return null;
}
function proposeTrade(d, t, now) {
  const p = {
    id: uid(),
    from: t.from,
    to: t.to,
    give: t.give,
    get: t.get,
    money: t.money && t.money.amount ? {
      payer: t.money.payer,
      amount: t.money.amount
    } : null,
    status: 'pending',
    at: now || Date.now()
  };
  if (tradeProblem(d, p, now)) return d;
  if (d.trade.proposals.some(x => x.status === 'pending' && x.from === p.from && x.to === p.to && x.give === p.give && x.get === p.get)) return d;
  return {
    ...d,
    trade: {
      ...d.trade,
      proposals: [...d.trade.proposals, p]
    }
  };
}
const setTradeStatus = (d, id, status, note) => ({
  ...d,
  trade: {
    ...d.trade,
    proposals: d.trade.proposals.map(x => x.id === id ? {
      ...x,
      status,
      note: note || x.note
    } : x)
  }
});
function acceptTrade(d, id, now) {
  const t = d.trade && d.trade.proposals.find(x => x.id === id);
  if (!t || t.status !== 'pending') return d;
  const problem = tradeProblem(d, t, now);
  if (problem) return setTradeStatus(d, id, tradeOpen(d, now) ? 'invalid' : 'expired', problem);
  const n = {
    ...d,
    managers: d.managers.map(m => ({
      ...m,
      team: [...m.team]
    }))
  };
  const A = teamOf(n, t.from),
    B = teamOf(n, t.to);
  const ta = A.team[slotOfItem(A, t.give)],
    tb = B.team[slotOfItem(B, t.get)];
  A.team = A.team.map(x => x && x.itemId === t.give ? null : x);
  B.team = B.team.map(x => x && x.itemId === t.get ? null : x);
  const sa = assignSlot(A, n.items[t.get], n.rules.slots);
  A.team = A.team.map((x, i) => i === sa ? {
    ...tb,
    traded: true
  } : x);
  const sb = assignSlot(B, n.items[t.give], n.rules.slots);
  B.team = B.team.map((x, i) => i === sb ? {
    ...ta,
    traded: true
  } : x);
  if (t.money && t.money.amount) {
    const payer = t.money.payer === A.id ? A : B;
    const payee = payer === A ? B : A;
    payer.budget -= t.money.amount;
    payee.budget += t.money.amount;
  }
  n.trade = {
    ...n.trade,
    proposals: n.trade.proposals.map(x => x.id === id ? {
      ...x,
      status: 'accepted'
    } : x.status === 'pending' && [x.give, x.get].some(it => it === t.give || it === t.get) ? {
      ...x,
      status: 'invalid',
      note: 'One of these items was traded away.'
    } : x)
  };
  return n;
}
const rejectTrade = (d, id) => {
  const t = d.trade && d.trade.proposals.find(x => x.id === id);
  return t && t.status === 'pending' ? setTradeStatus(d, id, 'rejected') : d;
};
const cancelTrade = (d, id) => {
  const t = d.trade && d.trade.proposals.find(x => x.id === id);
  return t && t.status === 'pending' ? setTradeStatus(d, id, 'cancelled') : d;
};
function closeTrades(d) {
  if (d.phase !== 'trade') return d;
  return {
    ...d,
    phase: 'done',
    trade: {
      ...d.trade,
      done: true,
      proposals: d.trade.proposals.map(x => x.status === 'pending' ? {
        ...x,
        status: 'expired'
      } : x)
    }
  };
}
const AUDIO_DEFAULTS = {
  muted: false,
  voice: true,
  voiceName: '',
  rate: 1.15,
  voiceVol: 1,
  sfx: true,
  sfxVol: 0.7,
  music: false,
  musicVol: 0.35,
  bigSale: 40
};
const audio = (() => {
  let cfg = {
    ...AUDIO_DEFAULTS
  };
  let ctx = null,
    master = null,
    sfxBus = null,
    musicBus = null;
  let musicTimer = null,
    musicStep = 0;
  const said = new Set();
  let speakingPrio = 0;
  const lastPlayed = {};
  const hasSpeech = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  function ensureCtx() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.connect(ctx.destination);
        sfxBus = ctx.createGain();
        sfxBus.connect(master);
        musicBus = ctx.createGain();
        musicBus.connect(master);
        applyGains();
      }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    } catch (e) {
      return null;
    }
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
  if (typeof window !== 'undefined') {
    const unlock = () => {
      if (cfg.muted) return;
      ensureCtx();
      if (cfg.music) startMusic();
    };
    ['pointerdown', 'keydown', 'touchend'].forEach(ev => window.addEventListener(ev, unlock, {
      passive: true
    }));
  }
  function noiseBuffer(sec) {
    const b = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * sec)), ctx.sampleRate);
    const ch = b.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    return b;
  }
  function tone(type, f0, f1, start, dur, vol, dest) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, start);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g);
    g.connect(dest || sfxBus);
    o.start(start);
    o.stop(start + dur + 0.05);
  }
  function noise(start, dur, vol, filterType, freq, dest) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuffer(dur);
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    s.connect(f);
    f.connect(g);
    g.connect(dest || sfxBus);
    s.start(start);
    s.stop(start + dur + 0.05);
  }
  const SFX = {
    bid: t => tone('sine', 880, 1320, t, 0.09, 0.18),
    gavel: t => {
      noise(t, 0.08, 0.9, 'lowpass', 1800);
      tone('triangle', 160, 70, t, 0.25, 0.7);
      noise(t + 0.18, 0.06, 0.5, 'lowpass', 1500);
      tone('triangle', 150, 70, t + 0.18, 0.2, 0.45);
    },
    cheer: t => {
      noise(t, 1.6, 0.35, 'bandpass', 1400);
      noise(t + 0.1, 1.4, 0.25, 'bandpass', 2600);
      [523, 659, 784].forEach((f, i) => tone('triangle', f, 0, t + i * 0.09, 0.35, 0.12));
    },
    buzzer: t => {
      tone('sawtooth', 140, 120, t, 0.45, 0.25);
      tone('square', 147, 125, t, 0.45, 0.12);
    },
    drumroll: t => {
      for (let i = 0; i < 22; i++) noise(t + i * 0.045, 0.05, 0.25 + i * 0.012, 'bandpass', 900);
      noise(t + 22 * 0.045, 0.35, 0.8, 'lowpass', 400);
      tone('sine', 90, 50, t + 22 * 0.045, 0.4, 0.6);
    },
    card: t => [1047, 1319, 1568, 2093].forEach((f, i) => tone('sine', f, 0, t + i * 0.06, 0.18, 0.12)),
    trade: t => {
      tone('triangle', 660, 0, t, 0.2, 0.2);
      tone('triangle', 990, 0, t + 0.14, 0.3, 0.2);
    },
    fanfare: t => [392, 523, 659, 784, 1047].forEach((f, i) => tone('square', f, 0, t + i * 0.12, i === 4 ? 0.6 : 0.16, 0.08)),
    whistle: t => {
      tone('sine', 2100, 2300, t, 0.25, 0.18);
      tone('sine', 2100, 2300, t + 0.32, 0.5, 0.18);
    },
    big: t => {
      SFX.gavel(t);
      [392, 494, 587, 784].forEach((f, i) => tone('sawtooth', f, 0, t + 0.3 + i * 0.07, 0.5, 0.06));
    }
  };
  function play(name) {
    if (cfg.muted || !cfg.sfx || !SFX[name]) return;
    const now = Date.now();
    if (now - (lastPlayed[name] || 0) < 120) return;
    lastPlayed[name] = now;
    try {
      const c = ensureCtx();
      if (!c) return;
      SFX[name](c.currentTime + 0.01);
    } catch (e) {}
  }
  const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  function scheduleBar() {
    if (!ctx) return;
    const t = ctx.currentTime + 0.05;
    const beat = 0.5;
    const ch = CHORDS[musicStep % CHORDS.length];
    ch.forEach(n => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = midi(n);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.3);
      g.gain.linearRampToValueAtTime(0.0001, t + beat * 4);
      o.connect(g);
      g.connect(musicBus);
      o.start(t);
      o.stop(t + beat * 4 + 0.05);
    });
    for (let i = 0; i < 4; i++) {
      tone('sine', midi(ch[0] - 12), 0, t + i * beat, beat * 0.9, 0.12, musicBus);
      noise(t + i * beat + beat / 2, 0.05, 0.05, 'highpass', 6000, musicBus);
    }
    musicStep++;
  }
  function startMusic() {
    if (musicTimer || cfg.muted || !cfg.music) return;
    const c = ensureCtx();
    if (!c) return;
    scheduleBar();
    musicTimer = setInterval(() => {
      try {
        scheduleBar();
      } catch (e) {}
    }, 2000);
  }
  function stopMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }
  function duck(on) {
    if (!ctx || !cfg.music) return;
    try {
      musicBus.gain.setTargetAtTime(cfg.muted ? 0 : on ? cfg.musicVol * 0.15 : cfg.musicVol * 0.5, ctx.currentTime, 0.15);
    } catch (e) {}
  }
  function pickVoice() {
    try {
      const vs = window.speechSynthesis.getVoices() || [];
      if (cfg.voiceName) {
        const v = vs.find(x => x.name === cfg.voiceName);
        if (v) return v;
      }
      const en = vs.filter(v => /^en/i.test(v.lang));
      return en.find(v => /natural|neural|premium|enhanced/i.test(v.name)) || en.find(v => /google|samantha|daniel|alex|aria|guy/i.test(v.name)) || en[0] || vs[0] || null;
    } catch (e) {
      return null;
    }
  }
  let quiet = false;
  function say(text, priority, key) {
    if (quiet || cfg.muted || !cfg.voice || !hasSpeech() || !text) return false;
    if (key) {
      if (said.has(key)) return false;
      said.add(key);
      if (said.size > 400) said.clear();
    }
    try {
      const synth = window.speechSynthesis;
      const busy = synth.speaking || synth.pending;
      if (busy && priority <= speakingPrio && priority < 2) return false;
      if (busy && priority >= speakingPrio) synth.cancel();
      const u = new window.SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = cfg.rate;
      u.pitch = 1.08;
      u.volume = cfg.voiceVol;
      speakingPrio = priority;
      u.onend = u.onerror = () => {
        speakingPrio = 0;
        duck(false);
      };
      duck(true);
      synth.speak(u);
      return true;
    } catch (e) {
      return false;
    }
  }
  return {
    get cfg() {
      return cfg;
    },
    set(next) {
      cfg = {
        ...AUDIO_DEFAULTS,
        ...next
      };
      applyGains();
      if (cfg.muted) {
        try {
          if (hasSpeech()) window.speechSynthesis.cancel();
        } catch (e) {}
        stopMusic();
      } else if (cfg.music) {
        if (ctx) startMusic();
      } else stopMusic();
    },
    play,
    say,
    hasSpeech,
    setQuiet(v) {
      quiet = !!v;
    },
    get quiet() {
      return quiet;
    },
    voices() {
      try {
        return hasSpeech() ? window.speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)) : [];
      } catch (e) {
        return [];
      }
    },
    test() {
      ensureCtx();
      play('gavel');
      say('SOLD to the highest bidder! What a night!', 3);
    },
    resetSaid() {
      said.clear();
    }
  };
})();
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
  skipUsed: ['No takers. {who} uses a skip!', '{who} lets it go. That’s a skip!'],
  dodge: ['No more dodging! {who}, this one’s yours unless someone outbids you!', 'No skips left for {who}! Bid, or it’s yours!'],
  forced: ['No takers, so it goes to {who} for {amt}!', '{who} has to take it! {amt}!'],
  card: ['{who} plays {card}!'],
  vetoed: ['VETOED! Denied!'],
  tradeOffer: ['We’ve got a trade on the table!'],
  tradeDone: ['Deal done! That could be a game-changer!'],
  winner: ['And the winner is… {who}!'],
  goal: ['GOAL! {who}!', 'It’s in! {who} scores!'],
  champion: ['And your champions are… {who}!'],
  tie: ['It’s a tie! {who}!']
};
const callLine = (k, vars) => {
  const ls = CALLS[k];
  const l = ls[Math.floor(Math.random() * ls.length)];
  return l.replace(/\{(\w+)\}/g, (_, v) => vars && vars[v] != null ? vars[v] : '');
};
const isFootball = topic => !!topic && topic.layout === 'pitch';
const ATTRS = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
const ROLE_SHAPE = {
  GK: {
    PAC: 0.55,
    SHO: 0.25,
    PAS: 0.65,
    DRI: 0.45,
    DEF: 1.02,
    PHY: 0.88
  },
  DEF: {
    PAC: 0.82,
    SHO: 0.52,
    PAS: 0.76,
    DRI: 0.72,
    DEF: 1.02,
    PHY: 0.97
  },
  MID: {
    PAC: 0.86,
    SHO: 0.84,
    PAS: 1.02,
    DRI: 0.97,
    DEF: 0.72,
    PHY: 0.82
  },
  FWD: {
    PAC: 0.97,
    SHO: 1.03,
    PAS: 0.82,
    DRI: 0.98,
    DEF: 0.42,
    PHY: 0.82
  }
};
const roleOf = (item, slot) => ROW_OF[norm(item && item.pos)] || ROW_OF[norm(slot)] || 'MID';
const validRating = v => v != null && v !== '' && !isNaN(+v) && +v >= 1 && +v <= 99;
function playerRating(item) {
  const fixed = validRating(item.rating);
  const ovr = fixed ? clamp(Math.round(+item.rating), 1, 99) : clamp(Math.round(68 + itemFame(item) * 27 + (unit('ovr', item.name) - 0.5) * 6), 55, 97);
  const shape = ROLE_SHAPE[roleOf(item)];
  const attrs = {};
  ATTRS.forEach(a => {
    attrs[a] = clamp(Math.round(ovr * shape[a] + (unit('attr', item.name, a) - 0.5) * 10), 20, 99);
  });
  return {
    ovr,
    attrs,
    role: roleOf(item),
    estimated: !fixed
  };
}
function teamRating(d, m) {
  const slots = d.rules.slots;
  const players = m.team.map((t, i) => t ? {
    item: d.items[t.itemId],
    slot: slots[i],
    r: playerRating(d.items[t.itemId])
  } : null).filter(Boolean);
  const ovrs = [...players.map(p => p.r.ovr), ...slots.slice(players.length).map(() => 40)].sort((a, b) => b - a);
  let wsum = 0,
    vsum = 0;
  ovrs.forEach((o, i) => {
    const w = Math.pow(0.92, i);
    wsum += w;
    vsum += w * o;
  });
  const base = ovrs.length ? vsum / wsum : 40;
  const lines = new Set(players.map(p => roleOf(p.item, p.slot)));
  const reasons = [];
  let coverage = 0;
  if (!lines.has('GK')) {
    coverage -= 4;
    reasons.push('No goalkeeper (−4)');
  }
  ['DEF', 'MID', 'FWD'].forEach(l => {
    if (!lines.has(l)) {
      coverage -= 2;
      reasons.push('No ' + l + ' (−2)');
    }
  });
  let chem = 0;
  if (['GK', 'DEF', 'MID', 'FWD'].every(l => lines.has(l))) {
    chem += 1;
    reasons.push('Every line covered (+1)');
  }
  const ties = {};
  players.forEach(p => {
    const k = KIT_RX.filter(([, rx]) => rx.test((p.item.desc || '') + ' ' + p.item.name)).map(([k2]) => k2)[0];
    if (k) ties[k] = (ties[k] || 0) + 1;
  });
  const link = Object.entries(ties).find(([, n]) => n >= 2);
  if (link) {
    chem += 1;
    reasons.push('Shared club/country: ' + link[0].replace(/\b\w/g, c => c.toUpperCase()) + ' (+1)');
  }
  const provisional = players.length < slots.length || !lines.has('GK');
  if (players.length < slots.length) reasons.push(slots.length - players.length + ' empty slot' + (slots.length - players.length === 1 ? '' : 's') + ' count as 40-rated');
  return {
    rating: clamp(Math.round(base + coverage + chem), 1, 99),
    base: Math.round(base * 10) / 10,
    coverage,
    chem,
    provisional,
    reasons,
    players
  };
}
const COMMENT = {
  goal: ['GOAL! {p} finds the net!', 'What a finish from {p}!', '{p} buries it!', 'It’s in! {p} with the goal!', '{p} scores — the crowd erupts!'],
  assist: [' Lovely ball from {a}.', ' {a} with the assist.', ' Set up beautifully by {a}.'],
  yellow: ['Yellow card for {p}.', '{p} goes into the book.'],
  red: ['RED CARD! {p} is sent off!'],
  chance: ['{p} goes close!', 'Big chance for {p}… just wide!', 'Great save to deny {p}!'],
  kickoff: ['And we’re under way!'],
  half: ['Half-time.'],
  full: ['Full-time!'],
  et: ['We’re going to extra time!'],
  pens: ['It’s going to penalties!']
};
const pickLine = (rng, k, vars) => {
  const ls = COMMENT[k];
  return ls[Math.floor(rng() * ls.length)].replace(/\{(\w)\}/g, (_, v) => vars && vars[v] || '');
};
function squad(d, m) {
  const rows = m.team.map((t, i) => t ? {
    name: d.items[t.itemId].name,
    role: roleOf(d.items[t.itemId], d.rules.slots[i]),
    r: playerRating(d.items[t.itemId])
  } : null).filter(Boolean);
  return rows;
}
function strength(sq) {
  if (!sq.length) return {
    att: 1,
    def: 1
  };
  const avg = (rows, fn) => rows.length ? rows.reduce((a, x) => a + fn(x), 0) / rows.length : 40;
  const out = sq.filter(p => p.role !== 'GK');
  const att = avg(out, p => (p.r.attrs.SHO * 1.1 + p.r.attrs.DRI + p.r.attrs.PAS * 0.8 + p.r.attrs.PAC * 0.6) / 3.5);
  const gk = sq.find(p => p.role === 'GK');
  const def = avg(sq.filter(p => p.role !== 'FWD'), p => (p.r.attrs.DEF * 1.1 + p.r.attrs.PHY * 0.7) / 1.8) * 0.75 + (gk ? gk.r.attrs.DEF : 45) * 0.25;
  return {
    att,
    def
  };
}
const weighted = (rng, rows, w) => {
  const tot = rows.reduce((a, x) => a + w(x), 0);
  let u = rng() * tot;
  for (const x of rows) {
    u -= w(x);
    if (u <= 0) return x;
  }
  return rows[rows.length - 1];
};
const avgOf = (rows, fn, fallback) => rows.length ? rows.reduce((a, x) => a + fn(x), 0) / rows.length : fallback;
function strength2(sq, emptySlots) {
  const by = r => sq.filter(p => p.role === r);
  const fwd = by('FWD'),
    mid = by('MID'),
    def = by('DEF'),
    gk = by('GK')[0];
  const outfield = sq.filter(p => p.role !== 'GK');
  const attackers = fwd.length ? [...fwd, ...mid] : mid.length ? mid : outfield;
  const att = avgOf(attackers, p => p.r.attrs.SHO * 0.45 + p.r.attrs.DRI * 0.25 + p.r.attrs.PAC * 0.2 + p.r.attrs.PAS * 0.1, 40);
  const md = avgOf(mid.length ? mid : outfield, p => p.r.attrs.PAS * 0.5 + p.r.attrs.DRI * 0.3 + p.r.attrs.PHY * 0.2, 40);
  const df = avgOf(def.length ? def : outfield, p => p.r.attrs.DEF * 0.6 + p.r.attrs.PHY * 0.25 + p.r.attrs.PAC * 0.15, 40) * (def.length ? 1 : 0.85);
  const keeper = gk ? gk.r.attrs.DEF : 42;
  const depth = Math.max(0.7, 1 - 0.05 * (emptySlots || 0));
  return {
    att: att * depth,
    mid: md * depth,
    def: df * depth,
    gk: keeper
  };
}
function poisson(rng, lambda) {
  const L = Math.exp(-lambda);
  let k = 0,
    p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L && k < 20);
  return k - 1;
}
function expectedGoals(st, home) {
  return [0, 1].map(i => {
    const o = st[1 - i];
    let x = 1.3 * Math.pow(st[i].att / o.def, 1.7) * Math.pow(st[i].mid / o.mid, 0.5) * Math.pow(68 / Math.max(30, o.gk), 0.6);
    if (home === i) x += 0.15;
    return clamp(x, 0.2, 3.2);
  });
}
function simulateMatch(d, A, B, key, knockout, opts) {
  const rng = seeded(d.seed, 'match', key, A.id, B.id);
  const sq = [squad(d, A), squad(d, B)];
  const empty = [A, B].map(m => d.rules.slots.length - m.team.filter(Boolean).length);
  const notes = [];
  if (!sq[0].length || !sq[1].length) {
    const w = sq[0].length ? 0 : 1;
    return {
      v: 2,
      score: [w === 0 ? 3 : 0, w === 1 ? 3 : 0],
      pens: null,
      et: false,
      winner: w,
      events: [{
        min: 0,
        type: 'note',
        text: (w === 0 ? B : A).name + ' has no players, so the match is awarded 3–0.'
      }],
      seqs: [],
      stats: {
        shots: [0, 0],
        possession: [50, 50]
      },
      notes: ['Walkover: a team had no players.'],
      forfeit: true,
      xg: [0, 0]
    };
  }
  sq.forEach((s, i) => {
    if (!s.some(p => p.role === 'GK')) notes.push((i ? B : A).name + ' has no goalkeeper, so an outfield player goes in goal.');
  });
  const st = sq.map((s, i) => strength2(s, empty[i]));
  const home = opts && (opts.home === 0 || opts.home === 1) ? opts.home : null;
  const xg = expectedGoals(st, home);
  const goals = xg.map(x => poisson(rng, x));
  const stoppage = 1 + Math.floor(rng() * 5);
  const seqs = [];
  const pick = (rows, w) => weighted(rng, rows, w);
  const shooterW = p => (p.role === 'FWD' ? 3 : p.role === 'MID' ? 1.5 : p.role === 'DEF' ? 0.4 : 0.02) * p.r.attrs.SHO;
  const outfield = i => sq[i].filter(p => p.role !== 'GK').length ? sq[i].filter(p => p.role !== 'GK') : sq[i];
  const keeperOf = i => (sq[i].find(p => p.role === 'GK') || [...sq[i]].sort((a, b2) => b2.r.attrs.DEF - a.r.attrs.DEF)[0]).name;
  const chainTo = (i, last) => {
    const pool = outfield(i).filter(p => p.name !== last.name);
    const n = Math.min(pool.length, 1 + Math.floor(rng() * 3));
    const used = new Set([last.name]);
    const chain = [];
    for (let k = 0; k < n; k++) {
      const cand = pool.filter(p => !used.has(p.name));
      if (!cand.length) break;
      const w = p => (k === 0 ? p.role === 'DEF' ? 2 : p.role === 'MID' ? 2.5 : 0.6 : p.role === 'MID' ? 2.5 : p.role === 'FWD' ? 1.8 : 0.5) * p.r.attrs.PAS;
      const p = pick(cand, w);
      used.add(p.name);
      chain.push(p.name);
    }
    chain.push(last.name);
    return chain;
  };
  const minutesUsed = new Set();
  const minuteIn = (lo, hi) => {
    for (let t = 0; t < 40; t++) {
      const m = lo + Math.floor(rng() * (hi - lo + 1));
      if (!minutesUsed.has(m)) {
        minutesUsed.add(m);
        return m;
      }
    }
    return lo + Math.floor(rng() * (hi - lo + 1));
  };
  const addMoves = (lo, hi, gl, scaleChances, inET) => {
    const start = seqs.length;
    [0, 1].forEach(i => {
      for (let g = 0; g < gl[i]; g++) {
        const scorer = pick(outfield(i), shooterW);
        const chain = chainTo(i, scorer);
        const assist = chain.length > 1 && rng() < 0.8 ? chain[chain.length - 2] : null;
        seqs.push({
          min: minuteIn(lo, hi),
          team: i,
          kind: 'goal',
          chain,
          shooter: scorer.name,
          assist,
          keeper: keeperOf(1 - i),
          side: rng() < 0.5 ? -1 : 1
        });
      }
      const chances = Math.round((1 + poisson(rng, xg[i] * 2.1)) * scaleChances);
      for (let c = 0; c < chances; c++) {
        const shooter = pick(outfield(i), shooterW);
        const u = rng();
        const kind = u < 0.45 ? 'save' : u < 0.8 ? 'miss' : 'block';
        const blocker = kind === 'block' ? pick(outfield(1 - i), p => p.r.attrs.DEF + (p.role === 'DEF' ? 30 : 0)).name : null;
        seqs.push({
          min: minuteIn(lo, hi),
          team: i,
          kind,
          chain: chainTo(i, shooter),
          shooter: shooter.name,
          keeper: keeperOf(1 - i),
          blocker,
          side: rng() < 0.5 ? -1 : 1
        });
      }
    });
    const breaks = Math.round((4 + Math.floor(rng() * 4)) * scaleChances);
    for (let k = 0; k < breaks; k++) {
      const i = rng() < st[0].mid / (st[0].mid + st[1].mid) ? 1 : 0;
      const carrier = pick(outfield(i), p => (p.role === 'MID' ? 2 : 1) * p.r.attrs.DRI);
      const tackler = pick(outfield(1 - i), p => (p.role === 'DEF' ? 2 : p.role === 'MID' ? 1.5 : 0.6) * p.r.attrs.DEF);
      seqs.push({
        min: minuteIn(lo, hi),
        team: i,
        kind: rng() < 0.5 ? 'tackle' : 'intercept',
        chain: chainTo(i, carrier),
        tackler: tackler.name,
        side: rng() < 0.5 ? -1 : 1
      });
    }
    if (inET) for (let k = start; k < seqs.length; k++) seqs[k].et = true;
  };
  addMoves(1, 90 + stoppage, goals, 1);
  let et = false,
    pens = null;
  const etGoals = [0, 0];
  if (knockout && goals[0] === goals[1]) {
    et = true;
    const extra = xg.map(x => poisson(rng, x * 0.3));
    etGoals[0] = extra[0];
    etGoals[1] = extra[1];
    minutesUsed.clear();
    addMoves(91, 120, extra, 0.35, true);
  }
  seqs.sort((a, b2) => (a.et ? 1 : 0) - (b2.et ? 1 : 0) || a.min - b2.min);
  const score = [goals[0] + etGoals[0], goals[1] + etGoals[1]];
  const events = [{
    min: 0,
    type: 'kickoff',
    text: pickLine(rng, 'kickoff')
  }];
  const run = [0, 0];
  const cards = [{}, {}];
  const shots = [0, 0];
  let halfDone = false,
    fullDone = false,
    etDone = false;
  seqs.forEach((q, idx) => {
    if (!halfDone && q.min > 45) {
      halfDone = true;
      events.push({
        min: 45,
        type: 'half',
        score: [...run],
        text: pickLine(rng, 'half')
      });
    }
    if (q.et && !fullDone) {
      fullDone = true;
      if (!halfDone) {
        halfDone = true;
        events.push({
          min: 45,
          type: 'half',
          score: [...run],
          text: pickLine(rng, 'half')
        });
      }
      events.push({
        min: 90 + stoppage,
        type: 'full',
        score: [...run],
        text: pickLine(rng, 'full')
      });
    }
    if (q.et && !etDone) {
      etDone = true;
      events.push({
        min: 91,
        type: 'et',
        text: pickLine(rng, 'et')
      });
    }
    q.i = idx;
    if (q.kind === 'goal') {
      run[q.team]++;
      shots[q.team]++;
      events.push({
        min: q.min,
        type: 'goal',
        team: q.team,
        player: q.shooter,
        assist: q.assist,
        score: [...run],
        seq: idx,
        text: pickLine(rng, 'goal', {
          p: q.shooter
        }) + (q.assist ? pickLine(rng, 'assist', {
          a: q.assist
        }) : '')
      });
    } else if (q.kind === 'save' || q.kind === 'miss' || q.kind === 'block') {
      shots[q.team]++;
      const text = q.kind === 'save' ? 'Great save by ' + q.keeper + ' to deny ' + q.shooter + '!' : q.kind === 'miss' ? q.shooter + ' shoots… just wide!' : q.blocker + ' throws himself in front of ' + q.shooter + '’s shot!';
      events.push({
        min: q.min,
        type: 'chance',
        team: q.team,
        player: q.shooter,
        seq: idx,
        text
      });
    } else {
      const text = q.kind === 'tackle' ? 'Strong tackle from ' + q.tackler + ' to win it back.' : q.tackler + ' reads the pass and intercepts.';
      events.push({
        min: q.min,
        type: 'tackle',
        team: 1 - q.team,
        player: q.tackler,
        seq: idx,
        text
      });
      if (rng() < 0.12) {
        const t = 1 - q.team;
        const p = q.tackler;
        if (cards[t][p] || rng() < 0.05) {
          events.push({
            min: q.min,
            type: 'red',
            team: t,
            player: p,
            text: pickLine(rng, 'red', {
              p
            })
          });
        } else {
          cards[t][p] = 1;
          events.push({
            min: q.min,
            type: 'yellow',
            team: t,
            player: p,
            text: pickLine(rng, 'yellow', {
              p
            })
          });
        }
      }
    }
  });
  if (!halfDone) events.push({
    min: 45,
    type: 'half',
    score: [0, 1].map(t => seqs.filter(q => q.kind === 'goal' && q.team === t && !q.et && q.min <= 45).length),
    text: pickLine(rng, 'half')
  });
  if (!fullDone) events.push({
    min: 90 + stoppage,
    type: 'full',
    score: [goals[0], goals[1]],
    text: pickLine(rng, 'full')
  });
  if (et && !etDone) events.push({
    min: 91,
    type: 'et',
    text: pickLine(rng, 'et')
  });
  if (et && score[0] === score[1]) {
    events.push({
      min: 120,
      type: 'pens',
      text: pickLine(rng, 'pens')
    });
    pens = [0, 0];
    const gkr = sq.map(s => (s.find(p => p.role === 'GK') || {
      r: {
        attrs: {
          DEF: 50
        }
      }
    }).r.attrs.DEF);
    const takers = sq.map(s => [...s].sort((a, b2) => b2.r.attrs.SHO - a.r.attrs.SHO));
    for (let k = 0; k < 30; k++) {
      for (let i = 0; i < 2; i++) {
        const p = takers[i][k % takers[i].length];
        const scored = rng() < clamp(0.62 + (p.r.attrs.SHO - gkr[1 - i]) / 220, 0.45, 0.9);
        if (scored) pens[i]++;
        events.push({
          min: 120,
          type: 'pen',
          team: i,
          player: p.name,
          scored,
          pens: [...pens],
          keeper: keeperOf(1 - i),
          side: rng() < 0.5 ? -1 : 1,
          text: p.name + (scored ? ' scores!' : ' misses!')
        });
      }
      if (k >= 4 && pens[0] !== pens[1]) break;
      if (k < 4) {
        const left = 4 - k;
        if (pens[0] > pens[1] + left || pens[1] > pens[0] + left) break;
      }
    }
  }
  const winner = score[0] !== score[1] ? score[0] > score[1] ? 0 : 1 : pens ? pens[0] > pens[1] ? 0 : 1 : null;
  const poss0 = clamp(Math.round(50 + (st[0].mid - st[1].mid) * 0.8 + (rng() - 0.5) * 6), 30, 70);
  return {
    v: 2,
    score,
    et,
    pens,
    winner,
    events,
    seqs,
    stats: {
      shots,
      possession: [poss0, 100 - poss0]
    },
    notes,
    xg: xg.map(x => Math.round(x * 100) / 100),
    stoppage,
    home
  };
}
function seedTeams(d) {
  const score = m => isFootball(d.topic) ? teamRating(d, m).rating : teamScore(d, m, null);
  return [...d.managers].filter(m => m.team.some(Boolean)).sort((a, b) => score(b) - score(a) || (a.id < b.id ? -1 : 1));
}
function buildBracket(d) {
  const seeds = seedTeams(d);
  let size = 1;
  while (size < seeds.length) size *= 2;
  let order = [1];
  while (order.length < size) order = order.flatMap(s => [s, order.length * 2 + 1 - s]);
  const slot = n => n <= seeds.length ? seeds[n - 1].id : null;
  const first = [];
  for (let i = 0; i < size; i += 2) first.push({
    id: 'r0m' + i / 2,
    a: slot(order[i]),
    b: slot(order[i + 1])
  });
  const rounds = [first];
  while (rounds[rounds.length - 1].length > 1) {
    const prev = rounds[rounds.length - 1];
    const next = [];
    for (let i = 0; i < prev.length; i += 2) next.push({
      id: 'r' + rounds.length + 'm' + i / 2,
      a: null,
      b: null
    });
    rounds.push(next);
  }
  return advanceBracket({
    rounds: rounds.map(r => r.map(m => ({
      ...m,
      winner: null,
      votes: {},
      match: null,
      why: ''
    })))
  });
}
function advanceBracket(b) {
  const rounds = b.rounds.map(r => r.map(m => ({
    ...m
  })));
  for (let r = 0; r < rounds.length; r++) {
    rounds[r].forEach((m, i) => {
      let ready = true;
      if (r > 0) {
        const f1 = rounds[r - 1][i * 2],
          f2 = rounds[r - 1][i * 2 + 1];
        ready = !!(f1.winner && f2.winner);
        m.a = f1.winner && f1.winner !== 'none' ? f1.winner : null;
        m.b = f2.winner && f2.winner !== 'none' ? f2.winner : null;
      }
      if (m.winner || !ready) return;
      if (m.a && !m.b) {
        m.winner = m.a;
        m.why = 'Bye';
      } else if (m.b && !m.a) {
        m.winner = m.b;
        m.why = 'Bye';
      } else if (!m.a && !m.b) m.winner = 'none';
    });
  }
  const final = rounds[rounds.length - 1][0];
  return {
    ...b,
    rounds,
    champion: final.winner && final.winner !== 'none' ? final.winner : null
  };
}
function nextMatchup(b) {
  for (let r = 0; r < b.rounds.length; r++) for (let i = 0; i < b.rounds[r].length; i++) {
    const m = b.rounds[r][i];
    if (!m.winner && m.a && m.b) return {
      r,
      i,
      m
    };
  }
  return null;
}
function matchVoters(d, m) {
  const ppl = participants(d);
  const neutral = ppl.filter(p => p.teamId !== m.a && p.teamId !== m.b);
  return neutral.length ? neutral : ppl;
}
const canVoteFor = (p, teamId) => p.teamId !== teamId;
function matchupVoteBot(d, p, m) {
  const choices = [m.a, m.b].filter(id => canVoteFor(p, id)).map(id => teamOf(d, id));
  if (choices.length < 2) return choices[0] ? choices[0].id : null;
  const judge = {
    ...teamOf(d, p.teamId),
    name: p.name,
    bot: p.bot,
    speaker: p.id
  };
  const rng = seeded(d.seed, 'mvote', m.id, p.id, m.revoted ? 'again' : '');
  const sc = t => (isFootball(d.topic) ? teamRating(d, t).rating * 3 : 0) + teamScore(d, t, judge) * (1 + (rng() - 0.5) * 0.25);
  return sc(choices[0]) >= sc(choices[1]) ? choices[0].id : choices[1].id;
}
function decideMatchup(d, m, mode, fin) {
  const va = Object.values(m.votes || {}).filter(v => v === m.a).length,
    vb = Object.values(m.votes || {}).filter(v => v === m.b).length;
  const A = teamOf(d, m.a),
    B = teamOf(d, m.b);
  const rating = t => isFootball(d.topic) ? teamRating(d, t).rating : Math.round(teamScore(d, t, null));
  const tieBreak = () => {
    const ra = rating(A),
      rb = rating(B);
    if (ra !== rb) return ra > rb ? A : B;
    return unit('coin', d.seed, m.id) < 0.5 ? A : B;
  };
  if (mode === 'bracket') {
    if (va === vb && fin && fin.tiebreak === 'revote' && !m.revoted) return {
      revote: true,
      why: 'Tied ' + va + '–' + vb + '. Vote again!'
    };
    if (va !== vb) {
      const w = va > vb ? A : B;
      return {
        winner: w.id,
        why: w.name + ' won the vote ' + Math.max(va, vb) + '–' + Math.min(va, vb) + '.'
      };
    }
    const w = tieBreak();
    return {
      winner: w.id,
      why: 'Tied ' + va + '–' + vb + ' on votes; ' + w.name + ' goes through as the higher-rated team.'
    };
  }
  const mt = m.match;
  if (mode === 'sim') {
    const w = mt.winner === 0 ? A : B;
    if (mt.pens) return {
      winner: w.id,
      why: 'It finished ' + mt.score[0] + '–' + mt.score[1] + ' after extra time; ' + w.name + ' won ' + Math.max(...mt.pens) + '–' + Math.min(...mt.pens) + ' on penalties.'
    };
    return {
      winner: w.id,
      why: w.name + ' won ' + mt.score[mt.winner] + '–' + mt.score[1 - mt.winner] + (mt.et ? ' after extra time' : '') + '.'
    };
  }
  const wMatch = clamp((fin.weight != null ? fin.weight : 60) / 100, 0, 1);
  const perfA = (mt.score[0] + 0.5) / (mt.score[0] + mt.score[1] + 1);
  const voteA = va + vb ? va / (va + vb) : 0.5;
  const total = wMatch * perfA + (1 - wMatch) * voteA;
  const detail = 'Match ' + Math.round(perfA * 100) + '% × ' + Math.round(wMatch * 100) + '% + votes ' + Math.round(voteA * 100) + '% × ' + Math.round((1 - wMatch) * 100) + '% = ' + Math.round(total * 100) + '% for ' + A.name;
  if (Math.abs(total - 0.5) < 1e-9) {
    const w = mt.winner === 0 ? A : B;
    return {
      winner: w.id,
      why: 'Dead level on the combined score, so the match result decides: ' + w.name + (mt.pens ? ' on penalties.' : mt.et ? ' after extra time.' : ' won the match.'),
      detail
    };
  }
  const w = total > 0.5 ? A : B;
  return {
    winner: w.id,
    why: w.name + ' wins on the combined score (' + Math.round((w === A ? total : 1 - total) * 100) + '%).',
    detail
  };
}
const finaleMode = d => {
  const f = d.rules && d.rules.finale || {};
  const m = f.mode || 'vote';
  return !isFootball(d.topic) && (m === 'sim' || m === 'combined') ? 'bracket' : m;
};
const FINALE_DEFAULTS = {
  mode: 'vote',
  weight: 60,
  speed: 'normal',
  commentary: true,
  tiebreak: 'rating',
  home: false
};
const needsVote = mode => mode === 'bracket' || mode === 'combined';
const needsMatch = mode => mode === 'sim' || mode === 'combined';
const finCfg = d => ({
  ...FINALE_DEFAULTS,
  ...(d.rules && d.rules.finale || {})
});
const getMatchup = (d, r, i) => d.finale.bracket.rounds[r][i];
function withMatchup(d, r, i, patch) {
  const rounds = d.finale.bracket.rounds.map((row, ri) => ri === r ? row.map((m, mi) => mi === i ? {
    ...m,
    ...patch
  } : m) : row);
  const bracket = advanceBracket({
    ...d.finale.bracket,
    rounds
  });
  const champion = bracket.champion || null;
  return {
    ...d,
    finale: {
      ...d.finale,
      bracket,
      champion
    },
    votesRevealed: champion ? true : !!d.votesRevealed
  };
}
function startFinale(d) {
  if (d.finale && d.finale.bracket) return d;
  const bracket = buildBracket(d);
  const champion = bracket.champion || null;
  return {
    ...d,
    votes: {},
    finale: {
      mode: finaleMode(d),
      bracket,
      champion,
      startedAt: Date.now()
    },
    votesRevealed: !!champion
  };
}
const hasMatchVote = (m, id) => Object.prototype.hasOwnProperty.call(m.votes || {}, id);
function matchVoteProblem(d, m, voterId, teamId) {
  if (!m || m.winner) return 'This matchup is already decided.';
  if (!m.a || !m.b) return 'This matchup isn’t ready yet.';
  const v = matchVoters(d, m).find(p => p.id === voterId);
  if (!v) return 'That player doesn’t vote on this matchup.';
  if (hasMatchVote(m, voterId)) return 'Already voted.';
  if (teamId !== m.a && teamId !== m.b) return 'That team isn’t in this matchup.';
  if (!canVoteFor(v, teamId)) return 'You can’t vote for your own team.';
  return null;
}
function castMatchVote(d, r, i, voterId, teamId) {
  const m = getMatchup(d, r, i);
  if (matchVoteProblem(d, m, voterId, teamId)) return d;
  return withMatchup(d, r, i, {
    votes: {
      ...(m.votes || {}),
      [voterId]: teamId
    }
  });
}
function botMatchVotes(d, r, i) {
  let n = d;
  matchVoters(d, getMatchup(d, r, i)).filter(p => p.bot).forEach(p => {
    const m = getMatchup(n, r, i);
    if (!hasMatchVote(m, p.id)) n = castMatchVote(n, r, i, p.id, matchupVoteBot(n, p, m));
  });
  return n;
}
const votingDone = (d, m) => matchVoters(d, m).every(p => hasMatchVote(m, p.id));
function playMatchup(d, r, i) {
  const m = getMatchup(d, r, i);
  if (!m.a || !m.b || m.match || m.winner) return d;
  const A = teamOf(d, m.a),
    B = teamOf(d, m.b);
  let home = null;
  if (finCfg(d).home) {
    const ra = teamRating(d, A).rating,
      rb = teamRating(d, B).rating;
    home = ra >= rb ? 0 : 1;
  }
  return withMatchup(d, r, i, {
    match: simulateMatch(d, A, B, m.id, true, {
      home
    })
  });
}
function resolveMatchup(d, r, i) {
  const m = getMatchup(d, r, i);
  const mode = d.finale.mode;
  if (m.winner || !m.a || !m.b) return d;
  if (needsMatch(mode) && !m.match) return d;
  const res = decideMatchup(d, m, mode, finCfg(d));
  if (res.revote) return withMatchup(d, r, i, {
    votes: {},
    revoted: true,
    note: res.why
  });
  return withMatchup(d, r, i, {
    winner: res.winner,
    why: res.why,
    detail: res.detail || ''
  });
}
function roundName(total, r) {
  const left = total - r;
  return left === 1 ? 'Final' : left === 2 ? 'Semi-finals' : left === 3 ? 'Quarter-finals' : 'Round of ' + Math.pow(2, left);
}
const playedMatchups = b => b.rounds.flatMap((row, r) => row.map((m, i) => ({
  m,
  r,
  i
}))).filter(x => x.m.a && x.m.b && x.m.winner && x.m.winner !== 'none');
function finaleStandings(d) {
  const b = d.finale.bracket;
  const R = b.rounds.length;
  const out = {};
  d.managers.forEach(t => {
    out[t.id] = {
      team: t,
      label: t.team.some(Boolean) ? 'Still in' : 'No players',
      rank: t.team.some(Boolean) ? R : -1
    };
  });
  b.rounds.forEach((row, r) => row.forEach(m => {
    if (!m.winner || m.winner === 'none' || !m.a || !m.b) return;
    const loser = m.winner === m.a ? m.b : m.a;
    out[loser] = {
      ...out[loser],
      label: r === R - 1 ? 'Runner-up' : 'Out in the ' + roundName(R, r),
      rank: r
    };
  }));
  if (d.finale.champion && out[d.finale.champion]) out[d.finale.champion] = {
    ...out[d.finale.champion],
    label: 'Champion',
    rank: R + 1
  };
  return Object.values(out).sort((a, b2) => b2.rank - a.rank);
}
function finaleRecord(d, teamId) {
  const rec = {
    played: 0,
    won: 0,
    gf: 0,
    ga: 0
  };
  if (!d.finale || !d.finale.bracket) return rec;
  playedMatchups(d.finale.bracket).forEach(({
    m
  }) => {
    if (m.a !== teamId && m.b !== teamId) return;
    rec.played++;
    if (m.winner === teamId) rec.won++;
    if (m.match) {
      const k = m.a === teamId ? 0 : 1;
      rec.gf += m.match.score[k];
      rec.ga += m.match.score[1 - k];
    }
  });
  return rec;
}
function championStory(d) {
  const f = d.finale;
  if (!f || !f.champion) return '';
  const champ = teamOf(d, f.champion);
  const games = playedMatchups(f.bracket).filter(({
    m
  }) => m.a === champ.id || m.b === champ.id);
  if (!games.length) return champ.name + ' was the only team with players, so they win by default.';
  const bits = [];
  const rec = finaleRecord(d, champ.id);
  if (needsMatch(f.mode)) bits.push('Won ' + rec.won + ' of ' + rec.played + ' match' + (rec.played === 1 ? '' : 'es') + ', scoring ' + rec.gf + ' and conceding ' + rec.ga + '.');else bits.push('Won ' + rec.won + ' head-to-head vote' + (rec.won === 1 ? '' : 's') + '.');
  if (isFootball(d.topic)) {
    const tr = teamRating(d, champ);
    const all = d.managers.filter(m => m.team.some(Boolean)).map(m => teamRating(d, m).rating).sort((a, b) => b - a);
    const pos = all.indexOf(tr.rating) + 1;
    bits.push('Team rating ' + tr.rating + (pos === 1 ? ', the highest in the draft.' : ', ranked ' + pos + ' of ' + all.length + (pos > 1 ? ' — an upset run.' : '.')));
  }
  const fin = games[games.length - 1].m;
  if (fin.why) bits.push('Final: ' + fin.why);
  return bits.join(' ');
}
function goldenBoot(d) {
  if (!d.finale || !d.finale.bracket) return null;
  const g = {};
  playedMatchups(d.finale.bracket).forEach(({
    m
  }) => (m.match ? m.match.events : []).forEach(e => {
    if (e.type === 'goal') {
      const team = e.team === 0 ? m.a : m.b;
      const k = team + '|' + e.player;
      g[k] = (g[k] || 0) + 1;
    }
  }));
  const top = Object.entries(g).sort((a, b) => b[1] - a[1])[0];
  return top ? {
    teamId: top[0].split('|')[0],
    player: top[0].slice(top[0].indexOf('|') + 1),
    goals: top[1]
  } : null;
}
const SHARE_PREFIX = 'DN1.';
const SHARE_PREFIX_RAW = 'DN0.';
const MAX_LINK = 7000;
const clip = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
const b64url = bytes => {
  let s = '';
  bytes.forEach(b => {
    s += String.fromCharCode(b);
  });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64url = str => {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
};
async function pipeBytes(bytes, stream) {
  const s = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(s).arrayBuffer());
}
const canCompress = () => typeof window !== 'undefined' && typeof window.CompressionStream === 'function' && typeof window.DecompressionStream === 'function';
function packTopic(t, withPhotos) {
  return {
    v: 1,
    n: t.name,
    e: t.emoji,
    s: t.slots,
    l: t.layout || 'list',
    a: t.art || 'emoji',
    ks: t.kitShape || '',
    kl: t.kitLabel || '',
    ph: !!t.photos,
    f: t.folder || '',
    i: t.items.map(it => {
      const r = [it.name, it.pos || '', it.desc || '', it.emoji || '', it.imageUrl || '', it.wiki || '', it.kit || null, it.photosOff ? 1 : 0];
      if (withPhotos && it.photo) r.push(it.photo);
      if (validRating(it.rating)) {
        while (r.length < 9) r.push('');
        r[9] = Math.round(+it.rating);
      }
      return r;
    })
  };
}
function unpackTopic(o) {
  if (!o || o.v !== 1 || typeof o.n !== 'string' || !Array.isArray(o.s) || !Array.isArray(o.i)) return {
    ok: false,
    error: 'That isn’t a Draft Night topic.'
  };
  if (o.i.length > 600) return {
    ok: false,
    error: 'That topic has too many items (600 max).'
  };
  const slots = o.s.map(x => clip(String(x), 20)).filter(Boolean).slice(0, 16);
  if (!slots.length) return {
    ok: false,
    error: 'That topic has no slots.'
  };
  const goodUrl = u => typeof u === 'string' && /^https:\/\//.test(u) ? u.slice(0, 2000) : '';
  const goodPhoto = p => typeof p === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,/.test(p) && p.length < 400000 ? p : '';
  const goodColor = c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : null;
  const items = o.i.filter(r => Array.isArray(r) && typeof r[0] === 'string' && r[0].trim()).map(r => {
    const it = {
      id: uid(),
      name: clip(r[0], 80).trim(),
      pos: clip(r[1], 20),
      desc: clip(r[2], 120),
      emoji: clip(r[3], 12),
      photo: goodPhoto(r[8])
    };
    if (goodUrl(r[4])) it.imageUrl = goodUrl(r[4]);
    if (r[5]) it.wiki = clip(r[5], 120);
    if (Array.isArray(r[6]) && goodColor(r[6][0]) && goodColor(r[6][1])) it.kit = [goodColor(r[6][0]), goodColor(r[6][1])];
    if (r[7]) it.photosOff = true;
    if (validRating(r[9])) it.rating = Math.round(+r[9]);
    return it;
  });
  if (!items.length) return {
    ok: false,
    error: 'That topic has no items.'
  };
  return {
    ok: true,
    topic: {
      id: uid(),
      name: clip(o.n, 60).trim() || 'Shared topic',
      emoji: clip(o.e, 12) || '🎲',
      slots,
      layout: o.l === 'pitch' ? 'pitch' : 'list',
      art: o.a === 'kit' ? 'kit' : 'emoji',
      kitShape: o.ks === 'tank' ? 'tank' : '',
      kitLabel: o.kl === 'initials' ? 'initials' : '',
      photos: !!o.ph,
      folder: clip(o.f, 24) || 'My Topics',
      items
    }
  };
}
function topicCode(t) {
  const sig = JSON.stringify([t.name, t.slots, t.items.map(i => [i.name, i.pos || '', i.desc || ''])]);
  const A = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let h = hashStr(sig),
    h2 = hashStr(sig + '#'),
    out = '';
  for (let i = 0; i < 6; i++) {
    const n = i < 3 ? h : h2;
    out += A[(n >>> i % 3 * 7) % A.length];
  }
  return 'DN-' + out;
}
async function encodeTopic(t, withPhotos) {
  const bytes = new TextEncoder().encode(JSON.stringify(packTopic(t, withPhotos)));
  if (canCompress()) {
    try {
      return SHARE_PREFIX + b64url(await pipeBytes(bytes, new window.CompressionStream('deflate-raw')));
    } catch (e) {}
  }
  return SHARE_PREFIX_RAW + b64url(bytes);
}
async function decodeShared(text) {
  const raw = (text || '').trim();
  if (!raw) return {
    ok: false,
    error: 'Paste a share link or code first.'
  };
  if (raw.startsWith('{')) {
    try {
      const f = JSON.parse(raw);
      return f && f.app === 'draft-night-topic' ? unpackTopic(f.topic) : {
        ok: false,
        error: 'That file isn’t a Draft Night topic.'
      };
    } catch (e) {
      return {
        ok: false,
        error: 'That file isn’t a Draft Night topic.'
      };
    }
  }
  if (/^DN-[0-9A-Z]{6}$/i.test(raw)) return {
    ok: false,
    error: 'That’s a topic fingerprint, not the topic itself. Ask your friend for the share link, the long share code, or the topic file.'
  };
  const m = raw.match(/(DN[01]\.[A-Za-z0-9_-]+)/);
  if (!m) return {
    ok: false,
    error: 'That doesn’t look like a Draft Night share link or code.'
  };
  try {
    const code = m[1];
    const body = unb64url(code.slice(4));
    const bytes = code.startsWith(SHARE_PREFIX) ? canCompress() ? await pipeBytes(body, new window.DecompressionStream('deflate-raw')) : null : body;
    if (!bytes) return {
      ok: false,
      error: 'This browser can’t open compressed share codes. Ask for the topic file instead.'
    };
    return unpackTopic(JSON.parse(new TextDecoder().decode(bytes)));
  } catch (e) {
    return {
      ok: false,
      error: 'That share code is damaged or incomplete. Copy the whole link again.'
    };
  }
}
const shareLink = code => location.origin + location.pathname + '#topic=' + code;
const topicFile = t => new Blob([JSON.stringify({
  app: 'draft-night-topic',
  format: 1,
  topic: packTopic(t, true)
})], {
  type: 'application/json'
});
const nameKey = n => (n || '').trim().toLowerCase();
function humanPlayers(d) {
  if (d.teamMode) return d.managers.flatMap(t => (t.members || []).filter(p => !p.bot).map(p => ({
    key: nameKey(p.name),
    name: p.name,
    emoji: p.emoji,
    teamId: t.id,
    teamName: t.name,
    share: 1 / Math.max(1, (t.members || []).filter(x => !x.bot).length)
  })));
  return d.managers.filter(m => !m.bot).map(m => ({
    key: nameKey(m.name),
    name: m.name,
    emoji: m.emoji,
    teamId: m.id,
    teamName: m.name,
    share: 1
  }));
}
const finished = d => d && d.votesRevealed && d.phase === 'done';
function priceGaps(d) {
  const buys = [];
  d.managers.forEach(m => m.team.forEach((t, i) => {
    if (t && !t.free && !t.stolen) buys.push({
      team: m,
      item: d.items[t.itemId],
      price: t.price,
      key: norm(d.items[t.itemId].pos || d.rules.slots[i])
    });
  }));
  const groups = {};
  buys.forEach(b => {
    (groups[b.key] = groups[b.key] || []).push(b.price);
  });
  return buys.filter(b => groups[b.key].length >= 2).map(b => {
    const others = groups[b.key].length - 1;
    const avg = (groups[b.key].reduce((a, x) => a + x, 0) - b.price) / others;
    return {
      ...b,
      avg,
      gap: b.price - avg
    };
  });
}
function computeAwards(d) {
  const out = [];
  const add = (id, emoji, title, team, why) => out.push({
    id,
    emoji,
    title,
    teamId: team.id,
    team: team.name,
    why
  });
  const fair = d.rules.budget / d.rules.slots.length;
  const gaps = priceGaps(d);
  if (gaps.length) {
    const b = gaps.reduce((a, x) => x.gap < a.gap ? x : a);
    if (b.gap <= -1) add('bargain', '🏷️', 'Best Bargain', b.team, b.item.name + ' for ' + money(b.price) + ', ' + money(Math.round(-b.gap)) + ' under the average paid for other ' + (b.item.pos || 'items') + ' this draft (' + money(Math.round(b.avg)) + ').');
    const o = gaps.reduce((a, x) => x.gap > a.gap ? x : a);
    if (o.gap >= 2) add('overpay', '💸', 'Biggest Overpay', o.team, o.item.name + ' for ' + money(o.price) + ', ' + money(Math.round(o.gap)) + ' over the average paid for other ' + (o.item.pos || 'items') + ' this draft (' + money(Math.round(o.avg)) + ').');
  }
  const spends = d.managers.map(m => ({
    m,
    s: d.rules.budget - m.budget
  }));
  const top = spends.reduce((a, x) => x.s > a.s ? x : a);
  if (top.s > 0) add('spender', '🤑', 'Big Spender', top.m, 'Spent ' + money(top.s) + ', the most of anyone.');
  if (d.finale && d.finale.champion) {
    const champ = teamOf(d, d.finale.champion);
    if (champ.budget > 0) add('pincher', '🪙', 'Penny Pincher', champ, 'Won the title and still kept ' + money(champ.budget) + '.');
    const games = playedMatchups(d.finale.bracket);
    const last = games[games.length - 1];
    if (last && last.m.winner === champ.id) {
      const lm = last.m;
      const loser = teamOf(d, lm.winner === lm.a ? lm.b : lm.a);
      const va = Object.values(lm.votes || {}).filter(v => v === lm.winner).length,
        vb = Object.values(lm.votes || {}).length - va;
      if (lm.match && lm.match.pens) add('robbed', '😤', 'Most Robbed', loser, 'Lost the final on penalties.');else if (lm.match && Math.abs(lm.match.score[0] - lm.match.score[1]) === 1 && d.finale.mode === 'sim') add('robbed', '😤', 'Most Robbed', loser, 'Lost the final by a single goal.');else if (d.finale.mode === 'bracket' && va - vb === 1) add('robbed', '😤', 'Most Robbed', loser, 'Lost the final by a single vote.');
    }
    if (isFootball(d.topic)) {
      const giant = games.map(({
        m
      }) => {
        const w = teamOf(d, m.winner),
          l = teamOf(d, m.winner === m.a ? m.b : m.a);
        return {
          w,
          l,
          gap: teamRating(d, l).rating - teamRating(d, w).rating
        };
      }).filter(x => x.gap >= 3).sort((a, b) => b.gap - a.gap)[0];
      if (giant) add('giant', '🪓', 'Giant Killer', giant.w, 'Knocked out ' + giant.l.name + ', rated ' + giant.gap + ' higher.');
    }
    const boot = goldenBoot(d);
    if (boot) add('boot', '👟', 'Golden Boot', teamOf(d, boot.teamId), boot.player + ' scored ' + boot.goals + ' goal' + (boot.goals === 1 ? '' : 's') + ' in the finale.');
  } else if (d.votesRevealed) {
    const {
      counts,
      winners
    } = tally(d);
    const sorted = Object.values(counts).sort((a, b) => b - a);
    const median = sorted[Math.floor(sorted.length / 2)] || 0;
    const strong = d.managers.filter(m => counts[m.id] >= Math.max(1, median));
    if (strong.length) {
      const p = strong.reduce((a, m) => m.budget > a.budget ? m : a);
      if (p.budget > 0) add('pincher', '🪙', 'Penny Pincher', p, 'Kept ' + money(p.budget) + ' and still got ' + counts[p.id] + ' vote' + (counts[p.id] === 1 ? '' : 's') + '.');
    }
    if (winners.length === 1) {
      const best = counts[winners[0].id];
      d.managers.filter(m => counts[m.id] === best - 1 && best - 1 > 0).forEach(m => add('robbed', '😤', 'Most Robbed', m, 'Lost the vote by a single vote (' + counts[m.id] + ' to ' + best + ').'));
    }
  }
  const countBy = fn => d.managers.map(m => ({
    m,
    n: fn(m)
  })).filter(x => x.n > 0).sort((a, b) => b.n - a.n);
  const log = d.cardLog || [];
  const chaos = countBy(m => log.filter(e => e.by === m.id && e.result === 'done').length);
  if (chaos.length) add('chaos', '🃏', 'Chaos Agent', chaos[0].m, chaos[0].n + ' Chaos Card' + (chaos[0].n === 1 ? '' : 's') + ' played successfully.');
  const trades = d.trade ? d.trade.proposals.filter(t => t.status === 'accepted') : [];
  const tm = countBy(m => trades.filter(t => t.from === m.id || t.to === m.id).length);
  if (tm.length) add('trade', '🤝', 'Trade Master', tm[0].m, tm[0].n + ' trade' + (tm[0].n === 1 ? '' : 's') + ' completed.');
  const mys = countBy(m => m.team.filter(t => t && d.items[t.itemId].mystery).length);
  if (mys.length) add('mystery', '❓', 'Mystery Master', mys[0].m, 'Won ' + mys[0].n + ' mystery item' + (mys[0].n === 1 ? '' : 's') + '.');
  const leg = countBy(m => m.team.filter(t => t && (d.rarity || {})[t.itemId] === 'legendary').length);
  if (leg.length) add('legend', '★', 'Legend Hunter', leg[0].m, 'Owns ' + leg[0].n + ' Legendary item' + (leg[0].n === 1 ? '' : 's') + '.');
  const unl = countBy(m => log.filter(e => e.target === m.id && e.result === 'done').length);
  if (unl.length) add('unlucky', '🌧️', 'Unluckiest Manager', unl[0].m, 'Hit by ' + unl[0].n + ' rival Chaos Card' + (unl[0].n === 1 ? '' : 's') + '.');
  void fair;
  return out;
}
function computeShame(d) {
  const out = [];
  const gaps = priceGaps(d).filter(g => g.gap >= 2).sort((a, b) => b.gap - a.gap);
  if (gaps[0]) out.push({
    id: 'overpay',
    emoji: '💸',
    title: 'Biggest Overpay',
    team: gaps[0].team.name,
    item: gaps[0].item.name,
    price: gaps[0].price,
    why: 'Paid ' + money(Math.round(gaps[0].gap)) + ' more than the average for the same position this draft. Bold.'
  });
  const buys = [];
  d.managers.forEach(m => m.team.forEach(t => {
    if (t && !t.free) buys.push({
      m,
      item: d.items[t.itemId],
      price: t.price
    });
  }));
  const disaster = buys.filter(b => b.price >= d.rules.budget * 0.5).sort((a, b) => b.price - a.price)[0];
  if (disaster) out.push({
    id: 'budget',
    emoji: '🔥',
    title: 'Budget Disaster',
    team: disaster.m.name,
    item: disaster.item.name,
    price: disaster.price,
    why: 'Spent ' + Math.round(disaster.price / d.rules.budget * 100) + '% of the whole budget on one item.'
  });
  if (d.finale && d.finale.champion) {
    const regret = buys.filter(b => finaleRecord(d, b.m.id).won === 0 && b.price >= d.rules.budget / d.rules.slots.length).sort((a, b) => b.price - a.price)[0];
    if (regret) out.push({
      id: 'regret',
      emoji: '🙈',
      title: 'Most Regrettable Buy',
      team: regret.m.name,
      item: regret.item.name,
      price: regret.price,
      why: 'The priciest item on a team that didn’t win a single matchup.'
    });
  } else if (d.votesRevealed) {
    const {
      counts
    } = tally(d);
    const regret = buys.filter(b => counts[b.m.id] === 0 && b.price >= d.rules.budget / d.rules.slots.length).sort((a, b) => b.price - a.price)[0];
    if (regret) out.push({
      id: 'regret',
      emoji: '🙈',
      title: 'Most Regrettable Buy',
      team: regret.m.name,
      item: regret.item.name,
      price: regret.price,
      why: 'The priciest item on a team that got zero votes.'
    });
  }
  return out.map(x => ({
    ...x,
    draftId: d.id,
    date: d.createdAt,
    topic: d.topic.name
  }));
}
function careerStats(past, settings) {
  const since = settings && settings.statsResetAt || 0;
  const games = past.filter(d => finished(d) && (d.createdAt || 0) >= since).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const sales = {};
  games.forEach(d => d.managers.forEach(m => m.team.forEach(t => {
    if (t && !t.free && !t.stolen) (sales[nameKey(d.items[t.itemId].name)] = sales[nameKey(d.items[t.itemId].name)] || []).push(t.price);
  })));
  const ref = name => {
    const s = sales[nameKey(name)];
    return s && s.length >= 2 ? s.reduce((a, b) => a + b, 0) / s.length : null;
  };
  const P = {};
  games.forEach(d => {
    const {
      counts,
      winners
    } = tally(d);
    const winIds = winners.map(w => w.id);
    const awards = computeAwards(d);
    humanPlayers(d).forEach(p => {
      const r = P[p.key] || (P[p.key] = {
        key: p.key,
        name: p.name,
        emoji: p.emoji,
        games: 0,
        wins: 0,
        teamGames: 0,
        teamWins: 0,
        spent: 0,
        picks: {},
        buys: [],
        awards: {},
        best: null,
        chaos: {},
        legendary: 0,
        trades: 0,
        cardsUsed: 0,
        lastAt: 0,
        titles: 0,
        matches: 0,
        matchWins: 0,
        goals: 0,
        topRating: null
      });
      const team = d.managers.find(m => m.id === p.teamId);
      if (!team) return;
      r.games++;
      if (d.teamMode) r.teamGames++;
      const won = winIds.includes(team.id);
      if (won) {
        r.wins++;
        if (d.teamMode) r.teamWins++;
      }
      r.spent += (d.rules.budget - team.budget) * p.share;
      team.team.forEach(t => {
        if (!t) return;
        const it = d.items[t.itemId];
        r.picks[it.name] = (r.picks[it.name] || 0) + 1;
        if ((d.rarity || {})[t.itemId] === 'legendary') r.legendary++;
        if (!t.free && !t.stolen) r.buys.push({
          name: it.name,
          price: t.price,
          date: d.createdAt,
          topic: d.topic.name
        });
      });
      (d.cardLog || []).filter(e => e.by === team.id).forEach(e => {
        r.chaos[e.card] = (r.chaos[e.card] || 0) + 1;
        r.cardsUsed++;
      });
      r.trades += d.trade ? d.trade.proposals.filter(t => t.status === 'accepted' && (t.from === team.id || t.to === team.id)).length : 0;
      awards.filter(a => a.teamId === team.id).forEach(a => {
        r.awards[a.title] = (r.awards[a.title] || 0) + 1;
      });
      if (d.finale && d.finale.champion) {
        const rec = finaleRecord(d, team.id);
        if (won) r.titles++;
        if (needsMatch(d.finale.mode)) {
          r.matches += rec.played;
          r.matchWins += rec.won;
          r.goals += rec.gf;
        }
        if (won && (!r.best || r.best.votes != null)) r.best = {
          share: 1,
          votes: null,
          how: 'Won the ' + (needsMatch(d.finale.mode) ? 'knockout' : 'bracket') + ' (' + rec.won + ' win' + (rec.won === 1 ? '' : 's') + ')',
          topic: d.topic.name,
          date: d.createdAt,
          team: team.name
        };
      } else {
        const share = (counts[team.id] || 0) / Math.max(1, Object.keys(d.votes || {}).length);
        if (won && (!r.best || r.best.votes != null && share > r.best.share)) r.best = {
          share,
          votes: counts[team.id],
          topic: d.topic.name,
          date: d.createdAt,
          team: team.name
        };
      }
      if (isFootball(d.topic)) {
        const tr = teamRating(d, team).rating;
        if (r.topRating == null || tr > r.topRating.rating) r.topRating = {
          rating: tr,
          team: team.name,
          topic: d.topic.name
        };
      }
      if ((d.createdAt || 0) >= r.lastAt) {
        r.lastAt = d.createdAt || 0;
        r.name = p.name;
        r.emoji = p.emoji || r.emoji;
      }
    });
  });
  return Object.values(P).map(r => {
    const valued = r.buys.map(b => {
      const avg = ref(b.name);
      return avg == null ? null : {
        ...b,
        avg,
        gap: b.price - avg
      };
    }).filter(Boolean);
    const bargain = valued.length ? valued.reduce((a, x) => x.gap < a.gap ? x : a) : null;
    const overpay = valued.length ? valued.reduce((a, x) => x.gap > a.gap ? x : a) : null;
    const fav = Object.entries(r.picks).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topCard = Object.entries(r.chaos).sort((a, b) => b[1] - a[1])[0];
    const custom = settings && settings.profiles && settings.profiles[r.key] || {};
    return {
      ...r,
      name: custom.name || r.name,
      emoji: custom.emoji || r.emoji || '🙂',
      winRate: r.games ? r.wins / r.games : 0,
      spent: Math.round(r.spent * 10) / 10,
      bargain: bargain && bargain.gap < 0 ? bargain : null,
      overpay: overpay && overpay.gap > 0 ? overpay : null,
      favourites: fav,
      topCard: topCard ? topCard[0] : null
    };
  }).sort((a, b) => b.wins - a.wins || b.games - a.games || a.name.localeCompare(b.name));
}
function hallOfShame(past, settings) {
  const since = settings && settings.statsResetAt || 0;
  return past.filter(d => finished(d) && (d.createdAt || 0) >= since).flatMap(computeShame).sort((a, b) => b.price - a.price).slice(0, 12);
}
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
  if (item.mystery) {
    const p = norm(item.pos);
    const exact = p ? slots.findIndex((s, k) => norm(s) === p && !m.team[k]) : -1;
    if (exact >= 0) return exact;
    const flex = slots.findIndex((s, k) => isFlex(s) && !m.team[k]);
    return flex >= 0 ? flex : m.team.findIndex(x => !x);
  }
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
const outIds = d => d.out && d.out.reveal === d.reveal ? d.out.ids : [];
const isOut = (d, id) => outIds(d).includes(id);
const hasBidOnItem = (d, id) => !!(d.bid && d.bid.leaderId === id || (d.bids || []).some(b => b && b.leaderId === id));
const mustBidOn = d => !!(d.rules && d.rules.mustBid);
function owesBid(d, m) {
  return mustBidOn(d) && !hasBidOnItem(d, m.id) && canBid(d, m, nextAmount(d));
}
const owing = d => d.phase === 'auction' && !d.pending ? d.managers.filter(m => owesBid(d, m)) : [];
function withdrawProblem(d, id) {
  const m = d.managers.find(x => x.id === id);
  if (!m || d.phase !== 'auction' || !currentItem(d)) return 'There’s no item up right now.';
  if (isOut(d, id)) return 'Already out on this item.';
  if (owesBid(d, m)) return 'Require every manager to bid is on: bid at least once on this item before dropping out.';
  return skipWithdrawProblem(d, id);
}
function withdraw(d, id) {
  return withdrawProblem(d, id) ? d : {
    ...d,
    out: {
      reveal: d.reveal,
      ids: [...outIds(d), id]
    }
  };
}
function auctionEnd(d) {
  if (d.phase !== 'auction' || d.pending || !currentItem(d)) return null;
  if (d.bid) return d.managers.some(m => m.id !== d.bid.leaderId && canBid(d, m, nextAmount(d))) ? null : 'sell';
  const can = d.managers.filter(m => canBid(d, m, d.rules.minBid));
  const f = forcedPresenter(d);
  return !can.length || f && can.length === 1 && can[0].id === f.id ? 'skip' : null;
}
function canBid(d, m, amount) {
  const item = currentItem(d);
  if (!item || isFull(m) || d.pending || d.phase !== 'auction' || frozenNow(d, m.id) || isOut(d, m.id)) return false;
  if (assignSlot(m, item, d.rules.slots) < 0) return false;
  return amount >= d.rules.minBid && amount <= maxBid(m, d.rules);
}
function bidBlocker(d, m) {
  const item = currentItem(d);
  if (isOut(d, m.id)) return 'Out ✋';
  if (isFull(m)) return 'Team full';
  if (frozenNow(d, m.id)) return 'Frozen 🧊';
  if (item && assignSlot(m, item, d.rules.slots) < 0) return 'No ' + (item.pos || 'open') + ' slot';
  if (maxBid(m, d.rules) < d.rules.minBid) return 'Out of money';
  if (maxBid(m, d.rules) < nextAmount(d)) return 'Max ' + money(maxBid(m, d.rules));
  return null;
}
const canTake = (d, m, id) => !isFull(m) && assignSlot(m, d.items[id], d.rules.slots) >= 0;
const SNAP_KEYS = ['managers', 'queue', 'leftover', 'passed', 'processed', 'fp', 'phase', 'autoSkipped', 'cards', 'frozen', 'revealed', 'cardLog', 'nom', 'nominated', 'pending', 'trade', 'sk'];
function snap(d) {
  const o = {};
  SNAP_KEYS.forEach(k => {
    if (d[k] !== undefined) o[k] = d[k];
  });
  return JSON.stringify(o);
}
function withHistory(d, label) {
  return {
    ...d,
    ...JSON.parse(snap(d)),
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
  if (n.queue.length) {
    if (n.rules.order === 'nominate' && n.nominated !== n.queue[0]) {
      n.phase = 'nominate';
      n.nominated = null;
    } else n.phase = 'auction';
  } else if (isDraftOver(n)) finishDraft(n);else {
    if (n.phase !== 'freepick') n.fp = {
      round: 0,
      pos: 0
    };
    n.phase = 'freepick';
  }
  n.reveal = (n.reveal || 0) + 1;
  if (n.phase === 'auction') assignPresenter(n, n.rules.order === 'nominate' && n.nom ? n.nom.by : null);
  return n;
}
function finishDraft(n) {
  if (ruleOn(n, 'trades') && !(n.trade && n.trade.done)) openTrades(n);else n.phase = 'done';
  return n;
}
function createDraft(topic, managers, rules, extra) {
  const seed = extra && extra.seed || uid();
  const ids = topic.items.map(it => it.id);
  const mystery = new Set(pickMystery(ids, rules, seed));
  const items = {};
  topic.items.forEach(it => {
    items[it.id] = mystery.has(it.id) ? {
      ...it,
      mystery: true
    } : {
      ...it
    };
  });
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
      } : {}),
      ...(m.uid ? {
        uid: m.uid
      } : {}),
      ...(m.members ? {
        members: m.members.map(p => ({
          ...p
        }))
      } : {})
    })),
    teamMode: managers.some(m => m.members),
    items,
    queue: rules.order === 'random' ? shuffle(ids) : ids,
    leftover: [],
    passed: [],
    processed: 0,
    cards: dealCards(managers.map(m => m.id), rules, seed),
    frozen: {},
    revealed: [],
    cardLog: [],
    pending: null,
    rarity: assignRarity(ids, rules, seed),
    nom: {
      idx: 0
    },
    nominated: null,
    trade: null,
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
    ...(extra || {}),
    seed
  };
  return advance(d);
}
function placeBid(d, managerId, amount, opts) {
  const m = d.managers.find(x => x.id === managerId);
  if (isOut(d, managerId)) return d;
  if (opts && opts.double) {
    if (doubleProblem(d, managerId, amount)) return d;
    return {
      ...d,
      cards: removeCard(d.cards, managerId, 'double'),
      bids: [...d.bids, d.bid],
      bid: {
        amount: amount * 2,
        pay: amount,
        leaderId: managerId,
        double: true
      }
    };
  }
  if (!m || !canBid(d, m, amount)) return d;
  if (d.bid && amount <= d.bid.amount) return d;
  return {
    ...d,
    bids: [...d.bids, d.bid],
    bid: {
      amount,
      pay: amount,
      leaderId: managerId
    }
  };
}
function undoBid(d) {
  if (!d.bid) return d;
  const bids = [...d.bids];
  const prev = bids.pop();
  const cards = d.bid.double ? {
    ...d.cards,
    [d.bid.leaderId]: [...(d.cards[d.bid.leaderId] || []), 'double']
  } : d.cards;
  return {
    ...d,
    bids,
    bid: prev || null,
    cards
  };
}
function sell(d) {
  const id = d.queue[0];
  const b = d.bid;
  if (!id || !b) return d;
  const n = withHistory(d, 'Undo sale');
  const m = n.managers.find(x => x.id === b.leaderId);
  const slot = assignSlot(m, n.items[id], n.rules.slots);
  const price = b.pay != null ? b.pay : b.amount;
  if (slot < 0 || price > m.budget) return d;
  m.team[slot] = {
    itemId: id,
    price,
    ...(b.double ? {
      doubled: true
    } : {})
  };
  m.budget -= price;
  if (n.items[id].mystery) n.revealed = [...(n.revealed || []), id];
  n.queue = n.queue.slice(1);
  n.processed++;
  n.nominated = null;
  return advance(n);
}
function skipItem(d) {
  const id = d.queue[0];
  if (!id) return d;
  const out = d.phase === 'auction' ? unsoldOutcome(d) : {
    kind: 'plain'
  };
  const n = withHistory(d, out.kind === 'forced' ? 'Undo forced pick' : 'Undo skip');
  if (out.kind === 'forced') {
    const m = n.managers.find(x => x.id === out.m.id);
    const slot = assignSlot(m, n.items[id], n.rules.slots);
    m.team[slot] = {
      itemId: id,
      price: n.rules.minBid,
      forced: true
    };
    m.budget -= n.rules.minBid;
    if (n.items[id].mystery) n.revealed = [...(n.revealed || []), id];
    repayForced(n, m.id, id);
    n.queue = n.queue.slice(1);
    n.processed++;
    n.nominated = null;
    return advance(n);
  }
  if (out.kind === 'charge') chargeSkip(n, out.m.id, out.cost, out.end);
  n.queue = n.queue.slice(1);
  n.nominated = null;
  const back = out.kind === 'bounce' || n.rules.noBids === 'back';
  if (back && !n.passed.includes(id)) {
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
  if (n.items[itemId].mystery) n.revealed = [...(n.revealed || []), itemId];
  n.leftover = n.leftover.filter(x => x !== itemId);
  n.fp = {
    round: cp.round,
    pos: cp.pos + 1
  };
  if (isDraftOver(n)) finishDraft(n);
  n.reveal++;
  return n;
}
function undo(d) {
  if (d.bid) return undoBid(d);
  if (!d.history.length) return d;
  const h = d.history[d.history.length - 1];
  const s = JSON.parse(h.s);
  const reveal = (d.reveal || 0) + 1;
  if (s.sk && s.sk.cur) s.sk = {
    ...s.sk,
    cur: {
      ...s.sk.cur,
      reveal
    }
  };
  return {
    ...d,
    ...s,
    history: d.history.slice(0, -1),
    bid: null,
    bids: [],
    reveal,
    votes: {},
    votesRevealed: false,
    finale: null
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
  if (d.finale && d.finale.champion) {
    const counts = {};
    d.managers.forEach(m => {
      counts[m.id] = 0;
    });
    Object.values(d.votes || {}).forEach(t => {
      if (counts[t] !== undefined) counts[t]++;
    });
    return {
      counts,
      winners: d.managers.filter(m => m.id === d.finale.champion)
    };
  }
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
  }, title), React.createElement(TvButton, null), right || React.createElement("span", {
    style: {
      width: 46
    }
  }));
}
const AudioCtx = React.createContext({
  cfg: AUDIO_DEFAULTS,
  set: () => {}
});
function MuteButton() {
  const {
    cfg,
    set
  } = React.useContext(AudioCtx);
  return React.createElement("button", {
    className: 'iconbtn mute' + (cfg.muted ? ' on' : ''),
    onClick: () => set({
      ...cfg,
      muted: !cfg.muted
    }),
    "aria-pressed": cfg.muted,
    "aria-label": cfg.muted ? 'Unmute sound' : 'Mute all sound'
  }, cfg.muted ? '🔇' : '🔊');
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
    }, it.name, (() => {
      const r = rarityOf(d, t.itemId);
      return r && r !== 'common' ? React.createElement("span", {
        className: 'rmark ' + r
      }, r === 'legendary' ? '★' : '◆') : null;
    })(), t.free && React.createElement("span", {
      className: "muted small"
    }, " \xB7 free"), t.stolen && React.createElement("span", {
      className: "muted small"
    }, " \xB7 stolen"), t.traded && React.createElement("span", {
      className: "muted small"
    }, " \xB7 traded")) : React.createElement("span", {
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
  }, "\u2715")), React.createElement("details", {
    className: "card"
  }, React.createElement("summary", {
    className: "label"
  }, "\uD83D\uDCDC Rules in play"), React.createElement(RulesSummary, {
    rules: d.rules,
    opts: {
      teams: !!d.teamMode,
      clock: d.mode === 'online' ? (d.online || {}).clock : d.mode === 'solo' ? (d.solo || {}).clock : 0
    }
  }), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Rules are locked once a draft starts.")), d.managers.map(m => React.createElement("div", {
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
  }, m.emoji, " ", m.name, m.members ? React.createElement("span", {
    className: "small muted",
    style: {
      display: 'block',
      fontFamily: 'var(--body)',
      fontWeight: 600
    }
  }, m.members.map(p => p.name).join(' · ')) : null, d.cards && (d.cards[m.id] || []).length ? React.createElement("span", {
    className: "small muted",
    style: {
      display: 'block',
      fontFamily: 'var(--body)',
      fontWeight: 600
    }
  }, "\uD83C\uDCCF ", d.cards[m.id].map(c => CARD_INFO[c].name).join(', ')) : null), React.createElement("span", {
    className: "num",
    style: {
      fontFamily: 'var(--display)',
      fontSize: 22,
      color: 'var(--gold)'
    }
  }, money(m.budget), " left")), React.createElement(TeamList, {
    d: d,
    m: m
  }), React.createElement(TeamRatingPanel, {
    d: d,
    m: m
  })))));
}
function Home({
  draft,
  past,
  onNew,
  onSolo,
  onOnline,
  onResume,
  onTopics,
  onPast,
  onAbandon,
  onSettings,
  onPlayers,
  showInstall,
  onDismissInstall
}) {
  const [ask, setAsk] = useState(null);
  const status = draft && (draft.phase === 'auction' ? 'Item ' + (draft.processed + 1) + ' of ' + (draft.processed + draft.queue.length) : draft.phase === 'nominate' ? 'Nominating' : draft.phase === 'forcepick' ? 'Forced pick' : draft.phase === 'trade' ? 'Trade window' : draft.phase === 'freepick' ? 'Free picks' : 'Results & voting');
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
    onClick: onOnline
  }, React.createElement("span", {
    className: "mi"
  }, "\uD83C\uDF10"), React.createElement("span", {
    className: "mt"
  }, "Online"), React.createElement("span", {
    className: "ms"
  }, "Own phones \xB7 TV"))), React.createElement("div", {
    className: "menu"
  }, React.createElement("button", {
    className: "btn",
    onClick: onTopics
  }, "Topics"), React.createElement("button", {
    className: "btn",
    onClick: onPast
  }, "Past drafts", past.length ? ' (' + past.length + ')' : ''), React.createElement("button", {
    className: "btn",
    onClick: onPlayers
  }, "Players & stats"), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onSettings
  }, "Rules & settings")), showInstall && React.createElement("div", {
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
  setFolder,
  onImport,
  prefs,
  setPrefs
}) {
  const [del, setDel] = useState(null);
  const [q, setQ] = useState('');
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: folder && !q ? () => setFolder(null) : onBack,
    title: 'Topics (' + topics.length + ')'
  }), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn btn-gold grow",
    onClick: () => onCreate(folder)
  }, "+ New topic", folder ? ' in ' + folder : ''), React.createElement("button", {
    className: "btn grow",
    style: {
      width: 'auto'
    },
    onClick: onImport
  }, "Import")), React.createElement(TopicSearch, {
    q: q,
    setQ: setQ
  }), React.createElement(FolderBrowser, {
    topics: topics,
    q: q,
    folder: folder,
    setFolder: setFolder,
    prefs: prefs,
    setPrefs: setPrefs,
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
    }, t.name, !isBuiltIn(t) && React.createElement("span", {
      className: "yours"
    }, "Yours")), React.createElement("span", {
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
  })), isFootball(topic) && React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "it-rating"
  }, "Rating override (1\u201399)"), React.createElement("input", {
    id: "it-rating",
    className: "input",
    type: "number",
    inputMode: "numeric",
    min: 1,
    max: 99,
    value: f.rating == null ? '' : f.rating,
    placeholder: 'Estimated: ' + playerRating({
      ...f,
      rating: null
    }).ovr,
    onChange: e => {
      const v = e.target.value;
      setF(x => {
        const n = {
          ...x
        };
        if (v === '') delete n.rating;else n.rating = clamp(Math.round(+v) || 1, 1, 99);
        return n;
      });
    }
  }), React.createElement("p", {
    className: "hint"
  }, "Leave empty to use Draft Night\u2019s estimated game rating. This isn\u2019t an official EA Sports FC rating either way.")), React.createElement("div", {
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
  const [sharing, setSharing] = useState(false);
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
      onClick: () => setSharing(true)
    }, "Share")
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
  }, "No items yet. Add them one by one or paste a list with Bulk add.")), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn grow",
    onClick: onDuplicate
  }, "Duplicate topic"), React.createElement("button", {
    className: "btn btn-danger grow",
    onClick: () => setDel(true)
  }, "Delete topic")), sharing && React.createElement(ShareTopicSheet, {
    topic: topic,
    onClose: () => setSharing(false)
  }), editing && React.createElement(ItemEditor, {
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
  seed: 'start',
  teams: {
    on: false,
    count: 2,
    size: 2,
    name: 'Team You'
  }
};
const DEFAULT_TEAMS = {
  on: false,
  count: 2,
  size: 2,
  teams: []
};
function soloTeams(cfg) {
  const T = {
    ...DEFAULT_SOLO.teams,
    ...(cfg.teams || {})
  };
  const total = T.count * T.size - 1;
  const bots = makeBots(total, cfg.level, cfg.seed, [COLORS[1]]);
  const rng = seeded('teamnames', cfg.seed);
  const names = shuffle(TEAM_NAMES.map(n => [n, rng()]).sort((a, b) => a[1] - b[1]).map(x => x[0]));
  const teams = [];
  const toMember = b => ({
    id: b.id,
    name: b.name,
    emoji: b.emoji,
    bot: b.bot
  });
  teams.push({
    id: 'team-you',
    name: (T.name || 'Team You').trim() || 'Team You',
    color: COLORS[1],
    emoji: '😎',
    human: true,
    members: [{
      id: 'you',
      name: cfg.name.trim() || 'You',
      emoji: '😎',
      human: true
    }, ...bots.slice(0, T.size - 1).map(toMember)]
  });
  for (let i = 1; i < T.count; i++) {
    const ms = bots.slice(T.size - 1 + (i - 1) * T.size, T.size - 1 + i * T.size);
    teams.push({
      id: 'team-' + i + '-' + ms[0].id,
      name: names[i % names.length],
      color: ms[0].color,
      emoji: ms[0].emoji,
      members: ms.map(toMember)
    });
  }
  return teams;
}
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
  const T = {
    ...DEFAULT_SOLO.teams,
    ...(cfg.teams || {})
  };
  const setT = p => setCfg({
    ...cfg,
    teams: {
      ...T,
      ...p
    }
  });
  const bots = makeBots(cfg.bots, cfg.level, cfg.seed, [COLORS[1]]);
  const teams = T.on ? soloTeams(cfg) : null;
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
  }, React.createElement("span", {
    className: "label"
  }, "Play style"), React.createElement(Seg, {
    label: "Play style",
    value: T.on ? 'teams' : 'solo',
    options: [['solo', 'Every bot for itself'], ['teams', 'Teams']],
    onChange: v => setT({
      on: v === 'teams'
    })
  })), T.on ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "row"
  }, React.createElement("div", {
    className: "field grow"
  }, React.createElement("label", {
    htmlFor: "solo-tcount"
  }, "Teams"), React.createElement(Stepper, {
    id: "solo-tcount",
    value: T.count,
    min: 2,
    max: 4,
    onChange: v => setT({
      count: v
    })
  })), React.createElement("div", {
    className: "field grow"
  }, React.createElement("label", {
    htmlFor: "solo-tsize"
  }, "Players each"), React.createElement(Stepper, {
    id: "solo-tsize",
    value: T.size,
    min: 1,
    max: 4,
    onChange: v => setT({
      size: v
    })
  }))), React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "solo-tname"
  }, "Your team name"), React.createElement("input", {
    id: "solo-tname",
    className: "input",
    maxLength: 20,
    value: T.name,
    onChange: e => setT({
      name: e.target.value
    })
  })), React.createElement("p", {
    className: "hint"
  }, T.count === 2 ? T.size + 'v' + T.size : T.count + ' teams of ' + T.size, ". Bots on your team advise you; you make the bids. Other teams are all bots and bid together.")) : React.createElement("div", {
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
  }, "Shuffle bots")), teams ? React.createElement("div", {
    className: "stack-sm"
  }, teams.map(t => React.createElement("div", {
    key: t.id,
    className: "teamprev",
    style: mStyle(t)
  }, React.createElement("b", null, t.emoji, " ", t.name), React.createElement("span", {
    className: "small"
  }, t.members.map(p => p.name + (p.bot ? ' (' + BOT_TYPES[p.bot.type].short + ')' : '')).join(' · '))))) : React.createElement("div", {
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
  }, T.on ? T.count === 2 ? T.size + 'v' + T.size : T.count + ' teams of ' + T.size : cfg.bots + ' ' + (cfg.bots === 1 ? 'bot' : 'bots'), " \xB7 ", level.label, " \xB7 ", cfg.clock, "s clock \xB7 trash talk ", cfg.talk ? 'on' : 'off'), React.createElement("button", {
    className: "btn btn-gold",
    disabled: !valid,
    onClick: () => onStart(teams || bots)
  }, "Start solo draft"));
}
const TEAM_NAMES = ['The Overpayers', 'Budget Bandits', 'Chaos FC', 'Spreadsheet United', 'Bargain Bin Rovers', 'Team Mayhem', 'Deadline Dealers', 'The Free Agents'];
function shapeTeams(teams, count, size) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = teams[i] || {
      id: uid(),
      name: 'Team ' + (i + 1),
      color: COLORS[i % COLORS.length],
      emoji: EMOJIS[i % EMOJIS.length],
      members: []
    };
    const members = [];
    for (let j = 0; j < size; j++) members.push((t.members || [])[j] || {
      id: uid(),
      name: ''
    });
    out.push({
      ...t,
      members
    });
  }
  return out;
}
function TeamsEditor({
  cfg,
  setCfg
}) {
  const teams = shapeTeams(cfg.teams || [], cfg.count, cfg.size);
  const setTeams = ts => setCfg({
    ...cfg,
    teams: ts
  });
  const upd = (i, patch) => setTeams(teams.map((t, k) => k === i ? {
    ...t,
    ...patch
  } : t));
  const updMember = (i, j, name) => upd(i, {
    members: teams[i].members.map((p, k) => k === j ? {
      ...p,
      name
    } : p)
  });
  const autoAssign = () => {
    const names = shuffle(teams.flatMap(t => t.members.map(p => p.name.trim())).filter(Boolean));
    let k = 0;
    setTeams(teams.map(t => ({
      ...t,
      members: t.members.map(p => ({
        ...p,
        name: names[k++] || ''
      }))
    })));
  };
  return React.createElement("div", {
    className: "stack"
  }, React.createElement("div", {
    className: "card stack"
  }, React.createElement("div", {
    className: "row"
  }, React.createElement("div", {
    className: "field grow"
  }, React.createElement("label", {
    htmlFor: "tm-count"
  }, "Teams"), React.createElement(Stepper, {
    id: "tm-count",
    value: cfg.count,
    min: 2,
    max: 4,
    onChange: v => setCfg({
      ...cfg,
      count: v,
      teams: shapeTeams(teams, v, cfg.size)
    })
  })), React.createElement("div", {
    className: "field grow"
  }, React.createElement("label", {
    htmlFor: "tm-size"
  }, "Players each"), React.createElement(Stepper, {
    id: "tm-size",
    value: cfg.size,
    min: 1,
    max: 4,
    onChange: v => setCfg({
      ...cfg,
      size: v,
      teams: shapeTeams(teams, cfg.count, v)
    })
  }))), React.createElement("p", {
    className: "hint"
  }, cfg.count === 2 ? cfg.size + 'v' + cfg.size : cfg.count + ' teams of ' + cfg.size, " \xB7 each team shares one budget, one roster and its Chaos Cards. Everyone votes, but never for their own team."), React.createElement("button", {
    className: "btn btn-sm",
    style: {
      alignSelf: 'flex-start'
    },
    onClick: autoAssign
  }, "Shuffle players into teams")), teams.map((t, i) => React.createElement("div", {
    key: t.id,
    className: "teamedit",
    style: mStyle(t)
  }, React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "emo",
    onClick: () => upd(i, {
      emoji: EMOJIS[(EMOJIS.indexOf(t.emoji) + 1) % EMOJIS.length]
    }),
    "aria-label": "Change team emoji"
  }, t.emoji), React.createElement("button", {
    className: "swatch",
    onClick: () => upd(i, {
      color: COLORS[(COLORS.indexOf(t.color) + 1) % COLORS.length]
    }),
    "aria-label": "Change team colour"
  }), React.createElement("input", {
    id: 'tm-name-' + t.id,
    className: "input grow",
    value: t.name,
    maxLength: 20,
    placeholder: 'Team ' + (i + 1),
    onChange: e => upd(i, {
      name: e.target.value
    })
  })), React.createElement("div", {
    className: "stack-sm",
    style: {
      marginTop: 8
    }
  }, t.members.map((p, j) => React.createElement("input", {
    key: p.id,
    id: 'tm-p-' + p.id,
    className: "input",
    value: p.name,
    maxLength: 16,
    placeholder: 'Player ' + (j + 1),
    onChange: e => updMember(i, j, e.target.value)
  }))))));
}
const localTeamsToManagers = cfg => shapeTeams(cfg.teams || [], cfg.count, cfg.size).map(t => ({
  id: t.id,
  name: t.name.trim(),
  color: t.color,
  emoji: t.emoji,
  members: t.members.map(p => ({
    id: p.id,
    name: p.name.trim(),
    emoji: '🙂'
  }))
}));
const teamsValid = cfg => {
  const ts = shapeTeams(cfg.teams || [], cfg.count, cfg.size);
  return ts.every(t => t.name.trim() && t.members.every(p => p.name.trim()));
};
function SetupManagers({
  managers,
  setManagers,
  onBack,
  onNext,
  teamCfg,
  setTeamCfg
}) {
  if (teamCfg && teamCfg.on) return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: "1 \xB7 Teams"
  }), React.createElement("div", null, React.createElement("h2", {
    className: "display"
  }, "Who's bidding?")), React.createElement(Seg, {
    label: "Play style",
    value: "teams",
    options: [['solo', 'Individual'], ['teams', 'Teams']],
    onChange: v => setTeamCfg({
      ...teamCfg,
      on: v === 'teams'
    })
  }), React.createElement(TeamsEditor, {
    cfg: teamCfg,
    setCfg: setTeamCfg
  }), !teamsValid(teamCfg) && React.createElement("p", {
    className: "hint"
  }, "Every team and player needs a name."), React.createElement("button", {
    className: "btn btn-gold",
    disabled: !teamsValid(teamCfg),
    onClick: onNext
  }, "Next: pick a topic"));
  return React.createElement(SetupManagersSolo, {
    managers: managers,
    setManagers: setManagers,
    onBack: onBack,
    onNext: onNext,
    teamCfg: teamCfg,
    setTeamCfg: setTeamCfg
  });
}
function SetupManagersSolo({
  managers,
  setManagers,
  onBack,
  onNext,
  teamCfg,
  setTeamCfg
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
  }, "2 to 8 managers. Tap the colour or emoji to change it.")), setTeamCfg && React.createElement(Seg, {
    label: "Play style",
    value: "solo",
    options: [['solo', 'Individual'], ['teams', 'Teams']],
    onChange: v => setTeamCfg({
      ...(teamCfg || DEFAULT_TEAMS),
      on: v === 'teams'
    })
  }), React.createElement("div", {
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
function TopicMarks({
  t,
  prefs,
  setPrefs
}) {
  if (!setPrefs) return null;
  const fav = (prefs.fav || []).includes(t.id),
    pin = (prefs.pin || []).includes(t.id);
  return React.createElement("div", {
    className: "tmarks"
  }, React.createElement("button", {
    type: "button",
    className: 'tmark' + (fav ? ' on' : ''),
    "aria-pressed": fav,
    "aria-label": (fav ? 'Remove ' : 'Add ') + t.name + (fav ? ' from' : ' to') + ' favourites',
    title: fav ? 'Favourite (tap to remove)' : 'Favourite: keep it in your Favourites tab',
    onClick: () => setPrefs({
      ...prefs,
      fav: toggleIn(prefs.fav, t.id)
    })
  }, fav ? '★' : '☆'), React.createElement("button", {
    type: "button",
    className: 'tmark' + (pin ? ' on' : ''),
    "aria-pressed": pin,
    "aria-label": (pin ? 'Unpin ' : 'Pin ') + t.name + (pin ? '' : ' to the top of ' + folderOf(t)),
    title: pin ? 'Pinned to the top of ' + folderOf(t) + ' (tap to unpin)' : 'Pin to the top of ' + folderOf(t),
    onClick: () => setPrefs({
      ...prefs,
      pin: toggleIn(prefs.pin, t.id)
    })
  }, "\uD83D\uDCCC"));
}
const TOPIC_VIEWS = [['folders', 'Folders'], ['popular', 'Popular'], ['favs', 'Favourites']];
function FolderBrowser({
  topics,
  q,
  folder,
  setFolder,
  renderTopic,
  prefs: prefsIn,
  setPrefs,
  view: viewIn,
  setView: setViewIn,
  onRandom
}) {
  const [viewLocal, setViewLocal] = useState('folders');
  const view = viewIn || viewLocal;
  const setView = setViewIn || setViewLocal;
  const prefs = prefsIn || {
    fav: [],
    pin: []
  };
  const pinned = new Set(prefs.pin || []);
  const row = (t, extra) => React.createElement("div", {
    key: t.id,
    className: 'trow2' + (pinned.has(t.id) ? ' pinned' : '')
  }, React.createElement("div", {
    className: "grow",
    style: {
      minWidth: 0
    }
  }, renderTopic(t), extra), React.createElement(TopicMarks, {
    t: t,
    prefs: prefs,
    setPrefs: setPrefs
  }));
  const tabs = React.createElement("div", {
    className: "tabs",
    role: "tablist",
    "aria-label": "Browse topics"
  }, TOPIC_VIEWS.map(([k, label]) => React.createElement("button", {
    key: k,
    role: "tab",
    "aria-selected": view === k,
    className: 'ttab' + (view === k ? ' on' : ''),
    onClick: () => {
      setView(k);
      setFolder(null);
    }
  }, label, k === 'favs' && (prefs.fav || []).length ? React.createElement("span", {
    className: "tabcount"
  }, topics.filter(t => (prefs.fav || []).includes(t.id)).length) : null)), onRandom && React.createElement("button", {
    className: "ttab",
    onClick: onRandom,
    "aria-label": "Pick a random topic"
  }, "\uD83C\uDFB2 Random"));
  if (q.trim()) {
    const r = topics.filter(t => matchTopic(t, q)).sort(byPopularity);
    return React.createElement("div", {
      className: "stack-sm"
    }, r.map(t => row(t, React.createElement("span", {
      className: "tfolder small muted"
    }, folderEmoji(folderOf(t)), " ", folderOf(t)))), !r.length && React.createElement("p", {
      className: "muted"
    }, "No topics match \u201C", q.trim(), "\u201D."));
  }
  if (view === 'popular') {
    const ranked = topics.filter(t => popScore(t) != null).sort(byPopularity);
    const yours = topics.filter(t => popScore(t) == null).sort(byPopularity);
    return React.createElement("div", {
      className: "stack-sm"
    }, tabs, React.createElement("p", {
      className: "hint",
      style: {
        margin: 0
      }
    }, "Our ranking of the built-in topics, from most to least crowd-pleasing. It\u2019s fixed: picking, starring or pinning never changes it."), ranked.map((t, i) => row(t, React.createElement("span", {
      className: "tfolder small muted"
    }, "#", i + 1, " \xB7 ", folderEmoji(folderOf(t)), " ", folderOf(t)))), yours.length > 0 && React.createElement(React.Fragment, null, React.createElement("h3", {
      style: {
        marginTop: 8
      }
    }, "Your topics"), yours.map(t => row(t, React.createElement("span", {
      className: "tfolder small muted"
    }, folderEmoji(folderOf(t)), " ", folderOf(t))))));
  }
  if (view === 'favs') {
    const r = favouritesOrder(topics, prefs);
    return React.createElement("div", {
      className: "stack-sm"
    }, tabs, r.length ? r.map(t => row(t, React.createElement("span", {
      className: "tfolder small muted"
    }, pinned.has(t.id) ? '📌 ' : '', folderEmoji(folderOf(t)), " ", folderOf(t)))) : React.createElement("p", {
      className: "muted"
    }, "No favourites yet \u2014 tap \u2606 on any topic to keep it here."), React.createElement("p", {
      className: "hint",
      style: {
        margin: 0
      }
    }, "\u2606 Favourite keeps a topic in this tab. \uD83D\uDCCC Pin moves it to the top of its own folder. They\u2019re separate, saved on this device, and never shared with an online room."));
  }
  const names = folderList(topics);
  if (folder && names.includes(folder)) {
    const r = folderOrder(topics.filter(t => folderOf(t) === folder), prefs);
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
    }, r.length, " topic", r.length === 1 ? '' : 's')), r.map(t => row(t)));
  }
  return React.createElement("div", {
    className: "stack-sm"
  }, tabs, React.createElement("div", {
    className: "foldergrid"
  }, names.map(f => {
    const ts = folderOrder(topics.filter(t => folderOf(t) === f), prefs);
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
    }, ts.length, " topic", ts.length === 1 ? '' : 's', f === 'My Topics' ? ' · yours' : ''), React.createElement("span", {
      className: "fm"
    }, ts.slice(0, 5).map(t => t.emoji).join(' ')));
  })));
}
function SetupTopic({
  topics,
  onBack,
  onPick,
  onTopics,
  folder,
  setFolder,
  prefs,
  setPrefs
}) {
  const [q, setQ] = useState('');
  const [view, setView] = useState('folders');
  const random = () => {
    const playable = t => t.items.length && t.slots.length;
    const p = prefs || {
      fav: []
    };
    const pool = (view === 'favs' ? topics.filter(t => (p.fav || []).includes(t.id)) : folder ? topics.filter(t => folderOf(t) === folder) : topics).filter(playable);
    if (pool.length) onPick(pool[Math.floor(Math.random() * pool.length)].id);
  };
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
    prefs: prefs,
    setPrefs: setPrefs,
    view: view,
    setView: setView,
    onRandom: random,
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
    }, t.name, !isBuiltIn(t) && React.createElement("span", {
      className: "yours"
    }, "Yours")), React.createElement("span", {
      className: "sub"
    }, t.items.length, " items \xB7 ", t.slots.length, " slots")), React.createElement("span", {
      className: "muted",
      style: {
        fontSize: 22
      }
    }, "\u203A"))
  }), folder && !q && React.createElement("button", {
    className: "btn",
    onClick: random
  }, "\uD83C\uDFB2 Random topic from ", folder), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onTopics
  }, "Manage topics"));
}
function RuleSection({
  id,
  title,
  emoji,
  on,
  onToggle,
  summary,
  children,
  open: startOpen
}) {
  const [open, setOpen] = useState(!!startOpen);
  return React.createElement("section", {
    className: 'rsec' + (on === false ? ' off' : '')
  }, React.createElement("div", {
    className: "rhead2"
  }, React.createElement("button", {
    type: "button",
    className: "rtitle",
    "aria-expanded": open,
    "aria-controls": id,
    onClick: () => setOpen(o => !o)
  }, React.createElement("span", {
    className: "re"
  }, emoji), React.createElement("span", {
    className: "grow",
    style: {
      minWidth: 0
    }
  }, React.createElement("b", null, title), React.createElement("span", {
    className: "small muted",
    style: {
      display: 'block'
    }
  }, summary)), React.createElement("span", {
    className: "chev"
  }, open ? '▾' : '▸')), onToggle && React.createElement("button", {
    type: "button",
    className: "mini-sw",
    role: "switch",
    "aria-checked": !!on,
    "aria-label": title + (on ? ' on' : ' off'),
    onClick: () => onToggle(!on)
  }, React.createElement("span", null))), open && React.createElement("div", {
    id: id,
    className: "rbody stack"
  }, children));
}
function PctField({
  id,
  label,
  value,
  onChange,
  max
}) {
  return React.createElement("div", {
    className: "field grow"
  }, React.createElement("label", {
    htmlFor: id
  }, label), React.createElement(Stepper, {
    id: id,
    value: value,
    min: 0,
    max: max,
    onChange: onChange
  }));
}
function rulesLines(rules, opts) {
  const tw = twistRules(rules);
  const fin = {
    ...FINALE_DEFAULTS,
    ...(rules.finale || {})
  };
  const per = opts && opts.teams ? 'team' : 'manager';
  const L = [];
  L.push(['💵', money(rules.budget) + ' budget per ' + per + ' · ' + (rules.slots || []).length + ' slots' + (rules.slots && rules.slots.length ? ' (' + rules.slots.join(', ') + ')' : '')]);
  L.push(['🔨', 'Bids start at ' + money(rules.minBid) + ', go up by ' + money(rules.inc) + (opts && opts.clock ? ' · ' + opts.clock + 's bid clock' : rules.timer ? ' · ' + rules.timer + 's bid timer' : ' · auctioneer taps Sold')]);
  L.push(['✋', rules.mustBid ? 'Require every manager to bid: ON — everyone must bid once on each item before dropping out' : 'Anyone can drop out of an item without bidding']);
  L.push(['🧭', rules.order === 'nominate' ? 'Nomination: teams take turns picking what goes up' : rules.order === 'saved' ? 'Items come up in topic order' : 'Items come up in random order']);
  L.push(['↩️', rules.noBids === 'back' ? 'Unbid items go to the back of the queue' : 'Unbid items are skipped (leftovers become free picks)']);
  skipRulesLines(rules).forEach(x => L.push(x));
  if (rules.mustFill) L.push(['🧮', 'You must keep enough money to fill your team']);
  L.push(['🃏', tw.chaos.on ? 'Chaos Cards: ' + tw.chaos.count + ' per ' + per + ' — ' + CARD_TYPES.filter(c => tw.chaos[c]).map(c => CARD_INFO[c].name).join(', ') : 'Chaos Cards: off']);
  L.push(['❓', tw.mystery.on ? 'Mystery items: 1 in ' + tw.mystery.every : 'Mystery items: off']);
  L.push(['✨', tw.rarity.on ? 'Rarity: ' + (100 - tw.rarity.rare - tw.rarity.legendary) + '% common · ' + tw.rarity.rare + '% rare · ' + tw.rarity.legendary + '% legendary' : 'Rarity: off']);
  L.push(['🤝', tw.trades.on ? 'Trade window: ' + tw.trades.minutes + ' min' + (tw.trades.money ? ', money allowed' : '') : 'Trade window: off']);
  L.push(['🏆', 'Winner: ' + {
    vote: 'group vote',
    bracket: 'head-to-head vote bracket' + (fin.tiebreak === 'revote' ? ' (ties: vote again once)' : ' (ties: higher-rated team)'),
    sim: 'match simulator knockout',
    combined: 'combined finale ' + fin.weight + '% match / ' + (100 - fin.weight) + '% votes'
  }[fin.mode] + (fin.home && (fin.mode === 'sim' || fin.mode === 'combined') ? ' · home advantage for the higher seed' : '')]);
  return L;
}
function RulesSummary({
  rules,
  opts
}) {
  return React.createElement("ul", {
    className: "rulelist"
  }, rulesLines(rules, opts).map(([e, t]) => React.createElement("li", {
    key: t
  }, React.createElement("span", {
    "aria-hidden": "true"
  }, e), " ", t)));
}
const RULE_TABS = [['general', 'General'], ['auction', 'Auction & bidding'], ['skips', 'Skip rules'], ['chaos', 'Chaos & surprises'], ['teams', 'Teams & trading'], ['winner', 'Winner'], ['review', 'Review']];
function SetupRules({
  topic,
  managers,
  rules,
  setRules,
  onBack,
  onStart,
  startLabel = 'Start the draft',
  title = '3 · Rules',
  teamSummary,
  onEditTeams,
  onReset,
  defaultsMode,
  clockNote
}) {
  const [slotTxt, setSlotTxt] = useState(rules.slots.join(', '));
  const [askReset, setAskReset] = useState(false);
  const [tab, setTab] = useState('general');
  const slots = parseSlots(slotTxt);
  const tw = twistRules(rules);
  const set = p => setRules({
    ...rules,
    ...p
  });
  const setTw = (k, p) => setRules({
    ...rules,
    [k]: {
      ...tw[k],
      ...p
    }
  });
  const needed = rules.minBid * Math.max(1, slots.length);
  const problems = [];
  if (!defaultsMode && !slots.length) problems.push('Add at least one slot.');
  if (!defaultsMode && rules.budget < needed) problems.push('A budget of ' + money(rules.budget) + " can't fill " + slots.length + ' slots at ' + money(rules.minBid) + ' each. Raise it to at least ' + money(needed) + '.');
  if (tw.chaos.on && !CARD_TYPES.some(c => tw.chaos[c])) problems.push('Chaos Cards are on but every card type is switched off. Turn one on, or switch Chaos Cards off.');
  if (tw.rarity.on && tw.rarity.rare + tw.rarity.legendary > 100) problems.push('Rare + Legendary can’t be more than 100%.');
  if (!defaultsMode && topic.items.length < slots.length * managers.length) problems.push('Heads up: ' + topic.items.length + ' items for ' + slots.length * managers.length + ' slots. Some teams will finish short.');
  if (!defaultsMode && tw.mystery.on && topic.items.length < tw.mystery.every) problems.push('Heads up: this topic has fewer than ' + tw.mystery.every + ' items, so there won’t be any mystery items.');
  const blocking = problems.filter(p => !p.startsWith('Heads up'));
  const posMissing = defaultsMode ? [] : [...new Set(topic.items.map(i => i.pos).filter(p => p && !slots.some(s => norm(s) === norm(p))))];
  const common = 100 - tw.rarity.rare - tw.rarity.legendary;
  const mysteryCount = tw.mystery.on && !defaultsMode ? Math.floor(topic.items.length / Math.max(2, tw.mystery.every)) : 0;
  const teams = !!(teamSummary && teamSummary.teams);
  const fin = {
    ...FINALE_DEFAULTS,
    ...(rules.finale || {})
  };
  const setF = p => set({
    finale: {
      ...fin,
      ...p
    }
  });
  const foot = defaultsMode || isFootball(topic);
  const sk = skipCfg(rules.skip ? rules : {
    skip: SKIP_DEFAULTS
  });
  const setSk = p => set({
    skip: {
      ...sk,
      ...p
    }
  });
  const onCount = {
    chaos: [tw.chaos.on, tw.mystery.on, tw.rarity.on].filter(Boolean).length,
    teams: [tw.trades.on].filter(Boolean).length,
    skips: [sk.on, sk.endgame.on, sk.on && sk.debt.on && !sk.nmd].filter(Boolean).length
  };
  const per = teams ? 'team' : 'manager';
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: title
  }), React.createElement("div", null, React.createElement("p", {
    className: "eyebrow"
  }, defaultsMode ? 'Your defaults for new games' : topic.emoji + ' ' + topic.name), React.createElement("h2", {
    className: "display"
  }, "House rules"), React.createElement("p", {
    className: "hint"
  }, defaultsMode ? 'New games start with these. You can still change them when setting up a game.' : 'Changes apply to this new draft. A game in progress keeps its rules.', " Optional extras are off until you switch them on; Skip rules are on by default to stop endless dodging.")), React.createElement("div", {
    className: "tabs",
    role: "tablist",
    "aria-label": "Rule sections"
  }, RULE_TABS.map(([k, label]) => React.createElement("button", {
    key: k,
    role: "tab",
    "aria-selected": tab === k,
    className: 'ttab' + (tab === k ? ' on' : ''),
    onClick: () => setTab(k)
  }, label, onCount[k] ? React.createElement("span", {
    className: "tabcount"
  }, onCount[k], " on") : null))), tab === 'general' && React.createElement("div", {
    className: "stack",
    role: "tabpanel"
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "r-budget"
  }, "Starting budget", teams ? ' (per team)' : ''), React.createElement(Stepper, {
    id: "r-budget",
    prefix: "$",
    value: rules.budget,
    min: 1,
    max: 999,
    onChange: v => set({
      budget: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, "What each ", teams ? 'team' : 'manager', " has to spend on the whole draft.")), !defaultsMode && React.createElement("div", {
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
  }), React.createElement("p", {
    className: "hint"
  }, "How many items each team ends up with. FLEX takes anything."), posMissing.length > 0 && React.createElement("p", {
    className: "hint"
  }, "No slot for ", posMissing.join(', '), ". Those items can go in any open slot.")), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Item order"), React.createElement(Seg, {
    label: "Draft order",
    value: rules.order,
    options: [['random', 'Random'], ['nominate', 'Nomination'], ['saved', 'Topic order']],
    onChange: v => set({
      order: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, rules.order === 'nominate' ? 'Teams take turns choosing which item goes up next.' : rules.order === 'saved' ? 'Items come up in the order saved in the topic.' : 'Items come up in a random order.')), React.createElement(Toggle, {
    on: rules.mustFill,
    onChange: v => set({
      mustFill: v
    }),
    title: "Must be able to fill your team",
    sub: 'Your highest bid always leaves ' + money(rules.minBid) + ' for each other empty slot.'
  })), tab === 'auction' && React.createElement("div", {
    className: "stack",
    role: "tabpanel"
  }, React.createElement("div", {
    className: "field"
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
  }), React.createElement("p", {
    className: "hint"
  }, "The opening price for every item.")), React.createElement("div", {
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
  }), React.createElement("p", {
    className: "hint"
  }, "How much each tap raises the price.")), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Bid timer (Local games)"), React.createElement(Seg, {
    label: "Bid timer",
    value: rules.timer,
    options: [[0, 'Off'], [10, '10s'], [15, '15s'], [30, '30s']],
    onChange: v => set({
      timer: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, rules.timer > 0 ? 'Restarts on every bid. When it runs out the item sells to the leader.' : 'Off: the auctioneer taps Sold.', " ", clockNote || 'Solo and Online games always use a bid clock (set on their own setup screens).')), React.createElement(Toggle, {
    on: !!rules.mustBid,
    onChange: v => set({
      mustBid: v
    }),
    title: "Require every manager to bid",
    sub: "Everyone who can afford it must bid at least once on each item before they can tap \u201CI\u2019m out\u201D. The item can\u2019t close until they have. Managers who can\u2019t afford the next bid, or have no slot for it, are excused."
  }), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Items nobody bids on"), React.createElement(Seg, {
    label: "No bids",
    value: rules.noBids,
    options: [['skip', 'Skip them'], ['back', 'Back of queue']],
    onChange: v => set({
      noBids: v
    })
  })), React.createElement("div", {
    className: "card stack-sm",
    style: {
      background: 'var(--stage)'
    }
  }, React.createElement("b", {
    className: "small"
  }, "How \u201CI\u2019m out\u201D works"), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Tapping \u201CI\u2019m out\u201D drops you out of the current item only: you can\u2019t bid on it again, and you\u2019re back in for the next item. A bid you already made still stands. As soon as nobody but the leader can still bid, the item sells straight away; if nobody can bid at all, it goes unsold. Bots drop out when the price passes what they\u2019ll pay."))), tab === 'skips' && React.createElement("div", {
    className: "stack",
    role: "tabpanel"
  }, React.createElement("div", {
    className: "card stack-sm",
    style: {
      background: 'var(--stage)'
    }
  }, React.createElement("b", {
    className: "small"
  }, "How skips work"), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Each item is handed to one ", per, " in turn", rules.order === 'nominate' ? ' (in Nomination, whoever nominated it)' : '', ". If it ends with no bids, that\u2019s their skip; if anyone buys it, no skip is used. Out of skips? They\u2019re on the hook: they can\u2019t tap \u201CI\u2019m out\u201D, anyone can still outbid them, and if nobody bids they take it for the minimum bid (", money(rules.minBid), "). A pick is only forced if they can legally take and afford the item. Items nobody could buy are skipped automatically and never count.")), React.createElement(RuleSection, {
    id: "rs-skip",
    emoji: "\uD83D\uDD01",
    title: "Skip limits",
    open: true,
    on: sk.on,
    onToggle: v => setSk({
      on: v
    }),
    summary: sk.on ? (sk.max < 0 ? 'Unlimited' : sk.max + ' per ' + per) + (sk.nmd ? ' · No More Dodging' : sk.debt.on ? ' · Skip Debt' : ' · then ' + {
      must: 'must take next',
      final: 'final chance',
      escalate: 'escalating',
      none: 'no forced picks'
    }[sk.runOut]) : 'Off'
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Skips per ", per, ", for the whole draft"), React.createElement(Seg, {
    label: "Skips per manager",
    value: sk.max,
    options: SKIP_MAXES.map(v => [v, v < 0 ? 'Unlimited' : String(v)]),
    onChange: v => setSk({
      max: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, teams ? 'In team games the team shares one pool of skips (the team bids as one).' : 'Shown on every manager’s card during the draft.')), React.createElement(Toggle, {
    on: !!sk.nmd,
    onChange: v => setSk({
      nmd: v
    }),
    title: "\uD83D\uDEAB No More Dodging",
    sub: "Strict mode: once your skips are gone, you must take every item handed to you for the rest of the draft. It overrides Skip Debt and the setting below."
  }), !sk.nmd && !sk.debt.on && React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "When a manager runs out of skips"), React.createElement(Seg, {
    label: "When skips run out",
    value: sk.runOut,
    options: [['must', 'Must take next'], ['final', 'Final chance'], ['escalate', 'Escalating'], ['none', 'No forced picks']],
    onChange: v => setSk({
      runOut: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, {
    must: 'They must take the next item handed to them (if nobody outbids them).',
    final: 'One final extra skip, then they must take the next item.',
    escalate: 'Two last-ditch skips, but they must take an item in between; after the second, every item handed to them is forced.',
    none: 'Nothing is forced. Their unbid items go to the back of the queue once instead of disappearing (then become free picks).'
  }[sk.runOut])), !sk.nmd && sk.debt.on && React.createElement("p", {
    className: "hint"
  }, "Skip Debt is on, so it decides what happens when skips run out."), React.createElement(Toggle, {
    on: !!sk.warn,
    onChange: v => setSk({
      warn: v
    }),
    title: "Skip warnings",
    sub: "Warn when a manager is down to their last skip and when they have none left."
  })), React.createElement(RuleSection, {
    id: "rs-endgame",
    emoji: "\u23F3",
    title: "Endgame Anti-Dodging",
    on: sk.endgame.on,
    onToggle: v => setSk({
      endgame: {
        ...sk.endgame,
        on: v
      }
    }),
    summary: sk.endgame.on ? 'Last ' + sk.endgame.at + ' items · ' + sk.endgame.allow + ' skip' + (sk.endgame.allow === 1 ? '' : 's') + (sk.endgame.style === 'pressure' ? ' · progressive' : '') : 'Off'
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Start enforcing when"), React.createElement(Seg, {
    label: "Endgame threshold",
    value: sk.endgame.at,
    options: [[5, 'Last 5'], [3, 'Last 3'], [2, 'Last 2']],
    onChange: v => setSk({
      endgame: {
        ...sk.endgame,
        at: v
      }
    })
  })), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Skips allowed in the endgame"), React.createElement(Seg, {
    label: "Endgame skips",
    value: sk.endgame.allow,
    options: [[0, '0'], [1, '1'], [2, '2']],
    onChange: v => setSk({
      endgame: {
        ...sk.endgame,
        allow: v
      }
    })
  }), React.createElement("p", {
    className: "hint"
  }, "Per ", per, ". An endgame skip also needs a normal skip left", sk.on ? '' : ' (skip limits are off, so only this allowance counts)', ".")), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Enforcement"), React.createElement(Seg, {
    label: "Endgame style",
    value: sk.endgame.style,
    options: [['must', 'Must take next item'], ['pressure', 'Progressive pressure']],
    onChange: v => setSk({
      endgame: {
        ...sk.endgame,
        style: v
      }
    })
  }), React.createElement("p", {
    className: "hint"
  }, sk.endgame.style === 'pressure' ? 'Warnings start 3 items before the endgame; once it starts, anyone with no endgame skips left must take their item.' : 'Once the endgame starts, anyone with no endgame skips left must take their item.', " Never forces an item someone can\u2019t legally take or afford."))), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Forced pick style"), rules.order === 'nominate' ? React.createElement("p", {
    className: "hint"
  }, "Nomination is on, so the ", per, " on the hook nominates the item themselves (only items they can take are offered). The style below doesn\u2019t apply.") : React.createElement(React.Fragment, null, React.createElement(Seg, {
    label: "Forced pick style",
    value: sk.style,
    options: [['next', 'Next item'], ['choose3', 'Choose from 3'], ['auctioneer', 'Auctioneer’s choice'], ['random', 'Random']],
    onChange: v => setSk({
      style: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, {
    next: 'They’re on the hook for the next item handed to them.',
    choose3: 'They choose one of 3 random items they can take (fewer if fewer are left). If the clock runs out, one is picked for them.',
    auctioneer: 'The game chooses the item using the rule below.',
    random: 'A random item they can take.'
  }[sk.style], " It still goes to auction: anyone can outbid them."), sk.style === 'choose3' && React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Time to choose"), React.createElement(Seg, {
    label: "Choose time",
    value: sk.pickSecs,
    options: [[15, '15s'], [20, '20s'], [30, '30s'], [60, '60s']],
    onChange: v => setSk({
      pickSecs: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, "Also the fallback if that player disconnects.")), sk.style === 'auctioneer' && React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Auctioneer picks"), React.createElement(Seg, {
    label: "Auctioneer preference",
    value: sk.pref,
    options: [['rating', 'Highest rated'], ['random', 'Random']],
    onChange: v => setSk({
      pref: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, "Highest rated only works on the 3 football topics (estimated ratings). Other topics have no reliable ratings, so it picks at random. There\u2019s no \u201Cbest value\u201D option because no topic has real value data.")))), React.createElement(RuleSection, {
    id: "rs-debt",
    emoji: "\uD83D\uDCB3",
    title: "Skip Debt",
    on: sk.debt.on && !sk.nmd,
    onToggle: v => setSk({
      debt: {
        ...sk.debt,
        on: v
      },
      ...(v ? {
        nmd: false
      } : {})
    }),
    summary: sk.debt.on && !sk.nmd ? {
      each: 'Each forced pick repays 1',
      two: '2 forced picks repay 1',
      end: 'Never repaid'
    }[sk.debt.clear] : 'Off'
  }, React.createElement("p", {
    className: "hint"
  }, "Out of skips, you can keep skipping, but each extra skip is 1 debt point. While you owe debt, you must take the next item handed to you. Debt never touches your money or bids."), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Debt is repaid"), React.createElement(Seg, {
    label: "Debt recovery",
    value: sk.debt.clear,
    options: [['each', 'Each forced pick'], ['two', 'Every 2 forced picks'], ['end', 'Never']],
    onChange: v => setSk({
      debt: {
        ...sk.debt,
        clear: v
      }
    })
  }), React.createElement("p", {
    className: "hint"
  }, {
    each: 'Each item you’re forced to take repays 1 point. At 0 you can skip again.',
    two: 'Every 2 forced items repay 1 point.',
    end: 'Once in debt, every item handed to you is forced for the rest of the draft.'
  }[sk.debt.clear]))), React.createElement("div", {
    className: "card stack-sm",
    style: {
      background: 'var(--stage)'
    }
  }, React.createElement("b", {
    className: "small"
  }, "Which rule wins"), React.createElement("ol", {
    className: "hint",
    style: {
      margin: 0,
      paddingLeft: 18
    }
  }, React.createElement("li", null, "Endgame Anti-Dodging (in the last items)"), React.createElement("li", null, "No More Dodging"), React.createElement("li", null, "Skip Debt"), React.createElement("li", null, "When a manager runs out of skips")), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Every forced pick uses up an item, and nothing is forced when nobody can legally take it, so a draft always finishes.")), React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => set({
      skip: JSON.parse(JSON.stringify(SKIP_DEFAULTS))
    })
  }, "Reset Skip Rules to defaults")), tab === 'chaos' && React.createElement("div", {
    className: "stack",
    role: "tabpanel"
  }, React.createElement("p", {
    className: "hint"
  }, "Optional twists. All off unless you switch them on."), React.createElement(RuleSection, {
    id: "rs-chaos",
    emoji: "\uD83C\uDCCF",
    title: "Chaos Cards",
    on: tw.chaos.on,
    onToggle: v => setTw('chaos', {
      on: v
    }),
    summary: tw.chaos.on ? tw.chaos.count + ' per ' + (teams ? 'team' : 'manager') + ' · ' + CARD_TYPES.filter(c => tw.chaos[c]).map(c => CARD_INFO[c].name).join(', ') : 'Off'
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "r-cards"
  }, "Cards per ", teams ? 'team' : 'manager'), React.createElement(Stepper, {
    id: "r-cards",
    value: tw.chaos.count,
    min: 1,
    max: 5,
    onChange: v => setTw('chaos', {
      count: v
    })
  }), teams ? React.createElement("p", {
    className: "hint"
  }, "In team games, cards belong to the team, not each player.") : null), CARD_TYPES.map(c => React.createElement(Toggle, {
    key: c,
    on: tw.chaos[c],
    onChange: v => setTw('chaos', {
      [c]: v
    }),
    title: CARD_INFO[c].emoji + ' ' + CARD_INFO[c].name,
    sub: CARD_INFO[c].text + (c === 'steal' ? money(rules.inc) + '.' : '')
  }))), React.createElement(RuleSection, {
    id: "rs-mys",
    emoji: "\u2753",
    title: "Mystery items",
    on: tw.mystery.on,
    onToggle: v => setTw('mystery', {
      on: v
    }),
    summary: tw.mystery.on ? '1 in ' + tw.mystery.every + (defaultsMode ? '' : ' · ' + mysteryCount + ' in this topic') : 'Off'
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "How often"), React.createElement(Seg, {
    label: "Mystery frequency",
    value: tw.mystery.every,
    options: [[5, '1 in 5'], [8, '1 in 8'], [12, '1 in 12']],
    onChange: v => setTw('mystery', {
      every: v
    })
  })), React.createElement("p", {
    className: "hint"
  }, "Mystery items are auctioned face down and fit any open slot. You find out what you bought after it sells.")), React.createElement(RuleSection, {
    id: "rs-rar",
    emoji: "\u2728",
    title: "Rarity",
    on: tw.rarity.on,
    onToggle: v => setTw('rarity', {
      on: v
    }),
    summary: tw.rarity.on ? common + '% Common · ' + tw.rarity.rare + '% Rare · ' + tw.rarity.legendary + '% Legendary' : 'Off'
  }, React.createElement("div", {
    className: "row"
  }, React.createElement(PctField, {
    id: "r-rare",
    label: "Rare %",
    value: tw.rarity.rare,
    max: 100 - tw.rarity.legendary,
    onChange: v => setTw('rarity', {
      rare: v
    })
  }), React.createElement(PctField, {
    id: "r-leg",
    label: "Legendary %",
    value: tw.rarity.legendary,
    max: 100 - tw.rarity.rare,
    onChange: v => setTw('rarity', {
      legendary: v
    })
  })), React.createElement("p", {
    className: "hint"
  }, "Some items are marked Rare or Legendary, with a special reveal and an award for collecting them. Common is the rest (", common, "%). It doesn\u2019t change prices."))), tab === 'teams' && React.createElement("div", {
    className: "stack",
    role: "tabpanel"
  }, teamSummary && React.createElement("div", {
    className: "card stack-sm"
  }, React.createElement("b", null, "\uD83D\uDC65 ", teamSummary.text), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, teamSummary.detail, " Teams share one budget and bid as one."), onEditTeams && React.createElement("button", {
    className: "btn btn-sm",
    style: {
      alignSelf: 'flex-start'
    },
    onClick: onEditTeams
  }, "Edit players & teams")), React.createElement(RuleSection, {
    id: "rs-trade",
    emoji: "\uD83E\uDD1D",
    title: "Trade window after the draft",
    on: tw.trades.on,
    onToggle: v => setTw('trades', {
      on: v
    }),
    summary: tw.trades.on ? tw.trades.minutes + ' min' + (tw.trades.money ? ' · money allowed' : '') : 'Off'
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Trade window"), React.createElement(Seg, {
    label: "Trade window length",
    value: tw.trades.minutes,
    options: [[1, '1 min'], [3, '3 min'], [5, '5 min'], [10, '10 min']],
    onChange: v => setTw('trades', {
      minutes: v
    })
  })), React.createElement(Toggle, {
    on: tw.trades.money,
    onChange: v => setTw('trades', {
      money: v
    }),
    title: "Money in trades",
    sub: "A team can add cash to sweeten a 1-for-1 trade."
  }), React.createElement("p", {
    className: "hint"
  }, "1-for-1 swaps. Both teams must accept, and both items must fit the new team.")), React.createElement("p", {
    className: "hint"
  }, "Nomination (teams taking turns to choose the next item) is under General \u2192 Item order.")), tab === 'winner' && React.createElement("div", {
    className: "stack",
    role: "tabpanel"
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "How the champion is chosen"), React.createElement(Seg, {
    label: "Winner selection",
    value: fin.mode,
    options: [['vote', 'Vote'], ['bracket', 'Bracket'], ['sim', 'Matches'], ['combined', 'Combined']],
    onChange: v => setF({
      mode: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, fin.mode === 'vote' ? 'Everyone votes once for the best team (the classic way).' : fin.mode === 'bracket' ? 'Teams meet 1v1 in a knockout bracket. Players not in the matchup vote; you never vote for your own team.' : fin.mode === 'sim' ? 'Every bracket matchup is an animated football match. Win to go through.' : 'Each matchup has an animated match and a vote, combined into one score.'), !foot && (fin.mode === 'sim' || fin.mode === 'combined') && React.createElement("p", {
    className: "warn"
  }, "Matches only work for the football topics (Premier League Legends, Current Footballers, Football GOATs). For this topic the bracket uses votes instead.")), fin.mode === 'combined' && React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Weighting"), React.createElement(Seg, {
    label: "Weighting",
    value: fin.weight,
    options: [[50, '50/50'], [60, '60/40'], [70, '70/30']],
    onChange: v => setF({
      weight: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, "Match performance / votes. Goals become a 0\u2013100% share so a 6\u20135 thriller doesn\u2019t swamp the votes.")), (fin.mode === 'bracket' || fin.mode === 'combined') && React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "If a vote is tied"), React.createElement(Seg, {
    label: "Tiebreaker",
    value: fin.tiebreak,
    options: [['rating', 'Higher-rated team'], ['revote', 'Vote again once']],
    onChange: v => setF({
      tiebreak: v
    })
  }), fin.mode === 'combined' && React.createElement("p", {
    className: "hint"
  }, "In Combined, a dead-level total is settled by the match (extra time or penalties).")), (fin.mode === 'sim' || fin.mode === 'combined') && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Match speed"), React.createElement(Seg, {
    label: "Match speed",
    value: fin.speed,
    options: [['instant', 'Instant'], ['fast', 'Fast'], ['normal', 'Normal']],
    onChange: v => setF({
      speed: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, "How fast matches start playing. Everyone can still pause, change speed or skip while watching.")), React.createElement(Toggle, {
    on: fin.commentary,
    onChange: v => setF({
      commentary: v
    }),
    title: "Match commentary",
    sub: "Show the running commentary feed (goals and cards always show)."
  }), React.createElement(Toggle, {
    on: !!fin.home,
    onChange: v => setF({
      home: v
    }),
    title: "Home advantage",
    sub: "The higher seed plays at home: a small boost to its expected goals (+0.15). Off by default."
  }), React.createElement("p", {
    className: "hint"
  }, "Knockout matches that end level go to extra time, then penalties. Player ratings are estimated game ratings, not official EA Sports FC ratings."))), tab === 'review' && React.createElement("div", {
    className: "stack",
    role: "tabpanel"
  }, React.createElement("p", {
    className: "hint"
  }, "Everything that will be in play", defaultsMode ? ' for new games' : '', ":"), React.createElement(RulesSummary, {
    rules: {
      ...rules,
      slots: defaultsMode ? [] : slots
    },
    opts: {
      teams
    }
  })), problems.map(p => React.createElement("p", {
    key: p,
    className: p.startsWith('Heads up') ? 'hint' : 'warn'
  }, p)), React.createElement("div", {
    className: "row"
  }, tab !== 'review' && React.createElement("button", {
    className: "btn grow",
    onClick: () => setTab('review')
  }, "Review rules"), React.createElement("button", {
    className: "btn btn-gold grow",
    disabled: blocking.length > 0,
    onClick: () => onStart({
      ...rules,
      slots: defaultsMode ? rules.slots : slots
    })
  }, startLabel)), onReset && React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => setAskReset(true)
  }, "Reset rules to defaults"), askReset && React.createElement(Confirm, {
    title: "Reset rules?",
    body: "Budget and bidding go back to the standard rules, skip rules go back to their defaults, and every optional twist is switched off.",
    yes: "Reset",
    onYes: () => {
      onReset();
      if (!defaultsMode) setSlotTxt(topic.slots.join(', '));
    },
    onClose: () => setAskReset(false)
  }));
}
function ManagerButton({
  d,
  m,
  onBid,
  onCustom,
  onOut,
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
  }, "Thinking\u2026") : readOnly ? blocker || (m.cover ? '📡 Away · bot covering' : botInfo ? botInfo.short : (m.uid || m.members) && d.mode === 'online' ? '📱 On their phone' : 'Watching') : blocker || 'Tap: ' + money(amt);
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
  }, m.emoji, " ", m.name), m.members && React.createElement("span", {
    className: "mem"
  }, m.members.map(p => p.name).join(' · ')), React.createElement("span", {
    className: "money num"
  }, money(m.budget), d.cards && d.cards[m.id] && d.cards[m.id].length ? React.createElement("span", {
    className: "cardchip",
    title: "Chaos Cards left"
  }, "\uD83C\uDCCF", d.cards[m.id].length) : null), React.createElement("span", {
    className: "st"
  }, status, " \xB7 ", filled, "/", d.rules.slots.length), (() => {
    const ch = skipChip(d, m);
    return ch ? React.createElement("span", {
      className: 'skipchip' + (ch.tone ? ' ' + ch.tone : '')
    }, ch.text) : null;
  })(), onOut && React.createElement("button", {
    className: "edit outbtn",
    "aria-label": m.name + ' is out on this item',
    title: "Out on this item",
    onPointerDown: e => e.stopPropagation(),
    onPointerUp: e => e.stopPropagation(),
    onClick: e => {
      e.stopPropagation();
      onOut();
    }
  }, "\u270B"), customOk && React.createElement("button", {
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
  const enabled = (d.mode === 'solo' || d.mode === 'online') && !(d.solo && d.solo.talk === false);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const say = (who, event, extra, force) => {
    if (!enabled) return;
    const bot = typeof who === 'object' ? who : d.managers.find(m => m.id === who) || botActors(d).find(a => a.speaker === who);
    if (!bot || !isBot(bot)) return;
    const botId = bot.id;
    const now = Date.now();
    if (!force && (now - last.current < ms(3000) || now - (per.current[botId] || 0) < ms(7000))) return;
    if (!force && Math.random() > (TALK_CHANCE[event] != null ? TALK_CHANCE[event] : 0.3)) return;
    const line = botLine({
      ...bot,
      id: bot.speaker || bot.id
    }, event, extra);
    if (!line) return;
    const text = d.teamMode ? bot.name + ': ' + line : line;
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
function RarityTag({
  r
}) {
  return r && r !== 'common' ? React.createElement("span", {
    className: 'rtag ' + r
  }, r === 'legendary' ? '★ Legendary' : '◆ Rare') : null;
}
function ItemCard({
  item: real,
  d
}) {
  const item = visibleItem(d, real.id);
  const rar = rarityOf(d, real.id);
  if (item.hidden) return React.createElement("div", {
    className: "flip"
  }, React.createElement("div", {
    className: "flip-inner"
  }, React.createElement("div", {
    className: "face itemcard mysterycard"
  }, React.createElement("div", {
    className: "ph mys",
    "aria-hidden": "true"
  }, "?"), React.createElement("div", {
    className: "info"
  }, React.createElement("span", null, React.createElement("span", {
    className: "pos"
  }, "MYSTERY")), React.createElement("div", {
    className: "nm"
  }, "Mystery item"), React.createElement("div", {
    className: "ds"
  }, "Face down. You find out what it is after it sells."), React.createElement("div", {
    className: "fits"
  }, "Fits any open slot"))), React.createElement("div", {
    className: "face back"
  }, React.createElement("span", null, "?"))));
  const pos = norm(item.pos);
  const inTemplate = pos && d.rules.slots.some(s => norm(s) === pos);
  const hasFlex = d.rules.slots.some(isFlex);
  return React.createElement("div", {
    className: 'flip' + (rar ? ' r-' + rar : '')
  }, React.createElement("div", {
    className: "flip-inner"
  }, React.createElement("div", {
    className: 'face itemcard' + (rar ? ' r-' + rar : '')
  }, React.createElement("div", {
    className: "ph"
  }, React.createElement(ItemArt, {
    item: item,
    topic: d.topic,
    size: 104,
    radius: 16
  })), React.createElement("div", {
    className: "info"
  }, React.createElement("span", {
    className: "row",
    style: {
      gap: 6,
      flexWrap: 'wrap'
    }
  }, item.pos && React.createElement("span", {
    className: "pos"
  }, item.pos), React.createElement(RarityTag, {
    r: rar
  }), isFootball(d.topic) && React.createElement(RatingChip, {
    item: item
  })), React.createElement("div", {
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
function CardSheet({
  d,
  by: fixedBy,
  onPlay,
  onDouble,
  onClose
}) {
  const [by, setBy] = useState(fixedBy || null);
  const [card, setCard] = useState(null);
  const [target, setTarget] = useState(null);
  const [mine, setMine] = useState(null);
  const [item, setItem] = useState(null);
  const minPay = Math.max(d.rules.minBid, Math.ceil(nextAmount(d) / 2));
  const [pay, setPay] = useState(minPay);
  const team = by && teamOf(d, by);
  const rivals = d.managers.filter(m => m.id !== by);
  const reset = () => {
    setCard(null);
    setTarget(null);
    setMine(null);
    setItem(null);
  };
  const itemsOf = m => m.team.filter(Boolean);
  const title = t => React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 30
    }
  }, t);
  if (!by) return React.createElement(Sheet, {
    center: true,
    onClose: onClose
  }, title('Who’s playing a card?'), React.createElement("div", {
    className: "stack-sm"
  }, d.managers.map(m => React.createElement("button", {
    key: m.id,
    className: "votebtn",
    style: {
      ...mStyle(m),
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    disabled: !(d.cards[m.id] || []).length,
    onClick: () => setBy(m.id)
  }, React.createElement("span", null, m.emoji, " ", m.name), React.createElement("span", null, "\uD83C\uDCCF ", (d.cards[m.id] || []).length)))), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onClose
  }, "Close"));
  const params = {
    target,
    item,
    mine
  };
  const problem = card === 'double' ? doubleProblem(d, by, pay) : card ? cardProblem(d, by, card, params) : null;
  const ready = card && !problem && (card === 'double' || card === 'freeze' ? card === 'double' || target : card === 'steal' ? target && item : target && item && mine);
  let summary = '';
  if (card === 'double') summary = 'Bid ' + money(pay) + '. It counts as ' + money(pay * 2) + '. You pay ' + money(pay) + ' if you win.';
  if (card === 'freeze' && target) summary = teamOf(d, target).name + ' can’t bid on this item.';
  if (card === 'steal' && item) {
    const owner = teamOf(d, target);
    const t = owner.team.find(x => x && x.itemId === item);
    summary = 'Take ' + d.items[item].name + ' from ' + owner.name + '. You pay them ' + money(stealPrice(d, t)) + '.';
  }
  if (card === 'swap' && item && mine) summary = 'Give ' + d.items[mine].name + ', get ' + d.items[item].name + ' from ' + teamOf(d, target).name + '.';
  return React.createElement(Sheet, {
    center: true,
    onClose: onClose
  }, React.createElement("p", {
    className: "eyebrow"
  }, team.emoji, " ", team.name, " \xB7 Chaos Cards"), !card ? React.createElement(React.Fragment, null, title('Play a card'), !cardWindow(d) && React.createElement("p", {
    className: "hint"
  }, "Steal, Swap and Freeze can only be played before the first bid on an item."), React.createElement("div", {
    className: "stack-sm"
  }, (d.cards[by] || []).map((c, i) => {
    const info = CARD_INFO[c];
    const why = c === 'veto' ? 'Kept for defence. It’s used when someone targets you.' : c === 'double' ? doubleProblem(d, by, Math.max(minPay, d.rules.minBid)) : !cardWindow(d) ? 'Only before the first bid.' : null;
    return React.createElement("button", {
      key: c + i,
      className: "cardbtn",
      disabled: c === 'veto' || c !== 'double' && !cardWindow(d),
      onClick: () => {
        setCard(c);
        setPay(minPay);
      }
    }, React.createElement("span", {
      className: "ce"
    }, info.emoji), React.createElement("span", {
      className: "grow",
      style: {
        minWidth: 0
      }
    }, React.createElement("b", null, info.name), React.createElement("span", {
      className: "small",
      style: {
        display: 'block',
        opacity: 0.85
      }
    }, info.text, c === 'steal' ? money(d.rules.inc) + '.' : ''), why && React.createElement("span", {
      className: "small muted",
      style: {
        display: 'block'
      }
    }, why)));
  }), !(d.cards[by] || []).length && React.createElement("p", {
    className: "hint"
  }, "No cards left.")), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: fixedBy ? onClose : () => setBy(null)
  }, fixedBy ? 'Close' : 'Back')) : React.createElement(React.Fragment, null, title(CARD_INFO[card].emoji + ' ' + CARD_INFO[card].name), card === 'double' && React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "dbl-pay"
  }, "You pay"), React.createElement(Stepper, {
    id: "dbl-pay",
    prefix: "$",
    value: pay,
    min: minPay,
    max: Math.max(minPay, maxBid(team, d.rules)),
    onChange: setPay
  })), (card === 'freeze' || card === 'steal' || card === 'swap') && React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Rival team"), React.createElement("div", {
    className: "chips"
  }, rivals.map(m => React.createElement("button", {
    key: m.id,
    className: 'pickchip' + (target === m.id ? ' on' : ''),
    style: mStyle(m),
    onClick: () => {
      setTarget(m.id);
      setItem(null);
    }
  }, m.emoji, " ", m.name)))), card === 'swap' && React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Your item to give"), React.createElement("div", {
    className: "stack-sm"
  }, itemsOf(team).map(t => React.createElement("button", {
    key: t.itemId,
    className: 'pickbtn' + (mine === t.itemId ? ' on' : ''),
    onClick: () => setMine(t.itemId)
  }, React.createElement(Thumb, {
    item: d.items[t.itemId],
    topic: d.topic
  }), React.createElement("span", {
    className: "grow"
  }, d.items[t.itemId].name))), !itemsOf(team).length && React.createElement("p", {
    className: "hint"
  }, "You don\u2019t own anything yet."))), (card === 'steal' || card === 'swap') && target && React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, card === 'steal' ? 'Item to steal' : 'Item to get'), React.createElement("div", {
    className: "stack-sm"
  }, itemsOf(teamOf(d, target)).map(t => React.createElement("button", {
    key: t.itemId,
    className: 'pickbtn' + (item === t.itemId ? ' on' : ''),
    onClick: () => setItem(t.itemId)
  }, React.createElement(Thumb, {
    item: d.items[t.itemId],
    topic: d.topic
  }), React.createElement("span", {
    className: "grow"
  }, d.items[t.itemId].name), card === 'steal' && React.createElement("span", {
    className: "num",
    style: {
      fontFamily: 'var(--display)',
      color: 'var(--gold)'
    }
  }, money(stealPrice(d, t))))), !itemsOf(teamOf(d, target)).length && React.createElement("p", {
    className: "hint"
  }, "They don\u2019t own anything yet."))), summary && React.createElement("p", {
    className: "summary"
  }, summary), problem && (card === 'double' || target) && React.createElement("p", {
    className: "warn"
  }, problem), React.createElement("div", {
    className: "row pin"
  }, React.createElement("button", {
    className: "btn btn-ghost grow",
    onClick: reset
  }, "Back"), React.createElement("button", {
    className: "btn btn-gold grow",
    disabled: !ready,
    onClick: () => {
      if (card === 'double') onDouble(by, pay);else onPlay(by, card, params);
      onClose();
    }
  }, "Play ", CARD_INFO[card].name))));
}
function cardPlayText(d, play) {
  const by = teamOf(d, play.by),
    them = teamOf(d, play.target);
  if (play.card === 'freeze') return by.name + ' wants to FREEZE ' + them.name + ' for this item.';
  if (play.card === 'steal') {
    const t = them.team.find(x => x && x.itemId === play.item);
    return by.name + ' wants to STEAL ' + d.items[play.item].name + ' from ' + them.name + (t ? ' for ' + money(stealPrice(d, t)) : '') + '.';
  }
  if (play.card === 'swap') return by.name + ' wants to SWAP ' + d.items[play.mine].name + ' for ' + them.name + '’s ' + d.items[play.item].name + '.';
  return '';
}
function VetoSheet({
  d,
  onAnswer
}) {
  const play = d.pending;
  const them = teamOf(d, play.target);
  return React.createElement(Sheet, {
    center: true,
    onClose: () => {}
  }, React.createElement("p", {
    className: "eyebrow"
  }, "\uD83D\uDED1 Veto?"), React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 30,
      color: them.color
    }
  }, them.emoji, " ", them.name), React.createElement("p", {
    className: "summary"
  }, cardPlayText(d, play)), React.createElement("p", {
    className: "hint"
  }, "You have a Veto card. Use it to block this? ", d.mode === 'local' ? 'Pass the phone to ' + them.name + '.' : ''), React.createElement("div", {
    className: "row pin"
  }, React.createElement("button", {
    className: "btn grow",
    onClick: () => onAnswer(false)
  }, "Let it happen"), React.createElement("button", {
    className: "btn btn-gold grow",
    onClick: () => onAnswer(true)
  }, "Use Veto")));
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
  const net = useNet();
  const nv = netView(d, net);
  const online = nv.online;
  const auto = solo || online;
  const act = useAct(d, setDraft);
  const [pausedLocal, setPaused] = useState(false);
  const [gavelLocal, setGavel] = useState(false);
  const [custom, setCustom] = useState(null);
  const [teams, setTeams] = useState(false);
  const [thinkingLocal, setThinking] = useState(null);
  const paused = nv.isHost ? pausedLocal : !!nv.live.paused;
  const gavel = nv.isHost ? gavelLocal : !!nv.live.gavel;
  const thinking = nv.isHost ? thinkingLocal : nv.live.thinking || null;
  const [cardsOpen, setCardsOpen] = useState(false);
  const cardTried = useRef(new Set());
  const hold = paused || !!d.pending;
  const busy = useRef(false);
  const timer = solo ? d.solo && d.solo.clock || 8 : online ? d.online && d.online.clock || ONLINE.clock : d.rules.timer || 0;
  const [leftLocal, setLeft] = useState(timer);
  const bidKey = bidKeyOf(d);
  const left = nv.isHost ? leftLocal : nv.live.key === bidKey && typeof nv.live.left === 'number' ? nv.live.left : timer;
  const talk = useBotTalk(d);
  const bubbles = nv.isHost ? talk.bubbles : nv.live.bubbles || {};
  useEffect(() => {
    if (nv.isHost && net && net.publishLive) net.publishLive({
      left: leftLocal,
      key: bidKey,
      paused: pausedLocal,
      gavel: gavelLocal,
      thinking: thinkingLocal,
      bubbles: talk.bubbles
    });
  }, [online, nv.isHost, leftLocal, bidKey, pausedLocal, gavelLocal, thinkingLocal, talk.bubbles]);
  const live = useRef({});
  live.current = {
    d,
    paused: hold,
    flashing,
    gavel,
    left
  };
  useEffect(() => {
    setLeft(timer);
  }, [bidKey, timer]);
  const leader = d.bid && d.managers.find(m => m.id === d.bid.leaderId);
  const total = d.processed + d.queue.length;
  const you = solo ? d.managers.find(m => m.human) : online ? d.managers.find(m => nv.controls(m.id)) : null;
  function sold() {
    if (!d.bid || busy.current || flashing) return;
    busy.current = true;
    const price = d.bid.amount;
    const winnerId = d.bid.leaderId;
    const bidders = [...new Set(d.bids.filter(Boolean).map(b => b.leaderId))].filter(id => id !== winnerId);
    const real = d.items[d.queue[0]];
    const info = {
      kind: 'sold',
      name: leader.name,
      emoji: leader.emoji,
      color: leader.color,
      price,
      item: real.name,
      mystery: !!real.mystery,
      rarity: (d.rarity || {})[real.id] || null,
      doubled: !!d.bid.double
    };
    buzz([40, 30, 160]);
    setGavel(true);
    setThinking(null);
    const big = price >= d.rules.budget * ((audio.cfg.bigSale || 40) / 100);
    info.big = big;
    audio.play(big ? 'big' : 'gavel');
    let line = callLine('sold', {
      who: leader.name,
      amt: money(price)
    });
    if (big) line += ' ' + callLine('big');
    if (real.mystery) {
      audio.play('drumroll');
      line += ' ' + callLine('mysteryReveal', {
        item: real.name
      });
    }
    if (info.rarity === 'legendary') {
      line += ' ' + callLine('legendary');
      setTimeout(() => audio.play('cheer'), 900);
    } else if (info.rarity === 'rare') line += ' ' + callLine('rare');else if (big) setTimeout(() => audio.play('cheer'), 500);
    audio.say(line, 3, d.id + ':sold:' + d.reveal);
    setTimeout(() => {
      setGavel(false);
      onFlash(info);
      setDraft(p => sell(p));
      busy.current = false;
      if (nv.runsBots) talk.later(ms(1900), () => {
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
    const out = unsoldOutcome(d);
    const back = (out.kind === 'bounce' || d.rules.noBids === 'back') && !d.passed.includes(d.queue[0]);
    setThinking(null);
    if (out.kind === 'forced') {
      const real = d.items[d.queue[0]];
      const m = out.m;
      buzz([60, 40, 60]);
      audio.play('buzzer');
      audio.say(callLine('forced', {
        who: m.name,
        amt: money(d.rules.minBid)
      }), 2, d.id + ':forced:' + d.reveal);
      onFlash({
        kind: 'forced',
        name: m.name,
        emoji: m.emoji,
        color: m.color,
        price: d.rules.minBid,
        item: real.name,
        mystery: !!real.mystery
      });
    } else {
      const c = skipCfg(d);
      let note = null;
      if (out.kind === 'charge') {
        const v = skipVerdict(d, out.m.id);
        const left = out.cost === 'normal' ? v.left - 1 : null;
        note = out.m.emoji + ' ' + out.m.name + ' used ' + (out.cost === 'debt' ? 'a skip on credit (+1 skip debt)' : out.cost === 'final' ? 'their final chance' : out.cost === 'escalate' ? 'a last-ditch skip' : 'a skip') + (left != null && c.max >= 0 ? ' · ' + left + ' left' : '');
        if (c.warn && left === 1) note += ' · ⚠️ last skip!';
        if (c.warn && left === 0) note += ' · no skips left: next one’s forced';
        audio.say(callLine('skipUsed', {
          who: out.m.name
        }), 1, d.id + ':skip:' + d.reveal);
      } else audio.say(callLine('noBids'), 1, d.id + ':skip:' + d.reveal);
      onFlash({
        kind: 'skip',
        item: visibleItem(d, item.id).name,
        back,
        note
      });
    }
    setDraft(p => skipItem(p));
  }
  useEffect(() => {
    if (!nv.isHost || !timer || hold || flashing || gavel) return undefined;
    const t = setInterval(() => setLeft(l => l > 0 ? l - 1 : 0), ms(1000));
    return () => clearInterval(t);
  }, [bidKey, hold, flashing, gavel, timer, nv.isHost]);
  const owe = owing(d);
  useEffect(() => {
    if (!nv.isHost || !timer || hold || flashing || gavel || left > 0 || owe.length) return;
    if (d.bid) sold();else if (auto) skip();
  }, [left, hold, flashing, gavel, timer, nv.isHost, owe.length]);
  const endNow = auctionEnd(d);
  useEffect(() => {
    if (!nv.isHost || hold || flashing || gavel || !endNow) return undefined;
    const t = setTimeout(() => {
      const cur = live.current;
      if (cur.paused || cur.flashing || cur.gavel || busy.current || auctionEnd(cur.d) !== endNow) return;
      if (endNow === 'sell') sold();else skip();
    }, ms(600));
    return () => clearTimeout(t);
  }, [endNow, bidKey, hold, flashing, gavel, nv.isHost]);
  const cardKey = bidKey + ':' + JSON.stringify(d.cards || {}) + ':' + (d.cardLog || []).length + ':' + outIds(d).length;
  useEffect(() => {
    if (!nv.runsBots || hold || flashing || gavel || busy.current || d.phase !== 'auction') {
      setThinking(null);
      return undefined;
    }
    let cardPlan = null;
    if (cardWindow(d)) {
      for (const a of botActors(d)) {
        const k = d.reveal + ':' + a.speaker;
        if (cardTried.current.has(k)) continue;
        cardTried.current.add(k);
        const c = botCardPlay(d, a);
        if (c) {
          cardPlan = c;
          break;
        }
      }
    }
    const plan = cardPlan || nextBotAction(d) || botForcedBid(d) || botSkipSave(d);
    const passers = cardPlan ? [] : botPassers(d);
    const tOut = passers.length ? setTimeout(() => {
      const cur = live.current;
      if (cur.paused || cur.flashing || cur.gavel || busy.current) return;
      setDraft(p => {
        const still = new Set(botPassers(p));
        return passers.filter(id => still.has(id)).reduce((n, id) => withdraw(n, id), p);
      });
    }, ms(plan ? 450 : 700)) : null;
    if (!plan) {
      setThinking(null);
      return () => clearTimeout(tOut);
    }
    setThinking(plan.botId);
    const t = setTimeout(() => {
      const cur = live.current;
      if (cur.paused || cur.flashing || cur.gavel || busy.current || cur.left <= 0 && !owing(cur.d).length || cur.d.phase !== 'auction') return;
      setThinking(null);
      const speaker = botActors(d).find(a => a.speaker === plan.speaker) || plan.botId;
      if (plan.card) {
        setDraft(p => p.reveal === d.reveal && !p.bid ? playCard(p, plan.botId, plan.card, plan.params) : p);
        talk.say(speaker, 'card', null, true);
        return;
      }
      setDraft(p => bidKeyOf(p) === bidKey && p.phase === 'auction' ? placeBid(p, plan.botId, plan.amount, plan.double ? {
        double: true
      } : undefined) : p);
      talk.say(speaker, plan.event);
    }, ms(plan.delay));
    return () => {
      clearTimeout(t);
      clearTimeout(tOut);
    };
  }, [cardKey, hold, flashing, gavel, nv.runsBots]);
  useEffect(() => {
    if (!d.pending) return undefined;
    const victim = teamOf(d, d.pending.target);
    const botVictim = nv.runsBots && victim && (isBot(victim) || isBotTeam(victim));
    if (!botVictim) return undefined;
    const id = d.pending.id;
    const t = setTimeout(() => setDraft(p => p.pending && p.pending.id === id ? answerCard(p, botVeto(p, teamOf(p, p.pending.target), p.pending)) : p), ms(1200));
    return () => clearTimeout(t);
  }, [d.pending && d.pending.id, nv.runsBots]);
  const logLen = (d.cardLog || []).length;
  const seenLog = useRef(logLen);
  useEffect(() => {
    if (logLen > seenLog.current) {
      const e = d.cardLog[logLen - 1];
      audio.play(e.result === 'done' ? 'card' : 'buzzer');
      audio.say(e.result === 'vetoed' ? callLine('vetoed') : e.result === 'done' ? callLine('card', {
        who: teamOf(d, e.by).name,
        card: CARD_INFO[e.card].name
      }) : '', 2, d.id + ':card:' + e.id);
      onFlash({
        kind: 'card',
        card: e.card,
        result: e.result,
        text: e.detail,
        by: teamOf(d, e.by)
      });
    }
    seenLog.current = logLen;
  }, [logLen]);
  const hookKey = (() => {
    const p = presenter(d);
    return p && p.forced ? d.id + ':' + d.reveal + ':' + p.m.id : null;
  })();
  const announced = useRef(null);
  useEffect(() => {
    if (!hookKey || flashing || announced.current === hookKey) return;
    announced.current = hookKey;
    const m = forcedPresenter(d);
    audio.say(callLine('dodge', {
      who: m.name
    }), 2, 'dodge:' + hookKey);
    if ((!online || nv.isHost) && !nv.tv && !(net && net.passive)) onFlash({
      kind: 'dodge',
      name: m.name,
      emoji: m.emoji,
      color: m.color,
      price: d.rules.minBid,
      endgame: (presenter(d) || {}).why === 'endgame'
    });
  }, [hookKey, flashing]);
  useEffect(() => {
    if (!nv.runsBots || flashing || d.bid || !item) return;
    const advisers = botAdvisers(d);
    if (!advisers.length) return;
    const a = advisers[d.reveal % advisers.length];
    const vis = visibleItem(d, item.id);
    if (assignSlot(a, vis, d.rules.slots) < 0) return;
    const {
      limit
    } = botLimit(d, a, vis, seeded(d.seed, 'adv', d.reveal));
    if (limit >= d.rules.minBid) talk.say(a, 'advise', {
      slot: money(limit)
    });else talk.say(a, 'pass');
  }, [d.reveal, flashing]);
  useEffect(() => {
    if (flashing || !item || d.bid) return;
    const vis = visibleItem(d, item.id);
    const r = rarityOf(d, item.id);
    const line = vis.hidden ? callLine('mystery') : r === 'legendary' ? callLine('legendaryUp') + ' ' + callLine('next', {
      item: vis.name
    }) : callLine('next', {
      item: vis.name
    });
    if (r === 'legendary') audio.play('drumroll');
    audio.say(line, 1, d.id + ':next:' + d.reveal);
  }, [d.reveal, flashing]);
  const lastCall = useRef(0);
  useEffect(() => {
    if (!d.bid) return;
    audio.play('bid');
    const who = leader && leader.name || '';
    const amt = money(d.bid.amount);
    const leads = new Set(d.bids.filter(Boolean).map(b => b.leaderId).concat(d.bid.leaderId)).size;
    if (d.bids.filter(Boolean).length === 0) {
      audio.say(callLine('open', {
        who,
        amt
      }), 1);
      lastCall.current = Date.now();
      return;
    }
    if (d.bids.filter(Boolean).length >= 4 && leads >= 2 && audio.say(callLine('war'), 1, d.id + ':war:' + d.reveal)) {
      lastCall.current = Date.now();
      return;
    }
    if (Date.now() - lastCall.current > 2200) {
      audio.say(callLine('raise', {
        who,
        amt
      }), 1);
      lastCall.current = Date.now();
    }
  }, [bidKey]);
  useEffect(() => {
    if (!timer || !d.bid || hold || flashing || gavel) return;
    if (left === 2) audio.say(callLine('once'), 2, d.id + ':once:' + bidKey);
    if (left === 1) audio.say(callLine('twice'), 2, d.id + ':twice:' + bidKey);
  }, [left]);
  useEffect(() => {
    if (!nv.runsBots || flashing) return;
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
  const frozenTeam = d.managers.find(m => frozenNow(d, m.id));
  const youAmt = you ? nextAmount(d) : 0;
  const youCan = you && !paused && !flashing && !gavel && canBid(d, you, youAmt);
  const youOutWhy = !you ? 'No team' : withdrawProblem(d, you.id);
  const outNames = outIds(d).map(id => (teamOf(d, id) || {}).name).filter(Boolean);
  const going = timer > 0 && d.bid && left <= 2 && left > 0 ? left === 2 ? 'Going once…' : 'Going twice…' : null;
  const ordered = auto ? [...d.managers].sort((a, b) => (nv.controls(b.id) ? 1 : 0) - (nv.controls(a.id) ? 1 : 0)) : d.managers;
  const vetoHere = d.pending && nv.controls(d.pending.target) && !(nv.runsBots && (isBot(teamOf(d, d.pending.target)) || isBotTeam(teamOf(d, d.pending.target)))) && !(solo && (isBot(teamOf(d, d.pending.target)) || isBotTeam(teamOf(d, d.pending.target))));
  return React.createElement("div", {
    className: 'app auction' + (auto ? ' solo' : '')
  }, React.createElement("div", {
    className: "topbar dense"
  }, React.createElement("button", {
    className: "iconbtn",
    onClick: goHome,
    "aria-label": "Home"
  }, "\u2302"), React.createElement("span", {
    className: "grow"
  }), React.createElement(MuteButton, null), React.createElement(TvButton, null), ruleOn(d, 'chaos') && (!online || you) && React.createElement("button", {
    className: "pillbtn",
    onClick: () => setCardsOpen(true),
    "aria-label": "Chaos Cards"
  }, "\uD83C\uDCCF"), React.createElement("button", {
    className: "pillbtn",
    onClick: () => setTeams(true)
  }, "Teams"), nv.isHost && !nv.tv && React.createElement("button", {
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
    className: "small muted num",
    style: {
      whiteSpace: 'nowrap'
    }
  }, "Item ", d.processed + 1, " of ", total, " \xB7 ", d.queue.length - 1, " left")), React.createElement("div", {
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
  }, leader ? leader.emoji + ' ' + leader.name + ' leads' : timer > 0 && left <= 0 ? "Time's up · no bids" : auto ? 'Opening bid · bid or wait' : 'Opening bid · tap a manager'), React.createElement("div", {
    className: "going",
    "aria-live": "polite"
  }, d.pending ? '🛑 Waiting for a Veto answer…' : owe.length && timer > 0 && left <= 0 ? '⏳ Waiting for ' + owe.map(m => m.name).join(', ') + ' to bid' : going || (thinker ? '💭 ' + thinker.name + ' is thinking…' : you && isOut(d, you.id) ? '✋ You’re out on this item' : frozenTeam ? '🧊 ' + frozenTeam.name + ' is frozen for this item' : outNames.length ? '✋ Out: ' + outNames.join(', ') : ' ')), timer > 0 && React.createElement("span", {
    className: "timer",
    style: {
      width: Math.max(0, left) / timer * 100 + '%'
    }
  })), (() => {
    const pl = presenterLine(d);
    const soon = endgameSoon(d);
    return pl || soon || endgameNow(d) ? React.createElement("div", {
      className: 'skipline' + (pl && pl.forced ? ' hook' : ''),
      role: "status"
    }, pl && React.createElement("span", null, pl.text), soon && React.createElement("span", {
      className: "small"
    }, "\u26A0\uFE0F Skips lock in ", d.queue.length - skipCfg(d).endgame.at, " item", d.queue.length - skipCfg(d).endgame.at === 1 ? '' : 's', ": the last ", skipCfg(d).endgame.at, " must be taken."), !soon && endgameNow(d) && !(pl && pl.forced) && React.createElement("span", {
      className: "small"
    }, "\u23F3 Endgame: skips are restricted for the last ", skipCfg(d).endgame.at, " items.")) : null;
  })(), paused && React.createElement("div", {
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
  }, "Paused"), nv.isHost ? React.createElement("button", {
    className: "btn btn-gold",
    style: {
      width: 200
    },
    onClick: () => setPaused(false)
  }, "Resume") : React.createElement("p", {
    className: "muted",
    style: {
      margin: 0
    }
  }, "The host paused the game.")))), React.createElement("div", {
    className: "mgr-grid"
  }, ordered.map(m => React.createElement(ManagerButton, {
    key: m.id,
    d: d,
    m: m,
    disabledAll: hold || flashing || gavel,
    readOnly: (auto || nv.tv) && !nv.controls(m.id),
    bubble: bubbles[m.id],
    thinking: thinking === m.id,
    onBid: amt => {
      buzz(12);
      act('bid', m.id, amt);
    },
    onOut: !auto && !nv.tv && !hold && !flashing && !gavel && !withdrawProblem(d, m.id) && !isOut(d, m.id) ? () => {
      buzz(12);
      act('withdraw', m.id);
    } : null,
    onCustom: () => setCustom(m.id)
  }))), React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, nv.tv ? online ? 'Bid from your phones · it sells when the clock runs out' : timer ? 'Live auction · it sells when the clock runs out' : 'Live auction' : online && !you ? 'You’re watching this game.' : auto ? 'Tap Bid to raise +' + money(d.rules.inc) + ' · ✎ on your card for a custom bid · it sells when the clock runs out' : 'Tap to bid +' + money(d.rules.inc) + ' · hold or ✎ for a custom bid'), auto ? you ? React.createElement("div", {
    className: "actions duo"
  }, React.createElement("button", {
    className: "btn",
    disabled: hold || flashing || gavel || !!youOutWhy,
    title: youOutWhy || '',
    onClick: () => {
      buzz(12);
      act('withdraw', you.id);
    }
  }, you && isOut(d, you.id) ? 'You’re out' : 'I’m out'), React.createElement("button", {
    className: "btn btn-gold sold",
    disabled: !youCan,
    onClick: () => {
      buzz(12);
      act('bid', you.id, youAmt);
    }
  }, you && isOut(d, you.id) ? 'Out ✋' : you && isFull(you) ? 'Team full' : you && !canBid(d, you, youAmt) ? 'Can’t bid' : (d.bid && d.bid.leaderId === you.id ? 'Raise to ' : 'Bid ') + money(youAmt)), you && owesBid(d, you) && !hold && React.createElement("p", {
    className: "hint duo-note"
  }, "Require every manager to bid is on: bid once before you can drop out."), you && skipWithdrawProblem(d, you.id) && !hold && React.createElement("p", {
    className: "hint duo-note"
  }, "\uD83D\uDD12 You\u2019re out of skips: you can\u2019t drop out of this one. Anyone can still outbid you; if nobody bids, it\u2019s yours for ", money(d.rules.minBid), "."), you && isOut(d, you.id) && React.createElement("p", {
    className: "hint duo-note"
  }, "You can\u2019t bid again on this item", d.bid && d.bid.leaderId === you.id ? ', but your bid still stands' : '', ". You\u2019re back in on the next one.")) : null : React.createElement("div", {
    className: "actions"
  }, React.createElement("button", {
    className: "btn",
    onClick: () => setDraft(p => undo(p)),
    disabled: hold || flashing || !d.bid && !d.history.length
  }, undoLabel(d)), React.createElement("button", {
    className: "btn",
    onClick: skip,
    disabled: hold || flashing || !!d.bid || owe.length > 0
  }, (() => {
    const o = unsoldOutcome(d);
    return o.kind === 'forced' ? 'No bids → ' + o.m.name : 'No bids';
  })()), React.createElement("button", {
    className: "btn btn-gold sold",
    onClick: sold,
    disabled: hold || flashing || !d.bid || owe.length > 0
  }, "Sold!")), gavel && React.createElement("div", {
    className: "gavel",
    "aria-hidden": "true"
  }, "\uD83D\uDD28"), custom && React.createElement(CustomBid, {
    d: d,
    m: d.managers.find(x => x.id === custom),
    onSet: n => {
      buzz(12);
      act('bid', custom, n);
    },
    onClose: () => setCustom(null)
  }), teams && React.createElement(TeamsSheet, {
    d: d,
    onClose: () => setTeams(false)
  }), cardsOpen && React.createElement(CardSheet, {
    d: d,
    by: auto && you ? you.id : null,
    onClose: () => setCardsOpen(false),
    onPlay: (by, card, params) => act('card', by, card, params),
    onDouble: (by, pay) => {
      buzz(20);
      act('bid', by, pay, true);
    }
  }), vetoHere && React.createElement(VetoSheet, {
    d: d,
    onAnswer: v => act('veto', v, d.pending.id)
  }));
}
function Nominate({
  d,
  setDraft,
  goHome
}) {
  const [q, setQ] = useState('');
  const [pick, setPick] = useState(null);
  const [teams, setTeams] = useState(false);
  const [paused, setPaused] = useState(false);
  const cur = currentNominator(d);
  const solo = d.mode === 'solo';
  const nv = netView(d, useNet());
  const act = useAct(d, setDraft);
  const isBotTurn = !!(cur && (solo || nv.online) && (isBot(cur.m) || isBotTeam(cur.m)));
  const botTurn = isBotTurn && nv.runsBots;
  const canPick = !!cur && !isBotTurn && nv.controls(cur.m.id);
  const talk = useBotTalk(d);
  const live = useRef({});
  live.current = {
    d,
    paused
  };
  useEffect(() => {
    if (!botTurn || paused) return undefined;
    const actor = botActors(d).find(a => a.id === cur.m.id);
    const id = actor && botNominate(d, actor);
    if (!id) return undefined;
    const reveal = d.reveal;
    const t = setTimeout(() => {
      if (live.current.paused || live.current.d.reveal !== reveal) return;
      setDraft(p => p.reveal === reveal ? nominate(p, id) : p);
      talk.say(actor, 'nominate');
    }, ms(1300));
    return () => clearTimeout(t);
  }, [d.reveal, botTurn, paused]);
  if (!cur) return null;
  const pool = nominationPool(d).map(id => visibleItem(d, id));
  const shown = pool.filter(it => !q.trim() || (it.name + ' ' + (it.pos || '') + ' ' + (it.desc || '')).toLowerCase().includes(q.trim().toLowerCase()));
  return React.createElement("div", {
    className: "app"
  }, React.createElement("div", {
    className: "topbar dense wraptitle"
  }, React.createElement("button", {
    className: "iconbtn",
    onClick: goHome,
    "aria-label": "Home"
  }, "\u2302"), React.createElement(MuteButton, null), React.createElement(TvButton, null), React.createElement("div", {
    className: "title"
  }, "Nomination \xB7 ", d.processed + 1, " of ", d.processed + d.queue.length), React.createElement("span", {
    className: "grow"
  }), React.createElement("button", {
    className: "pillbtn",
    onClick: () => setTeams(true)
  }, "Teams"), (solo || nv.online && nv.isHost) && React.createElement("button", {
    className: "iconbtn",
    onClick: () => setPaused(p => !p),
    "aria-label": paused ? 'Resume' : 'Pause'
  }, paused ? '▶' : 'Ⅱ')), React.createElement("div", {
    className: "picker",
    style: mStyle(cur.m)
  }, React.createElement("p", {
    className: "eyebrow"
  }, "Nominating"), React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 40
    }
  }, cur.m.emoji, " ", cur.m.name), React.createElement("p", {
    className: "small",
    style: {
      margin: 0
    }
  }, isBotTurn ? paused ? 'Paused' : '💭 Choosing what goes up next…' : canPick ? 'Pick the next item to auction.' : 'Waiting for ' + cur.m.name + ' to pick…'), skipRulesOn(d) && (() => {
    const v = skipVerdict(d, cur.m.id);
    return v.forced ? React.createElement("p", {
      className: "small",
      style: {
        margin: '6px 0 0',
        fontWeight: 800
      }
    }, "\uD83D\uDD12 No more dodging: ", cur.m.name, " is out of skips, so only items they can take are listed. If nobody bids, they take it for ", money(d.rules.minBid), ".") : v.cost ? React.createElement("p", {
      className: "small",
      style: {
        margin: '6px 0 0'
      }
    }, "\uD83C\uDFAF If nobody bids on what ", cur.m.name, " nominates, it uses one of their skips.") : null;
  })()), Object.entries(talk.bubbles).map(([id, bb]) => React.createElement("p", {
    key: bb.id,
    className: "bubble inline"
  }, bb.text)), canPick && React.createElement(TopicSearch, {
    q: q,
    setQ: setQ
  }), React.createElement("div", {
    className: "pickgrid"
  }, shown.map(it => {
    const r = rarityOf(d, it.id);
    return React.createElement("button", {
      key: it.id,
      className: "pickbtn",
      disabled: !canPick,
      onClick: () => setPick(it.id)
    }, it.hidden ? React.createElement("span", {
      className: "thumb",
      style: {
        background: '#2c2659',
        color: '#c9a6ff',
        fontSize: 24
      }
    }, "?") : React.createElement(Thumb, {
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
    }, it.pos), " ", React.createElement(RarityTag, {
      r: r
    })), React.createElement("span", {
      className: "small muted"
    }, it.desc)));
  }), !shown.length && React.createElement("p", {
    className: "muted"
  }, "Nothing matches \u201C", q, "\u201D.")), pick && React.createElement(Confirm, {
    title: "Nominate this?",
    body: visibleItem(d, pick).name + ' goes up for auction next.',
    yes: "Nominate",
    onYes: () => act('nominate', pick),
    onClose: () => setPick(null)
  }), teams && React.createElement(TeamsSheet, {
    d: d,
    onClose: () => setTeams(false)
  }));
}
function ForcedPick({
  d,
  setDraft,
  goHome
}) {
  const o = d.sk && d.sk.offer;
  const m = o && d.managers.find(x => x.id === o.mid);
  const solo = d.mode === 'solo';
  const nv = netView(d, useNet());
  const act = useAct(d, setDraft);
  const [teams, setTeams] = useState(false);
  const secs = skipCfg(d).pickSecs || 20;
  const [left, setLeft] = useState(secs);
  const isBotTurn = !!(m && (solo || nv.online) && (isBot(m) || isBotTeam(m)));
  const canPick = !!m && !isBotTurn && nv.controls(m.id);
  const key = o ? o.reveal + ':' + o.mid : '';
  useEffect(() => {
    setLeft(secs);
  }, [key]);
  useEffect(() => {
    if (!o) return undefined;
    const t = setInterval(() => setLeft(l => l > 0 ? l - 1 : 0), ms(1000));
    return () => clearInterval(t);
  }, [key]);
  useEffect(() => {
    if (o && nv.isHost && left <= 0) setDraft(p => p.phase === 'forcepick' && p.sk.offer && p.sk.offer.reveal === o.reveal ? autoChooseForced(p) : p);
  }, [left, key, nv.isHost]);
  useEffect(() => {
    if (!o || !isBotTurn || !nv.runsBots) return undefined;
    const id = botForcedChoice(d);
    if (!id) return undefined;
    const t = setTimeout(() => setDraft(p => p.phase === 'forcepick' && p.sk.offer && p.sk.offer.reveal === o.reveal ? chooseForced(p, id) : p), ms(1500));
    return () => clearTimeout(t);
  }, [key, isBotTurn, nv.runsBots]);
  if (!o || !m) return null;
  return React.createElement("div", {
    className: "app"
  }, React.createElement("div", {
    className: "topbar dense wraptitle"
  }, React.createElement("button", {
    className: "iconbtn",
    onClick: goHome,
    "aria-label": "Home"
  }, "\u2302"), React.createElement(MuteButton, null), React.createElement(TvButton, null), React.createElement("div", {
    className: "title"
  }, "Forced pick \xB7 ", d.processed + 1, " of ", d.processed + d.queue.length), React.createElement("span", {
    className: "grow"
  }), React.createElement("button", {
    className: "pillbtn",
    onClick: () => setTeams(true)
  }, "Teams")), React.createElement("div", {
    className: "picker",
    style: mStyle(m)
  }, React.createElement("p", {
    className: "eyebrow"
  }, "No more dodging"), React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 40
    }
  }, m.emoji, " ", m.name), React.createElement("p", {
    className: "small",
    style: {
      margin: 0
    }
  }, o.why === 'endgame' ? 'Endgame: no skips left.' : 'Out of skips.', " ", isBotTurn ? '💭 Choosing…' : canPick ? 'Choose the item you’ll be on the hook for.' : 'Waiting for ' + m.name + ' to choose…')), React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center',
      margin: 0
    }
  }, "It goes up for auction as normal: anyone can outbid ", m.name, ". If nobody bids, ", m.name, " takes it for ", money(d.rules.minBid), ". ", React.createElement("b", {
    className: "num"
  }, left, "s"), " left, then one is picked automatically."), React.createElement("div", {
    className: "pickgrid"
  }, o.ids.map(id => {
    const it = visibleItem(d, id);
    const r = rarityOf(d, id);
    return React.createElement("button", {
      key: id,
      className: "pickbtn",
      disabled: !canPick,
      onClick: () => act('forcePick', id)
    }, it.hidden ? React.createElement("span", {
      className: "thumb",
      style: {
        background: '#2c2659',
        color: '#c9a6ff',
        fontSize: 24
      }
    }, "?") : React.createElement(Thumb, {
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
    }, it.pos), " ", React.createElement(RarityTag, {
      r: r
    })), React.createElement("span", {
      className: "small muted"
    }, it.desc)));
  })), teams && React.createElement(TeamsSheet, {
    d: d,
    onClose: () => setTeams(false)
  }));
}
function tradeText(d, t) {
  const A = teamOf(d, t.from),
    B = teamOf(d, t.to);
  const m = t.money && t.money.amount ? ' + ' + money(t.money.amount) + ' from ' + teamOf(d, t.money.payer).name : '';
  return A.name + ' gives ' + d.items[t.give].name + ' ↔ ' + B.name + ' gives ' + d.items[t.get].name + m;
}
function TradeWindow({
  d,
  setDraft,
  goHome
}) {
  const solo = d.mode === 'solo';
  const nv = netView(d, useNet());
  const act = useAct(d, setDraft);
  const online = nv.online;
  const you = solo ? d.managers.find(m => m.human) : online ? d.managers.find(m => nv.controls(m.id)) : null;
  const [now, setNow] = useState(Date.now());
  const [from, setFrom] = useState(you ? you.id : null);
  const [to, setTo] = useState(null);
  const [give, setGive] = useState(null);
  const [get, setGet] = useState(null);
  const [payer, setPayer] = useState(null);
  const [amount, setAmount] = useState(0);
  const [handoff, setHandoff] = useState(null);
  const [msg, setMsg] = useState('');
  const left = Math.max(0, d.trade.endsAt - now);
  const nOffers = d.trade.proposals.length,
    nDone = d.trade.proposals.filter(x => x.status === 'accepted').length;
  useEffect(() => {
    if (nOffers) {
      audio.play('bid');
      audio.say(callLine('tradeOffer'), 1, d.id + ':offer:' + nOffers);
    }
  }, [nOffers]);
  useEffect(() => {
    if (nDone) {
      audio.play('trade');
      audio.say(callLine('tradeDone'), 2, d.id + ':deal:' + nDone);
    }
  }, [nDone]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms(1000));
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (left <= 0 && nv.isHost) setDraft(p => closeTrades(p));
  }, [left <= 0, nv.isHost]);
  const offered = useRef(false);
  useEffect(() => {
    if (!nv.runsBots || offered.current) return undefined;
    offered.current = true;
    const timers = botActors(d).filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i).map((a, i) => setTimeout(() => setDraft(p => {
      if (p.phase !== 'trade') return p;
      const actor = botActors(p).find(x => x.speaker === a.speaker);
      const offer = actor && botTradeOffer(p, actor);
      return offer ? proposeTrade(p, offer) : p;
    }), ms(2500 + i * 2200)));
    return () => timers.forEach(clearTimeout);
  }, []);
  const pendingForBots = d.trade.proposals.filter(t => t.status === 'pending' && nv.runsBots && (isBot(teamOf(d, t.to)) || isBotTeam(teamOf(d, t.to)))).map(t => t.id).join(',');
  useEffect(() => {
    if (!pendingForBots) return undefined;
    const ids = pendingForBots.split(',');
    const t = setTimeout(() => setDraft(p => {
      let n = p;
      ids.forEach(id => {
        const tr = n.trade.proposals.find(x => x.id === id);
        if (!tr || tr.status !== 'pending') return;
        const actor = botActors(n).find(a => a.id === tr.to);
        if (!actor) return;
        const ans = botTradeDecision(n, actor, tr);
        n = ans.accept ? acceptTrade(n, id) : setTradeStatus(rejectTrade(n, id), id, 'rejected', ans.reason);
        if (ans.accept) n = setTradeStatus(n, id, n.trade.proposals.find(x => x.id === id).status, ans.reason);
      });
      return n;
    }), ms(1600));
    return () => clearTimeout(t);
  }, [pendingForBots]);
  const A = from && teamOf(d, from),
    B = to && teamOf(d, to);
  const draftTrade = {
    from,
    to,
    give,
    get,
    money: d.rules.trades.money && amount > 0 && payer ? {
      payer,
      amount
    } : null
  };
  const problem = from && to && give && get ? tradeProblem(d, draftTrade, now) : null;
  const propose = () => {
    if (problem || proposeTrade(d, draftTrade, now) === d) {
      setMsg(problem || 'That trade can’t be offered.');
      return;
    }
    act('propose', draftTrade);
    setGive(null);
    setGet(null);
    setAmount(0);
    setMsg('Offer sent to ' + B.name + '.');
  };
  const mm = Math.floor(left / 60000),
    ss = Math.floor(left % 60000 / 1000);
  const list = [...d.trade.proposals].reverse();
  const canAnswer = t => t.status === 'pending' && (online ? nv.controls(t.to) : !solo || you && t.to === you.id);
  const canCancel = t => t.status === 'pending' && (online ? nv.controls(t.from) : !solo || you && t.from === you.id);
  return React.createElement("div", {
    className: "app"
  }, React.createElement("div", {
    className: "topbar"
  }, React.createElement("button", {
    className: "iconbtn",
    onClick: goHome,
    "aria-label": "Home"
  }, "\u2302"), React.createElement(MuteButton, null), React.createElement(TvButton, null), React.createElement("div", {
    className: "title"
  }, "Trade window"), React.createElement("span", {
    className: 'tclock num' + (left < 30000 ? ' hot' : ''),
    "aria-live": "polite"
  }, mm, ":", String(ss).padStart(2, '0'))), React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, "1-for-1 trades", d.rules.trades.money ? ', plus optional money' : '', ". The other team must accept. Anything not accepted when the clock hits 0:00 expires."), (!online || you) && React.createElement("div", {
    className: "card stack"
  }, React.createElement("h3", null, "Offer a trade"), !solo && !online && React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Your team"), React.createElement("div", {
    className: "chips"
  }, d.managers.map(m => React.createElement("button", {
    key: m.id,
    className: 'pickchip' + (from === m.id ? ' on' : ''),
    style: mStyle(m),
    onClick: () => {
      setFrom(m.id);
      setGive(null);
      if (to === m.id) setTo(null);
    }
  }, m.emoji, " ", m.name)))), A && React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Trade with"), React.createElement("div", {
    className: "chips"
  }, d.managers.filter(m => m.id !== from).map(m => React.createElement("button", {
    key: m.id,
    className: 'pickchip' + (to === m.id ? ' on' : ''),
    style: mStyle(m),
    onClick: () => {
      setTo(m.id);
      setGet(null);
    }
  }, m.emoji, " ", m.name)))), A && B && React.createElement("div", {
    className: "tradecols"
  }, React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "You give"), React.createElement("div", {
    className: "stack-sm"
  }, A.team.filter(Boolean).map(t => React.createElement("button", {
    key: t.itemId,
    className: 'pickbtn small' + (give === t.itemId ? ' on' : ''),
    onClick: () => setGive(t.itemId)
  }, React.createElement(Thumb, {
    item: d.items[t.itemId],
    topic: d.topic,
    size: 34
  }), React.createElement("span", {
    className: "grow"
  }, d.items[t.itemId].name))))), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "You get"), React.createElement("div", {
    className: "stack-sm"
  }, B.team.filter(Boolean).map(t => React.createElement("button", {
    key: t.itemId,
    className: 'pickbtn small' + (get === t.itemId ? ' on' : ''),
    onClick: () => setGet(t.itemId)
  }, React.createElement(Thumb, {
    item: d.items[t.itemId],
    topic: d.topic,
    size: 34
  }), React.createElement("span", {
    className: "grow"
  }, d.items[t.itemId].name)))))), A && B && d.rules.trades.money && React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Add money (optional)"), React.createElement(Seg, {
    label: "Who pays",
    value: payer || 'none',
    options: [['none', 'No money'], [A.id, A.name + ' pays'], [B.id, B.name + ' pays']],
    onChange: v => {
      setPayer(v === 'none' ? null : v);
      if (v === 'none') setAmount(0);else setAmount(Math.min(Math.max(1, amount), teamOf(d, v).budget));
    }
  }), payer && React.createElement(Stepper, {
    id: "trade-money",
    prefix: "$",
    value: amount,
    min: 1,
    max: Math.max(1, teamOf(d, payer).budget),
    onChange: setAmount
  })), give && get && React.createElement("p", {
    className: "summary"
  }, tradeText(d, {
    ...draftTrade,
    money: draftTrade.money
  })), problem && React.createElement("p", {
    className: "warn"
  }, problem), msg && React.createElement("p", {
    className: "hint",
    style: {
      color: 'var(--ok)'
    }
  }, msg), React.createElement("button", {
    className: "btn btn-gold",
    disabled: !(give && get) || !!problem,
    onClick: propose
  }, "Offer trade")), React.createElement("div", {
    className: "stack-sm"
  }, React.createElement("h3", null, "Offers"), !list.length && React.createElement("p", {
    className: "hint"
  }, "No offers yet."), list.map(t => React.createElement("div", {
    key: t.id,
    className: 'trow ' + t.status
  }, React.createElement("span", {
    className: "tstat"
  }, {
    pending: '⏳ Waiting',
    accepted: '✅ Done',
    rejected: '❌ Rejected',
    cancelled: '↩️ Cancelled',
    expired: '⌛ Expired',
    invalid: '⚠️ No longer valid'
  }[t.status]), React.createElement("span", {
    className: "small"
  }, tradeText(d, t)), t.note && React.createElement("span", {
    className: "small muted"
  }, "\u201C", t.note, "\u201D"), (canAnswer(t) || canCancel(t)) && React.createElement("div", {
    className: "row"
  }, canAnswer(t) && React.createElement("button", {
    className: "btn btn-sm btn-gold grow",
    onClick: () => solo || online ? act('accept', t.id) : setHandoff(t.id)
  }, "Accept"), canAnswer(t) && React.createElement("button", {
    className: "btn btn-sm grow",
    onClick: () => act('reject', t.id)
  }, "Reject"), canCancel(t) && React.createElement("button", {
    className: "btn btn-sm btn-ghost grow",
    onClick: () => act('cancel', t.id)
  }, "Cancel offer"))))), React.createElement("details", {
    className: "card"
  }, React.createElement("summary", {
    className: "label"
  }, "Rosters"), React.createElement("div", {
    className: "stack",
    style: {
      marginTop: 10
    }
  }, d.managers.map(m => React.createElement("div", {
    key: m.id,
    className: "tteam",
    style: mStyle(m)
  }, React.createElement("h3", null, m.emoji, " ", m.name, " \xB7 ", money(m.budget)), React.createElement(TeamList, {
    d: d,
    m: m
  }))))), nv.isHost ? React.createElement("button", {
    className: "btn",
    onClick: () => setDraft(p => closeTrades(p))
  }, "Finish trading \xB7 go to voting") : React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, "The host can end trading early."), handoff && (() => {
    const t = d.trade.proposals.find(x => x.id === handoff);
    if (!t) return null;
    const R = teamOf(d, t.to);
    return React.createElement(Sheet, {
      center: true,
      onClose: () => setHandoff(null)
    }, React.createElement("p", {
      className: "eyebrow"
    }, "Pass the phone to"), React.createElement("h2", {
      className: "display",
      style: {
        fontSize: 34,
        color: R.color
      }
    }, R.emoji, " ", R.name), React.createElement("p", {
      className: "summary"
    }, tradeText(d, t)), React.createElement("div", {
      className: "row pin"
    }, React.createElement("button", {
      className: "btn grow",
      onClick: () => {
        act('reject', t.id);
        setHandoff(null);
      }
    }, "Reject"), React.createElement("button", {
      className: "btn btn-gold grow",
      onClick: () => {
        act('accept', t.id);
        setHandoff(null);
      }
    }, "Accept trade")));
  })());
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
  const nv = netView(d, useNet());
  const act = useAct(d, setDraft);
  const isBotTurn = !!(m && (d.mode === 'solo' || nv.online) && (isBot(m) || isBotTeam(m)));
  const botTurn = isBotTurn && nv.runsBots;
  const canPick = !!m && !isBotTurn && nv.controls(m.id);
  const live = useRef({});
  live.current = {
    d,
    flashing,
    paused
  };
  const pick = id => {
    if (flashing || !m) return;
    if (nv.online && !nv.isHost) {
      act('freePick', id);
      return;
    }
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
    const choice = botFreePickChoice(d, isBot(m) ? m : botActors(d).find(a => a.id === m.id) || m);
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
    className: "topbar dense wraptitle"
  }, React.createElement("button", {
    className: "iconbtn",
    onClick: goHome,
    "aria-label": "Home"
  }, "\u2302"), React.createElement(MuteButton, null), React.createElement(TvButton, null), React.createElement("div", {
    className: "title"
  }, "Free picks \xB7 round ", cp.round + 1), React.createElement("span", {
    className: "grow"
  }), React.createElement("button", {
    className: "pillbtn",
    onClick: () => setTeams(true)
  }, "Teams"), (d.mode === 'solo' || nv.online && nv.isHost) && React.createElement("button", {
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
  }, emptyCount(m), " empty slot", emptyCount(m) === 1 ? '' : 's', " \xB7 ", money(m.budget), " left"), isBotTurn && React.createElement("p", {
    className: "going",
    style: {
      margin: '6px 0 0'
    }
  }, paused ? 'Paused' : '💭 Picking…'), !isBotTurn && !canPick && React.createElement("p", {
    className: "going",
    style: {
      margin: '6px 0 0'
    }
  }, "Waiting for ", m.name, " to pick\u2026")), Object.entries(talk.bubbles).map(([id, bb]) => {
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
      disabled: flashing || !canPick
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
  })), d.mode === 'local' && React.createElement("button", {
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
  }, m.name, m.members ? React.createElement("small", {
    className: "memline"
  }, m.members.map(p => p.name).join(' · ')) : null), React.createElement("span", {
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
  }), React.createElement(TeamRatingPanel, {
    d: d,
    m: m
  })));
}
function Confetti({
  colors
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (reducedMotion()) return undefined;
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
  onSoloVote,
  nv,
  act
}) {
  const online = !!(nv && nv.online);
  const solo = d.mode === 'solo' || online;
  const people = participants(d);
  const you = online ? people.find(p => nv.controlsPart(p.id) && !hasVoted(d, p.id)) : solo ? people.find(p => p.human) : null;
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
  }, "Vote locked \uD83D\uDD12"), online ? React.createElement(React.Fragment, null, React.createElement("p", {
    className: "muted",
    style: {
      textAlign: 'center',
      margin: 0
    }
  }, "Waiting for everyone else. The host reveals the winner."), React.createElement("button", {
    className: "btn",
    onClick: onClose
  }, "OK")) : solo ? React.createElement("p", {
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
    const v = people.find(p => p.id === voter);
    const choices = voteChoices(d, v.teamId);
    const submit = target => {
      buzz(30);
      if (online) {
        act('vote', voter, target);
        setLocked(true);
      } else if (solo) {
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
    }, v.emoji, " ", v.name, ", pick the best team"), v.teamName && React.createElement("p", {
      className: "eyebrow",
      style: {
        color: v.color
      }
    }, "Playing for ", v.teamName), choices.length ? React.createElement("p", {
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
  }, "Secret vote \xB7 ", voted, " of ", people.length, " in"), React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 34
    }
  }, "Pass the phone around"), React.createElement("p", {
    className: "hint"
  }, "Each manager taps their own name, then votes in private. Votes stay hidden until the reveal."), React.createElement("div", {
    className: "votegrid"
  }, people.map(m => {
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
    }, done ? '✅' : m.emoji), m.name, m.teamName ? React.createElement("small", {
      style: {
        fontFamily: 'var(--body)',
        fontWeight: 600,
        opacity: 0.8
      }
    }, m.teamName) : null);
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
  }, voted === people.length ? 'Reveal winner' : 'Reveal (' + voted + '/' + people.length + ')')));
}
function ExportCard({
  d,
  kind,
  showShame
}) {
  const {
    counts,
    winners
  } = tally(d);
  const ranked = [...d.managers].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
  const head = React.createElement("div", {
    className: "exhead"
  }, React.createElement("span", {
    className: "tag"
  }, React.createElement("i", null), "$20 AUCTION"), React.createElement("b", null, "DRAFT NIGHT"), React.createElement("span", null, d.topic.emoji, " ", d.topic.name, " \xB7 ", new Date(d.createdAt).toLocaleDateString()));
  if (kind === 'winner') {
    const w = winners[0];
    return React.createElement(React.Fragment, null, head, React.createElement("div", {
      className: "exwin",
      style: mStyle(w)
    }, React.createElement("span", {
      className: "exlabel"
    }, winners.length > 1 ? 'JOINT CHAMPIONS' : 'CHAMPION'), React.createElement("span", {
      className: "exname"
    }, winners.map(x => x.emoji + ' ' + x.name).join(' & ')), w.members && React.createElement("span", {
      className: "exmem"
    }, w.members.map(p => p.name).join(' · ')), React.createElement("span", {
      className: "exvotes"
    }, d.finale && d.finale.champion ? (needsMatch(d.finale.mode) ? 'Won the knockout' : 'Won the bracket') + (isFootball(d.topic) ? ' · rating ' + teamRating(d, w).rating : '') : counts[w.id] + ' vote' + (counts[w.id] === 1 ? '' : 's'), " \xB7 ", money(d.rules.budget - w.budget), " spent \xB7 ", money(w.budget), " left")), React.createElement("div", {
      className: "exroster"
    }, d.rules.slots.map((sl, i) => {
      const t = w.team[i];
      const it = t && d.items[t.itemId];
      const r = t && rarityOf(d, t.itemId);
      return React.createElement("div", {
        key: i,
        className: "exrow"
      }, React.createElement("span", {
        className: "exslot"
      }, sl), it ? React.createElement(ItemArt, {
        item: it,
        topic: d.topic,
        size: 40,
        radius: 8
      }) : React.createElement("span", {
        style: {
          width: 40
        }
      }), React.createElement("span", {
        className: "exitem"
      }, it ? it.name : 'Empty', r && r !== 'common' ? React.createElement("span", {
        className: 'rmark ' + r
      }, " ", r === 'legendary' ? '★' : '◆') : null), React.createElement("span", {
        className: "exprice"
      }, t ? t.free ? 'FREE' : money(t.price) : ''));
    })));
  }
  const awards = computeAwards(d);
  const shame = showShame ? computeShame(d) : [];
  if (d.finale && d.finale.champion) return React.createElement(React.Fragment, null, head, React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83C\uDFC6 Final standings"), finaleStandings(d).map((s, i) => React.createElement("div", {
    key: s.team.id,
    className: "brow",
    style: mStyle(s.team)
  }, React.createElement("span", {
    className: "rk num"
  }, i + 1), React.createElement("span", {
    className: "bn"
  }, s.team.emoji, " ", s.team.name), React.createElement("span", {
    className: "bw",
    style: {
      fontSize: 15
    }
  }, s.label, isFootball(d.topic) ? ' · ' + teamRating(d, s.team).rating : '')))), awards.length > 0 && React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83C\uDF96\uFE0F Awards"), awards.map((a, i) => React.createElement("p", {
    key: a.id + i,
    className: "award"
  }, React.createElement("b", null, a.emoji, " ", a.title, ": ", a.team), React.createElement("br", null), React.createElement("span", {
    className: "small"
  }, a.why)))), shame.length > 0 && React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83D\uDE48 Hall of Shame"), shame.map(a => React.createElement("p", {
    key: a.id,
    className: "award"
  }, React.createElement("b", null, a.emoji, " ", a.title, ": ", a.team), React.createElement("br", null), React.createElement("span", {
    className: "small"
  }, a.item, " for ", money(a.price), ". ", a.why)))), React.createElement("p", {
    className: "exportfoot"
  }, "DRAFT NIGHT \xB7 ", (location.host + location.pathname).replace(/\/(index\.html)?$/, '')));
  return React.createElement(React.Fragment, null, head, React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, d.votesRevealed ? '🗳️ Final standings' : '💰 Teams'), ranked.map((m, i) => React.createElement("div", {
    key: m.id,
    className: "brow",
    style: mStyle(m)
  }, React.createElement("span", {
    className: "rk num"
  }, d.votesRevealed ? i + 1 : ''), React.createElement("span", {
    className: "bn"
  }, m.emoji, " ", m.name), React.createElement("span", {
    className: "bw num",
    style: {
      fontSize: 18
    }
  }, d.votesRevealed ? (counts[m.id] || 0) + ' votes' : money(d.rules.budget - m.budget))))), awards.length > 0 && React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83C\uDF96\uFE0F Awards"), awards.map((a, i) => React.createElement("p", {
    key: a.id + i,
    className: "award"
  }, React.createElement("b", null, a.emoji, " ", a.title, ": ", a.team), React.createElement("br", null), React.createElement("span", {
    className: "small"
  }, a.why)))), shame.length > 0 && React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83D\uDE48 Hall of Shame"), shame.map(a => React.createElement("p", {
    key: a.id,
    className: "award"
  }, React.createElement("b", null, a.emoji, " ", a.title, ": ", a.team), React.createElement("br", null), React.createElement("span", {
    className: "small"
  }, a.item, " for ", money(a.price), ". ", a.why)))), React.createElement("p", {
    className: "exportfoot"
  }, "DRAFT NIGHT \xB7 ", (location.host + location.pathname).replace(/\/(index\.html)?$/, '')));
}
function Results({
  d,
  past,
  onChange,
  onBack,
  onUndo,
  onFinish,
  onPlayAgain,
  live,
  showShame
}) {
  const ref = useRef(null);
  const nv = netView(d, useNet());
  const act = useAct(d, onChange);
  const online = nv.online;
  const [finClosed, setFinClosed] = useState(false);
  const [voting, setVoting] = useState(false);
  const [img, setImg] = useState(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [imgErr, setImgErr] = useState('');
  const [party, setParty] = useState(0);
  const [showFinale, setShowFinale] = useState(false);
  const [friendly, setFriendly] = useState(false);
  const [viewMatch, setViewMatch] = useState(null);
  const fmode = d.finale ? d.finale.mode : finaleMode(d);
  const isFin = fmode !== 'vote';
  const finDone = !!(d.finale && d.finale.champion);
  const stats = useMemo(() => draftStats(d), [d]);
  const {
    counts,
    winners
  } = tally(d);
  const revealed = d.votesRevealed && winners.length > 0;
  const noVotes = d.votesRevealed && !winners.length;
  const solo = d.mode === 'solo';
  const people = participants(d);
  const humansP = people.filter(p => !p.bot);
  const humanVotes = humansP.filter(p => hasVoted(d, p.id)).length;
  const myOpenVote = online && !d.votesRevealed ? people.find(p => nv.controlsPart(p.id) && !hasVoted(d, p.id)) : null;
  const hostReveal = () => {
    onChange({
      ...fillBotVotes(d),
      votesRevealed: true
    });
    doReveal();
  };
  const doReveal = () => {
    setVoting(false);
    audio.play('drumroll');
    setTimeout(() => {
      setParty(x => x + 1);
      buzz([60, 40, 60, 40, 200]);
      audio.play('fanfare');
      setTimeout(() => audio.play('cheer'), 400);
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 1100);
  };
  const finStage = d.finale ? (d.finale.ui || {}).stage || 'overview' : null;
  const finaleOpen = !!d.finale && (online ? finStage !== 'done' && !finClosed : showFinale);
  const revealKey = d.finale ? finStage === 'done' : revealed;
  const seenReveal = useRef(revealKey);
  useEffect(() => {
    if (revealKey && !seenReveal.current && !nv.isHost) doReveal();
    seenReveal.current = revealKey;
  }, [revealKey]);
  useEffect(() => {
    setFinClosed(false);
  }, [finStage]);
  useEffect(() => {
    if (!revealed || finaleOpen) return;
    if (finDone) {
      audio.say(callLine('champion', {
        who: winners[0].name
      }), 3, d.id + ':champion');
      return;
    }
    audio.say(winners.length > 1 ? callLine('tie', {
      who: winners.map(w => w.name).join(' and ')
    }) : callLine('winner', {
      who: winners[0].name
    }), 3, d.id + ':winner:' + Object.keys(d.votes || {}).length);
  }, [revealed, finaleOpen]);
  const openFinale = () => {
    if (!d.finale) onChange(startFinale(d));
    setShowFinale(true);
    setFinClosed(false);
  };
  const soloVote = target => {
    setTimeout(() => {
      const votes = {
        ...(d.votes || {})
      };
      const people = participants(d);
      const you = people.find(p => p.human);
      if (you && !hasVoted(d, you.id)) votes[you.id] = target;
      people.filter(p => p.bot).forEach(p => {
        if (Object.prototype.hasOwnProperty.call(votes, p.id)) return;
        votes[p.id] = botVote(d, {
          ...teamOf(d, p.teamId),
          name: p.name,
          bot: p.bot,
          speaker: p.id,
          teamId: p.teamId
        });
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
  const stageRef = useRef(null);
  const [exportKind, setExportKind] = useState(null);
  const [pickFormat, setPickFormat] = useState(false);
  const imagesReady = async node => {
    const imgs = [...node.querySelectorAll('img')];
    await Promise.all(imgs.map(im => im.complete ? Promise.resolve() : new Promise(r => {
      im.addEventListener('load', r, {
        once: true
      });
      im.addEventListener('error', r, {
        once: true
      });
      setTimeout(r, 6000);
    })));
  };
  const makeImage = async kind => {
    setPickFormat(false);
    if (kind === 'full') return exportImg(ref.current, 'results');
    setExportKind(kind);
  };
  useEffect(() => {
    if (!exportKind || !stageRef.current) return;
    const node = stageRef.current;
    (async () => {
      await imagesReady(node);
      await exportImg(node, exportKind);
      setExportKind(null);
    })();
  }, [exportKind]);
  const exportImg = async (node, kind) => {
    setImgBusy(true);
    setImgErr('');
    try {
      if (!window.html2canvas) throw new Error('missing');
      try {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
      } catch (e) {}
      await imagesReady(node);
      const canvas = await window.html2canvas(node, {
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
        name: 'draft-night-' + slug + '-' + (kind || 'results') + '-' + todayStamp() + '.png'
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
    right: live && onUndo && d.history.length && !d.votesRevealed && !d.finale ? React.createElement("button", {
      className: "pillbtn",
      onClick: onUndo
    }, "Undo") : React.createElement(MuteButton, null)
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
  }, finDone ? 'Champions!' : revealed ? 'We have a winner' : 'Final teams')), finDone && React.createElement(FinaleResults, {
    d: d,
    onOpen: setViewMatch
  }), noVotes && React.createElement("div", {
    className: "card"
  }, React.createElement("b", null, "No votes were cast"), React.createElement("p", {
    className: "hint",
    style: {
      margin: '4px 0 0'
    }
  }, "Nobody had a team they could vote for, so there's no winner this time.")), revealed && !finDone && React.createElement("div", {
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
  }, stats.cheapest.m.emoji, " ", stats.cheapest.m.name))), d.votesRevealed && !noVotes && !finDone && React.createElement("div", {
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
  }, counts[m.id])))), d.votesRevealed && !noVotes && !finDone && React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, participants(d).map(m => {
    const t = d.votes && d.votes[m.id];
    const to = t && d.managers.find(x => x.id === t);
    return m.name + ' → ' + (to ? to.name : 'no vote');
  }).join(' · ')), React.createElement(AwardsBoard, {
    d: d,
    showShame: showShame !== false
  }), revealed && React.createElement(Leaderboard, {
    rows: winsBoard([...(past || []).filter(p => p.id !== d.id), d]),
    highlight: winners.map(w => w.name.trim().toLowerCase())
  }), d.trade && d.trade.proposals.some(t => t.status === 'accepted') && React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83E\uDD1D Trades"), d.trade.proposals.filter(t => t.status === 'accepted').map(t => React.createElement("p", {
    key: t.id,
    className: "small",
    style: {
      margin: 0
    }
  }, tradeText(d, t)))), (d.cardLog || []).length > 0 && React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83C\uDCCF Chaos Cards"), d.cardLog.map(e => React.createElement("p", {
    key: e.id,
    className: "small",
    style: {
      margin: 0
    }
  }, CARD_INFO[e.card].emoji, " ", e.result === 'vetoed' ? teamOf(d, e.by).name + '’s ' + CARD_INFO[e.card].name + ' was vetoed' : e.result === 'fizzled' ? teamOf(d, e.by).name + '’s ' + CARD_INFO[e.card].name + ' fizzled' : e.detail))), React.createElement("p", {
    className: "exportfoot"
  }, "DRAFT NIGHT \xB7 ", (location.host + location.pathname).replace(/\/(index\.html)?$/, ''))), React.createElement("div", {
    className: "stack resactions"
  }, !online && !d.votesRevealed && !isFin && React.createElement("button", {
    className: "btn btn-gold",
    onClick: () => setVoting(true)
  }, solo ? 'Vote for the best team' : Object.keys(d.votes || {}).length ? 'Continue the vote' : 'Start the secret vote'), online && !d.votesRevealed && !isFin && React.createElement(React.Fragment, null, myOpenVote ? React.createElement("button", {
    className: "btn btn-gold",
    onClick: () => setVoting(true)
  }, "Vote for the best team") : React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center',
      margin: 0
    }
  }, nv.tv ? 'Vote on your phones.' : 'Your vote is in.', " ", humanVotes, " of ", humansP.length, " players have voted."), nv.isHost && React.createElement("button", {
    className: 'btn' + (myOpenVote ? '' : ' btn-gold'),
    disabled: !humanVotes,
    onClick: hostReveal
  }, humanVotes === humansP.length ? 'Reveal the winner' : 'Reveal now (' + humanVotes + '/' + humansP.length + ')')), !d.votesRevealed && isFin && (!online || nv.isHost) && React.createElement("button", {
    className: "btn btn-gold",
    onClick: openFinale
  }, d.finale ? '🏆 Continue the finale' : '🏆 Start the finale'), !d.votesRevealed && isFin && online && !nv.isHost && (d.finale ? React.createElement("button", {
    className: "btn btn-gold",
    onClick: () => setFinClosed(false)
  }, "\uD83C\uDFC6 Watch the finale") : React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center',
      margin: 0
    }
  }, "Waiting for the host to start the finale.")), !d.votesRevealed && isFin && !d.finale && React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center',
      margin: 0
    }
  }, {
    bracket: 'Head-to-head bracket: teams meet 1v1 and the players not involved vote.',
    sim: 'Match simulator: every matchup is a simulated football match.',
    combined: 'Combined finale: each matchup is a match plus a vote (' + finCfg(d).weight + '/' + (100 - finCfg(d).weight) + ').'
  }[fmode], d.rules.finale && d.rules.finale.mode !== fmode ? ' (Matches need a football topic, so this topic uses the vote bracket.)' : ''), isFootball(d.topic) && React.createElement("button", {
    className: "btn",
    onClick: () => setFriendly(true)
  }, "\u26BD Friendly match", finDone ? ' / rematch' : ''), live && onPlayAgain && d.votesRevealed && React.createElement("button", {
    className: "btn btn-gold",
    onClick: onPlayAgain
  }, "Play again"), React.createElement("button", {
    className: "btn",
    onClick: () => setPickFormat(true),
    disabled: imgBusy
  }, imgBusy ? 'Making image…' : 'Save as image'), imgErr && React.createElement("p", {
    className: "warn"
  }, imgErr), d.votesRevealed && !d.finale && !online && React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => onChange({
      ...d,
      votes: {},
      votesRevealed: false
    })
  }, "Redo the vote"), live && onPlayAgain && !d.votesRevealed && !online && React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onPlayAgain
  }, "Play again"), live && React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onFinish
  }, online ? 'Leave the room' : 'Finish · back to home'), React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, online ? d.votesRevealed ? 'Saved in Past Drafts on this phone.' : 'It’s saved on every phone once the winner is revealed.' : live ? 'This draft is saved in Past Drafts.' : 'Saved in Past Drafts.')), voting && React.createElement(Voting, {
    d: d,
    onSoloVote: soloVote,
    nv: nv,
    act: act,
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
  }), finaleOpen && React.createElement(Finale, {
    d: d,
    onChange: onChange,
    onClose: () => {
      setShowFinale(false);
      setFinClosed(true);
    },
    onChampion: () => {
      onChange({
        ...d,
        finale: {
          ...d.finale,
          ui: {
            ...(d.finale.ui || {}),
            stage: 'done'
          }
        }
      });
      setShowFinale(false);
      doReveal();
    }
  }), friendly && React.createElement(FriendlySheet, {
    d: d,
    onClose: () => setFriendly(false)
  }), viewMatch && d.finale && React.createElement(MatchupSheet, {
    d: d,
    at: viewMatch,
    onClose: () => setViewMatch(null)
  }), party > 0 && revealed && React.createElement(Confetti, {
    key: party,
    colors: [...winners.map(w => w.color), '#ffc83d', '#ffffff']
  }), pickFormat && React.createElement(Sheet, {
    center: true,
    onClose: () => setPickFormat(false)
  }, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 30
    }
  }, "Which picture?"), React.createElement("button", {
    className: "btn btn-gold",
    onClick: () => makeImage('winner'),
    disabled: !revealed
  }, "\uD83C\uDFC6 Winner card"), !revealed && React.createElement("p", {
    className: "hint"
  }, isFin ? 'Finish the finale first to make a winner card.' : 'Reveal the vote first to make a winner card.'), React.createElement("button", {
    className: "btn",
    onClick: () => makeImage('full')
  }, "\uD83D\uDCCB Full results"), React.createElement("button", {
    className: "btn",
    onClick: () => makeImage('awards')
  }, "\uD83C\uDF96\uFE0F Awards & standings"), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => setPickFormat(false)
  }, "Cancel")), exportKind && React.createElement("div", {
    className: "exportstage",
    "aria-hidden": "true"
  }, React.createElement("div", {
    ref: stageRef,
    className: "excard"
  }, React.createElement(ExportCard, {
    d: d,
    kind: exportKind,
    showShame: showShame !== false
  }))), img && React.createElement(Sheet, {
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
    const t = setTimeout(onDone, ms(f.kind === 'skip' ? f.note ? 1700 : 1100 : f.kind === 'dodge' ? 2200 : f.mystery || f.rarity === 'legendary' ? 2600 : 1800));
    return () => clearTimeout(t);
  }, [f]);
  return React.createElement("div", {
    className: "flash",
    onClick: onDone,
    style: {
      '--fc': f.color || 'var(--muted)'
    }
  }, f.kind === 'sold' && React.createElement("div", {
    className: 'inner' + (f.rarity === 'legendary' ? ' legendary' : '') + (f.big ? ' bigsale' : '')
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
  }, money(f.price), f.doubled ? React.createElement("small", {
    className: "dbl"
  }, " (Double Bid)") : null), f.mystery && React.createElement("div", {
    className: "it",
    style: {
      color: '#c9a6ff',
      fontWeight: 800
    }
  }, "\u2753 The mystery item was\u2026"), React.createElement("div", {
    className: "it"
  }, f.item, " ", f.rarity && f.rarity !== 'common' ? React.createElement(RarityTag, {
    r: f.rarity
  }) : null)), f.kind === 'card' && React.createElement("div", {
    className: "inner"
  }, React.createElement("div", {
    className: "big",
    style: {
      fontSize: 64,
      color: f.result === 'done' ? 'var(--gold)' : 'var(--danger)'
    }
  }, CARD_INFO[f.card].emoji, " ", f.result === 'vetoed' ? 'Vetoed!' : f.result === 'fizzled' ? 'Fizzled' : CARD_INFO[f.card].name + '!'), f.by && React.createElement("div", {
    className: "to",
    style: {
      color: f.by.color
    }
  }, f.by.emoji, " ", f.by.name), React.createElement("div", {
    className: "it"
  }, f.text)), f.kind === 'skip' && React.createElement("div", {
    className: "inner"
  }, React.createElement("div", {
    className: "big",
    style: {
      color: 'var(--muted)',
      fontSize: 72
    }
  }, "No bids"), React.createElement("div", {
    className: "it"
  }, f.item, " ", f.back ? 'goes to the back of the queue' : 'is skipped'), f.note && React.createElement("div", {
    className: "it",
    style: {
      fontSize: 16,
      color: 'var(--gold)'
    }
  }, f.note)), f.kind === 'dodge' && React.createElement("div", {
    className: "inner dodge"
  }, React.createElement("div", {
    className: "big",
    style: {
      color: 'var(--danger)',
      fontSize: 60
    }
  }, "NO MORE DODGING!"), React.createElement("div", {
    className: "to",
    style: {
      color: f.color
    }
  }, f.emoji, " ", f.name), React.createElement("div", {
    className: "it"
  }, f.endgame ? 'Endgame: no skips left.' : 'Out of skips.', " If nobody bids, this one\u2019s yours for ", money(f.price), ".")), f.kind === 'forced' && React.createElement("div", {
    className: "inner"
  }, React.createElement("div", {
    className: "big",
    style: {
      color: 'var(--gold)',
      fontSize: 60
    }
  }, "YOU HAVE TO PICK!"), React.createElement("div", {
    className: "to",
    style: {
      color: f.color
    }
  }, f.emoji, " ", f.name), React.createElement("div", {
    className: "price num"
  }, money(f.price)), f.mystery && React.createElement("div", {
    className: "it",
    style: {
      color: '#c9a6ff',
      fontWeight: 800
    }
  }, "\u2753 The mystery item was\u2026"), React.createElement("div", {
    className: "it"
  }, "takes ", f.item)), f.kind === 'free' && React.createElement("div", {
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
  noBids: 'skip',
  mustBid: false,
  skip: JSON.parse(JSON.stringify(SKIP_DEFAULTS))
};
const RULE_DEFAULTS = () => ({
  ...JSON.parse(JSON.stringify(DEFAULT_RULES)),
  ...JSON.parse(JSON.stringify(TWIST_DEFAULTS)),
  finale: {
    ...FINALE_DEFAULTS
  }
});
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
function migrateSettings(st) {
  const x = {
    ...(st || {})
  };
  if ((x.rulesV || 0) < 3) {
    if (x.rulePrefs) {
      const p = {
        ...x.rulePrefs
      };
      ['chaos', 'mystery', 'rarity', 'trades'].forEach(k => {
        if (p[k]) p[k] = {
          ...p[k],
          on: false
        };
      });
      x.rulePrefs = p;
    }
    x.rulesV = 3;
  }
  return x;
}
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
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e2) {
      return false;
    }
  }
}
function ShareTopicSheet({
  topic,
  onClose
}) {
  const [withPhotos, setWithPhotos] = useState(false);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const hasPhotos = topic.items.some(i => i.photo);
  useEffect(() => {
    let live = true;
    encodeTopic(topic, withPhotos).then(c => {
      if (live) setCode(c);
    });
    return () => {
      live = false;
    };
  }, [topic, withPhotos]);
  const link = code ? shareLink(code) : '';
  const tooLong = link.length > MAX_LINK;
  const fp = topicCode(topic);
  const copy = async (text, what) => setNote((await copyText(text)) ? what + ' copied.' : 'Couldn’t copy automatically. Press and hold the text to copy it.');
  const file = () => {
    downloadBlob(topicFile(topic), (topic.name || 'topic').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '.dntopic.json');
    setNote(isIOS() ? 'Saved to Files → Downloads. Send that file to your friend.' : 'Topic file saved.');
  };
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: topic.name + ' · Draft Night',
          text: 'Import my Draft Night topic “' + topic.name + '”',
          url: link
        });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    copy(link, 'Link');
  };
  return React.createElement(Sheet, {
    center: true,
    onClose: onClose
  }, React.createElement("p", {
    className: "eyebrow"
  }, "Share topic"), React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 30
    }
  }, topic.emoji, " ", topic.name), React.createElement("div", {
    className: "row"
  }, React.createElement("span", {
    className: "fpcode num"
  }, fp), React.createElement("span", {
    className: "hint grow"
  }, "Fingerprint: your friend sees the same code after importing, so you know it arrived intact.")), hasPhotos && React.createElement(Toggle, {
    on: withPhotos,
    onChange: setWithPhotos,
    title: "Include uploaded photos",
    sub: "Makes the link much longer. The topic file always includes them."
  }), !code ? React.createElement("p", {
    className: "hint"
  }, "Preparing\u2026") : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn btn-gold grow",
    onClick: share,
    disabled: tooLong
  }, "Share link"), React.createElement("button", {
    className: "btn grow",
    onClick: () => copy(link, 'Link'),
    disabled: tooLong
  }, "Copy link")), React.createElement("button", {
    className: "btn",
    onClick: () => copy(code, 'Share code')
  }, "Copy share code (", Math.round(code.length / 100) / 10, "k characters)"), React.createElement("button", {
    className: "btn",
    onClick: file
  }, "Download topic file"), tooLong ? React.createElement("p", {
    className: "warn"
  }, "This topic is too big for a link (", Math.round(link.length / 1000), "k characters). Send the topic file or the share code instead.") : React.createElement("p", {
    className: "hint"
  }, "The link holds the whole topic, so it works without any account or server. Image links and Wikipedia settings come along; uploaded photos only if you include them.")), note && React.createElement("p", {
    className: "hint",
    style: {
      color: 'var(--ok)'
    }
  }, note), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onClose
  }, "Done"));
}
function ImportTopicSheet({
  topics,
  initial,
  onImport,
  onClose
}) {
  const [text, setText] = useState(initial || '');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const check = async t => {
    setBusy(true);
    setRes(await decodeShared(t));
    setBusy(false);
  };
  useEffect(() => {
    if (initial) check(initial);
  }, []);
  const fromFile = async e => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      setRes({
        ok: false,
        error: 'That file is too big to be a topic.'
      });
      return;
    }
    const t = await f.text();
    setText('');
    check(t);
  };
  const dup = res && res.ok && topics.find(t => topicCode(t) === topicCode(res.topic));
  const sameName = res && res.ok && !dup && topics.find(t => t.name.trim().toLowerCase() === res.topic.name.trim().toLowerCase());
  return React.createElement(Sheet, {
    center: true,
    onClose: onClose
  }, React.createElement("p", {
    className: "eyebrow"
  }, "Import a topic"), React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 30
    }
  }, "Add a friend\u2019s topic"), !res || !res.ok ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "import-text"
  }, "Paste a share link or share code"), React.createElement("textarea", {
    id: "import-text",
    className: "input",
    style: {
      minHeight: 90
    },
    value: text,
    onChange: e => setText(e.target.value),
    placeholder: "https://\u2026#topic=DN1.\u2026"
  })), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn btn-gold grow",
    disabled: !text.trim() || busy,
    onClick: () => check(text)
  }, busy ? 'Checking…' : 'Check'), React.createElement("button", {
    className: "btn grow",
    onClick: () => fileRef.current && fileRef.current.click()
  }, "Open topic file")), React.createElement("input", {
    ref: fileRef,
    id: "import-file",
    type: "file",
    accept: "application/json,.json",
    hidden: true,
    onChange: fromFile
  }), res && !res.ok && React.createElement("p", {
    className: "warn"
  }, res.error)) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "card stack-sm",
    style: {
      background: 'var(--stage)'
    }
  }, React.createElement("b", {
    style: {
      fontFamily: 'var(--cond)',
      fontSize: 20
    }
  }, res.topic.emoji, " ", res.topic.name), React.createElement("span", {
    className: "small muted"
  }, res.topic.items.length, " items \xB7 slots ", res.topic.slots.join(', '), " \xB7 ", res.topic.folder), React.createElement("span", {
    className: "small"
  }, res.topic.items.slice(0, 6).map(i => i.name).join(', '), res.topic.items.length > 6 ? '…' : ''), React.createElement("span", {
    className: "fpcode num",
    style: {
      alignSelf: 'flex-start'
    }
  }, topicCode(res.topic))), dup && React.createElement("p", {
    className: "warn"
  }, "You already have this exact topic (\u201C", dup.name, "\u201D). Adding it again makes a second copy."), sameName && React.createElement("p", {
    className: "hint"
  }, "You have a different topic with the same name. This one is added alongside it; nothing is overwritten."), React.createElement("div", {
    className: "row pin"
  }, React.createElement("button", {
    className: "btn btn-ghost grow",
    onClick: () => setRes(null)
  }, "Back"), React.createElement("button", {
    className: "btn btn-gold grow",
    onClick: () => {
      onImport(dup ? {
        ...res.topic,
        name: res.topic.name + ' (copy)'
      } : res.topic);
      onClose();
    }
  }, dup ? 'Add a copy' : 'Add topic'))));
}
const pct = x => Math.round(x * 100) + '%';
function ProfilesScreen({
  past,
  settings,
  setSettings,
  onBack,
  onOpen,
  onShame
}) {
  const rows = careerStats(past, settings);
  const [ask, setAsk] = useState(false);
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: "Players & stats"
  }), React.createElement("p", {
    className: "hint"
  }, "Built from finished drafts on this device (after the vote is revealed). Bots aren\u2019t included. Stats don\u2019t sync between phones; use a backup to move them."), !rows.length && React.createElement("div", {
    className: "card"
  }, React.createElement("p", {
    className: "muted",
    style: {
      margin: 0
    }
  }, "Finish a draft and reveal the vote, and everyone who played gets a profile here.")), React.createElement("div", {
    className: "stack-sm"
  }, rows.map((r, i) => React.createElement("button", {
    key: r.key,
    className: "tcard",
    onClick: () => onOpen(r.key)
  }, React.createElement("span", {
    className: "em"
  }, r.emoji), React.createElement("span", {
    className: "meta"
  }, React.createElement("span", {
    className: "name"
  }, i === 0 && r.wins ? '👑 ' : '', r.name), React.createElement("span", {
    className: "sub"
  }, r.wins, " win", r.wins === 1 ? '' : 's', " \xB7 ", r.games, " game", r.games === 1 ? '' : 's', " \xB7 ", pct(r.winRate), " \xB7 ", money(Math.round(r.spent)), " spent")), React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 22
    }
  }, "\u203A")))), settings.showShame !== false && React.createElement("button", {
    className: "btn",
    onClick: onShame
  }, "\uD83D\uDE48 Hall of Shame"), React.createElement(Toggle, {
    on: settings.showShame !== false,
    onChange: v => setSettings(x => ({
      ...x,
      showShame: v
    })),
    title: "Show the Hall of Shame",
    sub: "Funny awards for the worst buys. Turn off if your group prefers not to see it."
  }), rows.length > 0 && React.createElement("button", {
    className: "btn btn-danger",
    onClick: () => setAsk(true)
  }, "Reset stats"), ask && React.createElement(Confirm, {
    title: "Reset all stats?",
    body: "Profiles, wins and awards start from zero. Your Past Drafts stay saved and aren\u2019t deleted.",
    yes: "Reset stats",
    danger: true,
    onYes: () => setSettings(x => ({
      ...x,
      statsResetAt: Date.now()
    })),
    onClose: () => setAsk(false)
  }));
}
function ProfileView({
  past,
  settings,
  setSettings,
  pkey,
  onBack
}) {
  const r = careerStats(past, settings).find(x => x.key === pkey);
  const [name, setName] = useState(r ? r.name : '');
  const [emoji, setEmoji] = useState(r ? r.emoji : '🙂');
  if (!r) return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: "Player"
  }), React.createElement("p", {
    className: "muted"
  }, "That player has no finished games."));
  const save = (n, e) => setSettings(x => ({
    ...x,
    profiles: {
      ...(x.profiles || {}),
      [pkey]: {
        name: n.trim() || r.name,
        emoji: e || '🙂'
      }
    }
  }));
  const Stat = ({
    k,
    v,
    d: sub
  }) => React.createElement("div", {
    className: "stat"
  }, React.createElement("span", {
    className: "k"
  }, k), React.createElement("span", {
    className: "v num"
  }, v), sub && React.createElement("span", {
    className: "d"
  }, sub));
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: "Player"
  }), React.createElement("div", {
    className: "card row",
    style: {
      gap: 10
    }
  }, React.createElement("button", {
    className: "emo",
    onClick: () => {
      const e = EMOJIS[(EMOJIS.indexOf(emoji) + 1) % EMOJIS.length];
      setEmoji(e);
      save(name, e);
    },
    "aria-label": "Change avatar"
  }, emoji), React.createElement("input", {
    id: "profile-name",
    className: "input grow",
    maxLength: 16,
    value: name,
    onChange: e => setName(e.target.value),
    onBlur: () => save(name, emoji)
  })), React.createElement("p", {
    className: "hint"
  }, "Changing the display name only changes how it\u2019s shown. Games are matched by the name typed when playing."), React.createElement("div", {
    className: "stat-grid"
  }, React.createElement(Stat, {
    k: "Wins",
    v: r.wins,
    d: pct(r.winRate) + ' win rate'
  }), React.createElement(Stat, {
    k: "Games",
    v: r.games,
    d: r.teamGames ? r.teamGames + ' in teams' : 'all individual'
  }), React.createElement(Stat, {
    k: "Team wins",
    v: r.teamWins
  }), React.createElement(Stat, {
    k: "Money spent",
    v: money(Math.round(r.spent)),
    d: r.teamGames ? 'team spending split evenly' : null
  }), React.createElement(Stat, {
    k: "Legendaries",
    v: r.legendary
  }), React.createElement(Stat, {
    k: "Trades done",
    v: r.trades,
    d: r.topCard ? 'Favourite card: ' + CARD_INFO[r.topCard].name : null
  }), r.titles > 0 && React.createElement(Stat, {
    k: "Finale titles",
    v: r.titles,
    d: "brackets & knockouts won"
  }), r.matches > 0 && React.createElement(Stat, {
    k: "Match record",
    v: r.matchWins + '–' + (r.matches - r.matchWins),
    d: r.goals + ' goal' + (r.goals === 1 ? '' : 's') + ' scored'
  }), r.topRating && React.createElement(Stat, {
    k: "Best team rating",
    v: r.topRating.rating,
    d: r.topRating.team + ' · ' + r.topRating.topic
  })), React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\u2764\uFE0F Favourite picks"), r.favourites.length ? r.favourites.map(([n, c]) => React.createElement("p", {
    key: n,
    className: "small",
    style: {
      margin: 0
    }
  }, n, " \xB7 drafted ", c, " times")) : React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Draft the same item twice and it shows up here.")), React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83C\uDFF7\uFE0F Best bargain \xB7 \uD83D\uDCB8 Biggest overpay"), r.bargain ? React.createElement("p", {
    className: "small",
    style: {
      margin: 0
    }
  }, "Bargain: ", r.bargain.name, " for ", money(r.bargain.price), " (usually ", money(Math.round(r.bargain.avg)), ") \xB7 ", r.bargain.topic) : React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "No bargain on record yet."), r.overpay ? React.createElement("p", {
    className: "small",
    style: {
      margin: 0
    }
  }, "Overpay: ", r.overpay.name, " for ", money(r.overpay.price), " (usually ", money(Math.round(r.overpay.avg)), ") \xB7 ", r.overpay.topic) : React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "No overpay on record yet."), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "How it\u2019s worked out: each price is compared with the average that same item sold for across your saved drafts. Items need at least 2 sales to compare, so nothing is guessed.")), r.best && React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83C\uDFC6 Best win"), React.createElement("p", {
    className: "small",
    style: {
      margin: 0
    }
  }, r.best.team, " \xB7 ", r.best.topic, " \xB7 ", r.best.votes == null ? r.best.how : r.best.votes + ' vote' + (r.best.votes === 1 ? '' : 's') + ' (' + pct(r.best.share) + ')', " \xB7 ", new Date(r.best.date).toLocaleDateString())), React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83C\uDF96\uFE0F Awards"), Object.keys(r.awards).length ? Object.entries(r.awards).sort((a, b) => b[1] - a[1]).map(([t, n]) => React.createElement("p", {
    key: t,
    className: "small",
    style: {
      margin: 0
    }
  }, t, " \xD7 ", n)) : React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "No awards yet.")));
}
function ShameScreen({
  past,
  settings,
  onBack
}) {
  const rows = hallOfShame(past, settings);
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: "Hall of Shame"
  }), React.createElement("p", {
    className: "hint"
  }, "All in good fun. Each entry says exactly why it\u2019s here, using that draft\u2019s own prices."), !rows.length && React.createElement("div", {
    className: "card"
  }, React.createElement("p", {
    className: "muted",
    style: {
      margin: 0
    }
  }, "Nobody has embarrassed themselves yet. Give it time.")), React.createElement("div", {
    className: "stack-sm"
  }, rows.map((x, i) => React.createElement("div", {
    key: x.draftId + x.id + i,
    className: "shame"
  }, React.createElement("span", {
    className: "se"
  }, x.emoji), React.createElement("span", {
    className: "grow",
    style: {
      minWidth: 0
    }
  }, React.createElement("b", null, x.title, ": ", x.item, " \xB7 ", money(x.price)), React.createElement("span", {
    className: "small",
    style: {
      display: 'block'
    }
  }, x.team, " \xB7 ", x.topic, " \xB7 ", new Date(x.date).toLocaleDateString()), React.createElement("span", {
    className: "small muted",
    style: {
      display: 'block'
    }
  }, x.why))))));
}
function AwardsBoard({
  d,
  showShame
}) {
  const awards = computeAwards(d);
  const shame = showShame ? computeShame(d) : [];
  if (!awards.length && !shame.length) return null;
  return React.createElement(React.Fragment, null, awards.length > 0 && React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83C\uDF96\uFE0F Awards"), awards.map((a, i) => React.createElement("p", {
    key: a.id + i,
    className: "award"
  }, React.createElement("b", null, a.emoji, " ", a.title, ": ", a.team), React.createElement("span", {
    className: "small muted"
  }, " \u2014 ", a.why)))), shame.length > 0 && React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83D\uDE48 Hall of Shame"), shame.map(a => React.createElement("p", {
    key: a.id,
    className: "award"
  }, React.createElement("b", null, a.emoji, " ", a.title, ": ", a.team), React.createElement("span", {
    className: "small muted"
  }, " \u2014 ", a.item, " for ", money(a.price), ". ", a.why)))));
}
function AudioSettings() {
  const {
    cfg,
    set
  } = React.useContext(AudioCtx);
  const [voices, setVoices] = useState(() => audio.voices());
  useEffect(() => {
    if (!audio.hasSpeech()) return undefined;
    const upd = () => setVoices(audio.voices());
    try {
      window.speechSynthesis.addEventListener('voiceschanged', upd);
    } catch (e) {}
    const t = setTimeout(upd, 600);
    return () => {
      clearTimeout(t);
      try {
        window.speechSynthesis.removeEventListener('voiceschanged', upd);
      } catch (e) {}
    };
  }, []);
  const up = p => set({
    ...cfg,
    ...p
  });
  const Range = ({
    id,
    label,
    value,
    onChange
  }) => React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: id
  }, label, " \xB7 ", Math.round(value * 100), "%"), React.createElement("input", {
    id: id,
    type: "range",
    min: "0",
    max: "1",
    step: "0.05",
    value: value,
    onChange: e => onChange(parseFloat(e.target.value))
  }));
  return React.createElement("section", {
    className: "card stack"
  }, React.createElement("h3", null, "\uD83D\uDD0A Sound & voice"), React.createElement(Toggle, {
    on: cfg.muted,
    onChange: v => up({
      muted: v
    }),
    title: "Mute everything",
    sub: "Silences the auctioneer, sound effects and music right away. Also on the \uD83D\uDD0A button during games."
  }), React.createElement(Toggle, {
    on: cfg.voice,
    onChange: v => up({
      voice: v
    }),
    title: "Auctioneer voice",
    sub: audio.hasSpeech() ? 'Calls out items, bids, “going once…” and SOLD.' : 'This browser can’t speak, so the auctioneer stays silent. Everything else still works.'
  }), cfg.voice && audio.hasSpeech() && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Voice speed"), React.createElement(Seg, {
    label: "Voice speed",
    value: cfg.rate,
    options: [[0.95, 'Slow'], [1.15, 'Normal'], [1.35, 'Fast'], [1.55, 'Hype']],
    onChange: v => up({
      rate: v
    })
  })), voices.length > 0 && React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "voice-pick"
  }, "Voice"), React.createElement("select", {
    id: "voice-pick",
    className: "input",
    value: cfg.voiceName,
    onChange: e => up({
      voiceName: e.target.value
    })
  }, React.createElement("option", {
    value: ""
  }, "Best available"), voices.map(v => React.createElement("option", {
    key: v.name,
    value: v.name
  }, v.name)))), Range({
    id: 'voice-vol',
    label: 'Voice volume',
    value: cfg.voiceVol,
    onChange: v => up({
      voiceVol: v
    })
  })), React.createElement(Toggle, {
    on: cfg.sfx,
    onChange: v => up({
      sfx: v
    }),
    title: "Sound effects",
    sub: "Gavel, crowd cheers, buzzer, drumroll and small blips."
  }), cfg.sfx && Range({
    id: 'sfx-vol',
    label: 'Effects volume',
    value: cfg.sfxVol,
    onChange: v => up({
      sfxVol: v
    })
  }), React.createElement(Toggle, {
    on: cfg.music,
    onChange: v => up({
      music: v
    }),
    title: "Background music",
    sub: "An original looping game-show track, played quietly under everything."
  }), cfg.music && Range({
    id: 'music-vol',
    label: 'Music volume',
    value: cfg.musicVol,
    onChange: v => up({
      musicVol: v
    })
  }), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Big-money sale"), React.createElement(Seg, {
    label: "Big sale threshold",
    value: cfg.bigSale,
    options: [[30, '30%'], [40, '40%'], [50, '50%']],
    onChange: v => up({
      bigSale: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, "A sale for at least this share of the starting budget gets the extra-dramatic SOLD.")), React.createElement("button", {
    className: "btn btn-sm",
    style: {
      alignSelf: 'flex-start'
    },
    disabled: cfg.muted,
    onClick: () => audio.test()
  }, "Test sound"));
}
const fmtBytes = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const SETTINGS_TABS = [['rules', 'House rules'], ['sound', 'Sound'], ['display', 'Display & access'], ['online', 'Online'], ['app', 'App & backup']];
function SettingsScreen({
  onBack,
  state,
  onRestore,
  settings,
  setSettings,
  rulePrefs,
  saveRulePrefs
}) {
  const [tab, setTab] = useState('rules');
  const [editRules, setEditRules] = useState(null);
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
  if (editRules) return React.createElement(SetupRules, {
    defaultsMode: true,
    topic: {
      name: '',
      emoji: '',
      items: [],
      slots: []
    },
    managers: [],
    rules: editRules,
    setRules: setEditRules,
    title: "Default house rules",
    startLabel: "Save as my defaults",
    onBack: () => setEditRules(null),
    onStart: r => {
      saveRulePrefs(r);
      setEditRules(null);
    },
    onReset: () => setEditRules({
      ...RULE_DEFAULTS(),
      slots: []
    })
  });
  const prefs = {
    ...rulePrefs(),
    slots: []
  };
  const setS = p => setSettings(x => ({
    ...x,
    ...p
  }));
  const motion = settings.motion || 'system';
  const prof = settings.online || {};
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: "Rules & settings"
  }), React.createElement("div", {
    className: "tabs",
    role: "tablist",
    "aria-label": "Settings sections"
  }, SETTINGS_TABS.map(([k, label]) => React.createElement("button", {
    key: k,
    role: "tab",
    "aria-selected": tab === k,
    className: 'ttab' + (tab === k ? ' on' : ''),
    onClick: () => setTab(k)
  }, label))), tab === 'rules' && React.createElement("section", {
    className: "card stack",
    role: "tabpanel"
  }, React.createElement("h3", null, "\uD83D\uDCDC Default house rules"), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "New Local, Solo and Online games start with these. Slots come from each topic. Optional twists stay off unless you switch them on."), React.createElement(RulesSummary, {
    rules: prefs
  }), React.createElement("button", {
    className: "btn btn-gold",
    onClick: () => setEditRules(prefs)
  }, "Edit default rules"), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => saveRulePrefs({
      ...RULE_DEFAULTS(),
      slots: []
    })
  }, "Reset to standard rules")), tab === 'sound' && React.createElement("div", {
    role: "tabpanel"
  }, React.createElement(AudioSettings, null)), tab === 'display' && React.createElement("section", {
    className: "card stack",
    role: "tabpanel"
  }, React.createElement("h3", null, "\uD83C\uDF9E\uFE0F Motion"), React.createElement(Seg, {
    label: "Motion",
    value: motion,
    options: [['system', 'Match my device'], ['reduce', 'Reduce motion'], ['full', 'Full animation']],
    onChange: v => setS({
      motion: v
    })
  }), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Reduce motion turns off confetti, card flips and pop-ups, and football matches move step by step instead of sliding."), React.createElement("h3", null, "\uD83D\uDCFA TV display"), React.createElement(Seg, {
    label: "TV text size",
    value: settings.tvZoom || 1,
    options: [[1, 'Normal'], [1.25, 'Large'], [1.5, 'Extra large']],
    onChange: v => setS({
      tvZoom: v
    })
  }), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "How big everything looks when this device shows the TV view.")), tab === 'online' && React.createElement("section", {
    className: "card stack",
    role: "tabpanel"
  }, React.createElement("h3", null, "\uD83C\uDF10 Online"), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Your online name: ", React.createElement("b", null, prof.emoji, " ", prof.name || 'not set yet'), " (change it on the Online screen)."), React.createElement(Toggle, {
    on: !!prof.voice,
    onChange: v => setS({
      online: {
        ...prof,
        voice: v
      }
    }),
    title: "Auctioneer voice on my phone",
    sub: "Off by default when you\u2019re a player, so the room doesn\u2019t hear the auctioneer from every phone. The host and the TV always have it."
  }), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Room rules (seats, bots, bid clock, reconnection) are set by the host in the room\u2019s lobby. Your favourites and settings stay on this device.")), tab === 'app' && React.createElement(React.Fragment, null, React.createElement("section", {
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
  }, "Real photos come from Wikipedia and Wikimedia Commons. Tap \u201CPhoto: Wikipedia\u201D on a card to see who took it and its licence.")), confirm && React.createElement(Confirm, {
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
  const [draft, setDraft] = useState(() => {
    const c = store.get(K.current, null);
    return c && c.topic && Array.isArray(c.managers) ? c : null;
  });
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
  const [flash, setFlashRaw] = useState(null);
  const [toast, setToast] = useState(null);
  const tvTab = useMemo(() => {
    const m = (location.hash || '').match(/^#tv=([A-Za-z0-9]+)/);
    return m ? m[1] : null;
  }, []);
  const [localTv, setLocalTv] = useState(false);
  const chan = useMemo(() => !tvTab && canChannel() ? new BroadcastChannel(LOCAL_TV) : null, []);
  const liveRef = useRef({});
  const draftRef = useRef(null);
  const [tvWindows, setTvWindows] = useState(0);
  const setFlash = info => {
    setFlashRaw(info);
    if (info && chan) chan.postMessage({
      type: 'flash',
      info
    });
  };
  const [folder, setFolder] = useState(null);
  const [importing, setImporting] = useState(null);
  useEffect(() => {
    const m = (location.hash || '').match(/^#topic=(.+)$/);
    if (m) {
      setImporting(decodeURIComponent(m[1]));
      try {
        history.replaceState(null, '', location.pathname + location.search);
      } catch (e) {}
    }
    const tv = (location.hash || '').match(/^#tv=([A-Za-z0-9]+)/);
    if (tv) {
      if (tv[1] === 'local') setScreen({
        name: 'tv-local'
      });else setScreen({
        name: 'online',
        start: {
          kind: 'tv',
          code: cleanCode(tv[1])
        },
        k: 'tv'
      });
    }
    const r = (location.hash || '').match(/^#room=([A-Za-z0-9]+)/);
    if (r) {
      setScreen({
        name: 'online-home',
        code: cleanCode(r[1])
      });
      try {
        history.replaceState(null, '', location.pathname + location.search);
      } catch (e) {}
    }
  }, []);
  const [settings, setSettings] = useState(() => migrateSettings(store.get(K.settings, {})));
  const audioCfg = {
    ...AUDIO_DEFAULTS,
    ...(settings.audio || {})
  };
  const setAudioCfg = c => setSettings(x => ({
    ...x,
    audio: c
  }));
  useEffect(() => {
    audio.set(audioCfg);
  }, [JSON.stringify(audioCfg)]);
  useEffect(() => {
    document.documentElement.setAttribute('data-motion', settings.motion || 'system');
    document.documentElement.style.setProperty('--tvzoom', String(settings.tvZoom || 1));
  }, [settings.motion, settings.tvZoom]);
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
    if (tvTab) return;
    if (v === null || v === undefined) store.del(k);else store.set(k, v);
  };
  useEffect(() => {
    draftRef.current = draft;
    if (chan && draft) chan.postMessage({
      type: 'draft',
      draft: stripDraft(draft)
    });
  }, [draft]);
  useEffect(() => {
    if (!chan) return undefined;
    chan.onmessage = e => {
      const m = e.data || {};
      if (m.type === 'hello') {
        setTvWindows(n => n + 1);
        if (draftRef.current) chan.postMessage({
          type: 'draft',
          draft: stripDraft(draftRef.current)
        });
        chan.postMessage({
          type: 'live',
          live: liveRef.current
        });
      } else if (m.type === 'bye') setTvWindows(n => Math.max(0, n - 1));
    };
    return () => {
      chan.onmessage = null;
    };
  }, []);
  useEffect(() => {
    if (!tvTab) audio.setQuiet(tvWindows > 0);
  }, [tvWindows]);
  const localNet = {
    local: true,
    role: 'host',
    display: localTv ? 'tv' : 'controls',
    live: {},
    publishLive: o => {
      liveRef.current = {
        ...liveRef.current,
        ...o
      };
      if (chan) chan.postMessage({
        type: 'live',
        live: liveRef.current
      });
    }
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
  const rulePrefs = () => {
    const p = {
      ...RULE_DEFAULTS(),
      ...(settings.rulePrefs || {})
    };
    delete p.slots;
    return {
      ...p,
      ...twistRules(p)
    };
  };
  const saveRulePrefs = r => {
    const {
      slots,
      ...rest
    } = r;
    setSettings(x => ({
      ...x,
      rulePrefs: rest
    }));
  };
  const soloRulesFor = t => soloRules && t && soloRules.topicId === t.id ? soloRules.rules : {
    ...rulePrefs(),
    slots: t ? [...t.slots] : []
  };
  const teamCfg = {
    ...DEFAULT_TEAMS,
    ...(settings.localTeams || {})
  };
  const setTeamCfg = c => setSettings(x => ({
    ...x,
    localTeams: c
  }));
  const localPlayers = () => teamCfg.on ? localTeamsToManagers(teamCfg) : managers;
  const soloT = {
    ...DEFAULT_SOLO.teams,
    ...(soloCfg.teams || {})
  };
  const teamSummaryLocal = teamCfg.on ? {
    teams: true,
    text: teamCfg.count === 2 ? teamCfg.size + 'v' + teamCfg.size : teamCfg.count + ' teams of ' + teamCfg.size,
    detail: localTeamsToManagers(teamCfg).map(t => t.name + ': ' + t.members.map(p => p.name).join(', ')).join(' · ')
  } : {
    teams: false,
    text: 'Individual · ' + managers.length + ' managers',
    detail: 'Everyone plays for themselves. Switch to Teams on the players screen.'
  };
  const teamSummarySolo = soloT.on ? {
    teams: true,
    text: soloT.count === 2 ? soloT.size + 'v' + soloT.size : soloT.count + ' teams of ' + soloT.size,
    detail: 'Bots on your team advise you; other teams are all bots.'
  } : {
    teams: false,
    text: 'Every bot for itself · ' + soloCfg.bots + ' bots',
    detail: 'Switch to Teams on the solo setup screen.'
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
  const topicPrefs = prefsOf(settings);
  const setTopicPrefs = p => setSettings(x => ({
    ...x,
    topicPrefs: {
      fav: p.fav || [],
      pin: p.pin || []
    }
  }));
  const profile = {
    ...defaultProfile(),
    ...(settings.online || {})
  };
  const setProfile = p => setSettings(x => ({
    ...x,
    online: p
  }));
  const fileOnline = d => setPast(p => {
    const s = stripDraft(d);
    const i = p.findIndex(x => x.id === d.id);
    if (i >= 0) {
      const a = [...p];
      a[i] = s;
      return a;
    }
    return [s, ...p];
  });
  let view;
  switch (screen.name) {
    case 'online-home':
      view = React.createElement(OnlineHome, {
        profile: profile,
        setProfile: setProfile,
        last: lastRoom(),
        initialCode: screen.code,
        onBack: () => go('home'),
        onCreate: () => {
          setProfile({
            ...profile,
            name: profile.name.trim()
          });
          go('online', {
            start: {
              kind: 'create'
            },
            k: uid()
          });
        },
        onJoin: code => {
          setProfile({
            ...profile,
            name: profile.name.trim()
          });
          go('online', {
            start: {
              kind: 'join',
              code
            },
            k: uid()
          });
        },
        onTv: code => go('online', {
          start: {
            kind: 'tv',
            code
          },
          k: uid()
        }),
        onRejoin: l => go('online', {
          start: {
            kind: l.kind === 'tv' ? 'tv' : 'join',
            code: l.code
          },
          k: uid()
        })
      });
      break;
    case 'online':
      view = React.createElement(OnlineScreen, {
        key: screen.k,
        setSettings: setSettings,
        start: screen.start,
        onRetry: () => go('online', {
          start: screen.start,
          k: uid()
        }),
        profile: profile,
        topics: topics,
        rulePrefs: rulePrefs,
        past: past,
        settings: settings,
        onFinished: fileOnline,
        onExit: () => go('online-home')
      });
      break;
    case 'topics':
      view = React.createElement(TopicsList, {
        topics: topics,
        folder: folder,
        setFolder: setFolder,
        prefs: topicPrefs,
        setPrefs: setTopicPrefs,
        onImport: () => setImporting(''),
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
        teamCfg: teamCfg,
        setTeamCfg: setTeamCfg,
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
          onStart: players => {
            const human = {
              id: 'you',
              name: soloCfg.name.trim() || 'You',
              color: COLORS[1],
              emoji: '😎',
              human: true
            };
            const list = players.length && players[0].members ? players : [human, ...players];
            setDraft(createDraft(st, list, soloRulesFor(st), {
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
          prefs: topicPrefs,
          setPrefs: setTopicPrefs,
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
        prefs: topicPrefs,
        setPrefs: setTopicPrefs,
        onBack: () => go('setup-managers'),
        onTopics: () => go('topics', {
          from: 'setup-topic'
        }),
        onPick: id => {
          const t = topics.find(x => x.id === id);
          setTopicId(id);
          setRules({
            ...rulePrefs(),
            slots: [...t.slots]
          });
          go('setup-rules');
        }
      });
      break;
    case 'setup-rules':
      {
        if (screen.from === 'solo') {
          const st = soloTopic();
          const fake = Array.from({
            length: soloT.on ? soloT.count : soloCfg.bots + 1
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
            teamSummary: teamSummarySolo,
            onEditTeams: () => go('solo-setup'),
            onReset: () => setSoloRules({
              topicId: st.id,
              rules: {
                ...RULE_DEFAULTS(),
                slots: [...st.slots]
              }
            }),
            title: "Solo \xB7 Rules",
            startLabel: "Save rules",
            onStart: r => {
              setSoloRules({
                topicId: st.id,
                rules: r
              });
              saveRulePrefs(r);
              go('solo-setup');
            }
          }) : null;
          break;
        }
        const t = topics.find(x => x.id === topicId);
        view = t ? React.createElement(SetupRules, {
          topic: t,
          managers: localPlayers(),
          rules: rules,
          setRules: setRules,
          onBack: () => go('setup-topic'),
          teamSummary: teamSummaryLocal,
          onEditTeams: () => go('setup-managers'),
          onReset: () => setRules({
            ...RULE_DEFAULTS(),
            slots: [...t.slots]
          }),
          onStart: r => {
            saveRulePrefs(r);
            setDraft(createDraft(t, localPlayers(), r));
            go('draft');
          }
        }) : null;
        break;
      }
    case 'tv-local':
      view = React.createElement(LocalTv, {
        past: past,
        settings: settings
      });
      break;
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
      });else if (draft.phase === 'nominate') view = React.createElement(Nominate, {
        d: draft,
        setDraft: setDraft,
        goHome: () => go('home')
      });else if (draft.phase === 'forcepick') view = React.createElement(ForcedPick, {
        d: draft,
        setDraft: setDraft,
        goHome: () => go('home')
      });else if (draft.phase === 'trade') view = React.createElement(TradeWindow, {
        d: draft,
        setDraft: setDraft,
        goHome: () => go('home')
      });else view = React.createElement(Results, {
        d: draft,
        past: past,
        showShame: settings.showShame,
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
      view = React.createElement(NetCtx.Provider, {
        value: localNet
      }, React.createElement("div", {
        className: localTv ? 'tvmode' : ''
      }, React.createElement(TvSwitch, {
        on: !localTv,
        onThisScreen: () => setLocalTv(true)
      }, view), localTv && React.createElement(TvExit, {
        onExit: () => setLocalTv(false)
      })));
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
          showShame: settings.showShame,
          onChange: nd => {
            setPast(ps => ps.map(x => x.id === nd.id ? nd : x));
            if (draft && draft.id === nd.id) setDraft({
              ...draft,
              votes: nd.votes,
              votesRevealed: nd.votesRevealed,
              finale: nd.finale
            });
          },
          onBack: () => go('past')
        }) : null;
        break;
      }
    case 'players':
      view = React.createElement(ProfilesScreen, {
        past: past,
        settings: settings,
        setSettings: setSettings,
        onBack: () => go('home'),
        onOpen: key => go('player', {
          id: key
        }),
        onShame: () => go('shame')
      });
      break;
    case 'player':
      view = React.createElement(ProfileView, {
        key: screen.id,
        past: past,
        settings: settings,
        setSettings: setSettings,
        pkey: screen.id,
        onBack: () => go('players')
      });
      break;
    case 'shame':
      view = React.createElement(ShameScreen, {
        past: past,
        settings: settings,
        onBack: () => go('players')
      });
      break;
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
        settings: settings,
        setSettings: setSettings,
        rulePrefs: rulePrefs,
        saveRulePrefs: saveRulePrefs,
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
            ...rulePrefs(),
            slots: []
          });
          go('setup-managers');
        },
        onSolo: () => {
          setDraft(null);
          go('solo-setup');
        },
        onOnline: () => go('online-home'),
        onPlayers: () => go('players'),
        onResume: () => go('draft'),
        onTopics: () => go('topics'),
        onPast: () => go('past'),
        onAbandon: () => setDraft(null)
      });
  }
  return React.createElement(AudioCtx.Provider, {
    value: {
      cfg: audioCfg,
      set: setAudioCfg
    }
  }, view, flash && React.createElement(Flash, {
    f: flash,
    onDone: () => setFlash(null)
  }), importing !== null && React.createElement(ImportTopicSheet, {
    topics: topics,
    initial: importing,
    onClose: () => setImporting(null),
    onImport: t => {
      setTopics(ts => [...ts, t]);
      setToast('Added “' + t.name + '” to ' + t.folder + '.');
    }
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
  finale: {
    buildBracket,
    advanceBracket,
    nextMatchup,
    matchVoters,
    canVoteFor,
    decideMatchup,
    simulateMatch,
    playerRating,
    teamRating,
    matchupVoteBot,
    finaleMode,
    isFootball,
    startFinale,
    castMatchVote,
    botMatchVotes,
    playMatchup,
    resolveMatchup,
    getMatchup,
    needsVote,
    needsMatch,
    votingDone,
    finaleStandings,
    finaleRecord,
    championStory,
    goldenBoot,
    matchVoteProblem,
    roundName,
    FINALE_DEFAULTS,
    validRating,
    matchScript,
    revealedEvents,
    matchFrame,
    lineupOf,
    expectedGoals,
    strength2,
    squad
  },
  audio,
  AUDIO_DEFAULTS,
  share: {
    encodeTopic,
    decodeShared,
    packTopic,
    unpackTopic,
    topicCode,
    shareLink,
    MAX_LINK
  },
  stats: {
    careerStats,
    computeAwards,
    computeShame,
    hallOfShame,
    humanPlayers
  },
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
    BOT_TYPES,
    botCardPlay,
    botVeto,
    botNominate,
    botTradeDecision,
    botTradeOffer
  },
  twists: {
    twistRules,
    TWIST_DEFAULTS,
    playCard,
    answerCard,
    cardProblem,
    doubleProblem,
    nominate,
    currentNominator,
    nominationPool,
    botActors,
    botAdvisers,
    participants,
    visibleItem,
    isHidden,
    rarityOf,
    frozenNow,
    proposeTrade,
    acceptTrade,
    rejectTrade,
    cancelTrade,
    closeTrades,
    tradeProblem,
    openTrades,
    hasCard
  },
  auction: {
    withdraw,
    isOut,
    auctionEnd,
    owesBid,
    withdrawProblem,
    outIds,
    owing,
    botPassers,
    botForcedBid,
    runAction,
    ownerInfo,
    migrateSettings,
    rulesLines
  },
  skips: {
    SKIP_DEFAULTS,
    skipCfg,
    skipRulesOn,
    presenter,
    skipVerdict,
    eligibleFor,
    endgameNow,
    endgameSoon,
    chooseForced,
    autoChooseForced,
    presenterLine,
    botSkipSave,
    botForcedChoice,
    unsoldOutcome,
    skipChip
  },
  topicsLib: {
    POPULARITY,
    popScore,
    byPopularity,
    folderOrder,
    favouritesOrder,
    prefsOf,
    isBuiltIn,
    folderOf,
    folderList,
    matchTopic,
    toggleIn
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
const EST_LABEL = 'Estimated game rating · not an official EA Sports FC / FIFA rating';
const ATTR_NAMES = {
  PAC: 'Pace',
  SHO: 'Shooting',
  PAS: 'Passing',
  DRI: 'Dribbling',
  DEF: 'Defending',
  PHY: 'Physical'
};
const reducedMotion = () => {
  const m = document.documentElement.getAttribute('data-motion');
  if (m === 'reduce') return true;
  if (m === 'full') return false;
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
};
function RatingCard({
  item
}) {
  const r = playerRating(item);
  return React.createElement("div", {
    className: "ratingcard"
  }, React.createElement("div", {
    className: "rc-top"
  }, React.createElement("span", {
    className: "rc-ovr num"
  }, r.ovr), React.createElement("span", {
    className: "rc-role"
  }, r.role), React.createElement("span", {
    className: "rc-name"
  }, item.name)), React.createElement("div", {
    className: "rc-attrs"
  }, ATTRS.map(a => React.createElement("div", {
    key: a,
    className: "rc-attr"
  }, React.createElement("span", {
    className: "k",
    title: ATTR_NAMES[a]
  }, a), React.createElement("span", {
    className: "bar"
  }, React.createElement("i", {
    style: {
      width: r.attrs[a] + '%'
    }
  })), React.createElement("span", {
    className: "v num"
  }, r.attrs[a])))), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, r.estimated ? EST_LABEL + '. Worked out from the card’s position and accolades; the same player always gets the same numbers.' : 'Overall set by the topic (manual override). Attributes are estimated from it.'));
}
function RatingChip({
  item
}) {
  const [open, setOpen] = useState(false);
  const r = playerRating(item);
  return React.createElement(React.Fragment, null, React.createElement("button", {
    type: "button",
    className: "ratingchip",
    onClick: () => setOpen(true),
    "aria-label": 'Rating ' + r.ovr + (r.estimated ? ', estimated' : '') + '. Show details'
  }, React.createElement("b", {
    className: "num"
  }, r.ovr), r.estimated ? ' est.' : ''), open && React.createElement(Sheet, {
    center: true,
    onClose: () => setOpen(false)
  }, React.createElement(RatingCard, {
    item: item
  }), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => setOpen(false)
  }, "Close")));
}
function TeamRatingPanel({
  d,
  m
}) {
  if (!isFootball(d.topic)) return null;
  const tr = teamRating(d, m);
  const players = [...tr.players].sort((a, b) => b.r.ovr - a.r.ovr);
  const weights = players.map((_, i) => Math.pow(0.92, i));
  return React.createElement("details", {
    className: "teamrating"
  }, React.createElement("summary", null, React.createElement("span", {
    className: "tr-num num"
  }, tr.rating), React.createElement("span", {
    className: "tr-lbl"
  }, "Team rating", tr.provisional ? ' · provisional' : ''), React.createElement("span", {
    className: "tr-more"
  }, "How? \u25BE")), React.createElement("div", {
    className: "tr-body"
  }, React.createElement("p", {
    className: "small",
    style: {
      margin: 0
    }
  }, "Weighted average of the squad, best player first (each next player counts a little less, so one superstar can\u2019t carry a team alone):"), players.map((p, i) => {
    const flex = !ROW_OF[norm(p.slot)];
    return React.createElement("div", {
      key: p.item.id || p.item.name,
      className: "tr-row"
    }, React.createElement("span", {
      className: "k"
    }, p.slot, flex ? ' (flex)' : ''), React.createElement("span", {
      className: "n"
    }, p.item.name), React.createElement("span", {
      className: "v num"
    }, p.r.ovr), React.createElement("span", {
      className: "w num"
    }, "\xD7", weights[i].toFixed(2)));
  }), React.createElement("p", {
    className: "small",
    style: {
      margin: 0
    }
  }, "Squad average ", React.createElement("b", {
    className: "num"
  }, tr.base), tr.coverage ? React.createElement(React.Fragment, null, " \xB7 coverage ", React.createElement("b", {
    className: "num"
  }, tr.coverage)) : null, tr.chem ? React.createElement(React.Fragment, null, " \xB7 chemistry ", React.createElement("b", {
    className: "num"
  }, "+", tr.chem)) : null, " = ", React.createElement("b", {
    className: "num"
  }, tr.rating)), tr.reasons.map(x => React.createElement("p", {
    key: x,
    className: "hint",
    style: {
      margin: 0
    }
  }, "\u2022 ", x)), tr.provisional && React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Provisional: ", tr.players.length < d.rules.slots.length ? 'the squad isn’t full' : 'there’s no goalkeeper', ", so matches use a simplified line-up."), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Player ratings are estimated game ratings, not official ones.")));
}
function Badge({
  m,
  size = 44
}) {
  return React.createElement("span", {
    className: "badge",
    style: {
      ...mStyle(m),
      width: size,
      height: size,
      fontSize: size * 0.5
    },
    "aria-hidden": "true"
  }, m.emoji);
}
function BracketView({
  d,
  onOpen,
  current
}) {
  const b = d.finale.bracket;
  const R = b.rounds.length;
  const name = id => {
    const t = id && teamOf(d, id);
    return t ? t : null;
  };
  return React.createElement("div", {
    className: "bracket",
    role: "list",
    "aria-label": "Tournament bracket"
  }, b.rounds.map((row, r) => React.createElement("div", {
    key: r,
    className: "bcol",
    role: "listitem"
  }, React.createElement("p", {
    className: "eyebrow"
  }, roundName(R, r)), row.map((m, i) => {
    const A = name(m.a),
      B = name(m.b);
    const bye = m.why === 'Bye';
    const isCur = current && current.r === r && current.i === i;
    const played = m.winner && m.winner !== 'none' && !bye;
    const sc = m.match ? m.match.score : null;
    const line = (T, k) => React.createElement("div", {
      className: 'bteam' + (m.winner && T && m.winner === T.id ? ' won' : m.winner && T ? ' lost' : ''),
      style: T ? mStyle(T) : null
    }, React.createElement("span", {
      className: "bt-n"
    }, T ? T.emoji + ' ' + T.name : bye ? 'Bye' : '—'), sc && React.createElement("span", {
      className: "bt-s num"
    }, sc[k], m.match.pens ? React.createElement("small", null, "(", m.match.pens[k], ")") : null));
    if (m.winner === 'none') return React.createElement("div", {
      key: m.id,
      className: "bmatch empty"
    }, React.createElement("span", {
      className: "hint"
    }, "\u2014"));
    return React.createElement("button", {
      key: m.id,
      type: "button",
      className: 'bmatch' + (isCur ? ' cur' : '') + (played ? ' done' : ''),
      disabled: !played || !onOpen,
      onClick: () => onOpen && onOpen({
        r,
        i
      }),
      "aria-label": (A ? A.name : 'TBD') + ' versus ' + (B ? B.name : bye ? 'bye' : 'TBD') + (played ? ', decided' : isCur ? ', up next' : '')
    }, line(A, 0), line(B, 1), isCur && React.createElement("span", {
      className: "bm-tag"
    }, "Up next"), played && React.createElement("span", {
      className: "bm-tag ok"
    }, "Decided \u2713"));
  }))));
}
const clockText = (min, et, stop) => et ? min + '′ ET' : min > 90 ? '90+' + (min - 90) + '′' : min > 45 && !stop ? min + '′' : min + '′';
function MatchPlayer({
  d,
  A,
  B,
  match,
  speed,
  commentary,
  onDone,
  label
}) {
  const instant = speed === 'instant';
  const perMin = speed === 'fast' ? 190 : 430;
  const ev = match.events;
  const [pos, setPos] = useState(instant ? ev.length : 0);
  const [clock, setClock] = useState(instant ? (ev[ev.length - 1] || {
    min: 90
  }).min : 0);
  const [et, setEt] = useState(instant ? !!match.et : false);
  const [wait, setWait] = useState(0);
  const [pause, setPause] = useState(null);
  const done = pos >= ev.length;
  const feedRef = useRef(null);
  const fired = useRef(false);
  useEffect(() => {
    if (done) {
      if (!fired.current) {
        fired.current = true;
        if (!instant) audio.play('whistle');
        onDone && onDone();
      }
      return undefined;
    }
    const t = setTimeout(() => {
      setPause(null);
      const next = ev[pos];
      if (next.type === 'pen' || next.type === 'note' || next.min <= clock) {
        setPos(pos + 1);
        let w = 260;
        if (next.type === 'goal') {
          w = 1500;
          setPause('goal');
          audio.play('cheer');
          audio.say(callLine('goal', {
            who: next.player
          }), 2, d.id + ':' + label + ':g' + pos);
        } else if (next.type === 'half') {
          w = 1800;
          setPause('half');
          audio.play('whistle');
        } else if (next.type === 'kickoff') {
          audio.play('whistle');
          w = 500;
        } else if (next.type === 'red') {
          audio.play('buzzer');
          w = 900;
        } else if (next.type === 'et') {
          setEt(true);
          setClock(90);
          w = 1200;
        } else if (next.type === 'pens') w = 1200;else if (next.type === 'pen') {
          audio.play(next.scored ? 'bid' : 'buzzer');
          w = 800;
        }
        setWait(ms(w));
      } else {
        setClock(clock + 1);
        setWait(ms(perMin));
      }
    }, wait);
    return () => clearTimeout(t);
  }, [pos, clock, done]);
  useEffect(() => {
    const f = feedRef.current;
    if (f) f.scrollTop = f.scrollHeight;
  }, [pos]);
  const shown = ev.slice(0, pos);
  const lastScore = [...shown].reverse().find(e => e.score);
  const score = done ? match.score : lastScore ? lastScore.score : [0, 0];
  const lastPen = [...shown].reverse().find(e => e.pens);
  const pens = done ? match.pens : lastPen ? lastPen.pens : null;
  const keyTypes = ['goal', 'red', 'yellow', 'half', 'full', 'et', 'pens', 'pen', 'note', 'kickoff'];
  const feed = shown.filter(e => commentary || keyTypes.includes(e.type));
  const trA = isFootball(d.topic) ? teamRating(d, A).rating : null,
    trB = isFootball(d.topic) ? teamRating(d, B).rating : null;
  return React.createElement("div", {
    className: "matchview"
  }, React.createElement("div", {
    className: "scoreboard"
  }, React.createElement("div", {
    className: "sb-team"
  }, React.createElement(Badge, {
    m: A
  }), React.createElement("span", {
    className: "sb-n"
  }, A.name), trA != null && React.createElement("span", {
    className: "sb-r num"
  }, trA)), React.createElement("div", {
    className: "sb-mid"
  }, React.createElement("span", {
    className: "sb-score num",
    "aria-live": "polite"
  }, score[0], "\u2013", score[1]), pens && React.createElement("span", {
    className: "sb-pens num"
  }, "pens ", pens[0], "\u2013", pens[1]), React.createElement("span", {
    className: "sb-clock num"
  }, done ? match.pens ? 'FT · pens' : match.et ? 'AET' : 'FT' : clockText(clock, et))), React.createElement("div", {
    className: "sb-team"
  }, React.createElement(Badge, {
    m: B
  }), React.createElement("span", {
    className: "sb-n"
  }, B.name), trB != null && React.createElement("span", {
    className: "sb-r num"
  }, trB))), !done && React.createElement("div", {
    className: "sb-progress"
  }, React.createElement("i", {
    style: {
      width: Math.min(100, clock / (et ? 120 : 95) * 100) + '%'
    }
  })), pause === 'half' && !done && React.createElement("div", {
    className: "mbanner"
  }, "HALF-TIME \xB7 ", score[0], "\u2013", score[1]), pause === 'goal' && !done && React.createElement("div", {
    className: 'mbanner goal' + (reducedMotion() ? '' : ' pop')
  }, "GOAL!"), React.createElement("div", {
    className: "mfeed",
    ref: feedRef,
    "aria-live": "polite"
  }, feed.map((e, k) => React.createElement("p", {
    key: k,
    className: 'mev ' + e.type + (e.team != null ? ' t' + e.team : '')
  }, React.createElement("span", {
    className: "mm num"
  }, e.type === 'pen' || e.type === 'pens' ? 'PEN' : e.type === 'note' ? 'i' : e.min + '′'), React.createElement("span", null, e.type === 'goal' ? '⚽ ' : e.type === 'yellow' ? '🟨 ' : e.type === 'red' ? '🟥 ' : e.type === 'pen' ? e.scored ? '✅ ' : '❌ ' : '', e.text, e.team != null && e.type !== 'pen' ? React.createElement("small", null, " \xB7 ", (e.team === 0 ? A : B).name) : null)))), !done && React.createElement("button", {
    type: "button",
    className: "btn btn-ghost btn-sm",
    onClick: () => {
      setPos(ev.length);
      setClock(ev[ev.length - 1].min);
    }
  }, "Skip to full-time"), done && React.createElement(MatchSummary, {
    d: d,
    A: A,
    B: B,
    match: match
  }));
}
function MatchSummary({
  d,
  A,
  B,
  match
}) {
  const goals = [0, 1].map(k => match.events.filter(e => e.type === 'goal' && e.team === k));
  const cards = match.events.filter(e => e.type === 'yellow' || e.type === 'red');
  const incomplete = [A, B].filter(t => isFootball(d.topic) && teamRating(d, t).provisional);
  return React.createElement("div", {
    className: "board msummary"
  }, React.createElement("h3", null, "\uD83D\uDCCB Match summary"), React.createElement("p", {
    className: "small",
    style: {
      margin: 0
    }
  }, React.createElement("b", null, A.name, " ", match.score[0], "\u2013", match.score[1], " ", B.name), match.et ? ' · after extra time' : '', match.pens ? ' · ' + (match.pens[0] > match.pens[1] ? A.name : B.name) + ' win ' + Math.max(...match.pens) + '–' + Math.min(...match.pens) + ' on penalties' : ''), [A, B].map((t, k) => React.createElement("p", {
    key: t.id,
    className: "small",
    style: {
      margin: 0
    }
  }, "\u26BD ", t.name, ": ", goals[k].length ? goals[k].map(g => g.player + ' ' + g.min + '′' + (g.assist ? ' (assist ' + g.assist + ')' : '')).join(', ') : 'no goals')), cards.length > 0 && React.createElement("p", {
    className: "small",
    style: {
      margin: 0
    }
  }, cards.map(c => (c.type === 'red' ? '🟥 ' : '🟨 ') + c.player + ' ' + c.min + '′').join(' · ')), !match.forfeit && React.createElement("div", {
    className: "mstats"
  }, React.createElement("span", null, "Shots"), React.createElement("b", {
    className: "num"
  }, match.stats.shots[0]), React.createElement("b", {
    className: "num"
  }, match.stats.shots[1]), React.createElement("span", null, "Possession"), React.createElement("b", {
    className: "num"
  }, match.stats.possession[0], "%"), React.createElement("b", {
    className: "num"
  }, match.stats.possession[1], "%")), match.notes.map(n => React.createElement("p", {
    key: n,
    className: "hint",
    style: {
      margin: 0
    }
  }, "\u2139\uFE0F ", n)), incomplete.map(t => React.createElement("p", {
    key: t.id,
    className: "hint",
    style: {
      margin: 0
    }
  }, "\u2139\uFE0F ", t.name, "\u2019s squad is incomplete, so empty slots count as weak players (simplified simulation).")), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "A game simulation from the drafted squads and estimated ratings. It doesn\u2019t predict real results."));
}
function MatchVote({
  d,
  r,
  i,
  onChange,
  onCount,
  nv,
  act
}) {
  const m = getMatchup(d, r, i);
  const A = teamOf(d, m.a),
    B = teamOf(d, m.b);
  const online = !!(nv && nv.online);
  const solo = d.mode === 'solo' || online;
  const voters = matchVoters(d, m);
  const humans = voters.filter(p => !p.bot);
  const mine = online ? humans.filter(p => nv.controlsPart(p.id)) : humans;
  const firstOpen = mine.find(p => !hasMatchVote(m, p.id));
  const [voter, setVoter] = useState(solo && firstOpen ? firstOpen.id : null);
  const [choice, setChoice] = useState(null);
  const [locked, setLocked] = useState(false);
  const nVoted = voters.filter(p => hasMatchVote(m, p.id)).length;
  const allIn = votingDone(d, m);
  const neutral = voters.every(p => p.teamId !== m.a && p.teamId !== m.b);
  if (locked) return React.createElement("div", {
    className: "card stack-sm",
    style: {
      textAlign: 'center'
    }
  }, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 34
    }
  }, "Vote locked \uD83D\uDD12"), online ? React.createElement("p", {
    className: "muted",
    style: {
      margin: 0
    }
  }, "Waiting for everyone else to vote\u2026") : solo ? React.createElement("p", {
    className: "muted",
    style: {
      margin: 0
    }
  }, "\uD83E\uDD16 The bots have voted too.") : React.createElement("p", {
    className: "muted",
    style: {
      margin: 0
    }
  }, "Pass the phone to the next voter."), online ? React.createElement("button", {
    className: "btn",
    onClick: () => {
      setLocked(false);
      setVoter(null);
      setChoice(null);
    }
  }, "OK") : React.createElement("button", {
    className: "btn btn-gold",
    onClick: () => {
      setLocked(false);
      setVoter(null);
      setChoice(null);
      if (solo) onCount();
    }
  }, solo ? 'Count the votes' : 'Next voter'));
  if (voter) {
    const v = voters.find(p => p.id === voter);
    return React.createElement("div", {
      className: "stack-sm"
    }, React.createElement("p", {
      className: "eyebrow"
    }, "Secret vote \xB7 ", A.name, " v ", B.name), React.createElement("h2", {
      className: "display",
      style: {
        fontSize: 30,
        color: v.color
      }
    }, v.emoji, " ", v.name, ", who\u2019s stronger?"), React.createElement("p", {
      className: "hint"
    }, "You can\u2019t vote for your own team."), [A, B].map(t => {
      const own = !canVoteFor(v, t.id);
      return React.createElement("button", {
        key: t.id,
        className: "votebtn",
        style: {
          ...mStyle(t),
          alignItems: 'stretch',
          textAlign: 'left'
        },
        disabled: own,
        "aria-pressed": choice === t.id,
        onClick: () => setChoice(t.id)
      }, React.createElement("span", null, t.emoji, " ", t.name, own ? ' · your team' : '', isFootball(d.topic) ? React.createElement("small", null, " \xB7 rating ", teamRating(d, t).rating) : null), React.createElement("span", {
        className: "teamtxt"
      }, t.team.filter(Boolean).map(x => d.items[x.itemId].name).join(', ')));
    }), React.createElement("div", {
      className: "row"
    }, !solo && React.createElement("button", {
      type: "button",
      className: "btn btn-ghost grow",
      onClick: () => {
        setVoter(null);
        setChoice(null);
      }
    }, "Back"), React.createElement("button", {
      type: "button",
      className: "btn btn-gold grow",
      disabled: !choice,
      onClick: () => {
        buzz(30);
        if (online) act('matchVote', r, i, voter, choice);else onChange(castMatchVote(d, r, i, voter, choice));
        setLocked(true);
      }
    }, choice ? 'Lock in ' + teamOf(d, choice).name : 'Pick a team')));
  }
  return React.createElement("div", {
    className: "stack-sm"
  }, React.createElement("p", {
    className: "eyebrow"
  }, "Matchup vote \xB7 ", nVoted, " of ", voters.length, " in"), React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 30
    }
  }, A.emoji, " ", A.name, " v ", B.emoji, " ", B.name), React.createElement("p", {
    className: "hint"
  }, neutral ? 'Players who aren’t in this matchup vote. ' : 'Everyone is on one of these teams, so everyone votes — never for their own team. ', m.revoted ? 'This is the revote after a tie.' : 'Votes stay secret until they’re counted.'), m.note && React.createElement("p", {
    className: "warn"
  }, m.note), !humans.length && React.createElement("p", {
    className: "hint"
  }, "Only bots vote on this one. They\u2019ve voted."), online && !mine.length && humans.length > 0 && React.createElement("p", {
    className: "hint"
  }, "You\u2019re not voting on this one (it\u2019s your team, or you\u2019re watching)."), humans.length > 0 && React.createElement("div", {
    className: "votegrid"
  }, humans.map(p => {
    const done = hasMatchVote(m, p.id);
    return React.createElement("button", {
      key: p.id,
      className: "votebtn",
      style: mStyle(p),
      disabled: done || online && !nv.controlsPart(p.id),
      onClick: () => setVoter(p.id)
    }, React.createElement("span", {
      style: {
        fontSize: 24
      }
    }, done ? '✅' : p.emoji), p.name, p.teamName ? React.createElement("small", null, p.teamName) : null);
  })), !nv || nv.isHost ? React.createElement("button", {
    className: "btn btn-gold",
    disabled: !allIn && !nVoted,
    onClick: onCount
  }, allIn ? 'Count the votes' : 'Count now (' + nVoted + '/' + voters.length + ')') : React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, "The host counts the votes", allIn ? ' — everyone’s in.' : '.'));
}
function Finale({
  d,
  onChange,
  onClose,
  onChampion
}) {
  const fin = d.finale;
  const cfg = finCfg(d);
  const mode = fin.mode;
  const nv = netView(d, useNet());
  const act = useAct(d, onChange);
  const host = nv.isHost && !nv.tv;
  const nx = nextMatchup(fin.bracket);
  const ui = fin.ui || {
    stage: 'overview',
    cur: null
  };
  const stage = ui.stage === 'done' ? 'overview' : ui.stage;
  const cur = ui.cur;
  const withUi = (n, patch) => ({
    ...n,
    finale: {
      ...n.finale,
      ui: {
        ...ui,
        ...patch
      }
    }
  });
  const [matchOver, setMatchOver] = useState(false);
  const [view, setView] = useState(null);
  const R = fin.bracket.rounds.length;
  const modeName = {
    bracket: 'Head-to-head bracket',
    sim: 'Match simulator',
    combined: 'Combined finale'
  }[mode];
  const begin = () => {
    const at = {
      r: nx.r,
      i: nx.i
    };
    setMatchOver(false);
    if (needsVote(mode)) onChange(withUi(botMatchVotes(d, at.r, at.i), {
      stage: 'vote',
      cur: at
    }));else onChange(withUi(playMatchup(d, at.r, at.i), {
      stage: 'match',
      cur: at
    }));
  };
  const finish = () => {
    let n = resolveMatchup(d, cur.r, cur.i);
    const m = getMatchup(n, cur.r, cur.i);
    if (!m.winner && m.revoted) {
      n = botMatchVotes(n, cur.r, cur.i);
      onChange(withUi(n, {
        stage: 'vote'
      }));
      return;
    }
    onChange(withUi(n, {
      stage: 'result'
    }));
  };
  const counted = () => {
    if (needsMatch(mode)) {
      setMatchOver(false);
      onChange(withUi(playMatchup(d, cur.r, cur.i), {
        stage: 'match'
      }));
    } else finish();
  };
  const decided = cur && stage === 'result' ? cur.r + ':' + cur.i : '';
  useEffect(() => {
    if (decided) audio.play(d.finale.champion ? 'fanfare' : 'gavel');
  }, [decided]);
  const waiting = React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, "Waiting for the host\u2026");
  const cm = cur && getMatchup(d, cur.r, cur.i);
  const A = cm && cm.a && teamOf(d, cm.a),
    B = cm && cm.b && teamOf(d, cm.b);
  let body;
  if (stage === 'vote' && cm && !cm.winner) body = React.createElement(MatchVote, {
    key: cm.id + (cm.revoted ? 'r' : ''),
    d: d,
    r: cur.r,
    i: cur.i,
    onChange: onChange,
    onCount: counted,
    nv: nv,
    act: act
  });else if (stage === 'match' && cm && cm.match) body = React.createElement(React.Fragment, null, React.createElement("p", {
    className: "eyebrow",
    style: {
      textAlign: 'center'
    }
  }, roundName(R, cur.r), cur.r === R - 1 ? ' · the big one' : ''), React.createElement(MatchView, {
    key: cm.id,
    d: d,
    A: A,
    B: B,
    match: cm.match,
    speed: cfg.speed,
    commentary: cfg.commentary,
    label: cm.id,
    onDone: () => setMatchOver(true)
  }), matchOver && (host ? React.createElement("button", {
    className: "btn btn-gold",
    onClick: finish
  }, mode === 'combined' ? 'Combine with the votes' : 'Continue') : waiting));else if (stage === 'result' && cm && cm.winner) body = React.createElement(MatchupResult, {
    d: d,
    m: cm,
    r: cur.r,
    final: cur.r === R - 1,
    host: host,
    onNext: () => {
      if (d.finale.champion) onChampion();else onChange(withUi(d, {
        stage: 'overview',
        cur: null
      }));
    }
  });else body = React.createElement(React.Fragment, null, React.createElement("div", {
    className: "card stack-sm"
  }, React.createElement("p", {
    className: "eyebrow"
  }, modeName), nx ? React.createElement(React.Fragment, null, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 30
    }
  }, roundName(R, nx.r), nx.r === R - 1 ? ' 🏆' : ''), React.createElement("div", {
    className: "vsrow"
  }, [nx.m.a, nx.m.b].map((id, k) => {
    const t = teamOf(d, id);
    return React.createElement(React.Fragment, {
      key: id
    }, k === 1 && React.createElement("span", {
      className: "vs"
    }, "VS"), React.createElement("div", {
      className: "vsteam"
    }, React.createElement(Badge, {
      m: t,
      size: 52
    }), React.createElement("b", null, t.name), isFootball(d.topic) && React.createElement("span", {
      className: "small num"
    }, "Rating ", teamRating(d, t).rating, teamRating(d, t).provisional ? ' (prov.)' : '')));
  })), host ? React.createElement("button", {
    className: "btn btn-gold",
    onClick: begin
  }, needsVote(mode) ? mode === 'combined' ? 'Vote, then kick off' : 'Vote on this matchup' : 'Kick off') : waiting) : fin.champion ? React.createElement(React.Fragment, null, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 30
    }
  }, "We have a champion"), host ? React.createElement("button", {
    className: "btn btn-gold",
    onClick: onChampion
  }, "\uD83C\uDFC6 Reveal the champion") : waiting) : React.createElement(React.Fragment, null, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 28
    }
  }, "No matchups to play"), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "No team has any players, so there\u2019s nobody to crown."))), React.createElement(BracketView, {
    d: d,
    current: nx,
    onOpen: setView
  }), mode === 'combined' && React.createElement("p", {
    className: "hint"
  }, "Combined score: ", cfg.weight, "% match performance + ", 100 - cfg.weight, "% votes. If it\u2019s dead level, the match result (extra time or penalties) decides."));
  return React.createElement("div", {
    className: "finale",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Finale"
  }, React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onClose,
    backLabel: "\u2715",
    title: "Finale",
    right: React.createElement(MuteButton, null)
  }), body), view && React.createElement(MatchupSheet, {
    d: d,
    at: view,
    onClose: () => setView(null)
  }));
}
function MatchupResult({
  d,
  m,
  r,
  final,
  onNext,
  host = true
}) {
  const W = teamOf(d, m.winner);
  const L = teamOf(d, m.winner === m.a ? m.b : m.a);
  const A = teamOf(d, m.a),
    B = teamOf(d, m.b);
  const va = Object.values(m.votes || {}).filter(v => v === m.a).length,
    vb = Object.values(m.votes || {}).filter(v => v === m.b).length;
  const mode = d.finale.mode;
  const cfg = finCfg(d);
  const perfA = m.match ? (m.match.score[0] + 0.5) / (m.match.score[0] + m.match.score[1] + 1) : null;
  const voteA = va + vb ? va / (va + vb) : 0.5;
  return React.createElement("div", {
    className: "stack"
  }, React.createElement("div", {
    className: "winner"
  }, React.createElement("p", {
    className: "eyebrow",
    style: {
      color: 'var(--gold-ink)'
    }
  }, final ? 'Winner of the final' : 'Through to the next round'), React.createElement("div", {
    className: "display"
  }, W.emoji, " ", W.name), React.createElement("p", {
    className: "small",
    style: {
      margin: '4px 0 0',
      fontWeight: 700
    }
  }, m.why)), needsVote(mode) && React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83D\uDDF3\uFE0F Votes"), React.createElement("div", {
    className: "brow",
    style: mStyle(A)
  }, React.createElement("span", {
    className: "bn"
  }, A.emoji, " ", A.name), React.createElement("span", {
    className: "bw num"
  }, va)), React.createElement("div", {
    className: "brow",
    style: mStyle(B)
  }, React.createElement("span", {
    className: "bn"
  }, B.emoji, " ", B.name), React.createElement("span", {
    className: "bw num"
  }, vb)), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, Object.entries(m.votes || {}).map(([pid, t]) => {
    const p = participants(d).find(x => x.id === pid);
    return (p ? p.name : '?') + ' → ' + teamOf(d, t).name;
  }).join(' · ') || 'No votes were cast.')), mode === 'combined' && m.match && React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83E\uDDEE How it was decided"), [[A, perfA, voteA], [B, 1 - perfA, 1 - voteA]].map(([t, p, v]) => React.createElement("div", {
    key: t.id,
    className: "combo"
  }, React.createElement("span", {
    className: "bn"
  }, t.emoji, " ", t.name), React.createElement("span", {
    className: "cbar"
  }, React.createElement("i", {
    className: "m",
    style: {
      width: p * cfg.weight + '%'
    }
  }), React.createElement("i", {
    className: "v",
    style: {
      width: v * (100 - cfg.weight) + '%'
    }
  })), React.createElement("b", {
    className: "num"
  }, Math.round(p * cfg.weight + v * (100 - cfg.weight)), "%"))), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, React.createElement("span", {
    className: "key m"
  }), " match ", cfg.weight, "% \xB7 ", React.createElement("span", {
    className: "key v"
  }), " votes ", 100 - cfg.weight, "%. ", m.detail, ". Match share = (goals + \xBD) \xF7 (total goals + 1), so a 6\u20135 isn\u2019t worth more than a 2\u20131 swing.")), m.match && React.createElement(MatchSummary, {
    d: d,
    A: A,
    B: B,
    match: m.match
  }), React.createElement("p", {
    className: "hint"
  }, L.name, " ", final ? 'finish as runners-up.' : 'are knocked out.'), host ? React.createElement("button", {
    className: "btn btn-gold",
    onClick: onNext
  }, d.finale.champion ? '🏆 Reveal the champion' : 'Back to the bracket') : React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, "Waiting for the host\u2026"));
}
function MatchupSheet({
  d,
  at,
  onClose
}) {
  const m = getMatchup(d, at.r, at.i);
  const [replay, setReplay] = useState(false);
  if (!m || !m.a || !m.b) return null;
  const A = teamOf(d, m.a),
    B = teamOf(d, m.b);
  const cfg = finCfg(d);
  return React.createElement(Sheet, {
    center: true,
    onClose: onClose
  }, React.createElement("p", {
    className: "eyebrow"
  }, roundName(d.finale.bracket.rounds.length, at.r)), React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 28
    }
  }, A.name, " v ", B.name), m.why && React.createElement("p", {
    className: "small",
    style: {
      margin: 0,
      fontWeight: 700
    }
  }, m.why), m.detail && React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, m.detail), replay && m.match ? React.createElement(MatchView, {
    d: d,
    A: A,
    B: B,
    match: m.match,
    speed: cfg.speed === 'instant' ? 'fast' : cfg.speed,
    commentary: cfg.commentary,
    label: m.id + ':replay'
  }) : m.match ? React.createElement(MatchSummary, {
    d: d,
    A: A,
    B: B,
    match: m.match
  }) : null, m.match && !replay && React.createElement("button", {
    className: "btn",
    onClick: () => setReplay(true)
  }, "\u25B6 Watch again (recorded, same result)"), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onClose
  }, "Close"));
}
function FriendlySheet({
  d,
  onClose
}) {
  const teams = d.managers.filter(m => m.team.some(Boolean));
  const [a, setA] = useState(teams[0] ? teams[0].id : null);
  const [b, setB] = useState(teams[1] ? teams[1].id : null);
  const [game, setGame] = useState(null);
  const [n, setN] = useState(0);
  const cfg = finCfg(d);
  if (teams.length < 2) return React.createElement(Sheet, {
    center: true,
    onClose: onClose
  }, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 28
    }
  }, "Friendly match"), React.createElement("p", {
    className: "hint"
  }, "You need two teams with players."), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onClose
  }, "Close"));
  const play = () => {
    const k = n + 1;
    setN(k);
    setGame({
      A: teamOf(d, a),
      B: teamOf(d, b),
      match: simulateMatch(d, teamOf(d, a), teamOf(d, b), 'friendly:' + Date.now() + ':' + k, false),
      k
    });
  };
  return React.createElement(Sheet, {
    center: true,
    onClose: onClose
  }, React.createElement("p", {
    className: "eyebrow"
  }, "Exhibition \xB7 doesn\u2019t change any result"), React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 28
    }
  }, "Friendly match"), game ? React.createElement(React.Fragment, null, React.createElement(MatchView, {
    key: game.k,
    d: d,
    A: game.A,
    B: game.B,
    match: game.match,
    speed: cfg.speed,
    commentary: cfg.commentary,
    label: 'friendly' + game.k
  }), React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn grow",
    onClick: play
  }, "Rematch"), React.createElement("button", {
    className: "btn btn-ghost grow",
    onClick: () => setGame(null)
  }, "Pick teams"))) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "fr-a"
  }, "Home"), React.createElement("select", {
    id: "fr-a",
    className: "input",
    value: a,
    onChange: e => setA(e.target.value)
  }, teams.map(t => React.createElement("option", {
    key: t.id,
    value: t.id,
    disabled: t.id === b
  }, t.emoji, " ", t.name, " \xB7 ", teamRating(d, t).rating)))), React.createElement("div", {
    className: "field"
  }, React.createElement("label", {
    htmlFor: "fr-b"
  }, "Away"), React.createElement("select", {
    id: "fr-b",
    className: "input",
    value: b,
    onChange: e => setB(e.target.value)
  }, teams.map(t => React.createElement("option", {
    key: t.id,
    value: t.id,
    disabled: t.id === a
  }, t.emoji, " ", t.name, " \xB7 ", teamRating(d, t).rating)))), React.createElement("button", {
    className: "btn btn-gold",
    disabled: !a || !b || a === b,
    onClick: play
  }, "Kick off"), React.createElement("p", {
    className: "hint"
  }, "Friendlies can end in a draw. Each kick-off is a new random game.")), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onClose
  }, "Close"));
}
function FinaleResults({
  d,
  onOpen
}) {
  const f = d.finale;
  const champ = teamOf(d, f.champion);
  const games = playedMatchups(f.bracket);
  const last = games[games.length - 1];
  const final = last && last.m.winner === champ.id ? last.m : null;
  const ru = final ? teamOf(d, final.a === champ.id ? final.b : final.a) : null;
  const tr = isFootball(d.topic) ? teamRating(d, champ) : null;
  const sc = final && final.match ? final.a === champ.id ? final.match.score : [...final.match.score].reverse() : null;
  return React.createElement(React.Fragment, null, React.createElement("div", {
    className: "winner"
  }, React.createElement("p", {
    className: "eyebrow",
    style: {
      color: 'var(--gold-ink)'
    }
  }, "Champion \xB7 ", needsMatch(f.mode) ? 'won the knockout' : 'won the bracket'), React.createElement("div", {
    className: "display"
  }, champ.emoji, " ", champ.name), champ.members && React.createElement("p", {
    className: "small",
    style: {
      margin: 0,
      fontWeight: 700
    }
  }, champ.members.map(p => p.name).join(' · ')), React.createElement("p", {
    className: "small",
    style: {
      margin: '6px 0 0',
      fontWeight: 700
    }
  }, ru ? 'Beat ' + ru.name + ' in the final' + (sc ? ' ' + sc[0] + '–' + sc[1] + (final.match.pens ? ' (pens)' : final.match.et ? ' (AET)' : '') : '') : 'Walked through', tr ? ' · team rating ' + tr.rating : ''), d.mode === 'solo' && champ.human && React.createElement("p", {
    className: "small",
    style: {
      margin: '4px 0 0',
      fontWeight: 700
    }
  }, "You beat the bots!")), React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83E\uDDE0 Why they won"), React.createElement("p", {
    className: "small",
    style: {
      margin: 0
    }
  }, championStory(d))), React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83D\uDDC2\uFE0F Bracket"), React.createElement(BracketView, {
    d: d,
    onOpen: onOpen
  }), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Tap a decided matchup to see how it went.")), React.createElement("div", {
    className: "board"
  }, React.createElement("h3", null, "\uD83D\uDCCA Final standings"), finaleStandings(d).map(s => React.createElement("div", {
    key: s.team.id,
    className: 'brow' + (s.label === 'Champion' ? ' hl' : ''),
    style: mStyle(s.team)
  }, React.createElement("span", {
    className: "bn"
  }, s.team.emoji, " ", s.team.name), React.createElement("span", {
    className: "small",
    style: {
      fontWeight: 700
    }
  }, s.label), isFootball(d.topic) && React.createElement("span", {
    className: "bw num",
    style: {
      fontSize: 18
    }
  }, teamRating(d, s.team).rating)))));
}
const PITCH = {
  w: 105,
  h: 68
};
const hashU = (...parts) => hashStr(parts.join('|')) % 10000 / 10000;
const lerp = (a, b, u) => a + (b - a) * u;
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const lerpP = (p, q, u) => ({
  x: lerp(p.x, q.x, u),
  y: lerp(p.y, q.y, u)
});
const LINE_X = {
  GK: 0.04,
  DEF: 0.2,
  MID: 0.38,
  FWD: 0.54
};
const SEG = 1.25;
const IN = 1.6;
const TS = 1.5;
const PIN = 1.8;
const GLIDE = {
  half: 2.2,
  full: 1.8,
  et: 1.8,
  pens: 1.8,
  restart: 2,
  kickoff: 1.2
};
function lineupOf(d, m) {
  const sq = squad(d, m);
  const hasGK = sq.some(p => p.role === 'GK');
  const rows = sq.map((p, i) => ({
    ...p,
    role: !hasGK && i === sq.reduce((bi, q, k) => q.r.attrs.DEF > sq[bi].r.attrs.DEF ? k : bi, 0) ? 'GK' : p.role
  }));
  const out = [];
  ['GK', 'DEF', 'MID', 'FWD'].forEach(role => {
    const line = rows.filter(p => p.role === role);
    line.forEach((p, k) => out.push({
      name: p.name,
      role,
      ovr: p.r.ovr,
      pac: p.r.attrs.PAC,
      num: (() => {
        const it = Object.values(d.items).find(x => x.name === p.name);
        return it ? kitNumber(it) : k + 1;
      })(),
      base: {
        x: LINE_X[role],
        y: line.length === 1 ? 0.5 : 0.18 + 0.64 * k / (line.length - 1)
      }
    }));
  });
  return out;
}
function matchScript(match) {
  const beats = [];
  let t = 0;
  const add = b => {
    b.t0 = t;
    t += b.dur;
    beats.push(b);
    return b;
  };
  add({
    type: 'kickoff',
    dur: 2,
    min: 0,
    show: [0],
    reveal: 0.1
  });
  match.events.forEach((e, k) => {
    if (e.type === 'kickoff') return;
    if (e.type === 'half' || e.type === 'full' || e.type === 'et' || e.type === 'pens') {
      add({
        type: e.type,
        dur: e.type === 'half' ? 3.6 : 3,
        min: e.min,
        show: [k],
        reveal: 0.1
      });
      return;
    }
    if (e.type === 'pen') {
      add({
        type: 'pen',
        dur: PIN + 1.9 * TS,
        min: 120,
        show: [k],
        reveal: PIN + 0.75 * TS,
        pen: e
      });
      return;
    }
    if (e.type === 'yellow' || e.type === 'red' || e.type === 'note') {
      const last = beats[beats.length - 1];
      last.show.push(k);
      return;
    }
    if (e.seq == null) return;
    const q = match.seqs[e.seq];
    const n = q.chain.length;
    const tail = (q.kind === 'goal' ? 3.6 : q.kind === 'tackle' || q.kind === 'intercept' ? 1.2 : 1.8) * TS;
    add({
      type: 'seq',
      dur: IN + n * SEG + tail,
      min: q.min,
      et: !!q.et,
      q,
      show: [k],
      reveal: IN + n * SEG + (q.kind === 'goal' ? 0.7 : q.kind === 'tackle' || q.kind === 'intercept' ? 0.5 : 0.6) * TS
    });
    if (q.kind === 'goal') add({
      type: 'restart',
      dur: 2.4,
      min: q.min,
      et: !!q.et,
      show: [],
      reveal: 0.1
    });
  });
  return {
    beats,
    total: t
  };
}
function beatFrame(beat, L, prevEnd) {
  const toPitch = (team, p) => ({
    x: (team === 0 ? p.x : 1 - p.x) * PITCH.w,
    y: p.y * PITCH.h
  });
  const base = team => L[team].map(pl => toPitch(team, pl.base));
  const idx = (team, name) => L[team].findIndex(p => p.name === name);
  const raw = u => {
    if (beat.type !== 'seq' && beat.type !== 'pen') return {
      pos: [base(0), base(1)],
      ball: {
        x: PITCH.w / 2,
        y: PITCH.h / 2
      },
      holder: null
    };
    if (beat.type === 'pen') {
      const e = beat.pen;
      const T = e.team;
      const D = 1 - T;
      const pu = Math.max(0, u - PIN) / TS;
      const toPitch = (_team, p) => ({
        x: p.x * PITCH.w,
        y: p.y * PITCH.h
      });
      const pos = [0, 1].map(team => L[team].map((pl, i) => toPitch(T, {
        x: team === D && pl.role === 'GK' ? 0.985 : 0.5,
        y: 0.3 + 0.4 * (i + team * L[0].length) / Math.max(1, L[0].length + L[1].length - 1)
      })));
      const si = Math.max(0, idx(T, e.player));
      const ki = L[D].findIndex(p => p.role === 'GK');
      const spot = {
        x: 0.89,
        y: 0.5
      };
      pos[T][si] = toPitch(T, {
        x: lerp(0.84, 0.88, ease((pu - 0.3) / 0.2)),
        y: 0.5
      });
      const shotU = ease((pu - 0.5) / 0.35);
      const target = e.scored ? {
        x: 1.01,
        y: 0.5 + e.side * 0.05
      } : {
        x: 0.985,
        y: 0.5 + e.side * 0.04
      };
      const keeperY = e.scored ? 0.5 - e.side * 0.06 : 0.5 + e.side * 0.04;
      if (ki >= 0) pos[D][ki] = toPitch(T, {
        x: 0.985,
        y: lerp(0.5, keeperY, ease((pu - 0.5) / 0.3))
      });
      const ball = toPitch(T, lerpP(spot, target, shotU));
      return {
        pos,
        ball,
        holder: {
          team: T,
          i: si
        },
        banner: pu > 0.9 ? e.scored ? 'SCORED!' : 'SAVED!' : null
      };
    }
    const q = beat.q;
    const T = q.team;
    const D = 1 - T;
    const n = q.chain.length;
    const shot = q.kind === 'goal' || q.kind === 'save' || q.kind === 'miss' || q.kind === 'block';
    const gkAt = q.chain.map(nm => {
      const j = idx(T, nm);
      return j >= 0 && L[T][j].role === 'GK';
    });
    const key = k => ({
      x: gkAt[k] ? 0.13 : shot ? lerp(0.34, 0.8, n > 1 ? k / (n - 1) : 1) : lerp(0.28, 0.52, n > 1 ? k / (n - 1) : 1),
      y: gkAt[k] ? 0.5 : Math.min(0.88, Math.max(0.12, 0.5 + (hashU(q.min, q.i, k) - 0.5) * 0.62))
    });
    const carried = k => ({
      x: key(k).x + 0.03,
      y: key(k).y
    });
    const uu = u - IN;
    const PASS = 0.4;
    const ballAt = v => {
      if (v < 0) return {
        b: key(0),
        h: 0
      };
      if (v >= n * SEG) return {
        b: carried(n - 1),
        h: n - 1
      };
      const k = Math.min(n - 1, Math.floor(v / SEG));
      const r = (v - k * SEG) / SEG;
      if (k < n - 1 && r > PASS) return {
        b: lerpP(carried(k), key(k + 1), ease((r - PASS) / (1 - PASS))),
        h: -1
      };
      return {
        b: {
          x: key(k).x + 0.03 * ease(Math.min(1, r / PASS)),
          y: key(k).y
        },
        h: k
      };
    };
    const now = ballAt(uu);
    let ballA = now.b;
    const holderK = now.h;
    const shapeBall = [0, 0.2, 0.4, 0.6, 0.8, 1].map(lag => ballAt(uu - lag).b).reduce((acc, p, _i, arr) => ({
      x: acc.x + p.x / arr.length,
      y: acc.y + p.y / arr.length
    }), {
      x: 0,
      y: 0
    });
    const tail = uu - n * SEG;
    const tl = tail / TS;
    const push = (shapeBall.x - 0.45) * 0.55;
    const pos = [[], []];
    L[T].forEach((pl, i) => {
      let p = {
        x: pl.base.x + (pl.role === 'GK' ? 0 : push),
        y: lerp(pl.base.y, shapeBall.y, pl.role === 'GK' ? 0 : 0.18)
      };
      const ci = q.chain.indexOf(pl.name);
      if (ci >= 0) {
        const until = ci * SEG;
        const pre = ease(1 - Math.max(0, until - Math.max(0, uu)) / (SEG * 1.6));
        p = lerpP(p, key(ci), pre);
        if (ci < n - 1 && uu > (ci + 1) * SEG) p = lerpP(key(ci), {
          x: key(ci).x + 0.08,
          y: key(ci).y
        }, ease((uu - (ci + 1) * SEG) / SEG));
      }
      pos[T][i] = p;
    });
    const dA = {
      x: 1 - shapeBall.x,
      y: shapeBall.y
    };
    const drop = (dA.x - 0.45) * 0.5;
    L[D].forEach((pl, i) => {
      let p = pl.role === 'GK' ? {
        x: 0.035,
        y: lerp(0.5, dA.y, 0.3)
      } : {
        x: pl.base.x + drop,
        y: lerp(pl.base.y, dA.y, 0.3)
      };
      if (pl.role !== 'GK') {
        const dist = Math.hypot(p.x - dA.x, p.y - dA.y);
        const w = 0.65 * Math.min(1, Math.max(0, (0.3 - dist) / 0.18));
        p = lerpP(p, {
          x: dA.x - 0.05,
          y: dA.y + 0.03
        }, w);
      }
      pos[D][i] = p;
    });
    let holder = holderK >= 0 ? {
      team: T,
      i: idx(T, q.chain[holderK])
    } : null;
    let banner = null;
    let celebrate = null;
    const toD = p => ({
      x: 1 - p.x,
      y: p.y
    });
    const shooterA = carried(n - 1);
    const closer = q.kind === 'tackle' || q.kind === 'intercept' ? idx(D, q.tackler) : q.kind === 'block' ? idx(D, q.blocker) : -1;
    const meetA = q.kind === 'block' ? lerpP(shooterA, {
      x: 1,
      y: 0.5
    }, 0.35) : {
      x: shooterA.x + 0.02,
      y: shooterA.y
    };
    if (closer >= 0) {
      const s0 = Math.max(-IN * 0.5, (n - 1) * SEG - 0.4),
        s1 = n * SEG + (q.kind === 'block' ? 0.4 : 0.45) * TS;
      pos[D][closer] = lerpP(pos[D][closer], toD(meetA), ease((uu - s0) / (s1 - s0)));
    }
    if (tail >= 0) {
      const ki = L[D].findIndex(p => p.role === 'GK');
      if (q.kind === 'goal') {
        const goalPt = {
          x: 1.015,
          y: 0.5 + q.side * 0.055
        };
        ballA = lerpP(shooterA, goalPt, ease(tl / 0.7));
        if (ki >= 0) pos[D][ki] = lerpP(pos[D][ki], {
          x: 0.035,
          y: 0.5 + q.side * 0.12
        }, ease(tl / 0.6));
        holder = tl < 0.05 ? holder : null;
        if (tl > 0.7) {
          banner = 'GOAL!';
          const si = idx(T, q.shooter);
          celebrate = {
            team: T,
            i: si
          };
          const corner = {
            x: 0.9,
            y: 0.5 + q.side * 0.4
          };
          pos[T][si] = lerpP(pos[T][si], corner, ease((tl - 0.7) / 1.4));
          L[T].forEach((pl, i) => {
            if (i !== si && pl.role !== 'GK') pos[T][i] = lerpP(pos[T][i], {
              x: corner.x - 0.06 - 0.02 * i,
              y: corner.y - q.side * 0.05 * (i % 3)
            }, ease((tl - 1.1) / 1.6));
          });
        }
      } else if (q.kind === 'save') {
        const kp = {
          x: 0.965,
          y: 0.5 + q.side * 0.07
        };
        if (ki >= 0) pos[D][ki] = lerpP(pos[D][ki], toD(kp), ease(tl / 0.45));
        ballA = lerpP(shooterA, kp, ease(tl / 0.6));
        holder = tl > 0.6 && ki >= 0 ? {
          team: D,
          i: ki
        } : null;
        if (tl > 0.6) banner = 'SAVE!';
      } else if (q.kind === 'miss') {
        ballA = lerpP(shooterA, {
          x: 1.03,
          y: 0.5 + q.side * 0.2
        }, ease(tl / 0.8));
        holder = null;
        if (tl > 0.8) banner = 'WIDE!';
      } else if (q.kind === 'block') {
        const bp = meetA;
        ballA = lerpP(shooterA, bp, ease(tl / 0.5));
        holder = null;
        if (tl > 0.5) banner = 'BLOCKED!';
      } else {
        const ti = closer;
        const meet = meetA;
        ballA = tl < 0.5 ? lerpP(shooterA, meet, ease(tl / 0.5)) : lerpP(meet, {
          x: meet.x - 0.06,
          y: meet.y
        }, ease((tl - 0.5) / 0.5));
        holder = tl > 0.45 && ti >= 0 ? {
          team: D,
          i: ti
        } : holder;
        if (tl > 0.45) banner = q.kind === 'tackle' ? 'TACKLE!' : 'INTERCEPTED!';
      }
    }
    const out = {
      pos: [],
      ball: toPitch(T, ballA),
      holder,
      banner,
      celebrate
    };
    out.pos[T] = pos[T].map(p => toPitch(T, p));
    out.pos[D] = pos[D].map(p => toPitch(D, p));
    return out;
  };
  const glide = beat.type === 'seq' ? IN : beat.type === 'pen' ? PIN * 0.9 : Math.min(beat.dur * 0.8, GLIDE[beat.type] || 1.5);
  return u => {
    const out = raw(u);
    if (!prevEnd || u >= glide) return out;
    const k = ease(u / glide);
    return {
      ...out,
      pos: out.pos.map((team, ti) => team.map((p, i) => prevEnd.pos[ti] && prevEnd.pos[ti][i] ? lerpP(prevEnd.pos[ti][i], p, k) : p)),
      ball: lerpP(prevEnd.ball, out.ball, k)
    };
  };
}
function matchFrame(script, L, t) {
  const {
    beats
  } = script;
  let bi = beats.findIndex(b => t < b.t0 + b.dur);
  if (bi < 0) bi = beats.length - 1;
  const b = beats[bi];
  const prev = bi > 0 ? beatFrame(beats[bi - 1], L, null)(beats[bi - 1].dur) : null;
  const f = beatFrame(b, L, prev)(Math.min(b.dur, Math.max(0, t - b.t0)));
  const prevMin = bi > 0 ? beats[bi - 1].min : 0;
  const min = b.type === 'seq' ? Math.round(lerp(b.et ? Math.max(91, prevMin) : Math.min(prevMin, b.min), b.min, Math.min(1, (t - b.t0) / b.dur))) : b.min;
  return {
    ...f,
    beat: b,
    bi,
    min
  };
}
function revealedEvents(script, t) {
  const out = [];
  script.beats.forEach(b => b.show.forEach((k, j) => {
    if (t >= b.t0 + (j === 0 ? b.reveal * (b.type === 'seq' || b.type === 'pen' ? 1 : b.dur) : b.reveal)) out.push(k);
  }));
  return out.sort((a, b2) => a - b2);
}
function PitchMatch({
  d,
  A,
  B,
  match,
  speed,
  commentary,
  onDone,
  label
}) {
  const L = useMemo(() => [lineupOf(d, A), lineupOf(d, B)], [d.id, A.id, B.id]);
  const script = useMemo(() => matchScript(match), [match]);
  const base = speed === 'fast' ? 1.8 : 1;
  const [t, setT] = useState(speed === 'instant' ? script.total : 0);
  const [playing, setPlaying] = useState(speed !== 'instant');
  const [mult, setMult] = useState(1);
  const done = t >= script.total;
  const fired = useRef(false);
  const reduced = reducedMotion();
  useEffect(() => {
    if (!playing || done) return undefined;
    let raf;
    let last = performance.now();
    const tick = now => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setT(x => Math.min(script.total, x + dt * base * mult / Math.max(0.001, GAME_SPEED)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, done, mult, base]);
  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onDone && onDone();
    }
  }, [done]);
  const shown = revealedEvents(script, t);
  const lastShown = useRef(shown.length);
  useEffect(() => {
    if (shown.length > lastShown.current && playing) {
      shown.slice(lastShown.current).forEach(k => {
        const e = match.events[k];
        if (e.type === 'goal') {
          audio.play('cheer');
          audio.say(callLine('goal', {
            who: e.player
          }), 2, d.id + ':' + label + ':g' + k);
        } else if (e.type === 'half' || e.type === 'full') audio.play('whistle');else if (e.type === 'red') audio.play('buzzer');else if (e.type === 'pen') audio.play(e.scored ? 'bid' : 'buzzer');
      });
    }
    lastShown.current = shown.length;
  }, [shown.length]);
  const tq = reduced && !done ? Math.floor(t / 0.7) * 0.7 : t;
  const fr = matchFrame(script, L, tq);
  const goalsShown = shown.map(k => match.events[k]).filter(e => e.type === 'goal');
  const score = done ? match.score : [goalsShown.filter(e => e.team === 0).length, goalsShown.filter(e => e.team === 1).length];
  const penEv = shown.map(k => match.events[k]).filter(e => e.type === 'pen');
  const pens = done ? match.pens : penEv.length ? penEv[penEv.length - 1].pens : null;
  const keyTypes = ['goal', 'red', 'yellow', 'half', 'full', 'et', 'pens', 'pen', 'note', 'kickoff'];
  const feed = shown.map(k => match.events[k]).filter(e => commentary || keyTypes.includes(e.type));
  const feedRef = useRef(null);
  useEffect(() => {
    const f = feedRef.current;
    if (f) f.scrollTop = f.scrollHeight;
  }, [feed.length]);
  const colors = [A, B].map(m => ({
    fill: m.color,
    text: onColor(m.color)
  }));
  const stop = match.stoppage || 0;
  const clock = done ? match.pens ? 'FT · pens' : match.et ? 'AET' : 'FT' : fr.beat.type === 'half' ? 'HT' : fr.min > 90 && !fr.beat.et && fr.beat.type !== 'et' && fr.beat.type !== 'pens' && fr.beat.type !== 'pen' ? '90+' + Math.min(stop, fr.min - 90) + '′' : fr.beat.type === 'pen' || fr.beat.type === 'pens' ? 'PENS' : fr.min + '′' + (fr.beat.et ? ' ET' : '');
  const trA = isFootball(d.topic) ? teamRating(d, A).rating : null,
    trB = isFootball(d.topic) ? teamRating(d, B).rating : null;
  const bannerNow = fr.banner || (fr.beat.type === 'half' ? 'HALF-TIME' : fr.beat.type === 'et' ? 'EXTRA TIME' : fr.beat.type === 'pens' ? 'PENALTIES' : fr.beat.type === 'full' && !done ? 'FULL-TIME' : null);
  const short = n => {
    const w = n.split(' ');
    const s2 = w[w.length - 1];
    return s2.length > 10 ? s2.slice(0, 9) + '.' : s2;
  };
  return React.createElement("div", {
    className: "matchview"
  }, React.createElement("div", {
    className: "scoreboard"
  }, React.createElement("div", {
    className: "sb-team"
  }, React.createElement(Badge, {
    m: A
  }), React.createElement("span", {
    className: "sb-n"
  }, A.name), trA != null && React.createElement("span", {
    className: "sb-r num"
  }, trA)), React.createElement("div", {
    className: "sb-mid"
  }, React.createElement("span", {
    className: "sb-score num",
    "aria-live": "polite"
  }, score[0], "\u2013", score[1]), pens && React.createElement("span", {
    className: "sb-pens num"
  }, "pens ", pens[0], "\u2013", pens[1]), React.createElement("span", {
    className: "sb-clock num"
  }, clock)), React.createElement("div", {
    className: "sb-team"
  }, React.createElement(Badge, {
    m: B
  }), React.createElement("span", {
    className: "sb-n"
  }, B.name), trB != null && React.createElement("span", {
    className: "sb-r num"
  }, trB))), React.createElement("div", {
    className: "pitchwrap"
  }, React.createElement("svg", {
    className: "pitchsvg",
    viewBox: '-3 -3 ' + (PITCH.w + 6) + ' ' + (PITCH.h + 6),
    role: "img",
    "aria-label": 'Football pitch: ' + A.name + ' ' + score[0] + ', ' + B.name + ' ' + score[1] + ', ' + clock
  }, React.createElement("rect", {
    x: "-3",
    y: "-3",
    width: PITCH.w + 6,
    height: PITCH.h + 6,
    fill: "#1f7a3a"
  }), Array.from({
    length: 7
  }, (_, i) => React.createElement("rect", {
    key: i,
    x: i * 15,
    y: "0",
    width: "7.5",
    height: PITCH.h,
    fill: "#23843f"
  })), React.createElement("g", {
    fill: "none",
    stroke: "rgba(255,255,255,.75)",
    strokeWidth: "0.35"
  }, React.createElement("rect", {
    x: "0",
    y: "0",
    width: PITCH.w,
    height: PITCH.h
  }), React.createElement("line", {
    x1: PITCH.w / 2,
    y1: "0",
    x2: PITCH.w / 2,
    y2: PITCH.h
  }), React.createElement("circle", {
    cx: PITCH.w / 2,
    cy: PITCH.h / 2,
    r: "9.15"
  }), React.createElement("rect", {
    x: "0",
    y: PITCH.h / 2 - 20.16,
    width: "16.5",
    height: "40.32"
  }), React.createElement("rect", {
    x: PITCH.w - 16.5,
    y: PITCH.h / 2 - 20.16,
    width: "16.5",
    height: "40.32"
  }), React.createElement("rect", {
    x: "0",
    y: PITCH.h / 2 - 9.16,
    width: "5.5",
    height: "18.32"
  }), React.createElement("rect", {
    x: PITCH.w - 5.5,
    y: PITCH.h / 2 - 9.16,
    width: "5.5",
    height: "18.32"
  })), React.createElement("rect", {
    x: "-2.2",
    y: PITCH.h / 2 - 3.66,
    width: "2.2",
    height: "7.32",
    fill: "rgba(255,255,255,.85)"
  }), React.createElement("rect", {
    x: PITCH.w,
    y: PITCH.h / 2 - 3.66,
    width: "2.2",
    height: "7.32",
    fill: "rgba(255,255,255,.85)"
  }), [0, 1].map(team => L[team].map((pl, i) => {
    const p = fr.pos[team][i];
    if (!p) return null;
    const isHolder = fr.holder && fr.holder.team === team && fr.holder.i === i;
    const cel = fr.celebrate && fr.celebrate.team === team && fr.celebrate.i === i;
    return React.createElement("g", {
      key: team + '-' + i,
      transform: 'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ')'
    }, React.createElement("circle", {
      r: cel ? 2.6 : 2.1,
      fill: pl.role === 'GK' ? '#ffd23f' : colors[team].fill,
      stroke: isHolder || cel ? '#fff' : 'rgba(0,0,0,.55)',
      strokeWidth: isHolder || cel ? 0.6 : 0.35
    }), React.createElement("text", {
      y: "0.9",
      textAnchor: "middle",
      fontSize: "2.3",
      fontWeight: "800",
      fill: pl.role === 'GK' ? '#1b1530' : colors[team].text
    }, pl.num), React.createElement("text", {
      className: 'plabel' + (isHolder || cel ? ' on' : ''),
      y: "-2.8",
      textAnchor: "middle",
      fontSize: "2.4",
      fontWeight: "700",
      fill: "#fff"
    }, short(pl.name)));
  })), React.createElement("circle", {
    cx: fr.ball.x,
    cy: fr.ball.y,
    r: "1",
    fill: "#fff",
    stroke: "#111",
    strokeWidth: "0.25"
  }), bannerNow && !done && React.createElement("text", {
    x: PITCH.w / 2,
    y: PITCH.h / 2 + 3,
    textAnchor: "middle",
    fontSize: bannerNow === 'GOAL!' ? 11 : 7,
    fontWeight: "900",
    fill: bannerNow === 'GOAL!' ? '#ffc83d' : '#fff',
    stroke: "#0f0c21",
    strokeWidth: "0.6",
    paintOrder: "stroke",
    className: "pbanner"
  }, bannerNow))), React.createElement("div", {
    className: "mctrl",
    role: "group",
    "aria-label": "Match controls"
  }, !done && React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setPlaying(x => !x),
    "aria-label": playing ? 'Pause' : 'Play'
  }, playing ? '⏸ Pause' : '▶ Play'), !done && [1, 2, 4].map(x => React.createElement("button", {
    key: x,
    className: 'btn btn-sm' + (mult === x ? ' btn-gold' : ''),
    "aria-pressed": mult === x,
    onClick: () => setMult(x)
  }, x, "\xD7")), !done && React.createElement("button", {
    className: "btn btn-sm btn-ghost",
    onClick: () => setT(script.total)
  }, "Skip to result"), done && React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => {
      fired.current = true;
      lastShown.current = 0;
      setT(0);
      setPlaying(true);
    }
  }, "\u21BA Watch again")), React.createElement("div", {
    className: "mfeed",
    ref: feedRef,
    "aria-live": "polite"
  }, feed.map((e, k) => React.createElement("p", {
    key: k,
    className: 'mev ' + e.type + (e.team != null ? ' t' + e.team : '')
  }, React.createElement("span", {
    className: "mm num"
  }, e.type === 'pen' || e.type === 'pens' ? 'PEN' : e.type === 'note' ? 'i' : e.min + '′'), React.createElement("span", null, e.type === 'goal' ? '⚽ ' : e.type === 'yellow' ? '🟨 ' : e.type === 'red' ? '🟥 ' : e.type === 'pen' ? e.scored ? '✅ ' : '❌ ' : e.type === 'tackle' ? '🛡️ ' : e.type === 'chance' ? '🧤 ' : '', e.text, e.team != null && e.type !== 'pen' ? React.createElement("small", null, " \xB7 ", (e.team === 0 ? A : B).name) : null)))), done && React.createElement(MatchSummary, {
    d: d,
    A: A,
    B: B,
    match: match
  }));
}
function MatchView(props) {
  return props.match && props.match.v === 2 ? React.createElement(PitchMatch, props) : React.createElement(MatchPlayer, props);
}
const FB_CONFIG = {
  apiKey: 'AIzaSyCjw0jMkbljpMKol013HCe_l_h8nzNLtCY',
  authDomain: 'draft-night-125a6.firebaseapp.com',
  databaseURL: 'https://draft-night-125a6-default-rtdb.firebaseio.com',
  projectId: 'draft-night-125a6',
  storageBucket: 'draft-night-125a6.firebasestorage.app',
  messagingSenderId: '483436244846',
  appId: '1:483436244846:web:ef3f78656ffa791ed79b7f'
};
const FB_VER = '10.14.1';
const ROOM_ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ONLINE = {
  maxTeams: 8,
  maxTeamSize: 4,
  maxPeople: 16,
  coverAfter: 60000,
  hostGrace: 8000,
  clocks: [6, 10, 15, 20],
  clock: 10
};
const LAST_ROOM = 'dn_last_room';
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error('load ' + src));
    document.head.appendChild(s);
  });
}
let fbReady = null;
function loadFirebase() {
  if (window.__DN_FAKE_FB) return Promise.resolve(window.__DN_FAKE_FB);
  if (fbReady) return fbReady;
  fbReady = ['app', 'auth', 'database'].reduce((p, n) => p.then(() => window.firebase && n === 'app' ? null : loadScript('vendor/firebase-' + n + '-compat.js?v=' + FB_VER)), Promise.resolve()).then(() => {
    const fb = window.firebase;
    if (!fb.apps.length) fb.initializeApp(FB_CONFIG);
    return fb;
  });
  fbReady.catch(() => {
    fbReady = null;
  });
  return fbReady;
}
function signIn(fb) {
  const a = fb.auth();
  return new Promise((resolve, reject) => {
    const off = a.onAuthStateChanged(u => {
      off();
      if (u) resolve(u.uid);else a.signInAnonymously().then(c => resolve(c.user.uid), reject);
    }, reject);
  });
}
const roomCode = () => Array.from({
  length: 5
}, () => ROOM_ALPHA[Math.floor(Math.random() * ROOM_ALPHA.length)]).join('');
const cleanCode = s => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
const netError = e => {
  const m = String(e && (e.code || e.message) || e || '');
  if (/permission|PERMISSION_DENIED/i.test(m)) return 'The online server refused that. If you just set up Firebase, check the security rules were published.';
  if (/operation-not-allowed|admin-restricted/i.test(m)) return 'Anonymous sign-in isn’t switched on in Firebase (Authentication → Sign-in method → Anonymous).';
  if (/unauthorized-domain/i.test(m)) return 'This website isn’t on Firebase’s authorised domains list (Authentication → Settings).';
  if (/network|offline|load /i.test(m)) return 'Couldn’t reach the online server. Check your internet connection and try again.';
  return 'Something went wrong going online (' + m.slice(0, 80) + ').';
};
function saveLastRoom(v) {
  try {
    if (v) localStorage.setItem(LAST_ROOM, JSON.stringify(v));else localStorage.removeItem(LAST_ROOM);
  } catch (e) {}
}
function lastRoom() {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_ROOM) || 'null');
    return v && Date.now() - v.at < 12 * 3600e3 ? v : null;
  } catch (e) {
    return null;
  }
}
function ownerInfo(d, uid) {
  const teams = new Set(),
    parts = new Set();
  if (!d || !uid) return {
    teams,
    parts
  };
  d.managers.forEach(m => {
    if (m.members) m.members.forEach(p => {
      if (p.uid === uid) {
        teams.add(m.id);
        parts.add(p.id);
      }
    });else if (m.uid === uid) {
      teams.add(m.id);
      parts.add(m.id);
    }
  });
  return {
    teams,
    parts
  };
}
function humanSeats(d) {
  const out = [];
  d.managers.forEach(m => {
    if (m.members) m.members.forEach(p => {
      if (p.uid) out.push({
        uid: p.uid,
        teamId: m.id,
        partId: p.id,
        name: p.name,
        covered: !!p.cover
      });
    });else if (m.uid) out.push({
      uid: m.uid,
      teamId: m.id,
      partId: m.id,
      name: m.name,
      covered: !!m.cover
    });
  });
  return out;
}
const COVER_BOT = {
  type: 'needs',
  level: 'medium'
};
function setCover(d, uid, on) {
  let changed = false;
  const fix = x => {
    if (x.uid !== uid || !!x.cover === on) return x;
    changed = true;
    if (on) return {
      ...x,
      bot: {
        ...COVER_BOT
      },
      cover: true
    };
    const {
      bot,
      cover,
      ...rest
    } = x;
    return rest;
  };
  const managers = d.managers.map(m => m.members ? {
    ...m,
    members: m.members.map(fix)
  } : fix(m));
  return changed ? {
    ...d,
    managers
  } : d;
}
function claimSeat(d, oldUid, newUid) {
  const fix = x => x.uid === oldUid ? (() => {
    const {
      bot,
      cover,
      ...rest
    } = x;
    return x.cover ? {
      ...rest,
      uid: newUid
    } : {
      ...x,
      uid: newUid
    };
  })() : x;
  return {
    ...d,
    managers: d.managers.map(m => m.members ? {
      ...m,
      members: m.members.map(fix)
    } : fix(m))
  };
}
function castVote(d, pid, target) {
  if (d.votesRevealed || hasVoted(d, pid)) return d;
  const p = participants(d).find(x => x.id === pid);
  if (!p) return d;
  const choices = voteChoices(d, p.teamId).map(m => m.id);
  if (target == null ? choices.length : !choices.includes(target)) return d;
  return {
    ...d,
    votes: {
      ...(d.votes || {}),
      [pid]: target == null ? null : target
    }
  };
}
function fillBotVotes(d) {
  const votes = {
    ...(d.votes || {})
  };
  participants(d).filter(p => p.bot && !Object.prototype.hasOwnProperty.call(votes, p.id)).forEach(p => {
    votes[p.id] = botVote(d, {
      ...teamOf(d, p.teamId),
      name: p.name,
      bot: p.bot,
      speaker: p.id,
      teamId: p.teamId
    });
  });
  return {
    ...d,
    votes
  };
}
const owns = (who, teamId) => !who || who.teams.has(teamId);
const ownsPart = (who, pid) => !who || who.parts.has(pid);
const findTrade = (d, id) => d.trade ? d.trade.proposals.find(t => t.id === id) : null;
const NET_ACTIONS = {
  bid: (d, [mid, amt, dbl], who) => d.phase === 'auction' && owns(who, mid) && typeof amt === 'number' ? placeBid(d, mid, amt, dbl ? {
    double: true
  } : undefined) : d,
  withdraw: (d, [mid], who) => owns(who, mid) ? withdraw(d, mid) : d,
  card: (d, [by, card, params], who) => d.phase === 'auction' && owns(who, by) && CARD_INFO[card] ? playCard(d, by, card, params || {}) : d,
  veto: (d, [yes, pid], who) => d.pending && d.pending.id === pid && owns(who, d.pending.target) ? answerCard(d, !!yes) : d,
  forcePick: (d, [id], who) => d.phase === 'forcepick' && d.sk && d.sk.offer && owns(who, d.sk.offer.mid) ? chooseForced(d, id) : d,
  nominate: (d, [id], who) => {
    const c = d.phase === 'nominate' && currentNominator(d);
    return c && owns(who, c.m.id) ? nominate(d, id) : d;
  },
  freePick: (d, [id], who) => {
    const c = d.phase === 'freepick' && currentPicker(d);
    return c && owns(who, c.m.id) && d.leftover.includes(id) && canTake(d, c.m, id) ? freePick(d, id) : d;
  },
  propose: (d, [t], who) => d.phase === 'trade' && t && owns(who, t.from) ? proposeTrade(d, t, Date.now()) : d,
  accept: (d, [id], who) => {
    const t = findTrade(d, id);
    return t && t.status === 'pending' && owns(who, t.to) ? acceptTrade(d, id) : d;
  },
  reject: (d, [id], who) => {
    const t = findTrade(d, id);
    return t && t.status === 'pending' && owns(who, t.to) ? rejectTrade(d, id) : d;
  },
  cancel: (d, [id], who) => {
    const t = findTrade(d, id);
    return t && t.status === 'pending' && owns(who, t.from) ? cancelTrade(d, id) : d;
  },
  vote: (d, [pid, target], who) => d.phase === 'done' && ownsPart(who, pid) ? castVote(d, pid, target) : d,
  matchVote: (d, [r, i, pid, team], who) => d.finale && d.finale.bracket && ownsPart(who, pid) && d.finale.bracket.rounds[r] && d.finale.bracket.rounds[r][i] ? castMatchVote(d, r, i, pid, team) : d
};
function runAction(d, name, args, who) {
  const fn = NET_ACTIONS[name];
  if (!fn || !d || !Array.isArray(args)) return d;
  try {
    return fn(d, args, who) || d;
  } catch (e) {
    return d;
  }
}
function onlineTopic(t) {
  return {
    ...t,
    items: t.items.map(it => {
      const {
        photo,
        imageData,
        ...rest
      } = it;
      return rest;
    })
  };
}
const NO_SYNC = new Set(['history']);
class Room {
  constructor(fb, uid, code) {
    this.fb = fb;
    this.db = fb.database();
    this.uid = uid;
    this.code = code;
    this.base = 'rooms/' + code + '/';
    this.meta = null;
    this.players = {};
    this.presence = {};
    this.lobby = null;
    this.live = {};
    this.state = null;
    this.connected = true;
    this.kind = 'player';
    this.subs = new Set();
    this.offs = [];
    this.sent = {};
    this.liveSent = {};
    this.stateCache = {};
    this.liveCache = {};
    this.awaySince = {};
    this.closed = false;
    this.onAction = null;
    this.seen = new Set();
  }
  ref(p) {
    return this.db.ref(this.base + (p || ''));
  }
  get amHost() {
    return !this.viewerOnly && !!(this.meta && this.meta.host === this.uid);
  }
  emit() {
    this.subs.forEach(f => {
      try {
        f(this);
      } catch (e) {}
    });
  }
  subscribe(f) {
    this.subs.add(f);
    return () => this.subs.delete(f);
  }
  listen(path, ev, fn) {
    const r = typeof path === 'string' ? this.ref(path) : path;
    r.on(ev, fn);
    this.offs.push(() => r.off(ev, fn));
  }
  static async connect() {
    const fb = await loadFirebase();
    const uid = await signIn(fb);
    return {
      fb,
      uid
    };
  }
  static async create(profile) {
    const {
      fb,
      uid
    } = await Room.connect();
    const db = fb.database();
    let code = null;
    for (let i = 0; i < 6 && !code; i++) {
      const c = roomCode();
      const snap = await db.ref('rooms/' + c + '/meta').once('value');
      if (!snap.exists()) code = c;
    }
    if (!code) throw new Error('Couldn’t find a free room code. Try again.');
    const room = new Room(fb, uid, code);
    await room.ref('meta').set({
      host: uid,
      createdAt: fb.database.ServerValue.TIMESTAMP,
      status: 'lobby',
      v: 1
    });
    await room.ref('players/' + uid).set({
      name: profile.name,
      emoji: profile.emoji,
      color: profile.color,
      kind: 'player',
      team: 0,
      joinedAt: fb.database.ServerValue.TIMESTAMP
    });
    await room.start();
    return room;
  }
  static async join(code, profile, kind) {
    const {
      fb,
      uid
    } = await Room.connect();
    const room = new Room(fb, uid, code);
    const meta = (await room.ref('meta').once('value')).val();
    if (!meta) throw new Error('No room with code ' + code + '. Check the code with the host.');
    if (meta.status === 'closed') throw new Error('That room has ended.');
    const players = (await room.ref('players').once('value')).val() || {};
    const me = players[uid];
    room.kind = kind === 'tv' ? 'tv' : 'player';
    if (room.kind === 'tv' && me && me.kind !== 'tv') {
      room.viewerOnly = true;
      await room.start();
      return room;
    }
    if (!me && room.kind === 'player') {
      const people = Object.values(players).filter(p => p.kind !== 'tv').length;
      if (people >= ONLINE.maxPeople) throw new Error('That room is full (' + ONLINE.maxPeople + ' players).');
    }
    if (!me || me.kind !== room.kind || profile && (me.name !== profile.name || me.emoji !== profile.emoji)) {
      await room.ref('players/' + uid).update({
        ...(me ? {} : {
          joinedAt: fb.database.ServerValue.TIMESTAMP,
          team: 0
        }),
        kind: room.kind,
        ...(room.kind === 'tv' ? {
          name: 'TV',
          emoji: '📺',
          color: '#ffffff'
        } : {
          name: profile.name,
          emoji: profile.emoji,
          color: profile.color
        })
      });
    }
    await room.start();
    return room;
  }
  async start() {
    if (!this.viewerOnly) saveLastRoom({
      code: this.code,
      at: Date.now(),
      kind: this.kind
    });
    const me = this.ref('presence/' + this.uid);
    this.listen(this.db.ref('.info/connected'), 'value', s => {
      this.connected = s.val() !== false;
      if (s.val() === true && !this.viewerOnly) {
        me.onDisconnect().remove();
        me.set(true);
      }
      this.emit();
    });
    const json = s => {
      try {
        return JSON.parse(s);
      } catch (e) {
        return null;
      }
    };
    this.listen('meta', 'value', s => {
      this.meta = s.val();
      if (!this.meta && !this.closed) {
        this.meta = {
          status: 'closed'
        };
      }
      this.emit();
      this.checkHost();
    });
    this.listen('players', 'value', s => {
      this.players = s.val() || {};
      this.emit();
      this.checkHost();
    });
    this.listen('presence', 'value', s => {
      this.presence = s.val() || {};
      this.emit();
      this.checkHost();
    });
    this.listen('lobby', 'value', s => {
      this.lobby = s.val() ? json(s.val()) : null;
      this.emit();
    });
    this.listen('state', 'value', s => {
      const v = s.val();
      if (!v) {
        this.state = null;
        this.stateCache = {};
        this.emit();
        return;
      }
      const d = {};
      const cache = {};
      Object.keys(v).forEach(k => {
        cache[k] = {
          raw: v[k],
          val: this.stateCache[k] && this.stateCache[k].raw === v[k] ? this.stateCache[k].val : json(v[k])
        };
        d[k] = cache[k].val;
      });
      this.stateCache = cache;
      this.state = d;
      this.emit();
    });
    this.listen('live', 'value', s => {
      const v = s.val() || {};
      const o = {};
      Object.keys(v).forEach(k => {
        o[k] = this.liveCache[k] && this.liveCache[k].raw === v[k] ? this.liveCache[k].val : json(v[k]);
        this.liveCache[k] = {
          raw: v[k],
          val: o[k]
        };
      });
      this.live = o;
      this.emit();
    });
    this.listen('actions', 'child_added', s => this.handleAction(s.key, s.val()));
  }
  handleAction(key, a) {
    if (!this.amHost || !this.onAction || this.seen.has(key)) return;
    this.seen.add(key);
    let body = null;
    try {
      body = JSON.parse((a || {}).json);
    } catch (e) {}
    const done = () => this.ref('actions/' + key).remove().catch(() => {});
    if (!body || typeof body.name !== 'string' || !a.by) {
      done();
      return;
    }
    this.onAction({
      id: key,
      by: a.by,
      name: body.name,
      args: Array.isArray(body.args) ? body.args : []
    }, done);
  }
  async drainActions() {
    const v = (await this.ref('actions').once('value')).val() || {};
    Object.keys(v).forEach(k => this.handleAction(k, v[k]));
  }
  online(uid) {
    return !!this.presence[uid];
  }
  people() {
    return Object.entries(this.players).map(([uid, p]) => ({
      uid,
      ...p,
      online: this.online(uid)
    })).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
  }
  checkHost() {
    if (!this.meta || this.meta.status === 'closed' || this.kind === 'tv' || this.viewerOnly || !this.players[this.uid]) return;
    const host = this.meta.host;
    if (host === this.uid || this.online(host)) {
      clearTimeout(this.hostTimer);
      this.hostTimer = null;
      return;
    }
    if (this.hostTimer) return;
    this.hostTimer = setTimeout(() => {
      this.hostTimer = null;
      const cur = this.meta && this.meta.host;
      if (!cur || cur === this.uid || this.online(cur)) return;
      const next = this.people().find(p => p.online && p.kind !== 'tv');
      if (!next || next.uid !== this.uid) return;
      this.ref('meta/host').transaction(h => h === cur ? this.uid : h).then(() => this.emit()).catch(() => {});
    }, ms(ONLINE.hostGrace));
  }
  send(name, args) {
    if (this.amHost && this.onAction) {
      this.onAction({
        id: 'local',
        by: this.uid,
        name,
        args
      }, () => {});
      return;
    }
    this.ref('actions').push({
      by: this.uid,
      json: JSON.stringify({
        name,
        args
      }),
      at: this.fb.database.ServerValue.TIMESTAMP
    }).catch(() => {});
  }
  publish(d) {
    if (!this.amHost) return;
    const out = {};
    let n = 0;
    const keys = new Set([...Object.keys(d || {}), ...Object.keys(this.sent)]);
    keys.forEach(k => {
      if (NO_SYNC.has(k)) return;
      const v = d && d[k] !== undefined ? JSON.stringify(d[k]) : null;
      if (this.sent[k] === v || v === null && this.sent[k] === undefined) return;
      out[k] = v;
      n++;
      if (v === null) delete this.sent[k];else this.sent[k] = v;
    });
    if (n) this.ref('state').update(out).catch(() => {});
  }
  adoptState() {
    this.sent = {};
    Object.keys(this.stateCache).forEach(k => {
      this.sent[k] = this.stateCache[k].raw;
    });
  }
  publishLive(o) {
    if (!this.amHost) return;
    const out = {};
    let n = 0;
    Object.keys(o).forEach(k => {
      const v = o[k] === undefined ? null : JSON.stringify(o[k]);
      if (this.liveSent[k] !== v) {
        out[k] = v;
        this.liveSent[k] = v;
        n++;
      }
    });
    if (n) this.ref('live').update(out).catch(() => {});
  }
  setLobby(l) {
    if (this.amHost) return this.ref('lobby').set(JSON.stringify(l)).catch(() => {});
    return null;
  }
  setMe(patch) {
    return this.ref('players/' + this.uid).update(patch).catch(() => {});
  }
  setPlayer(uid, patch) {
    if (this.amHost) return (patch ? this.ref('players/' + uid).update(patch) : this.ref('players/' + uid).remove()).catch(() => {});
    return null;
  }
  setStatus(status) {
    if (this.amHost) return this.ref('meta/status').set(status).catch(() => {});
    return null;
  }
  async resetGame() {
    if (!this.amHost) return;
    this.sent = {};
    this.liveSent = {};
    await this.ref('state').remove().catch(() => {});
    await this.ref('live').remove().catch(() => {});
    await this.ref('actions').remove().catch(() => {});
  }
  leave(forget) {
    if (this.closed) return;
    this.closed = true;
    clearTimeout(this.hostTimer);
    this.offs.forEach(f => {
      try {
        f();
      } catch (e) {}
    });
    this.offs = [];
    if (this.viewerOnly) return;
    this.ref('presence/' + this.uid).remove().catch(() => {});
    if (forget) {
      saveLastRoom(null);
      if (!this.state) this.ref('players/' + this.uid).remove().catch(() => {});
    }
  }
  async close() {
    if (!this.amHost) return;
    await this.ref('meta/status').set('closed').catch(() => {});
    this.leave(true);
    setTimeout(() => this.db.ref('rooms/' + this.code).remove().catch(() => {}), 1500);
  }
}
const NetCtx = React.createContext(null);
const useNet = () => React.useContext(NetCtx);
function netView(d, net) {
  const online = !!(d && d.mode === 'online' && net && !net.local);
  const passive = !!(net && net.passive);
  const isHost = !passive && (!online || net.role === 'host');
  const who = online ? net.who : null;
  const tv = !!(net && (net.display === 'tv' || net.role === 'tv'));
  return {
    online,
    isHost,
    who,
    tv,
    live: online || passive ? net.live || {} : {},
    runsBots: !!d && (d.mode === 'solo' || online) && isHost,
    controls: teamId => tv ? false : !online ? d.mode === 'solo' ? !!(teamOf(d, teamId) || {}).human : true : !!who && who.teams.has(teamId),
    controlsPart: pid => tv ? false : !online ? true : !!who && who.parts.has(pid)
  };
}
function useAct(d, setDraft) {
  const net = useNet();
  return (name, ...args) => {
    if (d && d.mode === 'online' && net) {
      net.send(name, args);
      return;
    }
    setDraft(p => runAction(p, name, args, null));
  };
}
const TEAM_EMOJI = ['🔴', '🔵', '🟢', '🟣'];
const defaultProfile = () => ({
  name: '',
  emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
  color: COLORS[Math.floor(Math.random() * COLORS.length)]
});
function OnlineHome({
  profile,
  setProfile,
  last,
  initialCode,
  onCreate,
  onJoin,
  onTv,
  onRejoin,
  onBack
}) {
  const [code, setCode] = useState(cleanCode(initialCode || ''));
  const name = (profile.name || '').trim();
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onBack,
    title: "Online"
  }), React.createElement("h2", {
    className: "display"
  }, "Play on your own phones"), typeof navigator !== 'undefined' && navigator.onLine === false && React.createElement("p", {
    className: "warn"
  }, "This device is offline. Online rooms need an internet connection; Solo and Local work offline."), React.createElement("p", {
    className: "muted",
    style: {
      margin: 0
    }
  }, "The host makes a room, friends join with the code, and everyone bids from their own phone. A laptop or TV can show the big screen."), last && React.createElement("div", {
    className: "card row"
  }, React.createElement("span", {
    style: {
      fontSize: 26
    }
  }, "\uD83D\uDD01"), React.createElement("div", {
    className: "grow"
  }, React.createElement("b", null, "Rejoin room ", last.code), React.createElement("span", {
    className: "small muted",
    style: {
      display: 'block'
    }
  }, "Pick up where you left off.")), React.createElement("button", {
    className: "btn btn-sm btn-gold",
    onClick: () => onRejoin(last)
  }, "Rejoin")), React.createElement("div", {
    className: "card stack"
  }, React.createElement("span", {
    className: "label"
  }, "You"), React.createElement("div", {
    className: "row",
    style: {
      gap: 10
    }
  }, React.createElement("button", {
    className: "emo",
    "aria-label": "Change emoji",
    onClick: () => setProfile({
      ...profile,
      emoji: EMOJIS[(EMOJIS.indexOf(profile.emoji) + 1) % EMOJIS.length]
    })
  }, profile.emoji), React.createElement("input", {
    id: "on-name",
    className: "input grow",
    maxLength: 16,
    value: profile.name,
    placeholder: "Your name",
    onChange: e => setProfile({
      ...profile,
      name: e.target.value
    })
  })), React.createElement("div", {
    className: "chips",
    role: "group",
    "aria-label": "Your colour"
  }, COLORS.slice(0, 8).map(c => React.createElement("button", {
    key: c,
    className: 'swatch' + (profile.color === c ? ' on' : ''),
    style: {
      background: c
    },
    "aria-label": 'Colour ' + c,
    onClick: () => setProfile({
      ...profile,
      color: c
    })
  }))), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Use the same name each time so your wins add up in Players & stats.")), React.createElement("button", {
    className: "btn btn-gold",
    disabled: !name,
    onClick: onCreate
  }, "Create a room"), React.createElement("div", {
    className: "card stack"
  }, React.createElement("label", {
    className: "label",
    htmlFor: "on-code"
  }, "Join with a code"), React.createElement("div", {
    className: "row"
  }, React.createElement("input", {
    id: "on-code",
    className: "input grow codeinput",
    value: code,
    maxLength: 5,
    autoCapitalize: "characters",
    autoCorrect: "off",
    spellCheck: "false",
    placeholder: "ABCDE",
    onChange: e => setCode(cleanCode(e.target.value))
  }), React.createElement("button", {
    className: "btn btn-sm btn-gold",
    disabled: code.length !== 5 || !name,
    onClick: () => onJoin(code)
  }, "Join")), React.createElement("button", {
    className: "btn btn-ghost btn-sm",
    disabled: code.length !== 5,
    onClick: () => onTv(code)
  }, "\uD83D\uDCFA Use this screen as the TV"), !name && React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Type your name first.")), React.createElement("p", {
    className: "hint"
  }, "Anyone with the room code can join, so only share it with your group."));
}
function seatsFromLobby(room, cfg) {
  const people = room.people().filter(p => p.kind !== 'tv' && p.online);
  const seatId = uid => 'p-' + uid.slice(0, 12);
  if (!cfg.teamMode) {
    const used = new Set();
    const humans = people.map(p => {
      let color = p.color;
      if (used.has(color)) color = COLORS.find(c => !used.has(c)) || color;
      used.add(color);
      return {
        id: seatId(p.uid),
        uid: p.uid,
        name: (p.name || 'Player').trim(),
        emoji: p.emoji,
        color
      };
    });
    const bots = makeBots(cfg.bots, cfg.level, cfg.botSeed, [...used]);
    return [...humans, ...bots];
  }
  const teams = [];
  const fill = makeBots(cfg.teamCount * ONLINE.maxTeamSize, cfg.level, cfg.botSeed, []);
  let b = 0;
  for (let t = 0; t < cfg.teamCount; t++) {
    const members = people.filter(p => (p.team || 0) % cfg.teamCount === t).slice(0, ONLINE.maxTeamSize).map(p => ({
      id: seatId(p.uid),
      uid: p.uid,
      name: (p.name || 'Player').trim(),
      emoji: p.emoji
    }));
    if (cfg.fillBots) while (members.length < cfg.teamSize) {
      const x = fill[b++];
      members.push({
        id: x.id,
        name: x.name,
        emoji: x.emoji,
        bot: x.bot
      });
    }
    if (members.length) teams.push({
      id: 'team-' + t,
      name: cfg.teamNames && cfg.teamNames[t] || TEAM_NAMES[t],
      color: COLORS[t],
      emoji: TEAM_EMOJI[t],
      members
    });
  }
  return teams;
}
function lobbyProblems(room, cfg) {
  const seats = seatsFromLobby(room, cfg);
  const out = [];
  if (!cfg.topic) out.push('Pick a topic.');
  if (seats.length < 2) out.push(cfg.teamMode ? 'You need at least two teams with someone in them.' : 'You need at least two players (add a bot to play against).');
  if (!cfg.teamMode && seats.length > ONLINE.maxTeams) out.push('Too many players: the most is ' + ONLINE.maxTeams + ' (people + bots). Remove some bots or switch to teams.');
  if (cfg.teamMode) cfg.teamCount && Array.from({
    length: cfg.teamCount
  }, (_, t) => t).forEach(t => {
    const n = room.people().filter(p => p.kind !== 'tv' && p.online && (p.team || 0) % cfg.teamCount === t).length;
    if (n > ONLINE.maxTeamSize) out.push((cfg.teamNames[t] || 'A team') + ' has more than ' + ONLINE.maxTeamSize + ' people.');
  });
  return out;
}
function initialLobby(topic, rules) {
  return {
    teamMode: false,
    teamCount: 2,
    teamSize: 2,
    fillBots: true,
    teamNames: TEAM_NAMES.slice(0, 4),
    bots: 0,
    level: 'medium',
    botSeed: uid(),
    talk: true,
    clock: ONLINE.clock,
    coverAfter: 60,
    topic: topic ? packTopic(onlineTopic(topic), false) : null,
    topicName: topic ? topic.name : '',
    topicEmoji: topic ? topic.emoji : '',
    rules: topic ? {
      ...rules,
      slots: [...topic.slots]
    } : rules
  };
}
function RoomCode({
  code,
  big
}) {
  const link = location.origin + location.pathname + '#room=' + code;
  const [msg, setMsg] = useState('');
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Draft Night',
          text: 'Join my Draft Night room: ' + code,
          url: link
        });
        return;
      }
    } catch (e) {
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setMsg('Link copied.');
    } catch (e) {
      setMsg(link);
    }
  };
  return React.createElement("div", {
    className: 'roomcode' + (big ? ' big' : '')
  }, React.createElement("span", {
    className: "eyebrow"
  }, "Room code"), React.createElement("b", {
    className: "num",
    "aria-label": 'Room code ' + code.split('').join(' ')
  }, code), big ? React.createElement("span", {
    className: "small"
  }, "Open ", location.host, location.pathname.replace(/index\.html$/, ''), " \u2192 Online \u2192 enter the code") : React.createElement("button", {
    className: "btn btn-sm",
    onClick: share
  }, "Share invite link"), msg && React.createElement("span", {
    className: "small muted",
    style: {
      overflowWrap: 'anywhere'
    }
  }, msg));
}
function PlayerRow({
  p,
  me,
  host,
  isHost,
  teamMode,
  cfg,
  room
}) {
  return React.createElement("div", {
    className: 'prow-on' + (p.online ? '' : ' away'),
    style: mStyle({
      color: p.color || '#888'
    })
  }, React.createElement("span", {
    className: "dot",
    "aria-label": p.online ? 'online' : 'away'
  }), React.createElement("span", {
    className: "grow"
  }, React.createElement("b", null, p.emoji, " ", p.name), p.uid === host ? React.createElement("small", null, " \xB7 host") : null, p.uid === me ? React.createElement("small", null, " \xB7 you") : null, !p.online ? React.createElement("small", null, " \xB7 away") : null), teamMode && (isHost || p.uid === me) && p.kind !== 'tv' && React.createElement("select", {
    "aria-label": 'Team for ' + p.name,
    className: "input mini-select",
    value: (p.team || 0) % cfg.teamCount,
    onChange: e => p.uid === me ? room.setMe({
      team: +e.target.value
    }) : room.setPlayer(p.uid, {
      team: +e.target.value
    })
  }, Array.from({
    length: cfg.teamCount
  }, (_, t) => React.createElement("option", {
    key: t,
    value: t
  }, TEAM_EMOJI[t], " ", cfg.teamNames[t]))), teamMode && !(isHost || p.uid === me) && React.createElement("span", {
    className: "small"
  }, TEAM_EMOJI[(p.team || 0) % cfg.teamCount]), isHost && p.uid !== me && React.createElement("button", {
    className: "mini",
    "aria-label": 'Remove ' + p.name,
    onClick: () => room.setPlayer(p.uid, null)
  }, "\u2715"));
}
function Lobby({
  room,
  topics,
  rulePrefs,
  onLeave: leaveNow,
  onStart,
  tv: tvProp,
  topicPrefs,
  setTopicPrefs
}) {
  const isHost = room.amHost;
  const [tvView, setTvView] = useState(false);
  const tv = tvProp || tvView;
  const [askLeave, setAskLeave] = useState(false);
  const onLeave = () => isHost ? setAskLeave(true) : leaveNow();
  const leaveSheet = askLeave && React.createElement(Confirm, {
    title: "Close the room?",
    body: "Everyone in the lobby is sent back. You can make a new room any time.",
    yes: "Close room",
    danger: true,
    onYes: leaveNow,
    onClose: () => setAskLeave(false)
  });
  const cfg = room.lobby;
  const [view, setView] = useState('lobby');
  const [folder, setFolder] = useState(null);
  const set = patch => room.setLobby({
    ...cfg,
    ...patch
  });
  const people = room.people();
  const players = people.filter(p => p.kind !== 'tv');
  const tvs = people.filter(p => p.kind === 'tv' && p.online);
  if (!cfg) return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onLeave,
    title: "Lobby"
  }), React.createElement("p", {
    className: "muted"
  }, "Setting up the room\u2026"));
  const topicObj = cfg.topic ? unpackTopic(cfg.topic).topic : null;
  if (isHost && view === 'topic') return React.createElement(SetupTopic, {
    topics: topics,
    folder: folder,
    setFolder: setFolder,
    prefs: topicPrefs,
    setPrefs: setTopicPrefs,
    onBack: () => setView('lobby'),
    onTopics: () => setView('lobby'),
    onPick: id => {
      const t = topics.find(x => x.id === id);
      set({
        topic: packTopic(onlineTopic(t), false),
        topicName: t.name,
        topicEmoji: t.emoji,
        rules: {
          ...cfg.rules,
          ...twistRules(cfg.rules),
          slots: [...t.slots]
        }
      });
      setView('lobby');
    }
  });
  if (isHost && view === 'rules' && topicObj) {
    const seats = seatsFromLobby(room, cfg);
    return React.createElement(SetupRules, {
      topic: topicObj,
      managers: seats.length ? seats : [{
        id: 'a'
      }, {
        id: 'b'
      }],
      rules: cfg.rules,
      setRules: r => set({
        rules: r
      }),
      onBack: () => setView('lobby'),
      title: "Online \xB7 Rules",
      startLabel: "Save rules",
      teamSummary: {
        teams: cfg.teamMode,
        text: cfg.teamMode ? cfg.teamCount + ' teams' : 'Individual',
        detail: 'Change teams and bots in the lobby.'
      },
      onStart: r => {
        set({
          rules: r
        });
        setView('lobby');
      },
      onReset: () => set({
        rules: {
          ...RULE_DEFAULTS(),
          slots: [...topicObj.slots]
        }
      })
    });
  }
  const problems = isHost ? lobbyProblems(room, cfg) : [];
  const humansOnline = players.filter(p => p.online).length;
  const r = cfg.rules || {};
  const twistsOn = ['chaos', 'mystery', 'rarity', 'trades'].filter(k => r[k] && r[k].on).map(k => ({
    chaos: 'Chaos Cards',
    mystery: 'Mystery items',
    rarity: 'Rarity',
    trades: 'Trades'
  })[k]);
  const fin = r.finale && r.finale.mode || 'vote';
  if (tv) return React.createElement("div", {
    className: "app tvlobby"
  }, React.createElement(TvExit, {
    onExit: tvView ? () => setTvView(false) : null
  }), React.createElement(RoomCode, {
    code: room.code,
    big: true
  }), React.createElement("div", {
    className: "card stack-sm"
  }, React.createElement("h3", null, cfg.topicEmoji, " ", cfg.topicName || 'Topic not picked yet'), React.createElement("p", {
    className: "small muted",
    style: {
      margin: 0
    }
  }, humansOnline, " player", humansOnline === 1 ? '' : 's', " in \xB7 waiting for the host to start")), React.createElement("div", {
    className: "tvplayers"
  }, players.map(p => React.createElement("span", {
    key: p.uid,
    className: 'tvp' + (p.online ? '' : ' away'),
    style: mStyle({
      color: p.color || '#888'
    })
  }, p.emoji, " ", p.name))));
  return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onLeave,
    backLabel: "\u2715",
    title: "Lobby",
    right: React.createElement(MuteButton, null)
  }), React.createElement(RoomCode, {
    code: room.code
  }), React.createElement("div", {
    className: "card stack-sm"
  }, React.createElement("div", {
    className: "row"
  }, React.createElement("h3", {
    className: "grow"
  }, "Players \xB7 ", humansOnline), tvs.length > 0 && React.createElement("span", {
    className: "small muted"
  }, "\uD83D\uDCFA TV connected")), players.map(p => React.createElement(PlayerRow, {
    key: p.uid,
    p: p,
    me: room.uid,
    host: room.meta.host,
    isHost: isHost,
    teamMode: cfg.teamMode,
    cfg: cfg,
    room: room
  })), players.some(p => !p.online) && React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Away players aren\u2019t given a seat when the game starts.")), isHost ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "card stack"
  }, React.createElement("h3", null, "Teams & bots"), React.createElement(Seg, {
    label: "Play as",
    value: cfg.teamMode ? 'teams' : 'solo',
    options: [['solo', 'Everyone for themselves'], ['teams', 'Teams']],
    onChange: v => set({
      teamMode: v === 'teams'
    })
  }), !cfg.teamMode ? React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Bots filling empty seats"), React.createElement(Stepper, {
    id: "on-bots",
    value: cfg.bots,
    min: 0,
    max: Math.max(0, ONLINE.maxTeams - humansOnline),
    onChange: v => set({
      bots: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, "Up to ", ONLINE.maxTeams, " seats in total (", humansOnline, " people + ", cfg.bots, " bot", cfg.bots === 1 ? '' : 's', ").")) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Number of teams"), React.createElement(Seg, {
    label: "Number of teams",
    value: cfg.teamCount,
    options: [[2, '2'], [3, '3'], [4, '4']],
    onChange: v => set({
      teamCount: v
    })
  })), React.createElement(Toggle, {
    on: cfg.fillBots,
    onChange: v => set({
      fillBots: v
    }),
    title: "Bots fill empty team spots",
    sub: 'Each team is topped up to ' + cfg.teamSize + ' with bots. Bots on a team with people give advice; all-bot teams play for themselves.'
  }), cfg.fillBots && React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Team size"), React.createElement(Seg, {
    label: "Team size",
    value: cfg.teamSize,
    options: [[1, '1'], [2, '2'], [3, '3'], [4, '4']],
    onChange: v => set({
      teamSize: v
    })
  })), React.createElement("p", {
    className: "hint"
  }, "Everyone picks their team in the list above. Teams of up to ", ONLINE.maxTeamSize, ".")), (cfg.teamMode ? cfg.fillBots : cfg.bots > 0) && React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Bot difficulty"), React.createElement(Seg, {
    label: "Bot difficulty",
    value: cfg.level,
    options: Object.keys(BOT_LEVELS).map(k => [k, BOT_LEVELS[k].label]),
    onChange: v => set({
      level: v
    })
  })), React.createElement(Toggle, {
    on: cfg.talk,
    onChange: v => set({
      talk: v
    }),
    title: "Bot trash talk",
    sub: "Speech bubbles from the bots."
  })), React.createElement("div", {
    className: "card stack"
  }, React.createElement("h3", null, "Game"), React.createElement("button", {
    className: "tcard",
    onClick: () => setView('topic')
  }, React.createElement("span", {
    className: "em"
  }, cfg.topicEmoji || '🎲'), React.createElement("span", {
    className: "meta"
  }, React.createElement("span", {
    className: "name"
  }, cfg.topicName || 'Pick a topic'), React.createElement("span", {
    className: "sub"
  }, topicObj ? topicObj.items.length + ' items · ' + topicObj.slots.length + ' slots' : 'Tap to choose')), React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 22
    }
  }, "\u203A")), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "Bid clock"), React.createElement(Seg, {
    label: "Bid clock",
    value: cfg.clock,
    options: ONLINE.clocks.map(c => [c, c + 's']),
    onChange: v => set({
      clock: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, "Restarts on every bid. When it runs out, the item sells (or is skipped if nobody bid).")), React.createElement("button", {
    className: "btn",
    disabled: !topicObj,
    onClick: () => setView('rules')
  }, "Edit rules: ", money(r.budget || 20), " budget", twistsOn.length ? ' · ' + twistsOn.join(', ') : ' · no twists', " \xB7 winner by ", fin === 'vote' ? 'vote' : fin)), React.createElement("div", {
    className: "card stack"
  }, React.createElement("h3", null, "Room"), React.createElement("div", {
    className: "field"
  }, React.createElement("span", {
    className: "label"
  }, "If someone\u2019s connection drops"), React.createElement(Seg, {
    label: "Bot covers after",
    value: cfg.coverAfter || 60,
    options: [[30, 'Bot after 30s'], [60, '60s'], [120, '2 min']],
    onChange: v => set({
      coverAfter: v
    })
  }), React.createElement("p", {
    className: "hint"
  }, "A bot plays their seat until they\u2019re back, then hands it straight back. They can rejoin from Online on the same phone, or take their seat back from another phone.")), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Up to ", ONLINE.maxTeams, " teams (", ONLINE.maxPeople, " people in team mode). Only the host can change rules, start, pause and end trading; everyone else controls just their own team. If the host leaves, the next player to join takes over.")), problems.map(p => React.createElement("p", {
    key: p,
    className: "warn"
  }, p)), React.createElement("button", {
    className: "btn btn-gold",
    disabled: problems.length > 0,
    onClick: onStart
  }, "Start the draft"), React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, "A bot covers anyone who drops out for ", cfg.coverAfter || 60, "s, and hands their seat back when they return."), leaveSheet, React.createElement(TvSwitch, {
    code: room.code,
    onThisScreen: () => setTvView(true)
  })) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "card stack-sm"
  }, React.createElement("h3", null, cfg.topicEmoji, " ", cfg.topicName || 'The host is picking a topic'), React.createElement("p", {
    className: "small muted",
    style: {
      margin: 0
    }
  }, money(r.budget || 20), " budget \xB7 ", (r.slots || []).length, " slots \xB7 ", cfg.clock, "s bid clock", twistsOn.length ? ' · ' + twistsOn.join(', ') : '', " \xB7 winner by ", fin === 'vote' ? 'vote' : fin), React.createElement("details", null, React.createElement("summary", {
    className: "label"
  }, "All rules for this room"), React.createElement(RulesSummary, {
    rules: {
      ...RULE_DEFAULTS(),
      ...r
    },
    opts: {
      teams: cfg.teamMode,
      clock: cfg.clock
    }
  }), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "A bot covers a dropped player after ", cfg.coverAfter || 60, "s. Only the host can change these.")), React.createElement("p", {
    className: "small muted",
    style: {
      margin: 0
    }
  }, cfg.teamMode ? cfg.teamCount + ' teams' + (cfg.fillBots ? ', bots fill empty spots' : '') : 'Everyone for themselves' + (cfg.bots ? ' + ' + cfg.bots + ' bot' + (cfg.bots === 1 ? '' : 's') : ''))), React.createElement("p", {
    className: "muted",
    style: {
      textAlign: 'center'
    }
  }, "Waiting for the host to start\u2026")));
}
function RoomGame({
  room,
  d,
  setHd,
  onLeave,
  onPlayAgain,
  onFinished,
  past,
  settings
}) {
  const isHost = room.amHost;
  const tv = room.kind === 'tv';
  const [flash, setFlash] = useState(null);
  const [askLeave, setAskLeave] = useState(false);
  const [tvView, setTvView] = useState(false);
  const who = useMemo(() => ownerInfo(d, room.uid), [d && d.managers, room.uid]);
  const net = {
    role: isHost ? 'host' : tv ? 'tv' : 'player',
    display: tv || tvView ? 'tv' : 'controls',
    who,
    live: room.live,
    send: (n, a) => room.send(n, a),
    publishLive: o => room.publishLive(o)
  };
  const onFlash = info => {
    setFlash(info);
    if (isHost) room.publishLive({
      flash: {
        id: uid(),
        info
      }
    });
  };
  const lastFlash = useRef(room.live && room.live.flash ? room.live.flash.id : null);
  const fl = room.live && room.live.flash;
  useEffect(() => {
    if (isHost || !fl || fl.id === lastFlash.current) return;
    lastFlash.current = fl.id;
    if (fl.info.kind === 'card') return;
    setFlash(fl.info);
    if (fl.info.kind === 'sold') {
      audio.play(fl.info.big ? 'big' : 'gavel');
      if (fl.info.rarity === 'legendary' || fl.info.big) setTimeout(() => audio.play('cheer'), 600);
    }
  }, [fl && fl.id, isHost]);
  useEffect(() => {
    if (d && d.phase === 'done' && d.votesRevealed && (!d.finale || (d.finale.ui || {}).stage === 'done' || !d.finale.champion)) onFinished(d);
  }, [d && d.votesRevealed, d && d.finale && (d.finale.ui || {}).stage]);
  if (!d) return React.createElement("div", {
    className: "app"
  }, React.createElement("p", {
    className: "muted"
  }, "Loading the game\u2026"));
  const setDraft = isHost ? setHd : () => {};
  const goHome = () => setAskLeave(true);
  let view;
  if (d.phase === 'auction') view = React.createElement(Auction, {
    d: d,
    setDraft: setDraft,
    goHome: goHome,
    flashing: !!flash,
    onFlash: onFlash
  });else if (d.phase === 'freepick') view = React.createElement(FreePick, {
    d: d,
    setDraft: setDraft,
    goHome: goHome,
    flashing: !!flash,
    onFlash: onFlash
  });else if (d.phase === 'nominate') view = React.createElement(Nominate, {
    d: d,
    setDraft: setDraft,
    goHome: goHome
  });else if (d.phase === 'forcepick') view = React.createElement(ForcedPick, {
    d: d,
    setDraft: setDraft,
    goHome: goHome
  });else if (d.phase === 'trade') view = React.createElement(TradeWindow, {
    d: d,
    setDraft: setDraft,
    goHome: goHome
  });else view = React.createElement(Results, {
    d: d,
    past: past,
    showShame: settings.showShame,
    live: true,
    onChange: setDraft,
    onBack: goHome,
    onUndo: null,
    onFinish: goHome,
    onPlayAgain: isHost ? onPlayAgain : null
  });
  const seated = who.teams.size > 0;
  const awaySeats = !seated && !tv ? humanSeats(d).filter(s => !room.online(s.uid)) : [];
  return React.createElement(NetCtx.Provider, {
    value: net
  }, React.createElement("div", {
    className: tv || tvView ? 'tvmode' : ''
  }, !room.connected && React.createElement("div", {
    className: "netbar",
    role: "status"
  }, "Reconnecting\u2026 your seat is kept."), !seated && !tv && awaySeats.length > 0 && React.createElement("div", {
    className: "netbar seat",
    role: "region",
    "aria-label": "Take a seat"
  }, React.createElement("span", null, "You\u2019re watching. Take back a seat:"), awaySeats.map(s => React.createElement("button", {
    key: s.uid,
    className: "btn btn-sm",
    onClick: () => room.send('claimSeat', [s.uid])
  }, s.name))), React.createElement(TvSwitch, {
    on: !tv && isHost && !tvView,
    code: room.code,
    onThisScreen: () => setTvView(true)
  }, view), flash && React.createElement(Flash, {
    f: flash,
    onDone: () => setFlash(null)
  }), tv && React.createElement(TvExit, null), !tv && isHost && tvView && React.createElement(TvExit, {
    onExit: () => setTvView(false)
  }), askLeave && React.createElement(Confirm, {
    title: "Leave the room?",
    body: isHost ? 'Another player takes over as host and the game carries on. You can rejoin from Online.' : 'The game carries on. A bot covers your seat after a minute; you can rejoin from Online.',
    yes: "Leave",
    onYes: onLeave,
    onClose: () => setAskLeave(false)
  })));
}
function OnlineScreen({
  start,
  profile,
  topics,
  rulePrefs,
  past,
  settings,
  setSettings,
  onExit,
  onFinished,
  onRetry
}) {
  const [room, setRoom] = useState(null);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 12000);
    return () => clearTimeout(t);
  }, []);
  const [err, setErr] = useState('');
  const [, tick] = useState(0);
  const [hd, setHd] = useState(null);
  const hdRef = useRef(null);
  hdRef.current = hd;
  const joined = useRef(false);
  useEffect(() => {
    let alive = true;
    let r = null;
    const p = start.kind === 'create' ? Room.create(profile) : Room.join(start.code, profile, start.kind === 'tv' ? 'tv' : 'player');
    p.then(x => {
      if (!alive) {
        x.leave(false);
        return;
      }
      r = x;
      if (window.__DN_TEST__) window.__DN_ROOM = x;
      x.subscribe(() => tick(n => n + 1));
      setRoom(x);
    }).catch(e => {
      if (alive) setErr(e && e.message && !/^[a-z/-]+$/.test(e.message) && !/firebase|network|permission/i.test(e.message) ? e.message : netError(e));
    });
    return () => {
      alive = false;
      if (r) r.leave(false);
    };
  }, []);
  const amHost = !!(room && room.amHost);
  const status = room && room.meta ? room.meta.status : null;
  useEffect(() => {
    audio.setQuiet(!!room && !amHost && room.kind !== 'tv' && !profile.voice);
    return () => audio.setQuiet(false);
  }, [room, amHost, profile.voice]);
  useEffect(() => {
    if (!room || !amHost) return;
    if (!room.lobby && status === 'lobby') {
      const t = topics.find(x => x.items.length && x.slots.length);
      room.setLobby(initialLobby(t, {
        ...rulePrefs(),
        slots: t ? [...t.slots] : []
      }));
    }
    if (status === 'game' && !hdRef.current && room.state) {
      room.adoptState();
      setHd({
        ...room.state,
        history: []
      });
    }
    room.drainActions().catch(() => {});
  }, [room, amHost, status, !!(room && room.state)]);
  useEffect(() => {
    if (room && amHost && hd) room.publish(hd);
  }, [hd, amHost]);
  useEffect(() => {
    if (!room) return undefined;
    room.onAction = ({
      by,
      name,
      args
    }, done) => {
      done();
      if (!room.amHost) return;
      setHd(p => {
        if (!p) return p;
        if (name === 'claimSeat') {
          const [old] = args;
          return typeof old === 'string' && !room.online(old) && ownerInfo(p, by).teams.size === 0 && humanSeats(p).some(s => s.uid === old) ? claimSeat(p, old, by) : p;
        }
        if ((name === 'bid' || name === 'card') && room.liveSent.paused === 'true') return p;
        const n = runAction(p, name, args, ownerInfo(p, by));
        if (name === 'freePick' && n !== p) {
          const cp = currentPicker(p);
          const it = p.items[args[0]];
          setTimeout(() => {
            const info = {
              kind: 'free',
              name: cp.m.name,
              emoji: cp.m.emoji,
              color: cp.m.color,
              item: it.name
            };
            room.publishLive({
              flash: {
                id: uid(),
                info
              }
            });
          }, 0);
        }
        return n;
      });
    };
    return () => {
      room.onAction = null;
    };
  }, [room]);
  useEffect(() => {
    if (!room || !amHost || !hd) return undefined;
    const t = setInterval(() => {
      const now = Date.now();
      setHd(p => {
        if (!p) return p;
        let n = p;
        humanSeats(p).forEach(s => {
          if (room.online(s.uid)) {
            delete room.awaySince[s.uid];
            if (s.covered) n = setCover(n, s.uid, false);
          } else {
            room.awaySince[s.uid] = room.awaySince[s.uid] || now;
            if (!s.covered && now - room.awaySince[s.uid] >= ms((p.online && p.online.coverAfter || 60) * 1000)) n = setCover(n, s.uid, true);
          }
        });
        return n;
      });
    }, ms(2000));
    return () => clearInterval(t);
  }, [room, amHost, !!hd]);
  useEffect(() => {
    if (room && room.players[room.uid]) joined.current = true;
  });
  const leave = forget => {
    if (room) room.leave(forget);
    onExit();
  };
  if (err) return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onExit,
    title: "Online"
  }), React.createElement("div", {
    className: "card stack"
  }, React.createElement("b", null, "Couldn\u2019t open the room"), React.createElement("p", {
    className: "small",
    style: {
      margin: 0
    }
  }, err), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Solo and Local games still work without internet."), React.createElement("button", {
    className: "btn btn-gold",
    onClick: onRetry
  }, "Try again"), React.createElement("button", {
    className: "btn",
    onClick: onExit
  }, "Back")));
  if (!room || !room.meta) return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: onExit,
    title: "Online"
  }), React.createElement("p", {
    className: "muted",
    style: {
      textAlign: 'center'
    }
  }, "Connecting\u2026"), slow && React.createElement("p", {
    className: "hint",
    style: {
      textAlign: 'center'
    }
  }, "This is taking a while. Check your internet connection", typeof navigator !== 'undefined' && navigator.onLine === false ? ' — this device looks offline' : '', "."));
  if (status === 'closed') return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: () => leave(true),
    title: "Online"
  }), React.createElement("div", {
    className: "card stack"
  }, React.createElement("b", null, "This room has ended"), React.createElement("button", {
    className: "btn",
    onClick: () => leave(true)
  }, "Back")));
  if (joined.current && !room.players[room.uid]) return React.createElement("div", {
    className: "app"
  }, React.createElement(TopBar, {
    onBack: () => leave(true),
    title: "Online"
  }), React.createElement("div", {
    className: "card stack"
  }, React.createElement("b", null, "You were removed from the room"), React.createElement("button", {
    className: "btn",
    onClick: () => leave(true)
  }, "Back")));
  if (status === 'lobby') return React.createElement(Lobby, {
    room: room,
    topics: topics,
    rulePrefs: rulePrefs,
    topicPrefs: prefsOf(settings),
    setTopicPrefs: setSettings ? p => setSettings(x => ({
      ...x,
      topicPrefs: {
        fav: p.fav || [],
        pin: p.pin || []
      }
    })) : null,
    tv: room.kind === 'tv',
    onLeave: () => amHost ? room.close().then(onExit) : leave(true),
    onStart: () => {
      const cfg = room.lobby;
      const t = unpackTopic(cfg.topic).topic;
      const managers = seatsFromLobby(room, cfg);
      const rules = {
        ...RULE_DEFAULTS(),
        ...cfg.rules,
        slots: [...t.slots]
      };
      const d = createDraft(t, managers, rules, {
        mode: 'online',
        online: {
          clock: cfg.clock,
          code: room.code,
          coverAfter: cfg.coverAfter || 60
        },
        solo: {
          talk: cfg.talk,
          level: cfg.level
        }
      });
      room.sent = {};
      setHd(d);
      room.publish(d);
      room.setStatus('game');
    }
  });
  const d = amHost ? hd : room.state;
  return React.createElement(RoomGame, {
    room: room,
    d: d,
    setHd: setHd,
    past: past,
    settings: settings,
    onFinished: onFinished,
    onLeave: () => leave(false),
    onPlayAgain: async () => {
      await room.resetGame();
      setHd(null);
      room.setStatus('lobby');
      room.setLobby({
        ...room.lobby,
        botSeed: uid()
      });
    }
  });
}
const LOCAL_TV = 'dn-local-tv';
const tvUrl = code => location.origin + location.pathname + '#tv=' + (code || 'local');
const canChannel = () => typeof window !== 'undefined' && 'BroadcastChannel' in window;
function goFullscreen() {
  try {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {});
  } catch (e) {}
}
const TvCtx = React.createContext(null);
function TvButton() {
  const open = React.useContext(TvCtx);
  if (!open) return null;
  return React.createElement("button", {
    className: "iconbtn tvbtn",
    onClick: open,
    "aria-label": "TV mode",
    title: "TV mode"
  }, "\uD83D\uDCFA");
}
function TvSwitch({
  code,
  onThisScreen,
  children,
  on = true
}) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const newWindow = () => {
    if (!code && !canChannel()) {
      setMsg('This browser can’t link a second window. Use “On this screen” instead.');
      return;
    }
    const w = window.open(tvUrl(code), '_blank');
    if (!w) setMsg('The browser blocked the new window. Allow pop-ups for this site, or use “On this screen”.');else setOpen(false);
  };
  const sheet = open && React.createElement(Sheet, {
    center: true,
    onClose: () => setOpen(false)
  }, React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 30
    }
  }, "TV mode"), React.createElement("p", {
    className: "hint"
  }, "A big-screen view of the auction, bids, clock, teams and matches. It never bids, votes or spends."), React.createElement("button", {
    className: "btn btn-gold",
    onClick: () => {
      setOpen(false);
      onThisScreen();
    }
  }, "Show TV view on this screen"), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "You stay the host. Tap \u201CBack to controls\u201D (or press Esc) to return."), React.createElement("button", {
    className: "btn",
    onClick: newWindow
  }, "Open TV in a new window"), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Drag that window onto the TV (or cast it) and keep controlling the game here.", code ? '' : ' Works in this browser on this computer.'), code && React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "Another device: open Draft Night \u2192 Online \u2192 enter ", React.createElement("b", null, code), " \u2192 \u201CUse this screen as the TV\u201D. It doesn\u2019t take a seat."), msg && React.createElement("p", {
    className: "warn"
  }, msg), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => setOpen(false)
  }, "Close"));
  if (children !== undefined) return React.createElement(TvCtx.Provider, {
    value: on ? () => setOpen(true) : null
  }, children, on && sheet);
  return React.createElement(React.Fragment, null, React.createElement("button", {
    className: "btn",
    onClick: () => setOpen(true)
  }, "\uD83D\uDCFA TV mode"), sheet);
}
function TvExit({
  onExit
}) {
  useEffect(() => {
    if (!onExit) return undefined;
    const k = e => {
      if (e.key === 'Escape' && !document.fullscreenElement) onExit();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onExit]);
  return React.createElement("div", {
    className: "tvbar"
  }, React.createElement("button", {
    className: "pillbtn",
    onClick: goFullscreen
  }, "\u26F6 Full screen"), onExit && React.createElement("button", {
    className: "pillbtn",
    onClick: onExit
  }, "\u2190 Back to controls"));
}
function TvGame({
  d,
  net,
  flash,
  setFlash,
  past,
  settings
}) {
  const noop = () => {};
  let view;
  if (d.phase === 'auction') view = React.createElement(Auction, {
    d: d,
    setDraft: noop,
    goHome: noop,
    flashing: !!flash,
    onFlash: noop
  });else if (d.phase === 'freepick') view = React.createElement(FreePick, {
    d: d,
    setDraft: noop,
    goHome: noop,
    flashing: !!flash,
    onFlash: noop
  });else if (d.phase === 'nominate') view = React.createElement(Nominate, {
    d: d,
    setDraft: noop,
    goHome: noop
  });else if (d.phase === 'forcepick') view = React.createElement(ForcedPick, {
    d: d,
    setDraft: noop,
    goHome: noop
  });else if (d.phase === 'trade') view = React.createElement(TradeWindow, {
    d: d,
    setDraft: noop,
    goHome: noop
  });else view = React.createElement(Results, {
    d: d,
    past: past,
    showShame: settings.showShame,
    onChange: noop,
    onBack: noop
  });
  return React.createElement(NetCtx.Provider, {
    value: net
  }, React.createElement("div", {
    className: "tvmode"
  }, view, flash && React.createElement(Flash, {
    f: flash,
    onDone: () => setFlash(null)
  })));
}
function LocalTv({
  past,
  settings
}) {
  const [d, setD] = useState(null);
  const [live, setLive] = useState({});
  const [flash, setFlash] = useState(null);
  useEffect(() => {
    if (!canChannel()) return undefined;
    const ch = new BroadcastChannel(LOCAL_TV);
    ch.onmessage = e => {
      const m = e.data || {};
      if (m.type === 'draft') setD(m.draft);else if (m.type === 'live') setLive(m.live || {});else if (m.type === 'flash' && m.info && m.info.kind !== 'card') {
        setFlash(m.info);
        if (m.info.kind === 'sold') audio.play(m.info.big ? 'big' : 'gavel');
      }
    };
    ch.postMessage({
      type: 'hello'
    });
    const bye = () => {
      try {
        ch.postMessage({
          type: 'bye'
        });
      } catch (e) {}
    };
    window.addEventListener('beforeunload', bye);
    return () => {
      bye();
      window.removeEventListener('beforeunload', bye);
      ch.close();
    };
  }, []);
  if (!canChannel()) return React.createElement("div", {
    className: "app"
  }, React.createElement("div", {
    className: "card stack"
  }, React.createElement("b", null, "TV window not supported here"), React.createElement("p", {
    className: "hint",
    style: {
      margin: 0
    }
  }, "This browser can\u2019t link windows. Use \u201CShow TV view on this screen\u201D in the game instead.")));
  if (!d) return React.createElement("div", {
    className: "app tvlobby"
  }, React.createElement("div", {
    className: "card stack",
    style: {
      textAlign: 'center'
    }
  }, React.createElement("h2", {
    className: "display"
  }, "\uD83D\uDCFA Draft Night TV"), React.createElement("p", {
    className: "muted",
    style: {
      margin: 0
    }
  }, "Waiting for a game\u2026 Start or resume a Local or Solo game in the other Draft Night window on this computer.")), React.createElement(TvExit, null));
  return React.createElement(React.Fragment, null, React.createElement(TvGame, {
    d: d,
    net: {
      passive: true,
      local: true,
      display: 'tv',
      role: 'tv',
      live
    },
    flash: flash,
    setFlash: setFlash,
    past: past,
    settings: settings
  }), React.createElement(TvExit, null));
}
})();
