import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { TaskRecord } from "@/db/models/task.model";
import type { TaskController } from "@/controllers/task.controller.js";
import { PaneTask } from "./pane-task.js";

/**
 * 【PaneTask 仕様 (タスク管理 第4ペインコンテナ)】
 *
 * 1. タスク未選択状態（Empty State）の描画
 *    - 1-1. taskController.state が未定義の場合、空状態（.pane-task__empty）が表示されること
 *    - 1-2. 空状態に「タスクが選択されていません」の案内メッセージが表示されること
 *    - 1-3. 空状態時にヘッダー（.pane-task__header）およびタブ群がレンダリングされないこと
 *
 * 2. タスク選択状態のヘッダー描画
 *    - 2-1. ヘッダー部にタスク識別子（TASK #101 等）がレンダリングされること
 *    - 2-2. コピー用ボタン（.pane-task__btn-copy）が存在せず、タスク識別子（.pane-task__title）自体がクリックコピー可能であること
 *    - 2-3. handleCopyId 実行時に「#101 タスク名」の形式でクリップボードへ書き込みが行われること
 *    - 2-4. ステータスUI（.pane-task__status）に現在のステータスに応じたアイコン・ラベルが表示され、QUICK ACCESS準拠のアイコン名・library="my-icons"・slot="start" が設定されていること
 *    - 2-5. handleSelectStatus 実行時に taskController.updateStatus(newStatusCode) が呼び出されること
 *    - 2-6. ステータス変更ボタン（.pane-task__status）に Caret 表示属性（with-caret）が設定されていること
 *
 * 3. タブ領域（wa-tab-group）の描画
 *    - 3-1. wa-tab-group 内に Summary, Issues, Property の順で3つのタブが存在すること
 *    - 3-2. summary パネル内に task-summary コンポーネントがレンダリングされること
 *    - 3-3. issues パネル内に「Issues タブは準備中です」プレースホルダーが表示されること
 *    - 3-4. property パネル内に「Property タブは準備中です」プレースホルダーが表示されること
 *    - 3-5. wa-tab-group に active 属性がバインドされ、現在の activeTab（初期値 'summary'）と連動していること
 *    - 3-6. handleTabShow 呼び出しにより activeTab プロパティが更新されること
 *
 * 4. コントローラー購読（Context連携）
 *    - 4-1. taskController 設定時に controller.subscribe が呼び出されること
 *    - 4-2. disconnectedCallback 実行時に購読解除関数が呼び出されること
 *
 * 5. BEM設計およびSCSSスタイルの検証
 *    - 5-1. SCSSスタイルシート（pane-task.scss）が存在し、ルートブロック .pane-task および主要BEMセレクタが定義されていること
 *    - 5-2. テーマ切替トランジション等のCSS変数指定（var(--stepnote-transition-theme) または theme-transition）が定義されていること
 *    - 5-3. pane-task.scss に !important 宣言が一切含まれていないこと
 *    - 5-4. pane-task.scss に @extend が一切含まれていないこと
 *    - 5-5. pane-task.scss 全体においてハードコードされたカラーコードが 0 件（完全ゼロ）であること
 *    - 5-6. pane-task.scss において .pane-task__status に固定幅（120px）が設定され、Caret を含めた幅変動・描画崩れが抑止されていること
 *    - 5-7. pane-task.scss において wa-tab のフォントサイズが小さく調整され、.pane-task__tab-panel に Quick Access と同様の padding が設定されていること
 *    - 5-8. pane-task.scss において .pane-task__status のボタン内部（::part(button)）に、ライト/ダークモードに応じた背景色（var(--stepnote-dialog-bg)）と境界線・文字色が定義されていること
 *    - 5-9. pane-task.scss において .pane-task__tab-group に対し、ヘッダー直下は接したまま左右・下端に余白（padding: 0 var(--wa-space-xs, 8px) var(--wa-space-xs, 8px)）および box-sizing: border-box が設定されていること
 *    - 5-10. pane-task.scss において .pane-task__tab-panel がデフォルトで非表示（display: none）となり、&[active] にのみ display: flex が指定されていること
 *    - 5-11. pane-task.scss において .pane-task__tab-group の ::part(tab-group) および ::part(body) に height: 100% と flex: 1 が定義され、タブパネルのスクロールと領域伸長が保護されていること
 *    - 5-12. pane-task.scss において .pane-task__tab-panel[active] の ::part(base) に flex: 1 および min-height: 100% が定義され、スロットされた子要素への高さ伝播が保証されていること
 *    - 5-13. pane-task.scss において .pane-task__tab-panel[active] の padding-top が 0 であり、::part(base) に padding-top が指定されていることで、スクロール時のヘッダー上部余白とコンテンツ漏れが防止されていること
 */
