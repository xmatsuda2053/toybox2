import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect } from "vitest";
import {
  generateStepNoteBackupFileName,
  buildSummaryHtml,
  buildFooterHtml,
} from "./main";
import type { MigrationResult } from "./types/migration.types";
import migratorViteConfig from "../vite.config";

/**
 * 移行ツール メインロジック仕様テスト (main.test.ts)
 *
 * 1. バックアップファイル名生成仕様:
 *    - 1-1. 日付から stepnote_backup_YYYYMMDD_HHmmss.json 形式のファイル名が生成されること
 *
 * 2. 移行サマリー HTML 構築仕様:
 *    - 2-1. サマリーテーブルに除外された空関係者件数（contactsFilteredCount）が含まれて描画されること
 *
 * 3. バージョン表示およびビルド埋め込み仕様:
 *    - 3-1. フッター HTML に Step-Note Migrator のバージョン表記（例: v1.2.3）が含まれること
 *    - 3-2. apps/stepnote-migrator/vite.config.ts の define.__APP_VERSION__ に package.json の version が設定されていること
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
      expect(html).toContain(
        "<tr><th>空関係者件数（除外）</th><td>7 件</td></tr>",
      );
    });
  });

  describe("3. バージョン表示およびビルド埋め込み仕様", () => {
    it("3-1. フッター HTML に Step-Note Migrator のバージョン表記が含まれること", () => {
      const footerHtml = buildFooterHtml("1.2.3");
      expect(footerHtml).toContain("footer__version");
      expect(footerHtml).toContain("Step-Note Migrator v1.2.3");
    });

    it("3-2. apps/stepnote-migrator/vite.config.ts の define.__APP_VERSION__ に package.json の version が設定されていること", () => {
      const pkgRaw = fs.readFileSync(
        path.resolve(__dirname, "../package.json"),
        "utf-8",
      );
      const pkg = JSON.parse(pkgRaw) as { version: string };
      expect(migratorViteConfig.define?.__APP_VERSION__).toBe(
        JSON.stringify(pkg.version),
      );
    });
  });
});
