'use client';

import { useUiStore } from '@/store/use-ui-store';
import { X } from 'lucide-react';
import { useShortcuts } from '@/hooks/use-shortcuts';

export function ShortcutModal() {
  const isOpen = useUiStore((state) => state.isShortcutModalOpen);
  const setOpen = useUiStore((state) => state.setShortcutModalOpen);

  // Bind key actions specifically to this modal
  useShortcuts({
    '?': () => setOpen(true),
    Escape: () => {
      if (isOpen) setOpen(false);
    },
  });

  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['⌘K', 'Ctrl+K'], description: 'Open command palette' },
    { keys: ['J'], description: 'Move down in list / select next item' },
    { keys: ['K'], description: 'Move up in list / select previous item' },
    { keys: ['Enter'], description: 'Open details drawer of selected item' },
    { keys: ['R'], description: 'Quick retry selected failed/completed job' },
    { keys: ['M'], description: 'Mark selected unread notification as read' },
    { keys: ['/'], description: 'Focus search input fields' },
    { keys: ['?'], description: 'Toggle this shortcut reference modal' },
    { keys: ['Esc'], description: 'Dismiss active drawer, modal, or palette' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg text-foreground">
        {/* Close Button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <h2 className="mb-4 text-base font-bold tracking-tight">Keyboard Shortcuts</h2>
        
        {/* List */}
        <div className="space-y-3">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground text-xs">{s.description}</span>
              <div className="flex gap-1">
                {s.keys.map((key) => (
                  <kbd
                    key={key}
                    className="min-w-6 rounded border border-border bg-muted px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold shadow-sm"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Close triggers */}
        <button
          onClick={() => setOpen(false)}
          className="mt-6 w-full rounded bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Close Reference
        </button>
      </div>
    </div>
  );
}
export default ShortcutModal;
