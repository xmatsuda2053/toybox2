import { describe, it, expect, vi } from "vitest";
import {
  dispatchGlobalShortcut,
  type GlobalShortcutHandlers,
} from "./app-root.shortcuts.js";

/**
 * 【app-root.shortcuts 仕様】
 *
 * 1. グローバルキーボードショートカット判定
 *    - 1-1. Ctrl+Alt+S でスクラッチモード中でも toggleScratchMode が実行されること
 *    - 1-2. Scratch/Settings モード中は他ショートカット（Ctrl+Alt+Z, Ctrl+K, Ctrl+/, Alt+N）が抑止されること
 *    - 1-3. 通常モード時に Ctrl+Alt+Z / Ctrl+K / Ctrl+/ / Alt+N がそれぞれ対応ハンドラを実行すること
 */
function createMockHandlers(): GlobalShortcutHandlers {
  return {
    toggleScratchMode: vi.fn(),
    toggleZenMode: vi.fn(),
    toggleGlobalSearch: vi.fn(),
    toggleShortcutHelp: vi.fn(),
    openTaskCreate: vi.fn(),
  };
}

function createKeyEvent(
  init: Partial<Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey">>,
): KeyboardEvent {
  return {
    key: "",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    preventDefault: vi.fn(),
    ...init,
  } as unknown as KeyboardEvent;
}

describe("app-root.shortcuts", () => {
  it("1-1. Ctrl+Alt+S でスクラッチモード中でも toggleScratchMode が実行されること", () => {
    const handlers = createMockHandlers();
    const event = createKeyEvent({ key: "s", ctrlKey: true, altKey: true });

    const handled = dispatchGlobalShortcut(
      event,
      { isScratchMode: true, isSettingsMode: false },
      handlers,
    );

    expect(handled).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(handlers.toggleScratchMode).toHaveBeenCalled();
  });

  it("1-2. Scratch または Settings モード中は通常ショートカットが抑止されること", () => {
    const handlers = createMockHandlers();
    const event = createKeyEvent({ key: "k", ctrlKey: true });

    const handled = dispatchGlobalShortcut(
      event,
      { isScratchMode: false, isSettingsMode: true },
      handlers,
    );

    expect(handled).toBe(false);
    expect(handlers.toggleGlobalSearch).not.toHaveBeenCalled();
  });

  it("1-3. 通常モード時に各ショートカットが対応するハンドラを実行すること", () => {
    const handlers = createMockHandlers();
    const normalState = { isScratchMode: false, isSettingsMode: false };

    const zenEvent = createKeyEvent({ key: "z", ctrlKey: true, altKey: true });
    expect(dispatchGlobalShortcut(zenEvent, normalState, handlers)).toBe(true);
    expect(handlers.toggleZenMode).toHaveBeenCalled();

    const searchEvent = createKeyEvent({ key: "K", metaKey: true });
    expect(dispatchGlobalShortcut(searchEvent, normalState, handlers)).toBe(true);
    expect(handlers.toggleGlobalSearch).toHaveBeenCalled();

    const helpEvent = createKeyEvent({ key: "/", ctrlKey: true });
    expect(dispatchGlobalShortcut(helpEvent, normalState, handlers)).toBe(true);
    expect(handlers.toggleShortcutHelp).toHaveBeenCalled();

    const createEvent = createKeyEvent({ key: "n", altKey: true });
    expect(dispatchGlobalShortcut(createEvent, normalState, handlers)).toBe(true);
    expect(handlers.openTaskCreate).toHaveBeenCalled();
  });
});
