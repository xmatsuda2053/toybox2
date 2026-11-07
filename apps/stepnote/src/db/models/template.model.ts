/**
 * タスクテンプレートに紐づく Issue（課題）項目の永続化型定義
 *
 * @export
 */
export type TaskTemplateIssue = {
  /** 一意キー（クライアント生成UUID等） */
  id: string;
  /** 表示・登録順序（1始まりの連番） */
  order: number;
  /** Issue本文（Markdown文字列。1行目をタイトルとして自動抽出） */
  value: string;
  /**
   * システム日付（本日）からの相対オフセット日数
   * （例: 0=当日, 1=翌日, 2=翌々日...）
   * 未設定（期日なし）の場合は undefined
   */
  dayOffset?: number;
};

/**
 * タスクテンプレートレコードの永続化エンティティ型定義
 *
 * @export
 */
export type TaskTemplateRecord = {
  /** レコードID（自動採番） */
  id?: number;
  /** テンプレート名（識別名称） */
  name: string;
  /** 概要（Markdown文字列） */
  description: string;
  /** テンプレートに紐づく Issue 一覧 */
  issues: TaskTemplateIssue[];
  /** 作成日時 */
  createdAt?: Date;
  /** 更新日時 */
  updatedAt?: Date;
};

