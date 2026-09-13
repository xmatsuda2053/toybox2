import {
  TaskRecord,
  IssueRecord,
  LogRecord,
  NoteRecord,
  QuickAccessRecord,
  LabelRecord,
} from "../models/index";
import Dexie, { Table } from "dexie";

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
  }
}

/**
 * データベースのシングルトンインスタンス
 *
 * @type {Database}
 */
export const db = new Database();
