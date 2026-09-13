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

describe("AppRoot Provider (Phase 1)", () => {
  let appRoot: AppRoot;

  beforeEach(() => {
    appRoot = new AppRoot();
  });

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
  let appRoot: AppRoot;

  beforeEach(() => {
    appRoot = new AppRoot();
  });

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
  });
});
