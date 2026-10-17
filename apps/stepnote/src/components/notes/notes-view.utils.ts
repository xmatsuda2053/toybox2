import type { NoteRecord } from "@/db/models/journal.model";

/**
 * ノート本文の1行目からタイトル文字列を抽出する純粋関数。
 *
 * 先頭の Markdown 見出し記号（#, ##, ### 等）を除去し、
 * 空文字または空白のみの場合はフォールバック文字列を返却する。
 *
 * @param {string} value ノートの Markdown 本文
 * @param {number} [fallbackIndex] フォールバック時のページ番号
 * @return {string} 抽出されたタイトル文字列
 */
export function extractNoteTitle(
  value: string,
  fallbackIndex?: number,
): string {
  const firstLine = value.split(/\r?\n/)[0] ?? "";
  const cleaned = firstLine.replace(/^#+\s*/, "").trim();

  if (cleaned.length > 0) {
    return cleaned;
  }

  if (fallbackIndex !== undefined) {
    return `ページ ${fallbackIndex}`;
  }

  return "(無題のメモ)";
}

/**
 * 検索クエリに基づきノート一覧をフィルタリングする純粋関数。
 *
 * クエリが空文字・空白のみの場合は全ノートを返却し、
 * クエリが存在する場合はタイトルまたは本文に部分一致（大文字小文字無視）するノートを抽出する。
 *
 * @param {readonly NoteRecord[]} notes ノート一覧
 * @param {string} query 検索クエリ文字列
 * @return {NoteRecord[]} 絞り込まれたノート配列
 */
export function filterNotes(
  notes: readonly NoteRecord[],
  query: string,
): NoteRecord[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) {
    return [...notes];
  }

  return notes.filter((note) => {
    const title = extractNoteTitle(note.value).toLowerCase();
    const content = note.value.toLowerCase();
    return title.includes(trimmed) || content.includes(trimmed);
  });
}

/**
 * ノート一覧を作成日時の昇順（古い順：ページ1, 2, ...）でソートする純粋関数。
 * 作成日時が同日時または未設定の場合は、レコードIDの昇順で安定ソートする。
 *
 * @param {readonly NoteRecord[]} notes ノート一覧
 * @return {NoteRecord[]} ソート済みノート配列
 */
export function sortNotesByCreatedAtAsc(
  notes: readonly NoteRecord[],
): NoteRecord[] {
  return [...notes].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return (a.id ?? 0) - (b.id ?? 0);
  });
}
