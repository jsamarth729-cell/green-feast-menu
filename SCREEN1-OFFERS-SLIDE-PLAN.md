# Screen 1 — Offers Slide — Execution Plan

**Branch:** `screen1-offers-slide` (off `main` @ `e5aec3a`)
**Status:** plan only — no code changed yet.
**Precedent:** `SCREEN3-OFFERS-PANEL-PLAN.md` (Revisions 1–3). Read its §3 and R2
judgment tables before starting — several decisions below are inherited from it
rather than re-argued.

Read `DESIGN-PRINCIPLES.md` §3 (hero panel), §6 (photography), §7 (colour) and
§9 (Chrome 69) before starting. This plan uses §12's vocabulary.

---

## 1. What this builds

Screen 1's hero slideshow gains an **offers slide** — a peer of the bowl slides,
in the same rotation, showing the two bowl add-ons at poster size.

```
bowl 1   bowl 2   bowl 3   OFFERS   bowl 4   bowl 5   bowl 6   bowl 7   OFFERS  → repeat
 10s      10s      10s      15s      10s      10s      10s      10s      15s
└──────────────────────── 100s cycle, offers on screen 30% ───────────────────┘
```

**Why this board and not Screen 2:** Screen 1's hero is the only surface in the
store where covering it costs *nothing informationally* — every featured bowl
also appears in the 2×5 grid to its right. Screen 2's panini panel is the only
place paninis are listed, so covering it would hide menu items outright. Screen
2 is deliberately out of scope (owner's decision).

---

## 2. What this does NOT change

| Thing | Why |
|---|---|
| Screen 2, entirely | Owner's call — the panini panel is the only panini listing on that board, and Screen 2 is already dense. |
| Screen 3 | Already done (Revisions 1–3). This plan does not touch `beverages.*`. |
| The bowl slides themselves | `heroSlideHTML()`, `.hero-slide` bowl styling, the 10s bowl dwell, the 0.9s cross-fade — all unchanged. |
| The 2×5 grid, BYOB tile, footer | Untouched. |
| `data/bowls-sheet.csv` / the Sheet | No new columns. Offers content is config, not Sheet — same split as Screen 3 (its J8). |

---

## 3. Judgment calls — already made, do not re-litigate

| # | Decision | Rationale |
|---|---|---|
| S1 | **The offers slide is another `.hero-slide`**, not an overlay panel. | Screen 1's hero already rotates on a timer. A second, independent overlay timer on the same 525px would fade in mid-slide-transition — two uncoordinated animations on one surface. Being a slide also inherits the existing 0.9s cross-fade and absolute positioning for free. |
| S2 | **Insert after the midpoint bowl and after the last bowl**, computed as `Math.floor(featured.length / 2)`. | With today's 7 featured bowls that is exactly "after the 3rd" and "after the 7th", which is what was asked. Expressed as a rule rather than hardcoded indices so it still behaves if the owner toggles `featured` in the Sheet. See S3 for the arithmetic. |
| S3 | Never dedupe-checks needed: `floor(n/2) === n` only when `n === 0`. | For any n ≥ 1 the midpoint and last positions differ, so the two offers slides can never collide. n = 0 is guarded separately (no bowls → no slides → no offers). |
| S4 | **Offers slide dwells 15s; bowls stay at 10s.** | Owner's call. The slide carries more to read than a bowl name. Requires per-slide timing (S5). |
| S5 | **`startSlideshow()` moves from `setInterval` to a recursive `setTimeout`.** | A single interval cannot express two different dwell times. Same pattern as Screen 3's `queueOfferFlip()`. Note the teardown call changes from `clearInterval` to `clearTimeout` — they are interchangeable in practice, but the code must be consistent. |
| S6 | **Every slide gets a dot, including the two offers slides** — 9 dots today. | The dots row means "where you are in the cycle". Hiding the offers slides from it would make the indicator lie about cycle length. Uniform styling; no special-case dot. |
| S7 | **Title is "Fuel your body"** — identical to Screen 3's panel. | Owner's explicit instruction. One offer voice across the store. |
| S8 | **Title renders at 52px, not `.hero-name`'s 58px.** | At 58px, "Fuel your body" measures ~406px against 420px of content width — one character away from wrapping. 52px is comfortably one line and matches Screen 3's panel title exactly. A deliberate, documented variant (§12), not drift. |
| S9 | **The price is the hero numeral, not a gram count.** One large gold `+₹50`, stated once, with the qualifying items listed beneath. | Screen 3's `+12g` / `+10g` worked because both add-ons decomposed into *amount / what / price*. Screen 1's do not: "Extra premiums — feta / guacamole / beetroot hummus" has no amount and its label is a three-item list. Both add-ons are +₹50, so "any extra, ₹50" is both truer to the content and a stronger message than two rows that repeat the same price. |
| S10 | **The 2×2 extras photo is solo feature art** — trimmed to alpha bbox, no shared canvas. | Same §6 exemption as `protein-scoop` and Screen 2's `panini-hero`: one image, its own layout slot, nothing to normalise against. Recorded in §9 of this plan. |
| S11 | **Image lives at `images/nobg/extras-grid.png`.** | Mirrors the Screen 3 precedent, where `protein-scoop.png` sits alongside the drinks in `images/screen3/`. Screen 1's cut-outs live in `images/nobg/`, so its feature art does too. |
| S12 | **`?v=` bumps from 2 to 3 on all six references.** | Required by CLAUDE.md's deploy rule — this change touches `bowls.js` and `bowls.css`. Skipping it means the TVs keep running v2 indefinitely. |

---

## 4. Resolved — both questions answered

### Q1 — Paneer is not a premium; it illustrates the protein add-on. RESOLVED.

The board sells two add-ons, unchanged:

```
"Extra protein (8–10g)                                | +₹50"
"Extra premiums — feta / guacamole / beetroot hummus   | +₹50"
```

Paneer is not a menu item on its own — it's in the image as a **visual example
of "extra protein"**, the same way feta/guacamole/beetroot hummus are visual
examples of "extra premiums". The four-cell grid maps 2:2 onto the two add-ons,
not 1:4 onto a single one.

**Consequence: the copy does not change.** §6's `items` list stays the original
two lines, unmodified. §8's image prompt is correct as written — four items,
because the *image* illustrates two categories with two examples each, even
though the *config* still lists exactly two add-ons.

⚠️ **Do not let a future edit "correct" this to four premiums.** Paneer
appearing in the photo is deliberate and representational, not a sign the copy
is out of date — noted again at §6 B1 and §11's doc list so nobody unpicks it
by mistake.

### Q2 — Screen 1's rail stays as-is. RESOLVED.

**Part D is dropped from this revision.** No rail change. §9 is retained below
as a fully-specified, ready-to-execute plan for later — do not run it now.

---

## 5. Part A — the image

### A1. Generate it

Use the prompt in §8. Save the result to the gitignored source folder:

```
D:\Sam\SAMARTH STEPPING INTO BUSINESS\AI\Claude Code Sessions\QSR Menu\Screen3\extras-grid.png
```

(`Screen3/` is simply where generated source art already lives; the output path
is what determines which board it belongs to.)

### A2. Verify real transparency *before* anything else

```bash
node -e "import('sharp').then(async s=>{const m=await s.default('Screen3/extras-grid.png').metadata();console.log({format:m.format,w:m.width,h:m.height,channels:m.channels,hasAlpha:m.hasAlpha})})"
```

`hasAlpha: true` and `channels: 4` are necessary but **not sufficient** — an
opaque white image can carry an unused alpha channel. Also sample the corners:

```bash
node -e "import('sharp').then(async s=>{const {data,info}=await s.default('Screen3/extras-grid.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});const{width:W,height:H,channels:C}=info;const a=(x,y)=>data[(y*W+x)*C+3];let t=0;for(let i=3;i<data.length;i+=C)if(data[i]<10)t++;console.log({corners:[a(2,2),a(W-3,2),a(2,H-3),a(W-3,H-3)],transparentPct:(t/(W*H)*100).toFixed(1)})})"
```

Corners must read `0` and `transparentPct` should be well above zero. If the
corners are `255`, the generator produced a white background — remove it before
continuing (§6 covers the manual path).

### A3. Trim to the alpha bounding box

There is no Screen 1 equivalent of `build-screen3-cutouts.mjs` for feature art,
and adding one for a single file is not worth it. Run the same trim as a one-off:

```bash
node -e "
import('sharp').then(async s=>{
  const sharp=s.default, f='Screen3/extras-grid.png';
  const {data,info}=await sharp(f).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width:W,height:H,channels:C}=info;
  let mnX=W,mnY=H,mxX=-1,mxY=-1;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(data[(y*W+x)*C+3]>40){if(x<mnX)mnX=x;if(x>mxX)mxX=x;if(y<mnY)mnY=y;if(y>mxY)mxY=y;}}
  const bw=mxX-mnX+1, bh=mxY-mnY+1;
  let img=sharp(f).extract({left:mnX,top:mnY,width:bw,height:bh});
  if(bh>600) img=img.resize({height:600});
  await img.png({compressionLevel:9}).toFile('images/nobg/extras-grid.png');
  console.log('bbox',bw+'x'+bh);
});
"
```

The `600` ceiling matches `build-screen3-cutouts.mjs`'s `MAX_H` — the slide
displays it at ~320px, so 600 leaves ~1.9× headroom. **Never upscale.**

**If Screen 1 ever gains a second piece of feature art, promote this into a
script** rather than running it a third time by hand.

### A4. Confirm nothing else moved

```bash
git status --short images/
```
Should show only `?? images/nobg/extras-grid.png`. The bowl cut-outs are not
touched by this command — if any appear as modified, stop.

---

## 6. Part B — content

### B1. `data/config.json`

Add `offersSlide`, and (for consistency with Screens 2–3) move the rail heading
out of code into config — this is purely relocating the existing string, not a
wording change, and is unaffected by Q2 (the rail's *content* stays "Extras" /
the same two upsell lines; only where that heading lives in the codebase moves):

```json
{
  "buildYourOwn": {
    "name": "Build Your Own Bowl",
    "description": "Choose base, protein, toppings and dressing.",
    "price": 349
  },
  "upsellHeading": "Extras",
  "upsell": [
    "Extra protein (8–10g) | +₹50",
    "Extra premiums — feta / guacamole / beetroot hummus | +₹50"
  ],
  "offersSlide": {
    "title": "Fuel your body",
    "eyebrow": "Bowl add-ons",
    "image": "extras-grid",
    "amount": "+₹50",
    "amountNote": "each",
    "items": [
      "Extra protein (8–10g)",
      "Extra premiums — feta / guacamole / beetroot hummus"
    ]
  }
}
```

`items` are the **same two lines as `upsell`**, unmodified — per Q1's
resolution the menu still has exactly two add-ons. The image shows four
ingredients (paneer illustrating protein, the other three illustrating
premiums), but the *copy* stays two-lines-for-two-add-ons. Do not add a
paneer line here — that would imply a third, non-existent add-on.

Note `items` are plain strings — **rendered with `textContent`, not
`innerHTML`.** Unlike Screen 3's `credit`, nothing here carries markup, so there
is no reason to open that door.

### B2. `bowls.js` — read the heading from config

`render()` currently hardcodes the rail heading:

```js
renderPipeUpsell(data.upsell, 'Extras');
```

Change to:

```js
renderPipeUpsell(data.upsell, data.upsellHeading);
```

This is the same shape Screens 2 and 3 already use.

---

## 7. Part C — the slide

### C1. `bowls.js` — constants and state

Alongside the existing `SLIDE_MS`:

```js
const SLIDE_MS       = 10000;   // bowl slide
const OFFER_SLIDE_MS = 15000;   // offers slide — more to read than a bowl name

/* Per-slide dwell, parallel to the rendered slide order. Bowls and offers
   slides have different dwells, which a single setInterval cannot express —
   see startSlideshow(). */
let slideDurations = [];
```

`featuredCount` is now misleading (the rotation is longer than the bowl count).
**Delete it** and use `slideDurations.length` everywhere it was used.

### C2. `bowls.js` — the slide markup

```js
/* ── Offers slide ────────────────────────────────────────────────
   A peer of the bowl slides, in the same rotation — see
   SCREEN1-OFFERS-SLIDE-PLAN.md S1 for why this is a slide rather than
   an overlay panel. Content comes from config.offersSlide, not the
   Sheet (same split as Screen 3's panel). */
function offersSlideHTML(cfg) {
  return `
    <div class="hero-slide offers-slide">
      <div class="offers-slide-title">${cfg.title}</div>
      <div class="offers-slide-eyebrow">${cfg.eyebrow}</div>
      <div class="offers-slide-art">
        <img src="images/nobg/${cfg.image}.png" alt="${cfg.eyebrow}"
             onerror="this.closest('.offers-slide-art').classList.add('photo-error');this.remove()">
      </div>
      <div class="offers-slide-amount-row">
        <span class="offers-slide-amount">${cfg.amount}</span>
        <span class="offers-slide-note">${cfg.amountNote}</span>
      </div>
      <div class="offers-slide-items">
        ${cfg.items.map(function (t) {
          return `<div class="offers-slide-item">${t}</div>`;
        }).join('')}
      </div>
    </div>`;
}
```

⚠️ **No `src=""` fallback attribute** — Revision 2 of the Screen 3 plan records
that `src=""` makes the browser request the current page as an image, fire
`onerror` immediately and delete the element. Here the `src` is set inline at
build time, so the attribute is always populated; never add an empty one.

### C3. `bowls.js` — build the sequence in `render()`

Replace the current hero block:

```js
  const featured = data.bowls.filter(b => b.featured);

  /* Interleave the offers slide after the midpoint bowl and after the
     last one. With 7 featured bowls that is "after the 3rd" and "after
     the 7th" exactly; written as a rule so it still behaves if the
     owner toggles `featured` in the Sheet. floor(n/2) can only equal n
     when n is 0, so the two positions never collide (plan S2/S3). */
  const mid = Math.floor(featured.length / 2);
  const slidesHTML = [];
  const durations  = [];

  featured.forEach(function (bowl, i) {
    slidesHTML.push(heroSlideHTML(bowl));
    durations.push(SLIDE_MS);

    const isMid  = (i + 1) === mid;
    const isLast = (i + 1) === featured.length;
    if (data.offersSlide && (isMid || isLast)) {
      slidesHTML.push(offersSlideHTML(data.offersSlide));
      durations.push(OFFER_SLIDE_MS);
    }
  });

  slideDurations = durations;

  document.getElementById('heroSlides').innerHTML = slidesHTML.join('');

  document.getElementById('heroDots').innerHTML =
    slidesHTML.map(function (_, i) {
      return `<div class="hero-dot${i === 0 ? ' active' : ''}"></div>`;
    }).join('');

  goToSlide(0);
  startSlideshow();
```

Note `data.offersSlide &&` — if the config key is missing or a stale cached
config is served, the rotation silently falls back to bowls only rather than
rendering a broken slide. Same fail-closed reasoning as Screen 3's Revision 2.

### C4. `bowls.js` — per-slide timing

```js
function startSlideshow() {
  if (slideTimer) clearTimeout(slideTimer);   /* was clearInterval */
  queueNextSlide();
}

/* Recursive setTimeout rather than setInterval: bowls dwell 10s and the
   offers slide 15s, which one interval cannot express. Clearing the
   pending timer in startSlideshow() before re-queuing is what stops a
   second rotation stacking on the first when render() runs again every
   REFRESH_MS — the same discipline Screen 3's offers rotation uses. */
function queueNextSlide() {
  const dwell = slideDurations[currentSlide] || SLIDE_MS;
  slideTimer = setTimeout(function () {
    goToSlide((currentSlide + 1) % slideDurations.length);
    queueNextSlide();
  }, dwell);
}
```

`goToSlide()` is unchanged — it already indexes `.hero-slide` and `.hero-dot`
by position, and both lists now simply contain more entries.

⚠️ Guard the empty case: if `slideDurations.length === 0` (no featured bowls),
`% 0` yields `NaN`. Add at the top of `startSlideshow()`:

```js
  if (!slideDurations.length) return;
```

### C4b. Fonts — `bowls.html`

`.offers-slide-amount` uses Montserrat 700. `bowls.html`'s Google Fonts link
currently requests `Montserrat:wght@600` only, so 700 would be synthesised
(faux bold). Change that one link to `Montserrat:wght@600;700`.

Check whether `beverages.html` needs the same — Screen 3's `.offers-amount` also
asks for 700. If it does, fix it there too **in this same commit** and note it,
since it means Screen 3 has been rendering faux-bold numerals since Revision 1.

### C5. `bowls.css` — the slide's styling

Append a new section. **Content width is 420px** (525 panel − 61px left −
44px right, matching `.hero-name`'s existing padding convention), and the slide's
content box is ~810px tall (934px of `.hero-slides` − the 96/28 padding
`.hero-slide` already applies).

```css
/* ═══════════════════════════════════════════════════════════════
   OFFERS SLIDE — a peer of the bowl slides, not an overlay.

   Inherits .hero-slide's absolute positioning, 96/28 padding and the
   0.9s cross-fade; only the inner layout is new. See
   SCREEN1-OFFERS-SLIDE-PLAN.md S1.

   Content width is 420px: the 525px panel less the 61px/44px side
   padding .hero-name already establishes. Keep new children on that
   same measure so the slide lines up with the bowl slides.
══════════════════════════════════════════════════════════════════ */
.offers-slide {
  justify-content: center;
}

/* .hero-slide sets align-items: flex-start, so children shrink-wrap by
   default. These need the full measure for the divider and spacing to
   read correctly. */
.offers-slide > * {
  width: 100%;
  padding-left: 61px;
  padding-right: 44px;
}

.offers-slide-title {
  font-family: 'Playfair Display', serif;
  /* 52px, not .hero-name's 58px — at 58 the title is ~406px against
     420px of measure, one character from wrapping. Matches Screen 3's
     panel title exactly. Deliberate variant, see plan S8. */
  font-size: 52px;
  font-weight: 600;
  color: #FFFFFF;
  line-height: 1.1;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.offers-slide-eyebrow {
  font-family: 'Inter', sans-serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #FFFFFF;
  margin-bottom: 22px;
  flex-shrink: 0;
}

.offers-slide-art {
  height: 320px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 24px;
}
.offers-slide-art img {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  display: block;
}
.offers-slide-art.photo-error {
  /* Image missing — the box collapses and the numeral carries the
     slide. Nothing else to do. */
  display: flex;
}

.offers-slide-amount-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 14px;
  flex-shrink: 0;
}
.offers-slide-amount-row > * + * {
  margin-left: 14px;   /* flex gap banned on Chrome 69 — §9 */
}

/* Gold on the price only. §7 permits gold for "anything the customer
   should act on" — an add-on price is exactly that, the same job the
   upsell rail's price does and the same use Screen 3's panel makes of
   it. Not a new gold use. */
.offers-slide-amount {
  font-family: var(--font-item-name);
  font-size: 76px;
  font-weight: 700;
  color: var(--gold);
  line-height: 1;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}
.offers-slide-note {
  font-family: 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 400;
  color: rgba(255,255,255,0.72);
  flex-shrink: 0;
}

.offers-slide-items {
  flex-shrink: 0;
  border-top: 1px solid rgba(255,255,255,0.16);
  padding-top: 16px;
}
.offers-slide-item {
  font-family: 'Inter', sans-serif;
  font-size: 23px;
  font-weight: 400;
  color: rgba(255,255,255,0.88);
  line-height: 1.45;
}
```

⚠️ `.offers-slide-items` gets `padding-top` from its own rule *and*
`padding-left/right` from the `.offers-slide > *` rule above. Confirm the
side padding is not being overridden — if specificity fights, give
`.offers-slide-items` explicit side padding rather than raising specificity
elsewhere.

### C6. Height budget

| Element | Height + margin |
|---|---|
| title | ~57 + 20 |
| eyebrow | ~32 + 22 |
| art | 320 + 24 |
| amount row | ~76 + 14 |
| items (2 lines + rule) | ~84 |
| **total** | **~649 of ~810** |

~161px of slack, distributed by `justify-content: center`. Comfortable. **These
are estimates — measure the rendered box** (§9 records that Screen 2's 104px
overflow was invisible in screenshots). If it overflows, reduce
`.offers-slide-art` height before touching any type size.

---

## 8. The image prompt

Generate at roughly square aspect. Four items, arranged 2×2.

```
Top-down product photograph of four small white ceramic ramekins arranged in a
neat 2x2 grid, evenly spaced, shot from directly overhead. Top-left: bright green
guacamole, coarsely mashed with visible avocado texture. Top-right: cubes of firm
white paneer, neatly stacked. Bottom-left: deep magenta-pink beetroot hummus with
a smooth swirled surface and a drizzle of olive oil. Bottom-right: crumbled white
feta cheese, irregular crumbles. Soft even studio lighting from the upper left,
gentle contact shadows beneath each ramekin. Sharp focus throughout, high detail
on the food texture. Commercial food photography, isolated on a pure white
seamless background, square composition, the four ramekins filling 85% of the
frame.
```

Append if the generator supports transparency directly:
`Transparent background, no backdrop, cut-out product shot.`

**Negative / avoid list:**

```
no branding, no labels, no packaging, no text, no logos, no hands, no cutlery,
no garnish sprigs, no dark background, no gradient background, no wooden board,
no table surface, no lifestyle scene, no overlapping bowls, no tilted or
three-quarter angle
```

**Why these constraints:**

- **Top-down, not 3/4** — a 2×2 grid only reads as a grid from overhead; at an
  angle the back row is occluded.
- **All four subjects are pale** (green, white, pink, white) so they hold up on
  the `#163019` ground. This is the same constraint that ruled out a chocolate
  scoop on Screen 3.
- **Paneer and feta are both white** — the prompt distinguishes them explicitly
  (firm cubes vs irregular crumbles) or they read as the same ingredient twice.
- **No wooden board or table** — the cut-out must be the food, not a scene;
  anything under the ramekins survives background removal as a grey slab.

If the generator produces a white background rather than transparency, remove it
before §5 A3, same manual path §6 covers.

---

## 9. Part D — Screen 1's rail *(DEFERRED — do not execute this revision)*

**Q2 resolved: leave the rail as-is for now.** Kept below fully specified so it
can be picked up as a later, separate change without re-deriving it — but it is
**not part of this revision's commits (§12)**.

**D1.** `data/config.json`:

```json
  "upsellHeading": "Make it a meal",
  "upsell": [
    "Add coffee to your meal | +₹200",
    "Add a functional smoothie to your meal | +₹250"
  ],
```

Wording copied verbatim from `data/screen2-config.json`'s `combos` block and
Screen 3's rail, so the same offer reads identically on all three boards. A bowl
*is* the meal here, so this reads more naturally on Screen 1 than anywhere else.

**D2.** Nothing else. `renderPipeUpsell()` already handles this shape, and Part
B2 already moved the heading into config.

---

## 10. Verification

**10a.** `node check-consistency.mjs` — expect clean. The new `.offers-slide-*`
classes are not canonical elements (§12), so it should stay silent about them.

**10b.** Serve and open at exactly 1920×1080:
```bash
npx serve . --listen 3100 --no-port-switching
```
Check the page `<title>` after navigating — `serve` silently falls back to
another port if 3100 is taken.

**10c. Versioning.** Every local asset request must carry `?v=3`:
```js
performance.getEntriesByType('resource').map(e=>e.name)
  .filter(n=>/\.(js|css)(\?|$)/.test(n) && !n.includes('fonts.g'))
```
Check all three boards — a bare `core.js` means a tag was missed.

**10d. Sequence.** With 7 featured bowls:
```js
document.querySelectorAll('.hero-slide').length        // 9
document.querySelectorAll('.offers-slide').length      // 2
document.querySelectorAll('.hero-dot').length          // 9
slideDurations                                          // [10000 x3, 15000, 10000 x4, 15000]
```
The two `15000` entries must sit at indices 3 and 8.

**10e. Slide layout.** Force the first offers slide:
```js
goToSlide(3)
```
then measure:

| Check | Expected |
|---|---|
| `.offers-slide` box | 525px wide, top 0, same height as a bowl slide |
| Overflow | slide `scrollHeight <= clientHeight` |
| `.offers-slide-art` height | 320px |
| Image | loads; `.offers-slide-art` has **no** `.photo-error` |
| `.offers-slide-amount` colour | `rgb(254, 250, 103)` |
| `.offers-slide-eyebrow` colour | `rgb(255, 255, 255)` |
| Title font-size | `52px` |
| Montserrat 700 | actually loaded, not synthesised |

**10f. Timing.** Confirm a bowl slide holds ~10s and an offers slide ~15s. Then
leave the board open **12+ minutes** (two `render()` refreshes) and confirm the
rhythm has not sped up — that is the timer-stacking check, and this plan changes
the timer mechanism, so it matters more here than usual.

**10g. Fail-closed.** Call `render()` with `offersSlide` deleted from the config
and confirm the rotation falls back to 7 bowl slides, 7 dots, no offers slide,
no error.

**10h.** Screens 2 and 3 unchanged — Part C4b may touch `beverages.html`, and
the version bump touches all three HTML files.

**10i. Chrome 69 audit.** New code uses `Math.floor`, `Array.forEach`,
`Array.map`, `setTimeout`, template literals, and CSS `justify-content` /
`letter-spacing` / `border-top`. Confirm no `?.`, `??`, `Object.fromEntries`,
CSS `inset`, or flex `gap` in the diff.

---

## 11. Documentation to update in the same commit

- **`CLAUDE.md`** — the `bowls.html/css/js` file-map row (the hero now carries an
  offers slide twice per rotation); the `data/config.json` row (`offersSlide`,
  `upsellHeading`) — **note explicitly that `offersSlide.items` intentionally
  stays two lines matching `upsell`, even though `extras-grid.png` shows four
  ingredients** (paneer illustrates the protein add-on, the other three
  illustrate the premiums add-on) — this is not a stale copy that needs a third
  line adding; the `images/nobg/` row (now also holds `extras-grid.png`, feature
  art rather than a bowl cut-out).
- **`DESIGN-PRINCIPLES.md` §3** — the hero panel section says the hero "sells one
  item at a time" and is "not a summary of the grid". That is still true of the
  bowl slides, but the rotation now also carries a non-item slide. Add a short
  paragraph recording the exception and why it is safe here specifically: every
  featured bowl also appears in the grid, so hero time costs no menu visibility.
- **`DESIGN-PRINCIPLES.md` §6** — record `extras-grid.png` as a third instance of
  the solo-feature-art exemption, alongside `protein-scoop` and `panini-hero`.
- **`DESIGN-PRINCIPLES.md` §7** — note that Screen 1's offers slide uses gold for
  the add-on price, the same established use as Screen 3's panel, not a new one.
- **`DESIGN-PRINCIPLES.md` §12** — extend the non-canonical note to cover
  `.offers-slide-*`.

---

## 12. Commits

1. **`Screen 1: offers slide in the hero rotation`** — `bowls.js`, `bowls.css`,
   `bowls.html`, `data/config.json`, `images/nobg/extras-grid.png`, plus the
   docs from §11.
2. **`Bump asset version to 3`** — the six `?v=` references across the three
   board HTMLs. Separate because it is the only cross-screen change here.

**Part D (§9) is not a commit in this revision** — deferred per Q2.

If Part C4b turns out to need a `beverages.html` font fix, fold that into commit
1 and say so in the message — it is a real bug fix, not scope creep.

---

## 13. After deploy

Hard-refresh the three TVs once. Their cached HTML is on `?v=2`; they need one
manual refresh to see `?v=3` at all. After that, future deploys pick up
automatically — this is the last time a manual refresh should be needed, provided
the version keeps getting bumped.
