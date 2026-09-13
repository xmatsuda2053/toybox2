import type { TaskController } from "@/controllers/task.controller";
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
 * IssuesController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<IssuesController>>}
 */
export const issuesContext = createContext<IssuesController>(
  Symbol("issues-context"),
);
