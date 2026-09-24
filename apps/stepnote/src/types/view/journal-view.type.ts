import type { LogRecord, NoteRecord } from "@/db/models/journal.model";

/**
 * 画面表示用 作業ログの型定義（LogRecord のエイリアス）
 *
 * @export
 */
export type Log = LogRecord;

/**
 * 画面表示用 ノート・メモの型定義（NoteRecord のエイリアス）
 *
 * @export
 */
export type Note = NoteRecord;
