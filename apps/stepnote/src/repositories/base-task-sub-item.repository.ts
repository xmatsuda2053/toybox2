import type { Table } from "dexie";
import { BaseRepository } from "./base.repository";

/**
 * タスクに紐づくエンティティ（taskId を持つレコード）に対するCRUDおよび検索操作を提供する基底リポジトリ
 *
 * @export
 * @class BaseTaskSubItemRepository
 * @template TRecord レコード型（id?: number, taskId: number を持つこと）
 * @extends {BaseRepository<TRecord>}
 */
export class BaseTaskSubItemRepository<
  TRecord extends { id?: number; taskId: number },
> extends BaseRepository<TRecord> {
  /**
   * コンストラクタ
   * @param {Table<TRecord, number>} table Dexieテーブルインスタンス
   */
  constructor(table: Table<TRecord, number>) {
    super(table);
  }

  /**
   * 指定したtaskIdのレコードリストを取得する。存在しない場合は空配列を返す。
   *
   * @param {number} taskId
   * @return {*} {Promise<TRecord[]>}
   * @memberof BaseTaskSubItemRepository
   */
  public getByTaskId = async (taskId: number): Promise<TRecord[]> => {
    return await this.table.where("taskId").equals(taskId).toArray();
  };

  /**
   * 指定したtaskIdに紐づくすべてのレコードを削除する
   *
   * @param {number} taskId
   * @return {*} {Promise<void>}
   * @memberof BaseTaskSubItemRepository
   */
  public deleteByTaskId = async (taskId: number): Promise<void> => {
    await this.table.where("taskId").equals(taskId).delete();
  };
}
