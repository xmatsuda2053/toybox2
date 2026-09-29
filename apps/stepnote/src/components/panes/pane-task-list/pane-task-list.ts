import { LitElement, html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@lit-labs/virtualizer";
import "@shared/components";
import { getCurrentFiscalYear } from "@shared/utils";
import type { TaskRecord } from "@/db/models/task.model";
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
   * 表示対象のタスク一覧
   *
   * @type {TaskRecord[]}
   * @memberof PaneTaskList
   */
  @property({ type: Array })
  public tasks: TaskRecord[] = [];

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
   * ヘッダー部（タイトルおよび操作ボタン）を描画する
   */
  private renderHeader(): HTMLTemplateResult {
    return html`
      <header class="pane-task-list__header">
        <span class="pane-task-list__title">LIST ${this.fiscalYear}</span>
        <div class="pane-task-list__actions">
          <wa-tooltip for="pane-task-list-btn-year" placement="bottom">
            年度を選択
          </wa-tooltip>
          <wa-button
            id="pane-task-list-btn-year"
            class="pane-task-list__btn-year"
            variant="neutral"
            appearance="plain"
            size="m"
          >
            <wa-icon
              library="my-icons"
              name="calendar-solid-full"
              label="年度を選択"
            ></wa-icon>
          </wa-button>

          <wa-tooltip for="pane-task-list-btn-add" placement="bottom">
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
    if (this.tasks.length === 0) {
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
          .items=${this.tasks}
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
          .fiscalYear=${this.fiscalYear}
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
