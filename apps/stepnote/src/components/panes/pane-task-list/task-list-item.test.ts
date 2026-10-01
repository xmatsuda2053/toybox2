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
 *
 * 4. ユーザーインタラクションとカスタムイベント発火
 *    - 4-1. アイテム本体のクリック時に task-select カスタムイベント（detail: { taskId }）がディスパッチされること
 *    - 4-2. ブックマークボタンのクリック時に event.stopPropagation() が実行され、bookmark-toggle カスタムイベント（detail: { taskId, currentBookmark }）がディスパッチされること
 *
 * 5. BEM設計およびSCSSスタイルの検証
 *    - 5-1. SCSSスタイルシート（task-list-item.scss）が存在し、ルートブロック .task-list-item および主要BEMセレクタが定義されていること
 *    - 5-2. テーマ切替トランジション等のCSS変数指定（var(--stepnote-transition-theme)）が定義されていること
 *    - 5-3. 垂直ディバイダー（.task-list-item__divider）に選択時でも視認可能なカラー（--wa-color-text-quiet）と高さが定義されていること
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
  });
});
