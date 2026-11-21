// Boot and game loop: a fixed 1280x720 canvas scaled to the window, a fixed
// 60 Hz step, pointer and keyboard input, and the ?shot= scenes the
// screenshot tooling stages. Sets window.__shotReady once the first frame
// after a shot is staged has been drawn.
import { FIELD } from './config.js';
import { freshWorld, loadBest, tick } from './world.js';
import { render } from './render.js';
import { clickAt, keyDown, toLogical } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
canvas.width = FIELD.width;
canvas.height = FIELD.height;

const world = freshWorld();
loadBest(world);
window.__game = world; // Exposed for the play-test harness (and debugging).

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) stageShot(shot, world);

function fit() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}
window.addEventListener('resize', fit);
fit();

canvas.addEventListener('pointerdown', (event) => {
  const { x, y } = toLogical(canvas, event.clientX, event.clientY);
  clickAt(world, x, y);
  announce();
});
canvas.addEventListener('pointermove', (event) => {
  world.mouse = toLogical(canvas, event.clientX, event.clientY);
});
canvas.addEventListener('pointerleave', () => {
  world.mouse = null;
});
window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  keyDown(world, event.key);
  announce();
});

function announce() {
  if (!status) return;
  status.textContent = `Found ${world.found.size} of ${world.sceneIndex + 1 === 0 ? '' : ''}differences. Score ${world.score}. Time left ${Math.ceil(world.timeLeft)} seconds.`;
}

let last = performance.now();
let frames = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!shot) tick(world, dt);
  render(ctx, world);
  frames += 1;
  if (frames === 2) window.__shotReady = true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
