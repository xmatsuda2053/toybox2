import { unified, type Processor } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type {
  IMarkdownProcessor,
  MarkdownProcessorOptions,
  SanitizeSchema,
} from "../types.js";

/**
 * GFM 構文（チェックボックス、テーブル等）を安全に許可するための拡張サニタイズベーススキーマ
 */
export const baseMarkdownSanitizeSchema: SanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "input",
    "del",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  attributes: {
    ...defaultSchema.attributes,
    input: [
      ["type", "checkbox"],
      "disabled",
      "checked",
      ["className", "task-list-item-checkbox"],
    ],
    th: ["align", "style"],
    td: ["align", "style"],
    code: ["className"],
    span: ["className"],
  },
};

/**
 * Markdown パイプラインプロセッサを生成するファクトリ関数
 *
 * @param options プラグインやサニタイズ設定オプション (DI)
 * @returns IMarkdownProcessor
 */
export function createMarkdownProcessor(
  options: MarkdownProcessorOptions = {},
): IMarkdownProcessor {
  const {
    remarkPlugins = [],
    rehypePlugins = [],
    sanitizeSchemaModifier,
  } = options;

  const baseSchema = baseMarkdownSanitizeSchema;
  const finalSchema: SanitizeSchema = sanitizeSchemaModifier
    ? sanitizeSchemaModifier(baseSchema)
    : baseSchema;

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkPlugins)
    .use(remarkRehype)
    .use(rehypeSanitize, finalSchema)
    .use(rehypePlugins)
    .use(rehypeStringify);

  return {
    async process(markdown: string): Promise<string> {
      const vfile = await processor.process(markdown);
      return String(vfile);
    },
    get internalProcessor() {
      return processor as unknown as Processor;
    },
  };
}
