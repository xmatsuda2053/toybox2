import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import type { AppViewMode, LayoutState } from "@/types";
import { ViewModeSwitcher } from "./view-mode-switcher.js";

/**
 * 【ViewModeSwitcher 仕様 (ヘッダー表示モード切り替えセグメントボタングループ)】
 *
 * 1. 基本レンダリング構造
 *    - 1-1. wa-button-group（label="表示モード切り替え"）がレンダリングされること
 *    - 1-2. ボタングループ内に標準（#btn-view-mode-standard）・一覧（#btn-view-mode-list）の切り替えボタンがレンダリングされること
 *    - 1-3. 各ボタンに対応する trigger="hover" 指定のツールチップ（wa-tooltip[for]）がレンダリングされること
 *    - 1-4. 各ボタンに適切なアイコン（table-columns-solid-full, table-solid-full）が表示されること
 *    - 1-5. wa-button-group の内部には wa-button のみが配置され、wa-tooltip は wa-button-group の外側に配置されること
 *
 * 2. 状態連動とアクティブ表示・無効化・アクセシビリティ
 *    - 2-1. viewMode が "standard" のとき、標準ボタンに appearance="filled" / aria-pressed="true"、一覧ボタンに appearance="plain" / aria-pressed="false" が付与されること
 *    - 2-2. viewMode が "list" のとき、一覧ボタンに appearance="filled" / aria-pressed="true"、標準ボタンに appearance="plain" / aria-pressed="false" が付与されること
 *    - 2-3. disabled が true のとき、すべての切り替えボタンに disabled 属性が付与されること
 *
 * 3. 表示モード切り替えイベントハンドリング
 *    - 3-1. handleViewModeChange 実行時、選択されたモードで layoutUIController.setViewMode が呼び出されること
 *    - 3-2. disabled が true のとき、handleViewModeChange を呼び出しても setViewMode が呼び出されないこと
 *
 * 4. コントローラー状態購読（Observer / Subscribe）
 *    - 4-1. コントローラー設定時に controller.subscribe が呼び出され、リスナーが登録されること
 */

