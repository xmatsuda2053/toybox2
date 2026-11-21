import type { TaskRecord } from "@/db/models/task.model";
import type { TagRecord } from "@/db/models/tag.model";
import type { TaskStatusCode } from "@/types/domain/task-status.type";
import type { TaskDueIconInfo } from "@/utils/task-due.utils";

/**
 * 一覧テーブルのソート対象列キー
 */
export type TaskTableSortKey =
  | "id"
  | "status"
  | "label"
  | "name"
  | "dueDate"
  | "issues";

/**
 * ソート方向
 */
export type TaskTableSortDirection = "asc" | "desc";

/**
 * 一覧テーブルのソート状態
 */
export interface TaskTableSortState {
  key: TaskTableSortKey;
  direction: TaskTableSortDirection;
}

/**
 * 一覧テーブルの期限状況フィルタ
 */
export type TaskTableDueFilter = "all" | "overdue" | "asap" | "upcoming";

/**
 * 一覧テーブルのフィルタ状態
 */
export interface TaskTableFilterState {
  /** 対象会計年度（"all" は全年度） */
  fiscalYear: number | "all";
  /** 横断検索キーワード */
  keyword: string;
  /** ステータスコード絞り込み */
  statusCode: TaskStatusCode | "all";
  /** 所属ラベル絞り込み（"uncategorized" は未分類） */
  labelId: number | "all" | "uncategorized";
  /** タグ絞り込み */
  tagId: number | "all";
  /** 期限状況絞り込み */
  dueFilter: TaskTableDueFilter;
}

/**
 * 一覧テーブルの1行表示用ビューモデル
 */
export interface TaskTableRowViewModel {
  /** タスク本体レコード */
  task: TaskRecord;
  /** 所属ラベル名（未分類時は空文字） */
  labelName: string;
  /** 付与タグ一覧 */
  tags: readonly TagRecord[];
  /** 完了Issue数 */
  issuesDone: number;
  /** 総Issue数 */
  issuesTotal: number;
  /** 未完了Issue最優先期限アイコン情報 */
  issuesDueInfo: TaskDueIconInfo | null;
  /** タスク自体の期限アイコン情報（未完了時のみ） */
  taskDueInfo: TaskDueIconInfo | null;
}
