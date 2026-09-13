import { QuickAccessRecord } from "@/db/models/navigation.model";

/**
 * QuickAccess テーブルで常に参照・更新する固定レコードのID
 *
 * @constant
 * @type {1}
 */
export const QUICK_ACCESS_STATIC_ID = 1 as const;

/**
 * QuickAccess の初期状態（デフォルト値）
 * QuickAccessRecord から id を除いた型に合致しているかを自動検証
 *
 * @constant
 * @type {Omit<QuickAccessRecord, "id">}
 */
export const DEFAULT_QUICK_ACCESS = {
  isBookmarkSelected: false,
  isUncategorizedSelected: false,
  isOverdueSelected: false,
  isAsapSelected: false,
  isUpcomingSelected: false,
  isDoneSelected: true,
  isProgressSelected: true,
  isPendingSelected: true,
} as const satisfies Omit<QuickAccessRecord, "id">;
