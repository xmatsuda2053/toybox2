import { describe, it, expect } from "vitest";
import { generateStepNoteBackupFileName } from "./main";

/**
 * 移行ツール メインロジック仕様テスト (main.test.ts)
 *
 * 1. バックアップファイル名生成仕様:
 *    - 1-1. 日付から stepnote_backup_YYYYMMDD_HHmmss.json 形式のファイル名が生成されること
 */
describe("generateStepNoteBackupFileName", () => {
  describe("1. バックアップファイル名生成仕様", () => {
    it("1-1. 日付から stepnote_backup_YYYYMMDD_HHmmss.json 形式のファイル名が生成されること", () => {
      const fixedDate = new Date(2026, 10, 3, 17, 30, 45); // 2026-11-03 17:30:45
      const fileName = generateStepNoteBackupFileName(fixedDate);
      expect(fileName).toBe("stepnote_backup_20261103_173045.json");
    });
  });
});

