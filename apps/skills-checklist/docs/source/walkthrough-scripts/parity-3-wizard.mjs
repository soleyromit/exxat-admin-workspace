import { open, cap, capLong, save, nav, clk, btn, setManifest, step as rawStep, closeTop, ensureClosed } from './parity-lib.mjs';
const step = async (l, f) => { await ensureClosed(p); await rawStep(l, f); };
setManifest('manifest-3-wizard.json');
const { b, p: p0 } = await open(); const p = p0;
const cancel = async () => { const c = p.getByRole('button', { name: 'Cancel', exact: true }); if (await c.count()) await c.first().click(); else await closeTop(p); await p.waitForTimeout(300); };
await nav(p, 'Skills Library');
// A. blank new skill: step1, validation, step2 empty, each model
await step('add blank', async () => { await btn(p, 'Add skill'); await capLong(p, '50-add-skill-step1-blank', 'Add skill: step 1 blank (note Continue enabled/disabled state)'); const c = p.getByRole('button', { name: 'Continue', exact: true }); console.log('continue disabled with empty name:', await c.isDisabled()); if (!(await c.isDisabled())) { await c.click(); await capLong(p, '51-add-skill-step1-validation', 'Add skill: Continue pressed with empty name'); } });
const models = [['Overall Binary Outcome', 'binary'], ['Question-Level Qualitative', 'question'], ['Scored / Likert', 'scored'], ['Demonstration-Level Outcome', 'demo']];
let i = 52;
for (const [label, key] of models) {
  await step('new ' + key, async () => {
    await btn(p, 'Add skill');
    await p.getByPlaceholder('Program-defined skill name').fill('Sample ' + key + ' skill').catch(async () => { await p.locator('input[type=text]').first().fill('Sample ' + key + ' skill'); });
    await btn(p, 'Continue');
    if (key === 'binary') await capLong(p, '52-add-skill-step2-no-model', 'Add skill: step 2 before choosing a model');
    await p.getByText(label, { exact: true }).first().click(); await p.waitForTimeout(300);
    await capLong(p, `${53 + models.findIndex((m) => m[1] === key) * 3}-new-${key}-step2`, `New skill, model ${label}: step 2 (blank model config)`);
    await btn(p, 'Continue');
    await capLong(p, `${54 + models.findIndex((m) => m[1] === key) * 3}-new-${key}-step3`, `New skill, model ${label}: step 3 (criteria)`);
    await btn(p, 'Save skill');
    await capLong(p, `${55 + models.findIndex((m) => m[1] === key) * 3}-new-${key}-save-attempt`, `New skill, model ${label}: after pressing Save skill with blank config (validation or saved?)`);
    await cancel();
  });
}
// B. edit existing skills, all steps
const existing = [['IV Insertion', 'demo-iv'], ['Foley Catheter Insertion', 'question-foley'], ['Head-to-Toe Assessment', 'scored-h2t'], ['Sterile Dressing Change', 'binary-sterile'], ['Wound Care', 'demo-wound']];
let n = 70;
for (const [skill, key] of existing) {
  await step('edit ' + key, async () => {
    await p.getByRole('button', { name: /^Skills \(/ }).click().catch(() => {});
    await p.getByPlaceholder('Search skills').fill(skill); await p.waitForTimeout(300);
    await btn(p, 'Edit', { nth: 0 });
    await capLong(p, `${n}-edit-${key}-step1`, `Edit ${skill}: step 1`);
    await btn(p, 'Continue'); await capLong(p, `${n + 1}-edit-${key}-step2`, `Edit ${skill}: step 2 evaluation configuration`);
    await btn(p, 'Continue'); await capLong(p, `${n + 2}-edit-${key}-step3`, `Edit ${skill}: step 3 criteria`);
    await cancel(); await p.getByPlaceholder('Search skills').fill('');
  });
  n += 3;
}
// C. interactions on step 2 of a configured question skill: change model (confirm?), toggle workflow switches, preview
await step('model change', async () => {
  await p.getByPlaceholder('Search skills').fill('Foley'); await btn(p, 'Edit', { nth: 0 }); await btn(p, 'Continue');
  await p.getByText('Overall Binary Outcome', { exact: true }).first().click(); await p.waitForTimeout(300);
  await capLong(p, '90-edit-change-model', 'Edit Foley, step 2 after switching model to Overall Binary Outcome (is there a confirm? criteria rebuilt?)');
  await btn(p, 'Continue'); await capLong(p, '91-edit-change-model-step3', 'After model change: step 3');
  await cancel();
});
await step('add question', async () => {
  await btn(p, 'Edit', { nth: 0 }); await btn(p, 'Continue'); await btn(p, 'Add question'); await capLong(p, '92-edit-add-question', 'Step 2 after Add question');
  await btn(p, 'Add field').catch(()=>{}); await capLong(p, '93-edit-add-field', 'Step 2 after Add field (if present)');
  await cancel();
});
save('manifest-3-wizard.json'); await b.close();
