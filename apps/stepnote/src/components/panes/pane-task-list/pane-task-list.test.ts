import "fake-indexeddb/auto";
import * as fs from "node:fs";
import { describe, it, expect, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { PaneTaskList } from "./pane-task-list";

/**
 * 【PaneTaskList 仕様 (Phase 1: Task List パネル基本レイアウトおよび構造実装)】
 *
 * 1. パネル基本レイアウトおよび3領域構造（ヘッダ部、検索部、リスト部）
 *    - [x] 1-1. パネルルート内にヘッダ部（pane-task-list__header）、検索部（pane-task-list__search）、リスト部（pane-task-list__list）がレンダリングされること
 *    - [x] 1-2. 各領域に簡易BEMクラス（pane-task-list__*）が付与されていること
 *
 * 2. ヘッダ部（Header）の表示とアクションボタンの配置
 *    - [x] 2-1. ヘッダ部タイトルに「LIST」および選択中の年度が表示されること（例: LIST 2026）
 *    - [x] 2-2. ヘッダ部に年度指定ボタン（pane-task-list__btn-year）が配置され、アイコンおよびツールチップが設定されていること
 *    - [x] 2-3. ヘッダ部にタスク追加ボタン（pane-task-list__btn-add）が配置され、プラスアイコンおよびツールチップが設定されていること
 *
 * 3. 検索部（Search）における共通コンポーネント連携
 *    - [x] 3-1. 検索部に共通部品 search-input がレンダリングされること
 *    - [x] 3-2. search-input にサイズ属性（s）が指定されていること
 *
 * 4. リスト部（List）における仮想スクロールコンテナ
 *    - [x] 4-1. リスト部内に仮想スクロール要素（lit-virtualizer）がレンダリングされること
 *    - [x] 4-2. タスクが0件のとき、空状態を示す要素（pane-task-list__empty）がレンダリングされること
 *
 * 5. BEM設計およびSCSSスタイルの検証
 *    - [x] 5-1. SCSSスタイルシートが存在し、ルートブロック .pane-task-list および主要要素のBEMセレクタが定義されていること
 *    - [x] 5-2. 背景色および境界線に正式なデザイントークン（--wa-color-surface-default, --wa-color-surface-border）が適用されていること
 *    - [x] 5-3. 縮小アニメーション時のレイアウト崩れを防止するため、ルート要素 .pane-task-list に最小幅（min-width）が設定されていること
 */

describe("PaneTaskList Component (Phase 1: Layout & Structure)", () => {
  let element: PaneTaskList;

  beforeEach(() => {
    element = new PaneTaskList();
    element.fiscalYear = 2026;
  });

  describe("1. パネル基本レイアウトおよび3領域構造", () => {
    it("1-1. パネルルート内にヘッダ部、検索部、リスト部がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("pane-task-list__header");
      expect(htmlStr).toContain("pane-task-list__search");
      expect(htmlStr).toContain("pane-task-list__list");
    });

    it("1-2. 各領域に簡易BEMクラス（pane-task-list__*）が付与されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("pane-task-list__header");
      expect(htmlStr).toContain("pane-task-list__title");
      expect(htmlStr).toContain("pane-task-list__actions");
      expect(htmlStr).toContain("pane-task-list__search");
      expect(htmlStr).toContain("pane-task-list__list");
    });
  });

  describe("2. ヘッダ部（Header）の表示とアクションボタンの配置", () => {
    it("2-1. ヘッダ部タイトルに「LIST」および選択中の年度が表示されること", () => {
      element.fiscalYear = 2026;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("LIST");
      expect(htmlStr).toContain("2026");
    });

    it("2-2. ヘッダ部に年度指定ボタン（pane-task-list__btn-year）が配置され、アイコンおよびツールチップが設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("pane-task-list__btn-year");
      expect(htmlStr).toContain("wa-tooltip");
      expect(htmlStr).toContain("wa-button");
    });

    it("2-3. ヘッダ部にタスク追加ボタン（pane-task-list__btn-add）が配置され、プラスアイコンおよびツールチップが設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("pane-task-list__btn-add");
      expect(htmlStr).toContain("plus-solid-full");
      expect(htmlStr).toContain("wa-tooltip");
      expect(htmlStr).toContain("wa-button");
    });
  });

  describe("3. 検索部（Search）における共通コンポーネント連携", () => {
    it("3-1. 検索部に共通部品 search-input がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("search-input");
      expect(htmlStr).toContain("pane-task-list__search-input");
    });

    it("3-2. search-input にサイズ属性（s）が指定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/size=["']s["']/);
    });
  });

  describe("4. リスト部（List）における仮想スクロールコンテナ", () => {
    it("4-1. リスト部内に仮想スクロール要素（lit-virtualizer）がレンダリングされること", () => {
      element.tasks = [
        {
          id: 1,
          name: "テストタスク",
          dueDate: new Date(2026, 3, 1),
          fiscalYear: 2026,
          labelId: 1,
          statusCode: 0,
          bookmark: false,
          contacts: [],
          description: "",
          selected: false,
        },
      ];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("lit-virtualizer");
    });

    it("4-2. タスクが0件のとき、空状態を示す要素（pane-task-list__empty）がレンダリングされること", () => {
      element.tasks = [];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("pane-task-list__empty");
    });
  });

  describe("5. BEM設計およびSCSSスタイルの検証", () => {
    it("5-1. SCSSスタイルシートが存在し、ルートブロック .pane-task-list および主要要素のBEMセレクタが定義されていること", () => {
      const scssPath = new URL("./pane-task-list.scss", import.meta.url);
      expect(fs.existsSync(scssPath)).toBe(true);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toContain(".pane-task-list");
      expect(scssContent).toContain("&__header");
      expect(scssContent).toContain("&__search");
      expect(scssContent).toContain("&__list");
    });

    it("5-2. 背景色および境界線に正式なデザイントークン（--wa-color-surface-default, --wa-color-surface-border）が適用されていること", () => {
      const scssPath = new URL("./pane-task-list.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toContain("var(--wa-color-surface-default)");
      expect(scssContent).toContain("var(--wa-color-surface-border)");
      expect(scssContent).not.toContain("--stepnote-bg-primary");
      expect(scssContent).not.toContain("--stepnote-border-color");
    });

    it("5-3. 縮小アニメーション時のレイアウト崩れを防止するため、ルート要素 .pane-task-list に最小幅（min-width）が設定されていること", () => {
      const scssPath = new URL("./pane-task-list.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      const rootBlockMatch = scssContent.match(/\.pane-task-list\s*\{[\s\S]*?\n\}/);
      expect(rootBlockMatch).not.toBeNull();
      expect(rootBlockMatch![0]).toMatch(/min-width:\s*(?:var\(--stepnote-pane-task-list-width[^)]*\)|310px)/);
    });
  });

  describe("6. タスク新規作成ダイアログ連携 (Phase 2: #110)", () => {
    it("6-1. テンプレート内に task-create-dialog がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-create-dialog");
    });

    it("6-2. 新規追加ボタンのクリックハンドラー実行により、isCreateDialogOpen が true になること", () => {
      expect(element.isCreateDialogOpen).toBe(false);
      element.handleOpenCreateDialog();
      expect(element.isCreateDialogOpen).toBe(true);
    });

    it("6-3. クローズハンドラー実行により、isCreateDialogOpen が false になること", () => {
      element.isCreateDialogOpen = true;
      element.handleCloseCreateDialog();
      expect(element.isCreateDialogOpen).toBe(false);
    });
  });
});
