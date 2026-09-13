import type { TaskStatusCode } from "@/types/domain/task-status.type";
import type { Contact } from "@/types/domain/task-detail.type";
import type { TaskRecord } from "@/db/models/task.model";

/**
 * タスク新規作成の入力情報
 */
export type CreateTaskInput = Partial<Omit<TaskRecord, "id">> & {
  name: string;
  dueDate: Date;
  fiscalYear: number;
  labelId: number;
};

/**
 * タスクのサマリー定義
 */
export type Summary = {
  id?: number;
  statusCode: TaskStatusCode;
  name: string;
  dueDate: Date;
  contacts: Contact[];
  description: string;
};

/**
 * タスクのプロパティ定義
 */
export type Property = {
  fiscalYear: number;
  labelId: number;
  bookmark: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * 課題（サブタスク）の定義
 */
export type Issue = {
  id?: number;
  taskId: number;
  statusCode: TaskStatusCode;
  title: string;
  value: string;
  dueDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
};
