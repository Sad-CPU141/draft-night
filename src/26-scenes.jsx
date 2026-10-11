/* ============================================================
   BUILDABLE SCENES — the shared system (Batch 1)

   A topic opts in with `scene: '<id>'`. Each scene (26-art-*.jsx) declares:
     id, title, view [w, h], Background, list of items, and a placement mode:
     · 'fixed' — every item has its own designed spot, drawn in scene coordinates
       (house, backyard, outfit). `list` rows are [name, box [x,y,w,h], z, draw].
     · 'slot'  — items are drawn around (0,0) and placed in spots chosen by their
       slot/category (the meal tray). `spots` maps a category to [x, y] anchors.
   Item art is looked up by a normalised item NAME (stable across devices and
   topic edits). Anything the art doesn't cover gets a sensible stand-in, so a
   custom item can never break a scene.
   Nothing about a scene is stored or synced: a team's picture is rebuilt from
   the items it owns in the game state, so online play, refreshes and undo just work.
   To add a scene later (pizza, garage, zoo…): write its art file, add it to
   SCENES below, and set `scene` on the topic.
   ============================================================ */
const sceneKey = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
const SCENES = (() => {
  const all = { house: HOUSE_SCENE, backyard: BACKYARD_SCENE, outfit: OUTFIT_SCENE, tray: TRAY_SCENE };
  Object.values(all).forEach((s) => { s.index = {}; s.list.forEach(([name, box, z, draw, cat]) => { s.index[sceneKey(name)] = { name, box, z, draw, cat }; }); });
  return all;
})();
const sceneOf = (topic) => (topic && topic.scene && SCENES[topic.scene]) || null;
const sceneHasArt = (topic, item) => { const s = sceneOf(topic); return !!(s && item && s.index[sceneKey(item.name)]); };

// Where each owned item goes. entries: [{ item, slot }] → drawable placements, back to front.
function placeScene(scene, entries) {
  const out = []; const used = {}; let spare = 0;
  entries.forEach(({ item, slot }, i) => {
    const id = item.id || item.name + i;
    const def = scene.index[sceneKey(item.name)];
    if (scene.mode === 'fixed') {
      if (def) { out.push({ id, item, z: def.z, box: def.box, draw: def.draw }); return; }
      const g = scene.generic(item, slot);
      if (g.absolute) { out.push({ id, item, z: g.z, box: g.box, draw: g.draw }); return; }
      const at = scene.spare[spare++ % scene.spare.length];
      out.push({ id, item, z: 50 + at[1] / 100, at, box: g.box, draw: g.draw });
      return;
    }
    const cat = (def && def.cat) || scene.catOf(slot) || scene.catOf(item.pos) || 'extra';
    const list = scene.spots[cat] || [];
    const n = used[cat] || 0; used[cat] = n + 1;
    const at = list[n] || scene.spots.extra[spare++ % scene.spots.extra.length];
    const g = def ? null : scene.generic(item, cat);
    out.push({ id, item, z: 10 + at[1] / 100, at, box: def ? def.box : g.box, draw: def ? def.draw : g.draw });
  });
  return out.sort((a, b) => a.z - b.z);
}
// The bounding box of a placement, in scene coordinates.
const placedBox = (p) => (p.at ? [p.at[0] + p.box[0], p.at[1] + p.box[1], p.box[2], p.box[3]] : p.box);

function SceneCanvas({ scene, placed, highlight, label, className, viewBox, fill }) {
  const [w, h] = scene.view; const Bg = scene.Background; const Fg = scene.Foreground;
  return (
    <svg className={'scene' + (h > w ? ' tall' : '') + (className ? ' ' + className : '')} viewBox={viewBox || '0 0 ' + w + ' ' + h} role="img" aria-label={label} preserveAspectRatio={fill ? 'xMidYMid slice' : 'xMidYMid meet'}>
      <Bg />
      {placed.map((p) => {
        const D = p.draw; const b = placedBox(p); const isNew = highlight && p.id === highlight;
        const body = <g className={isNew ? 'sc-new' : undefined} style={isNew ? { transformOrigin: (b[0] + b[2] / 2) + 'px ' + (b[1] + b[3] / 2) + 'px' } : undefined}><D item={p.item} /></g>;
        return (
          <g key={p.id} data-item={p.item.name}>
            {p.at ? <g transform={'translate(' + p.at[0] + ' ' + p.at[1] + ')'}>{body}</g> : body}
            {isNew && <ellipse className="sc-glow" cx={b[0] + b[2] / 2} cy={b[1] + b[3] / 2} rx={b[2] / 2 + 6} ry={b[3] / 2 + 6} />}
          </g>
        );
      })}
      {Fg && <Fg />}
    </svg>
  );
}
// A team's build (from the draft state).
function SceneView({ d, m, highlight, className }) {
  const scene = sceneOf(d.topic); if (!scene) return null;
  const entries = m.team.map((t, k) => (t && d.items[t.itemId] ? { item: { ...d.items[t.itemId], id: t.itemId }, slot: d.rules.slots[k] } : null)).filter(Boolean);
  const placed = placeScene(scene, entries);
  const label = m.name + '’s ' + scene.title.toLowerCase() + (entries.length ? ': ' + entries.map((e) => e.item.name).join(', ') : ' (empty so far)');
  return <SceneCanvas scene={scene} placed={placed} highlight={highlight} label={label} className={className} />;
}
// One item, cropped from its scene: used as the item's picture on cards and lists.
function SceneArt({ topic, item, size, box: boxStyle }) {
  const scene = sceneOf(topic);
  const placed = placeScene(scene, [{ item: { ...item, id: item.id || 'x' }, slot: item.pos }]);
  const b = placedBox(placed[0]);
  // Fill the card with the item (zoomed in on long items like the beach or a tennis court).
  const vb = [b[0] - 5, b[1] - 5, b[2] + 10, b[3] + 10].map((v) => Math.round(v * 10) / 10).join(' ');
  return <span style={{ ...boxStyle, display: 'block', background: scene.cardBg }}><SceneCanvas scene={scene} placed={placed} viewBox={vb} label={item.name} className="scene-art" fill /></span>;
}
