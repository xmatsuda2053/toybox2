import Dexie, { type Table } from "dexie";
import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";

/**
 * HubAddress 用 IndexedDB（Dexie.js）データベース定義
 */
export class DirectoryDatabase extends Dexie {
  staff!: Table<StaffRecord, number>;
  organizations!: Table<OrganizationRecord, number>;

  constructor() {
    super("HubAddressDirectoryDB");
    this.version(1).stores({
      staff: "++id, staffId, name, department",
      organizations: "++id, department, extensionNumber, phoneNumber",
    });
  }

  /**
   * 登録済み職員を全件取得する
   */
  async getAllStaff(): Promise<StaffRecord[]> {
    return this.staff.toArray();
  }

  /**
   * 登録済み組織を全件取得する
   */
  async getAllOrganizations(): Promise<OrganizationRecord[]> {
    return this.organizations.toArray();
  }

  /**
   * 職員レコードを1件追加する
   */
  async addStaff(record: Omit<StaffRecord, "id">): Promise<number> {
    return this.staff.add(record);
  }

  /**
   * 職員レコードを1件更新する
   */
  async updateStaff(
    id: number,
    changes: Partial<Omit<StaffRecord, "id">>,
  ): Promise<number> {
    return this.staff.update(id, changes);
  }

  /**
   * 職員レコードを1件削除する
   */
  async deleteStaff(id: number): Promise<void> {
    return this.staff.delete(id);
  }

  /**
   * 組織レコードを1件追加する
   */
  async addOrganization(
    record: Omit<OrganizationRecord, "id">,
  ): Promise<number> {
    return this.organizations.add(record);
  }

  /**
   * 組織レコードを1件更新する
   */
  async updateOrganization(
    id: number,
    changes: Partial<Omit<OrganizationRecord, "id">>,
  ): Promise<number> {
    return this.organizations.update(id, changes);
  }

  /**
   * 組織レコードを1件削除する
   */
  async deleteOrganization(id: number): Promise<void> {
    return this.organizations.delete(id);
  }

  /**
   * 職員データを全件洗い替えする（単一トランザクション）
   */
  async bulkReplaceStaff(records: Omit<StaffRecord, "id">[]): Promise<void> {
    await this.transaction("rw", this.staff, async () => {
      await this.staff.clear();
      if (records.length > 0) {
        await this.staff.bulkAdd(records);
      }
    });
  }

  /**
   * 組織データを全件洗い替えする（単一トランザクション）
   */
  async bulkReplaceOrganizations(
    records: Omit<OrganizationRecord, "id">[],
  ): Promise<void> {
    await this.transaction("rw", this.organizations, async () => {
      await this.organizations.clear();
      if (records.length > 0) {
        await this.organizations.bulkAdd(records);
      }
    });
  }

  /**
   * 職員・組織データを一括で全件洗い替えする（単一トランザクション）
   */
  async bulkReplaceAll(
    staffRecords: Omit<StaffRecord, "id">[],
    organizationRecords: Omit<OrganizationRecord, "id">[],
  ): Promise<void> {
    await this.transaction("rw", this.staff, this.organizations, async () => {
      await this.staff.clear();
      await this.organizations.clear();
      if (staffRecords.length > 0) {
        await this.staff.bulkAdd(staffRecords);
      }
      if (organizationRecords.length > 0) {
        await this.organizations.bulkAdd(organizationRecords);
      }
    });
  }

  /**
   * 職員・組織の全テーブルデータをクリアする
   */
  async clearAll(): Promise<void> {
    await this.transaction("rw", this.staff, this.organizations, async () => {
      await this.staff.clear();
      await this.organizations.clear();
    });
  }
}

export const directoryDb = new DirectoryDatabase();
