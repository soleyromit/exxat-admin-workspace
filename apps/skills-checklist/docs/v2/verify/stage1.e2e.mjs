#!/usr/bin/env node
// End-to-end drive of the Stage 1 admin flow against the running dev server (default http://localhost:3007).
//
//   node docs/v2/verify/stage1.e2e.mjs [--base http://localhost:3007]
//
// import -> confirm -> configure -> publish blocked by an injected error, then fixed -> publish -> map -> reload ->
// state persisted -> Reset demo restores. Each check prints PASS or FAIL with what it saw. Exit code 1 on any FAIL.
// Playwright is resolved from /Users/romitsoley/Work/tools/visual-check (it is not installed in the app).

import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TOOLS = path.resolve(HERE, '../../../../../tools/visual-check')
const { chromium } = createRequire(path.join(TOOLS, 'package.json'))('playwright')
const SAMPLE_PDF = path.resolve(HERE, '../../../admin/public/v2/sample-skills-checklist.pdf')

const args = process.argv.slice(2)
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'http://localhost:3007'
const KEY = 'skills-checklist:v2:store'

let failures = 0
const check = (name, ok, seen) => {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${seen === undefined ? '' : `  (saw: ${typeof seen === 'string' ? seen : JSON.stringify(seen)})`}`)
}
const step = (t) => console.log(`\n== ${t}`)

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
const page = await ctx.newPage()
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)))

const store = () => page.evaluate((k) => { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw).state : null }, KEY)
const open = async (route) => { await page.goto(base + route, { waitUntil: 'load' }); await page.waitForSelector('h1'); await page.waitForTimeout(600) }
const skill = (s, id) => s.skills.find((k) => k.id === id)
const IV = 'sk-iv-cath'

try {
  // ------------------------------------------------------------------ 1. import
  step('1. Import a PDF, review, confirm')
  await open('/v2/admin/starter-library')
  check('library starts with 31 skills, 4 still to configure', (await page.getByText(/31 skills in the library, 4 still to configure/).count()) === 1)
  await page.getByRole('tab', { name: 'Import from a file' }).click()
  await page.locator('#v2-import-file').setInputFiles(SAMPLE_PDF)
  await page.getByText(/11 proposed skills from sample-skills-checklist.pdf/).waitFor({ timeout: 15000 })
  check('PDF read through the local extractor: 11 proposals', true)
  check('source line shown beside a proposal', (await page.getByText('1. Tracheostomy suctioning - open and closed system').count()) >= 1)
  check('unread lines reported with original text (IM-08)', (await page.getByText('Signature of unit educator: ______________').count()) === 1)
  check('duplicate flagged (IM-06)', (await page.getByText('Repeats Oral medication administration').count()) === 1)
  check('Create is disabled until something is accepted', await page.getByRole('button', { name: 'Create 0 skills' }).isDisabled())
  let s = await store()
  check('nothing created before the confirm (store has no import batch, still 31 skills)', (s?.skills.length ?? 31) === 31 && (s?.batches.length ?? 0) === 0, { skills: s?.skills.length, batches: s?.batches.length })

  await page.getByRole('button', { name: 'Accept all 11' }).click()
  await page.getByRole('radio', { name: 'Reject Fall risk bundle' }).click()
  await page.getByRole('button', { name: 'Edit Telemetry lead placement' }).click()
  await page.locator('#edit-skill-name').fill('Telemetry lead placement, 5 lead')
  await page.getByRole('button', { name: 'Save skill' }).click()
  check('Create label counts accepted rows (10 after one reject)', await page.getByRole('button', { name: 'Create 10 skills' }).isEnabled())
  await page.getByRole('button', { name: 'Create 10 skills' }).click()
  await page.getByText(/10 skills created from sample-skills-checklist.pdf/).waitFor()
  s = await store()
  const batch = s.batches[0]
  const made = batch.skillIds.map((id) => skill(s, id))
  check('10 skills created in one batch', s.skills.length === 41 && made.length === 10, { skills: s.skills.length })
  check('created unconfigured, no model, not in use (IM-09, SC-01)', made.every((k) => k.model === null && !k.configured && !k.published && k.config === null))
  check('edited name carried through, rejected row absent', made.some((k) => k.name === 'Telemetry lead placement, 5 lead') && !made.some((k) => k.name === 'Fall risk bundle'))
  check('category taken from the heading', made.find((k) => k.name === 'Tracheostomy suctioning')?.category === 'Respiratory care')
  check('audit entry written', s.audit[0].action === 'Imported 10 skills', s.audit[0].action)
  check('library counter rose: 14 still to configure', (await page.getByText(/41 skills in the library, 14 still to configure/).count()) === 1)

  // starter library copy
  await page.getByRole('tab', { name: 'Starter libraries' }).click()
  await page.getByRole('button', { name: 'Review Radiography skills' }).click()
  await page.getByRole('button', { name: /^Copy 5 skills$/ }).click()
  await page.getByText(/5 skills copied from Radiography/).waitFor()
  s = await store()
  check('starter copy: 5 added (1 duplicate skipped), batch 2', s.skills.length === 46 && s.batches.length === 2 && s.batches[1].kind === 'starter-library', { skills: s.skills.length })

  // ------------------------------------------------------------------ 2. configure
  step('2. Configure IV catheter insertion, inject an error')
  await open('/v2/admin/configure-skill')
  check('wizard has 8 steps', (await page.getByRole('navigation', { name: /Wizard steps, 8 total/ }).count()) === 1)
  check('binary pre-selection does not override the saved demonstration model', await page.locator('#wiz-model-demonstration').getAttribute('aria-checked') === 'true')
  await page.getByRole('button', { name: 'Next: Achievement rules' }).click()
  const hint = page.locator('#wiz-hint-sentence')
  check('strength hint in plain words', (await hint.textContent()).startsWith('A student needs 4 successful evaluations out of their last 5, from at least 2 different evaluators'), await hint.textContent())
  await page.locator('#wiz-need').fill('2')
  await page.locator('#wiz-distinct').fill('1')
  check('hint updates live and drops to a lighter rule', /needs 2 successful evaluations out of their last 5, from any single evaluator/.test(await hint.textContent()) && (await page.getByText('Strength: moderate').count()) === 1, await hint.textContent())
  await page.locator('#wiz-need').fill('4')
  await page.locator('#wiz-distinct').fill('2')
  for (const next of ['Simulation', 'Prerequisites', 'Qualified evaluators', 'If a student does not pass', 'Re-validation']) await page.getByRole('button', { name: `Next: ${next}` }).click()
  check('calendar expiry is OFF by default', (await page.locator('#wiz-expiry').getAttribute('aria-checked').catch(() => null)) !== 'true')
  // inject: blank out a level name (step 1)
  await page.getByRole('button', { name: /^Back$/ }).click() // step 6
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: /^Back$/ }).click()
  await page.locator('#wiz-level-1').fill('')
  await page.getByRole('button', { name: /^Review and publish$/ }).first().click()
  await page.getByText('1 problem to fix before you can publish').waitFor()
  check('review lists the error with its step', (await page.getByRole('button', { name: /Evaluation model: Level 2 has no name/ }).count()) === 1)
  check('Publish is blocked while the error stands', await page.getByRole('button', { name: 'Publish IV catheter insertion' }).isDisabled())
  s = await store()
  check('store still shows the skill unpublished', skill(s, IV).published === false)
  await page.getByRole('button', { name: /Evaluation model: Level 2 has no name/ }).click()
  await page.waitForTimeout(300)
  check('the issue link opens step 1 and focuses the field', (await page.evaluate(() => document.activeElement?.id)) === 'wiz-level-1')
  await page.locator('#wiz-level-1').fill('Works with prompts')
  await page.getByRole('button', { name: /^Review and publish$/ }).first().click()
  await page.getByText('No problems found').waitFor()
  check('error fixed: Publish enabled', await page.getByRole('button', { name: 'Publish IV catheter insertion' }).isEnabled())

  // ------------------------------------------------------------------ 3. publish
  step('3. Publish')
  await page.getByRole('button', { name: 'Publish IV catheter insertion' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Publish IV catheter insertion' }).click()
  await page.getByText(/IV catheter insertion is now in use/).waitFor()
  s = await store()
  const iv = skill(s, IV)
  check('published in the store with the drafted rules', iv.published && iv.configured && iv.model === 'demonstration' && iv.config.achievement.need === 4 && iv.config.levels[1] === 'Works with prompts')
  check('audit entry written', s.audit[0].action === 'Published skill' && s.audit[0].target === 'IV catheter insertion', s.audit[0])

  // ------------------------------------------------------------------ 4. map
  step('4. Map skills to NURS 350')
  await page.getByRole('link', { name: 'Map to NURS 350' }).click()
  await page.getByRole('heading', { level: 1, name: 'Map skills to NURS 350' }).waitFor()
  await page.waitForTimeout(400)
  check('the "not in use" warning is gone after publishing', (await page.getByText(/not in use yet, so students cannot see it/).count()) === 0)
  check('no coverage gaps', (await page.getByText('No coverage gaps found').count()) === 1)
  const mandatory = () => page.locator('[data-summary="mandatory"]').textContent()
  check('summary starts at 9 mapped, 5 mandatory', (await page.locator('[data-summary="skills-mapped"]').textContent()) === '9' && (await mandatory()) === '5')
  await page.getByRole('combobox', { name: 'Requirement for Nasogastric tube care' }).click()
  await page.getByRole('option', { name: 'Mandatory' }).click()
  await page.waitForTimeout(200)
  check('mapping an optional skill as mandatory raises the count to 6', (await mandatory()) === '6')
  const blocked = page.getByRole('combobox', { name: 'Requirement for Pressure injury risk assessment' })
  check('unconfigured skill is blocked with a reason', (await blocked.isDisabled()) && (await page.getByText('Not configured, so it cannot be mapped.').count()) >= 1)
  // coverage warning: make every mandatory skill optional (the import kept a second "Oral medication administration", so the first row is used)
  for (const name of ['IV catheter insertion', 'Indwelling urinary catheter insertion', 'Oral medication administration', 'Sterile dressing change', 'Vital signs and early warning score', 'Nasogastric tube care']) {
    await page.getByRole('combobox', { name: `Requirement for ${name}` }).first().click()
    await page.getByRole('option', { name: 'Optional' }).click()
  }
  await page.waitForTimeout(200)
  check('course with zero mandatory skills warns', (await page.getByText('NURS 350 has no mandatory skills.', { exact: false }).count()) >= 1)
  await page.getByRole('combobox', { name: 'Requirement for IV catheter insertion' }).click()
  await page.getByRole('option', { name: 'Mandatory' }).click()
  await page.waitForTimeout(200)
  check('restoring one mandatory skill clears the warning', (await page.getByText('NURS 350 has no mandatory skills.', { exact: false }).count()) === 0)
  s = await store()
  check('mapping audit entries written', s.audit.filter((a) => a.action.startsWith('Mapped skill')).length >= 8, s.audit.filter((a) => a.action.startsWith('Mapped skill')).length)

  // ------------------------------------------------------------------ 5. reload
  step('5. Reload: state persisted')
  const before = await store()
  await page.reload({ waitUntil: 'load' })
  await page.waitForSelector('h1')
  await page.waitForTimeout(800)
  const after = await store()
  check('store identical after reload', JSON.stringify(before) === JSON.stringify(after))
  check('UI reads the saved state: mandatory still 1 (IV) after reload', (await page.locator('[data-summary="mandatory"]').textContent()) === '1', await page.locator('[data-summary="mandatory"]').textContent())
  await open('/v2/admin/starter-library')
  check('imported and copied skills survived reload (46 skills, 19 still to configure)', (await page.getByText(/46 skills in the library, 19 still to configure/).count()) === 1)

  // ------------------------------------------------------------------ 6. reset
  step('6. Reset demo restores the starting data')
  await page.getByRole('button', { name: 'Scenario' }).click()
  await page.getByRole('menuitem', { name: 'Reset demo' }).click()
  await page.getByRole('button', { name: 'Reset demo data' }).click()
  await page.waitForSelector('h1')
  await page.waitForTimeout(800)
  s = await store()
  check('31 skills, no batches, no drafts', s.skills.length === 31 && s.batches.length === 0 && Object.keys(s.drafts).length === 0, { skills: s.skills.length, batches: s.batches.length })
  check('IV catheter insertion not in use again', skill(s, IV).published === false)
  check('mappings back to 9 (5 mandatory)', s.mappings.length === 9 && s.mappings.filter((m) => m.level === 'mandatory').length === 5)
  check('no page errors during the run', pageErrors.length === 0, pageErrors)
} catch (e) {
  failures++
  console.log(`FAIL  flow aborted: ${String(e?.message ?? e).split('\n')[0]}`)
  await page.screenshot({ path: path.resolve(HERE, '../screenshots/stage1-e2e-failure.png') }).catch(() => {})
}

await browser.close()
console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`)
process.exit(failures === 0 ? 1 - 1 : 1)
