import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate, format, getFiscalYearRange } from "@shared/utils";
import type { TaskRecord } from "@/db/models/task.model.js";
import type { LabelRecord } from "@/db/models/navigation.model.js";
import type { TaskController } from "@/controllers/task.controller.js";
import type { LabelsController } from "@/controllers/labels.controller.js";
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
  let unsubscribeTaskMock: ReturnType<typeof vi.fn>;
  let unsubscribeLabelsMock: ReturnType<typeof vi.fn>;

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

  beforeEach(() => {
    unsubscribeTaskMock = vi.fn();
    unsubscribeLabelsMock = vi.fn();

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

    element = new TaskProperty();
    element.taskController = mockTaskController as unknown as TaskController;
    element.labelsController =
      mockLabelsController as unknown as LabelsController;
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
});
