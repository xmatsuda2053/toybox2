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
 * 仕様 10:toggleZenMode の実行により集中モードが有効化され（isZenMode: true）、左右ペインが一括で閉じられること。
 * 仕様 11:集中モード有効時に再度 toggleZenMode を実行すると集中モードが解除され（isZenMode: false）、常に左右両ペイン（サイドパネルおよびJournal）が展開されること。
 * 仕様 12:setZenMode で明示的に集中モードを設定でき、同じ状態の場合は不要な通知が行われないこと。
 * 仕様 13:集中モード有効時に個別トグル操作が行われた場合、集中モードが自動的に解除（isZenMode: false）されること。
 * 仕様 13-3:集中モード中にサイドパネルを開いた後、再度集中モードをON/OFFした際、Journalが外れず左右両ペインが揃って展開されること。
 * 仕様 14:スクラッチモード（Scratch Mode）の初期状態が false であること。
 * 仕様 15:toggleScratchMode の実行によりスクラッチモードが有効化され（isScratchMode: true）、左右ペインが一括で閉じられ（isNavigationListAreaOpen: false, isJournalAreaOpen: false）、集中モードも解除されること。
 * 仕様 16:スクラッチモード有効時に再度 toggleScratchMode を実行するとスクラッチモードが解除され（isScratchMode: false）、常に左右両ペイン（サイドパネルおよびJournal）が展開された標準状態へ復帰すること。
 * 仕様 17:setScratchMode で明示的にスクラッチモードを設定でき、同じ状態の場合は不要な通知が行われないこと。
 * 仕様 18:スクラッチモード有効時、toggleNavigationListArea, toggleJournalArea, toggleZenMode, toggleSettingsMode を呼び出しても状態が変更されずガードされること。
 * 仕様 19:設定モード（Settings Mode）の初期状態が false であること。
 * 仕様 20:toggleSettingsMode の実行により設定モードが有効化され（isSettingsMode: true）、左右ペインが一括で閉じられ（isNavigationListAreaOpen: false, isJournalAreaOpen: false）、集中モードおよびスクラッチモードも解除されること。
 * 仕様 21:設定モード有効時に再度 toggleSettingsMode を実行すると設定モードが解除され（isSettingsMode: false）、常に左右両ペイン（サイドパネルおよびJournal）が展開された標準状態へ復帰すること。
 * 仕様 22:setSettingsMode で明示的に設定モードを設定でき、同じ状態の場合は不要な通知が行われないこと。
 * 仕様 23:設定モード有効時、toggleNavigationListArea, toggleJournalArea, toggleZenMode, toggleScratchMode を呼び出しても状態が変更されずガードされること。
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
        isScratchMode: false,
        isSettingsMode: false,
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

    it("仕様 11: 集中モード解除（OFF）時に、直前の開閉状態にかかわらず常に左右両ペイン（サイドパネルおよびJournal）が展開されること", () => {
      const { host } = createMockHost();
      const controller = new LayoutUIController(host);

      // 事前にジャーナルを閉じた状態にしておく
      controller.setJournalAreaOpen(false);
      expect(controller.state.isNavigationListAreaOpen).toBe(true);
      expect(controller.state.isJournalAreaOpen).toBe(false);

      // 集中モード ON（両ペイン閉）
      (controller as unknown as { toggleZenMode: () => void }).toggleZenMode();
      expect((controller.state as unknown as { isZenMode: boolean }).isZenMode).toBe(true);
      expect(controller.state.isNavigationListAreaOpen).toBe(false);
      expect(controller.state.isJournalAreaOpen).toBe(false);

      // 集中モード OFF（両ペインが確実に開状態に展開されること）
      (controller as unknown as { toggleZenMode: () => void }).toggleZenMode();
      expect((controller.state as unknown as { isZenMode: boolean }).isZenMode).toBe(false);
      expect(controller.state.isNavigationListAreaOpen).toBe(true);
      expect(controller.state.isJournalAreaOpen).toBe(true);
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

    it("仕様 13-3: 集中モード中にサイドパネルを開いた後、再度集中モードをON/OFFした際、Journalが外れず左右両ペインが揃って展開されること", () => {
      const { host } = createMockHost();
      const controller = new LayoutUIController(host);

      // 1. 集中モード ON
      (controller as unknown as { toggleZenMode: () => void }).toggleZenMode();
      expect((controller.state as unknown as { isZenMode: boolean }).isZenMode).toBe(true);
      expect(controller.state.isNavigationListAreaOpen).toBe(false);
      expect(controller.state.isJournalAreaOpen).toBe(false);

      // 2. サイドパネルを開く（個別操作により集中モードは自動解除）
      controller.toggleNavigationListArea();
      expect(controller.state.isNavigationListAreaOpen).toBe(true);
      expect(controller.state.isJournalAreaOpen).toBe(false);
      expect((controller.state as unknown as { isZenMode: boolean }).isZenMode).toBe(false);

      // 3. 再度集中モード ON
      (controller as unknown as { toggleZenMode: () => void }).toggleZenMode();
      expect((controller.state as unknown as { isZenMode: boolean }).isZenMode).toBe(true);
      expect(controller.state.isNavigationListAreaOpen).toBe(false);
      expect(controller.state.isJournalAreaOpen).toBe(false);

      // 4. 集中モード OFF（解除）
      (controller as unknown as { toggleZenMode: () => void }).toggleZenMode();
      expect((controller.state as unknown as { isZenMode: boolean }).isZenMode).toBe(false);
      // Journalが閉じたまま取り残されず、サイドパネル・Journalの双方が開くこと
      expect(controller.state.isNavigationListAreaOpen).toBe(true);
      expect(controller.state.isJournalAreaOpen).toBe(true);
    });
  });

  describe("スクラッチモード（Scratch Mode）の検証", () => {
    it("仕様 14: スクラッチモードの初期状態が false であること", () => {
      const { host } = createMockHost();
      const controller = new LayoutUIController(host);
      expect(
        (controller.state as unknown as { isScratchMode: boolean }).isScratchMode,
      ).toBe(false);
    });

    it("仕様 15: toggleScratchMode の実行によりスクラッチモードが有効化され、左右ペインが一括で閉じられ、集中モードも解除されること", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      // 先に集中モードにしておく
      controller.setZenMode(true);
      expect(controller.state.isZenMode).toBe(true);

      (controller as unknown as { toggleScratchMode: () => void }).toggleScratchMode();

      expect(
        (controller.state as unknown as { isScratchMode: boolean }).isScratchMode,
      ).toBe(true);
      expect(controller.state.isNavigationListAreaOpen).toBe(false);
      expect(controller.state.isJournalAreaOpen).toBe(false);
      expect(controller.state.isZenMode).toBe(false);
      expect(requestUpdateMock).toHaveBeenCalled();
    });

    it("仕様 16: スクラッチモード有効時に再度 toggleScratchMode を実行するとスクラッチモードが解除され、常に左右両ペインが展開された標準状態へ復帰すること", () => {
      const { host } = createMockHost();
      const controller = new LayoutUIController(host);

      // 1. スクラッチモード有効化
      (controller as unknown as { toggleScratchMode: () => void }).toggleScratchMode();
      expect(
        (controller.state as unknown as { isScratchMode: boolean }).isScratchMode,
      ).toBe(true);
      expect(controller.state.isNavigationListAreaOpen).toBe(false);
      expect(controller.state.isJournalAreaOpen).toBe(false);

      // 2. スクラッチモード解除
      (controller as unknown as { toggleScratchMode: () => void }).toggleScratchMode();
      expect(
        (controller.state as unknown as { isScratchMode: boolean }).isScratchMode,
      ).toBe(false);
      // 常に左右両ペインが展開された標準状態に戻ること
      expect(controller.state.isNavigationListAreaOpen).toBe(true);
      expect(controller.state.isJournalAreaOpen).toBe(true);
      expect(controller.state.isZenMode).toBe(false);
    });

    it("仕様 17: setScratchMode で明示的にスクラッチモードを設定でき、同じ状態の場合は不要な通知が行われないこと", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      (controller as unknown as { setScratchMode: (enabled: boolean) => void }).setScratchMode(true);
      expect(
        (controller.state as unknown as { isScratchMode: boolean }).isScratchMode,
      ).toBe(true);
      const callCount = requestUpdateMock.mock.calls.length;

      // 同じ状態 (true) を再度セットしても通知されないこと
      (controller as unknown as { setScratchMode: (enabled: boolean) => void }).setScratchMode(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(callCount);

      // false に戻す
      (controller as unknown as { setScratchMode: (enabled: boolean) => void }).setScratchMode(false);
      expect(
        (controller.state as unknown as { isScratchMode: boolean }).isScratchMode,
      ).toBe(false);
      expect(requestUpdateMock).toHaveBeenCalledTimes(callCount + 1);
    });

    it("仕様 18: スクラッチモード有効時、toggleNavigationListArea, toggleJournalArea, toggleZenMode, toggleSettingsMode を呼び出しても状態が変更されずガードされること", () => {
      const { host } = createMockHost();
      const controller = new LayoutUIController(host);

      // スクラッチモード有効化
      (controller as unknown as { setScratchMode: (enabled: boolean) => void }).setScratchMode(true);
      expect(
        (controller.state as unknown as { isScratchMode: boolean }).isScratchMode,
      ).toBe(true);
      expect(controller.state.isNavigationListAreaOpen).toBe(false);
      expect(controller.state.isJournalAreaOpen).toBe(false);

      // 各種操作を試行しても状態が変わらないこと
      controller.toggleNavigationListArea();
      expect(controller.state.isNavigationListAreaOpen).toBe(false);

      controller.toggleJournalArea();
      expect(controller.state.isJournalAreaOpen).toBe(false);

      controller.toggleZenMode();
      expect(controller.state.isZenMode).toBe(false);

      (
        controller as unknown as { toggleSettingsMode?: () => void }
      ).toggleSettingsMode?.();
      expect(
        (controller.state as unknown as { isSettingsMode: boolean })
          .isSettingsMode,
      ).toBe(false);
    });
  });

  describe("設定モード（Settings Mode）の検証", () => {
    it("仕様 19: 設定モードの初期状態が false であること", () => {
      const { host } = createMockHost();
      const controller = new LayoutUIController(host);
      expect(
        (controller.state as unknown as { isSettingsMode: boolean })
          .isSettingsMode,
      ).toBe(false);
    });

    it("仕様 20: toggleSettingsMode の実行により設定モードが有効化され、左右ペインが一括で閉じられ、集中モードおよびスクラッチモードも解除されること", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      controller.setZenMode(true);
      expect(controller.state.isZenMode).toBe(true);

      (
        controller as unknown as { toggleSettingsMode: () => void }
      ).toggleSettingsMode();

      expect(
        (controller.state as unknown as { isSettingsMode: boolean })
          .isSettingsMode,
      ).toBe(true);
      expect(controller.state.isNavigationListAreaOpen).toBe(false);
      expect(controller.state.isJournalAreaOpen).toBe(false);
      expect(controller.state.isZenMode).toBe(false);
      expect(controller.state.isScratchMode).toBe(false);
      expect(requestUpdateMock).toHaveBeenCalled();
    });

    it("仕様 21: 設定モード有効時に再度 toggleSettingsMode を実行すると設定モードが解除され、常に左右両ペインが展開された標準状態へ復帰すること", () => {
      const { host } = createMockHost();
      const controller = new LayoutUIController(host);

      (
        controller as unknown as { toggleSettingsMode: () => void }
      ).toggleSettingsMode();
      expect(
        (controller.state as unknown as { isSettingsMode: boolean })
          .isSettingsMode,
      ).toBe(true);
      expect(controller.state.isNavigationListAreaOpen).toBe(false);
      expect(controller.state.isJournalAreaOpen).toBe(false);

      (
        controller as unknown as { toggleSettingsMode: () => void }
      ).toggleSettingsMode();
      expect(
        (controller.state as unknown as { isSettingsMode: boolean })
          .isSettingsMode,
      ).toBe(false);
      expect(controller.state.isNavigationListAreaOpen).toBe(true);
      expect(controller.state.isJournalAreaOpen).toBe(true);
      expect(controller.state.isZenMode).toBe(false);
      expect(controller.state.isScratchMode).toBe(false);
    });

    it("仕様 22: setSettingsMode で明示的に設定モードを設定でき、同じ状態の場合は不要な通知が行われないこと", () => {
      const { host, requestUpdateMock } = createMockHost();
      const controller = new LayoutUIController(host);

      (
        controller as unknown as { setSettingsMode: (enabled: boolean) => void }
      ).setSettingsMode(true);
      expect(
        (controller.state as unknown as { isSettingsMode: boolean })
          .isSettingsMode,
      ).toBe(true);
      const callCount = requestUpdateMock.mock.calls.length;

      (
        controller as unknown as { setSettingsMode: (enabled: boolean) => void }
      ).setSettingsMode(true);
      expect(requestUpdateMock).toHaveBeenCalledTimes(callCount);

      (
        controller as unknown as { setSettingsMode: (enabled: boolean) => void }
      ).setSettingsMode(false);
      expect(
        (controller.state as unknown as { isSettingsMode: boolean })
          .isSettingsMode,
      ).toBe(false);
      expect(requestUpdateMock).toHaveBeenCalledTimes(callCount + 1);
    });

    it("仕様 23: 設定モード有効時、toggleNavigationListArea, toggleJournalArea, toggleZenMode, toggleScratchMode を呼び出しても状態が変更されずガードされること", () => {
      const { host } = createMockHost();
      const controller = new LayoutUIController(host);

      (
        controller as unknown as { setSettingsMode: (enabled: boolean) => void }
      ).setSettingsMode(true);
      expect(
        (controller.state as unknown as { isSettingsMode: boolean })
          .isSettingsMode,
      ).toBe(true);

      controller.toggleNavigationListArea();
      expect(controller.state.isNavigationListAreaOpen).toBe(false);

      controller.toggleJournalArea();
      expect(controller.state.isJournalAreaOpen).toBe(false);

      controller.toggleZenMode();
      expect(controller.state.isZenMode).toBe(false);

      controller.toggleScratchMode();
      expect(controller.state.isScratchMode).toBe(false);
    });
  });
});
