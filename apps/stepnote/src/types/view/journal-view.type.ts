/**
 * 作業ログ
 */
export interface Log {
  id?: number;
  taskId: number;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ノート・メモ
 */
export interface Note {
  id?: number;
  taskId: number;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}
