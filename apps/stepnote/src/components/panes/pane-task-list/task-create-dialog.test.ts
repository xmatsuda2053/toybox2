import "fake-indexeddb/auto";
import * as fs from "node:fs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate, format } from "@shared/utils";
import type { LabelRecord } from "@/db/models/navigation.model";
import { TaskCreateDialog } from "./task-create-dialog";

/**
 * 【TaskCreateDialog 仕様 (Task List パネル新規タスク作成ダイアログ実装)】
 *
 * 1. ダイアログの基本構造およびレンダリング
 *    - [x] 1-1. wa-dialog 要素（id="task-create-dialog"）がレンダリングされ、タイトル「新規タスクの作成」が設定されること
 *    - [x] 1-2. タスク名入力欄（wa-input#task-create-name）が存在し、required 属性が付与されていること
 *    - [x] 1-3. 期日選択部品（datepicker-input#task-create-due-date）が存在し、初期値にシステム日付（当日 yyyy-MM-dd）が設定され、label="期日" および required が指定されていること
 *    - [x] 1-4. 作業年度選択欄（wa-select#task-create-fiscal-year）が存在し、初期値に対象年度が設定されていること
 *    - [x] 1-5. ラベル選択欄（wa-select#task-create-label）が存在し、登録済みラベル一覧が選択肢（wa-option）としてレンダリングされること
 *    - [x] 1-6. キャンセルボタン（task-create-dialog__btn-cancel）および登録ボタン（task-create-dialog__btn-submit）が配置されていること
 *    - [x] 1-7. 作業年度選択欄（wa-select#task-create-fiscal-year）で change イベントが発火した際、handleSelectFiscalYear により inputFiscalYear が更新されること
 *    - [x] 1-8. ラベル選択欄（wa-select#task-create-label）で change イベントが発火した際、handleSelectLabel により inputLabelId が更新されること（空選択時は undefined）
 *    - [x] 1-9. 作業年度選択欄およびラベル選択欄（wa-select）が Web Awesome 3.x の標準 @change イベントでバインドされていること
 *
 * 2. 入力バリデーションと登録制御
 *    - [x] 2-1. タスク名が空（未入力または空白のみ）の場合、登録処理が実行されないこと
 *    - [x] 2-2. 期日が未入力（空文字）の場合、登録処理が実行されないこと
 *    - [x] 2-3. タスク名および期日が正しく入力されている場合、登録可能であること
 *
 * 3. タスク登録処理と TaskController 連携
 *    - [x] 3-1. 有効な入力内容で登録ハンドラー（handleSave）を実行した際、taskController.createTask が適切な値で呼び出されること
 *    - [x] 3-2. タスク登録成功後、task-created カスタムイベントが発行され、ダイアログが閉じること
 *    - [x] 3-3. submit イベントを伴って handleSave を実行した際、event.preventDefault が呼び出されること
 *    - [x] 3-4. フォーム要素の @submit に handleSave が直接バインドされていること
 *
 * 4. ダイアログの開閉と入力値リセット
 *    - [x] 4-1. キャンセル操作時、入力フォームが初期値（タスク名空、期日はシステム日付、年度・ラベルは現在値）にリセットされること
 *    - [x] 4-2. ダイアログが閉じる際、dialog-close カスタムイベントが発行されること
 *    - [x] 4-3. 子要素（wa-select や popover 等）からバブリングした wa-after-hide イベントではダイアログが閉じないこと
 *    - [x] 4-4. 期日変更（handleDateChange）や年度変更（handleSelectFiscalYear）、ラベル変更（handleSelectLabel）操作時にダイアログの開状態（open = true）が維持されること
 *
 * 5. BEM設計およびSCSSスタイルの検証
 *    - [x] 5-1. SCSSスタイルシート（task-create-dialog.scss）が存在し、ルートブロック .task-create-dialog およびBEMセレクタが定義されていること
 *    - [x] 5-2. ダイアログ共通 Mixin（dialog-common.scss）がインポートされ、ダイアログサーフェスが適用されていること
 *    - [x] 5-3. フォームラベルに対する個別の font-size 上書きが存在せず、Web Awesome の標準サイズ設計に準拠していること
 *    - [x] 5-4. フォームフィールドのラベルに対する過剰な margin-bottom（var(--wa-space-3xs) 等）の上書きが存在せず、Web Awesome の標準マージン設計（0.5em）に準拠していること
 *
 * 6. Web Awesome コンポーネント登録の検証
 *    - [x] 6-1. アプリケーションエントリ（index.ts）で wa-select および wa-option がインポートされていること
 */

