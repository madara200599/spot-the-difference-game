// Layout, timing and scoring constants for Lantern Cove. Everything is drawn on one canvas
// of VIEW.width x VIEW.height design pixels, scaled to the window; each of the two picture
// panels is PANEL wide by PANEL high in scene coordinates, and every difference position in
// scenes.js is written in that same 600 x 500 scene space.

export const VIEW = { width: 1280, height: 720 };
export const PANEL = { width: 600, height: 500 };
export const PANEL_TOP = 96;
export const PANEL_LEFT_X = 24;
export const PANEL_RIGHT_X = 656;
export const PANEL_GAP_LABEL = { left: 'ORIGINAL', right: 'SPOT THE CHANGES' };

export const SCORE_PER_FIND = 100;
export const COMBO_WINDOW_SECONDS = 5;
export const COMBO_STEP_POINTS = 25;
export const COMBO_MAX_STEPS = 4;
export const WRONG_CLICK_TIME_PENALTY = 5;
export const HINTS_PER_LEVEL = 3;
export const HINT_SCORE_COST = 50;
export const LOW_TIME_WARNING = 30;
export const LOW_TIME_CRITICAL = 12;

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_LEVEL_DONE = 'level-done';
export const SCREEN_GAME_OVER = 'game-over';
export const SCREEN_VICTORY = 'victory';
