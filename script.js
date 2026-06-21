// ═══════════════════════════════════════════════════════════════
//  DATA SOURCE
//  Phase 1 (local):  'data/bowls.json'
//  Phase 2 (sheets): paste your published Google Sheet CSV URL below
// ═══════════════════════════════════════════════════════════════
const BOWLS_SOURCE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0NTFd2KLI2oVsU_jJYP6X-nbLaq1M4Woqpb_gqMudOWUarZlIImnYpXfSrh5cblNmhcNOcUTDaTSw/pub?gid=2092061156&single=true&output=csv';
const CONFIG_URL   = 'data/config.json';  // BYOB tile + upsell (edit here directly)

const CACHE_KEY  = 'gf_bowls_v2';
const SLIDE_MS   = 15000;
const REFRESH_MS = 5 * 60 * 1000;

let currentSlide = 0;
let featuredCount = 0;
let slideTimer    = null;

/* ── Scale 1920×1080 canvas to fill viewport ─────────────────── */
function scaleScreen() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  const left  = (window.innerWidth  - 1920 * scale) / 2;
  const top   = (window.innerHeight - 1080 * scale) / 2;
  const el    = document.getElementById('screen');
  el.style.transform       = `scale(${scale})`;
  el.style.transformOrigin = 'top left';
  el.style.left            = left + 'px';
  el.style.top             = top  + 'px';
}

/* ── CSV parser (used when BOWLS_SOURCE is a Google Sheet URL) ── */
function splitCSVLine(line) {
  const result = [];
  let current = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text) {
  const lines   = text.trim().split('\n');
  const headers = splitCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = splitCSVLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim().replace(/^"|"$/g, '')]));
  });
}

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

/* ── Fetch with localStorage fallback ────────────────────────── */
async function fetchData() {
  try {
    const cacheBust = (url) =>
      url + (url.includes('?') ? '&' : '?') + '_=' + Date.now();

    const [bowlsRes, configRes] = await Promise.all([
      fetch(cacheBust(BOWLS_SOURCE)),
      fetch(CONFIG_URL)
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

    const data = {
      bowls,
      buildYourOwn: config.buildYourOwn,
      upsell:       config.upsell
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return data;

  } catch {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
    throw new Error('No data and no cache');
  }
}

/* ── Build hero slide HTML ───────────────────────────────────── */
function heroSlideHTML(bowl) {
  const hasBadge = bowl.badge && bowl.badge.trim();
  let badgeClass = '';
  if (bowl.badge === "Chef's Spotlight") badgeClass = 'badge-spotlight';
  if (bowl.badge === 'Most Loved')       badgeClass = 'badge-loved';

  return `
    <div class="hero-slide">
      ${hasBadge
        ? `<div class="hero-badge ${badgeClass}">${bowl.badge}</div>`
        : `<div class="hero-badge-spacer"></div>`}
      <div class="hero-photo-wrap">
        <img src="images/${bowl.image}" alt="${bowl.name}"
             style="object-position: ${bowl.img_x}% ${bowl.img_y}%; transform: scale(${bowl.img_scale})"
             onerror="this.closest('.hero-photo-wrap').classList.add('photo-error');this.remove()">
      </div>
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
      <div class="hero-price">
        <span class="hero-rupee">₹</span>${bowl.price}
      </div>
    </div>`;
}

/* ── Build bowl grid tile HTML ───────────────────────────────── */
function tileHTML(bowl) {
  const hasBadge = bowl.badge && bowl.badge.trim();
  let badgeClass = '';
  if (bowl.badge === "Chef's Spotlight") badgeClass = 'badge-spotlight';
  if (bowl.badge === 'Most Loved')       badgeClass = 'badge-loved';

  const tags = (bowl.tags || [])
    .map(t => `<span class="tile-tag">${t}</span>`)
    .join('');

  return `
    <div class="bowl-tile">
      ${hasBadge ? `<div class="tile-badge ${badgeClass}">${bowl.badge}</div>` : ''}
      <div class="tile-photo-wrap">
        <img src="images/${bowl.image}" alt="${bowl.name}"
             style="object-position: ${bowl.img_x}% ${bowl.img_y}%; transform: scale(${bowl.img_scale})"
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
  document.querySelectorAll('.hero-slide')[index]?.classList.add('active');
  document.querySelectorAll('.hero-dot')[index]?.classList.add('active');
  currentSlide = index;
}

function startSlideshow() {
  if (slideTimer) clearInterval(slideTimer);
  slideTimer = setInterval(() => {
    goToSlide((currentSlide + 1) % featuredCount);
  }, SLIDE_MS);
}

/* ── Upsell rail ─────────────────────────────────────────────── */
function renderUpsell(items) {
  let html = `<div class="upsell-heading">Make it a meal</div>`;

  items.forEach(item => {
    const parts = item.split('|').map(p => p.trim());
    if (parts.length >= 3) {
      html += `
        <div class="upsell-combo">
          <span class="combo-text">${parts[0]}</span>
          <span class="combo-price">${parts[1]}</span>
          <span class="combo-save">${parts[2]}</span>
        </div>`;
    } else {
      html += `
        <div class="upsell-vdiv"></div>
        <div class="upsell-addon">
          <span class="addon-text">${parts[0]}</span>
          <span class="addon-price">${parts[1] || ''}</span>
        </div>`;
    }
  });

  document.getElementById('upsellRail').innerHTML = html;
}

/* ── Full render ─────────────────────────────────────────────── */
function render(data) {
  const featured = data.bowls.filter(b => b.featured);
  featuredCount  = featured.length;

  document.getElementById('heroSlides').innerHTML =
    featured.map(heroSlideHTML).join('');

  document.getElementById('heroDots').innerHTML =
    featured.map((_, i) =>
      `<div class="hero-dot${i === 0 ? ' active' : ''}"></div>`
    ).join('');

  goToSlide(0);
  startSlideshow();

  document.getElementById('bowlGrid').innerHTML =
    data.bowls.map(tileHTML).join('') + byobTileHTML(data.buildYourOwn);

  renderUpsell(data.upsell);
}

/* ── Boot ────────────────────────────────────────────────────── */
async function init() {
  scaleScreen();
  window.addEventListener('resize', scaleScreen);

  try {
    const data = await fetchData();
    render(data);
  } catch (err) {
    console.error('Green Feast: could not load menu data', err);
  }

  setInterval(async () => {
    try { render(await fetchData()); }
    catch { /* keep showing cached version */ }
  }, REFRESH_MS);
}

init();
