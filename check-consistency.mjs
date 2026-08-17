/* ═══════════════════════════════════════════════════════════════
   CONSISTENCY CHECK — run manually before pushing.

       node check-consistency.mjs

   The same conceptual element exists under a different class name on
   every board: "Item Name" is .tile-name on Screen 1, .panini-item-name
   and .toast-name and .wrap-name on Screen 2, .smoothie-name and
   .coffee-name on Screen 3. Six selectors, three files. Changing five
   of six and shipping is the default outcome, not the unlucky one —
   that is exactly how .panini-item-desc ended up at 17px against 16px
   everywhere else.

   This script reads the boards' CSS and reports:
     1. Canonical elements using a literal size instead of a token.
     2. Literal sizes that disagree across screens (actual drift).
     3. Fixed heights welded to a font size that a token change would
        silently clip.

   Offline tooling. Not part of the live site, never loaded by a board.
   See DESIGN-PRINCIPLES.md §12.
══════════════════════════════════════════════════════════════════ */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

/* The vocabulary from DESIGN-PRINCIPLES.md §12, mapped to what each
   board actually calls it. Add a screen's selectors here when you
   build it — Screen 4 will need its own entries. */
const CANONICAL = {
  'Item Name': [
    ['bowls.css',     'tile-name'],
    ['wraps.css',     'panini-item-name'],
    ['wraps.css',     'toast-name'],
    ['wraps.css',     'wrap-name'],
    ['beverages.css', 'smoothie-name'],
    ['beverages.css', 'coffee-name'],
  ],
  'Item Desc': [
    ['bowls.css',     'tile-desc'],
    ['wraps.css',     'panini-item-desc'],
    ['wraps.css',     'toast-desc'],
    ['wraps.css',     'wrap-desc'],
    ['beverages.css', 'smoothie-desc'],
    ['beverages.css', 'coffee-desc'],
  ],
  'Item Price': [
    ['bowls.css',     'tile-price'],
    ['wraps.css',     'panini-item-price'],
    ['wraps.css',     'toast-price'],
    ['wraps.css',     'wrap-price'],
    ['beverages.css', 'smoothie-price'],
    ['beverages.css', 'coffee-price'],
  ],
};

/* ─── Read the CSS once ─────────────────────────────────────── */
const files = {};
for (const file of new Set(Object.values(CANONICAL).flat().map(([f]) => f))) {
  const path = join(ROOT, file);
  if (!existsSync(path)) {
    console.error(`✗ missing file: ${file}`);
    process.exit(1);
  }
  files[file] = readFileSync(path, 'utf8');
}

/* Pull one declaration out of a top-level rule block. Good enough for
   this codebase: every canonical selector is a single flat class rule
   at column 0, no nesting, no media queries. */
function decl(css, selector, property) {
  const rule = css.match(
    new RegExp('^\\.' + selector + '\\s*\\{([^}]*)\\}', 'm')
  );
  if (!rule) return { missing: true };

  const line = css.slice(0, rule.index).split('\n').length;
  const found = rule[1].match(
    new RegExp('(^|\\n)\\s*' + property + '\\s*:\\s*([^;]+);')
  );
  if (!found) return { missing: true, line };

  const value = found[2].trim();
  const commented = /\/\*/.test(rule[1].split(found[0])[1] || '');
  return { value, line, isToken: value.startsWith('var('), commented };
}

/* ─── 1 + 2. Canonical elements ─────────────────────────────── */
const problems = [];
console.log('\n  CANONICAL ELEMENTS — font-size\n');

for (const [element, targets] of Object.entries(CANONICAL)) {
  console.log(`  ${element}`);
  const literals = new Map();

  for (const [file, selector] of targets) {
    const d = decl(files[file], selector, 'font-size');

    if (d.missing) {
      console.log(`    ?  .${selector.padEnd(20)} — no font-size found  (${file})`);
      problems.push(`${element}: .${selector} has no font-size — selector renamed?`);
      continue;
    }

    if (d.isToken) {
      console.log(`    ok .${selector.padEnd(20)} ${d.value}`);
    } else {
      const note = d.commented ? ' (commented)' : '';
      console.log(`    !  .${selector.padEnd(20)} ${d.value.padEnd(10)} literal${note}  ${file}:${d.line}`);
      if (!d.commented) {
        problems.push(`${element}: .${selector} uses literal ${d.value} (${file}:${d.line})`);
      }
      literals.set(d.value, (literals.get(d.value) || 0) + 1);
    }
  }

  if (literals.size > 1) {
    const spread = [...literals.entries()].map(([v, n]) => `${v}×${n}`).join(', ');
    console.log(`    →  DRIFT: ${spread}`);
    problems.push(`${element}: literal sizes disagree across screens — ${spread}`);
  }
  console.log('');
}

/* ─── 3. Heights welded to a font size ──────────────────────── */
console.log('  FIXED HEIGHTS ON DESCRIPTIONS\n');
let welded = 0;

for (const [file, selector] of CANONICAL['Item Desc']) {
  const h = decl(files[file], selector, 'height');
  if (h.missing || h.value === undefined) continue;
  if (h.value.includes('calc(')) {
    console.log(`    ok .${selector.padEnd(20)} ${h.value}`);
    continue;
  }
  console.log(`    !  .${selector.padEnd(20)} height: ${h.value.padEnd(8)} fixed  ${file}:${h.line}`);
  problems.push(
    `Item Desc: .${selector} has fixed height ${h.value} — raising the font size will ` +
    `clip the text instead of reflowing it (${file}:${h.line}). Derive it with calc().`
  );
  welded++;
}
if (!welded) console.log('    none');

/* ─── Verdict ───────────────────────────────────────────────── */
console.log('\n  ─────────────────────────────────────────────\n');
if (!problems.length) {
  console.log('  ✓ consistent — safe to push\n');
  process.exit(0);
}
console.log(`  ✗ ${problems.length} issue${problems.length > 1 ? 's' : ''}:\n`);
for (const p of problems) console.log(`    • ${p}`);
console.log('\n  See DESIGN-PRINCIPLES.md §12.\n');
process.exit(1);
