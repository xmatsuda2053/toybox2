import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import editorPreviewStyles from "./markdown-editor-preview.scss?inline";
import type { Extension } from "@codemirror/state";
import type {
  MarkdownProcessorOptions,
  MarkdownFeatureExtension,
  MarkdownDarkThemeVariant,
  MarkdownLightThemeVariant,
  MarkdownEditorCommand,
} from "../types.js";
import { debounce } from "@shared/utils";
import {
  observeThemeChanges,
  resolveThemeMode,
  applyHostThemeSync,
} from "../utils/theme-sync.js";
import {
  MarkdownEditor,
  type MarkdownActionType,
} from "../editor/markdown-editor.js";
import "../preview/markdown-preview.js";
import { formatMarkdown } from "../formatter/markdown-formatter.js";
import { customBadgeExtension } from "../extensions/custom-badge.extension.js";
import { colorExtension } from "../extensions/color.extension.js";
import { calloutExtension } from "../extensions/callout.extension.js";
import "@awesome.me/webawesome/dist/components/dropdown/dropdown.js";
import "@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";

export type MarkdownDisplayMode = "split" | "edit" | "preview";

interface ToolbarButtonDef {
  readonly action: MarkdownActionType;
  readonly icon: string;
  readonly label: string;
}

const BASIC_TOOLBAR_BUTTONS: readonly ToolbarButtonDef[] = [
  { action: "heading", icon: "heading-solid-full", label: "見出し" },
  { action: "bold", icon: "bold-solid-full", label: "太字" },
  {
    action: "bullet-list",
    icon: "list-ul-solid-full",
    label: "箇条書きリスト",
  },
  { action: "task-list", icon: "list-check-solid-full", label: "タスクリスト" },
];

