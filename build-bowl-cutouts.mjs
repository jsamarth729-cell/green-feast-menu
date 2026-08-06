/* Offline tooling — not part of the live site.
   Builds normalized transparent cut-outs for every bowl, straight from the
   original product shoot.

   Order matters: background removal runs on the WHOLE photo, so nothing is
   clipped, and the crop is then derived from the alpha bounding box. The old
   pipeline cropped first and sliced six bowls in half.

   Output: images/nobg/<slug>-side.png (hero) and <slug>-top.png (tile),
   every bowl trimmed to its own edges then scaled to a uniform width and
   baseline, so they all read at the same size on screen.               */
import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const SRC = 'D:/Sam/SAMARTH STEPPING INTO BUSINESS/2026 I am Growing Greenfeast/Resources/Product Shoot/drive-download-20260804T133946Z-1-001';
const OUT = './images/nobg';

const WORK_PX  = 1800;   // downscale before removal — originals are up to 16 MB
const CANVAS   = 900;    // output canvas, square
const ALPHA_LO = 24;     // alpha repair curve — see cutout() below
const ALPHA_HI = 96;

const HERO_W          = 0.86;  // bowl width as fraction of canvas, hero
const HERO_BOTTOM_GAP = 0.04;  // gap below bowl, hero (bottom-aligned)
const HERO_MAX_H      = 0.90;
const TILE_W          = 0.92;  // bowl width as fraction of canvas, tile (centred)
const TILE_MAX_H      = 0.92;

/* Per-image nudge, applied after normalization. Was used to compensate for
   the fruit salad's bbox including its separate dressing cup — but blob
   isolation (see cutout()) now drops that cup as a stray object on its own,
   so the bbox is just the tray and no override is needed. Left empty rather
   than removed in case a future photo needs one. */
const SCALE_OVERRIDE = {};

const MAP = {
  'mediterranean-bliss':  { side: 'Mediterranean Bliss  (1).jpg', top: 'Mediterranean Bliss  (2).jpg' },
  'italian-harvest':      { side: 'italian (1).jpg',              top: 'italian (2).jpg' },
  'thai-zen':             { side: 'thai (1).jpg',                 top: 'Thai (3).jpg' },
  'mexican-fiesta':       { side: 'Mexican Fiesta.jpg',           top: 'Mexican Fiesta (1).jpg' },
  'quinoa-buddha':        { side: 'buddha.jpg',                   top: 'Quinoa Buddha (1).jpg' },
  'burrito-bowl':         { side: 'Burrito Bowl.png',             top: 'burrito bowl top view.png' },
  'umami-soba':           { side: 'DSC06747.jpg',                 top: 'Umami Soba .jpg' },
  'avo-protein':          { side: 'avo protien.jpg',              top: 'Tandoori Protein (1).jpg' },
  'tropical-fruit-salad': { side: 'Tropical Fruit.jpg',           top: 'Tropical Fruit.jpg' },
};

await mkdir(OUT, { recursive: true });

/* These flat-lay shots often have a second small bowl or a loose lettuce
   bunch sitting apart from the main dish for styling. Background removal
   correctly treats them as foreground too, so a plain alpha bounding box
   grabs bowl + prop together — confirmed by every -top image except
   burrito-bowl-top (which has no prop) landing at a 1.43-1.59 aspect ratio
   instead of the ~1.0-1.25 a single bowl produces. Isolate the largest
   connected blob (always the bowl — it's the biggest object in frame) and
   drop everything else before cropping. 4-connectivity on a threshold well
   above the anti-aliased edge fringe, so a faint halo can't bridge two
   separate objects into one blob. */
/* Two-tier so a faint region can't be mistaken for background.
   Pass 1 picks the bowl using a HIGH threshold, so a soft halo can't bridge
   the bowl to a separately-plated prop. Pass 2 regrows that same blob at a
   LOW threshold, so a ghosted cream base or an anti-aliased edge is kept.
   Seeded only from the core, so props still can't join. */
