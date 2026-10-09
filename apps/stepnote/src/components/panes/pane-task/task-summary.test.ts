import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { TaskRecord } from "@/db/models/task.model";
import type { TaskController } from "@/controllers/task.controller.js";
import { TaskSummary } from "./task-summary.js";

/**
 * 【TaskSummary 仕様 (Summary タブコンポーネント)】
 *
 * 1. タスク情報の描画と反映
 *    - 1-1. taskController.state のタスク名が input 要素（.task-summary__name-input）に反映されること
 *    - 1-2. taskController.state の期限日が datepicker-input（.task-summary__due-date）に反映されること
 *    - 1-3. taskController.state の関係者が task-contact（.task-summary__contacts）にバインドされること
 *    - 1-4. taskController.state の詳細説明が markdown-editor-preview（.task-summary__description）に反映されること
 *    - 1-5. taskController.state が未定義の場合、空描画または適切なフォールバックとなること
 *    - 1-6. 詳細説明フィールドにラベル（.task-summary__label）が存在せず、markdown-editor-preview が autoHeight なし（表示可能領域一杯）でレンダリングされること
 *    - 1-7. 期限切れの場合、タスク名 input の slot="start" に fire-solid-full アイコン（.task-summary__name-due-icon--overdue）が描画されること
 *    - 1-8. 期限当日の場合、タスク名 input の slot="start" に triangle-exclamation-solid-full アイコン（.task-summary__name-due-icon--asap）が描画されること
 *    - 1-9. 期限間近（3日以内）の場合、タスク名 input の slot="start" に calendar-solid-full アイコン（.task-summary__name-due-icon--upcoming）が描画されること
 *    - 1-10. 期限切れ・当日・間近のいずれにも該当しない（4日以上先）場合、タスク名 input に slot="start" アイコンが描画されないこと
 *    - 1-11. 関係者フィールドのラベル（.task-summary__label--contacts）内に関係者追加アイコン（wa-icon.task-summary__btn-add-contact, name='circle-plus'）が出力されること
 *
 * 2. 詳細説明の有無に応じた Markdown モード
 *    - 2-1. 詳細説明が空文字の場合、Markdown表示モードが 'edit' に初期化されること
 *    - 2-2. 詳細説明が入力済みの場合、Markdown表示モードが 'preview' に初期化されること
 *
 * 3. ユーザー入力・変更操作と taskController.updateSummary 呼び出し
 *    - 3-1. タスク名入力時に debounce を経て taskController.updateSummary({ name }) が呼び出されること
 *    - 3-2. 期限日変更イベント時に taskController.updateSummary({ dueDate }) が呼び出されること
 *    - 3-3. 関係者変更イベント時に taskController.updateSummary({ contacts }) が呼び出されること
 *    - 3-4. Markdown変更時に debounce を経て taskController.updateSummary({ description }) が呼び出されること
 *    - 3-5. 関係者追加アイコンクリック（handleAddContact）時に空行付きで taskController.updateSummary({ contacts }) が呼び出されること
 *
 * 4. コントローラー購読（Context連携）
 *    - 4-1. taskController 設定時に controller.subscribe が呼び出されること
 *    - 4-2. disconnectedCallback 実行時に購読解除関数が呼び出されること
 *
 * 5. BEM設計およびSCSSスタイルの検証
 *    - 5-1. SCSSスタイルシート（task-summary.scss）が存在し、ルートブロック .task-summary および主要BEMセレクタが定義されていること
 *    - 5-2. テーマ切替トランジション等のCSS変数指定（var(--stepnote-transition-theme) または theme-transition）が定義されていること
 *    - 5-3. task-summary.scss に !important 宣言が一切含まれていないこと
 *    - 5-4. task-summary.scss に @extend が一切含まれていないこと
 *    - 5-5. task-summary.scss 全体においてハードコードされたカラーコードが 0 件（完全ゼロ）であること
 *    - 5-6. task-summary.scss において .task-summary__field が横並び配置され、ラベル幅が固定されていること、および詳細説明が領域一杯（flex: 1）に伸長すること
 *    - 5-7. task-summary.scss に .task-summary__name-due-icon および各修飾子（--overdue, --asap, --upcoming）が定義されていること
 *    - 5-8. task-summary.scss に .task-summary__label--contacts および .task-summary__btn-add-contact が定義され、ポインターカーソルとホバー色が設定されていること
 *    - 5-9. task-summary.scss において :host および .task-summary に min-height: 100% が定義され、コンテンツが少ない時はタスクエリア末尾まで広がり、コンテンツ増大時は縦に自然伸長すること
 *
 * 6. テーマの受容と markdown-editor-preview への伝播
 *    - 6-1. theme プロパティが設定された場合、markdown-editor-preview の themeMode に反映されること
 *
 * 7. Markdown エディタのサイズ制御モード連携（親要素フィット / コンテンツ展開）
 *    - 7-1. 初期状態では isContentExpand=false であり、.task-summary--content-expand クラスが付与されないこと（親要素フィットモード）
 *    - 7-2. markdown-editor-preview から height-mode-change イベント（autoHeight: true）を受信した際、isContentExpand が true となり .task-summary--content-expand クラスが付与されること
 *    - 7-3. markdown-editor-preview から height-mode-change イベント（autoHeight: false）を受信した際、isContentExpand が false に戻ること
 *    - 7-4. task-summary.scss において .task-summary--content-expand およびそのフィールドで height: auto が指定され、親要素側でのスクロールが有効化されること
 */
