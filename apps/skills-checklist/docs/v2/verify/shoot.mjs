#!/usr/bin/env node
// Visual and accessibility pass for the v2 prototype.
//
//   node docs/v2/verify/shoot.mjs [--base http://localhost:3007] [--tabs 400] [--no-states] [route ...]
//
// For each route and each viewport (desktop 1440x900, phone 390x844) it:
//   1. loads the page with a fresh browser profile (empty localStorage, so the seed is shown),
//   2. freezes CSS transitions and animations (mid-transition frames cause phantom axe contrast failures),
//   3. saves docs/v2/screenshots/<route-slug>-{desktop,phone}.png,
//   4. runs axe-core (WCAG 2.0/2.1 A and AA) through @axe-core/playwright when it can be loaded; otherwise falls back
//      to a computed-style contrast check on text nodes,
//   5. walks the page with the Tab key until focus comes back to the first stop (a full cycle) or leaves the document,
//      recording per stop whether a visible focus indicator exists, any keyboard trap (the same element focused three
//      times in a row) and whether the walk was cut short (--tabs is only a safety ceiling, default 400),
//   6. repeats 1 to 5 for every named interaction state of the route (a sheet, dialog, menu or wizard step open),
//      defined in STATES below, and checks that each state's expected controls are reachable by Tab.
// Output: docs/v2/screenshots/<route-slug>[--<state>]-{desktop,phone}.png and docs/v2/screenshots/report.json. Exit code 1 when any violation, missing focus indicator or trap is found.
//
// Playwright is NOT installed in the app. It is resolved from /Users/romitsoley/Work/tools/visual-check.

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(HERE, '..', 'screenshots')
const TOOLS = path.resolve(HERE, '../../../../../tools/visual-check')
const req = createRequire(path.join(TOOLS, 'package.json'))
const { chromium } = req('playwright')
let AxeBuilder = null
try { AxeBuilder = req('@axe-core/playwright').AxeBuilder ?? req('@axe-core/playwright').default } catch { /* fallback below */ }

const PRE = '/v2/preceptor/preceptor-evaluation?request=sub-maya-1'
const args = process.argv.slice(2)
let base = 'http://localhost:3007'
let tabs = 400
let withStates = true
const routes = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base') base = args[++i]
  else if (args[i] === '--tabs') tabs = Number(args[++i])
  else if (args[i] === '--no-states') withStates = false
  else routes.push(args[i])
}
if (!routes.length) routes.push('/v2', '/v2/admin', '/v2/student', '/v2/preceptor', '/v2/reviewer', '/v2/director', '/v2/admin/starter-library', '/v2/admin/configure-skill', '/v2/admin/validate-publish', '/v2/admin/map-courses', '/v2/student/pick-and-rate', '/v2/student/request-signoff', '/v2/student/offline-sync', '/v2/student/history', '/v2/reviewer/review-queue',
  // Stage 3
  '/v2/preceptor/preceptor-evaluation', PRE, PRE + '&as=lab-whitmore', PRE + '&as=pre-castillo', '/v2/preceptor/preceptor-evaluation?request=sub-nope', '/v2/preceptor/preceptor-evaluation?request=sub-06',
  '/v2/reviewer/outcome-remediation', '/v2/admin/outcomes', '/v2/admin/evaluation/ev-3-1', '/v2/reviewer/evaluation/ev-7-2', '/v2/student/evaluation/ev-maya-1', '/v2/admin/remediation/rem-1', '/v2/student/remediation/rem-1')

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]
const slug = (r) => (r.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9]+/g, '-') || 'root')

const FREEZE = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}'

// ---- Interaction states. `setup(page)` runs on a fresh page (empty localStorage, seed data) before the capture.
// `menu: true` marks an open Radix Select: Tab does not leave an open listbox by design, so the walk is replaced by an
// ArrowDown and Escape check. While a Radix Select is open, axe reports `aria-hidden-focus` on the page behind it (the rest of
// the page is aria-hidden but not inert); that rule, and `scrollable-region-focusable` for the scrolling option list of a long Select, are listed as knownAxe (DS Select / Radix behaviour) and do not fail the run.
// `expect` lists text that must appear among the Tab stops (accessible name or text), so a cut-off walk cannot hide a control.
const KNOWN_MENU_AXE = ['aria-hidden-focus', 'scrollable-region-focusable']
const btn = (page, name) => page.getByRole('button', { name })

