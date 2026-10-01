/* ═══════════════════════════════════════════════════════════════
   SCREEN 2 — Wraps, Paninis & Open Toasts.
   Loads after core.js (scaling, CSV parsing, fetch+cache, fullscreen,
   tag abbreviations all live there).

   The right column also carries a second mode: a dessert panel that
   fades in over the toasts + combo block on a timer. See
   renderDessertPanel/startDessertRotation below and
   SCREEN2-DESSERT-PANEL-PLAN.md for why.
══════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════
//  DATA SOURCE — the published Google Sheet CSV (own tab/gid, same
//  doc as BOWLS_SOURCE in bowls.js, per DESIGN-PRINCIPLES §8).
//  Swap for a local path (e.g. 'data/wraps-sheet.csv') to preview
//  offline, but ALWAYS restore the Sheet URL before shipping.
// ═══════════════════════════════════════════════════════════════
const WRAPS_SOURCE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0NTFd2KLI2oVsU_jJYP6X-nbLaq1M4Woqpb_gqMudOWUarZlIImnYpXfSrh5cblNmhcNOcUTDaTSw/pub?gid=280369028&single=true&output=csv';
const CONFIG_URL   = 'data/screen2-config.json';

const CACHE_KEY  = 'gf_wraps_v1';
const REFRESH_MS = 5 * 60 * 1000;

/* Dessert panel dwell. Asymmetric on purpose, same as Screen 3's
   offers panel, which is why the rotation is a recursive setTimeout
   and not a setInterval. */
const DESSERT_MENU_MS  = 30000;
const DESSERT_PANEL_MS = 15000;

let dessertTimer   = null;
let dessertShowing = false;

function csvRowToItem(row) {
  return {
    id:          Number(row.id),
    section:     row.section,
    name:        row.name,
    description: row.description,
    price:       Number(row.price),
    kcal:        row.kcal ? Number(row.kcal) : null,
    protein:     row.protein ? Number(row.protein) : null,
    fibre:       row.fibre ? Number(row.fibre) : null,
    tags:        row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    badge:       row.badge || '',
    image:       row.image || ''
  };
}

async function fetchWrapsData() {
  const [itemsRes, configRes] = await Promise.all([
    fetch(cacheBust(WRAPS_SOURCE)),
    /* Cache-bust the config too, not just the Sheet. The store TVs run
       for weeks without a restart, and Chrome will happily serve this
       JSON from its disk cache long after a deploy changed it — which
       silently feeds render() a stale config. */
    fetch(cacheBust(CONFIG_URL))
  ]);
  if (!itemsRes.ok || !configRes.ok) throw new Error('fetch failed');

  const config = await configRes.json();
  const csv    = await itemsRes.text();
  const items  = parseCSV(csv).map(csvRowToItem);

  return { items, config };
}

function screen2ImageSrc(slug) {
  return `images/screen2/${slug}.png`;
}

/* ── Panini panel (left, static — no slideshow) ─────────────────── */
function paniniHeaderHTML(panel) {
  return `
    <div class="panini-eyebrow">${panel.eyebrow}</div>
    <div class="panini-title">${panel.title}</div>`;
}

function badgeClassFor(badge) {
  /* CSS class kept as "badge-spotlight" — only the menu's badge text
     changed to "Chef's Special", not the colour it maps to. */
  if (badge === "Chef's Special") return 'badge-spotlight';
  if (badge === 'Most Loved')     return 'badge-loved';
  return '';
}

function paniniItemHTML(item) {
  const tags = tagsHTML(item.tags);
  const hasBadge = item.badge && item.badge.trim();
  return `
    <div class="panini-item">
      <div class="panini-item-row">
        <span class="panini-item-name">${item.name}${hasBadge
          ? `<span class="panini-item-badge ${badgeClassFor(item.badge)}">${item.badge}</span>`
          : ''}</span>
        ${tags ? `<div class="tile-tags">${tags}</div>` : ''}
        <span class="panini-item-price"><span class="tile-rupee">₹</span>${item.price}</span>
      </div>
      <div class="panini-item-desc">${item.description}</div>
    </div>`;
}

function paniniStatHTML(stat) {
  return `
    <div class="stat-chip">
      <span class="stat-value">${stat.value}</span>
      <span class="stat-label">${stat.label}</span>
    </div>`;
}

/* ── Open Toasts (right, top block) ──────────────────────────── */
function toastCardHTML(item) {
  const hasBadge = item.badge && item.badge.trim();
  const tags = tagsHTML(item.tags);

  return `
    <div class="toast-card">
      ${hasBadge ? `<div class="tile-badge">${item.badge}</div>` : ''}
      <div class="toast-photo-wrap">
        <img src="${screen2ImageSrc(item.image)}" alt="${item.name}"
             onerror="this.closest('.toast-photo-wrap').classList.add('photo-error');this.remove()">
      </div>
      <div class="toast-name-row">
        <span class="toast-name">${item.name}</span>
        ${tags ? `<div class="tile-tags">${tags}</div>` : ''}
      </div>
      <div class="toast-desc">${item.description}</div>
      <div class="toast-footer">
        <div class="tile-macros">
          <span class="tile-macro">${item.kcal} kcal</span>
          <span class="tile-macro">${item.protein}g protein</span>
          <span class="tile-macro">${item.fibre}g fibre</span>
        </div>
        <div class="toast-price"><span class="tile-rupee">₹</span>${item.price}</div>
      </div>
    </div>`;
}

