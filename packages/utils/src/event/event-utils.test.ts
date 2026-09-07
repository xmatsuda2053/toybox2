import { describe, it, expect, vi } from "vitest";
import { createCustomEvent, dispatchCustomEvent } from "./event-utils";

/**
 * - [x] 仕様 1: オプション未設定の場合、デフォルト値が正しく設定されること。
 * - [x] 仕様 2: detailに値を設定した場合、正しく設定されること。
 * - [x] 仕様 3: オプションの上書きが正しく反映されること。
 * - [x] 仕様 4: dispatchCustomEvent関数が正しくイベントを発火すること。
 */
describe("event-utils", () => {
  it("オプション設定のでデフォルト値が正しく設定されること", () => {
    const event = createCustomEvent("test-event");
    expect(event).toBeInstanceOf(CustomEvent);
    expect(event.type).toBe("test-event");
    expect(event.detail).toBeNull();
    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(true);
    expect(event.composed).toBe(true);
  });

  it("detailに値を設定した場合、正しく設定されること", () => {
    const detailValue = { id: 1, name: "example" };
    const event = createCustomEvent("test-event", { detail: detailValue });
    expect(event.detail).toEqual(detailValue);
  });

  it("オプションの上書きが正しく反映されること", () => {
    const event = createCustomEvent("test-event", {
      bubbles: false,
      cancelable: false,
      composed: false,
    });
    expect(event.bubbles).toBe(false);
    expect(event.cancelable).toBe(false);
    expect(event.composed).toBe(false);
  });

  it("dispatchCustomEventが正しくイベントを発火すること", () => {
    // 1. ブラウザの HTMLElement の代わりに Node.js 標準の EventTarget を生成
    const target = new EventTarget();
    const listenerMock = vi.fn(); // モック関数を作成

    // 2. イベントリスナーを登録
    target.addEventListener("my-event", listenerMock as EventListener);

    // 3. テスト対象の関数を実行してイベントを発火
    const payload = { count: 42 };
    const result = dispatchCustomEvent(
      target as unknown as HTMLElement,
      "my-event",
      {
        detail: payload,
      },
    );

    // 4. 検証
    expect(listenerMock).toHaveBeenCalledTimes(1); // リスナーが1回呼ばれたか

    const eventArg = listenerMock.mock.calls[0][0] as CustomEvent;
    expect(eventArg.type).toBe("my-event");
    expect(eventArg.detail).toEqual({ count: 42 }); // データが届いているか
    expect(result).toBe(true); // キャンセルされず正常に発火を終えたか
  });
});
