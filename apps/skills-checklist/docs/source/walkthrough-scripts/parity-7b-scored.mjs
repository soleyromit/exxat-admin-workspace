import { open, cap, capLong, save, nav, btn, setManifest, step } from './parity-lib.mjs';
setManifest('manifest-7b-scored.json');
const { b, p } = await open();
await nav(p, 'Student View');
await step('scored send', async () => {
  await p.locator('select').nth(1).selectOption({ index: 1 }); await p.waitForTimeout(300);
  await p.getByText('Other skills').first().click().catch(() => {}); await p.waitForTimeout(250);
  for (const nm of ['Head-to-Toe Assessment', 'Sterile Dressing Change', 'Tracheostomy Care']) await p.locator(`input[aria-label="Select ${nm}"]`).check();
  await btn(p, 'Send for review');
  const d = p.locator('input[type=date]'); const n = await d.count(); for (let i = 0; i < n; i++) await d.nth(i).fill('2026-09-02');
  const fours = p.getByRole('button', { name: '4', exact: true }); const c = await fours.count(); console.log('score buttons', c); for (let i = 0; i < c; i++) await fours.nth(i).click();
  const sb = await p.$$eval('button', (els) => els.filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.innerText.trim() + (e.disabled ? '(dis)' : '')).slice(-6).join('|')); console.log('footer buttons', sb);
  await capLong(p, '154-student-send-scored-binary-filled', 'Send dialog (scored+binary) with self-evaluation scores and details filled');
  await btn(p, 'Send request'); await p.waitForTimeout(500); await cap(p, '155-student-sent-confirmation-scored', 'After sending scored+binary skills');
});
await step('preceptor scored', async () => {
  await nav(p, 'Preceptor Evaluation'); await cap(p, '156-preceptor-mailbox-after-send', 'Mailbox after the student sent new skills');
  await p.getByRole('button', { name: 'Open link' }).first().click(); await p.waitForTimeout(400);
  await capLong(p, '157-preceptor-form-scored-binary', 'Evaluation form for scored + binary skills (with student self-evaluation shown?)');
});
save('manifest-7b-scored.json'); await b.close();
