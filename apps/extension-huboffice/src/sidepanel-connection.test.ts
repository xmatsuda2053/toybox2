import { describe, it, expect, vi } from "vitest";
import {
  connectSidePanelPort,
  installResizeObserverErrorGuard,
  isResizeObserverLoopErrorMessage,
  type RuntimePortLike,
} from "./sidepanel-connection";

/**
 * テスト仕様: Side Panel 持続ポート接続・エラーガード (sidepanel-connection.ts)
 *
 * - 仕様1: huboffice-sidepanel 名で持続ポート接続し、現在ウィンドウIDを register 送信すること
 * - 仕様2: Service Worker から close メッセージを受信した際にウィンドウを閉じること
 * - 仕様3: クリーンアップ関数呼び出しでポート切断し、切断後の close メッセージを無視すること
 * - 仕様4: 無害な ResizeObserver loop エラー通知のみを判定・抑制できること
 */
describe("HubOffice SidePanel Connection Tests", () => {
  it("huboffice-sidepanel ポートを接続してウィンドウIDを登録し、close メッセージで閉じること", async () => {
    const messageListeners: Array<(msg: unknown) => void> = [];
    const port: RuntimePortLike = {
      postMessage: vi.fn(),
      onMessage: {
        addListener: (cb) => messageListeners.push(cb),
      },
      onDisconnect: {
        addListener: vi.fn(),
      },
      disconnect: vi.fn(),
    };
    const connect = vi.fn().mockReturnValue(port);
    const getCurrentWindow = vi.fn().mockResolvedValue({ id: 77 });
    const closeWindow = vi.fn();

    const dispose = connectSidePanelPort({
      connect,
      getCurrentWindow,
      closeWindow,
    });

    await Promise.resolve();

    expect(connect).toHaveBeenCalledWith({ name: "huboffice-sidepanel" });
    expect(port.postMessage).toHaveBeenCalledWith({
      type: "register",
      windowId: 77,
    });

    for (const cb of messageListeners) {
      cb({ type: "close" });
    }
    expect(closeWindow).toHaveBeenCalledTimes(1);

    dispose();
    expect(port.disconnect).toHaveBeenCalledTimes(1);

    for (const cb of messageListeners) {
      cb({ type: "close" });
    }
    expect(closeWindow).toHaveBeenCalledTimes(1);
  });

  it("ResizeObserver loop 通知メッセージを正しく判定・ガードできること", () => {
    expect(
      isResizeObserverLoopErrorMessage(
        "ResizeObserver loop completed with undelivered notifications.",
      ),
    ).toBe(true);
    expect(isResizeObserverLoopErrorMessage("TypeError: foo")).toBe(false);
    expect(isResizeObserverLoopErrorMessage(null)).toBe(false);

    const target = new EventTarget();
    const remove = installResizeObserverErrorGuard(target);

    const loopEvent = new Event("error", { cancelable: true });
    Object.defineProperty(loopEvent, "message", {
      value: "ResizeObserver loop limit exceeded",
    });
    target.dispatchEvent(loopEvent);
    expect(loopEvent.defaultPrevented).toBe(true);

    remove();
  });
});
