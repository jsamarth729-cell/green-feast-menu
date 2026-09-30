# Screen 2 — Dessert Panel ("Healthier indulgences") — Execution Plan

**Branch:** `screen2-dessert-panel` (created off `main` at `cbee086`). Nothing merges
to `main` or gets pushed until the owner says so.
**Status:** plan only. No code changed yet.
**Pattern it copies:** Screen 3's offers panel. Read `SCREEN3-OFFERS-PANEL-PLAN.md`
(all three revisions) first. This plan reuses its mechanics and its lessons, and
re-litigates neither.

Read `DESIGN-PRINCIPLES.md` §2 (layout skeleton), §3 (why Screen 2 had no offers
surface until now), §6 (photography), §7 (colour), §9 (Chrome 69) and §12
(vocabulary) before starting.

---

## 1. What this builds

Screen 2's right-hand column (Open Toasts + the "Make it a meal" combo block) gains
a second mode. On a repeating cycle, a **warm sand panel** fades in over that
column and shows the dessert range at poster size. Then it fades out and the
toasts come back.

```
        30s                         15s                        30s
┌──────┬───────┬───────┐  ┌──────┬───────┬───────┐  ┌──────┬───────┬───────┐
│panini│ wraps │toasts │  │panini│ wraps │DESSERT│  │panini│ wraps │toasts │
│(dark)│(cream)│+combo │→ │(dark)│(cream)│(sand) │→ │(dark)│(cream)│+combo │
├──────┴───────┴───────┤  ├──────┴───────┴───────┤  ├──────┴───────┴───────┤
│ upsell rail / footer │  │ upsell rail / footer │  │ upsell rail / footer │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

Panel content, as the owner supplied it:

```
HEALTHIER INDULGENCES
Quinoa Orange Cake
A tender quinoa sponge, crowned with fresh mandarin
and a glossy dark chocolate drizzle.
        [ cake-on-plate cut-out ]
────────────────────────────────
1 serving                   ₹149
────────────────────────────────
2 servings                  ₹249
```

---

## 2. Decisions already made. Do not re-litigate.

| # | Decision | Rationale |
|---|---|---|
| D1 | **The panel is warm sand, not green and not dark.** | Owner's call: the panini panel on the same board is already dark green, so a second green mass would make the board read as two identical bookends. Sand also separates from the cream board (`#F5F0E8`) and the white toast cards. A white panel would read as one more card, not a mode change. |
| D2 | **It covers the whole right column: both toast cards and the combo block.** | Owner accepted the recommendation. It matches Screen 3's geometry exactly (top 0, bleeds to top/right edges, stops on the rail). Covering only the toast grid would leave the combo block hanging under a panel that doesn't reach the rail, which looks like a layout fault. **Accepted cost:** Open Toasts and the meal combos are off-screen for 15s of every 45s. That is the same trade Screen 3 makes with coffee. |
| D3 | **Timing: 30s menu / 15s panel**, the same as Screen 3. | Owner's call. |
| D4 | **Transition: "dip to panel".** The ground fades in over 450ms and its contents follow after a 380ms delay. | Screen 3's J1, unchanged. The delay is what makes it read as a deliberate switch rather than a rendering glitch, and it matters *more* here: sand-on-cream is a softer contrast step than dark-on-cream. |
| D5 | **Keep the plate in the photo.** | Owner's call: the panini and wrap feature photos both show a plate, so the dessert should too. |
| D6 | **Gold is not used anywhere on this panel.** | `--gold` (`#FEFA67`) is near-invisible on a light ground. Prices take a new burnt-orange accent instead (§5), recorded in DESIGN-PRINCIPLES §7. |
| D7 | **Content lives in `data/screen2-config.json`** under a new `dessertPanel` key, not in the Sheet. | Same split as Screen 3's `offersPanel` and Screen 2's own panini panel. A price change is a one-line JSON edit plus a deploy. See §13 open item 2 for the tradeoff. |
| D8 | **Own class names: `.dessert-*`, not `.offers-*`.** | DESIGN-PRINCIPLES §12: "If a future board adds its own offers surface, give it its own scoped selectors." It's also clearer: this panel sells a product, not an add-on. |
| D9 | **The rotation JS is duplicated in `wraps.js`, not hoisted into `core.js`.** | Hoisting means editing `beverages.js`, a live board this change otherwise never touches. About 25 lines of duplication is the smaller risk. Logged as deferred work in §14. |
| D10 | **The panel is an overlay, not a re-layout.** The toast column stays in the DOM underneath. | Screen 3's J6. Nothing reflows on each cycle. |
| D11 | **Panel markup lives in `wraps.html`** as a direct child of `.screen`, after `.main-content` and before `.upsell-rail`. | Screen 3's J7. DOM order gives the right paint stacking with no `z-index`, and being outside `#toastGrid` means `render()`'s `innerHTML` rewrite can't destroy it. |

---

## 3. What this does NOT change

| Thing | Why it stays |
|---|---|
| Screens 1 and 3 (all files) | Out of scope. Only their `?v=` query numbers change (§11). |
| `core.css`, `core.js` | Nothing shared is needed. The rail/footer height tokens (`--h-upsell-rail`, `--h-footer-strip`) already exist from Screen 3's Revision 1. |
| Screen 2's upsell rail ("EXTRAS") | §2 pins the rail as pixel-identical infrastructure. |
| Toast cards, combo block, wraps, panini panel | The panel is an opaque overlay. No markup, CSS or data for them changes. |
| The Google Sheet / `WRAPS_SOURCE` | D7. |

---

## 4. Measured geometry

Measured with Playwright at 1920×1080 on `main` (`cbee086`), `transform: none`:

| Element | left | top | right | bottom | width × height |
|---|---|---|---|---|---|
| `.panini-panel` | 0 | 0 | 525 | 974 | 525 × 974 |
| `.wrap-column` | 569 | 0 | 1210.5 | 954 | 641.5 × 954 |
| `.toast-column` | **1234.5** | 0 | 1876 | 954 | 641.5 × 954 |
| `.toast-grid` | 1234.5 | 92.8 | 1876 | 726.4 | 641.5 × 633.6 |
| `.combo-block` | 1234.5 | 742.4 | 1876 | 954 | 641.5 × 211.6 |
| `.upsell-rail` | 0 | 974 | 1920 | 1038 | 1920 × 64 |

