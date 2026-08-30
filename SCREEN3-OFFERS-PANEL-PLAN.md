# Screen 3 — Offers Panel — Execution Plan

**Branch:** ⚠️ **owner decision needed before any commit — see §0.**
**Status:** plan only — no code changed yet.
**Design reference:** https://claude.ai/code/artifact/e84985c4-c68e-4f6d-a6b4-145fb6040396
(four transition variants, watchable; "Dip to dark" is the approved one)

Read `DESIGN-PRINCIPLES.md` §2 (layout skeleton, dark anchor), §6 (photography,
shared-canvas rule), §7 (colour, gold rules) and §9 (Chrome 69) before starting.
This plan uses §12's vocabulary.

---

## 0. Branch state — resolve this first

The working tree is on **`screen3-menu-update`**, not `main`. That branch carries
one commit the owner has asked to hold un-merged:

```
9af42e3  Screen 3: swap Ginger Ale Cold Brew for Spanish Ice Latte, update smoothie macros
d756a58  Update Phase 4b status  (= main)
```

`9af42e3` is committed but **not pushed and not merged**. It touched
`data/screen3-sheet.csv`, a new `images/screen3/spanish-ice-latte.png`,
`build-screen3-cutouts.mjs`, `CLAUDE.md`, plus comment-only edits to
`beverages.js` and `beverages.css`. Verify with `git show 9af42e3` — that commit,
not this document, is the source of truth for what it changed.

**Ask the owner which they want:**

| Option | Meaning |
|---|---|
| **A** — branch off `screen3-menu-update` | The offers panel ships on top of the menu update. Simplest, but the two changes then merge to `main` together and cannot be released separately. |
| **B** — branch off `main` (`d756a58`) | The panel ships independently of the held menu update. Requires a later merge of the two branches; the only real conflict risk is `build-screen3-cutouts.mjs`, which both touch. |

Do not guess. Both branches are viable and the choice is about release timing,
which is the owner's call, not a technical one.

---

## 1. What this builds

Screen 3's coffee column gains a second mode. On a repeating cycle, a dark
forest panel fades in over the coffee grid, showing the smoothie add-ons at
poster size; then it fades back out and the coffee menu returns.

```
30s                          15s                     30s
┌──────────┬────────┐   ┌──────────┬────────┐   ┌──────────┬────────┐
│ smoothie │ COFFEE │   │ smoothie │ OFFERS │   │ smoothie │ COFFEE │
│ 3×2 grid │ 2×2    │ → │ 3×2 grid │ ███████│ → │ 3×2 grid │ 2×2    │
│          │ cards  │   │          │ ███████│   │          │ cards  │
├──────────┴────────┤   ├──────────┴────────┤   ├──────────┴────────┤
│ upsell rail       │   │ upsell rail       │   │ upsell rail       │
│ footer            │   │ footer            │   │ footer            │
└───────────────────┘   └───────────────────┘   └───────────────────┘
```

**Why:** the upsell rail is 1832×64 ≈ 117k px², carries no photo, the smallest
type on the board, and never moves — so it reads as a caption and gets skipped.
The offers panel is 764×974 ≈ 744k px², roughly **6× the area**, with a photo and
motion. The rail is *reference*; the panel is *recruitment*.

**Bonus:** for 15 seconds of every 45, Screen 3 carries a dark anchor of the same
height and vertical position as Screens 1–2's panels. DESIGN-PRINCIPLES §2 records
Screen 3's missing dark anchor as a knowing debt; this partially repays it.

---

## 2. What this does NOT change

Do not touch any of these. They were considered and deliberately left alone.

| Thing | Why it stays |
|---|---|
| Screens 1 and 2 | Out of scope this version. The same pattern is planned for them later (§10). |
| All three upsell rails, including Screen 3's | §2 pins rail + footer as pixel-identical on every board. The rail does close-range confirmation work; the panel does across-the-room recruitment. Different jobs. |
| `data/config.json`, `data/screen2-config.json` | Screens 1–2's add-ons stay on Screens 1–2, next to the products they attach to. |
| The coffee cards themselves | The panel is an opaque overlay. Nothing about `.coffee-card` markup, CSS or data changes. |
| The smoothie column | Untouched. |
| `core.js` | No shared JS needed — the rotation is Screen 3 only. |

---

## 3. Judgment calls — already decided, do not re-litigate

