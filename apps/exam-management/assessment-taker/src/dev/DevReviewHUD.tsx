/**
 * DevReviewHUD — live in-app review overlay (DEV ONLY).
 *
 * Re-runs on every route change and a few seconds after, surfacing:
 *   • WCAG — axe-core violations (the same engine the visual-review agent uses)
 *   • DS   — a pragmatic in-DOM conformance scan: hardcoded colors, raw <button>,
 *            sub-12px text, and banned class patterns (the scannable subset of
 *            tools/visual-check/ds-conformance.mjs)
 *
 * This is NOT a replacement for the ds-conformance-reviewer agent (which diffs
 * the rendered screen against the live DS at localhost:4000). It's a fast,
 * always-on signal while you click through the app. Strip-free in production:
 * the whole tree is gated on import.meta.env.DEV and never mounts in a build.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// Framework-agnostic current-path hook (works in Vite/react-router, Next, any
// History-API router) — so this HUD can drop into any app without a router dep.
function useLocationPath(): string {
  const [path, setPath] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : ''));
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (this: History, ...args: Parameters<History['pushState']>) { const r = origPush.apply(this, args); update(); return r; };
    history.replaceState = function (this: History, ...args: Parameters<History['replaceState']>) { const r = origReplace.apply(this, args); update(); return r; };
    return () => {
      window.removeEventListener('popstate', update);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);
  return path;
}

type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

interface A11yIssue {
  id: string;
  impact: Severity;
  help: string;
  target: string;
  count: number;
  html?: string;       // the offending code/markup
  summary?: string;    // axe's "fix any of the following" guidance
}

interface DsIssue {
  rule: string;
  detail: string;
  target: string;
}

// Maps each DS scan rule → which DS component/source it relates to + the fix.
const DS_RULE_META: Record<string, { component: string; ds: string; suggestion: string }> = {
  'raw-button': {
    component: 'Button',
    ds: '@exxatdesignux/ui',
    suggestion: "import { Button } from '@exxatdesignux/ui' — explicit variant + size",
  },
  'native-select': {
    component: 'Select',
    ds: '@exxatdesignux/ui',
    suggestion: 'Native <select> — use the DS Select (SelectTrigger/SelectContent/SelectItem)',
  },
  'raw-table': {
    component: 'DataTable / Table',
    ds: 'components/data-table',
    suggestion: 'Hand-rolled <table> — use the vendored DataTable (never recreate it)',
  },
  'raw-input': {
    component: 'Input / Field',
    ds: '@exxatdesignux/ui',
    suggestion: 'Unstyled native <input> — use DS Input inside a Field with a Label',
  },
  'nonsemantic-button': {
    component: 'Button',
    ds: '@exxatdesignux/ui',
    suggestion: 'Clickable <div>/<span> (role="button") — use DS Button so focus/keyboard work',
  },
  'raw-dialog': {
    component: 'Dialog / Sheet',
    ds: '@exxatdesignux/ui',
    suggestion: 'Native <dialog> / role="dialog" on a raw div — use DS Dialog or Sheet',
  },
  'hardcoded-color': {
    component: 'Design tokens',
    ds: '@exxatdesignux/ui/globals.css',
    suggestion: 'Replace hex/rgb with var(--token) — e.g. var(--foreground), var(--border)',
  },
  'banned-color-mix': {
    component: 'Selection / active state',
    ds: 'design-anti-patterns.md',
    suggestion: 'Use --muted / --border-control-3 for active states, not color-mix(in oklch)',
  },
  'sub-12px-text': {
    component: 'Typography',
    ds: 'CLAUDE-DS-REFERENCE §Typography',
    suggestion: 'Use ≥12px — DS --text-xs (12px) is the floor',
  },
  'banned-uppercase-tracking': {
    component: 'Label / eyebrow',
    ds: 'design-anti-patterns.md',
    suggestion: 'Drop uppercase + tracking-wide — use sentence-case label',
  },
  'banned-empty-hero': {
    component: 'EmptyState',
    ds: 'components/empty-state.tsx',
    suggestion: 'Use the DS EmptyState, not a py-20 text-center hero',
  },
};

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--destructive)',
  serious: 'var(--destructive)',
  moderate: 'var(--chart-4, #b45309)',
  minor: 'var(--muted-foreground)',
};

// review-bridge (local companion that runs headless Sonnet to apply fixes)
const BRIDGE = 'http://127.0.0.1:7331';
const AUDIT = 'http://127.0.0.1:7332'; // audit-server: vision deep DS review
interface DeepFinding { desc: string; fixed?: boolean; file?: string; summary?: string }
type FixPhase = 'locating' | 'fixing' | 'fixed' | 'failed' | 'skipped';
interface FixState { phase: FixPhase; summary?: string; file?: string; error?: string }

function wcagId(i: A11yIssue) { return `wcag:${i.id}`; }
function dsId(i: DsIssue) { return `ds:${i.rule}:${i.target}`; }

// ─── DS conformance scan (in-DOM, synchronous) ────────────────────────────────
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;
const RGB_RE = /\brg(?:b|ba)\(/;

function shortSelector(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const cls = typeof el.className === 'string' && el.className
    ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
    : '';
  return `${tag}${id}${cls}`.slice(0, 60);
}

function scanDs(root: HTMLElement): DsIssue[] {
  const issues: DsIssue[] = [];
  const seen = new Set<string>();
  const push = (rule: string, detail: string, el: Element) => {
    if (el.closest('[data-dev-hud]')) return; // never flag the HUD itself
    const target = shortSelector(el);
    const key = rule + '|' + target + '|' + detail;
    if (seen.has(key)) return;
    seen.add(key);
    issues.push({ rule, detail, target });
  };

  // ── COMPONENT-LEVEL: hand-rolled where a DS component exists ───────────────
  // Raw <button> with no class (DS Button always carries classes)
  root.querySelectorAll('button').forEach(el => {
    if (!el.className || (typeof el.className === 'string' && el.className.trim() === '')) {
      push('raw-button', 'Unstyled <button> — use DS Button with variant + size', el);
    }
  });
  // Native <select> — the DS Select renders a button trigger, never a native select
  root.querySelectorAll('select').forEach(el => push('native-select', 'Native <select> on the page', el));
  // Hand-rolled <table> (DS DataTable/Table carry classes/data-slot)
  root.querySelectorAll('table').forEach(el => {
    const c = typeof el.className === 'string' ? el.className : '';
    if (!c.trim() && !el.closest('[data-slot]')) push('raw-table', 'Hand-rolled <table>', el);
  });
  // Unstyled native text inputs (DS Input carries classes)
  root.querySelectorAll<HTMLInputElement>('input').forEach(el => {
    if (['hidden', 'checkbox', 'radio', 'range', 'file'].includes(el.type)) return;
    if (!el.className || (typeof el.className === 'string' && el.className.trim() === '')) {
      push('raw-input', 'Unstyled native <input>', el);
    }
  });
  // Clickable non-buttons (role="button" on a div/span) — keyboard/focus traps
  root.querySelectorAll('[role="button"]').forEach(el => {
    const t = el.tagName.toLowerCase();
    if (t !== 'button' && t !== 'a') push('nonsemantic-button', `<${t} role="button">`, el);
  });
  // Raw dialogs not from the DS
  root.querySelectorAll('dialog').forEach(el => push('raw-dialog', 'Native <dialog> element', el));

  // ── TOKEN-LEVEL: inline hardcoded colors + banned tokens ───────────────────
  root.querySelectorAll<HTMLElement>('[style]').forEach(el => {
    const s = el.getAttribute('style') || '';
    if (HEX_RE.test(s) || RGB_RE.test(s)) push('hardcoded-color', 'Hex/rgb in inline style', el);
    if (s.includes('color-mix(in oklch')) push('banned-color-mix', 'color-mix(in oklch …) selection state', el);
  });

  // Banned class patterns
  root.querySelectorAll<HTMLElement>('[class]').forEach(el => {
    const c = typeof el.className === 'string' ? el.className : '';
    if (/\buppercase\b/.test(c) && /\btracking-wide\b/.test(c)) push('banned-uppercase-tracking', 'uppercase + tracking-wide label', el);
    if (/\bpy-20\b/.test(c) && /\btext-center\b/.test(c)) push('banned-empty-hero', 'py-20 text-center empty-state hero', el);
  });

  // ── Sub-12px text — collapsed to ONE row per size so it can't drown out the
  // structural findings above (and skip DS-internal small text: kbd, data-slot).
  const sizesSeen = new Set<string>();
  root.querySelectorAll<HTMLElement>('*').forEach(el => {
    if (!el.textContent || !el.textContent.trim() || el.children.length > 0) return;
    if (el.tagName === 'KBD' || el.closest('[data-slot]')) return;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs && fs < 11.5) {
      const k = fs.toFixed(0);
      if (sizesSeen.has(k)) return;
      sizesSeen.add(k);
      push('sub-12px-text', `Text at ${fs.toFixed(1)}px — below the 12px DS floor (one example)`, el);
    }
  });

  return issues;
}

// LOCAL-ONLY guard — never render on a deployed (non-localhost) origin, even if
// a dev server is somehow exposed. Production builds already strip this whole
// module via the `import.meta.env.DEV` gate at the mount site.
function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h.endsWith('.local');
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DevReviewHUD({ product }: { product?: string }) {
  // SSR-safe: render nothing until mounted on the client, so the server output
  // (null) matches the first client render — no hydration mismatch in Next/SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || !isLocalHost()) return null;
  return <DevReviewHUDInner product={product} />;
}

function DevReviewHUDInner({ product }: { product?: string }) {
  const pathname = useLocationPath();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'wcag' | 'ds'>('wcag');
  const [running, setRunning] = useState(false);
  const [a11y, setA11y] = useState<A11yIssue[]>([]);
  const [ds, setDs] = useState<DsIssue[]>([]);
  const [bridgeUp, setBridgeUp] = useState(false);
  const [fixing, setFixing] = useState(false);
  // Auto-fix defaults ON — fixes are queued automatically as you navigate,
  // no per-session toggle and no button click required.
  const [autoFix, setAutoFix] = useState(true);
  const [fixState, setFixState] = useState<Record<string, FixState>>({});
  const [fixTotal, setFixTotal] = useState(0);
  // Deep vision DS review (Sonnet looks at the rendered screenshot)
  const [deepUp, setDeepUp] = useState(false);
  const [deepRunning, setDeepRunning] = useState(false);
  const [deepFindings, setDeepFindings] = useState<DeepFinding[]>([]);
  // Deep vision review runs automatically once per page (Sonnet screenshots →
  // reviews layout/components/patterns → auto-fixes). Untick "on load" to pause.
  const [deepAuto, setDeepAuto] = useState(true);
  const deepDoneRef = useRef('');
  const [pos, setPos] = useState({ right: 12, bottom: 12 });
  const runSeq = useRef(0);
  // Issue ids already sent to the bridge — dedupes so auto-fix never re-sends a
  // finding or loops on one it already attempted, while still firing for NEW
  // issues that appear on any step / dialog / DOM change.
  const attemptedRef = useRef<Set<string>>(new Set());
  const scanningRef = useRef(false);
  const dragRef = useRef<{ x: number; y: number; right: number; bottom: number; moved: boolean } | null>(null);

  // Drag-to-reposition (from the badge or the panel header grip)
  const startDrag = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setPos(p => {
      dragRef.current = { x: e.clientX, y: e.clientY, right: p.right, bottom: p.bottom, moved: false };
      return p;
    });
    const move = (ev: PointerEvent) => {
      const d = dragRef.current; if (!d) return;
      const dx = ev.clientX - d.x, dy = ev.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
      setPos({
        right: Math.min(window.innerWidth - 80, Math.max(8, d.right - dx)),
        bottom: Math.min(window.innerHeight - 44, Math.max(8, d.bottom - dy)),
      });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, []);

  const run = useCallback(async () => {
    const seq = ++runSeq.current;
    scanningRef.current = true;
    setRunning(true);
    // DS scan first (fast, synchronous)
    try {
      setDs(scanDs(document.body));
    } catch { /* ignore */ }
    // axe (async)
    try {
      const axe = (await import('axe-core')).default;
      const results = await axe.run({ exclude: [['[data-dev-hud]'], ['vite-error-overlay']] } as any, {
        resultTypes: ['violations'],
        // keep it quick; the agent does the deep pass
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
      });
      if (seq !== runSeq.current) return; // a newer run superseded this
      const mapped: A11yIssue[] = results.violations.map(v => ({
        id: v.id,
        impact: (v.impact ?? 'minor') as Severity,
        help: v.help,
        target: v.nodes[0]?.target?.join(' ') ?? '',
        count: v.nodes.length,
        html: v.nodes[0]?.html,
        summary: v.nodes[0]?.failureSummary,
      }));
      // sort by severity
      const order: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
      mapped.sort((a, b) => (order[a.impact] ?? 9) - (order[b.impact] ?? 9));
      setA11y(mapped);
    } catch {
      /* axe failed — leave previous results */
    } finally {
      if (seq === runSeq.current) setRunning(false);
      scanningRef.current = false;
    }
  }, []);

  // Re-run on navigation (debounced for render/animation settle)
  useEffect(() => {
    const t = setTimeout(run, 600);
    return () => clearTimeout(t);
  }, [pathname, run]);

  // Re-scan when the page DOM changes (panels open/close, drawers, dialogs) —
  // detection shouldn't wait for a route change. Debounced; ignores the HUD's
  // own re-renders and mutations during a scan so it never loops.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const obs = new MutationObserver(records => {
      if (scanningRef.current) return;
      const relevant = records.some(r => {
        const n: Node = r.target;
        const el = n.nodeType === 1 ? (n as Element) : n.parentElement;
        return el ? !el.closest('[data-dev-hud]') : false;
      });
      if (!relevant) return;
      if (t) clearTimeout(t);
      t = setTimeout(run, 1000);
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => { obs.disconnect(); if (t) clearTimeout(t); };
  }, [run]);

  // Reset fix state when the page changes
  useEffect(() => { setFixState({}); }, [pathname]);

  // Poll the review-bridge so the "Fix" action only appears when it's running
  useEffect(() => {
    let stop = false;
    const probe = async (urlBase: string, set: (v: boolean) => void) => {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 2000);
      try { const r = await fetch(`${urlBase}/health`, { signal: ctrl.signal }); if (!stop) set(r.ok); }
      catch { if (!stop) set(false); }
      finally { clearTimeout(to); }
    };
    const ping = () => { probe(BRIDGE, setBridgeUp); probe(AUDIT, setDeepUp); };
    ping();
    const t = setInterval(ping, 5000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  // Deep vision review — screenshot this page → Sonnet reviews layout/components
  // /patterns against the DS and (auto-)fixes the source. Streams findings live.
  const deepReview = useCallback(async () => {
    setDeepRunning(true);
    setDeepFindings([]);
    try {
      const resp = await fetch(`${AUDIT}/deep-review`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: window.location.origin, route: pathname, product, autofix: true }),
      });
      const reader = resp.body?.getReader();
      if (!reader) throw new Error('no stream');
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const ls = buf.split('\n'); buf = ls.pop() ?? '';
        for (const line of ls) {
          if (!line.trim()) continue;
          let ev: any; try { ev = JSON.parse(line); } catch { continue; }
          if (ev.phase === 'finding') setDeepFindings(f => [...f, { desc: ev.desc, fixed: ev.fixed, file: ev.file, summary: ev.summary }]);
        }
      }
    } catch { /* audit-server offline */ }
    finally { setDeepRunning(false); setTimeout(run, 1000); }
  }, [pathname, product, run]);

  // Auto deep-review once per page when enabled (opt-in — it's a slow Sonnet call)
  useEffect(() => {
    if (deepAuto && deepUp && !deepRunning && deepDoneRef.current !== pathname) {
      deepDoneRef.current = pathname;
      deepReview();
    }
  }, [deepAuto, deepUp, deepRunning, pathname, deepReview]);

  // Send every detected issue to the bridge; stream Sonnet's progress live.
  const fixPage = useCallback(async () => {
    const issues = [
      ...a11y.map(i => ({ id: wcagId(i), kind: 'wcag', rule: i.id, detail: i.help, selector: i.target, html: i.html, suggestion: i.summary })),
      ...ds.map(i => {
        const m = DS_RULE_META[i.rule];
        return { id: dsId(i), kind: 'ds', rule: i.rule, detail: i.detail, selector: i.target, component: m ? `${m.component} · ${m.ds}` : undefined, suggestion: m?.suggestion };
      }),
    ];
    if (!issues.length) return;
    setFixing(true);
    setFixState({});
    setFixTotal(issues.length);
    try {
      const resp = await fetch(`${BRIDGE}/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, route: pathname, issues }),
      });
      const reader = resp.body?.getReader();
      if (!reader) throw new Error('no stream');
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          let ev: any;
          try { ev = JSON.parse(line); } catch { continue; }
          if (['locating', 'fixing', 'fixed', 'failed'].includes(ev.phase) && ev.id) {
            setFixState(s => ({ ...s, [ev.id]: { phase: ev.phase, summary: ev.summary, file: ev.file, error: ev.error } }));
          }
        }
      }
    } catch {
      /* bridge offline / aborted */
    } finally {
      setFixing(false);
      setTimeout(run, 900); // re-detect so solved issues drop off
    }
  }, [a11y, ds, product, pathname, run]);

  // Auto-fix: queue fixes for any NEW issues as you navigate (route changes,
  // wizard steps, dialogs, DOM mutations) — no button, no once-per-route cap.
  // Dedupes by issue id so it never re-sends a finding or loops on a fix it
  // already attempted; a genuinely new issue (new step/page/dialog) re-triggers.
  useEffect(() => {
    if (!autoFix || !bridgeUp || fixing) return;
    const ids = [...a11y.map(wcagId), ...ds.map(dsId)];
    if (!ids.some(id => !attemptedRef.current.has(id))) return; // nothing new to fix
    ids.forEach(id => attemptedRef.current.add(id));
    fixPage();
  }, [autoFix, bridgeUp, fixing, a11y, ds, fixPage]);

  const a11ySerious = a11y.filter((i: A11yIssue) => i.impact === 'critical' || i.impact === 'serious').length;
  const a11yTotal = a11y.reduce((n: number, i: A11yIssue) => n + i.count, 0);
  const dsTotal = ds.length;
  const allClear = a11yTotal === 0 && dsTotal === 0;

  // Fix progress (live)
  const fixVals: FixState[] = Object.values(fixState);
  const fixedN = fixVals.filter(v => v.phase === 'fixed').length;
  const skipN = fixVals.filter(v => v.phase === 'skipped').length;
  const failN = fixVals.filter(v => v.phase === 'failed').length;
  const doneN = fixedN + skipN + failN;
  const activeFile = fixVals.find(v => v.phase === 'fixing')?.file;
  const showProgress = fixTotal > 0 && (fixing || doneN > 0);

  return (
    <div data-dev-hud="" style={{ position: 'fixed', right: pos.right, bottom: pos.bottom, zIndex: 2147483000, fontFamily: 'var(--font-sans, system-ui)' }}>
      {/* Expanded panel */}
      {open && (
        <div
          style={{
            width: 360, maxHeight: '60vh', display: 'flex', flexDirection: 'column',
            marginBottom: 8, borderRadius: 12, overflow: 'hidden',
            background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e5e5)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}
        >
          {/* Header / tabs (the grip + path area drags the HUD) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
            <span
              onPointerDown={startDrag}
              title="Drag to move"
              style={{ cursor: 'grab', color: 'var(--muted-foreground)', fontSize: 13, padding: '0 2px', userSelect: 'none', touchAction: 'none' }}
            >
              ⠿
            </span>
            <button onClick={() => setTab('wcag')} style={tabStyle(tab === 'wcag')}>
              WCAG {a11yTotal > 0 ? `(${a11yTotal})` : '✓'}
            </button>
            <button onClick={() => setTab('ds')} style={tabStyle(tab === 'ds')}>
              DS {dsTotal > 0 ? `(${dsTotal})` : '✓'}
            </button>
            <span
              onPointerDown={startDrag}
              style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted-foreground)', cursor: 'grab', userSelect: 'none', touchAction: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}
            >
              {running ? 'checking…' : pathname}
            </span>
            <button onClick={run} title="Re-run" style={iconBtnStyle}>
              <span style={{ fontSize: 13 }}>↻</span>
            </button>
            <button onClick={() => setOpen(false)} title="Close" style={iconBtnStyle}>
              <span style={{ fontSize: 14 }}>×</span>
            </button>
          </div>

          {/* Live fix progress */}
          {showProgress && (
            <div style={{ padding: '7px 10px', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--foreground)' }}>
                  {fixing ? `Sonnet fixing ${Math.min(doneN + 1, fixTotal)}/${fixTotal}` : `Done — ${fixTotal} reviewed`}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 10.5, display: 'flex', gap: 8 }}>
                  <span style={{ color: '#15803d' }}>✓ {fixedN}</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>⤳ {skipN}</span>
                  {failN > 0 && <span style={{ color: 'var(--destructive)' }}>✗ {failN}</span>}
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 999, background: 'var(--muted)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((doneN / Math.max(1, fixTotal)) * 100)}%`, background: 'var(--brand-color)', transition: 'width 0.3s' }} />
              </div>
              {fixing && activeFile && (
                <p style={{ fontSize: 10, color: 'var(--muted-foreground)', margin: '4px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  editing {activeFile}
                </p>
              )}
            </div>
          )}

          {/* Fix action bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
            {bridgeUp ? (
              <button
                onClick={fixPage}
                disabled={fixing || allClear}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, height: 28, paddingInline: 12, borderRadius: 7,
                  border: 'none', cursor: fixing || allClear ? 'default' : 'pointer',
                  background: fixing || allClear ? 'var(--muted-foreground)' : 'var(--brand-color)',
                  color: 'var(--brand-foreground, #fff)', fontSize: 12, fontWeight: 600, opacity: allClear ? 0.5 : 1,
                }}
              >
                <span>{fixing ? '⠋' : '✦'}</span>
                {fixing ? 'Sonnet fixing…' : allClear ? 'Nothing to fix' : `Fix page (${a11yTotal + dsTotal}) with Sonnet`}
              </button>
            ) : null}
            {bridgeUp && (
              <label style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={autoFix} onChange={e => setAutoFix(e.target.checked)} />
                auto-fix while navigating
              </label>
            )}
            {!bridgeUp && (
              <span style={{ fontSize: 11, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Dot color="var(--muted-foreground)" /> bridge offline — run <code style={{ fontSize: 10.5 }}>node tools/review-bridge/server.mjs</code>
              </span>
            )}
          </div>

          {/* Deep vision review action bar */}
          {deepUp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={deepReview}
                disabled={deepRunning}
                title="Sonnet reviews the rendered page for layout/component/pattern issues a DOM scan can't see"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, height: 26, paddingInline: 11, borderRadius: 7,
                  border: '1px solid var(--brand-color)', cursor: deepRunning ? 'default' : 'pointer',
                  background: 'transparent', color: 'var(--brand-color)', fontSize: 12, fontWeight: 600,
                }}
              >
                <span>{deepRunning ? '⠋' : '👁'}</span>
                {deepRunning ? 'Sonnet reviewing layout…' : 'Deep review (layout · components · patterns)'}
              </button>
              <label style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={deepAuto} onChange={e => setDeepAuto(e.target.checked)} />
                on load
              </label>
            </div>
          )}

          {/* Deep findings */}
          {(deepRunning || deepFindings.length > 0) && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', background: 'var(--card)', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--brand-color)', margin: 0 }}>
                Deep review {deepFindings.length > 0 ? `· ${deepFindings.length}` : ''}
              </p>
              {deepRunning && deepFindings.length === 0 && (
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>Sonnet is looking at the rendered page…</p>
              )}
              {deepFindings.map((f, k) => (
                <div key={k} style={{ borderLeft: '2.5px solid var(--brand-color)', paddingLeft: 8 }}>
                  <p style={{ fontSize: 12, color: 'var(--foreground)', margin: 0, lineHeight: 1.4 }}>{f.desc}</p>
                  {f.fixed && (
                    <p style={{ fontSize: 11, color: '#15803d', margin: '2px 0 0' }}>
                      fixed ✓ {f.file ? <code style={{ fontSize: 10.5 }}>{f.file}</code> : null} {f.summary}
                    </p>
                  )}
                  {!f.fixed && f.summary && <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: '2px 0 0' }}>{f.summary}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Body */}
          <div style={{ overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tab === 'wcag' && (
              a11y.length === 0
                ? <Empty label="No axe violations on this page." />
                : a11y.map((i: A11yIssue, k: number) => (
                    <Row key={k} color={SEV_COLOR[i.impact]} tag={i.impact} title={i.help}
                      meta={`${i.id} · ${i.count} node${i.count > 1 ? 's' : ''}`} target={i.target} code={i.html} note={i.summary}
                      status={fixState[wcagId(i)]} />
                  ))
            )}
            {tab === 'ds' && (
              ds.length === 0
                ? <Empty label="No DS scan issues on this page." />
                : ds.map((i: DsIssue, k: number) => {
                    const m = DS_RULE_META[i.rule];
                    return (
                      <Row key={k} color="var(--chart-4, #b45309)" tag={i.rule} title={i.detail} target={i.target}
                        component={m ? `${m.component} · ${m.ds}` : undefined} note={m?.suggestion}
                        status={fixState[dsId(i)]} />
                    );
                  })
            )}
            <p style={{ fontSize: 10.5, color: 'var(--muted-foreground)', marginTop: 4, lineHeight: 1.45 }}>
              DS tab is a fast static scan — for full conformance run the ds-conformance-reviewer agent (diffs against localhost:4000).
            </p>
          </div>
        </div>
      )}

      {/* Collapsed badge — drag to move, click to open */}
      <button
        onPointerDown={startDrag}
        onClick={() => { if (dragRef.current?.moved) return; setOpen((o: boolean) => !o); }}
        title="Live review — drag to move, click to open"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          height: 34, paddingInline: 12, borderRadius: 999,
          background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e5e5)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.16)', cursor: 'grab', touchAction: 'none',
          fontSize: 12, fontWeight: 600, color: 'var(--foreground, #111)',
        }}
      >
        <Dot color={fixing ? 'var(--brand-color)' : running ? 'var(--muted-foreground)' : allClear ? '#16a34a' : a11ySerious > 0 ? 'var(--destructive)' : 'var(--chart-4, #b45309)'} />
        <span>A11y {a11yTotal}</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span>DS {dsTotal}</span>
        {fixing && <span style={{ color: 'var(--brand-color)' }}>· fixing {doneN}/{fixTotal}</span>}
      </button>
    </div>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 7,
    border: '1px solid ' + (active ? 'var(--border)' : 'transparent'),
    background: active ? 'var(--muted)' : 'transparent',
    color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
    cursor: 'pointer',
  };
}

