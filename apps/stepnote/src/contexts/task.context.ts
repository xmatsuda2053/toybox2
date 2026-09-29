import type { TaskController } from "@/controllers/task.controller";
import type { TaskListController } from "@/controllers/task-list.controller";
import type { IssuesController } from "@/controllers/issues.controller";
import { createContext } from "@lit/context";

/**
 * TaskController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<TaskController>>}
 */
export const taskContext = createContext<TaskController>(
  Symbol("task-context"),
);

/**
 * TaskListController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<TaskListController>>}
 */
export const taskListContext = createContext<TaskListController>(
  Symbol("task-list-context"),
);

/**
 * IssuesController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<IssuesController>>}
 */
export const issuesContext = createContext<IssuesController>(
  Symbol("issues-context"),
);

