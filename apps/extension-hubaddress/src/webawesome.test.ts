import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRegisterIcons = vi.fn();
vi.mock("@shared/icons", () => ({
  registerIcons: (...args: unknown[]) => mockRegisterIcons(...args),
}));

import { registerWebAwesome, WEB_AWESOME_COMPONENTS } from "./webawesome";

/**
 * テスト仕様: Web Awesome およびローカル SVG アイコン登録基盤 (webawesome.ts)
 *
 * - 仕様1: registerWebAwesome を実行した際、@shared/icons の registerIcons が呼ばれ、
 *          ローカル SVG アイコンライブラリ（デフォルトおよび 'default'）が登録されること
 * - 仕様2: 拡張機能で利用される Web Awesome コンポーネント群が定義されていること
 */
describe("Web Awesome 基盤登録テスト (webawesome.ts)", () => {
  beforeEach(() => {
    mockRegisterIcons.mockClear();
  });

  it("registerWebAwesome を実行した際、ローカルアイコンライブラリ（デフォルトおよび 'default'）が登録されること", () => {
    registerWebAwesome();

    expect(mockRegisterIcons).toHaveBeenCalledTimes(2);
    expect(mockRegisterIcons).toHaveBeenNthCalledWith(1);
    expect(mockRegisterIcons).toHaveBeenNthCalledWith(2, {
      libraryName: "default",
    });
  });

  it("拡張機能で利用される Web Awesome コンポーネント群が定義されていること", () => {
    expect(WEB_AWESOME_COMPONENTS).toContain("badge");
    expect(WEB_AWESOME_COMPONENTS).toContain("button");
    expect(WEB_AWESOME_COMPONENTS).toContain("button-group");
    expect(WEB_AWESOME_COMPONENTS).toContain("callout");
    expect(WEB_AWESOME_COMPONENTS).toContain("dialog");
    expect(WEB_AWESOME_COMPONENTS).toContain("icon");
    expect(WEB_AWESOME_COMPONENTS).toContain("input");
    expect(WEB_AWESOME_COMPONENTS).toContain("select");
    expect(WEB_AWESOME_COMPONENTS).toContain("tab");
    expect(WEB_AWESOME_COMPONENTS).toContain("tab-group");
    expect(WEB_AWESOME_COMPONENTS).toContain("tab-panel");
    expect(WEB_AWESOME_COMPONENTS).toContain("tag");
    expect(WEB_AWESOME_COMPONENTS).toContain("toast");
    expect(WEB_AWESOME_COMPONENTS).toContain("tooltip");
  });
});
