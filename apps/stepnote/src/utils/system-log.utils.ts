import type { TaskStatusCode } from "@/types/domain/task-status.type";

/**
 * Date オブジェクトを "YYYY-MM-DD" 形式の文字列に変換する。
 *
 * @export
 * @param {Date} date
 * @return {string} "YYYY-MM-DD"
 */
export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * TaskStatusCode に応じた日本語ラベル（開始待ち, 対応中, 完了）を返却する。
 *
 * @export
 * @param {TaskStatusCode} [code=0]
 * @return {string}
 */
export function getStatusLabel(code?: TaskStatusCode): string {
  switch (code) {
    case 5:
      return "対応中";
    case 9:
      return "完了";
    case 0:
    default:
      return "開始待ち";
  }
}

/**
 * タスク新規追加時のシステムログ文字列を生成する。
 *
 * @export
 * @param {{
 *   name: string;
 *   dueDate: Date;
 *   labelName: string;
 *   fiscalYear: number;
 *   statusCode?: TaskStatusCode;
 * }} params
 * @return {string} Markdown文字列
 */
export function formatTaskCreatedLog(params: {
  name: string;
  dueDate: Date;
  labelName: string;
  fiscalYear: number;
  statusCode?: TaskStatusCode;
}): string {
  const dueDateStr = formatDateString(params.dueDate);
  const statusLabel = getStatusLabel(params.statusCode);

  return (
    `### SYSTEM: タスク作成: "${params.name}"\n\n` +
    `- **タスク名**: ${params.name}\n` +
    `- **期日**: ${dueDateStr}\n` +
    `- **ラベル**: ${params.labelName}\n` +
    `- **年度**: ${params.fiscalYear}年度\n` +
    `- **初期ステータス**: ${statusLabel}`
  );
}

/**
 * タスク名変更時のシステムログ文字列を生成する。
 *
 * @export
 * @param {string} before 変更前タスク名
 * @param {string} after 変更後タスク名
 * @return {string} Markdown文字列
 */
export function formatTaskNameChangedLog(
  before: string,
  after: string,
): string {
  return (
    `### SYSTEM: タスク名変更: "${before}" → "${after}"\n\n` +
    `- **項目**: タスク名\n` +
    `- **変更前**: ${before}\n` +
    `- **変更後**: ${after}`
  );
}

/**
 * タスクステータス変更時のシステムログ文字列を生成する。
 *
 * @export
 * @param {TaskStatusCode} before 変更前コード
 * @param {TaskStatusCode} after 変更後コード
 * @return {string} Markdown文字列
 */
export function formatTaskStatusChangedLog(
  before: TaskStatusCode,
  after: TaskStatusCode,
): string {
  const beforeLabel = getStatusLabel(before);
  const afterLabel = getStatusLabel(after);

  return (
    `### SYSTEM: タスクステータス変更: ${beforeLabel} → ${afterLabel}\n\n` +
    `- **項目**: タスクステータス\n` +
    `- **変更前**: ${beforeLabel} (${before})\n` +
    `- **変更後**: ${afterLabel} (${after})`
  );
}

/**
 * タスク期日変更時のシステムログ文字列を生成する。
 *
 * @export
 * @param {Date} before 変更前期日
 * @param {Date} after 変更後期日
 * @return {string} Markdown文字列
 */
export function formatTaskDueDateChangedLog(
  before: Date,
  after: Date,
): string {
  const beforeStr = formatDateString(before);
  const afterStr = formatDateString(after);

  return (
    `### SYSTEM: タスク期日変更: ${beforeStr} → ${afterStr}\n\n` +
    `- **項目**: タスク期日\n` +
    `- **変更前**: ${beforeStr}\n` +
    `- **変更後**: ${afterStr}`
  );
}

/**
 * タスクラベル変更時のシステムログ文字列を生成する。
 *
 * @export
 * @param {string} beforeLabel 変更前ラベル名
 * @param {string} afterLabel 変更後ラベル名
 * @param {number} [beforeId] 変更前ラベルID
 * @param {number} [afterId] 変更後ラベルID
 * @return {string} Markdown文字列
 */
export function formatTaskLabelChangedLog(
  beforeLabel: string,
  afterLabel: string,
  beforeId?: number,
  afterId?: number,
): string {
  const beforeIdSuffix = beforeId !== undefined ? ` (ID: ${beforeId})` : "";
  const afterIdSuffix = afterId !== undefined ? ` (ID: ${afterId})` : "";

  return (
    `### SYSTEM: タスクラベル変更: ${beforeLabel} → ${afterLabel}\n\n` +
    `- **項目**: ラベル\n` +
    `- **変更前**: ${beforeLabel}${beforeIdSuffix}\n` +
    `- **変更後**: ${afterLabel}${afterIdSuffix}`
  );
}

/**
 * タスク年度変更時のシステムログ文字列を生成する。
 *
 * @export
 * @param {number} beforeYear 変更前年度
 * @param {number} afterYear 変更後年度
 * @return {string} Markdown文字列
 */
export function formatTaskFiscalYearChangedLog(
  beforeYear: number,
  afterYear: number,
): string {
  return (
    `### SYSTEM: タスク年度変更: ${beforeYear}年度 → ${afterYear}年度\n\n` +
    `- **項目**: 年度\n` +
    `- **変更前**: ${beforeYear}年度\n` +
    `- **変更後**: ${afterYear}年度`
  );
}

