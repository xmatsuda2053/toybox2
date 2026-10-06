/**
 * MarkdownPreview コンポーネント単体テスト仕様
 *
 * 1. 基本レンダリング
 *   - 初期状態で空文字列の場合は空のプレビュー領域が描画されること
 *   - content プロパティに Markdown を設定すると、HTML に変換されて描画されること
 * 2. プロパティ更新の追従
 *   - content プロパティの変更を検知してプレビュー HTML が更新されること
 * 3. プラグイン注入（DI）の適用
 *   - processorOptions で渡したプラグイン設定がプレビュー描画に反映されること
 * 4. セキュリティとサニタイズ
 *   - XSS を含む入力に対して安全な HTML のみが描画されること
 * 5. カスタムイベント通知
 *   - パース・レンダリング完了時に "markdown-rendered" イベントが発火すること
 * 6. テーマ別文字色・CSS変数の定義（Light / Dark モード対応）
 *   - markdown-preview.scss において、プレビュー本文文字色および --fgColor-default がセマンティックトークンを参照していること
 *   - レンダリングされた markdown-preview__body 要素に現在のテーマに応じた data-theme が付与されること
 * 7. SCSS 設計標準化（!important 完全排除）
 *   - markdown-preview.scss 内に !important 宣言が 1 箇所も存在しないこと（important_count === 0）
 * 8. ハードコードカラーの完全排除（セマンティックトークン化）
 *   - markdown-preview.scss 内に直値カラー（#..., rgba(...)）が存在しないこと
 * 9. Table 偶数行背景および境界線のトークン参照
 *   - Table 偶数行背景（--bgColor-muted）および境界線がセマンティックトークンを参照していること
 * 10. コードブロック（pre / code）のトークン参照
 *   - pre および code の背景色がセマンティックトークンを参照していること
 * 11. Table セル（th / td）および行境界線の明示定義
 *   - Table セルおよび行のボーダーが明示的にセマンティックトークンを参照していること
 * 12. color-scheme 明示制御によるチェックボックス暗化防止
 *   - Light/Dark モードに応じた color-scheme が設定され、OSダークモード環境下でもチェックボックスが暗化しないこと
 * 13. チェックボックスのアクセントカラー
 *   - input[type='checkbox'] の accent-color がセマンティックトークンを参照していること
 * 14. blockquote の背景色・左ボーダー・文字色
 *   - blockquote がエディタ・ビュアーと同化せず、セマンティックトークンによる背景色・ボーダー・文字色を持つこと
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { MarkdownPreview } from "./markdown-preview.js";
import type { Plugin } from "unified";
import type { Root as MdastRoot, Heading } from "mdast";
import { visit } from "unist-util-visit";

describe("MarkdownPreview (<markdown-preview>)", () => {
  let element: MarkdownPreview;

  beforeEach(() => {
    element = new MarkdownPreview();
  });

  afterEach(() => {
    // クリーンアップ
  });

  describe("基本レンダリング", () => {
    it("content が空の場合は空の HTML が描画されること", async () => {
      element.content = "";
      await element.renderMarkdown();

      expect(element.renderedHtml).toBe("");
    });

    it("content に Markdown を設定すると HTML に変換されること", async () => {
      element.content = "# タイトル\n\n段落テキスト";
      await element.renderMarkdown();

      expect(element.renderedHtml).toContain("<h1>タイトル</h1>");
      expect(element.renderedHtml).toContain("<p>段落テキスト</p>");
    });
  });

  describe("プロパティ更新の追従", () => {
    it("content が更新されたときにプレビュー HTML が再生成されること", async () => {
      element.content = "# 初回";
      await element.renderMarkdown();
      expect(element.renderedHtml).toContain("<h1>初回</h1>");

      element.content = "## 更新後";
      await element.renderMarkdown();
      expect(element.renderedHtml).toContain("<h2>更新後</h2>");
    });
  });

  describe("プラグイン注入（DI）の適用", () => {
    it("processorOptions で渡した remark プラグインが反映されること", async () => {
      const remarkCustomPlugin: Plugin<[], MdastRoot> = () => {
        return (tree) => {
          visit(tree, "heading", (node: Heading) => {
            const firstChild = node.children[0];
            if (firstChild && firstChild.type === "text") {
              firstChild.value += " [プラグイン適用]";
            }
          });
        };
      };

      element.processorOptions = {
        remarkPlugins: [remarkCustomPlugin],
      };
      element.content = "# プラグイン検証";
      await element.renderMarkdown();

      expect(element.renderedHtml).toContain(
        "<h1>プラグイン検証 [プラグイン適用]</h1>",
      );
    });
  });

  describe("セキュリティとサニタイズ", () => {
    it("スクリプトタグなどの危険な要素がサニタイズされること", async () => {
      element.content = "本文 <script>alert('xss')</script> **安全なテキスト**";
      await element.renderMarkdown();

      expect(element.renderedHtml).not.toContain("<script>");
      expect(element.renderedHtml).toContain("<strong>安全なテキスト</strong>");
    });
  });

  describe("カスタムイベント通知", () => {
    it("レンダリング完了時に markdown-rendered イベントが発火すること", async () => {
      let eventDetail: { html: string } | null = null;
      element.addEventListener("markdown-rendered", (e: Event) => {
        const customEvt = e as CustomEvent<{ html: string }>;
        eventDetail = customEvt.detail;
      });

      element.content = "イベントテスト";
      await element.renderMarkdown();

      expect(eventDetail).not.toBeNull();
      expect(eventDetail!.html).toContain("<p>イベントテスト</p>");
    });
  });

  describe("テーマ別文字色・CSS変数の定義および SCSS 設計標準化", () => {
    const scssPath = path.resolve(
      __dirname,
      "markdown-preview.scss",
    );
    const scssContent = fs.readFileSync(scssPath, "utf-8");

    it("SCSS でプレビュー本文文字色および --fgColor-default がセマンティックトークンを参照していること", () => {
      expect(scssContent).toMatch(/--fgColor-default:\s*var\(--stepnote-markdown-text\)/);
      expect(scssContent).toMatch(/color:\s*var\(--stepnote-markdown-text\)/);
    });

    it("レンダリングされた body 要素に data-theme が付与されること", async () => {
      element.content = "テスト";
      await element.renderMarkdown();
      const template = element.render();
      const renderedStr = flattenTemplate(template);

      expect(renderedStr).toMatch(/data-theme="light"/);
    });

    it("SCSS 内に !important 宣言が 1 箇所も存在しないこと（完全排除）", () => {
      expect(scssContent).not.toContain("!important");
    });

    it("SCSS 内に直値カラー（#..., rgba(...)）が存在しないこと（完全セマンティックトークン化）", () => {
      // 16進数カラーコード（#fff, #1f2328 等）の直値が含まれないこと
      const hexMatches = scssContent.match(/#([0-9a-fA-F]{3,8})\b/g) || [];
      expect(hexMatches).toEqual([]);

      // rgba() や rgb() の直値が含まれないこと
      const rgbMatches = scssContent.match(/\brgba?\s*\([^)]*\)/g) || [];
      expect(rgbMatches).toEqual([]);
    });

    it("Table 偶数行背景および境界線がセマンティックトークンを参照していること", () => {
      // テーブル偶数行の背景色（--bgColor-muted）がセマンティックトークンを参照していること
      expect(scssContent).toMatch(/--bgColor-muted:\s*var\(--stepnote-markdown-table-row-bg-even\)/);
      // テーブル境界線（--borderColor-default / --borderColor-muted）がセマンティックトークンを参照していること
      expect(scssContent).toMatch(/--borderColor-default:\s*var\(--stepnote-markdown-table-border\)/);
      expect(scssContent).toMatch(/--borderColor-muted:\s*var\(--stepnote-markdown-table-border\)/);
    });

    it("コードブロック（pre / code）の背景色がセマンティックトークンを参照していること", () => {
      expect(scssContent).toMatch(/pre[\s\S]*?background-color:\s*var\(--stepnote-markdown-pre-bg\)/);
      expect(scssContent).toMatch(/code[\s\S]*?background-color:\s*var\(--stepnote-markdown-code-bg\)/);
    });

    it("Table セル（th / td）および行のボーダーが明示的にセマンティックトークンを参照していること", () => {
      expect(scssContent).toMatch(/th,\s*td[\s\S]*?border:\s*1px\s+solid\s+var\(--stepnote-markdown-table-border\)/);
      expect(scssContent).toMatch(/border-top:\s*1px\s+solid\s+var\(--stepnote-markdown-table-border\)/);
    });

    it("Light/Dark モードに応じた color-scheme が明示的に定義され、OSダークモードによるチェックボックス暗化を防止していること", () => {
      expect(scssContent).toMatch(/:host\(\[data-theme="light"\]\)[\s\S]*?color-scheme:\s*light/);
      expect(scssContent).toMatch(/:host\(\[data-theme="dark"\]\)[\s\S]*?color-scheme:\s*dark/);
    });

    it("チェックボックス（input[type='checkbox']）の accent-color がセマンティックトークンを参照していること", () => {
      expect(scssContent).toMatch(/input\[type="checkbox"\][\s\S]*?accent-color:\s*var\(--stepnote-markdown-checkbox-accent\)/);
    });

    it("blockquote の背景色・左ボーダー・文字色がセマンティックトークンを参照していること", () => {
      expect(scssContent).toMatch(/blockquote[\s\S]*?background-color:\s*var\(--stepnote-markdown-blockquote-bg\)/);
      expect(scssContent).toMatch(/blockquote[\s\S]*?border-left:\s*0\.25em\s+solid\s+var\(--stepnote-markdown-blockquote-border\)/);
      expect(scssContent).toMatch(/blockquote[\s\S]*?color:\s*var\(--stepnote-markdown-blockquote-text\)/);
    });
  });
});
