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
 *    - 3-13. 期日設定スイッチ（期日を設定）がレンダリングされ、旧表記「相対期限」および冗長なラベルが存在しないこと
 *    - 3-14. Issueアイテムの選択切り替えで右側の編集対象が切り替わること
 *    - 3-15. テンプレート保存ボタン（.settings-pane__btn-save）がテンプレート名入力欄の右隣（.settings-pane__name-row）に配置され、テンプレート名にlabel="テンプレート名"が設定され、旧ヘッダー（.settings-pane__detail-header）が存在しないこと
 *    - 3-16. Issueリストの各アイテムタイトルからMarkdown見出し記号（#）が除外されて表示されること
 *    - 3-17. テンプレート編集後に未保存の変更がある場合、保存ボタンがアクセント（variant="brand" appearance="accent"）されアイコンにアニメーション（animation="shake"）が設定されること
 *    - 3-18. テンプレート名入力・保存ボタン行（.settings-pane__name-row）と分離されたスクロール可能なフォームボディ（.settings-pane__form-body）がレンダリングされること
 *    - 3-19. 設定ペイン内のボタンおよび入力欄が Web Awesome の新仕様 size="s" でレンダリングされること
 *    - 3-20. Issueリストのドロップダウンメニュー（wa-dropdown）に placement="bottom-end" およびクリック伝播防止が設定され、トリガーボタンからイベント伝播阻害（stopPropagation）が除去されていること
 *    - 3-21. Issueメニューで「削除」を選択した際（handleIssueMenuSelect / removeIssue）、該当Issueが即座にformIssuesから削除され、selectedIssueIndexが適正に追従すること
 *    - 3-22. 登録Issue一覧がLitのrepeatディレクティブを用いてissue.idでキーバインドされてレンダリングされること
 *    - 3-23. Issueディテール領域において、「期日を設定」スイッチ（.settings-pane__issue-offset-switch）が存在すること
 *    - 3-24. 期日スイッチがOFFの場合、日数入力欄（.settings-pane__issue-offset-input）に disabled 属性が付与され、ONの場合は disabled が解除されること
 *    - 3-25. スイッチのトグル（handleToggleOffsetEnabled）により、対象Issueの dayOffset が undefined ⇄ 数値へ更新されること
 *    - 3-26. 新規Issue追加時（addIssue）のデフォルトで dayOffset が undefined となり、期日スイッチがOFFの状態で追加されること
 *
 * 4. BEM設計およびSCSSスタイルの検証
 *    - 4-1. SCSSスタイルシート (settings-pane.scss) が存在し、ルートブロック .settings-pane および主要セレクタが定義されていること
 *    - 4-2. settings-pane.scss に !important 宣言が一切含まれていないこと
 *    - 4-3. settings-pane.scss に @extend が一切含まれていないこと
 *    - 4-4. settings-pane.scss 全体においてハードコードされたカラーコード（Hex / RGB / RGBA）が 0 件であること
 *    - 4-5. .settings-pane__master-header がリストアイテムのメニューボタンと横位置を揃えるための右余白（padding-inline-end）および scrollbar-gutter: stable を持つこと
 *    - 4-6. .settings-pane__tab-panel[active] の内部スロット（::part(base)）に高さ伝播・スクロール可能とするスタイル（height: 100%）が定義されていること
 *    - 4-7. .settings-pane__master-list がスクロールバーとアイテム間の圧迫感を防ぐ余白定義（padding-inline-end または padding-right）および scrollbar-gutter: stable を持つこと
 *    - 4-8. .settings-pane__form-name にWeb Awesome公式サンプルに準拠したラベル左配置スタイル（gridまたはflexおよび::part(form-control-label)）が定義されていること
 *    - 4-9. .settings-pane__btn-save 内の wa-icon にワンサイズ大きいフォントサイズ（--wa-font-size-l）が指定されていること
 *    - 4-10. .settings-pane__form-body にスクロール定義（overflow-y: auto）およびスクロールバー余白が指定され、.settings-pane__name-row が固定（flex-shrink: 0）されていること
 *    - 4-11. .settings-pane__master-item に視認性を高める背景色（var(--wa-color-surface-raised)）および境界線（var(--wa-color-border-subtle)）が定義されていること
 *    - 4-12. .settings-pane__issue-item に視認性を高める背景色（var(--wa-color-surface-raised)）および境界線（var(--wa-color-border-subtle)）が定義されていること
 *    - 4-13. .settings-pane__master-list および .settings-pane__issue-list にアイテム間の適切な余白（gap: var(--wa-space-xs, 6px)）が定義されていること
 *    - 4-14. .settings-pane__master-item--selected および .settings-pane__issue-item--selected において、選択切り替え時の点滅を防ぐため transition: none が定義され、hover 時の背景色が選択時と同一に統一されていること
 *
 * 5. 自動エクスポート（Auto Export）設定タブ機能
 *    - 5-1. wa-tab-group 内に panel="auto-export" の wa-tab および wa-tab-panel がレンダリングされること
 *    - 5-2. 自動エクスポートタブ内に有効/無効切り替えスイッチ（wa-switch）がレンダリングされること
 *    - 5-3. スイッチ操作で autoExportController.setEnabled が呼び出されること
 *    - 5-4. 登録されたスケジュール時刻リストの各アイテムがレンダリングされること
 *    - 5-5. 時刻追加ハンドラーで入力された時刻が autoExportController.addScheduleTime へ渡されること
 *    - 5-6. 時刻削除ハンドラーで指定時刻が autoExportController.removeScheduleTime へ渡されること
 *    - 5-7. 手動エクスポートボタンクリックで autoExportController.triggerManualExport が呼び出されること
 *    - 5-8. 新規時刻入力欄に wa-time-input が hour-format="24" 付きでレンダリングされること
 *    - 5-9. Auto Export タブが左右2つのペイン（.settings-pane__export-layout, .settings-pane__export-main, .settings-pane__export-schedule-pane）で構成され、スケジュール一覧が右側に配置されること
 *    - 5-10. スケジュール時刻リスト（.settings-pane__schedule-list）にスクロール可能なスタイル（overflow-y: auto）が定義されていること
 *    - 5-11. 時刻追加フォーム（.settings-pane__schedule-form）が右ペイン（.settings-pane__export-schedule-pane）内に配置され、左ペインには含まれないこと
 *    - 5-12. 時刻追加ボタン（#settings-auto-export-add-btn）がプラスアイコン（plus-solid-full）かつ appearance="plain" で描画され、trigger="hover" のツールチップが付属すること
 *    - 5-13. 時刻入力欄に値が入力されて追加ボタンがクリック可能になった場合、variant="brand" appearance="accent" および .settings-pane__btn-add-time--active で目立つスタイルになること
 *    - 5-14. .settings-pane__schedule-item および .settings-pane__export-status が Light/Dark 両モードで浮き上がって見えるよう background-color: var(--wa-color-surface-raised) が指定されていること
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

    it("3-13. 期日設定スイッチ（期日を設定）がレンダリングされ、旧表記「相対期限」および冗長なラベルが存在しないこと", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("期日を設定");
      expect(htmlStr).not.toContain("タスク期日からの日数:");
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
        /<wa-button[^>]*class="[^"]*settings-pane__btn-save[^"]*"[^>]*size="m"/,
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

    it("3-19. 設定ペイン内のボタンおよび入力欄が Web Awesome の新仕様 size='s' でレンダリングされること", () => {
      element.selectTemplate(sampleTemplates[0]);
      element.addIssue();
      const htmlStr = flattenTemplate(element.render());

      // 新規作成ボタン
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="settings-template-create-btn"[^>]*size="s"/,
      );
      // テンプレート項目のメニューボタン
      expect(htmlStr).toMatch(
        /<wa-button[^>]*slot="trigger"[^>]*class="[^"]*settings-pane__btn-menu[^"]*"[^>]*size="s"/,
      );
      // Issue追加ボタン
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="settings-issue-add-btn"[^>]*size="s"/,
      );
      // 日数オフセット入力欄
      expect(htmlStr).toMatch(
        /<wa-input[^>]*size="s"[^>]*class="[^"]*settings-pane__issue-offset-input"[^>]*>/,
      );
    });

    it("3-20. Issueリストのドロップダウンメニュー（wa-dropdown）に placement=\"bottom-end\" およびクリック伝播防止が設定され、トリガーボタンからイベント伝播阻害（stopPropagation）が除去されていること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-dropdown[^>]*class="[^"]*settings-pane__issue-dropdown[^"]*"[^>]*placement="bottom-end"/,
      );
      const tsPath = path.resolve(__dirname, "./settings-pane.ts");
      const tsContent = fs.readFileSync(tsPath, "utf-8");
      const dropdownFuncMatch = tsContent.match(/renderIssueItemDropdown[\s\S]*?<\/wa-dropdown>/);
      expect(dropdownFuncMatch).not.toBeNull();
      const dropdownCode = dropdownFuncMatch![0];
      expect(dropdownCode).not.toMatch(/<wa-button[^>]*@click=\$\{[^}]*stopPropagation/);
      expect(dropdownCode).toMatch(/<wa-dropdown[^>]*@click=\$\{[^}]*stopPropagation/);
    });

    it("3-21. Issueメニューで「削除」を選択した際（handleIssueMenuSelect / removeIssue）、該当Issueが即座にformIssuesから削除され、selectedIssueIndexが適正に追従すること", () => {
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

    it("3-22. 登録Issue一覧がLitのrepeatディレクティブを用いてissue.idでキーバインドされてレンダリングされること", () => {
      const tsPath = path.resolve(__dirname, "./settings-pane.ts");
      const tsContent = fs.readFileSync(tsPath, "utf-8");
      expect(tsContent).toMatch(
        /import\s*\{[^}]*repeat[^}]*\}\s*from\s*["']lit\/directives\/repeat\.js["']/,
      );
      expect(tsContent).toMatch(
        /repeat\(\s*this\.formIssues,\s*\((?:issue|iss)\)\s*=>\s*(?:issue|iss)\.id/,
      );
    });

    it("3-23. Issueディテール領域において、「期日を設定」スイッチ（.settings-pane__issue-offset-switch）が存在すること", () => {
      element.selectTemplate(sampleTemplates[0]);
      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain("settings-pane__issue-offset-switch");
      expect(htmlStr).toContain("期日を設定");
    });

    it("3-24. 期日スイッチがOFFの場合、日数入力欄（.settings-pane__issue-offset-input）に disabled 属性が付与され、ONの場合は disabled が解除されること", () => {
      element.selectTemplate(sampleTemplates[0]);

      // 選択中Issueの dayOffset が undefined の場合（期日スイッチOFF）
      element.formIssues[0].dayOffset = undefined;
      let htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/class="[^"]*settings-pane__issue-offset-input[^"]*"[^>]*disabled/);
      expect(htmlStr).not.toMatch(/class="[^"]*settings-pane__issue-offset-switch[^"]*"[^>]*\bchecked\b/);

      // dayOffset が数値の場合（期日スイッチON）
      element.formIssues[0].dayOffset = 3;
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toMatch(/class="[^"]*settings-pane__issue-offset-input[^"]*"[^>]*disabled/);
      expect(htmlStr).toMatch(/class="[^"]*settings-pane__issue-offset-switch[^"]*"[^>]*\bchecked\b/);
    });

    it("3-25. スイッチのトグル（handleToggleOffsetEnabled）により、対象Issueの dayOffset が undefined ⇄ 数値へ更新されること", () => {
      element.selectTemplate(sampleTemplates[0]);
      element.formIssues = [
        { id: "1", order: 1, value: "テスト", dayOffset: 5 },
      ];
      element.selectedIssueIndex = 0;

      // 期日設定を無効化（false ➔ undefined）
      (element as any).handleToggleOffsetEnabled(0, false);
      expect(element.formIssues[0].dayOffset).toBeUndefined();

      // 期日設定を有効化（true ➔ 0）
      (element as any).handleToggleOffsetEnabled(0, true);
      expect(element.formIssues[0].dayOffset).toBe(0);
    });

    it("3-26. 新規Issue追加時（addIssue）のデフォルトで dayOffset が undefined となり、期日スイッチがOFFの状態で追加されること", () => {
      element.selectTemplate(sampleTemplates[0]);
      element.addIssue();
      const newIssue = element.formIssues[element.formIssues.length - 1];
      expect(newIssue.dayOffset).toBeUndefined();

      element.selectedIssueIndex = element.formIssues.length - 1;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toMatch(/class="[^"]*settings-pane__issue-offset-switch[^"]*"[^>]*\bchecked\b/);
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

    it("4-5. .settings-pane__master-header がリストアイテムのメニューボタンと横位置を揃えるための右余白（padding-inline-end: calc(... * 1.5)）および scrollbar-gutter: stable を持つこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-pane__master-header\s*\{[^}]*?padding-inline-end:\s*calc\(var\(--wa-space-xs,\s*8px\)\s*\*\s*1\.5\)/,
      );
      expect(scss).toMatch(
        /\.settings-pane__master-header\s*\{[^}]*?scrollbar-gutter:\s*stable\b/,
      );
      expect(scss).toMatch(
        /\.settings-pane__master-header\s*\{[^}]*?overflow:\s*hidden\b/,
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

    it("4-11. .settings-pane__master-item に視認性を高める背景色（var(--wa-color-surface-raised)）および境界線（var(--wa-color-border-subtle)）が定義されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-pane__master-item\s*\{[^}]*?background-color:\s*var\(--wa-color-surface-raised\b/,
      );
      expect(scss).toMatch(
        /\.settings-pane__master-item\s*\{[^}]*?border:\s*1px\s+solid\s+var\(--wa-color-border-subtle\b/,
      );
    });

    it("4-12. .settings-pane__issue-item に視認性を高める背景色（var(--wa-color-surface-raised)）および境界線（var(--wa-color-border-subtle)）が定義されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-pane__issue-item\s*\{[^}]*?background-color:\s*var\(--wa-color-surface-raised\b/,
      );
      expect(scss).toMatch(
        /\.settings-pane__issue-item\s*\{[^}]*?border:\s*1px\s+solid\s+var\(--wa-color-border-subtle\b/,
      );
    });

    it("4-13. .settings-pane__master-list および .settings-pane__issue-list にアイテム間の適切な余白（gap: var(--wa-space-xs, 6px)）が定義されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-pane__master-list\s*\{[^}]*?gap:\s*var\(--wa-space-xs,\s*6px\)/,
      );
      expect(scss).toMatch(
        /\.settings-pane__issue-list\s*\{[^}]*?gap:\s*var\(--wa-space-xs,\s*6px\)/,
      );
    });

    it("4-14. .settings-pane__master-item--selected および .settings-pane__issue-item--selected において、選択切り替え時の点滅を防ぐため transition: none が定義され、hover 時の背景色が選択時と同一に統一されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-pane__master-item--selected\s*\{[^}]*?transition:\s*none\b/,
      );
      expect(scss).toMatch(
        /\.settings-pane__master-item--selected:hover\s*\{[^}]*?background-color:\s*var\(--wa-color-neutral-fill-normal\)/,
      );
      expect(scss).toMatch(
        /\.settings-pane__issue-item--selected\s*\{[^}]*?transition:\s*none\b/,
      );
      expect(scss).toMatch(
        /\.settings-pane__issue-item--selected:hover\s*\{[^}]*?background-color:\s*var\(--wa-color-neutral-fill-normal\)/,
      );
    });
  });
  describe("5. 自動エクスポート（Auto Export）設定タブ機能", () => {
    const scssPath = path.resolve(__dirname, "./settings-pane.scss");
    let mockAutoExportCtrl: {
      state: {
        enabled: boolean;
        scheduleTimes: string[];
        lastExportedSlot?: string;
        lastExportedAt?: string;
      };
      setEnabled: ReturnType<typeof vi.fn>;
      addScheduleTime: ReturnType<typeof vi.fn>;
      removeScheduleTime: ReturnType<typeof vi.fn>;
      setScheduleTimes: ReturnType<typeof vi.fn>;
      triggerManualExport: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockAutoExportCtrl = {
        state: {
          enabled: true,
          scheduleTimes: ["08:00", "12:00", "17:15"],
          lastExportedSlot: "2026-11-03 12:00",
          lastExportedAt: "2026-11-03T12:00:03.000Z",
        },
        setEnabled: vi.fn(),
        addScheduleTime: vi.fn().mockReturnValue(true),
        removeScheduleTime: vi.fn(),
        setScheduleTimes: vi.fn(),
        triggerManualExport: vi.fn().mockResolvedValue(true),
      };
      (element as any).autoExportController = mockAutoExportCtrl;
    });

    it("5-1. wa-tab-group 内に panel='auto-export' の wa-tab および wa-tab-panel がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-tab[^>]*panel="auto-export"/);
      expect(htmlStr).toMatch(/<wa-tab-panel[^>]*name="auto-export"/);
    });

    it("5-2. 自動エクスポートタブ内に有効/無効切り替えスイッチ（wa-switch）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-switch[^>]*class="[^"]*settings-pane__export-switch[^"]*"/);
    });

    it("5-3. スイッチ操作で autoExportController.setEnabled が呼び出されること", () => {
      (element as any).handleToggleAutoExport({ target: { checked: false } } as unknown as Event);
      expect(mockAutoExportCtrl.setEnabled).toHaveBeenCalledWith(false);
    });

    it("5-4. 登録されたスケジュール時刻リストの各アイテムがレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("08:00");
      expect(htmlStr).toContain("12:00");
      expect(htmlStr).toContain("17:15");
    });

    it("5-5. 時刻追加ハンドラーで入力された時刻が autoExportController.addScheduleTime へ渡されること", () => {
      (element as any).newScheduleTimeInput = "15:30";
      (element as any).handleAddScheduleTime();
      expect(mockAutoExportCtrl.addScheduleTime).toHaveBeenCalledWith("15:30");
      expect((element as any).newScheduleTimeInput).toBe("");
    });

    it("5-6. 時刻削除ハンドラーで指定時刻が autoExportController.removeScheduleTime へ渡されること", () => {
      (element as any).handleRemoveScheduleTime("12:00");
      expect(mockAutoExportCtrl.removeScheduleTime).toHaveBeenCalledWith("12:00");
    });

    it("5-7. 手動エクスポートボタンクリックで autoExportController.triggerManualExport が呼び出されること", async () => {
      await (element as any).handleTriggerManualExport();
      expect(mockAutoExportCtrl.triggerManualExport).toHaveBeenCalled();
    });

    it("5-8. 新規時刻入力欄に wa-time-input が hour-format='24' 付きでレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-time-input[^>]*hour-format="24"/);
      expect(htmlStr).toMatch(/<wa-time-input[^>]*class="[^"]*settings-pane__time-input[^"]*"/);
    });

    it("5-9. Auto Export タブが左右2つのペイン（.settings-pane__export-layout, .settings-pane__export-main, .settings-pane__export-schedule-pane）で構成され、スケジュール一覧が右側に配置されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<div[^>]*class="[^"]*settings-pane__export-layout[^"]*"/);
      expect(htmlStr).toMatch(/<div[^>]*class="[^"]*settings-pane__export-main[^"]*"/);
      expect(htmlStr).toMatch(/<div[^>]*class="[^"]*settings-pane__export-schedule-pane[^"]*"/);
    });

    it("5-10. スケジュール時刻リスト（.settings-pane__schedule-list）にスクロール可能なスタイル（overflow-y: auto）が定義されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-pane__schedule-list\s*\{[\s\S]*?overflow-y:\s*auto\b/,
      );
    });
    it("5-11. 時刻追加フォーム（.settings-pane__schedule-form）が右ペイン（.settings-pane__export-schedule-pane）内に配置され、左ペインには含まれないこと", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-pane__export-schedule-pane[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*settings-pane__schedule-form[^"]*"/
      );
      const mainPaneMatch = htmlStr.match(
        /<div[^>]*class="[^"]*settings-pane__export-main[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="[^"]*settings-pane__export-schedule-pane[^"]*"/
      );
      expect(mainPaneMatch).toBeTruthy();
      expect(mainPaneMatch?.[1]).not.toContain("settings-pane__schedule-form");
    });
    it("5-12. 時刻追加ボタン（#settings-auto-export-add-btn）がプラスアイコン（plus-solid-full）かつ appearance='plain' で描画され、trigger='hover' のツールチップが付属すること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="settings-auto-export-add-btn"[^>]*trigger="hover"/,
      );
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="settings-auto-export-add-btn"[^>]*variant="neutral"[^>]*appearance="plain"[^>]*size="s"/,
      );
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="settings-auto-export-add-btn"[^>]*>[\s\S]*?<wa-icon[^>]*library="my-icons"[^>]*name="plus-solid-full"[^>]*><\/wa-icon>[\s\S]*?<\/wa-button>/,
      );
      expect(htmlStr).not.toMatch(
        /<wa-button[^>]*id="settings-auto-export-add-btn"[^>]*>[\s\S]*?slot="prefix"[\s\S]*?<\/wa-button>/,
      );
    });
    it("5-13. 時刻入力欄に値が入力されて追加ボタンがクリック可能になった場合、variant='brand' appearance='accent' および .settings-pane__btn-add-time--active で目立つスタイルになること", () => {
      (element as any).newScheduleTimeInput = "09:30";
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="settings-auto-export-add-btn"[^>]*variant="brand"[^>]*appearance="accent"/,
      );
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="settings-auto-export-add-btn"[^>]*class="[^"]*settings-pane__btn-add-time--active[^"]*"/,
      );
      expect(htmlStr).not.toMatch(
        /<wa-button[^>]*id="settings-auto-export-add-btn"[^>]*disabled/,
      );
    });
    it("5-14. .settings-pane__schedule-item および .settings-pane__export-status が Light/Dark 両モードで浮き上がって見えるよう background-color: var(--wa-color-surface-raised) が指定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.settings-pane__schedule-item\s*\{[\s\S]*?background-color:\s*var\(--wa-color-surface-raised\)/,
      );
      expect(scss).toMatch(
        /\.settings-pane__export-status\s*\{[\s\S]*?background-color:\s*var\(--wa-color-surface-raised\)/,
      );
    });
  });
});