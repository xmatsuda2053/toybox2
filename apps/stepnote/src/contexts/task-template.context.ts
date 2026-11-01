import type { TaskTemplateController } from "@/controllers/task-template.controller";
import { createContext } from "@lit/context";

/**
 * TaskTemplateController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<TaskTemplateController>>}
 */
export const taskTemplateContext = createContext<TaskTemplateController>(
  Symbol("task-template-context"),
);