| # | Decision | Rationale |
|---|---|---|
| J1 | **Transition = "Dip to dark".** Panel fades in over 450ms; its contents fade in behind a 380ms delay. No slide, no wipe, no stagger. | Fewest moving parts; nothing can look broken. The dark is both transition and destination, so the "palate cleanser" costs nothing extra. Reviewed against three alternatives in the artifact above. |
| J2 | **Panel is 764px wide**, not 525px. | 525 vs 764 is a clear 1:1.46 ratio, not a near-miss. 764 = the coffee column's 720px + `.main-content`'s 44px right padding, so it bleeds cleanly to the screen edge. |
| J3 | **Panel height 974px, top at y=0**, bleeding to the top and right screen edges and stopping on the upsell rail. | Height and vertical position match Screens 1–2's panels *exactly*. That's the alignment §2 actually cares about — the dark/cream seam at the same heights on every board. Only width differs, on purpose. |
| J4 | **Panel on the right**, mirroring Screens 1–2. | Smoothies are the board's sell and keep the left-to-right reading order. A mirrored seam reads as deliberate variation; demoting the hero would read as a mistake. |
| J5 | **Dwell: 30s coffee / 15s offers.** Owner's call. | Coffee stays effectively always-available; a 90s queue still catches the offer twice. Accepted cost: ~33% of the time no coffee menu is visible. |
| J6 | **Panel is an overlay, not a re-layout.** The coffee grid stays in the DOM underneath and is simply covered. | Avoids reflowing the flex columns on every cycle. Far less to go wrong on an unattended board. |
| J7 | **Panel markup lives in `beverages.html`**, as a direct child of `.screen`, *after* `.main-content` and *before* `.upsell-rail`. | DOM order gives correct paint stacking with no `z-index`. Being outside `#coffeeRow` means `render()`'s `innerHTML` rewrite can't destroy it (see §7 note). |
| J8 | **Content lives in `data/screen3-config.json`**, not the Sheet. | Same split as Screen 2's panini panel: static panel content in config, per-item menu rows in the Sheet. Owner says content is stable for now but may become seasonal — a config edit plus one PNG covers that with no code change. |
| J9 | **Coffee cards get no fade of their own.** | `--hero-bg` (#163019) is fully opaque. Fading the panel in already dissolves the cards. One animated property beats two. |
| J10 | **Rail height and footer height become tokens in `core.css`.** | The panel's `bottom` offset is derived from them. Repo convention is tokens over literals; substituting a var whose value equals the existing literal is a visual no-op on all three boards. |
| J11 | **Offer typography is not canonical.** `.offers-amount` / `.offers-what` / `.offers-price` are not Item Name/Desc/Price — they're a new Screen-3-scoped group and may use literal sizes. | §12's canonical elements describe *menu items*. An offer is not a menu item. Document this in §12 so a later pass doesn't "fix" it. |

---

## 4. Asset needed before coding starts

One new file: **`images/screen3/protein-scoop.png`**

### Specification

| Property | Value |
|---|---|
| Format | PNG with real alpha transparency |
| Canvas | Trimmed to the alpha bounding box, no padding. **No shared canvas** — matches the rest of `images/screen3/` (DESIGN-PRINCIPLES §6). |
| Size | ~900px on the long edge before trim |
| Subject tone | **Pale / cream / off-white.** It sits on `#163019`. A dark subject disappears. |
| Orientation | Roughly square-to-landscape. It renders into a flexible box ~676px wide. |

### What the subject must be

**A single heaped scoop of protein powder.** Bowl of the scoop about ⅔ full with a
soft mound, handle angled up and to the right, a few loose grains at the base.

**It must not be a cup.** Any drink photo makes the panel read as a seventh
smoothie and destroys the mode change the transition just paid for. This is the
single most important constraint on the image.

For composition and silhouette, see the vector stand-in in the design reference
artifact (§1) — the real photo should occupy the frame the same way.

### AI generation prompt

Primary (for Nano Banana / Gemini, Flux, or Ideogram):

```
Product photograph of a single stainless steel measuring scoop heaped with
pale cream-coloured protein powder. Three-quarter side view, handle angled up
to the right. A soft rounded mound of powder rises above the rim. A few loose
grains scattered at the base of the scoop. Isolated on a pure white seamless
background, soft even studio lighting from the upper left, gentle contact
shadow directly beneath. Sharp focus throughout, high detail on the powder
texture. Commercial food photography, square composition, subject fills 80%
of the frame.
```

Append if the generator supports transparency directly:
`Transparent background, no backdrop, cut-out product shot.`

Variant B — warmer, if the plain scoop reads too clinical next to the smoothie photography:

```
...replace "stainless steel measuring scoop" with "matte white ceramic scoop"...
```

Variant C — if a scoop alone feels too sparse in the panel:

```
...append: "A small collagen sachet lies flat beside the scoop, unbranded,
plain cream packaging, slightly out of focus."
```

**Negative / avoid list** — state these explicitly if the tool takes negative prompts:

```
no branded tub, no labelled jar, no packaging text, no logos, no chocolate or
dark brown powder, no drink, no cup, no glass, no smoothie, no hands, no
gradient background, no dark background, no lifestyle scene, no text overlay
```

Why each matters: a branded tub reads as a retail product ad rather than a menu
offer; chocolate-coloured powder vanishes on the forest ground; a cup or glass
collides with the six smoothie photos.

### Processing the generated image

⚠️ **Do not just append a `MAP` line and re-run the script.** Read
`build-screen3-cutouts.mjs`'s header comment first. It justifies skipping
DESIGN-PRINCIPLES §6 rule 2 (shared canvas) on a claim that is about to stop
being true:

> *"all ten Screen 3 photos are the same physical cup, same camera angle, same
> lighting — the aspect-ratio spread (0.80–0.89) is garnish height, not a framing
> mismatch. … This is not a general licence to skip rule 2 — it only holds
> because these sources are this uniform."*

A protein scoop is not a cup and will not land in a 0.80–0.89 aspect band. Adding
it silently would leave that comment asserting something false, which is exactly
the kind of drift §6 exists to prevent.

**The scoop does not need a shared canvas** — but for a *different* reason than
the cups do, and that reason has to be written down.

§6 already records two separate grounds for skipping rule 2. The cups use the
"uniform set" ground. The scoop uses the other one: it is **solo feature art,
alone in its own layout slot with nothing to normalize against** — the same
standing as Screen 2's `panini-hero` and `bbq-plate`, which are trimmed only. A
matched set needs a common canvas; a single image in a single slot does not.

Both grounds end at the same code path (trim only), so **no logic changes** —
only the justification does.

1. Save the source art into the local, gitignored `Screen3/` folder.
2. If the generator produced a white background rather than transparency, remove
   the background first — same manual path `ingest-manual-cutout.mjs` covers for
   Screen 1 when the automatic remover fails (§6).
3. Add the `MAP` entry in `build-screen3-cutouts.mjs`:
   ```js
   'protein-scoop': '<source filename>.png',
   ```
4. **Rewrite that file's header comment** so it describes two groups instead of
   one. Keep the existing cup-set reasoning verbatim — it is still correct for the
   ten drinks — and add a short second paragraph saying the scoop is solo feature
   art in its own slot, cites the same §6 exemption Screen 2's feature photos use,
   and is therefore also trim-only. Update the "ten Screen 3 photos" count wording
   so it refers to the drinks, not to every file the script emits.
5. **Check `MAX_H` before running.** It is `600`, and its comment justifies that as
   "~2.7× the largest on-screen display height (214px)" — true for a cup in a card,
   false for this. The offers panel's art box is roughly 540px tall (measure it;
   do not trust this arithmetic), so 600 leaves only ~1.1× headroom and the scoop
   will look soft on a 1080p screen. Either raise `MAX_H`, or special-case the
   scoop to skip the downscale. Whichever you pick, update the `MAX_H` comment so
   its stated ratio stays true.
6. Run from the repo root:
   ```bash
   node build-screen3-cutouts.mjs
   ```
7. Confirm `images/screen3/protein-scoop.png` exists, opens with transparency, and
   that the ten drink cut-outs are **byte-identical to before** — the script
   rewrites every file each run, so confirm your change did not alter them.
8. Update `CLAUDE.md`'s `images/screen3/` and `build-screen3-cutouts.mjs` rows:
   both currently say the folder holds one image per smoothie/coffee. It now also
   holds one piece of panel feature art.

**Fallback if no good image is ready:** ship the panel without it. Set
`"image": ""` in config; `renderOffersPanel()` skips the `<img>` and the layout
absorbs it (the art block is `flex: 1`). The oversized gold numerals carry the
panel on their own — at wall distance the number outperforms the photograph
anyway. Do not block the build on the photo.

---

## 5. Step 1 — `core.css`: two new tokens

Three edits, all no-ops visually. Do this step first and verify before continuing.

**1a.** In `:root`, after the `--gold` line, add:

```css
  /* Bottom strip heights. Tokenised so a screen laying an element
     against the strips can derive its own geometry instead of
     re-hardcoding 64 and 42. Values unchanged from the literals
     they replace below. */
  --h-upsell-rail:  64px;
  --h-footer-strip: 42px;
```

**1b.** In `.upsell-rail`, change `height: 64px;` → `height: var(--h-upsell-rail);`

**1c.** In `.footer-strip`, change `height: 42px;` → `height: var(--h-footer-strip);`

