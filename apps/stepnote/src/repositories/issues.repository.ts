import { db } from "@/db/schema/database.schema";
import type { IssueRecord } from "@/db/models/task.model";
import type { TaskStatusCode } from "@/types/domain/task-status.type";
import { BaseTaskSubItemRepository } from "./base-task-sub-item.repository";

/**
 * Issueに対するCRUDおよび状態を制御するリポジトリ
 *
 * @export
 * @class IssuesRepository
 * @extends {BaseTaskSubItemRepository<IssueRecord>}
 */
export class IssuesRepository extends BaseTaskSubItemRepository<IssueRecord> {
  constructor() {
    super(db.issues);
  }

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
    const count = await this.table.update(id, { statusCode });
    if (count === 0) {
      throw new Error(`Issue with id ${id} not found`);
    }
  };
}
