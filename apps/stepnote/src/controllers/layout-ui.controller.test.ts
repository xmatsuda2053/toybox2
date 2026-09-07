import { describe, it, expect, vi } from "vitest";
import type { ReactiveControllerHost } from "lit";
import { LayoutUIController } from "./layout-ui.controller";

/**
 * Reactive Controller の モック
 *
 */
const createMockHost = () => {
  const requestUpdateMock = vi.fn();
  const host: ReactiveControllerHost = {
    addController: () => {},
    removeController: () => {},
    requestUpdate: requestUpdateMock,
    updateComplete: Promise.resolve(true),
  };
  return { host, requestUpdateMock };
};

/**
 * 仕様 1:初期状態として、すべてのパネル・ドロワーが期待通りのデフォルト値で初期化されること。
 * 仕様 2:QUICK ACCESS の開閉状態の反転およびホストへの再描画通知が正しく行われること。
 * 仕様 3:エリア1の開閉状態の反転およびホストへの再描画通知が正しく行われること。
 * 仕様 4:エリア2の開閉状態の反転およびホストへの再描画通知が正しく行われること。
 * 仕様 5:各セッターメソッドで明示的に値を設定した場合、正しく反映されること。
 * 仕様 6:すでに同じ状態がセットされた場合は不要な再描画通知が行われないこと。
 *  */
describe("layout-ui.controller", () => {
  describe("初期状態の検証", () => {
    it("初期状態として、すべてのパネル・ドロワーが期待通りのデフォルト値で初期化されること", () => {
      const { host } = createMockHost();
      const controller = new LayoutUIController(host);
      expect(controller.state).toEqual({
        isQuickAccessOpen: true,
        isArea1Open: true,
        isArea2Open: true,
      });
    });
  });

  describe("トグル操作の検証", () => {
    it("QUICK ACCESS の開閉状態の反転およびホストへの再描画通知が正しく行われること", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      // 初期値 true -> false に反転
      controller.toggleQuickAccess();
      expect(controller.state.isQuickAccessOpen).toBe(false);
      expect(requestUpdateMock).toHaveBeenCalledTimes(1);

      // false -> true に反転
      controller.toggleQuickAccess();
      expect(controller.state.isQuickAccessOpen).toBe(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(2);
    });

    it("エリア1の開閉状態の反転およびホストへの再描画通知が正しく行われること。", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      // 初期値 true -> false に反転
      controller.toggleArea1();
      expect(controller.state.isArea1Open).toBe(false);
      expect(requestUpdateMock).toHaveBeenCalledTimes(1);

      // false -> true に反転
      controller.toggleArea1();
      expect(controller.state.isArea1Open).toBe(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(2);
    });

    it("エリア2の開閉状態の反転およびホストへの再描画通知が正しく行われること。", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      // 初期値 true -> false に反転
      controller.toggleArea2();
      expect(controller.state.isArea2Open).toBe(false);
      expect(requestUpdateMock).toHaveBeenCalledTimes(1);

      // false -> true に反転
      controller.toggleArea2();
      expect(controller.state.isArea2Open).toBe(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("明示的な値の設定の検証", () => {
    it("各セッターメソッドで明示的に値を設定した場合、正しく反映されること。", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      controller.setQuickAccessOpen(false);
      expect(controller.state.isQuickAccessOpen).toBe(false);

      controller.setArea1Open(false);
      expect(controller.state.isArea1Open).toBe(false);

      controller.setArea2Open(false);
      expect(controller.state.isArea2Open).toBe(false);

      expect(requestUpdateMock).toHaveBeenCalledTimes(3);
    });

    it("すでに同じ状態がセットされた場合は不要な再描画通知が行われないこと。", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      controller.setQuickAccessOpen(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(0);

      controller.setArea1Open(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(0);

      controller.setArea2Open(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(0);
    });
  });
});
