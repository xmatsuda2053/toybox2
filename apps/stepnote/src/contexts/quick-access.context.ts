import type { QuickAccessController } from "@/controllers/quick-access.controller.js";
import { createContext } from "@lit/context";

/**
 * QuickAccess のコンテキスト。
 *
 */
export const quickAccessContext = createContext<QuickAccessController>(
  Symbol("quick-access-context"),
);
