import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import editorPreviewStyles from "./markdown-editor-preview.scss?inline";
import type { Extension } from "@codemirror/state";
import type { MarkdownProcessorOptions } from "../types.js";
import { debounce } from "@shared/utils";
import { detectIsDarkMode, observeThemeChanges } from "../utils/theme-sync.js";
import "../editor/markdown-editor.js";
import "../preview/markdown-preview.js";

export type MarkdownDisplayMode = "split" | "edit" | "preview";

/**
 * 統合 Markdown エディタ＆プレビューコンポーネント (<markdown-editor-preview>)
 *
 * エディタ (<markdown-editor>) とプレビュー (<markdown-preview>) を内包し、
 * スプリット表示 (左右 1:1) やタブ切り替え表示、および debounce プレビュー更新を提供する。
 */
@customElement("markdown-editor-preview")
export class MarkdownEditorPreview extends LitElement {
  public static override styles = unsafeCSS(editorPreviewStyles);

  /** ドキュメントテキスト */
  @property({ type: String })
  public value = "";

  /** 表示モード ("split" | "edit" | "preview") */
  @property({ type: String })
  public mode: MarkdownDisplayMode = "split";

  /** タイトル表示文字列 */
  @property({ type: String })
  public titleText = "Markdown";

  /** プラグイン・サニタイズ設定オプション (DI) */
  @property({ type: Object })
  public processorOptions?: MarkdownProcessorOptions;

  /** CodeMirror 拡張機能 (DI) */
  @property({ attribute: false })
  public customExtensions: Extension[] = [];

  /** プレビューへ渡す遅延同期テキスト */
  @state()
  private previewValue = "";

  /** 現在適用されている解決済みテーマ ("light" | "dark") */
  @state()
  public currentTheme: "light" | "dark" = "light";

  private disconnectThemeObserver?: () => void;

  private debouncedUpdatePreview = debounce((val: string) => {
    this.previewValue = val;
  }, 150);

  override connectedCallback(): void {
    super.connectedCallback();
    this.previewValue = this.value;
    this.syncTheme();
    this.disconnectThemeObserver = observeThemeChanges(() => {
      this.syncTheme();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.disconnectThemeObserver?.();
  }

  /**
   * ホスト要素および子コンポーネントのテーマを同期する。
   */
  private syncTheme(): void {
    const isDark = detectIsDarkMode(this);
    const targetTheme: "light" | "dark" = isDark ? "dark" : "light";
    this.currentTheme = targetTheme;

    if (this.getAttribute("data-theme") !== targetTheme) {
      this.setAttribute("data-theme", targetTheme);
    }
    if (isDark) {
      this.classList.add("wa-dark");
      this.classList.remove("wa-light");
    } else {
      this.classList.remove("wa-dark");
      this.classList.add("wa-light");
    }
  }

  /**
   * 表示モードを変更する。
   *
   * @param newMode 新しい表示モード
   */
  public setMode(newMode: MarkdownDisplayMode): void {
    if (this.mode === newMode) return;
    this.mode = newMode;
    this.dispatchEvent(
      new CustomEvent("mode-change", {
        detail: { mode: newMode },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * エディタからのテキスト変更イベントをハンドリングする。
   *
   * @param newValue 変更後のテキスト
   */
  public handleEditorChange(newValue: string): void {
    this.value = newValue;
    this.debouncedUpdatePreview(newValue);
    this.dispatchEvent(
      new CustomEvent("markdown-change", {
        detail: { value: newValue },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private onEditorInput = (e: Event): void => {
    const customEvt = e as CustomEvent<{ value: string }>;
    this.handleEditorChange(customEvt.detail.value);
  };

  /**
   * ツールバーヘッダーを描画する。
   */
  private renderHeader() {
    return html`
      <header class="markdown-editor-preview__header">
        <span class="markdown-editor-preview__title">${this.titleText}</span>
        <div
          class="markdown-editor-preview__mode-group"
          role="tablist"
          aria-label="表示モード切替"
        >
          <button
            type="button"
            class="markdown-editor-preview__mode-btn ${this.mode === "split"
              ? "markdown-editor-preview__mode-btn--active"
              : ""}"
            role="tab"
            aria-selected=${this.mode === "split"}
            @click=${() => this.setMode("split")}
          >
            スプリット
          </button>
          <button
            type="button"
            class="markdown-editor-preview__mode-btn ${this.mode === "edit"
              ? "markdown-editor-preview__mode-btn--active"
              : ""}"
            role="tab"
            aria-selected=${this.mode === "edit"}
            @click=${() => this.setMode("edit")}
          >
            編集
          </button>
          <button
            type="button"
            class="markdown-editor-preview__mode-btn ${this.mode === "preview"
              ? "markdown-editor-preview__mode-btn--active"
              : ""}"
            role="tab"
            aria-selected=${this.mode === "preview"}
            @click=${() => this.setMode("preview")}
          >
            プレビュー
          </button>
        </div>
      </header>
    `;
  }

  /**
   * エディタおよびプレビューペイン領域を描画する。
   */
  private renderBody() {
    return html`
      <div class="markdown-editor-preview__body">
        <div
          class="markdown-editor-preview__pane markdown-editor-preview__pane--editor"
        >
          <markdown-editor
            data-theme=${this.currentTheme}
            .themeMode=${this.currentTheme}
            .value=${this.value}
            .customExtensions=${this.customExtensions}
            @markdown-change=${this.onEditorInput}
          ></markdown-editor>
        </div>
        <div
          class="markdown-editor-preview__pane markdown-editor-preview__pane--preview"
        >
          <markdown-preview
            data-theme=${this.currentTheme}
            .content=${this.previewValue}
            .processorOptions=${this.processorOptions}
          ></markdown-preview>
        </div>
      </div>
    `;
  }

  override render() {
    const modeClass = `markdown-editor-preview--mode-${this.mode}`;

    return html`
      <div class="markdown-editor-preview ${modeClass}">
        ${this.renderHeader()}
        ${this.renderBody()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "markdown-editor-preview": MarkdownEditorPreview;
  }
}
