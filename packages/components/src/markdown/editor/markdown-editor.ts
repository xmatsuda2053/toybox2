import { LitElement, html, unsafeCSS, type PropertyValues } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import editorStyles from "./markdown-editor.scss?inline";
import {
  EditorView,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import {
  EditorState,
  Compartment,
  type Extension,
} from "@codemirror/state";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
} from "@codemirror/language";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  detectIsDarkMode,
  observeThemeChanges,
  syncHostTheme,
} from "../utils/theme-sync.js";
import {
  getFallbackMarkdownText,
  getLinePrefixForAction,
  getSurroundingSyntax,
} from "./markdown-syntax.utils.js";

/**
 * 拡張機能リストの浅い等価性（同一性または同等の要素並び）を検証する純粋関数
 */
function areExtensionsEqual(
  a?: readonly Extension[],
  b?: readonly Extension[],
): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  return a.every((item, i) => item === b[i]);
}

export type MarkdownActionType =
  | "heading"
  | "bold"
  | "italic"
  | "bullet-list"
  | "ordered-list"
  | "task-list"
  | "quote"
  | "code"
  | "link"
  | "table";

/**
 * Markdown エディタコンポーネント (<markdown-editor>)
 *
 * CodeMirror 6 を Shadow DOM 内に統合し、オフライン環境で
 * GFM シンタックスハイライト、行番号、編集履歴、拡張機能注入（DI）を提供する。
 */
@customElement("markdown-editor")
export class MarkdownEditor extends LitElement {
  public static override styles = unsafeCSS(editorStyles);

  /** エディタのドキュメントテキスト */
  @property({ type: String })
  public value = "";

  /** 編集不可フラグ */
  @property({ type: Boolean })
  public disabled = false;

  /** 入力内容に応じた自動伸長（Auto-grow）モード */
  @property({ type: Boolean, reflect: true, attribute: "auto-height" })
  public autoHeight = false;

  /** テーマモード ("light" | "dark" | "auto") */
  @property({ type: String })
  public themeMode: "light" | "dark" | "auto" = "auto";

  /** 外部から注入する追加の CodeMirror 拡張 (Open-Closed Principle) */
  @property({ attribute: false })
  public customExtensions: Extension[] = [];

  @query(".markdown-editor__container")
  private containerElement?: HTMLDivElement;

