import type { TaskRecord, IssueRecord } from "@/db/models/task.model";

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
 * タスクのサマリー項目（第3ペイン上部表示・更新用）の型定義（TaskRecord の射影）
 *
 * @export
 */
export type Summary = Pick<
  TaskRecord,
  "id" | "statusCode" | "name" | "dueDate" | "contacts" | "description"
>;

/**
 * タスクのプロパティ項目（第3ペインプロパティ表示・更新用）の型定義（TaskRecord の射影）
 *
 * @export
 */
export type Property = Pick<
  TaskRecord,
  "fiscalYear" | "labelId" | "bookmark" | "createdAt" | "updatedAt"
>;

/**
 * 課題（サブタスク）表示用の型定義（IssueRecord のエイリアス）
 *
 * @export
 */
export type Issue = IssueRecord;
