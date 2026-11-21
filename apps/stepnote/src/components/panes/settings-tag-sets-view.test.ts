import * as fs from "node:fs";
import * as path from "node:path";
import * as sass from "sass-embedded";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { live } from "lit/directives/live.js";
import { flattenTemplate } from "@shared/utils";
import type { TagRecord, TagSetRecord } from "@/db/models/tag.model";
import type { TagsController } from "@/controllers/tags.controller";
import type { TagSetsController } from "@/controllers/tag-sets.controller";
import { SettingsTagSetsView } from "./settings-tag-sets-view.js";

/**
 * 【SettingsTagSetsView 仕様 (設定画面 Tags タブ内 タグセット管理ビュー)】
 *
 * 1. タグセット一覧表示と基本構造
 *    - 1-1. .settings-tag-sets-view 内に一覧ペイン（__master）と詳細ペイン（__detail）、新規作成ボタン（#settings-tagset-create-btn / trigger="hover" tooltip）が描画されること
 *    - 1-2. 登録済みタグセットがセット名・説明・含まれるタグプレビューとともに一覧表示されること
 *    - 1-3. タグセットが0件の場合、空状態メッセージが表示されること
 *
 * 2. 新規作成・編集・タグ選択・バリデーション
 *    - 2-1. startNewTagSet 実行時、フォームが初期状態になり isCreatingNew が true になること
 *    - 2-2. toggleFormTag 実行時、formTagIds へ対象タグIDが追加・解除されること
 *    - 2-3. 新規作成状態で handleSave 実行時、tagSetsController.createTagSet が呼び出されること
 *    - 2-4. selectTagSet で既存セットを選択し handleSave 実行時、tagSetsController.updateTagSet が呼び出されること
 *    - 2-5. createTagSet / updateTagSet がエラーをスローした場合、errorMessage がセットされ画面へ表示されること
 *    - 2-6. タグ選択の wa-checkbox が ?checked 属性ではなく live() 付き .checked プロパティでバインドされ、連続作成時に全チェックが解除されること
 *
 * 3. タグセット削除確認ダイアログ
 *    - 3-1. requestDeleteTagSet 実行時、削除確認ダイアログ（wa-dialog）が開き対象セット名が表示されること
 *    - 3-2. handleConfirmDelete 実行時、tagSetsController.deleteTagSet が呼び出されダイアログが閉じること
 *
 * 4. BEM設計およびSCSSスタイルの検証
 *    - 4-1. settings-tag-sets-view.scss が存在し、主要BEMセレクタが定義されていること
 *    - 4-2. !important および @extend が一切含まれていないこと
 *    - 4-3. ハードコードされたカラーコード（Hex / RGB / HSL）が 0 件であること
 *    - 4-4. 詳細ペイン（.settings-tag-sets-view__detail）にフォーカスアウトラインが途切れない十分な padding が定義されていること
 *    - 4-5. wa-tag が appearance="filled" と stepnote-tag クラスを持ち、SCSS に @include stepnote-tag-styles が適用されていること
 */
