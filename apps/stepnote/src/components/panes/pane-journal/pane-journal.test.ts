import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { PaneJournal } from "./pane-journal.js";

/**
 * 【PaneJournal 仕様 (作業記録・履歴 第5ペインコンテナ)】
 *
 * 1. ペイン基本構造とヘッダー描画
 *    - 1-1. ルート要素 .pane-journal がレンダリングされること
 *    - 1-2. ヘッダー部 (.pane-journal__header) が存在し、タイトルとして「JOURNAL」(.pane-journal__title) が表示されること
 *
 * 2. タブ領域 (wa-tab-group) の描画
 *    - 2-1. wa-tab-group 内に Logs, Notes の順で2つのタブ (wa-tab) が存在すること
 *    - 2-2. logs パネル (wa-tab-panel[name="logs"]) 内にプレースホルダー表示 (.pane-journal__placeholder) が存在すること
 *    - 2-3. notes パネル (wa-tab-panel[name="notes"]) 内にプレースホルダー表示 (.pane-journal__placeholder) が存在すること
 *    - 2-4. wa-tab-group に active 属性がバインドされ、初期値が 'logs' であること
 *    - 2-5. handleTabShow 呼び出しにより activeTab プロパティが更新されること
 *
 * 3. BEM設計およびSCSSスタイルの検証
 *    - 3-1. SCSSスタイルシート (pane-journal.scss) が存在し、ルートブロック .pane-journal および主要BEMセレクタが定義されていること
 *    - 3-2. テーマ切替トランジション等のCSS変数指定 (@include theme-transition) が定義されていること
 *    - 3-3. pane-journal.scss に !important 宣言が一切含まれていないこと
 *    - 3-4. pane-journal.scss に @extend が一切含まれていないこと
 *    - 3-5. pane-journal.scss 全体においてハードコードされたカラーコードが 0 件（完全ゼロ）であること
 *    - 3-6. pane-journal.scss において .pane-journal__tab-group に box-sizing: border-box, flex: 1, min-height: 0 が設定されていること
 *    - 3-7. pane-journal.scss において .pane-journal__tab-panel がデフォルトで非表示 (display: none) となり、&[active] にのみ display: flex が指定されていること
 */
describe("PaneJournal Component", () => {
  let element: PaneJournal;

  beforeEach(() => {
    element = new PaneJournal();
  });

  describe("1. ペイン基本構造とヘッダー描画", () => {
    it("1-1. ルート要素 .pane-journal がレンダリングされること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain('class="pane-journal"');
    });

    it("1-2. ヘッダー部 (.pane-journal__header) が存在し、タイトルとして「JOURNAL」が表示されること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain('class="pane-journal__header"');
      expect(htmlStr).toContain('class="pane-journal__title"');
      expect(htmlStr).toContain("JOURNAL");
    });
  });

  describe("2. タブ領域 (wa-tab-group) の描画", () => {
    it("2-1. wa-tab-group 内に Logs, Notes の順で2つのタブが存在すること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain("wa-tab-group");
      expect(htmlStr).toContain('class="pane-journal__tab-group"');

      const logsTabMatch = htmlStr.indexOf('panel="logs"');
      const notesTabMatch = htmlStr.indexOf('panel="notes"');
      expect(logsTabMatch).toBeGreaterThan(-1);
      expect(notesTabMatch).toBeGreaterThan(-1);
      expect(logsTabMatch).toBeLessThan(notesTabMatch);

      expect(htmlStr).toContain(">Logs</wa-tab>");
      expect(htmlStr).toContain(">Notes</wa-tab>");
    });

    it("2-2. logs パネル (wa-tab-panel[name=\"logs\"]) 内にプレースホルダー表示が存在すること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain('<wa-tab-panel name="logs"');
      expect(htmlStr).toContain('class="pane-journal__placeholder"');
      expect(htmlStr).toContain("Logs Content (準備中)");
    });

    it("2-3. notes パネル (wa-tab-panel[name=\"notes\"]) 内にプレースホルダー表示が存在すること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain('<wa-tab-panel name="notes"');
      expect(htmlStr).toContain("Notes Content (準備中)");
    });

    it("2-4. wa-tab-group に active 属性がバインドされ、現在の activeTab（初期値 'logs'）と連動していること", () => {
      expect(element.activeTab).toBe("logs");

      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toMatch(/<wa-tab-group[^>]*\bactive=["']?logs["']?/);

      element.activeTab = "notes";
      const notesHtml = flattenTemplate(element.render());
      expect(notesHtml).toMatch(/<wa-tab-group[^>]*\bactive=["']?notes["']?/);
    });

    it("2-5. handleTabShow 呼び出しにより activeTab プロパティが更新されること", () => {
      expect(element.activeTab).toBe("logs");

      element.handleTabShow(
        new CustomEvent("wa-tab-show", {
          detail: { name: "notes" },
        }) as unknown as CustomEvent<{ name: string }>,
      );

      expect(element.activeTab).toBe("notes");
    });
  });

  describe("3. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "pane-journal.scss");
    let scssContent = "";

    beforeEach(() => {
      if (fs.existsSync(scssPath)) {
        scssContent = fs.readFileSync(scssPath, "utf-8");
      }
    });

    it("3-1. SCSSスタイルシートが存在し、ルートブロックおよび主要BEMセレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      expect(scssContent).toMatch(/\.pane-journal\s*\{/);
      expect(scssContent).toMatch(/\.pane-journal__header\s*\{/);
      expect(scssContent).toMatch(/\.pane-journal__title\s*\{/);
      expect(scssContent).toMatch(/\.pane-journal__tab-group\s*\{/);
      expect(scssContent).toMatch(/\.pane-journal__tab-panel\s*\{/);
      expect(scssContent).toMatch(/\.pane-journal__placeholder\s*\{/);
    });

    it("3-2. テーマ切替トランジション等のCSS変数指定 (@include theme-transition) が定義されていること", () => {
      expect(scssContent).toContain("@include theme-transition;");
    });

    it("3-3. pane-journal.scss に !important 宣言が一切含まれていないこと", () => {
      expect(scssContent).not.toMatch(/!important/);
    });

    it("3-4. pane-journal.scss に @extend が一切含まれていないこと", () => {
      expect(scssContent).not.toMatch(/@extend/);
    });

    it("3-5. pane-journal.scss 全体においてハードコードされたカラーコードが 0 件であること", () => {
      const hexPattern = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/;
      const rgbPattern = /\brgba?\s*\(/;
      expect(scssContent).not.toMatch(hexPattern);
      expect(scssContent).not.toMatch(rgbPattern);
    });

    it("3-6. pane-journal.scss において .pane-journal__tab-group に flex: 1, min-height: 0 が設定されていること", () => {
      expect(scssContent).toMatch(
        /\.pane-journal__tab-group\s*\{[\s\S]*?flex:\s*1;[\s\S]*?min-height:\s*0;/,
      );
    });

    it("3-7. pane-journal.scss において .pane-journal__tab-panel がデフォルトで display: none となり、&[active] にのみ display: flex が指定されていること", () => {
      expect(scssContent).toMatch(
        /\.pane-journal__tab-panel\s*\{[\s\S]*?display:\s*none;[\s\S]*?&\[active\]\s*\{[\s\S]*?display:\s*flex;/,
      );
    });
  });
});
