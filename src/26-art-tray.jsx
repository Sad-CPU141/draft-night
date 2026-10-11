/* ============================================================
   SCENE: FAST FOOD TRAY — a meal tray seen from slightly above (480 × 300)
   'slot' placement: the topic's slots are Main, Main, Side, Drink, Dessert,
   and each category has its own place on the tray (drinks stand at the back,
   mains in front). Every food is drawn around (0, 0) = the middle of its base.
   ============================================================ */
function TrayBg() {
  return (
    <g>
      <rect width="480" height="120" fill="#fbecd7" />
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 40} y="0" width="20" height="120" fill="#f7e2c6" />)}
      <rect y="84" width="480" height="10" fill="#d9483b" />
      <rect y="112" width="480" height="188" fill="#b07a4c" />
      {Array.from({ length: 7 }, (_, i) => <path key={i} d={'M0 ' + (126 + i * 26) + ' H480'} stroke="rgba(0,0,0,.08)" strokeWidth="2" />)}
      <path d="M58 98 L422 98 L456 290 L24 290 Z" fill="rgba(0,0,0,.25)" transform="translate(4 6)" />
      <path d="M58 98 L422 98 L456 290 L24 290 Z" fill="#cf3b2f" />
      <path d="M72 108 L408 108 L436 278 L44 278 Z" fill="#b83226" />
      <path d="M80 112 L400 112 L424 272 L56 272 Z" fill="#fff7e6" />
      {Array.from({ length: 6 }, (_, r) => Array.from({ length: 9 }, (_, c) => <circle key={r + '-' + c} cx={96 + c * 37 + (r % 2) * 18 - r * 3} cy={128 + r * 27} r="3" fill="#f3d9a8" />))}
      <rect x="436" y="200" width="34" height="46" rx="3" fill="#fff" transform="rotate(8 453 223)" />
      <path d="M8 230 L40 214" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}
