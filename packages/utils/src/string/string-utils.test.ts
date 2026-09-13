import { describe, it, expect } from "vitest";
import { isBlank, isNotBlank } from "./string-utils";

/**
 * - [x] 仕様 1: null, undefined, 空文字の場合は true を返すこと。
 * - [x] 仕様 2: 空白文字のみの文字列の場合は true を返すこと。
 * - [x] 仕様 3: 空白文字以外の文字が含まれる場合は false を返すこと。
 * - [x] 仕様 4: 空白文字以外の文字が含まれる場合は true を返し、型が string に絞り込まれること。
 * - [x] 仕様 5: null, undefined, 空文字, 空白文字のみの場合は false を返すこと。
 */
describe("string-utils.isBlank", () => {
  it("null, undefined, 空文字の場合は true を返すこと", () => {
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank("")).toBe(true);
  });
  it("空白文字のみの文字列の場合は true を返すこと", () => {
    expect(isBlank("   ")).toBe(true);
  });
  it("空白文字以外の文字が含まれる場合は false を返すこと", () => {
    expect(isBlank("hello")).toBe(false);
    expect(isBlank(" world ")).toBe(false);
  });
});

describe("string-utils.isNotBlank", () => {
  it("空白文字以外の文字が含まれる場合は true を返すこと", () => {
    expect(isNotBlank("hello")).toBe(true);
    expect(isNotBlank("  world  ")).toBe(true);
  });

  it("null, undefined, 空文字, 空白文字のみの場合は false を返すこと", () => {
    expect(isNotBlank(null)).toBe(false);
    expect(isNotBlank(undefined)).toBe(false);
    expect(isNotBlank("")).toBe(false);
    expect(isNotBlank("   ")).toBe(false);
    expect(isNotBlank(" \t\n ")).toBe(false);
  });
});
