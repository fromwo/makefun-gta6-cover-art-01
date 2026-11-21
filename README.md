[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/fromwo/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/fromwo/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Panels — GTA-style cover art maker

Vice Panels turns your own photos into a multi-panel cover in the style of a
Vice City sunset poster: bold gradient lettering, a warm or neon colour
grade, and panels you can crop yourself. Everything runs offline in desktop
Chrome — the app is plain static files under `app/`, makes no network
request, and your photos never leave your machine. All art is original: no
Rockstar logo, artwork, or font is used anywhere.

## How to use it

1. Load up to three of your own photos into slots **A / B / C** (or try the
   two kit sample photos with one click: Pier, Boulevard).
2. Pick a layout — **Hero** (one big panel + two strips), **Four panels**, or
   **Split duo** (side by side or stacked) — and a grade: **Sunset**, **Neon**,
   or **Dusk**.
3. Click a panel to select it, choose which photo fills it, then crop it:
   drag the photo on the preview, or use the zoom and move sliders. Reset
   restores the panel's crop.
4. Edit the **title** and **subtitle** — the title renders in big bold
   gradient letters with an outline and shadow.
5. Pick an export size — **1080 × 1080**, **1080 × 1350**, or **1920 × 1080** —
   and hit **Export PNG**.

## Run it locally

```sh
node serve.ts
# open http://localhost:8080
```

## Deterministic screenshots

`?shot=` drives the app for repeatable screenshots (see `shots.json`):

- `?shot=cover&photo=pier&caption=Sunset%20Heist` — the cover, edge to edge
- `?shot=editor&photo=boulevard&caption=Boulevard%20Queen` — the editor
  with a photo loaded

Extra knobs: `grade=sunset|neon|dusk`, `layout=hero|four|split`,
`size=1080x1080|1080x1350|1920x1080`, `subtitle=…`.

## Submission output

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
into the output directory and writes `dossier.json` with the vendored
`vendor/makefun-app.ts` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Outside the grader, `MAKEFUN_OUTPUT_DIR` stands in for `/output`.
