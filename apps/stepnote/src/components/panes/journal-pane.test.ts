import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { JournalPane } from "./journal-pane.js";

/**
 * 【JournalPane 仕様 (作業記録・履歴 第5ペインコンテナ)】
 *
 * 1. ペイン基本構造とヘッダー描画
 *    - 1-1. ルート要素 .journal-pane がレンダリングされること
 *    - 1-2. ヘッダー部 (.journal-pane__header) が存在し、タイトルとして「JOURNAL」(.journal-pane__title) が表示されること
 *
 * 2. タブ領域 (wa-tab-group) の描画
 *    - 2-1. wa-tab-group 内に Notes, Logs の順で2つのタブ (wa-tab) が存在し、Issues タブが存在しないこと
 *    - 2-2. issues パネルおよび issues-view コンポーネントが存在しないこと
 *    - 2-3. notes パネル (wa-tab-panel[name="notes"]) 内に notes-view コンポーネントが存在すること
 *    - 2-4. logs パネル (wa-tab-panel[name="logs"]) 内に logs-view コンポーネントが存在すること
 *    - 2-5. wa-tab-group に active 属性がバインドされ、初期値が 'notes' であること
 *    - 2-6. handleTabShow 呼び出しにより activeTab プロパティが更新されること
 *    - 2-7. notes-view および logs-view に theme が伝播されること
 *
 * 3. BEM設計およびSCSSスタイルの検証
 *    - 3-1. SCSSスタイルシート (journal-pane.scss) が存在し、ルートブロック .journal-pane および主要BEMセレクタが定義されていること
 *    - 3-2. テーマ切替トランジション等のCSS変数指定 (@include theme-transition) が定義されていること
 *    - 3-3. journal-pane.scss に !important 宣言が一切含まれていないこと
 *    - 3-4. journal-pane.scss に @extend が一切含まれていないこと
 *    - 3-5. journal-pane.scss 全体においてハードコードされたカラーコードが 0 件であること
 *    - 3-6. journal-pane.scss において .journal-pane__tab-group に flex: 1, min-height: 0 が設定されていること
 *    - 3-7. journal-pane.scss において .journal-pane__tab-panel がデフォルトで display: none となり、&[active] にのみ display: flex が指定されていること
 *    - 3-8. テンプレートおよびSCSSから旧クラス名（pane-journal*）が完全に排除されていること
 */
