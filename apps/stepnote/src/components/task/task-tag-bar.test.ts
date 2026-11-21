import * as fs from "node:fs";
import * as path from "node:path";
import * as sass from "sass-embedded";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { live } from "lit/directives/live.js";
import { flattenTemplate } from "@shared/utils";
import type { TaskRecord } from "@/db/models/task.model";
import type { TagRecord, TagSetRecord } from "@/db/models/tag.model";
import type { TaskController } from "@/controllers/task.controller";
import type { TagsController } from "@/controllers/tags.controller";
import type { TagSetsController } from "@/controllers/tag-sets.controller";
import { TaskTagBar } from "./task-tag-bar.js";

/**
 * 【TaskTagBar 仕様 (タスクペインヘッダーのタグ管理バー)】
 *
 * 1. タグ一覧表示および省略表示 (+N)
 *    - 1-1. タスク未設定またはタグ未付与時でも、追加トリガーボタン（.task-tag-bar__btn-add / tags-solid-fullアイコン）および trigger="hover" の wa-tooltip が描画されること
 *    - 1-2. タスクに付与されたタグが wa-tag（size="s", pill, with-remove, variant指定）として描画されること
 *    - 1-3. visibleTagCount により表示件数が制限された場合、収まらない分が +N 省略ボタン（.task-tag-bar__overflow-btn）として描画されること
 *    - 1-4. +N 省略ボタンに紐づく wa-popover（.task-tag-bar__overflow-popover）が描画され、付与中の全タグ（削除可能）が確認できること
 *    - 1-5. タグ追加トリガーボタン（.task-tag-bar__btn-add）および追加ポップオーバー（.task-tag-bar__add-popover）が、タグ一覧（.task-tag-bar__list）および +N 省略ボタンより左側（先頭）に描画されること
 *
 * 2. タグの付与・解除・新規作成インタラクション
 *    - 2-1. handleRemoveTag 実行時に taskController.removeTag(tagId) が呼び出されること
 *    - 2-2. handleToggleTag 実行時、未付与タグなら taskController.addTag、付与済みタグなら taskController.removeTag が呼び出されること
 *    - 2-3. 新規タグ作成（handleCreateAndAttachTag）実行時、tagsController.createTag でタグ（名前・色variant・説明）を作成し、続けて taskController.addTag でタスクへ付与されること
 *    - 2-4. 新規タグ作成入力（#付き等）が空または既存重複の場合、作成処理が抑止されること
 *    - 2-5. 追加ポップオーバー（.task-tag-bar__add-popover）内に検索入力、既存タグチェックリスト、新規タグ作成UI（色variant選択・説明入力含む）が描画されること
 *    - 2-6. 子要素（wa-select等）からバブリングした wa-after-hide イベントでは入力フォームがリセットされず、popover 自身の wa-after-hide でのみリセットされること
 *    - 2-7. カラー選択セレクト（wa-select / wa-option）が英語色名（10色: Gray / Blue / Green / Yellow / Red / Purple / Pink / Cyan / Orange / Indigo）と各カラーに対応する修飾クラスを持つこと
 *    - 2-8. tagSetsController にタグセットがある場合、ポップオーバー内に「タグセットから一括追加」（.task-tag-bar__tagset-section / __tagset-select / __tagset-apply-btn）が描画されること
 *    - 2-9. handleApplyTagSet 実行時に選択されたタグセットの tagIds で taskController.addTags が呼び出され、選択状態がリセットされるとともにタグ追加ポップオーバーが自動で閉じられること
 *    - 2-10. チェックリストの wa-checkbox が ?checked 属性ではなく live() 付き .checked プロパティでバインドされ、タスク切替時に現在タスクの tagIds と一致する状態になること
 *
 * 3. BEM設計およびSCSSスタイルの検証
 *    - 3-1. SCSSスタイルシート（task-tag-bar.scss）が存在し、.task-tag-bar および主要BEMセレクタが定義されていること
 *    - 3-2. テーマ切替トランジション（theme-transition または --stepnote-transition-theme）が定義されていること
 *    - 3-3. !important および @extend が一切含まれていないこと
 *    - 3-4. ハードコードされたカラーコード（Hex / RGB / HSL）が 0 件であること
 *    - 3-5. カラー選択セレクトおよび選択肢にタグカラーと一致する文字色スタイル（tag-variant-select-styles）が適用されていること
 *    - 3-6. タグ追加ポップオーバーおよび新規作成欄（.task-tag-bar__popover-body / __create-section / __create-row）に十分な余白（--wa-space-s 等）が確保されていること
 *    - 3-7. ポップオーバー内チェックリストの wa-checkbox（.task-tag-bar__checkbox）でチェックボックスとタグが縦方向中央揃えになっていること
 *    - 3-8. 描画される wa-tag が appearance="filled" と stepnote-tag クラスを持ち、SCSS に @include stepnote-tag-styles が適用されていること
 *    - 3-9. タスクパネルのタグチップ（.task-tag-bar__tag / .task-tag-bar__measure-item）および +N ボタンがヘッダー内ボタン（28px）に収まるコンパクトな高さ（22px）で定義されていること
 *    - 3-10. タグ追加ボタンアイコン（.task-tag-bar__btn-add-icon）が視覚サイズ調整用の font-size（1.35em）で定義されていること
 */
