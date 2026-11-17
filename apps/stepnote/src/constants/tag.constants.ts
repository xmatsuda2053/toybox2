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
  label: string;
}

/**
 * 利用可能なタグカラーバリアント一覧
 */
export const TAG_VARIANT_LIST: readonly TagVariantOption[] = [
  { value: "neutral", label: "Gray" },
  { value: "brand", label: "Blue" },
  { value: "success", label: "Green" },
  { value: "warning", label: "Yellow" },
  { value: "danger", label: "Red" },
] as const;

/**
 * 有効な TagVariant 値の集合
 */
export const VALID_TAG_VARIANTS: ReadonlySet<string> = new Set<TagVariant>(
  TAG_VARIANT_LIST.map((item) => item.value),
);
