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
 * - 仕様8: 読み込みおよび登録後に職員（所属組織・フリガナ順）と組織（デフォルト登録順・id昇順）がソートされて保持されること
 * - 仕様9: staffSortMode をストレージから復元でき、setStaffSortMode での即時並替・永続化および再読み込み後のソート維持ができること
 * - 仕様10: filteredStaff / filteredOrganizations がメモ化され、同一条件下では同一配列参照を返すこと
 * - 仕様11: scheduleStaffSearchQuery / scheduleOrganizationSearchQuery で検索フィルタ適用がデバウンスされ、連続入力時に最後の入力のみ反映されること
 * - 仕様12: saveStaff / removeStaff では組織テーブルを再取得せず、saveOrganization / removeOrganization では職員テーブルを再取得しないこと
 * - 仕様13: organizationSortMode のデフォルトが registered であり、setOrganizationSortMode で即時並替・永続化・復元および追加後の並び順維持ができること
 * - 仕様14: copyStaffRecord / copyOrganizationRecord で1件を labeled / tsv 形式でコピーでき、copyFilteredStaff / copyFilteredOrganizations で表示中（フィルタ・ソート適用後）の全データを見出し付きTSVでコピーできること
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

  it("loadInitialData と save 後に職員は所属・フリガナ五十音昇順、組織は登録順（id昇順）で保持されること", async () => {
    const controller = new DirectoryController(createMockHost(), {
      storage: createMemoryStorage(),
    });
    await controller.loadInitialData();

    // beforeEach では 0010001(総務部 総務課) が先、0020001(営業推進部 第一営業課) が後で登録されている
    expect(controller.staff.map((s) => s.staffId)).toEqual([
      "0020001",
      "0010001",
    ]);
    expect(controller.organizations.map((o) => o.department)).toEqual([
      "総務部 総務課",
      "営業推進部 第一営業課",
    ]);

    await controller.saveStaff({
      staffId: "0010002",
      name: "青木 次郎",
      furigana: "あおき じろう",
      department: "総務部 総務課",
      title: "",
      emails: [],
    });
    await controller.saveStaff({
      staffId: "0010003",
      name: "田中 花子",
      furigana: "たなか はなこ",
      department: "総務部 総務課",
      title: "",
      emails: [],
    });
    expect(controller.staff.map((s) => s.staffId)).toEqual([
      "0020001",
      "0010002",
      "0010003",
      "0010001",
    ]);
  });

  it("setStaffSortMode で即時ソート・永続化され、再起動後やレコード更新後も選択中の並び順が維持されること", async () => {
    const storage = createMemoryStorage();
    const controller = new DirectoryController(createMockHost(), { storage });
    await controller.loadInitialData();

    expect(controller.staffSortMode).toBe("department");

    await controller.setStaffSortMode("staffId");
    expect(controller.staffSortMode).toBe("staffId");
    // beforeEach データ: "0010001" < "0020001"
    expect(controller.staff.map((s) => s.staffId)).toEqual([
      "0010001",
      "0020001",
    ]);

    // 別インスタンスでストレージからソート順を復元できること
    const restoredController = new DirectoryController(createMockHost(), {
      storage,
    });
    await restoredController.loadInitialData();
    expect(restoredController.staffSortMode).toBe("staffId");
    expect(restoredController.staff.map((s) => s.staffId)).toEqual([
      "0010001",
      "0020001",
    ]);

    // 名前順へ切り替え後、新規職員保存しても名前順が維持されること
    await restoredController.setStaffSortMode("name");
    await restoredController.saveStaff({
      staffId: "0030001",
      name: "青木 花子",
      furigana: "あおき はなこ",
      department: "総務部 総務課",
      title: "",
      emails: [],
    });
    expect(restoredController.staff.map((s) => s.staffId)).toEqual([
      "0030001",
      "0010001",
      "0020001",
    ]);
  });

  it("filteredStaff / filteredOrganizations がメモ化され、同一条件では同一配列参照を返すこと", async () => {
    const controller = new DirectoryController(createMockHost(), {
      storage: createMemoryStorage(),
    });
    await controller.loadInitialData();

    controller.setStaffSearchQuery("田中");
    const firstStaff = controller.filteredStaff;
    const secondStaff = controller.filteredStaff;
    expect(firstStaff).toBe(secondStaff);

    controller.setOrganizationSearchQuery("2101");
    const firstOrgs = controller.filteredOrganizations;
    const secondOrgs = controller.filteredOrganizations;
    expect(firstOrgs).toBe(secondOrgs);

    controller.setStaffSearchQuery("鈴木");
    expect(controller.filteredStaff).not.toBe(firstStaff);
    expect(controller.filteredStaff.map((s) => s.staffId)).toEqual(["0020001"]);
  });

  it("scheduleStaffSearchQuery / scheduleOrganizationSearchQuery がデバウンスされ連続入力の末尾のみ反映すること", async () => {
    const host = createMockHost();
    const controller = new DirectoryController(host, {
      storage: createMemoryStorage(),
    });
    await controller.loadInitialData();
    host.requestUpdate.mockClear();

    vi.useFakeTimers();
    try {
      controller.scheduleStaffSearchQuery("田", 150);
      controller.scheduleStaffSearchQuery("田中", 150);
      expect(controller.staffSearchQuery).toBe("田中");
      // デバウンス完了前はフィルタ再描画が走らないこと
      expect(host.requestUpdate).not.toHaveBeenCalled();

      vi.advanceTimersByTime(150);
      expect(host.requestUpdate).toHaveBeenCalledTimes(1);
      expect(controller.filteredStaff.map((s) => s.staffId)).toEqual([
        "0010001",
      ]);

      host.requestUpdate.mockClear();
      controller.scheduleOrganizationSearchQuery("3201", 150);
      // 即時クリア（setOrganizationSearchQuery("")）で保留タイマーがキャンセルされること
      controller.setOrganizationSearchQuery("");
      expect(host.requestUpdate).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(200);
      expect(host.requestUpdate).toHaveBeenCalledTimes(1);
      expect(controller.filteredOrganizations).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("saveStaff / removeStaff では組織を再取得せず、saveOrganization / removeOrganization では職員を再取得しないこと", async () => {
    const controller = new DirectoryController(createMockHost(), {
      storage: createMemoryStorage(),
    });
    await controller.loadInitialData();

    const staffSpy = vi.spyOn(directoryDb, "getAllStaff");
    const orgSpy = vi.spyOn(directoryDb, "getAllOrganizations");

    await controller.saveStaff({
      staffId: "0090001",
      name: "新規 職員",
      department: "総務課",
      title: "",
      emails: [],
    });
    expect(staffSpy).toHaveBeenCalledTimes(1);
    expect(orgSpy).not.toHaveBeenCalled();

    const addedStaffId = controller.staff.find(
      (s) => s.staffId === "0090001",
    )!.id!;
    await controller.removeStaff(addedStaffId);
    expect(staffSpy).toHaveBeenCalledTimes(2);
    expect(orgSpy).not.toHaveBeenCalled();

    staffSpy.mockClear();
    orgSpy.mockClear();

    await controller.saveOrganization({
      department: "新規課",
      extra: "",
      location: "",
      title: "",
      extensionNumber: "9999",
      phoneNumber: "",
      faxNumber: "",
      notes: "",
    });
    expect(orgSpy).toHaveBeenCalledTimes(1);
    expect(staffSpy).not.toHaveBeenCalled();

    const addedOrgId = controller.organizations.find(
      (o) => o.department === "新規課",
    )!.id!;
    await controller.removeOrganization(addedOrgId);
    expect(orgSpy).toHaveBeenCalledTimes(2);
    expect(staffSpy).not.toHaveBeenCalled();

    staffSpy.mockRestore();
    orgSpy.mockRestore();
  });

  it("setOrganizationSortMode で即時ソート・永続化され、再起動後やレコード追加後も選択中の並び順が維持されること", async () => {
    const storage = createMemoryStorage();
    const controller = new DirectoryController(createMockHost(), { storage });
    await controller.loadInitialData();

    expect(controller.organizationSortMode).toBe("registered");
    expect(controller.organizations.map((o) => o.department)).toEqual([
      "総務部 総務課",
      "営業推進部 第一営業課",
    ]);

    await controller.setOrganizationSortMode("department");
    expect(controller.organizationSortMode).toBe("department");
    expect(controller.organizations.map((o) => o.department)).toEqual([
      "営業推進部 第一営業課",
      "総務部 総務課",
    ]);

    // 別インスタンスでストレージからソート順を復元できること
    const restoredController = new DirectoryController(createMockHost(), {
      storage,
    });
    await restoredController.loadInitialData();
    expect(restoredController.organizationSortMode).toBe("department");
    expect(restoredController.organizations.map((o) => o.department)).toEqual([
      "営業推進部 第一営業課",
      "総務部 総務課",
    ]);

    // 場所順へ切り替え後、新規組織追加しても場所順が維持されること（1F-A < 2F-E1 < 3F-A）
    await restoredController.setOrganizationSortMode("location");
    await restoredController.saveOrganization({
      department: "人事部 採用課",
      extra: "別館 1階",
      location: "1F-A",
      title: "",
      extensionNumber: "1001",
      phoneNumber: "",
      faxNumber: "",
      notes: "",
    });
    expect(restoredController.organizations.map((o) => o.location)).toEqual([
      "1F-A",
      "2F-E1",
      "3F-A",
    ]);
  });

  it("copyStaffRecord / copyOrganizationRecord で1件をラベル付き・見出し付きTSVでコピーしトースト通知すること", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const controller = new DirectoryController(createMockHost(), {
      storage: createMemoryStorage(),
      clipboard: { writeText },
    });
    await controller.loadInitialData();

    const staff = controller.staff.find((s) => s.staffId === "0010001")!;
    expect(await controller.copyStaffRecord(staff, "labeled")).toBe(true);
    expect(writeText).toHaveBeenLastCalledWith(
      expect.stringContaining("職員番号: 0010001\n氏名: 田中 太郎"),
    );
    expect(controller.toastMessage).toContain("コピー");

    expect(await controller.copyStaffRecord(staff, "tsv")).toBe(true);
    expect(writeText).toHaveBeenLastCalledWith(
      "職員番号\t氏名\tフリガナ\t所属\t役職\tメールアドレス\n0010001\t田中 太郎\t\t総務部 総務課\t課長\ttanaka@example.com",
    );

    const org = controller.organizations[0];
    expect(await controller.copyOrganizationRecord(org, "labeled")).toBe(true);
    expect(writeText).toHaveBeenLastCalledWith(
      expect.stringContaining("所属: 総務部 総務課\n場所: 3F-A"),
    );

    expect(await controller.copyOrganizationRecord(org, "tsv")).toBe(true);
    expect(writeText).toHaveBeenLastCalledWith(
      "所属\t場所\tその他\t役職\t内線番号\t外線番号\tFAX番号\t備考\n総務部 総務課\t3F-A\t本庁舎 3階\t課長席\t2101\t03-1234-2101\t03-1234-2109\t代表窓口",
    );
  });

  it("copyFilteredStaff / copyFilteredOrganizations でフィルタ・ソート適用後の表示中データのみを見出し付きTSVでコピーすること", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const controller = new DirectoryController(createMockHost(), {
      storage: createMemoryStorage(),
      clipboard: { writeText },
    });
    await controller.loadInitialData();

    // 職員: フィルタなし（デフォルト順: 営業推進部 -> 総務部）
    expect(await controller.copyFilteredStaff()).toBe(true);
    expect(writeText.mock.calls[0][0].split("\n")).toHaveLength(3);
    expect(controller.toastMessage).toContain("2 件");

    // 職員: 検索フィルタ適用後は絞り込み結果のみコピー
    controller.setStaffSearchQuery("田中");
    expect(await controller.copyFilteredStaff()).toBe(true);
    expect(writeText.mock.calls[1][0]).toBe(
      "職員番号\t氏名\tフリガナ\t所属\t役職\tメールアドレス\n0010001\t田中 太郎\t\t総務部 総務課\t課長\ttanaka@example.com",
    );
    expect(controller.toastMessage).toContain("1 件");

    // 組織: 検索フィルタ適用後は絞り込み結果のみコピー（末尾空列タブ保持）
    controller.setOrganizationSearchQuery("営業推進部");
    expect(await controller.copyFilteredOrganizations()).toBe(true);
    expect(writeText.mock.calls[2][0]).toBe(
      "所属\t場所\tその他\t役職\t内線番号\t外線番号\tFAX番号\t備考\n営業推進部 第一営業課\t2F-E1\t新館 2階\t\t3201\t03-1234-3201\t\t",
    );

    // 0件時はコピーせず false を返すこと
    controller.setStaffSearchQuery("存在しない職員名");
    expect(await controller.copyFilteredStaff()).toBe(false);
    expect(writeText).toHaveBeenCalledTimes(3);
  });
});
