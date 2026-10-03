/**
 * theme-sync ユーティリティ単体テスト仕様
 *
 * 1. 祖先要素からのテーマ検知
 *   - element 自身に前回の "dark" 属性があっても、親要素が "light" の場合は false（ライトモード）を返すこと
 *   - element 自身の親要素が "dark" の場合は true（ダークモード）を返すこと
 * 2. クラス名による判定
 *   - element 自身に "wa-dark" が残っていても、親要素に "wa-light" が指定されている場合は false を返すこと
 *   - 親要素に "wa-dark" が指定されている場合は true を返すこと
 */

import { describe, it, expect } from "vitest";
import { detectIsDarkMode } from "./theme-sync.js";

function createMockElement(
  attrs: Record<string, string> = {},
  classes: string[] = [],
): any {
  let parent: any = null;
  return {
    getAttribute(name: string) {
      return attrs[name] ?? null;
    },
    classList: {
      contains(name: string) {
        return classes.includes(name);
      },
    },
    get parentElement() {
      return parent;
    },
    set parentElement(p: any) {
      parent = p;
    },
  };
}

describe("detectIsDarkMode (theme-sync)", () => {
  it("element 自身に前回の 'dark' 属性が残っていても、親要素が 'light' の場合は false を返すこと", () => {
    const parent = createMockElement({ "data-theme": "light" });
    const child = createMockElement({ "data-theme": "dark" });
    child.parentElement = parent;

    // 要素自身の属性ではなく親要素の light 判定が優先されること
    expect(detectIsDarkMode(child)).toBe(false);
  });

  it("element 自身に 'wa-dark' が残っていても、親要素に 'wa-light' が指定されている場合は false を返すこと", () => {
    const parent = createMockElement({}, ["wa-light"]);
    const child = createMockElement({}, ["wa-dark"]);
    child.parentElement = parent;

    expect(detectIsDarkMode(child)).toBe(false);
  });

  it("親要素が 'dark' の場合は true を返すこと", () => {
    const parent = createMockElement({ "data-theme": "dark" });
    const child = createMockElement({});
    child.parentElement = parent;

    expect(detectIsDarkMode(child)).toBe(true);
  });

  it("ShadowRoot のホスト要素経由でも祖先のテーマを正常に検知できること", () => {
    const host = createMockElement({ "data-theme": "dark" });
    const shadowRoot = {
      host,
    };
    const child = {
      getAttribute() {
        return null;
      },
      classList: {
        contains() {
          return false;
        },
      },
      parentElement: null,
      getRootNode() {
        return shadowRoot;
      },
    };

    expect(detectIsDarkMode(child as any)).toBe(true);
  });
});
