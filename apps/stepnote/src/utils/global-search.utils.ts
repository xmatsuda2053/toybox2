/**
 * 全体検索スニペットの出所タイプ
 */
export type SearchSnippetSourceType =
  | "task_name"
  | "task_description"
  | "task_fiscal_year"
  | "issue"
  | "note"
  | "log";

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
