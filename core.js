/* ═══════════════════════════════════════════════════════════════
   CORE — shared by every menu board (Screens 1-4).

   Viewport scaling/fullscreen, CSV parsing, the fetch+localStorage
   cache pattern, and the tag-abbreviation map. Every board loads
   this before its own <screen>.js. Keep this file screen-agnostic —
   anything specific to one board's data shape belongs in that
   board's own script (bowls.js, wraps.js, …).
══════════════════════════════════════════════════════════════════ */

/* Tile pills are too small for full words at wall-viewing distance, so they
   show an abbreviation and the footer carries the glossary. Mapping lives here
   rather than in the Sheet so the owner keeps writing readable names. */
const TAG_ABBREV = {
  'Gluten Free':   'GF',
  'High Protein':  'PRO',
  'High Fibre':    'FIB',
  'Contains Nuts': 'N',
  'Less Spicy':    'LS',
};
function tagAbbrev(tag) {
  return TAG_ABBREV[tag] || tag;
}
function tagsHTML(tags) {
  return (tags || [])
    .map(function (t) { return '<span class="tile-tag">' + tagAbbrev(t) + '</span>'; })
    .join('');
}

/* Bottom-rail upsell for Screens 1-2, which share an identical strip.
   Pipe-delimited: "text | price" renders a plain add-on, "text | price | note"
   renders the larger combo card with a trailing note chip. Screen 3 has its own
   shape (a single gold pill) and deliberately does NOT use this. */
function renderPipeUpsell(items, heading) {
  let html = `<div class="upsell-heading">${heading}</div>`;

  items.forEach((item, i) => {
    const parts = item.split('|').map(p => p.trim());
    if (parts.length >= 3) {
      html += `
        <div class="upsell-combo">
          <span class="combo-text">${parts[0]}</span>
          <span class="combo-price">${parts[1]}</span>
          <span class="combo-save">${parts[2]}</span>
        </div>`;
    } else {
      /* Divider separates items from each other, not the first item from the
         heading — a leading divider reads as a stray mark. */
      html += `
        ${i > 0 ? '<div class="upsell-vdiv"></div>' : ''}
        <div class="upsell-addon">
          <span class="addon-text">${parts[0]}</span>
          <span class="addon-price">${parts[1] || ''}</span>
        </div>`;
    }
  });

  document.getElementById('upsellRail').innerHTML = html;
}

/* ── Scale 1920×1080 canvas to fill viewport ─────────────────── */
let lastW = 0, lastH = 0;

/* Kiosk WebViews often paint at their own zoom level until the page
   goes fullscreen — window.innerWidth still reports 1920, so it can't
   detect this and the board renders oversized. visualViewport reports
   the area actually visible (zoom included), so fitting to that is
   correct both before and after fullscreen. Chrome 61+.            */
function viewportSize() {
  const vp = window.visualViewport;
  if (vp && vp.width && vp.height) return [vp.width, vp.height];
  return [window.innerWidth, window.innerHeight];
}

function scaleScreen() {
  const el = document.getElementById('screen');
  if (!el) return;
  const [vw, vh] = viewportSize();
  if (!vw || !vh) return;
  lastW = vw; lastH = vh;

  const scale = Math.min(vw / 1920, vh / 1080);
  el.style.transform       = `scale(${scale})`;
  el.style.transformOrigin = 'top left';
  el.style.left            = (vw - 1920 * scale) / 2 + 'px';
  el.style.top             = (vh - 1080 * scale) / 2 + 'px';
}

/* Kiosk WebViews report their final viewport size late — often only
   after entering fullscreen. A single scale at boot therefore locks
   in wrong numbers and the board stays mis-sized until someone
   presses a key. So: re-scale on every event that can change the
   viewport, retry over the first few seconds, then keep a cheap
   watchdog running (the board is on 24/7 and never reloads).      */
function watchViewport() {
  ['resize', 'orientationchange', 'fullscreenchange',
   'webkitfullscreenchange'].forEach(evt =>
    window.addEventListener(evt, scaleScreen));

  // Fires when the WebView's own zoom changes — the case innerWidth misses.
  const vp = window.visualViewport;
  if (vp) {
    vp.addEventListener('resize', scaleScreen);
    vp.addEventListener('scroll', scaleScreen);
  }

  [50, 150, 400, 800, 1500, 3000].forEach(ms =>
    setTimeout(scaleScreen, ms));

  setInterval(() => {
    const [vw, vh] = viewportSize();
    if (vw !== lastW || vh !== lastH) scaleScreen();
  }, 1000);
}

/* ── CSV parser ──────────────────────────────────────────────── */
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
    const obj = {};
    headers.forEach(function (h, i) {
      const v = vals[i];
      obj[h] = (v === undefined || v === null ? '' : v).trim().replace(/^"|"$/g, '');
    });
    return obj;
  });
}

/* ── Fetch with localStorage fallback ────────────────────────────
   fetchFn() must resolve to the plain data object to render/cache.
   Falls back to the last cached copy under cacheKey if fetchFn
   rejects (offline, Sheet unreachable, etc). */
async function loadData(fetchFn, cacheKey) {
  try {
    const data = await fetchFn();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (err) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
    throw err;
  }
}

function cacheBust(url) {
  return url + (url.includes('?') ? '&' : '?') + '_=' + Date.now();
}

/* ── Fullscreen (kiosk) ──────────────────────────────────────────
   TV browsers show an address bar that eats screen space. The
   Fullscreen API can hide it, but browsers only allow it in
   response to a real user gesture — so we listen for any remote
   button press or click and go fullscreen then.
   NOTE: Chrome 69 (the store TVs) only has the webkit-prefixed
   version; unprefixed requestFullscreen landed in Chrome 71.     */
function goFullscreen() {
  const el = document.documentElement;
  const req = el.requestFullscreen
           || el.webkitRequestFullscreen
           || el.webkitRequestFullScreen
           || el.mozRequestFullScreen
           || el.msRequestFullscreen;
  if (!req) return;
  try { req.call(el); } catch (e) { /* denied or unsupported */ }
}

function initFullscreenTrigger() {
  document.addEventListener('click',   goFullscreen);
  document.addEventListener('keydown', goFullscreen);
}