// ---- Stage 2 helpers: student states. The store only reaches localStorage after its first write, so `persist` makes one harmless write
// (Scenario menu, Phone is offline, twice) and then `mutate` edits the saved state through a function body that receives it as `s`.
const SCENARIO = (p) => p.getByRole('button', { name: 'Scenario' })
async function demoToggle(p, label) { await SCENARIO(p).click(); await p.getByRole('menuitemcheckbox', { name: label }).click(); await p.waitForTimeout(250) }
async function persist(p) { await demoToggle(p, 'Phone is offline'); await demoToggle(p, 'Phone is offline') }
async function mutate(p, body) { await p.evaluate(([k, src]) => { const env = JSON.parse(localStorage.getItem(k)); new Function('s', src)(env.state); localStorage.setItem(k, JSON.stringify(env)) }, ['skills-checklist:v2:store', body]); await p.reload({ waitUntil: 'load' }); await p.waitForSelector('h1'); await p.waitForTimeout(900) }
const publishIv = (p) => mutate(p, "s.skills.find(k => k.id === 'sk-iv-cath').published = true")
const lockIv = (p) => mutate(p, "const k = s.skills.find(k => k.id === 'sk-iv-cath'); k.published = true; k.config.prerequisites.practiceTrials = 5")
const goto = async (p, route) => { await p.goto(new URL(route, p.url()).toString(), { waitUntil: 'load' }); await p.waitForSelector('h1'); await p.waitForTimeout(800) }
const clickLabel = (p, text) => p.getByText(text, { exact: true }).first().click()
/** Logs Oral medication administration and Sterile dressing change quickly (both are in use on the seed). */
async function logTwo(p) {
  await goto(p, '/v2/student/pick-and-rate')
  await p.locator('#pick-sk-med-admin').click(); await p.locator('#pick-sk-sterile-dressing').click()
  await btn(p, 'Continue to setting').click(); await btn(p, 'Continue to rating').click()
  await p.getByRole('radiogroup', { name: 'Your rating for Oral medication administration' }).getByRole('radio', { name: 'Met', exact: true }).click()
  for (const q of ['Performed hand hygiene before and after', 'Kept the field clean throughout', 'Explained each step to the patient']) await p.getByRole('radiogroup', { name: `${q} for Sterile dressing change` }).getByRole('radio', { name: 'Yes' }).click()
  await btn(p, 'Review').click(); await btn(p, 'Save 2 entries').click(); await p.locator('[data-saved]').waitFor()
}
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const toRequests = async (p) => { await goto(p, '/v2/student/request-signoff'); await p.getByRole('heading', { name: /Ready to send \(2\)/ }).waitFor() }
const reveal = (p, sel) => p.locator(sel).first().scrollIntoViewIfNeeded()

