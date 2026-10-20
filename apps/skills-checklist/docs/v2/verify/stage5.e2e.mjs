#!/usr/bin/env node
// End-to-end drive of the Stage 5 flow against the running dev server (default http://localhost:3007).
//
//   node docs/v2/verify/stage5.e2e.mjs [--base http://localhost:3007]
//
// Reports (heatmap, words-only table, filters and chips, the impossible-filter explanation, behind pace, single-rater flag, rater comparison,
// drill-down to a record) -> signed PDFs (cohort with filters, one student) read by an independent PDF reader (pdftotext), checked by the page,
// then tampered three ways and a non-PDF -> lab batch grid (R. Whitmore: cycle, absent, set column, confirm counts, save, results on the shared store,
// lab evidence has no clinical setting, duplicate refused, a preceptor is blocked, reload) -> reports pick the lab evidence up -> Maya's verified
// record (blocked before verification; approve, complete the request, director verifies; included and excluded lists; PDF checks; CLR 2.0 JSON has
// no feedback, self-rating or concern; a reopen blocks sharing until the director verifies again) -> phone width has no sideways scroll.
// Each check prints PASS or FAIL with what it saw. Exit code 1 on any FAIL. Playwright is resolved from tools/visual-check.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TOOLS = path.resolve(HERE, '../../../../../tools/visual-check')
const { chromium } = createRequire(path.join(TOOLS, 'package.json'))('playwright')

const args = process.argv.slice(2)
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'http://localhost:3007'
const KEY = 'skills-checklist:v2:store'
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-v2-stage5-'))

