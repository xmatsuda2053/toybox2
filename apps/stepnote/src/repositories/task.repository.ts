import { db } from "@/db/schema/database.schema";
import type { TaskRecord } from "@/db/models/task.model";
import { BaseRepository } from "./base.repository";

/**
 * Taskに対するCRUDおよび状態を制御するリポジトリ
 *
 * @export
 * @class TaskRepository
 * @extends {BaseRepository<TaskRecord>}
 */
export class TaskRepository extends BaseRepository<TaskRecord> {
  constructor() {
    super(db.tasks);
  }

  /**
   * すべてのタスクの選択状態を解除する。
   *
   * @return {*} {Promise<void>}
   * @memberof TaskRepository
   */
  public clearSelection = async (): Promise<void> => {
    await this.table.toCollection().modify({ selected: false });
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
    await db.transaction("rw", this.table, async () => {
      await this.clearSelection();
      await this.table.update(id, { selected: true });
    });
  };

  /**
   * 現在選択状態（selected: true）のタスクを取得する。
   *
   * @return {*} {Promise<TaskRecord | undefined>}
   * @memberof TaskRepository
   */
  public getSelected = async (): Promise<TaskRecord | undefined> => {
    return await this.table.filter((task) => task.selected === true).first();
  };

  /**
   * 指定した会計年度に合致するタスク一覧を取得する。
   *
   * @param {number} fiscalYear 会計年度
   * @return {*} {Promise<TaskRecord[]>}
   * @memberof TaskRepository
   */
  public getByFiscalYear = async (
    fiscalYear: number,
  ): Promise<TaskRecord[]> => {
    return await this.table.where("fiscalYear").equals(fiscalYear).toArray();
  };
}
