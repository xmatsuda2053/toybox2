import * as fs from "node:fs";
import * as path from "node:path";
import * as sass from "sass-embedded";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { TagRecord } from "@/db/models/tag.model";
import type { TagsController } from "@/controllers/tags.controller";
import { SettingsTagsView } from "./settings-tags-view.js";

/**
 * 【SettingsTagsView 仕様 (設定画面 Tags タブ)】
 *
 * 1. タグ一覧表示と基本構造
 *    - 1-1. ルート要素 .settings-tags-view 内に一覧ペイン（.settings-tags-view__master）と詳細ペイン（.settings-tags-view__detail）が描画されること
 *    - 1-2. 新規タグ作成ボタン（#settings-tag-create-btn）および trigger="hover" のツールチップが描画されること
 *    - 1-3. 登録済みタグが wa-tag（pill, variant指定）および説明文とともに一覧表示されること
 *    - 1-4. タグが0件の場合、空状態メッセージが表示されること
 *
 * 2. 新規タグ作成・編集・バリデーション
 *    - 2-1. startNewTag 実行時、フォームが初期状態になり isCreatingNew が true になること
 *    - 2-2. 新規作成状態で handleSave 実行時、tagsController.createTag がタグ名・variant・説明付きで呼び出されること
 *    - 2-3. selectTag で既存タグを選択するとフォームへ値が反映され、handleSave 実行時に tagsController.updateTag が呼び出されること
 *    - 2-4. createTag / updateTag がエラーをスローした場合、errorMessage にエラー内容がセットされ画面へ表示されること
 *    - 2-5. カラー選択セレクト（wa-select / wa-option）が英語色名（10色: Gray / Blue / Green / Yellow / Red / Purple / Pink / Cyan / Orange / Indigo）と各カラーに対応する修飾クラスを持つこと
 *
 * 3. タグ削除確認と関連タスク影響件数表示
 *    - 3-1. requestDeleteTag 実行時、getTagUsageCount で使用中タスク件数を取得し、削除確認ダイアログ（wa-dialog）が開くこと
 *    - 3-2. 削除確認ダイアログにタグ名および使用中タスク件数が表示されること
 *    - 3-3. handleConfirmDelete 実行時、tagsController.deleteTag が呼び出されダイアログが閉じること
 *
 * 4. BEM設計およびSCSSスタイルの検証
 *    - 4-1. settings-tags-view.scss が存在し、主要BEMセレクタが定義されていること
 *    - 4-2. !important および @extend が一切含まれていないこと
 *    - 4-3. ハードコードされたカラーコード（Hex / RGB / HSL）が 0 件であること
 *    - 4-4. カラー選択セレクトおよび選択肢にタグカラーと一致する文字色スタイル（tag-variant-select-styles）が適用されていること
 *    - 4-5. 詳細ペイン（.settings-tags-view__detail）にフォーカスアウトラインが途切れない十分な padding が定義されていること
 *    - 4-6. 描画される wa-tag が appearance="filled" と stepnote-tag クラスを持ち、SCSS に @include stepnote-tag-styles が適用されていること
 *
 * 5. タグ管理／タグセット管理の切り替え
 *    - 5-1. ヘッダ部切り替えUI（.settings-tags-view__mode-switch）で「タグ管理」と「タグセット管理」を切り替えられること
 *    - 5-2. activeSubView が "tagSets" の場合、<settings-tag-sets-view> が描画されること
 */
