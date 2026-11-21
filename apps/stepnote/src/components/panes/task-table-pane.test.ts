import * as fs from "node:fs";
import * as path from "node:path";
import * as sass from "sass-embedded";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { TaskTableController } from "@/controllers/task-table.controller.js";
import type { TaskTableRowViewModel } from "@/types";
import { TaskTablePane } from "./task-table-pane.js";

/**
 * 【TaskTablePane 仕様 (タスク一覧テーブル表示ペイン)】
 *
 * 1. 上部ツールバー（新規作成ボタン・フィルタバー）
 *    - 1-1. 「+ 新規タスク」操作導線（task-create-button または作成ボタン）がレンダリングされること
 *    - 1-2. 年度・キーワード・状態複数選択ドロップダウン（アイコン付き、「すべて」なし）・期限フィルタ（状態右隣・アイコン付き）・ラベル・タグ・リセットボタンがレンダリングされること
 *    - 1-3. 各フィルタ変更ハンドラーが taskTableController の対応メソッドを呼び出すこと
 *    - 1-4. 状態フィルタの選択件数に応じてトリガー表示（未選択/単一アイコン付き/複数連結/全選択時は「状態: すべて」）が切り替わること
 *
 * 2. 選択件数フィードバックバー
 *    - 2-1. selectedCount === 0 のとき選択件数バーが表示されないこと
 *    - 2-2. selectedCount > 0 のとき「{N}件選択中」および選択解除ボタンが表示されること
 *
 * 3. テーブルヘッダーとソート・全選択チェックボックス
 *    - 3-1. 指定順（チェックボックス, ID, 状態, ラベル, タスク名, 期限日, 関係者, タグ, Issue状態）の列ヘッダーが描画されること
 *    - 3-2. 全選択チェックボックスおよびソート可能列のクリックハンドラーが taskTableController の対応メソッドを呼び出すこと
 *
 * 4. テーブル行セル描画・インタラクション・空状態
 *    - 4-1. 行に ID, 状態, ラベル, ブックマークボタン, タスク名ボタン, 期限日, 関係者サマリー＋全件詳細ツールチップ, compact付きタグバー, Issue進捗（2/5等）＋期限アイコンが描画されること
 *    - 4-2. ブックマークボタンクリックで toggleBookmark(taskId) が呼び出されること
 *    - 4-3. タスク名クリック（handleOpenTask）で task-table-open-task イベントが発火し、clearSelection() が呼び出されること
 *    - 4-4. 行データが空の場合は空状態メッセージ「該当するタスクがありません」が表示されること
 *
 * 5. SCSS 品質規約検証
 *    - 5-1. task-table-pane.scss に !important、@extend、ハードコードカラー直値が含まれず、theme-transition が適用されていること
 *    - 5-2. ラベル列幅が 160px であり、トリガーボタン内ラベルの左寄せ・省略表示（text-ellipsis）・はみ出し防止ルールが定義されていること
 *    - 5-3. 状態列幅が「開始待ち」を省略せず表示できる 140px であること
 *    - 5-4. 期限日列幅が「yyyy-MM-dd (EEE)」を途切れず表示できる 180px であること
 *    - 5-5. 期限フィルタ幅が「期限: すべて」の折り返しを防ぐ 160px であり、調整分としてキーワード検索の最小幅が 156px へ調整されていること
 *    - 5-6. タグ列幅が 300px へ拡張され、タスク名列（width: auto）の最小幅が 180px へ調整されていること
 *    - 5-7. 関係者セルにツールチップ（[title]）がある場合に cursor: help が定義されていること
 */

const createMockRow = (
  overrides: Partial<TaskTableRowViewModel> = {},
): TaskTableRowViewModel => ({
  task: {
    id: 101,
    statusCode: 5,
    name: "一覧表示モードの設計",
    dueDate: new Date("2026-06-15T00:00:00.000Z"),
    contacts: [
      { div: "開発", name: "山田 太郎", tel: "" },
      { div: "企画", name: "佐藤 花子", tel: "" },
    ],
    description: "",
    fiscalYear: 2026,
    labelId: 1,
    bookmark: true,
    selected: false,
    tagIds: [10, 20, 30, 40],
  },
  labelName: "開発",
  tags: [
    { id: 10, name: "重要", description: "", variant: "danger" },
    { id: 20, name: "UI", description: "", variant: "brand" },
    { id: 30, name: "調査", description: "", variant: "cyan" },
    { id: 40, name: "定例", description: "", variant: "neutral" },
  ],
  issuesDone: 2,
  issuesTotal: 5,
  issuesDueInfo: { icon: "fire-solid-full", status: "overdue" },
  taskDueInfo: null,
  ...overrides,
});

