# Screen 2 — Open Toast cards: photo left, text beside it

**Status:** approved by the owner 2026-10-01. Decisions locked: photo on the **left**;
"Earthy Hummus Toast" is allowed to wrap to **two lines**.

## Goal
Keep each toast card's size (642×309 at 1920×1080) and every font size exactly as they
are, but rearrange the card so the photo grows. Today the card is a vertical stack (photo,
name, desc, footer); the text uses ~150px of height, which caps the photo at **186×130**.
Side by side, the photo gets about **319×223** (~1.7× wider and taller, ~2.9× the area).

```
┌──────────────────────────────────────────┐
│ ┌──────────────┐   Avo Feta Toast        │
│ │    PHOTO     │   Sourdough, guacamole, │
│ │   ~319×223   │   feta cheese, cherry   │
│ └──────────────┘   tomato, seed mix, …   │
│ ─────────────────────────────────────────│
│ 325 kcal  8g protein  7g fibre      ₹329 │
└──────────────────────────────────────────┘
```

## Where to work (important)
- Work **only** in the worktree `d:\Sam\SAMARTH STEPPING INTO BUSINESS\AI\Claude Code Sessions\QSR Menu-toast`,
  branch `screen2-toast-layout` (cut from `main`).
- **Do not touch** the main folder `...\QSR Menu`: another session is editing the dessert
  panel there with uncommitted changes to `wraps.css`/`wraps.js`. The one exception is
  saving Playwright screenshots into `...\QSR Menu\.playwright-mcp\` (gitignored), because
  Playwright only allows writes under that folder.
- Do not push, merge, or switch branches in either folder.

## Scope
- **Changes:** the Open Toasts card rules in `wraps.css` and the `?v=` cache-bust on the three boards.
- **Doesn't change:** `wraps.js` (`toastCardHTML()` markup works with grid areas as is), `wraps.html`
  markup, images, Sheet, `core.*`, font tokens, card size, `.toast-grid`, combo block, footer content.

---

## Step 1 — Replace the toast card CSS in `wraps.css`

Replace everything from the comment line starting `/* ─── Open Toasts — vertical, 1-up`
(currently line 233) through the end of the `.toast-price { … }` rule (currently line 331)
with exactly this block:

```css
/* ─── Open Toasts — vertical, 1-up (was a 3-up row before the menu
   dropped to 2 toasts and the layout moved to three parallel columns).
   Card internals: photo left, name + desc beside it, footer full width
   below. Was photo top / centered text — that stacked ~150px of text
   under the photo and capped it at 186x130 in a 642x309 card; side by
   side it gets ~319x223 at the same card size and font tokens. ────── */
/* flex:1 lets this block absorb whatever vertical slack the column has
   left over, and each card's photo cell is what spends it — so the
   photo grows automatically instead of leaving dead space. */
.toast-grid {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(2, 1fr);
  grid-gap: 16px;
  gap: 16px;
  flex: 1;
  min-height: 0;
}
/* Fixed 339px photo column (319px photo + 20px gutter): 223px of photo
   height x the 900:630 image ratio. A fixed width, not an auto column
   sized off the image, because that depends on percentage-height
   resolution Chrome 69 may not do the same way. The two 1fr rows above
   and below name/desc centre the text block beside the photo. */
.toast-card {
  background: var(--card);
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(40,63,40,0.06), 0 1px 3px rgba(40,63,40,0.04);
  padding: 16px;
  display: grid;
  grid-template-columns: 339px 1fr;
  grid-template-rows: 1fr auto auto 1fr auto;
  grid-template-areas:
    "photo ."
    "photo name"
    "photo desc"
    "photo ."
    "foot  foot";
  text-align: left;
  position: relative;
  /* Grid items get an implicit min-height:auto (= content size), which
     blocks the row from actually stretching this card down to the
     grid's stretched track height — it overflows into whatever sits
     below the grid instead of shrinking. min-height:0 here is what
     lets the photo cell take only the height that's left. */
  min-height: 0;
}
/* The img is absolutely positioned against this cell rather than sized
   with max-height:100% — a percentage height on a child of a stretched
   grid item is exactly what a 2018 engine can resolve to auto, which
   would silently bring back the small photo. The cell's height comes
   from the grid; the image contributes nothing to it, so a longer
   description can't push the card taller. */
.toast-photo-wrap {
  grid-area: photo;
  position: relative;
  min-height: 0;
  margin: 0 20px 10px 0;
}
.toast-photo-wrap img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.toast-photo-wrap.photo-error {
  display: flex;
  align-items: center;
  justify-content: center;
}
.toast-name-row {
  grid-area: name;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 6px;
}
.toast-name-row > * + * {
  margin-left: 6px;
}
.toast-name {
  font-family: var(--font-item-name);
  font-size: var(--fs-item-name);
  font-weight: 600;
  color: var(--forest);
  line-height: 1.2;
}
/* 4-line clamp: the ~271px text column wraps today's descriptions to 3
   lines; the 4th is headroom for a longer Sheet edit. Worst case
   (2-line name + 4-line desc, ~160px) still fits the ~223px beside the
   photo. */
