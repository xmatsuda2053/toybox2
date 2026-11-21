/** グローバルキーボードショートカットのモード状態 */
export interface GlobalShortcutModeState {
  isScratchMode: boolean;
  isSettingsMode: boolean;
}

/** グローバルキーボードショートカットの実行ハンドラー群 */
export interface GlobalShortcutHandlers {
  toggleScratchMode: () => void;
  toggleZenMode: () => void;
  toggleGlobalSearch: () => void;
  toggleShortcutHelp: () => void;
  openTaskCreate: () => void;
}

/**
 * アプリ全体のキーボードショートカットを判定して対応ハンドラーを実行する。
 * いずれかのショートカットが一致した場合は true を返す。
 */
export function dispatchGlobalShortcut(
  e: KeyboardEvent,
  state: GlobalShortcutModeState,
  handlers: GlobalShortcutHandlers,
): boolean {
  const isCtrlOrMeta = e.ctrlKey || e.metaKey;
  const lowerKey = e.key.toLowerCase();

  // 全画面スクラッチモード切替（スクラッチ・設定モード中であっても直接切り替え・復帰できるよう最優先で判定）
  if (isCtrlOrMeta && e.altKey && lowerKey === "s") {
    e.preventDefault();
    handlers.toggleScratchMode();
    return true;
  }

  if (state.isScratchMode || state.isSettingsMode) {
    return false;
  }

  if (isCtrlOrMeta && e.altKey && lowerKey === "z") {
    e.preventDefault();
    handlers.toggleZenMode();
    return true;
  }

  if (isCtrlOrMeta && !e.altKey && lowerKey === "k") {
    e.preventDefault();
    handlers.toggleGlobalSearch();
    return true;
  }

  if (isCtrlOrMeta && !e.altKey && e.key === "/") {
    e.preventDefault();
    handlers.toggleShortcutHelp();
    return true;
  }

  if (e.altKey && !isCtrlOrMeta && lowerKey === "n") {
    e.preventDefault();
    handlers.openTaskCreate();
    return true;
  }

  return false;
}
