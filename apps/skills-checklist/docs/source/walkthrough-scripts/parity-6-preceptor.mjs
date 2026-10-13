import { open, cap, capLong, save, nav, clk, btn, setManifest, step } from './parity-lib.mjs';
setManifest('manifest-6-preceptor.json');
const { b, p } = await open();
await nav(p, 'Preceptor Evaluation');
await cap(p, '140-preceptor-mailbox', 'Preceptor Evaluation: Evaluations sent (mailbox)');
const forms = [[0, '141-preceptor-form-binary-or-single', 'Open link #1 (Olivia Martin, Medication Reconciliation: Overall Binary)'], [1, '142-preceptor-form-demo-question', 'Open link #2 (Jonah Okonkwo, IV Insertion + Foley: demonstration + question)'], [2, '143-preceptor-form-lab', 'Open link #3 (Tobias Zeller, Medication Administration, Lab Instructor)'], [3, '144-preceptor-form-iv', 'Open link #4 (Olivia Martin, IV Insertion)']];
for (const [i, name, desc] of forms) {
  await step(name, async () => {
    await p.getByRole('button', { name: 'Open link' }).nth(i).click(); await p.waitForTimeout(400);
    await cap(p, name, desc);
    await p.getByRole('button', { name: 'Back to sent links' }).click(); await p.waitForTimeout(300);
  });
}
// scored form: find a link containing a scored skill if present; fill and submit link #2
await step('submit form', async () => {
  await p.getByRole('button', { name: 'Open link' }).nth(1).click(); await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'Independent', exact: true }).first().click();
  await p.locator('textarea').first().fill('Good technique.'); 
  const y = p.getByRole('button', { name: 'Yes', exact: true }); const n = await y.count(); for (let i = 0; i < n; i++) await y.nth(i).click();
  await cap(p, '145-preceptor-form-answered', 'Form answered, Submit enabled');
  await btn(p, 'Submit evaluation'); await cap(p, '146-preceptor-submitted', 'After Submit evaluation (result table)');
});
await step('after dismiss', async () => { await btn(p, 'Dismiss'); await cap(p, '147-preceptor-mailbox-after', 'Mailbox after submission (link removed?)'); });
save('manifest-6-preceptor.json'); await b.close();