  private editorView?: EditorView;
  private disconnectThemeObserver?: () => void;
  private themeCompartment = new Compartment();
  private disabledCompartment = new Compartment();
  private customExtensionsCompartment = new Compartment();
  private lastAppliedDarkMode = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncTheme(false);
    this.disconnectThemeObserver = observeThemeChanges(() => {
      if (this.isDarkMode !== this.lastAppliedDarkMode) {
        this.syncTheme(true);
      }
    });
  }

  override firstUpdated(): void {
    this.initEditor();
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has("value") && this.editorView) {
      const currentDoc = this.editorView.state.doc.toString();
      if (this.value !== currentDoc) {
        this.editorView.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: this.value },
        });
      }
    }

    this.handleDynamicReconfigure(changedProperties);
  }

  /**
   * テーマや拡張機能の変更を検知し、実質的な差分がある場合のみ再構成を実行する。
   */
  private handleDynamicReconfigure(changedProperties: PropertyValues): void {
    if (!this.editorView) return;

    const prevExtensions = changedProperties.get("customExtensions") as
      | Extension[]
      | undefined;
    const extensionsChanged =
      changedProperties.has("customExtensions") &&
      !areExtensionsEqual(prevExtensions, this.customExtensions);

    const themeChanged =
      (changedProperties.has("themeMode") &&
        this.themeMode !== changedProperties.get("themeMode")) ||
      this.isDarkMode !== this.lastAppliedDarkMode;

    const disabledChanged = changedProperties.has("disabled");

    if (themeChanged || extensionsChanged || disabledChanged) {
      this.syncTheme(true);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.disconnectThemeObserver?.();
    this.editorView?.destroy();
    this.editorView = undefined;
  }

  /**
   * 現在ダークモードが有効かどうかを取得する。
   */
  public get isDarkMode(): boolean {
    if (this.themeMode === "dark") return true;
    if (this.themeMode === "light") return false;
    return detectIsDarkMode(this);
  }

  /**
   * ホスト要素のテーマ属性およびクラスを同期し、必要に応じてエディタを再構成する。
   */
  private syncTheme(reconfigureEditor = false): void {
    syncHostTheme(this, this.isDarkMode);

    if (reconfigureEditor && this.editorView) {
      this.reconfigureEditor();
    } else {
      this.lastAppliedDarkMode = this.isDarkMode;
    }
  }

  /**
   * CodeMirror 拡張機能のリストを組み立てる。
   */
  private buildExtensions(): Extension[] {
    this.lastAppliedDarkMode = this.isDarkMode;
    return [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      keymap.of([
        indentWithTab,
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
      ]),
      markdown(),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          this.value = newValue;
          this.notifyChange(newValue);
        }
      }),
      this.disabledCompartment.of(
        this.disabled ? EditorState.readOnly.of(true) : [],
      ),
      this.themeCompartment.of(this.isDarkMode ? oneDark : []),
      this.customExtensionsCompartment.of(this.customExtensions || []),
    ];
  }

  /**
   * CodeMirror 6 エディタビューを初期化する。
   */
  private initEditor(): void {
    if (!this.containerElement) return;

    this.editorView?.destroy();

    const startState = EditorState.create({
      doc: this.value,
      extensions: this.buildExtensions(),
    });

    this.editorView = new EditorView({
      state: startState,
      parent: this.containerElement,
      root: (this.shadowRoot as unknown as Document) ?? document,
    });
  }

  /**
   * 拡張機能・テーマ設定の変更を Compartment 経由でエディタビューへ動的に再適用する。
   * エディタインスタンスを破棄（destroy）しないため、カーソル位置・履歴・フォーカスが保護される。
   */
  private reconfigureEditor(): void {
    if (!this.editorView) return;

    this.lastAppliedDarkMode = this.isDarkMode;
    this.editorView.dispatch({
      effects: [
        this.themeCompartment.reconfigure(this.isDarkMode ? oneDark : []),
        this.disabledCompartment.reconfigure(
          this.disabled ? EditorState.readOnly.of(true) : [],
        ),
        this.customExtensionsCompartment.reconfigure(
          this.customExtensions || [],
        ),
      ],
    });
  }

  /**
   * 現在のエディタのテキストを取得する。
   */
  public getValue(): string {
    if (this.editorView) {
      return this.editorView.state.doc.toString();
    }
    return this.value;
  }

  /**
   * エディタのテキストを外部から更新する。
   */
  public setValue(newValue: string): void {
    this.value = newValue;
    if (this.editorView) {
      const currentDoc = this.editorView.state.doc.toString();
      if (newValue !== currentDoc) {
        this.editorView.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: newValue },
        });
      }
    }
  }

  /**
   * 指定された構文アクションに基づいて Markdown テキストを挿入または選択範囲をラップする。
   *
   * @param action Markdown アクション種別
   */
  public insertMarkdown(action: MarkdownActionType): void {
    if (this.disabled) return;

    if (!this.editorView) {
      this.value = getFallbackMarkdownText(action, this.value);
      this.notifyChange(this.value);
      return;
    }

    const view = this.editorView;
    const state = view.state;
    const { from, to } = state.selection.main;
    const linePrefix = getLinePrefixForAction(action);

    if (linePrefix !== null) {
      const line = state.doc.lineAt(from);
      view.dispatch({
        changes: { from: line.from, to: line.from, insert: linePrefix },
        selection: { anchor: from + linePrefix.length },
      });
      view.focus();
      return;
    }

    const selectedText = state.sliceDoc(from, to);
    const isPrecededByNewline =
      from === 0 || state.sliceDoc(from - 1, from) === "\n";
    const { insertText, anchor, head } = getSurroundingSyntax(
      action,
      selectedText,
      from,
      to,
      isPrecededByNewline,
    );

    view.dispatch({
      changes: { from, to, insert: insertText },
      selection: { anchor, head },
    });
    view.focus();
  }

  /**
   * 拡張機能などの構文テンプレートをエディタに挿入する。
   *
   * @param template 構文テンプレート (例: ":badge[ラベル]:")
   */
  public insertTemplate(template: string): void {
    if (this.disabled) return;

    if (!this.editorView) {
      this.value = this.value ? `${this.value}\n${template}` : template;
      this.notifyChange(this.value);
      return;
    }

    const view = this.editorView;
    const state = view.state;
    const { from, to } = state.selection.main;
    const selectedText = state.sliceDoc(from, to);

    let insertText = template;
    if (selectedText && /\[.*?\]/.test(template)) {
      insertText = template.replace(/\[.*?\]/, `[${selectedText}]`);
    }

    const newAnchor = from + insertText.length;
    view.dispatch({
      changes: { from, to, insert: insertText },
      selection: { anchor: newAnchor, head: newAnchor },
    });
    view.focus();
  }


  /**
   * テキスト変更カスタムイベントを発火する。
   */
  public notifyChange(newValue: string): void {
    this.dispatchEvent(
      new CustomEvent("markdown-change", {
        detail: { value: newValue },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * エディタへフォーカスを当てる。
   */
  public override focus(): void {
    this.editorView?.focus();
  }

  override render() {
    const autoHeightClass = this.autoHeight
      ? "markdown-editor--auto-height"
      : "";

    return html`
      <div class="markdown-editor ${autoHeightClass}">
        <div class="markdown-editor__container"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "markdown-editor": MarkdownEditor;
  }
}
