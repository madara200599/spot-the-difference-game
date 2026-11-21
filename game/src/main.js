// Boot and the frame loop for Lantern Cove. Input feeds the game, the game answers with
// events, and each event gets its sound and its spoken announcement here; the renderer
// paints whatever state results. The two panel pictures are repainted by the painter only
// when the level changes — every other frame just blits them.
//
// ?shot=cover|market|storm|victory stages that screenshot scene instead of running the
// loop, paints it twice and sets window.__shotReady when the frame is on screen.

import { VIEW } from './config.js';
import { createAudio } from './audio.js';
import { createGame, EVENT_FIND, EVENT_GAME_OVER, EVENT_HINT, EVENT_LEVEL_DONE, EVENT_TICK, EVENT_VICTORY, EVENT_WRONG } from './game.js';
import { ACTION_CONFIRM, ACTION_HINT, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { buildPanelImages } from './painter.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const status = document.getElementById('status');
const game = createGame();
const audio = createAudio();
const renderer = createRenderer(canvas);

let images = buildPanelImages(game.state.level);
let imagesLevelIndex = game.state.levelIndex;

function refreshImagesIfLevelChanged() {
  if (game.state.levelIndex !== imagesLevelIndex) {
    images = buildPanelImages(game.state.level);
    imagesLevelIndex = game.state.levelIndex;
  }
}

function announce(message) {
  status.textContent = message;
}

function playEvents(events) {
  const state = game.state;
  for (const event of events) {
    if (event === EVENT_FIND) {
      audio.find(state.combo);
      announce(`${state.message}. ${game.remaining()} differences remain.`);
    } else if (event === EVENT_WRONG) {
      audio.wrong();
      announce(state.message);
    } else if (event === EVENT_HINT) {
      audio.hint();
      announce('A hint pulses around one hiding place.');
    } else if (event === EVENT_TICK) {
      audio.tick();
    } else if (event === EVENT_LEVEL_DONE) {
      audio.levelComplete();
      announce(`Level complete. Score ${state.score}.`);
    } else if (event === EVENT_VICTORY) {
      audio.victory();
      announce(`Every scene solved. Final score ${state.score}.`);
    } else if (event === EVENT_GAME_OVER) {
      audio.gameOver();
      announce(`Time is up. You found ${state.found.size} differences.`);
    }
  }
}

function confirm() {
  const screen = game.state.screen;
  if (screen === 'title' || screen === 'victory') {
    game.startRun();
    audio.click();
    announce('The hunt begins. Find 7 differences.');
  } else if (screen === 'paused') {
    game.togglePause();
  } else if (screen === 'level-done') {
    game.nextLevel();
    audio.click();
  } else if (screen === 'game-over') {
    game.retryLevel();
    audio.click();
  }
  refreshImagesIfLevelChanged();
}

function handleButton(action) {
  audio.unlock();
  if (action === ACTION_HINT || action === 'hint') playEvents(game.useHint());
  else if (action === ACTION_MUTE || action === 'mute') audio.toggleMuted();
  else if (action === ACTION_PAUSE || action === 'pause') game.togglePause();
  else if (action === 'resume') game.togglePause();
  else if (action === 'start') {
    game.startRun();
    audio.click();
    announce('The hunt begins. Find 7 differences.');
  } else if (action === 'next') {
    game.nextLevel();
    audio.click();
  } else if (action === 'retry' || action === 'restart') {
    game.retryLevel();
    audio.click();
  } else if (action === 'title') {
    game.state.screen = 'title';
  } else if (action === ACTION_CONFIRM) confirm();
  refreshImagesIfLevelChanged();
}

function runShot(name) {
  stageShot(name, game);
  images = buildPanelImages(game.state.level);
  imagesLevelIndex = game.state.levelIndex;
  const view = { images, pointer: { panel: null }, cursor: { visible: false }, muted: false, frozen: true };
  let painted = 0;
  function paint() {
    renderer.draw(game.state, view);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, {
    press() {
      audio.unlock();
    },
    button: handleButton,
    panelClick(sceneX, sceneY, panel) {
      playEvents(game.clickAt(sceneX, sceneY, panel));
      refreshImagesIfLevelChanged();
    },
  });

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    playEvents(game.update(dt));
    refreshImagesIfLevelChanged();
    const buttons = renderer.draw(game.state, {
      images,
      pointer: input.pointer,
      cursor: input.cursor,
      muted: audio.isMuted(),
      frozen: false,
    });
    input.setButtons(buttons);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state.screen === 'play') {
      game.togglePause();
      announce('Paused.');
    }
  });

  announce('Lantern Cove. Press Enter or click Start Hunting to begin.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
