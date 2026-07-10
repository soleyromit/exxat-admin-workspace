import { chromium } from 'playwright'

const box = ['color','background-color','border-color','font-family','font-size','font-weight','padding','border-top-left-radius','box-shadow','border-top-width','border-top-style']

async function grab(page, label) {
  return await page.evaluate(({box, label}) => {
    const pick = (el) => { if(!el) return {missing:true}; const s=getComputedStyle(el); const o={}; for(const p of box) o[p]=s.getPropertyValue(p); o.text=(el.textContent||'').trim().slice(0,30); return o }
    const all = [...document.querySelectorAll('*')]

    // active stepper node: a small round badge containing "1" with non-transparent bg
    const stepNodes = all.filter(el => {
      const t=(el.textContent||'').trim()
      const s=getComputedStyle(el)
      const r=el.getBoundingClientRect()
      return t==='1' && r.width>=18 && r.width<=40 && r.height>=18 && r.height<=40 && parseFloat(s.borderTopLeftRadius)>=9
    })
    const activeNode = stepNodes[0]

    // first text input
    const input = document.querySelector('input[type="text"], input:not([type]):not([type=range])') ||
                  [...document.querySelectorAll('input')].find(i=>i.type!=='range'&&i.type!=='checkbox')

    // textarea
    const ta = document.querySelector('textarea')

    // Cancel button (top-right) — find element whose text is exactly Cancel
    const cancel = all.filter(el=>{
      const t=(el.textContent||'').trim()
      return (t==='Cancel'||t==='× Cancel'||t==='✕ Cancel') && el.children.length<=2 && (el.tagName==='BUTTON'||el.getAttribute('role')==='button'||el.tagName==='A')
    })[0] || all.find(el=>(el.textContent||'').trim()==='Cancel')

    // Continue button
    const cont = all.filter(el=>{
      const t=(el.textContent||'').trim().replace(/\s+/g,' ')
      return /^Continue/.test(t) && (el.tagName==='BUTTON'||el.getAttribute('role')==='button')
    }).sort((a,b)=>a.textContent.length-b.textContent.length)[0]

    // step panel card: ancestor of input that has a border + radius and is wide
    let card=null
    let cur=input
    while(cur){ const s=getComputedStyle(cur); const r=cur.getBoundingClientRect(); if(r.width>500 && parseFloat(s.borderTopLeftRadius)>=6 && (s.borderTopWidth!=='0px'||s.boxShadow!=='none')){card=cur;break} cur=cur.parentElement }

    // segmented control wrapper: ancestor of an "Exam" labelled button
    const examBtn = all.find(el=>(el.textContent||'').trim()==='Exam' && el.children.length===0)
    let seg = examBtn ? examBtn.parentElement : null

    return { label,
      activeNode: pick(activeNode),
      input: pick(input),
      textarea: pick(ta),
      cancel: pick(cancel),
      continue: pick(cont),
      card: pick(card),
      segmented: pick(seg),
      examBtn: pick(examBtn),
    }
  }, {box, label})
}

const b = await chromium.launch({headless:true})
const ctx = await b.newContext({viewport:{width:1440,height:1000}})

// BUILD
const p1 = await ctx.newPage()
await p1.goto('http://localhost:3001/assessment-builder/create?courseId=course-phar101',{waitUntil:'networkidle'})
await p1.waitForTimeout(1500)
const build = await grab(p1,'BUILD')

// TARGET
const p2 = await ctx.newPage()
await p2.goto('file:///Users/romitsoley/Downloads/Assessment%20Creation%20(offline).html',{waitUntil:'networkidle'})
await p2.waitForTimeout(2000)
await p2.locator('text="Create Assessment"').first().click().catch(()=>{})
await p2.waitForTimeout(1500)
const target = await grab(p2,'TARGET')

const keys=['activeNode','input','textarea','cancel','continue','card','segmented','examBtn']
for(const k of keys){
  console.log('\n=== '+k+' ===')
  console.log('BUILD :', JSON.stringify(build[k]))
  console.log('TARGET:', JSON.stringify(target[k]))
}
await b.close()
