import "fake-indexeddb/auto";
// @ts-ignore
import * as fs from "node:fs";
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
 *    - [x] 1-2. layoutUIController.state.isQuickAccessOpen が true（開状態）の際、アイコンに is-open クラスが付与され、ラベルが「Close」となること
 *    - [x] 1-3. layoutUIController.state.isQuickAccessOpen が false（閉状態）の際、アイコンに is-closed クラスが付与され、ラベルが「Expand」となること
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
 *    - [x] 4-3. Darkモード用のアクティブ時アイコンカラー変数（--quick-access-icon-active-*）がスタイルに定義されていること
 *    - [x] 4-4. ボタンのアクティブ状態（.is-active）において、各アイコンにアクティブ時カラー変数（--quick-access-icon-active-*）が適用されること
 * 5. コントローラー状態購読（Observer / Subscribe）とライフサイクルの連動
 *    - [x] 5-1. コントローラー設定時に controller.subscribe が呼び出され、リスナーが登録されること
 *    - [x] 5-2. 登録されたリスナーが発火した際に requestUpdate が呼び出されること
 *    - [x] 5-3. disconnectedCallback 呼び出し時に購読解除関数が実行されること
 * 6. タスク件数の描画（Props連携）
 *    - [x] 6-1. taskCounts が設定されている場合、該当する5項目（ブックマーク、未分類、期限切れ、期限当日、期限間近）に件数テキスト（slot="end" の span.quick-access-counter）が正しくレンダリングされること
 *    - [x] 6-2. 件数が 0 または undefined の場合は件数要素（span.quick-access-counter）がレンダリングされないこと
 *    - [x] 6-3. 完了、対応中、開始待ちには taskCounts の有無に関わらず件数要素ではなく目のアイコン（eye-solid-full / eye-slash-solid-full）が表示されること
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

    it("1-2. layoutUIController.state.isQuickAccessOpen が true（開状態）の際、アイコンに is-open クラスが付与され、ラベルが「Close」となること", () => {
      mockLayoutUIController.state.isQuickAccessOpen = true;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("is-open");
      expect(htmlStr).toContain("Close");
    });

    it("1-3. layoutUIController.state.isQuickAccessOpen が false（閉状態）の際、アイコンに is-closed クラスが付与され、ラベルが「Expand」となること", () => {
      mockLayoutUIController.state.isQuickAccessOpen = false;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("is-closed");
      expect(htmlStr).toContain("Expand");
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

    it("4-3. Darkモード用のアクティブ時アイコンカラー変数（--quick-access-icon-active-*）がスタイルに定義されていること", () => {
      const scssContent = fs.readFileSync(
        new URL("./navigation-quick-access.scss", import.meta.url),
        "utf-8",
      );
      const expectedVariables = [
        "--quick-access-icon-active-bookmark",
        "--quick-access-icon-active-uncategorized",
        "--quick-access-icon-active-overdue",
        "--quick-access-icon-active-asap",
        "--quick-access-icon-active-upcoming",
        "--quick-access-icon-active-done",
        "--quick-access-icon-active-progress",
        "--quick-access-icon-active-pending",
      ];
      for (const variable of expectedVariables) {
        expect(scssContent).toContain(variable);
      }
    });

    it("4-4. ボタンのアクティブ状態（.is-active）において、各アイコンにアクティブ時カラー変数（--quick-access-icon-active-*）が適用されること", () => {
      const scssContent = fs.readFileSync(
        new URL("./navigation-quick-access.scss", import.meta.url),
        "utf-8",
      );
      expect(scssContent).toMatch(
        /&?\.is-active[\s\S]*?--quick-access-icon-active-uncategorized/,
      );
      expect(scssContent).toMatch(
        /&?\.is-active[\s\S]*?--quick-access-icon-active-pending/,
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
      const layoutUIListener =
        mockLayoutUIController.subscribe.mock.calls[0][0];
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

  describe("6. タスク件数の描画（Props連携）", () => {
    it("6-1. taskCounts が設定されている場合、該当する5項目（ブックマーク、未分類、期限切れ、期限当日、期限間近）に件数テキスト（slot='end' の span.quick-access-counter）が正しくレンダリングされること", () => {
      element.taskCounts = {
        bookmark: 3,
        uncategorized: 5,
        overdue: 2,
        asap: 1,
        upcoming: 4,
      };
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain('slot="end"');
      expect(htmlStr).toContain("quick-access-counter");
      expect(htmlStr).toContain("3");
      expect(htmlStr).toContain("5");
      expect(htmlStr).toContain("2");
      expect(htmlStr).toContain("1");
      expect(htmlStr).toContain("4");
      expect(htmlStr).not.toContain("wa-badge");
    });

    it("6-2. 件数が 0 または undefined の場合は件数要素（span.quick-access-counter）がレンダリングされないこと", () => {
      element.taskCounts = {
        bookmark: 0,
        uncategorized: undefined,
      };
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("quick-access-counter");
      expect(htmlStr).not.toContain("wa-badge");
    });

    it("6-3. 完了、対応中、開始待ちには taskCounts の有無に関わらず件数要素ではなく目のアイコン（eye-solid-full / eye-slash-solid-full）が表示されること", () => {
      mockQuickAccessController.state.isDoneSelected = true;
      mockQuickAccessController.state.isProgressSelected = false;
      element.taskCounts = {
        bookmark: 3,
      };
      const htmlStr = flattenTemplate(element.render());
      // 目のアイコン（ON: eye-solid-full, OFF: eye-slash-solid-full）が含まれること
      expect(htmlStr).toContain("eye-solid-full");
      expect(htmlStr).toContain("eye-slash-solid-full");
      // 完了・対応中・開始待ちのボタンには件数要素が含まれないこと
      const doneIndex = htmlStr.indexOf("完了");
      const subStrAfterDone = htmlStr.slice(doneIndex);
      expect(subStrAfterDone).not.toContain("quick-access-counter");
      expect(subStrAfterDone).not.toContain("wa-badge");
    });
  });
});
