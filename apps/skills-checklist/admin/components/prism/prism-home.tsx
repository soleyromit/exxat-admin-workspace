"use client"

/**
 * PRISM home: a static look-alike of the host product's start page (steps.exxat.com/dashboard) so the walkthrough starts where
 * a Prism admin starts. Only Skills checklist (under Competency Management in the drawer) navigates, to the Skill lists
 * screen; every other control is inert (aria-disabled, no href), so the demo cannot leave the walkthrough.
 * Spec: docs/build/contracts/PRISM-dashboard.md. Colours: ./prism.css.
 */
import * as React from "react"
import Link from "next/link"
import { Source_Sans_3 } from "next/font/google"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import "./prism.css"
import { BANNER, DASHBOARD_ROW, DRAWER_FOOTER, SECTIONS, TODAY_CHIP, USER, type PrismItem, type PrismSection } from "./prism-data"

const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400"], variable: "--prism-font" })

const noop = () => {}
const fa = (name: string, sharp?: boolean) => `fa-light ${sharp ? "fa-sharp " : ""}${name}`

/** A control that looks live but goes nowhere: aria-disabled and no navigation. */
function Inert({ className, children, label, current }: { className?: string; children: React.ReactNode; label?: string; current?: boolean }) {
  return <a role="link" aria-disabled="true" aria-current={current ? "page" : undefined} aria-label={label} className={className}>{children}</a>
}

function Pill({ kind }: { kind: NonNullable<PrismItem["badge"]> }) {
  if (kind === "leo") return <span className="prism-leo-pill"><span className="prism-leo-mark" aria-hidden="true" />Leo Powered</span>
  return <span className={`prism-pill prism-pill-${kind}`}>{kind === "new" ? "New" : "Beta"}</span>
}

