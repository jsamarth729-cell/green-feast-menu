# Screen 3 Menu Update — Execution Plan

**Branch:** `screen3-menu-update` (off `main` @ `d756a58`)
**Source of truth:** `GreenFeast_QSR_Menu_UPDATED.docx`
(`D:\Sam\SAMARTH STEPPING INTO BUSINESS\2026 I am Growing Greenfeast\QSR\Menu\`)
**Baseline compared against:** `GreenFeast_QSR_Menu_LIVE_2026-08-21.docx` (repo root)
**Status:** plan only — no code changed yet.

---

## 1. What actually changed

Every highlighted edit in the new doc lands on **Screen 3 (Beverages)**. Screens 1, 2
and 4 are untouched — a full text diff of the two docx files shows no change to Power
Bowls, Panini, Wraps, Open Toasts, or the Make-It-a-Meal block.

### 1a. Smoothie macros — six rows

| Item | Live (kcal / protein / fibre) | New | Delta |
|---|---|---|---|
| Blue Mind | 190 / 7 / 4 | **155 / 3 / 3** | −35 kcal, −4g protein |
| Going Nuts | 235 / 9 / 5 | **235 / 5 / 5** | −4g protein only |
| Avo Clarity | 280 / 5 / 9 | **400 / 5 / 10** | +120 kcal, +1g fibre |
| Purple Pulse | 220 / 8 / 5 | **175 / 3 / 3** | −45 kcal, −5g protein |
| Cocoa Core | 340 / 9 / 5 | **470 / 8 / 10** | +130 kcal, +5g fibre |
| Berry Bloom | 195 / 6 / 6 | **170 / 3 / 4** | −25 kcal, −3g protein |

### 1b. Coffee — one item replaced

`Ginger Ale Cold Brew` (60 kcal, slug `gingerale-cold-brew`) is **out**.
`Spanish Ice Latte` is **in**, at the same grid position and the same ₹250:

```
name:        Spanish Ice Latte
description: "Sweet, milky Spanish-style iced coffee, espresso cut with
              condensed milk, 300 ml serving"     <- see Decision D1: this does not fit
price:       250
kcal:        165
image:       spanish-ice-latte                    <- new photo needed
```

### 1c. Add-ons — annotation only

The doc now tags each add-on with which screen shows it
(`– screen1 and 2`, `- screen 3`). These are the owner's routing notes, **not**
copy to render. The underlying add-on set already matches what's shipped.

---

## 2. Already done (verify, don't redo)

| Doc change | State |
|---|---|
| Avo Clarity benefit `Women Wellness` → `Gut Health` | **Already live** in the published Sheet (confirmed by fetching the CSV). Only the local snapshot `data/screen3-sheet.csv` is stale. |
| `Add 10g Collagen to Any Smoothie – ₹120` | **Already shipped** — `data/screen3-config.json` carries both Screen 3 add-ons. |
| Screen 1 / 2 add-ons (₹50 × 2) | **Already correct** in `data/config.json` and `data/screen2-config.json`. |

---

## 3. Decisions needed before work starts

### D1 — The Spanish Ice Latte description does not fit *(blocking)*

`.coffee-desc` is hard-clamped to exactly two lines
(`-webkit-line-clamp: 2`, `height: calc(18px × 1.3 × 2)` = 46.8px). Measured on the
real board at 1920×1080: coffee card = 352px wide, text column = 320px.

| Candidate text | Lines | Fits? |
|---|---|---|
| `Sweet, milky Spanish-style iced coffee, espresso cut with condensed milk, 300 ml serving` (doc text) | **3** | ✗ truncated with an ellipsis |
| `Spanish-style iced coffee, espresso cut with condensed milk, 300 ml serving` | **3** | ✗ |
| `Espresso cut with sweet condensed milk, 300 ml serving` | 2 | ✓ |
| `Espresso with condensed milk, 300 ml serving` | 2 | ✓ |

All four existing coffee descriptions already sit at exactly 2 lines, so there is no
headroom to borrow.

- **Option A (recommended):** shorten the copy to
  `Espresso cut with sweet condensed milk, 300 ml serving`. Zero code change; the doc
  text's "Spanish-style" is already carried by the item name right above it.
- **Option B:** raise the clamp to 3 lines on Screen 3. That steals ~23px from every
  coffee card's photo box, shrinking all four cups relative to the six smoothies — the
  card-height parity that `beverages.css`'s `.coffee-photo { margin-bottom: 40px }`
  exists to protect. Not recommended.

Owner picks the wording. Nothing else in this plan is blocked by it.

### D2 — Is the attached photo a *distinct* Spanish Ice Latte shot?

The image supplied looks very close to the existing `images/screen3/iced-latte.png`
(same cup, same dark-over-cream swirl). Spanish Ice Latte and Iced Latte sit in the
**same 2×2 coffee grid, adjacent cards** — two near-identical photos read as a
rendering bug from across the room. Need either a visibly different shot (more
condensed-milk cream at the base, different swirl) or an explicit "yes, they look
alike, ship it".

### D3 — Does the source photo have a transparent background?

`build-screen3-cutouts.mjs` trims to the alpha bounding box; it does **not** remove
backgrounds (unlike Screen 1's pipeline). A white-background PNG produces a white
rectangle on the card. The nine existing sources were background-removed first — the
new one needs the same treatment before it lands in `Screen3/`.

### D4 — Retire the `gingerale-cold-brew` assets?

Recommend **keep** the PNG and its `MAP` entry — same precedent as `mango-salsa-toast`
on Screen 2 (unused file retained so the item can return without re-running the
pipeline). Costs nothing; no live board fetches it.

### D5 — Sanity-check two macro moves

Blue Mind 7g → 3g protein and Purple Pulse 8g → 3g protein, both of which contain
Greek yoghurt. Plausible if the recipe changed, but worth one confirmation before it
goes on a wall — protein is the number customers read hardest.

---

## 4. Execution order

**The photo must ship before the Sheet row changes.** The Sheet is the live data source
and propagates in ~5 minutes; if `Spanish Ice Latte` appears in the Sheet before
`images/screen3/spanish-ice-latte.png` is on GitHub Pages, the in-store screen shows a
card with an empty photo box for the length of the gap.

### Step 1 — Source art *(owner; blocked on D2/D3)*

Drop the background-removed Spanish Ice Latte PNG into the local, gitignored `Screen3/`
folder.

### Step 2 — Cut-out pipeline *(code)*

Add one line to `MAP` in `build-screen3-cutouts.mjs`:

```js
'spanish-ice-latte':     '<source filename>.png',
```

Run it:

```bash
node build-screen3-cutouts.mjs
```

Two things to check in the output:

1. **Aspect ratio must land in the 0.80–0.89 band** the other ten sit in. The script's
   header comment justifies skipping DESIGN-PRINCIPLES §6 rule 2 (shared canvas) *only
   because* every source is the same cup at the same angle. A photo outside that band
   invalidates the justification and needs the shared-canvas treatment instead.
2. **The script rewrites all PNGs on every run.** After it finishes, run `git status` —
   only `spanish-ice-latte.png` should be new or changed. If sharp re-encodes the
   others, `git checkout -- images/screen3/<file>` to restore them so the diff stays
   reviewable.

### Step 3 — Local snapshot CSV *(code)*

Update `data/screen3-sheet.csv` to mirror exactly what will go into the Sheet — the six
macro rows, the `Gut Health` benefit (already live but stale locally), and row 9
replaced:

```csv
9,coffee,Spanish Ice Latte,"<D1 wording>",,250,165,,,,,spanish-ice-latte
```

This file is a snapshot, not what the board reads — but it is the fallback anyone
reaches for when the Sheet is unreachable, so it must not drift.

### Step 4 — Documentation corrections *(code)*

Four places have drifted and should be corrected in the same change:

| File | Currently says | Should say |
|---|---|---|
| `CLAUDE.md`, `data/screen3-config.json` row | "`upsell` here is a single `{heading, gold:{text,price}}` object" | It is now `upsellHeading` (string) + `upsell` (array of `"text \| ₹price"`) — the same shape as Screens 1–2. Stale since commit `1a3d67d`. |
| `CLAUDE.md`, Screen 3 Sheet columns | "Screen 3 uses **kcal/protein/sugar** (not fibre)" | The column *and* the rendered chip are both `fibre`. There is no sugar column anywhere in the code or the Sheet. |
| `build-screen3-cutouts.mjs` header | "all **nine** Screen 3 photos… nine sources" | Ten today, eleven with the new one. |
| `beverages.css` `.smoothie-meta-row` comment | cites `"Women Wellness"` as the too-wide benefit example | Benefit is now `Gut Health`; keep the width rationale, update the example so it doesn't read as current copy. |

`beverages.js:82` already anticipates this exact rename ("Women Wellness -> Gut Health")
as a hypothetical — a one-word tense fix, optional.

### Step 5 — Verify *(before pushing)*

```bash
node check-consistency.mjs
```

Then serve and inspect at real size:

```bash
npx serve . --listen 3100 --no-port-switching
```

Playwright at 1920×1080 on `http://localhost:3100/beverages.html`, confirming:

- [ ] Four coffee cards; Spanish Ice Latte in Ginger Ale's old grid slot
- [ ] Its description renders on 2 lines with **no ellipsis** — measured via
      `scrollHeight`, not judged by eye
- [ ] Its photo renders at the same height as the other three cups, and the card does
      not pick up the `photo-error` class
- [ ] All six smoothie macro rows show the new numbers and none overflows
      *(pre-measured: all six fit inside 317px, including the two `10g fibre` rows)*
- [ ] Avo Clarity's Benefit Chip reads `Gut Health` and keeps its avocado-green
      `.acc-avo-clarity` colour (colour keys off the image slug, not the benefit text,
      so this should be automatic — confirm rather than assume)
- [ ] Screenshot the full board and compare against `baseline-screenshots/`

Chrome 69 risk: **none**. No new JS syntax, no new CSS features — this change is data,
one image, and one `MAP` line.

### Step 6 — Ship

1. Commit on `screen3-menu-update`, push, merge to `main`. Pages rebuilds in ~1 min.
2. Confirm
   `https://jsamarth729-cell.github.io/green-feast-menu/images/screen3/spanish-ice-latte.png`
   returns 200.
3. **Only then** edit the Google Sheet's Screen 3 tab (gid `219459611`) — six macro
   rows and row 9.
4. Wait ~5 minutes (Google's published-CSV cache, not ours — a hard refresh does not
   bypass it), then check the live board.
5. Confirm on the physical Screen 3, not just a laptop.

---

## 5. Rollback

- **Sheet:** revert row 9 to `Ginger Ale Cold Brew` and the six macro rows to their old
  values. `gingerale-cold-brew.png` is still in the repo (D4), so the old row renders
  immediately — no deploy needed. This is the fast path if something looks wrong in
  store.
- **Repo:** `git revert` the merge commit; Pages rebuilds in ~1 min.
- Both boards cache the last good CSV in `localStorage`, so neither step can leave a
  blank screen.

---

## 6. Files this touches

| File | Change |
|---|---|
| `build-screen3-cutouts.mjs` | +1 `MAP` entry, header comment count |
| `images/screen3/spanish-ice-latte.png` | new (generated) |
| `data/screen3-sheet.csv` | 6 macro rows, 1 benefit, row 9 replaced |
| `CLAUDE.md` | two stale Screen 3 descriptions |
| `beverages.css` | one stale comment example |
| `beverages.js` | one stale comment tense (optional) |
| Google Sheet, Screen 3 tab | 6 macro rows, row 9 — **owner, done last** |

No change to `beverages.html`, `core.css`, `core.js`, or any other screen.
