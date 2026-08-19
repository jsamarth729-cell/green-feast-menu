/* ═══════════════════════════════════════════════════════════════
   SCREEN 2 — Wraps, Paninis & Open Toasts.
   Loads after core.js (scaling, CSV parsing, fetch+cache, fullscreen,
   tag abbreviations all live there).
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
    fetch(CONFIG_URL)
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
        <span class="panini-item-name">${item.name}</span>
        ${hasBadge ? `<span class="panini-item-badge ${badgeClassFor(item.badge)}">${item.badge}</span>` : ''}
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
  return `<div class="combo-heading">${cfg.heading}</div>${rows}`;
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
