import "fake-indexeddb/auto";
// @ts-ignore
import * as fs from "node:fs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { LabelsController } from "@/controllers/labels.controller.js";
import type { LabelRecord } from "@/db/models/navigation.model.js";
import { NavigationLabels } from "./navigation-labels";

/**
 * 【NavigationLabels 仕様 (Navigation Labels コンポーネント実装)】
 *
 * 1. タイトル部（Header）の描画と追加ボタン
 *    - 1-1. タイトル部に「LABELS」ラベルおよびツールチップ付き「追加ボタン」（btn-add-label、plus-solid-full アイコン）がレンダリングされること
 *    - 1-2. 追加ボタン押下ハンドラー（handleOpenAddDialog）の実行により、新規登録ダイアログが開状態（isAddDialogOpen = true）になること
 *
 * 2. コンテンツ部（Content）の描画とラベルボタン一覧
 *    - 2-1. コンテンツ部ラッパー（.labels-content）が存在すること
 *    - 2-2. labelsController.state のラベルレコード一覧がボタン（wa-button.label-btn）としてレンダリングされること
 *    - 2-3. 各ラベルボタン押下ハンドラー（handleToggleLabel(id)）の実行により、labelsController.toggleLabel が呼び出されること
 *    - 2-4. isSelected が true のラベルにはアクティブ状態を示すクラス（is-active）が付与されること
 *    - 2-5. 各ラベルボタンにメニュー（三点リーダー ellipsis-vertical-solid-full アイコン等）がレンダリングされること
 *    - 2-6. キーボード操作（handleLabelKeyDown で Enter または Space キー押下）により、toggleLabel が呼び出されること
 *
 * 3. 新規登録・編集ダイアログ（Dialog）の動作
 *    - 3-1. ラベル登録ダイアログ（wa-dialog#label-dialog）にタイトル入力欄（#label-name）、説明入力欄（#label-description）、保存ボタンがレンダリングされること
 *    - 3-2. 新規作成状態で保存ハンドラー（handleSaveLabel）を実行した際、labelsController.createLabel が入力値で呼び出され、ダイアログが閉じること
 *    - 3-3. ラベル編集メニューハンドラー（handleOpenEditDialog(label)）を実行した際、対象ラベルの値がセットされ、editingLabel が設定されること
 *    - 3-4. 編集状態で保存ハンドラー（handleSaveLabel）を実行した際、labelsController.updateLabel が対象IDと入力値で呼び出され、ダイアログが閉じること
 *
 * 4. 削除機能（Delete）の動作
 *    - 4-1. ラベル削除メニューハンドラー（handleOpenDeleteDialog(label)）を実行した際、削除確認ダイアログ（wa-dialog#delete-dialog）が開くこと
 *    - 4-2. 削除確定ハンドラー（handleConfirmDelete）を実行した際、labelsController.deleteLabel が呼び出され、ダイアログが閉じること
 *
 * 5. LabelsController 状態購読（Observer / Subscribe）とライフサイクル
 *    - 5-1. コントローラー設定時に controller.subscribe が呼び出され、リスナーが登録されること
 *    - 5-2. 登録されたリスナーが発火した際に requestUpdate が呼び出されること
 *    - 5-3. disconnectedCallback 呼び出し時に購読解除関数が実行されること
 *
 * 6. ダイアログ・ドロップダウンのスタイリングと Dark モード視認性仕様
 *    - 6-1. スタイルシートに wa-dialog::part(title) に対する文字色定義が含まれていること
 *    - 6-2. スタイルシートに .dialog-field に対するラベル文字色（form-control-label）定義が含まれていること
 *    - 6-3. Dark モード用の高コントラストカラー指定が含まれていること
 *    - 6-4. Dark モード時にダイアログ背景色がアプリ本体と同化しない独立サーフェス（#1c2128）および枠線（border）が定義されていること
 *    - 6-5. input および textarea の入力文字色（value-color / #ffffff）が定義されていること
 *    - 6-6. Dark モード時にドロップダウンメニューの文字色（#ffffff）および独立サーフェス背景色（#1c2128）が定義されていること
 *    - 6-7. メニュートリガーボタン（btn-label-menu）の Dark モード用高コントラストカラーおよびアクティブ時スタイルが定義されていること
 *
 * 7. コンテンツ部スクロールバー仕様（Scrollbar & Gutter）
 *    - 7-1. .labels-content にスクロールバー領域を常時確保する scrollbar-gutter: stable が定義されていること
 *    - 7-2. スクロールバーのサム色・トラック色が Light/Dark テーマ別 CSS 変数として定義されていること
 *    - 7-3. .labels-content にマイクロ角丸（border-radius: 2px）および幅 6px のスクロールバースタイルが定義されていること
 *
 * 8. 選択中ラベルの一括解除（Clear All Selected）
 *    - 8-1. ラベルが未選択（hasSelectedLabels === false）のとき、一括解除ボタン（#btn-clear-labels）が表示されないこと
 *    - 8-2. ラベルが1件以上選択中（hasSelectedLabels === true）のとき、一括解除ボタン（#btn-clear-labels）が表示されること
 *    - 8-3. 一括解除ボタン押下（handleClearAllSelected）時に labelsController.clearAllSelected が呼び出されること
 */