**Verify before moving on:**
```bash
node check-consistency.mjs
```
Then screenshot all three boards at 1920×1080 and confirm they are pixel-identical
to a **freshly captured** baseline (see §10's warning — the committed
`baseline-screenshots/` are stale). Capture that fresh baseline *before* making
Step 1's edits, so this comparison is against the immediately-preceding state. If
anything moved, stop — something else was depending on those literals.

---

## 6. Step 2 — `data/screen3-config.json`: add the panel content

Add a top-level `offersPanel` key. Leave `sections`, `upsellHeading` and `upsell`
exactly as they are — **the rail keeps both its existing add-ons** (decision §2).

```json
{
  "sections": {
    "smoothie": { "heading": "Functional Smoothies", "note": "(Sweetened with monk fruit and banana)" },
    "coffee": { "heading": "Coffee" }
  },
  "upsellHeading": "Power up",
  "upsell": [
    "Add 12g protein to any smoothie | ₹120",
    "Add 10g collagen to any smoothie | ₹120"
  ],
  "offersPanel": {
    "eyebrow": "Power up",
    "title": "Make any smoothie work harder",
    "image": "protein-scoop",
    "items": [
      { "amount": "+12g", "what": "Protein",  "price": "₹120" },
      { "amount": "+10g", "what": "Collagen", "price": "₹120" }
    ]
  }
}
```

Shaped this way, a seasonal swap later is a text edit plus one PNG. If it ever
needs changing weekly, that's the point to move it to a `section: offer` row in
the Sheet instead — not now.

---

## 7. Step 3 — `beverages.html`: add the panel markup

Insert **between** `</div><!-- /.main-content -->` and the
`<!-- ── Upsell Rail ── -->` comment. Position in the DOM matters (J7).

```html
    <!-- ── Offers Panel — Screen 3 only ──────────────────────────
         Fades in over the coffee column on a 30s/15s cycle. Lives
         here — a direct child of .screen, out of flow — rather than
         inside #coffeeRow, because render() rewrites #coffeeRow's
         innerHTML every 5 minutes and would destroy it. Must stay
         after .main-content and before .upsell-rail: that DOM order
         is what gives the correct paint stacking with no z-index. -->
    <div class="offers-panel" id="offersPanel">
      <div class="offers-eyebrow" id="offersEyebrow"><!-- injected by JS --></div>
      <div class="offers-title" id="offersTitle"><!-- injected by JS --></div>
      <div class="offers-art">
        <img id="offersImage" src="" alt=""
             onerror="this.closest('.offers-art').classList.add('photo-error');this.remove()">
      </div>
      <div class="offers-items" id="offersItems"><!-- injected by JS --></div>
    </div>
```

---

## 8. Step 4 — `beverages.css`: the panel

Append to the end of the file, replacing the closing "UPSELL RAIL" comment block
or sitting after it.

**Chrome 69 note:** `.offers-panel` and `.offers-row` are both flex containers —
**flex `gap` is banned** (§9). Use the `> * + *` margin pattern, as the rest of
this file does.

```css
/* ═══════════════════════════════════════════════════════════════
   OFFERS PANEL — the coffee column's second mode.

   Geometry (see SCREEN3-OFFERS-PANEL-PLAN.md §3, J2/J3):
     width  764px = coffee column 720 + .main-content's 44px right padding
     height 974px = 1080 − rail 64 − footer 42, derived from the tokens
     top    0, bleeding to the screen's top and right edges

   Height and vertical position are identical to Screens 1-2's 525px
   dark panels; only the width differs. That is deliberate — see
   DESIGN-PRINCIPLES §2 on the dark anchor.

   Positioned against .screen (the only positioned ancestor — .screen
   is position:absolute, .main-content sets no position). Being out of
   flow means it does not disturb .screen's column flex layout.
══════════════════════════════════════════════════════════════════ */
.offers-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: calc(var(--h-upsell-rail) + var(--h-footer-strip));
  width: 764px;
  background: var(--hero-bg);
  padding: 44px 44px 36px;
  display: flex;
  flex-direction: column;
  /* Hidden by default. JS adds .is-showing to bring it in. */
  opacity: 0;
  transition: opacity 0.45s ease;
}
.offers-panel.is-showing {
  opacity: 1;
}

/* "Dip to dark": the dark ground arrives first, its contents 380ms
   later. That gap is the whole effect — remove it and the panel reads
   as a cross-fade, which at wall distance looks like a rendering
   fault rather than a deliberate switch. */
.offers-panel > * {
  opacity: 0;
  transition: opacity 0.30s ease;
}
.offers-panel.is-showing > * {
  opacity: 1;
  transition-delay: 0.38s;
}

.offers-eyebrow {
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--sage-light);
  margin-bottom: 10px;
  flex-shrink: 0;
}
.offers-title {
  font-family: 'Playfair Display', serif;   /* a heading, not an Item Name — §12 */
  font-size: 52px;
  font-weight: 600;
  color: #FFFFFF;
  line-height: 1.1;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.offers-art {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.offers-art img {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  display: block;
}
.offers-art.photo-error {
  /* Image missing — the flex:1 box just collapses to empty space and
     the numerals below carry the panel. Nothing else to do. */
  display: flex;
}

.offers-items { flex-shrink: 0; }

.offers-row {
  display: flex;
  align-items: baseline;
  padding: 16px 0;
  border-top: 1px solid rgba(255,255,255,0.16);
}
.offers-row > * + * {
  margin-left: 16px;   /* flex gap banned on Chrome 69 — §9 */
}

/* Gold on the amount only. §7 permits gold for "anything the customer
   should act on" — an add-on price is exactly that, the same job the
   upsell rail's price does. This is not a fourth gold use. */
.offers-amount {
  font-family: var(--font-item-name);
  font-size: 76px;
  font-weight: 700;
  color: var(--gold);
  line-height: 1;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}
.offers-what {
  font-family: var(--font-item-name);
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.92);
}
.offers-price {
  margin-left: auto;
  font-family: 'Inter', sans-serif;
  font-size: 38px;
  font-weight: 600;
  color: #FFFFFF;
  flex-shrink: 0;
}
```

---

## 9. Step 5 — `beverages.js`: content + rotation

**9a.** Add near the top, after the `REFRESH_MS` line:

```js
/* Offers panel dwell. Asymmetric on purpose (see the plan's J5), which
   is why the rotation is a recursive setTimeout and not a setInterval. */
const OFFER_COFFEE_MS = 30000;
const OFFER_PANEL_MS  = 15000;

let offerTimer   = null;
let offerShowing = false;
```

**9b.** Add before `/* ── Full render ── */`:

