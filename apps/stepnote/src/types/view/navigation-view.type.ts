/**
 * 画面表示用 クイックアクセスフィルター状態の型定義
 *
 * @export
 * @interface QuickAccess
 */
export interface QuickAccess {
  /** ブックマーク選択状態 */
  isBookmarkSelected: boolean;
  /** 未分類選択状態 */
  isUncategorizedSelected: boolean;
  /** 期限切れ選択状態 */
  isOverdueSelected: boolean;
  /** 当日選択状態 */
  isAsapSelected: boolean;
  /** 期限間近選択状態 */
  isUpcomingSelected: boolean;
  /** 完了選択状態 */
  isDoneSelected: boolean;
  /** 対応中選択状態 */
  isProgressSelected: boolean;
  /** 未着手選択状態 */
  isPendingSelected: boolean;
}

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
 * 画面表示用 分類ラベルの型定義
 *
 * @export
 * @interface Label
 */
export interface Label {
  /** ラベルID */
  id?: number;
  /** ラベル名 */
  name: string;
  /** ラベル説明 */
  description: string;
  /** 選択状態 */
  isSelected: boolean;
}
