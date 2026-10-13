// Parity capture helpers: screenshot + structured DOM extraction + measurements per prototype state.
import { chromium } from '/Users/romitsoley/Exxat-DS-Workspace/node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/index.mjs';
import fs from 'fs';
export const OUT = '/Users/romitsoley/Work/apps/skills-checklist/docs/source/parity';
export const PROTO = 'file:///Users/romitsoley/Work/apps/skills-checklist/docs/source/prism-skills-prototype.html';
fs.mkdirSync(OUT, { recursive: true });
export async function open() {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.setDefaultTimeout(6000); await p.goto(PROTO); await p.waitForTimeout(700);
  return { b, p };
}
export const manifest = [];
let MF = 'manifest.json';
export function setManifest(f) { MF = f; }
const EXTRACT = () => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const q = (e) => {
    const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ');
    const o = { t: e.tagName.toLowerCase() };
    if (e.getAttribute('role')) o.role = e.getAttribute('role');
    if (e.getAttribute('aria-label')) o.aria = e.getAttribute('aria-label');
    if (own) o.text = own.slice(0, 140);
    if (e.type && ['input', 'button', 'select', 'textarea'].includes(o.t)) o.type = e.type;
    if (e.placeholder) o.ph = e.placeholder;
    if (['input', 'select', 'textarea'].includes(o.t)) { o.value = (e.value || '').slice(0, 60); if (e.type === 'checkbox' || e.type === 'radio') o.checked = e.checked; }
    if (e.disabled) o.disabled = true;
    o.box = [Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)];
    const c = {};
    if (cs.display.includes('flex') || cs.display.includes('grid')) { c.display = cs.display; if (cs.gap !== 'normal') c.gap = cs.gap; if (cs.display.includes('grid')) c.cols = cs.gridTemplateColumns; if (cs.display.includes('flex')) { c.dir = cs.flexDirection; if (cs.justifyContent !== 'normal') c.jc = cs.justifyContent; if (cs.alignItems !== 'normal') c.ai = cs.alignItems; } }
    if (cs.padding !== '0px') c.pad = cs.padding;
    if (own || ['button', 'th', 'td', 'h1', 'h2', 'h3', 'h4', 'label'].includes(o.t)) { c.fs = cs.fontSize; c.fw = cs.fontWeight; c.color = cs.color; if (cs.textTransform !== 'none') c.tt = cs.textTransform; if (cs.letterSpacing !== 'normal') c.ls = cs.letterSpacing; }
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') c.bg = cs.backgroundColor;
    if (cs.borderTopWidth !== '0px' || cs.borderBottomWidth !== '0px' || cs.borderLeftWidth !== '0px') c.border = `${cs.borderTopWidth}/${cs.borderRightWidth}/${cs.borderBottomWidth}/${cs.borderLeftWidth} ${cs.borderTopColor}`;
    if (cs.borderRadius !== '0px') c.radius = cs.borderRadius;
    if (cs.boxShadow !== 'none') c.shadow = cs.boxShadow.slice(0, 60);
    if (cs.position === 'fixed' || cs.position === 'sticky') c.pos = cs.position + ' z' + cs.zIndex;
    if (Object.keys(c).length) o.css = c;
    return o;
  };
  let n = 0;
  const walk = (e, d) => {
    if (n > 1400 || !vis(e) || ['style', 'script', 'svg', 'path'].includes(e.tagName.toLowerCase())) return null;
    n++;
    const o = q(e);
    const kids = [];
    for (const c of e.children) { const k = walk(c, d + 1); if (k) kids.push(k); }
    if (kids.length) o.kids = kids;
    return o;
  };
  const root = document.getElementById('root');
  const tree = walk(root, 0);
  // summaries
  const buttons = [...document.querySelectorAll('button,a[role=button]')].filter(vis).map((b) => { const cs = getComputedStyle(b); const r = b.getBoundingClientRect(); const filled = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'rgb(255, 255, 255)' && !/^rgb\(2(4[0-9]|5[0-9])/.test(cs.backgroundColor); return { text: (b.innerText || b.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 60), aria: b.getAttribute('aria-label') || undefined, disabled: b.disabled || undefined, filled, bg: cs.backgroundColor, fg: cs.color, box: [Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)], radius: cs.borderRadius, fs: cs.fontSize, fw: cs.fontWeight }; });
  const tables = [...document.querySelectorAll('table')].filter(vis).map((t) => ({ headers: [...t.querySelectorAll('thead th')].map((h) => h.innerText.trim()), rows: t.querySelectorAll('tbody tr').length, firstRows: [...t.querySelectorAll('tbody tr')].slice(0, 3).map((r) => [...r.children].map((c) => c.innerText.trim().replace(/\s+/g, ' ').slice(0, 80))), rowHeight: Math.round(t.querySelector('tbody tr')?.getBoundingClientRect().height || 0), box: (() => { const r = t.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)]; })() }));
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,[role=heading]')].filter(vis).map((h) => ({ t: h.tagName.toLowerCase(), text: h.innerText.trim().slice(0, 100), fs: getComputedStyle(h).fontSize, fw: getComputedStyle(h).fontWeight }));
  // overlays: fixed elements covering large area or z>=40 with children
  const overlays = [...document.querySelectorAll('div,aside,section')].filter((e) => { const cs = getComputedStyle(e); if (cs.position !== 'fixed') return false; const r = e.getBoundingClientRect(); return r.width > 200 && r.height > 120 && vis(e); }).map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { cls: (e.className || '').toString().slice(0, 90), role: e.getAttribute('role') || undefined, box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], bg: cs.backgroundColor, z: cs.zIndex, text: e.innerText.trim().replace(/\s+/g, ' ').slice(0, 120) }; });
  const text = document.body.innerText.replace(/\n{2,}/g, '\n');
  return { url: location.href, scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], headings, buttons, tables, overlays, text, tree };
};
export async function cap(p, name, desc, opts = {}) {
  await p.waitForTimeout(opts.wait ?? 350);
  const full = opts.full ?? !(await overlayOpen(p));
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  const data = await p.evaluate(EXTRACT);
  data.name = name; data.desc = desc; data.fullPage = full;
  fs.writeFileSync(`${OUT}/${name}.json`, JSON.stringify(data));
  manifest.push({ name, desc, headings: data.headings.map((h) => h.text).slice(0, 4), buttons: data.buttons.filter((b) => b.filled).map((b) => b.text) });
  fs.writeFileSync(`${OUT}/${MF}`, JSON.stringify(manifest, null, 1));
  console.log('captured', name, '|', desc);
}
async function overlayOpen(p) { return p.evaluate(() => [...document.querySelectorAll('div')].some((e) => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.position === 'fixed' && r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9 && /rgba\(.*,\s*0\.\d+\)|rgba\(15, 23, 42/.test(cs.backgroundColor); })); }
export function save(file) { fs.writeFileSync(`${OUT}/${file}`, JSON.stringify(manifest, null, 1)); }
export async function nav(p, label) { await p.locator('aside button', { hasText: new RegExp('^\\s*' + label + '\\s*$') }).first().click().catch(async () => { await p.getByText(label, { exact: true }).first().click(); }); await p.waitForTimeout(500); }
export async function clk(p, text, o = {}) { await p.getByText(text, { exact: o.exact ?? true }).nth(o.nth ?? 0).click(); await p.waitForTimeout(o.wait ?? 400); }
export async function btn(p, name, o = {}) { await p.getByRole('button', { name, exact: o.exact ?? true }).nth(o.nth ?? 0).click(); await p.waitForTimeout(o.wait ?? 400); }

