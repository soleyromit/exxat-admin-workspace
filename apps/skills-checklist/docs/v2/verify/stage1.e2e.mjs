#!/usr/bin/env node
// End-to-end drive of the Stage 1 admin flow against the running dev server (default http://localhost:3007).
//
//   node docs/v2/verify/stage1.e2e.mjs [--base http://localhost:3007]
//
// import -> confirm -> configure -> publish blocked by an injected error, then fixed -> publish -> map -> reload ->
// state persisted -> Demo > Reset demo restores. Each check prints PASS or FAIL with what it saw; the last line gives the literal
// counts. Exit code 1 on any FAIL. Shared helpers live in _lib.mjs.
// Playwright is resolved from /Users/romitsoley/Work/tools/visual-check (it is not installed in the app).

import path from 'node:path'
import { HERE, KEY, IV, parseBase, makeChecker, startSession, demoMenu } from './_lib.mjs'

const SAMPLE_PDF = path.resolve(HERE, '../../../admin/public/v2/sample-skills-checklist.pdf')
const base = parseBase()
const { check, step, abort, finish } = makeChecker('stage1')
const { browser, page, pageErrors, open, store, btn, hydrated, failShot } = await startSession({ base })
const demo = demoMenu(page)
const skill = (s, id) => s.skills.find((k) => k.id === id)
const mainText = () => page.locator('main').first().innerText()
/** The library's Configured tile reads "<configured> of <total>, <n> in use". Returns [configured, total] or null. */
const libraryCounts = async () => { const m = (await mainText()).match(/(\d+) of (\d+), (\d+) in use/); return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null }

