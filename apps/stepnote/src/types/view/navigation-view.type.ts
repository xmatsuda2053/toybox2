/**
 * クイックアクセスフィルター状態
 */
export interface QuickAccess {
  isBookmarkSelected: boolean;
  isDoneSelected: boolean;
  isOverdueSelected: boolean;
  isAsapSelected: boolean;
  isUpcomingSelected: boolean;
  isProgressSelected: boolean;
  isPendingSelected: boolean;
  isUncategorizedSelected: boolean;
}

/**
 * 分類ラベル
 */
export interface Label {
  id?: number;
  name: string;
  isSelected: boolean;
}
