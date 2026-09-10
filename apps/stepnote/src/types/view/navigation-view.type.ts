/**
 * クイックアクセスフィルター状態
 */
export interface QuickAccess {
  isBookmarkSelected: boolean;
  isUncategorizedSelected: boolean;
  isOverdueSelected: boolean;
  isAsapSelected: boolean;
  isUpcomingSelected: boolean;
  isDoneSelected: boolean;
  isProgressSelected: boolean;
  isPendingSelected: boolean;
}

/**
 * 分類ラベル
 */
export interface Label {
  id?: number;
  name: string;
  description: string;
  isSelected: boolean;
}
