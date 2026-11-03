import { extractMarkdownTitle, isBlank } from "@shared/utils";
import type {
  DexieExportJsonStructure,
  DexieTableData,
  DexieTableMeta,
  MigrationResult,
  MigrationSummary,
} from "../types/migration.types";

/** 新スキーマのテーブル定義マスター */
const NEW_TABLE_SCHEMAS: Record<string, string> = {
  tasks: "++id, statusCode, name, dueDate, fiscalYear, selected",
  issues: "++id, taskId, [taskId+id]",
  logs: "++id, taskId, [taskId+id], title",
  notes: "++id, taskId, [taskId+id], title",
  quickAccess: "++id",
  labels: "++id, name, isSelected",
  scratches: "++id, createdAt, title",
  taskTemplates: "++id, name, createdAt",
};

/**
 * 旧 SnDB エクスポートデータの妥当性を検証する。
 *
 * @param data 検証対象データ
 * @returns 検証済みデータ
 */
function validateLegacySnDbData(data: unknown): DexieExportJsonStructure {
  if (typeof data !== "object" || data === null) {
    throw new Error("無効なバックアップデータです: オブジェクトではありません");
  }

  const candidate = data as Partial<DexieExportJsonStructure>;
  if (!candidate.data || typeof candidate.data !== "object") {
    throw new Error("無効なバックアップデータです: data プロパティが存在しません");
  }

  if (candidate.data.databaseName !== "SnDB") {
    throw new Error(
      `旧StepNote（SnDB）のエクスポートデータではありません: ${candidate.data.databaseName}`,
    );
  }

  return data as DexieExportJsonStructure;
}

/**
 * 旧StepNoteのクリックコピーMarkdown記法（+{text}+）を新StepNoteのリンク記法（[text](text)）へ変換する。
 *
 * @param text 変換対象テキスト
 * @returns 変換後テキスト
 */
export function convertCopySyntaxToMarkdownLink(text: string): string {
  if (!text) {
    return text;
  }
  return text.replace(/\+\{([^\r\n{}]+?)\}\+/g, "[$1]($1)");
}

/**
 * 関係者（Contact）レコードの内容が空かどうかを判定する。
 *
 * @param contact 判定対象の関係者オブジェクト
 * @returns 部署・氏名・連絡先のすべてが空白の場合は true
 */
export function isContactEmpty(contact: unknown): boolean {
  if (typeof contact !== "object" || contact === null) {
    return true;
  }
  const c = contact as Record<string, unknown>;
  const div = typeof c.div === "string" ? c.div : "";
  const name = typeof c.name === "string" ? c.name : "";
  const tel = typeof c.tel === "string" ? c.tel : "";
  return isBlank(div) && isBlank(name) && isBlank(tel);
}

/**
 * tasks テーブルレコードを新仕様へ変換する（空の Contact を除外）。
 */
function migrateTasks(rows: Record<string, unknown>[]): {
  rows: Record<string, unknown>[];
  filteredContactsCount: number;
} {
  let filteredContactsCount = 0;

  const migratedRows = rows.map((row) => {
    const copy = { ...row };
    copy.bookmark = Boolean(row.bookmark);
    copy.selected = Boolean(row.selected);
    if (typeof row.description === "string") {
      copy.description = convertCopySyntaxToMarkdownLink(row.description);
    }
    delete copy.currentStatus;

    const rawContacts = Array.isArray(row.contacts) ? row.contacts : [];
    const validContacts: Record<string, unknown>[] = [];
    for (const contact of rawContacts) {
      if (isContactEmpty(contact)) {
        filteredContactsCount++;
      } else {
        validContacts.push(contact as Record<string, unknown>);
      }
    }
    copy.contacts = validContacts;

    return copy;
  });

  return { rows: migratedRows, filteredContactsCount };
}

/**
 * logs テーブルレコードを新仕様へ変換する。
 */
function migrateLogs(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const rawVal = typeof row.value === "string" ? row.value : "";
    const convertedVal = convertCopySyntaxToMarkdownLink(rawVal);
    return {
      ...row,
      value: convertedVal,
      title: extractMarkdownTitle(convertedVal, "(無題のログ)"),
    };
  });
}

/**
 * notes テーブルレコードを新仕様へ変換する（空レコードを除外）。
 */
function migrateNotes(rows: Record<string, unknown>[]): {
  rows: Record<string, unknown>[];
  filteredCount: number;
} {
  const validRows: Record<string, unknown>[] = [];
  let filteredCount = 0;

  for (const row of rows) {
    const rawVal = typeof row.value === "string" ? row.value : "";
    if (isBlank(rawVal)) {
      filteredCount++;
      continue;
    }
    const convertedVal = convertCopySyntaxToMarkdownLink(rawVal);
    validRows.push({
      ...row,
      value: convertedVal,
      title: extractMarkdownTitle(convertedVal, "(無題のメモ)"),
    });
  }

  return { rows: validRows, filteredCount };
}

/**
 * labels テーブルレコードを新仕様へ変換する。
 */
function migrateLabels(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const copy = { ...row };
    copy.isSelected = Boolean(row.isSelected);
    copy.description = typeof row.description === "string" ? row.description : "";
    delete copy.fiscalYear;
    delete copy.createdAt;
    delete copy.updatedAt;
    return copy;
  });
}

/**
 * quickAccess テーブルレコードを新仕様へ変換する。
 */