describe("TaskTablePane Component", () => {
  let pane: TaskTablePane;
  let mockController: {
    rows: TaskTableRowViewModel[];
    labels: Array<{
      id: number;
      name: string;
      description: string;
      isSelected: boolean;
    }>;
    tags: Array<{
      id: number;
      name: string;
      description: string;
      variant: string;
    }>;
    availableFiscalYears: number[];
    filter: {
      fiscalYear: number | "all";
      keyword: string;
      statusCodes: Array<0 | 5 | 9>;
      labelId: number | "all" | "uncategorized";
      tagId: number | "all";
      dueFilter: "all" | "overdue" | "asap" | "upcoming";
    };
    sort: {
      key: "id" | "status" | "label" | "name" | "dueDate" | "issues";
      direction: "asc" | "desc";
    };
    selectedIds: Set<number>;
    selectedCount: number;
    isAllFilteredSelected: boolean;
    isSomeFilteredSelected: boolean;
    refresh: ReturnType<typeof vi.fn>;
    setFiscalYearFilter: ReturnType<typeof vi.fn>;
    setKeywordFilter: ReturnType<typeof vi.fn>;
    toggleStatusFilter: ReturnType<typeof vi.fn>;
    setStatusFilters: ReturnType<typeof vi.fn>;
    setLabelFilter: ReturnType<typeof vi.fn>;
    setTagFilter: ReturnType<typeof vi.fn>;
    setDueFilter: ReturnType<typeof vi.fn>;
    resetFilters: ReturnType<typeof vi.fn>;
    toggleSort: ReturnType<typeof vi.fn>;
    toggleRowSelection: ReturnType<typeof vi.fn>;
    toggleSelectAllFiltered: ReturnType<typeof vi.fn>;
    clearSelection: ReturnType<typeof vi.fn>;
    toggleBookmark: ReturnType<typeof vi.fn>;
    updateTaskStatus: ReturnType<typeof vi.fn>;
    updateTaskLabel: ReturnType<typeof vi.fn>;
    updateTaskDueDate: ReturnType<typeof vi.fn>;
    updateTaskTags: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockController = {
      rows: [createMockRow()],
      labels: [{ id: 1, name: "開発", description: "", isSelected: false }],
      tags: [{ id: 10, name: "重要", description: "", variant: "danger" }],
      availableFiscalYears: [2026, 2025],
      filter: {
        fiscalYear: "all",
        keyword: "",
        statusCodes: [0, 5],
        labelId: "all",
        tagId: "all",
        dueFilter: "all",
      },
      sort: { key: "dueDate", direction: "asc" },
      selectedIds: new Set<number>(),
      selectedCount: 0,
      isAllFilteredSelected: false,
      isSomeFilteredSelected: false,
      refresh: vi.fn().mockResolvedValue(undefined),
      setFiscalYearFilter: vi.fn().mockResolvedValue(undefined),
      setKeywordFilter: vi.fn().mockResolvedValue(undefined),
      toggleStatusFilter: vi.fn(),
      setStatusFilters: vi.fn(),
      setLabelFilter: vi.fn(),
      setTagFilter: vi.fn(),
      setDueFilter: vi.fn(),
      resetFilters: vi.fn().mockResolvedValue(undefined),
      toggleSort: vi.fn(),
      toggleRowSelection: vi.fn(),
      toggleSelectAllFiltered: vi.fn(),
      clearSelection: vi.fn(),
      toggleBookmark: vi.fn().mockResolvedValue(undefined),
      updateTaskStatus: vi.fn().mockResolvedValue(undefined),
      updateTaskLabel: vi.fn().mockResolvedValue(undefined),
      updateTaskDueDate: vi.fn().mockResolvedValue(undefined),
      updateTaskTags: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };

    pane = new TaskTablePane();
    pane.taskTableController = mockController as unknown as TaskTableController;
  });

  describe("1. 上部ツールバー（新規作成ボタン・フィルタバー）", () => {
    it("1-1. 新規タスク作成ボタンがレンダリングされること", () => {
      const htmlStr = flattenTemplate(pane.render());
      expect(htmlStr).toContain("task-table-pane__create-btn");
      expect(htmlStr).toContain("新規タスク");
    });

    it("1-2. 年度・キーワード・状態複数選択（アイコン付き・すべて削除）・期限（状態の右・アイコン付き）・ラベル・タグ・リセットボタンが描画されること", () => {
      const htmlStr = flattenTemplate(pane.render());
      expect(htmlStr).toContain("task-table-pane__filter-keyword");
      expect(htmlStr).toContain("task-table-pane__filter-year");
      expect(htmlStr).toContain("task-table-pane__filter-status");
      expect(htmlStr).toContain("task-table-pane__filter-due");
      expect(htmlStr).toContain("task-table-pane__filter-label");
      expect(htmlStr).toContain("task-table-pane__filter-tag");
      expect(htmlStr).toContain("task-table-pane__filter-reset");

      expect(htmlStr).not.toContain("状態: すべて");
      expect(htmlStr).toContain("<wa-dropdown");
      expect(htmlStr).toContain("circle-stop-solid-full");
      expect(htmlStr).toContain("circle-play-solid-full");
      expect(htmlStr).toContain("circle-check-solid-full");
      expect(htmlStr).toContain("triangle-exclamation-solid-full");
      expect(htmlStr).toContain("calendar-solid-full");
      expect(htmlStr).toMatch(
        /<wa-option value="all">[\s\S]*?calendar-solid-full[\s\S]*?task-table-pane__due-icon--default[\s\S]*?期限: すべて/,
      );

      const statusIdx = htmlStr.indexOf("task-table-pane__filter-status");
      const dueIdx = htmlStr.indexOf("task-table-pane__filter-due");
      const labelIdx = htmlStr.indexOf("task-table-pane__filter-label");
      expect(dueIdx).toBeGreaterThan(statusIdx);
      expect(labelIdx).toBeGreaterThan(dueIdx);
    });

    it("1-3. 各フィルタ変更ハンドラーが taskTableController の対応メソッドを呼び出すこと", async () => {
      await pane.handleFiscalYearChange("2026");
      expect(mockController.setFiscalYearFilter).toHaveBeenCalledWith(2026);
      await pane.handleFiscalYearChange("all");
      expect(mockController.setFiscalYearFilter).toHaveBeenCalledWith("all");

      await pane.handleKeywordChange("テスト");
      expect(mockController.setKeywordFilter).toHaveBeenCalledWith("テスト");

      (
        pane as unknown as { handleStatusToggle: (code: 0 | 5 | 9) => void }
      ).handleStatusToggle(5);
      expect(mockController.toggleStatusFilter).toHaveBeenCalledWith(5);

      pane.handleLabelChange("uncategorized");
      expect(mockController.setLabelFilter).toHaveBeenCalledWith(
        "uncategorized",
      );

      pane.handleTagChange("10");
      expect(mockController.setTagFilter).toHaveBeenCalledWith(10);

      pane.handleDueChange("overdue");
      expect(mockController.setDueFilter).toHaveBeenCalledWith("overdue");

      await pane.handleResetFilters();
      expect(mockController.resetFilters).toHaveBeenCalledTimes(1);
    });

    it("1-4. 状態フィルタの選択状態に応じてトリガー表示（未選択/単一/複数連結/全選択）が切り替わること", () => {
      mockController.filter.statusCodes = [];
      expect(flattenTemplate(pane.render())).toContain("状態: 未選択");

      mockController.filter.statusCodes = [9];
      const singleHtml = flattenTemplate(pane.render());
      expect(singleHtml).toContain("完了");

      mockController.filter.statusCodes = [0, 5];
      const multiHtml = flattenTemplate(pane.render());
      expect(multiHtml).toContain("開始待ち・対応中");

      mockController.filter.statusCodes = [0, 5, 9];
      const allHtml = flattenTemplate(pane.render());
      expect(allHtml).toContain("状態: すべて");
    });
  });

  describe("2. 選択件数フィードバックバー", () => {
    it("2-1. selectedCount === 0 のとき選択件数バーが表示されないこと", () => {
      mockController.selectedCount = 0;
      const htmlStr = flattenTemplate(pane.render());
      expect(htmlStr).not.toContain("task-table-pane__selection-bar");
    });

    it("2-2. selectedCount > 0 のとき「N件選択中」および選択解除ボタンが表示されること", () => {
      mockController.selectedCount = 3;
      const htmlStr = flattenTemplate(pane.render());
      expect(htmlStr).toContain("task-table-pane__selection-bar");
      expect(htmlStr).toContain("3件選択中");
      expect(htmlStr).toContain("選択を解除");
    });
  });

  describe("3. テーブルヘッダーとソート・全選択チェックボックス", () => {
    it("3-1. 指定順の列ヘッダーが描画されること", () => {
      const htmlStr = flattenTemplate(pane.render());
      const columns = [
        "task-table-pane__th--select",
        "ID",
        "状態",
        "ラベル",
        "タスク名",
        "期限日",
        "関係者",
        "タグ",
        "Issue状態",
      ];
      let prevIdx = -1;
      for (const col of columns) {
        const idx = htmlStr.indexOf(col, prevIdx + 1);
        expect(idx).toBeGreaterThan(prevIdx);
        prevIdx = idx;
      }
    });

    it("3-2. 全選択およびソートクリックハンドラーが controller メソッドを呼び出すこと", () => {
      pane.handleToggleSelectAll();
      expect(mockController.toggleSelectAllFiltered).toHaveBeenCalledTimes(1);

      pane.handleSortClick("id");
      expect(mockController.toggleSort).toHaveBeenCalledWith("id");
    });
  });

  describe("4. テーブル行セル描画・インタラクション・空状態", () => {
    it("4-1. 行に必要な情報（ID, 状態, ラベル, ブックマーク, タスク名, 期限日, 関係者, タグバー, Issue進捗2/5）が描画されること", () => {
      const htmlStr = flattenTemplate(pane.render());
      expect(htmlStr).toContain("#101");
      expect(htmlStr).toContain("対応中");
      expect(htmlStr).toContain("開発");
      expect(htmlStr).toContain("一覧表示モードの設計");
      expect(htmlStr).toContain("2026-06-15");
      expect(htmlStr).toContain("山田 太郎 +1");
      expect(htmlStr).toContain("開発 / 山田 太郎");
      expect(htmlStr).toContain("企画 / 佐藤 花子");
      expect(htmlStr).toContain("<task-tag-bar");
      expect(htmlStr).toContain("compact");
      expect(htmlStr).toContain("2/5");
      expect(htmlStr).toContain("fire-solid-full");
    });

    it("4-2. ブックマーククリックで toggleBookmark(taskId) が呼び出されること", async () => {
      const stopPropagation = vi.fn();
      await pane.handleBookmarkClick(
        { stopPropagation } as unknown as MouseEvent,
        101,
      );
      expect(stopPropagation).toHaveBeenCalledTimes(1);
      expect(mockController.toggleBookmark).toHaveBeenCalledWith(101);
    });

    it("4-3. タスク名クリック（handleOpenTask）で task-table-open-task イベントが発火し、clearSelection が呼び出されること", () => {
      let receivedId: number | undefined;
      pane.addEventListener("task-table-open-task", (e: Event) => {
        receivedId = (e as CustomEvent<{ taskId: number }>).detail.taskId;
      });

      pane.handleOpenTask(101);
      expect(receivedId).toBe(101);
      expect(mockController.clearSelection).toHaveBeenCalledTimes(1);
    });

    it("4-4. 行データが空の場合は空状態メッセージが表示されること", () => {
      mockController.rows = [];
      const htmlStr = flattenTemplate(pane.render());
      expect(htmlStr).toContain("task-table-pane__empty");
      expect(htmlStr).toContain("該当するタスクがありません");
    });
  });

  describe("5. SCSS 品質規約検証", () => {
    const scssPath = path.resolve(
      path.dirname(
        new URL(import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, "$1"),
      ),
      "task-table-pane.scss",
    );

    it("5-1. !important・@extend・カラー直値が0件であり、theme-transition が適用されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toMatch(/!important/);
      expect(content).not.toMatch(/@extend\b/);
      expect(content).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(content).not.toMatch(/\brgba?\s*\(/i);
      expect(content).toContain("theme-transition");

      const compiled = sass.compile(scssPath).css;
      expect(compiled.length).toBeGreaterThan(0);
    });

    it("5-2. ラベル列幅が 160px であり、トリガーボタン内ラベルの左寄せ・省略表示（text-ellipsis）・はみ出し防止ルールが定義されていること", () => {
      const compiled = sass.compile(scssPath).css;
      expect(compiled).toMatch(
        /\.task-table-pane__th--label\s*\{[^}]*width:\s*160px/,
      );
      expect(compiled).toMatch(
        /\.task-table-pane__cell-trigger\s*\{[^}]*min-width:\s*0/,
      );
      expect(compiled).toMatch(
        /\.task-table-pane__cell-trigger::part\(button\)\s*\{[^}]*overflow:\s*hidden/,
      );
      expect(compiled).toMatch(
        /\.task-table-pane__cell-trigger::part\(label\)\s*\{[^}]*text-align:\s*start/,
      );
      expect(compiled).toMatch(
        /\.task-table-pane__cell-trigger::part\(label\)\s*\{[^}]*text-overflow:\s*ellipsis/,
      );
      expect(compiled).toMatch(
        /\.task-table-pane__cell-trigger::part\(caret\)\s*\{[^}]*flex-shrink:\s*0/,
      );
    });

    it("5-3. 状態列幅が「開始待ち」を省略せず表示できる 140px であること", () => {
      const compiled = sass.compile(scssPath).css;
      expect(compiled).toMatch(
        /\.task-table-pane__th--status\s*\{[^}]*width:\s*140px/,
      );
    });

    it("5-4. 期限日列幅が「yyyy-MM-dd (EEE)」を途切れず表示できる 180px であること", () => {
      const compiled = sass.compile(scssPath).css;
      expect(compiled).toMatch(
        /\.task-table-pane__th--due\s*\{[^}]*width:\s*180px/,
      );
    });

    it("5-5. 期限フィルタ幅が 160px であり、調整分としてキーワード検索幅が縮小されていること", () => {
      const compiled = sass.compile(scssPath).css;
      expect(compiled).toMatch(
        /\.task-table-pane__filter-due\s*\{[^}]*width:\s*160px/,
      );
      expect(compiled).toMatch(
        /\.task-table-pane__filter-keyword\s*\{[^}]*min-width:\s*156px/,
      );
    });

    it("5-6. タグ列幅が 300px へ拡張され、タスク名列の最小幅が 180px へ調整されていること", () => {
      const compiled = sass.compile(scssPath).css;
      expect(compiled).toMatch(
        /\.task-table-pane__th--tags\s*\{[^}]*width:\s*300px/,
      );
      expect(compiled).toMatch(
        /\.task-table-pane__th--name\s*\{[^}]*min-width:\s*180px/,
      );
    });

    it("5-7. 関係者セルにツールチップ（[title]）がある場合に cursor: help が定義されていること", () => {
      const compiled = sass.compile(scssPath).css;
      expect(compiled).toMatch(
        /\.task-table-pane__td--contacts\[title\]\s*\{[^}]*cursor:\s*help/,
      );
    });
  });

  describe("6. インライン更新 UI・ハンドラー仕様", () => {
    it("6-1. 状態ドロップダウンが描画され、未完了 Issue がある行のみ「完了 (9)」が disabled となること", () => {
      const incompleteHtml = flattenTemplate(pane.render());
      expect(incompleteHtml).toContain("task-table-pane__status-dropdown");
      expect(incompleteHtml).toMatch(
        /<wa-dropdown-item[^>]*value="?9"?[^>]*disabled/,
      );

      mockController.rows = [createMockRow({ issuesDone: 5, issuesTotal: 5 })];
      const completeHtml = flattenTemplate(pane.render());
      expect(completeHtml).not.toMatch(
        /<wa-dropdown-item[^>]*value="?9"?[^>]*disabled/,
      );
    });

    it("6-2. ラベルドロップダウンおよび datepicker-input・task-tag-bar がセルに描画されること", () => {
      const htmlStr = flattenTemplate(pane.render());
      expect(htmlStr).toContain("task-table-pane__label-dropdown");
      expect(htmlStr).toContain("<datepicker-input");
      expect(htmlStr).toContain("<task-tag-bar");
      expect(htmlStr).toContain(".targetTaskId=101");
    });

    it("6-3. 各セル更新ハンドラーが taskTableController の対応更新メソッドを呼び出すこと", async () => {
      const p = pane as unknown as {
        handleRowStatusUpdate: (id: number, code: 0 | 5 | 9) => Promise<void>;
        handleRowLabelUpdate: (id: number, labelId: number) => Promise<void>;
        handleRowDueDateUpdate: (
          id: number,
          date: Date | null,
        ) => Promise<void>;
        handleRowTagsUpdate: (id: number, tagIds: number[]) => Promise<void>;
      };
      const nextDate = new Date("2026-07-01T00:00:00.000Z");

      await p.handleRowStatusUpdate(101, 5);
      expect(mockController.updateTaskStatus).toHaveBeenCalledWith(101, 5);

      await p.handleRowLabelUpdate(101, 1);
      expect(mockController.updateTaskLabel).toHaveBeenCalledWith(101, 1);

      await p.handleRowDueDateUpdate(101, nextDate);
      expect(mockController.updateTaskDueDate).toHaveBeenCalledWith(
        101,
        nextDate,
      );

      await p.handleRowTagsUpdate(101, [10, 20]);
      expect(mockController.updateTaskTags).toHaveBeenCalledWith(101, [10, 20]);
    });
  });
});
