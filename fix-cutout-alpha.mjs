/* Offline tooling — not part of the live site.
   Repairs the alpha channel of the background-removed hero cut-outs.

   Why: @imgly/background-removal-node leaves the whole subject slightly
   translucent (nothing reaches alpha 255), and on some shots it ghosts
   large regions down to alpha 50-150. Composited on the dark hero panel
   the green bleeds through and the bowl reads grey instead of cream.
   The RGB pixels are intact — only alpha is wrong — so a steep curve on
   the alpha channel restores it without touching colour.

   LO -> fully transparent, HI -> fully opaque, linear ramp between.
   The ramp is deliberately wide enough to preserve edge anti-aliasing.

   Run after remove-bg.mjs. Safe to re-run (idempotent in practice).  */
import sharp from 'sharp';
import { readdir } from 'fs/promises';
import path from 'path';

const DIR = './images/nobg';
const LO = 24;
const HI = 96;

const files = (await readdir(DIR)).filter(f => f.endsWith('.png')).sort();
console.log(`repairing alpha on ${files.length} cut-outs (${LO} -> ${HI})\n`);

for (const f of files) {
  const p = path.join(DIR, f);
  const { data, info } = await sharp(p).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  const out = Buffer.from(data);
  let before = 0, after = 0;
  for (let i = 0; i < W * H; i++) {
    const a = data[i * C + 3];
    if (a >= 250) before++;
    let v = (a - LO) / (HI - LO);
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    const na = Math.round(v * 255);
    out[i * C + 3] = na;
    if (na >= 250) after++;
  }

  await sharp(out, { raw: { width: W, height: H, channels: C } })
    .png({ compressionLevel: 9 }).toFile(p);

  const t = W * H;
  console.log(`  ${f.padEnd(32)} opaque ${(before/t*100).toFixed(1)}% -> ${(after/t*100).toFixed(1)}%`);
}
console.log('\nDone.');
