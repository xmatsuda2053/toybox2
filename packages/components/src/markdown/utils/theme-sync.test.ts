/**
 * theme-sync ユーティリティ単体テスト仕様
 *
 * 1. 祖先要素からのテーマ検知
 *   - element 自身に前回の "dark" 属性があっても、親要素が "light" の場合は false（ライトモード）を返すこと
 *   - element 自身の親要素が "dark" の場合は true（ダークモード）を返すこと
 * 2. クラス名による判定
 *   - element 自身に "wa-dark" が残っていても、親要素に "wa-light" が指定されている場合は false を返すこと
 *   - 親要素に "wa-dark" が指定されている場合は true を返すこと
 * 3. DOM / ShadowRoot 祖先要素の探索（getParentOrHost）
 *   - 通常の親要素が存在する場合は parentElement を返すこと
 *   - ShadowRoot 内部の要素の場合は host 要素を返すこと
 *   - 祖先が存在しない場合は null を返すこと
 * 4. ホスト要素のテーマ属性同期（syncHostTheme）
 *   - ダークモード判定時に data-theme="dark" と wa-dark クラスを設定し wa-light を除去すること
 *   - ライトモード判定時に data-theme="light" と wa-light クラスを設定し wa-dark を除去すること
 */

import { describe, it, expect } from "vitest";
import { detectIsDarkMode, getParentOrHost, syncHostTheme } from "./theme-sync.js";

function createMockElement(
  attrs: Record<string, string> = {},
  classes: string[] = [],
): any {
  let parent: any = null;
  const classSet = new Set(classes);
  return {
    getAttribute(name: string) {
      return attrs[name] ?? null;
    },
    setAttribute(name: string, value: string) {
      attrs[name] = value;
    },
    classList: {
      contains(name: string) {
        return classSet.has(name);
      },
      add(name: string) {
        classSet.add(name);
      },
      remove(name: string) {
        classSet.delete(name);
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

  describe("getParentOrHost (DOM / ShadowRoot トラバース)", () => {
    it("通常の親要素が存在する場合は parentElement を返すこと", () => {
      const parent = createMockElement();
      const child = createMockElement();
      child.parentElement = parent;

      expect(getParentOrHost(child)).toBe(parent);
    });

    it("ShadowRoot 内部の要素の場合は host 要素を返すこと", () => {
      const host = createMockElement();
      const shadowRoot = { host };
      const child = {
        parentElement: null,
        getRootNode() {
          return shadowRoot;
        },
      };

      expect(getParentOrHost(child as any)).toBe(host);
    });

    it("祖先が存在しない要素（ルート）の場合は null を返すこと", () => {
      const root = {
        parentElement: null,
        getRootNode() {
          return root;
        },
      };

      expect(getParentOrHost(root as any)).toBeNull();
    });
  });

  describe("syncHostTheme (ホスト要素のテーマ属性同期)", () => {
    it("ダークモード時は data-theme='dark' と wa-dark クラスを設定し wa-light を除去すること", () => {
      const el = createMockElement({ "data-theme": "light" }, ["wa-light"]);
      syncHostTheme(el, true);

      expect(el.getAttribute("data-theme")).toBe("dark");
      expect(el.classList.contains("wa-dark")).toBe(true);
      expect(el.classList.contains("wa-light")).toBe(false);
    });

    it("ライトモード時は data-theme='light' と wa-light クラスを設定し wa-dark を除去すること", () => {
      const el = createMockElement({ "data-theme": "dark" }, ["wa-dark"]);
      syncHostTheme(el, false);

      expect(el.getAttribute("data-theme")).toBe("light");
      expect(el.classList.contains("wa-light")).toBe(true);
      expect(el.classList.contains("wa-dark")).toBe(false);
    });
  });
});