const base = (w = 46) => <ellipse cx="0" cy="1" rx={w} ry="6" fill="rgba(0,0,0,.18)" />;
const fl = { stroke: 'rgba(0,0,0,.3)', strokeWidth: 0.9 };
// A burger/sandwich built bottom-up from layers.
function Stack({ layers, w = 42 }) {
  let y = 0; const out = [];
  layers.forEach(([kind, c], i) => {
    const k = i;
    if (kind === 'bun') { out.push(<path key={k} d={'M' + -w + ' ' + y + ' L' + w + ' ' + y + ' Q' + (w + 2) + ' ' + (y - 11) + ' ' + (w - 6) + ' ' + (y - 11) + ' L' + (-w + 6) + ' ' + (y - 11) + ' Q' + (-w - 2) + ' ' + (y - 11) + ' ' + -w + ' ' + y + ' Z'} fill={c || '#e0a456'} {...fl} />); y -= 11; }
    else if (kind === 'mid') { out.push(<rect key={k} x={-w + 1} y={y - 8} width={2 * w - 2} height="8" rx="4" fill={c || '#e0a456'} {...fl} />); y -= 8; }
    else if (kind === 'patty') { out.push(<g key={k}><rect x={-w - 3} y={y - 10} width={2 * w + 6} height="10" rx="5" fill={c || '#6b3a1e'} {...fl} />{[-30, -14, 4, 22].map((x) => <circle key={x} cx={x} cy={y - 5} r="1.2" fill="rgba(0,0,0,.3)" />)}</g>); y -= 10; }
    else if (kind === 'cheese') { out.push(<path key={k} d={'M' + (-w - 2) + ' ' + y + ' H' + (w + 2) + ' V' + (y - 4) + ' H' + (-w - 2) + ' Z M' + (-w + 10) + ' ' + y + ' l5 7 l5 -7 M' + (w - 22) + ' ' + y + ' l4 6 l4 -6'} fill="#ffc531" />); y -= 4; }
    else if (kind === 'lettuce') { out.push(<path key={k} d={'M' + (-w - 4) + ' ' + y + ' Q' + (-w / 2) + ' ' + (y - 9) + ' 0 ' + (y - 2) + ' Q' + w / 2 + ' ' + (y - 9) + ' ' + (w + 4) + ' ' + y + ' Z'} fill="#5fbf3a" />); y -= 4; }
    else if (kind === 'tomato') { out.push(<g key={k}><rect x={-w + 4} y={y - 5} width={w - 6} height="5" rx="2" fill="#e8402f" /><rect x="3" y={y - 5} width={w - 6} height="5" rx="2" fill="#e8402f" /></g>); y -= 5; }
    else if (kind === 'onion') { out.push(<path key={k} d={'M' + (-w + 6) + ' ' + (y - 1) + ' h22 M' + 4 + ' ' + (y - 2) + ' h24'} stroke="#f4e9ff" strokeWidth="2.4" />); y -= 2; }
    else if (kind === 'bacon') { out.push(<path key={k} d={'M' + (-w - 8) + ' ' + y + ' Q' + (-w / 2) + ' ' + (y - 6) + ' 0 ' + y + ' T' + (w + 8) + ' ' + y} stroke="#a33a24" strokeWidth="4" fill="none" strokeLinecap="round" />); y -= 4; }
    else if (kind === 'chicken') { out.push(<g key={k}><path d={'M' + (-w - 8) + ' ' + y + ' Q' + (-w - 10) + ' ' + (y - 9) + ' ' + (-w + 2) + ' ' + (y - 15) + ' Q0 ' + (y - 19) + ' ' + (w - 2) + ' ' + (y - 15) + ' Q' + (w + 12) + ' ' + (y - 8) + ' ' + (w + 8) + ' ' + y + ' Z'} fill={c || '#d98a2b'} {...fl} />{[-28, -12, 6, 22, 34].map((x, j) => <circle key={x} cx={x} cy={y - 7 - (j % 2) * 4} r="2" fill="rgba(255,255,255,.2)" />)}</g>); y -= 13; }
    else if (kind === 'pickles') { out.push(<g key={k}>{[-16, 10].map((x) => <ellipse key={x} cx={x} cy={y - 1} rx="9" ry="2.6" fill="#7cae3a" stroke="#4f7a1f" strokeWidth=".6" />)}</g>); y -= 2; }
    else if (kind === 'top') { out.push(<g key={k}><path d={'M' + -w + ' ' + y + ' Q' + -w + ' ' + (y - 30) + ' 0 ' + (y - 32) + ' Q' + w + ' ' + (y - 30) + ' ' + w + ' ' + y + ' Z'} fill={c && c !== 'plain' ? c : '#e0a456'} {...fl} /><path d={'M' + (-w + 10) + ' ' + (y - 16) + ' Q' + (-w + 16) + ' ' + (y - 26) + ' -6 ' + (y - 27)} stroke="rgba(255,255,255,.35)" strokeWidth="3" fill="none" />{c !== 'plain' && [[-22, -20], [-8, -26], [8, -24], [22, -18], [0, -14], [-16, -10], [16, -10]].map(([a, b], j) => <ellipse key={j} cx={a} cy={y + b} rx="1.8" ry="1" fill="#fff7dc" />)}</g>); y -= 32; }
  });
  return <g>{base(w + 8)}{out}</g>;
}
const Carton = ({ c = '#d6332c', fries = '#f7c53b', fleck, w = 26, h = 40, children }) => (
  <g>{base(w + 6)}
    {Array.from({ length: 9 }, (_, i) => <rect key={i} x={-w + 4 + i * (2 * w - 10) / 8} y={-h - 16 + (i % 3) * 4} width="5" height="30" rx="1.5" fill={fries} stroke="#c9922a" strokeWidth=".5" transform={'rotate(' + (i - 4) * 3 + ' ' + (-w + 6 + i * 5) + ' ' + (-h) + ')'} />)}
    {fleck && Array.from({ length: 10 }, (_, i) => <circle key={i} cx={-w + 6 + (i * 7) % (2 * w - 8)} cy={-h - 12 + (i % 4) * 4} r="1.1" fill={fleck} />)}
    <path d={'M' + -w + ' ' + -h + ' L' + w + ' ' + -h + ' L' + (w - 6) + ' 0 L' + (-w + 6) + ' 0 Z'} fill={c} {...fl} />
    <path d={'M' + -w + ' ' + -h + ' Q0 ' + (-h + 10) + ' ' + w + ' ' + -h} fill="none" stroke="rgba(0,0,0,.2)" strokeWidth="1.5" />
    {children}
  </g>
);
const Cup = ({ w = 22, h = 74, c = '#fff', liquid, clear, lid = '#f4f4f4', dome, straw = '#e2463b', children }) => (
  <g>{base(w + 4)}
    <path d={'M' + -w + ' ' + -h + ' L' + w + ' ' + -h + ' L' + (w - 5) + ' 0 L' + (-w + 5) + ' 0 Z'} fill={clear ? 'rgba(220,240,255,.55)' : c} {...fl} />
    {clear && liquid && <path d={'M' + (-w + 1) + ' ' + (-h + 8) + ' L' + (w - 1) + ' ' + (-h + 8) + ' L' + (w - 5.5) + ' -1 L' + (-w + 5.5) + ' -1 Z'} fill={liquid} />}
    {children}
    {clear && <path d={'M' + (-w + 5) + ' ' + (-h + 10) + ' L' + (-w + 9) + ' -6'} stroke="rgba(255,255,255,.7)" strokeWidth="2.5" />}
    {dome ? <path d={'M' + (-w - 1) + ' ' + -h + ' Q' + (-w) + ' ' + (-h - 22) + ' 0 ' + (-h - 22) + ' Q' + w + ' ' + (-h - 22) + ' ' + (w + 1) + ' ' + -h + ' Z'} fill="rgba(240,250,255,.6)" {...fl} /> : <rect x={-w - 2} y={-h - 5} width={2 * w + 4} height="6" rx="2" fill={lid} {...fl} />}
    {straw && <rect x="4" y={-h - (dome ? 44 : 30)} width="5" height={dome ? 40 : 28} rx="1.5" fill={straw} transform={'rotate(10 6 ' + -h + ')'} />}
  </g>
);
const Bowl = ({ w = 44, c = '#222', children }) => (
  <g>{base(w + 4)}{children}<path d={'M' + -w + ' -26 Q' + -w + ' 0 0 0 Q' + w + ' 0 ' + w + ' -26 Z'} fill={c} {...fl} /><path d={'M' + (-w + 6) + ' -20 Q' + (-w + 8) + ' -6 -10 -4'} stroke="rgba(255,255,255,.18)" strokeWidth="3" fill="none" /></g>
);
const Mound = ({ w = 44, parts }) => (
  <g><path d={'M' + -w + ' -26 Q' + -w + ' -50 0 -52 Q' + w + ' -50 ' + w + ' -26 Z'} fill="#f6f0e2" {...fl} />{parts}</g>
);

