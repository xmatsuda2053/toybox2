import type { ReactiveControllerHost } from "lit";
import type { LogsRepository } from "@/repositories/logs.repository";
import type { LogRecord } from "@/db/models/journal.model";
import { BaseTaskSubItemController } from "./base-reactive.controller";

/**
 * Log関連イベント・状態を管理する Reactive Controller
 *
 * @export
 * @class LogsController
 * @extends {BaseTaskSubItemController<LogRecord, LogsRepository>}
 */
export class LogsController extends BaseTaskSubItemController<
  LogRecord,
  LogsRepository
> {
  /**
   * Creates an instance of LogsController.
   * @param {ReactiveControllerHost} host
   * @param {LogsRepository} repository
   * @param {number} [taskId]
   * @memberof LogsController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: LogsRepository,
    taskId?: number,
  ) {
    super(host, repository, taskId);
  }

  /** 新規Logを作成する */
  public createLog = this.createSubItem;

  /** Log内容を更新する */
  public updateLog = this.updateSubItem;

  /** 指定したIDのLogを削除する */
  public deleteLog = this.deleteSubItem;
}