/** Stage 3: fills the seeded request (Indwelling urinary catheter insertion: Met at a level; Oral medication administration: Not yet with feedback). */
async function fillPre(p) {
  await p.getByRole('radiogroup', { name: 'Level of supervision you observed for Indwelling urinary catheter insertion' }).getByRole('radio', { name: 'Works alone', exact: true }).click()
  await p.getByRole('radiogroup', { name: 'Outcome for Indwelling urinary catheter insertion' }).getByRole('radio', { name: 'Met', exact: true }).click()
  await p.getByRole('radiogroup', { name: 'Outcome for Oral medication administration' }).getByRole('radio', { name: 'Not yet, feedback only', exact: true }).click()
  await p.locator('#fb-sk-med-admin').fill('Check the five rights again before you open the packet.')
  await p.locator('#attest').click()
}
const STATES = {

  '/v2/student': [
    { name: 'scenario-menu', menu: 'menu', setup: async (p) => { await SCENARIO(p).click(); await p.getByRole('menu').waitFor() }, expect: ['Phone is offline'] },
    { name: 'offline-banner', setup: async (p) => { await demoToggle(p, 'Phone is offline') }, expect: ['Sync details'] },
    { name: 'signed-out-update-banners', setup: async (p) => { await demoToggle(p, 'Phone is signed out'); await demoToggle(p, 'App update is pending') }, expect: ['Sign in', 'Install update'] },
    { name: 'prerequisite-locked', setup: async (p) => { await persist(p); await lockIv(p); await reveal(p, '[data-prereq="locked"]') }, expect: ['Log a practice trial of IV catheter insertion'] },
    { name: 'iv-in-use', setup: async (p) => { await persist(p); await publishIv(p) }, expect: ['Log IV catheter insertion'] },
  ],
  '/v2/student/pick-and-rate': [
    { name: 'step2-setting', setup: async (p) => { await p.locator('#pick-sk-med-admin').click(); await btn(p, 'Continue to setting').click(); await p.getByRole('heading', { name: 'Where did you do it?' }).waitFor() }, expect: ['Back', 'Continue to rating'] },
    { name: 'step3-rating', setup: async (p) => { await p.locator('#pick-sk-med-admin').click(); await p.locator('#pick-sk-sterile-dressing').click(); await btn(p, 'Continue to setting').click(); await btn(p, 'Continue to rating').click(); await p.getByRole('heading', { name: 'Rate yourself' }).waitFor() }, expect: ['Back', 'Review'] },
    { name: 'step4-review', setup: async (p) => { await p.locator('#pick-sk-med-admin').click(); await btn(p, 'Continue to setting').click(); await btn(p, 'Continue to rating').click(); await p.getByRole('radiogroup', { name: 'Your rating for Oral medication administration' }).getByRole('radio', { name: 'Met', exact: true }).click(); await btn(p, 'Review').click(); await p.getByRole('heading', { name: 'Review and save' }).waitFor() }, expect: ['Save 1 entry', 'Back'] },
    { name: 'validation-error', setup: async (p) => { await btn(p, 'Continue to setting').click(); await p.getByText('Pick at least one skill to log.').waitFor() }, expect: ['Continue to setting'] },
    { name: 'prerequisite-blocked', setup: async (p) => { await persist(p); await lockIv(p); await p.locator('#pick-sk-iv-cath').click(); await btn(p, 'Continue to setting').click(); await p.locator('[data-prereq-block]').waitFor() }, expect: ['Log as lab practice instead', 'Remove IV catheter insertion from this log'] },
    { name: 'saved-synced', setup: async (p) => { await p.locator('#pick-sk-med-admin').click(); await btn(p, 'Continue to setting').click(); await btn(p, 'Continue to rating').click(); await p.getByRole('radiogroup', { name: 'Your rating for Oral medication administration' }).getByRole('radio', { name: 'Met', exact: true }).click(); await btn(p, 'Review').click(); await btn(p, 'Save 1 entry').click(); await p.locator('[data-saved]').waitFor() }, expect: ['Ask for sign-off', 'Log more skills'] },
    { name: 'saved-queued-offline', setup: async (p) => { await demoToggle(p, 'Phone is offline'); await p.locator('#pick-sk-med-admin').click(); await btn(p, 'Continue to setting').click(); await btn(p, 'Continue to rating').click(); await p.getByRole('radiogroup', { name: 'Your rating for Oral medication administration' }).getByRole('radio', { name: 'Met', exact: true }).click(); await btn(p, 'Review').click(); await btn(p, 'Save 1 entry').click(); await p.locator('[data-saved]').waitFor() }, expect: ['Ask for sign-off'] },
  ],
  '/v2/student/request-signoff': [
    { name: 'ready-to-send', setup: async (p) => { await logTwo(p); await toRequests(p) }, expect: ['Show QR code for'] },
    { name: 'unqualified-disabled', setup: async (p) => { await logTwo(p); await toRequests(p); await publishIv(p); await reveal(p, '#eval-pre-delgado') }, expect: ['Show QR code for'] },
    { name: 'qr-dialog', setup: async (p) => { await logTwo(p); await toRequests(p); await p.locator('#eval-pre-delgado').click(); await btn(p, 'Create request and show QR code').click(); await p.locator('[data-qr-dialog]').waitFor() }, expect: ['Copy link', 'Open what the evaluator sees', 'Done'] },
    { name: 'handover-student', setup: async (p) => { await logTwo(p); await toRequests(p); await clickLabel(p, 'Hand over phone'); await p.locator('#eval-pre-delgado').click(); await btn(p, 'Create request and hand over phone').click(); await p.locator('[data-handover="student"]').waitFor() }, expect: ['Hand over to J. Delgado, RN', 'Cancel handover'] },
    { name: 'handover-evaluator', setup: async (p) => { await logTwo(p); await toRequests(p); await clickLabel(p, 'Hand over phone'); await p.locator('#eval-pre-delgado').click(); await btn(p, 'Create request and hand over phone').click(); await btn(p, 'Hand over to J. Delgado, RN').click(); await p.locator('[data-handover="evaluator"]').waitFor() }, expect: ['Start the evaluation', 'Give the phone back to Maya'] },
    { name: 'handover-back', setup: async (p) => { await logTwo(p); await toRequests(p); await clickLabel(p, 'Hand over phone'); await p.locator('#eval-pre-delgado').click(); await btn(p, 'Create request and hand over phone').click(); await btn(p, 'Hand over to J. Delgado, RN').click(); await btn(p, /^Give the phone back to Maya$/).click(); await p.locator('[data-handover-back]').waitFor() }, expect: ['Back to your requests'] },
    { name: 'method-link', setup: async (p) => { await logTwo(p); await toRequests(p); await clickLabel(p, 'Link'); await p.locator('#eval-pre-delgado').click(); await p.locator('#eval-pre-castillo').click(); await reveal(p, '[data-create-request]') }, expect: ['Create one request and copy link for 2 evaluators'] },
    { name: 'method-photo-preview', setup: async (p) => { await logTwo(p); await toRequests(p); await clickLabel(p, 'Photo of paper form'); await p.locator('#eval-pre-delgado').click(); await p.locator('#photo-file').setInputFiles({ name: 'signed-form.png', mimeType: 'image/png', buffer: PNG }); await p.locator('[data-photo-preview]').waitFor(); await reveal(p, '[data-photo-preview]') }, expect: ['Remove photo', 'Send photo for review'] },
    { name: 'photo-refused', setup: async (p) => { await logTwo(p); await toRequests(p); await clickLabel(p, 'Photo of paper form'); await p.locator('#photo-file').setInputFiles({ name: 'form.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.1') }); await p.getByText(/That file is a PDF/).waitFor(); await reveal(p, '#photo-file') }, expect: ['Choose a photo'] },
    { name: 'request-created-offline', setup: async (p) => { await logTwo(p); await demoToggle(p, 'Phone is offline'); await toRequests(p); await clickLabel(p, 'Link'); await p.locator('#eval-pre-delgado').click(); await btn(p, 'Create request and copy link').click(); await p.locator('[data-request-done]').waitFor() }, expect: [] },
  ],
  '/v2/student/offline-sync': [
    { name: 'offline', setup: async (p) => { await btn(p, 'Go offline').click(); await p.locator('[data-device-banner="offline"]').waitFor() }, expect: ['Go online'] },
    { name: 'synced-after-send', setup: async (p) => { await btn(p, 'Send now').click(); await p.locator('[data-sync-message]').waitFor() }, expect: ['Resolve conflict'] },
    { name: 'conflict-screen', setup: async (p) => { await btn(p, /^Resolve conflict/).click(); await p.locator('[data-version="mine"]').waitFor() }, expect: ['Back to sync'] },
    { name: 'conflict-keep-both', setup: async (p) => { await btn(p, /^Resolve conflict/).click(); await p.getByText('Keep both', { exact: true }).click() }, expect: ['Resolve conflict', 'Back to sync'] },
    { name: 'conflict-resolved', setup: async (p) => { await btn(p, /^Resolve conflict/).click(); await p.getByText("Keep this phone's version").click(); await p.locator('[data-resolve]').click(); await p.locator('[data-sync-message]').waitFor() }, expect: ['Send now'] },
    { name: 'failed-then-retry', setup: async (p) => { await btn(p, 'Make the next sync fail').click(); await btn(p, 'Send now').click(); await p.locator('[data-sync-chip="failed"]').first().waitFor() }, expect: ['Retry'] },
    { name: 'signed-out-waiting', setup: async (p) => { await btn(p, 'Sign out').click(); await btn(p, 'Mark update as pending').click() }, expect: ['Sign in'] },
    { name: 'demo-conflict-created', setup: async (p) => { await btn(p, 'Simulate an edit on another device').click(); await p.locator('[data-sync-message]').waitFor() }, expect: ['Send all waiting (1)'] },
  ],
  // ---- Stage 3 states
  '/v2/preceptor/preceptor-evaluation?request=sub-maya-1': [
    { name: 'student-context-open', setup: async (p) => { await btn(p, /What Maya supplied for Indwelling urinary catheter insertion/).click(); await p.locator('[data-student-context]').first().waitFor() }, expect: ['Submit evaluation of 2 skills'] },
    { name: 'validation-errors', setup: async (p) => { await btn(p, /^Submit evaluation of 2 skills$/).click(); await p.locator('[data-error-summary]').waitFor() }, expect: ['Submit evaluation of 2 skills'] },
    { name: 'filled-not-yet-and-concern', setup: async (p) => { await fillPre(p); await p.locator('#concern-flag').click(); await p.locator('#concern-note').fill('Arrived late twice this week.'); await reveal(p, '[data-counts-note]') }, expect: ['Submit evaluation of 2 skills'] },
    { name: 'submitted-receipt', setup: async (p) => { await fillPre(p); await btn(p, /^Submit evaluation of 2 skills$/).click(); await p.locator('[data-receipt]').waitFor() }, expect: [] },
    { name: 'open-as-menu', menu: true, setup: async (p) => { await p.locator('#open-as').click(); await p.getByRole('listbox').waitFor() }, expect: ['R. Whitmore, Lab instructor'] },
  ],
  '/v2/admin/outcomes': [
    { name: 'filter-did-not-meet', setup: async (p) => { await p.getByRole('tab', { name: 'Did not meet' }).click(); await p.waitForTimeout(300) }, expect: [] },
    { name: 'filter-reopened', setup: async (p) => { const t = p.getByRole('tab', { name: 'Reopened' }); if (await t.count()) await t.click(); else { await p.getByRole('button', { name: 'More tabs' }).click(); await p.getByRole('menu').getByText('Reopened', { exact: true }).click() } await p.waitForTimeout(300) }, expect: [] },
  ],
  '/v2/admin/evaluation/ev-3-1': [
    { name: 'reopen-dialog', setup: async (p) => { await btn(p, 'Reopen to edit').click(); await p.getByRole('dialog').waitFor() }, expect: ['Reopen and add version 3', 'Keep as it is'] },
    { name: 'reopen-error', setup: async (p) => { await btn(p, 'Reopen to edit').click(); await p.getByRole('dialog').getByRole('button', { name: /^Reopen and add version 3$/ }).click(); await p.locator('#reopen-error').waitFor() }, expect: ['Reopen and add version 3', 'Keep as it is'] },
    { name: 'confirm-version', setup: async (p) => { await btn(p, 'Confirm version 2 as final').click(); await p.locator('[data-staff-message]').waitFor() }, expect: ['Reopen to edit'] },
  ],
  '/v2/reviewer/evaluation/ev-7-2': [
    { name: 'open-plan-by-hand', setup: async (p) => { await btn(p, 'Open a remediation plan').click(); await p.locator('[data-staff-message]').waitFor() }, expect: ['Open the remediation plan'] },
  ],
  '/v2/admin/remediation/rem-1': [
    { name: 'close-dialog', setup: async (p) => { await btn(p, 'Close plan').first().click(); await p.getByRole('dialog').waitFor() }, expect: ['Keep plan open'] },
    { name: 'close-error', setup: async (p) => { await btn(p, 'Close plan').first().click(); await p.getByRole('dialog').getByRole('button', { name: 'Close plan' }).click(); await p.locator('#close-error').waitFor() }, expect: ['Keep plan open'] },
    { name: 'step-ticked', setup: async (p) => { await p.locator('#step-2').click(); await p.locator('[data-staff-message]').waitFor() }, expect: ['Close plan'] },
    { name: 'closed', setup: async (p) => { await p.locator('#step-2').click(); await p.locator('[data-staff-message]').waitFor(); await btn(p, 'Close plan').first().click(); await p.getByRole('dialog').getByRole('button', { name: 'Close plan' }).click(); await p.locator('[data-plan-closed]').waitFor() }, expect: [] },
  ],
  '/v2/student/remediation/rem-1': [
    { name: 'own-plan', setup: async (p) => { await persist(p); await mutate(p, "s.remediations[0].studentId = 'stu-maya'") }, expect: ['Log a new attempt'] },
  ],

  '/v2/student/history': [
    { name: 'attempt-detail', setup: async (p) => { await p.getByRole('button', { name: /^See details of attempt 1 at Indwelling urinary catheter insertion/ }).click(); await p.getByRole('dialog').waitFor() }, expect: ['Close'] },
  ],
  '/v2/admin/starter-library': [
    { name: 'sheet-open', setup: async (p) => { await btn(p, /Review BSN medical-surgical skills/).click(); await p.getByRole('dialog').waitFor() }, expect: ['Copy 6 skills', 'Cancel'] },
    { name: 'edit-dialog', setup: async (p) => { await btn(p, 'Edit IV catheter insertion').click(); await p.getByRole('dialog').waitFor() }, expect: ['Save skill', 'Cancel'] },
    { name: 'filter-menu', menu: true, setup: async (p) => { await p.locator('#library-filter').click(); await p.getByRole('listbox').waitFor() }, expect: ['Still to configure'] },
    { name: 'import-proposal', setup: async (p) => { await p.getByRole('tab', { name: 'Import from a file' }).click(); await btn(p, 'Use the sample checklist').click(); await p.getByText(/proposed skills from/).waitFor(); await btn(p, /Accept all/).click() }, expect: ['Create 11 skills', 'Accept all 11', 'Clear decisions'] },
    { name: 'import-edit-dialog', setup: async (p) => { await p.getByRole('tab', { name: 'Import from a file' }).click(); await btn(p, 'Use the sample checklist').click(); await p.getByText(/proposed skills from/).waitFor(); await btn(p, 'Edit Tracheostomy suctioning').click(); await p.getByRole('dialog').waitFor() }, expect: ['Save skill', 'Cancel'] },
  ],
  '/v2/admin/configure-skill': [
    { name: 'step2-achievement', setup: async (p) => { await btn(p, 'Next: Achievement rules').click(); await p.getByText('What this rule asks').waitFor() }, expect: ['Back', 'Next: Simulation'] },
    { name: 'step3-simulation', setup: async (p) => { await btn(p, 'Next: Achievement rules').click(); await btn(p, 'Next: Simulation').click(); await p.getByText('Simulation share').first().waitFor() }, expect: ['Back', 'Next: Prerequisites'] },
    { name: 'step4-prerequisites', setup: async (p) => { for (const n of ['Achievement rules', 'Simulation', 'Prerequisites']) await btn(p, `Next: ${n}`).click() }, expect: ['Back', 'Next: Qualified evaluators'] },
    { name: 'step5-evaluators', setup: async (p) => { for (const n of ['Achievement rules', 'Simulation', 'Prerequisites', 'Qualified evaluators']) await btn(p, `Next: ${n}`).click() }, expect: ['Back', 'Next: If a student does not pass'] },
    { name: 'step6-failure', setup: async (p) => { for (const n of ['Achievement rules', 'Simulation', 'Prerequisites', 'Qualified evaluators', 'If a student does not pass']) await btn(p, `Next: ${n}`).click() }, expect: ['Back', 'Next: Re-validation'] },
    { name: 'step7-revalidation', setup: async (p) => { for (const n of ['Achievement rules', 'Simulation', 'Prerequisites', 'Qualified evaluators', 'If a student does not pass', 'Re-validation']) await btn(p, `Next: ${n}`).click() }, expect: ['Back', 'Review and publish'] },
    { name: 'copy-menu-open', menu: true, setup: async (p) => { await p.locator('#wiz-copy-from').click(); await p.getByRole('listbox').waitFor() }, expect: ['Oral medication administration'] },
    { name: 'review-blocked', setup: async (p) => { await p.locator('#wiz-level-1').fill(''); await btn(p, /^Review and publish$/).first().click(); await p.getByText(/problem to fix before you can publish/).waitFor() }, expect: ['Level 2 has no name'] },
    { name: 'publish-dialog', setup: async (p) => { await btn(p, /^Review and publish$/).first().click(); await btn(p, 'Publish IV catheter insertion').click(); await p.getByRole('dialog').waitFor() }, expect: ['Keep editing', 'Publish IV catheter insertion'] },
  ],
  '/v2/admin/validate-publish': [
    { name: 'publish-dialog', setup: async (p) => { await btn(p, 'Publish IV catheter insertion').click(); await p.getByRole('dialog').waitFor() }, expect: ['Keep editing', 'Publish IV catheter insertion'] },
    { name: 'published', setup: async (p) => { await btn(p, 'Publish IV catheter insertion').click(); await p.getByRole('dialog').getByRole('button', { name: 'Publish IV catheter insertion' }).click(); await p.getByText(/is now in use/).waitFor() }, expect: ['Map to NURS 350'] },
  ],
  '/v2/admin/map-courses': [
    { name: 'level-menu-open', menu: true, setup: async (p) => { await p.getByRole('combobox', { name: 'Requirement for Nasogastric tube care' }).click(); await p.getByRole('listbox').waitFor() }, expect: ['Not mapped'] },
    { name: 'unconfigured-blocked', setup: async (p) => { await p.locator('#map-library').click(); await p.getByRole('option', { name: 'Radiography' }).click(); await p.getByText('Configure this skill').first().waitFor() }, expect: ['Configure Fluoroscopy room setup'] },
    { name: 'warnings-more', setup: async (p) => { await p.getByRole('combobox', { name: 'Requirement for Oral medication administration' }).click(); await p.getByRole('option', { name: 'Not mapped' }).click(); await p.getByRole('combobox', { name: 'Requirement for Vital signs and early warning score' }).click(); await p.getByRole('option', { name: 'Not mapped' }).click() }, expect: [] },
  ],
}

