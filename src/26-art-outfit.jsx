/* ============================================================
   SCENE: BUILD AN OUTFIT — a mannequin in a dressing room (240 × 420)
   Clothes are drawn on the mannequin's own outline, in layers:
   bottoms → shoes → top → necklace → jacket (open, so the top shows) →
   bag / scarf / watch → sunglasses → hat. One item per category (the topic's
   slots are Hat, Top, Jacket, Bottoms, Shoes, Accessory).
   ============================================================ */
const SKIN = '#efe3d6', SKIN2 = '#dfcdbb';
function OutfitBg() {
  return (
    <g>
      <rect width="240" height="420" fill="#ece4f4" />
      <rect y="330" width="240" height="90" fill="#cfb08c" />
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={'M0 ' + (340 + i * 15) + ' H240'} stroke="rgba(0,0,0,.08)" strokeWidth="1" />)}
      <ellipse cx="120" cy="200" rx="92" ry="190" fill="#f7f2fb" />
      {/* mirror and plant */}
      <rect x="10" y="60" width="40" height="190" rx="20" fill="#d9b860" />
      <rect x="14" y="64" width="32" height="182" rx="16" fill="#cfe3ef" />
      <path d="M20 90 L36 74 M20 112 L40 92" stroke="#fff" strokeWidth="3" opacity=".7" />
      <rect x="198" y="300" width="26" height="32" rx="3" fill="#c96c4f" />
      {[[204, 292, -20], [218, 290, 20], [211, 280, 0]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="6" ry="14" fill="#3d9b3b" transform={'rotate(' + r + ' ' + x + ' ' + y + ')'} />)}
      {/* platform */}
      <ellipse cx="120" cy="404" rx="56" ry="11" fill="#5b4b80" />
      <ellipse cx="120" cy="401" rx="52" ry="9" fill="#7a68a6" />
      {/* the mannequin */}
      <g stroke="rgba(0,0,0,.12)" strokeWidth=".8">
        <path d="M90 220 L119 220 L118 300 L114 384 L100 384 L94 300 Z" fill={SKIN} />
        <path d="M150 220 L121 220 L122 300 L126 384 L140 384 L146 300 Z" fill={SKIN} />
        <path d="M98 382 L114 382 L116 393 L90 395 Q87 389 98 382 Z" fill={SKIN2} />
        <path d="M142 382 L126 382 L124 393 L150 395 Q153 389 142 382 Z" fill={SKIN2} />
        <path d="M84 92 Q70 96 68 110 L60 204 Q60 210 66 210 L72 210 Q76 210 76 204 L86 122 Z" fill={SKIN} />
        <path d="M156 92 Q170 96 172 110 L180 204 Q180 210 174 210 L168 210 Q164 210 164 204 L154 122 Z" fill={SKIN} />
        <ellipse cx="68" cy="219" rx="6" ry="9" fill={SKIN2} /><ellipse cx="172" cy="219" rx="6" ry="9" fill={SKIN2} />
        <path d="M90 86 Q120 80 150 86 Q162 90 164 104 L154 150 L150 190 Q152 206 152 222 L88 222 Q88 206 90 190 L86 150 L76 104 Q78 90 90 86 Z" fill={SKIN} />
        <path d="M112 64 L128 64 L130 88 L110 88 Z" fill={SKIN2} />
        <ellipse cx="120" cy="46" rx="18" ry="22" fill={SKIN} />
      </g>
      <path d="M104 150 Q120 158 136 150" stroke={SKIN2} strokeWidth="1.5" fill="none" />
      <ellipse cx="113" cy="38" rx="5" ry="7" fill="rgba(255,255,255,.4)" />
    </g>
  );
}
// Reusable garment shapes (left half drawn, right half mirrored where symmetric).
const TOP_BODY = 'M89 84 Q100 80 108 82 Q120 92 132 82 Q140 80 151 84 Q164 89 166 104 L156 150 L153 226 L87 226 L84 150 L74 104 Q76 89 89 84 Z';
const SLEEVE_SHORT = 'M88 85 Q70 89 66 106 L62 138 L82 142 L88 118 Z';
const SLEEVE_LONG = 'M88 85 Q70 89 66 106 L57 206 L77 210 L88 120 Z';
const JACKET_PANEL = 'M90 80 Q102 78 110 84 L113 232 L83 234 L81 150 L71 104 Q73 86 90 80 Z';
const JACKET_SLEEVE = 'M86 82 Q66 86 63 106 L54 208 L78 214 L89 122 Z';
const PANTS = 'M88 206 L152 206 L152 222 L150 300 L146 384 L124 384 L121 240 L119 240 L116 384 L94 384 L90 300 L88 222 Z';
const SHORTS = 'M88 206 L152 206 L153 222 L155 292 L124 294 L121 242 L119 242 L116 294 L85 292 L87 222 Z';
const SHOE = 'M92 379 L116 379 L118 391 Q118 398 112 398 L86 398 Q81 398 83 391 Q86 383 92 379 Z';
const both = (d, props) => <><path d={d} {...props} /><MirrorX cx={120}><path d={d} {...props} /></MirrorX></>;
const ln = { stroke: 'rgba(0,0,0,.28)', strokeWidth: 0.9 };

