import { describe, it, expect } from "vitest";
import {
  normalizeTagName,
  normalizeTagVariant,
  sortTagsByNameAsc,
  normalizeTagIds,
  splitVisibleAndOverflowTags,
  normalizeTagSetName,
  sortTagSetsByNameAsc,
  mergeTagIds,
} from "./tag.utils";
import type { TagRecord } from "@/db/models/tag.model";
import { TAG_VARIANT_LIST } from "@/constants/tag.constants";

/**
 * 【tag.utils 仕様】
 * 1. normalizeTagName が前後空白と先頭 '#' を除去して正規化すること
 * 2. normalizeTagVariant が有効な variant をそのまま返し、無効値時に "neutral" を返すこと
 * 3. sortTagsByNameAsc が元の配列を変更せずタグ名昇順でソートすること
 * 4. normalizeTagIds が undefined や重複IDを除去して正規化すること
 * 5. splitVisibleAndOverflowTags が固定幅内に収まるタグと省略件数(+N)を分割すること
 * 6. TAG_VARIANT_LIST の各選択肢がシンプルな英語の色名（Gray / Blue / Green / Yellow / Red）で定義されていること
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

  it("splitVisibleAndOverflowTags が固定幅内に収まるタグと省略件数を分割すること", () => {
    const tags: TagRecord[] = [
      { id: 1, name: "API", description: "", variant: "brand" },
      { id: 2, name: "緊急対応タスク", description: "", variant: "danger" },
      { id: 3, name: "フロントエンド設計", description: "", variant: "success" },
      { id: 4, name: "レビュー待ち", description: "", variant: "warning" },
    ];

    const empty = splitVisibleAndOverflowTags([], 240);
    expect(empty).toEqual({ visibleTags: [], hiddenCount: 0 });

    const fitAll = splitVisibleAndOverflowTags(tags.slice(0, 2), 300);
    expect(fitAll.visibleTags).toHaveLength(2);
    expect(fitAll.hiddenCount).toBe(0);

    const overflow = splitVisibleAndOverflowTags(tags, 220);
    expect(overflow.visibleTags.length).toBeGreaterThan(0);
    expect(overflow.visibleTags.length).toBeLessThan(4);
    expect(overflow.visibleTags.length + overflow.hiddenCount).toBe(4);
  });

  it("TAG_VARIANT_LIST の各選択肢がシンプルな英語の色名（Gray / Blue / Green / Yellow / Red）で定義されていること", () => {
    expect(TAG_VARIANT_LIST).toEqual([
      { value: "neutral", label: "Gray" },
      { value: "brand", label: "Blue" },
      { value: "success", label: "Green" },
      { value: "warning", label: "Yellow" },
      { value: "danger", label: "Red" },
    ]);
  });

  it("normalizeTagSetName・sortTagSetsByNameAsc・mergeTagIds が正しく動作すること", () => {
    expect(normalizeTagSetName("  #緊急セット  ")).toBe("#緊急セット");

    const sets = [
      { id: 1, name: "セット10", description: "", tagIds: [1] },
      { id: 2, name: "セット2", description: "", tagIds: [2] },
      { id: 3, name: "Alpha", description: "", tagIds: [3] },
    ];
    expect(sortTagSetsByNameAsc(sets).map((s) => s.name)).toEqual([
      "Alpha",
      "セット2",
      "セット10",
    ]);

    expect(mergeTagIds([10, 20], [20, 30, 40, 30])).toEqual([10, 20, 30, 40]);
    expect(mergeTagIds(undefined, [5, 6])).toEqual([5, 6]);
  });
});
