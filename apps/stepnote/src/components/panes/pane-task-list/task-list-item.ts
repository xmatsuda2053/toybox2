import { LitElement, html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@shared/components";
import {
  format,
  isOverdue,
  isAsap,
  isWithinAnyDaysBefore,
  dispatchCustomEvent,
} from "@shared/utils";
import type { TaskRecord } from "@/db/models/task.model";
import taskListItemStyles from "./task-list-item.scss?inline";

/**
 * タスク一覧アイテム（カード）コンポーネント (TaskListItem)
 *
 * Task List ペインの仮想スクロール内に描画される単一タスクカード。
 * 3行構成（1行目: ステータス・タスク名、2行目: ラベル名、3行目: ブックマーク・期限・Issue進捗）
 * のレイアウトを提供し、選択やブックマークのトグル操作を管理する。
 *
 * @export
 * @class TaskListItem
 * @extends {LitElement}
 */
@customElement("task-list-item")
export class TaskListItem extends LitElement {
  public static override styles = unsafeCSS(taskListItemStyles);

  /**
   * 表示対象のタスクレコード
   *
   * @type {TaskRecord}
   * @memberof TaskListItem
   */
  @property({ type: Object })
  public task?: TaskRecord;

  /**
   * 所属ラベル名
   *
   * @type {string}
   * @memberof TaskListItem
   */
  @property({ type: String })
  public labelName: string = "";

  /**
   * 完了Issue数
   *
   * @type {number}
   * @memberof TaskListItem
   */
  @property({ type: Number })
  public issuesDone: number = 0;

  /**
   * 総Issue数
   *
   * @type {number}
   * @memberof TaskListItem
   */
  @property({ type: Number })
  public issuesTotal: number = 0;

  /**
   * カード本体クリックハンドラー（タスク選択）
   */
  public handleCardClick = (): void => {
    if (this.task?.id !== undefined) {
      dispatchCustomEvent(this, "task-select", {
        detail: { taskId: this.task.id },
      });
    }
  };

  /**
   * ブックマークボタントグルハンドラー
   *
   * @param {MouseEvent} event
   */
  public handleBookmarkClick = (event: MouseEvent): void => {
    event.stopPropagation();
    if (this.task?.id !== undefined) {
      dispatchCustomEvent(this, "bookmark-toggle", {
        detail: { taskId: this.task.id, bookmark: Boolean(this.task.bookmark) },
      });
    }
  };

  /**
   * ステータスコードに応じたアイコン名を取得する
   */
  private getStatusIconName(): string {
    const code = this.task?.statusCode ?? 0;
    switch (code) {
      case 9:
        return "circle-check-solid-full";
      case 5:
        return "circle-play-solid-full";
      case 0:
      default:
        return "circle-stop-solid-full";
    }
  }

  /**
   * ステータスコードに応じた修飾子クラス名を取得する
   */
  private getStatusModifierClass(): string {
    const code = this.task?.statusCode ?? 0;
    switch (code) {
      case 9:
        return "task-list-item__status-icon--done";
      case 5:
        return "task-list-item__status-icon--progress";
      case 0:
      default:
        return "task-list-item__status-icon--pending";
    }
  }

  /**
   * 期限の状態に応じたアイコン名を取得する
   */
  private getDueIconName(): string {
    if (!this.task?.dueDate) {
      return "calendar-solid-full";
    }
    const dueDate = new Date(this.task.dueDate);
    if (isOverdue(dueDate)) {
      return "fire-solid-full";
    }
    if (isAsap(dueDate)) {
      return "triangle-exclamation-solid-full";
    }
    if (isWithinAnyDaysBefore(dueDate, 3)) {
      return "calendar-solid-full";
    }
    return "calendar-solid-full";
  }

  /**
   * 期限の状態に応じた修飾子クラス名を取得する
   */
  private getDueModifierClass(): string {
    if (!this.task?.dueDate) {
      return "";
    }
    const dueDate = new Date(this.task.dueDate);
    if (isOverdue(dueDate)) {
      return "task-list-item__due-icon--overdue";
    }
    if (isAsap(dueDate)) {
      return "task-list-item__due-icon--asap";
    }
    if (isWithinAnyDaysBefore(dueDate, 3)) {
      return "task-list-item__due-icon--upcoming";
    }
    return "";
  }

  /**
   * yy-MM-dd 形式でフォーマットされた期限日を取得する
   */
  private getFormattedDueDate(): string {
    if (!this.task?.dueDate) {
      return "";
    }
    const fullDate = format(new Date(this.task.dueDate), "yyyy-MM-dd");
    return fullDate.slice(2);
  }

  override render(): HTMLTemplateResult {
    const task = this.task;
    const isSelected = Boolean(task?.selected);
    const isBookmarked = Boolean(task?.bookmark);
    const labelText = this.labelName.trim() || "未分類";

    const statusIcon = this.getStatusIconName();
    const statusModifier = this.getStatusModifierClass();
    const dueIcon = this.getDueIconName();
    const dueModifier = this.getDueModifierClass();
    const dueDateStr = this.getFormattedDueDate();

    return html`
      <div
        class="task-list-item ${isSelected ? "task-list-item--selected" : ""}"
        role="button"
        tabindex="0"
        @click=${this.handleCardClick}
      >
        <!-- 1行目: ステータスアイコン、タスク名、Issue件数 -->
        <div class="task-list-item__row task-list-item__row--header">
          <wa-icon
            class="task-list-item__status-icon ${statusModifier}"
            library="my-icons"
            name=${statusIcon}
          ></wa-icon>
          <span class="task-list-item__title" title=${task?.name ?? ""}>
            ${task?.name ?? ""}
          </span>
          <span class="task-list-item__issues-progress">
            ${this.issuesDone}/${this.issuesTotal}
          </span>
        </div>

        <!-- 2行目: ブックマークボタン、期限日および期限状態、所属ラベル -->
        <div class="task-list-item__row task-list-item__row--meta">
          <button
            type="button"
            class="task-list-item__btn-bookmark ${isBookmarked
              ? "task-list-item__btn-bookmark--active"
              : ""}"
            title=${isBookmarked ? "ブックマーク解除" : "ブックマーク追加"}
            @click=${this.handleBookmarkClick}
          >
            <wa-icon
              class="task-list-item__bookmark-icon ${isBookmarked
                ? "task-list-item__bookmark-icon--active"
                : ""}"
              library="my-icons"
              name="bookmark-solid-full"
            ></wa-icon>
          </button>

          <wa-divider
            orientation="vertical"
            class="task-list-item__divider"
          ></wa-divider>

          <span class="task-list-item__due-date">${dueDateStr}</span>
          <wa-icon
            class="task-list-item__due-icon ${dueModifier}"
            library="my-icons"
            name=${dueIcon}
          ></wa-icon>

          <wa-divider
            orientation="vertical"
            class="task-list-item__divider"
          ></wa-divider>

          <span class="task-list-item__label" title=${labelText}>
            ${labelText}
          </span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "task-list-item": TaskListItem;
  }
}
