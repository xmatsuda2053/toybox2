import { html, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import appFooterStyles from "./app-footer.scss?inline";
import {
  formatStorageSize,
  getStorageEstimate,
  calculateTaskMetrics,
  formatTaskProgress,
  formatTaskProgressTooltip,
} from "./app-footer.utils.js";
import {
  SubscriberElement,
  WithTaskListController,
} from "../../utils/controller-consumers.mixin.js";
import type { TaskRecord } from "../../db/models/task.model.js";

/**
 * StepNote フッターコンポーネント (AppFooter)
 *
 * 画面最下部に位置し、データ保全・ストレージインジケーター（アイデア1）、
 * タスク進捗サマリー（アイデア2）、ショートカットヘルプ（アイデア5）を提供するステータスバー。
 *
 * @export
 * @class AppFooter
 * @extends {WithTaskListController(SubscriberElement)}
 */
@customElement("app-footer")
export class AppFooter extends WithTaskListController(SubscriberElement) {
  public static override styles = unsafeCSS(appFooterStyles);

  /**
   * 推定ストレージ使用量（バイト単位）
   */
  @property({ type: Number })
  public storageUsage?: number;

  /**
   * 表示対象の会計年度（未指定時は taskListController から取得）
   */
  @property({ type: Number })
  public fiscalYear?: number;

  /**
   * 総タスク件数（未指定時は taskListController から算出）
   */
  @property({ type: Number })
  public totalTaskCount?: number;

  /**
   * 表示中（フィルタリング後）のタスク件数
   */
  @property({ type: Number })
  public filteredTaskCount?: number;

  /**
   * 完了タスク件数
   */
  @property({ type: Number })
  public completedTaskCount?: number;

  /**
   * コンポーネントが DOM に接続された際のライフサイクルコールバック。
   */
  public override connectedCallback(): void {
    super.connectedCallback();
    void this.updateStorageUsage();
  }

  /**
   * ストレージ使用量を取得する（テストでモック・スパイ可能）。
   *
   * @returns 推定ストレージ使用量（bytes）
   */
  public async fetchStorageUsage(): Promise<number | undefined> {
    return getStorageEstimate();
  }

  /**
   * ストレージ使用量を非同期に取得してプロパティへ反映する。
   */
  public async updateStorageUsage(): Promise<void> {
    const usage = await this.fetchStorageUsage();
    if (usage !== undefined) {
      this.storageUsage = usage;
    }
  }

  /**
   * 有効な会計年度を取得する。
   */
  protected get effectiveFiscalYear(): number | undefined {
    return this.fiscalYear ?? this.taskListController?.fiscalYear;
  }

  /**
   * タスク進捗の集計メトリクスを取得する。
   */
  protected get effectiveTaskMetrics():
    | { filtered: number; total: number; completed: number; rate: number }
    | undefined {
    if (this.totalTaskCount !== undefined) {
      const total = this.totalTaskCount;
      const filtered = this.filteredTaskCount ?? total;
      const completed = this.completedTaskCount ?? 0;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { filtered, total, completed, rate };
    }

    if (!this.taskListController) {
      return undefined;
    }

    const ctrl = this.taskListController as unknown as {
      tasks?: readonly TaskRecord[];
    };
    const allTasks = ctrl.tasks ?? this.taskListController.state;
    const filteredTasks = this.taskListController.state ?? [];
    const metrics = calculateTaskMetrics(allTasks as TaskRecord[]);

    return {
      filtered: filteredTasks.length,
      total: metrics.total,
      completed: metrics.completed,
      rate: metrics.rate,
    };
  }

  /**
   * Saved インジケーターのレンダリング。
   */
  private renderSavedStatus() {
    return html`
      <span
        id="footer-status-saved"
        class="app-footer__status-item app-footer__status-item--saved"
      >
        <wa-icon
          library="my-icons"
          name="circle-check-solid-full"
          class="app-footer__icon app-footer__icon--success"
        ></wa-icon>
        <span class="app-footer__text">Saved</span>
      </span>
      <wa-tooltip for="footer-status-saved" placement="top" trigger="hover">
        データはローカルのIndexedDBに自動保存されています
      </wa-tooltip>
    `;
  }

  /**
   * ストレージ使用量インジケーターのレンダリング。
   */
  private renderStorageStatus(formattedStorage: string) {
    return html`
      <span
        id="footer-status-storage"
        class="app-footer__status-item app-footer__status-item--storage"
      >
        <wa-icon
          library="my-icons"
          name="database-solid-full"
          class="app-footer__icon"
        ></wa-icon>
        <span class="app-footer__text">${formattedStorage}</span>
      </span>
      <wa-tooltip for="footer-status-storage" placement="top" trigger="hover">
        IndexedDBの推定ストレージ使用量
      </wa-tooltip>
    `;
  }

  /**
   * 会計年度インジケーターのレンダリング。
   */
  private renderYearStatus(year: number) {
    return html`
      <span class="app-footer__divider">|</span>
      <span
        id="footer-status-year"
        class="app-footer__status-item app-footer__status-item--year"
      >
        <wa-icon
          library="my-icons"
          name="calendar-solid-full"
          class="app-footer__icon"
        ></wa-icon>
        <span class="app-footer__text">${year}</span>
      </span>
      <wa-tooltip for="footer-status-year" placement="top" trigger="hover">
        ${year}年度
      </wa-tooltip>
    `;
  }

  /**
   * タスク進捗カウンターのレンダリング。
   */
  private renderTaskProgressStatus(metrics: {
    filtered: number;
    total: number;
    completed: number;
    rate: number;
  }) {
    const text = formatTaskProgress(
      metrics.filtered,
      metrics.total,
      metrics.rate,
    );
    const tooltip = formatTaskProgressTooltip(
      metrics.filtered,
      metrics.total,
      metrics.completed,
      metrics.rate,
    );

    return html`
      <span class="app-footer__divider">|</span>
      <span
        id="footer-status-tasks"
        class="app-footer__status-item app-footer__status-item--tasks"
      >
        <wa-icon
          library="my-icons"
          name="list-check-solid-full"
          class="app-footer__icon"
        ></wa-icon>
        <span class="app-footer__text">${text}</span>
      </span>
      <wa-tooltip for="footer-status-tasks" placement="top" trigger="hover">
        ${tooltip}
      </wa-tooltip>
    `;
  }

  /**
   * 左ゾーン（コンテキスト・サマリー・データ保全）のレンダリング。
   */
  protected renderContextZone() {
    const formattedStorage = formatStorageSize(this.storageUsage);
    const year = this.effectiveFiscalYear;
    const metrics = this.effectiveTaskMetrics;

    return html`
      <div class="app-footer__context">
        ${this.renderSavedStatus()}
        <span class="app-footer__divider">|</span>
        ${this.renderStorageStatus(formattedStorage)}
        ${year !== undefined ? this.renderYearStatus(year) : ""}
        ${metrics !== undefined ? this.renderTaskProgressStatus(metrics) : ""}
        <slot name="context"></slot>
      </div>
    `;
  }

  /**
   * 中央ゾーン（アクティブタスク・タイマー）のレンダリング。
   */
  protected renderCenterZone() {
    return html`
      <div class="app-footer__center">
        <slot name="center"></slot>
      </div>
    `;
  }

  /**
   * 右ゾーン（システム状態・ショートカットヘルプ）のレンダリング。
   */
  protected renderSystemZone() {
    return html`
      <div class="app-footer__system">
        <slot name="system"></slot>
      </div>
    `;
  }

  public override render() {
    return html`
      <footer class="app-footer">
        ${this.renderContextZone()}
        ${this.renderCenterZone()}
        ${this.renderSystemZone()}
      </footer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-footer": AppFooter;
  }
}