describe("JournalPane Component", () => {
  let element: JournalPane;

  beforeEach(() => {
    element = new JournalPane();
  });

  describe("1. ペイン基本構造とヘッダー描画", () => {
    it("1-1. ルート要素 .journal-pane がレンダリングされること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain('class="journal-pane"');
    });

    it("1-2. ヘッダー部 (.journal-pane__header) が存在し、タイトルとして「JOURNAL」が表示されること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain('class="journal-pane__header"');
      expect(htmlStr).toContain('class="journal-pane__title"');
      expect(htmlStr).toContain("JOURNAL");
    });
  });

  describe("2. タブ領域 (wa-tab-group) の描画", () => {
    it("2-1. wa-tab-group 内に Notes, Logs の順で2つのタブが存在し、Issues タブが存在しないこと", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain("wa-tab-group");
      expect(htmlStr).toContain('class="journal-pane__tab-group"');

      const notesTabMatch = htmlStr.indexOf('panel="notes"');
      const logsTabMatch = htmlStr.indexOf('panel="logs"');
      const issuesTabMatch = htmlStr.indexOf('panel="issues"');

      expect(notesTabMatch).toBeGreaterThan(-1);
      expect(logsTabMatch).toBeGreaterThan(-1);
      expect(issuesTabMatch).toBe(-1);
      expect(notesTabMatch).toBeLessThan(logsTabMatch);

      expect(htmlStr).toContain(">Notes</wa-tab>");
      expect(htmlStr).toContain(">Logs</wa-tab>");
      expect(htmlStr).not.toContain(">Issues</wa-tab>");
    });

    it("2-2. issues パネルおよび issues-view コンポーネントが存在しないこと", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).not.toContain('name="issues"');
      expect(htmlStr).not.toContain("<issues-view");
    });

    it("2-3. notes パネル (wa-tab-panel[name=\"notes\"]) 内に notes-view コンポーネントが存在すること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain('<wa-tab-panel name="notes"');
      expect(htmlStr).toContain("<notes-view");
    });

    it("2-4. logs パネル (wa-tab-panel[name=\"logs\"]) 内に logs-view コンポーネントが存在すること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain('<wa-tab-panel name="logs"');
      expect(htmlStr).toContain("<logs-view");
    });

    it("2-5. wa-tab-group に active 属性がバインドされ、現在の activeTab（初期値 'notes'）と連動していること", () => {
      expect(element.activeTab).toBe("notes");

      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toMatch(/<wa-tab-group[^>]*\bactive=["']?notes["']?/);

      element.activeTab = "logs";
      const logsHtml = flattenTemplate(element.render());
      expect(logsHtml).toMatch(/<wa-tab-group[^>]*\bactive=["']?logs["']?/);
    });

    it("2-6. handleTabShow 呼び出しにより activeTab プロパティが更新されること", () => {
      expect(element.activeTab).toBe("notes");

      element.handleTabShow(
        new CustomEvent("wa-tab-show", {
          detail: { name: "logs" },
        }) as unknown as CustomEvent<{ name: string }>,
      );

      expect(element.activeTab).toBe("logs");
    });

    it("2-7. notes-view および logs-view に theme が伝播（.theme=${this.theme} および data-theme）されること", () => {
      element.theme = "dark";
      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toMatch(/<notes-view[^>]*\.theme=["']?dark["']?/);
      expect(htmlStr).toMatch(/<notes-view[^>]*data-theme=["']?dark["']?/);
      expect(htmlStr).toMatch(/<logs-view[^>]*\.theme=["']?dark["']?/);
      expect(htmlStr).toMatch(/<logs-view[^>]*data-theme=["']?dark["']?/);
    });
  });

  describe("3. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "journal-pane.scss");
    let scssContent = "";

    beforeEach(() => {
      if (fs.existsSync(scssPath)) {
        scssContent = fs.readFileSync(scssPath, "utf-8");
      }
    });

    it("3-1. SCSSスタイルシートが存在し、ルートブロックおよび主要BEMセレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      expect(scssContent).toMatch(/\.journal-pane\s*\{/);
      expect(scssContent).toMatch(/\.journal-pane__header\s*\{/);
      expect(scssContent).toMatch(/\.journal-pane__title\s*\{/);
      expect(scssContent).toMatch(/\.journal-pane__tab-group\s*\{/);
      expect(scssContent).toMatch(/\.journal-pane__tab-panel\s*\{/);
    });

    it("3-2. テーマ切替トランジション等のCSS変数指定 (@include theme-transition) が定義されていること", () => {
      expect(scssContent).toContain("@include theme-transition;");
    });

    it("3-3. journal-pane.scss に !important 宣言が一切含まれていないこと", () => {
      expect(scssContent).not.toMatch(/!important/);
    });

    it("3-4. journal-pane.scss に @extend が一切含まれていないこと", () => {
      expect(scssContent).not.toMatch(/@extend/);
    });

    it("3-5. journal-pane.scss 全体においてハードコードされたカラーコードが 0 件であること", () => {
      const hexPattern = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/;
      const rgbPattern = /\brgba?\s*\(/;
      expect(scssContent).not.toMatch(hexPattern);
      expect(scssContent).not.toMatch(rgbPattern);
    });

    it("3-6. journal-pane.scss において .journal-pane__tab-group に flex: 1, min-height: 0 が設定されていること", () => {
      expect(scssContent).toMatch(
        /\.journal-pane__tab-group\s*\{[\s\S]*?flex:\s*1;[\s\S]*?min-height:\s*0;/,
      );
    });

    it("3-7. journal-pane.scss において .journal-pane__tab-panel がデフォルトで display: none となり、&[active] にのみ display: flex が指定されていること", () => {
      expect(scssContent).toMatch(
        /\.journal-pane__tab-panel\s*\{[\s\S]*?display:\s*none;[\s\S]*?&\[active\]\s*\{[\s\S]*?display:\s*flex;/,
      );
    });

    it("3-8. テンプレートおよびSCSSから旧クラス名（pane-journal*）が完全に排除されていること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).not.toContain("pane-journal__");
      expect(htmlStr).not.toContain('class="pane-journal"');

      expect(scssContent).not.toMatch(/\.pane-journal\b/);
    });
  });
});
