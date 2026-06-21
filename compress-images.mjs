import sharp from 'sharp';
import { readdir, stat, writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';

const IMAGES_DIR = './images';
const OUT_DIR    = './images_compressed';
const MAX_SIZE   = 1200;
const QUALITY    = 82;

import { mkdir } from 'fs/promises';
await mkdir(OUT_DIR, { recursive: true });

const files = await readdir(IMAGES_DIR);
const images = files.filter(f => /\.(jpe?g|png)$/i.test(f));

console.log(`\nCompressing ${images.length} images → max ${MAX_SIZE}px, JPEG q${QUALITY}\n`);

for (const file of images) {
  const inPath  = join(IMAGES_DIR, file);
  const outName = basename(file, extname(file)) + '.jpg';
  const outPath = join(OUT_DIR, outName);

  const before = (await stat(inPath)).size;

  const buf = await sharp(inPath)
    .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer();

  await writeFile(outPath, buf);

  const pct = Math.round((1 - buf.length / before) * 100);
  console.log(`  ${file.padEnd(32)} ${(before/1024/1024).toFixed(1)} MB → ${(buf.length/1024).toFixed(0)} KB  (↓${pct}%)`);
}

console.log('\nDone.\n');
