/**
 * MarkdownProcessor 単体テスト仕様
 *
 * 1. 基本的な Markdown 変換
 *   - 見出し、段落、リスト、強調（太字・斜体）が正しく HTML に変換されること
 * 2. GFM (GitHub Flavored Markdown) 拡張構文のサポート
 *   - テーブル記法が <table>, <thead>, <tbody>, <tr>, <th>, <td> に変換されること
 *   - タスクリスト（チェックボックス記法）が input[type="checkbox"] に変換されること
 *   - 取り消し線（~~text~~）が <del> タグに変換されること
 *   - 自動リンク記法（URL直書き）が <a> タグに変換されること
 * 3. セキュリティとサニタイズ（XSS防御）
 *   - <script> タグが完全に除去されること
 *   - onerror や onload などの危険なインラインイベントハンドラが除去されること
 *   - javascript: スキームの危険なリンクが除去または無効化されること
 * 4. サニタイズスキーマの拡張（カスタマイズ機能）
 *   - sanitizeSchemaModifier で許可したカスタムタグや属性がサニタイズを通過して出力されること
 * 5. プラグイン注入による拡張性（Open-Closed Principle）
 *   - 外部から注入した remark プラグインが MDAST レベルで適用されること
 *   - 外部から注入した rehype プラグインが HAST レベルで適用されること
 */

import { describe, it, expect } from "vitest";
import { createMarkdownProcessor } from "./markdown-processor.js";
import type { Plugin } from "unified";
import type { Root as MdastRoot, Heading, Text, Node } from "mdast";
import type { Root as HastRoot, Element } from "hast";
import { visit } from "unist-util-visit";

