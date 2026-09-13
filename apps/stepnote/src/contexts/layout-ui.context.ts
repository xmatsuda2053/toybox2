import type { LayoutUIController } from "@/controllers/layout-ui.controller";
import { createContext } from "@lit/context";

/**
 * LayoutUIController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<LayoutUIController>>}
 */
export const layoutUIContext = createContext<LayoutUIController>(
  Symbol("layout-ui-context"),
);
