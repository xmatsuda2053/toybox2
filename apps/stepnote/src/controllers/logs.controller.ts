import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { LogsRepository } from "@/repositories/logs.repository";
import type { LogRecord } from "@/db/models/journal.model";

/**
 * Log関連イベント・状態を管理する Reactive Controller
 *
 * @export
 * @class LogsController
 * @implements {ReactiveController}
 */
export class LogsController implements ReactiveController {
  private host: ReactiveControllerHost;
  private repository: LogsRepository;
  private _taskId: number | undefined;

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
   * 現在対象のタスクID
   *
   * @readonly
   * @type {(number | undefined)}
   * @memberof LogsController
   */
  public get taskId(): number | undefined {
    return this._taskId;
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
   * @param {number} [taskId]
   * @memberof LogsController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: LogsRepository,
    taskId?: number,
  ) {
    this.host = host;
    this.host.addController(this);
    this.repository = repository;
    this._taskId = taskId;
    this.initialized = this.loadState();
  }

  /**
   * 状態変更を購読するリスナー関数のセット
   *
   * @private
   * @type {Set<() => void>}
   * @memberof LogsController
   */
  private listeners: Set<() => void> = new Set();

  /**
   * 状態変更リスナーを登録する（Observer / Subscribe パターン）。
   *
   * 状態が変更（DB更新完了）された際に呼び出されるコールバック関数を登録します。
   * 戻り値として、登録したリスナーを安全に解除するための購読解除関数（Unsubscribe）を返却します。
   *
   * @param {() => void} listener 状態変更時に実行するコールバック関数
   * @return {() => void} 購読を解除するための関数
   * @memberof LogsController
   */
  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * ホストコンポーネントおよびすべての購読リスナーへ状態変更を通知する内部ヘルパー。
   *
   * @private
   * @return {*} {void}
   * @memberof LogsController
   */
  private notify = (): void => {
    this.host.requestUpdate();
    this.listeners.forEach((listener) => listener());
  };

  /**
   * データベースから状態を再読み込みし、コンポーネントおよび全購読者へ通知する。
   *
   * @private
   * @return {*}  {Promise<void>}
   * @memberof LogsController
   */
  private loadState = async (): Promise<void> => {
    if (this._taskId !== undefined) {
      const records = await this.repository.getByTaskId(this._taskId);
      this._state = [...records];
    } else {
      this._state = [];
    }
    this.notify();
  };

  /**
   * 対象とするタスクIDを変更し、データを再ロードする。
   *
   * @param {(number | undefined)} id
   * @return {*}  {Promise<void>}
   * @memberof LogsController
   */
  public setTaskId = async (id: number | undefined): Promise<void> => {
    this._taskId = id;
    await this.loadState();
  };

  /**
   * データベースから最新の状態を再読み込みする。
   *
   * @return {*}  {Promise<void>}
   * @memberof LogsController
   */
  public refresh = async (): Promise<void> => {
    await this.loadState();
  };

  /**
   * 新規Logを作成する。
   * taskIdが未設定の場合は作成せず undefined を返す。
   *
   * @param {Omit<LogRecord, "id" | "taskId">} data
   * @return {*}  {Promise<number | undefined>} 採番されたID、または未設定時はundefined
   * @memberof LogsController
   */
  public createLog = async (
    data: Omit<LogRecord, "id" | "taskId">,
  ): Promise<number | undefined> => {
    if (this._taskId === undefined) {
      return undefined;
    }
    const newId = await this.repository.add({
      taskId: this._taskId,
      ...data,
    });
    await this.loadState();
    return newId;
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
