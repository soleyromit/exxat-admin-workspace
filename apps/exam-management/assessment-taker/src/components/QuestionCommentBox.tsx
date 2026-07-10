import { useState } from 'react';
import { Button, Card, CardContent, CardFooter, CardHeader, Textarea } from '@exxatdesignux/ui';

export interface QuestionCommentBoxProps {
  questionId: number;
  initialComment?: string;
  onSave?: (questionId: number, comment: string) => void;
  onClose?: () => void;
}

export function QuestionCommentBox({ questionId, initialComment = '', onSave, onClose }: QuestionCommentBoxProps) {
  const [text, setText] = useState(initialComment);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave?.(questionId, text.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card
      role="complementary"
      aria-label="Report issue to faculty"
      className="flex flex-col flex-shrink-0 self-start overflow-hidden"
      style={{ width: 360 }}
    >
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0 border-b border-border px-4 py-3 space-y-0">
        <div className="flex items-center gap-2">
          <i
            className="fa-light fa-triangle-exclamation fa-fw text-sm"
            aria-hidden="true"
            style={{ color: 'var(--state-warning-darkest)' }}
          />
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Report issue to faculty
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close report panel">
          <i className="fa-light fa-xmark text-sm" aria-hidden="true" />
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4 py-4">
        <p className="text-sm leading-relaxed shrink-0" style={{ color: 'var(--muted-foreground)' }}>
          Describe the issue (typo, ambiguous wording, suspected error). Faculty will review post-exam — you will not receive a real-time response.
        </p>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Option C and D appear to describe the same condition…"
          aria-label="Describe the issue"
          className="resize-none min-h-[200px]"
        />

        <p
          aria-live="polite"
          className="text-xs"
          style={{
            color: saved ? 'var(--state-success-dark)' : 'var(--muted-foreground)',
            fontWeight: saved ? 600 : 400,
          }}
        >
          {saved ? (
            <>
              <i className="fa-solid fa-check me-1" aria-hidden="true" />
              Saved · Faculty will review post-exam
            </>
          ) : (
            'Saved comments are submitted with your exam'
          )}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-end gap-2 flex-shrink-0 border-t border-border px-4 py-3">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={text.trim().length === 0}
        >
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}
