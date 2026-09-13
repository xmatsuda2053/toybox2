import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { TaskRepository } from "@/repositories/task.repository";
import type { TaskRecord } from "@/db/models/task.model";
import type { CreateTaskInput, Summary, Property, TaskStatusCode } from "@/types";

/**
 * 単一タスク関連イベント・状態を管理する Reactive Controller
 *
 * @export
 * @class TaskController
 * @implements {ReactiveController}
 */
export class TaskController implements ReactiveController {
  private host: ReactiveControllerHost;
  private repository: TaskRepository;
  private _state: TaskRecord | undefined = undefined;
  private _taskId: number | undefined = undefined;

  /**
   * Controllerの非同期初期化状態。
   *
   * このプロパティが解決（then）されたタイミングで、本コントローラーの内部状態が完全に
   * 初期化されたことを保証する。
   *
   * @type {Promise<void>}
   * @memberof TaskController
   */
  public readonly initialized: Promise<void>;

  /**
   * 現在対象のタスク（読み取り専用）
   *
   * @readonly
   * @type {(TaskRecord | undefined)}
   * @memberof TaskController
   */
  public get state(): TaskRecord | undefined {
    return this._state;
  }

  /**
   * 現在対象のタスクID
   *
   * @readonly
   * @type {(number | undefined)}
   * @memberof TaskController
   */
  public get taskId(): number | undefined {
    return this._taskId;
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
   * Creates an instance of TaskController.
   * @param {ReactiveControllerHost} host
   * @param {TaskRepository} repository
   * @param {number} [taskId]
   * @memberof TaskController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: TaskRepository,
    taskId?: number,
  ) {
    this.host = host;
    this.host.addController(this);
    this.repository = repository;
    this._taskId = taskId;
    this.initialized = this.loadState();
  }

  /**
   * データベースから状態を再読み込みし、コンポーネントを再描画する。
   *
   * @private
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  private loadState = async (): Promise<void> => {
    if (this._taskId !== undefined) {
      const record = await this.repository.getById(this._taskId);
      if (record) {
        this._state = { ...record };
      } else {
        this._state = undefined;
        this._taskId = undefined;
      }
    } else {
      this._state = undefined;
    }

    this.host.requestUpdate();
  };

  /**
   * 対象とするタスクIDを変更し、データを再ロードする。
   *
   * @param {(number | undefined)} id
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  public setTaskId = async (id: number | undefined): Promise<void> => {
    this._taskId = id;
    await this.loadState();
  };

  /**
   * データベースから最新の状態を再読み込みする。
   *
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  public refresh = async (): Promise<void> => {
    await this.loadState();
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
