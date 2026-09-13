import type {
  TaskStatusCode,
  TaskStatusDefinition,
  TaskStatusMap,
} from "@/types/domain/task-status.type";

/**
 * タスク状態コードのマスタマップ
 *
 * @constant
 */
export const TASK_STATUS_CODE = {
  PENDING: 0,
  PROGRESS: 5,
  DONE: 9,
} as const satisfies Record<string, TaskStatusCode>;

/**
 * タスク状態のマスタマップ
 *
 * @constant
 * @type {TaskStatusMap}
 */
export const TASK_STATUS_MAP: TaskStatusMap = {
  [TASK_STATUS_CODE.PENDING]: {
    code: TASK_STATUS_CODE.PENDING,
    labelJa: "開始待ち",
    labelEn: "pending",
  },
  [TASK_STATUS_CODE.PROGRESS]: {
    code: TASK_STATUS_CODE.PROGRESS,
    labelJa: "対応中",
    labelEn: "progress",
  },
  [TASK_STATUS_CODE.DONE]: {
    code: TASK_STATUS_CODE.DONE,
    labelJa: "完了",
    labelEn: "done",
  },
};

/**
 * タスク状態の定義リスト
 *
 * @constant
 * @type {readonly TaskStatusDefinition[]}
 */
export const TASK_STATUS_LIST: readonly TaskStatusDefinition[] = [
  TASK_STATUS_MAP[TASK_STATUS_CODE.PENDING],
  TASK_STATUS_MAP[TASK_STATUS_CODE.PROGRESS],
  TASK_STATUS_MAP[TASK_STATUS_CODE.DONE],
];
