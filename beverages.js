/* ═══════════════════════════════════════════════════════════════
   SCREEN 3 — Beverages (Functional Smoothies + Coffee Menu).
   Loads after core.js (scaling, CSV parsing, fetch+cache, fullscreen,
   tag abbreviations all live there). Smoothies can carry Diet Tags
   (currently just Contains Nuts) — rendered via the same tagsHTML()
   helper Screens 1-2 use, since this board now shares their footer
   glossary. See smoothieCardHTML below.

   The coffee column also carries a second mode: an offers panel that
   fades in over it on a timer, showing the smoothie add-ons at poster
   size. See renderOffersPanel/startOfferRotation below and
   SCREEN3-OFFERS-PANEL-PLAN.md for why.
══════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════
//  DATA SOURCE — the published Google Sheet CSV (own tab/gid, same
//  doc as BOWLS_SOURCE / WRAPS_SOURCE, per DESIGN-PRINCIPLES §8).
//  Swap for a local path (e.g. 'data/screen3-sheet.csv') to preview
//  offline, but ALWAYS restore the Sheet URL before shipping.
// ═══════════════════════════════════════════════════════════════
const BEVERAGES_SOURCE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0NTFd2KLI2oVsU_jJYP6X-nbLaq1M4Woqpb_gqMudOWUarZlIImnYpXfSrh5cblNmhcNOcUTDaTSw/pub?gid=219459611&single=true&output=csv';
const CONFIG_URL       = 'data/screen3-config.json';

const CACHE_KEY  = 'gf_beverages_v1';
const REFRESH_MS = 5 * 60 * 1000;

/* Offers panel dwell. Asymmetric on purpose (see the plan's J5), which
   is why the rotation is a recursive setTimeout and not a setInterval. */
const OFFER_COFFEE_MS = 30000;
const OFFER_PANEL_MS  = 15000;

let offerTimer   = null;
let offerShowing = false;

function csvRowToItem(row) {
  return {
    id:          Number(row.id),
    section:     row.section,
    name:        row.name,
    description: row.description,
    benefit:     row.benefit || '',
    price:       Number(row.price),
    kcal:        row.kcal ? Number(row.kcal) : null,
    protein:     row.protein ? Number(row.protein) : null,
    fibre:       row.fibre ? Number(row.fibre) : null,
    tags:        row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    badge:       row.badge || '',
    image:       row.image || ''
  };
}

async function fetchBeveragesData() {
  const [itemsRes, configRes] = await Promise.all([
    fetch(cacheBust(BEVERAGES_SOURCE)),
    /* Cache-bust the config too, not just the Sheet. The store TVs run
       for weeks without a restart, and Chrome will happily serve this
       JSON from its disk cache long after a deploy changed it — which
       silently feeds render() a stale config. That is exactly how the
       offers panel first shipped as an empty dark rectangle: the new
       JS/CSS loaded, the old config.json did not, so offersPanel was
       undefined and the panel rotated in with nothing inside it. */
    fetch(cacheBust(CONFIG_URL))
  ]);
  if (!itemsRes.ok || !configRes.ok) throw new Error('fetch failed');

  const config = await configRes.json();
  const csv    = await itemsRes.text();
  const items  = parseCSV(csv).map(csvRowToItem);

  return { items, config };
}

function screen3ImageSrc(slug) {
  return `images/screen3/${slug}.png`;
}

/* Functional ingredients get highlighted wherever they appear in a description.
   Longest-first so "blue spirulina" is matched before any shorter overlap. The
   owner keeps typing plain text in the Sheet — same division of labour as
   TAG_ABBREV in core.js. */
const POWER_INGREDIENTS = ['blue spirulina', 'ashwagandha', 'shatavari', 'brahmi'];

function highlightPower(text) {
  let out = text;
  POWER_INGREDIENTS.forEach(function (ing) {
    out = out.replace(new RegExp('(' + ing + ')', 'gi'), '<span class="power">$1</span>');
  });
  return out;
}

function badgeClassFor(badge) {
  /* CSS class kept as "badge-spotlight" — only the menu's badge text
     changed to "Chef's Special", not the colour it maps to. */
  if (badge === "Chef's Special") return 'badge-spotlight';
  if (badge === 'Most Loved')     return 'badge-loved';
  return '';
}

/* Benefit Chip colour is keyed to the DRINK, not the benefit category —
   so it matches what's actually in the cup (Purple Pulse is purple
   because it's blueberry, not because "Focus" has a colour). This also
   means renaming a benefit in the Sheet (as happened when Avo Clarity's
   benefit was renamed Women Wellness -> Gut Health) never needs a code
   change: the chip's colour and its text come from two independent
   sources. See beverages.css for the map. */
function benefitAccentClass(image) {
  return 'acc-' + image;
}

