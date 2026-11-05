/**
 * @file test-parens.test.ts
 * @description Issue #386 (SN-020): 半角括弧を含むURL・パスにおけるMarkdownリンクの途切れ不具合の検証テスト
 *
 * テスト仕様:
 * 1. normalizeMarkdownLinksWithSpaces の半角括弧サポート
 *    - 1-1. 半角括弧を含むWindowsパス（スペースあり）が途中で途切れず <...> で正規化されること
 *    - 1-2. 半角括弧を含むWeb URL（スペースあり）が途中で途切れず <...> で正規化されること
 *    - 1-3. 半角括弧を含むWikipedia等のURL（スペースなし）が途中で途切れず正しく保持されること
 *    - 1-4. リンク後続テキストがリンクの外側にそのまま維持されること
 *    - 1-5. ネストした半角括弧を含むURLが最外側の閉じ括弧まで正しく認識されること
 * 2. createMarkdownProcessor（Markdownレンダラー）の半角括弧URLレンダリング
 *    - 2-1. 半角括弧を含むWindowsパスが途切れず1つの<a>タグとしてレンダリングされ、後続テキストが正常に描画されること
 *    - 2-2. 半角括弧を含むWeb URLが途切れず1つの<a>タグとしてレンダリングされ、後続テキストが正常に描画されること
 */

import { describe, it, expect } from "vitest";
import { normalizeMarkdownLinksWithSpaces } from "../utils/link-normalizer.js";
import { createMarkdownProcessor } from "./markdown-processor.js";

describe("Issue #386 (SN-020): 半角括弧を含むURL・パスのMarkdownリンク検証", () => {
  describe("1. normalizeMarkdownLinksWithSpaces の半角括弧サポート", () => {
    it("1-1. 半角括弧を含むWindowsパス（スペースあり）が途中で途切れず <...> で正規化されること", () => {
      const input = "[フォルダ](C:\\Program Files (x86)\\My App\\test.exe)";
      const result = normalizeMarkdownLinksWithSpaces(input);
      expect(result).toBe("[フォルダ](<C:\\\\Program Files (x86)\\\\My App\\\\test.exe>)");
    });

    it("1-2. 半角括弧を含むWeb URL（スペースあり）が途中で途切れず <...> で正規化されること", () => {
      const input = "[リンク](https://example.com/path(1)/file (2).pdf)";
      const result = normalizeMarkdownLinksWithSpaces(input);
      expect(result).toBe("[リンク](<https://example.com/path(1)/file (2).pdf>)");
    });

    it("1-3. 半角括弧を含むWikipedia等のURL（スペースなし）が途中で途切れず正しく保持されること", () => {
      const input = "[Wikipedia](https://ja.wikipedia.org/wiki/ウィキペディア_(曖昧さ回避))";
      const result = normalizeMarkdownLinksWithSpaces(input);
      expect(result).toBe("[Wikipedia](https://ja.wikipedia.org/wiki/ウィキペディア_(曖昧さ回避))");
    });

    it("1-4. リンク後続テキストがリンクの外側にそのまま維持されること", () => {
      const input = "[アプリ](C:\\Program Files (x86)\\app.exe) 後続テキストです。";
      const result = normalizeMarkdownLinksWithSpaces(input);
      expect(result).toBe("[アプリ](<C:\\\\Program Files (x86)\\\\app.exe>) 後続テキストです。");
    });

    it("1-5. ネストした半角括弧を含むURLが最外側の閉じ括弧まで正しく認識されること", () => {
      const input = "[ネスト](https://example.com/foo(bar(baz)) test) 続き";
      const result = normalizeMarkdownLinksWithSpaces(input);
      expect(result).toBe("[ネスト](<https://example.com/foo(bar(baz)) test>) 続き");
    });
  });

  describe("2. createMarkdownProcessor の半角括弧URLレンダリング", () => {
    it("2-1. 半角括弧を含むWindowsパスが途切れず1つの<a>タグとしてレンダリングされ、後続テキストが正常に描画されること", async () => {
      const processor = createMarkdownProcessor();
      const input = "[フォルダ](C:\\Program Files (x86)\\My App\\test.exe) 後続の文章です。";
      const html = await processor.process(input);

      expect(html).toContain('data-link-type="path"');
      expect(html).toContain('title="[フォルダパス] C:\\Program Files (x86)\\My App\\test.exe"');
      expect(html).toContain(">フォルダ</a> 後続の文章です。</p>");
      expect(html).not.toContain("\\My App\\test.exe)");
    });

    it("2-2. 半角括弧を含むWeb URLが途切れず1つの<a>タグとしてレンダリングされ、後続テキストが正常に描画されること", async () => {
      const processor = createMarkdownProcessor();
      const input = "[ファイル](https://example.com/path(1)/file (2).pdf) 後続の文章です。";
      const html = await processor.process(input);

      expect(html).toContain('data-link-type="url"');
      expect(html).toContain('title="[URL] https://example.com/path(1)/file (2).pdf"');
      expect(html).toContain(">ファイル</a> 後続の文章です。</p>");
    });
  });
});
