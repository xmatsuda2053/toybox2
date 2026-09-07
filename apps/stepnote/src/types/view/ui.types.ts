/**
 * 画面全体のレイアウト・各パネルの開閉状態
 */
export interface LayoutState {
  /** QUICK ACCESS の上下開閉状態 */
  isQuickAccessOpen: boolean;
  /** エリア1 (QUICK ACCESS, LABELS) の左右開閉状態 */
  isArea1Open: boolean;
  /** エリア2 (エリア1 + TASK LIST) の左右開閉状態 */
  isArea2Open: boolean;
}
