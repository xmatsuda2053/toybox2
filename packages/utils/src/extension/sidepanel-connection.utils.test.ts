import { describe, it, expect, vi } from "vitest";
import {
  connectExtensionSidePanelPort,
  installResizeObserverErrorGuard,
  isResizeObserverLoopErrorMessage,
  type RuntimePortLike,
} from "./sidepanel-connection.utils";

/**
 * 【sidepanel-connection.utils 仕様（Side Panel ポート接続・ResizeObserver ガード）】
 *
 * 1. ResizeObserver ループ通知判定・ガード（isResizeObserverLoopErrorMessage / installResizeObserverErrorGuard）
 *    - 1-1. 無害な ResizeObserver loop メッセージのみ true を返し、通常エラーや非文字列は false を返すこと
 *    - 1-2. ガード導入時は対象メッセージのみ preventDefault・stopImmediatePropagation され、解除後は無効化されること
 *
 * 2. Service Worker 持続ポート接続（connectExtensionSidePanelPort）
 *    - 2-1. 指定したポート名で接続し、現在ウィンドウ ID を register メッセージとして送信すること
 *    - 2-2. close メッセージ受信時に closeWindow が呼ばれ、dispose 後は disconnect され以降の close 通知は無視されること
 */

describe("sidepanel-connection.utils", () => {
  it("1-1. 無害な ResizeObserver loop メッセージのみ true を返し、通常エラーや非文字列は false を返すこと", () => {
    expect(
      isResizeObserverLoopErrorMessage(
        "ResizeObserver loop completed with undelivered notifications.",
      ),
    ).toBe(true);
    expect(
      isResizeObserverLoopErrorMessage("ResizeObserver loop limit exceeded"),
    ).toBe(true);
    expect(isResizeObserverLoopErrorMessage("TypeError: foo")).toBe(false);
    expect(isResizeObserverLoopErrorMessage("")).toBe(false);
    expect(isResizeObserverLoopErrorMessage(null)).toBe(false);
  });

  it("1-2. ガード導入時は対象メッセージのみ preventDefault・stopImmediatePropagation され、解除後は無効化されること", () => {
    const target = new EventTarget();
    const dispose = installResizeObserverErrorGuard(target);

    const loopEvent = new Event("error", { cancelable: true });
    Object.defineProperty(loopEvent, "message", {
      value: "ResizeObserver loop completed with undelivered notifications.",
    });
    const stopSpy = vi.spyOn(loopEvent, "stopImmediatePropagation");
    target.dispatchEvent(loopEvent);
    expect(loopEvent.defaultPrevented).toBe(true);
    expect(stopSpy).toHaveBeenCalledTimes(1);

    const otherEvent = new Event("error", { cancelable: true });
    Object.defineProperty(otherEvent, "message", { value: "ReferenceError" });
    target.dispatchEvent(otherEvent);
    expect(otherEvent.defaultPrevented).toBe(false);

    dispose();
    const afterDispose = new Event("error", { cancelable: true });
    Object.defineProperty(afterDispose, "message", {
      value: "ResizeObserver loop limit exceeded",
    });
    target.dispatchEvent(afterDispose);
    expect(afterDispose.defaultPrevented).toBe(false);
  });

  it("2-1. 指定したポート名で接続し、現在ウィンドウ ID を register メッセージとして送信すること", async () => {
    const postMessage = vi.fn();
    const disconnect = vi.fn();
    const connect = vi.fn().mockReturnValue({
      postMessage,
      disconnect,
      onMessage: { addListener: vi.fn() },
      onDisconnect: { addListener: vi.fn() },
    } satisfies RuntimePortLike);

    connectExtensionSidePanelPort("custom-sidepanel", {
      connect,
      getCurrentWindow: vi.fn().mockResolvedValue({ id: 123 }),
    });

    await Promise.resolve();
    expect(connect).toHaveBeenCalledWith({ name: "custom-sidepanel" });
    expect(postMessage).toHaveBeenCalledWith({
      type: "register",
      windowId: 123,
    });
  });

  it("2-2. close メッセージ受信時に closeWindow が呼ばれ、dispose 後は disconnect され以降の close 通知は無視されること", () => {
    let messageHandler: ((msg: unknown) => void) | undefined;
    const disconnect = vi.fn();
    const closeWindow = vi.fn();
    const connect = vi.fn().mockReturnValue({
      postMessage: vi.fn(),
      disconnect,
      onMessage: {
        addListener: (cb: (msg: unknown) => void) => {
          messageHandler = cb;
        },
      },
      onDisconnect: { addListener: vi.fn() },
    } satisfies RuntimePortLike);

    const dispose = connectExtensionSidePanelPort("custom-sidepanel", {
      connect,
      closeWindow,
    });

    messageHandler?.({ type: "close" });
    expect(closeWindow).toHaveBeenCalledTimes(1);

    dispose();
    expect(disconnect).toHaveBeenCalledTimes(1);

    messageHandler?.({ type: "close" });
    expect(closeWindow).toHaveBeenCalledTimes(1);
  });
});
