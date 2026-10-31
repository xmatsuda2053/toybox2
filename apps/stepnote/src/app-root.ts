import { LitElement, html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ContextProvider } from "@lit/context";
import appRootStyles from "./app-root.scss?inline";
import {
  layoutUIContext,
  quickAccessContext,
  labelsContext,
  taskContext,
  taskListContext,
  logsContext,
  notesContext,
  issuesContext,
  themeContext,
  scratchContext,
} from "@/contexts/index.js";
import { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import { QuickAccessController } from "@/controllers/quick-access.controller.js";
import { LabelsController } from "@/controllers/labels.controller.js";
import { TaskController } from "@/controllers/task.controller.js";
import { TaskListController } from "@/controllers/task-list.controller.js";
import { LogsController } from "@/controllers/logs.controller.js";
import { NotesController } from "@/controllers/notes.controller.js";
import { IssuesController } from "@/controllers/issues.controller.js";
import { ThemeController } from "@/controllers/theme.controller.js";
import { ScratchController } from "@/controllers/scratch.controller.js";
import "@/components/theme-switcher/theme-switcher.js";
import "@/components/menu/app-menu.js";
import "@/components/navigation/navigation-quick-access.js";
import "@/components/navigation/navigation-labels.js";
import "@/components/task-list/task-list.js";
import "@/components/panes/task-pane.js";
import "@/components/panes/journal-pane.js";
import "@/components/panes/scratch-pane.js";
import "@/components/panes/settings-pane.js";
import "@/components/search/global-search-dialog.js";
import "@/components/task-list/task-create-dialog.js";
import "@/components/footer/app-footer.js";
import "@/components/help/shortcut-help-drawer.js";
import { getCurrentFiscalYear } from "@shared/utils";
import { db } from "@/db/schema/database.schema.js";
import { TaskListQuery } from "@/db/queries/task-list.query.js";
import { SystemLogService } from "@/services/system-log.service.js";
import { DatabaseBackupService } from "@/services/database-backup.service.js";
import {
  QuickAccessRepository,
  LabelsRepository,
  TaskRepository,
  LogsRepository,
  NotesRepository,
  IssuesRepository,
  ScratchRepository,
} from "@/repositories/index.js";

/**
 * StepNote アプリケーションのルートコンポーネント (AppRoot)
 *
 * 全体で利用する 9 つの Reactive Controller をインスタンス化し、
 * @lit/context を通じて子コンポーネントへ配給（Provider）する。
 *
 * @export
 * @class AppRoot
 * @extends {LitElement}
 */
@customElement("app-root")
export class AppRoot extends LitElement {
  // 1. 各 Controller のインスタンス
  public layoutUIController!: LayoutUIController;
  public quickAccessController!: QuickAccessController;
  public labelsController!: LabelsController;
  public taskController!: TaskController;
  public taskListController!: TaskListController;
  public logsController!: LogsController;
  public notesController!: NotesController;
  public issuesController!: IssuesController;
  public themeController!: ThemeController;
  public scratchController!: ScratchController;
  public systemLogService!: SystemLogService;
  public databaseBackupService: DatabaseBackupService;

  @state()
  public isGlobalSearchOpen = false;

  @state()
  public isTaskCreateDialogOpen = false;

  @state()
  public isShortcutHelpOpen = false;

  constructor() {
    super();
    this.databaseBackupService = new DatabaseBackupService();

    this.setupEventListeners();
    this.setupControllers();
    this.registerContextProviders();
  }

  /**
   * ルートコンポーネントが処理するカスタムイベントリスナーを登録する。
   *
   * @private
   * @memberof AppRoot
   */
  private setupEventListeners(): void {
    this.addEventListener("request-task-create", () => {
      this.handleOpenTaskCreate();
    });
    this.addEventListener("request-database-export", () => {
      this.handleExportDatabase();
    });
    this.addEventListener("request-database-import", (e: Event) => {
      this.handleImportDatabase(e as CustomEvent<{ file: File }>);
    });
    this.addEventListener("request-shortcut-help", () => {
      this.handleToggleShortcutHelp();
    });
  }

  /**
   * Controller および Service インスタンスを生成・初期化する。
   *
   * @private
   * @memberof AppRoot
   */
  private setupControllers(): void {
    const taskRepository = new TaskRepository();
    const issuesRepository = new IssuesRepository();
    const labelsRepository = new LabelsRepository();
    const logsRepository = new LogsRepository();
    const notesRepository = new NotesRepository();
    const scratchRepository = new ScratchRepository();

    this.layoutUIController = new LayoutUIController(this);
    this.quickAccessController = new QuickAccessController(
      this,
      new QuickAccessRepository(),
    );
    this.labelsController = new LabelsController(this, labelsRepository);
    this.logsController = new LogsController(this, logsRepository);
    this.scratchController = new ScratchController(this, scratchRepository);

    // 共通システムログサービスの初期化
    this.systemLogService = new SystemLogService(
      logsRepository,
      this.logsController,
    );

    this.taskController = new TaskController(
      this,
      taskRepository,
      undefined,
      issuesRepository,
      this.systemLogService,
      labelsRepository,
    );
    this.taskListController = new TaskListController(
      this,
      taskRepository,
      getCurrentFiscalYear(),
      new TaskListQuery(db),
    );
    this.notesController = new NotesController(
      this,
      notesRepository,
      undefined,
      this.systemLogService,
    );
    this.issuesController = new IssuesController(
      this,
      issuesRepository,
      undefined,
      this.systemLogService,
    );
    this.themeController = new ThemeController(this);
  }

  /**
   * @lit/context Provider による Context 配給を登録する。
   *
   * @private
   * @memberof AppRoot
   */
  private registerContextProviders(): void {
    new ContextProvider(this, {
      context: layoutUIContext,
      initialValue: this.layoutUIController,
    });
    new ContextProvider(this, {
      context: quickAccessContext,
      initialValue: this.quickAccessController,
    });
    new ContextProvider(this, {
      context: labelsContext,
      initialValue: this.labelsController,
    });
    new ContextProvider(this, {
      context: taskContext,
      initialValue: this.taskController,
    });
    new ContextProvider(this, {
      context: taskListContext,
      initialValue: this.taskListController,
    });
    new ContextProvider(this, {
      context: logsContext,
      initialValue: this.logsController,
    });
    new ContextProvider(this, {
      context: notesContext,
      initialValue: this.notesController,
    });
    new ContextProvider(this, {
      context: issuesContext,
      initialValue: this.issuesController,
    });
    new ContextProvider(this, {
      context: themeContext,
      initialValue: this.themeController,
    });
    new ContextProvider(this, {
      context: scratchContext,
      initialValue: this.scratchController,
    });
  }

  /**
   * サイドパネル（ナビゲーションおよびタスク一覧）の開閉状態を切り替える。
   *
   * @memberof AppRoot
   */
  public handleToggleNavigationList = (): void => {
    this.layoutUIController.toggleNavigationListArea();
  };

  public static override styles = unsafeCSS(appRootStyles);

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
    await this.taskListController.refresh();
    if (event?.detail?.taskId !== undefined) {
      await this.taskListController.selectTask(event.detail.taskId);
    }
    this.requestUpdate();
  };

  /**
   * データベースの全テーブルをエクスポートする。
   *
   * @memberof AppRoot
   */
  public handleExportDatabase = async (): Promise<void> => {
    try {
      await this.databaseBackupService.exportDatabase(db);
    } catch (error) {
      console.error("データベースのエクスポートに失敗しました:", error);
    }
  };

  /**
   * 選択されたバックアップファイルからデータベースをインポートし、画面を再読み込みする。
   *
   * @memberof AppRoot
   * @param {CustomEvent<{ file: File }>} event
   */
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
    if (this.layoutUIController.state.isSettingsMode) {
      return;
    }

    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    const lowerKey = e.key.toLowerCase();

    // 全画面スクラッチモード切替（スクラッチモード中であっても通常画面へ復帰できるよう最優先で判定）
    if (isCtrlOrMeta && e.altKey && lowerKey === "s") {
      e.preventDefault();
      this.layoutUIController.toggleScratchMode();
      return;
    }

    if (this.layoutUIController.state.isScratchMode) {
      return;
    }

    // 集中モード切替
    if (isCtrlOrMeta && e.altKey && lowerKey === "z") {
      e.preventDefault();
      this.layoutUIController.toggleZenMode();
      return;
    }

    if (isCtrlOrMeta && !e.altKey && lowerKey === "k") {
      e.preventDefault();
      this.isGlobalSearchOpen = !this.isGlobalSearchOpen;
      return;
    }

    if (isCtrlOrMeta && !e.altKey && e.key === "/") {
      e.preventDefault();
      this.handleToggleShortcutHelp();
      return;
    }

    if (e.altKey && !isCtrlOrMeta && lowerKey === "n") {
      e.preventDefault();
      this.handleOpenTaskCreate();
    }
  };

  /**
   * 各 Controller 間の状態変更イベントの購読と連携を設定する。
   */
  public setupControllerSubscriptions(): void {
    this.taskController.subscribe(async () => {
      const currentTaskId = this.taskController.state?.id;
      if (this.issuesController.taskId !== currentTaskId) {
        this.issuesController.setTaskId(currentTaskId);
      }
      if (this.logsController.taskId !== currentTaskId) {
        this.logsController.setTaskId(currentTaskId);
      }
      if (this.notesController.taskId !== currentTaskId) {
        this.notesController.setTaskId(currentTaskId);
      }
      await this.taskListController.refresh();
    });

    this.issuesController.subscribe(async () => {
      await Promise.all([
        this.taskListController.refresh(),
        this.taskController.refresh(),
      ]);
    });

    this.labelsController.subscribe(() => {
      this.requestUpdate();
    });
  }

  /**
   * AppRoot 自身（:host）のクラスおよび属性を現在の適用テーマと同期する。
   */
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

  /**
   * ヘッダー領域の HTML テンプレートを描画する。
   *
   * @private
   * @param {boolean} [isSearchDisabled=false]
   * @return {HTMLTemplateResult}
   * @memberof AppRoot
   */
  private renderHeader(isSearchDisabled: boolean = false): HTMLTemplateResult {
    return html`
      <header class="app-header">
        <div class="header-branding">
          <wa-icon library="my-icons" name="cubes-stacked-solid-full"></wa-icon>
          StepNote
        </div>
        <div class="header-search">
          <button
            type="button"
            id="header-global-search-trigger"
            class="header-search-trigger"
            aria-label="全体検索 (Ctrl+K)"
            ?disabled=${isSearchDisabled}
            @click=${this.handleOpenGlobalSearch}
          >
            <div class="header-search-trigger__lead">
              <wa-icon
                library="my-icons"
                name="magnifying-glass-solid-full"
                class="header-search-trigger__icon"
              ></wa-icon>
              <span class="header-search-trigger__placeholder"
                >全体を検索...</span
              >
            </div>
            <kbd class="header-search-trigger__shortcut">Ctrl K</kbd>
          </button>
        </div>
        <div class="header-actions">
          <theme-switcher></theme-switcher>
        </div>
      </header>
    `;
  }

  /**
   * 最左メニュー領域 (app-menu) を描画する。
   *
   * @private
   * @param {string} resolvedTheme
   * @return {HTMLTemplateResult}
   * @memberof AppRoot
   */
  private renderAppMenu(resolvedTheme: string): HTMLTemplateResult {
    const {
      isNavigationListAreaOpen,
      isZenMode,
      isScratchMode,
      isSettingsMode,
    } = this.layoutUIController.state;

    return html`
      <app-menu
        class="app-menu"
        data-theme=${resolvedTheme}
        .isNavigationListAreaOpen=${isNavigationListAreaOpen}
        .isZenMode=${isZenMode}
        .isScratchMode=${isScratchMode}
        .isSettingsMode=${isSettingsMode}
      ></app-menu>
    `;
  }

  /**
   * 全画面スクラッチモード時の HTML テンプレートを描画する。
   *
   * @private
   * @param {string} resolvedTheme
   * @return {HTMLTemplateResult}
   * @memberof AppRoot
   */
  private renderScratchPanes(resolvedTheme: string): HTMLTemplateResult {
    return html`
      <div class="panes-container">
        <!-- 1. Menu (最左メニュー領域: 固定 45px) -->
        ${this.renderAppMenu(resolvedTheme)}

        <!-- 全画面スクラッチペイン -->
        <scratch-pane
          class="pane-scratch"
          data-theme=${resolvedTheme}
        ></scratch-pane>
      </div>
    `;
  }

  /**
   * 全画面設定モード時の HTML テンプレートを描画する。
   *
   * @private
   * @param {string} resolvedTheme
   * @return {HTMLTemplateResult}
   * @memberof AppRoot
   */
  private renderSettingsPanes(resolvedTheme: string): HTMLTemplateResult {
    return html`
      <div class="panes-container">
        <!-- 1. Menu (最左メニュー領域: 固定 45px) -->
        ${this.renderAppMenu(resolvedTheme)}

        <!-- 全画面設定ペイン -->
        <settings-pane
          class="pane-settings"
          data-theme=${resolvedTheme}
        ></settings-pane>
      </div>
    `;
  }

  /**
   * Navigation ペイン（第2ペイン）を描画する。
   *
   * @private
   * @param {boolean} isOpen ナビゲーションリストエリアが開いているかどうか
   * @param {string} resolvedTheme 適用中の解決済みテーマ名
   * @return {HTMLTemplateResult}
   * @memberof AppRoot
   */
  private renderNavigationAside(
    isOpen: boolean,
    resolvedTheme: string,
  ): HTMLTemplateResult {
    return html`
      <aside class="pane-navigation pane-collapsible" ?hidden=${!isOpen}>
        <navigation-quick-access
          class="navigation-quick-access"
          data-theme=${resolvedTheme}
        ></navigation-quick-access>
        <navigation-labels
          class="navigation-labels"
          data-theme=${resolvedTheme}
        ></navigation-labels>
      </aside>
    `;
  }

  /**
   * Journal ペイン（第5ペイン）を描画する。
   *
   * @private
   * @param {boolean} isJournalOpen ジャーナルエリアが開いているかどうか
   * @param {string} resolvedTheme 適用中の解決済みテーマ名
   * @return {HTMLTemplateResult}
   * @memberof AppRoot
   */
  private renderJournalAside(
    isJournalOpen: boolean,
    resolvedTheme: string,
  ): HTMLTemplateResult {
    const journalPaneClass = isJournalOpen
      ? "journal-pane"
      : "journal-pane journal-pane--collapsed";

    return html`
      <aside class="${journalPaneClass}">
        <journal-pane
          data-theme=${resolvedTheme}
          .isJournalAreaOpen=${isJournalOpen}
        ></journal-pane>
      </aside>
    `;
  }

  /**
   * 5ペイン（中央コンテンツ領域）の HTML テンプレートを描画する。
   *
   * @private
   * @param {string} resolvedTheme 適用中の解決済みテーマ名
   * @return {HTMLTemplateResult}
   * @memberof AppRoot
   */
  private renderPanes(resolvedTheme: string): HTMLTemplateResult {
    const {
      isNavigationListAreaOpen: isOpen,
      isJournalAreaOpen: isJournalOpen,
      isScratchMode,
      isSettingsMode,
    } = this.layoutUIController.state;

    if (isScratchMode) {
      return this.renderScratchPanes(resolvedTheme);
    }
    if (isSettingsMode) {
      return this.renderSettingsPanes(resolvedTheme);
    }

    return html`
      <div class="panes-container">
        <!-- 1. Menu (最左メニュー領域: 固定 45px) -->
        ${this.renderAppMenu(resolvedTheme)}

        <!-- 2. Navigation ペイン (第2ペイン: 上下2分割) -->
        ${this.renderNavigationAside(isOpen, resolvedTheme)}

        <!-- 3. Task List (第3ペイン) -->
        <task-list
          class="task-list pane-collapsible"
          data-theme=${resolvedTheme}
          ?hidden=${!isOpen}
        ></task-list>

        <!-- 4. Task ペイン (第4ペイン: タスク管理) -->
        <main class="task-pane">
          <task-pane data-theme=${resolvedTheme}></task-pane>
        </main>

        <!-- 5. Journal ペイン (第5ペイン: 作業記録・履歴) -->
        ${this.renderJournalAside(isJournalOpen, resolvedTheme)}
      </div>
    `;
  }

  /**
   * コンポーネント描画
   *
   * メインコンテンツのペインを構成する。
   *
   * @memberof AppRoot
   */
  override render() {
    const { isScratchMode, isSettingsMode } = this.layoutUIController.state;
    const isSearchDisabled = isScratchMode || isSettingsMode;
    const resolvedTheme = this.themeController.resolvedTheme;
    const themeClass = resolvedTheme === "dark" ? "wa-dark" : "wa-light";

    return html`
      <div class="app-shell ${themeClass}" data-theme=${resolvedTheme}>
        <!-- Header (上部固定) -->
        ${this.renderHeader(isSearchDisabled)}

        <!-- Panes (中央5ペイン領域) -->
        ${this.renderPanes(resolvedTheme)}

        <!-- Footer (下部固定) -->
        <app-footer class="app-footer"></app-footer>

        <!-- 全体検索モーダル -->
        <global-search-dialog
          .open=${this.isGlobalSearchOpen}
          data-theme=${resolvedTheme}
          @global-search-close=${this.handleCloseGlobalSearch}
          @global-search-select=${this.handleCloseGlobalSearch}
        ></global-search-dialog>

        <!-- 新規タスク作成モーダル -->
        <task-create-dialog
          .open=${this.isTaskCreateDialogOpen}
          .fiscalYear=${getCurrentFiscalYear()}
          data-theme=${resolvedTheme}
          @dialog-close=${this.handleCloseTaskCreate}
          @task-created=${this.handleTaskCreated}
        ></task-create-dialog>

        <!-- ショートカットヘルプ Drawer -->
        <shortcut-help-drawer
          .open=${this.isShortcutHelpOpen}
          data-theme=${resolvedTheme}
          @drawer-close=${this.handleCloseShortcutHelp}
        ></shortcut-help-drawer>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": AppRoot;
  }
}
