import { db } from "@/db/schema/database.schema";
import type { QuickAccessRecord } from "@/db/models/navigation.model";
import {
  QUICK_ACCESS_STATIC_ID,
  DEFAULT_QUICK_ACCESS,
} from "@/constants/quick-access.constants";

/**
 * QuickAccessに対するCRUDおよび状態を制御するリポジトリ
 *
 * @export
 * @class QuickAccessRepository
 */
export class QuickAccessRepository {
  /**
   * QuickAccessからレコードを取得する。
   * データが存在しない場合は、初期データを登録する。
   *
   * @return {*} {Promise<QuickAccessRecord>}
   * @memberof QuickAccessRepository
   */
  public getQuickAccess = async (): Promise<QuickAccessRecord> => {
    const record = await db.quickAccess.get(QUICK_ACCESS_STATIC_ID);

    if (record) {
      return record;
    }

    const initialRecord: QuickAccessRecord = {
      id: QUICK_ACCESS_STATIC_ID,
      ...DEFAULT_QUICK_ACCESS,
    };

    await db.quickAccess.add(initialRecord);
    return initialRecord;
  };

  /**
   * QuickAccess の選択状態を更新する。
   * 指定したプロパティのみをマージし、id: 1 を維持して上書き保存（put）する。
   *
   * @param {Partial<Omit<QuickAccessRecord, "id">>} partial
   * @return {*} {Promise<QuickAccessRecord>}
   * @memberof QuickAccessRepository
   */
  public updateQuickAccess = async (
    partial: Partial<Omit<QuickAccessRecord, "id">>,
  ): Promise<QuickAccessRecord> => {
    const currentRecord = await this.getQuickAccess();
    const updatedRecord = {
      id: QUICK_ACCESS_STATIC_ID,
      ...currentRecord,
      ...partial,
    };

    await db.quickAccess.put(updatedRecord);
    return updatedRecord;
  };
}
