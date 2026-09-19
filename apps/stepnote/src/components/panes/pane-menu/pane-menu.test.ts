import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import { PaneMenu } from "./pane-menu";

/**
 * 【PaneMenu 仕様 (Phase 1: メニューペイン独立コンポーネント化)】
 *
 * 1. メニューペイン内部の上下分離構造
 *    - [x] 1-1. メニューペイン内部に上下分離コンテナ（menu-primary, menu-secondary）がレンダリングされること
 *
 * 2. サイドパネル開閉操作ボタンのレンダリングとアクセシビリティ
 *    - [x] 2-1. menu-primary 内に開閉ボタン（wa-button[appearance='plain']）、ツールチップ（wa-tooltip）、アイコン（wa-icon[name='chevron-right']）がレンダリングされること
 *    - [x] 2-2. isNavigationListAreaOpen が true（開状態）の際、ツールチップ文言が「サイドパネルを閉じる」であり、アイコンに is-open クラスが付与されること
 *    - [x] 2-3. isNavigationListAreaOpen が false（閉状態）の際、ツールチップ文言が「サイドパネルを開く」であり、アイコンに is-closed クラスが付与されること
 *
 * 3. 開閉ボタンクリックによる LayoutUIController 連動
 *    - [x] 3-1. handleToggleNavigationList の呼び出しにより layoutUIController.toggleNavigationListArea が実行されること
 */

describe("PaneMenu Component", () => {
  let paneMenu: PaneMenu;
  let mockLayoutUIController: Partial<LayoutUIController>;

  beforeEach(() => {
    paneMenu = new PaneMenu();
    mockLayoutUIController = {
      toggleNavigationListArea: vi.fn(),
    };
    paneMenu.layoutUIController = mockLayoutUIController as LayoutUIController;
  });

  describe("1. メニューペイン内部の上下分離構造", () => {
    it("1-1. メニューペイン内部に上下分離コンテナ（menu-primary, menu-secondary）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(paneMenu.render());
      expect(htmlStr).toContain("menu-primary");
      expect(htmlStr).toContain("menu-secondary");
    });
  });

  describe("2. サイドパネル開閉操作ボタンのレンダリングとアクセシビリティ", () => {
    it("2-1. menu-primary 内に開閉ボタン（wa-button[appearance='plain']）、ツールチップ（wa-tooltip）、アイコン（wa-icon[name='chevron-right']）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(paneMenu.render());
      expect(htmlStr).toContain("wa-tooltip");
      expect(htmlStr).toContain("wa-button");
      expect(htmlStr).toContain("plain");
      expect(htmlStr).toContain("wa-icon");
      expect(htmlStr).toContain("chevron-right");
    });

    it("2-2. isNavigationListAreaOpen が true（開状態）の際、ツールチップ文言が「サイドパネルを閉じる」であり、アイコンに is-open クラスが付与されること", () => {
      paneMenu.isNavigationListAreaOpen = true;
      const htmlStr = flattenTemplate(paneMenu.render());
      expect(htmlStr).toContain("サイドパネルを閉じる");
      expect(htmlStr).toContain("is-open");
    });

    it("2-3. isNavigationListAreaOpen が false（閉状態）の際、ツールチップ文言が「サイドパネルを開く」であり、アイコンに is-closed クラスが付与されること", () => {
      paneMenu.isNavigationListAreaOpen = false;
      const htmlStr = flattenTemplate(paneMenu.render());
      expect(htmlStr).toContain("サイドパネルを開く");
      expect(htmlStr).toContain("is-closed");
    });
  });

  describe("3. 開閉ボタンクリックによる LayoutUIController 連動", () => {
    it("3-1. handleToggleNavigationList の呼び出しにより layoutUIController.toggleNavigationListArea が実行されること", () => {
      expect(typeof paneMenu.handleToggleNavigationList).toBe("function");
      paneMenu.handleToggleNavigationList();
      expect(
        mockLayoutUIController.toggleNavigationListArea,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
