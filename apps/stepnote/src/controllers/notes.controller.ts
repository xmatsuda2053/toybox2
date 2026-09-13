import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { NotesRepository } from "@/repositories/notes.repository";
import type { NoteRecord } from "@/db/models/journal.model";

/**
 * Note関連イベント・状態を管理する Reactive Controller
 *
 * @export
 * @class NotesController
 * @implements {ReactiveController}
 */
export class NotesController implements ReactiveController {
  private host: ReactiveControllerHost;
  private repository: NotesRepository;
  private _taskId: number | undefined;

  /** Notesの内部状態 */
  private _state: NoteRecord[] = [];

  /**
   * 現在のNote一覧（読み取り専用）
   *
   * @readonly
   * @type {readonly NoteRecord[]}
   * @memberof NotesController
   */
  public get state(): readonly NoteRecord[] {
    return this._state;
  }

  /**
   * 現在対象のタスクID
   *
   * @readonly
   * @type {(number | undefined)}
   * @memberof NotesController
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
   * @memberof NotesController
   */
  public readonly initialized: Promise<void>;

  /**
   * Creates an instance of NotesController.
   * @param {ReactiveControllerHost} host
   * @param {NotesRepository} repository
   * @param {number} [taskId]
   * @memberof NotesController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: NotesRepository,
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
   * @memberof NotesController
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
   * @memberof NotesController
   */
  public setTaskId = async (id: number | undefined): Promise<void> => {
    this._taskId = id;
    await this.loadState();
  };

  /**
   * データベースから最新の状態を再読み込みする。
   *
   * @return {*}  {Promise<void>}
   * @memberof NotesController
   */
  public refresh = async (): Promise<void> => {
    await this.loadState();
  };

  /**
   * 新規Noteを作成する。
   * taskIdが未設定の場合は作成せず undefined を返す。
   *
   * @param {Omit<NoteRecord, "id" | "taskId">} data
   * @return {*}  {Promise<number | undefined>} 採番されたID、または未設定時はundefined
   * @memberof NotesController
   */
  public createNote = async (
    data: Omit<NoteRecord, "id" | "taskId">,
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
   * Note内容を更新する
   *
   * @param {number} id
   * @param {Partial<Omit<NoteRecord, "id">>} data
   * @return {*}  {Promise<void>}
   * @memberof NotesController
   */
  public updateNote = async (
    id: number,
    data: Partial<Omit<NoteRecord, "id">>,
  ): Promise<void> => {
    await this.repository.update(id, data);
    await this.loadState();
  };

  /**
   * 指定したIDのNoteを削除する
   *
   * @param {number} id
   * @return {*}  {Promise<void>}
   * @memberof NotesController
   */
  public deleteNote = async (id: number): Promise<void> => {
    await this.repository.delete(id);
    await this.loadState();
  };

  /**
   * hostConnected
   *
   * @memberof NotesController
   */
  hostConnected(): void {}

  /**
   * hostDisconnected
   *
   * @memberof NotesController
   */
  hostDisconnected(): void {}
}
