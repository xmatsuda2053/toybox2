import { createContext } from "@lit/context";
import type { TaskTableController } from "@/controllers/task-table.controller";

/**
 * TaskTableController の Context 定義
 */
export const taskTableContext = createContext<TaskTableController>(
  Symbol("task-table-context"),
);
