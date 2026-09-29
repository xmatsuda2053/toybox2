import { LitElement, html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import "@lit-labs/virtualizer";
import "@shared/components";
import {
  getCurrentFiscalYear,
  getFiscalYearRange,
  dispatchCustomEvent,
} from "@shared/utils";
import type { TaskRecord } from "@/db/models/task.model";
import { taskListContext } from "@/contexts/index.js";
import type { TaskListController } from "@/controllers/task-list.controller.js";
import { ControllerSubscriber } from "@/utils/controller-subscriber.js";
import "./task-create-dialog.js";
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
    this.requestUpdate();
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
  public handleTaskCreated = (): void => {
    this.isCreateDialogOpen = false;
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
        ></search-input>
      </div>
    `;
  }

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
            <div class="pane-task-list__item" data-task-id=${task.id ?? ""}>
              ${task.name}
            </div>
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