> **Post-build fix (2026-09-30):** shipped at **690px** (left 1230), not 686. At 686
> the toast column's half-pixel start (x=1234.5) let the Open Toasts underline show
> through as a 1px grey sliver on the panel's left edge. 690 puts the edge inside
> the column gutter. The 686 reasoning below is kept as written; inner content
> width becomes 602px.

**Panel box: `width: 686px`**, giving left 1234, top 0, right 1920, bottom 974.
- 686 = the toast column's 641.5 + `.content-panel`'s 44px right padding, rounded up
  half a pixel so the panel edge lands on a whole pixel. It overlaps the 24px gutter
  by 0.5px, which is invisible.
- Height and top edge match the panini panel exactly (974px, top 0). That makes it
  the same rule as Screen 3: height and vertical position match the dark panels,
  only the width differs.
- Inner content width is 686 − 44 − 44 = **598px**. Inner height is 974 − 44 − 36 =
  **894px**.

A fresh baseline screenshot of the current board is at
`.playwright-mcp/baseline-wraps.png` (gitignored). Every "menu phase unchanged"
comparison in §12 is against that file, **not** `baseline-screenshots/`, which is
stale (dated 17 Aug).

---

## 5. Colour

All three values are **scoped custom properties on `.dessert-panel`** in `wraps.css`,
not `core.css` tokens. They belong to one board's one surface, the same way Screen
3's benefit-chip palette lives in `beverages.css` (§7).

| Property | Value | Role | Contrast on the panel |
|---|---|---|---|
| `--dessert-bg` | `#F1DFC6` | Panel ground: warm sand, lifted from the cake photo's own backdrop | n/a (vs board cream `#F5F0E8`, the edge is carried by a shadow, see below) |
| `--dessert-ink` | `#3D2418` | Eyebrow, title, serving labels. The **same** dark chocolate as Screen 3's `.acc-cocoa-core`, not a new colour | ≈ 11.5 : 1 |
| `--dessert-accent` | `#B4540F` | Prices only. Burnt orange from the mandarin segments | ≈ 3.9 : 1 (AA for large text; prices render at 64px bold) |

- **Left-edge shadow.** `box-shadow: -10px 0 28px rgba(61,36,24,0.14)`. Sand against
  cream is a gentle step on its own; the shadow gives the panel a clear edge
  against the wrap column. Only the left edge ever meets the board: the top and
  right edges are screen edges and the bottom sits on the dark rail.
- **Why orange is allowed.** DESIGN-PRINCIPLES §7 reserves gold for "act on this".
  Gold can't be seen here, so the price, which *is* the act-on-this element, takes a
  different hue for the same job. It is scoped to this panel only and must not be
  used anywhere else on the board. It gets its own §7 bullet (§10 below).
- **Check the contrast numbers during verification.** They're computed, not
  measured on the wall.

---

## 6. The image (blocking: needs the owner)

### 6.1 What we have

The owner's photo (pasted in chat): **1254 × 1254 PNG, 3 channels, no alpha**. Cake
slice with mandarin segments and chocolate drizzle, on a cream stoneware plate with
a tan rim, on a cream backdrop.

### 6.2 The project's own remover fails on it. Do not use it.

Tested on 2026-09-30 with `@imgly/background-removal-node` (the remover inside
`build-bowl-cutouts.mjs`), in the scratchpad, no repo files touched:

- The **plate was removed entirely**. That's DESIGN-PRINCIPLES §6 rule 5 exactly: a
  cream plate on a cream backdrop gets classified as background.
- The **cake sponge came out semi-transparent**. Only the orange segments and the
  drizzle survived solid. Opaque fraction: 0.207 of the frame.

Unusable. No alpha-curve repair can bring back pixels zeroed at source (§6 rule 5).

### 6.3 What the owner needs to do

The other Screen 2 feature photos were cut out externally (remove.bg), and this one
has to be too:

