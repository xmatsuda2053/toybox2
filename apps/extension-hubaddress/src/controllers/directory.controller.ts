import type { ReactiveController, ReactiveControllerHost } from "lit";
import { directoryDb } from "../db/directory-db";
import type {
  ActiveTab,
  OrganizationRecord,
  OrganizationSortMode,
  StaffRecord,
  StaffSortMode,
  ThemeMode,
} from "../models/directory.model";
import {
  loadOrganizationSortMode,
  loadStaffSortMode,
  saveOrganizationSortMode,
  saveStaffSortMode,
} from "../storage/sort-storage";
import {
  applyThemeToRoot,
  loadTheme,
  saveTheme,
  type StorageAreaLike,
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
  buildOrganizationSearchIndex,
  buildStaffSearchIndex,
  filterIndexedOrganizations,
  filterIndexedStaff,
  getStaffKey,
  sortOrganizations,
  sortStaff,
  type IndexedSearchItem,
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

interface FilterCache<T> {
  readonly source: readonly T[];
  readonly query: string;
  readonly result: T[];
}

const DEFAULT_SEARCH_DEBOUNCE_MS = 150;

/**
 * HubAddress Side Panel の状態管理・CRUD・入出力・テーマ管理コントローラー
 */
export class DirectoryController implements ReactiveController {
  private readonly host: ReactiveControllerHost;
  private readonly deps: DirectoryControllerDeps;
  private toastTimerId: ReturnType<typeof setTimeout> | undefined;
  private staffSearchTimerId: ReturnType<typeof setTimeout> | undefined;
  private organizationSearchTimerId: ReturnType<typeof setTimeout> | undefined;
  private mediaQuery: MediaQueryList | undefined;
  private indexedStaff: IndexedSearchItem<StaffRecord>[] = [];
  private indexedOrganizations: IndexedSearchItem<OrganizationRecord>[] = [];
  private appliedStaffSearchQuery = "";
  private appliedOrganizationSearchQuery = "";
  private staffFilterCache: FilterCache<StaffRecord> | null = null;
  private organizationFilterCache: FilterCache<OrganizationRecord> | null =
    null;

  private readonly handleSystemThemeChange = (): void => {
    if (this.themeMode === "system") {
      applyThemeToRoot("system");
    }
  };

  staff: StaffRecord[] = [];
  organizations: OrganizationRecord[] = [];
  activeTab: ActiveTab = "staff";
  private lastDirectoryTab: "staff" | "organizations" = "staff";
  staffSearchQuery = "";
  organizationSearchQuery = "";
  expandedStaffKeys = new Set<string>();
  expandedStaffVersion = 0;
  toastMessage: string | null = null;
  themeMode: ThemeMode = "system";
  staffSortMode: StaffSortMode = "department";
  organizationSortMode: OrganizationSortMode = "registered";
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
    this.clearStaffSearchTimer();
    this.clearOrganizationSearchTimer();
    this.mediaQuery?.removeEventListener(
      "change",
      this.handleSystemThemeChange,
    );
  }

  private clearStaffSearchTimer(): void {
    if (this.staffSearchTimerId !== undefined) {
      clearTimeout(this.staffSearchTimerId);
      this.staffSearchTimerId = undefined;
    }
  }

  private clearOrganizationSearchTimer(): void {
    if (this.organizationSearchTimerId !== undefined) {
      clearTimeout(this.organizationSearchTimerId);
      this.organizationSearchTimerId = undefined;
    }
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

  private updateStaffStore(records: StaffRecord[]): void {
    const sorted = sortStaff(records, this.staffSortMode);
    this.staff = sorted;
    this.indexedStaff = buildStaffSearchIndex(sorted);
    this.staffFilterCache = null;
  }

  private updateOrganizationStore(records: OrganizationRecord[]): void {
    const sorted = sortOrganizations(records, this.organizationSortMode);
    this.organizations = sorted;
    this.indexedOrganizations = buildOrganizationSearchIndex(sorted);
    this.organizationFilterCache = null;
  }

  /**
   * IndexedDB とローカルストレージから初期データを読み込む
   */
  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    this.host.requestUpdate();

    try {
      const [
        staff,
        organizations,
        themeMode,
        staffSortMode,
        organizationSortMode,
      ] = await Promise.all([
        directoryDb.getAllStaff(),
        directoryDb.getAllOrganizations(),
        loadTheme(this.deps.storage),
        loadStaffSortMode(this.deps.storage),
        loadOrganizationSortMode(this.deps.storage),
      ]);
      this.staffSortMode = staffSortMode;
      this.organizationSortMode = organizationSortMode;
      this.updateStaffStore(staff);
      this.updateOrganizationStore(organizations);
      this.themeMode = themeMode;
      applyThemeToRoot(themeMode);
    } finally {
      this.isLoading = false;
      this.host.requestUpdate();
    }
  }

  private async reloadStaffRecords(): Promise<void> {
    const staff = await directoryDb.getAllStaff();
    this.updateStaffStore(staff);
    this.host.requestUpdate();
  }

  private async reloadOrganizationRecords(): Promise<void> {
    const organizations = await directoryDb.getAllOrganizations();
    this.updateOrganizationStore(organizations);
    this.host.requestUpdate();
  }

  private async reloadRecords(): Promise<void> {
    const [staff, organizations] = await Promise.all([
      directoryDb.getAllStaff(),
      directoryDb.getAllOrganizations(),
    ]);
    this.updateStaffStore(staff);
    this.updateOrganizationStore(organizations);
    this.host.requestUpdate();
  }

  get filteredStaff(): StaffRecord[] {
    const cache = this.staffFilterCache;
    if (
      cache &&
      cache.source === this.staff &&
      cache.query === this.appliedStaffSearchQuery
    ) {
      return cache.result;
    }

    const result =
      this.appliedStaffSearchQuery.trim().length === 0
        ? this.staff
        : filterIndexedStaff(this.indexedStaff, this.appliedStaffSearchQuery);
    this.staffFilterCache = {
      source: this.staff,
      query: this.appliedStaffSearchQuery,
      result,
    };
    return result;
  }

  get filteredOrganizations(): OrganizationRecord[] {
    const cache = this.organizationFilterCache;
    if (
      cache &&
      cache.source === this.organizations &&
      cache.query === this.appliedOrganizationSearchQuery
    ) {
      return cache.result;
    }

    const result =
      this.appliedOrganizationSearchQuery.trim().length === 0
        ? this.organizations
        : filterIndexedOrganizations(
            this.indexedOrganizations,
            this.appliedOrganizationSearchQuery,
          );
    this.organizationFilterCache = {
      source: this.organizations,
      query: this.appliedOrganizationSearchQuery,
      result,
    };
    return result;
  }

  setActiveTab(tab: ActiveTab): void {
    if (tab !== "settings") {
      this.lastDirectoryTab = tab;
    }
    this.activeTab = tab;
    this.host.requestUpdate();
  }

  toggleSettingsTab(): void {
    if (this.activeTab === "settings") {
      this.activeTab = this.lastDirectoryTab;
    } else {
      this.lastDirectoryTab = this.activeTab;
      this.activeTab = "settings";
    }
    this.host.requestUpdate();
  }

  setStaffSearchQuery(query: string): void {
    this.clearStaffSearchTimer();
    this.staffSearchQuery = query;
    this.appliedStaffSearchQuery = query;
    this.staffFilterCache = null;
    this.host.requestUpdate();
  }

  scheduleStaffSearchQuery(
    query: string,
    delayMs = DEFAULT_SEARCH_DEBOUNCE_MS,
  ): void {
    this.staffSearchQuery = query;
    this.clearStaffSearchTimer();
    this.staffSearchTimerId = setTimeout(() => {
      this.staffSearchTimerId = undefined;
      this.appliedStaffSearchQuery = query;
      this.staffFilterCache = null;
      this.host.requestUpdate();
    }, delayMs);
  }

  setOrganizationSearchQuery(query: string): void {
    this.clearOrganizationSearchTimer();
    this.organizationSearchQuery = query;
    this.appliedOrganizationSearchQuery = query;
    this.organizationFilterCache = null;
    this.host.requestUpdate();
  }

  scheduleOrganizationSearchQuery(
    query: string,
    delayMs = DEFAULT_SEARCH_DEBOUNCE_MS,
  ): void {
    this.organizationSearchQuery = query;
    this.clearOrganizationSearchTimer();
    this.organizationSearchTimerId = setTimeout(() => {
      this.organizationSearchTimerId = undefined;
      this.appliedOrganizationSearchQuery = query;
      this.organizationFilterCache = null;
      this.host.requestUpdate();
    }, delayMs);
  }

  isStaffEmailsExpanded(staff: StaffRecord): boolean {
    return this.expandedStaffKeys.has(getStaffKey(staff));
  }

  toggleStaffEmails(staff: StaffRecord): void {
    const key = getStaffKey(staff);
    if (this.expandedStaffKeys.has(key)) {
      this.expandedStaffKeys.delete(key);
    } else {
      this.expandedStaffKeys.add(key);
    }
    this.expandedStaffVersion += 1;
    this.host.requestUpdate();
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
    await this.reloadStaffRecords();
  }

  /**
   * 職員レコードを削除する
   */
  async removeStaff(id: number): Promise<void> {
    await directoryDb.deleteStaff(id);
    await this.reloadStaffRecords();
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
    await this.reloadOrganizationRecords();
  }

  /**
   * 組織レコードを削除する
   */
  async removeOrganization(id: number): Promise<void> {
    await directoryDb.deleteOrganization(id);
    await this.reloadOrganizationRecords();
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

    this.pendingImport = null;
    if (preview.kind === "staff-csv" && preview.staffRecords) {
      await directoryDb.bulkReplaceStaff(preview.staffRecords);
      this.showToast(`職員データを ${preview.staffCount} 件インポートしました`);
      await this.reloadStaffRecords();
    } else if (preview.kind === "org-csv" && preview.organizationRecords) {
      await directoryDb.bulkReplaceOrganizations(preview.organizationRecords);
      this.showToast(
        `組織データを ${preview.organizationCount} 件インポートしました`,
      );
      await this.reloadOrganizationRecords();
    } else if (preview.kind === "json") {
      await directoryDb.bulkReplaceAll(
        preview.staffRecords ?? [],
        preview.organizationRecords ?? [],
      );
      this.showToast(
        `JSON（職員 ${preview.staffCount} 件・組織 ${preview.organizationCount} 件）をインポートしました`,
      );
      await this.reloadRecords();
    }
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

  /**
   * テーマ変更を即時適用・再描画し、ストレージへ永続化する（2フレーム点滅防止）
   */
  async setThemeMode(mode: ThemeMode): Promise<void> {
    this.themeMode = mode;
    applyThemeToRoot(mode);
    this.host.requestUpdate();
    await saveTheme(mode, this.deps.storage);
  }

  /**
   * 職員一覧のソート順を切り替え、即時再並替とストレージ保存を行う
   */
  async setStaffSortMode(mode: StaffSortMode): Promise<void> {
    this.staffSortMode = mode;
    this.updateStaffStore(this.staff);
    this.host.requestUpdate();
    await saveStaffSortMode(mode, this.deps.storage);
  }

  /**
   * 組織一覧のソート順を切り替え、即時再並替とストレージ保存を行う
   */
  async setOrganizationSortMode(mode: OrganizationSortMode): Promise<void> {
    this.organizationSortMode = mode;
    this.updateOrganizationStore(this.organizations);
    this.host.requestUpdate();
    await saveOrganizationSortMode(mode, this.deps.storage);
  }

  /**
   * 職員カードでクリックされた所属文字列を組織タブの検索欄にセットして遷移する
   */
  jumpToOrganization(department: string): void {
    const trimmed = department.trim();
    if (trimmed.length === 0) {
      return;
    }

    this.clearOrganizationSearchTimer();
    this.lastDirectoryTab = "organizations";
    this.activeTab = "organizations";
    this.organizationSearchQuery = trimmed;
    this.appliedOrganizationSearchQuery = trimmed;
    this.organizationFilterCache = null;
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
