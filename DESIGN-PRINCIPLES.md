# Green Feast — Menu Board Design Principles

Derived from building Screen 1 (Power Bowls). **Apply these to Screens 2–4**
(Wraps & Paninis, Beverages, Salads & Toasts) even where the content shape
differs. Where a principle came from a mistake, the mistake is recorded — those
are the ones worth not repeating.

---

## 0. The one rule everything else serves

> **The board must be readable from the customer queue, on a 40" screen, several
> metres away — not on a laptop at arm's length.**

Every decision below is downstream of this. When a choice is unclear, ask "does
this survive being viewed from across the room?" A design that looks elegant on
a monitor and illegible on the wall has failed, however good the screenshot.

---

## 1. What actually buys legibility

This is the most important lesson from Screen 1, and it is counter-intuitive.

The first instinct is "make the text bigger." That is the **weakest** lever.
When Screen 1 was rebuilt for legibility, the measured gains came in this order:

| Rank | Lever | Screen 1 example | Impact |
|---|---|---|---|
| 1 | **Space** — cut repeated content to free room | hero 720px → 525px handed 195px to the grid | killed all text truncation |
| 2 | **Contrast** | white/gold on dark green, vs forest-on-cream | large perceived jump |
| 3 | **Photo size** | tile photo 96px → 123px | +28% |
| 4 | **Type size** | tile description 12px → 16px | +33% |

Note the type increases were modest — the bowl name only went 19px → 22px. The
screen reads dramatically better anyway, because space and contrast did the work.

**Practical rule:** before enlarging type, look for information that repeats and
delete it. On Screen 1, every bowl was ₹349 and every macro row was near
identical — that repetition was consuming pixels and communicating nothing.

**Corollary:** do not inflate headline sizes chasing "bigger." Oversized titles
eat the space that descriptions need, and descriptions are what customers
actually read to choose.

---

## 2. Layout skeleton

Reuse this structure for every screen. It is proven and the code already
supports it.

```
┌────────────────┬──────────────────────────────────┐
│                │  SCREEN TITLE                    │
│  HERO PANEL    │  ┌──────────┐  ┌──────────┐      │
│  525px, dark   │  │ tile     │  │ tile     │      │  GRID
│                │  └──────────┘  └──────────┘      │  1395px, cream
│  rotating      │       … 2 cols × 5 rows …        │
│  featured item │  ┌──────────┐  ┌──────────┐      │
│                │  │ tile     │  │ BYOB/CTA │      │
├────────────────┴──────────────────────────────────┤
│  UPSELL RAIL — "make it a meal"                   │
├───────────────────────────────────────────────────┤
│  FOOTER — tag glossary            ·   GREEN FEAST │
└───────────────────────────────────────────────────┘
```

- **Fixed 1920×1080 canvas**, scaled to fit any display via CSS `transform`.
  Never write responsive breakpoints — design once at 1920×1080.
- **Grid is 2 columns × 5 rows = 10 slots.** Nine products + one
  Build-Your-Own / call-to-action tile in the last slot.
- If a screen has fewer than 9 products, keep the 5-row grid and let rows
  breathe rather than switching to a different column count. Consistency across
  the four screens matters more than perfectly packing each one.

**What's fixed vs what's free, per screen.** Screen 2 (Wraps, Paninis & Open
Toasts) departs from this skeleton on purpose: no slideshow (the left panel is
a static feature block), and the right side stacks category blocks (Open
Toasts, then Wraps) instead of the 2×5 grid — because the menu itself isn't
nine interchangeable items, it's three different categories with different
shapes. That's a legitimate reason to deviate; "it looked nicer" is not.

What must **not** move, regardless of a screen's internal layout:
- **Every board carries a dark anchor.** Screens 1–2 do this with a 525px dark
  (`--hero-bg`) left panel, so the dark/cream seam lands in the same place on every
  board hanging on the wall. Screen 3 (Beverages) is the first to depart from that
  shape — see below for why, and for the approved alternative.
- The **upsell rail and footer strip** are pixel-identical everywhere — same
  height, same colours, same shared classes. They now live in `core.css`
  precisely so this can't drift screen to screen. **What each board puts inside
  them may differ.** Screen 3's footer carries `.footer-note` ("Macros shown are
  average per serving") instead of the V/GF/LC/LS glossary, because no card on
  that board uses those tags — the 42px dark bar and the wordmark stay fixed,
  only the content in between changes. Likewise Screen 3's upsell rail holds one
  centred gold item instead of Screens 1–2's pipe-delimited combo list, because a
  single item left-aligned in the full-width rail left most of it visibly empty.
