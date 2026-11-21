import { html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@shared/components";
import {
  SubscriberElement,
  WithAutoExportController,
} from "@/utils/controller-consumers.mixin.js";
import styles from "./settings-auto-export-view.scss?inline";

/**
 * 設定画面用自動エクスポート設定コンポーネント (SettingsAutoExportView)
 *
 * 自動エクスポートの有効/無効切り替え、実行スケジュールの登録・削除、
 * および手動バックアップエクスポート機能を提供する。
 */
@customElement("settings-auto-export-view")
export class SettingsAutoExportView extends WithAutoExportController(
  SubscriberElement,
) {
  public static override styles = unsafeCSS(styles);

  /** 新規スケジュール時刻入力フォーム値 */
  @state()
  public newScheduleTimeInput: string = "";

  /**
   * 自動エクスポートの有効/無効切り替えハンドラー
   */
  public handleToggleAutoExport = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    this.autoExportController?.setEnabled(target.checked);
  };

  /**
   * スケジュール時刻の新規追加ハンドラー
   */
  public handleAddScheduleTime = (): void => {
    if (!this.newScheduleTimeInput || !this.autoExportController) return;
    const added = this.autoExportController.addScheduleTime(
      this.newScheduleTimeInput,
    );
    if (added) {
      this.newScheduleTimeInput = "";
    }
  };

  /**
   * スケジュール時刻の削除ハンドラー
   */
  public handleRemoveScheduleTime = (time: string): void => {
    this.autoExportController?.removeScheduleTime(time);
  };

  /**
   * 手動エクスポート実行ハンドラー
   */
  public handleTriggerManualExport = async (): Promise<void> => {
    await this.autoExportController?.triggerManualExport();
  };

  /**
   * 自動エクスポートヘッダー（スイッチ・説明）の描画
   */
  private renderAutoExportHeader(enabled: boolean): HTMLTemplateResult {
    return html`
      <div class="settings-auto-export-view__section">
        <wa-switch
          class="settings-auto-export-view__switch"
          ?checked=${enabled}
          @change=${this.handleToggleAutoExport}
        >
          自動エクスポートを有効にする
        </wa-switch>
        <span class="settings-auto-export-view__desc">
          ブラウザを開いている間に、指定した時刻になると全データのJSONバックアップを自動的にエクスポート・ダウンロードします。
        </span>
      </div>
    `;
  }

  /**
   * スケジュール時刻アイテムの描画
   */
  private renderScheduleItem(time: string): HTMLTemplateResult {
    return html`
      <div class="settings-auto-export-view__schedule-item">
        <span class="settings-auto-export-view__schedule-time">${time}</span>
        <wa-button
          variant="danger"
          appearance="plain"
          size="s"
          title="時刻を削除"
          aria-label="時刻を削除"
          @click=${() => this.handleRemoveScheduleTime(time)}
        >
          <wa-icon library="my-icons" name="trash-solid-full"></wa-icon>
        </wa-button>
      </div>
    `;
  }

  /**
   * スケジュール時刻リストの描画
   */
  private renderScheduleTimesList(times: string[]): HTMLTemplateResult {
    return html`
      <div class="settings-auto-export-view__schedule-list">
        ${times.length === 0
          ? html`<div class="settings-auto-export-view__placeholder">
              時刻が登録されていません。
            </div>`
          : times.map((t) => this.renderScheduleItem(t))}
      </div>
    `;
  }

  /**
   * スケジュール時刻追加フォームの描画
   */
  private renderScheduleTimeForm(): HTMLTemplateResult {
    const canAdd = Boolean(this.newScheduleTimeInput);
    const variant = canAdd ? "brand" : "neutral";
    const appearance = canAdd ? "accent" : "plain";
    const buttonClass = canAdd
      ? "settings-auto-export-view__btn-add-time settings-auto-export-view__btn-add-time--active"
      : "settings-auto-export-view__btn-add-time";

    return html`
      <div class="settings-auto-export-view__schedule-form">
        <wa-time-input
          size="s"
          hour-format="24"
          class="settings-auto-export-view__time-input"
          .value=${this.newScheduleTimeInput}
          @input=${(e: Event) => {
            this.newScheduleTimeInput = (e.target as HTMLInputElement).value;
          }}
          @change=${(e: Event) => {
            this.newScheduleTimeInput = (e.target as HTMLInputElement).value;
          }}
        ></wa-time-input>
        <wa-tooltip
          for="settings-auto-export-add-btn"
          placement="bottom"
          trigger="hover"
        >
          時刻を追加
        </wa-tooltip>
        <wa-button
          id="settings-auto-export-add-btn"
          variant="${variant}"
          appearance="${appearance}"
          size="s"
          class="${buttonClass}"
          title="時刻を追加"
          aria-label="時刻を追加"
          ?disabled=${!canAdd}
          @click=${this.handleAddScheduleTime}
        >
          <wa-icon library="my-icons" name="plus-solid-full"></wa-icon>
        </wa-button>
      </div>
    `;
  }

  /**
   * エクスポートステータス・手動実行の描画
   */
  private renderAutoExportStatus(lastExportedAt?: string): HTMLTemplateResult {
    const lastDisplay = lastExportedAt
      ? new Date(lastExportedAt).toLocaleString()
      : "未実行";

    return html`
      <div class="settings-auto-export-view__export-status">
        <div class="settings-auto-export-view__export-status-info">
          <span class="settings-auto-export-view__export-status-label"
            >最終実行日時:</span
          >
          <span class="settings-auto-export-view__export-status-value"
            >${lastDisplay}</span
          >
        </div>
        <wa-button
          variant="brand"
          appearance="accent"
          size="s"
          class="settings-auto-export-view__btn-manual-export"
          @click=${this.handleTriggerManualExport}
        >
          <wa-icon
            slot="prefix"
            library="my-icons"
            name="floppy-disk-regular-full"
          ></wa-icon>
          今すぐエクスポートを実行
        </wa-button>
      </div>
    `;
  }

  public override render(): HTMLTemplateResult {
    const settings = this.autoExportController?.state ?? {
      enabled: false,
      scheduleTimes: [],
    };

    return html`
      <div class="settings-auto-export-view__layout">
        <div class="settings-auto-export-view__main">
          ${this.renderAutoExportHeader(settings.enabled)}
          ${this.renderAutoExportStatus(settings.lastExportedAt)}
        </div>
        <div class="settings-auto-export-view__schedule-pane">
          <div class="settings-auto-export-view__schedule-header">
            <span class="settings-auto-export-view__section-title"
              >実行スケジュール</span
            >
            <span class="settings-auto-export-view__schedule-count"
              >${settings.scheduleTimes.length}件</span
            >
          </div>
          ${this.renderScheduleTimeForm()}
          ${this.renderScheduleTimesList(settings.scheduleTimes)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "settings-auto-export-view": SettingsAutoExportView;
  }
}
