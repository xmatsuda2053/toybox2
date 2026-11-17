import type { TagsController } from "@/controllers/tags.controller";
import type { TagSetsController } from "@/controllers/tag-sets.controller";
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

/**
 * TagSetsController の Context 定義
 *
 * @constant
 * @type {ReturnType<typeof createContext<TagSetsController>>}
 */
export const tagSetsContext = createContext<TagSetsController>(
  Symbol("tag-sets-context"),
);
