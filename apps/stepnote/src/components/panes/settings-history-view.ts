import { html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import "@shared/components";
import {
  SubscriberElement,
  WithTaskHistoryController,
} from "@/utils/controller-consumers.mixin.js";
import {
  TASK_HISTORY_MAX_COUNT_OPTIONS,
  DEFAULT_TASK_HISTORY_MAX_COUNT,
} from "@/types/domain/task-history.type.js";
import styles from "./settings-history-view.scss?inline";

/**
 * 設定画面用タスク閲覧履歴設定コンポーネント (SettingsHistoryView)
 *
 * 閲覧履歴の最大保持件数設定および履歴データの一括クリア機能を提供する。
 */
@customElement("settings-history-view")
export class SettingsHistoryView extends WithTaskHistoryController(
  SubscriberElement,
) {
  public static override styles = unsafeCSS(styles);

  /**
   * 履歴最大件数変更ハンドラー
   */
  public handleHistoryMaxCountChange = (e: Event): void => {
    const select = e.target as HTMLSelectElement | null;
    if (!select || !this.taskHistoryController) return;
    const value = parseInt(select.value, 10);
    if (!Number.isNaN(value)) {
      this.taskHistoryController.setMaxCount(value);
      this.requestUpdate();
    }
  };

  /**
   * 設定画面からの履歴クリアハンドラー
   */
  public handleClearHistorySettings = (): void => {
    if (!this.taskHistoryController) return;
    this.taskHistoryController.clear();
    this.requestUpdate();
  };

  /**
   * 閲覧履歴最大保持件数セクションの描画
   */
  private renderMaxCountSection(maxCount: number): HTMLTemplateResult {
    return html`
      <div class="settings-history-view__section">
        <h3 class="settings-history-view__section-title">閲覧履歴設定</h3>
        <p class="settings-history-view__section-desc">
          ヘッダーの閲覧履歴メニューに記録・表示するタスクの最大件数を設定します。
        </p>
        <div class="settings-history-view__form-row">
          <label
            for="settings-history-max-count"
            class="settings-history-view__form-label"
            >最大保持件数</label
          >
          <wa-select
            id="settings-history-max-count"
            size="s"
            .value=${String(maxCount)}
            @change=${this.handleHistoryMaxCountChange}
          >
            ${TASK_HISTORY_MAX_COUNT_OPTIONS.map(
              (opt) =>
                html`<wa-option value=${String(opt)}>${opt}件</wa-option>`,
            )}
          </wa-select>
        </div>
      </div>
    `;
  }

  /**
   * 履歴データ管理セクションの描画
   */
  private renderClearSection(currentCount: number): HTMLTemplateResult {
    return html`
      <div class="settings-history-view__section">
        <h3 class="settings-history-view__section-title">履歴データの管理</h3>
        <p class="settings-history-view__section-desc">
          現在記録されている閲覧履歴（${currentCount}件）を一括クリアします。
        </p>
        <wa-button
          variant="danger"
          size="s"
          class="settings-history-view__btn-clear"
          ?disabled=${currentCount === 0}
          @click=${this.handleClearHistorySettings}
        >
          <wa-icon library="my-icons" name="trash-solid-full"></wa-icon>
          閲覧履歴をクリア
        </wa-button>
      </div>
    `;
  }

  public override render(): HTMLTemplateResult {
    const maxCount =
      this.taskHistoryController?.maxCount ?? DEFAULT_TASK_HISTORY_MAX_COUNT;
    const currentCount = this.taskHistoryController?.history.length ?? 0;

    return html`
      <div class="settings-history-view__layout">
        ${this.renderMaxCountSection(maxCount)}
        ${this.renderClearSection(currentCount)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "settings-history-view": SettingsHistoryView;
  }
}
