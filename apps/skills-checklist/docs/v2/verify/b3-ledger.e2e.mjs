// B3: the evidence ledger sheet on Reports. Open a heat-grid cell, read the ledger, toggle a counter, open View form, close, focus returns.
// Runs at 1280 and 390. Saves docs/v2/screenshots/b3-*.png. Usage: node docs/v2/verify/b3-ledger.e2e.mjs [--base http://localhost:3007]
import path from 'node:path'
import { HERE, makeChecker, parseBase, startSession } from './_lib.mjs'

const base = parseBase()
const SHOTS = path.resolve(HERE, '../screenshots')
const { check, step, abort, finish } = makeChecker('b3-ledger')
const VITALS = 'Vital signs and early warning score'

async function run(width, height, tag) {
  const { browser, page, open, pageErrors } = await startSession({ base, viewport: { width, height } })
  try {
    step(`${tag}: open a heat-grid cell`)
    await open('/v2/admin/reports')
    const cell = page.locator('[data-heat-row="stu-maya"]').locator(`[aria-label^="Maya Ferreira, ${VITALS}:"]`).first()
    await cell.scrollIntoViewIfNeeded()
    await cell.click()
    const sheet = page.locator('[data-cell-sheet]')
    await sheet.waitFor()
    const txt = await sheet.innerText()
    check(`${tag}: header reconciles ("N of M counted evaluations")`, /\d+ of \d+ counted evaluations/.test(txt), txt.slice(0, 160).replace(/\s+/g, ' '))
    const m = txt.match(/(\d+) of (\d+) counted evaluations/)
    const counting = await sheet.locator('[data-ledger-result="counts"]').count()
    check(`${tag}: ledger rows that count equal the header figure`, !!m && counting === Number(m[1]), `${counting} vs ${m?.[1]}`)
    check(`${tag}: ledger is a table with Date, Setting, Evaluator, Recorded, Result`, ['Date', 'Setting', 'Evaluator', 'Recorded', 'Result'].every((h) => txt.includes(h)))
    check(`${tag}: four counters each with Show these only`, (await sheet.getByRole('button', { name: /^Show these only/ }).count()) === 4)
    check(`${tag}: no concern text, no em dash`, !/concern/i.test(txt) && !txt.includes('—'))
    check(`${tag}: no horizontal page scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
    await page.screenshot({ path: path.join(SHOTS, `b3-ledger-sheet-${width}.png`) })

    step(`${tag}: toggle a counter`)
    await sheet.getByRole('button', { name: 'Remove filter Skill: ' + VITALS }).click()
    const before = await sheet.locator('[data-ledger-result]').count()
    const tg = sheet.getByRole('button', { name: /^Show these only: Achieved/ })
    await tg.click()
    check(`${tag}: toggle is pressed`, (await tg.getAttribute('aria-pressed')) === 'true')
    const after = await sheet.locator('[data-ledger-result]').count()
    check(`${tag}: Show these only narrows the ledger`, after < before || before === 0, `${before} -> ${after}`)
    await page.screenshot({ path: path.join(SHOTS, `b3-ledger-toggle-${width}.png`) })
    await tg.click()
    await sheet.getByRole('button', { name: /^Show these only: Achieved/ }).evaluate((b) => b.blur())

    step(`${tag}: View form, close, focus returns`)
    const vf = sheet.getByRole('button', { name: /^View form/ }).first()
    await vf.scrollIntoViewIfNeeded()
    const vfName = await vf.getAttribute('aria-label')
    await vf.click()
    const dlg = page.locator('[data-form-dialog]')
    await dlg.waitFor()
    const dtxt = await dlg.innerText()
    check(`${tag}: form view is read only (no edit, reopen or save control)`, (await dlg.getByRole('button').allInnerTexts()).every((t) => /^(Close|)$/i.test(t.trim()) || /close/i.test(t)) && !/reopen|edit|save|resend/i.test(dtxt.replace('cannot be edited', '')), dtxt.slice(0, 200).replace(/\s+/g, ' '))
    await page.screenshot({ path: path.join(SHOTS, `b3-ledger-form-${width}.png`) })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
    check(`${tag}: first Escape closes only the form`, (await dlg.count()) === 0 && (await sheet.count()) === 1)
    check(`${tag}: focus returns to the View form button`, await page.evaluate(() => document.activeElement?.getAttribute('aria-label')) === vfName, await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName))
    await vf.click()
    await dlg.waitFor()
    await dlg.getByRole('button', { name: 'Close', exact: true }).first().click()
    await page.waitForTimeout(400)
    check(`${tag}: Close button also returns focus to the row`, await page.evaluate(() => document.activeElement?.getAttribute('aria-label')) === vfName)

    step(`${tag}: close the sheet, focus returns to the cell`)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
    check(`${tag}: sheet closed`, (await sheet.count()) === 0)
    const lab = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '')
    check(`${tag}: focus is back on the clicked cell`, lab.startsWith(`Maya Ferreira, ${VITALS}:`), lab)
    check(`${tag}: no page errors`, pageErrors.length === 0, pageErrors)
  } catch (e) { abort(e) }
  await browser.close()
}

await run(1280, 900, '1280')
await run(390, 844, '390')
await finish()