```js
/* ── Offers panel ────────────────────────────────────────────────
   The coffee column's second mode. Content comes from
   config.offersPanel (data/screen3-config.json), not the Sheet —
   same split as Screen 2's panini panel. */
function renderOffersPanel(cfg) {
  if (!cfg) return;

  document.getElementById('offersEyebrow').textContent = cfg.eyebrow;
  document.getElementById('offersTitle').textContent   = cfg.title;

  /* The <img>'s onerror handler removes the element outright, so on a
     later re-render it may no longer exist. Guard rather than throw —
     a missing photo must not take the whole board down. */
  const img = document.getElementById('offersImage');
  if (img && cfg.image) {
    img.src = screen3ImageSrc(cfg.image);
    img.alt = cfg.title;
  }

  document.getElementById('offersItems').innerHTML = cfg.items.map(function (it) {
    return `
      <div class="offers-row">
        <span class="offers-amount">${it.amount}</span>
        <span class="offers-what">${it.what}</span>
        <span class="offers-price">${it.price}</span>
      </div>`;
  }).join('');
}

function setOfferPhase(showing) {
  offerShowing = showing;
  const panel = document.getElementById('offersPanel');
  if (showing) panel.classList.add('is-showing');
  else         panel.classList.remove('is-showing');
}

function queueOfferFlip() {
  offerTimer = setTimeout(function () {
    setOfferPhase(!offerShowing);
    queueOfferFlip();
  }, offerShowing ? OFFER_PANEL_MS : OFFER_COFFEE_MS);
}

/* Called at the end of every render(), which runs again every
   REFRESH_MS. Clearing the pending timer FIRST is what stops a second
   rotation stacking on top of the first — exactly the discipline
   startSlideshow() uses in bowls.js. Without it the panel would flip
   twice as often after ten minutes, four times after fifteen, and so
   on. Resetting to the coffee phase also makes each refresh restart
   the cycle from a known state; the CSS transition plays in reverse,
   so it is a fade rather than a hard cut. */
function startOfferRotation() {
  if (offerTimer) clearTimeout(offerTimer);
  setOfferPhase(false);
  queueOfferFlip();
}
```

**9c.** In `render()`, after the existing `renderPipeUpsell(...)` line, add:

```js
  renderOffersPanel(config.offersPanel);
  startOfferRotation();
```

**9d.** Update the file's top comment block to mention the offers panel, matching
the existing house style there.

---

## 10. Verification

Run all of these. Do not skip the measurement step — §9 records that Screen 2's
104px overflow was invisible in screenshots and only showed up under measurement.

**10a.** Consistency check — expect no new findings:
```bash
node check-consistency.mjs
```

**10b.** Serve and open the board:
```bash
npx serve . --listen 3100 --no-port-switching
```
Check the page `<title>` after navigating to `http://localhost:3100/beverages.html` —
`serve` silently falls back to another port if 3100 is taken.

⚠️ **`baseline-screenshots/` is stale — do not diff against it.** Those files are
dated 17 Aug. Since then Screen 3 moved to the two-column layout, and `9af42e3`
changed all six smoothie macro rows, renamed Avo Clarity's benefit, swapped Ginger
Ale Cold Brew for Spanish Ice Latte, and reordered the coffee grid. Diffing against
the committed baseline produces a screenful of expected differences, which is worse
than no baseline at all — real regressions hide inside them.

**10b-bis.** Before touching any file, capture a fresh baseline of all three boards
at 1920×1080 into a scratch directory (not `baseline-screenshots/` — regenerating
the committed set is its own change, out of scope here). Every comparison below is
against that fresh capture.

**10c.** With Playwright at exactly 1920×1080 (not the Browser pane — its
screenshots are unreliable here), capture:
- the coffee phase — must be identical to the fresh baseline, since nothing about
  the coffee cards changes
- the offers phase
- Screens 1 and 2, confirming Step 1's token swap changed nothing

Note that a local preview now reads the **live Sheet**, which the owner has already
updated — so the coffee grid on screen shows Spanish Ice Latte in the reordered
position regardless of what `data/screen3-sheet.csv` holds. That is expected, not a
bug: the CSV is a snapshot, not what the board reads.

**10d.** Measure the panel's bounding box. It must be exactly:

| Edge | Value |
|---|---|
| left | 1156px (= 1920 − 764) |
| top | 0px |
| right | 1920px |
| bottom | 974px |

Compare against Screen 1's `.hero-panel` box — top and bottom must match exactly;
only left/right differ.

**10e.** Confirm the transition timing by watching one full cycle: 30s coffee,
~0.45s fade to dark, contents appear ~0.38s later, 15s offers, fade back.

**10f.** Confirm no timer stacking. In the console:
```js
setInterval(() => console.log(new Date().toISOString(), offerShowing), 1000)
```
Leave it for 12+ minutes (two `render()` refreshes) and confirm the phase still
flips on a 30/15 rhythm, not faster.

**10g.** Chrome 69 audit — confirm nothing in the new code uses: `?.`, `??`,
`Object.fromEntries`, CSS `inset`, or flex `gap`. The new code should use only
`opacity` transitions, `classList.add/remove`, `setTimeout`, and template
literals (all already used elsewhere in this file).

---

## 11. Documentation to update in the same commit

- **`CLAUDE.md`** — the `beverages.html/css/js` row in the file map, and the
  `data/screen3-config.json` row (add `offersPanel`). Note that Screen 3 now
  carries a dark anchor for part of every cycle.
  ⚠️ **Re-read the `data/screen3-config.json` row before editing it.** `9af42e3`
  rewrote it: it used to describe Screen 3's upsell as a single
  `{heading, gold:{text,price}}` object, which was wrong. It now correctly
  documents `upsellHeading` (string) + `upsell` (pipe-delimited array), same shape
  as Screens 1–2 via `renderPipeUpsell()`. Add `offersPanel` to the corrected text
  — do not paste back an older version of that row.
  The `images/screen3/` and `build-screen3-cutouts.mjs` rows also need the feature-art
  note from §4 step 8.
- **`DESIGN-PRINCIPLES.md` §2** — the Screen 3 paragraphs currently say the board
  has no top-of-screen dark mass at all. Amend: it now has a full-height dark
  panel for 15s of every 45s, matching Screens 1–2's panel height and vertical
  position at a different width. Keep the existing history — do not delete it.
- **`DESIGN-PRINCIPLES.md` §12** — add Offer Amount / Offer Label / Offer Price as
  a named, Screen-3-scoped, **non-canonical** group, so a later consistency pass
  does not try to token-ise them (J11).
- **`DESIGN-PRINCIPLES.md` §7** — one line noting the panel's gold numerals are
  the upsell-price use of gold, not a new fourth use.

---

## 12. Rollback

Single commit, single branch. `git revert` restores the previous board exactly —
the panel is additive, and Step 1's token swap is a no-op that can stay or go.

---

## 13. Deferred — not this version

- **Screen 1's offers slide.** The hero slideshow already rotates; adding one
  offers slide to that rotation is the cheapest version of this whole pattern.
  Decide after Screen 3 has been on the wall for a week.
- **Screen 2's panel mode swap.** Same shape as Screen 3's, applied to the static
  panini panel.
- **Screen 3's rail becoming a meal cross-sell.** Once the panel is shouting the
  add-ons, the rail below repeating them is the board talking to itself. Mirroring
  Screen 2's `combos` block ("add a bowl to your drink") would be the fix. Held
  back this version at the owner's request — all rails stay as they are.
