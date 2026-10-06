import "fake-indexeddb/auto";
import * as fs from "node:fs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { TaskRecord } from "@/db/models/task.model";
import { TaskListItem } from "./task-list-item.js";

/**
 * 【TaskListItem 仕様 (2行レイアウト: ヘッダ部・メタ部)】
 *
 * 1. 2行レイアウトおよび基本構造レンダリング
 *    - 1-1. ルート要素 .task-list-item 内に 2行のブロック（1行目: .task-list-item__row--header、2行目: .task-list-item__row--meta）がレンダリングされ、旧3行目（.task-list-item__row--footer）が存在しないこと
 *    - 1-2. 選択状態（selected: true）のとき、モディファイア .task-list-item--selected が付与されること
 *
 * 2. 1行目（ヘッダ部: アイコン、タスク名、Issue件数）
 *    - 2-1. ステータスコードに応じたアイコン（0: circle-stop-solid-full, 5: circle-play-solid-full, 9: circle-check-solid-full）がレンダリングされること
 *    - 2-2. ステータスコードに応じたステータスアイコン修飾子クラス（0: task-list-item__status-icon--pending, 5: task-list-item__status-icon--progress, 9: task-list-item__status-icon--done）が付与されること
 *    - 2-3. タスク名（.task-list-item__title）が正しく描画されること
 *    - 2-4. Issue件数・進捗（issuesDone / issuesTotal）が 1行目（.task-list-item__row--header）内に表示されること
 *
 * 3. 2行目（メタ部: ブックマークボタン、期限日および期限状態、所属ラベル）
 *    - 3-1. ブックマークボタン（.task-list-item__btn-bookmark）が 2行目に配置され、bookmark: true のときアクティブ状態となること
 *    - 3-2. 期限日（.task-list-item__due-date）が yy-MM-dd 形式で表示されること
 *    - 3-3. 期限の状態に応じた期限アイコン（fire-solid-full等）および修飾子クラス（--overdue等）がレンダリングされること
 *    - 3-4. labelName が指定されている場合、ラベル要素（.task-list-item__label）にラベル名が表示されること
 *    - 3-5. labelName が未指定（空）の場合、フォールバック（未分類）が表示されること
 *    - 3-6. 垂直ディバイダー（wa-divider[orientation="vertical"]）が区切りとしてレンダリングされること
 *    - 3-7. 期限情報表示において、期限アイコン（.task-list-item__due-icon）が期限日（.task-list-item__due-date）の直前に配置されていること（アイコン > ラベルの順序）
 *
 * 4. ユーザーインタラクションとカスタムイベント発火
 *    - 4-1. アイテム本体のクリック時に task-select カスタムイベント（detail: { taskId }）がディスパッチされること
 *    - 4-2. ブックマークボタンのクリック時に event.stopPropagation() が実行され、bookmark-toggle カスタムイベント（detail: { taskId, currentBookmark }）がディスパッチされること
 *
 * 5. BEM設計およびSCSSスタイルの検証
 *    - 5-1. SCSSスタイルシート（task-list-item.scss）が存在し、ルートブロック .task-list-item および主要BEMセレクタが定義されていること
 *    - 5-2. テーマ切替トランジション等のCSS変数指定（var(--stepnote-transition-theme)）が定義されていること
 *    - 5-3. 垂直ディバイダー（.task-list-item__divider）に選択時でも視認可能なカラー（--wa-color-text-quiet）と高さが定義されていること
 *    - 5-4. task-list-item.scss に !important 宣言が一切含まれていないこと
 *    - 5-5. ブックマークアイコンのアクティブ状態に !important を用いずカラーが定義されていること
 *    - 5-6. 基本色（ボーダー、サーフェス、テキスト、ニュートラル背景、ホバー色）に直値カラーフォールバックが含まれず、セマンティックトークン（var(--wa-color-*)）が指定されていること
 *    - 5-7. 状態アイコン・ブックマーク・期限アイコン・選択境界線において、アクセント・状態カラーのフォールバック直値が一切含まれず、セマンティックトークンで定義されていること
 *    - 5-8. task-list-item.scss 全体においてハードコードされたカラーコード（#[0-9a-fA-F]{3,8}, rgba(...)）が 0 件（完全ゼロ）であること
 */
