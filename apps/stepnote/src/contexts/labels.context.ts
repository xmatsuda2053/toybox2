import type { LabelsController } from "@/controllers/labels.controller";
import { createContext } from "@lit/context";

/**
 * LabelsController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<LabelsController>>}
 */
export const labelsContext = createContext<LabelsController>(
  Symbol("labels-context"),
);