const iconBtnStyle: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent',
  color: 'var(--muted-foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function Dot({ color }: { color: string }) {
  return <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />;
}

function Empty({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 4px', color: 'var(--muted-foreground)', fontSize: 12 }}>
      <span style={{ color: '#16a34a' }}>✓</span> {label}
    </div>
  );
}

function FixChip({ status }: { status: FixState }) {
  const map: Record<FixPhase, { label: string; color: string; bg: string }> = {
    locating: { label: 'locating…', color: 'var(--muted-foreground)', bg: 'var(--muted)' },
    fixing:   { label: 'Sonnet fixing…', color: 'var(--brand-color)', bg: 'color-mix(in srgb, var(--brand-color) 12%, transparent)' },
    fixed:    { label: 'fixed ✓', color: '#15803d', bg: 'color-mix(in srgb, #16a34a 14%, transparent)' },
    failed:   { label: 'failed', color: 'var(--destructive)', bg: 'color-mix(in srgb, var(--destructive) 12%, transparent)' },
    skipped:  { label: 'already ok', color: 'var(--muted-foreground)', bg: 'var(--muted)' },
  };
  const m = map[status.phase];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}

function Row({ color, tag, title, meta, target, code, component, note, status }: {
  color: string; tag: string; title: string; meta?: string; target: string;
  code?: string; component?: string; note?: string; status?: FixState;
}) {
  return (
    <div style={{ borderLeft: `2.5px solid ${color}`, paddingLeft: 9, paddingBlock: 4 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color }}>{tag}</span>
        {meta && <span style={{ fontSize: 10.5, color: 'var(--muted-foreground)' }}>{meta}</span>}
        {status && <span style={{ marginLeft: 'auto' }}><FixChip status={status} /></span>}
      </div>
      <p style={{ fontSize: 12, color: 'var(--foreground)', margin: '1px 0 3px', lineHeight: 1.4 }}>{title}</p>

      {/* DS: which component, from which DS */}
      {component && (
        <p style={{ fontSize: 11, margin: '0 0 3px', color: 'var(--foreground)' }}>
          <i className="fa-light fa-cube fa-fw" aria-hidden="true" style={{ color: 'var(--brand-color)', marginInlineEnd: 4 }} />
          {component}
        </p>
      )}

      {/* WCAG: the offending code */}
      {code && (
        <pre style={{
          fontSize: 10.5, lineHeight: 1.4, margin: '0 0 3px', padding: '6px 8px', borderRadius: 6,
          background: 'var(--muted)', color: 'var(--foreground)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 84, overflow: 'auto',
        }}>{code}</pre>
      )}

      {/* fix guidance */}
      {note && (
        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: '0 0 3px', lineHeight: 1.45 }}>
          <i className="fa-light fa-wrench fa-fw" aria-hidden="true" style={{ marginInlineEnd: 4 }} />
          {note}
        </p>
      )}

      <code style={{ fontSize: 10.5, color: 'var(--muted-foreground)', wordBreak: 'break-all' }}>{target}</code>

      {/* Sonnet result */}
      {status?.phase === 'fixed' && (status.file || status.summary) && (
        <p style={{ fontSize: 11, color: '#15803d', margin: '3px 0 0', lineHeight: 1.4 }}>
          → {status.file ? <code style={{ fontSize: 10.5 }}>{status.file}</code> : null} {status.summary}
        </p>
      )}
      {status?.phase === 'skipped' && status.summary && (
        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: '3px 0 0', lineHeight: 1.4 }}>{status.summary}</p>
      )}
      {status?.phase === 'failed' && status.error && (
        <p style={{ fontSize: 11, color: 'var(--destructive)', margin: '3px 0 0', lineHeight: 1.4 }}>{status.error}</p>
      )}
    </div>
  );
}
