import type { AutoExportController } from "@/controllers/auto-export.controller.js";
import { createContext } from "@lit/context";

/**
 * AutoExportController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<AutoExportController>>}
 */
export const autoExportContext = createContext<AutoExportController>(
  Symbol("auto-export-context"),
);

