import { describe, it, expect, vi, beforeEach } from "vitest";

// @shared/icons の registerIcons をモック化
const mockRegisterIcons = vi.fn();
vi.mock("@shared/icons", () => ({
  registerIcons: (...args: unknown[]) => mockRegisterIcons(...args),
}));

// テスト対象モジュールのインポート（未実装のためインポートまたはテスト時に失敗する）
import { registerWebAwesome, WEB_AWESOME_COMPONENTS } from "./webawesome";

/**
 * テスト仕様: Web Awesome およびローカル SVG アイコン登録基盤 (webawesome.ts)
 *
 * - 仕様1: registerWebAwesome を実行した際、@shared/icons の registerIcons が呼ばれ、
 *          ローカル SVG アイコンライブラリ（デフォルト 'my-icons' および 'default'）が登録されること
 * - 仕様2: 拡張機能で利用される Web Awesome コンポーネント群（button, button-group, icon, tooltip 等）が定義されていること
 */
describe("Web Awesome 基盤登録テスト (webawesome.ts)", () => {
  beforeEach(() => {
    mockRegisterIcons.mockClear();
  });

  it("registerWebAwesome を実行した際、ローカルアイコンライブラリ（'my-icons' および 'default'）が登録されること", () => {
    registerWebAwesome();

    expect(mockRegisterIcons).toHaveBeenCalledTimes(2);
    expect(mockRegisterIcons).toHaveBeenNthCalledWith(1);
    expect(mockRegisterIcons).toHaveBeenNthCalledWith(2, { libraryName: "default" });
  });

  it("拡張機能で利用される Web Awesome コンポーネント群が定義されていること", () => {
    expect(WEB_AWESOME_COMPONENTS).toContain("button");
    expect(WEB_AWESOME_COMPONENTS).toContain("button-group");
    expect(WEB_AWESOME_COMPONENTS).toContain("icon");
    expect(WEB_AWESOME_COMPONENTS).toContain("tooltip");
  });
});

