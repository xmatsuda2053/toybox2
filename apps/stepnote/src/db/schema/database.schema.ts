import {
  TaskRecord,
  IssueRecord,
  LogRecord,
  NoteRecord,
  QuickAccessRecord,
  LabelRecord,
  ScratchRecord,
  TaskTemplateRecord,
  TagRecord,
  TagSetRecord,
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
   * タスクテンプレートテーブル
   *
   * @type {Table<TaskTemplateRecord, number>}
   * @memberof Database
   */
  taskTemplates!: Table<TaskTemplateRecord, number>;

  /**
   * タグテーブル
   *
   * @type {Table<TagRecord, number>}
   * @memberof Database
   */
  tags!: Table<TagRecord, number>;

  /**
   * タグセットテーブル
   *
   * @type {Table<TagSetRecord, number>}
   * @memberof Database
   */
  tagSets!: Table<TagSetRecord, number>;

  /**
   * Creates an instance of Database.
   * @memberof Database
   */
  constructor() {
    super("StepNote");
    this.defineV1ToV3();
    this.defineV4ToV6();
  }

  /** バージョン 1〜3 のスキーマ定義 */
  private defineV1ToV3(): void {
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
        await this.migrateV3Titles(tx);
      });
  }

  /** V3 アップグレード時のタイトル補完 */
  private async migrateV3Titles(tx: {
    table: <T>(name: string) => Table<T, number>;
  }): Promise<void> {
    const targets = [
      { tableName: "logs", fallback: "(無題のログ)" },
      { tableName: "notes", fallback: "(無題のメモ)" },
      { tableName: "scratches", fallback: "(無題のメモ)" },
    ] as const;

    for (const target of targets) {
      await tx
        .table<{ title?: string; value: string }>(target.tableName)
        .toCollection()
        .modify((record) => {
          if (!record.title) {
            record.title = extractMarkdownTitle(record.value, target.fallback);
          }
        });
    }
  }

  /** バージョン 4〜6 のスキーマ定義 */
  private defineV4ToV6(): void {
    this.version(4).stores({
      taskTemplates: "++id, name, createdAt",
    });
    this.version(5)
      .stores({
        tags: "++id, &name",
        tasks: "++id, statusCode, name, dueDate, fiscalYear, selected, *tagIds",
      })
      .upgrade(async (tx) => {
        await tx
          .table<TaskRecord>("tasks")
          .toCollection()
          .modify((task) => {
            if (!Array.isArray(task.tagIds)) {
              task.tagIds = [];
            }
          });
      });
    this.version(6).stores({
      tagSets: "++id, &name, *tagIds",
    });
  }
}

/**
 * データベースのシングルトンインスタンス
 *
 * @type {Database}
 */
export const db = new Database();
