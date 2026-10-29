/**
 * calloutExtension 単体テスト仕様
 *
 * 1. 拡張機能定義の整合性
 *   - id が "callout" であり、label および template が正しく定義されていること
 *   - subItems に 5 種類（info, check, gear, warn, alert）のバリエーションが正しく定義されていること
 * 2. キーワード（info, check, gear, warn, alert）に応じた variant と icon の変換
 *   - "/// info" が variant="brand", size="m", circle-info-solid-full の wa-callout に変換されること
 *   - "/// check" が variant="success", size="m", circle-check-solid-full の wa-callout に変換されること
 *   - "/// gear" が variant="neutral", size="m", gear-solid-full の wa-callout に変換されること
 *   - "/// warn" が variant="warning", size="m", triangle-exclamation-solid-full の wa-callout に変換されること
 *   - "/// alert" が variant="danger", size="m", circle-exclamation-solid-full の wa-callout に変換されること
 * 3. 記法バリエーションとフォールバック
 *   - 大文字や前後の空白を含む記法（例: "///  INFO  "）でも正しく認識されること
 *   - 未知のキーワード（例: "/// unknown"）の場合はフォールバック（brand / circle-info-solid-full）となること
 * 4. 内部コンテンツおよび前後テキストの保持・Markdownパース
 *   - コールアウト内部の複数行テキストおよび太字などのインライン構文が正しく展開されること
 *   - コールアウトブロックの前後に文章が存在しても欠損せず保持されること
 * 5. サニタイズ（XSS耐性）の安全性
 *   - wa-callout および wa-icon の安全な属性が許可され、不正なタグやスクリプトが除去されること
 */

import { describe, it, expect } from "vitest";
import { calloutExtension } from "./callout.extension.js";
import { createMarkdownProcessor } from "../pipeline/markdown-processor.js";

