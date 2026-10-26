import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { ShortcutHelpDrawer } from "./shortcut-help-drawer.js";

/**
 * 【ShortcutHelpDrawer コンポーネント仕様 (shortcut-help-drawer.test.ts)】
 *
 * 1. 基本レンダリング
 *    - 1-1. wa-drawer が placement="end" でレンダリングされること
 *    - 1-2. open プロパティが true の場合、wa-drawer に open 属性が反映されること
 *    - 1-3. 各カテゴリ（全般ナビゲーション、タスク操作、エディタ書式）のショートカットがレンダリングされること
 *
 * 2. 閉じる動作・イベント発火
 *    - 2-1. handleClose 呼び出し時に drawer-close カスタムイベントが発火されること
 */

describe("ShortcutHelpDrawer Component", () => {
  let drawer: ShortcutHelpDrawer;

  beforeEach(() => {
    drawer = new ShortcutHelpDrawer();
  });

  describe("1. 基本レンダリング", () => {
    it("1-1. wa-drawer が placement='end' でレンダリングされること", () => {
      const htmlStr = flattenTemplate(drawer.render());
      expect(htmlStr).toContain("<wa-drawer");
      expect(htmlStr).toContain('placement="end"');
      expect(htmlStr).toContain("ショートカット一覧");
    });

    it("1-2. open プロパティが true の場合、wa-drawer に open が反映されること", () => {
      drawer.open = true;
      const htmlStr = flattenTemplate(drawer.render());
      expect(htmlStr).toMatch(/<wa-drawer[^>]*\bopen\b/);
    });

    it("1-3. 各カテゴリの主要ショートカットがレンダリングされること", () => {
      const htmlStr = flattenTemplate(drawer.render());
      expect(htmlStr).toContain("全体検索モーダルを開く");
      expect(htmlStr).toContain("新規タスク作成モーダルを開く");
      expect(htmlStr).toContain("集中モード（Zen Mode）の切替");
      expect(htmlStr).toContain("Ctrl");
      expect(htmlStr).toContain("Alt");
    });
  });

  describe("2. 閉じる動作・イベント発火", () => {
    it("2-1. handleClose 呼び出し時に drawer-close カスタムイベントが発火されること", () => {
      const listener = vi.fn();
      drawer.addEventListener("drawer-close", listener);
      drawer.handleClose();
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
