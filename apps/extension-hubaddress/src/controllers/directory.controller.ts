import type { ReactiveController, ReactiveControllerHost } from "lit";
import { directoryDb } from "../db/directory-db";
import type {
  ActiveTab,
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";
import {
  loadFavorites,
  saveFavorites,
  type StorageAreaLike,
} from "../storage/favorites-storage";
import {
  copyTextToClipboard,
  type ClipboardLike,
} from "../utils/clipboard.utils";
import {
  extractUniqueDepartments,
  filterOrganizations,
  filterStaff,
  findMatchingOrganization,
  getOrganizationFavoriteKey,
  getStaffFavoriteKey,
} from "../utils/directory-filter.utils";

export interface DirectoryControllerDeps {
  storage?: StorageAreaLike;
  clipboard?: ClipboardLike;
}

/**
 * HubAddress Side Panel の検索・フィルタ・お気に入り・組織ジャンプ・コピー状態管理コントローラー
 */
export class DirectoryController implements ReactiveController {
  private readonly host: ReactiveControllerHost;
  private readonly deps: DirectoryControllerDeps;
  private toastTimerId: ReturnType<typeof setTimeout> | undefined;

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
    void this.loadInitialData();
  }

  hostDisconnected(): void {
    if (this.toastTimerId !== undefined) {
      clearTimeout(this.toastTimerId);
    }
  }

  /**
   * IndexedDB とローカルストレージから初期データを読み込む
   */
  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    this.host.requestUpdate();

    try {
      const [staff, organizations, favorites] = await Promise.all([
        directoryDb.getAllStaff(),
        directoryDb.getAllOrganizations(),
        loadFavorites(this.deps.storage),
      ]);
      this.staff = staff;
      this.organizations = organizations;
      this.favoriteStaffKeys = new Set(favorites.staffKeys);
      this.favoriteOrganizationKeys = new Set(favorites.organizationKeys);
    } finally {
      this.isLoading = false;
      this.host.requestUpdate();
    }
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
