import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSidePanelBackground,
  type SidePanelPortLike,
} from "./sidepanel-background.utils";

/**
 * 【sidepanel-background.utils 仕様（Chrome Side Panel 共通 Service Worker 基盤）】
 *
 * 1. ツールバークリック挙動初期化（initSidePanelBehavior）
 *    - 1-1. setPanelBehavior({ openPanelOnActionClick: true }) を呼び出すこと
 *    - 1-2. sidePanel API が未定義の場合は例外を投げずに終了すること
 *
 * 2. ショートカットコマンドによる開閉トグル（handleCommand / registerSidePanelPort）
 *    - 2-1. 設定外のコマンド名の場合は何も実行しないこと
 *    - 2-2. 対象ウィンドウの Side Panel が未接続の場合、tab.windowId で同期的に sidePanel.open を呼び出すこと
 *    - 2-3. 対象ウィンドウのポートが登録済みの場合、sidePanel.close を優先呼び出しし、未対応・失敗時は close メッセージを送信すること
 *    - 2-4. register メッセージ受信後にウィンドウ ID が紐付けられ、onDisconnect 時に追跡状態から削除されること
 *    - 2-5. 異なる設定のインスタンス間でポート追跡状態が独立していること
 */

function createMockPort(
  name: string,
  sender?: SidePanelPortLike["sender"],
): {
  port: SidePanelPortLike;
  emitMessage: (msg: unknown) => void;
  emitDisconnect: () => void;
  postMessage: ReturnType<typeof vi.fn>;
} {
  const messageListeners: Array<(msg: unknown) => void> = [];
  const disconnectListeners: Array<() => void> = [];
  const postMessage = vi.fn();

  const port: SidePanelPortLike = {
    name,
    sender,
    postMessage,
    onMessage: {
      addListener: (cb) => messageListeners.push(cb),
    },
    onDisconnect: {
      addListener: (cb) => disconnectListeners.push(cb),
    },
  };

  return {
    port,
    postMessage,
    emitMessage: (msg) => messageListeners.forEach((cb) => cb(msg)),
    emitDisconnect: () => disconnectListeners.forEach((cb) => cb()),
  };
}

describe("sidepanel-background.utils", () => {
  const bg = createSidePanelBackground({
    commandName: "open-sample-sidepanel",
    portName: "sample-sidepanel",
  });

  beforeEach(() => {
    bg.clearRegisteredSidePanelPorts();
  });

  it("1-1. setPanelBehavior({ openPanelOnActionClick: true }) を呼び出すこと", async () => {
    const setPanelBehavior = vi.fn().mockResolvedValue(undefined);
    await bg.initSidePanelBehavior({ setPanelBehavior });
    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });
  });

  it("1-2. sidePanel API が未定義の場合は例外を投げずに終了すること", async () => {
    await expect(bg.initSidePanelBehavior(undefined)).resolves.toBeUndefined();
  });

  it("2-1. 設定外のコマンド名の場合は何も実行しないこと", async () => {
    const open = vi.fn().mockResolvedValue(undefined);
    await bg.handleCommand(
      "other-command",
      { windowId: 10 },
      {
        sidePanel: { open },
      },
    );
    expect(open).not.toHaveBeenCalled();
  });

  it("2-2. 対象ウィンドウの Side Panel が未接続の場合、tab.windowId で同期的に sidePanel.open を呼び出すこと", async () => {
    const open = vi.fn().mockResolvedValue(undefined);
    await bg.handleCommand(
      "open-sample-sidepanel",
      { windowId: 42 },
      {
        sidePanel: { open },
      },
    );
    expect(open).toHaveBeenCalledWith({ windowId: 42 });
  });

  it("2-3. 対象ウィンドウのポートが登録済みの場合、sidePanel.close を優先呼び出しし、失敗時は close メッセージを送信すること", async () => {
    const mock = createMockPort("sample-sidepanel", { windowId: 7 });
    bg.registerSidePanelPort(mock.port);

    const open = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockRejectedValue(new Error("unsupported"));

    await bg.handleCommand(
      "open-sample-sidepanel",
      { windowId: 7 },
      {
        sidePanel: { open, close },
      },
    );

    expect(close).toHaveBeenCalledWith({ windowId: 7 });
    expect(mock.postMessage).toHaveBeenCalledWith({ type: "close" });
    expect(open).not.toHaveBeenCalled();
  });

  it("2-4. register メッセージ受信後にウィンドウ ID が紐付けられ、onDisconnect 時に追跡状態から削除されること", async () => {
    const mock = createMockPort("sample-sidepanel");
    bg.registerSidePanelPort(mock.port);
    mock.emitMessage({ type: "register", windowId: 99 });

    const open = vi.fn().mockResolvedValue(undefined);
    await bg.handleCommand(
      "open-sample-sidepanel",
      { windowId: 99 },
      {
        sidePanel: { open },
      },
    );
    expect(mock.postMessage).toHaveBeenCalledWith({ type: "close" });

    mock.emitDisconnect();
    await bg.handleCommand(
      "open-sample-sidepanel",
      { windowId: 99 },
      {
        sidePanel: { open },
      },
    );
    expect(open).toHaveBeenCalledWith({ windowId: 99 });
  });

  it("2-5. 異なる設定のインスタンス間でポート追跡状態が独立していること", async () => {
    const otherBg = createSidePanelBackground({
      commandName: "open-other-sidepanel",
      portName: "other-sidepanel",
    });

    const mock = createMockPort("sample-sidepanel", { windowId: 5 });
    bg.registerSidePanelPort(mock.port);

    const open = vi.fn().mockResolvedValue(undefined);
    await otherBg.handleCommand(
      "open-other-sidepanel",
      { windowId: 5 },
      {
        sidePanel: { open },
      },
    );
    expect(open).toHaveBeenCalledWith({ windowId: 5 });
  });
});
