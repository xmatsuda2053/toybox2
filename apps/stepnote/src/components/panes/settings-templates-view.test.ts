import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { SettingsTemplatesView } from "./settings-templates-view.js";
import type { TaskTemplateRecord } from "@/db/models/template.model.js";

/**
 * 【SettingsTemplatesView 仕様 (設定画面用テンプレート管理サブビュー)】
 *
 * 1. テンプレート管理マスター・ディテール機能
 *    - 1-1. テンプレート一覧（.settings-templates-view__master）およびアイコンのみの新規作成ボタン（plus-solid-full）がレンダリングされること
 *    - 1-2. テンプレート選択時、ディテール領域（.settings-templates-view__detail）に名称入力欄・概要エディタ・Issueリスト・保存ボタンが表示されること
 *    - 1-3. テンプレートアイテム内にハンバーガーアイコン付きドロップダウン（wa-dropdown）がレンダリングされ、アイコン付き（copy-solid-full, trash-solid-full）の複製・削除項目が存在すること
 *    - 1-4. ドロップダウンメニュー選択（handleMenuSelect）で複製および削除が呼び出されること
 *    - 1-5. Issue追加ボタンで初期値「### New Issue」を持つIssue項目が追加され、並び替えボタン（↑↓）で順序が入れ替わること
 *    - 1-6. master-list 内にリストアイテム（.settings-templates-view__master-item）がレンダリングされること
 *    - 1-7. 選択中のテンプレートアイテムに .settings-templates-view__master-item--selected クラスが付与されること
 *    - 1-8. テンプレートアイテムのキーボード操作（Enter/Space）で選択が行われること
 *    - 1-9. ディテール領域の概要入力部に二重ラベル（「タスク概要（Markdown）」）が存在しないこと
 *    - 1-10. Issue追加ボタン（.settings-templates-view__btn-add-issue）がアイコンのみ（plus-solid-full）で描画され、ツールチップが付属すること
 *    - 1-11. Issueエリアが左右（.settings-templates-view__issue-master と .settings-templates-view__issue-detail）に分割され、右側に Markdownエディタが配置されること
 *    - 1-12. Issueリストアイテム内にハンバーガーメニューがあり、上へ移動（angle-up-solid-full）、下へ移動（angle-down-solid-full）、削除（trash-solid-full）が存在すること
 *    - 1-13. 期日設定スイッチ（期日を設定）がレンダリングされ、旧表記「相対期限」および冗長なラベルが存在しないこと
 *    - 1-14. Issueアイテムの選択切り替えで右側の編集対象が切り替わること
 *    - 1-15. テンプレート保存ボタン（.settings-templates-view__btn-save）がテンプレート名入力欄の右隣（.settings-templates-view__name-row）に配置され、旧ヘッダーが存在しないこと
 *    - 1-16. Issueリストの各アイテムタイトルからMarkdown見出し記号（#）が除外されて表示されること
 *    - 1-17. テンプレート編集後に未保存の変更がある場合、保存ボタンがアクセント（variant="brand" appearance="accent"）されアイコンにアニメーション（animation="shake"）が設定されること
 *    - 1-18. テンプレート名入力・保存ボタン行（.settings-templates-view__name-row）と分離されたスクロール可能なフォームボディ（.settings-templates-view__form-body）がレンダリングされること
 *    - 1-19. 設定ビュー内のボタンおよび入力欄が Web Awesome の新仕様 size="s" でレンダリングされること
 *    - 1-20. Issueリストのドロップダウンメニュー（wa-dropdown）に placement="bottom-end" およびクリック伝播防止が設定され、トリガーボタンから stopPropagation が除去されていること
 *    - 1-21. Issueメニューで「削除」を選択した際（handleIssueMenuSelect / removeIssue）、該当Issueが即座に formIssues から削除され、selectedIssueIndex が適正に追従すること
 *    - 1-22. 登録Issue一覧が Lit の repeat ディレクティブを用いて issue.id でキーバインドされてレンダリングされること
 *    - 1-23. Issueディテール領域において、「期日を設定」スイッチ（.settings-templates-view__issue-offset-switch）が存在すること
 *    - 1-24. 期日スイッチがOFFの場合、日数入力欄（.settings-templates-view__issue-offset-input）に disabled 属性が付与され、ONの場合は disabled が解除されること
 *    - 1-25. スイッチのトグル（handleToggleOffsetEnabled）により、対象Issueの dayOffset が undefined ⇄ 数値へ更新されること
 *    - 1-26. 新規Issue追加時（addIssue）のデフォルトで dayOffset が undefined となり、期日スイッチがOFFの状態で追加されること
 *
 * 2. BEM設計およびSCSSスタイルの検証
 *    - 2-1. settings-templates-view.scss が存在し、ルートブロックおよび主要BEMセレクタが定義されていること
 *    - 2-2. !important, @extend, カラー直値が一切含まれていないこと
 *    - 2-3. __master-header / __master-list / __form-name / __btn-save / __form-body のスタイル仕様が維持されていること
 *    - 2-4. __master-item / __issue-item / __issue-offset-row / __issue-section / __desc-container のスタイル仕様が維持されていること
 */
