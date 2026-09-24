import { db } from "@/db/schema/database.schema";
import type { LogRecord } from "@/db/models/journal.model";
import { BaseTaskSubItemRepository } from "./base-task-sub-item.repository";

/**
 * Logに対するCRUDおよび状態を制御するリポジトリ
 *
 * @export
 * @class LogsRepository
 * @extends {BaseTaskSubItemRepository<LogRecord>}
 */
export class LogsRepository extends BaseTaskSubItemRepository<LogRecord> {
  constructor() {
    super(db.logs);
  }
}
