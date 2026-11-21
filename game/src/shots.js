// The staged scenes behind ?shot=cover|market|storm|victory, used to take the entry's
// screenshots. Each one puts the real game into a believable mid-hunt state — some
// differences found and ringed, several still hiding, the counter and clock set — using the
// game's own state and rules, so a screenshot is a true render of play, never a mock-up.

import { SCREEN_VICTORY } from './config.js';
import { differenceById } from './scenes.js';

function markFound(game, ids) {
  const state = game.state;
  for (const id of ids) {
    const difference = differenceById(state.level, id);
    if (!difference) continue;
    state.found.add(id);
    state.markers.push({ id, x: difference.x, y: difference.y, r: difference.r, born: state.elapsed - 1 });
  }
}

function stageCover(game) {
  game.startRun();
  const state = game.state;
  markFound(game, ['moon', 'sail', 'lantern']);
  state.score = 340;
  state.levelScore = 340;
  state.timeLeft = 132;
  state.hintsLeft = 3;
  state.message = 'Found: a sail changed colour · +125 · combo x2';
  state.messageTimer = 99;
  state.combo = 2;
}

function stageMarket(game) {
  game.startRun();
  game.nextLevel();
  const state = game.state;
  markFound(game, ['bulb', 'awning', 'jar', 'cat']);
  state.score = 890;
  state.levelScore = 400;
  state.timeLeft = 96;
  state.hintsLeft = 2;
  state.message = 'Found: the market cat lost its scarf · +100';
  state.messageTimer = 99;
}

function stageStorm(game) {
  game.startRun();
  game.nextLevel();
  game.nextLevel();
  const state = game.state;
  markFound(game, ['stripe', 'door', 'beam', 'ring', 'gull']);
  state.score = 1640;
  state.levelScore = 550;
  state.timeLeft = 11;
  state.hintsLeft = 1;
  state.mistakes = 3;
  state.levelMistakes = 1;
  state.message = 'Found: the lighthouse door swung open · +125 · combo x2';
  state.messageTimer = 99;
  state.combo = 2;
  state.wrongMarks.push({ x: 196, y: 300, panel: 'right', born: state.elapsed - 0.2 });
}

function stageVictory(game) {
  game.startRun();
  const state = game.state;
  state.screen = SCREEN_VICTORY;
  state.score = 2310;
  state.mistakes = 4;
  state.hintsUsed = 1;
  state.starsEarned = [3, 3, 2];
  state.messageTimer = 0;
  markFound(game, ['moon', 'gull', 'hut-window', 'lantern', 'sail', 'buoy', 'fish']);
}

/** Put `game` into the named screenshot scene; unknown names stage the cover scene. */
export function stageShot(name, game) {
  if (name === 'market') stageMarket(game);
  else if (name === 'storm') stageStorm(game);
  else if (name === 'victory') stageVictory(game);
  else stageCover(game);
}
