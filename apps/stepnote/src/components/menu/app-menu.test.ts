import "fake-indexeddb/auto";
import * as fs from "node:fs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import { AppMenu } from "./app-menu.js";

/**
 * 【AppMenu 仕様 (メニュー独立コンポーネント化)】
 *
 * 1. メニュー内部の上下分離構造
 *    - [ ] 1-1. メニュー内部に上下分離コンテナ（app-menu__primary, app-menu__secondary）がレンダリングされること
 *
 * 2. サイドパネル開閉操作ボタンのレンダリングとアクセシビリティ
 *    - [ ] 2-1. app-menu__primary 内に開閉ボタン（wa-button[appearance='plain']）、ツールチップ（wa-tooltip）、アイコン（wa-icon[name='chevron-right']）がレンダリングされること
 *    - [ ] 2-2. isNavigationListAreaOpen が true（開状態）の際、ツールチップ文言が「サイドパネルを閉じる」であり、アイコンに is-open クラスが付与されること
 *    - [ ] 2-3. isNavigationListAreaOpen が false（閉状態）の際、ツールチップ文言が「サイドパネルを開く」であり、アイコンに is-closed クラスが付与されること
 *
 * 3. 開閉ボタンクリックによる LayoutUIController 連動
 *    - [ ] 3-1. handleToggleNavigationList の呼び出しにより layoutUIController.toggleNavigationListArea が実行されること
 *
 * 4. 簡易BEM設計とクラス付与
 *    - [ ] 4-1. 各要素に簡易BEMクラス（app-menu__*）が付与されていること
 *    - [ ] 4-2. コンポーネントテンプレートおよびSCSSスタイルシートから旧クラス名が完全に排除されていること
 *
 * 5. 集中モード切替ボタンのレンダリングとアクセシビリティ
 *    - [ ] 5-1. app-menu__primary 内に集中モード切替ボタン（wa-button#app-menu-zen-btn）、ツールチップ（wa-tooltip）、アイコン（wa-icon）がレンダリングされること
 *    - [ ] 5-2. isZenMode が false（通常表示）の際、ツールチップ文言が「集中モードを有効化（左右ペインを折りたたむ）」であり、アイコン名が expand-solid-full であること
 *    - [ ] 5-3. isZenMode が true（集中モード）の際、ツールチップ文言が「集中モードを解除（元のレイアウトに復帰）」であり、アイコン名が compress-solid-full であること
 *
 * 6. 集中モード切替ボタンクリックによる LayoutUIController 連動
 *    - [ ] 6-1. handleToggleZenMode の呼び出しにより layoutUIController.toggleZenMode が実行されること
 *
 * 7. クイック新規タスク作成ボタンのレンダリングとアクセシビリティ
 *    - [ ] 7-1. app-menu__primary 内に新規タスク作成ボタン（wa-button#app-menu-task-create-btn）、ツールチップ、アイコン（plus-solid-full）がレンダリングされること
 *    - [ ] 7-2. ボタンの配置順序が「開閉ボタン」→「クイック作成ボタン」→「集中モードボタン」の順であること
 *    - [ ] 7-3. hasLabels が true の際、ボタンが活性化（disabled属性なし）され、ツールチップ文言が「新規タスクを作成 (Alt+N)」であること
 *    - [ ] 7-4. hasLabels が false の際、ボタンが無効化（disabled属性あり）され、ツールチップ文言が「ラベルを登録してください」であること
 *
 * 8. クイック新規タスク作成ボタンクリックによるカスタムイベント発行
 *    - [ ] 8-1. hasLabels が true の際、handleCreateTask の呼び出しによりカスタムイベント request-task-create がディスパッチされること
 *    - [ ] 8-2. hasLabels が false の際、handleCreateTask を実行してもイベントがディスパッチされないこと
 *
 * 9. スクラッチモード切替ボタンのレンダリングとアクセシビリティ
 *    - [ ] 9-1. app-menu__primary 内にスクラッチ切替ボタン（wa-button#app-menu-scratch-btn）、ツールチップ（wa-tooltip）、アイコン（wa-icon[name='pen-to-square-solid-full']）がレンダリングされること
 *    - [ ] 9-2. ボタンの配置順序が「開閉ボタン」→「クイック作成ボタン」→「スクラッチボタン」→「集中モードボタン」の順であること
 *    - [ ] 9-3. isScratchMode が false の際、ツールチップ文言が「スクラッチモード（アプリ共通メモ）を開く」であること
 *    - [ ] 9-4. isScratchMode が true の際、ツールチップ文言が「スクラッチモードを終了」であり、ボタンに is-active クラスが付与されること
 *
 * 10. スクラッチモード切替ボタンクリックによる LayoutUIController 連動
 *    - [ ] 10-1. handleToggleScratchMode の呼び出しにより layoutUIController.toggleScratchMode が実行されること
 *
 * 11. スクラッチモード有効時における他のボタンの無効化（disabled）
 *    - [ ] 11-1. isScratchMode が true の際、開閉ボタン（#app-menu-toggle-btn）、新規タスク作成ボタン（#app-menu-task-create-btn）、集中モードボタン（#app-menu-zen-btn）に disabled 属性が付与されること
 */

