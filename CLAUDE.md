# Green Feast — Digital Menu Board

## What this project is
A set of **digital menu boards** for Green Feast, a premium vegetarian QSR (quick-service
restaurant) in Jaipur. The menus run on **4 physical 40" screens** (1920×1080, landscape)
mounted in the store. The screens are **display-only** — no touch, no interaction. They just
show the menu and auto-update when the data changes.

**Screen 1 (Healthy Bowls), Screen 2 (Wraps, Paninis & Open Toasts), and Screen 3
(Beverages) are built.** Screen 4 (Salads & Toasts) is planned and will reuse the
same shared core.

## Tech stack (deliberately simple)
- Plain **HTML + CSS + vanilla JavaScript**. No frameworks, no build step, no npm at runtime.
- The only Node.js usage is **offline image tooling** (sharp), not part of the live site.
- Hosted free on **GitHub Pages**. Bowl data lives in a **Google Sheet** (published as CSV).

The whole thing is intentionally low-tech so it's cheap, reliable, and editable by a
non-developer (the owner edits a spreadsheet, not code).

---

## How it works (data flow)

```
Google Sheet (owner edits menu)
      │  published as CSV
      ▼
<screen>.js  ──fetch──►  parses CSV  ──►  builds HTML  ──►  <screen>.html renders on screen
      │
      └─ caches to localStorage (so the screen survives a wifi/Google outage)
```

- Each board (`bowls.html`, `wraps.html`, …) is a fixed **1920×1080 canvas** that CSS
  scales to fit whatever display it's shown on (`transform: scale()`, calculated in
  `core.js`).
- Every board loads **`core.js`** first, then its own script (`bowls.js`, `wraps.js`,
  `beverages.js`).
  `core.js` holds the parts that must behave identically everywhere: viewport
  scaling, CSV parsing, the fetch+localStorage cache pattern, fullscreen-on-gesture,
  and the tag-abbreviation map. The screen's own script owns its data shape and how
  it builds that screen's HTML.
- Same split on the CSS side: **`core.css`** (tokens, canvas, shared tag/macro/badge
  pills, the upsell rail, the footer strip) loads before the screen's own file
  (`bowls.css`, `wraps.css`, …), which holds only that screen's layout.
- Each board **re-fetches every 5 minutes**, so Sheet edits appear on screen
  automatically. Every successful fetch is saved to `localStorage`; if Google is
  unreachable, the last good copy is shown instead of a blank screen.

### Two data sources, on purpose (per screen)
1. **Google Sheet (CSV)** → the menu items themselves. Things the owner changes often
   (name, price, macros, tags, badges, image framing). Screen 1's URL is
   `BOWLS_SOURCE` in `bowls.js`; Screen 2's is `WRAPS_SOURCE` in `wraps.js`; Screen 3's
   is `BEVERAGES_SOURCE` in `beverages.js` — each its own tab in the same Sheet
   document (see below).
2. **A local config JSON** (`data/config.json` for Screen 1, `data/screen2-config.json`
   for Screen 2, `data/screen3-config.json` for Screen 3) → static content that rarely
   changes: Screen 1's Build-Your-Own tile, Screen 2's panel title/stat chips/wrap
   photo, Screen 3's section headings/sweetener note, and each screen's upsell rail.

---

## File map

