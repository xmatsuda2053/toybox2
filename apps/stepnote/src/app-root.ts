import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ContextProvider } from "@lit/context";
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

  override render() {
    return html` <div class="app-root">in progress</div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": AppRoot;
  }
}