const SECONDARY_TOOLBAR_BUTTONS: readonly ToolbarButtonDef[] = [
  {
    action: "ordered-list",
    icon: "list-ol-solid-full",
    label: "番号付きリスト",
  },
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
 * MarkdownEditorPreview の標準拡張機能リスト
 */
export const DEFAULT_MARKDOWN_EXTENSIONS: readonly MarkdownFeatureExtension[] = [
  customBadgeExtension,
  colorExtension,
  calloutExtension,
];

/**
 * 拡張機能設定をマージした MarkdownProcessorOptions を生成する純粋関数
 */
function computeEffectiveProcessorOptions(
  baseOptions: MarkdownProcessorOptions | undefined,
  extensions: readonly MarkdownFeatureExtension[],
): MarkdownProcessorOptions {
  const options = baseOptions || {};
  const extRemarkPlugins = extensions.flatMap(
    (e) => e.processor?.remarkPlugins || [],
  );
  const extRehypePlugins = extensions.flatMap(
    (e) => e.processor?.rehypePlugins || [],
  );
  const extSanitizers = extensions
    .map((e) => e.processor?.sanitizeSchemaModifier)
    .filter((fn): fn is NonNullable<typeof fn> => typeof fn === "function");

  let sanitizeSchemaModifier = options.sanitizeSchemaModifier;
  if (extSanitizers.length > 0) {
    sanitizeSchemaModifier = (schema) => {
      let current = options.sanitizeSchemaModifier
        ? options.sanitizeSchemaModifier(schema)
        : schema;
      for (const modifier of extSanitizers) {
        current = modifier(current);
      }
      return current;
    };
  }

  return {
    remarkPlugins: [...(options.remarkPlugins || []), ...extRemarkPlugins],
    rehypePlugins: [...(options.rehypePlugins || []), ...extRehypePlugins],
    sanitizeSchemaModifier,
  };
}

/**
 * 拡張機能設定をマージした CodeMirror 拡張機能リストを生成する純粋関数
 */
function computeEffectiveEditorExtensions(
  customExtensions: readonly Extension[],
  extensions: readonly MarkdownFeatureExtension[],
): Extension[] {
  const extEditorExtensions = extensions.flatMap(
    (e) => e.editorExtensions || [],
  );
  return [...customExtensions, ...extEditorExtensions];
}

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
  @property({ type: String, attribute: "title-text" })
  public titleText = "";

  /** プラグイン・サニタイズ設定オプション (DI) */
  @property({ type: Object })
  public processorOptions?: MarkdownProcessorOptions;

  /** テーマモード ("light" | "dark" | "auto") */
  @property({ type: String, attribute: "theme-mode" })
  public themeMode: "light" | "dark" | "auto" = "auto";

  /** ダークモードスタイル種別 ("contrast" | "soft") */
  @property({ type: String, attribute: "dark-theme" })
  public darkTheme: MarkdownDarkThemeVariant = "contrast";

  /** ライトモードスタイル種別 ("default") */
  @property({ type: String, attribute: "light-theme" })
  public lightTheme: MarkdownLightThemeVariant = "default";

  /** 固定サイズ表示時の高さ（例: "400px", "50vh", 500） */
  @property()
  public height?: string | number;

  /**
   * 有効な固定高さを取得する。
   * 数値や単位なし文字列の場合は "px" を自動補完する。
   */
  public get effectiveHeight(): string | undefined {
    if (
      this.height === undefined ||
      this.height === null ||
      this.height === ""
    ) {
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

  /** 削除ボタンの表示有無 */
  @property({ type: Boolean, attribute: "show-delete-button" })
  public showDeleteButton = false;

  /** カスタムコマンド定義リスト（最大10件、コマンド0〜コマンド9） */
  @property({ type: Array })
  public commands: readonly MarkdownEditorCommand[] = [];

  /** 拡張機能パッケージ (DI) */
  @property({ attribute: false })
  public extensions: MarkdownFeatureExtension[] = [...DEFAULT_MARKDOWN_EXTENSIONS];

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

  /** エディタ操作メニュー（右端ドロップダウン）の開閉状態 */
  @state()
  public isActionMenuOpen = false;


  private cachedProcessorOptions?: MarkdownProcessorOptions;
  private lastProcessorOptionsSource?: MarkdownProcessorOptions;
  private lastExtensionsForProcessor?: readonly MarkdownFeatureExtension[];
  private cachedEditorExtensions?: Extension[];
  private lastCustomExtensions?: readonly Extension[];
  private lastExtensionsForEditor?: readonly MarkdownFeatureExtension[];

  /**
   * 拡張機能の設定をマージした有効な MarkdownProcessorOptions を取得する。
   */
  public get effectiveProcessorOptions(): MarkdownProcessorOptions {
    if (
      this.cachedProcessorOptions &&
      this.lastProcessorOptionsSource === this.processorOptions &&
      this.lastExtensionsForProcessor === this.extensions
    ) {
      return this.cachedProcessorOptions;
    }
    this.lastProcessorOptionsSource = this.processorOptions;
    this.lastExtensionsForProcessor = this.extensions;
    this.cachedProcessorOptions = computeEffectiveProcessorOptions(
      this.processorOptions,
      this.extensions,
    );
    return this.cachedProcessorOptions;
  }

  /**
   * 拡張機能の設定をマージした有効な CodeMirror 拡張機能リストを取得する。
   */
  public get effectiveEditorExtensions(): Extension[] {
    if (
      this.cachedEditorExtensions &&
      this.lastCustomExtensions === this.customExtensions &&
      this.lastExtensionsForEditor === this.extensions
    ) {
      return this.cachedEditorExtensions;
    }
    this.lastCustomExtensions = this.customExtensions;
    this.lastExtensionsForEditor = this.extensions;
    this.cachedEditorExtensions = computeEffectiveEditorExtensions(
      this.customExtensions,
      this.extensions,
    );
    return this.cachedEditorExtensions;
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
      if (this.isActionMenuOpen) {
        this.toggleActionMenu(false);
      }
    }
  };

  private handleGlobalClick = (e: MouseEvent): void => {
    const path = e.composedPath();

    if (this.isExtensionMenuOpen) {
      const extContainer = this.renderRoot?.querySelector(
        ".markdown-editor-preview__extension-menu-container",
      );
      if (extContainer && !path.includes(extContainer)) {
        this.toggleExtensionMenu(false);
      }
    }

    if (this.isActionMenuOpen) {
      const actionContainer = this.renderRoot?.querySelector(
        ".markdown-editor-preview__action-menu-container",
      );
      if (actionContainer && !path.includes(actionContainer)) {
        this.toggleActionMenu(false);
      }
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.previewValue = this.value;
    this.syncTheme();
    this.disconnectThemeObserver = observeThemeChanges(() => {
      this.syncTheme();
    });
    this.addEventListener("keydown", this.handleGlobalKeydown);
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleGlobalKeydown);
      window.addEventListener("click", this.handleGlobalClick);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.disconnectThemeObserver?.();
    this.removeEventListener("keydown", this.handleGlobalKeydown);
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

    if (
      changedProperties.has("themeMode") ||
      changedProperties.has("darkTheme") ||
      changedProperties.has("lightTheme")
    ) {
      this.syncTheme();
    }

    if (changedProperties.has("height")) {
      if (this.style) {
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
  public syncTheme(): void {
    const isDark = resolveThemeMode(this.themeMode, this);
    this.currentTheme = isDark ? "dark" : "light";
    applyHostThemeSync(this, isDark, this.darkTheme, this.lightTheme);
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
   * エディタへ指定された構文テンプレート文字列を挿入する。
   *
   * @param template 挿入対象の構文文字列
   */
  public insertTemplateText(template: string): void {
    const editor = this.renderRoot?.querySelector(
      "markdown-editor",
    ) as MarkdownEditor | null;
    if (editor) {
      editor.insertTemplate(template);
    } else {
      // Node.js テスト環境等で shadowRoot 内の子要素が未接続の場合のフォールバック
      this.value = this.value ? `${this.value}\n${template}` : template;
      this.handleEditorChange(this.value);
    }
  }

  /**
   * 拡張機能のツールバーアクションを実行する。
   *
   * @param ext 拡張機能定義
   */
  public handleExtensionAction(ext: MarkdownFeatureExtension): void {
    this.insertTemplateText(ext.template);
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
    const dropdown = this.renderRoot?.querySelector<
      HTMLElement & { open: boolean }
    >(".markdown-editor-preview__extension-menu-dropdown");
    if (dropdown) {
      dropdown.open = open ?? !dropdown.open;
      this.isExtensionMenuOpen = dropdown.open;
    } else {
      this.isExtensionMenuOpen = open ?? !this.isExtensionMenuOpen;
    }
  }

  /**
   * 拡張機能ドロップダウンメニューの項目選択イベントをハンドリングする。
   *
   * @param event wa-select カスタムイベント
   */
  public handleExtensionMenuSelect(
    event: CustomEvent<{ item: { value: string } }>,
  ): void {
    const value = event.detail.item.value;
    if (!value) return;

    if (value.startsWith("sub:")) {
      const parts = value.split(":");
      const extId = parts[1];
      const subId = parts[2];
      const ext = this.extensions.find((e) => e.id === extId);
      const sub = ext?.subItems?.find((s) => s.id === subId);
      if (sub) {
        this.insertTemplateText(sub.template);
      }
    } else if (value.startsWith("ext:")) {
      const extId = value.slice("ext:".length);
      const ext = this.extensions.find((e) => e.id === extId);
      if (ext) {
        this.insertTemplateText(ext.template);
      }
    } else if (value.startsWith("action:")) {
      const action = value.slice("action:".length) as MarkdownActionType;
      this.handleToolbarAction(action);
    }
  }

  /**
   * エディタ操作メニュー（右端ドロップダウン）の開閉を切り替える。
   *
   * @param open 指定した開閉状態（省略時はトグル）
   */
  public toggleActionMenu(open?: boolean): void {
    const dropdown = this.renderRoot?.querySelector<
      HTMLElement & { open: boolean }
    >(".markdown-editor-preview__action-menu-dropdown");
    if (dropdown) {
      dropdown.open = open ?? !dropdown.open;
      this.isActionMenuOpen = dropdown.open;
    } else {
      this.isActionMenuOpen = open ?? !this.isActionMenuOpen;
    }
  }

  /**
   * エディタ操作メニュー内の項目選択イベントをハンドリングする。
   *
   * @param event wa-select カスタムイベント
   */
  public async handleActionMenuSelect(
    event: CustomEvent<{ item: { value: string } }>,
  ): Promise<void> {
    const value = event.detail.item.value;
    if (value === "copy") {
      await this.handleMenuCopyAction();
    } else if (value === "format") {
      await this.handleMenuFormatAction();
    } else if (value === "help") {
      this.handleMenuHelpAction();
    } else if (value === "delete") {
      this.handleMenuDeleteAction();
    } else if (value.startsWith("command:")) {
      const index = parseInt(value.slice("command:".length), 10);
      this.handleMenuCustomCommand(index);
    }
  }

  /**
   * 指定されたインデックスのカスタムコマンドを実行し、定義されたイベントを発火する。
   *
   * @param index コマンドインデックス (0〜9)
   */
  public handleMenuCustomCommand(index: number): void {
    const cmd = this.commands[index];
    if (!cmd) return;
    this.dispatchEvent(
      new CustomEvent(cmd.eventName, {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * エディタメニュー内から削除アクションを実行し、markdown-delete イベントを発火する。
   */
  public handleMenuDeleteAction(): void {
    this.dispatchEvent(
      new CustomEvent("markdown-delete", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * エディタメニュー内から構文ヘルプモーダルを開き、メニューを閉じる。
   */
  public handleMenuHelpAction(): void {
    this.toggleActionMenu(false);
    this.toggleHelp(true);
  }

  /**
   * エディタメニュー内から Markdown の Raw データをクリップボードへコピーし、メニューを閉じる。
   */
  public async handleMenuCopyAction(): Promise<void> {
    this.toggleActionMenu(false);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(this.value);
    }
    this.dispatchEvent(
      new CustomEvent("markdown-copy", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * エディタメニュー内から Markdown フォーマッターを実行し、テキストを更新してメニューを閉じる。
   */
  public async handleMenuFormatAction(): Promise<void> {
    this.toggleActionMenu(false);
    const formatted = await formatMarkdown(this.value);
    this.setValue(formatted);
    this.handleEditorChange(formatted);
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
   * ツールバーのアクションボタンを描画する内部ヘルパー
   */
  private renderToolbarButton(btn: ToolbarButtonDef, isSecondary = false) {
    const secondaryClass = isSecondary
      ? " markdown-editor-preview__toolbar-item--secondary"
      : "";
    return html`
      <button
        type="button"
        class="markdown-editor-preview__toolbar-btn${secondaryClass}"
        title="${btn.label}"
        aria-label="${btn.label}"
        @click=${() => this.handleToolbarAction(btn.action)}
      >
        <wa-icon
          library="my-icons"
          name="${btn.icon}"
          label="${btn.label}"
        ></wa-icon>
      </button>
    `;
  }

  /**
   * ツールバーの主要書式アクションボタングループを描画する。
   */
  private renderToolbarBasicActions() {
    return html`
      ${BASIC_TOOLBAR_BUTTONS.slice(0, 2).map((btn) => this.renderToolbarButton(btn))}
      <span class="markdown-editor-preview__toolbar-separator"></span>
      ${BASIC_TOOLBAR_BUTTONS.slice(2).map((btn) => this.renderToolbarButton(btn))}
    `;
  }

  /**
   * ツールバーの二次的書式アクションボタングループを描画する。
   */
  private renderToolbarSecondaryActions() {
    return html`
      ${SECONDARY_TOOLBAR_BUTTONS.slice(0, 2).map((btn) => this.renderToolbarButton(btn, true))}
      <span
        class="markdown-editor-preview__toolbar-separator markdown-editor-preview__toolbar-item--secondary"
      ></span>
      ${SECONDARY_TOOLBAR_BUTTONS.slice(2).map((btn) => this.renderToolbarButton(btn, true))}
    `;
  }

  /**
   * 拡張メニュー内の追加書式セクションを描画する。
   */
  private renderMenuSecondaryActions() {
    return html`
      <div
        class="markdown-editor-preview__menu-section markdown-editor-preview__menu-section--secondary"
      >
        <h3 class="markdown-editor-preview__extension-menu-title">追加の書式</h3>
        ${SECONDARY_TOOLBAR_BUTTONS.map(
          (btn) => html`
            <wa-dropdown-item value="action:${btn.action}">
              <wa-icon
                slot="icon"
                library="my-icons"
                name="${btn.icon}"
                class="markdown-editor-preview__extension-menu-item-icon"
              ></wa-icon>
              ${btn.label}
            </wa-dropdown-item>
          `,
        )}
      </div>
    `;
  }

  /**
   * 拡張機能の各メニュー項目（またはサブメニュー）を描画する。
   */
  private renderExtensionMenuItem(ext: MarkdownFeatureExtension) {
    const iconName = ext.toolbarItem?.icon || "tag-solid-full";

    if (ext.subItems && ext.subItems.length > 0) {
      return html`
        <wa-dropdown-item>
          <wa-icon
            slot="icon"
            library="my-icons"
            name="${iconName}"
            class="markdown-editor-preview__extension-menu-item-icon"
          ></wa-icon>
          ${ext.label}
          ${ext.subItems.map(
            (sub) => html`
              <wa-dropdown-item
                slot="submenu"
                value="sub:${ext.id}:${sub.id}"
              >
                <wa-icon
                  slot="icon"
                  library="my-icons"
                  name="${sub.icon || iconName}"
                  class="markdown-editor-preview__extension-menu-item-icon"
                ></wa-icon>
                ${sub.label}
              </wa-dropdown-item>
            `,
          )}
        </wa-dropdown-item>
      `;
    }

    return html`
      <wa-dropdown-item value="ext:${ext.id}">
        <wa-icon
          slot="icon"
          library="my-icons"
          name="${iconName}"
          class="markdown-editor-preview__extension-menu-item-icon"
        ></wa-icon>
        ${ext.label}
      </wa-dropdown-item>
    `;
  }

  /**
   * 拡張メニュー内の独自記法・拡張機能セクションを描画する。
   */
  private renderMenuExtensions() {
    if (this.extensions.length === 0) return "";
    return html`
      <h3 class="markdown-editor-preview__extension-menu-title">独自記法・拡張機能</h3>
      ${this.extensions.map((ext) => this.renderExtensionMenuItem(ext))}
    `;
  }

  /**
   * 拡張機能ドロップダウンメニューコンテナを描画する。
   */
  private renderExtensionMenu() {
    const containerClass =
      this.extensions.length > 0
        ? ""
        : "markdown-editor-preview__extension-menu-container--responsive";

    return html`
      <div
        class="markdown-editor-preview__extension-menu-container ${containerClass}"
      >
        <wa-dropdown
          placement="bottom-start"
          class="markdown-editor-preview__extension-menu-dropdown"
          @wa-select=${(e: CustomEvent<{ item: { value: string } }>) =>
            this.handleExtensionMenuSelect(e)}
        >
          <button
            slot="trigger"
            type="button"
            class="markdown-editor-preview__toolbar-btn markdown-editor-preview__toolbar-btn--extension-menu"
            title="拡張機能"
            aria-label="拡張機能"
          >
            <wa-icon
              library="my-icons"
              name="ellipsis-solid-full"
              label="拡張機能"
            ></wa-icon>
          </button>
          ${this.renderMenuSecondaryActions()}
          ${this.renderMenuExtensions()}
        </wa-dropdown>
      </div>
    `;
  }

  /**
   * Markdown 書式ツールバーを描画する。
   */
  private renderToolbar() {
    const separatorClass =
      this.extensions.length > 0
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
   * スプリットモード切替タブボタンを描画する。
   */
  private renderSplitTabButton() {
    if (!this.allowSplit) return "";
    const activeClass =
      this.mode === "split" ? "markdown-editor-preview__mode-btn--active" : "";

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
   * カスタムコマンド（コマンド0〜9）のサブメニューを描画する。
   */
  private renderCommandSubmenu() {
    const activeCommands = this.commands.slice(0, 10);
    if (activeCommands.length === 0) return nothing;

    return html`
      <wa-dropdown-item>
        <wa-icon
          slot="icon"
          library="my-icons"
          name="terminal-solid-full"
          class="markdown-editor-preview__action-menu-item-icon"
        ></wa-icon>
        コマンド
        ${activeCommands.map(
          (cmd, index) => html`
            <wa-dropdown-item
              slot="submenu"
              value="command:${index}"
            >
              <wa-icon
                slot="icon"
                library="my-icons"
                name="number-${index}-solid-full"
                class="markdown-editor-preview__action-menu-item-icon"
              ></wa-icon>
              ${cmd.label}
            </wa-dropdown-item>
          `,
        )}
      </wa-dropdown-item>
    `;
  }

  /**
   * エディタ操作メニューの各アクション項目を描画する。
   */
  private renderActionMenuItems() {
    const hasExtendedActions =
      this.commands.length > 0 || this.showDeleteButton;

    return html`
      <wa-dropdown-item value="copy">
        <wa-icon
          slot="icon"
          library="my-icons"
          name="copy-solid-full"
          class="markdown-editor-preview__action-menu-item-icon"
        ></wa-icon>
        コピー
      </wa-dropdown-item>
      <wa-dropdown-item value="format">
        <wa-icon
          slot="icon"
          library="my-icons"
          name="wand-magic-sparkles-solid-full"
          class="markdown-editor-preview__action-menu-item-icon"
        ></wa-icon>
        整形
      </wa-dropdown-item>
      <wa-dropdown-item value="help">
        <wa-icon
          slot="icon"
          library="my-icons"
          name="question-solid-full"
          class="markdown-editor-preview__action-menu-item-icon"
        ></wa-icon>
        構文ヘルプ
      </wa-dropdown-item>
      ${hasExtendedActions ? html`<wa-divider></wa-divider>` : nothing}
      ${this.renderCommandSubmenu()}
      ${this.showDeleteButton
        ? html`
            <wa-dropdown-item variant="danger" value="delete">
              <wa-icon
                slot="icon"
                library="my-icons"
                name="trash-solid-full"
                class="markdown-editor-preview__action-menu-item-icon"
              ></wa-icon>
              削除
            </wa-dropdown-item>
          `
        : nothing}
    `;
  }

  /**
   * エディタ操作メニュー（最右端ドロップダウン）を描画する。
   */
  private renderActionMenu() {
    return html`
      <div class="markdown-editor-preview__action-menu-container">
        <wa-dropdown
          placement="bottom-end"
          class="markdown-editor-preview__action-menu-dropdown"
          @wa-select=${(e: CustomEvent<{ item: { value: string } }>) =>
            this.handleActionMenuSelect(e)}
        >
          <button
            slot="trigger"
            type="button"
            class="markdown-editor-preview__action-menu-btn"
            title="エディタメニュー"
            aria-label="エディタメニュー"
          >
            <wa-icon
              library="my-icons"
              name="bars-solid-full"
              label="エディタメニュー"
            ></wa-icon>
          </button>
          ${this.renderActionMenuItems()}
        </wa-dropdown>
      </div>
    `;
  }

  /**
   * プレビューモード時のヘッダータイトルを描画する。
   */
  private renderTitle() {
    if (!this.titleText || !this.titleText.trim()) {
      return nothing;
    }

    return html`
      <span
        class="markdown-editor-preview__title"
        title="${this.titleText}"
      >
        ${this.titleText}
      </span>
    `;
  }

  /**
   * ツールバーヘッダーを描画する。
   */
  private renderHeader() {
    return html`
      <header class="markdown-editor-preview__header">
        <div class="markdown-editor-preview__header-left">
          ${this.mode !== "preview" ? this.renderToolbar() : this.renderTitle()}
        </div>
        <div class="markdown-editor-preview__header-right">
          ${this.renderModeSwitchTabs()} ${this.renderActionMenu()}
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
            .darkTheme=${this.darkTheme}
            .lightTheme=${this.lightTheme}
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
            .darkTheme=${this.darkTheme}
            .lightTheme=${this.lightTheme}
            .content=${this.previewValue}
            .processorOptions=${this.effectiveProcessorOptions}
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
            <h3 class="markdown-editor-preview__help-title">
              Markdown 構文ヘルプ
            </h3>
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
            ${this.renderHelpExtensionTable()} ${this.renderHelpBasicTable()}
          </div>
        </div>
      </div>
    `;
  }

  override render() {
    const modeClass = `markdown-editor-preview--mode-${this.mode}`;
    const heightStyle = this.effectiveHeight
      ? `height: ${this.effectiveHeight};`
      : "";

    return html`
      <div
        class="markdown-editor-preview ${modeClass}"
        style=${heightStyle || nothing}
      >
        ${this.renderHeader()} ${this.renderBody()} ${this.renderHelpModal()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "markdown-editor-preview": MarkdownEditorPreview;
  }
}
