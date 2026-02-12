const MAX_HISTORY = 50;

export type HistorySnapshot = string; // JSON-serialized state

export type HistoryState = {
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
};

export function createHistoryState(): HistoryState {
  return { undoStack: [], redoStack: [] };
}

export function pushHistory(
  history: HistoryState,
  snapshot: HistorySnapshot
): HistoryState {
  const undoStack = [...history.undoStack, snapshot];
  if (undoStack.length > MAX_HISTORY) {
    undoStack.shift();
  }
  return { undoStack, redoStack: [] };
}

export function canUndo(history: HistoryState): boolean {
  return history.undoStack.length > 0;
}

export function canRedo(history: HistoryState): boolean {
  return history.redoStack.length > 0;
}

export function peekUndo(history: HistoryState): HistorySnapshot | null {
  return history.undoStack.length > 0
    ? history.undoStack[history.undoStack.length - 1]!
    : null;
}

export function popUndo(
  history: HistoryState,
  currentSnapshot: HistorySnapshot
): { history: HistoryState; snapshot: HistorySnapshot } | null {
  if (history.undoStack.length === 0) return null;
  const undoStack = [...history.undoStack];
  const snapshot = undoStack.pop()!;
  return {
    history: {
      undoStack,
      redoStack: [...history.redoStack, currentSnapshot],
    },
    snapshot,
  };
}

export function popRedo(
  history: HistoryState,
  currentSnapshot: HistorySnapshot
): { history: HistoryState; snapshot: HistorySnapshot } | null {
  if (history.redoStack.length === 0) return null;
  const redoStack = [...history.redoStack];
  const snapshot = redoStack.pop()!;
  return {
    history: {
      undoStack: [...history.undoStack, currentSnapshot],
      redoStack,
    },
    snapshot,
  };
}
