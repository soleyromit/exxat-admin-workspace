// Shared helpers for the dashboard concept mockups. Static, no build step.
// Sample data only: figures follow docs/knowledge/dataset-spec.md and the lab dashboard (123 students, 178 skills, 28 behind).

function shell(active, approvals) {
  const frame = document.querySelector('.frame');
  const util = document.createElement('div');
  util.className = 'util';
  util.innerHTML = `
    <div class="prod"><span class="mark" aria-hidden="true">P</span>Clinical Education</div>
    <span class="sep"></span><span class="crumb">${active}</span>
    <div class="right"><div class="search">Search students, skills, evaluators</div><span class="av" aria-hidden="true">AR</span></div>`;
  const rail = document.createElement('nav');
  rail.className = 'rail';
  rail.setAttribute('aria-label', 'Primary');
  const rows = [['Dashboard'], ['Skills'], ['Approvals', approvals ?? 19], ['Attainment']];
  rail.innerHTML = rows.map(([r, c]) =>
    `<a class="${r === active ? 'on' : ''}" href="#"><span class="ic" aria-hidden="true"></span>${r}${c ? `<span class="ct">${c}</span>` : ''}</a>`).join('');
  frame.prepend(rail);
  frame.prepend(util);
}

// Deterministic PRNG (mulberry32), so every render is identical.
function prng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Sparkline: neutral line, optional last-point dot, optional amber last point.
function spark(vals, { w = 84, h = 28, amber = false, area = false } = {}) {
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  const pts = vals.map((v, i) => [ (i / (vals.length - 1)) * (w - 4) + 2, h - 3 - ((v - min) / span) * (h - 6) ]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  const fill = area ? `<path d="${d} L${last[0]} ${h} L2 ${h} Z" fill="var(--viz-faint)"/>` : '';
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${fill}<path d="${d}" fill="none" stroke="var(--viz-mark)" stroke-width="1.5"/><circle cx="${last[0]}" cy="${last[1]}" r="2.5" fill="${amber ? 'var(--viz-short)' : 'var(--viz-ink)'}"/></svg>`;
}

// Horizontal stacked bar from segments [{v, c}] scaled to total `of`.
function hstack(segs, of, { w = 160, h = 10 } = {}) {
  let x = 0;
  const rects = segs.map(s => { const sw = (s.v / of) * w; const r = `<rect x="${x.toFixed(1)}" y="0" width="${Math.max(sw - 1, 0).toFixed(1)}" height="${h}" rx="1.5" fill="${s.c}"/>`; x += sw; return r; }).join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${rects}</svg>`;
}

const AGE = ['var(--viz-faint)', 'var(--viz-soft)', 'var(--viz-mark)', 'var(--viz-short)'];
const AGE_LABEL = ['0 to 3 days', '4 to 7', '8 to 14', '15 or more'];
