import { open, cap, capLong, save, nav, clk, btn, setManifest, step, ensureClosed } from './parity-lib.mjs';
setManifest('manifest-7-extra.json');
const { b, p } = await open();
// A) send a self-evaluation skill (IV Insertion) and scored/binary skills to see form variants
await nav(p, 'Student View');
await step('send iv', async () => {
  await p.locator('input[aria-label="Select IV Insertion"]').check(); await btn(p, 'Send for review');
  await capLong(p, '150-student-send-with-self-eval', 'Send dialog for IV Insertion (self-evaluation + approval workflow skill)');
  await btn(p, 'Cancel'); await p.locator('input[aria-label="Select IV Insertion"]').uncheck();
});
// B) a student whose course has scored skills: send Head-to-Toe, Tracheostomy? find students/courses via switcher
await step('find scored', async () => {
  const names = await p.$$eval('input[aria-label^="Select "]', (els) => els.map((e) => e.getAttribute('aria-label')));
  console.log('selectable skills for current student/course:', JSON.stringify(names));
  await p.locator('select').nth(1).selectOption({ index: 1 }); await p.waitForTimeout(300);
  const n2 = await p.$$eval('input[aria-label^="Select "]', (els) => els.map((e) => e.getAttribute('aria-label')));
  console.log('NURS 410 skills:', JSON.stringify(n2));
  await cap(p, '151-student-course-410-skills', 'Student (Olivia) NURS 410 skills list');
  const other = p.getByText('Other skills').first(); await other.click().catch(() => {}); await p.waitForTimeout(300);
  const n3 = await p.$$eval('input[aria-label^="Select "]', (els) => els.map((e) => e.getAttribute('aria-label')));
  console.log('with other skills open:', JSON.stringify(n3));
  await cap(p, '152-student-course-410-other-open', 'NURS 410 with Other skills expanded');
  for (const nm of ['Head-to-Toe Assessment', 'Sterile Dressing Change', 'Tracheostomy Care']) { await p.locator(`input[aria-label="Select ${nm}"]`).check().catch(() => {}); }
  await btn(p, 'Send for review'); await capLong(p, '153-student-send-scored-binary', 'Send dialog for Head-to-Toe (scored), Sterile (binary), Tracheostomy (scored)');
  const d = p.locator('input[type=date]'); const n = await d.count(); for (let i = 0; i < n; i++) await d.nth(i).fill('2026-09-02');
  await capLong(p, '154-student-send-scored-binary-filled', 'Same dialog filled');
  await btn(p, 'Send request'); await p.waitForTimeout(400);
});
await step('preceptor scored', async () => {
  await nav(p, 'Preceptor Evaluation'); await cap(p, '155-preceptor-mailbox-after-send', 'Mailbox after the student sent new skills');
  await p.getByRole('button', { name: 'Open link' }).first().click(); await p.waitForTimeout(400);
  await capLong(p, '156-preceptor-form-scored-binary', 'Evaluation form for scored + binary skills');
});
save('manifest-7-extra.json'); await b.close();
