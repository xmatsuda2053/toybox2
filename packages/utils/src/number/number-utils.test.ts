import { describe, it, expect } from "vitest";
import { padZero } from "./number-utils";

/** *
 * - [x] 仕様 1: 指定した桁数のゼロパディングが正しく行われること。
 * - [x] 仕様 2: 桁数が足りない場合はそのまま返すこと。
 * - [x] 仕様 3: 数値が0の場合も正しくゼロパディングされること。
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
