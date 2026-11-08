import Dexie, { Table } from "dexie";
import { StaffRecord, OrganizationRecord } from "../models/directory.model";

/**
 * 職員・組織ディレクトリ用の IndexedDB データベース定義
 */
export class DirectoryDatabase extends Dexie {
  /** 職員テーブル */
  staff!: Table<StaffRecord, number>;

  /** 組織テーブル */
  organizations!: Table<OrganizationRecord, number>;

  constructor() {
    super("ExtensionHubAccessDB");
    this.version(1).stores({
      staff: "++id, staffId, name, department, title",
      organizations: "++id, department, location, extensionNumber, phoneNumber",
    });
  }

  /**
   * 登録済みの全職員レコードを取得する
   */
  async getAllStaff(): Promise<StaffRecord[]> {
    return this.staff.toArray();
  }

  /**
   * 登録済みの全組織レコードを取得する
   */
  async getAllOrganizations(): Promise<OrganizationRecord[]> {
    return this.organizations.toArray();
  }

  /**
   * 職員レコードを一括登録（既存データを洗い替えて再登録）する
   */
  async bulkInsertStaff(records: StaffRecord[]): Promise<void> {
    await this.transaction("rw", this.staff, async () => {
      await this.staff.clear();
      if (records.length > 0) {
        await this.staff.bulkAdd(records);
      }
    });
  }

  /**
   * 組織レコードを一括登録（既存データを洗い替えて再登録）する
   */
  async bulkInsertOrganizations(records: OrganizationRecord[]): Promise<void> {
    await this.transaction("rw", this.organizations, async () => {
      await this.organizations.clear();
      if (records.length > 0) {
        await this.organizations.bulkAdd(records);
      }
    });
  }

  /**
   * 全テーブルのデータを完全に消去する
   */
  async clearAll(): Promise<void> {
    await this.transaction("rw", [this.staff, this.organizations], async () => {
      await this.staff.clear();
      await this.organizations.clear();
    });
  }
}

/** データベースのシングルトンインスタンス */
export const directoryDb = new DirectoryDatabase();

