#!/usr/bin/env node
// Page contract validator. Used by skills-code-gate.mjs and by hand:
//   node .claude/hooks/skills-contract-check.mjs <contract.md>   validate one contract (exit 1 if invalid)
//   node .claude/hooks/skills-contract-check.mjs --all           validate every page in docs/build/contracts/_page-registry.json
//   node .claude/hooks/skills-contract-check.mjs --needs         for each registered page, say what its contract must supply
//
// A page contract must carry: the single job; the primary action; a table of every other action with where it lives and why;
// each task as entry, steps, finish, landing; states; what must not be on the page; task test IDs.
//
// Two shapes. A page specified in the admin workflow map has a "Page spec:" line pointing at its section D heading. Whatever that
// section already says must NOT be restated (so nobody rewrites the spec); the contract supplies only what the section lacks, plus
// the task test IDs, which must cover every row of that page's section F table. Any other page carries all seven as its own sections.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REGISTRY_REL = path.join('docs', 'build', 'contracts', '_page-registry.json');
export const CONTRACTS_REL = path.join('docs', 'build', 'contracts');

export const HEADINGS = {
  job: 'Single job',
  primary: 'Primary action',
  other: 'Other actions',
  tasks: 'Tasks',
  states: 'States',
  notOn: 'Not on this page',
  ids: 'Task test IDs',
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Text of each "## Heading" section, keyed by lower-case heading. */
export function sections(text) {
  const out = {};
  const parts = text.split(/^##[ \t]+(.+?)[ \t]*$/m);
  for (let i = 1; i < parts.length; i += 2) out[parts[i].toLowerCase()] = parts[i + 1].trim();
  return out;
}

/** First markdown table in the text: header cells (lower case) and data rows. */
export function table(text) {
  const rows = text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|'));
  if (rows.length < 2) return null;
  const cells = (l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const isRule = (l) => /^\|[\s:|-]+\|?$/.test(l);
  return { header: cells(rows[0]).map((c) => c.toLowerCase()), rows: rows.slice(1).filter((l) => !isRule(l)).map(cells) };
}

function tableErrors(body, label, want) {
  const t = table(body);
  if (!t) return [`${label}: needs a table with columns ${want.join(', ')}`];
  const missing = want.filter((w) => !t.header.some((h) => h.startsWith(w.toLowerCase())));
  if (missing.length) return [`${label}: table is missing column(s) ${missing.join(', ')}`];
  if (!t.rows.length) return [`${label}: table has no rows`];
  if (t.rows.some((r) => r.length < want.length || r.slice(0, want.length).some((c) => !c))) return [`${label}: table has an empty cell`];
  return [];
}

/** One section of the map by its id (D1, D1a ...), or null. */
export function mapSection(mapText, id) {
  const m = mapText.match(new RegExp(`^###\\s+${esc(id)}\\.\\s.*$`, 'm'));
  if (!m) return null;
  const rest = mapText.slice(m.index + m[0].length);
  const end = rest.search(/^#{2,3}\s/m);
  return end === -1 ? rest : rest.slice(0, end);
}

/** Task IDs in one section F table (for example the "### Library" table under "## F."). */
export function mapTaskIds(mapText, taskSection) {
  const f = mapText.split(/^##\s+F\./m)[1];
  if (!f) return null;
  const body = f.split(/^##\s/m)[0];
  const m = body.match(new RegExp(`^###\\s+${esc(taskSection)}\\s*$`, 'm'));
  if (!m) return null;
  const rest = body.slice(m.index + m[0].length);
  const end = rest.search(/^###\s/m);
  return [...(end === -1 ? rest : rest.slice(0, end)).matchAll(/^\|\s*([A-Z]{1,3}\d+)\s*\|/gm)].map((x) => x[1]);
}

const nameOf = (s) => {
  const colon = s.indexOf(':');
  const arrow = s.indexOf('->');
  if (colon > 0 && colon < 40 && (arrow === -1 || colon < arrow)) return s.slice(0, colon).replace(/\*/g, '').trim();
  return s.split('->')[0].replace(/\*/g, '').trim().slice(0, 40);
};
const arrows = (s) => (s.match(/->/g) || []).length;
/** Split prose on sentence ends, never inside a quoted banner such as "Saved. Two groups assigned." */
function sentences(line) {
  const out = [];
  let start = 0;
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') quoted = !quoted;
    if (!quoted && line[i] === '.' && /^\s+[A-Z]/.test(line.slice(i + 1))) { out.push(line.slice(start, i + 1)); start = i + 1; }
  }
  out.push(line.slice(start));
  return out.map((x) => x.trim()).filter(Boolean);
}

/** Tasks a map section states: { full: table of entry/steps/finish/landing present, tasks: [{name, complete}] }. */
export function mapTasks(sec) {
  const tasks = [];
  for (const m of sec.matchAll(/^- \*\*(.+?):?\*\*:?\s*(.*)$/gm)) tasks.push({ name: m[1].replace(/:$/, ''), complete: arrows(m[2]) >= 3 });
  for (const m of sec.matchAll(/(?:\*\*Tasks?:\*\*|(?:^|\s)Task:)\s*(.+)$/gm)) {
    const line = m[1].split(/\s(?:\*\*)?States:/)[0];
    for (const piece of sentences(line)) {
      if (arrows(piece)) tasks.push({ name: nameOf(piece), complete: arrows(piece) >= 3 });
    }
  }
  const full = sec.split('\n\n').some((block) => {
    const t = table(block);
    return t && ['entry', 'steps', 'finish', 'land'].every((w) => t.header.some((h) => h.startsWith(w))) && t.rows.length > 0;
  });
  return { full, tasks };
}

/** What a map section already holds, for each contract element. */
export function mapHas(sec) {
  const other = sec.split('\n\n').some((block) => {
    const t = table(block);
    return t && t.header[0]?.startsWith('other action') && t.rows.length > 0;
  });
  const { full, tasks } = mapTasks(sec);
  return {
    job: /\*\*Job:\*\*\s*\S/.test(sec),
    primary: /\*\*Primary:\*\*\s*\S|^Primary:\s*\S/m.test(sec),
    other,
    tasks: full || tasks.length > 0,
    states: /(?:\*\*)?States:(?:\*\*)?\s*\S/.test(sec),
    notOn: /\*\*Not (?:on|here)[^*]*\*\*\s*\S|Must not:\s*\S/.test(sec),
  };
}

function ownSectionErrors(s, key) {
  const label = HEADINGS[key];
  const body = s[label.toLowerCase()];
  if (body === undefined || !body.trim()) return [`missing section "## ${label}"`];
  if (key === 'other') return tableErrors(body, label, ['Action', 'Where', 'Why']);
  if (key === 'tasks') return tableErrors(body, label, ['Task', 'Entry', 'Steps', 'Finish', 'Landing']);
  if (key === 'states' && (body.match(/^[-*\s|]*[A-Z][^:\n|]{0,40}:|\|\s*[A-Z][^|\n]{0,40}\|/gm) || []).length < 2) {
    return [`${label}: name at least two states, each as "State: what shows"`];
  }
  return [];
}

function placeholderErrors(s) {
  const errs = [];
  for (const label of Object.values(HEADINGS)) {
    const body = s[label.toLowerCase()];
    if (body && (/<[a-zA-Z][^>\n]*>/.test(body) || /\b(TBD|TODO)\b/i.test(body))) errs.push(`${label}: still has a placeholder (<...>, TBD or TODO)`);
  }
  return errs;
}

/** Errors for one contract. `entry` is its registry row when there is one. */
export function validateContract({ text, root, entry }) {
  const errs = [];
  const s = sections(text);
  const pointer = text.match(/^\s*Page spec:\s*(\S+?)#([A-Za-z0-9]+)\s*$/m);
  errs.push(...placeholderErrors(s));

  if (entry?.mapSection && !pointer) errs.push(`needs a line "Page spec: ${entry.mapFile}#${entry.mapSection}" pointing at the map; do not rewrite the spec here`);
  if (entry?.mapSection && pointer && pointer[2] !== entry.mapSection) errs.push(`Page spec points at ${pointer[2]}, this page is ${entry.mapSection}`);

  const idsBody = s[HEADINGS.ids.toLowerCase()];
  const ids = [...new Set((idsBody || '').match(/\b[A-Z]{1,3}\d+\b/g) || [])];
  if (!ids.length) errs.push(`missing section "## ${HEADINGS.ids}" with at least one ID`);

  if (!pointer) {
    for (const key of ['job', 'primary', 'other', 'tasks', 'states', 'notOn']) errs.push(...ownSectionErrors(s, key));
    const t = table(s.tasks || '');
    if (t && ids.length && ids.length < t.rows.length) errs.push(`${HEADINGS.ids}: ${ids.length} ID(s) for ${t.rows.length} task(s); every task needs one`);
    return errs;
  }

  const mapPath = path.join(root, pointer[1]);
  if (!fs.existsSync(mapPath)) return [...errs, `Page spec file not found: ${pointer[1]}`];
  const mapText = fs.readFileSync(mapPath, 'utf8');
  const sec = mapSection(mapText, pointer[2]);
  if (!sec) return [...errs, `Page spec: no heading "### ${pointer[2]}." in ${pointer[1]}`];

  const has = mapHas(sec);
  for (const key of ['job', 'primary', 'other', 'states', 'notOn']) {
    const here = s[HEADINGS[key].toLowerCase()] !== undefined;
    if (has[key] && here) errs.push(`"## ${HEADINGS[key]}" restates map section ${pointer[2]}; delete it, the map is the spec`);
    if (!has[key]) errs.push(...ownSectionErrors(s, key).map((e) => `map section ${pointer[2]} lacks this, so the contract must supply it: ${e}`));
  }

  const { tasks } = mapTasks(sec);
  const short = tasks.filter((t) => !t.complete);
  const body = s.tasks;
  if (!has.tasks) errs.push(...ownSectionErrors(s, 'tasks').map((e) => `map section ${pointer[2]} lacks this, so the contract must supply it: ${e}`));
  else if (body !== undefined) {
    if (!short.length) errs.push(`"## Tasks" restates map section ${pointer[2]}, whose tasks are all complete; delete it`);
    errs.push(...tableErrors(body, 'Tasks', ['Task', 'Entry', 'Steps', 'Finish', 'Landing']));
  }
  const rows = (table(body || '')?.rows || []).map((r) => r[0].toLowerCase());
  for (const t of short) {
    if (!rows.some((r) => r.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(r))) {
      errs.push(`task "${t.name}" in map section ${pointer[2]} is not stated as entry, steps, finish, landing; add one row for it under "## Tasks"`);
    }
  }

  const taskSection = entry?.taskSection;
  if (taskSection) {
    const wanted = mapTaskIds(mapText, taskSection);
    if (!wanted) errs.push(`no section F table "### ${taskSection}" in ${pointer[1]}`);
    else {
      const missing = wanted.filter((id) => !ids.includes(id));
      const unknown = ids.filter((id) => !wanted.includes(id));
      if (missing.length) errs.push(`${HEADINGS.ids}: missing ${missing.join(', ')} from section F "${taskSection}"`);
      if (unknown.length) errs.push(`${HEADINGS.ids}: ${unknown.join(', ')} not in section F "${taskSection}"`);
    }
  }
  return errs;
}

export function readRegistry(root) {
  const p = path.join(root, REGISTRY_REL);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

/** Glob with * (within a path segment) and ** (across segments), against a path relative to the app root. */
export function globToRegex(glob) {
  const re = glob.split('**').map((part) => part.split('*').map(esc).join('[^/]*')).join('.*');
  return new RegExp(`^${re}$`);
}

export function entriesForFile(registry, rel) {
  const r = rel.split(path.sep).join('/');
  return (registry?.pages || []).filter((p) => p.files.some((g) => globToRegex(g).test(r))).map((p) => ({ ...p, mapFile: registry.mapFile }));
}

/** Errors for one registered page: the contract must exist, be confirmed (no _draft- prefix) and be complete. */
export function pageErrors(root, entry) {
  const p = path.join(root, CONTRACTS_REL, entry.contract);
  if (!fs.existsSync(p)) {
    const draft = fs.existsSync(path.join(root, CONTRACTS_REL, `_draft-${entry.contract}`));
    return [draft ? `only a draft exists (_draft-${entry.contract}); Romit confirms by renaming it` : `no contract ${entry.contract}`];
  }
  return validateContract({ text: fs.readFileSync(p, 'utf8'), root, entry });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = process.argv[2];
  if (!arg) { console.error('usage: skills-contract-check.mjs <contract.md> | --all | --needs'); process.exit(2); }
  const registry = readRegistry(defaultRoot);
  const pages = (registry?.pages || []).map((p) => ({ ...p, mapFile: registry.mapFile }));
  if (arg === '--all') {
    let bad = 0;
    for (const e of pages) {
      const errs = pageErrors(defaultRoot, e);
      console.log(`${errs.length ? 'FAIL' : 'PASS'} ${e.id} ${e.page}`);
      for (const x of errs) console.log(`  ${x}`);
      if (errs.length) bad++;
    }
    console.log(`\n${pages.length - bad} of ${pages.length} pages have a valid contract`);
    process.exit(bad ? 1 : 0);
  }
  if (arg === '--needs') {
    const map = fs.readFileSync(path.join(defaultRoot, registry.mapFile), 'utf8');
    for (const e of pages) {
      const sec = mapSection(map, e.mapSection);
      const has = mapHas(sec);
      const lacks = Object.keys(has).filter((k) => !has[k]).map((k) => HEADINGS[k]);
      const short = mapTasks(sec).tasks.filter((t) => !t.complete).map((t) => t.name);
      const ids = mapTaskIds(map, e.taskSection) || [];
      console.log(`${e.id} ${e.page}: Page spec line; ${ids.length} task IDs${lacks.length ? `; own section(s): ${lacks.join(', ')}` : ''}${short.length ? `; task rows for: ${short.join(' | ')}` : ''}`);
    }
    process.exit(0);
  }
  const file = path.resolve(arg);
  const m = file.match(/^(.*\/apps\/skills-checklist)\//);
  const root = m ? m[1] : defaultRoot;
  const reg = readRegistry(root);
  const row = (reg?.pages || []).find((p) => p.contract === path.basename(file).replace(/^_draft-/, ''));
  const errs = validateContract({ text: fs.readFileSync(file, 'utf8'), root, entry: row ? { ...row, mapFile: reg.mapFile } : undefined });
  if (errs.length) { console.log(`INVALID ${path.basename(file)}`); for (const x of errs) console.log(`  ${x}`); process.exit(1); }
  console.log(`VALID ${path.basename(file)}`);
}
