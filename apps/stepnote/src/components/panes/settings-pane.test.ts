import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { SettingsPane } from "./settings-pane.js";
import type { TaskTemplateRecord } from "@/db/models/template.model.js";

/**
 * 【SettingsPane 仕様 (全画面設定モード専用ペイン)】
 *
 * 1. ペイン基本構造とヘッダー描画
 *    - 1-1. ルート要素 .settings-pane がレンダリングされること
 *    - 1-2. ヘッダー部 (.settings-pane__header) が存在し、タイトルとして「SETTINGS」(.settings-pane__title) が表示されること
 *
 * 2. タブグループとテンプレートタブの描画
 *    - 2-1. コンテンツ領域 (.settings-pane__content) 内に placement="start" が指定された wa-tab-group がレンダリングされること
 *    - 2-2. panel="templates"（Templates）の wa-tab および wa-tab-panel がレンダリングされること
 *    - 2-3. 旧ダミータブ（general, appearance）が存在しないこと
 *
 * 3. テンプレート管理マスター・ディテール機能
 *    - 3-1. テンプレート一覧（.settings-pane__master）およびアイコンのみの新規作成ボタン（plus-solid-full）がレンダリングされること
 *    - 3-2. テンプレート選択時、ディテール領域（.settings-pane__detail）に名称入力欄・概要エディタ・Issueリスト・保存ボタンが表示されること
 *    - 3-3. テンプレートアイテム内にハンバーガーアイコン付きドロップダウン（wa-dropdown）がレンダリングされ、アイコン付き（copy-solid-full, trash-solid-full）の複製・削除項目が存在すること
 *    - 3-4. ドロップダウンメニュー選択（handleMenuSelect）で複製および削除が呼び出されること
 *    - 3-5. Issue追加ボタンで初期値「### New Issue」を持つIssue項目が追加され、並び替えボタン（↑↓）で順序が入れ替わること
 *    - 3-6. master-list 内に labelsライクなリストアイテム（.settings-pane__master-item）がレンダリングされること
 *    - 3-7. 選択中のテンプレートアイテムに .settings-pane__master-item--selected クラスが付与されること
 *    - 3-8. テンプレートアイテムのキーボード操作（Enter/Space）で選択が行われること
 *    - 3-9. ディテール領域の概要入力部に二重ラベル（「タスク概要（Markdown）」）が存在しないこと
 *    - 3-10. Issue追加ボタン（.settings-pane__btn-add-issue）がアイコンのみ（plus-solid-full）で描画され、ツールチップが付属すること
 *    - 3-11. Issueエリアが左右（.settings-pane__issue-master と .settings-pane__issue-detail）に分割され、右側に Markdownエディタが配置されること
 *    - 3-12. Issueリストアイテム内にハンバーガーメニューがあり、上へ移動（angle-up-solid-full）、下へ移動（angle-down-solid-full）、削除（trash-solid-full）が存在すること
 *    - 3-13. 自然なラベル名「タスク期日からの日数」がレンダリングされ、旧表記「相対期限」が存在しないこと
 *    - 3-14. Issueアイテムの選択切り替えで右側の編集対象が切り替わること
 *    - 3-15. テンプレート保存ボタン（.settings-pane__btn-save）がテンプレート名入力欄の右隣（.settings-pane__name-row）に配置され、テンプレート名にlabel="テンプレート名"が設定され、旧ヘッダー（.settings-pane__detail-header）が存在しないこと
 *    - 3-16. Issueリストの各アイテムタイトルからMarkdown見出し記号（#）が除外されて表示されること
 *    - 3-17. テンプレート編集後に未保存の変更がある場合、保存ボタンがアクセント（variant="brand" appearance="accent"）されアイコンにアニメーション（animation="shake"）が設定されること
 *    - 3-18. テンプレート名入力・保存ボタン行（.settings-pane__name-row）と分離されたスクロール可能なフォームボディ（.settings-pane__form-body）がレンダリングされること
 *
 * 4. BEM設計およびSCSSスタイルの検証
 *    - 4-1. SCSSスタイルシート (settings-pane.scss) が存在し、ルートブロック .settings-pane および主要セレクタが定義されていること
 *    - 4-2. settings-pane.scss に !important 宣言が一切含まれていないこと
 *    - 4-3. settings-pane.scss に @extend が一切含まれていないこと
 *    - 4-4. settings-pane.scss 全体においてハードコードされたカラーコード（Hex / RGB / RGBA）が 0 件であること
 *    - 4-5. .settings-pane__master-header がリストアイテムと右端位置を揃えるための余白定義（padding-right / padding-inline）を持つこと
 *    - 4-6. .settings-pane__tab-panel[active] の内部スロット（::part(base)）に高さ伝播・スクロール可能とするスタイル（height: 100%）が定義されていること
 *    - 4-7. .settings-pane__master-list がスクロールバーとアイテム間の圧迫感を防ぐ余白定義（padding-inline-end または padding-right）および scrollbar-gutter: stable を持つこと
 *    - 4-8. .settings-pane__form-name にWeb Awesome公式サンプルに準拠したラベル左配置スタイル（gridまたはflexおよび::part(form-control-label)）が定義されていること
 *    - 4-9. .settings-pane__btn-save 内の wa-icon にワンサイズ大きいフォントサイズ（--wa-font-size-l）が指定されていること
 *    - 4-10. .settings-pane__form-body にスクロール定義（overflow-y: auto）およびスクロールバー余白が指定され、.settings-pane__name-row が固定（flex-shrink: 0）されていること
 */
