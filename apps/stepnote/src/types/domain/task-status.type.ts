/**
 * タスク状態のコード値
 * 0: 開始待ち (pending)
 * 5: 対応中 (progress)
 * 9: 完了 (done)
 */
export type TaskStatusCode = 0 | 5 | 9;

/**
 * タスク状態定義
 *
 * @export
 * @interface TaskStatusDefinition
 */
export interface TaskStatusDefinition {
  /**
   * コード値
   *
   * @type {TaskStatusCode}
   * @memberof TaskStatusDefinition
   */
  code: TaskStatusCode;

  /**
   * 日本語ラベル
   *
   * @type {string}
   * @memberof TaskStatusDefinition
   */
  labelJa: string;

  /**
   * 英語ラベル
   *
   * @type {string}
   * @memberof TaskStatusDefinition
   */
  labelEn: string;
}

/**
 * コード値をキーとしたタスクのマスタマップ型
 *
 * @export
 * @interface TaskStatusMap
 */
export type TaskStatusMap = Record<TaskStatusCode, TaskStatusDefinition>;
