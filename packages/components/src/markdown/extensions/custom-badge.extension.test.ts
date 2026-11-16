/**
 * customBadgeExtension 単体テスト仕様
 *
 * 1. 拡張機能定義の整合性
 *   - id が "custom-badge" であり、label および template が正しく定義されていること
 *   - description にカラー対応ルール（赤・黄・緑・灰・青のキーワード対応）が明記されていること
 * 2. キーワードに応じたバリアント判定と <wa-badge> 変換
 *   - neutral 系キーワード（保留, 中止, 停止, 無効, 未着手, 未完了, 未対応, 下書き, メモ, 参考）が variant="neutral" の wa-badge に変換されること
 *   - danger 系キーワード（緊急, 至急, 危険, エラー, 障害, 高, 不可）が variant="danger" の wa-badge に変換されること
 *   - warning 系キーワード（重要, 注意, 警告, 要確認, 確認待ち, 要対応, 期限）が variant="warning" の wa-badge に変換されること
 *   - success 系キーワード（完了, 成功, 解決, 承認, 済）が variant="success" の wa-badge に変換されること
 *   - 上記以外のラベル（進行中, 情報 等）がデフォルトの variant="brand" の wa-badge に変換されること
 *   - すべての wa-badge に appearance="filled" および pill 属性が付与されること
 * 3. 判定優先順位と境界ケース
 *   - 「未完了」「未対応」などの否定・未処理ワードが success より優先して variant="neutral" になること
 *   - 「重要・緊急」など複数キーワードを含む場合、danger が warning より優先されること
 *   - 1文中に複数のバッジが存在してもそれぞれ個別に変換され、前後の文章が欠損せず保持されること
 *   - 空ラベル（:badge[]:）は変換されないこと
 * 4. サニタイズの安全性と旧仕様からの移行
 *   - 出力された wa-badge にインライン style 属性や旧 custom-badge クラスが含まれないこと
 *   - sanitizeSchemaModifier が span に style 属性を許可しないこと
 *   - バッジ内にスクリプトや HTML タグが注入されても実行可能な要素として出力されないこと
 */

import { describe, it, expect } from "vitest";
import { customBadgeExtension } from "./custom-badge.extension.js";
import {
  createMarkdownProcessor,
  baseMarkdownSanitizeSchema,
} from "../pipeline/markdown-processor.js";