- **Colour tokens, fonts, and the tag/macro/badge pill styling** (`core.css`)
  are shared. A screen may need a variant (e.g. Screen 2's panini-panel tags
  recolour `.tile-tag` gold instead of forest-on-cream, because the base pill
  was designed for cream tiles and is nearly invisible on the dark panel) —
  that's an intentional override in the screen's own CSS, not a fork of the
  shared rule.

What's free to change per screen: the grid vs. category-block choice, whether
there's a slideshow, how many photos appear and where. Match the *intent* of
whatever mockup you're given (hierarchy, what's given a big photo vs. a small
one, where prices sit) — see §10 on mockup drift, which applies doubly here
since a new screen's mockup is rarely built at the true 1920×1080 canvas
proportions.

**Screen 3's dark anchor is a horizontal band, not a vertical panel.** Screens 1–2
each hero one item (or a small signature range) worth a dedicated dark panel and a
big photo. A beverage board doesn't have that — nine roughly-equal items across two
categories, no single item worth the space, and the owner's mockup and brief both
call for no slideshow and no left panel. Screen 3 instead opens with a **96px
full-width dark header band** (`.board-header`, `--hero-bg`) carrying just the
board title, with the smoothie and coffee rows stacked in a cream `.main-content`
below it. The dark/cream contrast the panel exists to provide is still there — it's
just a horizontal seam near the top of the board instead of a vertical one on the
left. Read "every board carries a dark anchor" as the rule that survives; the
525px-left-panel shape is Screens 1–2's implementation of it, not the rule itself.

---

## 3. Hero panel

The hero sells one item at a time. It is **not** a summary of the grid.

- **Dark panel** (`--hero-bg #163019`), left-aligned text.
- **White title**, **gold description**, **gold outlined macro chips**.
- **Cut-out photo**, bottom-aligned, floating free with a `drop-shadow`. No
  frame, no circle, no card.
- **No badge. No price.** Both already appear in the grid tile — repeating them
  is noise. (This was a deliberate removal on Screen 1, not an oversight.)
- **Rotate only "featured" items**, not everything. Screen 1 shows 7 of 9 in the
  hero; the two weakest photos were dropped from rotation but stay in the grid.
- **10 seconds per slide.** 7s felt hurried, 15s felt stalled.
- **Small gap between text block and photo.** Screen 1 shipped at ~9% of panel
  height. It was 34% before the fix and looked broken — a huge dead void with
  the bowl marooned at the bottom.

---

## 4. Grid tiles

- White card, generous corner radius, soft shadow.
- **Transparent cut-out photo, no circular mask.** Circular crops were tried and
  rejected — they slice the dish awkwardly and read as "hanging."
- Layout: photo (left) → name + tags → description → macro pills → price (right).
- **Description gets 2 lines and must never truncate.** If it truncates, the
  layout is wrong — take space from something else. Ellipsis on a menu board is
  a failure, not a graceful degradation.
- Name may truncate (rare, and the photo disambiguates); description may not.

---

## 5. Tags

Hard-won, after going back and forth twice:

- **Tiles show abbreviations** — `V`, `GF`, `LC`, `LS`. Full words were tried
  and failed: at tile scale they were too small to read, and they crowded the
  name.
- **The footer carries the glossary**, spelled out once:
  `V Vegan · GF Gluten Free · LC Low Calorie · LS Less Spicy`.
- **The abbreviation map lives in code, not in the Sheet.** The owner keeps
  writing readable full names ("Gluten Free"); `TAG_ABBREV` in `core.js`
  shortens them for display on every board. This keeps the Sheet human-readable
  and means adding a tag never requires the owner to learn a code.
- New tags on other screens follow the same shape: a short 1–2 letter code plus
  a glossary entry. Keep the total number of distinct tags small — a glossary
  longer than ~5 entries stops being scannable.

**Screen 3 doesn't use this system at all.** Its smoothies are sold on a
functional benefit (Focus, Clarity, Energy, Strength, Recovery), not a dietary
attribute, so the benefit gets its own `.benefit-chip` — full word, not an
abbreviation, and one colour per benefit rather than the shared pill styling —
instead of a `V`/`GF`/`LC`/`LS` tag. Because no card on Screen 3 uses those four
tags, its footer carries `.footer-note` (a macro disclaimer) instead of the
glossary; see §2 for why that's a legitimate per-board footer content swap, not
a fork of the footer's shared shape.

