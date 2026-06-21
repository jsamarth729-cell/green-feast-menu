import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';

const IN  = './images';
const OUT = './images_sq';
await mkdir(OUT, { recursive: true });

// Square crop boxes centered on each bowl: { left, top, side }
// Coordinates are in each image's pixel space (see dimensions below).
const crops = {
  'mediterranean-bliss.jpg': { left: 147, top: 2,  side: 660 }, // 1200x675
  'umami-soba.jpg':          { left: 127, top: 2,  side: 660 }, // 1200x675
  'italian-harvest.jpg':     { left: 185, top: 0,  side: 660 }, // 1200x675
  'mexican-fiesta.jpg':      { left: 115, top: 15, side: 640 }, // 1200x675
  'quinoa-buddha.jpg':       { left: 125, top: 15, side: 650 }, // 1200x675
  'thai-zen.jpg':            { left: 110, top: 57, side: 720 }, // 1200x800
  'avo-protein.jpg':         { left: 295, top: 80, side: 680 }, // 1200x800
};

for (const [file, c] of Object.entries(crops)) {
  const buf = await sharp(`${IN}/${file}`)
    .extract({ left: c.left, top: c.top, width: c.side, height: c.side })
    .resize(700, 700, { fit: 'cover' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  await writeFile(`${OUT}/${file}`, buf);
  console.log(`  ${file.padEnd(28)} → ${(buf.length/1024).toFixed(0)} KB`);
}
console.log('Done.');
