#!/usr/bin/env node
/**
 * ds source — print the REAL @exxatdesignux/ui API for a component, from the
 * installed package's dist .d.ts. This is the canonical "read the real DS
 * before writing JSX" step. It deliberately bypasses interpreted markdown
 * (ds-snapshot.json, *-reference.md) which drift from the package.
 *
 * Usage:
 *   node tools/ds/source.mjs Button Badge ListPageTemplate
 *   node tools/ds/source.mjs --list            # all exported names
 *
 * Output per component: installed version (drift check), the exact import line,
 * the live viewer URL to eyeball, and the real type surface (props/variants/sizes).
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';

// Resolve the installed package — prefer a real product app, not a hoisted copy.
const CANDIDATES = [
  'apps/exam-management/admin/node_modules/@exxatdesignux/ui',
  'apps/pce/admin/node_modules/@exxatdesignux/ui',
  'apps/portal/node_modules/@exxatdesignux/ui',
  'node_modules/@exxatdesignux/ui',
];
const ROOT = '/Users/romitsoley/Work';
const pkgDir = CANDIDATES.map((c) => join(ROOT, c)).find((p) => existsSync(join(p, 'dist/index.d.ts')));
if (!pkgDir) {
  console.error('Could not find installed @exxatdesignux/ui. Run pnpm install in a product app.');
  process.exit(1);
}
const version = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')).version;
const indexDts = readFileSync(join(pkgDir, 'dist/index.d.ts'), 'utf8');
const lines = indexDts.split('\n');

// Map every exported name -> { source .d.ts file, the full export line }
const exportMap = new Map();
for (const line of lines) {
  const m = line.match(/^export\s*\{([^}]*)\}\s*from\s*'(\.[^']+)'/);
  if (!m) continue;
  const file = m[2].replace(/\.js$/, '.d.ts');
  for (let name of m[1].split(',')) {
    name = name.trim().replace(/^\w+\s+as\s+/, ''); // handle `A as ALL_...`
    if (name) exportMap.set(name, { file, line: line.trim() });
  }
}

const args = process.argv.slice(2);
if (args[0] === '--list' || args.length === 0) {
  console.log(`@exxatdesignux/ui@${version} — ${exportMap.size} exports\n`);
  console.log([...exportMap.keys()].sort().join('  '));
  if (args.length === 0) console.log('\nUsage: node tools/ds/source.mjs <Component...>');
  process.exit(0);
}

console.log(`\n@exxatdesignux/ui@${version}  (installed — the source of truth)`);
console.log(`CSS: @import '@exxatdesignux/ui/globals.css'\n`);

for (const name of args) {
  const hit = exportMap.get(name);
  console.log('─'.repeat(72));
  if (!hit) {
    const near = [...exportMap.keys()].filter((k) => k.toLowerCase().includes(name.toLowerCase())).slice(0, 8);
    console.log(`✗ "${name}" is NOT exported by @exxatdesignux/ui@${version}.`);
    if (near.length) console.log(`  Did you mean: ${near.join(', ')}`);
    else console.log(`  Run --list to see all exports. Do NOT hand-roll it — check VENDOR/IMPORT policy.`);
    console.log('');
    continue;
  }
  const parts = hit.file.replace(/\.d\.ts$/, '').split('/');
  let libId = parts.pop();
  if (libId === 'index') libId = parts.pop() || 'index'; // data-table/index → data-table
  console.log(`● ${name}`);
  console.log(`  import { ${name} } from '@exxatdesignux/ui'`);
  console.log(`  live:   http://localhost:4000/library/${libId}   ← open to verify pattern/visual`);
  console.log(`  types:  ${hit.file}\n`);
  const dts = join(pkgDir, 'dist', hit.file.replace(/^\.\//, ''));
  if (existsSync(dts)) {
    const body = readFileSync(dts, 'utf8')
      .split('\n')
      .filter((l) => !/^import\s/.test(l))   // drop import noise; keep the type surface
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    console.log(body.split('\n').map((l) => '    ' + l).join('\n'));
  } else {
    console.log(`    (type file not found at ${dts})`);
  }
  console.log('');
}
console.log('─'.repeat(72));
console.log('Generate AGAINST the types above + the live route. Not from memory, not from *-reference.md.');
