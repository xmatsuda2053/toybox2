import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import editorPreviewStyles from "./markdown-editor-preview.scss?inline";
import type { Extension } from "@codemirror/state";
import type {
  MarkdownProcessorOptions,
  MarkdownFeatureExtension,
} from "../types.js";
import { debounce } from "@shared/utils";
import { detectIsDarkMode, observeThemeChanges, syncHostTheme } from "../utils/theme-sync.js";
import {
  MarkdownEditor,
  type MarkdownActionType,
} from "../editor/markdown-editor.js";
import "../preview/markdown-preview.js";

export type MarkdownDisplayMode = "split" | "edit" | "preview";

interface ToolbarButtonDef {
  readonly action: MarkdownActionType;
  readonly icon: string;
  readonly label: string;
}

const BASIC_TOOLBAR_BUTTONS: readonly ToolbarButtonDef[] = [
  { action: "heading", icon: "heading-solid-full", label: "見出し" },
  { action: "bold", icon: "bold-solid-full", label: "太字" },
  { action: "bullet-list", icon: "list-ul-solid-full", label: "箇条書きリスト" },
  { action: "task-list", icon: "list-check-solid-full", label: "タスクリスト" },
];

const SECONDARY_TOOLBAR_BUTTONS: readonly ToolbarButtonDef[] = [
  { action: "ordered-list", icon: "list-ol-solid-full", label: "番号付きリスト" },
  { action: "quote", icon: "blockquote-left", label: "引用" },
  { action: "code", icon: "code-solid-full", label: "コード" },
  { action: "link", icon: "link-solid-full", label: "リンク" },
  { action: "table", icon: "table-solid-full", label: "テーブル" },
];

interface ModeTabDef {
  readonly mode: MarkdownDisplayMode;
  readonly icon: string;
  readonly label: string;
}

const MODE_TABS: readonly ModeTabDef[] = [
  { mode: "edit", icon: "markdown-brands-solid-full", label: "編集" },
  { mode: "preview", icon: "html5-brands-solid-full", label: "プレビュー" },
];

