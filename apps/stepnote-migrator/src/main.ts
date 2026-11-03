import { format } from "@shared/utils";
import { convertSnDbToStepNote } from "./utils/migration.utils";
import type { MigrationResult } from "./types/migration.types";
import "./styles.css";

/**
 * 新形式のバックアップファイル名を生成する。
 */
export function generateStepNoteBackupFileName(date: Date = new Date()): string {
  return `stepnote_backup_${format(date, "yyyyMMdd_HHmmss")}.json`;
}

/**
 * Blob をファイルとしてダウンロードさせる。
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 移行サマリーテーブルの HTML を構築する。
 */
function buildSummaryHtml(result: MigrationResult): string {
  const { summary } = result;
  return `
    <div class="alert alert--success">
      ✓ 新StepNote形式への変換が完了しました。
    </div>
    <table class="summary-table">
      <tbody>
        <tr><th>タスク件数</th><td>${summary.tasksCount} 件</td></tr>
        <tr><th>作業ログ件数</th><td>${summary.logsCount} 件</td></tr>
        <tr><th>メモ件数（移行対象）</th><td>${summary.notesCount} 件</td></tr>
        <tr><th>空メモ件数（除外）</th><td>${summary.notesFilteredCount} 件</td></tr>
        <tr><th>分類ラベル件数</th><td>${summary.labelsCount} 件</td></tr>
        <tr><th>共通メモ（スクラッチ）件数</th><td>${summary.scratchesCount} 件</td></tr>
        <tr><th>クイックアクセス設定</th><td>反映済み（boolean化）</td></tr>
      </tbody>
    </table>
    <button id="downloadBtn" class="download-btn">変換後のバックアップJSONを再ダウンロード</button>
    <div class="instructions">
      <div class="instructions__title">【新StepNoteへの取り込み手順】</div>
      <ol>
        <li>ダウンロードされた <code>stepnote_backup_*.json</code> を確認します。</li>
        <li>新 Step-Note アプリを開きます。</li>
        <li>左ペインのメニュー（最左列）下部にある「バックアップ」または「復元」アイコンをクリックします。</li>
        <li>ダウンロードした JSON ファイルを選択すると、データが復元されます。</li>
      </ol>
    </div>
  `;
}

/**
 * エラー表示 HTML を構築する。
 */
function buildErrorHtml(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `
    <div class="alert alert--error">
      <strong>変換エラー:</strong> ${message}
    </div>
  `;
}

/**
 * ファイル読み込みと変換を実行する。
 */
async function processFile(file: File, resultContainer: HTMLElement): Promise<void> {
  resultContainer.className = "result result--visible";
  resultContainer.innerHTML = '<div class="alert">変換処理を実行中...</div>';

  try {
    const text = await file.text();
    const parsed: unknown = JSON.parse(text);
    const result = convertSnDbToStepNote(parsed);

    resultContainer.innerHTML = buildSummaryHtml(result);

    const jsonString = JSON.stringify(result.migratedData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const fileName = generateStepNoteBackupFileName();

    // 初回自動ダウンロード
    downloadBlob(blob, fileName);

    // 再ダウンロードボタンのイベント接続
    const downloadBtn = document.getElementById("downloadBtn");
    downloadBtn?.addEventListener("click", () => {
      downloadBlob(blob, fileName);
    });
  } catch (err) {
    resultContainer.innerHTML = buildErrorHtml(err);
  }
}

/**
 * ドラッグ＆ドロップおよびファイル選択イベントをセットアップする。
 */
function setupEventListeners(
  dropzone: HTMLElement,
  fileInput: HTMLInputElement,
  resultContainer: HTMLElement,
): void {
  dropzone.addEventListener("click", () => fileInput.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dropzone--dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dropzone--dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dropzone--dragover");
    const file = e.dataTransfer?.files[0];
    if (file) {
      void processFile(file, resultContainer);
    }
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) {
      void processFile(file, resultContainer);
    }
  });
}

/**
 * アプリケーションの初期化
 */
function init(): void {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div class="container">
      <header class="header">
        <h1 class="header__title">Step-Note データ移行ツール</h1>
        <p class="header__desc">旧StepNote（SnDB）のバックアップJSONを、新StepNote形式へ安全に変換します</p>
      </header>

      <div id="dropzone" class="dropzone">
        <div class="dropzone__icon">📁</div>
        <div class="dropzone__text">ここに旧バックアップJSONをドラッグ＆ドロップ</div>
        <div class="dropzone__subtext">または クリックしてファイルを選択 (SnDB_backup_*.json)</div>
        <input type="file" id="fileInput" accept=".json" style="display: none;" />
      </div>

      <div id="result" class="result"></div>

      <footer class="footer">
        ブラウザ内で完全に処理されます。外部サーバーへの通信は一切行われません。
      </footer>
    </div>
  `;

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput") as HTMLInputElement;
  const result = document.getElementById("result");

  if (dropzone && fileInput && result) {
    setupEventListeners(dropzone, fileInput, result);
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", init);
}
