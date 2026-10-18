/**
 * スクラッチ（アプリ共通メモ）レコードの永続化エンティティ型定義
 *
 * @export
 * @interface ScratchRecord
 */
export interface ScratchRecord {
  /** レコードID（自動採番） */
  id?: number;
  /** 記録内容 */
  value: string;
  /** 作成日時 */
  createdAt?: Date;
  /** 更新日時 */
  updatedAt?: Date;
}
