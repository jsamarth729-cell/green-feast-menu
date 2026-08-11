/* Offline tooling — not part of the live site.
   Prepares Screen 3's transparent cut-outs from the pre-background-removed
   PNGs dropped in "Screen3/" (gitignored source art, same pattern as
   build-screen2-cutouts.mjs). Trims each to its alpha bounding box and, for
   anything taller than MAX_H, downscales — no shared canvas.

   Screen 2's "toast" mode places cut-outs on one shared canvas at a uniform
   width so mismatched source framings read as a matched set (see
   DESIGN-PRINCIPLES §6 rule 2). That step is skipped here on purpose: all
   nine Screen 3 photos are the same physical cup, same camera angle, same
   lighting — the aspect-ratio spread (0.80–0.89) is garnish height, not a
   framing mismatch. Padding every file out to a canvas sized for the
   tallest would waste ~18% of a typical file on transparent padding and,
   because the card's photo box is height-limited, would shrink every cup
   on screen — the exact failure §6 already records for the 900×900 toast
   canvas before it was corrected. Instead beverages.css normalizes by
   height (height: 100%; width: auto), verified against a rendered contact
   sheet before this was decided. This is not a general licence to skip
   rule 2 — it only holds because these nine sources are this uniform.

   Usage: node build-screen3-cutouts.mjs
*/
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const OUT   = './images/screen3';
const SRC   = './Screen3';
const MAX_H = 600; // ~2.7x the largest on-screen display height (214px). Never upscale.

const MAP = {
  'blue-mind':             'ChatGPT Image Aug 11, 2026, 02_55_48 AM.png',
  'avo-clarity':           'ChatGPT_Image_Aug_11__2026__02_50_53_AM-removebg-preview.png',
  'purple-pulse':          'ChatGPT_Image_Aug_11__2026__02_46_51_AM-removebg-preview.png',
  'cocoa-core':            'ChatGPT Image Aug 11, 2026, 02_50_05 AM.png',
  'going-nuts':            'ChatGPT Image Aug 11, 2026, 02_53_09 AM.png',
  'cold-brew':             'ChatGPT Image Aug 11, 2026, 03_01_39 AM.png',
  'gingerale-cold-brew':   'ChatGPT_Image_Aug_11__2026__03_08_47_AM-removebg-preview.png',
  'vietnamese-cold-brew':  'ChatGPT_Image_Aug_11__2026__03_20_35_AM-removebg-preview.png',
  'iced-latte':            'ChatGPT_Image_Aug_11__2026__03_02_49_AM-removebg-preview.png',
};

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

for (const [slug, file] of Object.entries(MAP)) {
  const name = `${slug}.png`;
  try {
    const { trimmed, bw, bh } = await trimToBbox(path.join(SRC, file));
    let out = trimmed;
    let outW = bw, outH = bh;
    if (bh > MAX_H) {
      out = await sharp(trimmed).resize({ height: MAX_H }).png({ compressionLevel: 9 }).toBuffer();
      const m = await sharp(out).metadata();
      outW = m.width; outH = m.height;
    } else {
      out = await sharp(trimmed).png({ compressionLevel: 9 }).toBuffer();
    }
    await writeFile(path.join(OUT, name), out);
    console.log(`  OK   ${name.padEnd(28)} bbox ${String(bw).padStart(4)}x${String(bh).padStart(4)}` +
                ` (${(bw / bh).toFixed(3)}) -> ${String(outW).padStart(4)}x${String(outH).padStart(4)}` +
                `  ${(out.length / 1024).toFixed(0).padStart(4)} KB`);
  } catch (e) {
    console.log(`  FAIL ${name.padEnd(28)} ${e.message}`);
  }
}
console.log('\nDone.');
