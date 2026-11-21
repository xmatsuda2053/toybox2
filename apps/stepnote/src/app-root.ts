import { LitElement, html, unsafeCSS } from "lit";
import { customElement, state } from "lit/decorators.js";
import appRootStyles from "./app-root.scss?inline";
import type { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import type { QuickAccessController } from "@/controllers/quick-access.controller.js";
import type { LabelsController } from "@/controllers/labels.controller.js";
import type { TagsController } from "@/controllers/tags.controller.js";
import type { TagSetsController } from "@/controllers/tag-sets.controller.js";
import type { TaskController } from "@/controllers/task.controller.js";
import type { TaskListController } from "@/controllers/task-list.controller.js";
import type { TaskTableController } from "@/controllers/task-table.controller.js";
import type { LogsController } from "@/controllers/logs.controller.js";
import type { NotesController } from "@/controllers/notes.controller.js";
import type { IssuesController } from "@/controllers/issues.controller.js";
import type { ThemeController } from "@/controllers/theme.controller.js";
import type { ScratchController } from "@/controllers/scratch.controller.js";
import type { TaskTemplateController } from "@/controllers/task-template.controller.js";
import type { AutoExportController } from "@/controllers/auto-export.controller.js";
import type { TaskHistoryController } from "@/controllers/task-history.controller.js";
import "@/components/theme-switcher/theme-switcher.js";
import "@/components/view-mode-switcher/view-mode-switcher.js";
import "@/components/navigation/task-history-menu.js";
import "@/components/menu/app-menu.js";
import "@/components/navigation/navigation-quick-access.js";
import "@/components/navigation/navigation-labels.js";
import "@/components/task-list/task-list.js";
import "@/components/panes/task-pane.js";
import "@/components/panes/task-table-pane.js";
import "@/components/panes/journal-pane.js";
import "@/components/panes/scratch-pane.js";
import "@/components/panes/settings-pane.js";
import "@/components/search/global-search-dialog.js";
import "@/components/task-list/task-create-dialog.js";
import "@/components/footer/app-footer.js";
import "@/components/help/shortcut-help-drawer.js";
import { getCurrentFiscalYear } from "@shared/utils";
import type { IdJumpDetail } from "@shared/components";
import { db } from "@/db/schema/database.schema.js";
import type { SystemLogService } from "@/services/system-log.service.js";
import { DatabaseBackupService } from "@/services/database-backup.service.js";
import type {
  TaskRepository,
  IssuesRepository,
  NotesRepository,
  ScratchRepository,
} from "@/repositories/index.js";
import {
  createAppRepositories,
  createAppControllers,
  provideAppContexts,
  bindAppControllerSubscriptions,
  type AppControllerBundle,
} from "./app-root.bootstrap.js";
import {
  selectAndShowTask,
  navigateByIdJump,
  type IdJumpCoordinatorDeps,
} from "./app-root.navigation.js";
import { dispatchGlobalShortcut } from "./app-root.shortcuts.js";
import { renderAppHeader, renderAppPanesLayout } from "./app-root.templates.js";

/**
 * StepNote アプリケーションのルートコンポーネント (AppRoot)
 *
 * 全体で利用する各 Reactive Controller をインスタンス化し、
 * @lit/context を通じて子コンポーネントへ配給（Provider）する。
 *
 * @export
 * @class AppRoot
 * @extends {LitElement}
 */
@customElement("app-root")
export class AppRoot extends LitElement {
  public layoutUIController!: LayoutUIController;
  public quickAccessController!: QuickAccessController;
  public labelsController!: LabelsController;
  public taskController!: TaskController;
  public taskListController!: TaskListController;
  public taskTableController!: TaskTableController;
  public logsController!: LogsController;
  public notesController!: NotesController;
  public issuesController!: IssuesController;
  public themeController!: ThemeController;
  public scratchController!: ScratchController;
  public taskTemplateController!: TaskTemplateController;
  public autoExportController!: AutoExportController;
  public taskHistoryController!: TaskHistoryController;
  public tagsController!: TagsController;
  public tagSetsController!: TagSetsController;
  public systemLogService!: SystemLogService;
  public databaseBackupService: DatabaseBackupService;
  public taskRepository!: TaskRepository;
  public issuesRepository!: IssuesRepository;
  public notesRepository!: NotesRepository;
  public scratchRepository!: ScratchRepository;

  @state()
  public isGlobalSearchOpen = false;

  @state()
  public isTaskCreateDialogOpen = false;

  @state()
  public isShortcutHelpOpen = false;

  private readonly controllerBundle: AppControllerBundle;

  public static override styles = unsafeCSS(appRootStyles);

  constructor() {
    super();
    this.databaseBackupService = new DatabaseBackupService();
    const repos = createAppRepositories();
    this.taskRepository = repos.taskRepository;
    this.issuesRepository = repos.issuesRepository;
    this.notesRepository = repos.notesRepository;
    this.scratchRepository = repos.scratchRepository;

    this.controllerBundle = createAppControllers(this, repos, {
      exportCallback: () => this.handleExportDatabase(),
      notifyCallback: (fileName: string) =>
        this.handleAutoExportNotified(fileName),
    });
    this.assignControllerBundle(this.controllerBundle);

    this.setupEventListeners();
    provideAppContexts(this, this.controllerBundle);
  }

  private assignControllerBundle(bundle: AppControllerBundle): void {
    this.layoutUIController = bundle.layoutUIController;
    this.quickAccessController = bundle.quickAccessController;
    this.labelsController = bundle.labelsController;
    this.taskController = bundle.taskController;
    this.taskListController = bundle.taskListController;
    this.taskTableController = bundle.taskTableController;
    this.logsController = bundle.logsController;
    this.notesController = bundle.notesController;
    this.issuesController = bundle.issuesController;
    this.themeController = bundle.themeController;
    this.scratchController = bundle.scratchController;
    this.taskTemplateController = bundle.taskTemplateController;
    this.autoExportController = bundle.autoExportController;
    this.taskHistoryController = bundle.taskHistoryController;
    this.tagsController = bundle.tagsController;
    this.tagSetsController = bundle.tagSetsController;
    this.systemLogService = bundle.systemLogService;
  }

  private setupEventListeners(): void {
    this.addEventListener("request-task-create", () => {
      this.handleOpenTaskCreate();
    });
    this.addEventListener("request-database-export", () => {
      void this.handleExportDatabase();
    });
    this.addEventListener("request-database-import", (e: Event) => {
      void this.handleImportDatabase(e as CustomEvent<{ file: File }>);
    });
    this.addEventListener("request-shortcut-help", () => {
      this.handleToggleShortcutHelp();
    });
    this.addEventListener("id-jump", (e: Event) => {
      this.handleIdJumpEvent(e);
    });
    this.addEventListener("task-history-select", (e: Event) => {
      const customEvent = e as CustomEvent<{ taskId: number }>;
      if (customEvent.detail?.taskId) {
        void this.selectAndShowTask(customEvent.detail.taskId);
      }
    });
    this.addEventListener("task-table-open-task", (e: Event) => {
      const customEvent = e as CustomEvent<{ taskId: number }>;
      if (customEvent.detail?.taskId) {
        void this.openTaskFromTable(customEvent.detail.taskId);
      }
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncThemeToHost();
    this.themeController.subscribe(() => {
      this.syncThemeToHost();
    });
    this.setupControllerSubscriptions();
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleGlobalKeyDown);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleGlobalKeyDown);
    }
  }

  /** 各 Controller 間の状態変更イベントの購読と連携を設定する。 */
  public setupControllerSubscriptions(): void {
    bindAppControllerSubscriptions(this.controllerBundle, () => {
      this.requestUpdate();
    });
  }

  /** サイドパネル（ナビゲーションおよびタスク一覧）の開閉状態を切り替える。 */
  public handleToggleNavigationList = (): void => {
    this.layoutUIController.toggleNavigationListArea();
  };

  public handleOpenGlobalSearch = (): void => {
    this.isGlobalSearchOpen = true;
  };

  public handleCloseGlobalSearch = (): void => {
    this.isGlobalSearchOpen = false;
    const searchTrigger = this.renderRoot?.querySelector<HTMLElement>(
      "#header-global-search-trigger",
    );
    searchTrigger?.blur();
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        const targetTrigger = this.renderRoot?.querySelector<HTMLElement>(
          "#header-global-search-trigger",
        );
        targetTrigger?.blur();
      });
    }
  };

  /** 全体検索結果選択時のハンドラー（ダイアログを閉じ、一覧モード時は詳細ビューへ遷移する） */
  public handleGlobalSearchSelect = (): void => {
    this.handleCloseGlobalSearch();
    if (this.layoutUIController.state.viewMode === "list") {
      this.taskTableController.clearSelection();
      this.layoutUIController.openListTaskDetail();
    }
  };

  private createNavigationDeps(): IdJumpCoordinatorDeps {
    return {
      getTaskById: (taskId) => this.taskRepository.getById(taskId),
      getIssueById: (issueId) => this.issuesRepository.getById(issueId),
      getNoteById: (noteId) => this.notesRepository.getById(noteId),
      getScratchById: (scratchId) => this.scratchRepository.getById(scratchId),
      getLayoutState: () => this.layoutUIController.state,
      setScratchMode: (isOpen) => this.layoutUIController.setScratchMode(isOpen),
      setSettingsMode: (isOpen) =>
        this.layoutUIController.setSettingsMode(isOpen),
      setJournalAreaOpen: (isOpen) =>
        this.layoutUIController.setJournalAreaOpen(isOpen),
      openListTaskDetail: () => this.layoutUIController.openListTaskDetail(),
      clearTableSelection: () => this.taskTableController.clearSelection(),
      selectLabel: (labelId) => this.labelsController.selectLabel(labelId),
      selectTask: (taskId) => this.taskListController.selectTask(taskId),
      setTaskId: (taskId) => this.taskController.setTaskId(taskId),
      hasSelectedTask: () => this.taskController.state !== undefined,
      waitForUpdate: () =>
        this.isConnected ? this.updateComplete : Promise.resolve(true),
      queryPane: <T>(selector: string): T | null =>
        (this.renderRoot?.querySelector(selector) as T | null) ?? null,
    };
  }

  /** id-jump イベントのディスパッチハンドラー */
  public handleIdJumpEvent = (e: Event): void => {
    const customEvent = e as CustomEvent<IdJumpDetail>;
    if (customEvent.detail) {
      void this.handleIdJump(customEvent.detail);
    }
  };

  /** 一覧表からタスクを開き、詳細ビューへ遷移する */
  public async openTaskFromTable(taskId: number): Promise<void> {
    const selected = await this.selectAndShowTask(taskId);
    if (selected && this.layoutUIController.state.viewMode === "list") {
      this.layoutUIController.openListTaskDetail();
    }
  }

  /** 指定したタスクを選択し、画面全体（ラベル、タスク一覧、タスク詳細）を更新する */
  public async selectAndShowTask(taskId: number): Promise<boolean> {
    return selectAndShowTask(this.createNavigationDeps(), taskId);
  }

  /** Markdown から発行された ID ジャンプ処理を実行する */
  public async handleIdJump(detail: IdJumpDetail): Promise<void> {
    await navigateByIdJump(this.createNavigationDeps(), detail);
  }

  public handleOpenTaskCreate = (): void => {
    if (!this.labelsController.hasLabels) {
      return;
    }
    this.isTaskCreateDialogOpen = true;
  };

  public handleCloseTaskCreate = (): void => {
    this.isTaskCreateDialogOpen = false;
  };

  public handleTaskCreated = async (
    event?: CustomEvent<{ taskId?: number }>,
  ): Promise<void> => {
    this.isTaskCreateDialogOpen = false;
    await Promise.all([
      this.taskListController.refresh(),
      this.taskTableController.refresh(),
    ]);
    if (event?.detail?.taskId !== undefined) {
      await this.taskListController.selectTask(event.detail.taskId);
    }
    this.requestUpdate();
  };

  /** 自動エクスポート完了通知ハンドラー */
  public handleAutoExportNotified = (fileName: string): void => {
    const toast =
      this.shadowRoot?.querySelector<
        HTMLElement & { create: (message: string, options?: unknown) => void }
      >("wa-toast") ??
      this.renderRoot?.querySelector<
        HTMLElement & { create: (message: string, options?: unknown) => void }
      >("wa-toast");
    if (toast && typeof toast.create === "function") {
      toast.create(`自動バックアップを保存しました: ${fileName}`, {
        variant: "success",
        duration: 5000,
      });
    }
  };

  /** データベースの全テーブルをエクスポートする。 */
  public handleExportDatabase = async (): Promise<void> => {
    try {
      await this.databaseBackupService.exportDatabase(db);
    } catch (error) {
      console.error("データベースのエクスポートに失敗しました:", error);
    }
  };

  /** 選択されたバックアップファイルからデータベースをインポートし、画面を再読み込みする。 */
  public handleImportDatabase = async (
    event: CustomEvent<{ file: File }>,
  ): Promise<void> => {
    const file = event.detail?.file;
    if (!file) {
      return;
    }
    try {
      await this.databaseBackupService.importDatabase(db, file);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (error) {
      console.error("データベースのインポートに失敗しました:", error);
    }
  };

  public handleToggleShortcutHelp = (): void => {
    this.isShortcutHelpOpen = !this.isShortcutHelpOpen;
  };

  public handleCloseShortcutHelp = (): void => {
    this.isShortcutHelpOpen = false;
  };

  public handleGlobalKeyDown = (e: KeyboardEvent): void => {
    dispatchGlobalShortcut(e, this.layoutUIController.state, {
      toggleScratchMode: () => this.layoutUIController.toggleScratchMode(),
      toggleZenMode: () => this.layoutUIController.toggleZenMode(),
      toggleGlobalSearch: () => {
        this.isGlobalSearchOpen = !this.isGlobalSearchOpen;
      },
      toggleShortcutHelp: () => this.handleToggleShortcutHelp(),
      openTaskCreate: () => this.handleOpenTaskCreate(),
    });
  };

  private syncThemeToHost(): void {
    const resolved = this.themeController.resolvedTheme;
    if (resolved === "dark") {
      this.classList.remove("wa-light");
      this.classList.add("wa-dark");
      this.setAttribute("data-theme", "dark");
    } else {
      this.classList.remove("wa-dark");
      this.classList.add("wa-light");
      this.setAttribute("data-theme", "light");
    }
  }

  private renderHeader(isSearchDisabled: boolean = false) {
    return renderAppHeader({
      isSearchDisabled,
      resolvedTheme: this.themeController.resolvedTheme,
      taskRepository: this.taskRepository,
      onOpenGlobalSearch: this.handleOpenGlobalSearch,
    });
  }

  override render() {
    const layoutState = this.layoutUIController.state;
    const isSearchDisabled =
      layoutState.isScratchMode || layoutState.isSettingsMode;
    const resolvedTheme = this.themeController.resolvedTheme;
    const themeClass = resolvedTheme === "dark" ? "wa-dark" : "wa-light";

    return html`
      <div class="app-shell ${themeClass}" data-theme=${resolvedTheme}>
        ${this.renderHeader(isSearchDisabled)}
        ${renderAppPanesLayout(layoutState, resolvedTheme)}

        <app-footer class="app-footer"></app-footer>

        <global-search-dialog
          .open=${this.isGlobalSearchOpen}
          data-theme=${resolvedTheme}
          @global-search-close=${this.handleCloseGlobalSearch}
          @global-search-select=${this.handleGlobalSearchSelect}
        ></global-search-dialog>

        <task-create-dialog
          .open=${this.isTaskCreateDialogOpen}
          .fiscalYear=${getCurrentFiscalYear()}
          data-theme=${resolvedTheme}
          @dialog-close=${this.handleCloseTaskCreate}
          @task-created=${this.handleTaskCreated}
        ></task-create-dialog>

        <shortcut-help-drawer
          .open=${this.isShortcutHelpOpen}
          data-theme=${resolvedTheme}
          @drawer-close=${this.handleCloseShortcutHelp}
        ></shortcut-help-drawer>

        <wa-toast id="app-toast"></wa-toast>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": AppRoot;
  }
}
