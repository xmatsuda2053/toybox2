import type { TagVariant } from "@/db/models/tag.model";

/**
 * デフォルトのタグカラーバリアント
 */
export const DEFAULT_TAG_VARIANT: TagVariant = "neutral";

/**
 * タグカラーバリアントの選択肢定義
 */
export interface TagVariantOption {
  value: TagVariant;
  labelJa: string;
}

/**
 * 利用可能なタグカラーバリアント一覧
 */
export const TAG_VARIANT_LIST: readonly TagVariantOption[] = [
  { value: "neutral", labelJa: "標準（グレー）" },
  { value: "brand", labelJa: "ブランド（青）" },
  { value: "success", labelJa: "成功（緑）" },
  { value: "warning", labelJa: "警告（黄）" },
  { value: "danger", labelJa: "危険（赤）" },
] as const;

/**
 * 有効な TagVariant 値の集合
 */
export const VALID_TAG_VARIANTS: ReadonlySet<string> = new Set<TagVariant>(
  TAG_VARIANT_LIST.map((item) => item.value),
);