| File | What it does |
|------|--------------|
| `DESIGN-PRINCIPLES.md` | **Read before designing any new screen, and §12 before any cross-screen change.** The design rules distilled from building Screens 1–2 — legibility, tags, photography, colour, Chrome 69 limits — plus §12's shared element vocabulary and typography tokens. |
| `check-consistency.mjs` | **Run manually before pushing** (`node check-consistency.mjs`). Reports canonical elements (Item Name / Desc / Price) using literal font sizes instead of tokens, and font-size drift between screens. Offline tooling — not part of the live site. |
| `core.css` | **Shared by every board.** Reset, colour tokens, fonts, the 1920×1080 canvas, tag/macro/badge pill styling, the upsell rail, the footer strip. If a rule should look identical on all four screens, it lives here — not in a screen's own CSS file. |
| `core.js` | **Shared by every board.** Viewport scaling, CSV parsing, the fetch+localStorage cache pattern (`loadData()`), fullscreen-on-gesture, and the tag-abbreviation map (`TAG_ABBREV`). Screen-specific data shapes and render logic do not belong here. |
| `bowls.html` / `bowls.css` / `bowls.js` | Screen 1 — Power Bowls: hero slideshow + 2×5 tile grid. Loads `core.css`/`core.js` first. |
| `wraps.html` / `wraps.css` / `wraps.js` | Screen 2 — Wraps, Paninis & Open Toasts: static feature panel (no slideshow) + stacked category blocks. Loads `core.css`/`core.js` first. |
| `beverages.html` / `beverages.css` / `beverages.js` | Screen 3 — Beverages: no hero/slideshow, no 525px dark left panel, and (as of this revision) no dark header band either — `.main-content` starts at the screen's top edge. Two side-by-side columns: a 3x2 Functional Smoothies grid and a 2x2 Coffee grid. Loads `core.css`/`core.js` first. See DESIGN-PRINCIPLES §2 for the header-band history and the "no dark anchor" tradeoff this board now carries. |
| `tvtest.html` | **On-TV diagnostic.** ES5-only page reporting browser engine + feature support in large text. Open this first when a board renders wrong. |
| `adjust.html` | **Image adjuster tool** — local page with live sliders to frame each bowl photo, then export a finished CSV. (See "Image framing" below.) Screen 1 only, for now. |
| `data/config.json` | Screen 1 static content: Build-Your-Own tile + upsell rail items. |
| `data/bowls-sheet.csv` | Local snapshot/template of the Screen 1 Sheet tab. **Not what the live board reads** — see the caching note below. |
| `data/screen2-config.json` | Screen 2 static content: panel eyebrow/title, the panini and wrap summary stat chips (both sections share a macro range now, no per-item macros), the panini and wrap image slugs, the column-3 combo block (`combos`), and the bottom-rail upsell (`upsell`, quick add-ons only — meal upgrades moved to `combos`). |
| `data/wraps-sheet.csv` | Local snapshot/template of the Screen 2 Sheet tab, grouped by a `section` column (`panini`/`toast`/`wrap`). **Not what the live board reads** — same caching note as `data/bowls-sheet.csv` below. |
| `data/screen3-config.json` | Screen 3 static content: the two section headings ("Functional Smoothies", "Coffee") and the upsell rail. `upsellHeading` (string) + `upsell` (array of pipe-delimited `"text \| price"` strings) — same shape as Screens 1–2, rendered through the shared `renderPipeUpsell()` in `core.js`. The smoothie section's sweetener disclaimer lives on `sections.smoothie.note` (rendered inline next to the "Functional Smoothies" heading), not on `upsell` — it's scoped to that section, not the rail. Screen 3's footer is now the same glossary block as Screens 1–2 (no board-specific footer content remains). |
| `data/screen3-sheet.csv` | Local snapshot/template of the Screen 3 Sheet tab, grouped by a `section` column (`smoothie`/`coffee`). **Not what the live board reads once the Sheet tab is published** — same caching note as `data/bowls-sheet.csv` below. |
| `images/nobg/` | Screen 1's transparent cut-outs: `<slug>-side.png` (hero) + `<slug>-top.png` (tile). |
| `images/screen2/` | Screen 2's transparent cut-outs: the panini and wrap (`bbq-plate`) feature photos (trimmed only), plus the three Open Toasts photos (normalized to a shared canvas so they read as a matched set). |
| `images/screen3/` | Screen 3's transparent cut-outs, one per smoothie/coffee (`<slug>.png`). Trimmed to alpha bounding box only — **no shared canvas** (a deliberate departure from the Screen 2 pattern; see DESIGN-PRINCIPLES §6). The board normalizes them by CSS height instead. |
| `images/` | The square JPG crops Screen 1's cut-outs were built from. Kept as the `HERO_CUTOUT_UNAVAILABLE` fallback source. |
| `build-bowl-cutouts.mjs` | **Screen 1's image pipeline.** Original photo → background removal → alpha repair → isolate subject → trim → normalize. Run from the repo root. |
| `ingest-manual-cutout.mjs` | Normalizes a hand-cut transparent PNG through the same path, for when the remover fails on a photo (see DESIGN-PRINCIPLES §6). |
| `build-screen2-cutouts.mjs` | Screen 2's image pipeline. Trims hand-cut PNGs to their alpha bounding box; the three Open Toasts photos additionally get placed on a shared canvas at uniform width. Source art lives in the local, gitignored `Screen 2/` folder — this script reads from there. |
| `build-screen3-cutouts.mjs` | Screen 3's image pipeline. Trims pre-background-removed PNGs to their alpha bounding box only — no shared canvas, since all nine sources are already the same cup, angle and lighting. Source art lives in the local, gitignored `Screen3/` folder — this script reads from there. |

