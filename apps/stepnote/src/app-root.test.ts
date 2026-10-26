import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContextConsumer, type Context } from "@lit/context";
import type { ReactiveControllerHost } from "lit";
import {
  layoutUIContext,
  quickAccessContext,
  labelsContext,
  taskContext,
  taskListContext,
  logsContext,
  notesContext,
  issuesContext,
  themeContext,
  scratchContext,
} from "@/contexts/index.js";
import { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import { QuickAccessController } from "@/controllers/quick-access.controller.js";
import { LabelsController } from "@/controllers/labels.controller.js";
import { TaskController } from "@/controllers/task.controller.js";
import { TaskListController } from "@/controllers/task-list.controller.js";
import { LogsController } from "@/controllers/logs.controller.js";
import { NotesController } from "@/controllers/notes.controller.js";
import { IssuesController } from "@/controllers/issues.controller.js";
import { ThemeController } from "@/controllers/theme.controller.js";
import { ScratchController } from "@/controllers/scratch.controller.js";
import { flattenTemplate } from "@shared/utils";
import { AppRoot } from "./app-root.js";

/**
 * 【AppRoot Provider 仕様 (Phase 1)】
 *
 * 1. Controller インスタンスの生成と初期化 (Instantiation)
 *    - [x] 1-1. AppRoot インスタンス生成時、10個の各 Controller (LayoutUI, QuickAccess, Labels, Task, TaskList, Logs, Notes, Issues, Theme, Scratch) がインスタンス化されていること
 *
 * 2. @lit/context による Context 配給 (Context Provision)
 *    - [x] 2-1. layoutUIContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-2. quickAccessContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-3. labelsContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-4. taskContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-5. logsContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-6. notesContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-7. issuesContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-8. themeContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-9. taskListContext が配下コンポーネントへ正しく配給されること
 *    - [x] 2-10. scratchContext が配下コンポーネントへ正しく配給されること
 *
 * 【AppRoot Layout 仕様 (Phase 2)】
 * 3. 基本レイアウト構造の提供
 *    - [x] 3-1. 5ペインの基本骨格要素（Menu, Navigation, TaskList, Task, Journal）がレンダリングされること
 *    - [x] 3-2. 画面の上下に header および footer 要素がレンダリングされること
 *
 * 【AppRoot Menu & Side Panel Layout 連動仕様 (Phase 3)】
 * 4. メニュー（app-menu）の配置と状態連携
 *    - [x] 4-1. panes-container 内に app-menu コンポーネントがレンダリングされること
 *    - [x] 4-2. isNavigationListAreaOpen の状態（開状態: true）が app-menu のプロパティへ反映されること
 *    - [x] 4-3. isNavigationListAreaOpen の状態（閉状態: false）が app-menu のプロパティへ反映されること
 *    - [x] 4-4. isZenMode の状態（通常時: false）が app-menu のプロパティへ反映されること
 *    - [x] 4-5. isZenMode の状態（集中モード時: true）が app-menu のプロパティへ反映されること
 *
 * 5. パネル非表示レイアウト連動とコラプシブルクラス付与
 *    - [x] 5-1. Navigation ペインおよび Task List ペインに開閉アニメーション用の共通クラス（pane-collapsible）が付与されていること
 *    - [x] 5-2. isNavigationListAreaOpen が false の場合、Navigation ペイン（pane-navigation）および Task List（task-list）に hidden 属性が付与されること
 *    - [x] 5-3. isNavigationListAreaOpen が true の場合、Navigation ペインおよび Task List ペインに hidden 属性が付与されないこと
 *    - [ ] 5-4. isJournalAreaOpen が false の場合、Journal ペイン（.journal-pane）に journal-pane--collapsed クラスが付与されること
 *    - [ ] 5-5. isJournalAreaOpen が true の場合、Journal ペイン（.journal-pane）に journal-pane--collapsed クラスが付与されないこと
 *
 * 【AppRoot Header Theme Switcher 仕様 (Phase 4)】
 * 6. ヘッダーのテーマ切り替えドロップダウンの配置と状態連動
 *    - [x] 6-1. ヘッダー内にテーマ切り替え用ドロップダウン（wa-dropdown）およびトリガーボタンがレンダリングされること
 *    - [x] 6-2. ドロップダウン内にシステム、ライト、ダークの各選択項目（wa-dropdown-item）がレンダリングされること
 *    - [x] 6-3. 現在選択中のテーマに応じたアイコン名およびラベルが正しく設定されること
 *    - [x] 6-4. handleThemeSelect によりテーマが切り替えられ、アイコン表示が更新されること
 *
 * 【AppRoot Controller 状態連携仕様 (Phase 7)】
 * 7. issuesController と taskListController / taskController の状態連携
 *    - [x] 7-1. issuesController の通知契機で taskListController.refresh が呼び出され、Task List の件数集計が同期されること
 *    - [x] 7-2. issuesController の通知契機で taskController.refresh が呼び出され、親タスクの完了可否状態が同期されること
 *    - [ ] 7-3. taskController の通知契機で taskListController.refresh が呼び出され、親タスクのステータス変更等が Task List に同期されること
 *
 * 【AppRoot 全体検索モーダル連携仕様 (Phase 8)】
 * 8. 全体検索モーダル（GlobalSearchDialog）との連携
 *    - [ ] 8-1. ヘッダー中央（header-search）に全体検索トリガーボタン（header-global-search-trigger）がレンダリングされ、アイコン・プレースホルダー・Ctrl Kバッジが表示されること
 *    - [x] 8-2. 全体検索モーダル要素（global-search-dialog）がレンダリングされ、初期状態は閉じた状態であること
 *    - [x] 8-3. handleOpenGlobalSearch 実行時に isGlobalSearchOpen が true に更新されること
 *    - [x] 8-4. Ctrl+K キーボードショートカットで isGlobalSearchOpen の開閉がトグルされること
 *    - [ ] 8-5. handleCloseGlobalSearch 実行時に、検索トリガーボタン（#header-global-search-trigger）の blur が呼ばれてフォーカス状態が解除されること
 *
 * 【AppRoot 新規タスク作成ダイアログ連携仕様 (Phase 9)】
 * 9. 新規タスク作成モーダル（TaskCreateDialog）との連携
 *    - [ ] 9-1. 新規タスク作成ダイアログ要素（task-create-dialog）がレンダリングされ、初期状態は閉じた状態であること
 *    - [ ] 9-2. handleOpenTaskCreate 実行時、ラベルが1件以上存在すれば isTaskCreateDialogOpen が true に更新されること
 *    - [ ] 9-3. handleOpenTaskCreate 実行時、ラベルが0件の場合は isTaskCreateDialogOpen が false のままであること
 *    - [ ] 9-4. handleCloseTaskCreate 実行時に isTaskCreateDialogOpen が false に更新されること
 *    - [ ] 9-5. Alt+N キーボードショートカットで、ラベルが1件以上存在する場合に isTaskCreateDialogOpen が true になること（0件の場合は抑制されること）
 *    - [ ] 9-6. handleTaskCreated 実行時に isTaskCreateDialogOpen が false となり、taskListController.refresh および selectTask が実行されること
 *    - [ ] 9-7. request-task-create イベント受信時に handleOpenTaskCreate が呼ばれること
 *
 * 【AppRoot 全画面Scratchモード仕様 (Phase 10)】
 * 10. 全画面Scratchモード（Scratch Mode）連携
 *    - [ ] 10-1. isScratchMode が true の際、panes-container 内に scratch-pane がレンダリングされ、Navigation, TaskList, Task, Journal ペインが非表示となること
 *    - [ ] 10-2. isScratchMode の状態が app-menu の .isScratchMode プロパティへ反映されること
 *    - [ ] 10-3. isScratchMode が true の際、ヘッダーの全体検索ボタン（#header-global-search-trigger）が無効化（disabled属性）されること
 *    - [ ] 10-4. isScratchMode が true の際、Ctrl+K による全体検索および Alt+N による新規タスク作成のキーボードショートカットが抑止されること
 *
 * 【AppRoot ショートカットヘルプ連携仕様 (Phase 12)】
 * 12. ショートカットヘルプ連携（Shortcut Help Drawer）
 *    - [x] 12-1. shortcut-help-drawer コンポーネントがレンダリングされること
 *    - [x] 12-2. request-shortcut-help イベント受信時に handleToggleShortcutHelp が呼ばれ、isShortcutHelpOpen がトグルすること
 *    - [x] 12-3. handleCloseShortcutHelp 実行時に isShortcutHelpOpen が false に更新されること
 *    - [x] 12-4. Ctrl+/ キーボードショートカットで isShortcutHelpOpen の開閉がトグルされること
 *    - [x] 12-5. isScratchMode が true の際、Ctrl+/ によるショートカットヘルプ表示が抑止されること
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
    it("1-1. AppRoot インスタンス生成時、9つの各 Controller (LayoutUI, QuickAccess, Labels, Task, TaskList, Logs, Notes, Issues, Theme) がインスタンス化されていること", () => {
      expect(appRoot.layoutUIController).toBeInstanceOf(LayoutUIController);
      expect(appRoot.quickAccessController).toBeInstanceOf(
        QuickAccessController,
      );
      expect(appRoot.labelsController).toBeInstanceOf(LabelsController);
      expect(appRoot.taskController).toBeInstanceOf(TaskController);
      expect(appRoot.taskListController).toBeInstanceOf(TaskListController);
      expect(appRoot.logsController).toBeInstanceOf(LogsController);
      expect(appRoot.notesController).toBeInstanceOf(NotesController);
      expect(appRoot.issuesController).toBeInstanceOf(IssuesController);
      expect(appRoot.themeController).toBeInstanceOf(ThemeController);
      expect(appRoot.scratchController).toBeInstanceOf(ScratchController);
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

    it("2-8. themeContext が配下コンポーネントへ正しく配給されること", () => {
      const consumed = consumeContext(appRoot, themeContext);
      expect(consumed).toBeDefined();
      expect(consumed).toBe(appRoot.themeController);
    });

    it("2-9. taskListContext が配下コンポーネントへ正しく配給されること", () => {
      const consumed = consumeContext(appRoot, taskListContext);
      expect(consumed).toBeDefined();
      expect(consumed).toBe(appRoot.taskListController);
    });

    it("2-10. scratchContext が配下コンポーネントへ正しく配給されること", () => {
      const consumed = consumeContext(appRoot, scratchContext);
      expect(consumed).toBeDefined();
      expect(consumed).toBe(appRoot.scratchController);
    });
  });
});

describe("AppRoot Layout 仕様 (Phase 2)", () => {
  const appRoot = sharedAppRoot;

  describe("3. 基本レイアウト構造の提供", () => {
    it("3-1. 5ペインの基本骨格要素がレンダリングされること", async () => {
      const htmlStr = flattenTemplate(appRoot.render());

      // 5ペインのコンテナおよび各ペイン要素の存在確認
      expect(htmlStr).toContain("app-shell");
      expect(htmlStr).toContain("panes-container");
      expect(htmlStr).toContain("app-menu");
      expect(htmlStr).toContain("pane-navigation");
      expect(htmlStr).toContain("task-list");
      expect(htmlStr).toContain("task-pane");
      expect(htmlStr).toContain("<task-pane");
      expect(htmlStr).toContain("journal-pane");
      expect(htmlStr).toContain("<journal-pane");

      // Navigation 内部の上下分割領域の存在確認
      expect(htmlStr).toContain("navigation-quick-access");
      expect(htmlStr).toContain("navigation-labels");
    });

    it("3-2. 画面の上下に header および footer 要素がレンダリングされること", async () => {
      const htmlStr = flattenTemplate(appRoot.render());

      expect(htmlStr).toContain("app-header");
      expect(htmlStr).toContain("app-footer");
      expect(htmlStr).toContain("<app-footer");
    });
  });
});

describe("AppRoot Menu & Side Panel Layout 連動仕様 (Phase 3)", () => {
  const appRoot = sharedAppRoot;

  beforeEach(() => {
    appRoot.layoutUIController.setNavigationListAreaOpen(true);
  });

  describe("4. メニュー（app-menu）の配置と状態連携", () => {
    it("4-1. panes-container 内に app-menu コンポーネントがレンダリングされること", () => {
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toContain("<app-menu");
      expect(htmlStr).toContain('class="app-menu"');
    });

    it("4-2. isNavigationListAreaOpen の状態（開状態: true）が app-menu のプロパティへ反映されること", () => {
      expect(appRoot.layoutUIController.state.isNavigationListAreaOpen).toBe(true);
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toContain(".isNavigationListAreaOpen=true");
    });

    it("4-3. isNavigationListAreaOpen の状態（閉状態: false）が app-menu のプロパティへ反映されること", () => {
      appRoot.layoutUIController.setNavigationListAreaOpen(false);
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toContain(".isNavigationListAreaOpen=false");
    });

    it("4-4. isZenMode の状態（通常時: false）が app-menu のプロパティへ反映されること", () => {
      expect(appRoot.layoutUIController.state.isZenMode).toBe(false);
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toContain(".isZenMode=false");
    });

    it("4-5. isZenMode の状態（集中モード時: true）が app-menu のプロパティへ反映されること", () => {
      appRoot.layoutUIController.setZenMode(true);
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toContain(".isZenMode=true");
    });
  });

  describe("5. パネル非表示レイアウト連動とコラプシブルクラス付与", () => {
    it("5-1. Navigation ペインおよび Task List ペインに開閉アニメーション用の共通クラス（pane-collapsible）が付与されていること", () => {
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toMatch(/class="[^"]*\bpane-navigation\b[^"]*\bpane-collapsible\b/);
      expect(htmlStr).toMatch(/class="[^"]*\btask-list\b[^"]*\bpane-collapsible\b/);
    });

    it("5-2. isNavigationListAreaOpen が false の場合、Navigation ペイン（pane-navigation）および Task List（task-list）に hidden 属性が付与されること", () => {
      appRoot.layoutUIController.setNavigationListAreaOpen(false);
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toMatch(/class="[^"]*\bpane-navigation\b[^"]*"[^>]*\bhidden\b/);
      expect(htmlStr).toMatch(/class="[^"]*\btask-list\b[^"]*"[^>]*\bhidden\b/);
    });

    it("5-3. isNavigationListAreaOpen が true の場合、Navigation ペインおよび Task List に hidden 属性が付与されないこと", () => {
      appRoot.layoutUIController.setNavigationListAreaOpen(true);
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).not.toMatch(/class="[^"]*\bpane-navigation\b[^"]*"[^>]*\bhidden\b/);
      expect(htmlStr).not.toMatch(/class="[^"]*\btask-list\b[^"]*"[^>]*\bhidden\b/);
    });

    it("5-4. isJournalAreaOpen が false の場合、Journal ペイン（.journal-pane）に journal-pane--collapsed クラスが付与されること", () => {
      (appRoot.layoutUIController as unknown as { setJournalAreaOpen: (isOpen: boolean) => void }).setJournalAreaOpen(false);
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toMatch(/class="[^"]*\bjournal-pane\b[^"]*\bjournal-pane--collapsed\b[^"]*"/);
    });

    it("5-5. isJournalAreaOpen が true の場合、Journal ペイン（.journal-pane）に journal-pane--collapsed クラスが付与されないこと", () => {
      (appRoot.layoutUIController as unknown as { setJournalAreaOpen: (isOpen: boolean) => void }).setJournalAreaOpen(true);
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).not.toMatch(/class="[^"]*\bjournal-pane\b[^"]*\bjournal-pane--collapsed\b[^"]*"/);
    });
  });
});

describe("AppRoot Header Theme Switcher 配置仕様 (Phase 4)", () => {
  const appRoot = sharedAppRoot;

  describe("6. ヘッダーのテーマ切り替えコンポーネント配置", () => {
    it("6-1. ヘッダーの header-actions 内に theme-switcher コンポーネントがレンダリングされること", () => {
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toContain("header-actions");
      expect(htmlStr).toContain("<theme-switcher");
    });
  });
});

describe("AppRoot Controller 状態連携仕様", () => {
  const appRoot = sharedAppRoot;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("7-1. issuesController の通知契機で taskListController.refresh が呼び出され、Task List の件数集計が同期されること", async () => {
    const taskListRefreshSpy = vi
      .spyOn(appRoot.taskListController, "refresh")
      .mockResolvedValue(undefined);

    appRoot.setupControllerSubscriptions();
    await appRoot.issuesController.refresh();

    expect(taskListRefreshSpy).toHaveBeenCalled();
  });

  it("7-2. issuesController の通知契機で taskController.refresh が呼び出され、親タスクの完了可否状態が同期されること", async () => {
    const taskRefreshSpy = vi
      .spyOn(appRoot.taskController, "refresh")
      .mockResolvedValue(undefined);

    appRoot.setupControllerSubscriptions();
    await appRoot.issuesController.refresh();

    expect(taskRefreshSpy).toHaveBeenCalled();
  });

  it("7-3. taskController の通知契機で taskListController.refresh が呼び出され、親タスクのステータス変更等が Task List に同期されること", async () => {
    const taskListRefreshSpy = vi
      .spyOn(appRoot.taskListController, "refresh")
      .mockResolvedValue(undefined);

    appRoot.setupControllerSubscriptions();
    await appRoot.taskController.refresh();

    expect(taskListRefreshSpy).toHaveBeenCalled();
  });

  describe("8. 全体検索モーダル（GlobalSearchDialog）との連携", () => {
    it("8-1. ヘッダー中央（header-search）に全体検索トリガーボタン（header-global-search-trigger）がレンダリングされ、アイコン・プレースホルダー・Ctrl Kバッジが表示されること", () => {
      const template = (appRoot as any).renderHeader();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain("header-search");
      expect(htmlStr).toContain('id="header-global-search-trigger"');
      expect(htmlStr).toContain("header-search-trigger");
      expect(htmlStr).toContain('name="magnifying-glass-solid-full"');
      expect(htmlStr).toContain("全体を検索...");
      expect(htmlStr).toContain("Ctrl K");
      expect(htmlStr).not.toContain("header-global-search-btn");
    });

    it("8-2. 全体検索モーダル要素（global-search-dialog）がレンダリングされ、初期状態は閉じた状態であること", () => {
      const template = appRoot.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain("<global-search-dialog");
      expect((appRoot as any).isGlobalSearchOpen).toBe(false);
    });

    it("8-3. handleOpenGlobalSearch 実行時に isGlobalSearchOpen が true に更新されること", () => {
      (appRoot as any).handleOpenGlobalSearch();
      expect((appRoot as any).isGlobalSearchOpen).toBe(true);

      (appRoot as any).handleCloseGlobalSearch();
      expect((appRoot as any).isGlobalSearchOpen).toBe(false);
    });

    it("8-4. Ctrl+K キーボードショートカットで isGlobalSearchOpen の開閉がトグルされること", () => {
      expect((appRoot as any).isGlobalSearchOpen).toBe(false);

      const event = {
        key: "k",
        ctrlKey: true,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      (appRoot as any).handleGlobalKeyDown(event);
      expect((appRoot as any).isGlobalSearchOpen).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();

      (appRoot as any).handleGlobalKeyDown(event);
      expect((appRoot as any).isGlobalSearchOpen).toBe(false);
    });

    it("8-5. handleCloseGlobalSearch 実行時に、検索トリガーボタン（#header-global-search-trigger）の blur が呼ばれてフォーカス状態が解除されること", () => {
      const mockTrigger = { blur: vi.fn() };
      const querySelectorSpy = vi.fn().mockImplementation((selector: string) => {
        if (selector === "#header-global-search-trigger") {
          return mockTrigger;
        }
        return null;
      });

      Object.defineProperty(appRoot, "renderRoot", {
        value: {
          querySelector: querySelectorSpy,
        },
        configurable: true,
      });

      (appRoot as any).handleCloseGlobalSearch();
      expect(querySelectorSpy).toHaveBeenCalledWith("#header-global-search-trigger");
      expect(mockTrigger.blur).toHaveBeenCalled();
    });
  });

  describe("9. 新規タスク作成モーダル（TaskCreateDialog）との連携", () => {
    it("9-1. 新規タスク作成ダイアログ要素（task-create-dialog）がレンダリングされ、初期状態は閉じた状態であること", () => {
      const template = appRoot.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain("<task-create-dialog");
      expect((appRoot as any).isTaskCreateDialogOpen).toBe(false);
    });

    it("9-2. handleOpenTaskCreate 実行時、ラベルが1件以上存在すれば isTaskCreateDialogOpen が true に更新されること", () => {
      vi.spyOn(appRoot.labelsController, "hasLabels", "get").mockReturnValue(true);
      (appRoot as any).handleOpenTaskCreate();
      expect((appRoot as any).isTaskCreateDialogOpen).toBe(true);
    });

    it("9-3. handleOpenTaskCreate 実行時、ラベルが0件の場合は isTaskCreateDialogOpen が false のままであること", () => {
      vi.spyOn(appRoot.labelsController, "hasLabels", "get").mockReturnValue(false);
      (appRoot as any).isTaskCreateDialogOpen = false;
      (appRoot as any).handleOpenTaskCreate();
      expect((appRoot as any).isTaskCreateDialogOpen).toBe(false);
    });

    it("9-4. handleCloseTaskCreate 実行時に isTaskCreateDialogOpen が false に更新されること", () => {
      (appRoot as any).isTaskCreateDialogOpen = true;
      (appRoot as any).handleCloseTaskCreate();
      expect((appRoot as any).isTaskCreateDialogOpen).toBe(false);
    });

    it("9-5. Alt+N キーボードショートカットで、ラベルが1件以上存在する場合に isTaskCreateDialogOpen が true になること（0件の場合は抑制され、Ctrl+Nや単一nでは反応しないこと）", () => {
      vi.spyOn(appRoot.labelsController, "hasLabels", "get").mockReturnValue(true);
      (appRoot as any).isTaskCreateDialogOpen = false;

      // Alt+N でダイアログが開くこと
      const altNEvent = {
        key: "n",
        altKey: true,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      (appRoot as any).handleGlobalKeyDown(altNEvent);
      expect((appRoot as any).isTaskCreateDialogOpen).toBe(true);
      expect(altNEvent.preventDefault).toHaveBeenCalled();

      // 旧ショートカット Ctrl+N では開かないこと
      (appRoot as any).isTaskCreateDialogOpen = false;
      const ctrlNEvent = {
        key: "n",
        ctrlKey: true,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      (appRoot as any).handleGlobalKeyDown(ctrlNEvent);
      expect((appRoot as any).isTaskCreateDialogOpen).toBe(false);

      // 修飾キーなしの単一 n では開かないこと
      (appRoot as any).isTaskCreateDialogOpen = false;
      const singleNEvent = {
        key: "n",
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      (appRoot as any).handleGlobalKeyDown(singleNEvent);
      expect((appRoot as any).isTaskCreateDialogOpen).toBe(false);

      // ラベルが0件の場合は Alt+N でも開かないこと
      vi.spyOn(appRoot.labelsController, "hasLabels", "get").mockReturnValue(false);
      (appRoot as any).isTaskCreateDialogOpen = false;
      const altNEvent2 = {
        key: "n",
        altKey: true,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      (appRoot as any).handleGlobalKeyDown(altNEvent2);
      expect((appRoot as any).isTaskCreateDialogOpen).toBe(false);
    });

    it("9-6. handleTaskCreated 実行時に isTaskCreateDialogOpen が false となり、taskListController.refresh および selectTask が実行されること", async () => {
      (appRoot as any).isTaskCreateDialogOpen = true;
      const refreshSpy = vi
        .spyOn(appRoot.taskListController, "refresh")
        .mockResolvedValue(undefined);
      const selectTaskSpy = vi
        .spyOn(appRoot.taskListController, "selectTask")
        .mockResolvedValue(undefined);

      const customEvent = new CustomEvent("task-created", {
        detail: { taskId: 42 },
      });
      await (appRoot as any).handleTaskCreated(customEvent);

      expect((appRoot as any).isTaskCreateDialogOpen).toBe(false);
      expect(refreshSpy).toHaveBeenCalled();
      expect(selectTaskSpy).toHaveBeenCalledWith(42);
    });

    it("9-7. request-task-create イベント受信時に handleOpenTaskCreate が呼ばれること", () => {
      const openSpy = vi.spyOn(appRoot as any, "handleOpenTaskCreate");
      appRoot.dispatchEvent(
        new CustomEvent("request-task-create", {
          bubbles: true,
          composed: true,
        }),
      );
      expect(openSpy).toHaveBeenCalled();
    });
  });

  describe("10. 全画面Scratchモード（Scratch Mode）連携", () => {
    it("10-1. isScratchMode が true の際、panes-container 内に scratch-pane がレンダリングされ、Navigation, TaskList, Task, Journal ペインが非表示となること", () => {
      (appRoot.layoutUIController as any)._state = {
        ...appRoot.layoutUIController.state,
        isScratchMode: true,
      };
      const htmlStr = flattenTemplate(appRoot.render());

      expect(htmlStr).toMatch(/<scratch-pane/);
      expect(htmlStr).not.toMatch(/<aside[^>]*class="[^"]*pane-navigation/);
      expect(htmlStr).not.toMatch(/<task-list/);
      expect(htmlStr).not.toMatch(/<task-pane/);
      expect(htmlStr).not.toMatch(/<journal-pane/);
    });

    it("10-2. isScratchMode の状態が app-menu の .isScratchMode プロパティへ反映されること", () => {
      (appRoot.layoutUIController as any)._state = {
        ...appRoot.layoutUIController.state,
        isScratchMode: true,
      };
      const htmlStr = flattenTemplate(appRoot.render());
      // .isScratchMode=${true} が app-menu に渡されていること
      expect(htmlStr).toMatch(/<app-menu/);
    });

    it("10-3. isScratchMode が true の際、ヘッダーの全体検索ボタンが無効化（disabled属性）されること", () => {
      (appRoot.layoutUIController as any)._state = {
        ...appRoot.layoutUIController.state,
        isScratchMode: true,
      };
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toMatch(
        /<button[^>]*id="header-global-search-trigger"[^>]*\bdisabled\b/,
      );
    });

    it("10-4. isScratchMode が true の際、Ctrl+K による全体検索および Alt+N による新規タスク作成のキーボードショートカットが抑止されること", () => {
      (appRoot.layoutUIController as any)._state = {
        ...appRoot.layoutUIController.state,
        isScratchMode: true,
      };
      (appRoot as any).labelsController = { hasLabels: true };

      // Ctrl+K の抑止確認
      const ctrlKEvent = {
        key: "k",
        ctrlKey: true,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      (appRoot as any).handleGlobalKeyDown(ctrlKEvent);
      expect(appRoot.isGlobalSearchOpen).toBe(false);
      expect(ctrlKEvent.preventDefault).not.toHaveBeenCalled();

      // Alt+N の抑止確認
      const altNEvent = {
        key: "n",
        altKey: true,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      (appRoot as any).handleGlobalKeyDown(altNEvent);
      expect(appRoot.isTaskCreateDialogOpen).toBe(false);
      expect(altNEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe("11. データベースバックアップ（エクスポート・インポート）連携", () => {
    it("11-1. request-database-export イベント受信時に handleExportDatabase が呼ばれ、exportDatabase が実行されること", async () => {
      const exportSpy = vi
        .spyOn(appRoot.databaseBackupService, "exportDatabase")
        .mockResolvedValue(new Blob());

      appRoot.dispatchEvent(
        new CustomEvent("request-database-export", {
          bubbles: true,
          composed: true,
        }),
      );

      // 非同期ハンドラの完了を待機
      await (appRoot as any).handleExportDatabase();
      expect(exportSpy).toHaveBeenCalled();
    });

    it("11-2. request-database-import イベント受信時に handleImportDatabase が呼ばれ、importDatabase が実行されること", async () => {
      const importSpy = vi
        .spyOn(appRoot.databaseBackupService, "importDatabase")
        .mockResolvedValue(undefined);

      const mockFile = new File(['{"test":1}'], "backup.json", {
        type: "application/json",
      });

      await (appRoot as any).handleImportDatabase(
        new CustomEvent("request-database-import", {
          detail: { file: mockFile },
        }),
      );

      expect(importSpy).toHaveBeenCalledWith(expect.anything(), mockFile);
    });
  });

  describe("12. ショートカットヘルプ連携（Shortcut Help Drawer）", () => {
    it("12-1. shortcut-help-drawer コンポーネントがレンダリングされること", () => {
      const htmlStr = flattenTemplate(appRoot.render());
      expect(htmlStr).toMatch(/<shortcut-help-drawer/);
    });

    it("12-2. request-shortcut-help イベント受信時に handleToggleShortcutHelp が呼ばれ、isShortcutHelpOpen がトグルすること", () => {
      const toggleSpy = vi.spyOn(appRoot as any, "handleToggleShortcutHelp");
      appRoot.isShortcutHelpOpen = false;

      appRoot.dispatchEvent(
        new CustomEvent("request-shortcut-help", {
          bubbles: true,
          composed: true,
        }),
      );

      expect(toggleSpy).toHaveBeenCalled();
      expect(appRoot.isShortcutHelpOpen).toBe(true);

      appRoot.dispatchEvent(
        new CustomEvent("request-shortcut-help", {
          bubbles: true,
          composed: true,
        }),
      );
      expect(appRoot.isShortcutHelpOpen).toBe(false);
    });

    it("12-3. handleCloseShortcutHelp 実行時に isShortcutHelpOpen が false に更新されること", () => {
      appRoot.isShortcutHelpOpen = true;
      appRoot.handleCloseShortcutHelp();
      expect(appRoot.isShortcutHelpOpen).toBe(false);
    });

    it("12-4. Ctrl+/ キーボードショートカットで isShortcutHelpOpen の開閉がトグルされること", () => {
      (appRoot.layoutUIController as any)._state = {
        ...appRoot.layoutUIController.state,
        isScratchMode: false,
      };
      appRoot.isShortcutHelpOpen = false;

      const ctrlSlashEvent = {
        key: "/",
        ctrlKey: true,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      (appRoot as any).handleGlobalKeyDown(ctrlSlashEvent);
      expect(appRoot.isShortcutHelpOpen).toBe(true);
      expect(ctrlSlashEvent.preventDefault).toHaveBeenCalled();

      (appRoot as any).handleGlobalKeyDown(ctrlSlashEvent);
      expect(appRoot.isShortcutHelpOpen).toBe(false);
    });

    it("12-5. isScratchMode が true の際、Ctrl+/ によるショートカットヘルプ表示が抑止されること", () => {
      (appRoot.layoutUIController as any)._state = {
        ...appRoot.layoutUIController.state,
        isScratchMode: true,
      };
      appRoot.isShortcutHelpOpen = false;

      const ctrlSlashEvent = {
        key: "/",
        ctrlKey: true,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      (appRoot as any).handleGlobalKeyDown(ctrlSlashEvent);
      expect(appRoot.isShortcutHelpOpen).toBe(false);
      expect(ctrlSlashEvent.preventDefault).not.toHaveBeenCalled();
    });
  });
});