describe("SettingsTemplatesView Component", () => {
  let element: SettingsTemplatesView;
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
    element = new SettingsTemplatesView();
    mockController = {
      state: [...sampleTemplates],
      selectedTemplateId: 1,
      createTemplate: vi.fn().mockResolvedValue(2),
      updateTemplate: vi.fn().mockResolvedValue(undefined),
      deleteTemplate: vi.fn().mockResolvedValue(undefined),
      cloneTemplate: vi.fn().mockResolvedValue(3),
      selectTemplate: vi.fn(),
    };
    Reflect.set(element, "taskTemplateController", mockController);
  });

  describe("1. テンプレート管理マスター・ディテール機能", () => {
    it("1-1. テンプレート一覧（.settings-templates-view__master）およびアイコンのみの新規作成ボタン（plus-solid-full）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-templates-view__master");
      expect(htmlStr).toContain("settings-templates-view__btn-new");
      expect(htmlStr).toContain("定例テンプレート");
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*settings-templates-view__btn-new[^"]*"[^>]*>[\s\S]*?<wa-icon[^>]*library="my-icons"[^>]*name="plus-solid-full"[^>]*><\/wa-icon>[\s\S]*?<\/wa-button>/,
      );
      const btnMatch = htmlStr.match(
        /<wa-button[^>]*class="[^"]*settings-templates-view__btn-new[^"]*"[^>]*>([\s\S]*?)<\/wa-button>/,
      );
      expect(btnMatch?.[1].trim()).not.toMatch(/^新規作成$/);
      expect(htmlStr).toMatch(/<wa-tooltip[^>]*trigger="hover"[^>]*>/);
    });

    it("1-2. テンプレート選択時、ディテール領域にフォームが表示されること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-templates-view__detail");
      expect(htmlStr).toContain("settings-templates-view__form-name");
      expect(htmlStr).toContain("settings-templates-view__btn-save");
    });

    it("1-3. テンプレートアイテム内にハンバーガーアイコン付きドロップダウン（wa-dropdown）がレンダリングされ、複製・削除項目が存在すること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-dropdown[^>]*class="[^"]*settings-templates-view__item-dropdown[^"]*"/,
      );
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*library="my-icons"[^>]*name="bars-solid-full"/,
      );
      expect(htmlStr).toMatch(
        /<wa-dropdown-item[^>]*value="clone"[^>]*>[\s\S]*?<wa-icon[^>]*slot="icon"[^>]*library="my-icons"[^>]*name="copy-solid-full"[^>]*><\/wa-icon>[\s\S]*?複製[\s\S]*?<\/wa-dropdown-item>/,
      );
      expect(htmlStr).toMatch(
        /<wa-dropdown-item[^>]*value="delete"[^>]*>[\s\S]*?<wa-icon[^>]*slot="icon"[^>]*library="my-icons"[^>]*name="trash-solid-full"[^>]*><\/wa-icon>[\s\S]*?削除[\s\S]*?<\/wa-dropdown-item>/,
      );
    });

    it("1-4. ドロップダウンメニュー選択（handleMenuSelect）で複製および削除が呼び出されること", async () => {
      await element.handleMenuSelect("clone", 1);
      expect(mockController.cloneTemplate).toHaveBeenCalledWith(1);

      await element.handleMenuSelect("delete", 1);
      expect(mockController.deleteTemplate).toHaveBeenCalledWith(1);
    });

    it("1-5. Issue追加ボタンで初期値「### New Issue」を持つIssue項目が追加され、並び替えボタンで順序が入れ替わること", () => {
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

    it("1-6. master-list 内にリストアイテム（.settings-templates-view__master-item）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-templates-view__master-list[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*settings-templates-view__master-item[^"]*"[^>]*role="button"/,
      );
      expect(htmlStr).toContain("定例テンプレート");
    });

    it("1-7. 選択中のテンプレートアイテムに .settings-templates-view__master-item--selected クラスが付与されること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-templates-view__master-item[^"]*settings-templates-view__master-item--selected[^"]*"/,
      );
    });

    it("1-8. テンプレートアイテムのキーボード操作（Enter / Space）で選択が行われること", () => {
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

    it("1-9. ディテール領域の概要入力部に二重ラベル（「タスク概要（Markdown）」）が存在しないこと", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-templates-view__desc-editor");
      expect(htmlStr).not.toContain("タスク概要（Markdown）");
    });

    it("1-10. Issue追加ボタン（.settings-templates-view__btn-add-issue）がアイコンのみ（plus-solid-full）で描画され、ツールチップが付属すること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*settings-templates-view__btn-add-issue[^"]*"[^>]*>[\s\S]*?<wa-icon[^>]*library="my-icons"[^>]*name="plus-solid-full"[^>]*><\/wa-icon>[\s\S]*?<\/wa-button>/,
      );
      expect(htmlStr).not.toContain("＋ Issueを追加");
    });

    it("1-11. Issueエリアが左右（.settings-templates-view__issue-master と .settings-templates-view__issue-detail）に分割され、右側に Markdownエディタが配置されること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-templates-view__issue-master");
      expect(htmlStr).toContain("settings-templates-view__issue-detail");
      expect(htmlStr).toMatch(
        /<markdown-editor-preview[^>]*class="[^"]*settings-templates-view__issue-editor[^"]*"/,
      );
    });

    it("1-12. Issueリストアイテム内にハンバーガーメニューがあり、上へ移動・下へ移動・削除が存在すること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-dropdown[^>]*class="[^"]*settings-templates-view__issue-dropdown[^"]*"/,
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

    it("1-13. 期日設定スイッチ（期日を設定）がレンダリングされ、旧表記「相対期限」および冗長なラベルが存在しないこと", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("期日を設定");
      expect(htmlStr).not.toContain("タスク期日からの日数:");
      expect(htmlStr).not.toContain("相対期限");
    });

    it("1-14. Issueアイテムの選択切り替えで右側の編集対象が切り替わること", () => {
      element.selectTemplate(sampleTemplates[0]);
      expect(element.selectedIssueIndex).toBe(0);
      element.selectIssue(1);
      expect(element.selectedIssueIndex).toBe(1);
    });

    it("1-15. テンプレート保存ボタンがテンプレート名入力欄の右隣に配置され、テンプレート名にlabel=\"テンプレート名\"が設定されていること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-templates-view__name-row[^"]*"[^>]*>[\s\S]*?<wa-input[^>]*class="[^"]*settings-templates-view__form-name[^"]*"[\s\S]*?<wa-button[^>]*class="[^"]*settings-templates-view__btn-save[^"]*"[^>]*>[\s\S]*?<wa-icon[^>]*name="floppy-disk-regular-full"[^>]*><\/wa-icon>[\s\S]*?<\/wa-button>[\s\S]*?<\/div>/,
      );

      const inputMatch = htmlStr.match(
        /<wa-input[^>]*class="[^"]*settings-templates-view__form-name[^"]*"[^>]*>/,
      );
      expect(inputMatch?.[0]).toMatch(/\slabel="テンプレート名"/);

      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*settings-templates-view__btn-save[^"]*"[^>]*variant="neutral"[^>]*appearance="plain"[^>]*>/,
      );
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*settings-templates-view__btn-save[^"]*"[^>]*size="m"/,
      );
      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="settings-template-save-btn"[^>]*trigger="hover"[^>]*>/,
      );
    });

    it("1-16. Issueリストの各アイテムタイトルからMarkdown見出し記号（#）が除外されて表示されること", () => {
      element.selectTemplate(sampleTemplates[0]);
      element.addIssue();
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<span[^>]*class="[^"]*settings-templates-view__item-title[^"]*"[^>]*>\s*New Issue\s*<\/span>/,
      );
      expect(htmlStr).toMatch(
        /<span[^>]*class="[^"]*settings-templates-view__item-title[^"]*"[^>]*>\s*準備\s*<\/span>/,
      );
      expect(htmlStr).not.toMatch(
        /<span[^>]*class="[^"]*settings-templates-view__item-title[^"]*"[^>]*>\s*### New Issue\s*<\/span>/,
      );
    });

    it("1-17. テンプレート編集後に未保存の変更がある場合、保存ボタンがアクセント（variant=\"brand\" appearance=\"accent\"）されアイコンにアニメーションが設定されること", () => {
      element.selectTemplate(sampleTemplates[0]);

      let htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*settings-templates-view__btn-save[^"]*"[^>]*variant="neutral"[^>]*appearance="plain"/,
      );
      expect(htmlStr).not.toMatch(
        /<wa-icon[^>]*name="floppy-disk-regular-full"[^>]*animation="shake"/,
      );

      element.formName = "名称変更後のテンプレート";
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*settings-templates-view__btn-save[^"]*"[^>]*variant="brand"[^>]*appearance="accent"/,
      );
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*name="floppy-disk-regular-full"[^>]*animation="shake"/,
      );
    });

    it("1-18. テンプレート名入力・保存ボタン行と分離されたスクロール可能なフォームボディがレンダリングされること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-templates-view__form[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*settings-templates-view__name-row[^"]*"[\s\S]*?<\/div>[\s\S]*?<div[^>]*class="[^"]*settings-templates-view__form-body[^"]*"[\s\S]*?<\/div>[\s\S]*?<\/div>/,
      );
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-templates-view__form-body[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*settings-templates-view__desc-container[^"]*"[\s\S]*?<div[^>]*class="[^"]*settings-templates-view__issue-section[^"]*"/,
      );
    });

    it("1-19. ボタンおよび入力欄が Web Awesome の新仕様 size='s' でレンダリングされること", () => {
      element.selectTemplate(sampleTemplates[0]);
      element.addIssue();
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="settings-template-create-btn"[^>]*size="s"/,
      );
      expect(htmlStr).toMatch(
        /<wa-button[^>]*slot="trigger"[^>]*class="[^"]*settings-templates-view__btn-menu[^"]*"[^>]*size="s"/,
      );
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="settings-issue-add-btn"[^>]*size="s"/,
      );
      expect(htmlStr).toMatch(
        /<wa-input[^>]*size="s"[^>]*class="[^"]*settings-templates-view__issue-offset-input"[^>]*>/,
      );
    });

    it("1-20. Issueリストのドロップダウンメニュー（wa-dropdown）に placement=\"bottom-end\" およびクリック伝播防止が設定されていること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-dropdown[^>]*class="[^"]*settings-templates-view__issue-dropdown[^"]*"[^>]*placement="bottom-end"/,
      );
      const tsPath = path.resolve(__dirname, "./settings-templates-view.ts");
      const tsContent = fs.readFileSync(tsPath, "utf-8");
      const dropdownFuncMatch = tsContent.match(
        /renderIssueItemDropdown[\s\S]*?<\/wa-dropdown>/,
      );
      expect(dropdownFuncMatch).not.toBeNull();
      const dropdownCode = dropdownFuncMatch![0];
      expect(dropdownCode).not.toMatch(
        /<wa-button[^>]*@click=\$\{[^}]*stopPropagation/,
      );
      expect(dropdownCode).toMatch(
        /<wa-dropdown[^>]*@click=\$\{[^}]*stopPropagation/,
      );
    });

    it("1-21. Issueメニューで「削除」を選択した際、該当Issueが即座に formIssues から削除され selectedIssueIndex が追従すること", () => {
      element.selectTemplate(sampleTemplates[0]);
      expect(element.formIssues).toHaveLength(2);
      element.selectedIssueIndex = 1;

      element.handleIssueMenuSelect("delete", 1);
      expect(element.formIssues).toHaveLength(1);
      expect(element.formIssues[0].id).toBe("iss-1");
      expect(element.selectedIssueIndex).toBe(0);

      element.handleIssueMenuSelect("delete", 0);
      expect(element.formIssues).toHaveLength(0);
      expect(element.selectedIssueIndex).toBe(0);
    });

    it("1-22. 登録Issue一覧が Lit の repeat ディレクティブを用いて issue.id でキーバインドされてレンダリングされること", () => {
      const tsPath = path.resolve(__dirname, "./settings-templates-view.ts");
      const tsContent = fs.readFileSync(tsPath, "utf-8");
      expect(tsContent).toMatch(
        /import\s*\{[^}]*repeat[^}]*\}\s*from\s*["']lit\/directives\/repeat\.js["']/,
      );
      expect(tsContent).toMatch(
        /repeat\(\s*this\.formIssues,\s*\((?:issue|iss)\)\s*=>\s*(?:issue|iss)\.id/,
      );
    });

    it("1-23. Issueディテール領域において、「期日を設定」スイッチが存在すること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("settings-templates-view__issue-offset-switch");
      expect(htmlStr).toContain("期日を設定");
    });

    it("1-24. 期日スイッチがOFFの場合、日数入力欄に disabled 属性が付与され、ONの場合は解除されること", () => {
      element.selectTemplate(sampleTemplates[0]);

      element.formIssues[0].dayOffset = undefined;
      let htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /class="[^"]*settings-templates-view__issue-offset-input[^"]*"[^>]*disabled/,
      );
      expect(htmlStr).not.toMatch(
        /class="[^"]*settings-templates-view__issue-offset-switch[^"]*"[^>]*\bchecked\b/,
      );

      element.formIssues[0].dayOffset = 3;
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toMatch(
        /class="[^"]*settings-templates-view__issue-offset-input[^"]*"[^>]*disabled/,
      );
      expect(htmlStr).toMatch(
        /class="[^"]*settings-templates-view__issue-offset-switch[^"]*"[^>]*\bchecked\b/,
      );
    });

    it("1-25. スイッチのトグル（handleToggleOffsetEnabled）により、対象Issueの dayOffset が undefined ⇄ 数値へ更新されること", () => {
      element.selectTemplate(sampleTemplates[0]);
      element.formIssues = [
        { id: "1", order: 1, value: "テスト", dayOffset: 5 },
      ];
      element.selectedIssueIndex = 0;

      element.handleToggleOffsetEnabled(0, false);
      expect(element.formIssues[0].dayOffset).toBeUndefined();

      element.handleToggleOffsetEnabled(0, true);
      expect(element.formIssues[0].dayOffset).toBe(0);
    });

    it("1-26. 新規Issue追加時（addIssue）のデフォルトで dayOffset が undefined となり、期日スイッチがOFFの状態で追加されること", () => {
      element.selectTemplate(sampleTemplates[0]);
      element.addIssue();
      const newIssue = element.formIssues[element.formIssues.length - 1];
      expect(newIssue.dayOffset).toBeUndefined();

      element.selectedIssueIndex = element.formIssues.length - 1;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toMatch(
        /class="[^"]*settings-templates-view__issue-offset-switch[^"]*"[^>]*\bchecked\b/,
      );
    });
  });

  describe("2. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "./settings-templates-view.scss");

    it("2-1. settings-templates-view.scss が存在し、主要BEMセレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(/\.settings-templates-view\b/);
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
    });

    it("2-2. !important, @extend, カラー直値が一切含まれていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toMatch(/!important/);
      expect(scss).not.toMatch(/@extend/);
      const hexMatches = scss.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
      const rgbMatches = scss.match(/\brgba?\([^)]+\)/g) || [];
      expect(hexMatches.length + rgbMatches.length).toBe(0);
    });

    it("2-3. __master-header / __master-list / __form-name / __btn-save / __form-body のスタイル仕様が維持されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-templates-view__master-header\s*\{[^}]*?padding-inline-end:\s*calc\(var\(--wa-space-xs,\s*8px\)\s*\*\s*1\.5\)/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__master-header\s*\{[^}]*?scrollbar-gutter:\s*stable\b/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__master-list\s*\{[^}]*?(?:padding-inline-end|padding-right):\s*var\(--wa-space-(?:xs|s)\b/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__master-list\s*\{[^}]*?scrollbar-gutter:\s*stable\b/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__form-name\s*\{[\s\S]*?(?:grid-template-columns|flex-direction)/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__form-name[^{]*\{[\s\S]*?&::part\(form-control-label\)/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__btn-save\s*\{[\s\S]*?wa-icon\s*\{[^}]*?font-size:\s*var\(--wa-font-size-l\b/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__name-row\s*\{[^}]*?flex-shrink:\s*0\b/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__form-body\s*\{[^}]*?overflow-y:\s*auto\b/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__form-body\s*\{[^}]*?scrollbar-gutter:\s*stable\b/,
      );
    });

    it("2-4. __master-item / __issue-item / __issue-offset-row / __issue-section / __desc-container のスタイル仕様が維持されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-templates-view__master-item\s*\{[^}]*?background-color:\s*var\(--wa-color-surface-raised\b/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__issue-item\s*\{[^}]*?background-color:\s*var\(--wa-color-surface-raised\b/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__master-list\s*\{[^}]*?gap:\s*var\(--wa-space-xs,\s*6px\)/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__issue-list\s*\{[^}]*?gap:\s*var\(--wa-space-xs,\s*6px\)/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__master-item--selected\s*\{[^}]*?transition:\s*none\b/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__issue-item--selected\s*\{[^}]*?transition:\s*none\b/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__issue-offset-row\s*\{[^}]*?(?:padding-block|padding):\s*(?:var\(--wa-space-[^,)]+,\s*\d+px\)|\d+px)/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__issue-section\s*\{[^}]*?flex:\s*1\b/,
      );
      expect(scss).toMatch(
        /\.settings-templates-view__desc-container\s*\{[^}]*?height:\s*clamp\(/,
      );
    });
  });
});
