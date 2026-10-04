/**
 * MarkdownEditorPreview コンポーネント単体テスト仕様
 *
 * 1. 初期化とデフォルト表示モードの制御
 *   - 入力内容が空の場合は、"edit"（編集モード）をデフォルトとすること
 *   - 入力内容がある場合は、"preview"（プレビューモード）をデフォルトとすること
 *   - デフォルト表示には "split"（スプリット）を使用しないこと
 *   - 外部から明示的に mode が指定されている場合は指定値が優先されること
 * 2. スプリットモードの利用可否制御 (allowSplit)
 *   - allowSplit のデフォルト値は true であり、スプリットボタンが描画されること
 *   - allowSplit が false の場合、スプリットボタンが非表示となること
 *   - allowSplit が false の場合、setMode("split") を呼び出してもスプリットに遷移しないこと
 * 3. 表示モードの切り替え
 *   - setMode() により mode が更新され、"mode-change" カスタムイベントが発火すること
 * 4. 入力変更イベントの通知
 *   - handleEditorChange() により value が更新され、"markdown-change" カスタムイベントが発火すること
 * 5. 拡張性・DI 設定の伝播
 *   - processorOptions および customExtensions が保持され、子要素へ伝播可能であること
 * 6. プレビュー値の同期とライフサイクル
 *   - setValue() により value と previewValue が即座に同期されること
 *   - 外部から value が更新された際、updated ライフサイクルで previewValue が同期されること
 *   - setMode("preview") を呼び出した際、debounce 待機中であっても previewValue が現在の value と同期されること
 * 7. 表示モード切り替えアイコンボタンのレンダリング
 *   - スプリット、編集、プレビューの各ボタンに wa-icon が配置され、適切なアイコン名が設定されていること
 *   - スプリット: table-columns-solid-full、編集: markdown-brands-solid-full、プレビュー: html5-brands-solid-full
 *   - 各ボタンにアクセシビリティ用の aria-label および title が設定されていること
 * 8. アイコンボタンのスタイルと視認性
 *   - モード切替アイコンボタンの wa-icon のサイズが視認性向上のため 18px 以上に設定されていること
 * 9. 書式ツールバーのレンダリングとアクション
 *   - split モードまたは edit モード時、ヘッダーに書式ツールバー（太字、見出し、リスト、テーブル等）がレンダリングされること
 *   - 各ツールバーボタンに適切な wa-icon が配置されていること
 *   - preview モード時は書式ツールバーが非表示となること
 */

import * as fs from "node:fs";
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

  describe("初期化とデフォルト表示モードの制御", () => {
    it("入力内容が空の場合は edit（編集モード）をデフォルトとすること", () => {
      element.value = "";
      expect(element.mode).toBe("edit");
      expect(element.value).toBe("");
    });

    it("入力内容がある場合は preview（プレビューモード）をデフォルトとすること", () => {
      element.value = "# 初期値テキスト";
      expect(element.mode).toBe("preview");
    });

    it("デフォルト表示に split（スプリット）は使用されないこと", () => {
      expect(element.mode).not.toBe("split");
    });

    it("明示的に mode が指定されている場合は指定値が維持されること", () => {
      element.value = "# テキスト";
      element.mode = "edit";
      expect(element.mode).toBe("edit");
    });
  });

  describe("スプリットモードの利用可否制御 (allowSplit)", () => {
    it("デフォルトで allowSplit は true であり、スプリットボタンが描画されること", () => {
      expect(element.allowSplit).toBe(true);
      const template = element.render();
      const renderedStr = flattenTemplate(template);
      expect(renderedStr).toContain("table-columns-solid-full");
    });

    it("allowSplit が false の場合、スプリットボタンが描画されないこと", () => {
      element.allowSplit = false;
      const template = element.render();
      const renderedStr = flattenTemplate(template);
      expect(renderedStr).not.toContain("table-columns-solid-full");
    });

    it("allowSplit が false の場合、setMode('split') を呼び出してもスプリットに遷移しないこと", () => {
      element.allowSplit = false;
      element.value = "";
      element.setMode("split");
      expect(element.mode).not.toBe("split");
      expect(element.mode).toBe("edit");
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

  describe("アイコンボタンのスタイルと視認性", () => {
    it("モード切替ボタン内の wa-icon のサイズが視認性向上のため 18px 以上に設定されていること", () => {
      const scssPath = new URL("./markdown-editor-preview.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      const match = scssContent.match(
        /\.markdown-editor-preview__mode-btn\s*\{[\s\S]*?wa-icon\s*\{[^}]*font-size:\s*(\d+)px/,
      );
      expect(match).not.toBeNull();
      const fontSize = parseInt(match![1], 10);
      expect(fontSize).toBeGreaterThanOrEqual(18);
    });
  });

  describe("書式ツールバーのレンダリングとアクション", () => {
    it("split モード時に書式ツールバーと主要アイコンがレンダリングされること", () => {
      element.setMode("split");
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain('class="markdown-editor-preview__toolbar"');
      expect(htmlStr).toContain('name="heading-solid-full"');
      expect(htmlStr).toContain('name="bold-solid-full"');
      expect(htmlStr).toContain('name="italic-solid-full"');
      expect(htmlStr).toContain('name="list-ul-solid-full"');
      expect(htmlStr).toContain('name="list-ol-solid-full"');
      expect(htmlStr).toContain('name="list-check-solid-full"');
      expect(htmlStr).toContain('name="blockquote-left"');
      expect(htmlStr).toContain('name="code-solid-full"');
      expect(htmlStr).toContain('name="link-solid-full"');
      expect(htmlStr).toContain('name="table-solid-full"');
    });

    it("preview モード時は書式ツールバーが非表示になること", () => {
      element.setMode("preview");
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).not.toContain('class="markdown-editor-preview__toolbar"');
    });
  });
});
