// The renderer: paints one frame of Lantern Cove from the game state — the top bar with the
// found/remain counter, timer and score, the two framed pictures with their found markers,
// hint pulses and wrong-click crosses, the magnifier loupe under the pointer, and the title,
// pause, level-complete, game-over and victory cards. It also reports the clickable buttons
// it drew, so input can route presses without knowing the layout.

import {
  LOW_TIME_CRITICAL, LOW_TIME_WARNING, PANEL, PANEL_GAP_LABEL, PANEL_LEFT_X, PANEL_RIGHT_X,
  PANEL_TOP, SCREEN_GAME_OVER, SCREEN_LEVEL_DONE, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE,
  SCREEN_VICTORY, VIEW,
} from './config.js';
import { roundedRectPath } from './painter.js';

const GOLD = '#e8b34b';
const CREAM = '#f6ead2';
const INK = '#0d1020';

function text(g, value, x, y, font, colour, align = 'left', baseline = 'alphabetic') {
  g.font = font;
  g.fillStyle = colour;
  g.textAlign = align;
  g.textBaseline = baseline;
  g.fillText(value, x, y);
}

function formatTime(seconds) {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function drawButton(g, buttons, action, x, y, width, height, label, enabled) {
  roundedRectPath(g, x, y, width, height, 10);
  g.fillStyle = enabled ? '#2c2350' : '#1b1830';
  g.fill();
  g.strokeStyle = enabled ? GOLD : '#4a4460';
  g.lineWidth = 1.6;
  g.stroke();
  text(g, label, x + width / 2, y + height / 2 + 1, '600 16px system-ui, sans-serif', enabled ? CREAM : '#8a84a0', 'center', 'middle');
  if (enabled) buttons.push({ action, x, y, width, height });
}

function drawMarker(g, cx, cy, marker, now, frozen) {
  const age = frozen ? 1 : Math.min(1, (now - marker.born) / 0.28);
  const pop = 1 + (1 - age) * 0.7;
  const radius = Math.max(17, marker.r * 0.82) * pop;
  g.strokeStyle = GOLD;
  g.lineWidth = 3.4;
  g.beginPath();
  g.arc(cx, cy, radius, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = 'rgba(13, 16, 32, 0.85)';
  g.lineWidth = 1.4;
  g.beginPath();
  g.arc(cx, cy, radius + 2.6, 0, Math.PI * 2);
  g.stroke();
  // A small gold badge with a check, pinned to the ring's top right.
  const bx = cx + radius * 0.72;
  const by = cy - radius * 0.72;
  g.fillStyle = GOLD;
  g.beginPath();
  g.arc(bx, by, 8.5, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 2.2;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(bx - 4, by);
  g.lineTo(bx - 1.2, by + 3.2);
  g.lineTo(bx + 4.4, by - 3.4);
  g.stroke();
}

function drawPanelPicture(g, image, originX, label) {
  g.save();
  roundedRectPath(g, originX - 5, PANEL_TOP - 5, PANEL.width + 10, PANEL.height + 10, 14);
  g.fillStyle = '#17122b';
  g.fill();
  g.strokeStyle = '#4c3a26';
  g.lineWidth = 3;
  g.stroke();
  roundedRectPath(g, originX, PANEL_TOP, PANEL.width, PANEL.height, 9);
  g.clip();
  g.drawImage(image, originX, PANEL_TOP, PANEL.width, PANEL.height);
  g.restore();
  roundedRectPath(g, originX + 10, PANEL_TOP + 10, label.length * 8.4 + 20, 24, 12);
  g.fillStyle = 'rgba(13, 16, 32, 0.72)';
  g.fill();
  text(g, label, originX + 20, PANEL_TOP + 22, '700 12px system-ui, sans-serif', CREAM, 'left', 'middle');
}

function drawFireflies(g, originX, now) {
  g.save();
  roundedRectPath(g, originX, PANEL_TOP, PANEL.width, PANEL.height, 9);
  g.clip();
  for (let index = 0; index < 12; index += 1) {
    const baseX = originX + ((index * 173) % 560) + 20;
    const baseY = PANEL_TOP + ((index * 97) % 440) + 30;
    const x = baseX + Math.sin(now * 0.6 + index * 1.7) * 9;
    const y = baseY + Math.cos(now * 0.45 + index * 2.3) * 7;
    const twinkle = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(now * 1.8 + index * 3.1));
    g.fillStyle = `rgba(255, 214, 130, ${twinkle.toFixed(3)})`;
    g.beginPath();
    g.arc(x, y, 2, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

function drawTopBar(g, state, buttons) {
  text(g, 'LANTERN COVE', 26, 36, '800 25px Georgia, serif', CREAM);
  text(g, state.level.subtitle, 27, 60, '500 14px system-ui, sans-serif', '#b8aed6');

  // The counter the whole game hangs on: found so far, and how many remain.
  const total = state.level.differences.length;
  const found = state.found.size;
  const remain = total - found;
  roundedRectPath(g, 392, 12, 400, 66, 14);
  g.fillStyle = '#1d1838';
  g.fill();
  g.strokeStyle = GOLD;
  g.lineWidth = 1.8;
  g.stroke();
  text(g, `FOUND ${found} OF ${total}`, 592, 35, '700 14px system-ui, sans-serif', '#b8aed6', 'center');
  text(g, remain === 0 ? 'ALL FOUND!' : `${remain} REMAIN`, 592, 64, '800 25px system-ui, sans-serif', remain === 0 ? '#7dd87d' : CREAM, 'center');

  // Timer: a clock and a draining bar that turns amber, then red and pulsing.
  const fraction = Math.max(0, state.timeLeft / state.level.timeSeconds);
  const urgent = state.timeLeft <= LOW_TIME_WARNING && state.screen === SCREEN_PLAY;
  const critical = state.timeLeft <= LOW_TIME_CRITICAL && state.screen === SCREEN_PLAY;
  const pulse = critical ? 0.65 + 0.35 * Math.sin(state.elapsed * 9) : 1;
  const timerColour = critical ? '#ff6b5e' : urgent ? '#ffb35c' : CREAM;
  text(g, 'TIME', 852, 30, '700 12px system-ui, sans-serif', '#b8aed6');
  text(g, formatTime(state.timeLeft), 852, 58, `800 24px system-ui, sans-serif`, timerColour);
  roundedRectPath(g, 916, 44, 128, 10, 5);
  g.fillStyle = '#2c2350';
  g.fill();
  if (fraction > 0) {
    roundedRectPath(g, 916, 44, Math.max(10, 128 * fraction), 10, 5);
    g.fillStyle = critical ? `rgba(255, 107, 94, ${pulse.toFixed(3)})` : urgent ? '#ffb35c' : '#7dd87d';
    g.fill();
  }

  text(g, 'SCORE', 1254, 30, '700 12px system-ui, sans-serif', '#b8aed6', 'right');
  text(g, String(state.score), 1254, 58, '800 24px system-ui, sans-serif', CREAM, 'right');
}

function drawBottomBar(g, state, buttons, muted) {
  // Feedback line: the last find, mistake or hint speaks here.
  if (state.messageTimer > 0 && state.message) {
    text(g, state.message, 26, 640, '600 18px system-ui, sans-serif', '#ffd98a');
  } else if (state.screen === SCREEN_PLAY) {
    text(g, state.combo > 1 ? `Combo x${state.combo} — quick finds earn bonus points` : 'Click a difference in either picture', 26, 640, '500 16px system-ui, sans-serif', '#8a84a0');
  }
  // One dot per difference: gold when found, hollow while it hides.
  const total = state.level.differences.length;
  state.level.differences.forEach((difference, index) => {
    const x = 30 + index * 24;
    const y = 668;
    g.beginPath();
    g.arc(x, y, 7, 0, Math.PI * 2);
    if (state.found.has(difference.id)) {
      g.fillStyle = GOLD;
      g.fill();
    } else {
      g.strokeStyle = '#6a6390';
      g.lineWidth = 1.6;
      g.stroke();
    }
  });
  text(g, 'Arrows move the lens cursor · Enter clicks · Tab swaps picture', 26, 700, '400 12.5px system-ui, sans-serif', '#6a6390');

  drawButton(g, buttons, 'hint', 862, 626, 128, 42, `HINT (${state.hintsLeft})`, state.screen === SCREEN_PLAY && state.hintsLeft > 0);
  drawButton(g, buttons, 'pause', 1002, 626, 104, 42, state.screen === SCREEN_PAUSED ? 'RESUME' : 'PAUSE', state.screen === SCREEN_PLAY || state.screen === SCREEN_PAUSED);
  drawButton(g, buttons, 'mute', 1118, 626, 138, 42, muted ? 'SOUND: OFF' : 'SOUND: ON', true);
  text(g, `Level ${state.levelIndex + 1} of 3 · Mistakes: ${state.mistakes}`, 1256, 700, '400 12.5px system-ui, sans-serif', '#6a6390', 'right');
}

function drawCard(g, width, height) {
  const x = (VIEW.width - width) / 2;
  const y = (VIEW.height - height) / 2;
  g.fillStyle = 'rgba(8, 9, 20, 0.62)';
  g.fillRect(0, 0, VIEW.width, VIEW.height);
  roundedRectPath(g, x, y, width, height, 18);
  g.fillStyle = '#1d1838';
  g.fill();
  g.strokeStyle = GOLD;
  g.lineWidth = 2;
  g.stroke();
  return { x, y };
}

function drawStarsRow(g, cx, y, earned, total) {
  text(g, Array.from({ length: total }, (_, index) => (index < earned ? '★' : '☆')).join(' '), cx, y, '400 34px system-ui, sans-serif', GOLD, 'center');
}

function drawOverlays(g, state, buttons) {
  const cx = VIEW.width / 2;
  if (state.screen === SCREEN_TITLE) {
    const { y } = drawCard(g, 640, 470);
    text(g, 'LANTERN COVE', cx, y + 78, '800 46px Georgia, serif', CREAM, 'center');
    text(g, 'A spot-the-difference hunt in three twilight scenes', cx, y + 112, '500 17px system-ui, sans-serif', '#b8aed6', 'center');
    text(g, 'Two pictures hang side by side. Somewhere in the second, small', cx, y + 156, '400 15.5px system-ui, sans-serif', CREAM, 'center');
    text(g, 'things have changed — a lantern gone dark, a sail repainted, a gull', cx, y + 178, '400 15.5px system-ui, sans-serif', CREAM, 'center');
    text(g, 'flown away. Click each change before the lantern oil runs out.', cx, y + 200, '400 15.5px system-ui, sans-serif', CREAM, 'center');
    const chips = [
      ['1 · Lantern Cove', '7 changes · 3:00'],
      ['2 · Star Lantern Market', '9 changes · 3:20'],
      ['3 · Moonlit Lighthouse', '11 changes · 3:40'],
    ];
    chips.forEach(([name, detail], index) => {
      const chipX = cx - 282 + index * 192;
      roundedRectPath(g, chipX, y + 228, 180, 62, 10);
      g.fillStyle = '#2c2350';
      g.fill();
      text(g, name, chipX + 90, y + 254, '700 13.5px system-ui, sans-serif', CREAM, 'center');
      text(g, detail, chipX + 90, y + 276, '400 12.5px system-ui, sans-serif', '#b8aed6', 'center');
    });
    text(g, 'Wrong clicks cost 5 seconds · Hints cost 50 points · Quick finds build a combo', cx, y + 322, '400 13.5px system-ui, sans-serif', '#8a84a0', 'center');
    drawButton(g, buttons, 'start', cx - 110, y + 348, 220, 52, 'START HUNTING', true);
    text(g, 'Mouse or keyboard · H hint · P pause · M sound', cx, y + 436, '400 13px system-ui, sans-serif', '#6a6390', 'center');
  } else if (state.screen === SCREEN_PAUSED) {
    const { y } = drawCard(g, 420, 300);
    text(g, 'PAUSED', cx, y + 84, '800 36px Georgia, serif', CREAM, 'center');
    text(g, 'The lanterns wait for you.', cx, y + 122, '400 15px system-ui, sans-serif', '#b8aed6', 'center');
    drawButton(g, buttons, 'resume', cx - 100, y + 156, 200, 48, 'RESUME', true);
    drawButton(g, buttons, 'restart', cx - 100, y + 218, 200, 44, 'RESTART LEVEL', true);
  } else if (state.screen === SCREEN_LEVEL_DONE) {
    const { y } = drawCard(g, 480, 360);
    text(g, 'LEVEL COMPLETE!', cx, y + 70, '800 32px Georgia, serif', CREAM, 'center');
    drawStarsRow(g, cx, y + 118, state.starsEarned[state.levelIndex] ?? 1, 3);
    text(g, `${state.level.title} — every difference found`, cx, y + 158, '500 15px system-ui, sans-serif', '#b8aed6', 'center');
    text(g, `Time to spare ${formatTime(state.timeLeft)} · Mistakes ${state.levelMistakes} · Level score ${state.levelScore}`, cx, y + 190, '400 14.5px system-ui, sans-serif', CREAM, 'center');
    drawButton(g, buttons, 'next', cx - 110, y + 224, 220, 50, 'NEXT LEVEL', true);
    text(g, `Total score ${state.score}`, cx, y + 316, '700 16px system-ui, sans-serif', GOLD, 'center');
  } else if (state.screen === SCREEN_GAME_OVER) {
    const { y } = drawCard(g, 480, 340);
    text(g, "TIME'S UP!", cx, y + 74, '800 34px Georgia, serif', '#ff6b5e', 'center');
    const total = state.level.differences.length;
    text(g, `You found ${state.found.size} of ${total} differences in ${state.level.title}.`, cx, y + 118, '500 15.5px system-ui, sans-serif', CREAM, 'center');
    text(g, 'The rest slipped back into the twilight.', cx, y + 142, '400 14.5px system-ui, sans-serif', '#b8aed6', 'center');
    drawButton(g, buttons, 'retry', cx - 110, y + 176, 220, 50, 'TRY AGAIN', true);
    drawButton(g, buttons, 'title', cx - 110, y + 240, 220, 44, 'BACK TO TITLE', true);
  } else if (state.screen === SCREEN_VICTORY) {
    const { y } = drawCard(g, 540, 400);
    text(g, 'EVERY LANTERN LIT!', cx, y + 70, '800 32px Georgia, serif', CREAM, 'center');
    const totalStars = state.starsEarned.reduce((sum, value) => sum + (value ?? 0), 0);
    drawStarsRow(g, cx, y + 116, totalStars, 9);
    text(g, 'All three scenes solved — harbour, market and lighthouse.', cx, y + 156, '500 15px system-ui, sans-serif', '#b8aed6', 'center');
    text(g, `Final score ${state.score} · Mistakes ${state.mistakes} · Hints used ${state.hintsUsed}`, cx, y + 192, '600 16px system-ui, sans-serif', CREAM, 'center');
    drawButton(g, buttons, 'start', cx - 110, y + 226, 220, 50, 'PLAY AGAIN', true);
    text(g, 'Thank you for hunting in Lantern Cove.', cx, y + 322, '400 13.5px system-ui, sans-serif', '#8a84a0', 'center');
  }
}

export function createRenderer(canvas) {
  const g = canvas.getContext('2d');

  /**
   * Paint a frame. `view` carries { images, pointer, cursor, cursorPanelOriginX, muted,
   * frozen }: frozen renders a staged screenshot scene with settled animations.
   * Returns the buttons drawn this frame.
   */
  function draw(state, view) {
    const buttons = [];
    const now = view.frozen ? 1000 : state.elapsed;
    g.save();
    if (state.shake > 0 && !view.frozen) {
      const jolt = state.shake * 22;
      g.translate(Math.sin(now * 71) * jolt * 0.4, Math.cos(now * 83) * jolt * 0.3);
    }
    const background = g.createLinearGradient(0, 0, 0, VIEW.height);
    background.addColorStop(0, '#141126');
    background.addColorStop(1, INK);
    g.fillStyle = background;
    g.fillRect(-30, -30, VIEW.width + 60, VIEW.height + 60);

    drawPanelPicture(g, view.images.original, PANEL_LEFT_X, PANEL_GAP_LABEL.left);
    drawPanelPicture(g, view.images.changed, PANEL_RIGHT_X, PANEL_GAP_LABEL.right);
    drawFireflies(g, PANEL_LEFT_X, now);
    drawFireflies(g, PANEL_RIGHT_X, now + 40);

    // Found markers ring the difference on both pictures at once.
    for (const marker of state.markers) {
      drawMarker(g, PANEL_LEFT_X + marker.x, PANEL_TOP + marker.y, marker, state.elapsed, view.frozen);
      drawMarker(g, PANEL_RIGHT_X + marker.x, PANEL_TOP + marker.y, marker, state.elapsed, view.frozen);
    }
    // A hint breathes three rings around one hiding place.
    if (state.hintPulse) {
      const age = view.frozen ? 0.9 : state.elapsed - state.hintPulse.born;
      for (const originX of [PANEL_LEFT_X, PANEL_RIGHT_X]) {
        for (let ring = 0; ring < 3; ring += 1) {
          const phase = (age / 1.8 + ring / 3) % 1;
          g.strokeStyle = `rgba(255, 217, 138, ${(0.75 * (1 - phase)).toFixed(3)})`;
          g.lineWidth = 2.6;
          g.beginPath();
          g.arc(originX + state.hintPulse.x, PANEL_TOP + state.hintPulse.y, 14 + phase * 46, 0, Math.PI * 2);
          g.stroke();
        }
      }
    }
    // Wrong clicks flash a red cross that fades where the player pressed.
    for (const mark of state.wrongMarks) {
      const age = view.frozen ? 0.2 : state.elapsed - mark.born;
      const alpha = Math.max(0, 1 - age / 0.7);
      const originX = mark.panel === 'right' ? PANEL_RIGHT_X : PANEL_LEFT_X;
      const cx = originX + mark.x;
      const cy = PANEL_TOP + mark.y;
      g.strokeStyle = `rgba(255, 107, 94, ${alpha.toFixed(3)})`;
      g.lineWidth = 3.4;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(cx - 9, cy - 9);
      g.lineTo(cx + 9, cy + 9);
      g.moveTo(cx + 9, cy - 9);
      g.lineTo(cx - 9, cy + 9);
      g.stroke();
    }

    drawTopBar(g, state, buttons);
    drawBottomBar(g, state, buttons, view.muted);

    // The loupe magnifies whichever picture the pointer hovers.
    if (!view.frozen && state.screen === SCREEN_PLAY && view.pointer.panel) {
      const { pointer } = view;
      const image = pointer.panel === 'left' ? view.images.original : view.images.changed;
      const zoom = 1.9;
      const radius = 74;
      g.save();
      g.beginPath();
      g.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
      g.clip();
      g.fillStyle = INK;
      g.fillRect(pointer.x - radius, pointer.y - radius, radius * 2, radius * 2);
      const sourceSize = (radius * 2) / zoom;
      g.drawImage(
        image,
        (pointer.sceneX - sourceSize / 2) * 2, (pointer.sceneY - sourceSize / 2) * 2,
        sourceSize * 2, sourceSize * 2,
        pointer.x - radius, pointer.y - radius, radius * 2, radius * 2,
      );
      g.restore();
      g.strokeStyle = GOLD;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
      g.stroke();
    }
    // The keyboard cursor: a crosshair on the picture Tab last selected.
    if (!view.frozen && state.screen === SCREEN_PLAY && view.cursor.visible) {
      const originX = view.cursor.panel === 'left' ? PANEL_LEFT_X : PANEL_RIGHT_X;
      const cx = originX + view.cursor.x;
      const cy = PANEL_TOP + view.cursor.y;
      g.strokeStyle = '#ffd98a';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy, 13, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.moveTo(cx - 20, cy);
      g.lineTo(cx - 6, cy);
      g.moveTo(cx + 6, cy);
      g.lineTo(cx + 20, cy);
      g.moveTo(cx, cy - 20);
      g.lineTo(cx, cy - 6);
      g.moveTo(cx, cy + 6);
      g.lineTo(cx, cy + 20);
      g.stroke();
    }

    // When the clock runs dry the frame itself feels it: a red edge closes in.
    if (state.screen === SCREEN_PLAY && state.timeLeft <= LOW_TIME_CRITICAL) {
      const pulse = view.frozen ? 0.5 : 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(state.elapsed * 6));
      g.strokeStyle = `rgba(255, 80, 64, ${pulse.toFixed(3)})`;
      g.lineWidth = 10;
      g.strokeRect(5, 5, VIEW.width - 10, VIEW.height - 10);
    }

    if (state.screen !== SCREEN_PLAY) drawOverlays(g, state, buttons);
    g.restore();
    return buttons;
  }

  return { draw };
}
