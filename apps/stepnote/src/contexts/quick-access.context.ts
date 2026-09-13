import type { QuickAccessController } from "@/controllers/quick-access.controller.js";
import { createContext } from "@lit/context";

/**
 * QuickAccessController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<QuickAccessController>>}
 */
export const quickAccessContext = createContext<QuickAccessController>(
  Symbol("quick-access-context"),
);
