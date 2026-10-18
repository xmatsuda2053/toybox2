import type { ReactiveControllerHost } from "lit";
import type { ScratchRepository } from "@/repositories/scratch.repository";
import type { ScratchRecord } from "@/db/models/scratch.model";
import { BaseDataController } from "./base-reactive.controller";

/**
 * スクラッチ（アプリ共通メモ）の状態管理およびCRUD操作を提供する Reactive Controller
 *
 * @export
 * @class ScratchController
 * @extends {BaseDataController<ScratchRepository, ReadonlyArray<ScratchRecord>>}
 */
export class ScratchController extends BaseDataController<
  ScratchRepository,
  ReadonlyArray<ScratchRecord>
> {
  /**
   * コンストラクタ
   * @param {ReactiveControllerHost} host コントローラーを保持するホスト
   * @param {ScratchRepository} repository スクラッチリポジトリ
   */
  constructor(host: ReactiveControllerHost, repository: ScratchRepository) {
    super(host, repository, []);
  }

  /**
   * スクラッチ一覧をリポジトリから再取得し、変更を全購読者へ通知する。
   *
   * @protected
   * @return {*} {Promise<void>}
   * @memberof ScratchController
   */
  protected async loadState(): Promise<void> {
    const records = await this.repository.getAll();
    this._state = [...records];
    this.notify();
  }

  /**
   * 新規スクラッチメモを作成する。
   *
   * @public
   * @param {Omit<ScratchRecord, "id">} data
   * @return {*} {Promise<number | undefined>}
   * @memberof ScratchController
   */
  public createNote = async (
    data: Omit<ScratchRecord, "id">,
  ): Promise<number | undefined> => {
    const now = new Date();
    const itemData = {
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    const newId = await this.repository.add(itemData);
    await this.loadState();
    return newId;
  };

  /**
   * スクラッチメモを更新する。
   *
   * @public
   * @param {number} id
   * @param {Partial<Omit<ScratchRecord, "id">>} data
   * @return {*} {Promise<void>}
   * @memberof ScratchController
   */
  public updateNote = async (
    id: number,
    data: Partial<Omit<ScratchRecord, "id">>,
  ): Promise<void> => {
    const updateData = {
      updatedAt: new Date(),
      ...data,
    };
    await this.repository.update(id, updateData);
    await this.loadState();
  };

  /**
   * スクラッチメモを削除する。
   *
   * @public
   * @param {number} id
   * @return {*} {Promise<void>}
   * @memberof ScratchController
   */
  public deleteNote = async (id: number): Promise<void> => {
    await this.repository.delete(id);
    await this.loadState();
  };
}
