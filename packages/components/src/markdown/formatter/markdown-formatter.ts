import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import { formatMarkdownTables } from "./table-formatter.utils";

function createFormatterProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: "-",
      rule: "-",
      listItemIndent: "one",
    });
}

type FormatterProcessor = ReturnType<typeof createFormatterProcessor>;

let cachedFormatterProcessor: FormatterProcessor | null = null;

function getFormatterProcessor(): FormatterProcessor {
  if (!cachedFormatterProcessor) {
    cachedFormatterProcessor = createFormatterProcessor();
  }
  return cachedFormatterProcessor;
}


/**
 * Markdown テキストを解析・整形（フォーマット）する純粋関数
 *
 * GFM（テーブル、タスクリスト、取り消し線など）をサポートし、
 * 日本語（全角文字）表示幅を考慮したテーブル縦揃えフォーマットを含め、
 * オフライン環境で一貫したスタイルにテキストを整形する。
 *
 * @param markdown 整形対象の Markdown テキスト
 * @returns 整形された Markdown テキスト
 */
export async function formatMarkdown(markdown: string): Promise<string> {
  if (!markdown || markdown.trim().length === 0) {
    return "";
  }

  const processor = getFormatterProcessor();
  const vfile = await processor.process(markdown);
  return formatMarkdownTables(String(vfile));
}

