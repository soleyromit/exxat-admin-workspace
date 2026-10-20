#!/usr/bin/env node
// End-to-end drive of the Stage 2 student flow against the running dev server (default http://localhost:3007).
//
//   node docs/v2/verify/stage2.e2e.mjs [--base http://localhost:3007]
//
// publish in admin (connected) -> prerequisite block -> log 2 skills -> request each of the 4 ways (the QR is decoded with the
// browser's BarcodeDetector) -> counters on the preceptor and reviewer pages -> go offline -> log shows Queued and survives a
// reload -> go online -> Synced -> signed out and update pending do not block logging -> failed sync, retry one and all -> force a
// conflict -> resolve -> state in the store, audit log and counters on other pages -> Reset demo restores.
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

let failures = 0
const check = (name, ok, seen) => {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${seen === undefined ? '' : `  (saw: ${typeof seen === 'string' ? seen : JSON.stringify(seen)})`}`)
}
const step = (t) => console.log(`\n== ${t}`)

// A 1x1 PNG and a tiny PDF for the photo input.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const PDF = Buffer.from('%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] })
const page = await ctx.newPage()
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)))

const store = () => page.evaluate((k) => { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw).state : null }, KEY)
const putStore = (fn) => page.evaluate(([k, src]) => { const env = JSON.parse(localStorage.getItem(k)); const f = new Function('s', src); f(env.state); localStorage.setItem(k, JSON.stringify(env)) }, [KEY, fn])
const open = async (route) => { await page.goto(base + route, { waitUntil: 'load' }); await page.waitForSelector('h1', { timeout: 30000 }); await page.waitForTimeout(700) }
const counter = (id) => page.locator(`[data-counter="${id}"]`).first().textContent().then((t) => Number(t))
const btn = (name, opts = {}) => page.getByRole('button', { name, ...opts })
const mine = (s) => s.submissions.filter((x) => x.studentId === 'stu-maya')
const idOf = { 'IV catheter insertion': IV, 'Sterile dressing change': 'sk-sterile-dressing', 'Vital signs and early warning score': 'sk-vitals', 'Point-of-care blood glucose': 'sk-blood-glucose' }

/** Logs skills through the four steps. `rate` maps a skill name to a level or outcome label; questions are answered Yes. */
async function logViaUi(names, { rate = {}, note = null, notes = {} } = {}) {
  await open('/v2/student/pick-and-rate')
  for (const n of names) await page.locator(`#pick-${idOf[n]}`).click()
  await btn('Continue to setting').click()
  await page.getByRole('heading', { name: 'Where did you do it?' }).waitFor()
  await btn('Continue to rating').click()
  for (const n of names) {
    if (rate[n]) await page.getByRole('radiogroup', { name: `Your rating for ${n}` }).getByRole('radio', { name: rate[n], exact: true }).click()
    else if (n === 'Sterile dressing change') {
      for (const q of ['Performed hand hygiene before and after', 'Kept the field clean throughout', 'Explained each step to the patient']) await page.getByRole('radiogroup', { name: `${q} for ${n}` }).getByRole('radio', { name: 'Yes' }).click()
    }
    const text = notes[n] ?? (n === names[0] ? note : null)
    if (text) await page.locator(`#note-${idOf[n]}`).fill(text)
  }
  await btn('Review').click()
  await page.getByRole('heading', { name: 'Review and save' }).waitFor()
  const before = (await store()).logEntries.length
  await btn(new RegExp(`^Save ${names.length} (entry|entries)$`)).click()
  await page.locator('[data-saved]').waitFor()
  const s = await store()
  return { state: s, ids: s.logEntries.slice(before).map((e) => e.id) }
}

