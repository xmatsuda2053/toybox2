import type { ReactiveController, ReactiveControllerHost } from "lit";
import { directoryDb } from "../db/directory-db";
import type {
  ActiveTab,
  OrganizationRecord,
  StaffRecord,
  ThemeMode,
} from "../models/directory.model";
import {
  loadFavorites,
  saveFavorites,
  type StorageAreaLike,
} from "../storage/favorites-storage";
import {
  applyThemeToRoot,
  loadTheme,
  saveTheme,
} from "../storage/theme-storage";
import {
  copyTextToClipboard,
  type ClipboardLike,
} from "../utils/clipboard.utils";
import {
  serializeOrganizationCsv,
  serializeStaffCsv,
} from "../utils/csv-codec";
import {
  extractUniqueDepartments,
  filterOrganizations,
  filterStaff,
  findMatchingOrganization,
  getOrganizationFavoriteKey,
  getStaffFavoriteKey,
} from "../utils/directory-filter.utils";
import {
  normalizeOrganizationInput,
  normalizeStaffInput,
  validateOrganizationInput,
  validateStaffInput,
} from "../utils/directory-validation.utils";
import { encodeUtf8WithBom } from "../utils/encoding.utils";
import {
  prepareImportPreview,
  type ImportKind,
  type ImportPreview,
} from "../utils/import-preview.utils";
import { serializeDirectoryJson } from "../utils/json-codec";

export interface DirectoryControllerDeps {
  storage?: StorageAreaLike;
  clipboard?: ClipboardLike;
}

/**
 * HubAddress Side Panel の状態管理・CRUD・入出力・テーマ管理コントローラー
 */
export class DirectoryController implements ReactiveController {
  private readonly host: ReactiveControllerHost;
  private readonly deps: DirectoryControllerDeps;
  private toastTimerId: ReturnType<typeof setTimeout> | undefined;
  private mediaQuery: MediaQueryList | undefined;
  private readonly handleSystemThemeChange = (): void => {
    if (this.themeMode === "system") {
      applyThemeToRoot("system");
    }
  };

  staff: StaffRecord[] = [];
  organizations: OrganizationRecord[] = [];
  activeTab: ActiveTab = "staff";
  searchQuery = "";
  selectedDepartment = "";
  favoritesOnly = false;
  favoriteStaffKeys = new Set<string>();
  favoriteOrganizationKeys = new Set<string>();
  highlightedOrganizationKey: string | null = null;
  toastMessage: string | null = null;
  themeMode: ThemeMode = "system";
  pendingImport: ImportPreview | null = null;
  isLoading = false;

  constructor(
    host: ReactiveControllerHost,
    deps: DirectoryControllerDeps = {},
  ) {
    this.host = host;
    this.deps = deps;
    this.host.addController(this);
  }

  hostConnected(): void {
    this.attachThemeListener();
    void this.loadInitialData();
  }

  hostDisconnected(): void {
    if (this.toastTimerId !== undefined) {
      clearTimeout(this.toastTimerId);
    }
    this.mediaQuery?.removeEventListener(
      "change",
      this.handleSystemThemeChange,
    );
  }

  private attachThemeListener(): void {
    if (
      typeof globalThis.window === "undefined" ||
      typeof globalThis.window.matchMedia !== "function"
    ) {
      return;
    }
    this.mediaQuery = globalThis.window.matchMedia(
      "(prefers-color-scheme: dark)",
    );
    this.mediaQuery.addEventListener("change", this.handleSystemThemeChange);
  }

  /**
   * IndexedDB とローカルストレージから初期データを読み込む
   */
  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    this.host.requestUpdate();