describe("TaskTagBar Component", () => {
  let element: TaskTagBar;
  let mockTaskController: {
    state: TaskRecord | undefined;
    addTag: ReturnType<typeof vi.fn>;
    addTags: ReturnType<typeof vi.fn>;
    removeTag: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let mockTagsController: {
    state: TagRecord[];
    createTag: ReturnType<typeof vi.fn>;
    getTagsByIds: ReturnType<typeof vi.fn>;
    findByName: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let mockTagSetsController: {
    state: TagSetRecord[];
    getTagSetById: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };

  const sampleTags: TagRecord[] = [
    { id: 1, name: "API", description: "バックエンド", variant: "brand" },
    { id: 2, name: "緊急", description: "最優先対応", variant: "danger" },
    { id: 3, name: "設計", description: "仕様検討", variant: "success" },
  ];

  const sampleTagSets: TagSetRecord[] = [
    { id: 100, name: "初期セット", description: "基本構成", tagIds: [1, 3] },
  ];

  const baseTask: TaskRecord = {
    id: 101,
    name: "テストタスク",
    statusCode: 0,
    dueDate: new Date("2026-06-15"),
    contacts: [],
    description: "",
    fiscalYear: 2026,
    labelId: 1,
    bookmark: false,
    selected: true,
    tagIds: [1, 2],
  };

  beforeEach(() => {
    mockTaskController = {
      state: { ...baseTask },
      addTag: vi.fn().mockResolvedValue(undefined),
      addTags: vi.fn().mockResolvedValue(undefined),
      removeTag: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };

    mockTagsController = {
      state: [...sampleTags],
      createTag: vi.fn().mockResolvedValue(4),
      getTagsByIds: vi.fn((ids?: readonly number[]) => {
        if (!ids) return [];
        return ids
          .map((id) => sampleTags.find((t) => t.id === id))
          .filter((t): t is TagRecord => Boolean(t));
      }),
      findByName: vi.fn((name: string) =>
        sampleTags.find(
          (t) => t.name.toLowerCase() === name.trim().replace(/^#+/, "").toLowerCase(),
        ),
      ),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };

    mockTagSetsController = {
      state: [...sampleTagSets],
      getTagSetById: vi.fn((id: number) => sampleTagSets.find((s) => s.id === id)),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };

    element = new TaskTagBar();
    element.taskController = mockTaskController as unknown as TaskController;
    element.tagsController = mockTagsController as unknown as TagsController;
    element.tagSetsController =
      mockTagSetsController as unknown as TagSetsController;
  });

  describe("1. タグ一覧表示および省略表示 (+N)", () => {
    it("1-1. タグ未付与時でも、追加トリガーボタンと trigger='hover' のツールチップが描画されること", () => {
      mockTaskController.state = { ...baseTask, tagIds: [] };
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-tag-bar__btn-add");
      expect(htmlStr).toContain('name="tags-solid-full"');
      expect(htmlStr).not.toContain('name="tag-solid-full"');
      expect(htmlStr).toContain('trigger="hover"');
      expect(htmlStr).not.toContain("task-tag-bar__overflow-btn");
    });

    it("1-2. 付与されたタグが wa-tag（pill, with-remove, variant指定）として描画されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("<wa-tag");
      expect(htmlStr).toContain("with-remove");
      expect(htmlStr).toContain("pill");
      expect(htmlStr).toContain("API");
      expect(htmlStr).toContain("緊急");
      expect(htmlStr).toMatch(/variant=["']?brand["']?/);
      expect(htmlStr).toMatch(/variant=["']?danger["']?/);
    });

    it("1-3. visibleTagCount により表示件数が制限された場合、+N 省略ボタンが描画されること", () => {
      mockTaskController.state = { ...baseTask, tagIds: [1, 2, 3] };
      element.visibleTagCount = 1;

      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-tag-bar__overflow-btn");
      expect(htmlStr).toContain("+2");
    });

    it("1-4. +N 省略ボタンに紐づく wa-popover 内に付与中の全タグが表示されること", () => {
      mockTaskController.state = { ...baseTask, tagIds: [1, 2, 3] };
      element.visibleTagCount = 1;

      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-tag-bar__overflow-popover");
      expect(htmlStr).toContain("API");
      expect(htmlStr).toContain("緊急");
      expect(htmlStr).toContain("設計");
    });

    it("1-5. タグ追加トリガーボタンと追加ポップオーバーが、タグ一覧（.task-tag-bar__list）および +N 省略ボタンより左側（先頭）に描画されること", () => {
      mockTaskController.state = { ...baseTask, tagIds: [1, 2, 3] };
      element.visibleTagCount = 1;

      const htmlStr = flattenTemplate(element.render());
      const addBtnIndex = htmlStr.indexOf("task-tag-bar__btn-add");
      const addPopoverIndex = htmlStr.indexOf("task-tag-bar__add-popover");
      const listIndex = htmlStr.indexOf("task-tag-bar__list");
      const overflowBtnIndex = htmlStr.indexOf("task-tag-bar__overflow-btn");

      expect(addBtnIndex).toBeGreaterThan(-1);
      expect(addPopoverIndex).toBeGreaterThan(-1);
      expect(listIndex).toBeGreaterThan(-1);
      expect(overflowBtnIndex).toBeGreaterThan(-1);
      expect(addBtnIndex).toBeLessThan(listIndex);
      expect(addPopoverIndex).toBeLessThan(listIndex);
      expect(listIndex).toBeLessThan(overflowBtnIndex);
    });
  });

  describe("2. タグの付与・解除・新規作成インタラクション", () => {
    it("2-1. handleRemoveTag 実行時に taskController.removeTag(tagId) が呼び出されること", async () => {
      await element.handleRemoveTag(2);
      expect(mockTaskController.removeTag).toHaveBeenCalledTimes(1);
      expect(mockTaskController.removeTag).toHaveBeenCalledWith(2);
    });

    it("2-2. handleToggleTag 実行時、未付与タグなら addTag、付与済みタグなら removeTag が呼び出されること", async () => {
      await element.handleToggleTag(3);
      expect(mockTaskController.addTag).toHaveBeenCalledWith(3);

      await element.handleToggleTag(1);
      expect(mockTaskController.removeTag).toHaveBeenCalledWith(1);
    });

    it("2-3. 新規タグ作成（handleCreateAndAttachTag）で createTag と addTag が連続して呼ばれること", async () => {
      element.searchKeyword = "新規ラベル";
      element.newTagVariant = "warning";
      element.newTagDescription = "詳細メモ";

      await element.handleCreateAndAttachTag();

      expect(mockTagsController.createTag).toHaveBeenCalledWith({
        name: "新規ラベル",
        variant: "warning",
        description: "詳細メモ",
      });
      expect(mockTaskController.addTag).toHaveBeenCalledWith(4);
      expect(element.searchKeyword).toBe("");
      expect(element.newTagDescription).toBe("");
    });

    it("2-4. 新規タグ作成入力が空または既存タグと重複する場合は作成処理が抑止されること", async () => {
      element.searchKeyword = "   ";
      await element.handleCreateAndAttachTag();
      expect(mockTagsController.createTag).not.toHaveBeenCalled();

      element.searchKeyword = "api";
      await element.handleCreateAndAttachTag();
      expect(mockTagsController.createTag).not.toHaveBeenCalled();
    });

    it("2-5. 追加ポップオーバー内に検索入力・既存タグリスト・新規作成UI（色variant選択含む）が描画されること", () => {
      element.searchKeyword = "";
      const defaultHtml = flattenTemplate(element.render());
      expect(defaultHtml).toContain("task-tag-bar__add-popover");
      expect(defaultHtml).toContain("task-tag-bar__search-input");
      expect(defaultHtml).toContain("wa-checkbox");

      element.searchKeyword = "新規候補";
      const createHtml = flattenTemplate(element.render());
      expect(createHtml).toContain("task-tag-bar__create-section");
      expect(createHtml).toContain("task-tag-bar__variant-select");
    });

    it("2-6. 子要素（wa-select等）からバブリングした wa-after-hide イベントでは入力フォームがリセットされず、popover 自身の wa-after-hide でのみリセットされること", () => {
      element.searchKeyword = "新規候補";
      element.newTagVariant = "brand";
      element.newTagDescription = "テスト説明";

      const handler = (
        element as unknown as {
          handleAddPopoverAfterHide?: (e: Event) => void;
        }
      ).handleAddPopoverAfterHide;
      expect(typeof handler).toBe("function");

      // 子要素（target !== currentTarget）からのバブリングは無視されること
      const popoverTarget = {} as EventTarget;
      const selectTarget = {} as EventTarget;
      handler?.({
        target: selectTarget,
        currentTarget: popoverTarget,
      } as unknown as Event);

      expect(element.searchKeyword).toBe("新規候補");
      expect(element.newTagVariant).toBe("brand");
      expect(element.newTagDescription).toBe("テスト説明");

      // popover 自身（target === currentTarget）の wa-after-hide ではリセットされること
      handler?.({
        target: popoverTarget,
        currentTarget: popoverTarget,
      } as unknown as Event);

      expect(element.searchKeyword).toBe("");
      expect(element.newTagVariant).toBe("neutral");
      expect(element.newTagDescription).toBe("");
    });

    it("2-7. カラー選択セレクトが英語色名（10色）と各カラーに対応する修飾クラスを持つこと", () => {
      element.searchKeyword = "新規候補";
      element.newTagVariant = "brand";
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("task-tag-bar__variant-select--brand");
      for (const [variant, label] of [
        ["neutral", "Gray"],
        ["brand", "Blue"],
        ["success", "Green"],
        ["warning", "Yellow"],
        ["danger", "Red"],
        ["purple", "Purple"],
        ["pink", "Pink"],
        ["cyan", "Cyan"],
        ["orange", "Orange"],
        ["indigo", "Indigo"],
      ] as const) {
        expect(htmlStr).toContain(`task-tag-bar__variant-option--${variant}`);
        expect(htmlStr).toContain(label);
      }
      expect(htmlStr).not.toContain("成功");
      expect(htmlStr).not.toContain("警告");
      expect(htmlStr).not.toContain("危険");
    });

    it("2-8. tagSetsController にタグセットがある場合、ポップオーバー内にタグセット選択・適用UIが描画されること", () => {
      const htmlWithSets = flattenTemplate(element.render());
      expect(htmlWithSets).toContain("task-tag-bar__tagset-section");
      expect(htmlWithSets).toContain("task-tag-bar__tagset-select");
      expect(htmlWithSets).toContain("task-tag-bar__tagset-apply-btn");
      expect(htmlWithSets).toContain("初期セット");

      mockTagSetsController.state = [];
      const htmlWithoutSets = flattenTemplate(element.render());
      expect(htmlWithoutSets).not.toContain("task-tag-bar__tagset-section");
    });

    it("2-9. handleApplyTagSet 実行時に選択タグセットの tagIds で addTags が呼ばれ、選択状態がリセットされポップオーバーが自動で閉じられること", async () => {
      const mockHide = vi.fn();
      const mockPopover = { open: true, hide: mockHide };
      Object.defineProperty(element, "renderRoot", {
        configurable: true,
        value: {
          querySelector: vi.fn((selector: string) =>
            selector === ".task-tag-bar__add-popover" ? mockPopover : null,
          ),
        },
      });

      element.selectedTagSetId = "100";
      await element.handleApplyTagSet();

      expect(mockTaskController.addTags).toHaveBeenCalledWith([1, 3]);
      expect(element.selectedTagSetId).toBe("");
      expect(mockHide).toHaveBeenCalledTimes(1);
    });

    it("2-10. チェックリストの wa-checkbox が ?checked 属性ではなく live() 付き .checked プロパティでバインドされ、タスク切替時に現在タスクの tagIds と一致する状態になること", () => {
      const collectCheckboxCheckedBindings = (
        node: unknown,
      ): Array<{ bindingPrefix: string; value: unknown }> => {
        if (Array.isArray(node)) {
          return node.flatMap(collectCheckboxCheckedBindings);
        }
        if (
          typeof node !== "object" ||
          node === null ||
          !("strings" in node) ||
          !Array.isArray((node as { strings: unknown }).strings)
        ) {
          return [];
        }
        const tpl = node as { strings: readonly string[]; values?: readonly unknown[] };
        const results: Array<{ bindingPrefix: string; value: unknown }> = [];
        tpl.strings.forEach((str, idx) => {
          const val = tpl.values?.[idx];
          if (str.includes("<wa-checkbox") && /([.?])checked=$/.test(str)) {
            const match = str.match(/([.?]checked=)$/);
            results.push({ bindingPrefix: match?.[1] ?? "", value: val });
          }
          if (val !== undefined) {
            results.push(...collectCheckboxCheckedBindings(val));
          }
        });
        return results;
      };

      const taskABindings = collectCheckboxCheckedBindings(element.render());
      expect(taskABindings).toEqual([
        { bindingPrefix: ".checked=", value: live(true) },
        { bindingPrefix: ".checked=", value: live(true) },
        { bindingPrefix: ".checked=", value: live(false) },
      ]);

      mockTaskController.state = { ...baseTask, id: 102, tagIds: [] };
      const taskBBindings = collectCheckboxCheckedBindings(element.render());
      expect(taskBBindings).toEqual([
        { bindingPrefix: ".checked=", value: live(false) },
        { bindingPrefix: ".checked=", value: live(false) },
        { bindingPrefix: ".checked=", value: live(false) },
      ]);
    });
  });

  describe("3. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")),
      "task-tag-bar.scss",
    );

    it("3-1. SCSSスタイルシート（task-tag-bar.scss）が存在し、主要BEMセレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain(".task-tag-bar");
      expect(content).toContain(".task-tag-bar__list");
      expect(content).toContain(".task-tag-bar__btn-add");
    });

    it("3-2. テーマ切替トランジションが定義されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(/var\(--stepnote-transition-theme\)|@include\s+theme-transition/);
    });

    it("3-3. !important および @extend が一切含まれていないこと", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toContain("!important");
      expect(content).not.toContain("@extend");
    });

    it("3-4. ハードコードされたカラーコード（Hex / RGB / HSL）が 0 件であること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      const matches = content.match(/(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\))/g);
      expect(matches).toBeNull();
    });

    it("3-5. カラー選択セレクトおよび選択肢にタグカラーと一致する文字色スタイル（tag-variant-select-styles）が適用されていること", () => {
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toContain('@include tag-variant-select-styles("task-tag-bar")');

      const mixinsPath = path.resolve(path.dirname(scssPath), "../../styles/mixins.scss");
      const mixinsContent = fs.readFileSync(mixinsPath, "utf-8");
      expect(mixinsContent).toContain("@mixin tag-variant-select-styles");
      for (const variant of [
        "neutral",
        "brand",
        "success",
        "warning",
        "danger",
        "purple",
        "pink",
        "cyan",
        "orange",
        "indigo",
      ]) {
        expect(mixinsContent).toContain(`--stepnote-tag-${variant}-color`);
      }
    });

    it("3-6. タグ追加ポップオーバーおよび新規作成欄（__popover-body / __create-section / __create-row）に十分な余白が確保されていること", () => {
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toMatch(/\.task-tag-bar__popover-body\s*\{[^}]*gap:\s*var\(--wa-space-s/);
      expect(scssContent).toMatch(/\.task-tag-bar__create-section\s*\{[^}]*gap:\s*var\(--wa-space-s/);
      expect(scssContent).toMatch(/\.task-tag-bar__create-section\s*\{[^}]*padding-top:\s*var\(--wa-space-s/);
      expect(scssContent).toMatch(/\.task-tag-bar__create-row\s*\{[^}]*gap:\s*var\(--wa-space-s/);
    });

    it("3-7. チェックリストの wa-checkbox（.task-tag-bar__checkbox）でチェックボックスとタグが縦方向中央揃えになっていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-tag-bar__checkbox");

      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toContain(".task-tag-bar__checkbox");
      expect(scssContent).toContain("@include checkbox-center-alignment;");

      const compiledCss = sass.compile(scssPath).css;
      expect(compiledCss).toMatch(
        /\.task-tag-bar__checkbox::part\(base\)\s*\{[^}]*align-items:\s*center/,
      );
      expect(compiledCss).toMatch(
        /\.task-tag-bar__checkbox::part\(label\)\s*\{[^}]*display:\s*inline-flex/,
      );
      expect(compiledCss).toMatch(
        /\.task-tag-bar__checkbox::part\(label\)\s*\{[^}]*align-items:\s*center/,
      );
    });

    it("3-8. wa-tag が appearance='filled' と stepnote-tag クラスを持ち、SCSS に @include stepnote-tag-styles が適用されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain('appearance="filled"');
      expect(htmlStr).toContain("stepnote-tag--brand");

      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toContain("@include stepnote-tag-styles;");
    });

    it("3-9. タグチップ（.task-tag-bar__tag / __measure-item）および +N ボタンがコンパクトな高さ（22px）で定義されていること", () => {
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toMatch(
        /\.task-tag-bar__tag,\s*\.task-tag-bar__measure-item\s*\{[^}]*height:\s*22px;/,
      );
      expect(scssContent).toMatch(
        /\.task-tag-bar__tag,\s*\.task-tag-bar__measure-item\s*\{[^}]*line-height:\s*1;/,
      );
      expect(scssContent).toMatch(
        /\.task-tag-bar__overflow-btn[\s\S]*?&::part\(button\)\s*\{[^}]*height:\s*22px;/,
      );
    });

    it("3-10. タグ追加ボタンアイコン（.task-tag-bar__btn-add-icon）が視覚サイズ調整用の font-size で定義されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-tag-bar__btn-add-icon");

      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toMatch(
        /\.task-tag-bar__btn-add-icon\s*\{[^}]*font-size:\s*1\.35em;/,
      );
    });
  });
});
