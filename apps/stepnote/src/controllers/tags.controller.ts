import type { TagsRepository } from "@/repositories/tags.repository";
import type { CreateTagInput, TagRecord } from "@/db/models/tag.model";
import { normalizeTagName } from "@/utils/tag.utils";
import { BaseSortedDataController } from "./base-reactive.controller";

/**
 * Tag マスタ関連イベント・状態を管理する Reactive Controller
 *
 * @export
 * @class TagsController
 * @extends {BaseSortedDataController<TagsRepository, TagRecord>}
 */
export class TagsController extends BaseSortedDataController<
  TagsRepository,
  TagRecord
> {

  /**
   * 新規タグを作成する。
   */
  public createTag = async (input: CreateTagInput): Promise<number> => {
    const newId = await this.repository.addTag(input);
    await this.loadState();
    return newId;
  };

  /**
   * 既存タグの内容を更新する。
   */
  public updateTag = async (
    id: number,
    data: Partial<Omit<TagRecord, "id">>,
  ): Promise<void> => {
    await this.repository.updateTag(id, data);
    await this.loadState();
  };

  /**
   * 指定したIDのタグを削除し、関連タスクの tagIds からも除去する。
   */
  public deleteTag = async (id: number): Promise<void> => {
    await this.repository.deleteTagWithCleanup(id);
    await this.loadState();
  };

  /**
   * 指定したタグIDが紐づいているタスク件数を取得する。
   */
  public getTagUsageCount = async (id: number): Promise<number> => {
    return await this.repository.getTaskUsageCount(id);
  };

  /**
   * IDからキャッシュ上のタグを取得する。
   */
  public getTagById(id: number): TagRecord | undefined {
    return this._state.find((tag) => tag.id === id);
  }

  /**
   * タグID配列から対応するタグ一覧を解決する（未存在IDは除外）。
   */
  public getTagsByIds(ids?: readonly number[]): TagRecord[] {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }
    const tagMap = new Map<number, TagRecord>();
    for (const tag of this._state) {
      if (tag.id !== undefined) {
        tagMap.set(tag.id, tag);
      }
    }
    const resolved: TagRecord[] = [];
    for (const id of ids) {
      const found = tagMap.get(id);
      if (found) {
        resolved.push(found);
      }
    }
    return resolved;
  }

  /**
   * 大文字小文字を区別せずにタグ名でキャッシュ上のタグを検索する。
   */
  public findByName(name: string): TagRecord | undefined {
    const normalized = normalizeTagName(name).toLowerCase();
    if (!normalized) {
      return undefined;
    }
    return this._state.find((tag) => tag.name.toLowerCase() === normalized);
  }

  hostConnected(): void {}

  hostDisconnected(): void {}
}
