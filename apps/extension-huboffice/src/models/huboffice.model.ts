/**
 * テーマ設定モード
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * HubOffice に登録される個別ツールのメタ定義
 */
export interface ToolDefinition {
  /** 一意なツール識別子 */
  readonly id: string;
  /** ホーム一覧やヘッダーに表示するツール名 */
  readonly name: string;
  /** ツールの簡潔な説明（ホーム一覧・フィルタ対象） */
  readonly description: string;
  /** フィルタ検索用の追加キーワード */
  readonly keywords?: readonly string[];
  /** Web Awesome / ローカルアイコン識別名 */
  readonly icon: string;
}

/**
 * アクティブ画面識別子（"home" | "settings" | ツールID）
 */
export type ActiveView = "home" | "settings" | string;