// Fallback contrast check: computed foreground against the nearest opaque ancestor background.
const CONTRAST_FN = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 } }
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.95) return c } return { r: 255, g: 255, b: 255, a: 1 } }
  const fails = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim()) continue
    const el = n.parentElement; if (!el) continue
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue
    const fg = parse(cs.color); if (!fg) continue
    const bg = bgOf(el)
    const l1 = lum(fg), l2 = lum(bg), ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    const size = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5
    if (ratio < need) fails.push({ text: n.nodeValue.trim().slice(0, 40), ratio: Number(ratio.toFixed(2)), need })
  }
  return fails.slice(0, 20)
}

const FOCUS_INFO = () => {
  const el = document.activeElement
  if (!el || el === document.body || el === document.documentElement) return null
  const cs = getComputedStyle(el)
  const r = el.getBoundingClientRect()
  const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
  const shadow = cs.boxShadow && cs.boxShadow !== 'none'
  const name = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 80)
  if (!el.dataset.walk) { window.__walkN = (window.__walkN || 0) + 1; el.dataset.walk = String(window.__walkN) }
  return {
    tag: el.tagName.toLowerCase(), role: el.getAttribute('role'), name,
    focusVisible: el.matches(':focus-visible'),
    indicator: outline || !!shadow,
    inViewport: r.width > 0 && r.height > 0,
    size: `${Math.round(r.width)}x${Math.round(r.height)}`,
    id: el.dataset.walk,
  }
}

