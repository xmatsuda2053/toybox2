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
 */

import { describe, it, expect, beforeEach } from "vitest";
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
});
