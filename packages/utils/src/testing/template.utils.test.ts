import { describe, it, expect } from "vitest";
import { html } from "lit";
import { flattenTemplate } from "./template.utils";

/**
 * 【flattenTemplate 仕様】
 *
 * 1. プリミティブ値および空値の処理
 *    - [x] 1-1. null または undefined が渡された場合、空文字を返すこと
 *    - [x] 1-2. 文字列や数値などのプリミティブ値が渡された場合、その文字列表現を返すこと
 *
 * 2. 単純な Lit テンプレートの展開
 *    - [x] 2-1. 動的バインドのない静的なテンプレートをそのまま文字列として返すこと
 *    - [x] 2-2. 文字列や数値の動的バインド（${...}）が期待通りの位置に展開されること
 *
 * 3. ネストされた Lit テンプレートの再帰展開
 *    - [x] 3-1. テンプレート内部にネストされた子テンプレート（html`...`）が再帰的に展開されること
 *
 * 4. Lit ブール属性（?attribute=${bool}）の評価再現
 *    - [x] 4-1. ブール値 true がバインドされた場合、属性名のみが保持されること
 *    - [x] 4-2. ブール値 false がバインドされた場合、属性名および記号が除去されること
 */
describe("flattenTemplate", () => {
  describe("1. プリミティブ値および空値の処理", () => {
    it("1-1. null または undefined が渡された場合、空文字を返すこと", () => {
      expect(flattenTemplate(null)).toBe("");
      expect(flattenTemplate(undefined)).toBe("");
    });

    it("1-2. 文字列や数値などのプリミティブ値が渡された場合、その文字列表現を返すこと", () => {
      expect(flattenTemplate("hello")).toBe("hello");
      expect(flattenTemplate(123)).toBe("123");
    });
  });

  describe("2. 単純な Lit テンプレートの展開", () => {
    it("2-1. 動的バインドのない静的なテンプレートをそのまま文字列として返すこと", () => {
      const tpl = html`<div class="container">Hello World</div>`;
      expect(flattenTemplate(tpl)).toBe(
        '<div class="container">Hello World</div>',
      );
    });

    it("2-2. 文字列や数値の動的バインド（${...}）が期待通りの位置に展開されること", () => {
      const name = "StepNote";
      const count = 5;
      const tpl = html`<div class="app">${name} (${count})</div>`;
      expect(flattenTemplate(tpl)).toBe('<div class="app">StepNote (5)</div>');
    });
  });

  describe("3. ネストされた Lit テンプレートの再帰展開", () => {
    it("3-1. テンプレート内部にネストされた子テンプレート（html`...`）が再帰的に展開されること", () => {
      const child = html`<span>child content</span>`;
      const parent = html`<div class="parent">${child}</div>`;
      expect(flattenTemplate(parent)).toBe(
        '<div class="parent"><span>child content</span></div>',
      );
    });

    it("3-2. 配列形式のテンプレート（TemplateResult[]）がすべて展開・連結されること", () => {
      const items = ["A", "B", "C"];
      const tpl = html`<ul>${items.map((item) => html`<li>${item}</li>`)}</ul>`;
      expect(flattenTemplate(tpl)).toBe("<ul><li>A</li><li>B</li><li>C</li></ul>");
    });
  });

  describe("4. Lit ブール属性（?attribute=${bool}）の評価再現", () => {
    it("4-1. ブール値 true がバインドされた場合、属性名のみが保持されること", () => {
      const isHidden = true;
      const tpl = html`<section class="pane" ?hidden=${isHidden}></section>`;
      expect(flattenTemplate(tpl)).toBe(
        '<section class="pane" hidden></section>',
      );
    });

    it("4-2. ブール値 false がバインドされた場合、属性名および記号が除去されること", () => {
      const isHidden = false;
      const tpl = html`<section class="pane" ?hidden=${isHidden}></section>`;
      expect(flattenTemplate(tpl)).toBe('<section class="pane" ></section>');
    });
  });
});
