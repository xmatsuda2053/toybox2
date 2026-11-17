import { db } from "@/db/schema/database.schema";
import type { CreateTagInput, TagRecord } from "@/db/models/tag.model";
import {
  normalizeTagName,
  normalizeTagVariant,
  sortTagsByNameAsc,
} from "@/utils/tag.utils";
import { BaseRepository } from "./base.repository";

/**
 * Tag に対する CRUD および関連タスクの整合性維持を制御するリポジトリ
 *
 * @export
 * @class TagsRepository
 * @extends {BaseRepository<TagRecord>}
 */
export class TagsRepository extends BaseRepository<TagRecord> {
  constructor() {
    super(db.tags);
  }

  /**
   * タグ名の昇順でソートされた全タグ一覧を取得する。
   */
  public getAllSorted = async (): Promise<TagRecord[]> => {
    const tags = await this.getAll();
    return sortTagsByNameAsc(tags);
  };

  /**
   * 大文字小文字を区別せずにタグ名からタグを検索する。
   */
  public findByNameIgnoreCase = async (
    name: string,
  ): Promise<TagRecord | undefined> => {
    const normalized = normalizeTagName(name).toLowerCase();
    if (!normalized) {
      return undefined;
    }
    const tags = await this.getAll();
    return tags.find((tag) => tag.name.toLowerCase() === normalized);
  };

  /**
   * 重複しないタグ名であることを検証し、正規化済みタグ名を返す。
   */
  private async validateUniqueTagName(
    rawName: string,
    excludeId?: number,
  ): Promise<string> {
    const normalized = normalizeTagName(rawName);
    if (!normalized) {
      throw new Error("タグ名を入力してください");
    }

    const existing = await this.findByNameIgnoreCase(normalized);
    if (existing && existing.id !== excludeId) {
      throw new Error(`同名のタグ「${normalized}」は既に存在します`);
    }
    return normalized;
  }

  /**
   * 新規タグを正規化・重複検証のうえ登録する。
   */
  public addTag = async (input: CreateTagInput): Promise<number> => {
    const name = await this.validateUniqueTagName(input.name);
    const now = new Date();
    return await this.add({
      name,
      description: (input.description ?? "").trim(),
      variant: normalizeTagVariant(input.variant),
      createdAt: now,
      updatedAt: now,
    });
  };

  /**
   * 既存タグを正規化・重複検証のうえ更新する。
   */
  public updateTag = async (
    id: number,
    partial: Partial<Omit<TagRecord, "id">>,
  ): Promise<void> => {
    const updatePayload: Partial<Omit<TagRecord, "id">> = {
      ...partial,
      updatedAt: new Date(),
    };

    if (partial.name !== undefined) {
      updatePayload.name = await this.validateUniqueTagName(partial.name, id);
    }
    if (partial.description !== undefined) {
      updatePayload.description = partial.description.trim();
    }
    if (partial.variant !== undefined) {
      updatePayload.variant = normalizeTagVariant(partial.variant);
    }

    await this.update(id, updatePayload);
  };

  /**
   * 指定したタグIDが紐づいているタスクの件数を取得する。
   */
  public getTaskUsageCount = async (tagId: number): Promise<number> => {
    return await db.tasks.where("tagIds").equals(tagId).count();
  };

  /**
   * 指定したタグを削除し、該当タグを保持する全タスクの tagIds からも対象IDを一括除去する。
   */
  public deleteTagWithCleanup = async (tagId: number): Promise<void> => {
    await db.transaction("rw", db.tags, db.tasks, async () => {
      await db.tags.delete(tagId);
      const tasksWithTag = await db.tasks.where("tagIds").equals(tagId).toArray();
      for (const task of tasksWithTag) {
        if (task.id === undefined) continue;
        const nextTagIds = (task.tagIds ?? []).filter((id) => id !== tagId);
        await db.tasks.update(task.id, { tagIds: nextTagIds });
      }
    });
  };
}