describe("PaneTask Component", () => {
  let element: PaneTask;
  let mockTaskController: {
    state: TaskRecord | undefined;
    hasTask: boolean;
    updateStatus: ReturnType<typeof vi.fn>;
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
      updateStatus: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(unsubscribeMock),
    };

    element = new PaneTask();
    element.taskController = mockTaskController as unknown as TaskController;
  });

  describe("1. タスク未選択状態（Empty State）の描画", () => {
    beforeEach(() => {
      mockTaskController.state = undefined;
      mockTaskController.hasTask = false;
    });

    it("1-1. taskController.state が未定義の場合、空状態（.pane-task__empty）が表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("pane-task__empty");
    });

    it("1-2. 空状態に「タスクが選択されていません」の案内メッセージが表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("タスクが選択されていません");
    });

    it("1-3. 空状態時にヘッダー（.pane-task__header）およびタブ群がレンダリングされないこと", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("pane-task__header");
      expect(htmlStr).not.toContain("wa-tab-group");
    });
  });

  describe("2. タスク選択状態のヘッダー描画", () => {
    it("2-1. ヘッダー部にタスク識別子（TASK #101 等）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("pane-task__header");
      expect(htmlStr).toContain("TASK #101");
    });

    it("2-2. コピー用ボタン（.pane-task__btn-copy）が存在せず、タスク識別子テキスト（.pane-task__title）自体にクリックコピー属性またはイベントが設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("pane-task__btn-copy");
      expect(htmlStr).toContain("pane-task__title");
    });

    it("2-3. handleCopyId 実行時に「#101 タスク名」の形式でクリップボードへ書き込みが行われること", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      await element.handleCopyId();

      expect(writeTextMock).toHaveBeenCalledWith(
        "#101 新機能の基本設計を策定する",
      );
    });

    it("2-4. ステータスUI（.pane-task__status）に現在のステータスに応じたアイコン・ラベルが表示され、QUICK ACCESS準拠のアイコン名・library='my-icons'・slot='start' が設定されていること", () => {
      // 0: 開始待ち
      mockTaskController.state = { ...baseTask, statusCode: 0 };
      let htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("pane-task__status");
      expect(htmlStr).toContain("開始待ち");
      expect(htmlStr).toContain("circle-stop-solid-full");
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot="start"[^>]*library="my-icons"[^>]*name=["']?circle-stop-solid-full["']?/,
      );

      // 5: 対応中
      mockTaskController.state = { ...baseTask, statusCode: 5 };
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("対応中");
      expect(htmlStr).toContain("circle-play-solid-full");
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot="start"[^>]*library="my-icons"[^>]*name=["']?circle-play-solid-full["']?/,
      );

      // 9: 完了
      mockTaskController.state = { ...baseTask, statusCode: 9 };
      htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("完了");
      expect(htmlStr).toContain("circle-check-solid-full");
      expect(htmlStr).toMatch(
        /<wa-icon[^>]*slot="start"[^>]*library="my-icons"[^>]*name=["']?circle-check-solid-full["']?/,
      );
    });

    it("2-5. handleSelectStatus 実行時に taskController.updateStatus(newStatusCode) が呼び出されること", () => {
      element.handleSelectStatus(5);
      expect(mockTaskController.updateStatus).toHaveBeenCalledWith(5);
    });

    it("2-6. ステータス変更ボタン（.pane-task__status）に Caret 表示属性（with-caret）が設定されていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-button[^>]*class="[^"]*pane-task__status[^"]*"[^>]*\bwith-caret\b/,
      );
    });
  });

  describe("3. タブ領域（wa-tab-group）の描画", () => {
    it("3-1. wa-tab-group 内に Summary, Issues, Property の順で3つのタブが存在すること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("wa-tab-group");
      const summaryIdx = htmlStr.indexOf('panel="summary"');
      const issuesIdx = htmlStr.indexOf('panel="issues"');
      const propertyIdx = htmlStr.indexOf('panel="property"');
      expect(summaryIdx).toBeGreaterThan(-1);
      expect(issuesIdx).toBeGreaterThan(summaryIdx);
      expect(propertyIdx).toBeGreaterThan(issuesIdx);
    });

    it("3-2. summary パネル内に task-summary コンポーネントがレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-summary");
    });

    it("3-3. issues パネル内に「Issues タブは準備中です」プレースホルダーが表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("Issues タブは準備中です");
    });

    it("3-4. property パネル内に「Property タブは準備中です」プレースホルダーが表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("Property タブは準備中です");
    });

    it("3-5. wa-tab-group に active 属性がバインドされ、現在の activeTab（初期値 'summary'）と連動していること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-tab-group[^>]*\bactive=["']?summary["']?/);

      element.activeTab = "issues";
      const issuesHtml = flattenTemplate(element.render());
      expect(issuesHtml).toMatch(/<wa-tab-group[^>]*\bactive=["']?issues["']?/);
    });

    it("3-6. handleTabShow 呼び出しにより activeTab プロパティが更新されること", () => {
      element.handleTabShow(
        new CustomEvent("wa-tab-show", { detail: { name: "property" } }),
      );
      expect(element.activeTab).toBe("property");
    });
  });

  describe("4. コントローラー購読（Context連携）", () => {
    it("4-1. taskController 設定時に controller.subscribe が呼び出されること", () => {
      const newController = {
        state: { ...baseTask },
        hasTask: true,
        updateStatus: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };
      element.taskController = newController as unknown as TaskController;
      expect(newController.subscribe).toHaveBeenCalled();
    });

    it("4-2. disconnectedCallback 実行時に購読解除関数が呼び出されること", () => {
      element.disconnectedCallback();
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe("5. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "./pane-task.scss");

    it("5-1. SCSSスタイルシート（pane-task.scss）が存在し、ルートブロック .pane-task および主要BEMセレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain(".pane-task");
      expect(content).toContain(".pane-task__header");
      expect(content).toContain(".pane-task__tab-group");
      expect(content).toContain(".pane-task__empty");
    });

    it("5-2. テーマ切替トランジション等のCSS変数指定（var(--stepnote-transition-theme) または theme-transition）が定義されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      const hasThemeTransition =
        content.includes("--stepnote-transition-theme") ||
        content.includes("theme-transition");
      expect(hasThemeTransition).toBe(true);
    });

    it("5-3. pane-task.scss に !important 宣言が一切含まれていないこと", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toContain("!important");
    });

    it("5-4. pane-task.scss に @extend が一切含まれていないこと", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).not.toContain("@extend");
    });

    it("5-5. pane-task.scss 全体においてハードコードされたカラーコードが 0 件（完全ゼロ）であること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      const rgbMatches = content.match(/rgba?\([^)]+\)/g) ?? [];
      expect(hexMatches.length).toBe(0);
      expect(rgbMatches.length).toBe(0);
    });

    it("5-6. pane-task.scss において .pane-task__status に固定幅（120px）が設定され、Caret を含めた幅変動・描画崩れが抑止されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(
        /\.pane-task__status\s*\{[^}]*\bwidth:\s*12[0-9]px;/,
      );
    });

    it("5-7. pane-task.scss において wa-tab のフォントサイズが小さく調整され、.pane-task__tab-panel に Quick Access と同様の padding が設定されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(
        /wa-tab\s*\{[^}]*font-size:\s*var\(--wa-font-size-xs/,
      );
      expect(content).toMatch(
        /\.pane-task__tab-panel\s*\{[^}]*padding:\s*[^;]+;/,
      );
    });

    it("5-8. pane-task.scss において .pane-task__status のボタン内部（::part(button)）に、ライト/ダークモードに応じた背景色（var(--stepnote-dialog-bg)）と境界線・文字色が定義されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toContain("background-color: var(--stepnote-dialog-bg)");
      expect(content).toContain("var(--wa-color-surface-border)");
      expect(content).toContain("color: var(--wa-color-text-normal)");
    });

    it("5-9. pane-task.scss において .pane-task__tab-group に対し、ヘッダー直下は接したまま左右・下端に余白（padding: 0 var(--wa-space-xs, 8px) var(--wa-space-xs, 8px)）および box-sizing: border-box が設定されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(
        /\.pane-task__tab-group\s*\{[^}]*padding:\s*0\s+var\(--wa-space-xs[^)]*\)\s+var\(--wa-space-xs[^)]*\);/,
      );
      expect(content).toMatch(
        /\.pane-task__tab-group\s*\{[^}]*box-sizing:\s*border-box;/,
      );
    });

    it("5-10. pane-task.scss において .pane-task__tab-panel がデフォルトで非表示（display: none）となり、&[active] にのみ display: flex が指定されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(
        /\.pane-task__tab-panel\s*\{[^}]*display:\s*none;/,
      );
      expect(content).toMatch(
        /&\[active\]\s*\{[^}]*display:\s*flex;/,
      );
    });

    it("5-11. pane-task.scss において .pane-task__tab-group の ::part(tab-group) および ::part(body) に height: 100% と flex: 1 が定義され、タブパネルのスクロールと領域伸長が保護されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(/::part\(tab-group\)\s*\{[^}]*height:\s*100%;/);
      expect(content).toMatch(/::part\(tab-group\)\s*\{[^}]*flex:\s*1;/);
      expect(content).toMatch(/::part\(body\)\s*\{[^}]*height:\s*100%;/);
      expect(content).toMatch(/::part\(body\)\s*\{[^}]*flex:\s*1;/);
      expect(content).toMatch(/::part\(body\)\s*\{[^}]*overflow:\s*hidden;/);
    });

    it("5-12. pane-task.scss において .pane-task__tab-panel[active] の ::part(base) に flex: 1 および min-height: 100% が定義され、スロットされた子要素への高さ伝播が保証されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(/::part\(base\)\s*\{[^}]*flex:\s*1;/);
      expect(content).toMatch(/::part\(base\)\s*\{[^}]*min-height:\s*100%;/);
    });

    it("5-13. pane-task.scss において .pane-task__tab-panel[active] の padding-top が 0 であり、::part(base) に padding-top が指定されていることで、スクロール時のヘッダー上部余白とコンテンツ漏れが防止されていること", () => {
      const content = fs.readFileSync(scssPath, "utf-8");
      expect(content).toMatch(/padding:\s*0\s+var\(--wa-space-m[^)]*\)\s+var\(--wa-space-l[^)]*\);/);
      expect(content).toMatch(/::part\(base\)[\s\S]*?padding-top:\s*var\(--wa-space-l[^)]*\);/);
    });
  });
});
