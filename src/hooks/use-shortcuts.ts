import { useEffect } from 'react';

type ShortcutCallback = (e: KeyboardEvent) => void;

interface ShortcutConfig {
  [key: string]: ShortcutCallback;
}

export function useShortcuts(config: ShortcutConfig) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true');

      const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      let keyCombo = '';
      if (cmdOrCtrl) keyCombo += 'mod+';
      
      const keyName = e.key.toLowerCase();
      keyCombo += keyName;

      // Escape and Cmd/Ctrl+K override input focus
      const isOverrideKey = e.key === 'Escape' || keyCombo === 'mod+k';

      if (isInputFocused && !isOverrideKey) {
        return;
      }

      // Check for exact combo match, or simple key match
      if (config[keyCombo]) {
        e.preventDefault();
        config[keyCombo](e);
      } else if (config[e.key]) {
        // Match simple keys like 'j', 'k', '?', '/', 'r', 'm'
        e.preventDefault();
        config[e.key](e);
      } else if (config[keyName]) {
        e.preventDefault();
        config[keyName](e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [config]);
}