1. Remove the background with remove.bg (or Canva's background remover), **keeping
   the plate**. Check the tan rim survives all the way round, as a clean edge.
2. Download at **full resolution**, not the free-tier preview. §11 of
   DESIGN-PRINCIPLES records that free previews come out around 612px wide. The
   panel shows the plate up to **598px wide × 440px tall**, so a preview would be
   upscaled or at best 1:1, and would look soft on a 40" screen. The 1254px original
   should give a ~1200px-wide cut-out.
3. Save as:
   ```
   Screen 2\quinoa-orange-cake-no-bg.png
   ```

### 6.3a What was actually delivered (2026-09-30)

`Screen 2\Orange_Quinoa_Cake-removebg-preview.png`: **500 × 500, 4 channels, has
alpha**. It's a remove.bg free preview, not the full-resolution download. The cut is
clean, with the plate and tan rim intact (checked composited on `#F1DFC6`). Trimmed
bbox is about 500 × 396.

**Decision: ship with it.** At the 410px art height the plate renders about 518px
wide, only ~4% upscaled from 500px source, which isn't visible on the wall. The
Open Toasts photos are free previews too, so this has precedent. **This overrides
§6.4 step 1's "≥ 900px wide" gate for this file only.** Swapping in an HD version
later is drop-in: same slug, re-run the script. Logged in §15.

Use the delivered filename in the `MAP` entry (step 2 below), not the name
suggested in §6.3.

### 6.4 Processing (Claude does this once the file exists)

1. Verify transparency before anything else:
   ```bash
   node -e "import('sharp').then(async s=>{const m=await s.default('Screen 2/Orange_Quinoa_Cake-removebg-preview.png').metadata();console.log({w:m.width,h:m.height,channels:m.channels,hasAlpha:m.hasAlpha})})"
   ```
   `hasAlpha: true` and `channels: 4` are required. If not, **stop**: a white box will
   render as a hard rectangle on the sand panel. Also require a width ≥ 900px; if
   it's smaller, ask for the full-resolution download before continuing.
2. Add one `MAP` entry in `build-screen2-cutouts.mjs`:
   ```js
   'quinoa-orange-cake':  { file: 'Orange_Quinoa_Cake-removebg-preview.png',      mode: 'feature' },
   ```
   `feature` mode = trim to the alpha bounding box only, no shared canvas. That's
   the same DESIGN-PRINCIPLES §6 "solo feature art in its own slot" exemption
   `panini-hero`, `bbq-plate`, `protein-scoop` and `extras-grid` use. No logic change.
3. Update the script's header comment: the `"feature" mode (panini hero, wrap
   hero)` line becomes `(panini hero, wrap hero, dessert panel)`.
4. Run it:
   ```bash
   node build-screen2-cutouts.mjs
   ```
5. The script rewrites **every** Screen 2 output on each run. `git status` must show
   only the one new file, `images/screen2/quinoa-orange-cake.png`. If any existing
   `images/screen2/*.png` shows as modified, stop and find out why before going on.
6. **Plate-edge check.** Composite the cut-out on `#F1DFC6` at display size (410px
   tall) with the drop-shadow from §8 and look at it at 100%. The cream plate body is
   close in tone to the sand ground; the tan rim and the drop-shadow are what carry
   its edge. If the rim still disappears, deepen the shadow first (see §8's
   fallback); only change `--dessert-bg` as a last resort.

### 6.5 Fallback if the image isn't ready

Ship without it: leave `"image": ""` in config. `renderDessertPanel()` skips the
`<img>` and the fixed-height art box stays as empty space. **Don't do this silently.**
Unlike Screen 3's numerals, a single-product panel with no photo is weak. Ask the
owner before shipping it imageless.

---

## 7. Step 1: `data/screen2-config.json`

Add a top-level `dessertPanel` key **after `upsell`**. Leave `panel`, `sections`,
`combos` and `upsell` exactly as they are.

```json
  "dessertPanel": {
    "eyebrow": "Healthier indulgences",
    "title": "Quinoa Orange Cake",
    "desc": "A tender quinoa sponge, crowned with fresh mandarin and a glossy dark chocolate drizzle.",
    "image": "quinoa-orange-cake",
    "items": [
      { "label": "1 serving",  "price": "₹149" },
      { "label": "2 servings", "price": "₹249" }
    ]
  }
```

- `eyebrow` is rendered uppercase by CSS. Keep it sentence case in the JSON.
- `desc` is a full sentence, deliberately not an ingredient list like the other
  Item Descs: the owner asked for premium positioning. The wording above is
  **owner-approved** (2026-09-30). It runs to **two lines** at 22px in the 598px
  column, and the layout budgets for that (§8.1). No health claims unless the
  owner supplies them. If `desc` is blank, the line is hidden (§10c).
- "2 servings" (plural) confirmed by the owner.
- Every field is plain text, injected via `textContent`. No `innerHTML` anywhere
  except the rows template (same as Screen 3's `offersItems`).
- Adding a second dessert later is **not** just a config edit: the layout is built
  for one product with serving sizes. See §14.

---

## 8. Step 2: `wraps.css`

Append to the end of the file.

**Chrome 69:** `.dessert-panel` and `.dessert-row` are flex containers. **No flex
`gap`** (§9); use the `> * + *` margin pattern. No `inset`, no
`text-underline-offset`.

```css
/* ═══════════════════════════════════════════════════════════════
   DESSERT PANEL: the right column's second mode ("Healthier
   indulgences"). Screen 2's version of Screen 3's offers panel;
   same mechanics, own selectors (DESIGN-PRINCIPLES §12).

   Geometry (measured, see SCREEN2-DESSERT-PANEL-PLAN.md §4):
     width  686px = toast column 641.5 + .content-panel's 44px right
                    padding, rounded to a whole pixel
     height 974px = 1080 − rail − footer, derived from the tokens
     top    0, bleeding to the screen's top and right edges
   Height and top edge match the panini panel exactly; only width
   differs, as on Screen 3.

   Sand, not green or dark: the panini panel on this same board is
   already the dark-green mass, and a second one would make the
   board read as two matching bookends (owner's call). Gold is not
   used here; it is invisible on a light ground. Prices take
   --dessert-accent instead (DESIGN-PRINCIPLES §7).

   Covers both the toast cards and the combo block for 15s of every
   45s. Accepted tradeoff, same as Screen 3's coffee column.
══════════════════════════════════════════════════════════════════ */
.dessert-panel {
  /* Scoped to this surface only. Not core.css tokens: nothing else
     on any board uses them. --dessert-ink is the same dark chocolate
     as Screen 3's .acc-cocoa-core, not a new colour. */
  --dessert-bg:     #F1DFC6;
  --dessert-ink:    #3D2418;
  --dessert-accent: #B4540F;

  position: absolute;
  top: 0;
  right: 0;
  bottom: calc(var(--h-upsell-rail) + var(--h-footer-strip));
  width: 686px;
  background: var(--dessert-bg);
  /* Sand against cream is a gentle step; the shadow gives the one
     edge that meets the board (left) a clear line. */
  box-shadow: -10px 0 28px rgba(61,36,24,0.14);
  padding: 44px 44px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;   /* fixed-height art + centred stack: even
                                breathing room, not one void (Screen 3 R1) */
  opacity: 0;
  transition: opacity 0.45s ease;
}
.dessert-panel.is-showing {
  opacity: 1;
}

/* Ground first, contents 380ms later. Same timing as Screen 3's
   "dip to dark". The delay matters more here, since sand-on-cream
   is a softer step than dark-on-cream. */
.dessert-panel > * {
  opacity: 0;
  transition: opacity 0.30s ease;
}
.dessert-panel.is-showing > * {
  opacity: 1;
  transition-delay: 0.38s;
}

.dessert-eyebrow {
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  /* --dessert-ink at 78%. Alpha lives in the colour, NOT in opacity:
     .dessert-panel.is-showing > * sets opacity:1 on every direct
     child and would silently override it. */
  color: rgba(61,36,24,0.78);
  margin-bottom: 12px;
  flex-shrink: 0;
}
.dessert-title {
  font-family: 'Playfair Display', serif;   /* a heading, like .panini-title,
                                               not an Item Name (§12) */
  font-size: 56px;
  font-weight: 600;
  color: var(--dessert-ink);
  line-height: 1.1;
  margin-bottom: 10px;
  flex-shrink: 0;
}
/* Ingredient line. Same job as an Item Desc but on the panel's own
   ground and scale, so non-canonical (§12) with a literal size. */
