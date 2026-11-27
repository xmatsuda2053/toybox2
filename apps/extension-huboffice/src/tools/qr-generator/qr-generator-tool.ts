import { LitElement, html, nothing, unsafeCSS, type TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import type WaQrCode from "@awesome.me/webawesome/dist/components/qr-code/qr-code.js";
import { triggerBlobDownload } from "../../utils/download.utils";
import {
  QR_ERROR_CORRECTION_LEVEL,
  QR_MAX_UTF8_BYTES,
  QR_SIZE_PRESETS,
  buildQrFilename,
  exportQrPngBlob,
  validateQrInput,
  type QrSizePreset,
} from "./qr-generator.utils";
import styles from "./qr-generator-tool.scss?inline";

const PREVIEW_QR_SIZE = 192;

/**
 * QRコード生成ツールコンポーネント（S/M/L PNG ダウンロード・画像クリップボードコピー対応）
 */
@customElement("qr-generator-tool")
export class QrGeneratorTool extends LitElement {
  static styles = [unsafeCSS(styles)];

  @state() private inputText = "";
  @query("#qr-preview-code") private qrElement?: WaQrCode;

  private emitToast(message: string): void {
    this.dispatchEvent(
      new CustomEvent<{ message: string }>("huboffice-toast", {
        detail: { message },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private getSourceCanvas(): HTMLCanvasElement | null {
    return this.qrElement?.shadowRoot?.querySelector("canvas") ?? null;
  }

  private async handleDownload(preset: QrSizePreset): Promise<void> {
    const source = this.getSourceCanvas();
    if (!source) {
      this.emitToast("QRコードの生成を待ってから再度お試しください。");
      return;
    }

    try {
      const blob = await exportQrPngBlob(source, preset.size);
      const filename = buildQrFilename(preset.size);
      triggerBlobDownload(filename, blob);
      this.emitToast(`${preset.label}（${preset.size}px）を保存しました。`);
    } catch {
      this.emitToast("QRコード画像の保存に失敗しました。");
    }
  }

  private async handleCopyImage(preset: QrSizePreset): Promise<void> {
    const source = this.getSourceCanvas();
    if (!source) {
      this.emitToast("QRコードの生成を待ってから再度お試しください。");
      return;
    }

    if (
      typeof ClipboardItem === "undefined" ||
      typeof navigator.clipboard?.write !== "function"
    ) {
      this.emitToast(
        "この環境では画像のクリップボードコピーに対応していません。",
      );
      return;
    }

    try {
      const blob = await exportQrPngBlob(source, preset.size);
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      this.emitToast(
        `${preset.label}（${preset.size}px）の画像をコピーしました。`,
      );
    } catch {
      this.emitToast("画像のクリップボードコピーに失敗しました。");
    }
  }

  private renderSizeRow(preset: QrSizePreset): TemplateResult {
    return html`
      <div class="qr-tool__size-row">
        <div class="qr-tool__size-meta">
          <span class="qr-tool__size-badge">${preset.label}</span>
          <span class="qr-tool__size-px"
            >${preset.size} × ${preset.size} px</span
          >
          <span class="qr-tool__size-desc">${preset.description}</span>
        </div>
        <div class="qr-tool__size-actions">
          <wa-button
            size="xs"
            variant="neutral"
            appearance="outlined"
            title="${preset.label}（${preset.size}px）を画像コピー"
            @click=${() => void this.handleCopyImage(preset)}
          >
            <wa-icon slot="start" name="copy-solid-full"></wa-icon>
            コピー
          </wa-button>
          <wa-button
            size="xs"
            variant="brand"
            appearance="outlined"
            title="${preset.label}（${preset.size}px）をPNG保存"
            @click=${() => void this.handleDownload(preset)}
          >
            <wa-icon slot="start" name="download-solid-full"></wa-icon>
            PNG
          </wa-button>
        </div>
      </div>
    `;
  }

  private renderPreviewAndExports(): TemplateResult {
    const validation = validateQrInput(this.inputText);

    if (validation.status === "empty") {
      return html`
        <p class="qr-tool__hint">
          URL やテキストを入力すると、自動で QR
          コードを生成します（エラー訂正レベル M / 白背景・余白付き PNG 出力）。
        </p>
      `;
    }

    if (validation.status === "too-long") {
      return html`
        <wa-callout variant="danger" size="s">
          <wa-icon slot="icon" name="circle-exclamation-solid-full"></wa-icon>
          ${validation.errorMessage}
        </wa-callout>
      `;
    }

    return html`
      <section class="qr-tool__preview-card" aria-label="QRコードプレビュー">
        <div class="qr-tool__qr-frame">
          <wa-qr-code
            id="qr-preview-code"
            value=${this.inputText}
            size=${PREVIEW_QR_SIZE}
            error-correction=${QR_ERROR_CORRECTION_LEVEL}
            fill="black"
            background="white"
            label="生成されたQRコード"
          ></wa-qr-code>
        </div>
      </section>

      <section class="qr-tool__export-section" aria-label="サイズ別出力">
        <h2 class="qr-tool__section-heading">サイズ別に保存・コピー</h2>
        <div class="qr-tool__size-list">
          ${QR_SIZE_PRESETS.map((preset) => this.renderSizeRow(preset))}
        </div>
      </section>
    `;
  }

  override render(): TemplateResult {
    const validation = validateQrInput(this.inputText);

    return html`
      <div class="qr-tool">
        <section class="qr-tool__input-card">
          <div class="qr-tool__input-header">
            <label class="qr-tool__label" for="qr-text-input"
              >変換するテキスト / URL</label
            >
            <div class="qr-tool__input-meta">
              <span class="qr-tool__byte-count"
                >${validation.byteLength} / ${QR_MAX_UTF8_BYTES} B</span
              >
              ${
                this.inputText
                  ? html`
                      <wa-button
                        size="xs"
                        variant="neutral"
                        appearance="plain"
                        aria-label="入力をクリア"
                        @click=${() => {
                          this.inputText = "";
                        }}
                      >
                        <wa-icon name="xmark-solid-full"></wa-icon>
                      </wa-button>
                    `
                  : nothing
              }
            </div>
          </div>

          <wa-textarea
            id="qr-text-input"
            size="s"
            rows="3"
            resize="vertical"
            placeholder="URL や文字列を入力・貼り付け..."
            .value=${this.inputText}
            @input=${(e: Event) => {
              const target = e.target as HTMLTextAreaElement;
              this.inputText = target.value;
            }}
          ></wa-textarea>
        </section>

        ${this.renderPreviewAndExports()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "qr-generator-tool": QrGeneratorTool;
  }
}