function migrateQuickAccess(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const flagKeys = [
    "isBookmarkSelected",
    "isUncategorizedSelected",
    "isOverdueSelected",
    "isAsapSelected",
    "isUpcomingSelected",
    "isDoneSelected",
    "isProgressSelected",
    "isPendingSelected",
  ];

  return rows.map((row) => {
    const copy = { ...row };
    for (const key of flagKeys) {
      copy[key] = Boolean(row[key]);
    }
    return copy;
  });
}

/**
 * scratches テーブルレコードを新仕様へ変換する。
 */
function migrateScratches(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const copy = { ...row };
    const rawVal = typeof row.value === "string" ? row.value : "";
    const convertedVal = convertCopySyntaxToMarkdownLink(rawVal);
    copy.value = convertedVal;
    const rawTitle = typeof row.title === "string" ? row.title.trim() : "";
    copy.title = rawTitle !== "" ? rawTitle : extractMarkdownTitle(convertedVal, "(無題のメモ)");
    delete copy.selected;
    delete copy.pin;
    return copy;
  });
}

/**
 * 旧テーブル名からレコード配列を安全に抽出する。
 */
function extractSourceRows(
  tableDataList: DexieTableData[],
  tableName: string,
): Record<string, unknown>[] {
  const target = tableDataList.find((t) => t.tableName === tableName);
  return target?.rows ? [...target.rows] : [];
}

/**
 * 新形式の DexieTableMeta 配列を生成する。
 */
function buildTargetTablesMeta(
  rowCounts: Record<string, number>,
): DexieTableMeta[] {
  const tableNames = [
    "tasks",
    "issues",
    "logs",
    "notes",
    "quickAccess",
    "labels",
    "scratches",
    "taskTemplates",
  ];

  return tableNames.map((name) => ({
    name,
    schema: NEW_TABLE_SCHEMAS[name] ?? "++id",
    rowCount: rowCounts[name] ?? 0,
  }));
}

/**
 * 新しいテーブルデータ配列を生成する。
 */
function buildNewTableDataList(tables: {
  tasks: Record<string, unknown>[];
  logs: Record<string, unknown>[];
  notes: Record<string, unknown>[];
  labels: Record<string, unknown>[];
  quickAccess: Record<string, unknown>[];
  scratches: Record<string, unknown>[];
}): DexieTableData[] {
  return [
    { tableName: "tasks", inbound: true, rows: tables.tasks },
    { tableName: "issues", inbound: true, rows: [] },
    { tableName: "logs", inbound: true, rows: tables.logs },
    { tableName: "notes", inbound: true, rows: tables.notes },
    { tableName: "quickAccess", inbound: true, rows: tables.quickAccess },
    { tableName: "labels", inbound: true, rows: tables.labels },
    { tableName: "scratches", inbound: true, rows: tables.scratches },
    { tableName: "taskTemplates", inbound: true, rows: [] },
  ];
}

/**
 * 変換済みテーブルデータ群から新形式 JSON およびサマリーを構築する。
 */
function buildMigrationResult(
  tables: {
    tasks: Record<string, unknown>[];
    logs: Record<string, unknown>[];
    notes: Record<string, unknown>[];
    labels: Record<string, unknown>[];
    quickAccess: Record<string, unknown>[];
    scratches: Record<string, unknown>[];
  },
  filteredNotesCount: number,
  filteredContactsCount: number,
): MigrationResult {
  const rowCounts: Record<string, number> = {
    tasks: tables.tasks.length,
    issues: 0,
    logs: tables.logs.length,
    notes: tables.notes.length,
    quickAccess: tables.quickAccess.length,
    labels: tables.labels.length,
    scratches: tables.scratches.length,
    taskTemplates: 0,
  };

  const summary: MigrationSummary = {
    tasksCount: tables.tasks.length,
    logsCount: tables.logs.length,
    notesCount: tables.notes.length,
    notesFilteredCount: filteredNotesCount,
    contactsFilteredCount: filteredContactsCount,
    labelsCount: tables.labels.length,
    scratchesCount: tables.scratches.length,
    quickAccessCount: tables.quickAccess.length,
  };

  return {
    migratedData: {
      formatName: "dexie",
      formatVersion: 1,
      data: {
        databaseName: "StepNote",
        databaseVersion: 4,
        tables: buildTargetTablesMeta(rowCounts),
        data: buildNewTableDataList(tables),
      },
    },
    summary,
  };
}

/**
 * 旧 Step-Note（SnDB）のエクスポートデータを新 Step-Note 形式へ変換する純粋関数
 *
 * @param legacyData 旧バックアップ JSON オブジェクト
 * @returns 変換後の新形式 JSON および移行サマリー情報
 */
export function convertSnDbToStepNote(legacyData: unknown): MigrationResult {
  const validData = validateLegacySnDbData(legacyData);
  const src = validData.data.data;

  const { rows: migratedTasks, filteredContactsCount } = migrateTasks(
    extractSourceRows(src, "tasks"),
  );

  const { rows: migratedNotes, filteredCount: filteredNotesCount } = migrateNotes(
    extractSourceRows(src, "notes"),
  );

  const tables = {
    tasks: migratedTasks,
    logs: migrateLogs(extractSourceRows(src, "logs")),
    notes: migratedNotes,
    labels: migrateLabels(extractSourceRows(src, "labels")),
    quickAccess: migrateQuickAccess(extractSourceRows(src, "quickAccesses")),
    scratches: migrateScratches(extractSourceRows(src, "notebooks")),
  };

  return buildMigrationResult(tables, filteredNotesCount, filteredContactsCount);
}
