import { db } from "@/db/schema/database.schema";
import type { IssueRecord } from "@/db/models/task.model";
import type { TaskStatusCode } from "@/types/domain/task-status.type";

/**
 * Issueに対するCRUDおよび状態を制御するリポジトリ
 *
 * @export
 * @class IssuesRepository
 */
export class IssuesRepository {
  /**
   * DBからすべてのIssueを取得する
   *
   * @return {*} {Promise<IssueRecord[]>}
   * @memberof IssuesRepository
   */
  public getAll = async (): Promise<IssueRecord[]> => {
    return await db.issues.toArray();
  };

  /**
   * 指定したIDのIssueを取得する
   *
   * @param {number} id
   * @return {*} {Promise<IssueRecord | undefined>}
   * @memberof IssuesRepository
   */
  public getById = async (id: number): Promise<IssueRecord | undefined> => {
    return await db.issues.get(id);
  };

  /**
   * 指定したtaskIdのIssueリストを取得する。存在しない場合は空配列を返す。
   *
   * @param {number} taskId
   * @return {*} {Promise<IssueRecord[]>}
   * @memberof IssuesRepository
   */
  public getByTaskId = async (taskId: number): Promise<IssueRecord[]> => {
    return await db.issues.where("taskId").equals(taskId).toArray();
  };

  /**
   * 新規Issueを追加する
   *
   * @param {Omit<IssueRecord, "id">} issue
   * @return {*} {Promise<number>}
   * @memberof IssuesRepository
   */
  public add = async (issue: Omit<IssueRecord, "id">): Promise<number> => {
    return await db.issues.add({ ...issue });
  };

  /**
   * 指定したIDのIssueを更新する
   *
   * @param {number} id
   * @param {Partial<Omit<IssueRecord, "id">>} partial
   * @return {*} {Promise<void>}
   * @memberof IssuesRepository
   */
  public update = async (
    id: number,
    partial: Partial<Omit<IssueRecord, "id">>,
  ): Promise<void> => {
    await db.issues.update(id, partial);
  };

  /**
   * 指定したIDのIssueを削除する
   *
   * @param {number} id
   * @return {*} {Promise<void>}
   * @memberof IssuesRepository
   */
  public delete = async (id: number): Promise<void> => {
    await db.issues.delete(id);
  };

  /**
   * 指定したtaskIdに紐づくすべてのIssueを削除する
   *
   * @param {number} taskId
   * @return {*} {Promise<void>}
   * @memberof IssuesRepository
   */
  public deleteByTaskId = async (taskId: number): Promise<void> => {
    await db.issues.where("taskId").equals(taskId).delete();
  };

  /**
   * 指定したIDのIssueのステータスコードを更新する
   *
   * @param {number} id
   * @param {TaskStatusCode} statusCode
   * @return {*} {Promise<void>}
   * @memberof IssuesRepository
   */
  public updateStatusCode = async (
    id: number,
    statusCode: TaskStatusCode,
  ): Promise<void> => {
    const count = await db.issues.update(id, { statusCode });
    if (count === 0) {
      throw new Error(`Issue with id ${id} not found`);
    }
  };
}
