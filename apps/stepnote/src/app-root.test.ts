import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContextConsumer, type Context } from "@lit/context";
import type { ReactiveControllerHost } from "lit";
import {
  layoutUIContext,
  quickAccessContext,
  labelsContext,
  taskContext,
  logsContext,
  notesContext,
  issuesContext,
} from "@/contexts/index.js";
import { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import { QuickAccessController } from "@/controllers/quick-access.controller.js";
import { LabelsController } from "@/controllers/labels.controller.js";
import { TaskController } from "@/controllers/task.controller.js";
import { LogsController } from "@/controllers/logs.controller.js";
import { NotesController } from "@/controllers/notes.controller.js";
import { IssuesController } from "@/controllers/issues.controller.js";
import { flattenTemplate } from "@shared/utils";
import { AppRoot } from "./app-root.js";

/**
 * 【AppRoot Provider 仕様 (Phase 1)】
 *
 * 1. Controller インスタンスの生成と初期化 (Instantiation)
 *    - [x] 1-1. AppRoot インスタンス生成時、7つの各 Controller (LayoutUI, QuickAccess, Labels, Task, Logs, Notes, Issues) がインスタンス化されていること
 *
 * 2. @lit/context による Context 配給 (Context Provision)
 *    - [x] 2-1. layoutUIContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-2. quickAccessContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-3. labelsContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-4. taskContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-5. logsContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-6. notesContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-7. issuesContext が配下コンポーネントへ正しく配給されること
 *
 * 【AppRoot Layout 仕様 (Phase 2)】
 * 3. 基本レイアウト構造の提供
 *    - [x] 3-1. 5ペインの基本骨格要素（Menu, Navigation, TaskList, Task, Journal）がレンダリングされること
 *    - [x] 3-2. 画面の上下に header および footer 要素がレンダリングされること
 *
 * 【AppRoot Menu & Side Panel Layout 連動仕様 (Phase 3)】
 * 4. メニューペイン（pane-menu）の配置と状態連携
 *    - [x] 4-1. panes-container 内に pane-menu コンポーネントがレンダリングされること
 *    - [x] 4-2. isNavigationListAreaOpen の状態（開状態: true）が pane-menu のプロパティへ反映されること
 *    - [x] 4-3. isNavigationListAreaOpen の状態（閉状態: false）が pane-menu のプロパティへ反映されること
 *
 * 5. パネル非表示レイアウト連動とコラプシブルクラス付与
 *    - [x] 5-1. Navigation ペインおよび Task List ペインに開閉アニメーション用の共通クラス（pane-collapsible）が付与されていること
 *    - [x] 5-2. isNavigationListAreaOpen が false の場合、Navigation ペイン（pane-navigation）および Task List ペイン（pane-task-list）に hidden 属性が付与されること
 *    - [x] 5-3. isNavigationListAreaOpen が true の場合、Navigation ペインおよび Task List ペインに hidden 属性が付与されないこと
 */

/**
 * ContextConsumer 用のヘルパー関数。
 * Node.js 環境（EventTarget）で AppRoot から配給される Context 値を取得する。
 */
const consumeContext = <T>(
  appRoot: AppRoot,
  context: Context<unknown, T>,
): T | undefined => {
  const host = Object.assign(new EventTarget(), {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
    dispatchEvent: (event: Event) => appRoot.dispatchEvent(event),
  }) as unknown as ReactiveControllerHost & HTMLElement;

  const consumer = new ContextConsumer(host, { context });
  consumer.hostConnected();
  return consumer.value;
};

const sharedAppRoot = new AppRoot();

describe("AppRoot Provider (Phase 1)", () => {
  const appRoot = sharedAppRoot;

  describe("1. Controller インスタンスの生成と初期化 (Instantiation)", () => {
    it("1-1. AppRoot インスタンス生成時、7つの各 Controller (LayoutUI, QuickAccess, Labels, Task, Logs, Notes, Issues) がインスタンス化されていること", () => {
      expect(appRoot.layoutUIController).toBeInstanceOf(LayoutUIController);
      expect(appRoot.quickAccessController).toBeInstanceOf(
        QuickAccessController,
      );
      expect(appRoot.labelsController).toBeInstanceOf(LabelsController);
      expect(appRoot.taskController).toBeInstanceOf(TaskController);
      expect(appRoot.logsController).toBeInstanceOf(LogsController);
      expect(appRoot.notesController).toBeInstanceOf(NotesController);
      expect(appRoot.issuesController).toBeInstanceOf(IssuesController);
    });
  });

  describe("2. @lit/context による Context 配給 (Context Provision)", () => {
    it("2-1. layoutUIContext が配下コンポーネントへ正しく配給されること", () => {
      const consumed = consumeContext(appRoot, layoutUIContext);
      expect(consumed).toBeDefined();
      expect(consumed).toBe(appRoot.layoutUIController);
    });

    it("2-2. quickAccessContext が配下コンポーネントへ正しく配給されること", () => {
      const consumed = consumeContext(appRoot, quickAccessContext);
      expect(consumed).toBeDefined();
      expect(consumed).toBe(appRoot.quickAccessController);
    });

    it("2-3. labelsContext が配下コンポーネントへ正しく配給されること", () => {
      const consumed = consumeContext(appRoot, labelsContext);
      expect(consumed).toBeDefined();
      expect(consumed).toBe(appRoot.labelsController);
    });

    it("2-4. taskContext が配下コンポーネントへ正しく配給されること", () => {
      const consumed = consumeContext(appRoot, taskContext);
      expect(consumed).toBeDefined();
      expect(consumed).toBe(appRoot.taskController);
    });

    it("2-5. logsContext が配下コンポーネントへ正しく配給されること", () => {
      const consumed = consumeContext(appRoot, logsContext);
      expect(consumed).toBeDefined();
      expect(consumed).toBe(appRoot.logsController);
    });

    it("2-6. notesContext が配下コンポーネントへ正しく配給されること", () => {
      const consumed = consumeContext(appRoot, notesContext);
      expect(consumed).toBeDefined();
      expect(consumed).toBe(appRoot.notesController);
    });

    it("2-7. issuesContext が配下コンポーネントへ正しく配給されること", () => {
      const consumed = consumeContext(appRoot, issuesContext);
      expect(consumed).toBeDefined();
      expect(consumed).toBe(appRoot.issuesController);
    });
  });
});

describe("AppRoot Layout 仕様 (Phase 2)", () => {
  const appRoot = sharedAppRoot;

  describe("3. 基本レイアウト構造の提供", () => {
    it("3-1. 5ペインの基本骨格要素がレンダリングされること", async () => {
      const template = appRoot.render() as unknown as {
        strings: readonly string[];
      };
      const strings = template.strings.join("");

      // 5ペインのコンテナおよび各ペイン要素の存在確認
      expect(strings).toContain("app-shell");
      expect(strings).toContain("panes-container");
      expect(strings).toContain("pane-menu");
      expect(strings).toContain("pane-navigation");
      expect(strings).toContain("pane-task-list");
      expect(strings).toContain("pane-task");
      expect(strings).toContain("pane-journal");

      // Navigation 内部の上下分割領域の存在確認
      expect(strings).toContain("navigation-quick-access");
      expect(strings).toContain("navigation-labels");
    });

    it("3-2. 画面の上下に header および footer 要素がレンダリングされること", async () => {
      const template = appRoot.render() as unknown as {
        strings: readonly string[];
      };
      const strings = template.strings.join("");

      expect(strings).toContain("app-header");
      expect(strings).toContain("app-footer");
    });
  });
});

describe("AppRoot Menu & Side Panel Layout 連動仕様 (Phase 3)", () => {
  const appRoot = sharedAppRoot;

  beforeEach(() => {
    appRoot.layoutUIController.setNavigationListAreaOpen(true);
  });

  describe("4. メニューペイン（pane-menu）の配置と状態連携", () => {
    it("4-1. panes-container 内に pane-menu コンポーネントがレンダリングされること", () => {
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toContain("<pane-menu");
      expect(htmlStr).toContain('class="pane-menu"');
    });

    it("4-2. isNavigationListAreaOpen の状態（開状態: true）が pane-menu のプロパティへ反映されること", () => {
      expect(appRoot.layoutUIController.state.isNavigationListAreaOpen).toBe(true);
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toContain(".isNavigationListAreaOpen=true");
    });

    it("4-3. isNavigationListAreaOpen の状態（閉状態: false）が pane-menu のプロパティへ反映されること", () => {
      appRoot.layoutUIController.setNavigationListAreaOpen(false);
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toContain(".isNavigationListAreaOpen=false");
    });
  });

  describe("5. パネル非表示レイアウト連動とコラプシブルクラス付与", () => {
    it("5-1. Navigation ペインおよび Task List ペインに開閉アニメーション用の共通クラス（pane-collapsible）が付与されていること", () => {
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toMatch(/class="[^"]*\bpane-navigation\b[^"]*\bpane-collapsible\b/);
      expect(htmlStr).toMatch(/class="[^"]*\bpane-task-list\b[^"]*\bpane-collapsible\b/);
    });

    it("5-2. isNavigationListAreaOpen が false の場合、Navigation ペイン（pane-navigation）および Task List ペイン（pane-task-list）に hidden 属性が付与されること", () => {
      appRoot.layoutUIController.setNavigationListAreaOpen(false);
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toMatch(/class="[^"]*\bpane-navigation\b[^"]*"[^>]*\bhidden\b/);
      expect(htmlStr).toMatch(/class="[^"]*\bpane-task-list\b[^"]*"[^>]*\bhidden\b/);
    });

    it("5-3. isNavigationListAreaOpen が true の場合、Navigation ペインおよび Task List ペインに hidden 属性が付与されないこと", () => {
      appRoot.layoutUIController.setNavigationListAreaOpen(true);
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).not.toMatch(/class="[^"]*\bpane-navigation\b[^"]*"[^>]*\bhidden\b/);
      expect(htmlStr).not.toMatch(/class="[^"]*\bpane-task-list\b[^"]*"[^>]*\bhidden\b/);
    });
  });
});

