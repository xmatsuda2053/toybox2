import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { IssuesRepository } from "@/repositories/issues.repository";
import type { IssueRecord } from "@/db/models/task.model";

/**
 * Issue関連イベントを管理する Reactive Controller
 *
 * @export
 * @class IssuesController
 * @implements {ReactiveController}
 */
export class IssuesController implements ReactiveController {
  private host: ReactiveControllerHost;
  private repository: IssuesRepository;
  private taskId: number;

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
   * @param {number} taskId
   * @memberof IssuesController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: IssuesRepository,
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
   * @memberof IssuesController
   */
  private loadState = async (): Promise<void> => {
    const records = await this.repository.getByTaskId(this.taskId);
    this._state = [...records];
    this.host.requestUpdate();
  };

  /**
   * 新規Issueを作成する
   *
   * @param {Omit<IssueRecord, "id" | "taskId">} data
   * @return {*}  {Promise<void>}
   * @memberof IssuesController
   */
  public createIssue = async (
    data: Omit<IssueRecord, "id" | "taskId"> & { taskId?: number },
  ): Promise<void> => {
    await this.repository.add({
      taskId: this.taskId,
      ...data,
    });
    await this.loadState();
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