describe("TaskListItem Component", () => {
  let element: TaskListItem;
  const baseTask: TaskRecord = {
    id: 101,
    name: "仕様書を作成する",
    statusCode: 0,
    dueDate: new Date("2026-05-15"),
    contacts: [],
    description: "テストタスクの詳細",
    fiscalYear: 2026,
    labelId: 1,
    bookmark: false,
    selected: false,
  };

  beforeEach(() => {
    element = new TaskListItem();
    element.task = { ...baseTask };
    element.labelName = "企画開発";
    element.issuesDone = 2;
    element.issuesTotal = 5;
  });

  describe("1. 2行レイアウトおよび基本構造レンダリング", () => {
    it("1-1. ルート要素 .task-list-item 内に 2行のブロックがレンダリングされ、旧3行目が存在しないこと", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-list-item");
      expect(htmlStr).toContain("task-list-item__row--header");
      expect(htmlStr).toContain("task-list-item__row--meta");
      expect(htmlStr).not.toContain("task-list-item__row--footer");
    });

    it("1-2. 選択状態（selected: true）のとき、モディファイア .task-list-item--selected が付与されること", () => {
      element.task = { ...baseTask, selected: true };
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-list-item--selected");
    });
  });

  describe("2. 1行目（ヘッダ部: アイコン、タスク名、Issue件数）", () => {
    it("2-1. ステータスコードに応じたアイコンがレンダリングされること", () => {
      // 0: 開始待ち
      element.task = { ...baseTask, statusCode: 0 };
      expect(flattenTemplate(element.render())).toContain("circle-stop-solid-full");

      // 5: 対応中
      element.task = { ...baseTask, statusCode: 5 };
      expect(flattenTemplate(element.render())).toContain("circle-play-solid-full");

      // 9: 完了
      element.task = { ...baseTask, statusCode: 9 };
      expect(flattenTemplate(element.render())).toContain("circle-check-solid-full");
    });

    it("2-2. ステータスコードに応じたステータスアイコン修飾子クラスが付与されること", () => {
      // 0: 開始待ち
      element.task = { ...baseTask, statusCode: 0 };
      expect(flattenTemplate(element.render())).toContain("task-list-item__status-icon--pending");

      // 5: 対応中
      element.task = { ...baseTask, statusCode: 5 };
      expect(flattenTemplate(element.render())).toContain("task-list-item__status-icon--progress");

      // 9: 完了
      element.task = { ...baseTask, statusCode: 9 };
      expect(flattenTemplate(element.render())).toContain("task-list-item__status-icon--done");
    });

    it("2-3. タスク名（.task-list-item__title）が正しく描画されること", () => {
      element.task = { ...baseTask, name: "サンプルタスク表示テスト" };
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-list-item__title");
      expect(htmlStr).toContain("サンプルタスク表示テスト");
    });

    it("2-4. Issue件数・進捗（issuesDone / issuesTotal）が 1行目の末尾に配置されていること", () => {
      element.issuesDone = 3;
      element.issuesTotal = 8;
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-list-item__issues-progress");
      expect(htmlStr).toContain("3/8");

      // 1行目ブロック内に issues-progress が含まれていること
      const headerIndex = htmlStr.indexOf("task-list-item__row--header");
      const metaIndex = htmlStr.indexOf("task-list-item__row--meta");
      const progressIndex = htmlStr.indexOf("task-list-item__issues-progress");
      expect(progressIndex).toBeGreaterThan(headerIndex);
      expect(progressIndex).toBeLessThan(metaIndex);
    });
  });

  describe("3. 2行目（メタ部: ブックマークボタン、期限日および期限状態、所属ラベル）", () => {
    it("3-1. ブックマークボタン（.task-list-item__btn-bookmark）が 2行目に配置され、bookmark: true のときアクティブ状態となること", () => {
      element.task = { ...baseTask, bookmark: true };
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-list-item__btn-bookmark");
      expect(htmlStr).toContain("bookmark-solid-full");
      expect(htmlStr).toContain("task-list-item__btn-bookmark--active");

      const metaIndex = htmlStr.indexOf("task-list-item__row--meta");
      const bookmarkIndex = htmlStr.indexOf("task-list-item__btn-bookmark");
      expect(bookmarkIndex).toBeGreaterThan(metaIndex);
    });

    it("3-2. 期限日（.task-list-item__due-date）が yy-MM-dd 形式で表示されること", () => {
      element.task = { ...baseTask, dueDate: new Date("2026-05-15") };
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-list-item__due-date");
      expect(htmlStr).toContain("26-05-15");
    });

    it("3-3. 期限の状態に応じた期限アイコンおよび修飾子クラスがレンダリングされること", () => {
      // 過去日付（期限切れ）
      element.task = { ...baseTask, dueDate: new Date("2020-01-01") };
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("fire-solid-full");
      expect(htmlStr).toContain("task-list-item__due-icon--overdue");
    });

    it("3-4. labelName が指定されている場合、ラベル要素（.task-list-item__label）にラベル名が表示されること", () => {
      element.labelName = "重要プロジェクト";
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-list-item__label");
      expect(htmlStr).toContain("重要プロジェクト");
    });

    it("3-5. labelName が未指定（空）の場合、フォールバック（未分類）が表示されること", () => {
      element.labelName = "";
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("task-list-item__label");
      expect(htmlStr).toContain("未分類");
    });

    it("3-6. 垂直ディバイダー（wa-divider[orientation='vertical']）が区切りとしてレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toContain("<wa-divider");
      expect(htmlStr).toContain('orientation="vertical"');
      expect(htmlStr).toContain("task-list-item__divider");
      expect(htmlStr).not.toContain("task-list-item__divider\">|");
    });

    it("3-7. 期限情報表示において、期限アイコン（.task-list-item__due-icon）が期限日（.task-list-item__due-date）の直前に配置されていること", () => {
      element.task = { ...baseTask, dueDate: new Date("2026-05-15") };
      const htmlStr = flattenTemplate(element.render());

      const dueIconIndex = htmlStr.indexOf("task-list-item__due-icon");
      const dueDateIndex = htmlStr.indexOf("task-list-item__due-date");

      expect(dueIconIndex).toBeGreaterThan(-1);
      expect(dueDateIndex).toBeGreaterThan(-1);
      // アイコンが日付よりも前に出現すること
      expect(dueIconIndex).toBeLessThan(dueDateIndex);
    });
  });

  describe("4. ユーザーインタラクションとカスタムイベント発火", () => {
    it("4-1. アイテム本体のクリック時に task-select カスタムイベントがディスパッチされること", () => {
      const selectMock = vi.fn();
      element.addEventListener("task-select", (e: Event) => {
        const customEvent = e as CustomEvent<{ taskId: number }>;
        selectMock(customEvent.detail);
      });

      element.handleCardClick();

      expect(selectMock).toHaveBeenCalledTimes(1);
      expect(selectMock).toHaveBeenCalledWith({ taskId: 101 });
    });

    it("4-2. ブックマークボタンのクリック時に event.stopPropagation() が実行され、bookmark-toggle カスタムイベントがディスパッチされること", () => {
      const bookmarkMock = vi.fn();
      element.addEventListener("bookmark-toggle", (e: Event) => {
        const customEvent = e as CustomEvent<{ taskId: number; bookmark: boolean }>;
        bookmarkMock(customEvent.detail);
      });

      const stopPropagationMock = vi.fn();
      const dummyEvent = {
        stopPropagation: stopPropagationMock,
      } as unknown as MouseEvent;

      element.handleBookmarkClick(dummyEvent);

      expect(stopPropagationMock).toHaveBeenCalledTimes(1);
      expect(bookmarkMock).toHaveBeenCalledTimes(1);
      expect(bookmarkMock).toHaveBeenCalledWith({ taskId: 101, bookmark: false });
    });
  });

  describe("5. BEM設計およびSCSSスタイルの検証", () => {
    it("5-1. SCSSスタイルシート（task-list-item.scss）が存在し、ルートブロックおよび主要BEMセレクタが定義されていること", () => {
      const scssPath = new URL("./task-list-item.scss", import.meta.url).pathname;
      const normalizedPath =
        process.platform === "win32" && scssPath.startsWith("/")
          ? scssPath.slice(1)
          : scssPath;
      expect(fs.existsSync(normalizedPath)).toBe(true);

      const content = fs.readFileSync(normalizedPath, "utf-8");
      expect(content).toContain(".task-list-item");
      expect(content).toContain(".task-list-item__row");
      expect(content).toContain(".task-list-item__title");
    });

    it("5-2. テーマ切替トランジション等のCSS変数指定（var(--stepnote-transition-theme)）が定義されていること", () => {
      const scssPath = new URL("./task-list-item.scss", import.meta.url).pathname;
      const normalizedPath =
        process.platform === "win32" && scssPath.startsWith("/")
          ? scssPath.slice(1)
          : scssPath;
      expect(fs.existsSync(normalizedPath)).toBe(true);

      const content = fs.readFileSync(normalizedPath, "utf-8");
      expect(content).toContain("--stepnote-transition-theme");
    });

    it("5-3. 垂直ディバイダー（.task-list-item__divider）に選択時でも視認可能なカラー（--wa-color-text-quiet）と高さが定義されていること", () => {
      const scssPath = new URL("./task-list-item.scss", import.meta.url).pathname;
      const normalizedPath =
        process.platform === "win32" && scssPath.startsWith("/")
          ? scssPath.slice(1)
          : scssPath;
      expect(fs.existsSync(normalizedPath)).toBe(true);

      const content = fs.readFileSync(normalizedPath, "utf-8");
      expect(content).toContain(".task-list-item__divider");
      expect(content).toMatch(/\.task-list-item__divider\s*\{[^}]*--color:\s*var\(--wa-color-text-quiet/);
    });

    it("5-4. task-list-item.scss に !important 宣言が一切含まれていないこと", () => {
      const scssPath = new URL("./task-list-item.scss", import.meta.url).pathname;
      const normalizedPath =
        process.platform === "win32" && scssPath.startsWith("/")
          ? scssPath.slice(1)
          : scssPath;
      const content = fs.readFileSync(normalizedPath, "utf-8");
      expect(content).not.toContain("!important");
    });

    it("5-5. ブックマークアイコンのアクティブ状態に !important を用いずカラーが定義されていること", () => {
      const scssPath = new URL("./task-list-item.scss", import.meta.url).pathname;
      const normalizedPath =
        process.platform === "win32" && scssPath.startsWith("/")
          ? scssPath.slice(1)
          : scssPath;
      const content = fs.readFileSync(normalizedPath, "utf-8");
      expect(content).toMatch(
        /\.task-list-item__bookmark-icon--active\s*\{[^}]*color:\s*var\(--quick-access-icon-active-bookmark/,
      );
      expect(content).not.toMatch(
        /\.task-list-item__bookmark-icon--active\s*\{[^}]*!important/,
      );
    });

    it("5-6. 基本色（ボーダー、サーフェス、テキスト、ニュートラル背景、ホバー色）に直値カラーフォールバックが含まれず、セマンティックトークン（var(--wa-color-*)）が指定されていること", () => {
      const scssPath = new URL("./task-list-item.scss", import.meta.url).pathname;
      const normalizedPath =
        process.platform === "win32" && scssPath.startsWith("/")
          ? scssPath.slice(1)
          : scssPath;
      const content = fs.readFileSync(normalizedPath, "utf-8");

      // 基本色直値がフォールバックとして残存していないこと
      const rawBasicColors = [
        "#d0d7de",
        "#f1f2f3",
        "#1f2328",
        "#e2e5e8",
        "#d8dce0",
        "#c2c7cd",
        "#57606a",
      ];
      for (const col of rawBasicColors) {
        expect(content).not.toContain(col);
      }

      // セマンティックトークンが正しく指定されていること
      expect(content).toMatch(/border:\s*1px solid var\(--wa-color-surface-border\);/);
      expect(content).toMatch(/background-color:\s*var\(--wa-color-surface-default\);/);
      expect(content).toMatch(/color:\s*var\(--wa-color-text-normal\);/);
      expect(content).toMatch(/background-color:\s*var\(--wa-color-neutral-fill-quiet\);/);
      expect(content).toMatch(/background-color:\s*var\(--wa-color-neutral-fill-normal\);/);
      expect(content).toMatch(/background-color:\s*var\(--wa-color-neutral-fill-normal-hover\);/);
      expect(content).toMatch(/color:\s*var\(--wa-color-text-quiet\);/);
    });

    it("5-7. 状態アイコン・ブックマーク・期限アイコン・選択境界線において、アクセント・状態カラーのフォールバック直値が一切含まれず、セマンティックトークンで定義されていること", () => {
      const scssPath = new URL("./task-list-item.scss", import.meta.url).pathname;
      const normalizedPath =
        process.platform === "win32" && scssPath.startsWith("/")
          ? scssPath.slice(1)
          : scssPath;
      const content = fs.readFileSync(normalizedPath, "utf-8");

      // アクセント・状態カラー直値がフォールバックとして残存していないこと
      const rawAccentColors = [
        "#0969da",
        "#000000",
        "#1a7f37",
        "#4f46e5",
        "#cf222e",
        "#9a6700",
        "#1b7c83",
      ];
      for (const col of rawAccentColors) {
        expect(content).not.toContain(col);
      }

      // セマンティックトークンが正しく指定されていること
      expect(content).toMatch(/border-color:\s*var\(--wa-color-brand-60\);/);
      expect(content).toMatch(/border-left:\s*3px solid var\(--wa-color-brand-60\);/);
      expect(content).toMatch(/color:\s*var\(--quick-access-icon-pending\);/);
      expect(content).toMatch(/color:\s*var\(--quick-access-icon-progress\);/);
      expect(content).toMatch(/color:\s*var\(--quick-access-icon-done\);/);
      expect(content).toMatch(/color:\s*var\(--quick-access-icon-active-bookmark\);/);
      expect(content).toMatch(/color:\s*var\(--quick-access-icon-overdue\);/);
      expect(content).toMatch(/color:\s*var\(--quick-access-icon-asap\);/);
      expect(content).toMatch(/color:\s*var\(--quick-access-icon-upcoming\);/);
    });

    it("5-8. task-list-item.scss 全体においてハードコードされたカラーコード（#[0-9a-fA-F]{3,8}, rgba(...)）が 0 件（完全ゼロ）であること", () => {
      const scssPath = new URL("./task-list-item.scss", import.meta.url).pathname;
      const normalizedPath =
        process.platform === "win32" && scssPath.startsWith("/")
          ? scssPath.slice(1)
          : scssPath;
      const content = fs.readFileSync(normalizedPath, "utf-8");
      const colorMatches = content.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^\)]+\)|hsla?\([^\)]+\))/g);
      expect(colorMatches).toBeNull();
    });
  });

  describe("6. 内部描画メソッド分割（renderHeaderRow / renderMetaRow）の検証", () => {
    it("6-1. renderHeaderRow によりヘッダー行（ステータス・タイトル・進捗）が正しくレンダリングされること", () => {
      const htmlStr = flattenTemplate(
        (
          element as unknown as {
            renderHeaderRow: () => unknown;
          }
        ).renderHeaderRow(),
      );
      expect(htmlStr).toContain("task-list-item__row--header");
      expect(htmlStr).toContain("task-list-item__title");
    });

    it("6-2. renderMetaRow によりメタ行（ブックマーク・期限・ラベル）が正しくレンダリングされること", () => {
      const htmlStr = flattenTemplate(
        (
          element as unknown as {
            renderMetaRow: () => unknown;
          }
        ).renderMetaRow(),
      );
      expect(htmlStr).toContain("task-list-item__row--meta");
      expect(htmlStr).toContain("task-list-item__btn-bookmark");
      expect(htmlStr).toContain("task-list-item__due-date");
    });
  });
});