.toast-desc {
  grid-area: desc;
  font-size: var(--fs-item-desc);
  color: var(--c-item-desc);
  line-height: 1.32;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
}
.toast-footer {
  grid-area: foot;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-top: 10px;
  border-top: 1px solid rgba(88,120,88,0.12);
}
.toast-price {
  font-size: var(--fs-item-price);
  font-weight: 600;
  color: var(--forest);
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
  margin-left: 8px;
}
```

Chrome 69 check (DESIGN-PRINCIPLES §9): CSS grid, `grid-template-areas` with `.` cells,
`object-fit`, `-webkit-line-clamp` are all supported. No `gap` inside the card (margins
only). No JS change.

## Step 2 — Bump the cache-bust to `?v=6`
In `bowls.html`, `wraps.html`, `beverages.html`, change every `?v=4` to `?v=6` (the two
`<link>` and two `<script>` tags in each file — 12 occurrences total). **6, not 5:** the
unmerged `screen2-dessert-panel` branch already uses `?v=5`; skipping it means the two
changes can never ship under the same number. Confirm with
`grep -n "?v=" bowls.html wraps.html beverages.html` — all must read `?v=6`.

## Step 3 — Serve the worktree
From the worktree folder: `npx serve . --listen 3101 --no-port-switching` (background).
Port 3100 is the main folder's server — do not use it. After navigating, confirm the page
title is "Green Feast — Wraps & Paninis" and the URL is on 3101.

## Step 4 — Verify with Playwright at 1920×1080
Resize the viewport to 1920×1080, open `http://localhost:3101/wraps.html`, wait for the
toast cards to render. Check each of the two `.toast-card`s with `getBoundingClientRect`:

| Check | Pass |
|---|---|
| card size | 642×309 (±1px), same top positions as before: 93 and 418 |
| `img` box | width ≥ 310 and height ≥ 215 (target ~319×223); left edge = card left + 16 |
| `.toast-name-row`, `.toast-desc` | left edge ≥ img right + 15; both fully inside the card |
| `.toast-desc` | `scrollHeight` ≤ `clientHeight` + 1 (no hidden overflow); 3 lines at most today |
| `.toast-footer` | width 610, bottom within the card's inner bottom (card bottom − 16) |
| font sizes | `getComputedStyle` font-size of `.toast-name`, `.toast-desc`, `.toast-price` unchanged from `main` (compare against the values the tokens resolve to — they should be the same tokens, untouched) |

Screenshot `.toast-column` to `...\QSR Menu\.playwright-mcp\toast-after.png` and look at it:
photo on the left, name + desc centred vertically beside it, footer line and macros/price
along the bottom, "Earthy Hummus Toast" on two lines is fine.

Stress tests — inject in the browser only (`page.evaluate`), never write them to files,
reload the page after each:
1. **Long description:** set the first card's `.toast-desc` text to ~3× its current length.
   Pass: clamped at 4 lines, card still 642×309, nothing overlaps the footer.
2. **Badge:** insert `<div class="tile-badge badge-spotlight">Chef's Special</div>` as the
   first child of the first card. Pass: badge doesn't overlap the name text. Screenshot it
   to `.playwright-mcp\toast-badge.png`. If it does overlap, stop and report — don't fix.
3. **Broken image:** set the first card's img `src` to a missing file. Pass: the photo cell
   stays empty, text and footer don't move.

The dessert panel isn't on `main`, so it can't be checked here. That happens when the two
branches are merged (see "After this plan").

## Step 5 — Consistency check
Run `node check-consistency.mjs` from the worktree. Pass: no new warnings for `toast-name`,
`toast-desc`, `toast-price` (they still use tokens). Report the full output either way.

## Step 6 — Commit (no push)
On branch `screen2-toast-layout`, stage `wraps.css`, `bowls.html`, `wraps.html`,
`beverages.html`, `SCREEN2-TOAST-LAYOUT-PLAN.md` — nothing else. Commit message:

```
Screen 2: toast cards photo-left to enlarge photos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Do not push. Stop the `serve` process you started. Report: measurements table,
stress test results, check-consistency output, screenshot paths, commit hash.

---

## After this plan (owner's call, not part of execution)
- **Ship:** merge `screen2-toast-layout` into `main` and push. Then one hard refresh on the
  Screen 2 TV (and the other two, since `?v=` changed on all boards).
- **When the dessert-panel branch merges later:** `wraps.css` edits are in separate regions
  (toast ~233–331, dessert ~575+), so they should merge cleanly, but the `?v=` lines will
  conflict. Resolve to **`?v=7`** on all twelve references, then check one dessert-panel
  fade cycle over the new toast cards.
- Remove the worktree afterwards: `git worktree remove "../QSR Menu-toast"`.