### Not committed / local-only
- `node_modules/`, `drive-download-…/` (raw photo dump), `images_compressed/`, `*.bat`,
  `.claude/`, `.playwright-mcp/`, `Screen 2/` and `Screen3/` (source art the cutout
  scripts read from), and loose reference screenshots/mockups in the root — all in
  `.gitignore`.

---

## The Google Sheet columns

**Screen 1 (Power Bowls)** — header row (exact order):

```
id, name, description, price, kcal, protein, fibre, tags, badge, image, featured, img_x, img_y, img_scale
```

- **tags** — write the **full readable name** (`Gluten Free`, `High Protein`, `High Fibre`,
  `Contains Nuts`, `Less Spicy`). `TAG_ABBREV` in `core.js` shortens them to
  `GF`/`PRO`/`FIB`/`N`/`LS` for the tile pills, and the footer glossary spells them back
  out. Comma-separate for multiple (`Gluten Free,High Protein`). An unmapped tag renders
  as written — add it to `TAG_ABBREV` and the footer legend together (each board repeats
  the same legend markup in its own HTML). `Vegan`/`V` and `Low Calorie`/`LC` were retired
  when the menu moved away from an all-vegan lineup.
- **badge** — flexible. `Chef's Special` → green, `Most Loved` → brown, anything else →
  default sage green. Blank = no badge. Badges show on the grid tile only, not the hero.
  (The CSS class is still named `badge-spotlight` — only the menu's wording changed from
  the earlier `Chef's Spotlight`, not the class or the colour it maps to.)
- **featured** — `TRUE` puts the bowl in the rotating hero slideshow (left panel). Not every
  bowl needs to be featured; weak photos can stay in the grid and be left out of rotation.
- **image** — the **slug**, with no extension (e.g. `thai-zen`). The code appends
  `-side.png` / `-top.png` and the `images/nobg/` path itself.
- **img_x / img_y / img_scale** — per-bowl framing nudge on the tile (see below).
  Blank = 50/50/1. Rarely needed now that `build-bowl-cutouts.mjs` normalizes size
  and position automatically.

**Screen 2 (Wraps, Paninis & Open Toasts)** — header row, own tab in the same
Sheet document as Screen 1 (its own `gid` in `WRAPS_SOURCE`):

```
id, section, name, description, price, kcal, protein, fibre, tags, badge, image
```

- **section** — `panini`, `toast`, or `wrap`. Drives which column on the board the row
  renders into. There is no `featured` column — Screen 2 has no slideshow.
- **Both paninis and wraps leave kcal/protein/fibre blank** — each shows its own three
  shared summary stat chips (from `data/screen2-config.json`'s `panel.stats` and
  `sections.wrap.stats`) instead of per-item macros. Toasts fill in all three, same as
  bowls.
- **image** — only toasts use this (one of `avo-feta-toast`, `earthy-hummus-toast`,
  `mango-salsa-toast` — the last is currently unused, no toast row points at it, but the
  file stays). The panini feature photo and the single wrap photo are set in
  `data/screen2-config.json`, not per-row, since only one of each appears on the board.

**Screen 3 (Beverages)** — header row, own tab in the same Sheet document (its own `gid`
in `BEVERAGES_SOURCE`, once published — see "Go live" below):

```
id, section, name, description, benefit, price, kcal, protein, fibre, tags, badge, image
```

- **section** — `smoothie` or `coffee`. Drives which row on the board the item renders into.
  There is no `featured` column — Screen 3 has no slideshow.
- **benefit** — Screen 3's functional-smoothie differentiator, free text (e.g. `Focus`,
  `Antioxidant`) — the owner's to write, not a fixed list. Renders as its own chip on its own
  row below the name (`.smoothie-meta-row`). **Chip colour comes from the `image` slug, not
  this column** — `benefitAccentClass()` in `beverages.js` keys off the drink, so renaming a
  benefit here never touches colour (see `beverages.css`, and DESIGN-PRINCIPLES §7 for the
  palette). Blank for coffee rows.
