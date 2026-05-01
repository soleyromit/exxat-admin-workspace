import React, { useState } from 'react';
import { XIcon } from 'lucide-react';
export interface CalculatorPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  inline?: boolean;
}
export function CalculatorPopover({
  isOpen,
  onClose,
  inline = false
}: CalculatorPopoverProps) {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  if (!isOpen) return null;
  const handleNum = (n: string) => {
    if (waitingForOperand) {
      setDisplay(n);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? n : display + n);
    }
  };
  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };
  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };
  const handleOperator = (op: string) => {
    const current = parseFloat(display);
    if (prevValue !== null && operator && !waitingForOperand) {
      const result = calculate(prevValue, current, operator);
      setDisplay(String(result));
      setPrevValue(result);
    } else {
      setPrevValue(current);
    }
    setOperator(op);
    setWaitingForOperand(true);
  };
  const handleEquals = () => {
    if (prevValue !== null && operator) {
      const current = parseFloat(display);
      const result = calculate(prevValue, current, operator);
      setDisplay(String(result));
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };
  const handleToggleSign = () => {
    const val = parseFloat(display);
    setDisplay(String(-val));
  };
  const handlePercent = () => {
    const val = parseFloat(display);
    setDisplay(String(val / 100));
  };
  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '÷':
        return b !== 0 ? a / b : 0;
      case '×':
        return a * b;
      case '-':
        return a - b;
      case '+':
        return a + b;
      default:
        return b;
    }
  };
  const handleButton = (btn: string) => {
    if (btn === 'C') handleClear();else
    if (btn === '±') handleToggleSign();else
    if (btn === '%') handlePercent();else
    if (btn === '.') handleDecimal();else
    if (btn === '=') handleEquals();else
    if (['÷', '×', '-', '+'].includes(btn)) handleOperator(btn);else
    handleNum(btn);
  };
  const wrapperClass = inline ?
  'w-full mt-4 animate-card-enter' :
  'fixed top-20 right-20 z-50 animate-pop-in';
  return (
    <div
      className={wrapperClass}
      style={
      inline ?
      {} :
      {
        width: '300px'
      }
      }>
      
      <div
        className="shadow-lg rounded-2xl overflow-hidden border"
        style={{
          backgroundColor: 'var(--surface-white)',
          borderColor: 'var(--border-default)',
          maxWidth: inline ? '320px' : undefined
        }}>
        
        <div
          className="flex justify-between items-center p-3 border-b"
          style={{
            backgroundColor: 'var(--surface-subtle)',
            borderColor: 'var(--border-default)'
          }}>
          
          <span
            className="font-heading font-semibold text-sm"
            style={{
              color: 'var(--text-primary)'
            }}>
            
            Calculator
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{
              color: 'var(--text-muted)'
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.backgroundColor =
              'var(--surface-subtle)';
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.backgroundColor = '';
            }}>
            
            <XIcon size={16} />
          </button>
        </div>

        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--surface-subtle)'
          }}>
          
          <div
            className="w-full p-3 text-right font-mono text-3xl rounded-lg mb-4 overflow-hidden"
            style={{
              backgroundColor: '#1E293B',
              color: '#FFFFFF'
            }}>
            
            {display}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
            'C',
            '±',
            '%',
            '÷',
            '7',
            '8',
            '9',
            '×',
            '4',
            '5',
            '6',
            '-',
            '1',
            '2',
            '3',
            '+',
            '0',
            '.',
            '='].
            map((btn, i) => {
              const isOp = ['÷', '×', '-', '+', '='].includes(btn);
              const isZero = btn === '0';
              const isEquals = btn === '=';
              return (
                <button
                  key={i}
                  onClick={() => handleButton(btn)}
                  className={`h-12 rounded-lg font-heading text-lg font-medium transition-colors active:scale-95 ${isZero ? 'col-span-2' : ''}`}
                  style={{
                    backgroundColor: isEquals ?
                    'var(--brand-primary)' :
                    isOp ?
                    'var(--surface-subtle)' :
                    'var(--surface-white)',
                    color: isEquals ?
                    '#FFFFFF' :
                    isOp ?
                    'var(--text-primary)' :
                    'var(--text-primary)',
                    border: `1px solid var(--border-default)`
                  }}>
                  
                  {btn}
                </button>);

            })}
          </div>
        </div>
      </div>
    </div>);

}