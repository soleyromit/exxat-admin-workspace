'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MOCK_QB_FOLDERS } from '@/lib/qb-mock-data'

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
                className="h-px w-12"
                style={{ backgroundColor: isCompleted ? 'var(--primary)' : 'var(--border)' }}
                aria-hidden="true"
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
                style={{
                  backgroundColor: isCompleted || isCurrent ? 'var(--primary)' : 'var(--muted)',
                  color: isCompleted || isCurrent ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <i className="fa-light fa-check text-xs" aria-hidden="true" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: isCurrent ? 'var(--foreground)' : 'var(--muted-foreground)' }}
              >
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
        <label htmlFor="question-title" className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Question Title <span aria-hidden="true">*</span>
        </label>
        <input
          id="question-title"
          type="text"
          required
          placeholder="Enter your question..."
          className="mt-1 w-full rounded-md px-3 py-2 text-sm"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
        />
      </div>
      <div>
        <label htmlFor="question-type" className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Question Type <span aria-hidden="true">*</span>
        </label>
        <select
          id="question-type"
          className="mt-1 w-full rounded-md px-3 py-2 text-sm"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
        >
          <option value="">Select type...</option>
          <option value="mcq">Multiple Choice (MCQ)</option>
          <option value="true-false">True / False</option>
          <option value="short-answer">Short Answer</option>
          <option value="essay">Essay</option>
        </select>
      </div>
    </div>
  )
}

function Step2() {
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Add answer options. Mark the correct answer.
      </p>
      {['A', 'B', 'C', 'D'].map((letter) => (
        <div key={letter} className="flex items-center gap-3">
          <input type="radio" name="correct-answer" id={`option-${letter}`} value={letter} aria-label={`Option ${letter} is correct`} />
          <label htmlFor={`option-${letter}`} className="sr-only">Option {letter}</label>
          <input
            type="text"
            placeholder={`Option ${letter}`}
            className="flex-1 rounded-md px-3 py-2 text-sm"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            aria-label={`Text for option ${letter}`}
          />
        </div>
      ))}
    </div>
  )
}

function Step3({ preselectedFolderId }: { preselectedFolderId: string | null }) {
  const folder = preselectedFolderId ? MOCK_QB_FOLDERS.find(f => f.id === preselectedFolderId) : null

  // Build folder path label: "PHAR101 QB / Antibiotics / Gram-Positive"
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
        <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Folder
        </label>
        {folder ? (
          <div
            className="mt-1 flex items-center gap-2 rounded-md px-3 py-2"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', fontSize: 14 }}
          >
            <i className="fa-light fa-folder" aria-hidden="true" style={{ fontSize: 12, color: 'var(--brand-color)', flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{buildFolderPath(folder.id)}</span>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Pre-selected</span>
          </div>
        ) : (
          <select
            id="question-folder"
            className="mt-1 w-full rounded-md px-3 py-2 text-sm"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
          >
            <option value="">Select a folder...</option>
            {MOCK_QB_FOLDERS.filter(f => !f.isCourse).map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        )}
        {folder && (
          <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            This question will be added to the folder you were browsing. You can move it later.
          </p>
        )}
      </div>

      <div>
        <fieldset>
          <legend className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Access Scope</legend>
          <div className="mt-2 space-y-2">
            {[
              { value: 'private', label: 'Private — only visible to me' },
              { value: 'shared', label: 'Shared — visible to all faculty' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input type="radio" name="scope" value={opt.value} defaultChecked={opt.value === 'private'} />
                <span style={{ color: 'var(--foreground)' }}>{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div>
        <label htmlFor="question-tags" className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Tags
        </label>
        <input
          id="question-tags"
          type="text"
          placeholder="e.g. diabetes, endocrinology (comma-separated)"
          className="mt-1 w-full rounded-md px-3 py-2 text-sm"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
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
            <button
              type="button"
              onClick={goBack}
              className="rounded-md px-4 py-2 text-sm font-medium"
              style={{ border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--foreground)' }}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button
              type="button"
              onClick={goForward}
              className="rounded-md px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {step === 3 ? 'Save Question' : 'Continue'}
            </button>
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
