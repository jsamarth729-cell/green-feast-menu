/* Offline tooling — not part of the live site.
   Prepares Screen 2's transparent cut-outs from the hand-cut PNGs dropped in
   "Screen 2/" (already background-removed by the user). Same trim-to-bbox
   step as ingest-manual-cutout.mjs, plus a "toast" mode that normalizes the
   three Open Toasts cards to a common width and vertical centre, so they
   read as a matched set side by side (DESIGN-PRINCIPLES §6 rule 2).

   "feature" mode (panini hero, wrap hero) only trims to the alpha bounding
   box — each stands alone in its own layout slot, nothing to match it to.

   Usage: node build-screen2-cutouts.mjs
*/
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const OUT = './images/screen2';

/* Toast canvas is deliberately WIDE, not square.
   First version used 900x900 (copied from the bowls, where a square is
   correct because a bowl IS square). A toast is ~1.5:1, so on a square
   canvas ~40% of the file is transparent padding above and below the
   food. The card then constrains by height, the whole square shrinks to
   fit, and the food rendered at 121px wide inside a 393px-wide box —
   using 31% of the space available to it. Sizing the canvas to the
   subject's real proportions is what makes the photo read large.

   Height is chosen so WIDTH is always the limiting dimension, for every
   toast: the "tallest" source is 1.45:1, needing 828/1.45 = 571px, and
   0.92 * 630 = 580 >= 571. That guarantees all three normalize to the
   same 828px width — the matched-set rule (DESIGN-PRINCIPLES §6 rule 2).
   Re-check this if a future toast photo is markedly taller. */
const TOAST_CANVAS_W = 900;
const TOAST_CANVAS_H = 630;
const TOAST_W        = 0.92;
const TOAST_MAX_H    = 0.92;

// Feature photos (panini, wrap): trim only, no shared canvas.
const MAP = {
  'panini-hero':        { file: 'Panini no bg.png',                              mode: 'feature' },
  'mex-chipotle':        { file: 'mex_chipotle_no_bg-removebg-preview.png',       mode: 'feature' },
  'bbq-plate':           { file: 'BBQ_Protien_with plate.png',                    mode: 'feature' },
  'avo-feta-toast':      { file: 'avo_feta_no_nbg-removebg-preview.png',          mode: 'toast' },
  'earthy-hummus-toast': { file: 'earthy_hummus_no_bg-removebg-preview.png',      mode: 'toast' },
  'mango-salsa-toast':   { file: 'mango_salsa_no_bg-removebg-preview.png',        mode: 'toast' },
};

const SRC = './Screen 2';

await mkdir(OUT, { recursive: true });

async function trimToBbox(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = data[(y * W + x) * C + 3];
      if (a > 40) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error('empty image — no non-transparent pixels found');

  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  const trimmed = await sharp(file).extract({ left: minX, top: minY, width: bw, height: bh })
    .png().toBuffer();
  return { trimmed, bw, bh };
}

// Feature: just trim, keep native aspect ratio (no canvas padding — the
// layout box for each feature photo sizes itself around this).
async function feature(trimmed) {
  return sharp(trimmed).png({ compressionLevel: 9 }).toBuffer();
}

// Toast: place on a shared wide canvas at uniform width, vertically
// centred, so the three cards read as a matched set.
async function toast(trimmed, bw, bh) {
  const wantW = TOAST_CANVAS_W * TOAST_W;
  const maxH  = TOAST_CANVAS_H * TOAST_MAX_H;
  const scale = Math.min(wantW / bw, maxH / bh);

  const newW = Math.max(1, Math.round(bw * scale));
  const newH = Math.max(1, Math.round(bh * scale));
  const resized = await sharp(trimmed).resize(newW, newH).toBuffer();

  const left = Math.round((TOAST_CANVAS_W - newW) / 2);
  const top  = Math.round((TOAST_CANVAS_H - newH) / 2);

  return sharp({ create: { width: TOAST_CANVAS_W, height: TOAST_CANVAS_H, channels: 4,
                           background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resized, left: Math.max(0, left), top: Math.max(0, top) }])
    .png({ compressionLevel: 9 }).toBuffer();
}

for (const [slug, { file, mode }] of Object.entries(MAP)) {
  const name = `${slug}.png`;
  try {
    const { trimmed, bw, bh } = await trimToBbox(path.join(SRC, file));
    const out = mode === 'toast' ? await toast(trimmed, bw, bh) : await feature(trimmed);
    await writeFile(path.join(OUT, name), out);
    console.log(`  OK   ${name.padEnd(28)} bbox ${String(bw).padStart(4)}x${String(bh).padStart(4)}` +
                ` (${(bw / bh).toFixed(2)})  ${(out.length / 1024).toFixed(0).padStart(4)} KB  [${mode}]`);
  } catch (e) {
    console.log(`  FAIL ${name.padEnd(28)} ${e.message}`);
  }
}
console.log('\nDone.');
