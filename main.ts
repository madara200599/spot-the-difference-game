// Hand-in program for Lantern Cove, a spot-the-difference game (Node 22, standard library
// only). The game itself is the game/ folder beside this file: plain static files a desktop
// browser loads fully offline. This program copies game/ and screenshots/ into the output
// directory and writes dossier.json there with buildDossier from the vendored make.fun
// library, so the judge reads exactly the files that were handed in.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps below mirror the gate's own limits, so a hand-in this program writes is one the
// scorer can accept: dossier text capped, at most 4 screenshots of at most 256 KiB each,
// game/ at most 993 entries and 48 MiB, and no game path longer than 1000 UTF-8 bytes.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
