// Dev-only — tree-shaken in production
interface Entry { id: string; date: string; product: string; type: string; title: string; what: string; why: string; severity: string | null; files: string[] }

const ICONS: Record<string, string> = {
  'prd-change': '🔵', 'prd-flagged': '🟡', 'compliance-violation': '🔴',
  'compliance-resolved': '🟢', 'new-doc': '🟣', 'pattern-update': '🩵', 'claude-correction': '🟠',
}

async function fetchUpdates(product = 'exam-management', period = 'week', type = 'all'): Promise<Entry[]> {
  try {
    const res = await fetch(`/api/dev/updates?product=${product}&period=${period}&type=${type}`)
    return res.ok ? res.json() : []
  } catch { return [] }
}

async function showUpdates(productOrFilter = 'exam-management', period = 'week', type = 'all') {
  let p = productOrFilter, t = type, per = period
  if (['today', 'week', 'month', 'all'].includes(productOrFilter)) { p = 'exam-management'; per = productOrFilter }
  if (productOrFilter === 'corrections') { p = 'all'; t = 'claude-correction' }
  const entries = await fetchUpdates(p, per, t)
  if (!entries.length) { console.log('%c Exxat Updates — no entries', 'color:#64748b'); return }
  console.group(`%c Exxat Updates · Exam Management · ${per} (${entries.length})`, 'font-weight:bold;color:#6366f1')
  for (const e of entries) {
    const icon = ICONS[e.type] ?? '⚪'
    const sev = e.severity ? ` [${e.severity}]` : ''
    console.log(`${icon} ${e.type.toUpperCase()}${sev} · ${e.date}\n  Title: ${e.title}\n  What:  ${e.what}\n  Why:   ${e.why}${e.files.length ? `\n  Files: ${e.files.map((f: string) => f.split('/').pop()).join(', ')}` : ''}\n${'─'.repeat(60)}`)
  }
  console.groupEnd()
}

export function initDevUpdates() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return
  ;(window as unknown as Record<string, unknown>).__updates = showUpdates
  fetchUpdates('exam-management', 'today').then(todayEntries => {
    const urgent = todayEntries.filter(e => e.severity === 'P1' || e.type === 'prd-change')
    if (urgent.length > 0) {
      console.log(`%c 🔔 Exxat · ${urgent.length} update${urgent.length > 1 ? 's' : ''} today  →  __updates() to browse`, 'color:#6366f1;font-weight:bold')
    }
  })
}
