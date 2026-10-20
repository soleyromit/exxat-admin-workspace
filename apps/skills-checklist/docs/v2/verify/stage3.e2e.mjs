#!/usr/bin/env node
// End-to-end drive of the Stage 3 flow against the running dev server (default http://localhost:3007).
//
//   node docs/v2/verify/stage3.e2e.mjs [--base http://localhost:3007]
//
// publish IV in admin -> student logs two skills and asks J. Delgado by QR -> preceptor link: blocked as the lab instructor, as a
// colleague the request was not sent to, and as an unqualified Delgado -> empty submit shows every problem and moves focus ->
// round 1: IV Met + Sterile dressing Not yet + a confidential concern -> student sees progress, feedback-only attempt and NO concern,
// staff see the concern -> round 2: IV Not met (opens a plan) + Sterile dressing Met -> plan visible to student and staff, steps,
// close early needs a reason, close -> staff reopen round 1 IV (reason required), v2 on the timeline, v1 untouched, student sees both,
// progress drops while reopened, confirm restores it -> state survives a reload.
// Each check prints PASS or FAIL with what it saw. Exit code 1 on any FAIL. Playwright is resolved from tools/visual-check.

import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TOOLS = path.resolve(HERE, '../../../../../tools/visual-check')
const { chromium } = createRequire(path.join(TOOLS, 'package.json'))('playwright')

const args = process.argv.slice(2)
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'http://localhost:3007'
const KEY = 'skills-checklist:v2:store'
const IV = 'sk-iv-cath'
const SD = 'sk-sterile-dressing'
const CONCERN = 'E2E-CONCERN-NOTE arrived late twice this week'

let failures = 0
const check = (name, ok, seen) => {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${seen === undefined ? '' : `  (saw: ${typeof seen === 'string' ? seen : JSON.stringify(seen)})`}`)
}
const step = (t) => console.log(`\n== ${t}`)

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
const page = await ctx.newPage()
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)))

const store = () => page.evaluate((k) => { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw).state : null }, KEY)
const putStore = (fn) => page.evaluate(([k, src]) => { const env = JSON.parse(localStorage.getItem(k)); new Function('s', src)(env.state); localStorage.setItem(k, JSON.stringify(env)) }, [KEY, fn])
const open = async (route) => { await page.goto(base + route, { waitUntil: 'load' }); await page.waitForSelector('h1', { timeout: 30000 }); await page.waitForTimeout(800) }
const btn = (name, opts = {}) => page.getByRole('button', { name, ...opts })
const text = () => page.locator('body').innerText()
const radio = (group, name) => page.getByRole('radiogroup', { name: group }).getByRole('radio', { name, exact: true })
const mine = (s) => s.submissions.filter((x) => x.studentId === 'stu-maya')

/** Logs IV catheter insertion and Sterile dressing change through the four steps, then requests sign-off from J. Delgado by QR. */
async function logAndRequest() {
  await open('/v2/student/pick-and-rate')
  await page.locator(`#pick-${IV}`).click()
  await page.locator(`#pick-${SD}`).click()
  await btn('Continue to setting').click()
  await page.getByRole('heading', { name: 'Where did you do it?' }).waitFor()
  await btn('Continue to rating').click()
  await radio('Your rating for IV catheter insertion', 'Works with prompts').click()
  for (const q of ['Performed hand hygiene before and after', 'Kept the field clean throughout', 'Explained each step to the patient']) await radio(`${q} for Sterile dressing change`, 'Yes').click()
  await btn('Review').click()
  await page.getByRole('heading', { name: 'Review and save' }).waitFor()
  await btn('Save 2 entries').click()
  await page.locator('[data-saved]').waitFor()
  await page.getByRole('link', { name: 'Ask for sign-off', exact: true }).click()
  await page.getByRole('heading', { name: /Ready to send \(2\)/, level: 2 }).waitFor()
  await page.locator('#eval-pre-delgado').click()
  await btn('Create request and show QR code').click()
  await page.locator('[data-qr-dialog]').waitFor()
  const link = await page.locator('[data-qr-link]').inputValue()
  return { link, path: link.replace(base, ''), id: new URL(link).searchParams.get('request') }
}

async function fillIv(level, outcome, feedback) {
  await radio('Level of supervision you observed for IV catheter insertion', level).click()
  await radio('Outcome for IV catheter insertion', outcome).click()
  if (feedback) await page.locator(`#fb-${IV}`).fill(feedback)
}
async function fillSd(answers, outcome, feedback) {
  const qs = ['Performed hand hygiene before and after', 'Kept the field clean throughout', 'Explained each step to the patient']
  if (answers) for (let i = 0; i < 3; i++) await radio(`${qs[i]} for Sterile dressing change`, answers[i] === 'yes' ? 'Yes' : 'No').click()
  await radio('Outcome for Sterile dressing change', outcome).click()
  if (feedback) await page.locator(`#fb-${SD}`).fill(feedback)
}