- **Hoisting the panel CSS to `core.css`.** Only if and when Screens 1–2 adopt it.
  While it is one board's layout, it belongs in `beverages.css`.

---

## 14. Sequencing note

**The menu update is already committed** as `9af42e3` on `screen3-menu-update`
(see §0). No waiting for a merge is required.

An earlier draft of this section claimed the two changes collide in
`beverages.js`'s `render()` and `data/screen3-config.json`. Both claims were wrong,
checked against `git show 9af42e3`: `render()` was untouched (the only
`beverages.js` change is a comment block above `benefitAccentClass()`), and
`data/screen3-config.json` is not in the commit at all.

The real overlap is **one file: `build-screen3-cutouts.mjs`.** `9af42e3` added the
`spanish-ice-latte` MAP entry and bumped the header's photo count; §4 of this plan
adds a `protein-scoop` entry and rewrites that same header comment. If the owner
picks branch Option B in §0 (off `main`), expect a merge conflict there and resolve
it by keeping **both** MAP entries and the two-group header rewrite described in §4
step 4.

`beverages.css` also received a comment-only edit in `9af42e3` (the
`.smoothie-meta-row` example changed from "Women Wellness" to "Low Cortisol"); this
plan only appends a new block at the end of that file, so the two do not touch.

---
---

# REVISION 2 — Panel content and proportions

**Status:** plan only. Revision 1 (§1–§14 above) is **already built and verified**
on branch `screen3-offers-panel` — this revision edits that work, it does not
replace it.
**Mockup:** https://claude.ai/code/artifact/b8e324c4-880f-4457-b498-8b061829b581
**Branch:** continue on `screen3-offers-panel` (Option A, off `screen3-menu-update`).

## R1. Why this revision exists

Revision 1 shipped the panel with `image: ""` and the headline "Make any smoothie
work harder". Reviewed on the board, the panel read as **empty**: the composition
pins the title to the top and the price rows to the bottom, and `.offers-art`'s
`flex: 1` dumps every spare pixel into one ~474px void in the middle.

⚠️ **Shortening the headline makes this worse, not better.** "Fuel your body" is
one line where the old copy was two, freeing ~57px — and with `flex: 1` still on
the art box, all 57px land in the void, pushing it to ~538px. **The copy change
must not ship without the layout change in R4.** This is the single most likely
way to execute this revision wrong.

## R2. Decisions already made — do not re-litigate

| # | Decision | Rationale |
|---|---|---|
| R-J1 | Headline is **"Fuel your body"** | Owner's choice. Short, benefit-first, and drops "any smoothie" — which appears twice more in the rail below. |
| R-J2 | Content order is **title → claim chip → sweetener line → add-ons label → scoop → credit → price rows** | Owner's choice. Headline block sells; the label then introduces what follows. |
| R-J3 | Eyebrow text changes **"Power up" → "Smoothie add-ons"**, and **moves below** the claim | In offers mode the rail directly beneath already reads `POWER UP — Add 12g protein…`. Two identical labels visible simultaneously ~900px apart. Rails are frozen this version, so the panel is what moves. |
| R-J4 | The claim chip is **sage, outlined — never gold** | §7 reserves gold for "act on this"; the `+12g`/`+10g` numerals are that use. The smoothie header note's yellow highlight must **not** be copied here — it would be the fourth gold use §7 warns kills the signal. Looking different from that note is also what stops it reading as the same fact twice. |
| R-J5 | The Whole Truth credit is **scoped to protein**, sitting under the scoop | Owner confirmed Green Feast serves Whole Truth protein. Scoping matters: a floating endorsement over both rows would imply something unverified about the collagen. |
| R-J6 | Scoop renders at **250px** tall (mockup variant B) | 300px starts reading as a stock photo carrying the panel; 200px leaves the lower half type-heavy and the gap creeps back. Measured: 250px leaves ~98px slack, split evenly by `justify-content: center`. |
| R-J7 | `.offers-art` loses `flex: 1` and gets a **fixed height**; the panel gains `justify-content: center` | The emptiness is a *distribution* problem, not a missing-photo problem. Fixed art height + centred stack turns one big void into even breathing room. |

## R3. Step 1 — the image

**Owner saves the file manually** (Claude cannot write a pasted image to disk):

```
D:\Sam\SAMARTH STEPPING INTO BUSINESS\AI\Claude Code Sessions\QSR Menu\Screen3\protein-scoop.png
```

Then, in order:

1. **Verify it is actually transparent** before anything else:
   ```bash
   node -e "import('sharp').then(async s=>{const m=await s.default('Screen3/protein-scoop.png').metadata();console.log({format:m.format,w:m.width,h:m.height,channels:m.channels,hasAlpha:m.hasAlpha})})"
   ```
   `hasAlpha: true` and `channels: 4` are required. If it reports `hasAlpha: false`
   or 3 channels, **stop** — the white box will render as a hard rectangle on the
   `#163019` panel. Background removal is needed first (same manual path
   `ingest-manual-cutout.mjs` covers, per §6).
2. Add the `MAP` entry in `build-screen3-cutouts.mjs`:
   ```js
   'protein-scoop': 'protein-scoop.png',
   ```
3. **Rewrite that file's header comment into two groups** — required, not optional.
   Its current text justifies skipping DESIGN-PRINCIPLES §6 rule 2 *because every
   source is the same physical cup*, which stops being true the moment a scoop
   joins the MAP. Keep the existing cup-set reasoning verbatim (it is still correct
   for the ten drinks) and add a short second paragraph: the scoop is **solo
   feature art in its own layout slot with nothing to normalize against** — the
   same §6 exemption Screen 2's `panini-hero` / `bbq-plate` use — and is therefore
   also trim-only. Both grounds end at the same code path, so no logic changes.
   Update the "ten Screen 3 photos" wording so the count refers to the drinks, not
   to every file the script emits.
4. **Check `MAX_H` (currently 600).** Its comment justifies 600 as "~2.7× the
   largest on-screen display height (214px)" — true for a cup in a card, not for
   this. The scoop displays at 250px, so 600 is ~2.4× and adequate. **Leave `MAX_H`
   alone this revision**, but revisit if the scoop ever grows past ~250px.
5. Run:
   ```bash
   node build-screen3-cutouts.mjs
   ```
6. Confirm `images/screen3/protein-scoop.png` exists with transparency, and that
   the ten drink cut-outs are **unchanged** (`git status` should show only the new
   file; the script rewrites every output each run).

## R4. Step 2 — `beverages.css`

Edit the `OFFERS PANEL` block appended in Revision 1.

**4a.** `.offers-panel` — add one line:
```css
  justify-content: center;
```
This is what converts the single void into even breathing room. Without it the
rest of this revision does not solve the problem.

