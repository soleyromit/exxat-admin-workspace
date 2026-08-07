'use client'

// COMPARE ROUTE — shared harness (throwaway, same lifecycle as
// /compare/push-step2-simplify and its siblings — delete once a direction
// is picked).
//
// Scope: the TABLE-level structure (accordion rows, segmented filter,
// 6-column collapsed grid) is already shipped in the real wizard
// (courses-evaluatees/step-survey-instances.tsx). This round is narrower —
// what goes INSIDE one expanded row's detail panel, and what the collapsed
// row previews before you open it. Romit's critique of the shipped version
// (2026-08-04): whitespace in the expanded panel wasn't used well, no
// secondary actions were surfaced there, no switch-consequence preview, no
// creative layout for the evaluatees section, and the collapsed row shows
// nothing about which template/faculty are actually selected.
//
// ALL VARIANTS import from this file so the comparison is apples-to-apples —
// same 6 real offerings (2 Ready, 2 Gap, 1 Blocked/conflict, 1 with a second
// coexisting survey), same real engine (expandInstances/storyStatusOf), same
// interactive state. Only the ROW UI differs per variant.

import { useMemo, useState } from 'react'
import { usePce } from '@/components/pce/pce-state'
import {
  MOCK_COURSE_OFFERINGS, MOCK_PROGRAM_TERMS, deliveryModeOf,
  type CourseOffering, type PceSurvey, type PceTemplate,
} from '@/lib/pce-mock-data'
import { courseLabelOf, templateCriteria, CRITERION_BY_TYPE } from '@/lib/pce-course-readiness'
import {
  expandInstances, storyStatusOf,
  type SurveyInstance, type StoryStatus,
} from '@/lib/pce-push-validation'

export function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

export type BlockReason = 'no-template' | 'overlap' | 'no-units' | 'unstaffed' | 'none-selected'

export interface CourseGate {
  reasons: BlockReason[]
  fresh: SurveyInstance[]
  gaps: SurveyInstance[]
  dups: SurveyInstance[]
}

export interface DemoRow {
  offering: CourseOffering
  code: string
  name: string
  mode: ReturnType<typeof deliveryModeOf>
  template: PceTemplate | null
  gate: CourseGate
}

/** Six representative offerings covering every state a variant needs to
 *  demonstrate. Picked by scanning the real Fall 2026–2027 fixture rather
 *  than hardcoding ids that might drift — same defensive pattern the
 *  production step uses. */
const WANT_CODES = ['DPT-501', 'DPT-503', 'DPT-502', 'DPT-505', 'DPT-610', 'DPT-510']

function evaluateeLabel(i: SurveyInstance): string {
  const name = i.scope === 'course' ? 'Course material' : (i.personName ?? '')
  return i.roleLabel && i.scope !== 'course' ? `${name} · ${i.roleLabel}` : name
}
export { evaluateeLabel }

export function useStep2RowDetailDemo() {
  const { templates, surveys } = usePce()
  const publishedTemplates = useMemo(() => templates.filter(t => t.status === 'active'), [templates])
  const term = MOCK_PROGRAM_TERMS.find(t => t.season === 'Fall' && t.academicYear === '2026–2027')

  const offerings = useMemo(() => {
    const pool = MOCK_COURSE_OFFERINGS.filter(o => o.termId === term?.id)
    return WANT_CODES
      .map(code => pool.find(o => courseLabelOf(o).startsWith(code)))
      .filter((o): o is CourseOffering => !!o)
  }, [term?.id])

  const [templateAssignments, setTemplateAssignments] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {}
    for (const o of offerings) {
      const fit = publishedTemplates.find(t => !t.courseType || t.courseType === 'any' || t.courseType === o.courseType)
      if (fit) out[o.id] = fit.id
    }
    return out
  })
  const setTemplateFor = (offeringId: string, templateId: string) =>
    setTemplateAssignments(p => ({ ...p, [offeringId]: templateId }))

  const rows: DemoRow[] = useMemo(() => offerings.map(o => {
    const { code, name } = splitLabel(o)
    const mode = deliveryModeOf(o)
    const templateId = templateAssignments[o.id]
    const template = publishedTemplates.find(t => t.id === templateId) ?? null
    const instances = expandInstances(o, template, surveys, templates)
    const fresh = instances.filter(i => i.status === 'new')
    const gaps = instances.filter(i => i.status === 'gap')
    const dups = instances.filter(i => i.status === 'duplicate')
    const reasons: BlockReason[] = []
    if (!templateId) reasons.push('no-template')
    else if (dups.length > 0) reasons.push('overlap')
    return { offering: o, code, name, mode, template, gate: { reasons, fresh, gaps, dups } }
  }), [offerings, templateAssignments, publishedTemplates, surveys, templates])

  // Every 'fresh' unit starts included — matches the real wizard's
  // first-sight default. Lazy initializer runs once, reading `rows` as
  // computed on the very first render (offerings/templates are stable at
  // mount), rather than reaching for a setter-in-an-initializer hack.
  const [included, setIncluded] = useState<ReadonlySet<string>>(
    () => new Set(rows.flatMap(r => r.gate.fresh.map(i => i.key)))
  )
  const toggleUnit = (key: string) =>
    setIncluded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })

  return {
    rows,
    publishedTemplates,
    included,
    toggleUnit,
    setTemplateFor,
  }
}

export type { PceTemplate, CourseOffering, SurveyInstance, StoryStatus, PceSurvey }
export { storyStatusOf, templateCriteria, CRITERION_BY_TYPE }
