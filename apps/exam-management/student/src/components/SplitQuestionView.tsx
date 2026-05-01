import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  CalculatorIcon,
  KeyboardIcon,
  ImageOffIcon,
  FileTextIcon,
  LoaderIcon } from
'lucide-react';
import { Question, QuestionType } from '../data/questions';
import { Tooltip } from './Tooltip';
/* ── Keyboard shortcut hints per question type ──────────────────────────── */
interface ShortcutDef {
  keys: string[];
  label: string;
}
function getShortcutsForType(type: QuestionType): ShortcutDef[] {
  const nav: ShortcutDef[] = [
  {
    keys: ['←', '→'],
    label: 'Navigate'
  },
  {
    keys: ['Enter'],
    label: 'Next'
  },
  {
    keys: ['Z'],
    label: 'Flag'
  }];

  switch (type) {
    case 'mcq':
    case 'image-mcq':
    case 'video-mcq':
    case 'audio':
    case 'case-study':
    case 'combined':
    case 'table':
    case 'pdf':
    case 'passage':
    case 'chart':
    case 'cross-out':
    case 'checkbox':
      return nav;
    case 'short-answer':
    case 'essay':
      return [
      {
        keys: ['Tab'],
        label: 'Exit text field'
      },
      ...nav];

    case 'fill-blank':
    case 'matching':
    case 'dropdown':
      return [
      {
        keys: ['Tab'],
        label: 'Next field'
      },
      ...nav];

    case 'highlight':
    case 'word-highlight':
      return [
      {
        keys: ['Click'],
        label: 'Select text'
      },
      ...nav];

    case 'anatomy':
      return [
      {
        keys: ['Click'],
        label: 'Place pin'
      },
      ...nav];

    default:
      return nav;
  }
}
function ShortcutHints({ type }: {type: QuestionType;}) {
  const shortcuts = getShortcutsForType(type);
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {shortcuts.map((s, i) =>
      <span key={i} className="flex items-center gap-1.5">
          <span className="flex gap-0.5">
            {s.keys.map((k, j) =>
          <kbd
            key={j}
            className="font-mono text-xs font-bold px-1.5 py-0.5 rounded"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border-default)'
            }}>
            
                {k}
              </kbd>
          )}
          </span>
          <span
          className="text-xs font-heading"
          style={{
            color: 'var(--text-muted)'
          }}>
          
            {s.label}
          </span>
        </span>
      )}
    </div>);

}
function TabScrollContainer({
  children,
  style



}: {children: React.ReactNode;style?: React.CSSProperties;}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);
  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setFadeLeft(el.scrollLeft > 4);
    setFadeRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateFades();
    el.addEventListener('scroll', updateFades, {
      passive: true
    });
    const ro = new ResizeObserver(updateFades);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateFades);
      ro.disconnect();
    };
  }, [updateFades]);
  return (
    <div
      className={`tab-scroll-container shrink-0 ${fadeLeft ? 'fade-left' : ''} ${fadeRight ? 'fade-right' : ''}`}
      style={style}>
      
      <div
        ref={scrollRef}
        className="tab-scroll-hide flex overflow-x-auto"
        role="tablist">
        
        {children}
      </div>
    </div>);

}
function ImagePanel({ src, alt }: {src: string;alt: string;}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden border flex items-center justify-center relative"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--surface-subtle)',
        minHeight: '280px'
      }}>
      
      {error ?
      <div
        className="flex flex-col items-center gap-3 py-12"
        style={{
          color: 'var(--text-muted)'
        }}>
        
          <ImageOffIcon size={40} strokeWidth={1.5} />
          <span className="font-heading text-sm">
            Image could not be loaded
          </span>
        </div> :

      <>
          {!loaded &&
        <div
          className="flex flex-col items-center gap-3 py-12 absolute inset-0 z-10 justify-center"
          style={{
            color: 'var(--text-muted)'
          }}>
          
              <LoaderIcon size={24} className="animate-spin" />
              <span className="font-heading text-sm">Loading image…</span>
            </div>
        }
          <img
          src={src}
          alt={alt}
          className="w-full h-auto object-contain rounded-lg"
          style={{
            maxHeight: '500px',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)} />
        
        </>
      }
    </div>);

}
import {
  RadioMCQRenderer,
  CheckboxRenderer,
  CrossOutRenderer,
  HighlightRenderer,
  ShortAnswerRenderer,
  FillBlankRenderer,
  MatchingRenderer,
  AnatomyRenderer,
  TableRenderer,
  PDFRenderer,
  EssayRenderer,
  WordHighlightRenderer,
  PassageRenderer,
  ChartRenderer } from
