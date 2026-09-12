import type { TaskStatusCode } from "@/types/domain/task-status.type";
import type { Contact, CurrentStatus } from "@/types/domain/task-detail.type";

/**
 * タスクの型定義
 */
export type TaskRecord = {
  id?: number;
  statusCode: TaskStatusCode;
  name: string;
  dueDate: Date;
  contacts: Contact[];
  currentStatus: CurrentStatus;
  description: string;
  fiscalYear: number;
  labelId: number;
  bookmark: boolean;
  selected: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * 課題（サブタスク）の型定義
 */
export type IssueRecord = {
  id?: number;
  taskId: number;
  statusCode: TaskStatusCode;
  title: string;
  value: string;
  dueDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
};
