// Run: node --test .claude/hooks/skills-contract-check.test.mjs
// Proves the contract gate rejects an incomplete page contract and accepts a complete one, at the validator and through the real
// hook script, on a throwaway app tree (the gate takes its root from the edited file's own path).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContract } from './skills-contract-check.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const GATE = path.join(here, 'skills-code-gate.mjs');
const TEMPLATE = fs.readFileSync(path.join(here, '..', '..', 'docs', 'build', '02-design-contract-template.md'), 'utf8');

const MAP = `# Map
## D. Page specs
### D1. Thing
**Job:** find a thing.
**Primary:** Add a thing.

| Other action | Where | Why |
|---|---|---|
| Export | Header More | Occasional |

**Tasks**
- **Find:** Things -> type in Search -> rows narrow -> stays here.
- **Group:** View menu -> plain list.

**States:** Empty: a message. Error: Try again.
**Not on the page:** a KPI band.

### D2. Bare
**Job:** something.
**Primary:** Save.
**Task:** open -> change -> Save -> stays here.
**States:** Empty: a message.

## F. Task scripts
### Thing
| # | Start | Do | Result |
|---|---|---|---|
| T1 | a | b | c |
| T2 | a | b | c |

### Bare
| # | Start | Do | Result |
|---|---|---|---|
| R1 | a | b | c |
`;

const STANDALONE = {
  job: '## Single job\nFind any skill and act on it.',
  primary: '## Primary action\nAdd a skill, always enabled.',
  other: '## Other actions\n| Action | Where | Why |\n|---|---|---|\n| Export | Header More | Occasional |',
  tasks: '## Tasks\n| Task | Entry | Steps | Finish | Landing |\n|---|---|---|---|---|\n| Find | Library | Type in Search | Rows narrow | Stays here |',
  states: '## States\nEmpty: a message.\nError: Try again.',
  notOn: '## Not on this page\nA KPI band.',
  ids: '## Task test IDs\nX1',
};
const standalone = (omit) => Object.entries(STANDALONE).filter(([k]) => k !== omit).map(([, v]) => v).join('\n\n');

const POINTER_D1 = `Page spec: docs/map.md#D1

## Tasks
| Task | Entry | Steps | Finish | Landing |
|---|---|---|---|---|
| Group | Library | View menu, choose Plain list | The list loses its group rows | Stays on Library |

## Task test IDs
T1, T2
`;
const ENTRY = { id: 'D1', page: 'Thing', contract: 'ADMIN-D1.md', mapSection: 'D1', taskSection: 'Thing', mapFile: 'docs/map.md', files: ['admin/components/thing.tsx'] };

