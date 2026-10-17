import type { ReactiveControllerHost } from "lit";
import type { NotesRepository } from "@/repositories/notes.repository";
import type { SystemLogService } from "@/services/system-log.service";
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
    const newId = await this.createSubItem(data);
    if (this.systemLogService && this._taskId !== undefined && newId !== undefined) {
      await this.systemLogService.logNoteCreated(this._taskId, newId);
    }
    return newId;
  };

  /** Note内容を更新する */
  public updateNote = this.updateSubItem;

  /** 指定したIDのNoteを削除する */
  public deleteNote = async (id: number): Promise<void> => {
    const target = this._state.find((n) => n.id === id);
    const title = this.extractTitleFromValue(target?.value);
    await this.deleteSubItem(id);

    if (target && this.systemLogService && this._taskId !== undefined) {
      await this.systemLogService.logNoteDeleted(this._taskId, id, title);
    }
  };

  /** ノート本文から1行目タイトル文字列を抽出するヘルパー */
  private extractTitleFromValue(value?: string): string | undefined {
    if (!value) return undefined;
    const firstLine = value.split(/\r?\n/)[0]?.trim();
    if (!firstLine) return undefined;
    const cleaned = firstLine.replace(/^#+\s*/, "").trim();
    return cleaned || undefined;
  }
}
