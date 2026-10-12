/* ============================================================
   HELPERS
   ============================================================ */
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const norm = (s) => (s || '').trim().toUpperCase();
const isFlex = (s) => norm(s) === 'FLEX';
const parseSlots = (str) => (str || '').split(',').map((s) => s.trim()).filter(Boolean);
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const initials = (name) => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const lastName = (name) => { const p = (name || '').split(/\s+/); return p.length > 1 ? p.slice(1).join(' ') : name; };
const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };
const money = (n) => '$' + n;
function onColor(hex) {
  const h = hex.replace('#', ''); const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b; return L > 0.55 ? '#1a1300' : '#ffffff';
}
const mStyle = (m) => ({ '--c': m.color, '--on': onColor(m.color) });

const COLORS = ['#ff4f64', '#3d8bff', '#ffc83d', '#2fd17c', '#a46bff', '#ff8a3a', '#ff5cbc', '#22cfd6', '#b8e05a', '#7b8cff', '#ff9fb2', '#c79a5b', '#5be0b8', '#e05bff', '#9aa4b8', '#ffe066'];
const MAX_MANAGERS = 16;
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
        const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
        const c = document.createElement('canvas'); c.width = size; c.height = size;
        c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(c.toDataURL('image/jpeg', 0.72));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

