/**
 * 指定した桁数で数値をゼロパディングし、文字列として返却する。
 * @param num - 対象の数値
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

/**
 * 未知の値を数値へ変換し、許可された候補値のいずれかに一致する場合はその値を、
 * 不正または候補外の場合はフォールバック値を返す。
 *
 * @export
 * @template T
 * @param {unknown} value - 変換対象の値
 * @param {readonly T[]} allowedValues - 許可する数値候補の配列
 * @param {T} fallback - 候補外・不正値時のフォールバック値
 * @return {T} 正規化された数値
 */
export function normalizeAllowedNumber<T extends number>(
  value: unknown,
  allowedValues: readonly T[],
  fallback: T,
): T {
  if (typeof value === "number" && Number.isFinite(value)) {
    return allowedValues.includes(value as T) ? (value as T) : fallback;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && allowedValues.includes(parsed as T)) {
      return parsed as T;
    }
  }
  return fallback;
}

/**
 * 未知の値を正の整数 ID（1 以上の安全な整数）へ正規化する。
 * 正の整数または正の整数を表す文字列（前後空白可）の場合は数値型を返し、
 * それ以外の不正値の場合は undefined を返す。
 *
 * @export
 * @param {unknown} value - 変換対象の値
 * @return {number | undefined} 正規化された正の整数 ID（不正値時は undefined）
 */
export function normalizeNumericId(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? value : undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}
