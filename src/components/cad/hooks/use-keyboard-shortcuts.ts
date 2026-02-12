'use client';

import { useEffect } from 'react';
import { useDrawingStore } from '../state/drawing-store';

interface UseKeyboardShortcutsOptions {
  onSave?: () => void;
}

export function useKeyboardShortcuts({ onSave }: UseKeyboardShortcutsOptions = {}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const store = useDrawingStore.getState();
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+Z / Ctrl+Shift+Z — undo/redo
      if (ctrl && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          store.redo();
        } else {
          store.undo();
        }
        return;
      }

      // Ctrl+S — save
      if (ctrl && e.key === 's') {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Tool shortcuts (no modifiers)
      if (ctrl || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case 'v':
          store.setTool('select');
          break;
        case 'w':
          store.setTool('wall');
          break;
        case 'd':
          store.setTool('door');
          break;
        case 'n':
          store.setTool('window');
          break;
        case 'f':
          store.setTool('furniture');
          break;
        case 'm':
          store.setTool('measure');
          break;
        case 'l':
          store.setTool('label');
          break;
        case 't':
          store.setTool('text');
          break;
        case 'delete':
        case 'backspace':
          if (store.selectedId) {
            store.deleteSelected();
          }
          break;
        case 'escape':
          store.selectObject(null);
          store.setTool('select');
          break;
        case '1':
          store.setCameraMode('orthographic');
          break;
        case '2':
          store.setCameraMode('perspective');
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);
}
