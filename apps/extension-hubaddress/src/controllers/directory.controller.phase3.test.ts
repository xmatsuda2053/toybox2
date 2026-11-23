import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import type { ReactiveControllerHost } from "lit";
import { directoryDb } from "../db/directory-db";
import { DirectoryController } from "./directory.controller";
import type { StorageAreaLike } from "../storage/favorites-storage";

function createMockHost(): ReactiveControllerHost & {
  requestUpdate: ReturnType<typeof vi.fn<() => void>>;
} {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn<() => void>(),
    updateComplete: Promise.resolve(true),
  };
}

function createMemoryStorage(): StorageAreaLike {
  const store: Record<string, unknown> = {};
  return {
    get: vi.fn(async (key: string) => ({ [key]: store[key] })),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(store, items);
    }),
  };
}

/**
 * テスト仕様: DirectoryController Phase 3 機能（GUI CRUD / インポート・エクスポート / テーマ）
 *
 * - 仕様1: saveStaff / removeStaff で職員を追加・更新・削除し IndexedDB と一覧へ反映できること
 * - 仕様2: saveOrganization / removeOrganization で組織を追加・更新・削除し IndexedDB と一覧へ反映できること
 * - 仕様3: prepareImport -> confirmImport で確認後に洗い替えインポートが実行され、cancelImport で中断できること
 * - 仕様4: exportStaffCsvBytes / exportOrganizationCsvBytes / exportDirectoryJsonText でエクスポートデータを生成できること
 * - 仕様5: setThemeMode でテーマ変更と永続化が行われること
 */
describe("DirectoryController Phase 3 Tests", () => {
  beforeEach(async () => {
    await directoryDb.delete();
    await directoryDb.open();
  });

  it("saveStaff / removeStaff で職員レコードを GUI 経由で追加・編集・削除できること", async () => {
    const controller = new DirectoryController(createMockHost(), {
      storage: createMemoryStorage(),
    });
    await controller.loadInitialData();

    await controller.saveStaff({
      staffId: "001",
      name: "田中 太郎",
      department: "総務課",
      title: "課長",
      emails: ["tanaka@example.com"],
    });
    expect(controller.staff).toHaveLength(1);
    const createdId = controller.staff[0].id!;

    await controller.saveStaff(
      {
        staffId: "001",
        name: "田中 太郎",
        department: "人事課",
        title: "部長",
        emails: ["tanaka@example.com"],
      },
      createdId,
    );
    expect(controller.staff[0].department).toBe("人事課");
    expect(controller.staff[0].title).toBe("部長");

    await controller.removeStaff(createdId);
    expect(controller.staff).toHaveLength(0);
  });

  it("saveOrganization / removeOrganization で組織レコードを GUI 経由で追加・編集・削除できること", async () => {
    const controller = new DirectoryController(createMockHost(), {
      storage: createMemoryStorage(),
    });
    await controller.loadInitialData();

    await controller.saveOrganization({
      department: "総務課",
      extra: "本庁舎",
      location: "3F",
      title: "",
      extensionNumber: "2101",
      phoneNumber: "03-1234-2101",
      faxNumber: "",
      notes: "",
    });
    expect(controller.organizations).toHaveLength(1);
    const createdId = controller.organizations[0].id!;

    await controller.saveOrganization(
      {
        department: "総務課",
        extra: "新館",
        location: "4F",
        title: "",
        extensionNumber: "2199",
        phoneNumber: "03-1234-2101",
        faxNumber: "",
        notes: "移転",
      },
      createdId,
    );
    expect(controller.organizations[0].extensionNumber).toBe("2199");

    await controller.removeOrganization(createdId);
    expect(controller.organizations).toHaveLength(0);
  });

  it("prepareImport -> confirmImport で洗い替えインポートが実行され、cancelImport でキャンセルできること", async () => {
    const controller = new DirectoryController(createMockHost(), {
      storage: createMemoryStorage(),
    });
    await controller.loadInitialData();

    const csv = `職員番号,氏名,所属,役職,メールアドレス\n001,佐藤 花子,人事課,主査,sato@example.com`;
    controller.prepareImport(
      "staff-csv",
      "staff.csv",
      new TextEncoder().encode(csv),
    );
    expect(controller.pendingImport?.staffCount).toBe(1);

    controller.cancelImport();
    expect(controller.pendingImport).toBeNull();
    expect(controller.staff).toHaveLength(0);

    controller.prepareImport(
      "staff-csv",
      "staff.csv",
      new TextEncoder().encode(csv),
    );
    await controller.confirmImport();
    expect(controller.pendingImport).toBeNull();
    expect(controller.staff).toHaveLength(1);
    expect(controller.staff[0].name).toBe("佐藤 花子");
  });

  it("エクスポート用データ（BOM付きCSVバイト列とJSON文字列）および clearAllDirectoryData が動作すること", async () => {
    const controller = new DirectoryController(createMockHost(), {
      storage: createMemoryStorage(),
    });
    await controller.saveStaff({
      staffId: "001",
      name: "鈴木 一郎",
      department: "営業課",
      title: "",
      emails: ["suzuki@example.com"],
    });
    await controller.saveOrganization({
      department: "営業課",
      extra: "",
      location: "",
      title: "",
      extensionNumber: "3001",
      phoneNumber: "",
      faxNumber: "",
      notes: "",
    });

    const staffCsv = controller.exportStaffCsvBytes();
    expect(staffCsv.bytes.slice(0, 3)).toEqual(
      new Uint8Array([0xef, 0xbb, 0xbf]),
    );
    expect(new TextDecoder().decode(staffCsv.bytes)).toContain("鈴木 一郎");

    const orgCsv = controller.exportOrganizationCsvBytes();
    expect(new TextDecoder().decode(orgCsv.bytes)).toContain("営業課");

    const json = controller.exportDirectoryJsonText();
    expect(json.text).toContain("鈴木 一郎");
    expect(json.text).toContain("3001");

    await controller.clearAllDirectoryData();
    expect(controller.staff).toHaveLength(0);
    expect(controller.organizations).toHaveLength(0);
  });

  it("setThemeMode でテーマ設定が更新・永続化されること", async () => {
    const storage = createMemoryStorage();
    const controller = new DirectoryController(createMockHost(), { storage });

    await controller.setThemeMode("dark");
    expect(controller.themeMode).toBe("dark");
    expect(storage.set).toHaveBeenCalled();
  });
});
