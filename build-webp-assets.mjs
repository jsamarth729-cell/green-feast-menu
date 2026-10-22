/* Offline tooling — not part of the live site.
   One-off conversion of every committed cut-out to WebP at ~2x its measured
   on-screen size. Targets come from in-browser measurement at the real
   1920x1080 canvas; see ALL-SCREENS-WEBP-PLAN.md §5 for the table.

   Resizing happens here, on the finished image, rather than by changing the
   pipelines' canvas constants: those encode composition (bottom-alignment,
   the shared toast canvas) that must not shift. Scaling the finished file
   preserves every relationship exactly.

   The source .png files are deliberately LEFT IN PLACE — the store TVs cache
   JS by URL and keep requesting .png until each is refreshed.

   Run from the repo root: node build-webp-assets.mjs
*/
import sharp from 'sharp';
import { readdir } from 'fs/promises';

const WEBP = { quality: 90 };   // alphaQuality defaults to 100: lossless edges

/* width to resize to, or null to keep the file's own size */
function targetWidth(dir, file) {
  if (dir === 'images/nobg') {
    if (file.endsWith('-top.png')) return 246;   // rendered 123
    return null;                                 // -side (900) and extras-grid (600)
  }
  if (dir === 'images/screen2') {
    if (file.endsWith('-toast.png')) return 638; // rendered 319
    if (file === 'panini-hero.png')  return 1162;// rendered 581
    if (file === 'bbq-plate.png')    return 1240;// rendered 620
    return null;                                 // mex-chipotle: unused, keep native
  }
  return null;                                   // screen3 handled by height below
}

let before = 0, after = 0, count = 0;

for (const dir of ['images/nobg', 'images/screen2', 'images/screen3']) {
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.png')) continue;        // leaves the dessert .jpg alone
    const src = `${dir}/${file}`;
    const out = `${dir}/${file.replace(/\.png$/, '.webp')}`;

    let pipe = sharp(src);
    if (dir === 'images/screen3') {
      // Match the pipeline's rule: cap height, never upscale.
      const meta = await sharp(src).metadata();
      if (meta.height > 500) pipe = pipe.resize({ height: 500 });
    } else {
      const w = targetWidth(dir, file);
      if (w) pipe = pipe.resize({ width: w, withoutEnlargement: true });
    }

    const buf = await pipe.webp(WEBP).toBuffer();
    await sharp(buf).toFile(out);

    const { size } = await import('fs').then(m => m.promises.stat(src));
    before += size; after += buf.length; count++;
    console.log(`${src} -> ${out}  ${(size/1024).toFixed(0)}KB -> ${(buf.length/1024).toFixed(0)}KB`);
  }
}
console.log(`\n${count} files: ${(before/1048576).toFixed(2)}MB -> ${(after/1048576).toFixed(2)}MB`);
