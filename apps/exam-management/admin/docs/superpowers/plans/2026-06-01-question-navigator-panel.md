# Question Navigator Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `QuestionJumpPopover` (upward popover from footer) with a right-side split panel that groups questions by status (Flagged / Unanswered / Answered) with WCAG-compliant tiles and a portal-based hover tooltip.

**Architecture:** A new `QuestionNavPanel` component renders as a 192px right column inside the exam layout; when open, the main question area shrinks left via flexbox. `showNavPanel` state is lifted from `StickyFooter` to `App.tsx` so the panel can be a sibling to `<main>`. Tooltip is a single `position: fixed` div portalled to `document.body` via `ReactDOM.createPortal` — never clipped by the panel's `overflow-y: auto`.

**Tech Stack:** React 19, TypeScript, ReactDOM.createPortal, inline styles with `var(--token)` DS tokens, Vite dev server at port 5174.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/components/QuestionNavPanel.tsx` | Panel + tile grid + portal tooltip |
| Modify | `src/App.tsx` | Add `showNavPanel` state, restructure layout, pass to StickyFooter |
| Modify | `src/components/StickyFooter.tsx` | Accept `showNavPanel`/`onToggleNavPanel` as props, remove local state + popover |
| Delete | `src/components/QuestionJumpPopover.tsx` | Replaced entirely |

---

## Task 1: Create `QuestionNavPanel.tsx`

**Files:**
- Create: `src/components/QuestionNavPanel.tsx`

- [ ] **Step 1: Create the file with full implementation**

```tsx
// src/components/QuestionNavPanel.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Question } from '../data/questions';
import { ExamSection } from '../data/assessments';

