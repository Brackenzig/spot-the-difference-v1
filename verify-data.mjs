// Structural check for Lantern Market v2 (no DOM needed):
// 6 scenes x 7 diffs, unique ids, hotspots inside the 600x600 panel,
// one clock entry per scene, and every right-panel change marker on a prop
// (onlyLeft / onlyRight / dx / dy / *Alt / countAlt / puffsAlt / shortStalk /
// capOff / cupAlt) accounted for by a diff in the same scene.
// Usage: node verify-data.mjs  (run from spot-the-difference-v1/)
import { SCENES } from './game/src/scenes.js';
import { SCENE_TIME } from './game/src/config.js';

let failures = 0;
const fail = (msg) => { failures += 1; console.error('FAIL:', msg); };

if (SCENES.length !== 6) fail(`expected 6 scenes, got ${SCENES.length}`);
if (SCENE_TIME.length !== SCENES.length) {
  fail(`SCENE_TIME has ${SCENE_TIME.length} entries for ${SCENES.length} scenes`);
}
if (SCENE_TIME.some((t) => !Number.isFinite(t) || t <= 0)) fail('SCENE_TIME has a bad entry');

const CHANGE_KEYS = new Set([
  'onlyLeft', 'onlyRight', 'dx', 'dy', 'countAlt', 'puffsAlt',
  'shortStalk', 'capOff', 'cupAlt',
]);
const isChangeKey = (k) => CHANGE_KEYS.has(k) || k.endsWith('Alt');
const isChangeProp = (p) => Object.keys(p).some(isChangeKey) || (p.koi ?? []).some((k) => 'colorAlt' in k);

// Where the visible change of a prop actually is (differs from the prop
// origin for tall props: the change sits at the feature, not the base).
function changePoint(p) {
  switch (p.kind) {
    case 'tree': return { x: p.x - 30, y: p.y - 95 }; // blossom blob 0
    case 'bamboo': return { x: p.x + (p.shortStalk ?? 0) * 14, y: p.y - (p.h ?? 160) / 2 };
    case 'lighthouse': return { x: p.x, y: p.y - p.h - 8 }; // the lamp
    case 'house': return p.roofAlt !== undefined
      ? { x: p.x + p.w / 2, y: p.y - (p.roofH ?? 50) / 2 } // the roof
      : { x: p.x + p.w / 2, y: p.y + p.h / 2 };
    case 'moon': return { x: p.x, y: p.y };
    case 'boat': return { x: p.x + 10, y: p.y - 47 }; // flag / hull centre
    default: return { x: p.x ?? 0, y: p.y ?? 0 };
  }
}

for (const scene of SCENES) {
  if (scene.diffs.length !== 7) fail(`${scene.id}: expected 7 diffs, got ${scene.diffs.length}`);
  const ids = new Set(scene.diffs.map((d) => d.id));
  if (ids.size !== scene.diffs.length) fail(`${scene.id}: duplicate diff ids`);
  for (const d of scene.diffs) {
    for (const s of d.spots) {
      if (s.x < 0 || s.x > 600 || s.y < 0 || s.y > 600 || !(s.r > 0)) {
        fail(`${scene.id}/${d.id}: spot out of panel or bad radius ${JSON.stringify(s)}`);
      }
    }
  }
  // Every change-carrying prop must sit under at least one diff hotspot.
  // (A hotspot may cover several props; the pixel test proves each diff
  // actually changes pixels and nothing else does.)
  const changers = scene.props.filter(isChangeProp);
  for (const p of changers) {
    const { x: px, y: py } = changePoint(p);
    const covered = scene.diffs.some((d) => d.spots.some((s) => {
      // generous reach: hotspot radius + 60 covers moved/large props
      const dx = px - s.x;
      const dy = py - s.y;
      return dx * dx + dy * dy <= (s.r + 60) * (s.r + 60);
    }));
    if (!covered) fail(`${scene.id}: change prop ${p.kind} at (${px},${py}) has no diff hotspot nearby`);
  }
  console.log(`${scene.id}: ${scene.diffs.length} diffs, ${changers.length} change props, clock ${SCENE_TIME[SCENES.indexOf(scene)]}s`);
}

console.log(failures === 0 ? 'DATA OK: 6 scenes x 7 diffs' : `${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
