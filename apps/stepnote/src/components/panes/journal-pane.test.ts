import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { TaskRecord } from "@/db/models/task.model.js";
import type { TaskController } from "@/controllers/task.controller.js";
import type { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import { JournalPane } from "./journal-pane.js";

/**
 * 【JournalPane 仕様 (作業記録・履歴 第5ペインコンテナ)】
 *
 * 1. タスク未選択状態（Empty State）の描画
 *    - 1-1. taskController.state が未定義かつ activeTab が 'logs' の場合、Logs パネル内に空状態（.journal-pane__empty）および案内メッセージが表示されること
 *    - 1-2. taskController.state が未定義であっても、ヘッダー（.journal-pane__header）およびタブ群（wa-tab-group）がレンダリングされ、Scratch タブへの切り替えが可能であること
 *    - 1-3. taskController.state が未定義であっても、activeTab が 'scratch' の場合は Scratch パネル（notes-view）がレンダリングされること
 *
 * 2. ペイン基本構造とヘッダー描画（タスク選択時）
 *    - 2-1. ルート要素 .journal-pane がレンダリングされること
 *    - 2-2. ヘッダー部 (.journal-pane__header) が存在し、タイトルとして「JOURNAL」(.journal-pane__title) が表示されること
 *    - 2-3. ヘッダー部 (.journal-pane__header) 内に右端アクション領域（.journal-pane__actions）、開閉トグルボタン（wa-button[class*='journal-pane__toggle-btn']）、ツールチップ（wa-tooltip）、および chevron-right アイコンがレンダリングされること
 *    - 2-4. isJournalAreaOpen が true（開状態）の際、アイコンに is-open クラスが付与され、ツールチップが「ジャーナルを閉じる」となること
 *    - 2-5. isJournalAreaOpen が false（閉・縮小状態）の際、アイコンに is-closed クラスが付与され、ツールチップが「ジャーナルを開く」となること
 *    - 2-6. isJournalAreaOpen が false（閉・縮小状態）の際、ルート要素に journal-pane--collapsed クラスが付与され、タイトルおよびタブ群がレンダリングされないこと
 *    - 2-7. トグルボタンのクリック（または handleToggleJournalArea の呼び出し）により layoutUIController.toggleJournalArea が呼び出されること
 *
 * 3. タブ領域 (wa-tab-group) の描画
 *    - 3-1. wa-tab-group 内に Logs タブおよび Scratch タブが存在し、Notes タブや Issues タブが存在しないこと
 *    - 3-2. issues パネルおよび issues-view コンポーネントが存在しないこと
 *    - 3-3. scratch パネル (wa-tab-panel[name="scratch"]) 内に notes-view コンポーネントが存在し、.showTabId=${false} および .controller がバインドされていること
 *    - 3-4. logs パネル (wa-tab-panel[name="logs"]) 内に logs-view コンポーネントが存在し、theme が伝播されること
 *    - 3-5. wa-tab-group に active 属性がバインドされ、初期値が 'logs' であること
 *    - 3-6. handleTabShow 呼び出しにより activeTab プロパティが 'logs' または 'scratch' で更新されること
 *    - 3-7. handleTabShow 呼び出し時に、切り替え先の子コンポーネントの resetModesToPreview が呼び出されること
 *    - 3-8. 無効なタブ名（子孫コンポーネントのタブIDや 'notes' 等）で handleTabShow が呼び出された場合、activeTab が更新されず、子コンポーネントの resetModesToPreview も呼び出されないこと
 *
 * 4. BEM設計およびSCSSスタイルの検証
 *    - 4-1. SCSSスタイルシート (journal-pane.scss) が存在し、ルートブロック .journal-pane および主要BEMセレクタ（.journal-pane__empty等）が定義されていること
 *    - 4-2. テーマ切替トランジション等のCSS変数指定 (@include theme-transition) が定義されていること
 *    - 4-3. journal-pane.scss に !important 宣言が一切含まれていないこと
 *    - 4-4. journal-pane.scss に @extend が一切含まれていないこと
 *    - 4-5. journal-pane.scss 全体においてハードコードされたカラーコードが 0 件であること
 *    - 4-6. journal-pane.scss において .journal-pane__tab-group に flex: 1, min-height: 0 が設定されていること
 *    - 4-7. journal-pane.scss において .journal-pane__tab-panel がデフォルトで display: none となり、&[active] にのみ display: flex が指定されていること
 *    - 4-8. テンプレートおよびSCSSから旧クラス名（pane-journal*）が完全に排除されていること
 *    - 4-9. journal-pane.scss において .journal-pane__toggle-btn, .journal-pane__toggle-icon, .journal-pane--collapsed が定義されていること
 *    - 4-10. journal-pane.scss において .journal-pane__toggle-icon の .is-open に rotate(0deg)、.is-closed に rotate(90deg) が設定されていること
 *    - 4-11. journal-pane.scss において .journal-pane__actions に幅固定（--stepnote-pane-menu-width）、margin-left: auto、flex-shrink: 0 が指定され、縮小時スタイルに justify-content: center が含まれないこと
 */
describe("JournalPane Component", () => {
  let element: JournalPane;
  let mockTaskController: {
    state: TaskRecord | undefined;
    hasTask: boolean;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let mockLayoutUIController: {
    state: {
      isQuickAccessOpen: boolean;
      isNavigationAreaOpen: boolean;
      isNavigationListAreaOpen: boolean;
      isJournalAreaOpen: boolean;
    };
    toggleJournalArea: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let unsubscribeMock: ReturnType<typeof vi.fn>;

  const baseTask: TaskRecord = {
    id: 101,
    name: "新機能の基本設計を策定する",
    statusCode: 0,
    dueDate: new Date("2026-06-15T00:00:00.000Z"),
    contacts: [],
    description: "タスク詳細説明文",
    fiscalYear: 2026,
    labelId: 1,
    bookmark: false,
    selected: true,
  };

  beforeEach(() => {
    unsubscribeMock = vi.fn();
    mockTaskController = {
      state: { ...baseTask },
      hasTask: true,
      subscribe: vi.fn().mockReturnValue(unsubscribeMock),
    };
    mockLayoutUIController = {
      state: {
        isQuickAccessOpen: true,
        isNavigationAreaOpen: true,
        isNavigationListAreaOpen: true,
        isJournalAreaOpen: true,
      },
      toggleJournalArea: vi.fn(),
      subscribe: vi.fn().mockReturnValue(unsubscribeMock),
    };

    element = new JournalPane();
    (element as unknown as { taskController: unknown }).taskController =
      mockTaskController as unknown as TaskController;
    (element as unknown as { layoutUIController: unknown }).layoutUIController =
      mockLayoutUIController as unknown as LayoutUIController;
  });

  describe("1. タスク未選択状態（Empty State）の描画", () => {
    beforeEach(() => {
      mockTaskController.state = undefined;
      mockTaskController.hasTask = false;
    });

    it("1-1. taskController.state が未定義かつ activeTab が 'logs' の場合、Logs パネル内に空状態（.journal-pane__empty）が表示されること", () => {
      element.activeTab = "logs";
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("journal-pane__empty");
      expect(htmlStr).toContain("タスクが選択されていません");
    });

    it("1-2. taskController.state が未定義であっても、ヘッダー（.journal-pane__header）およびタブ群（wa-tab-group）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("journal-pane__header");
      expect(htmlStr).toContain("wa-tab-group");
    });

    it("1-3. taskController.state が未定義であっても、activeTab が 'scratch' の場合は Scratch パネル（notes-view）がレンダリングされること", () => {
      element.activeTab = "scratch";
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("<notes-view");
      expect(htmlStr).toContain('panel="scratch"');
    });
  });

  describe("2. ペイン基本構造とヘッダー描画（タスク選択時）", () => {
    it("2-1. ルート要素 .journal-pane がレンダリングされること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain('class="journal-pane"');
    });

    it("2-2. ヘッダー部 (.journal-pane__header) が存在し、タイトルとして「JOURNAL」が表示されること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain('class="journal-pane__header"');
      expect(htmlStr).toContain('class="journal-pane__title"');
      expect(htmlStr).toContain("JOURNAL");
    });

    it("2-3. ヘッダー部 (.journal-pane__header) 内に右端アクション領域（.journal-pane__actions）、開閉トグルボタン（wa-button[class*='journal-pane__toggle-btn']）、ツールチップ（wa-tooltip）、および chevron-right アイコンがレンダリングされること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain("journal-pane__actions");
      expect(htmlStr).toContain("journal-pane__toggle-btn");
      expect(htmlStr).toContain("wa-tooltip");
      expect(htmlStr).toContain("chevron-right");
    });

    it("2-4. isJournalAreaOpen が true（開状態）の際、アイコンに is-open クラスが付与され、ツールチップが「ジャーナルを閉じる」となること", () => {
      mockLayoutUIController.state.isJournalAreaOpen = true;
      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain("is-open");
      expect(htmlStr).toContain("ジャーナルを閉じる");
    });

    it("2-5. isJournalAreaOpen が false（閉・縮小状態）の際、アイコンに is-closed クラスが付与され、ツールチップが「ジャーナルを開く」となること", () => {
      mockLayoutUIController.state.isJournalAreaOpen = false;
      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain("is-closed");
      expect(htmlStr).toContain("ジャーナルを開く");
    });

    it("2-6. isJournalAreaOpen が false（閉・縮小状態）の際、ルート要素に journal-pane--collapsed クラスが付与され、タイトルおよびタブ群がレンダリングされないこと", () => {
      mockLayoutUIController.state.isJournalAreaOpen = false;
      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain("journal-pane--collapsed");
      expect(htmlStr).not.toContain("journal-pane__title");
      expect(htmlStr).not.toContain("wa-tab-group");
    });

    it("2-7. トグルボタンのクリック（または handleToggleJournalArea の呼び出し）により layoutUIController.toggleJournalArea が呼び出されること", () => {
      (element as unknown as { handleToggleJournalArea: () => void }).handleToggleJournalArea();
      expect(mockLayoutUIController.toggleJournalArea).toHaveBeenCalledTimes(1);
    });
  });

  describe("3. タブ領域 (wa-tab-group) の描画", () => {
    it("3-1. wa-tab-group 内に Logs タブおよび Scratch タブが存在し、Notes タブや Issues タブが存在しないこと", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain("wa-tab-group");
      expect(htmlStr).toContain('class="journal-pane__tab-group"');

      expect(htmlStr).toContain('panel="logs"');
      expect(htmlStr).toContain('panel="scratch"');
      expect(htmlStr).not.toContain('panel="notes"');
      expect(htmlStr).not.toContain('panel="issues"');

      expect(htmlStr).toContain(">Logs</wa-tab>");
      expect(htmlStr).toContain(">Scratch</wa-tab>");
      expect(htmlStr).not.toContain(">Notes</wa-tab>");
      expect(htmlStr).not.toContain(">Issues</wa-tab>");
    });

    it("3-2. issues パネルおよび issues-view コンポーネントが存在しないこと", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).not.toContain('name="issues"');
      expect(htmlStr).not.toContain("<issues-view");
    });

    it("3-3. scratch パネル (wa-tab-panel[name=\"scratch\"]) 内に notes-view コンポーネントが存在し、.showTabId=${false} および .controller がバインドされていること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain('<wa-tab-panel name="scratch"');
      expect(htmlStr).toContain("<notes-view");
      expect(htmlStr).toMatch(/<notes-view[^>]*\.showTabId=["']?false["']?/);
      expect(htmlStr).toContain(".controller=");
    });

    it("3-4. logs パネル (wa-tab-panel[name=\"logs\"]) 内に logs-view コンポーネントが存在し、theme が伝播されること", () => {
      element.theme = "dark";
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain('<wa-tab-panel name="logs"');
      expect(htmlStr).toContain("<logs-view");
      expect(htmlStr).toMatch(/<logs-view[^>]*\.theme=["']?dark["']?/);
      expect(htmlStr).toMatch(/<logs-view[^>]*data-theme=["']?dark["']?/);
    });

    it("3-5. wa-tab-group に active 属性がバインドされ、初期値が 'logs' であること", () => {
      expect(element.activeTab).toBe("logs");

      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toMatch(/<wa-tab-group[^>]*\bactive=["']?logs["']?/);
    });

    it("3-6. handleTabShow 呼び出しにより activeTab プロパティが 'logs' または 'scratch' で更新されること", () => {
      element.activeTab = "logs";

      element.handleTabShow(
        new CustomEvent("wa-tab-show", {
          detail: { name: "scratch" },
        }) as unknown as CustomEvent<{ name: string }>,
      );

      expect(element.activeTab).toBe("scratch");

      element.handleTabShow(
        new CustomEvent("wa-tab-show", {
          detail: { name: "logs" },
        }) as unknown as CustomEvent<{ name: string }>,
      );

      expect(element.activeTab).toBe("logs");
    });

    it("3-7. handleTabShow 呼び出し時に、切り替え先の子コンポーネント（logs-view または notes-view）の resetModesToPreview が呼び出されること", () => {
      const resetLogsSpy = vi.fn();
      const resetNotesSpy = vi.fn();
      Object.defineProperty(element, "renderRoot", {
        value: {
          querySelector: vi.fn((sel: string) => {
            if (sel === "logs-view") return { resetModesToPreview: resetLogsSpy };
            if (sel === "notes-view") return { resetModesToPreview: resetNotesSpy };
            return null;
          }),
        },
        configurable: true,
      });

      element.handleTabShow(
        new CustomEvent("wa-tab-show", { detail: { name: "logs" } }) as unknown as CustomEvent<{ name: string }>,
      );
      expect(resetLogsSpy).toHaveBeenCalledTimes(1);

      element.handleTabShow(
        new CustomEvent("wa-tab-show", { detail: { name: "scratch" } }) as unknown as CustomEvent<{ name: string }>,
      );
      expect(resetNotesSpy).toHaveBeenCalledTimes(1);
    });

    it("3-8. 無効なタブ名（子孫コンポーネントのタブIDや 'notes' 等）で handleTabShow が呼び出された場合、activeTab が更新されず、子コンポーネントの resetModesToPreview も呼び出されないこと", () => {
      const resetLogsSpy = vi.fn();
      Object.defineProperty(element, "renderRoot", {
        value: {
          querySelector: vi.fn((sel: string) => {
            if (sel === "logs-view") return { resetModesToPreview: resetLogsSpy };
            return null;
          }),
        },
        configurable: true,
      });

      expect(element.activeTab).toBe("logs");

      // notes タブや子孫コンポーネントからのイベントを模倣
      element.handleTabShow(
        new CustomEvent("wa-tab-show", { detail: { name: "notes" } }) as unknown as CustomEvent<{ name: string }>,
      );

      // activeTab は変更されず、resetModesToPreview も呼ばれないこと
      expect(element.activeTab).toBe("logs");
      expect(resetLogsSpy).not.toHaveBeenCalled();

      element.handleTabShow(
        new CustomEvent("wa-tab-show", { detail: { name: "203" } }) as unknown as CustomEvent<{ name: string }>,
      );

      expect(element.activeTab).toBe("logs");
      expect(resetLogsSpy).not.toHaveBeenCalled();
    });
  });

  describe("4. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "journal-pane.scss");
    let scssContent = "";

    beforeEach(() => {
      if (fs.existsSync(scssPath)) {
        scssContent = fs.readFileSync(scssPath, "utf-8");
      }
    });

    it("4-1. SCSSスタイルシートが存在し、ルートブロックおよび主要BEMセレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      expect(scssContent).toMatch(/\.journal-pane\s*\{/);
      expect(scssContent).toMatch(/\.journal-pane__empty\s*\{/);
      expect(scssContent).toMatch(/\.journal-pane__header\s*\{/);
      expect(scssContent).toMatch(/\.journal-pane__title\s*\{/);
      expect(scssContent).toMatch(/\.journal-pane__tab-group\s*\{/);
      expect(scssContent).toMatch(/\.journal-pane__tab-panel\s*\{/);
    });

    it("4-2. テーマ切替トランジション等のCSS変数指定 (@include theme-transition) が定義されていること", () => {
      expect(scssContent).toContain("@include theme-transition;");
    });

    it("4-3. journal-pane.scss に !important 宣言が一切含まれていないこと", () => {
      expect(scssContent).not.toMatch(/!important/);
    });

    it("4-4. journal-pane.scss に @extend が一切含まれていないこと", () => {
      expect(scssContent).not.toMatch(/@extend/);
    });

    it("4-5. journal-pane.scss 全体においてハードコードされたカラーコードが 0 件であること", () => {
      const hexPattern = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/;
      const rgbPattern = /\brgba?\s*\(/;
      expect(scssContent).not.toMatch(hexPattern);
      expect(scssContent).not.toMatch(rgbPattern);
    });

    it("4-6. journal-pane.scss において .journal-pane__tab-group に flex: 1, min-height: 0 が設定されていること", () => {
      expect(scssContent).toMatch(
        /\.journal-pane__tab-group\s*\{[\s\S]*?flex:\s*1;[\s\S]*?min-height:\s*0;/,
      );
    });

    it("4-7. journal-pane.scss において .journal-pane__tab-panel がデフォルトで display: none となり、&[active] にのみ display: flex が指定されていること", () => {
      expect(scssContent).toMatch(
        /\.journal-pane__tab-panel\s*\{[\s\S]*?display:\s*none;[\s\S]*?&\[active\]\s*\{[\s\S]*?display:\s*flex;/,
      );
    });

    it("4-8. テンプレートおよびSCSSから旧クラス名（pane-journal*）が完全に排除されていること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).not.toContain("pane-journal__");
      expect(htmlStr).not.toContain('class="pane-journal"');

      expect(scssContent).not.toMatch(/\.pane-journal\b/);
    });

    it("4-9. journal-pane.scss において .journal-pane__toggle-btn, .journal-pane__toggle-icon, .journal-pane--collapsed が定義されていること", () => {
      expect(scssContent).toMatch(/\.journal-pane__toggle-btn\b/);
      expect(scssContent).toMatch(/\.journal-pane__toggle-icon\b/);
      expect(scssContent).toMatch(/\.journal-pane--collapsed\b/);
    });

    it("4-10. journal-pane.scss において .journal-pane__toggle-icon の .is-open に rotate(0deg)、.is-closed に rotate(90deg) が設定されていること", () => {
      expect(scssContent).toMatch(/\.is-open\s*\{[\s\S]*?transform:\s*rotate\(0deg\);/);
      expect(scssContent).toMatch(/\.is-closed\s*\{[\s\S]*?transform:\s*rotate\(90deg\);/);
    });

    it("4-11. journal-pane.scss において .journal-pane__actions に幅固定（--stepnote-pane-menu-width）、margin-left: auto、flex-shrink: 0 が指定され、縮小時スタイルに justify-content: center が含まれないこと", () => {
      expect(scssContent).toMatch(/\.journal-pane__actions\s*\{[\s\S]*?width:\s*var\(--stepnote-pane-menu-width/);
      expect(scssContent).toMatch(/\.journal-pane__actions\s*\{[\s\S]*?margin-left:\s*auto;/);
      expect(scssContent).toMatch(/\.journal-pane__actions\s*\{[\s\S]*?flex-shrink:\s*0;/);
      expect(scssContent).not.toMatch(/\.journal-pane--collapsed[\s\S]*?justify-content:\s*center;/);
    });
  });
});
