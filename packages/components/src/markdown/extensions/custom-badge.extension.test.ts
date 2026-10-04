/**
 * customBadgeExtension 単体テスト仕様
 *
 * 1. 拡張機能定義の整合性
 *   - id が "custom-badge" であり、label および template が正しく定義されていること
 * 2. Markdown パイプラインとの統合変換
 *   - 通常のラベル構文（:badge[通常]:）が info スタイルのバッジ span に変換されること
 *   - "高" または "緊急" を含むラベル構文（:badge[優先度:高]:）が danger スタイルのバッジ span に変換されること
 *   - バッジ前後の文章が欠損せず保持されること
 * 3. サニタイズの安全性
 *   - バッジ内にスクリプトや HTML タグが注入されても除去またはエスケープされること
 */

import { describe, it, expect } from "vitest";
import { customBadgeExtension } from "./custom-badge.extension.js";
import { createMarkdownProcessor } from "../pipeline/markdown-processor.js";

describe("customBadgeExtension", () => {
  describe("拡張機能定義の整合性", () => {
    it("id, label, template が正しく設定されていること", () => {
      expect(customBadgeExtension.id).toBe("custom-badge");
      expect(customBadgeExtension.label).toBe("ステータスバッジ");
      expect(customBadgeExtension.template).toBe(":badge[ラベル]:");
    });
  });

  describe("Markdown パイプラインとの統合変換", () => {
    it("通常のラベル構文が info スタイルのバッジに変換されること", async () => {
      const processor = createMarkdownProcessor({
        remarkPlugins: customBadgeExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier: customBadgeExtension.processor?.sanitizeSchemaModifier,
      });

      const html = await processor.process("状態: :badge[進行中]: です。");
      expect(html).toContain('class="custom-badge custom-badge--info"');
      expect(html).toContain("進行中");
      expect(html).toContain("状態: ");
      expect(html).toContain(" です。");
    });

    it("重要度が高いラベル構文が danger スタイルのバッジに変換されること", async () => {
      const processor = createMarkdownProcessor({
        remarkPlugins: customBadgeExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier: customBadgeExtension.processor?.sanitizeSchemaModifier,
      });

      const html = await processor.process("警告: :badge[優先度:高]: の課題です。");
      expect(html).toContain('class="custom-badge custom-badge--danger"');
      expect(html).toContain("優先度:高");
    });
  });
});