try {
  // ------------------------------------------------------------------ 1. import
  step('1. Import a PDF, review, confirm')
  await open('/v2/admin/starter-library')
  check('library starts with 27 of 31 skills configured (4 still to configure), 12 in use', JSON.stringify(await libraryCounts()) === JSON.stringify([27, 31, 12]), await libraryCounts())
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
  check('library counter rose: 27 of 41 configured (14 still to configure)', JSON.stringify(await libraryCounts()) === JSON.stringify([27, 41, 12]), await libraryCounts())

  // starter library copy
  await page.getByRole('tab', { name: 'Starter libraries' }).click()
  await page.getByRole('button', { name: 'Review Radiography skills' }).click()
  await page.getByRole('button', { name: /^Copy 5 skills$/ }).click()
  await page.getByText(/5 skills copied from Radiography/).waitFor()
  s = await store()
  check('starter copy: 5 added (1 duplicate skipped), batch 2', s.skills.length === 46 && s.batches.length === 2 && s.batches[1].kind === 'starter-library', { skills: s.skills.length })

  // ------------------------------------------------------------------ 2. configure
  step('2. Configure IV catheter insertion, inject an error')
  await open('/v2/admin/configure-skill?skill=sk-pressure-injury')
  check('SC-02: an unconfigured skill shows 4 model tiles and none is selected', (await page.getByRole('radio').count()) === 4 && (await page.locator('[role=radio][aria-checked=true]').count()) === 0)
  check('no "selected as a starting point" copy', (await page.getByText(/starting point/i).count()) === 0)
  await page.getByRole('button', { name: 'Next: Achievement rules' }).click()
  check('Next is refused without a model: still step 1, the error is shown', (await page.locator('p', { hasText: /^Step 1 of 7/ }).count()) === 1 && (await page.getByText(/Choose an evaluation model/).count()) >= 1)
  await open('/v2/admin/configure-skill')
  check('wizard has 7 steps (no re-validation step)', (await page.getByRole('navigation', { name: /Wizard steps, 7 total/ }).count()) === 1)
  check('binary pre-selection does not override the saved demonstration model', await page.locator('#wiz-model-demonstration').getAttribute('aria-checked') === 'true')
  await page.getByRole('button', { name: 'Next: Achievement rules' }).click()
  const hint = page.locator('#wiz-hint-sentence')
  check('strength hint in plain words', (await hint.textContent()).startsWith('A student needs 4 successful evaluations out of their last 5, from at least 2 different evaluators'), await hint.textContent())
  await page.locator('#wiz-need').fill('2')
  await page.locator('#wiz-distinct').fill('1')
  check('hint updates live and drops to a lighter rule', /needs 2 successful evaluations out of their last 5, from any single evaluator/.test(await hint.textContent()) && (await page.getByText('Strength: moderate').count()) === 1, await hint.textContent())
  await page.locator('#wiz-need').fill('4')
  await page.locator('#wiz-distinct').fill('2')
  for (const next of ['Simulation', 'Prerequisites', 'Qualified evaluators', 'If a student does not pass']) {
    await page.getByRole('button', { name: `Next: ${next}` }).click()
    if (next === 'Qualified evaluators') {
      await page.locator('p', { hasText: /^Step 5 of 7/ }).waitFor()
      const feedback = page.getByRole('switch', { name: 'Require written feedback' })
      const approval = page.getByRole('switch', { name: 'Require administrator approval' })
      check('step 5 has two switches with accessible names: written feedback and administrator approval', (await feedback.count()) === 1 && (await approval.count()) === 1)
      const before = await feedback.getAttribute('aria-checked')
      await feedback.click(); await feedback.click()
      check('a switch toggles and returns to its saved value', (await feedback.getAttribute('aria-checked')) === before)
    }
  }
  check('no calendar expiry or auto-remediation control exists', (await page.locator('#wiz-expiry, #wiz-months, #wiz-remediation').count()) === 0)
  // inject: blank out a level name (step 1)
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
  await page.getByRole('link', { name: 'Courses', exact: true }).first().click()
  await page.getByRole('heading', { level: 1, name: 'Courses' }).waitFor()
  await page.waitForTimeout(400)
  check('the "not in use" warning is gone after publishing', (await page.getByText(/not in use yet, so students cannot see it/).count()) === 0)
  check('no coverage gaps', (await page.getByText('No coverage gaps found').count()) === 1)
  // The coverage StackedBar lists each segment as text ("Mandatory: 5 skills"); the store holds the same numbers.
  const segment = async (label) => { const m = (await mainText()).match(new RegExp(`${label}: (\\d+) skills?`)); return m ? Number(m[1]) : null }
  const mandatory = () => segment('Mandatory')
  s = await store()
  check('coverage bar starts at 5 mandatory, 4 optional or not expected, 18 not mapped, 19 not configured (4 seeded + 15 imported or copied)', (await mandatory()) === 5 && (await segment('Optional or not expected')) === 4 && (await segment('Not mapped')) === 18 && (await segment('Not configured')) === 19, { mandatory: await mandatory(), other: await segment('Optional or not expected'), unmapped: await segment('Not mapped'), blocked: await segment('Not configured') })
  await page.getByRole('combobox', { name: 'Requirement for Nasogastric tube care' }).click()
  await page.getByRole('option', { name: 'Mandatory' }).click()
  await page.waitForTimeout(200)
  check('mapping an optional skill as mandatory raises the count to 6', (await mandatory()) === 6)
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
  await open('/v2/admin/map-courses')
  check('UI reads the saved state: mandatory still 1 (IV) after reload', (await mandatory()) === 1, await mandatory())
  await open('/v2/admin/starter-library')
  check('imported and copied skills survived reload (27 of 46 configured, 19 still to configure, 13 in use)', JSON.stringify(await libraryCounts()) === JSON.stringify([27, 46, 13]), await libraryCounts())

  // ------------------------------------------------------------------ 6. reset
  step('6. Reset demo restores the starting data')
  await demo.reset()
  check('Reset demo lands on the admin Dashboard', page.url().endsWith('/v2/admin'), page.url())
  s = await store()
  check('31 skills, no batches, no drafts', s.skills.length === 31 && s.batches.length === 0 && Object.keys(s.drafts).length === 0, { skills: s.skills.length, batches: s.batches.length })
  check('IV catheter insertion not in use again', skill(s, IV).published === false)
  check('mappings back to 9 (5 mandatory)', s.mappings.length === 9 && s.mappings.filter((m) => m.level === 'mandatory').length === 5)
  check('no page errors during the run', pageErrors.length === 0, pageErrors)
} catch (e) {
  abort(e)
  await failShot('stage1-e2e')
}
await finish(browser)
