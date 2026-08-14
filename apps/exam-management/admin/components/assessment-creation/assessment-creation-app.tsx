'use client'

/* Assessment Creation host — owns shared assessment state (meta + sections),
   inline notifications, the Leo assistant, and the student-preview overlay, then
   routes between List / Wizard / Builder / Review / Status. Faithful port of the
   Claude Design app.jsx root (the prototype's Sidebar/Topbar/TweaksPanel are
   dropped — this renders inside the product app shell). */

import { useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@exxatdesignux/ui'
import { AppCtx, NotifyBanner, type Note, type NoteTone, type LeoCtx } from './primitives'
import {
  SECTIONS, ASSESSMENTS, sectionsForAssessment,
  type Section, type BuilderMeta, type Assessment, type Question, type LifecycleState,
} from './data'
import { AssessmentBuilder } from './assessment-builder'
import { AssessmentsLanding } from './screens/assessments-landing'
import { BlueprintWizard } from './screens/wizard'
import { DistributeTab } from './screens/distribute-tab'
import { StatsTab } from './screens/stats-tab'
import { LeoPanel } from './screens/leo-panel'
import { PreviewSim } from './builder/preview-sim'

type Screen = 'list' | 'wizard' | 'detail'
type DetailTab = 'edit' | 'review' | 'distribute' | 'stats'

const SEED_META: BuilderMeta = {
  id: 'a1', name: 'Cardiovascular Pharmacology — Midterm', course: 'MED-201', type: 'Exam', graded: true,
  intent: 'Evaluate foundational knowledge of cardiovascular pharmacology across antihypertensives, antiarrhythmics, heart-failure, and anticoagulation therapy.',
  audience: 'Year 2 · Doctor of Medicine', owner: 'schen', collaborators: ['okafor', 'nair', 'ta'],
  security: 'Secure', state: 'draft',
}

const cloneSections = () => JSON.parse(JSON.stringify(SECTIONS)) as Section[]

// Map a product assessment status → this flow's lifecycle state.
function mapStatus(status: string | null): LifecycleState {
  switch ((status || '').toLowerCase()) {
    case 'draft': return 'draft'
    case 'published': return 'completed'   // delivered → results view
    case 'upcoming': return 'ready'         // scheduled & sealed
    case 'in review': case 'review': return 'review'
    case 'completed': return 'completed'
    case 'archived': return 'archived'
    default: return 'draft'
  }
}
function defaultCount(type: string | null): number {
  switch ((type || '').toLowerCase()) {
    case 'quiz': return 10
    case 'practical': return 12
    case 'project': return 0
    default: return 28 // Exam / other
  }
}
function screenForState(_state: LifecycleState): Screen {
  return 'detail'
}
function tabForState(state: LifecycleState): DetailTab {
  if (state === 'ready' || state === 'completed' || state === 'archived') return 'stats'
  return 'edit'
}

export function AssessmentCreationApp() {
  // Entry points from the course area pass query params:
  //   new=1                → start in the Blueprint Wizard (create)
  //   view=review          → open Review & Publish
  //   view=monitor|analytics → open the Status screen (delivered results)
  // (Bridging product assessment ids into this flow's data is a follow-up.)
  const params = useSearchParams()
  const router = useRouter()
  // "All assessments" returns to wherever the user entered from (the course
  // offering's Assessments tab — the single landing), not a duplicate in-app list.
  const backToList = () => router.back()

  // Resolve the screen + assessment data from the entry params, once on mount:
  //   new=1                          → Blueprint Wizard
  //   id=… (+ title/type/status/…)   → that assessment, routed by status
  //   view=review|monitor|analytics  → deep-link from the action-items panel
  const initial = useMemo(() => {
    const wantNew = params?.get('new') === '1'
    const id = params?.get('id') ?? null
    const view = params?.get('view') ?? null
    if (wantNew) return { screen: 'wizard' as Screen, meta: SEED_META, sections: cloneSections() }
    if (id) {
      // Landing rows carry real flow ids (a1…a7) → open the actual assessment.
      const found = ASSESSMENTS.find(a => a.id === id)
      if (found) {
        const m: BuilderMeta = {
          id: found.id, name: found.name, course: found.course, type: found.type, graded: found.graded,
          owner: found.owner, collaborators: found.collaborators, security: found.security, state: found.state,
          intent: '', audience: 'Year 2 · Doctor of Medicine',
        }
        return { screen: screenForState(found.state), meta: m, sections: sectionsForAssessment(found) }
      }
      // Fallback: synthesize from params (e.g. action-items deep links with product ids).
      const title = params?.get('title') ?? 'Assessment'
      const type = (params?.get('type') as Assessment['type']) || 'Exam'
      const status = params?.get('status') ?? null
      const course = params?.get('course') || 'MED-201'
      const state = mapStatus(status)
      const safeId = id ?? 'unknown'
      const synthetic: Assessment = {
        id: safeId, name: title, course, type, state, questions: defaultCount(params?.get('type') ?? null),
        points: 100, owner: 'schen', collaborators: ['okafor', 'nair'], due: '10/24/2026 09:00 AM EST',
        updated: 'now', security: 'Secure', graded: true,
      }
      const m: BuilderMeta = {
        id: safeId, name: title, course, type, graded: true, owner: 'schen', collaborators: ['okafor', 'nair'],
        security: 'Secure', state, intent: '', audience: 'Year 2 · Doctor of Medicine',
      }
      const secs = sectionsForAssessment(synthetic)
      return { screen: 'detail' as Screen, meta: m, sections: secs.length ? secs : cloneSections() }
    }
    if (view === 'review') return { screen: 'detail' as Screen, meta: SEED_META, sections: cloneSections() }
    if (view) return { screen: 'detail' as Screen, meta: { ...SEED_META, state: 'completed' as LifecycleState }, sections: cloneSections() }
    return { screen: 'list' as Screen, meta: SEED_META, sections: cloneSections() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [screen, setScreen] = useState<Screen>(initial.screen)
  const [assessmentTab, setAssessmentTab] = useState<DetailTab>(() => {
    const view = params?.get('view')
    if (view === 'monitor' || view === 'analytics') return 'stats'
    return tabForState(initial.meta.state)
  })
  const [persona] = useState('coordinator')
  const [meta, setMeta] = useState<BuilderMeta>(initial.meta)
  const [sections, setSections] = useState<Section[]>(initial.sections)
  const [autoAI, setAutoAI] = useState(false)

  const [note, setNote] = useState<Note | null>(null)
  const notify = (msg: string, tone: NoteTone = 'success') => setNote({ msg, tone, k: Date.now() })

  const [leo, setLeo] = useState<{ open: boolean; ctx: LeoCtx | null }>({ open: false, ctx: null })
  const openLeo = (ctx?: LeoCtx) => setLeo({ open: true, ctx: ctx || {} })
  const closeLeo = () => setLeo(l => ({ ...l, open: false }))
  const [smartTarget, setSmartTarget] = useState<{ q: Question } | null>(null)
  const [preview, setPreview] = useState<{ sections: Section[]; meta: BuilderMeta } | null>(null)

  function openAssessment(a: Assessment) {
    setMeta({ id: a.id, name: a.name, course: a.course, type: a.type, graded: a.graded, owner: a.owner, collaborators: a.collaborators || [], security: a.security, state: a.state, intent: '', audience: 'Year 2 · Doctor of Medicine' })
    setSections(sectionsForAssessment(a))
    setAutoAI(false)
    setAssessmentTab(tabForState(a.state))
    setScreen('detail')
  }

  function statusAction(kind: 'preview' | 'unpublish' | 'restore' | 'recycle') {
    if (kind === 'preview') { setPreview({ sections, meta }); return }
    if (kind === 'unpublish') { setMeta(m => ({ ...m, state: 'draft' })); setAssessmentTab('edit'); notify('Unpublished — now editable as a Draft', 'warn'); return }
    if (kind === 'restore') { setMeta(m => ({ ...m, state: 'draft' })); setAssessmentTab('edit'); notify('Restored to an editable Draft copy', 'info'); return }
    if (kind === 'recycle') {
      const newId = 'new' + Date.now()
      setMeta(m => ({ ...m, id: newId, name: m.name.replace(/\s*\((Fall|Spring|Summer).*?\)\s*$/, '') + ' — new draft', state: 'draft' }))
      setSections(prev => prev.map(s => ({ ...s, reviewStatus: 'in-progress', questions: s.questions.map(q => ({ ...q, flagged: null })) })))
      setAssessmentTab('edit'); notify('Blueprint ingested — every section is now an editable draft')
    }
  }

  function finishWizard(data: Partial<BuilderMeta>, pathway: string) {
    const newId = 'new' + Date.now()
    setMeta(m => ({ ...m, ...data, id: newId, state: 'draft' }))
    if (pathway === 'scratch') setSections(() => [{ id: 's' + Date.now(), name: 'Section A', owner: data.owner || 'schen', reviewStatus: 'in-progress', timeLimit: 30, preRead: false, questions: [] }])
    else if (pathway === 'ai') { setSections(() => [{ id: 's' + Date.now(), name: 'Section A — AI drafted', owner: data.owner || 'schen', reviewStatus: 'in-progress', timeLimit: 30, preRead: false, questions: [] }]); setAutoAI(true) }
    else setSections(() => JSON.parse(JSON.stringify(SECTIONS)) as Section[])
    setAssessmentTab('edit')
    setScreen('detail')
    notify(pathway === 'recycle' ? 'Blueprint ingested — customize freely' : 'Assessment created')
  }

  const ctx = useMemo(() => ({ notify, openLeo, persona }), [persona])

  return (
    <AppCtx.Provider value={ctx}>
      <div className="exam-creation">
        <h1 className="sr-only">Assessment Builder</h1>
        {screen === 'list' && <div className="p-6"><AssessmentsLanding onCreate={() => setScreen('wizard')} onOpen={openAssessment} /></div>}
        {screen === 'wizard' && <BlueprintWizard onCancel={backToList} onFinish={finishWizard} />}
        {screen === 'detail' && (
          <Tabs
            value={assessmentTab}
            onValueChange={v => setAssessmentTab(v as DetailTab)}
            className="flex flex-col"
          >
            {/* outer lifecycle tab bar */}
            <div className="flex items-center border-b px-4 h-12 shrink-0">
              <Button type="button" variant="ghost" size="sm" onClick={backToList} className="mr-3 shrink-0 text-muted-foreground">
                <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
                All assessments
              </Button>
              <div className="h-4 w-px bg-border mx-1 shrink-0" aria-hidden="true" />
              <TabsList aria-label="Assessment lifecycle" className="bg-transparent border-0 h-12 gap-0 rounded-none p-0 ml-1">
                <TabsTrigger value="edit" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4">
                  Edit
                </TabsTrigger>
                <TabsTrigger value="review" disabled className="h-12 rounded-none px-4 opacity-50 cursor-not-allowed">
                  Review
                  <Badge variant="secondary" className="ml-1.5 py-0 px-1.5">Phase 2</Badge>
                </TabsTrigger>
                <TabsTrigger value="distribute" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4">
                  Distribute
                </TabsTrigger>
                <TabsTrigger value="stats" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4">
                  Stats
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="edit" className="mt-0 flex-1 min-h-0">
              <AssessmentBuilder
                meta={meta} setMeta={setMeta} sections={sections} setSections={setSections}
                persona={persona} autoAI={autoAI} clearAutoAI={() => setAutoAI(false)}
                smartTarget={smartTarget} clearSmartTarget={() => setSmartTarget(null)}
                embedded
                onBack={backToList}
                onReview={() => setAssessmentTab('distribute')}
              />
            </TabsContent>

            <TabsContent value="review" className="mt-0 p-8">
              <div className="max-w-md">
                <p className="text-sm font-semibold text-foreground mb-1">Review &amp; approval — Phase 2</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Formal review workflows, multi-reviewer sign-off, and section-level delegation are planned for Phase 2.
                  You can publish directly from the Distribute tab.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => setAssessmentTab('distribute')}>
                  <i className="fa-light fa-share" aria-hidden="true" />
                  Go to Distribute
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="distribute" className="mt-0 flex-1 min-h-0">
              <DistributeTab meta={meta} setMeta={setMeta} sections={sections} persona={persona}
                onBack={() => setAssessmentTab('edit')} onList={backToList} />
            </TabsContent>

            <TabsContent value="stats" className="mt-0 flex-1 min-h-0">
              <StatsTab meta={meta} sections={sections} persona={persona}
                onBack={backToList} onList={backToList}
                onBuilder={() => setAssessmentTab('edit')} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <NotifyBanner note={note} onClose={() => setNote(null)} />
      {preview && <PreviewSim sections={preview.sections} meta={preview.meta} onClose={() => setPreview(null)} />}
      <LeoPanel
        open={leo.open}
        ctx={leo.ctx}
        sections={sections}
        onClose={closeLeo}
        onReplace={(q: Question) => { closeLeo(); if (screen === 'detail' && assessmentTab === 'edit') setSmartTarget({ q }); else notify('Switch to Edit to apply replacements', 'info') }}
      />
    </AppCtx.Provider>
  )
}