const TRAY_ITEMS = [
  // Mains
  ['Big Mac', [-52, -84, 104, 90], 1, () => <Stack layers={[['bun'], ['patty'], ['cheese'], ['lettuce'], ['mid'], ['patty'], ['onion'], ['lettuce'], ['top']]} />, 'Main'],
  ['Whopper', [-58, -66, 116, 72], 1, () => <Stack w={48} layers={[['bun'], ['patty', '#5e3218'], ['tomato'], ['onion'], ['lettuce'], ['top']]} />, 'Main'],
  ['Baconator', [-58, -74, 116, 80], 1, () => <Stack layers={[['bun'], ['patty'], ['cheese'], ['bacon'], ['patty'], ['cheese'], ['bacon'], ['top', 'plain']]} />, 'Main'],
  ['Crunchwrap Supreme', [-52, -46, 104, 52], 1, () => (
    <g>{base(46)}<path d="M-44 -6 L-24 -36 L24 -36 L44 -6 L24 4 L-24 4 Z" fill="#e8bd6a" {...fl} /><path d="M-24 -36 L0 -14 L24 -36 M-44 -6 L0 -14 L44 -6 M0 -14 L-24 4 M0 -14 L24 4" stroke="#c6913e" strokeWidth="1.4" fill="none" />{[[-20, -24], [12, -26], [-8, -6], [22, -10]].map(([x, y], i) => <path key={i} d={'M' + x + ' ' + y + ' l8 -3'} stroke="#8a5a22" strokeWidth="2" strokeLinecap="round" />)}</g>
  ), 'Main'],
  ['Chicken Sandwich', [-56, -66, 112, 72], 1, () => <Stack layers={[['bun', '#d99a48'], ['chicken'], ['pickles'], ['top', 'plain']]} />, 'Main'],
  ['Chick-fil-A Sandwich', [-56, -66, 112, 72], 1, () => <Stack layers={[['bun', '#e7b46a'], ['chicken', '#e3a243'], ['pickles'], ['top', '#e7b46a']]} />, 'Main'],
  ['Double-Double', [-52, -74, 104, 80], 1, () => <g><Stack layers={[['bun'], ['patty'], ['cheese'], ['patty'], ['cheese'], ['tomato'], ['lettuce'], ['top', 'plain']]} /><path d="M-44 0 L-44 -26 L44 -26 L44 0 Z" fill="rgba(255,255,255,.88)" stroke="#d6332c" strokeWidth="1" /><path d="M-44 -18 Q0 -12 44 -18" stroke="#d6332c" strokeWidth="2" fill="none" /></g>, 'Main'],
  ['Teen Burger', [-52, -70, 104, 76], 1, () => <Stack layers={[['bun'], ['patty'], ['cheese'], ['bacon'], ['tomato'], ['lettuce'], ['top']]} />, 'Main'],
  ['Burrito Bowl', [-50, -58, 100, 64], 1, () => (
    <Bowl c="#2a2a2f"><Mound parts={<g>{[[-30, -34], [-22, -40], [-14, -34], [-26, -30], [-18, -46]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="3.2" ry="2.2" fill="#4a2f28" />)}<path d="M-4 -48 Q14 -50 26 -40 L22 -28 L-4 -28 Z" fill="#e8402f" /><ellipse cx="30" cy="-34" rx="11" ry="7" fill="#7ac143" /><path d="M-6 -50 Q4 -56 12 -50" stroke="#ffd23f" strokeWidth="4" strokeLinecap="round" /></g>} /></Bowl>
  ), 'Main'],
  ['Zinger', [-56, -70, 112, 76], 1, () => <g><Stack layers={[['bun'], ['lettuce'], ['chicken', '#c96a22'], ['top']]} />{[[-30, -22], [-12, -26], [10, -24], [30, -20], [-22, -18]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.3" fill="#c0261b" />)}</g>, 'Main'],
  ['Italian B.M.T.', [-58, -40, 116, 46], 1, () => (
    <g>{base(54)}<path d="M-52 -2 Q-56 -14 -46 -14 H46 Q56 -14 52 -2 Z" fill="#d9a35c" {...fl} />{[-40, -24, -8, 8, 24, 40].map((x) => <circle key={x} cx={x} cy={-16} r="7" fill={x % 16 ? '#c0392b' : '#b03a48'} stroke="#7a1f1a" strokeWidth=".6" />)}<path d="M-50 -18 Q-25 -26 0 -18 T50 -18" stroke="#5fbf3a" strokeWidth="4" fill="none" /><path d="M-50 -20 Q-54 -36 -40 -38 H40 Q54 -36 50 -20 Z" fill="#e3b06a" {...fl} />{[-34, -14, 6, 26].map((x) => <path key={x} d={'M' + x + ' -34 l10 4'} stroke="#c58a3e" strokeWidth="1.5" />)}</g>
  ), 'Main'],
  // Sides
  ['Fries', [-34, -76, 68, 82], 2, () => <Carton />, 'Side'],
  ['Cajun Fries', [-34, -76, 68, 82], 2, () => <Carton c="#f07a1f" fleck="#b8261b"><path d="M-14 -24 h28" stroke="#fff" strokeWidth="3" /></Carton>, 'Side'],
  ['Waffle Fries', [-38, -66, 76, 72], 2, () => (
    <g>{base(32)}{[[-18, -46], [0, -52], [18, -46], [-8, -40], [10, -38]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="11" fill="#f2bf4a" stroke="#c9922a" strokeWidth=".7" /><path d={'M' + (x - 7) + ' ' + (y - 4) + ' h14 M' + (x - 7) + ' ' + (y + 3) + ' h14 M' + (x - 4) + ' ' + (y - 8) + ' v15 M' + (x + 4) + ' ' + (y - 8) + ' v15'} stroke="#d9a033" strokeWidth="1" /></g>)}<path d="M-30 -36 L30 -36 L26 0 L-26 0 Z" fill="#c8102e" {...fl} /><path d="M-30 -36 L30 -36" stroke="#fff" strokeWidth="3" /></g>
  ), 'Side'],
  ['Poutine', [-44, -60, 88, 66], 2, () => (
    <Bowl w={38} c="#f4f1ea">{Array.from({ length: 8 }, (_, i) => <rect key={i} x={-30 + i * 8} y={-48 + (i % 2) * 5} width="5" height="24" rx="1.5" fill="#f2c14e" transform={'rotate(' + (i * 17 - 60) + ' ' + (-28 + i * 8) + ' -36)'} />)}<path d="M-30 -32 Q-10 -46 10 -36 Q24 -44 32 -30 Q20 -24 0 -26 Q-20 -22 -30 -32 Z" fill="#7a4a24" opacity=".92" />{[[-16, -38], [6, -40], [20, -34], [-4, -30]].map(([x, y], i) => <rect key={i} x={x} y={y} width="7" height="5" rx="2" fill="#fbf6e8" />)}</Bowl>
  ), 'Side'],
  ['Onion Rings', [-40, -50, 80, 56], 2, () => (
    <g>{base(36)}<rect x="-36" y="-6" width="72" height="6" rx="2" fill="#fff" stroke="#ddd" />{[[-14, -12], [14, -12], [0, -30]].map(([x, y], i) => <g key={i}><ellipse cx={x} cy={y} rx="16" ry="10" fill="#e3a243" {...fl} /><ellipse cx={x} cy={y} rx="8" ry="4.5" fill="#fff7e6" /></g>)}</g>
  ), 'Side'],
  ['Chicken McNuggets', [-40, -56, 80, 62], 2, () => (
    <g>{base(36)}<path d="M-32 -30 L-26 -50 L26 -50 L32 -30 Z" fill="#c8102e" {...fl} />{[[-18, -34], [0, -36], [18, -34], [-8, -26], [10, -26], [-22, -24]].map(([x, y], i) => <path key={i} d={'M' + (x - 8) + ' ' + y + ' Q' + (x - 9) + ' ' + (y - 8) + ' ' + x + ' ' + (y - 8) + ' Q' + (x + 9) + ' ' + (y - 6) + ' ' + (x + 7) + ' ' + (y + 2) + ' Q' + x + ' ' + (y + 6) + ' ' + (x - 8) + ' ' + y + ' Z'} fill="#e3a243" {...fl} />)}<path d="M-32 -30 L32 -30 L28 0 L-28 0 Z" fill="#ffc531" {...fl} /></g>
  ), 'Side'],
  ['Hash Brown', [-34, -48, 68, 54], 2, () => (
    <g>{base(30)}<rect x="-26" y="-44" width="52" height="30" rx="14" fill="#e3a243" {...fl} />{[[-14, -32], [0, -36], [12, -28], [-4, -24]].map(([x, y], i) => <path key={i} d={'M' + x + ' ' + y + ' l6 2'} stroke="#b97a2a" strokeWidth="1.4" />)}<path d="M-30 -22 L30 -22 L26 0 L-26 0 Z" fill="#fff" stroke="#d6332c" strokeWidth="1.2" /><path d="M-26 -12 H26" stroke="#ffc531" strokeWidth="2" /></g>
  ), 'Side'],
  ['Nacho Fries', [-40, -76, 80, 82], 2, () => (
    <g><g transform="translate(-8 0)"><Carton c="#6a2c91" fleck="#d9481e" w={22} h={36} /></g><g transform="translate(26 0)">{base(12)}<path d="M-11 -14 L11 -14 L9 0 L-9 0 Z" fill="#fff" {...fl} /><ellipse cx="0" cy="-14" rx="11" ry="4" fill="#ffb627" /></g></g>
  ), 'Side'],
  // Drinks
  ['Iced Capp', [-28, -108, 56, 114], 3, () => <Cup clear liquid="#c99a6a" dome straw="#2a7a3a"><path d="M-18 -60 h36" stroke="rgba(255,255,255,.45)" strokeWidth="2" /></Cup>, 'Drink'],
  ['Root Beer', [-34, -86, 68, 92], 3, () => (
    <g>{base(28)}<path d="M20 -58 Q38 -56 36 -36 Q34 -18 20 -18" stroke="rgba(220,240,255,.8)" strokeWidth="6" fill="none" /><rect x="-22" y="-70" width="44" height="70" rx="5" fill="rgba(220,240,255,.55)" {...fl} /><rect x="-19" y="-60" width="38" height="57" rx="3" fill="#5a2d14" /><path d="M-24 -68 Q-18 -80 -6 -74 Q2 -84 12 -74 Q24 -80 24 -66 Q16 -60 0 -62 Q-16 -60 -24 -68 Z" fill="#f4ead6" /><path d="M-15 -52 V-10" stroke="rgba(255,255,255,.5)" strokeWidth="3" /></g>
  ), 'Drink'],
  ['Baja Blast', [-28, -108, 56, 114], 3, () => <Cup clear liquid="#2ec4c0" straw="#6a2c91">{[[-8, -50], [6, -40], [-4, -28]].map(([x, y], i) => <rect key={i} x={x} y={y} width="9" height="9" rx="2" fill="rgba(255,255,255,.5)" transform={'rotate(' + i * 20 + ' ' + x + ' ' + y + ')'} />)}</Cup>, 'Drink'],
  ['Double-Double Coffee', [-28, -82, 56, 88], 3, () => <Cup w={20} h={62} c="#fbfaf6" lid="#e9e4da" straw={null}><path d="M-17 -42 L17 -42 L15.5 -22 L-15.5 -22 Z" fill="#c8102e" /><path d="M-6 -66 q6 -6 12 0" stroke="#bbb" strokeWidth="1.5" fill="none" /></Cup>, 'Drink'],
  ['Frosted Lemonade', [-28, -108, 56, 114], 3, () => <Cup clear liquid="#fff2a8" dome straw="#e2463b"><circle cx="-6" cy="-40" r="7" fill="#ffe14a" stroke="#e6b800" strokeWidth=".6" /><path d="M-13 -40 h14 M-6 -47 v14" stroke="#fff7c2" strokeWidth=".8" /></Cup>, 'Drink'],
  // Desserts
  ['McFlurry', [-30, -76, 60, 82], 4, () => (
    <g><Cup w={20} h={50} c="#fbfaf6" straw={null} lid="#fbfaf6"><path d="M-17 -34 Q0 -26 17 -34" stroke="#3b6fd0" strokeWidth="3" fill="none" /></Cup><path d="M-20 -55 Q-14 -72 0 -70 Q14 -74 20 -55 Z" fill="#fffaf0" {...fl} />{[[-10, -60], [4, -64], [12, -58], [-2, -58]].map(([x, y], i) => <rect key={i} x={x} y={y} width="4" height="3" fill="#2b1d16" />)}<rect x="6" y="-82" width="4" height="26" rx="2" fill="#d9d9d9" transform="rotate(16 8 -60)" /></g>
  ), 'Dessert'],
  ['Frosty', [-30, -76, 60, 82], 4, () => (
    <g><Cup w={20} h={52} c="#d6332c" straw={null} lid="#d6332c"><path d="M-17 -34 Q0 -28 17 -34" stroke="#fff" strokeWidth="3" fill="none" /></Cup><path d="M-19 -57 Q-10 -70 0 -66 Q10 -72 19 -57 Z" fill="#7a4a2c" {...fl} /><rect x="-12" y="-80" width="4" height="26" rx="2" fill="#f4f4f4" transform="rotate(-14 -10 -60)" /></g>
  ), 'Dessert'],
  ['Timbits', [-36, -46, 72, 52], 4, () => (
    <g>{base(32)}<path d="M-30 -24 L-24 -40 L24 -40 L30 -24 Z" fill="#8a5a33" {...fl} />{[[-16, -30, '#a0622d'], [-2, -32, '#f2d6a2'], [12, -30, '#5a3418'], [-8, -24, '#e86fa3'], [6, -24, '#d9a35c'], [20, -24, '#f7f2e8']].map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r="7" fill={c} {...fl} />)}<path d="M-30 -22 L30 -22 L26 0 L-26 0 Z" fill="#f4ead6" {...fl} /><path d="M-26 -12 H26" stroke="#c8102e" strokeWidth="3" /></g>
  ), 'Dessert'],
  ['Blizzard', [-30, -80, 60, 86], 4, () => (
    <g><Cup w={20} h={56} c="#fbfaf6" straw={null} lid="#fbfaf6"><path d="M-17 -40 H17 M-16 -32 H16" stroke="#c8102e" strokeWidth="3" /></Cup><path d="M-20 -61 Q-12 -76 0 -72 Q14 -78 20 -61 Z" fill="#fff6e6" {...fl} />{[[-10, -66, '#2b1d16'], [2, -70, '#d9a35c'], [10, -64, '#2b1d16'], [-2, -63, '#e86fa3']].map(([x, y, c], i) => <rect key={i} x={x} y={y} width="5" height="4" rx="1" fill={c} />)}<rect x="8" y="-88" width="4" height="26" rx="2" fill="#e2463b" transform="rotate(14 10 -64)" /></g>
  ), 'Dessert'],
  ['Baked Apple Pie', [-36, -34, 72, 40], 4, () => (
    <g>{base(32)}<rect x="-30" y="-24" width="60" height="22" rx="8" fill="#d99a48" {...fl} />{[-16, -4, 8, 20].map((x) => <path key={x} d={'M' + x + ' -18 l-5 10'} stroke="#8a4a1c" strokeWidth="2" strokeLinecap="round" />)}<path d="M-24 -20 Q0 -26 24 -20" stroke="rgba(255,255,255,.35)" strokeWidth="2" fill="none" /></g>
  ), 'Dessert'],
  ['Cinnabon Delights', [-36, -38, 72, 44], 4, () => (
    <g>{base(32)}{[[-18, -12], [0, -14], [18, -12], [-8, -24], [10, -24]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="9" fill="#c98a4b" {...fl} /><circle cx={x - 2} cy={y - 2} r="3" fill="rgba(255,255,255,.55)" /></g>)}<g transform="translate(26 -2)"><rect x="-7" y="-10" width="14" height="10" rx="2" fill="#fff" {...fl} /><ellipse cx="0" cy="-10" rx="7" ry="2.5" fill="#fffaf0" /></g></g>
  ), 'Dessert'],
];
const TRAY_CATS = { main: 'Main', mains: 'Main', side: 'Side', sides: 'Side', drink: 'Drink', drinks: 'Drink', dessert: 'Dessert', desserts: 'Dessert' };
// A custom item on the tray: a plain version of its category (burger, fries, cup, sundae).
function trayGeneric(item, cat) {
  const k = TRAY_CATS[sceneKey(cat)] || 'Side';
  if (k === 'Main') return { box: [-52, -64, 104, 70], draw: () => <Stack layers={[['bun'], ['patty'], ['cheese'], ['lettuce'], ['top']]} /> };
  if (k === 'Drink') return { box: [-28, -88, 56, 94], draw: () => <Cup /> };
  if (k === 'Dessert') return { box: [-30, -72, 60, 78], draw: () => <g><Cup w={20} h={50} straw={null} /><path d="M-20 -55 Q0 -76 20 -55 Z" fill="#fffaf0" {...fl} /></g> };
  return { box: [-34, -76, 68, 82], draw: () => <Carton /> };
}
const TRAY_SCENE = {
  id: 'tray', title: 'Meal', view: [480, 300], mode: 'slot', cardBg: '#fff7e6',
  Background: TrayBg, list: TRAY_ITEMS, generic: trayGeneric,
  catOf: (s) => TRAY_CATS[sceneKey(s)] || null,
  // Drinks and desserts stand at the back of the tray, mains and sides at the front.
  spots: { Drink: [[396, 168], [330, 158]], Dessert: [[118, 166], [190, 160]], Main: [[148, 250], [284, 250]], Side: [[396, 260], [228, 166]], extra: [[256, 162], [60, 262], [440, 160]] },
};
