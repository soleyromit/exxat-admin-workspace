import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Question } from '../data/questions';
import { Tooltip } from './Tooltip';
import { QuestionCommentBox } from './QuestionCommentBox';
import { Button as DSButton } from '@exxat/ds/packages/ui/src';
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
        borderColor: 'var(--border)',
        backgroundColor: 'var(--muted)',
        minHeight: '280px'
      }}>
      
      {error ?
      <div
        className="flex flex-col items-center gap-3 py-12"
        style={{
          color: 'var(--muted-foreground)'
        }}>
        
          <i className="fa-light fa-image-slash" aria-hidden="true" style={{ fontSize: 40 }} />
          <span className="text-sm">
            Image could not be loaded
          </span>
        </div> :

      <>
          {!loaded &&
        <div
          className="flex flex-col items-center gap-3 py-12 absolute inset-0 z-10 justify-center"
          style={{
            color: 'var(--muted-foreground)'
          }}>
          
              <i className="fa-light fa-spinner-third fa-spin" aria-hidden="true" style={{ fontSize: 24 }} />
              <span className="text-sm">Loading image…</span>
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
  EssayRenderer,
  WordHighlightRenderer,
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
  /**
   * Aarti-mandated: per-question comment/flag box. Driven by
   * Assessment.allowComments at the institution/course level.
   */
  allowComments?: boolean;
  comment?: string;
  onCommentChange?: (questionId: number, comment: string) => void;
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
  voiceNarrator = false,
  allowComments = false,
  comment = '',
  onCommentChange,
}: SplitQuestionViewProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const pdfTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
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
  const renderQuestionStem = () =>
  <div className="mb-[1.5em]">
      <div className="flex items-center gap-3 mb-[0.75em]">
        <span
        className="font-bold text-[1.125em]"
        style={{
          color: 'var(--foreground)'
        }}>
        
          Question {questionIndex + 1}
        </span>
      </div>
      <h2
      className="text-[1.25em] font-semibold leading-relaxed transition-colors"
      style={{
        color: 'var(--foreground)',
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
          borderColor: 'var(--border)',
          backgroundColor: 'var(--card)',
          minHeight: '300px'
        }}>
        
          {/* Tab bar — hidden scrollbar with gradient fade masks */}
          <TabScrollContainer
          style={{
            backgroundColor: 'var(--muted)',
            borderBottom: '1px solid var(--border)'
          }}>
          
            {question.tabs.map((t, i) => {
            const isActive = activeTab === i;
            return (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className="relative px-4 py-2.5 text-[0.875em] font-semibold transition-colors whitespace-nowrap shrink-0"
                style={{
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                  backgroundColor: isActive ? 'var(--card)' : 'transparent',
                  borderBottom: isActive ? '2px solid var(--foreground)' : '2px solid transparent',
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
            className="text-[0.875em] leading-relaxed"
            style={{
              color: 'var(--muted-foreground)'
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
            borderColor: 'var(--border)'
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
          borderColor: 'var(--border)',
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
          borderColor: 'var(--border)',
          backgroundColor: 'var(--muted)',
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
          borderColor: 'var(--border)'
        }}>
        
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
              style={{
                backgroundColor: 'var(--muted)'
              }}>
              
                {question.tableData.headers.map((h, i) =>
              <th
                key={i}
                className="p-[1em] font-bold text-[0.875em] border-b"
                style={{
                  color: 'var(--foreground)',
                  borderColor: 'var(--border)'
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
                borderColor: 'var(--border)',
                backgroundColor: 'var(--card)'
              }}>
              
                  {row.map((cell, j) =>
              <td
                key={j}
                className="p-[1em] text-[0.875em]"
                style={{
                  color: 'var(--muted-foreground)'
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
          borderColor: 'var(--border)',
          backgroundColor: 'var(--muted)',
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
            
                <i className="fa-light fa-file-lines" aria-hidden="true" style={{ fontSize: 32, color: 'var(--exam-accent)' }} />
            
              </div>
              <div className="text-center">
                <p
              className="font-semibold text-[1em] mb-1"
              style={{
                color: 'var(--foreground)'
              }}>
              
                  PDF Document
                </p>
                <p
              className="text-[0.875em] mb-4"
              style={{
                color: 'var(--muted-foreground)'
              }}>
              
                  The PDF viewer could not load in this environment.
                </p>
                <a
              href={question.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-[0.875em] transition-colors"
              style={{
                backgroundColor: 'var(--exam-accent)',
                color: 'var(--exam-accent-text)'
              }}>
              
                  <i className="fa-light fa-file-lines" aria-hidden="true" style={{ fontSize: 16 }} />
                  Open PDF in New Tab
                </a>
              </div>
            </div>
        }
          {/* Footer link always visible */}
          <div
          className="flex items-center gap-2 px-4 py-2 border-t shrink-0"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--muted)'
          }}>
          
            <i className="fa-light fa-file-lines" aria-hidden="true" style={{ fontSize: 14, color: 'var(--muted-foreground)' }} />
          
            <a
            href={question.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium underline"
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
        className="p-[1.5em] border rounded-xl overflow-y-auto text-[1em] leading-relaxed"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--muted)',
          color: 'var(--muted-foreground)',
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
          className="text-sm p-3 rounded-lg border"
          style={{
            backgroundColor: 'var(--muted)',
            borderColor: 'var(--border)',
            color: 'var(--muted-foreground)'
          }}>
          
            <strong>Caption:</strong> {question.caption}
          </div>
        }
        {question.chartData?.caption && !question.caption &&
        <div
          className="text-sm p-3 rounded-lg border"
          style={{
            backgroundColor: 'var(--muted)',
            borderColor: 'var(--border)',
            color: 'var(--muted-foreground)'
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
            className="w-full p-[1em] rounded-xl border-2 text-[1em] exam-focus"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)'
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
          borderTop: '1px solid var(--border)'
        }}>
        
        {/* Tools on the left */}
        {needsCalculator &&
        <div className="relative">
            <Tooltip content="Open the on-screen calculator" position="top">
              <DSButton
                variant="outline"
                size="sm"
                onClick={onToggleCalculator}
                aria-label="Toggle Calculator"
                style={showCalculator ? { backgroundColor: 'var(--muted)', borderColor: 'var(--foreground)', color: 'var(--foreground)' } : undefined}
              >
                <i className="fa-light fa-calculator" aria-hidden="true" style={{ fontSize: 14 }} />
                Calculator
              </DSButton>
            </Tooltip>
            {showCalculator && needsCalculator &&
          <div className="absolute bottom-full mb-2 left-0 z-50">
                <CalculatorPopover isOpen={true} onClose={onToggleCalculator || (() => {})} />
              </div>
          }
          </div>
        }
        {needsKeyboard &&
        <Tooltip content="Open the virtual keyboard" position="top">
            <DSButton
              variant="outline"
              size="sm"
              onClick={onToggleKeyboard}
              aria-label="Toggle Virtual Keyboard"
              style={showKeyboard ? { backgroundColor: 'var(--muted)', borderColor: 'var(--foreground)', color: 'var(--foreground)' } : undefined}
            >
              <i className="fa-light fa-keyboard" aria-hidden="true" style={{ fontSize: 14 }} />
              Keyboard
            </DSButton>
          </Tooltip>
        }

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
          {/* LEFT: Question Stem + Answer Options (primary action) */}
          <div
          className="w-1/2 min-h-0 overflow-y-auto rounded-2xl border shadow-sm p-[2em] flex flex-col gap-4"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--card)'
          }}>

            {renderQuestionStem()}
            <div>
              <h3
              className="font-semibold text-[1em] mb-4"
              style={{ color: 'var(--muted-foreground)' }}>
                Select your answer:
              </h3>
              {renderInteractive()}
            </div>
            {renderToolbar()}
            {renderInlineTools()}
            {allowComments && (
              <QuestionCommentBox
                questionId={question.id}
                initialComment={comment}
                onSave={onCommentChange}
              />
            )}
          </div>

          {/* RIGHT: Reference material / context only */}
          <div
          className="w-1/2 min-h-0 overflow-y-auto rounded-2xl border shadow-sm p-[2em] flex flex-col gap-4"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--card)'
          }}>
            <p className="text-[0.75em] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              Reference Material
            </p>
            {renderMediaOrContext()}
          </div>
        </div> :

      <div className="flex-1 min-h-0 overflow-y-auto">
          <div
          className="max-w-4xl mx-auto rounded-2xl p-[2em] shadow-sm border flex flex-col"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--card)'
          }}>

            {renderQuestionStem()}
            {renderInteractive()}
            {renderToolbar()}
            {renderInlineTools()}
            {allowComments && (
              <QuestionCommentBox
                questionId={question.id}
                initialComment={comment}
                onSave={onCommentChange}
              />
            )}
          </div>
        </div>
      }
    </div>);

}