import { LitElement, html, unsafeCSS, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import editorPreviewStyles from "./markdown-editor-preview.scss?inline";
import type { Extension } from "@codemirror/state";
import type { MarkdownProcessorOptions } from "../types.js";
import { debounce } from "@shared/utils";
import { detectIsDarkMode, observeThemeChanges } from "../utils/theme-sync.js";
import {
  MarkdownEditor,
  type MarkdownActionType,
} from "../editor/markdown-editor.js";
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

  /** スプリット表示の利用可否 */
  @property({
    type: Boolean,
    attribute: "allow-split",
    converter: {
      fromAttribute: (val: string | null) => val !== "false" && val !== null,
    },
  })
  public allowSplit = true;

  private _mode?: MarkdownDisplayMode;

  /** 表示モード ("split" | "edit" | "preview") */
  @property({ type: String })
  public get mode(): MarkdownDisplayMode {
    if (this._mode) {
      if (!this.allowSplit && this._mode === "split") {
        return this.hasContent ? "preview" : "edit";
      }
      return this._mode;
    }
    return this.hasContent ? "preview" : "edit";
  }

  public set mode(val: MarkdownDisplayMode) {
    const oldMode = this._mode;
    if (val === "split" && !this.allowSplit) {
      this._mode = this.hasContent ? "preview" : "edit";
    } else {
      this._mode = val;
    }
    this.requestUpdate("mode", oldMode);
  }

  /** 入力内容が存在するかどうか */
  private get hasContent(): boolean {
    return Boolean(this.value && this.value.trim().length > 0);
  }

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
  public previewValue = "";

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

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has("value")) {
      this.previewValue = this.value;
    }
  }

  /**
   * 外部からドキュメントテキストを設定し、プレビューも即時同期する。
   *
   * @param newValue 新しいテキスト
   */
  public setValue(newValue: string): void {
    this.value = newValue;
    this.debouncedUpdatePreview.cancel();
    this.previewValue = newValue;
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
    if (newMode === "split" && !this.allowSplit) {
      return;
    }
    if (newMode === "preview" || newMode === "split") {
      this.debouncedUpdatePreview.flush();
      this.previewValue = this.value;
    }
    if (this._mode === newMode) return;
    this.mode = newMode;
    this.dispatchEvent(
      new CustomEvent("mode-change", {
        detail: { mode: this.mode },
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
   * Markdown 書式ツールバーのアクションを実行する。
   *
   * @param action Markdown アクション種別
   */
  public handleToolbarAction(action: MarkdownActionType): void {
    const editor = this.renderRoot?.querySelector(
      "markdown-editor",
    ) as MarkdownEditor | null;
    if (editor) {
      editor.insertMarkdown(action);
    }
  }

  /**
   * Markdown 書式ツールバーを描画する。
   */
  private renderToolbar() {
    return html`
      <div
        class="markdown-editor-preview__toolbar"
        role="toolbar"
        aria-label="Markdown 書式ツールバー"
      >
        <button
          type="button"
          class="markdown-editor-preview__toolbar-btn"
          title="見出し"
          aria-label="見出し"
          @click=${() => this.handleToolbarAction("heading")}
        >
          <wa-icon
            library="my-icons"
            name="heading-solid-full"
            label="見出し"
          ></wa-icon>
        </button>
        <button
          type="button"
          class="markdown-editor-preview__toolbar-btn"
          title="太字"
          aria-label="太字"
          @click=${() => this.handleToolbarAction("bold")}
        >
          <wa-icon
            library="my-icons"
            name="bold-solid-full"
            label="太字"
          ></wa-icon>
        </button>
        <button
          type="button"
          class="markdown-editor-preview__toolbar-btn"
          title="斜体"
          aria-label="斜体"
          @click=${() => this.handleToolbarAction("italic")}
        >
          <wa-icon
            library="my-icons"
            name="italic-solid-full"
            label="斜体"
          ></wa-icon>
        </button>

        <span class="markdown-editor-preview__toolbar-separator"></span>

        <button
          type="button"
          class="markdown-editor-preview__toolbar-btn"
          title="箇条書きリスト"
          aria-label="箇条書きリスト"
          @click=${() => this.handleToolbarAction("bullet-list")}
        >
          <wa-icon
            library="my-icons"
            name="list-ul-solid-full"
            label="箇条書きリスト"
          ></wa-icon>
        </button>
        <button
          type="button"
          class="markdown-editor-preview__toolbar-btn"
          title="番号付きリスト"
          aria-label="番号付きリスト"
          @click=${() => this.handleToolbarAction("ordered-list")}
        >
          <wa-icon
            library="my-icons"
            name="list-ol-solid-full"
            label="番号付きリスト"
          ></wa-icon>
        </button>
        <button
          type="button"
          class="markdown-editor-preview__toolbar-btn"
          title="タスクリスト"
          aria-label="タスクリスト"
          @click=${() => this.handleToolbarAction("task-list")}
        >
          <wa-icon
            library="my-icons"
            name="list-check-solid-full"
            label="タスクリスト"
          ></wa-icon>
        </button>
        <button
          type="button"
          class="markdown-editor-preview__toolbar-btn"
          title="引用"
          aria-label="引用"
          @click=${() => this.handleToolbarAction("quote")}
        >
          <wa-icon
            library="my-icons"
            name="blockquote-left"
            label="引用"
          ></wa-icon>
        </button>

        <span class="markdown-editor-preview__toolbar-separator"></span>

        <button
          type="button"
          class="markdown-editor-preview__toolbar-btn"
          title="コード"
          aria-label="コード"
          @click=${() => this.handleToolbarAction("code")}
        >
          <wa-icon
            library="my-icons"
            name="code-solid-full"
            label="コード"
          ></wa-icon>
        </button>
        <button
          type="button"
          class="markdown-editor-preview__toolbar-btn"
          title="リンク"
          aria-label="リンク"
          @click=${() => this.handleToolbarAction("link")}
        >
          <wa-icon
            library="my-icons"
            name="link-solid-full"
            label="リンク"
          ></wa-icon>
        </button>
        <button
          type="button"
          class="markdown-editor-preview__toolbar-btn"
          title="テーブル"
          aria-label="テーブル"
          @click=${() => this.handleToolbarAction("table")}
        >
          <wa-icon
            library="my-icons"
            name="table-solid-full"
            label="テーブル"
          ></wa-icon>
        </button>
      </div>
    `;
  }

  /**
   * ツールバーヘッダーを描画する。
   */
  private renderHeader() {
    return html`
      <header class="markdown-editor-preview__header">
        <div class="markdown-editor-preview__header-left">
          <span class="markdown-editor-preview__title">${this.titleText}</span>
          ${this.mode !== "preview" ? this.renderToolbar() : ""}
        </div>
        <div
          class="markdown-editor-preview__mode-group"
          role="tablist"
          aria-label="表示モード切替"
        >
          ${this.allowSplit
            ? html`
                <button
                  type="button"
                  class="markdown-editor-preview__mode-btn ${this.mode === "split"
                    ? "markdown-editor-preview__mode-btn--active"
                    : ""}"
                  role="tab"
                  aria-selected=${this.mode === "split"}
                  title="スプリット"
                  aria-label="スプリット"
                  @click=${() => this.setMode("split")}
                >
                  <wa-icon
                    library="my-icons"
                    name="table-columns-solid-full"
                    label="スプリット"
                  ></wa-icon>
                </button>
              `
            : ""}
          <button
            type="button"
            class="markdown-editor-preview__mode-btn ${this.mode === "edit"
              ? "markdown-editor-preview__mode-btn--active"
              : ""}"
            role="tab"
            aria-selected=${this.mode === "edit"}
            title="編集"
            aria-label="編集"
            @click=${() => this.setMode("edit")}
          >
            <wa-icon
              library="my-icons"
              name="markdown-brands-solid-full"
              label="編集"
            ></wa-icon>
          </button>
          <button
            type="button"
            class="markdown-editor-preview__mode-btn ${this.mode === "preview"
              ? "markdown-editor-preview__mode-btn--active"
              : ""}"
            role="tab"
            aria-selected=${this.mode === "preview"}
            title="プレビュー"
            aria-label="プレビュー"
            @click=${() => this.setMode("preview")}
          >
            <wa-icon
              library="my-icons"
              name="html5-brands-solid-full"
              label="プレビュー"
            ></wa-icon>
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
