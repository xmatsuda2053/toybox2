import { LitElement, html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import "@lit-labs/virtualizer";
import "@shared/components";
import type { SearchInputEventDetail } from "@shared/components";
import {
  getCurrentFiscalYear,
  getFiscalYearRange,
  dispatchCustomEvent,
} from "@shared/utils";
import type { TaskRecord } from "@/db/models/task.model";
import {
  taskListContext,
  taskContext,
  labelsContext,
  quickAccessContext,
} from "@/contexts/index.js";
import type { TaskListController } from "@/controllers/task-list.controller.js";
import type { TaskController } from "@/controllers/task.controller.js";
import type { LabelsController } from "@/controllers/labels.controller.js";
import type { QuickAccessController } from "@/controllers/quick-access.controller.js";
import { ControllerSubscriber } from "@/utils/controller-subscriber.js";
import "./task-create-dialog.js";
import "./task-list-item.js";
import paneTaskListStyles from "./pane-task-list.scss?inline";

/**
 * Task List ペインコンポーネント (PaneTaskList)
 *
 * 画面第3ペイン（幅 310px 固定）のタスク一覧領域を担当する。
 * ヘッダ部（タイトル・年度指定・追加）、検索部（search-input）、リスト部（lit-virtualizer）
 * の3つの領域で構成される。
 *
 * @export
 * @class PaneTaskList
 * @extends {LitElement}
 */
@customElement("pane-task-list")
export class PaneTaskList extends LitElement {
  public static override styles = unsafeCSS(paneTaskListStyles);

  private subscriber = new ControllerSubscriber(this);
  private _taskListController?: TaskListController;
  private _taskController?: TaskController;
  private _labelsController?: LabelsController;
  private _quickAccessController?: QuickAccessController;

  /**
   * タスク一覧管理コントローラー
   */
  public get taskListController(): TaskListController | undefined {
    return this._taskListController;
  }

  @consume({ context: taskListContext, subscribe: true })
  @property({ attribute: false })
  public set taskListController(controller: TaskListController | undefined) {
    if (this._taskListController === controller) return;
    this._taskListController = controller;
    this.subscriber.subscribe("taskList", controller);
    this.syncLabelFilter();
    this.syncQuickAccessFilter();
    this.requestUpdate();
  }

  /**
   * 単一選択タスク管理コントローラー
   */
  public get taskController(): TaskController | undefined {
    return this._taskController;
  }

  @consume({ context: taskContext, subscribe: true })
  @property({ attribute: false })
  public set taskController(controller: TaskController | undefined) {
    if (this._taskController === controller) return;
    this._taskController = controller;
    this.subscriber.subscribe("task", controller);
    this.requestUpdate();
  }

  /**
   * ラベル管理コントローラー
   */
  public get labelsController(): LabelsController | undefined {
    return this._labelsController;
  }

  @consume({ context: labelsContext, subscribe: true })
  @property({ attribute: false })
  public set labelsController(controller: LabelsController | undefined) {
    if (this._labelsController === controller) return;
    this._labelsController = controller;
    this.subscriber.subscribe("labels", controller, () => {
      this.syncLabelFilter();
      this.requestUpdate();
    });
    this.syncLabelFilter();
    this.requestUpdate();
  }

  /**
   * クイックアクセス管理コントローラー
   */
  public get quickAccessController(): QuickAccessController | undefined {
    return this._quickAccessController;
  }

  @consume({ context: quickAccessContext, subscribe: true })
  @property({ attribute: false })
  public set quickAccessController(
    controller: QuickAccessController | undefined,
  ) {
    if (this._quickAccessController === controller) return;
    this._quickAccessController = controller;
    this.subscriber.subscribe("quickAccess", controller, () => {
      this.syncQuickAccessFilter();
      this.requestUpdate();
    });
    this.syncQuickAccessFilter();
    this.requestUpdate();
  }

  /**
   * ラベルコントローラーの選択ラベルIDをタスク一覧コントローラーへ同期する
   */
  private syncLabelFilter(): void {
    if (this.taskListController && this.labelsController) {
      this.taskListController.setLabelFilter(
        this.labelsController.selectedLabelId,
      );
    }
  }

  /**
   * クイックアクセスコントローラーの状態をタスク一覧コントローラーへ同期する
   */
  private syncQuickAccessFilter(): void {
    if (this.taskListController && this.quickAccessController) {
      this.taskListController.setQuickAccessFilter(
        this.quickAccessController.state,
      );
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.subscriber.unsubscribeAll();
  }

  /**
   * 表示対象の会計年度
   * デフォルトは現在日付に基づく当年度
   *
   * @type {number}
   * @memberof PaneTaskList
   */
  @property({ type: Number })
  public fiscalYear: number = getCurrentFiscalYear();

  /**
   * 現在有効な表示会計年度
   * コントローラーが接続されている場合はコントローラーの年度を優先
   *
   * @readonly
   * @type {number}
   * @memberof PaneTaskList
   */
  public get currentFiscalYear(): number {
    return this.taskListController?.fiscalYear ?? this.fiscalYear;
  }

  /**
   * 選択可能な会計年度リスト
   *
   * @readonly
   * @type {number[]}
   * @memberof PaneTaskList
   */
  public get fiscalYears(): number[] {
    return getFiscalYearRange();
  }

  /**
   * 表示対象のタスク一覧
   *
   * @type {TaskRecord[]}
   * @memberof PaneTaskList
   */
  @property({ type: Array })
  public tasks: TaskRecord[] = [];

  /**
   * 現在有効なタスク一覧
   * コントローラーが接続されている場合はコントローラーのタスク一覧を優先
   *
   * @readonly
   * @type {readonly TaskRecord[]}
   * @memberof PaneTaskList
   */
  public get currentTasks(): readonly TaskRecord[] {
    return this.taskListController?.state ?? this.tasks;
  }

  /**
   * 検索キーワード
   *
   * @type {string}
   * @memberof PaneTaskList
   */
  @property({ type: String })
  public searchKeyword: string = "";

  /**
   * 新規タスク作成ダイアログの開閉状態
   *
   * @type {boolean}
   * @memberof PaneTaskList
   */
  @state()
  public isCreateDialogOpen: boolean = false;

  /**
   * 新規タスク作成ダイアログを開く
   */
  public handleOpenCreateDialog = (): void => {
    this.isCreateDialogOpen = true;
  };

  /**
   * 新規タスク作成ダイアログを閉じる
   */
  public handleCloseCreateDialog = (): void => {
    this.isCreateDialogOpen = false;
  };

  /**
   * タスク作成完了イベントハンドラー
   */
  public handleTaskCreated = async (
    event?: CustomEvent<{ taskId?: number }>,
  ): Promise<void> => {
    this.isCreateDialogOpen = false;
    if (this.taskListController) {
      await this.taskListController.refresh();
      if (event?.detail?.taskId !== undefined) {
        await this.taskListController.selectTask(event.detail.taskId);
      }
    }
    this.requestUpdate();
  };

  /**
   * 検索入力ハンドラー（共通 search-input の search-input カスタムイベント）
   *
   * @param {CustomEvent<SearchInputEventDetail>} event
   * @memberof PaneTaskList
   */
  public handleSearchInput = async (
    event: CustomEvent<SearchInputEventDetail>,
  ): Promise<void> => {
    const keyword = event.detail?.keyword ?? "";
    this.searchKeyword = keyword;
    if (this.taskListController) {
      await this.taskListController.setSearchKeyword(keyword);
    }
    this.requestUpdate();
  };

  /**
   * 年度ドロップダウン選択ハンドラー
   *
   * @param {CustomEvent<{ item: { value: string } }>} event
   * @memberof PaneTaskList
   */
  public handleFiscalYearSelect = async (
    event: CustomEvent<{ item: { value: string } }>,
  ): Promise<void> => {
    const selectedYear = Number(event.detail?.item?.value);
    if (isNaN(selectedYear)) {
      return;
    }
    this.fiscalYear = selectedYear;
    if (this.taskListController) {
      await this.taskListController.setFiscalYear(selectedYear);
    }
    dispatchCustomEvent(this, "fiscal-year-change", {
      detail: { fiscalYear: selectedYear },
    });
    this.requestUpdate();
  };

  /**
   * ヘッダー部（タイトルおよび操作ボタン）を描画する
   */
  private renderHeader(): HTMLTemplateResult {
    const currentYear = this.currentFiscalYear;
    return html`
      <header class="pane-task-list__header">
        <span class="pane-task-list__title">LIST ${currentYear}</span>
        <div class="pane-task-list__actions">
          <wa-dropdown
            placement="bottom-start"
            @wa-select=${this.handleFiscalYearSelect}
          >
            <wa-tooltip
              for="pane-task-list-btn-year"
              placement="bottom"
              trigger="hover"
            >
              年度を選択
            </wa-tooltip>
            <wa-button
              id="pane-task-list-btn-year"
              class="pane-task-list__btn-year"
              slot="trigger"
              variant="neutral"
              appearance="plain"
              size="m"
            >
              <wa-icon
                library="my-icons"
                name="sliders-solid-full"
                label="年度を選択"
              ></wa-icon>
            </wa-button>
            ${this.fiscalYears.map(
              (fy) => html`
                <wa-dropdown-item
                  value="${fy}"
                  type="checkbox"
                  .checked=${currentYear === fy}
                  ?checked=${currentYear === fy}
                >
                  ${fy}年度
                </wa-dropdown-item>
              `,
            )}
          </wa-dropdown>

          <wa-tooltip
            for="pane-task-list-btn-add"
            placement="bottom"
            trigger="hover"
          >
            新規タスクを追加
          </wa-tooltip>
          <wa-button
            id="pane-task-list-btn-add"
            class="pane-task-list__btn-add"
            variant="neutral"
            appearance="plain"
            size="m"
            @click=${this.handleOpenCreateDialog}
          >
            <wa-icon
              library="my-icons"
              name="plus-solid-full"
              label="新規タスクを追加"
            ></wa-icon>
          </wa-button>
        </div>
      </header>
    `;
  }

  /**
   * 検索部（共通 search-input）を描画する
   */
  private renderSearch(): HTMLTemplateResult {
    return html`
      <div class="pane-task-list__search">
        <search-input
          class="pane-task-list__search-input"
          size="s"
          placeholder="Search..."
          .value=${this.searchKeyword}
          @search-input=${this.handleSearchInput}
        ></search-input>
      </div>
    `;
  }

  /**
   * 指定したラベルIDに対応するラベル名を取得する
   *
   * @param {(number | undefined)} labelId
   * @return {string}
   * @memberof PaneTaskList
   */
  public getLabelName(labelId?: number): string {
    if (labelId === undefined) {
      return "未分類";
    }
    const label = this.labelsController?.state.find((l) => l.id === labelId);
    return label?.name ?? "未分類";
  }

  /**
   * タスク選択ハンドラー
   *
   * @param {CustomEvent<{ taskId: number }>} event
   * @memberof PaneTaskList
   */
  public handleTaskSelect = async (
    event: CustomEvent<{ taskId: number }>,
  ): Promise<void> => {
    const taskId = event.detail?.taskId;
    if (taskId === undefined) {
      return;
    }
    if (this.taskListController) {
      await this.taskListController.selectTask(taskId);
    }
    if (this.taskController) {
      await this.taskController.setTaskId(taskId);
    }
    dispatchCustomEvent(this, "task-select", { detail: { taskId } });
  };

  /**
   * ブックマークトグルハンドラー
   *
   * @param {CustomEvent<{ taskId: number; bookmark: boolean }>} event
   * @memberof PaneTaskList
   */
  public handleBookmarkToggle = async (
    event: CustomEvent<{ taskId: number; bookmark: boolean }>,
  ): Promise<void> => {
    const detail = event.detail;
    if (detail?.taskId === undefined) {
      return;
    }
    if (this.taskListController) {
      await this.taskListController.toggleBookmark(
        detail.taskId,
        detail.bookmark,
      );
    }
    dispatchCustomEvent(this, "bookmark-toggle", { detail });
  };

  /**
   * リスト部（仮想スクロールまたは空状態）を描画する
   */
  private renderList(): HTMLTemplateResult {
    const tasks = this.currentTasks;
    if (tasks.length === 0) {
      return html`
        <div class="pane-task-list__list">
          <div class="pane-task-list__empty">タスクがありません</div>
        </div>
      `;
    }

    return html`
      <div class="pane-task-list__list">
        <lit-virtualizer
          class="pane-task-list__virtualizer"
          .items=${tasks}
          .renderItem=${(task: TaskRecord) => html`
            <task-list-item
              class="pane-task-list__item"
              data-task-id=${task.id ?? ""}
              .task=${task}
              .labelName=${this.getLabelName(task.labelId)}
              .issuesDone=${0}
              .issuesTotal=${0}
              @task-select=${this.handleTaskSelect}
              @bookmark-toggle=${this.handleBookmarkToggle}
            ></task-list-item>
          `}
        ></lit-virtualizer>
      </div>
    `;
  }

  override render(): HTMLTemplateResult {
    return html`
      <div class="pane-task-list">
        ${this.renderHeader()} ${this.renderSearch()} ${this.renderList()}
        <task-create-dialog
          ?open=${this.isCreateDialogOpen}
          .fiscalYear=${this.currentFiscalYear}
          data-theme=${this.getAttribute("data-theme") ?? ""}
          @dialog-close=${this.handleCloseCreateDialog}
          @task-created=${this.handleTaskCreated}
        ></task-create-dialog>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "pane-task-list": PaneTaskList;
  }
}