- **tags** — smoothies can carry Diet Tags too (currently just `Contains Nuts`), rendered in
  the same `.smoothie-meta-row` next to the benefit chip via the shared `tagsHTML()` helper —
  same abbreviation (`N`) and footer glossary as Screens 1–2. Coffee rows have none.
- **description** — any occurrence of `brahmi`, `shatavari`, `ashwagandha`, or `blue spirulina`
  (case-insensitive) is automatically highlighted on the board (`POWER_INGREDIENTS` in
  `beverages.js`). No Sheet markup needed; just write the ingredient name normally.
- Screen 3 uses **kcal/protein/fibre**, same three macros as Screens 1–2 — there is no
  sugar column anywhere in the Sheet or the render.
- **image** — the slug (e.g. `blue-mind`); the code appends `images/screen3/<slug>.png`.
  Every row uses this column — unlike Screen 2, there's no shared feature photo.

⚠️ **Important caching note:** Google's published-CSV link is cached on **Google's servers
for ~5 minutes**. After editing the Sheet, the live screen updates within ~5 min on its own.
A browser hard-refresh does NOT bypass this — the delay is on Google's end, not ours.
Applies to all boards reading from published Sheet tabs.

---

## Image framing (the adjuster)
Photos are pre-cropped to **squares**, so they fill the circular cutouts perfectly at the
default. To re-frame a bowl (zoom/pan), **do not guess numbers in the Sheet** — the 5-minute
Google delay makes that painful. Instead:

1. Open **`adjust.html`** on the local server (e.g. `http://localhost:3100/adjust.html`
   — pick a port that isn't already in use by something else on the machine).
2. Drag the **Zoom / Horizontal / Vertical** sliders — preview updates instantly.
   (Zoom in first, then pan — a square photo at zoom 1 has no spare image to pan into.)
3. Click **Download updated CSV**.
4. In Google Sheets: **File → Import → Upload → Replace current sheet**.

Under the hood, framing is applied as `transform: translate(img_x−50%, img_y−50%)
scale(img_scale)` on the `<img>`. **`bowls.js` and `adjust.html` must keep this formula
identical** so the preview matches the real screen. (Screen 1 only — Screen 2's cut-outs
are pre-normalized by `build-screen2-cutouts.mjs` and have no per-item framing controls.)

---

## Running & deploying

**Local preview** (for development): serve the folder and open the board you're working
on, e.g. `npx serve . --listen 3100 --no-port-switching` then
`http://localhost:3100/bowls.html`, `http://localhost:3100/wraps.html`, or
`http://localhost:3100/beverages.html`. Pin the port
explicitly (`--no-port-switching`) and check the page `<title>` after navigating —
`serve` silently falls back to a different port if the one you asked for is taken by
another project, and a stale tab pointed at the wrong port will show the wrong site
without any error.

**Live site** (GitHub Pages):
- Repo: `https://github.com/jsamarth729-cell/green-feast-menu`
- Live URLs: `.../bowls.html` (Screen 1), `.../wraps.html` (Screen 2), `.../beverages.html`
  (Screen 3)
- Deploy = commit + push to `main`. Pages rebuilds automatically in ~1 min.

**On the physical screens** (kiosk mode), point each TV at its own board:
```
chrome.exe --kiosk https://jsamarth729-cell.github.io/green-feast-menu/bowls.html
chrome.exe --kiosk https://jsamarth729-cell.github.io/green-feast-menu/wraps.html
chrome.exe --kiosk https://jsamarth729-cell.github.io/green-feast-menu/beverages.html
```

---

## Project phases
- **Phase 1 ✅** — Build Screen 1 from local JSON data.
- **Phase 2 ✅** — Swap data source to Google Sheets (live, auto-refresh).
- **Phase 3 ✅** — GitHub Pages + kiosk setup on the physical screens.
- **Phase 3.5 ✅** — Screen 1 redesigned for wall-distance legibility (dark hero, cut-out
  photography, abbreviated tags + glossary). Rules captured in `DESIGN-PRINCIPLES.md`.
- **Phase 4a ✅** — Extracted the shared `core.css`/`core.js` from Screen 1's original
  `style.css`/`script.js`, then built Screen 2 (Wraps, Paninis & Open Toasts) on top of
  it. Screen 2 intentionally departs from Screen 1's layout (static feature panel
  instead of a slideshow, stacked category blocks instead of a 2×5 grid) — see
  DESIGN-PRINCIPLES §2 for which parts of a new screen's layout are fixed vs free.
