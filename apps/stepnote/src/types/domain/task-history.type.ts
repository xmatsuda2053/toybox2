/**
 * タスク閲覧履歴のデータ型定義
 */

/**
 * 閲覧履歴の1件分のレコード（ストレージ永続化用）
 */
export interface TaskHistoryItem {
  /** タスクID */
  taskId: number;
  /** 最終閲覧日時（エポックミリ秒） */
  accessedAt: number;
}

/**
 * 閲覧履歴設定
 */
export interface TaskHistorySettings {
  /** 履歴の最大保持件数 */
  maxCount: number;
}

/**
 * UI表示用の詳細付き履歴アイテム
 */
export interface TaskHistoryViewItem extends TaskHistoryItem {
  /** タスクタイトル */
  title: string;
  /** 所属ラベルID */
  labelId?: number;
  /** ラベル名 */
  labelName?: string;
  /** ステータスコード */
  statusCode: number;
}

/** デフォルトの最大保持件数 */
export const DEFAULT_TASK_HISTORY_MAX_COUNT = 10;

/** 最大保持件数の選択肢リスト */
export const TASK_HISTORY_MAX_COUNT_OPTIONS = [5, 10, 15, 20, 30] as const;

/** 履歴データのストレージキー */
export const TASK_HISTORY_STORAGE_KEY = "stepnote_task_history";

/** 履歴設定（最大保持件数）のストレージキー */
export const TASK_HISTORY_MAX_COUNT_STORAGE_KEY = "stepnote_task_history_max_count";

