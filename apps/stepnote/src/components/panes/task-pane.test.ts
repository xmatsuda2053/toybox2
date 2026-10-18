import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { TaskRecord, IssueRecord } from "@/db/models/task.model";
import type { TaskController } from "@/controllers/task.controller.js";
import type { IssuesController } from "@/controllers/issues.controller.js";
import { TaskPane } from "./task-pane.js";

/**
 * 【TaskPane 仕様 (タスク管理 第4ペインコンテナ)】
 *
 * 1. タスク未選択状態（Empty State）の描画
 *    - 1-1. taskController.state が未定義の場合、空状態（.task-pane__empty）が表示されること
 *    - 1-2. 空状態に「タスクが選択されていません」の案内メッセージが表示されること
 *    - 1-3. 空状態時にヘッダー（.task-pane__header）およびタブ群がレンダリングされないこと
 *
 * 2. タスク選択状態のヘッダー描画
 *    - 2-1. ヘッダー部にタスク識別子（TASK #101 等）がレンダリングされること
 *    - 2-2. コピー用ボタン（.task-pane__btn-copy）が存在せず、タスク識別子（.task-pane__title）自体がクリックコピー可能であること
 *    - 2-3. handleCopyId 実行時に「#101 タスク名」の形式でクリップボードへ書き込みが行われること
 *    - 2-4. ステータスUI（.task-pane__status）に現在のステータスに応じたアイコン・ラベルが表示され、QUICK ACCESS準拠のアイコン名・library="my-icons"・slot="start" が設定されていること
 *    - 2-5. handleSelectStatus 実行時に taskController.updateStatus(newStatusCode) が呼び出されること
 *    - 2-6. ステータス変更ボタン（.task-pane__status）に Caret 表示属性（with-caret）が設定されていること
 *    - 2-10. ステータス変更ドロップダウン内の完了（9）の後ろに wa-divider がレンダリングされること
 *    - 2-11. wa-divider の後ろに削除項目（wa-dropdown-item value="delete" variant="danger"）がレンダリングされ、trash-solid-full アイコンが表示されること
 *    - 2-12. 削除項目選択で確認ダイアログ（wa-dialog）が表示され、キャンセルでダイアログが閉じ、確定で taskController.deleteTask が呼び出されること
 *
 * 3. タブ領域（wa-tab-group）の描画
 *    - 3-1. wa-tab-group 内に Summary, Issues, Notes, Property の順で4つのタブが存在すること
 *    - 3-2. summary パネル内に task-summary コンポーネントがレンダリングされること
 *    - 3-3. issues パネル内に issues-view コンポーネントがレンダリングされ、theme が伝播されること
 *    - 3-4. notes パネル内に notes-view コンポーネントがレンダリングされ、theme が伝播されること
 *    - 3-5. property パネル内に task-property コンポーネントがレンダリングされること
 *    - 3-6. wa-tab-group に active 属性がバインドされ、現在の activeTab（初期値 'summary'）と連動していること
 *    - 3-7. handleTabShow 呼び出しにより activeTab プロパティが更新されること
 *    - 3-8. handleTabShow 呼び出し時に、子コンポーネント（issues-view, notes-view 等）の resetModesToPreview が呼び出されること
 *    - 3-9. 無効なタブ名（子孫コンポーネントのタブID等）で handleTabShow が呼び出された場合、activeTab が更新されず、子コンポーネントの resetModesToPreview も呼び出されないこと
 *    - 3-10. issuesController.state 内に期限ステータスを持つ未完了Issueが存在する場合、Issuesタブ内に期限アイコン（.task-pane__tab-due-icon）および修飾子クラスが表示されること
 *
 * 4. コントローラー購読（Context連携）
 *    - 4-1. taskController 設定時に controller.subscribe が呼び出されること
 *    - 4-2. disconnectedCallback 実行時に購読解除関数が呼び出されること
 *
 * 5. BEM設計およびSCSSスタイルの検証
 *    - 5-1. SCSSスタイルシート（task-pane.scss）が存在し、ルートブロック .task-pane および主要BEMセレクタが定義されていること
 *    - 5-2. テーマ切替トランジション等のCSS変数指定（var(--stepnote-transition-theme) または theme-transition）が定義されていること
 *    - 5-3. task-pane.scss に !important 宣言が一切含まれていないこと
 *    - 5-4. task-pane.scss に @extend が一切含まれていないこと
 *    - 5-5. task-pane.scss 全体においてハードコードされたカラーコードが 0 件（完全ゼロ）であること
 *    - 5-6. task-pane.scss において .task-pane__status に固定幅（120px）が設定され、Caret を含めた幅変動・描画崩れが抑止されていること
 *    - 5-7. task-pane.scss において wa-tab のフォントサイズが小さく調整され、.task-pane__tab-panel に Quick Access と同様の padding が設定されていること
 *    - 5-8. task-pane.scss において .task-pane__status のボタン内部（::part(button)）に、ライト/ダークモードに応じた背景色（var(--stepnote-dialog-bg)）と境界線・文字色が定義されていること
 *    - 5-9. task-pane.scss において .task-pane__tab-group に対し、ヘッダー直下は接したまま左右・下端に余白（padding: 0 var(--wa-space-xs, 8px) var(--wa-space-xs, 8px)）および box-sizing: border-box が設定されていること
 *    - 5-10. task-pane.scss において .task-pane__tab-panel がデフォルトで非表示（display: none）となり、&[active] にのみ display: flex が指定されていること
 *    - 5-11. task-pane.scss において .task-pane__tab-group の ::part(tab-group) および ::part(body) に height: 100% と flex: 1 が定義され、タブパネルのスクロールと領域伸長が保護されていること
 *    - 5-12. task-pane.scss において .task-pane__tab-panel[active] の ::part(base) に flex: 1 および min-height: 100% が定義され、スロットされた子要素への高さ伝播が保証されていること
 *    - 5-13. task-pane.scss において .task-pane__tab-panel[active] の padding-top が 0 であり、::part(base) に padding-top が指定されていることで、スクロール時のヘッダー上部余白とコンテンツ漏れが防止されていること
 *    - 5-14. テンプレートおよびSCSSから旧クラス名（pane-task*）が完全に排除されていること
 */
