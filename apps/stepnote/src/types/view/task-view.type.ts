import type { TaskStatusCode } from "@/types/domain/task-status.type";
import type { Contact, CurrentStatus } from "@/types/domain/task-detail.type";

/**
 * タスクのサマリー定義
 */
export type Summary = {
  id?: number;
  statusCode: TaskStatusCode;
  name: string;
  dueDate: Date;
  contacts: Contact[];
  currentStatus: CurrentStatus;
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
