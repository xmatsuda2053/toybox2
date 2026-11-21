import type { TagSetsRepository } from "@/repositories/tag-sets.repository";
import type { CreateTagSetInput, TagSetRecord } from "@/db/models/tag.model";
import { BaseSortedDataController } from "./base-reactive.controller";

/**
 * TagSet マスタ関連イベント・状態を管理する Reactive Controller
 *
 * @export
 * @class TagSetsController
 * @extends {BaseSortedDataController<TagSetsRepository, TagSetRecord>}
 */
export class TagSetsController extends BaseSortedDataController<
  TagSetsRepository,
  TagSetRecord
> {

  /**
   * 新規タグセットを作成する。
   */
  public createTagSet = async (input: CreateTagSetInput): Promise<number> => {
    const newId = await this.repository.addTagSet(input);
    await this.loadState();
    return newId;
  };

  /**
   * 既存タグセットの内容を更新する。
   */
  public updateTagSet = async (
    id: number,
    data: Partial<Omit<TagSetRecord, "id">>,
  ): Promise<void> => {
    await this.repository.updateTagSet(id, data);
    await this.loadState();
  };

  /**
   * 指定したIDのタグセットを削除する。
   */
  public deleteTagSet = async (id: number): Promise<void> => {
    await this.repository.deleteTagSet(id);
    await this.loadState();
  };

  /**
   * IDからキャッシュ上のタグセットを取得する。
   */
  public getTagSetById(id: number): TagSetRecord | undefined {
    return this._state.find((set) => set.id === id);
  }

  hostConnected(): void {}

  hostDisconnected(): void {}
}
