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
 * 7. 拡張機能・プロパティ変更時の再構成制御とエディタ保護
 *   - customExtensions に要素が同一の別配列インスタンスが設定された場合、再構成処理（reconfigureEditor）が呼び出されないこと
 *   - isDarkMode が変化しない themeMode 変更時、再構成処理（reconfigureEditor）が呼び出されないこと
 * 8. 複数回のテーマ切り替え時の整合性保護
 *   - themeMode が dark -> light -> dark と切り替わった際、各変更でホスト属性と再構成が同期して実行されること
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MarkdownEditor } from "./markdown-editor.js";
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

  type TestableMarkdownEditor = Omit<MarkdownEditor, "editorView"> & {
    editorView?: { destroy: () => void; dispatch: () => void };
    reconfigureEditor: () => void;
    classList: DOMTokenList;
  };

  describe("7. 拡張機能・プロパティ変更時の再構成制御とエディタ保護", () => {
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

  describe("8. 複数回のテーマ切り替え時の整合性保護", () => {

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
});
