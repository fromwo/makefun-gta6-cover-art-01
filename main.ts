// Vice Panels entry point (Node 22, standard library only).
//
// The app itself is plain static files under app/ — index.html plus its ES
// modules, no build step and no network request — and this program is the
// handoff: it copies app/ and screenshots/ next to this file into the
// output directory and writes /output/dossier.json with the vendored
// make.fun library, so the judge can read the entry.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside the grader MAKEFUN_OUTPUT_DIR stands in for /output; inside the
// grader it is unset and /output is used. The program writes the same bytes
// on every run: it copies files as they are and lets buildDossier do the
// only summarising, so two runs are byte-identical.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fresh output directory, then the two trees the entry is made of.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsDir = join(outputDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
const repoShots = join(repoRoot, 'screenshots');
if (existsSync(repoShots)) cpSync(repoShots, shotsDir, { recursive: true });

// The scorer's own caps, from the kit's gate: the text budget shapes the
// dossier's bytes; the rest refuse an entry the scorer would refuse — more
// than 4 screenshots or one over 256 KiB, more than 993 files in app/ or
// 48 MiB of app files in all, or an app/ path over 1000 bytes. app/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
