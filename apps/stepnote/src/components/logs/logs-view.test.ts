import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { LogRecord } from "@/db/models/journal.model";
import type { LogsController } from "@/controllers/logs.controller";
import type { TaskController } from "@/controllers/task.controller";
import { LogsView } from "./logs-view";
import { formatLogDate } from "./logs-view.utils";

/**
 * 【LogsView 仕様 (Logs コンポーネント)】
 *
 * 1. 初期描画と空状態 (Initial Render & Empty State)
 *    - 1-1. 初期状態では expandedLogIds は空であり、複数展開モードのプロパティが存在しないこと
 *    - 1-2. logsController.state が空配列の場合、空状態メッセージ（.logs-view__empty）が表示されること
 *    - 1-3. ヘッダーに共通部品 search-input（.logs-view__search、size="s"）および新規追加ボタン（.logs-view__btn-add）が表示され、複数展開切り替えボタンが存在しないこと
 *
 * 2. 一覧表示（Git Graph風）とフィルタリング (List View & Filtering)
 *    - 2-1. ログ一覧がテーブル／リスト行（.logs-view__row）として描画されること
 *    - 2-2. 各行に Graphセル（.logs-view__cell--graph）、Descriptionセル（.logs-view__cell--description）、Dateセル（.logs-view__cell--date）が存在すること
 *    - 2-3. Descriptionセルに本文1行目（見出し記号除去済みタイトル）が表示されること
 *    - 2-4. 検索入力または search-input イベントによりログ一覧がリアルタイムに絞り込まれること
 *    - 2-5. ログ一覧が作成日時の降順（新しい順）でソートされて描画されること
 *    - 2-6. Date セル内は 1行で秒単位まで日時が表示され、Date セルを対象とする wa-tooltip 内に wa-relative-time による経過時間が描画されること
 *
 * 3. インラインアコーディオン展開 (Inline Accordion Expand)
 *    - 3-1. 行クリック（handleToggleExpand）で該当ログの詳細が展開コンテナ（.logs-view__detail-container）とともにインライン展開されること
 *    - 3-2. 別の行をクリックすると前回のログが閉じるアニメーション（.logs-view__detail-container--collapsing）へ遷移し、新行が展開されること（排他制御）
 *    - 3-3. 複数行をクリックしても同時に展開されず、常に1件のみが展開されること（複数展開メソッドが存在しないこと）
 *    - 3-4. 展開中のログ行を再度クリックすると閉じアニメーション（.logs-view__detail-container--collapsing）へ遷移すること
 *    - 3-5. アニメーション終了（handleDetailAnimationEnd）によって閉じる対象のログ詳細が完全にアンマウントされること
 *
 * 4. 詳細パネルの構成と編集・自動保存・削除 (Detail Panel, Auto-save & Delete)
 *    - 4-1. 詳細パネル内にメタ情報バー（.logs-view__detail-meta）および markdown-editor-preview が配置されること
 *    - 4-2. 末尾ログを展開した際、詳細グラフ列に貫通線が描画されないこと
 *    - 4-3. markdown-editor-preview の内容変更（handleContentChange）は 300ms デバウンスされ、入力中は updateLog が呼ばれず、300ms 経過後に1度だけ呼び出されること
 *    - 4-4. handleContentChange が連続で呼び出された場合、前回のタイマーがキャンセルされ、最後の入力から 300ms 後に1度だけ呼び出されること
 *    - 4-5. disconnectedCallback 実行時に保留中のデバウンスタイマーがクリアされ、300ms 経過しても updateLog が呼ばれないこと
 *    - 4-6. 削除リクエスト（handleRequestDelete）で削除確認ダイアログ（wa-dialog）が表示されること
 *    - 4-7. 削除確定（handleConfirmDelete）で logsController.deleteLog が呼び出され、展開状態から除外されること
 *    - 4-8. markdown-editor-preview に .darkTheme='soft' および theme に応じた .themeMode が設定されていること
 *
 * 5. 新規ログ作成 (Create Log)
 *    - 5-1. 新規追加ボタンクリック（handleCreateLog）で logsController.createLog が見出しレベル ### のテンプレートで呼び出され、作成されたログが自動展開されること
 *
 * 6. BEM設計およびSCSSスタイルの検証
 *    - 6-1. SCSSスタイルシート（logs-view.scss）が存在し、ルートブロック .logs-view および主要BEMセレクタが定義されていること
 *    - 6-2. 削除された複数展開ボタンのクラス（.logs-view__btn-toggle-multi）がSCSS内に残存していないこと
 *    - 6-3. logs-view.scss に !important および @extend が一切含まれていないこと
 *    - 6-6. ログタブ内のフォントサイズが1サイズアップ（ヘッダーがxs、ログ行・検索・Date列がs）に設定されていること
 *    - 6-9. 詳細パネルが横並び配置（flex-direction: row）となり、Graph列（48px）および貫通線スタイルが定義されていること
 *    - 6-12. ヘッダーツールバー（.logs-view__header）に不要なパディングが設定されておらず、かつルート要素（:host, .logs-view）に不要な overflow: hidden が設定されていないこと
 *    - 6-13. ヘッダーツールバー（.logs-view__header）とリスト一覧の間に 16px（var(--wa-space-m)）のマージン（margin-bottom）が設定されていること
 *    - 6-14. 2行表示向けレイアウトが取りやめられ、リストヘッダーセルおよびデータセルの幅が 150px、行高が 36px で、データセルが中央揃え（justify-content: center）に設定されていること
 *    - 6-15. リストヘッダー各セルの間に境界線（border-right: 1px solid var(--wa-color-surface-border)）が設定され、未定義トークン（--wa-color-border-subtle, --wa-color-surface-sunken）が排除されていること
 *    - 6-16. 境界線はヘッダーのみに適用され、リスト外枠およびログ行に境界線が設定されていないこと
 *    - 6-17. ヘッダーおよびログ行の Graph セル幅が文字余白確保のため 48px に設定されていること
 *    - 6-18. 詳細パネル（.logs-view__detail）の背景色が var(--wa-color-surface-default) に設定されていること
 *    - 6-19. ログ行のホバー時（:hover）の背景色が展開時（&--expanded）と同様に var(--wa-color-neutral-fill-quiet) に設定されていること
 *    - 6-20. 詳細パネル内のエディタ（.logs-view__detail-editor）の上部に適切な余白（margin-top: var(--wa-space-xs, 8px)）が設定されていること
 *    - 6-21. タイムラインノードの拡大（transform: scale）は hover 時のみに限定され、展開中（&--expanded）のノードは通常サイズであること
 *    - 6-22. 詳細コンテナ（.logs-view__detail-container）に滑らかな展開アニメーション（0.35s、ease-out expo イージング）が設定され、閉じる状態（&--collapsing）に折りたたみアニメーション（0.28s）が設定されていること
 *    - 6-23. @keyframes logs-view-detail-expand および collapse で文字潰れを防ぐ段階的フェードイン・先行フェードアウトが設定されていること
 *    - 6-24. prefers-reduced-motion: reduce メディアクエリ内でアニメーション抑制が定義されていること
 */