---

## 6. Photography

Two shots per product, both background-removed to transparent PNG:

| shot | angle | used in | normalized to |
|---|---|---|---|
| `<slug>-side.png` | 3/4 elevated | hero | 86% of canvas width, bottom-aligned |
| `<slug>-top.png` | flat overhead | grid tile | 92% of canvas width, centred |

Rules that took several attempts to get right:

1. **"Image = subject."** Trim every cut-out to its alpha bounding box. Transparent
   padding baked into a file is what makes bowls render at inconsistent sizes.
2. **Normalize to a uniform width and a common baseline.** Before this, bowl width
   ranged 69%–98% of canvas — some looked huge, some tiny, some floated higher
   than others. After: every one at 86%, all sitting on the same line.
3. **Remove the background BEFORE cropping. Never crop blind first.** Cropping a
   square out of a wide photo sliced six bowls clean through the side. Those
   pixels are then gone forever. Background-remove the whole photo, *then* derive
   the crop from where the subject actually turned out to be.
4. **Isolate the largest connected shape.** Food styling often places a garnish
   or a small side dish apart from the main item. Background removal keeps them
   (correctly — they are foreground), but they must not end up in the cut-out as
   objects floating beside the dish. Keep only the biggest blob.
5. **Expect the remover to fail on pale-on-pale.** A cream bowl on white marble
   gets confidently misclassified as background. This is not recoverable in
   post — the pixels are zeroed at source, and no alpha curve can restore a value
   that was never produced. When it happens, hand-cut that one image and run it
   through `ingest-manual-cutout.mjs`, which normalizes it identically to the
   automated ones.

**Shot list for new screens:** ask the photographer for both angles per item, each
item photographed alone with nothing else in frame, on a background that
contrasts with the product. That last point prevents rule 5 entirely.

**Screen 2's pipeline is simpler, on purpose.** Its source photos arrived
already background-removed (by the user, through an external tool), so
`build-screen2-cutouts.mjs` skips background removal and blob isolation
entirely — it only does rule 1 (trim to bbox) and, for the three Open Toasts
photos, rule 2 (shared canvas, uniform width, common centre — `toast` mode).
The panini and wrap feature photos are trimmed only (`feature` mode): each is
alone in its own layout slot with nothing to normalize against. If a future
screen's source photos still have a background baked in, use
`build-bowl-cutouts.mjs`'s full pipeline instead.

**Copying a canvas size from another shot type breaks rule 1.** The `toast`
canvas first shipped as 900×900 — copied straight from the bowl pipeline
without re-checking the assumption. A bowl *is* roughly square; a flat open
toast is not (~1.5:1). ~40% of every toast file was transparent padding above
and below the food, so at display size the photo read as noticeably smaller
than intended — the "image = subject" rule violated by the pipeline itself,
not by a bad photo. Fixed by sizing the canvas (900×630) to the actual subject
aspect ratio instead of reusing bowl's. When adding a new shot type, size its
canvas from its own subjects' aspect ratios — don't assume last screen's
numbers still apply.

**Screen 3 skips rule 2 (shared canvas) entirely — and this is not a general
licence to skip it.** `build-screen3-cutouts.mjs` does rule 1 (trim to alpha
bbox) and nothing else: no shared canvas, no padding, just a downscale if a
trimmed subject is taller than 600px. This only holds because all nine Screen 3
source photos are the *same physical cup*, same camera angle, same lighting —
verified by compositing all nine on `--cream` at real display height and
confirming by eye that they already read as a matched set before writing any
normalization code. Their aspect-ratio spread (0.80–0.89) is garnish height,
not a framing mismatch to correct. Padding every file out to a canvas sized for
the tallest would waste ~18% of a typical file on transparent padding, and
because the card's photo box is height-limited, that padding would shrink
every cup on screen — the exact failure this section already records for the
900×900 toast canvas. `beverages.css` normalizes by CSS height instead
(`height: 100%; width: auto` on the `<img>`). If a future screen's source
photos are *not* this uniform, go back to rule 2's shared-canvas approach —
verify uniformity on a rendered contact sheet before choosing to skip it, the
same way Screen 3 did.

---

## 7. Colour

