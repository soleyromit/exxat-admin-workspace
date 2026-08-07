"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Wizard,
  WizardContent,
  WizardFooter,
  WizardNav,
  WizardPanel,
  WizardProgress,
  WizardStepGuidance,
  WizardStepHeading,
  type WizardStep,
} from "@/components/ui/wizard"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { DS_DOC_BODY } from "@/lib/design-system/doc-typography"
import { cn } from "@/lib/utils"

const DEMO_STEPS: WizardStep[] = [
  { id: "student", label: "Student", description: "Who is rotating", icon: "fa-user-graduate" },
  { id: "site", label: "Site", description: "Placement location", icon: "fa-hospital" },
  { id: "review", label: "Review", description: "Confirm details", icon: "fa-clipboard-check" },
]

const MANY_STEPS: WizardStep[] = [
  { id: "s1", label: "Program", description: "Scope" },
  { id: "s2", label: "Student", description: "Learner" },
  { id: "s3", label: "Site", description: "Location" },
  { id: "s4", label: "Preceptor", description: "Supervisor" },
  { id: "s5", label: "Schedule", description: "Dates" },
  { id: "s6", label: "Compliance", description: "Clearance" },
  { id: "s7", label: "Documents", description: "Attachments" },
  { id: "s8", label: "Review", description: "Confirm" },
]

function WizardDemoBody({ title, stepId }: { title: string; stepId: string }) {
  return (
    <>
      <WizardStepHeading id={stepId}>{title}</WizardStepHeading>
      <Field orientation="vertical">
        <FieldLabel>{title}</FieldLabel>
        <Input placeholder="Example field" />
      </Field>
    </>
  )
}

function useStepState(max: number, initial = 0) {
  const [step, setStep] = React.useState(initial)
  return {
    step,
    setStep,
    back: () => setStep((s) => Math.max(0, s - 1)),
    next: () => setStep((s) => Math.min(max - 1, s + 1)),
    reset: () => setStep(0),
  }
}

export function WizardHorizontalNumberedPreview() {
  const { step, setStep, back, next, reset } = useStepState(DEMO_STEPS.length, 1)
  return (
    <Wizard
      steps={DEMO_STEPS}
      current={step}
      orientation="horizontal"
      variant="numbered"
      onStepClick={setStep}
    >
      <WizardProgress />
      <WizardNav />
      <WizardContent>
        {DEMO_STEPS.map((s, i) => (
          <WizardPanel key={s.id} step={i}>
            <WizardDemoBody title={`${s.label} details`} stepId={s.id} />
          </WizardPanel>
        ))}
      </WizardContent>
      <WizardFooter
        onBack={back}
        onNext={next}
        onSubmit={reset}
        submitLabel="Create placement"
      />
    </Wizard>
  )
}

export function WizardHorizontalIconsPreview() {
  const { step, back, next } = useStepState(DEMO_STEPS.length, 1)
  return (
    <Wizard steps={DEMO_STEPS} current={step} orientation="horizontal" variant="icons">
      <WizardProgress />
      <WizardNav />
      <WizardContent>
        <WizardPanel step={step}>
          <WizardDemoBody
            title={DEMO_STEPS[step]?.label ?? "Step"}
            stepId={DEMO_STEPS[step]?.id ?? "step"}
          />
        </WizardPanel>
      </WizardContent>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" disabled={step === 0} onClick={back}>
          Back
        </Button>
        <Button type="button" disabled={step >= DEMO_STEPS.length - 1} onClick={next}>
          Next
        </Button>
      </div>
    </Wizard>
  )
}

export function WizardHorizontalCompactPreview() {
  const { step, setStep } = useStepState(DEMO_STEPS.length, 1)
  return (
    <Wizard
      steps={DEMO_STEPS}
      current={step}
      orientation="horizontal"
      variant="compact"
      onStepClick={setStep}
    >
      <WizardProgress formatLabel={(c: number, t: number) => `Step ${c} of ${t}`} />
      <WizardNav />
      <WizardContent>
        <WizardPanel step={step}>
          <WizardDemoBody
            title={DEMO_STEPS[step]?.label ?? "Step"}
            stepId={DEMO_STEPS[step]?.id ?? "step"}
          />
        </WizardPanel>
      </WizardContent>
    </Wizard>
  )
}

