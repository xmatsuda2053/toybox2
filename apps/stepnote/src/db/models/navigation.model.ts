/**
 * クイックアクセスフィルター状態
 */
export interface QuickAccessRecord {
  id?: number;
  isBookmarkSelected: boolean;
  isUncategorizedSelected: boolean;
  isDoneSelected: boolean;
  isOverdueSelected: boolean;
  isAsapSelected: boolean;
  isUpcomingSelected: boolean;
  isProgressSelected: boolean;
  isPendingSelected: boolean;
}

/**
 * 分類ラベル
 */
export interface LabelRecord {
  id?: number;
  name: string;
  isSelected: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
