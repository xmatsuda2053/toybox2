import type { LogRecord } from "@/db/models/journal.model";

/**
 * ログ本文の1行目からタイトル文字列を抽出する。
 * 先頭の Markdown 見出し記号（# 等）は除外され、空の場合はデフォルト文字列を返す。
 *
 * @export
 * @param {string} value ログ本文（Markdown文字列）
 * @return {string} 抽出されたタイトル
 */
export function extractLogTitle(value: string): string {
  if (!value || typeof value !== "string") {
    return "(無題のログ)";
  }

  const firstLine = value.split(/\r?\n/)[0]?.trim() ?? "";
  const titleWithoutHeading = firstLine.replace(/^#+\s*/, "").trim();

  if (!titleWithoutHeading) {
    return "(無題のログ)";
  }

  return titleWithoutHeading;
}

/**
 * 検索キーワードに基づいてログ一覧をフィルタリングする。
 * タイトルまたは本文にキーワードが含まれる（大文字小文字無視）ログを抽出する。
 *
 * @export
 * @param {readonly LogRecord[]} logs ログ一覧
 * @param {string} query 検索キーワード
 * @return {LogRecord[]} フィルタリング後のログ一覧
 */
export function filterLogs(
  logs: readonly LogRecord[],
  query: string,
): LogRecord[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [...logs];
  }

  return logs.filter((log) => {
    const title = extractLogTitle(log.value).toLowerCase();
    const body = (log.value || "").toLowerCase();
    return title.includes(normalizedQuery) || body.includes(normalizedQuery);
  });
}

/**
 * Date オブジェクトを "YYYY-MM-DD HH:mm:ss" 形式の文字列にフォーマットする。
 * 不正な日付または未定義の場合は空文字列を返す。
 *
 * @export
 * @param {(Date | undefined)} date フォーマット対象の日時
 * @return {string} フォーマット済み日時文字列
 */
export function formatLogDate(date?: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");

  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

/**
 * ログ一覧を作成日時（createdAt）の降順（新しい順）にソートする。
 * createdAt が未定義の場合は 0（末尾）として扱う。
 * 同日時の場合は ID 降順で安定ソートする。
 * 元の配列を変更せず、新しい配列を返す。
 *
 * @export
 * @param {readonly LogRecord[]} logs ログ一覧
 * @return {LogRecord[]} 作成日時降順にソートされたログ一覧
 */
export function sortLogsByCreatedAtDesc(
  logs: readonly LogRecord[],
): LogRecord[] {
  return [...logs].sort((a, b) => {
    const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
    const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    const idA = a.id ?? 0;
    const idB = b.id ?? 0;
    return idB - idA;
  });
}
