// Every tuning number, colour and layout value in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

// The two picture panels, side by side, and the bars around them.
export const LAYOUT = {
  hudHeight: 56,
  panelY: 64,
  panelSize: 600,
  leftX: 24,
  rightX: 656,
  bottomY: 672,
};

// Seconds on the clock for each scene; the hunt gets tighter as it goes.
export const SCENE_TIME = [180, 150, 120, 120, 110, 100];

// Hints per scene, and what a wrong click costs.
export const HINTS_PER_SCENE = 3;
export const HINT_COST_SECONDS = 0;
export const MISS_COST_SECONDS = 3;

// Points: a find is worth more the faster you spot it.
export const POINTS_FIND = 100;
export const POINTS_TIME_BONUS = 2; // per second left when a scene clears
export const POINTS_HINT_LEFT = 50; // per unused hint when a scene clears

export const PALETTE = {
  backdrop: '#171223',
  hud: '#221a33',
  hudLine: '#3a2d55',
  panelFrame: '#4a3a6b',
  panelGap: '#171223',
  text: '#f5efe2',
  muted: '#b8aed0',
  accent: '#ffc94d',
  accent2: '#ff7a59',
  good: '#7ee081',
  bad: '#ff5d5d',
  ring: '#ffd23f',
  ringFound: '#7ee081',
  hint: '#6ec6ff',
  button: '#3a2d55',
  buttonText: '#f5efe2',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'lantern-market.best';
