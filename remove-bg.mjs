/* Offline tooling — not part of the live site.
   Removes photo backgrounds from the bowl shots, writing RGBA PNGs to
   images/nobg/. Originals in images/ are never modified or deleted. */
import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import path from 'path';

const IN  = './images';
const OUT = './images/nobg';

await mkdir(OUT, { recursive: true });

const files = (await readdir(IN))
  .filter(f => /-(side|top)\.jpg$/i.test(f))
  .sort();

console.log(`${files.length} images to process\n`);

let ok = 0;
const failed = [];

for (const f of files) {
  const outName = f.replace(/\.jpg$/i, '.png');
  try {
    const buf  = await readFile(path.join(IN, f));
    const blob = new Blob([buf], { type: 'image/jpeg' });
    const cut  = Buffer.from(await (await removeBackground(blob)).arrayBuffer());
    // re-encode with max PNG compression, preserving alpha
    const out  = await sharp(cut).png({ compressionLevel: 9 }).toBuffer();
    await writeFile(path.join(OUT, outName), out);
    console.log(`  OK   ${outName.padEnd(32)} ${(out.length / 1024).toFixed(0)} KB`);
    ok++;
  } catch (e) {
    console.log(`  FAIL ${outName.padEnd(32)} ${e.message}`);
    failed.push(f);
  }
}

console.log(`\n${ok}/${files.length} succeeded`);
if (failed.length) console.log('failed:', failed.join(', '));
