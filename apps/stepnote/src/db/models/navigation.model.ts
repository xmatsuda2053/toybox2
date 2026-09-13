/**
 * クイックアクセスフィルター状態レコードの永続化エンティティ型定義
 *
 * @export
 * @interface QuickAccessRecord
 */
export interface QuickAccessRecord {
  /** レコードID（固定値: QUICK_ACCESS_STATIC_ID） */
  id?: number;
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
 * 分類ラベルレコードの永続化エンティティ型定義
 *
 * @export
 * @interface LabelRecord
 */
export interface LabelRecord {
  /** レコードID（自動採番） */
  id?: number;
  /** ラベル名 */
  name: string;
  /** ラベル説明 */
  description: string;
  /** 選択状態 */
  isSelected: boolean;
}
