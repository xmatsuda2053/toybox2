import type { ReactiveControllerHost } from "lit";
import type { TaskRepository } from "@/repositories/task.repository";
import type { TaskRecord } from "@/db/models/task.model";
import type { CreateTaskInput, Summary, Property, TaskStatusCode } from "@/types";
import { BaseTaskScopeController } from "./base-reactive.controller";

/**
 * 単一タスク関連イベント・状態を管理する Reactive Controller
 *
 * @export
 * @class TaskController
 * @extends {BaseTaskScopeController}
 */
export class TaskController extends BaseTaskScopeController<
  TaskRepository,
  TaskRecord | undefined
> {
  constructor(
    host: ReactiveControllerHost,
    repository: TaskRepository,
    taskId?: number,
  ) {
    super(host, repository, undefined, taskId);
  }

  /**
   * タスクを保持しているかどうかの真偽値
   *
   * @readonly
   * @type {boolean}
   * @memberof TaskController
   */
  public get hasTask(): boolean {
    return this._state !== undefined;
  }

  /**
   * 選択中タスクの単一レコードをDBから取得し、変更を全購読者へ通知する。
   */
  protected async loadState(): Promise<void> {
    if (this._taskId === undefined) {
      this._state = undefined;
      this.notify();
      return;
    }

    const task = await this.repository.getById(this._taskId);
    if (task) {
      this._state = { ...task };
    } else {
      this._state = undefined;
      this._taskId = undefined;
    }

    this.notify();
  };

  /**
   * 新規タスクを作成し、作成したタスクを自身の管理対象に設定する。
   *
   * @param {CreateTaskInput} input
   * @return {*}  {Promise<number>}
   * @memberof TaskController
   */
  public createTask = async (input: CreateTaskInput): Promise<number> => {
    const taskData: Omit<TaskRecord, "id"> = {
      name: input.name,
      dueDate: input.dueDate,
      fiscalYear: input.fiscalYear,
      labelId: input.labelId,
      statusCode: input.statusCode ?? 0,
      bookmark: input.bookmark ?? false,
      contacts: input.contacts ? [...input.contacts] : [],
      description: input.description ?? "",
      selected: input.selected ?? true,
      createdAt: input.createdAt ?? new Date(),
      updatedAt: input.updatedAt ?? new Date(),
    };

    const newId = await this.repository.add(taskData);
    this._taskId = newId;
    await this.loadState();
    return newId;
  };

  /**
   * 対象タスクの内容を部分更新する。
   * updatedAt が指定されていない場合は自動的に現在時刻が設定される。
   *
   * @param {Partial<Omit<TaskRecord, "id">>} partial
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  public updateTask = async (
    partial: Partial<Omit<TaskRecord, "id">>,
  ): Promise<void> => {
    if (this._taskId === undefined) {
      return;
    }
    await this.repository.update(this._taskId, {
      ...partial,
      updatedAt: partial.updatedAt ?? new Date(),
    });
    await this.loadState();
  };

  /**
   * 対象タスクのサマリー項目を更新する。
   *
   * @param {Partial<Summary>} summary
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  public updateSummary = async (
    summary: Partial<Summary>,
  ): Promise<void> => {
    await this.updateTask(summary);
  };

  /**
   * 対象タスクのプロパティ項目を更新する。
   *
   * @param {Partial<Property>} property
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  public updateProperty = async (
    property: Partial<Property>,
  ): Promise<void> => {
    await this.updateTask(property);
  };

  /**
   * 対象タスクのステータスコードを更新する。
   *
   * @param {TaskStatusCode} statusCode
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  public updateStatus = async (
    statusCode: TaskStatusCode,
  ): Promise<void> => {
    await this.updateTask({ statusCode });
  };

  /**
   * 対象タスクを削除し、内部状態をクリアする。
   *
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  public deleteTask = async (): Promise<void> => {
    if (this._taskId === undefined) {
      return;
    }
    await this.repository.delete(this._taskId);
    this._taskId = undefined;
    await this.loadState();
  };

  /**
   * hostConnected
   *
   * @memberof TaskController
   */
  hostConnected(): void {}

  /**
   * hostDisconnected
   *
   * @memberof TaskController
   */
  hostDisconnected(): void {}
}