describe("TaskSummary Component", () => {
  let element: TaskSummary;
  let mockTaskController: {
    state: TaskRecord | undefined;
    hasTask: boolean;
    updateSummary: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let unsubscribeMock: ReturnType<typeof vi.fn>;

  const baseTask: TaskRecord = {
    id: 101,
    name: "新機能の基本設計を策定する",
    statusCode: 0,
    dueDate: new Date("2026-06-15T00:00:00.000Z"),
    contacts: [
      { div: "システム課", name: "山田太郎", tel: "03-1234-5678" },
    ],
    description: "## 要件一覧\n- 要件1\n- 要件2",
    fiscalYear: 2026,
    labelId: 1,
    bookmark: false,
    selected: true,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    unsubscribeMock = vi.fn();
    mockTaskController = {
      state: { ...baseTask },
      hasTask: true,
      updateSummary: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(unsubscribeMock),
    };

    element = new TaskSummary();
    element.taskController = mockTaskController as unknown as TaskController;
  });

  describe("1. タスク情報の描画と反映", () => {
    it("1-1. taskController.state のタスク名が input 要素（.task-summary__name-input）に反映されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-summary__name-input");
      expect(htmlStr).toContain("新機能の基本設計を策定する");
    });

    it("1-2. taskController.state の期限日が datepicker-input（.task-summary__due-date）に反映されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-summary__due-date");
      expect(htmlStr).toContain("2026-06-15");
    });

    it("1-3. taskController.state の関係者が task-contact（.task-summary__contacts）にバインドされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-summary__contacts");
      expect(htmlStr).toContain("task-contact");
    });

    it("1-4. taskController.state の詳細説明が markdown-editor-preview（.task-summary__description）に反映されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-summary__description");
      expect(htmlStr).toContain("markdown-editor-preview");
    });

    it("1-5. taskController.state が未定義の場合、空描画または適切なフォールバックとなること", () => {
      mockTaskController.state = undefined;
      mockTaskController.hasTask = false;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-summary--empty");
    });

    it("1-6. 詳細説明フィールドにラベル（.task-summary__label）が存在せず、markdown-editor-preview が autoHeight なし（表示可能領域一杯）でレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toMatch(/<label[^>]*>\s*詳細説明\s*<\/label>/);
      expect(htmlStr).not.toMatch(/<markdown-editor-preview[^>]*\bautoHeight\b/);
      expect(htmlStr).not.toMatch(/<markdown-editor-preview[^>]*\bauto-height\b/);
    });

    it("1-7. 期限切れの場合、タスク名 input の slot=\"start\" に fire-solid-full アイコン（.task-summary__name-due-icon--overdue）が描画されること", () => {
      vi.setSystemTime(new Date("2026-10-09T00:00:00.000Z"));
      mockTaskController.state = {
        ...baseTask,
        dueDate: new Date("2026-10-08T00:00:00.000Z"),
      };
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot="start"[^>]*library="my-icons"[^>]*name=["']?fire-solid-full["']?[^>]*class="[^"]*task-summary__name-due-icon--overdue[^"]*"/,
      );
    });

    it("1-8. 期限当日の場合、タスク名 input の slot=\"start\" に triangle-exclamation-solid-full アイコン（.task-summary__name-due-icon--asap）が描画されること", () => {
      vi.setSystemTime(new Date("2026-10-09T00:00:00.000Z"));
      mockTaskController.state = {
        ...baseTask,
        dueDate: new Date("2026-10-09T00:00:00.000Z"),
      };
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot="start"[^>]*library="my-icons"[^>]*name=["']?triangle-exclamation-solid-full["']?[^>]*class="[^"]*task-summary__name-due-icon--asap[^"]*"/,
      );
    });

    it("1-9. 期限間近（3日以内）の場合、タスク名 input の slot=\"start\" に calendar-solid-full アイコン（.task-summary__name-due-icon--upcoming）が描画されること", () => {
      vi.setSystemTime(new Date("2026-10-09T00:00:00.000Z"));
      mockTaskController.state = {
        ...baseTask,
        dueDate: new Date("2026-10-11T00:00:00.000Z"),
      };
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot="start"[^>]*library="my-icons"[^>]*name=["']?calendar-solid-full["']?[^>]*class="[^"]*task-summary__name-due-icon--upcoming[^"]*"/,
      );
    });

    it("1-10. 期限切れ・当日・間近のいずれにも該当しない（4日以上先）場合、タスク名 input に slot=\"start\" アイコンが描画されないこと", () => {
      vi.setSystemTime(new Date("2026-10-09T00:00:00.000Z"));
      mockTaskController.state = {
        ...baseTask,
        dueDate: new Date("2026-10-20T00:00:00.000Z"),
      };
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("task-summary__name-due-icon");
      expect(htmlStr).not.toContain('slot="start"');
    });

    it("1-11. 関係者フィールドのラベル（.task-summary__label--contacts）内に関係者追加アイコン（wa-icon.task-summary__btn-add-contact, name='circle-plus'）が出力されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-summary__label--contacts");
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*class="[^"]*task-summary__btn-add-contact[^"]*"[^>]*name=["']?circle-plus["']?/,
      );
    });
  });

  describe("2. 詳細説明の有無に応じた Markdown モード", () => {
    it("2-1. 詳細説明が空文字の場合、Markdown表示モードが 'edit' に初期化されること", () => {
      mockTaskController.state = {
        ...baseTask,
        description: "",
      };
      element = new TaskSummary();
      element.taskController = mockTaskController as unknown as TaskController;
      expect(element.descriptionMode).toBe("edit");
    });

    it("2-2. 詳細説明が入力済みの場合、Markdown表示モードが 'preview' に初期化されること", () => {
      mockTaskController.state = {
        ...baseTask,
        description: "入力済みの説明",
      };
      element = new TaskSummary();
      element.taskController = mockTaskController as unknown as TaskController;
      expect(element.descriptionMode).toBe("preview");
    });
  });

  describe("3. ユーザー入力・変更操作と taskController.updateSummary 呼び出し", () => {
    it("3-1. タスク名入力時に debounce を経て taskController.updateSummary({ name }) が呼び出されること", () => {
      element.handleNameInput("更新されたタスク名");
      expect(mockTaskController.updateSummary).not.toHaveBeenCalled();

      vi.advanceTimersByTime(350);
      expect(mockTaskController.updateSummary).toHaveBeenCalledWith({
        name: "更新されたタスク名",
      });
    });

    it("3-2. 期限日変更イベント時に taskController.updateSummary({ dueDate }) が呼び出されること", () => {
      const newDate = new Date("2026-07-20T00:00:00.000Z");
      element.handleDueDateChange(newDate);

      expect(mockTaskController.updateSummary).toHaveBeenCalledWith({
        dueDate: newDate,
      });
    });

    it("3-3. 関係者変更イベント時に taskController.updateSummary({ contacts }) が呼び出されること", () => {
      const newContacts = [
        { div: "総務", name: "鈴木", tel: "03-0000-0000" },
      ];
      element.handleContactsChange(newContacts);

      expect(mockTaskController.updateSummary).toHaveBeenCalledWith({
        contacts: newContacts,
      });
    });

    it("3-4. Markdown変更時に debounce を経て taskController.updateSummary({ description }) が呼び出されること", () => {
      element.handleDescriptionChange("更新された本文");
      expect(mockTaskController.updateSummary).not.toHaveBeenCalled();

      vi.advanceTimersByTime(350);
      expect(mockTaskController.updateSummary).toHaveBeenCalledWith({
        description: "更新された本文",
      });
    });

    it("3-5. 関係者追加アイコンクリック（handleAddContact）時に空行付きで taskController.updateSummary({ contacts }) が呼び出されること", () => {
      element.handleAddContact();
      expect(mockTaskController.updateSummary).toHaveBeenCalledWith({
        contacts: [
          ...baseTask.contacts,
          { div: "", name: "", tel: "" },
        ],
      });
    });
  });

  describe("4. コントローラー購読（Context連携）", () => {
    it("4-1. taskController 設定時に controller.subscribe が呼び出されること", () => {
      const newController = {
        state: { ...baseTask },
        hasTask: true,
        updateSummary: vi.fn(),
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
    const scssPath = path.resolve(__dirname, "./task-summary.scss");

    it("5-1. SCSSスタイルシート（task-summary.scss）が存在し、ルートブロック .task-summary および主要BEMセレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain(".task-summary");
      expect(content).toContain(".task-summary__name-input");
      expect(content).toContain(".task-summary__field");
    });

    it("5-2. テーマ切替トランジション等のCSS変数指定（var(--stepnote-transition-theme) または theme-transition）が定義されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      const hasThemeTransition =
        content.includes("--stepnote-transition-theme") ||
        content.includes("theme-transition");
      expect(hasThemeTransition).toBe(true);
    });

    it("5-3. task-summary.scss に !important 宣言が一切含まれていないこと", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toContain("!important");
    });

    it("5-4. task-summary.scss に @extend が一切含まれていないこと", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toContain("@extend");
    });

    it("5-5. task-summary.scss 全体においてハードコードされたカラーコードが 0 件（完全ゼロ）であること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      const rgbMatches = content.match(/rgba?\([^)]+\)/g) ?? [];
      expect(hexMatches.length).toBe(0);
      expect(rgbMatches.length).toBe(0);
    });

    it("5-6. task-summary.scss において .task-summary__field が横並び配置され、ラベル幅が固定されていること、および詳細説明が領域一杯（flex: 1）に伸長すること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(/\.task-summary__field\s*\{[^}]*flex-direction:\s*row/);
      expect(content).toMatch(/\.task-summary__label\s*\{[^}]*width:\s*\d+px/);
      expect(content).toMatch(/flex:\s*1/);
    });

    it("5-7. task-summary.scss に .task-summary__name-due-icon および各修飾子（--overdue, --asap, --upcoming）が定義されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain(".task-summary__name-due-icon");
      expect(content).toContain("--overdue");
      expect(content).toContain("--asap");
      expect(content).toContain("--upcoming");
      expect(content).toContain("var(--quick-access-icon-overdue)");
      expect(content).toContain("var(--quick-access-icon-asap)");
      expect(content).toContain("var(--quick-access-icon-upcoming)");
    });

    it("5-8. task-summary.scss に .task-summary__label--contacts および .task-summary__btn-add-contact が定義され、ポインターカーソルとホバー色が設定されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain(".task-summary__label--contacts");
      expect(content).toContain(".task-summary__btn-add-contact");
      expect(content).toMatch(/\.task-summary__btn-add-contact\s*\{[^}]*cursor:\s*pointer;/);
      expect(content).toContain("var(--label-icon-color)");
    });

    it("5-9. task-summary.scss において :host および .task-summary に min-height: 100% が定義され、コンテンツが少ない時はタスクエリア末尾まで広がり、コンテンツ増大時は縦に自然伸長すること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(/:host\s*\{[^}]*min-height:\s*100%;/);
      expect(content).toMatch(/\.task-summary\s*\{[^}]*min-height:\s*100%;/);
    });
  });

  describe("6. テーマの受容と markdown-editor-preview への伝播", () => {
    it("6-1. theme プロパティが設定された場合、markdown-editor-preview の themeMode に反映されること", () => {
      element.taskController = mockTaskController as unknown as TaskController;
      (element as unknown as { theme?: string }).theme = "dark";
      const result = element.render();
      const htmlStr = flattenTemplate(result);
      expect(htmlStr).toMatch(/\.themeMode=["']?dark["']?/);
    });
  });

  describe("7. Markdown エディタのサイズ制御モード連携（親要素フィット / コンテンツ展開）", () => {
    it("7-1. 初期状態では isContentExpand=false であり、.task-summary--content-expand クラスが付与されないこと（親要素フィットモード）", () => {
      element.taskController = mockTaskController as unknown as TaskController;
      const result = element.render();
      const htmlStr = flattenTemplate(result);
      expect(htmlStr).not.toContain("task-summary--content-expand");
    });

    it("7-2. markdown-editor-preview から height-mode-change イベント（autoHeight: true）を受信した際、isContentExpand が true となり .task-summary--content-expand クラスが付与されること", () => {
      element.taskController = mockTaskController as unknown as TaskController;
      element.handleHeightModeChange(
        new CustomEvent("height-mode-change", {
          detail: { autoHeight: true },
        }),
      );
      const result = element.render();
      const htmlStr = flattenTemplate(result);
      expect(htmlStr).toContain("task-summary--content-expand");
      expect(element.isContentExpand).toBe(true);
    });

    it("7-3. markdown-editor-preview から height-mode-change イベント（autoHeight: false）を受信した際、isContentExpand が false に戻ること", () => {
      element.taskController = mockTaskController as unknown as TaskController;
      element.isContentExpand = true;
      element.handleHeightModeChange(
        new CustomEvent("height-mode-change", {
          detail: { autoHeight: false },
        }),
      );
      const result = element.render();
      const htmlStr = flattenTemplate(result);
      expect(htmlStr).not.toContain("task-summary--content-expand");
      expect(element.isContentExpand).toBe(false);
    });

    it("7-4. task-summary.scss において .task-summary--content-expand およびそのフィールドで height: auto が指定され、親要素側でのスクロールが有効化されること", () => {
      const scssPath = path.resolve(__dirname, "task-summary.scss");
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(/\.task-summary--content-expand[\s\S]*?height:\s*auto;/);
      expect(content).toMatch(
        /\.task-summary--content-expand[\s\S]*?\.task-summary__field--description[\s\S]*?flex:\s*none;/,
      );
    });
  });
});