describe("SettingsTagSetsView Component", () => {
  let element: SettingsTagSetsView;
  let mockTagsController: {
    state: TagRecord[];
    getTagsByIds: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let mockTagSetsController: {
    state: TagSetRecord[];
    createTagSet: ReturnType<typeof vi.fn>;
    updateTagSet: ReturnType<typeof vi.fn>;
    deleteTagSet: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };

  const sampleTags: TagRecord[] = [
    { id: 1, name: "API", description: "バックエンド", variant: "brand" },
    { id: 2, name: "緊急", description: "最優先", variant: "danger" },
    { id: 3, name: "UI", description: "フロント", variant: "success" },
  ];

  const sampleTagSets: TagSetRecord[] = [
    { id: 10, name: "緊急リリース", description: "本番対応一式", tagIds: [1, 2] },
    { id: 20, name: "UIレビュー", description: "", tagIds: [3] },
  ];

  beforeEach(() => {
    mockTagsController = {
      state: [...sampleTags],
      getTagsByIds: vi.fn((ids?: readonly number[]) =>
        sampleTags.filter((t) => t.id !== undefined && ids?.includes(t.id)),
      ),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };
    mockTagSetsController = {
      state: [...sampleTagSets],
      createTagSet: vi.fn().mockResolvedValue(30),
      updateTagSet: vi.fn().mockResolvedValue(undefined),
      deleteTagSet: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };

    element = new SettingsTagSetsView();
    element.tagsController = mockTagsController as unknown as TagsController;
    element.tagSetsController =
      mockTagSetsController as unknown as TagSetsController;
  });

  describe("1. タグセット一覧表示と基本構造", () => {
    it("1-1. 一覧ペイン・詳細ペイン・新規作成ボタン（hover tooltip付）が描画されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-tag-sets-view");
      expect(htmlStr).toContain("settings-tag-sets-view__master");
      expect(htmlStr).toContain("settings-tag-sets-view__detail");
      expect(htmlStr).toContain("settings-tagset-create-btn");
      expect(htmlStr).toContain('trigger="hover"');
    });

    it("1-2. 登録済みタグセットがセット名・説明・含まれるタグプレビューとともに表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("緊急リリース");
      expect(htmlStr).toContain("本番対応一式");
      expect(htmlStr).toContain("UIレビュー");
      expect(htmlStr).toContain("API");
      expect(htmlStr).toContain("緊急");
    });

    it("1-3. タグセットが0件の場合、空状態メッセージが表示されること", () => {
      mockTagSetsController.state = [];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-tag-sets-view__empty");
    });
  });

  describe("2. 新規作成・編集・タグ選択・バリデーション", () => {
    it("2-1. startNewTagSet 実行時、フォームが初期状態になり isCreatingNew が true になること", () => {
      element.selectTagSet(sampleTagSets[0]);
      element.startNewTagSet();

      expect(element.isCreatingNew).toBe(true);
      expect(element.editingTagSetId).toBeUndefined();
      expect(element.formName).toBe("");
      expect(element.formDescription).toBe("");
      expect(element.formTagIds).toEqual([]);
    });

    it("2-2. toggleFormTag 実行時、formTagIds へ対象タグIDが追加・解除されること", () => {
      element.startNewTagSet();
      element.toggleFormTag(1);
      element.toggleFormTag(2);
      expect(element.formTagIds).toEqual([1, 2]);

      element.toggleFormTag(1);
      expect(element.formTagIds).toEqual([2]);
    });

    it("2-3. 新規作成状態で handleSave 実行時、tagSetsController.createTagSet が呼び出されること", async () => {
      element.startNewTagSet();
      element.formName = "新セット";
      element.formDescription = "検証用";
      element.formTagIds = [1, 3];

      await element.handleSave();

      expect(mockTagSetsController.createTagSet).toHaveBeenCalledWith({
        name: "新セット",
        description: "検証用",
        tagIds: [1, 3],
      });
      expect(element.isCreatingNew).toBe(false);
      expect(element.editingTagSetId).toBe(30);
    });

    it("2-4. selectTagSet で既存セットを選択し handleSave 実行時、tagSetsController.updateTagSet が呼び出されること", async () => {
      element.selectTagSet(sampleTagSets[0]);
      expect(element.editingTagSetId).toBe(10);

      element.formName = "緊急リリースv2";
      element.formDescription = "更新説明";
      element.formTagIds = [2, 3];

      await element.handleSave();

      expect(mockTagSetsController.updateTagSet).toHaveBeenCalledWith(10, {
        name: "緊急リリースv2",
        description: "更新説明",
        tagIds: [2, 3],
      });
    });

    it("2-5. createTagSet / updateTagSet がエラーをスローした場合、errorMessage がセットされ表示されること", async () => {
      mockTagSetsController.createTagSet.mockRejectedValue(
        new Error("同名のタグセット「緊急リリース」は既に存在します"),
      );
      element.startNewTagSet();
      element.formName = "緊急リリース";

      await element.handleSave();

      expect(element.errorMessage).toContain(
        "同名のタグセット「緊急リリース」は既に存在します",
      );
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-tag-sets-view__error");
    });

    it("2-6. タグ選択の wa-checkbox が ?checked 属性ではなく live() 付き .checked プロパティでバインドされ、連続作成時に全チェックが解除されること", async () => {
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

      element.startNewTagSet();
      element.formName = "セット1";
      element.toggleFormTag(1);
      element.toggleFormTag(2);

      const firstCreateBindings = collectCheckboxCheckedBindings(element.render());
      expect(firstCreateBindings).toEqual([
        { bindingPrefix: ".checked=", value: live(true) },
        { bindingPrefix: ".checked=", value: live(true) },
        { bindingPrefix: ".checked=", value: live(false) },
      ]);

      await element.handleSave();
      element.startNewTagSet();

      const secondCreateBindings = collectCheckboxCheckedBindings(element.render());
      expect(secondCreateBindings).toEqual([
        { bindingPrefix: ".checked=", value: live(false) },
        { bindingPrefix: ".checked=", value: live(false) },
        { bindingPrefix: ".checked=", value: live(false) },
      ]);
    });
  });

  describe("3. タグセット削除確認ダイアログ", () => {
    it("3-1. requestDeleteTagSet 実行時、削除確認ダイアログが開き対象セット名が表示されること", () => {
      element.requestDeleteTagSet(sampleTagSets[0]);
      expect(element.deletingTagSet?.id).toBe(10);
      expect(element.isDeleteDialogOpen).toBe(true);

      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("wa-dialog");
      expect(htmlStr).toContain("緊急リリース");
    });

    it("3-2. handleConfirmDelete 実行時、deleteTagSet が呼び出されダイアログが閉じること", async () => {
      element.selectTagSet(sampleTagSets[0]);
      element.requestDeleteTagSet(sampleTagSets[0]);

      await element.handleConfirmDelete();

      expect(mockTagSetsController.deleteTagSet).toHaveBeenCalledWith(10);
      expect(element.isDeleteDialogOpen).toBe(false);
      expect(element.deletingTagSet).toBeUndefined();
      expect(element.editingTagSetId).toBeUndefined();
    });
  });

  describe("4. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")),
      "settings-tag-sets-view.scss",
    );

    it("4-1. settings-tag-sets-view.scss が存在し、主要BEMセレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain(".settings-tag-sets-view");
      expect(content).toContain(".settings-tag-sets-view__master");
      expect(content).toContain(".settings-tag-sets-view__detail");
    });

    it("4-2. !important および @extend が一切含まれていないこと", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toContain("!important");
      expect(content).not.toContain("@extend");
    });

    it("4-3. ハードコードされたカラーコード（Hex / RGB / HSL）が 0 件であること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      const matches = content.match(/(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\))/g);
      expect(matches).toBeNull();
    });

    it("4-4. 詳細ペイン（.settings-tag-sets-view__detail）にフォーカスアウトラインが途切れない十分な padding が定義されていること", () => {
      const compiledCss = sass.compile(scssPath).css;
      expect(compiledCss).toMatch(/\.settings-tag-sets-view__detail\s*\{[^}]*padding:\s*var\(--wa-space-xs/);
    });

    it("4-5. wa-tag が appearance='filled' と stepnote-tag クラスを持ち、SCSS に @include stepnote-tag-styles が適用されていること", () => {
      element.startNewTagSet();
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain('appearance="filled"');
      expect(htmlStr).toContain("stepnote-tag--brand");

      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain("@include stepnote-tag-styles;");
    });
  });
});
