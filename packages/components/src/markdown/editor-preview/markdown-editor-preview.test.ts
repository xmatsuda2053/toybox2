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
 *   - モード切替アイコンボタンの wa-icon のサイズがコンパクト設計のため 15px 以上に設定されていること
 * 9. 書式ツールバーのレンダリングとアクション
 *   - split モードまたは edit モード時、ヘッダーに書式ツールバー（太字、見出し、リスト、テーブル等）がレンダリングされること
 *   - 各ツールバーボタンに適切な wa-icon が配置されていること
 *   - preview モード時は書式ツールバーが非表示となること
 * 10. 拡張機能パッケージ (Feature Extension) の統合と伝播
 *   - extensions プロパティが保持されること
 *   - extensions 内の processor (remarkPlugins, rehypePlugins, sanitizeSchemaModifier) が適切に合成・伝播されること
 *   - extensions 内の editorExtensions が適切に合成・伝播されること
 * 11. 拡張機能ドロップダウンメニューのレンダリングとアクション
 *   - extensions が登録されている場合、書式ツールバー末尾に単一の拡張機能メニューボタン（ellipsis-solid-full）が描画されること
 *   - extensions が空の場合は拡張機能メニューボタンにレスポンシブ非表示クラス（--responsive）が付与されること
 *   - 初期状態では拡張機能ドロップダウンメニューが非表示であること
 *   - toggleExtensionMenu() により拡張機能ドロップダウンメニューの開閉がトグルされること
 *   - 拡張機能メニュー内に登録された各機能のラベル・アイコン・構文が表示されること
 *   - 拡張機能メニュー項目の選択・実行によりエディタへテンプレートが挿入されメニューが閉じること
 * 12. 構文ヘルプのレンダリングとダイアログ開閉・独自タグ一覧
 *   - ヘッダーのモード切替ボタングループの左隣にヘルプボタン（question-solid-full）が描画されること
 *   - 初期状態では構文ヘルプダイアログが非表示であること
 *   - toggleHelp() により構文ヘルプダイアログの開閉がトグルされること
 *   - 構文ヘルプダイアログ内に登録された独自拡張機能のラベル・構文・説明・使用例がレンダリングされること
 *   - ヘルプ内の挿入ボタン実行によりエディタへテンプレートが挿入されダイアログが閉じること
 * 13. コンテナクエリによる段階的ボタン集約（プログレッシブ・フォールディング）
 *   - ツールバーの二次的アクション（番号付きリスト、引用、コード、リンク、テーブル）に markdown-editor-preview__toolbar-item--secondary クラスが付与されていること
 *   - ドロップダウンメニュー内に追加の書式セクションがレンダリングされること
 *   - メニュー内の書式ボタン実行により、対応する markdown 書式がエディタへ挿入されメニューが閉じること
 *   - SCSS にコンテナクエリ @container が定義され、狭幅時に二次的アクションが非表示となるスタイルが存在すること
 * 14. サブレンダーメソッドと責務分離仕様 (Phase 3: REF-090〜094, REF-115, REF-118, REF-120)
 *   - renderToolbarBasicActions() により見出し・太字・リスト・タスクリスト等の主要書式ボタンが描画されること
 *   - renderToolbarSecondaryActions() により番号付きリスト・引用・コード等のセカンダリ書式ボタンが描画されること
 *   - renderExtensionMenu() によりミートボールメニューおよび拡張・レスポンシブメニューが描画されること
 *   - renderAutoHeightButton() により自動伸長トグルボタンが描画されること
 *   - renderHelpButton() により構文ヘルプボタンが描画されること
 *   - renderModeSwitchTabs() によりモード切替タブグループが描画されること
 *   - renderHelpBasicTable() により基本記法チートシートテーブルが描画されること
 *   - renderHelpExtensionTable() により拡張機能テーブルが描画されること
 *   - commitHeightMode() により高さモードの確定と height-mode-change イベントが単一箇所で発火されること
 * 15. 拡張配列およびプロセッサオプションの参照安定性（メモ化・不要な再描画防止）
 *   - extensions および customExtensions が変更されない限り、effectiveEditorExtensions は同一の配列参照を返すこと
 *   - extensions および processorOptions が変更されない限り、effectiveProcessorOptions は同一のオブジェクト参照を返すこと
 * 16. テーマモード制御（themeMode）と視覚スタイルの保護
 *   - themeMode プロパティが指定された場合、指定されたテーマが優先されること
 *   - SCSS において :host([data-theme="dark"]) の背景色が透明に設定され、角丸の遮蔽を防止すること
 * 17. 高さモード（auto-height）における領域フィットと伸縮保護
 *   - auto-height モード時、内部コンテナおよび body が親要素の flex: 1 / min-height: 100% を尊重し、領域末尾まで伸長可能であること
 * 18. サイズ制御モードのトグルとボタンタイトル・アイコン（固定表示／全表示）
 *   - autoHeight=false の時、トグルボタンの title と aria-label が「全表示」、アイコンが expand-solid-full であること
 *   - autoHeight=true の時、トグルボタンの title と aria-label が「固定表示」、アイコンが compress-solid-full であること
 *   - コンテンツ展開モード時、:host([auto-height]) が height: auto となりコンテンツ高さに追従すること
 * 19. 全表示（コンテンツ展開）モードにおけるヘッダーの sticky スクロール追従仕様
 *   - SCSS においてコンテンツ展開モード時（:host([auto-height]) または .markdown-editor-preview--auto-height）、親コンテナの overflow: visible が指定され、外側スクロールコンテナへの sticky 伝播が有効であること
 *   - SCSS においてコンテンツ展開モード時、.markdown-editor-preview__header に対し position: sticky; top: 0; が指定されていること
 *   - SCSS においてヘッダー上部に角丸（border-top-left-radius / border-top-right-radius）が指定され、視覚的完全性が維持されていること
 * 20. ヘッダーボタンのコンパクト設計およびコンテナクエリ閾値仕様
 *   - SCSS において .markdown-editor-preview__toolbar-btn の min-width / min-height が 24px、アイコンフォントサイズが 15px にコンパクト化されていること
 *   - SCSS において .markdown-editor-preview__mode-btn の min-height が 24px にコンパクト化されていること
 *   - SCSS においてコンテナクエリ閾値が @container editor-preview (max-width: 430px) に最適化されていること
 * 21. ヘッダー右端のエディタ操作メニューおよびドロップダウン仕様
 *   - ヘッダー右端にエディタ操作メニューボタン（.markdown-editor-preview__action-menu-btn）がレンダリングされること
 *   - メニューボタンのアイコンが bars-solid-full であり、title と aria-label が「エディタメニュー」であること
 *   - ヘッダー右側エリアにおいて、「サイズ制御ボタン」→「モード切替タブ」→「メニューボタン」の順に配置されていること
 *   - 初期状態でアクションメニューが閉じていること
 *   - toggleActionMenu() によりアクションメニューの開閉がトグルされること
 *   - アクションメニュー内に「構文ヘルプ」項目（question-solid-full）が含まれ、選択時にヘルプモーダルが開いてメニューが閉じること
 *   - Escape キー押下や外部クリックによりアクションメニューが閉じること
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { MarkdownEditorPreview } from "./markdown-editor-preview.js";
import type { Plugin } from "unified";
import type { Root as MdastRoot } from "mdast";
import { EditorView } from "@codemirror/view";
import { customBadgeExtension } from "../extensions/custom-badge.extension.js";
import type { MarkdownFeatureExtension } from "../types.js";

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
    it("モード切替ボタン内の wa-icon のサイズがコンパクト設計のため 15px 以上に設定されていること", () => {
      const scssPath = new URL("./markdown-editor-preview.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      const match = scssContent.match(
        /\.markdown-editor-preview__mode-btn\s*\{[\s\S]*?wa-icon\s*\{[^}]*font-size:\s*(\d+)px/,
      );
      expect(match).not.toBeNull();
      const fontSize = parseInt(match![1], 10);
      expect(fontSize).toBeGreaterThanOrEqual(15);
    });
  });

  describe("書式ツールバーのレンダリングとアクション", () => {
    it("split モード時に書式ツールバーと主要アイコンがレンダリングされること（斜体およびタイトルは描画されないこと）", () => {
      element.setMode("split");
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain('class="markdown-editor-preview__toolbar"');
      expect(htmlStr).toContain('name="heading-solid-full"');
      expect(htmlStr).toContain('name="bold-solid-full"');
      expect(htmlStr).not.toContain('name="italic-solid-full"');
      expect(htmlStr).not.toContain('class="markdown-editor-preview__title"');
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

  describe("拡張機能パッケージ (Feature Extension) の統合と伝播", () => {
    it("extensions プロパティが保持されること", () => {
      element.extensions = [customBadgeExtension];
      expect(element.extensions).toHaveLength(1);
      expect(element.extensions[0].id).toBe("custom-badge");
    });

    it("extensions 内の processor 設定がプレビュー用プロセッサオプションへ適切に合成・伝播されること", () => {
      element.extensions = [customBadgeExtension];
      const effectiveOptions = element.effectiveProcessorOptions;
      expect(effectiveOptions.remarkPlugins).toBeDefined();
      expect(effectiveOptions.remarkPlugins).toHaveLength(1);
      expect(effectiveOptions.sanitizeSchemaModifier).toBeDefined();
    });

    it("extensions 内の editorExtensions がエディタ用拡張機能へ適切に合成・伝播されること", () => {
      const dummyExt = EditorView.theme({});
      const testExtension: MarkdownFeatureExtension = {
        id: "test-editor-ext",
        label: "テスト拡張",
        template: ":test:",
        editorExtensions: [dummyExt],
      };
      element.extensions = [testExtension];
      const effectiveExtensions = element.effectiveEditorExtensions;
      expect(effectiveExtensions).toContain(dummyExt);
    });
  });

  describe("拡張機能ドロップダウンメニューのレンダリングとアクション", () => {
    it("extensions が登録されている場合、書式ツールバー末尾に単一の拡張機能メニューボタン（ellipsis-solid-full）が描画されること", () => {
      element.setMode("edit");
      element.extensions = [customBadgeExtension];
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain('name="ellipsis-solid-full"');
      expect(htmlStr).toContain('title="拡張機能"');
    });

    it("extensions が空の場合は、拡張機能メニューボタンにレスポンシブ非表示クラス（--responsive）が付与されること", () => {
      element.setMode("edit");
      element.extensions = [];
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain(
        "markdown-editor-preview__extension-menu-container--responsive",
      );
    });

    it("初期状態では拡張機能ドロップダウンメニューが非表示であること", () => {
      expect(element.isExtensionMenuOpen).toBe(false);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("markdown-editor-preview__extension-menu--open");
    });

    it("toggleExtensionMenu() により拡張機能ドロップダウンメニューの開閉がトグルされること", () => {
      element.setMode("edit");
      element.extensions = [customBadgeExtension];

      element.toggleExtensionMenu(true);
      expect(element.isExtensionMenuOpen).toBe(true);
      let htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("markdown-editor-preview__extension-menu--open");

      element.toggleExtensionMenu(false);
      expect(element.isExtensionMenuOpen).toBe(false);
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("markdown-editor-preview__extension-menu--open");
    });

    it("拡張機能メニュー内に登録された各機能のラベル・アイコン・構文が表示されること", () => {
      element.setMode("edit");
      element.extensions = [customBadgeExtension];
      element.toggleExtensionMenu(true);
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("ステータスバッジ");
      expect(htmlStr).toContain("tag-solid-full");
      expect(htmlStr).toContain(":badge[ラベル]:");
    });

    it("拡張機能メニュー項目の選択・実行によりエディタへテンプレートが挿入されメニューが閉じること", () => {
      element.setMode("edit");
      element.value = "既存テキスト";
      element.extensions = [customBadgeExtension];
      element.toggleExtensionMenu(true);

      element.selectExtensionMenuItem(customBadgeExtension);

      expect(element.value).toContain(":badge[");
      expect(element.isExtensionMenuOpen).toBe(false);
    });
  });

  describe("構文ヘルプのレンダリングとダイアログ開閉・独自タグ一覧", () => {
    it("エディタ操作メニュー内に構文ヘルプ項目が描画されること", () => {
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain('name="question-solid-full"');
      expect(htmlStr).toContain("構文ヘルプ");
    });

    it("初期状態では構文ヘルプダイアログが非表示であること", () => {
      expect(element.isHelpOpen).toBe(false);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("markdown-editor-preview__help-modal--open");
    });

    it("toggleHelp() により構文ヘルプダイアログの開閉がトグルされること", () => {
      element.toggleHelp(true);
      expect(element.isHelpOpen).toBe(true);

      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("markdown-editor-preview__help-modal--open");

      element.toggleHelp(false);
      expect(element.isHelpOpen).toBe(false);
    });

    it("構文ヘルプダイアログ内に登録された独自拡張機能のラベル・構文・説明・使用例がレンダリングされること", () => {
      element.extensions = [customBadgeExtension];
      element.toggleHelp(true);
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("ステータスバッジ");
      expect(htmlStr).toContain(":badge[ラベル]:");
      expect(htmlStr).toContain("重要度や状態を表すカラーバッジを表示します");
      expect(htmlStr).toContain(":badge[優先度:高]:");
    });

    it("ヘルプ内の挿入ボタン実行によりエディタへテンプレートが挿入されダイアログが閉じること", () => {
      element.extensions = [customBadgeExtension];
      element.toggleHelp(true);

      element.insertExtensionTemplate(customBadgeExtension);

      expect(element.value).toContain(":badge[");
      expect(element.isHelpOpen).toBe(false);
    });
  });

  describe("コンテナクエリによる段階的ボタン集約（プログレッシブ・フォールディング）", () => {
    it("ツールバーの二次的アクションに markdown-editor-preview__toolbar-item--secondary クラスが付与されていること", () => {
      element.setMode("edit");
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("markdown-editor-preview__toolbar-item--secondary");
    });

    it("ドロップダウンメニュー内に追加の書式セクションがレンダリングされること", () => {
      element.setMode("edit");
      element.toggleExtensionMenu(true);
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("追加の書式");
      expect(htmlStr).toContain("番号付きリスト");
      expect(htmlStr).toContain("引用");
      expect(htmlStr).toContain("コード");
      expect(htmlStr).toContain("リンク");
      expect(htmlStr).toContain("テーブル");
    });

    it("メニュー内の書式ボタン実行により、対応する markdown 書式がエディタへ挿入されメニューが閉じること", () => {
      element.setMode("edit");
      element.value = "テスト行";
      element.toggleExtensionMenu(true);

      element.handleMenuToolbarAction("code");

      expect(element.value).toContain("`");
      expect(element.isExtensionMenuOpen).toBe(false);
    });

    it("SCSS にコンテナクエリ @container が定義され、狭幅時に二次的アクションが非表示となるスタイルが存在すること", () => {
      const scssPath = new URL("./markdown-editor-preview.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      expect(scssContent).toContain("@container");
      expect(scssContent).toContain(".markdown-editor-preview__toolbar-item--secondary");
    });
  });

  describe("ドロップダウンメニューの表示保証および独自拡張機能レンダリング仕様", () => {
    it("extensions が設定されている場合、メニュー展開時に「独自記法・拡張機能」ヘッダーとアイテムがレンダリングされること", () => {
      element.setMode("edit");
      element.extensions = [customBadgeExtension];
      element.toggleExtensionMenu(true);
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("独自記法・拡張機能");
      expect(htmlStr).toContain("ステータスバッジ");
      expect(htmlStr).toContain(":badge[");
    });

    it("SCSS で header-left に overflow-x: auto が設定されておらず、ヘッダー外へのドロップダウン展開が阻害されないこと", () => {
      const scssPath = new URL("./markdown-editor-preview.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      // .markdown-editor-preview__header-left のブロック内に overflow-x: auto が含まれていないこと
      const headerLeftBlock = scssContent.match(/\.markdown-editor-preview__header-left\s*\{[^}]*\}/s)?.[0] || "";
      expect(headerLeftBlock).not.toContain("overflow-x: auto");
      expect(headerLeftBlock).not.toContain("overflow: auto");
      expect(headerLeftBlock).not.toContain("overflow: hidden");
    });

    it("SCSS で header に position: relative と z-index が設定され、エディタペインより前面にドロップダウンが描画されること", () => {
      const scssPath = new URL("./markdown-editor-preview.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      const headerBlock = scssContent.match(/\.markdown-editor-preview__header\s*\{[^}]*\}/s)?.[0] || "";
      expect(headerBlock).toContain("position: relative");
      expect(headerBlock).toContain("z-index");
    });

    it("SCSS で extension-menu が left: 0 で前面展開され、左側のはみ出しクリップを防止すること", () => {
      const scssPath = new URL("./markdown-editor-preview.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      const menuBlock = scssContent.match(/\.markdown-editor-preview__extension-menu\s*\{[^}]*\}/s)?.[0] || "";
      expect(menuBlock).toContain("left: 0");
      expect(menuBlock).toContain("z-index: 1000");
    });

    it("SCSS で追加の書式セクションが通常幅時は非表示となり、狭幅コンテナクエリ内で表示されること", () => {
      const scssPath = new URL("./markdown-editor-preview.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      expect(scssContent).toContain(".markdown-editor-preview__menu-section--secondary");
      // 通常時は非表示
      expect(scssContent).toMatch(/\.markdown-editor-preview__menu-section--secondary\s*\{[^}]*display:\s*none/s);
      // コンテナクエリ内で表示
      expect(scssContent).toMatch(/@container[^{]*\{[\s\S]*?\.markdown-editor-preview__menu-section--secondary\s*\{[^}]*display:\s*(block|flex)/);
    });
  });

  describe("コンテンツ連動型自動伸長（Auto-grow）モードおよび高さモード切替仕様", () => {
    it("autoHeight プロパティがデフォルトで false であること", () => {
      expect((element as any).autoHeight).toBe(false);
    });

    it("autoHeight が true の場合、コンポーネントルートに markdown-editor-preview--auto-height クラスが付与されること", () => {
      (element as any).autoHeight = true;
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("markdown-editor-preview--auto-height");
    });

    it("allowAutoHeight が true の場合、ヘッダーに高さモード切替ボタンがレンダリングされること", () => {
      (element as any).allowAutoHeight = true;
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("markdown-editor-preview__auto-height-btn");
      expect(htmlStr).toContain("expand-solid-full");
    });

    it("allowAutoHeight が false の場合、ヘッダーに高さモード切替ボタンがレンダリングされないこと", () => {
      (element as any).allowAutoHeight = false;
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).not.toContain("markdown-editor-preview__auto-height-btn");
    });

    it("toggleAutoHeight() を実行すると autoHeight がトグルされ、height-mode-change イベントが発行されること", () => {
      let emittedDetail: { autoHeight: boolean } | null = null;
      element.addEventListener("height-mode-change", (e: Event) => {
        emittedDetail = (e as CustomEvent<{ autoHeight: boolean }>).detail;
      });

      (element as any).toggleAutoHeight();
      expect((element as any).autoHeight).toBe(true);
      expect(emittedDetail).toEqual({ autoHeight: true });

      (element as any).toggleAutoHeight();
      expect((element as any).autoHeight).toBe(false);
      expect(emittedDetail).toEqual({ autoHeight: false });
    });

    it("SCSS にて auto-height 有効時に height: auto かつ内部スクロール抑止（overflow: visible）となるスタイルが定義されていること", () => {
      const scssPath = new URL("./markdown-editor-preview.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      expect(scssContent).toContain(".markdown-editor-preview--auto-height");
      expect(scssContent).toMatch(/\.markdown-editor-preview--auto-height[\s\S]*?height:\s*auto/);
    });
  });

  describe("固定高さ（height）プロパティ仕様", () => {
    it("height プロパティが未指定の場合、デフォルトで undefined であり、render() に固定高さスタイルが含まれないこと", () => {
      expect((element as any).height).toBeUndefined();
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("height:");
    });

    it("height=\"400px\" が設定された場合、render() のルート要素に height: 400px スタイルが適用されること", () => {
      (element as any).height = "400px";
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("height: 400px");
      expect((element as any).effectiveHeight).toBe("400px");
    });

    it("height=500 または \"500\" のように数値/単位なし文字列が設定された場合、\"500px\" に正規化されてスタイルが適用されること", () => {
      (element as any).height = 500;
      let htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("height: 500px");
      expect((element as any).effectiveHeight).toBe("500px");

      (element as any).height = "600";
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("height: 600px");
      expect((element as any).effectiveHeight).toBe("600px");
    });

    it("autoHeight=true の場合、height が設定されていても固定高さスタイルがクリアされ自動伸長が優先されること", () => {
      (element as any).height = "400px";
      (element as any).autoHeight = true;
      let htmlStr = flattenTemplate(element.render());

      expect(htmlStr).not.toContain("height: 400px");
      expect((element as any).effectiveHeight).toBeUndefined();

      // autoHeight を false に戻すと元の固定サイズに復帰すること
      (element as any).autoHeight = false;
      htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("height: 400px");
      expect((element as any).effectiveHeight).toBe("400px");
    });
  });

  describe("サイズモード切替アニメーション（Smooth Transition）仕様", () => {
    it("SCSS にて高さトランジション（transition: height）およびアニメーション中スタイル（.markdown-editor-preview--animating）が定義されていること", () => {
      const scssPath = new URL("./markdown-editor-preview.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      expect(scssContent).toContain("markdown-editor-preview--animating");
      expect(scssContent).toMatch(/transition:[\s\S]*?height/);
    });

    it("prefers-reduced-motion メディアクエリにおいてトランジションが無効化されること", () => {
      const scssPath = new URL("./markdown-editor-preview.scss", import.meta.url);
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      expect(scssContent).toContain("prefers-reduced-motion: reduce");
      expect(scssContent).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?transition:\s*none/);
    });

    it("isTransitioning 状態が管理され、アニメーション中は .markdown-editor-preview--animating クラスがレンダリングされること", () => {
      expect((element as any).isTransitioning).toBe(false);
      let htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("markdown-editor-preview--animating");

      (element as any).isTransitioning = true;
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("markdown-editor-preview--animating");
    });
  });

  describe("サブレンダーメソッドと責務分離仕様 (Phase 3: REF-090〜094, REF-115, REF-118, REF-120)", () => {
    it("renderToolbarBasicActions() により主要書式ボタン（見出し・太字・リスト・タスク）が描画されること", () => {
      const result = (element as any).renderToolbarBasicActions();
      const htmlStr = flattenTemplate(result);
      expect(htmlStr).toContain('title="見出し"');
      expect(htmlStr).toContain('title="太字"');
      expect(htmlStr).toContain('title="箇条書きリスト"');
      expect(htmlStr).toContain('title="タスクリスト"');
    });

    it("renderToolbarSecondaryActions() によりセカンダリ書式ボタン（番号リスト・引用・コード・リンク・テーブル）が描画されること", () => {
      const result = (element as any).renderToolbarSecondaryActions();
      const htmlStr = flattenTemplate(result);
      expect(htmlStr).toContain('title="番号付きリスト"');
      expect(htmlStr).toContain('title="引用"');
      expect(htmlStr).toContain('title="コード"');
      expect(htmlStr).toContain('title="リンク"');
      expect(htmlStr).toContain('title="テーブル"');
    });

    it("renderExtensionMenu() によりミートボールボタンおよび拡張ドロップダウンが描画されること", () => {
      const result = (element as any).renderExtensionMenu();
      const htmlStr = flattenTemplate(result);
      expect(htmlStr).toContain("markdown-editor-preview__toolbar-btn--extension-menu");
      expect(htmlStr).toContain("markdown-editor-preview__extension-menu");
    });

    it("renderAutoHeightButton() により自動伸長トグルボタンが描画されること", () => {
      element.allowAutoHeight = true;
      const result = (element as any).renderAutoHeightButton();
      const htmlStr = flattenTemplate(result);
      expect(htmlStr).toContain("markdown-editor-preview__auto-height-btn");
    });

    it("renderActionMenu() によりエディタ操作メニューが描画され、構文ヘルプ項目が含まれること", () => {
      const result = (element as any).renderActionMenu();
      const htmlStr = flattenTemplate(result);
      expect(htmlStr).toContain("markdown-editor-preview__action-menu-btn");
      expect(htmlStr).toContain("bars-solid-full");
      expect(htmlStr).toContain("構文ヘルプ");
    });

    it("renderModeSwitchTabs() によりモード切替タブグループが描画されること", () => {
      const result = (element as any).renderModeSwitchTabs();
      const htmlStr = flattenTemplate(result);
      expect(htmlStr).toContain("markdown-editor-preview__mode-group");
      expect(htmlStr).toContain('title="編集"');
      expect(htmlStr).toContain('title="プレビュー"');
    });

    it("renderHelpBasicTable() により基本記法チートシートテーブルが描画されること", () => {
      const result = (element as any).renderHelpBasicTable();
      const htmlStr = flattenTemplate(result);
      expect(htmlStr).toContain("基本 Markdown 記法");
      expect(htmlStr).toContain("### 見出し3");
    });

    it("renderHelpExtensionTable() により拡張機能テーブルが描画されること", () => {
      element.extensions = [customBadgeExtension];
      const result = (element as any).renderHelpExtensionTable();
      const htmlStr = flattenTemplate(result);
      expect(htmlStr).toContain("拡張機能・独自タグ");
      expect(htmlStr).toContain(customBadgeExtension.label);
    });

    it("commitHeightMode() により高さモードが確定され、isTransitioning がリセットされ、イベントが発火すること", () => {
      let eventDetail: any = null;
      element.addEventListener("height-mode-change", (e: any) => {
        eventDetail = e.detail;
      });

      (element as any).isTransitioning = true;
      (element as any).commitHeightMode(true);

      expect(element.autoHeight).toBe(true);
      expect((element as any).isTransitioning).toBe(false);
      expect(eventDetail).toEqual({ autoHeight: true });
    });
  });

  describe("15. 拡張配列およびプロセッサオプションの参照安定性（メモ化・不要な再描画防止）", () => {
    it("extensions および customExtensions が変更されない限り、effectiveEditorExtensions は同一の配列参照を返すこと", () => {
      const first = element.effectiveEditorExtensions;
      const second = element.effectiveEditorExtensions;
      expect(first).toBe(second);
    });

    it("extensions および processorOptions が変更されない限り、effectiveProcessorOptions は同一のオブジェクト参照を返すこと", () => {
      const first = element.effectiveProcessorOptions;
      const second = element.effectiveProcessorOptions;
      expect(first).toBe(second);
    });
  });

  describe("16. テーマモード制御（themeMode）と視覚スタイルの保護", () => {
    const scssPath = path.resolve(__dirname, "markdown-editor-preview.scss");
    const scssContent = fs.readFileSync(scssPath, "utf-8");

    it("themeMode='dark' が指定された場合、currentTheme が 'dark' となりホスト属性が更新されること", () => {
      element.themeMode = "dark";
      element.requestUpdate();
      element.syncTheme();
      expect(element.currentTheme).toBe("dark");
      expect(element.getAttribute("data-theme")).toBe("dark");
    });

    it("themeMode='light' が指定された場合、currentTheme が 'light' となりホスト属性が更新されること", () => {
      element.themeMode = "light";
      element.requestUpdate();
      element.syncTheme();
      expect(element.currentTheme).toBe("light");
      expect(element.getAttribute("data-theme")).toBe("light");
    });

    it("SCSS において :host([data-theme='dark']) に不透明な黒背景色が設定されず、transparent であること", () => {
      const darkHostMatch = scssContent.match(/:host\(\[data-theme="dark"\]\)[^{]*\{([^}]+)\}/);
      if (darkHostMatch) {
        expect(darkHostMatch[1]).not.toMatch(/background-color:\s*#[0-9a-fA-F]+/);
      }
      expect(scssContent).toMatch(/:host\s*\{[^}]*background-color:\s*transparent/);
    });
  });

  describe("17. デフォルト表示（親要素フィットモード）における領域フィット", () => {
    const scssPath = path.resolve(__dirname, "markdown-editor-preview.scss");
    const scssContent = fs.readFileSync(scssPath, "utf-8");

    it(":host が display: flex を持ち、親要素からのフレックス伸長を受け入れられること", () => {
      expect(scssContent).toMatch(/:host\s*\{[^}]*display:\s*flex;/);
      expect(scssContent).toMatch(/:host\s*\{[^}]*flex-direction:\s*column;/);
    });

    it("デフォルト表示時、:host、内部コンテナおよび body が flex: 1 を保持し領域末尾まで伸長すること", () => {
      expect(scssContent).toMatch(/:host\s*\{[^}]*flex:\s*1;/);
      expect(scssContent).toMatch(
        /\.markdown-editor-preview__body\s*\{[^}]*flex:\s*1;/,
      );
      expect(scssContent).toMatch(
        /\.markdown-editor-preview__pane\s*\{[^}]*flex:\s*1;/,
      );
    });
  });

  describe("18. サイズ制御モードのトグルとボタンタイトル・アイコン（固定表示／全表示）", () => {
    it("autoHeight=false（親要素フィットモード）の時、トグルボタンの title と aria-label が「全表示」、アイコンが expand-solid-full であること", () => {
      element.autoHeight = false;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/title=["']全表示["']/);
      expect(htmlStr).toMatch(/aria-label=["']全表示["']/);
      expect(htmlStr).toContain("expand-solid-full");
    });

    it("autoHeight=true（コンテンツ展開モード）の時、トグルボタンの title と aria-label が「固定表示」、アイコンが compress-solid-full であること", () => {
      element.autoHeight = true;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/title=["']固定表示["']/);
      expect(htmlStr).toMatch(/aria-label=["']固定表示["']/);
      expect(htmlStr).toContain("compress-solid-full");
    });

    it("コンテンツ展開モード時（方針A）、:host([auto-height]) が height: auto かつ flex: none となりコンテンツ高さに追従すること", () => {
      const scssPath = path.resolve(__dirname, "markdown-editor-preview.scss");
      const scssContent = fs.readFileSync(scssPath, "utf-8");
      expect(scssContent).toMatch(/:host\(\[auto-height\]\)[^{]*\{[^}]*height:\s*auto;/);
      expect(scssContent).toMatch(/:host\(\[auto-height\]\)[^{]*\{[^}]*flex:\s*none;/);
    });
  });

  describe("19. 全表示（コンテンツ展開）モードにおけるヘッダーの sticky スクロール追従仕様", () => {
    const scssPath = path.resolve(__dirname, "markdown-editor-preview.scss");
    const scssContent = fs.readFileSync(scssPath, "utf-8");

    it("コンテンツ展開モード時、親コンテナに overflow: visible が指定され外側スクロールコンテナへの sticky 伝播が有効であること", () => {
      expect(scssContent).toMatch(
        /:host\(\[auto-height\]\)[\s\S]*?overflow:\s*visible;|\.markdown-editor-preview--auto-height[\s\S]*?overflow:\s*visible;/,
      );
    });

    it("コンテンツ展開モード時、.markdown-editor-preview__header に対し position: sticky; top: 0; が指定されていること", () => {
      expect(scssContent).toMatch(
        /position:\s*sticky;[\s\S]*?top:\s*0;/,
      );
    });

    it("ヘッダー上部に角丸（border-top-left-radius / border-top-right-radius）が指定され、視覚的完全性が維持されていること", () => {
      expect(scssContent).toMatch(/border-top-left-radius:\s*\d+px;/);
      expect(scssContent).toMatch(/border-top-right-radius:\s*\d+px;/);
    });
  });

  describe("20. ヘッダーボタンのコンパクト設計およびコンテナクエリ閾値仕様", () => {
    const scssPath = path.resolve(__dirname, "markdown-editor-preview.scss");
    const scssContent = fs.readFileSync(scssPath, "utf-8");

    it("ツールバーボタンの最小幅・高さが 24px、アイコンが 15px にコンパクト化されていること", () => {
      expect(scssContent).toMatch(
        /\.markdown-editor-preview__toolbar-btn\s*\{[^}]*min-width:\s*24px;/,
      );
      expect(scssContent).toMatch(
        /\.markdown-editor-preview__toolbar-btn\s*\{[^}]*min-height:\s*24px;/,
      );
      expect(scssContent).toMatch(
        /\.markdown-editor-preview__toolbar-btn[\s\S]*?wa-icon\s*\{[^}]*font-size:\s*15px;/,
      );
    });

    it("モード切替ボタンの最小高さが 24px、最小幅が 26px にコンパクト化されていること", () => {
      expect(scssContent).toMatch(
        /\.markdown-editor-preview__mode-btn\s*\{[^}]*min-width:\s*26px;/,
      );
      expect(scssContent).toMatch(
        /\.markdown-editor-preview__mode-btn\s*\{[^}]*min-height:\s*24px;/,
      );
    });

    it("コンテナクエリの閾値が 430px に最適化されていること", () => {
      expect(scssContent).toMatch(/@container\s+editor-preview\s*\(\s*max-width:\s*430px\s*\)/);
    });
  });

  describe("21. ヘッダー右端のエディタ操作メニューおよびドロップダウン仕様", () => {
    it("ヘッダー右側エリアにおいて、「サイズ制御ボタン」→「モード切替タブ」→「メニューボタン」の順に配置されていること", () => {
      element.allowAutoHeight = true;
      const htmlStr = flattenTemplate(element.render());
      const autoHeightIdx = htmlStr.indexOf("markdown-editor-preview__auto-height-btn");
      const modeGroupIdx = htmlStr.indexOf("markdown-editor-preview__mode-group");
      const actionMenuIdx = htmlStr.indexOf("markdown-editor-preview__action-menu-btn");

      expect(autoHeightIdx).toBeGreaterThan(-1);
      expect(modeGroupIdx).toBeGreaterThan(-1);
      expect(actionMenuIdx).toBeGreaterThan(-1);
      expect(autoHeightIdx).toBeLessThan(modeGroupIdx);
      expect(modeGroupIdx).toBeLessThan(actionMenuIdx);
    });

    it("メニューボタンのアイコンが bars-solid-full であり、title と aria-label が設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("markdown-editor-preview__action-menu-btn");
      expect(htmlStr).toContain("bars-solid-full");
      expect(htmlStr).toMatch(/title=["']エディタメニュー["']/);
      expect(htmlStr).toMatch(/aria-label=["']エディタメニュー["']/);
    });

    it("初期状態で isActionMenuOpen が false であり、ドロップダウンが開いていないこと", () => {
      expect((element as any).isActionMenuOpen).toBe(false);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("markdown-editor-preview__action-menu--open");
    });

    it("toggleActionMenu() により isActionMenuOpen がトグルされること", () => {
      (element as any).toggleActionMenu(true);
      expect((element as any).isActionMenuOpen).toBe(true);
      let htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("markdown-editor-preview__action-menu--open");

      (element as any).toggleActionMenu(false);
      expect((element as any).isActionMenuOpen).toBe(false);
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("markdown-editor-preview__action-menu--open");
    });

    it("メニュー内の構文ヘルプ項目をクリックすると、toggleHelp(true) が呼び出されメニューが閉じること", () => {
      (element as any).toggleActionMenu(true);
      let helpOpened = false;
      element.toggleHelp = (open?: boolean) => {
        helpOpened = open ?? true;
      };

      (element as any).handleMenuHelpAction();
      expect(helpOpened).toBe(true);
      expect((element as any).isActionMenuOpen).toBe(false);
    });

    it("Escape キー押下により開いているアクションメニューが閉じること", () => {
      (element as any).toggleActionMenu(true);
      expect((element as any).isActionMenuOpen).toBe(true);

      (element as any).handleGlobalKeydown({ key: "Escape" } as any);

      expect((element as any).isActionMenuOpen).toBe(false);
    });
  });
});


