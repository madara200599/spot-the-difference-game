// The rules of Lantern Cove, with no drawing in them: which level is loaded, which
// differences are found, the countdown, the score and combo chain, hints, mistakes and the
// screen the game sits on. The renderer reads this state; input feeds it clicks and keys.
// Events come back as strings so main.js can play the matching sound and announcement.

import {
  COMBO_MAX_STEPS, COMBO_STEP_POINTS, COMBO_WINDOW_SECONDS, HINT_SCORE_COST, HINTS_PER_LEVEL,
  SCORE_PER_FIND, SCREEN_GAME_OVER, SCREEN_LEVEL_DONE, SCREEN_PAUSED, SCREEN_PLAY,
  SCREEN_TITLE, SCREEN_VICTORY, WRONG_CLICK_TIME_PENALTY,
} from './config.js';
import { LEVELS } from './scenes.js';

export const EVENT_FIND = 'find';
export const EVENT_WRONG = 'wrong';
export const EVENT_HINT = 'hint';
export const EVENT_LEVEL_DONE = 'level-done';
export const EVENT_GAME_OVER = 'game-over';
export const EVENT_VICTORY = 'victory';
export const EVENT_TICK = 'tick';

export function createGame() {
  const state = {
    screen: SCREEN_TITLE,
    levelIndex: 0,
    level: LEVELS[0],
    found: new Set(),
    score: 0,
    levelScore: 0,
    mistakes: 0,
    levelMistakes: 0,
    hintsLeft: HINTS_PER_LEVEL,
    hintsUsed: 0,
    timeLeft: LEVELS[0].timeSeconds,
    combo: 0,
    comboTimer: 0,
    message: '',
    messageTimer: 0,
    markers: [],
    wrongMarks: [],
    hintPulse: null,
    shake: 0,
    elapsed: 0,
    lastTickSecond: -1,
    starsEarned: [],
  };

  function remaining() {
    return state.level.differences.length - state.found.size;
  }

  function loadLevel(index) {
    state.levelIndex = index;
    state.level = LEVELS[index];
    state.found = new Set();
    state.levelScore = 0;
    state.levelMistakes = 0;
    state.hintsLeft = HINTS_PER_LEVEL;
    state.timeLeft = state.level.timeSeconds;
    state.combo = 0;
    state.comboTimer = 0;
    state.markers = [];
    state.wrongMarks = [];
    state.hintPulse = null;
    state.lastTickSecond = -1;
    state.message = `Find ${state.level.differences.length} differences`;
    state.messageTimer = 3;
  }

  function starsForLevel() {
    const par = state.level.timeSeconds;
    let stars = 1;
    if (state.timeLeft > par * 0.25 && state.levelMistakes <= 3) stars = 2;
    if (state.timeLeft > par * 0.45 && state.levelMistakes <= 1 && state.hintsUsed === 0) stars = 3;
    return stars;
  }

  function finishLevel(events) {
    const timeBonus = Math.round(state.timeLeft) * 2;
    state.score += timeBonus;
    state.levelScore += timeBonus;
    state.starsEarned[state.levelIndex] = starsForLevel();
    state.message = `Level complete! Time bonus +${timeBonus}`;
    if (state.levelIndex === LEVELS.length - 1) {
      state.screen = SCREEN_VICTORY;
      events.push(EVENT_VICTORY);
    } else {
      state.screen = SCREEN_LEVEL_DONE;
      events.push(EVENT_LEVEL_DONE);
    }
  }

  return {
    state,
    remaining,
    levels: LEVELS,

    startRun() {
      state.score = 0;
      state.mistakes = 0;
      state.hintsUsed = 0;
      state.starsEarned = [];
      loadLevel(0);
      state.screen = SCREEN_PLAY;
    },

    nextLevel() {
      loadLevel(Math.min(state.levelIndex + 1, LEVELS.length - 1));
      state.screen = SCREEN_PLAY;
    },

    retryLevel() {
      state.score -= state.levelScore;
      loadLevel(state.levelIndex);
      state.screen = SCREEN_PLAY;
    },

    togglePause() {
      if (state.screen === SCREEN_PLAY) state.screen = SCREEN_PAUSED;
      else if (state.screen === SCREEN_PAUSED) state.screen = SCREEN_PLAY;
    },

    /** A click in scene coordinates on one panel ('left' or 'right'). Returns its events. */
    clickAt(sceneX, sceneY, panel) {
      const events = [];
      if (state.screen !== SCREEN_PLAY) return events;
      let hit = null;
      for (const difference of state.level.differences) {
        if (state.found.has(difference.id)) continue;
        const dx = sceneX - difference.x;
        const dy = sceneY - difference.y;
        if (dx * dx + dy * dy <= difference.r * difference.r) {
          hit = difference;
          break;
        }
      }
      if (hit) {
        state.found.add(hit.id);
        state.combo = state.comboTimer > 0 ? state.combo + 1 : 1;
        state.comboTimer = COMBO_WINDOW_SECONDS;
        const comboSteps = Math.min(state.combo - 1, COMBO_MAX_STEPS);
        const points = SCORE_PER_FIND + comboSteps * COMBO_STEP_POINTS;
        state.score += points;
        state.levelScore += points;
        state.markers.push({ id: hit.id, x: hit.x, y: hit.y, r: hit.r, born: state.elapsed });
        state.message = state.combo > 1 ? `Found: ${hit.label} · +${points} · combo x${state.combo}` : `Found: ${hit.label} · +${points}`;
        state.messageTimer = 2.6;
        events.push(EVENT_FIND);
        if (remaining() === 0) finishLevel(events);
      } else {
        state.mistakes += 1;
        state.levelMistakes += 1;
        state.combo = 0;
        state.comboTimer = 0;
        state.timeLeft = Math.max(0, state.timeLeft - WRONG_CLICK_TIME_PENALTY);
        state.wrongMarks.push({ x: sceneX, y: sceneY, panel, born: state.elapsed });
        state.shake = 0.35;
        state.message = `Not there — ${WRONG_CLICK_TIME_PENALTY} seconds lost`;
        state.messageTimer = 2.2;
        events.push(EVENT_WRONG);
        if (state.timeLeft <= 0) {
          state.screen = SCREEN_GAME_OVER;
          events.push(EVENT_GAME_OVER);
        }
      }
      return events;
    },

    /** Reveal one unfound difference with a pulse; costs score and one of the level's hints. */
    useHint() {
      const events = [];
      if (state.screen !== SCREEN_PLAY || state.hintsLeft <= 0) return events;
      const target = state.level.differences.find((difference) => !state.found.has(difference.id));
      if (!target) return events;
      state.hintsLeft -= 1;
      state.hintsUsed += 1;
      state.score = Math.max(0, state.score - HINT_SCORE_COST);
      state.hintPulse = { x: target.x, y: target.y, r: target.r, born: state.elapsed };
      state.message = `Somewhere near here… (−${HINT_SCORE_COST} points)`;
      state.messageTimer = 2.4;
      events.push(EVENT_HINT);
      return events;
    },

    /** Advance timers and effects; only the play screen counts down. Returns events. */
    update(dt) {
      const events = [];
      state.elapsed += dt;
      if (state.messageTimer > 0) state.messageTimer -= dt;
      if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
      state.wrongMarks = state.wrongMarks.filter((mark) => state.elapsed - mark.born < 0.7);
      if (state.hintPulse && state.elapsed - state.hintPulse.born > 1.8) state.hintPulse = null;
      if (state.screen !== SCREEN_PLAY) return events;
      state.timeLeft -= dt;
      if (state.comboTimer > 0) {
        state.comboTimer -= dt;
        if (state.comboTimer <= 0) state.combo = 0;
      }
      const wholeSecond = Math.ceil(state.timeLeft);
      if (state.timeLeft <= 10.5 && wholeSecond !== state.lastTickSecond && state.timeLeft > 0) {
        state.lastTickSecond = wholeSecond;
        events.push(EVENT_TICK);
      }
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        state.screen = SCREEN_GAME_OVER;
        events.push(EVENT_GAME_OVER);
      }
      return events;
    },
  };
}