const BASIC_MARKDOWN_HELP_ROWS = [
  { name: "見出し", syntax: "### 見出し3", result: "小見出し" },
  { name: "太字", syntax: "**太字**", result: html`<strong>太字</strong>` },
  { name: "斜体", syntax: "*斜体*", result: html`<em>斜体</em>` },
  { name: "箇条書き", syntax: "- リスト項目", result: "箇条書きリスト" },
  { name: "番号付き", syntax: "1. リスト項目", result: "順序付きリスト" },
  { name: "タスク", syntax: "- [ ] 未完了タスク", result: "チェックボックス" },
  { name: "引用", syntax: "> 引用文", result: "引用ブロック" },
  { name: "コード", syntax: "`code`", result: "インラインコード" },
  { name: "リンク", syntax: "[テキスト](URL)", result: "ハイパーリンク" },
  { name: "テーブル", syntax: "| A | B |", result: "表組" },
];

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

  /** 入力内容に応じた自動伸長（Auto-grow）モード */
  @property({ type: Boolean, reflect: true, attribute: "auto-height" })
  public autoHeight = false;

  /** 高さモード切替ボタンの表示制御 */
  @property({ type: Boolean, attribute: "allow-auto-height" })
  public allowAutoHeight = true;

  /** 固定サイズ表示時の高さ（例: "400px", "50vh", 500）。autoHeight 有効時は無効化 */
  @property()
  public height?: string | number;

  /**
   * 有効な固定高さを取得する（autoHeight 有効時は undefined）。
   * 数値や単位なし文字列の場合は "px" を自動補完する。
   */
  public get effectiveHeight(): string | undefined {
    if (this.autoHeight || this.height === undefined || this.height === null || this.height === "") {
      return undefined;
    }
    if (typeof this.height === "number") {
      return `${this.height}px`;
    }
    const trimmed = String(this.height).trim();
    if (!trimmed) return undefined;
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return `${trimmed}px`;
    }
    return trimmed;
  }

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

  /** 高さモード切替トランジションアニメーション実行中フラグ */
  @state()
  public isTransitioning = false;

  private transitionTimer: ReturnType<typeof setTimeout> | null = null;

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
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
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

    if (changedProperties.has("height") || changedProperties.has("autoHeight")) {
      if (this.style && !this.isTransitioning) {
        this.style.height = this.effectiveHeight || "";
      }
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
    this.currentTheme = isDark ? "dark" : "light";
    syncHostTheme(this, isDark);
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
   * 高さモードを確定し、イベントを発火する。
   *
   * @param targetAutoHeight 反映する自動伸長フラグ
   */
  private commitHeightMode(targetAutoHeight: boolean): void {
    this.autoHeight = targetAutoHeight;
    this.isTransitioning = false;
    this.dispatchEvent(
      new CustomEvent("height-mode-change", {
        detail: { autoHeight: this.autoHeight },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * 固定モードから自動伸長モードへの滑らかな伸縮アニメーションを実行する。
   */
  private animateToAutoHeight(currentHeight: number): void {
    this.style.height = `${currentHeight}px`;
    this.autoHeight = true;

    requestAnimationFrame(() => {
      const container = this.renderRoot?.querySelector(
        ".markdown-editor-preview",
      ) as HTMLElement | null;
      const naturalHeight = container ? container.scrollHeight : currentHeight;
      const targetHeight = Math.max(naturalHeight, 240);

      requestAnimationFrame(() => {
        this.style.height = `${targetHeight}px`;

        this.transitionTimer = setTimeout(() => {
          if (this.autoHeight) {
            this.style.height = "";
          }
          this.isTransitioning = false;
          this.transitionTimer = null;
        }, 400);
      });
    });
  }

  /**
   * 自動伸長モードから固定モードへの滑らかな縮小アニメーションを実行する。
   */
  private animateToFixedHeight(currentHeight: number): void {
    this.style.height = `${currentHeight}px`;
    const targetFixed = this.effectiveHeight || "380px";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.autoHeight = false;
        this.style.height = targetFixed;

        this.transitionTimer = setTimeout(() => {
          this.isTransitioning = false;
          this.transitionTimer = null;
        }, 400);
      });
    });
  }

  /**
   * 高さモード切替時の滑らかな伸縮アニメーションを実行する。
   */
  private animateHeightTransition(currentHeight: number, targetAutoHeight: boolean): void {
    this.isTransitioning = true;
    if (targetAutoHeight) {
      this.animateToAutoHeight(currentHeight);
    } else {
      this.animateToFixedHeight(currentHeight);
    }
    this.dispatchEvent(
      new CustomEvent("height-mode-change", {
        detail: { autoHeight: targetAutoHeight },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * 高さモード（自動伸長 / 固定スクロール）を切り替える。
   *
   * @param force 指定した状態（省略時はトグル）
   */
  public toggleAutoHeight(force?: boolean): void {
    const targetAutoHeight = force ?? !this.autoHeight;
    if (this.autoHeight === targetAutoHeight) return;

    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }

    const isBrowser =
      typeof window !== "undefined" &&
      typeof requestAnimationFrame !== "undefined" &&
      typeof this.getBoundingClientRect === "function";

    const prefersReducedMotion =
      isBrowser &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    // Node.js テスト環境、アニメーション抑制、または非表示時は即座に切り替え
    if (!isBrowser || prefersReducedMotion) {
      this.commitHeightMode(targetAutoHeight);
      return;
    }

    const currentHeight = this.getBoundingClientRect().height;
    if (currentHeight <= 0) {
      this.commitHeightMode(targetAutoHeight);
      return;
    }

    this.animateHeightTransition(currentHeight, targetAutoHeight);
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
   * ツールバーの主要書式アクションボタングループを描画する。
   */
  private renderToolbarBasicActions() {
    const renderBtn = (btn: ToolbarButtonDef) => html`
      <button
        type="button"
        class="markdown-editor-preview__toolbar-btn"
        title="${btn.label}"
        aria-label="${btn.label}"
        @click=${() => this.handleToolbarAction(btn.action)}
      >
        <wa-icon library="my-icons" name="${btn.icon}" label="${btn.label}"></wa-icon>
      </button>
    `;

    return html`
      ${BASIC_TOOLBAR_BUTTONS.slice(0, 2).map(renderBtn)}
      <span class="markdown-editor-preview__toolbar-separator"></span>
      ${BASIC_TOOLBAR_BUTTONS.slice(2).map(renderBtn)}
    `;
  }

  /**
   * ツールバーの二次的書式アクションボタングループを描画する。
   */
  private renderToolbarSecondaryActions() {
    const renderSecondaryBtn = (btn: ToolbarButtonDef) => html`
      <button
        type="button"
        class="markdown-editor-preview__toolbar-btn markdown-editor-preview__toolbar-item--secondary"
        title="${btn.label}"
        aria-label="${btn.label}"
        @click=${() => this.handleToolbarAction(btn.action)}
      >
        <wa-icon library="my-icons" name="${btn.icon}" label="${btn.label}"></wa-icon>
      </button>
    `;

    return html`
      ${SECONDARY_TOOLBAR_BUTTONS.slice(0, 2).map(renderSecondaryBtn)}
      <span class="markdown-editor-preview__toolbar-separator markdown-editor-preview__toolbar-item--secondary"></span>
      ${SECONDARY_TOOLBAR_BUTTONS.slice(2).map(renderSecondaryBtn)}
    `;
  }

  /**
   * 拡張メニュー内の追加書式セクションを描画する。
   */
  private renderMenuSecondaryActions() {
    return html`
      <div class="markdown-editor-preview__menu-section markdown-editor-preview__menu-section--secondary">
        <div class="markdown-editor-preview__extension-menu-header">
          <span class="markdown-editor-preview__extension-menu-title">追加の書式</span>
        </div>
        <div class="markdown-editor-preview__extension-menu-list">
          ${SECONDARY_TOOLBAR_BUTTONS.map(
            (btn) => html`
              <button
                type="button"
                class="markdown-editor-preview__extension-menu-item"
                role="menuitem"
                @click=${() => this.handleMenuToolbarAction(btn.action)}
              >
                <wa-icon
                  library="my-icons"
                  name="${btn.icon}"
                  class="markdown-editor-preview__extension-menu-item-icon"
                ></wa-icon>
                <span class="markdown-editor-preview__extension-menu-item-label">${btn.label}</span>
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }

  /**
   * 拡張メニュー内の独自記法・拡張機能セクションを描画する。
   */
  private renderMenuExtensions() {
    if (this.extensions.length === 0) return "";
    return html`
      <div class="markdown-editor-preview__extension-menu-header">
        <span class="markdown-editor-preview__extension-menu-title"
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
    `;
  }

  /**
   * 拡張機能ドロップダウンメニューコンテナを描画する。
   */
  private renderExtensionMenu() {
    const containerClass = this.extensions.length > 0
      ? ""
      : "markdown-editor-preview__extension-menu-container--responsive";

    return html`
      <div
        class="markdown-editor-preview__extension-menu-container ${containerClass}"
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
          ${this.renderMenuSecondaryActions()}
          ${this.renderMenuExtensions()}
        </div>
      </div>
    `;
  }

  /**
   * Markdown 書式ツールバーを描画する。
   */
  private renderToolbar() {
    const separatorClass = this.extensions.length > 0
      ? ""
      : "markdown-editor-preview__toolbar-menu-separator--responsive";

    return html`
      <div
        class="markdown-editor-preview__toolbar"
        role="toolbar"
        aria-label="Markdown 書式ツールバー"
      >
        ${this.renderToolbarBasicActions()}
        <span
          class="markdown-editor-preview__toolbar-separator markdown-editor-preview__toolbar-item--secondary"
        ></span>
        ${this.renderToolbarSecondaryActions()}
        <span
          class="markdown-editor-preview__toolbar-separator markdown-editor-preview__toolbar-menu-separator ${separatorClass}"
        ></span>
        ${this.renderExtensionMenu()}
      </div>
    `;
  }

  /**
   * 自動伸長トグルボタンを描画する。
   */
  private renderAutoHeightButton() {
    if (!this.allowAutoHeight) return "";

    return html`
      <button
        type="button"
        class="markdown-editor-preview__auto-height-btn ${this.autoHeight
          ? "markdown-editor-preview__auto-height-btn--active"
          : ""}"
        title=${this.autoHeight
          ? "固定サイズ表示に切り替え"
          : "高さを自動伸縮（コンテンツにフィット）"}
        aria-label=${this.autoHeight
          ? "固定サイズ表示に切り替え"
          : "高さを自動伸縮（コンテンツにフィット）"}
        aria-pressed=${this.autoHeight ? "true" : "false"}
        @click=${(e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleAutoHeight();
        }}
      >
        <wa-icon
          library="my-icons"
          name="arrows-up-down-solid-full"
          label=${this.autoHeight ? "固定サイズ表示" : "自動伸縮"}
        ></wa-icon>
      </button>
    `;
  }

  /**
   * 構文ヘルプボタンを描画する。
   */
  private renderHelpButton() {
    return html`
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
    `;
  }

  /**
   * スプリットモード切替タブボタンを描画する。
   */
  private renderSplitTabButton() {
    if (!this.allowSplit) return "";
    const activeClass = this.mode === "split" ? "markdown-editor-preview__mode-btn--active" : "";

    return html`
      <button
        type="button"
        class="markdown-editor-preview__mode-btn ${activeClass}"
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
    `;
  }

  /**
   * 表示モード切替タブグループを描画する。
   */
  private renderModeSwitchTabs() {
    return html`
      <div
        class="markdown-editor-preview__mode-group"
        role="tablist"
        aria-label="表示モード切替"
      >
        ${this.renderSplitTabButton()}
        ${MODE_TABS.map(
          (tab) => html`
            <button
              type="button"
              class="markdown-editor-preview__mode-btn ${this.mode === tab.mode
                ? "markdown-editor-preview__mode-btn--active"
                : ""}"
              role="tab"
              aria-selected=${this.mode === tab.mode}
              title="${tab.label}"
              aria-label="${tab.label}"
              @click=${() => this.setMode(tab.mode)}
            >
              <wa-icon
                library="my-icons"
                name="${tab.icon}"
                label="${tab.label}"
              ></wa-icon>
            </button>
          `,
        )}
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
          ${this.renderAutoHeightButton()}
          ${this.renderHelpButton()}
          ${this.renderModeSwitchTabs()}
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
            ?auto-height=${this.autoHeight}
            .autoHeight=${this.autoHeight}
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
            ?auto-height=${this.autoHeight}
            .autoHeight=${this.autoHeight}
          ></markdown-preview>
        </div>
      </div>
    `;
  }

  /**
   * 構文ヘルプモーダルを閉じる。
   */
  private handleCloseHelp(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.toggleHelp(false);
  }

  /**
   * 構文ヘルプダイアログ内の拡張機能・独自タグテーブルを描画する。
   */
  private renderHelpExtensionTable() {
    if (this.extensions.length === 0) return "";

    return html`
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
                      @click=${() => this.insertExtensionTemplate(ext)}
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
    `;
  }

  /**
   * 構文ヘルプダイアログ内の基本 Markdown 記法テーブルを描画する。
   */
  private renderHelpBasicTable() {
    return html`
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
            ${BASIC_MARKDOWN_HELP_ROWS.map(
              (row) => html`
                <tr>
                  <td>${row.name}</td>
                  <td><code>${row.syntax}</code></td>
                  <td>${row.result}</td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </section>
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
          @click=${(e: Event) => this.handleCloseHelp(e)}
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
              @click=${(e: Event) => this.handleCloseHelp(e)}
            >
              <wa-icon
                library="my-icons"
                name="xmark-solid-full"
                label="閉じる"
              ></wa-icon>
            </button>
          </header>
          <div class="markdown-editor-preview__help-content">
            ${this.renderHelpExtensionTable()}
            ${this.renderHelpBasicTable()}
          </div>
        </div>
      </div>
    `;
  }

  override render() {
    const modeClass = `markdown-editor-preview--mode-${this.mode}`;
    const autoHeightClass = this.autoHeight
      ? "markdown-editor-preview--auto-height"
      : "";
    const animatingClass = this.isTransitioning
      ? "markdown-editor-preview--animating"
      : "";
    const heightStyle =
      this.effectiveHeight && !this.isTransitioning
        ? `height: ${this.effectiveHeight};`
        : "";

    return html`
      <div
        class="markdown-editor-preview ${modeClass} ${autoHeightClass} ${animatingClass}"
        style=${heightStyle || nothing}
      >
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
