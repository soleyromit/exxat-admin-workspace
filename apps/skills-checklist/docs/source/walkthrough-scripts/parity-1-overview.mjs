import { open, cap, save, nav, clk, btn, manifest, setManifest, step, closeTop } from './parity-lib.mjs';
setManifest('manifest-1-overview.json');
import fs from 'fs'; const require_fs = fs;
const { b, p } = await open();
await cap(p, '01-shell-overview-by-student', 'Overview, By student (default), filters collapsed');
// filters panel
await btn(p, 'Filters'); await cap(p, '02-overview-filters-open', 'Overview with Filters panel expanded');
await btn(p, 'Filters', { wait: 200 });
// show 25 more
await btn(p, 'Show 25 more'); await cap(p, '03-overview-show-more', 'Overview By student after Show 25 more');
// by skill / by tag
await btn(p, 'By skill'); await cap(p, '04-overview-by-skill', 'Overview By skill');
await btn(p, 'By tag'); await cap(p, '05-overview-by-tag', 'Overview By tag');
await btn(p, 'By student');
// export menu
await btn(p, 'Export'); await cap(p, '06-overview-export-menu', 'Export menu open', { full: false });
await p.getByLabel('Close export menu').click(); await p.waitForTimeout(300);
// student drill-down
await clk(p, 'Noah Zeller'); await cap(p, '07-overview-student-panel', 'Student drill-down panel (Noah Zeller), skills list collapsed');
// expand IV insertion evidence
await clk(p, 'IV Insertion', { nth: 0 }); await cap(p, '08-overview-student-evidence-ledger', 'Student panel with IV Insertion evidence ledger expanded');
// view form dialog (on ledger)
await step('view form', async()=>{ await btn(p, 'View form', { nth: 0 }); await cap(p, '09-overview-evaluation-dialog', 'Evaluation detail ("View form") dialog', { full: false }); await closeTop(p); });
await step('after dialog', async()=>{ await cap(p, '10-overview-after-dialog', 'Student panel after closing evaluation dialog (dialog closed?)'); });
await step('show these only', async()=>{ const so = p.getByRole('button', { name: /Show these only/ }); await so.first().click(); await p.waitForTimeout(300); await cap(p, '11-overview-student-show-these-only', 'Student panel filtered with Show these only'); });
await step('close panel', async()=>{ await btn(p, 'Close'); await p.waitForTimeout(300); });
await step('search', async()=>{ await p.getByPlaceholder('Search students').fill('Noah'); await cap(p, '12-overview-search', 'By student with search "Noah"'); await p.getByPlaceholder('Search students').fill(''); });
await step('skill row', async()=>{ await btn(p, 'By skill'); await p.locator('tbody tr').first().click(); await cap(p, '13-overview-by-skill-row-click', 'By skill after clicking first row'); await closeTop(p).catch(()=>{}); });
await step('tag row', async()=>{ await btn(p, 'By tag'); await p.locator('tbody tr').first().click(); await cap(p, '14-overview-by-tag-row-click', 'By tag after clicking first row'); await closeTop(p).catch(()=>{}); });
await step('filters', async()=>{ await btn(p, 'Filters'); const names = await p.$$eval('select', (els) => els.map((e) => [...e.options].map((o) => o.text).join('|'))); require_fs.writeFileSync('/tmp/overview-selects.json', JSON.stringify(names)); await p.locator('select').nth(0).selectOption({ index: 1 }); await cap(p, '15-overview-filter-cohort', 'Filters panel with first cohort selected'); });
await step('impossible', async()=>{ const sels = await p.$$eval('select', (els) => els.map((e) => [...e.options].map((o) => o.text))); const loc = sels.findIndex((o)=>o.includes('Mercy Home Health')); const set = sels.findIndex((o)=>o.includes('Emergency')&&o.includes('Lab / Simulation')); await p.locator('select').nth(loc).selectOption({ label: 'Mercy Home Health' }); await p.locator('select').nth(set).selectOption({ label: 'Emergency' }); await cap(p, '16-overview-impossible-filter', 'Location Mercy Home Health + setting Emergency (prototype behaviour for a combination with no evidence)'); });
save('manifest-1-overview.json'); await b.close();
