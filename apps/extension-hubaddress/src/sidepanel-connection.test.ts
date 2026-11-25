import { describe, it, expect, vi } from "vitest";
import {
  connectSidePanelPort,
  installResizeObserverErrorGuard,
  isResizeObserverLoopErrorMessage,
} from "./sidepanel-connection";

/**
 * テスト仕様: Side Panel クライアント接続・ライフサイクル補助 (sidepanel-connection.ts)
 *
 * - 仕様1: 起動時に chrome.runtime.connect で持続ポートを接続し、windowId を登録送信すること
 * - 仕様2: ポート経由で { type: "close" } メッセージを受信したら closeWindow コールバックを実行すること
 * - 仕様3: chrome.runtime API が未定義の通常ブラウザ環境でもエラーにならないこと
 * - 仕様4: isResizeObserverLoopErrorMessage が ResizeObserver loop 系通知のみ true と判定すること
 * - 仕様5: installResizeObserverErrorGuard が ResizeObserver loop 通知のみ preventDefault / stopImmediatePropagation し、通常エラーは通しつつクリーンアップで解除できること
 */
describe("SidePanel Connection Tests", () => {
  it("ポート接続時に windowId を登録し、close メッセージ受信で closeWindow を呼ぶこと", async () => {
    let messageHandler: ((msg: unknown) => void) | undefined;
    const postMessage = vi.fn();
    const closeWindow = vi.fn();

    const cleanup = connectSidePanelPort({
      connect: () => ({
        postMessage,
        onMessage: {
          addListener: (cb) => {
            messageHandler = cb;
          },
        },
        onDisconnect: {
          addListener: () => {},
        },
        disconnect: vi.fn(),
      }),
      getCurrentWindow: async () => ({ id: 88 }),
      closeWindow,
    });

    await Promise.resolve();
    expect(postMessage).toHaveBeenCalledWith({
      type: "register",
      windowId: 88,
    });

    messageHandler?.({ type: "close" });
    expect(closeWindow).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it("拡張機能 API 未存在環境でも安全に終了すること", () => {
    const cleanup = connectSidePanelPort({});
    expect(() => cleanup()).not.toThrow();
  });

  it("isResizeObserverLoopErrorMessage が ResizeObserver loop 系メッセージのみ true と判定すること", () => {
    expect(
      isResizeObserverLoopErrorMessage(
        "ResizeObserver loop completed with undelivered notifications.",
      ),
    ).toBe(true);
    expect(
      isResizeObserverLoopErrorMessage("ResizeObserver loop limit exceeded"),
    ).toBe(true);
    expect(
      isResizeObserverLoopErrorMessage(
        "TypeError: Cannot read properties of undefined",
      ),
    ).toBe(false);
    expect(isResizeObserverLoopErrorMessage("")).toBe(false);
    expect(isResizeObserverLoopErrorMessage(null)).toBe(false);
    expect(isResizeObserverLoopErrorMessage(undefined)).toBe(false);
  });

  it("installResizeObserverErrorGuard が無害な ResizeObserver loop 通知のみ抑止し通常エラーは通すこと", () => {
    const target = new EventTarget();
    const cleanup = installResizeObserverErrorGuard(target);

    const benignEvent = new Event("error", { cancelable: true });
    Object.defineProperty(benignEvent, "message", {
      value: "ResizeObserver loop completed with undelivered notifications.",
    });
    const stopImmediateSpy = vi.spyOn(benignEvent, "stopImmediatePropagation");
    target.dispatchEvent(benignEvent);
    expect(benignEvent.defaultPrevented).toBe(true);
    expect(stopImmediateSpy).toHaveBeenCalledTimes(1);

    const realErrorEvent = new Event("error", { cancelable: true });
    Object.defineProperty(realErrorEvent, "message", {
      value: "ReferenceError: foo is not defined",
    });
    const realStopSpy = vi.spyOn(realErrorEvent, "stopImmediatePropagation");
    target.dispatchEvent(realErrorEvent);
    expect(realErrorEvent.defaultPrevented).toBe(false);
    expect(realStopSpy).not.toHaveBeenCalled();

    cleanup();

    const afterCleanupEvent = new Event("error", { cancelable: true });
    Object.defineProperty(afterCleanupEvent, "message", {
      value: "ResizeObserver loop completed with undelivered notifications.",
    });
    target.dispatchEvent(afterCleanupEvent);
    expect(afterCleanupEvent.defaultPrevented).toBe(false);
  });
});
