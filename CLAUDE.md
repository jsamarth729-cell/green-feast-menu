# Green Feast — Digital Menu Board

## What this project is
A set of **digital menu boards** for Green Feast, a premium vegetarian QSR (quick-service
restaurant) in Jaipur. The menus run on **4 physical 40" screens** (1920×1080, landscape)
mounted in the store. The screens are **display-only** — no touch, no interaction. They just
show the menu and auto-update when the data changes.

**Screen 1 (Healthy Bowls) is built.** Screens 2–4 (Wraps & Paninis, Beverages,
Salads & Toasts) are planned and will reuse the same structure.

## Tech stack (deliberately simple)
- Plain **HTML + CSS + vanilla JavaScript**. No frameworks, no build step, no npm at runtime.
- The only Node.js usage is **offline image tooling** (sharp), not part of the live site.
- Hosted free on **GitHub Pages**. Bowl data lives in a **Google Sheet** (published as CSV).

The whole thing is intentionally low-tech so it's cheap, reliable, and editable by a
non-developer (the owner edits a spreadsheet, not code).

---

## How it works (data flow)

```
Google Sheet (owner edits bowls)
      │  published as CSV
      ▼
script.js  ──fetch──►  parses CSV  ──►  builds HTML  ──►  bowls.html renders on screen
      │
      └─ caches to localStorage (so the screen survives a wifi/Google outage)
```

- `bowls.html` is the screen. It's a fixed **1920×1080 canvas** that CSS scales to fit
  whatever display it's shown on (`transform: scale()` calculated in JS).
- On load, `script.js` fetches the Google Sheet CSV + a local `config.json`, builds all the
  HTML (hero slideshow + bowl grid + upsell rail), and injects it.
- It **re-fetches every 5 minutes**, so edits in the Sheet appear on screen automatically.
- Every successful fetch is saved to `localStorage`. If Google is unreachable, the last good
  copy is shown instead of a blank screen.

### Two data sources, on purpose
1. **Google Sheet (CSV)** → the 9 bowls. Things the owner changes often (name, price, macros,
   tags, badges, image framing). URL is in `script.js` as `BOWLS_SOURCE`.
2. **`data/config.json`** (local file) → the "Build Your Own Bowl" tile + the upsell rail.
   These rarely change, so they're kept in the repo, not the Sheet.

---

## File map

| File | What it does |
|------|--------------|
| `bowls.html` | The Screen 1 markup (the actual menu board). |
| `style.css` | All styling. 1920×1080 layout, colors, fonts, tile/hero design. |
| `script.js` | The brain: fetches data, parses CSV, builds & renders HTML, auto-refresh. |
| `adjust.html` | **Image adjuster tool** — local page with live sliders to frame each bowl photo, then export a finished CSV. (See "Image framing" below.) |
| `data/config.json` | Static content: Build-Your-Own tile + upsell rail items. |
| `data/bowls-sheet.csv` | The CSV template / current snapshot of the Sheet. Used to seed or re-import the Google Sheet. |
| `data/bowls.json` | **Legacy** Phase-1 local data (before Google Sheets). No longer the live source. |
| `images/` | The 8 compressed, square-cropped bowl photos served on screen. |
| `compress-images.mjs` | One-off Node script: shrinks huge originals (50MB → ~800KB). |
| `crop-bowls.mjs` | One-off Node script: crops raw photos to centered squares. |

### Not committed / local-only
- `node_modules/`, `drive-download-…/` (raw photo dump), `images_compressed/`, `*.bat` —
  all in `.gitignore`.

---

## The Google Sheet columns
Header row (exact order):

```
id, name, description, price, kcal, protein, fibre, tags, badge, image, featured, img_x, img_y, img_scale
```

- **tags** — fully flexible. Any text (`V`, `GF`, `DF`, …) renders as a pill. Comma-separate
  for multiple (`V,GF`).
- **badge** — flexible. `Chef's Spotlight` → green, `Most Loved` → brown, anything else →
  default sage green. Blank = no badge.
- **featured** — `TRUE` puts the bowl in the rotating hero slideshow (left panel).
- **image** — the filename in `images/` (e.g. `thai-zen.jpg`).
- **img_x / img_y / img_scale** — per-bowl photo framing (see below). Blank = 50/50/1.

⚠️ **Important caching note:** Google's published-CSV link is cached on **Google's servers
for ~5 minutes**. After editing the Sheet, the live screen updates within ~5 min on its own.
A browser hard-refresh does NOT bypass this — the delay is on Google's end, not ours.

---

## Image framing (the adjuster)
Photos are pre-cropped to **squares**, so they fill the circular cutouts perfectly at the
default. To re-frame a bowl (zoom/pan), **do not guess numbers in the Sheet** — the 5-minute
Google delay makes that painful. Instead:

1. Open **`adjust.html`** on the local server (`http://localhost:3000/adjust.html`).
2. Drag the **Zoom / Horizontal / Vertical** sliders — preview updates instantly.
   (Zoom in first, then pan — a square photo at zoom 1 has no spare image to pan into.)
3. Click **Download updated CSV**.
4. In Google Sheets: **File → Import → Upload → Replace current sheet**.

Under the hood, framing is applied as `transform: translate(img_x−50%, img_y−50%)
scale(img_scale)` on the `<img>`. **`script.js` and `adjust.html` must keep this formula
identical** so the preview matches the real screen.

---

## Running & deploying

**Local preview** (for development): serve the folder and open `bowls.html`, e.g.
`npx serve . --listen 3000` then `http://localhost:3000/bowls.html`.

**Live site** (GitHub Pages):
- Repo: `https://github.com/jsamarth729-cell/green-feast-menu`
- Live URL: `https://jsamarth729-cell.github.io/green-feast-menu/bowls.html`
- Deploy = commit + push to `main`. Pages rebuilds automatically in ~1 min.

**On the physical screens** (kiosk mode):
```
chrome.exe --kiosk https://jsamarth729-cell.github.io/green-feast-menu/bowls.html
```

---

## Project phases
- **Phase 1 ✅** — Build Screen 1 from local JSON data.
- **Phase 2 ✅** — Swap data source to Google Sheets (live, auto-refresh).
- **Phase 3 ✅ (in progress)** — Push to GitHub Pages; kiosk setup on physical screens.
- **Phase 4 ⏳** — Build Screens 2 (Wraps & Paninis), 3 (Beverages), 4 (Salads & Toasts),
  reusing this same structure.

## Known TODO
- `images/chilli-asian-tofu.jpg` is **not uploaded yet** — that bowl shows a placeholder.
  When the photo is ready: drop it in `images/`, optionally run it through `crop-bowls.mjs`,
  then `git push`.

---

## Conventions for working in this repo
- Keep it **dependency-free** on the live site. Node scripts are offline tooling only.
- When changing how images are framed, **update `script.js` and `adjust.html` together**.
- The owner is **non-technical** — prefer solutions they can drive from the Sheet or a simple
  local tool over anything requiring code edits.
- Commit messages: short, present-tense summary line.
