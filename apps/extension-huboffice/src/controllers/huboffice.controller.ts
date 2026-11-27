import type { ReactiveController, ReactiveControllerHost } from "lit";
import type {
  ActiveView,
  ThemeMode,
  ToolDefinition,
} from "../models/huboffice.model";
import { TOOL_REGISTRY, findToolById } from "../tools/tool-registry";
import {
  filterAndSortTools,
  togglePinnedToolId,
} from "../utils/tool-list.utils";
import {
  applyThemeToRoot,
  loadTheme,
  saveTheme,
  type StorageAreaLike,
} from "../storage/theme-storage";
import {
  loadLastView,
  loadPinnedToolIds,
  saveLastView,
  savePinnedToolIds,
} from "../storage/office-storage";

export interface HubOfficeControllerOptions {
  storageArea?: StorageAreaLike;
  tools?: readonly ToolDefinition[];
}

const TOAST_DURATION_MS = 2200;

/**
 * HubOffice の画面遷移・フィルタ・ピン留め・テーマ・トーストを一元管理する Reactive Controller
 */
export class HubOfficeController implements ReactiveController {
  private readonly host: ReactiveControllerHost;
  private readonly storageArea?: StorageAreaLike;
  private readonly tools: readonly ToolDefinition[];

  activeView: ActiveView = "home";
  private previousNonSettingsView: ActiveView = "home";
  filterQuery = "";
  pinnedToolIds: string[] = [];
  themeMode: ThemeMode = "system";
  toastMessage = "";

  private toastTimerId: ReturnType<typeof setTimeout> | undefined;
  private mediaQuery: MediaQueryList | undefined;

  private readonly handleSystemThemeChange = (): void => {
    if (this.themeMode === "system") {
      applyThemeToRoot(this.themeMode);
    }
  };

  constructor(
    host: ReactiveControllerHost,
    options: HubOfficeControllerOptions = {},
  ) {
    this.host = host;
    this.storageArea = options.storageArea;
    this.tools = options.tools ?? TOOL_REGISTRY;
    this.host.addController(this);
  }

  hostConnected(): void {
    if (
      typeof globalThis.window !== "undefined" &&
      typeof globalThis.window.matchMedia === "function"
    ) {
      this.mediaQuery = globalThis.window.matchMedia(
        "(prefers-color-scheme: dark)",
      );
      this.mediaQuery.addEventListener("change", this.handleSystemThemeChange);
    }
    void this.initialize();
  }

  hostDisconnected(): void {
    this.mediaQuery?.removeEventListener(
      "change",
      this.handleSystemThemeChange,
    );
    if (this.toastTimerId !== undefined) {
      clearTimeout(this.toastTimerId);
      this.toastTimerId = undefined;
    }
  }

  get validToolIds(): string[] {
    return this.tools.map((t) => t.id);
  }

  get visibleTools(): ToolDefinition[] {
    return filterAndSortTools(this.tools, this.filterQuery, this.pinnedToolIds);
  }

  get activeTool(): ToolDefinition | undefined {
    if (this.activeView === "home" || this.activeView === "settings") {
      return undefined;
    }
    return findToolById(this.activeView);
  }

  isPinned(toolId: string): boolean {
    return this.pinnedToolIds.includes(toolId);
  }

  async initialize(): Promise<void> {
    const [theme, pinned, lastView] = await Promise.all([
      loadTheme(this.storageArea),
      loadPinnedToolIds(this.validToolIds, this.storageArea),
      loadLastView(this.validToolIds, this.storageArea),
    ]);

    this.themeMode = theme;
    applyThemeToRoot(this.themeMode);
    this.pinnedToolIds = pinned;
    this.activeView = lastView;
    if (lastView !== "settings") {
      this.previousNonSettingsView = lastView;
    }
    this.host.requestUpdate();
  }

  async openTool(toolId: string): Promise<void> {
    if (!this.validToolIds.includes(toolId)) {
      return;
    }
    this.activeView = toolId;
    this.previousNonSettingsView = toolId;
    this.host.requestUpdate();
    await saveLastView(toolId, this.storageArea);
  }

  async goHome(): Promise<void> {
    this.activeView = "home";
    this.previousNonSettingsView = "home";
    this.host.requestUpdate();
    await saveLastView("home", this.storageArea);
  }

  async toggleSettings(): Promise<void> {
    if (this.activeView === "settings") {
      this.activeView = this.previousNonSettingsView;
    } else {
      this.previousNonSettingsView = this.activeView;
      this.activeView = "settings";
    }
    this.host.requestUpdate();
    await saveLastView(this.activeView, this.storageArea);
  }

  setFilterQuery(query: string): void {
    this.filterQuery = query;
    this.host.requestUpdate();
  }

  async togglePin(toolId: string): Promise<void> {
    this.pinnedToolIds = togglePinnedToolId(this.pinnedToolIds, toolId);
    this.host.requestUpdate();
    await savePinnedToolIds(this.pinnedToolIds, this.storageArea);
  }

  async setThemeMode(mode: ThemeMode): Promise<void> {
    this.themeMode = mode;
    applyThemeToRoot(mode);
    this.host.requestUpdate();
    await saveTheme(mode, this.storageArea);
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.host.requestUpdate();
    if (this.toastTimerId !== undefined) {
      clearTimeout(this.toastTimerId);
    }
    this.toastTimerId = setTimeout(() => {
      this.toastMessage = "";
      this.toastTimerId = undefined;
      this.host.requestUpdate();
    }, TOAST_DURATION_MS);
  }

  async copyText(label: string, value: string): Promise<void> {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      this.showToast(`${label}をコピーしました: ${value}`);
    } catch {
      this.showToast("クリップボードへのコピーに失敗しました。");
    }
  }
}