| token | value | role |
|---|---|---|
| `--hero-bg` | `#163019` | hero panel — deliberately darker than `--forest` |
| `--gold` | `#FEFA67` | hero description, macro chips, BYOB tile |
| `--cream` | `#F5F0E8` | grid background |
| `--card` | `#FFFFFF` | tile background |
| `--forest` | `#283F28` | body text on cream, BYOB tile background |
| `--bar` / `--bar-dark` | `#223322` / `#1A2A1A` | upsell rail / footer |

**Screen 3-scoped benefit-chip palette** (`beverages.css`, not `core.css` — see §2 on
what stays shared vs. what a board owns):

| class | value | benefit |
|---|---|---|
| `.b-focus` | `#2F5C8A` | Focus |
| `.b-clarity` | `#3D7A4A` | Clarity |
| `.b-energy` | `#6B3A78` | Energy |
| `.b-strength` | `#6B4226` | Strength |
| `.b-recovery` | `#B0752A` | Recovery |

- Gold is the accent for **anything the customer should act on** — the hero's
  appetite copy and the Build-Your-Own tile. Do not use it decoratively, or it
  stops signalling.
- **Screen 3 extends gold to one new, deliberate use: highlighting adaptogens
  (`brahmi`, `shatavari`, `ashwagandha`, `blue spirulina`) inline in a smoothie's
  description via `.power`.** This is not a literal call-to-action like the
  upsell pill — it's informational. The justification: the adaptogen *is* the
  reason to buy the drink, so marking it is signalling the board's core sell,
  not decorating it. Treat this as the boundary, not a precedent to extend
  further — if a later screen starts using gold for a third purpose, gold stops
  meaning "act on this" and the rule in the first bullet above has quietly
  failed. Don't add a fourth gold use without updating this section to say why.
- Keep the dark-hero / cream-grid split. The contrast between the two halves is
  doing real legibility work, not just looking nice.

---

## 8. Data & ownership

- **The Sheet is content. The code is presentation.** Prices, names,
  descriptions, macros, tags, and which items are featured all live in the Google
  Sheet. Abbreviations, colours, sizing, and layout live in code.
- **One Sheet, one tab per screen** (each with its own `gid` in the CSV URL). The
  owner opens one file and switches tabs — they never touch four documents.
- **The owner must never need to edit code to change the menu.** If a routine
  content change would require a code edit, the design is wrong.
- Google caches published CSVs for ~5 minutes. Sheet edits appear on the boards
  within that window; a browser refresh does not bypass it.
- `data/bowls-sheet.csv` is a local snapshot/template of the Sheet, useful for
  local preview. **It is not what the live boards read** — a change there does
  nothing on the TVs until the same change is made in the Sheet.

---

## 9. Technical constraints — the store TVs run Chrome 69

The TVs are new but their WebView is from 2018. This constrains everything.
**Check any new web feature against Chrome 69 before using it.**

Banned (silently break the whole screen):

| feature | needs | use instead |
|---|---|---|
| `?.` optional chaining | Chrome 80 | explicit `if (x)` guards |
| `??` nullish coalescing | Chrome 80 | explicit null checks |
| `Object.fromEntries` | Chrome 73 | a plain loop |
| CSS `inset` | Chrome 87 | `top/right/bottom/left` |
| CSS flex `gap` | Chrome 84 | adjacent-sibling margins (`> * + *`) |

Notes:
- **Grid `gap` is fine** (Chrome 66) — pair it with `grid-gap` for extra headroom.
  Only *flex* gap is banned.
- `@supports (gap: 1px)` is **useless** as a guard here: it returns true on
  Chrome 69 because grid gap exists, while flex gap does not. Use unconditional
  margins.
- `-webkit-line-clamp` works, but ship its `-webkit-box` + `-webkit-box-orient`
  companions.
- Fullscreen needs the `webkit`-prefixed call (unprefixed landed in Chrome 71).
- **Grid items don't shrink to a stretched row without `min-height: 0` — this is
  not a Chrome 69 quirk, it happens in every browser.** A grid item's implicit
  `min-height: auto` means it won't shrink below its own content size, even
  though `align-items: stretch` (the default) is telling it to fill the row.
  Screen 2's Open Toasts cards hit this: giving `.toast-grid` `flex: 1` so it
  would absorb leftover vertical space should have stretched each `.toast-card`
  down to match, but the cards kept their full content height instead and
  overflowed 104px past the grid into the section below — invisible until
  measured (bounding-box heights, not a screenshot glance), fixed by adding
  `min-height: 0` to the grid item itself, not just the flexed child inside it.
