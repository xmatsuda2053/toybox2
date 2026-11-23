import { describe, it, expect, vi } from "vitest";
import {
  OPEN_SIDEPANEL_COMMAND,
  initSidePanelBehavior,
  handleCommand,
} from "./background";

/**
 * テスト仕様: Service Worker (background.ts)
 *
 * - 仕様1: initSidePanelBehavior が setPanelBehavior({ openPanelOnActionClick: true }) を呼び出すこと
 * - 仕様2: sidePanel API が存在しない環境でも例外を投げず安全に終了すること
 * - 仕様3: handleCommand がショートカットコマンド受信時に現在ウィンドウで sidePanel.open を呼び出すこと
 * - 仕様4: 未定義コマンドでは sidePanel.open を呼び出さないこと
 */
describe("Background Service Worker Tests", () => {
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

  it("handleCommand が対象コマンド受信時にアクティブウィンドウで sidePanel.open を呼び出すこと", async () => {
    const open = vi.fn().mockResolvedValue(undefined);
    const getLastFocusedWindow = vi.fn().mockResolvedValue({ id: 42 });

    await handleCommand(OPEN_SIDEPANEL_COMMAND, {
      sidePanel: { open },
      getLastFocusedWindow,
    });

    expect(getLastFocusedWindow).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith({ windowId: 42 });
  });

  it("対象外のコマンド受信時は sidePanel.open を呼び出さないこと", async () => {
    const open = vi.fn().mockResolvedValue(undefined);
    const getLastFocusedWindow = vi.fn().mockResolvedValue({ id: 42 });

    await handleCommand("other-command", {
      sidePanel: { open },
      getLastFocusedWindow,
    });

    expect(open).not.toHaveBeenCalled();
  });
});
