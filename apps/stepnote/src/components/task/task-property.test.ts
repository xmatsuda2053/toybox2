import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate, format, getFiscalYearRange } from "@shared/utils";
import type { TaskRecord, IssueRecord } from "@/db/models/task.model.js";
import type { LabelRecord } from "@/db/models/navigation.model.js";
import type { NoteRecord, LogRecord } from "@/db/models/journal.model.js";
import type { TaskController } from "@/controllers/task.controller.js";
import type { LabelsController } from "@/controllers/labels.controller.js";
import type { IssuesController } from "@/controllers/issues.controller.js";
import type { NotesController } from "@/controllers/notes.controller.js";
import type { LogsController } from "@/controllers/logs.controller.js";
import { TaskProperty } from "./task-property.js";

/**
 * 【TaskProperty 仕様 (Property タブコンポーネント)】
 *
 * 1. タスク未選択状態（Empty State）の描画
 *    - 1-1. taskController.state が未定義の場合、空描画（.task-property--empty）となること
 *
 * 2. 作成日時・更新日時フィールドの描画
 *    - 2-1. 作成日時フィールド（wa-input）が存在し、readonly 属性が設定されていること
 *    - 2-2. 作成日時フィールドの slot="start" に calendar-plus-solid-full アイコン（library="my-icons"）が出力されること
 *    - 2-3. 作成日時の値が「yyyy/MM/dd HH:mm:ss」形式でフォーマットされて表示されること
 *    - 2-4. 更新日時フィールド（wa-input）が存在し、readonly 属性が設定されていること
 *    - 2-5. 更新日時フィールドの slot="start" に calendar-check-solid-full アイコン（library="my-icons"）が出力されること
 *    - 2-6. 更新日時の値が「yyyy/MM/dd HH:mm:ss」形式でフォーマットされて表示されること
 *
 * 3. 年度セレクトの描画と変更操作
 *    - 3-1. 年度フィールドに wa-select が存在すること
 *    - 3-2. 年度セレクトの slot="start" に calendar-solid-full アイコン（library="my-icons"）が出力されること
 *    - 3-3. 年度セレクトの value に現在の年度（例: "2026"）が設定されていること
 *    - 3-4. セレクト内に getFiscalYearRange() の選択肢が wa-option として出力されること
 *    - 3-5. handleSelectFiscalYear 実行時に taskController.updateProperty({ fiscalYear }) が呼び出されること
 *
 * 4. ラベルセレクトの描画と変更操作
 *    - 4-1. ラベルフィールドに wa-select が存在すること
 *    - 4-2. ラベルセレクトの slot="start" に tag-solid-full アイコン（library="my-icons"）が出力されること
 *    - 4-3. ラベルセレクトの value に現在選択中のラベルIDが設定されていること
 *    - 4-4. セレクト内に labelsController.state の全ラベルが wa-option として出力されること
 *    - 4-5. handleSelectLabel 実行時に taskController.updateProperty({ labelId }) が呼び出されること
 *
 * 5. コントローラー購読（Context連携）
 *    - 5-1. taskController 設定時に controller.subscribe が呼び出されること
 *    - 5-2. labelsController 設定時に controller.subscribe が呼び出されること
 *    - 5-3. disconnectedCallback 実行時に購読解除関数が呼び出されること
 *
 * 6. BEM設計およびSCSSスタイルの検証
 *    - 6-1. SCSSスタイルシート（task-property.scss）が存在し、ルートブロック .task-property および主要BEMセレクタが定義されていること
 *    - 6-2. テーマ切替トランジション等のCSS変数指定（var(--stepnote-transition-theme) または theme-transition）が定義されていること
 *    - 6-3. task-property.scss に !important 宣言が一切含まれていないこと
 *    - 6-4. task-property.scss に @extend が一切含まれていないこと
 *    - 6-5. task-property.scss 全体においてハードコードされたカラーコードが 0 件（完全ゼロ）であること
 *    - 6-6. task-property.scss において .task-property__field が定義され、各項目のラベルおよびコントロール配置が整備されていること
 *
 * 7. 子データ（Issues / Notes / Logs）の件数・集計表示
 *    - 7-1. 課題（Issues）件数フィールドが存在し、総件数および未完了件数が正しく表示されること
 *    - 7-2. メモ（Notes）件数フィールドが存在し、総件数が正しく表示されること
 *    - 7-3. 履歴（Logs）件数フィールドが存在し、総件数が正しく表示されること
 *    - 7-4. 各コントローラーの state が空または undefined の場合、0件と表示されること
 *    - 7-5. 各フィールドの slot="start" に対応するアイコン（list-check-solid-full, pen-to-square-solid-full, code-branch-solid-full）が出力されること
 *    - 7-6. issuesController, notesController, logsController 設定時にそれぞれ subscribe が呼び出されること
 */
