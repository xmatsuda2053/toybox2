import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { BaseTaskSubItemRepository } from "@/repositories/base-task-sub-item.repository";

/**
 * リスナー購読管理（Observerパターン）およびホスト連携を一元化する基底リアクティブコントローラー
 *
 * @export
 * @class BaseReactiveController
 * @template TNotification リスナー通知時に渡されるデータの型（デフォルト: void）
 * @implements {ReactiveController}
 */
export class BaseReactiveController<TNotification = void>
  implements ReactiveController
{
  /**
   * このコントローラーを保持する Lit コンポーネントのホスト参照
   *
   * @protected
   * @type {ReactiveControllerHost}
   * @memberof BaseReactiveController
   */
  protected host: ReactiveControllerHost;

  /**
   * 状態変更を購読するリスナー関数のセット
   *
   * @protected
   * @type {Set<(data?: TNotification) => void>}
   * @memberof BaseReactiveController
   */
  protected listeners: Set<(data?: TNotification) => void> = new Set();

  /**
   * Creates an instance of BaseReactiveController.
   * @param {ReactiveControllerHost} host
   * @memberof BaseReactiveController
   */
  constructor(host: ReactiveControllerHost) {
    this.host = host;
    this.host.addController(this);
  }

  /**
   * LitElement 接続時ライフサイクル（必要に応じて派生クラスでオーバーライド）
   *
   * @memberof BaseReactiveController
   */
  public hostConnected?(): void {}

  /**
   * LitElement 切断時ライフサイクル（必要に応じて派生クラスでオーバーライド）
   *
   * @memberof BaseReactiveController
   */
  public hostDisconnected?(): void {}

  /**
   * 状態変更リスナーを登録する（Observer / Subscribe パターン）。
   *
   * 状態が変更された際に呼び出されるコールバック関数を登録します。
   * 戻り値として、登録したリスナーを安全に解除するための購読解除関数（Unsubscribe）を返却します。
   *
   * @param {(data?: TNotification) => void} listener 状態変更時に実行するコールバック関数
   * @return {() => void} 購読を解除するための関数
   * @memberof BaseReactiveController
   */
  public subscribe = (
    listener: (data?: TNotification) => void,
  ): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * ホストコンポーネントおよびすべての購読リスナーへ状態変更を通知する内部ヘルパー。
   *
   * @protected
   * @param {TNotification} [data]
   * @return {*} {void}
   * @memberof BaseReactiveController
   */
  protected notify(data?: TNotification): void {
    this.host.requestUpdate();
    this.listeners.forEach((listener) => listener(data));
  }
}

/**
 * 非同期データ読み込みおよび最新化（refresh）ライフサイクルを管理する基底データコントローラー
 *
 * @export
 * @abstract
 * @class BaseDataController
 * @template TRepository リポジトリの型
 * @template TState 保持する状態の型
 * @extends {BaseReactiveController<void>}
 */
export abstract class BaseDataController<
  TRepository = unknown,
  TState = unknown,
> extends BaseReactiveController<void> {
  /**
   * データアクセスを担当するリポジトリ
   *
   * @protected
   * @type {TRepository}
   * @memberof BaseDataController
   */
  protected repository: TRepository;

  /**
   * 内部状態
   *
   * @protected
   * @type {TState}
   * @memberof BaseDataController
   */
  protected _state: TState;

  /**
   * 現在の状態（読み取り専用）
   *
   * @readonly
   * @type {TState}
   * @memberof BaseDataController
   */
  public get state(): TState {
    return this._state;
  }

  /**
   * Controllerの非同期初期化プロミス
   *
   * @type {Promise<void>}
   * @memberof BaseDataController
   */
  public readonly initialized: Promise<void>;

  /**
   * Creates an instance of BaseDataController.
   * @param {ReactiveControllerHost} host
   * @param {TRepository} repository
   * @param {TState} initialState 初期状態
   * @memberof BaseDataController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: TRepository,
    initialState: TState,
  ) {
    super(host);
    this.repository = repository;
    this._state = initialState;
    this.initialized = Promise.resolve().then(() => this.loadState());
  }

  /**
   * 内部状態をデータソースから再読み込みする抽象メソッド
   *
   * @protected
   * @abstract
   * @return {*} {Promise<void>}
   * @memberof BaseDataController
   */
  protected abstract loadState(): Promise<void>;

  /**
   * データベース等から最新の状態を再読み込みする
   *
   * @return {*} {Promise<void>}
   * @memberof BaseDataController
   */
  public refresh = async (): Promise<void> => {
    await this.loadState();
  };
}