/**
 * Issue新規追加時のシステムログ文字列を生成する。
 *
 * @export
 * @param {number} issueId 採番されたIssueID
 * @param {Date} dueDate 期日
 * @param {TaskStatusCode} [statusCode=0] 初期ステータスコード
 * @return {string} Markdown文字列
 */
export function formatIssueCreatedLog(
  issueId: number,
  dueDate: Date,
  statusCode: TaskStatusCode = 0,
): string {
  const dueDateStr = formatDateString(dueDate);
  const statusLabel = getStatusLabel(statusCode);

  return (
    `### SYSTEM: Issue #${issueId} 作成\n\n` +
    `- **対象**: Issue #${issueId}\n` +
    `- **期日**: ${dueDateStr}\n` +
    `- **初期ステータス**: ${statusLabel} (${statusCode})`
  );
}

/**
 * Issue一括追加時のシステムログ文字列を生成する。
 *
 * @export
 * @param {Array<{ id: number; title: string }>} issues 作成されたIssue配列
 * @return {string} Markdown文字列
 */
export function formatIssueBulkCreatedLog(
  issues: Array<{ id: number; title: string }>,
): string {
  const count = issues.length;
  const idList = issues.map((i) => `#${i.id}`).join(", ");
  const issueLines = issues
    .map((i) => `  - Issue #${i.id}: ${i.title}`)
    .join("\n");

  return (
    `### SYSTEM: Issue一括作成: ${count}件 (${idList})\n\n` +
    `- **作成件数**: ${count}件\n` +
    `- **作成されたIssue**:\n` +
    `${issueLines}`
  );
}


/**
 * Issueステータス変更時のシステムログ文字列を生成する。
 *
 * @export
 * @param {number} issueId 対象IssueID
 * @param {string} title 対象Issueのタイトル
 * @param {TaskStatusCode} before 変更前コード
 * @param {TaskStatusCode} after 変更後コード
 * @return {string} Markdown文字列
 */
export function formatIssueStatusChangedLog(
  issueId: number,
  title: string,
  before: TaskStatusCode,
  after: TaskStatusCode,
): string {
  const beforeLabel = getStatusLabel(before);
  const afterLabel = getStatusLabel(after);

  return (
    `### SYSTEM: Issue #${issueId} ステータス変更: ${beforeLabel} → ${afterLabel}\n\n` +
    `- **対象**: Issue #${issueId} ("${title}")\n` +
    `- **項目**: ステータス\n` +
    `- **変更前**: ${beforeLabel} (${before})\n` +
    `- **変更後**: ${afterLabel} (${after})`
  );
}

/**
 * Issue期日変更時のシステムログ文字列を生成する。
 *
 * @export
 * @param {number} issueId 対象IssueID
 * @param {string} title 対象Issueのタイトル
 * @param {Date} before 変更前期日
 * @param {Date} after 変更後期日
 * @return {string} Markdown文字列
 */
export function formatIssueDueDateChangedLog(
  issueId: number,
  title: string,
  before: Date,
  after: Date,
): string {
  const beforeStr = formatDateString(before);
  const afterStr = formatDateString(after);

  return (
    `### SYSTEM: Issue #${issueId} 期日変更: ${beforeStr} → ${afterStr}\n\n` +
    `- **対象**: Issue #${issueId} ("${title}")\n` +
    `- **項目**: 期日\n` +
    `- **変更前**: ${beforeStr}\n` +
    `- **変更後**: ${afterStr}`
  );
}

/**
 * Issue削除時のシステムログ文字列を生成する。
 *
 * @export
 * @param {{
 *   id: number;
 *   title: string;
 *   statusCode: TaskStatusCode;
 *   dueDate: Date;
 * }} issue 削除対象Issue
 * @return {string} Markdown文字列
 */
export function formatIssueDeletedLog(issue: {
  id?: number;
  title: string;
  statusCode: TaskStatusCode;
  dueDate: Date;
}): string {
  const statusLabel = getStatusLabel(issue.statusCode);
  const dueDateStr = formatDateString(issue.dueDate);
  const idDisplay = issue.id !== undefined ? ` #${issue.id}` : "";

  return (
    `### SYSTEM: Issue${idDisplay} 削除: "${issue.title}"\n\n` +
    `- **対象**: Issue${idDisplay}\n` +
    `- **タイトル**: ${issue.title}\n` +
    `- **削除時ステータス**: ${statusLabel} (${issue.statusCode})\n` +
    `- **削除時期日**: ${dueDateStr}`
  );
}

/**
 * Note新規追加時のシステムログ文字列を生成する。
 *
 * @export
 * @param {number} noteId 採番されたNoteID
 * @return {string} Markdown文字列
 */
export function formatNoteCreatedLog(noteId: number): string {
  return (
    `### SYSTEM: Note #${noteId} 作成\n\n` + `- **対象**: Note #${noteId}`
  );
}

/**
 * Note削除時のシステムログ文字列を生成する。
 *
 * @export
 * @param {number} noteId 削除対象NoteID
 * @param {string} [title] 削除前Noteのタイトル
 * @return {string} Markdown文字列
 */
export function formatNoteDeletedLog(noteId: number, title?: string): string {
  const titleDisplay = title?.trim() || "(無題のノート)";
  const headerSuffix = title?.trim() ? `: "${title.trim()}"` : "";

  return (
    `### SYSTEM: Note #${noteId} 削除${headerSuffix}\n\n` +
    `- **対象**: Note #${noteId}\n` +
    `- **削除時タイトル**: ${titleDisplay}`
  );
}
