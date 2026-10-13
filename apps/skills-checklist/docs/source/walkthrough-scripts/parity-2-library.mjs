import { open, cap, capLong, save, nav, clk, btn, setManifest, step, closeTop } from './parity-lib.mjs';
setManifest('manifest-2-library.json');
const { b, p } = await open();
const cancel = async () => { const c = p.getByRole('button', { name: 'Cancel', exact: true }); if (await c.count()) await c.first().click(); else await closeTop(p); await p.waitForTimeout(300); };
await nav(p, 'Skills Library');
await cap(p, '20-library-skills', 'Skills Library, Skills tab (default)');
await step('search', async () => { await p.getByPlaceholder('Search skills').fill('wound'); await cap(p, '21-library-search', 'Skills tab, search "wound"'); await p.getByPlaceholder('Search skills').fill(''); });
await step('filter cat', async () => { await p.locator('select').nth(0).selectOption({ label: 'Category A' }); await cap(p, '22-library-filter-category', 'Skills tab, category filter = Category A'); await p.locator('select').nth(0).selectOption({ index: 0 }); });
for (const [tab, n, d] of [['Categories (3)', '23-library-categories', 'Categories tab'], ['Tags (3)', '24-library-tags', 'Tags tab'], ['Clinical Settings (5)', '25-library-settings', 'Clinical settings tab'], ['Lab Instructors (2)', '26-library-lab-instructors', 'Lab instructors tab']]) {
  await step(tab, async () => { await btn(p, tab); await cap(p, n, d); });
}
// dialogs on each tab
await step('cat add', async () => { await btn(p, 'Categories (3)'); await btn(p, 'Add category'); await capLong(p, '27-category-add-dialog', 'Add category dialog'); await cancel(); });
await step('cat edit', async () => { await btn(p, 'Edit', { nth: 0 }); await capLong(p, '28-category-edit-dialog', 'Edit category dialog'); await cancel(); });
await step('tag add', async () => { await btn(p, 'Tags (3)'); await btn(p, 'Add tag'); await capLong(p, '29-tag-add-dialog', 'Add tag dialog'); await cancel(); });
await step('tag edit', async () => { await btn(p, 'Edit', { nth: 0 }); await capLong(p, '30-tag-edit-dialog', 'Edit tag dialog'); await cancel(); });
await step('set add', async () => { await btn(p, 'Clinical Settings (5)'); await btn(p, 'Add setting'); await capLong(p, '31-setting-add-dialog', 'Add setting dialog'); await cancel(); });
await step('set edit', async () => { await btn(p, 'Edit', { nth: 0 }); await capLong(p, '32-setting-edit-dialog', 'Edit setting dialog'); await cancel(); });
await step('lab add', async () => { await btn(p, 'Lab Instructors (2)'); await btn(p, 'Add instructor'); await capLong(p, '33-lab-add-dialog', 'Add lab instructor dialog'); await cancel(); });
await step('lab edit', async () => { await btn(p, 'Edit', { nth: 0 }); await capLong(p, '34-lab-edit-dialog', 'Edit lab instructor dialog'); await cancel(); });
await step('lab adopt', async () => { await btn(p, 'Add to roster'); await capLong(p, '35-lab-adopt-dialog', 'Add to roster opens prefilled instructor dialog'); await btn(p, 'Save'); await cap(p, '36-lab-adopt-result', 'Lab instructors after saving the adopted instructor'); });
// import
await step('import open', async () => { await p.getByRole('button', { name: /^Skills \(/ }).click(); await p.waitForTimeout(300); });
await step('import', async () => { await btn(p, 'Import'); await capLong(p, '40-import-dialog-empty', 'Import dialog, empty'); await btn(p, 'Paste a sample list'); await capLong(p, '41-import-dialog-pasted', 'Import dialog with sample list pasted'); await btn(p, 'Read the list'); await capLong(p, '42-import-review', 'Import review step'); });
await step('import create', async () => { await btn(p, 'Create 8 skills'); await cap(p, '43-import-created-banner', 'Library after import: banner + unconfigured skills'); });
await step('show unconfigured', async () => { await btn(p, 'Show them'); await cap(p, '44-library-filter-needs-config', 'Library filtered to Needs configuration'); });
await step('configure unconfigured', async () => { await btn(p, 'Configure', { nth: 0 }); await capLong(p, '45-configure-unconfigured-step1', 'Configure (unconfigured skill) step 1'); });
save('manifest-2-library.json'); await b.close();