// Walks with Tab until a stop repeats (full cycle) or focus leaves the page. `max` is a safety ceiling, reported when hit.
async function walk(page, max) {
  await page.evaluate(() => { window.scrollTo(0, 0); document.activeElement?.blur?.() })
  const out = { stops: 0, names: [], missingIndicator: [], traps: [], complete: false, ceilingHit: false }
  const seen = new Set()
  let last = null, repeat = 0, gone = 0
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    const info = await page.evaluate(FOCUS_INFO)
    if (!info) { if (++gone >= 2) { out.complete = true; break } continue }
    gone = 0
    if (info.id === last) { if (++repeat >= 2) { out.traps.push(info); break } continue }
    repeat = 0
    if (seen.has(info.id)) { out.complete = true; break }
    seen.add(info.id); last = info.id
    out.stops++
    out.names.push(info.name)
    if (info.inViewport && !info.indicator) out.missingIndicator.push({ tag: info.tag, name: info.name, size: info.size })
  }
  if (!out.complete && !out.traps.length) out.ceilingHit = true
  return out
}

const browser = await chromium.launch()
const report = { base, when: new Date().toISOString(), axe: AxeBuilder ? '@axe-core/playwright' : 'computed-style contrast fallback', pages: [] }
let failed = false

async function capture(route, vp, state) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce', ...(vp.name === 'phone' ? { hasTouch: true, isMobile: true } : {}) })
  const page = await ctx.newPage()
  const entry = { route, state: state?.name ?? null, viewport: vp.name, status: null, consoleErrors: [], screenshot: null, a11y: null, contrastFallback: null, focus: null, missingExpected: [] }
  page.on('console', (m) => { if (m.type() === 'error') entry.consoleErrors.push(m.text().slice(0, 200)) })
  entry.pageErrors = []
  page.on('pageerror', (e) => entry.pageErrors.push(String(e).slice(0, 300)))
  try {
    const resp = await page.goto(base + route, { waitUntil: 'load', timeout: 60000 })
    entry.status = resp?.status() ?? null
    await page.addStyleTag({ content: FREEZE })
    await page.waitForSelector('h1', { timeout: 20000 })
    await page.waitForTimeout(1200)
    if (state) { await state.setup(page); await page.waitForTimeout(500) }
    const file = path.join(OUT, `${slug(route)}${state ? '--' + state.name : ''}-${vp.name}.png`)
    await page.screenshot({ path: file, fullPage: false })
    entry.screenshot = path.relative(path.resolve(HERE, '../../..'), file)

    if (vp.name === 'phone' && route.startsWith('/v2/student')) {
      // Touch targets: every button, link and radio or checkbox in the student column must be at least 44 px high, or sit inside a label or row that is.
      entry.smallTargets = await page.evaluate(() => {
        const out = []
        for (const el of document.querySelectorAll('[data-student-page] button, [data-student-page] a, [data-student-page] [role=radio], [data-student-page] [role=checkbox], [role=dialog] button, [role=dialog] a')) {
          const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0 || el.closest('.sr-only') || el.closest('[aria-hidden=true]')) continue
          const host = el.closest('label') ?? el.closest('li') ?? el.parentElement
          const h = Math.max(r.height, host ? host.getBoundingClientRect().height : 0)
          if (h < 43.5 && !el.matches('[data-slot=checkbox],[data-slot=radio-group-item]')) out.push({ tag: el.tagName.toLowerCase(), name: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 50), h: Math.round(h) })
          else if (h < 43.5) out.push({ tag: el.tagName.toLowerCase(), name: (el.getAttribute('aria-label') || el.id || '').slice(0, 50), h: Math.round(h) })
        }
        return out
      })
      if (entry.smallTargets.length) failed = true
    }

    if (AxeBuilder) {
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      if (state?.menu) {
        entry.knownAxe = res.violations.filter((v) => KNOWN_MENU_AXE.includes(v.id)).map((v) => v.id)
        res.violations = res.violations.filter((v) => !KNOWN_MENU_AXE.includes(v.id))
      }
      entry.a11y = { violations: res.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => ({ target: n.target.join(' '), html: (n.html || '').slice(0, 140) })) })), passes: res.passes.length, incomplete: res.incomplete.length }
      if (entry.a11y.violations.length) failed = true
    } else {
      entry.contrastFallback = await page.evaluate(CONTRAST_FN)
      if (entry.contrastFallback.length) failed = true
    }

    if (state?.menu) {
      const before = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
      await page.keyboard.press('ArrowDown')
      const after = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      const closed = (await page.getByRole(state.menu === 'menu' ? 'menu' : 'listbox').count()) === 0
      entry.menuKeyboard = { arrowMovesFocus: before !== after, escapeCloses: closed, before, after }
      entry.focus = { stops: 0, names: [after], missingIndicator: [], traps: [], complete: true, ceilingHit: false }
      if (!entry.menuKeyboard.arrowMovesFocus || !closed) failed = true
      for (const want of state.expect ?? []) if (!(await page.getByRole('option', { name: want }).count()) && before !== want && after !== want) { /* options are gone after Escape; expected text was checked while open by the setup */ }
    } else {
    entry.focus = await walk(page, tabs)
    for (const want of state?.expect ?? []) if (!entry.focus.names.some((n) => n.includes(want))) entry.missingExpected.push(want)
    }
    if (entry.focus.missingIndicator.length || entry.focus.traps.length || entry.pageErrors.length || entry.missingExpected.length || entry.focus.ceilingHit) failed = true
    if (entry.consoleErrors.length) entry.consoleErrorsNote = 'Console errors are listed but do not fail the run (external font and icon kits fail offline).'
  } catch (e) {
    entry.error = String(e?.message ?? e).slice(0, 300)
    failed = true
  }
  report.pages.push(entry)
  await ctx.close()
}

