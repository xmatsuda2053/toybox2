import { db } from "@/db/schema/database.schema";
import type { LogRecord } from "@/db/models/journal.model";

/**
 * Logに対するCRUDおよび状態を制御するリポジトリ
 *
 * @export
 * @class LogsRepository
 */
export class LogsRepository {
  /**
   * DBからすべてのLogを取得する
   *
   * @return {*} {Promise<LogRecord[]>}
   * @memberof LogsRepository
   */
  public getAll = async (): Promise<LogRecord[]> => {
    return await db.logs.toArray();
  };

  /**
   * 指定したIDのLogを取得する
   *
   * @param {number} id
   * @return {*} {Promise<LogRecord | undefined>}
   * @memberof LogsRepository
   */
  public getById = async (id: number): Promise<LogRecord | undefined> => {
    return await db.logs.get(id);
  };

  /**
   * 指定したtaskIdのLogリストを取得する。存在しない場合は空配列を返す。
   *
   * @param {number} taskId
   * @return {*} {Promise<LogRecord[]>}
   * @memberof LogsRepository
   */
  public getByTaskId = async (taskId: number): Promise<LogRecord[]> => {
    return await db.logs.where("taskId").equals(taskId).toArray();
  };

  /**
   * 新規Logを追加する
   *
   * @param {Omit<LogRecord, "id">} log
   * @return {*} {Promise<number>}
   * @memberof LogsRepository
   */
  public add = async (log: Omit<LogRecord, "id">): Promise<number> => {
    return await db.logs.add({ ...log });
  };

  /**
   * 指定したIDのLogを更新する
   *
   * @param {number} id
   * @param {Partial<Omit<LogRecord, "id">>} partial
   * @return {*} {Promise<void>}
   * @memberof LogsRepository
   */
  public update = async (
    id: number,
    partial: Partial<Omit<LogRecord, "id">>,
  ): Promise<void> => {
    await db.logs.update(id, partial);
  };

  /**
   * 指定したIDのLogを削除する
   *
   * @param {number} id
   * @return {*} {Promise<void>}
   * @memberof LogsRepository
   */
  public delete = async (id: number): Promise<void> => {
    await db.logs.delete(id);
  };

  /**
   * 指定したtaskIdに紐づくすべてのLogを削除する
   *
   * @param {number} taskId
   * @return {*} {Promise<void>}
   * @memberof LogsRepository
   */
  public deleteByTaskId = async (taskId: number): Promise<void> => {
    await db.logs.where("taskId").equals(taskId).delete();
  };
}
