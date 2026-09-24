/**
 * ジャーナル（作業ログ・ノート共通）レコードの永続化エンティティ基底型定義
 *
 * @export
 * @interface JournalRecord
 */
export interface JournalRecord {
  /** レコードID（自動採番） */
  id?: number;
  /** 紐づくタスクID */
  taskId: number;
  /** 記録内容 */
  value: string;
  /** 作成日時 */
  createdAt?: Date;
  /** 更新日時 */
  updatedAt?: Date;
}

/**
 * 作業ログレコードの永続化エンティティ型定義
 *
 * @export
 */
export type LogRecord = JournalRecord;

/**
 * ノート・メモレコードの永続化エンティティ型定義
 *
 * @export
 */
export type NoteRecord = JournalRecord;
