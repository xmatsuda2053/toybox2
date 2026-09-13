/**
 * 画面表示用 作業ログの型定義
 *
 * @export
 * @interface Log
 */
export interface Log {
  /** ログID */
  id?: number;
  /** 紐づくタスクID */
  taskId: number;
  /** ログ内容 */
  value: string;
  /** 作成日時 */
  createdAt?: Date;
  /** 更新日時 */
  updatedAt?: Date;
}

/**
 * 画面表示用 ノート・メモの型定義
 *
 * @export
 * @interface Note
 */
export interface Note {
  /** ノートID */
  id?: number;
  /** 紐づくタスクID */
  taskId: number;
  /** ノート内容 */
  value: string;
  /** 作成日時 */
  createdAt?: Date;
  /** 更新日時 */
  updatedAt?: Date;
}
