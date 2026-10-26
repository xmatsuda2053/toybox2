import type { LogsRepository } from "@/repositories/logs.repository";
import type { LogsController } from "@/controllers/logs.controller";
import type { TaskStatusCode } from "@/types/domain/task-status.type";
import { extractMarkdownTitle } from "@shared/utils";
import {
  formatTaskCreatedLog,
  formatTaskNameChangedLog,
  formatTaskStatusChangedLog,
  formatTaskDueDateChangedLog,
  formatTaskLabelChangedLog,
  formatTaskFiscalYearChangedLog,
  formatIssueCreatedLog,
  formatIssueBulkCreatedLog,
  formatIssueStatusChangedLog,
  formatIssueDueDateChangedLog,
  formatIssueDeletedLog,
  formatNoteCreatedLog,
  formatNoteDeletedLog,
} from "@/utils/system-log.utils";

/**
 * StepNote におけるシステムログの記録・永続化および状態同期を一元管理する共通サービス
 *
 * @export
 * @class SystemLogService
 */
export class SystemLogService {
  private logsRepository: LogsRepository;
  private logsController?: LogsController;

  /**
   * Creates an instance of SystemLogService.
   * @param {LogsRepository} logsRepository 作業ログリポジトリ
   * @param {LogsController} [logsController] 作業ログコントローラー（画面同期用、任意）
   * @memberof SystemLogService
   */
  constructor(logsRepository: LogsRepository, logsController?: LogsController) {
    this.logsRepository = logsRepository;
    this.logsController = logsController;
  }

  /**
   * LogsController を設定または差し替える。
   *
   * @param {LogsController} controller
   * @memberof SystemLogService
   */
  public setLogsController(controller: LogsController): void {
    this.logsController = controller;
  }

  /**
   * 指定したタスクに対して任意のシステムログ文字列を永続化し、LogsController を更新する。
   *
   * @param {number} taskId 紐づくタスクID
   * @param {string} content Markdown形式のログ内容
   * @return {Promise<number | undefined>} 採番されたログID
   * @memberof SystemLogService
   */
  public async recordLog(
    taskId: number,
    content: string,
  ): Promise<number | undefined> {
    const now = new Date();
    const title = extractMarkdownTitle(content, "(無題のログ)");
    const id = await this.logsRepository.add({
      taskId,
      title,
      value: content,
      createdAt: now,
      updatedAt: now,
    });

    if (this.logsController) {
      await this.logsController.refresh();
    }

    return id;
  }

  /** タスク新規追加ログを記録する */
  public async logTaskCreated(
    taskId: number,
    params: {
      name: string;
      dueDate: Date;
      labelName: string;
      fiscalYear: number;
      statusCode?: TaskStatusCode;
    },
  ): Promise<void> {
    const log = formatTaskCreatedLog(params);
    await this.recordLog(taskId, log);
  }

  /** タスク名変更ログを記録する */
  public async logTaskNameChanged(
    taskId: number,
    before: string,
    after: string,
  ): Promise<void> {
    const log = formatTaskNameChangedLog(before, after);
    await this.recordLog(taskId, log);
  }

  /** タスクステータス変更ログを記録する */
  public async logTaskStatusChanged(
    taskId: number,
    before: TaskStatusCode,
    after: TaskStatusCode,
  ): Promise<void> {
    const log = formatTaskStatusChangedLog(before, after);
    await this.recordLog(taskId, log);
  }

  /** タスク期日変更ログを記録する */
  public async logTaskDueDateChanged(
    taskId: number,
    before: Date,
    after: Date,
  ): Promise<void> {
    const log = formatTaskDueDateChangedLog(before, after);
    await this.recordLog(taskId, log);
  }

  /** タスクラベル変更ログを記録する */
  public async logTaskLabelChanged(
    taskId: number,
    beforeLabel: string,
    afterLabel: string,
    beforeId?: number,
    afterId?: number,
  ): Promise<void> {
    const log = formatTaskLabelChangedLog(
      beforeLabel,
      afterLabel,
      beforeId,
      afterId,
    );
    await this.recordLog(taskId, log);
  }

  /** タスク年度変更ログを記録する */
  public async logTaskFiscalYearChanged(
    taskId: number,
    beforeYear: number,
    afterYear: number,
  ): Promise<void> {
    const log = formatTaskFiscalYearChangedLog(beforeYear, afterYear);
    await this.recordLog(taskId, log);
  }


  /** Issue新規作成ログを記録する */
  public async logIssueCreated(
    taskId: number,
    issueId: number,
    dueDate: Date,
    statusCode: TaskStatusCode = 0,
  ): Promise<void> {
    const log = formatIssueCreatedLog(issueId, dueDate, statusCode);
    await this.recordLog(taskId, log);
  }

  /** Issue一括作成ログを記録する */
  public async logIssueBulkCreated(
    taskId: number,
    issues: Array<{ id: number; title: string }>,
  ): Promise<void> {
    const log = formatIssueBulkCreatedLog(issues);
    await this.recordLog(taskId, log);
  }


  /** Issueステータス変更ログを記録する */
  public async logIssueStatusChanged(
    taskId: number,
    issueId: number,
    title: string,
    before: TaskStatusCode,
    after: TaskStatusCode,
  ): Promise<void> {
    const log = formatIssueStatusChangedLog(
      issueId,
      title,
      before,
      after,
    );
    await this.recordLog(taskId, log);
  }

  /** Issue期日変更ログを記録する */
  public async logIssueDueDateChanged(
    taskId: number,
    issueId: number,
    title: string,
    before: Date,
    after: Date,
  ): Promise<void> {
    const log = formatIssueDueDateChangedLog(
      issueId,
      title,
      before,
      after,
    );
    await this.recordLog(taskId, log);
  }

  /** Issue削除ログを記録する */
  public async logIssueDeleted(
    taskId: number,
    issue: {
      id?: number;
      title: string;
      statusCode: TaskStatusCode;
      dueDate: Date;
    },
  ): Promise<void> {
    const log = formatIssueDeletedLog(issue);
    await this.recordLog(taskId, log);
  }

  /** Note新規作成ログを記録する */
  public async logNoteCreated(taskId: number, noteId: number): Promise<void> {
    const log = formatNoteCreatedLog(noteId);
    await this.recordLog(taskId, log);
  }

  /** Note削除ログを記録する */
  public async logNoteDeleted(
    taskId: number,
    noteId: number,
    title?: string,
  ): Promise<void> {
    const log = formatNoteDeletedLog(noteId, title);
    await this.recordLog(taskId, log);
  }
}
