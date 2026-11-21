# Lantern Cove — Spot the Difference

[![make.fun bounty](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/madara200599/spot-the-difference-game/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/madara200599/spot-the-difference-game/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

An original spot-the-difference game in three twilight scenes, drawn entirely with canvas
paths — no image assets, no network requests, everything plays offline from `game/`.

Two pictures hang side by side. Somewhere in the second, small things have changed: a dock
lantern gone dark, a sail repainted, a gull flown away, the market cat missing its scarf.
Click each change in either picture before the lantern oil runs out.

## The scenes

| Level | Scene | Differences | Time |
| --- | --- | --- | --- |
| 1 | Lantern Cove — The Dusk Harbour | 7 | 3:00 |
| 2 | Star Lantern Market — The Night Bazaar | 9 | 3:20 |
| 3 | Moonlit Lighthouse — The Storm Coast | 11 | 3:40 |

## How it plays

- **Find** — click a difference in either picture; a gold ring marks it on both at once and
  the counter in the top bar counts down how many remain.
- **Combo** — finds chained within 5 seconds earn bonus points, up to +100 extra per find.
- **Mistakes** — a wrong click flashes a red cross, shakes the frame and costs 5 seconds.
- **Hints** — 3 per level; a pulse of rings circles one hiding place, for 50 points.
- **Time pressure** — the timer bar turns amber, then red; in the last 12 seconds the frame
  itself pulses red and the clock ticks aloud.
- **Loupe** — hover a picture for a ×1.9 magnifier. Keyboard-only play works too: arrow
  keys move the lens cursor, Tab swaps picture, Enter clicks, H hints, P pauses, M mutes.
- **Sound** — every chime is synthesised live with WebAudio; there are no audio files.
- Finishing a level earns 1–3 stars and a time bonus; finish all three to light every lantern.

## Layout of the code

- `game/index.html` — the page and its one canvas.
- `game/src/config.js` — layout, timing and scoring constants.
- `game/src/scenes.js` — the three scenes and every difference hidden in them.
- `game/src/painter.js` — all of the art; paints each scene twice (original and changed).
- `game/src/game.js` — the rules: finds, combos, hints, mistakes, the countdown, screens.
- `game/src/render.js` — each frame: top bar, pictures, markers, loupe, cards.
- `game/src/input.js` — pointer and keyboard, including the keyboard lens cursor.
- `game/src/audio.js` — the WebAudio synth: chimes, thuds, sparkles, fanfares.
- `game/src/shots.js` — the staged scenes behind the screenshots in `screenshots/`.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output
  directory and writes `dossier.json` with the vendored make.fun library.
- `serve.ts` — a tiny static server for playing locally.

## Play it locally

```sh
node serve.ts          # then open http://localhost:8080
```

Requires Node.js 22.18 or later. To produce the hand-in output:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.

Entered via referral code r7k9dyj1
