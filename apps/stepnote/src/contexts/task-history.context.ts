import type { TaskHistoryController } from "@/controllers/task-history.controller.js";
import { createContext } from "@lit/context";

/**
 * TaskHistoryController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<TaskHistoryController>>}
 */
export const taskHistoryContext = createContext<TaskHistoryController>(
  Symbol("task-history-context"),
);

