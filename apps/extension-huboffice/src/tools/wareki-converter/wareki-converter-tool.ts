import { LitElement, html, nothing, unsafeCSS, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@shared/components";
import type { DatePickerChangeEventDetail } from "@shared/components";
import {
  buildCopyFormats,
  convertSeirekiToWareki,
  parseWarekiInput,
  type CopyFormatItem,
  type WarekiConversionValue,
} from "./wareki-converter.utils";
import styles from "./wareki-converter-tool.scss?inline";

/**
 * 西暦・和暦相互変換ツールコンポーネント
 */
@customElement("wareki-converter-tool")
export class WarekiConverterTool extends LitElement {
  static styles = [unsafeCSS(styles)];

  @state() private seirekiValue = "";
  @state() private warekiInput = "";
  @state() private result: WarekiConversionValue | null = null;
  @state() private errorMessage = "";

  private emitCopy(label: string, value: string): void {
    this.dispatchEvent(
      new CustomEvent<{ label: string; value: string }>(
        "huboffice-copy-request",
        {
          detail: { label, value },
          bubbles: true,
          composed: true,
        },
      ),
    );
  }

  private handleSeirekiChange(
    event: CustomEvent<DatePickerChangeEventDetail>,
  ): void {
    const isoDate = event.detail?.value ?? "";
    this.seirekiValue = isoDate;
    if (!isoDate) {
      this.warekiInput = "";
      this.result = null;
      this.errorMessage = "";
      return;
    }

    const converted = convertSeirekiToWareki(isoDate);
    if (!converted.ok) {
      this.result = null;
      this.errorMessage = converted.error;
      return;
    }

    this.result = converted.value;
    this.warekiInput = converted.value.warekiFull;
    this.errorMessage = "";
  }

  private handleWarekiInput(raw: string): void {
    this.warekiInput = raw;
    if (!raw.trim()) {
      this.seirekiValue = "";
      this.result = null;
      this.errorMessage = "";
      return;
    }

    const parsed = parseWarekiInput(raw);
    if (!parsed.ok) {
      this.result = null;
      this.seirekiValue = "";
      this.errorMessage = parsed.error;
      return;
    }

    this.result = parsed.value;
    this.seirekiValue = parsed.value.isoDate ?? "";
    this.errorMessage = "";
  }

  private renderNotices(): TemplateResult | typeof nothing {
    if (this.errorMessage) {
      return html`
        <wa-callout variant="danger" size="s">
          <wa-icon slot="icon" name="circle-exclamation-solid-full"></wa-icon>
          ${this.errorMessage}
        </wa-callout>
      `;
    }

    const warning = this.result?.warning;
    const note = this.result?.note;
    if (!warning && !note) {
      return nothing;
    }

    return html`
      ${
        warning
          ? html`
              <wa-callout variant="warning" size="s">
                <wa-icon
                  slot="icon"
                  name="triangle-exclamation-solid-full"
                ></wa-icon>
                ${warning}
              </wa-callout>
            `
          : nothing
      }
      ${
        note
          ? html`
              <wa-callout variant="neutral" size="s">
                <wa-icon slot="icon" name="circle-info-solid-full"></wa-icon>
                ${note}
              </wa-callout>
            `
          : nothing
      }
    `;
  }

  private renderCopyRow(item: CopyFormatItem): TemplateResult {
    return html`
      <button
        type="button"
        class="wareki-tool__copy-row"
        title="${item.label}をコピー"
        @click=${() => this.emitCopy(item.label, item.value)}
      >
        <span class="wareki-tool__copy-label">${item.label}</span>
        <span class="wareki-tool__copy-value">${item.value}</span>
        <wa-icon
          class="wareki-tool__copy-icon"
          name="copy-solid-full"
        ></wa-icon>
      </button>
    `;
  }

  private renderResultSection(): TemplateResult {
    if (!this.result) {
      return html`
        <p class="wareki-tool__hint">
          西暦カレンダー選択、または和暦入力（例: 令和8年11月27日 / R8.11.27 /
          R081127 / 令8年4月 / S55）で即座に変換します。
        </p>
      `;
    }

    const items = buildCopyFormats(this.result);
    return html`
      <section class="wareki-tool__results" aria-label="変換結果">
        <div class="wareki-tool__results-header">
          <h2 class="wareki-tool__section-heading">
            変換結果（クリックでコピー）
          </h2>
        </div>
        <div class="wareki-tool__copy-list">
          ${items.map((item) => this.renderCopyRow(item))}
        </div>
      </section>
    `;
  }

  override render(): TemplateResult {
    return html`
      <div class="wareki-tool">
        <section class="wareki-tool__inputs">
          <div class="wareki-tool__field">
            <label class="wareki-tool__label">西暦（カレンダー選択）</label>
            <datepicker-input
              size="m"
              placeholder="西暦日付を選択..."
              .value=${this.seirekiValue}
              @datepicker-change=${(
                e: CustomEvent<DatePickerChangeEventDetail>,
              ) => this.handleSeirekiChange(e)}
            ></datepicker-input>
          </div>

          <div class="wareki-tool__direction" aria-hidden="true">
            <span class="wareki-tool__direction-line"></span>
            <span class="wareki-tool__direction-badge">
              <wa-icon name="up-down-solid-full"></wa-icon>
            </span>
            <span class="wareki-tool__direction-line"></span>
          </div>

          <div class="wareki-tool__field">
            <label class="wareki-tool__label" for="wareki-text-input"
              >和暦（明治〜令和）</label
            >
            <wa-input
              id="wareki-text-input"
              size="m"
              placeholder="例: 令和8年11月27日 / R8.11.27 / R081127"
              .value=${this.warekiInput}
              with-clear
              @input=${(e: Event) => {
                const target = e.target as HTMLInputElement;
                this.handleWarekiInput(target.value);
              }}
              @wa-clear=${() => this.handleWarekiInput("")}
            ></wa-input>
          </div>
        </section>

        ${this.renderNotices()} ${this.renderResultSection()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wareki-converter-tool": WarekiConverterTool;
  }
}
