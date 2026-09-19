/**
 * Lit の TemplateResult または任意のテンプレートオブジェクト・プリミティブ値を受け取り、
 * DOM シミュレータ（jsdom 等）が存在しない Node.js 標準環境において、
 * 静的文字列（strings）と動的バインド値（values）を展開・統合したフラットな HTML 文字列を生成します。
 *
 * ## 仕様説明
 * 1. **静的文字列と動的値の交互結合**:
 *    タグ付きテンプレートリテラル `html\`<div class="${cls}">\`` が保持する
 *    静的文字列配列（`strings`）と動的バインド値（`values`）を順番通りにインターリーブ結合します。
 * 2. **ネストされたテンプレートの再帰展開**:
 *    値の中にさらに `html\`...\`` で作成された子テンプレートが含まれる場合、
 *    再帰的に展開して単一のフラットな文字列へ統合します。
 * 3. **Lit ブール属性（`?<attr>=${bool}`）の評価再現**:
 *    直前の静的文字列が `?<属性名>=` で終わるバインドに対し、
 *    - `true` の場合: `?<属性名>=` を `<属性名>` のみに変換して残します。
 *    - `false` の場合: `?<属性名>=` を完全に除去します。
 * 4. **プリミティブ値の変換**:
 *    `null` や `undefined` は空文字 `""` に変換し、その他は `String(val)` として結合します。
 *
 * ## 使用例
 * ```typescript
 * import { html } from "lit";
 * import { flattenTemplate } from "@shared/utils";
 *
 * // 1. 基本的なテンプレート展開
 * const tpl = html`<div class=${"active"}>${"Hello"}</div>`;
 * const result = flattenTemplate(tpl);
 * // => '<div class="active">Hello</div>'
 *
 * // 2. ネストされた子テンプレートの展開
 * const child = html`<span>Sub</span>`;
 * const parent = html`<div class="main">${child}</div>`;
 * flattenTemplate(parent);
 * // => '<div class="main"><span>Sub</span></div>'
 *
 * // 3. Lit のブール属性 (?hidden=${bool}) の展開
 * const hiddenTpl = html`<aside class="pane" ?hidden=${true}></aside>`;
 * flattenTemplate(hiddenTpl);
 * // => '<aside class="pane" hidden></aside>'
 *
 * const visibleTpl = html`<aside class="pane" ?hidden=${false}></aside>`;
 * flattenTemplate(visibleTpl);
 * // => '<aside class="pane" ></aside>'
 * ```
 *
 * @param {unknown} template 展開対象の Lit TemplateResult または値
 * @returns {string} 展開・統合された完全な HTML 文字列
 */
export const flattenTemplate = (template: unknown): string => {
  if (template === null || template === undefined) {
    return "";
  }

  if (typeof template !== "object") {
    return String(template);
  }

  const t = template as { strings?: readonly string[]; values?: unknown[] };
  if (!t.strings || !Array.isArray(t.strings)) {
    return String(template);
  }

  let result = "";
  for (let i = 0; i < t.strings.length; i++) {
    result += t.strings[i];
    if (t.values && i < t.values.length) {
      const val = t.values[i];

      if (typeof val === "object" && val !== null && "strings" in val) {
        // ネストされた TemplateResult の再帰展開
        result += flattenTemplate(val);
      } else if (typeof val === "boolean") {
        // Lit のブール属性 (?attr=${bool}) の評価再現
        // 例: 直前が ?hidden= の場合
        const boolAttrMatch = t.strings[i].match(/\?([a-zA-Z0-9_\-]+)=$/);
        if (boolAttrMatch) {
          const attrName = boolAttrMatch[1];
          const replaceTarget = `?${attrName}=`;
          const replaceWith = val ? attrName : "";
          // 直前に付加した ?attr= を置換
          result = result.slice(0, -replaceTarget.length) + replaceWith;
        } else {
          result += String(val);
        }
      } else {
        result += val === null || val === undefined ? "" : String(val);
      }
    }
  }

  return result;
};
