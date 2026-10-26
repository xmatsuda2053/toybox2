import type { ReactiveControllerHost } from "lit";
import type { LogsRepository } from "@/repositories/logs.repository";
import type { LogRecord } from "@/db/models/journal.model";
import { extractMarkdownTitle } from "@shared/utils";
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
  public createLog = async (
    data: Omit<LogRecord, "id" | "taskId">,
  ): Promise<number | undefined> => {
    const title = data.title ?? extractMarkdownTitle(data.value, "(無題のログ)");
    return this.createSubItem({ ...data, title });
  };

  /** Log内容を更新する */
  public updateLog = async (
    id: number,
    data: Partial<Omit<LogRecord, "id" | "taskId">>,
  ): Promise<void> => {
    const title =
      data.title !== undefined
        ? data.title
        : data.value !== undefined
          ? extractMarkdownTitle(data.value, "(無題のログ)")
          : undefined;

    const updatePayload = title !== undefined ? { ...data, title } : data;
    await this.updateSubItem(id, updatePayload);
  };

  /** 指定したIDのLogを削除する */
  public deleteLog = this.deleteSubItem;
}

