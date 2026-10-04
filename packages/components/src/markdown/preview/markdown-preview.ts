import { LitElement, html, unsafeCSS, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import previewStyles from "./markdown-preview.scss?inline";
import { createMarkdownProcessor } from "../pipeline/markdown-processor.js";
import type {
  IMarkdownProcessor,
  MarkdownProcessorOptions,
} from "../types.js";
import {
  detectIsDarkMode,
  observeThemeChanges,
  syncHostTheme,
} from "../utils/theme-sync.js";

/**
 * Markdown プレビューコンポーネント (<markdown-preview>)
 *
 * 入力された Markdown を安全にサニタイズされた HTML へ変換し、
 * Shadow DOM 内に GitHub スタイルでレンダリングする。
 */
@customElement("markdown-preview")
export class MarkdownPreview extends LitElement {
  public static override styles = unsafeCSS(previewStyles);

  /** 表示対象の Markdown 文字列 */
  @property({ type: String })
  public content = "";

  /** 入力内容に応じた自動伸長（Auto-grow）モード */
  @property({ type: Boolean, reflect: true, attribute: "auto-height" })
  public autoHeight = false;

  /** プラグインやサニタイズのカスタマイズ設定 (DI) */
  @property({ type: Object })
  public processorOptions?: MarkdownProcessorOptions;

  /** 変換済みの HTML 文字列 */
  @state()
  public renderedHtml = "";

  /** パース・レンダリング中フラグ */
  @state()
  public isLoading = false;

  private processor?: IMarkdownProcessor;
  private disconnectThemeObserver?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncTheme();
    this.disconnectThemeObserver = observeThemeChanges(() => {
      this.syncTheme();
    });
    this.initProcessor();
    if (this.content) {
      void this.renderMarkdown();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.disconnectThemeObserver?.();
  }

  private syncTheme(): void {
    const isDark = detectIsDarkMode(this);
    syncHostTheme(this, isDark);
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    let needRebuildProcessor = false;
    let needReRender = false;

    if (changedProperties.has("processorOptions")) {
      needRebuildProcessor = true;
      needReRender = true;
    }

    if (changedProperties.has("content")) {
      needReRender = true;
    }

    if (needRebuildProcessor) {
      this.initProcessor();
    }

    if (needReRender) {
      void this.renderMarkdown();
    }
  }

  /**
   * プロセッサインスタンスを初期化・再構築する。
   */
  private initProcessor(): void {
    this.processor = createMarkdownProcessor(this.processorOptions);
  }

  /**
   * Markdown 文字列をパースして HTML を生成し、レンダリングする。
   *
   * @returns 変換処理の完了 Promise
   */
  public async renderMarkdown(): Promise<string> {
    if (!this.processor) {
      this.initProcessor();
    }

    if (!this.content || this.content.trim() === "") {
      this.renderedHtml = "";
      this.isLoading = false;
      this.dispatchEvent(
        new CustomEvent("markdown-rendered", {
          detail: { html: "" },
          bubbles: true,
          composed: true,
        }),
      );
      return "";
    }

    this.isLoading = true;
    try {
      const htmlOutput = await this.processor!.process(this.content);
      this.renderedHtml = htmlOutput;
      this.dispatchEvent(
        new CustomEvent("markdown-rendered", {
          detail: { html: htmlOutput },
          bubbles: true,
          composed: true,
        }),
      );
      return htmlOutput;
    } finally {
      this.isLoading = false;
    }
  }

  override render() {
    const isDark =
      this.getAttribute?.("data-theme") === "dark" ||
      Boolean(this.classList?.contains?.("wa-dark"));
    const currentTheme = isDark ? "dark" : "light";
    const autoHeightClass = this.autoHeight
      ? "markdown-preview--auto-height"
      : "";

    return html`
      <div
        class="markdown-preview ${this.isLoading ? "markdown-preview--loading" : ""} ${autoHeightClass}"
      >
        ${this.renderedHtml
          ? html`<div
              class="markdown-preview__body markdown-body"
              data-theme="${currentTheme}"
            >
              ${unsafeHTML(this.renderedHtml)}
            </div>`
          : html`<div class="markdown-preview__empty">
              プレビューする内容がありません
            </div>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "markdown-preview": MarkdownPreview;
  }
}