describe("customBadgeExtension", () => {
  const createBadgeProcessor = () =>
    createMarkdownProcessor({
      remarkPlugins: customBadgeExtension.processor?.remarkPlugins,
      sanitizeSchemaModifier:
        customBadgeExtension.processor?.sanitizeSchemaModifier,
    });

  describe("1. 拡張機能定義の整合性", () => {
    it("id, label, template が正しく設定されていること", () => {
      expect(customBadgeExtension.id).toBe("custom-badge");
      expect(customBadgeExtension.label).toBe("ステータスバッジ");
      expect(customBadgeExtension.template).toBe(":badge[ラベル]:");
    });

    it("description にカラー対応ルールがカラーごとに行分けで分類記述されていること", () => {
      const desc = customBadgeExtension.description ?? "";
      const lines = desc.split("\n");
      expect(lines.length).toBeGreaterThanOrEqual(6);

      const redLine = lines.find((line) => line.startsWith("・赤:"));
      const yellowLine = lines.find((line) => line.startsWith("・黄:"));
      const greenLine = lines.find((line) => line.startsWith("・緑:"));
      const grayLine = lines.find((line) => line.startsWith("・灰:"));
      const blueLine = lines.find((line) => line.startsWith("・青:"));

      expect(redLine).toContain("緊急");
      expect(redLine).toContain("高");
      expect(yellowLine).toContain("重要");
      expect(yellowLine).toContain("注意");
      expect(greenLine).toContain("完了");
      expect(greenLine).toContain("成功");
      expect(grayLine).toContain("保留");
      expect(grayLine).toContain("未完了");
      expect(blueLine).toBeDefined();
    });
  });

  describe("2. キーワードに応じたバリアント判定と <wa-badge> 変換", () => {
    it.each([
      "保留",
      "中止",
      "停止",
      "無効",
      "未着手",
      "未完了",
      "未対応",
      "下書き",
      "メモ",
      "参考",
    ])("neutral 系キーワード「%s」が variant='neutral' の wa-badge に変換されること", async (keyword) => {
      const processor = createBadgeProcessor();
      const html = await processor.process(`状態: :badge[${keyword}]:`);
      expect(html).toMatch(
        new RegExp(
          `<wa-badge[^>]*variant="neutral"[^>]*appearance="filled"[^>]*pill[^>]*>${keyword}</wa-badge>`,
        ),
      );
    });

    it.each([
      "緊急",
      "至急",
      "危険",
      "エラー",
      "障害",
      "優先度:高",
      "不可",
    ])("danger 系キーワード「%s」が variant='danger' の wa-badge に変換されること", async (keyword) => {
      const processor = createBadgeProcessor();
      const html = await processor.process(`警告: :badge[${keyword}]:`);
      expect(html).toMatch(
        new RegExp(
          `<wa-badge[^>]*variant="danger"[^>]*appearance="filled"[^>]*pill[^>]*>${keyword}</wa-badge>`,
        ),
      );
    });

    it.each([
      "重要",
      "注意",
      "警告",
      "要確認",
      "確認待ち",
      "要対応",
      "期限間近",
    ])("warning 系キーワード「%s」が variant='warning' の wa-badge に変換されること", async (keyword) => {
      const processor = createBadgeProcessor();
      const html = await processor.process(`確認: :badge[${keyword}]:`);
      expect(html).toMatch(
        new RegExp(
          `<wa-badge[^>]*variant="warning"[^>]*appearance="filled"[^>]*pill[^>]*>${keyword}</wa-badge>`,
        ),
      );
    });

    it.each(["完了", "成功", "解決", "承認", "対応済"])(
      "success 系キーワード「%s」が variant='success' の wa-badge に変換されること",
      async (keyword) => {
        const processor = createBadgeProcessor();
        const html = await processor.process(`結果: :badge[${keyword}]:`);
        expect(html).toMatch(
          new RegExp(
            `<wa-badge[^>]*variant="success"[^>]*appearance="filled"[^>]*pill[^>]*>${keyword}</wa-badge>`,
          ),
        );
      },
    );

    it("該当キーワードを含まないラベルがデフォルトの variant='brand' に変換されること", async () => {
      const processor = createBadgeProcessor();
      const html = await processor.process("状態: :badge[進行中]: です。");
      expect(html).toMatch(
        /<wa-badge[^>]*variant="brand"[^>]*appearance="filled"[^>]*pill[^>]*>進行中<\/wa-badge>/,
      );
      expect(html).toContain("状態: ");
      expect(html).toContain(" です。");
    });
  });

  describe("3. 判定優先順位と境界ケース", () => {
    it("「未完了」や「未対応」のように完了を含む否定表現でも neutral が優先されること", async () => {
      const processor = createBadgeProcessor();
      const html = await processor.process(":badge[未完了タスク]:");
      expect(html).toContain('variant="neutral"');
      expect(html).not.toContain('variant="success"');
    });

    it("「重要・緊急」のように danger と warning を併記した場合は danger が優先されること", async () => {
      const processor = createBadgeProcessor();
      const html = await processor.process(":badge[重要・緊急]:");
      expect(html).toContain('variant="danger"');
      expect(html).not.toContain('variant="warning"');
    });

    it("1文中に複数バッジがあっても個別に変換され、前後テキストが保持されること", async () => {
      const processor = createBadgeProcessor();
      const html = await processor.process(
        "前文 :badge[完了]: 中間 :badge[注意]: 後文",
      );
      expect(html).toContain("前文 ");
      expect(html).toContain('variant="success"');
      expect(html).toContain(" 中間 ");
      expect(html).toContain('variant="warning"');
      expect(html).toContain(" 後文");
    });

    it("空ラベル（:badge[]:）は変換されずテキストのまま保持されること", async () => {
      const processor = createBadgeProcessor();
      const html = await processor.process("空: :badge[]:");
      expect(html).not.toContain("<wa-badge");
      expect(html).toContain(":badge[]:");
    });
  });

  describe("4. サニタイズの安全性と旧仕様からの移行", () => {
    it("出力にインライン style 属性や旧 custom-badge クラスが含まれないこと", async () => {
      const processor = createBadgeProcessor();
      const html = await processor.process(":badge[優先度:高]: :badge[通常]:");
      expect(html).not.toContain("style=");
      expect(html).not.toContain("custom-badge");
    });

    it("sanitizeSchemaModifier が span に style 属性を許可しないこと", () => {
      const modified =
        customBadgeExtension.processor?.sanitizeSchemaModifier?.(
          baseMarkdownSanitizeSchema,
        );
      expect(modified?.attributes?.span ?? []).not.toContain("style");
      expect(modified?.tagNames ?? []).toContain("wa-badge");
      expect(modified?.attributes?.["wa-badge"]).toEqual(
        expect.arrayContaining(["variant", "appearance", "pill"]),
      );
    });

    it("バッジ内にスクリプトや HTML タグが注入されても無害化されること", async () => {
      const processor = createBadgeProcessor();
      const scriptHtml = await processor.process(
        ':badge[<script>alert("xss")</script>重要]:',
      );
      expect(scriptHtml).not.toContain("<script");

      const tagHtml = await processor.process(":badge[<b>重要</b>]:");
      expect(tagHtml).not.toContain("<b>");

      const escapedHtml = await processor.process(":badge[a < b & 重要]:");
      expect(escapedHtml).toContain('variant="warning"');
      expect(escapedHtml).toContain("a &#x3C; b &#x26; 重要");
    });
  });
});