function largestBlobMask(alpha, W, H, coreThreshold = 128, keepThreshold = 8) {
  const n = W * H;
  const visited = new Uint8Array(n);
  const stack = new Int32Array(n);

  // Pass 1 — biggest core blob.
  let bestStart = -1, bestSize = 0;
  for (let s = 0; s < n; s++) {
    if (visited[s] || alpha[s] <= coreThreshold) continue;
    let sp = 0, size = 0;
    stack[sp++] = s; visited[s] = 1;
    while (sp > 0) {
      const idx = stack[--sp]; size++;
      const x = idx % W, y = (idx / W) | 0;
      if (x > 0   && !visited[idx-1] && alpha[idx-1] > coreThreshold) { visited[idx-1]=1; stack[sp++]=idx-1; }
      if (x < W-1 && !visited[idx+1] && alpha[idx+1] > coreThreshold) { visited[idx+1]=1; stack[sp++]=idx+1; }
      if (y > 0   && !visited[idx-W] && alpha[idx-W] > coreThreshold) { visited[idx-W]=1; stack[sp++]=idx-W; }
      if (y < H-1 && !visited[idx+W] && alpha[idx+W] > coreThreshold) { visited[idx+W]=1; stack[sp++]=idx+W; }
    }
    if (size > bestSize) { bestSize = size; bestStart = s; }
  }
  if (bestStart < 0) return null;

  // Re-flood just the winning core to collect its members as seeds.
  const core = new Uint8Array(n);
  let sp = 0;
  stack[sp++] = bestStart; core[bestStart] = 1;
  const seeds = [];
  while (sp > 0) {
    const idx = stack[--sp]; seeds.push(idx);
    const x = idx % W, y = (idx / W) | 0;
    if (x > 0   && !core[idx-1] && alpha[idx-1] > coreThreshold) { core[idx-1]=1; stack[sp++]=idx-1; }
    if (x < W-1 && !core[idx+1] && alpha[idx+1] > coreThreshold) { core[idx+1]=1; stack[sp++]=idx+1; }
    if (y > 0   && !core[idx-W] && alpha[idx-W] > coreThreshold) { core[idx-W]=1; stack[sp++]=idx-W; }
    if (y < H-1 && !core[idx+W] && alpha[idx+W] > coreThreshold) { core[idx+W]=1; stack[sp++]=idx+W; }
  }

  // Pass 2 — regrow at the low threshold from every core pixel.
  const keep = new Uint8Array(n);
  sp = 0;
  for (const s of seeds) { keep[s] = 1; stack[sp++] = s; }
  while (sp > 0) {
    const idx = stack[--sp];
    const x = idx % W, y = (idx / W) | 0;
    if (x > 0   && !keep[idx-1] && alpha[idx-1] > keepThreshold) { keep[idx-1]=1; stack[sp++]=idx-1; }
    if (x < W-1 && !keep[idx+1] && alpha[idx+1] > keepThreshold) { keep[idx+1]=1; stack[sp++]=idx+1; }
    if (y > 0   && !keep[idx-W] && alpha[idx-W] > keepThreshold) { keep[idx-W]=1; stack[sp++]=idx-W; }
    if (y < H-1 && !keep[idx+W] && alpha[idx+W] > keepThreshold) { keep[idx+W]=1; stack[sp++]=idx+W; }
  }
  return keep;
}

/* Remove background from the full photo, repair alpha, isolate the bowl
   from any separate prop, trim to just the bowl. */
