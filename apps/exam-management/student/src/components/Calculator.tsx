import React, { useState } from 'react';
/**
 * Calculator — Exxat Exam Management
 *
 * FIGMA LAYER GUIDE
 * ─────────────────
 * Calculator                  [Frame, fixed position, top=80px, right=320px, 320px wide]
 *   ├── Calc/Header           [Frame, Auto Layout horizontal, space-between, px=16px, py=12px, bg=Calc/HeaderBg]
 *   │     ├── ModeToggle      [Frame, Auto Layout horizontal, gap=4px]
 *   │     │     ├── ModeBtn/Standard   [Frame, pill, variant: active | default]
 *   │     │     └── ModeBtn/Scientific [Frame, pill, variant: active | default]
 *   │     └── CloseButton     [Frame, icon-button]
 *   ├── Calc/Display          [Frame, px=16px, py=16px, bg=Calc/DisplayBg]
 *   │     ├── OperationHint   [Text, 12px, Text/Placeholder, mono]
 *   │     └── DisplayValue    [Text, 30px Bold, Text/Inverse, mono, truncate]
 *   ├── Calc/ScientificGrid?  [Frame, 5-col grid, p=8px, bg=Surface/Subtle] — mode=scientific only
 *   └── Calc/StandardGrid     [Frame, 4-col grid, p=12px, gap=6px]
 *         └── CalcButton      [Frame, 44px tall, rounded-8] — see variants below
 *
 * CALCBUTTON VARIANTS
 *   num:    bg=Surface/White, border=Calc/NumBorder, text=Calc/NumText
 *   op:     bg=Calc/OpBtn, border=Calc/OpBorder, text=Calc/OpText
 *   equal:  bg=Calc/EqualBtn, text=Text/Inverse (brand pink)
 *   sci:    bg=Calc/SciBtn, border=Calc/SciBorder, text=Calc/SciText (blue)
 *
 * ⚠️ FIGMA EXPORT FLAGS
 *   1. Calculator is absolutely positioned via CSS `position: fixed`. In Figma,
 *      place as a floating component. Document position: top=80px, right=320px.
 *   2. The display value uses JS number state — use a text placeholder in Figma.
 *   3. Scientific grid is conditionally rendered — create as a hidden layer
 *      toggled by the "Scientific" variant.
 *   4. All calculator logic is runtime-only — Figma needs only the visual states.
 *
 * TOKEN USAGE
 *   All values from tokens.calc.* in design-tokens.ts
 */
