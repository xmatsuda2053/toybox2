import { html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { dispatchCustomEvent } from "@shared/utils";
import taskHistoryMenuStyles from "./task-history-menu.scss?inline";
import {
  SubscriberElement,
  WithTaskHistoryController,
  WithLabelsController,
} from "../../utils/controller-consumers.mixin.js";
import type { TaskHistoryViewItem } from "../../types/domain/task-history.type.js";
import { buildTaskHistoryViewItems } from "../../utils/task-history.utils.js";
import type { TaskRepository } from "../../repositories/task.repository.js";
import type { TaskRecord } from "../../db/models/task.model.js";
import type { LabelRecord } from "../../db/models/navigation.model.js";

/**
 * タスク閲覧履歴メニューコンポーネント (TaskHistoryMenu)
 *
 * ヘッダーに配置され、直近開いたタスクの履歴リストをドロップダウン表示して
 * 目的のタスクへ素早くジャンプ・さかのぼる機能を提供する。
 *
 * @export
 * @class TaskHistoryMenu
 * @extends {WithLabelsController(WithTaskHistoryController(SubscriberElement))}
 */
@customElement("task-history-menu")
export class TaskHistoryMenu extends WithLabelsController(
  WithTaskHistoryController(SubscriberElement),
) {
  public static override styles = unsafeCSS(taskHistoryMenuStyles);

  /** カラーテーマ ("light" | "dark") */
  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  /** タスクリポジトリ参照（外部注入可能） */
  public taskRepository?: TaskRepository;

  /** 表示用の履歴アイテム一覧 */
  @state()
  public viewItems: TaskHistoryViewItem[] = [];

  public override connectedCallback(): void {
    super.connectedCallback();
    if (this.taskHistoryController) {
      this.subscriber.subscribe(
        "task-history-menu",
        this.taskHistoryController,
        () => {
          void this.refreshViewItems();
        },
      );
    }
    void this.refreshViewItems();
  }

  /**
   * DBおよびコントローラーからタスク情報を取得し、表示用アイテム一覧を更新する
   */
  public async refreshViewItems(): Promise<void> {
    const history = this.taskHistoryController?.history ?? [];
    if (history.length === 0) {
      this.viewItems = [];
      return;
    }

    if (!this.taskRepository) {
      return;
    }

    const taskIds = history.map((item) => item.taskId);
    const tasksMap = new Map<number, TaskRecord>();
    for (const id of taskIds) {
      try {
        const task = await this.taskRepository.getById(id);
        if (task) tasksMap.set(id, task);
      } catch {
        // 取得失敗時は無視
      }
    }

    const labelsMap = new Map<number, LabelRecord>();
    for (const label of this.labelsController?.state ?? []) {
      if (label.id !== undefined) labelsMap.set(label.id, label);
    }

    this.viewItems = buildTaskHistoryViewItems(history, tasksMap, labelsMap);
  }

  /**
   * ドロップダウン展開時のハンドラー
   */
  public handleDropdownShow = (): void => {
    void this.refreshViewItems();
  };

  /**
   * ドロップダウンアイテム選択ハンドラー
   *
   * @param {CustomEvent<{ item: { value?: string } }>} e 選択イベント
   */
  public handleDropdownSelect = (
    e: CustomEvent<{ item: { value?: string } }>,
  ): void => {
    const value = e.detail?.item?.value;
    if (!value) return;

    if (value === "clear") {
      this.handleClearHistory();
      return;
    }

    const taskId = parseInt(value, 10);
    if (!Number.isNaN(taskId)) {
      this.handleTaskItemClick(taskId);
    }
  };

  /**
   * 履歴アイテムクリックハンドラー
   *
   * @param {number} taskId 対象のタスクID
   */
  public handleTaskItemClick(taskId: number): void {
    dispatchCustomEvent(this, "task-history-select", { detail: { taskId } });
  }

  /**
   * 履歴クリアハンドラー
   */
  public handleClearHistory = (): void => {
    this.taskHistoryController?.clear();
    this.viewItems = [];
  };

  /**
   * トリガーボタンのレンダリング
   */
  private renderTriggerButton(): HTMLTemplateResult {
    return html`
      <wa-button
        slot="trigger"
        id="btn-task-history"
        variant="neutral"
        appearance="plain"
        size="s"
        class="task-history-menu__trigger"
        aria-label="閲覧履歴"
      >
        <wa-icon
          library="my-icons"
          name="clock-rotate-left-solid-full"
        ></wa-icon>
      </wa-button>
      <wa-tooltip for="btn-task-history" placement="bottom" trigger="hover">
        閲覧履歴
      </wa-tooltip>
    `;
  }

  /**
   * 履歴一覧アイテムのレンダリング
   */
  private renderHistoryItems(): HTMLTemplateResult {
    if (this.viewItems.length === 0) {
      return html`
        <wa-dropdown-item disabled class="task-history-menu__empty">
          履歴はありません
        </wa-dropdown-item>
      `;
    }

    return html`
      ${repeat(
        this.viewItems,
        (item) => item.taskId,
        (item) => html`
          <wa-dropdown-item
            value="${String(item.taskId)}"
            class="task-history-menu__item"
          >
            ${item.title}
            ${item.labelName
              ? html`<span
                  slot="details"
                  class="task-history-menu__item-label"
                  >${item.labelName}</span
                >`
              : ""}
          </wa-dropdown-item>
        `,
      )}
      <wa-divider class="task-history-menu__divider"></wa-divider>
      <wa-dropdown-item
        value="clear"
        variant="danger"
        class="task-history-menu__clear-item"
      >
        <wa-icon
          library="my-icons"
          name="trash-solid-full"
          slot="icon"
        ></wa-icon>
        履歴をクリア
      </wa-dropdown-item>
    `;
  }

  public override render(): HTMLTemplateResult {
    return html`
      <div class="task-history-menu">
        <wa-dropdown
          placement="bottom-end"
          class="task-history-menu__dropdown"
          @wa-show=${this.handleDropdownShow}
          @wa-select=${this.handleDropdownSelect}
        >
          ${this.renderTriggerButton()} ${this.renderHistoryItems()}
        </wa-dropdown>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "task-history-menu": TaskHistoryMenu;
  }
}
