/**
 * 作業ログレコードの永続化エンティティ型定義
 *
 * @export
 * @interface LogRecord
 */
export interface LogRecord {
  /** レコードID（自動採番） */
  id?: number;
  /** 紐づくタスクID */
  taskId: number;
  /** ログ内容 */
  value: string;
  /** 作成日時 */
  createdAt?: Date;
  /** 更新日時 */
  updatedAt?: Date;
}

/**
 * ノート・メモレコードの永続化エンティティ型定義
 *
 * @export
 * @interface NoteRecord
 */
export interface NoteRecord {
  /** レコードID（自動採番） */
  id?: number;
  /** 紐づくタスクID */
  taskId: number;
  /** ノート内容 */
  value: string;
  /** 作成日時 */
  createdAt?: Date;
  /** 更新日時 */
  updatedAt?: Date;
}
