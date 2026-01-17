import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (e: KeyboardEvent) => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.handler(e);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Common shortcuts for storyboarding
export const STORYBOARD_SHORTCUTS = {
  NEW_SHOT: { key: 'n', ctrl: true, description: 'Create new shot' },
  DUPLICATE_SHOT: { key: 'd', ctrl: true, description: 'Duplicate shot' },
  DELETE_SHOT: { key: 'Delete', description: 'Delete shot' },
  NEXT_SHOT: { key: 'ArrowRight', description: 'Next shot' },
  PREV_SHOT: { key: 'ArrowLeft', description: 'Previous shot' },
  TOGGLE_AI: { key: 'a', ctrl: true, description: 'Toggle AI panel' },
  EXPORT: { key: 'e', ctrl: true, description: 'Export storyboard' },
};
