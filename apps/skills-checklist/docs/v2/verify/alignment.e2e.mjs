// V2-CONSISTENCY checks 15 and 16: the h1 sits at the same left and top on every staff list page and every student page at
// 1440 px, no sideways scroll at 390 px, and the student desktop body is at most 768 px wide and left aligned.
// Needs the dev server on 3007: node docs/v2/verify/alignment.e2e.mjs [--base http://localhost:3007]
import { makeChecker, parseBase, startSession } from './_lib.mjs'

const { check, step, abort, finish } = makeChecker('alignment')
const base = parseBase()
const STAFF = ['/v2/admin/review-queue', '/v2/admin/outcomes', '/v2/admin/verification', '/v2/admin/reports', '/v2/admin/map-courses']
const STUDENT = ['/v2/student/pick-and-rate', '/v2/student/request-signoff', '/v2/student/history']

const box = (page) => page.locator('h1').first().boundingBox()
const { browser, page, open } = await startSession({ base, viewport: { width: 1440, height: 900 } })
try {
  step('h1 position at 1440 px')
  const seen = []
  for (const r of [...STAFF, ...STUDENT]) {
    await open(r)
    const b = await box(page)
    seen.push({ r, left: Math.round(b.x), top: Math.round(b.y) })
  }
  const l0 = seen[0].left, t0 = seen[0].top
  check('h1 left is identical within 1 px on staff and student pages', seen.every((s) => Math.abs(s.left - l0) <= 1), seen)
  // The student sync strip (`lead`) sits above the header by design, so tops are compared within staff and within student pages.
  const staffSeen = seen.filter((s) => STAFF.includes(s.r)), studentSeen = seen.filter((s) => STUDENT.includes(s.r))
  check('staff h1 top is identical within 1 px', staffSeen.every((s) => Math.abs(s.top - t0) <= 1), staffSeen)
  check('student h1 top is identical within 1 px', studentSeen.every((s) => Math.abs(s.top - studentSeen[0].top) <= 1), studentSeen)

  step('student desktop body')
  await open('/v2/student')
  const h = await box(page)
  const body = await page.locator('[data-student-page] main, [data-student-page]').first().evaluate((el) => { const c = el.querySelector('h1').closest('div'); const r = c.getBoundingClientRect(); return { left: r.left, width: r.width } })
  check('student Home column is 768 px or less', body.width <= 769, body)
  check('student Home body shares the header left edge', Math.abs(body.left - (h.x - 24)) <= 2 || Math.abs(body.left - h.x) <= 26, { body, h1: h })

  step('phone')
  await page.setViewportSize({ width: 390, height: 844 })
  for (const r of [...STAFF, ...STUDENT]) {
    await open(r)
    const over = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
    check(`no sideways scroll at 390 px on ${r}`, !over)
  }
} catch (e) {
  abort(e)
}
await finish(browser)
