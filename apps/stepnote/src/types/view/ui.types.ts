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
  /** ジャーナルエリア (JOURNAL) の左右開閉・縮小状態 */
  isJournalAreaOpen: boolean;
}

/**
 * ノート・メモアイテム（タスクノート・スクラッチ共通）の表示用エンティティ型
 */
export interface NoteItemRecord {
  id?: number;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ノート・スクラッチのCRUDおよび状態管理を提供するコントローラーインターフェース
 */
export interface NotesManagerController {
  readonly state: ReadonlyArray<NoteItemRecord>;
  createNote: (data: { value: string }) => Promise<number | undefined>;
  updateNote: (id: number, data: { value: string }) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  subscribe: (listener: () => void) => () => void;
}
