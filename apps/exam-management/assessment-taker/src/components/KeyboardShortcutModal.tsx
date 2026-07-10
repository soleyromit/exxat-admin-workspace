import React from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Kbd, KbdGroup } from '@exxatdesignux/ui';

interface KeyboardShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  description: string;
  win: string[];
  mac: string[];
}

const SHORTCUT_GROUPS: { label: string; items: Shortcut[] }[] = [
  {
    label: 'Navigation',
    items: [
      { description: 'Next question',           win: ['→'],           mac: ['→'] },
      { description: 'Previous question',       win: ['←'],           mac: ['←'] },
    ],
  },
  {
    label: 'Actions',
    items: [
      { description: 'Flag for review',         win: ['Alt', 'F'],    mac: ['⌥', 'F'] },
      { description: 'Scratch an option',       win: ['Alt', 'W'],    mac: ['⌥', 'W'] },
      { description: 'Bookmark question',       win: ['Z'],           mac: ['Z'] },
      { description: 'Select option A–H',       win: ['A–H'],         mac: ['A–H'] },
    ],
  },
  {
    label: 'Tools',
    items: [
      { description: 'Calculator',              win: ['Alt', 'C'],    mac: ['⌥', 'C'] },
      { description: 'Adjust font size',        win: ['Ctrl', '+/−'], mac: ['⌘', '+/−'] },
      { description: 'View keyboard shortcuts', win: ['Ctrl', '/'],   mac: ['⌘', '/'] },
      { description: 'Close panels',            win: ['Esc'],         mac: ['Esc'] },
    ],
  },
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

const ARROW_ICONS: Record<string, string> = {
  '→': 'fa-arrow-right',
  '←': 'fa-arrow-left',
  '↑': 'fa-arrow-up',
  '↓': 'fa-arrow-down',
};

function KeyGroup({ keys }: { keys: string[] }) {
  return (
    <KbdGroup className="justify-end">
      {keys.map((k, i) => (
        <React.Fragment key={i}>
          <Kbd>
            {ARROW_ICONS[k]
              ? <i className={`fa-solid ${ARROW_ICONS[k]}`} aria-hidden="true" style={{ fontSize: 10 }} />
              : k}
          </Kbd>
          {i < keys.length - 1 && (
            <span className="text-[10px] text-muted-foreground leading-none">+</span>
          )}
        </React.Fragment>
      ))}
    </KbdGroup>
  );
}

export function KeyboardShortcutModal({ isOpen, onClose }: KeyboardShortcutModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton
        className="max-w-[480px] p-0 flex flex-col max-h-[calc(100vh-48px)] overflow-hidden"
        aria-describedby={undefined}
      >
        {/* Header — DialogContent showCloseButton provides the × button */}
        <DialogHeader className="flex-row items-center gap-2 border-b px-5 py-4 space-y-0 flex-shrink-0">
          <i className="fa-regular fa-keyboard text-[15px] text-muted-foreground" aria-hidden="true" />
          <DialogTitle className="text-[15px] flex-1">Keyboard shortcuts</DialogTitle>
        </DialogHeader>

        {/* Column headers */}
        <div
          className="grid border-b flex-shrink-0"
          style={{ gridTemplateColumns: '1fr 110px', padding: '8px 20px 6px' }}
        >
          <span className="text-xs font-semibold text-muted-foreground">Action</span>
          <span className="text-xs font-semibold text-muted-foreground text-right">Shortcut</span>
        </div>

        {/* Groups */}
        <div className="overflow-y-auto flex-1">
          {SHORTCUT_GROUPS.map(({ label, items }, gi) => (
            <div key={label}>
              {/* Section label */}
              <div
                className="text-xs font-semibold text-foreground"
                style={{ padding: `${gi === 0 ? 12 : 16}px 20px 4px` }}
              >
                {label}
              </div>

              {/* Rows */}
              {items.map(({ description, win, mac }) => (
                <div
                  key={description}
                  className="grid items-center"
                  style={{ gridTemplateColumns: '1fr 110px', padding: '7px 20px' }}
                >
                  <span className="text-[13px] text-muted-foreground">{description}</span>
                  <div className="flex justify-end">
                    <KeyGroup keys={isMac ? mac : win} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t px-5 py-3 justify-end flex-shrink-0">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
