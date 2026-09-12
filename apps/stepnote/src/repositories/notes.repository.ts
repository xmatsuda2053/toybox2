import { db } from "@/db/schema/database.schema";
import type { NoteRecord } from "@/db/models/journal.model";

/**
 * Noteに対するCRUDを制御する
 *
 * @class NotesRepository
 */
export class NotesRepository {
  /**
   * 指定したtaskIdのNoteリストを取得する。存在しない場合は空配列を返す。
   *
   * @param {number} taskId
   * @return {*}  {Promise<NoteRecord[]>}
   * @memberof NotesRepository
   */
  public getByTaskId = async (taskId: number): Promise<NoteRecord[]> => {
    return await db.notes.where("taskId").equals(taskId).toArray();
  };

  /**
   * 新規Noteを追加する
   *
   * @param {Omit<NoteRecord, "id">} note
   * @return {*}  {Promise<number>}
   * @memberof NotesRepository
   */
  public add = async (note: Omit<NoteRecord, "id">): Promise<number> => {
    return await db.notes.add({ ...note });
  };

  /**
   * 指定したIDのNoteを更新する
   *
   * @param {number} id
   * @param {Partial<Omit<NoteRecord, "id">>} partial
   * @memberof NotesRepository
   */
  public update = async (
    id: number,
    partial: Partial<Omit<NoteRecord, "id">>,
  ): Promise<void> => {
    await db.notes.update(id, partial);
  };

  /**
   * 指定したIDのNoteを削除する
   *
   * @param {number} id
   * @return {*}  {Promise<void>}
   * @memberof NotesRepository
   */
  public delete = async (id: number): Promise<void> => {
    await db.notes.delete(id);
  };
}
