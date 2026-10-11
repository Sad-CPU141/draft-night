/* ============================================================
   SCENE: DREAM HOUSE — a mansion estate seen from above (520 × 380)
   The mansion, driveway, roundabout and garden paths are background. Every
   selectable feature has its own designed spot, so any combination fits
   without overlaps and nothing ever covers the house.
   ============================================================ */
function HouseBg() {
  return (
    <g>
      <rect width="520" height="380" fill={SC.grass} />
      {Array.from({ length: 14 }, (_, i) => <rect key={i} x={i * 40} y="44" width="20" height="336" fill={SC.grass2} />)}
      {/* neighbouring land along the top (the private beach goes here) */}
      <rect width="520" height="44" fill="#5aa63e" />
      {[[30, 18], [90, 24], [160, 14], [250, 22], [330, 16], [410, 24], [490, 16]].map(([x, y], i) => <TreeTop key={i} x={x} y={y} r={11} c="#3b8f37" />)}
      {/* estate hedge */}
      <rect x="6" y="42" width="508" height="334" rx="10" fill="none" stroke={SC.hedge} strokeWidth="7" />
      <rect x="6" y="42" width="508" height="334" rx="10" fill="none" stroke={SC.hedge2} strokeWidth="3" strokeDasharray="6 5" />
      {/* pool terrace behind the house */}
      <rect x="164" y="48" width="184" height="72" rx="6" fill={SC.pave} />
      <rect x="164" y="48" width="184" height="72" rx="6" fill="none" stroke={SC.pave2} strokeWidth="1" />
      {/* driveway: gate → roundabout → front door, plus parking bays */}
      <path d="M248 380 L248 290 L272 290 L272 380 Z" fill={SC.pave} />
      <circle cx="260" cy="258" r="40" fill={SC.pave} />
      <circle cx="260" cy="258" r="22" fill={SC.grass2} stroke={SC.pave2} strokeWidth="1.5" />
      <rect x="248" y="206" width="24" height="20" fill={SC.pave} />
      <rect x="192" y="280" width="42" height="58" rx="5" fill={SC.pave} /><rect x="286" y="280" width="42" height="58" rx="5" fill={SC.pave} />
      {[192, 286].map((x) => <path key={x} d={'M' + (x + 4) + ' 284 H' + (x + 38) + ' M' + (x + 4) + ' 334 H' + (x + 38)} stroke="#fff" strokeWidth="1" opacity=".7" />)}
      <path d="M234 300 H248 M272 300 H286" stroke={SC.pave} strokeWidth="10" />
      {/* garden paths */}
      <path d="M170 160 H180 M222 258 Q160 262 130 205 Q112 170 106 150 M298 258 Q350 250 352 216" fill="none" stroke={SC.path} strokeWidth="7" strokeLinecap="round" />
      <path d="M340 70 H392 M164 86 H120 Q86 86 70 110 M440 78 H418 M232 120 V116 M488 118 V120" fill="none" stroke={SC.path} strokeWidth="6" strokeLinecap="round" />
      {/* the mansion (hip roof from above) */}
      <rect x="184" y="122" width="160" height="96" rx="2" fill={SC.shadow} />
      <rect x="180" y="118" width="160" height="94" rx="2" fill={SC.roof} stroke={SC.line} strokeWidth="1" />
      <path d="M180 118 L218 152 L302 152 L340 118 Z" fill={SC.roof3} />
      <path d="M180 212 L218 178 L302 178 L340 212 Z" fill={SC.roof2} />
      <path d="M180 118 L218 152 L218 178 L180 212 Z" fill="#717890" />
      <path d="M218 152 L302 152 L302 178 L218 178 Z" fill={SC.roof} />
      <path d="M180 118 L218 152 M340 118 L302 152 M180 212 L218 178 M340 212 L302 178 M218 165 H302" stroke="rgba(255,255,255,.25)" strokeWidth="1" />
      <rect x="196" y="130" width="10" height="10" fill="#9b5b45" stroke={SC.line} strokeWidth=".6" />
      <rect x="244" y="206" width="32" height="12" rx="2" fill="#efe9dd" stroke={SC.line} strokeWidth=".6" />
      {/* lanterns and a few fixed trees */}
      {[[118, 212, 10], [158, 238, 9], [362, 238, 9], [438, 252, 7], [100, 262, 8], [334, 96, 7], [150, 112, 8]].map(([x, y, r], i) => <TreeTop key={i} x={x} y={y} r={r} c={i % 2 ? '#3f9b3b' : '#47a242'} />)}
    </g>
  );
}

