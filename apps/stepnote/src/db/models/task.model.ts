import type { TaskStatusCode } from "@/types/domain/task-status.type";
import type { Contact } from "@/types/domain/task-detail.type";

/**
 * タスクレコードの永続化エンティティ型定義
 *
 * @export
 */
export type TaskRecord = {
  /** レコードID（自動採番） */
  id?: number;
  /** ステータスコード（0: 開始待ち, 5: 対応中, 9: 完了） */
  statusCode: TaskStatusCode;
  /** タスク名 */
  name: string;
  /** 期日 */
  dueDate: Date;
  /** 関係者リスト */
  contacts: Contact[];
  /** タスク詳細説明 */
  description: string;
  /** 対象年度 */
  fiscalYear: number;
  /** 所属ラベルID */
  labelId: number;
  /** ブックマークフラグ */
  bookmark: boolean;
  /** 選択状態フラグ */
  selected: boolean;
  /** 作成日時 */
  createdAt?: Date;
  /** 更新日時 */
  updatedAt?: Date;
};

/**
 * 課題（サブタスク）レコードの永続化エンティティ型定義
 *
 * @export
 */
export type IssueRecord = {
  /** レコードID（自動採番） */
  id?: number;
  /** 紐づくタスクID */
  taskId: number;
  /** ステータスコード（0: 開始待ち, 5: 対応中, 9: 完了） */
  statusCode: TaskStatusCode;
  /** 課題タイトル */
  title: string;
  /** 課題内容・説明 */
  value: string;
  /** 期日 */
  dueDate: Date;
  /** 作成日時 */
  createdAt?: Date;
  /** 更新日時 */
  updatedAt?: Date;
};
