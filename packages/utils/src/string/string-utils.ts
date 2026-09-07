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
