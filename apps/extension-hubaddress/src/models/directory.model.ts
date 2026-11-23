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
  /** フリガナ */
  furigana?: string;
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
 * JSON 一括エクスポート・インポート用スナップショット型
 */
export interface DirectorySnapshot {
  /** スキーマバージョン */
  version: number;
  /** エクスポート日時 (ISO文字列) */
  exportedAt: string;
  /** 職員データ一覧 */
  staff: Omit<StaffRecord, "id">[];
  /** 組織データ一覧 */
  organizations: Omit<OrganizationRecord, "id">[];
}

/**
 * テーマ設定型
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Side Panel アクティブタブ型
 */
export type ActiveTab = "staff" | "organizations" | "settings";

/**
 * 職員一覧ソート順モード型（昇順）
 */
export type StaffSortMode = "department" | "name" | "staffId";
