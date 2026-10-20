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
});
