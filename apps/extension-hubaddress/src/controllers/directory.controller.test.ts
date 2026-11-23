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
 * - 仕様2: 職員と組織それぞれ独立した検索語（staffSearchQuery / organizationSearchQuery）で絞り込めること
 * - 仕様3: jumpToOrganization で組織タブへ遷移し、クリックした所属を organizationSearchQuery にセットすること（staffSearchQuery は維持）
 * - 仕様4: toggleStaffEmails / isStaffEmailsExpanded で職員メールアドレス欄の開閉状態を切り替えられること
 * - 仕様5: setThemeMode でストレージ保存完了を待たず同期的に requestUpdate が呼ばれること（点滅防止）
 * - 仕様6: copyField でクリップボードコピー成功時にトースト通知メッセージを設定すること
 * - 仕様7: toggleSettingsTab で設定画面を開き、再クリックで直前の一覧画面（staff / organizations）へ戻ること
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
    expect(host.requestUpdate).toHaveBeenCalled();
  });

  it("職員と組織それぞれ独立した検索語で一覧を絞り込めること", async () => {
    const host = createMockHost();
    const controller = new DirectoryController(host, {
      storage: createMemoryStorage(),
    });
    await controller.loadInitialData();

    controller.setStaffSearchQuery("鈴木");
    expect(controller.filteredStaff.map((s) => s.staffId)).toEqual(["0020001"]);
    expect(controller.filteredOrganizations).toHaveLength(2);

    controller.setOrganizationSearchQuery("2101");
    expect(controller.filteredOrganizations.map((o) => o.department)).toEqual([
      "総務部 総務課",
    ]);
    expect(controller.filteredStaff.map((s) => s.staffId)).toEqual(["0020001"]);
  });

  it("jumpToOrganization で組織タブへ遷移し、組織の検索欄へ所属文字列をセットすること", async () => {
    const host = createMockHost();
    const controller = new DirectoryController(host, {
      storage: createMemoryStorage(),
    });
    await controller.loadInitialData();

    controller.setStaffSearchQuery("田中");
    controller.jumpToOrganization("総務部 総務課");

    expect(controller.activeTab).toBe("organizations");
    expect(controller.organizationSearchQuery).toBe("総務部 総務課");
    expect(controller.staffSearchQuery).toBe("田中");
    expect(controller.filteredOrganizations.map((o) => o.department)).toEqual([
      "総務部 総務課",
    ]);
  });

  it("toggleStaffEmails / isStaffEmailsExpanded でメール表示の開閉を制御できること", async () => {
    const host = createMockHost();
    const controller = new DirectoryController(host, {
      storage: createMemoryStorage(),
    });
    await controller.loadInitialData();

    const target = controller.staff[0];
    expect(controller.isStaffEmailsExpanded(target)).toBe(false);

    controller.toggleStaffEmails(target);
    expect(controller.isStaffEmailsExpanded(target)).toBe(true);

    controller.toggleStaffEmails(target);
    expect(controller.isStaffEmailsExpanded(target)).toBe(false);
  });

  it("setThemeMode で保存完了を待たず同期的にホスト更新を呼ぶこと", () => {
    const host = createMockHost();
    const pendingStorage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn(() => new Promise<void>(() => {})),
    };
    const controller = new DirectoryController(host, {
      storage: pendingStorage,
    });

    void controller.setThemeMode("dark");
    expect(controller.themeMode).toBe("dark");
    expect(host.requestUpdate).toHaveBeenCalledTimes(1);
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

  it("toggleSettingsTab で設定画面を開閉し、再クリック時に直前の一覧タブへ戻ること", () => {
    const host = createMockHost();
    const controller = new DirectoryController(host, {
      storage: createMemoryStorage(),
    });

    expect(controller.activeTab).toBe("staff");
    controller.toggleSettingsTab();
    expect(controller.activeTab).toBe("settings");

    controller.toggleSettingsTab();
    expect(controller.activeTab).toBe("staff");

    controller.setActiveTab("organizations");
    controller.toggleSettingsTab();
    expect(controller.activeTab).toBe("settings");

    controller.toggleSettingsTab();
    expect(controller.activeTab).toBe("organizations");
  });
});
