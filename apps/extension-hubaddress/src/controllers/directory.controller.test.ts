import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import type { ReactiveControllerHost } from "lit";
import { directoryDb } from "../db/directory-db";
import { DirectoryController } from "./directory.controller";
import type { StorageAreaLike } from "../storage/theme-storage";

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
 * テスト仕様: DirectoryController (directory.controller.ts)
 *
 * - 仕様1: loadInitialData で IndexedDB の職員・組織データとテーマ設定を読み込みホストへ通知すること
 * - 仕様2: 検索クエリ・所属フィルタに応じて filteredStaff / filteredOrganizations が更新されること
 * - 仕様3: jumpToOrganization で該当組織があれば organizations タブへ切替・ハイライトキー設定し true を返すこと
 * - 仕様4: copyField でクリップボードコピー成功時にトースト通知メッセージを設定すること
 * - 仕様5: お気に入り関連のプロパティやメソッドが存在しないこと
 */
describe("DirectoryController Tests", () => {
  beforeEach(async () => {
    await directoryDb.delete();
    await directoryDb.open();
    await directoryDb.bulkReplaceAll(
      [
        {
          staffId: "0010001",
          name: "田中 太郎",
          department: "総務部 総務課",
          title: "課長",
          emails: ["tanaka@example.com"],
        },
        {
          staffId: "0020001",
          name: "鈴木 一郎",
          department: "営業推進部 第一営業課",
          title: "係長",
          emails: ["suzuki@example.com"],
        },
      ],
      [
        {
          department: "総務部 総務課",
          extra: "本庁舎 3階",
          location: "3F-A",
          title: "課長席",
          extensionNumber: "2101",
          phoneNumber: "03-1234-2101",
          faxNumber: "03-1234-2109",
          notes: "代表窓口",
        },
        {
          department: "営業推進部 第一営業課",
          extra: "新館 2階",
          location: "2F-E1",
          title: "",
          extensionNumber: "3201",
          phoneNumber: "03-1234-3201",
          faxNumber: "",
          notes: "",
        },
      ],
    );
  });

  it("loadInitialData で職員・組織とテーマを読み込めること", async () => {
    const host = createMockHost();
    const storage = createMemoryStorage();
    const controller = new DirectoryController(host, {
      storage,
      clipboard: { writeText: vi.fn().mockResolvedValue(true) },
    });

    await controller.loadInitialData();

    expect(controller.staff).toHaveLength(2);
    expect(controller.organizations).toHaveLength(2);
    expect(controller.departments).toEqual([
      "営業推進部 第一営業課",
      "総務部 総務課",
    ]);
    expect(host.requestUpdate).toHaveBeenCalled();
  });

  it("検索クエリ・所属フィルタで一覧を絞り込めること", async () => {
    const host = createMockHost();
    const storage = createMemoryStorage();
    const controller = new DirectoryController(host, { storage });
    await controller.loadInitialData();

    controller.setSearchQuery("鈴木");
    expect(controller.filteredStaff.map((s) => s.staffId)).toEqual(["0020001"]);

    controller.setSearchQuery("");
    controller.setSelectedDepartment("総務部 総務課");
    expect(controller.filteredStaff.map((s) => s.staffId)).toEqual(["0010001"]);
    expect(controller.filteredOrganizations.map((o) => o.department)).toEqual([
      "総務部 総務課",
    ]);
  });

  it("jumpToOrganization で対象組織タブへ遷移しハイライトキーを設定すること", async () => {
    const host = createMockHost();
    const storage = createMemoryStorage();
    const controller = new DirectoryController(host, { storage });
    await controller.loadInitialData();

    controller.setSearchQuery("田中");
    controller.setSelectedDepartment("営業推進部 第一営業課");

    const jumped = controller.jumpToOrganization("総務部 総務課");
    expect(jumped).toBe(true);
    expect(controller.activeTab).toBe("organizations");
    expect(controller.searchQuery).toBe("");
    expect(controller.selectedDepartment).toBe("");
    expect(controller.highlightedOrganizationKey).toBe(
      "org:総務部 総務課::課長席",
    );

    const missing = controller.jumpToOrganization("未登録部署");
    expect(missing).toBe(false);
    expect(controller.toastMessage).toContain("見つかりませんでした");
  });

  it("copyField でコピー成功時に通知メッセージを設定すること", async () => {
    const host = createMockHost();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const controller = new DirectoryController(host, {
      storage: createMemoryStorage(),
      clipboard: { writeText },
    });

    const ok = await controller.copyField("内線番号", "2101");
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith("2101");
    expect(controller.toastMessage).toContain("内線番号");
    expect(controller.toastMessage).toContain("2101");
  });

  it("お気に入り関連のプロパティやメソッドが除去されていること", () => {
    const controller = new DirectoryController(createMockHost(), {
      storage: createMemoryStorage(),
    });
    expect("favoritesOnly" in controller).toBe(false);
    expect("favoriteStaffKeys" in controller).toBe(false);
    expect("favoriteOrganizationKeys" in controller).toBe(false);
    expect("toggleStaffFavorite" in controller).toBe(false);
    expect("toggleOrganizationFavorite" in controller).toBe(false);
  });
});