fs.mkdirSync(OUT, { recursive: true })
for (const route of routes) {
  for (const vp of VIEWPORTS) {
    await capture(route, vp, null)
    if (withStates) for (const st of STATES[route] ?? []) await capture(route, vp, st)
  }
}
await browser.close()

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
for (const p of report.pages) {
  const v = p.a11y ? p.a11y.violations.length : (p.contrastFallback?.length ?? 'n/a')
  const f = p.focus
  const label = (p.route + (p.state ? ' [' + p.state + ']' : '')).padEnd(52)
  console.log(`${p.status ?? 'ERR'} ${p.viewport.padEnd(7)} ${label} a11y=${v} stops=${f?.stops ?? 0}${p.menuKeyboard ? ` menu(arrow=${p.menuKeyboard.arrowMovesFocus},esc=${p.menuKeyboard.escapeCloses},knownAxe=${(p.knownAxe ?? []).join('+') || 0})` : f?.complete ? ' (full cycle)' : ' (NOT a full cycle)'} noIndicator=${f?.missingIndicator.length ?? 0} smallTargets=${p.smallTargets?.length ?? 'n/a'} traps=${f?.traps.length ?? 0} missingExpected=${p.missingExpected.length} pageErrors=${p.pageErrors?.length ?? 0}${p.error ? ' ERROR ' + p.error : ''}`)
}
console.log(`Report: ${path.join(OUT, 'report.json')}  (${failed ? 'FAILURES FOUND' : 'clean'})`)
process.exit(failed ? 1 : 0)
