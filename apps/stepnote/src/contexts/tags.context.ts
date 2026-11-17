import type { TagsController } from "@/controllers/tags.controller";
import { createContext } from "@lit/context";

/**
 * TagsController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<TagsController>>}
 */
export const tagsContext = createContext<TagsController>(
  Symbol("tags-context"),
);
