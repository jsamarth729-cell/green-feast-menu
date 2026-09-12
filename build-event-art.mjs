/* Offline tooling — not part of the live site.
   Prepares the two Ritual x Green Feast event takeover images from the raw
   source files dropped in the local Downloads folder (not committed — these
   are one-off exports, unlike the recurring per-bowl/per-drink pipelines).

   Source -> output:
     rmenu  ("Today's Selection" menu poster)
       C:/Users/hp/Downloads/RitualxGF screen menu.png (8000x4500, has alpha)
       -> images/events/rmenu.png
     rmain  (Ritual x Green Feast logo lockup)
       C:/Users/hp/Downloads/WhatsApp Image 2026-09-12 at 16.36.27 (1).jpeg
       (2560x1440, opaque)
       -> images/events/rmain.png

   Both sources are already exactly 16:9, so this is flatten (alpha ->
   ground colour, only rmenu needs it) + resize to 1920x1080 + PNG encode.
   PNG chosen over JPEG for both: flat colour + crisp text compresses
   smaller as PNG and avoids JPEG ringing around letter edges (measured:
   rmenu ~190KB as palette PNG vs ~296KB as JPEG q92).

   Run from the repo root: node build-event-art.mjs
*/
import sharp from 'sharp';
import { mkdirSync } from 'fs';

const OUT_DIR = 'images/events';
mkdirSync(OUT_DIR, { recursive: true });

const JOBS = [
  {
    name: 'rmenu',
    src: 'C:/Users/hp/Downloads/RitualxGF screen menu.png',
    // Sampled from the artwork's own background (four corners checked, all matched).
    ground: '#FFF7CF',
  },
  {
    name: 'rmain',
    src: 'C:/Users/hp/Downloads/WhatsApp Image 2026-09-12 at 16.36.27 (1).jpeg',
    // Sampled from the lockup's sage background.
    ground: '#E5E5CD',
  },
];

for (const job of JOBS) {
  const outPath = `${OUT_DIR}/${job.name}.png`;
  await sharp(job.src)
    .flatten({ background: job.ground })
    .resize(1920, 1080, { fit: 'fill' }) // sources are already exact 16:9
    .png({ compressionLevel: 9, palette: true })
    .toFile(outPath);
  console.log(`${job.src} -> ${outPath}`);
}