.dessert-desc {
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 400;
  color: rgba(61,36,24,0.85);
  line-height: 1.35;
  margin-bottom: 24px;
  flex-shrink: 0;
  /* The approved copy is two lines. Clamp at two so a longer edit in
     config can't push the price rows off the panel. Ship all three
     -webkit- companions (§9). */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.dessert-art {
  flex-shrink: 0;
  height: 410px;   /* bounded on purpose, NOT flex:1 (Screen 3 R1/R-J7).
                      410 not 440: pays for the two-line desc. */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
}
.dessert-art img {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  display: block;
  /* Carries the cream plate's edge against the sand ground. Same
     role as .wrap-photo-wrap's drop-shadow on the cream board. */
  filter: drop-shadow(0 18px 32px rgba(61,36,24,0.28));
}
.dessert-art.photo-error {
  display: flex;
}

.dessert-items { flex-shrink: 0; }

.dessert-row {
  display: flex;
  align-items: baseline;
  padding: 16px 0;
  border-top: 1px solid rgba(61,36,24,0.18);
}
.dessert-row > * + * {
  margin-left: 16px;   /* flex gap banned on Chrome 69 (§9) */
}
.dessert-label {
  font-family: var(--font-item-name);
  font-size: 30px;
  font-weight: 600;
  color: var(--dessert-ink);
}
/* The price is this panel's "act on this" element: the job gold does
   everywhere else, in a hue that survives a light ground (§7). */
.dessert-price {
  margin-left: auto;
  font-family: var(--font-item-name);
  font-size: 64px;
  font-weight: 700;
  color: var(--dessert-accent);
  line-height: 1;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}
```

**Drop-shadow fallback (§6.4 step 6):** if the plate rim disappears, raise the
shadow to `drop-shadow(0 18px 32px rgba(61,36,24,0.40))`, and if that isn't enough,
add a second tight shadow `drop-shadow(0 2px 3px rgba(61,36,24,0.35))` before it.
Chained `filter` values are fine on Chrome 69.

### 8.1 Height budget (estimates, measure the real box)

| Element | Height + margin |
|---|---|
| eyebrow (24px) | ~29 + 12 |
| title (56px, 1 line) | ~62 + 10 |
| desc (22px, 2 lines, clamped) | ~60 + 24 |
| art | 410 + 28 |
| 2 rows (64px price + 32 padding) | ~192 |
| **total** | **~827 of 894** |

About 67px of slack, split top and bottom by `justify-content: center`. The desc
can't grow past two lines (clamped). If the title also wraps (+62px) it's ~889:
tight, but it fits. **If it overflows**, reduce
`.dessert-art` height first, in 20px steps, before touching any type size (Screen 3
C5's rule: the photo is the most compressible element).

---

## 9. Step 3: `wraps.html`

Insert **between** `</div><!-- /.main-content -->` and `<!-- ── Upsell Rail ── -->`:

```html
    <!-- ── Dessert Panel: Screen 2 only ────────────────────────────
         Fades in over the right column (toasts + combo) on a 30s/15s
         cycle. A direct child of .screen, out of flow, not inside
         #toastGrid: render() rewrites that innerHTML every 5 minutes
         and would destroy it. Must stay after .main-content and
         before .upsell-rail; that DOM order gives the right paint
         stacking with no z-index. -->
    <div class="dessert-panel" id="dessertPanel">
      <div class="dessert-eyebrow" id="dessertEyebrow"><!-- injected by JS --></div>
      <div class="dessert-title" id="dessertTitle"><!-- injected by JS --></div>
      <div class="dessert-desc" id="dessertDesc"><!-- injected by JS --></div>
      <div class="dessert-art">
        <!-- No src attribute on purpose: src="" requests the page itself
             as an image, fails instantly, and onerror removes this <img>
             before JS assigns the real src. (Screen 3 lesson.) -->
        <img id="dessertImage" alt=""
             onerror="this.closest('.dessert-art').classList.add('photo-error');this.remove()">
      </div>
      <div class="dessert-items" id="dessertItems"><!-- injected by JS --></div>
    </div>
```

---

## 10. Step 4: `wraps.js`

**10a.** Top comment block: add a paragraph matching `beverages.js`'s:

```js
   The right column also carries a second mode: a dessert panel that
   fades in over the toasts + combo block on a timer. See
   renderDessertPanel/startDessertRotation below and
   SCREEN2-DESSERT-PANEL-PLAN.md for why.
```

**10b.** After `const REFRESH_MS = …`:

```js
/* Dessert panel dwell. Asymmetric on purpose, same as Screen 3's
   offers panel, which is why the rotation is a recursive setTimeout
   and not a setInterval. */
const DESSERT_MENU_MS  = 30000;
const DESSERT_PANEL_MS = 15000;

let dessertTimer   = null;
let dessertShowing = false;
```

**10c.** Before `/* ── Full render ── */`:

```js
/* ── Dessert panel ───────────────────────────────────────────────
   The right column's second mode. Content comes from
   config.dessertPanel (data/screen2-config.json), not the Sheet.
   Same split as the panini panel. Mechanics are a copy of
   beverages.js's offers panel; see SCREEN2-DESSERT-PANEL-PLAN.md D9
   for why this isn't hoisted into core.js yet. */
function renderDessertPanel(cfg) {
  document.getElementById('dessertEyebrow').textContent = cfg.eyebrow;
  document.getElementById('dessertTitle').textContent   = cfg.title;

  /* Optional line: hide it when blank so it doesn't leave an empty
     24px gap (same pattern as smoothieNote in beverages.js). */
  const descEl = document.getElementById('dessertDesc');
  if (cfg.desc) {
    descEl.textContent = cfg.desc;
    descEl.style.display = '';
  } else {
    descEl.style.display = 'none';
  }

  /* onerror removes the <img> outright, so on a later re-render it
     may be gone. Guard rather than throw: a missing photo must not
     take the whole board down. */
  const img = document.getElementById('dessertImage');
  if (img && cfg.image) {
    img.src = screen2ImageSrc(cfg.image);
    img.alt = cfg.title;
  }

  document.getElementById('dessertItems').innerHTML = cfg.items.map(function (it) {
    return `
      <div class="dessert-row">
        <span class="dessert-label">${it.label}</span>
        <span class="dessert-price">${it.price}</span>
      </div>`;
  }).join('');
}

function setDessertPhase(showing) {
  dessertShowing = showing;
  const panel = document.getElementById('dessertPanel');
  if (showing) panel.classList.add('is-showing');
  else         panel.classList.remove('is-showing');
}

function queueDessertFlip() {
  dessertTimer = setTimeout(function () {
    setDessertPhase(!dessertShowing);
    queueDessertFlip();
  }, dessertShowing ? DESSERT_PANEL_MS : DESSERT_MENU_MS);
}

/* Runs at the end of every render(), i.e. every REFRESH_MS. Clearing
   the pending timer FIRST stops a second rotation stacking on the
   first (otherwise the panel flips twice as often after ten minutes,
   four times after fifteen...). Resetting to the menu phase restarts
   the cycle from a known state; the CSS transition makes it a fade,
   not a cut. */
function startDessertRotation() {
  if (dessertTimer) clearTimeout(dessertTimer);
  setDessertPhase(false);
  queueDessertFlip();
}
```

**10d.** At the end of `render()`, after `renderPipeUpsell(config.upsell, 'Extras');`:

```js
  /* Only rotate the panel in if there's content for it. Without this
     guard a missing or stale config parks an empty sand rectangle
     over the toasts for 15s of every 45s, strictly worse than just
     leaving the toasts up. Fail closed. (Screen 3 shipped exactly
     this bug once; see the comment in fetchWrapsData on stale config.) */
  if (config.dessertPanel) {
    renderDessertPanel(config.dessertPanel);
    startDessertRotation();
  } else {
    if (dessertTimer) clearTimeout(dessertTimer);
    setDessertPhase(false);
  }
```

`renderDessertPanel` has no `if (!cfg) return;` of its own because the caller already
guards. Don't add one "for safety"; one guard in one place.

`fetchWrapsData` already cache-busts `CONFIG_URL`, so the Screen 3 stale-config bug
can't recur here. No change needed there.

---

## 11. Step 5: asset version bump (`?v=4` → `?v=5`)

`wraps.css` and `wraps.js` change, so per CLAUDE.md all **six** references go to
`?v=5`, on all three boards, even though only Screen 2's code changed:

| File | Lines |
|---|---|
| `bowls.html` | `core.css`, `bowls.css`, `core.js`, `bowls.js` |
| `wraps.html` | lines 10, 11, 87, 88 (line numbers shift after Step 3; find by text) |
| `beverages.html` | lines 10, 11, 85, 86 |

Confirm with a grep afterwards: no `?v=4` should remain in any of the three.

---

## 12. Verification

Run all of it. Don't skip the measurements. §9 records that Screen 2's 104px overflow
was invisible in screenshots.

**12a.** `node check-consistency.mjs`: expect no new findings. `.dessert-*` are
non-canonical (§13 docs) and carry no Item Name/Desc/Price class names.

**12b.** Serve and open at exactly 1920×1080 with Playwright (not the Browser pane):
```bash
npx serve . --listen 3100 --no-port-switching
```
Check the page `<title>` reads "Green Feast — Wraps & Paninis" (serve silently
switches ports if 3100 is taken).

**12c. Menu phase unchanged.** Screenshot before the first flip (inside 30s, or call
`setDessertPhase(false)`). Compare against `.playwright-mcp/baseline-wraps.png`.
Nothing may differ.

**12d. Panel phase.** `setDessertPhase(true)`, wait ~1s for the transitions, then
screenshot and measure:

| Check | Expected |
|---|---|
| `#dessertPanel` box | left 1234, top 0, right 1920, bottom 974 |
| Top/bottom vs `.panini-panel` | identical (0 / 974) |
| Overflow | `scrollHeight <= clientHeight` on `#dessertPanel` |
| `.dessert-art` height | 410px |
| Image | loads; `.dessert-art` has **no** `.photo-error` |
| Title | one line (`.dessert-title` height ≈ 62px); if two, re-check overflow |
| Desc | two lines (`.dessert-desc` height ≈ 59px), no ellipsis visible, full sentence readable |
| Eyebrow colour | `rgba(61, 36, 24, 0.78)`, computed opacity 1 |
| Price colour | `rgb(180, 84, 15)`, and **never** `rgb(254, 250, 103)` anywhere in the panel |
| Row count | exactly 2 `.dessert-row` |

**12e. Plate edge at real size.** Look at the panel-phase screenshot at 100%. The
plate's outline must be continuous against the sand. If not, apply §8's drop-shadow
fallback and re-shoot.

**12f. Transition.** Watch one full cycle: 30s menu, ~0.45s fade to sand, contents
~0.38s later, 15s panel, fade back.

**12g. No timer stacking.** Force two refreshes rather than waiting 12 minutes:
call `render(await loadData(fetchWrapsData, CACHE_KEY))` twice from the console, then
log `dessertShowing` every second for 50s. It must still flip on a 30/15 rhythm.

**12h. Fail-closed.** Call `render()` with a copy of the data whose
`config.dessertPanel` is deleted. The panel must stay at opacity 0 through a full
30s+ dwell.

**12i. Screens 1 and 3.** Screenshot both at 1920×1080. They must render normally
(only their `?v=` changed). On Screen 3, confirm the offers panel still rotates.

**12j. Versioning.** On each board:
```js
performance.getEntriesByType('resource').map(e => e.name)
  .filter(n => /\.(js|css)(\?|$)/.test(n) && !n.includes('fonts.g'))
```
All must show `?v=5`.

**12k. Chrome 69 audit** on the diff: no `?.`, `??`, `Object.fromEntries`, CSS
`inset`, flex `gap`, `text-underline-offset`. Custom properties, `calc()`, chained
`filter`, `classList` and template literals are all fine and already in use.

---

## 13. Documentation to update in the same commit

- **`CLAUDE.md`**
  - `wraps.html / wraps.css / wraps.js` row: add the dessert panel (686px, sand,
    30s/15s over the toast column and combo block, content in `dessertPanel`).
  - `data/screen2-config.json` row: add `dessertPanel`
    (`{eyebrow, title, desc, image, items:[{label, price}]}`), plain text
    throughout; `desc` optional.
  - `images/screen2/` row: add `quinoa-orange-cake.png` as dessert-panel feature
    art (trimmed only).
  - `build-screen2-cutouts.mjs` row: its feature mode now covers three photos.
- **`DESIGN-PRINCIPLES.md`**
  - **§2:** add a short "Update" paragraph. Screen 2 now has a right-side second
    mode. It's sand rather than dark on purpose (the board's dark anchor is already
    the panini panel), and it matches the panini panel's height and top edge.
  - **§3:** the existing update says the offers pattern "was built for Screen 1 and
    not Screen 2" because the panini panel is Screen 2's only panini listing. That
    stays true: this panel covers the **toast column**, not the panini panel. Add
    one sentence saying so, and that toasts and combos accept the same 1-in-3
    hidden time as Screen 3's coffee.
  - **§6:** a fourth instance of the solo-feature-art exemption
    (`quinoa-orange-cake`), plus the record that the built-in remover failed on this
    photo (plate removed, sponge semi-transparent: a second §6 rule 5 case).
  - **§7:** a bullet saying the dessert panel's price is the "act on this" use,
    rendered in `--dessert-accent` burnt orange because gold is invisible on a light
    ground. Scoped to that panel only. Not a general-purpose accent and not a new
    gold use. Note `--dessert-ink` reuses Cocoa Core's chocolate.
  - **§12:** extend the non-canonical note to cover `.dessert-eyebrow` /
    `.dessert-title` / `.dessert-desc` / `.dessert-label` / `.dessert-price`.

