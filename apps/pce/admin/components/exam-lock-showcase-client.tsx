"use client"

/**
 * Design OS — Exam lock template showcase.
 * One question at a time, header tools, settings popover, demo overlays.
 */

import * as React from "react"

import {
  ExamLockAnswerProgress,
  ExamLockHeaderToolbar,
  ExamLockInterruptionPanel,
  ExamLockQuestionBody,
  ExamLockQuestionNav,
  ExamLockQuestionRenderer,
  ExamLockResumeAuthDialog,
  ExamLockTimerDisplay,
  EXAM_LOCK_DEMO_CLINICAL_FIGURE,
  isExamLockQuestionAnswered,
  useExamLockColorMode,
  useExamLockSessionController,
  type ExamLockAnswerValue,
  type ExamLockDeliveryQuestion,
} from "@/components/exam-lock"
import { ExamLockTemplate } from "@/components/templates/exam-lock-template"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Shortcut } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { NAV_USER } from "@/lib/mock/navigation"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router"

const EXAM_TITLE = "Clinical reasoning sample exam"
const INITIAL_SECONDS = 45 * 60

const MOCK_QUESTION_DEFS = [
  {
    type: "mcq_single",
    questionId: "q1",
    stem: "Review the monitor strip, then select the priority assessment before pharmacologic intervention for acute shortness of breath with bilateral crackles.",
    stemMedia: EXAM_LOCK_DEMO_CLINICAL_FIGURE,
    options: [
      "Obtain a 12-lead ECG",
      "Auscultate posterior lung fields",
      "Measure oxygen saturation and apply supplemental O₂ if indicated",
      "Order a chest X-ray",
    ],
  },
  {
    type: "true_false",
    questionId: "q2",
    stem: "Jugular venous distension with peripheral edema supports prioritizing fluid restriction in heart failure exacerbation.",
  },
  {
    type: "fill_blank",
    questionId: "q3",
    stem: "Before administering a new medication, the nurse performs the {{blank}} check to reduce the risk of {{blank}}.",
    formatHint: "Use clinical terms. One or two words per blank.",
  },
  {
    type: "essay",
    questionId: "q4",
    stem: "Describe your nursing priorities in the first 10 minutes of care for a patient with acute shortness of breath and bilateral crackles.",
    maxCharacters: 2000,
    formatHint: "Write in complete sentences. Address assessment, safety, and communication.",
  },
] as const

function mockQuestionAt(index: number): ExamLockDeliveryQuestion {
  const def = MOCK_QUESTION_DEFS[index]!
  return { ...def, questionNumber: index + 1 } as ExamLockDeliveryQuestion
}

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
] as const

const CALCULATOR_TOP_ROW = ["C", "÷", "×", "⌫"] as const
const CALCULATOR_ROWS = [
  ["7", "8", "9", "−"],
  ["4", "5", "6", "+"],
  ["1", "2", "3", "="],
] as const

