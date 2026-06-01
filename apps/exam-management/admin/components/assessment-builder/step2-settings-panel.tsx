'use client'

import { useState } from 'react'
import { Button, Input, Label, ToggleSwitch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@exxatdesignux/ui'
import type { AssessmentSettings } from '@/lib/qb-types'

interface Props {
  settings: AssessmentSettings
  onPatch: (patch: Partial<AssessmentSettings>) => void
  onClose: () => void
}

export function Step2SettingsPanel({ settings, onPatch, onClose }: Props) {
  const [addingRef, setAddingRef] = useState(false)
  const [refName, setRefName] = useState('')
  const [refUrl, setRefUrl] = useState('')

  const [addingPreRead, setAddingPreRead] = useState(false)
  const [preReadName, setPreReadName] = useState('')
  const [preReadUrl, setPreReadUrl] = useState('')

  function commitRef() {
    if (!refName.trim()) return
    onPatch({ referenceMaterials: [...settings.referenceMaterials, { name: refName.trim(), url: refUrl.trim() }] })
    setRefName('')
    setRefUrl('')
    setAddingRef(false)
  }

  function removeRef(index: number) {
    onPatch({ referenceMaterials: settings.referenceMaterials.filter((_, i) => i !== index) })
  }

  function commitPreRead() {
    if (!preReadName.trim()) return
    onPatch({ preReadDocuments: [...settings.preReadDocuments, { name: preReadName.trim(), url: preReadUrl.trim() }] })
    setPreReadName('')
    setPreReadUrl('')
    setAddingPreRead(false)
  }

  function removePreRead(index: number) {
    onPatch({ preReadDocuments: settings.preReadDocuments.filter((_, i) => i !== index) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Fixed header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          gap: 8,
        }}
      >
        {/* Left: back to Health button */}
        <button
          onClick={onClose}
          aria-label="Back to health panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: 4,
            color: 'var(--muted-foreground)',
            fontSize: 12,
          }}
        >
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Health
        </button>

        {/* Center: gear icon + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
          <i className="fa-light fa-gear" aria-hidden="true" style={{ fontSize: 13, color: 'var(--foreground)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Settings</span>
        </div>

        {/* Right: close button */}
        <button
          onClick={onClose}
          aria-label="Close settings panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: 4,
            color: 'var(--muted-foreground)',
            width: 24,
            height: 24,
          }}
        >
          <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 13 }} />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* 1. GRADING */}
        <Section label="Grading">
          <ToggleRow
            id="high-stakes"
            label="High-stakes exam"
            description="Results held until faculty review"
            checked={settings.isHighStakes}
            onCheckedChange={v => onPatch({ isHighStakes: Boolean(v) })}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Label htmlFor="passing-score" style={{ fontSize: 12, color: 'var(--foreground)', flex: 1, whiteSpace: 'nowrap' }}>
                Passing score threshold
              </Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Input
                  id="passing-score"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  aria-label="Passing score threshold percentage"
                  value={settings.passingScore ?? ''}
                  onChange={e => {
                    const v = parseInt(e.target.value)
                    onPatch({ passingScore: isNaN(v) ? null : Math.min(100, Math.max(0, v)) })
                  }}
                  style={{ width: 60, height: 28, padding: '0 8px', fontSize: 12, textAlign: 'center' }}
                />
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>%</span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
              Faculty-visible only — students never see pass/fail
            </p>
          </div>

          <ToggleRow
            id="allow-comments"
            label="Allow student comments"
            description="Per-question flag/comment box during exam"
            checked={settings.allowComments}
            onCheckedChange={v => onPatch({ allowComments: Boolean(v) })}
          />
        </Section>

        <Divider />

        {/* 2. NAVIGATION */}
        <Section label="Navigation">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Label style={{ fontSize: 12, color: 'var(--foreground)' }}>Question ordering</Label>
            <Select
              value={settings.randomize ? 'random' : 'fixed'}
              onValueChange={v => onPatch({ randomize: v === 'random' })}
            >
              <SelectTrigger style={{ height: 32, fontSize: 12 }} aria-label="Question ordering">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed — same order for all students</SelectItem>
                <SelectItem value="random">Random — shuffled per student</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ToggleRow
            id="backward-nav"
            label="Allow backward navigation"
            description="Students can return to previous questions within a section"
            checked={settings.backwardNavigationAllowed}
            onCheckedChange={v => onPatch({ backwardNavigationAllowed: Boolean(v) })}
          />

          <ToggleRow
            id="require-answer"
            label="Require answer before advancing"
            checked={settings.requireAnswer}
            onCheckedChange={v => onPatch({ requireAnswer: Boolean(v) })}
          />
        </Section>

        <Divider />

        {/* 3. SUBMIT BUTTON */}
        <Section label="Submit Button">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Label style={{ fontSize: 12, color: 'var(--foreground)' }}>Show submit when</Label>
            <Select
              value={settings.submitButtonVisibility}
              onValueChange={v => onPatch({ submitButtonVisibility: v as AssessmentSettings['submitButtonVisibility'] })}
            >
              <SelectTrigger style={{ height: 32, fontSize: 12 }} aria-label="Show submit button when">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">Always</SelectItem>
                <SelectItem value="after-viewing-all">After viewing all questions</SelectItem>
                <SelectItem value="after-answering-all">After answering all questions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Divider />

        {/* 4. SCORE DISPLAY */}
        <Section label="Score Display (post-exam)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Label style={{ fontSize: 12, color: 'var(--foreground)' }}>Show to student</Label>
            <Select
              value={settings.scoreDisplay}
              onValueChange={v => onPatch({ scoreDisplay: v as AssessmentSettings['scoreDisplay'] })}
            >
              <SelectTrigger style={{ height: 32, fontSize: 12 }} aria-label="Score display for student">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="raw">Raw score</SelectItem>
                <SelectItem value="raw-and-percent">Raw score + percentage</SelectItem>
                <SelectItem value="scaled">Scaled score</SelectItem>
              </SelectContent>
            </Select>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
              Pass/fail label is never shown to students.
            </p>
          </div>
        </Section>

        <Divider />

        {/* 5. POST-EXAM REVIEW */}
        <Section label="Post-Exam Review">
          <ToggleRow
            id="post-exam-review"
            label="Allow students to review answers"
            checked={settings.postExamReviewEnabled}
            onCheckedChange={v => onPatch({ postExamReviewEnabled: Boolean(v) })}
          />

          {settings.postExamReviewEnabled && (
            <ToggleRow
              id="review-shows-correct"
              label="Show correct answers in review"
              checked={settings.reviewShowsCorrectAnswers}
              onCheckedChange={v => onPatch({ reviewShowsCorrectAnswers: Boolean(v) })}
            />
          )}
        </Section>

        <Divider />

        {/* 6. WARNINGS */}
        <Section label="Warnings">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Label htmlFor="warning-alarm" style={{ fontSize: 12, color: 'var(--foreground)', flex: 1, whiteSpace: 'nowrap' }}>
                Warn student at
              </Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Input
                  id="warning-alarm"
                  type="number"
                  min={1}
                  step={1}
                  aria-label="Warning alarm minutes remaining"
                  value={settings.digitalTools.warningAlarmMinutes ?? ''}
                  onChange={e => {
                    const v = parseInt(e.target.value)
                    onPatch({
                      digitalTools: {
                        ...settings.digitalTools,
                        warningAlarmMinutes: isNaN(v) ? null : Math.max(1, v),
                      },
                    })
                  }}
                  style={{ width: 60, height: 28, padding: '0 8px', fontSize: 12, textAlign: 'center' }}
                />
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>min remaining</span>
              </div>
            </div>
          </div>

          <ToggleRow
            id="warn-blank"
            label="Warn on blank question"
            description="Warn when student leaves a question unanswered"
            checked={settings.warnOnBlankQuestion}
            onCheckedChange={v => onPatch({ warnOnBlankQuestion: Boolean(v) })}
          />
        </Section>

        <Divider />

        {/* 7. REFERENCE MATERIALS */}
        <Section label="Reference Materials">
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: -4 }}>
            Global PDFs available via toolbar during exam
          </p>

          {settings.referenceMaterials.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {settings.referenceMaterials.map((doc, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: 'var(--muted)',
                  }}
                >
                  <i className="fa-light fa-file-pdf" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--foreground)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.name || doc.url}
                  </span>
                  <button
                    onClick={() => removeRef(i)}
                    aria-label={`Remove ${doc.name || 'reference material'}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      borderRadius: 3,
                      color: 'var(--muted-foreground)',
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 12 }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {addingRef ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px', borderRadius: 6, border: '1px solid var(--border)' }}>
              <Input
                type="text"
                placeholder="Name"
                aria-label="Reference material name"
                value={refName}
                onChange={e => setRefName(e.target.value)}
                style={{ height: 28, fontSize: 12 }}
                autoFocus
              />
              <Input
                type="url"
                placeholder="URL"
                aria-label="Reference material URL"
                value={refUrl}
                onChange={e => setRefUrl(e.target.value)}
                style={{ height: 28, fontSize: 12 }}
              />
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Button variant="ghost" size="sm" onClick={() => { setAddingRef(false); setRefName(''); setRefUrl('') }} style={{ height: 26, fontSize: 12 }}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={commitRef} disabled={!refName.trim()} style={{ height: 26, fontSize: 12 }}>
                  Add
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddingRef(true)}
              style={{ height: 28, fontSize: 12, justifyContent: 'flex-start', paddingLeft: 4 }}
            >
              <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12, marginRight: 4 }} />
              Add PDF
            </Button>
          )}
        </Section>

        <Divider />

        {/* 8. PRE-READS */}
        <Section label="Pre-Reads (assessment level)">
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: -4 }}>
            Shown in exam toolbar as &lsquo;Pre-reads&rsquo; button
          </p>

          {settings.preReadDocuments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {settings.preReadDocuments.map((doc, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: 'var(--muted)',
                  }}
                >
                  <i className="fa-light fa-book-open" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--foreground)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.name || doc.url}
                  </span>
                  <button
                    onClick={() => removePreRead(i)}
                    aria-label={`Remove ${doc.name || 'pre-read document'}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      borderRadius: 3,
                      color: 'var(--muted-foreground)',
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 12 }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {addingPreRead ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px', borderRadius: 6, border: '1px solid var(--border)' }}>
              <Input
                type="text"
                placeholder="Name"
                aria-label="Pre-read document name"
                value={preReadName}
                onChange={e => setPreReadName(e.target.value)}
                style={{ height: 28, fontSize: 12 }}
                autoFocus
              />
              <Input
                type="url"
                placeholder="URL"
                aria-label="Pre-read document URL"
                value={preReadUrl}
                onChange={e => setPreReadUrl(e.target.value)}
                style={{ height: 28, fontSize: 12 }}
              />
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Button variant="ghost" size="sm" onClick={() => { setAddingPreRead(false); setPreReadName(''); setPreReadUrl('') }} style={{ height: 26, fontSize: 12 }}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={commitPreRead} disabled={!preReadName.trim()} style={{ height: 26, fontSize: 12 }}>
                  Add
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddingPreRead(true)}
              style={{ height: 28, fontSize: 12, justifyContent: 'flex-start', paddingLeft: 4 }}
            >
              <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12, marginRight: 4 }} />
              Add pre-read document
            </Button>
          )}
        </Section>

        {/* Bottom padding */}
        <div style={{ height: 24, flexShrink: 0 }} />
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--muted-foreground)',
          margin: 0,
        }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', flexShrink: 0 }} />
}

interface ToggleRowProps {
  id: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void  // maps to ToggleSwitch onChange
}

function ToggleRow({ id, label, description, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Label htmlFor={id} style={{ fontSize: 12, color: 'var(--foreground)', cursor: 'pointer', display: 'block' }}>
          {label}
        </Label>
        {description && (
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '2px 0 0', lineHeight: 1.4 }}>
            {description}
          </p>
        )}
      </div>
      <ToggleSwitch
        id={id}
        checked={checked}
        onChange={onCheckedChange}
      />
    </div>
  )
}
