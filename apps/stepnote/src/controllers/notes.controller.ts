import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { NotesRepository } from "@/repositories/notes.repository";
import type { NoteRecord } from "@/db/models/journal.model";

/**
 * Note関連イベントを管理する Reactive Controller
 *
 * @export
 * @class NotesController
 * @implements {ReactiveController}
 */
export class NotesController implements ReactiveController {
  private host: ReactiveControllerHost;
  private repository: NotesRepository;
  private taskId: number;

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
   * @param {number} taskId
   * @memberof NotesController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: NotesRepository,
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
   * @memberof NotesController
   */
  private loadState = async (): Promise<void> => {
    const records = await this.repository.getByTaskId(this.taskId);
    this._state = [...records];
    this.host.requestUpdate();
  };

  /**
   * 新規Noteを作成する
   *
   * @param {Omit<NoteRecord, "id" | "taskId"> & { taskId?: number }} data
   * @return {*}  {Promise<void>}
   * @memberof NotesController
   */
  public createNote = async (
    data: Omit<NoteRecord, "id" | "taskId"> & { taskId?: number },
  ): Promise<void> => {
    await this.repository.add({
      taskId: this.taskId,
      ...data,
    });
    await this.loadState();
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