let failures = 0
const check = (name, ok, seen) => {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${seen === undefined ? '' : `  (saw: ${typeof seen === 'string' ? seen : JSON.stringify(seen)})`}`)
}
const step = (t) => console.log(`\n== ${t}`)

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true })
const page = await ctx.newPage()
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)))

const store = () => page.evaluate((k) => { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw).state : null }, KEY)
const open = async (route) => { await page.goto(base + route, { waitUntil: 'load' }); await page.waitForSelector('h1', { timeout: 30000 }); await page.waitForTimeout(900) }
const btn = (name, opts = {}) => page.getByRole('button', { name, ...opts })
const text = () => page.locator('body').innerText()
const radio = (group, name) => page.getByRole('radiogroup', { name: group }).getByRole('radio', { name, exact: true })
const phone = () => page.setViewportSize({ width: 390, height: 844 })
const desktop = () => page.setViewportSize({ width: 1440, height: 900 })
const tab = (name) => page.getByRole('tab', { name }).click()
const pickOption = async (label, option) => { await page.getByRole('combobox', { name: label, exact: true }).click(); await page.getByRole('option', { name: option, exact: true }).click(); await page.waitForTimeout(200) }
const heatRow = (id) => page.locator(`[data-heat-row="${id}"]`)
const figure = (key) => page.locator(`[data-figure="${key}"]`).textContent()
const labBtn = (student, skill) => page.getByRole('button', { name: new RegExp(`^${student}, ${skill}:`) })
const VITALS = 'Vital signs and early warning score'
const DRESS = 'Sterile dressing change'
const noSideways = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)

/** Clicks a download button and saves the file; returns { file, name, bytes }. */
async function download(locator) {
  const [dl] = await Promise.all([page.waitForEvent('download'), locator.click()])
  const file = path.join(TMP, `${Date.now()}-${dl.suggestedFilename()}`)
  await dl.saveAs(file)
  return { file, name: dl.suggestedFilename(), bytes: fs.readFileSync(file) }
}
const pdftotext = (file) => execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' })
async function checkFile(file) {
  await page.locator('#check-file').setInputFiles(file)
  await page.locator('[data-check-result]').waitFor()
  return page.locator('[data-check-result]').getAttribute('data-check-result')
}
const write = (name, buf) => { const f = path.join(TMP, name); fs.writeFileSync(f, buf); return f }

try {
  step('1. Reports on the seed')
  await open('/v2/admin/reports')
  check('summary figures come from the store: 12 students, 10 behind pace, 2 skills with one evaluator', (await figure('students')) === '12' && (await figure('behind')) === '10' && (await figure('single')) === '2', { students: await figure('students'), behind: await figure('behind'), single: await figure('single') })
  check('the heatmap is a real table with 12 student rows and 7 skill columns plus the student column', (await page.locator('[data-heatmap] tbody tr').count()) === 12 && (await page.locator('[data-heatmap] thead th').count()) === 8)
  const cells = await page.locator('[data-heatmap] [data-cell-state]').evaluateAll((els) => els.map((e) => ({ state: e.getAttribute('data-cell-state'), text: e.textContent.trim() })))
  check('every one of the 84 cells says its state in words, not by shade alone', cells.length === 84 && cells.every((c) => c.text.length > 0), cells.length)
  check('all five states appear (achieved, half or more, some, not met yet, not started)', ['achieved', 'half', 'some', 'attempted', 'none'].every((st) => cells.some((c) => c.state === st)), [...new Set(cells.map((c) => c.state))])
  check('Maya: urinary catheter 2 of 3, vital signs Achieved (matches the progress engine)', (await heatRow('stu-maya').textContent()).includes('2 of 3') && (await heatRow('stu-maya').textContent()).includes('Achieved'))
  check('rows and columns carry scoped headers', (await page.locator('[data-heatmap] tbody th[scope="row"]').count()) === 12 && (await page.locator('[data-heatmap] thead th[scope="col"]').count()) === 8)
  check('no red anywhere in the heatmap (computed colours have no dominant red)', await page.locator('[data-heatmap] [data-cell-state]').evaluateAll((els) => els.every((e) => { const m = /oklch\(([\d.]+) ([\d.]+) ([\d.]+)/.exec(getComputedStyle(e).backgroundColor); if (!m) return true; const hue = Number(m[3]); return !(Number(m[2]) > 0.15 && (hue < 40 || hue > 350)) })))

  step('2. Words-only table, filters and chips')
  await tab('Student table')
  check('the Student table lists every cell in words (accessible alternative)', (await page.getByText('In progress, 2 of 3').count()) >= 1 && (await page.getByText('Not started').count()) >= 1)
  await tab('Heatmap')
  await pickOption('Category', 'Assessment')
  check('category filter narrows the columns to the 2 Assessment skills and shows a removable chip', (await page.locator('[data-heatmap] thead th').count()) === 3 && (await page.getByRole('button', { name: 'Remove filter Category: Assessment' }).count()) === 1, await page.locator('[data-heatmap] thead th').count())
  await page.locator('#flt-mandatory').click()
  check('a second filter adds a second chip; each is removable on its own', (await page.locator('[data-remove-filter]').count()) === 2)
  await page.getByRole('button', { name: 'Remove filter Category: Assessment' }).click()
  check('removing one chip leaves the other and restores the columns it had narrowed', (await page.locator('[data-remove-filter]').count()) === 1 && (await page.locator('[data-heatmap] thead th').count()) === 5, await page.locator('[data-heatmap] thead th').count())
  await page.getByRole('button', { name: 'Remove filter Mandatory skills only' }).click()
  check('with no filters the applied line says so', (await page.locator('[data-applied-filters]').textContent()).includes('No filters applied'))
  await pickOption('Setting', 'Lab')
  await pickOption('Clinical setting', 'Inpatient')
  check('an impossible pair is explained, not returned empty (RP-09)', (await page.locator('[data-filter-conflict]').count()) === 1 && /never carries a named clinical setting/.test(await page.locator('[data-filter-conflict]').textContent()))
  check('and every figure reads zero because nothing matches', (await figure('achieved')) === '0%' && (await figure('sim')) === '0%')
  await page.getByRole('button', { name: 'Clear the clinical setting filter' }).click()
  check('the fix clears only the clinical setting; the lab chip stays', (await page.locator('[data-filter-conflict]').count()) === 0 && (await page.getByRole('button', { name: 'Remove filter Setting: Lab' }).count()) === 1)
  check('lab-only evidence recalculates progress (RP-08): Maya vital signs falls to 1 of 3', (await heatRow('stu-maya').textContent()).includes('1 of 3') && !(await heatRow('stu-maya').textContent()).includes('Achieved'))
  await page.getByRole('button', { name: 'Remove filter Setting: Lab' }).click()

  step('3. Behind pace, one evaluator, raters, drill-down')
  await tab(/^Behind pace/)
  const paceRowsN = await page.locator('[role="region"][aria-label="Students behind the expected pace"] tbody tr').count()
  check('behind pace lists 10 students, not Maya (6 of 12 collected, 6 expected) and not Ethan', paceRowsN === 10 && (await page.getByText('Maya Ferreira').count()) === 0 && (await page.getByText('Ethan Cole').count()) === 0, paceRowsN)
  check('the basis is stated: term dates, days gone, the margin, and that it is an assumption', /Aug 24 to Dec 11/.test(await page.locator('[data-pace-basis]').textContent()) && /not define pace/.test(await page.locator('[data-pace-basis]').textContent()))
  await tab('Skills and raters')
  check('two skills are flagged One evaluator', (await page.getByText('One evaluator', { exact: true }).count()) === 2)
  await page.getByRole('button', { name: 'Show the students for Oral medication administration' }).click()
  check('Show students opens the words-only table narrowed to that skill, with a removable chip', (await page.locator('[data-skill-focus]').count()) === 1 && (await page.getByRole('tab', { name: 'Student table', selected: true }).count()) === 1)
  const focusRows = await page.locator('[role="region"][aria-label="Every student and skill, in words"] tbody tr').count()
  check('12 rows, one per student', focusRows === 12, focusRows)
  await page.getByRole('button', { name: /^Remove filter Skill: Oral medication administration$/ }).click()
  await tab('Rater comparison')
  check('rater comparison lists both evaluators with a gap to all raters and the not-a-judgement caution', (await page.getByText('J. Delgado, RN').count()) >= 1 && (await page.getByText('R. Whitmore').count()) >= 1 && /not a judgement/.test(await page.locator('[data-rater-note]').textContent()))
  await tab('Heatmap')
  await page.getByRole('link', { name: 'Open the record of Maya Ferreira' }).click()
  await page.waitForURL(/\/v2\/admin\/verification\/stu-maya/)
  check('a name in the heatmap opens that student\'s evidence (RP-05, RP-06)', (await page.locator('[data-verification-record="stu-maya"]').count()) === 1)

  step('4. Signed PDFs: made, read by another reader, checked, tampered')
  await open('/v2/admin/reports')
  await pickOption('Category', 'Assessment')
  const cohort = await download(page.locator('[data-download="cohort"]'))
  check('cohort PDF downloads with a clear name', cohort.name === 'cohort-skills-report-nurs-350-fall-2026.pdf', cohort.name)
  check('it is a real PDF (header, xref, EOF)', cohort.bytes.subarray(0, 8).toString('latin1') === '%PDF-1.4' && cohort.bytes.toString('latin1').includes('%%EOF') && /startxref\n\d+\n/.test(cohort.bytes.toString('latin1')))
  const cohortText = pdftotext(cohort.file)
  check('an independent reader (pdftotext) reads it: title, a student, the heatmap key and the signature block', ['Cohort skills report', 'Maya Ferreira', 'Heatmap', 'What the signature proves', 'Content hash (SHA-256)'].every((t) => cohortText.includes(t)))
  check('it records the filters that produced it (RP-10)', cohortText.includes('Filters applied: Category: Assessment'))
  check('it carries no concern, self-rating or evaluator feedback text', !/Sample concern|Needs coaching|Wait for the full reading|Asked the preceptor/.test(cohortText))
  const hashOnPage = await page.locator('[data-pdf-done]').getAttribute('data-pdf-hash')
  check('the page shows the content hash and the same hash is printed in the PDF', !!hashOnPage && cohortText.replace(/\s+/g, '').includes(hashOnPage), hashOnPage?.slice(0, 16))
  check('the page checks its own file as unchanged', (await checkFile(cohort.file)) === 'ok')
  const raw = cohort.bytes.toString('latin1')
  check('one changed letter in the visible text fails (content-changed)', (await checkFile(write('t1.pdf', Buffer.from(raw.replace('(Cohort skills report)', '(Cohort skills reporT)'), 'latin1')))) === 'content-changed')
  const sig = /%SC-SIGNATURE ([0-9a-f]+)/.exec(raw)[1]
  check('a changed signature fails (signature-invalid)', (await checkFile(write('t2.pdf', Buffer.from(raw.replace(sig, sig.slice(0, -1) + (sig.endsWith('0') ? '1' : '0')), 'latin1')))) === 'signature-invalid')
  check('a changed hash fails', ['signature-invalid', 'hash-mismatch'].includes(await checkFile(write('t3.pdf', Buffer.from(raw.replace(/%SC-HASH [0-9a-f]{8}/, '%SC-HASH 00000000'), 'latin1')))))
  check('a plain text file is not a PDF (unreadable), said plainly', (await checkFile(write('t4.pdf', 'hello'))) === 'unreadable' && /could not be read/.test(await page.locator('[data-check-result]').textContent()))
  check('a PDF from elsewhere says it is not signed from this prototype', (await checkFile(write('t5.pdf', Buffer.from('%PDF-1.4\n%%EOF\n', 'latin1')))) === 'not-signed')
  check('the proves-and-does-not-prove note is on the page', /does not prove who made it/.test(await page.locator('[data-signature-note]').textContent()) && /demo key/.test(await page.locator('[data-signature-note]').textContent()))
  await pickOption('Student', 'Maya Ferreira')
  const stu = await download(btn('Download PDF for Maya Ferreira'))
  const stuText = pdftotext(stu.file)
  check('student PDF reads: name, verification status, skills, filters, signature', stu.name === 'skills-report-maya-ferreira.pdf' && ['Student skills report', 'Maya Ferreira', 'Program verification: Not verified', 'Vital signs and early warning score', 'Content hash'].every((t) => stuText.includes(t)))
  check('student PDF checks as unchanged', (await checkFile(stu.file)) === 'ok')
  await open('/v2/director/reports')
  check('the director opens the same reports', (await figure('students')) === '12')
  const resp = await page.goto(base + '/v2/student/reports')
  check('a student route for reports does not exist (404)', resp.status() === 404, resp.status())

  step('5. Lab batch grid (R. Whitmore)')
  await open('/v2/preceptor/lab-batch-grid')
  check('the page says who records and that no account is needed', /Recording as R\. Whitmore, lab instructor\. No account is needed\./.test(await text()))
  check('a 12 student grid with two default skills, every cell Not recorded', (await page.locator('[data-lab-table] tbody tr').count()) === 12 && (await page.locator('[data-lab-cell="none"]').count()) === 24)
  check('save is disabled with the reason visible while nothing is recorded', (await page.locator('[data-lab-save]').isDisabled()) && /Record a result to turn on Save/.test(await text()))
  const cyc = []
  for (let i = 0; i < 4; i++) { await labBtn('Maya Ferreira', VITALS).click(); cyc.push(await page.locator('[data-lab-row="stu-maya"] [data-lab-cell]').first().textContent()) }
  check('a cell cycles Met, Not met, Not yet, Not recorded', JSON.stringify(cyc.map((c) => c.trim())) === JSON.stringify(['Met', 'Not met', 'Not yet', 'Not recorded']), cyc)
  check('each cell button names the student, the skill, its state and the next state', (await labBtn('Maya Ferreira', VITALS).getAttribute('aria-label')) === `Maya Ferreira, ${VITALS}: Not recorded. Press to change to Met.`)
  await page.getByRole('checkbox', { name: 'Liam Kowalski was absent' }).click()
  check('an absent student\'s cells are replaced by Absent and cannot be pressed', (await page.locator('[data-lab-row="stu-08"] [data-lab-cell="absent"]').count()) === 2 && (await page.locator('[data-lab-row="stu-08"] button:not([role="checkbox"])').count()) === 0)
  await page.locator('[data-set-column="sk-sterile-dressing"]').click()
  await labBtn('Maya Ferreira', VITALS).click()
  check('Set column to Met sets only the present students', (await page.locator('[data-lab-cell="met"]').count()) === 12, await page.locator('[data-lab-cell="met"]').count())
  check('the live counts say 12 results for 11 students, 10 blank, 1 absent', /12 results for 11 students\. 10 cells are blank and not saved\. 1 student is absent\./.test(await page.locator('[data-lab-counts]').textContent()), await page.locator('[data-lab-counts]').textContent())
  check('the page states lab never counts toward a clinical setting', /never count toward a clinical setting/.test(await text()))
  const before = await store()
  check('nothing is written until Save', !before || (before.labBatches ?? []).length === 0)
  await page.locator('[data-lab-save]').click()
  await page.locator('[data-lab-dialog]').waitFor()
  check('the confirm repeats the counts before anything is saved', /Save 12 results for 11 students\?/.test(await page.locator('[data-lab-dialog]').textContent()) && /10 cells are blank and are not saved\. 1 student is absent and gets no result/.test(await page.locator('[data-lab-dialog]').textContent()))
  await page.locator('[data-lab-confirm]').click()
  await page.locator('[data-lab-saved]').waitFor()
  check('the saved banner says what happened', /Saved\. 12 results are on the students' records\. 1 student was absent and has no result\./.test(await page.locator('[data-lab-saved]').textContent()), await page.locator('[data-lab-saved]').textContent())
  let s = await store()
  const batch = s.labBatches[0]
  const labEvals = s.evaluations.filter((e) => batch.evaluationIds.includes(e.id))
  check('the batch is on the shared store with 12 evaluations by R. Whitmore, setting lab, status counted', s.labBatches.length === 1 && labEvals.length === 12 && labEvals.every((e) => e.evaluatorId === 'lab-whitmore' && e.setting === 'lab' && e.status === 'counted'))
  check('lab evidence carries no clinical setting, so it can never satisfy a setting minimum', labEvals.every((e) => e.clinicalSetting === undefined))
  check('the absent student has no result and is listed on the batch', batch.absentIds.join() === 'stu-08' && !labEvals.some((e) => e.studentId === 'stu-08') && /Absent, not assessed: Liam Kowalski/.test(await page.locator('[data-lab-batches]').textContent()))
  check('the audit log records the session', /Saved a lab session/.test(s.audit[0].action) && s.audit[0].actorId === 'lab-whitmore', s.audit[0])
  await labBtn('Priya Raman', VITALS).click()
  await page.locator('#lab-name').fill('Skills lab, group A')
  await page.locator('[data-lab-save]').click()
  await page.locator('[data-lab-confirm]').click()
  await page.locator('[data-lab-error]').waitFor()
  check('saving the same session again is refused, and the message says why', /already saved/.test(await page.locator('[data-lab-error]').textContent()), await page.locator('[data-lab-error]').textContent())
  await open('/v2/preceptor/lab-batch-grid')
  check('after a reload the saved session is still there, read-only', (await page.locator('[data-lab-batch]').count()) === 1)
  await open('/v2/preceptor/lab-batch-grid?as=pre-delgado')
  check('a preceptor is told lab sessions are recorded by a lab instructor, and cannot save', (await page.locator('[data-lab-blocked]').count()) === 1 && (await page.locator('[data-lab-save]').isDisabled()) && (await page.locator('[data-lab-cell]:not([disabled])').count()) === 0)
  await phone()
  await open('/v2/preceptor/lab-batch-grid')
  check('phone: no sideways page scroll; the grid scrolls inside its own region', await noSideways())
  await desktop()

  step('6. The lab evidence reaches the reports')
  await open('/v2/admin/reports')
  check('Maya\'s sterile dressing moved from Not met yet to 1 of 3', (await heatRow('stu-maya').textContent()).includes('1 of 3'))
  await pickOption('Setting', 'Lab')
  const labObs = await page.locator('[data-heat-row="stu-02"]').textContent()
  check('with Setting: Lab, a student with a lab Met shows it', /1 of 3/.test(labObs), labObs)
  await tab('Skills and raters')
  check('observations by evaluator include R. Whitmore on the lab skills', (await page.getByText(/R\. Whitmore \(/).count()) >= 1)
  await page.getByRole('button', { name: 'Remove filter Setting: Lab' }).click()

  step('7. Maya\'s verified record')
  await phone()
  await open('/v2/student/history')
  await page.locator('[data-share-record]').click()
  await page.waitForURL(/\/v2\/student\/verified-record/)
  await page.locator('[data-record-status]').waitFor()
  check('the link from Your record opens the share page; unverified, sharing is off with the reason', (await page.locator('[data-record-blocked]').count()) === 1 && /has not verified your record yet/.test(await page.locator('[data-record-blocked]').textContent()) && (await page.locator('[data-download-pdf]').count()) === 0)
  await desktop()
  // Make Maya verifiable: approve her waiting evaluation, complete her open request, then the director verifies.
  await open('/v2/reviewer/review-queue')
  await page.getByRole('checkbox', { name: /^Select Maya Ferreira, Point-of-care blood glucose/ }).check()
  await btn('Approve 1 submission').click()
  await page.locator('[data-bulk-confirm]').click()
  await page.waitForTimeout(500)
  await open('/v2/preceptor/preceptor-evaluation?request=sub-maya-1')
  await radio('Level of supervision you observed for Indwelling urinary catheter insertion', 'Works alone').click()
  await radio('Outcome for Indwelling urinary catheter insertion', 'Met').click()
  await radio('Outcome for Oral medication administration', 'Not yet, feedback only').click()
  await page.locator('#fb-sk-med-admin').fill('Check the five rights again before you open the packet.')
  await page.locator('#attest').click()
  await btn(/^Submit evaluation of 2 skills$/).click()
  await page.locator('[data-receipt]').waitFor()
  await open('/v2/director/verification/stu-maya')
  await page.locator('#verify-note').fill('Checked the log against the evaluations.')
  await page.locator('#verify-confirm').click()
  await btn(/^Verify Maya Ferreira's record as version 1$/).click()
  await page.locator('[data-verify-message]').waitFor()
  await phone()
  await open('/v2/student/verified-record')
  check('verified: status says who and when, sharing is on', (await page.locator('[data-record-status="verified"]').count()) === 1 && /verified by Dr\. K\. Brennan on/.test(await page.locator('[data-record-status]').textContent()) && (await page.locator('[data-download-pdf]').count()) === 1)
  const incl = await page.locator('[data-included-skill]').evaluateAll((els) => els.map((e) => e.getAttribute('data-included-skill')))
  s = await store()
  const v1 = s.verifications[0]
  const achieved = v1.skills.filter((k) => k.achieved).map((k) => k.skillId)
  check('included skills are exactly the ones achieved when verified', incl.length > 0 && JSON.stringify([...incl].sort()) === JSON.stringify([...achieved].sort()), { incl, achieved })
  const exKeys = await page.locator('[data-excluded-item]').evaluateAll((els) => els.map((e) => e.getAttribute('data-excluded-item')))
  check('what is not included is listed with a reason each (not achieved, not met, self-ratings, feedback)', ['skills-not-achieved', 'self'].every((k) => exKeys.includes(k)) && (await page.locator('[data-excluded-item] span.text-muted-foreground').allTextContents()).every((t) => t.length > 10), exKeys)
  check('nothing on the page says a concern exists', !/concern|confidence/i.test(await page.locator('[data-student-page]').innerText()))
  check('phone: no sideways scroll and every control is 44 px or more', await noSideways() && await page.locator('[data-student-page] button, [data-student-page] a').evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height > 0 && !e.closest('.sr-only')).every((e) => (e.closest('li, label') ?? e).getBoundingClientRect().height >= 43.5)))
  const pdf = await download(page.locator('[data-download-pdf]'))
  const pdfText = pdftotext(pdf.file)
  check('record PDF: a real signed file named for Maya and the version, read by pdftotext', pdf.name === 'verified-skills-record-maya-ferreira-v1.pdf' && ['Verified skills record', 'Maya Ferreira', 'Verified by Dr. K. Brennan', 'version 1', 'Not included'].every((t) => pdfText.includes(t)), pdf.name)
  check('record PDF carries no feedback, self-rating, note or concern', !/Check the five rights|Needs coaching|Works with prompts|Asked the preceptor|Sample concern|Wait for the full reading/.test(pdfText))
  await page.locator('[data-record-done="pdf"]').waitFor()
  await desktop()
  await open('/v2/admin/reports')
  check('the reports page checks the record PDF as unchanged', (await checkFile(pdf.file)) === 'ok')
  check('and a changed letter in it fails', (await checkFile(write('rec.pdf', Buffer.from(pdf.bytes.toString('latin1').replace('(Verified skills record)', '(Verified skills recorD)'), 'latin1')))) === 'content-changed')
  await open('/v2/student/verified-record')
  const clrFile = await download(page.locator('[data-download-clr]'))
  const clr = JSON.parse(clrFile.bytes.toString('utf8'))
  check('CLR 2.0 file: right context, types, one achievement credential per included skill', clrFile.name === 'verified-skills-record-maya-ferreira-v1.clr.json' && clr['@context'][1].includes('clr/v2p0') && clr.type.join() === 'VerifiableCredential,ClrCredential' && clr.credentialSubject.verifiableCredential.length === incl.length && clr.credentialSubject.verifiableCredential.every((c) => c.type.includes('AchievementCredential') && c.evidence.length >= 1), { name: clrFile.name, n: clr.credentialSubject.verifiableCredential.length })
  check('CLR is unsigned and says so; no feedback, self-rating or concern in it', !('proof' in clr) && /unsigned and carries no proof/.test(clr.description) && !/Check the five rights|Needs coaching|Works with prompts|Asked the preceptor|concern/i.test(clrFile.bytes.toString('utf8')))
  check('the download banner says the file is unsigned', /unsigned/.test(await page.locator('[data-record-done="clr"]').textContent()))

  step('8. A later change blocks sharing until the director verifies again')
  const target = s.evaluations.find((e) => e.studentId === 'stu-maya' && e.skillId === 'sk-vitals' && e.status === 'counted' && v1.evidence.some((x) => x.evaluationId === e.id))
  await open(`/v2/admin/evaluation/${target.id}`)
  await btn('Reopen to edit').click()
  await page.getByRole('dialog').getByText('Not yet, feedback only', { exact: true }).click()
  await page.locator('#reopen-reason').fill('The evaluator corrected the outcome.')
  await page.getByRole('dialog').getByRole('button', { name: 'Reopen and add version 2' }).click()
  await page.getByText(/Version 2 added/).waitFor()
  await phone()
  await open('/v2/student/verified-record')
  check('Changed since verified: both downloads are gone and the reason is stated', (await page.locator('[data-record-status="changed"]').count()) === 1 && (await page.locator('[data-download-pdf]').count()) === 0 && (await page.locator('[data-download-clr]').count()) === 0 && /cannot be shared until the program director verifies it again/.test(await page.locator('[data-record-blocked]').textContent()))
  await page.reload({ waitUntil: 'load' }); await page.waitForSelector('h1'); await page.waitForTimeout(900)
  check('it survives a reload', (await page.locator('[data-record-status="changed"]').count()) === 1)
  check('no uncaught page errors', pageErrors.length === 0, pageErrors)
} catch (e) {
  failures++
  console.log(`FAIL  script error: ${String(e).slice(0, 900)}`)
  await page.screenshot({ path: path.join(TMP, 'stage5-fail.png') }).catch(() => {})
  console.log(`(failure screenshot: ${path.join(TMP, 'stage5-fail.png')})`)
} finally {
  await browser.close()
}
console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILED`}`)
process.exit(failures === 0 ? 0 : 1)