describe("TaskProperty Component", () => {
  let element: TaskProperty;
  let mockTaskController: {
    state: TaskRecord | undefined;
    hasTask: boolean;
    updateProperty: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let mockLabelsController: {
    state: LabelRecord[];
    subscribe: ReturnType<typeof vi.fn>;
  };
  let mockIssuesController: {
    state: IssueRecord[];
    subscribe: ReturnType<typeof vi.fn>;
  };
  let mockNotesController: {
    state: NoteRecord[];
    subscribe: ReturnType<typeof vi.fn>;
  };
  let mockLogsController: {
    state: LogRecord[];
    subscribe: ReturnType<typeof vi.fn>;
  };
  let unsubscribeTaskMock: ReturnType<typeof vi.fn>;
  let unsubscribeLabelsMock: ReturnType<typeof vi.fn>;
  let unsubscribeIssuesMock: ReturnType<typeof vi.fn>;
  let unsubscribeNotesMock: ReturnType<typeof vi.fn>;
  let unsubscribeLogsMock: ReturnType<typeof vi.fn>;

  const baseTask: TaskRecord = {
    id: 101,
    name: "プロパティタブの実装",
    statusCode: 0,
    dueDate: new Date("2026-06-15T00:00:00.000Z"),
    contacts: [],
    description: "",
    fiscalYear: 2026,
    labelId: 2,
    bookmark: false,
    selected: true,
    createdAt: new Date("2026-04-01T09:30:00.000Z"),
    updatedAt: new Date("2026-04-10T14:45:00.000Z"),
  };

  const sampleLabels: LabelRecord[] = [
    { id: 1, name: "業務企画", description: "", isSelected: false },
    { id: 2, name: "開発", description: "", isSelected: true },
    { id: 3, name: "運用保守", description: "", isSelected: false },
  ];

  const sampleIssues: IssueRecord[] = [
    {
      id: 1,
      taskId: 101,
      title: "UIコンポーネント設計",
      statusCode: 0,
      value: "",
      dueDate: new Date("2026-06-01T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      taskId: 101,
      title: "単体テスト作成",
      statusCode: 5,
      value: "",
      dueDate: new Date("2026-06-05T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      taskId: 101,
      title: "ドキュメント作成",
      statusCode: 9,
      value: "",
      dueDate: new Date("2026-06-10T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const sampleNotes: NoteRecord[] = [
    {
      id: 1,
      taskId: 101,
      value: "仕様メモ1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      taskId: 101,
      value: "仕様メモ2",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const sampleLogs: LogRecord[] = [
    {
      id: 1,
      taskId: 101,
      value: "タスク作成",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      taskId: 101,
      value: "ステータス更新",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      taskId: 101,
      value: "Issue追加",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 4,
      taskId: 101,
      value: "Issue更新",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 5,
      taskId: 101,
      value: "Issue完了",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    unsubscribeTaskMock = vi.fn();
    unsubscribeLabelsMock = vi.fn();
    unsubscribeIssuesMock = vi.fn();
    unsubscribeNotesMock = vi.fn();
    unsubscribeLogsMock = vi.fn();

    mockTaskController = {
      state: { ...baseTask },
      hasTask: true,
      updateProperty: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(unsubscribeTaskMock),
    };

    mockLabelsController = {
      state: [...sampleLabels],
      subscribe: vi.fn().mockReturnValue(unsubscribeLabelsMock),
    };

    mockIssuesController = {
      state: [...sampleIssues],
      subscribe: vi.fn().mockReturnValue(unsubscribeIssuesMock),
    };

    mockNotesController = {
      state: [...sampleNotes],
      subscribe: vi.fn().mockReturnValue(unsubscribeNotesMock),
    };

    mockLogsController = {
      state: [...sampleLogs],
      subscribe: vi.fn().mockReturnValue(unsubscribeLogsMock),
    };

    element = new TaskProperty();
    element.taskController = mockTaskController as unknown as TaskController;
    element.labelsController =
      mockLabelsController as unknown as LabelsController;
    element.issuesController =
      mockIssuesController as unknown as IssuesController;
    element.notesController = mockNotesController as unknown as NotesController;
    element.logsController = mockLogsController as unknown as LogsController;
  });

  describe("1. タスク未選択状態（Empty State）の描画", () => {
    it("1-1. taskController.state が未定義の場合、空描画（.task-property--empty）となること", () => {
      mockTaskController.state = undefined;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-property--empty");
    });
  });

  describe("2. 作成日時・更新日時フィールドの描画", () => {
    it("2-1. 作成日時フィールド（wa-input）が存在し、readonly 属性が設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-input[^>]*class=["'][^"']*task-property__input--created-at[^"']*["'][^>]*\breadonly\b/,
      );
    });

    it('2-2. 作成日時フィールドの slot="start" に calendar-plus-solid-full アイコン（library="my-icons"）が出力されること', () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot=["']start["'][^>]*library=["']my-icons["'][^>]*name=["']calendar-plus-solid-full["']/,
      );
    });

    it("2-3. 作成日時の値が「yyyy/MM/dd HH:mm:ss」形式でフォーマットされて表示されること", () => {
      const expectedDate = format(baseTask.createdAt!, "yyyy/MM/dd HH:mm:ss");
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain(expectedDate);
    });

    it("2-4. 更新日時フィールド（wa-input）が存在し、readonly 属性が設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-input[^>]*class=["'][^"']*task-property__input--updated-at[^"']*["'][^>]*\breadonly\b/,
      );
    });

    it('2-5. 更新日時フィールドの slot="start" に calendar-check-solid-full アイコン（library="my-icons"）が出力されること', () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot=["']start["'][^>]*library=["']my-icons["'][^>]*name=["']calendar-check-solid-full["']/,
      );
    });

    it("2-6. 更新日時の値が「yyyy/MM/dd HH:mm:ss」形式でフォーマットされて表示されること", () => {
      const expectedDate = format(baseTask.updatedAt!, "yyyy/MM/dd HH:mm:ss");
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain(expectedDate);
    });
  });

  describe("3. 年度セレクトの描画と変更操作", () => {
    it("3-1. 年度フィールドに wa-select が存在すること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-property__fiscal-year-select");
      expect(htmlStr).toContain("wa-select");
    });

    it('3-2. 年度セレクトの slot="start" に calendar-solid-full アイコン（library="my-icons"）が出力されること', () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot=["']start["'][^>]*library=["']my-icons["'][^>]*name=["']calendar-solid-full["']/,
      );
    });

    it('3-3. 年度セレクトの value に現在の年度（例: "2026"）が設定されていること', () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-select[^>]*class=["'][^"']*task-property__fiscal-year-select[^"']*["'][^>]*\.value=["']?2026["']?/,
      );
    });

    it("3-4. セレクト内に getFiscalYearRange() の選択肢が wa-option として出力されること", () => {
      const htmlStr = flattenTemplate(element.render());
      const years = getFiscalYearRange();
      for (const fy of years) {
        expect(htmlStr).toContain(`${fy}年度`);
      }
      expect(htmlStr).toMatch(/<wa-option[^>]*value=["']?2026["']?/);
    });

    it("3-5. handleSelectFiscalYear 実行時に taskController.updateProperty({ fiscalYear }) が呼び出されること", async () => {
      await element.handleSelectFiscalYear(2027);
      expect(mockTaskController.updateProperty).toHaveBeenCalledWith({
        fiscalYear: 2027,
      });
    });
  });

  describe("4. ラベルセレクトの描画と変更操作", () => {
    it("4-1. ラベルフィールドに wa-select が存在すること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-property__label-select");
      expect(htmlStr).toContain("wa-select");
    });

    it('4-2. ラベルセレクトの slot="start" に tag-solid-full アイコン（library="my-icons"）が出力されること', () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot=["']start["'][^>]*library=["']my-icons["'][^>]*name=["']tag-solid-full["']/,
      );
    });

    it("4-3. ラベルセレクトの value に現在選択中のラベルIDが設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-select[^>]*class=["'][^"']*task-property__label-select[^"']*["'][^>]*\.value=["']?2["']?/,
      );
    });

    it("4-4. セレクト内に labelsController.state の全ラベルが wa-option として出力されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("業務企画");
      expect(htmlStr).toContain("開発");
      expect(htmlStr).toContain("運用保守");
      expect(htmlStr).toMatch(/<wa-option[^>]*value=["']?2["']?/);
    });

    it("4-5. handleSelectLabel 実行時に taskController.updateProperty({ labelId }) が呼び出されること", async () => {
      await element.handleSelectLabel(3);
      expect(mockTaskController.updateProperty).toHaveBeenCalledWith({
        labelId: 3,
      });
    });
  });

  describe("5. コントローラー購読（Context連携）", () => {
    it("5-1. taskController 設定時に controller.subscribe が呼び出されること", () => {
      const newController = {
        state: { ...baseTask },
        updateProperty: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };
      element.taskController = newController as unknown as TaskController;
      expect(newController.subscribe).toHaveBeenCalled();
    });

    it("5-2. labelsController 設定時に controller.subscribe が呼び出されること", () => {
      const newController = {
        state: [...sampleLabels],
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };
      element.labelsController =
        newController as unknown as LabelsController;
      expect(newController.subscribe).toHaveBeenCalled();
    });

    it("5-3. disconnectedCallback 実行時に購読解除関数が呼び出されること", () => {
      element.disconnectedCallback();
      expect(unsubscribeTaskMock).toHaveBeenCalled();
      expect(unsubscribeLabelsMock).toHaveBeenCalled();
    });
  });

  describe("6. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "task-property.scss");

    it("6-1. SCSSスタイルシート（task-property.scss）が存在し、ルートブロック .task-property および主要BEMセレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain(".task-property");
      expect(content).toContain(".task-property__field");
      expect(content).toContain(".task-property__label");
      expect(content).toContain(".task-property__control");
    });

    it("6-2. テーマ切替トランジション等のCSS変数指定（var(--stepnote-transition-theme) または theme-transition）が定義されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(
        content.includes("theme-transition") ||
          content.includes("--stepnote-transition-theme"),
      ).toBe(true);
    });

    it("6-3. task-property.scss に !important 宣言が一切含まれていないこと", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toContain("!important");
    });

    it("6-4. task-property.scss に @extend が一切含まれていないこと", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toContain("@extend");
    });

    it("6-5. task-property.scss 全体においてハードコードされたカラーコードが 0 件（完全ゼロ）であること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      const hexColorRegex = /#([0-9a-fA-F]{3,8})\b/;
      const rgbColorRegex = /\brgba?\(/;
      expect(hexColorRegex.test(content)).toBe(false);
      expect(rgbColorRegex.test(content)).toBe(false);
    });

    it("6-6. task-property.scss において .task-property__field が定義され、各項目のラベルおよびコントロール配置が整備されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain(".task-property__field");
    });
  });

  describe("7. 子データ（Issues / Notes / Logs）の件数・集計表示", () => {
    it("7-1. 課題（Issues）件数フィールドが存在し、総件数および未完了件数が正しく表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-input[^>]*class=["'][^"']*task-property__input--issues-count[^"']*["'][^>]*\breadonly\b/,
      );
      expect(htmlStr).toContain("3件 (未完了 2件)");
    });

    it("7-2. メモ（Notes）件数フィールドが存在し、総件数が正しく表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-input[^>]*class=["'][^"']*task-property__input--notes-count[^"']*["'][^>]*\breadonly\b/,
      );
      expect(htmlStr).toContain("2件");
    });

    it("7-3. 履歴（Logs）件数フィールドが存在し、総件数が正しく表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-input[^>]*class=["'][^"']*task-property__input--logs-count[^"']*["'][^>]*\breadonly\b/,
      );
      expect(htmlStr).toContain("5件");
    });

    it("7-4. 各コントローラーの state が空または undefined の場合、0件と表示されること", () => {
      mockIssuesController.state = [];
      mockNotesController.state = [];
      mockLogsController.state = [];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("0件 (未完了 0件)");
      expect(htmlStr).toContain("0件");
    });

    it('7-5. 各フィールドの slot="start" に対応するアイコン（list-check-solid-full, pen-to-square-solid-full, cubes-stacked-solid-full）が出力されること', () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot=["']start["'][^>]*library=["']my-icons["'][^>]*name=["']list-check-solid-full["']/,
      );
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot=["']start["'][^>]*library=["']my-icons["'][^>]*name=["']pen-to-square-solid-full["']/,
      );
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot=["']start["'][^>]*library=["']my-icons["'][^>]*name=["']code-branch-solid-full["']/,
      );
    });

    it("7-6. issuesController, notesController, logsController 設定時にそれぞれ subscribe が呼び出され、disconnectedCallback 時に解除されること", () => {
      const newIssuesCtrl = {
        state: [],
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };
      const newNotesCtrl = {
        state: [],
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };
      const newLogsCtrl = {
        state: [],
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      element.issuesController = newIssuesCtrl as unknown as IssuesController;
      element.notesController = newNotesCtrl as unknown as NotesController;
      element.logsController = newLogsCtrl as unknown as LogsController;

      expect(newIssuesCtrl.subscribe).toHaveBeenCalled();
      expect(newNotesCtrl.subscribe).toHaveBeenCalled();
      expect(newLogsCtrl.subscribe).toHaveBeenCalled();

      element.disconnectedCallback();
      expect(unsubscribeIssuesMock).toHaveBeenCalled();
      expect(unsubscribeNotesMock).toHaveBeenCalled();
      expect(unsubscribeLogsMock).toHaveBeenCalled();
    });
  });
});
