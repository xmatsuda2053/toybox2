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

  /** Issue内容を更新する */
  public updateIssue = this.updateSubItem;

  /** 指定したIDのIssueを削除する */
  public deleteIssue = this.deleteSubItem;
}
