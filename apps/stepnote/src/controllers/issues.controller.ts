import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { IssuesRepository } from "@/repositories/issues.repository";
import type { IssueRecord } from "@/db/models/task.model";

/**
 * Issue関連イベント・状態を管理する Reactive Controller
 *
 * @export
 * @class IssuesController
 * @implements {ReactiveController}
 */
export class IssuesController implements ReactiveController {
  private host: ReactiveControllerHost;
  private repository: IssuesRepository;
  private _taskId: number | undefined;

  /** Issuesの内部状態 */
  private _state: IssueRecord[] = [];

  /**
   * 現在のIssue一覧（読み取り専用）
   *
   * @readonly
   * @type {readonly IssueRecord[]}
   * @memberof IssuesController
   */
  public get state(): readonly IssueRecord[] {
    return this._state;
  }

  /**
   * 現在対象のタスクID
   *
   * @readonly
   * @type {(number | undefined)}
   * @memberof IssuesController
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
   * @memberof IssuesController
   */
  public readonly initialized: Promise<void>;

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
   * @memberof IssuesController
   */
  private loadState = async (): Promise<void> => {
    if (this._taskId !== undefined) {
      const records = await this.repository.getByTaskId(this._taskId);
      this._state = [...records];
    } else {
      this._state = [];
    }
    this.host.requestUpdate();
  };

  /**
   * 対象とするタスクIDを変更し、データを再ロードする。
   *
   * @param {(number | undefined)} id
   * @return {*}  {Promise<void>}
   * @memberof IssuesController
   */
  public setTaskId = async (id: number | undefined): Promise<void> => {
    this._taskId = id;
    await this.loadState();
  };

  /**
   * データベースから最新の状態を再読み込みする。
   *
   * @return {*}  {Promise<void>}
   * @memberof IssuesController
   */
  public refresh = async (): Promise<void> => {
    await this.loadState();
  };

  /**
   * 新規Issueを作成する。
   * taskIdが未設定の場合は作成せず undefined を返す。
   *
   * @param {Omit<IssueRecord, "id" | "taskId">} data
   * @return {*}  {Promise<number | undefined>} 採番されたID、または未設定時はundefined
   * @memberof IssuesController
   */
  public createIssue = async (
    data: Omit<IssueRecord, "id" | "taskId">,
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
   * Issue内容を更新する
   *
   * @param {number} id
   * @param {Partial<Omit<IssueRecord, "id">>} data
   * @return {*}  {Promise<void>}
   * @memberof IssuesController
   */
  public updateIssue = async (
    id: number,
    data: Partial<Omit<IssueRecord, "id">>,
  ): Promise<void> => {
    await this.repository.update(id, data);
    await this.loadState();
  };

  /**
   * 指定したIDのIssueを削除する
   *
   * @param {number} id
   * @return {*}  {Promise<void>}
   * @memberof IssuesController
   */
  public deleteIssue = async (id: number): Promise<void> => {
    await this.repository.delete(id);
    await this.loadState();
  };

  /**
   * hostConnected
   *
   * @memberof IssuesController
   */
  hostConnected(): void {}

  /**
   * hostDisconnected
   *
   * @memberof IssuesController
   */
  hostDisconnected(): void {}
}