export function WizardVerticalNumberedPreview() {
  const { step, setStep, back, next, reset } = useStepState(DEMO_STEPS.length, 1)
  return (
    <Wizard
      steps={DEMO_STEPS}
      current={step}
      orientation="vertical"
      variant="numbered"
      onStepClick={setStep}
      className="max-w-2xl"
    >
      <WizardNav className="lg:w-56 shrink-0" />
      <WizardContent>
        <WizardProgress className="mb-4" />
        <WizardPanel step={step}>
          <WizardDemoBody
            title={DEMO_STEPS[step]?.label ?? "Step"}
            stepId={DEMO_STEPS[step]?.id ?? "step"}
          />
        </WizardPanel>
        <WizardFooter onBack={back} onNext={next} onSubmit={reset} submitLabel="Submit" />
      </WizardContent>
    </Wizard>
  )
}

export function WizardVerticalIconsPreview() {
  const { step, back, next } = useStepState(DEMO_STEPS.length, 0)
  return (
    <Wizard
      steps={DEMO_STEPS}
      current={step}
      orientation="vertical"
      variant="icons"
      className="max-w-2xl"
    >
      <WizardNav className="lg:w-60 shrink-0" />
      <WizardContent>
        <WizardProgress className="mb-4" />
        <WizardPanel step={step}>
          <WizardDemoBody
            title={DEMO_STEPS[step]?.label ?? "Step"}
            stepId={DEMO_STEPS[step]?.id ?? "step"}
          />
        </WizardPanel>
        <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" disabled={step === 0} onClick={back}>
            Back
          </Button>
          <Button type="button" disabled={step >= DEMO_STEPS.length - 1} onClick={next}>
            Next
          </Button>
        </div>
      </WizardContent>
    </Wizard>
  )
}

export function WizardErrorStatePreview() {
  const stepsWithError = DEMO_STEPS.map((s, i) => ({
    ...s,
    error: i === 1,
  }))
  return (
    <Wizard steps={stepsWithError} current={1} variant="numbered">
      <WizardProgress />
      <WizardNav />
      <WizardContent>
        <WizardPanel step={1}>
          <WizardStepHeading id="site">Site</WizardStepHeading>
          <p className={DS_DOC_BODY}>Resolve validation errors before continuing.</p>
        </WizardPanel>
      </WizardContent>
    </Wizard>
  )
}

/** Edge-case stress test — overflow + guidance; not a product IA target. */
export function WizardManyStepsPreview() {
  const { step, setStep, back, next } = useStepState(MANY_STEPS.length, 3)
  return (
    <Wizard
      steps={MANY_STEPS}
      current={step}
      orientation="horizontal"
      variant="compact"
      onStepClick={setStep}
    >
      <WizardProgress />
      <WizardStepGuidance />
      <WizardNav />
      <WizardContent>
        <WizardPanel step={step}>
          <WizardDemoBody
            title={MANY_STEPS[step]?.label ?? "Step"}
            stepId={MANY_STEPS[step]?.id ?? "step"}
          />
        </WizardPanel>
      </WizardContent>
      <WizardFooter onBack={back} onNext={next} onSubmit={() => undefined} submitLabel="Finish" />
    </Wizard>
  )
}

/** All variants on one page for catalog / QA. */
export function WizardAllVariantsPreview() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <h3 className="mb-4 text-base font-semibold">Horizontal numbered</h3>
        <WizardHorizontalNumberedPreview />
      </section>
      <section>
        <h3 className="mb-4 text-base font-semibold">Horizontal icons</h3>
        <WizardHorizontalIconsPreview />
      </section>
      <section>
        <h3 className="mb-4 text-base font-semibold">Horizontal compact</h3>
        <WizardHorizontalCompactPreview />
      </section>
      <section>
        <h3 className="mb-4 text-base font-semibold">Vertical numbered</h3>
        <WizardVerticalNumberedPreview />
      </section>
      <section>
        <h3 className="mb-4 text-base font-semibold">Vertical icons</h3>
        <WizardVerticalIconsPreview />
      </section>
      <section>
        <h3 className="mb-4 text-base font-semibold">Error state</h3>
        <WizardErrorStatePreview />
      </section>
      <section>
        <h3 className="mb-4 text-base font-semibold">Edge case: overflow (8 steps)</h3>
        <p className={cn("mb-4", DS_DOC_BODY)}>
          Stress test for scroll arrows and guidance — do not ship eight top-level chapters in product.
        </p>
        <WizardManyStepsPreview />
      </section>
    </div>
  )
}
