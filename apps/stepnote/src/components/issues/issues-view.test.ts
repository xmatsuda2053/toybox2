import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { IssueRecord, TaskRecord } from "@/db/models/task.model";
import type { IssuesController } from "@/controllers/issues.controller.js";
import type { TaskController } from "@/controllers/task.controller.js";
import { IssuesView } from "./issues-view.js";

/**
 * 【IssuesView 仕様 (課題管理コンポーネント)】
 *
 * 1. 初期描画と空状態 (Initial Render & Empty State)
 *    - 1-1. 初期表示ビューモードは一覧（viewMode = 'list'）であること
 *    - 1-2. issuesController.state が空配列の場合、空状態メッセージ（.issues-view__empty）が表示されること
 *    - 1-3. 一覧ヘッダーにプラスアイコンのみの追加ボタン（.issues-view__btn-add）およびテキストを省略してツールチップ（wa-tooltip）を連携した完了スイッチ（wa-switch#issues-view-toggle-completed）が省スペースに表示されること
 *    - 1-4. 一覧ヘッダー上部にタスク名（.issues-view__task-name）が表示されないこと
 *
 * 2. 一覧表示と完了フィルター (List View & Filter)
 *    - 2-1. issuesController.state の各 Issue（ステータスアイコン・タイトル・期日）がリストアイテム（.issues-view__item）として描画されること
 *    - 2-2. デフォルト（showCompleted = false）の場合、完了済み Issue（statusCode: 9）は一覧から除外されること
 *    - 2-3. showCompleted = true の場合、完了済み Issue（statusCode: 9）も一覧に表示されること
 *    - 2-4. 一覧上のステータス変更操作で issuesController.updateIssue が呼び出されること
 *    - 2-5. wa-switch の変更ハンドラー（handleToggleShowCompleted）により showCompleted がトグル・同期されること
 *    - 2-6. 一覧のIssueアイテムが期限日（dueDate）の昇順でソートされて描画されること
 *
 * 3. 画面遷移（一覧 ⇔ 詳細） (View Switching)
 *    - 3-1. 一覧ヘッダーの「+ 追加」ボタンクリックで詳細ビュー（viewMode = 'detail'）に切り替わり、新規Issue編集状態になること
 *    - 3-2. 一覧のアイテムクリックで詳細ビュー（viewMode = 'detail'）に切り替わり、該当Issueの編集状態になること
 *    - 3-3. 詳細ビューの戻るボタン（.issues-view__btn-back）クリックで一覧ビュー（viewMode = 'list'）に戻ること
 *
 * 4. 詳細ビューの構成と編集・自動保存 (Detail View & Auto-save)
 *    - 4-1. 詳細ヘッダー（.issues-view__detail-header）内に戻るボタンとステータス変更UI（.issues-view__status-dropdown）が表示され、独立した削除ボタン（.issues-view__btn-delete）が存在しないこと
 *    - 4-2. フォーム内のタイトル入力に @input が設定され、期日入力、Markdownエディタが表示されること
 *    - 4-3. Markdownエディタ（markdown-editor-preview）に .mode がバインドされ、新規作成時は 'edit' を維持すること
 *    - 4-4. ステータスドロップダウン内に完了項目の後 wa-divider が配置され、その下に削除項目（value="delete", variant="danger", trash-solid-full アイコン）が配置されること
 *    - 4-5. ドロップダウンでステータス値選択時は handleStatusChange が走り、'delete' 選択時は削除確認ダイアログが開くこと
 *    - 4-9. ドロップダウン内の削除項目選択で確認ダイアログ（wa-dialog）が表示され、確認後に issuesController.deleteIssue が実行されること
 *    - 4-12. タイトル入力フィールドに @input だけでなく @change および @blur がバインドされていること
 *    - 4-13. 新規作成時、タイトル変更時（handleTitleChange）に debounce を待たず即座に createIssue が呼び出されること
 *    - 4-14. 新規作成時（editingIssueId 未設定）、ステータスを完了（9）に変更した際に即座に createIssue が呼び出され、statusCode: 9 で保存されること
 *    - 4-15. 既存編集時、ステータスを完了（9）に変更した際に即座に updateIssue が呼び出されること
 *
 * 5. BEM設計およびSCSSスタイルの検証
 *    - 5-1. SCSSスタイルシート（issues-view.scss）が存在し、ルートブロック .issues-view が定義されていること
 *    - 5-2. issues-view.scss に !important および @extend が一切含まれていないこと
 *    - 5-3. issues-view.scss 全体においてハードコードされたカラーコードが 0 件（完全ゼロ）であること
 *    - 5-4. .issues-view__item の背景色に soft なトークン（var(--wa-color-neutral-fill-quiet)）が指定されていること
 *    - 5-5. .issues-view__item-status のステータス色にドロップダウンと同一の Quick Access トークン（var(--quick-access-icon-...)）が適用されていること
 */
