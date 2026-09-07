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
