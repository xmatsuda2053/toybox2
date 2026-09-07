/**
 * 関係者情報
 */
export interface Contact {
  div: string;
  name: string;
  tel: string;
}

/**
 * 現在の状態バッジ種別
 */
export type CurrentStatusType =
  | "default"
  | "info"
  | "check"
  | "gear"
  | "warn"
  | "alert";

/**
 * 現在の状態情報
 */
export interface CurrentStatus {
  text: string;
  type: CurrentStatusType;
}
