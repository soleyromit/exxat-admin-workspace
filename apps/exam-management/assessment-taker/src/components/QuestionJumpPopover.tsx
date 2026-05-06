import React, { useEffect, useState, useRef } from 'react';
import { Question } from '../data/questions';
export interface QuestionJumpPopoverProps {
  questions: Question[];
  currentIndex: number;
  answeredSet: Set<number>;
  flaggedSet: Set<number>;
  onNavigate: (index: number) => void;
  isOpen: boolean;
  onClose: () => void;
}
interface GroupedQuestion {
  index: number;
  question: Question;
}
export function QuestionJumpPopover({
  questions,
  currentIndex,
  answeredSet,
  flaggedSet,
  onNavigate,
  isOpen,
  onClose
}: QuestionJumpPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>>(
    {
      unanswered: false,
      answered: false,
      flagged: false
    });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  // Group questions by status
  const answered: GroupedQuestion[] = [];
  const flagged: GroupedQuestion[] = [];
  const unanswered: GroupedQuestion[] = [];
  questions.forEach((q, i) => {
    const entry = {
      index: i,
      question: q
    };
    if (flaggedSet.has(i)) {
      flagged.push(entry);
    } else if (answeredSet.has(i)) {
      answered.push(entry);
    } else {
      unanswered.push(entry);
    }
  });
  const answeredCount = answered.length;
  const flaggedCount = flagged.length;
  const unansweredCount = unanswered.length;
  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const truncate = (text: string, max: number) =>
  text.length > max ? text.slice(0, max) + '…' : text;
  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-2 z-50 animate-pop-in flex flex-col overflow-hidden"
      style={{
        width: '320px',
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
      }}>
      
      <div
        className="w-full"
        style={{
          height: '1px',
          backgroundColor: 'var(--border)'
        }} />
      

      {/* Scrollable sections */}
      <div
        className="overflow-y-auto"
        style={{
          maxHeight: '340px'
        }}>
        
        {/* Flagged Section — shown first when there are flagged questions */}
        {flaggedCount > 0 &&
        <>
            <SectionGroup
            title="Flagged"
            count={flaggedCount}
            items={flagged}
            isCollapsed={collapsedSections.flagged}
            onToggle={() => toggleSection('flagged')}
            currentIndex={currentIndex}
            onNavigate={onNavigate}
            onClose={onClose}
            truncate={truncate}
            badgeColor="var(--state-flagged-text)"
            badgeBg="var(--state-flagged-bg)"
            renderIcon={() =>
            <i className="fa-solid fa-flag" aria-hidden="true" style={{ fontSize: 13, color: 'var(--state-flagged-text)' }} />

            } />
          
            <div
            className="w-full"
            style={{
              height: '1px',
              backgroundColor: 'var(--border)'
            }} />
          
          </>
        }

        {/* Unanswered Section */}
        <SectionGroup
          title="Unanswered"
          count={unansweredCount}
          items={unanswered}
          isCollapsed={collapsedSections.unanswered}
          onToggle={() => toggleSection('unanswered')}
          currentIndex={currentIndex}
          onNavigate={onNavigate}
          onClose={onClose}
          truncate={truncate}
          badgeColor="var(--muted-foreground)"
          badgeBg="var(--muted)"
          renderIcon={() =>
          <i className="fa-light fa-circle" aria-hidden="true" style={{ fontSize: 14, color: 'var(--muted-foreground)' }} />

          } />
        

        <div
          className="w-full"
          style={{
            height: '1px',
            backgroundColor: 'var(--border)'
          }} />
        

        {/* Answered Section */}
        <SectionGroup
          title="Answered"
          count={answeredCount}
          items={answered}
          isCollapsed={collapsedSections.answered}
          onToggle={() => toggleSection('answered')}
          currentIndex={currentIndex}
          onNavigate={onNavigate}
          onClose={onClose}
          truncate={truncate}
          badgeColor="var(--state-answered-text)"
          badgeBg="var(--state-answered-bg)"
          renderIcon={() =>
          <i className="fa-solid fa-circle-check" aria-hidden="true" style={{ fontSize: 14, color: 'var(--state-answered-text)' }} />

          } />
        
      </div>
    </div>);

}
/* ── Section Group Sub-component ─────────────────────────────────────────── */
interface SectionGroupProps {
  title: string;
  count: number;
  items: GroupedQuestion[];
  isCollapsed: boolean;
  onToggle: () => void;
  currentIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
  truncate: (text: string, max: number) => string;
  badgeColor: string;
  badgeBg: string;
  renderIcon: () => React.ReactNode;
}
function SectionGroup({
  title,
  count,
  items,
  isCollapsed,
  onToggle,
  currentIndex,
  onNavigate,
  onClose,
  truncate,
  badgeColor,
  badgeBg,
  renderIcon
}: SectionGroupProps) {
  return (
    <div>
      {/* Section header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:opacity-80"
        style={{
          backgroundColor: 'var(--muted)'
        }}>

        <i
          className={`fa-light ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`}
          aria-hidden="true"
          style={{ fontSize: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
        
        <span
          className="font-semibold text-xs flex-1"
          style={{
            color: 'var(--foreground)'
          }}>
          
          {title}
        </span>
        <span
          className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            color: badgeColor,
            backgroundColor: badgeBg
          }}>
          
          {count}
        </span>
      </button>

      {/* Section items */}
      {!isCollapsed &&
      <div className="flex flex-col">
          {items.length === 0 ?
        <div
          className="px-3 py-3 text-[11px]"
          style={{
            color: 'var(--muted-foreground)'
          }}>
          
              No questions in this group
            </div> :

        items.map(({ index: i, question: q }) => {
          const isCurrent = i === currentIndex;
          return (
            <button
              key={i}
              onClick={() => {
                onNavigate(i);
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all hover:opacity-80 exam-focus"
              style={{
                backgroundColor: isCurrent ?
                'var(--exam-accent-light)' :
                'transparent',
                borderLeft: isCurrent ?
                '3px solid var(--exam-accent)' :
                '3px solid transparent'
              }}>
              
                  {/* Question number */}
                  <span
                className="font-bold text-xs w-6 text-center flex-shrink-0"
                style={{
                  color: isCurrent ?
                  'var(--exam-accent)' :
                  'var(--foreground)'
                }}>
                
                    {i + 1}
                  </span>

                  {/* Question text preview */}
                  <span
                className="text-[11px] leading-snug flex-1 truncate"
                style={{
                  color: isCurrent ?
                  'var(--exam-accent)' :
                  'var(--muted-foreground)'
                }}>
                
                    {truncate(q.text, 40)}
                  </span>

                  {/* Status icon */}
                  <span className="flex-shrink-0">{renderIcon()}</span>
                </button>);

        })
        }
        </div>
      }
    </div>);

}