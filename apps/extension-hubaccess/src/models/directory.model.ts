/**
 * 職員エンティティ型定義
 */
export interface StaffRecord {
  /** 内部主キー (IndexedDB autoIncrement) */
  id?: number;
  /** 職員番号 */
  staffId: string;
  /** 氏名 */
  name: string;
  /** 所属 */
  department: string;
  /** 役職 */
  title: string;
  /** メールアドレス一覧 (複数対応) */
  emails: string[];
}

/**
 * 組織エンティティ型定義
 */
export interface OrganizationRecord {
  /** 内部主キー (IndexedDB autoIncrement) */
  id?: number;
  /** 所属 (部局・課・係などの組織名) */
  department: string;
  /** その他 (建物名・部屋名など) */
  extra: string;
  /** 場所 */
  location: string;
  /** 役職 (係長席など特殊ケース) */
  title: string;
  /** 内線番号 */
  extensionNumber: string;
  /** 外線番号 */
  phoneNumber: string;
  /** FAX番号 */
  faxNumber: string;
  /** 備考 */
  notes: string;
}

/**
 * 拡張機能のUI設定・状態型定義
 */
export interface DirectoryConfig {
  /** つまみスイッチの上下位置 (パーセンテージ 0-100) */
  handlePositionY: number;
  /** 表示レイアウトモード ('split': 左右並列, 'tabs': 1カラムタブ切替) */
  layoutMode: "split" | "tabs";
  /** タブ表示時のアクティブタブ ('staff' | 'org') */
  activeTab: "staff" | "org";
  /** ドロワー固定 (ピン留め) フラグ */
  isPinned: boolean;
  /** 左右スプリット比率 (パーセンテージ 10-90) */
  splitRatio: number;
  /** 最終CSVインポート日時 (ISO文字列) */
  lastImportDate?: string;
}