**4b.** `.offers-art` — replace `flex: 1; min-height: 0;` with:
```css
  flex-shrink: 0;
  height: 250px;   /* R-J6 — deliberately bounded, NOT flex:1. See R1. */
```

**4c.** `.offers-title` — reduce `margin-bottom` from `24px` to `22px`.

**4d.** Add three new rules after `.offers-title`:
```css
/* Claim chip — the no-added-sugar promise. Sage and outlined, never
   gold: §7 reserves gold for "act on this" and the +12g/+10g numerals
   are that use here. Deliberately a different treatment from the
   smoothie header's yellow-highlight note, so the same fact stated
   twice on one board reads as two registers, not a repeat. */
.offers-chip {
  align-self: flex-start;
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--sage-pale);
  border: 2px solid rgba(200,216,200,0.45);
  border-radius: 8px;
  padding: 8px 16px;
  margin-bottom: 14px;
  flex-shrink: 0;
}
.offers-sweetener {
  font-family: 'Inter', sans-serif;
  font-size: 23px;
  font-weight: 400;
  color: rgba(255,255,255,0.74);
  line-height: 1.35;
  margin-bottom: 30px;
  flex-shrink: 0;
}
/* Supplier credit. Scoped to protein on purpose — see R-J5. */
.offers-credit {
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 400;
  color: var(--sage-light);
  text-align: center;
  margin: 10px 0 22px;
  flex-shrink: 0;
}
.offers-credit b {
  color: rgba(255,255,255,0.88);
  font-weight: 600;
}
```

**4e.** `.offers-eyebrow` — reduce `font-size` `22px` → `21px` and
`margin-bottom` `10px` → `12px`. It is now a mid-panel label, not a top eyebrow.

⚠️ `.offers-panel` and `.offers-row` are flex containers — **flex `gap` stays
banned** (§9). All spacing above uses margins.

## R5. Step 3 — `beverages.html`

Reorder the panel's children and add three elements. Replace the block added in
Revision 1's Step 3 with:

```html
    <div class="offers-panel" id="offersPanel">
      <div class="offers-title" id="offersTitle"><!-- injected by JS --></div>
      <div class="offers-chip" id="offersChip"><!-- injected by JS --></div>
      <div class="offers-sweetener" id="offersSweetener"><!-- injected by JS --></div>
      <div class="offers-eyebrow" id="offersEyebrow"><!-- injected by JS --></div>
      <div class="offers-art">
        <img id="offersImage" src="" alt=""
             onerror="this.closest('.offers-art').classList.add('photo-error');this.remove()">
      </div>
      <div class="offers-credit" id="offersCredit"><!-- injected by JS --></div>
      <div class="offers-items" id="offersItems"><!-- injected by JS --></div>
    </div>
```

Everything about its placement is unchanged — still a direct child of `.screen`,
still after `.main-content` and before `.upsell-rail` (§7 / J7).

## R6. Step 4 — `data/screen3-config.json`

Replace the `offersPanel` block with:

```json
  "offersPanel": {
    "title": "Fuel your body",
    "chip": "No added sugar",
    "sweetener": "Sweetened only with banana and monk fruit",
    "eyebrow": "Smoothie add-ons",
    "image": "protein-scoop",
    "credit": "Protein by <b>The Whole Truth</b>",
    "items": [
      { "amount": "+12g", "what": "Protein",  "price": "₹120" },
      { "amount": "+10g", "what": "Collagen", "price": "₹120" }
    ]
  }
```

`sections`, `upsellHeading` and `upsell` are **unchanged** — the rail keeps both
its add-ons (§2, still the standing decision).

Note `credit` carries one `<b>` tag, so it must be injected with `innerHTML`, not
`textContent` (see R7). Every other field is plain text and stays `textContent`.

## R7. Step 5 — `beverages.js`

Only `renderOffersPanel()` changes. `setOfferPhase`, `queueOfferFlip` and
`startOfferRotation` are correct as built — **do not touch the timer logic.**

```js
function renderOffersPanel(cfg) {
  if (!cfg) return;

  document.getElementById('offersTitle').textContent     = cfg.title;
  document.getElementById('offersChip').textContent      = cfg.chip;
  document.getElementById('offersSweetener').textContent = cfg.sweetener;
  document.getElementById('offersEyebrow').textContent   = cfg.eyebrow;

  /* credit carries a <b> around the brand name, so this one is innerHTML.
     It is authored copy from our own config file, not Sheet data. */
  document.getElementById('offersCredit').innerHTML = cfg.credit;

  /* The <img>'s onerror handler removes the element outright, so on a
     later re-render it may no longer exist. Guard rather than throw —
     a missing photo must not take the whole board down. */
  const img = document.getElementById('offersImage');
  if (img && cfg.image) {
    img.src = screen3ImageSrc(cfg.image);
    img.alt = cfg.title;
  }

  document.getElementById('offersItems').innerHTML = cfg.items.map(function (it) {
    return `
      <div class="offers-row">
        <span class="offers-amount">${it.amount}</span>
        <span class="offers-what">${it.what}</span>
        <span class="offers-price">${it.price}</span>
      </div>`;
  }).join('');
}
```

## R8. Verification

**8a.** `node check-consistency.mjs` — expect clean. The new classes are not
canonical elements (§11 / J11 already documents this), so it should not report them.

**8b.** Serve and open at exactly 1920×1080:
```bash
npx serve . --listen 3100 --no-port-switching
```
Check the page `<title>` after navigating — `serve` silently falls back to another
port if 3100 is taken.

**8c.** Force the offers phase in the console, then screenshot:
```js
setOfferPhase(true)
```

**8d.** **Measure, do not eyeball** (§9 records that Screen 2's 104px overflow was
invisible in screenshots):

| Check | Expected |
|---|---|
| Panel box | left 1156, top 0, right 1920, bottom 974 |
| `.offers-panel` overflow | `scrollHeight <= clientHeight` — no overflow |
| `.offers-art` height | exactly 250px |
| Content + margins | ~796px of 894px available, ~49px slack top and bottom |
| Scoop image | loads; `.offers-art` does **not** carry `.photo-error` |

**8e.** Confirm the chip is **not** gold:
```js
getComputedStyle(document.querySelector('.offers-chip')).color
```
must be the sage `rgb(200, 216, 200)`, never `rgb(254, 250, 103)`.

**8f.** Confirm the rotation still works and does not stack — leave the board open
12+ minutes (two `render()` refreshes) and check the 30/15 rhythm has not sped up.

**8g.** Chrome 69 audit: this revision adds only `textContent`, `innerHTML`,
`classList`, and CSS `border` / `letter-spacing` / `justify-content`. No `?.`,
`??`, `inset`, or flex `gap`.

**8h.** Screens 1 and 2 unchanged — nothing here touches `core.css`, but screenshot
both anyway since `CLAUDE.md` and `DESIGN-PRINCIPLES.md` are shared context.

## R9. Documentation to update in the same commit

