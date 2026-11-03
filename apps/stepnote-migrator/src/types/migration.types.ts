/**
 * Dexie Export/Import JSON テーブル定義
 */
export interface DexieTableMeta {
  name: string;
  schema: string;
  rowCount: number;
}

/**
 * Dexie Export/Import JSON テーブルデータ定義
 */
export interface DexieTableData {
  tableName: string;
  inbound: boolean;
  rows: Record<string, unknown>[];
}

/**
 * Dexie Export/Import JSON 全体構造
 */
export interface DexieExportJsonStructure {
  formatName: string;
  formatVersion: number;
  data: {
    databaseName: string;
    databaseVersion: number;
    tables: DexieTableMeta[];
    data: DexieTableData[];
  };
}

/**
 * 移行サマリー情報
 */
export interface MigrationSummary {
  tasksCount: number;
  logsCount: number;
  notesCount: number;
  notesFilteredCount: number;
  labelsCount: number;
  scratchesCount: number;
  quickAccessCount: number;
}

/**
 * 移行結果
 */
export interface MigrationResult {
  migratedData: DexieExportJsonStructure;
  summary: MigrationSummary;
}

