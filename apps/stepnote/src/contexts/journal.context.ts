import type { LogsController } from "@/controllers/logs.controller";
import type { NotesController } from "@/controllers/notes.controller";
import { createContext } from "@lit/context";

/**
 * LogsController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<LogsController>>}
 */
export const logsContext = createContext<LogsController>(
  Symbol("logs-context"),
);

/**
 * NotesController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<NotesController>>}
 */
export const notesContext = createContext<NotesController>(
  Symbol("notes-context"),
);
