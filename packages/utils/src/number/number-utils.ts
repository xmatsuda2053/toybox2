/**
 * 指定した桁数で数値をゼロパディングし、文字列として返却する。
 * @param num　- 対象の数値
 * @param length - 桁数
 * @returns ゼロパディングされた文字列
 * @example
 * padZero(5, 3) // "005"
 * padZero(123, 5) // "00123"
 * padZero(0, 2) // "00"
 * padZero(42, 1) // "42" (桁数が足りない場合はそのまま返す)
 */
export function padZero(num: number, length: number): string {
  return String(num).padStart(length, "0");
}

/**
 * 指定した値を最小値（min）と最大値（max）の範囲内に収める。
 *
 * @export
 * @param {number} val - 制限対象の数値
 * @param {number} min - 許容される最小値
 * @param {number} max - 許容される最大値
 * @return {*} {number} 範囲内に制限された数値
 * @throws {RangeError} min が max より大きい場合にスローされる
 * @example
 * clamp(5, 0, 10)  // 5 (範囲内なのでそのまま)
 * clamp(-5, 0, 10) // 0 (最小値未満なので min)
 * clamp(15, 0, 10) // 10 (最大値超過なので max)
 */
export function clamp(val: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError(`min (${min}) cannot be greater than max (${max})`);
  }
  return Math.min(Math.max(val, min), max);
}
