import type { Contact } from "@/types/domain/task-detail.type";

/**
 * 全体検索スニペットの出所タイプ
 */
export type SearchSnippetSourceType =
  | "task_name"
  | "task_description"
  | "task_fiscal_year"
  | "task_contacts"
  | "task_tags"
  | "issue"
  | "note"
  | "log";

/**
 * パース済み検索トークン情報
 */
export interface ParsedSearchTerm {
  /** 重複排除用の一意識別キー（例: "#api" または "api"） */
  raw: string;
  /** タグ専用検索かどうか（先頭 '#' 付き指定） */
  isTagOnly: boolean;
  /** 比較用小文字キーワード（'#' 除去済み） */
  value: string;
}

/**
 * テキストからキーワード周辺のスニペットを抽出する純粋関数
 *
 * @param {string} text 元テキスト
 * @param {string} keyword 検索キーワード
 * @param {number} [maxLength=60] 最大文字数
 * @returns {string} スニペット文字列
 */
export function extractSnippet(
  text: string,
  keyword: string,
  maxLength = 60,
): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const trimmedKeyword = keyword.trim();
  const lowerText = normalized.toLowerCase();
  const lowerKeyword = trimmedKeyword.toLowerCase();
  const matchIndex = trimmedKeyword === "" ? -1 : lowerText.indexOf(lowerKeyword);

  if (matchIndex === -1) {
    return `${normalized.slice(0, maxLength)}…`;
  }

  return buildSnippetWithEllipsis(normalized, matchIndex, trimmedKeyword.length, maxLength);
}

/**
 * 一致位置の前後に省略記号を付与してスニペットを組み立てる内部ヘルパー
 */
function buildSnippetWithEllipsis(
  text: string,
  matchIndex: number,
  keywordLength: number,
  maxLength: number,
): string {
  const halfContext = Math.max(0, Math.floor((maxLength - keywordLength) / 2));
  let start = Math.max(0, matchIndex - halfContext);
  const end = Math.min(text.length, start + maxLength);

  if (end - start < maxLength) {
    start = Math.max(0, end - maxLength);
  }

  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";

  return `${prefix}${text.slice(start, end)}${suffix}`;
}

/**
 * 出所タイプに応じた表示用ラベルを生成する純粋関数
 *
 * @param {SearchSnippetSourceType} sourceType 出所タイプ
 * @param {string} [subItemTitle] サブアイテム（課題等）のタイトル
 * @returns {string} 表示用ラベル
 */
export function formatSourceLabel(
  sourceType: SearchSnippetSourceType,
  subItemTitle?: string,
): string {
  switch (sourceType) {
    case "task_name":
      return "タスク名";
    case "task_description":
      return "詳細説明";
    case "task_fiscal_year":
      return "年度";
    case "task_contacts":
      return "関係者";
    case "task_tags":
      return "タグ";
    case "issue":
      return subItemTitle ? `課題: ${subItemTitle}` : "課題";
    case "note":
      return "ノート";
    case "log":
      return "ログ";
  }
}

/**
 * 検索クエリ文字列を正規化し、スペース（全角・半角）で分割したユニークなキーワード配列を取得する純粋関数
 *
 * @param {string} query 検索クエリ文字列
 * @returns {string[]} トークナイズ済みキーワード配列
 */
export function tokenizeSearchQuery(query: string): string[] {
  const rawTokens = query.trim().split(/[\s\u3000]+/);
  const validTokens = rawTokens
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
  return Array.from(new Set(validTokens));
}

/**
 * 検索クエリを解析し、通常キーワードと '#タグ名' タグ専用キーワードへ分解する純粋関数。
 * 単独の '#' や重複トークンは除外・正規化する。
 */
export function parseSearchTerms(query: string): ParsedSearchTerm[] {
  const tokens = tokenizeSearchQuery(query);
  const seen = new Set<string>();
  const parsed: ParsedSearchTerm[] = [];

  for (const token of tokens) {
    const isTagOnly = token.startsWith("#");
    const value = isTagOnly ? token.replace(/^#+/, "") : token;
    if (!value) continue;

    const raw = isTagOnly ? `#${value}` : value;
    if (seen.has(raw)) continue;

    seen.add(raw);
    parsed.push({ raw, isTagOnly, value });
  }

  return parsed;
}

/**
 * 関係者情報（部署・氏名・連絡先）をスニペット表示・検索向けの単一文字列に整形する純粋関数
 *
 * @param {Contact} contact 関係者情報
 * @returns {string} 整形済み文字列（全項目が空の場合は空文字）
 */
export function formatContactText(contact: Contact): string {
  return [contact.div, contact.name, contact.tel]
    .map((v) => (v ?? "").trim())
    .filter((v) => v.length > 0)
    .join(" / ");
}
