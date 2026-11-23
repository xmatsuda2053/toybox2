import { describe, it, expect, vi } from "vitest";
import { connectSidePanelPort } from "./sidepanel-connection";

/**
 * テスト仕様: Side Panel クライアント接続補助 (sidepanel-connection.ts)
 *
 * - 仕様1: 起動時に chrome.runtime.connect で持続ポートを接続し、windowId を登録送信すること
 * - 仕様2: ポート経由で { type: "close" } メッセージを受信したら closeWindow コールバックを実行すること
 * - 仕様3: chrome.runtime API が未定義の通常ブラウザ環境でもエラーにならないこと
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
});