export interface QuestionNavPanelProps {
  questions: Question[];
  currentIndex: number;
  answeredSet: Set<number>;
  flaggedSet: Set<number>;
  sections?: ExamSection[];
  highestReachedIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

type TileStatus = 'current' | 'flagged' | 'answered' | 'unanswered' | 'locked';

interface TipState {
  visible: boolean;
  left: number;
  top: number;
  qnum: number;
  title: string;
  status: TileStatus;
  sectionLabel: string;
}

const TIP_WIDTH = 200;
const TIP_GAP = 8;

function getSectionIndex(sections: ExamSection[], index: number): number {
  let cum = 0;
  for (let i = 0; i < sections.length; i++) {
    cum += sections[i].questionCount;
    if (index < cum) return i;
  }
  return sections.length - 1;
}

function truncate(text: string, max = 120): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

export function QuestionNavPanel({
  questions,
  currentIndex,
  answeredSet,
  flaggedSet,
  sections,
  highestReachedIndex,
  onNavigate,
  onClose,
}: QuestionNavPanelProps) {
  const [focusedTileIndex, setFocusedTileIndex] = useState(currentIndex);
  const [tip, setTip] = useState<TipState>({
    visible: false, left: 0, top: 0,
    qnum: 0, title: '', status: 'unanswered', sectionLabel: '',
  });
  const tileRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const tipRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Locked detection ─────────────────────────────────────────────────────────
  const isLocked = useCallback((index: number): boolean => {
    if (!sections?.length) return false;
    return getSectionIndex(sections, index) > getSectionIndex(sections, highestReachedIndex);
  }, [sections, highestReachedIndex]);

  // ── Tile status ───────────────────────────────────────────────────────────────
  const getTileStatus = useCallback((index: number): TileStatus => {
    if (isLocked(index)) return 'locked';
    if (index === currentIndex) return 'current';
    if (flaggedSet.has(index)) return 'flagged';
    if (answeredSet.has(index)) return 'answered';
    return 'unanswered';
  }, [isLocked, currentIndex, flaggedSet, answeredSet]);

  // ── Groups — flat across all sections ────────────────────────────────────────
  const flaggedGroup    = questions.map((_, i) => i).filter(i => !isLocked(i) && flaggedSet.has(i));
  const unansweredGroup = questions.map((_, i) => i).filter(i => isLocked(i) || (!flaggedSet.has(i) && !answeredSet.has(i)));
  const answeredGroup   = questions.map((_, i) => i).filter(i => !isLocked(i) && !flaggedSet.has(i) && answeredSet.has(i));

  // ── Keyboard: Escape closes ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Tooltip helpers ───────────────────────────────────────────────────────────
  function showTip(tile: HTMLButtonElement, index: number) {
    clearTimeout(hideTimer.current);
    const status = getTileStatus(index);
    const sectionLabel =
      sections?.length
        ? `Section ${getSectionIndex(sections, index) + 1}`
        : '';
    // Position: needs two-pass (show offscreen first to measure height)
    setTip({ visible: true, left: -9999, top: -9999, qnum: index + 1, title: truncate(questions[index].text), status, sectionLabel });
    requestAnimationFrame(() => {
      const rect = tile.getBoundingClientRect();
      const tipH = tipRef.current?.offsetHeight ?? 72;
      let left = rect.left + rect.width / 2 - TIP_WIDTH / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - TIP_WIDTH - 8));
      const top = rect.top - tipH - TIP_GAP;
      setTip(prev => ({ ...prev, left, top }));
    });
  }

  function hideTip() {
    hideTimer.current = setTimeout(() => setTip(prev => ({ ...prev, visible: false })), 80);
  }

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // ── Tile style ────────────────────────────────────────────────────────────────
  function tileStyle(status: TileStatus): React.CSSProperties {
    const base: React.CSSProperties = {
      width: 28, height: 28, borderRadius: 6,
      fontSize: 12, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
      transition: 'transform 0.1s',
      userSelect: 'none',
    };
    switch (status) {
      case 'current':
        return { ...base, background: 'var(--brand-color)', color: '#fff', boxShadow: '0 0 0 3px var(--brand-tint)', border: '2px solid transparent' };
      case 'flagged':
        return { ...base, background: 'var(--state-flagged-bg)', color: 'var(--state-flagged-text)', border: '2px solid transparent' };
      case 'answered':
        return { ...base, background: 'transparent', border: '2px solid var(--border)', color: 'var(--muted-foreground)' };
      case 'locked':
        return {
          ...base,
          background: 'repeating-linear-gradient(45deg, var(--muted) 0px 3px, var(--border) 3px 5px)',
          border: '2px solid var(--border)',
          color: 'var(--muted-foreground)',
          cursor: 'not-allowed',
          opacity: 0.7,
        };
      default: // unanswered
        return { ...base, background: 'var(--muted)', color: 'var(--muted-foreground)', border: '2px solid transparent' };
    }
  }

  // ── Arrow-key nav within a group ──────────────────────────────────────────────
  function handleGroupKeyDown(e: React.KeyboardEvent, group: number[], index: number) {
    const pos = group.indexOf(index);
    if (pos === -1) return;
    let next: number | undefined;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = group[pos + 1];
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = group[pos - 1];
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isLocked(index)) onNavigate(index);
      return;
    } else {
      return;
    }
    if (next !== undefined) {
      e.preventDefault();
      setFocusedTileIndex(next);
      tileRefs.current.get(next)?.focus();
    }
  }

  // ── Tooltip badge label ───────────────────────────────────────────────────────
  function badgeLabel(status: TileStatus, sectionLabel: string): string {
    switch (status) {
      case 'flagged':  return '⚑ Flagged for review';
      case 'answered': return '✓ Answered';
      case 'current':  return '● Viewing now';
      case 'locked':   return `🔒 Locked · ${sectionLabel}`;
      default:         return '○ Not answered';
    }
  }

  function badgeStyle(status: TileStatus): React.CSSProperties {
    const base: React.CSSProperties = {
      fontSize: 11, fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: 3,
      borderRadius: 4, padding: '2px 6px', marginTop: 4,
    };
    switch (status) {
      case 'flagged':  return { ...base, background: '#451a03', color: '#fde68a' };
      case 'answered': return { ...base, background: '#14532d', color: '#86efac' };
      case 'current':  return { ...base, background: '#4c0519', color: '#fda4af' };
      case 'locked':   return { ...base, background: '#1e293b', color: '#64748b' };
      default:         return { ...base, background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' };
    }
  }

  // ── Render tile ───────────────────────────────────────────────────────────────
  function renderTile(index: number, group: number[]) {
    const status = getTileStatus(index);
    const isFocused = focusedTileIndex === index;
    const label = `Question ${index + 1}, ${status === 'current' ? 'current question' : status}`;
    return (
      <button
        key={index}
        ref={el => { if (el) tileRefs.current.set(index, el); else tileRefs.current.delete(index); }}
        tabIndex={isFocused ? 0 : -1}
        aria-label={label}
        aria-disabled={status === 'locked' ? true : undefined}
        className="exam-focus"
        style={tileStyle(status)}
        onClick={() => { if (!isLocked(index)) onNavigate(index); }}
        onFocus={() => setFocusedTileIndex(index)}
        onMouseEnter={e => showTip(e.currentTarget, index)}
        onMouseLeave={hideTip}
        onBlur={hideTip}
        onKeyDown={e => handleGroupKeyDown(e, group, index)}
      >
        {index + 1}
      </button>
    );
  }

  // ── Render group ──────────────────────────────────────────────────────────────
  function renderGroup(
    title: string,
    icon: string | null,
    group: number[],
  ) {
    if (group.length === 0) return null;
    const groupId = `nav-group-${title.toLowerCase()}`;
    return (
      <div role="group" aria-labelledby={groupId} style={{ marginBottom: 14 }}>
        <div
          id={groupId}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 12px 6px',
          }}
        >
          {icon && <span aria-hidden="true" style={{ fontSize: 11 }}>{icon}</span>}
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)' }}>{title}</span>
          <span style={{
            marginLeft: 'auto', fontSize: 11, fontWeight: 600,
            color: 'var(--muted-foreground)',
            background: 'var(--muted)', borderRadius: 10, padding: '1px 6px',
          }}>{group.length}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 12px' }}>
          {group.map(i => renderTile(i, group))}
        </div>
      </div>
    );
  }

  // ── Portal tooltip ────────────────────────────────────────────────────────────
  const tooltip = tip.visible ? ReactDOM.createPortal(
    <div
      ref={tipRef}
      style={{
        position: 'fixed',
        left: tip.left,
        top: tip.top,
        width: TIP_WIDTH,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        background: 'var(--foreground)',
        color: 'var(--background)',
        borderRadius: 8, padding: '9px 11px',
        fontSize: 12, lineHeight: 1.45,
        boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: 4 }}>
          {tip.status === 'current'
            ? `Question ${tip.qnum} — Current`
            : tip.sectionLabel && tip.status === 'locked'
            ? `Question ${tip.qnum} · ${tip.sectionLabel}`
            : `Question ${tip.qnum}`}
        </div>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>{tip.title}</div>
        <div style={badgeStyle(tip.status)}>{badgeLabel(tip.status, tip.sectionLabel)}</div>
      </div>
      <div style={{
        width: 8, height: 5, margin: '0 auto',
        background: 'var(--foreground)',
        clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
      }} />
    </div>,
    document.body
  ) : null;

  // ── Panel ─────────────────────────────────────────────────────────────────────
  return (
    <>
      {tooltip}
      <nav
        aria-label="Question navigator"
        role="complementary"
        style={{
          width: 192, flexShrink: 0,
          background: 'var(--card)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          height: 44, background: 'var(--muted)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 12px', gap: 8, flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)', flex: 1 }}>
            Questions
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 500 }}>
            {currentIndex + 1} / {questions.length}
          </span>
          <button
            onClick={onClose}
            aria-label="Close question navigator"
            className="exam-focus"
            style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'transparent', border: 'none',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: 'var(--muted-foreground)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0 12px' }}>
          {renderGroup('Flagged', '⚑', flaggedGroup)}
          {renderGroup('Unanswered', null, unansweredGroup)}
          {renderGroup('Answered', null, answeredGroup)}
        </div>
      </nav>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/romitsoley/Work/apps/exam-management/assessment-taker
