import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  OPEN_SIDEPANEL_COMMAND,
  SIDEPANEL_PORT_NAME,
  initSidePanelBehavior,
  handleCommand,
  registerSidePanelPort,
  clearRegisteredSidePanelPorts,
  type SidePanelPortLike,
} from "./background";

function createMockPort(windowId?: number): SidePanelPortLike & {
  triggerMessage: (msg: unknown) => void;
  triggerDisconnect: () => void;
} {
  const messageListeners: Array<(msg: unknown) => void> = [];
  const disconnectListeners: Array<() => void> = [];

  return {
    name: SIDEPANEL_PORT_NAME,
    sender: windowId !== undefined ? { windowId } : undefined,
    postMessage: vi.fn(),
    onMessage: {
      addListener: (cb) => {
        messageListeners.push(cb);
      },
    },
    onDisconnect: {
      addListener: (cb) => {
        disconnectListeners.push(cb);
      },
    },
    triggerMessage: (msg: unknown) => {
      for (const cb of messageListeners) {
        cb(msg);
      }
    },
    triggerDisconnect: () => {
      for (const cb of disconnectListeners) {
        cb();
      }
    },
  };
}

/**
 * テスト仕様: HubOffice Service Worker (background.ts)
 *
 * - 仕様1: OPEN_SIDEPANEL_COMMAND と SIDEPANEL_PORT_NAME が HubOffice 固有の識別子であること
 * - 仕様2: initSidePanelBehavior が setPanelBehavior({ openPanelOnActionClick: true }) を呼び出すこと
 * - 仕様3: sidePanel API 未定義環境でも例外を投げず安全に終了すること
 * - 仕様4: パネルが閉じている状態で handleCommand が呼ばれた場合、tab.windowId で同期的に sidePanel.open を呼ぶこと
 * - 仕様5: パネルが開いている状態（ポート接続中）で handleCommand が呼ばれた場合、sidePanel.close またはポート経由で閉じること
 * - 仕様6: ポート切断後は再び sidePanel.open が呼ばれること
 * - 仕様7: 対象外コマンドでは開閉処理を行わないこと
 */
describe("HubOffice Background Service Worker Tests", () => {
  beforeEach(() => {
    clearRegisteredSidePanelPorts();
  });

  it("HubOffice 固有のコマンド名とポート名が定義されていること", () => {
    expect(OPEN_SIDEPANEL_COMMAND).toBe("open-huboffice-sidepanel");
    expect(SIDEPANEL_PORT_NAME).toBe("huboffice-sidepanel");
  });

  it("initSidePanelBehavior が openPanelOnActionClick: true を設定すること", async () => {
    const setPanelBehavior = vi.fn().mockResolvedValue(undefined);

    await initSidePanelBehavior({ setPanelBehavior });

    expect(setPanelBehavior).toHaveBeenCalledTimes(1);
    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });
  });

  it("sidePanel API が未定義の場合でもエラーにならず終了すること", async () => {
    await expect(initSidePanelBehavior(undefined)).resolves.toBeUndefined();
  });

  it("パネルが閉じている状態で handleCommand が呼ばれると同期的に sidePanel.open を呼ぶこと", () => {
    const open = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const getLastFocusedWindow = vi.fn().mockResolvedValue({ id: 99 });

    handleCommand(
      OPEN_SIDEPANEL_COMMAND,
      { windowId: 42 },
      {
        sidePanel: { open, close },
        getLastFocusedWindow,
      },
    );

    expect(open).toHaveBeenCalledWith({ windowId: 42 });
    expect(close).not.toHaveBeenCalled();
    expect(getLastFocusedWindow).not.toHaveBeenCalled();
  });

  it("パネルが開いている状態で handleCommand が呼ばれると閉じる処理を実行すること", async () => {
    const open = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const port = createMockPort();

    registerSidePanelPort(port);
    port.triggerMessage({ type: "register", windowId: 42 });

    await handleCommand(
      OPEN_SIDEPANEL_COMMAND,
      { windowId: 42 },
      { sidePanel: { open, close } },
    );

    expect(close).toHaveBeenCalledWith({ windowId: 42 });
    expect(open).not.toHaveBeenCalled();

    await handleCommand(
      OPEN_SIDEPANEL_COMMAND,
      { windowId: 42 },
      { sidePanel: { open } },
    );
    expect(port.postMessage).toHaveBeenCalledWith({ type: "close" });
  });

  it("ポート切断後は閉じた状態として扱われ、次のコマンドで sidePanel.open が呼ばれること", () => {
    const open = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const port = createMockPort(42);

    registerSidePanelPort(port);
    port.triggerDisconnect();

    handleCommand(
      OPEN_SIDEPANEL_COMMAND,
      { windowId: 42 },
      { sidePanel: { open, close } },
    );

    expect(open).toHaveBeenCalledWith({ windowId: 42 });
    expect(close).not.toHaveBeenCalled();
  });

  it("対象外コマンドでは開閉処理を行わないこと", async () => {
    const open = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);

    await handleCommand(
      "other-command",
      { windowId: 42 },
      { sidePanel: { open, close } },
    );

    expect(open).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });
});
