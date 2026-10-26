import {
  TaskRecord,
  IssueRecord,
  LogRecord,
  NoteRecord,
  QuickAccessRecord,
  LabelRecord,
  ScratchRecord,
} from "../models/index";
import Dexie, { Table } from "dexie";
import { extractMarkdownTitle } from "@shared/utils";

/**
 * StepNote アプリケーションの IndexedDB データベーススキーマ定義
 *
 * @export
 * @class Database
 * @extends {Dexie}
 */
export class Database extends Dexie {
  /**
   * タスクテーブル
   *
   * @type {Table<TaskRecord, number>}
   * @memberof Database
   */
  tasks!: Table<TaskRecord, number>;

  /**
   * 課題テーブル
   *
   * @type {Table<IssueRecord, number>}
   * @memberof Database
   */
  issues!: Table<IssueRecord, number>;

  /**
   * 作業ログテーブル
   *
   * @type {Table<LogRecord, number>}
   * @memberof Database
   */
  logs!: Table<LogRecord, number>;

  /**
   * ノート・メモテーブル
   *
   * @type {Table<NoteRecord, number>}
   * @memberof Database
   */
  notes!: Table<NoteRecord, number>;

  /**
   * クイックアクセス状態テーブル
   *
   * @type {Table<QuickAccessRecord, number>}
   * @memberof Database
   */
  quickAccess!: Table<QuickAccessRecord, number>;

  /**
   * ラベルテーブル
   *
   * @type {Table<LabelRecord, number>}
   * @memberof Database
   */
  labels!: Table<LabelRecord, number>;

  /**
   * スクラッチ（共通メモ）テーブル
   *
   * @type {Table<ScratchRecord, number>}
   * @memberof Database
   */
  scratches!: Table<ScratchRecord, number>;

  /**
   * Creates an instance of Database.
   * @memberof Database
   */
  constructor() {
    super("StepNote");
    this.version(1).stores({
      tasks: "++id, statusCode, name, dueDate, fiscalYear, selected",
      issues: "++id, taskId, [taskId+id]",
      logs: "++id, taskId, [taskId+id]",
      notes: "++id, taskId, [taskId+id]",
      quickAccess: "++id",
      labels: "++id, name, isSelected",
    });
    this.version(2).stores({
      scratches: "++id, createdAt",
    });
    this.version(3)
      .stores({
        logs: "++id, taskId, [taskId+id], title",
        notes: "++id, taskId, [taskId+id], title",
        scratches: "++id, createdAt, title",
      })
      .upgrade(async (tx) => {
        await tx
          .table<LogRecord>("logs")
          .toCollection()
          .modify((log) => {
            if (!log.title) {
              log.title = extractMarkdownTitle(log.value, "(無題のログ)");
            }
          });
        await tx
          .table<NoteRecord>("notes")
          .toCollection()
          .modify((note) => {
            if (!note.title) {
              note.title = extractMarkdownTitle(note.value, "(無題のメモ)");
            }
          });
        await tx
          .table<ScratchRecord>("scratches")
          .toCollection()
          .modify((scratch) => {
            if (!scratch.title) {
              scratch.title = extractMarkdownTitle(scratch.value, "(無題のメモ)");
            }
          });
      });
  }
}

/**
 * データベースのシングルトンインスタンス
 *
 * @type {Database}
 */
export const db = new Database();