---

## 14. Commit, merge, deploy

1. On `screen2-dessert-panel`, **one commit**:
   `Screen 2: add dessert panel over the toast column`
   Files: `wraps.html`, `wraps.css`, `wraps.js`, `data/screen2-config.json`,
   `images/screen2/quinoa-orange-cake.png`, `build-screen2-cutouts.mjs`,
   `bowls.html`, `beverages.html` (version bump only), `CLAUDE.md`,
   `DESIGN-PRINCIPLES.md`, this plan file.
2. **Stop and show the owner** the panel-phase screenshot. Merge to `main` and push
   only on their go-ahead.
3. After Pages rebuilds (~1 min), open the live `wraps.html` and repeat 12d and 12j
   against the live URL.

**Rollback:** `git revert` of the single commit restores the board exactly. The
panel is purely additive.

---

## 15. Open items

Resolved with the owner (2026-09-30): "2 servings" is plural; the description is
the approved full sentence in §7; prices stay in JSON, with the tradeoff below
accepted; the 500px cut-out ships as-is.

1. **HD photo (optional upgrade).** The shipped cut-out is a 500px remove.bg
   preview (§6.3a). If a full-resolution cut-out turns up, drop it into
   `Screen 2\`, point the `MAP` entry at it, and re-run the script. No code change.
2. **Prices live in JSON, not the Sheet (accepted).** A dessert price change needs a
   code deploy, which strains §8 ("the owner must never need to edit code to change
   the menu"). If desserts start changing often, move them to `section: dessert`
   rows in the Screen 2 Sheet tab. That's a separate change.
3. **Single-product layout.** Built for one cake with two serving sizes. A second
   dessert needs a layout pass (two smaller photos, or a list), not just a config
   line.

## 16. Deferred, not this version

- **Hoisting the rotation into `core.js`.** Two boards now carry near-identical
  timer code (`beverages.js`, `wraps.js`). If Screen 4 adds a third, hoist it into
  one shared helper then, and re-verify Screen 3's rotation when it happens.

---
---

# REVISION 2: Restyle as a board section, not a poster

**Status:** plan only. No code changed yet. Revision 1 is built and committed on
`screen2-dessert-panel` (`28cf337`, plus the 690px fix `7cca543`), **not merged, not
pushed**. This revision edits that work on the same branch.

## R2.1 Owner feedback (2026-09-30, on the Revision 1 build)

1. **No sand/orange background, no heavy shadow.** The desserts should read as a
   **section of the board**, in the same visual language as "Open Toasts", not as
   a separate poster laid over it.
2. **Fonts don't follow the board's hierarchy.** The spaced-caps eyebrow, the 56px
   Playfair title, the Montserrat serving labels and the 22px description are type
   styles that exist nowhere else on the board.
3. **Prices are too big.** The large-price treatment belongs to "Make it a meal",
   which has a different job (upsell). The dessert is a menu item; its prices
   should look like every other item price.

**Interpretation, to confirm on review:** the panel becomes "the next section in the
column". When it fades in, the "Open Toasts" heading and cards are replaced *in
place* by a "Healthier Indulgences" heading and one card, at the same positions,
with the same heading style and the same card chrome. That makes it a separate
section by name and content, and seamless in design.

## R2.2 Decisions (replace D1, D6 and D8 of Revision 1)

| # | Decision | Rationale |
|---|---|---|
| R2-J1 | **Panel ground is `var(--cream)`, the board's own background. No `box-shadow`.** | Feedback 1. The panel stops being an object and becomes a region of the board. It is still opaque, so it still hides the toasts. |
| R2-J2 | **The heading reuses the board's own section header markup and classes:** `.section-header` + `.section-title` ("Healthier Indulgences": Playfair 38px, forest, 4px underline), the exact classes "Open Toasts" uses. | Feedback 2. With no new heading style, there's nothing to drift. `wraps.css`'s `.section-header { padding-top: 20px }` applies automatically, so the heading lands where "Open Toasts" sits. |
| R2-J3 | **Open layout, no card (owner's choice, R2.11).** The plate sits straight on the cream, like the wrap photo in the middle column, with the text below it. The text uses the **wrap list's own classes**: `.wrap-name` for the name, `.wrap-desc` for the description and `.wrap-price` for prices, plus `.tile-rupee`. | Feedback 2 and 3. The wrap classes are the board's left-aligned, on-cream text styles, so the dessert reads like the Wraps column beside it. Their sizes come from the canonical tokens (`--fs-item-name`, `--fs-item-desc`, `--fs-item-price`), and `check-consistency.mjs` already covers those selectors, so nothing needs adding to it. |
| R2-J4 | **Prices render like every item price:** `.wrap-price` (26px Inter 600, forest) with the small superscript `₹` (`.tile-rupee`). Config prices become numbers (`149`, `249`), not `"₹149"` strings. | Feedback 3. The big-numeral treatment stays unique to "Make it a meal" and the Screen 3 add-ons. |
| R2-J5 | **The two serving lines are the only new text style**: `.dessert-serving`, `font-size: var(--fs-item-desc)` (a token, not a literal), weight 600, `var(--forest)`. One row per serving (label left, price right), divided by the same thin rule the wrap rows use. | The wraps have one price each; this item has two. That is the only real shape difference. |
| R2-J6 | **Content aligns exactly with the toast column.** The panel box stays 1230–1920 × 0–974 (the 690px fix). Inner padding `0 44px 20px 4.5px` puts content at x 1234.5–1876, y 0–954: the toast column's exact box (§4). | So the heading and card land where "Open Toasts" and its cards were. The swap reads as the section changing, not as something sliding over it. |
| R2-J7 | **The photo box absorbs the column height** (`.dessert-photo { flex: 1; min-height: 0 }`, like `.wrap-photo-wrap`). The text block below it is `flex-shrink: 0`, and the content ends at y 954, like the toast grid + combo block. | It fills the column the same way the Wraps column does (text fixed, photo takes the rest). |
| R2-J8 | **The photo renders at natural size (500×396), no upscaling, with the wrap photo's drop-shadow** (`drop-shadow(0 14px 30px rgba(40,63,40,0.22))`). | `width/height: auto` with `max-*: 100%` never scales up, so it stays crisp from the 500px preview. The shadow is the **same** one the plated wrap photo already has on this cream: it grounds the cream plate, and it isn't a new style. An HD cut-out later (§15 item 1) could render larger, still with no code change. |
| R2-J9 | **Timing and mechanics unchanged:** 30s/15s, same fade timings, same fail-closed guard, same timer code. | Only styling and markup change. |
| R2-J10 | **The `--dessert-*` colours and the burnt-orange accent are deleted.** | Nothing uses them any more. DESIGN-PRINCIPLES §7 goes back to having no dessert-specific colour. |

**What the fade now looks like:** the cream ground fades in over 450ms (the toasts
fade out underneath it). Then, 380ms later, the heading and card fade in. On the
wall that reads as "the section changed". There's no dark or sand "dip" any more,
which is intended: the owner wants it seamless.

> ⚠️ **R2.11 was answered (heading: yes; layout: open).** Steps R2.4–R2.6 and the
> R2.9 checks below are written for the **open** layout. Anything in this revision
> that mentions a card (`.dessert-card`, `.toast-card` or `.toast-*` classes) is
> superseded.

## R2.3 Step 1: `data/screen2-config.json`

Replace the `dessertPanel` block with:

```json
  "dessertPanel": {
    "heading": "Healthier Indulgences",
    "name": "Quinoa Orange Cake",
    "desc": "A tender quinoa sponge, crowned with fresh mandarin and a glossy dark chocolate drizzle.",
    "image": "quinoa-orange-cake",
    "items": [
      { "label": "1 serving",  "price": 149 },
      { "label": "2 servings", "price": 249 }
    ]
  }
