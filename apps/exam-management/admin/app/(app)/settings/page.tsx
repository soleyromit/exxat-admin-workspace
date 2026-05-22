'use client'

/**
 * Institution Settings — Aarti's "view-only access to all settings" requirement.
 *
 * Per Aarti's email:
 *   - Admin: full edit access
 *   - Faculty: view-only on all settings
 *
 * The most material setting today is the post-results CHAT CAPABILITY GATE,
 * which Aarti said must be configurable at the institution OR course level.
 * Everything else (default publication mode, branding, policies) is also
 * surfaced here so faculty can read what's been set.
 */

import * as React from 'react'
import { useState } from 'react'
import {
  Badge, Button,
  Card, CardHeader, CardContent,
  Label,
  Separator,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Tip,
} from '@exxat/ds/packages/ui/src'
import { QBToggle } from '@/components/qb/toggle'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { useFacultySession } from '@/lib/faculty-session'
import { useCommunicationPolicy } from '@/lib/communication-policy-store'

export default function SettingsPage() {
  const { role, hydrated } = useFacultySession()
  const isAdmin = role === 'admin'
  const isReadOnly = !isAdmin

  // Communication policy — institution-wide chat toggles, persisted via the
  // shared CommunicationPolicyProvider so course detail + assessment-taker
  // banner all see the same state.
  const {
    institutionAllowChat: chatInstitutionEnabled,
    setInstitutionAllowChat: setChatInstitutionEnabled,
    institutionDefault: chatDefault,
    setInstitutionDefault: setChatDefault,
  } = useCommunicationPolicy()

  // Other mock institution settings — local to settings until they need to cascade
  const [defaultPublication, setDefaultPublication] = useState<'immediate' | 'faculty-published'>('faculty-published')
  const [defaultReviewWindow, setDefaultReviewWindow] = useState('3')
  const [requireChairApproval, setRequireChairApproval] = useState(true)
  const [allowFacultyFolders, setAllowFacultyFolders] = useState(true)
  const [reviewSessionLockdown, setReviewSessionLockdown] = useState(true)
  const [allowComments, setAllowComments] = useState(true)

  if (!hydrated) {
    return (
      <>
        <SiteHeader title="Settings" />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </>
    )
  }

  return (
    <>
      <SiteHeader title="Settings" />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Institution Settings"
          subtitle={
            isReadOnly
              ? 'Read-only · contact your administrator to request changes'
              : 'Defaults apply to all courses unless overridden at the course or assessment level'
          }
          actions={
            isReadOnly ? (
              <Badge
                variant="secondary"
                className="rounded-full gap-1.5"
                style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                <i className="fa-light fa-eye" aria-hidden="true" style={{ fontSize: 11 }} />
                View only
              </Badge>
            ) : undefined
          }
        />

        <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
          <Tabs defaultValue="communication" className="w-full flex-col">
            <TabsList variant="line">
              <TabsTrigger value="communication">
                <i className="fa-light fa-comments me-1.5" aria-hidden="true" />
                Communication
              </TabsTrigger>
              <TabsTrigger value="assessments">
                <i className="fa-light fa-clipboard-list-check me-1.5" aria-hidden="true" />
                Assessment defaults
              </TabsTrigger>
              <TabsTrigger value="question-bank">
                <i className="fa-light fa-rectangle-list me-1.5" aria-hidden="true" />
                Question bank
              </TabsTrigger>
              <TabsTrigger value="branding">
                <i className="fa-light fa-palette me-1.5" aria-hidden="true" />
                Branding
              </TabsTrigger>
            </TabsList>

            {/* ─── Communication ─────────────────────────────────────────── */}
            <TabsContent value="communication" className="pt-5">
              <SettingGroup
                title="Post-results chat"
                description="When enabled, students can message faculty after results are published. Disabled across all courses by default — institutions can enable, then faculty can opt-in per assessment."
                differentiator="Configurable at institution and course level — direct communication is typically discouraged in academia, so this is off by default"
              >
                <SettingRow
                  label="Allow post-results chat at this institution"
                  hint="Master switch. When off, no course or assessment can enable chat."
                  readOnly={isReadOnly}
                >
                  <DisabledIf disabled={isReadOnly}>
                    <QBToggle
                      aria-label="Allow post-results chat at this institution"
                      checked={chatInstitutionEnabled}
                      onChange={setChatInstitutionEnabled}
                    />
                  </DisabledIf>
                </SettingRow>

                <SettingRow
                  label="Default behavior for new courses"
                  hint="Course directors can override per course."
                  readOnly={isReadOnly}
                  disabled={!chatInstitutionEnabled}
                >
                  <Select
                    value={chatDefault}
                    onValueChange={(v) => setChatDefault(v as 'on' | 'off')}
                    disabled={isReadOnly || !chatInstitutionEnabled}
                  >
                    <SelectTrigger className="w-[160px]" size="sm" aria-label="Chat default state">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off (recommended)</SelectItem>
                      <SelectItem value="on">On for all new courses</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
              </SettingGroup>

              <SettingGroup
                title="In-exam comments"
                description="Comment box that lets students flag suspect questions during an exam. Faculty review post-exam, never in real time."
              >
                <SettingRow
                  label="Allow comment box during exams (default)"
                  hint="Faculty can override per assessment."
                  readOnly={isReadOnly}
                >
                  <DisabledIf disabled={isReadOnly}>
                    <QBToggle
                      aria-label="Allow comment box during exams (default)"
                      checked={allowComments}
                      onChange={setAllowComments}
                    />
                  </DisabledIf>
                </SettingRow>
              </SettingGroup>
            </TabsContent>

            {/* ─── Assessment Defaults ──────────────────────────────────── */}
            <TabsContent value="assessments" className="pt-5">
              <SettingGroup
                title="Results publication"
                description="Default policy for how and when results become visible to students."
              >
                <SettingRow
                  label="Default publication mode"
                  hint="Faculty can override per assessment."
                  readOnly={isReadOnly}
                >
                  <Select
                    value={defaultPublication}
                    onValueChange={(v) => setDefaultPublication(v as typeof defaultPublication)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="w-[220px]" size="sm" aria-label="Default publication mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="faculty-published">Faculty-published</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>

                <SettingRow
                  label="Default chair-review window"
                  hint="Days faculty have to consult with chair before publishing."
                  readOnly={isReadOnly}
                >
                  <Select
                    value={defaultReviewWindow}
                    onValueChange={setDefaultReviewWindow}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="w-[140px]" size="sm" aria-label="Default chair-review window">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 days</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="4">4 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
              </SettingGroup>

              <SettingGroup
                title="Pre-publication review"
                description="Differentiator over ExamSoft — chair approves an assessment before students can take it."
                differentiator="Pre-publication chair approval is a high-value workflow ExamSoft does not offer"
              >
                <SettingRow
                  label="Require chair approval before publishing assessments"
                  readOnly={isReadOnly}
                >
                  <DisabledIf disabled={isReadOnly}>
                    <QBToggle
                      aria-label="Require chair approval before publishing assessments"
                      checked={requireChairApproval}
                      onChange={setRequireChairApproval}
                    />
                  </DisabledIf>
                </SettingRow>
              </SettingGroup>

              <SettingGroup
                title="Scheduled review sessions"
                description="Students log back in under lockdown to review the exam with correct answers and rationales — no copy or screenshot allowed."
              >
                <SettingRow
                  label="Lock down review sessions by default"
                  hint="Prevents copy / screenshot during the review window."
                  readOnly={isReadOnly}
                >
                  <DisabledIf disabled={isReadOnly}>
                    <QBToggle
                      aria-label="Lock down review sessions by default"
                      checked={reviewSessionLockdown}
                      onChange={setReviewSessionLockdown}
                    />
                  </DisabledIf>
                </SettingRow>
              </SettingGroup>
            </TabsContent>

            {/* ─── Question Bank ────────────────────────────────────────── */}
            <TabsContent value="question-bank" className="pt-5">
              <SettingGroup
                title="Folder organization"
                description="Admin-defined course shells provide structure. Faculty can create their own subfolders within their courses, but cannot create top-level folders."
              >
                <SettingRow
                  label="Allow faculty to create subfolders within their courses"
                  readOnly={isReadOnly}
                >
                  <DisabledIf disabled={isReadOnly}>
                    <QBToggle
                      aria-label="Allow faculty to create subfolders within their courses"
                      checked={allowFacultyFolders}
                      onChange={setAllowFacultyFolders}
                    />
                  </DisabledIf>
                </SettingRow>
              </SettingGroup>

              <SettingGroup
                title="Categories & tagging"
                description="Single tagging system across question bank — competencies, content areas, blooms, and standards all live in one model. No separate tags vs attributes vs categories."
              >
                <p className="text-xs text-muted-foreground italic">
                  Aarti&apos;s recommendation: simplify to one categorization route to avoid the &quot;tags vs attributes vs standards&quot; confusion that hurts adoption in Prism today.
                </p>
              </SettingGroup>
            </TabsContent>

            {/* ─── Branding ─────────────────────────────────────────────── */}
            <TabsContent value="branding" className="pt-5">
              <SettingGroup
                title="Institution branding"
                description="Shown on the student exam-taking surface and in faculty review sessions."
              >
                <SettingRow label="Institution name" readOnly={isReadOnly}>
                  <span className="text-sm text-muted-foreground">University of Demo Health Sciences</span>
                </SettingRow>
                <SettingRow label="Brand color" readOnly={isReadOnly}>
                  <div className="flex items-center gap-2">
                    <span
                      className="size-5 rounded-md border border-border shrink-0"
                      style={{ backgroundColor: 'var(--brand-color)' }}
                    />
                    <span className="text-sm text-muted-foreground font-mono">--brand-color</span>
                  </div>
                </SettingRow>
              </SettingGroup>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

function SettingGroup({
  title, description, differentiator, children,
}: {
  title: string
  description: string
  differentiator?: string
  children: React.ReactNode
}) {
  return (
    <Card className="mb-4 p-0">
      <CardHeader className="px-5 pt-5 pb-3 gap-1">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-[15px] font-semibold text-foreground leading-snug">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-snug max-w-2xl">
              {description}
            </p>
          </div>
          {differentiator && (
            <Tip label={differentiator}>
              <Badge
                variant="secondary"
                className="rounded-full gap-1.5 cursor-help"
                style={{
                  backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
                  color: 'var(--brand-color-dark)',
                }}
              >
                <i className="fa-duotone fa-solid fa-sparkles" aria-hidden="true" style={{ fontSize: 10 }} />
                Differentiator
              </Badge>
            </Tip>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="px-5 py-2 flex flex-col">
        {children}
      </CardContent>
    </Card>
  )
}

function DisabledIf({
  disabled, children,
}: {
  disabled: boolean
  children: React.ReactNode
}) {
  if (!disabled) return <>{children}</>
  return (
    <span style={{ opacity: 0.55, pointerEvents: 'none' }} aria-disabled="true">
      {children}
    </span>
  )
}

function SettingRow({
  label, hint, children, readOnly, disabled,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  readOnly?: boolean
  disabled?: boolean
}) {
  /* WCAG fix 2026-05-11: ToggleSwitch from DS doesn't forward aria-label
     (DS gap). Inject Label htmlFor → child id. Handles DisabledIf wrapper
     by recursing through one level. */
  const controlId = React.useId()
  function injectId(node: React.ReactNode): React.ReactNode {
    if (!React.isValidElement<{ id?: string; children?: React.ReactNode }>(node)) return node
    if (node.props.id) return node
    // If this element is a wrapper that passes children through (DisabledIf),
    // recurse into its children.
    const isWrapper = typeof node.type === 'function' && (node.type as { name?: string }).name === 'DisabledIf'
    if (isWrapper && node.props.children) {
      return React.cloneElement(node, { children: injectId(node.props.children) } as never)
    }
    return React.cloneElement(node, { id: controlId })
  }
  const labelledChild = injectId(children)
  return (
    <div
      className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-b-0"
      style={{ opacity: disabled ? 0.55 : 1 }}
    >
      <div className="flex-1 min-w-0">
        <Label htmlFor={controlId} className="text-sm font-medium text-foreground leading-tight">{label}</Label>
        {hint && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {hint}
            {readOnly && (
              <span className="ms-2 italic">· View only</span>
            )}
          </p>
        )}
      </div>
      <div className="shrink-0">{labelledChild}</div>
    </div>
  )
}
