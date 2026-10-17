import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { IssueRecord, TaskRecord } from "@/db/models/task.model";
import type { TaskStatusCode } from "@/types";
import type { SearchInputEventDetail } from "@shared/components";
import type { IssuesController } from "@/controllers/issues.controller.js";
import type { TaskController } from "@/controllers/task.controller.js";
import { IssuesView } from "./issues-view.js";

/**
 * 【IssuesView 仕様 (課題管理コンポーネント)】
 *
 * 1. 初期描画と空状態 (Initial Render & Empty State)
 *    - 1-1. issuesController.state が空配列の場合、空状態メッセージ（.issues-view__empty）が表示されること
 *    - 1-2. 一覧ヘッダーに共通部品 search-input（.issues-view__search-input）がレンダリングされること
 *    - 1-3. 一覧ヘッダーに単一追加ボタン（.issues-view__btn-add）および一括追加ボタン（.issues-view__btn-bulk-add）が表示されること
 *    - 1-4. 完了表示切り替えスイッチ（#issues-view-toggle-completed）が存在しないこと（廃止）
 *
 * 2. 一覧セクション表示と進捗可視化 (Sections & List View)
 *    - 2-1. 未完了Issue（statusCode !== 9）と完了Issue（statusCode === 9）が、それぞれのセクション見出し（.issues-view__section-header）および区切り線（wa-divider.issues-view__divider）で区切られて描画されること
 *    - 2-2. 未完了セクション見出しに未完了件数（未完了 (2)）、完了セクション見出しに完了件数（完了 (1)）が表示されること
 *    - 2-3. 未完了・完了のそれぞれの中で期日昇順（期限の近い順）にソートされて描画されること
 *    - 2-4. 各Issueアイテム（.issues-view__item）にステータスアイコン、タイトル、datepicker-input（.issues-view__item-due）が描画され、borderless 属性が指定されていること
 *    - 2-5. 検索キーワード入力（search-input）により、タイトルまたは本文でIssueが絞り込まれてセクション表示されること
 *    - 2-6. 各Issueアイテム（.issues-view__item）の右端に開閉状態を示す Caret アイコン（.issues-view__item-caret、name="caret-right-solid-full"）が描画されていること
 *    - 2-7. 各Issueアイテムの期日入力欄（datepicker-input）に対応するツールチップ（wa-tooltip）が配置され、「期限日」と表示されること
 *    - 2-8. 未完了Issueの期限日に応じて、期限切れ・当日・間近の各状態に対応するアイコンおよび修飾クラス（--overdue, --asap, --upcoming）が適用されること
 *    - 2-9. 完了済みIssue（statusCode === 9）については、期限日が過去であっても期限警告のアイコンおよび修飾クラスが適用されないこと
 *
 * 3. 行内操作（ステータス変更・期日変更） (In-place Status & Due Date Changes)
 *    - 3-1. アイテム内のステータスドロップダウンでステータスを選択した際、行展開はトリガーされず issuesController.updateIssue が呼び出されること
 *    - 3-2. アイテム内の datepicker-input で日付変更（datepicker-change）した際、行展開はトリガーされず issuesController.updateIssue が呼び出されること
 *    - 3-3. ステータスボタン（.issues-view__status-btn）に対応するツールチップ（wa-tooltip）に trigger="hover" が設定され、「ステータスを変更」と表示されること
 *
 * 4. インライン詳細アコーディオン展開と編集・自動保存・削除 (Inline Detail & Auto-save)
 *    - 4-1. Issue行（.issues-view__item）クリックで該当Issueがインライン詳細（.issues-view__detail-container）として展開され、Markdownエディタ（markdown-editor-preview）が表示されること
 *    - 4-2. 展開中のIssue行を再度クリックすると折りたたまれること（トグル展開）
 *    - 4-3. 別のIssue行をクリックすると、前の展開行が閉じ、新しくクリックした行が開くこと（排他展開）
 *    - 4-4. インライン詳細にはタイトル入力欄や期日入力欄が含まれず、Markdownエディタのみであること
 *    - 4-5. Markdownエディタの内容変更（markdown-change）により、300msデバウンスを経て issuesController.updateIssue が title（1行目から抽出）と value で呼び出されること
 *    - 4-6. Markdownエディタの削除要求（markdown-delete）で削除確認ダイアログ（wa-dialog）が開き、確認後に issuesController.deleteIssue が実行され、詳細が閉じること
 *    - 4-7. 各Issue行（.issues-view__item）とインライン詳細（.issues-view__detail-container）が一体化ラッパー（.issues-view__row-group）に内包され、不要な余白なく連結描画されること
 *    - 4-8. Issue展開時の Markdown エディタに .mode がバインドされ、手動展開時はデフォルトで 'preview' モード、handleModeChange によりモードが更新されること
 *    - 4-9. 新規追加ボタン（handleCreateIssue）で作成された Issue はエディタモード（.mode='edit'）で自動展開されること
 *    - 4-10. Issue 削除確定時（handleConfirmDelete）に該当 Issue のモード管理状態がクリーンアップされること
 *    - 4-11. Issue詳細を手動で開閉トグルした際（一度 edit に切り替えて閉じた後に再度開いた場合を含む）、プレビューモード（preview）で初期化されて表示されること
 *    - 4-12. 親タスクが切り替わった場合（willUpdate で taskId 変更時）、すべての Issue のエディタモードがプレビューモードへリセット（issueModeMap が初期化）され、展開状態もクリアされること
 *    - 4-13. resetModesToPreview() の呼び出しにより、すべての Issue のエディタモードがプレビューモードへリセットされること
 *
 * 5. 新規Issue作成（単一作成 & 一括作成） (Creation Actions)
 *    - 5-1. 単一追加ボタン（.issues-view__btn-add）クリック時、画面遷移せず即座に createIssue が呼び出され、新しく作成されたIssue行が自動展開されること
 *    - 5-2. 一括追加ボタン（.issues-view__btn-bulk-add）クリック時、一括作成ダイアログ（wa-dialog.issues-view__bulk-dialog）が開くこと
 *    - 5-3. 一括作成ダイアログ内の wa-textarea に入力し、作成ボタンをクリックすると issuesController.createMultipleIssues が呼ばれ、ダイアログが閉じること
 *    - 5-4. キャンセルボタンクリックでダイアログが閉じること
 *
 * 6. BEM設計およびSCSSスタイルの検証
 *    - 6-1. SCSSスタイルシート（issues-view.scss）が存在し、ルートブロック .issues-view が定義されていること
 *    - 6-2. !important および @extend が一切含まれていないこと
 *    - 6-3. ハードコードされたカラーコードが 0 件（完全ゼロ）であること
 *    - 6-4. アコーディオン展開アニメーション（@keyframes issues-view-detail-expand / collapse）が定義されていること
 *    - 6-5. issues-view.scss において .issues-view__item-due に対し、背景色を親行と同色にする --wa-form-control-background-color: transparent が設定されていること
 *    - 6-6. issues-view.scss において .issues-view__row-group が定義され、display: flex; flex-direction: column; が設定されていること
 *    - 6-7. issues-view.scss において .issues-view__item--expanded に対し、背景色の変更設定（background-color）が含まれず、角丸解除（border-bottom-left-radius / right-radius: 0）のみが設定されていること
 *    - 6-8. issues-view.scss において .issues-view__item-caret が定義され、トランジションと控えめな文字色（--wa-color-text-quiet）が設定されていること
 *    - 6-9. issues-view.scss において .issues-view__item--expanded .issues-view__item-caret に対し、下向き回転（transform: rotate(90deg)）と通常文字色（--wa-color-text-normal）が設定されていること
 *    - 6-10. issues-view.scss において .issues-view__item-due の状態別修飾クラス（--overdue, --asap, --upcoming）が定義され、デザイントークンのカラーが指定されていること
 */
