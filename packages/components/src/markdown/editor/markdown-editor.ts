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
import { detectIsDarkMode, observeThemeChanges } from "../utils/theme-sync.js";

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
    const isDark = this.isDarkMode;
    const targetTheme = isDark ? "dark" : "light";

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
      // Node.js テスト環境または editorView 未初期化時のフォールバック処理
      let inserted = "";
      switch (action) {
        case "bold":
          inserted = this.value ? `**${this.value}**` : "**太字**";
          break;
        case "italic":
          inserted = this.value ? `*${this.value}*` : "*斜体*";
          break;
        case "heading":
          inserted = `### ${this.value || "見出し"}`;
          break;
        case "bullet-list":
          inserted = `- ${this.value || "項目"}`;
          break;
        case "ordered-list":
          inserted = `1. ${this.value || "項目"}`;
          break;
        case "task-list":
          inserted = `- [ ] ${this.value || "タスク"}`;
          break;
        case "quote":
          inserted = `> ${this.value || "引用文"}`;
          break;
        case "code":
          inserted = this.value ? `\`${this.value}\`` : "`コード`";
          break;
        case "link":
          inserted = `[${this.value || "リンク"}](url)`;
          break;
        case "table":
          inserted = `${this.value ? this.value + "\n\n" : ""}| 列1 | 列2 | 列3 |\n| :--- | :--- | :--- |\n| 項目1 | 項目2 | 項目3 |\n`;
          break;
      }
      this.value = inserted;
      this.notifyChange(this.value);
      return;
    }

    const view = this.editorView;
    const state = view.state;
    const { from, to } = state.selection.main;
    const selectedText = state.sliceDoc(from, to);

    let insertText = "";
    let newAnchor = from;
    let newHead = from;

    switch (action) {
      case "bold":
        if (selectedText) {
          insertText = `**${selectedText}**`;
          newAnchor = from + 2;
          newHead = to + 2;
        } else {
          insertText = "**太字**";
          newAnchor = from + 2;
          newHead = from + 4;
        }
        break;
      case "italic":
        if (selectedText) {
          insertText = `*${selectedText}*`;
          newAnchor = from + 1;
          newHead = to + 1;
        } else {
          insertText = "*斜体*";
          newAnchor = from + 1;
          newHead = from + 3;
        }
        break;
      case "heading": {
        const line = state.doc.lineAt(from);
        insertText = "### ";
        view.dispatch({
          changes: { from: line.from, to: line.from, insert: insertText },
          selection: { anchor: from + insertText.length },
        });
        view.focus();
        return;
      }
      case "bullet-list": {
        const line = state.doc.lineAt(from);
        insertText = "- ";
        view.dispatch({
          changes: { from: line.from, to: line.from, insert: insertText },
          selection: { anchor: from + insertText.length },
        });
        view.focus();
        return;
      }
      case "ordered-list": {
        const line = state.doc.lineAt(from);
        insertText = "1. ";
        view.dispatch({
          changes: { from: line.from, to: line.from, insert: insertText },
          selection: { anchor: from + insertText.length },
        });
        view.focus();
        return;
      }
      case "task-list": {
        const line = state.doc.lineAt(from);
        insertText = "- [ ] ";
        view.dispatch({
          changes: { from: line.from, to: line.from, insert: insertText },
          selection: { anchor: from + insertText.length },
        });
        view.focus();
        return;
      }
      case "quote": {
        const line = state.doc.lineAt(from);
        insertText = "> ";
        view.dispatch({
          changes: { from: line.from, to: line.from, insert: insertText },
          selection: { anchor: from + insertText.length },
        });
        view.focus();
        return;
      }
      case "code":
        if (selectedText.includes("\n")) {
          insertText = `\`\`\`\n${selectedText}\n\`\`\``;
          newAnchor = from + 4;
          newHead = to + 4;
        } else if (selectedText) {
          insertText = `\`${selectedText}\``;
          newAnchor = from + 1;
          newHead = to + 1;
        } else {
          insertText = "`コード`";
          newAnchor = from + 1;
          newHead = from + 4;
        }
        break;
      case "link":
        if (selectedText) {
          insertText = `[${selectedText}](url)`;
          newAnchor = to + 3;
          newHead = to + 6;
        } else {
          insertText = "[リンク](url)";
          newAnchor = from + 1;
          newHead = from + 4;
        }
        break;
      case "table": {
        const prefix =
          from > 0 && state.sliceDoc(from - 1, from) !== "\n" ? "\n\n" : "";
        insertText = `${prefix}| 列1 | 列2 | 列3 |\n| :--- | :--- | :--- |\n| 項目1 | 項目2 | 項目3 |\n`;
        newAnchor = from + insertText.length;
        newHead = newAnchor;
        break;
      }
    }

    view.dispatch({
      changes: { from, to, insert: insertText },
      selection: { anchor: newAnchor, head: newHead },
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
    return html`
      <div class="markdown-editor">
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