describe("TaskCreateDialog Component", () => {
  let element: TaskCreateDialog;
  let mockTaskController: {
    createTask: ReturnType<typeof vi.fn>;
    hasTask: boolean;
  };
  let mockLabelsController: {
    state: LabelRecord[];
    selectedLabelId: number | undefined;
    hasSelectedLabels: boolean;
  };

  const initialLabels: LabelRecord[] = [
    {
      id: 1,
      name: "プロジェクトA",
      description: "重要案件",
      isSelected: false,
    },
    {
      id: 2,
      name: "定例業務",
      description: "定例タスク",
      isSelected: true,
    },
  ];

  beforeEach(() => {
    element = new TaskCreateDialog();
    element.open = true;
    element.fiscalYear = 2026;

    mockTaskController = {
      createTask: vi.fn().mockResolvedValue(101),
      hasTask: false,
    };

    mockLabelsController = {
      state: [...initialLabels],
      selectedLabelId: 2,
      hasSelectedLabels: true,
    };

    // Controller モックの紐付け
    (element as any).taskController = mockTaskController;
    (element as any).labelsController = mockLabelsController;
  });

  describe("1. ダイアログの基本構造およびレンダリング", () => {
    it("1-1. wa-dialog 要素（id=\"task-create-dialog\"）がレンダリングされ、タイトル「新規タスクの作成」が設定されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("wa-dialog");
      expect(htmlStr).toContain("task-create-dialog");
      expect(htmlStr).toContain("新規タスクの作成");
    });

    it("1-2. タスク名入力欄（wa-input#task-create-name）が存在し、required 属性が付与されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("wa-input");
      expect(htmlStr).toContain("task-create-name");
      expect(htmlStr).toMatch(/required/);
    });

    it("1-3. 期日選択部品（datepicker-input#task-create-due-date）が存在し、初期値にシステム日付（当日 yyyy-MM-dd）が設定され、label=\"期日\" および required が指定されていること", () => {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("datepicker-input");
      expect(htmlStr).toContain("task-create-due-date");
      expect(htmlStr).toContain(todayStr);
      expect(htmlStr).toMatch(/label=["']?期日["']?/);
      expect(htmlStr).toMatch(/required/);
    });

    it("1-4. 作業年度選択欄（wa-select#task-create-fiscal-year）が存在し、初期値に対象年度が設定されていること", () => {
      element.fiscalYear = 2026;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("wa-select");
      expect(htmlStr).toContain("task-create-fiscal-year");
      expect(htmlStr).toContain("2026");
    });

    it("1-5. ラベル選択欄（wa-select#task-create-label）が存在し、登録済みラベル一覧が選択肢（wa-option）としてレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("wa-select");
      expect(htmlStr).toContain("task-create-label");
      expect(htmlStr).toContain("プロジェクトA");
      expect(htmlStr).toContain("定例業務");
    });

    it("1-6. キャンセルボタン（task-create-dialog__btn-cancel）および登録ボタン（task-create-dialog__btn-submit）が配置されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-create-dialog__btn-cancel");
      expect(htmlStr).toContain("task-create-dialog__btn-submit");
    });

    it("1-7. 作業年度選択欄（wa-select#task-create-fiscal-year）で change イベントが発火した際、handleSelectFiscalYear により inputFiscalYear が更新されること", () => {
      const dummyEvent = {
        target: { value: "2028" },
      } as unknown as Event;
      element.handleSelectFiscalYear(dummyEvent);
      expect((element as any).inputFiscalYear).toBe(2028);
    });

    it("1-8. ラベル選択欄（wa-select#task-create-label）で change イベントが発火した際、handleSelectLabel により inputLabelId が更新されること（空選択時は undefined）", () => {
      const selectEvent = {
        target: { value: "1" },
      } as unknown as Event;
      element.handleSelectLabel(selectEvent);
      expect((element as any).inputLabelId).toBe(1);

      const clearEvent = {
        target: { value: "" },
      } as unknown as Event;
      element.handleSelectLabel(clearEvent);
      expect((element as any).inputLabelId).toBeUndefined();
    });

    it("1-9. 作業年度選択欄およびラベル選択欄（wa-select）が Web Awesome 3.x の標準 @change イベントでバインドされていること", () => {
      const template = element.render();
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain("@change");
      expect(templateStr).not.toContain("@wa-change");
    });
  });

  describe("2. 入力バリデーションと登録制御", () => {
    it("2-1. タスク名が空（未入力または空白のみ）の場合、登録処理が実行されないこと", async () => {
      (element as any).inputName = "   ";
      (element as any).inputDueDate = format(new Date(), "yyyy-MM-dd");

      const result = await (element as any).handleSave();
      expect(result).toBe(false);
      expect(mockTaskController.createTask).not.toHaveBeenCalled();
    });

    it("2-2. 期日が未入力（空文字）の場合、登録処理が実行されないこと", async () => {
      (element as any).inputName = "新規タスク";
      (element as any).inputDueDate = "";

      const result = await (element as any).handleSave();
      expect(result).toBe(false);
      expect(mockTaskController.createTask).not.toHaveBeenCalled();
    });

    it("2-3. タスク名および期日が正しく入力されている場合、登録可能であること", () => {
      (element as any).inputName = "正常なタスク";
      (element as any).inputDueDate = format(new Date(), "yyyy-MM-dd");

      expect((element as any).isValid).toBe(true);
    });
  });

  describe("3. タスク登録処理と TaskController 連携", () => {
    it("3-1. 有効な入力内容で登録ハンドラーを実行した際、taskController.createTask が適切な値で呼び出されること", async () => {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      (element as any).inputName = "リリース準備";
      (element as any).inputDueDate = todayStr;
      (element as any).inputFiscalYear = 2026;
      (element as any).inputLabelId = 2;

      let eventFired = false;
      element.addEventListener("task-created", () => {
        eventFired = true;
      });

      const result = await (element as any).handleSave();
      expect(result).toBe(true);
      expect(mockTaskController.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "リリース準備",
          fiscalYear: 2026,
          labelId: 2,
        }),
      );
      expect(eventFired).toBe(true);
      expect(element.open).toBe(false);
    });

    it("3-2. タスク登録成功後、task-created カスタムイベントが発行され、ダイアログが閉じること", async () => {
      (element as any).inputName = "タスクB";
      (element as any).inputDueDate = format(new Date(), "yyyy-MM-dd");

      let createdDetail: any = null;
      element.addEventListener("task-created", (e: any) => {
        createdDetail = e.detail;
      });

      await (element as any).handleSave();

      expect(createdDetail).toBeDefined();
      expect(createdDetail.taskId).toBe(101);
      expect(element.open).toBe(false);
    });

    it("3-3. submit イベントを伴って handleSave を実行した際、event.preventDefault が呼び出されること", async () => {
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as Event;

      await (element as any).handleSave(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it("3-4. フォーム要素の @submit に handleSave が直接バインドされていること", () => {
      const template = element.render();
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain("@submit");
      // @submit=${this.handleSave} の場合、values 配列に handleSave 関数が含まれる
      const formTemplate = (template as any).values[2];
      expect(formTemplate.values[0]).toBe(element.handleSave);
    });
  });

  describe("4. ダイアログの開閉と入力値リセット", () => {
    it("4-1. キャンセル操作時、入力フォームが初期値（タスク名空、期日はシステム日付、年度・ラベルは現在値）にリセットされること", () => {
      (element as any).inputName = "入力途中のタスク";
      (element as any).inputDueDate = "2099-12-31";

      (element as any).handleCancel();

      expect((element as any).inputName).toBe("");
      expect((element as any).inputDueDate).toBe(format(new Date(), "yyyy-MM-dd"));
      expect(element.open).toBe(false);
    });

    it("4-2. ダイアログが閉じる際、dialog-close カスタムイベントが発行されること", () => {
      let closeFired = false;
      element.addEventListener("dialog-close", () => {
        closeFired = true;
      });

      (element as any).handleCancel();

      expect(closeFired).toBe(true);
    });

    it("4-3. 子要素（wa-select や popover 等）からバブリングした wa-after-hide イベントではダイアログが閉じないこと", () => {
      element.open = true;
      (element as any).inputName = "入力途中のタスク";

      const dummyChild = { tagName: "WA-SELECT" };
      const dialogElem = { tagName: "WA-DIALOG" };
      const bubblingEvent = {
        type: "wa-after-hide",
        target: dummyChild,
        currentTarget: dialogElem,
      } as unknown as Event;

      (element as any).handleCancel(bubblingEvent);

      expect(element.open).toBe(true);
      expect((element as any).inputName).toBe("入力途中のタスク");
    });

    it("4-4. 期日変更（handleDateChange）や年度変更（handleSelectFiscalYear）、ラベル変更（handleSelectLabel）操作時にダイアログの開状態（open = true）が維持されること", () => {
      element.open = true;
      element.handleSelectFiscalYear({ target: { value: "2027" } } as unknown as Event);
      expect(element.open).toBe(true);

      element.handleSelectLabel({ target: { value: "1" } } as unknown as Event);
      expect(element.open).toBe(true);

      element.handleDateChange(
        new CustomEvent("datepicker-change", {
          detail: { value: "2026-10-01", date: new Date(2026, 9, 1) },
        }) as any,
      );
      expect(element.open).toBe(true);
    });
  });

  describe("5. BEM設計およびSCSSスタイルの検証", () => {
    it("5-1. SCSSスタイルシートが存在し、ルートブロック .task-create-dialog および主要要素のBEMセレクタが定義されていること", () => {
      const scssPath = new URL("./task-create-dialog.scss", import.meta.url);
      expect(fs.existsSync(scssPath)).toBe(true);

      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toContain(".task-create-dialog");
      expect(scssContent).toContain(".task-create-dialog__form");
      expect(scssContent).toContain(".task-create-dialog__field");
      expect(scssContent).toContain(".task-create-dialog__actions");
    });

    it("5-2. ダイアログ共通 Mixin（dialog-common.scss）がインポートされ、ダイアログサーフェスが適用されていること", () => {
      const scssPath = new URL("./task-create-dialog.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toContain("dialog-common.scss");
      expect(scssContent).toContain("@include dialog-surface");
    });

    it("5-3. フォームラベルに対する個別の font-size 上書きが存在せず、Web Awesome の標準サイズ設計に準拠していること", () => {
      const scssPath = new URL("./task-create-dialog.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).not.toMatch(/font-size:\s*var\(--wa-font-size-s/);
    });

    it("5-4. フォームフィールドのラベルに対する過剰な margin-bottom（var(--wa-space-3xs) 等）の上書きが存在せず、Web Awesome の標準マージン設計（0.5em）に準拠していること", () => {
      const scssPath = new URL("./task-create-dialog.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).not.toMatch(/margin-bottom:\s*var\(--wa-space-3xs/);
    });
  });

  describe("6. Web Awesome コンポーネント登録の検証", () => {
    it("6-1. アプリケーションエントリ（index.ts）で wa-select および wa-option がインポートされていること", () => {
      const indexPath = new URL("../../../index.ts", import.meta.url);
      expect(fs.existsSync(indexPath)).toBe(true);
      const indexContent = fs.readFileSync(indexPath, "utf-8");
      expect(indexContent).toContain("components/select/select.js");
      expect(indexContent).toContain("components/option/option.js");
    });
  });
});
