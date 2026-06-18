import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  Fragment } from
'react';
import { Question } from '../data/questions';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { Button as DSButton, Textarea as DSTextarea, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@exxatdesignux/ui';
const SHORTCUT_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
interface RendererProps {
  question: Question;
  selectedAnswer: any;
  onSelectAnswer: (questionId: number, answer: any) => void;
  voiceNarrator?: boolean;
}
function useNarrate(voiceNarrator?: boolean) {
  const speak = useCallback(
    (text: string) => {
      if (!voiceNarrator || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    },
    [voiceNarrator]
  );
  const stop = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);
  const narrateProps = useCallback(
    (text: string) =>
    voiceNarrator ?
    {
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
        e.currentTarget.style.outline =
        '2px solid var(--exam-accent-border)';
        e.currentTarget.style.outlineOffset = '-2px';
        speak(text);
      },
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
        e.currentTarget.style.outline = '';
        e.currentTarget.style.outlineOffset = '';
        stop();
      }
    } :
    {},
    [voiceNarrator, speak, stop]
  );
  return {
    speak,
    stop,
    narrateProps
  };
}
function KeyBadge({
  letter,
  isSelected



}: {letter: string;isSelected: boolean;}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-md font-bold text-[12px] shrink-0 transition-colors"
      style={{
        width: '2em',
        height: '2em',
        backgroundColor: isSelected ? 'var(--foreground)' : 'var(--muted)',
        color: isSelected ? 'var(--background)' : 'var(--muted-foreground)',
        border: isSelected ? 'none' : '1px solid var(--border)'
      }}>
      
      {letter}
    </span>);

}
function CrossOutButton({
  isCrossed,
  onClick



}: {isCrossed: boolean;onClick: (e: React.MouseEvent) => void;}) {
  return (
    <DSButton
      variant="outline"
      size="icon-xs"
      tabIndex={-1}
      onClick={onClick}
      className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 high-contrast-visible"
      aria-label={isCrossed ? 'Remove cross-out' : 'Cross out option'}
      style={{
        color: isCrossed ? 'var(--state-error-text-dark)' : 'var(--muted-foreground)',
        backgroundColor: isCrossed ? 'var(--muted)' : 'var(--card)',
      }}
    >
      <i className="fa-light fa-eye-slash" aria-hidden="true" style={{ fontSize: 14 }} />
    </DSButton>);

}
export function RadioMCQRenderer({
  question,
  selectedAnswer,
  onSelectAnswer,
  voiceNarrator
}: RendererProps) {
  const { narrateProps } = useNarrate(voiceNarrator);
  const [crossedOut, setCrossedOut] = useState<Set<string>>(new Set());
  const toggleCrossOut = (e: React.MouseEvent, option: string) => {
    e.stopPropagation();
    const next = new Set(crossedOut);
    if (next.has(option)) next.delete(option);else
    next.add(option);
    setCrossedOut(next);
  };
  const handleOptionClick = (option: string) => {
    if (crossedOut.has(option)) {
      // Undo cross-out and select the answer
      const next = new Set(crossedOut);
      next.delete(option);
      setCrossedOut(next);
    }
    onSelectAnswer(question.id, option);
  };
  const hasImages = question.optionImages && question.optionImages.length > 0;
  return (
    <div
      className={hasImages ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}
      role="radiogroup">
      
      {question.options?.map((option, idx) => {
        const isSelected = selectedAnswer === option;
        const isCrossed = crossedOut.has(option);
        const optionImage = question.optionImages?.[idx];
        return (
          <div key={idx} className={`group relative ${isCrossed ? 'opacity-40' : ''}`}>
            <div
              onClick={() => handleOptionClick(option)}
              onKeyDown={e => {
                if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleOptionClick(option); }
                if (e.key === 'x' || e.key === 'X') { e.preventDefault(); toggleCrossOut(e as unknown as React.MouseEvent, option); }
              }}
              tabIndex={0}
              className={`w-full text-left transition-all exam-focus flex ${hasImages ? 'flex-col' : 'flex-row items-center'} gap-3 p-[1em] pe-12 rounded-xl border-2`}
              style={{
                borderColor: isSelected && !isCrossed ? 'var(--foreground)' : 'var(--border)',
                backgroundColor: isSelected && !isCrossed ? 'var(--muted)' : 'var(--card)',
                cursor: 'pointer',
              }}
              role="radio"
              aria-checked={isSelected}
              aria-label={`Option ${SHORTCUT_KEYS[idx]}: ${option}. Click to select this answer.`}
              title={`Select option ${SHORTCUT_KEYS[idx]}`}
              {...narrateProps(`Option ${SHORTCUT_KEYS[idx]}: ${option}`)}>

              {optionImage &&
              <img
                src={optionImage}
                alt={`Option ${SHORTCUT_KEYS[idx]} image`}
                className="w-full h-32 object-cover rounded-lg" />
              }
              <div className="flex items-center gap-3 w-full">
                <KeyBadge
                  letter={SHORTCUT_KEYS[idx]}
                  isSelected={isSelected && !isCrossed} />
                <span
                  className={`text-[1em] flex-1 ${isCrossed ? 'line-through' : ''}`}
                  style={{ color: 'var(--foreground)' }}>
                  {option}
                </span>
              </div>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              <CrossOutButton
                isCrossed={isCrossed}
                onClick={(e) => toggleCrossOut(e, option)} />
            </div>
          </div>);

      })}
    </div>);

}
export function CheckboxRenderer({
  question,
  selectedAnswer,
  onSelectAnswer,
  voiceNarrator
}: RendererProps) {
  const { narrateProps } = useNarrate(voiceNarrator);
  const selectedSet = new Set<string>(selectedAnswer || []);
  const [crossedOut, setCrossedOut] = useState<Set<string>>(new Set());
  const toggleOption = (option: string) => {
    if (crossedOut.has(option)) {
      // Undo cross-out first
      const nextCrossed = new Set(crossedOut);
      nextCrossed.delete(option);
      setCrossedOut(nextCrossed);
    }
    const next = new Set(selectedSet);
    if (next.has(option)) next.delete(option);else
    next.add(option);
    onSelectAnswer(question.id, Array.from(next));
  };
  const toggleCrossOut = (e: React.MouseEvent, option: string) => {
    e.stopPropagation();
    const next = new Set(crossedOut);
    if (next.has(option)) next.delete(option);else
    next.add(option);
    setCrossedOut(next);
  };
  return (
    <div className="flex flex-col gap-3">
      {question.options?.map((option, idx) => {
        const isSelected = selectedSet.has(option);
        const isCrossed = crossedOut.has(option);
        return (
          <div key={idx} className={`group relative ${isCrossed ? 'opacity-40' : ''}`}>
            <div
              onClick={() => toggleOption(option)}
              onKeyDown={e => {
                if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleOption(option); }
                if (e.key === 'x' || e.key === 'X') { e.preventDefault(); toggleCrossOut(e as unknown as React.MouseEvent, option); }
              }}
              tabIndex={0}
              className="w-full text-left transition-all exam-focus flex items-center gap-4 p-[1em] pe-12 rounded-xl border-2"
              style={{
                borderColor: isSelected && !isCrossed ? 'var(--foreground)' : 'var(--border)',
                backgroundColor: isSelected && !isCrossed ? 'var(--muted)' : 'var(--card)',
                cursor: 'pointer',
              }}
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`Option ${SHORTCUT_KEYS[idx]}: ${option}. Click to toggle this selection.`}
              title={`Toggle option ${SHORTCUT_KEYS[idx]}`}
              {...narrateProps(`Option ${SHORTCUT_KEYS[idx]}: ${option}`)}>
              <KeyBadge
                letter={SHORTCUT_KEYS[idx]}
                isSelected={isSelected && !isCrossed} />
              <span
                className={`text-[1em] flex-1 ${isCrossed ? 'line-through' : ''}`}
                style={{ color: 'var(--foreground)' }}>
                {option}
              </span>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              <CrossOutButton
                isCrossed={isCrossed}
                onClick={(e) => toggleCrossOut(e, option)} />
            </div>
          </div>);

      })}
    </div>);

}
export function CrossOutRenderer({
  question,
  selectedAnswer,
  onSelectAnswer,
  voiceNarrator
}: RendererProps) {
  const { narrateProps } = useNarrate(voiceNarrator);
  const [crossedOut, setCrossedOut] = useState<Set<string>>(new Set());
  const toggleCrossOut = (e: React.MouseEvent, option: string) => {
    e.stopPropagation();
    const next = new Set(crossedOut);
    if (next.has(option)) next.delete(option);else
    next.add(option);
    setCrossedOut(next);
  };
  const handleOptionClick = (option: string) => {
    if (crossedOut.has(option)) {
      // Undo cross-out and select
      const next = new Set(crossedOut);
      next.delete(option);
      setCrossedOut(next);
    }
    onSelectAnswer(question.id, option);
  };
  return (
    <div className="flex flex-col gap-3" role="radiogroup">
      {question.options?.map((option, idx) => {
        const isSelected = selectedAnswer === option;
        const isCrossed = crossedOut.has(option);
        return (
          <div key={idx} className={`group relative ${isCrossed ? 'opacity-40' : ''}`}>
            <div
              onClick={() => handleOptionClick(option)}
              onKeyDown={e => {
                if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleOptionClick(option); }
                if (e.key === 'x' || e.key === 'X') { e.preventDefault(); toggleCrossOut(e as unknown as React.MouseEvent, option); }
              }}
              tabIndex={0}
              className="w-full text-left transition-all exam-focus flex items-center gap-4 rounded-xl border-2"
              style={{
                borderColor: isSelected ? 'var(--foreground)' : 'var(--border)',
                backgroundColor: isSelected ? 'var(--muted)' : 'var(--card)',
                padding: '1em',
                paddingInlineEnd: '3em',
                cursor: 'pointer',
              }}
              role="radio"
              aria-checked={isSelected}
              aria-label={`Option ${SHORTCUT_KEYS[idx]}: ${option}. Click to select, or use the cross-out button to eliminate.`}
              {...narrateProps(`Option ${SHORTCUT_KEYS[idx]}: ${option}`)}>
              <KeyBadge letter={SHORTCUT_KEYS[idx]} isSelected={isSelected} />
              <span
                className={`text-[1em] flex-1 text-left ${isCrossed ? 'line-through opacity-50' : ''}`}
                style={{ color: 'var(--foreground)' }}>
                {option}
              </span>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              <CrossOutButton
                isCrossed={isCrossed}
                onClick={(e) => toggleCrossOut(e, option)} />
            </div>
          </div>);

      })}
    </div>);

}
// Drag-to-highlight hook for Word-like text selection
function useDragHighlight(
selectedSet: Set<number>,
onUpdate: (indices: number[]) => void)
{
  const isDragging = useRef(false);
  const dragMode = useRef<'add' | 'remove'>('add');
  const draggedIndices = useRef<Set<number>>(new Set());
  const baseSet = useRef<Set<number>>(new Set());
  const onUpdateRef = useRef(onUpdate);
  const selectedSetRef = useRef(selectedSet);
  // Keep refs current
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);
  useEffect(() => {
    selectedSetRef.current = selectedSet;
  }, [selectedSet]);
  const applyDrag = useCallback(() => {
    const result = new Set(baseSet.current);
    draggedIndices.current.forEach((i) => {
      if (dragMode.current === 'add') result.add(i);else
      result.delete(i);
    });
    onUpdateRef.current(Array.from(result));
  }, []);
  const onMouseDown = useCallback(
    (idx: number) => {
      isDragging.current = true;
      baseSet.current = new Set(selectedSetRef.current);
      draggedIndices.current = new Set([idx]);
      dragMode.current = selectedSetRef.current.has(idx) ? 'remove' : 'add';
      applyDrag();
    },
    [applyDrag]
  );
  const onMouseEnter = useCallback(
    (idx: number) => {
      if (!isDragging.current) return;
      draggedIndices.current.add(idx);
      applyDrag();
    },
    [applyDrag]
  );
  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    draggedIndices.current = new Set();
  }, []);
  // Attach global mouseup listener
  useEffect(() => {
    const handler = () => {
      isDragging.current = false;
      draggedIndices.current = new Set();
    };
    window.addEventListener('mouseup', handler);
    return () => window.removeEventListener('mouseup', handler);
  }, []);
  return {
    onMouseDown,
    onMouseEnter,
    onMouseUp
  };
}
export function HighlightRenderer({
  question,
  selectedAnswer,
  onSelectAnswer
}: RendererProps) {
  const selectedSet = new Set<number>(selectedAnswer || []);
  const handleUpdate = useCallback(
    (indices: number[]) => {
      onSelectAnswer(question.id, indices);
    },
    [question.id, onSelectAnswer]
  );
  const { onMouseDown, onMouseEnter, onMouseUp } = useDragHighlight(
    selectedSet,
    handleUpdate
  );
  return (
    <div
      className="p-[1.5em] rounded-xl border leading-relaxed text-[1em] select-none"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--card)',
        color: 'var(--foreground)'
      }}>
      
      <p
        className="text-xs mb-3"
        style={{
          color: 'var(--muted-foreground)'
        }}>
        
        Click or drag to highlight sentences
      </p>
      {question.sentenceGroups?.map((sentence, idx) => {
        const isHighlighted = selectedSet.has(idx);
        return (
          <DSButton
            key={idx}
            variant="ghost"
            size="xs"
            type="button"
            onMouseDown={() => onMouseDown(idx)}
            onMouseEnter={() => onMouseEnter(idx)}
            onMouseUp={onMouseUp}
            onClick={(e) => {
              // Keyboard-activated clicks report detail 0; toggle once so Enter/Space work.
              if (e.detail === 0) {
                onMouseDown(idx);
                onMouseUp();
              }
            }}
            className={`inline-block h-auto whitespace-normal text-left text-[1em] font-normal leading-relaxed px-1 mx-0.5 ${isHighlighted ? 'highlight-glow' : ''}`}
            onMouseOver={(e) => {
              if (!isHighlighted)
              (e.currentTarget as HTMLElement).style.backgroundColor =
              'var(--muted)';
            }}
            onMouseOut={(e) => {
              if (!isHighlighted)
              (e.currentTarget as HTMLElement).style.backgroundColor = '';
            }}
            aria-pressed={isHighlighted}
            aria-label={`Sentence ${idx + 1}: ${sentence}. Click to highlight or unhighlight.`}
            title="Click to highlight">

            {sentence}
          </DSButton>);

      })}
    </div>);

}
export function ShortAnswerRenderer({
  question,
  selectedAnswer,
  onSelectAnswer
}: RendererProps) {
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    isSupported
  } = useSpeechToText();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (transcript) {
      const current = selectedAnswer || '';
      onSelectAnswer(question.id, current + (current ? ' ' : '') + transcript);
    }
  }, [transcript]);
  // Expose textarea ref for virtual keyboard
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.setAttribute('data-virtual-keyboard-target', 'true');
    }
  }, []);
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <DSTextarea
          ref={textareaRef}
          value={selectedAnswer || ''}
          onChange={(e) => onSelectAnswer(question.id, e.target.value)}
          className="w-full resize-y min-h-[200px] text-[1em]"
          placeholder="Type your answer here..."
          maxLength={question.maxChars}
          aria-label="Type your answer in this text area"
          title="Answer text area"
        />
        
        {isSupported &&
        <DSButton
          variant="ghost"
          size="icon-sm"
          onClick={isListening ? stopListening : startListening}
          className={`absolute bottom-4 right-4 rounded-full transition-all ${isListening ? 'mic-pulse-ring' : ''}`}
          style={{
            backgroundColor: isListening ? 'var(--exam-accent-light)' : 'var(--card)',
            color: isListening ? 'var(--exam-accent)' : 'var(--muted-foreground)',
            border: `1px solid ${isListening ? 'var(--exam-accent-border)' : 'var(--border)'}`,
            width: '2.75rem',
            height: '2.75rem',
          }}
          aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
        >
          <i className="fa-light fa-microphone" aria-hidden="true" style={{ fontSize: 20 }} />
        </DSButton>
        }
      </div>
      {question.maxChars &&
      <div
        className="text-right text-xs"
        style={{
          color: 'var(--muted-foreground)'
        }}>
        
          {(selectedAnswer || '').length} / {question.maxChars} characters
        </div>
      }
    </div>);

}
export function FillBlankRenderer({
  question,
  selectedAnswer,
  onSelectAnswer,
  voiceNarrator
}: RendererProps) {
  const { narrateProps } = useNarrate(voiceNarrator);
  const answers = selectedAnswer || {};
  const handleSelect = (blankId: string, val: string) => {
    onSelectAnswer(question.id, {
      ...answers,
      [blankId]: val
    });
  };
  const parts = question.passageTemplate?.split(/(\{\{.*?\}\})/) || [];
  return (
    <div
      className="p-[1.5em] rounded-xl border text-[1.125em]"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--card)',
        color: 'var(--foreground)',
        lineHeight: '2.8'
      }}>
      
      {parts.map((part, i) => {
        if (part.startsWith('{{') && part.endsWith('}}')) {
          const blankId = part.replace(/[{}]/g, '');
          const options = question.blanks?.[blankId] || [];
          return (
            <Select
              key={i}
              value={answers[blankId] || undefined}
              onValueChange={(val) => handleSelect(blankId, val)}>

              <SelectTrigger
                className="text-[0.8em] font-semibold align-middle"
                style={{
                  minWidth: '9em',
                  margin: '0 0.3em'
                }}
                aria-label={`Select the correct term for blank ${blankId}`}
                title={`Select answer for blank ${blankId}`}
                {...narrateProps(`Blank ${blankId}: choose the correct term`)}>

                <SelectValue placeholder="Choose an answer…" />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt, j) =>
                <SelectItem key={j} value={opt}>
                    {opt}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>);

        }
        return (
          <span key={i} className="align-middle">
            {part}
          </span>);

      })}
    </div>);

}
export function MatchingRenderer({
  question,
  selectedAnswer,
  onSelectAnswer,
  voiceNarrator
}: RendererProps) {
  const answers = selectedAnswer || {};
  return (
    <div className="flex flex-col gap-4">
      {question.matchPairs?.map((pair, idx) =>
      <div
        key={idx}
        className="flex items-center gap-4 p-[1em] rounded-xl border"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--card)'
        }}>
        
          <div
          className="flex-1 font-semibold text-[1em]"
          style={{
            color: 'var(--foreground)'
          }}>
          
            {pair.left}
          </div>
          <Select
          value={answers[pair.left] || undefined}
          onValueChange={(val) =>
          onSelectAnswer(question.id, {
            ...answers,
            [pair.left]: val
          })
          }>

            <SelectTrigger
            className="flex-1 text-[0.9375em]"
            aria-label={`Match "${pair.left}" with the correct option`}
            title={`Choose the matching term for "${pair.left}"`}
            onFocus={() => {
              if (voiceNarrator && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(
                  `Match ${pair.left} with: ${pair.rightOptions.join(', ')}`
                );
                window.speechSynthesis.speak(u);
              }
            }}
            onBlur={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            }}>

              <SelectValue placeholder="Choose a match…" />
            </SelectTrigger>
            <SelectContent>
              {pair.rightOptions.map((opt, j) =>
            <SelectItem key={j} value={opt}>
                {opt}
              </SelectItem>
            )}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>);

}
export function AnatomyRenderer({
  question,
  selectedAnswer,
  onSelectAnswer
}: RendererProps) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="relative inline-block border rounded-xl overflow-hidden"
      style={{
        borderColor: 'var(--border)'
      }}>
      
      {imgError ?
      <div
        className="w-full h-[400px] relative"
        style={{
          backgroundColor: 'var(--muted)'
        }}>
        
          {/* Schematic heart outline as fallback */}
          <svg
          viewBox="0 0 400 400"
          className="w-full h-full"
          aria-hidden="true">
          
            <defs>
              <linearGradient
              id="heartGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%">
              
                <stop
                offset="0%"
                style={{
                  stopColor: 'var(--exam-accent)',
                  stopOpacity: 0.15
                }} />
              
                <stop
                offset="100%"
                style={{
                  stopColor: 'var(--exam-accent)',
                  stopOpacity: 0.05
                }} />
              
              </linearGradient>
            </defs>
            {/* Simplified heart shape */}
            <path
            d="M200 350 C200 350 50 250 50 160 C50 100 100 60 150 60 C175 60 195 75 200 90 C205 75 225 60 250 60 C300 60 350 100 350 160 C350 250 200 350 200 350Z"
            fill="url(#heartGrad)"
            stroke="var(--exam-accent)"
            strokeWidth="2"
            strokeOpacity="0.3" />
          
            {/* Chamber dividers */}
            <line
            x1="200"
            y1="90"
            x2="200"
            y2="300"
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="4 4" />
          
            <line
            x1="100"
            y1="200"
            x2="300"
            y2="200"
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="4 4" />
          
            <text
            x="200"
            y="30"
            textAnchor="middle"
            className=""
            style={{
              fontSize: '12px',
              fill: 'var(--muted-foreground)'
            }}>
            
              Select a hotspot on the diagram
            </text>
          </svg>
        </div> :

      <img
        src={question.diagramUrl}
        alt="Anatomy diagram"
        className="max-w-full h-auto block"
        onError={() => setImgError(true)} />

      }
      {question.hotspots?.map((spot) => {
        const isSelected = selectedAnswer === spot.id;
        return (
          <DSButton
            key={spot.id}
            variant="ghost"
            size="icon-sm"
            onClick={() => onSelectAnswer(question.id, spot.id)}
            className="absolute rounded-full border-2 transition-all exam-focus"
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: '1.5em',
              height: '1.5em',
              marginLeft: '-0.75em',
              marginTop: '-0.75em',
              backgroundColor: isSelected ? 'var(--exam-accent)' : 'rgba(255,255,255,0.8)',
              borderColor: isSelected ? 'var(--exam-accent-text)' : 'var(--exam-accent)',
              boxShadow: isSelected ? '0 0 0 4px var(--exam-accent-light)' : 'none',
              padding: 0,
            }}
            aria-label={spot.label}
          />);


      })}
    </div>);

}
export function TableRenderer({
  question,
  selectedAnswer,
  onSelectAnswer
}: RendererProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border overflow-hidden">
        <Table className="border-separate border-spacing-0">
          <TableHeader>
            <TableRow>
              {question.tableData?.headers.map((h, i) => (
                <TableHead key={i} className="h-9 px-3 text-xs font-medium text-muted-foreground tracking-wide bg-dt-header-bg">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {question.tableData?.rows.map((row, i) => (
              <TableRow key={i}>
                {row.map((cell, j) => (
                  <TableCell key={j} className="px-3 py-2.5">{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <RadioMCQRenderer
        question={question}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={onSelectAnswer} />
      
    </div>);

}
export function PDFRenderer({
  question,
  selectedAnswer,
  onSelectAnswer
}: RendererProps) {
  return (
    <div className="flex flex-col gap-6">
      <div
        className="w-full h-[600px] border rounded-xl overflow-hidden"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--muted)'
        }}>
        
        <iframe
          src={question.pdfUrl}
          className="w-full h-full"
          title="PDF Viewer" />
        
      </div>
      <RadioMCQRenderer
        question={question}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={onSelectAnswer} />
      
    </div>);

}
export function EssayRenderer({
  question,
  selectedAnswer,
  onSelectAnswer
}: RendererProps) {
  const answerText = selectedAnswer || '';
  const wordCount = answerText.trim() ?
  answerText.trim().split(/\s+/).length :
  0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    isSupported
  } = useSpeechToText();
  useEffect(() => {
    if (transcript) {
      const current = selectedAnswer || '';
      onSelectAnswer(question.id, current + (current ? ' ' : '') + transcript);
    }
  }, [transcript]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.setAttribute('data-virtual-keyboard-target', 'true');
    }
  }, []);
  return (
    <div className="flex flex-col gap-4">
      {question.essayPrompt &&
      <div
        className="p-[1.5em] border rounded-xl text-[1em]"
        style={{
          backgroundColor: 'var(--muted)',
          borderColor: 'var(--border)',
          color: 'var(--foreground)'
        }}>

          <strong>Prompt:</strong> {question.essayPrompt}
        </div>
      }
      <div className="relative">
        <DSTextarea
          ref={textareaRef}
          value={answerText}
          onChange={(e) => onSelectAnswer(question.id, e.target.value)}
          className="w-full resize-y min-h-[300px] text-[1em]"
          style={{
            borderColor: isListening ? 'var(--exam-accent)' : undefined,
          }}
          placeholder="Begin typing your essay here..."
          aria-label="Type your essay answer in this text area"
          title="Essay text area"
        />
        
        {isSupported &&
        <DSButton
          variant="ghost"
          size="icon-sm"
          onClick={isListening ? stopListening : startListening}
          className={`absolute bottom-4 right-4 rounded-full transition-all ${isListening ? 'mic-pulse-ring' : ''}`}
          style={{
            backgroundColor: isListening ? 'var(--exam-accent-light)' : 'var(--card)',
            color: isListening ? 'var(--exam-accent)' : 'var(--muted-foreground)',
            border: `1px solid ${isListening ? 'var(--exam-accent-border)' : 'var(--border)'}`,
            width: '2.75rem',
            height: '2.75rem',
          }}
          aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
        >
          <i className="fa-light fa-microphone" aria-hidden="true" style={{ fontSize: 20 }} />
        </DSButton>
        }
      </div>
      <div
        className="flex justify-between items-center text-[0.875em]"
        style={{
          color: 'var(--muted-foreground)'
        }}>
        
        <div>
          {question.essayPages &&
          <span>Pages required: {question.essayPages} | </span>
          }
          <span>
            Min words: {question.essayMinWords || 0} | Max words:{' '}
            {question.essayMaxWords || 'None'}
          </span>
        </div>
        <div
          className="font-bold"
          style={{ color: question.essayMinWords && wordCount < question.essayMinWords ? 'var(--state-warning-dark)' : 'var(--state-success-dark)' }}>
          
          Current word count: {wordCount}
        </div>
      </div>
    </div>);

}
export function WordHighlightRenderer({
  question,
  selectedAnswer,
  onSelectAnswer
}: RendererProps) {
  const selectedSet = new Set<number>(selectedAnswer || []);
  const words = question.wordHighlightPassage?.split(' ') || [];
  const handleUpdate = useCallback(
    (indices: number[]) => {
      onSelectAnswer(question.id, indices);
    },
    [question.id, onSelectAnswer]
  );
  const { onMouseDown, onMouseEnter, onMouseUp } = useDragHighlight(
    selectedSet,
    handleUpdate
  );
  return (
    <div
      className="p-[1.5em] rounded-xl border leading-loose text-[1.125em] select-none"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--card)',
        color: 'var(--foreground)'
      }}>
      
      <p
        className="text-xs mb-3"
        style={{
          color: 'var(--muted-foreground)'
        }}>

        Click or drag across words to highlight
      </p>
      {words.map((word, idx) => {
        const isHighlighted = selectedSet.has(idx);
        return (
          <Fragment key={idx}>
            <DSButton
              variant="ghost"
              size="xs"
              type="button"
              onMouseDown={() => onMouseDown(idx)}
              onMouseEnter={() => onMouseEnter(idx)}
              onMouseUp={onMouseUp}
              onClick={(e) => {
                // Keyboard-activated clicks report detail 0; toggle once so Enter/Space work.
                if (e.detail === 0) {
                  onMouseDown(idx);
                  onMouseUp();
                }
              }}
              className={`inline-block h-auto whitespace-normal text-[1em] font-normal px-0.5 ${isHighlighted ? 'highlight-glow' : ''}`}
              onMouseOver={(e) => {
                if (!isHighlighted)
                (e.currentTarget as HTMLElement).style.backgroundColor =
                'var(--muted)';
              }}
              onMouseOut={(e) => {
                if (!isHighlighted)
                (e.currentTarget as HTMLElement).style.backgroundColor = '';
              }}
              aria-pressed={isHighlighted}
              aria-label={`Word ${idx + 1}: ${word}. Click to highlight or unhighlight.`}
              title="Click to highlight">

              {word}
            </DSButton>{' '}
          </Fragment>);

      })}
    </div>);

}
export function PassageRenderer({
  question,
  selectedAnswer,
  onSelectAnswer
}: RendererProps) {
  return (
    <div className="flex flex-col gap-6">
      <div
        className="p-[1.5em] border rounded-xl overflow-y-auto max-h-[400px] text-[1em] leading-relaxed"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--muted)',
          color: 'var(--foreground)'
        }}>

        {question.passageText}
      </div>
      <RadioMCQRenderer
        question={question}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={onSelectAnswer} />
      
    </div>);

}
export function ChartRenderer({ question }: RendererProps) {
  if (!question.chartData) return null;
  const { title, caption, xLabels, series } = question.chartData;
  // Simple SVG line chart rendering
  const width = 600;
  const height = 300;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  // Find max value for scaling
  const allValues = series.flatMap((s) => s.values);
  const maxVal = Math.max(...allValues);
  const minVal = Math.min(...allValues);
  const range = maxVal - minVal || 1;
  return (
    <div className="flex flex-col gap-4 w-full">
      <div
        className="w-full p-4 rounded-xl border flex flex-col items-center"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--card)'
        }}>
        
        <h3
          className="font-bold mb-4"
          style={{
            color: 'var(--foreground)'
          }}>
          
          {title}
        </h3>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-w-2xl"
          role="img"
          aria-label={caption}>
          
          <title>{title}</title>
          <desc>{caption}</desc>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) =>
          <line
            key={i}
            x1={padding}
            y1={padding + chartHeight * pct}
            x2={width - padding}
            y2={padding + chartHeight * pct}
            stroke="var(--border)"
            strokeWidth="1" />

          )}

          {/* X-axis labels */}
          {xLabels.map((label, i) => {
            const x = padding + chartWidth / (xLabels.length - 1) * i;
            return (
              <text
                key={i}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="12"
                fill="var(--muted-foreground)"
                className="">
                
                {label}
              </text>);

          })}

          {/* Lines and points */}
          {series.map((s, sIdx) => {
            const points = s.values.
            map((val, i) => {
              const x = padding + chartWidth / (xLabels.length - 1) * i;
              const y =
              padding + chartHeight - (val - minVal) / range * chartHeight;
              return `${x},${y}`;
            }).
            join(' ');
            return (
              <g key={sIdx}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="3" />
                
                {s.values.map((val, i) => {
                  const x = padding + chartWidth / (xLabels.length - 1) * i;
                  const y =
                  padding +
                  chartHeight -
                  (val - minVal) / range * chartHeight;
                  return <circle key={i} cx={x} cy={y} r="4" fill={s.color} />;
                })}
              </g>);

          })}

          {/* Legend */}
          <g transform={`translate(${padding}, 15)`}>
            {series.map((s, i) =>
            <g key={i} transform={`translate(${i * 150}, 0)`}>
                <rect
                x="0"
                y="0"
                width="12"
                height="12"
                fill={s.color}
                rx="2" />
              
                <text
                x="20"
                y="10"
                fontSize="12"
                fill="var(--muted-foreground)"
                className="">
                
                  {s.name}
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>
    </div>);

}