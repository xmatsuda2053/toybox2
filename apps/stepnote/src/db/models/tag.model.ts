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

/**
 * タグセットレコードの永続化エンティティ型定義
 *
 * @export
 * @interface TagSetRecord
 */
export interface TagSetRecord {
  /** レコードID（自動採番） */
  id?: number;
  /** タグセット名（ユニーク） */
  name: string;
  /** タグセットの説明文 */
  description: string;
  /** セットに含まれるタグID配列 */
  tagIds: number[];
  /** 作成日時 */
  createdAt?: Date;
  /** 更新日時 */
  updatedAt?: Date;
}

/**
 * タグセット新規作成時の入力型
 */
export interface CreateTagSetInput {
  name: string;
  description?: string;
  tagIds: readonly number[];
}
