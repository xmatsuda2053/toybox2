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

  let processor: Processor<any, any, any, any, any> = unified()
    .use(remarkParse)
    .use(remarkGfm);

  // 1. 外部注入された remark プラグイン群の登録 (MDAST レベルの拡張・独自構文解析)
  for (const pluginItem of remarkPlugins) {
    if (Array.isArray(pluginItem)) {
      const [plugin, pluginOptions] = pluginItem;
      processor = processor.use(plugin as any, pluginOptions);
    } else {
      processor = processor.use(pluginItem as any);
    }
  }

  // 2. remark -> rehype 変換 (MDAST -> HAST)
  processor = processor.use(remarkRehype);

  // 3. サニタイズ処理 (XSS 防御)
  const baseSchema = baseMarkdownSanitizeSchema;
  const finalSchema: SanitizeSchema = sanitizeSchemaModifier
    ? sanitizeSchemaModifier(baseSchema)
    : baseSchema;

  processor = processor.use(rehypeSanitize, finalSchema);

  // 4. 外部注入された rehype プラグイン群の登録 (サニタイズ後の安全な HAST に対する装飾・変換)
  for (const pluginItem of rehypePlugins) {
    if (Array.isArray(pluginItem)) {
      const [plugin, pluginOptions] = pluginItem;
      processor = processor.use(plugin as any, pluginOptions);
    } else {
      processor = processor.use(pluginItem as any);
    }
  }

  // 5. HTML 文字列シリアライズ (HAST -> HTML string)
  processor = processor.use(rehypeStringify);

  return {
    async process(markdown: string): Promise<string> {
      const vfile = await processor.process(markdown);
      return String(vfile);
    },
    get internalProcessor() {
      return processor;
    },
  };
}
