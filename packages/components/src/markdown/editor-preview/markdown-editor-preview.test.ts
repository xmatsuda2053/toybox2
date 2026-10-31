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
 *   - 未指定時の初期値として標準拡張機能（DEFAULT_MARKDOWN_EXTENSIONS: custom-badge, color, callout）が登録されていること
 *   - extensions プロパティが保持されること
 *   - extensions 内の processor (remarkPlugins, rehypePlugins, sanitizeSchemaModifier) が適切に合成・伝播されること
 *   - extensions 内の editorExtensions が適切に合成・伝播されること
 * 11. 拡張機能ドロップダウンメニューのレンダリングとアクション (wa-dropdown 統一およびサブメニュー仕様)
 *   - extensions が登録されている場合、書式ツールバー末尾に単一の拡張機能メニューボタン（ellipsis-solid-full）が描画されること
 *   - 拡張機能メニューが wa-dropdown（placement='bottom-start'）としてレンダリングされること
 *   - extensions が空の場合は拡張機能メニューボタンにレスポンシブ非表示クラス（--responsive）が付与されること
 *   - 初期状態では拡張機能ドロップダウンメニューが非表示であること
 *   - toggleExtensionMenu() により拡張機能ドロップダウンメニューの開閉がトグルされること
 *   - 拡張機能メニュー内に登録された各機能のラベル・アイコン・構文が表示されること
 *   - subItems を持つ拡張機能の場合、親項目内に slot='submenu' を持った子 wa-dropdown-item がレンダリングされること
 *   - 拡張メニュー内のセクションラベルが wa-dropdown 仕様に準拠し h3 見出しタグとしてレンダリングされること
 *   - wa-select イベント（または handleExtensionMenuSelect）により各アクション・サブアイテムテンプレートがエディタへ挿入されること
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
 *   - renderHelpButton() により構文ヘルプボタンが描画されること
 *   - renderModeSwitchTabs() によりモード切替タブグループが描画されること
 *   - renderHelpBasicTable() により基本記法チートシートテーブルが描画されること
 *   - renderHelpExtensionTable() により拡張機能テーブルが描画されること
 * 15. 拡張配列およびプロセッサオプションの参照安定性（メモ化・不要な再描画防止）
 *   - extensions および customExtensions が変更されない限り、effectiveEditorExtensions は同一の配列参照を返すこと
 *   - extensions および processorOptions が変更されない限り、effectiveProcessorOptions は同一のオブジェクト参照を返すこと
 * 16. テーマモード制御（themeMode）と視覚スタイルの保護
 *   - themeMode プロパティが指定された場合、指定されたテーマが優先されること
 *   - SCSS において :host([data-theme="dark"]) の背景色が透明に設定され、角丸の遮蔽を防止すること
 * 17. 固定フィット表示における領域フィットと伸縮保護
 *   - :host、内部コンテナおよび body が親要素の flex: 1 / min-height: 100% を尊重し、領域末尾まで伸長可能であること
 * 18. 全表示（autoHeight）モードの完全廃止と常時固定フィット表示
 *   - autoHeight / allowAutoHeight プロパティが定義されていない（undefined）こと
 *   - ヘッダー内に全表示トグルボタン（markdown-editor-preview__auto-height-btn）が描画されないこと
 *   - ルート要素に markdown-editor-preview--auto-height クラスが付与されないこと
 * 19. SCSSにおける全表示モードおよび sticky ヘッダースタイルの完全排除
 *   - SCSS において .markdown-editor-preview--auto-height や :host([auto-height]) が存在しないこと
 *   - SCSS において .markdown-editor-preview__auto-height-btn が存在しないこと
 *   - SCSS において .markdown-editor-preview--animating が存在しないこと
 * 20. ヘッダーボタンのコンパクト設計およびコンテナクエリ閾値仕様
 *   - SCSS において .markdown-editor-preview__toolbar-btn の min-width / min-height が 24px、アイコンフォントサイズが 15px にコンパクト化されていること
 *   - SCSS において .markdown-editor-preview__mode-btn の min-height が 24px にコンパクト化されていること
 *   - SCSS においてコンテナクエリ閾値が @container editor-preview (max-width: 430px) に最適化されていること
 * 21. ヘッダー右側の整形ボタン・モード切替タブ・エディタ操作メニュー（wa-dropdown）仕様
 *   - 編集モード（edit）およびスプリットモード（split）時、ヘッダー右側エリアに「整形ボタン」→「モード切替タブ」→「メニューボタン（wa-dropdown）」の順に配置されていること
 *   - プレビューモード（preview）時、ヘッダー右側エリアに「整形ボタン」が表示されないこと
 *   - 整形ボタンをクリック（または handleFormatAction 実行）した際、フォーマッターが実行されて value が更新されること
 *   - エディタ操作メニューが wa-dropdown（placement='bottom-end'）としてレンダリングされること
 *   - メニューボタンが slot='trigger' として配置され、アイコンが bars-solid-full であり、title と aria-label が「エディタメニュー」であること
 *   - wa-dropdown 内に「コピー（value='copy'）」「構文ヘルプ（value='help'）」の各 wa-dropdown-item が含まれ、「整形（value='format'）」は含まれないこと
 *   - メニュー内の「コピー」実行時、value がクリップボードにコピーされ markdown-copy イベントが発火すること
 *   - メニュー内の「構文ヘルプ」実行時、toggleHelp(true) が呼び出されること
 * 22. テーマスタイルバリアント制御（darkTheme / lightTheme）と soft ダークスタイル
 *   - darkTheme の初期値が 'contrast'、lightTheme の初期値が 'default' であること
 *   - darkTheme='soft' が指定された場合、ホスト要素に dark-theme='soft' 属性が設定されること
 *   - lightTheme='default' が指定された場合、ホスト要素に light-theme='default' 属性が設定されること
 *   - renderBody() において子要素（markdown-editor, markdown-preview）へ darkTheme と lightTheme がバインドされること
 *   - SCSS において :host([dark-theme='soft']) 用のスタイルが定義され、StepNote 調のソフトダーク配色が指定されていること
 * 23. エディタ操作メニューの削除ボタン仕様
 *   - showDeleteButton の初期値が false であること
 *   - showDeleteButton が false の場合、削除項目および wa-divider がレンダリングされないこと
 *   - showDeleteButton が true の場合、構文ヘルプの後に wa-divider と削除項目（variant="danger", value="delete", trash-solid-full, "削除"）がレンダリングされること
 *   - handleActionMenuSelect() において value='delete' で markdown-delete イベント（detail: { value: string }）が発火すること
 * 24. エディタ操作メニューのコマンド0〜9サブメニュー仕様
 *   - commands の初期値が空配列であること
 *   - commands が未指定（空配列）の場合、親項目「コマンド」およびそのサブメニューがレンダリングされないこと
 *   - commands が設定された場合、親項目「コマンド」（アイコン: terminal-solid-full）とサブメニュー項目がレンダリングされ、アイコン number-0〜9 が設定されること
 *   - commands に 10 件を超える要素が渡された場合、先頭 10 件（コマンド0〜9）のみがレンダリングされること
 *   - 構文ヘルプの後に wa-divider が配置され、その後にコマンド項目が配置されること
 *   - handleActionMenuSelect() において value='command:n' で対応する eventName のカスタムイベント（detail: { value: string }）が発火すること
 * 25. プレビューモード時のヘッダータイトル表示仕様
 *   - titleText の初期値が空文字（""）であること
 *   - mode="preview" かつ titleText が設定されている場合、ヘッダー左側にタイトル要素（.markdown-editor-preview__title）がレンダリングされること
 *   - mode="preview" かつ titleText が未設定（空文字）の場合、タイトル要素がレンダリングされないこと
 *   - mode="preview" かつ titleText が空白のみの場合、タイトル要素がレンダリングされないこと
 *   - mode="edit" または mode="split" の場合、titleText が設定されていてもタイトル要素がレンダリングされず、書式ツールバーがレンダリングされること
 *   - タイトル要素に title 属性として titleText の値が設定されていること
 *   - SCSS において .markdown-editor-preview__title に対し省略表示スタイル（overflow: hidden, text-overflow: ellipsis, white-space: nowrap）が定義されていること
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
import { colorExtension } from "../extensions/color.extension.js";
import { calloutExtension } from "../extensions/callout.extension.js";
import type { MarkdownFeatureExtension } from "../types.js";
import { DEFAULT_MARKDOWN_EXTENSIONS } from "./markdown-editor-preview.js";

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
      const scssPath = new URL(
        "./markdown-editor-preview.scss",
        import.meta.url,
      );
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
    it("未指定時の初期値として標準拡張機能（DEFAULT_MARKDOWN_EXTENSIONS: custom-badge, color, callout）が登録されていること", () => {
      const defaultPreview = new MarkdownEditorPreview();
      expect(defaultPreview.extensions).toHaveLength(3);
      expect(defaultPreview.extensions).toEqual([...DEFAULT_MARKDOWN_EXTENSIONS]);
      expect(defaultPreview.extensions).toContain(customBadgeExtension);
      expect(defaultPreview.extensions).toContain(colorExtension);
      expect(defaultPreview.extensions).toContain(calloutExtension);
    });

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

    it("初期状態では拡張機能ドロップダウンメニューが閉じていること", () => {
      expect(element.isExtensionMenuOpen).toBe(false);
    });

    it("toggleExtensionMenu() により拡張機能ドロップダウンメニューの開閉状態がトグルされること", () => {
      element.setMode("edit");
      element.extensions = [customBadgeExtension];

      element.toggleExtensionMenu(true);
      expect(element.isExtensionMenuOpen).toBe(true);

      element.toggleExtensionMenu(false);
      expect(element.isExtensionMenuOpen).toBe(false);
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

    it("拡張機能メニューが wa-dropdown（placement='bottom-start'）としてレンダリングされること", () => {
      element.setMode("edit");
      element.extensions = [customBadgeExtension];
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("<wa-dropdown");
      expect(htmlStr).toContain('placement="bottom-start"');
      expect(htmlStr).toContain("markdown-editor-preview__extension-menu-dropdown");
    });

    it("拡張メニュー内のセクションラベルが wa-dropdown 仕様に準拠し h3 見出しタグとしてレンダリングされること", () => {
      element.setMode("edit");
      element.extensions = [customBadgeExtension];
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toMatch(/<h3[^>]*>\s*追加の書式\s*<\/h3>/);
      expect(htmlStr).toMatch(/<h3[^>]*>\s*独自記法・拡張機能\s*<\/h3>/);
    });

    it("subItems を持つ拡張機能の場合、親項目内に slot='submenu' を持った子 wa-dropdown-item がレンダリングされること", () => {
      element.setMode("edit");
      element.extensions = [calloutExtension];
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain('slot="submenu"');
      expect(htmlStr).toContain('value="sub:callout:info"');
      expect(htmlStr).toContain('value="sub:callout:check"');
      expect(htmlStr).toContain('value="sub:callout:gear"');
      expect(htmlStr).toContain('value="sub:callout:warn"');
      expect(htmlStr).toContain('value="sub:callout:alert"');
    });

    it("subItems を持つ拡張機能の場合、各子 wa-dropdown-item 内の wa-icon にバリエーションに応じた modifier クラスが付与されること", () => {
      element.setMode("edit");
      element.extensions = [calloutExtension];
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain(
        "markdown-editor-preview__extension-menu-item-icon--info",
      );
      expect(htmlStr).toContain(
        "markdown-editor-preview__extension-menu-item-icon--check",
      );
      expect(htmlStr).toContain(
        "markdown-editor-preview__extension-menu-item-icon--gear",
      );
      expect(htmlStr).toContain(
        "markdown-editor-preview__extension-menu-item-icon--warn",
      );
      expect(htmlStr).toContain(
        "markdown-editor-preview__extension-menu-item-icon--alert",
      );
    });

    it("SCSS で各サブメニューアイコンの modifier クラスに Web Awesome セマンティックトークンが設定されていること", () => {
      const scssPath = new URL(
        "./markdown-editor-preview.scss",
        import.meta.url,
      );
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      expect(scssContent).toContain("&--info");
      expect(scssContent).toContain("var(--wa-color-brand-on-quiet)");
      expect(scssContent).toContain("&--check");
      expect(scssContent).toContain("var(--wa-color-success-on-quiet)");
      expect(scssContent).toContain("&--gear");
      expect(scssContent).toContain("var(--wa-color-neutral-on-quiet)");
      expect(scssContent).toContain("&--warn");
      expect(scssContent).toContain("var(--wa-color-warning-on-quiet)");
      expect(scssContent).toContain("&--alert");
      expect(scssContent).toContain("var(--wa-color-danger-on-quiet)");
    });

    it("SCSS の soft ダークテーマブロックにおいてサブメニューアイコンのカラーを !important で単色上書きしていないこと", () => {
      const scssPath = new URL(
        "./markdown-editor-preview.scss",
        import.meta.url,
      );
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      // soft ダークスタイルブロックを抽出
      const softDarkMatch = scssContent.match(
        /\/\* =+[\s\S]*?soft ダークスタイル[\s\S]*?\*\/([\s\S]*?)(?=\/\* =+|$)/,
      );
      const softDarkBlock = softDarkMatch ? softDarkMatch[1] : "";

      expect(softDarkBlock).not.toContain(
        ".markdown-editor-preview__extension-menu-item-icon",
      );
    });

    it("handleExtensionMenuSelect() において sub:callout:check の選択により /// check テンプレートがエディタへ挿入されること", () => {
      element.setMode("edit");
      element.value = "既存テキスト";
      element.extensions = [calloutExtension];

      (element as { handleExtensionMenuSelect?: (e: CustomEvent<{ item: { value: string } }>) => void }).handleExtensionMenuSelect?.(
        new CustomEvent("wa-select", {
          detail: { item: { value: "sub:callout:check" } },
        }),
      );

      expect(element.value).toContain("/// check");
    });

    it("handleExtensionMenuSelect() において ext:custom-badge の選択によりテンプレートがエディタへ挿入されること", () => {
      element.setMode("edit");
      element.value = "既存テキスト";
      element.extensions = [customBadgeExtension];

      (element as { handleExtensionMenuSelect?: (e: CustomEvent<{ item: { value: string } }>) => void }).handleExtensionMenuSelect?.(
        new CustomEvent("wa-select", {
          detail: { item: { value: "ext:custom-badge" } },
        }),
      );

      expect(element.value).toContain(":badge[");
    });

    it("handleExtensionMenuSelect() において action:bold の選択により太字アクションが実行されること", () => {
      element.setMode("edit");
      element.value = "";

      (element as { handleExtensionMenuSelect?: (e: CustomEvent<{ item: { value: string } }>) => void }).handleExtensionMenuSelect?.(
        new CustomEvent("wa-select", {
          detail: { item: { value: "action:bold" } },
        }),
      );

      expect(element.value).toContain("**太字**");
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
      expect(htmlStr).not.toContain(
        "markdown-editor-preview__help-modal--open",
      );
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

      expect(htmlStr).toContain(
        "markdown-editor-preview__toolbar-item--secondary",
      );
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
      const scssPath = new URL(
        "./markdown-editor-preview.scss",
        import.meta.url,
      );
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      expect(scssContent).toContain("@container");
      expect(scssContent).toContain(
        ".markdown-editor-preview__toolbar-item--secondary",
      );
    });
  });

  describe("ドロップダウンメニューの表示保証および独自拡張機能レンダリング仕様", () => {
    it("extensions が設定されている場合、独自記法アイテムに構文サンプルを含めずラベルのみがシンプルにレンダリングされること", () => {
      element.setMode("edit");
      element.extensions = [customBadgeExtension];
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("独自記法・拡張機能");
      expect(htmlStr).toContain("ステータスバッジ");
      expect(htmlStr).not.toContain("markdown-editor-preview__extension-menu-item-syntax");

      // ドロップダウンメニュー内に構文サンプル（:badge[）が含まれないこと
      const dropdownMatch = htmlStr.match(
        /<wa-dropdown[^>]*class="[^"]*markdown-editor-preview__extension-menu-dropdown[^"]*"[^>]*>([\s\S]*?)<\/wa-dropdown>/,
      );
      const dropdownContent = dropdownMatch ? dropdownMatch[1] : "";
      expect(dropdownContent).toContain("ステータスバッジ");
      expect(dropdownContent).not.toContain(":badge[");
    });

    it("SCSS で拡張メニューの見出し（h3）スタイルが Web Awesome 仕様（var(--wa-font-size-smaller)等）に統一されていること", () => {
      const scssPath = new URL(
        "./markdown-editor-preview.scss",
        import.meta.url,
      );
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      const h3Block =
        scssContent.match(
          /h3\.markdown-editor-preview__extension-menu-title\s*\{[^}]*\}/s,
        )?.[0] || "";
      expect(h3Block).toContain("font-size: var(--wa-font-size-smaller)");
      expect(h3Block).toContain("padding: 0.25em 0.75em");
      expect(h3Block).toContain("margin: 0.25em 0");
    });

    it("SCSS で header-left に overflow-x: auto が設定されておらず、ヘッダー外へのドロップダウン展開が阻害されないこと", () => {
      const scssPath = new URL(
        "./markdown-editor-preview.scss",
        import.meta.url,
      );
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      // .markdown-editor-preview__header-left のブロック内に overflow-x: auto が含まれていないこと
      const headerLeftBlock =
        scssContent.match(
          /\.markdown-editor-preview__header-left\s*\{[^}]*\}/s,
        )?.[0] || "";
      expect(headerLeftBlock).not.toContain("overflow-x: auto");
      expect(headerLeftBlock).not.toContain("overflow: auto");
      expect(headerLeftBlock).not.toContain("overflow: hidden");
    });

    it("SCSS で header に position: relative と z-index が設定され、エディタペインより前面にドロップダウンが描画されること", () => {
      const scssPath = new URL(
        "./markdown-editor-preview.scss",
        import.meta.url,
      );
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      const headerBlock =
        scssContent.match(
          /\.markdown-editor-preview__header\s*\{[^}]*\}/s,
        )?.[0] || "";
      expect(headerBlock).toContain("position: relative");
      expect(headerBlock).toContain("z-index");
    });

    it("拡張機能メニューが wa-dropdown の placement='bottom-start' により左揃えで前面展開されること", () => {
      element.setMode("edit");
      element.extensions = [customBadgeExtension];
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("<wa-dropdown");
      expect(htmlStr).toContain('placement="bottom-start"');
      expect(htmlStr).toContain(
        "markdown-editor-preview__extension-menu-dropdown",
      );
    });

    it("SCSS で extension-menu-dropdown のインラインレイアウトが定義されていること", () => {
      const scssPath = new URL(
        "./markdown-editor-preview.scss",
        import.meta.url,
      );
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      const menuBlock =
        scssContent.match(
          /\.markdown-editor-preview__extension-menu-dropdown\s*\{[^}]*\}/s,
        )?.[0] || "";
      expect(menuBlock).toContain("display: inline-flex");
    });

    it("SCSS で追加の書式セクションが通常幅時は非表示となり、狭幅コンテナクエリ内で表示されること", () => {
      const scssPath = new URL(
        "./markdown-editor-preview.scss",
        import.meta.url,
      );
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      expect(scssContent).toContain(
        ".markdown-editor-preview__menu-section--secondary",
      );
      // 通常時は非表示
      expect(scssContent).toMatch(
        /\.markdown-editor-preview__menu-section--secondary\s*\{[^}]*display:\s*none/s,
      );
      // コンテナクエリ内で表示
      expect(scssContent).toMatch(
        /@container[^{]*\{[\s\S]*?\.markdown-editor-preview__menu-section--secondary\s*\{[^}]*display:\s*(block|flex)/,
      );
    });
  });



  describe("固定高さ（height）プロパティ仕様", () => {
    it("height プロパティが未指定の場合、デフォルトで undefined であり、render() に固定高さスタイルが含まれないこと", () => {
      expect((element as any).height).toBeUndefined();
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("height:");
    });

    it('height="400px" が設定された場合、render() のルート要素に height: 400px スタイルが適用されること', () => {
      (element as any).height = "400px";
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("height: 400px");
      expect((element as any).effectiveHeight).toBe("400px");
    });

    it('height=500 または "500" のように数値/単位なし文字列が設定された場合、"500px" に正規化されてスタイルが適用されること', () => {
      (element as any).height = 500;
      let htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("height: 500px");
      expect((element as any).effectiveHeight).toBe("500px");

      (element as any).height = "600";
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("height: 600px");
      expect((element as any).effectiveHeight).toBe("600px");
    });


  });

  describe("アクセシビリティ（prefers-reduced-motion）仕様", () => {
    it("prefers-reduced-motion メディアクエリにおいてトランジションが無効化されること", () => {
      const scssPath = new URL(
        "./markdown-editor-preview.scss",
        import.meta.url,
      );
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      expect(scssContent).toContain("prefers-reduced-motion: reduce");
      expect(scssContent).toMatch(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?transition:\s*none/,
      );
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
      expect(htmlStr).toContain(
        "markdown-editor-preview__toolbar-btn--extension-menu",
      );
      expect(htmlStr).toContain("markdown-editor-preview__extension-menu");
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
      const darkHostMatch = scssContent.match(
        /:host\(\[data-theme="dark"\]\)[^{]*\{([^}]+)\}/,
      );
      if (darkHostMatch) {
        expect(darkHostMatch[1]).not.toMatch(
          /background-color:\s*#[0-9a-fA-F]+/,
        );
      }
      expect(scssContent).toMatch(
        /:host\s*\{[^}]*background-color:\s*transparent/,
      );
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

  describe("18. 全表示（autoHeight）モードの完全廃止と常時固定フィット表示", () => {
    it("autoHeight プロパティが定義されていない（undefined）こと", () => {
      expect((element as any).autoHeight).toBeUndefined();
    });

    it("allowAutoHeight プロパティが定義されていない（undefined）こと", () => {
      expect((element as any).allowAutoHeight).toBeUndefined();
    });

    it("ヘッダー内に全表示トグルボタン（markdown-editor-preview__auto-height-btn）が描画されないこと", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("markdown-editor-preview__auto-height-btn");
      expect(htmlStr).not.toContain("expand-solid-full");
      expect(htmlStr).not.toContain("compress-solid-full");
    });

    it("ルート要素に markdown-editor-preview--auto-height クラスが付与されないこと", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("markdown-editor-preview--auto-height");
    });
  });

  describe("19. SCSSにおける全表示モードおよび sticky ヘッダースタイルの完全排除", () => {
    const scssPath = path.resolve(__dirname, "markdown-editor-preview.scss");
    const scssContent = fs.readFileSync(scssPath, "utf-8");

    it("SCSS において .markdown-editor-preview--auto-height や :host([auto-height]) が存在しないこと", () => {
      expect(scssContent).not.toContain(".markdown-editor-preview--auto-height");
      expect(scssContent).not.toContain(":host([auto-height])");
    });

    it("SCSS において .markdown-editor-preview__auto-height-btn が存在しないこと", () => {
      expect(scssContent).not.toContain("markdown-editor-preview__auto-height-btn");
    });

    it("SCSS において .markdown-editor-preview--animating が存在しないこと", () => {
      expect(scssContent).not.toContain("markdown-editor-preview--animating");
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
      expect(scssContent).toMatch(
        /@container\s+editor-preview\s*\(\s*max-width:\s*430px\s*\)/,
      );
    });
  });

  describe("21. ヘッダー右側の整形ボタン・モード切替タブ・エディタ操作メニュー（wa-dropdown）仕様", () => {
    it("編集モード（edit）およびスプリットモード（split）時、ヘッダー右側エリアに「整形ボタン」→「モード切替タブ」→「メニューボタン（wa-dropdown）」の順に配置されていること", () => {
      element.setMode("edit");
      const editHtml = flattenTemplate(element.render());
      const editFormatIdx = editHtml.indexOf(
        "markdown-editor-preview__format-btn",
      );
      const editModeGroupIdx = editHtml.indexOf(
        "markdown-editor-preview__mode-group",
      );
      const editActionMenuIdx = editHtml.indexOf(
        "markdown-editor-preview__action-menu-btn",
      );

      expect(editFormatIdx).toBeGreaterThan(-1);
      expect(editModeGroupIdx).toBeGreaterThan(-1);
      expect(editActionMenuIdx).toBeGreaterThan(-1);
      expect(editFormatIdx).toBeLessThan(editModeGroupIdx);
      expect(editModeGroupIdx).toBeLessThan(editActionMenuIdx);
      expect(editHtml).toContain("wand-magic-sparkles-solid-full");
      expect(editHtml).toContain('title="整形"');
      expect(editHtml).toContain('aria-label="整形"');

      element.setMode("split");
      const splitHtml = flattenTemplate(element.render());
      const splitFormatIdx = splitHtml.indexOf(
        "markdown-editor-preview__format-btn",
      );
      const splitModeGroupIdx = splitHtml.indexOf(
        "markdown-editor-preview__mode-group",
      );
      expect(splitFormatIdx).toBeGreaterThan(-1);
      expect(splitFormatIdx).toBeLessThan(splitModeGroupIdx);
    });

    it("プレビューモード（preview）時、ヘッダー右側エリアに「整形ボタン」が表示されないこと", () => {
      element.setMode("preview");
      const previewHtml = flattenTemplate(element.render());

      expect(previewHtml).not.toContain("markdown-editor-preview__format-btn");
      expect(previewHtml).not.toContain("wand-magic-sparkles-solid-full");
    });

    it("エディタ操作メニューが wa-dropdown（placement='bottom-end'）としてレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("<wa-dropdown");
      expect(htmlStr).toContain('placement="bottom-end"');
    });

    it("メニューボタンが slot='trigger' として配置され、アイコンが bars-solid-full であり、title と aria-label が設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain('slot="trigger"');
      expect(htmlStr).toContain("markdown-editor-preview__action-menu-btn");
      expect(htmlStr).toContain("bars-solid-full");
      expect(htmlStr).toMatch(/title=["']エディタメニュー["']/);
      expect(htmlStr).toMatch(/aria-label=["']エディタメニュー["']/);
    });

    it("wa-dropdown 内に「コピー」「構文ヘルプ」の各 wa-dropdown-item がレンダリングされ、「整形」項目は含まれないこと", () => {
      element.setMode("edit");
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain('<wa-dropdown-item value="copy"');
      expect(htmlStr).toContain('<wa-dropdown-item value="help"');
      expect(htmlStr).not.toContain('<wa-dropdown-item value="format"');
      expect(htmlStr).toContain("copy-solid-full");
      expect(htmlStr).toContain("question-solid-full");
      expect(htmlStr).toContain("コピー");
      expect(htmlStr).toContain("構文ヘルプ");
    });

    it("handleActionMenuSelect() において value='copy' でコピー処理が実行され markdown-copy イベントが発火すること", async () => {
      element.value = "# コピー対象テキスト";
      let copiedText = "";
      const originalClipboard = globalThis.navigator?.clipboard;
      Object.assign(globalThis.navigator || {}, {
        clipboard: {
          writeText: async (text: string) => {
            copiedText = text;
          },
        },
      });

      try {
        let copyEventFired = false;
        element.addEventListener("markdown-copy", (e: Event) => {
          copyEventFired = true;
          expect((e as CustomEvent<{ value: string }>).detail.value).toBe(
            "# コピー対象テキスト",
          );
        });

        const customEvt = new CustomEvent("wa-select", {
          detail: { item: { value: "copy" } },
        });
        await element.handleActionMenuSelect(customEvt);

        expect(copiedText).toBe("# コピー対象テキスト");
        expect(copyEventFired).toBe(true);
      } finally {
        if (originalClipboard) {
          Object.assign(globalThis.navigator, { clipboard: originalClipboard });
        }
      }
    });

    it("handleMenuFormatAction() 実行によりフォーマッターが実行されて value が更新されること", async () => {
      element.value = "#  未整形タイトル \n\n\n\n本文段落  ";
      await element.handleMenuFormatAction();

      expect(element.value.trim()).toBe("# 未整形タイトル\n\n本文段落");
    });

    it("handleActionMenuSelect() において value='help' で toggleHelp(true) が呼び出されること", () => {
      let helpOpened = false;
      element.toggleHelp = (open?: boolean) => {
        helpOpened = open ?? true;
      };

      const customEvt = new CustomEvent("wa-select", {
        detail: { item: { value: "help" } },
      });
      element.handleActionMenuSelect(customEvt);

      expect(helpOpened).toBe(true);
    });
  });

  describe("22. テーマスタイルバリアント制御（darkTheme / lightTheme）と soft ダークスタイル", () => {
    const scssPath = path.resolve(__dirname, "markdown-editor-preview.scss");
    const scssContent = fs.readFileSync(scssPath, "utf-8");

    it("darkTheme の初期値が 'contrast'、lightTheme の初期値が 'default' であること", () => {
      expect(element.darkTheme).toBe("contrast");
      expect(element.lightTheme).toBe("default");
    });

    it("darkTheme='soft' が指定された場合、ホスト要素に dark-theme='soft' 属性が設定されること", () => {
      element.darkTheme = "soft";
      element.themeMode = "dark";
      element.requestUpdate();
      element.syncTheme();
      expect(element.getAttribute("dark-theme")).toBe("soft");
    });

    it("lightTheme='default' が指定された場合、ホスト要素に light-theme='default' 属性が設定されること", () => {
      element.lightTheme = "default";
      element.themeMode = "light";
      element.requestUpdate();
      element.syncTheme();
      expect(element.getAttribute("light-theme")).toBe("default");
    });

    it("renderBody() において子要素（markdown-editor, markdown-preview）へ darkTheme と lightTheme がバインドされること", () => {
      element.darkTheme = "soft";
      element.lightTheme = "default";
      const bodyTemplate = (
        element as unknown as { renderBody(): unknown }
      ).renderBody();
      const htmlStr = flattenTemplate(bodyTemplate);

      expect(htmlStr).toContain("markdown-editor");
      expect(htmlStr).toContain("markdown-preview");
    });

    it("SCSS において soft ダーク用のスタイルが定義され、StepNote 調のソフトダーク配色が指定されていること", () => {
      expect(scssContent).toMatch(/:host\(\[data-theme="dark"\]\[dark-theme="soft"\]\)/);
      expect(scssContent).toMatch(/--stepnote-bg-surface:\s*var\(--wa-color-surface-default,\s*#2f323f\)/);
      expect(scssContent).toMatch(/--stepnote-border-subtle:\s*var\(--wa-color-surface-border,\s*#434857\)/);
    });
  });

  describe("23. エディタ操作メニューの削除ボタン仕様", () => {
    it("showDeleteButton の初期値が false であること", () => {
      expect(element.showDeleteButton).toBe(false);
    });

    it("showDeleteButton が false の場合、削除項目および wa-divider がレンダリングされないこと", () => {
      element.showDeleteButton = false;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain(
        '<wa-dropdown-item variant="danger" value="delete"',
      );
      expect(htmlStr).not.toContain("trash-solid-full");
      expect(htmlStr).not.toContain("<wa-divider");
    });

    it("showDeleteButton が true の場合、構文ヘルプの後に wa-divider と削除項目がレンダリングされること", () => {
      element.showDeleteButton = true;
      const htmlStr = flattenTemplate(element.render());

      const helpIdx = htmlStr.indexOf('value="help"');
      const dividerIdx = htmlStr.indexOf("<wa-divider");
      const deleteIdx = htmlStr.indexOf('value="delete"');

      expect(helpIdx).toBeGreaterThan(-1);
      expect(dividerIdx).toBeGreaterThan(-1);
      expect(deleteIdx).toBeGreaterThan(-1);
      expect(helpIdx).toBeLessThan(dividerIdx);
      expect(dividerIdx).toBeLessThan(deleteIdx);

      expect(htmlStr).toContain('variant="danger"');
      expect(htmlStr).toContain("trash-solid-full");
      expect(htmlStr).toContain("削除");
    });

    it("handleActionMenuSelect() において value='delete' で markdown-delete イベントが発火すること", async () => {
      element.value = "# 削除対象の文書";
      let deleteFired = false;
      let deletePayload = "";

      element.addEventListener("markdown-delete", (e: Event) => {
        deleteFired = true;
        deletePayload = (e as CustomEvent<{ value: string }>).detail.value;
      });

      const customEvt = new CustomEvent("wa-select", {
        detail: { item: { value: "delete" } },
      });
      await element.handleActionMenuSelect(customEvt);

      expect(deleteFired).toBe(true);
      expect(deletePayload).toBe("# 削除対象の文書");
    });
  });

  describe("24. エディタ操作メニューのコマンド0〜9サブメニュー仕様", () => {
    it("commands の初期値が空配列であること", () => {
      expect(element.commands).toEqual([]);
    });

    it("commands が未指定（空配列）の場合、親項目「コマンド」およびそのサブメニューがレンダリングされないこと", () => {
      element.commands = [];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("コマンド");
      expect(htmlStr).not.toContain('value="command:');
      expect(htmlStr).not.toContain("number-0-solid-full");
    });

    it("commands が設定された場合、親項目「コマンド」とサブメニュー項目がレンダリングされ、アイコン number-0〜9 が設定されること", () => {
      element.commands = [
        { label: "タスク完了保存", eventName: "task-save" },
        { label: "課題へ変換", eventName: "task-convert-issue" },
      ];
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("コマンド");
      expect(htmlStr).toContain("terminal-solid-full");
      expect(htmlStr).toContain('slot="submenu"');
      expect(htmlStr).toContain('value="command:0"');
      expect(htmlStr).toContain("number-0-solid-full");
      expect(htmlStr).toContain("タスク完了保存");
      expect(htmlStr).toContain('value="command:1"');
      expect(htmlStr).toContain("number-1-solid-full");
      expect(htmlStr).toContain("課題へ変換");
    });

    it("commands に 10 件を超える要素が渡された場合、先頭 10 件（コマンド0〜9）のみがレンダリングされること", () => {
      element.commands = Array.from({ length: 15 }, (_, i) => ({
        label: `コマンド${i}`,
        eventName: `cmd-${i}`,
      }));
      const htmlStr = flattenTemplate(element.render());

      for (let i = 0; i < 10; i++) {
        expect(htmlStr).toContain(`value="command:${i}"`);
        expect(htmlStr).toContain(`number-${i}-solid-full`);
        expect(htmlStr).toContain(`コマンド${i}`);
      }
      expect(htmlStr).not.toContain('value="command:10"');
      expect(htmlStr).not.toContain("number-10-solid-full");
      expect(htmlStr).not.toContain("コマンド10");
    });

    it("構文ヘルプの後に wa-divider が配置され、その後にコマンド項目が配置されること", () => {
      element.commands = [{ label: "カスタム保存", eventName: "custom-save" }];
      const htmlStr = flattenTemplate(element.render());

      const helpIdx = htmlStr.indexOf('value="help"');
      const dividerIdx = htmlStr.indexOf("<wa-divider");
      const cmdIdx = htmlStr.indexOf('value="command:0"');

      expect(helpIdx).toBeGreaterThan(-1);
      expect(dividerIdx).toBeGreaterThan(-1);
      expect(cmdIdx).toBeGreaterThan(-1);
      expect(helpIdx).toBeLessThan(dividerIdx);
      expect(dividerIdx).toBeLessThan(cmdIdx);
    });

    it("handleActionMenuSelect() において value='command:0' で対応する eventName のカスタムイベントが発火すること", async () => {
      element.value = "# コマンド対象テキスト";
      element.commands = [
        { label: "即時保存", eventName: "custom-quick-save" },
        { label: "アーカイブ", eventName: "custom-archive" },
      ];

      let saveFired = false;
      let savePayload = "";
      element.addEventListener("custom-quick-save", (e: Event) => {
        saveFired = true;
        savePayload = (e as CustomEvent<{ value: string }>).detail.value;
      });

      let archiveFired = false;
      element.addEventListener("custom-archive", () => {
        archiveFired = true;
      });

      const customEvt = new CustomEvent("wa-select", {
        detail: { item: { value: "command:0" } },
      });
      await element.handleActionMenuSelect(customEvt);

      expect(saveFired).toBe(true);
      expect(savePayload).toBe("# コマンド対象テキスト");
      expect(archiveFired).toBe(false);
    });

    it("handleActionMenuSelect() において value='command:1' で別コマンドの eventName のカスタムイベントが発火すること", async () => {
      element.value = "# アーカイブ対象テキスト";
      element.commands = [
        { label: "即時保存", eventName: "custom-quick-save" },
        { label: "アーカイブ", eventName: "custom-archive" },
      ];

      let archiveFired = false;
      let archivePayload = "";
      element.addEventListener("custom-archive", (e: Event) => {
        archiveFired = true;
        archivePayload = (e as CustomEvent<{ value: string }>).detail.value;
      });

      const customEvt = new CustomEvent("wa-select", {
        detail: { item: { value: "command:1" } },
      });
      await element.handleActionMenuSelect(customEvt);

      expect(archiveFired).toBe(true);
      expect(archivePayload).toBe("# アーカイブ対象テキスト");
    });
  });

  describe("プレビューモード時のヘッダータイトル表示仕様", () => {
    it("titleText の初期値が空文字（\"\"）であること", () => {
      expect(element.titleText).toBe("");
    });

    it("mode=\"preview\" かつ titleText が設定されている場合、ヘッダー左側にタイトル要素がレンダリングされること", () => {
      element.mode = "preview";
      element.titleText = "タスクの概要と課題一覧";
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain("markdown-editor-preview__title");
      expect(htmlStr).toContain("タスクの概要と課題一覧");
    });

    it("mode=\"preview\" かつ titleText が未設定（空文字）の場合、タイトル要素がレンダリングされないこと", () => {
      element.mode = "preview";
      element.titleText = "";
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).not.toContain("markdown-editor-preview__title");
    });

    it("mode=\"preview\" かつ titleText が空白のみの場合、タイトル要素がレンダリングされないこと", () => {
      element.mode = "preview";
      element.titleText = "   ";
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).not.toContain("markdown-editor-preview__title");
    });

    it("mode=\"edit\" または mode=\"split\" の場合、titleText が設定されていてもタイトル要素がレンダリングされず、書式ツールバーがレンダリングされること", () => {
      element.mode = "edit";
      element.titleText = "タスクの概要と課題一覧";
      const editHtml = flattenTemplate(element.render());
      expect(editHtml).not.toContain("markdown-editor-preview__title");
      expect(editHtml).toContain("markdown-editor-preview__toolbar");

      element.mode = "split";
      const splitHtml = flattenTemplate(element.render());
      expect(splitHtml).not.toContain("markdown-editor-preview__title");
      expect(splitHtml).toContain("markdown-editor-preview__toolbar");
    });

    it("タイトル要素に title 属性として titleText の値が設定されていること", () => {
      element.mode = "preview";
      element.titleText = "非常に長いタイトルのためホバーで全文確認したいタスク名称";
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toContain('title="非常に長いタイトルのためホバーで全文確認したいタスク名称"');
    });

    it("SCSS において .markdown-editor-preview__title に対し省略表示スタイル（overflow, text-overflow, white-space）が定義されていること", () => {
      const scssPath = path.resolve(__dirname, "markdown-editor-preview.scss");
      const scssContent = fs.readFileSync(scssPath, "utf-8");

      expect(scssContent).toContain(".markdown-editor-preview__title");
      expect(scssContent).toMatch(/overflow:\s*hidden;/);
      expect(scssContent).toMatch(/text-overflow:\s*ellipsis;/);
      expect(scssContent).toMatch(/white-space:\s*nowrap;/);
    });
  });
});