function ExamCalculator({ className }: { className?: string }) {
  const [display, setDisplay] = React.useState("0")
  const [pending, setPending] = React.useState<string | null>(null)
  const [operator, setOperator] = React.useState<string | null>(null)

  const appendDigit = (digit: string) => {
    setDisplay(prev => (prev === "0" ? digit : `${prev}${digit}`))
  }

  const clearAll = () => {
    setDisplay("0")
    setPending(null)
    setOperator(null)
  }

  const applyOperator = (op: string) => {
    setPending(display)
    setOperator(op)
    setDisplay("0")
  }

  const equals = () => {
    if (pending == null || operator == null) return
    const a = Number.parseFloat(pending)
    const b = Number.parseFloat(display)
    let result = 0
    switch (operator) {
      case "+":
        result = a + b
        break
      case "−":
        result = a - b
        break
      case "×":
        result = a * b
        break
      case "÷":
        result = b === 0 ? 0 : a / b
        break
      default:
        return
    }
    setDisplay(String(Number.isInteger(result) ? result : result.toFixed(2)))
    setPending(null)
    setOperator(null)
  }

  const onKey = (key: string) => {
    if (key === "C") {
      clearAll()
      return
    }
    if (key === "⌫") {
      setDisplay(prev => (prev.length <= 1 ? "0" : prev.slice(0, -1)))
      return
    }
    if (key === "=") {
      equals()
      return
    }
    if (["+", "−", "×", "÷"].includes(key)) {
      applyOperator(key)
      return
    }
    if (key === ".") {
      setDisplay(prev => (prev.includes(".") ? prev : `${prev}.`))
      return
    }
    appendDigit(key)
  }

  const topRow = CALCULATOR_TOP_ROW
  const rows = CALCULATOR_ROWS

  return (
    <div className={cn("space-y-3", className)}>
      <Card
        size="sm"
        className="bg-muted/30"
        aria-live="polite"
        aria-label={`Calculator display: ${display}`}
      >
        <CardContent className="text-right font-mono text-2xl tabular-nums text-foreground">
          {display}
        </CardContent>
      </Card>
      <div className="grid grid-cols-4 gap-2">
        {topRow.map(key => (
          <Button
            key={key}
            type="button"
            variant="secondary"
            className="h-11 font-mono tabular-nums"
            onClick={() => onKey(key)}
          >
            {key}
          </Button>
        ))}
        {rows.flat().map(key => (
          <Button
            key={`digit-${key}`}
            type="button"
            variant={["+", "−", "="].includes(key) ? "secondary" : "outline"}
            className="h-11 font-mono tabular-nums"
            onClick={() => onKey(key)}
          >
            {key}
          </Button>
        ))}
        <Button type="button" variant="outline" className="col-span-2 h-11 font-mono" onClick={() => onKey("0")}>
          0
        </Button>
        <Button type="button" variant="outline" className="h-11 font-mono" onClick={() => onKey(".")}>
          .
        </Button>
      </div>
    </div>
  )
}

