import "fake-indexeddb/auto";
import * as fs from "node:fs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate, format } from "@shared/utils";
import type { LabelRecord } from "@/db/models/navigation.model";
import type { TagRecord, TagSetRecord } from "@/db/models/tag.model";
import type { TagsController } from "@/controllers/tags.controller";
import type { TagSetsController } from "@/controllers/tag-sets.controller";
import { TaskCreateDialog } from "./task-create-dialog.js";

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
 *    - [x] 1-10. ラベル選択欄（wa-select#task-create-label）の選択肢がラベル名（文字列）の昇順（辞書順・自然順）でソートされてレンダリングされること
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
 *    - [x] 4-5. 選択中ラベル未指定（selectedLabelIdなし、labelsController.selectedLabelIdなし）でのresetForm時、ソート後の先頭ラベルが初期選択ラベル（inputLabelId）として設定されること
 *
 * 5. BEM設計およびSCSSスタイルの検証
 *    - [x] 5-1. SCSSスタイルシート（task-create-dialog.scss）が存在し、ルートブロック .task-create-dialog およびBEMセレクタが定義されていること
 *    - [x] 5-2. ダイアログ共通 Mixin（dialog-common.scss）がインポートされ、ダイアログサーフェスが適用されていること
 *    - [x] 5-3. フォームラベルに対する個別の font-size 上書きが存在せず、Web Awesome の標準サイズ設計に準拠していること
 *    - [x] 5-4. フォームフィールドのラベルに対する過剰な margin-bottom（var(--wa-space-3xs) 等）の上書きが存在せず、Web Awesome の標準マージン設計（0.5em）に準拠していること
 *
 * 6. Web Awesome コンポーネント登録の検証
 *    - [x] 6-1. アプリケーションエントリ（index.ts）および登録基盤（webawesome.ts）で wa-select および wa-option が登録されていること
 *
 * 7. タグセット選択およびタグプレビュー機能
 *    - [x] 7-1. テンプレート選択欄の下にタグセット選択欄（wa-select#task-create-tag-set）が配置され、「タグセットなし」および登録済みタグセット一覧が選択肢としてレンダリングされること
 *    - [x] 7-2. タグの個別選択用チェックボックス（wa-checkbox）および削除ボタン付きタグチップ（with-remove）が描画されないこと
 *    - [x] 7-3. handleSelectTagSet でタグセットIDを選択・解除（空選択時は undefined）でき、選択中タグセットに含まれるタグがカラー付き wa-tag でプレビュー表示されること
 *    - [x] 7-4. タグセット未選択時はタグプレビュー領域が表示されないこと
 *    - [x] 7-5. タスク登録（handleSave）実行時、選択中タグセットの tagIds が taskController.createTask に渡されること（未選択時は空配列）
 *    - [x] 7-6. フォームリセット（resetForm / handleCancel）時に inputTagSetId が undefined に初期化されること
 *    - [x] 7-7. SCSS にタグプレビュー用のBEMセレクタおよび stepnote-tag-styles Mixin が適用されており、個別選択用チェックリストのスタイルが存在しないこと
 *
 * 8. 横並びラベルレイアウトの検証
 *    - [x] 8-1. 各入力項目（タスク名・期日・対象年度・ラベル・テンプレート・タグセット）が横並び行（.task-create-dialog__row）と左側ラベル（.task-create-dialog__label）でレンダリングされ、入力要素自体に上配置用の label 属性が付与されていないこと
 *    - [x] 8-2. 必須項目（タスク名・期日）のラベルに必須マーク（.task-create-dialog__required）が表示されること
 *    - [x] 8-3. SCSS に左ラベル横並びレイアウト用のBEMセレクタ（.task-create-dialog__row / .task-create-dialog__label / .task-create-dialog__required）および grid-template-columns が定義されていること
 *    - [x] 8-4. 入力要素内部（wa-input / datepicker-input）のデフォルト必須アスタリスクおよび内部ラベル領域が SCSS で非表示にされていること
 *    - [x] 8-5. wa-dialog の幅（--width）が横並びラベル表示に適した幅（640px）に拡張されていること
 */

interface MockTagsController {
  state: TagRecord[];
  getTagsByIds: (ids?: readonly number[]) => TagRecord[];
  subscribe?: ReturnType<typeof vi.fn>;
}

