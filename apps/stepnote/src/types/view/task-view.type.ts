import type { TaskStatusCode } from "@/types/domain/task-status.type";
import type { Contact } from "@/types/domain/task-detail.type";

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