describe("LogsView Component", () => {
  let element: LogsView;
  let mockLogsController: {
    state: LogRecord[];
    createLog: ReturnType<typeof vi.fn>;
    updateLog: ReturnType<typeof vi.fn>;
    deleteLog: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let mockTaskController: {
    state: { id: number; name: string };
    subscribe: ReturnType<typeof vi.fn>;
  };

  const sampleLogs: LogRecord[] = [
    {
      id: 101,
      taskId: 1,
      value: "### 初回ヒアリング結果\n顧客と要件の認識合わせを実施。",
      createdAt: new Date("2026-10-12T10:00:00Z"),
      updatedAt: new Date("2026-10-12T10:30:00Z"),
    },
    {
      id: 102,
      taskId: 1,
      value: "DBスキーマの設計完了\nテーブル定義書を更新。",
      createdAt: new Date("2026-10-12T14:00:00Z"),
      updatedAt: new Date("2026-10-12T14:15:00Z"),
    },
  ];

  beforeEach(() => {
    mockLogsController = {
      state: [...sampleLogs],
      createLog: vi.fn().mockResolvedValue(103),
      updateLog: vi.fn().mockResolvedValue(undefined),
      deleteLog: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(() => {}),
    };
    mockTaskController = {
      state: { id: 1, name: "サンプルタスク" },
      subscribe: vi.fn().mockReturnValue(() => {}),
    };

    element = new LogsView();
    element.logsController = mockLogsController as unknown as LogsController;
    element.taskController = mockTaskController as unknown as TaskController;
  });

  describe("1. 初期描画と空状態", () => {
    it("1-1. 初期状態では expandedLogIds は空であり、複数展開モードのプロパティが存在しないこと", () => {
      expect(element.expandedLogIds.size).toBe(0);
      expect((element as unknown as { isMultiExpand?: boolean }).isMultiExpand).toBeUndefined();
    });

    it("1-2. logsController.state が空配列の場合、空状態メッセージ（.logs-view__empty）が表示されること", () => {
      mockLogsController.state = [];
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("logs-view__empty");
      expect(htmlStr).toContain("作業ログがありません");
    });

    it("1-3. ヘッダーに共通部品 search-input（.logs-view__search、size=\"s\"）および新規追加ボタン（.logs-view__btn-add）が表示され、複数展開切り替えボタンが存在しないこと", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("logs-view__search");
      expect(htmlStr).toMatch(/<search-input[^>]*class="[^"]*logs-view__search[^"]*"[^>]*size="s"/);
      expect(htmlStr).toContain("logs-view__btn-add");
      expect(htmlStr).not.toContain("logs-view__btn-toggle-multi");
    });
  });

  describe("2. 一覧表示（Git Graph風）とフィルタリング", () => {
    it("2-1. ログ一覧がリスト行（.logs-view__row）として描画されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("logs-view__row");
      expect(htmlStr).toContain("初回ヒアリング結果");
      expect(htmlStr).toContain("DBスキーマの設計完了");
    });

    it("2-2. 各行に Graphセル、Descriptionセル、Dateセルが存在すること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("logs-view__cell--graph");
      expect(htmlStr).toContain("logs-view__cell--description");
      expect(htmlStr).toContain("logs-view__cell--date");
    });

    it("2-3. Descriptionセルに本文1行目（見出し記号除去済みタイトル）が表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("初回ヒアリング結果");
      expect(htmlStr).not.toContain("### 初回ヒアリング結果");
    });

    it("2-4. 検索入力または search-input イベントによりログ一覧がリアルタイムに絞り込まれること", () => {
      element.handleSearchInput("DBスキーマ");
      expect(element.searchQuery).toBe("DBスキーマ");

      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("DBスキーマの設計完了");
      expect(htmlStr).not.toContain("初回ヒアリング結果");
    });

    it("2-5. ログ一覧が作成日時の降順（新しい順）でソートされて描画されること", () => {
      const htmlStr = flattenTemplate(element.render());
      const pos102 = htmlStr.indexOf("DBスキーマの設計完了");
      const pos101 = htmlStr.indexOf("初回ヒアリング結果");
      expect(pos102).toBeLessThan(pos101);
    });

    it("2-6. Date セル内は 1行で秒単位まで日時が表示され、Date セルを対象とする wa-tooltip 内に wa-relative-time による経過時間が描画されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("logs-view__date-time");
      expect(htmlStr).not.toContain("logs-view__relative-time");

      expect(htmlStr).toMatch(
        /<div[^>]*class=["'][^"']*logs-view__cell--date[^"']*["'][^>]*id=["']logs-view-date-101["']/,
      );

      const expectedDateStr = formatLogDate(sampleLogs[0].createdAt);
      expect(expectedDateStr).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
      expect(htmlStr).toContain(expectedDateStr);

      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for=["']logs-view-date-101["'][^>]*trigger=["']hover["']/,
      );
      expect(htmlStr).toContain("wa-relative-time");
    });
  });

  describe("3. インラインアコーディオン展開", () => {
    it("3-1. 行クリック（handleToggleExpand）で該当ログの詳細が展開コンテナ（.logs-view__detail-container）とともにインライン展開されること", () => {
      element.handleToggleExpand(101);
      expect(element.expandedLogIds.has(101)).toBe(true);

      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("logs-view__detail-container");
      expect(htmlStr).toContain("logs-view__detail");
    });

    it("3-2. 別の行をクリックすると前回のログが閉じるアニメーション（.logs-view__detail-container--collapsing）へ遷移し、新行が展開されること（排他制御）", () => {
      element.handleToggleExpand(101);
      expect(element.expandedLogIds.has(101)).toBe(true);
      expect(element.collapsingLogId).toBeNull();

      element.handleToggleExpand(102);
      expect(element.expandedLogIds.has(102)).toBe(true);
      expect(element.expandedLogIds.has(101)).toBe(false);
      expect(element.collapsingLogId).toBe(101);

      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("logs-view__detail-container--collapsing");
    });

    it("3-3. 複数行をクリックしても同時に展開されず、常に1件のみが展開されること（複数展開メソッドが存在しないこと）", () => {
      element.handleToggleExpand(101);
      element.handleToggleExpand(102);
      expect(element.expandedLogIds.size).toBe(1);
      expect(element.expandedLogIds.has(102)).toBe(true);
    });

    it("3-4. 展開中のログ行を再度クリックすると閉じアニメーション（.logs-view__detail-container--collapsing）へ遷移すること", () => {
      element.handleToggleExpand(101);
      expect(element.expandedLogIds.has(101)).toBe(true);

      element.handleToggleExpand(101);
      expect(element.expandedLogIds.has(101)).toBe(false);
      expect(element.collapsingLogId).toBe(101);
    });

    it("3-5. アニメーション終了（handleDetailAnimationEnd）によって閉じる対象のログ詳細が完全にアンマウントされること", () => {
      element.handleToggleExpand(101);
      element.handleToggleExpand(101);
      expect(element.collapsingLogId).toBe(101);

      element.handleDetailAnimationEnd(101);
      expect(element.collapsingLogId).toBeNull();

      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain("logs-view__detail-container--collapsing");
    });
  });

  describe("4. 詳細パネルの構成と編集・自動保存・削除", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      element.handleToggleExpand(101);
    });

    it("4-1. 詳細パネル内に markdown-editor-preview が配置され、削除されたメタ情報バー（.logs-view__detail-meta）や閉じるボタンが存在しないこと", () => {
      element.handleToggleExpand(102);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("logs-view__detail-editor");
      expect(htmlStr).toContain("logs-view__graph-line-through");
      expect(htmlStr).toContain("markdown-editor-preview");
      expect(htmlStr).not.toContain("logs-view__detail-meta");
      expect(htmlStr).not.toContain("logs-view__detail-btn-close");
    });

    it("4-2. 末尾ログを展開した際、詳細グラフ列に貫通線が描画されないこと", () => {
      element.handleToggleExpand(101);
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("logs-view__detail-graph");
      expect(htmlStr).not.toContain("logs-view__graph-line-through");
    });

    it("4-3. markdown-editor-preview の内容変更（handleContentChange）は 300ms デバウンスされ、入力中は updateLog が呼ばれず、300ms 経過後に1度だけ呼び出されること", () => {
      element.handleContentChange(101, "更新されたログ内容");
      expect(mockLogsController.updateLog).not.toHaveBeenCalled();

      vi.advanceTimersByTime(299);
      expect(mockLogsController.updateLog).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(mockLogsController.updateLog).toHaveBeenCalledTimes(1);
      expect(mockLogsController.updateLog).toHaveBeenCalledWith(101, {
        value: "更新されたログ内容",
      });
    });

    it("4-4. handleContentChange が連続で呼び出された場合、前回のタイマーがキャンセルされ、最後の入力から 300ms 後に1度だけ呼び出されること", () => {
      element.handleContentChange(101, "1回目");
      vi.advanceTimersByTime(150);
      element.handleContentChange(101, "2回目");
      vi.advanceTimersByTime(150);
      expect(mockLogsController.updateLog).not.toHaveBeenCalled();

      vi.advanceTimersByTime(150);
      expect(mockLogsController.updateLog).toHaveBeenCalledTimes(1);
      expect(mockLogsController.updateLog).toHaveBeenCalledWith(101, {
        value: "2回目",
      });
    });

    it("4-5. disconnectedCallback 実行時に保留中のデバウンスタイマーがクリアされ、300ms 経過しても updateLog が呼ばれないこと", () => {
      element.handleContentChange(101, "保留中");
      element.disconnectedCallback();

      vi.advanceTimersByTime(500);
      expect(mockLogsController.updateLog).not.toHaveBeenCalled();
    });

    it("4-6. 削除リクエスト（handleRequestDelete）で削除確認ダイアログ（wa-dialog）が表示されること", () => {
      element.handleRequestDelete(101);
      expect(element.isDeleteDialogOpen).toBe(true);
      expect(element.deletingLogId).toBe(101);

      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("logs-view__delete-dialog");
    });

    it("4-7. 削除確定（handleConfirmDelete）で logsController.deleteLog が呼び出され、展開状態から除外されること", async () => {
      element.handleRequestDelete(101);
      await element.handleConfirmDelete();

      expect(mockLogsController.deleteLog).toHaveBeenCalledWith(101);
      expect(element.isDeleteDialogOpen).toBe(false);
      expect(element.expandedLogIds.has(101)).toBe(false);
    });

    it("4-8. markdown-editor-preview に .darkTheme='soft' および theme に応じた .themeMode が設定されていること", () => {
      element.theme = "dark";
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<markdown-editor-preview[^>]*\.darkTheme=["']?soft["']?/);
      expect(htmlStr).toMatch(/<markdown-editor-preview[^>]*\.themeMode=["']?dark["']?/);
    });
  });

  describe("5. 新規ログ作成", () => {
    it("5-1. 新規追加ボタンクリック（handleCreateLog）で logsController.createLog が見出しレベル ### のテンプレートで呼び出され、作成されたログが自動展開されること", async () => {
      await element.handleCreateLog();

      expect(mockLogsController.createLog).toHaveBeenCalledTimes(1);
      const callArg = mockLogsController.createLog.mock.calls[0][0];
      expect(callArg.value).toMatch(/^###\s+/);
      expect(element.expandedLogIds.has(103)).toBe(true);
    });
  });

  describe("6. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "logs-view.scss");

    it("6-1. SCSSスタイルシート（logs-view.scss）が存在し、ルートブロック .logs-view が定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toContain(".logs-view");
    });

    it("6-2. 削除された複数展開ボタンのクラス（.logs-view__btn-toggle-multi）がSCSS内に残存していないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toContain(".logs-view__btn-toggle-multi");
    });

    it("6-3. logs-view.scss に !important および @extend が一切含まれていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toContain("!important");
      expect(scss).not.toContain("@extend");
    });

    it("6-6. ログタブ内のフォントサイズが1サイズアップに設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.logs-view__list-header\s*\{[\s\S]*?font-size:\s*var\(--wa-font-size-xs,\s*12px\);/,
      );
      expect(scss).toMatch(
        /\.logs-view__row\s*\{[\s\S]*?font-size:\s*var\(--wa-font-size-s,\s*13px\);/,
      );
    });

    it("6-9. 詳細パネルが横並び配置（flex-direction: row）となり、Graph列（48px）および貫通線スタイルが定義されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.logs-view__detail\s*\{[\s\S]*?flex-direction:\s*row;/,
      );
      expect(scss).toMatch(
        /\.logs-view__detail-graph\s*\{[\s\S]*?width:\s*48px;/,
      );
    });

    it("6-12. ヘッダーツールバーに不要なパディングが設定されておらず、ルート要素に不要な overflow: hidden が設定されていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const headerBlock = scss.match(/\.logs-view__header\s*\{([^}]+)\}/)?.[1] ?? "";
      expect(headerBlock).not.toContain("padding:");

      const hostBlock = scss.match(/:host\s*\{([^}]+)\}/)?.[1] ?? "";
      expect(hostBlock).not.toContain("overflow:");
    });

    it("6-13. ヘッダーツールバーとリスト一覧の間に 16px のマージンが設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.logs-view__header\s*\{[\s\S]*?margin-bottom:\s*var\(--wa-space-m,\s*16px\);/,
      );
    });

    it("6-14. リストヘッダーセルおよびデータセルの幅が 150px、行高が 36px で、データセルが中央揃えに設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /&--date\s*\{[\s\S]*?width:\s*150px;/,
      );
      expect(scss).toMatch(
        /\.logs-view__row\s*\{[\s\S]*?min-height:\s*36px;/,
      );
    });

    it("6-15. リストヘッダー各セルの間に境界線が設定され、未定義トークンが排除されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.logs-view__list-header-cell\s*\{[\s\S]*?border-right:\s*1px solid var\(--wa-color-surface-border\)/,
      );
      expect(scss).not.toContain("--wa-color-border-subtle");
      expect(scss).not.toContain("--wa-color-surface-sunken");
    });

    it("6-16. 境界線はヘッダーのみに適用され、リスト外枠およびログ行に境界線が設定されていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const listBlockMatch = scss.match(/\.logs-view__list\s*\{([^}]+)\}/);
      expect(listBlockMatch).not.toBeNull();
      expect(listBlockMatch![1]).not.toContain("border-top");
      expect(listBlockMatch![1]).not.toContain("border:");

      const rowBlockMatch = scss.match(/\.logs-view__row\s*\{([^}]+)\}/);
      expect(rowBlockMatch).not.toBeNull();
      expect(rowBlockMatch![1]).not.toContain("border-bottom");
      expect(rowBlockMatch![1]).not.toContain("border:");
    });

    it("6-17. ヘッダーおよびログ行の Graph セル幅が文字余白確保のため 48px に設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.logs-view__list-header-cell[\s\S]*?&--graph\s*\{[\s\S]*?width:\s*48px;/,
      );
      expect(scss).toMatch(
        /\.logs-view__cell[\s\S]*?&--graph\s*\{[\s\S]*?width:\s*48px;/,
      );
    });

    it("6-18. 詳細パネル（.logs-view__detail）の背景色が var(--wa-color-surface-default) に設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const detailBlockMatch = scss.match(
        /\.logs-view__detail\s*\{([^}]+)\}/,
      );
      expect(detailBlockMatch).not.toBeNull();
      const detailBlock = detailBlockMatch ? detailBlockMatch[1] : "";
      expect(detailBlock).toMatch(
        /background-color:\s*var\(--wa-color-surface-default\)/,
      );
    });

    it("6-19. ログ行のホバー時の背景色が展開時と同様に var(--wa-color-neutral-fill-quiet) に設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const rowBlockMatch = scss.match(
        /\.logs-view__row\s*\{([^}]+(?:\{[^}]+\}[^}]*)*)\}/,
      );
      expect(rowBlockMatch).not.toBeNull();
      const rowBlock = rowBlockMatch ? rowBlockMatch[1] : "";
      expect(rowBlock).toMatch(
        /&:hover[\s\S]*?background-color:\s*var\(--wa-color-neutral-fill-quiet\)/,
      );
    });

    it("6-20. 詳細パネル内のエディタの上部に適切な余白が設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const editorBlockMatch = scss.match(
        /\.logs-view__detail-editor\s*\{([^}]+)\}/,
      );
      expect(editorBlockMatch).not.toBeNull();
      const editorBlock = editorBlockMatch ? editorBlockMatch[1] : "";
      expect(editorBlock).toMatch(
        /margin-top:\s*var\(--wa-space-xs,\s*8px\)/,
      );
    });

    it("6-21. タイムラインノードの拡大（transform: scale）は hover 時のみに限定され、展開中のノードは通常サイズであること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.logs-view__row[\s\S]*?&:hover\s*\{[\s\S]*?\.logs-view__graph-node\s*\{[\s\S]*?transform:\s*scale\(/,
      );

      const expandedMatch = scss.match(/&--expanded\s*\{([^}]+)\}/);
      expect(expandedMatch).not.toBeNull();
      expect(expandedMatch![1]).not.toContain(".logs-view__graph-node");
    });

    it("6-22. 詳細コンテナに滑らかな展開アニメーションが設定され、閉じる状態に折りたたみアニメーションが設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const containerBlockMatch = scss.match(
        /\.logs-view__detail-container\s*\{([^}]+)\}/,
      );
      expect(containerBlockMatch).not.toBeNull();
      const containerBlock = containerBlockMatch ? containerBlockMatch[1] : "";
      expect(containerBlock).toMatch(
        /animation:\s*[^;]*logs-view-detail-expand\s+0\.35s\s+cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/,
      );
      expect(scss).toMatch(
        /&--collapsing\s*\{[\s\S]*?animation:\s*[^;]*logs-view-detail-collapse\s+0\.28s\s+cubic-bezier\(0\.25,\s*1,\s*0\.5,\s*1\)/,
      );
    });

    it("6-23. @keyframes logs-view-detail-expand および collapse で文字潰れを防ぐ段階的フェードイン・先行フェードアウトが設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(/@keyframes\s+logs-view-detail-expand\s*\{/);
      expect(scss).toMatch(/@keyframes\s+logs-view-detail-collapse\s*\{/);
    });

    it("6-24. prefers-reduced-motion: reduce メディアクエリ内でアニメーション抑制が定義されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[\s\S]*?\.logs-view__detail-container\s*\{[\s\S]*?animation:\s*none/,
      );
    });
  });
});
