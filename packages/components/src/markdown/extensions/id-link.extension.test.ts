/**
 * idLinkExtension 単体テスト仕様
 *
 * 1. 拡張機能定義の整合性
 *   - id が "id-link" であり、label および template が正しく定義されていること
 * 2. Markdown パイプラインとの統合変換
 *   - タスクID構文（#{3}{タスク詳細}）が id-link-badge 要素（type="task", item-id="3"）に変換され、"[Task#3] タスク詳細" が描画されること
 *   - IssueID構文（#[4]{課題対応}）が id-link-badge 要素（type="issue", item-id="4"）に変換され、"[Issue#4] 課題対応" が描画されること
 *   - NoteID構文（#(5){設計メモ}）が id-link-badge 要素（type="note", item-id="5") に変換され、"[Note#5] 設計メモ" が描画されること
 *   - プレビューテキストが省略された場合（#{3}）に "[Task#3]" のみ描画されること
 *   - プレビューテキストが空波括弧の場合（#{3}{}）に "[Task#3]" のみ描画されること
 *   - 文中の前後に存在するテキストが欠損せず保持されること
 *   - 同一文内に複数・異なる種類のID構文が混在してもすべて正しく変換されること
 * 3. サニタイズの安全性
 *   - id-link-badge 要素および属性（type, item-id, class, style）がサニタイズで保持されること
 * 4. クリックイベント（id-jump）の発行
 *   - IdLinkBadge 要素のクリック時に bubbles: true, composed: true, detail: { type, id } を持つ id-jump イベントが発火すること
 */

import { describe, it, expect, vi } from "vitest";
import { idLinkExtension, IdLinkBadge } from "./id-link.extension.js";
import { createMarkdownProcessor } from "../pipeline/markdown-processor.js";

describe("idLinkExtension", () => {
  describe("1. 拡張機能定義の整合性", () => {
    it("id, label, template が正しく設定されていること", () => {
      expect(idLinkExtension.id).toBe("id-link");
      expect(idLinkExtension.label).toBe("IDリンク");
      expect(idLinkExtension.template).toBe("#{ID}{テキスト}");
    });
  });

  describe("2. Markdown パイプラインとの統合変換", () => {
    const processor = createMarkdownProcessor({
      remarkPlugins: idLinkExtension.processor?.remarkPlugins,
      sanitizeSchemaModifier: idLinkExtension.processor?.sanitizeSchemaModifier,
    });

    it("タスクID構文（#{3}{タスク詳細}）が正しく変換されること", async () => {
      const html = await processor.process("参照: #{3}{タスク詳細} です。");
      expect(html).toContain("<id-link-badge");
      expect(html).toContain('type="task"');
      expect(html).toContain('item-id="3"');
      expect(html).toContain("[Task#3] タスク詳細");
      expect(html).toContain("参照: ");
      expect(html).toContain(" です。");
    });

    it("IssueID構文（#[4]{課題対応}）が正しく変換されること", async () => {
      const html = await processor.process("関連課題: #[4]{課題対応}");
      expect(html).toContain("<id-link-badge");
      expect(html).toContain('type="issue"');
      expect(html).toContain('item-id="4"');
      expect(html).toContain("[Issue#4] 課題対応");
    });

    it("NoteID構文（#(5){設計メモ}）が正しく変換されること", async () => {
      const html = await processor.process("ノート: #(5){設計メモ}");
      expect(html).toContain("<id-link-badge");
      expect(html).toContain('type="note"');
      expect(html).toContain('item-id="5"');
      expect(html).toContain("[Note#5] 設計メモ");
    });

    it("プレビューテキストが省略された場合（#{3}）にIDのみ描画されること", async () => {
      const html = await processor.process("タスク #{3} を確認");
      expect(html).toContain("<id-link-badge");
      expect(html).toContain('item-id="3"');
      expect(html).toContain("[Task#3]");
      expect(html).not.toContain("[Task#3] ");
    });

    it("プレビューテキストが空波括弧の場合（#{3}{}）にIDのみ描画されること", async () => {
      const html = await processor.process("タスク #{3}{} を確認");
      expect(html).toContain("<id-link-badge");
      expect(html).toContain('item-id="3"');
      expect(html).toContain("[Task#3]");
      expect(html).not.toContain("[Task#3] ");
    });

    it("同一文内に複数種類の構文が混在しても正しく変換されること", async () => {
      const html = await processor.process(
        "タスク #{10}{親タスク} と 課題 #[20] と メモ #(30){確認点}",
      );
      expect(html).toContain('type="task"');
      expect(html).toContain('item-id="10"');
      expect(html).toContain("[Task#10] 親タスク");

      expect(html).toContain('type="issue"');
      expect(html).toContain('item-id="20"');
      expect(html).toContain("[Issue#20]");

      expect(html).toContain('type="note"');
      expect(html).toContain('item-id="30"');
      expect(html).toContain("[Note#30] 確認点");
    });
  });

  describe("3. サニタイズの安全性", () => {
    it("id-link-badge 要素および必須属性がサニタイズを通過すること", async () => {
      const processor = createMarkdownProcessor({
        remarkPlugins: idLinkExtension.processor?.remarkPlugins,
        sanitizeSchemaModifier: idLinkExtension.processor?.sanitizeSchemaModifier,
      });

      const html = await processor.process("#{999}{安全なテスト}");
      expect(html).toContain("<id-link-badge");
      expect(html).toContain('type="task"');
      expect(html).toContain('item-id="999"');
    });
  });

  describe("4. クリックイベント（id-jump）の発行", () => {
    it("IdLinkBadge 要素クリック時に bubbles: true, composed: true, detail を持つ id-jump イベントが発火すること", () => {
      const badge = new IdLinkBadge();
      badge.type = "task";
      badge.itemId = 42;

      const listener = vi.fn();
      badge.addEventListener("id-jump", listener);

      // Node.js 環境でのクリック発火
      badge.handleBadgeClick();

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe("id-jump");
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
      expect(event.detail).toEqual({
        type: "task",
        id: 42,
      });
    });
  });
});