describe("IssuesView Component", () => {
  let element: IssuesView;
  let mockIssuesController: {
    state: IssueRecord[];
    createIssue: ReturnType<typeof vi.fn>;
    updateIssue: ReturnType<typeof vi.fn>;
    deleteIssue: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let mockTaskController: {
    state: TaskRecord | undefined;
    subscribe: ReturnType<typeof vi.fn>;
  };

  const sampleIssues: IssueRecord[] = [
    {
      id: 1,
      taskId: 10,
      statusCode: 0,
      title: "設計書のレビュー実施",
      value: "## レビュー観点\n- 整合性確認",
      dueDate: new Date("2026-04-15"),
    },
    {
      id: 2,
      taskId: 10,
      statusCode: 9,
      title: "テストデータ準備",
      value: "完了済みです",
      dueDate: new Date("2026-04-10"),
    },
    {
      id: 3,
      taskId: 10,
      statusCode: 5,
      title: "APIエンドポイント実装",
      value: "進行中",
      dueDate: new Date("2026-04-20"),
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    mockIssuesController = {
      state: [...sampleIssues],
      createIssue: vi.fn().mockResolvedValue(100),
      updateIssue: vi.fn().mockResolvedValue(undefined),
      deleteIssue: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(() => {}),
    };
    mockTaskController = {
      state: { id: 10, name: "親タスク" } as TaskRecord,
      subscribe: vi.fn().mockReturnValue(() => {}),
    };

    element = new IssuesView();
    element.issuesController =
      mockIssuesController as unknown as IssuesController;
    element.taskController = mockTaskController as unknown as TaskController;
  });

  describe("1. 初期描画と空状態 (Initial Render & Empty State)", () => {
    it("1-1. 初期表示ビューモードは一覧（viewMode = 'list'）であること", () => {
      expect(element.viewMode).toBe("list");
    });

    it("1-2. issuesController.state が空配列の場合、空状態メッセージ（.issues-view__empty）が表示されること", () => {
      mockIssuesController.state = [];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("issues-view__empty");
      expect(htmlStr).toContain("Issue がありません");
    });

    it("1-3. 一覧ヘッダーにプラスアイコンのみの追加ボタン（.issues-view__btn-add, plus-solid-full, plain）およびテキストを省略してツールチップ（wa-tooltip）を連携した完了スイッチ（wa-switch#issues-view-toggle-completed）が省スペースに表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("issues-view__btn-add");
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*issues-view__btn-add[^"]*"[^>]*appearance=["']plain["']/,
      );
      expect(htmlStr).toMatch(/<wa-icon[^>]*name=["']plus-solid-full["']/);
      expect(htmlStr).not.toMatch(
        /<wa-button[^>]*class="[^"]*issues-view__btn-add[^"]*"[^>]*>[\s\S]*追加[\s\S]*<\/wa-button>/,
      );
      expect(htmlStr).toMatch(
        /<wa-switch[^>]*id="issues-view-toggle-completed"[^>]*class="[^"]*issues-view__toggle-completed[^"]*"[^>]*aria-label="完了したIssueを含める"/,
      );
      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="issues-view-toggle-completed"[^>]*trigger="hover"[^>]*>[\s\S]*完了したIssueを含める[\s\S]*<\/wa-tooltip>/,
      );
      expect(htmlStr).not.toMatch(
        /<wa-switch[^>]*class="[^"]*issues-view__toggle-completed[^"]*"[^>]*>[\s\S]*完了したIssueを含める[\s\S]*<\/wa-switch>/,
      );
    });

    it("1-4. 一覧ヘッダー上部にタスク名（.issues-view__task-name）が表示されないこと", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("issues-view__task-name");
    });
  });

  describe("2. 一覧表示と完了フィルター (List View & Filter)", () => {
    it("2-5. wa-switch の変更ハンドラー（handleToggleShowCompleted）により showCompleted がトグル・同期されること", () => {
      element.showCompleted = false;
      element.handleToggleShowCompleted({
        target: { checked: true },
      } as unknown as Event);
      expect(element.showCompleted).toBe(true);

      element.handleToggleShowCompleted({
        target: { checked: false },
      } as unknown as Event);
      expect(element.showCompleted).toBe(false);

      element.handleToggleShowCompleted();
      expect(element.showCompleted).toBe(true);
    });

    it("2-1. issuesController.state の各 Issue（ステータスアイコン・タイトル・期日）がリストアイテム（.issues-view__item）として描画されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("issues-view__item");
      expect(htmlStr).toContain("設計書のレビュー実施");
      expect(htmlStr).toContain("APIエンドポイント実装");
    });

    it("2-2. デフォルト（showCompleted = false）の場合、完了済み Issue（statusCode: 9）は一覧から除外されること", () => {
      element.showCompleted = false;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("設計書のレビュー実施");
      expect(htmlStr).toContain("APIエンドポイント実装");
      expect(htmlStr).not.toContain("テストデータ準備");
    });

    it("2-3. showCompleted = true の場合、完了済み Issue（statusCode: 9）も一覧に表示されること", () => {
      element.showCompleted = true;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("テストデータ準備");
    });

    it("2-4. 一覧上のステータス変更操作で issuesController.updateIssue が呼び出されること", async () => {
      await element.handleStatusChange(1, 9);
      expect(mockIssuesController.updateIssue).toHaveBeenCalledWith(1, {
        statusCode: 9,
      });
    });

    it("2-6. 一覧のIssueアイテムが期限日（dueDate）の昇順でソートされて描画されること", () => {
      mockIssuesController.state = [
        {
          id: 101,
          taskId: 10,
          statusCode: 0,
          title: "期日が最も遅い課題",
          value: "",
          dueDate: new Date("2026-05-01"),
        },
        {
          id: 102,
          taskId: 10,
          statusCode: 0,
          title: "期日が最も早い課題",
          value: "",
          dueDate: new Date("2026-04-01"),
        },
        {
          id: 103,
          taskId: 10,
          statusCode: 0,
          title: "期日が中間の課題",
          value: "",
          dueDate: new Date("2026-04-15"),
        },
      ];

      const htmlStr = flattenTemplate(element.render());
      const firstIndex = htmlStr.indexOf("期日が最も早い課題");
      const secondIndex = htmlStr.indexOf("期日が中間の課題");
      const thirdIndex = htmlStr.indexOf("期日が最も遅い課題");

      expect(firstIndex).toBeGreaterThan(-1);
      expect(secondIndex).toBeGreaterThan(firstIndex);
      expect(thirdIndex).toBeGreaterThan(secondIndex);
    });
  });

  describe("3. 画面遷移（一覧 ⇔ 詳細） (View Switching)", () => {
    it("3-1. 一覧ヘッダーの「+ 追加」ボタンクリックで詳細ビュー（viewMode = 'detail'）に切り替わり、新規Issue編集状態になること", () => {
      element.handleAddNewIssue();
      expect(element.viewMode).toBe("detail");
      expect(element.editingIssueId).toBeUndefined();
    });

    it("3-2. 一覧のアイテムクリックで詳細ビュー（viewMode = 'detail'）に切り替わり、該当Issueの編集状態になること", () => {
      element.handleSelectIssue(sampleIssues[0]);
      expect(element.viewMode).toBe("detail");
      expect(element.editingIssueId).toBe(1);
    });

    it("3-3. 詳細ビューの戻るボタン（.issues-view__btn-back）クリックで一覧ビュー（viewMode = 'list'）に戻ること", () => {
      element.handleSelectIssue(sampleIssues[0]);
      expect(element.viewMode).toBe("detail");

      element.handleBackToList();
      expect(element.viewMode).toBe("list");
      expect(element.editingIssueId).toBeUndefined();
    });
  });

  describe("4. 詳細ビューの構成と編集・自動保存 (Detail View & Auto-save)", () => {
    beforeEach(() => {
      element.handleSelectIssue(sampleIssues[0]);
    });

    it("4-1. 詳細ヘッダー（.issues-view__detail-header）内に戻るボタンとステータス変更UI（.issues-view__status-dropdown）が表示され、独立した削除ボタン（.issues-view__btn-delete）が存在しないこと", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("issues-view__btn-back");
      expect(htmlStr).toContain("issues-view__status-dropdown");
      expect(htmlStr).toContain("issues-view__status");
      expect(htmlStr).not.toContain("issues-view__btn-delete");
    });

    it("4-2. フォーム内にはタイトル入力（@input 設定）、期日入力、Markdownエディタが表示され、ステータス行（.issues-view__field--status）が存在しないこと", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("issues-view__title-input");
      expect(htmlStr).toMatch(
        /<wa-input[^>]*class="[^"]*issues-view__title-input[^"]*"[^>]*@input=/,
      );
      expect(htmlStr).not.toMatch(/@wa-input=/);
      expect(htmlStr).toContain("issues-view__due-date");
      expect(htmlStr).toMatch(
        /<datepicker-input[^>]*class="[^"]*issues-view__due-date[^"]*"[^>]*\.value=["']?2026-04-15["']?/,
      );
      expect(htmlStr).toContain("datepicker-change");
      expect(htmlStr).toContain("issues-view__editor");
      expect(htmlStr).not.toContain("issues-view__field--status");
    });

    it("4-3. ステータス変更ボタン（.issues-view__status）にTASK同様のスタイル（with-caret, slot='start'）が設定され、現在のステータスが表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*issues-view__status[^"]*"[^>]*\bwith-caret\b/,
      );
      expect(htmlStr).toContain("開始待ち");
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot="start"[^>]*library="my-icons"[^>]*name=["']?circle-stop-solid-full["']?/,
      );
    });

    it("4-4. ステータスドロップダウンのアイテム群において、現在のステータスコードのみが checked（排他選択）となり、完了の下に wa-divider と削除項目が配置されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-dropdown-item[^>]*value=["']?0["']?[^>]*\bchecked\b/,
      );
      expect(htmlStr).not.toMatch(
        /<wa-dropdown-item[^>]*value=["']?5["']?[^>]*\bchecked\b/,
      );
      expect(htmlStr).not.toMatch(
        /<wa-dropdown-item[^>]*value=["']?9["']?[^>]*\bchecked\b/,
      );
      expect(htmlStr).toMatch(
        /<wa-divider[\s\S]*?<wa-dropdown-item[^>]*value=["']delete["']/,
      );
      expect(htmlStr).toMatch(
        /<wa-dropdown-item[^>]*value=["']delete["'][^>]*variant=["']danger["'][^>]*type=["']checkbox["']/,
      );
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*name=["']trash-solid-full["'][^>]*class="[^"]*issues-view__status-icon[^"]*"/,
      );
    });

    it("4-5. ドロップダウンでステータス値選択時は updateIssue が走り、'delete' 選択時は削除確認ダイアログが開くこと", async () => {
      await element.handleDetailDropdownSelect("5");
      expect(mockIssuesController.updateIssue).toHaveBeenCalledWith(1, {
        statusCode: 5,
      });

      expect(element.isDeleteDialogOpen).toBe(false);
      element.handleDetailDropdownSelect("delete");
      expect(element.isDeleteDialogOpen).toBe(true);
    });

    it("4-6. タイトル入力変更時に debounce を経て issuesController.updateIssue が呼び出されること", () => {
      element.handleTitleInput("新しいタイトル");
      vi.advanceTimersByTime(300);
      expect(mockIssuesController.updateIssue).toHaveBeenCalledWith(1, {
        title: "新しいタイトル",
      });
    });

    it("4-7. 期日変更時に issuesController.updateIssue が呼び出されること", () => {
      const newDue = new Date("2026-05-01");
      element.handleDueDateChange(newDue);
      expect(mockIssuesController.updateIssue).toHaveBeenCalledWith(1, {
        dueDate: newDue,
      });
    });

    it("4-8. Markdown変更時に debounce を経て issuesController.updateIssue が呼び出されること", () => {
      element.handleContentChange("## 変更後のMarkdown");
      vi.advanceTimersByTime(300);
      expect(mockIssuesController.updateIssue).toHaveBeenCalledWith(1, {
        value: "## 変更後のMarkdown",
      });
    });

    it("4-9. 削除ボタンクリックで確認ダイアログが開き、キャンセルで閉じ、削除確定で deleteIssue が呼び出され一覧に戻ること", async () => {
      expect(element.isDeleteDialogOpen).toBe(false);

      element.handleOpenDeleteDialog();
      expect(element.isDeleteDialogOpen).toBe(true);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("issues-view__delete-dialog");
      expect(htmlStr).toContain("Issueの削除確認");
      expect(htmlStr).toContain("取り消せません");

      element.handleCloseDeleteDialog();
      expect(element.isDeleteDialogOpen).toBe(false);
      expect(mockIssuesController.deleteIssue).not.toHaveBeenCalled();

      element.handleOpenDeleteDialog();
      await element.handleConfirmDelete();
      expect(mockIssuesController.deleteIssue).toHaveBeenCalledWith(1);
      expect(element.viewMode).toBe("list");
      expect(element.isDeleteDialogOpen).toBe(false);
    });

    it("4-10. 新規作成時（editingIssueId 未設定）、親タスクIDが同期されて createIssue が呼び出され、採番されたIDがセットされること", async () => {
      element.handleAddNewIssue();
      mockIssuesController.createIssue.mockResolvedValue(99);

      element.handleTitleInput("新規追加のIssue");
      vi.advanceTimersByTime(300);

      expect(mockIssuesController.createIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "新規追加のIssue",
          statusCode: 0,
        }),
      );
    });

    it("4-11. 新規作成時（handleAddNewIssue）の editorMode は 'edit' であり、Markdownエディタに .mode がバインドされ入力時もプレビューに切り替わらないこと", () => {
      element.handleAddNewIssue();
      expect(element.editorMode).toBe("edit");

      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<markdown-editor-preview[^>]*class="[^"]*issues-view__editor[^"]*"[^>]*\.mode=["']?edit["']?/,
      );

      element.handleContentChange("あ");
      expect(element.editorMode).toBe("edit");
    });

    it("4-12. タイトル入力フィールドに @input だけでなく @change および @blur がバインドされていること", () => {
      const htmlStr = flattenTemplate(element.render());
      const inputBlock =
        htmlStr.match(/<wa-input[\s\S]*?class="[^"]*issues-view__title-input[^"]*"[\s\S]*?<\/wa-input>/)?.[0] ?? "";
      expect(inputBlock).toContain("@input=");
      expect(inputBlock).toContain("@change=");
      expect(inputBlock).toContain("@blur=");
    });

    it("4-13. 新規作成時、タイトル変更時（handleTitleChange）に debounce を待たず即座に createIssue が呼び出されること", async () => {
      element.handleAddNewIssue();
      mockIssuesController.createIssue.mockResolvedValue(100);

      await element.handleTitleChange("確定されたタイトル");

      expect(mockIssuesController.createIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "確定されたタイトル",
        }),
      );
      expect(element.editingIssueId).toBe(100);
    });

    it("4-14. 新規作成時（editingIssueId 未設定）、ステータスを完了（9）に変更した際に即座に createIssue が呼び出され、statusCode: 9 で保存されること", async () => {
      element.handleAddNewIssue();
      mockIssuesController.createIssue.mockResolvedValue(101);

      await element.handleStatusChange(9);

      expect(mockIssuesController.createIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 9,
        }),
      );
      expect(element.editingIssueId).toBe(101);
    });

    it("4-15. 既存編集時、ステータスを完了（9）に変更した際に即座に updateIssue が呼び出されること", async () => {
      element.handleSelectIssue(sampleIssues[0]);

      await element.handleDetailDropdownSelect("9");

      expect(mockIssuesController.updateIssue).toHaveBeenCalledWith(1, {
        statusCode: 9,
      });
    });
  });

  describe("5. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "issues-view.scss");

    it("5-1. SCSSスタイルシート（issues-view.scss）が存在し、ルートブロック .issues-view が定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain(".issues-view");
    });

    it("5-2. issues-view.scss に !important および @extend が一切含まれていないこと", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toContain("!important");
      expect(content).not.toContain("@extend");
    });

    it("5-3. issues-view.scss 全体においてハードコードされたカラーコードが 0 件（完全ゼロ）であること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
      expect(hexMatches.length).toBe(0);
    });

    it("5-4. .issues-view__item の背景色に soft なトークン（var(--wa-color-neutral-fill-quiet)）が指定されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      const itemBlock = content.match(/&__item\s*\{[^}]*\}/)?.[0] ?? "";
      expect(itemBlock).toMatch(
        /background-color:\s*var\(--wa-color-neutral-fill-quiet\);/,
      );
    });

    it("5-5. .issues-view__item-status のステータス色にドロップダウンと同一の Quick Access トークン（var(--quick-access-icon-...)）が適用されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      const statusBlock =
        content.match(/&__item-status\s*\{[\s\S]*?(?=\n\s*&__)/)?.[0] ?? "";
      expect(statusBlock).toContain("var(--quick-access-icon-pending)");
      expect(statusBlock).toContain("var(--quick-access-icon-progress)");
      expect(statusBlock).toContain("var(--quick-access-icon-done)");
    });
  });
});