export function ExamLockShowcaseClient() {
  const navigate = useNavigate()
  const { colorMode, setColorMode } = useExamLockColorMode()
  const [simulateOffline, setSimulateOffline] = React.useState(false)
  const [simulateBlur, setSimulateBlur] = React.useState(false)
  const [handRaised, setHandRaised] = React.useState(false)
  const [connectOpen, setConnectOpen] = React.useState(false)
  const [resumeAuthOpen, setResumeAuthOpen] = React.useState(false)
  const [exitConfirmOpen, setExitConfirmOpen] = React.useState(false)
  const [answers, setAnswers] = React.useState<Record<string, ExamLockAnswerValue>>({})
  const [questionIndex, setQuestionIndex] = React.useState(0)
  // The showcase never supplies a Submit action in `headerActions`, so the
  // post-submit screen stays out of reach here — the flag only exists to keep
  // the template's submitted branch wired.
  const [submitted] = React.useState(false)
  const [keyboardOpen, setKeyboardOpen] = React.useState(false)
  const [calculatorOpen, setCalculatorOpen] = React.useState(false)
  const [keyboardBuffer, setKeyboardBuffer] = React.useState("")
  const [eliminatedByQuestion, setEliminatedByQuestion] = React.useState<
    Record<string, string[]>
  >({})

  const questionCount = MOCK_QUESTION_DEFS.length
  const deliveryQuestion = React.useMemo(
    () => mockQuestionAt(questionIndex),
    [questionIndex],
  )
  const answeredCount = MOCK_QUESTION_DEFS.filter((item, index) =>
    isExamLockQuestionAnswered(mockQuestionAt(index), answers[item.questionId]),
  ).length
  const eliminatedOptions = eliminatedByQuestion[deliveryQuestion.questionId] ?? []
  const sessionActive = !submitted

  const session = useExamLockSessionController({
    initialSeconds: INITIAL_SECONDS,
    sessionActive,
    submitted,
    forceOffline: simulateOffline,
    forceVisibilityHidden: simulateBlur,
    handRaised,
    onRaiseHand: () => setHandRaised(true),
    onLowerHand: () => setHandRaised(false),
    onConnectWithPerson: () => setConnectOpen(true),
  })
  const resumeSession = session.resume

  const choiceQuestion =
    deliveryQuestion.type === "mcq_single" || deliveryQuestion.type === "true_false"

  const toggleEliminated = React.useCallback(
    (option: string) => {
      const qid = deliveryQuestion.questionId
      setEliminatedByQuestion(prev => {
        const current = prev[qid] ?? []
        const next = current.includes(option)
          ? current.filter(item => item !== option)
          : [...current, option]
        return { ...prev, [qid]: next }
      })
      const currentAnswer = answers[qid]
      if (typeof currentAnswer === "string" && currentAnswer === option) {
        setAnswers(prev => {
          const next = { ...prev }
          delete next[qid]
          return next
        })
      }
    },
    [answers, deliveryQuestion.questionId],
  )

  React.useEffect(() => {
    if (session.sessionPaused) {
      setKeyboardOpen(false)
      setCalculatorOpen(false)
    } else {
      setHandRaised(false)
      setConnectOpen(false)
      setResumeAuthOpen(false)
    }
  }, [session.sessionPaused])

  const goPrevious = React.useCallback(() => {
    setQuestionIndex(i => Math.max(0, i - 1))
  }, [])

  const goNext = React.useCallback(() => {
    setQuestionIndex(i => Math.min(questionCount - 1, i + 1))
  }, [questionCount])

  const appendKeyboardChar = React.useCallback((char: string) => {
    setKeyboardBuffer(prev => `${prev}${char}`)
  }, [])

  const requestResumeAuth = React.useCallback(() => {
    setResumeAuthOpen(true)
  }, [])

  const authorizeResume = React.useCallback(() => {
    setSimulateOffline(false)
    setSimulateBlur(false)
    resumeSession({ manual: true })
  }, [resumeSession])

  const exitExamLock = React.useCallback(() => {
    setExitConfirmOpen(false)
    navigate("/design-os/dashboard")
  }, [navigate])

  const interruptionProps = React.useMemo(() => {
    if (!session.interruptionProps) return null
    const props = session.interruptionProps
    if (!props.supportActions?.retry) return props
    return {
      ...props,
      supportActions: {
        ...props.supportActions,
        retry: {
          ...props.supportActions.retry,
          onClick: requestResumeAuth,
        },
      },
    }
  }, [requestResumeAuth, session.interruptionProps])

  return (
    <>
      <Shortcut keys="Alt+←" disabled={submitted || questionIndex === 0} onInvoke={goPrevious} />
      <Shortcut
        keys="Alt+→"
        disabled={submitted || questionIndex >= questionCount - 1}
        onInvoke={goNext}
      />

      <ExamLockTemplate
        title={EXAM_TITLE}
        sessionActive={sessionActive}
        submitted={submitted}
        timer={
          <ExamLockTimerDisplay
            secondsRemaining={session.state.secondsRemaining}
            paused={session.sessionPaused}
          />
        }
        sessionPaused={session.sessionPaused}
        interruption={
          interruptionProps ? <ExamLockInterruptionPanel {...interruptionProps} /> : null
        }
        progress={
          submitted || session.sessionPaused ? null : (
            <ExamLockAnswerProgress
              answered={answeredCount}
              total={questionCount}
              variant="card-top"
            />
          )
        }
        learner={{ name: NAV_USER.name, avatar: NAV_USER.avatar }}
        headerToolbar={
          submitted || session.sessionPaused ? null : (
            <ExamLockHeaderToolbar
              colorMode={colorMode}
              onColorModeChange={setColorMode}
              onKeyboardOpen={() => setKeyboardOpen(true)}
              onCalculatorOpen={() => setCalculatorOpen(true)}
              settingsContent={
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                      checked={simulateOffline}
                      onChange={(event) => setSimulateOffline(event.target.checked)}
                    />
                    <span>
                      <span className="font-medium text-foreground">Simulate technical pause</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Hard pauses the exam and freezes the timer until you continue.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                      checked={simulateBlur}
                      onChange={(event) => setSimulateBlur(event.target.checked)}
                    />
                    <span>
                      <span className="font-medium text-foreground">Simulate integrity pause</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Demo policy pause. Timer freezes until you continue.
                      </span>
                    </span>
                  </label>
                  <Separator />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setExitConfirmOpen(true)}
                  >
                    <i className="fa-light fa-arrow-right-from-bracket text-sm" aria-hidden="true" />
                    Exit exam lock
                  </Button>
                </div>
              }
            />
          )
        }
      >
        {!submitted ? (
          <ExamLockQuestionBody
            footer={
              <ExamLockQuestionNav
                onPrevious={goPrevious}
                onNext={goNext}
                disablePrevious={questionIndex === 0}
                disableNext={questionIndex >= questionCount - 1}
              />
            }
          >
            <ExamLockQuestionRenderer
              question={deliveryQuestion}
              value={answers[deliveryQuestion.questionId] ?? (deliveryQuestion.type === "fill_blank" ? {} : "")}
              eliminatedOptions={choiceQuestion ? eliminatedOptions : undefined}
              onToggleEliminated={choiceQuestion ? toggleEliminated : undefined}
              shortcutsDisabled={submitted || keyboardOpen || calculatorOpen || session.sessionPaused}
              onValueChange={value =>
                setAnswers(prev => {
                  const qid = deliveryQuestion.questionId
                  const empty =
                    value === "" ||
                    (typeof value === "object" &&
                      !Array.isArray(value) &&
                      Object.values(value).every(entry => !entry.trim()))
                  if (empty) {
                    const next = { ...prev }
                    delete next[qid]
                    return next
                  }
                  return { ...prev, [qid]: value }
                })
              }
            />
          </ExamLockQuestionBody>
        ) : null}
      </ExamLockTemplate>

      <Dialog open={keyboardOpen} onOpenChange={setKeyboardOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>On-screen keyboard</DialogTitle>
            <DialogDescription>
              Demo keyboard for lockdown delivery. Typed characters appear in the buffer below.
            </DialogDescription>
          </DialogHeader>
          <Card size="sm" className="min-h-10 bg-muted/20" aria-live="polite">
            <CardContent className="font-mono text-sm text-foreground">
              {keyboardBuffer || "None"}
            </CardContent>
          </Card>
          <div className="space-y-1.5">
            {KEYBOARD_ROWS.map(row => (
              <div key={row.join("-")} className="flex flex-wrap justify-center gap-1">
                {row.map(key => (
                  <Button
                    key={key}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-w-9 font-mono"
                    onClick={() => appendKeyboardChar(key)}
                  >
                    {key}
                  </Button>
                ))}
              </div>
            ))}
            <div className="flex justify-center gap-1 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-w-[12rem]"
                onClick={() => appendKeyboardChar(" ")}
              >
                Space
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setKeyboardBuffer(prev => prev.slice(0, -1))}
              >
                ⌫
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Get help from your program</DialogTitle>
            <DialogDescription>
              Your timer stays paused while a proctor assists you. In production, this opens live
              chat or a call with proctoring staff.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              A staff member will join you here. They can restore your session, note an incident
              report, or walk you through the troubleshooting steps on screen.
            </p>
            <p className="font-mono text-xs text-foreground">
              Reference <span className="text-muted-foreground">EXM-2048</span>
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setConnectOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={() => setConnectOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={calculatorOpen} onOpenChange={setCalculatorOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Calculator</DialogTitle>
            <DialogDescription>Basic calculator for numeric exam items (demo).</DialogDescription>
          </DialogHeader>
          <ExamCalculator />
        </DialogContent>
      </Dialog>

      <ExamLockResumeAuthDialog
        open={resumeAuthOpen}
        onOpenChange={setResumeAuthOpen}
        onAuthorized={authorizeResume}
      />

      <Dialog open={exitConfirmOpen} onOpenChange={setExitConfirmOpen}>
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Exit exam lock?</DialogTitle>
            <DialogDescription>
              You will leave this showcase and return to the Design OS dashboard. Your demo answers are not saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setExitConfirmOpen(false)}>
              Stay in exam
            </Button>
            <Button type="button" variant="destructive" onClick={exitExamLock}>
              Exit exam lock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
