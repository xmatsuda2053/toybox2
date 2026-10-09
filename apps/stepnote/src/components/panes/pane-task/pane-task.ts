import { html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shared/components";
import type { TaskStatusCode } from "@/types";
import {
  TASK_STATUS_LIST,
  TASK_STATUS_MAP,
} from "@/constants/task-status.constants.js";
import {
  SubscriberElement,
  WithTaskController,
} from "@/utils/controller-consumers.mixin.js";
import "./task-summary.js";
import styles from "./pane-task.scss?inline";

/**
 * ステータスコードに応じたアイコン定義マップ
 */
const STATUS_ICON_MAP: Record<TaskStatusCode, string> = {
  0: "circle-stop-solid-full",
  5: "circle-play-solid-full",
  9: "circle-check-solid-full",
};

/**
 * ステータスコードに応じたタイプ名定義マップ
 */
const STATUS_TYPE_MAP: Record<TaskStatusCode, string> = {
  0: "pending",
  5: "progress",
  9: "done",
};

/**
 * タスクエリア（第4ペイン）コンテナコンポーネント (PaneTask)
 *
 * 画面第4ペインを担当し、タスクの基本ヘッダー（ID、ステータス、IDコピー）および
 * 3つのタブ（Summary, Property, Issues）のコンテナを提供する。
 *
 * @export
 * @class PaneTask
 * @extends {WithTaskController(SubscriberElement)}
 */
@customElement("pane-task")
export class PaneTask extends WithTaskController(SubscriberElement) {
  public static styles = unsafeCSS(styles);

  /**
   * カラーテーマ ("light" | "dark")
   */
  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  @state()
  public activeTab: string = "summary";

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
    return html`
      <wa-dropdown-item
        value=${String(status.code)}
        type="checkbox"
        ?checked=${status.code === currentCode}
        @click=${() => this.handleSelectStatus(status.code)}
      >
        <wa-icon
          slot="icon"
          library="my-icons"
          name=${STATUS_ICON_MAP[status.code]}
          class="pane-task__status-icon type-${STATUS_TYPE_MAP[status.code]}"
        ></wa-icon>
        ${status.labelJa}
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
    const currentIcon = STATUS_ICON_MAP[currentCode] ?? STATUS_ICON_MAP[0];
    const currentType = STATUS_TYPE_MAP[currentCode] ?? STATUS_TYPE_MAP[0];

    return html`
      <div class="pane-task__header-right">
        <wa-dropdown
          class="pane-task__status-dropdown"
          @wa-select=${(e: CustomEvent<{ item: { value: string } }>) =>
            this.handleSelectStatus(
              Number(e.detail.item.value) as TaskStatusCode,
            )}
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
        ${this.renderHeaderLeft()} ${this.renderStatusDropdown()}
      </div>
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
          <div class="pane-task__placeholder">
            <span>Issues タブは準備中です</span>
          </div>
        </wa-tab-panel>

        <wa-tab-panel name="property" class="pane-task__tab-panel">
          <div class="pane-task__placeholder">
            <span>Property タブは準備中です</span>
          </div>
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
      </div>
    `;
  }
}
