/**
 * Question comment box — Aarti-mandated:
 *
 *   "During an exam, students should be able to flag questions they believe
 *    have errors via a comment box. Faculty would review these post-exam,
 *    not in real time."
 *
 * Visibility is institution/course-level (assessment.allowComments). Surfaced
 * here unconditionally; parent decides whether to render based on that flag.
 */

import { useState } from 'react';
import { Button, Textarea } from '@exxatdesignux/ui';

export interface QuestionCommentBoxProps {
  questionId: number;
  initialComment?: string;
  onSave?: (questionId: number, comment: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function QuestionCommentBox({ questionId, initialComment = '', onSave, isOpen, onClose }: QuestionCommentBoxProps) {
  const [text, setText] = useState(initialComment);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave?.(questionId, text.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="mt-6 rounded-xl"
      style={{
        background: 'var(--state-warning-bg)',
        border: '1px solid var(--state-warning-border)',
        padding: '16px 20px',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <i
            className="fa-light fa-triangle-exclamation"
            aria-hidden="true"
            style={{ color: 'var(--state-warning-darkest)', fontSize: 14 }}
          />
          <p
            className="font-bold"
            style={{ color: 'var(--state-warning-darkest)', fontSize: 12 }}
          >
            Report issue to faculty
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close comment box"
        >
          <i className="fa-light fa-xmark" aria-hidden="true" />
        </Button>
      </div>

      <p className="mb-3" style={{ color: 'var(--foreground)', fontSize: 12 }}>
        Describe the issue (typo, ambiguous wording, suspected error). Faculty will review post-exam — you will not receive a real-time response.
      </p>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="e.g. Option C and D appear to describe the same condition…"
        aria-label="Question comment"
        className="bg-card"
      />

      <div className="flex items-center justify-between gap-3 mt-3">
        <span
          style={{
            fontSize: 12,
            color: saved ? 'var(--state-success-dark)' : 'var(--muted-foreground)',
            fontWeight: saved ? 600 : 400,
          }}
          aria-live="polite"
        >
          {saved ? (
            <>
              <i className="fa-solid fa-check" aria-hidden="true" /> Comment saved · Faculty will review
            </>
          ) : (
            'Saved comments are submitted with your exam'
          )}
        </span>
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={text.trim().length === 0}
          aria-label="Save comment"
        >
          <i className="fa-light fa-floppy-disk" aria-hidden="true" />
          Save Comment
        </Button>
      </div>
    </div>
  );
}
