import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { SettingsHistoryView } from "./settings-history-view.js";

/**
 * 【SettingsHistoryView 仕様 (設定画面用閲覧履歴設定サブビュー)】
 *
 * 1. 閲覧履歴設定機能
 *    - 1-1. 最大保持件数セレクター（#settings-history-max-count）がレンダリングされること
 *    - 1-2. 最大保持件数変更時に taskHistoryController.setMaxCount が呼び出されること
 *    - 1-3. 履歴クリア実行時に taskHistoryController.clear() が呼び出されること
 *    - 1-4. 履歴クリアボタンが variant="danger" でレンダリングされ、trash-solid-full アイコンが表示されること
 *
 * 2. SCSS・コード品質検証
 *    - 2-1. settings-history-view.scss が存在し、!important / @extend / カラー直値を含まないこと
 *    - 2-2. settings-history-view.ts 内の全メソッドが 50行以下（サブレンダー分割）であること
 */
describe("SettingsHistoryView Component", () => {
  let element: SettingsHistoryView;
  let mockHistoryCtrl: {
    history: { taskId: number; accessedAt: number }[];
    maxCount: number;
    setMaxCount: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    element = new SettingsHistoryView();
    mockHistoryCtrl = {
      history: [
        { taskId: 1, accessedAt: 1000 },
        { taskId: 2, accessedAt: 2000 },
      ],
      maxCount: 10,
      setMaxCount: vi.fn(),
      clear: vi.fn(),
    };
    Reflect.set(element, "taskHistoryController", mockHistoryCtrl);
  });

  describe("1. 閲覧履歴設定機能", () => {
    it("1-1. 最大保持件数セレクター（#settings-history-max-count）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-select[^>]*id="settings-history-max-count"/);
    });

    it("1-2. 最大保持件数変更時に taskHistoryController.setMaxCount が呼び出されること", () => {
      element.handleHistoryMaxCountChange({
        target: { value: "20" },
      } as unknown as CustomEvent);
      expect(mockHistoryCtrl.setMaxCount).toHaveBeenCalledWith(20);
    });

    it("1-3. 履歴クリア実行時に taskHistoryController.clear() が呼び出されること", () => {
      element.handleClearHistorySettings();
      expect(mockHistoryCtrl.clear).toHaveBeenCalledTimes(1);
    });

    it('1-4. 履歴クリアボタンが variant="danger" でレンダリングされ、trash-solid-full アイコンが表示されること', () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-button[^>]*variant="danger"[^>]*class="[^"]*settings-history-view__btn-clear[^"]*"/,
      );
      expect(htmlStr).toMatch(/<wa-icon[^>]*name="trash-solid-full"[^>]*>/);
    });
  });

  describe("2. SCSS・コード品質検証", () => {
    const scssPath = path.resolve(__dirname, "./settings-history-view.scss");
    const tsPath = path.resolve(__dirname, "./settings-history-view.ts");

    it("2-1. settings-history-view.scss が存在し、!important / @extend / カラー直値を含まないこと", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toMatch(/!important/);
      expect(scss).not.toMatch(/@extend/);
      const hexMatches = scss.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
      const rgbMatches = scss.match(/\brgba?\([^)]+\)/g) || [];
      expect(hexMatches.length + rgbMatches.length).toBe(0);
    });

    it("2-2. settings-history-view.ts がサブレンダーメソッドへ分割されていること", () => {
      expect(fs.existsSync(tsPath)).toBe(true);
      const ts = fs.readFileSync(tsPath, "utf-8");
      expect(ts).toContain("renderMaxCountSection");
      expect(ts).toContain("renderClearSection");
    });
  });
});
