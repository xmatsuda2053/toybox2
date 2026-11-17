import { describe, it, expect } from "vitest";
import {
  computeVisibleTagCount,
  filterTagsByKeyword,
  canCreateNewTag,
} from "./task-tag-bar.utils";
import type { TagRecord } from "@/db/models/tag.model";

/**
 * 【task-tag-bar.utils 仕様】
 *
 * 1. computeVisibleTagCount
 *    - 1-1. タグ配列が空の場合、0 を返すこと
 *    - 1-2. すべてのタグが maxWidth 内に収まる場合、全件数を返すこと
 *    - 1-3. 一部のタグが収まらない場合、+N バッジ幅を差し引いた領域に収まる件数を返すこと
 *    - 1-4. 先頭1つすら収まらない狭い幅でも、最低限のフォールバック（0件、すべて+Nへ格納）が破綻しないこと
 * 2. filterTagsByKeyword
 *    - 2-1. キーワードが空または空白のみの場合、全タグを返すこと
 *    - 2-2. タグ名および説明文に対して大文字小文字を区別せず部分一致フィルタできること
 * 3. canCreateNewTag
 *    - 3-1. 正規化後が空文字の場合は false を返すこと
 *    - 3-2. 既存タグと大小文字違いを含め完全一致する場合は false を返すこと
 *    - 3-3. 新規のタグ名の場合は true を返すこと
 */
describe("task-tag-bar.utils", () => {
  describe("1. computeVisibleTagCount", () => {
    it("1-1. タグ配列が空の場合、0 を返すこと", () => {
      expect(computeVisibleTagCount([], 200)).toBe(0);
    });

    it("1-2. すべてのタグが maxWidth 内に収まる場合、全件数を返すこと", () => {
      // 50 + 4 + 60 + 4 + 40 = 158 <= 200
      expect(computeVisibleTagCount([50, 60, 40], 200, 4, 36)).toBe(3);
    });

    it("1-3. 一部のタグが収まらない場合、+N バッジ幅を差し引いた領域に収まる件数を返すこと", () => {
      // 総幅 250 は maxWidth 160 を超えるため、+N 用幅 (36 + gap 4 = 40) を差し引いた 120 以内で計算
      // 1個目: 60 (<= 120) -> OK
      // 2個目: 60 + 4 + 55 = 119 (<= 120) -> OK
      // 3個目: 119 + 4 + 70 = 193 (> 120) -> NG
      expect(computeVisibleTagCount([60, 55, 70, 65], 160, 4, 36)).toBe(2);
    });

    it("1-4. 先頭1つすら収まらない狭い幅の場合、0 を返すこと", () => {
      expect(computeVisibleTagCount([80, 60], 60, 4, 36)).toBe(0);
    });
  });

  describe("2. filterTagsByKeyword", () => {
    const tags: TagRecord[] = [
      { id: 1, name: "API", description: "バックエンド開発", variant: "brand" },
      { id: 2, name: "緊急", description: "至急対応が必要", variant: "danger" },
      { id: 3, name: "UI", description: "フロントエンド設計", variant: "success" },
    ];

    it("2-1. キーワードが空または空白のみの場合、全タグを返すこと", () => {
      expect(filterTagsByKeyword(tags, "")).toHaveLength(3);
      expect(filterTagsByKeyword(tags, "   ")).toHaveLength(3);
    });

    it("2-2. タグ名および説明文に対して大文字小文字を区別せず部分一致フィルタできること", () => {
      expect(filterTagsByKeyword(tags, "api").map((t) => t.id)).toEqual([1]);
      expect(filterTagsByKeyword(tags, "至急").map((t) => t.id)).toEqual([2]);
      expect(filterTagsByKeyword(tags, "フロント").map((t) => t.id)).toEqual([3]);
    });
  });

  describe("3. canCreateNewTag", () => {
    const tags: TagRecord[] = [
      { id: 1, name: "Design", description: "", variant: "brand" },
      { id: 2, name: "緊急", description: "", variant: "danger" },
    ];

    it("3-1. 正規化後が空文字の場合は false を返すこと", () => {
      expect(canCreateNewTag(tags, "")).toBe(false);
      expect(canCreateNewTag(tags, "  #  ")).toBe(false);
    });

    it("3-2. 既存タグと大小文字違いを含め完全一致する場合は false を返すこと", () => {
      expect(canCreateNewTag(tags, "design")).toBe(false);
      expect(canCreateNewTag(tags, "#Design")).toBe(false);
      expect(canCreateNewTag(tags, "緊急")).toBe(false);
    });

    it("3-3. 新規のタグ名の場合は true を返すこと", () => {
      expect(canCreateNewTag(tags, "新規タグ")).toBe(true);
      expect(canCreateNewTag(tags, "#Backend")).toBe(true);
    });
  });
});
