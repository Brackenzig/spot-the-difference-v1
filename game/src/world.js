// The game state and its transitions: screens, scenes, finds, hints, timer
// and score. Rendering and input live in their own files; this one only
// decides what is true about the game right now.
import { SCENES } from './scenes.js';
import { SCENE_TIME, HINTS_PER_SCENE, HINT_COST_SECONDS, MISS_COST_SECONDS, POINTS_FIND, POINTS_TIME_BONUS, POINTS_HINT_LEFT, BEST_KEY } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

export function freshWorld() {
  return {
    screen: SCREEN_TITLE,
    sceneIndex: 0,
    found: new Set(),
    foundOrder: [],
    timeLeft: SCENE_TIME[0],
    hintsLeft: HINTS_PER_SCENE,
    hintAt: null, // { diffId, until } while a hint ring is showing
    score: 0,
    misses: 0,
    finds: 0,
    message: '',
    messageUntil: 0,
    now: 0,
    best: 0,
    sceneBonus: 0,
    mouse: null, // last pointer position in logical coords, or null
    magnifier: true, // 2x lens following the pointer while playing
  };
}

export function sceneOf(world) {
  return SCENES[world.sceneIndex];
}

export function foundCount(world) {
  return world.found.size;
}

export function totalDiffs(world) {
  return sceneOf(world).diffs.length;
}

export function loadBest(world) {
  try {
    world.best = Number(localStorage.getItem(BEST_KEY) ?? 0) || 0;
  } catch {
    world.best = 0;
  }
}

export function saveBest(world) {
  if (world.score > world.best) {
    world.best = world.score;
    try {
      localStorage.setItem(BEST_KEY, String(world.best));
    } catch {
      // Private mode: the score just does not persist.
    }
  }
}

export function startGame(world) {
  world.screen = SCREEN_PLAY;
  world.sceneIndex = 0;
  world.found = new Set();
  world.foundOrder = [];
  world.timeLeft = SCENE_TIME[0];
  world.hintsLeft = HINTS_PER_SCENE;
  world.hintAt = null;
  world.score = 0;
  world.misses = 0;
  world.finds = 0;
  world.message = 'Find 7 differences — click either picture.';
  world.messageUntil = world.now + 4;
}

function clearScene(world) {
  const timeBonus = Math.round(world.timeLeft) * POINTS_TIME_BONUS;
  const hintBonus = world.hintsLeft * POINTS_HINT_LEFT;
  world.sceneBonus = timeBonus + hintBonus;
  world.score += world.sceneBonus;
  world.screen = SCREEN_CLEAR;
  world.message = '';
}

/** The player clicked a difference that is still unfound. */
export function markFound(world, diffId) {
  if (world.screen !== SCREEN_PLAY || world.found.has(diffId)) return false;
  const diff = sceneOf(world).diffs.find((d) => d.id === diffId);
  if (!diff) return false;
  world.found.add(diffId);
  world.foundOrder.push(diffId);
  world.finds += 1;
  world.score += POINTS_FIND;
  world.message = `Found: ${diff.label}  +${POINTS_FIND}`;
  world.messageUntil = world.now + 2.5;
  if (world.found.size >= sceneOf(world).diffs.length) clearScene(world);
  return true;
}

/** The player clicked somewhere with no unfound difference. */
export function markMiss(world) {
  if (world.screen !== SCREEN_PLAY) return;
  world.misses += 1;
  world.timeLeft = Math.max(0, world.timeLeft - MISS_COST_SECONDS);
  world.message = `Not a difference  −${MISS_COST_SECONDS}s`;
  world.messageUntil = world.now + 2;
}

/** Spend one hint: ring the first still-unfound difference for a moment. */
export function useHint(world) {
  if (world.screen !== SCREEN_PLAY || world.hintsLeft <= 0) return false;
  const next = sceneOf(world).diffs.find((d) => !world.found.has(d.id));
  if (!next) return false;
  world.hintsLeft -= 1;
  world.timeLeft = Math.max(0, world.timeLeft - HINT_COST_SECONDS);
  world.hintAt = { diffId: next.id, until: world.now + 2.5 };
  world.message = `Hint: look near "${next.label}"`;
  world.messageUntil = world.now + 2.5;
  return true;
}

export function nextScene(world) {
  if (world.screen !== SCREEN_CLEAR) return;
  if (world.sceneIndex + 1 >= SCENES.length) {
    world.screen = SCREEN_WIN;
    saveBest(world);
    return;
  }
  world.sceneIndex += 1;
  world.found = new Set();
  world.foundOrder = [];
  world.timeLeft = SCENE_TIME[world.sceneIndex];
  world.hintsLeft = HINTS_PER_SCENE;
  world.hintAt = null;
  world.screen = SCREEN_PLAY;
  world.message = `Scene ${world.sceneIndex + 1}: ${sceneOf(world).name} — find ${sceneOf(world).diffs.length} differences.`;
  world.messageUntil = world.now + 4;
}

/** Advance the clock; the scene ends when it runs out. */
export function tick(world, dt) {
  world.now += dt;
  if (world.screen === SCREEN_PLAY) {
    world.timeLeft -= dt;
    if (world.timeLeft <= 0) {
      world.timeLeft = 0;
      world.screen = SCREEN_OVER;
      saveBest(world);
    }
  }
  if (world.hintAt && world.now >= world.hintAt.until) world.hintAt = null;
}
