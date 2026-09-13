import { describe, it, expect } from "vitest";
import { padZero, clamp } from "./number-utils";

/** *
 * - [x] 仕様 1: 指定した桁数のゼロパディングが正しく行われること。
 * - [x] 仕様 2: 桁数が足りない場合はそのまま返すこと。
 * - [x] 仕様 3: 数値が0の場合も正しくゼロパディングされること。
 * - [x] 仕様 4: 最小値と最大値の間の値はそのまま返されること。
 * - [x] 仕様 5: 最小値未満の値は最小値に丸められること。
 * - [x] 仕様 6: 最大値を超える値は最大値に丸められること。
 * - [x] 仕様 7: 最小値が最大値より大きく指定された場合は RangeError をスローすること。
 */
describe("number-utils.padZero", () => {
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

describe("number-utils.clamp", () => {
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