- **`CLAUDE.md`** — the `data/screen3-config.json` row lists `offersPanel`'s shape;
  update it to the new fields (`title`, `chip`, `sweetener`, `eyebrow`, `image`,
  `credit`, `items`). Also the `images/screen3/` and `build-screen3-cutouts.mjs`
  rows: the folder now holds one piece of panel feature art alongside the drinks.
- **`DESIGN-PRINCIPLES.md` §6** — one line recording that Screen 3's cut-out folder
  now holds two categories under two different rule-2 exemptions (uniform cup set;
  solo feature art), matching the rewritten script header.
- **`DESIGN-PRINCIPLES.md` §7** — extend the gold bullet added in Revision 1 to note
  that the panel's no-added-sugar claim deliberately uses neither gold nor the
  header note's yellow highlight, and why.
- **`DESIGN-PRINCIPLES.md` §12** — extend the non-canonical note to cover
  `.offers-chip`, `.offers-sweetener` and `.offers-credit`.

## R10. Open item — not blocking

The no-added-sugar fact now appears **twice on one board**: the smoothie section
header's yellow parenthetical, and this panel's chip. That is deliberate (different
treatment, different register, and the panel is only visible a third of the time),
but it is worth an eye on the wall before it is called finished. If it reads as
repetition in situ, the cheaper fix is dropping the *header* note — the panel
states it better.

---
---

# REVISION 3 — Asset versioning, rail swap, panel hierarchy

**Status:** plan only. Revisions 1–2 are built, pushed and live (`6779e20`, `7ec435f`).
**Branch:** `main` is current and clean; branch from it.

Three independent pieces of work. **A is cross-screen and should land as its own
commit**; B and C are Screen 3 content/layout and can share a commit.

---

## A. Asset versioning — stop the TVs running stale JS/CSS

### A1. Why

`7ec435f` cache-busted the *config* fetch, but `core.js`, `core.css`,
`<screen>.js` and `<screen>.css` are still requested at plain URLs. Chrome
caches them by URL, so a kiosk that has been open for weeks keeps running old
code after a deploy — with no visible signal.

This was observed directly while verifying `7ec435f`: GitHub Pages was serving
the fixed `beverages.js`, but the browser kept executing the previous copy until
a forced revalidation. `fetchBeveragesData.toString()` still showed the old body.
That is the same failure mode that produced the empty offers panel, one level up.

### A2. Approach — one global version number

Add `?v=N` to all six local asset references, using **the same N everywhere**,
bumped once per deploy.

Per-file version numbers would avoid re-downloading unchanged files, but they
add bookkeeping a non-technical owner has to get right, and these files are a
few KB each — the saving is not worth the risk of a half-bumped deploy. One
number, bumped every time, is the version that cannot be got subtly wrong.

Do **not** try to derive the version from a git SHA: that needs a build step,
and this project is deliberately build-free (CLAUDE.md, "Tech stack").

### A3. The edits — 6 lines across 3 files

Current value is unversioned, so this revision starts at `v=2`.

`bowls.html` (lines 10, 11, 57, 58):
```html
  <link rel="stylesheet" href="core.css?v=2">
  <link rel="stylesheet" href="bowls.css?v=2">
  ...
  <script src="core.js?v=2"></script>
  <script src="bowls.js?v=2"></script>
```

`wraps.html` (lines 10, 11, 87, 88) — same pattern with `wraps.css` / `wraps.js`.

`beverages.html` (lines 10, 11, 85, 86) — same pattern with `beverages.css` /
`beverages.js`.

Leave the Google Fonts `<link>` alone — it is versioned by Google.

`adjust.html` and `tvtest.html` are out of scope: local tools opened fresh on a
dev machine, never left running on a wall. Confirm at execution time that they
do not reference `core.js` in a way that matters; if they do, leave them
unversioned anyway and note why.

### A4. What this depends on

Versioning only works if the **HTML itself** is fetched fresh — otherwise the
new `?v=` never reaches the browser. GitHub Pages serves HTML with a short
max-age (~10 min) while allowing long caching of subresources, which is exactly
the split this technique assumes. No change needed; just be aware that the
first pickup after a deploy can lag by up to that window.

### A5. Required documentation

**`CLAUDE.md`, the "Running & deploying" section.** Add the version bump to the
deploy instructions as a required step, not a footnote — the whole mechanism
fails silently if it is skipped:

> **Every deploy: bump `?v=N` on the six `core.css` / `core.js` /
> `<screen>.css` / `<screen>.js` references in `bowls.html`, `wraps.html` and
> `beverages.html` — all six to the same number.** Without it the store TVs
> keep executing whatever JS/CSS they cached, sometimes for weeks, and the
> deploy appears to do nothing. Cache-busting the Sheet and config fetches
> (`cacheBust()` in `core.js`) does not cover the script and stylesheet files
> themselves.

---

## B. Screen 3's upsell rail → "Make it a meal"

### B1. Why

The rail currently repeats the two add-ons the offers panel now shows at poster
size — the same board saying the same thing twice, one of them in the smallest
type on screen. This was already logged as deferred work in Revision 1 §13.

It also removes a second collision: the rail heading and the panel label were
both "Power up", visible simultaneously ~900px apart.

### B2. The edit — `data/screen3-config.json`

```json
  "upsellHeading": "Make it a meal",
  "upsell": [
    "Add coffee to your meal | +₹200",
    "Add a functional smoothie to your meal | +₹250"
  ],
```

Everything else in the file is unchanged. `renderPipeUpsell()` already handles
this shape (two pipe-delimited parts → `.upsell-addon`); no code change.

### B3. ⚠️ Confirm the wording before building

The two lines above are copied **verbatim** from `data/screen2-config.json`'s
`combos` block, so the same offer reads identically on both boards — the
consistency argument §12 exists to protect.

But they were written for a *food* board ("add a drink to your meal"). On the
beverage board the customer is looking at drinks, so "Add coffee to your meal"
is the same offer read from the other end. It still parses, and arguably lands
better (it tells a drink-shopper the drink is cheaper with food).

**Ask the owner to confirm** rather than assume:
- **Option 1 (recommended):** use Screen 2's wording verbatim, as above.
- **Option 2:** reword for the beverage side, e.g. "Add a bowl to your drink".
  Reads more naturally in context, but the same offer then has two different
  wordings in one store — exactly the drift the shared vocabulary is meant to
  prevent.

Do not invent a third wording.

---

## C. Offers panel — hierarchy changes

### C1. Target hierarchy

```
Fuel your body                                  ← unchanged
Smoothies sweetened with banana and monk fruit  ← moved UP, copy changed
[ NO ADDED SUGAR ]                              ← moved DOWN
SMOOTHIE ADD-ONS                                ← bigger, now WHITE
[ scoop, 250px ]                                ← unchanged
Protein by The Whole Truth                      ← now underlined
+12g PROTEIN   ₹120                             ← unchanged
+10g COLLAGEN  ₹120                             ← unchanged
```

The sweetener sentence and the claim chip **swap places**: the sentence now sets
the claim up and the chip lands it, instead of the chip arriving cold.