async function decodeQr() {
  return page.evaluate(async () => {
    const svg = document.querySelector('svg[data-qr-version]')
    if (!svg) return { error: 'no svg' }
    const clone = svg.cloneNode(true)
    clone.querySelector('path').setAttribute('fill', '#000')
    clone.setAttribute('width', '400'); clone.setAttribute('height', '400')
    const vb = clone.getAttribute('viewBox').split(' ').map(Number)
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bg.setAttribute('width', String(vb[2])); bg.setAttribute('height', String(vb[3])); bg.setAttribute('fill', '#fff')
    clone.insertBefore(bg, clone.firstChild)
    const xml = new XMLSerializer().serializeToString(clone)
    const img = new Image()
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml) })
    const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 400
    canvas.getContext('2d').drawImage(img, 0, 0)
    const found = await new BarcodeDetector({ formats: ['qr_code'] }).detect(canvas)
    return { text: found[0]?.rawValue ?? null, count: found.length }
  })
}

try {
  // ------------------------------------------------------------------ 0. start from the seed
  step('0. Start from the seed')
  await open('/v2')
  await page.evaluate(() => localStorage.clear())
  await open('/v2/student')
  let s = await store()
  const seedCounters = {}
  await open('/v2')
  seedCounters.withEvaluator = await counter('withEvaluator')
  // Stage 4 replaced the placeholder at /v2/reviewer/review-queue with the real queue; the shared counter is still on the overview.
  seedCounters.queueWaiting = await counter('queueWaiting')
  check('seed: 1 request with an evaluator, 2 in the review queue', seedCounters.withEvaluator === 1 && seedCounters.queueWaiting === 2, seedCounters)
  await open('/v2/student')
  check('home before publishing: 4 mandatory skills, IV catheter insertion listed as not open yet', (await page.getByText('Mandatory (4)').count()) === 1 && (await page.getByText('1 skill is not open yet').count()) === 1)

  // ------------------------------------------------------------------ 1. connected: publish in admin
  step('1. Publish IV catheter insertion in the admin step, the student sees it')
  await open('/v2/admin/validate-publish')
  await btn('Publish IV catheter insertion').click()
  await page.getByRole('dialog').getByRole('button', { name: 'Publish IV catheter insertion' }).click()
  await page.getByText(/is now in use/).waitFor()
  await open('/v2/student')
  check('home now lists 5 mandatory skills with IV catheter insertion', (await page.getByText('Mandatory (5)').count()) === 1 && (await page.locator('[data-skill-card="sk-iv-cath"]').count()) === 1)
  const iv = page.locator('[data-skill-card="sk-iv-cath"]')
  check('IV card shows progress against the published rule and the prerequisites as done', (await iv.getByText('0 of 4 successful evaluations').count()) === 1 && (await iv.locator('[data-prereq="met"]').count()) === 1, await iv.locator('[data-progress]').textContent())
  check('rule is in plain words (4 of last 5, 2 evaluators, 2 in Inpatient)', (await iv.getByText(/You need 4 successful evaluations out of their last 5, from at least 2 different evaluators, at Works alone or above, including 2 in Inpatient/).count()) === 1)
  check('sync status summary is visible on the home screen', (await page.locator('[data-sync-strip]').count()) === 1 && /conflict/.test(await page.locator('[data-sync-headline]').textContent()))
  check('the next best action is to fix the seeded conflict', (await page.locator('[data-next-action="resolve"]').count()) === 1)

  // ------------------------------------------------------------------ 2. prerequisite block
  step('2. Prerequisites are enforced, with the reason and what to do')
  await putStore(`s.skills.find(k => k.id === '${IV}').config.prerequisites.practiceTrials = 5`)
  await open('/v2/student')
  check('home shows IV locked with the practice trials still to log', (await page.locator('[data-skill-card="sk-iv-cath"] [data-prereq="locked"]').count()) === 1 && (await page.getByText('Log 2 more practice trials in the lab or simulation.').count()) >= 1)
  await open('/v2/student/pick-and-rate')
  await page.locator(`#pick-${IV}`).click()
  await btn('Continue to setting').click()
  await page.locator('[data-prereq-block]').waitFor()
  check('clinical setting blocked: says why and what to do', (await page.getByText('IV catheter insertion cannot be logged in a clinical setting yet.').count()) === 1 && (await page.getByText('Log 2 more practice trials in the lab or simulation.').count()) >= 1)
  check('Continue is disabled while blocked', await btn('Continue to rating').isDisabled())
  await btn('Log as lab practice instead').click()
  check('switching to lab practice unblocks', await btn('Continue to rating').isEnabled())
  await putStore(`s.skills.find(k => k.id === '${IV}').config.prerequisites.practiceTrials = 3; s.logDraft = null`)

  // ------------------------------------------------------------------ 3. log two skills
  step('3. Log two skills with the skill\'s own levels')
  await open('/v2/student/pick-and-rate')
  await page.locator(`#pick-${IV}`).click()
  await page.locator('#pick-sk-sterile-dressing').click()
  await btn('Continue to setting').click()
  const placementRadio = page.locator('[id="where-placement:pl-maya-1"]')
  check('setting is prefilled from her placement', (await placementRadio.getAttribute('aria-checked')) === 'true')
  await btn('Continue to rating').click()
  const levels = await page.getByRole('radiogroup', { name: 'Your rating for IV catheter insertion' }).getByRole('radio').evaluateAll((els) => els.map((e) => e.closest('label')?.textContent?.trim()))
  const cfg = (await store()).skills.find((k) => k.id === IV).config.levels
  check('rating options are the skill\'s configured levels, in order', JSON.stringify(levels) === JSON.stringify(cfg), levels)
  await btn('Review').click()
  check('Review refuses with a message until each skill is rated', (await page.getByText('Rate yourself on IV catheter insertion, or remove it from this log.').count()) === 1 && (await page.getByText('Answer every question for Sterile dressing change, or remove it from this log.').count()) === 1)
  await page.getByRole('radiogroup', { name: 'Your rating for IV catheter insertion' }).getByRole('radio', { name: 'Works with prompts' }).click()
  for (const q of ['Performed hand hygiene before and after', 'Kept the field clean throughout']) await page.getByRole('radiogroup', { name: `${q} for Sterile dressing change` }).getByRole('radio', { name: 'Yes' }).click()
  await page.getByRole('radiogroup', { name: 'Explained each step to the patient for Sterile dressing change' }).getByRole('radio', { name: 'No' }).click()
  await page.locator(`#note-${IV}`).fill('Second attempt this week.')
  // draft survives a reload
  await page.reload({ waitUntil: 'load' }); await page.waitForSelector('h1'); await page.waitForTimeout(800)
  check('the draft survives a reload (still on step 3 with the rating kept)', (await page.locator('[data-step="3"]').count()) === 1 && (await page.locator(`#note-${IV}`).inputValue()) === 'Second attempt this week.')
  await btn('Review').click()
  await btn('Save 2 entries').click()
  await page.locator('[data-saved]').waitFor()
  s = await store()
  const round1 = s.logEntries.slice(-2)
  check('2 entries in the store, tied to the 2 skills, clinical, Inpatient, her placement', round1.map((e) => e.skillId).join() === `${IV},sk-sterile-dressing` && round1.every((e) => e.setting === 'clinical' && e.clinicalSetting === 'Inpatient' && e.location === 'Harbor General, 4 West'))
  check('self-rating and note saved', round1[0].rating === 'Works with prompts' && round1[0].note === 'Second attempt this week.' && round1[1].answers.join() === 'yes,yes,no', { r: round1[0].rating, a: round1[1].answers })
  check('online and signed in: both entries Synced, with audit entries', round1.every((e) => s.syncQueue.find((i) => i.entryId === e.id)?.state === 'synced') && s.audit.filter((a) => a.action.startsWith('Logged a skill')).length >= 2)
  check('the saved screen shows a Synced chip with text for each entry', (await page.locator('[data-sync-chip="synced"]').count()) >= 2)

  // ------------------------------------------------------------------ 4. request four ways
  step('4. Ask for sign-off four ways')
  // 4a QR
  await page.getByRole('link', { name: 'Ask for sign-off', exact: true }).click()
  await page.getByRole('heading', { name: 'Ready to send (2)', level: 2 }).waitFor()
  check('IV: unqualified evaluators are disabled with the reason', (await page.locator('#eval-pre-okonkwo').isDisabled()) && (await page.getByText('Needs 2 or more years of practice (has 1)').count()) >= 1 && (await page.getByText('Needs RN credential (has LPN)').count()) >= 1 && (await page.locator('#eval-lab-whitmore').isDisabled()) && (await page.getByText('Lab instructors sign off in the lab, not in clinical practice.').count()) >= 1)
  check('qualified evaluators can be picked', (await page.locator('#eval-pre-delgado').isEnabled()) && (await page.locator('#eval-pre-castillo').isEnabled()))
  check('the button names what it does and waits for an evaluator', await btn('Create request and show QR code').isDisabled())
  await page.locator('#eval-pre-delgado').click()
  await btn('Create request and show QR code').click()
  await page.locator('[data-qr-dialog]').waitFor()
  s = await store()
  let subs = mine(s)
  const qrSub = subs[subs.length - 1]
  check('QR request is real in the store, tied to both skills and both entries', qrSub.method === 'qr' && qrSub.skillIds.join() === `${IV},sk-sterile-dressing` && qrSub.entryIds.length === 2 && qrSub.status === 'with-evaluator' && qrSub.assignedToId === 'pre-delgado', qrSub)
  const linkText = await page.locator('[data-qr-link]').inputValue()
  check('the link in the dialog is the v2 preceptor route for this request', linkText === `${base}/v2/preceptor/preceptor-evaluation?request=${qrSub.id}`, linkText)
  const dec = await decodeQr()
  check('the QR code decodes (BarcodeDetector) to exactly that link', dec.text === linkText, dec)
  await page.getByRole('link', { name: 'Open what the evaluator sees' }).click()
  await page.waitForURL('**/v2/preceptor/preceptor-evaluation?request=*')
  await page.waitForSelector('h1')
  check('following the link opens the preceptor evaluation route with the request id', page.url().endsWith(`/v2/preceptor/preceptor-evaluation?request=${qrSub.id}`), page.url())

  // 4b hand over the phone
  let r = await logViaUi(['Vital signs and early warning score', 'Point-of-care blood glucose'], { rate: { 'Vital signs and early warning score': 'Met', 'Point-of-care blood glucose': 'Met' } })
  await page.getByRole('link', { name: 'Ask for sign-off', exact: true }).click()
  await page.getByRole('heading', { name: 'Ready to send (2)', level: 2 }).waitFor()
  await page.getByText('Hand over phone', { exact: true }).click()
  await page.locator('#eval-pre-delgado').click()
  await btn('Create request and hand over phone').click()
  await page.locator('[data-handover="student"]').waitFor()
  check('handover mode opens full screen on the student step', (await page.getByText('Hand your phone to J. Delgado, RN').count()) >= 1)
  await btn('Hand over to J. Delgado, RN').click()
  await page.locator('[data-handover="evaluator"]').waitFor()
  const handBtn = await page.getByRole('button', { name: /^Give the phone back to Maya$/ }).boundingBox()
  check('evaluator view has large controls (at least 56 px high)', handBtn.height >= 56, handBtn.height)
  check('evaluator view names both skills', (await page.getByRole('list', { name: 'Skills to sign off' }).getByRole('listitem').count()) === 2)
  await page.getByRole('button', { name: /^Give the phone back to Maya$/ }).click()
  await page.locator('[data-handover-back]').waitFor()
  await btn('Back to your requests').click()
  s = await store()
  const hSub = mine(s)[mine(s).length - 1]
  check('handover request is real in the store, tied to both skills, and the phone returned to the student view', hSub.method === 'handover' && hSub.skillIds.length === 2 && hSub.status === 'with-evaluator' && (await page.locator('[data-handover]').count()) === 0, hSub)

  // 4c link, several evaluators
  r = await logViaUi(['Vital signs and early warning score', 'Point-of-care blood glucose'], { rate: { 'Vital signs and early warning score': 'Met', 'Point-of-care blood glucose': 'Met' } })
  await page.getByRole('link', { name: 'Ask for sign-off', exact: true }).click()
  await page.getByRole('heading', { name: 'Ready to send (2)', level: 2 }).waitFor()
  await page.getByText('Link', { exact: true }).first().click()
  await page.locator('#eval-pre-delgado').click()
  await page.locator('#eval-pre-castillo').click()
  await page.locator('#eval-pre-okonkwo').click()
  await btn('Create one request and copy link for 3 evaluators').click()
  await page.locator('[data-request-done]').waitFor()
  s = await store()
  const lSub = mine(s)[mine(s).length - 1]
  const clip = await page.evaluate(() => navigator.clipboard.readText())
  check('one request goes to several qualified evaluators', lSub.method === 'link' && lSub.candidateIds.length === 3 && lSub.skillIds.length === 2 && lSub.status === 'with-evaluator', lSub.candidateIds)
  check('the link is on the clipboard', clip === `${base}/v2/preceptor/preceptor-evaluation?request=${lSub.id}`, clip)
  check('the confirmation says what, to whom, and the setting (ST-13)', (await page.locator('[data-request-done]').textContent()).includes('Setting: Inpatient, Harbor General, 4 West'))

  // 4d photo of a signed paper form
  r = await logViaUi(['Vital signs and early warning score', 'Point-of-care blood glucose'], { rate: { 'Vital signs and early warning score': 'Met', 'Point-of-care blood glucose': 'Met' } })
  await page.getByRole('link', { name: 'Ask for sign-off', exact: true }).click()
  await page.getByRole('heading', { name: 'Ready to send (2)', level: 2 }).waitFor()
  await page.getByText('Photo of paper form', { exact: true }).click()
  await page.locator('#eval-pre-delgado').click()
  check('photo needs a photo first', await btn('Send photo for review').isDisabled())
  await page.locator('#photo-file').setInputFiles({ name: 'form.pdf', mimeType: 'application/pdf', buffer: PDF })
  check('a PDF is refused with what to do', (await page.getByText('That file is a PDF. Choose a photo (JPG, PNG, HEIC or WebP) under 10 MB.').count()) === 1)
  await page.locator('#photo-file').setInputFiles({ name: 'signed-form.png', mimeType: 'image/png', buffer: PNG })
  await page.locator('[data-photo-preview] img').waitFor()
  check('a preview of the photo is shown', (await page.locator('[data-photo-preview] img').getAttribute('alt')).startsWith('Preview'))
  await btn('Send photo for review').click()
  await page.locator('[data-request-done]').waitFor()
  s = await store()
  const pSub = mine(s)[mine(s).length - 1]
  check('the photo is a paper submission in the review queue, tied to both skills', pSub.method === 'photo' && pSub.status === 'awaiting-review' && pSub.assignedToId === 'rev-haddad' && pSub.skillIds.length === 2 && pSub.photo.name === 'signed-form.png', pSub)

  // ------------------------------------------------------------------ 5. other roles
  step('5. Other roles see the new requests')
  await open('/v2')
  const we = await counter('withEvaluator')
  const qw = await counter('queueWaiting')
  check('requests with an evaluator rose by 3 (QR, handover, link)', we === seedCounters.withEvaluator + 3, we)
  check('requests in the review queue rose by 1 (paper form)', qw === seedCounters.queueWaiting + 1, qw)
  await open('/v2/student/request-signoff')
  check('Your requests lists all 4 new ones plus the seeded one', (await page.locator('[data-request]').count()) === 5)
  const beforeOffline = (await store()).submissions.length

  // ------------------------------------------------------------------ 6. offline
  step('6. Offline: queued, survives a reload, then synced')
  await open('/v2/student/offline-sync')
  await btn('Go offline').click()
  check('offline banner and strip say so', (await page.locator('[data-device-banner="offline"]').count()) === 1 && (await page.locator('[data-sync-strip]').getByText('Offline', { exact: true }).count()) === 1)
  r = await logViaUi(['Vital signs and early warning score'], { rate: { 'Vital signs and early warning score': 'Met' } })
  const offEntry = r.ids[0]
  check('the entry shows a Queued chip with text after saving', (await page.locator('[data-sync-chip="queued"]').count()) >= 1 && (await page.getByText('Queued', { exact: true }).count()) >= 1)
  s = await store()
  check('the store has the entry and its sync item is queued', s.logEntries.some((e) => e.id === offEntry) && s.syncQueue.find((i) => i.entryId === offEntry)?.state === 'queued')
  await page.reload({ waitUntil: 'load' }); await page.waitForSelector('h1'); await page.waitForTimeout(800)
  s = await store()
  check('after a reload the entry is still there and still queued, the phone still offline', s.logEntries.some((e) => e.id === offEntry) && s.syncQueue.find((i) => i.entryId === offEntry)?.state === 'queued' && s.device.offline === true)
  // a request made offline
  await open('/v2/student/request-signoff')
  await page.getByRole('heading', { name: /^Ready to send \(1\)$/, level: 2 }).waitFor()
  await page.getByText('Link', { exact: true }).first().click()
  await page.locator('#eval-pre-delgado').click()
  await btn('Create request and copy link').click()
  await page.locator('[data-request-done]').waitFor()
  s = await store()
  const offSub = mine(s)[mine(s).length - 1]
  check('a request made offline is saved on the phone, not yet with the evaluator', offSub.status === 'on-device' && s.submissions.length === beforeOffline + 1, offSub.status)
  await open('/v2')
  check('the preceptor page counter did not change while offline', (await counter('withEvaluator')) === seedCounters.withEvaluator + 3)
  await open('/v2/student/offline-sync')
  check('Send all and Retry are disabled with a reason while offline', (await btn(/^Send all waiting/).isDisabled()) && (await page.getByText('You are offline. Go online to send.').count()) === 1)
  await btn('Go online').click()
  await page.waitForTimeout(400)
  s = await store()
  check('going online sends everything: entry Synced, request with the evaluator', s.syncQueue.find((i) => i.entryId === offEntry)?.state === 'synced' && s.submissions.find((x) => x.id === offSub.id).status === 'with-evaluator' && s.device.offline === false)
  await open('/v2')
  check('now the preceptor counter rose by 1 more', (await counter('withEvaluator')) === seedCounters.withEvaluator + 4)

  // ------------------------------------------------------------------ 7. signed out, update pending
  step('7. Signed out and an update pending never block logging')
  await open('/v2/student/offline-sync')
  await btn('Sign out').click()
  await btn('Mark update as pending').click()
  check('banners say signed out and update ready, and neither is a wall', (await page.locator('[data-device-banner="signed-out"]').count()) === 1 && (await page.locator('[data-device-banner="update"]').count()) === 1)
  r = await logViaUi(['Point-of-care blood glucose'], { rate: { 'Point-of-care blood glucose': 'Met' } })
  s = await store()
  check('logging worked: the entry is queued, waiting for sign in', s.syncQueue.find((i) => i.entryId === r.ids[0])?.state === 'queued')
  await open('/v2/student/offline-sync')
  check('the item says Waiting for sign in', (await page.getByText('Waiting for sign in.').count()) >= 1)
  const urlBefore = page.url()
  await page.getByRole('button', { name: 'Sign in', exact: true }).first().click()
  await page.waitForTimeout(400)
  s = await store()
  check('signing in sends the queue and does not redirect (no login loop)', s.syncQueue.find((i) => i.entryId === r.ids[0])?.state === 'synced' && page.url() === urlBefore, page.url())
  await page.getByRole('button', { name: 'Install update', exact: true }).first().click()
  s = await store()
  check('installing the update clears the banner; nothing else changed', s.device.updatePending === false)

  // ------------------------------------------------------------------ 8. failed sync, retry
  step('8. Failed sync: retry one, then all')
  await open('/v2/student/offline-sync')
  await btn('Make the next sync fail').click()
  await btn('Go offline').click()
  const a = (await logViaUi(['Point-of-care blood glucose'], { rate: { 'Point-of-care blood glucose': 'Met' } })).ids[0]
  const b = (await logViaUi(['Vital signs and early warning score'], { rate: { 'Vital signs and early warning score': 'Met' } })).ids[0]
  await open('/v2/student/offline-sync')
  await btn('Go online').click()
  await page.waitForTimeout(400)
  s = await store()
  check('both items failed, nothing was lost, the flag cleared', [a, b].every((id) => s.syncQueue.find((i) => i.entryId === id)?.state === 'failed') && s.logEntries.some((e) => e.id === a) && s.device.failNextSync === false)
  check('Failed is shown as text with the reason and Retry', (await page.locator('[data-sync-chip="failed"]').count()) >= 2 && (await page.getByText('still saved on this phone').count()) >= 2)
  const itemA = s.syncQueue.find((i) => i.entryId === a)
  await page.locator(`[data-item-id="${itemA.id}"]`).getByRole('button', { name: /^Retry/ }).click()
  s = await store()
  check('retrying one item syncs only that one', s.syncQueue.find((i) => i.entryId === a)?.state === 'synced' && s.syncQueue.find((i) => i.entryId === b)?.state === 'failed')
  await btn(/^Send all waiting \(1\)/).click()
  s = await store()
  check('Send all waiting retries the rest', s.syncQueue.find((i) => i.entryId === b)?.state === 'synced')

  // ------------------------------------------------------------------ 9. conflict
  step('9. Force a conflict, resolve it')
  await open('/v2/student/offline-sync')
  await btn('Go offline').click()
  const c = (await logViaUi(['IV catheter insertion', 'Sterile dressing change'], { rate: { 'IV catheter insertion': 'Works with prompts' }, notes: { 'IV catheter insertion': 'Felt steady with the flush.', 'Sterile dressing change': 'Used a new kit.' } })).ids
  await open('/v2/student/offline-sync')
  await btn('Simulate an edit on another device').click()
  const conflictsBefore = (await store()).syncQueue.filter((i) => i.state === 'conflict').length
  await btn('Go online').click()
  await page.waitForTimeout(400)
  s = await store()
  const cItem = s.syncQueue.find((i) => i.state === 'conflict' && i.entryId && c.includes(i.entryId))
  check('on sync the edited entry becomes a Conflict, the other one is Synced', !!cItem && s.syncQueue.filter((i) => c.includes(i.entryId) && i.state === 'synced').length === 1, cItem?.state)
  check('the Conflict chip and text are shown, and the strip says a conflict needs you', (await page.locator('[data-sync-chip="conflict"]').count()) >= 2 && /conflict/.test(await page.locator('[data-sync-headline]').textContent()))
  await open('/v2')
  const conflictsCounter = await counter('syncConflict')
  check('the overview counter Sync conflicts reads 2 (the seeded one and this one)', conflictsCounter === 2, conflictsCounter)
  await open('/v2/student/offline-sync')
  await page.locator(`[data-item-id="${cItem.id}"]`).getByRole('button', { name: /^Resolve conflict/ }).click()
  await page.locator('[data-version="mine"]').waitFor()
  check('the conflict screen shows both versions and consequences', (await page.locator('[data-version="mine"]').textContent()).includes(cItem.conflict.mine) && (await page.locator('[data-version="theirs"]').textContent()).includes(cItem.conflict.theirs) && (await page.getByText('Joins them into one note, server text first, then yours.').count()) === 1)
  check('Resolve is disabled until a version is chosen', await page.locator('[data-resolve]').isDisabled())
  await page.getByText('Keep both', { exact: true }).click()
  await page.locator('[data-resolve]').click()
  await page.locator('[data-sync-message]').waitFor()
  s = await store()
  const resolved = s.syncQueue.find((i) => i.id === cItem.id)
  const entry = s.logEntries.find((e) => e.id === cItem.entryId)
  check('resolved in the store: item Synced, conflict cleared, note holds both versions', resolved.state === 'synced' && !resolved.conflict && entry.note === `${cItem.conflict.theirs}\n\n${cItem.conflict.mine}`, entry.note)
  check('the audit log records the decision', s.audit.some((x) => x.action === 'Resolved sync conflict: kept both versions' && x.target === cItem.label), s.audit[0])
  await open('/v2')
  check('the overview counter Sync conflicts fell to 1', (await counter('syncConflict')) === 1)
  // resolve the seeded one with keep mine too
  await open('/v2/student/offline-sync')
  await page.locator('[data-item-id="sy-3"]').getByRole('button', { name: /^Resolve conflict/ }).click()
  await page.getByText("Keep this phone's version").click()
  await page.locator('[data-resolve]').click()
  await page.locator('[data-sync-message]').waitFor()
  s = await store()
  check('the seeded conflict resolved with keep mine', s.syncQueue.find((i) => i.id === 'sy-3').state === 'synced' && s.logEntries.find((e) => e.id === 'log-maya-uc-1').note.startsWith('Asked the preceptor'))

  // ------------------------------------------------------------------ 10. history
  step('10. Student history')
  await open('/v2/student/history')
  check('record shows attempts per skill with an outcome in words', (await page.locator('[data-attempt]').count()) >= 8 && (await page.getByText('Counted', { exact: true }).count()) >= 6)
  check('a not-yet attempt states the rule that was not met', (await page.locator('[data-failed-rule]').count()) >= 1)
  await page.getByRole('button', { name: /^See details of attempt 1 at Indwelling urinary catheter insertion/ }).click()
  await page.getByRole('dialog').waitFor()
  check('attempt detail opens with versions', (await page.locator('[data-versions] li').count()) >= 1)
  await page.keyboard.press('Escape')

  // ------------------------------------------------------------------ 11. reload and reset
  step('11. Reload persists; Reset demo restores')
  const before = await store()
  await page.reload({ waitUntil: 'load' }); await page.waitForSelector('h1'); await page.waitForTimeout(800)
  check('store identical after reload', JSON.stringify(before) === JSON.stringify(await store()))
  await page.getByRole('button', { name: 'Scenario' }).click()
  await page.getByRole('menuitem', { name: 'Reset demo' }).click()
  await page.getByRole('button', { name: 'Reset demo data' }).click()
  await page.waitForSelector('h1')
  await page.waitForTimeout(800)
  s = await store()
  check('log entries, requests and sync items are back to the seed', s.logEntries.length === 5 && mine(s).length === 1 && s.syncQueue.length === 3 && s.syncQueue.filter((i) => i.state === 'conflict').length === 1, { logs: s.logEntries.length, subs: mine(s).length, sync: s.syncQueue.length })
  check('the phone is back online, signed in, no update pending, IV not in use again', !s.device.offline && !s.device.signedOut && !s.device.updatePending && s.skills.find((k) => k.id === IV).published === false)
  check('no page errors during the run', pageErrors.length === 0, pageErrors)
} catch (e) {
  failures++
  console.log(`FAIL  flow aborted: ${String(e?.message ?? e).split('\n').slice(0, 3).join(' | ')}`)
  await page.screenshot({ path: path.resolve(HERE, '../screenshots/stage2-e2e-failure.png') }).catch(() => {})
}

await browser.close()
console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`)
process.exit(failures === 0 ? 0 : 1)
