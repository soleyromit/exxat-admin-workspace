import { chromium } from 'playwright'
const b = await chromium.launch({ headless: true })
const pg = await (await b.newContext()).newPage()
await pg.goto('http://localhost:3001/assessment-builder/create?courseId=course-phar101', { waitUntil:'networkidle' })
await pg.waitForTimeout(1200)
const r = await pg.evaluate(() => {
  const root = getComputedStyle(document.documentElement)
  const body = getComputedStyle(document.body)
  // make a probe element with Tailwind text-xs
  const p = document.createElement('span'); p.className='text-xs'; p.textContent='x'; document.body.appendChild(p)
  const xs = getComputedStyle(p).fontSize
  return {
    rootFontSize: root.fontSize,
    bodyFontSize: body.fontSize,
    token_fs_xs: root.getPropertyValue('--fs-xs').trim() || '(unset)',
    token_fs_sm: root.getPropertyValue('--fs-sm').trim() || '(unset)',
    text_xs_renders: xs,
  }
})
console.log(JSON.stringify(r, null, 2))
await b.close()
