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
 */

import { describe, it, expect, beforeEach } from "vitest";
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
});
