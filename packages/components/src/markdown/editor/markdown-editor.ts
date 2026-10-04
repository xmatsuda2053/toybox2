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
import { EditorState, type Extension } from "@codemirror/state";
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

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncTheme(false);
    this.disconnectThemeObserver = observeThemeChanges(() => {
      this.syncTheme(true);
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

    if (
      (changedProperties.has("themeMode") ||
        changedProperties.has("customExtensions") ||
        changedProperties.has("disabled")) &&
      this.editorView
    ) {
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
    }
  }

  /**
   * CodeMirror 拡張機能のリストを組み立てる。
   */
  private buildExtensions(): Extension[] {
    const extensions: Extension[] = [
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
    ];

    if (this.disabled) {
      extensions.push(EditorState.readOnly.of(true));
    }

    // テーマ設定: ダークモード判定時に oneDark を適用
    if (this.isDarkMode) {
      extensions.push(oneDark);
    }

    // 外部から注入された拡張機能 (DI)
    if (this.customExtensions && this.customExtensions.length > 0) {
      extensions.push(...this.customExtensions);
    }

    return extensions;
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
   * 拡張機能の設定変更をエディタビューへ再適用する。
   */
  private reconfigureEditor(): void {
    if (!this.editorView) return;
    this.initEditor();
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
