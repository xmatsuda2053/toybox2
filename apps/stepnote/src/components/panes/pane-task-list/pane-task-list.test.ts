import "fake-indexeddb/auto";
import * as fs from "node:fs";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { PaneTaskList } from "./pane-task-list";

/**
 * 【PaneTaskList 仕様 (Phase 1: Task List パネル基本レイアウトおよび構造実装)】
 *
 * 1. パネル基本レイアウトおよび3領域構造（ヘッダ部、検索部、リスト部）
 *    - [x] 1-1. パネルルート内にヘッダ部（pane-task-list__header）、検索部（pane-task-list__search）、リスト部（pane-task-list__list）がレンダリングされること
 *    - [x] 1-2. 各領域に簡易BEMクラス（pane-task-list__*）が付与されていること
 *
 * 2. ヘッダ部（Header）の表示とアクションボタンの配置
 *    - [x] 2-1. ヘッダ部タイトルに「LIST」および選択中の年度が表示されること（例: LIST 2026）
 *    - [x] 2-2. ヘッダ部に年度指定ボタン（pane-task-list__btn-year）が配置され、アイコンおよびツールチップが設定されていること
 *    - [x] 2-3. ヘッダ部にタスク追加ボタン（pane-task-list__btn-add）が配置され、プラスアイコンおよびツールチップが設定されていること
 *    - [x] 2-4. タスク追加ボタンのツールチップ（wa-tooltip）に trigger="hover" が設定され、ダイアログ閉鎖時のフォーカス復帰による不要なツールチップ表示が抑止されていること
 *
 * 3. 検索部（Search）における共通コンポーネント連携
 *    - [x] 3-1. 検索部に共通部品 search-input がレンダリングされること
 *    - [x] 3-2. search-input にサイズ属性（s）が指定されていること
 *
 * 4. リスト部（List）における仮想スクロールコンテナ
 *    - [x] 4-1. リスト部内に仮想スクロール要素（lit-virtualizer）がレンダリングされること
 *    - [x] 4-2. タスクが0件のとき、空状態を示す要素（pane-task-list__empty）がレンダリングされること
 *
 * 5. BEM設計およびSCSSスタイルの検証
 *    - [x] 5-1. SCSSスタイルシートが存在し、ルートブロック .pane-task-list および主要要素のBEMセレクタが定義されていること
 *    - [x] 5-2. 背景色および境界線に正式なデザイントークン（--wa-color-surface-default, --wa-color-surface-border）が適用されていること
 *    - [x] 5-3. 縮小アニメーション時のレイアウト崩れを防止するため、ルート要素 .pane-task-list に最小幅（min-width）が設定されていること
 *
 * 【PaneTaskList 仕様 (Phase 3: #118 年度指定・年度フィルタリング)】
 * 7. 年度選択ドロップダウンUIおよび状態連動
 *    - [x] 7-1. ヘッダ部に年度選択ドロップダウン（wa-dropdown）がレンダリングされ、年度指定ボタン（pane-task-list__btn-year）がトリガー（slot="trigger"）として配置されること
 *    - [x] 7-2. 年度ドロップダウン内に getFiscalYearRange() に基づく年度項目（wa-dropdown-item）がレンダリングされること
 *    - [x] 7-3. 現在選択中の年度に対応する wa-dropdown-item に type="checkbox" および checked が適用されること
 *    - [x] 7-4. 年度選択ボタンのツールチップに trigger="hover" が設定されていること
 *    - [x] 7-5. ドロップダウンでの年度選択イベント発生時に handleFiscalYearSelect により年度が更新され、fiscal-year-change イベントがディスパッチされること
 *    - [x] 7-6. TaskListController が注入されている場合、年度選択時に taskListController.setFiscalYear が呼び出されること
 *
 * 【PaneTaskList 仕様 (Phase 4: #120 タスク詳細表示・ソート・選択制御)】
 * 8. タスクリスト描画および TaskListItem 連携
 *    - 8-1. タスクが存在する場合、リスト部に task-list-item がレンダリングされること
 *    - 8-2. handleTaskSelect 実行時に taskListController.selectTask および taskController.setTaskId が呼び出されること
 *    - 8-3. handleBookmarkToggle 実行時に taskListController.toggleBookmark が呼び出されること
 *    - 8-4. LabelsController が注入されている場合、選択ラベルが変更されると taskListController.setLabelFilter が同期されること
 *    - 8-5. handleTaskCreated 実行時に taskListController.refresh が呼び出され、taskId が渡された場合は selectTask も呼び出されること
 */