export async function step(label, fn) { try { await fn(); } catch (e) { console.log('STEP FAILED', label, String(e.message).split('\n')[0]); } }
export async function closeTop(p) { await p.getByRole('button', { name: 'Close', exact: true }).last().click(); await p.waitForTimeout(350); }
// capture a long modal/panel: top then scrolled-to-bottom of the first overflow container inside the overlay
export async function capLong(p, name, desc) {
  await cap(p, name, desc, { full: false });
  const moved = await p.evaluate(() => { const els = [...document.querySelectorAll('div')].filter((e) => { const cs = getComputedStyle(e); return /(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 40 && e.getBoundingClientRect().width > 300 && e.getBoundingClientRect().top >= 0; }); const e = els.sort((a, b) => b.scrollHeight - a.scrollHeight)[0]; if (!e) return false; e.scrollTop = e.scrollHeight; return true; });
  if (moved) { await p.waitForTimeout(250); await p.screenshot({ path: `${OUT}/${name}-b.png`, fullPage: false }); console.log('captured', name + '-b'); }
}
export async function ensureClosed(p) { for (let k = 0; k < 3; k++) { const c = p.getByRole('button', { name: 'Cancel', exact: true }); if (await c.count()) { await c.first().click().catch(() => {}); await p.waitForTimeout(250); continue; } const x = p.getByRole('button', { name: 'Close', exact: true }); if (await x.count()) { await x.last().click().catch(() => {}); await p.waitForTimeout(250); continue; } break; } }
