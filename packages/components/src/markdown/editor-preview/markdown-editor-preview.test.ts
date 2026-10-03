/**
 * MarkdownEditorPreview コンポーネント単体テスト仕様
 *
 * 1. 初期化とプロパティ
 *   - デフォルトで mode は "split" であり、value が保持されること
 * 2. 表示モードの切り替え
 *   - setMode() により mode が更新され、"mode-change" カスタムイベントが発火すること
 * 3. 入力変更イベントの通知
 *   - handleEditorChange() により value が更新され、"markdown-change" カスタムイベントが発火すること
 * 4. 拡張性・DI 設定の伝播
 *   - processorOptions および customExtensions が保持され、子要素へ伝播可能であること
 * 5. プレビュー値の同期とライフサイクル
 *   - setValue() により value と previewValue が即座に同期されること
 *   - 外部から value が更新された際、updated ライフサイクルで previewValue が同期されること
 *   - setMode("preview") を呼び出した際、debounce 待機中であっても previewValue が現在の value と同期されること
 * 6. 表示モード切り替えアイコンボタンのレンダリング
 *   - スプリット、編集、プレビューの各ボタンに wa-icon が配置され、適切なアイコン名が設定されていること
 *   - スプリット: table-columns-solid-full、編集: markdown-brands-solid-full、プレビュー: html5-brands-solid-full
 *   - 各ボタンにアクセシビリティ用の aria-label および title が設定されていること
 */

import { describe, it, expect, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { MarkdownEditorPreview } from "./markdown-editor-preview.js";
import type { Plugin } from "unified";
import type { Root as MdastRoot } from "mdast";
import { EditorView } from "@codemirror/view";

describe("MarkdownEditorPreview (<markdown-editor-preview>)", () => {
  let element: MarkdownEditorPreview;

  beforeEach(() => {
    element = new MarkdownEditorPreview();
  });

  describe("初期化とプロパティ", () => {
    it("デフォルトで mode は split、value は空文字列であること", () => {
      expect(element.mode).toBe("split");
      expect(element.value).toBe("");
    });

    it("初期 value を設定できること", () => {
      element.value = "# 初期値";
      expect(element.value).toBe("# 初期値");
    });
  });

  describe("表示モードの切り替え", () => {
    it("setMode() により mode が更新され、mode-change イベントが発火すること", () => {
      let firedMode: string | null = null;
      element.addEventListener("mode-change", (e: Event) => {
        const customEvt = e as CustomEvent<{ mode: string }>;
        firedMode = customEvt.detail.mode;
      });

      element.setMode("edit");
      expect(element.mode).toBe("edit");
      expect(firedMode).toBe("edit");

      element.setMode("preview");
      expect(element.mode).toBe("preview");
      expect(firedMode).toBe("preview");
    });
  });

  describe("入力変更イベントの通知", () => {
    it("handleEditorChange() により value が更新され、markdown-change イベントが発火すること", () => {
      let emittedValue: string | null = null;
      element.addEventListener("markdown-change", (e: Event) => {
        const customEvt = e as CustomEvent<{ value: string }>;
        emittedValue = customEvt.detail.value;
      });

      element.handleEditorChange("入力されたテキスト");

      expect(element.value).toBe("入力されたテキスト");
      expect(emittedValue).toBe("入力されたテキスト");
    });
  });

  describe("拡張性・DI 設定の伝播", () => {
    it("processorOptions と customExtensions が保持されること", () => {
      const dummyPlugin: Plugin<[], MdastRoot> = () => () => {};
      const dummyExtension = EditorView.theme({});

      element.processorOptions = { remarkPlugins: [dummyPlugin] };
      element.customExtensions = [dummyExtension];

      expect(element.processorOptions.remarkPlugins).toHaveLength(1);
      expect(element.customExtensions).toHaveLength(1);
    });
  });

  describe("プレビュー値の同期とライフサイクル", () => {
    it("setValue() により value と previewValue が即座に同期されること", () => {
      element.setValue("# 新しいタイトル");
      expect(element.value).toBe("# 新しいタイトル");
      expect(element.previewValue).toBe("# 新しいタイトル");
    });

    it("外部から value が更新された際、updated ライフサイクルで previewValue が同期されること", () => {
      element.value = "## 外部からのテキスト設定";
      element.updated(new Map([["value", ""]]));
      expect(element.previewValue).toBe("## 外部からのテキスト設定");
    });

    it("setMode('preview') を呼び出した際、debounce 待機中であってもプレビュー値が同期されること", () => {
      element.value = "初期値";
      element.setMode("preview");
      expect(element.previewValue).toBe("初期値");
    });
  });

  describe("表示モード切り替えアイコンボタンのレンダリング", () => {
    it("各モードボタンに wa-icon がレンダリングされ、適切なアイコン名と属性が設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());

      // スプリットアイコン
      expect(htmlStr).toContain('name="table-columns-solid-full"');
      expect(htmlStr).toContain('title="スプリット"');

      // 編集（Markdown）アイコン
      expect(htmlStr).toContain('name="markdown-brands-solid-full"');
      expect(htmlStr).toContain('title="編集"');

      // プレビュー（HTML5）アイコン
      expect(htmlStr).toContain('name="html5-brands-solid-full"');
      expect(htmlStr).toContain('title="プレビュー"');
    });
  });
});