function Top({ c, long, children, collar }) {
  return (
    <g>
      {both(long ? SLEEVE_LONG : SLEEVE_SHORT, { fill: c, ...ln })}
      <path d={TOP_BODY} fill={c} {...ln} />
      {long && both('M58 196 L78 200 L77 210 L57 206 Z', { fill: 'rgba(0,0,0,.12)' })}
      {!collar && <path d="M108 82 Q120 92 132 82" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="2" />}
      <path d="M92 96 Q96 140 92 220" stroke="rgba(255,255,255,.18)" strokeWidth="4" fill="none" />
      {children}
    </g>
  );
}
function Jacket({ c, sleeve, children, hem, cuff }) {
  return (
    <g>
      {both(JACKET_SLEEVE, { fill: sleeve || c, ...ln })}
      {both(JACKET_PANEL, { fill: c, ...ln })}
      {hem && both('M83 224 L113 224 L113 232 L83 234 Z', { fill: hem })}
      {cuff && both('M55 200 L78 205 L78 214 L54 208 Z', { fill: cuff })}
      {children}
    </g>
  );
}
function Pants({ c, children, shorts }) {
  return (
    <g>
      <path d={shorts ? SHORTS : PANTS} fill={c} {...ln} />
      <rect x="88" y="206" width="64" height="8" fill="rgba(0,0,0,.12)" />
      {children}
    </g>
  );
}
const Shoes = ({ c, sole = '#f4f4f4', children }) => <g>{both(SHOE, { fill: c, ...ln })}{both('M82 393 L118 393 Q118 398 112 398 L86 398 Q81 398 82 393 Z', { fill: sole })}{children}</g>;

