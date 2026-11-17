import type { TagRecord } from "@/db/models/tag.model";
import { normalizeTagName } from "@/utils/tag.utils";

/**
 * コンテナ幅から1行に収まるタグの表示可能件数を算出する純粋関数。
 * すべてのタグが収まる場合は全件数を返し、収まらない場合は +N バッジ幅を差し引いて算出する。
 */
export function computeVisibleTagCount(
  tagWidths: readonly number[],
  maxWidth: number,
  gap: number = 4,
  overflowBadgeWidth: number = 36,
): number {
  if (tagWidths.length === 0 || maxWidth <= 0) {
    return 0;
  }

  let totalWidth = 0;
  for (let i = 0; i < tagWidths.length; i++) {
    totalWidth += tagWidths[i] + (i > 0 ? gap : 0);
  }
  if (totalWidth <= maxWidth) {
    return tagWidths.length;
  }

  const availableWidth = maxWidth - overflowBadgeWidth - gap;
  if (availableWidth <= 0) {
    return 0;
  }

  let usedWidth = 0;
  let visibleCount = 0;
  for (let i = 0; i < tagWidths.length; i++) {
    const itemWidth = tagWidths[i] + (i > 0 ? gap : 0);
    if (usedWidth + itemWidth > availableWidth) {
      break;
    }
    usedWidth += itemWidth;
    visibleCount += 1;
  }
  return visibleCount;
}

/**
 * キーワードでタグ一覧（タグ名・説明文）を大文字小文字区別なく絞り込む純粋関数。
 */
export function filterTagsByKeyword(
  tags: readonly TagRecord[],
  keyword: string,
): TagRecord[] {
  const normalized = normalizeTagName(keyword).toLowerCase();
  if (!normalized) {
    return [...tags];
  }
  return tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(normalized) ||
      (tag.description ?? "").toLowerCase().includes(normalized),
  );
}

/**
 * 入力されたタグ名で新規タグを作成可能か判定する純粋関数。
 */
export function canCreateNewTag(
  tags: readonly TagRecord[],
  inputName: string,
): boolean {
  const normalized = normalizeTagName(inputName).toLowerCase();
  if (!normalized) {
    return false;
  }
  return !tags.some((tag) => tag.name.toLowerCase() === normalized);
}
