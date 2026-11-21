// Pointer and keyboard input: where a click lands in the logical playfield,
// which panel it is in, and whether it hits an unfound difference.
import { LAYOUT } from './config.js';
import { sceneOf, markFound, markMiss, useHint, nextScene, startGame, SCREEN_PLAY, SCREEN_CLEAR, SCREEN_TITLE, SCREEN_WIN, SCREEN_OVER } from './world.js';

/** Map a client (CSS pixel) point on the canvas to logical 1280x720 coords. */
export function toLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * 1280,
    y: ((clientY - rect.top) / rect.height) * 720,
  };
}

/** Which picture panel a logical point is in, and its panel-local coords. */
export function panelAt(x, y) {
  const { panelY, panelSize, leftX, rightX } = LAYOUT;
  if (y < panelY || y > panelY + panelSize) return null;
  if (x >= leftX && x <= leftX + panelSize) return { side: 'left', x: x - leftX, y: y - panelY };
  if (x >= rightX && x <= rightX + panelSize) return { side: 'right', x: x - rightX, y: y - panelY };
  return null;
}

/** The first still-unfound difference whose hotspot holds (px, py). */
export function diffAt(world, px, py) {
  for (const diff of sceneOf(world).diffs) {
    if (world.found.has(diff.id)) continue;
    for (const spot of diff.spots) {
      const dx = px - spot.x;
      const dy = py - spot.y;
      if (dx * dx + dy * dy <= spot.r * spot.r) return diff;
    }
  }
  return null;
}

/** A click at logical coords (x, y). Returns what happened, for the caller. */
export function clickAt(world, x, y) {
  if (world.screen === SCREEN_TITLE || world.screen === SCREEN_WIN || world.screen === SCREEN_OVER) {
    startGame(world);
    return 'start';
  }
  if (world.screen === SCREEN_CLEAR) {
    nextScene(world);
    return 'next';
  }
  if (world.screen !== SCREEN_PLAY) return 'none';
  const panel = panelAt(x, y);
  if (!panel) return 'none';
  const diff = diffAt(world, panel.x, panel.y);
  if (diff) {
    markFound(world, diff.id);
    return 'found';
  }
  markMiss(world);
  return 'miss';
}

/** Keyboard: H hint, N next scene, R / Enter restart or start. */
export function keyDown(world, key) {
  const k = key.toLowerCase();
  if (world.screen === SCREEN_PLAY && k === 'h') {
    useHint(world);
    return 'hint';
  }
  if (world.screen === SCREEN_PLAY && k === 'm') {
    world.magnifier = !world.magnifier;
    return 'magnifier';
  }
  if (world.screen === SCREEN_CLEAR && (k === 'n' || k === 'enter' || k === ' ')) {
    nextScene(world);
    return 'next';
  }
  if ((world.screen === SCREEN_TITLE || world.screen === SCREEN_WIN || world.screen === SCREEN_OVER) && (k === 'enter' || k === ' ' || k === 'r')) {
    startGame(world);
    return 'start';
  }
  if (world.screen === SCREEN_PLAY && k === 'r') {
    startGame(world);
    return 'start';
  }
  return 'none';
}
