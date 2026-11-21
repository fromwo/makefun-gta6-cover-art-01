[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/fromwo/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/fromwo/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Panels — GTA-style cover maker

Turn your own photos into a multi-panel Vice City cover, in the browser, offline, for free.

## What it is

**Vice Panels** is a static web app (plain files under `app/`, no build step, no network requests, no Rockstar logo, artwork or font — all lettering and art are original). It turns up to three of your photos and a caption into cover art in the style of GTA 6 posters:

- **Your photos** — load up to 3 photos from your machine into slots A / B / C (or try the two kit sample photos with one click). Photos are read locally and never uploaded.
- **Three layouts** — Hero (one big panel over a two-panel strip), Four panels (2 x 2 grid), Split duo (two panels, side by side or stacked).
- **Three colour grades** — Sunset, Neon and Dusk, each with its own sky gradient, tint and title gradient.
- **Crop each panel** — pick a panel, drag its photo on the preview, or use the zoom / move sliders; choose which photo slot fills each panel; reset any panel's crop.
- **Bold lettering** — editable title and subtitle, drawn as heavy gradient type with a dark outline and drop shadow.
- **Export PNG** — one click, in 1080 x 1080, 1080 x 1350 or 1920 x 1080.

## How to use it

1. Open the app (see below).
2. Load a photo into slot A (B and C are optional).
3. Pick a layout and a grade, edit the title and subtitle.
4. Click a panel, drag its photo to frame it, adjust zoom if needed.
5. Pick an export size and hit **Export PNG**.

Deterministic screenshots: the app honours `?shot=` URLs, e.g. `?shot=cover&photo=pier&caption=Sunset%20Heist` renders a full-bleed cover, and `?shot=editor&photo=boulevard&caption=Boulevard%20Queen` opens the editor with a photo loaded. `&layout=`, `&grade=` and `&size=` are optional extras. The definitions live in `shots.json`.

## How to run it

```sh
node serve.ts
```

Then open <http://localhost:8080> in desktop Chrome. No build step, no install, no network.

## How to make the submission output

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` into `out/` and writes `out/dossier.json` (via `vendor/makefun-app.ts`). In the grader the output directory is `/output`.

## Files

- `app/index.html`, `app/style.css` — the editor page and its styling.
- `app/src/state.js` — layouts, grades, export sizes, panel geometry.
- `app/src/render.js` — the canvas cover renderer (panels, grades, lettering).
- `app/src/shots.js` — deterministic `?shot=` URLs for screenshots.
- `app/src/main.js` — the editor wiring: photo slots, crop controls, export.
- `app/samples/` — the kit's two free sample photos (`boulevard.jpg`, `pier.jpg`).
- `main.ts` — submission entrypoint; `serve.ts` — local static server; `shots.json` — shot definitions.
- `screenshots/` — 3–4 screenshots taken from the running app (first by name is the cover).