describe("IssuesView Component", () => {
  let element: IssuesView;
  let mockIssuesController: {
    taskId?: number;
    setTaskId?: ReturnType<typeof vi.fn>;
    state: IssueRecord[];
    createIssue: ReturnType<typeof vi.fn>;
    createMultipleIssues: ReturnType<typeof vi.fn>;
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
      value: "### 設計書のレビュー実施\n\n- 整合性確認",
      dueDate: new Date("2026-04-15"),
    },
    {
      id: 2,
      taskId: 10,
      statusCode: 9,
      title: "テストデータ準備",
      value: "### テストデータ準備\n\n完了済みです",
      dueDate: new Date("2026-04-10"),
    },
    {
      id: 3,
      taskId: 10,
      statusCode: 5,
      title: "APIエンドポイント実装",
      value: "### APIエンドポイント実装\n\n進行中",
      dueDate: new Date("2026-04-20"),
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    mockIssuesController = {
      taskId: 10,
      setTaskId: vi.fn(),
      state: [...sampleIssues],
      createIssue: vi.fn().mockResolvedValue(100),
      createMultipleIssues: vi.fn().mockResolvedValue([101, 102]),
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
    it("1-1. issuesController.state が空配列の場合、空状態メッセージ（.issues-view__empty）が表示されること", () => {
      mockIssuesController.state = [];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("issues-view__empty");
      expect(htmlStr).toContain("Issue がありません");
    });

    it("1-2. 一覧ヘッダーに共通部品 search-input（.issues-view__search-input）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("search-input");
      expect(htmlStr).toContain("issues-view__search-input");
      expect(htmlStr).toMatch(/placeholder=["']Issue を検索\.\.\.["']/);
      expect(htmlStr).toMatch(/size=["']s["']/);
    });

    it("1-3. 一覧ヘッダーに単一追加ボタン（.issues-view__btn-add）および一括追加ボタン（.issues-view__btn-bulk-add）が表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("issues-view__btn-add");
      expect(htmlStr).toContain("issues-view__btn-bulk-add");
      expect(htmlStr).toMatch(/<wa-icon[^>]*name=["']plus-solid-full["']/);
      expect(htmlStr).toMatch(/<wa-icon[^>]*name=["']list-check-solid-full["']/);
    });

    it("1-4. 完了表示切り替えスイッチ（#issues-view-toggle-completed）が存在しないこと（廃止）", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("issues-view-toggle-completed");
    });
  });

  describe("2. 一覧セクション表示と進捗可視化 (Sections & List View)", () => {
    it("2-1. 未完了Issue（statusCode !== 9）と完了Issue（statusCode === 9）が、それぞれのセクション見出し（.issues-view__section-header）および区切り線（wa-divider.issues-view__divider）で区切られて描画されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("issues-view__section-header");
      expect(htmlStr).toContain("issues-view__divider");
      expect(htmlStr).toContain("未完了");
      expect(htmlStr).toContain("完了");
    });

    it("2-2. 未完了セクション見出しに未完了件数（未完了 (2)）、完了セクション見出しに完了件数（完了 (1)）が表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("未完了 (2)");
      expect(htmlStr).toContain("完了 (1)");
    });

    it("2-3. 未完了・完了のそれぞれの中で期日昇順（期限の近い順）にソートされて描画されること", () => {
      const htmlStr = flattenTemplate(element.render());
      // 未完了: 4/15 (設計書のレビュー実施) -> 4/20 (APIエンドポイント実装)
      const reviewIdx = htmlStr.indexOf("設計書のレビュー実施");
      const apiIdx = htmlStr.indexOf("APIエンドポイント実装");
      expect(reviewIdx).toBeGreaterThan(-1);
      expect(apiIdx).toBeGreaterThan(-1);
      expect(reviewIdx).toBeLessThan(apiIdx);

      // 完了: 4/10 (テストデータ準備)
      const testDataIdx = htmlStr.indexOf("テストデータ準備");
      expect(testDataIdx).toBeGreaterThan(-1);
    });

    it("2-4. 各Issueアイテム（.issues-view__item）にステータスアイコン、タイトル、datepicker-input（.issues-view__item-due）が描画され、borderless 属性が指定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("issues-view__item");
      expect(htmlStr).toContain("issues-view__status-btn");
      expect(htmlStr).toContain("issues-view__item-status");
      expect(htmlStr).toContain("issues-view__item-title");
      expect(htmlStr).toContain("datepicker-input");
      expect(htmlStr).toContain("issues-view__item-due");
      expect(htmlStr).toContain("borderless");
    });

    it("2-5. 検索キーワード入力（search-input）により、タイトルまたは本文でIssueが絞り込まれてセクション表示されること", () => {
      element.handleSearchInput(
        new CustomEvent<SearchInputEventDetail>("search-input", {
          detail: { value: "API", keyword: "API" },
        }),
      );
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("APIエンドポイント実装");
      expect(htmlStr).not.toContain("設計書のレビュー実施");
      expect(htmlStr).toContain("未完了 (1)");
    });

    it("2-6. 各Issueアイテム（.issues-view__item）の右端に開閉状態を示す Caret アイコン（.issues-view__item-caret、name=\"caret-right-solid-full\"）が描画されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*class=["'][^"']*issues-view__item-caret[^"']*["'][^>]*name=["']caret-right-solid-full["']/,
      );
    });

    it("2-7. 各Issueアイテムの期日入力欄（datepicker-input）に対応するツールチップ（wa-tooltip）が配置され、「期限日」と表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for=["']issues-view-due-1["'][^>]*>\s*期限日\s*<\/wa-tooltip>/,
      );
      expect(htmlStr).toMatch(
        /<datepicker-input[^>]*id=["']issues-view-due-1["']/,
      );
    });

    it("2-8. 未完了Issueの期限日に応じて、期限切れ・当日・間近の各状態に対応するアイコンおよび修飾クラス（--overdue, --asap, --upcoming）が適用されること", () => {
      vi.setSystemTime(new Date("2026-04-15T00:00:00Z"));
      const testIssues: IssueRecord[] = [
        {
          id: 10,
          taskId: 1,
          statusCode: 0,
          title: "期限切れIssue",
          value: "期限切れ",
          dueDate: new Date("2026-04-10"),
        },
        {
          id: 11,
          taskId: 1,
          statusCode: 0,
          title: "期限当日Issue",
          value: "期限当日",
          dueDate: new Date("2026-04-15"),
        },
        {
          id: 12,
          taskId: 1,
          statusCode: 0,
          title: "期限間近Issue",
          value: "期限間近",
          dueDate: new Date("2026-04-17"),
        },
        {
          id: 13,
          taskId: 1,
          statusCode: 0,
          title: "余裕ありIssue",
          value: "4日以上先",
          dueDate: new Date("2026-04-25"),
        },
      ];
      element.issuesController = {
        state: testIssues,
        subscribe: vi.fn().mockReturnValue(() => {}),
      } as unknown as IssuesController;

      const htmlStr = flattenTemplate(element.render());

      // 期限切れ: fire-solid-full / issues-view__item-due--overdue
      expect(htmlStr).toMatch(
        /<datepicker-input[^>]*id=["']issues-view-due-10["'][^>]*class=["'][^"']*issues-view__item-due--overdue[^"']*["'][^>]*icon=["']fire-solid-full["']/,
      );

      // 期限当日: triangle-exclamation-solid-full / issues-view__item-due--asap
      expect(htmlStr).toMatch(
        /<datepicker-input[^>]*id=["']issues-view-due-11["'][^>]*class=["'][^"']*issues-view__item-due--asap[^"']*["'][^>]*icon=["']triangle-exclamation-solid-full["']/,
      );

      // 期限間近: calendar-solid-full / issues-view__item-due--upcoming
      expect(htmlStr).toMatch(
        /<datepicker-input[^>]*id=["']issues-view-due-12["'][^>]*class=["'][^"']*issues-view__item-due--upcoming[^"']*["'][^>]*icon=["']calendar-solid-full["']/,
      );

      // 余裕あり: 通常カレンダーアイコン、修飾クラスなし
      expect(htmlStr).toMatch(
        /<datepicker-input[^>]*id=["']issues-view-due-13["'][^>]*icon=["']calendar-solid-full["']/,
      );
      expect(htmlStr).not.toMatch(
        /<datepicker-input[^>]*id=["']issues-view-due-13["'][^>]*class=["'][^"']*(?:--overdue|--asap|--upcoming)/,
      );
    });

    it("2-9. 完了済みIssue（statusCode === 9）については、期限日が過去であっても期限警告のアイコンおよび修飾クラスが適用されないこと", () => {
      vi.setSystemTime(new Date("2026-04-15T00:00:00Z"));
      const testIssues: IssueRecord[] = [
        {
          id: 20,
          taskId: 1,
          statusCode: 9,
          title: "完了済み期限切れIssue",
          value: "完了済み",
          dueDate: new Date("2026-04-10"),
        },
      ];
      element.issuesController = {
        state: testIssues,
        subscribe: vi.fn().mockReturnValue(() => {}),
      } as unknown as IssuesController;

      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<datepicker-input[^>]*id=["']issues-view-due-20["'][^>]*icon=["']calendar-solid-full["']/,
      );
      expect(htmlStr).not.toMatch(
        /<datepicker-input[^>]*id=["']issues-view-due-20["'][^>]*class=["'][^"']*(?:--overdue|--asap|--upcoming)/,
      );
    });
  });

  describe("3. 行内操作（ステータス変更・期日変更） (In-place Status & Due Date Changes)", () => {
    it("3-1. アイテム内のステータスドロップダウンでステータスを選択した際、行展開はトリガーされず issuesController.updateIssue が呼び出されること", async () => {
      const stopPropagationMock = vi.fn();
      await element.handleStatusChange(1, 5, {
        stopPropagation: stopPropagationMock,
      } as unknown as Event);

      expect(stopPropagationMock).toHaveBeenCalled();
      expect(mockIssuesController.updateIssue).toHaveBeenCalledWith(1, {
        statusCode: 5,
      });
    });

    it("3-2. アイテム内の datepicker-input で日付変更（datepicker-change）した際、行展開はトリガーされず issuesController.updateIssue が呼び出されること", async () => {
      const stopPropagationMock = vi.fn();
      const newDate = new Date("2026-06-15");
      await element.handleDueDateChange(1, newDate, {
        stopPropagation: stopPropagationMock,
      } as unknown as Event);

      expect(stopPropagationMock).toHaveBeenCalled();
      expect(mockIssuesController.updateIssue).toHaveBeenCalledWith(1, {
        dueDate: newDate,
      });
    });

    it("3-3. ステータスボタン（.issues-view__status-btn）に対応するツールチップ（wa-tooltip）に trigger=\"hover\" が設定され、「ステータスを変更」と表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for=["']issues-view-status-btn-1["'][^>]*trigger=["']hover["']/,
      );
      expect(htmlStr).toContain("ステータスを変更");
    });
  });

  describe("4. インライン詳細アコーディオン展開と編集・自動保存・削除 (Inline Detail & Auto-save)", () => {
    it("4-1. Issue行（.issues-view__item）クリックで該当Issueがインライン詳細（.issues-view__detail-container）として展開され、Markdownエディタ（markdown-editor-preview）が表示されること", () => {
      element.handleToggleExpand(1);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("issues-view__detail-container");
      expect(htmlStr).toContain("markdown-editor-preview");
      expect(htmlStr).toContain("issues-view__detail-editor");
      expect(htmlStr).toContain("show-delete-button");
    });

    it("4-2. 展開中のIssue行を再度クリックすると折りたたまれること（トグル展開）", () => {
      element.handleToggleExpand(1);
      expect(element.expandedIssueIds.has(1)).toBe(true);

      element.handleToggleExpand(1);
      expect(element.expandedIssueIds.has(1)).toBe(false);
      expect(element.collapsingIssueId).toBe(1);
    });

    it("4-3. 別のIssue行をクリックすると、前の展開行が閉じ、新しくクリックした行が開くこと（排他展開）", () => {
      element.handleToggleExpand(1);
      expect(element.expandedIssueIds.has(1)).toBe(true);

      element.handleToggleExpand(3);
      expect(element.expandedIssueIds.has(1)).toBe(false);
      expect(element.expandedIssueIds.has(3)).toBe(true);
      expect(element.collapsingIssueId).toBe(1);
    });

    it("4-4. インライン詳細にはタイトル入力欄や期日入力欄が含まれず、Markdownエディタのみであること", () => {
      element.handleToggleExpand(1);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("markdown-editor-preview");
      expect(htmlStr).not.toContain("issues-view__title-input");
    });

    it("4-5. Markdownエディタの内容変更（markdown-change）により、300msデバウンスを経て issuesController.updateIssue が title（1行目から抽出）と value で呼び出されること", async () => {
      const newValue = "### 更新後のタイトル\n\n更新されたMarkdown本文";
      element.handleContentChange(1, newValue);

      // デバウンス中
      expect(mockIssuesController.updateIssue).not.toHaveBeenCalled();

      // 300ms 経過
      vi.advanceTimersByTime(300);

      expect(mockIssuesController.updateIssue).toHaveBeenCalledWith(1, {
        title: "更新後のタイトル",
        value: newValue,
      });
    });

    it("4-6. Markdownエディタの削除要求（markdown-delete）で削除確認ダイアログ（wa-dialog）が開き、確認後に issuesController.deleteIssue が実行され、詳細が閉じること", async () => {
      element.handleToggleExpand(1);
      element.handleRequestDelete(1);
      expect(element.isDeleteDialogOpen).toBe(true);
      expect(element.deletingIssueId).toBe(1);

      await element.handleConfirmDelete();
      expect(mockIssuesController.deleteIssue).toHaveBeenCalledWith(1);
      expect(element.isDeleteDialogOpen).toBe(false);
      expect(element.expandedIssueIds.has(1)).toBe(false);
    });

    it("4-7. 各Issue行（.issues-view__item）とインライン詳細（.issues-view__detail-container）が一体化ラッパー（.issues-view__row-group）に内包され、不要な余白なく連結描画されること", () => {
      element.handleToggleExpand(1);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("issues-view__row-group");
    });

    it("4-8. Issue 展開時の Markdown エディタに .mode がバインドされ、手動展開時はデフォルトで 'preview'、handleModeChange によりモードが更新されること", () => {
      element.handleToggleExpand(1);
      let template = element.render();
      let htmlStr = flattenTemplate(template);
      expect(htmlStr).toMatch(/<markdown-editor-preview[^>]*\.mode=["']?preview["']?/);

      element.handleModeChange(1, "edit");
      template = element.render();
      htmlStr = flattenTemplate(template);
      expect(htmlStr).toMatch(/<markdown-editor-preview[^>]*\.mode=["']?edit["']?/);
    });

    it("4-9. 新規追加ボタン（handleCreateIssue）で作成された Issue はエディタモード（.mode='edit'）で自動展開されること", async () => {
      mockIssuesController.createIssue.mockImplementation(
        async (issue: {
          title: string;
          value: string;
          statusCode: TaskStatusCode;
          dueDate: Date;
        }) => {
          const id = 100;
          mockIssuesController.state.push({
            id,
            taskId: 10,
            title: issue.title,
            value: issue.value,
            statusCode: issue.statusCode,
            dueDate: issue.dueDate,
          });
          return id;
        },
      );

      await element.handleCreateIssue();
      expect(element.expandedIssueIds.has(100)).toBe(true);
      expect(element.issueModeMap.get(100)).toBe("edit");

      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toMatch(/<markdown-editor-preview[^>]*\.mode=["']?edit["']?/);
    });

    it("4-10. Issue 削除確定時（handleConfirmDelete）に該当 Issue のモード管理状態がクリーンアップされること", async () => {
      element.issueModeMap.set(1, "edit");
      element.handleRequestDelete(1);
      await element.handleConfirmDelete();
      expect(element.issueModeMap.has(1)).toBe(false);
    });

    it("4-11. Issue詳細を手動で開閉トグルした際（一度 edit に切り替えて閉じた後に再度開いた場合を含む）、プレビューモード（preview）で初期化されて表示されること", () => {
      element.handleToggleExpand(1);
      element.handleModeChange(1, "edit");
      expect(element.issueModeMap.get(1)).toBe("edit");

      // 一度閉じる
      element.handleToggleExpand(1);
      // 再度手動で展開する
      element.handleToggleExpand(1);
      expect(element.issueModeMap.get(1)).toBe("preview");

      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<markdown-editor-preview[^>]*\.mode=["']?preview["']?/);
    });

    it("4-12. 親タスクが切り替わった場合（willUpdate で taskId 変更時）、すべての Issue のエディタモードがプレビューモードへリセットされ、展開状態もクリアされること", () => {
      element.handleToggleExpand(1);
      element.handleModeChange(1, "edit");
      expect(element.expandedIssueIds.has(1)).toBe(true);
      expect(element.issueModeMap.get(1)).toBe("edit");

      // 親タスクの切り替えをシミュレート
      mockTaskController.state = {
        ...mockTaskController.state!,
        id: 999,
      };
      element.willUpdate(new Map([["taskController", undefined]]));

      expect(element.expandedIssueIds.size).toBe(0);
      expect(element.issueModeMap.size).toBe(0);
    });

    it("4-13. resetModesToPreview() の呼び出しにより、すべての Issue のエディタモードがプレビューモードへリセットされること", () => {
      element.issueModeMap.set(1, "edit");
      element.issueModeMap.set(2, "edit");

      element.resetModesToPreview();

      expect(element.issueModeMap.get(1)).toBe("preview");
      expect(element.issueModeMap.get(2)).toBe("preview");
    });
  });

  describe("5. 新規Issue作成（単一作成 & 一括作成） (Creation Actions)", () => {
    it("5-1. 単一追加ボタン（.issues-view__btn-add）クリック時、画面遷移せず即座に createIssue が呼び出され、新しく作成されたIssue行が自動展開されること", async () => {
      await element.handleCreateIssue();

      expect(mockIssuesController.createIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "新規Issue",
          value: "### 新規Issue\n\n",
          statusCode: 0,
        }),
      );
      expect(element.expandedIssueIds.has(100)).toBe(true);
    });

    it("5-2. 一括追加ボタン（.issues-view__btn-bulk-add）クリック時、一括作成ダイアログ（wa-dialog.issues-view__bulk-dialog）が開くこと", () => {
      element.handleOpenBulkAddDialog();
      expect(element.isBulkAddDialogOpen).toBe(true);

      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("issues-view__bulk-dialog");
      expect(htmlStr).toContain("wa-textarea");
    });

    it("5-3. 一括作成ダイアログ内の wa-textarea に入力し、作成ボタンをクリックすると issuesController.createMultipleIssues が呼ばれ、ダイアログが閉じること", async () => {
      element.handleOpenBulkAddDialog();
      element.bulkAddText = "一括1\n一括2\n  \n一括3";

      await element.handleConfirmBulkAdd();

      expect(mockIssuesController.createMultipleIssues).toHaveBeenCalledWith(
        ["一括1", "一括2", "一括3"],
        expect.any(Date),
      );
      expect(element.isBulkAddDialogOpen).toBe(false);
      expect(element.bulkAddText).toBe("");
    });

    it("5-4. キャンセルボタンクリックでダイアログが閉じること", () => {
      element.handleOpenBulkAddDialog();
      element.bulkAddText = "キャンセル対象テキスト";

      element.handleCloseBulkAddDialog();
      expect(element.isBulkAddDialogOpen).toBe(false);
      expect(element.bulkAddText).toBe("");
    });
  });

  describe("6. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "./issues-view.scss");
    let scssContent: string;

    beforeEach(() => {
      scssContent = fs.readFileSync(scssPath, "utf-8");
    });

    it("6-1. SCSSスタイルシート（issues-view.scss）が存在し、ルートブロック .issues-view が定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      expect(scssContent).toContain(".issues-view");
    });

    it("6-2. issues-view.scss に !important および @extend が一切含まれていないこと", () => {
      expect(scssContent).not.toMatch(/!important/);
      expect(scssContent).not.toMatch(/@extend\b/);
    });

    it("6-3. issues-view.scss 全体においてハードコードされたカラーコードが 0 件（完全ゼロ）であること", () => {
      const colorMatches = scssContent.match(/#(?:[0-9a-fA-F]{3,8})\b/g) ?? [];
      const rgbMatches = scssContent.match(/\brgba?\s*\(/gi) ?? [];
      const hslMatches = scssContent.match(/\bhsla?\s*\(/gi) ?? [];
      expect(colorMatches).toEqual([]);
      expect(rgbMatches).toEqual([]);
      expect(hslMatches).toEqual([]);
    });

    it("6-4. アコーディオン展開アニメーション（@keyframes issues-view-detail-expand / collapse）が定義されていること", () => {
      expect(scssContent).toContain("issues-view-detail-expand");
      expect(scssContent).toContain("issues-view-detail-collapse");
    });

    it("6-5. issues-view.scss において .issues-view__item-due に対し、背景色を親行と同色にする --wa-form-control-background-color: transparent が設定されていること", () => {
      expect(scssContent).toMatch(
        /&__item-due\s*\{[^}]*--wa-form-control-background-color:\s*transparent;/,
      );
    });

    it("6-6. issues-view.scss において .issues-view__row-group が定義され、display: flex; flex-direction: column; が設定されていること", () => {
      expect(scssContent).toMatch(
        /&__row-group\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/,
      );
    });

    it("6-7. issues-view.scss において .issues-view__item--expanded に対し、背景色の変更設定（background-color）が含まれず、角丸解除（border-bottom-left-radius / right-radius: 0）のみが設定されていること", () => {
      const expandedMatch = scssContent.match(/&--expanded\s*\{([^}]+)\}/);
      expect(expandedMatch).not.toBeNull();
      const expandedBody = expandedMatch![1];
      expect(expandedBody).not.toMatch(/background-color/);
      expect(expandedBody).toMatch(/border-bottom-left-radius:\s*0;/);
      expect(expandedBody).toMatch(/border-bottom-right-radius:\s*0;/);
    });

    it("6-8. issues-view.scss において .issues-view__item-caret が定義され、トランジションと控えめな文字色（--wa-color-text-quiet）が設定されていること", () => {
      expect(scssContent).toMatch(
        /&__item-caret\s*\{[^}]*color:\s*var\(--wa-color-text-quiet\);[^}]*transition:/s,
      );
    });

    it("6-9. issues-view.scss において .issues-view__item--expanded .issues-view__item-caret に対し、下向き回転（transform: rotate(90deg)）と通常文字色（--wa-color-text-normal）が設定されていること", () => {
      expect(scssContent).toMatch(
        /&--expanded\s*\{[^}]*\.issues-view__item-caret\s*\{[^}]*transform:\s*rotate\(90deg\);[^}]*color:\s*var\(--wa-color-text-normal\);/s,
      );
    });

    it("6-10. issues-view.scss において .issues-view__item-due の状態別修飾クラス（--overdue, --asap, --upcoming）が定義され、デザイントークンのカラーが指定されていること", () => {
      expect(scssContent).toMatch(/&--overdue\s*\{[^}]*var\(--quick-access-icon-overdue\)/);
      expect(scssContent).toMatch(/&--asap\s*\{[^}]*var\(--quick-access-icon-asap\)/);
      expect(scssContent).toMatch(/&--upcoming\s*\{[^}]*var\(--quick-access-icon-upcoming\)/);
    });
  });
});
