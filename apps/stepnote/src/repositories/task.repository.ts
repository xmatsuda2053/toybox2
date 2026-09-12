import { db } from "@/db/schema/database.schema";
import type { TaskRecord } from "@/db/models/task.model";

/**
 * Taskに対するCRUDおよび状態を制御するリポジトリ
 *
 * @export
 * @class TaskRepository
 */
export class TaskRepository {
  /**
   * DBからすべてのタスクを取得する
   *
   * @return {*} {Promise<TaskRecord[]>}
   * @memberof TaskRepository
   */
  public getAll = async (): Promise<TaskRecord[]> => {
    return await db.tasks.toArray();
  };

  /**
   * 指定したIDのタスクを取得する
   *
   * @param {number} id
   * @return {*} {Promise<TaskRecord | undefined>}
   * @memberof TaskRepository
   */
  public getById = async (id: number): Promise<TaskRecord | undefined> => {
    return await db.tasks.get(id);
  };

  /**
   * 新規タスクを追加する
   *
   * @param {Omit<TaskRecord, "id">} task
   * @return {*} {Promise<number>}
   * @memberof TaskRepository
   */
  public add = async (task: Omit<TaskRecord, "id">): Promise<number> => {
    return await db.tasks.add({ ...task });
  };

  /**
   * 指定したIDのタスクを更新する
   *
   * @param {number} id
   * @param {Partial<Omit<TaskRecord, "id">>} partial
   * @return {*} {Promise<void>}
   * @memberof TaskRepository
   */
  public update = async (
    id: number,
    partial: Partial<Omit<TaskRecord, "id">>,
  ): Promise<void> => {
    await db.tasks.update(id, partial);
  };

  /**
   * 指定したIDのタスクを削除する
   *
   * @param {number} id
   * @return {*} {Promise<void>}
   * @memberof TaskRepository
   */
  public delete = async (id: number): Promise<void> => {
    await db.tasks.delete(id);
  };

  /**
   * すべてのタスクの選択状態を解除する。
   *
   * @return {*} {Promise<void>}
   * @memberof TaskRepository
   */
  public clearSelection = async (): Promise<void> => {
    await db.tasks.toCollection().modify({ selected: false });
  };

  /**
   * 指定したIDのタスクを選択状態にする。
   * 単一選択制御のため、他のタスクの選択状態はすべて解除される。
   *
   * @param {number} id
   * @return {*} {Promise<void>}
   * @memberof TaskRepository
   */
  public select = async (id: number): Promise<void> => {
    await db.transaction("rw", db.tasks, async () => {
      await this.clearSelection();
      await db.tasks.update(id, { selected: true });
    });
  };
}