'./QuestionRenderers';
import { CalculatorPopover } from './CalculatorPopover';
import { VirtualKeyboard } from './VirtualKeyboard';
export interface SplitQuestionViewProps {
  question: Question;
  questionIndex: number;
  selectedAnswer: any;
  onSelectAnswer: (questionId: number, answer: any) => void;
  zoomPercent: number;
  showCalculator?: boolean;
  showKeyboard?: boolean;
  onToggleCalculator?: () => void;
  onToggleKeyboard?: () => void;
  needsCalculator?: boolean;
  needsKeyboard?: boolean;
  voiceNarrator?: boolean;
}
export function SplitQuestionView({
  question,
  questionIndex,
  selectedAnswer,
  onSelectAnswer,
  zoomPercent,
  showCalculator = false,
  showKeyboard = false,
  onToggleCalculator,
  onToggleKeyboard,
  needsCalculator = false,
  needsKeyboard = false,
  voiceNarrator = false
}: SplitQuestionViewProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const pdfTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    setActiveTab(0);
    setPdfLoaded(false);
    setPdfError(false);
  }, [question.id]);
  // PDF load detection: if iframe hasn't signaled load after 5s, show fallback
  useEffect(() => {
    if (question.type === 'pdf' && question.pdfUrl) {
      setPdfLoaded(false);
      setPdfError(false);
      pdfTimerRef.current = setTimeout(() => {
        setPdfError(true);
      }, 5000);
    }
    return () => {
      if (pdfTimerRef.current) clearTimeout(pdfTimerRef.current);
    };
  }, [question.id, question.type, question.pdfUrl]);
  // Voice Narrator
  useEffect(() => {
    if (voiceNarrator && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Question ${questionIndex + 1}. ${question.text}`
      );
      window.speechSynthesis.speak(utterance);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [question.id, question.text, questionIndex, voiceNarrator]);
  const speak = (text: string) => {
    if (!voiceNarrator || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };
  const hasMedia =
  question.imageUrl ||
  question.videoUrl ||
  question.audioUrl ||
  question.pdfUrl ||
  question.type === 'case-study' ||
  question.type === 'table' ||
  question.type === 'passage' ||
  question.type === 'chart';
  const showToolbar = needsCalculator || needsKeyboard;
  const renderQuestionStem = () =>
  <div className="mb-[1.5em]">
      <div className="flex items-center gap-3 mb-[0.75em]">
        <span
        className="font-heading font-bold text-[1.125em]"
        style={{
          color: 'var(--text-primary)'
        }}>
        
          Question {questionIndex + 1}
        </span>
        {question.required &&
      <span
        className="px-[0.5em] py-[0.125em] rounded text-[0.625em] font-bold uppercase tracking-wider"
        style={{
          backgroundColor: 'var(--required-bg)',
          color: 'var(--required-text)',
          border: '1px solid var(--required-border)'
        }}>
        
            Required
          </span>
      }
        <span
        className="px-[0.5em] py-[0.125em] rounded text-[0.625em] font-bold uppercase tracking-wider"
        style={{
          backgroundColor: 'var(--surface-subtle)',
          color: 'var(--text-muted)'
        }}>
        
          {question.points} pts
        </span>
      </div>
      <h2
      className="font-heading text-[1.25em] font-semibold leading-relaxed transition-colors"
      style={{
        color: 'var(--text-primary)',
        cursor: voiceNarrator ? 'pointer' : undefined,
        borderRadius: '8px',
        padding: voiceNarrator ? '0.25em 0.5em' : undefined,
        margin: voiceNarrator ? '-0.25em -0.5em' : undefined
      }}
      onMouseEnter={(e) => {
        if (voiceNarrator) {
          ;(e.currentTarget as HTMLElement).style.backgroundColor =
          'var(--exam-accent-light)';
          speak(question.text);
        }
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.backgroundColor = '';
        stopSpeaking();
      }}>
      
        {question.text}
      </h2>
    </div>;

  /**
   * Renders ONLY the media/context portion — NO answer choices.
   * Answer choices are rendered separately via renderInteractive().
   */
  const renderMediaOrContext = () => {
    let content = null;
    if (question.type === 'case-study' && question.tabs) {
      content =
      <div
        className="rounded-xl border overflow-hidden flex flex-col"
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--surface-white)',
          minHeight: '300px'
        }}>
        
          {/* Tab bar — hidden scrollbar with gradient fade masks */}
          <TabScrollContainer
          style={{
            backgroundColor: 'var(--surface-subtle)',
            borderBottom: '1px solid var(--border-default)'
          }}>
          
            {question.tabs.map((t, i) => {
            const isActive = activeTab === i;
            return (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className="relative px-4 py-2.5 font-heading text-[0.875em] font-semibold transition-colors whitespace-nowrap shrink-0"
                style={{
                  color: isActive ?
                  'var(--exam-accent)' :
                  'var(--text-muted)',
                  backgroundColor: isActive ?
                  'var(--surface-white)' :
                  'transparent',
                  borderBottom: isActive ?
                  '2px solid var(--exam-accent)' :
                  '2px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer'
                }}
                role="tab"
                aria-selected={isActive}
                aria-label={`View ${t.title} tab`}>
                
                  {t.title}
                </button>);

          })}
          </TabScrollContainer>
          {/* Tab content */}
          <div
          className="p-[1.5em] space-y-[1em] overflow-y-auto flex-1"
          role="tabpanel">
          
            {question.tabs[activeTab]?.content.map((p, i) =>
          <p
            key={i}
            className="font-heading text-[0.875em] leading-relaxed"
            style={{
              color: 'var(--text-secondary)'
            }}>
            
                {p}
              </p>
          )}
          </div>
          {/* Show image if case study also has an image */}
          {question.imageUrl &&
        <div
          className="p-[1em] border-t"
          style={{
            borderColor: 'var(--border-default)'
          }}>
          
              <ImagePanel
            src={question.imageUrl}
            alt="Case study reference image" />
          
            </div>
        }
        </div>;

    } else if (question.imageUrl) {
      content =
      <ImagePanel src={question.imageUrl} alt="Question reference image" />;

    } else if (question.videoUrl) {
      content =
      <div
        className="rounded-xl overflow-hidden border flex flex-col"
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: '#000000',
          minHeight: '280px'
        }}>
        
          <video
          src={question.videoUrl}
          controls
          className="w-full"
          style={{
            maxHeight: '400px'
          }}
          aria-label="Question video" />
        
        </div>;

    } else if (question.audioUrl) {
      content =
      <div
        className="rounded-xl border p-[1.5em] flex flex-col items-center justify-center gap-4"
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--surface-subtle)',
          minHeight: '120px'
        }}>
        
          <audio
          src={question.audioUrl}
          controls
          className="w-full max-w-md"
          aria-label="Question audio" />
        
        </div>;

    } else if (question.type === 'table' && question.tableData) {
      // Render ONLY the table — no answer choices
      content =
      <div
        className="overflow-x-auto rounded-xl border"
        style={{
          borderColor: 'var(--border-default)'
        }}>
        
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
              style={{
                backgroundColor: 'var(--surface-subtle)'
              }}>
              
                {question.tableData.headers.map((h, i) =>
              <th
                key={i}
                className="p-[1em] font-heading font-bold text-[0.875em] border-b"
                style={{
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-default)'
                }}>
                
                    {h}
                  </th>
              )}
              </tr>
            </thead>
            <tbody>
              {question.tableData.rows.map((row, i) =>
            <tr
              key={i}
              className="border-b last:border-0"
              style={{
                borderColor: 'var(--border-default)',
                backgroundColor: 'var(--surface-white)'
              }}>
              
                  {row.map((cell, j) =>
              <td
                key={j}
                className="p-[1em] font-heading text-[0.875em]"
                style={{
                  color: 'var(--text-secondary)'
                }}>
                
                      {cell}
                    </td>
              )}
                </tr>
            )}
            </tbody>
          </table>
        </div>;

    } else if (question.type === 'pdf' && question.pdfUrl) {
      // PDF viewer with robust fallback
      content =
      <div
        className="rounded-xl border overflow-hidden flex flex-col"
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--surface-subtle)',
          minHeight: '500px'
        }}>
        
          {/* Always show the iframe attempt */}
          {!pdfError &&
        <iframe
          src={question.pdfUrl}
          className="w-full flex-1"
          style={{
            minHeight: '460px',
            border: 'none',
            display: 'block'
          }}
          title="PDF Viewer — Clinical guidelines document"
          onLoad={() => {
            setPdfLoaded(true);
            if (pdfTimerRef.current) clearTimeout(pdfTimerRef.current);
          }} />

        }
          {/* Fallback when PDF can't load */}
          {pdfError && !pdfLoaded &&
        <div
          className="flex-1 flex flex-col items-center justify-center gap-4 p-8"
          style={{
            minHeight: '460px'
          }}>
          
              <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: 'var(--exam-accent-light)'
            }}>
            
                <FileTextIcon
              size={32}
              style={{
                color: 'var(--exam-accent)'
              }} />
            
              </div>
              <div className="text-center">
                <p
              className="font-heading font-semibold text-[1em] mb-1"
              style={{
                color: 'var(--text-primary)'
              }}>
              
                  PDF Document
                </p>
                <p
              className="font-heading text-[0.875em] mb-4"
              style={{
                color: 'var(--text-muted)'
              }}>
              
                  The PDF viewer could not load in this environment.
                </p>
                <a
              href={question.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-semibold text-[0.875em] transition-colors"
              style={{
                backgroundColor: 'var(--exam-accent)',
                color: 'var(--exam-accent-text)'
              }}>
              
                  <FileTextIcon size={16} />
                  Open PDF in New Tab
                </a>
              </div>
            </div>
        }
          {/* Footer link always visible */}
          <div
          className="flex items-center gap-2 px-4 py-2 border-t shrink-0"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--surface-subtle)'
          }}>
          
            <FileTextIcon
            size={14}
            style={{
              color: 'var(--text-muted)'
            }} />
          
            <a
            href={question.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-heading font-medium underline"
            style={{
              color: 'var(--exam-accent)'
            }}>
            
              Open PDF in new tab
            </a>
          </div>
        </div>;

    } else if (question.type === 'passage' && question.passageText) {
      // Render ONLY the passage text — no answer choices
      content =
      <div
        className="p-[1.5em] border rounded-xl overflow-y-auto text-[1em] leading-relaxed font-heading"
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--surface-subtle)',
          color: 'var(--text-secondary)',
          maxHeight: '500px'
        }}>
        
          {question.passageText}
        </div>;

    } else if (question.type === 'chart') {
      content =
      <ChartRenderer
        question={question}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={onSelectAnswer} />;


    }
    return (
      <div className="flex flex-col gap-3">
        {content}
        {question.caption &&
        <div
          className="text-sm font-heading p-3 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-subtle)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)'
          }}>
          
            <strong>Caption:</strong> {question.caption}
          </div>
        }
        {question.chartData?.caption && !question.caption &&
        <div
          className="text-sm font-heading p-3 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-subtle)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)'
          }}>
          
            <strong>Caption:</strong> {question.chartData.caption}
          </div>
        }
      </div>);

  };
  const renderInteractive = () => {
    const props = {
      question,
      selectedAnswer,
      onSelectAnswer,
      voiceNarrator
    };
    switch (question.type) {
      case 'mcq':
      case 'image-mcq':
      case 'video-mcq':
      case 'audio':
      case 'case-study':
      case 'combined':
      case 'table':
      case 'pdf':
      case 'passage':
      case 'chart':
        return <RadioMCQRenderer {...props} />;
      case 'checkbox':
        return <CheckboxRenderer {...props} />;
      case 'cross-out':
        return <CrossOutRenderer {...props} />;
      case 'highlight':
        return <HighlightRenderer {...props} />;
      case 'short-answer':
        return <ShortAnswerRenderer {...props} />;
      case 'fill-blank':
        return <FillBlankRenderer {...props} />;
      case 'matching':
        return <MatchingRenderer {...props} />;
      case 'anatomy':
        return <AnatomyRenderer {...props} />;
      case 'essay':
        return <EssayRenderer {...props} />;
      case 'word-highlight':
        return <WordHighlightRenderer {...props} />;
      case 'dropdown':
        return (
          <select
            value={selectedAnswer || ''}
            onChange={(e) => onSelectAnswer(question.id, e.target.value)}
            className="w-full p-[1em] rounded-xl border-2 font-heading text-[1em] exam-focus"
            style={{
              borderColor: 'var(--border-default)',
              backgroundColor: 'var(--surface-white)',
              color: 'var(--text-primary)'
            }}
            aria-label="Select your answer from the dropdown options">
            
            <option value="" disabled>
              Select an option...
            </option>
            {question.options?.map((opt, i) =>
            <option key={i} value={opt}>
                {opt}
              </option>
            )}
          </select>);

      default:
        return <p>Unsupported question type.</p>;
    }
  };
  const renderToolbar = () => {
    return (
      <div
        className="flex items-center gap-2 mt-4 pt-3 shrink-0"
        style={{
          borderTop: '1px solid var(--border-default)'
        }}>
        
        {/* Tools on the left */}
        {needsCalculator &&
        <div className="relative">
            <Tooltip
            content="Open the on-screen calculator to help with calculations"
            position="top">
            
              <button
              onClick={onToggleCalculator}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-heading font-semibold transition-colors exam-focus"
              style={{
                backgroundColor: showCalculator ?
                'var(--exam-accent-light)' :
                'var(--surface-white)',
                borderColor: showCalculator ?
                'var(--exam-accent-border)' :
                'var(--border-default)',
                color: showCalculator ?
                'var(--exam-accent)' :
                'var(--text-secondary)'
              }}
              aria-label="Toggle Calculator">
              
                <CalculatorIcon size={14} />
                Calculator
              </button>
            </Tooltip>
            {showCalculator && needsCalculator &&
          <div className="absolute bottom-full mb-2 left-0 z-50">
                <CalculatorPopover
              isOpen={true}
              onClose={onToggleCalculator || (() => {})} />
            
              </div>
          }
          </div>
        }
        {needsKeyboard &&
        <Tooltip
          content="Open the virtual keyboard for text input"
          position="top">
          
            <button
            onClick={onToggleKeyboard}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-heading font-semibold transition-colors exam-focus"
            style={{
              backgroundColor: showKeyboard ?
              'var(--exam-accent-light)' :
              'var(--surface-white)',
              borderColor: showKeyboard ?
              'var(--exam-accent-border)' :
              'var(--border-default)',
              color: showKeyboard ?
              'var(--exam-accent)' :
              'var(--text-secondary)'
            }}
            aria-label="Toggle Virtual Keyboard">
            
              <KeyboardIcon size={14} />
              Keyboard
            </button>
          </Tooltip>
        }

        {/* Shortcuts: right-aligned when tools shown, left-aligned otherwise */}
        <div className={showToolbar ? 'ml-auto' : ''}>
          <ShortcutHints type={question.type} />
        </div>
      </div>);

  };
  const renderInlineTools = () => {
    return (
      <>
        {showKeyboard && needsKeyboard &&
        <VirtualKeyboard
          isOpen={true}
          onClose={onToggleKeyboard || (() => {})}
          inline={true} />

        }
      </>);

  };
  return (
    <div
      className="w-full flex-1 min-h-0 animate-card-enter flex flex-col overflow-hidden"
      style={{
        fontSize: `${zoomPercent}%`
      }}>
      
      {hasMedia ?
      <div className="flex-1 min-h-0 flex gap-6 overflow-hidden flex-row">
          {/* LEFT: Question Stem + Media Context ONLY (no answer choices) */}
          <div
          className="w-1/2 min-h-0 overflow-y-auto rounded-2xl border shadow-sm p-[2em] flex flex-col gap-4"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--surface-white)'
          }}>
          
            {renderQuestionStem()}
            {renderMediaOrContext()}
          </div>

          {/* RIGHT: Answer Options + Tools ONLY */}
          <div
          className="w-1/2 min-h-0 overflow-y-auto rounded-2xl border shadow-sm p-[2em]"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--surface-white)'
          }}>
          
            <div className="mb-4">
              <h3
              className="font-heading font-semibold text-[1em]"
              style={{
                color: 'var(--text-muted)'
              }}>
              
                Select your answer:
              </h3>
            </div>
            {renderInteractive()}
            {renderToolbar()}
            {renderInlineTools()}
          </div>
        </div> :

      <div className="flex-1 min-h-0 overflow-y-auto">
          <div
          className="max-w-4xl mx-auto rounded-2xl p-[2em] shadow-sm border flex flex-col"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--surface-white)'
          }}>
          
            {renderQuestionStem()}
            {renderInteractive()}
            {renderToolbar()}
            {renderInlineTools()}
          </div>
        </div>
      }
    </div>);

}