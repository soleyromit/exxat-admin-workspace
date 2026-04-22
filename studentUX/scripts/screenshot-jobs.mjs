import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
// Click Jobs nav item
await page.getByText('Jobs', { exact: true }).first().click();
await page.waitForTimeout(2000);
await page.screenshot({ path: 'jobs-implementation.png' });
await browser.close();
console.log('Screenshot saved to jobs-implementation.png');