try {
  step('0. Start from the seed, publish IV in the admin step')
  await open('/v2')
  await page.evaluate(() => localStorage.clear())
  await open('/v2/admin/validate-publish')
  await btn('Publish IV catheter insertion').click()
  await page.getByRole('dialog').getByRole('button', { name: 'Publish IV catheter insertion' }).click()
  await page.getByText(/is now in use/).waitFor()
  await open('/v2/student')
  let s = await store()
  const seedEvalCount = s.evaluations.length
  check('seed: one remediation plan in progress for another student', s.remediations.length === 1 && s.remediations[0].status === 'in-progress' && s.remediations[0].studentId === 'stu-04')

  step('1. Student logs two skills and asks J. Delgado by QR')
  const req = await logAndRequest()
  s = await store()
  const sub = mine(s).find((x) => x.id === req.id)
  check('the request names both skills and J. Delgado, status with-evaluator', sub && sub.skillIds.join() === `${IV},${SD}` && sub.status === 'with-evaluator' && sub.assignedToId === 'pre-delgado', sub)

  step('2. The preceptor link: no account, one pass for both skills')
  await open(req.path)
  check('title names the student and says no account is needed', (await page.getByRole('heading', { level: 1 }).textContent()) === 'Evaluate Maya Ferreira' && (await page.getByText('You opened this link as J. Delgado, RN. No account is needed.').count()) === 1)
  check('one card per skill, in the request order', (await page.locator('[data-skill-form]').evaluateAll((els) => els.map((e) => e.getAttribute('data-skill-form')))).join() === `${IV},${SD}`)
  check('IV shows the program\'s own levels, in order', JSON.stringify(await page.getByRole('radiogroup', { name: 'Level of supervision you observed for IV catheter insertion' }).getByRole('radio').evaluateAll((els) => els.map((e) => e.closest('label')?.textContent?.trim()))) === JSON.stringify(['Needs coaching', 'Works with prompts', 'Works alone']))
  check('Sterile dressing shows its three questions as Yes or No', (await page.locator(`[data-skill-form="${SD}"] fieldset`).count()) >= 4)
  check('three outcomes, the third is "Not yet, feedback only"', JSON.stringify(await page.getByRole('radiogroup', { name: 'Outcome for IV catheter insertion' }).getByRole('radio').evaluateAll((els) => els.map((e) => e.closest('label')?.textContent?.trim()))) === JSON.stringify(['Met', 'Not met', 'Not yet, feedback only']))
  await page.getByRole('button', { name: /What Maya supplied for IV catheter insertion/ }).click()
  check('the student\'s own entry is shown as context (EV-04)', (await page.locator('[data-student-context]').first().textContent()).includes('Works with prompts'))
  check('the evaluator is told the evidence counts now (EV-07)', (await page.locator('[data-counts-note]').textContent()) === "This counts toward Maya's record as soon as you submit.")
  check('feedback is marked required for IV (program setting, EV-06)', (await page.getByText('Feedback for IV catheter insertion (required)').count()) === 1)

  step('3. Qualified-evaluator rules: blocked, with the reason and what to do')
  await open(`${req.path}&as=lab-whitmore`)
  check('lab instructor blocked on a clinical request, form not rendered', (await page.locator('[data-access="unqualified"]').count()) === 1 && (await page.locator('[data-eval-form]').count()) === 0 && /Lab instructors sign off in the lab, not in clinical practice/.test(await text()), (await page.locator('[data-access]').textContent()))
  check('blocked page says how to fix it', (await page.getByText('Ask Maya to send this request to a qualified evaluator.').count()) === 1)
  await open(`${req.path}&as=pre-castillo`)
  check('a qualified colleague the request was not sent to is told so', (await page.locator('[data-access="not-on-request"]').count()) === 1 && (await page.getByText('Maya Ferreira sent this request to J. Delgado, RN, not to M. Castillo, RN.').count()) === 1)
  await putStore(`s.people.find(p => p.id === 'pre-delgado').yearsPractice = 1`)
  await open(req.path)
  check('the named evaluator is blocked when the rule says 2 or more years and she has 1', (await page.locator('[data-access="unqualified"]').count()) === 1 && (await page.getByText('IV catheter insertion: Needs 2 or more years of practice (has 1)').count()) === 1)
  await putStore(`s.people.find(p => p.id === 'pre-delgado').yearsPractice = 9`)
  await open('/v2/preceptor/preceptor-evaluation?request=sub-nope')
  check('an unknown link says what happened and what to do', (await page.getByText('This link does not match a request.').count()) === 1 && (await page.getByText('Ask the student to send a new one.').count()) === 1)

  step('4. Validation: every problem, one summary, focus moves')
  await open(req.path)
  await btn(/^Submit evaluation of 2 skills$/).click()
  await page.locator('[data-error-summary]').waitFor()
  const items = await page.locator('[data-error-summary] li').allTextContents()
  check('summary lists 4 problems in form order', items.length === 4 && items[0] === 'Choose an outcome for IV catheter insertion: Met, Not met or Not yet.' && items[1] === 'Write feedback for IV catheter insertion. The program requires it on every evaluation.' && items[3] === 'Confirm your credentials before you submit.', items)
  check('focus moved to the summary', await page.evaluate(() => document.activeElement?.hasAttribute('data-error-summary')))
  await page.locator('[data-error-summary] li').nth(3).getByRole('button').click()
  check('an error link moves focus to its field', await page.evaluate(() => document.activeElement?.id === 'attest'))
  check('nothing was saved', (await store()).evaluations.length === seedEvalCount)
  await fillIv('Works alone', 'Met', null)
  await fillSd(['yes', 'yes', 'yes'], 'Not yet, feedback only', null)
  await page.locator('#attest').click()
  await btn(/^Submit evaluation of 2 skills$/).click()
  const items2 = await page.locator('[data-error-summary] li').allTextContents()
  check('Not yet needs feedback; the messages say why', items2.includes('Write feedback for IV catheter insertion. The program requires it on every evaluation.') && items2.includes('Write feedback for Sterile dressing change. Not yet records feedback only, so the student needs your words.'), items2)
  await page.locator('#concern-flag').click()
  await btn(/^Submit evaluation of 2 skills$/).click()
  check('a concern without a description is refused', (await page.locator('[data-error-summary] li').allTextContents()).includes('Describe the concern, or turn the flag off.'))

  step('5. Round 1: IV Met, Sterile dressing Not yet, a confidential concern')
  await page.locator(`#fb-${IV}`).fill('Calm, sterile technique. Second attempt was cleaner.')
  await page.locator(`#fb-${SD}`).fill('Re-check the order of the field set-up.')
  await page.locator('#concern-note').fill(CONCERN)
  await btn(/^Submit evaluation of 2 skills$/).click()
  await page.locator('[data-receipt]').waitFor()
  s = await store()
  const r1 = s.evaluations.filter((e) => e.submissionId === req.id)
  check('two evaluations created, one per skill, with the right outcomes', r1.length === 2 && r1.find((e) => e.skillId === IV).outcome === 'met' && r1.find((e) => e.skillId === SD).outcome === 'not-yet', r1.map((e) => [e.skillId, e.outcome, e.status]))
  const r1iv = r1.find((e) => e.skillId === IV)
  check('version 1 holds level, feedback and the attestation', r1iv.versions[0].detail.levelIndex === 2 && r1iv.versions[0].detail.feedback.startsWith('Calm') && /RN, 2 or more years of practice, trained in IV therapy/.test(r1iv.versions[0].detail.attested.text))
  check('request is done and names who completed it', mine(s).find((x) => x.id === req.id).status === 'done' && mine(s).find((x) => x.id === req.id).completedById === 'pre-delgado')
  check('no plan for Not yet or Met', s.remediations.length === 1)
  check('the receipt confirms this sitting (Submitted)', (await page.getByText(/Submitted\. Maya's evaluation is recorded/).count()) === 1)
  check('the receipt says counts now, and feedback only for Not yet', /Counts toward Maya's record now/.test(await text()) && /Feedback only\. Nothing was recorded as passed or failed/.test(await text()))
  check('the receipt mentions the concern without its text', (await page.getByText('Your concern went to program staff').count()) === 1 && !(await text()).includes('E2E-CONCERN-NOTE'))
  await open(req.path)
  check('the link now shows a read-only completed record, no form', (await page.locator('[data-eval-form]').count()) === 0 && (await page.getByText(/Completed by J\. Delgado, RN/).count()) === 1)
  check('the confidential concern is stored for staff only', s.concerns.at(-1).note === CONCERN && s.concerns.at(-1).visibleTo === 'faculty-only')

  step('6. The student sees progress and feedback, and never the concern')
  await open('/v2/student')
  const ivCard = page.locator('[data-skill-card="sk-iv-cath"]')
  check('home: IV progress moved to 1 of 4', (await ivCard.getByText('1 of 4 successful evaluations').count()) === 1, await ivCard.locator('[data-progress]').textContent())
  const studentTexts = []
  studentTexts.push(await text())
  await open('/v2/student/history')
  studentTexts.push(await text())
  check('history: Not yet is its own outcome, not a fail', (await page.locator('[data-attempt="not-yet"]').count()) >= 1 && (await page.getByText('Not yet, feedback only').count()) >= 1)
  await page.getByRole('button', { name: /^See details of attempt 1 at IV catheter insertion/ }).click()
  await page.getByRole('link', { name: 'See the full evaluation and versions' }).click()
  await page.waitForSelector('h1')
  await page.waitForTimeout(600)
  check('student evaluation page shows version 1 with feedback', (await page.locator('[data-version="1"]').count()) === 1 && (await page.getByText('Calm, sterile technique').count()) === 1)
  studentTexts.push(await text())
  check('no student screen contains the concern text', studentTexts.every((t) => !t.includes('E2E-CONCERN-NOTE') && !t.toLowerCase().includes('arrived late')))

  step('7. Staff see the concern')
  await open('/v2/admin/outcomes')
  check('admin outcomes lists the concern with its text, for staff only', (await page.locator('[data-concern]').filter({ hasText: 'E2E-CONCERN-NOTE' }).count()) === 1)
  await open('/v2/reviewer/outcome-remediation')
  check('step 9 route renders the same outcomes screen for the reviewer', (await page.locator('[data-outcomes-page]').count()) === 1)

  step('8. Round 2: IV Not met opens a plan, Sterile dressing Met')
  const req2 = await logAndRequest()
  await open(req2.path)
  await fillIv('Needs coaching', 'Not met', 'Contamination at the insertion site. Review the aseptic steps.')
  await fillSd(['yes', 'yes', 'yes'], 'Met', null)
  await page.locator('#attest').click()
  await btn(/^Submit evaluation of 2 skills$/).click()
  await page.locator('[data-receipt]').waitFor()
  s = await store()
  const plan = s.remediations.find((r) => r.studentId === 'stu-maya')
  check('a fail on a skill with auto-remediation opened exactly one plan, 3 open steps', s.remediations.filter((r) => r.studentId === 'stu-maya').length === 1 && plan.status === 'open' && plan.steps.length === 3 && plan.skillId === IV, plan)
  check('Sterile dressing Met had no plan; the receipt says follow-up is coming', (await page.getByText(/Program staff will follow up with Maya/).count()) === 1)

  step('9. Remediation plan: student view, staff view, steps, close')
  await open('/v2/student')
  check('student home shows the plan card', (await page.locator(`[data-plan-card="${plan.id}"]`).count()) === 1)
  await page.locator(`[data-plan-card="${plan.id}"]`).getByRole('link', { name: 'See your plan' }).click()
  await page.waitForSelector('h1')
  await page.waitForTimeout(500)
  check('student plan: title, 3 steps, status, attempts, no controls to change it', (await page.getByRole('heading', { level: 1 }).textContent()) === 'Remediation plan: IV catheter insertion' && (await page.locator('[data-plan-steps] li').count()) === 3 && (await page.locator('[data-plan-steps] input, [data-plan-steps] [role="checkbox"]').count()) === 0 && (await page.locator('[data-attempt-info]').count()) === 1)
  check('student plan: attempts used and next attempt date', /2 of 3 attempts used/.test(await page.locator('[data-attempt-info]').textContent()) && /next attempt can start from/.test(await page.locator('[data-attempt-info]').textContent()), await page.locator('[data-attempt-info]').textContent())
  await open('/v2/admin/outcomes')
  check('admin outcomes lists the new plan', (await page.locator(`[data-plan="${plan.id}"]`).count()) === 1)
  await open(`/v2/admin/remediation/${plan.id}`)
  await page.locator('#step-0').click()
  await page.getByText('Step marked done.').waitFor()
  s = await store()
  check('staff ticks a step: status becomes in progress, step records who and when', s.remediations.find((r) => r.id === plan.id).status === 'in-progress' && s.remediations.find((r) => r.id === plan.id).steps[0].doneById === 'adm-ross')
  await open(`/v2/student/remediation/${plan.id}`)
  check('student sees the step done', /1 of 3 done/.test(await page.getByRole('heading', { level: 2, name: /^Steps/ }).textContent()))
  await open(`/v2/admin/remediation/${plan.id}`)
  await btn('Close plan', { exact: true }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Close plan' }).click()
  check('closing early without a reason is refused with the reason', (await page.getByText(/Say why you are closing this plan before every step is done/).count()) === 1)
  await page.locator('#close-note').fill('Student moved to the evening cohort.')
  await page.getByRole('dialog').getByRole('button', { name: 'Close plan' }).click()
  await page.getByText('Plan closed.').waitFor()
  s = await store()
  check('plan closed with a note, who and when; steps now read-only', s.remediations.find((r) => r.id === plan.id).closed.note === 'Student moved to the evening cohort.' && (await page.locator('#step-0').isDisabled()) && (await page.locator('[data-plan-closed]').count()) === 1)

  step('10. Versioned edit: reopen keeps the original, both roles can read the history')
  const v1Before = JSON.stringify((await store()).evaluations.find((e) => e.id === r1iv.id).versions[0])
  const ivProgress = async () => { await open('/v2/student'); return page.locator('[data-skill-card="sk-iv-cath"] [data-progress]').first().textContent() }
  check('before: IV shows 1 successful evaluation', /1 of 4/.test(await ivProgress()))
  await open(`/v2/admin/evaluation/${r1iv.id}`)
  check('staff page shows version 1 only, with Reopen to edit', (await page.locator('[data-version]').count()) === 1 && (await btn('Reopen to edit').count()) === 1)
  await btn('Reopen to edit').click()
  await page.getByRole('dialog').getByRole('button', { name: 'Reopen and add version 2' }).click()
  check('reopen refuses until there is a change and a reason, in plain words', (await page.getByText(/Say why you are reopening this evaluation|Change the outcome or the feedback/).count()) >= 1)
  await page.getByRole('dialog').getByText('Not yet, feedback only', { exact: true }).click()
  await page.locator('#reopen-reason').fill('The evaluator told us the wrong level was ticked.')
  await page.getByRole('dialog').getByRole('button', { name: 'Reopen and add version 2' }).click()
  await page.getByText(/Version 2 added/).waitFor()
  s = await store()
  const evR = s.evaluations.find((e) => e.id === r1iv.id)
  check('version 2 added with who, when and why; status reopened; outcome updated', evR.versions.length === 2 && evR.versions[1].by === 'adm-ross' && evR.versions[1].reason === 'The evaluator told us the wrong level was ticked.' && evR.status === 'reopened' && evR.outcome === 'not-yet', evR.versions[1])
  check('version 1 is byte-for-byte what the evaluator submitted', JSON.stringify(evR.versions[0]) === v1Before)
  check('timeline shows v2 current and v1 as an earlier version, kept as it was', (await page.locator('[data-version="2"]').count()) === 1 && (await page.locator('[data-version="1"]').getByText('Earlier version, kept exactly as it was.').count()) === 1)
  check('reopened evaluation no longer counts for the student', /0 of 4/.test(await ivProgress()), await page.locator('[data-skill-card="sk-iv-cath"] [data-progress]').first().textContent())
  await open(`/v2/student/evaluation/${r1iv.id}`)
  check('student reads the same history: both versions, the reason, no staff actions', (await page.locator('[data-version]').count()) === 2 && (await page.getByText('Why: The evaluator told us the wrong level was ticked.').count()) === 1 && (await btn('Reopen to edit').count()) === 0)
  await open(`/v2/reviewer/evaluation/${r1iv.id}`)
  await btn('Confirm version 2 as final').click()
  await page.getByText(/Version 2 confirmed as final/).waitFor()
  s = await store()
  check('confirm returns the evaluation to counted, still with both versions', s.evaluations.find((e) => e.id === r1iv.id).status === 'counted' && s.evaluations.find((e) => e.id === r1iv.id).versions.length === 2)
  check('audit records the reopen and the confirm', s.audit.some((a) => a.action === 'Reopened evaluation' && a.actorId === 'adm-ross') && s.audit.some((a) => a.action.startsWith('Confirmed version 2') && a.actorId === 'rev-haddad'))

  step('11. State survives a reload; no uncaught page errors')
  await page.reload({ waitUntil: 'load' })
  await page.waitForSelector('h1')
  await page.waitForTimeout(800)
  check('after reload the history still shows two versions', (await page.locator('[data-version]').count()) === 2)
  check('no uncaught page errors', pageErrors.length === 0, pageErrors)
} catch (e) {
  failures++
  console.log(`FAIL  script error: ${String(e).slice(0, 600)}`)
} finally {
  await browser.close()
}
console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILED`}`)
process.exit(failures === 0 ? 0 : 1)
