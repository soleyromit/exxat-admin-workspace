import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@exxat/ds/packages/ui/src';
import { questions } from './data/questions';
import { MOCK_ASSESSMENTS, ExamSection } from './data/assessments';
import { useTimer } from './hooks/useTimer';
import { useZoom } from './hooks/useZoom';
import { ExamToolbar } from './components/ExamToolbar';
import { SplitQuestionView } from './components/SplitQuestionView';
import { SidebarDrawer } from './components/SidebarDrawer';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { CalculatorPopover } from './components/CalculatorPopover';
import { QuestionNavigatorPopover } from './components/QuestionNavigatorPopover';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { GlobalReferencePanel } from './components/GlobalReferencePanel';
import { SubmitReviewOverlay } from './components/SubmitReviewOverlay';
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
  questionStart,
  questionEnd,
  onBegin,
}: {
  section: ExamSection;
  sectionNumber: number;
  totalSections: number;
  questionStart: number;
  questionEnd: number;
  onBegin: () => void;
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
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', padding: '40px 24px',
      }}
    >
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        {/* Section label */}
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: 0.5, marginBottom: 12 }}>
          Section {sectionNumber} of {totalSections}
        </p>

        {/* Section icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--muted)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <i className="fa-light fa-layer-group" aria-hidden="true" style={{ fontSize: 26, color: 'var(--brand-color)' }} />
        </div>

        {/* Title */}
        <h2 id="section-start-title" style={{ fontSize: 26, fontWeight: 700, color: 'var(--foreground)', marginBottom: 8, lineHeight: 1.2 }}>
          {section.title}
        </h2>

        {/* Question range */}
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 28 }}>
          Questions {questionStart}–{questionEnd} · {section.questionCount} questions
        </p>

        {/* Instructions */}
        {section.instructions && (
          <div style={{
            textAlign: 'left',
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px 20px', marginBottom: 32,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: 8 }}>
              Section Instructions
            </p>
            <p style={{ fontSize: 14, color: 'var(--foreground)', lineHeight: 1.7 }}>
              {section.instructions}
            </p>
          </div>
        )}

        {/* CTA */}
        <Button ref={beginRef} size="lg" onClick={onBegin} className="w-full">
          Begin Section {sectionNumber}
          <i className="fa-light fa-arrow-right" aria-hidden="true" />
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
  const handleCommentChange = useCallback((questionId: number, text: string) => {
    setComments(prev => ({ ...prev, [questionId]: text }));
  }, []);
  // UI States
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showGlobalRef, setShowGlobalRef] = useState(false);
  const [showSubmitReview, setShowSubmitReview] = useState(false);
  const [showSectionStart, setShowSectionStart] = useState(false);
  const [pendingNavigateIndex, setPendingNavigateIndex] = useState<number | null>(null);
  const [voiceNarrator, setVoiceNarrator] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState<
    'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'>(
    'none');
  // Preferences — light theme by default
  const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>(
    'light'
  );
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
  // Reset inline tools when switching to a question that doesn't need them
  useEffect(() => {
    if (!needsCalculator && showCalculator) setShowCalculator(false);
    if (!needsKeyboard && showKeyboard) setShowKeyboard(false);
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
    navigate(`/exam/${id ?? 'demo'}/submitted`);
  }, [navigate, id]);
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
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        handleNavigate(currentIndex - 1);
      } else if (e.key.toLowerCase() === 'z') {
        handleToggleFlag();
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
    {showSectionStart && assessment?.sections && pendingNavigateIndex !== null && (() => {
      const boundaries = getSectionBoundaries(assessment.sections);
      const boundary = boundaries.find(b => pendingNavigateIndex >= b.start && pendingNavigateIndex <= b.end);
      if (!boundary) return null;
      return (
        <SectionStartScreen
          section={boundary.section}
          sectionNumber={boundary.sectionNumber}
          totalSections={assessment.sections.length}
          questionStart={boundary.start + 1}
          questionEnd={boundary.end + 1}
          onBegin={handleBeginSection}
        />
      );
    })()}
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
        hasGlobalRef={(assessment?.referenceMaterials?.length ?? 0) > 0}
        isGlobalRefOpen={showGlobalRef}
        onToggleGlobalRef={() => setShowGlobalRef(v => !v)} />
      

      <div className="relative flex-1 overflow-hidden flex flex-col">
        <QuestionNavigatorPopover
          questions={questions}
          currentIndex={currentIndex}
          highestReachedIndex={highestReachedIndex}
          answeredSet={answeredIndices}
          flaggedSet={flagged}
          onNavigate={handleNavigate}
          isOpen={showNavigator}
          onClose={() => setShowNavigator(false)} />
        

        <AccessibilityPanel
          isOpen={showAccessibility}
          onClose={() => setShowAccessibility(false)}
          zoomPercent={zoomPercent}
          zoomIn={zoomIn}
          zoomOut={zoomOut} />
        

        <main
          id="main-content"
          className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 pb-24"
          role="main"
          aria-label={`Question ${currentIndex + 1} of ${questions.length}`}>
          
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
            onCommentChange={handleCommentChange} />

        </main>
      </div>

      <SidebarDrawer
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        questions={questions}
        currentIndex={currentIndex}
        answeredSet={answeredIndices}
        flaggedSet={flagged}
        onNavigate={handleNavigate} />
      

      {/* Fallback floating tools — only shown when NOT inline (i.e., question doesn't need them but user toggled from settings) */}
      {showKeyboard && !needsKeyboard &&
      <VirtualKeyboard
        isOpen={showKeyboard}
        onClose={() => setShowKeyboard(false)} />

      }
      {showCalculator && !needsCalculator &&
      <CalculatorPopover
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)} />

      }

      {/* Vishaka May 14: "bottom panel is getting lost — that is my primary way to act.
           I have to reorient to the right-hand corner to go next." StickyFooter provides
           bottom navigation so students never need to look at the toolbar to advance. */}
      <StickyFooter
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        onNavigate={handleNavigate}
        isFlaggedCurrent={flagged.has(currentIndex)}
        onToggleFlag={handleToggleFlag}
        questions={questions}
        answeredSet={answeredIndices}
        flaggedSet={flagged} />

      <GlobalReferencePanel
        isOpen={showGlobalRef}
        onClose={() => setShowGlobalRef(false)}
        materials={assessment?.referenceMaterials ?? []} />

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
    </>
  );

}