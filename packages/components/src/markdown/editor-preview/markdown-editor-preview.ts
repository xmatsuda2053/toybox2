import { LitElement, html, unsafeCSS, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import editorPreviewStyles from "./markdown-editor-preview.scss?inline";
import type { Extension } from "@codemirror/state";
import type {
  MarkdownProcessorOptions,
  MarkdownFeatureExtension,
} from "../types.js";
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

  /** 拡張機能パッケージ (DI) */
  @property({ attribute: false })
  public extensions: MarkdownFeatureExtension[] = [];

  /** CodeMirror 拡張機能 (DI) */
  @property({ attribute: false })
  public customExtensions: Extension[] = [];

  /** プレビューへ渡す遅延同期テキスト */
  @state()
  public previewValue = "";

  /** 現在適用されている解決済みテーマ ("light" | "dark") */
  @state()
  public currentTheme: "light" | "dark" = "light";

  /** 構文ヘルプモーダルの開閉状態 */
  @state()
  public isHelpOpen = false;

  /** 拡張機能ドロップダウンメニューの開閉状態 */
  @state()
  public isExtensionMenuOpen = false;

  /**
   * 拡張機能の設定をマージした有効な MarkdownProcessorOptions を取得する。
   */
  public get effectiveProcessorOptions(): MarkdownProcessorOptions {
    const baseOptions = this.processorOptions || {};
    const extRemarkPlugins = this.extensions.flatMap(
      (e) => e.processor?.remarkPlugins || [],
    );
    const extRehypePlugins = this.extensions.flatMap(
      (e) => e.processor?.rehypePlugins || [],
    );
    const extSanitizers = this.extensions
      .map((e) => e.processor?.sanitizeSchemaModifier)
      .filter((fn): fn is NonNullable<typeof fn> => typeof fn === "function");

    const remarkPlugins = [
      ...(baseOptions.remarkPlugins || []),
      ...extRemarkPlugins,
    ];
    const rehypePlugins = [
      ...(baseOptions.rehypePlugins || []),
      ...extRehypePlugins,
    ];

    let sanitizeSchemaModifier = baseOptions.sanitizeSchemaModifier;
    if (extSanitizers.length > 0) {
      sanitizeSchemaModifier = (schema) => {
        let current = baseOptions.sanitizeSchemaModifier
          ? baseOptions.sanitizeSchemaModifier(schema)
          : schema;
        for (const modifier of extSanitizers) {
          current = modifier(current);
        }
        return current;
      };
    }

    return {
      remarkPlugins,
      rehypePlugins,
      sanitizeSchemaModifier,
    };
  }

  /**
   * 拡張機能の設定をマージした有効な CodeMirror 拡張機能リストを取得する。
   */
  public get effectiveEditorExtensions(): Extension[] {
    const extEditorExtensions = this.extensions.flatMap(
      (e) => e.editorExtensions || [],
    );
    return [...this.customExtensions, ...extEditorExtensions];
  }

  private disconnectThemeObserver?: () => void;

  private debouncedUpdatePreview = debounce((val: string) => {
    this.previewValue = val;
  }, 150);

  private handleGlobalKeydown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      if (this.isHelpOpen) {
        this.toggleHelp(false);
      }
      if (this.isExtensionMenuOpen) {
        this.toggleExtensionMenu(false);
      }
    }
  };

  private handleGlobalClick = (e: MouseEvent): void => {
    if (!this.isExtensionMenuOpen) return;
    const path = e.composedPath();
    const menuContainer = this.renderRoot?.querySelector(
      ".markdown-editor-preview__extension-menu-container",
    );
    if (menuContainer && !path.includes(menuContainer)) {
      this.toggleExtensionMenu(false);
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.previewValue = this.value;
    this.syncTheme();
    this.disconnectThemeObserver = observeThemeChanges(() => {
      this.syncTheme();
    });
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleGlobalKeydown);
      window.addEventListener("click", this.handleGlobalClick);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.disconnectThemeObserver?.();
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleGlobalKeydown);
      window.removeEventListener("click", this.handleGlobalClick);
    }
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
    } else {
      // Node.js テスト環境等で shadowRoot 内の子要素が未接続の場合のフォールバック
      const mockTemplates: Record<string, string> = {
        heading: "### 見出し",
        bold: "**太字**",
        "bullet-list": "- リスト",
        "ordered-list": "1. リスト",
        "task-list": "- [ ] タスク",
        quote: "> 引用",
        code: "`code`",
        link: "[リンク](url)",
        table: "| 列1 | 列2 |\n| --- | --- |\n| 値1 | 値2 |",
      };
      const textToInsert = mockTemplates[action] || action;
      this.value = this.value ? `${this.value}\n${textToInsert}` : textToInsert;
      this.handleEditorChange(this.value);
    }
  }

  /**
   * 拡張機能のツールバーアクションを実行する。
   *
   * @param ext 拡張機能定義
   */
  public handleExtensionAction(ext: MarkdownFeatureExtension): void {
    const editor = this.renderRoot?.querySelector(
      "markdown-editor",
    ) as MarkdownEditor | null;
    if (editor) {
      editor.insertTemplate(ext.template);
    } else {
      // Node.js テスト環境等で shadowRoot 内の子要素が未接続の場合のフォールバック
      this.value = this.value ? `${this.value}\n${ext.template}` : ext.template;
      this.handleEditorChange(this.value);
    }
  }

  /**
   * 構文ヘルプモーダルの開閉を切り替える。
   *
   * @param open 指定した開閉状態（省略時はトグル）
   */
  public toggleHelp(open?: boolean): void {
    this.isHelpOpen = open ?? !this.isHelpOpen;
  }

  /**
   * 構文ヘルプダイアログから拡張機能のテンプレートを挿入し、ヘルプを閉じる。
   *
   * @param ext 拡張機能定義
   */
  public insertExtensionTemplate(ext: MarkdownFeatureExtension): void {
    this.handleExtensionAction(ext);
    this.toggleHelp(false);
  }

  /**
   * 拡張機能ドロップダウンメニューの開閉を切り替える。
   *
   * @param open 指定した開閉状態（省略時はトグル）
   */
  public toggleExtensionMenu(open?: boolean): void {
    this.isExtensionMenuOpen = open ?? !this.isExtensionMenuOpen;
  }

  /**
   * 拡張機能メニュー項目を選択・挿入し、メニューを閉じる。
   *
   * @param ext 拡張機能定義
   */
  public selectExtensionMenuItem(ext: MarkdownFeatureExtension): void {
    this.handleExtensionAction(ext);
    this.toggleExtensionMenu(false);
  }

  /**
   * ドロップダウンメニュー内から書式アクションを実行し、メニューを閉じる。
   *
   * @param action 書式アクション種別
   */
  public handleMenuToolbarAction(action: MarkdownActionType): void {
    this.handleToolbarAction(action);
    this.toggleExtensionMenu(false);
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

        <span
          class="markdown-editor-preview__toolbar-separator markdown-editor-preview__toolbar-item--secondary"
        ></span>

        <button
          type="button"
          class="markdown-editor-preview__toolbar-btn markdown-editor-preview__toolbar-item--secondary"
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
          class="markdown-editor-preview__toolbar-btn markdown-editor-preview__toolbar-item--secondary"
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

        <span
          class="markdown-editor-preview__toolbar-separator markdown-editor-preview__toolbar-item--secondary"
        ></span>

        <button
          type="button"
          class="markdown-editor-preview__toolbar-btn markdown-editor-preview__toolbar-item--secondary"
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
          class="markdown-editor-preview__toolbar-btn markdown-editor-preview__toolbar-item--secondary"
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
          class="markdown-editor-preview__toolbar-btn markdown-editor-preview__toolbar-item--secondary"
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

        <span
          class="markdown-editor-preview__toolbar-separator markdown-editor-preview__toolbar-menu-separator ${this.extensions.length > 0
            ? ""
            : "markdown-editor-preview__toolbar-menu-separator--responsive"}"
        ></span>
        <div
          class="markdown-editor-preview__extension-menu-container ${this.extensions.length > 0
            ? ""
            : "markdown-editor-preview__extension-menu-container--responsive"}"
        >
          <button
            type="button"
            class="markdown-editor-preview__toolbar-btn markdown-editor-preview__toolbar-btn--extension-menu ${this.isExtensionMenuOpen
              ? "markdown-editor-preview__toolbar-btn--active"
              : ""}"
            title="拡張機能"
            aria-label="拡張機能"
            aria-haspopup="true"
            aria-expanded=${this.isExtensionMenuOpen ? "true" : "false"}
            @click=${() => this.toggleExtensionMenu()}
          >
            <wa-icon
              library="my-icons"
              name="ellipsis-solid-full"
              label="拡張機能"
            ></wa-icon>
          </button>
          <div
            class="markdown-editor-preview__extension-menu ${this.isExtensionMenuOpen
              ? "markdown-editor-preview__extension-menu--open"
              : ""}"
            role="menu"
            aria-label="拡張機能メニュー"
          >
            <!-- 追加の書式（狭幅時および拡張メニュー内の二次的アクション） -->
            <div
              class="markdown-editor-preview__menu-section markdown-editor-preview__menu-section--secondary"
            >
              <div class="markdown-editor-preview__extension-menu-header">
                <span class="markdown-editor-preview__extension-menu-title"
                  >追加の書式</span
                >
              </div>
              <div class="markdown-editor-preview__extension-menu-list">
                <button
                  type="button"
                  class="markdown-editor-preview__extension-menu-item"
                  role="menuitem"
                  @click=${() => this.handleMenuToolbarAction("ordered-list")}
                >
                  <wa-icon
                    library="my-icons"
                    name="list-ol-solid-full"
                    class="markdown-editor-preview__extension-menu-item-icon"
                  ></wa-icon>
                  <span class="markdown-editor-preview__extension-menu-item-label"
                    >番号付きリスト</span
                  >
                </button>
                <button
                  type="button"
                  class="markdown-editor-preview__extension-menu-item"
                  role="menuitem"
                  @click=${() => this.handleMenuToolbarAction("quote")}
                >
                  <wa-icon
                    library="my-icons"
                    name="blockquote-left"
                    class="markdown-editor-preview__extension-menu-item-icon"
                  ></wa-icon>
                  <span class="markdown-editor-preview__extension-menu-item-label"
                    >引用</span
                  >
                </button>
                <button
                  type="button"
                  class="markdown-editor-preview__extension-menu-item"
                  role="menuitem"
                  @click=${() => this.handleMenuToolbarAction("code")}
                >
                  <wa-icon
                    library="my-icons"
                    name="code-solid-full"
                    class="markdown-editor-preview__extension-menu-item-icon"
                  ></wa-icon>
                  <span class="markdown-editor-preview__extension-menu-item-label"
                    >コード</span
                  >
                </button>
                <button
                  type="button"
                  class="markdown-editor-preview__extension-menu-item"
                  role="menuitem"
                  @click=${() => this.handleMenuToolbarAction("link")}
                >
                  <wa-icon
                    library="my-icons"
                    name="link-solid-full"
                    class="markdown-editor-preview__extension-menu-item-icon"
                  ></wa-icon>
                  <span class="markdown-editor-preview__extension-menu-item-label"
                    >リンク</span
                  >
                </button>
                <button
                  type="button"
                  class="markdown-editor-preview__extension-menu-item"
                  role="menuitem"
                  @click=${() => this.handleMenuToolbarAction("table")}
                >
                  <wa-icon
                    library="my-icons"
                    name="table-solid-full"
                    class="markdown-editor-preview__extension-menu-item-icon"
                  ></wa-icon>
                  <span class="markdown-editor-preview__extension-menu-item-label"
                    >テーブル</span
                  >
                </button>
              </div>
            </div>

            <!-- 独自記法・拡張機能 -->
            ${this.extensions.length > 0
              ? html`
                  <div
                    class="markdown-editor-preview__extension-menu-header"
                  >
                    <span
                      class="markdown-editor-preview__extension-menu-title"
                      >独自記法・拡張機能</span
                    >
                  </div>
                  <div class="markdown-editor-preview__extension-menu-list">
                    ${this.extensions.map(
                      (ext) => html`
                        <button
                          type="button"
                          class="markdown-editor-preview__extension-menu-item"
                          role="menuitem"
                          @click=${() => this.selectExtensionMenuItem(ext)}
                        >
                          <wa-icon
                            library="my-icons"
                            name=${ext.toolbarItem?.icon || "tag-solid-full"}
                            class="markdown-editor-preview__extension-menu-item-icon"
                          ></wa-icon>
                          <div
                            class="markdown-editor-preview__extension-menu-item-body"
                          >
                            <span
                              class="markdown-editor-preview__extension-menu-item-label"
                              >${ext.label}</span
                            >
                            <code
                              class="markdown-editor-preview__extension-menu-item-syntax"
                              >${ext.template}</code
                            >
                          </div>
                        </button>
                      `,
                    )}
                  </div>
                `
              : ""}
          </div>
        </div>
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
          ${this.mode !== "preview" ? this.renderToolbar() : ""}
        </div>
        <div class="markdown-editor-preview__header-right">
          <button
            type="button"
            class="markdown-editor-preview__help-btn"
            title="構文ヘルプ"
            aria-label="構文ヘルプ"
            @click=${(e: Event) => {
              e.preventDefault();
              e.stopPropagation();
              this.toggleHelp();
            }}
          >
            <wa-icon
              library="my-icons"
              name="question-solid-full"
              label="構文ヘルプ"
            ></wa-icon>
          </button>
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
            .customExtensions=${this.effectiveEditorExtensions}
            @markdown-change=${this.onEditorInput}
          ></markdown-editor>
        </div>
        <div
          class="markdown-editor-preview__pane markdown-editor-preview__pane--preview"
        >
          <markdown-preview
            data-theme=${this.currentTheme}
            .content=${this.previewValue}
            .processorOptions=${this.effectiveProcessorOptions}
          ></markdown-preview>
        </div>
      </div>
    `;
  }

  /**
   * 構文ヘルプダイアログモーダルを描画する。
   */
  private renderHelpModal() {
    return html`
      <div
        class="markdown-editor-preview__help-modal ${this.isHelpOpen
          ? "markdown-editor-preview__help-modal--open"
          : ""}"
        role="dialog"
        aria-modal="true"
        aria-label="構文ヘルプ"
      >
        <div
          class="markdown-editor-preview__help-backdrop"
          @click=${(e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleHelp(false);
          }}
        ></div>
        <div
          class="markdown-editor-preview__help-dialog"
          @click=${(e: Event) => e.stopPropagation()}
        >
          <header class="markdown-editor-preview__help-header">
            <h3 class="markdown-editor-preview__help-title">Markdown 構文ヘルプ</h3>
            <button
              type="button"
              class="markdown-editor-preview__help-close-btn"
              title="閉じる"
              aria-label="閉じる"
              @click=${(e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleHelp(false);
              }}
            >
              <wa-icon
                library="my-icons"
                name="xmark-solid-full"
                label="閉じる"
              ></wa-icon>
            </button>
          </header>
          <div class="markdown-editor-preview__help-content">
            ${this.extensions.length > 0
              ? html`
                  <section class="markdown-editor-preview__help-section">
                    <h4 class="markdown-editor-preview__help-subtitle">
                      拡張機能・独自タグ
                    </h4>
                    <table class="markdown-editor-preview__help-table">
                      <thead>
                        <tr>
                          <th>機能名</th>
                          <th>構文</th>
                          <th>説明</th>
                          <th>使用例</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${this.extensions.map(
                          (ext) => html`
                            <tr>
                              <td class="markdown-editor-preview__help-col-label">
                                ${ext.label}
                              </td>
                              <td class="markdown-editor-preview__help-col-syntax">
                                <code>${ext.template}</code>
                              </td>
                              <td class="markdown-editor-preview__help-col-desc">
                                ${ext.description || "-"}
                              </td>
                              <td class="markdown-editor-preview__help-col-example">
                                <code>${ext.example || ext.template}</code>
                              </td>
                              <td class="markdown-editor-preview__help-col-action">
                                <button
                                  type="button"
                                  class="markdown-editor-preview__help-insert-btn"
                                  @click=${() =>
                                    this.insertExtensionTemplate(ext)}
                                >
                                  挿入
                                </button>
                              </td>
                            </tr>
                          `,
                        )}
                      </tbody>
                    </table>
                  </section>
                `
              : ""}
            <section class="markdown-editor-preview__help-section">
              <h4 class="markdown-editor-preview__help-subtitle">
                基本 Markdown 記法
              </h4>
              <table class="markdown-editor-preview__help-table">
                <thead>
                  <tr>
                    <th>記法</th>
                    <th>入力例</th>
                    <th>結果</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>見出し</td>
                    <td><code>### 見出し3</code></td>
                    <td>小見出し</td>
                  </tr>
                  <tr>
                    <td>太字</td>
                    <td><code>**太字**</code></td>
                    <td><strong>太字</strong></td>
                  </tr>
                  <tr>
                    <td>斜体</td>
                    <td><code>*斜体*</code></td>
                    <td><em>斜体</em></td>
                  </tr>
                  <tr>
                    <td>箇条書き</td>
                    <td><code>- リスト項目</code></td>
                    <td>箇条書きリスト</td>
                  </tr>
                  <tr>
                    <td>番号付き</td>
                    <td><code>1. リスト項目</code></td>
                    <td>順序付きリスト</td>
                  </tr>
                  <tr>
                    <td>タスク</td>
                    <td><code>- [ ] 未完了タスク</code></td>
                    <td>チェックボックス</td>
                  </tr>
                  <tr>
                    <td>引用</td>
                    <td><code>> 引用文</code></td>
                    <td>引用ブロック</td>
                  </tr>
                  <tr>
                    <td>コード</td>
                    <td><code>\`code\`</code></td>
                    <td>インラインコード</td>
                  </tr>
                  <tr>
                    <td>リンク</td>
                    <td><code>[テキスト](URL)</code></td>
                    <td>ハイパーリンク</td>
                  </tr>
                  <tr>
                    <td>テーブル</td>
                    <td><code>| A | B |</code></td>
                    <td>表組</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
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
        ${this.renderHelpModal()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "markdown-editor-preview": MarkdownEditorPreview;
  }
}