describe("NavigationLabels Component", () => {
  let element: NavigationLabels;
  let mockLabelsController: {
    state: LabelRecord[];
    readonly hasSelectedLabels: boolean;
    createLabel: ReturnType<typeof vi.fn>;
    updateLabel: ReturnType<typeof vi.fn>;
    deleteLabel: ReturnType<typeof vi.fn>;
    toggleLabel: ReturnType<typeof vi.fn>;
    clearAllSelected: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let labelsUnsubMock: ReturnType<typeof vi.fn>;

  const initialLabels: LabelRecord[] = [
    {
      id: 1,
      name: "プロジェクトA",
      description: "重要プロジェクト",
      isSelected: false,
    },
    {
      id: 2,
      name: "プライベート",
      description: "個人的なタスク",
      isSelected: true,
    },
  ];

  beforeEach(() => {
    element = new NavigationLabels();

    labelsUnsubMock = vi.fn();

    mockLabelsController = {
      state: [...initialLabels],
      get hasSelectedLabels(): boolean {
        return this.state.some((l) => l.isSelected);
      },
      createLabel: vi.fn().mockResolvedValue(3),
      updateLabel: vi.fn().mockResolvedValue(undefined),
      deleteLabel: vi.fn().mockResolvedValue(undefined),
      toggleLabel: vi.fn().mockResolvedValue(undefined),
      clearAllSelected: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(labelsUnsubMock),
    };

    element.labelsController =
      mockLabelsController as unknown as LabelsController;
  });

  describe("1. タイトル部（Header）の描画と追加ボタン", () => {
    it("1-1. タイトル部に「LABELS」ラベルおよびツールチップ付き「追加ボタン」（btn-add-label、plus-solid-full アイコン）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("LABELS");
      expect(htmlStr).toContain("btn-add-label");
      expect(htmlStr).toContain("plus-solid-full");
    });

    it("1-2. 追加ボタン押下ハンドラー（handleOpenAddDialog）の実行により、新規登録ダイアログが開状態（isAddDialogOpen = true）になること", () => {
      expect(typeof element.handleOpenAddDialog).toBe("function");
      element.handleOpenAddDialog();
      expect(element.isAddDialogOpen).toBe(true);
      expect(element.editingLabel).toBeNull();
    });
  });

  describe("2. コンテンツ部（Content）の描画とラベルボタン一覧", () => {
    it("2-1. コンテンツ部ラッパー（.labels-content）が存在すること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("labels-content");
    });

    it("2-2. labelsController.state のラベルレコード一覧がボタン（wa-button.label-btn）としてレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("プロジェクトA");
      expect(htmlStr).toContain("プライベート");
      expect(htmlStr).toContain("label-btn");
    });

    it("2-3. 各ラベルボタン押下ハンドラー（handleToggleLabel(id)）の実行により、labelsController.toggleLabel が呼び出されること", () => {
      expect(typeof element.handleToggleLabel).toBe("function");
      element.handleToggleLabel(1);
      expect(mockLabelsController.toggleLabel).toHaveBeenCalledWith(1);
    });

    it("2-4. isSelected が true のラベルにはアクティブ状態を示すクラス（is-active）が付与されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("is-active");
    });

    it("2-5. 各ラベルボタンにメニュー（三点リーダー ellipsis-vertical-solid-full アイコン等）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("ellipsis-vertical-solid-full");
    });

    it("2-6. キーボード操作（handleLabelKeyDown で Enter または Space キー押下）により、toggleLabel が呼び出されること", () => {
      const preventDefaultEnter = vi.fn();
      const enterEvent = { key: "Enter", preventDefault: preventDefaultEnter } as unknown as KeyboardEvent;
      element.handleLabelKeyDown(enterEvent, 1);
      expect(preventDefaultEnter).toHaveBeenCalled();
      expect(mockLabelsController.toggleLabel).toHaveBeenCalledWith(1);

      const preventDefaultSpace = vi.fn();
      const spaceEvent = { key: " ", preventDefault: preventDefaultSpace } as unknown as KeyboardEvent;
      element.handleLabelKeyDown(spaceEvent, 2);
      expect(preventDefaultSpace).toHaveBeenCalled();
      expect(mockLabelsController.toggleLabel).toHaveBeenCalledWith(2);
    });
  });

  describe("3. 新規登録・編集ダイアログ（Dialog）の動作", () => {
    it("3-1. ラベル登録ダイアログ（wa-dialog#label-dialog）にタイトル入力欄（#label-name）、説明入力欄（#label-description）、保存ボタンがレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("label-dialog");
      expect(htmlStr).toContain("label-name");
      expect(htmlStr).toContain("label-description");
    });

    it("3-2. 新規作成状態で保存ハンドラー（handleSaveLabel）を実行した際、labelsController.createLabel が入力値で呼び出され、ダイアログが閉じること", async () => {
      element.isAddDialogOpen = true;
      element.editingLabel = null;
      element.inputName = "新ラベル";
      element.inputDescription = "新説明文";

      await element.handleSaveLabel();

      expect(mockLabelsController.createLabel).toHaveBeenCalledWith({
        name: "新ラベル",
        description: "新説明文",
      });
      expect(element.isAddDialogOpen).toBe(false);
    });

    it("3-3. ラベル編集メニューハンドラー（handleOpenEditDialog(label)）を実行した際、対象ラベルの値がセットされ、editingLabel が設定されること", () => {
      const targetLabel = initialLabels[0];
      element.handleOpenEditDialog(targetLabel);

      expect(element.isAddDialogOpen).toBe(true);
      expect(element.editingLabel).toEqual(targetLabel);
      expect(element.inputName).toBe("プロジェクトA");
      expect(element.inputDescription).toBe("重要プロジェクト");
    });

    it("3-4. 編集状態で保存ハンドラー（handleSaveLabel）を実行した際、labelsController.updateLabel が対象IDと入力値で呼び出され、ダイアログが閉じること", async () => {
      element.isAddDialogOpen = true;
      element.editingLabel = {
        id: 1,
        name: "旧名前",
        description: "旧説明",
        isSelected: false,
      };
      element.inputName = "更新後名前";
      element.inputDescription = "更新後説明";

      await element.handleSaveLabel();

      expect(mockLabelsController.updateLabel).toHaveBeenCalledWith(1, {
        name: "更新後名前",
        description: "更新後説明",
      });
      expect(element.isAddDialogOpen).toBe(false);
    });
  });

  describe("4. 削除機能（Delete）の動作", () => {
    it("4-1. ラベル削除メニューハンドラー（handleOpenDeleteDialog(label)）を実行した際、削除確認ダイアログ（wa-dialog#delete-dialog）が開くこと", () => {
      const targetLabel = initialLabels[0];
      element.handleOpenDeleteDialog(targetLabel);

      expect(element.isDeleteDialogOpen).toBe(true);
      expect(element.deletingLabel).toEqual(targetLabel);

      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("delete-dialog");
    });

    it("4-2. 削除確定ハンドラー（handleConfirmDelete）を実行した際、labelsController.deleteLabel が呼び出され、ダイアログが閉じること", async () => {
      element.isDeleteDialogOpen = true;
      element.deletingLabel = initialLabels[0];

      await element.handleConfirmDelete();

      expect(mockLabelsController.deleteLabel).toHaveBeenCalledWith(1);
      expect(element.isDeleteDialogOpen).toBe(false);
      expect(element.deletingLabel).toBeNull();
    });
  });

  describe("5. LabelsController 状態購読（Observer / Subscribe）とライフサイクル", () => {
    it("5-1. コントローラー設定時に controller.subscribe が呼び出され、リスナーが登録されること", () => {
      expect(mockLabelsController.subscribe).toHaveBeenCalled();
    });

    it("5-2. 登録されたリスナーが発火した際に requestUpdate が呼び出されること", () => {
      const requestUpdateSpy = vi.spyOn(element, "requestUpdate");
      const subscribeCallback = mockLabelsController.subscribe.mock.calls[0][0];
      subscribeCallback();
      expect(requestUpdateSpy).toHaveBeenCalled();
    });

    it("5-3. disconnectedCallback 呼び出し時に購読解除関数が実行されること", () => {
      element.disconnectedCallback();
      expect(labelsUnsubMock).toHaveBeenCalled();
    });
  });

  describe("6. ダイアログのスタイリングと Dark モード視認性仕様", () => {
    it("6-1. スタイルシートに wa-dialog::part(title) に対する文字色定義が含まれていること", () => {
      const scssContent = fs.readFileSync(
        new URL("./navigation-labels.scss", import.meta.url),
        "utf-8",
      );
      expect(scssContent).toContain("wa-dialog");
      expect(scssContent).toContain("part(title)");
    });

    it("6-2. スタイルシートに .dialog-field に対するラベル文字色（form-control-label）定義が含まれていること", () => {
      const scssContent = fs.readFileSync(
        new URL("./navigation-labels.scss", import.meta.url),
        "utf-8",
      );
      expect(scssContent).toContain("form-control-label");
    });

    it("6-3. Dark モード用の高コントラストカラー指定が含まれていること", () => {
      const scssContent = fs.readFileSync(
        new URL("./navigation-labels.scss", import.meta.url),
        "utf-8",
      );
      expect(scssContent).toContain("prefers-color-scheme: dark");
      expect(scssContent).toContain("#ffffff");
    });

    it("6-4. Dark モード時にダイアログ背景色がアプリ本体と同化しない独立サーフェス（#1c2128）および枠線（border）が定義されていること", () => {
      const scssContent = fs.readFileSync(
        new URL("./navigation-labels.scss", import.meta.url),
        "utf-8",
      );
      expect(scssContent).toContain("#1c2128");
      expect(scssContent).toContain("#444c56");
      expect(scssContent).toContain("box-shadow");
    });

    it("6-5. input および textarea の入力文字色（value-color / #ffffff）が定義されていること", () => {
      const scssContent = fs.readFileSync(
        new URL("./navigation-labels.scss", import.meta.url),
        "utf-8",
      );
      expect(scssContent).toContain("--wa-form-control-value-color");
      expect(scssContent).toContain("part(input)");
      expect(scssContent).toContain("part(textarea)");
    });

    it("6-6. Dark モード時にドロップダウンメニューの文字色（#ffffff）および独立サーフェス背景色（#1c2128）が定義されていること", () => {
      const scssContent = fs.readFileSync(
        new URL("./navigation-labels.scss", import.meta.url),
        "utf-8",
      );
      expect(scssContent).toContain("wa-dropdown");
      expect(scssContent).toContain("wa-dropdown-item");
      expect(scssContent).toContain("--wa-color-danger-on-quiet");
      expect(scssContent).toContain("#ff7b72");
    });

    it("6-7. メニュートリガーボタン（btn-label-menu）の Dark モード用高コントラストカラーおよびアクティブ時スタイルが定義されていること", () => {
      const scssContent = fs.readFileSync(
        new URL("./navigation-labels.scss", import.meta.url),
        "utf-8",
      );
      expect(scssContent).toContain("--label-menu-trigger-color");
      expect(scssContent).toContain("--label-menu-trigger-active-color");
      expect(scssContent).toContain("#c9d1d9");
      expect(scssContent).toContain("btn-label-menu");
    });

    it("7-1. .labels-content にスクロールバー領域を常時確保する scrollbar-gutter: stable が定義されていること", () => {
      const scssContent = fs.readFileSync(
        new URL("./navigation-labels.scss", import.meta.url),
        "utf-8",
      );
      expect(scssContent).toContain("scrollbar-gutter: stable");
    });

    it("7-2. スクロールバーのサム色・トラック色が Light/Dark テーマ別 CSS 変数として定義されていること", () => {
      const scssContent = fs.readFileSync(
        new URL("./navigation-labels.scss", import.meta.url),
        "utf-8",
      );
      expect(scssContent).toContain("--scrollbar-thumb-color");
      expect(scssContent).toContain("--scrollbar-thumb-hover-color");
      expect(scssContent).toContain("--scrollbar-track-color");
      expect(scssContent).toContain("#d0d7de");
      expect(scssContent).toContain("#30363d");
    });

    it("7-3. .labels-content にマイクロ角丸（border-radius: 2px）および幅 6px のスクロールバースタイルが定義されていること", () => {
      const scssContent = fs.readFileSync(
        new URL("./navigation-labels.scss", import.meta.url),
        "utf-8",
      );
      expect(scssContent).toContain("::-webkit-scrollbar");
      expect(scssContent).toContain("width: 6px");
      expect(scssContent).toContain("border-radius: 2px");
      expect(scssContent).toContain("scrollbar-width: thin");
      expect(scssContent).toContain("scrollbar-color");
    });
  });

  describe("8. 選択中ラベルの一括解除（Clear All Selected）", () => {
    it("8-1. ラベルが未選択（hasSelectedLabels === false）のとき、一括解除ボタン（#btn-clear-labels）が表示されないこと", () => {
      mockLabelsController.state = [
        { id: 1, name: "ラベル1", description: "", isSelected: false },
        { id: 2, name: "ラベル2", description: "", isSelected: false },
      ];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("btn-clear-labels");
    });

    it("8-2. ラベルが1件以上選択中（hasSelectedLabels === true）のとき、一括解除ボタン（#btn-clear-labels、xmark-solid-full アイコン）が表示されること", () => {
      mockLabelsController.state = [
        { id: 1, name: "ラベル1", description: "", isSelected: false },
        { id: 2, name: "ラベル2", description: "", isSelected: true },
      ];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("btn-clear-labels");
      expect(htmlStr).toContain("xmark-solid-full");
    });

    it("8-3. 一括解除ボタン押下（handleClearAllSelected）時に labelsController.clearAllSelected が呼び出されること", async () => {
      expect(typeof element.handleClearAllSelected).toBe("function");
      await element.handleClearAllSelected();
      expect(mockLabelsController.clearAllSelected).toHaveBeenCalledTimes(1);
    });
  });
});
