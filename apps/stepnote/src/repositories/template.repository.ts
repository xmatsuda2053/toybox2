import { db, Database } from "@/db/schema/database.schema";
import type { TaskTemplateRecord } from "@/db/models/template.model";
import { BaseRepository } from "./base.repository";
import { cloneTaskTemplate } from "@/utils/task-template.utils";

/**
 * タスクテンプレートに対する CRUD および複製操作を提供するリポジトリ
 *
 * @export
 * @class TaskTemplateRepository
 * @extends {BaseRepository<TaskTemplateRecord>}
 */
export class TaskTemplateRepository extends BaseRepository<TaskTemplateRecord> {
  /**
   * コンストラクタ
   * @param {Database} [database=db] 使用するデータベースインスタンス
   */
  constructor(database: Database = db) {
    super(database.taskTemplates);
  }

  /**
   * 指定したIDのテンプレートを複製し、新しいレコードとして保存する
   *
   * @param {number} id 複製元のテンプレートID
   * @return {Promise<number>} 新規作成されたテンプレートID
   */
  public clone = async (id: number): Promise<number> => {
    const original = await this.getById(id);
    if (!original) {
      throw new Error(`TaskTemplate with id ${id} not found.`);
    }

    const clonedData = cloneTaskTemplate(original);
    return await this.add({
      ...clonedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };
}