interface MockTagSetsController {
  state: TagSetRecord[];
  getTagSetById: (id: number) => TagSetRecord | undefined;
  subscribe?: ReturnType<typeof vi.fn>;
}

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
  let mockTaskTemplateController: {
    state: any[];
  };
  let mockTagsController: MockTagsController;
  let mockTagSetsController: MockTagSetsController;

  const initialTags: TagRecord[] = [
    { id: 10, name: "重要", description: "最優先タスク", variant: "danger" },
    { id: 20, name: "定例", description: "定期実施", variant: "brand" },
    { id: 30, name: "確認待ち", description: "", variant: "purple" },
  ];

  const initialTagSets: TagSetRecord[] = [
    {
      id: 1,
      name: "リリース前チェック",
      description: "リリース時に付与",
      tagIds: [10, 30],
    },
    {
      id: 2,
      name: "定例対応セット",
      description: "",
      tagIds: [20],
    },
  ];

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
    mockTaskTemplateController = {
      state: [
        { id: 10, name: "定例テンプレート", description: "## 定例概要", issues: [{ id: "1", order: 1, value: "# 準備", dayOffset: 0 }] },
      ],
    };
    (element as any).taskTemplateController = mockTaskTemplateController;

    mockTagsController = {
      state: [...initialTags],
      getTagsByIds: (ids?: readonly number[]) => {
        if (!ids || ids.length === 0) return [];
        const map = new Map(mockTagsController.state.map((t) => [t.id, t]));
        return ids
          .map((id) => map.get(id))
          .filter((t): t is TagRecord => t !== undefined);
      },
    };
    mockTagSetsController = {
      state: [...initialTagSets],
      getTagSetById: (id: number) =>
        mockTagSetsController.state.find((s) => s.id === id),
    };
    element.tagsController = mockTagsController as unknown as TagsController;
    element.tagSetsController =
      mockTagSetsController as unknown as TagSetsController;
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

    it("1-5-2. テンプレート選択欄（wa-select#task-create-template）が存在し、登録済みテンプレートが選択肢としてレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("id=\"task-create-template\"");
      expect(htmlStr).toContain("定例テンプレート");
      expect(htmlStr).toContain("テンプレートなし");
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

    it("1-10. ラベル選択欄（wa-select#task-create-label）の選択肢がラベル名（文字列）の昇順（辞書順・自然順）でソートされてレンダリングされること", () => {
      mockLabelsController.state = [
        { id: 1, name: "プロジェクトA", description: "", isSelected: false },
        { id: 2, name: "プライベート", description: "", isSelected: false },
        { id: 3, name: "あさひ", description: "", isSelected: false },
      ];

      const htmlStr = flattenTemplate(element.render());
      const posAsahi = htmlStr.indexOf("あさひ");
      const posPrivate = htmlStr.indexOf("プライベート");
      const posProject = htmlStr.indexOf("プロジェクトA");

      expect(posAsahi).toBeGreaterThan(-1);
      expect(posPrivate).toBeGreaterThan(-1);
      expect(posProject).toBeGreaterThan(-1);

      // "あさひ" < "プライベート" < "プロジェクトA" の順序でレンダリングされていること
      expect(posAsahi).toBeLessThan(posPrivate);
      expect(posPrivate).toBeLessThan(posProject);
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
        undefined,
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

    it("3-5. テンプレート選択時、タスク概要にテンプレートのMarkdownが設定され、初期Issueが作成されること", async () => {
      (element as any).inputName = "定例タスク";
      (element as any).inputDueDate = "2026-11-10";
      (element as any).inputTemplateId = 10;

      const result = await (element as any).handleSave();
      expect(result).toBe(true);
      expect(mockTaskController.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "定例タスク",
          description: "## 定例概要",
          templateName: "定例テンプレート",
        }),
        expect.arrayContaining([
          expect.objectContaining({
            title: "準備",
            value: "# 準備",
          }),
        ]),
      );
    });

    it("3-6. テンプレート未選択時、テンプレート未選択のまま初期Issueなしで作成されること", async () => {
      (element as any).inputName = "通常タスク";
      (element as any).inputDueDate = "2026-11-10";
      (element as any).inputTemplateId = undefined;

      const result = await (element as any).handleSave();
      expect(result).toBe(true);
      expect(mockTaskController.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "通常タスク",
          description: "",
        }),
        undefined,
      );
    });
    it("3-4. フォーム要素の @submit に handleSave が直接バインドされていること", () => {
      const template = element.render();
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain("@submit");
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

    it("4-5. 選択中ラベル未指定（selectedLabelIdなし、labelsController.selectedLabelIdなし）でのresetForm時、ソート後の先頭ラベルが初期選択ラベル（inputLabelId）として設定されること", () => {
      mockLabelsController.selectedLabelId = undefined;
      mockLabelsController.state = [
        { id: 1, name: "プロジェクトA", description: "", isSelected: false },
        { id: 2, name: "プライベート", description: "", isSelected: false },
        { id: 3, name: "あさひ", description: "", isSelected: false },
      ];
      element.selectedLabelId = undefined;

      element.resetForm();

      // ソート後の先頭ラベルである「あさひ（id: 3）」が選択されること
      expect(element.inputLabelId).toBe(3);
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
    it("6-1. アプリケーションエントリ（index.ts）および登録基盤（webawesome.ts）で wa-select および wa-option が登録されていること", () => {
      const indexPath = new URL("../../index.ts", import.meta.url);
      expect(fs.existsSync(indexPath)).toBe(true);
      const indexContent = fs.readFileSync(indexPath, "utf-8");
      expect(indexContent).toContain("webawesome");

      const webawesomePath = new URL("../../webawesome.ts", import.meta.url);
      expect(fs.existsSync(webawesomePath)).toBe(true);
      const webawesomeContent = fs.readFileSync(webawesomePath, "utf-8");
      expect(webawesomeContent).toContain("components/select/select.js");
      expect(webawesomeContent).toContain("components/option/option.js");
    });
  });

  describe("7. タグセット選択およびタグプレビュー機能", () => {
    it("7-1. テンプレート選択欄の下にタグセット選択欄（wa-select#task-create-tag-set）が配置され、「タグセットなし」および登録済みタグセット一覧が選択肢としてレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      const posTemplate = htmlStr.indexOf('id="task-create-template"');
      const posTagSet = htmlStr.indexOf('id="task-create-tag-set"');

      expect(posTemplate).toBeGreaterThan(-1);
      expect(posTagSet).toBeGreaterThan(posTemplate);
      expect(htmlStr).toContain("タグセットなし");
      expect(htmlStr).toContain("リリース前チェック");
      expect(htmlStr).toContain("定例対応セット");
    });

    it("7-2. タグの個別選択用チェックボックス（wa-checkbox）および削除ボタン付きタグチップ（with-remove）が描画されないこと", () => {
      element.inputTagSetId = 1;
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).not.toContain("wa-checkbox");
      expect(htmlStr).not.toContain("with-remove");
    });

    it("7-3. handleSelectTagSet でタグセットIDを選択・解除（空選択時は undefined）でき、選択中タグセットに含まれるタグがカラー付き wa-tag でプレビュー表示されること", () => {
      element.handleSelectTagSet({
        target: { value: "1" },
      } as unknown as Event);
      expect(element.inputTagSetId).toBe(1);

      const htmlStr = flattenTemplate(element.render());
      const previewStart = htmlStr.indexOf("task-create-dialog__tag-preview");
      expect(previewStart).toBeGreaterThan(-1);
      const previewHtml = htmlStr.slice(previewStart);
      expect(previewHtml).toContain("重要");
      expect(previewHtml).toContain("確認待ち");
      expect(previewHtml).toContain("stepnote-tag--danger");
      expect(previewHtml).toContain("stepnote-tag--purple");
      expect(previewHtml).not.toContain("stepnote-tag--brand");
      expect(previewHtml).not.toContain("定例");

      element.handleSelectTagSet({
        target: { value: "" },
      } as unknown as Event);
      expect(element.inputTagSetId).toBeUndefined();
    });

    it("7-4. タグセット未選択時はタグプレビュー領域が表示されないこと", () => {
      element.inputTagSetId = undefined;
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).not.toContain("task-create-dialog__tag-preview");
    });

    it("7-5. タスク登録（handleSave）実行時、選択中タグセットの tagIds が taskController.createTask に渡されること（未選択時は空配列）", async () => {
      element.inputName = "タグセット付き新規タスク";
      element.inputDueDate = "2026-11-20";
      element.handleSelectTagSet({
        target: { value: "1" },
      } as unknown as Event);

      const result = await element.handleSave();
      expect(result).toBe(true);
      expect(mockTaskController.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "タグセット付き新規タスク",
          tagIds: [10, 30],
        }),
        undefined,
      );

      mockTaskController.createTask.mockClear();
      element.inputName = "タグセットなしタスク";
      element.inputDueDate = "2026-11-20";
      element.handleSelectTagSet({
        target: { value: "" },
      } as unknown as Event);

      await element.handleSave();
      expect(mockTaskController.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "タグセットなしタスク",
          tagIds: [],
        }),
        undefined,
      );
    });

    it("7-6. フォームリセット（resetForm / handleCancel）時に inputTagSetId が undefined に初期化されること", () => {
      element.handleSelectTagSet({
        target: { value: "1" },
      } as unknown as Event);
      expect(element.inputTagSetId).toBe(1);

      element.handleCancel();
      expect(element.inputTagSetId).toBeUndefined();
    });

    it("7-7. SCSS にタグプレビュー用のBEMセレクタおよび stepnote-tag-styles Mixin が適用されており、個別選択用チェックリストのスタイルが存在しないこと", () => {
      const scssPath = new URL("./task-create-dialog.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      expect(scssContent).toContain(".task-create-dialog__tag-preview");
      expect(scssContent).toContain("@include stepnote-tag-styles");
      expect(scssContent).not.toContain(".task-create-dialog__tag-list");
      expect(scssContent).not.toContain(".task-create-dialog__tag-checkbox");
    });
  });

  describe("8. 横並びラベルレイアウトの検証", () => {
    it("8-1. 各入力項目（タスク名・期日・対象年度・ラベル・テンプレート・タグセット）が横並び行（.task-create-dialog__row）と左側ラベル（.task-create-dialog__label）でレンダリングされ、入力要素自体に上配置用の label 属性が付与されていないこと", () => {
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("task-create-dialog__row");
      expect(htmlStr).toContain('for="task-create-name"');
      expect(htmlStr).toContain('for="task-create-due-date"');
      expect(htmlStr).toContain('for="task-create-fiscal-year"');
      expect(htmlStr).toContain('for="task-create-label"');
      expect(htmlStr).toContain('for="task-create-template"');
      expect(htmlStr).toContain('for="task-create-tag-set"');

      // 入力要素自体の上配置 label="..." が除去されていること（wa-dialog のタイトル label は除く）
      expect(htmlStr).not.toMatch(/\slabel="タスク名"/);
      expect(htmlStr).not.toMatch(/\slabel="期日"/);
      expect(htmlStr).not.toMatch(/\slabel="対象年度"/);
      expect(htmlStr).not.toMatch(/\slabel="ラベル"/);
      expect(htmlStr).not.toMatch(/\slabel="テンプレート"/);
      expect(htmlStr).not.toMatch(/\slabel="タグセット"/);
    });

    it("8-2. 必須項目（タスク名・期日）のラベルに必須マーク（.task-create-dialog__required）が表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      const matches = htmlStr.match(/task-create-dialog__required/g) ?? [];
      expect(matches.length).toBe(2);
    });

    it("8-3. SCSS に左ラベル横並びレイアウト用のBEMセレクタ（.task-create-dialog__row / .task-create-dialog__label / .task-create-dialog__required）および grid-template-columns が定義されていること", () => {
      const scssPath = new URL("./task-create-dialog.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      expect(scssContent).toContain(".task-create-dialog__row");
      expect(scssContent).toContain(".task-create-dialog__label");
      expect(scssContent).toContain(".task-create-dialog__required");
      expect(scssContent).toContain("grid-template-columns");
    });

    it("8-4. 入力要素内部（wa-input / datepicker-input）のデフォルト必須アスタリスクおよび内部ラベル領域が SCSS で非表示にされていること", () => {
      const scssPath = new URL("./task-create-dialog.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      expect(scssContent).toContain('--wa-form-control-required-content: ""');
      expect(scssContent).toContain("&::part(form-control-label)");
      expect(scssContent).toContain("display: none;");
    });

    it("8-5. wa-dialog の幅（--width）が横並びラベル表示に適した幅（640px）に拡張されていること", () => {
      const scssPath = new URL("./task-create-dialog.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      expect(scssContent).toContain("--width: 640px;");
    });
  });
});
