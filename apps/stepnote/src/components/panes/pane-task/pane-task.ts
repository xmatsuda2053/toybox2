import { html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shared/components";
import type { TaskStatusCode } from "@/types";
import {
  TASK_STATUS_LIST,
  TASK_STATUS_MAP,
  TASK_STATUS_ICON_MAP,
  TASK_STATUS_TYPE_MAP,
} from "@/constants/task-status.constants.js";
import {
  SubscriberElement,
  WithTaskController,
  WithIssuesController,
} from "@/utils/controller-consumers.mixin.js";
import "./task-summary.js";
import "./task-issues.js";
import "./task-property.js";
import styles from "./pane-task.scss?inline";


/**
 * タスクエリア（第4ペイン）コンテナコンポーネント (PaneTask)
 *
 * 画面第4ペインを担当し、タスクの基本ヘッダー（ID、ステータス、IDコピー）および
 * 3つのタブ（Summary, Property, Issues）のコンテナを提供する。
 *
 * @export
 * @class PaneTask
 * @extends {WithIssuesController(WithTaskController(SubscriberElement))}
 */
@customElement("pane-task")
export class PaneTask extends WithIssuesController(
  WithTaskController(SubscriberElement),
) {
  public static styles = unsafeCSS(styles);

  /**
   * カラーテーマ ("light" | "dark")
   */
  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  @state()
  public activeTab: string = "summary";

  @state()
  public canComplete: boolean = true;

  @state()
  public isDeleteDialogOpen: boolean = false;

  override willUpdate(changedProperties: Map<string, unknown>): void {
    super.willUpdate(changedProperties);
    void this.updateCanComplete();
  }

  /**
   * 完了可否状態を更新する
   */
  public updateCanComplete = async (): Promise<void> => {
    if (this.taskController?.canCompleteTask) {
      this.canComplete = await this.taskController.canCompleteTask();
    } else {
      this.canComplete = true;
    }
  };

  /**
   * IDとタスク名のクリップボードコピーハンドラー
   */
  public handleCopyId = async (): Promise<void> => {
    const task = this.taskController?.state;
    if (!task) return;

    const copyText = `#${task.id} ${task.name}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(copyText);
    }
  };

  /**
   * ステータス更新ハンドラー
   */
  public handleSelectStatus = async (code: TaskStatusCode): Promise<void> => {
    await this.taskController?.updateStatus(code);
  };

  /**
   * 削除確認ダイアログの開閉状態を設定
   */
  private setDeleteDialogOpen(open: boolean): void {
    this.isDeleteDialogOpen = open;
  }

  /**
   * 削除確認ダイアログを開く
   */
  public handleOpenDeleteDialog = (): void => {
    this.setDeleteDialogOpen(true);
  };

  /**
   * 削除確認ダイアログを閉じる
   */
  public handleCloseDeleteDialog = (): void => {
    this.setDeleteDialogOpen(false);
  };

  /**
   * タスク削除の確定ハンドラー
   */
  public handleConfirmDelete = async (): Promise<void> => {
    await this.taskController?.deleteTask();
    this.handleCloseDeleteDialog();
  };

  /**
   * ステータスドロップダウン選択ハンドラー
   */
  public handleDropdownSelect = async (value: string): Promise<void> => {
    if (value === "delete") {
      this.handleOpenDeleteDialog();
    } else {
      await this.handleSelectStatus(Number(value) as TaskStatusCode);
    }
  };

  /**
   * タブ切り替えハンドラー
   */
  public handleTabShow = (e: CustomEvent<{ name: string }>): void => {
    const tabName = e.detail?.name;
    if (tabName) {
      this.activeTab = tabName;
    }
  };

  /**
   * 空状態テンプレートの描画
   */
  private renderEmptyState(): HTMLTemplateResult {
    return html`
      <div class="pane-task__empty">
        <span>タスクが選択されていません</span>
      </div>
    `;
  }

  /**
   * ヘッダー左側（タスク識別子・コピーボタン）の描画
   */
  private renderHeaderLeft(): HTMLTemplateResult {
    const task = this.taskController?.state;
    return html`
      <div class="pane-task__header-left">
        <span
          class="pane-task__title"
          role="button"
          tabindex="0"
          title="クリックしてIDとタスク名をコピー"
          @click=${this.handleCopyId}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              this.handleCopyId();
            }
          }}
        >
          TASK #${task?.id}
        </span>
      </div>
    `;
  }

  /**
   * ステータス選択ドロップダウンの各アイテムを描画
   */
  private renderStatusDropdownItem(
    status: (typeof TASK_STATUS_LIST)[number],
    currentCode: TaskStatusCode,
  ): HTMLTemplateResult {
    const isDoneOption = status.code === 9;
    const isDisabled = isDoneOption && !this.canComplete;

    const item = html`
      <wa-dropdown-item
        value=${String(status.code)}
        type="checkbox"
        ?checked=${status.code === currentCode}
        ?disabled=${isDisabled}
        @click=${() => {
          if (!isDisabled) {
            this.handleSelectStatus(status.code);
          }
        }}
      >
        <wa-icon
          slot="icon"
          library="my-icons"
          name=${TASK_STATUS_ICON_MAP[status.code]}
          class="pane-task__status-icon type-${TASK_STATUS_TYPE_MAP[status.code]}"
        ></wa-icon>
        ${status.labelJa}
      </wa-dropdown-item>
    `;

    if (isDisabled) {
      return html`
        <wa-tooltip placement="left" trigger="hover">
          <span slot="content">未完了のIssueが存在するため完了にできません</span>
          ${item}
        </wa-tooltip>
      `;
    }

    return item;
  }

  /**
   * ドロップダウン内の削除項目の描画
   */
  private renderDropdownDeleteAction(): HTMLTemplateResult {
    return html`
      <wa-divider></wa-divider>
      <wa-dropdown-item
        value="delete"
        variant="danger"
        type="checkbox"
        @click=${() => this.handleOpenDeleteDialog()}
      >
        <wa-icon
          slot="icon"
          library="my-icons"
          name="trash-solid-full"
          class="pane-task__status-icon"
        ></wa-icon>
        削除
      </wa-dropdown-item>
    `;
  }

  /**
   * ステータス切り替えUI（GitHub Issue風ドロップダウン）の描画
   */
  private renderStatusDropdown(): HTMLTemplateResult {
    const task = this.taskController?.state;
    const currentCode = (task?.statusCode ?? 0) as TaskStatusCode;
    const currentStatus = TASK_STATUS_MAP[currentCode] ?? TASK_STATUS_MAP[0];
    const currentIcon =
      TASK_STATUS_ICON_MAP[currentCode] ?? TASK_STATUS_ICON_MAP[0];
    const currentType =
      TASK_STATUS_TYPE_MAP[currentCode] ?? TASK_STATUS_TYPE_MAP[0];

    return html`
      <div class="pane-task__header-right">
        <wa-dropdown
          class="pane-task__status-dropdown"
          @wa-select=${(e: CustomEvent<{ item: { value: string } }>) =>
            this.handleDropdownSelect(e.detail.item.value)}
        >
          <wa-button
            slot="trigger"
            class="pane-task__status"
            variant="neutral"
            size="s"
            with-caret
            caret
          >
            <wa-icon
              slot="start"
              library="my-icons"
              name=${currentIcon}
              class="pane-task__status-icon type-${currentType}"
            ></wa-icon>
            ${currentStatus.labelJa}
          </wa-button>
          ${TASK_STATUS_LIST.map((status) =>
            this.renderStatusDropdownItem(status, currentCode),
          )}
          ${this.renderDropdownDeleteAction()}
        </wa-dropdown>
      </div>
    `;
  }

  /**
   * ヘッダー部の描画
   */
  private renderHeader(): HTMLTemplateResult {
    return html`
      <div class="pane-task__header">
        ${this.renderHeaderLeft()}
        ${this.activeTab === "summary" ? this.renderStatusDropdown() : null}
      </div>
    `;
  }

  /**
   * 削除確認ダイアログの描画
   */
  private renderDeleteDialog(): HTMLTemplateResult {
    return html`
      <wa-dialog
        class="pane-task__delete-dialog"
        label="タスクの削除確認"
        ?open=${this.isDeleteDialogOpen}
        @wa-after-hide=${this.handleCloseDeleteDialog}
      >
        <div class="pane-task__delete-dialog-body">
          このタスクを削除してもよろしいですか？<br />
          ※この操作は取り消せません。
        </div>
        <div slot="footer" class="pane-task__delete-dialog-footer">
          <wa-button
            variant="neutral"
            appearance="plain"
            size="s"
            @click=${this.handleCloseDeleteDialog}
          >
            キャンセル
          </wa-button>
          <wa-button
            variant="danger"
            size="s"
            @click=${this.handleConfirmDelete}
          >
            削除
          </wa-button>
        </div>
      </wa-dialog>
    `;
  }

  /**
   * タブ領域の描画
   */
  private renderTabGroup(): HTMLTemplateResult {
    return html`
      <wa-tab-group
        class="pane-task__tab-group"
        active=${this.activeTab}
        @wa-tab-show=${this.handleTabShow}
      >
        <wa-tab slot="nav" panel="summary">Summary</wa-tab>
        <wa-tab slot="nav" panel="issues">Issues</wa-tab>
        <wa-tab slot="nav" panel="property">Property</wa-tab>

        <wa-tab-panel name="summary" class="pane-task__tab-panel">
          <task-summary .theme=${this.theme}></task-summary>
        </wa-tab-panel>

        <wa-tab-panel name="issues" class="pane-task__tab-panel">
          <task-issues .theme=${this.theme}></task-issues>
        </wa-tab-panel>

        <wa-tab-panel name="property" class="pane-task__tab-panel">
          <task-property .theme=${this.theme}></task-property>
        </wa-tab-panel>
      </wa-tab-group>
    `;
  }

  /**
   * メインレンダリング
   */
  public render(): HTMLTemplateResult {
    const task = this.taskController?.state;
    if (!task) {
      return this.renderEmptyState();
    }

    return html`
      <div class="pane-task">
        ${this.renderHeader()} ${this.renderTabGroup()}
        ${this.renderDeleteDialog()}
      </div>
    `;
  }
}