function SectionCard({ s }: { s: PrismSection }) {
  return (
    <section className="prism-card" data-tone={s.tone} aria-labelledby={`prism-${s.id}`}>
      <div className="prism-card-head">
        <h2 id={`prism-${s.id}`}>{s.title}</h2>
        {s.id === "program" ? <span className="prism-date">{TODAY_CHIP}<i className="fa-light fa-calendar" aria-hidden="true" /></span> : null}
      </div>
      <div className="prism-card-body">
        {s.items.map((it) => (
          <div className="prism-row" key={it.id}>
            <div className="prism-row-top">
              <i className={fa(it.icon, it.sharp)} aria-hidden="true" />
              {it.href ? <Link href={it.href} className="prism-row-title">{it.label}</Link> : <Inert className="prism-row-title">{it.label}</Inert>}
              {it.badge ? <Pill kind={it.badge} /> : null}
            </div>
            <p className="prism-row-desc">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Drawer({ open, onClose, closeRef }: { open: boolean; onClose: () => void; closeRef: React.RefObject<HTMLButtonElement | null> }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.stopPropagation(); onClose(); return }
    if (e.key !== "Tab") return
    const f = [...(ref.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]") ?? [])]
    if (!f.length) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
  if (!open) return null
  return (
    <>
      <div className="prism-scrim" aria-hidden="true" onClick={onClose} />
      <div className="prism-drawer" role="dialog" aria-modal="true" aria-label="Navigation" ref={ref} onKeyDown={onKeyDown}>
        <div className="prism-drawer-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/prism/exxat-prism-logo.svg" alt="Exxat PRISM" />
          <Button ref={closeRef} type="button" variant="ghost" size="icon" aria-label="Close navigation" onClick={onClose}>
            <i className="fa-light fa-xmark" aria-hidden="true" />
          </Button>
        </div>
        <nav className="prism-nav" aria-label="Exxat PRISM">
          <ul>
            <li><Inert className="prism-nav-row" current><i className={fa(DASHBOARD_ROW.icon)} aria-hidden="true" />{DASHBOARD_ROW.label}</Inert></li>
          </ul>
          {SECTIONS.map((s) => (
            <ul key={s.id} className="prism-group" data-tone={s.tone} aria-label={s.title}>
              {s.items.map((it) => (
                <React.Fragment key={it.id}>
                  <li>
                    {it.href ? (
                      <Link href={it.href} className="prism-nav-row"><i className={fa(it.icon, it.sharp)} aria-hidden="true" />{it.label}</Link>
                    ) : (
                      <Inert className="prism-nav-row"><i className={fa(it.icon, it.sharp)} aria-hidden="true" />{it.label}</Inert>
                    )}
                  </li>
                </React.Fragment>
              ))}
            </ul>
          ))}
          <ul className="prism-group" data-tone="indigo">
            <li><Inert className="prism-nav-row"><i className={fa(DRAWER_FOOTER.icon)} aria-hidden="true" />{DRAWER_FOOTER.label}</Inert></li>
          </ul>
        </nav>
      </div>
    </>
  )
}

export function PrismHome() {
  const [open, setOpen] = React.useState(false)
  const burger = React.useRef<HTMLButtonElement>(null)
  const closeBtn = React.useRef<HTMLButtonElement>(null)
  const close = React.useCallback(() => { setOpen(false); burger.current?.focus() }, [])
  React.useEffect(() => { if (open) closeBtn.current?.focus() }, [open])
  return (
    <div className={`prism-root ${sourceSans.variable}`}>
      <a href="#prism-main" className="prism-skip">Skip to main content</a>
      <header className="prism-bar">
        <div className="prism-bar-left">
          <Button ref={burger} type="button" variant="ghost" size="icon" className="prism-ibtn prism-burger" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}>
            <i className="fa-light fa-bars" aria-hidden="true" />
          </Button>
          <h1 className="prism-title">Home Page</h1>
          <div className="prism-search" role="search">
            <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
            <input type="search" placeholder="Search" aria-label="Search" />
          </div>
        </div>
        <div className="prism-bar-right">
          <Button type="button" variant="ghost" size="icon" className="prism-ibtn prism-grid" aria-label="Apps" aria-disabled="true" onClick={noop}><i className="fa-light fa-grid" aria-hidden="true" /></Button>
          <Button type="button" variant="ghost" size="icon" className="prism-ibtn" aria-label="Notifications, new" aria-disabled="true" onClick={noop}>
            <i className="fa-light fa-bell" aria-hidden="true" /><span className="prism-bell-new" aria-hidden="true">New</span>
          </Button>
          <Button type="button" variant="ghost" size="icon" className="prism-ibtn prism-tasks" aria-label="Tasks" aria-disabled="true" onClick={noop}><i className="fa-regular fa-memo-circle-check" aria-hidden="true" /></Button>
          <Button type="button" variant="ghost" size="icon" className="prism-ibtn prism-help" aria-label="Help, 8 open" aria-disabled="true" onClick={noop}>
            <i className="fa-solid fa-circle-question" aria-hidden="true" style={{ fontSize: 24 }} /><span className="prism-count" aria-hidden="true">8</span>
          </Button>
          <Button type="button" variant="ghost" className="prism-fill prism-chat" aria-disabled="true" onClick={noop}><i className="fa-light fa-comments-alt" aria-hidden="true" />Chat</Button>
          <Button type="button" variant="ghost" className="prism-fill prism-leo-btn" aria-disabled="true" onClick={noop}><span className="prism-leo-mark" aria-hidden="true" />Ask Leo</Button>
          <Button type="button" variant="ghost" className="prism-user" aria-label={`${USER.name}, ${USER.org}. Account menu`} aria-disabled="true" onClick={noop}>
            <span className="prism-name">{USER.name}<span className="prism-org">{USER.org}</span></span>
            <i className="fa-light fa-angle-down" aria-hidden="true" />
          </Button>
        </div>
      </header>
      <Drawer open={open} onClose={close} closeRef={closeBtn} />
      <main id="prism-main" className="prism-scroll" inert={open} tabIndex={0} aria-label="Home">
        <div className="prism-banner-row">
          <div className="prism-banner">
            <div className="prism-banner-main">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/prism/exxat-one-logo.svg" alt="Exxat One" />
              <div className="prism-banner-text">
                <div className="prism-banner-title">{BANNER.title}<span className="prism-banner-new">New</span></div>
                <span>{BANNER.body}</span>
              </div>
            </div>
            <Inert className="prism-explore">{BANNER.cta}<i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" /></Inert>
          </div>
          <div className="prism-logo-tile">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/prism/exxat-prism-logo.svg" alt="Exxat PRISM" />
          </div>
        </div>
        <div className="prism-cards">{SECTIONS.map((s) => <SectionCard key={s.id} s={s} />)}</div>
      </main>
      <footer className="prism-foot">©2026 Exxat, Inc.</footer>
    </div>
  )
}
