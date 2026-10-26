/**
 * 引数の値が空白であるか判定する。
 *
 * @export
 * @param {(string | null | undefined)} val - 判定対象の文字列
 * @return {*}  {boolean} isBlankの結果。空白の場合は true、それ以外は false
 * @example
 * isBlank("hello") // false
 * isBlank("")      // true
 * isBlank(null)    // true
 * isBlank("   ")   // true
 */
export function isBlank(val: string | null | undefined): boolean {
  return val === null || val === undefined || val.trim() === "";
}

/**
 * 引数の値が空白（空文字、空白文字のみ、null、undefined）でないかを判定する型ガード。
 *
 * @export
 * @param {(string | null | undefined)} val - 判定対象の値
 * @return {*} {val is string} 空白でない場合は true（TypeScript 上で string 型に絞り込まれる）
 * @example
 * isNotBlank("hello") // true
 * isNotBlank("")      // false
 * isNotBlank(null)    // false
 * isNotBlank("   ")   // false
 */
export function isNotBlank(val: string | null | undefined): val is string {
  return !isBlank(val);
}

/**
 * Markdown 本文の1行目からタイトル文字列を抽出する。
 *
 * 先頭の見出し記号（# 等）および前後の空白文字を除去し、
 * 空文字または無効値の場合はフォールバック文字列を返却する。
 *
 * @export
 * @param {(string | null | undefined)} value - Markdown 本文文字列
 * @param {string} [fallback=""] - タイトルが抽出できない場合のフォールバック文字列
 * @return {string} 抽出されたタイトル文字列
 */
export function extractMarkdownTitle(
  value: string | null | undefined,
  fallback: string = "",
): string {
  if (!isNotBlank(value)) {
    return fallback;
  }

  const firstLine = value.split(/\r?\n/)[0]?.trim() ?? "";
  const titleWithoutHeading = firstLine.replace(/^#+\s*/, "").trim();

  if (!titleWithoutHeading) {
    return fallback;
  }

  return titleWithoutHeading;
}