- A JS syntax error is fatal and silent — the page renders static HTML only, with
  no visible error. If a screen shows headings but no content, suspect this first
  and open `tvtest.html`, which reports engine version and feature support in
  large text.

---

## 10. Process principles

- **Measure, don't eyeball.** Calibrate against something with a known value.
  Font sizes were derived by measuring ink height in a screenshot whose CSS was
  known, then scaling — guessing from a mockup overshot badly.
- **Judge at real display size.** A defect invisible at 123px on a wall does not
  matter. Reviewing zoomed-in produces a long list of irrelevant nitpicks and
  misses the real problems.
- **AI-generated mockups drift.** The Screen 1 mockup had tile columns of 673px
  and 625px — impossible in a real `1fr 1fr` grid. Match the *intent* of a
  mockup (proportion, hierarchy, colour), never its exact pixels.
- **Verify visually at full size before declaring done.** A broken bowl was
  called "clean" off a small thumbnail on this project. If the claim is "this
  image is correct," look at the image at a size where you could actually tell.
- **Screenshot with Playwright**, at 1920×1080, and freeze the slideshow first
  (`transition: none` + toggle `.active` directly) or the capture races the
  10-second timer.

---

## 11. Known open items

- `tropical-fruit-salad` has only one photograph (a 3/4 angle), so its tile shows
  that angle instead of a true overhead. Needs a new photo, not code.
- Cut-out PNGs are 900×900 regardless of use. Tiles display at 123px, so those
  files are ~7× oversized. Downscaling tile PNGs would cut load time on store
  wifi — worth doing if the boards ever feel slow to first paint.
- The three Open Toasts cut-outs came from a free background-removal tool and
  are capped at 612×408 source resolution — fine at the sizes they're
  displayed. If they're ever enlarged further, re-cut from a higher-resolution
  source. (The panini and wrap feature photos are both sourced from
  full-resolution originals — 1343×947 and 1346×852 respectively — so neither
  is affected by this.)
- Five of Screen 3's nine source photos (`avo-clarity`, `purple-pulse`,
  `gingerale-cold-brew`, `vietnamese-cold-brew`, `iced-latte`) are removebg
  free-tier previews with trimmed subjects only 305–333px wide. Fine at the
  ~214px they render at on the board today; **re-cut from higher-resolution
  originals before ever enlarging these past ~340px display height.** The
  other four (`blue-mind`, `cocoa-core`, `going-nuts`, `cold-brew`) are
  already high-resolution and unaffected.

---

## 12. Shared vocabulary — name things the same way on every board

Read this before making any change that touches more than one screen.

### Why this section exists

The same conceptual element is implemented under a different class name on each
board. "Item name" exists six times, as `.tile-name`, `.panini-item-name`,
`.toast-name`, `.wrap-name`, `.smoothie-name`, `.coffee-name`. So "make the item
names bigger" is not one edit — it is six edits across three files, and missing
one is the default outcome, not the unlucky one.

It already happened. Item names drifted to 22/24px, prices to 26/24px, and
descriptions to 16px everywhere except `.panini-item-desc`, which sat at 17px
with no design reason — an accident from a separate session that nobody could
spot, because a naked `17px` in a file looks exactly like a deliberate one.

Meanwhile every element that lives in `core.css` — tag pills, macro chips,
badges, the upsell rail, the footer — has **zero drift across three screens
built in three separate sessions.** The architecture works where it was applied.

### The goal is not sameness

Boards are allowed to differ. A feature panel on dark ground genuinely wants a
larger name than a grid tile. The goal is that **a deliberate difference is
distinguishable from an accidental one by reading the code.** That means every
intentional variant gets a *name*; an unnamed variation is a bug.

### Canonical names

Use these words in conversation, in commits, and in class names on any new screen.

