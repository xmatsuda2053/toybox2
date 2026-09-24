import { LitElement, html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { ContextProvider } from "@lit/context";
import appRootStyles from "./app-root.scss?inline";
import {
  layoutUIContext,
  quickAccessContext,
  labelsContext,
  taskContext,
  logsContext,
  notesContext,
  issuesContext,
  themeContext,
} from "@/contexts/index.js";
import { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import { QuickAccessController } from "@/controllers/quick-access.controller.js";
import { LabelsController } from "@/controllers/labels.controller.js";
import { TaskController } from "@/controllers/task.controller.js";
import { LogsController } from "@/controllers/logs.controller.js";
import { NotesController } from "@/controllers/notes.controller.js";
import { IssuesController } from "@/controllers/issues.controller.js";
import { ThemeController } from "@/controllers/theme.controller.js";
import "@/components/theme-switcher/theme-switcher.js";
import "@/components/panes/pane-menu/pane-menu.js";
import "@/components/panes/pane-navigation/navigation-quick-access.js";
import "@/components/panes/pane-navigation/navigation-labels.js";
import {
  QuickAccessRepository,
  LabelsRepository,
  TaskRepository,
  LogsRepository,
  NotesRepository,
  IssuesRepository,
} from "@/repositories/index.js";

/**
 * StepNote アプリケーションのルートコンポーネント (AppRoot)
 *
 * 全体で利用する 8 つの Reactive Controller をインスタンス化し、
 * @lit/context を通じて子コンポーネントへ配給（Provider）する。
 *
 * @export
 * @class AppRoot
 * @extends {LitElement}
 */
@customElement("app-root")
export class AppRoot extends LitElement {
  // 1. 各 Controller のインスタンス
  public layoutUIController: LayoutUIController;
  public quickAccessController: QuickAccessController;
  public labelsController: LabelsController;
  public taskController: TaskController;
  public logsController: LogsController;
  public notesController: NotesController;
  public issuesController: IssuesController;
  public themeController: ThemeController;

  constructor() {
    super();

    // 1. Controller インスタンスの生成と初期化
    this.layoutUIController = new LayoutUIController(this);
    this.quickAccessController = new QuickAccessController(
      this,
      new QuickAccessRepository(),
    );
    this.labelsController = new LabelsController(this, new LabelsRepository());
    this.taskController = new TaskController(this, new TaskRepository());
    this.logsController = new LogsController(this, new LogsRepository());
    this.notesController = new NotesController(this, new NotesRepository());
    this.issuesController = new IssuesController(this, new IssuesRepository());
    this.themeController = new ThemeController(this);

    // 2. @lit/context Provider による Context 配給の登録
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
   * @return {HTMLTemplateResult}
   * @memberof AppRoot
   */
  private renderHeader(): HTMLTemplateResult {
    return html`
      <header class="app-header">
        <div class="header-branding">
          <wa-icon library="my-icons" name="cubes-stacked-solid-full"></wa-icon>
          StepNote
        </div>
        <div class="header-actions">
          <theme-switcher></theme-switcher>
        </div>
      </header>
    `;
  }

  /**
   * 5ペイン（中央コンテンツ領域）の HTML テンプレートを描画する。
   *
   * @private
   * @param {boolean} isOpen ナビゲーションリストエリアが開いているかどうか
   * @param {string} resolvedTheme 適用中の解決済みテーマ名
   * @return {HTMLTemplateResult}
   * @memberof AppRoot
   */
  private renderPanes(
    isOpen: boolean,
    resolvedTheme: string,
  ): HTMLTemplateResult {
    return html`
      <div class="panes-container">
        <!-- 1. Menu ペイン (最左ペイン: 固定 50px) -->
        <pane-menu
          class="pane-menu"
          data-theme=${resolvedTheme}
          .isNavigationListAreaOpen=${isOpen}
        ></pane-menu>

        <!-- 2. Navigation ペイン (第2ペイン: 上下2分割) -->
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

        <!-- 3. Task List ペイン (第3ペイン) -->
        <section class="pane-task-list pane-collapsible" ?hidden=${!isOpen}>
          task-list
        </section>

        <!-- 4. Task ペイン (第4ペイン: タスク管理) -->
        <main class="pane-task">task</main>

        <!-- 5. Journal ペイン (第5ペイン: 作業記録・履歴) -->
        <aside class="pane-journal">journal</aside>
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
    const isOpen = this.layoutUIController.state.isNavigationListAreaOpen;
    const resolvedTheme = this.themeController.resolvedTheme;
    const themeClass = resolvedTheme === "dark" ? "wa-dark" : "wa-light";

    return html`
      <div class="app-shell ${themeClass}" data-theme=${resolvedTheme}>
        <!-- Header (上部固定) -->
        ${this.renderHeader()}

        <!-- Panes (中央5ペイン領域) -->
        ${this.renderPanes(isOpen, resolvedTheme)}

        <!-- Footer (下部固定) -->
        <footer class="app-footer">footer</footer>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": AppRoot;
  }
}
