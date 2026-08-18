/* ═══════════════════════════════════════════════════════════════
   SCREEN 3 — Beverages (Functional Smoothies + Coffee Menu).
   Loads after core.js (scaling, CSV parsing, fetch+cache, fullscreen,
   tag abbreviations all live there — though this board doesn't use
   dietary tags; see csvRowToItem below).
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
    sugar:       row.sugar ? Number(row.sugar) : null,
    badge:       row.badge || '',
    image:       row.image || ''
  };
}

async function fetchBeveragesData() {
  const [itemsRes, configRes] = await Promise.all([
    fetch(cacheBust(BEVERAGES_SOURCE)),
    fetch(CONFIG_URL)
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
  if (badge === "Chef's Spotlight") return 'badge-spotlight';
  if (badge === 'Most Loved')       return 'badge-loved';
  return '';
}

/* ── Smoothie card ───────────────────────────────────────────── */
function smoothieCardHTML(item) {
  const hasBadge = item.badge && item.badge.trim();

  return `
    <div class="smoothie-card">
      ${hasBadge ? `<div class="tile-badge ${badgeClassFor(item.badge)}">${item.badge}</div>` : ''}
      <div class="smoothie-photo">
        <img src="${screen3ImageSrc(item.image)}" alt="${item.name}"
             onerror="this.closest('.smoothie-photo').classList.add('photo-error');this.remove()">
      </div>
      <div class="smoothie-name-row">
        <span class="smoothie-name">${item.name}</span>
        ${item.benefit ? `<span class="benefit-chip b-${item.benefit.toLowerCase()}">${item.benefit}</span>` : ''}
        <span class="smoothie-price"><span class="tile-rupee">₹</span>${item.price}</span>
      </div>
      <div class="smoothie-desc">${highlightPower(item.description)}</div>
      <div class="tile-macros">
        <span class="tile-macro">${item.kcal} kcal</span>
        <span class="tile-macro">${item.protein}g protein</span>
        <span class="tile-macro">${item.sugar}g sugar</span>
      </div>
    </div>`;
}

/* ── Coffee card ──────────────────────────────────────────────── */
function coffeeCardHTML(item) {
  const hasBadge = item.badge && item.badge.trim();

  return `
    <div class="coffee-card">
      ${hasBadge ? `<div class="tile-badge ${badgeClassFor(item.badge)}">${item.badge}</div>` : ''}
      <div class="coffee-name-row">
        <span class="coffee-name">${item.name}</span>
        <span class="coffee-price"><span class="tile-rupee">₹</span>${item.price}</span>
      </div>
      <div class="coffee-desc">${item.description}</div>
      <div class="coffee-photo">
        <img src="${screen3ImageSrc(item.image)}" alt="${item.name}"
             onerror="this.closest('.coffee-photo').classList.add('photo-error');this.remove()">
      </div>
      <div class="tile-macros">
        <span class="tile-macro">${item.kcal} kcal</span>
        <span class="tile-macro">${item.protein}g protein</span>
        <span class="tile-macro">${item.sugar}g sugar</span>
      </div>
    </div>`;
}

/* ── Upsell rail — Screen 3's own shape: one gold protein add-on,
   not the pipe-delimited combo list Screens 1-2 use. ─────────────── */
function renderUpsell(upsell) {
  document.getElementById('upsellRail').innerHTML =
    `<div class="upsell-heading">${upsell.heading}</div>
     <div class="upsell-gold">
       <span class="gold-text">${upsell.gold.text}</span>
       <span class="gold-price">${upsell.gold.price}</span>
     </div>`;
}

/* ── Full render ─────────────────────────────────────────────── */
function render(data) {
  const items  = data.items;
  const config = data.config;

  const smoothies = items.filter(i => i.section === 'smoothie');
  const coffees   = items.filter(i => i.section === 'coffee');

  document.getElementById('boardTitle').textContent = config.board.title;

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

  document.getElementById('footerNote').textContent = config.footerNote;

  renderUpsell(config.upsell);
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
