/* ============================================================
   SCENE: DREAM BACKYARD — a fenced garden behind the house (520 × 380)
   Different composition from the estate: the back of the house runs along the
   top, a timber deck holds the patio zone, then lawn zones (pool, activities,
   garden) inside a wooden fence.
   ============================================================ */
function BackyardBg() {
  return (
    <g>
      <rect width="520" height="380" fill="#73c04f" />
      {Array.from({ length: 13 }, (_, r) => Array.from({ length: 13 }, (__, c) => ((r + c) % 2 ? <rect key={r + '-' + c} x={c * 40} y={112 + r * 22} width="40" height="22" fill="#6bb748" /> : null)))}
      {/* back of the house */}
      <rect width="520" height="54" fill="#5c6377" />
      {Array.from({ length: 27 }, (_, i) => <path key={i} d={'M' + i * 20 + ' 0 V48'} stroke="rgba(0,0,0,.12)" strokeWidth="1" />)}
      {[10, 22, 34].map((y) => <path key={y} d={'M0 ' + y + ' H520'} stroke="rgba(255,255,255,.07)" strokeWidth="2" />)}
      <rect y="46" width="520" height="8" fill="#4a5063" />
      <rect x="72" y="8" width="26" height="18" rx="2" fill="#a9d7ee" stroke="#3e4456" strokeWidth="1.5" /><rect x="420" y="10" width="26" height="18" rx="2" fill="#a9d7ee" stroke="#3e4456" strokeWidth="1.5" />
      <rect x="250" y="4" width="14" height="14" fill="#8f5a43" />
      {/* deck */}
      <rect y="54" width="520" height="58" fill="#c79763" />
      {Array.from({ length: 11 }, (_, i) => <path key={i} d={'M0 ' + (58 + i * 5) + ' H520'} stroke="rgba(0,0,0,.1)" strokeWidth=".8" />)}
      <rect y="108" width="520" height="5" fill="#a7774a" />
      <rect x="236" y="112" width="48" height="10" fill="#b8865a" /><path d="M236 117 H284" stroke="rgba(0,0,0,.15)" />
      {/* stepping stones down the middle */}
      {[132, 152, 172, 192, 212, 232, 252, 272, 292, 312, 332, 352].map((y, i) => <ellipse key={y} cx={260 + (i % 2 ? 6 : -6)} cy={y} rx="9" ry="6" fill="#ddd5c6" stroke="rgba(0,0,0,.15)" strokeWidth=".6" />)}
      {/* fence */}
      <path d="M4 54 V376 H516 V54" fill="none" stroke="#a8784a" strokeWidth="8" />
      <path d="M4 54 V376 H516 V54" fill="none" stroke="#c99a68" strokeWidth="3" strokeDasharray="2 10" />
      {/* corner shrubs */}
      {[[18, 126, 9], [502, 126, 9], [500, 366, 8]].map(([x, y, r], i) => <TreeTop key={i} x={x} y={y} r={r} c="#3d9b3b" />)}
    </g>
  );
}
const Lounger = ({ x, y, c = '#52c6ef' }) => (
  <g><rect x={x + 2} y={y + 2} width="14" height="26" rx="3" fill={SC.shadow} /><rect x={x} y={y} width="14" height="26" rx="3" fill="#fff" stroke={SC.line} strokeWidth=".6" /><rect x={x + 2} y={y + 8} width="10" height="16" rx="2" fill={c} /></g>
);
const Chair = ({ x, y, c = '#f4f1ea' }) => <g><rect x={x + 1.5} y={y + 2} width="9" height="9" rx="2" fill={SC.shadow} /><rect x={x} y={y} width="9" height="9" rx="2" fill={c} stroke={SC.line} strokeWidth=".6" /></g>;

