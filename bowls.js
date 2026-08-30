/* ═══════════════════════════════════════════════════════════════
   SCREEN 1 — Power Bowls.
   Loads after core.js (scaling, CSV parsing, fetch+cache, fullscreen,
   tag abbreviations all live there).
══════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════
//  DATA SOURCE — the published Google Sheet CSV.
//  Swap for a local path (e.g. 'data/bowls-sheet.csv') to preview
//  offline, but ALWAYS restore the Sheet URL before shipping: the
//  local CSV is a snapshot, not what the boards read.
// ═══════════════════════════════════════════════════════════════
const BOWLS_SOURCE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0NTFd2KLI2oVsU_jJYP6X-nbLaq1M4Woqpb_gqMudOWUarZlIImnYpXfSrh5cblNmhcNOcUTDaTSw/pub?gid=2092061156&single=true&output=csv';
const CONFIG_URL   = 'data/config.json';  // BYOB tile + upsell (edit here directly)

const CACHE_KEY  = 'gf_bowls_v2';
const SLIDE_MS       = 10000;   // bowl slide
const OFFER_SLIDE_MS = 15000;   // offers slide — more to read than a bowl name
const REFRESH_MS = 5 * 60 * 1000;

/* Escape hatch: any bowl listed here uses its original photo (marble
   background and all) from images/<slug>-side.jpg in the hero, instead of
   the transparent cut-out. Empty because all nine cut-outs are good — but
   kept so a bad one can be sidelined instantly without a code rewrite. */
const HERO_CUTOUT_UNAVAILABLE = [];

let currentSlide = 0;
let slideTimer    = null;

/* Per-slide dwell, parallel to the rendered slide order. Bowls and the
   offers slide have different dwells, which a single setInterval can't
   express — see startSlideshow(). Replaces the old featuredCount, which
   became misleading once the rotation could be longer than the bowl
   count. */
let slideDurations = [];

function csvRowToBowl(row) {
  return {
    id:          Number(row.id),
    name:        row.name,
    description: row.description,
    price:       Number(row.price),
    kcal:        Number(row.kcal),
    protein:     Number(row.protein),
    fibre:       Number(row.fibre),
    tags:        row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    badge:       row.badge  || '',
    image:       row.image  || '',
    featured:    ['true','TRUE','1','yes','YES'].includes((row.featured || '').trim()),
    img_x:       row.img_x     !== '' && row.img_x     != null ? Number(row.img_x)     : 50,
    img_y:       row.img_y     !== '' && row.img_y     != null ? Number(row.img_y)     : 50,
    img_scale:   row.img_scale !== '' && row.img_scale != null ? Number(row.img_scale) : 1
  };
}

async function fetchBowlsData() {
  const [bowlsRes, configRes] = await Promise.all([
    fetch(cacheBust(BOWLS_SOURCE)),
    /* Cache-bust the config too, not just the Sheet. The store TVs run
       for weeks without a restart, and Chrome will happily serve this
       JSON from its disk cache long after a deploy changed it — which
       silently feeds render() a stale config. */
    fetch(cacheBust(CONFIG_URL))
  ]);
  if (!bowlsRes.ok || !configRes.ok) throw new Error('fetch failed');

  const config = await configRes.json();
  let bowls;

  if (BOWLS_SOURCE.endsWith('.json')) {
    // Phase 1 — local JSON
    const json = await bowlsRes.json();
    bowls = json.bowls;
  } else {
    // Phase 2 — Google Sheet CSV
    const csv = await bowlsRes.text();
    bowls = parseCSV(csv).map(csvRowToBowl);
  }

  return {
    bowls,
    buildYourOwn: config.buildYourOwn,
    upsellHeading: config.upsellHeading,
    upsell:        config.upsell,
    offersSlide:   config.offersSlide
  };
}