describe("SettingsTagsView Component", () => {
  let element: SettingsTagsView;
  let mockTagsController: {
    state: TagRecord[];
    createTag: ReturnType<typeof vi.fn>;
    updateTag: ReturnType<typeof vi.fn>;
    deleteTag: ReturnType<typeof vi.fn>;
    getTagUsageCount: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };

  const sampleTags: TagRecord[] = [
    { id: 1, name: "API", description: "バックエンド開発", variant: "brand" },
    { id: 2, name: "緊急", description: "最優先対応", variant: "danger" },
  ];

  beforeEach(() => {
    mockTagsController = {
      state: [...sampleTags],
      createTag: vi.fn().mockResolvedValue(3),
      updateTag: vi.fn().mockResolvedValue(undefined),
      deleteTag: vi.fn().mockResolvedValue(undefined),
      getTagUsageCount: vi.fn().mockResolvedValue(5),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };

    element = new SettingsTagsView();
    element.tagsController = mockTagsController as unknown as TagsController;
  });

  describe("1. タグ一覧表示と基本構造", () => {
    it("1-1. 一覧ペインと詳細ペインが描画されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-tags-view");
      expect(htmlStr).toContain("settings-tags-view__master");
      expect(htmlStr).toContain("settings-tags-view__detail");
    });

    it("1-2. 新規作成ボタンおよび trigger='hover' のツールチップが描画されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-tag-create-btn");
      expect(htmlStr).toContain('trigger="hover"');
    });

    it("1-3. 登録済みタグが wa-tag および説明文とともに一覧表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("<wa-tag");
      expect(htmlStr).toContain("API");
      expect(htmlStr).toContain("バックエンド開発");
      expect(htmlStr).toContain("緊急");
      expect(htmlStr).toMatch(/variant=["']?brand["']?/);
      expect(htmlStr).toMatch(/variant=["']?danger["']?/);
    });

    it("1-4. タグが0件の場合、空状態メッセージが表示されること", () => {
      mockTagsController.state = [];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-tags-view__empty");
    });
  });

  describe("2. 新規タグ作成・編集・バリデーション", () => {
    it("2-1. startNewTag 実行時、フォームが初期化され isCreatingNew が true になること", () => {
      element.selectTag(sampleTags[0]);
      element.startNewTag();

      expect(element.isCreatingNew).toBe(true);
      expect(element.editingTagId).toBeUndefined();
      expect(element.formName).toBe("");
      expect(element.formDescription).toBe("");
      expect(element.formVariant).toBe("neutral");
    });

    it("2-2. 新規作成状態で handleSave 実行時、tagsController.createTag が呼び出されること", async () => {
      element.startNewTag();
      element.formName = "新タグ";
      element.formDescription = "新しい説明";
      element.formVariant = "success";

      await element.handleSave();

      expect(mockTagsController.createTag).toHaveBeenCalledWith({
        name: "新タグ",
        description: "新しい説明",
        variant: "success",
      });
      expect(element.isCreatingNew).toBe(false);
      expect(element.editingTagId).toBe(3);
    });

    it("2-3. selectTag で既存タグを選択し handleSave 実行時、tagsController.updateTag が呼び出されること", async () => {
      element.selectTag(sampleTags[0]);
      expect(element.editingTagId).toBe(1);

      element.formName = "API-v2";
      element.formDescription = "更新済み説明";
      element.formVariant = "warning";

      await element.handleSave();

      expect(mockTagsController.updateTag).toHaveBeenCalledWith(1, {
        name: "API-v2",
        description: "更新済み説明",
        variant: "warning",
      });
    });

    it("2-4. createTag / updateTag がエラーをスローした場合、errorMessage がセットされ表示されること", async () => {
      mockTagsController.createTag.mockRejectedValue(
        new Error("同名のタグ「API」は既に存在します"),
      );
      element.startNewTag();
      element.formName = "API";

      await element.handleSave();

      expect(element.errorMessage).toContain("同名のタグ「API」は既に存在します");
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-tags-view__error");
    });

    it("2-5. カラー選択セレクトが英語色名（10色）と各カラーに対応する修飾クラスを持つこと", () => {
      element.selectTag(sampleTags[0]);
      element.formVariant = "success";
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("settings-tags-view__variant-select");
      expect(htmlStr).toContain("settings-tags-view__variant-select--success");
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
        expect(htmlStr).toContain(`settings-tags-view__variant-option--${variant}`);
        expect(htmlStr).toContain(label);
      }
      expect(htmlStr).not.toContain("成功");
      expect(htmlStr).not.toContain("警告");
      expect(htmlStr).not.toContain("危険");
    });
  });

  describe("3. タグ削除確認と関連タスク影響件数表示", () => {
    it("3-1. requestDeleteTag 実行時、使用中タスク件数を取得して削除確認ダイアログが開くこと", async () => {
      await element.requestDeleteTag(sampleTags[0]);

      expect(mockTagsController.getTagUsageCount).toHaveBeenCalledWith(1);
      expect(element.deletingTag?.id).toBe(1);
      expect(element.deletingUsageCount).toBe(5);
      expect(element.isDeleteDialogOpen).toBe(true);
    });

    it("3-2. 削除確認ダイアログにタグ名および使用中タスク件数が表示されること", async () => {
      await element.requestDeleteTag(sampleTags[1]);
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("wa-dialog");
      expect(htmlStr).toContain("緊急");
      expect(htmlStr).toContain("5");
    });

    it("3-3. handleConfirmDelete 実行時、deleteTag が呼び出されダイアログが閉じること", async () => {
      element.selectTag(sampleTags[0]);
      await element.requestDeleteTag(sampleTags[0]);

      await element.handleConfirmDelete();

      expect(mockTagsController.deleteTag).toHaveBeenCalledWith(1);
      expect(element.isDeleteDialogOpen).toBe(false);
      expect(element.deletingTag).toBeUndefined();
      expect(element.editingTagId).toBeUndefined();
    });
  });

  describe("4. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")),
      "settings-tags-view.scss",
    );

    it("4-1. settings-tags-view.scss が存在し、主要BEMセレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain(".settings-tags-view");
      expect(content).toContain(".settings-tags-view__master");
      expect(content).toContain(".settings-tags-view__detail");
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

    it("4-4. カラー選択セレクトおよび選択肢にタグカラーと一致する文字色スタイル（tag-variant-select-styles）が適用されていること", () => {
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toContain('@include tag-variant-select-styles("settings-tags-view")');
    });

    it("4-5. 詳細ペイン（.settings-tags-view__detail）にフォーカスアウトラインが途切れない十分な padding が定義されていること", () => {
      const compiledCss = sass.compile(scssPath).css;
      expect(compiledCss).toMatch(/\.settings-tags-view__detail\s*\{[^}]*padding:\s*var\(--wa-space-xs/);
    });

    it("4-6. wa-tag が appearance='filled' と stepnote-tag クラスを持ち、SCSS に @include stepnote-tag-styles が適用されていること", () => {
      element.selectTag(sampleTags[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain('appearance="filled"');
      expect(htmlStr).toContain("stepnote-tag--brand");

      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toContain("@include stepnote-tag-styles;");
    });
  });

  describe("5. タグ管理／タグセット管理の切り替え", () => {
    it("5-1. 切り替えUI（.settings-tags-view__mode-switch）で タグ管理 / タグセット管理 が描画され切り替えできること", () => {
      const defaultHtml = flattenTemplate(element.render());
      expect(defaultHtml).toContain("settings-tags-view__mode-switch");
      expect(defaultHtml).toContain("タグ管理");
      expect(defaultHtml).toContain("タグセット管理");
      expect(element.activeSubView).toBe("tags");

      element.setSubView("tagSets");
      expect(element.activeSubView).toBe("tagSets");
    });

    it("5-2. activeSubView が 'tagSets' の場合、<settings-tag-sets-view> が描画されること", () => {
      element.setSubView("tagSets");
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("<settings-tag-sets-view");
      expect(htmlStr).not.toContain("settings-tags-view__master");
    });
  });
});
