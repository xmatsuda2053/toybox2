/**
 * Web Awesome `<wa-tag>` のカラーバリアント定義
 */
export type TagVariant =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger";

/**
 * タグレコードの永続化エンティティ型定義
 *
 * @export
 * @interface TagRecord
 */
export interface TagRecord {
  /** レコードID（自動採番） */
  id?: number;
  /** タグ名（ユニーク） */
  name: string;
  /** タグの説明文 */
  description: string;
  /** 表示カラーバリアント */
  variant: TagVariant;
  /** 作成日時 */
  createdAt?: Date;
  /** 更新日時 */
  updatedAt?: Date;
}

/**
 * タグ新規作成時の入力型
 */
export interface CreateTagInput {
  name: string;
  description?: string;
  variant?: TagVariant;
}
