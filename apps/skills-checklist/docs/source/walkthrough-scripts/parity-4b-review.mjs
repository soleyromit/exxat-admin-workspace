import { open, cap, nav, setManifest, step } from './parity-lib.mjs';
setManifest('manifest-4b-review.json');
const { b, p } = await open();
await nav(p, 'Review & Approve');
await step('responses', async () => { await p.getByText('See the full responses').first().click(); await p.waitForTimeout(300); await cap(p, '111-review-full-responses', 'Review card with full responses expanded'); });
await b.close();