/* ── Image path helpers ──────────────────────────────────────────
   bowl.image is a slug (e.g. "mediterranean-bliss"), not a filename.
   build-bowl-cutouts.mjs produces two transparent cut-outs per item:
     images/nobg/<slug>-top.png   flat overhead, for the grid tile
     images/nobg/<slug>-side.png  3/4 angle,    for the hero
   images/<slug>-side.jpg is the un-cut original, used only by the
   HERO_CUTOUT_UNAVAILABLE fallback above.                          */
function tileImageSrc(bowl) {
  return `images/nobg/${bowl.image}-top.png`;
}
function heroImageSrc(bowl) {
  return HERO_CUTOUT_UNAVAILABLE.includes(bowl.image)
    ? `images/${bowl.image}-side.jpg`
    : `images/nobg/${bowl.image}-side.png`;
}

/* ── Build hero slide HTML ───────────────────────────────────── */
function heroSlideHTML(bowl) {
  const hasBg = HERO_CUTOUT_UNAVAILABLE.includes(bowl.image);

  return `
    <div class="hero-slide">
      <div class="hero-name">${bowl.name}</div>
      <div class="hero-desc">${bowl.description}</div>
      <div class="hero-macros">
        <div class="macro-chip">
          <span class="macro-value">${bowl.kcal}</span>
          <span class="macro-label">kcal</span>
        </div>
        <div class="macro-chip">
          <span class="macro-value">${bowl.protein}g</span>
          <span class="macro-label">protein</span>
        </div>
        <div class="macro-chip">
          <span class="macro-value">${bowl.fibre}g</span>
          <span class="macro-label">fibre</span>
        </div>
      </div>
      <div class="hero-photo-wrap${hasBg ? ' has-bg' : ''}">
        <img src="${heroImageSrc(bowl)}" alt="${bowl.name}"
             onerror="this.closest('.hero-photo-wrap').classList.add('photo-error');this.remove()">
      </div>
    </div>`;
}

/* ── Offers slide ────────────────────────────────────────────────
   A peer of the bowl slides, in the same rotation — not an overlay
   panel like Screen 3's, because Screen 1's hero already rotates on
   its own timer and a second independent overlay would fade in
   mid-slide-transition. Content comes from config.offersSlide, not
   the Sheet (same split as Screen 3's panel). See
   SCREEN1-OFFERS-SLIDE-PLAN.md S1. */
