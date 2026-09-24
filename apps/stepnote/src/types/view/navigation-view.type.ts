import type {
  QuickAccessRecord,
  LabelRecord,
} from "@/db/models/navigation.model";

/**
 * 画面表示用 クイックアクセスフィルター状態の型定義（QuickAccessRecord から id を除外）
 *
 * @export
 */
export type QuickAccess = Omit<QuickAccessRecord, "id">;

/**
 * クイックアクセス各項目のタスク件数（View Props）
 *
 * @export
 * @interface QuickAccessTaskCounts
 */
export interface QuickAccessTaskCounts {
  /** ブックマーク件数 */
  readonly bookmark?: number;
  /** 未分類件数 */
  readonly uncategorized?: number;
  /** 期限切れ件数 */
  readonly overdue?: number;
  /** 期限当日件数 */
  readonly asap?: number;
  /** 期限間近件数 */
  readonly upcoming?: number;
}

/**
 * 画面表示用 分類ラベルの型定義（LabelRecord のエイリアス）
 *
 * @export
 */
export type Label = LabelRecord;