import { XIcon } from 'lucide-react';
import { tokens } from '../tokens/design-tokens';
export interface CalculatorProps {
  onClose: () => void;
}
type CalcMode = 'standard' | 'scientific';
export function Calculator({
  onClose
}: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);
  const [mode, setMode] = useState<CalcMode>('standard');
  const handleNumber = (num: string) => {
    if (resetNext) {
      setDisplay(num);
      setResetNext(false);
    } else setDisplay(display === '0' ? num : display + num);
  };
  const handleDecimal = () => {
    if (resetNext) {
      setDisplay('0.');
      setResetNext(false);
    } else if (!display.includes('.')) setDisplay(display + '.');
  };
  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b !== 0 ? a / b : 0;
      default:
        return b;
    }
  };
  const handleOperation = (op: string) => {
    const current = parseFloat(display);
    if (previousValue !== null && operation && !resetNext) {
      const result = calculate(previousValue, current, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    } else {
      setPreviousValue(current);
    }
    setOperation(op);
    setResetNext(true);
  };
  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const result = calculate(previousValue, parseFloat(display), operation);
      setDisplay(String(parseFloat(result.toFixed(10))));
      setPreviousValue(null);
      setOperation(null);
      setResetNext(true);
    }
  };
  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setResetNext(false);
  };
  const handleClearEntry = () => setDisplay('0');
  const handlePercent = () => {
    setDisplay(String(parseFloat(display) / 100));
    setResetNext(true);
  };
  const handlePlusMinus = () => setDisplay(String(parseFloat(display) * -1));
  const handleScientific = (fn: string) => {
    const v = parseFloat(display);
    const results: Record<string, number> = {
      sin: Math.sin(v * Math.PI / 180),
      cos: Math.cos(v * Math.PI / 180),
      tan: Math.tan(v * Math.PI / 180),
      log: Math.log10(v),
      ln: Math.log(v),
      '√': Math.sqrt(v),
      'x²': v * v,
      π: Math.PI,
      e: Math.E
    };
    setDisplay(String(parseFloat((results[fn] ?? v).toFixed(10))));
    setResetNext(true);
  };
  // ─── Button style helpers (all from tokens.calc) ──────────────────────────
  const btnBase = 'flex items-center justify-center rounded-lg text-sm font-semibold transition-colors';
  const btnStyle = {
    num: {
      className: `${btnBase} hover:bg-gray-100`,
      style: {
        height: '44px',
        backgroundColor: tokens.calc.numBtn,
        border: `1px solid ${tokens.calc.numBorder}`,
        color: tokens.calc.numText
      }
    },
    op: {
      className: `${btnBase} hover:bg-gray-200`,
      style: {
        height: '44px',
        backgroundColor: tokens.calc.opBtn,
        border: `1px solid ${tokens.calc.opBorder}`,
        color: tokens.calc.opText
      }
    },
    equal: {
      className: `${btnBase} hover:opacity-90`,
      style: {
        height: '44px',
        backgroundColor: tokens.calc.equalBtn,
        border: 'none',
        color: tokens.text.inverse
      }
    },
    sci: {
      className: `${btnBase} text-xs hover:bg-blue-100`,
      style: {
        height: '44px',
        backgroundColor: tokens.calc.sciBtn,
        border: `1px solid ${tokens.calc.sciBorder}`,
        color: tokens.calc.sciText
      }
    }
  };
  const Btn = ({
    label,
    type,
    onClick




  }: {label: string;type: keyof typeof btnStyle;onClick: () => void;}) => <button onClick={onClick} className={btnStyle[type].className} style={btnStyle[type].style}>
      {label}
    </button>;
  return (
    // Figma layer: "Calculator"
    // ⚠️ Fixed positioned — document as floating overlay in Figma
    <div className="overflow-hidden" style={{
      position: 'fixed',
      top: '80px',
      right: '320px',
      zIndex: 50,
      width: '320px',
      backgroundColor: tokens.surface.white,
      border: `1px solid ${tokens.border.default}`,
      borderRadius: '12px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
    }}>
      {/* Figma layer: "Calc/Header" */}
      <div className="flex items-center justify-between" style={{
        padding: '12px 16px',
        backgroundColor: tokens.calc.headerBg,
        borderBottom: `1px solid ${tokens.border.default}`
      }}>
        {/* Figma layer: "ModeToggle" */}
        <div className="flex" style={{
          gap: '4px'
        }}>
          {(['standard', 'scientific'] as CalcMode[]).map((m) =>
          // Figma layer: "ModeBtn/{m}" (variant: active | default)
          <button key={m} onClick={() => setMode(m)} className="font-semibold rounded-md transition-colors" style={{
            padding: '4px 12px',
            fontSize: '12px',
            backgroundColor: mode === m ? tokens.calc.equalBtn : 'transparent',
            color: mode === m ? tokens.text.inverse : tokens.text.subtle
          }}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>)}
        </div>
        {/* Figma layer: "CloseButton" */}
        <button onClick={onClose} className="transition-colors hover:text-gray-600" style={{
          color: tokens.text.placeholder
        }}>
          <XIcon style={{
            width: '16px',
            height: '16px'
          }} />
        </button>
      </div>

      {/* Figma layer: "Calc/Display"
                     ⚠️ DisplayValue is dynamic — use placeholder text in Figma */}
      <div style={{
        padding: '16px',
        backgroundColor: tokens.calc.displayBg,
        textAlign: 'right'
      }}>
        <div style={{
          height: '16px',
          marginBottom: '4px',
          fontSize: '12px',
          color: tokens.text.placeholder,
          fontFamily: 'monospace'
        }}>
          {previousValue !== null && operation ? `${previousValue} ${operation}` : ''}
        </div>
        <div style={{
          fontSize: '30px',
          fontWeight: 700,
          color: tokens.text.inverse,
          fontFamily: 'monospace',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {display}
        </div>
      </div>

      {/* Figma layer: "Calc/ScientificGrid" — visible only in scientific mode */}
      {mode === 'scientific' && <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '4px',
        padding: '8px',
        backgroundColor: tokens.surface.subtle,
        borderBottom: `1px solid ${tokens.border.default}`
      }}>
          {['sin', 'cos', 'tan', 'log', 'ln', '√', 'x²', 'π', 'e', '('].map((fn) => <Btn key={fn} label={fn} type="sci" onClick={() => fn === '(' ? handleNumber('(') : handleScientific(fn)} />)}
        </div>}

      {/* Figma layer: "Calc/StandardGrid" */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        padding: '12px'
      }}>
        <Btn label="%" type="op" onClick={handlePercent} />
        <Btn label="CE" type="op" onClick={handleClearEntry} />
        <Btn label="C" type="op" onClick={handleClear} />
        <Btn label="÷" type="op" onClick={() => handleOperation('÷')} />
        {['7', '8', '9'].map((n) => <Btn key={n} label={n} type="num" onClick={() => handleNumber(n)} />)}
        <Btn label="×" type="op" onClick={() => handleOperation('×')} />
        {['4', '5', '6'].map((n) => <Btn key={n} label={n} type="num" onClick={() => handleNumber(n)} />)}
        <Btn label="−" type="op" onClick={() => handleOperation('-')} />
        {['1', '2', '3'].map((n) => <Btn key={n} label={n} type="num" onClick={() => handleNumber(n)} />)}
        <Btn label="+" type="op" onClick={() => handleOperation('+')} />
        <Btn label="±" type="num" onClick={handlePlusMinus} />
        <Btn label="0" type="num" onClick={() => handleNumber('0')} />
        <Btn label="." type="num" onClick={handleDecimal} />
        <Btn label="=" type="equal" onClick={handleEquals} />
      </div>
    </div>);

}