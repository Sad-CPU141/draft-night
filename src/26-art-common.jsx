/* ============================================================
   SCENE ART — shared palette and drawing helpers
   Every buildable scene is hand-drawn SVG in one flat, slightly stylised style:
   soft drop shadows, a thin dark outline, a light highlight on the top-left.
   Property scenes (house, backyard) are bird's-eye views; the outfit and the
   meal tray are front views. Nothing here loads from the network.
   ============================================================ */
const SC = {
  shadow: 'rgba(14,22,10,.24)', line: 'rgba(0,0,0,.3)', hi: 'rgba(255,255,255,.22)',
  grass: '#6abb48', grass2: '#62b142', grassDark: '#4b9634', hedge: '#2f7a2c', hedge2: '#3c8d36',
  path: '#eadfc6', pave: '#d8d0c2', pave2: '#c8bfae', stone: '#b9b2a6',
  water: '#52c6ef', water2: '#2a9bd4', sand: '#f1d9a0', sand2: '#e6c582',
  wood: '#c08a55', wood2: '#9b6a3c', roof: '#7b8296', roof2: '#666d82', roof3: '#8d94a8',
  white: '#fbfaf6', red: '#e2463b', gold: '#f2c14e',
};
// Simple shapes with a soft shadow underneath.
const ShRect = ({ x, y, w, h, r = 3, dx = 3, dy = 4 }) => <rect x={x + dx} y={y + dy} width={w} height={h} rx={r} fill={SC.shadow} />;
const ShCircle = ({ cx, cy, r, dx = 3, dy = 4 }) => <circle cx={cx + dx} cy={cy + dy} r={r} fill={SC.shadow} />;
// A tree seen from above.
function TreeTop({ x, y, r = 12, c = '#3e9a3c', fruit }) {
  return (
    <g>
      <circle cx={x + 3} cy={y + 4} r={r} fill={SC.shadow} />
      <circle cx={x} cy={y} r={r} fill={c} stroke="rgba(0,0,0,.18)" strokeWidth=".8" />
      <circle cx={x + r * 0.25} cy={y + r * 0.2} r={r * 0.62} fill="rgba(0,0,0,.08)" />
      <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.5} fill={SC.hi} />
      {fruit && [[-0.45, -0.1], [0.3, -0.45], [0.4, 0.3], [-0.15, 0.45], [0.05, 0]].map(([a, b], i) => <circle key={i} cx={x + a * r} cy={y + b * r} r={Math.max(1.4, r * 0.13)} fill={fruit} stroke="rgba(0,0,0,.25)" strokeWidth=".4" />)}
    </g>
  );
}
// A car seen from above, pointing up (rot rotates it around its centre).
function CarTop({ x, y, w = 22, h = 44, c = '#e2463b', rot = 0, suv, low }) {
  const L = x - w / 2, T = y - h / 2;
  return (
    <g transform={'rotate(' + rot + ' ' + x + ' ' + y + ')'}>
      <rect x={L + 3} y={T + 4} width={w} height={h} rx={w * 0.32} fill={SC.shadow} />
      {[[L - 1.6, T + h * 0.16], [L + w - 1.6, T + h * 0.16], [L - 1.6, T + h * 0.68], [L + w - 1.6, T + h * 0.68]].map(([a, b], i) => <rect key={i} x={a} y={b} width="3.2" height={h * 0.17} rx="1" fill="#1d1d24" />)}
      <rect x={L} y={T} width={w} height={h} rx={low ? w * 0.42 : w * 0.3} fill={c} stroke={SC.line} strokeWidth=".8" />
      <path d={'M' + (L + w * 0.16) + ' ' + (T + h * (suv ? 0.24 : 0.3)) + ' L' + (L + w * 0.84) + ' ' + (T + h * (suv ? 0.24 : 0.3)) + ' L' + (L + w * 0.76) + ' ' + (T + h * (suv ? 0.36 : 0.44)) + ' L' + (L + w * 0.24) + ' ' + (T + h * (suv ? 0.36 : 0.44)) + ' Z'} fill="#1c2733" />
      <rect x={L + w * 0.24} y={T + h * (suv ? 0.36 : 0.44)} width={w * 0.52} height={h * (suv ? 0.4 : 0.26)} rx="2" fill="rgba(255,255,255,.16)" />
      <path d={'M' + (L + w * 0.24) + ' ' + (T + h * (suv ? 0.76 : 0.7)) + ' L' + (L + w * 0.76) + ' ' + (T + h * (suv ? 0.76 : 0.7)) + ' L' + (L + w * 0.82) + ' ' + (T + h * 0.84) + ' L' + (L + w * 0.18) + ' ' + (T + h * 0.84) + ' Z'} fill="#1c2733" />
      <rect x={L + w * 0.12} y={T + 1.2} width={w * 0.2} height="2.4" rx="1" fill="#fff6c8" /><rect x={L + w * 0.68} y={T + 1.2} width={w * 0.2} height="2.4" rx="1" fill="#fff6c8" />
      <rect x={L + w * 0.12} y={T + h - 3.4} width={w * 0.2} height="2" rx="1" fill="#ff5a5a" /><rect x={L + w * 0.68} y={T + h - 3.4} width={w * 0.2} height="2" rx="1" fill="#ff5a5a" />
      <path d={'M' + (L + 2) + ' ' + (T + 4) + ' Q' + (L + w * 0.5) + ' ' + (T - 1) + ' ' + (L + w - 2) + ' ' + (T + 4)} fill="none" stroke={SC.hi} strokeWidth="1.2" />
    </g>
  );
}
// Draw children mirrored around the vertical line x = cx.
const MirrorX = ({ cx, children }) => <g transform={'translate(' + 2 * cx + ' 0) scale(-1 1)'}>{children}</g>;
// A small pavilion with a glass roof (for indoor rooms on a property): icon is drawn inside.
function GlassPavilion({ x, y, w, h, tint = '#bfe6f5', children }) {
  return (
    <g>
      <ShRect x={x} y={y} w={w} h={h} r={3} />
      <rect x={x} y={y} width={w} height={h} rx="3" fill="#ecebe6" stroke={SC.line} strokeWidth=".8" />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx="2" fill={tint} />
      {children}
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx="2" fill="rgba(255,255,255,.18)" />
      <path d={'M' + (x + w / 2) + ' ' + (y + 3) + ' V' + (y + h - 3) + ' M' + (x + 3) + ' ' + (y + h / 2) + ' H' + (x + w - 3)} stroke="rgba(255,255,255,.55)" strokeWidth=".8" />
      <path d={'M' + (x + 5) + ' ' + (y + 5) + ' L' + (x + 13) + ' ' + (y + 5)} stroke="#fff" strokeWidth="1.2" opacity=".7" />
    </g>
  );
}
// Generic stand-in for an item the art doesn't cover yet (custom items in a scene topic):
// a little wooden sign with the item's first letter, so a missing drawing never breaks a scene.
function SceneSign({ item, c = '#f2c14e' }) {
  const ch = (item && item.name ? item.name.trim()[0] : '?').toUpperCase();
  return (
    <g>
      <rect x="-1" y="-6" width="3" height="16" fill={SC.wood2} />
      <ShRect x={-14} y={-24} w={28} h={20} r={4} />
      <rect x="-14" y="-24" width="28" height="20" rx="4" fill={c} stroke={SC.line} strokeWidth=".8" />
      <text x="0" y="-9" textAnchor="middle" fontSize="13" fontWeight="900" fill="#2a2140" fontFamily="system-ui, sans-serif">{ch}</text>
    </g>
  );
}
