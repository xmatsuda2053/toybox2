import { html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@shared/components";
import { format, getFiscalYearRange } from "@shared/utils";
import type { TaskRecord } from "@/db/models/task.model.js";
import {
  SubscriberElement,
  WithLabelsController,
  WithTaskController,
  WithIssuesController,
  WithNotesController,
  WithLogsController,
} from "@/utils/controller-consumers.mixin.js";
import styles from "./task-property.scss?inline";

/**
 * タスクプロパティコンポーネント (TaskProperty)
 *
 * Task ペイン（第4ペイン）の Property タブを担当し、
 * タスクの作成日時・更新日時の表示（編集不可）、
 * 年度・所属ラベルの確認・変更 UI（wa-select）、および
 * 子データ（Issues、Notes、Logs）の活動量・集計件数表示を提供する。
 *
 * @export
 * @class TaskProperty
 * @extends {WithIssuesController(WithNotesController(WithLogsController(WithLabelsController(WithTaskController(SubscriberElement)))))}
 */
@customElement("task-property")
export class TaskProperty extends WithIssuesController(
  WithNotesController(
    WithLogsController(
      WithLabelsController(WithTaskController(SubscriberElement)),
    ),
  ),
) {
  public static styles = unsafeCSS(styles);

  /**
   * カラーテーマ ("light" | "dark")
   */
  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  /**
   * 会計年度選択の直接更新ハンドラー
   */
  public handleSelectFiscalYear = async (fiscalYear: number): Promise<void> => {
    await this.taskController?.updateProperty({ fiscalYear });
  };

  /**
   * 会計年度変更イベントハンドラー
   */
  public onFiscalYearChange = async (e: Event): Promise<void> => {
    const target = e.target as HTMLElement & { value?: string };
    if (target?.value) {
      await this.handleSelectFiscalYear(Number(target.value));
    }
  };

  /**
   * 所属ラベル選択の直接更新ハンドラー
   */
  public handleSelectLabel = async (labelId: number): Promise<void> => {
    await this.taskController?.updateProperty({ labelId });
  };

  /**
   * 所属ラベル変更イベントハンドラー
   */
  public onLabelChange = async (e: Event): Promise<void> => {
    const target = e.target as HTMLElement & { value?: string };
    if (target?.value !== undefined && target.value !== "") {
      await this.handleSelectLabel(Number(target.value));
    }
  };

  /**
   * 空状態テンプレートの描画
   */
  private renderEmptyState(): HTMLTemplateResult {
    return html`
      <div class="task-property task-property--empty">
        <span>タスクが選択されていません</span>
      </div>
    `;
  }

  /**
   * 作成日時フィールドの描画
   */
  private renderCreatedAtField(task: TaskRecord): HTMLTemplateResult {
    const formattedCreatedAt = task.createdAt
      ? format(task.createdAt, "yyyy/MM/dd HH:mm:ss")
      : "";

    return html`
      <div class="task-property__field">
        <label class="task-property__label">作成日時</label>
        <div class="task-property__control">
          <wa-input
            class="task-property__input task-property__input--created-at"
            size="s"
            readonly
            .value=${formattedCreatedAt}
          >
            <wa-icon
              slot="start"
              library="my-icons"
              name="calendar-plus-solid-full"
              class="task-property__icon"
            ></wa-icon>
          </wa-input>
        </div>
      </div>
    `;
  }

  /**
   * 更新日時フィールドの描画
   */
  private renderUpdatedAtField(task: TaskRecord): HTMLTemplateResult {
    const formattedUpdatedAt = task.updatedAt
      ? format(task.updatedAt, "yyyy/MM/dd HH:mm:ss")
      : "";

    return html`
      <div class="task-property__field">
        <label class="task-property__label">更新日時</label>
        <div class="task-property__control">
          <wa-input
            class="task-property__input task-property__input--updated-at"
            size="s"
            readonly
            .value=${formattedUpdatedAt}
          >
            <wa-icon
              slot="start"
              library="my-icons"
              name="calendar-check-solid-full"
              class="task-property__icon"
            ></wa-icon>
          </wa-input>
        </div>
      </div>
    `;
  }

  /**
   * 年度フィールドの描画
   */
  private renderFiscalYearField(task: TaskRecord): HTMLTemplateResult {
    const fiscalYears = getFiscalYearRange();

    return html`
      <div class="task-property__field">
        <label class="task-property__label">年度</label>
        <div class="task-property__control">
          <wa-select
            class="task-property__select task-property__fiscal-year-select"
            size="s"
            .value=${String(task.fiscalYear)}
            @change=${this.onFiscalYearChange}
          >
            <wa-icon
              slot="start"
              library="my-icons"
              name="calendar-solid-full"
              class="task-property__icon"
            ></wa-icon>
            ${fiscalYears.map(
              (fy) =>
                html`<wa-option value=${String(fy)}>${fy}年度</wa-option>`,
            )}
          </wa-select>
        </div>
      </div>
    `;
  }

  /**
   * ラベルフィールドの描画
   */
  private renderLabelField(task: TaskRecord): HTMLTemplateResult {
    const labels = this.labelsController?.state ?? [];

    return html`
      <div class="task-property__field">
        <label class="task-property__label">ラベル</label>
        <div class="task-property__control">
          <wa-select
            class="task-property__select task-property__label-select"
            size="s"
            .value=${task.labelId !== undefined ? String(task.labelId) : ""}
            @change=${this.onLabelChange}
          >
            <wa-icon
              slot="start"
              library="my-icons"
              name="tag-solid-full"
              class="task-property__icon"
            ></wa-icon>
            ${labels.map(
              (label) =>
                html`<wa-option value=${String(label.id)}
                  >${label.name}</wa-option
                >`,
            )}
          </wa-select>
        </div>
      </div>
    `;
  }

  /**
   * 課題（Issues）件数フィールドの描画
   */
  private renderIssuesCountField(): HTMLTemplateResult {
    const issues = this.issuesController?.state ?? [];
    const total = issues.length;
    const uncompleted = issues.filter((issue) => issue.statusCode !== 9).length;
    const issuesText = `${total}件 (未完了 ${uncompleted}件)`;

    return html`
      <div class="task-property__field">
        <label class="task-property__label">課題</label>
        <div class="task-property__control">
          <wa-input
            class="task-property__input task-property__input--issues-count"
            size="s"
            readonly
            .value=${issuesText}
          >
            <wa-icon
              slot="start"
              library="my-icons"
              name="list-check-solid-full"
              class="task-property__icon"
            ></wa-icon>
          </wa-input>
        </div>
      </div>
    `;
  }

  /**
   * メモ（Notes）件数フィールドの描画
   */
  private renderNotesCountField(): HTMLTemplateResult {
    const notes = this.notesController?.state ?? [];
    const total = notes.length;
    const notesText = `${total}件`;

    return html`
      <div class="task-property__field">
        <label class="task-property__label">メモ</label>
        <div class="task-property__control">
          <wa-input
            class="task-property__input task-property__input--notes-count"
            size="s"
            readonly
            .value=${notesText}
          >
            <wa-icon
              slot="start"
              library="my-icons"
              name="pen-to-square-solid-full"
              class="task-property__icon"
            ></wa-icon>
          </wa-input>
        </div>
      </div>
    `;
  }

  /**
   * 履歴（Logs）件数フィールドの描画
   */
  private renderLogsCountField(): HTMLTemplateResult {
    const logs = this.logsController?.state ?? [];
    const total = logs.length;
    const logsText = `${total}件`;

    return html`
      <div class="task-property__field">
        <label class="task-property__label">履歴</label>
        <div class="task-property__control">
          <wa-input
            class="task-property__input task-property__input--logs-count"
            size="s"
            readonly
            .value=${logsText}
          >
            <wa-icon
              slot="start"
              library="my-icons"
              name="code-branch-solid-full"
              class="task-property__icon"
            ></wa-icon>
          </wa-input>
        </div>
      </div>
    `;
  }

  /**
   * メインレンダリング
   */
  public render(): HTMLTemplateResult {
    const task = this.taskController?.state;
    return task
      ? html`
          <div class="task-property">
            ${this.renderCreatedAtField(task)}
            ${this.renderUpdatedAtField(task)}
            ${this.renderIssuesCountField()}
            ${this.renderNotesCountField()}
            ${this.renderLogsCountField()}
            <wa-divider class="task-property__divider"></wa-divider>
            ${this.renderFiscalYearField(task)}
            ${this.renderLabelField(task)}
          </div>
        `
      : this.renderEmptyState();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "task-property": TaskProperty;
  }
}
