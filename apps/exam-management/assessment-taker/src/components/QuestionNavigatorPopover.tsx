import { useEffect, useState, useRef } from 'react';
import { Question } from '../data/questions';
export interface QuestionNavigatorPopoverProps {
  questions: Question[];
  currentIndex: number;
  /** Aarti May 14: "skipped = questions up to the highest point reached, not answered"
   *  Used to filter the Skipped tab — not all unanswered, only those before current progress. */
  highestReachedIndex: number;
  answeredSet: Set<number>;
  flaggedSet: Set<number>;
  onNavigate: (index: number) => void;
  isOpen: boolean;
  onClose: () => void;
}
type FilterTab = 'all' | 'skipped' | 'flagged' | 'answered';
export function QuestionNavigatorPopover({
  questions,
  currentIndex,
  highestReachedIndex,
  answeredSet,
  flaggedSet,
  onNavigate,
  isOpen,
  onClose
}: QuestionNavigatorPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  // Skipped = unanswered questions up to the furthest point reached (Aarti May 14)
  const skippedCount = questions.filter((_, i) => i <= highestReachedIndex && !answeredSet.has(i)).length;
  const filteredQuestions = questions.map((q, i) => ({
    q,
    i
  })).filter(({
    i
  }) => {
    if (activeFilter === 'skipped') return i <= highestReachedIndex && !answeredSet.has(i);
    if (activeFilter === 'flagged') return flaggedSet.has(i);
    if (activeFilter === 'answered') return answeredSet.has(i);
    return true;
  });
  return <div ref={ref} className="absolute top-full right-0 mt-2 z-50 animate-pop-in flex flex-col" style={{
    width: '400px',
    maxHeight: '80vh',
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
  }}>
      <div className="p-4 border-b" style={{
      borderColor: 'var(--border)'
    }}>
        <h3 className="font-bold text-sm mb-3" style={{
        color: 'var(--foreground)'
      }}>
          Question Navigator
        </h3>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <FilterButton label="All" count={questions.length} active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
          <FilterButton label="Skipped" count={skippedCount} active={activeFilter === 'skipped'} onClick={() => setActiveFilter('skipped')} />
          <FilterButton label="Flagged" count={flaggedSet.size} active={activeFilter === 'flagged'} onClick={() => setActiveFilter('flagged')} />
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        {filteredQuestions.length === 0 ? <div className="text-center py-8 text-slate-500 text-sm">
            No questions match this filter.
          </div> : <div className="grid grid-cols-5 gap-2">
            {filteredQuestions.map(({
          q,
          i
        }) => {
          const isCurrent = i === currentIndex;
          const isAnswered = answeredSet.has(i);
          const isFlagged = flaggedSet.has(i);
          let bg: string = 'var(--card)';
          let border: string = 'var(--border)';
          let color: string = 'var(--muted-foreground)';
          if (isCurrent) {
            bg = 'var(--exam-accent)';
            border = 'var(--exam-accent)';
            color = 'var(--primary-foreground)';
          } else if (isFlagged) {
            bg = 'var(--state-flagged-bg)';
            border = 'var(--state-flagged-border)';
            color = 'var(--state-flagged-text)';
          } else if (isAnswered) {
            bg = 'var(--state-answered-bg)';
            border = 'var(--state-answered-border)';
            color = 'var(--state-answered-text)';
          }
          return <button key={i} onClick={() => {
            onNavigate(i);
            onClose();
          }} className="h-10 rounded-lg font-semibold text-sm transition-all hover:opacity-80 exam-focus relative" style={{
            backgroundColor: bg,
            border: `2px solid ${border}`,
            color
          }}>
                  {i + 1}
                  {q.required && !isAnswered && !isCurrent && <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white" style={{
              backgroundColor: 'var(--semantic-error-dot)'
            }} />}
                </button>;
        })}
          </div>}
      </div>

      <div className="p-3 border-t bg-slate-50 rounded-b-[16px] flex justify-between items-center text-xs" style={{
      borderColor: 'var(--border)'
    }}>
        <LegendItem color="var(--exam-accent)" label="Current" />
        <LegendItem color="var(--state-answered-border)" label="Answered" />
        <LegendItem color="var(--state-flagged-border)" label="Flagged" />
        <LegendItem color="var(--semantic-error-dot)" label="Required" isDot />
      </div>
    </div>;
}
function FilterButton({
  label,
  count,
  active,
  onClick
}: {label: string;count: number;active: boolean;onClick: () => void;}) {
  return <button onClick={onClick} className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${active ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
      {label}
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-slate-100' : 'bg-slate-200'}`}>
        {count}
      </span>
    </button>;
}
function LegendItem({
  color,
  label,
  isDot
}: {color: string;label: string;isDot?: boolean;}) {
  return <div className="flex items-center gap-1.5 text-slate-600">
      <div className={`${isDot ? 'w-2 h-2 rounded-full' : 'w-3 h-3 rounded-sm border-2'}`} style={{
      backgroundColor: isDot ? color : 'transparent',
      borderColor: color
    }} />
      <span>{label}</span>
    </div>;
}
