// Draws everything the player sees: the HUD, the two picture panels with
// their found markers and hint ring, and the title / clear / win / over
// screens. The pictures themselves are painted by draw.js.
import { FIELD, LAYOUT, PALETTE, FONT } from './config.js';
import { SCENES } from './scenes.js';
import { drawScene } from './draw.js';
import { panelAt } from './input.js';
import { sceneOf, foundCount, totalDiffs, SCREEN_TITLE, SCREEN_PLAY, SCREEN_CLEAR, SCREEN_WIN, SCREEN_OVER } from './world.js';

let popDiff = null;
let popStart = 0;

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function ring(ctx, cx, cy, r, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function check(ctx, cx, cy, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.45, cy);
  ctx.lineTo(cx - size * 0.1, cy + size * 0.4);
  ctx.lineTo(cx + size * 0.5, cy - size * 0.4);
  ctx.stroke();
}

function drawPanel(ctx, world, side) {
  const { panelY, panelSize, leftX, rightX } = LAYOUT;
  const px = side === 'left' ? leftX : rightX;
  const scene = sceneOf(world);
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, panelY, panelSize, panelSize);
  ctx.clip();
  ctx.translate(px, panelY);
  drawScene(ctx, scene, side === 'right');
  ctx.restore();
  // Frame and tab.
  ctx.strokeStyle = PALETTE.panelFrame;
  ctx.lineWidth = 3;
  ctx.strokeRect(px, panelY, panelSize, panelSize);
  ctx.fillStyle = PALETTE.panelFrame;
  ctx.fillRect(px, panelY, 30, 24);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(side === 'left' ? 'A' : 'B', px + 15, panelY + 13);

  // Found markers: a gold ring and a check on both panels, at every spot.
  const now = world.now;
  for (const diff of scene.diffs) {
    if (!world.found.has(diff.id)) continue;
    let scale = 1;
    if (diff.id === popDiff) {
      const t = Math.min(1, (now - popStart) / 0.3);
      scale = 0.55 + 0.45 * t;
    }
    for (const spot of diff.spots) {
      const cx = px + spot.x;
      const cy = panelY + spot.y;
      ctx.save();
      ctx.shadowColor = 'rgba(255,210,63,0.8)';
      ctx.shadowBlur = 10;
      ring(ctx, cx, cy, (spot.r + 8) * scale, PALETTE.ring, 4);
      ctx.restore();
      check(ctx, cx, cy, 18 * scale, PALETTE.ring);
    }
  }
  // Hint ring: a pulsing blue circle on the hinted difference, both panels.
  if (world.hintAt && world.screen === SCREEN_PLAY) {
    const diff = scene.diffs.find((d) => d.id === world.hintAt.diffId);
    if (diff) {
      const pulse = 1 + 0.12 * Math.sin(now * 9);
      for (const spot of diff.spots) {
        const cx = px + spot.x;
        const cy = panelY + spot.y;
        ctx.save();
        ctx.shadowColor = 'rgba(110,198,255,0.9)';
        ctx.shadowBlur = 12;
        ring(ctx, cx, cy, (spot.r + 10) * pulse, PALETTE.hint, 4);
        ctx.restore();
      }
    }
  }
}

