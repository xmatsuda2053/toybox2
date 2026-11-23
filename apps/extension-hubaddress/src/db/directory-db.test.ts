import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { directoryDb } from "./directory-db";
import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";

/**
 * データベース層（Dexie.js）テスト仕様
 *
 * - 仕様1: addStaff / getAllStaff / updateStaff / deleteStaff で職員レコードの CRUD ができること
 * - 仕様2: addOrganization / getAllOrganizations / updateOrganization / deleteOrganization で組織レコードの CRUD ができること
 * - 仕様3: bulkReplaceStaff で職員データを全件洗い替えできること（組織データには影響しないこと）
 * - 仕様4: bulkReplaceOrganizations で組織データを全件洗い替えできること（職員データには影響しないこと）
 * - 仕様5: bulkReplaceAll で職員および組織データを一括洗い替えできること
 * - 仕様6: clearAll で職員および組織テーブルの全データをクリアできること
 */
describe("DirectoryDatabase Tests", () => {
  beforeEach(async () => {
    await directoryDb.delete();
    await directoryDb.open();
  });

  it("addStaff / getAllStaff / updateStaff / deleteStaff で職員レコードの CRUD ができること", async () => {
    const staff: Omit<StaffRecord, "id"> = {
      staffId: "0012345",
      name: "田中 太郎",
      department: "営業一部",
      title: "課長",
      emails: ["tanaka@example.com"],
    };

    const id = await directoryDb.addStaff(staff);
    expect(id).toBeTypeOf("number");

    const afterAdd = await directoryDb.getAllStaff();
    expect(afterAdd).toHaveLength(1);
    expect(afterAdd[0]).toMatchObject(staff);

    await directoryDb.updateStaff(id, {
      title: "部長",
      department: "営業本部",
    });
    const afterUpdate = await directoryDb.getAllStaff();
    expect(afterUpdate[0].title).toBe("部長");
    expect(afterUpdate[0].department).toBe("営業本部");

    await directoryDb.deleteStaff(id);
    const afterDelete = await directoryDb.getAllStaff();
    expect(afterDelete).toHaveLength(0);
  });

  it("addOrganization / getAllOrganizations / updateOrganization / deleteOrganization で組織レコードの CRUD ができること", async () => {
    const org: Omit<OrganizationRecord, "id"> = {
      department: "総務部 総務課",
      extra: "本庁舎 3階",
      location: "3F-A",
      title: "課長席",
      extensionNumber: "2101",
      phoneNumber: "03-1234-5678",
      faxNumber: "03-1234-5679",
      notes: "代表窓口",
    };

    const id = await directoryDb.addOrganization(org);
    expect(id).toBeTypeOf("number");

    const afterAdd = await directoryDb.getAllOrganizations();
    expect(afterAdd).toHaveLength(1);
    expect(afterAdd[0]).toMatchObject(org);

    await directoryDb.updateOrganization(id, {
      extensionNumber: "2199",
      notes: "移転予定",
    });
    const afterUpdate = await directoryDb.getAllOrganizations();
    expect(afterUpdate[0].extensionNumber).toBe("2199");
    expect(afterUpdate[0].notes).toBe("移転予定");

    await directoryDb.deleteOrganization(id);
    const afterDelete = await directoryDb.getAllOrganizations();
    expect(afterDelete).toHaveLength(0);
  });

  it("bulkReplaceStaff で職員データを全件洗い替えできること（組織データには影響しないこと）", async () => {
    await directoryDb.addStaff({
      staffId: "9999999",
      name: "旧 太郎",
      department: "旧部",
      title: "旧役職",
      emails: [],
    });
    await directoryDb.addOrganization({
      department: "維持される組織",
      extra: "",
      location: "",
      title: "",
      extensionNumber: "1000",
      phoneNumber: "",
      faxNumber: "",
      notes: "",
    });

    const newStaffList: Omit<StaffRecord, "id">[] = [
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

    await directoryDb.bulkReplaceStaff(newStaffList);

    const staffList = await directoryDb.getAllStaff();
    const orgList = await directoryDb.getAllOrganizations();
    expect(staffList).toHaveLength(2);
    expect(staffList.map((s) => s.staffId)).toEqual(["0012345", "0012346"]);
    expect(orgList).toHaveLength(1);
    expect(orgList[0].department).toBe("維持される組織");
  });

  it("bulkReplaceOrganizations で組織データを全件洗い替えできること（職員データには影響しないこと）", async () => {
    await directoryDb.addStaff({
      staffId: "0010001",
      name: "維持される職員",
      department: "総務部",
      title: "",
      emails: [],
    });
    await directoryDb.addOrganization({
      department: "旧部",
      extra: "",
      location: "",
      title: "",
      extensionNumber: "0000",
      phoneNumber: "",
      faxNumber: "",
      notes: "",
    });

    const newOrgList: Omit<OrganizationRecord, "id">[] = [
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

    await directoryDb.bulkReplaceOrganizations(newOrgList);

    const staffList = await directoryDb.getAllStaff();
    const orgList = await directoryDb.getAllOrganizations();
    expect(orgList).toHaveLength(1);
    expect(orgList[0].department).toBe("営業部");
    expect(staffList).toHaveLength(1);
    expect(staffList[0].staffId).toBe("0010001");
  });

  it("bulkReplaceAll で職員および組織データを一括洗い替えできること", async () => {
    await directoryDb.addStaff({
      staffId: "999",
      name: "旧職員",
      department: "旧課",
      title: "",
      emails: [],
    });
    await directoryDb.addOrganization({
      department: "旧組織",
      extra: "",
      location: "",
      title: "",
      extensionNumber: "9999",
      phoneNumber: "",
      faxNumber: "",
      notes: "",
    });

    await directoryDb.bulkReplaceAll(
      [
        {
          staffId: "001",
          name: "新 職員",
          department: "新課",
          title: "担当",
          emails: ["new@example.com"],
        },
      ],
      [
        {
          department: "新課",
          extra: "2F",
          location: "A-1",
          title: "",
          extensionNumber: "2001",
          phoneNumber: "03-1111-2222",
          faxNumber: "",
          notes: "",
        },
      ],
    );

    const staffList = await directoryDb.getAllStaff();
    const orgList = await directoryDb.getAllOrganizations();
    expect(staffList).toHaveLength(1);
    expect(staffList[0].staffId).toBe("001");
    expect(orgList).toHaveLength(1);
    expect(orgList[0].department).toBe("新課");
  });

  it("clearAll で職員および組織テーブルの全データをクリアできること", async () => {
    await directoryDb.addStaff({
      staffId: "001",
      name: "テスト",
      department: "テスト",
      title: "",
      emails: [],
    });
    await directoryDb.addOrganization({
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

    expect(await directoryDb.getAllStaff()).toHaveLength(0);
    expect(await directoryDb.getAllOrganizations()).toHaveLength(0);
  });
});
