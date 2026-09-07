/**
 * 作業ログ
 */
export interface LogRecord {
  id?: number;
  taskId: number;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ノート・メモ
 */
export interface NoteRecord {
  id?: number;
  taskId: number;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}