describe("AppMenu Component", () => {
  let appMenu: AppMenu;
  let mockLayoutUIController: Partial<LayoutUIController> & {
    toggleZenMode?: () => void;
  };

  beforeEach(() => {
    appMenu = new AppMenu();
    mockLayoutUIController = {
      toggleNavigationListArea: vi.fn(),
      toggleZenMode: vi.fn(),
    };
    appMenu.layoutUIController = mockLayoutUIController as LayoutUIController;
  });

  describe("1. メニュー内部の上下分離構造", () => {
    it("1-1. メニュー内部に上下分離コンテナ（app-menu__primary, app-menu__secondary）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).toContain("app-menu__primary");
      expect(htmlStr).toContain("app-menu__secondary");
    });
  });

  describe("2. サイドパネル開閉操作ボタンのレンダリングとアクセシビリティ", () => {
    it("2-1. app-menu__primary 内に開閉ボタン（wa-button[appearance='plain']）、ツールチップ（wa-tooltip）、アイコン（wa-icon[name='chevron-right']）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).toContain("wa-tooltip");
      expect(htmlStr).toContain("wa-button");
      expect(htmlStr).toContain("plain");
      expect(htmlStr).toContain("wa-icon");
      expect(htmlStr).toContain("chevron-right");
    });

    it("2-2. isNavigationListAreaOpen が true（開状態）の際、ツールチップ文言が「サイドパネルを閉じる」であり、アイコンに is-open クラスが付与されること", () => {
      appMenu.isNavigationListAreaOpen = true;
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).toContain("サイドパネルを閉じる");
      expect(htmlStr).toContain("is-open");
    });

    it("2-3. isNavigationListAreaOpen が false（閉状態）の際、ツールチップ文言が「サイドパネルを開く」であり、アイコンに is-closed クラスが付与されること", () => {
      appMenu.isNavigationListAreaOpen = false;
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).toContain("サイドパネルを開く");
      expect(htmlStr).toContain("is-closed");
    });
  });

  describe("3. 開閉ボタンクリックによる LayoutUIController 連動", () => {
    it("3-1. handleToggleNavigationList の呼び出しにより layoutUIController.toggleNavigationListArea が実行されること", () => {
      expect(typeof appMenu.handleToggleNavigationList).toBe("function");
      appMenu.handleToggleNavigationList();
      expect(
        mockLayoutUIController.toggleNavigationListArea,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("4. 簡易BEM設計とクラス付与", () => {
    it("4-1. 各要素に簡易BEMクラス（app-menu__*）が付与されていること", () => {
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).toContain("app-menu__primary");
      expect(htmlStr).toContain("app-menu__secondary");
      expect(htmlStr).toContain("app-menu__toggle-btn");
      expect(htmlStr).toContain("app-menu__toggle-icon");
      expect(htmlStr).toContain("app-menu__zen-btn");
      expect(htmlStr).toContain("app-menu__zen-icon");
      expect(htmlStr).toContain("app-menu__task-create-btn");
      expect(htmlStr).toContain("app-menu__task-create-icon");
    });

    it("4-2. コンポーネントテンプレートおよびSCSSスタイルシートから旧クラス名が完全に排除されていること", () => {
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).not.toContain("pane-menu__");
      expect(htmlStr).not.toContain("menu-primary");
      expect(htmlStr).not.toContain("menu-secondary");
      expect(htmlStr).not.toContain("btn-toggle-sidebar");
      expect(htmlStr).not.toContain("icon-toggle-sidebar");

      const scssContent = fs.readFileSync(
        new URL("./app-menu.scss", import.meta.url),
        "utf-8",
      );
      expect(scssContent).not.toContain("pane-menu__");
      expect(scssContent).not.toContain("menu-primary");
      expect(scssContent).not.toContain("menu-secondary");
      expect(scssContent).not.toContain("btn-toggle-sidebar");
      expect(scssContent).not.toContain("icon-toggle-sidebar");
    });
  });

  describe("5. 集中モード切替ボタンのレンダリングとアクセシビリティ", () => {
    it("5-1. app-menu__primary 内に集中モード切替ボタン（wa-button#app-menu-zen-btn）、ツールチップ（wa-tooltip）、アイコン（wa-icon）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).toContain("app-menu-zen-btn");
      expect(htmlStr).toContain("app-menu__zen-btn");
      expect(htmlStr).toContain("app-menu__zen-icon");
    });

    it("5-2. isZenMode が false（通常表示）の際、ツールチップ文言が「集中モードを有効化（左右ペインを折りたたむ）」であり、アイコン名が expand-solid-full であること", () => {
      (appMenu as unknown as { isZenMode: boolean }).isZenMode = false;
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).toContain("集中モードを有効化（左右ペインを折りたたむ）");
      expect(htmlStr).toContain("expand-solid-full");
    });

    it("5-3. isZenMode が true（集中モード）の際、ツールチップ文言が「集中モードを解除（元のレイアウトに復帰）」であり、アイコン名が compress-solid-full であること", () => {
      (appMenu as unknown as { isZenMode: boolean }).isZenMode = true;
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).toContain("集中モードを解除（元のレイアウトに復帰）");
      expect(htmlStr).toContain("compress-solid-full");
    });
  });

  describe("6. 集中モード切替ボタンクリックによる LayoutUIController 連動", () => {
    it("6-1. handleToggleZenMode の呼び出しにより layoutUIController.toggleZenMode が実行されること", () => {
      expect(
        typeof (appMenu as unknown as { handleToggleZenMode: () => void })
          .handleToggleZenMode,
      ).toBe("function");
      (
        appMenu as unknown as { handleToggleZenMode: () => void }
      ).handleToggleZenMode();
      expect(mockLayoutUIController.toggleZenMode).toHaveBeenCalledTimes(1);
    });
  });

  describe("7. クイック新規タスク作成ボタンのレンダリングとアクセシビリティ", () => {
    it("7-1. app-menu__primary 内に新規タスク作成ボタン（wa-button#app-menu-task-create-btn）、ツールチップ、アイコン（plus-solid-full）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).toContain("app-menu-task-create-btn");
      expect(htmlStr).toContain("app-menu__task-create-btn");
      expect(htmlStr).toContain("app-menu__task-create-icon");
      expect(htmlStr).toContain("plus-solid-full");
    });

    it("7-2. ボタンの配置順序が「開閉ボタン」→「クイック作成ボタン」→「集中モードボタン」の順であること", () => {
      const htmlStr = flattenTemplate(appMenu.render());
      const toggleIndex = htmlStr.indexOf("app-menu-toggle-btn");
      const createIndex = htmlStr.indexOf("app-menu-task-create-btn");
      const zenIndex = htmlStr.indexOf("app-menu-zen-btn");
      expect(toggleIndex).toBeGreaterThan(-1);
      expect(createIndex).toBeGreaterThan(toggleIndex);
      expect(zenIndex).toBeGreaterThan(createIndex);
    });

    it("7-3. hasLabels が true の際、ボタンが活性化（disabled属性なし）され、ツールチップ文言が「新規タスクを作成 (Alt+N)」であること", () => {
      (appMenu as any).labelsController = {
        hasLabels: true,
      };
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="app-menu-task-create-btn"[^>]*>[\s\S]*?新規タスクを作成 \(Alt\+N\)[\s\S]*?<\/wa-tooltip>/,
      );
      expect(htmlStr).not.toMatch(
        /<wa-button[^>]*id="app-menu-task-create-btn"[^>]*\bdisabled\b/,
      );
    });

    it("7-4. hasLabels が false の際、ボタンが無効化（disabled属性あり）され、ツールチップ文言が「ラベルを登録してください」であること", () => {
      (appMenu as any).labelsController = {
        hasLabels: false,
      };
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="app-menu-task-create-btn"[^>]*>[\s\S]*?ラベルを登録してください[\s\S]*?<\/wa-tooltip>/,
      );
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="app-menu-task-create-btn"[^>]*\bdisabled\b/,
      );
    });
  });

  describe("8. クイック新規タスク作成ボタンクリックによるカスタムイベント発行", () => {
    it("8-1. hasLabels が true の際、handleCreateTask の呼び出しによりカスタムイベント request-task-create がディスパッチされること", () => {
      (appMenu as any).labelsController = {
        hasLabels: true,
      };
      const dispatchSpy = vi.spyOn(appMenu, "dispatchEvent");
      (appMenu as any).handleCreateTask();
      expect(dispatchSpy).toHaveBeenCalled();
      const dispatchedEvent = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(dispatchedEvent.type).toBe("request-task-create");
      expect(dispatchedEvent.bubbles).toBe(true);
      expect(dispatchedEvent.composed).toBe(true);
    });

    it("8-2. hasLabels が false の際、handleCreateTask を実行してもイベントがディスパッチされないこと", () => {
      (appMenu as any).labelsController = {
        hasLabels: false,
      };
      const dispatchSpy = vi.spyOn(appMenu, "dispatchEvent");
      (appMenu as any).handleCreateTask();
      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  describe("9. スクラッチモード切替ボタンのレンダリングとアクセシビリティ", () => {
    it("9-1. app-menu__primary 内にスクラッチ切替ボタン（wa-button#app-menu-scratch-btn）、ツールチップ（wa-tooltip）、アイコン（wa-icon[name='pen-to-square-solid-full']）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="app-menu-scratch-btn"[^>]*class="[^"]*app-menu__scratch-btn[^"]*"/,
      );
      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="app-menu-scratch-btn"[^>]*>/,
      );
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*name="pen-to-square-solid-full"[^>]*class="[^"]*app-menu__scratch-icon[^"]*"/,
      );
    });

    it("9-2. ボタンの配置順序が「開閉ボタン」→「クイック作成ボタン」→「スクラッチボタン」→「集中モードボタン」の順であること", () => {
      const htmlStr = flattenTemplate(appMenu.render());
      const toggleIndex = htmlStr.indexOf('id="app-menu-toggle-btn"');
      const createIndex = htmlStr.indexOf('id="app-menu-task-create-btn"');
      const scratchIndex = htmlStr.indexOf('id="app-menu-scratch-btn"');
      const zenIndex = htmlStr.indexOf('id="app-menu-zen-btn"');

      expect(toggleIndex).toBeGreaterThan(-1);
      expect(createIndex).toBeGreaterThan(toggleIndex);
      expect(scratchIndex).toBeGreaterThan(createIndex);
      expect(zenIndex).toBeGreaterThan(scratchIndex);
    });

    it("9-3. isScratchMode が false の際、ツールチップ文言が「スクラッチモード（アプリ共通メモ）を開く」であること", () => {
      (appMenu as any).isScratchMode = false;
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="app-menu-scratch-btn"[^>]*>[\s\S]*?スクラッチモード（アプリ共通メモ）を開く[\s\S]*?<\/wa-tooltip>/,
      );
      expect(htmlStr).not.toMatch(
        /<wa-button[^>]*id="app-menu-scratch-btn"[^>]*class="[^"]*is-active[^"]*"/,
      );
    });

    it("9-4. isScratchMode が true の際、ツールチップ文言が「スクラッチモードを終了」であり、ボタンに is-active クラスが付与されること", () => {
      (appMenu as any).isScratchMode = true;
      const htmlStr = flattenTemplate(appMenu.render());
      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="app-menu-scratch-btn"[^>]*>[\s\S]*?スクラッチモードを終了[\s\S]*?<\/wa-tooltip>/,
      );
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="app-menu-scratch-btn"[^>]*class="[^"]*is-active[^"]*"/,
      );
    });
  });

  describe("10. スクラッチモード切替ボタンクリックによる LayoutUIController 連動", () => {
    it("10-1. handleToggleScratchMode の呼び出しにより layoutUIController.toggleScratchMode が実行されること", () => {
      const toggleScratchModeMock = vi.fn();
      mockLayoutUIController = {
        ...mockLayoutUIController,
        toggleScratchMode: toggleScratchModeMock,
      } as any;
      appMenu.layoutUIController = mockLayoutUIController as any;

      (appMenu as any).handleToggleScratchMode();
      expect(toggleScratchModeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("11. スクラッチモード有効時における他のボタンの無効化（disabled）", () => {
    it("11-1. isScratchMode が true の際、開閉ボタン、新規タスク作成ボタン、集中モードボタンに disabled 属性が付与されること", () => {
      (appMenu as any).isScratchMode = true;
      (appMenu as any).labelsController = { hasLabels: true };
      const htmlStr = flattenTemplate(appMenu.render());

      // 開閉ボタンが無効化
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="app-menu-toggle-btn"[^>]*\bdisabled\b/,
      );
      // 新規タスク作成ボタンが無効化
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="app-menu-task-create-btn"[^>]*\bdisabled\b/,
      );
      // 集中モードボタンが無効化
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="app-menu-zen-btn"[^>]*\bdisabled\b/,
      );
    });
  });
});