const BACKYARD_ITEMS = [
  ['Outdoor Dining Table', [32, 60, 104, 50], 3, () => (
    <g>
      {[44, 64, 84, 104].map((x) => <Chair key={'t' + x} x={x} y={62} />)}{[44, 64, 84, 104].map((x) => <Chair key={'b' + x} x={x} y={95} />)}
      <ShRect x={40} y={73} w={80} h={20} />
      <rect x="40" y="73" width="80" height="20" rx="3" fill={SC.wood2} stroke={SC.line} strokeWidth=".8" />
      {[52, 72, 92, 108].map((x) => <circle key={x} cx={x} cy="83" r="3.5" fill="#fff" stroke="#ccc" strokeWidth=".5" />)}
      <circle cx="80" cy="83" r="3" fill="#e2463b" />
    </g>
  )],
  ['Patio Sofa', [142, 58, 90, 52], 3, () => (
    <g>
      <rect x="146" y="62" width="82" height="44" rx="3" fill="#e4d9c4" opacity=".7" />
      <ShRect x={148} y={64} w={74} h={14} r={4} /><ShRect x={148} y={64} w={14} h={38} r={4} />
      <path d="M148 64 H222 V78 H162 V102 H148 Z" fill="#3b4a63" stroke={SC.line} strokeWidth=".8" />
      {[166, 184, 202].map((x) => <rect key={x} x={x} y="66" width="16" height="10" rx="3" fill="#f2a65a" />)}
      <rect x="150" y="80" width="10" height="16" rx="3" fill="#f2a65a" />
      <ShRect x={176} y={84} w={34} h={18} />
      <rect x="176" y="84" width="34" height="18" rx="3" fill={SC.wood} stroke={SC.line} strokeWidth=".6" />
      <circle cx="193" cy="93" r="3" fill="#7ac36a" />
    </g>
  )],
  ['Pergola', [238, 56, 100, 56], 4, () => (
    <g>
      <rect x="246" y="64" width="84" height="44" fill="rgba(0,0,0,.08)" />
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={244 + i * 10} y="60" width="4" height="46" fill={SC.wood2} stroke="rgba(0,0,0,.2)" strokeWidth=".4" />)}
      <rect x="242" y="62" width="88" height="5" fill={SC.wood} /><rect x="242" y="99" width="88" height="5" fill={SC.wood} />
      {[[250, 64], [262, 101], [300, 63], [318, 100], [284, 66], [326, 66]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill={i % 2 ? '#4aa84a' : '#e86fa3'} opacity=".9" />)}
      {[[244, 60], [326, 60], [244, 100], [326, 100]].map(([x, y], i) => <rect key={i} x={x} y={y} width="6" height="6" fill="#6b4728" />)}
    </g>
  )],
  ['Outdoor Bar', [342, 58, 94, 52], 3, () => (
    <g>
      <ShRect x={350} y={64} w={78} h={16} r={8} />
      <path d="M350 64 H428 V80 Q389 92 350 80 Z" fill="#6d4a2f" stroke={SC.line} strokeWidth=".8" />
      <path d="M352 68 H426" stroke="#c9a072" strokeWidth="3" />
      {[[362, 70, '#3fb57a'], [372, 69, '#d9a441'], [384, 70, '#c0392b'], [404, 69, '#7fc8ff']].map(([x, y, c], i) => <rect key={i} x={x} y={y - 4} width="4" height="7" rx="1" fill={c} />)}
      {[358, 378, 398, 418].map((x) => <g key={x}><circle cx={x + 1.5} cy={98} r="5" fill={SC.shadow} /><circle cx={x} cy={96} r="5" fill="#e0e0e0" stroke={SC.line} strokeWidth=".6" /><circle cx={x} cy={96} r="3" fill="#2a2a2a" /></g>)}
    </g>
  )],
  ['BBQ Grill', [440, 60, 68, 50], 4, () => (
    <g>
      <ShRect x={444} y={70} w={40} h={26} r={6} />
      <rect x="444" y="70" width="40" height="26" rx="6" fill="#2b2e35" stroke={SC.line} strokeWidth=".8" />
      <rect x="448" y="74" width="32" height="18" rx="3" fill="#3a3d45" />
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={'M' + (451 + i * 6.5) + ' 75 V91'} stroke="#777" strokeWidth=".8" />)}
      {[[455, 80], [468, 84], [462, 78]].map(([x, y], i) => <rect key={i} x={x} y={y} width="9" height="5" rx="2" fill="#9b4a2b" stroke="#5a2412" strokeWidth=".5" />)}
      <rect x="486" y="74" width="16" height="18" rx="2" fill="#9aa1ab" stroke={SC.line} strokeWidth=".6" />
      <circle cx="494" cy="83" r="4" fill="#f4f1ea" />
      <path d="M448 104 Q456 98 462 104" stroke="rgba(255,255,255,.5)" fill="none" strokeWidth="1.5" />
    </g>
  )],
  ['String Lights', [0, 112, 520, 26], 20, () => (
    <g>
      {[[8, 260], [260, 512]].map(([a, b], k) => (
        <g key={k}>
          <path d={'M' + a + ' 116 Q' + (a + b) / 2 + ' 140 ' + b + ' 116'} fill="none" stroke="#333" strokeWidth="1" />
          {Array.from({ length: 11 }, (_, i) => { const t = (i + 0.5) / 11; const x = a + (b - a) * t; const y = 116 + 48 * t * (1 - t); return <g key={i}><circle cx={x} cy={y + 2} r="4.2" fill="rgba(255,226,120,.35)" /><circle cx={x} cy={y + 2} r="2.2" fill="#ffe27a" stroke="#c9a23a" strokeWidth=".5" /></g>; })}
        </g>
      ))}
    </g>
  )],
  ['Swimming Pool', [20, 134, 182, 88], 3, () => (
    <g>
      <path d="M30 140 Q110 128 190 146 Q204 174 184 206 Q120 222 46 212 Q18 196 30 140 Z" fill={SC.shadow} transform="translate(3 4)" />
      <path d="M30 140 Q110 128 190 146 Q204 174 184 206 Q120 222 46 212 Q18 196 30 140 Z" fill="#efe9dd" stroke={SC.line} strokeWidth=".8" />
      <path d="M38 146 Q110 136 182 151 Q194 175 178 200 Q120 214 50 205 Q28 192 38 146 Z" fill={SC.water} />
      <path d="M38 146 Q110 136 182 151 L180 156 Q110 142 40 152 Z" fill={SC.water2} />
      <path d="M60 172 Q72 167 84 172 T108 172 M118 188 Q130 183 142 188 T166 188 M70 196 Q80 192 90 196" stroke="#fff" strokeWidth="1.2" fill="none" opacity=".8" />
      <path d="M170 152 h8 m-8 6 h8 m-8 6 h8" stroke="#fff" strokeWidth="1.4" />
      <circle cx="120" cy="178" r="6" fill="none" stroke="#ff5d5d" strokeWidth="3" />
    </g>
  )],
  ['Hot Tub', [198, 140, 52, 52], 4, () => (
    <g>
      <ShRect x={202} y={144} w={42} h={42} r={8} />
      <rect x="202" y="144" width="42" height="42" rx="8" fill="#8a6748" stroke={SC.line} strokeWidth=".8" />
      <rect x="207" y="149" width="32" height="32" rx="6" fill="#63d3f3" />
      {[[213, 156], [226, 160], [218, 170], [232, 172], [229, 154], [212, 174]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.8" fill="#fff" opacity=".85" />)}
    </g>
  )],
  ['Pool Loungers', [20, 218, 184, 36], 4, () => (
    <g>
      <Lounger x={36} y={222} c="#ffd84d" /><Lounger x={60} y={222} c="#52c6ef" /><Lounger x={108} y={222} c="#ff7a7a" /><Lounger x={132} y={222} c="#ffd84d" />
      <circle cx="90" cy="236" r="12" fill={SC.shadow} transform="translate(2 2)" /><circle cx="90" cy="236" r="12" fill="#ff7a7a" stroke={SC.line} strokeWidth=".6" />
      <path d="M78 236 H102 M90 224 V248" stroke="#fff" strokeWidth="1.6" />
      <circle cx="170" cy="236" r="5" fill="#fff" stroke={SC.line} strokeWidth=".5" />
    </g>
  )],
  ['Trampoline', [262, 144, 76, 76], 5, () => (
    <g>
      <ShCircle cx={300} cy={182} r={32} />
      <circle cx="300" cy="182" r="32" fill="#2f6fd0" stroke={SC.line} strokeWidth=".8" />
      <circle cx="300" cy="182" r="25" fill="#1d1f26" />
      {Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return <path key={i} d={'M' + (300 + 25 * Math.cos(a)) + ' ' + (182 + 25 * Math.sin(a)) + ' L' + (300 + 31 * Math.cos(a)) + ' ' + (182 + 31 * Math.sin(a))} stroke="#9fb7e8" strokeWidth=".8" />; })}
      <circle cx="294" cy="176" r="8" fill="rgba(255,255,255,.08)" />
    </g>
  )],
  ['Outdoor Cinema', [362, 132, 148, 72], 4, () => (
    <g>
      <path d="M384 196 L430 146 L452 146 L408 196 Z" fill="rgba(255,248,200,.18)" />
      <rect x="378" y="190" width="14" height="10" rx="2" fill="#2b2e35" /><circle cx="388" cy="195" r="2.5" fill="#bfe6ff" />
      <rect x="402" y="152" width="10" height="5" fill="#555" /><rect x="476" y="152" width="10" height="5" fill="#555" />
      <rect x="398" y="134" width="94" height="16" rx="2" fill={SC.shadow} transform="translate(2 3)" />
      <rect x="398" y="134" width="94" height="16" rx="2" fill="#2b2e35" />
      <rect x="402" y="136" width="86" height="12" rx="1" fill="#e9f3ff" />
      <path d="M402 148 L430 140 L450 144 L488 137 V148 Z" fill="#9fd0ff" opacity=".7" />
      {[[420, 174, '#ff7a7a'], [444, 180, '#ffd84d'], [468, 174, '#7ad1ff'], [492, 182, '#9be37a']].map(([x, y, c], i) => <g key={i}><ellipse cx={x + 2} cy={y + 3} rx="10" ry="8" fill={SC.shadow} /><ellipse cx={x} cy={y} rx="10" ry="8" fill={c} stroke={SC.line} strokeWidth=".6" /><ellipse cx={x - 2} cy={y - 2} rx="4" ry="3" fill={SC.hi} /></g>)}
    </g>
  )],
  ['Table Tennis', [210, 222, 84, 50], 4, () => (
    <g>
      <ShRect x={216} y={230} w={70} h={36} />
      <rect x="216" y="230" width="70" height="36" rx="1" fill="#1f5fb0" stroke={SC.line} strokeWidth=".8" />
      <path d="M216 230 h70 v36 h-70 Z M216 248 H286" stroke="#fff" strokeWidth="1.2" fill="none" />
      <path d="M251 228 V268" stroke="#eee" strokeWidth="2.4" /><path d="M251 228 V268" stroke="#555" strokeWidth=".6" strokeDasharray="1.5 1.5" />
      <g><circle cx="230" cy="224" r="5" fill="#d7322b" /><rect x="228.5" y="227" width="3" height="6" rx="1" fill="#8a5a33" /></g>
      <g><circle cx="276" cy="272" r="5" fill="#222" /><rect x="274.5" y="263" width="3" height="6" rx="1" fill="#8a5a33" /></g>
      <circle cx="262" cy="242" r="1.8" fill="#fff" />
    </g>
  )],
  ['Fire Pit', [302, 222, 58, 58], 5, () => (
    <g>
      {[0, 72, 144, 216, 288].map((a) => { const r = a * Math.PI / 180; const x = 331 + 22 * Math.cos(r), y = 251 + 22 * Math.sin(r); return <g key={a} transform={'rotate(' + (a + 90) + ' ' + x + ' ' + y + ')'}><rect x={x - 5 + 1.5} y={y - 6 + 2} width="10" height="12" rx="2" fill={SC.shadow} /><rect x={x - 5} y={y - 6} width="10" height="12" rx="2" fill="#f0ece2" stroke={SC.line} strokeWidth=".6" /></g>; })}
      <ShCircle cx={331} cy={251} r={11} />
      <circle cx="331" cy="251" r="11" fill="#8a837a" stroke={SC.line} strokeWidth=".8" />
      <circle cx="331" cy="251" r="7.5" fill="#ff7a1a" /><circle cx="331" cy="251" r="4" fill="#ffd23f" />
    </g>
  )],
  ['Basketball Hoop', [394, 204, 116, 88], 4, () => (
    <g>
      <rect x="398" y="208" width="108" height="80" rx="2" fill="#b9b4ab" stroke={SC.line} strokeWidth=".8" />
      <g stroke="#fff" strokeWidth="1.3" fill="none">
        <rect x="438" y="208" width="28" height="36" /><path d="M438 244 Q452 262 466 244" /><path d="M408 208 Q408 270 452 274 Q496 270 496 208" />
      </g>
      <rect x="440" y="208" width="24" height="5" fill="#f4f4f4" stroke={SC.line} strokeWidth=".6" />
      <circle cx="452" cy="219" r="5" fill="none" stroke="#ff5a1f" strokeWidth="2" />
      <circle cx="478" cy="262" r="4" fill="#ff7b29" stroke="#3a1a08" strokeWidth=".6" /><path d="M474 262 H482 M478 258 V266" stroke="#3a1a08" strokeWidth=".5" />
    </g>
  )],
  ['Vegetable Garden', [14, 260, 88, 68], 3, () => (
    <g>
      {[0, 1].map((r) => (
        <g key={r}>
          <ShRect x={20} y={266 + r * 30} w={76} h={24} />
          <rect x="20" y={266 + r * 30} width="76" height="24" rx="2" fill="#7a5233" stroke={SC.line} strokeWidth=".8" />
          <rect x="23" y={269 + r * 30} width="70" height="18" fill="#5a3d24" />
          {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={30 + i * 11.5} cy={278 + r * 30} r="4.5" fill={r ? '#3d9b3b' : '#5fb84a'} />)}
          {r ? [34, 57, 80].map((x) => <circle key={x} cx={x} cy={276 + 30} r="2" fill="#e8402f" />) : [41, 64, 87].map((x) => <circle key={x} cx={x} cy={281} r="1.8" fill="#f28b2b" />)}
        </g>
      ))}
    </g>
  )],
  ['Koi Pond', [100, 258, 98, 70], 3, () => (
    <g>
      <path d="M110 276 Q130 258 166 266 Q196 274 190 298 Q184 322 148 322 Q110 322 106 300 Q102 286 110 276 Z" fill="#9b968c" />
      <path d="M114 278 Q132 264 164 270 Q190 278 185 297 Q180 316 148 316 Q114 316 111 299 Q108 287 114 278 Z" fill="#3aa6c9" />
      {[[130, 286, 15], [160, 300, -20], [145, 276, 40]].map(([x, y, r], i) => <g key={i} transform={'rotate(' + r + ' ' + x + ' ' + y + ')'}><ellipse cx={x} cy={y} rx="6" ry="2.6" fill={i === 1 ? '#fff' : '#ff8a1f'} /><path d={'M' + (x + 5) + ' ' + y + ' l4 -2.5 v5 Z'} fill={i === 1 ? '#fff' : '#ff8a1f'} />{i === 1 && <circle cx={x - 1} cy={y} r="1.4" fill="#e63b2e" />}</g>)}
      {[[170, 286], [124, 304]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="6" fill="#4cae4a" /><path d={'M' + x + ' ' + y + ' l6 -2'} stroke="#3aa6c9" strokeWidth="1.5" /></g>)}
      {[[108, 284], [188, 306], [150, 320]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#b9b2a6" stroke={SC.line} strokeWidth=".5" />)}
    </g>
  )],
  ['Football Goal', [200, 282, 112, 70], 4, () => (
    <g>
      <g stroke="#fff" strokeWidth="1.4" fill="none" opacity=".9"><rect x="216" y="306" width="80" height="40" /><rect x="236" y="306" width="40" height="18" /><path d="M236 346 Q256 330 276 346" /></g>
      <rect x="228" y="290" width="56" height="16" fill="rgba(255,255,255,.35)" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={'M' + (230 + i * 7) + ' 290 V306'} stroke="rgba(255,255,255,.7)" strokeWidth=".5" />)}
      {[294, 298, 302].map((y) => <path key={y} d={'M228 ' + y + ' H284'} stroke="rgba(255,255,255,.7)" strokeWidth=".5" />)}
      <path d="M228 306 V290 H284 V306" stroke="#fff" strokeWidth="3" fill="none" />
      <circle cx="256" cy="336" r="4" fill="#fff" stroke="#222" strokeWidth=".7" /><path d="M254 334 l2 2 l2 -2" stroke="#222" strokeWidth=".6" fill="none" />
    </g>
  )],
  ['Playground', [312, 286, 90, 76], 4, () => (
    <g>
      <rect x="316" y="290" width="82" height="68" rx="6" fill="#e6c98f" />
      <path d="M322 298 H372" stroke="#d94a3a" strokeWidth="3.5" strokeLinecap="round" />
      {[332, 360].map((x) => <g key={x}><path d={'M' + x + ' 298 V312'} stroke="#555" strokeWidth=".8" /><rect x={x - 4} y="312" width="8" height="3" rx="1" fill="#2f6fd0" /></g>)}
      <ShRect x={376} y={300} w={14} h={44} />
      <rect x="376" y="300" width="14" height="10" rx="1" fill="#4aa0e0" stroke={SC.line} strokeWidth=".6" />
      <rect x="378" y="310" width="10" height="34" rx="4" fill="#ffd23f" stroke={SC.line} strokeWidth=".6" />
      <rect x="324" y="326" width="36" height="24" rx="3" fill="#f2ddb1" stroke="#b58a52" strokeWidth="2" />
      <circle cx="336" cy="336" r="3" fill="#e2463b" /><path d="M346 340 l6 -6" stroke="#2f6fd0" strokeWidth="2" />
    </g>
  )],
  ['Fruit Trees', [402, 290, 108, 78], 4, () => (
    <g><TreeTop x={424} y={314} r={18} c="#3f9b3b" fruit="#ff8a1f" /><TreeTop x={486} y={312} r={17} c="#47a242" fruit="#e8402f" /><TreeTop x={456} y={346} r={17} c="#3a9437" fruit="#ffd23f" /></g>
  )],
  ['Hammock', [204, 348, 108, 28], 5, () => (
    <g>
      <TreeTop x={214} y={360} r={8} c="#3a9437" /><TreeTop x={302} y={360} r={8} c="#3a9437" />
      <path d="M222 360 Q258 376 294 360" stroke={SC.shadow} strokeWidth="9" fill="none" transform="translate(2 3)" />
      <path d="M222 360 Q258 376 294 360" stroke="#f2a65a" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M222 360 Q258 376 294 360" stroke="#fff" strokeWidth="2" fill="none" strokeDasharray="4 4" />
    </g>
  )],
  ['Sauna', [14, 330, 66, 46], 4, () => (
    <g>
      <ShRect x={20} y={336} w={52} h={32} r={14} />
      <rect x="20" y="336" width="52" height="32" rx="14" fill="#b07a46" stroke={SC.line} strokeWidth=".8" />
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={'M' + (26 + i * 8) + ' 337 V367'} stroke="rgba(0,0,0,.15)" strokeWidth="1" />)}
      <rect x="58" y="340" width="7" height="7" fill="#555" />
      <circle cx="64" cy="336" r="3" fill="rgba(255,255,255,.6)" /><circle cx="68" cy="331" r="2.4" fill="rgba(255,255,255,.45)" />
    </g>
  )],
  ['Flower Beds', [80, 330, 122, 44], 3, () => (
    <g>
      <path d="M88 346 Q140 328 196 344 Q198 366 150 368 Q96 370 88 358 Z" fill="#6a4a2c" />
      {Array.from({ length: 16 }, (_, i) => { const x = 96 + i * 6.3; const y = 352 + (i % 3) * 4 - 4; const c = ['#ff5d8f', '#ffd23f', '#b06cff', '#ff8a1f', '#fff'][i % 5]; return <g key={i}><circle cx={x} cy={y} r="3.2" fill={c} /><circle cx={x} cy={y} r="1.1" fill="#ffe680" /></g>; })}
      {[92, 120, 160, 190].map((x) => <circle key={x} cx={x} cy="364" r="3" fill="#3d9b3b" />)}
    </g>
  )],
];
const BACKYARD_SCENE = {
  id: 'backyard', title: 'Dream Backyard', view: [520, 380], mode: 'fixed', cardBg: '#73c04f',
  Background: BackyardBg, list: BACKYARD_ITEMS,
  spare: [[360, 270], [210, 200], [100, 250], [360, 120], [480, 130], [150, 130]],
  generic: (item) => ({ box: [-16, -26, 32, 38], draw: ({ item: it }) => <SceneSign item={it} c="#ffd84d" /> }),
};