| Canonical name | What it is | Implemented today as |
|---|---|---|
| **Category** | Food vs beverage. Conversational only — no code presence. | — |
| **Section** | A menu grouping: Power Bowls, Panini, Open Toast, Wraps, Functional Smoothies, Coffee. Slug form. | `section` column in the Sheet |
| **Section Header** | The row holding a Section Title (and, on Screen 3's smoothie row, an inline note) | `.section-header` in `core.css`. `--<slug>` modifier classes exist on the markup (`--bowls`, `--toasts`, `--wraps`, `--smoothies`, `--coffee`) for section-specific spacing — `--coffee` adds top margin — but carry no colour; the underline is uniform, see below |
| **Section Title** | The on-screen heading for a Section | `.section-title` in `core.css`. `.section-title--lg` is Power Bowls' variant, since it's the one section that fills Screen 1's entire grid panel rather than stacking with others |
| **Item Name** | The dish/drink name | `.tile-name`, `.panini-item-name`, `.toast-name`, `.wrap-name`, `.smoothie-name`, `.coffee-name` |
| **Item Desc** | The one- or two-line description under the name | `.tile-desc`, `.panini-item-desc`, `.toast-desc`, `.wrap-desc`, `.smoothie-desc`, `.coffee-desc` |
| **Item Price** | The price | `.tile-price`, `.panini-item-price`, `.toast-price`, `.wrap-price`, `.smoothie-price`, `.coffee-price` |
| **Macro Chip** | kcal / protein / fibre / sugar readouts | `.tile-macro` (small), `.macro-chip` (large, hero) |
| **Diet Tag** | V / GF / LC / LS — the abbreviated dietary pills | `tags` column, `.tile-tag`, `TAG_ABBREV` in `core.js` |
| **Item Badge** | Chef's Spotlight, Most Loved | `badge` column, `.tile-badge`, `.badge-spotlight`, `.badge-loved` |
| **Benefit Chip** | Focus / Clarity / Energy / Strength / Recovery. Screen 3 only; replaces Diet Tags there. | `benefit` column, `.benefit-chip`, `.b-focus` … |

⚠️ **Diet Tag vs Item Badge is the easy one to get backwards.** In this codebase
the *dietary* markers (V/GF/LS) are **tags** and *Chef's Spotlight* is a
**badge** — which is the opposite of how most people say it out loud. Always use
the two-word form ("diet tag", "item badge"); never the bare word "badge".

Likewise, the kcal/protein readouts are **chips**, not badges — the code has
said `chip` since Screen 1.

Section Header/Title are handled differently from the Item elements above.
Item Name/Desc/Price stayed as six separate per-screen selectors, each pointed
at a shared token — a screen genuinely needs its own selector to hang
screen-specific rules off (e.g. `.panini-item-desc`'s gold colour on a dark
panel). Section Header/Title had no such need, so they were collapsed into one
selector in `core.css`, with per-section differences expressed as modifier
classes (`.section-header--coffee`, `.section-title--lg`) rather than
duplicate rules. Since there's only one selector, there's nothing for
`check-consistency.mjs` to compare across screens — the drift this section
warns about is structurally impossible here, not just avoided by convention.

### Typography tokens

Canonical elements take their size from a token in `core.css`, never a literal:

```css
:root {
  --fs-item-name:      24px;   /* every board — flattened, no large variant */
  --fs-item-desc:      18px;   /* every board */
  --fs-item-price:     26px;   /* grid tiles, toasts, wraps, coffee */
  --fs-item-price-sm:  24px;   /* panini, smoothie */
  --c-item-desc:       #000000;  /* every board except the dark panini panel */
}
```

**A literal `px` on an Item Name, Item Desc, or Item Price is a bug unless it
carries a comment explaining why.** If a screen needs a different size, add a
named variant token (`-lg`, `-sm`) rather than a bare number. The name is the
documentation: `var(--fs-item-price-sm)` says "this is deliberately the small
variant"; `24px` says nothing at all. (Item Name had a `-lg` variant for the
panini/coffee feature panels; it was retired when those were flattened to match
the base size — a reminder that variants get removed, not just added, when a
design decision changes.)

The dark panini panel is the one place these tokens don't apply — its
description and diet tags stay gold-on-dark for contrast rather than switching
to `--c-item-desc` / dark-green outlines. That's a deliberate, permanent
exception, not an oversight — don't "fix" it into consistency.

Run `node check-consistency.mjs` before pushing — it fails on any canonical
element using a literal size.

### Fixed heights must derive from their token

`.smoothie-desc` and `.coffee-desc` carry fixed `height` values, derived from
`var(--fs-item-desc)` rather than a hardcoded number:

```css
height: calc(var(--fs-item-desc) * 1.3 * 2);   /* 2 clamped lines */
```

This is why: they used to be hand-computed literals (`42px`, `21px`) baked from
`16px × 1.3`. Raising the description token later would have clipped the text
mid-glyph instead of reflowing it, because a literal height doesn't know the
font size changed. Keep them derived — never replace with a literal again.

`calc()` and custom properties are both fine on Chrome 69 (see §9).
