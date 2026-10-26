import type { ReactiveControllerHost } from "lit";
import type { NotesRepository } from "@/repositories/notes.repository";
import type { SystemLogService } from "@/services/system-log.service";
import type { NoteRecord } from "@/db/models/journal.model";
import { extractMarkdownTitle } from "@shared/utils";
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
  private systemLogService?: SystemLogService;

  /**
   * Creates an instance of NotesController.
   * @param {ReactiveControllerHost} host
   * @param {NotesRepository} repository
   * @param {number} [taskId]
   * @param {SystemLogService} [systemLogService]
   * @memberof NotesController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: NotesRepository,
    taskId?: number,
    systemLogService?: SystemLogService,
  ) {
    super(host, repository, taskId);
    this.systemLogService = systemLogService;
  }

  /** 新規Noteを作成する */
  public createNote = async (
    data: Omit<NoteRecord, "id" | "taskId">,
  ): Promise<number | undefined> => {
    const title = data.title ?? extractMarkdownTitle(data.value, "(無題のメモ)");
    const newId = await this.createSubItem({ ...data, title });
    if (this.systemLogService && this._taskId !== undefined && newId !== undefined) {
      await this.systemLogService.logNoteCreated(this._taskId, newId);
    }
    return newId;
  };

  /** Note内容を更新する */
  public updateNote = async (
    id: number,
    data: Partial<Omit<NoteRecord, "id" | "taskId">>,
  ): Promise<void> => {
    const title =
      data.title !== undefined
        ? data.title
        : data.value !== undefined
          ? extractMarkdownTitle(data.value, "(無題のメモ)")
          : undefined;

    const updatePayload = title !== undefined ? { ...data, title } : data;
    await this.updateSubItem(id, updatePayload);
  };

  /** 指定したIDのNoteを削除する */
  public deleteNote = async (id: number): Promise<void> => {
    const target = this._state.find((n) => n.id === id);
    const title = target?.title ?? extractMarkdownTitle(target?.value, "(無題のメモ)");
    await this.deleteSubItem(id);

    if (target && this.systemLogService && this._taskId !== undefined) {
      await this.systemLogService.logNoteDeleted(this._taskId, id, title);
    }
  };
}

