import { describe, it, expect } from "vitest";
import {
  normalizeTagName,
  normalizeTagVariant,
  sortTagsByNameAsc,
  normalizeTagIds,
} from "./tag.utils";
import type { TagRecord } from "@/db/models/tag.model";

/**
 * 【tag.utils 仕様】
 * 1. normalizeTagName が前後空白と先頭 '#' を除去して正規化すること
 * 2. normalizeTagVariant が有効な variant をそのまま返し、無効値時に "neutral" を返すこと
 * 3. sortTagsByNameAsc が元の配列を変更せずタグ名昇順でソートすること
 * 4. normalizeTagIds が undefined や重複IDを除去して正規化すること
 */
describe("tag.utils", () => {
  it("normalizeTagName が前後空白と先頭 '#' を除去して正規化すること", () => {
    expect(normalizeTagName("  #緊急  ")).toBe("緊急");
    expect(normalizeTagName("##API")).toBe("API");
    expect(normalizeTagName("  ###  ")).toBe("");
    expect(normalizeTagName("C#対応")).toBe("C#対応");
  });

  it("normalizeTagVariant が有効な variant を返し、無効値時に 'neutral' を返すこと", () => {
    expect(normalizeTagVariant("brand")).toBe("brand");
    expect(normalizeTagVariant("danger")).toBe("danger");
    expect(normalizeTagVariant("invalid")).toBe("neutral");
    expect(normalizeTagVariant(undefined)).toBe("neutral");
  });

  it("sortTagsByNameAsc が元の配列を変更せずタグ名昇順でソートすること", () => {
    const raw: TagRecord[] = [
      { id: 1, name: "Tag10", description: "", variant: "neutral" },
      { id: 2, name: "Tag2", description: "", variant: "brand" },
      { id: 3, name: "Alpha", description: "", variant: "success" },
    ];

    const sorted = sortTagsByNameAsc(raw);
    expect(sorted.map((t) => t.name)).toEqual(["Alpha", "Tag2", "Tag10"]);
    expect(raw.map((t) => t.name)).toEqual(["Tag10", "Tag2", "Alpha"]);
  });

  it("normalizeTagIds が undefined や重複IDを除去して正規化すること", () => {
    expect(normalizeTagIds(undefined)).toEqual([]);
    expect(normalizeTagIds([2, 1, 2, 3, 1])).toEqual([2, 1, 3]);
  });
});
