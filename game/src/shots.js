// The screenshot scenes behind ?shot=cover|scene2|hint|win. Each one puts the
// game into a real, fixed state — a scene mid-hunt with some differences
// already found, the counter and the clock showing — so the frame is what a
// player really sees, and the same shot always gives the same frame.
import { SCENES } from './scenes.js';
import { SCENE_TIME, HINTS_PER_SCENE } from './config.js';
import { SCREEN_PLAY, SCREEN_WIN } from './world.js';

function setScene(world, index, foundIds, timeLeft, hintsLeft) {
  world.screen = SCREEN_PLAY;
  world.sceneIndex = index;
  world.found = new Set(foundIds);
  world.foundOrder = [...foundIds];
  world.timeLeft = timeLeft;
  world.hintsLeft = hintsLeft;
  world.hintAt = null;
  world.score = foundIds.length * 100;
  world.misses = 0;
  world.finds = foundIds.length;
  world.message = '';
  world.messageUntil = 0;
  world.now = 1.0; // Fixed clock so the hint pulse is deterministic.
}

/**
 * Put `world` into the named shot and return nothing; the renderer draws it.
 * Unknown names stage the cover.
 */
export function stageShot(name, world) {
  if (name === 'scene2') {
    setScene(world, 1, ['d2', 'd4'], 105, 2);
    world.score = 200;
    return;
  }
  if (name === 'hint') {
    setScene(world, 2, ['d3'], 88, 2);
    world.score = 100;
    // A hint ring on the second butterfly, still unfound.
    world.hintAt = { diffId: 'd5', until: 3.5 };
    world.message = 'Hint: look near "a second butterfly appears"';
    world.messageUntil = 3.5;
    return;
  }
  if (name === 'win') {
    setScene(world, 2, SCENES[2].diffs.map((d) => d.id), 42, 1);
    world.finds = 21;
    world.misses = 2;
    world.score = 2450;
    world.best = 2450;
    world.screen = SCREEN_WIN;
    return;
  }
  // cover: the night market, three differences found, four still to find.
  setScene(world, 0, ['d1', 'd3', 'd5'], 121, 3);
  world.score = 300;
}
