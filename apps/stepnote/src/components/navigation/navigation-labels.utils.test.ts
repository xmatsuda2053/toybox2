import { describe, it, expect } from "vitest";
import type { LabelRecord } from "@/db/models/navigation.model.js";
import {
  sortLabelsByNameAsc,
  isLabelTextTruncated,
  getLabelTextElementId,
} from "./navigation-labels.utils.js";

/**
 * 【NavigationLabelsUtils 仕様 (ラベルソート・省略表示判定・ID生成純粋関数)】
 *
 * 1. sortLabelsByNameAsc
 *    - 1-1. 空配列を渡した場合は空配列を返却すること
 *    - 1-2. 単一要素の配列を渡した場合は同一内容の新しい配列を返却すること
 *    - 1-3. 日本語ラベル名（五十音順・漢字）を昇順でソートすること
 *    - 1-4. アルファベットのラベル名を辞書順（自然順）で昇順ソートすること
 *    - 1-5. 数値を含むラベル名を自然順（natural sort: 1, 2, 10）で昇順ソートすること
 *    - 1-6. ラベル名が同一の場合は元の安定した順序を維持すること
 *    - 1-7. 元の配列を変更しないこと（イミュータブル）
 *
 * 2. isLabelTextTruncated
 *    - 2-1. scrollWidth が clientWidth より大きく、clientWidth > 0 の場合に true を返すこと
 *    - 2-2. scrollWidth と clientWidth が等しい場合に false を返すこと
 *    - 2-3. scrollWidth が clientWidth より小さい場合に false を返すこと
 *    - 2-4. clientWidth が 0 以下（非表示状態等）の場合は scrollWidth に関わらず false を返すこと
 *
 * 3. getLabelTextElementId
 *    - 3-1. labelId が数値の場合に "label-text-<id>" 形式の ID を返すこと
 *    - 3-2. labelId が undefined の場合にフォールバックインデックスを用いた一意の ID（"label-text-idx-<index>"）を返すこと
 */
describe("NavigationLabelsUtils - sortLabelsByNameAsc", () => {
  it("1-1. 空配列を渡した場合は空配列を返却すること", () => {
    const result = sortLabelsByNameAsc([]);
    expect(result).toEqual([]);
  });

  it("1-2. 単一要素の配列を渡した場合は同一内容の新しい配列を返却すること", () => {
    const single: LabelRecord[] = [
      { id: 1, name: "単一ラベル", description: "", isSelected: false },
    ];
    const result = sortLabelsByNameAsc(single);
    expect(result).toEqual(single);
    expect(result).not.toBe(single);
  });

  it("1-3. 日本語ラベル名（五十音順・漢字）を昇順でソートすること", () => {
    const labels: LabelRecord[] = [
      { id: 1, name: "プロジェクトA", description: "", isSelected: false },
      { id: 2, name: "プライベート", description: "", isSelected: false },
      { id: 3, name: "あさひ", description: "", isSelected: false },
    ];
    const sorted = sortLabelsByNameAsc(labels);
    expect(sorted.map((l) => l.name)).toEqual([
      "あさひ",
      "プライベート",
      "プロジェクトA",
    ]);
  });

  it("1-4. アルファベットのラベル名を辞書順（自然順）で昇順ソートすること", () => {
    const labels: LabelRecord[] = [
      { id: 1, name: "Zebra", description: "", isSelected: false },
      { id: 2, name: "apple", description: "", isSelected: false },
      { id: 3, name: "Banana", description: "", isSelected: false },
    ];
    const sorted = sortLabelsByNameAsc(labels);
    expect(sorted.map((l) => l.name)).toEqual(["apple", "Banana", "Zebra"]);
  });

  it("1-5. 数値を含むラベル名を自然順（natural sort: 1, 2, 10）で昇順ソートすること", () => {
    const labels: LabelRecord[] = [
      { id: 1, name: "Task 10", description: "", isSelected: false },
      { id: 2, name: "Task 2", description: "", isSelected: false },
      { id: 3, name: "Task 1", description: "", isSelected: false },
    ];
    const sorted = sortLabelsByNameAsc(labels);
    expect(sorted.map((l) => l.name)).toEqual(["Task 1", "Task 2", "Task 10"]);
  });

  it("1-6. ラベル名が同一の場合は元の安定した順序を維持すること", () => {
    const labels: LabelRecord[] = [
      { id: 10, name: "同じ名前", description: "1つ目", isSelected: false },
      { id: 5, name: "同じ名前", description: "2つ目", isSelected: false },
    ];
    const sorted = sortLabelsByNameAsc(labels);
    expect(sorted.map((l) => l.description)).toEqual(["1つ目", "2つ目"]);
  });

  it("1-7. 元の配列を変更しないこと（イミュータブル）", () => {
    const original: readonly LabelRecord[] = [
      { id: 1, name: "B", description: "", isSelected: false },
      { id: 2, name: "A", description: "", isSelected: false },
    ];
    const originalCopy = [...original];
    sortLabelsByNameAsc(original);
    expect(original).toEqual(originalCopy);
  });
});

describe("NavigationLabelsUtils - isLabelTextTruncated", () => {
  it("2-1. scrollWidth が clientWidth より大きく、clientWidth > 0 の場合に true を返すこと", () => {
    expect(isLabelTextTruncated(200, 120)).toBe(true);
  });

  it("2-2. scrollWidth と clientWidth が等しい場合に false を返すこと", () => {
    expect(isLabelTextTruncated(120, 120)).toBe(false);
  });

  it("2-3. scrollWidth が clientWidth より小さい場合に false を返すこと", () => {
    expect(isLabelTextTruncated(80, 120)).toBe(false);
  });

  it("2-4. clientWidth が 0 以下（非表示状態等）の場合は scrollWidth に関わらず false を返すこと", () => {
    expect(isLabelTextTruncated(100, 0)).toBe(false);
    expect(isLabelTextTruncated(100, -1)).toBe(false);
  });
});

describe("NavigationLabelsUtils - getLabelTextElementId", () => {
  it('3-1. labelId が数値の場合に "label-text-<id>" 形式の ID を返すこと', () => {
    expect(getLabelTextElementId(12, 0)).toBe("label-text-12");
  });

  it('3-2. labelId が undefined の場合にフォールバックインデックスを用いた一意の ID（"label-text-idx-<index>"）を返すこと', () => {
    expect(getLabelTextElementId(undefined, 3)).toBe("label-text-idx-3");
  });
});