describe("calloutExtension", () => {
  describe("1. 拡張機能定義の整合性", () => {
    it("id, label, template, toolbarItem が正しく設定されていること", () => {
      expect(calloutExtension.id).toBe("callout");
      expect(calloutExtension.label).toBe("コールアウト");
      expect(calloutExtension.template).toContain("/// info");
      expect(calloutExtension.template).toContain("///");
      expect(calloutExtension.toolbarItem?.icon).toBeDefined();
    });

    it("subItems に 5 種類（info, check, gear, warn, alert）のバリエーションが定義されていること", () => {
      const subItems = (calloutExtension as { subItems?: Array<{ id: string; label: string; icon: string; template: string }> }).subItems;
      expect(subItems).toBeDefined();
      expect(subItems).toHaveLength(5);

      const ids = subItems?.map((s) => s.id);
      expect(ids).toEqual(["info", "check", "gear", "warn", "alert"]);

      const infoSub = subItems?.find((s) => s.id === "info");
      expect(infoSub?.label).toContain("Info");
      expect(infoSub?.icon).toBe("circle-info-solid-full");
      expect(infoSub?.template).toBe("/// info\n\n///");

      const checkSub = subItems?.find((s) => s.id === "check");
      expect(checkSub?.label).toContain("Check");
      expect(checkSub?.icon).toBe("circle-check-solid-full");
      expect(checkSub?.template).toBe("/// check\n\n///");

      const gearSub = subItems?.find((s) => s.id === "gear");
      expect(gearSub?.label).toContain("Gear");
      expect(gearSub?.icon).toBe("gear-solid-full");
      expect(gearSub?.template).toBe("/// gear\n\n///");

      const warnSub = subItems?.find((s) => s.id === "warn");
      expect(warnSub?.label).toContain("Warn");
      expect(warnSub?.icon).toBe("triangle-exclamation-solid-full");
      expect(warnSub?.template).toBe("/// warn\n\n///");

      const alertSub = subItems?.find((s) => s.id === "alert");
      expect(alertSub?.label).toContain("Alert");
      expect(alertSub?.icon).toBe("circle-exclamation-solid-full");
      expect(alertSub?.template).toBe("/// alert\n\n///");
    });
  });

  describe("2. キーワードに応じた variant と icon の変換", () => {
    const createProcessor = () =>
      createMarkdownProcessor({
        remarkPlugins: calloutExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier:
          calloutExtension.processor?.sanitizeSchemaModifier,
      });

    it("/// info が variant='brand', size='m', circle-info-solid-full に変換されること", async () => {
      const processor = createProcessor();
      const markdown = ["/// info", "情報メッセージ", "///"].join("\n");
      const html = await processor.process(markdown);

      expect(html).toContain("<wa-callout");
      expect(html).toContain('variant="brand"');
      expect(html).toContain('size="m"');
      expect(html).toContain(
        '<wa-icon library="my-icons" name="circle-info-solid-full" slot="icon"></wa-icon>',
      );
      expect(html).toContain("情報メッセージ");
    });

    it("/// check が variant='success', size='m', circle-check-solid-full に変換されること", async () => {
      const processor = createProcessor();
      const markdown = ["/// check", "完了しました", "///"].join("\n");
      const html = await processor.process(markdown);

      expect(html).toContain('variant="success"');
      expect(html).toContain('size="m"');
      expect(html).toContain(
        '<wa-icon library="my-icons" name="circle-check-solid-full" slot="icon"></wa-icon>',
      );
      expect(html).toContain("完了しました");
    });

    it("/// gear が variant='neutral', size='m', gear-solid-full に変換されること", async () => {
      const processor = createProcessor();
      const markdown = ["/// gear", "設定項目", "///"].join("\n");
      const html = await processor.process(markdown);

      expect(html).toContain('variant="neutral"');
      expect(html).toContain('size="m"');
      expect(html).toContain(
        '<wa-icon library="my-icons" name="gear-solid-full" slot="icon"></wa-icon>',
      );
      expect(html).toContain("設定項目");
    });

    it("/// warn が variant='warning', size='m', triangle-exclamation-solid-full に変換されること", async () => {
      const processor = createProcessor();
      const markdown = ["/// warn", "ご注意ください", "///"].join("\n");
      const html = await processor.process(markdown);

      expect(html).toContain('variant="warning"');
      expect(html).toContain('size="m"');
      expect(html).toContain(
        '<wa-icon library="my-icons" name="triangle-exclamation-solid-full" slot="icon"></wa-icon>',
      );
      expect(html).toContain("ご注意ください");
    });

    it("/// alert が variant='danger', size='m', circle-exclamation-solid-full に変換されること", async () => {
      const processor = createProcessor();
      const markdown = ["/// alert", "重大なエラー", "///"].join("\n");
      const html = await processor.process(markdown);

      expect(html).toContain('variant="danger"');
      expect(html).toContain('size="m"');
      expect(html).toContain(
        '<wa-icon library="my-icons" name="circle-exclamation-solid-full" slot="icon"></wa-icon>',
      );
      expect(html).toContain("重大なエラー");
    });
  });

  describe("3. 記法バリエーションとフォールバック", () => {
    const createProcessor = () =>
      createMarkdownProcessor({
        remarkPlugins: calloutExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier:
          calloutExtension.processor?.sanitizeSchemaModifier,
      });

    it("大文字や前後の空白を含む記法（例: '///  INFO  '）でも正しく brand に変換されること", async () => {
      const processor = createProcessor();
      const markdown = ["///   INFO   ", "大文字テスト", "///"].join("\n");
      const html = await processor.process(markdown);

      expect(html).toContain('variant="brand"');
      expect(html).toContain('name="circle-info-solid-full"');
      expect(html).toContain("大文字テスト");
    });

    it("未知のキーワードの場合はフォールバック（brand / circle-info-solid-full）となること", async () => {
      const processor = createProcessor();
      const markdown = ["/// unknownType", "未知のタイプ", "///"].join("\n");
      const html = await processor.process(markdown);

      expect(html).toContain('variant="brand"');
      expect(html).toContain('name="circle-info-solid-full"');
      expect(html).toContain("未知のタイプ");
    });
  });

  describe("4. 内部コンテンツおよび前後テキストの保持・Markdownパース", () => {
    const createProcessor = () =>
      createMarkdownProcessor({
        remarkPlugins: calloutExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier:
          calloutExtension.processor?.sanitizeSchemaModifier,
      });

    it("内部の複数行テキストおよび太字などの Markdown が正しく変換されること", async () => {
      const processor = createProcessor();
      const markdown = [
        "/// info",
        "1行目の**太字**テキスト",
        "2行目の`コード`テキスト",
        "///",
      ].join("\n");
      const html = await processor.process(markdown);

      expect(html).toContain("<strong>太字</strong>");
      expect(html).toContain("<code>コード</code>");
    });

    it("コールアウト前後の文章が欠損せず保持されること", async () => {
      const processor = createProcessor();
      const markdown = [
        "前方の段落テキスト",
        "",
        "/// check",
        "コールアウト内容",
        "///",
        "",
        "後方の段落テキスト",
      ].join("\n");
      const html = await processor.process(markdown);

      expect(html).toContain("前方の段落テキスト");
      expect(html).toContain("<wa-callout");
      expect(html).toContain("コールアウト内容");
      expect(html).toContain("後方の段落テキスト");
    });
  });

  describe("5. サニタイズ（XSS耐性）の安全性", () => {
    it("wa-callout 内に不正な script タグや onerror 属性が含まれても除去されること", async () => {
      const processor = createMarkdownProcessor({
        remarkPlugins: calloutExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier:
          calloutExtension.processor?.sanitizeSchemaModifier,
      });

      const maliciousMarkdown = [
        "/// alert",
        '悪意あるコンテンツ <script>alert("xss")</script><img src="x" onerror="alert(1)">',
        "///",
      ].join("\n");
      const html = await processor.process(maliciousMarkdown);

      expect(html).not.toContain("<script>");
      expect(html).not.toContain("onerror");
      expect(html).toContain("<wa-callout");
    });
  });
});
