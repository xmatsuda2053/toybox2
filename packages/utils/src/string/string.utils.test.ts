import { describe, it, expect } from "vitest";
import { isBlank, isNotBlank, extractMarkdownTitle } from "./string.utils";

/**
 * - [x] 仕様 1: null, undefined, 空文字の場合は true を返すこと。
 * - [x] 仕様 2: 空白文字のみの文字列の場合は true を返すこと。
 * - [x] 仕様 3: 空白文字以外の文字が含まれる場合は false を返すこと。
 * - [x] 仕様 4: 空白文字以外の文字が含まれる場合は true を返し、型が string に絞り込まれること。
 * - [x] 仕様 5: null, undefined, 空文字, 空白文字のみの場合は false を返すこと。
 * - [ ] 仕様 6: Markdown本文の1行目から先頭の見出し記号（#等）を除去してタイトルを抽出すること。
 * - [ ] 仕様 7: 空文字や見出し記号のみの場合はフォールバック文字列を返すこと。
 * - [ ] 仕様 8: 本文が空かつフォールバック未指定時は空文字を返すこと。
 */
describe("string.utils.isBlank", () => {
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

describe("string.utils.isNotBlank", () => {
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

describe("string.utils.extractMarkdownTitle", () => {
  it("Markdown本文の1行目から先頭の見出し記号（#等）を除去してタイトルを抽出すること", () => {
    expect(extractMarkdownTitle("# メインタイトル\n\n本文")).toBe("メインタイトル");
    expect(extractMarkdownTitle("### 小見出しタイトル\r\n2行目")).toBe("小見出しタイトル");
    expect(extractMarkdownTitle("見出し記号なしのタイトル\n本文")).toBe("見出し記号なしのタイトル");
  });

  it("空文字や見出し記号のみの場合はフォールバック文字列を返すこと", () => {
    expect(extractMarkdownTitle("", "(無題)")).toBe("(無題)");
    expect(extractMarkdownTitle("   ", "(無題)")).toBe("(無題)");
    expect(extractMarkdownTitle("###   \n本文", "(無題)")).toBe("(無題)");
    expect(extractMarkdownTitle(null as unknown as string, "(無題)")).toBe("(無題)");
  });

  it("本文が空かつフォールバック未指定時は空文字を返すこと", () => {
    expect(extractMarkdownTitle("")).toBe("");
    expect(extractMarkdownTitle("###   ")).toBe("");
  });
});