- **Phase 4c ✅** — Published a Google Sheet tab for Screen 2 and pointed `WRAPS_SOURCE` in
  `wraps.js` at it, same as `BOWLS_SOURCE`. Both boards now read live Sheet tabs — the owner
  can edit either from a spreadsheet, no code changes needed for routine menu edits.
- **Phase 4b ✅ (Screen 3) / not started (Screen 4)** — Screen 3 (Beverages) is built,
  its Sheet tab is published, and `BEVERAGES_SOURCE` in `beverages.js` points at the live
  URL — same "Go live" steps Screen 2 followed in Phase 4c. It's been on GitHub Pages
  through several rounds of menu and layout revisions since. Screen 3 intentionally departs
  further from Screens 1–2 than just the panel shape: it has no 525px dark left panel, and
  (as of a later revision) no dark header band either — its only dark anchor is the shared
  upsell rail + footer strip at the bottom. See DESIGN-PRINCIPLES §2 for the full history
  and the tradeoff that departure carries. Screen 4 (Salads & Toasts) is not started —
  no code, no design pass, no Sheet tab.

## Known TODO
- `tropical-fruit-salad` has only one photo (a 3/4 angle), so its grid tile shows that
  angle rather than a true overhead like the other eight. Needs a new photograph.
- Cut-out PNGs are 900×900 regardless of use; tiles display them at 123px. Downscaling the
  `-top.png` files would cut first-paint time on store wifi if the boards ever feel slow.

---

## Conventions for working in this repo
- **No code changes without explicit approval.** Investigate, read, measure, and propose
  freely — but do not edit, create, or delete a file until the owner has said yes to that
  specific change. Show the proposed diff or describe the change precisely, then wait.
  This applies to "obvious" fixes and one-line tweaks too: the boards hang side by side in
  a live store, and an unreviewed change on one screen is how they drift apart.
- **Read `DESIGN-PRINCIPLES.md` before designing a new screen.** It records not just the
  rules but which of them came from mistakes worth not repeating.
- **Read `DESIGN-PRINCIPLES.md` §12 before *any* change that touches more than one
  screen.** It defines the shared vocabulary — Item Name, Item Desc, Item Price, Macro
  Chip, Diet Tag, Item Badge, Benefit Chip — and the typography tokens they take their
  sizes from. Note that **Diet Tag** (GF/PRO/FIB/N/LS) and **Item Badge** (Chef's Special)
  are named the opposite of how most people say them out loud; always use the two-word form.
- **Canonical elements take sizes from tokens, not literals.** A bare `px` on an Item
  Name, Item Desc, or Item Price is a bug unless commented. Deliberate per-screen
  variation is fine — but it gets a *named* variant token, so intent is readable.
- **Run `node check-consistency.mjs` before pushing.** Manual, not automatic. It reports
  canonical elements using literal sizes and any token that has drifted.
- **Check every web feature against Chrome 69** — the store TVs are new but their WebView
  is from 2018. A JS syntax error there is fatal *and silent*: the page renders static HTML
  with no console anyone can see. See DESIGN-PRINCIPLES §9 for the banned list.
- Keep it **dependency-free** on the live site. Node scripts are offline tooling only.
- When changing how Screen 1's images are framed, **update `bowls.js` and `adjust.html`
  together**.
- **A rule that should look identical on every board belongs in `core.css`/`core.js`, not
  in a screen's own file.** Before copying something from `bowls.css`/`bowls.js` into a
  new screen, check whether it's already shared — and if a fix needs to happen on every
  board, it almost certainly belongs in `core.*` rather than being patched per screen.
- The owner is **non-technical** — prefer solutions they can drive from the Sheet or a simple
  local tool over anything requiring code edits.
- **Verify at real display size**, and with Playwright rather than the Browser pane (its
  screenshots are unreliable in this environment).
- Commit messages: short, present-tense summary line.