```

- `eyebrow` becomes `heading`, and is title case now: it's a Section Title, and
  every Section Title on the board is title case ("Open Toasts").
- `title` becomes `name`, because it's an Item Name now (§12 vocabulary).
- Prices become numbers, rendered as `<span class="tile-rupee">₹</span>149` like
  every other price on the board.

## R2.4 Step 2: `wraps.html`

Replace the whole `<div class="dessert-panel" id="dessertPanel">…</div>` block (the
comment above it stays; update its first line to say "a second section" instead of
"fades in over"):

```html
    <div class="dessert-panel" id="dessertPanel">
      <div class="section-header">
        <h1 class="section-title" id="dessertHeading"><!-- injected by JS --></h1>
      </div>
      <div class="dessert-body" id="dessertBody"><!-- injected by JS --></div>
    </div>
```

The panel now has exactly two direct children (the header and the body), which are
what the `> *` fade rule staggers in.

## R2.5 Step 3: `wraps.css`

**3a.** Replace the file's whole `DESSERT PANEL` block (from its header comment down
to the end of the file) with:

```css
/* ═══════════════════════════════════════════════════════════════
   DESSERT PANEL: the right column's second mode, "Healthier
   Indulgences". Fades in over the toast column (toast cards + combo
   block) on a 30s/15s cycle. Mechanics copied from Screen 3's offers
   panel; see SCREEN2-DESSERT-PANEL-PLAN.md.

   Revision 2: styled as a SECTION of this board, not a poster. The
   ground is the board's own cream, with no panel shadow; the heading
   is the shared .section-header/.section-title; the plate sits
   straight on the cream like the wrap photo, and the text uses the
   wrap list's own name/desc/price classes, so every size comes from
   the canonical tokens (§12). The owner asked for it to read as the
   next section in the column, not a panel laid over it.

   Geometry:
     box    1230–1920 × 0–974. The width is 690, not the column's
            685.5: its left edge sits in the column gutter so the
            toast column's half-pixel start (1234.5) can't show
            through (the Revision 1 sliver).
     padding 0 44px 20px 4.5px puts the content at 1234.5–1876 ×
            0–954, the toast column's exact box, so the heading lands
            exactly where "Open Toasts" was.
══════════════════════════════════════════════════════════════════ */
.dessert-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: calc(var(--h-upsell-rail) + var(--h-footer-strip));
  width: 690px;
  background: var(--cream);
  padding: 0 44px 20px 4.5px;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transition: opacity 0.45s ease;
}
.dessert-panel.is-showing {
  opacity: 1;
}

