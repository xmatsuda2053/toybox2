import type {
  TaskTemplateRecord,
  TaskTemplateIssue,
} from "@/db/models/template.model.js";
import type { IssueRecord } from "@/db/models/task.model.js";
import { extractIssueTitle } from "./task-filter.utils.js";

/**
 * 日付オブジェクトの時刻部分を午前0時0分0秒0ミリ秒に正規化する。
 *
 * @param {Date} date 正規化対象の日付
 * @return {Date} 正規化された新しい日付インスタンス
 */
function normalizeToStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * テンプレートIssueの期限日を計算する。
 *
 * - 基準日（システム日付）に relative offset（dayOffset日）を加算する。
 * - 計算された期日がタスク期限日以上の場合、タスク期限日の前日に自動補正する。
 * - タスク期限日の前日が基準日より過去になる場合は、基準日を下限として返却する。
 *
 * @export
 * @param {Date} baseDate 基準日（本日日付）
 * @param {number} dayOffset 相対オフセット日数
 * @param {Date} [taskDueDate] 親タスクの期限日
 * @return {Date} 計算された期限日
 */
export function calculateTemplateIssueDueDate(
  baseDate: Date,
  dayOffset: number,
  taskDueDate?: Date,
): Date {
  const baseStart = normalizeToStartOfDay(baseDate);
  const calculated = new Date(
    baseStart.getFullYear(),
    baseStart.getMonth(),
    baseStart.getDate() + dayOffset,
    0,
    0,
    0,
    0,
  );

  if (!taskDueDate) {
    return calculated;
  }

  const taskDueStart = normalizeToStartOfDay(taskDueDate);
  if (calculated.getTime() >= taskDueStart.getTime()) {
    const dayBeforeTaskDue = new Date(
      taskDueStart.getFullYear(),
      taskDueStart.getMonth(),
      taskDueStart.getDate() - 1,
      0,
      0,
      0,
      0,
    );
    return dayBeforeTaskDue.getTime() < baseStart.getTime()
      ? baseStart
      : dayBeforeTaskDue;
  }

  return calculated;
}

/**
 * 簡易的な一意IDを生成する。
 *
 * @return {string} 生成されたID
 */
function generateUniqueId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 既存のタスクテンプレートを複製する。
 *
 * - テンプレート名に「(コピー)」を付与する。
 * - id を除外し、新規作成可能なオブジェクトを生成する。
 * - 各Issueの id を新しい一意IDに再割り当てする。
 *
 * @export
 * @param {TaskTemplateRecord} template 複製元のテンプレート
 * @return {Omit<TaskTemplateRecord, "id">} 複製されたテンプレートデータ
 */
export function cloneTaskTemplate(
  template: TaskTemplateRecord,
): Omit<TaskTemplateRecord, "id"> {
  return {
    name: `${template.name} (コピー)`,
    description: template.description,
    issues: (template.issues ?? []).map((issue, idx) => ({
      id: generateUniqueId(),
      order: idx + 1,
      value: issue.value,
      dayOffset: issue.dayOffset ?? idx,
    })),
  };
}

/**
 * テンプレート内のIssue一覧の順序を入れ替え、orderを1始まりで再採番する。
 *
 * @export
 * @param {readonly TaskTemplateIssue[]} issues Issue一覧
 * @param {number} fromIndex 移動元インデックス
 * @param {number} toIndex 移動先インデックス
 * @return {TaskTemplateIssue[]} 順序変更後のIssue一覧
 */
export function reorderTemplateIssues(
  issues: readonly TaskTemplateIssue[],
  fromIndex: number,
  toIndex: number,
): TaskTemplateIssue[] {
  if (
    fromIndex < 0 ||
    fromIndex >= issues.length ||
    toIndex < 0 ||
    toIndex >= issues.length ||
    fromIndex === toIndex
  ) {
    return [...issues];
  }

  const next = [...issues];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) {
    return [...issues];
  }
  next.splice(toIndex, 0, moved);

  return next.map((issue, index) => ({
    ...issue,
    order: index + 1,
  }));
}

/**
 * テンプレートから新規タスクに紐づく IssueRecord ペイロード配列を一括生成する。
 *
 * @export
 * @param {TaskTemplateRecord} template 反映するテンプレート
 * @param {Date} baseDate 基準日（本日日付）
 * @param {Date} taskDueDate 親タスクの期限日
 * @param {number} taskId 親タスクID
 * @return {Omit<IssueRecord, "id">[]} 生成されたIssueレコード配列
 */
export function generateTemplateIssuePayloads(
  template: TaskTemplateRecord,
  baseDate: Date,
  taskDueDate: Date,
  taskId: number,
): Omit<IssueRecord, "id">[] {
  const sortedIssues = [...(template.issues ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  return sortedIssues.map((issue, index) => {
    const dayOffset = typeof issue.dayOffset === "number" ? issue.dayOffset : index;
    const dueDate = calculateTemplateIssueDueDate(baseDate, dayOffset, taskDueDate);
    const title = extractIssueTitle(issue.value);

    return {
      taskId,
      statusCode: 0,
      title,
      value: issue.value,
      dueDate,
    };
  });
}

/**
 * テンプレートフォームの入力状態
 */
export interface TemplateFormData {
  name: string;
  description: string;
  issues: readonly TaskTemplateIssue[];
}

/**
 * テンプレートの編集内容に変更（未保存の差分）があるかどうかを判定する。
 *
 * - 新規作成時（original が undefined の場合）：いずれかの項目に入力があれば true
 * - 既存編集時（original が存在する場合）：名称、概要、Issueの各要素のいずれかが異なれば true
 *
 * @export
 * @param {TemplateFormData} current 現在のフォーム入力状態
 * @param {TaskTemplateRecord} [original] 編集元のオリジナルテンプレート
 * @return {boolean} 未保存の変更がある場合は true、未変更なら false
 */
export function isTemplateDirty(
  current: TemplateFormData,
  original?: TaskTemplateRecord,
): boolean {
  if (!original) {
    return (
      current.name.trim().length > 0 ||
      current.description.trim().length > 0 ||
      current.issues.length > 0
    );
  }

  if (current.name !== original.name || current.description !== original.description) {
    return true;
  }

  const origIssues = original.issues ?? [];
  if (current.issues.length !== origIssues.length) {
    return true;
  }

  return current.issues.some((issue, index) => {
    const orig = origIssues[index];
    if (!orig) {
      return true;
    }
    return (
      issue.value !== orig.value ||
      issue.dayOffset !== orig.dayOffset ||
      issue.order !== orig.order
    );
  });
}