npx tsc --noEmit
```

Expected: no errors from `QuestionNavPanel.tsx`. If `React.CSSProperties` is unresolved, add `import React from 'react';` at the top.

- [ ] **Step 3: Commit**

```bash
git -C /Users/romitsoley/Work add apps/exam-management/assessment-taker/src/components/QuestionNavPanel.tsx
git -C /Users/romitsoley/Work commit -m "feat(taker): add QuestionNavPanel — right split panel, grouped by status"
```

---

## Task 2: Restructure `App.tsx` — add state + layout

**Files:**
- Modify: `src/App.tsx`

The goal: lift `showNavPanel` to App, render `QuestionNavPanel` as a sibling to `<main>` in a flex row, and pass the toggle down to `StickyFooter`.

- [ ] **Step 1: Add import for QuestionNavPanel**

In `src/App.tsx`, find the imports block (around line 1–18). Add after the `StickyFooter` import:

```tsx
import { QuestionNavPanel } from './components/QuestionNavPanel';
```

- [ ] **Step 2: Rename existing `showNavigator` state and add `showNavPanel`**

The existing `showNavigator` at line 165 controls `QuestionNavigatorPopover` (the toolbar popover — a different component). Keep that. Add a new state for the panel:

Find the block of UI state declarations (around line 162–168):
```tsx
const [showNavigator, setShowNavigator] = useState(false);
```

Add directly after it:
```tsx
const [showNavPanel, setShowNavPanel] = useState(false);
```

- [ ] **Step 3: Replace the inner layout to include the panel**

Find this block in the JSX (around line 423–467):
```tsx
<main
  id="main-content"
  className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 pb-24"
  role="main"
  aria-label={`Question ${currentIndex + 1} of ${questions.length}`}>
  
  <SplitQuestionView
    key={currentIndex}
    ...
  />

