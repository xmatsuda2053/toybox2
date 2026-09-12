import type { LabelsController } from "@/controllers/labels.controller.js";
import { createContext } from "@lit/context";

/**
 * LabelsController のコンテキスト。
 *
 */
export const labelsContext = createContext<LabelsController>(
  Symbol("labels-context"),
);