    try {
      const [staff, organizations, favorites, themeMode] = await Promise.all([
        directoryDb.getAllStaff(),
        directoryDb.getAllOrganizations(),
        loadFavorites(this.deps.storage),
        loadTheme(this.deps.storage),
      ]);
      this.staff = staff;
      this.organizations = organizations;
      this.favoriteStaffKeys = new Set(favorites.staffKeys);
      this.favoriteOrganizationKeys = new Set(favorites.organizationKeys);
      this.themeMode = themeMode;
      applyThemeToRoot(themeMode);
    } finally {
      this.isLoading = false;
      this.host.requestUpdate();
    }
  }

  private async reloadRecords(): Promise<void> {
    const [staff, organizations] = await Promise.all([
      directoryDb.getAllStaff(),
      directoryDb.getAllOrganizations(),
    ]);
    this.staff = staff;
    this.organizations = organizations;
    this.host.requestUpdate();
  }

  get departments(): string[] {
    return extractUniqueDepartments(this.staff, this.organizations);
  }

  get filteredStaff(): StaffRecord[] {
    return filterStaff(this.staff, {
      query: this.searchQuery,
      department: this.selectedDepartment,
      favoritesOnly: this.favoritesOnly,
      favoriteKeys: this.favoriteStaffKeys,
    });
  }

  get filteredOrganizations(): OrganizationRecord[] {
    return filterOrganizations(this.organizations, {
      query: this.searchQuery,
      department: this.selectedDepartment,
      favoritesOnly: this.favoritesOnly,
      favoriteKeys: this.favoriteOrganizationKeys,
    });
  }

  setActiveTab(tab: ActiveTab): void {
    this.activeTab = tab;
    this.host.requestUpdate();
  }

  setSearchQuery(query: string): void {
    this.searchQuery = query;
    this.host.requestUpdate();
  }

  setSelectedDepartment(department: string): void {
    this.selectedDepartment = department;
    this.host.requestUpdate();
  }

  setFavoritesOnly(enabled: boolean): void {
    this.favoritesOnly = enabled;
    this.host.requestUpdate();
  }

  clearFilters(): void {
    this.searchQuery = "";
    this.selectedDepartment = "";
    this.favoritesOnly = false;
    this.host.requestUpdate();
  }

  private async toggleFavoriteKey(
    targetSet: Set<string>,
    key: string,
  ): Promise<void> {
    if (targetSet.has(key)) {
      targetSet.delete(key);
    } else {
      targetSet.add(key);
    }

    await saveFavorites(
      {
        staffKeys: [...this.favoriteStaffKeys],
        organizationKeys: [...this.favoriteOrganizationKeys],
      },
      this.deps.storage,
    );
    this.host.requestUpdate();
  }

  async toggleStaffFavorite(staff: StaffRecord): Promise<void> {
    await this.toggleFavoriteKey(
      this.favoriteStaffKeys,
      getStaffFavoriteKey(staff),
    );
  }

  async toggleOrganizationFavorite(org: OrganizationRecord): Promise<void> {
    await this.toggleFavoriteKey(
      this.favoriteOrganizationKeys,
      getOrganizationFavoriteKey(org),
    );
  }

  /**
   * 職員レコードを追加または更新する
   */
  async saveStaff(
    input: Omit<StaffRecord, "id">,
    editingId?: number,
  ): Promise<void> {
    const errors = validateStaffInput(input);
    if (errors.length > 0) {
      throw new Error(errors.join(" "));
    }

    const normalized = normalizeStaffInput(input);
    if (typeof editingId === "number") {
      await directoryDb.updateStaff(editingId, normalized);
      this.showToast(`職員「${normalized.name}」を更新しました`);
    } else {
      await directoryDb.addStaff(normalized);
      this.showToast(`職員「${normalized.name}」を追加しました`);
    }
    await this.reloadRecords();
  }

  /**
   * 職員レコードを削除する
   */
  async removeStaff(id: number): Promise<void> {
    await directoryDb.deleteStaff(id);
    await this.reloadRecords();
    this.showToast("職員レコードを削除しました");
  }

  /**
   * 組織レコードを追加または更新する
   */
  async saveOrganization(
    input: Omit<OrganizationRecord, "id">,
    editingId?: number,
  ): Promise<void> {
    const errors = validateOrganizationInput(input);
    if (errors.length > 0) {
      throw new Error(errors.join(" "));
    }

    const normalized = normalizeOrganizationInput(input);
    if (typeof editingId === "number") {
      await directoryDb.updateOrganization(editingId, normalized);
      this.showToast(`組織「${normalized.department}」を更新しました`);
    } else {
      await directoryDb.addOrganization(normalized);
      this.showToast(`組織「${normalized.department}」を追加しました`);
    }
    await this.reloadRecords();
  }

  /**
   * 組織レコードを削除する
   */
  async removeOrganization(id: number): Promise<void> {
    await directoryDb.deleteOrganization(id);
    await this.reloadRecords();
    this.showToast("組織レコードを削除しました");
  }

  /**
   * インポートファイルを解析し確認ダイアログ用プレビューを準備する
   */
  prepareImport(kind: ImportKind, fileName: string, bytes: Uint8Array): void {
    this.pendingImport = prepareImportPreview(fileName, bytes, kind, {
      staff: this.staff.length,
      organizations: this.organizations.length,
    });
    this.host.requestUpdate();
  }

  cancelImport(): void {
    this.pendingImport = null;
    this.host.requestUpdate();
  }

  /**
   * プレビュー中のインポートを確定して全件洗い替えを実行する
   */
  async confirmImport(): Promise<void> {
    const preview = this.pendingImport;
    if (!preview) {
      return;
    }

    if (preview.kind === "staff-csv" && preview.staffRecords) {
      await directoryDb.bulkReplaceStaff(preview.staffRecords);
      this.showToast(`職員データを ${preview.staffCount} 件インポートしました`);
    } else if (preview.kind === "org-csv" && preview.organizationRecords) {
      await directoryDb.bulkReplaceOrganizations(preview.organizationRecords);
      this.showToast(
        `組織データを ${preview.organizationCount} 件インポートしました`,
      );
    } else if (preview.kind === "json") {
      await directoryDb.bulkReplaceAll(
        preview.staffRecords ?? [],
        preview.organizationRecords ?? [],
      );
      this.showToast(
        `JSON（職員 ${preview.staffCount} 件・組織 ${preview.organizationCount} 件）をインポートしました`,
      );
    }

    this.pendingImport = null;
    await this.reloadRecords();
  }

  exportStaffCsvBytes(): { filename: string; bytes: Uint8Array } {
    const csv = serializeStaffCsv(this.staff);
    return {
      filename: "hubaddress-staff.csv",
      bytes: encodeUtf8WithBom(csv),
    };
  }

  exportOrganizationCsvBytes(): { filename: string; bytes: Uint8Array } {
    const csv = serializeOrganizationCsv(this.organizations);
    return {
      filename: "hubaddress-organizations.csv",
      bytes: encodeUtf8WithBom(csv),
    };
  }

  exportDirectoryJsonText(): { filename: string; text: string } {
    return {
      filename: "hubaddress-directory.json",
      text: serializeDirectoryJson(this.staff, this.organizations),
    };
  }

  async clearAllDirectoryData(): Promise<void> {
    await directoryDb.clearAll();
    await this.reloadRecords();
    this.showToast("すべての職員・組織データを削除しました");
  }

  async setThemeMode(mode: ThemeMode): Promise<void> {
    this.themeMode = mode;
    applyThemeToRoot(mode);
    await saveTheme(mode, this.deps.storage);
    this.host.requestUpdate();
  }

  /**
   * 職員の所属から一致する組織を検索し、組織ビューへジャンプ・ハイライトする
   */
  jumpToOrganization(department: string): boolean {
    const matched = findMatchingOrganization(this.organizations, department);
    if (!matched) {
      this.showToast(`「${department}」に該当する組織が見つかりませんでした。`);
      return false;
    }

    this.activeTab = "organizations";
    this.searchQuery = "";
    this.selectedDepartment = "";
    this.favoritesOnly = false;
    this.highlightedOrganizationKey = getOrganizationFavoriteKey(matched);
    this.showToast(`組織「${matched.department}」を表示しました`);
    return true;
  }

  clearHighlight(): void {
    this.highlightedOrganizationKey = null;
    this.host.requestUpdate();
  }

  /**
   * 指定フィールドの値をクリップボードへコピーし通知メッセージを表示する
   */
  async copyField(label: string, value: string): Promise<boolean> {
    const copied = await copyTextToClipboard(value, this.deps.clipboard);
    if (copied) {
      this.showToast(`${label}をコピーしました: ${value.trim()}`);
    } else {
      this.showToast(`${label}のコピーに失敗しました`);
    }
    return copied;
  }

  showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimerId !== undefined) {
      clearTimeout(this.toastTimerId);
    }
    this.toastTimerId = setTimeout(() => {
      this.toastMessage = null;
      this.host.requestUpdate();
    }, 2600);
    this.host.requestUpdate();
  }
}