</main>
```

Wrap `<main>` and the new panel in a flex row:
```tsx
<div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
  <main
    id="main-content"
    className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 pb-24"
    role="main"
    aria-label={`Question ${currentIndex + 1} of ${questions.length}`}
  >
    <SplitQuestionView
      key={currentIndex}
      question={currentQuestion}
      questionIndex={currentIndex}
      selectedAnswer={answers[currentQuestion.id]}
      onSelectAnswer={handleSelectAnswer}
      zoomPercent={zoomPercent}
      showCalculator={showCalculator}
      showKeyboard={showKeyboard}
      onToggleCalculator={() => setShowCalculator(!showCalculator)}
      onToggleKeyboard={() => setShowKeyboard(!showKeyboard)}
      needsCalculator={needsCalculator}
      needsKeyboard={needsKeyboard}
      voiceNarrator={voiceNarrator}
      allowComments={allowComments}
      comment={comments[currentQuestion.id]}
      onCommentChange={handleCommentChange}
    />
  </main>

  {showNavPanel && (
    <QuestionNavPanel
      questions={questions}
      currentIndex={currentIndex}
      answeredSet={answeredIndices}
      flaggedSet={flagged}
      sections={assessment?.sections}
      highestReachedIndex={highestReachedIndex}
      onNavigate={handleNavigate}
      onClose={() => setShowNavPanel(false)}
    />
  )}
</div>
```

- [ ] **Step 4: Pass `showNavPanel` and `onToggleNavPanel` to `StickyFooter`**

Find the `<StickyFooter ...>` call (around line 497). Add two new props:

```tsx
<StickyFooter
  currentIndex={currentIndex}
  totalQuestions={questions.length}
  onNavigate={handleNavigate}
  isFlaggedCurrent={flagged.has(currentIndex)}
  onToggleFlag={handleToggleFlag}
  questions={questions}
  answeredSet={answeredIndices}
  flaggedSet={flagged}
  sections={assessment?.sections}
  showNavPanel={showNavPanel}
  onToggleNavPanel={() => setShowNavPanel(v => !v)}
/>
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd /Users/romitsoley/Work/apps/exam-management/assessment-taker
npx tsc --noEmit
```

Expected: errors on `StickyFooter` missing new props — that is correct, Task 3 fixes them.

- [ ] **Step 6: Commit**

```bash
git -C /Users/romitsoley/Work add apps/exam-management/assessment-taker/src/App.tsx
git -C /Users/romitsoley/Work commit -m "feat(taker): lift showNavPanel to App, add QuestionNavPanel to layout"
```

---

## Task 3: Update `StickyFooter.tsx` — accept props, remove popover

**Files:**
- Modify: `src/components/StickyFooter.tsx`

- [ ] **Step 1: Update props interface and remove local state**

Replace the entire file content with:

```tsx
import React from 'react';
import { Tooltip } from './Tooltip';
import { Button as DSButton } from '@exxat/ds/packages/ui/src';
import { Question } from '../data/questions';
import type { ExamSection } from '../data/assessments';

