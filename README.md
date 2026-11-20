# Vice Panels — GTA 6-style cover maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/fromwo/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/fromwo/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Vice Panels turns your own photos into a multi-panel poster in the style of
GTA 6 cover art: a big hero photo with a strip of smaller panels, a four-panel
comic grid, or a tall split duo, all washed in a Vice City sunset, neon or
dusk colour grade, with a bold gradient title and a letterspaced subtitle
across the foot. Photos are read on your machine and never uploaded, and the
finished cover exports as a PNG in the sizes people actually post —
1080 × 1080, 1080 × 1350 or 1920 × 1080.

## How it works

1. **Load photos** — pick up to three of your own photos (slots A, B, C), or
   try the two kit sample photos to see it working at once.
2. **Pick a layout and a grade** — Hero + strip, Four panels, or Split duo;
   Sunset, Neon, or Dusk. Click any panel in the live preview to select it.
3. **Crop each panel** — drag the photo inside its panel, or use the zoom
   and move sliders; swap which photo a panel shows, or reset it.
4. **Write the caption** — edit the title and subtitle; the lettering is
   drawn with system fonts plus canvas gradient, outline and shadow effects.
5. **Export PNG** — one click saves the cover at the chosen size.

Everything runs offline from static files: open `app/index.html` in desktop
Chrome and it works with no network request. The design is original — no
Rockstar logo, wordmark, official artwork, character or font file is used.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

To build the submission output (copies `app/` and `screenshots/` and writes
`dossier.json`):

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `app/index.html` — the editor page
- `app/style.css` — the dark neon editor styling
- `app/src/main.js` — wiring: uploads, controls, drag-to-pan, export
- `app/src/render.js` — draws the cover: panels, colour grade, caption band
- `app/src/panels.js` — the three poster layouts and their geometry
- `app/src/shots.js` — fixed `?shot=` scenes used for the screenshots
- `app/samples/` — kit-provided sample photos, free to use
- `main.ts` — the entry program (Node 22, standard library only)
- `screenshots/` — the exported covers and the editor at work

Built for the [make.fun GTA 6 cover art bounty](https://make.fun/bounty/gta6-cover-art-01).
