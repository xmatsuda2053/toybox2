import { LitElement, html, unsafeCSS } from "lit";
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
} from "@/contexts/index.js";
import { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import { QuickAccessController } from "@/controllers/quick-access.controller.js";
import { LabelsController } from "@/controllers/labels.controller.js";
import { TaskController } from "@/controllers/task.controller.js";
import { LogsController } from "@/controllers/logs.controller.js";
import { NotesController } from "@/controllers/notes.controller.js";
import { IssuesController } from "@/controllers/issues.controller.js";
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
 * 全体で利用する 7 つの Reactive Controller をインスタンス化し、
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
  }

  public static override styles = unsafeCSS(appRootStyles);

  override render() {
    return html`
      <div class="app-shell">
        <!-- Header (上部固定) -->
        <header class="app-header">header</header>

        <div class="panes-container">
          <!-- 1. Menu ペイン (最左ペイン: 固定 50px) -->
          <nav class="pane-menu"></nav>

          <!-- 2. Navigation ペイン (第2ペイン: 上下2分割) -->
          <aside class="pane-navigation">
            <div class="navigation-quick-access">quick-access</div>
            <div class="navigation-labels"></div>
          </aside>

          <!-- 3. Task List ペイン (第3ペイン) -->
          <section class="pane-task-list">task-list</section>

          <!-- 4. Task ペイン (第4ペイン: タスク管理) -->
          <main class="pane-task">task</main>

          <!-- 5. Journal ペイン (第5ペイン: 作業記録・履歴) -->
          <aside class="pane-journal">journal</aside>
        </div>

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
