// Pointer and keyboard input. The pointer reports design-space coordinates (the canvas is
// 1280 x 720 by design and scaled to the window), tracks which panel it hovers for the
// loupe, and turns clicks into either panel clicks or button presses via the renderer's
// current button list. The keyboard drives a visible crosshair cursor so the whole game —
// hunting included — can be played without a mouse.

import { PANEL, PANEL_LEFT_X, PANEL_RIGHT_X, PANEL_TOP, VIEW } from './config.js';

export const ACTION_HINT = 'hint';
export const ACTION_PAUSE = 'pause';
export const ACTION_CONFIRM = 'confirm';
export const ACTION_MUTE = 'mute';

export function createInput(canvas, handlers) {
  const pointer = { x: VIEW.width / 2, y: VIEW.height / 2, inside: false, panel: null, sceneX: 0, sceneY: 0 };
  const cursor = { x: 300, y: 250, panel: 'left', visible: false };
  let buttons = [];

  function toDesign(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (VIEW.width / rect.width),
      y: (event.clientY - rect.top) * (VIEW.height / rect.height),
    };
  }

  function panelAt(x, y) {
    if (y < PANEL_TOP || y > PANEL_TOP + PANEL.height) return null;
    if (x >= PANEL_LEFT_X && x <= PANEL_LEFT_X + PANEL.width) return 'left';
    if (x >= PANEL_RIGHT_X && x <= PANEL_RIGHT_X + PANEL.width) return 'right';
    return null;
  }

  function refreshPointer(x, y) {
    pointer.x = x;
    pointer.y = y;
    pointer.panel = panelAt(x, y);
    if (pointer.panel) {
      const originX = pointer.panel === 'left' ? PANEL_LEFT_X : PANEL_RIGHT_X;
      pointer.sceneX = x - originX;
      pointer.sceneY = y - PANEL_TOP;
    }
  }

  canvas.addEventListener('pointermove', (event) => {
    const point = toDesign(event);
    pointer.inside = true;
    refreshPointer(point.x, point.y);
  });
  canvas.addEventListener('pointerleave', () => {
    pointer.inside = false;
    pointer.panel = null;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const point = toDesign(event);
    refreshPointer(point.x, point.y);
    handlers.press();
    for (const button of buttons) {
      if (point.x >= button.x && point.x <= button.x + button.width && point.y >= button.y && point.y <= button.y + button.height) {
        handlers.button(button.action);
        return;
      }
    }
    if (pointer.panel) handlers.panelClick(pointer.sceneX, pointer.sceneY, pointer.panel);
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'h') handlers.button(ACTION_HINT);
    else if (key === 'm') handlers.button(ACTION_MUTE);
    else if (key === 'p' || key === 'escape') handlers.button(ACTION_PAUSE);
    else if (key === 'enter' || key === ' ') {
      event.preventDefault();
      handlers.press();
      if (cursor.visible) handlers.panelClick(cursor.x, cursor.y, cursor.panel);
      else handlers.button(ACTION_CONFIRM);
    } else if (key.startsWith('arrow')) {
      event.preventDefault();
      cursor.visible = true;
      const step = event.shiftKey ? 4 : 16;
      if (key === 'arrowleft') cursor.x = Math.max(6, cursor.x - step);
      if (key === 'arrowright') cursor.x = Math.min(PANEL.width - 6, cursor.x + step);
      if (key === 'arrowup') cursor.y = Math.max(6, cursor.y - step);
      if (key === 'arrowdown') cursor.y = Math.min(PANEL.height - 6, cursor.y + step);
    } else if (key === 'tab') {
      event.preventDefault();
      cursor.visible = true;
      cursor.panel = cursor.panel === 'left' ? 'right' : 'left';
    }
  });

  return {
    pointer,
    cursor,
    setButtons(next) {
      buttons = next;
    },
    panelOriginX(panel) {
      return panel === 'left' ? PANEL_LEFT_X : PANEL_RIGHT_X;
    },
  };
}
