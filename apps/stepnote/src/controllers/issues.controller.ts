import type { ReactiveControllerHost } from "lit";
import type { IssuesRepository } from "@/repositories/issues.repository";
import type { SystemLogService } from "@/services/system-log.service";
import type { IssueRecord } from "@/db/models/task.model";
import { BaseTaskSubItemController } from "./base-reactive.controller";

/**
 * Issue関連イベント・状態を管理する Reactive Controller
 *
 * @export
 * @class IssuesController
 * @extends {BaseTaskSubItemController<IssueRecord, IssuesRepository>}
 */
export class IssuesController extends BaseTaskSubItemController<
  IssueRecord,
  IssuesRepository
> {
  private systemLogService?: SystemLogService;

  /**
   * Creates an instance of IssuesController.
   * @param {ReactiveControllerHost} host
   * @param {IssuesRepository} repository
   * @param {number} [taskId]
   * @param {SystemLogService} [systemLogService]
   * @memberof IssuesController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: IssuesRepository,
    taskId?: number,
    systemLogService?: SystemLogService,
  ) {
    super(host, repository, taskId);
    this.systemLogService = systemLogService;
  }

  /** 新規Issueを作成する */
  public createIssue = async (
    data: Omit<IssueRecord, "id" | "taskId">,
  ): Promise<number | undefined> => {
    const newId = await this.createSubItem(data);
    if (this.systemLogService && this._taskId !== undefined && newId !== undefined) {
      await this.systemLogService.logIssueCreated(
        this._taskId,
        newId,
        data.dueDate,
        data.statusCode,
      );
    }
    return newId;
  };

  /**
   * 複数のタイトルからIssueを一括作成する。
   *
   * @param {string[]} titles 作成するIssueのタイトル配列
   * @param {Date} [dueDate] 期日（省略時は当日日付）
   * @return {*} {Promise<number[]>} 採番されたID配列
   * @memberof IssuesController
   */
  public createMultipleIssues = async (
    titles: string[],
    dueDate: Date = new Date(),
  ): Promise<number[]> => {
    if (this._taskId === undefined || titles.length === 0) {
      return [];
    }

    const now = new Date();
    const items: Array<Omit<IssueRecord, "id">> = titles.map((title) => ({
      taskId: this._taskId!,
      statusCode: 0,
      title,
      value: `### ${title}\n\n`,
      dueDate,
      createdAt: now,
      updatedAt: now,
    }));

    const ids = await this.repository.bulkAdd(items);
    await this.loadState();

    if (this.systemLogService && ids.length > 0) {
      const createdIssues = ids.map((id, index) => ({ id, title: titles[index] }));
      await this.systemLogService.logIssueBulkCreated(this._taskId, createdIssues);
    }

    return ids;
  };

  /** Issue内容を更新する */
  public updateIssue = async (
    id: number,
    data: Partial<Omit<IssueRecord, "id" | "taskId">>,
  ): Promise<void> => {
    const before = this._state.find((i) => i.id === id);
    await this.updateSubItem(id, data);

    if (before && this.systemLogService && this._taskId !== undefined) {
      await this.recordIssueUpdateLogs(this._taskId, id, before, data);
    }
  };

  /** 指定したIDのIssueを削除する */
  public deleteIssue = async (id: number): Promise<void> => {
    const target = this._state.find((i) => i.id === id);
    await this.deleteSubItem(id);

    if (target && this.systemLogService && this._taskId !== undefined) {
      await this.systemLogService.logIssueDeleted(this._taskId, target);
    }
  };

  /** Issue更新時の各種変更ログ記録 */
  private async recordIssueUpdateLogs(
    taskId: number,
    issueId: number,
    before: IssueRecord,
    data: Partial<Omit<IssueRecord, "id" | "taskId">>,
  ): Promise<void> {
    if (!this.systemLogService) return;

    if (data.statusCode !== undefined && data.statusCode !== before.statusCode) {
      await this.systemLogService.logIssueStatusChanged(
        taskId,
        issueId,
        before.title,
        before.statusCode,
        data.statusCode,
      );
    }
    if (data.dueDate !== undefined && data.dueDate.getTime() !== before.dueDate.getTime()) {
      await this.systemLogService.logIssueDueDateChanged(
        taskId,
        issueId,
        before.title,
        before.dueDate,
        data.dueDate,
      );
    }
  }
}
