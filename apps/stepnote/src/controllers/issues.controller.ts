import type { ReactiveControllerHost } from "lit";
import type { IssuesRepository } from "@/repositories/issues.repository";
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
  /**
   * Creates an instance of IssuesController.
   * @param {ReactiveControllerHost} host
   * @param {IssuesRepository} repository
   * @param {number} [taskId]
   * @memberof IssuesController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: IssuesRepository,
    taskId?: number,
  ) {
    super(host, repository, taskId);
  }

  /** 新規Issueを作成する */
  public createIssue = this.createSubItem;

  /**
   * 複数のタイトルからIssueを一括作成する。
   * 各Issueの初期本文（value）には「### タイトル\n\n」が設定され、期日は指定日（または当日）となります。
   *
   * @param {string[]} titles 作成するIssueのタイトル配列
   * @param {Date} [dueDate] 期日（省略時は当日日付）
   * @return {*} {Promise<number[]>} 採番されたID配列（taskId未設定または空配列時は空配列）
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
    return ids;
  };

  /** Issue内容を更新する */
  public updateIssue = this.updateSubItem;

  /** 指定したIDのIssueを削除する */
  public deleteIssue = this.deleteSubItem;
}