const OUTFIT_ITEMS = [
  // Hats
  ['Baseball Cap', [86, 14, 68, 46], 9, () => (
    <g><path d="M101 44 Q101 23 120 23 Q139 23 139 44 Z" fill="#d6332c" {...ln} /><path d="M120 23 V44 M108 26 Q112 34 110 44 M132 26 Q128 34 130 44" stroke="rgba(0,0,0,.15)" fill="none" /><path d="M98 43 Q120 53 142 43 Q141 50 120 57 Q99 50 98 43 Z" fill="#b8241e" {...ln} /><circle cx="120" cy="23" r="2.4" fill="#b8241e" /></g>
  ), 'Hat'],
  ['Beanie', [90, 10, 60, 44], 9, () => (
    <g><circle cx="120" cy="19" r="6" fill="#f3e3b5" {...ln} /><path d="M100 46 Q99 22 120 22 Q141 22 140 46 Z" fill="#e3a52a" {...ln} />{[106, 113, 120, 127, 134].map((x) => <path key={x} d={'M' + x + ' 26 V38'} stroke="rgba(0,0,0,.12)" />)}<rect x="99" y="37" width="42" height="10" rx="3" fill="#c98a16" {...ln} /></g>
  ), 'Hat'],
  ['Bucket Hat', [86, 18, 68, 40], 9, () => (
    <g><path d="M104 41 Q104 24 120 24 Q136 24 136 41 Z" fill="#cdb489" {...ln} /><path d="M98 39 L142 39 L149 51 Q120 56 91 51 Z" fill="#bca274" {...ln} /><path d="M104 38 H136" stroke="#8a7350" strokeWidth="2" /></g>
  ), 'Hat'],
  ['Fedora', [86, 16, 68, 34], 9, () => (
    <g><ellipse cx="120" cy="39" rx="29" ry="5" fill="#4a4c54" {...ln} /><path d="M104 38 Q105 22 114 24 Q120 29 126 24 Q135 22 136 38 Z" fill="#5b5e68" {...ln} /><rect x="104" y="33" width="32" height="5" fill="#1f2026" /></g>
  ), 'Hat'],
  ['Cowboy Hat', [80, 12, 80, 40], 9, () => (
    <g><path d="M106 36 Q104 17 114 20 Q120 27 126 20 Q136 17 134 36 Z" fill="#a8743f" {...ln} /><rect x="105" y="31" width="30" height="4" fill="#5a3a1c" /><path d="M82 28 Q90 40 120 40 Q150 40 158 28 Q160 41 141 45 Q120 49 99 45 Q80 41 82 28 Z" fill="#94632f" {...ln} /></g>
  ), 'Hat'],
  // Tops
  ['Plain T-Shirt', [60, 74, 120, 158], 3, () => <Top c="#f6f6f4" />, 'Top'],
  ['Graphic T-Shirt', [60, 74, 120, 158], 3, () => (
    <Top c="#22232a"><path d="M120 120 L127 136 L144 138 L131 149 L135 166 L120 157 L105 166 L109 149 L96 138 L113 136 Z" fill="#ff5d8f" /><path d="M120 128 L124 138 L134 139 L126 146 L129 156 L120 151 L111 156 L114 146 L106 139 L116 138 Z" fill="#ffd23f" /></Top>
  ), 'Top'],
  ['Hoodie', [52, 62, 136, 172], 3, () => (
    <g>
      <path d="M100 70 Q120 60 140 70 L144 92 Q120 100 96 92 Z" fill="#7b8190" {...ln} />
      <Top c="#8c93a3" long collar>
        <path d="M100 176 H140 L144 206 H96 Z" fill="rgba(0,0,0,.12)" />
        <path d="M114 90 V122 M126 90 V122" stroke="#eee" strokeWidth="1.6" /><circle cx="114" cy="123" r="1.6" fill="#eee" /><circle cx="126" cy="123" r="1.6" fill="#eee" />
        <rect x="87" y="214" width="66" height="12" fill="rgba(0,0,0,.14)" />
      </Top>
    </g>
  ), 'Top'],
  ['Sweater', [56, 74, 128, 162], 3, () => (
    <Top c="#e9d7b0" long>
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={'M' + (92 + i * 7) + ' 100 V214'} stroke="rgba(0,0,0,.06)" strokeWidth="2" />)}
      <rect x="87" y="214" width="66" height="12" fill="rgba(0,0,0,.1)" />
      <path d="M96 140 H144" stroke="#b5462f" strokeWidth="5" opacity=".75" /><path d="M96 150 H144" stroke="#2f5d8a" strokeWidth="3" opacity=".75" />
    </Top>
  ), 'Top'],
  ['Button-Up Shirt', [56, 74, 128, 162], 3, () => (
    <Top c="#a9c8ee" long collar>
      <path d="M106 80 L120 96 L134 80 L130 76 L120 88 L110 76 Z" fill="#c3dbf6" {...ln} />
      <path d="M120 96 V226" stroke="rgba(0,0,0,.2)" strokeWidth="1" />
      {[108, 128, 148, 168, 188, 208].map((y) => <circle key={y} cx="122.5" cy={y} r="1.6" fill="#fff" stroke="rgba(0,0,0,.25)" strokeWidth=".4" />)}
      <rect x="96" y="112" width="14" height="12" fill="rgba(0,0,0,.06)" {...ln} />
    </Top>
  ), 'Top'],
  // Jackets
  ['Denim Jacket', [48, 74, 144, 166], 5, () => (
    <Jacket c="#4f7dbb" cuff="#45709f" hem="#45709f">
      {both('M88 112 H106 V128 H88 Z', { fill: 'none', stroke: '#d9b98a', strokeWidth: 1, strokeDasharray: '2 1.5' })}
      {both('M96 84 L110 84 L110 112 L102 104 Z', { fill: '#5d8ac6', ...ln })}
      {both('M112 90 V230', { stroke: '#d9b98a', strokeWidth: 1, strokeDasharray: '2 2' })}
    </Jacket>
  ), 'Jacket'],
  ['Bomber Jacket', [48, 74, 144, 166], 5, () => (
    <Jacket c="#5f6b3d" cuff="#3b4226" hem="#3b4226">
      {both('M100 80 Q110 80 114 86 L112 96 Q104 92 98 88 Z', { fill: '#3b4226' })}
      {both('M112 100 L112 226', { stroke: '#e8742c', strokeWidth: 2 })}
      {both('M60 120 L74 118 L74 130 L60 132 Z', { fill: '#8a9563' })}
    </Jacket>
  ), 'Jacket'],
  ['Leather Jacket', [48, 74, 144, 166], 5, () => (
    <Jacket c="#232327" hem="#16161a">
      {both('M92 82 L112 92 L106 132 L94 112 Z', { fill: '#33333a', ...ln })}
      {both('M112 96 V228', { stroke: '#c9ccd2', strokeWidth: 1.2 })}
      {both('M90 168 L104 164', { stroke: '#c9ccd2', strokeWidth: 1.2 })}
      {both('M70 100 Q76 140 74 200', { stroke: 'rgba(255,255,255,.15)', strokeWidth: 3, fill: 'none' })}
    </Jacket>
  ), 'Jacket'],
  ['Puffer Jacket', [44, 70, 152, 172], 5, () => (
    <g>
      {both('M86 80 Q62 84 58 106 L48 208 L80 216 L91 122 Z', { fill: '#e2552f', ...ln })}
      {both('M92 76 Q104 74 112 82 L114 236 L78 238 L76 150 L65 104 Q68 84 92 76 Z', { fill: '#ec6438', ...ln })}
      {both('M66 112 Q90 118 114 112 M64 136 Q90 142 114 136 M66 160 Q90 166 114 160 M70 184 Q90 190 114 184 M74 208 Q92 214 114 208', { stroke: 'rgba(0,0,0,.22)', strokeWidth: 1.4, fill: 'none' })}
      {both('M54 130 L82 134 M51 158 L84 162 M49 184 L84 188', { stroke: 'rgba(0,0,0,.2)', strokeWidth: 1.2 })}
      {both('M100 74 Q110 72 116 76 L114 92 Q106 88 98 86 Z', { fill: '#c9461f' })}
    </g>
  ), 'Jacket'],
  ['Varsity Jacket', [48, 74, 144, 166], 5, () => (
    <Jacket c="#b3263a" sleeve="#efe3c8" cuff="#b3263a" hem="#b3263a">
      {both('M83 222 H113 M83 227 H113 M55 202 L78 207', { stroke: '#efe3c8', strokeWidth: 1.6 })}
      {[110, 132, 154, 176, 198].map((y) => <circle key={y} cx="109" cy={y} r="1.8" fill="#efe3c8" />)}
      <path d="M95 118 L98 125 L106 126 L100 131 L102 139 L95 135 L88 139 L90 131 L84 126 L92 125 Z" fill="#efe3c8" stroke="#8a1c2c" strokeWidth=".6" />
    </Jacket>
  ), 'Jacket'],
  // Bottoms
  ['Jeans', [82, 200, 76, 190], 2, () => (
    <Pants c="#3e62a0"><path d="M120 214 V240" stroke="#d9b98a" strokeWidth="1" strokeDasharray="2 1.5" /><path d="M92 216 Q100 226 108 216 M132 216 Q140 226 148 216" stroke="#d9b98a" strokeWidth="1" fill="none" /><path d="M104 260 V370 M136 260 V370" stroke="rgba(255,255,255,.12)" strokeWidth="5" /></Pants>
  ), 'Bottoms'],
  ['Cargo Pants', [82, 200, 76, 190], 2, () => (
    <Pants c="#8a7f55">{both('M88 262 H102 L101 290 H89 Z', { fill: '#7a704a', ...ln })}{both('M88 268 H102', { stroke: 'rgba(0,0,0,.25)' })}<path d="M95 372 H115 M125 372 H145" stroke="rgba(0,0,0,.2)" strokeWidth="2" /></Pants>
  ), 'Bottoms'],
  ['Sweatpants', [82, 200, 76, 190], 2, () => (
    <Pants c="#a2a7b0"><path d="M118 212 l-4 14 M122 212 l4 14" stroke="#eee" strokeWidth="1.2" /><path d="M95 370 L115 370 L116 384 L94 384 Z M125 370 L145 370 L146 384 L124 384 Z" fill="#8c919a" /></Pants>
  ), 'Bottoms'],
  ['Shorts', [80, 200, 80, 98], 2, () => <Pants c="#c9a978" shorts><path d="M88 286 L116 288 M124 288 L153 286" stroke="rgba(0,0,0,.18)" strokeWidth="2" /></Pants>, 'Bottoms'],
  ['Tailored Trousers', [82, 200, 76, 190], 2, () => (
    <Pants c="#3a3c45"><path d="M105 220 V382 M135 220 V382" stroke="rgba(255,255,255,.18)" strokeWidth="1" /><rect x="88" y="206" width="64" height="6" fill="#1f2026" /><rect x="116" y="206" width="8" height="6" fill="#c9b37a" /></Pants>
  ), 'Bottoms'],
  // Shoes
  ['Sneakers', [78, 372, 84, 30], 4, () => <Shoes c="#fafafa"><>{both('M92 386 Q102 382 112 388', { stroke: '#2fb35a', strokeWidth: 2.4, fill: 'none' })}</></Shoes>, 'Shoes'],
  ['High-Top Sneakers', [78, 352, 84, 50], 4, () => (
    <g>{both('M95 360 L117 360 L118 391 L86 391 Q86 380 94 376 Z', { fill: '#d6332c', ...ln })}<Shoes c="#d6332c">{both('M98 366 H114 M98 372 H114', { stroke: '#fff', strokeWidth: 1.2 })}{both('M92 384 Q100 380 110 386', { stroke: '#fff', strokeWidth: 2, fill: 'none' })}</Shoes></g>
  ), 'Shoes'],
  ['Boots', [78, 340, 84, 62], 4, () => (
    <g>{both('M95 346 L117 346 L118 391 L86 391 Q86 378 94 372 Z', { fill: '#8a5a2e', ...ln })}<Shoes c="#7a4d24" sole="#3a2614">{both('M95 352 H117', { stroke: '#5a3818', strokeWidth: 2 })}</Shoes></g>
  ), 'Shoes'],
  ['Loafers', [78, 376, 84, 26], 4, () => (
    <g>{both('M90 384 L116 384 L118 393 Q117 398 112 398 L88 398 Q83 397 85 391 Z', { fill: '#4a2c1a', ...ln })}{both('M95 387 H111', { stroke: '#c9a46a', strokeWidth: 1.6 })}{both('M84 395 H118', { stroke: '#2a180c', strokeWidth: 2 })}</g>
  ), 'Shoes'],
  ['Sandals', [78, 376, 84, 26], 4, () => (
    <g>{both('M84 395 L119 395 L119 398 L84 398 Z', { fill: '#7a5233' })}{both('M93 384 L114 390 M100 382 L101 395', { stroke: '#c9822e', strokeWidth: 2.6 })}</g>
  ), 'Shoes'],
  // Accessories
  ['Sunglasses', [98, 34, 44, 22], 10, () => (
    <g><rect x="103" y="41" width="15" height="9" rx="4" fill="#15161b" /><rect x="122" y="41" width="15" height="9" rx="4" fill="#15161b" /><path d="M118 44 Q120 42 122 44 M103 44 L100 42 M137 44 L140 42" stroke="#15161b" strokeWidth="1.5" fill="none" /><path d="M106 43 L110 43" stroke="#fff" strokeWidth="1" opacity=".7" /></g>
  ), 'Accessory'],
  ['Necklace', [102, 80, 36, 40], 4, () => (
    <g><path d="M108 84 Q120 112 132 84" stroke="#e8c04a" strokeWidth="1.8" fill="none" /><path d="M108 84 Q120 112 132 84" stroke="#a8862a" strokeWidth=".6" strokeDasharray="1 1.4" fill="none" /><circle cx="120" cy="106" r="3.6" fill="#e8c04a" stroke="#a8862a" strokeWidth=".6" /></g>
  ), 'Accessory'],
  ['Watch', [162, 190, 26, 26], 8, () => (
    <g><rect x="165" y="198" width="17" height="8" rx="2" fill="#2b2e35" transform="rotate(6 173 202)" /><circle cx="173.5" cy="202" r="5.4" fill="#d9b860" stroke="#7a6320" strokeWidth=".8" /><circle cx="173.5" cy="202" r="3.8" fill="#14243a" /><path d="M173.5 202 V199.5 M173.5 202 L175.5 203" stroke="#fff" strokeWidth=".7" /></g>
  ), 'Accessory'],
  ['Crossbody Bag', [86, 86, 90, 136], 7, () => (
    <g><path d="M94 88 L152 196" stroke="#5a3a1c" strokeWidth="3.2" /><rect x="139" y="188" width="32" height="28" rx="4" fill="#b8814a" {...ln} /><path d="M139 196 Q155 206 171 196 V192 Q171 188 167 188 H143 Q139 188 139 192 Z" fill="#9a6838" {...ln} /><circle cx="155" cy="201" r="1.8" fill="#e8c04a" /></g>
  ), 'Accessory'],
  ['Scarf', [96, 66, 48, 92], 7, () => (
    <g>
      <path d="M104 72 Q120 82 136 72 L138 92 Q120 102 102 92 Z" fill="#c4372f" {...ln} />
      <path d="M124 88 L138 154 L124 156 L116 94 Z" fill="#c4372f" {...ln} />
      <path d="M106 78 Q120 88 134 78 M104 86 Q120 96 136 86 M120 104 L126 156 M128 98 L134 154" stroke="#2f6a3a" strokeWidth="1.6" fill="none" opacity=".8" />
      <path d="M124 156 l1 5 M129 155 l1 5 M134 154 l1 5" stroke="#c4372f" strokeWidth="1.2" />
    </g>
  ), 'Accessory'],
];
const OUTFIT_CATS = ['Hat', 'Top', 'Jacket', 'Bottoms', 'Shoes', 'Accessory'];
const outfitCat = (s) => { const k = sceneKey(s); return OUTFIT_CATS.find((c) => sceneKey(c) === k || (c === 'Bottoms' && k === 'bottom') || (c === 'Accessory' && k === 'accessories') || (c === 'Shoes' && k === 'shoe') || (c === 'Hat' && k === 'hats')) || null; };
// A custom item in the outfit topic: a plain garment of that category in its own colour.
function outfitGeneric(item, slot) {
  const cat = outfitCat(slot) || outfitCat(item.pos) || 'Accessory';
  const hues = ['#e2463b', '#2f6fd0', '#3fb57a', '#f2a65a', '#8a5cd6', '#e86fa3', '#2b2e35', '#d9b860'];
  const c = hues[hashStr(item.name || 'x') % hues.length];
  const map = {
    Hat: { z: 9, box: [86, 14, 68, 46], draw: () => <g><path d="M101 44 Q101 23 120 23 Q139 23 139 44 Z" fill={c} {...ln} /><path d="M98 43 Q120 53 142 43 Q141 50 120 57 Q99 50 98 43 Z" fill={c} {...ln} /></g> },
    Top: { z: 3, box: [60, 74, 120, 158], draw: () => <Top c={c} /> },
    Jacket: { z: 5, box: [48, 74, 144, 166], draw: () => <Jacket c={c} /> },
    Bottoms: { z: 2, box: [82, 200, 76, 190], draw: () => <Pants c={c} /> },
    Shoes: { z: 4, box: [78, 372, 84, 30], draw: () => <Shoes c={c} /> },
    Accessory: { z: 8, box: [102, 80, 36, 40], draw: () => <g><path d="M108 84 Q120 112 132 84" stroke={c} strokeWidth="2.4" fill="none" /><circle cx="120" cy="106" r="4" fill={c} /></g> },
  };
  return { absolute: true, ...map[cat] };
}
const OUTFIT_SCENE = {
  id: 'outfit', title: 'Outfit', view: [240, 420], mode: 'fixed', cardBg: '#ece4f4',
  Background: OutfitBg, list: OUTFIT_ITEMS, generic: outfitGeneric, spare: [[120, 300]],
};
