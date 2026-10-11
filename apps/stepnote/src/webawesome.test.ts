/**
 * 【Web Awesome コンポーネント登録基盤 仕様 (StepNote)】
 *
 * 1. 定数・コンポーネント一覧仕様 (Constants & Component List)
 *    - 1-1. WEB_AWESOME_COMPONENTS に 16 種類の Web Awesome コンポーネント名が定義されていること
 *    - 1-2. 定義されたすべてのコンポーネント名が小文字の英数字およびハイフンで構成されていること
 *    - 1-3. 主要 UI で使用されるコンポーネント（button, dialog, divider, dropdown, dropdown-item, icon, input, option, popover, select, spinner, tab, tab-group, tab-panel, textarea, tooltip）が漏れなく網羅されていること
 *    - 1-4. WEB_AWESOME_TAG_NAMES に対応する 'wa-' プレフィックス付きカスタムタグ名一覧（16個）が定義されていること
 *
 * 2. ユーティリティ関数仕様 (Utility Functions)
 *    - 2-1. getWebAwesomeTagName がコンポーネント名から 'wa-${name}' 形式のタグ名を返すこと
 *    - 2-2. isRegisteredWebAwesomeComponent が登録対象のコンポーネント名に対して true を返すこと
 *    - 2-3. isRegisteredWebAwesomeComponent が未知・未登録のコンポーネント名に対して false を返すこと
 *
 * 3. 登録基盤実行仕様 (Registration Execution)
 *    - 3-1. registerWebAwesome 関数が正常に呼び出し可能であり、例外なく完了すること
 */

import { describe, it, expect } from "vitest";
import {
  WEB_AWESOME_COMPONENTS,
  WEB_AWESOME_TAG_NAMES,
  getWebAwesomeTagName,
  isRegisteredWebAwesomeComponent,
  registerWebAwesome,
} from "./webawesome";

describe("Web Awesome コンポーネント登録基盤 (webawesome)", () => {
  describe("1. 定数・コンポーネント一覧仕様", () => {
    it("WEB_AWESOME_COMPONENTS に 16 種類の Web Awesome コンポーネント名が定義されていること", () => {
      expect(WEB_AWESOME_COMPONENTS).toBeDefined();
      expect(WEB_AWESOME_COMPONENTS.length).toBe(16);
    });

    it("定義されたすべてのコンポーネント名が小文字の英数字およびハイフンで構成されていること", () => {
      for (const name of WEB_AWESOME_COMPONENTS) {
        expect(name).toMatch(/^[a-z][a-z0-9-]*$/);
      }
    });

    it("主要 UI で使用される必須コンポーネントが漏れなく網羅されていること", () => {
      const required = [
        "button",
        "dialog",
        "divider",
        "dropdown",
        "dropdown-item",
        "icon",
        "input",
        "option",
        "popover",
        "select",
        "spinner",
        "tab",
        "tab-group",
        "tab-panel",
        "textarea",
        "tooltip",
      ];
      for (const name of required) {
        expect(WEB_AWESOME_COMPONENTS).toContain(name);
      }
    });

    it("WEB_AWESOME_TAG_NAMES に対応する 'wa-' プレフィックス付きカスタムタグ名一覧が定義されていること", () => {
      expect(WEB_AWESOME_TAG_NAMES.length).toBe(WEB_AWESOME_COMPONENTS.length);
      for (let i = 0; i < WEB_AWESOME_COMPONENTS.length; i++) {
        expect(WEB_AWESOME_TAG_NAMES[i]).toBe(`wa-${WEB_AWESOME_COMPONENTS[i]}`);
      }
    });
  });

  describe("2. ユーティリティ関数仕様", () => {
    it("getWebAwesomeTagName がコンポーネント名から 'wa-${name}' 形式のタグ名を返すこと", () => {
      expect(getWebAwesomeTagName("button")).toBe("wa-button");
      expect(getWebAwesomeTagName("input")).toBe("wa-input");
      expect(getWebAwesomeTagName("tab-group")).toBe("wa-tab-group");
    });

    it("isRegisteredWebAwesomeComponent が登録対象のコンポーネント名に対して true を返すこと", () => {
      expect(isRegisteredWebAwesomeComponent("button")).toBe(true);
      expect(isRegisteredWebAwesomeComponent("popover")).toBe(true);
      expect(isRegisteredWebAwesomeComponent("dialog")).toBe(true);
    });

    it("isRegisteredWebAwesomeComponent が未知・未登録のコンポーネント名に対して false を返すこと", () => {
      expect(isRegisteredWebAwesomeComponent("unknown-component")).toBe(false);
      expect(isRegisteredWebAwesomeComponent("")).toBe(false);
    });
  });

  describe("3. 登録基盤実行仕様", () => {
    it("registerWebAwesome 関数が正常に呼び出し可能であり、例外なく完了すること", () => {
      expect(() => registerWebAwesome()).not.toThrow();
    });
  });
});