describe("MarkdownProcessor", () => {
  describe("基本的な Markdown 変換", () => {
    it("見出し、段落、リスト、強調が正しく HTML に変換されること", async () => {
      const processor = createMarkdownProcessor();
      const markdown = `
# 見出し1
## 見出し2

これは段落です。**太字**と*斜体*を含みます。

- リスト項目1
- リスト項目2
      `.trim();

      const html = await processor.process(markdown);

      expect(html).toContain("<h1>見出し1</h1>");
      expect(html).toContain("<h2>見出し2</h2>");
      expect(html).toContain("<p>これは段落です。<strong>太字</strong>と<em>斜体</em>を含みます。</p>");
      expect(html).toContain("<ul>");
      expect(html).toContain("<li>リスト項目1</li>");
      expect(html).toContain("<li>リスト項目2</li>");
    });
  });

  describe("GFM (GitHub Flavored Markdown) 拡張構文のサポート", () => {
    it("テーブル記法が正しく HTML テーブル要素に変換されること", async () => {
      const processor = createMarkdownProcessor();
      const markdown = `
| 見出しA | 見出しB |
| :--- | :--- |
| データ1 | データ2 |
      `.trim();

      const html = await processor.process(markdown);

      expect(html).toContain("<table>");
      expect(html).toContain("<thead>");
      expect(html).toContain("<tbody>");
      expect(html).toContain("見出しA</th>");
      expect(html).toContain("データ1</td>");
    });

    it("タスクリスト記法がチェックボックスに変換されること", async () => {
      const processor = createMarkdownProcessor();
      const markdown = `
- [ ] 未完了タスク
- [x] 完了タスク
      `.trim();

      const html = await processor.process(markdown);

      expect(html).toContain('type="checkbox"');
      expect(html).toContain("未完了タスク");
      expect(html).toContain("完了タスク");
      expect(html).toContain("checked");
    });

    it("取り消し線記法が del タグに変換されること", async () => {
      const processor = createMarkdownProcessor();
      const markdown = "~~古いテキスト~~ 新しいテキスト";

      const html = await processor.process(markdown);

      expect(html).toContain("<del>古いテキスト</del>");
      expect(html).toContain("新しいテキスト");
    });

    it("自動リンク記法が a タグに変換されること", async () => {
      const processor = createMarkdownProcessor();
      const markdown = "詳細は https://example.com を参照してください。";

      const html = await processor.process(markdown);

      expect(html).toContain('<a href="https://example.com"');
      expect(html).toContain(">https://example.com</a>");
    });
  });

  describe("セキュリティとサニタイズ（XSS防御）", () => {
    it("script タグが完全に除去されること", async () => {
      const processor = createMarkdownProcessor();
      const malicious = 'Hello <script>alert("xss")</script> World';

      const html = await processor.process(malicious);

      expect(html).not.toContain("<script>");
      expect(html).not.toContain("</script>");
    });

    it("危険なインラインイベントハンドラが除去されること", async () => {
      const processor = createMarkdownProcessor();
      const malicious = '<img src="invalid.jpg" onerror="alert(1)">';

      const html = await processor.process(malicious);

      expect(html).not.toContain("onerror");
      expect(html).not.toContain("alert");
    });

    it("javascript: スキームの危険なリンクが除去されること", async () => {
      const processor = createMarkdownProcessor();
      const malicious = '[危険なリンク](javascript:alert("xss"))';

      const html = await processor.process(malicious);

      expect(html).not.toContain("javascript:");
      expect(html).not.toContain('href="javascript:');
    });
  });

  describe("サニタイズスキーマの拡張（カスタマイズ機能）", () => {
    it("sanitizeSchemaModifier で許可したカスタムタグや属性が保持されること", async () => {
      // 独自構文ノードを生成する remark プラグイン
      const remarkCustomBadgePlugin: Plugin<[], MdastRoot> = () => {
        return (tree) => {
          visit(tree, "text", (node: Text, index, parent) => {
            if (node.value.includes(":badge[重要]:") && parent && typeof index === "number") {
              const customNode: Node & { data: Record<string, unknown>; children: unknown[] } = {
                type: "customBadge",
                data: {
                  hName: "custom-badge",
                  hProperties: { type: "info", variant: "solid" },
                },
                children: [{ type: "text", value: "重要" }],
              };
              parent.children.splice(index, 1, customNode as any);
            }
          });
        };
      };

      const processor = createMarkdownProcessor({
        remarkPlugins: [remarkCustomBadgePlugin],
        sanitizeSchemaModifier: (baseSchema) => {
          const schema = JSON.parse(JSON.stringify(baseSchema));
          schema.tagNames = [...(schema.tagNames || []), "custom-badge"];
          schema.attributes = {
            ...(schema.attributes || {}),
            "custom-badge": ["type", "variant"],
          };
          return schema;
        },
      });

      const markdown = "タグ: :badge[重要]:";
      const html = await processor.process(markdown);

      expect(html).toContain('<custom-badge type="info" variant="solid">重要</custom-badge>');
    });
  });

  describe("プラグイン注入による拡張性（Open-Closed Principle）", () => {
    it("外部から注入した remark プラグインが MDAST レベルで適用されること", async () => {
      // 見出しのテキスト末尾に " [検証済み]" を付与するテスト用 remark プラグイン
      const remarkCustomPlugin: Plugin<[], MdastRoot> = () => {
        return (tree) => {
          visit(tree, "heading", (node: Heading) => {
            const firstChild = node.children[0];
            if (firstChild && firstChild.type === "text") {
              firstChild.value += " [検証済み]";
            }
          });
        };
      };

      const processor = createMarkdownProcessor({
        remarkPlugins: [remarkCustomPlugin],
      });

      const markdown = "# 機能概要";
      const html = await processor.process(markdown);

      expect(html).toContain("<h1>機能概要 [検証済み]</h1>");
    });

    it("外部から注入した rehype プラグインが HAST レベルで適用されること", async () => {
      // すべての段落 p に class="markdown-paragraph" を付与するテスト用 rehype プラグイン
      const rehypeCustomPlugin: Plugin<[], HastRoot> = () => {
        return (tree) => {
          visit(tree, "element", (node: Element) => {
            if (node.tagName === "p") {
              node.properties = {
                ...(node.properties || {}),
                className: ["markdown-paragraph"],
              };
            }
          });
        };
      };

      const processor = createMarkdownProcessor({
        rehypePlugins: [rehypeCustomPlugin],
      });

      const markdown = "段落のテキストです。";
      const html = await processor.process(markdown);

      expect(html).toContain('<p class="markdown-paragraph">段落のテキストです。</p>');
    });
  });
});
