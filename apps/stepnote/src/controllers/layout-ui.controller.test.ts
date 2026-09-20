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
 * 仕様 3:ナビゲーションエリアの開閉状態の反転およびホストへの再描画通知が正しく行われること。
 * 仕様 4:ナビゲーションリストエリアの開閉状態の反転およびホストへの再描画通知が正しく行われること。
 * 仕様 5:各セッターメソッドで明示的に値を設定した場合、正しく反映されること。
 * 仕様 6:すでに同じ状態がセットされた場合は不要な再描画通知が行われないこと。
 * 仕様 7:subscribe で登録されたリスナー関数が状態変更時に呼び出され、解除関数で購読解除できること。
 *  */
describe("layout-ui.controller", () => {
  describe("初期状態の検証", () => {
    it("初期状態として、すべてのパネル・ドロワーが期待通りのデフォルト値で初期化されること", () => {
      const { host } = createMockHost();
      const controller = new LayoutUIController(host);
      expect(controller.state).toEqual({
        isQuickAccessOpen: true,
        isNavigationAreaOpen: true,
        isNavigationListAreaOpen: true,
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

    it("ナビゲーションエリアの開閉状態の反転およびホストへの再描画通知が正しく行われること。", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      // 初期値 true -> false に反転
      controller.toggleNavigationArea();
      expect(controller.state.isNavigationAreaOpen).toBe(false);
      expect(requestUpdateMock).toHaveBeenCalledTimes(1);

      // false -> true に反転
      controller.toggleNavigationArea();
      expect(controller.state.isNavigationAreaOpen).toBe(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(2);
    });

    it("ナビゲーションリストエリアの開閉状態の反転およびホストへの再描画通知が正しく行われること。", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      // 初期値 true -> false に反転
      controller.toggleNavigationListArea();
      expect(controller.state.isNavigationListAreaOpen).toBe(false);
      expect(requestUpdateMock).toHaveBeenCalledTimes(1);

      // false -> true に反転
      controller.toggleNavigationListArea();
      expect(controller.state.isNavigationListAreaOpen).toBe(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("明示的な値の設定の検証", () => {
    it("各セッターメソッドで明示的に値を設定した場合、正しく反映されること。", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      controller.setQuickAccessOpen(false);
      expect(controller.state.isQuickAccessOpen).toBe(false);

      controller.setNavigationAreaOpen(false);
      expect(controller.state.isNavigationAreaOpen).toBe(false);

      controller.setNavigationListAreaOpen(false);
      expect(controller.state.isNavigationListAreaOpen).toBe(false);

      expect(requestUpdateMock).toHaveBeenCalledTimes(3);
    });

    it("すでに同じ状態がセットされた場合は不要な再描画通知が行われないこと。", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      controller.setQuickAccessOpen(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(0);

      controller.setNavigationAreaOpen(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(0);

      controller.setNavigationListAreaOpen(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(0);
    });
  });

  describe("状態購読（subscribe）の検証", () => {
    it("subscribe で登録されたリスナー関数が状態変更時に呼び出され、解除関数で購読解除できること", () => {
      const { host } = createMockHost();
      const controller = new LayoutUIController(host);
      const listenerMock = vi.fn();

      const unsubscribe = controller.subscribe(listenerMock);
      expect(typeof unsubscribe).toBe("function");

      // 状態変更（toggleQuickAccess）でリスナーが発火すること
      controller.toggleQuickAccess();
      expect(listenerMock).toHaveBeenCalledTimes(1);

      // setNavigationAreaOpen でリスナーが発火すること
      controller.setNavigationAreaOpen(false);
      expect(listenerMock).toHaveBeenCalledTimes(2);

      // 解除関数を実行
      unsubscribe();

      // 解除後は状態変更があってもリスナーが発火しないこと
      controller.toggleQuickAccess();
      expect(listenerMock).toHaveBeenCalledTimes(2);
    });
  });
});