async function cutout(srcFile) {
  const small = await sharp(srcFile)
    .resize(WORK_PX, WORK_PX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 95 }).toBuffer();

  const blob = new Blob([small], { type: 'image/jpeg' });
  const cut  = Buffer.from(await (await removeBackground(blob)).arrayBuffer());

  const { data, info } = await sharp(cut).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  const buf = Buffer.from(data);
  const repairedAlpha = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const a = data[i * C + 3];
    let v = (a - ALPHA_LO) / (ALPHA_HI - ALPHA_LO);
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    const na = Math.round(v * 255);
    buf[i * C + 3] = na;
    repairedAlpha[i] = na;
  }

  const bowlMask = largestBlobMask(repairedAlpha, W, H);
  if (!bowlMask) throw new Error('empty cut-out');

  // Anything not in the main blob (a separate prop bowl, a loose lettuce
  // leaf) gets zeroed out — it should not appear in the final image at all.
  let strayPixels = 0;
  for (let i = 0; i < W * H; i++) {
    if (!bowlMask[i] && buf[i * C + 3] > 0) { strayPixels++; buf[i * C + 3] = 0; }
  }

  let minX = W, minY = H, maxX = -1, maxY = -1, opaque = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const a = buf[i * C + 3];
      if (a > 40) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      if (a >= 250) opaque++;
    }
  }
  if (maxX < 0) throw new Error('empty cut-out');

  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  const trimmed = await sharp(buf, { raw: { width: W, height: H, channels: C } })
    .extract({ left: minX, top: minY, width: bw, height: bh })
    .png().toBuffer();

  return { trimmed, bw, bh, opaquePct: opaque / (W * H) * 100,
           strayPixels,
           clipped: minX === 0 || minY === 0 || maxX === W - 1 || maxY === H - 1 };
}

/* Scale to a uniform width and place on a common baseline. */
async function normalize(trimmed, bw, bh, kind, mul) {
  // Clamped: a SCALE_OVERRIDE > 1 must never push the resized image past
  // the canvas itself, or sharp's composite() throws (this is what broke
  // tropical-fruit-salad — 0.86 * 1.18 = 1.01, just over CANVAS).
  const wantW = Math.min(
    CANVAS * 0.98,
    CANVAS * (kind === 'side' ? HERO_W : TILE_W) * mul
  );
  const maxH  = CANVAS * (kind === 'side' ? HERO_MAX_H : TILE_MAX_H);
  const scale = Math.min(wantW / bw, maxH / bh);       // never overflow the canvas

  const newW = Math.max(1, Math.round(bw * scale));
  const newH = Math.max(1, Math.round(bh * scale));
  const resized = await sharp(trimmed).resize(newW, newH).toBuffer();

  const left = Math.round((CANVAS - newW) / 2);
  const top  = kind === 'side'
    ? CANVAS - Math.round(CANVAS * HERO_BOTTOM_GAP) - newH   // bottom-aligned
    : Math.round((CANVAS - newH) / 2);                        // centred

  return sharp({ create: { width: CANVAS, height: CANVAS, channels: 4,
                           background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resized, left: Math.max(0, left), top: Math.max(0, top) }])
    .png({ compressionLevel: 9 }).toBuffer();
}

for (const [slug, pair] of Object.entries(MAP)) {
  for (const kind of ['side', 'top']) {
    const name = `${slug}-${kind}.png`;
    try {
      const { trimmed, bw, bh, opaquePct, clipped, strayPixels } =
        await cutout(path.join(SRC, pair[kind]));
      const mul = SCALE_OVERRIDE[`${slug}-${kind}`] ?? 1;
      const out = await normalize(trimmed, bw, bh, kind, mul);
      await writeFile(path.join(OUT, name), out);
      console.log(`  OK   ${name.padEnd(32)} bbox ${String(bw).padStart(4)}x${String(bh).padStart(4)}` +
                  ` (${(bw/bh).toFixed(2)})` +
                  `  opaque ${opaquePct.toFixed(1).padStart(5)}%` +
                  `  stray ${String(strayPixels).padStart(6)}px` +
                  `  ${(out.length / 1024).toFixed(0).padStart(4)} KB` +
                  `${clipped ? '  <-- SUBJECT TOUCHES FRAME EDGE' : ''}`);
    } catch (e) {
      console.log(`  FAIL ${name.padEnd(32)} ${e.message}`);
    }
  }
}
console.log('\nDone.');
