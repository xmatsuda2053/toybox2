import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import type { QuickAccessController } from "@/controllers/quick-access.controller.js";
import type { QuickAccessRecord } from "@/db/models/navigation.model.js";
import {
  DEFAULT_QUICK_ACCESS,
  QUICK_ACCESS_STATIC_ID,
} from "@/constants/quick-access.constants.js";
import { NavigationQuickAccess } from "./navigation-quick-access";

/**
 * 【NavigationQuickAccess 仕様 (Phase 1: Quick Access コンポーネント実装)】
 *
 * 1. タイトル部（Header）の描画と開閉動作
 *    - [x] 1-1. タイトル部に「QUICK ACCESS」ラベルおよび開閉トグルボタン（wa-button、wa-icon[name='chevron-right']）がレンダリングされること
 *    - [x] 1-2. layoutUIController.state.isQuickAccessOpen が true（開状態）の際、アイコンに is-open クラスが付与され、ラベルが「QUICK ACCESSを折りたたむ」となること
 *    - [x] 1-3. layoutUIController.state.isQuickAccessOpen が false（閉状態）の際、アイコンに is-closed クラスが付与され、ラベルが「QUICK ACCESSを展開する」となること
 *    - [x] 1-4. handleToggleQuickAccess の実行により layoutUIController.toggleQuickAccess が呼び出されること
 *
 * 2. コンテンツ部（Content）のアコーディオン構造と8つのフィルターボタンの描画
 *    - [x] 2-1. コンテンツ部ラッパーに quick-access-content-wrapper が存在し、開閉状態に応じたクラス（is-open / is-closed）が付与されること
 *    - [x] 2-2. 8つのフィルターボタン（ブックマーク、未分類、期限切れ、期限当日、期限間近、完了、対応中、開始待ち）が正しいラベルで順番通りにレンダリングされること
 *
 * 3. 各フィルターボタンと QuickAccessController の連動
 *    - [x] 3-1. 「ブックマーク」ボタン操作により quickAccessController.toggleBookmarkSelected が実行されること
 *    - [x] 3-2. 「未分類」ボタン操作により quickAccessController.toggleUncategorizedSelected が実行されること
 *    - [x] 3-3. 「期限切れ」ボタン操作により quickAccessController.toggleOverdueSelected が実行されること
 *    - [x] 3-4. 「期限当日」ボタン操作により quickAccessController.toggleAsapSelected が実行されること
 *    - [x] 3-5. 「期限間近」ボタン操作により quickAccessController.toggleUpcomingSelected が実行されること
 *    - [x] 3-6. 「完了」ボタン操作により quickAccessController.toggleDoneSelected が実行されること
 *    - [x] 3-7. 「対応中」ボタン操作により quickAccessController.toggleProgressSelected が実行されること
 *    - [x] 3-8. 「開始待ち」ボタン操作により quickAccessController.togglePendingSelected が実行されること
 *
 * 4. 各ボタンの選択状態（ON/OFF）に応じたスタイルの反映
 *    - [x] 4-1. 状態が true（ON）の項目にはアクティブ状態を示すクラスまたは属性（is-active）が付与されること
 *    - [x] 4-2. 状態が false（OFF）の項目にはアクティブクラスが付与されないこと
 *
 * 5. コントローラー状態購読（Observer / Subscribe）とライフサイクルの連動
 *    - [x] 5-1. コントローラー設定時に controller.subscribe が呼び出され、リスナーが登録されること
 *    - [x] 5-2. 登録されたリスナーが発火した際に requestUpdate が呼び出されること
 *    - [x] 5-3. disconnectedCallback 呼び出し時に購読解除関数が実行されること
 */

