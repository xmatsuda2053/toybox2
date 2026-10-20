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
 * 仕様 5:Journalエリアの開閉状態の反転およびホストへの再描画通知が正しく行われること。
 * 仕様 6:各セッターメソッドで明示的に値を設定した場合、正しく反映されること。
 * 仕様 7:すでに同じ状態がセットされた場合は不要な再描画通知が行われないこと。
 * 仕様 8:subscribe で登録されたリスナー関数が状態変更時に呼び出され、解除関数で購読解除できること。
 * 仕様 9:集中モード（Zen Mode）の初期状態が false であること。
 * 仕様 10:toggleZenMode の実行により集中モードが有効化され（isZenMode: true）、直前の開閉状態が記憶され、左右ペインが一括で閉じられること。
 * 仕様 11:集中モード有効時に再度 toggleZenMode を実行すると集中モードが解除され（isZenMode: false）、突入直前の開閉状態へ復元されること。
 * 仕様 12:setZenMode で明示的に集中モードを設定でき、同じ状態の場合は不要な通知が行われないこと。
 * 仕様 13:集中モード有効時に個別トグル操作が行われた場合、集中モードが自動的に解除（isZenMode: false）されること。
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
        isJournalAreaOpen: true,
        isZenMode: false,
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

    it("Journalエリアの開閉状態の反転およびホストへの再描画通知が正しく行われること。", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      // 初期値 true -> false に反転
      (controller as unknown as { toggleJournalArea: () => void }).toggleJournalArea();
      expect((controller.state as unknown as { isJournalAreaOpen: boolean }).isJournalAreaOpen).toBe(false);
      expect(requestUpdateMock).toHaveBeenCalledTimes(1);

      // false -> true に反転
      (controller as unknown as { toggleJournalArea: () => void }).toggleJournalArea();
      expect((controller.state as unknown as { isJournalAreaOpen: boolean }).isJournalAreaOpen).toBe(true);
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

      (controller as unknown as { setJournalAreaOpen: (isOpen: boolean) => void }).setJournalAreaOpen(false);
      expect((controller.state as unknown as { isJournalAreaOpen: boolean }).isJournalAreaOpen).toBe(false);

      expect(requestUpdateMock).toHaveBeenCalledTimes(4);
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

      (controller as unknown as { setJournalAreaOpen: (isOpen: boolean) => void }).setJournalAreaOpen(true);
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

  describe("集中モード（Zen Mode）の検証", () => {
    it("仕様 10: toggleZenMode の実行により集中モードが有効化され、左右ペインが一括で閉じられること", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      // 通常状態（両方開）から集中モードへ切り替え
      (controller as unknown as { toggleZenMode: () => void }).toggleZenMode();

      const state = controller.state as unknown as {
        isZenMode: boolean;
        isNavigationListAreaOpen: boolean;
        isJournalAreaOpen: boolean;
      };
      expect(state.isZenMode).toBe(true);
      expect(state.isNavigationListAreaOpen).toBe(false);
      expect(state.isJournalAreaOpen).toBe(false);
      expect(requestUpdateMock).toHaveBeenCalledTimes(1);
    });

    it("仕様 11: 集中モード有効時に再度 toggleZenMode を実行すると解除され、突入直前の開閉状態へ復元されること", () => {
      const { host } = createMockHost();
      const controller = new LayoutUIController(host);

      // 初期状態：サイドバー開、ジャーナル閉 のカスタム状態で準備
      controller.setJournalAreaOpen(false);
      expect(controller.state.isNavigationListAreaOpen).toBe(true);
      expect(controller.state.isJournalAreaOpen).toBe(false);

      // 集中モード ON
      (controller as unknown as { toggleZenMode: () => void }).toggleZenMode();
      const zenState = controller.state as unknown as {
        isZenMode: boolean;
        isNavigationListAreaOpen: boolean;
        isJournalAreaOpen: boolean;
      };
      expect(zenState.isZenMode).toBe(true);
      expect(zenState.isNavigationListAreaOpen).toBe(false);
      expect(zenState.isJournalAreaOpen).toBe(false);

      // 集中モード OFF（突入前の状態へ復帰）
      (controller as unknown as { toggleZenMode: () => void }).toggleZenMode();
      const restoredState = controller.state as unknown as {
        isZenMode: boolean;
        isNavigationListAreaOpen: boolean;
        isJournalAreaOpen: boolean;
      };
      expect(restoredState.isZenMode).toBe(false);
      expect(restoredState.isNavigationListAreaOpen).toBe(true);
      expect(restoredState.isJournalAreaOpen).toBe(false);
    });

    it("仕様 12: setZenMode で明示的に集中モードを設定でき、同じ状態の場合は不要な通知が行われないこと", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      // 既に false なので再描画されないこと
      (controller as unknown as { setZenMode: (enabled: boolean) => void }).setZenMode(false);
      expect(requestUpdateMock).toHaveBeenCalledTimes(0);

      // true に設定
      (controller as unknown as { setZenMode: (enabled: boolean) => void }).setZenMode(true);
      expect((controller.state as unknown as { isZenMode: boolean }).isZenMode).toBe(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(1);

      // すでに true なので再描画されないこと
      (controller as unknown as { setZenMode: (enabled: boolean) => void }).setZenMode(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(1);
    });

    it("仕様 13-1: 集中モード有効時にサイドパネルを開く操作が行われた場合、集中モードが自動的に解除されること", () => {
      const { host } = createMockHost();
      const controller = new LayoutUIController(host);

      (controller as unknown as { toggleZenMode: () => void }).toggleZenMode();
      expect((controller.state as unknown as { isZenMode: boolean }).isZenMode).toBe(true);

      // サイドパネルを開くトグル
      controller.toggleNavigationListArea();
      expect(controller.state.isNavigationListAreaOpen).toBe(true);
      expect((controller.state as unknown as { isZenMode: boolean }).isZenMode).toBe(false);
    });

    it("仕様 13-2: 集中モード有効時にJournalエリアを開く操作が行われた場合、集中モードが自動的に解除されること", () => {
      const { host } = createMockHost();
      const controller = new LayoutUIController(host);

      (controller as unknown as { toggleZenMode: () => void }).toggleZenMode();
      expect((controller.state as unknown as { isZenMode: boolean }).isZenMode).toBe(true);

      // Journalを開く
      controller.setJournalAreaOpen(true);
      expect(controller.state.isJournalAreaOpen).toBe(true);
      expect((controller.state as unknown as { isZenMode: boolean }).isZenMode).toBe(false);
    });
  });
});