interface StickyFooterProps {
  currentIndex: number;
  totalQuestions: number;
  onNavigate: (index: number) => void;
  isFlaggedCurrent: boolean;
  onToggleFlag: () => void;
  questions: Question[];
  answeredSet: Set<number>;
  flaggedSet: Set<number>;
  sections?: ExamSection[];
  showNavPanel: boolean;
  onToggleNavPanel: () => void;
}

export function StickyFooter({
  currentIndex,
  totalQuestions,
  onNavigate,
  isFlaggedCurrent,
  onToggleFlag,
  flaggedSet,
  showNavPanel,
  onToggleNavPanel,
}: StickyFooterProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t z-30 px-4 flex items-center justify-between transition-colors"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.07)',
        height: 64,
      }}
    >
      {/* Previous */}
      <DSButton
        variant="outline"
        size="lg"
        onClick={() => currentIndex > 0 && onNavigate(currentIndex - 1)}
        disabled={currentIndex === 0}
        aria-label="Previous question"
      >
        <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 16 }} />
        <span className="hidden sm:inline">Previous</span>
      </DSButton>

      {/* Center: Q pill — toggles right panel */}
      <Tooltip content="View all questions" position="top" disabled={showNavPanel}>
        <DSButton
          variant="outline"
          size="sm"
          onClick={onToggleNavPanel}
          aria-label="Toggle question navigator"
          aria-expanded={showNavPanel}
          aria-controls="question-nav-panel"
          className="rounded-full gap-2 font-semibold"
          style={showNavPanel ? {
            backgroundColor: 'var(--brand-color)',
            borderColor: 'var(--brand-color)',
            color: '#fff',
          } : undefined}
        >
          <span>Q {currentIndex + 1}</span>
          <span style={{ color: showNavPanel ? 'rgba(255,255,255,0.7)' : 'var(--muted-foreground)', fontWeight: 400 }}>
            of {totalQuestions}
          </span>
          {flaggedSet.size > 0 && (
            <span
              className="flex items-center gap-1"
              style={{ color: showNavPanel ? 'rgba(255,255,255,0.85)' : 'var(--state-flagged-text)', fontSize: 12 }}
            >
              · <i className="fa-solid fa-flag" aria-hidden="true" style={{ fontSize: 10 }} />
              {flaggedSet.size}
            </span>
          )}
        </DSButton>
      </Tooltip>

      {/* Right: Mark for review + Next */}
      <div className="flex items-center gap-2">
        <Tooltip content="Mark for review (F)" position="top">
          <DSButton
            variant="outline"
            size="lg"
            onClick={onToggleFlag}
            aria-label={isFlaggedCurrent ? 'Remove mark' : 'Mark for review'}
            style={
              isFlaggedCurrent
                ? { backgroundColor: 'var(--state-flagged-bg)', borderColor: 'var(--state-flagged-border)', color: 'var(--state-flagged-text)' }
                : undefined
            }
          >
            <i className={`${isFlaggedCurrent ? 'fa-solid' : 'fa-light'} fa-flag`} aria-hidden="true" style={{ fontSize: 16 }} />
            <span className="hidden sm:inline">{isFlaggedCurrent ? 'Marked' : 'Mark'}</span>
          </DSButton>
        </Tooltip>

        <DSButton
          variant="default"
          size="lg"
          onClick={() => currentIndex < totalQuestions - 1 && onNavigate(currentIndex + 1)}
          disabled={currentIndex === totalQuestions - 1}
          aria-label="Next question"
        >
          <span className="hidden sm:inline">Next</span>
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 16 }} />
        </DSButton>
      </div>
    </div>
  );
}
```

Note: `questions` and `answeredSet` are kept in the interface (callers still pass them) but no longer used in the footer body — they were only needed by the removed `QuestionJumpPopover`. They can be fully removed from the interface in a follow-up cleanup, but keeping them now avoids a cascade of caller changes.

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/romitsoley/Work/apps/exam-management/assessment-taker
npx tsc --noEmit
```

Expected: clean (no errors). If `questions`/`answeredSet` unused-variable warnings appear, add them to the destructured props: `questions: _questions, answeredSet: _answeredSet` or simply omit from the destructure and leave in the interface.

- [ ] **Step 3: Commit**

