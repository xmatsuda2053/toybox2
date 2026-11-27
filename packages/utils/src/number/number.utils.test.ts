import { describe, it, expect } from "vitest";
import {
  padZero,
  clamp,
  normalizeAllowedNumber,
  normalizeNumericId,
} from "./number.utils";

/** *
 * - [x] 仕様 1: 指定した桁数のゼロパディングが正しく行われること。
 * - [x] 仕様 2: 桁数が足りない場合はそのまま返すこと。
 * - [x] 仕様 3: 数値が0の場合も正しくゼロパディングされること。
 * - [x] 仕様 4: 最小値と最大値の間の値はそのまま返されること。
 * - [x] 仕様 5: 最小値未満の値は最小値に丸められること。
 * - [x] 仕様 6: 最大値を超える値は最大値に丸められること。
 * - [x] 仕様 7: 最小値が最大値より大きく指定された場合は RangeError をスローすること。
 * - [x] 仕様 8: normalizeAllowedNumber で文字列・数値が許可候補の数値へ正規化され、不正値はフォールバックされること。
 * - [x] 仕様 9: normalizeNumericId で正の整数またはその文字列表現が数値型へ正規化され、不正値は undefined を返すこと。
 */
describe("number.utils.padZero", () => {
  it("指定した桁数のゼロパディングが正しく行われること", () => {
    expect(padZero(5, 3)).toBe("005");
    expect(padZero(123, 5)).toBe("00123");
    expect(padZero(0, 2)).toBe("00");
    expect(padZero(42, 1)).toBe("42"); // 桁数が足りない場合はそのまま返す
  });
  it("桁数が足りない場合はそのまま返すこと", () => {
    expect(padZero(42, 1)).toBe("42");
    expect(padZero(12345, 3)).toBe("12345");
  });
  it("数値が0の場合も正しくゼロパディングされること", () => {
    expect(padZero(0, 2)).toBe("00");
    expect(padZero(0, 5)).toBe("00000");
  });
});

describe("number.utils.clamp", () => {
  it("最小値と最大値の間の値はそのまま返されること", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("最小値未満の値は最小値に丸められること", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(-100, -50, 50)).toBe(-50);
  });

  it("最大値を超える値は最大値に丸められること", () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(100, -50, 50)).toBe(50);
  });

  it("最小値が最大値より大きく指定された場合は RangeError をスローすること", () => {
    expect(() => clamp(5, 10, 0)).toThrow(RangeError);
  });
});

describe("number.utils.normalizeAllowedNumber", () => {
  const STATUS_CODES = [0, 5, 9] as const;

  it("許可された数値または数値文字列が対応する数値へ正規化されること", () => {
    expect(normalizeAllowedNumber(0, STATUS_CODES, 0)).toBe(0);
    expect(normalizeAllowedNumber(5, STATUS_CODES, 0)).toBe(5);
    expect(normalizeAllowedNumber(9, STATUS_CODES, 0)).toBe(9);
    expect(normalizeAllowedNumber("0", STATUS_CODES, 0)).toBe(0);
    expect(normalizeAllowedNumber("5", STATUS_CODES, 0)).toBe(5);
    expect(normalizeAllowedNumber(" 9 ", STATUS_CODES, 0)).toBe(9);
  });

  it("候補外の数値や空文字・null・undefined などはフォールバック値へ変換されること", () => {
    expect(normalizeAllowedNumber(1, STATUS_CODES, 0)).toBe(0);
    expect(normalizeAllowedNumber("99", STATUS_CODES, 0)).toBe(0);
    expect(normalizeAllowedNumber("", STATUS_CODES, 0)).toBe(0);
    expect(normalizeAllowedNumber("  ", STATUS_CODES, 0)).toBe(0);
    expect(normalizeAllowedNumber(null, STATUS_CODES, 0)).toBe(0);
    expect(normalizeAllowedNumber(undefined, STATUS_CODES, 0)).toBe(0);
    expect(normalizeAllowedNumber("abc", STATUS_CODES, 5)).toBe(5);
  });
});

describe("number.utils.normalizeNumericId", () => {
  it("正の整数および正の整数を表す文字列が数値型へ正規化されること", () => {
    expect(normalizeNumericId(1)).toBe(1);
    expect(normalizeNumericId(42)).toBe(42);
    expect(normalizeNumericId("1")).toBe(1);
    expect(normalizeNumericId("10")).toBe(10);
    expect(normalizeNumericId(" 42 ")).toBe(42);
  });

  it("0・負数・小数・空文字・非数値文字列・null・undefined は undefined を返すこと", () => {
    expect(normalizeNumericId(0)).toBeUndefined();
    expect(normalizeNumericId("0")).toBeUndefined();
    expect(normalizeNumericId(-1)).toBeUndefined();
    expect(normalizeNumericId("-5")).toBeUndefined();
    expect(normalizeNumericId(1.5)).toBeUndefined();
    expect(normalizeNumericId("1.5")).toBeUndefined();
    expect(normalizeNumericId("")).toBeUndefined();
    expect(normalizeNumericId("   ")).toBeUndefined();
    expect(normalizeNumericId("abc")).toBeUndefined();
    expect(normalizeNumericId("1a")).toBeUndefined();
    expect(normalizeNumericId(null)).toBeUndefined();
    expect(normalizeNumericId(undefined)).toBeUndefined();
    expect(normalizeNumericId(Number.NaN)).toBeUndefined();
    expect(normalizeNumericId(Number.POSITIVE_INFINITY)).toBeUndefined();
  });
});