describe("NavigationQuickAccess Component", () => {
  let element: NavigationQuickAccess;
  let mockLayoutUIController: {
    state: {
      isQuickAccessOpen: boolean;
      isNavigationAreaOpen: boolean;
      isNavigationListAreaOpen: boolean;
    };
    toggleQuickAccess: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let mockQuickAccessController: {
    state: QuickAccessRecord;
    toggleBookmarkSelected: ReturnType<typeof vi.fn>;
    toggleUncategorizedSelected: ReturnType<typeof vi.fn>;
    toggleOverdueSelected: ReturnType<typeof vi.fn>;
    toggleAsapSelected: ReturnType<typeof vi.fn>;
    toggleUpcomingSelected: ReturnType<typeof vi.fn>;
    toggleDoneSelected: ReturnType<typeof vi.fn>;
    toggleProgressSelected: ReturnType<typeof vi.fn>;
    togglePendingSelected: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let layoutUIUnsubMock: ReturnType<typeof vi.fn>;
  let quickAccessUnsubMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    element = new NavigationQuickAccess();

    layoutUIUnsubMock = vi.fn();
    quickAccessUnsubMock = vi.fn();

    mockLayoutUIController = {
      state: {
        isQuickAccessOpen: true,
        isNavigationAreaOpen: true,
        isNavigationListAreaOpen: true,
      },
      toggleQuickAccess: vi.fn(),
      subscribe: vi.fn().mockReturnValue(layoutUIUnsubMock),
    };

    mockQuickAccessController = {
      state: {
        id: QUICK_ACCESS_STATIC_ID,
        ...DEFAULT_QUICK_ACCESS,
      },
      toggleBookmarkSelected: vi.fn(),
      toggleUncategorizedSelected: vi.fn(),
      toggleOverdueSelected: vi.fn(),
      toggleAsapSelected: vi.fn(),
      toggleUpcomingSelected: vi.fn(),
      toggleDoneSelected: vi.fn(),
      toggleProgressSelected: vi.fn(),
      togglePendingSelected: vi.fn(),
      subscribe: vi.fn().mockReturnValue(quickAccessUnsubMock),
    };

    element.layoutUIController =
      mockLayoutUIController as unknown as LayoutUIController;
    element.quickAccessController =
      mockQuickAccessController as unknown as QuickAccessController;
  });

  describe("1. タイトル部（Header）の描画と開閉動作", () => {
    it("1-1. タイトル部に「QUICK ACCESS」ラベルおよび開閉トグルボタン（wa-button、wa-icon[name='chevron-right']）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("QUICK ACCESS");
      expect(htmlStr).toContain("wa-button");
      expect(htmlStr).toContain("btn-toggle-quick-access");
      expect(htmlStr).toContain("chevron-right");
    });

    it("1-2. layoutUIController.state.isQuickAccessOpen が true（開状態）の際、アイコンに is-open クラスが付与され、ラベルが「QUICK ACCESSを折りたたむ」となること", () => {
      mockLayoutUIController.state.isQuickAccessOpen = true;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("is-open");
      expect(htmlStr).toContain("QUICK ACCESSを折りたたむ");
    });

    it("1-3. layoutUIController.state.isQuickAccessOpen が false（閉状態）の際、アイコンに is-closed クラスが付与され、ラベルが「QUICK ACCESSを展開する」となること", () => {
      mockLayoutUIController.state.isQuickAccessOpen = false;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("is-closed");
      expect(htmlStr).toContain("QUICK ACCESSを展開する");
    });

    it("1-4. handleToggleQuickAccess の実行により layoutUIController.toggleQuickAccess が呼び出されること", () => {
      expect(typeof element.handleToggleQuickAccess).toBe("function");
      element.handleToggleQuickAccess();
      expect(mockLayoutUIController.toggleQuickAccess).toHaveBeenCalledTimes(1);
    });
  });

  describe("2. コンテンツ部（Content）のアコーディオン構造と8つのフィルターボタンの描画", () => {
    it("2-1. コンテンツ部ラッパーに quick-access-content-wrapper が存在し、開閉状態に応じたクラス（is-open / is-closed）が付与されること", () => {
      mockLayoutUIController.state.isQuickAccessOpen = true;
      let htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("quick-access-content-wrapper");
      expect(htmlStr).toContain("is-open");

      mockLayoutUIController.state.isQuickAccessOpen = false;
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("is-closed");
    });

    it("2-2. 8つのフィルターボタン（ブックマーク、未分類、期限切れ、期限当日、期限間近、完了、対応中、開始待ち）が正しいラベルで順番通りにレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      const labels = [
        "ブックマーク",
        "未分類",
        "期限切れ",
        "期限当日",
        "期限間近",
        "完了",
        "対応中",
        "開始待ち",
      ];

      let lastIndex = -1;
      for (const label of labels) {
        const currentIndex = htmlStr.indexOf(label);
        expect(currentIndex).toBeGreaterThan(-1);
        expect(currentIndex).toBeGreaterThan(lastIndex);
        lastIndex = currentIndex;
      }
    });
  });

  describe("3. 各フィルターボタンと QuickAccessController の連動", () => {
    it("3-1. 「ブックマーク」ボタン操作により quickAccessController.toggleBookmarkSelected が実行されること", () => {
      element.handleToggleBookmark();
      expect(
        mockQuickAccessController.toggleBookmarkSelected,
      ).toHaveBeenCalledTimes(1);
    });

    it("3-2. 「未分類」ボタン操作により quickAccessController.toggleUncategorizedSelected が実行されること", () => {
      element.handleToggleUncategorized();
      expect(
        mockQuickAccessController.toggleUncategorizedSelected,
      ).toHaveBeenCalledTimes(1);
    });

    it("3-3. 「期限切れ」ボタン操作により quickAccessController.toggleOverdueSelected が実行されること", () => {
      element.handleToggleOverdue();
      expect(
        mockQuickAccessController.toggleOverdueSelected,
      ).toHaveBeenCalledTimes(1);
    });

    it("3-4. 「期限当日」ボタン操作により quickAccessController.toggleAsapSelected が実行されること", () => {
      element.handleToggleAsap();
      expect(
        mockQuickAccessController.toggleAsapSelected,
      ).toHaveBeenCalledTimes(1);
    });

    it("3-5. 「期限間近」ボタン操作により quickAccessController.toggleUpcomingSelected が実行されること", () => {
      element.handleToggleUpcoming();
      expect(
        mockQuickAccessController.toggleUpcomingSelected,
      ).toHaveBeenCalledTimes(1);
    });

    it("3-6. 「完了」ボタン操作により quickAccessController.toggleDoneSelected が実行されること", () => {
      element.handleToggleDone();
      expect(
        mockQuickAccessController.toggleDoneSelected,
      ).toHaveBeenCalledTimes(1);
    });

    it("3-7. 「対応中」ボタン操作により quickAccessController.toggleProgressSelected が実行されること", () => {
      element.handleToggleProgress();
      expect(
        mockQuickAccessController.toggleProgressSelected,
      ).toHaveBeenCalledTimes(1);
    });

    it("3-8. 「開始待ち」ボタン操作により quickAccessController.togglePendingSelected が実行されること", () => {
      element.handleTogglePending();
      expect(
        mockQuickAccessController.togglePendingSelected,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("4. 各ボタンの選択状態（ON/OFF）に応じたスタイルの反映", () => {
    it("4-1. 状態が true（ON）の項目にはアクティブ状態を示すクラスまたは属性（is-active）が付与されること", () => {
      mockQuickAccessController.state.isBookmarkSelected = true;
      mockQuickAccessController.state.isDoneSelected = true;
      const htmlStr = flattenTemplate(element.render());
      // ブックマークボタンを含む要素に is-active が付与されていることを確認
      expect(htmlStr).toMatch(
        /ブックマーク[\s\S]*?is-active|is-active[\s\S]*?ブックマーク/,
      );
    });

    it("4-2. 状態が false（OFF）の項目にはアクティブクラスが付与されないこと", () => {
      mockQuickAccessController.state.isBookmarkSelected = false;
      const htmlStr = flattenTemplate(element.render());
      // ブックマーク部分で is-active が適用されていないこと
      expect(htmlStr).not.toMatch(
        /class="[^"]*is-active[^"]*"[^>]*>[\s\S]*?ブックマーク/,
      );
    });
  });

  describe("5. コントローラー状態購読（Observer / Subscribe）とライフサイクルの連動", () => {
    it("5-1. コントローラー設定時に controller.subscribe が呼び出され、リスナーが登録されること", () => {
      expect(mockLayoutUIController.subscribe).toHaveBeenCalledTimes(1);
      expect(mockQuickAccessController.subscribe).toHaveBeenCalledTimes(1);
    });

    it("5-2. 登録されたリスナーが発火した際に requestUpdate が呼び出されること", () => {
      const requestUpdateSpy = vi.spyOn(element, "requestUpdate");

      // layoutUIController の subscribe に渡されたリスナーを実行
      const layoutUIListener = mockLayoutUIController.subscribe.mock.calls[0][0];
      layoutUIListener();
      expect(requestUpdateSpy).toHaveBeenCalled();

      // quickAccessController の subscribe に渡されたリスナーを実行
      const qaListener = mockQuickAccessController.subscribe.mock.calls[0][0];
      qaListener();
      expect(requestUpdateSpy).toHaveBeenCalled();
    });

    it("5-3. disconnectedCallback 呼び出し時に購読解除関数が実行されること", () => {
      element.disconnectedCallback();
      expect(layoutUIUnsubMock).toHaveBeenCalledTimes(1);
      expect(quickAccessUnsubMock).toHaveBeenCalledTimes(1);
    });
  });
});
