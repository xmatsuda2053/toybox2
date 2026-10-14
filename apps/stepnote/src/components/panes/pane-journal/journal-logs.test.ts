import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { LogRecord } from "@/db/models/journal.model";
import type { LogsController } from "@/controllers/logs.controller";
import type { TaskController } from "@/controllers/task.controller";
import { JournalLogs } from "./journal-logs";
import { formatLogDate } from "./journal-logs.utils";

/**
 * 【JournalLogs 仕様 (Logs タブコンポーネント)】
 *
 * 1. 初期描画と空状態 (Initial Render & Empty State)
 *    - 1-1. 初期状態では expandedLogIds は空であり、複数展開モードのプロパティが存在しないこと
 *    - 1-2. logsController.state が空配列の場合、空状態メッセージ（.journal-logs__empty）が表示されること
 *    - 1-3. ヘッダーに共通部品 search-input（.journal-logs__search、size="s"）および新規追加ボタン（.journal-logs__btn-add）が表示され、複数展開切り替えボタンが存在しないこと
 *
 * 2. 一覧表示（Git Graph風）とフィルタリング (List View & Filtering)
 *    - 2-1. ログ一覧がテーブル／リスト行（.journal-logs__row）として描画されること
 *    - 2-2. 各行に Graphセル（.journal-logs__cell--graph）、Descriptionセル（.journal-logs__cell--description）、Dateセル（.journal-logs__cell--date）が存在すること
 *    - 2-3. Descriptionセルに本文1行目（見出し記号除去済みタイトル）が表示されること
 *    - 2-4. 検索入力または search-input イベントによりログ一覧がリアルタイムに絞り込まれること
 *    - 2-5. ログ一覧が作成日時の降順（新しい順）でソートされて描画されること
 *    - 2-6. Date セル内は 1行で秒単位まで日時が表示され、Date セルを対象とする wa-tooltip 内に wa-relative-time による経過時間が描画されること
 *
 * 3. インラインアコーディオン展開 (Inline Accordion Expand)
 *    - 3-1. 行クリック（handleToggleExpand）で該当ログの詳細が展開コンテナ（.journal-logs__detail-container）とともにインライン展開されること
 *    - 3-2. 別の行をクリックすると前回のログが閉じるアニメーション（.journal-logs__detail-container--collapsing）へ遷移し、新行が展開されること（排他制御）
 *    - 3-3. 複数行をクリックしても同時に展開されず、常に1件のみが展開されること（複数展開メソッドが存在しないこと）
 *    - 3-4. 展開中のログ行を再度クリックすると閉じアニメーション（.journal-logs__detail-container--collapsing）へ遷移すること
 *    - 3-5. アニメーション終了（handleDetailAnimationEnd）によって閉じる対象のログ詳細が完全にアンマウントされること
 *
 * 4. 詳細パネルの構成と編集・自動保存・削除 (Detail Panel, Auto-save & Delete)
 *    - 4-1. 詳細パネル内にメタ情報バー（.journal-logs__detail-meta）および markdown-editor-preview が配置されること
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
 *    - 6-1. SCSSスタイルシート（journal-logs.scss）が存在し、ルートブロック .journal-logs および主要BEMセレクタが定義されていること
 *    - 6-2. 削除された複数展開ボタンのクラス（.journal-logs__btn-toggle-multi）がSCSS内に残存していないこと
 *    - 6-3. journal-logs.scss に !important および @extend が一切含まれていないこと
 *    - 6-6. ログタブ内のフォントサイズが1サイズアップ（ヘッダーがxs、ログ行・検索・Date列がs）に設定されていること
 *    - 6-9. 詳細パネルが横並び配置（flex-direction: row）となり、Graph列（48px）および貫通線スタイルが定義されていること
 *    - 6-12. ヘッダーツールバー（.journal-logs__header）に不要なパディングが設定されておらず、かつルート要素（:host, .journal-logs）に不要な overflow: hidden が設定されていないこと
 *    - 6-13. ヘッダーツールバー（.journal-logs__header）とリスト一覧の間に 16px（var(--wa-space-m)）のマージン（margin-bottom）が設定されていること
 *    - 6-14. 2行表示向けレイアウトが取りやめられ、リストヘッダーセルおよびデータセルの幅が 150px、行高が 36px で、データセルが中央揃え（justify-content: center）に設定されていること
 *    - 6-15. リストヘッダー各セルの間に境界線（border-right: 1px solid var(--wa-color-surface-border)）が設定され、未定義トークン（--wa-color-border-subtle, --wa-color-surface-sunken）が排除されていること
 *    - 6-16. 境界線はヘッダーのみに適用され、リスト外枠およびログ行に境界線が設定されていないこと
 *    - 6-17. ヘッダーおよびログ行の Graph セル幅が文字余白確保のため 48px に設定されていること
 *    - 6-18. 詳細パネル（.journal-logs__detail）の背景色が journal-pane と同じ var(--wa-color-surface-default) に設定されていること
 *    - 6-19. ログ行のホバー時（:hover）の背景色が展開時（&--expanded）と同様に var(--wa-color-neutral-fill-quiet) に設定されていること
 *    - 6-20. 詳細パネル内のエディタ（.journal-logs__detail-editor）の上部に適切な余白（margin-top: var(--wa-space-xs, 8px)）が設定されていること
 *    - 6-21. タイムラインノードの拡大（transform: scale）は hover 時のみに限定され、展開中（&--expanded）のノードは通常サイズであること
 *    - 6-22. 詳細コンテナ（.journal-logs__detail-container）に滑らかな展開アニメーション（0.35s、ease-out expo イージング）が設定され、閉じる状態（&--collapsing）に折りたたみアニメーション（0.28s）が設定されていること
 *    - 6-23. @keyframes journal-logs-detail-expand および collapse で文字潰れを防ぐ段階的フェードイン・先行フェードアウトが設定されていること
 *    - 6-24. prefers-reduced-motion: reduce メディアクエリ内でアニメーション抑制が定義されていること
 */
