import { open, cap, capLong, save, nav, btn, setManifest, step as rawStep, ensureClosed } from './parity-lib.mjs';
setManifest('manifest-3b-new.json');
const { b, p } = await open();
const step = async (l, f) => { await ensureClosed(p); await rawStep(l, f); };
await nav(p, 'Skills Library');
const models = [['Overall Binary Outcome', 'binary'], ['Question-Level Qualitative', 'question'], ['Scored / Likert', 'scored'], ['Demonstration-Level Outcome', 'demo']];
let k = 0;
for (const [label, key] of models) {
  await step('new ' + key, async () => {
    await btn(p, 'Add skill');
    if (k === 0) { const a = p.getByRole('button', { name: 'Add and configure', exact: true }); console.log('Add and configure disabled when empty:', await a.isDisabled()); await cap(p, '51-add-skill-dialog-empty', 'Add a skill dialog, empty', { full: false }); }
    await p.getByPlaceholder('Programme-defined skill name').fill('Sample ' + key);
    if (k === 0) await cap(p, '52-add-skill-dialog-filled', 'Add a skill dialog with name entered', { full: false });
    await btn(p, 'Add and configure');
    const base = 53 + k * 5;
    await capLong(p, `${base}-new-${key}-step1`, `New skill (${key}): wizard step 1 after Add and configure`);
    await btn(p, 'Continue');
    await capLong(p, `${base + 1}-new-${key}-step2-no-model`, `New skill (${key}): step 2 before choosing a model`);
    console.log(key, 'continue disabled before model:', await p.getByRole('button', { name: 'Continue', exact: true }).isDisabled().catch(() => 'n/a'));
    await p.getByRole('button', { name: new RegExp('^' + label.replace(/[/]/g, '\\/')) }).first().click(); await p.waitForTimeout(300);
    await capLong(p, `${base + 2}-new-${key}-step2-model-chosen`, `New skill, ${label}: step 2 with model chosen, config blank`);
    console.log(key, 'continue disabled after model (blank config):', await p.getByRole('button', { name: 'Continue', exact: true }).isDisabled().catch(() => 'n/a'));
    if (key === 'binary') { const ins = p.locator('input[type=text]'); const n = await ins.count(); console.log('text inputs', n); await p.getByPlaceholder('Met', { exact: true }).fill('Met').catch(() => {}); await p.getByPlaceholder('Unmet', { exact: true }).fill('Unmet').catch(() => {}); await p.waitForTimeout(300); await capLong(p, `${base + 3}-new-${key}-step2-labels-filled`, 'Binary: step 2 with both labels entered'); console.log('continue disabled after labels:', await p.getByRole('button', { name: 'Continue', exact: true }).isDisabled()); }
    const cont = p.getByRole('button', { name: 'Continue', exact: true });
    if (!(await cont.isDisabled().catch(() => true))) { await cont.click(); await capLong(p, `${base + 4}-new-${key}-step3`, `New skill, ${label}: step 3 criteria`); const sv = p.getByRole('button', { name: 'Save skill', exact: true }); console.log(key, 'save skill disabled:', await sv.isDisabled().catch(() => 'n/a')); }
  });
  k++;
}
await step('sterile', async () => {
  await p.getByRole('button', { name: /^Skills \(/ }).click().catch(() => {});
  await p.getByPlaceholder('Search skills').fill('Sterile'); await btn(p, 'Edit', { nth: 0 }); await btn(p, 'Continue');
  await p.getByPlaceholder('Met', { exact: true }).fill('Met'); await p.getByPlaceholder('Unmet', { exact: true }).fill('Unmet'); await btn(p, 'Continue');
  await capLong(p, '81-edit-binary-sterile-step3', 'Edit Sterile Dressing Change: step 3 criteria (after filling blank labels)');
});
await step('unticked', async () => {
  await p.getByPlaceholder('Search skills').fill(''); await btn(p, 'Add skill'); await p.getByPlaceholder('Programme-defined skill name').fill('Later skill');
  await p.getByText('Configure how it is evaluated now').click(); await p.waitForTimeout(250);
  await cap(p, '78-add-skill-dialog-unticked', 'Add a skill dialog with Configure-now unticked', { full: false });
  console.log('buttons now:', await p.$$eval('button', (els) => els.filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.innerText.trim()).slice(-3).join('|')));
});
save('manifest-3b-new.json'); await b.close();
