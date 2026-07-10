import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
const OUT = '/tmp/visual-check/setup-live'
mkdirSync(OUT, { recursive: true })
const URL = 'https://pce-three.vercel.app/surveys/setup'

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await ctx.newPage()
const log = []
page.on('console', m => { if (m.type()==='error') log.push('CONSOLE ERR: '+m.text()) })

async function dump(tag){
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${OUT}/${tag}.png`, fullPage: true }).catch(e=>log.push(tag+' shot fail '+e.message))
  const info = await page.evaluate(() => {
    const t = (el)=> (el.innerText||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,120)
    const grab = (sel)=> [...document.querySelectorAll(sel)].map(t).filter(Boolean)
    return {
      url: location.href,
      headings: grab('h1,h2,h3,[role=heading]').slice(0,40),
      steps: grab('[data-slot=wizard-step],[class*=step],ol li,nav[aria-label] li').slice(0,30),
      buttons: [...document.querySelectorAll('button,[role=button],a[role=button]')].map(b=>({txt:(b.innerText||'').trim().replace(/\s+/g,' ').slice(0,60), aria:b.getAttribute('aria-label')||'', disabled:b.disabled||b.getAttribute('aria-disabled')==='true'})).filter(b=>b.txt||b.aria).slice(0,60),
      inputs: [...document.querySelectorAll('input,select,textarea,[role=combobox],[role=radio],[role=checkbox],[role=switch],[role=tab]')].map(i=>({tag:i.tagName.toLowerCase(), role:i.getAttribute('role')||'', type:i.type||'', ph:i.placeholder||'', name:i.name||'', aria:i.getAttribute('aria-label')||'', label:(i.labels&&i.labels[0]?i.labels[0].innerText:'').trim().slice(0,60), checked:i.checked, val:(i.value||'').slice(0,40)})).slice(0,80),
      bodyText: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,2500),
    }
  }).catch(e=>({error:e.message}))
  log.push('\n===== '+tag+' =====\n'+JSON.stringify(info,null,1))
  return info
}

await page.goto(URL, { waitUntil:'domcontentloaded', timeout:60000 }).catch(e=>log.push('goto fail '+e.message))
await page.waitForTimeout(3500)
await dump('01-landing')

// Try to interact with any selects/dropdowns visible (term, academic year, what to evaluate)
async function clickText(re){
  const el = page.locator('button, [role=button], [role=tab], label, a', { hasText: re }).first()
  if (await el.count()){ await el.scrollIntoViewIfNeeded().catch(()=>{}); await el.click({timeout:5000}).catch(e=>log.push('click "'+re+'" fail '+e.message)); await page.waitForTimeout(900); return true }
  log.push('no element for '+re); return false
}

// open every combobox to reveal options
const combos = await page.locator('[role=combobox], button:has-text("Select")').all()
for (let i=0;i<combos.length && i<6;i++){
  await combos[i].click({timeout:4000}).catch(()=>{})
  await page.waitForTimeout(700)
  await dump(`02-combo-${i}-open`)
  await page.keyboard.press('Escape').catch(()=>{})
  await page.waitForTimeout(300)
}

// Advance the wizard step-by-step capturing each
const advanceLabels = /Continue|Next|Proceed|Run audit|Audit|Review|Save/i
for (let step=1; step<=6; step++){
  const btn = page.locator('button', { hasText: advanceLabels }).filter({ hasNot: page.locator('[disabled]') }).first()
  if (!(await btn.count())) { log.push('no advance button at step '+step); break }
  const label = (await btn.innerText().catch(()=>'')).trim()
  await btn.scrollIntoViewIfNeeded().catch(()=>{})
  await btn.click({timeout:6000}).catch(e=>log.push('advance '+step+' ('+label+') fail '+e.message))
  await page.waitForTimeout(1800)
  await dump(`03-after-advance-${step}-${label.replace(/\W+/g,'_').slice(0,20)}`)
}

writeFileSync(`${OUT}/_structure.txt`, log.join('\n'))
console.log('DONE. steps captured. errors:', log.filter(l=>l.includes('fail')||l.includes('ERR')).length)
await browser.close()
