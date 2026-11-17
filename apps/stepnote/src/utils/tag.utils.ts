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

/**
 * タグ名からバッジの概算描画幅(px)を算出する内部ヘルパー
 */
function estimateTagBadgeWidth(name: string): number {
  let textWidth = 0;
  for (const ch of name) {
    // ASCII文字は 7px、日本語等のマルチバイト文字は 12px として概算
    textWidth += ch.charCodeAt(0) <= 0x7f ? 7 : 12;
  }
  return Math.min(140, textWidth + 18);
}

/**
 * 固定幅の1行領域に収まるタグ一覧と、収まりきらない省略件数(+N)を分割する純粋関数。
 */
export function splitVisibleAndOverflowTags(
  tags: readonly TagRecord[],
  maxWidth: number = 236,
  gap: number = 4,
  overflowBadgeWidth: number = 34,
): { visibleTags: TagRecord[]; hiddenCount: number } {
  if (tags.length === 0 || maxWidth <= 0) {
    return { visibleTags: [], hiddenCount: tags.length };
  }

  const widths = tags.map((tag) => estimateTagBadgeWidth(tag.name));
  const totalWidth = widths.reduce(
    (sum, w, idx) => sum + w + (idx > 0 ? gap : 0),
    0,
  );
  if (totalWidth <= maxWidth) {
    return { visibleTags: [...tags], hiddenCount: 0 };
  }

  const available = maxWidth - overflowBadgeWidth - gap;
  let used = 0;
  let visibleCount = 0;
  for (let i = 0; i < widths.length; i++) {
    const step = widths[i] + (i > 0 ? gap : 0);
    if (used + step > available) {
      break;
    }
    used += step;
    visibleCount += 1;
  }

  return {
    visibleTags: tags.slice(0, visibleCount),
    hiddenCount: tags.length - visibleCount,
  };
}
