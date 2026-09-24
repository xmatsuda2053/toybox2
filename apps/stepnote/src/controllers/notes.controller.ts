import type { ReactiveControllerHost } from "lit";
import type { NotesRepository } from "@/repositories/notes.repository";
import type { NoteRecord } from "@/db/models/journal.model";
import { BaseTaskSubItemController } from "./base-reactive.controller";

/**
 * Note関連イベント・状態を管理する Reactive Controller
 *
 * @export
 * @class NotesController
 * @extends {BaseTaskSubItemController<NoteRecord, NotesRepository>}
 */
export class NotesController extends BaseTaskSubItemController<
  NoteRecord,
  NotesRepository
> {
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
    super(host, repository, taskId);
  }

  /** 新規Noteを作成する */
  public createNote = this.createSubItem;

  /** Note内容を更新する */
  public updateNote = this.updateSubItem;

  /** 指定したIDのNoteを削除する */
  public deleteNote = this.deleteSubItem;
}
