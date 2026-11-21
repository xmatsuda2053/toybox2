import * as fs from "node:fs";
import * as path from "node:path";
import * as sass from "sass-embedded";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { SettingsAutoExportView } from "./settings-auto-export-view.js";

/**
 * 【SettingsAutoExportView 仕様 (設定画面用自動エクスポート設定サブビュー)】
 *
 * 1. 自動エクスポート設定機能
 *    - 1-1. 有効/無効切り替えスイッチ（wa-switch）がレンダリングされること
 *    - 1-2. スイッチ操作で autoExportController.setEnabled が呼び出されること
 *    - 1-3. 登録されたスケジュール時刻リストの各アイテムがレンダリングされること
 *    - 1-4. 時刻追加ハンドラーで入力された時刻が autoExportController.addScheduleTime へ渡されること
 *    - 1-5. 時刻削除ハンドラーで指定時刻が autoExportController.removeScheduleTime へ渡されること
 *    - 1-6. 手動エクスポートボタンクリックで autoExportController.triggerManualExport が呼び出されること
 *    - 1-7. 新規時刻入力欄に wa-time-input が hour-format="24" 付きでレンダリングされること
 *    - 1-8. 左右2つのペイン（.settings-auto-export-view__layout, __main, __schedule-pane）で構成されること
 *    - 1-9. 時刻追加フォーム（__schedule-form）が右ペイン（__schedule-pane）内に配置され、左ペインに含まれないこと
 *    - 1-10. 時刻追加ボタン（#settings-auto-export-add-btn）がプラスアイコンかつ trigger="hover" のツールチップ付きで描画されること
 *    - 1-11. 時刻入力欄に値が入力されると variant="brand" appearance="accent" および --active クラスが付与されること
 *
 * 2. SCSSスタイル検証
 *    - 2-1. settings-auto-export-view.scss が存在し、!important / @extend / カラー直値を含まないこと
 *    - 2-2. __schedule-list に overflow-y: auto が定義されていること
 *    - 2-3. __schedule-item および __export-status に background-color: var(--wa-color-surface-raised) が指定されていること
 */
describe("SettingsAutoExportView Component", () => {
  let element: SettingsAutoExportView;
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
    element = new SettingsAutoExportView();
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
    Reflect.set(element, "autoExportController", mockAutoExportCtrl);
  });

  describe("1. 自動エクスポート設定機能", () => {
    it("1-1. 有効/無効切り替えスイッチ（wa-switch）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-switch[^>]*class="[^"]*settings-auto-export-view__switch[^"]*"/,
      );
    });

    it("1-2. スイッチ操作で autoExportController.setEnabled が呼び出されること", () => {
      element.handleToggleAutoExport({
        target: { checked: false },
      } as unknown as Event);
      expect(mockAutoExportCtrl.setEnabled).toHaveBeenCalledWith(false);
    });

    it("1-3. 登録されたスケジュール時刻リストの各アイテムがレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("08:00");
      expect(htmlStr).toContain("12:00");
      expect(htmlStr).toContain("17:15");
    });

    it("1-4. 時刻追加ハンドラーで入力された時刻が autoExportController.addScheduleTime へ渡されること", () => {
      element.newScheduleTimeInput = "15:30";
      element.handleAddScheduleTime();
      expect(mockAutoExportCtrl.addScheduleTime).toHaveBeenCalledWith("15:30");
      expect(element.newScheduleTimeInput).toBe("");
    });

    it("1-5. 時刻削除ハンドラーで指定時刻が autoExportController.removeScheduleTime へ渡されること", () => {
      element.handleRemoveScheduleTime("12:00");
      expect(mockAutoExportCtrl.removeScheduleTime).toHaveBeenCalledWith(
        "12:00",
      );
    });

    it("1-6. 手動エクスポートボタンクリックで autoExportController.triggerManualExport が呼び出されること", async () => {
      await element.handleTriggerManualExport();
      expect(mockAutoExportCtrl.triggerManualExport).toHaveBeenCalled();
    });

    it("1-7. 新規時刻入力欄に wa-time-input が hour-format='24' 付きでレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-time-input[^>]*hour-format="24"/);
      expect(htmlStr).toMatch(
        /<wa-time-input[^>]*class="[^"]*settings-auto-export-view__time-input[^"]*"/,
      );
    });

    it("1-8. 左右2つのペインで構成されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-auto-export-view__layout[^"]*"/,
      );
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-auto-export-view__main[^"]*"/,
      );
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-auto-export-view__schedule-pane[^"]*"/,
      );
    });

    it("1-9. 時刻追加フォームが右ペイン内に配置され、左ペインには含まれないこと", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-auto-export-view__schedule-pane[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*settings-auto-export-view__schedule-form[^"]*"/,
      );
      const mainPaneMatch = htmlStr.match(
        /<div[^>]*class="[^"]*settings-auto-export-view__main[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="[^"]*settings-auto-export-view__schedule-pane[^"]*"/,
      );
      expect(mainPaneMatch).toBeTruthy();
      expect(mainPaneMatch?.[1]).not.toContain(
        "settings-auto-export-view__schedule-form",
      );
    });

    it("1-10. 時刻追加ボタン（#settings-auto-export-add-btn）がプラスアイコンかつ appearance='plain'・trigger='hover' ツールチップ付きで描画されること", () => {
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

    it("1-11. 時刻入力欄に値が入力されると variant='brand' appearance='accent' および --active クラスが付与されること", () => {
      element.newScheduleTimeInput = "09:30";
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="settings-auto-export-add-btn"[^>]*variant="brand"[^>]*appearance="accent"/,
      );
      expect(htmlStr).toMatch(
        /<wa-button[^>]*id="settings-auto-export-add-btn"[^>]*class="[^"]*settings-auto-export-view__btn-add-time--active[^"]*"/,
      );
      expect(htmlStr).not.toMatch(
        /<wa-button[^>]*id="settings-auto-export-add-btn"[^>]*disabled/,
      );
    });
  });

  describe("2. SCSSスタイル検証", () => {
    const scssPath = path.resolve(__dirname, "./settings-auto-export-view.scss");

    it("2-1. settings-auto-export-view.scss が存在し、!important / @extend / カラー直値を含まないこと", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toMatch(/!important/);
      expect(scss).not.toMatch(/@extend/);
      const hexMatches = scss.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
      const rgbMatches = scss.match(/\brgba?\([^)]+\)/g) || [];
      expect(hexMatches.length + rgbMatches.length).toBe(0);
    });

    it("2-2. __schedule-list に overflow-y: auto が定義されていること", () => {
      const compiledCss = sass.compile(scssPath).css;
      expect(compiledCss).toMatch(
        /\.settings-auto-export-view__schedule-list\s*\{[^}]*?overflow-y:\s*auto\b/,
      );
    });

    it("2-3. __schedule-item および __export-status に background-color: var(--wa-color-surface-raised) が指定されていること", () => {
      const compiledCss = sass.compile(scssPath).css;
      expect(compiledCss).toMatch(
        /\.settings-auto-export-view__schedule-item\s*\{[^}]*?background-color:\s*var\(--wa-color-surface-raised\)/,
      );
      expect(compiledCss).toMatch(
        /\.settings-auto-export-view__export-status\s*\{[^}]*?background-color:\s*var\(--wa-color-surface-raised\)/,
      );
    });
  });
});
