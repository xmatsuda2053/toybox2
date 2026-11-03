import { describe, it, expect } from "vitest";
import { generateStepNoteBackupFileName, buildSummaryHtml } from "./main";
import type { MigrationResult } from "./types/migration.types";

/**
 * 移行ツール メインロジック仕様テスト (main.test.ts)
 *
 * 1. バックアップファイル名生成仕様:
 *    - 1-1. 日付から stepnote_backup_YYYYMMDD_HHmmss.json 形式のファイル名が生成されること
 *
 * 2. 移行サマリー HTML 構築仕様:
 *    - 2-1. サマリーテーブルに除外された空関係者件数（contactsFilteredCount）が含まれて描画されること
 */
describe("main logic tests", () => {
  describe("1. バックアップファイル名生成仕様", () => {
    it("1-1. 日付から stepnote_backup_YYYYMMDD_HHmmss.json 形式のファイル名が生成されること", () => {
      const fixedDate = new Date(2026, 10, 3, 17, 30, 45); // 2026-11-03 17:30:45
      const fileName = generateStepNoteBackupFileName(fixedDate);
      expect(fileName).toBe("stepnote_backup_20261103_173045.json");
    });
  });

  describe("2. 移行サマリー HTML 構築仕様", () => {
    it("2-1. サマリーテーブルに除外された空関係者件数（contactsFilteredCount）が含まれて描画されること", () => {
      const mockResult: MigrationResult = {
        migratedData: {
          formatName: "dexie",
          formatVersion: 1,
          data: {
            databaseName: "StepNote",
            databaseVersion: 4,
            tables: [],
            data: [],
          },
        },
        summary: {
          tasksCount: 10,
          logsCount: 20,
          notesCount: 5,
          notesFilteredCount: 3,
          contactsFilteredCount: 7,
          labelsCount: 4,
          scratchesCount: 2,
          quickAccessCount: 1,
        },
      };

      const html = buildSummaryHtml(mockResult);
      expect(html).toContain("<tr><th>空関係者件数（除外）</th><td>7 件</td></tr>");
    });
  });
});
