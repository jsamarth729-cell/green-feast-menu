/* One-off offline tooling (like crop-bowls.mjs / compress-images.mjs).
   Imports the Aug-2026 product shoot into images/, producing for each bowl:
     <slug>-top.jpg   square top-down shot  → grid tile
     <slug>-side.jpg  square 3/4 side shot  → hero panel
   Not part of the live site. */
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const SRC = 'D:/Sam/SAMARTH STEPPING INTO BUSINESS/2026 I am Growing Greenfeast/Resources/Product Shoot/drive-download-20260804T133946Z-1-001';
const OUT = './images';
const SIDE_PX = 900;
const QUALITY = 85;

/* In these flat-lay shots the bowl sits ~38% from the left with garnish and
   side bowls filling the right. sharp's attention strategy locks onto that
   clutter and slices the bowl off, so top shots get an explicit anchor
   instead. `anchor` is the bowl centre as a fraction of image width. */
const DEFAULT_ANCHOR = 0.38;

// slug -> { side: <3/4 elevated shot>, top: <flat overhead shot>, anchor? }
const MAP = {
  'mediterranean-bliss': { side: 'Mediterranean Bliss  (1).jpg', top: 'Mediterranean Bliss  (2).jpg' },
  'italian-harvest':     { side: 'italian (1).jpg',              top: 'italian (2).jpg' },
  'thai-zen':            { side: 'thai (1).jpg',                 top: 'Thai (3).jpg',                anchor: 0.40 },
  'mexican-fiesta':      { side: 'Mexican Fiesta.jpg',           top: 'Mexican Fiesta (1).jpg' },
  'quinoa-buddha':       { side: 'buddha.jpg',                   top: 'Quinoa Buddha (1).jpg',       anchor: 0.40 },
  'burrito-bowl':        { side: 'Burrito Bowl.png',             top: 'burrito bowl top view.png',   anchor: null }, // already square
  'umami-soba':          { side: 'DSC06747.jpg',                 top: 'Umami Soba .jpg' },
  'avo-protein':         { side: 'avo protien.jpg',               top: 'Tandoori Protein (1).jpg' },
  // Only one shot exists for this bowl (a 3/4 angle, rectangular takeaway
  // box) — used for both side and top. anchor:null skips the top-shot
  // horizontal anchor since this isn't a circular-bowl flat-lay.
  'tropical-fruit-salad': { side: 'Tropical Fruit.jpg', top: 'Tropical Fruit.jpg', anchor: 0.45 },
};

await mkdir(OUT, { recursive: true });

/* Square crop anchored horizontally at `anchor`, using full image height. */
async function anchoredSquare(file, anchor) {
  const img = sharp(file);
  const { width, height } = await img.metadata();
  const side = Math.min(width, height);
  const left = Math.max(0, Math.min(width - side, Math.round(anchor * width - side / 2)));
  const top = Math.max(0, Math.round((height - side) / 2));
  return img.extract({ left, top, width: side, height: side });
}

for (const [slug, pair] of Object.entries(MAP)) {
  for (const kind of ['side', 'top']) {
    const file = path.join(SRC, pair[kind]);
    const outName = `${slug}-${kind}.jpg`;

    // Side (3/4) shots frame the bowl centrally already — attention works well.
    // Top shots need the explicit anchor.
    const useAnchor = kind === 'top' && pair.anchor !== null;
    const pipeline = useAnchor
      ? await anchoredSquare(file, pair.anchor ?? DEFAULT_ANCHOR)
      : sharp(file);

    const buf = await pipeline
      .resize(SIDE_PX, SIDE_PX, {
        fit: 'cover',
        position: useAnchor ? 'centre' : sharp.strategy.attention,
      })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toBuffer();

    await writeFile(path.join(OUT, outName), buf);
    console.log(`  ${outName.padEnd(30)} ← ${pair[kind].padEnd(32)} ${(buf.length / 1024).toFixed(0)} KB`);
  }
}
console.log('\nDone.');
