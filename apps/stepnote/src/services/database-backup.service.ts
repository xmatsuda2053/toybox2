import type { Dexie } from "dexie";

// Node.js（Vitest）環境における dexie-export-import の self 参照エラーを防止
if (typeof globalThis.self === "undefined") {
  (globalThis as unknown as { self: typeof globalThis }).self = globalThis;
}

/**
 * バックアップファイル名を生成します。
 * 形式: stepnote_backup_YYYYMMDD_HHmmss.json
 *
 * @param date 基準日時（デフォルトは現在日時）
 * @returns フォーマット済みファイル名
 */
export function generateBackupFileName(date: Date = new Date()): string {
  const pad = (n: number): string => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `stepnote_backup_${year}${month}${day}_${hours}${minutes}${seconds}.json`;
}

/**
 * データベースのバックアップ（エクスポート・インポート）を担当するサービスクラス
 */
export class DatabaseBackupService {
  /**
   * データベースの全テーブルを JSON 形式の Blob としてエクスポートし、ダウンロードを実行します。
   *
   * @param db エクスポート対象の Dexie データベースインスタンス
   * @returns 生成された Blob
   */
  async exportDatabase(db: Dexie): Promise<Blob> {
    const { exportDB } = await import("dexie-export-import");
    const blob = await exportDB(db, {
      prettyJson: true,
      progressCallback: () => true,
    });
    const fileName = generateBackupFileName();
    this.triggerDownload(blob, fileName);
    return blob;
  }

  /**
   * JSON ファイルからデータベースへデータを上書きインポートします。
   *
   * @param db インポート先の Dexie データベースインスタンス
   * @param file インポート対象の Blob または File
   */
  async importDatabase(db: Dexie, file: Blob | File): Promise<void> {
    const { importInto } = await import("dexie-export-import");
    await importInto(db, file, {
      overwriteValues: true,
      clearTablesBeforeImport: true,
      progressCallback: () => true,
    });
  }

  /**
   * ブラウザ上で Blob をファイルとしてダウンロードさせます。
   *
   * @param blob ダウンロード対象 Blob
   * @param fileName 保存ファイル名
   */
  protected triggerDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
