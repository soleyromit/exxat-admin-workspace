import React, { useEffect, useRef } from 'react';
import {
  XIcon,
  FileTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ZapIcon } from
'lucide-react';
import { tokens } from '../tokens/design-tokens';
import { Question } from '../data/questions';
export interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  showQuestionNavInHamburger?: boolean;
  questions: Question[];
  currentIndex: number;
  answeredSet: Set<number>;
  flaggedSet: Set<number>;
  onNavigate: (index: number) => void;
}
export function SidebarDrawer({
  isOpen,
  onClose,
  questions,
  currentIndex,
  answeredSet,
  flaggedSet,
  onNavigate
}: SidebarDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handler);
      drawerRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity"
        style={{
          backgroundColor: tokens.surface.overlay
        }}
        onClick={onClose}
        aria-hidden="true" />
      

      {/* Drawer */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="relative w-full max-w-sm h-full shadow-2xl flex flex-col animate-slide-in-left outline-none transition-colors"
        style={{
          backgroundColor: 'var(--surface-white)'
        }}
        role="dialog"
        aria-label="Exam Information">
        
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{
            borderColor: 'var(--border-default)'
          }}>
          
          <div className="flex items-center gap-3">
            <img
              src="/exxat_header_logo.svg"
              alt="Exxat"
              className="h-6" />
            
            <div
              className="w-px h-5"
              style={{
                backgroundColor: tokens.border.default
              }} />
            
            <span
              className="font-heading font-semibold text-xs px-2 py-0.5 rounded-full"
              style={{
                color: 'var(--exam-accent)',
                backgroundColor: 'var(--exam-accent-light)',
                border: '1px solid var(--exam-accent-border)'
              }}>
              
              Attempt #1
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors exam-focus"
            style={{
              color: 'var(--text-muted)'
            }}
            aria-label="Close sidebar">
            
            <XIcon size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <h2
              className="font-heading font-bold text-xl mb-1"
              style={{
                color: 'var(--text-primary)'
              }}>
              
              Introduction to Pathology
            </h2>
            <p
              className="font-heading text-sm"
              style={{
                color: 'var(--text-subtle)'
              }}>
              
              Midterm Examination • Fall 2026
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<FileTextIcon size={16} />}
              label="Questions"
              value={`${questions.length} Total`}
              color="var(--exam-accent)"
              bg="var(--exam-accent-light)" />
            
            <StatCard
              icon={<ClockIcon size={16} />}
              label="Time Limit"
              value="60 Mins"
              color="#F59E0B"
              bg="#FFFBEB" />
            
            <StatCard
              icon={<CheckCircleIcon size={16} />}
              label="Passing"
              value="70%"
              color="#22C55E"
              bg="#F0FDF4" />
            
            <StatCard
              icon={<ZapIcon size={16} />}
              label="Difficulty"
              value="Medium"
              color="#A855F7"
              bg="#FAF5FF" />
            
          </div>

          <div>
            <h3
              className="font-heading font-bold text-xs uppercase tracking-wider mb-3"
              style={{
                color: 'var(--text-primary)'
              }}>
              
              Instructions
            </h3>
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: 'var(--exam-accent-light)',
                border: '1px solid var(--exam-accent-border)'
              }}>
              
              <ul className="space-y-2">
                <InstructionItem text="Read each question carefully before attempting." />
                <InstructionItem text="You can flag questions for review and return to them later." />
                <InstructionItem text="Use keyboard shortcuts A-D to quickly select answers." />
                <InstructionItem text="Required questions are marked with a red indicator." />
              </ul>
            </div>
          </div>

          {/* Question Navigator — always shown */}
          <div>
            <h3
              className="font-heading font-bold text-xs uppercase tracking-wider mb-3"
              style={{
                color: 'var(--text-primary)'
              }}>
              
              Question Navigator
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const isCurrent = i === currentIndex;
                const isAnswered = answeredSet.has(i);
                const isFlagged = flaggedSet.has(i);
                let bg = 'var(--surface-white)';
                let border = 'var(--border-medium)';
                let color = 'var(--text-muted)';
                if (isCurrent) {
                  bg = 'var(--exam-accent)';
                  border = 'var(--exam-accent)';
                  color = '#FFFFFF';
                } else if (isFlagged) {
                  bg = 'var(--state-flagged-bg)';
                  border = 'var(--state-flagged-border)';
                  color = 'var(--state-flagged-text)';
                } else if (isAnswered) {
                  bg = 'var(--state-answered-bg)';
                  border = 'var(--state-answered-border)';
                  color = 'var(--state-answered-text)';
                }
                return (
                  <button
                    key={i}
                    onClick={() => {
                      onNavigate(i);
                      onClose();
                    }}
                    className="h-10 rounded-lg font-heading font-semibold text-sm transition-all hover:opacity-80 exam-focus relative flex items-center justify-center"
                    style={{
                      backgroundColor: bg,
                      border: `1px solid ${border}`,
                      color
                    }}>
                    
                    {i + 1}
                    {q.required && !isAnswered && !isCurrent &&
                    <span
                      className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2"
                      style={{
                        backgroundColor: 'var(--semantic-error-dot)',
                        borderColor: 'var(--surface-white)'
                      }} />

                    }
                  </button>);

              })}
            </div>
          </div>
        </div>
      </div>
    </div>);

}
function StatCard({
  icon,
  label,
  value,
  color,
  bg






}: {icon: React.ReactNode;label: string;value: string;color: string;bg: string;}) {
  return (
    <div
      className="p-3 rounded-xl border"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--surface-white)'
      }}>
      
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{
            backgroundColor: bg,
            color
          }}>
          
          {icon}
        </div>
        <span
          className="font-heading text-xs font-medium"
          style={{
            color: 'var(--text-subtle)'
          }}>
          
          {label}
        </span>
      </div>
      <p
        className="font-heading font-bold text-sm"
        style={{
          color: 'var(--text-primary)'
        }}>
        
        {value}
      </p>
    </div>);

}
function InstructionItem({ text }: {text: string;}) {
  return (
    <li
      className="flex items-start gap-2 font-heading text-sm"
      style={{
        color: 'var(--text-secondary)'
      }}>
      
      <span
        style={{
          color: 'var(--exam-accent)',
          marginTop: '5px',
          fontSize: '10px'
        }}>
        
        ●
      </span>
      {text}
    </li>);

}