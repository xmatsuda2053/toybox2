import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { directoryDb } from "./directory-db";
import { StaffRecord, OrganizationRecord } from "../models/directory.model";

/**
 * データベース層（Dexie.js）テスト仕様
 *
 * - 仕様1: staff テーブルに職員レコードを追加・一括取得できること
 * - 仕様2: organizations テーブルに組織レコードを追加・一括取得できること
 * - 仕様3: bulkInsertStaff で一括登録（洗い替え）できること
 * - 仕様4: bulkInsertOrganizations で一括登録（洗い替え）できること
 * - 仕様5: clearAll で職員および組織テーブルの全データをクリアできること
 */
describe("DirectoryDatabase Tests", () => {
  beforeEach(async () => {
    await directoryDb.delete();
    await directoryDb.open();
  });

  it("staff テーブルに職員レコードを追加・一括取得できること", async () => {
    const staff: StaffRecord = {
      staffId: "0012345",
      name: "田中 太郎",
      department: "営業一部",
      title: "課長",
      emails: ["tanaka@example.com"],
    };

    const id = await directoryDb.staff.add(staff);
    expect(id).toBeDefined();

    const result = await directoryDb.getAllStaff();
    expect(result).toHaveLength(1);
    expect(result[0].staffId).toBe("0012345");
    expect(result[0].name).toBe("田中 太郎");
  });

  it("organizations テーブルに組織レコードを追加・一括取得できること", async () => {
    const org: OrganizationRecord = {
      department: "総務部 総務課",
      extra: "本庁舎 3階",
      location: "3F-A",
      title: "課長席",
      extensionNumber: "2101",
      phoneNumber: "03-1234-5678",
      faxNumber: "03-1234-5679",
      notes: "代表窓口",
    };

    const id = await directoryDb.organizations.add(org);
    expect(id).toBeDefined();

    const result = await directoryDb.getAllOrganizations();
    expect(result).toHaveLength(1);
    expect(result[0].department).toBe("総務部 総務課");
    expect(result[0].extensionNumber).toBe("2101");
  });

  it("bulkInsertStaff で一括登録（洗い替え）できること", async () => {
    // 既存データを1件投入
    await directoryDb.staff.add({
      staffId: "9999999",
      name: "旧 太郎",
      department: "旧部",
      title: "旧役職",
      emails: [],
    });

    const newStaffList: StaffRecord[] = [
      {
        staffId: "0012345",
        name: "田中 太郎",
        department: "営業一部",
        title: "課長",
        emails: ["tanaka@example.com"],
      },
      {
        staffId: "0012346",
        name: "佐藤 花子",
        department: "人事部",
        title: "主査",
        emails: ["sato@example.com", "sub-sato@example.com"],
      },
    ];

    await directoryDb.bulkInsertStaff(newStaffList);

    const result = await directoryDb.getAllStaff();
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.staffId)).toEqual(["0012345", "0012346"]);
  });

  it("bulkInsertOrganizations で一括登録（洗い替え）できること", async () => {
    // 既存データを1件投入
    await directoryDb.organizations.add({
      department: "旧部",
      extra: "",
      location: "",
      title: "",
      extensionNumber: "0000",
      phoneNumber: "",
      faxNumber: "",
      notes: "",
    });

    const newOrgList: OrganizationRecord[] = [
      {
        department: "営業部",
        extra: "新館",
        location: "2F",
        title: "",
        extensionNumber: "3001",
        phoneNumber: "03-0000-0001",
        faxNumber: "",
        notes: "",
      },
    ];

    await directoryDb.bulkInsertOrganizations(newOrgList);

    const result = await directoryDb.getAllOrganizations();
    expect(result).toHaveLength(1);
    expect(result[0].department).toBe("営業部");
  });

  it("clearAll で職員および組織テーブルの全データをクリアできること", async () => {
    await directoryDb.staff.add({
      staffId: "001",
      name: "テスト",
      department: "テスト",
      title: "",
      emails: [],
    });
    await directoryDb.organizations.add({
      department: "テスト課",
      extra: "",
      location: "",
      title: "",
      extensionNumber: "111",
      phoneNumber: "",
      faxNumber: "",
      notes: "",
    });

    await directoryDb.clearAll();

    const staffList = await directoryDb.getAllStaff();
    const orgList = await directoryDb.getAllOrganizations();
    expect(staffList).toHaveLength(0);
    expect(orgList).toHaveLength(0);
  });
});