function offersSlideHTML(cfg) {
  return `
    <div class="hero-slide offers-slide">
      <div class="offers-slide-title">${cfg.title}</div>
      <div class="offers-slide-eyebrow">${cfg.eyebrow}</div>
      ${cfg.scope ? `<div class="offers-slide-scope">${cfg.scope}</div>` : ''}
      <div class="offers-slide-art">
        ${cfg.image ? `<img src="images/nobg/${cfg.image}.png" alt="${cfg.eyebrow}"
             onerror="this.closest('.offers-slide-art').classList.add('photo-error');this.remove()">` : ''}
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

/* ── Build bowl grid tile HTML ───────────────────────────────── */
function tileHTML(bowl) {
  const hasBadge = bowl.badge && bowl.badge.trim();
  let badgeClass = '';
  /* CSS class name kept as "badge-spotlight" even though the menu's badge
     text is now "Chef's Special" — only the data string changed, not the
     colour it maps to. Don't "fix" this mismatch. */
  if (bowl.badge === "Chef's Special") badgeClass = 'badge-spotlight';
  if (bowl.badge === 'Most Loved')     badgeClass = 'badge-loved';

  const tags = tagsHTML(bowl.tags);

  return `
    <div class="bowl-tile">
      ${hasBadge ? `<div class="tile-badge ${badgeClass}">${bowl.badge}</div>` : ''}
      <div class="tile-photo-wrap">
        <img src="${tileImageSrc(bowl)}" alt="${bowl.name}"
             style="transform: translate(${bowl.img_x - 50}%, ${bowl.img_y - 50}%) scale(${bowl.img_scale})"
             onerror="this.closest('.tile-photo-wrap').classList.add('photo-error');this.remove()">
      </div>
      <div class="tile-body">
        <div class="tile-name-row">
          <span class="tile-name">${bowl.name}</span>
          ${tags ? `<div class="tile-tags">${tags}</div>` : ''}
        </div>
        <div class="tile-desc">${bowl.description}</div>
        <div class="tile-macros">
          <span class="tile-macro">${bowl.kcal} kcal</span>
          <span class="tile-macro">${bowl.protein}g protein</span>
          <span class="tile-macro">${bowl.fibre}g fibre</span>
        </div>
      </div>
      <div class="tile-price"><span class="tile-rupee">₹</span>${bowl.price}</div>
    </div>`;
}

/* ── Build BYOB tile HTML ────────────────────────────────────── */
function byobTileHTML(byob) {
  return `
    <div class="bowl-tile byob-tile">
      <div class="byob-icon">+</div>
      <div class="tile-body">
        <div class="tile-name-row">
          <span class="tile-name">${byob.name}</span>
        </div>
        <div class="tile-desc">${byob.description}</div>
      </div>
      <div class="tile-price"><span class="tile-rupee">₹</span>${byob.price}</div>
    </div>`;
}

/* ── Slideshow controls ──────────────────────────────────────── */
function goToSlide(index) {
  document.querySelectorAll('.hero-slide').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.hero-dot').forEach(el  => el.classList.remove('active'));
  const slide = document.querySelectorAll('.hero-slide')[index];
  if (slide) slide.classList.add('active');
  const dot = document.querySelectorAll('.hero-dot')[index];
  if (dot) dot.classList.add('active');
  currentSlide = index;
}

/* Recursive setTimeout rather than setInterval: bowls dwell 10s and the
   offers slide 15s, which one interval can't express. Clearing the
   pending timer here before re-queuing is what stops a second rotation
   stacking on the first when render() runs again every REFRESH_MS —
   the same discipline Screen 3's offers rotation uses. */
function startSlideshow() {
  if (slideTimer) clearTimeout(slideTimer);
  if (!slideDurations.length) return;   // no featured bowls -> nothing to rotate
  queueNextSlide();
}

function queueNextSlide() {
  const dwell = slideDurations[currentSlide] || SLIDE_MS;
  slideTimer = setTimeout(() => {
    goToSlide((currentSlide + 1) % slideDurations.length);
    queueNextSlide();
  }, dwell);
}

/* ── Full render ─────────────────────────────────────────────── */
function render(data) {
  const featured = data.bowls.filter(b => b.featured);

  /* Interleave the offers slide after the midpoint bowl and after the
     last one. With 7 featured bowls that is "after the 3rd" and "after
     the 7th" exactly; written as a rule so it still behaves if the
     owner toggles `featured` in the Sheet. floor(n/2) can only equal n
     when n is 0, so the two positions never collide.
     See SCREEN1-OFFERS-SLIDE-PLAN.md S2/S3. */
  const mid = Math.floor(featured.length / 2);
  const slidesHTML = [];
  const durations  = [];

  featured.forEach((bowl, i) => {
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
    slidesHTML.map((_, i) =>
      `<div class="hero-dot${i === 0 ? ' active' : ''}"></div>`
    ).join('');

  goToSlide(0);
  startSlideshow();

  document.getElementById('bowlGrid').innerHTML =
    data.bowls.map(tileHTML).join('') + byobTileHTML(data.buildYourOwn);

  renderPipeUpsell(data.upsell, data.upsellHeading);
}

/* ── Boot ────────────────────────────────────────────────────── */
async function init() {
  scaleScreen();
  watchViewport();
  initFullscreenTrigger();

  try {
    const data = await loadData(fetchBowlsData, CACHE_KEY);
    render(data);
  } catch (err) {
    console.error('Green Feast: could not load menu data', err);
  }

  setInterval(async () => {
    try { render(await loadData(fetchBowlsData, CACHE_KEY)); }
    catch { /* keep showing cached version */ }
  }, REFRESH_MS);
}

init();
