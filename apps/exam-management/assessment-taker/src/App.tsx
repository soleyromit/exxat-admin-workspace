import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@exxatdesignux/ui';
import { questions } from './data/questions';
import { MOCK_ASSESSMENTS, ExamSection } from './data/assessments';
import { useTimer } from './hooks/useTimer';
import { useZoom } from './hooks/useZoom';
import { ExamToolbar } from './components/ExamToolbar';
import { SplitQuestionView } from './components/SplitQuestionView';
import { SidebarDrawer } from './components/SidebarDrawer';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { CalculatorPopover } from './components/CalculatorPopover';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { GlobalReferencePanel } from './components/GlobalReferencePanel';
import { QuestionCommentBox } from './components/QuestionCommentBox';
import { SubmitReviewOverlay } from './components/SubmitReviewOverlay';
import { KeyboardShortcutModal } from './components/KeyboardShortcutModal';
import { StickyFooter } from './components/StickyFooter';
// Question types that benefit from a calculator
const CALCULATOR_TYPES = new Set([
'table',
'fill-blank',
'short-answer',
'essay',
'chart']
);
// Question types that benefit from an on-screen keyboard
const KEYBOARD_TYPES = new Set(['short-answer', 'essay', 'fill-blank']);
// Question types that support A-D single-select keyboard shortcuts
const MCQ_TYPES = new Set([
'mcq',
'image-mcq',
'video-mcq',
'audio',
'case-study',
'combined',
'passage',
'pdf',
'table',
'cross-out',
'chart']
);
// ─── Section boundary helpers ─────────────────────────────────────────────────

function getSectionBoundaries(sections: ExamSection[]): Array<{
  section: ExamSection;
  sectionNumber: number;  // 1-based
  start: number;          // question index (0-based)
  end: number;
}> {
  let cumulative = 0;
  return sections.map((s, i) => {
    const boundary = { section: s, sectionNumber: i + 1, start: cumulative, end: cumulative + s.questionCount - 1 };
    cumulative += s.questionCount;
    return boundary;
  });
}

