'use client'

/* Shared non-visual primitives for the assessment-creation flow: the app
   context (inline notifications + Leo), the LocalBanner-style NotifyBanner, the
   Field label wrapper, and the Ask-Leo button. All visual primitives (Avatar,
   Toggle, Check, Meter, StatusChip) now come straight from @exxatdesignux/ui. */

import { createContext, useContext, useEffect, useId, isValidElement, cloneElement, Children, type CSSProperties, type ReactNode, type ReactElement } from 'react'
import { Button } from '@exxatdesignux/ui'
import { Icon, LeoStar } from './icons'

// ── App-wide context: inline notifications + Leo assistant ──
export interface LeoCtx { title?: string; sections?: unknown; intro?: string; suggestions?: string[] }
interface AppCtxValue {
  notify: (msg: string, tone?: NoteTone) => void
  openLeo: (ctx?: LeoCtx) => void
  persona: string
}
export const AppCtx = createContext<AppCtxValue>({ notify: () => {}, openLeo: () => {}, persona: 'coordinator' })
export function useApp() { return useContext(AppCtx) }

// ── Inline transient banner (LocalBanner — never a toast) ──
export type NoteTone = 'success' | 'info' | 'warn'
export interface Note { msg: string; tone: NoteTone; k: number }
const NOTE_TONES: Record<NoteTone, { bg: string; bd: string; fg: string; ic: string }> = {
  success: { bg: 'oklch(from var(--chart-2) l c h / 0.10)', bd: 'oklch(from var(--chart-2) l c h / 0.32)', fg: 'var(--chip-2)', ic: 'circle-check' },
  info:    { bg: 'oklch(from var(--chart-1) l c h / 0.08)', bd: 'oklch(from var(--chart-1) l c h / 0.28)', fg: 'var(--chip-1)', ic: 'circle-info' },
  warn:    { bg: 'oklch(from var(--chart-4) l c h / 0.12)', bd: 'oklch(from var(--chart-4) l c h / 0.34)', fg: 'var(--chip-4)', ic: 'triangle-exclamation' },
}
export function NotifyBanner({ note, onClose }: { note: Note | null; onClose: () => void }) {
  useEffect(() => {
    if (!note) return
    const tm = setTimeout(onClose, 3200)
    return () => clearTimeout(tm)
  }, [note, onClose])
  if (!note) return null
  const tn = NOTE_TONES[note.tone || 'success']
  return (
    <div role="status" aria-live="polite" style={{ position: 'fixed', top: 68, left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: tn.bg, border: `1px solid ${tn.bd}`, color: tn.fg, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 500, boxShadow: 'var(--shadow-md, 0 1px 3px oklch(0 0 0 / 0.1))' }}>
      <Icon name={tn.ic} style={{ fontSize: 15 }} />{note.msg}
      <Button variant="ghost" size="icon-xs" aria-label="Dismiss" onClick={onClose} style={{ color: 'inherit' }}><Icon name="xmark" style={{ fontSize: 12 }} /></Button>
    </div>
  )
}

// ── Field wrapper (label + a single control, programmatically associated) ──
export function Field({ label, req, opt, hint, children }: { label?: string; req?: boolean; opt?: boolean; hint?: string; children: ReactNode }) {
  const id = useId()
  const arr = Children.toArray(children)
  const only = arr.length === 1 && isValidElement(arr[0]) ? (arr[0] as ReactElement<{ id?: string; 'aria-label'?: string }>) : null
  const labelTag = only && typeof only.type === 'string' && ['input', 'select', 'textarea'].includes(only.type)
  const associated = labelTag && !only.props.id && !only.props['aria-label']
  const kids = associated ? cloneElement(only, { id }) : children
  return (
    <div className="field">
      {label && <label htmlFor={associated ? id : undefined}>{label}{req && <span className="req">*</span>}{opt && <span className="opt">· optional</span>}</label>}
      {kids}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

// ── Ask Leo button (DS ghost Button) ──
export function AskLeo({ label = 'Ask Leo', onClick, style }: { label?: string; onClick?: () => void; style?: CSSProperties }) {
  const { openLeo } = useApp()
  const handle = onClick || (() => openLeo({}))
  return (
    <Button variant="ghost" size="sm" onClick={handle} style={style}>
      <LeoStar style={{ fontSize: 13 }} />{label}
    </Button>
  )
}
