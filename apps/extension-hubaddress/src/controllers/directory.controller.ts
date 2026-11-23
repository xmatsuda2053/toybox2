import type { ReactiveController, ReactiveControllerHost } from "lit";
import { directoryDb } from "../db/directory-db";
import type {
  ActiveTab,
  OrganizationRecord,
  StaffRecord,
  ThemeMode,
} from "../models/directory.model";
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
  filterOrganizations,
  filterStaff,
  getStaffKey,
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
  staffSearchQuery = "";
  organizationSearchQuery = "";
  expandedStaffKeys = new Set<string>();
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
      const [staff, organizations, themeMode] = await Promise.all([
        directoryDb.getAllStaff(),
        directoryDb.getAllOrganizations(),
        loadTheme(this.deps.storage),
      ]);
      this.staff = staff;
      this.organizations = organizations;
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

  get filteredStaff(): StaffRecord[] {
    return filterStaff(this.staff, this.staffSearchQuery);
  }

  get filteredOrganizations(): OrganizationRecord[] {
    return filterOrganizations(
      this.organizations,
      this.organizationSearchQuery,
    );
  }

  setActiveTab(tab: ActiveTab): void {
    this.activeTab = tab;
    this.host.requestUpdate();
  }

  setStaffSearchQuery(query: string): void {
    this.staffSearchQuery = query;
    this.host.requestUpdate();
  }

  setOrganizationSearchQuery(query: string): void {
    this.organizationSearchQuery = query;
    this.host.requestUpdate();
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
   * 職員カードでクリックされた所属文字列を組織タブの検索欄にセットして遷移する
   */
  jumpToOrganization(department: string): void {
    const trimmed = department.trim();
    if (trimmed.length === 0) {
      return;
    }

    this.activeTab = "organizations";
    this.organizationSearchQuery = trimmed;
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
