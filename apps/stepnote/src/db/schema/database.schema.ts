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
import {
  extractMarkdownTitle,
  normalizeAllowedNumber,
  normalizeNumericId,
} from "@shared/utils";

const VALID_STATUS_CODES = [0, 5, 9] as const;

const ALL_RECORD_ID_TABLES = [
  "tasks",
  "issues",
  "logs",
  "notes",
  "quickAccess",
  "labels",
  "scratches",
  "taskTemplates",
  "tags",
  "tagSets",
] as const;

type StatusCodeTableSource = {
  table: <T>(name: string) => Table<T, number>;
  tables?: ReadonlyArray<{ name: string }>;
};

type RecordIdTableSource = {
  table: <T, TKey = number | string>(name: string) => Table<T, TKey>;
  tables?: ReadonlyArray<{ name: string }>;
};

type RecordWithUnknownId = Record<string, unknown> & { id?: unknown };

interface StringIdMigrationEntry {
  rawId: string;
  targetId: number;
  record: RecordWithUnknownId;
}

function collectStringIdState(records: readonly RecordWithUnknownId[]): {
  existingNumericIds: Set<number>;
  maxNumericId: number;
  entries: StringIdMigrationEntry[];
} {
  const existingNumericIds = new Set<number>();
  let maxNumericId = 0;
  const entries: StringIdMigrationEntry[] = [];

  for (const record of records) {
    if (typeof record.id === "number" && Number.isSafeInteger(record.id)) {
      existingNumericIds.add(record.id);
      if (record.id > maxNumericId) maxNumericId = record.id;
      continue;
    }
    if (typeof record.id !== "string") continue;
    const targetId = normalizeNumericId(record.id);
    if (targetId === undefined) continue;
    if (targetId > maxNumericId) maxNumericId = targetId;
    entries.push({ rawId: record.id, targetId, record });
  }

  return { existingNumericIds, maxNumericId, entries };
}

async function normalizeRecordIdsInTable(
  table: Table<RecordWithUnknownId, number | string>,
  tableName: string,
): Promise<void> {
  const records = await table.toArray();
  const state = collectStringIdState(records);
  if (state.entries.length === 0) return;

  let nextId = state.maxNumericId;
  for (const entry of state.entries) {
    await table.delete(entry.rawId);
    if (!state.existingNumericIds.has(entry.targetId)) {
      state.existingNumericIds.add(entry.targetId);
      await table.put({ ...entry.record, id: entry.targetId });
      continue;
    }
    if (tableName === "quickAccess") continue;
    nextId += 1;
    state.existingNumericIds.add(nextId);
    await table.put({ ...entry.record, id: nextId });
  }
}

/**
 * 指定された Dexie インスタンスまたはトランザクション配下の全テーブルについて、
 * 文字列型の連番主キー id（"1" 等）を数値型へ自動修復する。
 */
export async function normalizeDatabaseRecordIds(
  source: RecordIdTableSource,
): Promise<void> {
  const existingNames = source.tables
    ? new Set(source.tables.map((t) => t.name))
    : null;
  for (const tableName of ALL_RECORD_ID_TABLES) {
    if (existingNames && !existingNames.has(tableName)) continue;
    await normalizeRecordIdsInTable(
      source.table<RecordWithUnknownId, number | string>(tableName),
      tableName,
    );
  }
}

async function normalizeStatusCodeInTable(
  table: Table<{ statusCode?: unknown }, number>,
): Promise<void> {
  await table.toCollection().modify((record) => {
    const normalized = normalizeAllowedNumber(
      record.statusCode,
      VALID_STATUS_CODES,
      0,
    );
    if (record.statusCode !== normalized) {
      record.statusCode = normalized;
    }
  });
}

/**
 * 指定された Dexie インスタンスまたはトランザクション配下の tasks / issues テーブルについて、
 * 文字列型など非数値の statusCode を数値（0 | 5 | 9）へ正規化する。
 */
export async function normalizeDatabaseStatusCodes(
  source: StatusCodeTableSource,
): Promise<void> {
  const existingNames = source.tables
    ? new Set(source.tables.map((t) => t.name))
    : null;
  for (const tableName of ["tasks", "issues"] as const) {
    if (existingNames && !existingNames.has(tableName)) continue;
    await normalizeStatusCodeInTable(
      source.table<{ statusCode?: unknown }>(tableName),
    );
  }
}

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
  constructor(dbName: string = "StepNote") {
    super(dbName);
    this.defineV1ToV3();
    this.defineV4ToV8();
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

  /** バージョン 4〜8 のスキーマ定義 */
  private defineV4ToV8(): void {
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
    this.version(7)
      .stores({})
      .upgrade(async (tx) => {
        await normalizeDatabaseStatusCodes(tx);
      });
    this.version(8)
      .stores({})
      .upgrade(async (tx) => {
        await normalizeDatabaseRecordIds(tx);
      });
  }
}

/**
 * データベースのシングルトンインスタンス
 *
 * @type {Database}
 */
export const db = new Database();