// ─── Section start screen (overlay) ──────────────────────────────────────────
function SectionStartScreen({
  section,
  sectionNumber,
  totalSections,
  onBegin,
  hasGlobalRef,
  isGlobalRefOpen,
  onToggleGlobalRef,
  isNavOpen,
  onToggleNav,
}: {
  section: ExamSection;
  sectionNumber: number;
  totalSections: number;
  onBegin: () => void;
  hasGlobalRef?: boolean;
  isGlobalRefOpen?: boolean;
  onToggleGlobalRef?: () => void;
  isNavOpen?: boolean;
  onToggleNav?: () => void;
}) {
  const beginRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    beginRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="section-start-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 30,
        background: 'var(--background)', display: 'flex',
        flexDirection: 'column', padding: '40px 24px', overflowY: 'auto',
      }}
    >
      {/* Reference + Navigator access while reviewing section start */}
      {(hasGlobalRef || onToggleNav) && (
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
          {hasGlobalRef && (
            <Button
              variant={isGlobalRefOpen ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleGlobalRef}
              aria-label={isGlobalRefOpen ? 'Close reference panel' : 'Open reference materials'}
              aria-pressed={isGlobalRefOpen}
            >
              <i className="fa-light fa-file-lines" aria-hidden="true" />
              Reference
            </Button>
          )}
          {onToggleNav && (
            <Button
              variant={isNavOpen ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleNav}
              aria-label={isNavOpen ? 'Close question navigator' : 'Open question navigator'}
              aria-expanded={isNavOpen}
            >
              <i className="fa-light fa-list-ul" aria-hidden="true" />
              Questions
            </Button>
          )}
        </div>
      )}
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'left', margin: 'auto' }}>
        {/* Section label */}
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: 0.5, marginBottom: 6 }}>
          Section {sectionNumber} of {totalSections}
        </p>

        {/* Title */}
        <h2 id="section-start-title" style={{ fontSize: 24, fontWeight: 700, color: 'var(--foreground)', marginBottom: 6, lineHeight: 1.2 }}>
          {section.title}
        </h2>

        {/* Question range */}
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 24 }}>
          {section.questionCount} questions
        </p>

        {/* Instructions — capped scroll area so the Begin button stays reachable */}
        {section.instructions && (
          <div
            tabIndex={0}
            role="region"
            aria-label="Section instructions"
            style={{
              textAlign: 'left',
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '16px 20px', marginBottom: 32,
              maxHeight: '40vh', overflowY: 'auto',
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: 8 }}>
              Section Instructions
            </p>
            <p style={{ fontSize: 15, color: 'var(--foreground)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {section.instructions}
            </p>
          </div>
        )}

        {/* CTA */}
        <Button ref={beginRef} size="lg" onClick={onBegin} className="w-full">
          Begin Section {sectionNumber}
        </Button>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export function App() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  // Aarti May 14: "skipped = questions up to the highest point reached that are unanswered"
  const [highestReachedIndex, setHighestReachedIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  // Aarti-mandated: per-question comments — students flag perceived errors,
  // faculty review post-exam. Driven by Assessment.allowComments.
  const [comments, setComments] = useState<Record<number, string>>({});
  const assessment =
    MOCK_ASSESSMENTS.find(a => a.id === id) ?? MOCK_ASSESSMENTS[0];
  const allowComments = assessment?.allowComments ?? false;
  // Forward-only exams hide Previous + disable back-navigation (← key).
  const allowBack = !(assessment?.forwardOnly);
  const handleCommentChange = useCallback((questionId: number, text: string) => {
    setComments(prev => ({ ...prev, [questionId]: text }));
  }, []);
  // UI States
  const [showReport, setShowReport] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showGlobalRef, setShowGlobalRef] = useState(false);
  const [showSubmitReview, setShowSubmitReview] = useState(false);
  const [showSectionStart, setShowSectionStart] = useState(() => Boolean(assessment?.sections?.length));
  const [pendingNavigateIndex, setPendingNavigateIndex] = useState<number | null>(null);
  const [voiceNarrator, setVoiceNarrator] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState<
    'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'>(
    'none');
  // Preferences — light theme by default
  const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>(
    'light'
  );
  // Sync DS dark-mode class on <html> so DS tokens (--background, --card, etc.) update
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' || theme === 'high-contrast') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    return () => root.classList.remove('dark');
  }, [theme]);
  const { formatted: timerFormatted, totalSeconds } = useTimer(7200);
  const isLastFiveMinutes = totalSeconds <= 300;
  const { zoomPercent, zoomIn, zoomOut, announcement } = useZoom();
  const currentQuestion = questions[currentIndex];
  const answeredIndices = new Set(
    questions.
    map((q, i) => answers[q.id] !== undefined ? i : -1).
    filter((i) => i !== -1)
  );
  // Contextual tool relevance
  const needsCalculator = CALCULATOR_TYPES.has(currentQuestion.type);
  const needsKeyboard = KEYBOARD_TYPES.has(currentQuestion.type);
  // Reset inline tools and report state when switching questions
  useEffect(() => {
    if (!needsCalculator && showCalculator) setShowCalculator(false);
    if (!needsKeyboard && showKeyboard) setShowKeyboard(false);
    setShowReport(false);
  }, [currentIndex, needsCalculator, needsKeyboard]);
  const handleNavigate = useCallback((index: number) => {
    const sections = assessment?.sections;
    if (sections?.length && index > currentIndex) {
      const boundaries = getSectionBoundaries(sections);
      const currentBoundary = boundaries.find(b => currentIndex >= b.start && currentIndex <= b.end);
      const targetBoundary = boundaries.find(b => index >= b.start && index <= b.end);
      if (targetBoundary && currentBoundary && targetBoundary.sectionNumber !== currentBoundary.sectionNumber) {
        setPendingNavigateIndex(index);
        setShowSectionStart(true);
        return;
      }
    }
    setCurrentIndex(index);
    setHighestReachedIndex(prev => Math.max(prev, index));
  }, [currentIndex, assessment?.sections]);
  const handleSelectAnswer = useCallback((questionId: number, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }));
    if (assessment?.autoAdvance) {
      const idx = questions.findIndex(q => q.id === questionId);
      if (idx !== -1 && idx < questions.length - 1) {
        setTimeout(() => {
          handleNavigate(idx + 1);
        }, 350);
      }
    }
  }, [assessment?.autoAdvance, questions, handleNavigate]);

  const handleBeginSection = useCallback(() => {
    if (pendingNavigateIndex !== null) {
      setCurrentIndex(pendingNavigateIndex);
      setHighestReachedIndex(prev => Math.max(prev, pendingNavigateIndex!));
      setPendingNavigateIndex(null);
    }
    setShowSectionStart(false);
  }, [pendingNavigateIndex]);
  const handleToggleFlag = useCallback(() => {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(currentIndex) ?
      next.delete(currentIndex) :
      next.add(currentIndex);
      return next;
    });
  }, [currentIndex]);
  const handleSubmit = useCallback(() => {
    setShowSubmitReview(true);
  }, []);

  const handleConfirmSubmit = useCallback(() => {
    // Save responses before navigating; PostExam page clears this after display
    const key = `exam-response-${id ?? 'demo'}`;
    try {
      localStorage.setItem(key, JSON.stringify({
        assessmentId: id ?? 'demo',
        answers,
        submittedAt: new Date().toISOString(),
      }));
    } catch {
      // Continue even if localStorage is unavailable
    }
    navigate(`/exam/${id ?? 'demo'}/submitted`);
  }, [navigate, id, answers]);
  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);
  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement)

      return;
      if (e.key === 'Enter' && currentIndex < questions.length - 1) {
        e.preventDefault();
        handleNavigate(currentIndex + 1);
      } else if (
      e.key === 'ArrowRight' &&
      currentIndex < questions.length - 1)
      {
        handleNavigate(currentIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0 && allowBack) {
        handleNavigate(currentIndex - 1);
      } else if (e.key.toLowerCase() === 'z') {
        handleToggleFlag();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      } else if (
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].includes(e.key.toLowerCase()))
      {
        const idx = e.key.toLowerCase().charCodeAt(0) - 97;
        if (currentQuestion.type === 'checkbox') {
          // Toggle checkbox option
          if (currentQuestion.options && currentQuestion.options[idx]) {
            const currentAnswer: string[] = answers[currentQuestion.id] || [];
            const option = currentQuestion.options[idx];
            const currentSet = new Set(currentAnswer);
            if (currentSet.has(option)) {
              currentSet.delete(option);
            } else {
              currentSet.add(option);
            }
            handleSelectAnswer(currentQuestion.id, Array.from(currentSet));
          }
        } else if (MCQ_TYPES.has(currentQuestion.type)) {
          // Single select for MCQ-like types
          if (currentQuestion.options && currentQuestion.options[idx]) {
            handleSelectAnswer(currentQuestion.id, currentQuestion.options[idx]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
  currentIndex,
  currentQuestion,
  handleNavigate,
  handleToggleFlag,
  handleSelectAnswer,
  answers]
  );
  return (
    <>
    <div
      className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-300 theme-${theme}`}
      style={{
        backgroundColor: 'var(--background)',
        filter:
        colorBlindMode === 'none' ?
        undefined :
        colorBlindMode === 'protanopia' ?
        'url(#protanopia)' :
        colorBlindMode === 'deuteranopia' ?
        'url(#deuteranopia)' :
        colorBlindMode === 'tritanopia' ?
        'url(#tritanopia)' :
        colorBlindMode === 'achromatopsia' ?
        'grayscale(100%)' :
        undefined
      }}>
      
      {/* SVG color blindness simulation filters */}
      <svg
        style={{
          position: 'absolute',
          width: 0,
          height: 0
        }}
        aria-hidden="true">
        
        <defs>
          <filter id="protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0" />
            
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0" />
            
          </filter>
          <filter id="tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0" />
            
          </filter>
        </defs>
      </svg>
      {/* Skip navigation for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:font-heading focus:text-sm focus:font-bold"
        style={{
          backgroundColor: 'var(--brand-color)',
          color: 'var(--brand-foreground)'
        }}>
        
        Skip to question content
      </a>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <div aria-live="assertive" className="sr-only" role="status">
        Question {currentIndex + 1} of {questions.length}:{' '}
        {currentQuestion.text}
      </div>

      <ExamToolbar
        timerFormatted={timerFormatted}
        assessmentTitle={assessment?.title}
        courseLabel={assessment ? `${assessment.courseCode} · ${assessment.courseName}` : undefined}
        totalQuestions={questions.length}
        currentIndex={currentIndex}
        zoomPercent={zoomPercent}
        onToggleCalculator={() => setShowCalculator(!showCalculator)}
        onToggleKeyboard={() => setShowKeyboard(!showKeyboard)}
        onToggleAccessibility={() => setShowAccessibility(!showAccessibility)}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        onSubmit={handleSubmit}
        theme={theme}
        onThemeChange={setTheme}
        isLastFiveMinutes={isLastFiveMinutes}
        voiceNarrator={voiceNarrator}
        onToggleVoiceNarrator={() => setVoiceNarrator(!voiceNarrator)}
        colorBlindMode={colorBlindMode}
        onColorBlindModeChange={setColorBlindMode}
        onExit={handleExit}
        hasGlobalRef={(assessment?.assessmentReferences?.length ?? 0) > 0}
        isGlobalRefOpen={showGlobalRef}
        onToggleGlobalRef={() => setShowGlobalRef(v => !v)}
        sections={assessment?.sections}
        onShowKeyboardShortcuts={() => setShowShortcuts(true)}
        onToggleNav={() => setShowSidebar(v => !v)}
        isNavOpen={showSidebar}
        onReportIssue={allowComments ? () => setShowReport(true) : undefined} />
      

      <div className="relative flex-1 overflow-hidden flex flex-col">
        {showSectionStart && assessment?.sections?.length && (() => {
          const boundaries = getSectionBoundaries(assessment.sections);
          const boundary = pendingNavigateIndex !== null
            ? boundaries.find(b => pendingNavigateIndex >= b.start && pendingNavigateIndex <= b.end)
            : boundaries[0];
          if (!boundary) return null;
          return (
            <SectionStartScreen
              section={boundary.section}
              sectionNumber={boundary.sectionNumber}
              totalSections={assessment.sections.length}
              onBegin={handleBeginSection}
              hasGlobalRef={(assessment?.assessmentReferences?.length ?? 0) > 0}
              isGlobalRefOpen={showGlobalRef}
              onToggleGlobalRef={() => setShowGlobalRef(v => !v)}
              isNavOpen={showSidebar}
              onToggleNav={() => setShowSidebar(v => !v)}
            />
          );
        })()}

        <AccessibilityPanel
          isOpen={showAccessibility}
          onClose={() => setShowAccessibility(false)}
          zoomPercent={zoomPercent}
          zoomIn={zoomIn}
          zoomOut={zoomOut} />
        

        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', backgroundColor: 'var(--background)', gap: 16, padding: '16px 16px' }}>
          <main
            id="main-content"
            className="flex-1 min-w-[380px] overflow-hidden flex flex-col"
            role="main"
            aria-label={`Question ${currentIndex + 1} of ${questions.length}`}>

            <SplitQuestionView
              key={currentIndex}
              question={currentQuestion}
              questionIndex={currentIndex}
              selectedAnswer={answers[currentQuestion.id]}
              onSelectAnswer={handleSelectAnswer}
              zoomPercent={zoomPercent}
              showKeyboard={showKeyboard}
              onToggleKeyboard={() => setShowKeyboard(!showKeyboard)}
              needsKeyboard={needsKeyboard}
              voiceNarrator={voiceNarrator}
              isFlagged={flagged.has(currentIndex)}
              onToggleFlag={handleToggleFlag} />

          </main>
          {showGlobalRef && !showSectionStart && (assessment?.assessmentReferences?.length ?? 0) > 0 && (
            <GlobalReferencePanel
              refs={assessment!.assessmentReferences!}
              onClose={() => setShowGlobalRef(false)} />
          )}
          {showReport && allowComments && (
            <QuestionCommentBox
              questionId={currentQuestion.id}
              initialComment={comments[currentQuestion.id]}
              onSave={handleCommentChange}
              onClose={() => setShowReport(false)} />
          )}
          {showSidebar && !showSectionStart && (
            <SidebarDrawer
              onClose={() => setShowSidebar(false)}
              questions={questions}
              currentIndex={currentIndex}
              highestReachedIndex={highestReachedIndex}
              answeredSet={answeredIndices}
              flaggedSet={flagged}
              sections={assessment?.sections}
              onNavigate={handleNavigate} />
          )}
        </div>
      </div>
      

      {/* Panels lifted above section-start overlay (z-35 > overlay z-30) */}
      {showSectionStart && showGlobalRef && (assessment?.assessmentReferences?.length ?? 0) > 0 && (
        <GlobalReferencePanel
          refs={assessment!.assessmentReferences!}
          onClose={() => setShowGlobalRef(false)}
          style={{ position: 'fixed', right: 16, top: 56, bottom: 16, zIndex: 35, height: 'auto' }} />
      )}
      {showSectionStart && showSidebar && (
        <SidebarDrawer
          onClose={() => setShowSidebar(false)}
          questions={questions}
          currentIndex={currentIndex}
          highestReachedIndex={highestReachedIndex}
          answeredSet={answeredIndices}
          flaggedSet={flagged}
          sections={assessment?.sections}
          onNavigate={handleNavigate}
          style={{ position: 'fixed', right: showGlobalRef && (assessment?.assessmentReferences?.length ?? 0) > 0 ? 372 : 16, top: 56, bottom: 16, zIndex: 35, height: 'auto' }} />
      )}

      {/* Fallback floating tools — only shown when NOT inline (i.e., question doesn't need them but user toggled from settings) */}
      {showKeyboard && !needsKeyboard &&
      <VirtualKeyboard
        isOpen={showKeyboard}
        onClose={() => setShowKeyboard(false)} />

      }
      {showCalculator &&
      <CalculatorPopover
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)} />

      }

      {/* Vishaka May 14: "bottom panel is getting lost — that is my primary way to act.
           I have to reorient to the right-hand corner to go next." StickyFooter provides
           bottom navigation so students never need to look at the toolbar to advance.
           Hidden on section-start screens where navigation controls are in the overlay. */}
      {!showSectionStart && (
        <StickyFooter
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          allowBack={allowBack}
          onNavigate={handleNavigate} />
      )}

      {showSubmitReview && (
        <SubmitReviewOverlay
          questions={questions}
          currentIndex={currentIndex}
          answeredSet={answeredIndices}
          flaggedSet={flagged}
          highestReachedIndex={highestReachedIndex}
          onNavigate={handleNavigate}
          onClose={() => setShowSubmitReview(false)}
          onConfirmSubmit={handleConfirmSubmit} />
      )}
    </div>
      <KeyboardShortcutModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );

}