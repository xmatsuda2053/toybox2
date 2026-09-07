/**
 * クイックアクセスフィルター状態
 */
export interface QuickAccessRecord {
  id?: number;
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
export interface LabelRecord {
  id?: number;
  name: string;
  isSelected: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
