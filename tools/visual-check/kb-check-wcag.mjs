#!/usr/bin/env node
import { chromium } from 'playwright'

const BASE = 'http://localhost:3005'

async function check(label, fn) {
  try {
    const r = await fn()
    console.log(`[${label}] PASS:`, JSON.stringify(r))
  } catch(e) {
    console.log(`[${label}] ERROR:`, e.message)
  }
}

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 900 })

// ── BOARD CARD KEYBOARD ACCESSIBILITY ──
await page.goto(BASE + '/course-evaluation/term/pt1', { waitUntil: 'domcontentloaded', timeout: 20000 })
await page.waitForTimeout(2500)
await check('board-btn-exists', async () => {
  return await page.$eval('[aria-label="Board view"]', e => e.textContent)
})
const boardBtn = await page.$('[aria-label="Board view"]')
if (boardBtn) {
  await boardBtn.click()
  await page.waitForTimeout(1000)
}

await check('board-cards-tabindex', async () => {
  return await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-slot="card"][data-interactive]')]
    return cards.slice(0, 4).map(c => ({
      tag: c.tagName,
      tabIndex: c.tabIndex,
      role: c.getAttribute('role'),
    }))
  })
})

// Does Tab key land on a board card?
await page.keyboard.press('Tab')
await page.waitForTimeout(200)
await check('focus-after-tab', async () => {
  return await page.evaluate(() => {
    const el = document.activeElement
    return {
      tag: el?.tagName,
      class: el?.className?.slice(0, 60),
      role: el?.getAttribute('role'),
    }
  })
})

// ── WIZARD NAV KEYBOARD ──
await page.goto(BASE + '/surveys/remind?from=term:pt1', { waitUntil: 'domcontentloaded', timeout: 20000 })
await page.waitForTimeout(2500)

await check('wizard-step-buttons', async () => {
  return await page.evaluate(() => {
    const btns = [...document.querySelectorAll('nav[aria-label="Wizard steps"] button')]
    return btns.map(b => ({
      label: b.getAttribute('aria-label'),
      ariaCurrent: b.getAttribute('aria-current'),
      disabled: b.disabled,
    }))
  })
})

// ── MASTER CHECKBOX INDETERMINATE ──
await check('master-checkbox-initial', async () => {
  const cb = await page.$('#remind-all')
  if (!cb) return null
  return await cb.evaluate(e => ({
    tag: e.tagName,
    dataState: e.getAttribute('data-state'),
    ariaChecked: e.getAttribute('aria-checked'),
  }))
})

// Uncheck first row to trigger indeterminate
const firstRowCb = await page.$('[id^="remind-mon"]')
if (firstRowCb) {
  await firstRowCb.click()
  await page.waitForTimeout(300)
}

await check('master-checkbox-indeterminate', async () => {
  const cb = await page.$('#remind-all')
  if (!cb) return null
  return await cb.evaluate(e => ({
    tag: e.tagName,
    dataState: e.getAttribute('data-state'),
    ariaChecked: e.getAttribute('aria-checked'),
    // Radix uses button, not input, so aria-checked is what SR reads
  }))
})

// ── STICKY FOOTER POSITION ──
await check('sticky-footer-in-viewport', async () => {
  const box = await page.evaluate(() => {
    const el = document.querySelector('.sticky.bottom-0')
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), vh: window.innerHeight }
  })
  return box
})

// ── FOCUS RING VISIBILITY on link buttons ──
await check('focus-ring-ViewTermLink', async () => {
  // Focus the "View term" link on dashboard
  await page.goto(BASE + '/course-evaluation/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.waitForTimeout(2000)
  const link = await page.$('[aria-label^="Open "]')
  if (!link) return 'link not found'
  await link.focus()
  const styles = await link.evaluate(e => {
    const s = getComputedStyle(e)
    return { outline: s.outline, boxShadow: s.boxShadow }
  })
  return styles
})

// ── SHOW PAST TERMS aria-expanded ──
await check('past-terms-aria-expanded', async () => {
  const btn = await page.$('button[aria-expanded]')
  if (!btn) return 'not found'
  const before = await btn.evaluate(e => e.getAttribute('aria-expanded'))
  await btn.click()
  await page.waitForTimeout(300)
  const after = await btn.evaluate(e => e.getAttribute('aria-expanded'))
  return { before, after }
})

await browser.close()
console.log('DONE')