const HOUSE_ITEMS = [
  ['Private Beach', [0, 0, 520, 42], 1, () => (
    <g>
      <rect width="520" height="42" fill={SC.sand} />
      <path d="M0 0 H520 V14 Q490 20 460 14 T400 14 T340 14 T280 14 T220 14 T160 14 T100 14 T40 14 T0 14 Z" fill={SC.water2} />
      <path d="M0 0 H520 V8 Q490 13 460 8 T400 8 T340 8 T280 8 T220 8 T160 8 T100 8 T40 8 T0 8 Z" fill={SC.water} />
      <path d="M10 15 Q40 21 70 15 M130 15 Q160 21 190 15 M300 15 Q330 21 360 15 M430 15 Q460 21 490 15" stroke="#fff" strokeWidth="1.5" fill="none" opacity=".8" />
      {[[60, 30, '#ff5d5d'], [180, 28, '#ffd84d'], [380, 30, '#52c6ef']].map(([x, y, c], i) => (
        <g key={i}>
          <rect x={x + 6} y={y - 3} width="14" height="7" rx="2" fill="#fff" stroke={SC.line} strokeWidth=".5" />
          <circle cx={x + 2} cy={y + 2} r="9" fill={SC.shadow} />
          <circle cx={x} cy={y} r="9" fill={c} stroke={SC.line} strokeWidth=".6" />
          <path d={'M' + (x - 9) + ' ' + y + ' H' + (x + 9) + ' M' + x + ' ' + (y - 9) + ' V' + (y + 9)} stroke="#fff" strokeWidth="1.4" />
        </g>
      ))}
      <TreeTop x={470} y={28} r={9} c="#4aa84a" />
      <TreeTop x={270} y={30} r={7} c="#4aa84a" />
    </g>
  )],
  ['Guest House', [16, 50, 92, 62], 2, () => (
    <g>
      <rect x="26" y="58" width="72" height="46" rx="2" fill={SC.shadow} />
      <rect x="22" y="54" width="72" height="46" rx="2" fill="#c96c4f" stroke={SC.line} strokeWidth=".8" />
      <path d="M22 77 H94" stroke="#a9563e" strokeWidth="2" />
      <path d="M22 54 H94 V77 H22 Z" fill="#d97c5e" />
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={'M' + (22 + i * 12) + ' 54 V100'} stroke="rgba(0,0,0,.08)" strokeWidth="1" />)}
      <rect x="76" y="58" width="8" height="8" fill="#7d4434" />
      <rect x="44" y="100" width="18" height="8" rx="1" fill={SC.path} />
    </g>
  )],
  ['Outdoor Kitchen', [120, 56, 54, 48], 3, () => (
    <g>
      <ShRect x={124} y={60} w={44} h={14} />
      <ShRect x={124} y={60} w={14} h={38} />
      <path d="M124 60 H168 V74 H138 V98 H124 Z" fill="#9aa1ab" stroke={SC.line} strokeWidth=".8" />
      <rect x="142" y="63" width="18" height="8" rx="1" fill="#2b2f36" />
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={'M' + (144 + i * 3.4) + ' 63 V71'} stroke="#7a7f88" strokeWidth=".8" />)}
      <rect x="127" y="78" width="8" height="10" rx="2" fill="#cfe9f6" stroke="#7a8a95" strokeWidth=".6" />
      {[[150, 86], [161, 86], [150, 96]].map(([x, y], i) => <g key={i}><circle cx={x + 1.5} cy={y + 2} r="4" fill={SC.shadow} /><circle cx={x} cy={y} r="4" fill={SC.wood} stroke={SC.line} strokeWidth=".6" /></g>)}
    </g>
  )],
  ['Infinity Pool', [188, 50, 142, 54], 3, () => (
    <g>
      <rect x="190" y="54" width="136" height="44" rx="3" fill="#e9e4da" />
      <rect x="194" y="58" width="128" height="36" rx="2" fill={SC.water} />
      <rect x="194" y="58" width="128" height="6" fill={SC.water2} />
      <path d="M200 74 Q210 70 220 74 T240 74 M250 84 Q260 80 270 84 T290 84 M280 70 Q290 66 300 70" stroke="#fff" strokeWidth="1.2" fill="none" opacity=".8" />
      <path d="M194 58 H322" stroke="#cfeefa" strokeWidth="1.5" />
      {[[204, 102], [236, 102], [268, 102]].map(([x, y], i) => <g key={i}><rect x={x + 2} y={y - 1} width="22" height="7" rx="2" fill={SC.shadow} /><rect x={x} y={y - 3} width="22" height="7" rx="2" fill="#fff" stroke={SC.line} strokeWidth=".5" /><rect x={x} y={y - 3} width="7" height="7" rx="2" fill="#ffd84d" /></g>)}
    </g>
  )],
  ['Waterslide', [166, 46, 28, 66], 4, () => (
    <g>
      <rect x="170" y="98" width="20" height="12" rx="3" fill={SC.water} stroke="#e9e4da" strokeWidth="2" />
      <ShRect x={168} y={48} w={16} h={16} />
      <rect x="168" y="48" width="16" height="16" rx="2" fill="#f2f2f2" stroke={SC.line} strokeWidth=".8" />
      <path d="M176 56 C196 60 160 72 178 80 C196 88 168 94 180 104" fill="none" stroke="#ffcf3a" strokeWidth="7" strokeLinecap="round" />
      <path d="M176 56 C196 60 160 72 178 80 C196 88 168 94 180 104" fill="none" stroke="#ff9f1a" strokeWidth="2" strokeLinecap="round" opacity=".7" />
    </g>
  )],
  ['Hot Tub', [336, 54, 42, 42], 4, () => (
    <g>
      <ShCircle cx={357} cy={75} r={18} />
      <circle cx="357" cy="75" r="18" fill="#c99a6a" stroke={SC.line} strokeWidth=".8" />
      <circle cx="357" cy="75" r="13" fill="#63d3f3" />
      {[[351, 70], [362, 72], [355, 80], [364, 80], [348, 78]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.8" fill="#fff" opacity=".85" />)}
    </g>
  )],
  ['Fire Pit', [384, 54, 48, 48], 4, () => (
    <g>
      {[[-14, -10], [14, -10], [-14, 12], [14, 12]].map(([a, b], i) => <g key={i}><rect x={408 + a - 5 + 2} y={78 + b - 5 + 2} width="10" height="10" rx="2" fill={SC.shadow} /><rect x={408 + a - 5} y={78 + b - 5} width="10" height="10" rx="2" fill="#d9a066" stroke={SC.line} strokeWidth=".6" /></g>)}
      <ShCircle cx={408} cy={78} r={9} />
      <circle cx="408" cy="78" r="9" fill="#8a837a" stroke={SC.line} strokeWidth=".8" />
      <circle cx="408" cy="78" r="6" fill="#ff7a1a" /><circle cx="408" cy="78" r="3.5" fill="#ffd23f" />
    </g>
  )],
  ['Helipad', [436, 38, 80, 80], 5, () => (
    <g>
      <ShCircle cx={475} cy={78} r={32} />
      <circle cx="475" cy="78" r="32" fill="#5b5f68" stroke={SC.line} strokeWidth="1" />
      <circle cx="475" cy="78" r="27" fill="none" stroke="#ffd23f" strokeWidth="2" />
      <path d="M465 66 V90 M485 66 V90 M465 78 H485" stroke="#fff" strokeWidth="3" />
      <g transform="rotate(-25 475 78)">
        <ellipse cx="478" cy="82" rx="7" ry="11" fill={SC.shadow} />
        <rect x="473.5" y="84" width="3" height="20" rx="1.5" fill="#d4d8de" stroke={SC.line} strokeWidth=".5" />
        <ellipse cx="475" cy="78" rx="7" ry="11" fill="#f4f6f8" stroke={SC.line} strokeWidth=".7" />
        <ellipse cx="475" cy="72" rx="5" ry="4.5" fill="#2a3b4d" />
        <path d="M451 74 L499 82 M471 54 L479 102" stroke="#2a2a2f" strokeWidth="2" strokeLinecap="round" />
        <circle cx="475" cy="78" r="2" fill="#2a2a2f" />
      </g>
    </g>
  )],
  ['Rooftop Terrace', [226, 132, 68, 50], 6, () => (
    <g>
      <rect x="230" y="138" width="60" height="40" rx="2" fill={SC.shadow} />
      <rect x="228" y="134" width="64" height="44" rx="2" fill="#c89a68" stroke={SC.line} strokeWidth=".8" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={'M228 ' + (139 + i * 5) + ' H292'} stroke="rgba(0,0,0,.12)" strokeWidth=".8" />)}
      <rect x="228" y="134" width="64" height="44" rx="2" fill="none" stroke="#e9eef2" strokeWidth="2" />
      {[[245, 150, '#ff6b6b'], [276, 162, '#52c6ef']].map(([x, y, c], i) => <g key={i}><circle cx={x + 2} cy={y + 2} r="8" fill={SC.shadow} /><circle cx={x} cy={y} r="8" fill={c} stroke={SC.line} strokeWidth=".5" /><circle cx={x} cy={y} r="1.5" fill="#fff" /></g>)}
      {[[234, 172], [286, 140]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.5" fill="#3d9a3a" />)}
    </g>
  )],
  ['10-Car Garage', [94, 120, 80, 66], 3, () => (
    <g>
      <rect x="102" y="128" width="70" height="56" rx="2" fill={SC.shadow} />
      <rect x="98" y="124" width="70" height="56" rx="2" fill="#a3a8b4" stroke={SC.line} strokeWidth=".8" />
      <rect x="102" y="128" width="62" height="48" rx="1" fill="#b3b8c3" />
      {[0, 1, 2].map((i) => <rect key={i} x={108 + i * 18} y="134" width="12" height="7" rx="1" fill="#cfe6f2" opacity=".85" />)}
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={166} y={128 + i * 10} width="4" height="8" fill="#5e636e" />)}
      <rect x="166" y="124" width="6" height="56" fill="none" />
    </g>
  )],
  ['Treehouse', [16, 118, 76, 72], 3, () => (
    <g>
      <TreeTop x={52} y={154} r={30} c="#36913a" />
      <rect x="44" y="134" width="22" height="20" rx="1" fill={SC.shadow} transform="translate(2 2)" />
      <rect x="40" y="132" width="24" height="22" rx="1" fill={SC.wood} stroke={SC.line} strokeWidth=".8" />
      <path d="M40 132 L52 140 L64 132 M40 154 L52 146 L64 154" stroke={SC.wood2} strokeWidth="1.5" fill="none" />
      <path d="M64 150 L80 176" stroke="#e7d2a3" strokeWidth="2" strokeDasharray="2 2" />
    </g>
  )],
  ['Home Cinema', [348, 120, 50, 44], 4, () => (
    <GlassPavilion x={350} y={122} w={46} h={40} tint="#2d2842">
      <rect x="356" y="127" width="34" height="6" rx="1" fill="#e8f2ff" />
      {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={r + '-' + c} x={357 + c * 8} y={138 + r * 7} width="6" height="5" rx="1.5" fill="#d33a4a" />))}
    </GlassPavilion>
  )],
  ['Home Gym', [402, 120, 50, 44], 4, () => (
    <GlassPavilion x={404} y={122} w={46} h={40} tint="#dfe7ee">
      <rect x="410" y="128" width="9" height="22" rx="2" fill="#3a3f48" /><rect x="411.5" y="131" width="6" height="15" fill="#5b6270" />
      <path d="M426 134 H444 M426 142 H444 M426 150 H444" stroke="#3a3f48" strokeWidth="2" />
      {[134, 142, 150].map((y) => <g key={y}><circle cx="426" cy={y} r="2.6" fill="#22252b" /><circle cx="444" cy={y} r="2.6" fill="#22252b" /></g>)}
      <rect x="410" y="152" width="14" height="5" rx="1" fill="#e2463b" />
    </GlassPavilion>
  )],
  ['Gaming Room', [348, 168, 50, 44], 4, () => (
    <GlassPavilion x={350} y={170} w={46} h={40} tint="#3a2a63">
      <rect x="356" y="175" width="34" height="9" rx="1" fill="#57e6ff" />
      <rect x="356" y="175" width="34" height="9" rx="1" fill="none" stroke="#c04dff" strokeWidth="1.2" />
      <rect x="358" y="194" width="30" height="9" rx="3" fill="#7d55d9" />
      <path d="M368 188 h4 m-2 -2 v4 M378 188 h1 M381 188 h1" stroke="#fff" strokeWidth="1.2" />
    </GlassPavilion>
  )],
  ['Music Studio', [402, 168, 50, 44], 4, () => (
    <GlassPavilion x={404} y={170} w={46} h={40} tint="#2b2f3a">
      <rect x="410" y="176" width="34" height="10" rx="1" fill="#f4f4f4" />
      {Array.from({ length: 6 }, (_, i) => <rect key={i} x={412 + i * 5.4} y="176" width="2.6" height="6" fill="#1c1c1f" />)}
      <circle cx="414" cy="198" r="4.5" fill="#1c1c1f" stroke="#888" strokeWidth=".8" /><circle cx="440" cy="198" r="4.5" fill="#1c1c1f" stroke="#888" strokeWidth=".8" />
      <circle cx="414" cy="198" r="1.6" fill="#888" /><circle cx="440" cy="198" r="1.6" fill="#888" />
      <path d="M422 200 Q427 190 432 200" stroke="#ffd23f" strokeWidth="1.5" fill="none" />
    </GlassPavilion>
  )],
  ['Tennis Court', [454, 120, 62, 128], 3, () => (
    <g>
      <ShRect x={456} y={122} w={58} h={122} />
      <rect x="456" y="122" width="58" height="122" rx="2" fill="#3f7fb8" stroke={SC.line} strokeWidth=".8" />
      <rect x="464" y="134" width="42" height="98" fill="#2f9e6b" />
      <g stroke="#fff" strokeWidth="1.2" fill="none">
        <rect x="464" y="134" width="42" height="98" /><path d="M469 134 V232 M501 134 V232 M469 160 H501 M469 206 H501 M485 160 V206" />
      </g>
      <path d="M460 183 H510" stroke="#e8e8e8" strokeWidth="2.4" /><path d="M460 183 H510" stroke="#555" strokeWidth=".6" strokeDasharray="1.5 1.5" />
      <circle cx="492" cy="170" r="1.8" fill="#e6ff4a" />
    </g>
  )],
  ['Hedge Maze', [14, 192, 80, 74], 3, () => (
    <g>
      <ShRect x={18} y={196} w={70} h={64} />
      <rect x="18" y="196" width="70" height="64" rx="2" fill="#bfe08f" />
      <g stroke={SC.hedge} strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M20 198 H86 V258 H20 V214" /><path d="M32 210 H74 V246 H44 V222 H62 V234" /><path d="M32 210 V246 M74 226 H86" />
      </g>
      <circle cx="53" cy="228" r="3" fill="#ffd84d" />
    </g>
  )],
  ['Football Pitch', [16, 274, 168, 100], 3, () => (
    <g>
      <ShRect x={20} y={278} w={160} h={92} />
      <rect x="20" y="278" width="160" height="92" rx="2" fill="#3fa14a" />
      {Array.from({ length: 8 }, (_, i) => <rect key={i} x={20 + i * 20} y="278" width="10" height="92" fill="#48ad52" />)}
      <g stroke="#fff" strokeWidth="1.4" fill="none">
        <rect x="26" y="284" width="148" height="80" /><path d="M100 284 V364" /><circle cx="100" cy="324" r="12" />
        <rect x="26" y="306" width="18" height="36" /><rect x="156" y="306" width="18" height="36" />
      </g>
      <rect x="21" y="316" width="5" height="16" fill="#fff" opacity=".9" /><rect x="174" y="316" width="5" height="16" fill="#fff" opacity=".9" />
      <circle cx="112" cy="330" r="2.4" fill="#fff" stroke="#222" strokeWidth=".6" />
    </g>
  )],
  ['Fountain', [238, 236, 44, 44], 5, () => (
    <g>
      <ShCircle cx={260} cy={258} r={17} />
      <circle cx="260" cy="258" r="17" fill="#d8d3ca" stroke={SC.line} strokeWidth=".8" />
      <circle cx="260" cy="258" r="13" fill={SC.water} />
      <circle cx="260" cy="258" r="6" fill="#e9e4da" stroke={SC.line} strokeWidth=".5" />
      <circle cx="260" cy="258" r="3" fill="#bdf0ff" />
      {[0, 60, 120, 180, 240, 300].map((a) => <circle key={a} cx={260 + 9.5 * Math.cos(a * Math.PI / 180)} cy={258 + 9.5 * Math.sin(a * Math.PI / 180)} r="1.2" fill="#fff" />)}
    </g>
  )],
  ['Supercar', [198, 284, 30, 52], 5, () => <CarTop x={213} y={309} w={22} h={44} c="#e2252b" low />],
  ['Luxury SUV', [290, 282, 34, 56], 5, () => <CarTop x={307} y={309} w={25} h={48} c="#22262e" suv />],
  ['Security Gate', [214, 352, 92, 28], 6, () => (
    <g>
      <rect x="226" y="362" width="12" height="12" fill={SC.shadow} />
      <rect x="222" y="358" width="14" height="14" rx="1" fill="#efe9dd" stroke={SC.line} strokeWidth=".8" />
      <rect x="284" y="358" width="14" height="14" rx="1" fill="#efe9dd" stroke={SC.line} strokeWidth=".8" />
      <path d="M236 364 H284" stroke="#2a2a2f" strokeWidth="3" />
      {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={240 + i * 5} cy="364" r="1.2" fill="#d4af37" />)}
      <rect x="300" y="354" width="10" height="10" rx="1" fill="#5b6270" stroke={SC.line} strokeWidth=".6" />
      <circle cx="229" cy="365" r="2" fill="#ffd23f" /><circle cx="291" cy="365" r="2" fill="#ffd23f" />
    </g>
  )],
  ['Basketball Court', [340, 256, 94, 64], 3, () => (
    <g>
      <ShRect x={342} y={258} w={90} h={60} />
      <rect x="342" y="258" width="90" height="60" rx="2" fill="#e08a3c" stroke={SC.line} strokeWidth=".8" />
      <g stroke="#fff" strokeWidth="1.2" fill="none">
        <rect x="346" y="262" width="82" height="52" /><path d="M387 262 V314" /><circle cx="387" cy="288" r="7" />
        <rect x="346" y="279" width="14" height="18" /><rect x="414" y="279" width="14" height="18" />
        <path d="M346 270 Q372 288 346 306 M428 270 Q402 288 428 306" />
      </g>
      <circle cx="350" cy="288" r="2.5" fill="none" stroke="#ff5a1f" strokeWidth="1.4" /><circle cx="424" cy="288" r="2.5" fill="none" stroke="#ff5a1f" strokeWidth="1.4" />
      <circle cx="395" cy="300" r="2.6" fill="#ff7b29" stroke="#3a1a08" strokeWidth=".6" />
    </g>
  )],
  ['Mini Golf', [444, 260, 72, 114], 3, () => (
    <g>
      <ShRect x={446} y={262} w={66} h={108} r={6} />
      <rect x="446" y="262" width="66" height="108" rx="6" fill="#bfe08f" />
      <path d="M458 274 H500 V300 H462 V326 H500 V356" fill="none" stroke="#2fb35a" strokeWidth="12" strokeLinejoin="round" />
      <path d="M458 274 H500 V300 H462 V326 H500 V356" fill="none" stroke="#7d5b3a" strokeWidth="14" strokeLinejoin="round" opacity=".25" transform="translate(0 1)" />
      <ellipse cx="480" cy="313" rx="9" ry="5" fill={SC.water} />
      <circle cx="500" cy="356" r="2.4" fill="#111" /><path d="M500 356 V342" stroke="#eee" strokeWidth="1" /><path d="M500 342 L507 345 L500 348 Z" fill={SC.red} />
      <circle cx="460" cy="274" r="2" fill="#fff" stroke="#999" strokeWidth=".5" />
    </g>
  )],
];
const HOUSE_SCENE = {
  id: 'house', title: 'Dream House', view: [520, 380], mode: 'fixed', cardBg: SC.grass,
  Background: HouseBg, list: HOUSE_ITEMS,
  // Items the art doesn't cover (a custom item added to the topic) get a sign on spare lawn.
  spare: [[140, 232], [330, 236], [430, 248], [110, 100], [150, 200], [192, 236]],
  generic: (item) => ({ box: [-16, -26, 32, 38], draw: ({ item: it }) => <SceneSign item={it} /> }),
};
