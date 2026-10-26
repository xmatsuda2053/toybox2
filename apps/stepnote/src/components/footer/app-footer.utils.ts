import { TASK_STATUS_CODE } from "../../constants/task-status.constants.js";
import type { TaskStatusCode } from "../../types/domain/task-status.type.js";

/**
 * AppFooter ロジック純粋関数モジュール (app-footer.utils.ts)
 *
 * フッターコンポーネントにおけるストレージ容量計算やフォーマット等の純粋関数を集約する。
 */

/**
 * バイト数をメガバイト（MB）単位（小数点第2位固定）にフォーマットする。
 *
 * @param bytes フォーマット対象のバイト数（未定義または0以下の場合は '0.00 MB'）
 * @returns フォーマット済み文字列（例: "0.04 MB", "1.50 MB", "0.00 MB"）
 */
export function formatStorageSize(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || bytes <= 0 || isNaN(bytes)) {
    return "0.00 MB";
  }

  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(2)} MB`;
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

/**
 * タスク配列から総件数、完了件数、完了率を算出する。
 *
 * @param tasks タスク配列
 * @returns 集計メトリクス（total: 総件数, completed: 完了件数, rate: 完了率 0〜100）
 */
export function calculateTaskMetrics(
  tasks?: ReadonlyArray<{ statusCode?: TaskStatusCode | number }>,
): {
  total: number;
  completed: number;
  rate: number;
} {
  if (!tasks || tasks.length === 0) {
    return { total: 0, completed: 0, rate: 0 };
  }

  const total = tasks.length;
  const completed = tasks.filter(
    (task) => task.statusCode === TASK_STATUS_CODE.DONE,
  ).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, rate };
}

/**
 * タスク進捗を簡潔な英数字テキストにフォーマットする。
 *
 * @param filteredCount 表示中（フィルタリング後）のタスク件数
 * @param totalCount 総タスク件数
 * @param rate 完了率（%）
 * @returns フォーマット済みテキスト（例: "8/12 Tasks (67%)", "12 Tasks (67%)", "0 Tasks"）
 */
export function formatTaskProgress(
  filteredCount: number,
  totalCount: number,
  rate: number,
): string {
  if (totalCount === 0) {
    return "0 Tasks";
  }

  if (filteredCount === totalCount) {
    const unit = totalCount === 1 ? "Task" : "Tasks";
    return `${totalCount} ${unit} (${rate}%)`;
  }

  return `${filteredCount}/${totalCount} Tasks (${rate}%)`;
}

/**
 * タスク進捗ツールチップ用の日本語詳細テキストを生成する。
 *
 * @param filteredCount 表示中の件数
 * @param totalCount 総件数
 * @param completedCount 完了件数
 * @param rate 完了率（%）
 * @returns 日本語詳細テキスト
 */
export function formatTaskProgressTooltip(
  filteredCount: number,
  totalCount: number,
  completedCount: number,
  rate: number,
): string {
  if (filteredCount === totalCount) {
    return `総タスク: ${totalCount}件 (完了: ${completedCount}件, 完了率: ${rate}%)`;
  }

  return `表示中: ${filteredCount}件 / 総タスク: ${totalCount}件 (完了: ${completedCount}件, 完了率: ${rate}%)`;
}
