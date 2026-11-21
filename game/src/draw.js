// Draws one picture panel of a scene. Every prop is drawn by kind; the right
// panel applies the scene's differences (a prop's colour, position, size or
// presence changes there) so the two pictures are near-identical by design.
import { mulberry32 } from './random.js';

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function poly(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** One prop, drawn at panel coordinates. `right` means the changed panel. */
export function drawProp(ctx, prop, right) {
  // A prop only on one panel.
  if (prop.onlyLeft && right) return;
  if (prop.onlyRight && !right) return;
  const color = (base, alt) => (right && alt !== undefined ? alt : base);
  const dx = right && prop.dx ? prop.dx : 0;
  const dy = right && prop.dy ? prop.dy : 0;
  const x = (prop.x ?? 0) + dx;
  const y = (prop.y ?? 0) + dy;
  const s = prop.s ?? 1;
  const sc = right && prop.scaleAlt ? prop.scaleAlt : 1;

  switch (prop.kind) {
    case 'sky': {
      const g = ctx.createLinearGradient(0, 0, 0, prop.horizon);
      g.addColorStop(0, prop.top);
      g.addColorStop(0.6, prop.mid);
      g.addColorStop(1, prop.bot);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 600, prop.horizon);
      // Stars, seeded so both panels match exactly.
      const rng = mulberry32(prop.seed ?? 7);
      ctx.fillStyle = 'rgba(255,255,240,0.85)';
      for (let i = 0; i < (prop.stars ?? 0); i += 1) {
        const sx = rng() * 600;
        const sy = rng() * (prop.horizon * 0.55);
        const sr = 0.8 + rng() * 1.4;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'ground': {
      rect(ctx, 0, prop.y, 600, 600 - prop.y, color(prop.color, prop.colorAlt));
      // Cobbles / texture dots, seeded.
      const rng = mulberry32(prop.seed ?? 11);
      ctx.fillStyle = prop.dot ?? 'rgba(0,0,0,0.18)';
      for (let i = 0; i < 46; i += 1) {
        ellipse(ctx, rng() * 600, prop.y + 8 + rng() * (600 - prop.y - 16), 7 + rng() * 9, 3 + rng() * 3, prop.dot ?? 'rgba(0,0,0,0.18)');
      }
      break;
    }
    case 'sea': {
      const g = ctx.createLinearGradient(0, prop.y, 0, 600);
      g.addColorStop(0, prop.top);
      g.addColorStop(1, prop.bot);
      ctx.fillStyle = g;
      ctx.fillRect(0, prop.y, 600, 600 - prop.y);
      // Wave strokes, seeded.
      const rng = mulberry32(prop.seed ?? 13);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 14; i += 1) {
        const wy = prop.y + 14 + rng() * (600 - prop.y - 24);
        const wx = rng() * 520;
        const wl = 30 + rng() * 50;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.quadraticCurveTo(wx + wl / 2, wy - 4, wx + wl, wy);
        ctx.stroke();
      }
      break;
    }
    case 'moon': {
      circle(ctx, x, y, prop.r, '#f7ead0');
      circle(ctx, x - prop.r * 0.35, y - prop.r * 0.2, prop.r * 0.82, color(prop.cover ?? '#2b1d4e', prop.coverAlt));
      break;
    }
    case 'sun': {
      for (let i = 0; i < 12; i += 1) {
        const a = (i / 12) * Math.PI * 2;
        line(ctx, x + Math.cos(a) * (prop.r + 4), y + Math.sin(a) * (prop.r + 4), x + Math.cos(a) * (prop.r + 14), y + Math.sin(a) * (prop.r + 14), '#f2a65e', 3);
      }
      circle(ctx, x, y, prop.r, '#ffd76a');
      circle(ctx, x, y, prop.r * 0.72, '#ffe9a8');
      break;
    }
    case 'cloud': {
      const puffs = right && prop.puffsAlt !== undefined ? prop.puffsAlt : prop.puffs;
      ctx.fillStyle = color(prop.color, prop.colorAlt);
      for (let i = 0; i < puffs; i += 1) {
        const px = x + (i - (puffs - 1) / 2) * prop.s * 0.9;
        const py = y + (i % 2 === 0 ? 0 : -prop.s * 0.28);
        ctx.beginPath();
        ctx.arc(px, py, prop.s * 0.62, 0, Math.PI * 2);
        ctx.fill();
      }
      ellipse(ctx, x, y + prop.s * 0.28, puffs * prop.s * 0.55, prop.s * 0.42, color(prop.color, prop.colorAlt));
      break;
    }
    case 'wire': {
      // A sagging wire with bulbs; one bulb may be dark on the right panel.
      ctx.strokeStyle = '#1c1420';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(prop.x1, prop.y1);
      ctx.quadraticCurveTo((prop.x1 + prop.x2) / 2, Math.max(prop.y1, prop.y2) + (prop.sag ?? 26), prop.x2, prop.y2);
      ctx.stroke();
      const n = prop.bulbs;
      for (let i = 0; i < n; i += 1) {
        const t = (i + 0.5) / n;
        const bx = prop.x1 + (prop.x2 - prop.x1) * t;
        const by = prop.y1 + (prop.y2 - prop.y1) * t + Math.sin(t * Math.PI) * (prop.sag ?? 26) * 0.9;
        const lit = !(right && prop.darkBulb === i);
        line(ctx, bx, by, bx, by + 7, '#1c1420', 2);
        circle(ctx, bx, by + 12, 5, lit ? prop.colors[i % prop.colors.length] : '#3a3345');
        if (lit) {
          ctx.fillStyle = 'rgba(255,220,120,0.25)';
          ctx.beginPath();
          ctx.arc(bx, by + 12, 11, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'stall': {
      // Striped awning, posts and a counter.
      const w = prop.w;
      const stripes = prop.stripes;
      for (let i = 0; i < stripes; i += 1) {
        rect(ctx, x + (w / stripes) * i, y, w / stripes + 1, 34, i % 2 === 0 ? prop.c1 : prop.c2);
      }
      rect(ctx, x - 4, y + 34, w + 8, 6, '#5a3a28');
      rect(ctx, x + 6, y + 40, 7, prop.counterY - y - 40, '#6b4630');
      rect(ctx, x + w - 13, y + 40, 7, prop.counterY - y - 40, '#6b4630');
      rect(ctx, x - 2, prop.counterY, w + 4, 58, '#8a5a34');
      rect(ctx, x - 2, prop.counterY, w + 4, 8, '#a9713f');
      line(ctx, x - 2, prop.counterY + 30, x + w + 2, prop.counterY + 30, 'rgba(0,0,0,0.25)', 2);
      break;
    }
    case 'lantern': {
      // A hanging paper lantern: body, caps, tassel, glow.
      const r = prop.r * s * sc;
      ctx.fillStyle = 'rgba(255,190,90,0.22)';
      ctx.beginPath();
      ctx.arc(x, y, r * 1.7, 0, Math.PI * 2);
      ctx.fill();
      line(ctx, x, y - r - 14, x, y - r, '#1c1420', 2);
      ellipse(ctx, x, y, r, r * 1.18, color(prop.color, prop.colorAlt));
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.62, r * 1.18, 0, 0, Math.PI * 2);
      ctx.stroke();
      rect(ctx, x - r * 0.32, y - r * 1.18 - 6, r * 0.64, 6, '#d8a03c');
      rect(ctx, x - r * 0.32, y + r * 1.18, r * 0.64, 6, '#d8a03c');
      line(ctx, x, y + r * 1.18 + 6, x, y + r * 1.18 + 18, '#e8b23f', 2);
      break;
    }
    case 'person': {
      // A market vendor: straw hat, head, body, apron.
      const hat = color(prop.hat, prop.hatAlt);
      ellipse(ctx, x, y + 34 * s, 30 * s, 34 * s, color(prop.shirt, prop.shirtAlt));
      rect(ctx, x - 30 * s, y + 34 * s, 60 * s, 10 * s, '#3f6d4e');
      circle(ctx, x, y, 15 * s, '#e8b98a');
      poly(ctx, [[x - 24 * s, y - 6 * s], [x + 24 * s, y - 6 * s], [x + 15 * s, y - 24 * s], [x - 15 * s, y - 24 * s]], hat);
      ellipse(ctx, x, y - 5 * s, 26 * s, 5 * s, hat);
      circle(ctx, x - 5 * s, y - 1 * s, 1.8 * s, '#1c1420');
      circle(ctx, x + 5 * s, y - 1 * s, 1.8 * s, '#1c1420');
      break;
    }
    case 'cat': {
      // A sitting cat, tail curled around its paws.
      ellipse(ctx, x, y + 12 * s, 20 * s, 15 * s, color(prop.color, prop.colorAlt));
      circle(ctx, x + 2 * s, y - 8 * s, 12 * s, color(prop.color, prop.colorAlt));
      poly(ctx, [[x - 8 * s, y - 16 * s], [x - 4 * s, y - 26 * s], [x, y - 16 * s]], color(prop.color, prop.colorAlt));
      poly(ctx, [[x + 4 * s, y - 17 * s], [x + 9 * s, y - 26 * s], [x + 12 * s, y - 15 * s]], color(prop.color, prop.colorAlt));
      ctx.strokeStyle = color(prop.color, prop.colorAlt);
      ctx.lineWidth = 5 * s;
      ctx.beginPath();
      ctx.arc(x + 18 * s, y + 16 * s, 12 * s, Math.PI * 0.9, Math.PI * 1.9);
      ctx.stroke();
      circle(ctx, x - 2 * s, y - 9 * s, 1.6 * s, '#1c1420');
      circle(ctx, x + 7 * s, y - 9 * s, 1.6 * s, '#1c1420');
      break;
    }
    case 'dog': {
      ellipse(ctx, x, y + 8 * s, 26 * s, 12 * s, color(prop.color, prop.colorAlt));
      circle(ctx, x + 26 * s, y - 2 * s, 10 * s, color(prop.color, prop.colorAlt));
      poly(ctx, [[x + 20 * s, y - 10 * s], [x + 24 * s, y - 20 * s], [x + 28 * s, y - 10 * s]], color(prop.color, prop.colorAlt));
      ellipse(ctx, x - 22 * s, y + 12 * s, 10 * s, 4 * s, color(prop.color, prop.colorAlt));
      circle(ctx, x + 34 * s, y - 1 * s, 2 * s, '#1c1420');
      break;
    }
    case 'bird': {
      // A small bird perched on a wire.
      ellipse(ctx, x, y, 9 * s, 7 * s, color(prop.color, prop.colorAlt));
      circle(ctx, x + 7 * s, y - 5 * s, 5 * s, color(prop.color, prop.colorAlt));
      poly(ctx, [[x + 11 * s, y - 6 * s], [x + 17 * s, y - 4 * s], [x + 11 * s, y - 2 * s]], '#e8a13c');
      line(ctx, x - 2 * s, y + 6 * s, x - 2 * s, y + 11 * s, '#1c1420', 1.5);
      line(ctx, x + 3 * s, y + 6 * s, x + 3 * s, y + 11 * s, '#1c1420', 1.5);
      break;
    }
    case 'gull': {
      // A seagull in flight: two curved wings.
      ctx.strokeStyle = color(prop.color, prop.colorAlt);
      ctx.lineWidth = 2.5 * s;
      ctx.beginPath();
      ctx.moveTo(x - 14 * s, y);
      ctx.quadraticCurveTo(x - 6 * s, y - 8 * s, x, y);
      ctx.quadraticCurveTo(x + 6 * s, y - 8 * s, x + 14 * s, y);
      ctx.stroke();
      break;
    }
    case 'bicycle': {
      ctx.strokeStyle = '#2c2c34';
      ctx.lineWidth = 3 * s;
      circle(ctx, x, y, 20 * s, 'rgba(0,0,0,0)');
      ctx.strokeStyle = '#2c2c34';
      ctx.beginPath();
      ctx.arc(x, y, 20 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 52 * s, y, 20 * s, 0, Math.PI * 2);
      ctx.stroke();
      line(ctx, x, y, x + 22 * s, y - 26 * s, '#2c2c34', 3 * s);
      line(ctx, x + 52 * s, y, x + 30 * s, y - 26 * s, '#2c2c34', 3 * s);
      line(ctx, x + 22 * s, y - 26 * s, x + 30 * s, y - 26 * s, '#2c2c34', 3 * s);
      line(ctx, x + 30 * s, y - 26 * s, x + 52 * s, y, '#2c2c34', 3 * s);
      line(ctx, x + 22 * s, y - 26 * s, x + 14 * s, y - 34 * s, '#2c2c34', 3 * s);
      line(ctx, x + 14 * s, y - 34 * s, x + 26 * s, y - 34 * s, '#2c2c34', 3 * s);
      break;
    }
    case 'basket': {
      // A woven basket holding round fruit.
      const count = right && prop.countAlt !== undefined ? prop.countAlt : prop.count;
      const fruit = color(prop.fruit, prop.fruitAlt);
      poly(ctx, [[x - 26 * s, y], [x + 26 * s, y], [x + 20 * s, y + 22 * s], [x - 20 * s, y + 22 * s]], '#8a5a34');
      line(ctx, x - 26 * s, y + 8 * s, x + 26 * s, y + 8 * s, 'rgba(0,0,0,0.3)', 2);
      for (let i = 0; i < count; i += 1) {
        const fx = x - 16 * s + (i % 3) * 16 * s;
        const fy = y - 8 * s - Math.floor(i / 3) * 12 * s;
        circle(ctx, fx, fy, 8 * s, fruit);
        circle(ctx, fx - 2 * s, fy - 2 * s, 2.5 * s, 'rgba(255,255,255,0.4)');
      }
      break;
    }
    case 'sign': {
      rect(ctx, x - 4, y, 8, prop.postH ?? 60, '#5a3a28');
      rect(ctx, x - prop.w / 2, y - prop.h, prop.w, prop.h, '#f2e3c2');
      ctx.strokeStyle = '#8a5a34';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - prop.w / 2, y - prop.h, prop.w, prop.h);
      ctx.fillStyle = '#4a2c1a';
      ctx.font = `bold ${prop.font ?? 20}px ${'system-ui, sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = right && prop.textAlt ? prop.textAlt : prop.lines;
      lines.forEach((ln, i) => {
        ctx.fillText(ln, x, y - prop.h + 14 + i * (prop.font ?? 20) * 1.15);
      });
      break;
    }
    case 'crate': {
      rect(ctx, x, y, prop.w, prop.h, '#9a6b3f');
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, prop.w, prop.h);
      line(ctx, x, y + prop.h / 2, x + prop.w, y + prop.h / 2, 'rgba(0,0,0,0.35)', 2);
      line(ctx, x + prop.w / 2, y, x + prop.w / 2, y + prop.h, 'rgba(0,0,0,0.25)', 2);
      break;
    }
    case 'pot': {
      poly(ctx, [[x - 16 * s, y], [x + 16 * s, y], [x + 11 * s, y + 22 * s], [x - 11 * s, y + 22 * s]], '#b05a2e');
      for (let i = 0; i < 5; i += 1) {
        ellipse(ctx, x - 12 * s + i * 6 * s, y - 6 * s - (i % 2) * 8 * s, 6 * s, 10 * s, '#3f7d44');
      }
      break;
    }
    case 'boat': {
      // Hull, mast, sail and flag.
      poly(ctx, [[x - 44 * s, y], [x + 44 * s, y], [x + 30 * s, y + 16 * s], [x - 30 * s, y + 16 * s]], color(prop.hull, prop.hullAlt));
      line(ctx, x, y, x, y - 52 * s, '#5a3a28', 3 * s);
      poly(ctx, [[x + 3 * s, y - 50 * s], [x + 3 * s, y - 6 * s], [x + 34 * s, y - 6 * s]], color(prop.sail, prop.sailAlt));
      line(ctx, x, y - 52 * s, x + 22 * s, y - 52 * s, '#5a3a28', 2 * s);
      poly(ctx, [[x, y - 52 * s], [x + 20 * s, y - 47 * s], [x, y - 42 * s]], color(prop.flag, prop.flagAlt));
      break;
    }
    case 'lighthouse': {
      const h = prop.h;
      poly(ctx, [[x - 16, y], [x + 16, y], [x + 10, y - h], [x - 10, y - h]], '#f2e3c2');
      rect(ctx, x - 18, y - h - 16, 36, 16, '#c0392b');
      circle(ctx, x, y - h - 8, 7, right && prop.litAlt === false ? '#5a5148' : '#ffe9a8');
      if (!(right && prop.litAlt === false)) {
        ctx.fillStyle = 'rgba(255,233,168,0.28)';
        poly(ctx, [[x, y - h - 8], [x + 90, y - h - 34], [x + 90, y - h + 18]]);
      }
      line(ctx, x - 14, y - h * 0.45, x + 14, y - h * 0.45, 'rgba(0,0,0,0.25)', 3);
      break;
    }
    case 'pier': {
      rect(ctx, x, y, prop.w, 14, '#7a5230');
      for (let i = 0; i < 4; i += 1) {
        rect(ctx, x + 12 + i * (prop.w / 4), y + 14, 8, 34, '#5a3a28');
      }
      line(ctx, x, y + 7, x + prop.w, y + 7, 'rgba(0,0,0,0.25)', 2);
      break;
    }
    case 'buoy': {
      ellipse(ctx, x, y, prop.r, prop.r * 0.7, color(prop.color, prop.colorAlt));
      rect(ctx, x - 3, y - prop.r - 8, 6, 10, '#2c2c34');
      circle(ctx, x, y - prop.r - 10, 3, '#ffe9a8');
      ellipse(ctx, x, y + 2, prop.r * 0.7, prop.r * 0.32, 'rgba(255,255,255,0.35)');
      break;
    }
    case 'fish': {
      // A fish leaping out of the water.
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.5);
      ellipse(ctx, 0, 0, 14 * s, 6 * s, color(prop.color, prop.colorAlt));
      poly(ctx, [[-12 * s, 0], [-20 * s, -7 * s], [-20 * s, 7 * s]], color(prop.color, prop.colorAlt));
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x - 4, y + 12, 10, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      break;
    }
    case 'rope': {
      ctx.strokeStyle = '#c8a06a';
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(x, y, prop.r - i * 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'house': {
      rect(ctx, x, y, prop.w, prop.h, color(prop.wall, prop.wallAlt));
      poly(ctx, [[x - 12, y], [x + prop.w + 12, y], [x + prop.w / 2, y - prop.roofH]], color(prop.roof, prop.roofAlt));
      rect(ctx, x + prop.w * 0.38, y + prop.h * 0.45, prop.w * 0.24, prop.h * 0.55, '#5a3a28');
      rect(ctx, x + prop.w * 0.12, y + prop.h * 0.2, prop.w * 0.2, prop.h * 0.26, '#ffe9a8');
      rect(ctx, x + prop.w * 0.68, y + prop.h * 0.2, prop.w * 0.2, prop.h * 0.26, '#ffe9a8');
      break;
    }
    case 'tree': {
      // A cherry tree: trunk and blossom blobs. Blob 0 sits at a fixed offset
      // (so a difference can target it exactly); the rest are seeded.
      poly(ctx, [[x - 8 * s, y], [x + 8 * s, y], [x + 4 * s, y - 70 * s], [x - 4 * s, y - 70 * s]], '#5a3a28');
      const blobs = prop.blobs ?? 5;
      circle(ctx, x - 30 * s, y - 95 * s, 20 * s, color(prop.blossom, prop.blossomAlt));
      const rng = mulberry32(prop.seed ?? 21);
      for (let i = 1; i < blobs; i += 1) {
        const bx = x - 44 * s + rng() * 88 * s;
        const by = y - 78 * s - rng() * 34 * s;
        circle(ctx, bx, by, (16 + rng() * 10) * s, prop.blossom);
      }
      break;
    }
    case 'bamboo': {
      const stalks = prop.stalks;
      for (let i = 0; i < stalks; i += 1) {
        const bx = x + i * 14 * s;
        const bh = (right && prop.shortStalk === i ? (prop.shortH ?? 110) : prop.h) * s;
        line(ctx, bx, y, bx, y - bh, '#4a7d3a', 5 * s);
        for (let j = 1; j <= 3; j += 1) {
          const jy = y - (bh / 3) * j;
          line(ctx, bx - 8 * s, jy - 6 * s, bx, jy, '#5a9a48', 2 * s);
          line(ctx, bx, jy - 6 * s, bx + 8 * s, jy, '#5a9a48', 2 * s);
        }
      }
      break;
    }
    case 'pond': {
      ellipse(ctx, x, y, prop.rx, prop.ry, '#7fb3d5');
      ellipse(ctx, x, y, prop.rx * 0.86, prop.ry * 0.8, '#8fc3e0');
      (prop.koi ?? []).forEach((k, i) => {
        const kc = right && k.colorAlt ? k.colorAlt : k.color;
        ellipse(ctx, x + k.dx, y + k.dy, 14, 6, kc);
        poly(ctx, [[x + k.dx - 12, y + k.dy], [x + k.dx - 20, y + k.dy - 5], [x + k.dx - 20, y + k.dy + 5]], kc);
      });
      break;
    }
    case 'stoneLantern': {
      rect(ctx, x - 16 * s, y + 18 * s, 32 * s, 10 * s, '#8a8a86');
      rect(ctx, x - 10 * s, y, 20 * s, 18 * s, '#9a9a94');
      rect(ctx, x - 13 * s, y - 8 * s, 26 * s, 8 * s, '#7a7a74');
      if (!(right && prop.capOff)) {
        poly(ctx, [[x - 20 * s, y - 8 * s], [x + 20 * s, y - 8 * s], [x, y - 24 * s]], '#6a6a64');
      }
      circle(ctx, x, y - 4 * s, 4 * s, '#ffe9a8');
      break;
    }
    case 'flower': {
      line(ctx, x, y, x, y - 18 * s, '#3f7d44', 2.5 * s);
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        circle(ctx, x + Math.cos(a) * 6 * s, y - 18 * s + Math.sin(a) * 6 * s, 4.5 * s, color(prop.color, prop.colorAlt));
      }
      circle(ctx, x, y - 18 * s, 4 * s, '#ffd76a');
      break;
    }
    case 'steppingStone': {
      ellipse(ctx, x, y, prop.rx, prop.ry, '#b8b0a0');
      ellipse(ctx, x - 3, y - 2, prop.rx * 0.7, prop.ry * 0.6, '#c8c0b0');
      break;
    }
    case 'table': {
      rect(ctx, x - prop.w / 2, y, prop.w, 10, '#6b4630');
      rect(ctx, x - prop.w / 2 + 6, y + 10, 6, 26, '#5a3a28');
      rect(ctx, x + prop.w / 2 - 12, y + 10, 6, 26, '#5a3a28');
      const cx = x + (right && prop.cupAlt !== undefined ? prop.cupAlt : prop.cupX);
      ellipse(ctx, cx, y - 4, 12, 5, '#e8e0d0');
      rect(ctx, cx - 9, y - 16, 18, 12, '#d94f3d');
      ctx.strokeStyle = 'rgba(200,200,200,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, y - 18);
      ctx.quadraticCurveTo(cx + 3, y - 26, cx - 2, y - 30);
      ctx.stroke();
      break;
    }
    case 'butterfly': {
      const flap = 0.9;
      ellipse(ctx, x - 7 * s, y, 8 * s, 5 * s * flap, color(prop.color, prop.colorAlt));
      ellipse(ctx, x + 7 * s, y, 8 * s, 5 * s * flap, color(prop.color, prop.colorAlt));
      ellipse(ctx, x - 5 * s, y + 5 * s, 5 * s, 3.5 * s, color(prop.color, prop.colorAlt));
      ellipse(ctx, x + 5 * s, y + 5 * s, 5 * s, 3.5 * s, color(prop.color, prop.colorAlt));
      line(ctx, x, y - 4 * s, x, y + 8 * s, '#1c1420', 2 * s);
      break;
    }
    case 'frog': {
      ellipse(ctx, x, y, 14 * s, 10 * s, '#5a9a48');
      circle(ctx, x - 7 * s, y - 8 * s, 5 * s, '#5a9a48');
      circle(ctx, x + 7 * s, y - 8 * s, 5 * s, '#5a9a48');
      circle(ctx, x - 7 * s, y - 9 * s, 2 * s, '#1c1420');
      circle(ctx, x + 7 * s, y - 9 * s, 2 * s, '#1c1420');
      break;
    }
    case 'pine': {
      poly(ctx, [[x - 4 * s, y], [x + 4 * s, y], [x + 2 * s, y - 40 * s], [x - 2 * s, y - 40 * s]], '#5a3a28');
      poly(ctx, [[x - 30 * s, y - 34 * s], [x + 30 * s, y - 34 * s], [x, y - 84 * s]], '#2f6b33');
      poly(ctx, [[x - 23 * s, y - 62 * s], [x + 23 * s, y - 62 * s], [x, y - 104 * s]], '#357a39');
      break;
    }
    default:
      break;
  }
}

/** Draw one whole scene into a 600x600 panel. `right` applies the differences. */
export function drawScene(ctx, scene, right) {
  ctx.save();
  ctx.clearRect(0, 0, 600, 600);
  for (const prop of scene.props) drawProp(ctx, prop, right);
  ctx.restore();
}