/* ── Wraps ────────────────────────────────────────────────────── */
/* No per-item macros — wraps now share a summary range, same pattern
   as panini (config.sections.wrap.stats, rendered via paniniStatHTML
   into #wrapStats). The CSV's kcal/protein/fibre columns for wrap rows
   are blank as a result. */
function wrapRowHTML(item) {
  const tags = tagsHTML(item.tags);
  return `
    <div class="wrap-row">
      <div class="wrap-row-top">
        <span class="wrap-name">${item.name}</span>
        ${tags ? `<div class="tile-tags">${tags}</div>` : ''}
        <span class="wrap-price"><span class="tile-rupee">₹</span>${item.price}</span>
      </div>
      <div class="wrap-desc">${item.description}</div>
    </div>`;
}

/* ── Combo block (column 3, below the toasts) ────────────────── */
function comboBlockHTML(cfg) {
  const rows = cfg.items.map(function (i) {
    return `
      <div class="combo-row">
        <span class="combo-row-text">${i.text}</span>
        <span class="combo-row-price">${i.price}</span>
      </div>`;
  }).join('');
  return `<div class="combo-heading"><span class="combo-star">★</span>${cfg.heading}</div>${rows}`;
}

/* ── Dessert panel ───────────────────────────────────────────────
   The right column's second mode: a full-bleed photo panel. Content
   comes from config.dessertPanel (data/screen2-config.json), not the
   Sheet. Name/desc/prices use the canonical item tokens
   (.dessert-name/-desc/-price). Timer mechanics are a copy of
   beverages.js's offers panel; see SCREEN2-DESSERT-PANEL-PLAN.md D9
   for why this isn't hoisted into core.js yet. */
function dessertItemHTML(cfg) {
  const servings = cfg.items.map(function (it) {
    return `<span class="dessert-serving">${it.label}<span class="dessert-price"><span class="tile-rupee">₹</span>${it.price}</span></span>`;
  }).join('');
  return `
    <div class="dessert-name">${cfg.name}</div>
    ${cfg.desc ? `<div class="dessert-desc">${cfg.desc}</div>` : ''}
    <div class="dessert-servings">${servings}</div>`;
}

function renderDessertPanel(cfg) {
  document.getElementById('dessertEyebrow').textContent = cfg.eyebrow;
  document.getElementById('dessertTitle').textContent   = cfg.title;
  document.getElementById('dessertItem').innerHTML      = dessertItemHTML(cfg);
  /* Rebuilt every render, so a fresh <img> each time: onerror removing
     a previous one can't break a later render. */
  document.getElementById('dessertPhoto').innerHTML = cfg.photo ? `
    <img src="images/screen2/${cfg.photo}" alt="${cfg.name}"
         onerror="this.remove()">
    <div class="dessert-photo-fade"></div>` : '';
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

/* ── Full render ─────────────────────────────────────────────── */
function render(data) {
  const items  = data.items;
  const config = data.config;

  const paninis = items.filter(i => i.section === 'panini');
  const toasts  = items.filter(i => i.section === 'toast');
  const wraps   = items.filter(i => i.section === 'wrap');

  document.getElementById('paniniHeader').innerHTML = paniniHeaderHTML(config.panel);
  document.getElementById('paniniList').innerHTML = paninis.map(paniniItemHTML).join('');
  document.getElementById('paniniStats').innerHTML = config.panel.stats.map(paniniStatHTML).join('');
  document.getElementById('paniniPhoto').innerHTML =
    `<img src="${screen2ImageSrc(config.panel.image)}" alt="${config.panel.title}"
          onerror="this.closest('.panini-photo-wrap').classList.add('photo-error');this.remove()">`;

  document.getElementById('toastGrid').innerHTML = toasts.map(toastCardHTML).join('');
  document.getElementById('comboBlock').innerHTML = comboBlockHTML(config.combos);

  document.getElementById('wrapList').innerHTML = wraps.map(wrapRowHTML).join('');
  document.getElementById('wrapStats').innerHTML = config.sections.wrap.stats.map(paniniStatHTML).join('');
  const wrapCfg = config.sections.wrap;
  document.getElementById('wrapPhoto').innerHTML = `
    <img src="${screen2ImageSrc(wrapCfg.image)}" alt="Wraps"
         onerror="this.closest('.wrap-photo-wrap').classList.add('photo-error');this.remove()">`;

  renderPipeUpsell(config.upsell, 'Extras');

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
}

/* ── Boot ────────────────────────────────────────────────────── */
async function init() {
  scaleScreen();
  watchViewport();
  initFullscreenTrigger();

  try {
    const data = await loadData(fetchWrapsData, CACHE_KEY);
    render(data);
  } catch (err) {
    console.error('Green Feast: could not load menu data', err);
  }

  setInterval(async () => {
    try { render(await loadData(fetchWrapsData, CACHE_KEY)); }
    catch { /* keep showing cached version */ }
  }, REFRESH_MS);
}

init();
