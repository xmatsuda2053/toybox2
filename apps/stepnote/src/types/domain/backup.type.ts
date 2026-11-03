/**
 * 自動エクスポート設定インターフェース
 */
export interface AutoExportSettings {
  /** 自動エクスポート有効フラグ */
  enabled: boolean;
  /** スケジュール時刻リスト（"HH:mm" 形式） */
  scheduleTimes: string[];
  /** 最終実行スロット（"YYYY-MM-DD HH:mm"、同日同一時刻の二重実行防止用） */
  lastExportedSlot?: string;
  /** 最終実行日時（ISO 8601 文字列、画面表示用） */
  lastExportedAt?: string;
}

/**
 * 自動エクスポート設定の初期値
 */
export const DEFAULT_AUTO_EXPORT_SETTINGS: AutoExportSettings = {
  enabled: false,
  scheduleTimes: ["08:00", "12:00", "17:15"],
};