describe("ViewModeSwitcher Component", () => {
  let switcher: ViewModeSwitcher;
  let mockLayoutUIController: {
    state: Partial<LayoutState> & { viewMode: AppViewMode };
    setViewMode: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockLayoutUIController = {
      state: {
        viewMode: "standard",
        isListDetailOpen: false,
        isScratchMode: false,
        isSettingsMode: false,
      },
      setViewMode: vi.fn(),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };
    switcher = new ViewModeSwitcher();
    switcher.layoutUIController =
      mockLayoutUIController as unknown as LayoutUIController;
  });

  describe("1. 基本レンダリング構造", () => {
    it('1-1. wa-button-group（label="表示モード切り替え"）がレンダリングされること', () => {
      const htmlStr = flattenTemplate(switcher.render());
      expect(htmlStr).toContain("<wa-button-group");
      expect(htmlStr).toContain('label="表示モード切り替え"');
    });

    it("1-2. ボタングループ内に標準・一覧の切り替えボタンがレンダリングされること", () => {
      const htmlStr = flattenTemplate(switcher.render());
      expect(htmlStr).toContain('id="btn-view-mode-standard"');
      expect(htmlStr).toContain('id="btn-view-mode-list"');
    });

    it('1-3. 各ボタンに対応する trigger="hover" 指定のツールチップ（wa-tooltip[for]）がレンダリングされること', () => {
      const htmlStr = flattenTemplate(switcher.render());
      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="btn-view-mode-standard"[^>]*trigger="hover"/,
      );
      expect(htmlStr).toContain("標準モード");
      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="btn-view-mode-list"[^>]*trigger="hover"/,
      );
      expect(htmlStr).toContain("一覧モード");
    });

    it("1-4. 各ボタンに適切なアイコンが表示されること", () => {
      const htmlStr = flattenTemplate(switcher.render());
      expect(htmlStr).toContain('name="table-columns-solid-full"');
      expect(htmlStr).toContain('name="table-solid-full"');
    });

    it("1-5. wa-button-group の内部には wa-button のみが配置され、wa-tooltip は wa-button-group の外側に配置されること", () => {
      const htmlStr = flattenTemplate(switcher.render());
      const groupMatch = htmlStr.match(
        /<wa-button-group[^>]*>([\s\S]*?)<\/wa-button-group>/,
      );
      expect(groupMatch).not.toBeNull();

      const groupInner = groupMatch?.[1] ?? "";
      expect(groupInner).toContain('id="btn-view-mode-standard"');
      expect(groupInner).toContain('id="btn-view-mode-list"');
      expect(groupInner).not.toContain("<wa-tooltip");
      expect(groupInner.trim()).toMatch(/<\/wa-button>$/);

      const afterGroup = htmlStr.slice(
        htmlStr.indexOf("</wa-button-group>") + "</wa-button-group>".length,
      );
      expect(afterGroup).toMatch(
        /<wa-tooltip[^>]*for="btn-view-mode-standard"/,
      );
      expect(afterGroup).toMatch(/<wa-tooltip[^>]*for="btn-view-mode-list"/);
    });
  });

  describe("2. 状態連動とアクティブ表示・無効化・アクセシビリティ", () => {
    it('2-1. viewMode が "standard" のとき、標準ボタンがアクティブ、一覧ボタンが非アクティブになること', () => {
      mockLayoutUIController.state.viewMode = "standard";
      const htmlStr = flattenTemplate(switcher.render());

      expect(htmlStr).toMatch(
        /id="btn-view-mode-standard"[^>]*appearance="filled"[^>]*aria-pressed="true"/,
      );
      expect(htmlStr).toMatch(
        /id="btn-view-mode-list"[^>]*appearance="plain"[^>]*aria-pressed="false"/,
      );
    });

    it('2-2. viewMode が "list" のとき、一覧ボタンがアクティブ、標準ボタンが非アクティブになること', () => {
      mockLayoutUIController.state.viewMode = "list";
      const htmlStr = flattenTemplate(switcher.render());

      expect(htmlStr).toMatch(
        /id="btn-view-mode-list"[^>]*appearance="filled"[^>]*aria-pressed="true"/,
      );
      expect(htmlStr).toMatch(
        /id="btn-view-mode-standard"[^>]*appearance="plain"[^>]*aria-pressed="false"/,
      );
    });

    it("2-3. disabled が true のとき、すべての切り替えボタンに disabled 属性が付与されること", () => {
      switcher.disabled = true;
      const htmlStr = flattenTemplate(switcher.render());

      expect(htmlStr).toMatch(/id="btn-view-mode-standard"[^>]*disabled/);
      expect(htmlStr).toMatch(/id="btn-view-mode-list"[^>]*disabled/);
    });
  });

  describe("3. 表示モード切り替えイベントハンドリング", () => {
    it("3-1. handleViewModeChange 実行時、選択されたモードで layoutUIController.setViewMode が呼び出されること", () => {
      switcher.handleViewModeChange("list");
      expect(mockLayoutUIController.setViewMode).toHaveBeenCalledWith("list");
    });

    it("3-2. disabled が true のとき、handleViewModeChange を呼び出しても setViewMode が呼び出されないこと", () => {
      switcher.disabled = true;
      switcher.handleViewModeChange("list");
      expect(mockLayoutUIController.setViewMode).not.toHaveBeenCalled();
    });
  });

  describe("4. コントローラー状態購読（Observer / Subscribe）", () => {
    it("4-1. コントローラー設定時に controller.subscribe が呼び出され、リスナーが登録されること", () => {
      expect(mockLayoutUIController.subscribe).toHaveBeenCalledTimes(1);
    });
  });
});