/**
 * 単一タスク（taskId）のスコープを持つコントローラーの基底クラス
 *
 * @export
 * @abstract
 * @class BaseTaskScopeController
 * @template TRepository リポジトリの型
 * @template TState 状態の型
 * @extends {BaseDataController<TRepository, TState>}
 */
export abstract class BaseTaskScopeController<
  TRepository = unknown,
  TState = unknown,
> extends BaseDataController<TRepository, TState> {
  /**
   * 現在選択・対象としているタスクID
   *
   * @protected
   * @type {(number | undefined)}
   * @memberof BaseTaskScopeController
   */
  protected _taskId?: number;

  /**
   * 現在対象のタスクID（読み取り専用）
   *
   * @readonly
   * @type {(number | undefined)}
   * @memberof BaseTaskScopeController
   */
  public get taskId(): number | undefined {
    return this._taskId;
  }

  /**
   * Creates an instance of BaseTaskScopeController.
   * @param {ReactiveControllerHost} host
   * @param {TRepository} repository
   * @param {TState} initialState
   * @param {number} [taskId]
   * @memberof BaseTaskScopeController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: TRepository,
    initialState: TState,
    taskId?: number,
  ) {
    super(host, repository, initialState);
    this._taskId = taskId;
  }

  /**
   * 対象とするタスクIDを変更し、データを再ロードする
   *
   * @param {(number | undefined)} id
   * @return {*} {Promise<void>}
   * @memberof BaseTaskScopeController
   */
  public setTaskId = async (id: number | undefined): Promise<void> => {
    this._taskId = id;
    await this.loadState();
  };
}

/**
 * Task従属データ（Issues, Logs, Notes 等）のCRUD操作および状態管理を一元化する基底コントローラー
 *
 * @export
 * @abstract
 * @class BaseTaskSubItemController
 * @template TRecord レコード型（idとtaskIdを持つエンティティ）
 * @template TRepository リポジトリ型
 * @extends {BaseTaskScopeController<TRepository, ReadonlyArray<TRecord>>}
 */
export abstract class BaseTaskSubItemController<
  TRecord extends { id?: number; taskId: number },
  TRepository extends BaseTaskSubItemRepository<TRecord> = BaseTaskSubItemRepository<TRecord>,
> extends BaseTaskScopeController<TRepository, ReadonlyArray<TRecord>> {
  /**
   * Creates an instance of BaseTaskSubItemController.
   * @param {ReactiveControllerHost} host
   * @param {TRepository} repository
   * @param {number} [taskId]
   * @memberof BaseTaskSubItemController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: TRepository,
    taskId?: number,
  ) {
    super(host, repository, [], taskId);
  }

  /**
   * サブアイテム一覧をリポジトリから再取得し、変更を全購読者へ通知する。
   */
  protected async loadState(): Promise<void> {
    if (this._taskId !== undefined) {
      const records = await this.repository.getByTaskId(this._taskId);
      this._state = [...records];
    } else {
      this._state = [];
    }
    this.notify();
  }

  /**
   * サブアイテムを新規作成する。
   * taskIdが未設定の場合は作成せず undefined を返す。
   *
   * @public
   * @param {Omit<TRecord, "id" | "taskId">} data
   * @return {*} {Promise<number | undefined>} 採番されたID、または未設定時はundefined
   * @memberof BaseTaskSubItemController
   */
  public createSubItem = async (
    data: Omit<TRecord, "id" | "taskId">,
  ): Promise<number | undefined> => {
    if (this._taskId === undefined) {
      return undefined;
    }
    const newId = await this.repository.add({
      taskId: this._taskId,
      ...data,
    } as unknown as Omit<TRecord, "id">);
    await this.loadState();
    return newId;
  };

  /**
   * サブアイテムを更新する。
   *
   * @public
   * @param {number} id
   * @param {Partial<Omit<TRecord, "id" | "taskId">>} data
   * @return {*} {Promise<void>}
   * @memberof BaseTaskSubItemController
   */
  public updateSubItem = async (
    id: number,
    data: Partial<Omit<TRecord, "id" | "taskId">>,
  ): Promise<void> => {
    await this.repository.update(id, data as unknown as Partial<TRecord>);
    await this.loadState();
  };

  /**
   * サブアイテムを削除する。
   *
   * @public
   * @param {number} id
   * @return {*} {Promise<void>}
   * @memberof BaseTaskSubItemController
   */
  public deleteSubItem = async (id: number): Promise<void> => {
    await this.repository.delete(id);
    await this.loadState();
  };
}
