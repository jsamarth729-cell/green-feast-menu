/* Offline tooling — not part of the live site.
   Takes a hand-cut transparent PNG (background already removed by the user
   in their own tool) and runs it through the same trim + normalize step as
   build-bowl-cutouts.mjs, so it matches the other bowls' size and baseline
   exactly. Use this instead of the full pipeline when the automated
   background-removal model fails on a specific photo (e.g. a pale bowl
   against pale marble gets hard-misclassified as background — no amount of
   alpha-curve repair can recover pixels that were zeroed at the source).

   Usage: node ingest-manual-cutout.mjs <input.png> <slug> <side|top>
   Example: node ingest-manual-cutout.mjs Mexican_Fiesta-removebg-preview.png mexican-fiesta side
*/
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const [, , inputFile, slug, kind] = process.argv;
if (!inputFile || !slug || !kind || !['side', 'top'].includes(kind)) {
  console.error('Usage: node ingest-manual-cutout.mjs <input.png> <slug> <side|top>');
  process.exit(1);
}

const OUT = './images/nobg';
const CANVAS = 900;

// Same values as build-bowl-cutouts.mjs — must match so this bowl reads at
// the same size as every automated one.
const HERO_W          = 0.86;
const HERO_BOTTOM_GAP = 0.04;
const HERO_MAX_H      = 0.90;
const TILE_W          = 0.92;
const TILE_MAX_H      = 0.92;

await mkdir(OUT, { recursive: true });

// Trim to the alpha bounding box — a hand-cut image may have export padding.
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

// Identical to normalize() in build-bowl-cutouts.mjs.
async function normalize(trimmed, bw, bh, kind) {
  const wantW = Math.min(CANVAS * 0.98, CANVAS * (kind === 'side' ? HERO_W : TILE_W));
  const maxH  = CANVAS * (kind === 'side' ? HERO_MAX_H : TILE_MAX_H);
  const scale = Math.min(wantW / bw, maxH / bh);

  const newW = Math.max(1, Math.round(bw * scale));
  const newH = Math.max(1, Math.round(bh * scale));
  const resized = await sharp(trimmed).resize(newW, newH).toBuffer();

  const left = Math.round((CANVAS - newW) / 2);
  const top  = kind === 'side'
    ? CANVAS - Math.round(CANVAS * HERO_BOTTOM_GAP) - newH
    : Math.round((CANVAS - newH) / 2);

  return sharp({ create: { width: CANVAS, height: CANVAS, channels: 4,
                           background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resized, left: Math.max(0, left), top: Math.max(0, top) }])
    .png({ compressionLevel: 9 }).toBuffer();
}

const { trimmed, bw, bh } = await trimToBbox(inputFile);
const out = await normalize(trimmed, bw, bh, kind);
const outPath = path.join(OUT, `${slug}-${kind}.png`);
await writeFile(outPath, out);

console.log(`OK   ${outPath}`);
console.log(`     source bbox ${bw}x${bh} -> normalized to ${CANVAS}x${CANVAS} canvas`);
console.log(`     (${(out.length / 1024).toFixed(0)} KB)`);
