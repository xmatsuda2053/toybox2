import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { LogsRepository } from "@/repositories/logs.repository";
import type { LogRecord } from "@/db/models/journal.model";

/**
 * Log関連イベントを管理する Reactive Controller
 *
 * @export
 * @class LogsController
 * @implements {ReactiveController}
 */
export class LogsController implements ReactiveController {
  private host: ReactiveControllerHost;
  private repository: LogsRepository;
  private taskId: number;

  /** Logsの内部状態 */
  private _state: LogRecord[] = [];

  /**
   * 現在のLog一覧（読み取り専用）
   *
   * @readonly
   * @type {readonly LogRecord[]}
   * @memberof LogsController
   */
  public get state(): readonly LogRecord[] {
    return this._state;
  }

  /**
   * Controllerの非同期初期化状態。
   *
   * このプロパティの解決（then）されたタイミングで、本コントローラーの内部状態が完全に
   * 初期化されたことを保証する。
   *
   * @type {Promise<void>}
   * @memberof LogsController
   */
  public readonly initialized: Promise<void>;

  /**
   * Creates an instance of LogsController.
   * @param {ReactiveControllerHost} host
   * @param {LogsRepository} repository
   * @param {number} taskId
   * @memberof LogsController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: LogsRepository,
    taskId: number,
  ) {
    this.host = host;
    this.host.addController(this);
    this.repository = repository;
    this.taskId = taskId;
    this.initialized = this.loadState();
  }

  /**
   * データベースから状態を再読み込みし、コンポーネントを再描画する。
   *
   * @private
   * @return {*}  {Promise<void>}
   * @memberof LogsController
   */
  private loadState = async (): Promise<void> => {
    const records = await this.repository.getByTaskId(this.taskId);
    this._state = [...records];
    this.host.requestUpdate();
  };

  /**
   * 新規Logを作成する
   *
   * @param {Omit<LogRecord, "id" | "taskId"> & { taskId?: number }} data
   * @return {*}  {Promise<void>}
   * @memberof LogsController
   */
  public createLog = async (
    data: Omit<LogRecord, "id" | "taskId"> & { taskId?: number },
  ): Promise<void> => {
    await this.repository.add({
      taskId: this.taskId,
      ...data,
    });
    await this.loadState();
  };

  /**
   * Log内容を更新する
   *
   * @param {number} id
   * @param {Partial<Omit<LogRecord, "id">>} data
   * @return {*}  {Promise<void>}
   * @memberof LogsController
   */
  public updateLog = async (
    id: number,
    data: Partial<Omit<LogRecord, "id">>,
  ): Promise<void> => {
    await this.repository.update(id, data);
    await this.loadState();
  };

  /**
   * 指定したIDのLogを削除する
   *
   * @param {number} id
   * @return {*}  {Promise<void>}
   * @memberof LogsController
   */
  public deleteLog = async (id: number): Promise<void> => {
    await this.repository.delete(id);
    await this.loadState();
  };

  /**
   * hostConnected
   *
   * @memberof LogsController
   */
  hostConnected(): void {}

  /**
   * hostDisconnected
   *
   * @memberof LogsController
   */
  hostDisconnected(): void {}
}
