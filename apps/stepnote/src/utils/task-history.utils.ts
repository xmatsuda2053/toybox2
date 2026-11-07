import {
  DEFAULT_TASK_HISTORY_MAX_COUNT,
  type TaskHistoryItem,
  type TaskHistoryViewItem,
} from "../types/domain/task-history.type.js";
import type { TaskRecord } from "../db/models/task.model.js";
import type { LabelRecord } from "../db/models/navigation.model.js";

/** 許容される履歴保持件数の最小値 */
export const MIN_TASK_HISTORY_MAX_COUNT = 5;

/** 許容される履歴保持件数の最大値 */
export const MAX_TASK_HISTORY_MAX_COUNT = 30;

/**
 * 履歴保持件数を許容範囲（5〜30）内にクランプする
 *
 * @param {number} count 入力件数
 * @return {number} クランプ後の件数
 */
export function clampMaxCount(count: number): number {
  if (Number.isNaN(count) || !Number.isFinite(count)) {
    return DEFAULT_TASK_HISTORY_MAX_COUNT;
  }
  if (count < MIN_TASK_HISTORY_MAX_COUNT) {
    return MIN_TASK_HISTORY_MAX_COUNT;
  }
  if (count > MAX_TASK_HISTORY_MAX_COUNT) {
    return MAX_TASK_HISTORY_MAX_COUNT;
  }
  return Math.floor(count);
}

/**
 * 文字列または未定義値から履歴保持件数をパースする
 *
 * @param {unknown} value 入力値
 * @param {number} [defaultValue=DEFAULT_TASK_HISTORY_MAX_COUNT] フォールバック値
 * @return {number} パース後の保持件数
 */
export function parseMaxCount(
  value: unknown,
  defaultValue: number = DEFAULT_TASK_HISTORY_MAX_COUNT,
): number {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return defaultValue;
  }
  return clampMaxCount(parsed);
}

/**
 * タスク閲覧履歴にタスクIDを追加・更新する（LRU方式）
 *
 * - 既に履歴に存在する場合は該当位置から削除し、最新日時で先頭へ移動する。
 * - maxCount を超える古いアイテムは末尾から切り捨てる。
 * - 不正な taskId（0以下、非整数、NaN等）の場合は変更を行わず元の配列を返す。
 *
 * @param {TaskHistoryItem[]} history 現在の履歴配列
 * @param {number} taskId 追加・更新するタスクID
 * @param {number} [maxCount=DEFAULT_TASK_HISTORY_MAX_COUNT] 最大保持件数
 * @param {number} [now=Date.now()] 閲覧日時（エポックミリ秒）
 * @return {TaskHistoryItem[]} 更新後の履歴配列
 */
export function recordTaskHistory(
  history: TaskHistoryItem[],
  taskId: number,
  maxCount: number = DEFAULT_TASK_HISTORY_MAX_COUNT,
  now: number = Date.now(),
): TaskHistoryItem[] {
  if (typeof taskId !== "number" || !Number.isInteger(taskId) || taskId <= 0) {
    return history;
  }

  const effectiveMaxCount =
    typeof maxCount === "number" && Number.isFinite(maxCount) && maxCount > 0
      ? Math.floor(maxCount)
      : DEFAULT_TASK_HISTORY_MAX_COUNT;
  const filtered = history.filter((item) => item.taskId !== taskId);
  const nextItem: TaskHistoryItem = { taskId, accessedAt: now };

  return [nextItem, ...filtered].slice(0, effectiveMaxCount);
}

/**
 * 存在しない（削除された）タスクIDを履歴から除外してクリーンアップする
 *
 * @param {TaskHistoryItem[]} history 現在の履歴配列
 * @param {Set<number>} validTaskIds 有効なタスクIDの集合
 * @return {TaskHistoryItem[]} クリーンアップ後の履歴配列
 */
export function cleanTaskHistory(
  history: TaskHistoryItem[],
  validTaskIds: Set<number>,
): TaskHistoryItem[] {
  return history.filter((item) => validTaskIds.has(item.taskId));
}

/**
 * JSON文字列からタスク履歴配列を安全にパースする
 *
 * @param {string | null | undefined} jsonString JSON文字列
 * @return {TaskHistoryItem[]} パース結果（不正時は空配列）
 */
export function parseTaskHistory(
  jsonString: string | null | undefined,
): TaskHistoryItem[] {
  if (!jsonString || typeof jsonString !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonString) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is TaskHistoryItem => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as { taskId?: unknown; accessedAt?: unknown };
      return (
        typeof candidate.taskId === "number" &&
        Number.isInteger(candidate.taskId) &&
        candidate.taskId > 0 &&
        typeof candidate.accessedAt === "number" &&
        Number.isFinite(candidate.accessedAt)
      );
    });
  } catch {
    return [];
  }
}

/**
 * 履歴アイテム配列から、UI表示用の詳細情報付きアイテム一覧を生成する
 *
 * @param {TaskHistoryItem[]} history 履歴アイテム配列
 * @param {Map<number, TaskRecord>} tasksMap タスクIDマップ
 * @param {Map<number, LabelRecord>} labelsMap ラベルIDマップ
 * @return {TaskHistoryViewItem[]} 表示用履歴一覧
 */
export function buildTaskHistoryViewItems(
  history: TaskHistoryItem[],
  tasksMap: Map<number, TaskRecord>,
  labelsMap: Map<number, LabelRecord>,
): TaskHistoryViewItem[] {
  return history
    .map((item) => {
      const task = tasksMap.get(item.taskId);
      if (!task) return null;

      const label =
        task.labelId !== undefined ? labelsMap.get(task.labelId) : undefined;

      const viewItem: TaskHistoryViewItem = {
        taskId: item.taskId,
        accessedAt: item.accessedAt,
        title: task.name,
        labelId: task.labelId,
        labelName: label?.name,
        statusCode: task.statusCode,
      };
      return viewItem;
    })
    .filter((item): item is TaskHistoryViewItem => item !== null);
}
