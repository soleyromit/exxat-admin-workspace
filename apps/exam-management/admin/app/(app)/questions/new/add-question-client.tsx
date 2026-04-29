'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MOCK_QB_FOLDERS } from '@/lib/qb-mock-data'
import {
  Button, Input,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  RadioGroup, RadioGroupItem,
  Label,
} from '@exxat/ds/packages/ui/src'

type Step = 1 | 2 | 3

const STEPS = [
  { number: 1 as const, label: 'Question Details' },
  { number: 2 as const, label: 'Answer Options' },
  { number: 3 as const, label: 'Access & Tagging' },
]

function StepIndicator({ current }: { current: Step }) {
  return (
    <nav aria-label="Progress" className="flex items-center gap-4">
      {STEPS.map((step, index) => {
        const isCompleted = step.number < current
        const isCurrent = step.number === current
        return (
          <div key={step.number} className="flex items-center gap-4">
            {index > 0 && (
              <div
                className={`h-px w-12 ${isCompleted ? 'bg-primary' : 'bg-border'}`}
                aria-hidden="true"
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${isCompleted || isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <i className="fa-light fa-check text-xs" aria-hidden="true" />
                ) : (
                  step.number
                )}
              </div>
              <span className={`text-sm font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </nav>
  )
}

function Step1() {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="question-title" className="text-sm font-medium text-foreground">
          Question Title <span aria-hidden="true">*</span>
        </Label>
        <Input
          id="question-title"
          type="text"
          required
          placeholder="Enter your question..."
          className="mt-1 w-full"
        />
      </div>
      <div>
        <Label htmlFor="question-type" className="text-sm font-medium text-foreground">
          Question Type <span aria-hidden="true">*</span>
        </Label>
        <Select>
          <SelectTrigger id="question-type" className="mt-1 w-full">
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
            <SelectItem value="true-false">True / False</SelectItem>
            <SelectItem value="short-answer">Short Answer</SelectItem>
            <SelectItem value="essay">Essay</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function Step2() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add answer options. Mark the correct answer.
      </p>
      <RadioGroup name="correct-answer">
        {['A', 'B', 'C', 'D'].map((letter) => (
          <div key={letter} className="flex items-center gap-3">
            <RadioGroupItem value={letter} id={`option-${letter}`} aria-label={`Option ${letter} is correct`} />
            <Label htmlFor={`option-${letter}`} className="sr-only">Option {letter}</Label>
            <Input
              type="text"
              placeholder={`Option ${letter}`}
              className="flex-1"
              aria-label={`Text for option ${letter}`}
            />
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

function Step3({ preselectedFolderId }: { preselectedFolderId: string | null }) {
  const folder = preselectedFolderId ? MOCK_QB_FOLDERS.find(f => f.id === preselectedFolderId) : null

  function buildFolderPath(folderId: string): string {
    const parts: string[] = []
    let node = MOCK_QB_FOLDERS.find(f => f.id === folderId)
    while (node) {
      parts.unshift(node.name)
      node = node.parentId ? MOCK_QB_FOLDERS.find(f => f.id === node!.parentId) : undefined
    }
    return parts.join(' / ')
  }

  return (
    <div className="space-y-4">
      {/* Folder — pre-populated and locked when coming from QB */}
      <div>
        <Label className="text-sm font-medium text-foreground">
          Folder
        </Label>
        {folder ? (
          <div
            className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
          >
            <i className="fa-light fa-folder" aria-hidden="true" style={{ fontSize: 12, color: 'var(--brand-color)', flexShrink: 0 }} />
            <span className="flex-1">{buildFolderPath(folder.id)}</span>
            <span className="text-xs text-muted-foreground">Pre-selected</span>
          </div>
        ) : (
          <Select>
            <SelectTrigger id="question-folder" className="mt-1 w-full">
              <SelectValue placeholder="Select a folder..." />
            </SelectTrigger>
            <SelectContent>
              {MOCK_QB_FOLDERS.filter(f => !f.isCourse).map(f => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {folder && (
          <p className="mt-1 text-xs text-muted-foreground">
            This question will be added to the folder you were browsing. You can move it later.
          </p>
        )}
      </div>

      <div>
        <fieldset>
          <legend className="text-sm font-medium text-foreground">Access Scope</legend>
          <RadioGroup name="scope" defaultValue="private" className="mt-2 space-y-2">
            {[
              { value: 'private', label: 'Private — only visible to me' },
              { value: 'shared', label: 'Shared — visible to all faculty' },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem value={opt.value} id={`scope-${opt.value}`} />
                <Label htmlFor={`scope-${opt.value}`} className="text-sm text-foreground">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>
      </div>

      <div>
        <Label htmlFor="question-tags" className="text-sm font-medium text-foreground">
          Tags
        </Label>
        <Input
          id="question-tags"
          type="text"
          placeholder="e.g. diabetes, endocrinology (comma-separated)"
          className="mt-1 w-full"
        />
      </div>
    </div>
  )
}

function AddQuestionForm() {
  const [step, setStep] = useState<Step>(1)
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedFolderId = searchParams.get('folder')

  function goBack() {
    if (step > 1) setStep((s) => (s - 1) as Step)
    else router.push(preselectedFolderId ? `/question-bank?folder=${preselectedFolderId}` : '/question-bank')
  }

  function goForward() {
    if (step < 3) setStep((s) => (s + 1) as Step)
    else router.push(preselectedFolderId ? `/question-bank?folder=${preselectedFolderId}` : '/question-bank')
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 p-6">
        <div
          className="mx-auto max-w-2xl rounded-xl p-8"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="mb-8">
            <StepIndicator current={step} />
          </div>

          <div className="mb-8">
            {step === 1 && <Step1 />}
            {step === 2 && <Step2 />}
            {step === 3 && <Step3 preselectedFolderId={preselectedFolderId} />}
          </div>

          <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goBack}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={goForward}
            >
              {step === 3 ? 'Save Question' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AddQuestionClient() {
  return (
    <Suspense>
      <AddQuestionForm />
    </Suspense>
  )
}