describe("PaneTaskList Component (Phase 1: Layout & Structure)", () => {
  let element: PaneTaskList;

  beforeEach(() => {
    element = new PaneTaskList();
    element.fiscalYear = 2026;
  });

  describe("1. パネル基本レイアウトおよび3領域構造", () => {
    it("1-1. パネルルート内にヘッダ部、検索部、リスト部がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("pane-task-list__header");
      expect(htmlStr).toContain("pane-task-list__search");
      expect(htmlStr).toContain("pane-task-list__list");
    });

    it("1-2. 各領域に簡易BEMクラス（pane-task-list__*）が付与されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("pane-task-list__header");
      expect(htmlStr).toContain("pane-task-list__title");
      expect(htmlStr).toContain("pane-task-list__actions");
      expect(htmlStr).toContain("pane-task-list__search");
      expect(htmlStr).toContain("pane-task-list__list");
    });
  });

  describe("2. ヘッダ部（Header）の表示とアクションボタンの配置", () => {
    it("2-1. ヘッダ部タイトルに「LIST」および選択中の年度が表示されること", () => {
      element.fiscalYear = 2026;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("LIST");
      expect(htmlStr).toContain("2026");
    });

    it("2-2. ヘッダ部に年度指定ボタン（pane-task-list__btn-year）が配置され、アイコンおよびツールチップが設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("pane-task-list__btn-year");
      expect(htmlStr).toContain("sliders-solid-full");
      expect(htmlStr).toContain("wa-tooltip");
      expect(htmlStr).toContain("wa-button");
    });

    it("2-3. ヘッダ部にタスク追加ボタン（pane-task-list__btn-add）が配置され、プラスアイコンおよびツールチップが設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("pane-task-list__btn-add");
      expect(htmlStr).toContain("plus-solid-full");
      expect(htmlStr).toContain("wa-tooltip");
      expect(htmlStr).toContain("wa-button");
    });

    it("2-4. タスク追加ボタンのツールチップ（wa-tooltip）に trigger=\"hover\" が設定され、ダイアログ閉鎖時のフォーカス復帰による不要なツールチップ表示が抑止されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-tooltip[^>]*for="pane-task-list-btn-add"[^>]*trigger="hover"/);
    });
  });

  describe("3. 検索部（Search）における共通コンポーネント連携", () => {
    it("3-1. 検索部に共通部品 search-input がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("search-input");
      expect(htmlStr).toContain("pane-task-list__search-input");
    });

    it("3-2. search-input にサイズ属性（s）が指定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/size=["']s["']/);
    });
  });

  describe("4. リスト部（List）における仮想スクロールコンテナ", () => {
    it("4-1. リスト部内に仮想スクロール要素（lit-virtualizer）がレンダリングされること", () => {
      element.tasks = [
        {
          id: 1,
          name: "テストタスク",
          dueDate: new Date(2026, 3, 1),
          fiscalYear: 2026,
          labelId: 1,
          statusCode: 0,
          bookmark: false,
          contacts: [],
          description: "",
          selected: false,
        },
      ];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("lit-virtualizer");
    });

    it("4-2. タスクが0件のとき、空状態を示す要素（pane-task-list__empty）がレンダリングされること", () => {
      element.tasks = [];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("pane-task-list__empty");
    });
  });

  describe("5. BEM設計およびSCSSスタイルの検証", () => {
    it("5-1. SCSSスタイルシートが存在し、ルートブロック .pane-task-list および主要要素のBEMセレクタが定義されていること", () => {
      const scssPath = new URL("./pane-task-list.scss", import.meta.url);
      expect(fs.existsSync(scssPath)).toBe(true);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toContain(".pane-task-list");
      expect(scssContent).toContain("&__header");
      expect(scssContent).toContain("&__search");
      expect(scssContent).toContain("&__list");
    });

    it("5-2. 背景色および境界線に正式なデザイントークン（--wa-color-surface-default, --wa-color-surface-border）が適用されていること", () => {
      const scssPath = new URL("./pane-task-list.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toContain("var(--wa-color-surface-default)");
      expect(scssContent).toContain("var(--wa-color-surface-border)");
      expect(scssContent).not.toContain("--stepnote-bg-primary");
      expect(scssContent).not.toContain("--stepnote-border-color");
    });

    it("5-3. 縮小アニメーション時のレイアウト崩れを防止するため、ルート要素 .pane-task-list に最小幅（min-width）が設定されていること", () => {
      const scssPath = new URL("./pane-task-list.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      const rootBlockMatch = scssContent.match(/\.pane-task-list\s*\{[\s\S]*?\n\}/);
      expect(rootBlockMatch).not.toBeNull();
      expect(rootBlockMatch![0]).toMatch(/min-width:\s*(?:var\(--stepnote-pane-task-list-width[^)]*\)|310px)/);
    });
  });

  describe("6. タスク新規作成ダイアログ連携 (Phase 2: #110)", () => {
    it("6-1. テンプレート内に task-create-dialog がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-create-dialog");
    });

    it("6-2. 新規追加ボタンのクリックハンドラー実行により、isCreateDialogOpen が true になること", () => {
      expect(element.isCreateDialogOpen).toBe(false);
      element.handleOpenCreateDialog();
      expect(element.isCreateDialogOpen).toBe(true);
    });

    it("6-3. クローズハンドラー実行により、isCreateDialogOpen が false になること", () => {
      element.isCreateDialogOpen = true;
      element.handleCloseCreateDialog();
      expect(element.isCreateDialogOpen).toBe(false);
    });
  });

  describe("7. 年度指定・年度フィルタリング (Phase 3: #118)", () => {
    it("7-1. ヘッダ部に年度選択ドロップダウン（wa-dropdown）がレンダリングされ、年度指定ボタン（pane-task-list__btn-year）がトリガー（slot=\"trigger\"）として配置されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("wa-dropdown");
      expect(htmlStr).toMatch(/<wa-button[^>]*class="[^"]*pane-task-list__btn-year[^"]*"[^>]*slot="trigger"/);
    });

    it("7-2. 年度ドロップダウン内に getFiscalYearRange() に基づく年度項目（wa-dropdown-item）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("wa-dropdown-item");
      expect(htmlStr).toContain("2025年度");
      expect(htmlStr).toContain("2026年度");
    });

    it("7-3. 現在選択中の年度に対応する wa-dropdown-item に type=\"checkbox\" および checked が適用されること", () => {
      element.fiscalYear = 2026;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-dropdown-item[^>]*value="2026"[^>]*type="checkbox"[^>]*\bchecked\b/);
    });

    it("7-4. 年度選択ボタンのツールチップに trigger=\"hover\" が設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-tooltip[^>]*for="pane-task-list-btn-year"[^>]*trigger="hover"/);
    });

    it("7-5. ドロップダウンでの年度選択イベント発生時に handleFiscalYearSelect により年度が更新され、fiscal-year-change イベントがディスパッチされること", () => {
      let dispatchedYear: number | undefined;
      element.addEventListener("fiscal-year-change", ((e: CustomEvent<{ fiscalYear: number }>) => {
        dispatchedYear = e.detail?.fiscalYear;
      }) as EventListener);

      const fakeEvent = {
        detail: {
          item: {
            value: "2025",
          },
        },
      } as unknown as CustomEvent<{ item: { value: string } }>;

      element.handleFiscalYearSelect(fakeEvent);

      expect(element.fiscalYear).toBe(2025);
      expect(dispatchedYear).toBe(2025);
    });

    it("7-6. TaskListController が注入されている場合、年度選択時に taskListController.setFiscalYear が呼び出されること", async () => {
      const fakeController = {
        setFiscalYear: vi.fn(),
        subscribe: vi.fn(() => vi.fn()),
        fiscalYear: 2026,
        state: [],
      };
      element.taskListController = fakeController as any;

      const fakeEvent = {
        detail: {
          item: {
            value: "2025",
          },
        },
      } as unknown as CustomEvent<{ item: { value: string } }>;

      await element.handleFiscalYearSelect(fakeEvent);

      expect(fakeController.setFiscalYear).toHaveBeenCalledWith(2025);
    });
  });

  describe("8. タスクリスト描画および TaskListItem 連携", () => {
    it("8-1. タスクが存在する場合、リスト部に task-list-item がレンダリングされること", () => {
      element.tasks = [
        {
          id: 1,
          name: "テストタスク1",
          statusCode: 0,
          dueDate: new Date("2026-05-01"),
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
      ];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-list-item");
    });

    it("8-2. handleTaskSelect 実行時に taskListController.selectTask および taskController.setTaskId が呼び出されること", async () => {
      const fakeTaskListController = {
        selectTask: vi.fn(),
        subscribe: vi.fn(() => vi.fn()),
        state: [],
        fiscalYear: 2026,
      };
      const fakeTaskController = {
        setTaskId: vi.fn(),
        subscribe: vi.fn(() => vi.fn()),
      };

      element.taskListController = fakeTaskListController as any;
      element.taskController = fakeTaskController as any;

      const fakeCustomEvent = new CustomEvent("task-select", {
        detail: { taskId: 42 },
      });

      await element.handleTaskSelect(fakeCustomEvent);

      expect(fakeTaskListController.selectTask).toHaveBeenCalledWith(42);
      expect(fakeTaskController.setTaskId).toHaveBeenCalledWith(42);
    });

    it("8-3. handleBookmarkToggle 実行時に taskListController.toggleBookmark が呼び出されること", async () => {
      const fakeTaskListController = {
        toggleBookmark: vi.fn(),
        subscribe: vi.fn(() => vi.fn()),
        state: [],
        fiscalYear: 2026,
      };

      element.taskListController = fakeTaskListController as any;

      const fakeCustomEvent = new CustomEvent("bookmark-toggle", {
        detail: { taskId: 42, bookmark: true },
      });

      await element.handleBookmarkToggle(fakeCustomEvent);

      expect(fakeTaskListController.toggleBookmark).toHaveBeenCalledWith(42, true);
    });

    it("8-5. handleTaskCreated 実行時に taskListController.refresh が呼び出され、taskId が渡された場合は selectTask も呼び出されること", async () => {
      const fakeTaskListController = {
        refresh: vi.fn(),
        selectTask: vi.fn(),
        subscribe: vi.fn(() => vi.fn()),
        state: [],
        fiscalYear: 2026,
      };

      element.taskListController = fakeTaskListController as any;
      element.isCreateDialogOpen = true;

      const fakeCustomEvent = new CustomEvent("task-created", {
        detail: { taskId: 99 },
      });

      await element.handleTaskCreated(fakeCustomEvent);

      expect(element.isCreateDialogOpen).toBe(false);
      expect(fakeTaskListController.refresh).toHaveBeenCalled();
      expect(fakeTaskListController.selectTask).toHaveBeenCalledWith(99);
    });
  });
});