/* Ground first, contents 380ms later: the toasts fade out under
   the cream, then the heading and body fade in. It reads as the
   section changing rather than a cross-fade glitch. */
.dessert-panel > * {
  opacity: 0;
  transition: opacity 0.30s ease;
}
.dessert-panel.is-showing > * {
  opacity: 1;
  transition-delay: 0.38s;
}

/* Open layout (owner's choice): photo straight on the cream, text
   below. Same structure as the Wraps column beside it: the photo box
   absorbs the spare height, the text block stays its natural size. */
.dessert-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.dessert-photo {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Natural size, never upscaled (500px remove.bg preview). The shadow
   is .wrap-photo-wrap img's own, so the two plated photos on this
   board are grounded the same way. */
.dessert-photo img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  display: block;
  filter: drop-shadow(0 14px 30px rgba(40,63,40,0.22));
}
.dessert-photo.photo-error {
  display: flex;
}

/* Name/desc/price come from .wrap-name / .wrap-desc / .wrap-price
   above (canonical tokens). This block just stops the text being
   squeezed by the photo box. */
.dessert-info {
  flex-shrink: 0;
  margin-top: 16px;
}
.dessert-info .wrap-desc {
  margin-bottom: 10px;
}

/* Two serving sizes instead of one price: the only shape difference
   from a wrap row. The same thin divider the wrap rows use. */
.dessert-serving-row {
  display: flex;
  align-items: baseline;
  padding: 10px 0;
  border-top: 1px solid rgba(88,120,88,0.12);
}
.dessert-serving {
  font-size: var(--fs-item-desc);
  font-weight: 600;
  color: var(--forest);
}
```

Chrome 69: no flex `gap` (none needed: `.wrap-price` has `margin-left: auto`), no
`inset`.

**3b.** Nothing else in `wraps.css` changes. In particular, **don't edit
`.wrap-name`, `.wrap-desc` or `.wrap-price`.** The dessert reuses them as they are,
so the real wrap rows can't be affected.

## R2.6 Step 4: `wraps.js`

Only `renderDessertPanel()` changes. It now builds the body with a template, the
same way `wrapRowHTML()` builds a wrap row. `setDessertPhase`, `queueDessertFlip`,
`startDessertRotation`, the constants and the fail-closed guard in `render()` stay
**untouched**.

```js
function dessertBodyHTML(cfg) {
  const rows = cfg.items.map(function (it) {
    return `
      <div class="dessert-serving-row">
        <span class="dessert-serving">${it.label}</span>
        <span class="wrap-price"><span class="tile-rupee">₹</span>${it.price}</span>
      </div>`;
  }).join('');

  return `
    <div class="dessert-photo">
      <img src="${screen2ImageSrc(cfg.image)}" alt="${cfg.name}"
           onerror="this.closest('.dessert-photo').classList.add('photo-error');this.remove()">
    </div>
    <div class="dessert-info">
      <div class="wrap-name">${cfg.name}</div>
      ${cfg.desc ? `<div class="wrap-desc">${cfg.desc}</div>` : ''}
      ${rows}
    </div>`;
}

