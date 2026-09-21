import type { ThemeController } from "@/controllers/theme.controller";
import { createContext } from "@lit/context";

/**
 * ThemeController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<ThemeController>>}
 */
export const themeContext = createContext<ThemeController>(
  Symbol("theme-context"),
);