describe("TaskPane Component", () => {
  let element: TaskPane;
  let mockTaskController: {
    state: TaskRecord | undefined;
    hasTask: boolean;
    canCompleteTask: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    deleteTask: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let unsubscribeMock: ReturnType<typeof vi.fn>;

  const baseTask: TaskRecord = {
    id: 101,
    name: "新機能の基本設計を策定する",
    statusCode: 0,
    dueDate: new Date("2026-06-15T00:00:00.000Z"),
    contacts: [],
    description: "タスク詳細説明文",
    fiscalYear: 2026,
    labelId: 1,
    bookmark: false,
    selected: true,
  };

  beforeEach(() => {
    unsubscribeMock = vi.fn();
    mockTaskController = {
      state: { ...baseTask },
      hasTask: true,
      canCompleteTask: vi.fn().mockResolvedValue(true),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      deleteTask: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(unsubscribeMock),
    };

    element = new TaskPane();
    element.taskController = mockTaskController as unknown as TaskController;
  });

  describe("1. タスク未選択状態（Empty State）の描画", () => {
    beforeEach(() => {
      mockTaskController.state = undefined;
      mockTaskController.hasTask = false;
    });

    it("1-1. taskController.state が未定義の場合、空状態（.task-pane__empty）が表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-pane__empty");
    });

    it("1-2. 空状態に「タスクが選択されていません」の案内メッセージが表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("タスクが選択されていません");
    });

    it("1-3. 空状態時にヘッダー（.task-pane__header）およびタブ群がレンダリングされないこと", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("task-pane__header");
      expect(htmlStr).not.toContain("wa-tab-group");
    });
  });

  describe("2. タスク選択状態のヘッダー描画", () => {
    it("2-1. ヘッダー部にタスク識別子（TASK #101 等）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-pane__header");
      expect(htmlStr).toContain("TASK #101");
    });

    it("2-2. コピー用ボタン（.task-pane__btn-copy）が存在せず、タスク識別子テキスト（.task-pane__title）自体にクリックコピー属性またはイベントが設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("task-pane__btn-copy");
      expect(htmlStr).toContain("task-pane__title");
    });

    it("2-3. handleCopyId 実行時に「#101 タスク名」の形式でクリップボードへ書き込みが行われること", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      await element.handleCopyId();

      expect(writeTextMock).toHaveBeenCalledWith(
        "#101 新機能の基本設計を策定する",
      );
    });

    it("2-4. ステータスUI（.task-pane__status）に現在のステータスに応じたアイコン・ラベルが表示され、QUICK ACCESS準拠のアイコン名・library='my-icons'・slot='start' が設定されていること", () => {
      // 0: 開始待ち
      mockTaskController.state = { ...baseTask, statusCode: 0 };
      let htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-pane__status");
      expect(htmlStr).toContain("開始待ち");
      expect(htmlStr).toContain("circle-stop-solid-full");
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot="start"[^>]*library="my-icons"[^>]*name=["']?circle-stop-solid-full["']?/,
      );

      // 5: 対応中
      mockTaskController.state = { ...baseTask, statusCode: 5 };
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("対応中");
      expect(htmlStr).toContain("circle-play-solid-full");
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot="start"[^>]*library="my-icons"[^>]*name=["']?circle-play-solid-full["']?/,
      );

      // 9: 完了
      mockTaskController.state = { ...baseTask, statusCode: 9 };
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("完了");
      expect(htmlStr).toContain("circle-check-solid-full");
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot="start"[^>]*library="my-icons"[^>]*name=["']?circle-check-solid-full["']?/,
      );
    });

    it("2-5. handleSelectStatus 実行時に taskController.updateStatus(newStatusCode) が呼び出されること", () => {
      element.handleSelectStatus(5);
      expect(mockTaskController.updateStatus).toHaveBeenCalledWith(5);
    });

    it("2-6. ステータス変更ボタン（.task-pane__status）に Caret 表示属性（with-caret）が設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*task-pane__status[^"]*"[^>]*\bwith-caret\b/,
      );
    });

    it("2-7. Summaryタブ選択時のみステータス変更UI（.task-pane__status）が表示され、IssuesおよびPropertyタブ選択時は非表示になること", () => {
      element.activeTab = "summary";
      let htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-pane__status");

      element.activeTab = "issues";
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("task-pane__status");

      element.activeTab = "property";
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("task-pane__status");
    });

    it("2-8. canCompleteTask が false の場合、ステータス変更ドロップダウン内の「完了（9）」が disabled となりツールチップが表示されること", async () => {
      mockTaskController.canCompleteTask.mockResolvedValue(false);
      element.canComplete = false;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-dropdown-item[^>]*value=["']?9["']?[^>]*\bdisabled\b/);
      expect(htmlStr).toContain("未完了のIssueが存在するため完了にできません");
    });

    it("2-9. canCompleteTask が true の場合、ステータス変更ドロップダウン内の「完了（9）」が disabled にならないこと", async () => {
      mockTaskController.canCompleteTask.mockResolvedValue(true);
      element.canComplete = true;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toMatch(/<wa-dropdown-item[^>]*value=["']?9["']?[^>]*\bdisabled\b/);
    });

    it("2-10. ステータス変更ドロップダウン内の完了（9）の後ろに wa-divider がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("wa-divider");
      const doneIdx = htmlStr.search(/value=["']?9["']?/);
      const dividerIdx = htmlStr.indexOf("<wa-divider");
      expect(doneIdx).toBeGreaterThan(-1);
      expect(dividerIdx).toBeGreaterThan(doneIdx);
    });

    it("2-11. wa-divider の後ろに削除項目（wa-dropdown-item value=\"delete\" variant=\"danger\"）がレンダリングされ、trash-solid-full アイコンが表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-dropdown-item[^>]*value=["']delete["'][^>]*variant=["']danger["']/);
      expect(htmlStr).toContain("trash-solid-full");
      expect(htmlStr).toContain("削除");
    });

    it("2-12. 削除項目選択で確認ダイアログ（wa-dialog）が表示され、キャンセルでダイアログが閉じ、確定で taskController.deleteTask が呼び出されること", async () => {
      element.handleOpenDeleteDialog();
      expect(element.isDeleteDialogOpen).toBe(true);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("タスクの削除確認");
      expect(htmlStr).toContain("このタスクを削除してもよろしいですか？");

      element.handleCloseDeleteDialog();
      expect(element.isDeleteDialogOpen).toBe(false);
      expect(mockTaskController.deleteTask).not.toHaveBeenCalled();

      element.handleOpenDeleteDialog();
      await element.handleConfirmDelete();
      expect(mockTaskController.deleteTask).toHaveBeenCalledTimes(1);
      expect(element.isDeleteDialogOpen).toBe(false);
    });
  });

  describe("3. タブ領域（wa-tab-group）の描画", () => {
    it("3-1. wa-tab-group 内に Summary, Issues, Notes, Property の順で4つのタブが存在すること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("wa-tab-group");
      const summaryIdx = htmlStr.indexOf('panel="summary"');
      const issuesIdx = htmlStr.indexOf('panel="issues"');
      const notesIdx = htmlStr.indexOf('panel="notes"');
      const propertyIdx = htmlStr.indexOf('panel="property"');
      expect(summaryIdx).toBeGreaterThan(-1);
      expect(issuesIdx).toBeGreaterThan(summaryIdx);
      expect(notesIdx).toBeGreaterThan(issuesIdx);
      expect(propertyIdx).toBeGreaterThan(notesIdx);
      expect(htmlStr).toContain(">Summary</wa-tab>");
      expect(htmlStr).toContain(">Issues");
      expect(htmlStr).toContain(">Notes</wa-tab>");
      expect(htmlStr).toContain(">Property</wa-tab>");
    });

    it("3-2. summary パネル内に task-summary コンポーネントがレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain('<wa-tab-panel name="summary"');
      expect(htmlStr).toContain("task-summary");
    });

    it("3-3. issues パネル内に issues-view コンポーネントがレンダリングされ、theme が伝播されること", () => {
      element.theme = "dark";
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain('<wa-tab-panel name="issues"');
      expect(htmlStr).toContain("<issues-view");
      expect(htmlStr).toMatch(/<issues-view[^>]*\.theme=["']?dark["']?/);
    });

    it("3-4. notes パネル内に notes-view コンポーネントがレンダリングされ、theme が伝播されること", () => {
      element.theme = "dark";
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain('<wa-tab-panel name="notes"');
      expect(htmlStr).toContain("<notes-view");
      expect(htmlStr).toMatch(/<notes-view[^>]*\.theme=["']?dark["']?/);
    });

    it("3-5. property パネル内に task-property コンポーネントがレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain('<wa-tab-panel name="property"');
      expect(htmlStr).toContain("task-property");
    });

    it("3-6. wa-tab-group に active 属性がバインドされ、現在の activeTab（初期値 'summary'）と連動していること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-tab-group[^>]*\bactive=["']?summary["']?/);

      element.activeTab = "notes";
      const notesHtml = flattenTemplate(element.render());
      expect(notesHtml).toMatch(/<wa-tab-group[^>]*\bactive=["']?notes["']?/);
    });

    it("3-7. handleTabShow 呼び出しにより activeTab プロパティが更新されること", () => {
      element.handleTabShow(
        new CustomEvent("wa-tab-show", { detail: { name: "notes" } }),
      );
      expect(element.activeTab).toBe("notes");

      element.handleTabShow(
        new CustomEvent("wa-tab-show", { detail: { name: "property" } }),
      );
      expect(element.activeTab).toBe("property");
    });

    it("3-8. handleTabShow 呼び出し時に、子コンポーネント（issues-view, notes-view 等）の resetModesToPreview が呼び出されること", () => {
      const resetIssuesSpy = vi.fn();
      const resetNotesSpy = vi.fn();
      const mockIssuesView = { resetModesToPreview: resetIssuesSpy };
      const mockNotesView = { resetModesToPreview: resetNotesSpy };
      Object.defineProperty(element, "renderRoot", {
        value: {
          querySelector: vi.fn((sel: string) => {
            if (sel === "issues-view") return mockIssuesView;
            if (sel === "notes-view") return mockNotesView;
            return null;
          }),
        },
        configurable: true,
      });

      element.handleTabShow(
        new CustomEvent("wa-tab-show", { detail: { name: "issues" } }),
      );
      expect(resetIssuesSpy).toHaveBeenCalledTimes(1);

      element.handleTabShow(
        new CustomEvent("wa-tab-show", { detail: { name: "notes" } }),
      );
      expect(resetNotesSpy).toHaveBeenCalledTimes(1);
    });

    it("3-9. 無効なタブ名（子孫コンポーネントのタブID等）で handleTabShow が呼び出された場合、activeTab が更新されず、子コンポーネントの resetModesToPreview も呼び出されないこと", () => {
      const resetIssuesSpy = vi.fn();
      const resetNotesSpy = vi.fn();
      const mockIssuesView = { resetModesToPreview: resetIssuesSpy };
      const mockNotesView = { resetModesToPreview: resetNotesSpy };
      Object.defineProperty(element, "renderRoot", {
        value: {
          querySelector: vi.fn((sel: string) => {
            if (sel === "issues-view") return mockIssuesView;
            if (sel === "notes-view") return mockNotesView;
            return null;
          }),
        },
        configurable: true,
      });

      expect(element.activeTab).toBe("summary");

      element.handleTabShow(
        new CustomEvent("wa-tab-show", { detail: { name: "random-invalid-tab" } }),
      );

      expect(element.activeTab).toBe("summary");
      expect(resetIssuesSpy).not.toHaveBeenCalled();
      expect(resetNotesSpy).not.toHaveBeenCalled();
    });

    it("3-10. issuesController.state 内に期限ステータスを持つ未完了Issueが存在する場合、Issuesタブ内に期限アイコンおよび修飾子クラスが表示されること", () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const todayDate = new Date(now.getTime());
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const mockIssues: IssueRecord[] = [
        {
          id: 1,
          taskId: 101,
          statusCode: 0,
          title: "期限切れIssue",
          value: "",
          dueDate: pastDate,
        },
      ];

      const mockController = {
        state: mockIssues,
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };
      element.issuesController = mockController as unknown as IssuesController;

      // 期限切れIssueが存在する場合 -> fire-solid-full と overdue クラスが表示されること
      const overdueHtml = flattenTemplate(element.render());
      expect(overdueHtml).toContain("task-pane__tab-due-icon");
      expect(overdueHtml).toContain("task-pane__tab-due-icon--overdue");
      expect(overdueHtml).toContain("fire-solid-full");

      // 期限切れがなく当日期限Issueが存在する場合 -> triangle-exclamation-solid-full と asap クラスが表示されること
      mockController.state = [
        {
          id: 2,
          taskId: 101,
          statusCode: 5,
          title: "当日期限Issue",
          value: "",
          dueDate: todayDate,
        },
      ];
      const asapHtml = flattenTemplate(element.render());
      expect(asapHtml).toContain("task-pane__tab-due-icon--asap");
      expect(asapHtml).toContain("triangle-exclamation-solid-full");

      // 期限間近Issueが存在する場合 -> calendar-solid-full と upcoming クラスが表示されること
      mockController.state = [
        {
          id: 3,
          taskId: 101,
          statusCode: 0,
          title: "間近Issue",
          value: "",
          dueDate: tomorrow,
        },
      ];
      const upcomingHtml = flattenTemplate(element.render());
      expect(upcomingHtml).toContain("task-pane__tab-due-icon--upcoming");
      expect(upcomingHtml).toContain("calendar-solid-full");

      // 完了済みのみの場合 -> 期限アイコンが表示されないこと
      mockController.state = [
        {
          id: 4,
          taskId: 101,
          statusCode: 9,
          title: "完了済みIssue",
          value: "",
          dueDate: pastDate,
        },
      ];
      const doneHtml = flattenTemplate(element.render());
      expect(doneHtml).not.toContain("task-pane__tab-due-icon");
    });
  });

  describe("4. コントローラー購読（Context連携）", () => {
    it("4-1. taskController 設定時に controller.subscribe が呼び出されること", () => {
      const newController = {
        state: { ...baseTask },
        hasTask: true,
        updateStatus: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };
      element.taskController = newController as unknown as TaskController;
      expect(newController.subscribe).toHaveBeenCalled();
    });

    it("4-2. disconnectedCallback 実行時に購読解除関数が呼び出されること", () => {
      element.disconnectedCallback();
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe("5. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "./task-pane.scss");

    it("5-1. SCSSスタイルシート（task-pane.scss）が存在し、ルートブロック .task-pane および主要BEMセレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain(".task-pane");
      expect(content).toContain(".task-pane__header");
      expect(content).toContain(".task-pane__tab-group");
      expect(content).toContain(".task-pane__empty");
    });

    it("5-2. テーマ切替トランジション等のCSS変数指定（var(--stepnote-transition-theme) または theme-transition）が定義されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      const hasThemeTransition =
        content.includes("--stepnote-transition-theme") ||
        content.includes("theme-transition");
      expect(hasThemeTransition).toBe(true);
    });

    it("5-3. task-pane.scss に !important 宣言が一切含まれていないこと", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toContain("!important");
    });

    it("5-4. task-pane.scss に @extend が一切含まれていないこと", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toContain("@extend");
    });

    it("5-5. task-pane.scss 全体においてハードコードされたカラーコードが 0 件（完全ゼロ）であること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      const rgbMatches = content.match(/rgba?\([^)]+\)/g) ?? [];
      expect(hexMatches.length).toBe(0);
      expect(rgbMatches.length).toBe(0);
    });

    it("5-6. task-pane.scss において .task-pane__status に固定幅（120px）が設定され、Caret を含めた幅変動・描画崩れが抑止されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(
        /\.task-pane__status\s*\{[^}]*\bwidth:\s*12[0-9]px;/,
      );
    });

    it("5-7. task-pane.scss において wa-tab のフォントサイズが小さく調整され、.task-pane__tab-panel に Quick Access と同様の padding が設定されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(
        /wa-tab\s*\{[^}]*font-size:\s*var\(--wa-font-size-xs/,
      );
      expect(content).toMatch(
        /\.task-pane__tab-panel\s*\{[^}]*padding:\s*[^;]+;/,
      );
    });

    it("5-8. task-pane.scss において .task-pane__status のボタン内部（::part(button)）に、ライト/ダークモードに応じた背景色（var(--stepnote-dialog-bg)）と境界線・文字色が定義されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain("background-color: var(--stepnote-dialog-bg)");
      expect(content).toContain("var(--wa-color-surface-border)");
      expect(content).toContain("color: var(--wa-color-text-normal)");
    });

    it("5-9. task-pane.scss において .task-pane__tab-group に対し、ヘッダー直下は接したまま左右・下端に余白（padding: 0 var(--wa-space-xs, 8px) var(--wa-space-xs, 8px)）および box-sizing: border-box が設定されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(
        /\.task-pane__tab-group\s*\{[^}]*padding:\s*0\s+var\(--wa-space-xs[^)]*\)\s+var\(--wa-space-xs[^)]*\);/,
      );
      expect(content).toMatch(
        /\.task-pane__tab-group\s*\{[^}]*box-sizing:\s*border-box;/,
      );
    });

    it("5-10. task-pane.scss において .task-pane__tab-panel がデフォルトで非表示（display: none）となり、&[active] にのみ display: flex が指定されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(
        /\.task-pane__tab-panel\s*\{[^}]*display:\s*none;/,
      );
      expect(content).toMatch(
        /&\[active\]\s*\{[^}]*display:\s*flex;/,
      );
    });

    it("5-11. task-pane.scss において .task-pane__tab-group の ::part(tab-group) および ::part(body) に height: 100% と flex: 1 が定義され、タブパネルのスクロールと領域伸長が保護されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(/::part\(tab-group\)\s*\{[^}]*height:\s*100%;/);
      expect(content).toMatch(/::part\(tab-group\)\s*\{[^}]*flex:\s*1;/);
      expect(content).toMatch(/::part\(body\)\s*\{[^}]*height:\s*100%;/);
      expect(content).toMatch(/::part\(body\)\s*\{[^}]*flex:\s*1;/);
      expect(content).toMatch(/::part\(body\)\s*\{[^}]*overflow:\s*hidden;/);
    });

    it("5-12. task-pane.scss において .task-pane__tab-panel[active] の ::part(base) に flex: 1 および min-height: 100% が定義され、スロットされた子要素への高さ伝播が保証されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(/::part\(base\)\s*\{[^}]*flex:\s*1;/);
      expect(content).toMatch(/::part\(base\)\s*\{[^}]*min-height:\s*100%;/);
    });

    it("5-13. task-pane.scss において .task-pane__tab-panel[active] の padding-top が 0 であり、::part(base) に padding-top が指定されていることで、スクロール時のヘッダー上部余白とコンテンツ漏れが防止されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(/padding:\s*0\s+var\(--wa-space-m[^)]*\)\s+var\(--wa-space-l[^)]*\);/);
      expect(content).toMatch(/::part\(base\)[\s\S]*?padding-top:\s*var\(--wa-space-l[^)]*\);/);
    });

    it("5-14. テンプレートおよびSCSSから旧クラス名（pane-task*）が完全に排除されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("pane-task__");
      expect(htmlStr).not.toContain('class="pane-task"');

      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toMatch(/\.pane-task\b/);
    });
  });
});
