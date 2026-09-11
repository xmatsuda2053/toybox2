/**
 * 画面全体のレイアウト・各パネルの開閉状態
 */
export interface LayoutState {
  /** QUICK ACCESS の上下開閉状態 */
  isQuickAccessOpen: boolean;
  /** ナビゲーションエリア (QUICK ACCESS, LABELS) の左右開閉状態 */
  isNavigationAreaOpen: boolean;
  /** ナビゲーションリストエリア (ナビゲーションエリア + TASK LIST) の左右開閉状態 */
  isNavigationListAreaOpen: boolean;
}