/* ── Smoothie card ───────────────────────────────────────────── */
function smoothieCardHTML(item) {
  const hasBadge = item.badge && item.badge.trim();
  const hasMeta  = item.benefit || item.tags.length;

  return `
    <div class="smoothie-card">
      ${hasBadge ? `<div class="tile-badge ${badgeClassFor(item.badge)}">${item.badge}</div>` : ''}
      <div class="smoothie-photo">
        <img src="${screen3ImageSrc(item.image)}" alt="${item.name}"
             onerror="this.closest('.smoothie-photo').classList.add('photo-error');this.remove()">
      </div>
      <div class="smoothie-name-row">
        <span class="smoothie-name">${item.name}</span>
        <span class="smoothie-price"><span class="tile-rupee">₹</span>${item.price}</span>
      </div>
      ${hasMeta ? `
      <div class="smoothie-meta-row">
        ${item.benefit ? `<span class="benefit-chip ${benefitAccentClass(item.image)}">${item.benefit}</span>` : ''}
        ${tagsHTML(item.tags)}
      </div>` : ''}
      <div class="smoothie-desc">${highlightPower(item.description)}</div>
      <div class="tile-macros">
        <span class="tile-macro">${item.kcal} kcal</span>
        <span class="tile-macro">${item.protein}g protein</span>
        <span class="tile-macro">${item.fibre}g fibre</span>
      </div>
    </div>`;
}

/* ── Coffee card ──────────────────────────────────────────────── */
function coffeeCardHTML(item) {
  const hasBadge = item.badge && item.badge.trim();

  return `
    <div class="coffee-card">
      ${hasBadge ? `<div class="tile-badge ${badgeClassFor(item.badge)}">${item.badge}</div>` : ''}
      <div class="coffee-photo">
        <img src="${screen3ImageSrc(item.image)}" alt="${item.name}"
             onerror="this.closest('.coffee-photo').classList.add('photo-error');this.remove()">
      </div>
      <div class="coffee-name-row">
        <span class="coffee-name">${item.name}</span>
        <span class="coffee-price"><span class="tile-rupee">₹</span>${item.price}</span>
      </div>
      <div class="coffee-desc">${item.description}</div>
      <div class="tile-macros">
        <span class="tile-macro">${item.kcal} kcal</span>
        ${item.protein != null ? `<span class="tile-macro">${item.protein}g protein</span>` : ''}
        ${item.fibre   != null ? `<span class="tile-macro">${item.fibre}g fibre</span>` : ''}
      </div>
    </div>`;
}

/* ── Offers panel ────────────────────────────────────────────────
   The coffee column's second mode. Content comes from
   config.offersPanel (data/screen3-config.json), not the Sheet —
   same split as Screen 2's panini panel. */
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

/* ── Full render ─────────────────────────────────────────────── */
function render(data) {
  const items  = data.items;
  const config = data.config;

  const smoothies = items.filter(i => i.section === 'smoothie');
  const coffees   = items.filter(i => i.section === 'coffee');

  document.getElementById('smoothieHeading').textContent = config.sections.smoothie.heading;
  const smoothieNoteEl = document.getElementById('smoothieNote');
  if (config.sections.smoothie.note) {
    smoothieNoteEl.textContent = config.sections.smoothie.note;
    smoothieNoteEl.style.display = '';
  } else {
    smoothieNoteEl.style.display = 'none';
  }
  document.getElementById('smoothieRow').innerHTML = smoothies.map(smoothieCardHTML).join('');

  document.getElementById('coffeeHeading').textContent = config.sections.coffee.heading;
  document.getElementById('coffeeRow').innerHTML = coffees.map(coffeeCardHTML).join('');

  renderPipeUpsell(config.upsell, config.upsellHeading);

  /* Only rotate the panel in if there is actually content for it.
     Without this guard a missing or stale config parks an empty dark
     rectangle over the coffee menu for 15s of every 45s — strictly
     worse than simply leaving the coffee grid up. Failing closed keeps
     a bad config looking like "no panel" rather than "broken board". */
  if (config.offersPanel) {
    renderOffersPanel(config.offersPanel);
    startOfferRotation();
  } else {
    if (offerTimer) clearTimeout(offerTimer);
    setOfferPhase(false);
  }
}

/* ── Boot ────────────────────────────────────────────────────── */
async function init() {
  scaleScreen();
  watchViewport();
  initFullscreenTrigger();

  try {
    const data = await loadData(fetchBeveragesData, CACHE_KEY);
    render(data);
  } catch (err) {
    console.error('Green Feast: could not load menu data', err);
  }

  setInterval(async () => {
    try { render(await loadData(fetchBeveragesData, CACHE_KEY)); }
    catch { /* keep showing cached version */ }
  }, REFRESH_MS);
}

init();
