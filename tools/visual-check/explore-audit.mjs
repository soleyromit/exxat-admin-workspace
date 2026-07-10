import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
const OUT = '/tmp/visual-check/setup-live'
mkdirSync(OUT, { recursive: true })
const URL = 'https://pce-three.vercel.app/surveys/setup'
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1050 } })
const page = await ctx.newPage()
const log = []

async function dump(tag){
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${OUT}/${tag}.png`, fullPage: true }).catch(()=>{})
  const info = await page.evaluate(() => {
    const clean = s => (s||'').replace(/\s+/g,' ').trim()
    // table rows if any
    const rows = [...document.querySelectorAll('table tr, [role=row]')].map(r=>clean(r.innerText).slice(0,200)).filter(Boolean).slice(0,40)
    const chips = [...document.querySelectorAll('[class*=badge],[class*=chip],[class*=tag],[class*=pill]')].map(b=>clean(b.innerText)).filter(Boolean).slice(0,40)
    return { url:location.href, rows, chips, body: clean(document.body.innerText).slice(0,3500) }
  }).catch(e=>({error:e.message}))
  log.push('\n===== '+tag+' =====\n'+JSON.stringify(info,null,1))
}

await page.goto(URL, { waitUntil:'domcontentloaded', timeout:60000 })
await page.waitForTimeout(3500)
// close the announcement if present
await page.locator('button', { hasText: /^Close$/ }).first().click({timeout:3000}).catch(()=>{})
await page.waitForTimeout(500)

// select term + year (native selects)
await page.locator('select[aria-label="Select term"]').selectOption({ label: 'Fall' }).catch(e=>log.push('term fail '+e.message))
await page.locator('select[aria-label="Select academic year"]').selectOption({ label: '2025-2026' }).catch(e=>log.push('year fail '+e.message))
await page.waitForTimeout(1500)
await dump('A1-term-year-selected')

// toggle a cohort year (optional)
await page.locator('label', { hasText: /^Year 1$/ }).first().click().catch(()=>{})
await page.waitForTimeout(800)
await dump('A2-cohort-year1')

// select evaluatee types one at a time to watch columns appear
for (const t of ['Course','Instructor','Course Coordinator']){
  await page.locator('button', { hasText: new RegExp('^'+t+'$') }).first().click({timeout:4000}).catch(e=>log.push('eval '+t+' fail '+e.message))
  await page.waitForTimeout(900)
  await dump('A3-eval-'+t.replace(/\W+/g,'_'))
}

// run audit
const runBtn = page.locator('button', { hasText: /^Run Audit$/ }).first()
log.push('RunAudit disabled? '+ await runBtn.isDisabled().catch(()=>'?'))
await runBtn.click({timeout:6000}).catch(e=>log.push('runaudit click fail '+e.message))
await page.waitForTimeout(2500)
await dump('A4-audit-results')

// try expanding a course row / view details / fix data if present
for (const label of [/View details/i, /Fix|Add data/i, /Expand/i, /chevron/i]){
  const el = page.locator('button, [role=button]', { hasText: label }).first()
  if (await el.count()){ await el.click({timeout:3000}).catch(()=>{}); await page.waitForTimeout(900); await dump('A5-expanded-'+String(label).replace(/\W+/g,'').slice(0,10)) }
}

// continue after audit
await page.locator('button', { hasText: /^Continue$/ }).first().click({timeout:5000}).catch(e=>log.push('continue fail '+e.message))
await page.waitForTimeout(1800)
await dump('A6-after-continue')

writeFileSync(`${OUT}/_audit.txt`, log.join('\n'))
console.log('DONE')
await browser.close()
