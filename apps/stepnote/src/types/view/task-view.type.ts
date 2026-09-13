import type { TaskStatusCode } from "@/types/domain/task-status.type";
import type { Contact } from "@/types/domain/task-detail.type";
import type { TaskRecord } from "@/db/models/task.model";

/**
 * タスク新規作成ダイアログ等からの入力情報の型定義
 *
 * @export
 */
export type CreateTaskInput = Partial<Omit<TaskRecord, "id">> & {
  /** タスク名 */
  name: string;
  /** 期日 */
  dueDate: Date;
  /** 対象年度 */
  fiscalYear: number;
  /** 所属ラベルID */
  labelId: number;
};

/**
 * タスクのサマリー項目（第3ペイン上部表示・更新用）の型定義
 *
 * @export
 */
export type Summary = {
  /** タスクID */
  id?: number;
  /** ステータスコード */
  statusCode: TaskStatusCode;
  /** タスク名 */
  name: string;
  /** 期日 */
  dueDate: Date;
  /** 関係者リスト */
  contacts: Contact[];
  /** 詳細説明 */
  description: string;
};

/**
 * タスクのプロパティ項目（第3ペインプロパティ表示・更新用）の型定義
 *
 * @export
 */
export type Property = {
  /** 対象年度 */
  fiscalYear: number;
  /** 所属ラベルID */
  labelId: number;
  /** ブックマークフラグ */
  bookmark: boolean;
  /** 作成日時 */
  createdAt?: Date;
  /** 更新日時 */
  updatedAt?: Date;
};

/**
 * 課題（サブタスク）表示用の型定義
 *
 * @export
 */
export type Issue = {
  /** 課題ID */
  id?: number;
  /** 紐づくタスクID */
  taskId: number;
  /** ステータスコード */
  statusCode: TaskStatusCode;
  /** 課題タイトル */
  title: string;
  /** 課題内容 */
  value: string;
  /** 期日 */
  dueDate: Date;
  /** 作成日時 */
  createdAt?: Date;
  /** 更新日時 */
  updatedAt?: Date;
};
