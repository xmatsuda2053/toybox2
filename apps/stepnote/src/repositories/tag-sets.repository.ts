import { db } from "@/db/schema/database.schema";
import type { CreateTagSetInput, TagSetRecord } from "@/db/models/tag.model";
import {
  normalizeTagIds,
  normalizeTagSetName,
  sortTagSetsByNameAsc,
} from "@/utils/tag.utils";
import { BaseRepository } from "./base.repository";

/**
 * TagSet に対する CRUD およびバリデーションを制御するリポジトリ
 *
 * @export
 * @class TagSetsRepository
 * @extends {BaseRepository<TagSetRecord>}
 */
export class TagSetsRepository extends BaseRepository<TagSetRecord> {
  constructor() {
    super(db.tagSets);
  }

  /**
   * タグセット名の昇順でソートされた全タグセット一覧を取得する。
   */
  public getAllSorted = async (): Promise<TagSetRecord[]> => {
    const sets = await this.getAll();
    return sortTagSetsByNameAsc(sets);
  };

  /**
   * 大文字小文字を区別せずにセット名からタグセットを検索する。
   */
  public findByNameIgnoreCase = async (
    name: string,
  ): Promise<TagSetRecord | undefined> => {
    const normalized = normalizeTagSetName(name).toLowerCase();
    if (!normalized) {
      return undefined;
    }
    const sets = await this.getAll();
    return sets.find((set) => set.name.toLowerCase() === normalized);
  };

  /**
   * 重複しないタグセット名であることを検証し、正規化済みセット名を返す。
   */
  private async validateUniqueTagSetName(
    rawName: string,
    excludeId?: number,
  ): Promise<string> {
    const normalized = normalizeTagSetName(rawName);
    if (!normalized) {
      throw new Error("タグセット名を入力してください");
    }

    const existing = await this.findByNameIgnoreCase(normalized);
    if (existing && existing.id !== excludeId) {
      throw new Error(`同名のタグセット「${normalized}」は既に存在します`);
    }
    return normalized;
  }

  /**
   * 新規タグセットを正規化・重複検証のうえ登録する。
   */
  public addTagSet = async (input: CreateTagSetInput): Promise<number> => {
    const name = await this.validateUniqueTagSetName(input.name);
    const now = new Date();
    return await this.add({
      name,
      description: (input.description ?? "").trim(),
      tagIds: normalizeTagIds(input.tagIds),
      createdAt: now,
      updatedAt: now,
    });
  };

  /**
   * 既存タグセットを正規化・重複検証のうえ更新する。
   */
  public updateTagSet = async (
    id: number,
    partial: Partial<Omit<TagSetRecord, "id">>,
  ): Promise<void> => {
    const updatePayload: Partial<Omit<TagSetRecord, "id">> = {
      ...partial,
      updatedAt: new Date(),
    };

    if (partial.name !== undefined) {
      updatePayload.name = await this.validateUniqueTagSetName(partial.name, id);
    }
    if (partial.description !== undefined) {
      updatePayload.description = partial.description.trim();
    }
    if (partial.tagIds !== undefined) {
      updatePayload.tagIds = normalizeTagIds(partial.tagIds);
    }

    await this.update(id, updatePayload);
  };

  /**
   * 指定したIDのタグセットを削除する。
   */
  public deleteTagSet = async (id: number): Promise<void> => {
    await this.delete(id);
  };
}
