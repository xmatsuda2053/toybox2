import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Dexie } from "dexie";
import {
  generateBackupFileName,
  DatabaseBackupService,
} from "./database-backup.service.js";

// dexie-export-import のモック
vi.mock("dexie-export-import", () => ({
  exportDB: vi.fn(),
  importInto: vi.fn(),
}));

import { exportDB, importInto } from "dexie-export-import";

/**
 * データベースバックアップサービス仕様テスト (database-backup.service.test.ts)
 *
 * 1. バックアップファイル名生成仕様:
 *    - 1-1. 日付から stepnote_backup_YYYYMMDD_HHmmss.json 形式のファイル名が生成されること
 *
 * 2. データベースエクスポート仕様 (exportDatabase):
 *    - 2-1. dexie-export-import の exportDB が呼び出され、Blob が生成されること
 *    - 2-2. ダウンロード処理が実行されること
 *
 * 3. データベースインポート仕様 (importDatabase):
 *    - 3-1. dexie-export-import の importInto が適切なオプション（overwriteValues, clearTablesBeforeImport）で呼び出されること
 *    - 3-2. インポート完了後に tasks / issues テーブル内の文字列型 statusCode（"0" 等）が数値型へ正規化されること
 *    - 3-3. インポート完了後に各テーブル内の文字列型主キー id（"1" 等）が数値型へ自動修復されること
 */
describe("DatabaseBackupService", () => {
  let db: Dexie;
  let service: DatabaseBackupService;

  beforeEach(() => {
    db = new Dexie("TestDB");
    db.version(1).stores({ test: "++id" });
    service = new DatabaseBackupService();
    vi.clearAllMocks();
  });

  describe("1. バックアップファイル名生成仕様", () => {
    it("1-1. 日付から stepnote_backup_YYYYMMDD_HHmmss.json 形式のファイル名が生成されること", () => {
      const fixedDate = new Date(2026, 9, 24, 20, 30, 45); // 2026-10-24 20:30:45
      const fileName = generateBackupFileName(fixedDate);
      expect(fileName).toBe("stepnote_backup_20261024_203045.json");
    });
  });

  describe("2. データベースエクスポート仕様 (exportDatabase)", () => {
    it("2-1. exportDB が呼び出され、Blob が生成されてダウンロード用アンカーがクリックされること", async () => {
      const mockBlob = new Blob(['{"test": 1}'], { type: "application/json" });
      vi.mocked(exportDB).mockResolvedValue(mockBlob);

      const triggerDownloadSpy = vi
        .spyOn(
          service as unknown as {
            triggerDownload: (blob: Blob, fileName: string) => void;
          },
          "triggerDownload",
        )
        .mockImplementation(() => {});

      const resultBlob = await service.exportDatabase(db);

      expect(exportDB).toHaveBeenCalledWith(db, expect.any(Object));
      expect(resultBlob).toBe(mockBlob);
      expect(triggerDownloadSpy).toHaveBeenCalledWith(
        mockBlob,
        expect.stringMatching(/^stepnote_backup_\d{8}_\d{6}\.json$/),
      );
    });
  });

  describe("3. データベースインポート仕様 (importDatabase)", () => {
    it("3-1. importInto が適切なオプションで呼び出されること", async () => {
      const mockFile = new File(['{"test": 1}'], "backup.json", {
        type: "application/json",
      });
      vi.mocked(importInto).mockResolvedValue(undefined);

      await service.importDatabase(db, mockFile);

      expect(importInto).toHaveBeenCalledWith(
        db,
        mockFile,
        expect.objectContaining({
          overwriteValues: true,
          clearTablesBeforeImport: true,
        }),
      );
    });

    it("3-2. インポート完了後に tasks と issues の文字列型 statusCode が数値型へ正規化されること", async () => {
      const importDb = new Dexie("BackupImportStatusNormalizeTestDB");
      importDb.version(1).stores({
        tasks: "++id, statusCode",
        issues: "++id, taskId",
      });
      await importDb.open();

      const mockFile = new File(['{"test": 1}'], "backup.json", {
        type: "application/json",
      });
      vi.mocked(importInto).mockImplementation(async (targetDb) => {
        await targetDb
          .table("tasks")
          .add({ id: 1, statusCode: "0", name: "t1" });
        await targetDb
          .table("tasks")
          .add({ id: 2, statusCode: "5", name: "t2" });
        await targetDb
          .table("issues")
          .add({ id: 10, taskId: 1, statusCode: "9" });
      });

      await service.importDatabase(importDb, mockFile);

      const t1 = await importDb.table("tasks").get(1);
      const t2 = await importDb.table("tasks").get(2);
      const i1 = await importDb.table("issues").get(10);
      expect(t1?.statusCode).toBe(0);
      expect(typeof t1?.statusCode).toBe("number");
      expect(t2?.statusCode).toBe(5);
      expect(typeof t2?.statusCode).toBe("number");
      expect(i1?.statusCode).toBe(9);
      expect(typeof i1?.statusCode).toBe("number");

      importDb.close();
      await Dexie.delete("BackupImportStatusNormalizeTestDB");
    });

    it('3-3. インポート完了後に各テーブルの文字列型主キー id（"1" 等）が数値型へ自動修復されること', async () => {
      const importDb = new Dexie("BackupImportIdNormalizeTestDB");
      importDb.version(1).stores({
        tasks: "++id, statusCode",
        logs: "++id, taskId",
        quickAccess: "++id",
      });
      await importDb.open();

      const mockFile = new File(['{"test": 1}'], "backup.json", {
        type: "application/json",
      });
      vi.mocked(importInto).mockImplementation(async (targetDb) => {
        await targetDb
          .table("tasks")
          .put({ id: "10", statusCode: 0, name: "文字列IDタスク" });
        await targetDb
          .table("logs")
          .put({ id: "101", taskId: 10, value: "ログ" });
        await targetDb
          .table("quickAccess")
          .put({ id: "1", isBookmarkSelected: true });
      });

      await service.importDatabase(importDb, mockFile);

      const task = await importDb.table("tasks").get(10);
      const oldTask = await importDb.table("tasks").get("10");
      const log = await importDb.table("logs").get(101);
      const qa = await importDb.table("quickAccess").get(1);
      const oldQa = await importDb.table("quickAccess").get("1");

      expect(task?.id).toBe(10);
      expect(typeof task?.id).toBe("number");
      expect(oldTask).toBeUndefined();
      expect(log?.id).toBe(101);
      expect(typeof log?.id).toBe("number");
      expect(qa?.id).toBe(1);
      expect(typeof qa?.id).toBe("number");
      expect(oldQa).toBeUndefined();

      importDb.close();
      await Dexie.delete("BackupImportIdNormalizeTestDB");
    });
  });
});
