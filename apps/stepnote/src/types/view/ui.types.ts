/**
 * アプリケーションの表示モード
 * - "standard": 標準モード（5ペイン構成）
 * - "list": 一覧モード（全幅一覧テーブル / 詳細ビュー構成）
 */
export type AppViewMode = "standard" | "list";

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
  /** 集中モード (Zen Mode) の有効・無効状態 */
  isZenMode: boolean;
  /** 全画面スクラッチモード (Scratch Mode) の有効・無効状態 */
  isScratchMode: boolean;
  /** 全画面設定モード (Settings Mode) の有効・無効状態 */
  isSettingsMode: boolean;
  /** 表示モード（標準モード / 一覧モード） */
  viewMode: AppViewMode;
  /** 一覧モード内でタスク詳細ビューを開いているかどうか */
  isListDetailOpen: boolean;
}

/**
 * ノート・メモアイテム（タスクノート・スクラッチ共通）の表示用エンティティ型
 */
export interface NoteItemRecord {
  id?: number;
  title?: string;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ノート・スクラッチのCRUDおよび状態管理を提供するコントローラーインターフェース
 */
export interface NotesManagerController {
  readonly state: ReadonlyArray<NoteItemRecord>;
  createNote: (data: { value: string; title?: string }) => Promise<number | undefined>;
  updateNote: (id: number, data: { value: string; title?: string }) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  subscribe: (listener: () => void) => () => void;
}
