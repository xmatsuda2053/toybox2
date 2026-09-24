import { db } from "@/db/schema/database.schema";
import type { NoteRecord } from "@/db/models/journal.model";
import { BaseTaskSubItemRepository } from "./base-task-sub-item.repository";

/**
 * Noteに対するCRUDおよび状態を制御するリポジトリ
 *
 * @export
 * @class NotesRepository
 * @extends {BaseTaskSubItemRepository<NoteRecord>}
 */
export class NotesRepository extends BaseTaskSubItemRepository<NoteRecord> {
  constructor() {
    super(db.notes);
  }
}
