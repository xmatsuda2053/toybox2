/**
 * テスト仕様: Web Awesome ローカル SVG アイコン登録基盤
 *
 * 1. 定数仕様:
 *    - デフォルトのアイコンライブラリ名として 'my-icons' が定義されていること
 *
 * 2. アイコン存在判定・取得仕様 (hasIcon / getIconSvg):
 *    - 登録済みのアイコン名に対して hasIcon が true を返すこと
 *    - 未登録のアイコン名に対して hasIcon が false を返すこと
 *    - 登録済みのアイコン名に対して getIconSvg が対応する SVG 文字列を返すこと
 *    - 未登録のアイコン名に対して getIconSvg が undefined を返すこと
 *
 * 3. リゾルバ関数仕様 (createIconResolver):
 *    - 登録済みのアイコン名に対して data:image/svg+xml;utf8 形式の Data URL を返すこと
 *    - 未登録のアイコン名に対して空文字を返すこと
 *    - SVG 文字列内の特殊文字が正しくパーセントエンコードされること
 *
 * 4. アイコンライブラリ登録仕様 (registerIcons):
 *    - オプション未指定時にデフォルト名 'my-icons' で registerIconLibrary が呼び出されること
 *    - カスタムライブラリ名が指定された場合にその名前で登録されること
 *    - デフォルトの mutator が SVG 要素に fill="currentColor" を付与すること
 *    - カスタム mutator が指定された場合にそれが登録されること
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Web Awesome の registerIconLibrary をモック化（Node.js 環境での実行に対応）
const mockRegisterIconLibrary = vi.fn();
vi.mock("@awesome.me/webawesome/dist/webawesome.js", () => ({
  registerIconLibrary: (...args: any[]) => mockRegisterIconLibrary(...args),
}));

// テスト対象モジュールのインポート（未実装のためインポート時またはテスト実行時に失敗する）
import {
  DEFAULT_ICON_LIBRARY_NAME,
  createIconResolver,
  hasIcon,
  getIconSvg,
  registerIcons,
} from "./register";

describe("Web Awesome ローカル SVG アイコン登録基盤", () => {
  beforeEach(() => {
    mockRegisterIconLibrary.mockClear();
  });

  describe("定数仕様", () => {
    it("デフォルトのアイコンライブラリ名として 'my-icons' が定義されていること", () => {
      expect(DEFAULT_ICON_LIBRARY_NAME).toBe("my-icons");
    });
  });

  describe("アイコン存在判定・取得仕様", () => {
    it("登録済みのアイコン名に対して hasIcon が true を返すこと", () => {
      expect(hasIcon("check-solid-full")).toBe(true);
      expect(hasIcon("cubes-stacked-solid-full")).toBe(true);
      expect(hasIcon("chevron-right")).toBe(true);
      expect(hasIcon("xmark-solid-full")).toBe(true);
    });

    it("未登録のアイコン名に対して hasIcon が false を返すこと", () => {
      expect(hasIcon("non-existent-icon")).toBe(false);
      expect(hasIcon("")).toBe(false);
    });

    it("登録済みのアイコン名に対して getIconSvg が対応する SVG 文字列を返すこと", () => {
      const svg = getIconSvg("check-solid-full");
      expect(svg).toBeDefined();
      expect(svg).toContain("<svg");

      const chevronSvg = getIconSvg("chevron-right");
      expect(chevronSvg).toBeDefined();
      expect(chevronSvg).toContain("<svg");
    });

    it("未登録のアイコン名に対して getIconSvg が undefined を返すこと", () => {
      expect(getIconSvg("non-existent-icon")).toBeUndefined();
    });
  });

  describe("リゾルバ関数仕様 (createIconResolver)", () => {
    const dummyIcons: Record<string, string> = {
      test: '<svg viewBox="0 0 10 10"><path d="M0 0"/></svg>',
      special: '<svg><text>hello & world</text></svg>',
    };

    it("登録済みのアイコン名に対して data:image/svg+xml;utf8 形式の Data URL を返すこと", () => {
      const resolver = createIconResolver(dummyIcons);
      const result = resolver("test");
      expect(result).toBe(
        `data:image/svg+xml;utf8,${encodeURIComponent(dummyIcons.test)}`,
      );
    });

    it("未登録のアイコン名に対して空文字を返すこと", () => {
      const resolver = createIconResolver(dummyIcons);
      expect(resolver("unknown")).toBe("");
    });

    it("SVG 文字列内の特殊文字が正しくパーセントエンコードされること", () => {
      const resolver = createIconResolver(dummyIcons);
      const result = resolver("special");
      expect(result).toContain(encodeURIComponent("&"));
    });
  });

  describe("アイコンライブラリ登録仕様 (registerIcons)", () => {
    it("オプション未指定時にデフォルト名 'my-icons' で registerIconLibrary が呼び出されること", () => {
      registerIcons();
      expect(mockRegisterIconLibrary).toHaveBeenCalledTimes(1);
      expect(mockRegisterIconLibrary).toHaveBeenCalledWith(
        "my-icons",
        expect.objectContaining({
          resolver: expect.any(Function),
          mutator: expect.any(Function),
        }),
      );
    });

    it("カスタムライブラリ名が指定された場合にその名前で登録されること", () => {
      registerIcons({ libraryName: "custom-lib" });
      expect(mockRegisterIconLibrary).toHaveBeenCalledWith(
        "custom-lib",
        expect.anything(),
      );
    });

    it("デフォルトの mutator が SVG 要素に fill='currentColor' を付与すること", () => {
      registerIcons();
      const registeredOptions = mockRegisterIconLibrary.mock.calls[0][1];
      const fakeSvg = {
        setAttribute: vi.fn(),
      };
      registeredOptions.mutator(fakeSvg as unknown as SVGElement);
      expect(fakeSvg.setAttribute).toHaveBeenCalledWith("fill", "currentColor");
    });

    it("カスタム mutator が指定された場合にそれが登録されること", () => {
      const customMutator = vi.fn();
      registerIcons({ mutator: customMutator });
      const registeredOptions = mockRegisterIconLibrary.mock.calls[0][1];
      expect(registeredOptions.mutator).toBe(customMutator);
    });
  });
});
