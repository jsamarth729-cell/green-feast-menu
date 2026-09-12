/* Offline tooling — not part of the live site.
   Prepares the three Ritual x Green Feast event takeover assets from raw
   source art kept outside the repo (one-off exports, unlike the recurring
   per-bowl/per-drink pipelines).

   Source -> output:
     rmenu  ("Today's Selection" menu poster)
       .../Marketing Resources/event/Untitled design.png (1672x941, opaque)
       -> images/events/rmenu.jpg
     rmain  (Ritual x Green Feast logo lockup)
       C:/Users/hp/Downloads/WhatsApp Image 2026-09-12 at 16.36.27 (1).jpeg
       (2560x1440, opaque)
       -> images/events/rmain.png

   Every image source is 16:9 to within a pixel, so that path is flatten
   (alpha -> ground colour) + resize to 1920x1080 + encode. The encoder is
   chosen PER JOB rather than globally, because the two differ in kind:
   rmenu embeds photographs and needs JPEG, rmain is flat brand art and
   stays lossless PNG. See each job's comment for the measurements.

     rwrap  (post-run carbs video, Screen 2's TV)
       C:/Users/hp/Downloads/Untitled design.mp4 (Canva export, 1920x1080,
       H.264 High, 30fps, no audio track, 55.33s)
       -> images/events/rwrap.mp4  + images/events/rwrap-poster.jpg

   The Canva export opens with exactly 5.000s of blank white before the
   first content frame (measured frame-by-frame, content starts at
   t=5.000s), which would show as a white flash on the wall every time the
   loop restarted. TRIM_START drops it.

   The cut is re-encoded rather than stream-copied on purpose: `-c copy`
   can only cut at a keyframe, so it would snap backwards to the nearest
   one and leave some white frames in. Re-encoding at CRF 20 cuts exactly
   and came out smaller than the source anyway (11.9MB -> 6.9MB), because
   Canva's export bitrate is generous for this material.

   `-movflags +faststart` puts the moov atom at the front so the TV can
   start playing while the file is still downloading over store wifi
   instead of waiting for the whole thing. The poster frame is extracted
   from the first kept frame so the screen shows content, not black, while
   that download happens.

   Run from the repo root: node build-event-art.mjs
*/
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

const OUT_DIR = 'images/events';
mkdirSync(OUT_DIR, { recursive: true });

/* rmenu's source carries a Canva export artifact: a pale, faintly blue
   rectangle down the right edge of the top-right region — measured at
   x >= 1653, y = 10..251, where the blue-minus-green channel mean is -2.2
   against -14.6 for the surrounding cream (i.e. it is desaturated, not
   cream). Upscaled to the board it becomes a ~21x288px lighter band in the
   top-right corner: subtle at wall distance, but still a visible defect on
   a customer-facing screen.

   Patched by mirroring the clean ground immediately BELOW the strip up over
   it. Using the same columns means the vertical seam lines up exactly, and
   that region is flat ground (per-channel stdev ~2, no botanical texture),
   so the join leaves nothing to see. The proper fix is a clean Canva
   re-export; this keeps the board correct until one exists. */
async function patchRmenuEdge(srcPath) {
  const STRIP = { left: 1652, top: 0, width: 20, height: 270 };
  const clean = await sharp(srcPath)
    .extract({ left: STRIP.left, top: 280, width: STRIP.width, height: STRIP.height })
    .flip() // vertical, so the mirrored ground meets the strip's lower edge
    .png()
    .toBuffer();
  return sharp(srcPath)
    .composite([{ input: clean, left: STRIP.left, top: STRIP.top }])
    .png()
    .toBuffer();
}

const JOBS = [
  {
    name: 'rmenu',
    // Revised design — replaced the original 8000x4500 cream/green poster.
    // NOTE this source is 1672x941, i.e. BELOW the 1920x1080 canvas, so it is
    // upscaled ~1.15x on export. Measured text heights still beat the old
    // artwork at board scale (kcal parentheticals 19.5px cap vs 14.9px
    // before), so it reads fine — but a native 1920x1080 or 2x Canva
    // re-export would be sharper if one ever becomes available.
    src: 'D:/Sam/SAMARTH STEPPING INTO BUSINESS/2026 I am Growing Greenfeast/Resources/Marketing Resources/event/Untitled design.png',
    // Averaged from the artwork's edge pixels. Unlike the old poster this
    // ground is not perfectly flat (botanical watermark), so this is the
    // representative edge tone rather than an exact match.
    ground: '#EFF1E2',
    // JPEG, not PNG: this design embeds PHOTOGRAPHS (smoothie cup, bowl,
    // dessert glass) plus soft gradients. A 256-colour palette PNG bands
    // them badly — measured max per-channel error 79/255 against lossless,
    // visible on a 40" panel — while lossless PNG costs 2.9MB. JPEG q95 at
    // 4:4:4 (no chroma subsampling, so the text edges stay crisp) lands at
    // 643KB with max error 21 and no ringing around letterforms, verified
    // by eye at 2x zoom on the item rows.
    ext: 'jpg',
    encode: (p) => p.jpeg({ quality: 95, chromaSubsampling: '4:4:4' }),
    prePatch: patchRmenuEdge,
  },
  {
    name: 'rmain',
    src: 'C:/Users/hp/Downloads/WhatsApp Image 2026-09-12 at 16.36.27 (1).jpeg',
    // Sampled from the lockup's sage background.
    ground: '#E5E5CD',
    // Lossless PNG here: the lockup is flat brand art with no photographic
    // content, so it stays pixel-exact for only 274KB. Not worth trading
    // any fidelity on a logo.
    ext: 'png',
    encode: (p) => p.png({ compressionLevel: 9 }),
  },
];

for (const job of JOBS) {
  const outPath = `${OUT_DIR}/${job.name}.${job.ext}`;
  const input = job.prePatch ? await job.prePatch(job.src) : job.src;
  const pipeline = sharp(input)
    .flatten({ background: job.ground })
    // fit:'fill' — every source is 16:9 to within a pixel, so this is a
    // sub-0.1% stretch, not a reframe. rmenu is upscaled here (see above).
    .resize(1920, 1080, { fit: 'fill' });
  await job.encode(pipeline).toFile(outPath);
  console.log(`${job.src} -> ${outPath}`);
}

/* ── rwrap video — trim the blank intro, then pull a poster frame ── */
const VIDEO_SRC   = 'C:/Users/hp/Downloads/Untitled design.mp4';
const TRIM_START  = '5.0'; // seconds of blank white at the head of the Canva export
const videoOut    = `${OUT_DIR}/rwrap.mp4`;
const posterOut   = `${OUT_DIR}/rwrap-poster.jpg`;

execFileSync(ffmpegPath, [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-ss', TRIM_START,
  '-i', VIDEO_SRC,
  '-c:v', 'libx264',
  '-crf', '20',
  '-preset', 'medium',
  '-pix_fmt', 'yuv420p',
  '-profile:v', 'high',
  '-movflags', '+faststart',
  '-an',                      // source has no audio track; muted either way
  videoOut,
]);
console.log(`${VIDEO_SRC} -> ${videoOut} (trimmed ${TRIM_START}s)`);

execFileSync(ffmpegPath, [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-i', videoOut,
  '-frames:v', '1',
  '-q:v', '3',
  posterOut,
]);
console.log(`${videoOut} -> ${posterOut}`);
