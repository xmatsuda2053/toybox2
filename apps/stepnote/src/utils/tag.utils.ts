import type { TagRecord, TagVariant } from "@/db/models/tag.model";
import {
  DEFAULT_TAG_VARIANT,
  VALID_TAG_VARIANTS,
} from "@/constants/tag.constants";

/**
 * タグ名を正規化する（前後空白の除去および先頭 '#' 記号の除去）。
 *
 * @param rawName 入力されたタグ名
 * @returns 正規化済みタグ名
 */
export function normalizeTagName(rawName: string): string {
  return rawName.trim().replace(/^#+/, "").trim();
}

/**
 * タグカラーバリアントを安全な値へ正規化する。
 *
 * @param variant 入力バリアント
 * @returns 有効な TagVariant（無効値時は "neutral"）
 */
export function normalizeTagVariant(variant?: string): TagVariant {
  if (variant && VALID_TAG_VARIANTS.has(variant)) {
    return variant as TagVariant;
  }
  return DEFAULT_TAG_VARIANT;
}

/**
 * タグ一覧をタグ名の自然順・昇順でソートした新しい配列を返す。
 *
 * @param tags 対象タグ一覧
 * @returns ソート済みタグ配列
 */
export function sortTagsByNameAsc(
  tags: readonly TagRecord[],
): TagRecord[] {
  return [...tags].sort((a, b) =>
    a.name.localeCompare(b.name, "ja", { numeric: true }),
  );
}

/**
 * タグID配列を重複なし・数値配列へ正規化する。
 *
 * @param tagIds タグID配列
 * @returns 重複排除済み配列
 */
export function normalizeTagIds(tagIds?: readonly number[]): number[] {
  if (!Array.isArray(tagIds)) {
    return [];
  }
  const seen = new Set<number>();
  const result: number[] = [];
  for (const id of tagIds) {
    if (typeof id === "number" && !Number.isNaN(id) && !seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}