function drawHud(ctx, world) {
  const scene = sceneOf(world);
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, FIELD.width, LAYOUT.hudHeight);
  ctx.fillStyle = PALETTE.hudLine;
  ctx.fillRect(0, LAYOUT.hudHeight - 2, FIELD.width, 2);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 19px ${FONT}`;
  ctx.fillText('LANTERN MARKET', 24, 20);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  ctx.fillText('Spot the Difference', 24, 40);

  // Centre: scene and counter.
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  ctx.fillText(`Scene ${world.sceneIndex + 1} of ${SCENES.length} · ${scene.name}`, 640, 18);
  ctx.fillStyle = PALETTE.accent;
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText(`Found ${foundCount(world)} / ${totalDiffs(world)}`, 640, 40);

  // Right: timer, hints, score.
  const lowTime = world.timeLeft <= 30 && world.screen === SCREEN_PLAY;
  ctx.textAlign = 'right';
  ctx.fillStyle = lowTime ? PALETTE.bad : PALETTE.text;
  ctx.font = `bold ${lowTime ? 24 : 21}px ${FONT}`;
  ctx.fillText(fmtTime(world.timeLeft), 1256, 20);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  ctx.fillText(`HINT ×${world.hintsLeft}   SCORE ${world.score}`, 1256, 40);
}

function drawBottom(ctx, world) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = world.message ? PALETTE.accent : PALETTE.muted;
  ctx.font = `15px ${FONT}`;
  const msg = world.message && world.now < world.messageUntil ? world.message : 'Click a difference in either picture — or press H for a hint.';
  ctx.fillText(msg, 24, 692);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  ctx.fillText('Click: mark · H: hint · M: magnifier · R: restart', 1256, 692);
}

// The magnifier: a 2x lens that follows the pointer over a picture panel.
// It repaints the scene into an offscreen panel (no rings or hint marks, so
// the lens shows the pictures themselves) and draws a zoomed circle of it.
let magCanvas = null;
function drawMagnifier(ctx, world) {
  if (!world.magnifier || !world.mouse || world.screen !== SCREEN_PLAY) return;
  const panel = panelAt(world.mouse.x, world.mouse.y);
  if (!panel) return;
  const scene = sceneOf(world);
  if (!magCanvas) {
    magCanvas = document.createElement('canvas');
    magCanvas.width = 600;
    magCanvas.height = 600;
  }
  drawScene(magCanvas.getContext('2d'), scene, panel.side === 'right');
  const R = 84; // lens radius on screen
  const SRC = 84; // source region side (2x zoom)
  const sx = Math.max(0, Math.min(600 - SRC, panel.x - SRC / 2));
  const sy = Math.max(0, Math.min(600 - SRC, panel.y - SRC / 2));
  const mx = world.mouse.x;
  const my = world.mouse.y;
  ctx.save();
  ctx.beginPath();
  ctx.arc(mx, my, R, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(magCanvas, sx, sy, SRC, SRC, mx - R, my - R, R * 2, R * 2);
  ctx.restore();
  ctx.strokeStyle = PALETTE.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(mx, my, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(245,239,226,0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mx - 8, my);
  ctx.lineTo(mx + 8, my);
  ctx.moveTo(mx, my - 8);
  ctx.lineTo(mx, my + 8);
  ctx.stroke();
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(16,12,28,0.88)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accent ?? PALETTE.text;
  ctx.font = `bold 44px ${FONT}`;
  ctx.fillText(title, 640, 250);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `19px ${FONT}`;
  lines.forEach((ln, i) => ctx.fillText(ln, 640, 310 + i * 32));
}

export function render(ctx, world) {
  // Track the newest find for its pop-in animation.
  const last = world.foundOrder[world.foundOrder.length - 1];
  if (last && last !== popDiff) {
    popDiff = last;
    popStart = world.now;
  }
  if (world.foundOrder.length === 0) popDiff = null;

  ctx.fillStyle = PALETTE.backdrop;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  drawHud(ctx, world);
  if (world.screen === SCREEN_TITLE) {
    // Title screen: the first scene, unplayed, behind the overlay.
    drawPanel(ctx, { ...world, screen: SCREEN_PLAY, found: new Set(), hintAt: null }, 'left');
    drawPanel(ctx, { ...world, screen: SCREEN_PLAY, found: new Set(), hintAt: null }, 'right');
    overlay(ctx, 'LANTERN MARKET', [
      'Spot the Difference',
      '',
      'Two pictures, side by side — almost the same.',
      `Find all ${SCENES[0].diffs.length} differences in each of ${SCENES.length} scenes before time runs out.`,
      'Click a difference in either picture. H spends a hint. A wrong click costs 3 seconds.',
      '',
      world.best > 0 ? `Best score: ${world.best}` : 'No best score yet — make one.',
      '',
      'Click or press Enter to start',
    ]);
    return;
  }
  drawPanel(ctx, world, 'left');
  drawPanel(ctx, world, 'right');
  drawBottom(ctx, world);
  drawMagnifier(ctx, world);

  if (world.screen === SCREEN_CLEAR) {
    const lastScene = world.sceneIndex + 1 >= SCENES.length;
    overlay(ctx, 'Scene Clear!', [
      `All ${totalDiffs(world)} differences found.`,
      `Time bonus +${Math.round(world.timeLeft) * 2} · Hint bonus +${world.hintsLeft * 50} · Scene bonus +${world.sceneBonus}`,
      `Score: ${world.score}`,
      '',
      lastScene ? 'That was the last scene — click for your result.' : 'Click or press N for the next scene.',
    ], PALETTE.good);
  } else if (world.screen === SCREEN_WIN) {
    overlay(ctx, 'You found them all!', [
      `${SCENES.length} scenes, ${world.finds} differences, ${world.misses} miss${world.misses === 1 ? '' : 'es'}.`,
      `Final score: ${world.score}`,
      world.score >= world.best ? 'A new best score!' : `Best score: ${world.best}`,
      '',
      'Press R to play again.',
    ], PALETTE.accent);
  } else if (world.screen === SCREEN_OVER) {
    overlay(ctx, "Time's up!", [
      `You found ${foundCount(world)} of ${totalDiffs(world)} differences in ${sceneOf(world).name}.`,
      `Score: ${world.score}`,
      '',
      'Press R to try again.',
    ], PALETTE.bad);
  }
}