### C2. `beverages.html` — swap two lines

Inside `.offers-panel`, `.offers-sweetener` moves above `.offers-chip`:

```html
      <div class="offers-title" id="offersTitle"><!-- injected by JS --></div>
      <div class="offers-sweetener" id="offersSweetener"><!-- injected by JS --></div>
      <div class="offers-chip" id="offersChip"><!-- injected by JS --></div>
      <div class="offers-eyebrow" id="offersEyebrow"><!-- injected by JS --></div>
```

The remaining children (`.offers-art`, `.offers-credit`, `.offers-items`) keep
their order. No JS change — `renderOffersPanel()` addresses elements by id, not
position.

### C3. `data/screen3-config.json` — one copy change

```json
    "sweetener": "Smoothies sweetened with banana and monk fruit",
```

`title`, `chip`, `eyebrow`, `image`, `credit` and `items` are unchanged.

### C4. `beverages.css` — three rules

**C4a. `.offers-eyebrow` — give it real presence.** It is currently 21px
`--sage-light`, which at wall distance on a dark ground is close to invisible:

```css
  font-size: 26px;              /* was 21px */
  color: #FFFFFF;               /* was var(--sage-light) */
```

Keep `font-weight: 700`, the `0.22em` tracking and the uppercase transform —
only size and colour change. At 26px with that tracking, "SMOOTHIE ADD-ONS" is
roughly 340px wide against 676px available, so it stays on one line.

**C4b. `.offers-credit` — underline the whole line.**

```css
  text-decoration: underline;
```

⚠️ **Do not add `text-underline-offset`** — Chrome 87, and the store TVs are on
Chrome 69 (§9). The underline sits at the browser default offset; that is the
only option available here.

Note this underlines *both* "Protein by" and "The Whole Truth", which is what
was asked. The existing `.offers-credit b` rule (white, 600) still applies to
the brand name, so it stays emphasised within the underlined line.

**C4c. Swap the two margins to match the new order.** `.offers-sweetener`
currently carries the large `30px` bottom margin because it used to be the last
element before the label; now the chip is. Otherwise the gap lands in the wrong
place:

```css
.offers-sweetener { margin-bottom: 12px; }   /* was 30px */
.offers-chip      { margin-bottom: 30px; }   /* was 14px */
```

### C5. Height budget

Rough recompute against the 894px available (974 − 44 − 36 padding):

| Element | Height + margin |
|---|---|
| title | 57 + 22 |
| sweetener | ~31 + 12 |
| chip | 52 + 30 |
| eyebrow (26px) | ~32 + 12 |
| art | 250 + 20 |
| credit | ~32 + 32 |
| items | 230 |
| **total** | **~812 of 894** |

Leaves ~82px of slack, distributed evenly by the panel's `justify-content:
center`. **Treat these as estimates and measure the real box** — §9 records that
Screen 2's 104px overflow was invisible in screenshots.

If it does overflow, reduce the scoop from 250px before touching any type size;
the photo is the most compressible element and R-J6 already treats 250 as a
judgement call rather than a constraint.

### C6. Design rules this must not break

- **No new gold.** Everything here is white or sage. §7's gold budget is
  unchanged: the `+12g` / `+10g` numerals remain the only gold on the panel.
- The chip stays **sage and outlined**, never gold and never the smoothie
  header's yellow highlight (R-J4).
- All `.offers-*` classes remain **non-canonical** (§12) — literal sizes are
  correct here, `check-consistency.mjs` should stay silent about them.

---

## D. Verification

Run all of it; do not skip the measurements.

**D1.** `node check-consistency.mjs` — expect clean.

**D2.** Serve and open at exactly 1920×1080:
```bash
npx serve . --listen 3100 --no-port-switching
```
Check the page `<title>` after navigating — `serve` falls back to another port
silently if 3100 is taken.

**D3. Versioning (A).** On each of the three boards, confirm every local asset
request carries the version:
```js
performance.getEntriesByType('resource')
  .map(e => e.name)
  .filter(n => /\.(js|css)(\?|$)/.test(n) && !n.includes('fonts.g'))
```
All six must show `?v=2`. A bare `core.js` with no query means a tag was missed.

**D4. Rail (B).** On Screen 3:
- `.upsell-heading` reads "Make it a meal"
- exactly two `.upsell-addon` elements, with the combo text and `+₹200` / `+₹250`
- the rail is still 64px tall and the footer 42px — Revision 1's tokens must not
  have shifted

**D5. Panel (C).** Force the offers phase (`setOfferPhase(true)`), then check:

| Check | Expected |
|---|---|
| Child order | title → sweetener → chip → eyebrow → art → credit → items |
| Panel box | left 1156, top 0, right 1920, bottom 974 |
| Overflow | `scrollHeight <= clientHeight` |
| `.offers-art` height | 250px |
| `.offers-eyebrow` | `font-size: 26px`, `color: rgb(255, 255, 255)` |
| `.offers-credit` | `text-decoration-line: underline` |
| `.offers-chip` colour | `rgb(200, 216, 200)` — **never** `rgb(254, 250, 103)` |
| Scoop image | loads; `.offers-art` has no `.photo-error` |

**D6.** Confirm the rotation still runs 30/15 and does not stack — leave the
board open 12+ minutes (two `render()` refreshes).

**D7.** Confirm the fail-closed guard from Revision 2 still works: call
`render()` with a config whose `offersPanel` key is removed, and check the panel
stays at `opacity: 0` through a full 30s dwell.

**D8.** Screens 1 and 2 render correctly — Part A touches their HTML.

**D9. Chrome 69 audit.** New CSS is `font-size`, `color`, `text-decoration`,
`margin-bottom` — all safe. Confirm no `text-underline-offset`, no `?.`, no
`??`, no CSS `inset`, no flex `gap` in the diff.

---

## E. Commits

1. **`Version local assets so kiosks pick up deploys`** — the three HTML files
   plus the `CLAUDE.md` deploy note (A).
2. **`Screen 3: meal combos on the rail, offers panel hierarchy`** —
   `beverages.html`, `beverages.css`, `data/screen3-config.json` (B + C).

Keeping A separate matters: it is the only cross-screen change here, and if it
ever needs reverting it should come out without taking Screen 3's content with
it.

**After pushing, bump nothing else** — but do hard-refresh the three TVs once.
Their currently-cached HTML predates the versioning, so they need one manual
refresh to pick up the versioned tags; from then on it is automatic.

---

## F. Open items

- **The no-added-sugar fact still appears twice on the board** — the smoothie
  header's yellow parenthetical and the panel's chip. Revision 2 §R10 flagged
  this for an on-wall check. Part C strengthens the panel's version, which makes
  the header note the weaker of the two; if it reads as repetition in situ, drop
  the header note rather than the chip.
- **Screens 1 and 2 still have no offers panel.** Revision 1 §13 holds this as
  deferred until Screen 3 has been on the wall a while.