describe("JournalLogs Component", () => {
  let element: JournalLogs;
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

    element = new JournalLogs();
    element.logsController = mockLogsController as unknown as LogsController;
    element.taskController = mockTaskController as unknown as TaskController;
  });

  describe("1. 初期描画と空状態", () => {
    it("1-1. 初期状態では expandedLogIds は空であり、複数展開モードのプロパティが存在しないこと", () => {
      expect(element.expandedLogIds.size).toBe(0);
      expect(
        (element as unknown as { isMultipleExpandMode?: unknown })
          .isMultipleExpandMode,
      ).toBeUndefined();
      expect(element.searchQuery).toBe("");
    });

    it("1-2. logsController.state が空配列の場合、空状態メッセージが表示されること", () => {
      mockLogsController.state = [];
      const html = flattenTemplate(element.render());
      expect(html).toContain("journal-logs__empty");
      expect(html).toContain("作業ログがありません");
    });

    it("1-3. ヘッダーに共通部品 search-input（size='s'）およびアイコンボタン形式の新規追加ボタン（ツールチップ付き）が表示され、ボタンテキストを含まないこと", () => {
      const html = flattenTemplate(element.render());
      expect(html).toContain("journal-logs__header");
      expect(html).toContain("search-input");
      expect(html).toContain("journal-logs__search");
      expect(html).toMatch(/<search-input[^>]*class=["'][^"']*journal-logs__search[^"']*["']/);
      expect(html).toMatch(/<search-input[^>]*size=["']s["']/);
      expect(html).toMatch(/<search-input[^>]*placeholder=["']ログを検索\.\.\.["']/);
      expect(html).not.toMatch(/<wa-input[^>]*class=["'][^"']*journal-logs__search/);
      expect(html).toContain("journal-logs__btn-add");
      expect(html).toContain('id="journal-logs-btn-add"');
      expect(html).toContain('for="journal-logs-btn-add"');
      expect(html).toContain("新規ログを追加");
      expect(html).toContain('appearance="plain"');
      expect(html).toContain('variant="neutral"');
      expect(html).not.toMatch(/>\s*追加\s*<\/wa-button>/);
      expect(html).not.toContain("journal-logs__btn-toggle-multi");
    });
  });

  describe("2. 一覧表示（Git Graph風）とフィルタリング", () => {
    it("2-1. ログ一覧がリスト行（.journal-logs__row）として描画されること", () => {
      const html = flattenTemplate(element.render());
      expect(html).toContain("journal-logs__row");
      expect(html).toMatch(/data-log-id=["']?101["']?/);
      expect(html).toMatch(/data-log-id=["']?102["']?/);
    });

    it("2-2. 各行に Graphセル、Descriptionセル、Dateセルが存在すること", () => {
      const html = flattenTemplate(element.render());
      expect(html).toContain("journal-logs__cell--graph");
      expect(html).toContain("journal-logs__cell--description");
      expect(html).toContain("journal-logs__cell--date");
    });

    it("2-3. Descriptionセルに本文1行目の抽出タイトルが表示されること", () => {
      const html = flattenTemplate(element.render());
      expect(html).toContain("初回ヒアリング結果");
      expect(html).toContain("DBスキーマの設計完了");
    });

    it("2-4. 検索入力によりログ一覧がリアルタイムに絞り込まれること", () => {
      element.handleSearchInput("初回");
      let html = flattenTemplate(element.render());
      expect(html).toMatch(/data-log-id=["']?101["']?/);
      expect(html).not.toMatch(/data-log-id=["']?102["']?/);

      // search-input のカスタムイベント発火パターンも検証
      const event = new CustomEvent("search-input", {
        detail: { value: "DB", keyword: "DB" },
      });
      element.handleSearchInput(event as unknown as string);
      html = flattenTemplate(element.render());
      expect(html).not.toMatch(/data-log-id=["']?101["']?/);
      expect(html).toMatch(/data-log-id=["']?102["']?/);
    });

    it("2-5. ログ一覧が作成日時の降順（新しい順）でソートされて描画されること", () => {
      // mockLogsController.state は id: 101 (2026-10-12 10:00), id: 102 (2026-10-12 14:00) の順
      // 降順ソート後は新しい id: 102 が先頭、古い id: 101 が後続になる
      const html = flattenTemplate(element.render());
      const firstRowIndex = html.search(/data-log-id=["']?102["']?/);
      const secondRowIndex = html.search(/data-log-id=["']?101["']?/);
      expect(firstRowIndex).toBeGreaterThan(-1);
      expect(secondRowIndex).toBeGreaterThan(-1);
      expect(firstRowIndex).toBeLessThan(secondRowIndex);
    });

    it("2-6. Date セル内は 1行で秒単位まで日時が表示され、Date セルを対象とする wa-tooltip 内に wa-relative-time による経過時間が描画されること", () => {
      const html = flattenTemplate(element.render());
      // 2行用のクラスがセル内に存在しないこと
      expect(html).not.toContain("journal-logs__date-time");
      expect(html).not.toContain("journal-logs__relative-time");

      // Date セルに ID が付与されていること
      expect(html).toMatch(
        /<div[^>]*class=["'][^"']*journal-logs__cell--date[^"']*["'][^>]*id=["']journal-logs-date-101["']/,
      );

      // 秒単位までフォーマットされた日時が含まれていること
      const expectedDateStr = formatLogDate(sampleLogs[0].createdAt);
      expect(expectedDateStr).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
      expect(html).toContain(expectedDateStr);

      // wa-tooltip が Date セルを対象として設定され、その中に wa-relative-time が含まれていること
      expect(html).toMatch(
        /<wa-tooltip[^>]*for=["']journal-logs-date-101["'][^>]*trigger=["']hover["']/,
      );
      expect(html).toContain("wa-relative-time");
    });
  });

  describe("3. インラインアコーディオン展開", () => {
    it("3-1. 行クリックで該当ログの詳細が展開用コンテナ（.journal-logs__detail-container）とともに展開されること", () => {
      element.handleToggleExpand(101);
      expect(element.expandedLogIds.has(101)).toBe(true);

      const html = flattenTemplate(element.render());
      expect(html).toContain("journal-logs__detail-container");
      expect(html).toContain("journal-logs__detail");
      expect(html).toContain("markdown-editor-preview");
      expect(html).not.toContain("journal-logs__detail-container--collapsing");
    });

    it("3-2. 別の行をクリックすると前回のログが閉じるアニメーション（.journal-logs__detail-container--collapsing）へ遷移し、新行が展開されること", () => {
      element.handleToggleExpand(101);
      expect(element.expandedLogIds.has(101)).toBe(true);

      element.handleToggleExpand(102);
      expect(element.expandedLogIds.has(101)).toBe(false);
      expect(element.expandedLogIds.has(102)).toBe(true);

      const html = flattenTemplate(element.render());
      expect(html).toContain("journal-logs__detail-container--collapsing");
      expect(html).toContain("journal-logs__detail-container");
    });

    it("3-3. 複数行をクリックしても同時に展開されず、常に1件のみが展開されること（複数展開メソッドが存在しないこと）", () => {
      expect(
        (
          element as unknown as {
            handleToggleMultipleExpandMode?: unknown;
          }
        ).handleToggleMultipleExpandMode,
      ).toBeUndefined();

      element.handleToggleExpand(101);
      element.handleToggleExpand(102);
      expect(element.expandedLogIds.has(101)).toBe(false);
      expect(element.expandedLogIds.has(102)).toBe(true);
      expect(element.expandedLogIds.size).toBe(1);
    });

    it("3-4. 展開中のログ行を再度クリックすると閉じアニメーション（.journal-logs__detail-container--collapsing）へ遷移すること", () => {
      element.handleToggleExpand(101);
      expect(element.expandedLogIds.has(101)).toBe(true);

      element.handleToggleExpand(101);
      expect(element.expandedLogIds.has(101)).toBe(false);

      const html = flattenTemplate(element.render());
      expect(html).toContain("journal-logs__detail-container--collapsing");
    });

    it("3-5. アニメーション終了（handleDetailAnimationEnd）によって閉じる対象のログ詳細が完全にアンマウントされること", () => {
      element.handleToggleExpand(101);
      element.handleToggleExpand(101);

      let html = flattenTemplate(element.render());
      expect(html).toContain("journal-logs__detail-container--collapsing");

      element.handleDetailAnimationEnd(101);

      html = flattenTemplate(element.render());
      expect(html).not.toContain("journal-logs__detail-container");
      expect(html).not.toContain("journal-logs__detail");
    });
  });

  describe("4. 詳細パネルの構成と編集・自動保存・削除", () => {
    it("4-1. 詳細パネル内にグラフ継続列（.journal-logs__detail-graph）とエディタが配置され、エディタがGraph線に被らない構造であること", () => {
      // 降順ソートで先頭となる 102 (後続ログあり) を展開
      element.handleToggleExpand(102);
      const html = flattenTemplate(element.render());
      expect(html).toContain("journal-logs__detail");
      expect(html).toContain("journal-logs__detail-graph");
      expect(html).toContain("journal-logs__graph-line-through");
      expect(html).toContain("markdown-editor-preview");
      expect(html).not.toContain("journal-logs__detail-meta");
      expect(html).not.toContain("journal-logs__detail-btn-close");
    });

    it("4-2. 末尾ログを展開した際、詳細グラフ列に貫通線が描画されないこと", () => {
      // 降順ソートで末尾となる 101 (後続ログなし) を展開
      element.handleToggleExpand(101);
      const html = flattenTemplate(element.render());
      expect(html).toContain("journal-logs__detail-graph");
      expect(html).not.toContain("journal-logs__graph-line-through");
    });

    it("4-3. markdown-editor-preview の内容変更（handleContentChange）は 300ms デバウンスされ、入力中は updateLog が呼ばれず、300ms 経過後に1度だけ呼び出されること", () => {
      vi.useFakeTimers();
      try {
        element.handleContentChange(101, "更新後の内容");

        // 300ms 未満の時点では即座に updateLog は呼ばれないこと
        expect(mockLogsController.updateLog).not.toHaveBeenCalled();

        // 300ms 経過
        vi.advanceTimersByTime(300);

        expect(mockLogsController.updateLog).toHaveBeenCalledTimes(1);
        expect(mockLogsController.updateLog).toHaveBeenCalledWith(101, {
          value: "更新後の内容",
        });
      } finally {
        vi.useRealTimers();
      }
    });

    it("4-4. handleContentChange が連続で呼び出された場合、前回のタイマーがキャンセルされ、最後の入力から 300ms 後に1度だけ呼び出されること", () => {
      vi.useFakeTimers();
      try {
        element.handleContentChange(101, "文字1");
        vi.advanceTimersByTime(100);
        element.handleContentChange(101, "文字12");
        vi.advanceTimersByTime(100);
        element.handleContentChange(101, "文字123");

        // 最後の入力から 300ms 未満の時点ではまだ呼ばれていないこと
        expect(mockLogsController.updateLog).not.toHaveBeenCalled();

        // 最後の入力から 300ms 経過
        vi.advanceTimersByTime(300);

        expect(mockLogsController.updateLog).toHaveBeenCalledTimes(1);
        expect(mockLogsController.updateLog).toHaveBeenCalledWith(101, {
          value: "文字123",
        });
      } finally {
        vi.useRealTimers();
      }
    });

    it("4-5. disconnectedCallback 実行時に保留中のデバウンスタイマーがクリアされ、300ms 経過しても updateLog が呼ばれないこと", () => {
      vi.useFakeTimers();
      try {
        element.handleContentChange(101, "破棄前に入力");
        element.disconnectedCallback();

        vi.advanceTimersByTime(300);
        expect(mockLogsController.updateLog).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it("4-6. 削除リクエストで削除確認ダイアログが表示されること", () => {
      element.handleRequestDelete(101);
      expect(element.isDeleteDialogOpen).toBe(true);
      expect(element.deletingLogId).toBe(101);

      const html = flattenTemplate(element.render());
      expect(html).toContain("journal-logs__delete-dialog");
    });

    it("4-7. 削除確定で logsController.deleteLog が呼び出され、展開状態から除外されること", async () => {
      element.handleToggleExpand(101);
      element.handleRequestDelete(101);

      await element.handleConfirmDelete();
      expect(mockLogsController.deleteLog).toHaveBeenCalledWith(101);
      expect(element.isDeleteDialogOpen).toBe(false);
      expect(element.expandedLogIds.has(101)).toBe(false);
    });

    it("4-8. markdown-editor-preview に .darkTheme='soft' および theme に応じた .themeMode が設定され、リストとの重複を防ぐため .titleText が設定されていないこと", () => {
      element.theme = "dark";
      element.handleToggleExpand(101);
      let html = flattenTemplate(element.render());
      expect(html).toMatch(
        /<markdown-editor-preview[^>]*\.darkTheme=['"]?soft['"]?/,
      );
      expect(html).toMatch(
        /<markdown-editor-preview[^>]*\.themeMode=['"]?dark['"]?/,
      );
      // リスト側（Description列）にすでにタイトルが表示されているため、エディタに重複してタイトルが渡されていないこと
      expect(html).not.toMatch(
        /<markdown-editor-preview[^>]*\.titleText=['"]?初回ヒアリング結果['"]?/,
      );

      element.theme = "light";
      html = flattenTemplate(element.render());
      expect(html).toMatch(
        /<markdown-editor-preview[^>]*\.themeMode=['"]?light['"]?/,
      );
      expect(html).not.toMatch(
        /<markdown-editor-preview[^>]*\.titleText=['"]?初回ヒアリング結果['"]?/,
      );
    });
  });

  describe("5. 新規ログ作成", () => {
    it("5-1. 新規追加ボタンクリックで logsController.createLog が見出しレベル ### のテンプレートで呼び出され、自動展開されること", async () => {
      await element.handleCreateLog();
      expect(mockLogsController.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          value: expect.stringMatching(/^###\s+/),
        }),
      );
      expect(element.expandedLogIds.has(103)).toBe(true);
    });
  });

  describe("6. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "journal-logs.scss");

    it("6-1. SCSSスタイルシートが存在し、ルートブロック .journal-logs が定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toContain(".journal-logs");
      expect(scss).toContain(".journal-logs__header");
      expect(scss).toContain(".journal-logs__row");
      expect(scss).toContain(".journal-logs__detail");
    });

    it("6-2. 削除された複数展開ボタンのクラス（.journal-logs__btn-toggle-multi）がSCSS内に残存していないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toContain("journal-logs__btn-toggle-multi");
    });

    it("6-3. 削除された閉じるボタンおよびメタ情報バーのクラス（.journal-logs__detail-btn-close, .journal-logs__detail-meta）がSCSS内に残存していないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toContain("journal-logs__detail-btn-close");
      expect(scss).not.toContain("journal-logs__detail-meta");
    });

    it("6-4. journal-logs.scss に !important および @extend が一切含まれていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toContain("!important");
      expect(scss).not.toMatch(/@extend\b/);
    });

    it("6-5. journal-logs.scss 全体においてハードコードされたカラーコードが 0 件であること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const hexMatch = scss.match(/#[0-9a-fA-F]{3,8}\b/g);
      const rgbMatch = scss.match(/rgba?\([^)]+\)/g);
      expect(hexMatch).toBeNull();
      expect(rgbMatch).toBeNull();
    });

    it("6-6. ログタブ内のフォントサイズが1サイズアップ（ヘッダーがxs、ログ行・検索・Date列がs）に設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.journal-logs__row\s*\{[\s\S]*?font-size:\s*var\(--wa-font-size-s/,
      );
      expect(scss).toMatch(
        /\.journal-logs__list-header\s*\{[\s\S]*?font-size:\s*var\(--wa-font-size-xs/,
      );
      expect(scss).toMatch(
        /&--date\s*\{[\s\S]*?font-size:\s*var\(--wa-font-size-s/,
      );
    });

    it("6-7. タイムライングラフおよび詳細枠線に未定義の --wa-color-primary-base が使用されておらず、有効なセマンティックトークン（var(--label-icon-color)）が適用されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toContain("--wa-color-primary-base");
      expect(scss).toMatch(
        /\.journal-logs__graph-node\s*\{[\s\S]*?background-color:\s*var\(--label-icon-color\)/,
      );
      expect(scss).toMatch(
        /\.journal-logs__graph-line-top\s*\{[\s\S]*?background-color:\s*var\(--label-icon-color\)/,
      );
      expect(scss).toMatch(
        /\.journal-logs__graph-line-bottom\s*\{[\s\S]*?background-color:\s*var\(--label-icon-color\)/,
      );
    });

    it("6-8. タイムライングラフのノードが1サイズアップ（12px）に設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.journal-logs__graph-node\s*\{[\s\S]*?width:\s*12px;[\s\S]*?height:\s*12px;/,
      );
    });

    it("6-9. 詳細パネルが横並び配置（flex-direction: row）となり、Graph列（48px）および貫通線スタイルが定義されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.journal-logs__detail\s*\{[\s\S]*?flex-direction:\s*row/,
      );
      expect(scss).toMatch(
        /\.journal-logs__detail-graph\s*\{[\s\S]*?width:\s*48px/,
      );
      expect(scss).toMatch(
        /\.journal-logs__graph-line-through\s*\{[\s\S]*?background-color:\s*var\(--label-icon-color\)/,
      );
    });

    it("6-10. 詳細パネル（.journal-logs__detail）に不自然な下部境界線（border-bottom）が設定されていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const detailBlockMatch = scss.match(
        /\.journal-logs__detail\s*\{([^}]+)\}/,
      );
      expect(detailBlockMatch).not.toBeNull();
      const detailBlock = detailBlockMatch ? detailBlockMatch[1] : "";
      expect(detailBlock).not.toContain("border-bottom");
    });

    it("6-11. リストヘッダーの各セル（.journal-logs__list-header-cell）の文字列が中央揃え（text-align: center）に設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.journal-logs__list-header-cell\s*\{[\s\S]*?text-align:\s*center/,
      );
      expect(scss).not.toMatch(
        /&--date\s*\{[\s\S]*?text-align:\s*right/,
      );
    });

    it("6-12. ヘッダーツールバー（.journal-logs__header）に不要なパディングが設定されておらず、かつルート要素（:host, .journal-logs）に不要な overflow: hidden が設定されていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");

      // :host および .journal-logs に overflow: hidden が含まれていないこと
      const hostBlockMatch = scss.match(/:host\s*\{([^}]+)\}/);
      expect(hostBlockMatch).not.toBeNull();
      expect(hostBlockMatch![1]).not.toContain("overflow: hidden");

      const rootBlockMatch = scss.match(/\.journal-logs\s*\{([^}]+)\}/);
      expect(rootBlockMatch).not.toBeNull();
      expect(rootBlockMatch![1]).not.toContain("overflow: hidden");

      // .journal-logs__header に不要なパディングが残存していないこと
      const headerBlockMatch = scss.match(
        /\.journal-logs__header\s*\{([^}]+)\}/,
      );
      expect(headerBlockMatch).not.toBeNull();
      expect(headerBlockMatch![1]).not.toMatch(/padding:\s*var\(--wa-space/);
      expect(headerBlockMatch![1]).not.toMatch(/padding:\s*[1-9]/);
    });

    it("6-13. ヘッダーツールバー（.journal-logs__header）とリスト一覧の間に 16px（var(--wa-space-m)）のマージン（margin-bottom）が設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const headerBlockMatch = scss.match(
        /\.journal-logs__header\s*\{([^}]+)\}/,
      );
      expect(headerBlockMatch).not.toBeNull();
      expect(headerBlockMatch![1]).toMatch(
        /margin-bottom:\s*var\(--wa-space-m,\s*16px\);?/,
      );
    });

    it("6-14. 2行表示向けレイアウトが取りやめられ、リストヘッダーセルおよびデータセルの幅が 150px、行高が 36px で、データセルが中央揃え（justify-content: center）に設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.journal-logs__list-header-cell[\s\S]*?&--date\s*\{[\s\S]*?width:\s*150px;/,
      );
      const dateCellMatch = scss.match(
        /\.journal-logs__cell[\s\S]*?&--date\s*\{([^}]+)\}/,
      );
      expect(dateCellMatch).not.toBeNull();
      expect(dateCellMatch![1]).toMatch(/width:\s*150px;/);
      expect(dateCellMatch![1]).toMatch(/justify-content:\s*center;/);
      expect(dateCellMatch![1]).not.toMatch(/justify-content:\s*flex-end;/);
      expect(dateCellMatch![1]).not.toMatch(/padding-right:\s*var\(--wa-space-xs/);
      expect(scss).toMatch(
        /\.journal-logs__row\s*\{[\s\S]*?min-height:\s*36px;/,
      );
      expect(scss).not.toMatch(
        /&--date\s*\{[^}]*flex-direction:\s*column/,
      );
      expect(scss).not.toContain(".journal-logs__date-time");
      expect(scss).not.toContain(".journal-logs__relative-time");
    });

    it("6-15. リストヘッダー各セルの間に境界線（border-right: 1px solid var(--wa-color-surface-border)）が設定され、未定義の無効トークン（--wa-color-border-subtle, --wa-color-surface-sunken）が使用されていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.journal-logs__list-header-cell\s*\{[\s\S]*?border-right:\s*1px solid var\(--wa-color-surface-border\)/,
      );
      expect(scss).not.toContain("--wa-color-border-subtle");
      expect(scss).not.toContain("--wa-color-surface-sunken");
    });

    it("6-16. 境界線はヘッダーのみに適用され、リスト外枠（.journal-logs__list）および各ログ行（.journal-logs__row）に境界線が設定されていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const listBlockMatch = scss.match(/\.journal-logs__list\s*\{([^}]+)\}/);
      expect(listBlockMatch).not.toBeNull();
      expect(listBlockMatch![1]).not.toContain("border-top");
      expect(listBlockMatch![1]).not.toContain("border:");

      const rowBlockMatch = scss.match(/\.journal-logs__row\s*\{([^}]+)\}/);
      expect(rowBlockMatch).not.toBeNull();
      expect(rowBlockMatch![1]).not.toContain("border-bottom");
      expect(rowBlockMatch![1]).not.toContain("border:");
    });

    it("6-17. ヘッダーおよびログ行の Graph セル幅が文字余白確保のため 48px に設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /\.journal-logs__list-header-cell[\s\S]*?&--graph\s*\{[\s\S]*?width:\s*48px;/,
      );
      expect(scss).toMatch(
        /\.journal-logs__cell[\s\S]*?&--graph\s*\{[\s\S]*?width:\s*48px;/,
      );
    });

    it("6-18. 詳細パネル（.journal-logs__detail）の背景色が journal-pane と同じ var(--wa-color-surface-default) に設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const detailBlockMatch = scss.match(
        /\.journal-logs__detail\s*\{([^}]+)\}/,
      );
      expect(detailBlockMatch).not.toBeNull();
      const detailBlock = detailBlockMatch ? detailBlockMatch[1] : "";
      expect(detailBlock).toMatch(
        /background-color:\s*var\(--wa-color-surface-default\)/,
      );
    });

    it("6-19. ログ行のホバー時（:hover）の背景色が展開時（&--expanded）と同様に var(--wa-color-neutral-fill-quiet) に設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const rowBlockMatch = scss.match(
        /\.journal-logs__row\s*\{([^}]+(?:\{[^}]+\}[^}]*)*)\}/,
      );
      expect(rowBlockMatch).not.toBeNull();
      const rowBlock = rowBlockMatch ? rowBlockMatch[1] : "";
      expect(rowBlock).toMatch(
        /&:hover[\s\S]*?background-color:\s*var\(--wa-color-neutral-fill-quiet\)/,
      );
    });

    it("6-20. 詳細パネル内のエディタ（.journal-logs__detail-editor）の上部に適切な余白（margin-top: var(--wa-space-xs, 8px)）が設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const editorBlockMatch = scss.match(
        /\.journal-logs__detail-editor\s*\{([^}]+)\}/,
      );
      expect(editorBlockMatch).not.toBeNull();
      const editorBlock = editorBlockMatch ? editorBlockMatch[1] : "";
      expect(editorBlock).toMatch(
        /margin-top:\s*var\(--wa-space-xs,\s*8px\)/,
      );
    });

    it("6-21. タイムラインノードの拡大（transform: scale）は hover 時のみに限定され、展開中（&--expanded）のノードは通常サイズであること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const nodeBlockMatch = scss.match(
        /(?:^|\n)\.journal-logs__graph-node\s*\{([^}]+)\}/,
      );
      expect(nodeBlockMatch).not.toBeNull();
      const nodeBlock = nodeBlockMatch ? nodeBlockMatch[1] : "";
      expect(nodeBlock).toMatch(/transition:\s*[^;]*transform/);

      // hover 時にノードのスケールアップが定義されていること
      expect(scss).toMatch(
        /\.journal-logs__row[\s\S]*?&:hover\s*\{[\s\S]*?\.journal-logs__graph-node\s*\{[\s\S]*?transform:\s*scale\(/,
      );

      // expanded のブロック内に .journal-logs__graph-node が定義されていないこと
      const expandedMatch = scss.match(/&--expanded\s*\{([^}]+)\}/);
      expect(expandedMatch).not.toBeNull();
      expect(expandedMatch![1]).not.toContain(".journal-logs__graph-node");
      expect(scss).not.toMatch(
        /&:hover\s*,\s*&--expanded\s*\{[^}]*?\.journal-logs__graph-node/,
      );
    });

    it("6-22. 詳細コンテナ（.journal-logs__detail-container）に滑らかな展開アニメーション（0.35s、ease-out expo イージング）が設定され、閉じる状態（&--collapsing）に折りたたみアニメーション（0.28s）が設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const containerBlockMatch = scss.match(
        /\.journal-logs__detail-container\s*\{([^}]+)\}/,
      );
      expect(containerBlockMatch).not.toBeNull();
      const containerBlock = containerBlockMatch ? containerBlockMatch[1] : "";
      expect(containerBlock).toMatch(/display:\s*grid/);
      expect(containerBlock).toMatch(/overflow:\s*hidden/);
      // 0.35s および cubic-bezier(0.16, 1, 0.3, 1) の指定を検証
      expect(containerBlock).toMatch(
        /animation:\s*[^;]*journal-logs-detail-expand\s+0\.35s\s+cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/,
      );

      // 閉じる状態の 0.28s および cubic-bezier(0.25, 1, 0.5, 1) の指定を検証
      expect(scss).toMatch(
        /&--collapsing\s*\{[\s\S]*?animation:\s*[^;]*journal-logs-detail-collapse\s+0\.28s\s+cubic-bezier\(0\.25,\s*1,\s*0\.5,\s*1\)/,
      );
    });

    it("6-23. @keyframes journal-logs-detail-expand および collapse で文字潰れを防ぐ段階的フェードイン・先行フェードアウトが設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(/@keyframes\s+journal-logs-detail-expand\s*\{/);
      expect(scss).toMatch(/@keyframes\s+journal-logs-detail-collapse\s*\{/);

      // expand 時に中間段階（30% 付近）で opacity が抑えられていること（潰れ防止）
      expect(scss).toMatch(
        /@keyframes\s+journal-logs-detail-expand\s*\{[\s\S]*?30%\s*\{[\s\S]*?opacity:/,
      );

      // collapse 時に初期段階（35% 付近）で opacity: 0 となる先行フェードアウトが設定されていること
      expect(scss).toMatch(
        /@keyframes\s+journal-logs-detail-collapse\s*\{[\s\S]*?35%\s*\{[\s\S]*?opacity:\s*0;/,
      );
    });

    it("6-24. prefers-reduced-motion: reduce メディアクエリ内でアニメーション抑制が定義されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(
        /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[\s\S]*?\.journal-logs__detail-container\s*\{[\s\S]*?animation:\s*none/,
      );
    });
  });
});