function tree() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'contract-gate-'));
  const root = path.join(base, 'apps', 'skills-checklist');
  fs.mkdirSync(path.join(root, 'docs', 'build', 'contracts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'map.md'), MAP);
  return root;
}
const withRegistry = (root) => fs.writeFileSync(path.join(root, 'docs/build/contracts/_page-registry.json'), JSON.stringify({ mapFile: 'docs/map.md', pages: [ENTRY] }));
const contract = (root, name, text) => fs.writeFileSync(path.join(root, 'docs/build/contracts', name), text);
function gate(fp) {
  return spawnSync('node', [GATE], { input: JSON.stringify({ tool_input: { file_path: fp } }), encoding: 'utf8' });
}

test('a complete standalone contract is accepted', () => {
  assert.deepEqual(validateContract({ text: standalone(), root: tree() }), []);
});

for (const key of Object.keys(STANDALONE)) {
  test(`a contract missing "${key}" is rejected`, () => {
    const errs = validateContract({ text: standalone(key), root: tree() });
    assert.ok(errs.length > 0, 'expected rejection');
  });
}

test('other actions without a Where and Why column are rejected', () => {
  const text = standalone().replace(STANDALONE.other, '## Other actions\n| Action |\n|---|\n| Export |');
  assert.match(validateContract({ text, root: tree() }).join(), /missing column/);
});

test('a task without a landing is rejected', () => {
  const text = standalone().replace(STANDALONE.tasks, '## Tasks\n| Task | Entry | Steps | Finish |\n|---|---|---|---|\n| Find | Library | Type | Rows narrow |');
  assert.match(validateContract({ text, root: tree() }).join(), /Landing/);
});

test('a task with an empty cell is rejected', () => {
  const text = standalone().replace('| Stays here |', '|  |');
  assert.match(validateContract({ text, root: tree() }).join(), /empty cell/);
});

test('the template copied without being filled is rejected', () => {
  assert.ok(validateContract({ text: TEMPLATE, root: tree() }).length > 0);
});

test('a map contract supplying only the gaps is accepted', () => {
  assert.deepEqual(validateContract({ text: POINTER_D1, root: tree(), entry: ENTRY }), []);
});

test('a map contract restating the map is rejected', () => {
  const errs = validateContract({ text: `${POINTER_D1}\n## Single job\nFind a thing.\n`, root: tree(), entry: ENTRY });
  assert.match(errs.join(), /restates map section D1/);
});

test('a map contract with no pointer is rejected', () => {
  assert.match(validateContract({ text: standalone(), root: tree(), entry: ENTRY }).join(), /Page spec/);
});

test('a pointer at a heading that does not exist is rejected', () => {
  const errs = validateContract({ text: POINTER_D1.replace('#D1', '#D99'), root: tree() });
  assert.match(errs.join(), /no heading/);
});

test('a map contract dropping a section F task is rejected', () => {
  assert.match(validateContract({ text: POINTER_D1.replace('T1, T2', 'T1'), root: tree(), entry: ENTRY }).join(), /missing T2/);
});

test('a map contract inventing a task ID is rejected', () => {
  assert.match(validateContract({ text: POINTER_D1.replace('T1, T2', 'T1, T2, T9'), root: tree(), entry: ENTRY }).join(), /T9 not in section F/);
});

test('a map task short of entry, steps, finish, landing needs a row', () => {
  const noRow = POINTER_D1.replace(/## Tasks[\s\S]*?(?=## Task test IDs)/, '');
  assert.match(validateContract({ text: noRow, root: tree(), entry: ENTRY }).join(), /task "Group"/);
});

test('what the map section lacks must be supplied', () => {
  const entry = { ...ENTRY, mapSection: 'D2', taskSection: 'Bare' };
  const errs = validateContract({ text: 'Page spec: docs/map.md#D2\n\n## Task test IDs\nR1\n', root: tree(), entry }).join('\n');
  assert.match(errs, /Other actions/);
  assert.match(errs, /Not on this page/);
});

// Through the real hook script.
test('hook: a registered page with no contract is blocked', () => {
  const root = tree(); withRegistry(root);
  contract(root, 'S-old.md', 'an older contract');
  const r = gate(path.join(root, 'admin/components/thing.tsx'));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /no contract ADMIN-D1.md/);
});

test('hook: a draft does not unlock a registered page', () => {
  const root = tree(); withRegistry(root);
  contract(root, '_draft-ADMIN-D1.md', POINTER_D1);
  const r = gate(path.join(root, 'admin/components/thing.tsx'));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /only a draft/);
});

test('hook: an incomplete contract is blocked and the reasons are shown', () => {
  const root = tree(); withRegistry(root);
  contract(root, 'ADMIN-D1.md', 'Surface: thing\nJob-to-be-done: find things\n');
  const r = gate(path.join(root, 'admin/components/thing.tsx'));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Page spec/);
  assert.match(r.stderr, /Task test IDs/);
});

test('hook: a complete contract lets the edit through', () => {
  const root = tree(); withRegistry(root);
  contract(root, 'ADMIN-D1.md', POINTER_D1);
  assert.equal(gate(path.join(root, 'admin/components/thing.tsx')).status, 0);
});

test('hook: older contracts are not blocked when their page is not registered', () => {
  const root = tree(); withRegistry(root);
  contract(root, 'S-old.md', 'an older contract with none of the new sections');
  assert.equal(gate(path.join(root, 'admin/components/other-page.tsx')).status, 0);
});

test('hook: with no contract at all, code is still blocked', () => {
  const r = gate(path.join(tree(), 'admin/components/other-page.tsx'));
  assert.equal(r.status, 2);
});

test('hook: docs and tests of the gate itself are not blocked', () => {
  const root = tree(); withRegistry(root);
  assert.equal(gate(path.join(root, 'docs/build/contracts/ADMIN-D1.md')).status, 0);
  assert.equal(gate(path.join(root, '.claude/hooks/x.mjs')).status, 0);
});

test('hook: a worktree path is gated against its own docs', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wt-'));
  const root = path.join(base, '.claude', 'worktrees', 'x', 'apps', 'skills-checklist');
  fs.mkdirSync(path.join(root, 'docs', 'build', 'contracts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'map.md'), MAP);
  withRegistry(root);
  assert.equal(gate(path.join(root, 'admin/components/thing.tsx')).status, 2);
});