```bash
git -C /Users/romitsoley/Work add apps/exam-management/assessment-taker/src/components/StickyFooter.tsx
git -C /Users/romitsoley/Work commit -m "feat(taker): update StickyFooter — accept showNavPanel prop, remove QuestionJumpPopover"
```

---

## Task 4: Delete `QuestionJumpPopover.tsx` and manual verification

**Files:**
- Delete: `src/components/QuestionJumpPopover.tsx`

- [ ] **Step 1: Delete the file**

```bash
rm /Users/romitsoley/Work/apps/exam-management/assessment-taker/src/components/QuestionJumpPopover.tsx
```

- [ ] **Step 2: Verify no remaining imports**

```bash
grep -r "QuestionJumpPopover" /Users/romitsoley/Work/apps/exam-management/assessment-taker/src/
```

Expected: no output. If any file still imports it, remove the import.

- [ ] **Step 3: TypeScript clean build**

```bash
cd /Users/romitsoley/Work/apps/exam-management/assessment-taker
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Start dev server and manually verify**

```bash
cd /Users/romitsoley/Work/apps/exam-management/assessment-taker && pnpm dev
```

Open **http://localhost:5174** and verify:

1. **Panel opens:** Click the Q pill in the footer → panel slides in on the right, content area shrinks left.
2. **Groups correct:** Flagged / Unanswered / Answered groups appear with correct tiles.
3. **Tile styles:**
   - Current question tile: brand-pink fill + white text + glow ring
   - Flagged tiles: yellow fill + amber text
   - Answered tiles: transparent + grey border + muted text
   - Unanswered tiles: muted fill + muted-foreground text
   - Locked tiles (Section 2+): diagonal stripe fill + muted text
4. **Tooltip:** Hover any tile → tooltip appears above it, not clipped, shows Q number + question text + status badge.
5. **Panel stays open:** Click a tile → navigates to that question, panel stays open.
6. **Close:** Click ✕ button or press Escape → panel closes, Q pill returns to outline style.
7. **Q pill active style:** When panel is open, pill fills brand-pink. When closed, outline.
8. **Keyboard:** Tab into a tile in any group → arrow keys move within that group → Enter navigates.

- [ ] **Step 5: Commit**

```bash
git -C /Users/romitsoley/Work add -A apps/exam-management/assessment-taker/src/
git -C /Users/romitsoley/Work commit -m "feat(taker): delete QuestionJumpPopover — replaced by QuestionNavPanel"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Right split panel, content shifts left | Task 2 — flex row wrapper |
| 192px panel width | Task 1 — `width: 192` on `<nav>` |
| Grouped: Flagged / Unanswered / Answered | Task 1 — `flaggedGroup`, `unansweredGroup`, `answeredGroup` |
| Locked tiles in Unanswered, stripe fill | Task 1 — `tileStyle('locked')` uses `repeating-linear-gradient` |
| Answered tiles: outline only, no fill | Task 1 — `tileStyle('answered')` uses `transparent` bg + `var(--border)` border |
| Current tile: brand-color fill | Task 1 — `tileStyle('current')` |
| 28×28px tiles (WCAG 2.5.5) | Task 1 — `width: 28, height: 28` |
| Portal tooltip, position: fixed | Task 1 — `ReactDOM.createPortal` into `document.body` |
| Tooltip: Q number + truncated stem + status badge | Task 1 — `tip.qnum`, `truncate(questions[i].text)`, `badgeLabel` |
| Panel stays open on navigate | Task 1 — `onNavigate(index)` without calling `onClose` |
| Escape closes panel | Task 1 — `useEffect` keydown handler |
| `role="complementary"` on panel | Task 1 — `<nav role="complementary">` |
| `role="group"` + `aria-labelledby` per section | Task 1 — `renderGroup` function |
| `aria-label` per tile | Task 1 — `aria-label={label}` on each button |
| `aria-disabled` on locked tiles | Task 1 — `aria-disabled={status === 'locked' ? true : undefined}` |
| Q pill active state (brand-pink) | Task 3 — StickyFooter pill `style` conditional |
| `showNavPanel` lifted to App | Task 2 |
| `QuestionJumpPopover` deleted | Task 4 |

All requirements covered. No placeholders. Type names (`TileStatus`, `TipState`, `QuestionNavPanelProps`) are consistent across all tasks.
