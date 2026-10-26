/**
 * AppFooter ロジック純粋関数モジュール (app-footer.utils.ts)
 *
 * フッターコンポーネントにおけるストレージ容量計算やフォーマット等の純粋関数を集約する。
 */

/**
 * バイト数を人間が読みやすい形式（B, KB, MB, GB）にフォーマットする。
 *
 * @param bytes フォーマット対象のバイト数（未定義または0以下の場合は '0 KB'）
 * @returns フォーマット済み文字列（例: "2.4 MB", "0 KB"）
 */
export function formatStorageSize(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || bytes === 0 || isNaN(bytes)) {
    return "0 KB";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * StorageManager API (navigator.storage.estimate) から現在の推定ストレージ使用量 (bytes) を取得する。
 * ブラウザ環境外または非対応環境の場合は安全に undefined を返す。
 *
 * @returns 推定使用量（bytes）、または undefined
 */
export async function getStorageEstimate(): Promise<number | undefined> {
  if (
    typeof navigator === "undefined" ||
    !navigator.storage ||
    typeof navigator.storage.estimate !== "function"
  ) {
    return undefined;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return estimate.usage;
  } catch {
    return undefined;
  }
}