describe("SettingsPane Component", () => {
  let element: SettingsPane;
  let mockController: {
    state: TaskTemplateRecord[];
    selectedTemplateId?: number;
    createTemplate: ReturnType<typeof vi.fn>;
    updateTemplate: ReturnType<typeof vi.fn>;
    deleteTemplate: ReturnType<typeof vi.fn>;
    cloneTemplate: ReturnType<typeof vi.fn>;
    selectTemplate: ReturnType<typeof vi.fn>;
  };

  const sampleTemplates: TaskTemplateRecord[] = [
    {
      id: 1,
      name: "定例テンプレート",
      description: "## 概要",
      issues: [
        { id: "iss-1", order: 1, value: "# 準備", dayOffset: 0 },
        { id: "iss-2", order: 2, value: "# 実施", dayOffset: 1 },
      ],
    },
  ];

  beforeEach(() => {
    element = new SettingsPane();
    mockController = {
      state: [...sampleTemplates],
      selectedTemplateId: 1,
      createTemplate: vi.fn().mockResolvedValue(2),
      updateTemplate: vi.fn().mockResolvedValue(undefined),
      deleteTemplate: vi.fn().mockResolvedValue(undefined),
      cloneTemplate: vi.fn().mockResolvedValue(3),
      selectTemplate: vi.fn(),
    };
    (element as any).taskTemplateController = mockController;
  });

  describe("1. ペイン基本構造とヘッダー描画", () => {
    it("1-1. ルート要素 .settings-pane がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<div[^>]*class="[^"]*settings-pane[^"]*"/);
    });

    it("1-2. ヘッダー部 (.settings-pane__header) が存在し、タイトルとして「SETTINGS」が表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-pane__header[^"]*"/,
      );
      expect(htmlStr).toMatch(
        /<span[^>]*class="[^"]*settings-pane__title[^"]*"[^>]*>\s*SETTINGS\s*<\/span>/,
      );
    });
  });

  describe("2. タブグループとテンプレートタブの描画", () => {
    it("2-1. コンテンツ領域内に placement=\"start\" が指定された wa-tab-group がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-pane__content[^"]*"/,
      );
      expect(htmlStr).toMatch(
        /<wa-tab-group[^>]*class="[^"]*settings-pane__tab-group[^"]*"[^>]*placement="start"/,
      );
    });

    it("2-2. panel=\"templates\"（Templates）の wa-tab および wa-tab-panel がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-tab[^>]*panel="templates"/);
      expect(htmlStr).toMatch(/<wa-tab-panel[^>]*name="templates"/);
    });

    it("2-3. 旧ダミータブ（general, appearance）が存在しないこと", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain('panel="general"');
      expect(htmlStr).not.toContain('panel="appearance"');
    });
  });

  describe("3. テンプレート管理マスター・ディテール機能", () => {
    it("3-1. テンプレート一覧（.settings-pane__master）およびアイコンのみの新規作成ボタン（plus-solid-full）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-pane__master");
      expect(htmlStr).toContain("settings-pane__btn-new");
      expect(htmlStr).toContain("定例テンプレート");
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*settings-pane__btn-new[^"]*"[^>]*>[\s\S]*?<wa-icon[^>]*library="my-icons"[^>]*name="plus-solid-full"[^>]*><\/wa-icon>[\s\S]*?<\/wa-button>/,
      );
      const btnMatch = htmlStr.match(
        /<wa-button[^>]*class="[^"]*settings-pane__btn-new[^"]*"[^>]*>([\s\S]*?)<\/wa-button>/,
      );
      expect(btnMatch?.[1].trim()).not.toMatch(/^新規作成$/);
      expect(htmlStr).toMatch(/<wa-tooltip[^>]*trigger="hover"[^>]*>/);
    });

    it("3-2. テンプレート選択時、ディテール領域にフォームが表示されること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-pane__detail");
      expect(htmlStr).toContain("settings-pane__form-name");
      expect(htmlStr).toContain("settings-pane__btn-save");
    });

    it("3-3. テンプレートアイテム内にハンバーガーアイコン付きドロップダウン（wa-dropdown）がレンダリングされ、アイコン付き（copy-solid-full, trash-solid-full）の複製・削除項目が存在すること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-dropdown[^>]*class="[^"]*settings-pane__item-dropdown[^"]*"/,
      );
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*library="my-icons"[^>]*name="bars-solid-full"/,
      );
      // 複製項目に copy-solid-full アイコンが含まれること
      expect(htmlStr).toMatch(
        /<wa-dropdown-item[^>]*value="clone"[^>]*>[\s\S]*?<wa-icon[^>]*slot="icon"[^>]*library="my-icons"[^>]*name="copy-solid-full"[^>]*><\/wa-icon>[\s\S]*?複製[\s\S]*?<\/wa-dropdown-item>/,
      );
      // 削除項目に trash-solid-full アイコンが含まれること
      expect(htmlStr).toMatch(
        /<wa-dropdown-item[^>]*value="delete"[^>]*>[\s\S]*?<wa-icon[^>]*slot="icon"[^>]*library="my-icons"[^>]*name="trash-solid-full"[^>]*><\/wa-icon>[\s\S]*?削除[\s\S]*?<\/wa-dropdown-item>/,
      );
    });

    it("3-4. ドロップダウンメニュー選択（handleMenuSelect）で複製および削除が呼び出されること", async () => {
      await (element as any).handleMenuSelect("clone", 1);
      expect(mockController.cloneTemplate).toHaveBeenCalledWith(1);

      await (element as any).handleMenuSelect("delete", 1);
      expect(mockController.deleteTemplate).toHaveBeenCalledWith(1);
    });

    it("3-5. Issue追加ボタンで初期値「### New Issue」を持つIssue項目が追加され、並び替えボタンで順序が入れ替わること", () => {
      element.selectTemplate(sampleTemplates[0]);
      expect(element.formIssues).toHaveLength(2);

      element.addIssue();
      expect(element.formIssues).toHaveLength(3);
      expect(element.formIssues[2].order).toBe(3);
      expect(element.formIssues[2].value).toBe("### New Issue");

      element.moveIssueUp(1);
      expect(element.formIssues[0].value).toBe("# 実施");
      expect(element.formIssues[1].value).toBe("# 準備");
    });

    it("3-6. master-list 内に labelsライクなリストアイテム（.settings-pane__master-item）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-pane__master-list[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*settings-pane__master-item[^"]*"[^>]*role="button"/,
      );
      expect(htmlStr).toContain("定例テンプレート");
      expect(htmlStr).not.toContain("settings-pane__master-tab-group");
    });

    it("3-7. 選択中のテンプレートアイテムに .settings-pane__master-item--selected クラスが付与されること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-pane__master-item[^"]*settings-pane__master-item--selected[^"]*"/,
      );
    });

    it("3-8. テンプレートアイテムのキーボード操作（Enter / Space）で選択が行われること", () => {
      const spy = vi.spyOn(element, "selectTemplate");
      const preventDefaultEnter = vi.fn();
      const enterEvent = {
        key: "Enter",
        preventDefault: preventDefaultEnter,
      } as unknown as KeyboardEvent;
      element.handleMasterItemKeyDown(enterEvent, sampleTemplates[0]);
      expect(preventDefaultEnter).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(sampleTemplates[0]);

      const preventDefaultSpace = vi.fn();
      const spaceEvent = {
        key: " ",
        preventDefault: preventDefaultSpace,
      } as unknown as KeyboardEvent;
      element.handleMasterItemKeyDown(spaceEvent, sampleTemplates[0]);
      expect(preventDefaultSpace).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it("3-9. ディテール領域の概要入力部に二重ラベル（「タスク概要（Markdown）」）が存在しないこと", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-pane__desc-editor");
      expect(htmlStr).not.toContain("タスク概要（Markdown）");
    });

    it("3-10. Issue追加ボタン（.settings-pane__btn-add-issue）がアイコンのみ（plus-solid-full）で描画され、ツールチップが付属すること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*settings-pane__btn-add-issue[^"]*"[^>]*>[\s\S]*?<wa-icon[^>]*library="my-icons"[^>]*name="plus-solid-full"[^>]*><\/wa-icon>[\s\S]*?<\/wa-button>/,
      );
      expect(htmlStr).not.toContain("＋ Issueを追加");
    });

    it("3-11. Issueエリアが左右（.settings-pane__issue-master と .settings-pane__issue-detail）に分割され、右側に Markdownエディタが配置されること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-pane__issue-master");
      expect(htmlStr).toContain("settings-pane__issue-detail");
      expect(htmlStr).toMatch(
        /<markdown-editor-preview[^>]*class="[^"]*settings-pane__issue-editor[^"]*"/,
      );
      expect(htmlStr).not.toMatch(
        /<wa-textarea[^>]*class="[^"]*settings-pane__issue-value[^"]*"/,
      );
    });

    it("3-12. Issueリストアイテム内にハンバーガーメニューがあり、上へ移動（angle-up-solid-full）、下へ移動（angle-down-solid-full）、削除（trash-solid-full）が存在すること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-dropdown[^>]*class="[^"]*settings-pane__issue-dropdown[^"]*"/,
      );
      expect(htmlStr).toMatch(
        /<wa-dropdown-item[^>]*value="move-up"[^>]*>[\s\S]*?<wa-icon[^>]*name="angle-up-solid-full"[^>]*><\/wa-icon>[\s\S]*?上へ移動[\s\S]*?<\/wa-dropdown-item>/,
      );
      expect(htmlStr).toMatch(
        /<wa-dropdown-item[^>]*value="move-down"[^>]*>[\s\S]*?<wa-icon[^>]*name="angle-down-solid-full"[^>]*><\/wa-icon>[\s\S]*?下へ移動[\s\S]*?<\/wa-dropdown-item>/,
      );
      expect(htmlStr).toMatch(
        /<wa-dropdown-item[^>]*value="delete"[^>]*>[\s\S]*?<wa-icon[^>]*name="trash-solid-full"[^>]*><\/wa-icon>[\s\S]*?削除[\s\S]*?<\/wa-dropdown-item>/,
      );
    });

    it("3-13. 自然なラベル名「タスク期日からの日数」がレンダリングされ、旧表記「相対期限」が存在しないこと", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("タスク期日からの日数");
      expect(htmlStr).not.toContain("相対期限");
    });

    it("3-14. Issueアイテムの選択切り替えで右側の編集対象が切り替わること", () => {
      element.selectTemplate(sampleTemplates[0]);
      expect(element.selectedIssueIndex).toBe(0);
      element.selectIssue(1);
      expect(element.selectedIssueIndex).toBe(1);
    });

    it("3-15. テンプレート保存ボタン（.settings-pane__btn-save）がテンプレート名入力欄の右隣（.settings-pane__name-row）に配置され、テンプレート名にlabel=\"テンプレート名\"が設定され、旧ヘッダー（.settings-pane__detail-header）が存在しないこと", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());

      // 旧ヘッダーが存在しないこと
      expect(htmlStr).not.toContain("settings-pane__detail-header");
      expect(htmlStr).not.toContain("settings-pane__detail-title");

      // name-row 内に wa-input と wa-button が配置されていること
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-pane__name-row[^"]*"[^>]*>[\s\S]*?<wa-input[^>]*class="[^"]*settings-pane__form-name[^"]*"[\s\S]*?<wa-button[^>]*class="[^"]*settings-pane__btn-save[^"]*"[^>]*>[\s\S]*?<wa-icon[^>]*name="floppy-disk-regular-full"[^>]*><\/wa-icon>[\s\S]*?<\/wa-button>[\s\S]*?<\/div>/,
      );

      // テンプレート名入力欄にlabel="テンプレート名"属性が設定されていること
      const inputMatch = htmlStr.match(/<wa-input[^>]*class="[^"]*settings-pane__form-name[^"]*"[^>]*>/);
      expect(inputMatch?.[0]).toMatch(/\slabel="テンプレート名"/);

      // ボタンの初期スタイルとツールチップ
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*settings-pane__btn-save[^"]*"[^>]*variant="neutral"[^>]*appearance="plain"[^>]*>/,
      );
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*settings-pane__btn-save[^"]*"[^>]*size="medium"/,
      );
      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="settings-template-save-btn"[^>]*trigger="hover"[^>]*>/,
      );
      expect(htmlStr).not.toContain("settings-pane__form-actions");
    });

    it("3-16. Issueリストの各アイテムタイトルからMarkdown見出し記号（#）が除外されて表示されること", () => {
      element.selectTemplate(sampleTemplates[0]);
      element.addIssue(); // ### New Issue
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<span[^>]*class="[^"]*settings-pane__item-title[^"]*"[^>]*>\s*New Issue\s*<\/span>/,
      );
      expect(htmlStr).toMatch(
        /<span[^>]*class="[^"]*settings-pane__item-title[^"]*"[^>]*>\s*準備\s*<\/span>/,
      );
      expect(htmlStr).not.toMatch(
        /<span[^>]*class="[^"]*settings-pane__item-title[^"]*"[^>]*>\s*### New Issue\s*<\/span>/,
      );
    });

    it("3-17. テンプレート編集後に未保存の変更がある場合、保存ボタンがアクセント（variant=\"brand\" appearance=\"accent\"）されアイコンにアニメーション（animation=\"shake\"）が設定されること", () => {
      element.selectTemplate(sampleTemplates[0]);

      // 編集前（保存済み・未変更）: plain, neutral、アニメーションなし
      let htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*settings-pane__btn-save[^"]*"[^>]*variant="neutral"[^>]*appearance="plain"/,
      );
      expect(htmlStr).not.toMatch(
        /<wa-icon[^>]*name="floppy-disk-regular-full"[^>]*animation="shake"/,
      );

      // 編集後（名称変更）: 未保存状態 -> brand, accent & animation="shake"
      element.formName = "名称変更後のテンプレート";
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*settings-pane__btn-save[^"]*"[^>]*variant="brand"[^>]*appearance="accent"/,
      );
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*name="floppy-disk-regular-full"[^>]*animation="shake"/,
      );
    });

    it("3-18. テンプレート名入力・保存ボタン行（.settings-pane__name-row）と分離されたスクロール可能なフォームボディ（.settings-pane__form-body）がレンダリングされること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());

      // settings-pane__form 内に name-row と form-body が兄弟要素として存在すること
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-pane__form[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*settings-pane__name-row[^"]*"[\s\S]*?<\/div>[\s\S]*?<div[^>]*class="[^"]*settings-pane__form-body[^"]*"[\s\S]*?<\/div>[\s\S]*?<\/div>/,
      );
      // form-body 内に概要エディタとIssueセクションが含まれること
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-pane__form-body[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*settings-pane__desc-container[^"]*"[\s\S]*?<div[^>]*class="[^"]*settings-pane__issue-section[^"]*"/,
      );
    });
  });

  describe("4. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "./settings-pane.scss");

    it("4-1. SCSSスタイルシート (settings-pane.scss) が存在し、ルートブロック .settings-pane および主要セレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(/\.settings-pane\b/);
      expect(scss).toMatch(/__header\b/);
      expect(scss).toMatch(/__content\b/);
      expect(scss).toMatch(/__master\b/);
      expect(scss).toMatch(/__master-list\b/);
      expect(scss).toMatch(/__master-item\b/);
      expect(scss).toMatch(/__item-main\b/);
      expect(scss).toMatch(/__item-title\b/);
      expect(scss).toMatch(/__item-dropdown\b/);
      expect(scss).toMatch(/__btn-menu\b/);
      expect(scss).toMatch(/__detail\b/);
      expect(scss).toMatch(/__name-row\b/);
      expect(scss).toMatch(/__issue-master\b/);
      expect(scss).toMatch(/__issue-detail\b/);
      expect(scss).not.toMatch(/__detail-header\b/);
    });

    it("4-2. settings-pane.scss に !important 宣言が一切含まれていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toMatch(/!important/);
    });

    it("4-3. settings-pane.scss に @extend が一切含まれていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toMatch(/@extend/);
    });

    it("4-4. settings-pane.scss 全体においてハードコードされたカラーコードが 0 件であること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const hexMatches = scss.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
      const rgbMatches = scss.match(/\brgba?\([^)]+\)/g) || [];
      expect(hexMatches.length + rgbMatches.length).toBe(0);
    });

    it("4-5. .settings-pane__master-header がリストアイテムと右端位置を揃えるための余白定義を持つこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-pane__master-header\s*\{[^}]*?(?:padding-right|padding-inline):\s*var\(--wa-space-xs\b/,
      );
    });

    it("4-6. .settings-pane__tab-panel[active] の内部スロット（::part(base)）に高さ伝播・スクロール可能とするスタイル（height: 100%）が定義されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-pane__tab-panel[^{]*\{[\s\S]*?&::part\(base\)\s*\{[^}]*?height:\s*100%/,
      );
    });

    it("4-7. .settings-pane__master-list がスクロールバーとアイテム間の圧迫感を防ぐ余白定義（padding-inline-end または padding-right）および scrollbar-gutter: stable を持つこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-pane__master-list\s*\{[^}]*?(?:padding-inline-end|padding-right):\s*var\(--wa-space-(?:xs|s)\b/,
      );
      expect(scss).toMatch(
        /\.settings-pane__master-list\s*\{[^}]*?scrollbar-gutter:\s*stable\b/,
      );
    });

    it("4-8. .settings-pane__form-name にWeb Awesome公式サンプルに準拠したラベル左配置スタイルが定義されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-pane__form-name\s*\{[\s\S]*?(?:grid-template-columns|flex-direction)/,
      );
      expect(scss).toMatch(
        /\.settings-pane__form-name[^{]*\{[\s\S]*?&::part\(form-control-label\)/,
      );
    });

    it("4-9. .settings-pane__btn-save 内の wa-icon にワンサイズ大きいフォントサイズ（--wa-font-size-l）が指定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-pane__btn-save\s*\{[\s\S]*?wa-icon\s*\{[^}]*?font-size:\s*var\(--wa-font-size-l\b/,
      );
    });

    it("4-10. .settings-pane__form-body にスクロール定義（overflow-y: auto）およびスクロールバー余白が指定され、.settings-pane__name-row が固定（flex-shrink: 0）されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-pane__name-row\s*\{[^}]*?flex-shrink:\s*0\b/,
      );
      expect(scss).toMatch(
        /\.settings-pane__form-body\s*\{[^}]*?overflow-y:\s*auto\b/,
      );
      expect(scss).toMatch(
        /\.settings-pane__form-body\s*\{[^}]*?scrollbar-gutter:\s*stable\b/,
      );
    });
  });
});
