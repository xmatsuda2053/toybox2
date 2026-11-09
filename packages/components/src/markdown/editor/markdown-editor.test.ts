/**
 * MarkdownEditor コンポーネント単体テスト仕様
 *
 * 1. 初期化とプロパティ
 *   - 初期状態で value が空文字列、または指定した文字列を保持すること
 *   - getValue() で現在のドキュメント文字列を取得できること
 * 2. プロパティ更新と同期
 *   - setValue() によりテキストが正常に更新されること
 * 3. 変更イベント通知
 *   - dispatchChangeEvent() により "markdown-change" カスタムイベントが最新値とともに発火すること
 * 4. 拡張機能の注入（Open-Closed Principle）
 *   - customExtensions で外部から注入された CodeMirror 拡張が認識されること
 * 5. Markdown構文の挿入機能 (insertMarkdown)
 *   - "bold" アクションで太字構文が挿入されること
 *   - "heading" アクションで見出し構文が挿入されること
 *   - "task-list" アクションでタスクリスト構文が挿入されること
 * 6. 選択範囲・ドラッグ操作時の視覚スタイル定義 (Selection & Drag Visibility)
 *   - .cm-content の背景色が透明に設定され、背面の選択レイヤーを遮蔽しないこと
 *   - 選択範囲ハイライト (.cm-selectionBackground) に明瞭な背景色が指定されていること
 *   - ドラッグ時のドロップカーソル (.cm-dropCursor) に視認性の高いボーダーが指定されていること
 *   - ダークモード用の選択範囲ハイライトおよびドロップカーソルが指定されていること
 * 7. エディタのフォントスタイル定義 (Monospace Font)
 *   - :host に Windows 標準の等幅フォント（Consolas, Cascadia, BIZ UDGothic, monospace 等）が指定されていること
 * 8. 拡張機能・プロパティ変更時の再構成制御とエディタ保護
 *   - customExtensions に要素が同一の別配列インスタンスが設定された場合、再構成処理（reconfigureEditor）が呼び出されないこと
 *   - isDarkMode が変化しない themeMode 変更時、再構成処理（reconfigureEditor）が呼び出されないこと
 * 9. 複数回のテーマ切り替え時の整合性保護
 *   - themeMode が dark -> light -> dark と切り替わった際、各変更でホスト属性と再構成が同期して実行されること
 * 10. テーマスタイルバリアント制御（darkTheme / lightTheme）と soft ダークスタイル
 *   - darkTheme の初期値が 'contrast'、lightTheme の初期値が 'default' であること
 *   - darkTheme='soft' が指定された場合、ホスト要素に dark-theme='soft' 属性が設定されること
 *   - lightTheme='default' が指定された場合、ホスト要素に light-theme='default' 属性が設定されること
 *   - SCSS において :host([dark-theme='soft']) 用のスタイルが定義され、StepNote 調のエディタ・ガター配色が指定されていること
 * 11. 内部入力と外部更新の分離によるカーソル保護（SN-007）
 *   - エディタ内部での入力通知後、遅れて届いた updated でのエディタ全置換 dispatch がスキップされること
 *   - 外部からの value 変更時には、updated でエディタへの全置換 dispatch が実行されること
 * 12. 拡張機能構文テンプレート挿入時の選択文字列保持（SN-002）
 *   - 文字列選択時に callout テンプレートを挿入した際、選択文字列を内部に保持して dispatch されること
 *   - 文字列選択時に color テンプレートを挿入した際、選択文字列をカラー構文でラップして dispatch されること
 * 13. 長い半角英数字（URL等）の自然な折り返し制御（SN-006）
 *   - markdown-editor.scss において .cm-content および .cm-line に対し、word-break: break-all; および overflow-wrap: anywhere; が指定されていること
 * 14. 表示復帰・計測リフレッシュ機能 (refresh) (SN-021)
 *   - refresh() メソッドが実装されていること
 *   - refresh() 呼び出し時に editorView.requestMeasure() が呼び出されること
 *   - refresh() 呼び出し時に this.value と doc に差分がある場合、最新の value で同期更新されること
 * 15. フォーカス保護およびカーソル位置保持によるカーソルジャンプ防止（Issue #426）
 *   - エディタがフォーカス中（hasFocus: true）の場合、親からの遅延した value 変更（updated）による全置換 dispatch がスキップされること
 *   - 非フォーカス時に外部から value が変更された場合、全置換 dispatch 時に現在のカーソル位置（selection）がクランプ保持されること
 *   - setValue() 実行時には、フォーカス状態に関わらずエディタドキュメントが新しい値へ更新されること
 * 16. 外部値同期時（syncExternalValue / setValue / refresh）の変更イベント抑止（Issue #447）
 *   - 16-1. syncExternalValue() による全置換 dispatch の際、markdown-change カスタムイベントが発火しないこと
 *   - 16-2. setValue() による全置換 dispatch の際、markdown-change カスタムイベントが発火しないこと
 *   - 16-3. refresh() による全置換 dispatch の際、markdown-change カスタムイベントが発火しないこと
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MarkdownEditor, createMarkdownKeymap } from "./markdown-editor.js";
import { EditorView } from "@codemirror/view";

describe("MarkdownEditor (<markdown-editor>)", () => {
  let editor: MarkdownEditor;

  beforeEach(() => {
    editor = new MarkdownEditor();
  });

  describe("初期化とプロパティ", () => {
    it("初期状態で空文字列または指定値が保持されること", () => {
      expect(editor.value).toBe("");
      expect(editor.getValue()).toBe("");

      editor.value = "# 初期Markdown";
      expect(editor.getValue()).toBe("# 初期Markdown");
    });
  });

  describe("プロパティ更新と同期", () => {
    it("setValue() によりテキストが正常に更新されること", () => {
      editor.setValue("## 新しいテキスト");
      expect(editor.getValue()).toBe("## 新しいテキスト");
      expect(editor.value).toBe("## 新しいテキスト");
    });
  });

  describe("変更イベント通知", () => {
    it("テキスト変更時に markdown-change イベントが発火すること", () => {
      let eventDetail: { value: string } | null = null;
      editor.addEventListener("markdown-change", (e: Event) => {
        const customEvt = e as CustomEvent<{ value: string }>;
        eventDetail = customEvt.detail;
      });

      editor.notifyChange("入力テスト");

      expect(eventDetail).not.toBeNull();
      expect(eventDetail!.value).toBe("入力テスト");
    });
  });

  describe("拡張機能の注入（Open-Closed Principle）", () => {
    it("customExtensions で渡した CodeMirror 拡張が保持されること", () => {
      const dummyExtension = EditorView.theme({
        "&": { fontSize: "16px" },
      });

      editor.customExtensions = [dummyExtension];
      expect(editor.customExtensions).toHaveLength(1);
    });
  });

  describe("Markdown構文の挿入機能 (insertMarkdown)", () => {
    it("insertMarkdown('bold') により太字テキストが挿入またはラップされること", () => {
      editor.insertMarkdown("bold");
      expect(editor.value).toContain("**太字**");
    });

    it("insertMarkdown('heading') により見出し構文が挿入されること", () => {
      editor.value = "テスト行";
      editor.insertMarkdown("heading");
      expect(editor.value).toContain("### ");
    });

    it("insertMarkdown('task-list') によりタスク構文が挿入されること", () => {
      editor.value = "宿題をする";
      editor.insertMarkdown("task-list");
      expect(editor.value).toContain("- [ ] ");
    });

    it("insertMarkdown('strikethrough') により取り消し線構文が挿入されること", () => {
      editor.insertMarkdown("strikethrough");
      expect(editor.value).toContain("~~取り消し線~~");
    });
  });

  describe("Markdownキーボードショートカット (createMarkdownKeymap)", () => {
    it("Mod-b, Mod-i, Mod-Shift-x, Mod-Shift-t のキーバインディングが登録されていること", () => {
      const mockEditor = { insertMarkdown: vi.fn() };
      const keybindings = createMarkdownKeymap(mockEditor);

      const keys = keybindings.map((b) => b.key);
      expect(keys).toContain("Mod-b");
      expect(keys).toContain("Mod-i");
      expect(keys).toContain("Mod-Shift-x");
      expect(keys).toContain("Mod-Shift-t");
    });

    it("各キーバインディングの実行により、対応する insertMarkdown が呼び出され true を返すこと", () => {
      const mockEditor = { insertMarkdown: vi.fn() };
      const keybindings = createMarkdownKeymap(mockEditor);

      const bindingModB = keybindings.find((b) => b.key === "Mod-b");
      const bindingModI = keybindings.find((b) => b.key === "Mod-i");
      const bindingModShiftX = keybindings.find((b) => b.key === "Mod-Shift-x");
      const bindingModShiftT = keybindings.find((b) => b.key === "Mod-Shift-t");

      const dummyView = {} as unknown as EditorView;
      expect(bindingModB?.run?.(dummyView)).toBe(true);
      expect(mockEditor.insertMarkdown).toHaveBeenCalledWith("bold");

      expect(bindingModI?.run?.(dummyView)).toBe(true);
      expect(mockEditor.insertMarkdown).toHaveBeenCalledWith("italic");

      expect(bindingModShiftX?.run?.(dummyView)).toBe(true);
      expect(mockEditor.insertMarkdown).toHaveBeenCalledWith("strikethrough");

      expect(bindingModShiftT?.run?.(dummyView)).toBe(true);
      expect(mockEditor.insertMarkdown).toHaveBeenCalledWith("table");
    });
  });

  describe("選択範囲・ドラッグ操作時の視覚スタイル定義 (Selection & Drag Visibility)", () => {
    const scssPath = path.resolve(__dirname, "markdown-editor.scss");
    const scssContent = fs.readFileSync(scssPath, "utf-8");

    it(".cm-content の背景色が透明に設定され、背面の選択レイヤーを遮蔽しないこと", () => {
      expect(scssContent).toMatch(/\.cm-content\s*\{[^}]*background-color:\s*transparent/);
    });

    it("選択範囲ハイライト (.cm-selectionBackground) に明瞭なスタイルが指定されていること", () => {
      expect(scssContent).toMatch(/\.cm-selectionBackground/);
      expect(scssContent).toMatch(/rgba\(59,\s*130,\s*246/);
    });

    it("ドラッグ時のドロップカーソル (.cm-dropCursor) に視認性の高いボーダーが指定されていること", () => {
      expect(scssContent).toMatch(/\.cm-dropCursor/);
      expect(scssContent).toMatch(/border-left:\s*2px\s+solid/);
    });

    it("ダークモード用の選択範囲ハイライトおよびドロップカーソルが指定されていること", () => {
      expect(scssContent).toMatch(/rgba\(56,\s*189,\s*248/);
    });
  });

  describe("7. エディタのフォントスタイル定義 (Monospace Font)", () => {
    const scssPath = path.resolve(__dirname, "markdown-editor.scss");
    const scssContent = fs.readFileSync(scssPath, "utf-8");

    it(":host に Windows 標準の等幅フォント（Consolas, Cascadia, BIZ UDGothic, monospace 等）が指定されていること", () => {
      expect(scssContent).toMatch(/font-family:\s*[^;]*Consolas/);
      expect(scssContent).toMatch(/font-family:\s*[^;]*monospace/);
      expect(scssContent).toMatch(/font-family:\s*[^;]*['"]?BIZ UDGothic['"]?/);
      expect(scssContent).not.toMatch(/font-family:\s*['"]?Segoe UI/);
    });
  });

  type TestableMarkdownEditor = Omit<MarkdownEditor, "editorView"> & {
    editorView?: {
      destroy: () => void;
      dispatch: (args?: unknown) => void;
      state?: {
        doc: {
          toString: () => string;
          length: number;
        };
      };
    };
    reconfigureEditor: () => void;
    classList: DOMTokenList;
    handleInternalDocChange: (newValue: string) => void;
    isExternalSync?: boolean;
  };

  describe("8. 拡張機能・プロパティ変更時の再構成制御とエディタ保護", () => {
    it("customExtensions に要素が同一の別配列インスタンスが設定された場合、再構成処理がスキップされること", () => {
      const dummyExt = EditorView.theme({});
      editor.customExtensions = [dummyExt];
      const testable = editor as unknown as TestableMarkdownEditor;
      testable.classList = { add: vi.fn(), remove: vi.fn(), contains: vi.fn() } as unknown as DOMTokenList;
      testable.editorView = { destroy: vi.fn(), dispatch: vi.fn() };
      const reconfigureSpy = vi.spyOn(testable, "reconfigureEditor");

      editor.customExtensions = [dummyExt];
      const changedProps = new Map([["customExtensions", [dummyExt]]]);
      editor.updated(changedProps);

      expect(reconfigureSpy).not.toHaveBeenCalled();
    });

    it("isDarkMode が変化しない themeMode 変更時、再構成処理がスキップされること", () => {
      editor.themeMode = "light";
      const testable = editor as unknown as TestableMarkdownEditor;
      testable.classList = { add: vi.fn(), remove: vi.fn(), contains: vi.fn() } as unknown as DOMTokenList;
      testable.editorView = { destroy: vi.fn(), dispatch: vi.fn() };
      const reconfigureSpy = vi.spyOn(testable, "reconfigureEditor");

      const changedProps = new Map([["themeMode", "light"]]);
      editor.updated(changedProps);

      expect(reconfigureSpy).not.toHaveBeenCalled();
    });
  });

  describe("9. 複数回のテーマ切り替え時の整合性保護", () => {

    it("themeMode が dark -> light -> dark と切り替わった際、ホスト属性と再構成が正常に同期されること", () => {
      editor.themeMode = "dark";
      const testable = editor as unknown as TestableMarkdownEditor;
      const classSet = new Set<string>();
      testable.classList = {
        add: vi.fn((c: string) => classSet.add(c)),
        remove: vi.fn((c: string) => classSet.delete(c)),
        contains: vi.fn((c: string) => classSet.has(c)),
      } as unknown as DOMTokenList;
      testable.editorView = { destroy: vi.fn(), dispatch: vi.fn() };
      const reconfigureSpy = vi.spyOn(testable, "reconfigureEditor");

      // 1. dark -> light
      editor.themeMode = "light";
      editor.updated(new Map([["themeMode", "dark"]]));
      expect(reconfigureSpy).toHaveBeenCalledTimes(1);

      // 2. light -> dark
      editor.themeMode = "dark";
      editor.updated(new Map([["themeMode", "light"]]));
      expect(reconfigureSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("10. テーマスタイルバリアント制御（darkTheme / lightTheme）と soft ダークスタイル", () => {
    const scssPath = path.resolve(__dirname, "markdown-editor.scss");
    const scssContent = fs.readFileSync(scssPath, "utf-8");

    it("darkTheme の初期値が 'contrast'、lightTheme の初期値が 'default' であること", () => {
      expect(editor.darkTheme).toBe("contrast");
      expect(editor.lightTheme).toBe("default");
    });

    it("darkTheme='soft' が指定された場合、ホスト要素に dark-theme='soft' 属性が設定されること", () => {
      editor.darkTheme = "soft";
      editor.themeMode = "dark";
      editor.requestUpdate();
      editor.syncTheme();
      expect(editor.getAttribute("dark-theme")).toBe("soft");
    });

    it("lightTheme='default' が指定された場合、ホスト要素に light-theme='default' 属性が設定されること", () => {
      editor.lightTheme = "default";
      editor.themeMode = "light";
      editor.requestUpdate();
      editor.syncTheme();
      expect(editor.getAttribute("light-theme")).toBe("default");
    });

    it("SCSS において soft ダーク用のスタイルが定義され、StepNote 調のエディタ・ガター配色が指定されていること", () => {
      expect(scssContent).toMatch(/:host\(\[data-theme="dark"\]\[dark-theme="soft"\]\)/);
      expect(scssContent).toMatch(/--stepnote-bg-primary:\s*var\(--wa-color-surface-default,\s*#2f323f\)/);
    });
  });

  describe("11. 内部入力と外部更新の分離によるカーソル保護（SN-007）", () => {
    it("エディタ内部での入力通知後、遅れて届いた updated でのエディタ全置換 dispatch がスキップされること", () => {
      const testable = editor as unknown as TestableMarkdownEditor;
      const dispatchSpy = vi.fn();
      testable.editorView = {
        destroy: vi.fn(),
        dispatch: dispatchSpy,
        state: {
          doc: {
            toString: () => "入力テキスト最新",
            length: 8,
          },
        },
      } as unknown as TestableMarkdownEditor["editorView"];

      testable.handleInternalDocChange("入力テキスト");

      editor.value = "入力テキスト";
      editor.updated(new Map([["value", "古いテキスト"]]));

      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it("外部からの value 変更時には、updated でエディタへの全置換 dispatch が実行されること", () => {
      const testable = editor as unknown as TestableMarkdownEditor;
      const dispatchSpy = vi.fn();
      testable.editorView = {
        destroy: vi.fn(),
        dispatch: dispatchSpy,
        state: {
          doc: {
            toString: () => "古いテキスト",
            length: 5,
          },
        },
      } as unknown as TestableMarkdownEditor["editorView"];

      editor.value = "外部から渡された新しいテキスト";
      editor.updated(new Map([["value", "古いテキスト"]]));

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: {
            from: 0,
            to: 6,
            insert: "外部から渡された新しいテキスト",
          },
        }),
      );
    });
  });

  describe("12. 拡張機能構文テンプレート挿入時の選択文字列保持（SN-002）", () => {
    it("文字列選択時に callout テンプレートを挿入した際、選択文字列を内部に保持して dispatch されること", () => {
      const testable = editor as unknown as TestableMarkdownEditor;
      const dispatchSpy = vi.fn();
      testable.editorView = {
        destroy: vi.fn(),
        dispatch: dispatchSpy,
        focus: vi.fn(),
        state: {
          selection: {
            main: { from: 5, to: 10 },
          },
          sliceDoc: vi.fn((from: number, to: number) => {
            if (from === 5 && to === 10) return "重要テキスト";
            return "";
          }),
        },
      } as unknown as TestableMarkdownEditor["editorView"];

      editor.insertTemplate("/// info\n\n///");

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: {
            from: 5,
            to: 10,
            insert: "/// info\n重要テキスト\n///",
          },
        }),
      );
    });

    it("文字列選択時に color テンプレートを挿入した際、選択文字列をカラー構文でラップして dispatch されること", () => {
      const testable = editor as unknown as TestableMarkdownEditor;
      const dispatchSpy = vi.fn();
      testable.editorView = {
        destroy: vi.fn(),
        dispatch: dispatchSpy,
        focus: vi.fn(),
        state: {
          selection: {
            main: { from: 0, to: 4 },
          },
          sliceDoc: vi.fn(() => "赤色文字"),
        },
      } as unknown as TestableMarkdownEditor["editorView"];

      editor.insertTemplate("/red:テキスト/");

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: {
            from: 0,
            to: 4,
            insert: "/red:赤色文字/",
          },
        }),
      );
    });
  });

  describe("13. 長い半角英数字（URL等）の自然な折り返し制御（SN-006）", () => {
    const scssPath = path.resolve(__dirname, "./markdown-editor.scss");

    it("markdown-editor.scss において .cm-content および .cm-line に対し、word-break: break-all; および overflow-wrap: anywhere; が指定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");

      expect(scss).toMatch(
        /\.cm-content[^{]*\{[^}]*word-break:\s*break-all;[^}]*overflow-wrap:\s*anywhere;/s,
      );
      expect(scss).toMatch(
        /\.cm-line[^{]*\{[^}]*word-break:\s*break-all;[^}]*overflow-wrap:\s*anywhere;/s,
      );
    });
  });

  describe("14. 表示復帰・計測リフレッシュ機能 (refresh) (SN-021)", () => {
    it("14-1. MarkdownEditor に refresh() メソッドが実装されていること", () => {
      const editor = new MarkdownEditor();
      expect(typeof editor.refresh).toBe("function");
    });

    it("14-2. refresh() 呼び出し時に editorView.requestMeasure() が呼び出されること", () => {
      const editor = new MarkdownEditor();
      const mockMeasure = vi.fn();
      editor["editorView"] = {
        state: {
          doc: {
            toString: () => "",
          },
        },
        requestMeasure: mockMeasure,
      } as unknown as EditorView;

      editor.refresh();
      expect(mockMeasure).toHaveBeenCalledOnce();
    });

    it("14-3. refresh() 呼び出し時に this.value と doc に差分がある場合、最新の value で同期更新されること", () => {
      const editor = new MarkdownEditor();
      editor.value = "# 最新テキスト";
      const mockDispatch = vi.fn();
      const mockMeasure = vi.fn();
      editor["editorView"] = {
        state: {
          doc: {
            toString: () => "旧テキスト",
            length: 5,
          },
        },
        dispatch: mockDispatch,
        requestMeasure: mockMeasure,
      } as unknown as EditorView;

      editor.refresh();
      expect(mockDispatch).toHaveBeenCalledWith({
        changes: { from: 0, to: 5, insert: "# 最新テキスト" },
      });
      expect(mockMeasure).toHaveBeenCalledOnce();
    });
  });

  describe("15. フォーカス保護およびカーソル位置保持によるカーソルジャンプ防止（Issue #426）", () => {
    it("15-1. エディタがフォーカス中（hasFocus: true）の場合、親からの遅延した value 変更（updated）による全置換 dispatch がスキップされること", () => {
      const testable = editor as unknown as TestableMarkdownEditor;
      const dispatchSpy = vi.fn();
      testable.editorView = {
        destroy: vi.fn(),
        dispatch: dispatchSpy,
        hasFocus: true,
        state: {
          doc: {
            toString: () => "タグ挿入後の最新テキスト",
            length: 12,
          },
        },
      } as unknown as TestableMarkdownEditor["editorView"];

      // ユーザーがエディタを編集中（フォーカスあり）の状態で、
      // 300ms デバウンスなどで遅れて親から古いテキストが届いた場合
      editor.value = "タグ挿入前の古いテキスト";
      editor.updated(new Map([["value", "古いテキスト"]]));

      // 編集中（フォーカス中）はエディタ内部の最新テキストが優先され、全置換はスキップされるべき
      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it("15-2. 非フォーカス時に外部から value が変更された場合、全置換 dispatch 時に現在のカーソル位置（selection）がクランプ保持されること", () => {
      const testable = editor as unknown as TestableMarkdownEditor;
      const dispatchSpy = vi.fn();
      testable.editorView = {
        destroy: vi.fn(),
        dispatch: dispatchSpy,
        hasFocus: false,
        state: {
          doc: {
            toString: () => "古いテキスト",
            length: 6,
          },
          selection: {
            main: { anchor: 4, head: 4 },
          },
        },
      } as unknown as TestableMarkdownEditor["editorView"];

      editor.value = "新テキスト"; // 長さ 5
      editor.updated(new Map([["value", "古いテキスト"]]));

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      // selection が新テキストの長さに合わせてクランプ保持されていること
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: { from: 0, to: 6, insert: "新テキスト" },
          selection: { anchor: 4, head: 4 },
        }),
      );
    });

    it("15-3. setValue() 実行時には、フォーカス状態に関わらずエディタドキュメントが新しい値へ更新されること", () => {
      const testable = editor as unknown as TestableMarkdownEditor;
      const dispatchSpy = vi.fn();
      testable.editorView = {
        destroy: vi.fn(),
        dispatch: dispatchSpy,
        hasFocus: true,
        state: {
          doc: {
            toString: () => "変更前テキスト",
            length: 7,
          },
        },
      } as unknown as TestableMarkdownEditor["editorView"];

      editor.setValue("明示的に設定された新しいテキスト");

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: {
            from: 0,
            to: 7,
            insert: "明示的に設定された新しいテキスト",
          },
        }),
      );
    });
  });

  describe("16. 外部値同期時（syncExternalValue / setValue / refresh）の変更イベント抑止（Issue #447）", () => {
    it("16-1. syncExternalValue() による全置換 dispatch の際、markdown-change カスタムイベントが発火しないこと", () => {
      const testable = editor as unknown as TestableMarkdownEditor;
      let eventFired = false;
      editor.addEventListener("markdown-change", () => {
        eventFired = true;
      });

      testable.editorView = {
        destroy: vi.fn(),
        dispatch: vi.fn(() => {
          if (!testable.isExternalSync) {
            testable.handleInternalDocChange("新テキスト");
          }
        }),
        hasFocus: false,
        state: {
          doc: {
            toString: () => "古いテキスト",
            length: 6,
          },
          selection: {
            main: { anchor: 0, head: 0 },
          },
        },
      } as unknown as TestableMarkdownEditor["editorView"];

      editor.value = "新テキスト";
      editor.updated(new Map([["value", "古いテキスト"]]));

      expect(eventFired).toBe(false);
      expect(testable.isExternalSync).toBe(false);
    });

    it("16-2. setValue() による全置換 dispatch の際、markdown-change カスタムイベントが発火しないこと", () => {
      const testable = editor as unknown as TestableMarkdownEditor;
      let eventFired = false;
      editor.addEventListener("markdown-change", () => {
        eventFired = true;
      });

      testable.editorView = {
        destroy: vi.fn(),
        dispatch: vi.fn(() => {
          if (!testable.isExternalSync) {
            testable.handleInternalDocChange("新しい設定値");
          }
        }),
        hasFocus: false,
        state: {
          doc: {
            toString: () => "初期値",
            length: 3,
          },
        },
      } as unknown as TestableMarkdownEditor["editorView"];

      editor.setValue("新しい設定値");

      expect(eventFired).toBe(false);
      expect(testable.isExternalSync).toBe(false);
    });

    it("16-3. refresh() による全置換 dispatch の際、markdown-change カスタムイベントが発火しないこと", () => {
      const testable = editor as unknown as TestableMarkdownEditor;
      let eventFired = false;
      editor.addEventListener("markdown-change", () => {
        eventFired = true;
      });

      testable.editorView = {
        destroy: vi.fn(),
        requestMeasure: vi.fn(),
        dispatch: vi.fn(() => {
          if (!testable.isExternalSync) {
            testable.handleInternalDocChange("リフレッシュ値");
          }
        }),
        hasFocus: false,
        state: {
          doc: {
            toString: () => "古い値",
            length: 3,
          },
        },
      } as unknown as TestableMarkdownEditor["editorView"];

      editor.value = "リフレッシュ値";
      editor.refresh();

      expect(eventFired).toBe(false);
      expect(testable.isExternalSync).toBe(false);
    });
  });
});
