/**
 * クイックアクセスフィルター状態
 */
export interface QuickAccessRecord {
  id?: number;
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
export interface LabelRecord {
  id?: number;
  name: string;
  description: string;
  isSelected: boolean;
}
