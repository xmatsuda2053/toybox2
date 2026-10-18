import { db, Database } from "@/db/schema/database.schema";
import type { ScratchRecord } from "@/db/models/scratch.model";
import { BaseRepository } from "./base.repository";

/**
 * スクラッチ（アプリ共通メモ）に対するCRUD操作を提供するリポジトリ
 *
 * @export
 * @class ScratchRepository
 * @extends {BaseRepository<ScratchRecord>}
 */
export class ScratchRepository extends BaseRepository<ScratchRecord> {
  /**
   * コンストラクタ
   * @param {Database} [database=db] 使用するデータベースインスタンス
   */
  constructor(database: Database = db) {
    super(database.scratches);
  }
}