function renderDessertPanel(cfg) {
  document.getElementById('dessertHeading').textContent = cfg.heading;
  document.getElementById('dessertBody').innerHTML      = dessertBodyHTML(cfg);
}
```

- Rebuilding the body with `innerHTML` on every render also removes Revision 1's
  "the `<img>` may already have been removed by onerror" problem, since a fresh
  `<img>` is created each time. The guard that handled it goes away with it.
- Keep the block comment above `renderDessertPanel`, updated to say the body
  mirrors the Wraps column's text styles.

## R2.7 Step 5: no version bump beyond `?v=5`

`?v=5` has never been deployed, so it already covers this revision. Don't bump to 6.

## R2.8 Documentation (same commit)

- **`CLAUDE.md`**
  - Line 72 (`wraps.*` row): "a 690px sand `.dessert-panel` … showing the Quinoa
    Orange Cake at poster size" becomes "a `.dessert-panel` (cream, board-section
    styling: a 'Healthier Indulgences' section header, the plate on cream, and text
    in the wrap list's styles)".
    Keep the rest.
  - `data/screen2-config.json` row: the `dessertPanel` shape becomes
    `{heading, name, desc, image, items:[{label, price}]}`, with `price` a number.
- **`DESIGN-PRINCIPLES.md`**
  - **§2, lines ~158–164:** rewrite the Screen 2 update paragraph. It is now cream
    and deliberately **seamless**: a second section that swaps in place of Open
    Toasts, reusing the section header and the wrap list's text styles. It is **not** a dark
    anchor, and doesn't try to be one; the panini panel remains the board's dark
    anchor. Drop the "sand" and "matching bookends" wording, but keep the owner's
    reason (no second green mass).
  - **§3, line ~197:** keep it (the panini-panel point still holds).
  - **§6, lines ~348–349:** keep the solo-feature-art note. Add that it renders at
    natural size, straight on the cream, with the same drop-shadow as the wrap
    photo.
  - **§7, lines ~414–421:** **delete** the whole `.dessert-price` / burnt-orange /
    `--dessert-*` bullet. Replace it with one line: the dessert panel adds no
    colour, and its prices are ordinary forest Item Prices.
  - **§12, lines ~583–585:** **delete** the "dessert panel's typography is
    deliberately not canonical" note. Replace it with: the dessert text uses the
    wrap list's canonical classes (`.wrap-name` / `.wrap-desc` / `.wrap-price`), so
    it is covered by `check-consistency.mjs`; the only new text selector is
    `.dessert-serving` (token-sized).
- **`SCREEN2-DESSERT-PANEL-PLAN.md`:** this section is the record. Earlier sections
  stay as history.
- **`build-screen2-cutouts.mjs`:** no change. It's still `feature` mode.

## R2.9 Verification

Serve on 3100 and use Playwright at 1920×1080. Force the phase with
`setDessertPhase(true)` **after** the first `render()` has finished (calling it
earlier gets reset by `startDessertRotation`), then wait 1.5s.

| Check | Expected |
|---|---|
| `node check-consistency.mjs` | clean, unchanged output |
| Menu phase vs `.playwright-mcp/baseline-wraps.png` | 0 differing bytes |
| `#dessertPanel` box | 1230, 0, 1920, 974 |
| Panel background | `rgb(245, 240, 232)` (cream); `box-shadow` is `none` |
| Dessert `.section-header` box vs Open Toasts' header | same left (1234.5), top, width and height |
| Dessert `.section-title` computed style | same font-family, size, weight, colour and border as "Open Toasts" |
| `.dessert-body` box | left 1234.5, right 1876, top ≈ 92.8 (= `.toast-grid` top), bottom 954 |
| `.wrap-name` / `.wrap-desc` / `.wrap-price` in the dessert | computed font family, size, weight and colour identical to a real wrap row's (24px Montserrat / 18px / 26px) |
| Desc | fully visible, no ellipsis (clamped at 2 lines; must fit) |
| Image | loads, rendered 500×396 (natural size), no `.photo-error`, filter identical to `.wrap-photo-wrap img` |
| Serving rows | 2 rows; prices show a superscript ₹ + 149 / 249, right-aligned at x 1876 |
| Colour audit | nothing in the panel computes to `rgb(180, 84, 15)` or `rgb(241, 223, 198)` |
| Overflow | `scrollHeight <= clientHeight` on the panel and on `.dessert-body` |
| Real wrap rows | the menu-phase 0-byte diff above proves they're untouched |
| Edge check | zoom the panel's left edge at the header's height: no sliver |
| Rotation / fail-closed | re-run the Revision 1 checks 12g and 12h (timer code is unchanged, so this is a quick confirmation) |
| Screens 1 and 3 | still render normally |
| Chrome 69 audit | no `?.`, `??`, `inset`, flex `gap` in the diff |

Take a panel-phase screenshot, `.playwright-mcp/dessert-panel-r2.png`, for the
owner.

## R2.10 Commit

One commit on `screen2-dessert-panel`:
`Screen 2: restyle dessert panel as a board section`
Files: `wraps.html`, `wraps.css`, `wraps.js`, `data/screen2-config.json`,
`CLAUDE.md`, `DESIGN-PRINCIPLES.md`, `SCREEN2-DESSERT-PANEL-PLAN.md`.
**Don't merge or push.** The owner reviews at http://localhost:3100/wraps.html first.

## R2.11 Owner answers (2026-09-30)

1. **Heading:** "Healthier Indulgences", title case. **Confirmed.**
2. **Layout:** **open**, not a card. The plate sits straight on the cream, with the
   text below it. R2.4–R2.6 and R2.9 are written for this.
