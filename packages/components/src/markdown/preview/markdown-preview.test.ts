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
 *   - markdown-preview.scss において、ライトモードのプレビュー本文文字色および --fgColor-default が指定されていること
 *   - markdown-preview.scss において、ダークモードのプレビュー本文文字色および --fgColor-default が指定されていること
 *   - レンダリングされた markdown-preview__body 要素に現在のテーマに応じた data-theme が付与されること
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

  describe("テーマ別文字色・CSS変数の定義（Light / Dark モード対応）", () => {
    const scssPath = path.resolve(
      __dirname,
      "markdown-preview.scss",
    );
    const scssContent = fs.readFileSync(scssPath, "utf-8");

    it("SCSS でライトモード時の本文文字色および --fgColor-default が定義されていること", () => {
      // OS のダークモード設定に引きずられないよう、ライトモードの文字色を明示的に指定していること
      expect(scssContent).toMatch(/--fgColor-default:\s*#1f2328/);
      expect(scssContent).toMatch(/color:\s*#1f2328/);
    });

    it("SCSS でダークモード時の本文文字色および --fgColor-default が定義されていること", () => {
      expect(scssContent).toMatch(/--fgColor-default:\s*#e6edf3/);
      expect(scssContent).toMatch(/color:\s*#e6edf3/);
    });

    it("レンダリングされた body 要素に data-theme が付与されること", async () => {
      element.content = "テスト";
      await element.renderMarkdown();
      const template = element.render();
      const renderedStr = flattenTemplate(template);

      expect(renderedStr).toMatch(/data-theme="light"/);
    });
  });
});
