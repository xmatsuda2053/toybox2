/**
 * global-search-dialog.test.ts
 *
 * 全体検索モーダルダイアログ（GlobalSearchDialog）の単体テスト
 *
 * 【テスト仕様一覧】
 * 1. ダイアログの開閉と初期状態
 *    - 1-1. open プロパティの初期値は false、selectedIndex の初期値は -1 であること
 *    - 1-2. handleClose 実行時に open が false となり、global-search-close イベントが発行されること
 * 2. 検索実行と結果一覧の描画
 *    - 2-1. handleSearchInput 実行時に GlobalSearchQuery.search が呼ばれ、結果リストが描画されること
 *    - 2-2. 検索結果が 0 件の場合に「一致するタスクは見つかりませんでした」が表示されること
 *    - 2-3. 空キーワードの場合は結果リストがクリアされ初期ガイダンスが表示されること
 *    - 2-4. 検索結果取得直後は selectedIndex が -1（未選択）であること
 *    - 2-5. ダイアログ再表示時（open が true に変化した際）、検索条件が既に入力されている場合は自動的に再検索が実行されること
 *    - 2-6. ダイアログ再表示時（open が true に変化した際）、検索条件が空の場合は再検索が実行されないこと
 *    - 2-7. 検索結果アイテムのタスク名の左側にステータスに応じたアイコン（wa-icon）がレンダリングされること
 *    - 2-8. 検索結果アイテムのバッジ領域において、ラベルの有無にかかわらず「年度」が一番右端（末尾）に配置されること
 *    - 2-9. 検索結果アイテムの「ラベル」「年度」にバッジ（wa-badge, variant, クラス名、pill なし）がレンダリングされ、タイトルと視覚的に区別できること
 * 3. タスク選択と各 Controller の自動追従
 *    - 3-1. 検索結果を選択した際、対象タスクの年度に合わせて taskListController.setFiscalYear が呼ばれること
 *    - 3-2. 検索結果を選択した際、quickAccessController.resetToAllStatus が呼ばれること
 *    - 3-3. 検索結果を選択した際、対象タスクの labelId に合わせて labelsController.selectLabel が呼ばれること
 *    - 3-4. 検索結果を選択した際、taskListController.selectTask および taskController.setTaskId が呼ばれること
 *    - 3-5. タスク選択完了後に open が false となり、モーダルが閉じること
 * 4. キーボード操作（矢印上下での移動・Enterでの確定）
 *    - 4-1. 未選択（-1）の状態で ArrowDown を押すと 0（1件目）が選択されること
 *    - 4-2. 未選択（-1）の状態で ArrowUp を押すと末尾のアイテムが選択されること
 *    - 4-3. 未選択（-1）の状態で Enter を押下しても handleSelectResult は実行されないこと
 *    - 4-4. アイテム選択状態で Enter を押下すると該当アイテムが選択されること
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { GlobalSearchResultItem } from "@/db/queries/global-search.query";
import { GlobalSearchDialog } from "./global-search-dialog.js";


describe("GlobalSearchDialog Tests", () => {
  let dialog: GlobalSearchDialog;
  let mockQuery: { search: ReturnType<typeof vi.fn> };
  let mockTaskListController: {
    fiscalYear: number;
    setFiscalYear: ReturnType<typeof vi.fn>;
    selectTask: ReturnType<typeof vi.fn>;
  };
  let mockQuickAccessController: {
    resetToAllStatus: ReturnType<typeof vi.fn>;
  };
  let mockLabelsController: {
    selectLabel: ReturnType<typeof vi.fn>;
  };
  let mockTaskController: {
    setTaskId: ReturnType<typeof vi.fn>;
  };

  const sampleResults: GlobalSearchResultItem[] = [
    {
      task: {
        id: 10,
        name: "全体検索機能の実装",
        description: "全画面から呼び出せるOmnisearchモーダル",
        dueDate: new Date("2024-05-10"),
        fiscalYear: 2024,
        labelId: 1,
        statusCode: 9,
        bookmark: false,
        selected: false,
        contacts: [],
        createdAt: new Date("2024-05-01"),
        updatedAt: new Date("2024-05-10"),
      },
      labelName: "フロントエンド",

      snippets: [
        {
          sourceType: "task_name",
          sourceLabel: "タスク名",
          snippet: "全体検索機能の実装",
        },
        {
          sourceType: "note",
          sourceLabel: "ノート",
          snippet: "…モーダルのショートカットキーはCtrl+K…",
        },
      ],
    },
  ];

  beforeEach(() => {
    mockQuery = {
      search: vi.fn().mockResolvedValue(sampleResults),
    };
    mockTaskListController = {
      fiscalYear: 2026,
      setFiscalYear: vi.fn().mockResolvedValue(undefined),
      selectTask: vi.fn().mockResolvedValue(undefined),
    };
    mockQuickAccessController = {
      resetToAllStatus: vi.fn().mockResolvedValue(undefined),
    };
    mockLabelsController = {
      selectLabel: vi.fn().mockResolvedValue(undefined),
    };
    mockTaskController = {
      setTaskId: vi.fn().mockResolvedValue(undefined),
    };

    dialog = new GlobalSearchDialog();
    dialog.query = mockQuery as any;
    dialog.taskListController = mockTaskListController as any;
    dialog.quickAccessController = mockQuickAccessController as any;
    dialog.labelsController = mockLabelsController as any;
    dialog.taskController = mockTaskController as any;
  });

  describe("1. ダイアログの開閉と初期状態", () => {
    it("1-1. open プロパティの初期値は false、selectedIndex の初期値は -1 であること", () => {
      expect(dialog.open).toBe(false);
      expect(dialog.selectedIndex).toBe(-1);
    });

    it("1-2. handleClose 実行時に open が false となり、global-search-close イベントが発行されること", () => {
      dialog.open = true;
      const closeListener = vi.fn();
      dialog.addEventListener("global-search-close", closeListener);

      dialog.handleClose();

      expect(dialog.open).toBe(false);
      expect(closeListener).toHaveBeenCalledTimes(1);
    });
  });

  describe("2. 検索実行と結果一覧の描画", () => {
    it("2-1. handleSearchInput 実行時に GlobalSearchQuery.search が呼ばれ、結果リストが格納されること", async () => {
      await dialog.handleSearchInput({
        detail: { keyword: "全体検索", value: "全体検索" },
      } as any);

      expect(mockQuery.search).toHaveBeenCalledWith("全体検索");
      expect(dialog.results).toEqual(sampleResults);
    });

    it("2-2. 検索結果が 0 件の場合、results が空配列になること", async () => {
      mockQuery.search.mockResolvedValueOnce([]);
      await dialog.handleSearchInput({
        detail: { keyword: "存在しないキーワード", value: "存在しないキーワード" },
      } as any);

      expect(mockQuery.search).toHaveBeenCalledWith("存在しないキーワード");
      expect(dialog.results).toEqual([]);
    });

    it("2-3. 空キーワードの場合は query.search を呼ばず results がクリアされること", async () => {
      dialog.results = sampleResults;
      await dialog.handleSearchInput({
        detail: { keyword: "   ", value: "   " },
      } as any);

      expect(mockQuery.search).not.toHaveBeenCalled();
      expect(dialog.results).toEqual([]);
    });

    it("2-4. 検索結果取得直後は selectedIndex が -1（未選択）であること", async () => {
      await dialog.handleSearchInput({
        detail: { keyword: "全体検索", value: "全体検索" },
      } as any);

      expect(dialog.selectedIndex).toBe(-1);
    });

    it("2-5. ダイアログ再表示時（open が true に変化した際）、検索条件が既に入力されている場合は自動的に再検索が実行されること", async () => {
      dialog.searchKeyword = "全体検索";
      const searchSpy = vi.spyOn(dialog.query, "search");

      const changedProperties = new Map<PropertyKey, unknown>([["open", false]]);
      dialog.open = true;
      (dialog as any).updated(changedProperties);

      expect(searchSpy).toHaveBeenCalledWith("全体検索");
    });

    it("2-6. ダイアログ再表示時（open が true に変化した際）、検索条件が空の場合は再検索が実行されないこと", async () => {
      dialog.searchKeyword = "   ";
      const searchSpy = vi.spyOn(dialog.query, "search");

      const changedProperties = new Map<PropertyKey, unknown>([["open", false]]);
      dialog.open = true;
      (dialog as any).updated(changedProperties);

      expect(searchSpy).not.toHaveBeenCalled();
    });

    it("2-7. 検索結果アイテムのタスク名の左側にステータスに応じたアイコン（wa-icon）がレンダリングされること", () => {
      dialog.results = sampleResults;
      dialog.searchKeyword = "全体検索";
      const template = (dialog as any).renderContent();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain("global-search-dialog__status-icon");
      expect(htmlStr).toContain("global-search-dialog__status-icon--done");
      expect(htmlStr).toMatch(/name=["']?circle-check-solid-full["']?/);
    });

    it("2-8. 検索結果アイテムのバッジ領域において、ラベルの有無にかかわらず「年度」が一番右端（末尾）に配置されること", () => {
      dialog.results = sampleResults;
      dialog.searchKeyword = "全体検索";
      const template = (dialog as any).renderContent();
      const htmlStr = flattenTemplate(template);

      const labelIndex = htmlStr.indexOf("フロントエンド");
      const yearIndex = htmlStr.indexOf("2024年度");
      expect(labelIndex).toBeGreaterThan(-1);
      expect(yearIndex).toBeGreaterThan(-1);
      expect(yearIndex).toBeGreaterThan(labelIndex);
    });

    it("2-9. 検索結果アイテムの「ラベル」「年度」にバッジ（wa-badge, variant, クラス名、pill なし）がレンダリングされ、タイトルと視覚的に区別できること", () => {
      dialog.results = sampleResults;
      dialog.searchKeyword = "全体検索";
      const template = (dialog as any).renderContent();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toMatch(/<wa-badge[^>]*class="[^"]*global-search-dialog__badge--label[^"]*"[^>]*>フロントエンド<\/wa-badge>/);
      expect(htmlStr).toMatch(/<wa-badge[^>]*class="[^"]*global-search-dialog__badge--year[^"]*"[^>]*>2024年度<\/wa-badge>/);
      expect(htmlStr).toContain('variant="brand"');
      expect(htmlStr).toContain('variant="neutral"');
      expect(htmlStr).not.toContain("pill");
    });
  });

  describe("3. タスク選択と各 Controller の自動追従", () => {
    it("3-1. 検索結果を選択した際、対象タスクの年度に合わせて taskListController.setFiscalYear が呼ばれること", async () => {
      dialog.open = true;
      await dialog.handleSelectResult(sampleResults[0]);

      expect(mockTaskListController.setFiscalYear).toHaveBeenCalledWith(2024);
    });

    it("3-2. 検索結果を選択した際、quickAccessController.resetToAllStatus が呼ばれること", async () => {
      dialog.open = true;
      await dialog.handleSelectResult(sampleResults[0]);

      expect(mockQuickAccessController.resetToAllStatus).toHaveBeenCalledTimes(1);
    });

    it("3-3. 検索結果を選択した際、対象タスクの labelId に合わせて labelsController.selectLabel が呼ばれること", async () => {
      dialog.open = true;
      await dialog.handleSelectResult(sampleResults[0]);

      expect(mockLabelsController.selectLabel).toHaveBeenCalledWith(1);
    });

    it("3-4. 検索結果を選択した際、taskListController.selectTask および taskController.setTaskId が呼ばれること", async () => {
      dialog.open = true;
      await dialog.handleSelectResult(sampleResults[0]);

      expect(mockTaskListController.selectTask).toHaveBeenCalledWith(10);
      expect(mockTaskController.setTaskId).toHaveBeenCalledWith(10);
    });

    it("3-5. タスク選択完了後に open が false となり、モーダルが閉じること", async () => {
      dialog.open = true;
      const selectListener = vi.fn();
      dialog.addEventListener("global-search-select", selectListener);

      await dialog.handleSelectResult(sampleResults[0]);

      expect(dialog.open).toBe(false);
      expect(selectListener).toHaveBeenCalledTimes(1);
    });
  });

  describe("4. キーボード操作（矢印上下での移動・Enterでの確定）", () => {
    beforeEach(async () => {
      await dialog.handleSearchInput({
        detail: { keyword: "全体検索", value: "全体検索" },
      } as any);
    });

    it("4-1. 未選択（-1）の状態で ArrowDown を押すと 0（1件目）が選択されること", () => {
      const event = { key: "ArrowDown", preventDefault: vi.fn() } as unknown as KeyboardEvent;
      (dialog as any).handleKeyDown(event);

      expect(dialog.selectedIndex).toBe(0);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("4-2. 未選択（-1）の状態で ArrowUp を押すと末尾のアイテムが選択されること", () => {
      const event = { key: "ArrowUp", preventDefault: vi.fn() } as unknown as KeyboardEvent;
      (dialog as any).handleKeyDown(event);

      expect(dialog.selectedIndex).toBe(sampleResults.length - 1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("4-3. 未選択（-1）の状態で Enter を押下しても handleSelectResult は実行されないこと", () => {
      const selectSpy = vi.spyOn(dialog, "handleSelectResult");
      const event = { key: "Enter", preventDefault: vi.fn() } as unknown as KeyboardEvent;
      (dialog as any).handleKeyDown(event);

      expect(selectSpy).not.toHaveBeenCalled();
    });

    it("4-4. アイテム選択状態で Enter を押下すると該当アイテムが選択されること", async () => {
      dialog.selectedIndex = 0;
      const selectSpy = vi.spyOn(dialog, "handleSelectResult");
      const event = { key: "Enter", preventDefault: vi.fn() } as unknown as KeyboardEvent;
      (dialog as any).handleKeyDown(event);

      expect(selectSpy).toHaveBeenCalledWith(sampleResults[0]);
    });
  });
});

