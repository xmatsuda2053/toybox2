import type { Table, UpdateSpec } from "dexie";

/**
 * 単一Dexieテーブルに対する基本CRUD操作を提供する基底リポジトリ
 *
 * @export
 * @class BaseRepository
 * @template TRecord レコード型（id?: number を持つこと）
 */
export class BaseRepository<TRecord extends { id?: number }> {
  /**
   * コンストラクタ
   * @param {Table<TRecord, number>} table Dexieテーブルインスタンス
   */
  constructor(protected readonly table: Table<TRecord, number>) {}

  /**
   * DBからすべてのレコードを取得する
   *
   * @return {*} {Promise<TRecord[]>}
   * @memberof BaseRepository
   */
  public getAll = async (): Promise<TRecord[]> => {
    return await this.table.toArray();
  };

  /**
   * 指定したIDのレコードを取得する
   *
   * @param {number} id
   * @return {*} {Promise<TRecord | undefined>}
   * @memberof BaseRepository
   */
  public getById = async (id: number): Promise<TRecord | undefined> => {
    return await this.table.get(id);
  };

  /**
   * 新規レコードを追加する
   *
   * @param {Omit<TRecord, "id">} data
   * @return {*} {Promise<number>} 自動採番されたレコードID
   * @memberof BaseRepository
   */
  public add = async (data: Omit<TRecord, "id">): Promise<number> => {
    return (await this.table.add({ ...data } as unknown as TRecord)) as number;
  };

  /**
   * 指定したIDのレコードを部分更新する
   *
   * @param {number} id
   * @param {Partial<Omit<TRecord, "id">>} partial
   * @return {*} {Promise<void>}
   * @memberof BaseRepository
   */
  public update = async (
    id: number,
    partial: Partial<Omit<TRecord, "id">>,
  ): Promise<void> => {
    await this.table.update(id, partial as unknown as UpdateSpec<TRecord>);
  };

  /**
   * 指定したIDのレコードを削除する
   *
   * @param {number} id
   * @return {*} {Promise<void>}
   * @memberof BaseRepository
   */
  public delete = async (id: number): Promise<void> => {
    await this.table.delete(id);
  };
}
