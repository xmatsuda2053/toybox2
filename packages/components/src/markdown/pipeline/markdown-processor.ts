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

import { normalizeMarkdownLinksWithSpaces } from "../utils/link-normalizer.js";

/**
 * 危険なスクリプト・データ URI スキーム（javascript:, vbscript:, data:）を遮断し、
 * それ以外の URL・Windows パス・カスタムスキーム・独自文字列を許可する正規表現
 */
const SAFE_HREF_PATTERN =
  /^(?!(?:\s|%[0-9a-f]{2})*(?:javascript|vbscript|data):)/i;

/**
 * GFM 構文（チェックボックス、テーブル等）および安全なカスタムリンクを許可するための拡張サニタイズベーススキーマ
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
  protocols: {
    ...defaultSchema.protocols,
    href: [],
  },
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a || []).filter(
        (attr) =>
          attr !== "href" && (!Array.isArray(attr) || attr[0] !== "href"),
      ),
      ["href", SAFE_HREF_PATTERN],
    ],
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
 * JSON.parse(JSON.stringify(baseSchema)) 等で RegExp が直列化消失した場合に
 * a[href] の安全な正規表現ルールを復元する純粋関数
 */
function restoreSafeHrefPattern(schema: SanitizeSchema): SanitizeSchema {
  const aAttrs = schema.attributes?.a;
  if (!aAttrs) return schema;

  const restoredAAttrs = aAttrs.map((attr) => {
    if (
      Array.isArray(attr) &&
      attr[0] === "href" &&
      attr[1] &&
      typeof attr[1] === "object" &&
      !(attr[1] instanceof RegExp)
    ) {
      return ["href", SAFE_HREF_PATTERN] as [string, RegExp];
    }
    return attr;
  });

  return {
    ...schema,
    attributes: {
      ...schema.attributes,
      a: restoredAAttrs,
    },
  };
}

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
    ? restoreSafeHrefPattern(sanitizeSchemaModifier(baseSchema))
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
      const normalizedMarkdown = normalizeMarkdownLinksWithSpaces(markdown);
      const vfile = await processor.process(normalizedMarkdown);
      return String(vfile);
    },
    get internalProcessor() {
      return processor as unknown as Processor;
    },
  };
}
