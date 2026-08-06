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
| `DESIGN-PRINCIPLES.md` | **Read before designing any new screen.** The design rules distilled from building Screen 1 — legibility, tags, photography, colour, Chrome 69 limits. |
| `bowls.html` | The Screen 1 markup (the actual menu board). |
| `style.css` | All styling. 1920×1080 layout, colors, fonts, tile/hero design. |
| `script.js` | The brain: fetches data, parses CSV, builds & renders HTML, auto-refresh. |
| `tvtest.html` | **On-TV diagnostic.** ES5-only page reporting browser engine + feature support in large text. Open this first when a board renders wrong. |
| `adjust.html` | **Image adjuster tool** — local page with live sliders to frame each bowl photo, then export a finished CSV. (See "Image framing" below.) |
| `data/config.json` | Static content: Build-Your-Own tile + upsell rail items. |
| `data/bowls-sheet.csv` | Local snapshot/template of the Sheet. **Not what the live boards read** — see the caching note below. |
| `images/nobg/` | The transparent cut-outs actually served: `<slug>-side.png` (hero) + `<slug>-top.png` (tile). |
| `images/` | The square JPG crops these were built from. Kept as the `HERO_CUTOUT_UNAVAILABLE` fallback source. |
| `build-bowl-cutouts.mjs` | **The image pipeline.** Original photo → background removal → alpha repair → isolate subject → trim → normalize. Run from the repo root. |
| `ingest-manual-cutout.mjs` | Normalizes a hand-cut transparent PNG through the same path, for when the remover fails on a photo (see DESIGN-PRINCIPLES §6). |

### Not committed / local-only
- `node_modules/`, `drive-download-…/` (raw photo dump), `images_compressed/`, `*.bat`,
  `.claude/`, `.playwright-mcp/`, and loose reference screenshots/mockups in the root —
  all in `.gitignore`.

---

## The Google Sheet columns
Header row (exact order):

```
id, name, description, price, kcal, protein, fibre, tags, badge, image, featured, img_x, img_y, img_scale
```

- **tags** — write the **full readable name** (`Gluten Free`, `Less Spicy`, `Vegan`,
  `Low Calorie`). `TAG_ABBREV` in `script.js` shortens them to `GF`/`LS`/`V`/`LC` for the
  tile pills, and the footer glossary spells them back out. Comma-separate for multiple
  (`Vegan,Low Calorie`). An unmapped tag renders as written — add it to `TAG_ABBREV` and
  the footer legend in `bowls.html` together.
- **badge** — flexible. `Chef's Spotlight` → green, `Most Loved` → brown, anything else →
  default sage green. Blank = no badge. Badges show on the grid tile only, not the hero.
- **featured** — `TRUE` puts the bowl in the rotating hero slideshow (left panel). Not every
  bowl needs to be featured; weak photos can stay in the grid and be left out of rotation.
- **image** — the **slug**, with no extension (e.g. `thai-zen`). The code appends
  `-side.png` / `-top.png` and the `images/nobg/` path itself.
- **img_x / img_y / img_scale** — per-bowl framing nudge on the tile (see below).
  Blank = 50/50/1. Rarely needed now that `build-bowl-cutouts.mjs` normalizes size
  and position automatically.

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
- **Phase 3 ✅** — GitHub Pages + kiosk setup on the physical screens.
- **Phase 3.5 ✅** — Screen 1 redesigned for wall-distance legibility (dark hero, cut-out
  photography, abbreviated tags + glossary). Rules captured in `DESIGN-PRINCIPLES.md`.
- **Phase 4 ⏳** — Build Screens 2 (Wraps & Paninis), 3 (Beverages), 4 (Salads & Toasts),
  reusing this same structure **and `DESIGN-PRINCIPLES.md`**.

## Known TODO
- `tropical-fruit-salad` has only one photo (a 3/4 angle), so its grid tile shows that
  angle rather than a true overhead like the other eight. Needs a new photograph.
- Cut-out PNGs are 900×900 regardless of use; tiles display them at 123px. Downscaling the
  `-top.png` files would cut first-paint time on store wifi if the boards ever feel slow.

---

## Conventions for working in this repo
- **Read `DESIGN-PRINCIPLES.md` before designing a new screen.** It records not just the
  rules but which of them came from mistakes worth not repeating.
- **Check every web feature against Chrome 69** — the store TVs are new but their WebView
  is from 2018. A JS syntax error there is fatal *and silent*: the page renders static HTML
  with no console anyone can see. See DESIGN-PRINCIPLES §9 for the banned list.
- Keep it **dependency-free** on the live site. Node scripts are offline tooling only.
- When changing how images are framed, **update `script.js` and `adjust.html` together**.
- The owner is **non-technical** — prefer solutions they can drive from the Sheet or a simple
  local tool over anything requiring code edits.
- **Verify at real display size**, and with Playwright rather than the Browser pane (its
  screenshots are unreliable in this environment).
- Commit messages: short, present-tense summary line.
