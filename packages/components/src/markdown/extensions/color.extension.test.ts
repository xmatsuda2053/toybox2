/**
 * 【colorExtension 単体テスト仕様】
 *
 * 1. 拡張機能定義の整合性
 *    - 1-1. id が "color" であり、label が "文字色"、template が "/red:テキスト/" であること
 *    - 1-2. toolbarItem の icon が "palette-solid-full" であること
 *
 * 2. 色名指定（例: /red:hoge/）による変換仕様
 *    - 2-1. /red:hoge/ が <span style="color:red">hoge</span> に変換されること
 *    - 2-2. /blue:青い文字/ が <span style="color:blue">青い文字</span> に変換されること
 *    - 2-3. 前後のテキストが欠損せず保持されること（例: /red:hoge/fuga → <span style="color:red">hoge</span>fuga）
 *
 * 3. 16進数カラーコード（HEX）指定（例: /#999999:hoge/）による変換仕様
 *    - 3-1. 6桁HEX（/#999999:テキスト/）が <span style="color:#999999">テキスト</span> に変換されること
 *    - 3-2. 3桁HEX（/#f00:赤/）が <span style="color:#f00">赤</span> に変換されること
 *
 * 4. 複数構文および境界値の処理仕様
 *    - 4-1. 同一行内に複数のカラー構文が存在する場合、すべて個別に変換されること
 *    - 4-2. スラッシュで閉じられていない構文（/red:hoge）は通常のテキストとして出力されること
 *    - 4-3. コロンが存在しない構文（/red/）は通常のテキストとして出力されること
 *    - 4-4. 不正なカラー指定（例: /red!#$:text/）は通常のテキストとして出力されること
 *
 * 5. サニタイズの安全性
 *    - 5-1. span 要素の style 属性が安全に許可されること
 */

import { describe, it, expect } from "vitest";
import { colorExtension } from "./color.extension.js";
import { createMarkdownProcessor } from "../pipeline/markdown-processor.js";

describe("colorExtension", () => {
  describe("1. 拡張機能定義の整合性", () => {
    it("1-1. id が 'color' であり、label が '文字色'、template が '/red:テキスト/' であること", () => {
      expect(colorExtension.id).toBe("color");
      expect(colorExtension.label).toBe("文字色");
      expect(colorExtension.template).toBe("/red:テキスト/");
    });

    it("1-2. toolbarItem の icon が 'palette-solid-full' であること", () => {
      expect(colorExtension.toolbarItem?.icon).toBe("palette-solid-full");
    });
  });

  describe("2. 色名指定（例: /red:hoge/）による変換仕様", () => {
    it("2-1. /red:hoge/ が style='color:red' の span に変換されること", async () => {
      const processor = createMarkdownProcessor({
        remarkPlugins: colorExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier: colorExtension.processor?.sanitizeSchemaModifier,
      });

      const html = await processor.process("/red:hoge/");
      expect(html).toContain('<span style="color:red">hoge</span>');
    });

    it("2-2. /blue:青い文字/ が style='color:blue' の span に変換されること", async () => {
      const processor = createMarkdownProcessor({
        remarkPlugins: colorExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier: colorExtension.processor?.sanitizeSchemaModifier,
      });

      const html = await processor.process("これは /blue:青い文字/ のテストです。");
      expect(html).toContain('<span style="color:blue">青い文字</span>');
      expect(html).toContain("これは ");
      expect(html).toContain(" のテストです。");
    });

    it("2-3. 前後のテキストが欠損せず保持されること（例: /red:hoge/fuga）", async () => {
      const processor = createMarkdownProcessor({
        remarkPlugins: colorExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier: colorExtension.processor?.sanitizeSchemaModifier,
      });

      const html = await processor.process("/red:hoge/fuga");
      expect(html).toContain('<span style="color:red">hoge</span>fuga');
    });
  });

  describe("3. 16進数カラーコード（HEX）指定（例: /#999999:hoge/）による変換仕様", () => {
    it("3-1. 6桁HEX（/#999999:テキスト/）が style='color:#999999' の span に変換されること", async () => {
      const processor = createMarkdownProcessor({
        remarkPlugins: colorExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier: colorExtension.processor?.sanitizeSchemaModifier,
      });

      const html = await processor.process("/#999999:グレーテキスト/");
      expect(html).toContain('<span style="color:#999999">グレーテキスト</span>');
    });

    it("3-2. 3桁HEX（/#f00:赤/）が style='color:#f00' の span に変換されること", async () => {
      const processor = createMarkdownProcessor({
        remarkPlugins: colorExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier: colorExtension.processor?.sanitizeSchemaModifier,
      });

      const html = await processor.process("/#f00:赤/");
      expect(html).toContain('<span style="color:#f00">赤</span>');
    });
  });

  describe("4. 複数構文および境界値の処理仕様", () => {
    it("4-1. 同一行内に複数のカラー構文が存在する場合、すべて個別に変換されること", async () => {
      const processor = createMarkdownProcessor({
        remarkPlugins: colorExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier: colorExtension.processor?.sanitizeSchemaModifier,
      });

      const html = await processor.process("/red:赤/ と /green:緑/ と /#0000ff:青/");
      expect(html).toContain('<span style="color:red">赤</span>');
      expect(html).toContain('<span style="color:green">緑</span>');
      expect(html).toContain('<span style="color:#0000ff">青</span>');
    });

    it("4-2. スラッシュで閉じられていない構文（/red:hoge）は通常のテキストとして出力されること", async () => {
      const processor = createMarkdownProcessor({
        remarkPlugins: colorExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier: colorExtension.processor?.sanitizeSchemaModifier,
      });

      const html = await processor.process("/red:hoge");
      expect(html).not.toContain("<span");
      expect(html).toContain("/red:hoge");
    });

    it("4-3. コロンが存在しない構文（/red/）は通常のテキストとして出力されること", async () => {
      const processor = createMarkdownProcessor({
        remarkPlugins: colorExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier: colorExtension.processor?.sanitizeSchemaModifier,
      });

      const html = await processor.process("/red/");
      expect(html).not.toContain("<span");
      expect(html).toContain("/red/");
    });

    it("4-4. 不正なカラー指定（例: /red!#$:text/）は通常のテキストとして出力されること", async () => {
      const processor = createMarkdownProcessor({
        remarkPlugins: colorExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier: colorExtension.processor?.sanitizeSchemaModifier,
      });

      const html = await processor.process("/red!#$:text/");
      expect(html).not.toContain("<span");
    });
  });

  describe("5. サニタイズの安全性", () => {
    it("5-1. span 要素の style 属性が安全に許可されること", async () => {
      const processor = createMarkdownProcessor({
        remarkPlugins: colorExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier: colorExtension.processor?.sanitizeSchemaModifier,
      });

      const html = await processor.process("/red:安全な文字/");
      expect(html).toContain('style="color:red"');
    });
  });
});
